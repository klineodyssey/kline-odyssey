// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * KGEN_LingxiaoDeityBank_V1_0_1.sol
 * 18888｜靈霄寶殿・玉帝神明銀行（Deity Bank）
 *
 * 定案規則：
 * - VaultCap: 50,000,000 KGEN
 * - 神明門檻: >= 100,000 KGEN 才能分紅
 * - 分紅：Pull Claim（自己領）
 * - 發薪：每月 5 日（UTC）進入可結算窗口；需外部呼叫 finalizeMonthWithAmount()
 * - 提早下凡（未滿鎖期）扣 5% 本金：可分流到 11520 / 12345 / 公益池
 *
 * 注意：
 * - Solidity 無排程：5 日只是「允許結算」窗口；需守門人/人呼叫
 * - 本合約可作為 0.1% 稅收接收地址（Token 稅接收端指向此合約）
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from,address to,uint256 amount) external returns (bool);
    function balanceOf(address who) external view returns (uint256);
    function decimals() external view returns (uint8);
}

library SafeERC20Lite {
    function safeTransfer(IERC20 token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = address(token).call(
            abi.encodeWithSelector(token.transfer.selector, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "SAFE_TRANSFER_FAILED");
    }
    function safeTransferFrom(IERC20 token, address from, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = address(token).call(
            abi.encodeWithSelector(token.transferFrom.selector, from, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "SAFE_TRANSFER_FROM_FAILED");
    }
}

abstract contract OwnableLite {
    address public owner;
    event OwnershipTransferred(address indexed prev, address indexed next);
    modifier onlyOwner(){ require(msg.sender==owner,"ONLY_OWNER"); _; }
    constructor(){ owner=msg.sender; emit OwnershipTransferred(address(0), msg.sender); }
    function transferOwnership(address next) external onlyOwner {
        require(next!=address(0),"ZERO_ADDR");
        emit OwnershipTransferred(owner, next);
        owner = next;
    }
}

abstract contract ReentrancyGuardLite {
    uint256 private _locked=1;
    modifier nonReentrant(){
        require(_locked==1,"REENTRANCY");
        _locked=2; _;
        _locked=1;
    }
}

contract KGEN_LingxiaoDeityBank_V1_0_1 is OwnableLite, ReentrancyGuardLite {
    using SafeERC20Lite for IERC20;

    // ===== Token =====
    IERC20 public kgen;
    event TokenSet(address indexed token);

    // ===== Config Lock =====
    bool public configLocked;
    modifier whenUnlocked(){ require(!configLocked,"CONFIG_LOCKED"); _; }
    event ConfigLocked();

    // ===== Keeper (守門人) =====
    mapping(address => bool) public isKeeper;
    event KeeperSet(address indexed keeper, bool enabled);
    modifier onlyOwnerOrKeeper() {
        require(msg.sender == owner || isKeeper[msg.sender], "ONLY_OWNER_OR_KEEPER");
        _;
    }

    // ===== Config =====
    uint256 public constant VAULT_CAP_WHOLE = 50_000_000; // 5000萬
    uint256 public minDeityDepositWhole = 100_000;        // 10萬
    uint256 public lockTermSeconds = 30 days;             // 鎖期（可調）
    uint256 public earlyPenaltyBps = 500;                 // 5% = 500 bps

    // 提早下凡罰款分流（可改）
    address public brain11520;
    address public heart12345;
    address public publicGood;

    // 罰款分流比（bps，總和=10000；針對 penalty 本身做分配）
    uint256 public penaltyToBrainBps = 4000; // 40% of penalty
    uint256 public penaltyToHeartBps = 4000; // 40% of penalty
    uint256 public penaltyToGoodBps  = 2000; // 20% of penalty
    event AddressesSet(address indexed brain11520, address indexed heart12345, address indexed publicGood);
    event ParamsSet(uint256 minDeityDepositWhole, uint256 lockTermSeconds, uint256 earlyPenaltyBps);
    event PenaltySplitSet(uint256 toBrainBps, uint256 toHeartBps, uint256 toGoodBps);

    // ===== Month / Payroll =====
    mapping(uint256 => bool) public monthFinalized;      // yyyymm => done
    mapping(uint256 => uint256) public monthRewardPool;  // yyyymm => amountWei used for that month
    uint256 public accRewardPerDeityStakeE18;            // cumulative per-stake reward (scaled 1e18)

    // ===== Stake State =====
    struct StakeInfo {
        uint256 principal;   // smallest unit
        uint256 startAt;     // lock start
        uint256 rewardDebt;  // accounting
        bool isDeity;        // >= threshold
    }

    mapping(address => StakeInfo) public stakeOf;

    uint256 public totalPrincipalAll; // 全體本金總和（smallest unit）
    uint256 public totalDeityStake;   // 神明本金總和（smallest unit）

    // ===== Events =====
    event Deposited(address indexed user, uint256 amountWei);
    event Withdrawn(address indexed user, uint256 amountWei, uint256 penaltyWei, bool early);
    event MonthFinalized(uint256 indexed yyyymm, uint256 rewardAddedWei, uint256 newAccE18);
    event Claimed(address indexed user, uint256 amountWei);

    // ===== Admin =====
    function setToken(address token) external onlyOwner whenUnlocked {
        require(token!=address(0),"ZERO_ADDR");
        kgen = IERC20(token);
        emit TokenSet(token);
    }

    function setKeeper(address k, bool enabled) external onlyOwner whenUnlocked {
        require(k != address(0), "ZERO_ADDR");
        isKeeper[k] = enabled;
        emit KeeperSet(k, enabled);
    }

    function setAddresses(address _brain11520, address _heart12345, address _publicGood) external onlyOwner whenUnlocked {
        brain11520 = _brain11520;
        heart12345 = _heart12345;
        publicGood = _publicGood;
        emit AddressesSet(_brain11520, _heart12345, _publicGood);
    }

    function setParams(uint256 _minDeityDepositWhole, uint256 _lockTermSeconds, uint256 _earlyPenaltyBps) external onlyOwner whenUnlocked {
        require(_minDeityDepositWhole >= 100_000, "MIN_TOO_SMALL"); // 至少10萬
        require(_earlyPenaltyBps <= 1000, "PENALTY_TOO_HIGH");      // 最多10%
        require(_lockTermSeconds >= 7 days, "LOCK_TOO_SHORT");      // 最短7天
        minDeityDepositWhole = _minDeityDepositWhole;
        lockTermSeconds = _lockTermSeconds;
        earlyPenaltyBps = _earlyPenaltyBps;
        emit ParamsSet(_minDeityDepositWhole, _lockTermSeconds, _earlyPenaltyBps);
    }

    function setPenaltySplit(uint256 toBrainBps, uint256 toHeartBps, uint256 toGoodBps) external onlyOwner whenUnlocked {
        require(toBrainBps + toHeartBps + toGoodBps == 10000, "SPLIT_SUM_BAD");
        penaltyToBrainBps = toBrainBps;
        penaltyToHeartBps = toHeartBps;
        penaltyToGoodBps  = toGoodBps;
        emit PenaltySplitSet(toBrainBps, toHeartBps, toGoodBps);
    }

    function lockConfig() external onlyOwner whenUnlocked {
        configLocked = true;
        emit ConfigLocked();
    }

    // ===== Helpers =====
    function _scaleWhole(uint256 whole) internal view returns (uint256) {
        uint8 d = kgen.decimals();
        return whole * (10 ** uint256(d));
    }

    function vaultCapAmount() public view returns (uint256) {
        require(address(kgen)!=address(0),"TOKEN_NOT_SET");
        return _scaleWhole(VAULT_CAP_WHOLE);
    }

    function vaultBalance() public view returns (uint256) {
        return address(kgen)==address(0) ? 0 : kgen.balanceOf(address(this));
    }

    function currentYYYYMM() public view returns (uint256) {
        (uint256 y, uint256 m, ) = _utcDate(block.timestamp);
        return y * 100 + m;
    }

    function isPaydayWindowUTC() public view returns (bool) {
        (, , uint256 d) = _utcDate(block.timestamp);
        return d >= 5;
    }

    function isDeityNow(uint256 principalWei) public view returns (bool) {
        return principalWei >= _scaleWhole(minDeityDepositWhole);
    }

    // ===== Core: Deposit/Withdraw =====
    function deposit(uint256 amountWhole) external nonReentrant {
        require(address(kgen)!=address(0),"TOKEN_NOT_SET");
        require(amountWhole>0,"AMOUNT_ZERO");
        uint256 amountWei = _scaleWhole(amountWhole);

        require(vaultBalance() + amountWei <= vaultCapAmount(), "VAULT_FULL");

        _harvest(msg.sender);

        kgen.safeTransferFrom(msg.sender, address(this), amountWei);

        StakeInfo storage s = stakeOf[msg.sender];

        // remove old deity stake from totals if needed
        if (s.isDeity) totalDeityStake -= s.principal;

        s.principal += amountWei;
        totalPrincipalAll += amountWei;

        s.startAt = block.timestamp;
        s.isDeity = isDeityNow(s.principal);

        if (s.isDeity) totalDeityStake += s.principal;

        // update debt to current acc
        s.rewardDebt = (s.principal * accRewardPerDeityStakeE18) / 1e18;

        emit Deposited(msg.sender, amountWei);
    }

    function withdraw(uint256 amountWhole) external nonReentrant {
        require(address(kgen)!=address(0),"TOKEN_NOT_SET");
        require(amountWhole>0,"AMOUNT_ZERO");
        uint256 amountWei = _scaleWhole(amountWhole);

        _harvest(msg.sender);

        StakeInfo storage s = stakeOf[msg.sender];
        require(s.principal >= amountWei, "INSUFFICIENT_PRINCIPAL");

        // remove old deity stake
        if (s.isDeity) totalDeityStake -= s.principal;

        s.principal -= amountWei;
        totalPrincipalAll -= amountWei;

        bool early = (block.timestamp < s.startAt + lockTermSeconds);

        uint256 penaltyWei = 0;
        if (early && earlyPenaltyBps > 0) {
            penaltyWei = (amountWei * earlyPenaltyBps) / 10000;
            _splitPenalty(penaltyWei);
        }

        uint256 payoutWei = amountWei - penaltyWei;
        kgen.safeTransfer(msg.sender, payoutWei);

        // re-evaluate deity
        s.isDeity = isDeityNow(s.principal);
        if (s.isDeity) totalDeityStake += s.principal;

        // update debt
        s.rewardDebt = (s.principal * accRewardPerDeityStakeE18) / 1e18;

        emit Withdrawn(msg.sender, amountWei, penaltyWei, early);
    }

    // ===== Payroll (Month Finalize) =====
    /**
     * @notice 每月 5 日(UTC)起允許；每個 yyyymm 只能 finalize 一次
     * @param yyyymm 例如 202602
     * @param rewardAddedWei 本月要納入分紅的金額（smallest unit / wei）
     *
     * 建議流程（最穩）：
     * 1) 稅流(0.10%)自然進到本合約
     * 2) 每月 5 日後，你/keeper 看要分多少（可 = 本月新增稅收的一部分或全部）
     * 3) 呼叫 finalizeMonthWithAmount(yyyymm, amountWei)
     */
    function finalizeMonthWithAmount(uint256 yyyymm, uint256 rewardAddedWei) external onlyOwnerOrKeeper nonReentrant {
        require(address(kgen)!=address(0),"TOKEN_NOT_SET");
        require(isPaydayWindowUTC(),"NOT_PAYDAY_WINDOW");
        require(!monthFinalized[yyyymm],"MONTH_DONE");
        require(yyyymm <= currentYYYYMM(), "FUTURE_MONTH");
        require(rewardAddedWei > 0, "REWARD_ZERO");
        require(vaultBalance() >= totalPrincipalAll + rewardAddedWei, "BAL_NOT_ENOUGH_FOR_REWARD");

        monthFinalized[yyyymm] = true;
        monthRewardPool[yyyymm] = rewardAddedWei;

        if (totalDeityStake > 0) {
            accRewardPerDeityStakeE18 += (rewardAddedWei * 1e18) / totalDeityStake;
        }

        emit MonthFinalized(yyyymm, rewardAddedWei, accRewardPerDeityStakeE18);
    }

    function claim() external nonReentrant {
        require(address(kgen)!=address(0),"TOKEN_NOT_SET");
        _harvest(msg.sender);
    }

    // ===== Internal reward accounting =====
    function pending(address user) public view returns (uint256) {
        StakeInfo storage s = stakeOf[user];
        if (!s.isDeity || s.principal == 0) return 0;
        uint256 accrued = (s.principal * accRewardPerDeityStakeE18) / 1e18;
        if (accrued <= s.rewardDebt) return 0;
        return accrued - s.rewardDebt;
    }

    function _harvest(address user) internal {
        StakeInfo storage s = stakeOf[user];

        uint256 accrued = (s.principal * accRewardPerDeityStakeE18) / 1e18;
        uint256 owed = 0;

        if (s.isDeity && accrued > s.rewardDebt) {
            owed = accrued - s.rewardDebt;
        }

        s.rewardDebt = accrued;

        if (owed > 0) {
            // 不動用本金：合約餘額需 >= 全體本金 + owed
            require(vaultBalance() >= totalPrincipalAll + owed, "INSUFFICIENT_REWARD_BAL");
            kgen.safeTransfer(user, owed);
            emit Claimed(user, owed);
        }
    }

    function _splitPenalty(uint256 penaltyWei) internal {
        if (penaltyWei == 0) return;

        uint256 toBrain = (brain11520 != address(0)) ? (penaltyWei * penaltyToBrainBps) / 10000 : 0;
        uint256 toHeart = (heart12345 != address(0)) ? (penaltyWei * penaltyToHeartBps) / 10000 : 0;
        uint256 toGood  = (publicGood != address(0)) ? (penaltyWei * penaltyToGoodBps)  / 10000 : 0;

        if (toBrain > 0) kgen.safeTransfer(brain11520, toBrain);
        if (toHeart > 0) kgen.safeTransfer(heart12345, toHeart);
        if (toGood  > 0) kgen.safeTransfer(publicGood, toGood);
        // rounding remainder stays in bank (strengthens vault)
    }

    // ===== UTC date helper =====
    function _utcDate(uint256 ts) internal pure returns (uint256 year, uint256 month, uint256 day) {
        uint256 z = ts / 86400 + 719468;
        uint256 era = z / 146097;
        uint256 doe = z - era * 146097;
        uint256 yoe = (doe - doe/1460 + doe/36524 - doe/146096) / 365;
        year = yoe + era * 400;
        uint256 doy = doe - (365*yoe + yoe/4 - yoe/100);
        uint256 mp = (5*doy + 2) / 153;
        day = doy - (153*mp + 2)/5 + 1;
        month = mp + (mp < 10 ? 3 :  -9);
        year = year + (month <= 2 ? 1 : 0);
    }
}
