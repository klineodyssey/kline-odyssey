// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title KAIOSOrganRegistry
 * @notice Timelocked registry for replaceable KAIOS runtime organs.
 * @dev Monetary ratios and token taxes do not live in this registry.
 */
contract KAIOSOrganRegistry is Ownable2Step {
    uint64 public constant MINIMUM_ALLOWED_DELAY = 1 hours;
    bytes32 public constant ORGAN_FURNACE_18911 = keccak256("KAIOS.ORGAN.FURNACE.18911");
    bytes32 public constant ORGAN_WORMHOLE_511111 = keccak256("KAIOS.ORGAN.WORMHOLE.511111");
    bytes32 public constant ORGAN_KSHIP_CONVERTER = keccak256("KAIOS.ORGAN.KSHIP.CONVERTER");
    bytes32 public constant ORGAN_PAIR_REGISTRY = keccak256("KAIOS.ORGAN.PAIR.REGISTRY");
    bytes32 public constant ORGAN_EXCHANGE_TREASURY_11520 =
        keccak256("KAIOS.ORGAN.EXCHANGE_TREASURY.11520");

    struct PendingOrgan {
        address candidate;
        uint64 executableAt;
    }

    uint64 public immutable minimumDelay;
    bool public bootstrapOpen = true;

    mapping(bytes32 => address) private _organs;
    mapping(bytes32 => PendingOrgan) public pendingOrgans;

    error ZeroAddress();
    error NotAContract(address account);
    error BootstrapClosed();
    error GovernanceDelayTooShort(uint64 provided, uint64 minimum);
    error BootstrapStillOpen();
    error NoPendingOrgan(bytes32 organId);
    error OrganDelayNotElapsed(uint64 executableAt, uint64 currentTime);

    event OrganBootstrapped(bytes32 indexed organId, address indexed organ);
    event BootstrapSealed();
    event OrganProposed(bytes32 indexed organId, address indexed candidate, uint64 executableAt);
    event OrganProposalCancelled(bytes32 indexed organId);
    event OrganUpdated(bytes32 indexed organId, address indexed previousOrgan, address indexed newOrgan);

    constructor(address initialOwner, uint64 governanceDelay) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        if (governanceDelay < MINIMUM_ALLOWED_DELAY) {
            revert GovernanceDelayTooShort(governanceDelay, MINIMUM_ALLOWED_DELAY);
        }
        minimumDelay = governanceDelay;
    }

    function organ(bytes32 organId) external view returns (address) {
        return _organs[organId];
    }

    function bootstrapOrgan(bytes32 organId, address candidate) external onlyOwner {
        if (!bootstrapOpen) revert BootstrapClosed();
        _requireContract(candidate);
        address previous = _organs[organId];
        _organs[organId] = candidate;
        emit OrganBootstrapped(organId, candidate);
        emit OrganUpdated(organId, previous, candidate);
    }

    function sealBootstrap() external onlyOwner {
        if (!bootstrapOpen) revert BootstrapClosed();
        bootstrapOpen = false;
        emit BootstrapSealed();
    }

    function proposeOrgan(bytes32 organId, address candidate) external onlyOwner {
        if (bootstrapOpen) revert BootstrapStillOpen();
        _requireContract(candidate);
        uint64 executableAt = uint64(block.timestamp) + minimumDelay;
        pendingOrgans[organId] = PendingOrgan(candidate, executableAt);
        emit OrganProposed(organId, candidate, executableAt);
    }

    function cancelOrganProposal(bytes32 organId) external onlyOwner {
        if (pendingOrgans[organId].candidate == address(0)) revert NoPendingOrgan(organId);
        delete pendingOrgans[organId];
        emit OrganProposalCancelled(organId);
    }

    function executeOrgan(bytes32 organId) external {
        PendingOrgan memory pending = pendingOrgans[organId];
        if (pending.candidate == address(0)) revert NoPendingOrgan(organId);
        if (block.timestamp < pending.executableAt) {
            revert OrganDelayNotElapsed(pending.executableAt, uint64(block.timestamp));
        }
        address previous = _organs[organId];
        _organs[organId] = pending.candidate;
        delete pendingOrgans[organId];
        emit OrganUpdated(organId, previous, pending.candidate);
    }

    function _requireContract(address candidate) private view {
        if (candidate == address(0)) revert ZeroAddress();
        if (candidate.code.length == 0) revert NotAContract(candidate);
    }
}
