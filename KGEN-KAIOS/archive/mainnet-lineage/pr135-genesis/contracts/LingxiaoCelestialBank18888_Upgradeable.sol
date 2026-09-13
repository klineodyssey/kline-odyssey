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
 * @dev V2 receives ERC-20 settlement without a callback and circulates KAIOS only
 *      through registered, capped modules or the legacy two-party beneficiary-claim
 *      rail. DEFAULT_ADMIN_ROLE and UPGRADER_ROLE have no direct transfer function.
 *
 * Lineage:
 * - Genesis: KGEN_GalacticBank_V7_5_2, historical BigBang Galactic Bank organ.
 * - Generation 1: KGEN_LingxiaoDeityBank_V1_0_1, KGEN Bank 0.10% design.
 * - Current evolution: this UUPS Bank, KAIOS white-hole settlement runtime.
 *
 * Seat identity, payroll calculation, civilization allocation, 8888 routing, 11520
 * settlement, risk, governance and migration evidence remain separate organs. Bank
 * Core enforces payment identity, module exposure, reserve and accounting invariants.
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
    bytes32 public constant MODULE_ADMIN_ROLE = keccak256("MODULE_ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

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

    struct ModuleConfig {
        address module;
        bytes32 versionHash;
        uint256 perTransactionLimit;
        uint256 epochLimit;
        uint256 epochSpent;
        uint64 epochIndex;
        bool active;
    }

    mapping(bytes32 moduleId => ModuleConfig) private _modules;
    mapping(address module => bytes32 moduleId) private _moduleIds;
    mapping(bytes32 paymentId => bool consumed) private _modulePayments;
    uint256 public totalKaiosAccountedInflow;
    uint256 public totalKaiosModuleDisbursed;
    uint256 public reserveRequirement;
    uint256 public lastAccountedGrossAssets;
    uint64 public genesisStartedAt;
    bool public genesisStarted;
    address public riskController;
    uint256 public genesisOpeningBalance;
    bool public paused;
    bool public governanceFinalized;
    address public bootstrapUpgrader;

    uint256[36] private __gap;

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
    error BankIsPaused();
    error ModuleNotAuthorized(bytes32 moduleId, address caller);
    error ModuleAddressAlreadyRegistered(address module);
    error ModulePaymentAlreadyConsumed(bytes32 paymentId);
    error ModuleLimitExceeded(bytes32 moduleId, uint256 requested, uint256 limit);
    error ReserveInvariantViolation(uint256 remainingBalance, uint256 reserveRequired);
    error KAIOSBalanceRequired();
    error GenesisAlreadyStarted();
    error OnlyRiskController(address caller);
    error GovernanceAlreadyFinalized();

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
    event ModuleConfigured(
        bytes32 indexed moduleId,
        address indexed module,
        bytes32 indexed versionHash,
        uint256 perTransactionLimit,
        uint256 epochLimit,
        bool active
    );
    event ModulePaymentExecuted(
        bytes32 indexed moduleId,
        bytes32 indexed paymentId,
        address indexed beneficiary,
        uint256 amount
    );
    event AccountingSynchronized(uint256 grossAssets, uint256 cumulativeInflow, uint256 balance);
    event ReserveRequirementUpdated(uint256 previousReserve, uint256 newReserve);
    event RiskControllerUpdated(address indexed previousController, address indexed newController);
    event GenesisEpochStarted(uint64 indexed startedAt, uint256 openingBalance, uint256 indexed blockNumber);
    event BankPaused(address indexed account);
    event BankUnpaused(address indexed account);
    event GovernanceFinalized(address indexed governanceContract, address indexed bootstrapAdmin);

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
        bootstrapUpgrader = upgrader;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, upgrader);
        _grantRole(MODULE_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);

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
        return "MODULAR_POLICY_GATED_CIVILIZATION_BANK";
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

    function module(bytes32 moduleId) external view returns (ModuleConfig memory) {
        return _modules[moduleId];
    }

    function moduleIdOf(address moduleAddress) external view returns (bytes32) {
        return _moduleIds[moduleAddress];
    }

    function modulePaymentConsumed(bytes32 paymentId) external view returns (bool) {
        return _modulePayments[paymentId];
    }

    function availableKaios() public view returns (uint256) {
        uint256 balance = kaiosBound ? IERC20(kaios).balanceOf(address(this)) : 0;
        return balance > reserveRequirement ? balance - reserveRequirement : 0;
    }

    function bankHealth()
        external
        view
        returns (
            uint256 balance,
            uint256 reserve,
            uint256 available,
            uint256 accountedInflow,
            uint256 totalOutflow,
            bool healthy,
            bool isPaused
        )
    {
        balance = kaiosBound ? IERC20(kaios).balanceOf(address(this)) : 0;
        reserve = reserveRequirement;
        available = balance > reserve ? balance - reserve : 0;
        accountedInflow = totalKaiosAccountedInflow;
        totalOutflow = totalKaiosDisbursed;
        healthy = kaiosBound && balance >= reserve;
        isPaused = paused;
    }

    function implementationAddress() external view returns (address implementation) {
        bytes32 slot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
        assembly {
            implementation := sload(slot)
        }
    }

    function configureModule(
        bytes32 moduleId,
        address moduleAddress,
        bytes32 versionHash,
        uint256 perTransactionLimit,
        uint256 epochLimit,
        bool active
    ) external onlyRole(MODULE_ADMIN_ROLE) {
        if (moduleId == bytes32(0) || moduleAddress == address(0)) revert ZeroAddress();
        if (moduleAddress.code.length == 0) revert NotAContract(moduleAddress);
        bytes32 existingId = _moduleIds[moduleAddress];
        if (existingId != bytes32(0) && existingId != moduleId) {
            revert ModuleAddressAlreadyRegistered(moduleAddress);
        }
        address previous = _modules[moduleId].module;
        if (previous != address(0) && previous != moduleAddress) delete _moduleIds[previous];
        _modules[moduleId] = ModuleConfig({
            module: moduleAddress,
            versionHash: versionHash,
            perTransactionLimit: perTransactionLimit,
            epochLimit: epochLimit,
            epochSpent: 0,
            epochIndex: uint64(block.timestamp / 1 days),
            active: active
        });
        _moduleIds[moduleAddress] = moduleId;
        emit ModuleConfigured(
            moduleId,
            moduleAddress,
            versionHash,
            perTransactionLimit,
            epochLimit,
            active
        );
    }

    function executeModulePayment(bytes32 paymentId, address beneficiary, uint256 amount)
        external
        nonReentrant
    {
        if (paused) revert BankIsPaused();
        if (!kaiosBound) revert KAIOSNotBound();
        bytes32 moduleId = _moduleIds[msg.sender];
        ModuleConfig storage config = _modules[moduleId];
        if (moduleId == bytes32(0) || config.module != msg.sender || !config.active) {
            revert ModuleNotAuthorized(moduleId, msg.sender);
        }
        if (paymentId == bytes32(0) || beneficiary == address(0) || amount == 0) {
            revert InvalidDisbursement();
        }
        if (_modulePayments[paymentId]) revert ModulePaymentAlreadyConsumed(paymentId);
        if (amount > config.perTransactionLimit) {
            revert ModuleLimitExceeded(moduleId, amount, config.perTransactionLimit);
        }
        uint64 epoch = uint64(block.timestamp / 1 days);
        if (config.epochIndex != epoch) {
            config.epochIndex = epoch;
            config.epochSpent = 0;
        }
        if (config.epochSpent + amount > config.epochLimit) {
            revert ModuleLimitExceeded(moduleId, config.epochSpent + amount, config.epochLimit);
        }
        uint256 balance = IERC20(kaios).balanceOf(address(this));
        if (balance < amount || balance - amount < reserveRequirement) {
            revert ReserveInvariantViolation(balance >= amount ? balance - amount : 0, reserveRequirement);
        }

        _modulePayments[paymentId] = true;
        config.epochSpent += amount;
        totalKaiosModuleDisbursed += amount;
        totalKaiosDisbursed += amount;
        IERC20(kaios).safeTransfer(beneficiary, amount);
        emit ModulePaymentExecuted(moduleId, paymentId, beneficiary, amount);
    }

    function synchronizeAccounting() public returns (uint256 newInflow) {
        if (!kaiosBound) revert KAIOSNotBound();
        uint256 balance = IERC20(kaios).balanceOf(address(this));
        uint256 grossAssets = balance + totalKaiosDisbursed;
        if (grossAssets > lastAccountedGrossAssets) {
            newInflow = grossAssets - lastAccountedGrossAssets;
            totalKaiosAccountedInflow += newInflow;
            lastAccountedGrossAssets = grossAssets;
        }
        emit AccountingSynchronized(grossAssets, totalKaiosAccountedInflow, balance);
    }

    function startGenesisEpoch() external {
        if (genesisStarted) revert GenesisAlreadyStarted();
        if (!kaiosBound) revert KAIOSNotBound();
        uint256 balance = IERC20(kaios).balanceOf(address(this));
        if (balance == 0) revert KAIOSBalanceRequired();
        synchronizeAccounting();
        genesisStarted = true;
        genesisStartedAt = uint64(block.timestamp);
        genesisOpeningBalance = balance;
        emit GenesisEpochStarted(genesisStartedAt, balance, block.number);
    }

    function setRiskController(address controller) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (controller == address(0)) revert ZeroAddress();
        if (controller.code.length == 0) revert NotAContract(controller);
        address previous = riskController;
        riskController = controller;
        emit RiskControllerUpdated(previous, controller);
    }

    function finalizeGovernance(address governanceContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (governanceFinalized) revert GovernanceAlreadyFinalized();
        if (governanceContract == address(0)) revert ZeroAddress();
        if (governanceContract.code.length == 0) revert NotAContract(governanceContract);
        governanceFinalized = true;
        _grantRole(DEFAULT_ADMIN_ROLE, governanceContract);
        _grantRole(MODULE_ADMIN_ROLE, governanceContract);
        _grantRole(PAUSER_ROLE, governanceContract);
        _grantRole(UPGRADER_ROLE, governanceContract);
        _revokeRole(MODULE_ADMIN_ROLE, msg.sender);
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _revokeRole(UPGRADER_ROLE, bootstrapUpgrader);
        emit GovernanceFinalized(governanceContract, msg.sender);
    }

    function setReserveRequirement(uint256 newReserve) external {
        if (msg.sender != riskController) revert OnlyRiskController(msg.sender);
        uint256 previous = reserveRequirement;
        reserveRequirement = newReserve;
        emit ReserveRequirementUpdated(previous, newReserve);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        paused = true;
        emit BankPaused(msg.sender);
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        paused = false;
        emit BankUnpaused(msg.sender);
    }

    function proposeDisbursement(
        bytes32 disbursementId,
        address beneficiary,
        uint256 amount,
        bytes32 purposeHash,
        uint64 executableAt
    ) external onlyRole(PAYMENT_PROPOSER_ROLE) {
        if (paused) revert BankIsPaused();
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
        if (paused) revert BankIsPaused();
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

        uint256 balance = IERC20(kaios).balanceOf(address(this));
        if (balance < item.amount || balance - item.amount < reserveRequirement) {
            revert ReserveInvariantViolation(
                balance >= item.amount ? balance - item.amount : 0,
                reserveRequirement
            );
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
