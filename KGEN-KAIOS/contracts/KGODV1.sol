// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

interface IK108000ReactionSource {
    struct ReactionRecord {
        bytes32 shipId;
        address owner;
        address beneficiary;
        uint8 mode;
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
    function reactionRecord(bytes32 reactionProofId) external view returns (ReactionRecord memory);
}

/**
 * @title KGODV1
 * @notice Immutable stable KGOD material minted only from a current ship-bound K108000 reaction proof.
 */
contract KGODV1 is ERC20, ERC20Capped {
    string public constant VERSION = "1.0.0";
    bytes32 public constant VERSION_ID = keccak256("KAIOS.KGOD.V1.0.0");
    bytes32 public constant ORGAN_K108000_REACTOR = keccak256("KAIOS.ORGAN.K108000.MASS_ENERGY_REACTOR");
    uint256 public constant MAX_SUPPLY = 144_000_000_000_000_000 ether;

    IKAIOSOrganRegistry public immutable organRegistry;
    uint256 public totalMintedFromReactions;
    mapping(bytes32 => bool) public reactionProofMinted;

    error ZeroAddress();
    error OnlyCurrentK108000Reactor(address caller);
    error ProofAlreadyUsed(bytes32 proofId);
    error InvalidReactionProof(bytes32 proofId);

    event ReactionProofMinted(bytes32 indexed proofId, bytes32 indexed shipId, address indexed beneficiary, uint256 kgodAmount);

    constructor(address registry) ERC20("KGOD Stable Material", "KGOD") ERC20Capped(MAX_SUPPLY) {
        if (registry == address(0)) revert ZeroAddress();
        organRegistry = IKAIOSOrganRegistry(registry);
    }

    function mintFromReactionProof(bytes32 proofId) external returns (address beneficiary, uint256 amount) {
        address reactor = organRegistry.organ(ORGAN_K108000_REACTOR);
        if (msg.sender != reactor || reactor == address(0)) revert OnlyCurrentK108000Reactor(msg.sender);
        if (reactionProofMinted[proofId]) revert ProofAlreadyUsed(proofId);

        IK108000ReactionSource.ReactionRecord memory record = IK108000ReactionSource(msg.sender).reactionRecord(proofId);
        if (
            record.shipId == bytes32(0) || record.owner == address(0) || record.beneficiary == address(0) ||
            record.kgodMassEquivalent == 0 || record.kshipAntimatterConsumed == 0 ||
            record.positiveMatterConsumed != record.kshipAntimatterConsumed ||
            record.totalInputEquivalent != record.kshipAntimatterConsumed + record.positiveMatterConsumed ||
            record.totalInputEquivalent != record.propulsionEnergy + record.recoverableEnergy + record.kgodMassEquivalent + record.radiationHeat
        ) revert InvalidReactionProof(proofId);

        beneficiary = record.beneficiary;
        amount = record.kgodMassEquivalent;
        reactionProofMinted[proofId] = true;
        totalMintedFromReactions += amount;
        _mint(beneficiary, amount);
        emit ReactionProofMinted(proofId, record.shipId, beneficiary, amount);
    }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Capped) {
        super._update(from, to, value);
    }
}
