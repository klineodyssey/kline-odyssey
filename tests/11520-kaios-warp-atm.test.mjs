import test from 'node:test';
import assert from 'node:assert/strict';
import { pnlKaios, liquidationMark, WarpPositionBook } from '../K線西遊記/temples/11520/modules/kaios-warp-index-layer.mjs';
import { createAtmQuote, acceptAtmQuote, deriveCrossIndexes } from '../K線西遊記/temples/11520/modules/kaios-atm-quote-router.mjs';

test('1 index point at 100C settles 100 KAIOS',()=>{
  assert.equal(pnlKaios({entry:100,currentIndex:101,mark:101,direction:'LONG',warpC:100}),100);
  assert.equal(pnlKaios({entry:100,mark:101,direction:'SHORT',warpC:100}),-100);
});

test('liquidation is bounded by posted collateral',()=>{
  assert.equal(liquidationMark({entry:100,direction:'LONG',warpC:10,collateralKaios:100,maintenanceMarginBps:500}),90.5);
  assert.equal(liquidationMark({entry:100,direction:'SHORT',warpC:10,collateralKaios:100,maintenanceMarginBps:500}),109.5);
});

test('warp book requires KAIOS margin and caps review speed',()=>{
  const b=new WarpPositionBook(); b.setReferenceMark('BTC/USDT',100000); b.creditReviewKaios('p1',1000);
  const p=b.open({playerId:'p1',symbol:'BTC/USDT',direction:'LONG',warpC:100,collateralKaios:100});
  assert.equal(p.entry,100000); assert.throws(()=>b.open({playerId:'p1',symbol:'BTC/USDT',direction:'LONG',warpC:1001,collateralKaios:1}),/WARP_EXCEEDS_REVIEW_CAP/);
  b.setReferenceMark('BTC/USDT',99998); const c=b.close(p.positionId); assert.equal(c.realizedPnlKaios,-100);
});

test('production-style credit requires verified KAIOS receipt evidence',()=>{
  const b=new WarpPositionBook();
  assert.throws(()=>b.creditVerifiedKaios('p1',1,{asset:'KAIOS',status:'PENDING'}),/VERIFIED_KAIOS_RECEIPT_REQUIRED/);
  assert.equal(b.creditVerifiedKaios('p1',7,{asset:'KAIOS',status:'VERIFIED_SETTLED'}).kaiosBalance,7);
});

test('ATM quote is bilateral, non-fixed and cannot mint white-hole KAIOS',()=>{
  const q=createAtmQuote({quoteId:'Q1',makerLifeId:'life-maker',makerWallet:'0xmaker',payAsset:'KGEN',payAmount:1,kaiosAmount:777,expiresAt:new Date(Date.now()+60000).toISOString()});
  assert.equal(q.kaiosPerPayAsset,777); assert.equal(q.fixedUniversalRate,false); assert.equal(q.whiteHoleMinting,false);
  assert.throws(()=>acceptAtmQuote(q,{takerLifeId:'life-taker',takerWallet:'0xtaker'}),/EXPLICIT_ACCEPTANCE_REQUIRED/);
  const a=acceptAtmQuote(q,{takerLifeId:'life-taker',takerWallet:'0xtaker',accepted:true}); assert.equal(a.marginCreditAllowed,false); assert.deepEqual(a.requiredReceipts,['KGEN_TO_MAKER','KAIOS_TO_TAKER']);
});

test('cross indexes derive BTC/KGEN and only derive BTC/KAIOS with market/ATM KAIOS quote',()=>{
  const a=deriveCrossIndexes({btcUsdt:100000,bnbUsdt:1000,kgenPerWbnb:2000}); assert.equal(a['KGEN/USDT'],0.5); assert.equal(a['BTC/KGEN'],200000); assert.equal(a['BTC/KAIOS'],null);
  const b=deriveCrossIndexes({btcUsdt:100000,bnbUsdt:1000,kgenPerWbnb:2000,kaiosPerKgen:500}); assert.equal(b['KAIOS/USDT'],0.001); assert.equal(b['BTC/KAIOS'],100000000);
});
