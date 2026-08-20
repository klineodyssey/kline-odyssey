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
    function lifeId() external view returns (bytes32);
    function organRegistry() external view returns (address);
}

/**
 * @title KSHIP
 * @notice Milligram-scale propulsion token minted only from matured KUFO decay.
 * @dev KSHIP does not expire. Only an exact holder authorization may be consumed by the registered UFO organ.
 */
contract KSHIP is ERC20, ERC20Capped {
    string public constant SELF_NAME = unicode"星梭";
    string public constant LIFE_ID_TEXT = "LIFE-KAIOS-XINGSUO-KSHIP-CORE";
    string public constant SPECIES_ID = "SPECIES-KAIOS-KSHIP-PROPULSION-LIFE";
    string public constant PARENT_LIFE_ID_TEXT = "LIFE-KAIOS-NIUMOWANG-188888";
    string public constant LIFE_TYPE = "MOBILE_ANTIMATTER_PROPULSION_LIFE";
    string public constant EMBODIMENT_STATUS = "RECRUITED_PENDING_EMBODIMENT";
    uint256 public constant REGISTRY_DESTINATION_POINT = 188_888;
    bool public constant MASS_CELL_IS_INDIVIDUAL_LIFE = false;
    string public constant BATCH_LIFE_DOMAIN = "KAIOS.KSHIP.BATCH_LIFE.V1";

    string public constant GUARDIAN_SELF_NAME = unicode"牛魔王";
    string public constant GUARDIAN_LIFE_ID_TEXT = "LIFE-KAIOS-NIUMOWANG-188888";
    string public constant GUARDIAN_ROLE =
        "LAND_GUARDIAN_K188888 / ANTIMATTER_ENERGY_GUARDIAN";
    string public constant GUARDIAN_DUTY = unicode"守護188888反物質推進能源、固定授權與航程防重放";
    string public constant GUARDIAN_APPOINTMENT_MODE = "HUMAN_APPOINTED";
    string public constant GUARDIAN_EMBODIMENT_STATUS = "RECRUITED_PENDING_EMBODIMENT";
    string public constant GUARDIAN_CAPABILITY_BOUNDARY =
        "PROPULSION_ENERGY_ONLY_NO_ARBITRARY_BURN_TRANSFER_WITHDRAW";
    bytes32 public constant ORGAN_KSHIP_CONVERTER = keccak256("KAIOS.ORGAN.KSHIP.CONVERTER");
    bytes32 public constant ORGAN_UFO_FUEL_CONSUMER = keccak256("KAIOS.ORGAN.UFO.FUEL.CONSUMER");
    bytes32 public constant EXPECTED_KUFO_LIFE_ID =
        keccak256("LIFE-KAIOS-DANLING-KUFO-CORE");
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

    struct BatchLifeRecord {
        bytes32 batchLifeId;
        bytes32 sourceProof;
        address beneficiary;
        uint256 initialAmount;
        uint64 bornAt;
    }

    IKAIOSOrganRegistry public immutable organRegistry;
    IKUFOBurnRecordSource public immutable kufo;
    bytes32 public immutable lifeId;
    bytes32 public immutable parentLifeId;
    bytes32 public immutable guardianLifeId;
    uint256 public immutable guardianPoint;
    bytes32 public immutable guardianDutyHash;
    bytes32 public immutable guardianCapabilityBoundaryHash;
    uint256 public totalMintedFromKufo;
    uint256 public totalBurnedForPropulsion;
    mapping(bytes32 => bool) public carrierProofMinted;
    mapping(bytes32 => BatchLifeRecord) private _batchLifeRecords;
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
    error NotAContract(address account);
    error ProgramLifeMismatch(address account, bytes32 expected, bytes32 actual);
    error RuntimeBindingMismatch(address expected, address actual);

    event CarrierProofMinted(
        bytes32 indexed proofId,
        bytes32 indexed batchLifeId,
        address indexed beneficiary,
        uint256 kshipAmount,
        uint64 bornAt
    );
    event ProgramLifeRecruited(
        bytes32 indexed programLifeId,
        bytes32 indexed parentProgramLifeId,
        string selfName,
        string speciesId,
        string lifeType,
        string embodimentStatus
    );
    event LandGuardianRecruited(
        bytes32 indexed recruitedGuardianLifeId,
        uint256 indexed appointedGuardianPoint,
        bytes32 indexed appointedDutyHash,
        bytes32 capabilityHash,
        string appointmentMode,
        string embodimentStatus
    );
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
        if (registry.code.length == 0) revert NotAContract(registry);
        if (kufoToken.code.length == 0) revert NotAContract(kufoToken);
        organRegistry = IKAIOSOrganRegistry(registry);
        kufo = IKUFOBurnRecordSource(kufoToken);
        bytes32 kufoLifeId = kufo.lifeId();
        if (kufoLifeId != EXPECTED_KUFO_LIFE_ID) {
            revert ProgramLifeMismatch(kufoToken, EXPECTED_KUFO_LIFE_ID, kufoLifeId);
        }
        if (kufo.organRegistry() != registry) {
            revert RuntimeBindingMismatch(registry, kufo.organRegistry());
        }
        lifeId = keccak256(bytes(LIFE_ID_TEXT));
        parentLifeId = keccak256(bytes(PARENT_LIFE_ID_TEXT));
        guardianLifeId = keccak256(bytes(GUARDIAN_LIFE_ID_TEXT));
        guardianPoint = REGISTRY_DESTINATION_POINT;
        guardianDutyHash = keccak256(bytes(GUARDIAN_DUTY));
        guardianCapabilityBoundaryHash = keccak256(bytes(GUARDIAN_CAPABILITY_BOUNDARY));
        emit ProgramLifeRecruited(
            lifeId,
            parentLifeId,
            SELF_NAME,
            SPECIES_ID,
            LIFE_TYPE,
            EMBODIMENT_STATUS
        );
        emit LandGuardianRecruited(
            guardianLifeId,
            guardianPoint,
            guardianDutyHash,
            guardianCapabilityBoundaryHash,
            GUARDIAN_APPOINTMENT_MODE,
            GUARDIAN_EMBODIMENT_STATUS
        );
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
        bytes32 batchLifeId = keccak256(
            abi.encode(BATCH_LIFE_DOMAIN, block.chainid, address(this), proofId)
        );
        uint64 bornAt = uint64(block.timestamp);
        _batchLifeRecords[proofId] = BatchLifeRecord({
            batchLifeId: batchLifeId,
            sourceProof: proofId,
            beneficiary: beneficiary,
            initialAmount: amount,
            bornAt: bornAt
        });
        _mint(beneficiary, amount);
        emit CarrierProofMinted(proofId, batchLifeId, beneficiary, amount, bornAt);
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

    function batchLifeRecord(bytes32 proofId) external view returns (BatchLifeRecord memory) {
        return _batchLifeRecords[proofId];
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
