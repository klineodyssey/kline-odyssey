// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

interface IKUFOV5CarrierBurnRecordSource {
    struct CarrierBurnRecord {
        address owner;
        address beneficiary;
        address converter;
        uint256 kufoBurned;
        uint256 expectedKship;
    }

    function carrierBurnRecord(bytes32 proofId) external view returns (CarrierBurnRecord memory);
}

/**
 * @title KSHIPV5
 * @notice Immutable KSHIP antimatter core with a registry-gated K108000 mass-energy burn port.
 * @dev KSHIP has no native half-life. Its supply decreases only when a current authorized
 *      K108000 reactor consumes KSHIP into a mass-energy reaction receipt. This contract is
 *      intentionally non-upgradeable; later changes require a new deployment/version.
 */
contract KSHIPV5 is ERC20, ERC20Capped {
    string public constant VERSION = "5.0.0";
    bytes32 public constant VERSION_ID = keccak256("KAIOS.KSHIP.V5.0.0");
    bytes32 public constant ORGAN_KSHIP_CONVERTER = keccak256("KAIOS.ORGAN.KSHIP.CONVERTER");
    bytes32 public constant ORGAN_K108000_REACTOR = keccak256("KAIOS.ORGAN.K108000.MASS_ENERGY_REACTOR");
    uint256 public constant KSHIP_PER_KUFO = 1_000;
    uint256 public constant MAX_SUPPLY = 72_000_000_000_000_000 ether;

    IKAIOSOrganRegistry public immutable organRegistry;
    IKUFOV5CarrierBurnRecordSource public immutable kufo;

    uint256 public totalMintedFromKufo;
    uint256 public totalConsumedForMassEnergy;
    mapping(bytes32 => bool) public carrierProofMinted;
    mapping(bytes32 => bool) public reactionProofConsumed;

    struct ReactionBurnRecord {
        address owner;
        address reactor;
        uint256 kshipConsumed;
        uint256 blockNumber;
        uint256 timestamp;
    }

    mapping(bytes32 => ReactionBurnRecord) private _reactionBurnRecords;

    error ZeroAddress();
    error ZeroAmount();
    error OnlyCurrentKshipConverter(address caller);
    error OnlyCurrentK108000Reactor(address caller);
    error ProofAlreadyUsed(bytes32 proofId);
    error InvalidLineageProof(bytes32 proofId);
    error InsufficientHolderAllowance(uint256 currentAllowance, uint256 requiredAllowance);

    event CarrierProofMinted(bytes32 indexed proofId, address indexed beneficiary, uint256 kshipAmount);
    event KSHIPConsumedForMassEnergy(bytes32 indexed reactionProofId, address indexed owner, address indexed reactor, uint256 kshipAmount);

    constructor(address registry, address kufoToken)
        ERC20("KSHIP Antimatter Fuel", "KSHIP")
        ERC20Capped(MAX_SUPPLY)
    {
        if (registry == address(0) || kufoToken == address(0)) revert ZeroAddress();
        organRegistry = IKAIOSOrganRegistry(registry);
        kufo = IKUFOV5CarrierBurnRecordSource(kufoToken);
    }

    function mintFromCarrierProof(bytes32 proofId) external returns (address beneficiary, uint256 amount) {
        address converter = organRegistry.organ(ORGAN_KSHIP_CONVERTER);
        if (msg.sender != converter || converter == address(0)) revert OnlyCurrentKshipConverter(msg.sender);
        if (carrierProofMinted[proofId]) revert ProofAlreadyUsed(proofId);

        IKUFOV5CarrierBurnRecordSource.CarrierBurnRecord memory burnRecord = kufo.carrierBurnRecord(proofId);
        if (
            burnRecord.owner == address(0) ||
            burnRecord.beneficiary == address(0) ||
            burnRecord.converter != msg.sender ||
            burnRecord.kufoBurned == 0 ||
            burnRecord.expectedKship != burnRecord.kufoBurned * KSHIP_PER_KUFO
        ) revert InvalidLineageProof(proofId);

        beneficiary = burnRecord.beneficiary;
        amount = burnRecord.expectedKship;
        carrierProofMinted[proofId] = true;
        totalMintedFromKufo += amount;
        _mint(beneficiary, amount);
        emit CarrierProofMinted(proofId, beneficiary, amount);
    }

    function burnForMassEnergy(address owner, uint256 kshipAmount, bytes32 reactionProofId) external returns (uint256) {
        address reactor = organRegistry.organ(ORGAN_K108000_REACTOR);
        if (msg.sender != reactor || reactor == address(0)) revert OnlyCurrentK108000Reactor(msg.sender);
        if (owner == address(0)) revert ZeroAddress();
        if (kshipAmount == 0) revert ZeroAmount();
        if (reactionProofConsumed[reactionProofId]) revert ProofAlreadyUsed(reactionProofId);

        uint256 currentAllowance = allowance(owner, msg.sender);
        if (currentAllowance < kshipAmount) revert InsufficientHolderAllowance(currentAllowance, kshipAmount);

        reactionProofConsumed[reactionProofId] = true;
        _spendAllowance(owner, msg.sender, kshipAmount);
        _burn(owner, kshipAmount);
        totalConsumedForMassEnergy += kshipAmount;
        _reactionBurnRecords[reactionProofId] = ReactionBurnRecord(owner, msg.sender, kshipAmount, block.number, block.timestamp);
        emit KSHIPConsumedForMassEnergy(reactionProofId, owner, msg.sender, kshipAmount);
        return kshipAmount;
    }

    function reactionBurnRecord(bytes32 reactionProofId) external view returns (ReactionBurnRecord memory) {
        return _reactionBurnRecords[reactionProofId];
    }

    function supplyConservationHolds() external view returns (bool) {
        return totalSupply() + totalConsumedForMassEnergy == totalMintedFromKufo;
    }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Capped) {
        super._update(from, to, value);
    }
}
