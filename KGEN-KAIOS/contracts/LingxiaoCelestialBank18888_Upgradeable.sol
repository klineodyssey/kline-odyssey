// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

interface IKAIOSSettlementLineage {
    function KGEN() external view returns (address);
    function LINGXIAO_TREASURY_18888() external view returns (address);
}

/**
 * @title LingxiaoCelestialBank18888_Upgradeable
 * @notice Current 18888 Lingxiao Celestial Bank life for KAIOS white-hole settlement.
 * @dev V2 receives ERC-20 settlement without a callback and supports only reviewed,
 *      beneficiary-claimed disbursements. A proposer and a different approver must
 *      authorize a fixed beneficiary, amount and purpose hash before the one-hour
 *      technical delay expires. DEFAULT_ADMIN_ROLE has no direct transfer function.
 *
 * Lineage:
 * - Genesis: KGEN_GalacticBank_V7_5_2, historical BigBang Galactic Bank organ.
 * - Generation 1: KGEN_LingxiaoDeityBank_V1_0_1, KGEN Bank 0.10% design.
 * - Current evolution: this UUPS Bank, KAIOS white-hole settlement runtime.
 *
 * Seat identity, payroll calculation and civilization-budget policy remain separate
 * organs. This Bank only enforces the final two-party payment authorization ledger.
 */
contract LingxiaoCelestialBank18888_Upgradeable is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PAYMENT_PROPOSER_ROLE = keccak256("PAYMENT_PROPOSER_ROLE");
    bytes32 public constant PAYMENT_APPROVER_ROLE = keccak256("PAYMENT_APPROVER_ROLE");

    uint256 public constant MIN_DISBURSEMENT_DELAY = 1 hours;

    struct Disbursement {
        address beneficiary;
        uint256 amount;
        uint64 executableAt;
        address proposer;
        address approver;
        bytes32 purposeHash;
        bool executed;
        bool cancelled;
    }

    address public kgen;
    address public kaios;
    bool public kaiosBound;
    uint256 public totalKaiosDisbursed;
    mapping(bytes32 disbursementId => Disbursement) private _disbursements;

    uint256[46] private __gap;

    error ZeroAddress();
    error NotAContract(address account);
    error KAIOSAlreadyBound(address currentKaios);
    error KAIOSKgenMismatch(address expectedKgen, address actualKgen);
    error KAIOSSettlementTargetMismatch(address expectedTreasury, address actualTreasury);
    error KAIOSNotBound();
    error InvalidDisbursement();
    error DisbursementAlreadyExists(bytes32 disbursementId);
    error DisbursementNotFound(bytes32 disbursementId);
    error DisbursementNotApproved(bytes32 disbursementId);
    error DisbursementNotReady(bytes32 disbursementId, uint256 executableAt);
    error DisbursementClosed(bytes32 disbursementId);
    error SameProposerAndApprover(address account);
    error NotDisbursementBeneficiary(address expected, address caller);
    error NotDisbursementCanceller(address caller);

    event TreasuryInitialized(
        address indexed admin,
        address indexed upgrader,
        address indexed kgen
    );
    event KAIOSBound(address indexed kaios, address indexed kgen, address indexed treasury);
    event DisbursementProposed(
        bytes32 indexed disbursementId,
        address indexed beneficiary,
        uint256 amount,
        bytes32 indexed purposeHash,
        uint256 executableAt,
        address proposer
    );
    event DisbursementApproved(bytes32 indexed disbursementId, address indexed approver);
    event DisbursementCancelled(bytes32 indexed disbursementId, address indexed cancelledBy);
    event DisbursementClaimed(
        bytes32 indexed disbursementId,
        address indexed beneficiary,
        uint256 amount,
        bytes32 indexed purposeHash
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin, address upgrader, address canonicalKgen)
        external
        initializer
    {
        if (admin == address(0) || upgrader == address(0) || canonicalKgen == address(0)) {
            revert ZeroAddress();
        }
        if (canonicalKgen.code.length == 0) revert NotAContract(canonicalKgen);

        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        kgen = canonicalKgen;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, upgrader);

        emit TreasuryInitialized(admin, upgrader, canonicalKgen);
    }

    function bindKAIOS(address canonicalKaios) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (kaiosBound) revert KAIOSAlreadyBound(kaios);
        if (canonicalKaios == address(0)) revert ZeroAddress();
        if (canonicalKaios.code.length == 0) revert NotAContract(canonicalKaios);

        address reportedKgen = IKAIOSSettlementLineage(canonicalKaios).KGEN();
        if (reportedKgen != kgen) revert KAIOSKgenMismatch(kgen, reportedKgen);

        address reportedTreasury =
            IKAIOSSettlementLineage(canonicalKaios).LINGXIAO_TREASURY_18888();
        if (reportedTreasury != address(this)) {
            revert KAIOSSettlementTargetMismatch(address(this), reportedTreasury);
        }

        kaios = canonicalKaios;
        kaiosBound = true;

        emit KAIOSBound(canonicalKaios, kgen, address(this));
    }

    function version() external pure returns (string memory) {
        return "2.0.0";
    }

    function runtimeMode() external pure returns (string memory) {
        return "POLICY_GATED_SETTLEMENT_BANK";
    }

    function kaiosBalance() external view returns (uint256) {
        return kaiosBound ? IERC20(kaios).balanceOf(address(this)) : 0;
    }

    function disbursement(bytes32 disbursementId)
        external
        view
        returns (Disbursement memory)
    {
        return _disbursements[disbursementId];
    }

    function proposeDisbursement(
        bytes32 disbursementId,
        address beneficiary,
        uint256 amount,
        bytes32 purposeHash,
        uint64 executableAt
    ) external onlyRole(PAYMENT_PROPOSER_ROLE) {
        if (!kaiosBound) revert KAIOSNotBound();
        if (
            disbursementId == bytes32(0) || beneficiary == address(0) || amount == 0
                || purposeHash == bytes32(0)
                || uint256(executableAt) < block.timestamp + MIN_DISBURSEMENT_DELAY
        ) revert InvalidDisbursement();
        if (_disbursements[disbursementId].beneficiary != address(0)) {
            revert DisbursementAlreadyExists(disbursementId);
        }

        _disbursements[disbursementId] = Disbursement({
            beneficiary: beneficiary,
            amount: amount,
            executableAt: executableAt,
            proposer: msg.sender,
            approver: address(0),
            purposeHash: purposeHash,
            executed: false,
            cancelled: false
        });

        emit DisbursementProposed(
            disbursementId,
            beneficiary,
            amount,
            purposeHash,
            executableAt,
            msg.sender
        );
    }

    function approveDisbursement(bytes32 disbursementId)
        external
        onlyRole(PAYMENT_APPROVER_ROLE)
    {
        Disbursement storage item = _disbursements[disbursementId];
        if (item.beneficiary == address(0)) revert DisbursementNotFound(disbursementId);
        if (item.cancelled || item.executed || item.approver != address(0)) {
            revert DisbursementClosed(disbursementId);
        }
        if (item.proposer == msg.sender) revert SameProposerAndApprover(msg.sender);

        item.approver = msg.sender;
        emit DisbursementApproved(disbursementId, msg.sender);
    }

    function cancelDisbursement(bytes32 disbursementId) external {
        Disbursement storage item = _disbursements[disbursementId];
        if (item.beneficiary == address(0)) revert DisbursementNotFound(disbursementId);
        if (item.cancelled || item.executed) revert DisbursementClosed(disbursementId);
        if (
            msg.sender != item.proposer && msg.sender != item.approver
                && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)
        ) revert NotDisbursementCanceller(msg.sender);

        item.cancelled = true;
        emit DisbursementCancelled(disbursementId, msg.sender);
    }

    function claimDisbursement(bytes32 disbursementId) external nonReentrant {
        Disbursement storage item = _disbursements[disbursementId];
        if (item.beneficiary == address(0)) revert DisbursementNotFound(disbursementId);
        if (item.cancelled || item.executed) revert DisbursementClosed(disbursementId);
        if (item.approver == address(0)) revert DisbursementNotApproved(disbursementId);
        if (msg.sender != item.beneficiary) {
            revert NotDisbursementBeneficiary(item.beneficiary, msg.sender);
        }
        if (block.timestamp < item.executableAt) {
            revert DisbursementNotReady(disbursementId, item.executableAt);
        }

        item.executed = true;
        totalKaiosDisbursed += item.amount;
        IERC20(kaios).safeTransfer(item.beneficiary, item.amount);

        emit DisbursementClaimed(
            disbursementId,
            item.beneficiary,
            item.amount,
            item.purposeHash
        );
    }

    function _authorizeUpgrade(address) internal override onlyRole(UPGRADER_ROLE) {}
}
