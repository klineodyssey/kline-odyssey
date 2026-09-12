// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {LingxiaoBankModuleBaseUpgradeable} from "../../contracts/LingxiaoBankModuleBaseUpgradeable.sol";

/// @dev Test-only byte-for-byte storage model of the pre-calendar candidate.
contract CelestialSeat500_DurationEpochV1Fixture is LingxiaoBankModuleBaseUpgradeable {
    bytes32 public constant MODULE_ID = keccak256("KAIOS.BANK.MODULE.CELESTIAL_SEAT_500");

    enum SeatStatus { NONE, ACTIVE, SUSPENDED, RETIRED }

    struct Seat {
        bytes32 lifeId;
        bytes32 templeId;
        address beneficiary;
        uint128 salaryPerEpoch;
        uint64 activatedAt;
        uint64 salaryCheckpoint;
        uint256 claimedAmount;
        SeatStatus status;
    }

    uint64 public salaryEpochSeconds;
    uint256 public seatCount;
    uint256 public totalSalaryClaimed;
    mapping(uint256 seatId => Seat) private _seats;

    function initialize(address bankAddress, address governance, address upgrader, uint64 epochSeconds)
        external
        initializer
    {
        __LingxiaoBankModule_init(bankAddress, governance, upgrader, MODULE_ID);
        salaryEpochSeconds = epochSeconds;
    }

    function seat(uint256 seatId) external view returns (Seat memory) { return _seats[seatId]; }

    function configureFixtureSeat(
        uint256 seatId,
        bytes32 lifeId,
        bytes32 templeId,
        address beneficiary,
        uint128 salaryPerEpoch,
        SeatStatus status
    ) external onlyRole(GOVERNANCE_ROLE) {
        Seat storage stored = _seats[seatId];
        if (stored.status == SeatStatus.NONE) {
            seatCount += 1;
            stored.activatedAt = uint64(block.timestamp);
            stored.salaryCheckpoint = uint64(block.timestamp / salaryEpochSeconds);
        }
        stored.lifeId = lifeId;
        stored.templeId = templeId;
        stored.beneficiary = beneficiary;
        stored.salaryPerEpoch = salaryPerEpoch;
        stored.status = status;
    }

    uint256[46] private __gap;
}
