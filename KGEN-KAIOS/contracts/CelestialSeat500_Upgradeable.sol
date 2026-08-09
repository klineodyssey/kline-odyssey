// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {LingxiaoBankModuleBaseUpgradeable} from "./LingxiaoBankModuleBaseUpgradeable.sol";

contract CelestialSeat500_Upgradeable is LingxiaoBankModuleBaseUpgradeable {
    bytes32 public constant MODULE_ID = keccak256("KAIOS.BANK.MODULE.CELESTIAL_SEAT_500");
    uint256 public constant MAX_SEATS = 500;

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

    error InvalidSeat();
    error SeatLimitReached();
    error NoSalaryDue(uint256 seatId);

    event SeatConfigured(
        uint256 indexed seatId,
        bytes32 indexed lifeId,
        bytes32 indexed templeId,
        address beneficiary,
        uint256 salaryPerEpoch,
        SeatStatus status
    );
    event SalaryClaimed(
        uint256 indexed seatId,
        address indexed beneficiary,
        uint256 amount,
        uint64 fromEpoch,
        uint64 toEpoch,
        address triggeredBy
    );

    function initialize(address bankAddress, address governance, address upgrader, uint64 epochSeconds)
        external
        initializer
    {
        if (epochSeconds == 0) revert InvalidSeat();
        __LingxiaoBankModule_init(bankAddress, governance, upgrader, MODULE_ID);
        salaryEpochSeconds = epochSeconds;
    }

    function version() external pure returns (string memory) { return "1.0.0"; }

    function seat(uint256 seatId) external view returns (Seat memory) { return _seats[seatId]; }

    function currentSalaryEpoch() public view returns (uint64) {
        return uint64(block.timestamp / salaryEpochSeconds);
    }

    function configureSeat(
        uint256 seatId,
        bytes32 lifeId,
        bytes32 templeId,
        address beneficiary,
        uint128 salaryPerEpoch,
        SeatStatus status
    ) external onlyRole(GOVERNANCE_ROLE) {
        if (
            seatId == 0 || seatId > MAX_SEATS || lifeId == bytes32(0) || templeId == bytes32(0)
                || beneficiary == address(0) || salaryPerEpoch == 0 || status == SeatStatus.NONE
        ) revert InvalidSeat();
        Seat storage stored = _seats[seatId];
        if (stored.status == SeatStatus.NONE) {
            if (seatCount == MAX_SEATS) revert SeatLimitReached();
            seatCount += 1;
            stored.activatedAt = uint64(block.timestamp);
            stored.salaryCheckpoint = currentSalaryEpoch();
        }
        stored.lifeId = lifeId;
        stored.templeId = templeId;
        stored.beneficiary = beneficiary;
        stored.salaryPerEpoch = salaryPerEpoch;
        stored.status = status;
        emit SeatConfigured(seatId, lifeId, templeId, beneficiary, salaryPerEpoch, status);
    }

    function claimCelestialSalary(uint256 seatId) external nonReentrant returns (uint256 amount) {
        Seat storage stored = _seats[seatId];
        if (stored.status != SeatStatus.ACTIVE) revert InvalidSeat();
        uint64 currentEpoch = currentSalaryEpoch();
        uint64 fromEpoch = stored.salaryCheckpoint;
        if (currentEpoch <= fromEpoch) revert NoSalaryDue(seatId);
        amount = uint256(currentEpoch - fromEpoch) * uint256(stored.salaryPerEpoch);
        bytes32 paymentId = keccak256(abi.encode(MODULE_ID, seatId, fromEpoch, currentEpoch));
        _pay(paymentId, stored.beneficiary, amount);
        stored.salaryCheckpoint = currentEpoch;
        stored.claimedAmount += amount;
        totalSalaryClaimed += amount;
        emit SalaryClaimed(seatId, stored.beneficiary, amount, fromEpoch, currentEpoch, msg.sender);
    }

    uint256[46] private __gap;
}
