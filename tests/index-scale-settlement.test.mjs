/* KGEN_META
INTERNAL_REVISION: 2026-11-05
AUTHOR: 白寧 / GPT engineering candidate
LIFE_ORGAN: K11520 Index Scale Settlement Tests
STATUS: TEST_ONLY
*/
import assert from 'node:assert/strict';
import test from 'node:test';
import {entryPriceScale,quoteSettlementPoints,capLossToCollateral} from '../K線西遊記/temples/11520/runtime/index-scale-settlement.mjs';

test('BTC entry decade and 100 lots × 100 C',()=>{
 assert.deepEqual(entryPriceScale(80000),{exponent:4,scale:10000});
 for(const [mark,delta,profit] of [[81000,.1,1000],[90000,1,10000],[180000,10,100000]]){
  const v=quoteSettlementPoints({entry:80000,mark,side:'LONG',lots:100,c:100});
  assert.equal(v.marketDeltaK,delta);
  assert.equal(v.rawPnlK,profit);
  assert.equal(v.entryScale,10000);
 }
});
test('crossing price decade preserves entry scale',()=>{
 const v=quoteSettlementPoints({entry:90000,mark:110000,side:'LONG',lots:1,c:1});
 assert.equal(v.entryScale,10000);
 assert.equal(v.marketDeltaK,2);
});
test('short gap capped at collateral; deficit remains explicit',()=>{
 const v=quoteSettlementPoints({entry:80000,mark:180000,side:'SHORT',lots:100,c:100});
 const r=capLossToCollateral({rawPnlK:v.rawPnlK,collateralK:80000});
 assert.equal(r.rawPnlK,-100000);
 assert.equal(r.cappedPnlK,-80000);
 assert.equal(r.deficitK,20000);
 assert.equal(r.remainingCollateralK,0);
});
test('negative WTI is a market price, not negative world XYZ',()=>{
 const v=quoteSettlementPoints({entry:20,mark:-37.63,side:'LONG',lots:100,c:100});
 assert.ok(Math.abs(v.rawPnlK-(-57630))<1e-8);
});
test('invalid position inputs fail closed',()=>{
 for(const args of [
  {entry:0,mark:1,side:'LONG',lots:1,c:1},
  {entry:80000,mark:81000,side:'LONG',lots:101,c:1},
  {entry:80000,mark:81000,side:'LONG',lots:1,c:101},
  {entry:80000,mark:81000,side:'BUY',lots:1,c:1}
 ])assert.throws(()=>quoteSettlementPoints(args));
});
