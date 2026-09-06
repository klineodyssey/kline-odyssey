// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IKAIOSAlchemyProofSource {
    struct AlchemyBurnRecord {
        address owner;
        address beneficiary;
        address furnace;
        uint256 kaiosBurned;
        uint256 expectedKufo;
        bytes32 lifeId;
        bytes32 destinationCode;
        uint256 blockNumber;
        uint256 timestamp;
    }

    function alchemyBurnRecord(bytes32 proofId) external view returns (AlchemyBurnRecord memory);
}

interface IKAIOSOrganRegistryForTempleHeart {
    function organ(bytes32 organId) external view returns (address);
}

/**
 * @title KGEN_TempleHeart_Upgradeable
 * @notice Point 12345 TempleHeart UUPS review candidate aligned to the KAIOS Alchemy lineage.
 * @dev Version belongs to metadata. This executable filename is intentionally version-free.
 *      Compile, storage-validate, fuzz, invariant-test and independently audit before mainnet.
 */
contract KGEN_TempleHeart_Upgradeable is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    EIP712Upgradeable
{
    using SafeERC20 for IERC20;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant HOLY_CUP_SIGNER_ROLE = keccak256("HOLY_CUP_SIGNER_ROLE");
    bytes32 public constant HOLY_CUP_TYPEHASH = keccak256(
        "HolyCupProof(address claimant,bytes32 civilizationId,bytes32 wishHash,bytes32 proofId,uint256 deadline)"
    );
    bytes32 public constant ORGAN_EXCHANGE_TREASURY_11520 =
        keccak256("KAIOS.ORGAN.EXCHANGE_TREASURY.11520");

    uint256 public constant KUFO_PER_KAIOS = 1_000;
    uint256 public constant VERSION_MAJOR = 3;
    uint256 public constant VERSION_MINOR = 4;
    uint256 public constant VERSION_PATCH = 0;
    uint256 public constant HEARTBEAT_REWARD_WHOLE = 1;
    uint256 public constant IGNITE_REWARD_WHOLE = 8;
    uint256 public constant IGNITE_WINDOW_SECONDS = 10 minutes;
    uint256 public constant MIN_FORTUNE_KGEN_PASS_RAW = 1_000_000_000_000_000_000;

    enum WishStatus { None, Created, HolyCupPassed, Claimable, Fulfilled, Expired }
    enum BurnOfferingType { None, Incense, JossPaper, BlessingLamp, FortuneCharm, VowOffering }
    enum CivilizationActivity { Wish, HolyCup, Heartbeat, Ignite, KAIOSOffering, FortuneRepayment }

    struct WishRecord {
        bytes32 wishHash;
        bytes32 civilizationId;
        uint64 createdAt;
        uint64 updatedAt;
        WishStatus status;
    }

    struct FortuneLedger {
        uint256 totalClaimed;
        uint256 totalVoluntaryRepaid;
        uint256 lastClaimAmount;
        uint256 lastClaimAt;
        uint256 lastVoluntaryRepaymentAmount;
        uint256 lastVoluntaryRepaymentAt;
        uint64 claimCount;
        uint64 repaymentCount;
        bool repaidAfterLastClaim;
    }

    // V3.3.1-compatible custom storage region. Do not reorder or change widths.
    IERC20 public kgen;
    address public deprecatedProofSource;

    address public brainVault;
    address public lingxiaoBank;
    address public marsVault;
    address public autoLP;
    address public blackhole;
    address public fortuneGame;

    uint256 public baseCapWhole;
    uint256 public maxCapWhole;
    uint256 public capBps;
    uint256 public baseFloorWhole;
    uint256 public floorBps;

    uint256 public fortuneMinWhole;
    uint256 public fortuneMaxWhole;
    uint256 public fortuneCooldownSeconds;
    uint256 public fortuneEpochSeconds;
    uint256 public fortuneEpochMaxClaims;
    bool public fortuneCapEnabled;
    uint256 public minimumBurnWholeForFortune;
    bytes32 public fortunePurposeCode;

    uint256 public heartbeatCooldownSeconds;
    uint256 public heartbeatBlessingPower;
    uint256 public breathBlessingPower;

    mapping(uint8 => bytes32) public offeringPurposeCode;
    mapping(uint8 => uint256) public offeringPowerPerWholeKgen; // Deprecated slot; never read by V3.3.2.

    mapping(address => WishRecord) private _activeWishByUser;
    mapping(bytes32 => bool) public holyCupProofConsumed;

    mapping(bytes32 => bool) public isPilgrim;
    mapping(address => bytes32) public pilgrimCivilizationByWallet;
    mapping(uint256 => uint256) public dailyNewPilgrims;
    mapping(uint256 => uint256) public dailyActivePilgrims;
    mapping(uint256 => mapping(bytes32 => bool)) private _activePilgrimSeenOnDay;
    uint256 public totalPilgrims;
    uint256 public totalWishers;
    uint256 public totalHolyCupPassed;
    uint256 public totalFortuneClaimants;

    mapping(address => uint256) public lastHeartbeatAt;
    mapping(bytes32 => uint256) public lastCivilizationHeartbeatAt;
    mapping(address => uint256) public lastBreathDay;
    mapping(bytes32 => uint256) public lastCivilizationBreathDay;
    mapping(bytes32 => uint256) public blessingPowerByCivilization;
    mapping(bytes32 => uint256) public heartbeatCountByCivilization;
    mapping(bytes32 => uint256) public breathCountByCivilization;
    uint256 public totalHeartbeats;
    uint256 public totalBreaths;

    mapping(bytes32 => bool) public offeringBurnProofConsumed;
    mapping(uint8 => uint256) public totalOfferingBurnedByType;
    mapping(uint8 => uint256) public totalOfferingCountByType;
    uint256 public totalOfferingKgenBurned; // Deprecated slot; never written by V3.3.2.

    mapping(address => uint256) public lastFortuneAt;
    mapping(bytes32 => uint256) public lastCivilizationFortuneAt;
    mapping(uint256 => uint256) public fortuneEpochClaims;
    mapping(bytes32 => bool) public fortuneBurnProofConsumed;
    uint256 public totalFortunePaid;

    // V3.3.2 append-only storage.
    IKAIOSAlchemyProofSource public kaiosAlchemyProofSource;
    mapping(uint8 => uint256) public offeringPowerPerWholeKaios;
    uint256 public totalOfferingKaiosBurned;

    // V3.4.0 append-only storage. The legacy brainVault slot above is retained but is no longer authoritative.
    IKAIOSOrganRegistryForTempleHeart public organRegistry;
    uint256 public gameSurvivalGateWhole;
    mapping(uint256 => uint256) public heartbeatHourClaims;
    uint256 public heartbeatMaxClaimsPerHour;
    uint256 public totalHeartbeatPaid;
    mapping(uint256 => uint256) public igniteDayClaims;
    uint256 public igniteMaxClaimsPerDay;
    uint256 public totalIgnites;
    uint256 public totalIgnitePaid;
    mapping(address => FortuneLedger) private _fortuneLedgerByWallet;
    mapping(address => bool) private _customerWallet;
    uint256 public totalCustomerWallets;
    mapping(uint256 => uint256) public dailyNewCustomerWallets;
    mapping(uint256 => uint256) public dailyActiveCustomerWallets;
    mapping(uint256 => mapping(address => bool)) private _activeCustomerSeenOnDay;

    event TempleHeartInitialized(
        address indexed admin,
        address indexed kgen,
        address indexed brainVault,
        address kaiosAlchemyProofSource
    );
    event OrgansUpdated(address indexed lingxiaoBank, address indexed marsVault, address indexed autoLP, address blackhole);
    event FortuneGameUpdated(address indexed fortuneGame);
    event KAIOSAlchemyProofSourceBound(address indexed proofSource);
    event PilgrimRegistered(address indexed user, bytes32 indexed civilizationId, uint256 indexed dayIndex, uint256 totalPilgrims);
    event PilgrimActive(address indexed user, bytes32 indexed civilizationId, uint256 indexed dayIndex);
    event WishMade(address indexed user, bytes32 indexed wishHash, bytes32 indexed civilizationId);
    event HolyCupPassed(address indexed user, bytes32 indexed civilizationId, bytes32 indexed proofId, bytes32 wishHash);
    event KAIOSAlchemyOfferingRecorded(
        address indexed user,
        bytes32 indexed civilizationId,
        bytes32 indexed proofId,
        BurnOfferingType offeringType,
        uint256 kaiosBurned,
        uint256 expectedKufo,
        uint256 blessingPowerAdded,
        bytes32 wishHash
    );
    event Heartbeat(address indexed user, bytes32 indexed civilizationId, uint256 indexed heartbeatIndex, uint256 blessingPowerTotal);
    event CrossDayBreath(address indexed user, bytes32 indexed civilizationId, uint256 indexed dayIndex, uint256 blessingPowerTotal);
    event FortuneClaimed(address indexed user, bytes32 indexed civilizationId, bytes32 indexed proofId, uint256 amount, uint256 epochIndex, uint256 blessingPower, bytes32 wishHash);
    event BloodInjectedFromBrain(address indexed brainVault, uint256 amount);
    event ExcessSweptToBrain(address indexed brainVault, uint256 excess, uint256 capAmount);
    event OrganRegistryUpdated(address indexed organRegistry);
    event HeartNormalized(address indexed caller, address indexed treasury11520, uint256 excess, uint256 capAmount);
    event HeartbeatClaimed(
        address indexed user,
        bytes32 indexed civilizationId,
        uint256 indexed hourIndex,
        uint256 amount,
        uint256 hourClaims
    );
    event IgniteClaimed(
        address indexed user,
        bytes32 indexed civilizationId,
        uint256 indexed dayIndex,
        uint256 amount,
        uint256 dayClaims
    );
    event FortuneVoluntarilyRepaid(
        address indexed user,
        bytes32 indexed civilizationId,
        uint256 amount,
        uint256 totalVoluntaryRepaid,
        bool repaidAfterLastClaim
    );
    event CustomerWalletRegistered(address indexed user, uint256 indexed dayIndex, uint256 totalCustomerWallets);
    event CustomerWalletActive(address indexed user, uint256 indexed dayIndex);
    event GamePayout(address indexed game, address indexed player, uint256 amount, uint256 remainingHeartBalance);
    event CivilizationContribution(
        address indexed user,
        bytes32 indexed civilizationId,
        CivilizationActivity indexed activity,
        uint256 measure,
        uint256 blessingPowerTotal
    );

    error ZeroAddress();
    error NotAContract(address account);
    error ProofSourceAlreadyBound();
    error InvalidRange();
    error InvalidWish();
    error InvalidCivilization();
    error InvalidAlchemyProof();
    error ProofAlreadyConsumed();
    error HolyCupProofAlreadyConsumed();
    error WishNotReady();
    error FortuneCooldown();
    error CivilizationCooldown();
    error FortuneEpochFull();
    error HeartInsufficientFunds();
    error BurnTooSmall();
    error PurposeMismatch();
    error BurnerMismatch();
    error BeneficiaryMismatch();
    error CivilizationMismatch();
    error KUFOAmountMismatch();
    error InvalidProofSigner();
    error ProofExpired();
    error HeartbeatCooldown();
    error BreathAlreadyTaken();
    error InvalidOfferingType();
    error OrganRegistryNotSet();
    error CanonicalTreasuryNotSet();
    error HeartbeatHourFull();
    error IgniteWindowClosed();
    error IgniteDayFull();
    error RepaymentRequired();
    error FortuneKgenPassRequired(uint256 actualBalance, uint256 requiredBalance);
    error UnauthorizedGame();
    error GameSurvivalGateClosed();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address admin,
        address upgrader,
        address operator,
        address holyCupSigner,
        address kgenToken,
        address _brainVault,
        address alchemyProofSource
    ) external initializer {
        if (
            admin == address(0) || upgrader == address(0) || operator == address(0) ||
            holyCupSigner == address(0) || kgenToken == address(0) || alchemyProofSource == address(0)
        ) revert ZeroAddress();
        if (kgenToken.code.length == 0) revert NotAContract(kgenToken);
        if (alchemyProofSource.code.length == 0) revert NotAContract(alchemyProofSource);

        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __EIP712_init("KGEN TempleHeart 12345", "3.4.0");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, upgrader);
        _grantRole(OPERATOR_ROLE, operator);
        _grantRole(HOLY_CUP_SIGNER_ROLE, holyCupSigner);

        kgen = IERC20(kgenToken);
        brainVault = _brainVault;
        kaiosAlchemyProofSource = IKAIOSAlchemyProofSource(alchemyProofSource);

        baseCapWhole = 108_000;
        maxCapWhole = 7_200_000;
        baseFloorWhole = 20_000;
        fortuneMinWhole = 1;
        fortuneMaxWhole = 8;
        fortuneCooldownSeconds = 30 days;
        fortuneEpochSeconds = 30 days;
        fortuneEpochMaxClaims = 500;
        fortuneCapEnabled = true;
        minimumBurnWholeForFortune = 1;
        fortunePurposeCode = keccak256("KAIOS_12345_FORTUNE");
        heartbeatCooldownSeconds = 1 hours;
        heartbeatBlessingPower = 1;
        breathBlessingPower = 8;
        gameSurvivalGateWhole = 1_888;
        heartbeatMaxClaimsPerHour = 88;
        igniteMaxClaimsPerDay = 88;

        _setDefaultOfferingRules();
        emit TempleHeartInitialized(admin, kgenToken, _brainVault, alchemyProofSource);
    }

    function initializeAlchemyIntegration(address alchemyProofSource)
        external
        reinitializer(2)
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (alchemyProofSource == address(0)) revert ZeroAddress();
        if (alchemyProofSource.code.length == 0) revert NotAContract(alchemyProofSource);
        if (address(kaiosAlchemyProofSource) != address(0)) revert ProofSourceAlreadyBound();
        __EIP712_init("KGEN TempleHeart 12345", "3.3.2");
        kaiosAlchemyProofSource = IKAIOSAlchemyProofSource(alchemyProofSource);
        _setDefaultOfferingRules();
        emit KAIOSAlchemyProofSourceBound(alchemyProofSource);
    }

    function initializeV340(address registry)
        external
        reinitializer(3)
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _setOrganRegistry(registry);
        __EIP712_init("KGEN TempleHeart 12345", "3.4.0");
        gameSurvivalGateWhole = 1_888;
        heartbeatMaxClaimsPerHour = 88;
        igniteMaxClaimsPerDay = 88;
    }

    function version() external pure returns (string memory) {
        return "3.4.0";
    }

    function pause() external onlyRole(OPERATOR_ROLE) { _pause(); }
    function unpause() external onlyRole(OPERATOR_ROLE) { _unpause(); }

    function setOrgans(address bank, address mars, address lp, address hole) external onlyRole(DEFAULT_ADMIN_ROLE) {
        lingxiaoBank = bank;
        marsVault = mars;
        autoLP = lp;
        blackhole = hole;
        emit OrgansUpdated(bank, mars, lp, hole);
    }

    function setFortuneGame(address game) external onlyRole(DEFAULT_ADMIN_ROLE) {
        fortuneGame = game;
        emit FortuneGameUpdated(game);
    }

    function setOrganRegistry(address registry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setOrganRegistry(registry);
    }

    function setOfferingRule(BurnOfferingType offeringType, bytes32 purposeCode, uint256 powerPerWholeKaios)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (offeringType == BurnOfferingType.None) revert InvalidOfferingType();
        if (purposeCode == bytes32(0) || powerPerWholeKaios == 0) revert InvalidRange();
        offeringPurposeCode[uint8(offeringType)] = purposeCode;
        offeringPowerPerWholeKaios[uint8(offeringType)] = powerPerWholeKaios;
    }

    function makeWish(bytes32 wishHash, bytes32 civilizationId) external whenNotPaused {
        if (wishHash == bytes32(0)) revert InvalidWish();
        if (civilizationId == bytes32(0)) revert InvalidCivilization();
        _registerPilgrim(msg.sender, civilizationId);
        _registerCustomerWallet(msg.sender);
        _activeWishByUser[msg.sender] = WishRecord(
            wishHash,
            civilizationId,
            uint64(block.timestamp),
            uint64(block.timestamp),
            WishStatus.Created
        );
        totalWishers += 1;
        emit WishMade(msg.sender, wishHash, civilizationId);
        emit CivilizationContribution(
            msg.sender,
            civilizationId,
            CivilizationActivity.Wish,
            1,
            blessingPowerByCivilization[civilizationId]
        );
    }

    function activeWish(address user) external view returns (WishRecord memory) {
        return _activeWishByUser[user];
    }

    function submitHolyCupProof(
        bytes32 proofId,
        bytes32 civilizationId,
        bytes32 wishHash,
        uint256 deadline,
        bytes calldata signature
    ) external whenNotPaused {
        if (proofId == bytes32(0)) revert InvalidWish();
        if (block.timestamp > deadline) revert ProofExpired();
        if (holyCupProofConsumed[proofId]) revert HolyCupProofAlreadyConsumed();

        WishRecord storage wish = _activeWishByUser[msg.sender];
        if (wish.wishHash != wishHash || wish.civilizationId != civilizationId) revert InvalidWish();
        if (wish.status == WishStatus.None || wish.status == WishStatus.Fulfilled) revert WishNotReady();

        bytes32 structHash = keccak256(
            abi.encode(HOLY_CUP_TYPEHASH, msg.sender, civilizationId, wishHash, proofId, deadline)
        );
        address signer = ECDSA.recover(_hashTypedDataV4(structHash), signature);
        if (!hasRole(HOLY_CUP_SIGNER_ROLE, signer)) revert InvalidProofSigner();

        holyCupProofConsumed[proofId] = true;
        wish.status = WishStatus.HolyCupPassed;
        wish.updatedAt = uint64(block.timestamp);
        totalHolyCupPassed += 1;
        _touchPilgrim(msg.sender, civilizationId);
        _touchCustomerWallet(msg.sender);
        emit HolyCupPassed(msg.sender, civilizationId, proofId, wishHash);
        emit CivilizationContribution(
            msg.sender,
            civilizationId,
            CivilizationActivity.HolyCup,
            1,
            blessingPowerByCivilization[civilizationId]
        );
    }

    function recordBurnOffering(bytes32 proofId, BurnOfferingType offeringType)
        external
        whenNotPaused
        returns (uint256 blessingPowerAdded)
    {
        if (proofId == bytes32(0)) revert InvalidAlchemyProof();
        if (offeringType == BurnOfferingType.None) revert InvalidOfferingType();
        if (offeringBurnProofConsumed[proofId]) revert ProofAlreadyConsumed();

        WishRecord storage wish = _activeWishByUser[msg.sender];
        if (wish.status == WishStatus.None || wish.status == WishStatus.Fulfilled) revert WishNotReady();
        IKAIOSAlchemyProofSource.AlchemyBurnRecord memory record = _validatedProof(
            proofId,
            msg.sender,
            wish,
            offeringPurposeCode[uint8(offeringType)]
        );

        offeringBurnProofConsumed[proofId] = true;
        uint256 wholeBurned = _descale(record.kaiosBurned);
        if (wholeBurned == 0) wholeBurned = 1;
        blessingPowerAdded = wholeBurned * offeringPowerPerWholeKaios[uint8(offeringType)];
        blessingPowerByCivilization[wish.civilizationId] += blessingPowerAdded;
        totalOfferingKaiosBurned += record.kaiosBurned;
        totalOfferingBurnedByType[uint8(offeringType)] += record.kaiosBurned;
        totalOfferingCountByType[uint8(offeringType)] += 1;
        _touchPilgrim(msg.sender, wish.civilizationId);
        _touchCustomerWallet(msg.sender);

        emit KAIOSAlchemyOfferingRecorded(
            msg.sender,
            wish.civilizationId,
            proofId,
            offeringType,
            record.kaiosBurned,
            record.expectedKufo,
            blessingPowerAdded,
            wish.wishHash
        );
        emit CivilizationContribution(
            msg.sender,
            wish.civilizationId,
            CivilizationActivity.KAIOSOffering,
            record.kaiosBurned,
            blessingPowerByCivilization[wish.civilizationId]
        );
    }

    function heartbeatClaim() external nonReentrant whenNotPaused returns (uint256 blessingPowerTotal) {
        return _heartbeatClaim();
    }

    // Backward-compatible selector; it executes the same capped paid claim and cannot bypass policy.
    function heartbeat() external nonReentrant whenNotPaused returns (uint256 blessingPowerTotal) {
        return _heartbeatClaim();
    }

    function _heartbeatClaim() private returns (uint256 blessingPowerTotal) {
        WishRecord storage wish = _activeWishByUser[msg.sender];
        if (wish.status == WishStatus.None || wish.status == WishStatus.Fulfilled) revert WishNotReady();
        bytes32 civilizationId = wish.civilizationId;
        if (block.timestamp < lastHeartbeatAt[msg.sender] + heartbeatCooldownSeconds) revert HeartbeatCooldown();
        if (block.timestamp < lastCivilizationHeartbeatAt[civilizationId] + heartbeatCooldownSeconds) {
            revert HeartbeatCooldown();
        }
        uint256 hourIndex = block.timestamp / 1 hours;
        if (heartbeatHourClaims[hourIndex] >= heartbeatMaxClaimsPerHour) revert HeartbeatHourFull();
        uint256 rewardAmount = _scale(HEARTBEAT_REWARD_WHOLE);
        _requireOperationalReservePayout(rewardAmount);

        lastHeartbeatAt[msg.sender] = block.timestamp;
        lastCivilizationHeartbeatAt[civilizationId] = block.timestamp;
        heartbeatHourClaims[hourIndex] += 1;
        heartbeatCountByCivilization[civilizationId] += 1;
        totalHeartbeats += 1;
        totalHeartbeatPaid += rewardAmount;
        blessingPowerByCivilization[civilizationId] += heartbeatBlessingPower;
        blessingPowerTotal = blessingPowerByCivilization[civilizationId];
        kgen.safeTransfer(msg.sender, rewardAmount);
        _touchPilgrim(msg.sender, civilizationId);
        _touchCustomerWallet(msg.sender);
        emit Heartbeat(msg.sender, civilizationId, heartbeatCountByCivilization[civilizationId], blessingPowerTotal);
        emit HeartbeatClaimed(
            msg.sender,
            civilizationId,
            hourIndex,
            rewardAmount,
            heartbeatHourClaims[hourIndex]
        );
        emit CivilizationContribution(
            msg.sender,
            civilizationId,
            CivilizationActivity.Heartbeat,
            1,
            blessingPowerTotal
        );
    }

    function igniteAndClaim() external nonReentrant whenNotPaused returns (uint256 blessingPowerTotal) {
        return _igniteAndClaim();
    }

    // Backward-compatible selector; it executes the same UTC-windowed capped paid claim.
    function crossDayBreath() external nonReentrant whenNotPaused returns (uint256 blessingPowerTotal) {
        return _igniteAndClaim();
    }

    function _igniteAndClaim() private returns (uint256 blessingPowerTotal) {
        WishRecord storage wish = _activeWishByUser[msg.sender];
        if (wish.status == WishStatus.None || wish.status == WishStatus.Fulfilled) revert WishNotReady();
        bytes32 civilizationId = wish.civilizationId;
        uint256 dayIndex = block.timestamp / 1 days;
        if (block.timestamp % 1 days >= IGNITE_WINDOW_SECONDS) revert IgniteWindowClosed();
        if (lastBreathDay[msg.sender] == dayIndex) revert BreathAlreadyTaken();
        if (lastCivilizationBreathDay[civilizationId] == dayIndex) revert BreathAlreadyTaken();
        if (igniteDayClaims[dayIndex] >= igniteMaxClaimsPerDay) revert IgniteDayFull();
        uint256 rewardAmount = _scale(IGNITE_REWARD_WHOLE);
        _requireOperationalReservePayout(rewardAmount);

        lastBreathDay[msg.sender] = dayIndex;
        lastCivilizationBreathDay[civilizationId] = dayIndex;
        igniteDayClaims[dayIndex] += 1;
        breathCountByCivilization[civilizationId] += 1;
        totalBreaths += 1;
        totalIgnites += 1;
        totalIgnitePaid += rewardAmount;
        blessingPowerByCivilization[civilizationId] += breathBlessingPower;
        blessingPowerTotal = blessingPowerByCivilization[civilizationId];
        kgen.safeTransfer(msg.sender, rewardAmount);
        _touchPilgrim(msg.sender, civilizationId);
        _touchCustomerWallet(msg.sender);
        emit CrossDayBreath(msg.sender, civilizationId, dayIndex, blessingPowerTotal);
        emit IgniteClaimed(
            msg.sender,
            civilizationId,
            dayIndex,
            rewardAmount,
            igniteDayClaims[dayIndex]
        );
        emit CivilizationContribution(
            msg.sender,
            civilizationId,
            CivilizationActivity.Ignite,
            1,
            blessingPowerTotal
        );
    }

    function fortuneClaim(bytes32 proofId) external nonReentrant whenNotPaused returns (uint256 rewardAmount) {
        if (proofId == bytes32(0)) revert InvalidAlchemyProof();
        if (fortuneBurnProofConsumed[proofId]) revert ProofAlreadyConsumed();
        uint256 claimantKgenBalance = kgen.balanceOf(msg.sender);
        if (claimantKgenBalance < MIN_FORTUNE_KGEN_PASS_RAW) {
            revert FortuneKgenPassRequired(claimantKgenBalance, MIN_FORTUNE_KGEN_PASS_RAW);
        }

        WishRecord storage wish = _activeWishByUser[msg.sender];
        FortuneLedger storage ledger = _fortuneLedgerByWallet[msg.sender];
        if (ledger.claimCount > 0 && !ledger.repaidAfterLastClaim) revert RepaymentRequired();
        if (wish.status != WishStatus.HolyCupPassed && wish.status != WishStatus.Claimable) revert WishNotReady();
        IKAIOSAlchemyProofSource.AlchemyBurnRecord memory record = _validatedProof(
            proofId,
            msg.sender,
            wish,
            fortunePurposeCode
        );
        if (record.kaiosBurned < _scale(minimumBurnWholeForFortune)) revert BurnTooSmall();
        if (block.timestamp < lastFortuneAt[msg.sender] + fortuneCooldownSeconds) revert FortuneCooldown();
        if (block.timestamp < lastCivilizationFortuneAt[wish.civilizationId] + fortuneCooldownSeconds) {
            revert CivilizationCooldown();
        }

        uint256 epochIndex = block.timestamp / fortuneEpochSeconds;
        if (fortuneCapEnabled) {
            if (fortuneEpochClaims[epochIndex] >= fortuneEpochMaxClaims) revert FortuneEpochFull();
            fortuneEpochClaims[epochIndex] += 1;
        }

        fortuneBurnProofConsumed[proofId] = true;
        lastFortuneAt[msg.sender] = block.timestamp;
        lastCivilizationFortuneAt[wish.civilizationId] = block.timestamp;
        wish.status = WishStatus.Fulfilled;
        wish.updatedAt = uint64(block.timestamp);

        uint256 power = blessingPowerByCivilization[wish.civilizationId];
        rewardAmount = _scale(_fortuneRewardWhole(power));
        _requireOperationalReservePayout(rewardAmount);
        totalFortunePaid += rewardAmount;
        totalFortuneClaimants += 1;
        ledger.totalClaimed += rewardAmount;
        ledger.lastClaimAmount = rewardAmount;
        ledger.lastClaimAt = block.timestamp;
        ledger.claimCount += 1;
        ledger.repaidAfterLastClaim = false;
        kgen.safeTransfer(msg.sender, rewardAmount);
        _touchPilgrim(msg.sender, wish.civilizationId);
        _touchCustomerWallet(msg.sender);
        emit FortuneClaimed(
            msg.sender,
            wish.civilizationId,
            proofId,
            rewardAmount,
            epochIndex,
            power,
            wish.wishHash
        );
    }

    function voluntaryRepayFortune(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidRange();
        WishRecord storage wish = _activeWishByUser[msg.sender];
        if (wish.status == WishStatus.None) revert WishNotReady();
        FortuneLedger storage ledger = _fortuneLedgerByWallet[msg.sender];

        kgen.safeTransferFrom(msg.sender, address(this), amount);
        ledger.totalVoluntaryRepaid += amount;
        ledger.lastVoluntaryRepaymentAmount = amount;
        ledger.lastVoluntaryRepaymentAt = block.timestamp;
        ledger.repaymentCount += 1;
        if (ledger.claimCount > 0 && block.timestamp >= ledger.lastClaimAt) {
            ledger.repaidAfterLastClaim = true;
        }

        uint256 wholeRepaid = _descale(amount);
        if (wholeRepaid > 0) {
            blessingPowerByCivilization[wish.civilizationId] += wholeRepaid;
        }
        _touchPilgrim(msg.sender, wish.civilizationId);
        _touchCustomerWallet(msg.sender);
        emit FortuneVoluntarilyRepaid(
            msg.sender,
            wish.civilizationId,
            amount,
            ledger.totalVoluntaryRepaid,
            ledger.repaidAfterLastClaim
        );
        emit CivilizationContribution(
            msg.sender,
            wish.civilizationId,
            CivilizationActivity.FortuneRepayment,
            amount,
            blessingPowerByCivilization[wish.civilizationId]
        );
        _normalizeHeartBalance();
    }

    function fortuneLedger(address user) external view returns (FortuneLedger memory) {
        return _fortuneLedgerByWallet[user];
    }

    function nextFortuneEligibility(address user)
        external
        view
        returns (bool eligible, bool repaymentSatisfied, uint256 cooldownEndsAt)
    {
        FortuneLedger storage ledger = _fortuneLedgerByWallet[user];
        repaymentSatisfied = ledger.claimCount == 0 || ledger.repaidAfterLastClaim;
        cooldownEndsAt = lastFortuneAt[user] + fortuneCooldownSeconds;
        eligible = repaymentSatisfied && block.timestamp >= cooldownEndsAt;
    }

    function previewFortuneReward(bytes32 civilizationId) external view returns (uint256) {
        return _fortuneRewardWhole(blessingPowerByCivilization[civilizationId]);
    }

    function alchemyDestinationCode(bytes32 purposeCode, bytes32 wishHash) public pure returns (bytes32) {
        return keccak256(abi.encode(purposeCode, wishHash));
    }

    function injectFromBrain(uint256 amountWhole) external nonReentrant onlyRole(OPERATOR_ROLE) {
        if (amountWhole == 0) revert InvalidRange();
        uint256 amount = _scale(amountWhole);
        address treasury11520 = current11520Treasury();
        kgen.safeTransferFrom(treasury11520, address(this), amount);
        emit BloodInjectedFromBrain(treasury11520, amount);
        _normalizeHeartBalance();
    }

    function sweepExcessToBrain() external nonReentrant onlyRole(OPERATOR_ROLE) {
        (address treasury11520, uint256 excess, uint256 capAmount) = _normalizeHeartBalance();
        emit ExcessSweptToBrain(treasury11520, excess, capAmount);
    }

    function normalizeHeartBalance()
        external
        nonReentrant
        returns (address treasury11520, uint256 excess, uint256 capAmount)
    {
        return _normalizeHeartBalance();
    }

    function current11520Treasury() public view returns (address treasury11520) {
        if (address(organRegistry) == address(0)) revert OrganRegistryNotSet();
        treasury11520 = organRegistry.organ(ORGAN_EXCHANGE_TREASURY_11520);
        if (treasury11520 == address(0)) revert CanonicalTreasuryNotSet();
        if (treasury11520.code.length == 0) revert NotAContract(treasury11520);
    }

    function isHeartGameOperational() public view returns (bool) {
        if (address(kgen) == address(0)) return false;
        return kgen.balanceOf(address(this)) >= _scale(gameSurvivalGateWhole);
    }

    function gamePayout(address player, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        if (msg.sender != fortuneGame) revert UnauthorizedGame();
        if (player == address(0) || amount == 0) revert InvalidRange();
        uint256 balance = kgen.balanceOf(address(this));
        uint256 gateAmount = _scale(gameSurvivalGateWhole);
        if (balance < gateAmount || balance < amount || balance - amount < gateAmount) {
            revert GameSurvivalGateClosed();
        }
        kgen.safeTransfer(player, amount);
        _touchCustomerWallet(player);
        emit GamePayout(msg.sender, player, amount, balance - amount);
    }

    function isCustomerWallet(address user) external view returns (bool) {
        return _customerWallet[user];
    }

    function _validatedProof(
        bytes32 proofId,
        address claimant,
        WishRecord storage wish,
        bytes32 purposeCode
    ) private view returns (IKAIOSAlchemyProofSource.AlchemyBurnRecord memory record) {
        record = kaiosAlchemyProofSource.alchemyBurnRecord(proofId);
        if (record.owner == address(0) || record.kaiosBurned == 0) revert InvalidAlchemyProof();
        if (record.owner != claimant) revert BurnerMismatch();
        if (record.beneficiary != claimant) revert BeneficiaryMismatch();
        if (record.lifeId != wish.civilizationId) revert CivilizationMismatch();
        if (record.destinationCode != alchemyDestinationCode(purposeCode, wish.wishHash)) revert PurposeMismatch();
        if (record.expectedKufo != record.kaiosBurned * KUFO_PER_KAIOS) revert KUFOAmountMismatch();
    }

    function _setDefaultOfferingRules() private {
        offeringPurposeCode[uint8(BurnOfferingType.Incense)] = keccak256("KAIOS_12345_INCENSE");
        offeringPurposeCode[uint8(BurnOfferingType.JossPaper)] = keccak256("KAIOS_12345_JOSS_PAPER");
        offeringPurposeCode[uint8(BurnOfferingType.BlessingLamp)] = keccak256("KAIOS_12345_BLESSING_LAMP");
        offeringPurposeCode[uint8(BurnOfferingType.FortuneCharm)] = keccak256("KAIOS_12345_FORTUNE_CHARM");
        offeringPurposeCode[uint8(BurnOfferingType.VowOffering)] = keccak256("KAIOS_12345_VOW_OFFERING");
        offeringPowerPerWholeKaios[uint8(BurnOfferingType.Incense)] = 1;
        offeringPowerPerWholeKaios[uint8(BurnOfferingType.JossPaper)] = 3;
        offeringPowerPerWholeKaios[uint8(BurnOfferingType.BlessingLamp)] = 5;
        offeringPowerPerWholeKaios[uint8(BurnOfferingType.FortuneCharm)] = 8;
        offeringPowerPerWholeKaios[uint8(BurnOfferingType.VowOffering)] = 12;
    }

    function _fortuneRewardWhole(uint256 power) private view returns (uint256 rewardWhole) {
        if (power >= 888) rewardWhole = 8;
        else if (power >= 688) rewardWhole = 7;
        else if (power >= 388) rewardWhole = 6;
        else if (power >= 188) rewardWhole = 5;
        else if (power >= 88) rewardWhole = 4;
        else if (power >= 28) rewardWhole = 3;
        else if (power >= 8) rewardWhole = 2;
        else rewardWhole = 1;
        if (rewardWhole < fortuneMinWhole) rewardWhole = fortuneMinWhole;
        if (rewardWhole > fortuneMaxWhole) rewardWhole = fortuneMaxWhole;
    }

    function _registerPilgrim(address user, bytes32 civilizationId) private {
        if (!isPilgrim[civilizationId]) {
            isPilgrim[civilizationId] = true;
            totalPilgrims += 1;
            dailyNewPilgrims[block.timestamp / 1 days] += 1;
            emit PilgrimRegistered(user, civilizationId, block.timestamp / 1 days, totalPilgrims);
        }
        pilgrimCivilizationByWallet[user] = civilizationId;
        _touchPilgrim(user, civilizationId);
    }

    function _registerCustomerWallet(address user) private {
        uint256 dayIndex = block.timestamp / 1 days;
        if (!_customerWallet[user]) {
            _customerWallet[user] = true;
            totalCustomerWallets += 1;
            dailyNewCustomerWallets[dayIndex] += 1;
            emit CustomerWalletRegistered(user, dayIndex, totalCustomerWallets);
        }
        _touchCustomerWallet(user);
    }

    function _touchCustomerWallet(address user) private {
        if (!_customerWallet[user]) return;
        uint256 dayIndex = block.timestamp / 1 days;
        if (!_activeCustomerSeenOnDay[dayIndex][user]) {
            _activeCustomerSeenOnDay[dayIndex][user] = true;
            dailyActiveCustomerWallets[dayIndex] += 1;
            emit CustomerWalletActive(user, dayIndex);
        }
    }

    function _touchPilgrim(address user, bytes32 civilizationId) private {
        uint256 dayIndex = block.timestamp / 1 days;
        if (!_activePilgrimSeenOnDay[dayIndex][civilizationId]) {
            _activePilgrimSeenOnDay[dayIndex][civilizationId] = true;
            dailyActivePilgrims[dayIndex] += 1;
            emit PilgrimActive(user, civilizationId, dayIndex);
        }
    }

    function _requireOperationalReservePayout(uint256 amount) private view {
        uint256 balance = kgen.balanceOf(address(this));
        if (balance < amount) revert HeartInsufficientFunds();
        uint256 reserveAmount = _scale(baseFloorWhole);
        if (balance - amount < reserveAmount) revert HeartInsufficientFunds();
    }

    function _normalizeHeartBalance()
        private
        returns (address treasury11520, uint256 excess, uint256 capAmount)
    {
        capAmount = _scale(baseCapWhole);
        uint256 balance = kgen.balanceOf(address(this));
        if (balance > capAmount) {
            treasury11520 = current11520Treasury();
            excess = balance - capAmount;
            kgen.safeTransfer(treasury11520, excess);
        } else if (address(organRegistry) != address(0)) {
            treasury11520 = organRegistry.organ(ORGAN_EXCHANGE_TREASURY_11520);
        }
        emit HeartNormalized(msg.sender, treasury11520, excess, capAmount);
    }

    function _setOrganRegistry(address registry) private {
        if (registry == address(0)) revert ZeroAddress();
        if (registry.code.length == 0) revert NotAContract(registry);
        organRegistry = IKAIOSOrganRegistryForTempleHeart(registry);
        emit OrganRegistryUpdated(registry);
    }

    function _scale(uint256 wholeTokens) private view returns (uint256) {
        return wholeTokens * (10 ** uint256(IERC20Metadata(address(kgen)).decimals()));
    }

    function _descale(uint256 amount) private view returns (uint256) {
        return amount / (10 ** uint256(IERC20Metadata(address(kgen)).decimals()));
    }

    function _authorizeUpgrade(address) internal override onlyRole(UPGRADER_ROLE) {}
}
