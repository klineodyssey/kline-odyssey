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

/**
 * @title IKAIOSBurnProofGenesis
 * @notice Read-only interface for KAIOSV02_BurnProofGenesis.
 * @dev BurnSource enum ABI is uint8. VoluntaryPlayerOffering == 1.
 */
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
 * @notice 五指山 12345｜悟空財神殿 Heart｜新 Proxy 世代 V3.3.0。
 * @dev REVIEW DRAFT ONLY. Must be compiled, tested, storage-validated and reviewed before mainnet deployment.
 *
 * Canonical architecture:
 * - UUPS / ERC1967 Proxy is the persistent public Heart address.
 * - Implementation may evolve while Proxy address/state/balance remain.
 * - KAIOS Burn Proof is read DIRECTLY on-chain; no operator-supplied burn proof cache.
 * - Fortune eligibility = Wish + Holy Cup 3/3 + verified voluntary KGEN burn + wallet/civilization cooldown.
 * - Player cannot choose reward amount.
 * - Daily blessing game is progression only; it does NOT directly dispense daily KGEN.
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

    uint256 public constant VERSION_MAJOR = 3;
    uint256 public constant VERSION_MINOR = 3;
    uint256 public constant VERSION_PATCH = 0;

    enum WishStatus {
        None,
        Created,
        Offered,
        HolyCupPassed,
        Claimable,
        Fulfilled,
        Expired
    }

    enum OfferingType {
        None,
        Incense,
        JossPaper,
        BlessingLamp,
        FortuneCharm,
        VowOffering
    }

    struct WishRecord {
        bytes32 wishHash;
        bytes32 civilizationId;
        uint64 createdAt;
        uint64 updatedAt;
        WishStatus status;
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

    uint256 public blessingTierDays1;
    uint256 public blessingTierDays2;
    uint256 public blessingTierDays3;

    mapping(address => uint256) public lastFortuneAt;
    mapping(bytes32 => uint256) public lastCivilizationFortuneAt;
    mapping(uint256 => uint256) public fortuneEpochClaims;
    mapping(bytes32 => bool) public fortuneBurnProofConsumed;

    mapping(address => WishRecord) private _activeWishByUser;
    mapping(bytes32 => bool) public holyCupProofConsumed;

    mapping(address => uint256) public lastBlessingDayByWallet;
    mapping(bytes32 => uint256) public lastBlessingDayByCivilization;
    mapping(bytes32 => uint256) public blessingDaysByCivilization;

    uint256 public totalFortunePaid;
    uint256 public totalOfferings;
    uint256 public totalDailyBlessingPlays;

    event TempleHeartInitialized(
        address indexed admin,
        address indexed kgen,
        address indexed brainVault,
        address kaiosBurnProofGenesis
    );
    event OrgansUpdated(address indexed lingxiaoBank, address indexed marsVault, address indexed autoLP, address blackhole);
    event GrowthParamsUpdated(uint256 baseCapWhole, uint256 maxCapWhole, uint256 capBps, uint256 baseFloorWhole, uint256 floorBps);
    event FortuneRulesUpdated(
        uint256 minWhole,
        uint256 maxWhole,
        uint256 cooldownSeconds,
        uint256 epochSeconds,
        uint256 epochMaxClaims,
        bool capEnabled,
        uint256 minimumBurnWhole,
        bytes32 purposeCode
    );
    event KAIOSBurnProofGenesisUpdated(address indexed registry);
    event WishMade(address indexed user, bytes32 indexed wishHash, bytes32 indexed civilizationId);
    event OfferingMade(
        address indexed user,
        bytes32 indexed civilizationId,
        OfferingType indexed offeringType,
        uint256 kgenAmount,
        bytes32 wishHash
    );
    event HolyCupPassed(address indexed user, bytes32 indexed civilizationId, bytes32 indexed proofId, bytes32 wishHash);
    event DailyBlessingPlayed(address indexed user, bytes32 indexed civilizationId, uint256 indexed dayIndex, uint256 totalBlessingDays);
    event FortuneClaimed(
        address indexed user,
        bytes32 indexed civilizationId,
        bytes32 indexed burnProofId,
        uint256 amount,
        uint256 epochIndex,
        uint256 blessingDays,
        bytes32 wishHash
    );
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
    error DailyBlessingAlreadyPlayed();

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
        address _kaiosBurnProofGenesis
    ) external initializer {
        if (
            admin == address(0) ||
            upgrader == address(0) ||
            operator == address(0) ||
            holyCupSigner == address(0) ||
            kgenToken == address(0) ||
            _kaiosBurnProofGenesis == address(0)
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
        capBps = 0;
        baseFloorWhole = 20_000;
        floorBps = 0;

        fortuneMinWhole = 1;
        fortuneMaxWhole = 8;
        fortuneCooldownSeconds = 30 days;
        fortuneEpochSeconds = 30 days;
        fortuneEpochMaxClaims = 500;
        fortuneCapEnabled = true;
        minimumBurnWholeForFortune = 1;
        fortunePurposeCode = keccak256("KGEN_12345_FORTUNE_GENESIS");

        // Daily game progression thresholds. These affect deterministic reward tier only.
        blessingTierDays1 = 7;
        blessingTierDays2 = 14;
        blessingTierDays3 = 21;

        emit TempleHeartInitialized(admin, kgenToken, _brainVault, _kaiosBurnProofGenesis);
        emit FortuneRulesUpdated(
            fortuneMinWhole,
            fortuneMaxWhole,
            fortuneCooldownSeconds,
            fortuneEpochSeconds,
            fortuneEpochMaxClaims,
            fortuneCapEnabled,
            minimumBurnWholeForFortune,
            fortunePurposeCode
        );
    }

    function version() external pure returns (string memory) {
        return "KGEN_TempleHeart_V3_3_0_Upgradeable";
    }

    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
    }

    function setOrgans(address _lingxiaoBank, address _marsVault, address _autoLP, address _blackhole)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        lingxiaoBank = _lingxiaoBank;
        marsVault = _marsVault;
        autoLP = _autoLP;
        blackhole = _blackhole;
        emit OrgansUpdated(_lingxiaoBank, _marsVault, _autoLP, _blackhole);
    }

    function setKAIOSBurnProofGenesis(address registry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (registry == address(0)) revert ZeroAddress();
        kaiosBurnProofGenesis = IKAIOSBurnProofGenesis(registry);
        emit KAIOSBurnProofGenesisUpdated(registry);
    }

    function setGrowthParams(
        uint256 _baseCapWhole,
        uint256 _maxCapWhole,
        uint256 _capBps,
        uint256 _baseFloorWhole,
        uint256 _floorBps
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_baseCapWhole == 0 || _maxCapWhole < _baseCapWhole || _baseFloorWhole > _maxCapWhole) revert InvalidRange();
        if (_capBps > 5000 || _floorBps > 5000) revert InvalidRange();

        baseCapWhole = _baseCapWhole;
        maxCapWhole = _maxCapWhole;
        capBps = _capBps;
        baseFloorWhole = _baseFloorWhole;
        floorBps = _floorBps;

        emit GrowthParamsUpdated(_baseCapWhole, _maxCapWhole, _capBps, _baseFloorWhole, _floorBps);
    }

    function setFortuneRules(
        uint256 minWhole,
        uint256 maxWhole,
        uint256 cooldownSeconds,
        uint256 epochSeconds,
        uint256 epochMaxClaims,
        bool capEnabled,
        uint256 minimumBurnWhole,
        bytes32 purposeCode
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (minWhole == 0 || maxWhole < minWhole || maxWhole > 8) revert InvalidRange();
        if (cooldownSeconds < 1 days || epochSeconds < 7 days || epochMaxClaims == 0 || minimumBurnWhole == 0) revert InvalidRange();
        if (purposeCode == bytes32(0)) revert InvalidRange();

        fortuneMinWhole = minWhole;
        fortuneMaxWhole = maxWhole;
        fortuneCooldownSeconds = cooldownSeconds;
        fortuneEpochSeconds = epochSeconds;
        fortuneEpochMaxClaims = epochMaxClaims;
        fortuneCapEnabled = capEnabled;
        minimumBurnWholeForFortune = minimumBurnWhole;
        fortunePurposeCode = purposeCode;

        emit FortuneRulesUpdated(
            minWhole,
            maxWhole,
            cooldownSeconds,
            epochSeconds,
            epochMaxClaims,
            capEnabled,
            minimumBurnWhole,
            purposeCode
        );
    }

    function makeWish(bytes32 wishHash, bytes32 civilizationId) external whenNotPaused {
        if (wishHash == bytes32(0)) revert InvalidWish();
        if (civilizationId == bytes32(0)) revert InvalidCivilization();

        _activeWishByUser[msg.sender] = WishRecord({
            wishHash: wishHash,
            civilizationId: civilizationId,
            createdAt: uint64(block.timestamp),
            updatedAt: uint64(block.timestamp),
            status: WishStatus.Created
        });

        emit WishMade(msg.sender, wishHash, civilizationId);
    }

    function activeWish(address user) external view returns (WishRecord memory) {
        return _activeWishByUser[user];
    }

    /**
     * @notice Temple offering: incense/joss paper/lamp/charm/vow.
     * @dev This transfers KGEN into Heart. It is NOT a White Hole burn.
     */
    function makeOffering(OfferingType offeringType, uint256 amountWhole)
        external
        nonReentrant
        whenNotPaused
    {
        WishRecord storage wish = _activeWishByUser[msg.sender];
        if (wish.status == WishStatus.None || wish.wishHash == bytes32(0)) revert InvalidWish();
        if (offeringType == OfferingType.None || amountWhole == 0) revert InvalidRange();

        uint256 amount = _scale(amountWhole);
        kgen.safeTransferFrom(msg.sender, address(this), amount);

        wish.status = WishStatus.Offered;
        wish.updatedAt = uint64(block.timestamp);
        totalOfferings += amount;

        emit OfferingMade(msg.sender, wish.civilizationId, offeringType, amount, wish.wishHash);
    }

    /**
     * @notice Submit Holy Cup 3/3 proof signed by a HOLY_CUP_SIGNER_ROLE account.
     * @dev EIP-712 binds claimant, civilization, wish, proof id, chain and Proxy domain.
     */
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

        emit HolyCupPassed(msg.sender, civilizationId, proofId, wishHash);
    }

    /**
     * @notice Daily temple game / prayer progression. One play per UTC day per wallet AND civilization.
     * @dev It intentionally pays no KGEN. This prevents a daily faucet/Sybil farm while still allowing daily gameplay.
     */
    function playDailyBlessing() external whenNotPaused returns (uint256 totalBlessingDays) {
        WishRecord storage wish = _activeWishByUser[msg.sender];
        if (wish.status == WishStatus.None || wish.status == WishStatus.Fulfilled) revert WishNotReady();

        uint256 dayIndex = block.timestamp / 1 days;
        if (lastBlessingDayByWallet[msg.sender] == dayIndex) revert DailyBlessingAlreadyPlayed();
        if (lastBlessingDayByCivilization[wish.civilizationId] == dayIndex) revert DailyBlessingAlreadyPlayed();

        lastBlessingDayByWallet[msg.sender] = dayIndex;
        lastBlessingDayByCivilization[wish.civilizationId] = dayIndex;
        blessingDaysByCivilization[wish.civilizationId] += 1;
        totalDailyBlessingPlays += 1;

        totalBlessingDays = blessingDaysByCivilization[wish.civilizationId];
        emit DailyBlessingPlayed(msg.sender, wish.civilizationId, dayIndex, totalBlessingDays);
    }

    /**
     * @notice Read KAIOS burn proof directly from chain and claim Fortune reward.
     * @dev No operator registration. The KAIOS record itself is the source of truth.
     */
    function fortuneClaim(bytes32 burnProofId)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 rewardAmount)
    {
        if (burnProofId == bytes32(0)) revert InvalidBurnProof();
        if (fortuneBurnProofConsumed[burnProofId]) revert BurnProofAlreadyConsumed();
        if (!kaiosBurnProofGenesis.burnProofConsumed(burnProofId)) revert InvalidBurnProof();

        WishRecord storage wish = _activeWishByUser[msg.sender];
        if (wish.status != WishStatus.HolyCupPassed && wish.status != WishStatus.Claimable) revert WishNotReady();

        (
            uint8 source,
            address burner,
            address recipientVault,
            uint256 kgenBurnAmount,
            uint256 kaiosMintAmount,
            bytes32 civilizationId,
            bytes32 purposeCode,
            bytes32 wishHash
        ) = kaiosBurnProofGenesis.burnRecord(burnProofId);

        // recipientVault is intentionally not required to equal claimant; KAIOS may mint to a civilization vault.
        recipientVault;

        if (source != KAIOS_SOURCE_VOLUNTARY_PLAYER_OFFERING) revert BurnSourceMismatch();
        if (burner != msg.sender) revert BurnerMismatch();
        if (civilizationId != wish.civilizationId) revert CivilizationMismatch();
        if (purposeCode != fortunePurposeCode) revert PurposeMismatch();
        if (wishHash != wish.wishHash) revert WishMismatch();
        if (kgenBurnAmount < _scale(minimumBurnWholeForFortune)) revert BurnTooSmall();
        if (kaiosMintAmount != kgenBurnAmount * 10_000) revert KAIOSMintMismatch();

        if (block.timestamp < lastFortuneAt[msg.sender] + fortuneCooldownSeconds) revert FortuneCooldown();
        if (block.timestamp < lastCivilizationFortuneAt[civilizationId] + fortuneCooldownSeconds) revert CivilizationCooldown();

        uint256 epochIndex = currentFortuneEpochIndex();
        if (fortuneCapEnabled) {
            if (fortuneEpochClaims[epochIndex] >= fortuneEpochMaxClaims) revert FortuneEpochFull();
            fortuneEpochClaims[epochIndex] += 1;
        }

        // Effects before transfer.
        fortuneBurnProofConsumed[burnProofId] = true;
        lastFortuneAt[msg.sender] = block.timestamp;
        lastCivilizationFortuneAt[civilizationId] = block.timestamp;
        wish.status = WishStatus.Fulfilled;
        wish.updatedAt = uint64(block.timestamp);

        uint256 blessingDays = blessingDaysByCivilization[civilizationId];
        rewardAmount = _scale(_fortuneRewardWhole(blessingDays));
        if (kgen.balanceOf(address(this)) < rewardAmount) revert HeartInsufficientFunds();

        totalFortunePaid += rewardAmount;
        kgen.safeTransfer(msg.sender, rewardAmount);

        emit FortuneClaimed(
            msg.sender,
            civilizationId,
            burnProofId,
            rewardAmount,
            epochIndex,
            blessingDays,
            wish.wishHash
        );
    }

    /**
     * @dev Deterministic progression instead of economically manipulable pseudo-randomness.
     *      Base reward = min. Daily blessing milestones add +1/+2/+3, capped by fortuneMaxWhole.
     */
    function _fortuneRewardWhole(uint256 blessingDays) internal view returns (uint256 rewardWhole) {
        rewardWhole = fortuneMinWhole;
        if (blessingDays >= blessingTierDays1) rewardWhole += 1;
        if (blessingDays >= blessingTierDays2) rewardWhole += 1;
        if (blessingDays >= blessingTierDays3) rewardWhole += 1;
        if (rewardWhole > fortuneMaxWhole) rewardWhole = fortuneMaxWhole;
    }

    function previewFortuneReward(bytes32 civilizationId) external view returns (uint256 rewardWhole) {
        return _fortuneRewardWhole(blessingDaysByCivilization[civilizationId]);
    }

    function currentFortuneEpochIndex() public view returns (uint256) {
        return block.timestamp / fortuneEpochSeconds;
    }

    function heartBalance() public view returns (uint256) {
        return kgen.balanceOf(address(this));
    }

    function heartBalanceWhole() public view returns (uint256) {
        return _descale(kgen.balanceOf(address(this)));
    }

    function brainBalanceWhole() public view returns (uint256) {
        if (brainVault == address(0)) return 0;
        return _descale(kgen.balanceOf(brainVault));
    }

    function effectiveCapWhole() public view returns (uint256 cap) {
        cap = baseCapWhole;
        if (capBps > 0 && brainVault != address(0)) {
            cap += (brainBalanceWhole() * capBps) / 10_000;
        }
        if (cap > maxCapWhole) cap = maxCapWhole;
    }

    function effectiveFloorWhole() public view returns (uint256 floor) {
        floor = baseFloorWhole;
        uint256 cap = effectiveCapWhole();
        if (floorBps > 0 && brainVault != address(0)) {
            floor += (brainBalanceWhole() * floorBps) / 10_000;
        }
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
        if (hbWhole >= floorWhole) {
            emit AutoRefilledFromBrain(brainVault, 0, floorWhole, capWhole);
            return;
        }

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
        if (bal > capAmount) {
            excess = bal - capAmount;
            kgen.safeTransfer(brainVault, excess);
        }
        emit ExcessSweptToBrain(brainVault, excess, capAmount);
    }

    function _scale(uint256 wholeTokens) internal view returns (uint256) {
        return wholeTokens * (10 ** uint256(IERC20Metadata(address(kgen)).decimals()));
    }

    function _descale(uint256 amount) internal view returns (uint256) {
        return amount / (10 ** uint256(IERC20Metadata(address(kgen)).decimals()));
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
