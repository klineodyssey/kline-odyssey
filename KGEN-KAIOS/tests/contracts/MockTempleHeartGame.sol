// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IFortuneGameClaim {
    function claim(uint256 roundId) external;
}

contract MockTempleHeartGame {
    bool public operational = true;
    bool public rejectPayout;
    bool public attemptReentry;
    uint256 public reentryRoundId;
    mapping(address => uint256) public paid;

    function setOperational(bool operational_) external {
        operational = operational_;
    }

    function setRejectPayout(bool rejectPayout_) external {
        rejectPayout = rejectPayout_;
    }

    function setReentry(bool attemptReentry_, uint256 roundId_) external {
        attemptReentry = attemptReentry_;
        reentryRoundId = roundId_;
    }

    function isHeartGameOperational() external view returns (bool) {
        return operational;
    }

    function gamePayout(address player, uint256 amount) external {
        require(operational, "HEART_CLOSED");
        require(!rejectPayout, "HEART_REJECTED");
        if (attemptReentry) {
            IFortuneGameClaim(msg.sender).claim(reentryRoundId);
        }
        paid[player] += amount;
    }
}
