// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
// Engineering revision 2026-11-13: original PR637 9dc02605 / integrated main33967045.
// Exact build commit, source hashes and deployment gates: KAIOS_18911_KUFO_THREE_AUTUMNS_V4.md.

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IKAIOSOrganRegistry} from "./interfaces/IKAIOSOrganRegistry.sol";

interface IKAIOSAlchemyBurnable {
    function KGEN() external view returns (address);
    function ORGAN_REGISTRY() external view returns (address);
    function burnForAlchemy(address owner, address beneficiary, uint256 amount, bytes32 lifeId, bytes32 destinationCode)
        external returns (bytes32 proofId, uint256 expectedKufo);
    function totalSupply() external view returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
}
interface IKUFOImmediateOutput {
    function releaseImmediate(bytes32 proofId) external returns (address beneficiary, uint256 amount);
}
interface ICanonicalKUFO {
    struct MintOrigin {
        address beneficiary;
        uint256 amount;
        uint64 bornAt;
        uint32 birthYear;
        uint8 birthZodiac;
        uint8 birthConstellation;
        uint16 groupId;
        bytes32 calendarHash;
    }
    function kaios() external view returns (address);
    function organRegistry() external view returns (address);
    function calendarHash() external view returns (bytes32);
    function proofMinted(bytes32 proofId) external view returns (bool);
    function mintOrigin(bytes32 proofId) external view returns (MintOrigin memory);
    function totalMintedFromAlchemy() external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title KAIOSAlchemyFurnace
 * @notice Holder-authorized immediate KAIOS burn with canonical KUFO atomic output.
 * @dev KGEN is checked by wallet balance only; it is not transferred or consumed.
 */
contract KAIOSAlchemyFurnace is ReentrancyGuard {
    bytes32 public constant ORGAN_OUTPUT_168888 = keccak256("KAIOS.ORGAN.KUFO.OUTPUT.168888");
    bytes32 public constant DESTINATION_168888 = keccak256("KAIOS.POINT.168888.JINDOUYUN.KUFO.OUTLET");
    uint256 public constant FURNACE_POINT = 18_911;
    uint256 public constant TOKEN_POINT = 511_111;
    uint256 public constant OUTPUT_POINT = 168_888;
    uint256 public constant KAIOS_PER_KGEN = 1_000;
    uint256 public constant KUFO_PER_KAIOS = 1_000;
    uint256 public constant MIN_KAIOS_WEI = 1_000;

    struct Proof {
        address owner;
        address beneficiary;
        uint256 kaiosBurned;
        uint256 requiredKgenBalance;
        uint256 observedKgenBalance;
        uint256 kufoAmount;
        bytes32 lifeId;
        bytes32 destinationCode;
        uint64 createdAt;
        bool consumed;
    }
    struct Baseline {
        uint256 kaiosSupply;
        uint256 ownerKaios;
        uint256 kufoSupply;
        uint256 beneficiaryKufo;
        uint256 totalMinted;
    }
    IKAIOSAlchemyBurnable public immutable kaios;
    IERC20 public immutable kgen;
    IKAIOSOrganRegistry public immutable organRegistry;
    ICanonicalKUFO public immutable canonicalKufo;
    mapping(bytes32 => Proof) private _proofs;

    error ZeroAddress();
    error CanonicalBindingMismatch();
    error AlchemyAmountTooSmall(uint256 provided, uint256 minimum);
    error InexactRatio(uint256 amount);
    error InsufficientKgenBalance(uint256 observed, uint256 required);
    error UnexpectedKufoOutput(uint256 expected, uint256 actual);
    error UnknownProof(bytes32 proofId);
    error ProofAlreadyConsumed(bytes32 proofId);
    error OnlyCurrentOutput(address caller);
    error OutputNotBound();
    error ReleaseResultMismatch(address beneficiary, uint256 amount);
    error CanonicalBurnMissing(bytes32 proofId);
    error CanonicalKufoReleaseMissing(bytes32 proofId);

    event KgenBalanceVerified(bytes32 indexed proofId, address indexed owner, uint256 observedKgenBalance, uint256 requiredKgenBalance);
    event ImmediateAlchemyCreated(bytes32 indexed proofId, address indexed owner, address indexed beneficiary, uint256 kaiosBurned, uint256 kufoAmount, bytes32 destinationCode);
    event ImmediateAlchemyConsumed(bytes32 indexed proofId, address indexed beneficiary, uint256 kufoAmount);

    constructor(address kaiosToken, address kgenToken, address registry, address canonicalKufoToken) {
        if (kaiosToken == address(0) || kgenToken == address(0) || registry == address(0) || canonicalKufoToken == address(0)) revert ZeroAddress();
        ICanonicalKUFO token = ICanonicalKUFO(canonicalKufoToken);
        IKAIOSAlchemyBurnable source = IKAIOSAlchemyBurnable(kaiosToken);
        if (token.kaios() != kaiosToken || token.organRegistry() != registry ||
            source.KGEN() != kgenToken || source.ORGAN_REGISTRY() != registry) revert CanonicalBindingMismatch();
        kaios = IKAIOSAlchemyBurnable(kaiosToken);
        kgen = IERC20(kgenToken);
        organRegistry = IKAIOSOrganRegistry(registry);
        canonicalKufo = token;
    }

    function burnForKufo(uint256 kaiosAmount, address beneficiary, bytes32 lifeId)
        external nonReentrant returns (bytes32 proofId, uint256 expectedKufo)
    {
        if (beneficiary == address(0)) revert ZeroAddress();
        if (kaiosAmount < MIN_KAIOS_WEI) revert AlchemyAmountTooSmall(kaiosAmount, MIN_KAIOS_WEI);
        if (kaiosAmount % KAIOS_PER_KGEN != 0) revert InexactRatio(kaiosAmount);
        uint256 requiredKgen = kaiosAmount / KAIOS_PER_KGEN;
        uint256 observedKgen = kgen.balanceOf(msg.sender);
        if (observedKgen < requiredKgen) revert InsufficientKgenBalance(observedKgen, requiredKgen);
        Baseline memory before = Baseline(kaios.totalSupply(), kaios.balanceOf(msg.sender),
            canonicalKufo.totalSupply(), canonicalKufo.balanceOf(beneficiary), canonicalKufo.totalMintedFromAlchemy());
        (proofId, expectedKufo) = kaios.burnForAlchemy(msg.sender, beneficiary, kaiosAmount, lifeId, DESTINATION_168888);
        uint256 exactKufo = kaiosAmount * KUFO_PER_KAIOS;
        if (expectedKufo != exactKufo) revert UnexpectedKufoOutput(exactKufo, expectedKufo);
        if (before.kaiosSupply < kaiosAmount || before.ownerKaios < kaiosAmount ||
            kaios.totalSupply() != before.kaiosSupply - kaiosAmount ||
            kaios.balanceOf(msg.sender) != before.ownerKaios - kaiosAmount) revert CanonicalBurnMissing(proofId);
        if (_proofs[proofId].owner != address(0) || canonicalKufo.proofMinted(proofId)) revert ProofAlreadyConsumed(proofId);
        _proofs[proofId] = Proof(msg.sender, beneficiary, kaiosAmount, requiredKgen, observedKgen, expectedKufo,
            lifeId, DESTINATION_168888, uint64(block.timestamp), false);
        emit KgenBalanceVerified(proofId, msg.sender, observedKgen, requiredKgen);
        emit ImmediateAlchemyCreated(proofId, msg.sender, beneficiary, kaiosAmount, expectedKufo, DESTINATION_168888);
        address output = organRegistry.organ(ORGAN_OUTPUT_168888);
        if (output == address(0)) revert OutputNotBound();
        (address releasedBeneficiary, uint256 releasedAmount) = IKUFOImmediateOutput(output).releaseImmediate(proofId);
        if (releasedBeneficiary != beneficiary || releasedAmount != expectedKufo) revert ReleaseResultMismatch(releasedBeneficiary, releasedAmount);
        _verifyRelease(proofId, beneficiary, expectedKufo, before);
    }

    function _verifyRelease(bytes32 proofId, address beneficiary, uint256 amount, Baseline memory before) private view {
        ICanonicalKUFO.MintOrigin memory origin = canonicalKufo.mintOrigin(proofId);
        if (!_proofs[proofId].consumed || !canonicalKufo.proofMinted(proofId) ||
            origin.beneficiary != beneficiary || origin.amount != amount || origin.bornAt != block.timestamp ||
            origin.groupId == 0 || origin.calendarHash != canonicalKufo.calendarHash() ||
            canonicalKufo.totalMintedFromAlchemy() != before.totalMinted + amount ||
            canonicalKufo.totalSupply() != before.kufoSupply + amount ||
            canonicalKufo.balanceOf(beneficiary) != before.beneficiaryKufo + amount) revert CanonicalKufoReleaseMissing(proofId);
    }

    function consumeImmediateProof(bytes32 proofId) external returns (address beneficiary, uint256 amount) {
        address output = organRegistry.organ(ORGAN_OUTPUT_168888);
        if (msg.sender != output || output == address(0)) revert OnlyCurrentOutput(msg.sender);
        Proof storage stored = _proofs[proofId];
        if (stored.owner == address(0)) revert UnknownProof(proofId);
        if (stored.consumed) revert ProofAlreadyConsumed(proofId);
        stored.consumed = true;
        beneficiary = stored.beneficiary;
        amount = stored.kufoAmount;
        emit ImmediateAlchemyConsumed(proofId, beneficiary, amount);
    }
    function proof(bytes32 proofId) external view returns (Proof memory) { return _proofs[proofId]; }
}
