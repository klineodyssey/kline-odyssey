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
        uint256 timestamp;
    }

    function carrierBurnRecord(bytes32 proofId) external view returns (CarrierBurnRecord memory);
}

/**
 * @title KSHIP
 * @notice Milligram-scale propulsion token minted only from matured KUFO decay.
 * @dev KSHIP does not expire. Only an exact holder authorization may be consumed by the registered UFO organ.
 */
contract KSHIP is ERC20, ERC20Capped {
    bytes32 public constant ORGAN_KSHIP_CONVERTER = keccak256("KAIOS.ORGAN.KSHIP.CONVERTER");
    bytes32 public constant ORGAN_UFO_FUEL_CONSUMER = keccak256("KAIOS.ORGAN.UFO.FUEL.CONSUMER");
    uint256 public constant MAX_SUPPLY = 72_000_000_000_000_000 ether;

    struct PropulsionAuthorization {
        address holder;
        address consumer;
        bytes32 ufoLifeId;
        bytes32 tripId;
        address beneficiary;
        uint256 amount;
        bool consumed;
    }

    IKAIOSOrganRegistry public immutable organRegistry;
    IKUFOBurnRecordSource public immutable kufo;
    uint256 public totalMintedFromKufo;
    uint256 public totalBurnedForPropulsion;
    mapping(bytes32 => bool) public carrierProofMinted;
    mapping(bytes32 => PropulsionAuthorization) private _propulsionAuthorizations;

    error ZeroAddress();
    error ZeroAmount();
    error OnlyCurrentKshipConverter(address caller);
    error OnlyCurrentUfoFuelConsumer(address caller);
    error UfoFuelConsumerUnavailable();
    error ProofAlreadyUsed(bytes32 proofId);
    error TripAlreadyUsed(bytes32 tripId);
    error InvalidLineageProof(bytes32 proofId);
    error IncorrectExactAllowance(uint256 currentAllowance, uint256 requiredAllowance);
    error PropulsionAuthorizationMismatch(bytes32 tripId);

    event CarrierProofMinted(bytes32 indexed proofId, address indexed beneficiary, uint256 kshipAmount);
    event PropulsionAuthorized(
        bytes32 indexed tripId,
        bytes32 indexed ufoLifeId,
        address indexed holder,
        address consumer,
        address beneficiary,
        uint256 amount
    );
    event PropulsionConsumed(
        bytes32 indexed tripId,
        bytes32 indexed ufoLifeId,
        address indexed holder,
        address consumer,
        address beneficiary,
        uint256 amount
    );

    constructor(address registry, address kufoToken)
        ERC20("KSHIP Propulsion Mass", "KSHIP")
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

    function authorizePropulsion(
        bytes32 ufoLifeId,
        bytes32 tripId,
        address beneficiary,
        uint256 amount
    ) external {
        address consumer = organRegistry.organ(ORGAN_UFO_FUEL_CONSUMER);
        if (consumer == address(0)) revert UfoFuelConsumerUnavailable();
        if (beneficiary == address(0)) revert ZeroAddress();
        if (ufoLifeId == bytes32(0) || tripId == bytes32(0)) revert InvalidLineageProof(tripId);
        if (amount == 0) revert ZeroAmount();
        if (_propulsionAuthorizations[tripId].holder != address(0)) revert TripAlreadyUsed(tripId);
        uint256 currentAllowance = allowance(msg.sender, consumer);
        if (currentAllowance != amount) revert IncorrectExactAllowance(currentAllowance, amount);

        _propulsionAuthorizations[tripId] = PropulsionAuthorization({
            holder: msg.sender,
            consumer: consumer,
            ufoLifeId: ufoLifeId,
            tripId: tripId,
            beneficiary: beneficiary,
            amount: amount,
            consumed: false
        });
        emit PropulsionAuthorized(tripId, ufoLifeId, msg.sender, consumer, beneficiary, amount);
    }

    function consumePropulsion(
        address holder,
        bytes32 ufoLifeId,
        bytes32 tripId,
        address beneficiary,
        uint256 amount
    ) external {
        address consumer = organRegistry.organ(ORGAN_UFO_FUEL_CONSUMER);
        if (consumer == address(0)) revert UfoFuelConsumerUnavailable();
        if (msg.sender != consumer) revert OnlyCurrentUfoFuelConsumer(msg.sender);
        PropulsionAuthorization storage authorization = _propulsionAuthorizations[tripId];
        if (
            authorization.consumed ||
            authorization.holder != holder ||
            authorization.consumer != msg.sender ||
            authorization.ufoLifeId != ufoLifeId ||
            authorization.beneficiary != beneficiary ||
            authorization.amount != amount
        ) revert PropulsionAuthorizationMismatch(tripId);
        uint256 currentAllowance = allowance(holder, msg.sender);
        if (currentAllowance != amount) revert IncorrectExactAllowance(currentAllowance, amount);

        authorization.consumed = true;
        _spendAllowance(holder, msg.sender, amount);
        _burn(holder, amount);
        totalBurnedForPropulsion += amount;
        emit PropulsionConsumed(tripId, ufoLifeId, holder, msg.sender, beneficiary, amount);
    }

    function propulsionAuthorization(bytes32 tripId)
        external
        view
        returns (PropulsionAuthorization memory)
    {
        return _propulsionAuthorizations[tripId];
    }

    function conservationInvariantHolds() external view returns (bool) {
        return totalSupply() + totalBurnedForPropulsion == totalMintedFromKufo;
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped)
    {
        super._update(from, to, value);
    }
}
