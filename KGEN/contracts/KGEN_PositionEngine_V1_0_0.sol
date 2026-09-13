// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {KGEN_MarketRiskKernel_V1_0_0} from "./KGEN_MarketRiskKernel_V1_0_0.sol";

interface IKGENBrainSettlementV4 {
    function reservePositionCollateral(bytes32 positionKey, address user, uint256 amountWei) external;
    function releasePositionCollateral(bytes32 positionKey) external;
    function settlePositionCollateral(bytes32 positionKey, int256 realizedPnlWei, uint256 badDebtWei) external;
}

/// @dev Chainlink-compatible read surface. The engine does not trust an
/// executor-supplied price; admin must bind each market to 2-3 on-chain feeds.
interface IKGENPriceFeedV1 {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

/**
 * KGEN_PositionEngine_V1_0_0
 * Candidate position state machine for KX/KY/KZ markets.
 *
 * SAFETY BOUNDARY:
 * - NO token custody in this contract
 * - executor chooses transaction timing only; it cannot supply price/timestamp
 * - every risk transition reads an admin-bound 2-of-3 on-chain feed quorum
 * - feed rounds must be positive, complete, fresh, in configured bounds and
 *   mutually within the configured maximum deviation
 * - Brain collateral reservation and settlement are atomic with position state
 *
 * Isolated-margin rule:
 * - realized user loss is capped at the position collateral
 * - a price gap beyond collateral is recorded explicitly as badDebtWad
 * - bad debt is NOT silently charged to the trader's other Brain principal
 */
contract KGEN_PositionEngine_V1_0_0 {
    uint256 internal constant BPS = 10_000;
    uint8 internal constant MAX_ORACLE_SOURCES = 3;

    enum Market { KX, KY, KZ }
    enum Status { NONE, OPEN, CLOSED, LIQUIDATED }

    struct MarketConfig {
        uint16 initialMarginBps;
        uint16 maintenanceMarginBps;
        uint32 maxOracleAge;
        uint256 minPriceWad;
        uint256 maxPriceWad;
        bool enabled;
    }

    struct OracleConfig {
        address[3] feeds;
        uint8 feedCount;
        uint8 minValidSources;
        uint16 maxDeviationBps;
    }

    struct Position {
        address trader;
        Market market;
        int256 sizeWad;
        uint256 collateralWad;
        uint256 entryPriceWad;
        uint64 openedAt;
        uint64 closedAt;
        uint256 exitPriceWad;
        int256 rawPnlWad;
        int256 realizedPnlWad;
        uint256 badDebtWad;
        Status status;
    }

    address public admin;
    address public executor;
    IKGENBrainSettlementV4 public immutable brainSettlement;
    uint256 public nextPositionId = 1;
    mapping(Market => MarketConfig) public marketConfig;
    mapping(Market => OracleConfig) private _oracleConfig;
    mapping(uint256 => Position) public positions;

    event ExecutorSet(address indexed executor);
    event MarketConfigured(Market indexed market, uint16 initialMarginBps, uint16 maintenanceMarginBps, uint32 maxOracleAge, uint256 minPriceWad, uint256 maxPriceWad, bool enabled);
    event OracleConfigured(Market indexed market, address feed0, address feed1, address feed2, uint8 feedCount, uint8 minValidSources, uint16 maxDeviationBps);
    event PositionOpened(uint256 indexed positionId, address indexed trader, Market indexed market, int256 sizeWad, uint256 collateralWad, uint256 entryPriceWad, bytes32 positionKey);
    event PositionClosed(uint256 indexed positionId, uint256 exitPriceWad, int256 rawPnlWad, int256 realizedPnlWad, uint256 badDebtWad);
    event PositionLiquidated(uint256 indexed positionId, uint256 markPriceWad, int256 rawPnlWad, int256 realizedPnlWad, uint256 badDebtWad);

    error NotAdmin();
    error NotExecutor();
    error ZeroAddress();
    error InvalidRiskConfig();
    error InvalidOracleConfig();
    error MarketDisabled();
    error OracleQuorumUnavailable();
    error OracleDeviationExceeded();
    error InvalidTrader();
    error InvalidCollateral();
    error InitialMarginTooLow();
    error PositionNotOpen();
    error NotLiquidatable();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier onlyExecutor() {
        if (msg.sender != executor) revert NotExecutor();
        _;
    }

    constructor(address initialAdmin, address initialExecutor, address initialBrainSettlement) {
        if (initialAdmin == address(0) || initialExecutor == address(0) || initialBrainSettlement == address(0)) revert ZeroAddress();
        admin = initialAdmin;
        executor = initialExecutor;
        brainSettlement = IKGENBrainSettlementV4(initialBrainSettlement);
        emit ExecutorSet(initialExecutor);
    }

    function setExecutor(address nextExecutor) external onlyAdmin {
        if (nextExecutor == address(0)) revert ZeroAddress();
        executor = nextExecutor;
        emit ExecutorSet(nextExecutor);
    }

    function positionKey(uint256 positionId) public view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this), positionId));
    }

    function configureMarket(
        Market market,
        uint16 initialMarginBps,
        uint16 maintenanceMarginBps,
        uint32 maxOracleAge,
        uint256 minPriceWad,
        uint256 maxPriceWad,
        bool enabled
    ) external onlyAdmin {
        if (
            initialMarginBps == 0 ||
            maintenanceMarginBps == 0 ||
            maintenanceMarginBps > initialMarginBps ||
            initialMarginBps > BPS ||
            maxOracleAge == 0 ||
            minPriceWad == 0 ||
            maxPriceWad <= minPriceWad
        ) revert InvalidRiskConfig();
        marketConfig[market] = MarketConfig({
            initialMarginBps: initialMarginBps,
            maintenanceMarginBps: maintenanceMarginBps,
            maxOracleAge: maxOracleAge,
            minPriceWad: minPriceWad,
            maxPriceWad: maxPriceWad,
            enabled: enabled
        });
        emit MarketConfigured(market, initialMarginBps, maintenanceMarginBps, maxOracleAge, minPriceWad, maxPriceWad, enabled);
    }

    /// @notice Bind one market to 2 or 3 independent on-chain feed contracts.
    /// minValidSources is never allowed below 2 for this real-funds candidate.
    function configureOracle(
        Market market,
        address[] calldata feeds,
        uint8 minValidSources,
        uint16 maxDeviationBps
    ) external onlyAdmin {
        if (
            feeds.length < 2 ||
            feeds.length > MAX_ORACLE_SOURCES ||
            minValidSources < 2 ||
            minValidSources > feeds.length ||
            maxDeviationBps == 0 ||
            maxDeviationBps > 2_000
        ) revert InvalidOracleConfig();

        OracleConfig storage cfg = _oracleConfig[market];
        for (uint256 i = 0; i < MAX_ORACLE_SOURCES; i++) cfg.feeds[i] = address(0);

        for (uint256 i = 0; i < feeds.length; i++) {
            if (feeds[i] == address(0)) revert ZeroAddress();
            for (uint256 j = 0; j < i; j++) {
                if (feeds[i] == feeds[j]) revert InvalidOracleConfig();
            }
            cfg.feeds[i] = feeds[i];
        }
        cfg.feedCount = uint8(feeds.length);
        cfg.minValidSources = minValidSources;
        cfg.maxDeviationBps = maxDeviationBps;

        emit OracleConfigured(
            market,
            cfg.feeds[0],
            cfg.feeds[1],
            cfg.feeds[2],
            cfg.feedCount,
            cfg.minValidSources,
            cfg.maxDeviationBps
        );
    }

    function getOracleConfig(Market market)
        external
        view
        returns (address[3] memory feeds, uint8 feedCount, uint8 minValidSources, uint16 maxDeviationBps)
    {
        OracleConfig storage cfg = _oracleConfig[market];
        return (cfg.feeds, cfg.feedCount, cfg.minValidSources, cfg.maxDeviationBps);
    }

    function readMarketPrice(Market market)
        external
        view
        returns (uint256 priceWad, uint256 observedAt, uint8 validSources)
    {
        return _readOracle(market);
    }

    function openPosition(address trader, Market market, int256 sizeWad, uint256 collateralWad)
        external
        onlyExecutor
        returns (uint256 positionId)
    {
        if (trader == address(0)) revert InvalidTrader();
        if (collateralWad == 0 || collateralWad > uint256(type(int256).max)) revert InvalidCollateral();
        MarketConfig memory cfg = _config(market);
        (uint256 validated,,) = _readOracle(market);
        uint256 sizeAbs = _abs(sizeWad);
        uint256 notionalWad = KGEN_MarketRiskKernel_V1_0_0.notional(sizeAbs, validated);
        uint256 minInitialMargin = (notionalWad * cfg.initialMarginBps) / BPS;
        if (collateralWad < minInitialMargin) revert InitialMarginTooLow();

        positionId = nextPositionId++;
        bytes32 key = positionKey(positionId);
        brainSettlement.reservePositionCollateral(key, trader, collateralWad);

        positions[positionId] = Position({
            trader: trader,
            market: market,
            sizeWad: sizeWad,
            collateralWad: collateralWad,
            entryPriceWad: validated,
            openedAt: uint64(block.timestamp),
            closedAt: 0,
            exitPriceWad: 0,
            rawPnlWad: 0,
            realizedPnlWad: 0,
            badDebtWad: 0,
            status: Status.OPEN
        });
        emit PositionOpened(positionId, trader, market, sizeWad, collateralWad, validated, key);
    }

    function markPosition(uint256 positionId)
        public
        view
        returns (int256 unrealizedPnlWad, int256 equityWad, uint256 maintenanceMarginWad, bool liquidatable)
    {
        Position storage p = positions[positionId];
        if (p.status != Status.OPEN) revert PositionNotOpen();
        MarketConfig memory cfg = _config(p.market);
        (uint256 mark,,) = _readOracle(p.market);
        unrealizedPnlWad = KGEN_MarketRiskKernel_V1_0_0.pnl(p.sizeWad, p.entryPriceWad, mark);
        uint256 notionalWad = KGEN_MarketRiskKernel_V1_0_0.notional(_abs(p.sizeWad), mark);
        maintenanceMarginWad = KGEN_MarketRiskKernel_V1_0_0.maintenanceMargin(notionalWad, cfg.maintenanceMarginBps);
        equityWad = KGEN_MarketRiskKernel_V1_0_0.equity(int256(p.collateralWad), unrealizedPnlWad);
        liquidatable = KGEN_MarketRiskKernel_V1_0_0.liquidatable(p.collateralWad, unrealizedPnlWad, notionalWad, cfg.maintenanceMarginBps);
    }

    function closePosition(uint256 positionId)
        external
        onlyExecutor
        returns (int256 realizedPnlWad, uint256 badDebtWad)
    {
        Position storage p = positions[positionId];
        if (p.status != Status.OPEN) revert PositionNotOpen();
        (uint256 exitPrice,,) = _readOracle(p.market);
        (int256 rawPnlWad, int256 boundedPnlWad, uint256 gapDebtWad) =
            _settlementOutcome(p.sizeWad, p.entryPriceWad, exitPrice, p.collateralWad);

        p.exitPriceWad = exitPrice;
        p.rawPnlWad = rawPnlWad;
        p.realizedPnlWad = boundedPnlWad;
        p.badDebtWad = gapDebtWad;
        p.closedAt = uint64(block.timestamp);
        p.status = Status.CLOSED;

        brainSettlement.settlePositionCollateral(positionKey(positionId), boundedPnlWad, gapDebtWad);

        emit PositionClosed(positionId, exitPrice, rawPnlWad, boundedPnlWad, gapDebtWad);
        return (boundedPnlWad, gapDebtWad);
    }

    function liquidatePosition(uint256 positionId)
        external
        onlyExecutor
        returns (int256 realizedPnlWad, uint256 badDebtWad)
    {
        Position storage p = positions[positionId];
        if (p.status != Status.OPEN) revert PositionNotOpen();

        // Liquidation eligibility and settlement MUST use one exact oracle
        // observation. A second read in the same transaction could otherwise
        // bind the eligibility decision to one quorum result and realized PnL
        // to another result from a mutable/adversarial external feed.
        MarketConfig memory cfg = _config(p.market);
        (uint256 mark,,) = _readOracle(p.market);
        int256 rawPnlWad = KGEN_MarketRiskKernel_V1_0_0.pnl(p.sizeWad, p.entryPriceWad, mark);
        uint256 notionalWad = KGEN_MarketRiskKernel_V1_0_0.notional(_abs(p.sizeWad), mark);
        bool shouldLiquidate = KGEN_MarketRiskKernel_V1_0_0.liquidatable(
            p.collateralWad,
            rawPnlWad,
            notionalWad,
            cfg.maintenanceMarginBps
        );
        if (!shouldLiquidate) revert NotLiquidatable();

        (, int256 boundedPnlWad, uint256 gapDebtWad) =
            _settlementOutcome(p.sizeWad, p.entryPriceWad, mark, p.collateralWad);

        p.exitPriceWad = mark;
        p.rawPnlWad = rawPnlWad;
        p.realizedPnlWad = boundedPnlWad;
        p.badDebtWad = gapDebtWad;
        p.closedAt = uint64(block.timestamp);
        p.status = Status.LIQUIDATED;

        brainSettlement.settlePositionCollateral(positionKey(positionId), boundedPnlWad, gapDebtWad);

        emit PositionLiquidated(positionId, mark, rawPnlWad, boundedPnlWad, gapDebtWad);
        return (boundedPnlWad, gapDebtWad);
    }

    function _readOracle(Market market)
        internal
        view
        returns (uint256 priceWad, uint256 observedAt, uint8 validSources)
    {
        MarketConfig memory marketCfg = _config(market);
        OracleConfig storage oracleCfg = _oracleConfig[market];
        if (oracleCfg.feedCount < 2 || oracleCfg.minValidSources < 2) revert InvalidOracleConfig();

        uint256[3] memory prices;
        uint256 oldest = type(uint256).max;

        for (uint256 i = 0; i < oracleCfg.feedCount; i++) {
            IKGENPriceFeedV1 feed = IKGENPriceFeedV1(oracleCfg.feeds[i]);
            uint8 decimalsValue;
            try feed.decimals() returns (uint8 d) {
                decimalsValue = d;
            } catch {
                continue;
            }
            if (decimalsValue > 36) continue;

            try feed.latestRoundData() returns (
                uint80 roundId,
                int256 answer,
                uint256,
                uint256 updatedAt,
                uint80 answeredInRound
            ) {
                if (
                    answer <= 0 ||
                    updatedAt == 0 ||
                    updatedAt > block.timestamp ||
                    answeredInRound < roundId ||
                    block.timestamp - updatedAt > marketCfg.maxOracleAge
                ) continue;

                uint256 normalized = _normalizeToWad(uint256(answer), decimalsValue);
                if (normalized < marketCfg.minPriceWad || normalized > marketCfg.maxPriceWad) continue;

                prices[validSources] = normalized;
                validSources++;
                if (updatedAt < oldest) oldest = updatedAt;
            } catch {
                continue;
            }
        }

        if (validSources < oracleCfg.minValidSources) revert OracleQuorumUnavailable();

        // Sort the at-most-three valid prices ascending.
        for (uint256 i = 0; i < validSources; i++) {
            for (uint256 j = i + 1; j < validSources; j++) {
                if (prices[j] < prices[i]) {
                    uint256 tmp = prices[i];
                    prices[i] = prices[j];
                    prices[j] = tmp;
                }
            }
        }

        if (validSources == 2) {
            priceWad = (prices[0] / 2) + (prices[1] / 2) + ((prices[0] % 2 + prices[1] % 2) / 2);
        } else {
            priceWad = prices[1];
        }

        uint256 spread = prices[validSources - 1] - prices[0];
        if (spread > 0 && (spread * BPS) / priceWad > oracleCfg.maxDeviationBps) {
            revert OracleDeviationExceeded();
        }

        observedAt = oldest;
    }

    function _normalizeToWad(uint256 answer, uint8 decimalsValue) internal pure returns (uint256) {
        if (decimalsValue == 18) return answer;
        if (decimalsValue < 18) return answer * (10 ** uint256(18 - decimalsValue));
        return answer / (10 ** uint256(decimalsValue - 18));
    }

    function _settlementOutcome(
        int256 sizeWad,
        uint256 entryPriceWad,
        uint256 exitPriceWad,
        uint256 collateralWad
    ) internal pure returns (int256 rawPnlWad, int256 realizedPnlWad, uint256 badDebtWad) {
        rawPnlWad = KGEN_MarketRiskKernel_V1_0_0.pnl(sizeWad, entryPriceWad, exitPriceWad);
        if (rawPnlWad >= 0) return (rawPnlWad, rawPnlWad, 0);

        uint256 rawLossWad = uint256(-(rawPnlWad + 1)) + 1;
        if (rawLossWad <= collateralWad) return (rawPnlWad, rawPnlWad, 0);

        realizedPnlWad = -int256(collateralWad);
        badDebtWad = rawLossWad - collateralWad;
    }

    function _config(Market market) internal view returns (MarketConfig memory cfg) {
        cfg = marketConfig[market];
        if (!cfg.enabled) revert MarketDisabled();
    }

    function _abs(int256 value) internal pure returns (uint256) {
        if (value == 0) revert KGEN_MarketRiskKernel_V1_0_0.ZeroSize();
        if (value == type(int256).min) revert KGEN_MarketRiskKernel_V1_0_0.SignedOverflow();
        return uint256(value > 0 ? value : -value);
    }
}
