// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

interface ITempleHeartGame {
    function gamePayout(address player, uint256 amount) external;
    function isHeartGameOperational() external view returns (bool);
}

interface IAggregatorV3 {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
    function getRoundData(uint80 roundId)
        external
        view
        returns (uint80, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

/**
 * @title KGEN FortuneGame V1
 * @notice Test-economy UP/DOWN rounds whose only reward authority is a finalized
 *         position followed by TempleHeart.gamePayout(). This contract never
 *         escrows KGEN and never generates a result from pseudo-randomness.
 * @dev TIME_ARROW_IMMUTABILITY: a successful bet is written permanently before
 *      an admissible end oracle snapshot can exist. Round configuration and the
 *      oracle/Heart addresses are snapshotted at creation.
 */
contract KGEN_FortuneGame_Upgradeable is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using Math for uint256;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    uint256 public constant BPS_DENOMINATOR = 10_000;
    bytes32 public constant BTC_USD_DESCRIPTION_HASH = keccak256("BTC / USD");

    enum Direction { NONE, UP, DOWN }
    enum RoundStatus { NONE, CREATED, OPEN, CLOSED, RESOLVED, CANCELLED }
    enum RoundResult { UNRESOLVED, UP, DOWN, DRAW, CANCELLED }
    enum EconomicMode { UNSET, CREDIT_ONLY }
    enum CancelReason { NONE, ORACLE_UNAVAILABLE, ORACLE_STALE, ORACLE_PHASE_TRANSITION }

    struct GameConfig {
        uint64 betDuration;
        uint64 resolveDelay;
        uint32 payoutBps;
        uint128 minBet;
        uint128 maxBet;
        uint128 roundRewardCap;
        EconomicMode economicMode;
    }

    struct OracleConfig {
        address oracle;
        bytes32 descriptionHash;
        uint8 decimals;
        uint32 startMaxAge;
        uint32 maxEndDelay;
    }

    struct Round {
        uint64 betOpenAt;
        uint64 betCloseAt;
        uint64 resolveAt;
        uint64 resolvedAt;
        int256 startPrice;
        int256 endPrice;
        uint80 startOracleRoundId;
        uint80 endOracleRoundId;
        RoundStatus status;
        RoundResult result;
        uint128 totalUp;
        uint128 totalDown;
        uint128 upRewardLiability;
        uint128 downRewardLiability;
        uint32 payoutBps;
        uint128 minBet;
        uint128 maxBet;
        uint128 roundRewardCap;
        EconomicMode economicMode;
        address oracle;
        address templeHeart;
        bytes32 oracleDescriptionHash;
        uint8 oracleDecimals;
        uint32 startMaxAge;
        uint32 maxEndDelay;
        uint256 startOracleUpdatedAt;
        uint256 endOracleUpdatedAt;
        CancelReason cancelReason;
    }

    struct Bet {
        Direction direction;
        uint128 amount;
        uint64 placedAt;
        uint64 placedBlock;
        bool exists;
        bool claimed;
    }

    error ZeroAddress();
    error InvalidConfig();
    error InvalidOracle();
    error OracleUnavailable();
    error OracleAnswerInvalid();
    error OracleStale();
    error OracleRoundOrderInvalid();
    error OraclePhaseTransition();
    error RoundNotOpen();
    error RoundNotClosed();
    error RoundNotResolvable();
    error RoundAlreadyFinalized();
    error BettingClosed();
    error BettingStillOpen();
    error InvalidDirection();
    error InvalidBetAmount();
    error PositionAlreadyExists();
    error RewardCapExceeded();
    error NoPosition();
    error NotWinner();
    error AlreadyClaimed();
    error HeartNotOperational();
    error CancellationNotProven();

    event RoundCreated(
        uint256 indexed roundId,
        address indexed oracle,
        address indexed templeHeart,
        uint32 payoutBps,
        uint128 minBet,
        uint128 maxBet,
        uint128 roundRewardCap,
        EconomicMode economicMode
    );
    event RoundOpened(
        uint256 indexed roundId,
        uint64 betOpenAt,
        uint64 betCloseAt,
        uint64 resolveAt,
        int256 startPrice,
        uint80 startOracleRoundId,
        uint256 startOracleUpdatedAt
    );
    event BetPlaced(
        uint256 indexed roundId,
        address indexed player,
        Direction direction,
        uint128 amount,
        uint64 placedAt,
        uint64 placedBlock
    );
    event RoundClosed(uint256 indexed roundId, uint64 closedAt, uint128 totalUp, uint128 totalDown);
    event RoundResolved(
        uint256 indexed roundId,
        RoundResult result,
        int256 startPrice,
        int256 endPrice,
        uint80 startOracleRoundId,
        uint80 endOracleRoundId,
        uint256 endOracleUpdatedAt,
        uint64 resolvedAt
    );
    event RoundCancelled(uint256 indexed roundId, CancelReason reason, uint64 cancelledAt);
    event RewardClaimed(
        uint256 indexed roundId,
        address indexed player,
        Direction direction,
        uint128 betAmount,
        uint256 payout
    );
    event OracleConfigUpdated(
        address indexed oracle,
        bytes32 indexed descriptionHash,
        uint8 decimals,
        uint32 startMaxAge,
        uint32 maxEndDelay
    );
    event GameConfigUpdated(
        uint64 betDuration,
        uint64 resolveDelay,
        uint32 payoutBps,
        uint128 minBet,
        uint128 maxBet,
        uint128 roundRewardCap,
        EconomicMode economicMode
    );
    event TempleHeartUpdated(address indexed templeHeart);
    event GamePaused(address indexed operator, bool paused);

    uint256 private _currentRoundId;
    address public templeHeart;
    GameConfig public gameConfig;
    OracleConfig public oracleConfig;

    mapping(uint256 => Round) private _rounds;
    mapping(uint256 => mapping(address => Bet)) private _bets;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address admin,
        address operator,
        address upgrader,
        address templeHeart_,
        OracleConfig calldata oracleConfig_,
        GameConfig calldata gameConfig_
    ) external initializer {
        if (admin == address(0) || operator == address(0) || upgrader == address(0)) revert ZeroAddress();
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, operator);
        _grantRole(UPGRADER_ROLE, upgrader);
        _setTempleHeart(templeHeart_);
        _setOracleConfig(oracleConfig_);
        _setGameConfig(gameConfig_);
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }

    function setTempleHeart(address templeHeart_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setTempleHeart(templeHeart_);
    }

    function setOracleConfig(OracleConfig calldata config) external onlyRole(OPERATOR_ROLE) {
        _setOracleConfig(config);
    }

    function setGameConfig(GameConfig calldata config) external onlyRole(OPERATOR_ROLE) {
        _setGameConfig(config);
    }

    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
        emit GamePaused(msg.sender, true);
    }

    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
        emit GamePaused(msg.sender, false);
    }

    function createRound() external onlyRole(OPERATOR_ROLE) whenNotPaused returns (uint256 roundId) {
        GameConfig memory game = gameConfig;
        OracleConfig memory oracle = oracleConfig;
        address heart = templeHeart;
        if (heart == address(0) || oracle.oracle == address(0) || game.economicMode != EconomicMode.CREDIT_ONLY) {
            revert InvalidConfig();
        }

        (uint80 startRoundId, int256 startAnswer, , uint256 startUpdatedAt, uint80 answeredInRound) =
            IAggregatorV3(oracle.oracle).latestRoundData();
        _validateOracleDatum(startRoundId, startAnswer, startUpdatedAt, answeredInRound);
        if (startUpdatedAt > block.timestamp || block.timestamp - startUpdatedAt > oracle.startMaxAge) revert OracleStale();

        roundId = ++_currentRoundId;
        Round storage round = _rounds[roundId];
        round.status = RoundStatus.CREATED;
        round.oracle = oracle.oracle;
        round.templeHeart = heart;
        round.oracleDescriptionHash = oracle.descriptionHash;
        round.oracleDecimals = oracle.decimals;
        round.startMaxAge = oracle.startMaxAge;
        round.maxEndDelay = oracle.maxEndDelay;
        round.payoutBps = game.payoutBps;
        round.minBet = game.minBet;
        round.maxBet = game.maxBet;
        round.roundRewardCap = game.roundRewardCap;
        round.economicMode = game.economicMode;

        emit RoundCreated(
            roundId,
            oracle.oracle,
            heart,
            game.payoutBps,
            game.minBet,
            game.maxBet,
            game.roundRewardCap,
            game.economicMode
        );

        uint64 openedAt = uint64(block.timestamp);
        round.betOpenAt = openedAt;
        round.betCloseAt = openedAt + game.betDuration;
        round.resolveAt = round.betCloseAt + game.resolveDelay;
        round.startPrice = startAnswer;
        round.startOracleRoundId = startRoundId;
        round.startOracleUpdatedAt = startUpdatedAt;
        round.status = RoundStatus.OPEN;

        emit RoundOpened(
            roundId,
            openedAt,
            round.betCloseAt,
            round.resolveAt,
            startAnswer,
            startRoundId,
            startUpdatedAt
        );
    }

    function placeBet(uint256 roundId, Direction direction, uint128 amount) external whenNotPaused {
        Round storage round = _rounds[roundId];
        if (round.status != RoundStatus.OPEN) revert RoundNotOpen();
        if (block.timestamp >= round.betCloseAt) revert BettingClosed();
        if (direction != Direction.UP && direction != Direction.DOWN) revert InvalidDirection();
        if (amount < round.minBet || amount > round.maxBet) revert InvalidBetAmount();

        Bet storage position = _bets[roundId][msg.sender];
        if (position.exists) revert PositionAlreadyExists();

        uint256 payout = Math.mulDiv(amount, round.payoutBps, BPS_DENOMINATOR);
        if (payout == 0 || payout > type(uint128).max) revert InvalidBetAmount();
        if (direction == Direction.UP) {
            uint256 nextTotal = uint256(round.totalUp) + amount;
            uint256 nextLiability = uint256(round.upRewardLiability) + payout;
            if (nextTotal > type(uint128).max || nextLiability > round.roundRewardCap) revert RewardCapExceeded();
            round.totalUp = uint128(nextTotal);
            round.upRewardLiability = uint128(nextLiability);
        } else {
            uint256 nextTotal = uint256(round.totalDown) + amount;
            uint256 nextLiability = uint256(round.downRewardLiability) + payout;
            if (nextTotal > type(uint128).max || nextLiability > round.roundRewardCap) revert RewardCapExceeded();
            round.totalDown = uint128(nextTotal);
            round.downRewardLiability = uint128(nextLiability);
        }

        uint64 placedAt = uint64(block.timestamp);
        uint64 placedBlock = uint64(block.number);
        position.direction = direction;
        position.amount = amount;
        position.placedAt = placedAt;
        position.placedBlock = placedBlock;
        position.exists = true;

        emit BetPlaced(roundId, msg.sender, direction, amount, placedAt, placedBlock);
    }

    function closeRound(uint256 roundId) external {
        Round storage round = _rounds[roundId];
        if (round.status != RoundStatus.OPEN) revert RoundNotOpen();
        if (block.timestamp < round.betCloseAt) revert BettingStillOpen();
        round.status = RoundStatus.CLOSED;
        emit RoundClosed(roundId, uint64(block.timestamp), round.totalUp, round.totalDown);
    }

    /**
     * @notice Resolve using the first oracle round whose updatedAt is at or after resolveAt.
     * @dev The caller cannot choose a favorable historical round: candidate-1 must exist in
     *      the same Chainlink phase and have updatedAt < resolveAt.
     */
    function resolveRound(uint256 roundId, uint80 endOracleRoundId) external {
        Round storage round = _rounds[roundId];
        if (round.status != RoundStatus.CLOSED) revert RoundNotClosed();
        if (block.timestamp < round.resolveAt) revert RoundNotResolvable();
        _assertRoundOracleIdentity(round);

        uint64 aggregatorRound = uint64(endOracleRoundId);
        if (aggregatorRound <= 1) revert OraclePhaseTransition();
        if (_phaseId(endOracleRoundId) != _phaseId(round.startOracleRoundId)) revert OraclePhaseTransition();

        (uint80 candidateId, int256 endAnswer, , uint256 endUpdatedAt, uint80 answeredInRound) =
            IAggregatorV3(round.oracle).getRoundData(endOracleRoundId);
        if (candidateId != endOracleRoundId) revert OracleRoundOrderInvalid();
        _validateOracleDatum(candidateId, endAnswer, endUpdatedAt, answeredInRound);
        if (candidateId <= round.startOracleRoundId || endUpdatedAt > block.timestamp) revert OracleRoundOrderInvalid();
        if (endUpdatedAt < round.resolveAt || endUpdatedAt <= round.betCloseAt) revert OracleRoundOrderInvalid();
        if (endUpdatedAt > uint256(round.resolveAt) + round.maxEndDelay) revert OracleStale();

        uint80 predecessorId = endOracleRoundId - 1;
        (uint80 returnedPredecessorId, int256 predecessorAnswer, , uint256 predecessorUpdatedAt, uint80 predecessorAnsweredInRound) =
            IAggregatorV3(round.oracle).getRoundData(predecessorId);
        if (returnedPredecessorId != predecessorId || _phaseId(predecessorId) != _phaseId(endOracleRoundId)) {
            revert OracleRoundOrderInvalid();
        }
        _validateOracleDatum(predecessorId, predecessorAnswer, predecessorUpdatedAt, predecessorAnsweredInRound);
        if (predecessorUpdatedAt >= round.resolveAt || predecessorUpdatedAt > block.timestamp) {
            revert OracleRoundOrderInvalid();
        }

        RoundResult result = endAnswer > round.startPrice
            ? RoundResult.UP
            : endAnswer < round.startPrice ? RoundResult.DOWN : RoundResult.DRAW;
        round.endPrice = endAnswer;
        round.endOracleRoundId = endOracleRoundId;
        round.endOracleUpdatedAt = endUpdatedAt;
        round.result = result;
        round.resolvedAt = uint64(block.timestamp);
        round.status = RoundStatus.RESOLVED;

        emit RoundResolved(
            roundId,
            result,
            round.startPrice,
            endAnswer,
            round.startOracleRoundId,
            endOracleRoundId,
            endUpdatedAt,
            round.resolvedAt
        );
    }

    /**
     * @notice Cancel the entire round only with objective same-phase stale evidence.
     * @dev A stale proof must itself be the deterministic first round at/after resolveAt.
     */
    function cancelRound(uint256 roundId, uint80 proofRoundId) external {
        Round storage round = _rounds[roundId];
        if (round.status == RoundStatus.RESOLVED || round.status == RoundStatus.CANCELLED) {
            revert RoundAlreadyFinalized();
        }
        if (round.status != RoundStatus.CLOSED) revert RoundNotClosed();
        if (block.timestamp <= uint256(round.resolveAt) + round.maxEndDelay) revert CancellationNotProven();
        _assertRoundOracleIdentity(round);

        (uint80 candidateId, int256 answer, , uint256 updatedAt, uint80 answeredInRound) =
            IAggregatorV3(round.oracle).getRoundData(proofRoundId);
        _validateOracleDatum(candidateId, answer, updatedAt, answeredInRound);
        if (candidateId != proofRoundId || updatedAt < round.resolveAt || updatedAt > block.timestamp) {
            revert CancellationNotProven();
        }

        if (_phaseId(proofRoundId) != _phaseId(round.startOracleRoundId) || uint64(proofRoundId) <= 1) {
            revert OraclePhaseTransition();
        }
        uint80 predecessorId = proofRoundId - 1;
        (uint80 returnedId, int256 predecessorAnswer, , uint256 predecessorUpdatedAt, uint80 predecessorAnsweredInRound) =
            IAggregatorV3(round.oracle).getRoundData(predecessorId);
        if (returnedId != predecessorId) revert CancellationNotProven();
        _validateOracleDatum(returnedId, predecessorAnswer, predecessorUpdatedAt, predecessorAnsweredInRound);
        if (predecessorUpdatedAt >= round.resolveAt || updatedAt <= uint256(round.resolveAt) + round.maxEndDelay) {
            revert CancellationNotProven();
        }
        _finalizeCancellation(roundId, round, CancelReason.ORACLE_STALE);
    }

    /**
     * @notice Cancel after a phase transition only when the old phase is proven to
     *         end before resolveAt and the new phase is proven to begin after it.
     * @dev Requiring the missing successor in the old phase prevents a caller from
     *      hiding an admissible old-phase result and choosing cancellation instead.
     */
    function cancelRoundForPhaseTransition(
        uint256 roundId,
        uint80 lastOldPhaseRoundId,
        uint80 firstNewPhaseRoundId
    ) external {
        Round storage round = _rounds[roundId];
        if (round.status == RoundStatus.RESOLVED || round.status == RoundStatus.CANCELLED) {
            revert RoundAlreadyFinalized();
        }
        if (round.status != RoundStatus.CLOSED) revert RoundNotClosed();
        if (block.timestamp <= uint256(round.resolveAt) + round.maxEndDelay) revert CancellationNotProven();
        _assertRoundOracleIdentity(round);

        uint16 oldPhase = _phaseId(round.startOracleRoundId);
        if (
            _phaseId(lastOldPhaseRoundId) != oldPhase || lastOldPhaseRoundId < round.startOracleRoundId
                || _phaseId(firstNewPhaseRoundId) != oldPhase + 1 || uint64(firstNewPhaseRoundId) != 1
        ) revert CancellationNotProven();

        (uint80 oldId, int256 oldAnswer, , uint256 oldUpdatedAt, uint80 oldAnsweredInRound) =
            IAggregatorV3(round.oracle).getRoundData(lastOldPhaseRoundId);
        (uint80 newId, int256 newAnswer, , uint256 newUpdatedAt, uint80 newAnsweredInRound) =
            IAggregatorV3(round.oracle).getRoundData(firstNewPhaseRoundId);
        if (oldId != lastOldPhaseRoundId || newId != firstNewPhaseRoundId) revert CancellationNotProven();
        _validateOracleDatum(oldId, oldAnswer, oldUpdatedAt, oldAnsweredInRound);
        _validateOracleDatum(newId, newAnswer, newUpdatedAt, newAnsweredInRound);
        if (oldUpdatedAt >= round.resolveAt || newUpdatedAt < round.resolveAt || newUpdatedAt > block.timestamp) {
            revert CancellationNotProven();
        }

        uint80 allegedMissingOldSuccessor = lastOldPhaseRoundId + 1;
        if (_phaseId(allegedMissingOldSuccessor) != oldPhase) revert CancellationNotProven();
        try IAggregatorV3(round.oracle).getRoundData(allegedMissingOldSuccessor) returns (
            uint80, int256, uint256, uint256, uint80
        ) {
            revert CancellationNotProven();
        } catch {
            _finalizeCancellation(roundId, round, CancelReason.ORACLE_PHASE_TRANSITION);
        }
    }

    function cancelRoundForUnavailableOracle(uint256 roundId) external {
        Round storage round = _rounds[roundId];
        if (round.status == RoundStatus.RESOLVED || round.status == RoundStatus.CANCELLED) {
            revert RoundAlreadyFinalized();
        }
        if (round.status != RoundStatus.CLOSED) revert RoundNotClosed();
        if (block.timestamp <= uint256(round.resolveAt) + round.maxEndDelay) revert CancellationNotProven();
        try IAggregatorV3(round.oracle).latestRoundData() returns (uint80, int256, uint256, uint256, uint80) {
            revert CancellationNotProven();
        } catch {
            _finalizeCancellation(roundId, round, CancelReason.ORACLE_UNAVAILABLE);
        }
    }

    function claim(uint256 roundId) external nonReentrant whenNotPaused {
        Round storage round = _rounds[roundId];
        if (round.status != RoundStatus.RESOLVED) revert RoundNotResolvable();
        Bet storage position = _bets[roundId][msg.sender];
        if (!position.exists) revert NoPosition();
        if (position.claimed) revert AlreadyClaimed();
        if (!_isWinner(position.direction, round.result)) revert NotWinner();

        uint256 payout = Math.mulDiv(position.amount, round.payoutBps, BPS_DENOMINATOR);
        ITempleHeartGame heart = ITempleHeartGame(round.templeHeart);
        if (!heart.isHeartGameOperational()) revert HeartNotOperational();
        heart.gamePayout(msg.sender, payout);

        // Effects occur only after the Heart call succeeds. A gate rejection rolls
        // the transaction back and leaves the winning entitlement retryable.
        position.claimed = true;
        emit RewardClaimed(roundId, msg.sender, position.direction, position.amount, payout);
    }

    function currentRoundId() external view returns (uint256) {
        return _currentRoundId;
    }

    function roundInfo(uint256 roundId) external view returns (Round memory) {
        return _rounds[roundId];
    }

    function betInfo(uint256 roundId, address player) external view returns (Bet memory) {
        return _bets[roundId][player];
    }

    function canBet(uint256 roundId, address player) external view returns (bool) {
        Round storage round = _rounds[roundId];
        return !paused() && round.status == RoundStatus.OPEN && block.timestamp < round.betCloseAt
            && !_bets[roundId][player].exists;
    }

    function canResolve(uint256 roundId) external view returns (bool) {
        Round storage round = _rounds[roundId];
        return round.status == RoundStatus.CLOSED && block.timestamp >= round.resolveAt;
    }

    function canClaim(uint256 roundId, address player) external view returns (bool) {
        Round storage round = _rounds[roundId];
        Bet storage position = _bets[roundId][player];
        if (paused() || round.status != RoundStatus.RESOLVED || !position.exists || position.claimed) return false;
        if (!_isWinner(position.direction, round.result)) return false;
        try ITempleHeartGame(round.templeHeart).isHeartGameOperational() returns (bool operational) {
            return operational;
        } catch {
            return false;
        }
    }

    function previewPayout(uint256 roundId, address player) public view returns (uint256) {
        Round storage round = _rounds[roundId];
        Bet storage position = _bets[roundId][player];
        if (!position.exists || !_isWinner(position.direction, round.result)) return 0;
        return Math.mulDiv(position.amount, round.payoutBps, BPS_DENOMINATOR);
    }

    function secondsUntilClose(uint256 roundId) external view returns (uint256) {
        uint256 closeAt = _rounds[roundId].betCloseAt;
        return block.timestamp >= closeAt ? 0 : closeAt - block.timestamp;
    }

    function secondsUntilResolve(uint256 roundId) external view returns (uint256) {
        uint256 resolveAt = _rounds[roundId].resolveAt;
        return block.timestamp >= resolveAt ? 0 : resolveAt - block.timestamp;
    }

    function _setTempleHeart(address templeHeart_) internal {
        if (templeHeart_ == address(0) || templeHeart_.code.length == 0) revert ZeroAddress();
        templeHeart = templeHeart_;
        emit TempleHeartUpdated(templeHeart_);
    }

    function _setOracleConfig(OracleConfig calldata config) internal {
        if (
            config.oracle == address(0) || config.oracle.code.length == 0 || config.startMaxAge == 0
                || config.maxEndDelay == 0 || config.descriptionHash != BTC_USD_DESCRIPTION_HASH
        ) revert InvalidConfig();
        IAggregatorV3 feed = IAggregatorV3(config.oracle);
        if (feed.decimals() != config.decimals || keccak256(bytes(feed.description())) != config.descriptionHash) {
            revert InvalidOracle();
        }
        (uint80 roundId, int256 answer, , uint256 updatedAt, uint80 answeredInRound) = feed.latestRoundData();
        _validateOracleDatum(roundId, answer, updatedAt, answeredInRound);
        if (updatedAt > block.timestamp || block.timestamp - updatedAt > config.startMaxAge) revert OracleStale();
        oracleConfig = config;
        emit OracleConfigUpdated(
            config.oracle,
            config.descriptionHash,
            config.decimals,
            config.startMaxAge,
            config.maxEndDelay
        );
    }

    function _setGameConfig(GameConfig calldata config) internal {
        if (
            config.betDuration == 0 || config.resolveDelay == 0 || config.payoutBps == 0
                || config.minBet == 0 || config.maxBet < config.minBet || config.roundRewardCap == 0
                || config.economicMode != EconomicMode.CREDIT_ONLY
                || Math.mulDiv(config.maxBet, config.payoutBps, BPS_DENOMINATOR) > config.roundRewardCap
        ) revert InvalidConfig();
        gameConfig = config;
        emit GameConfigUpdated(
            config.betDuration,
            config.resolveDelay,
            config.payoutBps,
            config.minBet,
            config.maxBet,
            config.roundRewardCap,
            config.economicMode
        );
    }

    function _validateOracleDatum(uint80 roundId, int256 answer, uint256 updatedAt, uint80 answeredInRound)
        internal
        pure
    {
        if (roundId == 0 || answer <= 0 || updatedAt == 0 || answeredInRound < roundId) {
            revert OracleAnswerInvalid();
        }
    }

    function _assertRoundOracleIdentity(Round storage round) internal view {
        IAggregatorV3 feed = IAggregatorV3(round.oracle);
        if (
            feed.decimals() != round.oracleDecimals
                || keccak256(bytes(feed.description())) != round.oracleDescriptionHash
        ) revert InvalidOracle();
    }

    function _finalizeCancellation(uint256 roundId, Round storage round, CancelReason reason) internal {
        round.status = RoundStatus.CANCELLED;
        round.result = RoundResult.CANCELLED;
        round.resolvedAt = uint64(block.timestamp);
        round.cancelReason = reason;
        emit RoundCancelled(roundId, reason, round.resolvedAt);
    }

    function _phaseId(uint80 oracleRoundId) internal pure returns (uint16) {
        return uint16(oracleRoundId >> 64);
    }

    function _isWinner(Direction direction, RoundResult result) internal pure returns (bool) {
        return (direction == Direction.UP && result == RoundResult.UP)
            || (direction == Direction.DOWN && result == RoundResult.DOWN);
    }

    function _authorizeUpgrade(address) internal override onlyRole(UPGRADER_ROLE) {}

    uint256[40] private __gap;
}
