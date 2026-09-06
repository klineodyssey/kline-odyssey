// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IKAIOSUFOOrganRuntimeRead {
    function shipId() external view returns (bytes32);
    function controller() external view returns (address);
    function readyForFlight() external view returns (bool);
    function readyForCogeneration() external view returns (bool);
    function readyForMobileATM() external view returns (bool);
}

/**
 * @title KAIOSUFOLifeV1
 * @notice Lifecycle state machine for one authenticated KAIOS UFO organism candidate.
 * @dev This contract does NOT create a formal KAIOS Life record by itself. lifeId may be zero
 *      until an external canonical birth/registry process assigns one. It cannot move tokens,
 *      trade, mint KGOD, or replace organs; it only coordinates life state and emits auditable intent.
 */
contract KAIOSUFOLifeV1 {
    string public constant VERSION = "1.0.0";
    bytes32 public constant VERSION_ID = keccak256("KAIOS.UFO.LIFE.V1.0.0");

    enum LifeState {
        DORMANT,
        ALIVE,
        FLIGHT,
        MAINTENANCE,
        RETIRED
    }

    IKAIOSUFOOrganRuntimeRead public immutable organs;
    bytes32 public immutable shipId;
    bytes32 public immutable lifeId;
    uint256 public immutable createdAt;
    LifeState public state;
    uint256 public heartbeatCount;
    uint256 public lastHeartbeatAt;

    error ZeroAddress();
    error ControllerOnly(address caller);
    error InvalidTransition(LifeState from, LifeState to);
    error FlightOrgansNotReady();
    error Retired();

    event UFOActivated(bytes32 indexed shipId, bytes32 indexed lifeId, address indexed controller);
    event UFOLifeStateChanged(bytes32 indexed shipId, LifeState from, LifeState to);
    event UFOHeartbeat(bytes32 indexed shipId, uint256 indexed heartbeatCount, uint256 timestamp);
    event UFOIntent(bytes32 indexed shipId, bytes32 indexed intentType, bytes32 indexed intentRef, uint256 timestamp);

    constructor(address organRuntime, bytes32 canonicalLifeIdOrZero) {
        if (organRuntime == address(0)) revert ZeroAddress();
        organs = IKAIOSUFOOrganRuntimeRead(organRuntime);
        shipId = organs.shipId();
        lifeId = canonicalLifeIdOrZero;
        createdAt = block.timestamp;
        state = LifeState.DORMANT;
    }

    modifier onlyController() {
        if (msg.sender != organs.controller()) revert ControllerOnly(msg.sender);
        _;
    }

    function activate() external onlyController {
        if (state == LifeState.RETIRED) revert Retired();
        if (state != LifeState.DORMANT && state != LifeState.MAINTENANCE) {
            revert InvalidTransition(state, LifeState.ALIVE);
        }
        LifeState from = state;
        state = LifeState.ALIVE;
        emit UFOActivated(shipId, lifeId, msg.sender);
        emit UFOLifeStateChanged(shipId, from, state);
    }

    function enterFlight() external onlyController {
        if (state != LifeState.ALIVE) revert InvalidTransition(state, LifeState.FLIGHT);
        if (!organs.readyForFlight()) revert FlightOrgansNotReady();
        state = LifeState.FLIGHT;
        emit UFOLifeStateChanged(shipId, LifeState.ALIVE, LifeState.FLIGHT);
    }

    function land() external onlyController {
        if (state != LifeState.FLIGHT) revert InvalidTransition(state, LifeState.ALIVE);
        state = LifeState.ALIVE;
        emit UFOLifeStateChanged(shipId, LifeState.FLIGHT, LifeState.ALIVE);
    }

    function enterMaintenance() external onlyController {
        if (state == LifeState.FLIGHT || state == LifeState.RETIRED) {
            revert InvalidTransition(state, LifeState.MAINTENANCE);
        }
        LifeState from = state;
        state = LifeState.MAINTENANCE;
        emit UFOLifeStateChanged(shipId, from, state);
    }

    function retire() external onlyController {
        if (state == LifeState.FLIGHT) revert InvalidTransition(state, LifeState.RETIRED);
        LifeState from = state;
        state = LifeState.RETIRED;
        emit UFOLifeStateChanged(shipId, from, state);
    }

    function heartbeat() external onlyController {
        if (state == LifeState.DORMANT || state == LifeState.RETIRED) revert Retired();
        heartbeatCount += 1;
        lastHeartbeatAt = block.timestamp;
        emit UFOHeartbeat(shipId, heartbeatCount, block.timestamp);
    }

    function announceIntent(bytes32 intentType, bytes32 intentRef) external onlyController {
        if (state == LifeState.DORMANT || state == LifeState.RETIRED) revert Retired();
        emit UFOIntent(shipId, intentType, intentRef, block.timestamp);
    }

    function capabilities()
        external
        view
        returns (bool flight, bool cogeneration, bool mobileAtm)
    {
        flight = organs.readyForFlight();
        cogeneration = organs.readyForCogeneration();
        mobileAtm = organs.readyForMobileATM();
    }

    function formalLifeAssigned() external view returns (bool) {
        return lifeId != bytes32(0);
    }
}
