// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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

interface IKAIOSBurnProofGenesis {
    function burnProofConsumed(bytes32 burnProofId) external view returns (bool);
    function burnRecord(bytes32 burnProofId)
        external
        view
        returns (
            uint8 source,
            address burner,
            address recipientVault,
            uint256 kgenBurnAmount,
            uint256 kaiosMintAmount,
            bytes32 civilizationId,
            bytes32 purposeCode,
            bytes32 wishHash
        );
}

/**
 * @title KGEN_TempleHeart_V3_3_0_Upgradeable
 * @notice 五指山 12345｜悟空財神殿 Heart｜UUPS Proxy 世代。
 * @dev REVIEW DRAFT ONLY. Compile/test/storage-validate/audit before mainnet.
 *
 * V3.3.0 laws:
 * 1. Proxy address is the persistent public Heart identity.
 * 2. KAIOS BurnProofGenesis is read directly on-chain. No operator-supplied burn record.
 * 3. Fortune claim = Wish + Holy Cup 3/3 + verified voluntary KGEN burn + wallet/civilization cooldown.
 * 4. Player never chooses the fortune payout amount.
 * 5. Pilgrim / hourly heartbeat / cross-day breath are recorded on-chain.
 * 6. Heartbeat and breath are progression signals, NOT free KGEN faucets.
 * 7. Fortune game is burn-first: a valid KGEN burn proof is consumed before a future-block result exists.
 *    The UI must not reveal win/loss before the burn/open transaction is mined.
 */
contract KGEN_TempleHeart_V3_3_0_Upgradeable is
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

    uint8 public constant KAIOS_SOURCE_VOLUNTARY_PLAYER_OFFERING = 1;
    uint256 public constant KAIOS_PER_KGEN = 10_000;

    uint256 public constant VERSION_MAJOR = 3;
    uint256 public constant VERSION_MINOR = 3;
    uint256 public constant VERSION_PATCH = 0;

    enum WishStatus { None, Created, Offered, HolyCupPassed, Claimable, Fulfilled, Expired }
    enum OfferingType { None, Incense, JossPaper, BlessingLamp, FortuneCharm, VowOffering }

    struct WishRecord {
        bytes32 wishHash;
        bytes32 civilizationId;
        uint64 createdAt;
        uint64 updatedAt;
        WishStatus status;
    }

    struct GameRound {
        address player;
        bytes32 civilizationId;
        bytes32 burnProofId;
        uint256 burnedKgenAmount;
        uint64 targetBlock;
        bool settled;
        uint16 rollBps;
        uint256 payoutAmount;
    }

    IERC20 public kgen;
    address public brainVault;
    address public lingxiaoBank;
    address public marsVault;
    address public autoLP;
    address public blackhole;
    IKAIOSBurnProofGenesis public kaiosBurnProofGenesis;

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

    // Life rhythm. These do not directly pay KGEN.
    uint256 public heartbeatCooldownSeconds;
    uint256 public heartbeatBlessingPower;
    uint256 public breathBlessingPower;

    // Burn-first game.
    bytes32 public gamePurposeCode;
    uint256 public minimumGameBurnWhole;
    uint256 public nextGameId;

    mapping(address => uint256) public lastFortuneAt;
    mapping(bytes32 => uint256) public lastCivilizationFortuneAt;
    mapping(uint256 => uint256) public fortuneEpochClaims;
    mapping(bytes32 => bool) public fortuneBurnProofConsumed;

    mapping(address => WishRecord) private _activeWishByUser;
    mapping(bytes32 => bool) public holyCupProofConsumed;

    // Pilgrim registry / on-chain temple census.
    mapping(bytes32 => bool) public isPilgrim;
    mapping(address => bytes32) public pilgrimCivilizationByWallet;
    mapping(uint256 => uint256) public dailyNewPilgrims;
    mapping(uint256 => uint256) public dailyActivePilgrims;
    mapping(uint256 => mapping(bytes32 => bool)) private _activePilgrimSeenOnDay;
    uint256 public totalPilgrims;
    uint256 public totalWishers;
    uint256 public totalOfferers;
    uint256 public totalHolyCupPassed;
    uint256 public totalFortuneClaimants;

    // Heartbeat / cross-day breath.
    mapping(address => uint256) public lastHeartbeatAt;
    mapping(bytes32 => uint256) public lastCivilizationHeartbeatAt;
    mapping(address => uint256) public lastBreathDay;
    mapping(bytes32 => uint256) public lastCivilizationBreathDay;
    mapping(bytes32 => uint256) public blessingPowerByCivilization;
    mapping(bytes32 => uint256) public heartbeatCountByCivilization;
    mapping(bytes32 => uint256) public breathCountByCivilization;
    uint256 public totalHeartbeats;
    uint256 public totalBreaths;

    // Game state. A burn proof may fund exactly one game round.
    mapping(bytes32 => bool) public gameBurnProofConsumed;
    mapping(uint256 => GameRound) public gameRounds;
    uint256 public totalGamesOpened;
    uint256 public totalGamesSettled;
    uint256 public totalGameBurned;
    uint256 public totalGamePaid;

    uint256 public totalFortunePaid;
    uint256 public totalOfferings;

    event TempleHeartInitialized(address indexed admin, address indexed kgen, address indexed brainVault, address kaiosBurnProofGenesis);
    event OrgansUpdated(address indexed lingxiaoBank, address indexed marsVault, address indexed autoLP, address blackhole);
    event GrowthParamsUpdated(uint256 baseCapWhole, uint256 maxCapWhole, uint256 capBps, uint256 baseFloorWhole, uint256 floorBps);
    event FortuneRulesUpdated(uint256 minWhole, uint256 maxWhole, uint256 cooldownSeconds, uint256 epochSeconds, uint256 epochMaxClaims, bool capEnabled, uint256 minimumBurnWhole, bytes32 purposeCode);
    event RhythmRulesUpdated(uint256 heartbeatCooldownSeconds, uint256 heartbeatBlessingPower, uint256 breathBlessingPower);
    event GameRulesUpdated(bytes32 purposeCode, uint256 minimumGameBurnWhole);
    event KAIOSBurnProofGenesisUpdated(address indexed registry);

    event PilgrimRegistered(address indexed user, bytes32 indexed civilizationId, uint256 indexed dayIndex, uint256 totalPilgrims);
    event PilgrimActive(address indexed user, bytes32 indexed civilizationId, uint256 indexed dayIndex);
    event WishMade(address indexed user, bytes32 indexed wishHash, bytes32 indexed civilizationId);
    event OfferingMade(address indexed user, bytes32 indexed civilizationId, OfferingType indexed offeringType, uint256 kgenAmount, bytes32 wishHash);
    event HolyCupPassed(address indexed user, bytes32 indexed civilizationId, bytes32 indexed proofId, bytes32 wishHash);
    event Heartbeat(address indexed user, bytes32 indexed civilizationId, uint256 indexed heartbeatIndex, uint256 blessingPowerTotal);
    event CrossDayBreath(address indexed user, bytes32 indexed civilizationId, uint256 indexed dayIndex, uint256 blessingPowerTotal);
    event FortuneClaimed(address indexed user, bytes32 indexed civilizationId, bytes32 indexed burnProofId, uint256 amount, uint256 epochIndex, bytes32 wishHash);
    event FortuneGameOpened(uint256 indexed gameId, address indexed player, bytes32 indexed civilizationId, bytes32 burnProofId, uint256 burnedKgenAmount, uint256 targetBlock);
    event FortuneGameSettled(uint256 indexed gameId, address indexed player, bytes32 indexed civilizationId, uint16 rollBps, uint256 payoutAmount);

    event BloodInjectedFromBrain(address indexed brainVault, uint256 amount);
    event ExcessSweptToBrain(address indexed brainVault, uint256 excess, uint256 capAmount);
    event AutoRefilledFromBrain(address indexed brainVault, uint256 needAmount, uint256 floorWhole, uint256 capWhole);

    error ZeroAddress();
    error InvalidRange();
    error InvalidWish();
    error InvalidCivilization();
    error InvalidBurnProof();
    error BurnProofAlreadyConsumed();
    error HolyCupProofAlreadyConsumed();
    error WishNotReady();
    error FortuneCooldown();
    error CivilizationCooldown();
    error FortuneEpochFull();
    error HeartInsufficientFunds();
    error BurnTooSmall();
    error PurposeMismatch();
    error WishMismatch();
    error BurnerMismatch();
    error CivilizationMismatch();
    error BurnSourceMismatch();
    error KAIOSMintMismatch();
    error InvalidProofSigner();
    error ProofExpired();
    error HeartbeatCooldown();
    error BreathAlreadyTaken();
    error GameNotReady();
    error GameAlreadySettled();
    error GameBlockExpired();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize(
        address admin,
        address upgrader,
        address operator,
        address holyCupSigner,
        address kgenToken,
        address _brainVault,
        address _kaiosBurnProofGenesis
    ) external initializer {
        if (
            admin == address(0) || upgrader == address(0) || operator == address(0) ||
            holyCupSigner == address(0) || kgenToken == address(0) || _kaiosBurnProofGenesis == address(0)
        ) revert ZeroAddress();

        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __EIP712_init("KGEN TempleHeart 12345", "3.3.0");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, upgrader);
        _grantRole(OPERATOR_ROLE, operator);
        _grantRole(HOLY_CUP_SIGNER_ROLE, holyCupSigner);

        kgen = IERC20(kgenToken);
        brainVault = _brainVault;
        kaiosBurnProofGenesis = IKAIOSBurnProofGenesis(_kaiosBurnProofGenesis);

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
        fortunePurposeCode = keccak256("KGEN_12345_FORTUNE_GENESIS");

        heartbeatCooldownSeconds = 1 hours;
        heartbeatBlessingPower = 1;
        breathBlessingPower = 8;

        gamePurposeCode = keccak256("KGEN_12345_FORTUNE_GAME");
        minimumGameBurnWhole = 1;
        nextGameId = 1;

        emit TempleHeartInitialized(admin, kgenToken, _brainVault, _kaiosBurnProofGenesis);
        emit FortuneRulesUpdated(fortuneMinWhole, fortuneMaxWhole, fortuneCooldownSeconds, fortuneEpochSeconds, fortuneEpochMaxClaims, fortuneCapEnabled, minimumBurnWholeForFortune, fortunePurposeCode);
        emit RhythmRulesUpdated(heartbeatCooldownSeconds, heartbeatBlessingPower, breathBlessingPower);
        emit GameRulesUpdated(gamePurposeCode, minimumGameBurnWhole);
    }

    function version() external pure returns (string memory) { return "KGEN_TempleHeart_V3_3_0_Upgradeable"; }
    function pause() external onlyRole(OPERATOR_ROLE) { _pause(); }
    function unpause() external onlyRole(OPERATOR_ROLE) { _unpause(); }

    function setOrgans(address a, address b, address c, address d) external onlyRole(DEFAULT_ADMIN_ROLE) {
        lingxiaoBank = a; marsVault = b; autoLP = c; blackhole = d;
        emit OrgansUpdated(a, b, c, d);
    }

    function setKAIOSBurnProofGenesis(address registry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (registry == address(0)) revert ZeroAddress();
        kaiosBurnProofGenesis = IKAIOSBurnProofGenesis(registry);
        emit KAIOSBurnProofGenesisUpdated(registry);
    }

    function setGrowthParams(uint256 a, uint256 b, uint256 c, uint256 d, uint256 e) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (a == 0 || b < a || d > b || c > 5000 || e > 5000) revert InvalidRange();
        baseCapWhole = a; maxCapWhole = b; capBps = c; baseFloorWhole = d; floorBps = e;
        emit GrowthParamsUpdated(a, b, c, d, e);
    }

    function setFortuneRules(
        uint256 minWhole, uint256 maxWhole, uint256 cooldownSeconds, uint256 epochSeconds,
        uint256 epochMaxClaims, bool capEnabled, uint256 minimumBurnWhole, bytes32 purposeCode
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (minWhole == 0 || maxWhole < minWhole || maxWhole > 8) revert InvalidRange();
        if (cooldownSeconds < 1 days || epochSeconds < 7 days || epochMaxClaims == 0 || minimumBurnWhole == 0 || purposeCode == bytes32(0)) revert InvalidRange();
        fortuneMinWhole = minWhole; fortuneMaxWhole = maxWhole;
        fortuneCooldownSeconds = cooldownSeconds; fortuneEpochSeconds = epochSeconds;
        fortuneEpochMaxClaims = epochMaxClaims; fortuneCapEnabled = capEnabled;
        minimumBurnWholeForFortune = minimumBurnWhole; fortunePurposeCode = purposeCode;
        emit FortuneRulesUpdated(minWhole, maxWhole, cooldownSeconds, epochSeconds, epochMaxClaims, capEnabled, minimumBurnWhole, purposeCode);
    }

    function setRhythmRules(uint256 heartbeatCooldown, uint256 heartbeatPower, uint256 breathPower) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (heartbeatCooldown < 10 minutes || heartbeatPower == 0 || breathPower == 0) revert InvalidRange();
        heartbeatCooldownSeconds = heartbeatCooldown;
        heartbeatBlessingPower = heartbeatPower;
        breathBlessingPower = breathPower;
        emit RhythmRulesUpdated(heartbeatCooldown, heartbeatPower, breathPower);
    }

    function setGameRules(bytes32 purposeCode, uint256 minimumBurnWhole) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (purposeCode == bytes32(0) || minimumBurnWhole == 0) revert InvalidRange();
        gamePurposeCode = purposeCode;
        minimumGameBurnWhole = minimumBurnWhole;
        emit GameRulesUpdated(purposeCode, minimumBurnWhole);
    }

    function makeWish(bytes32 wishHash, bytes32 civilizationId) external whenNotPaused {
        if (wishHash == bytes32(0)) revert InvalidWish();
        if (civilizationId == bytes32(0)) revert InvalidCivilization();
        _registerPilgrim(msg.sender, civilizationId);
        _markActivePilgrim(msg.sender, civilizationId);
        _activeWishByUser[msg.sender] = WishRecord(wishHash, civilizationId, uint64(block.timestamp), uint64(block.timestamp), WishStatus.Created);
        totalWishers += 1;
        emit WishMade(msg.sender, wishHash, civilizationId);
    }

    function activeWish(address user) external view returns (WishRecord memory) { return _activeWishByUser[user]; }

    function makeOffering(OfferingType offeringType, uint256 amountWhole) external nonReentrant whenNotPaused {
        WishRecord storage wish = _activeWishByUser[msg.sender];
        if (wish.status == WishStatus.None || wish.wishHash == bytes32(0)) revert InvalidWish();
        if (offeringType == OfferingType.None || amountWhole == 0) revert InvalidRange();
        _markActivePilgrim(msg.sender, wish.civilizationId);
        uint256 amount = _scale(amountWhole);
        kgen.safeTransferFrom(msg.sender, address(this), amount);
        wish.status = WishStatus.Offered;
        wish.updatedAt = uint64(block.timestamp);
        totalOfferings += amount;
        totalOfferers += 1;
        emit OfferingMade(msg.sender, wish.civilizationId, offeringType, amount, wish.wishHash);
    }

    function submitHolyCupProof(bytes32 proofId, bytes32 civilizationId, bytes32 wishHash, uint256 deadline, bytes calldata signature) external whenNotPaused {
        if (proofId == bytes32(0)) revert InvalidWish();
        if (block.timestamp > deadline) revert ProofExpired();
        if (holyCupProofConsumed[proofId]) revert HolyCupProofAlreadyConsumed();
        WishRecord storage wish = _activeWishByUser[msg.sender];
        if (wish.wishHash != wishHash || wish.civilizationId != civilizationId) revert InvalidWish();
        if (wish.status == WishStatus.None || wish.status == WishStatus.Fulfilled) revert WishNotReady();
        bytes32 structHash = keccak256(abi.encode(HOLY_CUP_TYPEHASH, msg.sender, civilizationId, wishHash, proofId, deadline));
        address signer = ECDSA.recover(_hashTypedDataV4(structHash), signature);
        if (!hasRole(HOLY_CUP_SIGNER_ROLE, signer)) revert InvalidProofSigner();
        holyCupProofConsumed[proofId] = true;
        wish.status = WishStatus.HolyCupPassed;
        wish.updatedAt = uint64(block.timestamp);
        totalHolyCupPassed += 1;
        _markActivePilgrim(msg.sender, civilizationId);
        emit HolyCupPassed(msg.sender, civilizationId, proofId, wishHash);
    }

    /** Hourly life pulse. Progress only: +1 BlessingPower by default, no KGEN payout. */
    function heartbeat() external whenNotPaused returns (uint256 blessingPowerTotal) {
        WishRecord storage wish = _activeWishByUser[msg.sender];
        if (wish.status == WishStatus.None) revert WishNotReady();
        bytes32 civ = wish.civilizationId;
        if (block.timestamp < lastHeartbeatAt[msg.sender] + heartbeatCooldownSeconds) revert HeartbeatCooldown();
        if (block.timestamp < lastCivilizationHeartbeatAt[civ] + heartbeatCooldownSeconds) revert HeartbeatCooldown();
        lastHeartbeatAt[msg.sender] = block.timestamp;
        lastCivilizationHeartbeatAt[civ] = block.timestamp;
        heartbeatCountByCivilization[civ] += 1;
        totalHeartbeats += 1;
        blessingPowerByCivilization[civ] += heartbeatBlessingPower;
        blessingPowerTotal = blessingPowerByCivilization[civ];
        _markActivePilgrim(msg.sender, civ);
        emit Heartbeat(msg.sender, civ, heartbeatCountByCivilization[civ], blessingPowerTotal);
    }

    /** Cross-day breath. Once per UTC day. Progress only: +8 BlessingPower by default, no KGEN payout. */
    function crossDayBreath() external whenNotPaused returns (uint256 blessingPowerTotal) {
        WishRecord storage wish = _activeWishByUser[msg.sender];
        if (wish.status == WishStatus.None) revert WishNotReady();
        bytes32 civ = wish.civilizationId;
        uint256 dayIndex = block.timestamp / 1 days;
        if (lastBreathDay[msg.sender] == dayIndex || lastCivilizationBreathDay[civ] == dayIndex) revert BreathAlreadyTaken();
        lastBreathDay[msg.sender] = dayIndex;
        lastCivilizationBreathDay[civ] = dayIndex;
        breathCountByCivilization[civ] += 1;
        totalBreaths += 1;
        blessingPowerByCivilization[civ] += breathBlessingPower;
        blessingPowerTotal = blessingPowerByCivilization[civ];
        _markActivePilgrim(msg.sender, civ);
        emit CrossDayBreath(msg.sender, civ, dayIndex, blessingPowerTotal);
    }

    /**
     * 30-day main fortune claim. The proof itself is read from KAIOS on-chain.
     * Reward is deterministic 1..8 based on civilization BlessingPower; no previewable random outcome.
     */
    function fortuneClaim(bytes32 burnProofId) external nonReentrant whenNotPaused returns (uint256 rewardAmount) {
        WishRecord storage wish = _activeWishByUser[msg.sender];
        if (wish.status != WishStatus.HolyCupPassed && wish.status != WishStatus.Claimable) revert WishNotReady();
        (uint256 burnAmount, bytes32 civ) = _validateBurnProof(burnProofId, msg.sender, wish.civilizationId, fortunePurposeCode, wish.wishHash, minimumBurnWholeForFortune);
        burnAmount;
        if (fortuneBurnProofConsumed[burnProofId]) revert BurnProofAlreadyConsumed();
        if (block.timestamp < lastFortuneAt[msg.sender] + fortuneCooldownSeconds) revert FortuneCooldown();
        if (block.timestamp < lastCivilizationFortuneAt[civ] + fortuneCooldownSeconds) revert CivilizationCooldown();
        uint256 epochIndex = currentFortuneEpochIndex();
        if (fortuneCapEnabled) {
            if (fortuneEpochClaims[epochIndex] >= fortuneEpochMaxClaims) revert FortuneEpochFull();
            fortuneEpochClaims[epochIndex] += 1;
        }
        fortuneBurnProofConsumed[burnProofId] = true;
        lastFortuneAt[msg.sender] = block.timestamp;
        lastCivilizationFortuneAt[civ] = block.timestamp;
        wish.status = WishStatus.Fulfilled;
        wish.updatedAt = uint64(block.timestamp);
        rewardAmount = _scale(_fortuneRewardWhole(blessingPowerByCivilization[civ]));
        if (kgen.balanceOf(address(this)) < rewardAmount) revert HeartInsufficientFunds();
        totalFortunePaid += rewardAmount;
        totalFortuneClaimants += 1;
        _markActivePilgrim(msg.sender, civ);
        kgen.safeTransfer(msg.sender, rewardAmount);
        emit FortuneClaimed(msg.sender, civ, burnProofId, rewardAmount, epochIndex, wish.wishHash);
    }

    /**
     * Burn-first game OPEN. No result is computed here.
     * A unique White-Hole burn proof with gamePurposeCode must already exist and is consumed by Heart immediately.
     * targetBlock = next block, so the result did not exist when the player burned/opened the round.
     */
    function openFortuneGame(bytes32 burnProofId) external nonReentrant whenNotPaused returns (uint256 gameId) {
        WishRecord storage wish = _activeWishByUser[msg.sender];
        if (wish.status == WishStatus.None) revert WishNotReady();
        if (gameBurnProofConsumed[burnProofId]) revert BurnProofAlreadyConsumed();
        (uint256 burnAmount, bytes32 civ) = _validateBurnProof(burnProofId, msg.sender, wish.civilizationId, gamePurposeCode, wish.wishHash, minimumGameBurnWhole);

        gameBurnProofConsumed[burnProofId] = true;
        gameId = nextGameId++;
        uint64 targetBlock = uint64(block.number + 1);
        gameRounds[gameId] = GameRound(msg.sender, civ, burnProofId, burnAmount, targetBlock, false, 0, 0);
        totalGamesOpened += 1;
        totalGameBurned += burnAmount;
        _markActivePilgrim(msg.sender, civ);
        emit FortuneGameOpened(gameId, msg.sender, civ, burnProofId, burnAmount, targetBlock);
    }

    /**
     * Burn-first game SETTLE. Anyone may settle once target block exists; payout always goes to original player.
     * No cancel/refund path exists after open. This fixes the preview-then-cancel class of bug.
     * For higher-value games replace future-block entropy with an external VRF before mainnet activation.
     */
    function settleFortuneGame(uint256 gameId) external nonReentrant whenNotPaused returns (uint16 rollBps, uint256 payoutAmount) {
        GameRound storage g = gameRounds[gameId];
        if (g.player == address(0) || block.number <= g.targetBlock) revert GameNotReady();
        if (g.settled) revert GameAlreadySettled();
        bytes32 h = blockhash(uint256(g.targetBlock));
        if (h == bytes32(0)) revert GameBlockExpired();

        rollBps = uint16(uint256(keccak256(abi.encodePacked(h, gameId, g.burnProofId, address(this), block.chainid))) % 10_000);
        payoutAmount = _gamePayout(g.burnedKgenAmount, rollBps);
        if (payoutAmount > 0 && kgen.balanceOf(address(this)) < payoutAmount) revert HeartInsufficientFunds();

        g.settled = true;
        g.rollBps = rollBps;
        g.payoutAmount = payoutAmount;
        totalGamesSettled += 1;
        totalGamePaid += payoutAmount;
        if (payoutAmount > 0) kgen.safeTransfer(g.player, payoutAmount);
        emit FortuneGameSettled(gameId, g.player, g.civilizationId, rollBps, payoutAmount);
    }

    /**
     * Default low-EV game table on the already-burned KGEN amount:
     * 0.00%..49.99% => 0x
     * 50.00%..84.99% => 0.5x
     * 85.00%..98.99% => 1x
     * 99.00%..99.99% => 8x
     * Expected KGEN payout = 0.395x burn. KAIOS created by the burn is separate.
     */
    function _gamePayout(uint256 burnedAmount, uint16 rollBps) internal pure returns (uint256) {
        if (rollBps < 5_000) return 0;
        if (rollBps < 8_500) return burnedAmount / 2;
        if (rollBps < 9_900) return burnedAmount;
        return burnedAmount * 8;
    }

    function _fortuneRewardWhole(uint256 blessingPower) internal view returns (uint256 rewardWhole) {
        rewardWhole = fortuneMinWhole;
        if (blessingPower >= 88) rewardWhole += 1;
        if (blessingPower >= 188) rewardWhole += 1;
        if (blessingPower >= 388) rewardWhole += 1;
        if (blessingPower >= 888) rewardWhole += 1;
        if (blessingPower >= 1888) rewardWhole += 1;
        if (blessingPower >= 3888) rewardWhole += 1;
        if (blessingPower >= 8888) rewardWhole += 1;
        if (rewardWhole > fortuneMaxWhole) rewardWhole = fortuneMaxWhole;
    }

    function previewFortuneReward(bytes32 civilizationId) external view returns (uint256 rewardWhole) {
        return _fortuneRewardWhole(blessingPowerByCivilization[civilizationId]);
    }

    function _validateBurnProof(
        bytes32 burnProofId,
        address expectedBurner,
        bytes32 expectedCivilization,
        bytes32 expectedPurpose,
        bytes32 expectedWish,
        uint256 minimumBurnWhole
    ) internal view returns (uint256 kgenBurnAmount, bytes32 civilizationId) {
        if (burnProofId == bytes32(0) || !kaiosBurnProofGenesis.burnProofConsumed(burnProofId)) revert InvalidBurnProof();
        (
            uint8 source,
            address burner,
            address recipientVault,
            uint256 burnAmount,
            uint256 kaiosMintAmount,
            bytes32 civ,
            bytes32 purpose,
            bytes32 wishHash
        ) = kaiosBurnProofGenesis.burnRecord(burnProofId);
        recipientVault;
        if (source != KAIOS_SOURCE_VOLUNTARY_PLAYER_OFFERING) revert BurnSourceMismatch();
        if (burner != expectedBurner) revert BurnerMismatch();
        if (civ != expectedCivilization) revert CivilizationMismatch();
        if (purpose != expectedPurpose) revert PurposeMismatch();
        if (wishHash != expectedWish) revert WishMismatch();
        if (burnAmount < _scale(minimumBurnWhole)) revert BurnTooSmall();
        if (kaiosMintAmount != burnAmount * KAIOS_PER_KGEN) revert KAIOSMintMismatch();
        return (burnAmount, civ);
    }

    function _registerPilgrim(address user, bytes32 civilizationId) internal {
        if (!isPilgrim[civilizationId]) {
            isPilgrim[civilizationId] = true;
            pilgrimCivilizationByWallet[user] = civilizationId;
            totalPilgrims += 1;
            uint256 dayIndex = block.timestamp / 1 days;
            dailyNewPilgrims[dayIndex] += 1;
            emit PilgrimRegistered(user, civilizationId, dayIndex, totalPilgrims);
        } else if (pilgrimCivilizationByWallet[user] == bytes32(0)) {
            pilgrimCivilizationByWallet[user] = civilizationId;
        }
    }

    function _markActivePilgrim(address user, bytes32 civilizationId) internal {
        uint256 dayIndex = block.timestamp / 1 days;
        if (!_activePilgrimSeenOnDay[dayIndex][civilizationId]) {
            _activePilgrimSeenOnDay[dayIndex][civilizationId] = true;
            dailyActivePilgrims[dayIndex] += 1;
            emit PilgrimActive(user, civilizationId, dayIndex);
        }
    }

    function currentFortuneEpochIndex() public view returns (uint256) { return block.timestamp / fortuneEpochSeconds; }
    function currentDayIndex() public view returns (uint256) { return block.timestamp / 1 days; }
    function heartBalance() public view returns (uint256) { return kgen.balanceOf(address(this)); }
    function heartBalanceWhole() public view returns (uint256) { return _descale(kgen.balanceOf(address(this))); }
    function brainBalanceWhole() public view returns (uint256) { return brainVault == address(0) ? 0 : _descale(kgen.balanceOf(brainVault)); }

    function effectiveCapWhole() public view returns (uint256 cap) {
        cap = baseCapWhole;
        if (capBps > 0 && brainVault != address(0)) cap += (brainBalanceWhole() * capBps) / 10_000;
        if (cap > maxCapWhole) cap = maxCapWhole;
    }

    function effectiveFloorWhole() public view returns (uint256 floor) {
        floor = baseFloorWhole;
        uint256 cap = effectiveCapWhole();
        if (floorBps > 0 && brainVault != address(0)) floor += (brainBalanceWhole() * floorBps) / 10_000;
        if (floor > cap) floor = cap;
    }

    function injectFromBrain(uint256 amountWhole) external nonReentrant onlyRole(OPERATOR_ROLE) {
        if (brainVault == address(0)) revert ZeroAddress();
        if (amountWhole == 0) revert InvalidRange();
        uint256 amount = _scale(amountWhole);
        kgen.safeTransferFrom(brainVault, address(this), amount);
        emit BloodInjectedFromBrain(brainVault, amount);
    }

    function autoRefillFromBrain() external nonReentrant onlyRole(OPERATOR_ROLE) {
        if (brainVault == address(0)) revert ZeroAddress();
        uint256 floorWhole = effectiveFloorWhole();
        uint256 capWhole = effectiveCapWhole();
        uint256 hbWhole = heartBalanceWhole();
        if (hbWhole >= floorWhole) { emit AutoRefilledFromBrain(brainVault, 0, floorWhole, capWhole); return; }
        uint256 needWhole = floorWhole - hbWhole;
        if (hbWhole + needWhole > capWhole) needWhole = capWhole - hbWhole;
        uint256 amount = _scale(needWhole);
        kgen.safeTransferFrom(brainVault, address(this), amount);
        emit AutoRefilledFromBrain(brainVault, amount, floorWhole, capWhole);
    }

    function sweepExcessToBrain() external nonReentrant onlyRole(OPERATOR_ROLE) {
        if (brainVault == address(0)) revert ZeroAddress();
        uint256 capAmount = _scale(effectiveCapWhole());
        uint256 bal = kgen.balanceOf(address(this));
        uint256 excess;
        if (bal > capAmount) { excess = bal - capAmount; kgen.safeTransfer(brainVault, excess); }
        emit ExcessSweptToBrain(brainVault, excess, capAmount);
    }

    function _scale(uint256 wholeTokens) internal view returns (uint256) {
        return wholeTokens * (10 ** uint256(IERC20Metadata(address(kgen)).decimals()));
    }

    function _descale(uint256 amount) internal view returns (uint256) {
        return amount / (10 ** uint256(IERC20Metadata(address(kgen)).decimals()));
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) { newImplementation; }
}
