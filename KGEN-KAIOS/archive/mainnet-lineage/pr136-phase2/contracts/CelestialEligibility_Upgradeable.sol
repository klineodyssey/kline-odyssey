// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {LingxiaoBankModuleBaseUpgradeable} from "./LingxiaoBankModuleBaseUpgradeable.sol";
import {ICelestialEligibility} from "./interfaces/ICelestialEligibility.sol";
import {IKAIOSAlchemyFurnaceProof} from "./interfaces/IKAIOSAlchemyFurnaceProof.sol";

/**
 * @title CelestialEligibility_Upgradeable
 * @notice Species-neutral Life, contribution and single-proof mass qualification ledger.
 * @dev Passing the 5,000,000 KAIOS single-burn threshold is only one input to
 *      civilization review. This contract has no Seat500 call and cannot assign a seat.
 */
contract CelestialEligibility_Upgradeable is
    LingxiaoBankModuleBaseUpgradeable,
    ICelestialEligibility
{
    bytes32 public constant MODULE_ID = keccak256("KAIOS.BANK.MODULE.CELESTIAL_ELIGIBILITY");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant CONTRIBUTION_VERIFIER_ROLE = keccak256("CONTRIBUTION_VERIFIER_ROLE");
    uint256 public constant MASS_THRESHOLD_KAIOS = 5_000_000 ether;
    uint256 public constant KUFO_PER_KAIOS = 1_000;

    enum ReviewStatus {
        NONE,
        MASS_THRESHOLD_PASSED,
        CIVILIZATION_REVIEW,
        ELIGIBLE_FOR_REVIEW,
        APPROVED,
        REJECTED,
        REVOKED
    }

    enum ContributionStatus {
        NONE,
        VERIFIED,
        REVOKED
    }

    struct LifeProfile {
        address beneficiary;
        bool active;
        bool canRedeemReserve;
        uint64 boundAt;
        uint64 activeContributionCount;
    }

    struct ConstitutionRecord {
        bytes32 evidenceHash;
        address verifier;
        uint64 createdAt;
        bool verified;
    }

    struct ContributionRecord {
        bytes32 lifeId;
        bytes32 category;
        bytes32 evidenceHash;
        address issuer;
        uint64 createdAt;
        ContributionStatus status;
    }

    struct BurnCandidate {
        bytes32 proofId;
        bytes32 lifeId;
        address owner;
        address beneficiary;
        uint256 kaiosBurned;
        bytes32 destinationCode;
        uint64 burnEpoch;
        uint64 maturityEpoch;
        uint64 submittedAt;
        ReviewStatus status;
        bytes32 reviewEvidenceHash;
    }

    IKAIOSAlchemyFurnaceProof public furnace;
    bytes32 public requiredDestinationCode;
    uint256 public candidateCount;
    uint256 public contributionCount;
    bool public paused;
    mapping(bytes32 lifeId => LifeProfile) private _lifeProfiles;
    mapping(bytes32 lifeId => ConstitutionRecord) private _constitutionRecords;
    mapping(bytes32 contributionId => ContributionRecord) private _contributions;
    mapping(bytes32 proofId => BurnCandidate) private _candidates;
    mapping(bytes32 proofId => bool) public proofSubmitted;
    mapping(bytes32 lifeId => bytes32 proofId) public lifeCandidateProof;

    error EligibilityIsPaused();
    error InvalidRecord();
    error LifeNotActive(bytes32 lifeId);
    error UnknownAlchemyProof(bytes32 proofId);
    error WrongLifeId(bytes32 expected, bytes32 actual);
    error WrongBeneficiary(address expected, address actual);
    error WrongDestinationCode(bytes32 expected, bytes32 actual);
    error MassThresholdNotMet(uint256 actual, uint256 required);
    error InvalidMaturity(uint64 burnEpoch, uint64 maturityEpoch);
    error ProofAlreadySubmitted(bytes32 proofId);
    error LifeAlreadyHasCandidate(bytes32 lifeId, bytes32 proofId);
    error InvalidStatus(ReviewStatus current);
    error CivilizationEvidenceIncomplete(bytes32 lifeId);
    error NotVerifier(address account);

    event EligibilityInitialized(
        address indexed furnace,
        bytes32 indexed requiredDestinationCode,
        address indexed pauser
    );
    event LifeBound(bytes32 indexed lifeId, address indexed beneficiary, bool active);
    event ReserveRedemptionEligibilitySet(bytes32 indexed lifeId, bool eligible);
    event ConstitutionHistoryRecorded(
        bytes32 indexed lifeId,
        bytes32 indexed evidenceHash,
        address indexed verifier,
        bool verified
    );
    event ContributionRecorded(
        bytes32 indexed contributionId,
        bytes32 indexed lifeId,
        bytes32 indexed category,
        bytes32 evidenceHash,
        address issuer
    );
    event ContributionStatusChanged(
        bytes32 indexed contributionId,
        ContributionStatus previousStatus,
        ContributionStatus newStatus
    );
    event AlchemyMassThresholdPassed(
        bytes32 indexed proofId,
        bytes32 indexed lifeId,
        address indexed beneficiary,
        uint256 kaiosBurned,
        uint64 burnEpoch,
        uint64 maturityEpoch
    );
    event CandidateStatusChanged(
        bytes32 indexed proofId,
        bytes32 indexed lifeId,
        ReviewStatus previousStatus,
        ReviewStatus newStatus,
        bytes32 evidenceHash
    );
    event EligibilityPaused(address indexed account);
    event EligibilityUnpaused(address indexed account);

    function initialize(
        address bankAddress,
        address governance,
        address upgrader,
        address pauser,
        address formalFurnace,
        bytes32 specialDestinationCode
    ) external initializer {
        if (pauser == address(0) || formalFurnace == address(0)) revert ZeroAddress();
        if (formalFurnace.code.length == 0) revert NotAContract(formalFurnace);
        if (specialDestinationCode == bytes32(0)) revert InvalidRecord();
        __LingxiaoBankModule_init(bankAddress, governance, upgrader, MODULE_ID);
        furnace = IKAIOSAlchemyFurnaceProof(formalFurnace);
        if (furnace.kaios() != bank.kaios()) revert InvalidRecord();
        requiredDestinationCode = specialDestinationCode;
        _grantRole(PAUSER_ROLE, pauser);
        emit EligibilityInitialized(formalFurnace, specialDestinationCode, pauser);
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }

    function lifeProfile(bytes32 lifeId) external view returns (LifeProfile memory) {
        return _lifeProfiles[lifeId];
    }

    function constitutionRecord(bytes32 lifeId)
        external
        view
        returns (ConstitutionRecord memory)
    {
        return _constitutionRecords[lifeId];
    }

    function contribution(bytes32 contributionId)
        external
        view
        returns (ContributionRecord memory)
    {
        return _contributions[contributionId];
    }

    function candidate(bytes32 proofId) external view returns (BurnCandidate memory) {
        return _candidates[proofId];
    }

    function canonicalBeneficiary(bytes32 lifeId) external view returns (address) {
        LifeProfile storage profile = _lifeProfiles[lifeId];
        return profile.active ? profile.beneficiary : address(0);
    }

    function redemptionEligible(bytes32 lifeId) external view returns (bool) {
        LifeProfile storage profile = _lifeProfiles[lifeId];
        return profile.active && profile.canRedeemReserve;
    }

    function civilizationQualified(bytes32 lifeId) public view returns (bool) {
        LifeProfile storage profile = _lifeProfiles[lifeId];
        return profile.active && profile.activeContributionCount != 0
            && _constitutionRecords[lifeId].verified;
    }

    function proofMatured(bytes32 proofId) external view returns (bool) {
        BurnCandidate storage stored = _candidates[proofId];
        return stored.status != ReviewStatus.NONE && furnace.currentEpoch() >= stored.maturityEpoch;
    }

    function bindLife(bytes32 lifeId, address beneficiary, bool active)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        if (paused) revert EligibilityIsPaused();
        if (lifeId == bytes32(0) || beneficiary == address(0)) revert InvalidRecord();
        LifeProfile storage profile = _lifeProfiles[lifeId];
        profile.beneficiary = beneficiary;
        profile.active = active;
        profile.boundAt = uint64(block.timestamp);
        emit LifeBound(lifeId, beneficiary, active);
    }

    function setReserveRedemptionEligibility(bytes32 lifeId, bool eligible)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        if (paused) revert EligibilityIsPaused();
        if (!_lifeProfiles[lifeId].active) revert LifeNotActive(lifeId);
        _lifeProfiles[lifeId].canRedeemReserve = eligible;
        emit ReserveRedemptionEligibilitySet(lifeId, eligible);
    }

    function setContributionVerifier(address verifier, bool enabled)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        if (paused) revert EligibilityIsPaused();
        if (verifier == address(0)) revert ZeroAddress();
        if (enabled) {
            _grantRole(CONTRIBUTION_VERIFIER_ROLE, verifier);
        } else {
            _revokeRole(CONTRIBUTION_VERIFIER_ROLE, verifier);
        }
    }

    function recordConstitutionHistory(bytes32 lifeId, bytes32 evidenceHash, bool verified)
        external
    {
        _requireVerifier();
        if (paused) revert EligibilityIsPaused();
        if (!_lifeProfiles[lifeId].active) revert LifeNotActive(lifeId);
        if (evidenceHash == bytes32(0)) revert InvalidRecord();
        _constitutionRecords[lifeId] = ConstitutionRecord({
            evidenceHash: evidenceHash,
            verifier: msg.sender,
            createdAt: uint64(block.timestamp),
            verified: verified
        });
        emit ConstitutionHistoryRecorded(lifeId, evidenceHash, msg.sender, verified);
    }

    function recordContribution(
        bytes32 contributionId,
        bytes32 lifeId,
        bytes32 category,
        bytes32 evidenceHash
    ) external {
        _requireVerifier();
        if (paused) revert EligibilityIsPaused();
        if (!_lifeProfiles[lifeId].active) revert LifeNotActive(lifeId);
        if (
            contributionId == bytes32(0) || category == bytes32(0)
                || evidenceHash == bytes32(0) || _contributions[contributionId].status != ContributionStatus.NONE
        ) revert InvalidRecord();
        _contributions[contributionId] = ContributionRecord({
            lifeId: lifeId,
            category: category,
            evidenceHash: evidenceHash,
            issuer: msg.sender,
            createdAt: uint64(block.timestamp),
            status: ContributionStatus.VERIFIED
        });
        unchecked {
            ++contributionCount;
            ++_lifeProfiles[lifeId].activeContributionCount;
        }
        emit ContributionRecorded(contributionId, lifeId, category, evidenceHash, msg.sender);
    }

    function setContributionStatus(bytes32 contributionId, ContributionStatus newStatus)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        if (paused) revert EligibilityIsPaused();
        ContributionRecord storage stored = _contributions[contributionId];
        ContributionStatus previous = stored.status;
        if (
            previous == ContributionStatus.NONE || newStatus == ContributionStatus.NONE
                || previous == newStatus
        ) revert InvalidRecord();
        if (previous == ContributionStatus.VERIFIED) {
            --_lifeProfiles[stored.lifeId].activeContributionCount;
        } else {
            ++_lifeProfiles[stored.lifeId].activeContributionCount;
        }
        stored.status = newStatus;
        emit ContributionStatusChanged(contributionId, previous, newStatus);
    }

    function submitAlchemyMassProof(bytes32 proofId, bytes32 lifeId) external {
        if (paused) revert EligibilityIsPaused();
        if (proofId == bytes32(0) || lifeId == bytes32(0)) revert InvalidRecord();
        if (proofSubmitted[proofId]) revert ProofAlreadySubmitted(proofId);
        if (!_lifeProfiles[lifeId].active) revert LifeNotActive(lifeId);
        if (lifeCandidateProof[lifeId] != bytes32(0)) {
            revert LifeAlreadyHasCandidate(lifeId, lifeCandidateProof[lifeId]);
        }
        IKAIOSAlchemyFurnaceProof.Proof memory source = furnace.proof(proofId);
        if (source.owner == address(0)) revert UnknownAlchemyProof(proofId);
        if (source.lifeId != lifeId) revert WrongLifeId(lifeId, source.lifeId);
        address beneficiary = _lifeProfiles[lifeId].beneficiary;
        if (source.beneficiary != beneficiary) {
            revert WrongBeneficiary(beneficiary, source.beneficiary);
        }
        if (source.destinationCode != requiredDestinationCode) {
            revert WrongDestinationCode(requiredDestinationCode, source.destinationCode);
        }
        if (source.kaiosBurned < MASS_THRESHOLD_KAIOS) {
            revert MassThresholdNotMet(source.kaiosBurned, MASS_THRESHOLD_KAIOS);
        }
        uint64 maturationEpochs = furnace.MATURATION_EPOCHS();
        if (
            source.burnEpoch == 0 || source.maturityEpoch != source.burnEpoch + maturationEpochs
                || source.kufoAmount != source.kaiosBurned * KUFO_PER_KAIOS
        ) revert InvalidMaturity(source.burnEpoch, source.maturityEpoch);

        proofSubmitted[proofId] = true;
        lifeCandidateProof[lifeId] = proofId;
        unchecked {
            ++candidateCount;
        }
        _candidates[proofId] = BurnCandidate({
            proofId: proofId,
            lifeId: lifeId,
            owner: source.owner,
            beneficiary: source.beneficiary,
            kaiosBurned: source.kaiosBurned,
            destinationCode: source.destinationCode,
            burnEpoch: source.burnEpoch,
            maturityEpoch: source.maturityEpoch,
            submittedAt: uint64(block.timestamp),
            status: ReviewStatus.MASS_THRESHOLD_PASSED,
            reviewEvidenceHash: bytes32(0)
        });
        emit AlchemyMassThresholdPassed(
            proofId,
            lifeId,
            source.beneficiary,
            source.kaiosBurned,
            source.burnEpoch,
            source.maturityEpoch
        );
    }

    function beginCivilizationReview(bytes32 proofId, bytes32 evidenceHash)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        if (paused) revert EligibilityIsPaused();
        _transition(proofId, ReviewStatus.MASS_THRESHOLD_PASSED, ReviewStatus.CIVILIZATION_REVIEW, evidenceHash);
    }

    function markEligibleForReview(bytes32 proofId, bytes32 evidenceHash)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        if (paused) revert EligibilityIsPaused();
        BurnCandidate storage stored = _candidates[proofId];
        if (!civilizationQualified(stored.lifeId)) {
            revert CivilizationEvidenceIncomplete(stored.lifeId);
        }
        _transition(proofId, ReviewStatus.CIVILIZATION_REVIEW, ReviewStatus.ELIGIBLE_FOR_REVIEW, evidenceHash);
    }

    function approveCandidate(bytes32 proofId, bytes32 evidenceHash)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        if (paused) revert EligibilityIsPaused();
        _transition(proofId, ReviewStatus.ELIGIBLE_FOR_REVIEW, ReviewStatus.APPROVED, evidenceHash);
    }

    function rejectCandidate(bytes32 proofId, bytes32 evidenceHash)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        if (paused) revert EligibilityIsPaused();
        BurnCandidate storage stored = _candidates[proofId];
        if (
            stored.status == ReviewStatus.NONE || stored.status == ReviewStatus.APPROVED
                || stored.status == ReviewStatus.REJECTED || stored.status == ReviewStatus.REVOKED
        ) revert InvalidStatus(stored.status);
        _setStatus(stored, ReviewStatus.REJECTED, evidenceHash);
    }

    function revokeCandidate(bytes32 proofId, bytes32 evidenceHash)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        BurnCandidate storage stored = _candidates[proofId];
        if (stored.status != ReviewStatus.APPROVED) revert InvalidStatus(stored.status);
        _setStatus(stored, ReviewStatus.REVOKED, evidenceHash);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        paused = true;
        emit EligibilityPaused(msg.sender);
    }

    function unpause() external onlyRole(GOVERNANCE_ROLE) {
        paused = false;
        emit EligibilityUnpaused(msg.sender);
    }

    function _requireVerifier() private view {
        if (
            !hasRole(GOVERNANCE_ROLE, msg.sender)
                && !hasRole(CONTRIBUTION_VERIFIER_ROLE, msg.sender)
        ) revert NotVerifier(msg.sender);
    }

    function _transition(
        bytes32 proofId,
        ReviewStatus expected,
        ReviewStatus next,
        bytes32 evidenceHash
    ) private {
        BurnCandidate storage stored = _candidates[proofId];
        if (stored.status != expected) revert InvalidStatus(stored.status);
        _setStatus(stored, next, evidenceHash);
    }

    function _setStatus(
        BurnCandidate storage stored,
        ReviewStatus next,
        bytes32 evidenceHash
    ) private {
        if (evidenceHash == bytes32(0)) revert InvalidRecord();
        ReviewStatus previous = stored.status;
        stored.status = next;
        stored.reviewEvidenceHash = evidenceHash;
        emit CandidateStatusChanged(stored.proofId, stored.lifeId, previous, next, evidenceHash);
    }

    uint256[39] private __gap;
}
