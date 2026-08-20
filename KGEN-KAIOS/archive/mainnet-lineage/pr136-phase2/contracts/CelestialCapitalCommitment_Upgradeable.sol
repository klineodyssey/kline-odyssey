// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {LingxiaoBankModuleBaseUpgradeable} from "./LingxiaoBankModuleBaseUpgradeable.sol";
import {ICelestialEligibility} from "./interfaces/ICelestialEligibility.sol";

/**
 * @title CelestialCapitalCommitment_Upgradeable
 * @notice Non-burning KAIOS capital liability for Wormhole-seat review eligibility.
 * @dev Principal stays in this module, never becomes 18888 spendable bank equity, and
 *      can only return to the beneficiary fixed by the formal Life record after the
 *      commitment's checkpointed lock expires. V1 has no forfeiture path.
 */
contract CelestialCapitalCommitment_Upgradeable is LingxiaoBankModuleBaseUpgradeable {
    using SafeERC20 for IERC20;

    bytes32 public constant MODULE_ID = keccak256("KAIOS.BANK.MODULE.CELESTIAL_CAPITAL_COMMITMENT");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    uint256 public constant CAPITAL_THRESHOLD_KAIOS = 5_000_000 ether;

    enum CommitmentStatus {
        NONE,
        COMMITTED,
        ELIGIBLE_FOR_WORMHOLE_SEAT_REVIEW,
        APPROVED,
        REJECTED,
        RELEASED
    }

    struct CapitalCommitment {
        bytes32 commitmentId;
        bytes32 lifeId;
        address depositor;
        address beneficiary;
        uint256 committedPrincipal;
        uint64 createdAt;
        uint64 releaseAt;
        CommitmentStatus status;
        bytes32 reviewEvidenceHash;
    }

    IERC20 public kaios;
    ICelestialEligibility public eligibility;
    uint64 public minimumLockPeriod;
    bool public paused;
    uint256 public totalCommittedPrincipal;
    uint256 public totalReleasedPrincipal;
    uint256 public commitmentCount;
    mapping(bytes32 commitmentId => CapitalCommitment) private _commitments;

    error CommitmentPaused();
    error InvalidCommitment();
    error CommitmentAlreadyExists(bytes32 commitmentId);
    error CapitalThresholdNotMet(uint256 actual, uint256 required);
    error NotCanonicalBeneficiary(address caller, address beneficiary);
    error UnexpectedTokenReceipt(uint256 expected, uint256 actual);
    error InvalidStatus(CommitmentStatus current);
    error CivilizationEvidenceIncomplete(bytes32 lifeId);
    error PrincipalStillLocked(uint64 releaseAt, uint64 currentTime);
    error PrincipalInvariantViolation(uint256 balance, uint256 liability);

    event CapitalCommitmentInitialized(
        address indexed kaios,
        address indexed eligibility,
        address indexed pauser,
        uint64 minimumLockPeriod
    );
    event MinimumLockPeriodUpdated(uint64 previousPeriod, uint64 newPeriod);
    event CapitalCommitted(
        bytes32 indexed commitmentId,
        bytes32 indexed lifeId,
        address indexed beneficiary,
        address depositor,
        uint256 principal,
        uint64 releaseAt
    );
    event CapitalReviewStatusChanged(
        bytes32 indexed commitmentId,
        bytes32 indexed lifeId,
        CommitmentStatus previousStatus,
        CommitmentStatus newStatus,
        bytes32 evidenceHash
    );
    event CapitalReleased(
        bytes32 indexed commitmentId,
        bytes32 indexed lifeId,
        address indexed beneficiary,
        uint256 principal
    );
    event CapitalCommitmentPaused(address indexed account);
    event CapitalCommitmentUnpaused(address indexed account);

    function initialize(
        address bankAddress,
        address governance,
        address upgrader,
        address pauser,
        address canonicalKaios,
        address eligibilitySource,
        uint64 initialMinimumLockPeriod
    ) external initializer {
        if (pauser == address(0) || canonicalKaios == address(0) || eligibilitySource == address(0)) {
            revert ZeroAddress();
        }
        if (canonicalKaios.code.length == 0) revert NotAContract(canonicalKaios);
        if (eligibilitySource.code.length == 0) revert NotAContract(eligibilitySource);
        if (initialMinimumLockPeriod == 0) revert InvalidCommitment();
        __LingxiaoBankModule_init(bankAddress, governance, upgrader, MODULE_ID);
        if (bank.kaios() != canonicalKaios) revert InvalidCommitment();
        kaios = IERC20(canonicalKaios);
        eligibility = ICelestialEligibility(eligibilitySource);
        minimumLockPeriod = initialMinimumLockPeriod;
        _grantRole(PAUSER_ROLE, pauser);
        emit CapitalCommitmentInitialized(
            canonicalKaios,
            eligibilitySource,
            pauser,
            initialMinimumLockPeriod
        );
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }

    function commitment(bytes32 commitmentId)
        external
        view
        returns (CapitalCommitment memory)
    {
        return _commitments[commitmentId];
    }

    function kaiosBalance() public view returns (uint256) {
        return kaios.balanceOf(address(this));
    }

    function liabilityInvariantHolds() external view returns (bool) {
        return kaios.balanceOf(address(this)) >= totalCommittedPrincipal;
    }

    function setMinimumLockPeriod(uint64 newMinimumLockPeriod)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        if (newMinimumLockPeriod == 0) revert InvalidCommitment();
        uint64 previous = minimumLockPeriod;
        minimumLockPeriod = newMinimumLockPeriod;
        emit MinimumLockPeriodUpdated(previous, newMinimumLockPeriod);
    }

    function commitCapital(bytes32 commitmentId, bytes32 lifeId, uint256 amount)
        external
        nonReentrant
    {
        if (paused) revert CommitmentPaused();
        if (commitmentId == bytes32(0) || lifeId == bytes32(0)) revert InvalidCommitment();
        if (_commitments[commitmentId].status != CommitmentStatus.NONE) {
            revert CommitmentAlreadyExists(commitmentId);
        }
        if (amount < CAPITAL_THRESHOLD_KAIOS) {
            revert CapitalThresholdNotMet(amount, CAPITAL_THRESHOLD_KAIOS);
        }
        address beneficiary = eligibility.canonicalBeneficiary(lifeId);
        if (beneficiary == address(0) || msg.sender != beneficiary) {
            revert NotCanonicalBeneficiary(msg.sender, beneficiary);
        }

        uint256 balanceBefore = kaios.balanceOf(address(this));
        kaios.safeTransferFrom(msg.sender, address(this), amount);
        uint256 balanceAfter = kaios.balanceOf(address(this));
        if (balanceAfter - balanceBefore != amount) {
            revert UnexpectedTokenReceipt(amount, balanceAfter - balanceBefore);
        }

        uint64 releaseAt = uint64(block.timestamp) + minimumLockPeriod;
        _commitments[commitmentId] = CapitalCommitment({
            commitmentId: commitmentId,
            lifeId: lifeId,
            depositor: msg.sender,
            beneficiary: beneficiary,
            committedPrincipal: amount,
            createdAt: uint64(block.timestamp),
            releaseAt: releaseAt,
            status: CommitmentStatus.COMMITTED,
            reviewEvidenceHash: bytes32(0)
        });
        totalCommittedPrincipal += amount;
        unchecked {
            ++commitmentCount;
        }
        emit CapitalCommitted(
            commitmentId,
            lifeId,
            beneficiary,
            msg.sender,
            amount,
            releaseAt
        );
    }

    function submitForWormholeSeatReview(bytes32 commitmentId, bytes32 evidenceHash)
        external
    {
        if (paused) revert CommitmentPaused();
        CapitalCommitment storage stored = _commitments[commitmentId];
        if (stored.status != CommitmentStatus.COMMITTED) revert InvalidStatus(stored.status);
        if (!eligibility.civilizationQualified(stored.lifeId)) {
            revert CivilizationEvidenceIncomplete(stored.lifeId);
        }
        _setStatus(
            stored,
            CommitmentStatus.ELIGIBLE_FOR_WORMHOLE_SEAT_REVIEW,
            evidenceHash
        );
    }

    function approveCommitmentCandidate(bytes32 commitmentId, bytes32 evidenceHash)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        if (paused) revert CommitmentPaused();
        CapitalCommitment storage stored = _commitments[commitmentId];
        if (stored.status != CommitmentStatus.ELIGIBLE_FOR_WORMHOLE_SEAT_REVIEW) {
            revert InvalidStatus(stored.status);
        }
        _setStatus(stored, CommitmentStatus.APPROVED, evidenceHash);
    }

    function rejectCommitmentCandidate(bytes32 commitmentId, bytes32 evidenceHash)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        if (paused) revert CommitmentPaused();
        CapitalCommitment storage stored = _commitments[commitmentId];
        if (
            stored.status != CommitmentStatus.COMMITTED
                && stored.status != CommitmentStatus.ELIGIBLE_FOR_WORMHOLE_SEAT_REVIEW
        ) revert InvalidStatus(stored.status);
        _setStatus(stored, CommitmentStatus.REJECTED, evidenceHash);
    }

    function releaseCapital(bytes32 commitmentId) external nonReentrant {
        CapitalCommitment storage stored = _commitments[commitmentId];
        if (
            stored.status == CommitmentStatus.NONE || stored.status == CommitmentStatus.RELEASED
        ) revert InvalidStatus(stored.status);
        if (block.timestamp < stored.releaseAt) {
            revert PrincipalStillLocked(stored.releaseAt, uint64(block.timestamp));
        }
        uint256 principal = stored.committedPrincipal;
        totalCommittedPrincipal -= principal;
        totalReleasedPrincipal += principal;
        stored.status = CommitmentStatus.RELEASED;
        kaios.safeTransfer(stored.beneficiary, principal);
        uint256 balance = kaios.balanceOf(address(this));
        if (balance < totalCommittedPrincipal) {
            revert PrincipalInvariantViolation(balance, totalCommittedPrincipal);
        }
        emit CapitalReleased(commitmentId, stored.lifeId, stored.beneficiary, principal);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        paused = true;
        emit CapitalCommitmentPaused(msg.sender);
    }

    function unpause() external onlyRole(GOVERNANCE_ROLE) {
        paused = false;
        emit CapitalCommitmentUnpaused(msg.sender);
    }

    function _setStatus(
        CapitalCommitment storage stored,
        CommitmentStatus next,
        bytes32 evidenceHash
    ) private {
        if (evidenceHash == bytes32(0)) revert InvalidCommitment();
        CommitmentStatus previous = stored.status;
        stored.status = next;
        stored.reviewEvidenceHash = evidenceHash;
        emit CapitalReviewStatusChanged(
            stored.commitmentId,
            stored.lifeId,
            previous,
            next,
            evidenceHash
        );
    }

    uint256[44] private __gap;
}
