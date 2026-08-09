// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

interface IKAIOSBurnRecordSource {
    struct AlchemyBurnRecord {
        address owner;
        address beneficiary;
        address furnace;
        uint256 kaiosBurned;
        uint256 expectedKufo;
        bytes32 lifeId;
        bytes32 destinationCode;
        uint256 blockNumber;
        uint256 timestamp;
    }

    function alchemyBurnRecord(bytes32 proofId) external view returns (AlchemyBurnRecord memory);
}

interface IAlchemyFurnaceProofSource {
    struct Proof {
        address owner;
        address beneficiary;
        uint256 kaiosBurned;
        uint256 kufoAmount;
        bytes32 lifeId;
        bytes32 destinationCode;
        uint64 burnEpoch;
        uint64 maturityEpoch;
        bool consumed;
    }

    function proof(bytes32 proofId) external view returns (Proof memory);
    function currentEpoch() external view returns (uint64);
}

/**
 * @title KUFO
 * @notice Zero-genesis, zero-native-tax gram-scale lineage token.
 */
contract KUFO is ERC20, ERC20Capped {
    bytes32 public constant ORGAN_WORMHOLE_511111 = keccak256("KAIOS.ORGAN.WORMHOLE.511111");
    bytes32 public constant ORGAN_KSHIP_CONVERTER = keccak256("KAIOS.ORGAN.KSHIP.CONVERTER");
    uint256 public constant KSHIP_PER_KUFO = 1_000;
    uint256 public constant MAX_SUPPLY = 72_000_000_000_000 ether;

    IKAIOSOrganRegistry public immutable organRegistry;
    IKAIOSBurnRecordSource public immutable kaios;
    uint256 public totalMintedFromKaios;
    uint256 public totalBurnedForKship;

    mapping(bytes32 => bool) public maturedProofMinted;
    mapping(bytes32 => bool) public carrierProofRecorded;

    struct CarrierBurnRecord {
        address owner;
        address beneficiary;
        address converter;
        uint256 kufoBurned;
        uint256 expectedKship;
    }

    mapping(bytes32 => CarrierBurnRecord) private _carrierBurnRecords;

    error ZeroAddress();
    error ZeroAmount();
    error OnlyCurrentWormhole(address caller);
    error OnlyCurrentKshipConverter(address caller);
    error ProofAlreadyUsed(bytes32 proofId);
    error InvalidLineageProof(bytes32 proofId);
    error InsufficientHolderAllowance(uint256 currentAllowance, uint256 requiredAllowance);

    event MaturedProofMinted(bytes32 indexed proofId, address indexed beneficiary, uint256 kufoAmount);
    event KUFOBurnedForCarrier(
        bytes32 indexed carrierProofId,
        address indexed owner,
        address indexed beneficiary,
        uint256 kufoBurned,
        uint256 expectedKship
    );

    constructor(address registry, address kaiosToken)
        ERC20("KUFO Alchemy Mass", "KUFO")
        ERC20Capped(MAX_SUPPLY)
    {
        if (registry == address(0) || kaiosToken == address(0)) revert ZeroAddress();
        organRegistry = IKAIOSOrganRegistry(registry);
        kaios = IKAIOSBurnRecordSource(kaiosToken);
    }

    function mintFromMaturedProof(bytes32 proofId) external returns (address beneficiary, uint256 amount) {
        address wormhole = organRegistry.organ(ORGAN_WORMHOLE_511111);
        if (msg.sender != wormhole || wormhole == address(0)) revert OnlyCurrentWormhole(msg.sender);
        if (maturedProofMinted[proofId]) revert ProofAlreadyUsed(proofId);

        IKAIOSBurnRecordSource.AlchemyBurnRecord memory burnRecord = kaios.alchemyBurnRecord(proofId);
        if (
            burnRecord.owner == address(0) ||
            burnRecord.beneficiary == address(0) ||
            burnRecord.furnace == address(0) ||
            burnRecord.expectedKufo == 0
        ) revert InvalidLineageProof(proofId);
        IAlchemyFurnaceProofSource furnace = IAlchemyFurnaceProofSource(burnRecord.furnace);
        IAlchemyFurnaceProofSource.Proof memory furnaceProof = furnace.proof(proofId);
        if (
            !furnaceProof.consumed ||
            furnace.currentEpoch() < furnaceProof.maturityEpoch ||
            furnaceProof.owner != burnRecord.owner ||
            furnaceProof.beneficiary != burnRecord.beneficiary ||
            furnaceProof.kaiosBurned != burnRecord.kaiosBurned ||
            furnaceProof.kufoAmount != burnRecord.expectedKufo
        ) revert InvalidLineageProof(proofId);

        beneficiary = burnRecord.beneficiary;
        amount = burnRecord.expectedKufo;
        maturedProofMinted[proofId] = true;
        totalMintedFromKaios += amount;
        _mint(beneficiary, amount);
        emit MaturedProofMinted(proofId, beneficiary, amount);
    }

    function burnForCarrier(
        address owner,
        address beneficiary,
        uint256 kufoAmount,
        bytes32 carrierProofId
    ) external returns (uint256 expectedKship) {
        address converter = organRegistry.organ(ORGAN_KSHIP_CONVERTER);
        if (msg.sender != converter || converter == address(0)) {
            revert OnlyCurrentKshipConverter(msg.sender);
        }
        if (owner == address(0) || beneficiary == address(0)) revert ZeroAddress();
        if (kufoAmount == 0) revert ZeroAmount();
        if (carrierProofRecorded[carrierProofId]) revert ProofAlreadyUsed(carrierProofId);

        uint256 currentAllowance = allowance(owner, msg.sender);
        if (currentAllowance < kufoAmount) {
            revert InsufficientHolderAllowance(currentAllowance, kufoAmount);
        }

        carrierProofRecorded[carrierProofId] = true;
        expectedKship = kufoAmount * KSHIP_PER_KUFO;
        _spendAllowance(owner, msg.sender, kufoAmount);
        _burn(owner, kufoAmount);
        totalBurnedForKship += kufoAmount;
        _carrierBurnRecords[carrierProofId] = CarrierBurnRecord({
            owner: owner,
            beneficiary: beneficiary,
            converter: msg.sender,
            kufoBurned: kufoAmount,
            expectedKship: expectedKship
        });
        emit KUFOBurnedForCarrier(carrierProofId, owner, beneficiary, kufoAmount, expectedKship);
    }

    function carrierBurnRecord(bytes32 proofId) external view returns (CarrierBurnRecord memory) {
        return _carrierBurnRecords[proofId];
    }

    function conservationInvariantHolds() external view returns (bool) {
        return totalSupply() + totalBurnedForKship == totalMintedFromKaios;
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped)
    {
        super._update(from, to, value);
    }
}
