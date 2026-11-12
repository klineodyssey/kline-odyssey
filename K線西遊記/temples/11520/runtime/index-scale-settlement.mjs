/* KGEN_META
INTERNAL_REVISION: 2026-11-05
AUTHOR: 白寧 / GPT engineering candidate
LIFE_ORGAN: K11520 Index Scale Settlement
STATUS: ISOLATED_CANDIDATE_NOT_PRODUCTION
PURPOSE: Pure price-index-scale settlement arithmetic; no wallet, chain, or payment authority.
*/
const MAX_LOTS=100, MAX_C=100;
function finite(value,name){
 if(typeof value!=='number'||!Number.isFinite(value))throw new RangeError(name+'_MUST_BE_FINITE');
 return value;
}
export function entryPriceScale(entry){
 const e=finite(entry,'ENTRY');
 if(e<=0)throw new RangeError('ENTRY_MUST_BE_POSITIVE');
 const exponent=Math.floor(Math.log10(e));
 const scale=10**exponent;
 if(!Number.isFinite(scale)||scale<=0)throw new RangeError('INVALID_PRICE_SCALE');
 return Object.freeze({exponent,scale});
}
/** Price movement is scaled by the ENTRY price decade, not by the exit decade.
 * Negative marks are valid for exceptional instruments such as WTI oil futures.
 * Note: this game-index point model must not be used as live KGEN valuation.
 */
export function quoteSettlementPoints({entry,mark,side,lots,c}={}){
 const e=finite(entry,'ENTRY'), m=finite(mark,'MARK');
 const l=finite(lots,'LOTS'), speed=finite(c,'C');
 if(!Number.isInteger(l)||l<1||l>MAX_LOTS)throw new RangeError('LOTS_OUT_OF_RANGE');
 if(!Number.isInteger(speed)||speed<1||speed>MAX_C)throw new RangeError('C_OUT_OF_RANGE');
 if(side!=='LONG'&&side!=='SHORT')throw new RangeError('INVALID_SIDE');
 const {exponent,scale}=entryPriceScale(e);
 const entryAlpha=e/scale, markAlpha=m/scale;
 const priceDelta=m-e, marketDeltaK=priceDelta/scale;
 const rawPnlK=(side==='LONG'?1:-1)*marketDeltaK*l*speed;
 if(!Number.isFinite(rawPnlK))throw new RangeError('PNL_OVERFLOW');
 return Object.freeze({entry:e,mark:m,entryExponent:exponent,entryScale:scale,entryAlpha,markAlpha,alphaDelta:marketDeltaK,priceDelta,marketDeltaK,lots:l,c:speed,side,rawPnlK,unit:'GAME_SETTLEMENT_K',simulationOnly:true});
}
/** Candidate limited-loss rule. Deficit is explicitly returned: never erase systemic risk.
 * This does not authorize an actual wallet payout.
 */
export function capLossToCollateral({rawPnlK,collateralK}={}){
 const pnl=finite(rawPnlK,'PNL'), collateral=finite(collateralK,'COLLATERAL');
 if(collateral<0)throw new RangeError('NEGATIVE_COLLATERAL');
 const cappedPnlK=Math.max(-collateral,pnl);
 const deficitK=Math.max(0,-pnl-collateral);
 return Object.freeze({rawPnlK:pnl,collateralK:collateral,cappedPnlK,deficitK,remainingCollateralK:Math.max(0,collateral+cappedPnlK),simulationOnly:true});
}
