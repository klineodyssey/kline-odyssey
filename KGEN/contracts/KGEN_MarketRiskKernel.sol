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
