// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * KGEN_MarketRiskKernel
 * VERSION: 1.0.0
 * STATUS: DRAFT_REAL_FUNDS_CANDIDATE
 * SOURCE_OF_TRUTH: CANDIDATE
 * Formal organ filename is versionless; version remains metadata.
 *
 * Pure arithmetic and fail-closed oracle validation for KX/KY/KZ markets.
 * Safety boundary: NO custody, NO position storage, NO settlement authority,
 * NO external oracle call. Prices, sizes and KGEN notionals use 1e18 units.
 */
library KGEN_MarketRiskKernel_V1_0_0 {
    uint256 internal constant WAD = 1e18;
    uint256 internal constant MAX_BPS = 10_000;
    uint256 internal constant MAX_C_WAD = 100e18;
    uint256 internal constant MAX_LOTS = 100;
    error InvalidC(); error InvalidLots();

    // Human Canon: one lot locks one KGEN; C never discounts principal.
    function validateOrder(int256 cWad, uint256 lots) internal pure returns (uint256 leverageWad) {
        if (cWad == 0 || cWad < -int256(MAX_C_WAD) || cWad > int256(MAX_C_WAD)) revert InvalidC();
        leverageWad = uint256(cWad < 0 ? -cWad : cWad);
        // Same selectable C detents as the frontend authority, represented exactly
        // in WAD. Execution rejects rather than silently rounding an order intent.
        if (leverageWad != 1e15 && leverageWad != 1e16 && leverageWad != 1e17 &&
            leverageWad != WAD && (leverageWad < 5e18 || leverageWad % 5e18 != 0)) revert InvalidC();
        if (lots == 0 || lots > MAX_LOTS) revert InvalidLots();
        return leverageWad;
    }

    function orderPnl(int256 cWad, uint256 lots, uint256 entry, uint256 mark) internal pure returns (int256) {
        validateOrder(cWad, lots);
        if (entry == 0 || mark == 0) revert ZeroPrice();
        // Bounds also keep signed multiplication deterministic and fail-closed.
        if (entry > 1e36 || mark > 1e36) revert SignedOverflow();
        return (int256(mark) - int256(entry)) * cWad * int256(lots) / int256(entry);
    }
    error ZeroPrice(); error ZeroSize(); error InvalidBps(); error InvalidOracleTime(); error StaleOraclePrice(); error OraclePriceOutOfBounds(); error SignedOverflow();

    function validateOraclePrice(uint256 priceWad,uint256 updatedAt,uint256 nowTs,uint256 maxAge,uint256 minPriceWad,uint256 maxPriceWad) internal pure returns (uint256) {
        if (priceWad == 0) revert ZeroPrice();
        if (updatedAt == 0 || updatedAt > nowTs) revert InvalidOracleTime();
        if (nowTs - updatedAt > maxAge) revert StaleOraclePrice();
        if (priceWad < minPriceWad || priceWad > maxPriceWad) revert OraclePriceOutOfBounds();
        return priceWad;
    }
    function notional(uint256 sizeAbsWad,uint256 priceWad) internal pure returns (uint256) { if (sizeAbsWad == 0) revert ZeroSize(); if (priceWad == 0) revert ZeroPrice(); return (sizeAbsWad * priceWad) / WAD; }
    function pnl(int256 sizeWad,uint256 entryPriceWad,uint256 markPriceWad) internal pure returns (int256) {
        if (sizeWad == 0) revert ZeroSize(); if (entryPriceWad == 0 || markPriceWad == 0) revert ZeroPrice();
        if (entryPriceWad > uint256(type(int256).max) || markPriceWad > uint256(type(int256).max)) revert SignedOverflow();
        int256 delta = int256(markPriceWad) - int256(entryPriceWad); return (sizeWad * delta) / int256(WAD);
    }
    function maintenanceMargin(uint256 notionalWad,uint16 maintenanceBps) internal pure returns (uint256) { if (maintenanceBps == 0 || maintenanceBps > MAX_BPS) revert InvalidBps(); return (notionalWad * maintenanceBps) / MAX_BPS; }
    function equity(int256 collateralWad,int256 unrealizedPnlWad) internal pure returns (int256) { return collateralWad + unrealizedPnlWad; }
    function liquidatable(uint256 collateralWad,int256 unrealizedPnlWad,uint256 notionalWad,uint16 maintenanceBps) internal pure returns (bool) {
        if (collateralWad > uint256(type(int256).max)) revert SignedOverflow(); uint256 mm = maintenanceMargin(notionalWad, maintenanceBps); if (mm > uint256(type(int256).max)) revert SignedOverflow(); return equity(int256(collateralWad), unrealizedPnlWad) <= int256(mm);
    }
}

contract KGEN_MarketRiskKernelHarness_V1_0_0 {
    function validateOraclePrice(uint256 priceWad,uint256 updatedAt,uint256 nowTs,uint256 maxAge,uint256 minPriceWad,uint256 maxPriceWad) external pure returns (uint256) { return KGEN_MarketRiskKernel_V1_0_0.validateOraclePrice(priceWad,updatedAt,nowTs,maxAge,minPriceWad,maxPriceWad); }
    function notional(uint256 sizeAbsWad,uint256 priceWad) external pure returns (uint256) { return KGEN_MarketRiskKernel_V1_0_0.notional(sizeAbsWad,priceWad); }
    function pnl(int256 sizeWad,uint256 entryPriceWad,uint256 markPriceWad) external pure returns (int256) { return KGEN_MarketRiskKernel_V1_0_0.pnl(sizeWad,entryPriceWad,markPriceWad); }
    function maintenanceMargin(uint256 notionalWad,uint16 maintenanceBps) external pure returns (uint256) { return KGEN_MarketRiskKernel_V1_0_0.maintenanceMargin(notionalWad,maintenanceBps); }
    function liquidatable(uint256 collateralWad,int256 unrealizedPnlWad,uint256 notionalWad,uint16 maintenanceBps) external pure returns (bool) { return KGEN_MarketRiskKernel_V1_0_0.liquidatable(collateralWad,unrealizedPnlWad,notionalWad,maintenanceBps); }
}
