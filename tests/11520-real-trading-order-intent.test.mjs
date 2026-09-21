import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRealTradingOrderIntent} from '../K線西遊記/temples/11520/runtime/real-trading-order-intent.mjs';

const WALLET='0x3333333333333333333333333333333333333333';
const BRAIN='0x1111111111111111111111111111111111111111';
const ENGINE='0x2222222222222222222222222222222222222222';
const base={axis:'KX',market:'BTCUSDT',chainId:56,side:'多',lots:2,c:100,price:65000,walletAddress:WALLET,brainAddress:BRAIN,positionEngineAddress:ENGINE,feedProvenanceVerified:true,humanMainnetAuthorization:true};

test('builds unsigned non-broadcast exact-market intent at 100C hard cap',()=>{
 const intent=buildRealTradingOrderIntent(base);
 assert.equal(intent.c,100);assert.equal(intent.leverage,100);assert.equal(intent.side,'LONG');assert.equal(intent.broadcast,false);
});
test('rejects wrong binding and missing protected authorization',()=>{
 assert.throws(()=>buildRealTradingOrderIntent({...base,market:'ETHUSDT'}),/REAL_TRADING_AXIS_MARKET_MISMATCH/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,humanMainnetAuthorization:false}),/HUMAN_MAINNET_EXECUTION_AUTHORIZATION_REQUIRED/);
});
test('rejects values outside 1..100 lots and 0<C<=100',()=>{
 assert.throws(()=>buildRealTradingOrderIntent({...base,lots:0}),/LOTS_OUT_OF_RANGE/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,c:0}),/C_MUST_BE_POSITIVE/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,c:100.0001}),/C_LEVERAGE_OUT_OF_RANGE/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,c:1000}),/C_LEVERAGE_OUT_OF_RANGE/);
});
