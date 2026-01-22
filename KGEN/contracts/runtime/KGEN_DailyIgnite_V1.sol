// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20Lite {
    function balanceOf(address who) external view returns (uint256);
}

interface IRewardVault {
    function payout(address to, uint256 amount, string calldata reason) external;
}

/**
 * DailyIgnite: 每日呼吸（UTC+8）
 * - 任何人可呼叫，每天一次
 * - 第一位 = Guardian of the Day（守門人）
 * - 符合持有門檻者可領小獎（從 RewardVault 出）
 * - 母機補救：若沒人按，Mother 可在之後補記該日存在（不發獎）
 */
contract KGEN_DailyIgnite_V1 {
    IERC20Lite public immutable kgen;
    IRewardVault public immutable vault;

    address public mother;
    uint256 public rewardAmount;         // 小獎額度（KGEN 最小單位）
    uint256 public minHoldToReward;      // 持有門檻（例如 500 KGEN）
    int256  public constant UTC8 = 8 hours;

    mapping(uint256 => bool) public ignitedDay; // dayIndex => done

    event DailyIgnited(uint256 indexed dayIndex, address indexed caller, bool rewarded);
    event MissedDayRecorded(uint256 indexed dayIndex, address indexed mother);
    event ParamsUpdated(address indexed mother, uint256 rewardAmount, uint256 minHoldToReward);

    modifier onlyMother() {
        require(msg.sender == mother, "NOT_MOTHER");
        _;
    }

    constructor(address _kgen, address _vault, address _mother, uint256 _rewardAmount, uint256 _minHoldToReward) {
        require(_kgen != address(0) && _vault != address(0) && _mother != address(0), "ZERO_ADDR");
        kgen = IERC20Lite(_kgen);
        vault = IRewardVault(_vault);
        mother = _mother;
        rewardAmount = _rewardAmount;
        minHoldToReward = _minHoldToReward;
        emit ParamsUpdated(_mother, _rewardAmount, _minHoldToReward);
    }

    /// UTC+8 的日序（以台北日界線）
    function dayIndexUTC8() public view returns (uint256) {
        // block.timestamp + 8h 再除以 1 day
        return (block.timestamp + uint256(int256(UTC8))) / 1 days;
    }

    /// 每日呼吸：任何人可按；每日一次
    function igniteDaily() external {
        uint256 d = dayIndexUTC8();
        require(!ignitedDay[d], "ALREADY_IGNITED");
        ignitedDay[d] = true;

        bool rewarded = false;

        // 母機呼叫視為補救，不領獎（避免母機把獎領走）
        if (msg.sender != mother) {
            // 持有門檻檢查（可設 0 表示人人有獎）
            if (minHoldToReward == 0 || kgen.balanceOf(msg.sender) >= minHoldToReward) {
                // 發小獎（Vault 需先有餘額）
                vault.payout(msg.sender, rewardAmount, "ignite_daily_guardian");
                rewarded = true;
            }
        }

        emit DailyIgnited(d, msg.sender, rewarded);
    }

    /// 母機補記：用來補「沒人按」的那一天（不發獎，只刻歷史）
    function recordMissedDay(uint256 dayIndex) external onlyMother {
        require(!ignitedDay[dayIndex], "ALREADY_IGNITED");
        ignitedDay[dayIndex] = true;
        emit MissedDayRecorded(dayIndex, msg.sender);
    }

    /// 參數可調（仍屬 Runtime，不碰 Core）
    function updateParams(address _mother, uint256 _rewardAmount, uint256 _minHoldToReward) external onlyMother {
        require(_mother != address(0), "ZERO_MOTHER");
        mother = _mother;
        rewardAmount = _rewardAmount;
        minHoldToReward = _minHoldToReward;
        emit ParamsUpdated(_mother, _rewardAmount, _minHoldToReward);
    }
}
