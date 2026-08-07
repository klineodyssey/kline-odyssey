// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title KGEN_TempleHeart_V3_3_0_Upgradeable
 * @notice 五指山 12345｜悟空財神殿 Heart，UUPS 可升級版。
 * @dev 新版首次部署請透過 ERC1967/UUPS Proxy。之後升級只更換 Implementation，Proxy 地址固定。
 *
 * V3.3.0 核心原則：
 * - 保留 Heart / Brain 補血與基本 TempleHeart 功能骨架。
 * - 發財金不再由玩家傳入任意 1~888 金額；由合約規則決定基本 1~8 KGEN。
 * - 發財金資格需綁定 Wish + HolyCup proof + KAIOS/KGEN burn proof 資格。
 * - 同一 wallet、同一 civilizationId、同一 burnProofId 均有防重複限制。
 * - 30 天冷卻、每 Epoch 500 次總上限保留。
 * - Upgrade 權限獨立為 UPGRADER_ROLE，營運權限獨立為 OPERATOR_ROLE。
 *
 * IMPORTANT:
 * - 本檔是新 Proxy 世代的 storage 起點，不是舊 V3.2.6 的 in-place upgrade。
 * - 舊 V3.2.6 地址不可直接變成 Proxy；需一次性遷移到新的 Proxy 地址。
 */
contract KGEN_TempleHeart_V3_3_0_Upgradeable is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant HOLY_CUP_SIGNER_ROLE = keccak256("HOLY_CUP_SIGNER_ROLE");

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

    struct BurnProofRecord {
        address burner;
        bytes32 civilizationId;
        bytes32 purposeCode;
        bytes32 wishHash;
        uint256 kgenBurnAmount;
        bool verified;
    }

    IERC20 public kgen;
    address public brainVault;
    address public lingxiaoBank;
    address public marsVault;
    address public autoLP;
    address public blackhole;

    address public kaiosBurnProofRegistry;

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

    mapping(address => uint256) public lastFortuneAt;
    mapping(bytes32 => uint256) public lastCivilizationFortuneAt;
    mapping(uint256 => uint256) public fortuneEpochClaims;
    mapping(bytes32 => bool) public fortuneBurnProofConsumed;

    mapping(address => WishRecord) private _activeWishByUser;
    mapping(bytes32 => BurnProofRecord) private _burnProofCache;
    mapping(bytes32 => bool) public holyCupProofConsumed;

    uint256 public totalFortunePaid;
    uint256 public totalVerifiedBurnWhole;
    uint256 public totalOfferings;

    event TempleHeartInitialized(
        address indexed admin,
        address indexed kgen,
        address indexed brainVault,
        address kaiosBurnProofRegistry
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
    event BurnProofRegistryUpdated(address indexed registry);
    event WishMade(address indexed user, bytes32 indexed wishHash, bytes32 indexed civilizationId);
    event OfferingMade(
        address indexed user,
        bytes32 indexed civilizationId,
        OfferingType indexed offeringType,
        uint256 kgenAmount,
        bytes32 wishHash
    );
    event BurnProofRegistered(
        bytes32 indexed burnProofId,
        address indexed burner,
        bytes32 indexed civilizationId,
        uint256 kgenBurnAmount,
        bytes32 purposeCode,
        bytes32 wishHash
    );
    event HolyCupPassed(address indexed user, bytes32 indexed civilizationId, bytes32 indexed proofId, bytes32 wishHash);
    event FortuneClaimed(
        address indexed user,
        bytes32 indexed civilizationId,
        bytes32 indexed burnProofId,
        uint256 amount,
        uint256 epochIndex,
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
    error InvalidProofSigner();

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
        address _kaiosBurnProofRegistry
    ) external initializer {
        if (
            admin == address(0) ||
            upgrader == address(0) ||
            operator == address(0) ||
            holyCupSigner == address(0) ||
            kgenToken == address(0)
        ) revert ZeroAddress();

        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, upgrader);
        _grantRole(OPERATOR_ROLE, operator);
        _grantRole(HOLY_CUP_SIGNER_ROLE, holyCupSigner);

        kgen = IERC20(kgenToken);
        brainVault = _brainVault;
        kaiosBurnProofRegistry = _kaiosBurnProofRegistry;

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

        emit TempleHeartInitialized(admin, kgenToken, _brainVault, _kaiosBurnProofRegistry);
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

    function setBurnProofRegistry(address registry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        kaiosBurnProofRegistry = registry;
        emit BurnProofRegistryUpdated(registry);
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
        if (minWhole == 0 || maxWhole < minWhole || maxWhole > 88) revert InvalidRange();
        if (cooldownSeconds < 1 days || epochSeconds < 7 days || epochMaxClaims == 0 || minimumBurnWhole == 0) {
            revert InvalidRange();
        }
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
     * @notice Registers a verified burn proof into Heart.
     * @dev V3.3.0 intentionally accepts proofs only from OPERATOR_ROLE. The operator must verify the KAIOS BurnProofGenesis
     *      burnRecord off-chain/on-chain before calling. A later upgrade may replace this with a direct registry interface.
     */
    function registerVerifiedBurnProof(
        bytes32 burnProofId,
        address burner,
        bytes32 civilizationId,
        uint256 kgenBurnAmount,
        bytes32 purposeCode,
        bytes32 wishHash
    ) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        if (burnProofId == bytes32(0) || burner == address(0) || kgenBurnAmount == 0) revert InvalidBurnProof();
        if (civilizationId == bytes32(0) || purposeCode == bytes32(0) || wishHash == bytes32(0)) revert InvalidBurnProof();
        if (_burnProofCache[burnProofId].verified) revert BurnProofAlreadyConsumed();

        _burnProofCache[burnProofId] = BurnProofRecord({
            burner: burner,
            civilizationId: civilizationId,
            purposeCode: purposeCode,
            wishHash: wishHash,
            kgenBurnAmount: kgenBurnAmount,
            verified: true
        });
        totalVerifiedBurnWhole += _descale(kgenBurnAmount);

        emit BurnProofRegistered(
            burnProofId,
            burner,
            civilizationId,
            kgenBurnAmount,
            purposeCode,
            wishHash
        );
    }

    /**
     * @notice Marks Holy Cup 3/3 as passed using a signed digest.
     * @dev The signed message is recovered with a minimal ECDSA routine. signer must hold HOLY_CUP_SIGNER_ROLE.
     */
    function submitHolyCupProof(
        bytes32 proofId,
        bytes32 civilizationId,
        bytes32 wishHash,
        uint256 deadline,
        bytes calldata signature
    ) external whenNotPaused {
        if (proofId == bytes32(0) || holyCupProofConsumed[proofId]) revert HolyCupProofAlreadyConsumed();
        if (block.timestamp > deadline) revert InvalidBurnProof();

        WishRecord storage wish = _activeWishByUser[msg.sender];
        if (wish.wishHash != wishHash || wish.civilizationId != civilizationId) revert WishMismatch();

        bytes32 digest = keccak256(
            abi.encodePacked(
                "KGEN_12345_HOLY_CUP_3_OF_3",
                address(this),
                block.chainid,
                msg.sender,
                civilizationId,
                wishHash,
                proofId,
                deadline
            )
        );
        bytes32 ethSignedDigest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest));
        address signer = _recover(ethSignedDigest, signature);
        if (!hasRole(HOLY_CUP_SIGNER_ROLE, signer)) revert InvalidProofSigner();

        holyCupProofConsumed[proofId] = true;
        wish.status = WishStatus.HolyCupPassed;
        wish.updatedAt = uint64(block.timestamp);

        emit HolyCupPassed(msg.sender, civilizationId, proofId, wishHash);
    }

    function fortuneClaim(bytes32 burnProofId)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 rewardAmount)
    {
        WishRecord storage wish = _activeWishByUser[msg.sender];
        if (wish.status != WishStatus.HolyCupPassed && wish.status != WishStatus.Claimable) revert WishNotReady();

        BurnProofRecord memory proof = _burnProofCache[burnProofId];
        if (!proof.verified) revert InvalidBurnProof();
        if (fortuneBurnProofConsumed[burnProofId]) revert BurnProofAlreadyConsumed();
        if (proof.burner != msg.sender) revert BurnerMismatch();
        if (proof.civilizationId != wish.civilizationId) revert InvalidCivilization();
        if (proof.purposeCode != fortunePurposeCode) revert PurposeMismatch();
        if (proof.wishHash != wish.wishHash) revert WishMismatch();
        if (_descale(proof.kgenBurnAmount) < minimumBurnWholeForFortune) revert BurnTooSmall();

        if (block.timestamp < lastFortuneAt[msg.sender] + fortuneCooldownSeconds) revert FortuneCooldown();
        if (block.timestamp < lastCivilizationFortuneAt[wish.civilizationId] + fortuneCooldownSeconds) {
            revert CivilizationCooldown();
        }

        uint256 epochIndex = currentFortuneEpochIndex();
        if (fortuneCapEnabled) {
            if (fortuneEpochClaims[epochIndex] >= fortuneEpochMaxClaims) revert FortuneEpochFull();
            fortuneEpochClaims[epochIndex] += 1;
        }

        rewardAmount = _calculateFortuneReward(msg.sender, wish.civilizationId, burnProofId);
        if (rewardAmount < _scale(fortuneMinWhole) || rewardAmount > _scale(fortuneMaxWhole)) revert InvalidRange();
        if (kgen.balanceOf(address(this)) < rewardAmount) revert HeartInsufficientFunds();

        fortuneBurnProofConsumed[burnProofId] = true;
        lastFortuneAt[msg.sender] = block.timestamp;
        lastCivilizationFortuneAt[wish.civilizationId] = block.timestamp;
        wish.status = WishStatus.Fulfilled;
        wish.updatedAt = uint64(block.timestamp);
        totalFortunePaid += rewardAmount;

        kgen.safeTransfer(msg.sender, rewardAmount);

        emit FortuneClaimed(
            msg.sender,
            wish.civilizationId,
            burnProofId,
            rewardAmount,
            epochIndex,
            wish.wishHash
        );
    }

    function activeWish(address user) external view returns (WishRecord memory) {
        return _activeWishByUser[user];
    }

    function burnProof(bytes32 burnProofId) external view returns (BurnProofRecord memory) {
        return _burnProofCache[burnProofId];
    }

    function currentFortuneEpochIndex() public view returns (uint256) {
        return block.timestamp / fortuneEpochSeconds;
    }

    function heartBalance() public view returns (uint256) {
        return kgen.balanceOf(address(this));
    }

    function heartBalanceWhole() public view returns (uint256) {
        return _descale(heartBalance());
    }

    function brainBalanceWhole() public view returns (uint256) {
        if (brainVault == address(0)) return 0;
        return _descale(kgen.balanceOf(brainVault));
    }

    function effectiveCapWhole() public view returns (uint256) {
        uint256 capWhole = baseCapWhole;
        if (capBps > 0 && brainVault != address(0)) {
            capWhole += (brainBalanceWhole() * capBps) / 10_000;
        }
        if (capWhole > maxCapWhole) capWhole = maxCapWhole;
        return capWhole;
    }

    function effectiveFloorWhole() public view returns (uint256) {
        uint256 floorWhole = baseFloorWhole;
        if (floorBps > 0 && brainVault != address(0)) {
            floorWhole += (brainBalanceWhole() * floorBps) / 10_000;
        }
        uint256 capWhole = effectiveCapWhole();
        if (floorWhole > capWhole) floorWhole = capWhole;
        return floorWhole;
    }

    function injectFromBrain(uint256 amountWhole)
        external
        onlyRole(OPERATOR_ROLE)
        nonReentrant
        whenNotPaused
    {
        if (brainVault == address(0)) revert ZeroAddress();
        uint256 amount = _scale(amountWhole);
        kgen.safeTransferFrom(brainVault, address(this), amount);
        emit BloodInjectedFromBrain(brainVault, amount);
    }

    function autoRefillFromBrain()
        external
        onlyRole(OPERATOR_ROLE)
        nonReentrant
        whenNotPaused
    {
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
        uint256 needAmount = _scale(needWhole);
        kgen.safeTransferFrom(brainVault, address(this), needAmount);

        emit AutoRefilledFromBrain(brainVault, needAmount, floorWhole, capWhole);
    }

    function sweepExcessToBrain()
        external
        onlyRole(OPERATOR_ROLE)
        nonReentrant
        whenNotPaused
    {
        if (brainVault == address(0)) revert ZeroAddress();
        uint256 capAmount = _scale(effectiveCapWhole());
        uint256 bal = kgen.balanceOf(address(this));
        uint256 excess = bal > capAmount ? bal - capAmount : 0;
        if (excess > 0) kgen.safeTransfer(brainVault, excess);
        emit ExcessSweptToBrain(brainVault, excess, capAmount);
    }

    function _calculateFortuneReward(address user, bytes32 civilizationId, bytes32 burnProofId)
        internal
        view
        returns (uint256)
    {
        uint256 span = fortuneMaxWhole - fortuneMinWhole + 1;
        uint256 seed = uint256(
            keccak256(
                abi.encodePacked(
                    user,
                    civilizationId,
                    burnProofId,
                    block.prevrandao,
                    block.timestamp,
                    fortuneEpochClaims[currentFortuneEpochIndex()]
                )
            )
        );
        uint256 rewardWhole = fortuneMinWhole + (seed % span);
        return _scale(rewardWhole);
    }

    function _scale(uint256 wholeTokens) internal view returns (uint256) {
        return wholeTokens * (10 ** uint256(IERC20Metadata(address(kgen)).decimals()));
    }

    function _descale(uint256 amount) internal view returns (uint256) {
        return amount / (10 ** uint256(IERC20Metadata(address(kgen)).decimals()));
    }

    function _recover(bytes32 digest, bytes calldata signature) internal pure returns (address signer) {
        if (signature.length != 65) revert InvalidProofSigner();
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        if (v < 27) v += 27;
        if (v != 27 && v != 28) revert InvalidProofSigner();
        signer = ecrecover(digest, v, r, s);
        if (signer == address(0)) revert InvalidProofSigner();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    uint256[40] private __gap;
}
