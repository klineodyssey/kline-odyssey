// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

interface IKUFOBurnRecordSource {
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
 * @title KSHIP
 * @notice Zero-genesis, zero-native-tax milligram-scale carrier accounting token.
 */
contract KSHIP is ERC20, ERC20Capped {
    bytes32 public constant ORGAN_KSHIP_CONVERTER = keccak256("KAIOS.ORGAN.KSHIP.CONVERTER");
    uint256 public constant MAX_SUPPLY = 72_000_000_000_000_000 ether;

    IKAIOSOrganRegistry public immutable organRegistry;
    IKUFOBurnRecordSource public immutable kufo;
    uint256 public totalMintedFromKufo;
    mapping(bytes32 => bool) public carrierProofMinted;

    error ZeroAddress();
    error ZeroAmount();
    error OnlyCurrentKshipConverter(address caller);
    error ProofAlreadyUsed(bytes32 proofId);
    error InvalidLineageProof(bytes32 proofId);

    event CarrierProofMinted(bytes32 indexed proofId, address indexed beneficiary, uint256 kshipAmount);

    constructor(address registry, address kufoToken)
        ERC20("KSHIP Carrier Mass", "KSHIP")
        ERC20Capped(MAX_SUPPLY)
    {
        if (registry == address(0) || kufoToken == address(0)) revert ZeroAddress();
        organRegistry = IKAIOSOrganRegistry(registry);
        kufo = IKUFOBurnRecordSource(kufoToken);
    }

    function mintFromCarrierProof(bytes32 proofId) external returns (address beneficiary, uint256 amount) {
        address converter = organRegistry.organ(ORGAN_KSHIP_CONVERTER);
        if (msg.sender != converter || converter == address(0)) {
            revert OnlyCurrentKshipConverter(msg.sender);
        }
        if (carrierProofMinted[proofId]) revert ProofAlreadyUsed(proofId);
        IKUFOBurnRecordSource.CarrierBurnRecord memory burnRecord = kufo.carrierBurnRecord(proofId);
        if (
            burnRecord.owner == address(0) ||
            burnRecord.beneficiary == address(0) ||
            burnRecord.converter != msg.sender ||
            burnRecord.kufoBurned == 0 ||
            burnRecord.expectedKship != burnRecord.kufoBurned * 1_000
        ) revert InvalidLineageProof(proofId);
        beneficiary = burnRecord.beneficiary;
        amount = burnRecord.expectedKship;
        carrierProofMinted[proofId] = true;
        totalMintedFromKufo += amount;
        _mint(beneficiary, amount);
        emit CarrierProofMinted(proofId, beneficiary, amount);
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped)
    {
        super._update(from, to, value);
    }
}
