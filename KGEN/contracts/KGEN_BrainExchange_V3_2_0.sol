// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * KGEN_BrainExchange_V3_2_0.sol
 * 11520｜花果山台灣・悟空大腦交易所（BrainExchange）
 *
 * Spec (from user):
 * - 接收 KGEN Token 的 Reward 稅流 0.05%（Token.rewardWallet 指到本合約）
 * - 保證金質押（deposit/withdraw）
 * - 每月發薪（rollPayroll）：拆分盈餘
 *   - marginBps: 分給保證金池（accRewardPerShare, pull-claim）
 *   - marsBps  : 轉給 MarsSeats 並 notifyReward
 *   - publicGoodBps: 轉給公益庫
 *   - rest：留在 Brain，可 sweepToTreasury
 * - supplyHeart：手動/守門人補血到 TempleHeart
 * - Config lock：上鏈後可鎖參數
 *
 * Notes:
 * - Solidity 無法自動排程：rollPayroll 需由你/守門人呼叫
 * - depositMargin 需要先 approve
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
        require(ok && (data.length == 0 || abi.decode(data,(bool))), "SAFE_TRANSFER_FAILED");
    }
    function safeTransferFrom(IERC20 token, address from, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = address(token).call(
            abi.encodeWithSelector(token.transferFrom.selector, from, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data,(bool))), "SAFE_TRANSFER_FROM_FAILED");
    }
}

abstract contract OwnableLite {
    address public owner;
    event OwnershipTransferred(address indexed prev, address indexed next);
    modifier onlyOwner(){ require(msg.sender==owner,"ONLY_OWNER"); _; }
    constructor(){ owner=msg.sender; emit OwnershipTransferred(address(0), msg.sender); }
    function transferOwnership(address n) external onlyOwner {
        require(n!=address(0),"ZERO_ADDR");
        emit OwnershipTransferred(owner,n);
        owner=n;
    }
}

abstract contract ReentrancyGuardLite {
    uint256 private _l=1;
    modifier nonReentrant(){ require(_l==1,"REENTRANCY"); _l=2; _; _l=1; }
}

interface IMarsSeats {
    function notifyReward(uint256 amountWei) external;
}

contract KGEN_BrainExchange_V3_2_0 is OwnableLite, ReentrancyGuardLite {
    using SafeERC20Lite for IERC20;

    // ===== Core =====
    IERC20 public immutable kgen;

    address public treasury;            // 留存/金庫（可設多簽）
    address public publicGoodTreasury;  // 公益庫
    address public templeHeart;         // 12345 心臟
    address public marsSeats;           // 108000 MarsSeats 合約

    // ===== Config lock =====
    bool public configLocked;
    modifier whenUnlocked(){ require(!configLocked, "CONFIG_LOCKED"); _; }
    event ConfigLocked();

    // ===== Keeper (守門人) =====
    mapping(address => bool) public isKeeper;
    event KeeperSet(address indexed keeper, bool enabled);

    modifier onlyOwnerOrKeeper() {
        require(msg.sender == owner || isKeeper[msg.sender], "ONLY_OWNER_OR_KEEPER");
        _;
    }

    // ===== Split bps (sum <= 10000, rest stays in Brain) =====
    uint16 public marginBps     = 5000; // 50%
    uint16 public marsBps       = 2500; // 25%
    uint16 public publicGoodBps = 500;  // 5%
    event SplitsSet(uint16 marginBps, uint16 marsBps, uint16 publicGoodBps);

    // ===== “腦容量”警戒顯示（不做硬 revert） =====
    uint256 public brainCapacityWhole = 50_000_000;
    event CapacitySet(uint256 capacityWhole);

    // ===== Margin staking accounting =====
    uint256 public totalMargin; // staked principal (token decimals)
    mapping(address => uint256) public marginOf;

    uint256 public accRewardPerShare; // scaled by 1e18
    mapping(address => uint256) public rewardDebt;

    event MarginDeposited(address indexed user, uint256 amountWei);
    event MarginWithdrawn(address indexed user, uint256 amountWei);
    event MarginClaimed(address indexed user, uint256 amountWei);

    // ===== Payroll schedule =====
    uint256 public nextPayrollAt;
    uint256 public payrollInterval = 30 days;
    event PayrollSet(uint256 nextPayrollAt, uint256 payrollInterval);
    event PayrollRolled(
        uint256 indexed whenTs,
        uint256 distributableWei,
        uint256 marginPortionWei,
        uint256 marsPortionWei,
        uint256 publicGoodPortionWei
    );

    // ===== Events =====
    event TreasurySet(address indexed treasury);
    event PublicGoodTreasurySet(address indexed t);
    event TempleHeartSet(address indexed heart);
    event MarsSeatsSet(address indexed mars);

    event SweptToTreasury(address indexed to, uint256 amountWei);
    event HeartSupplied(address indexed heart, uint256 amountWei);

    // ===== Constructor =====
    constructor(address token, address _treasury, uint256 _nextPayrollAt) {
        require(token != address(0) && _treasury != address(0), "ZERO_ADDR");
        kgen = IERC20(token);
        treasury = _treasury;

        // allow 0 to set later, but recommended to pass a proper timestamp
        nextPayrollAt = _nextPayrollAt;
    }

    // ===== Admin / Config =====
    function setKeeper(address k, bool enabled) external onlyOwner whenUnlocked {
        require(k != address(0), "ZERO_ADDR");
        isKeeper[k] = enabled;
        emit KeeperSet(k, enabled);
    }

    function setTreasury(address t) external onlyOwner whenUnlocked {
        require(t!=address(0), "ZERO_ADDR");
        treasury = t;
        emit TreasurySet(t);
    }

    function setPublicGoodTreasury(address t) external onlyOwner whenUnlocked {
        require(t!=address(0), "ZERO_ADDR");
        publicGoodTreasury = t;
        emit PublicGoodTreasurySet(t);
    }

    function setTempleHeart(address h) external onlyOwner whenUnlocked {
        require(h!=address(0), "ZERO_ADDR");
        templeHeart = h;
        emit TempleHeartSet(h);
    }

    function setMarsSeats(address m) external onlyOwner whenUnlocked {
        require(m!=address(0), "ZERO_ADDR");
        marsSeats = m;
        emit MarsSeatsSet(m);
    }

    function setSplits(uint16 _marginBps, uint16 _marsBps, uint16 _publicGoodBps) external onlyOwner whenUnlocked {
        require(uint256(_marginBps) + uint256(_marsBps) + uint256(_publicGoodBps) <= 10000, "BPS_SUM");
        // optional: bound mars bps 2000~3000 (20~30%)
        if (_marsBps != 0) {
            require(_marsBps >= 2000 && _marsBps <= 3000, "MARS_BPS_RANGE");
        }
        marginBps = _marginBps;
        marsBps = _marsBps;
        publicGoodBps = _publicGoodBps;
        emit SplitsSet(_marginBps, _marsBps, _publicGoodBps);
    }

    function setCapacityWhole(uint256 capWhole) external onlyOwner whenUnlocked {
        require(capWhole > 0, "CAP_ZERO");
        brainCapacityWhole = capWhole;
        emit CapacitySet(capWhole);
    }

    function setPayroll(uint256 _nextPayrollAt, uint256 _interval) external onlyOwner whenUnlocked {
        require(_interval >= 7 days, "INTERVAL_SMALL");
        nextPayrollAt = _nextPayrollAt;
        payrollInterval = _interval;
        emit PayrollSet(_nextPayrollAt, _interval);
    }

    function lockConfig() external onlyOwner whenUnlocked {
        configLocked = true;
        emit ConfigLocked();
    }

    // ===== Margin pool =====
    function pendingProfit(address u) public view returns (uint256) {
        uint256 user = marginOf[u];
        uint256 accum = (user * accRewardPerShare) / 1e18;
        uint256 debt = rewardDebt[u];
        if (accum <= debt) return 0;
        return accum - debt;
    }

    function depositMargin(uint256 amountWei) external nonReentrant {
        require(amountWei > 0, "AMOUNT_ZERO");
        _claim(msg.sender);

        kgen.safeTransferFrom(msg.sender, address(this), amountWei);
        totalMargin += amountWei;
        marginOf[msg.sender] += amountWei;

        rewardDebt[msg.sender] = (marginOf[msg.sender] * accRewardPerShare) / 1e18;
        emit MarginDeposited(msg.sender, amountWei);
    }

    function withdrawMargin(uint256 amountWei) external nonReentrant {
        require(amountWei > 0, "AMOUNT_ZERO");
        require(marginOf[msg.sender] >= amountWei, "INSUFFICIENT");
        _claim(msg.sender);

        marginOf[msg.sender] -= amountWei;
        totalMargin -= amountWei;

        rewardDebt[msg.sender] = (marginOf[msg.sender] * accRewardPerShare) / 1e18;
        kgen.safeTransfer(msg.sender, amountWei);

        emit MarginWithdrawn(msg.sender, amountWei);
    }

    function claimProfit() external nonReentrant {
        _claim(msg.sender);
    }

    function _claim(address u) internal {
        uint256 p = pendingProfit(u);
        // update debt first (safe if transfer reverts)
        rewardDebt[u] = (marginOf[u] * accRewardPerShare) / 1e18;

        if (p > 0) {
            // ensure we never pay out principal: payout comes from balance anyway
            kgen.safeTransfer(u, p);
            emit MarginClaimed(u, p);
        }
    }

    // ===== Payroll / Split =====
    function rollPayroll() external nonReentrant {
        require(nextPayrollAt != 0, "PAYROLL_NOT_SET");
        require(block.timestamp >= nextPayrollAt, "NOT_YET");

        nextPayrollAt = nextPayrollAt + payrollInterval;

        uint256 bal = kgen.balanceOf(address(this));

        // principal is protected
        uint256 distributable = 0;
        if (bal > totalMargin) distributable = bal - totalMargin;

        if (distributable == 0) {
            emit PayrollRolled(block.timestamp, 0, 0, 0, 0);
            return;
        }

        uint256 marginPortion = (distributable * marginBps) / 10000;
        uint256 marsPortion   = (distributable * marsBps) / 10000;
        uint256 publicGoodPortion = (distributable * publicGoodBps) / 10000;

        // Margin -> accRewardPerShare
        if (marginPortion > 0 && totalMargin > 0) {
            accRewardPerShare += (marginPortion * 1e18) / totalMargin;
        }

        // PublicGood
        if (publicGoodPortion > 0 && publicGoodTreasury != address(0)) {
            kgen.safeTransfer(publicGoodTreasury, publicGoodPortion);
        }

        // MarsSeats: transfer then notify
        if (marsPortion > 0 && marsSeats != address(0)) {
            kgen.safeTransfer(marsSeats, marsPortion);
            IMarsSeats(marsSeats).notifyReward(marsPortion);
        }

        emit PayrollRolled(block.timestamp, distributable, marginPortion, marsPortion, publicGoodPortion);
    }

    // ===== Heart supply / Treasury ops =====
    function supplyHeart(uint256 amountWei) external onlyOwnerOrKeeper nonReentrant {
        require(templeHeart != address(0), "HEART_NOT_SET");
        require(amountWei > 0, "AMOUNT_ZERO");
        kgen.safeTransfer(templeHeart, amountWei);
        emit HeartSupplied(templeHeart, amountWei);
    }

    function sweepToTreasury(uint256 amountWei) external onlyOwner nonReentrant {
        require(amountWei > 0, "AMOUNT_ZERO");
        require(treasury != address(0), "TREASURY_NOT_SET");
        kgen.safeTransfer(treasury, amountWei);
        emit SweptToTreasury(treasury, amountWei);
    }

    // ===== UI Helpers =====
    function decimals() external view returns (uint8) { return kgen.decimals(); }
    function brainBalance() external view returns (uint256) { return kgen.balanceOf(address(this)); }
}
