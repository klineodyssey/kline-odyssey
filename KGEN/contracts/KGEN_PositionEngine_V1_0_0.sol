// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {KGEN_MarketRiskKernel_V1_0_0} from "./KGEN_MarketRiskKernel_V1_0_0.sol";

/**
 * KGEN_PositionEngine_V1_0_0
 * Candidate position state machine for KX/KY/KZ markets.
 *
 * SAFETY BOUNDARY:
 * - NO token custody
 * - NO payout / settlement transfer
 * - NO oracle network call
 * - executor-supplied observations are validated for freshness/bounds only
 * - final money movement must be performed by a separately reviewed settlement adapter
 *
 * Isolated-margin rule:
 * - realized user loss is capped at the position collateral
 * - a price gap beyond collateral is recorded explicitly as badDebtWad
 * - bad debt is NOT silently charged to the trader's other Brain principal
 */
contract KGEN_PositionEngine_V1_0_0 {
    uint256 internal constant BPS = 10_000;

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
    uint256 public nextPositionId = 1;
    mapping(Market => MarketConfig) public marketConfig;
    mapping(uint256 => Position) public positions;

    event ExecutorSet(address indexed executor);
    event MarketConfigured(Market indexed market, uint16 initialMarginBps, uint16 maintenanceMarginBps, uint32 maxOracleAge, uint256 minPriceWad, uint256 maxPriceWad, bool enabled);
    event PositionOpened(uint256 indexed positionId, address indexed trader, Market indexed market, int256 sizeWad, uint256 collateralWad, uint256 entryPriceWad);
    event PositionClosed(uint256 indexed positionId, uint256 exitPriceWad, int256 rawPnlWad, int256 realizedPnlWad, uint256 badDebtWad);
    event PositionLiquidated(uint256 indexed positionId, uint256 markPriceWad, int256 rawPnlWad, int256 realizedPnlWad, uint256 badDebtWad);

    error NotAdmin();
    error NotExecutor();
    error ZeroAddress();
    error InvalidRiskConfig();
    error MarketDisabled();
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

    constructor(address initialAdmin, address initialExecutor) {
        if (initialAdmin == address(0) || initialExecutor == address(0)) revert ZeroAddress();
        admin = initialAdmin;
        executor = initialExecutor;
        emit ExecutorSet(initialExecutor);
    }

    function setExecutor(address nextExecutor) external onlyAdmin {
        if (nextExecutor == address(0)) revert ZeroAddress();
        executor = nextExecutor;
        emit ExecutorSet(nextExecutor);
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

    function openPosition(
        address trader,
        Market market,
        int256 sizeWad,
        uint256 collateralWad,
        uint256 priceWad,
        uint256 updatedAt
    ) external onlyExecutor returns (uint256 positionId) {
        if (trader == address(0)) revert InvalidTrader();
        if (collateralWad == 0 || collateralWad > uint256(type(int256).max)) revert InvalidCollateral();
        MarketConfig memory cfg = _config(market);
        uint256 validated = _validatePrice(cfg, priceWad, updatedAt);
        uint256 sizeAbs = _abs(sizeWad);
        uint256 notionalWad = KGEN_MarketRiskKernel_V1_0_0.notional(sizeAbs, validated);
        uint256 minInitialMargin = (notionalWad * cfg.initialMarginBps) / BPS;
        if (collateralWad < minInitialMargin) revert InitialMarginTooLow();

        positionId = nextPositionId++;
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
        emit PositionOpened(positionId, trader, market, sizeWad, collateralWad, validated);
    }

    function markPosition(uint256 positionId, uint256 markPriceWad, uint256 updatedAt)
        public
        view
        returns (int256 unrealizedPnlWad, int256 equityWad, uint256 maintenanceMarginWad, bool liquidatable)
    {
        Position storage p = positions[positionId];
        if (p.status != Status.OPEN) revert PositionNotOpen();
        MarketConfig memory cfg = _config(p.market);
        uint256 mark = _validatePrice(cfg, markPriceWad, updatedAt);
        unrealizedPnlWad = KGEN_MarketRiskKernel_V1_0_0.pnl(p.sizeWad, p.entryPriceWad, mark);
        uint256 notionalWad = KGEN_MarketRiskKernel_V1_0_0.notional(_abs(p.sizeWad), mark);
        maintenanceMarginWad = KGEN_MarketRiskKernel_V1_0_0.maintenanceMargin(notionalWad, cfg.maintenanceMarginBps);
        equityWad = KGEN_MarketRiskKernel_V1_0_0.equity(int256(p.collateralWad), unrealizedPnlWad);
        liquidatable = KGEN_MarketRiskKernel_V1_0_0.liquidatable(p.collateralWad, unrealizedPnlWad, notionalWad, cfg.maintenanceMarginBps);
    }

    function closePosition(uint256 positionId, uint256 exitPriceWad, uint256 updatedAt)
        external
        onlyExecutor
        returns (int256 realizedPnlWad, uint256 badDebtWad)
    {
        Position storage p = positions[positionId];
        if (p.status != Status.OPEN) revert PositionNotOpen();
        MarketConfig memory cfg = _config(p.market);
        uint256 exitPrice = _validatePrice(cfg, exitPriceWad, updatedAt);
        (int256 rawPnlWad, int256 boundedPnlWad, uint256 gapDebtWad) =
            _settlementOutcome(p.sizeWad, p.entryPriceWad, exitPrice, p.collateralWad);

        p.exitPriceWad = exitPrice;
        p.rawPnlWad = rawPnlWad;
        p.realizedPnlWad = boundedPnlWad;
        p.badDebtWad = gapDebtWad;
        p.closedAt = uint64(block.timestamp);
        p.status = Status.CLOSED;
        emit PositionClosed(positionId, exitPrice, rawPnlWad, boundedPnlWad, gapDebtWad);
        return (boundedPnlWad, gapDebtWad);
    }

    function liquidatePosition(uint256 positionId, uint256 markPriceWad, uint256 updatedAt)
        external
        onlyExecutor
        returns (int256 realizedPnlWad, uint256 badDebtWad)
    {
        Position storage p = positions[positionId];
        if (p.status != Status.OPEN) revert PositionNotOpen();
        (, , , bool shouldLiquidate) = markPosition(positionId, markPriceWad, updatedAt);
        if (!shouldLiquidate) revert NotLiquidatable();
        MarketConfig memory cfg = _config(p.market);
        uint256 mark = _validatePrice(cfg, markPriceWad, updatedAt);
        (int256 rawPnlWad, int256 boundedPnlWad, uint256 gapDebtWad) =
            _settlementOutcome(p.sizeWad, p.entryPriceWad, mark, p.collateralWad);

        p.exitPriceWad = mark;
        p.rawPnlWad = rawPnlWad;
        p.realizedPnlWad = boundedPnlWad;
        p.badDebtWad = gapDebtWad;
        p.closedAt = uint64(block.timestamp);
        p.status = Status.LIQUIDATED;
        emit PositionLiquidated(positionId, mark, rawPnlWad, boundedPnlWad, gapDebtWad);
        return (boundedPnlWad, gapDebtWad);
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

    function _validatePrice(MarketConfig memory cfg, uint256 priceWad, uint256 updatedAt) internal view returns (uint256) {
        return KGEN_MarketRiskKernel_V1_0_0.validateOraclePrice(
            priceWad,
            updatedAt,
            block.timestamp,
            cfg.maxOracleAge,
            cfg.minPriceWad,
            cfg.maxPriceWad
        );
    }

    function _abs(int256 value) internal pure returns (uint256) {
        if (value == 0) revert KGEN_MarketRiskKernel_V1_0_0.ZeroSize();
        if (value == type(int256).min) revert KGEN_MarketRiskKernel_V1_0_0.SignedOverflow();
        return uint256(value > 0 ? value : -value);
    }
}
