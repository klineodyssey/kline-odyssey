// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

interface IKAIOS8888Lineage {
    function KGEN() external view returns (address);
    function LINGXIAO_TREASURY_18888() external view returns (address);
}

/**
 * @title GaolaozhuangCommercialBank8888_Upgradeable
 * @notice Canonical code-bearing 8888 normal-civilization commercial bank.
 * @dev Salary, customer-account and commerce rails are liability-accounted. Admin and
 *      upgrader roles expose no arbitrary asset-transfer function. The historical EOA is
 *      recorded as lineage only and receives no authority over this proxy.
 */
contract GaolaozhuangCommercialBank8888_Upgradeable is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant ACCOUNT_ADMIN_ROLE = keccak256("ACCOUNT_ADMIN_ROLE");
    bytes32 public constant PAYROLL_ADMIN_ROLE = keccak256("PAYROLL_ADMIN_ROLE");
    bytes32 public constant INTEREST_POLICY_ROLE = keccak256("INTEREST_POLICY_ROLE");
    bytes32 public constant RISK_MANAGER_ROLE = keccak256("RISK_MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant POINT_ID = 8_888;
    uint256 public constant CIVILIZATION_TIME_OFFSET = 8 hours;
    uint256 public constant INTEREST_RATE_SCALE = 1_000_000;

    enum AccountType { NONE, LIFE, AI_COMPANY, HUMAN_PLAYER, BUSINESS }
    enum AccountStatus { NONE, ACTIVE, SUSPENDED, CLOSED }
    enum SalaryDestination { NONE, CLAIM_TO_WALLET, CREDIT_TO_8888_ACCOUNT }
    enum PaymentPurpose {
        NONE,
        SALARY,
        GOODS,
        SERVICE,
        SUPPLY_CHAIN,
        LAND,
        CONSTRUCTION,
        COMPUTE,
        ENERGY,
        OTHER_REGISTERED_COMMERCE
    }
    enum PaymentStatus { NONE, PENDING, EXECUTED }

    struct CommercialAccount {
        bytes32 identityId;
        bytes32 lifeId;
        bytes32 companyId;
        address beneficiary;
        address controller;
        uint256 balance;
        uint256 accruedInterest;
        uint256 pendingInterest;
        uint64 createdAt;
        uint64 interestCheckpointEpoch;
        AccountType accountType;
        AccountStatus status;
    }

    struct PayrollEntry {
        bytes32 lifeId;
        address beneficiary;
        uint256 amount;
        uint64 epoch;
        uint64 createdAt;
        bool claimed;
        SalaryDestination destination;
        bytes32 creditedAccountId;
    }

    struct BusinessPayment {
        bytes32 payerAccountId;
        bytes32 beneficiaryAccountId;
        address beneficiary;
        uint256 amount;
        uint64 createdAt;
        PaymentPurpose purpose;
        SalaryDestination destination;
        PaymentStatus status;
    }

    struct InterestRateCheckpoint {
        uint64 effectiveEpoch;
        uint64 ratePpmPerEpoch;
    }

    address public kgen;
    address public kaios;
    address public celestialBank18888;
    address public legacyTreasury;
    address public bootstrapAdmin;
    address public bootstrapUpgrader;
    bool public kaiosBound;
    bool public paused;
    bool public governanceFinalized;
    uint256 public minimumReserve;
    uint256 public totalAccountLiability;
    uint256 public totalPayrollLiability;
    uint256 public totalPaymentLiability;
    uint256 public interestFundingReserve;
    uint256 public totalSalaryPaidToWallet;
    uint256 public totalSalaryCreditedToAccounts;
    uint256 public totalCommercialSettlement;
    uint256 public totalInterestCredited;
    uint256 public totalPendingInterest;
    uint256 public accountCount;
    uint256 public payrollCount;
    uint256 public paymentCount;

    mapping(bytes32 accountId => CommercialAccount) private _accounts;
    mapping(bytes32 payrollId => PayrollEntry) private _payroll;
    mapping(bytes32 paymentId => BusinessPayment) private _payments;
    InterestRateCheckpoint[] private _interestRates;

    uint256[27] private __gap;

    error ZeroAddress();
    error NotAContract(address account);
    error AlreadyBound();
    error LineageMismatch(address expected, address actual);
    error BankPaused();
    error InvalidAccount();
    error AccountAlreadyExists(bytes32 accountId);
    error AccountNotActive(bytes32 accountId);
    error UnauthorizedAccountDebit(bytes32 accountId, address caller);
    error InvalidPayroll();
    error PayrollAlreadyExists(bytes32 payrollId);
    error PayrollNotClaimable(bytes32 payrollId, uint256 claimableAt);
    error PayrollAlreadyClaimed(bytes32 payrollId);
    error InvalidPayment();
    error PaymentAlreadyExists(bytes32 paymentId);
    error PaymentNotPending(bytes32 paymentId);
    error InsufficientAccountBalance(bytes32 accountId, uint256 available, uint256 required);
    error InsufficientFreeCapital(uint256 available, uint256 required);
    error Insolvent(uint256 assets, uint256 liabilitiesAndReserve);
    error InvalidInterestCheckpoint();
    error KAIOSNotBound();
    error GovernanceAlreadyFinalized();

    event BankInitialized(
        address indexed admin,
        address indexed upgrader,
        address indexed kgen,
        address celestialBank18888,
        address legacyTreasury
    );
    event KAIOSBound(address indexed kaios, address indexed kgen, address indexed celestialBank18888);
    event AccountCreated(
        bytes32 indexed accountId,
        bytes32 indexed identityId,
        AccountType accountType,
        address beneficiary,
        address controller
    );
    event AccountStatusUpdated(bytes32 indexed accountId, AccountStatus status);
    event Deposited(bytes32 indexed accountId, address indexed from, uint256 amount);
    event AccountWithdrawal(bytes32 indexed accountId, address indexed beneficiary, uint256 amount);
    event PayrollScheduled(
        bytes32 indexed payrollId,
        bytes32 indexed lifeId,
        address indexed beneficiary,
        uint256 amount,
        uint64 epoch
    );
    event SalaryClaimed(
        bytes32 indexed payrollId,
        address indexed beneficiary,
        uint256 amount,
        SalaryDestination destination,
        bytes32 creditedAccountId,
        address triggeredBy
    );
    event BusinessPaymentCreated(
        bytes32 indexed paymentId,
        bytes32 indexed payerAccountId,
        address indexed beneficiary,
        uint256 amount,
        PaymentPurpose purpose,
        SalaryDestination destination
    );
    event BusinessPaymentExecuted(
        bytes32 indexed paymentId,
        address indexed beneficiary,
        uint256 amount,
        SalaryDestination destination,
        bytes32 beneficiaryAccountId,
        address triggeredBy
    );
    event InterestRateScheduled(uint64 indexed effectiveEpoch, uint64 ratePpmPerEpoch);
    event InterestFunded(address indexed funder, uint256 amount);
    event InterestCheckpointed(bytes32 indexed accountId, uint64 fromEpoch, uint64 toEpoch, uint256 amount);
    event MinimumReserveUpdated(uint256 previousReserve, uint256 newReserve);
    event BankPausedEvent(address indexed account);
    event BankUnpaused(address indexed account);
    event GovernanceFinalized(address indexed governance, address indexed pauser, address indexed bootstrapAdmin);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address admin,
        address upgrader,
        address canonicalKgen,
        address formalCelestialBank18888,
        address historicalTreasury
    ) external initializer {
        if (
            admin == address(0) || upgrader == address(0) || canonicalKgen == address(0)
                || formalCelestialBank18888 == address(0) || historicalTreasury == address(0)
        ) revert ZeroAddress();
        if (canonicalKgen.code.length == 0) revert NotAContract(canonicalKgen);
        if (formalCelestialBank18888.code.length == 0) revert NotAContract(formalCelestialBank18888);

        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        kgen = canonicalKgen;
        celestialBank18888 = formalCelestialBank18888;
        legacyTreasury = historicalTreasury;
        bootstrapAdmin = admin;
        bootstrapUpgrader = upgrader;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ACCOUNT_ADMIN_ROLE, admin);
        _grantRole(PAYROLL_ADMIN_ROLE, admin);
        _grantRole(INTEREST_POLICY_ROLE, admin);
        _grantRole(RISK_MANAGER_ROLE, admin);
        _grantRole(UPGRADER_ROLE, upgrader);

        emit BankInitialized(admin, upgrader, canonicalKgen, formalCelestialBank18888, historicalTreasury);
    }

    function version() external pure returns (string memory) { return "1.0.0"; }
    function runtimeMode() external pure returns (string memory) {
        return "NORMAL_CIVILIZATION_COMMERCIAL_BANK";
    }

    function bindKAIOS(address canonicalKaios) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (kaiosBound) revert AlreadyBound();
        if (canonicalKaios == address(0)) revert ZeroAddress();
        if (canonicalKaios.code.length == 0) revert NotAContract(canonicalKaios);
        address reportedKgen = IKAIOS8888Lineage(canonicalKaios).KGEN();
        if (reportedKgen != kgen) revert LineageMismatch(kgen, reportedKgen);
        address reported18888 = IKAIOS8888Lineage(canonicalKaios).LINGXIAO_TREASURY_18888();
        if (reported18888 != celestialBank18888) revert LineageMismatch(celestialBank18888, reported18888);
        kaios = canonicalKaios;
        kaiosBound = true;
        emit KAIOSBound(canonicalKaios, reportedKgen, reported18888);
    }

    function account(bytes32 accountId) external view returns (CommercialAccount memory) {
        return _accounts[accountId];
    }

    function payroll(bytes32 payrollId) external view returns (PayrollEntry memory) {
        return _payroll[payrollId];
    }

    function payment(bytes32 paymentId) external view returns (BusinessPayment memory) {
        return _payments[paymentId];
    }

    function interestRateCheckpointCount() external view returns (uint256) {
        return _interestRates.length;
    }

    function interestRateCheckpoint(uint256 index) external view returns (InterestRateCheckpoint memory) {
        return _interestRates[index];
    }

    function currentCalendarEpoch() public view returns (uint64) {
        (uint256 year, uint256 month,) = _daysToDate((block.timestamp + CIVILIZATION_TIME_OFFSET) / 1 days);
        return uint64(year * 12 + month - 1);
    }

    function currentBankingEpoch() public view returns (uint64 epoch) {
        epoch = currentCalendarEpoch();
        if (block.timestamp < epochClaimableAt(epoch)) epoch -= 1;
    }

    function epochClaimableAt(uint64 epoch) public pure returns (uint256) {
        uint256 year = uint256(epoch) / 12;
        uint256 month = uint256(epoch) % 12 + 1;
        return _daysFromDate(year, month, 5) * 1 days - CIVILIZATION_TIME_OFFSET;
    }

    function depositInterestRate() external view returns (uint64) {
        return _rateForEpoch(currentBankingEpoch());
    }

    function interestPolicyConfigured() external view returns (bool) {
        return _interestRates.length != 0;
    }

    function assets() public view returns (uint256) {
        return kaiosBound ? IERC20(kaios).balanceOf(address(this)) : 0;
    }

    function totalCustomerLiability() public view returns (uint256) {
        return totalAccountLiability + totalPayrollLiability + totalPaymentLiability;
    }

    function totalEncumbered() public view returns (uint256) {
        uint256 interestEncumbrance = interestFundingReserve > totalPendingInterest
            ? interestFundingReserve
            : totalPendingInterest;
        return totalCustomerLiability() + interestEncumbrance + minimumReserve;
    }

    function freeCapital() public view returns (uint256) {
        uint256 balance = assets();
        uint256 encumbered = totalEncumbered();
        return balance > encumbered ? balance - encumbered : 0;
    }

    function bankHealth()
        external
        view
        returns (
            uint256 balance,
            uint256 customerLiability,
            uint256 interestReserve,
            uint256 pendingInterest,
            uint256 reserve,
            uint256 available,
            bool solvent,
            bool isPaused
        )
    {
        balance = assets();
        customerLiability = totalCustomerLiability();
        interestReserve = interestFundingReserve;
        pendingInterest = totalPendingInterest;
        reserve = minimumReserve;
        uint256 encumbered = customerLiability
            + (interestReserve > pendingInterest ? interestReserve : pendingInterest) + reserve;
        available = balance > encumbered ? balance - encumbered : 0;
        solvent = balance >= encumbered;
        isPaused = paused;
    }

    function implementationAddress() external view returns (address implementation) {
        bytes32 slot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
        assembly { implementation := sload(slot) }
    }

    function createAccount(
        bytes32 accountId,
        bytes32 identityId,
        bytes32 lifeId,
        bytes32 companyId,
        address beneficiary,
        address controller,
        AccountType accountType
    ) external onlyRole(ACCOUNT_ADMIN_ROLE) {
        if (
            accountId == bytes32(0) || identityId == bytes32(0) || beneficiary == address(0)
                || controller == address(0) || accountType == AccountType.NONE
        ) revert InvalidAccount();
        if (_accounts[accountId].status != AccountStatus.NONE) revert AccountAlreadyExists(accountId);
        if (accountType == AccountType.LIFE && lifeId == bytes32(0)) revert InvalidAccount();
        if (accountType == AccountType.AI_COMPANY && companyId == bytes32(0)) revert InvalidAccount();

        _accounts[accountId] = CommercialAccount({
            identityId: identityId,
            lifeId: lifeId,
            companyId: companyId,
            beneficiary: beneficiary,
            controller: controller,
            balance: 0,
            accruedInterest: 0,
            pendingInterest: 0,
            createdAt: uint64(block.timestamp),
            interestCheckpointEpoch: currentBankingEpoch(),
            accountType: accountType,
            status: AccountStatus.ACTIVE
        });
        accountCount += 1;
        emit AccountCreated(accountId, identityId, accountType, beneficiary, controller);
    }

    function setAccountStatus(bytes32 accountId, AccountStatus status) external onlyRole(ACCOUNT_ADMIN_ROLE) {
        if (status == AccountStatus.NONE || _accounts[accountId].status == AccountStatus.NONE) revert InvalidAccount();
        _accounts[accountId].status = status;
        emit AccountStatusUpdated(accountId, status);
    }

    function depositToAccount(bytes32 accountId, uint256 amount) external nonReentrant {
        _requireOperational();
        CommercialAccount storage item = _activeAccount(accountId);
        if (amount == 0) revert InvalidAccount();
        _checkpointInterest(accountId, item);
        IERC20(kaios).safeTransferFrom(msg.sender, address(this), amount);
        item.balance += amount;
        totalAccountLiability += amount;
        emit Deposited(accountId, msg.sender, amount);
    }

    function withdrawAccount(bytes32 accountId, uint256 amount) external nonReentrant {
        _requireOperational();
        CommercialAccount storage item = _activeAccount(accountId);
        if (msg.sender != item.controller && msg.sender != item.beneficiary) {
            revert UnauthorizedAccountDebit(accountId, msg.sender);
        }
        _checkpointInterest(accountId, item);
        if (amount == 0 || item.balance < amount) {
            revert InsufficientAccountBalance(accountId, item.balance, amount);
        }
        item.balance -= amount;
        totalAccountLiability -= amount;
        IERC20(kaios).safeTransfer(item.beneficiary, amount);
        _assertSolvent();
        emit AccountWithdrawal(accountId, item.beneficiary, amount);
    }

    function schedulePayroll(
        bytes32 payrollId,
        bytes32 lifeId,
        address beneficiary,
        uint256 amount,
        uint64 epoch
    ) external onlyRole(PAYROLL_ADMIN_ROLE) {
        _requireOperational();
        if (
            payrollId == bytes32(0) || lifeId == bytes32(0) || beneficiary == address(0) || amount == 0
                || epoch < currentCalendarEpoch() || block.timestamp >= epochClaimableAt(epoch)
        ) revert InvalidPayroll();
        if (_payroll[payrollId].beneficiary != address(0)) revert PayrollAlreadyExists(payrollId);
        uint256 available = freeCapital();
        if (available < amount) revert InsufficientFreeCapital(available, amount);
        _payroll[payrollId] = PayrollEntry({
            lifeId: lifeId,
            beneficiary: beneficiary,
            amount: amount,
            epoch: epoch,
            createdAt: uint64(block.timestamp),
            claimed: false,
            destination: SalaryDestination.NONE,
            creditedAccountId: bytes32(0)
        });
        payrollCount += 1;
        totalPayrollLiability += amount;
        emit PayrollScheduled(payrollId, lifeId, beneficiary, amount, epoch);
    }

    function claimSalary(bytes32 payrollId, SalaryDestination destination, bytes32 accountId)
        external
        nonReentrant
    {
        _requireOperational();
        PayrollEntry storage item = _payroll[payrollId];
        if (item.beneficiary == address(0)) revert InvalidPayroll();
        if (item.claimed) revert PayrollAlreadyClaimed(payrollId);
        uint256 claimableAt = epochClaimableAt(item.epoch);
        if (block.timestamp < claimableAt) revert PayrollNotClaimable(payrollId, claimableAt);
        if (destination == SalaryDestination.CLAIM_TO_WALLET) {
            if (accountId != bytes32(0)) revert InvalidPayroll();
            totalPayrollLiability -= item.amount;
            totalSalaryPaidToWallet += item.amount;
            IERC20(kaios).safeTransfer(item.beneficiary, item.amount);
        } else if (destination == SalaryDestination.CREDIT_TO_8888_ACCOUNT) {
            CommercialAccount storage accountItem = _activeAccount(accountId);
            if (accountItem.beneficiary != item.beneficiary) revert InvalidPayroll();
            _checkpointInterest(accountId, accountItem);
            totalPayrollLiability -= item.amount;
            totalAccountLiability += item.amount;
            accountItem.balance += item.amount;
            totalSalaryCreditedToAccounts += item.amount;
            item.creditedAccountId = accountId;
        } else {
            revert InvalidPayroll();
        }
        item.claimed = true;
        item.destination = destination;
        _assertSolvent();
        emit SalaryClaimed(payrollId, item.beneficiary, item.amount, destination, item.creditedAccountId, msg.sender);
    }

    function createBusinessPayment(
        bytes32 paymentId,
        bytes32 payerAccountId,
        address beneficiary,
        bytes32 beneficiaryAccountId,
        uint256 amount,
        PaymentPurpose purpose,
        SalaryDestination destination
    ) external nonReentrant {
        _requireOperational();
        CommercialAccount storage payer = _activeAccount(payerAccountId);
        if (msg.sender != payer.controller) revert UnauthorizedAccountDebit(payerAccountId, msg.sender);
        if (
            paymentId == bytes32(0) || beneficiary == address(0) || amount == 0 || purpose == PaymentPurpose.NONE
                || (destination != SalaryDestination.CLAIM_TO_WALLET
                    && destination != SalaryDestination.CREDIT_TO_8888_ACCOUNT)
        ) revert InvalidPayment();
        if (_payments[paymentId].status != PaymentStatus.NONE) revert PaymentAlreadyExists(paymentId);
        if (destination == SalaryDestination.CLAIM_TO_WALLET && beneficiaryAccountId != bytes32(0)) revert InvalidPayment();
        if (destination == SalaryDestination.CREDIT_TO_8888_ACCOUNT) {
            CommercialAccount storage recipient = _activeAccount(beneficiaryAccountId);
            if (recipient.beneficiary != beneficiary) revert InvalidPayment();
        }
        _checkpointInterest(payerAccountId, payer);
        if (payer.balance < amount) revert InsufficientAccountBalance(payerAccountId, payer.balance, amount);
        payer.balance -= amount;
        totalAccountLiability -= amount;
        totalPaymentLiability += amount;
        _payments[paymentId] = BusinessPayment({
            payerAccountId: payerAccountId,
            beneficiaryAccountId: beneficiaryAccountId,
            beneficiary: beneficiary,
            amount: amount,
            createdAt: uint64(block.timestamp),
            purpose: purpose,
            destination: destination,
            status: PaymentStatus.PENDING
        });
        paymentCount += 1;
        emit BusinessPaymentCreated(paymentId, payerAccountId, beneficiary, amount, purpose, destination);
    }

    function executeBusinessPayment(bytes32 paymentId) external nonReentrant {
        _requireOperational();
        BusinessPayment storage item = _payments[paymentId];
        if (item.status != PaymentStatus.PENDING) revert PaymentNotPending(paymentId);
        item.status = PaymentStatus.EXECUTED;
        totalPaymentLiability -= item.amount;
        if (item.destination == SalaryDestination.CLAIM_TO_WALLET) {
            IERC20(kaios).safeTransfer(item.beneficiary, item.amount);
        } else {
            CommercialAccount storage recipient = _activeAccount(item.beneficiaryAccountId);
            if (recipient.beneficiary != item.beneficiary) revert InvalidPayment();
            _checkpointInterest(item.beneficiaryAccountId, recipient);
            recipient.balance += item.amount;
            totalAccountLiability += item.amount;
        }
        totalCommercialSettlement += item.amount;
        _assertSolvent();
        emit BusinessPaymentExecuted(
            paymentId,
            item.beneficiary,
            item.amount,
            item.destination,
            item.beneficiaryAccountId,
            msg.sender
        );
    }

    function fundInterest(uint256 amount) external nonReentrant {
        _requireOperational();
        if (amount == 0) revert InvalidInterestCheckpoint();
        IERC20(kaios).safeTransferFrom(msg.sender, address(this), amount);
        interestFundingReserve += amount;
        emit InterestFunded(msg.sender, amount);
    }

    function scheduleInterestRate(uint64 effectiveEpoch, uint64 ratePpmPerEpoch)
        external
        onlyRole(INTEREST_POLICY_ROLE)
    {
        if (effectiveEpoch <= currentBankingEpoch()) revert InvalidInterestCheckpoint();
        uint256 length = _interestRates.length;
        if (length != 0 && effectiveEpoch <= _interestRates[length - 1].effectiveEpoch) {
            revert InvalidInterestCheckpoint();
        }
        _interestRates.push(InterestRateCheckpoint(effectiveEpoch, ratePpmPerEpoch));
        emit InterestRateScheduled(effectiveEpoch, ratePpmPerEpoch);
    }

    function checkpointInterest(bytes32 accountId) external returns (uint256) {
        CommercialAccount storage item = _activeAccount(accountId);
        return _checkpointInterest(accountId, item);
    }

    function setMinimumReserve(uint256 newReserve) external onlyRole(RISK_MANAGER_ROLE) {
        uint256 balance = assets();
        uint256 liabilities = totalCustomerLiability()
            + (interestFundingReserve > totalPendingInterest ? interestFundingReserve : totalPendingInterest);
        if (balance < liabilities + newReserve) revert Insolvent(balance, liabilities + newReserve);
        uint256 previous = minimumReserve;
        minimumReserve = newReserve;
        emit MinimumReserveUpdated(previous, newReserve);
    }

    function grantPauser(address pauser) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (pauser == address(0)) revert ZeroAddress();
        _grantRole(PAUSER_ROLE, pauser);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        paused = true;
        emit BankPausedEvent(msg.sender);
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        paused = false;
        emit BankUnpaused(msg.sender);
    }

    function finalizeGovernance(address governance, address pauser) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (governanceFinalized) revert GovernanceAlreadyFinalized();
        if (governance == address(0) || pauser == address(0)) revert ZeroAddress();
        if (governance.code.length == 0) revert NotAContract(governance);
        governanceFinalized = true;
        _grantRole(DEFAULT_ADMIN_ROLE, governance);
        _grantRole(ACCOUNT_ADMIN_ROLE, governance);
        _grantRole(PAYROLL_ADMIN_ROLE, governance);
        _grantRole(INTEREST_POLICY_ROLE, governance);
        _grantRole(RISK_MANAGER_ROLE, governance);
        _grantRole(UPGRADER_ROLE, governance);
        _revokeRole(ACCOUNT_ADMIN_ROLE, bootstrapAdmin);
        _revokeRole(PAYROLL_ADMIN_ROLE, bootstrapAdmin);
        _revokeRole(INTEREST_POLICY_ROLE, bootstrapAdmin);
        _revokeRole(RISK_MANAGER_ROLE, bootstrapAdmin);
        _revokeRole(DEFAULT_ADMIN_ROLE, bootstrapAdmin);
        _revokeRole(UPGRADER_ROLE, bootstrapUpgrader);
        _revokeRole(PAUSER_ROLE, bootstrapAdmin);
        _revokeRole(PAUSER_ROLE, bootstrapUpgrader);
        _grantRole(PAUSER_ROLE, pauser);
        emit GovernanceFinalized(governance, pauser, bootstrapAdmin);
    }

    function _checkpointInterest(bytes32 accountId, CommercialAccount storage item) internal returns (uint256 interest) {
        uint64 toEpoch = currentBankingEpoch();
        uint64 fromEpoch = item.interestCheckpointEpoch;
        if (toEpoch > fromEpoch) {
            for (uint64 epoch = fromEpoch; epoch < toEpoch; epoch++) {
                uint64 rate = _rateForEpoch(epoch);
                if (rate != 0) interest += item.balance * uint256(rate) / INTEREST_RATE_SCALE;
            }
            item.interestCheckpointEpoch = toEpoch;
        }
        if (interest != 0) {
            item.pendingInterest += interest;
            totalPendingInterest += interest;
        }
        uint256 payableInterest = item.pendingInterest < interestFundingReserve
            ? item.pendingInterest
            : interestFundingReserve;
        if (payableInterest != 0) {
            interestFundingReserve -= payableInterest;
            item.pendingInterest -= payableInterest;
            totalPendingInterest -= payableInterest;
            item.balance += payableInterest;
            item.accruedInterest += payableInterest;
            totalAccountLiability += payableInterest;
            totalInterestCredited += payableInterest;
        }
        emit InterestCheckpointed(accountId, fromEpoch, toEpoch, payableInterest);
        return payableInterest;
    }

    function _rateForEpoch(uint64 epoch) internal view returns (uint64 rate) {
        for (uint256 index = _interestRates.length; index > 0; index--) {
            InterestRateCheckpoint memory item = _interestRates[index - 1];
            if (epoch >= item.effectiveEpoch) return item.ratePpmPerEpoch;
        }
    }

    function _activeAccount(bytes32 accountId) internal view returns (CommercialAccount storage item) {
        item = _accounts[accountId];
        if (item.status != AccountStatus.ACTIVE) revert AccountNotActive(accountId);
    }

    function _requireOperational() internal view {
        if (paused) revert BankPaused();
        if (!kaiosBound) revert KAIOSNotBound();
    }

    function _assertSolvent() internal view {
        uint256 balance = assets();
        uint256 encumbered = totalEncumbered();
        if (balance < encumbered) revert Insolvent(balance, encumbered);
    }

    function _daysFromDate(uint256 year, uint256 month, uint256 day) internal pure returns (uint256) {
        int256 y = int256(year);
        int256 m = int256(month);
        int256 d = int256(day);
        int256 daysSinceEpoch = d - 32_075 + 1_461 * (y + 4_800 + (m - 14) / 12) / 4
            + 367 * (m - 2 - (m - 14) / 12 * 12) / 12
            - 3 * ((y + 4_900 + (m - 14) / 12) / 100) / 4 - 2_440_588;
        return uint256(daysSinceEpoch);
    }

    function _daysToDate(uint256 daysSinceEpoch) internal pure returns (uint256 year, uint256 month, uint256 day) {
        int256 l = int256(daysSinceEpoch) + 68_569 + 2_440_588;
        int256 n = 4 * l / 146_097;
        l = l - (146_097 * n + 3) / 4;
        int256 y = 4_000 * (l + 1) / 1_461_001;
        l = l - 1_461 * y / 4 + 31;
        int256 m = 80 * l / 2_447;
        int256 d = l - 2_447 * m / 80;
        l = m / 11;
        m = m + 2 - 12 * l;
        y = 100 * (n - 49) + y + l;
        return (uint256(y), uint256(m), uint256(d));
    }

    function _authorizeUpgrade(address) internal override onlyRole(UPGRADER_ROLE) {}
}
