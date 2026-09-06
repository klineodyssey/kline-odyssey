// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

interface IKSHIPMassEnergyBurnable {
    function burnForMassEnergy(bytes32 shipId, address owner, uint256 kshipAmount, bytes32 reactionProofId) external returns (uint256);
}

interface IK108000MatterSource {
    function consumeMatter(bytes32 shipId, address owner, uint256 matterAmount, bytes32 reactionProofId) external returns (uint256 consumedMatter);
}

interface IKGODReactionMinter {
    function mintFromReactionProof(bytes32 reactionProofId) external returns (address beneficiary, uint256 kgodAmount);
}

interface IKAIOSShipIdentityReaderForReactorV1 {
    struct ShipIdentity {
        bytes32 shipId;
        address controller;
        address tradingEngine;
        address reactor;
        uint64 registeredAt;
        bool active;
    }
    function ship(bytes32 shipId) external view returns (ShipIdentity memory);
}

/**
 * @title K108000MassEnergyReactorV1
 * @notice Ship-authenticated K108000 antimatter/matter reactor for propulsion, recoverable energy,
 *         stable KGOD material and radiation/heat accounting.
 */
contract K108000MassEnergyReactorV1 is ReentrancyGuard {
    string public constant VERSION = "1.1.0";
    bytes32 public constant VERSION_ID = keccak256("KAIOS.K108000.MASS_ENERGY_REACTOR.V1.1.0");
    bytes32 public constant ORGAN_MATTER_SOURCE = keccak256("KAIOS.ORGAN.K108000.POSITIVE_MATTER_SOURCE");
    bytes32 public constant ORGAN_KGOD = keccak256("KAIOS.ORGAN.KGOD.TOKEN");
    uint256 public constant REACTOR_POINT = 108_000;

    enum ReactionMode { PROPULSION, MATERIAL_FORGE, COGENERATION }

    struct Allocation {
        uint256 propulsionEnergy;
        uint256 recoverableEnergy;
        uint256 kgodMassEquivalent;
        uint256 radiationHeat;
    }

    struct ReactionRecord {
        bytes32 shipId;
        address owner;
        address beneficiary;
        ReactionMode mode;
        uint256 kshipAntimatterConsumed;
        uint256 positiveMatterConsumed;
        uint256 totalInputEquivalent;
        uint256 propulsionEnergy;
        uint256 recoverableEnergy;
        uint256 kgodMassEquivalent;
        uint256 radiationHeat;
        uint256 blockNumber;
        uint256 timestamp;
        bool kgodMinted;
    }

    IKSHIPMassEnergyBurnable public immutable kship;
    IKAIOSOrganRegistry public immutable organRegistry;
    IKAIOSShipIdentityReaderForReactorV1 public immutable shipRegistry;

    uint256 public reactionCount;
    uint256 public cumulativeInputEquivalent;
    uint256 public cumulativePropulsionEnergy;
    uint256 public cumulativeRecoverableEnergy;
    uint256 public cumulativeKgodMassEquivalent;
    uint256 public cumulativeRadiationHeat;
    mapping(bytes32 => ReactionRecord) private _reactions;

    error ZeroAddress();
    error ZeroAmount();
    error ZeroShipId();
    error UnauthorizedShipController(bytes32 shipId, address caller);
    error ReactorNotBoundToShip(bytes32 shipId, address expected, address actual);
    error MatterSourceNotBound();
    error KGODNotBound();
    error MatterMismatch(uint256 expected, uint256 actual);
    error AllocationMismatch(uint256 inputEquivalent, uint256 outputEquivalent);
    error InvalidModeAllocation(ReactionMode mode);
    error ReactionAlreadyExists(bytes32 reactionProofId);
    error UnknownReaction(bytes32 reactionProofId);
    error KGODMintMismatch(address beneficiary, uint256 expected, uint256 actual);

    event MassEnergyReaction(
        bytes32 indexed reactionProofId,
        bytes32 indexed shipId,
        address indexed owner,
        address beneficiary,
        ReactionMode mode,
        uint256 kshipAntimatterConsumed,
        uint256 positiveMatterConsumed,
        uint256 totalInputEquivalent,
        uint256 propulsionEnergy,
        uint256 recoverableEnergy,
        uint256 kgodMassEquivalent,
        uint256 radiationHeat
    );

    constructor(address kshipToken, address registry, address ships) {
        if (kshipToken == address(0) || registry == address(0) || ships == address(0)) revert ZeroAddress();
        kship = IKSHIPMassEnergyBurnable(kshipToken);
        organRegistry = IKAIOSOrganRegistry(registry);
        shipRegistry = IKAIOSShipIdentityReaderForReactorV1(ships);
    }

    function react(bytes32 shipId, uint256 kshipAmount, address beneficiary, ReactionMode mode, Allocation calldata allocation)
        external nonReentrant returns (bytes32 reactionProofId, uint256 kgodAmount)
    {
        if (shipId == bytes32(0)) revert ZeroShipId();
        if (beneficiary == address(0)) revert ZeroAddress();
        if (kshipAmount == 0) revert ZeroAmount();

        IKAIOSShipIdentityReaderForReactorV1.ShipIdentity memory ship = shipRegistry.ship(shipId);
        if (!ship.active || ship.controller != msg.sender) revert UnauthorizedShipController(shipId, msg.sender);
        if (ship.reactor != address(this)) revert ReactorNotBoundToShip(shipId, ship.reactor, address(this));

        uint256 number = ++reactionCount;
        reactionProofId = keccak256(abi.encode(block.chainid, address(this), number, shipId, msg.sender, beneficiary, kshipAmount, mode));
        if (_reactions[reactionProofId].owner != address(0)) revert ReactionAlreadyExists(reactionProofId);

        uint256 totalInput = kshipAmount * 2;
        uint256 totalOutput = allocation.propulsionEnergy + allocation.recoverableEnergy + allocation.kgodMassEquivalent + allocation.radiationHeat;
        if (totalOutput != totalInput) revert AllocationMismatch(totalInput, totalOutput);

        if (mode == ReactionMode.PROPULSION) {
            if (allocation.propulsionEnergy == 0 || allocation.kgodMassEquivalent != 0) revert InvalidModeAllocation(mode);
        } else if (mode == ReactionMode.MATERIAL_FORGE) {
            if (allocation.kgodMassEquivalent == 0 || allocation.propulsionEnergy != 0) revert InvalidModeAllocation(mode);
        } else {
            if (allocation.propulsionEnergy == 0 || allocation.kgodMassEquivalent == 0) revert InvalidModeAllocation(mode);
        }

        address matterSource = organRegistry.organ(ORGAN_MATTER_SOURCE);
        if (matterSource == address(0)) revert MatterSourceNotBound();

        uint256 burnedKship = kship.burnForMassEnergy(shipId, msg.sender, kshipAmount, reactionProofId);
        if (burnedKship != kshipAmount) revert MatterMismatch(kshipAmount, burnedKship);
        uint256 consumedMatter = IK108000MatterSource(matterSource).consumeMatter(shipId, msg.sender, kshipAmount, reactionProofId);
        if (consumedMatter != kshipAmount) revert MatterMismatch(kshipAmount, consumedMatter);

        _reactions[reactionProofId] = ReactionRecord({
            shipId: shipId,
            owner: msg.sender,
            beneficiary: beneficiary,
            mode: mode,
            kshipAntimatterConsumed: kshipAmount,
            positiveMatterConsumed: consumedMatter,
            totalInputEquivalent: totalInput,
            propulsionEnergy: allocation.propulsionEnergy,
            recoverableEnergy: allocation.recoverableEnergy,
            kgodMassEquivalent: allocation.kgodMassEquivalent,
            radiationHeat: allocation.radiationHeat,
            blockNumber: block.number,
            timestamp: block.timestamp,
            kgodMinted: false
        });

        cumulativeInputEquivalent += totalInput;
        cumulativePropulsionEnergy += allocation.propulsionEnergy;
        cumulativeRecoverableEnergy += allocation.recoverableEnergy;
        cumulativeKgodMassEquivalent += allocation.kgodMassEquivalent;
        cumulativeRadiationHeat += allocation.radiationHeat;

        emit MassEnergyReaction(reactionProofId, shipId, msg.sender, beneficiary, mode, kshipAmount, consumedMatter, totalInput,
            allocation.propulsionEnergy, allocation.recoverableEnergy, allocation.kgodMassEquivalent, allocation.radiationHeat);

        if (allocation.kgodMassEquivalent != 0) {
            address kgod = organRegistry.organ(ORGAN_KGOD);
            if (kgod == address(0)) revert KGODNotBound();
            (address mintedBeneficiary, uint256 mintedAmount) = IKGODReactionMinter(kgod).mintFromReactionProof(reactionProofId);
            if (mintedBeneficiary != beneficiary || mintedAmount != allocation.kgodMassEquivalent) {
                revert KGODMintMismatch(mintedBeneficiary, allocation.kgodMassEquivalent, mintedAmount);
            }
            _reactions[reactionProofId].kgodMinted = true;
            kgodAmount = mintedAmount;
        }
    }

    function reactionRecord(bytes32 reactionProofId) external view returns (ReactionRecord memory) {
        ReactionRecord memory record = _reactions[reactionProofId];
        if (record.owner == address(0)) revert UnknownReaction(reactionProofId);
        return record;
    }

    function conservationInvariantHolds() external view returns (bool) {
        return cumulativeInputEquivalent == cumulativePropulsionEnergy + cumulativeRecoverableEnergy + cumulativeKgodMassEquivalent + cumulativeRadiationHeat;
    }
}
