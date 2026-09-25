import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRealTradingOrderIntent} from '../K線西遊記/temples/11520/runtime/real-trading-order-intent.mjs';

const WALLET='0x3333333333333333333333333333333333333333';
const BRAIN='0x1111111111111111111111111111111111111111';
const ENGINE='0x2222222222222222222222222222222222222222';
const base={
 axis:'KX',market:'BTCUSDT',chainId:56,side:'多',lots:2,c:100,price:65000,
 walletAddress:WALLET,brainAddress:BRAIN,positionEngineAddress:ENGINE,
 feedProvenanceVerified:true,humanMainnetAuthorization:true
};

test('builds unsigned non-broadcast exact-market intent at 100C hard cap only after all protected gates',()=>{
 const intent=buildRealTradingOrderIntent(base);
 assert.equal(intent.axis,'KX');assert.equal(intent.market,'BTCUSDT');assert.equal(intent.contractMarket,0);
 assert.equal(intent.c,100);assert.equal(intent.leverage,100);assert.equal(intent.side,'LONG');
 assert.equal(intent.lots,2);assert.equal(intent.transactionPayload,null);assert.equal(intent.calldata,null);
 assert.equal(intent.signerRequested,false);assert.equal(intent.broadcast,false);
 assert.equal(intent.status,'READY_FOR_EXPLICIT_WALLET_ACTION_NOT_SUBMITTED');
});
test('rejects wrong axis market, chain and missing protected authorization',()=>{
 assert.throws(()=>buildRealTradingOrderIntent({...base,market:'ETHUSDT'}),/REAL_TRADING_AXIS_MARKET_MISMATCH/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,chainId:97}),/REAL_TRADING_CHAIN_MISMATCH/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,humanMainnetAuthorization:false}),/HUMAN_MAINNET_EXECUTION_AUTHORIZATION_REQUIRED/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,feedProvenanceVerified:false}),/PRODUCTION_FEED_PROVENANCE_REQUIRED/);
});
test('rejects invalid order values, leverage above 100C and wallet identity',()=>{
 assert.throws(()=>buildRealTradingOrderIntent({...base,lots:0}),/LOTS_OUT_OF_RANGE/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,c:0}),/C_NEUTRAL_NO_POSITION/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,c:NaN}),/C_LEVERAGE_OUT_OF_RANGE/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,c:100.0001}),/C_LEVERAGE_OUT_OF_RANGE/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,c:1000}),/C_LEVERAGE_OUT_OF_RANGE/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,price:0}),/PRICE_MUST_BE_POSITIVE/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,walletAddress:'0xdead'}),/WALLET_ADDRESS_INVALID/);
});
test('signed C alone supplies direction; contradictory side and negative lots cannot execute',()=>{
 for(const c of [-100,-.001,.001,100]){
  const intent=buildRealTradingOrderIntent({...base,c,side:undefined});
  assert.equal(intent.c,c);assert.equal(intent.leverage,Math.abs(c));assert.equal(intent.side,c<0?'SHORT':'LONG');
  assert.equal(intent.broadcast,false);assert.equal(intent.signerRequested,false);
 }
 for(const [c,side] of [[100,'SHORT'],[-100,'LONG']])assert.throws(()=>buildRealTradingOrderIntent({...base,c,side}),/C_SIDE_MISMATCH/);
 for(const c of [-0,-100.0001,-1000,Infinity])assert.throws(()=>buildRealTradingOrderIntent({...base,c}),/C_/);
 for(const lots of [-1,0,1.5,101,Infinity])assert.throws(()=>buildRealTradingOrderIntent({...base,lots}),/LOTS_OUT_OF_RANGE/);
});
