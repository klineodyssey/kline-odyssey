// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * KGEN_BrainExchange_V4_0_0
 * 11520 | Huaguoshan / Wukong Brain Exchange
 *
 * REAL-FUNDS CANDIDATE — NOT DEPLOYED.
 *
 * Design goals:
 * - real KGEN deposits and withdrawals with principal accounting
 * - reward liabilities separated from principal
 * - payroll / Heart / Treasury operations can spend surplus only
 * - pausable deposits and new risk while user exits/settlement remain available
 * - replay-safe position collateral reservation inside the single Brain ledger
 * - real insurance reserve funded only from already-existing surplus
 * - explicit uncovered bad debt that halts new risk without trapping exits
 * - UUPS upgrades protected by an explicit delay
 * - no fake settlement state: trading PnL must come from a separately reviewed engine
 */

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IKGENMarsSeatsV4 {
    function notifyReward(uint256 amountWei) external;
}

contract KGEN_BrainExchange_V4_0_0 is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADE_ROLE = keccak256("UPGRADE_ROLE");
    bytes32 public constant SETTLEMENT_ROLE = keccak256("SETTLEMENT_ROLE");

    uint256 public constant ACC_SCALE = 1e27;
    uint256 public constant MIN_PAYROLL_INTERVAL = 7 days;
    uint256 public constant MIN_UPGRADE_DELAY = 2 days;
    uint256 public constant MAX_BPS = 10_000;

    uint8 private constant RESERVATION_ACTIVE = 1;
    uint8 private constant RESERVATION_RELEASED = 2;
    uint8 private constant RESERVATION_SETTLED = 3;

    IERC20 public kgen;
    uint8 public kgenDecimals;

    address public treasury;
    address public publicGoodTreasury;
    address public templeHeart;
    address public marsSeats;

    uint16 public marginBps;
    uint16 public marsBps;
    uint16 public publicGoodBps;
    uint256 public brainCapacityWhole;

    uint256 public totalPrincipal;
    mapping(address => uint256) public principalOf;

    struct PositionReservation {
        address user;
        uint256 amountWei;
        int256 realizedPnlWei;
        uint8 status;
    }

    mapping(bytes32 => PositionReservation) public positionReservations;
    mapping(address => uint256) public lockedPrincipalOf;
    uint256 public totalLockedPrincipal;

    uint256 public accRewardPerShare;
    uint256 public totalRewardLiability;
    mapping(address => uint256) public rewardDebt;
    mapping(address => uint256) public rewardCredit;

    uint256 public nextPayrollAt;
    uint256 public payrollInterval;

    bool public economicConfigLocked;

    address public scheduledImplementation;
    uint256 public scheduledUpgradeEta;
    uint256 public upgradeDelay;

    // Insurance is not a second custody pool: these KGEN remain in the Brain
    // contract and are merely reserved from payroll/admin spending. A gap loss
    // consumes this reserve first. Any remainder is recorded as uncovered debt
    // and blocks new risk until real KGEN recapitalizes it.
    uint256 public insuranceReserve;
    uint256 public uncoveredBadDebt;

    event MarginDeposited(address indexed user, uint256 requestedWei, uint256 receivedWei);
    event MarginWithdrawn(address indexed user, uint256 amountWei);
    event ProfitAccrued(address indexed user, uint256 amountWei);
    event ProfitClaimed(address indexed user, uint256 amountWei);
    event PositionCollateralReserved(bytes32 indexed positionKey, address indexed user, uint256 amountWei);
    event PositionCollateralReleased(bytes32 indexed positionKey, address indexed user, uint256 amountWei);
    event PositionCollateralSettled(
        bytes32 indexed positionKey,
        address indexed user,
        uint256 lockedWei,
        int256 realizedPnlWei,
        uint256 badDebtWei,
        uint256 insuranceCoveredWei,
        uint256 principalAfterWei
    );
    event InsuranceAllocated(uint256 amountWei, uint256 reserveAfterWei);
    event BadDebtRecorded(bytes32 indexed positionKey, uint256 badDebtWei, uint256 insuranceCoveredWei, uint256 uncoveredAfterWei);
    event BadDebtRecapitalized(address indexed contributor, uint256 requestedWei, uint256 receivedWei, uint256 uncoveredAfterWei);
    event PayrollRolled(
        uint256 indexed whenTs,
        uint256 surplusBeforeWei,
        uint256 marginRewardWei,
        uint256 marsWei,
        uint256 publicGoodWei
    );
    event HeartSupplied(address indexed heart, uint256 amountWei);
    event TreasurySwept(address indexed treasury, uint256 amountWei);
    event TreasurySet(address indexed treasury);
    event PublicGoodTreasurySet(address indexed treasury);
    event TempleHeartSet(address indexed heart);
    event MarsSeatsSet(address indexed marsSeats);
    event SplitsSet(uint16 marginBps, uint16 marsBps, uint16 publicGoodBps);
    event BrainCapacitySet(uint256 capacityWhole);
    event PayrollScheduleSet(uint256 nextPayrollAt, uint256 payrollInterval);
    event EconomicConfigLocked();
    event UpgradeScheduled(address indexed implementation, uint256 eta);
    event UpgradeCancelled(address indexed implementation);
    event UpgradeDelaySet(uint256 delaySeconds);

    modifier economicUnlocked() {
        require(!economicConfigLocked, "ECONOMIC_CONFIG_LOCKED");
        _;
    }

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address token,
        address initialAdmin,
        address initialKeeper,
        address initialPauser,
        address initialUpgradeAuthority,
        address initialTreasury,
        uint256 initialNextPayrollAt
    ) external initializer {
        require(token != address(0), "ZERO_TOKEN");
        require(initialAdmin != address(0), "ZERO_ADMIN");
        require(initialUpgradeAuthority != address(0), "ZERO_UPGRADE_AUTH");
        require(initialTreasury != address(0), "ZERO_TREASURY");

        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        kgen = IERC20(token);
        kgenDecimals = IERC20Metadata(token).decimals();
        require(kgenDecimals <= 36, "DECIMALS_TOO_LARGE");

        treasury = initialTreasury;
        marginBps = 5_000;
        marsBps = 2_500;
        publicGoodBps = 500;
        brainCapacityWhole = 50_000_000;
        payrollInterval = 30 days;
        nextPayrollAt = initialNextPayrollAt;
        upgradeDelay = MIN_UPGRADE_DELAY;

        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(UPGRADE_ROLE, initialUpgradeAuthority);
        if (initialKeeper != address(0)) _grantRole(KEEPER_ROLE, initialKeeper);
        if (initialPauser != address(0)) _grantRole(PAUSER_ROLE, initialPauser);
    }

    // ---------------------------------------------------------------------
    // User funds
    // ---------------------------------------------------------------------

    function depositMargin(uint256 requestedWei) external nonReentrant whenNotPaused returns (uint256 receivedWei) {
        require(requestedWei > 0, "AMOUNT_ZERO");
        _accrue(msg.sender);

        uint256 beforeBal = kgen.balanceOf(address(this));
        kgen.safeTransferFrom(msg.sender, address(this), requestedWei);
        uint256 afterBal = kgen.balanceOf(address(this));
        require(afterBal > beforeBal, "NO_TOKENS_RECEIVED");
        receivedWei = afterBal - beforeBal;

        uint256 newTotalPrincipal = totalPrincipal + receivedWei;
        require(newTotalPrincipal <= principalCapacityWei(), "BRAIN_CAPACITY_EXCEEDED");

        totalPrincipal = newTotalPrincipal;
        principalOf[msg.sender] += receivedWei;
        rewardDebt[msg.sender] = (principalOf[msg.sender] * accRewardPerShare) / ACC_SCALE;

        emit MarginDeposited(msg.sender, requestedWei, receivedWei);
    }

    function availablePrincipal(address user) public view returns (uint256) {
        uint256 principal = principalOf[user];
        uint256 locked = lockedPrincipalOf[user];
        return principal > locked ? principal - locked : 0;
    }

    function withdrawMargin(uint256 amountWei) external nonReentrant {
        require(amountWei > 0, "AMOUNT_ZERO");
        require(availablePrincipal(msg.sender) >= amountWei, "PRINCIPAL_LOCKED_OR_INSUFFICIENT");
        _accrue(msg.sender);

        principalOf[msg.sender] -= amountWei;
        totalPrincipal -= amountWei;
        rewardDebt[msg.sender] = (principalOf[msg.sender] * accRewardPerShare) / ACC_SCALE;

        kgen.safeTransfer(msg.sender, amountWei);
        _assertSolvent();
        emit MarginWithdrawn(msg.sender, amountWei);
    }

    function claimProfit() external nonReentrant returns (uint256 amountWei) {
        _accrue(msg.sender);
        amountWei = rewardCredit[msg.sender];
        if (amountWei == 0) return 0;

        rewardCredit[msg.sender] = 0;
        totalRewardLiability -= amountWei;
        kgen.safeTransfer(msg.sender, amountWei);
        _assertSolvent();
        emit ProfitClaimed(msg.sender, amountWei);
    }

    function pendingProfit(address user) public view returns (uint256) {
        uint256 accumulated = (principalOf[user] * accRewardPerShare) / ACC_SCALE;
        uint256 unsettled = accumulated > rewardDebt[user] ? accumulated - rewardDebt[user] : 0;
        return rewardCredit[user] + unsettled;
    }

    function _accrue(address user) internal {
        uint256 accumulated = (principalOf[user] * accRewardPerShare) / ACC_SCALE;
        uint256 debt = rewardDebt[user];
        if (accumulated > debt) {
            uint256 newlyAccrued = accumulated - debt;
            rewardCredit[user] += newlyAccrued;
            emit ProfitAccrued(user, newlyAccrued);
        }
        rewardDebt[user] = accumulated;
    }

    // ---------------------------------------------------------------------
    // Insurance / trading health
    // ---------------------------------------------------------------------

    function tradingHealthy() public view returns (bool) {
        return solvent() && uncoveredBadDebt == 0;
    }

    /// @notice Earmark already-existing real Brain surplus as insurance.
    /// No token moves and no second custody pool is created.
    function allocateInsuranceReserve(uint256 amountWei) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        require(amountWei > 0, "AMOUNT_ZERO");
        require(uncoveredBadDebt == 0, "BAD_DEBT_OUTSTANDING");
        require(amountWei <= freeSurplus(), "SURPLUS_ONLY");
        insuranceReserve += amountWei;
        _assertSolvent();
        emit InsuranceAllocated(amountWei, insuranceReserve);
    }

    /// @notice Add real KGEN to repair uncovered trading bad debt. Actual
    /// received amount is measured, preserving fee-on-transfer correctness.
    function recapitalizeBadDebt(uint256 requestedWei) external nonReentrant returns (uint256 receivedWei) {
        require(requestedWei > 0, "AMOUNT_ZERO");
        require(uncoveredBadDebt > 0, "NO_BAD_DEBT");

        uint256 beforeBal = kgen.balanceOf(address(this));
        kgen.safeTransferFrom(msg.sender, address(this), requestedWei);
        uint256 afterBal = kgen.balanceOf(address(this));
        require(afterBal > beforeBal, "NO_TOKENS_RECEIVED");
        receivedWei = afterBal - beforeBal;

        uint256 reduction = receivedWei > uncoveredBadDebt ? uncoveredBadDebt : receivedWei;
        uncoveredBadDebt -= reduction;
        emit BadDebtRecapitalized(msg.sender, requestedWei, receivedWei, uncoveredBadDebt);
    }

    // ---------------------------------------------------------------------
    // Position collateral reservation / settlement
    // ---------------------------------------------------------------------

    function reservePositionCollateral(bytes32 positionKey, address user, uint256 amountWei)
        external
        onlyRole(SETTLEMENT_ROLE)
        nonReentrant
        whenNotPaused
    {
        require(positionKey != bytes32(0), "ZERO_POSITION_KEY");
        require(user != address(0), "ZERO_USER");
        require(amountWei > 0, "AMOUNT_ZERO");
        require(uncoveredBadDebt == 0, "TRADING_HALTED_BAD_DEBT");
        require(solvent(), "INSOLVENT");
        require(positionReservations[positionKey].status == 0, "POSITION_KEY_USED");
        require(availablePrincipal(user) >= amountWei, "INSUFFICIENT_AVAILABLE_PRINCIPAL");

        positionReservations[positionKey] = PositionReservation({
            user: user,
            amountWei: amountWei,
            realizedPnlWei: 0,
            status: RESERVATION_ACTIVE
        });
        lockedPrincipalOf[user] += amountWei;
        totalLockedPrincipal += amountWei;
        require(totalLockedPrincipal <= totalPrincipal, "LOCKED_GT_PRINCIPAL");

        emit PositionCollateralReserved(positionKey, user, amountWei);
    }

    function releasePositionCollateral(bytes32 positionKey)
        external
        onlyRole(SETTLEMENT_ROLE)
        nonReentrant
    {
        PositionReservation storage reservation = positionReservations[positionKey];
        require(reservation.status == RESERVATION_ACTIVE, "RESERVATION_NOT_ACTIVE");

        address user = reservation.user;
        uint256 amountWei = reservation.amountWei;
        reservation.status = RESERVATION_RELEASED;
        lockedPrincipalOf[user] -= amountWei;
        totalLockedPrincipal -= amountWei;

        emit PositionCollateralReleased(positionKey, user, amountWei);
    }

    /// @notice Atomically apply engine-bounded realized PnL and explicit gap
    /// bad debt. Existing insurance is consumed first. Insufficient insurance
    /// never charges unrelated user principal and never traps the close; the
    /// remainder becomes uncoveredBadDebt and halts only new risk.
    function settlePositionCollateral(bytes32 positionKey, int256 realizedPnlWei, uint256 badDebtWei)
        external
        onlyRole(SETTLEMENT_ROLE)
        nonReentrant
    {
        PositionReservation storage reservation = positionReservations[positionKey];
        require(reservation.status == RESERVATION_ACTIVE, "RESERVATION_NOT_ACTIVE");

        address user = reservation.user;
        uint256 lockedWei = reservation.amountWei;
        _accrue(user);

        lockedPrincipalOf[user] -= lockedWei;
        totalLockedPrincipal -= lockedWei;

        uint256 lossWei;
        if (realizedPnlWei > 0) {
            require(badDebtWei == 0, "BAD_DEBT_WITH_PROFIT");
            uint256 profitWei = uint256(realizedPnlWei);
            require(profitWei <= freeSurplus(), "INSUFFICIENT_REAL_SURPLUS");
            principalOf[user] += profitWei;
            totalPrincipal += profitWei;
        } else if (realizedPnlWei < 0) {
            lossWei = uint256(-(realizedPnlWei + 1)) + 1;
            require(lossWei <= lockedWei, "LOSS_EXCEEDS_LOCKED_COLLATERAL");
            require(principalOf[user] >= lossWei, "LOSS_EXCEEDS_PRINCIPAL");
            if (badDebtWei > 0) require(lossWei == lockedWei, "BAD_DEBT_BEFORE_COLLATERAL_EXHAUSTED");
            principalOf[user] -= lossWei;
            totalPrincipal -= lossWei;
        } else {
            require(badDebtWei == 0, "BAD_DEBT_WITH_ZERO_PNL");
        }

        uint256 insuranceCoveredWei;
        if (badDebtWei > 0) {
            insuranceCoveredWei = badDebtWei > insuranceReserve ? insuranceReserve : badDebtWei;
            insuranceReserve -= insuranceCoveredWei;
            uint256 uncoveredWei = badDebtWei - insuranceCoveredWei;
            uncoveredBadDebt += uncoveredWei;
            emit BadDebtRecorded(positionKey, badDebtWei, insuranceCoveredWei, uncoveredBadDebt);
        }

        reservation.realizedPnlWei = realizedPnlWei;
        reservation.status = RESERVATION_SETTLED;
        rewardDebt[user] = (principalOf[user] * accRewardPerShare) / ACC_SCALE;

        // Actual user principal/reward/insurance liabilities remain fully backed.
        // uncoveredBadDebt is explicit trading deficit metadata, not a fabricated
        // payable reserve; new risk is halted until recapitalized.
        _assertSolvent();

        emit PositionCollateralSettled(
            positionKey,
            user,
            lockedWei,
            realizedPnlWei,
            badDebtWei,
            insuranceCoveredWei,
            principalOf[user]
        );
    }

    // ---------------------------------------------------------------------
    // Surplus / payroll
    // ---------------------------------------------------------------------

    function reservedBalance() public view returns (uint256) {
        return totalPrincipal + totalRewardLiability + insuranceReserve;
    }

    function freeSurplus() public view returns (uint256) {
        uint256 bal = kgen.balanceOf(address(this));
        uint256 reserved = reservedBalance();
        return bal > reserved ? bal - reserved : 0;
    }

    function solvent() public view returns (bool) {
        return kgen.balanceOf(address(this)) >= reservedBalance();
    }

    function _assertSolvent() internal view {
        require(solvent(), "INSOLVENT");
    }

    function rollPayroll() external onlyRole(KEEPER_ROLE) nonReentrant whenNotPaused {
        require(uncoveredBadDebt == 0, "BAD_DEBT_OUTSTANDING");
        require(nextPayrollAt != 0, "PAYROLL_NOT_SET");
        require(block.timestamp >= nextPayrollAt, "NOT_YET");
        require(solvent(), "INSOLVENT");

        uint256 intervalsElapsed = ((block.timestamp - nextPayrollAt) / payrollInterval) + 1;
        nextPayrollAt += intervalsElapsed * payrollInterval;

        uint256 surplus = freeSurplus();
        if (surplus == 0) {
            emit PayrollRolled(block.timestamp, 0, 0, 0, 0);
            return;
        }

        uint256 marginReward = (surplus * marginBps) / MAX_BPS;
        uint256 marsAmount = (surplus * marsBps) / MAX_BPS;
        uint256 publicGoodAmount = (surplus * publicGoodBps) / MAX_BPS;

        if (marginReward > 0 && totalPrincipal > 0) {
            accRewardPerShare += (marginReward * ACC_SCALE) / totalPrincipal;
            totalRewardLiability += marginReward;
        } else {
            marginReward = 0;
        }

        if (publicGoodAmount > 0) {
            require(publicGoodTreasury != address(0), "PUBLIC_GOOD_NOT_SET");
            kgen.safeTransfer(publicGoodTreasury, publicGoodAmount);
        }

        if (marsAmount > 0) {
            require(marsSeats != address(0), "MARS_NOT_SET");
            kgen.safeTransfer(marsSeats, marsAmount);
            IKGENMarsSeatsV4(marsSeats).notifyReward(marsAmount);
        }

        _assertSolvent();
        emit PayrollRolled(block.timestamp, surplus, marginReward, marsAmount, publicGoodAmount);
    }

    function supplyHeart(uint256 amountWei) external onlyRole(KEEPER_ROLE) nonReentrant whenNotPaused {
        require(uncoveredBadDebt == 0, "BAD_DEBT_OUTSTANDING");
        require(templeHeart != address(0), "HEART_NOT_SET");
        require(amountWei > 0, "AMOUNT_ZERO");
        require(amountWei <= freeSurplus(), "SURPLUS_ONLY");
        kgen.safeTransfer(templeHeart, amountWei);
        _assertSolvent();
        emit HeartSupplied(templeHeart, amountWei);
    }

    function sweepToTreasury(uint256 amountWei) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant whenNotPaused {
        require(uncoveredBadDebt == 0, "BAD_DEBT_OUTSTANDING");
        require(amountWei > 0, "AMOUNT_ZERO");
        require(treasury != address(0), "TREASURY_NOT_SET");
        require(amountWei <= freeSurplus(), "SURPLUS_ONLY");
        kgen.safeTransfer(treasury, amountWei);
        _assertSolvent();
        emit TreasurySwept(treasury, amountWei);
    }

    // ---------------------------------------------------------------------
    // Economic configuration
    // ---------------------------------------------------------------------

    function setTreasury(address next) external onlyRole(DEFAULT_ADMIN_ROLE) economicUnlocked {
        require(next != address(0), "ZERO_ADDR");
        treasury = next;
        emit TreasurySet(next);
    }

    function setPublicGoodTreasury(address next) external onlyRole(DEFAULT_ADMIN_ROLE) economicUnlocked {
        require(next != address(0), "ZERO_ADDR");
        publicGoodTreasury = next;
        emit PublicGoodTreasurySet(next);
    }

    function setTempleHeart(address next) external onlyRole(DEFAULT_ADMIN_ROLE) economicUnlocked {
        require(next != address(0), "ZERO_ADDR");
        templeHeart = next;
        emit TempleHeartSet(next);
    }

    function setMarsSeats(address next) external onlyRole(DEFAULT_ADMIN_ROLE) economicUnlocked {
        require(next != address(0), "ZERO_ADDR");
        marsSeats = next;
        emit MarsSeatsSet(next);
    }

    function setSplits(uint16 margin, uint16 mars, uint16 publicGood)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        economicUnlocked
    {
        require(uint256(margin) + uint256(mars) + uint256(publicGood) <= MAX_BPS, "BPS_SUM");
        if (mars != 0) require(mars >= 2_000 && mars <= 3_000, "MARS_BPS_RANGE");
        marginBps = margin;
        marsBps = mars;
        publicGoodBps = publicGood;
        emit SplitsSet(margin, mars, publicGood);
    }

    function setBrainCapacityWhole(uint256 capacityWhole)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        economicUnlocked
    {
        require(capacityWhole > 0, "CAP_ZERO");
        require(capacityWhole * (10 ** uint256(kgenDecimals)) >= totalPrincipal, "CAP_BELOW_PRINCIPAL");
        brainCapacityWhole = capacityWhole;
        emit BrainCapacitySet(capacityWhole);
    }

    function setPayrollSchedule(uint256 nextAt, uint256 interval)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        economicUnlocked
    {
        require(interval >= MIN_PAYROLL_INTERVAL, "INTERVAL_SMALL");
        nextPayrollAt = nextAt;
        payrollInterval = interval;
        emit PayrollScheduleSet(nextAt, interval);
    }

    function lockEconomicConfig() external onlyRole(DEFAULT_ADMIN_ROLE) economicUnlocked {
        economicConfigLocked = true;
        emit EconomicConfigLocked();
    }

    function principalCapacityWei() public view returns (uint256) {
        return brainCapacityWhole * (10 ** uint256(kgenDecimals));
    }

    // ---------------------------------------------------------------------
    // Pause / upgrades
    // ---------------------------------------------------------------------

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function setUpgradeDelay(uint256 delaySeconds) external onlyRole(UPGRADE_ROLE) {
        require(delaySeconds >= MIN_UPGRADE_DELAY, "UPGRADE_DELAY_TOO_SMALL");
        upgradeDelay = delaySeconds;
        emit UpgradeDelaySet(delaySeconds);
    }

    function scheduleUpgrade(address implementation) external onlyRole(UPGRADE_ROLE) {
        require(implementation != address(0), "ZERO_IMPLEMENTATION");
        scheduledImplementation = implementation;
        scheduledUpgradeEta = block.timestamp + upgradeDelay;
        emit UpgradeScheduled(implementation, scheduledUpgradeEta);
    }

    function cancelUpgrade() external onlyRole(UPGRADE_ROLE) {
        address old = scheduledImplementation;
        scheduledImplementation = address(0);
        scheduledUpgradeEta = 0;
        emit UpgradeCancelled(old);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADE_ROLE) {
        require(newImplementation == scheduledImplementation, "UPGRADE_NOT_SCHEDULED");
        require(scheduledUpgradeEta != 0 && block.timestamp >= scheduledUpgradeEta, "UPGRADE_TIMELOCK");
        scheduledImplementation = address(0);
        scheduledUpgradeEta = 0;
    }

    // Reservation consumed 3 slots; insurance accounting consumes 2 more.
    uint256[35] private __gap;
}
