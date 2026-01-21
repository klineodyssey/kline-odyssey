// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract KGEN_DailyIgnite_V1 is Ownable {
    IERC20 public immutable kgen;
    address public immutable rewardWallet; // 資金來源
    address public immutable bankWallet;   // 餘額打回 bank

    uint256 public constant UTC8_OFFSET = 8 hours;

    // 每日預算（單位：wei，KGEN 有 18 decimals）
    uint256 public dailyBudget;

    // 觸發者拿的比例（BPS: 10000 = 100%）
    uint16 public callerBps; // 例如 5000 = 50%

    uint64 public lastDayId;

    event DailyIgnited(
        uint64 indexed dayId,
        address indexed caller,
        uint256 budget,
        uint256 callerReward,
        uint256 bankRemainder,
        uint256 ts
    );

    constructor(
        address owner_,
        address kgen_,
        address rewardWallet_,
        address bankWallet_,
        uint256 dailyBudget_,
        uint16 callerBps_
    ) Ownable(owner_) {
        require(kgen_ != address(0) && rewardWallet_ != address(0) && bankWallet_ != address(0), "zero addr");
        require(callerBps_ <= 10_000, "bps>100%");
        kgen = IERC20(kgen_);
        rewardWallet = rewardWallet_;
        bankWallet = bankWallet_;
        dailyBudget = dailyBudget_;
        callerBps = callerBps_;
    }

    function _dayId(uint256 ts) internal pure returns (uint64) {
        return uint64((ts + UTC8_OFFSET) / 1 days);
    }

    function setDailyBudget(uint256 newBudget) external onlyOwner {
        dailyBudget = newBudget;
    }

    function setCallerBps(uint16 newBps) external onlyOwner {
        require(newBps <= 10_000, "bps>100%");
        callerBps = newBps;
    }

    // ✅ 每天只會成功一次（UTC+8 換日）
    function igniteDaily() external {
        uint64 did = _dayId(block.timestamp);
        require(did > lastDayId, "already ignited today");
        lastDayId = did;

        uint256 budget = dailyBudget;
        require(budget > 0, "budget=0");

        uint256 callerReward = (budget * callerBps) / 10_000;
        uint256 bankRemainder = budget - callerReward;

        // 從 rewardWallet 拉出 budget
        require(kgen.transferFrom(rewardWallet, address(this), budget), "pull from reward failed");

        // 轉給觸發者
        if (callerReward > 0) {
            require(kgen.transfer(msg.sender, callerReward), "pay caller failed");
        }

        // 餘額入 bank（符合你要求）
        if (bankRemainder > 0) {
            require(kgen.transfer(bankWallet, bankRemainder), "pay bank failed");
        }

        emit DailyIgnited(did, msg.sender, budget, callerReward, bankRemainder, block.timestamp);
    }
}