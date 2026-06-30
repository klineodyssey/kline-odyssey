// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * KGEN_TempleHeart_V3_2_6.sol
 * 五指山 12345｜悟空財神殿（Heart）
 *
 * V3.2.6（節日守門人編譯修正版｜基於 V3.2.5 型別修正）
 *
 * 保留 V3.2.3 原有功能：
 * - 發財金 fortuneClaim（30 天冷卻、每 epoch 500 名上限可開關）
 * - 心跳 heartbeatClaim（每小時冷卻：預設 1 小時）
 * - 轉日點火 igniteAndClaim（UTC 00:00–00:10 每日一次）
 * - 還願 vowTo（transferFrom 補血，直接回 Heart）
 * - 許願 makeWish（只上鏈 hash）
 * - 點燈 lightLamp（transferFrom）
 * - Brain ↔ Heart 補血 / 回流：injectFromBrain、autoRefillFromBrain、sweepExcessToBrain
 *
 * V3.2.4 新增節日活動：
 * - festivalClaim(1)：5/20 悟空生日，每地址每年一次，預設 5.2 KGEN
 * - festivalClaim(2)：11/11 孤勇日，每地址每年一次，預設 11.1 KGEN
 * - newYearCountdownClaim()：12/31 UTC 23:50~23:59，每地址每分鐘一次，最多 10 次，每次 0.72 KGEN
 *
 * V3.2.6 修正：
 * - 修正 _daysToDate() 的 int256 / uint256 型別混用編譯錯誤。
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
            abi.encodeWithSelector(token.transferFrom.selector, from, to, amount)
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

contract KGEN_TempleHeart_V3_2_6 is OwnableLite, ReentrancyGuardLite {
    using SafeERC20Lite for IERC20;

    bool public configLocked;
    event ConfigLocked();
    modifier whenUnlocked() { require(!configLocked, "CONFIG_LOCKED"); _; }

    IERC20 public kgen;
    event TokenSet(address indexed token);

    address public brainVault;
    event BrainVaultSet(address indexed brainVault);

    address public lingxiaoBank;
    address public marsVault;
    address public autoLP;
    address public blackhole;
    event OrgansSet(address indexed lingxiaoBank, address indexed marsVault, address indexed autoLP, address blackhole);

    uint256 public baseCapWhole = 108000;
    uint256 public maxCapWhole  = 7200000;
    uint256 public capBps       = 0;
    uint256 public baseFloorWhole = 20000;
    uint256 public floorBps       = 0;
    event GrowthParamsSet(uint256 baseCapWhole, uint256 maxCapWhole, uint256 capBps, uint256 baseFloorWhole, uint256 floorBps);

    uint256 public fortuneMin = 1;
    uint256 public fortuneMax = 888;
    uint256 public fortuneCooldownSeconds = 30 days;
    uint256 public fortuneEpochSeconds = 30 days;
    uint256 public fortuneEpochMaxClaims = 500;
    bool public fortuneCapEnabled = true;

    uint256 public heartbeatCooldownSeconds = 1 hours;

    uint256 public igniteWindowStart = 0;
    uint256 public igniteWindowEnd   = 600;

    uint256 public heartbeatReward = 1;
    uint256 public igniteReward    = 8;

    uint256 public lampPricePerDay = 1;

    event RulesUpdated();

    uint256 public wukongBirthdayRewardTenth = 52;
    uint256 public lonelyHeroRewardTenth = 111;
    uint256 public newYearMinuteRewardHundredth = 72;

    uint256 public festivalWindowStart = 0;
    uint256 public festivalWindowEnd   = 600;

    uint256 public newYearWindowStart = 85800;
    uint256 public newYearWindowEnd   = 86400;

    bool public festivalEnabled = true;
    bool public newYearCountdownEnabled = true;

    event FestivalRulesUpdated();
    event FestivalClaimed(address indexed user, uint8 indexed festivalId, uint256 rewardAmount, uint256 indexed year);
    event NewYearCountdownClaimed(address indexed user, uint256 indexed year, uint8 indexed minuteIndex, uint256 rewardAmount);

    mapping(address => uint256) public lastFortuneAt;
    mapping(address => uint256) public lastHeartbeatAt;
    mapping(address => uint256) public lastIgniteDay;
    mapping(address => uint256) public lampExpireAt;
    mapping(uint256 => uint256) public fortuneEpochClaims;

    mapping(uint8 => mapping(uint256 => mapping(address => bool))) public festivalClaimed;
    mapping(uint256 => mapping(address => mapping(uint8 => bool))) public newYearCountdownClaimed;

    event FortuneClaimed(address indexed user, uint256 amount, uint256 indexed epochIndex);
    event HeartbeatClaimed(address indexed user, uint256 reward);
    event IgniteClaimed(address indexed user, uint256 reward, uint256 indexed dayIndex);
    event Vowed(address indexed user, uint8 option, uint256 amount);
    event LampLit(address indexed user, uint256 daysAdded, uint256 paid, uint256 newExpireAt);
    event WishMade(address indexed user, bytes32 wishHash);

    event BloodInjectedFromBrain(address indexed brainVault, uint256 amount);
    event ExcessSweptToBrain(address indexed brainVault, uint256 excess, uint256 capAmount);
    event AutoRefilledFromBrain(address indexed brainVault, uint256 needAmount, uint256 floorWhole, uint256 capWhole);

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
        require(_capBps <= 5000, "CAP_BPS_TOO_HIGH");
        require(_floorBps <= 5000, "FLOOR_BPS_TOO_HIGH");
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

    function setFestivalRules(
        uint256 _wukongBirthdayRewardTenth,
        uint256 _lonelyHeroRewardTenth,
        uint256 _newYearMinuteRewardHundredth,
        uint256 _festivalWindowStart,
        uint256 _festivalWindowEnd,
        uint256 _newYearWindowStart,
        uint256 _newYearWindowEnd,
        bool _festivalEnabled,
        bool _newYearCountdownEnabled
    ) external onlyOwner whenUnlocked {
        require(_festivalWindowEnd > _festivalWindowStart && _festivalWindowEnd <= 86400, "FESTIVAL_WINDOW_BAD");
        require(_newYearWindowEnd > _newYearWindowStart && _newYearWindowEnd <= 86400, "NY_WINDOW_BAD");
        require(_newYearWindowEnd - _newYearWindowStart == 600, "NY_MUST_10_MIN");
        require(_wukongBirthdayRewardTenth > 0, "520_ZERO");
        require(_lonelyHeroRewardTenth > 0, "1111_ZERO");
        require(_newYearMinuteRewardHundredth > 0, "NY_ZERO");

        wukongBirthdayRewardTenth = _wukongBirthdayRewardTenth;
        lonelyHeroRewardTenth = _lonelyHeroRewardTenth;
        newYearMinuteRewardHundredth = _newYearMinuteRewardHundredth;

        festivalWindowStart = _festivalWindowStart;
        festivalWindowEnd = _festivalWindowEnd;
        newYearWindowStart = _newYearWindowStart;
        newYearWindowEnd = _newYearWindowEnd;

        festivalEnabled = _festivalEnabled;
        newYearCountdownEnabled = _newYearCountdownEnabled;

        emit FestivalRulesUpdated();
    }

    function lockConfig() external onlyOwner whenUnlocked {
        configLocked = true;
        emit ConfigLocked();
    }

    function _scale(uint256 wholeTokens) internal view returns (uint256) {
        uint8 d = kgen.decimals();
        return wholeTokens * (10 ** uint256(d));
    }

    function _scaleTenth(uint256 tenthTokens) internal view returns (uint256) {
        uint8 d = kgen.decimals();
        require(d >= 1, "DECIMALS_TOO_LOW");
        return tenthTokens * (10 ** (uint256(d) - 1));
    }

    function _scaleHundredth(uint256 hundredthTokens) internal view returns (uint256) {
        uint8 d = kgen.decimals();
        require(d >= 2, "DECIMALS_TOO_LOW");
        return hundredthTokens * (10 ** (uint256(d) - 2));
    }

    function _descale(uint256 amount) internal view returns (uint256) {
        uint8 d = kgen.decimals();
        return amount / (10 ** uint256(d));
    }

    function currentDayIndex() public view returns (uint256) { return block.timestamp / 1 days; }
    function currentFortuneEpochIndex() public view returns (uint256) { return block.timestamp / fortuneEpochSeconds; }
    function timeOfDaySeconds() public view returns (uint256) { return block.timestamp % 1 days; }
    function currentMinuteIndexOfDay() public view returns (uint256) { return timeOfDaySeconds() / 60; }

    function _daysToDate(uint256 _days) internal pure returns (uint256 year, uint256 month, uint256 day) {
        int256 z = int256(_days) + 719468;
        int256 era = (z >= 0 ? z : z - 146096) / 146097;
        uint256 doe = uint256(z - era * 146097);
        uint256 yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
        int256 y = int256(yoe) + era * 400;
        uint256 doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
        uint256 mp = (5 * doy + 2) / 153;

        day = doy - (153 * mp + 2) / 5 + 1;

        if (mp < 10) {
            month = mp + 3;
        } else {
            month = mp - 9;
        }

        int256 adjust = (month <= 2) ? int256(1) : int256(0);
        year = uint256(y + adjust);
    }

    function currentUtcDate() public view returns (uint256 year, uint256 month, uint256 day) {
        return _daysToDate(block.timestamp / 1 days);
    }

    function _isMonthDay(uint256 m, uint256 d) internal view returns (bool) {
        (, uint256 month, uint256 day) = currentUtcDate();
        return month == m && day == d;
    }

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

    function injectFromBrain(uint256 amountWhole) external nonReentrant {
        require(brainVault != address(0), "BRAIN_NOT_SET");
        require(address(kgen) != address(0), "TOKEN_NOT_SET");
        require(amountWhole > 0, "AMOUNT_ZERO");
        uint256 amount = _scale(amountWhole);
        kgen.safeTransferFrom(brainVault, address(this), amount);
        emit BloodInjectedFromBrain(brainVault, amount);
    }

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

        if (hbWhole + needWhole > capWhole) {
            needWhole = capWhole - hbWhole;
        }

        uint256 needAmount = _scale(needWhole);
        kgen.safeTransferFrom(brainVault, address(this), needAmount);

        emit AutoRefilledFromBrain(brainVault, needAmount, floorWhole, capWhole);
    }

    function sweepToken(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "ZERO_ADDR");
        IERC20(token).transfer(to, amount);
    }

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

    function festivalClaim(uint8 festivalId) external nonReentrant {
        require(address(kgen) != address(0), "TOKEN_NOT_SET");
        require(festivalEnabled, "FESTIVAL_OFF");
        require(festivalId == 1 || festivalId == 2, "FESTIVAL_ID");

        uint256 tod = timeOfDaySeconds();
        require(tod >= festivalWindowStart && tod <= festivalWindowEnd, "FESTIVAL_WINDOW");

        uint256 reward;
        uint256 year;
        uint256 month;
        uint256 day;
        (year, month, day) = currentUtcDate();

        if (festivalId == 1) {
            require(month == 5 && day == 20, "NOT_520");
            reward = _scaleTenth(wukongBirthdayRewardTenth);
        } else {
            require(month == 11 && day == 11, "NOT_1111");
            reward = _scaleTenth(lonelyHeroRewardTenth);
        }

        require(!festivalClaimed[festivalId][year][msg.sender], "FESTIVAL_CLAIMED");
        festivalClaimed[festivalId][year][msg.sender] = true;

        require(kgen.balanceOf(address(this)) >= reward, "HEART_INSUFFICIENT_FUNDS");
        kgen.safeTransfer(msg.sender, reward);

        emit FestivalClaimed(msg.sender, festivalId, reward, year);
    }

    function newYearCountdownClaim() external nonReentrant {
        require(address(kgen) != address(0), "TOKEN_NOT_SET");
        require(newYearCountdownEnabled, "NY_OFF");

        uint256 tod = timeOfDaySeconds();
        require(tod >= newYearWindowStart && tod < newYearWindowEnd, "NY_WINDOW");
        require(_isMonthDay(12, 31), "NOT_1231");

        uint256 minuteOfDay = currentMinuteIndexOfDay();
        uint256 startMinute = newYearWindowStart / 60;
        require(minuteOfDay >= startMinute && minuteOfDay < startMinute + 10, "NY_MINUTE");

        uint8 minuteIndex = uint8(minuteOfDay - startMinute);
        uint256 year;
        (year,,) = currentUtcDate();

        require(!newYearCountdownClaimed[year][msg.sender][minuteIndex], "NY_CLAIMED");
        newYearCountdownClaimed[year][msg.sender][minuteIndex] = true;

        uint256 reward = _scaleHundredth(newYearMinuteRewardHundredth);
        require(kgen.balanceOf(address(this)) >= reward, "HEART_INSUFFICIENT_FUNDS");
        kgen.safeTransfer(msg.sender, reward);

        emit NewYearCountdownClaimed(msg.sender, year, minuteIndex, reward);
    }
}
