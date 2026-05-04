// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * KGEN_TempleHeart_V3_2_3.sol
 * 五指山 12345｜悟空財神殿（Heart）
 *
 * V3.2.3（單線定稿｜Heart ↔ 11520 Brain 循環版）
 * - 心臟只對接「11520 花果山台灣交易所 / 悟空大腦（Brain）」作為循環血庫
 * - 不再以 orphanPool 作為心臟循環血庫（公益池改由 Brain 的盈餘機制再撥 5%）
 *
 * 本合約提供「鏈上動作」與「防呆天條」：
 * - 發財金 fortuneClaim（30 天冷卻、每 epoch 500 名上限可開關）
 * - 心跳 heartbeatClaim（整點/每小時冷卻：預設 1 小時）
 * - 轉日點火 igniteAndClaim（UTC 00:00–00:10 每日一次）
 * - 還願 vowTo（transferFrom 補血）
 * - 許願 makeWish（只上鏈 hash）
 * - 點燈 lightLamp（transferFrom）
 *
 * 重要：
 * - Solidity 無法自動排程；「滿血回流」與「缺血補血」需由人/前端/守門人腳本呼叫。
 * - Heart 從 Brain 補血採 transferFrom(Brain->Heart)，Brain 必須先對 Heart 做 approve。
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
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
            abi.encodeWithSelector(token.transferFrom.selector, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "SAFE_TRANSFER_FROM_FAILED");
    }
}

abstract contract OwnableLite {
    address public owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ZERO_ADDR");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

abstract contract ReentrancyGuardLite {
    uint256 private _locked = 1;
    modifier nonReentrant() {
        require(_locked == 1, "REENTRANCY");
        _locked = 2;
        _;
        _locked = 1;
    }
}

contract KGEN_TempleHeart_V3_2_3 is OwnableLite, ReentrancyGuardLite {
    using SafeERC20Lite for IERC20;

    // ====== Config Lock (防呆天條) ======
    bool public configLocked;
    event ConfigLocked();
    modifier whenUnlocked() { require(!configLocked, "CONFIG_LOCKED"); _; }

    // ====== Core Token ======
    IERC20 public kgen; // KGEN token
    event TokenSet(address indexed token);

    // ====== 11520 Brain Vault (交易所/悟空大腦) ======
    address public brainVault;
    event BrainVaultSet(address indexed brainVault);

    // ====== (占位) Organs：本版不強制使用 ======
    address public lingxiaoBank;  // 18888
    address public marsVault;     // Mars/KUFO
    address public autoLP;        // 斬妖台
    address public blackhole;     // 往生
    event OrgansSet(address indexed lingxiaoBank, address indexed marsVault, address indexed autoLP, address blackhole);

    // ====== Growth Params (演算法長大) ======
    // capWhole = clamp(baseCapWhole + brainBalanceWhole * capBps / 10000, min=baseCapWhole, max=maxCapWhole)
    // floorWhole = clamp(baseFloorWhole + brainBalanceWhole * floorBps / 10000, min=0, max=capWhole)
    uint256 public baseCapWhole = 108000;
    uint256 public maxCapWhole  = 7200000;
    uint256 public capBps       = 0;       // 預設 0（先穩；要跟 Brain 連動再開，例如 500=5%）
    uint256 public baseFloorWhole = 20000;
    uint256 public floorBps       = 0;     // 預設 0（先穩；要跟 Brain 連動再開）
    event GrowthParamsSet(uint256 baseCapWhole, uint256 maxCapWhole, uint256 capBps, uint256 baseFloorWhole, uint256 floorBps);

    // ====== Rewards / Rules ======
    uint256 public fortuneMin = 1;
    uint256 public fortuneMax = 888;
    uint256 public fortuneCooldownSeconds = 30 days;
    uint256 public fortuneEpochSeconds = 30 days;
    uint256 public fortuneEpochMaxClaims = 500;
    bool public fortuneCapEnabled = true;

    uint256 public heartbeatCooldownSeconds = 1 hours;

    // ignite window in UTC seconds of day
    uint256 public igniteWindowStart = 0;   // 00:00:00 UTC
    uint256 public igniteWindowEnd   = 600; // 00:10:00 UTC

    uint256 public heartbeatReward = 1; // 每小時 1 KGEN
    uint256 public igniteReward    = 8; // 轉日 8 KGEN

    uint256 public lampPricePerDay = 1;

    event RulesUpdated();

    // ====== State ======
    mapping(address => uint256) public lastFortuneAt;
    mapping(address => uint256) public lastHeartbeatAt;
    mapping(address => uint256) public lastIgniteDay;
    mapping(address => uint256) public lampExpireAt;
    mapping(uint256 => uint256) public fortuneEpochClaims;

    // ====== Events ======
    event FortuneClaimed(address indexed user, uint256 amount, uint256 indexed epochIndex);
    event HeartbeatClaimed(address indexed user, uint256 reward);
    event IgniteClaimed(address indexed user, uint256 reward, uint256 indexed dayIndex);
    event Vowed(address indexed user, uint8 option, uint256 amount);
    event LampLit(address indexed user, uint256 daysAdded, uint256 paid, uint256 newExpireAt);
    event WishMade(address indexed user, bytes32 wishHash);

    // 血液循環事件（Heart ↔ Brain）
    event BloodInjectedFromBrain(address indexed brainVault, uint256 amount);
    event ExcessSweptToBrain(address indexed brainVault, uint256 excess, uint256 capAmount);
    event AutoRefilledFromBrain(address indexed brainVault, uint256 needAmount, uint256 floorWhole, uint256 capWhole);

    // ====== Admin ======
    function setToken(address token) external onlyOwner whenUnlocked {
        require(token != address(0), "ZERO_ADDR");
        kgen = IERC20(token);
        emit TokenSet(token);
    }

    function setBrainVault(address vault) external onlyOwner whenUnlocked {
        require(vault != address(0), "ZERO_ADDR");
        brainVault = vault;
        emit BrainVaultSet(vault);
    }

    function setOrgans(address _lingxiaoBank, address _marsVault, address _autoLP, address _blackhole)
        external onlyOwner whenUnlocked
    {
        lingxiaoBank = _lingxiaoBank;
        marsVault = _marsVault;
        autoLP = _autoLP;
        blackhole = _blackhole;
        emit OrgansSet(_lingxiaoBank, _marsVault, _autoLP, _blackhole);
    }

    function setGrowthParams(
        uint256 _baseCapWhole,
        uint256 _maxCapWhole,
        uint256 _capBps,
        uint256 _baseFloorWhole,
        uint256 _floorBps
    ) external onlyOwner whenUnlocked {
        require(_baseCapWhole > 0, "BASE_CAP_ZERO");
        require(_maxCapWhole >= _baseCapWhole, "MAX_CAP_BAD");
        require(_capBps <= 5000, "CAP_BPS_TOO_HIGH");     // 上限 50%
        require(_floorBps <= 5000, "FLOOR_BPS_TOO_HIGH"); // 上限 50%
        require(_baseFloorWhole <= _maxCapWhole, "FLOOR_GT_MAXCAP");

        baseCapWhole = _baseCapWhole;
        maxCapWhole  = _maxCapWhole;
        capBps       = _capBps;
        baseFloorWhole = _baseFloorWhole;
        floorBps       = _floorBps;

        emit GrowthParamsSet(_baseCapWhole, _maxCapWhole, _capBps, _baseFloorWhole, _floorBps);
    }

    function setRules(
        uint256 _fortuneMin,
        uint256 _fortuneMax,
        uint256 _fortuneCooldownSeconds,
        uint256 _fortuneEpochSeconds,
        uint256 _fortuneEpochMaxClaims,
        bool _fortuneCapEnabled,
        uint256 _heartbeatCooldownSeconds,
        uint256 _igniteWindowStart,
        uint256 _igniteWindowEnd,
        uint256 _heartbeatReward,
        uint256 _igniteReward,
        uint256 _lampPricePerDay
    ) external onlyOwner whenUnlocked {
        require(_fortuneMin > 0 && _fortuneMax >= _fortuneMin, "FORTUNE_RANGE");
        require(_fortuneCooldownSeconds >= 1 hours, "FORTUNE_COOLDOWN_TOO_SMALL");
        require(_fortuneEpochSeconds >= 7 days, "EPOCH_TOO_SMALL");
        require(_igniteWindowEnd > _igniteWindowStart && _igniteWindowEnd <= 86400, "IGNITE_WINDOW_BAD");
        require(_heartbeatCooldownSeconds >= 10 minutes, "HEARTBEAT_TOO_SMALL");
        require(_lampPricePerDay > 0, "LAMP_PRICE_ZERO");

        fortuneMin = _fortuneMin;
        fortuneMax = _fortuneMax;
        fortuneCooldownSeconds = _fortuneCooldownSeconds;
        fortuneEpochSeconds = _fortuneEpochSeconds;
        fortuneEpochMaxClaims = _fortuneEpochMaxClaims;
        fortuneCapEnabled = _fortuneCapEnabled;

        heartbeatCooldownSeconds = _heartbeatCooldownSeconds;
        igniteWindowStart = _igniteWindowStart;
        igniteWindowEnd = _igniteWindowEnd;

        heartbeatReward = _heartbeatReward;
        igniteReward = _igniteReward;

        lampPricePerDay = _lampPricePerDay;

        emit RulesUpdated();
    }

    function lockConfig() external onlyOwner whenUnlocked {
        configLocked = true;
        emit ConfigLocked();
    }

    // ====== Internal helpers ======
    function _scale(uint256 wholeTokens) internal view returns (uint256) {
        uint8 d = kgen.decimals();
        return wholeTokens * (10 ** uint256(d));
    }

    function _descale(uint256 amount) internal view returns (uint256) {
        uint8 d = kgen.decimals();
        return amount / (10 ** uint256(d));
    }

    function currentDayIndex() public view returns (uint256) { return block.timestamp / 1 days; }
    function currentFortuneEpochIndex() public view returns (uint256) { return block.timestamp / fortuneEpochSeconds; }
    function timeOfDaySeconds() public view returns (uint256) { return block.timestamp % 1 days; }

    // ====== Growth views (based on Brain balance) ======
    function brainBalance() public view returns (uint256) {
        if (brainVault == address(0) || address(kgen) == address(0)) return 0;
        return kgen.balanceOf(brainVault);
    }

    function brainBalanceWhole() public view returns (uint256) {
        if (brainVault == address(0) || address(kgen) == address(0)) return 0;
        return _descale(kgen.balanceOf(brainVault));
    }

    function effectiveCapWhole() public view returns (uint256) {
        uint256 cap = baseCapWhole;
        if (capBps > 0 && brainVault != address(0) && address(kgen) != address(0)) {
            uint256 bb = brainBalanceWhole();
            cap = baseCapWhole + (bb * capBps) / 10000;
        }
        if (cap < baseCapWhole) cap = baseCapWhole;
        if (cap > maxCapWhole) cap = maxCapWhole;
        return cap;
    }

    function effectiveFloorWhole() public view returns (uint256) {
        uint256 floor = baseFloorWhole;
        uint256 cap = effectiveCapWhole();
        if (floorBps > 0 && brainVault != address(0) && address(kgen) != address(0)) {
            uint256 bb = brainBalanceWhole();
            floor = baseFloorWhole + (bb * floorBps) / 10000;
        }
        if (floor > cap) floor = cap;
        return floor;
    }

    function heartBalance() public view returns (uint256) {
        if (address(kgen) == address(0)) return 0;
        return kgen.balanceOf(address(this));
    }

    function heartBalanceWhole() public view returns (uint256) {
        if (address(kgen) == address(0)) return 0;
        return _descale(kgen.balanceOf(address(this)));
    }

    // ====== Funding Ops (需外部呼叫) ======

    /// @notice 從 Brain 補血：Brain 需先 approve Heart
    function injectFromBrain(uint256 amountWhole) external nonReentrant {
        require(brainVault != address(0), "BRAIN_NOT_SET");
        require(address(kgen) != address(0), "TOKEN_NOT_SET");
        require(amountWhole > 0, "AMOUNT_ZERO");
        uint256 amount = _scale(amountWhole);
        kgen.safeTransferFrom(brainVault, address(this), amount);
        emit BloodInjectedFromBrain(brainVault, amount);
    }

    /// @notice 心臟超過 cap 時，把多餘血量回存 Brain（任何人可呼叫，避免卡住）
    function sweepExcessToBrain() external nonReentrant {
        require(brainVault != address(0), "BRAIN_NOT_SET");
        require(address(kgen) != address(0), "TOKEN_NOT_SET");

        uint256 capWhole = effectiveCapWhole();
        uint256 capAmount = _scale(capWhole);
        uint256 bal = kgen.balanceOf(address(this));
        if (bal > capAmount) {
            uint256 excess = bal - capAmount;
            kgen.safeTransfer(brainVault, excess);
            emit ExcessSweptToBrain(brainVault, excess, capAmount);
        } else {
            emit ExcessSweptToBrain(brainVault, 0, capAmount);
        }
    }

    /// @notice 自動補血：若心臟低於 floor，向 Brain 拉回到 floor（Brain 需先 approve Heart）
    function autoRefillFromBrain() external nonReentrant {
        require(brainVault != address(0), "BRAIN_NOT_SET");
        require(address(kgen) != address(0), "TOKEN_NOT_SET");

        uint256 floorWhole = effectiveFloorWhole();
        uint256 capWhole   = effectiveCapWhole();
        uint256 hbWhole    = heartBalanceWhole();

        if (hbWhole >= floorWhole) {
            emit AutoRefilledFromBrain(brainVault, 0, floorWhole, capWhole);
            return;
        }

        uint256 needWhole = floorWhole - hbWhole;

        // 不能補到超過 cap
        if (hbWhole + needWhole > capWhole) {
            needWhole = capWhole - hbWhole;
        }

        uint256 needAmount = _scale(needWhole);
        kgen.safeTransferFrom(brainVault, address(this), needAmount);

        emit AutoRefilledFromBrain(brainVault, needAmount, floorWhole, capWhole);
    }

    /// @notice Owner 緊急清掃（不建議常用）
    function sweepToken(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "ZERO_ADDR");
        IERC20(token).transfer(to, amount);
    }

    // ====== Temple Actions ======

    function fortuneClaim(uint256 amountWhole) external nonReentrant {
        require(address(kgen) != address(0), "TOKEN_NOT_SET");
        require(amountWhole >= fortuneMin && amountWhole <= fortuneMax, "FORTUNE_OUT_OF_RANGE");

        require(block.timestamp >= lastFortuneAt[msg.sender] + fortuneCooldownSeconds, "FORTUNE_COOLDOWN");
        lastFortuneAt[msg.sender] = block.timestamp;

        uint256 epochIndex = currentFortuneEpochIndex();
        if (fortuneCapEnabled) {
            require(fortuneEpochClaims[epochIndex] < fortuneEpochMaxClaims, "FORTUNE_EPOCH_FULL");
            fortuneEpochClaims[epochIndex] += 1;
        }

        uint256 amount = _scale(amountWhole);
        require(kgen.balanceOf(address(this)) >= amount, "HEART_INSUFFICIENT_FUNDS");
        kgen.safeTransfer(msg.sender, amount);

        emit FortuneClaimed(msg.sender, amount, epochIndex);
    }

    function heartbeatClaim() external nonReentrant {
        require(address(kgen) != address(0), "TOKEN_NOT_SET");
        require(block.timestamp >= lastHeartbeatAt[msg.sender] + heartbeatCooldownSeconds, "HEARTBEAT_COOLDOWN");
        lastHeartbeatAt[msg.sender] = block.timestamp;

        uint256 reward = heartbeatReward;
        if (reward > 0) {
            uint256 amount = _scale(reward);
            require(kgen.balanceOf(address(this)) >= amount, "HEART_INSUFFICIENT_FUNDS");
            kgen.safeTransfer(msg.sender, amount);
        }

        emit HeartbeatClaimed(msg.sender, reward);
    }

    function igniteAndClaim() external nonReentrant {
        require(address(kgen) != address(0), "TOKEN_NOT_SET");

        uint256 tod = timeOfDaySeconds();
        require(tod >= igniteWindowStart && tod <= igniteWindowEnd, "IGNITE_OUT_OF_WINDOW");

        uint256 dayIndex = currentDayIndex();
        require(lastIgniteDay[msg.sender] != dayIndex, "IGNITE_ALREADY_TODAY");
        lastIgniteDay[msg.sender] = dayIndex;

        uint256 reward = igniteReward;
        if (reward > 0) {
            uint256 amount = _scale(reward);
            require(kgen.balanceOf(address(this)) >= amount, "HEART_INSUFFICIENT_FUNDS");
            kgen.safeTransfer(msg.sender, amount);
        }

        emit IgniteClaimed(msg.sender, reward, dayIndex);
    }

    /// @notice 還願：捐入 KGEN（補血）直接進 Heart
    function vowTo(uint8 option, uint256 amountWhole) external nonReentrant {
        require(address(kgen) != address(0), "TOKEN_NOT_SET");
        require(amountWhole > 0, "AMOUNT_ZERO");
        uint256 amount = _scale(amountWhole);

        kgen.safeTransferFrom(msg.sender, address(this), amount);

        emit Vowed(msg.sender, option, amount);
    }

    function lightLamp(uint256 daysToAdd) external nonReentrant {
        require(address(kgen) != address(0), "TOKEN_NOT_SET");
        require(daysToAdd > 0 && daysToAdd <= 3650, "DAYS_BAD");

        uint256 payWhole = lampPricePerDay * daysToAdd;
        uint256 pay = _scale(payWhole);

        kgen.safeTransferFrom(msg.sender, address(this), pay);

        uint256 base = lampExpireAt[msg.sender];
        if (base < block.timestamp) base = block.timestamp;
        uint256 newExpire = base + (daysToAdd * 1 days);
        lampExpireAt[msg.sender] = newExpire;

        emit LampLit(msg.sender, daysToAdd, pay, newExpire);
    }

    function makeWish(bytes32 wishHash) external {
        require(wishHash != bytes32(0), "HASH_ZERO");
        emit WishMade(msg.sender, wishHash);
    }
}
