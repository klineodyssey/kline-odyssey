import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REAL_TRADING_MARKET_BINDINGS,
  REAL_TRADING_STATUS,
  getRealTradingBinding,
  assertRealTradingAxisMarket,
  realTradingEligibility,assertProductionAxisMarket,productionTradingMetadataEligibility
} from '../K線西遊記/temples/11520/runtime/real-trading-market-binding.mjs';

const BRAIN = '0x1111111111111111111111111111111111111111';
const ENGINE = '0x2222222222222222222222222222222222222222';

test('real trading axes are fixed to BTC ETH BNB on BSC', () => {
  assert.equal(REAL_TRADING_MARKET_BINDINGS.KX.market, 'BTCUSDT');
  assert.equal(REAL_TRADING_MARKET_BINDINGS.KY.market, 'ETHUSDT');
  assert.equal(REAL_TRADING_MARKET_BINDINGS.KZ.market, 'BNBUSDT');
  assert.equal(REAL_TRADING_MARKET_BINDINGS.KX.contractMarket, 0);
  assert.equal(REAL_TRADING_MARKET_BINDINGS.KY.contractMarket, 1);
  assert.equal(REAL_TRADING_MARKET_BINDINGS.KZ.contractMarket, 2);
  assert.equal(REAL_TRADING_MARKET_BINDINGS.KX.chainId, 56);
});

test('axis/market mismatch fails closed', () => {
  assert.throws(() => assertRealTradingAxisMarket({ axis: 'KX', market: 'SOLUSDT', chainId: 56 }), /REAL_TRADING_AXIS_MARKET_MISMATCH/);
  assert.throws(() => assertRealTradingAxisMarket({ axis: 'KY', market: 'BTCUSDT', chainId: 56 }), /REAL_TRADING_AXIS_MARKET_MISMATCH/);
  assert.throws(() => assertRealTradingAxisMarket({ axis: 'KZ', market: 'BNBUSDT', chainId: 97 }), /REAL_TRADING_CHAIN_MISMATCH/);
  assert.throws(() => getRealTradingBinding('KA'), /REAL_TRADING_AXIS_NOT_SUPPORTED/);
});

test('real funds remain disabled while any protected gate is missing', () => {
  const state = realTradingEligibility({ axis: 'KX', market: 'BTC/USDT', chainId: 56 });
  assert.equal(state.eligible, false);
  assert.equal(state.orderSubmissionEnabled, false);
  assert.equal(state.signerRequestEnabled, false);
  assert.ok(state.blockers.includes('PRODUCTION_FEED_PROVENANCE_REQUIRED'));
  assert.ok(state.blockers.includes('BRAIN_DEPLOYED_ADDRESS_REQUIRED'));
  assert.ok(state.blockers.includes('POSITION_ENGINE_DEPLOYED_ADDRESS_REQUIRED'));
  assert.ok(state.blockers.includes('HUMAN_MAINNET_EXECUTION_AUTHORIZATION_REQUIRED'));
  assert.equal(REAL_TRADING_STATUS.mainnetTransactionAuthorized, false);
});

test('eligibility opens only when fixed market plus every protected gate is exact', () => {
  const state = realTradingEligibility({
    axis: 'KX', market: 'BTCUSDT', chainId: 56,
    feedProvenanceVerified: true,
    brainAddress: BRAIN,
    positionEngineAddress: ENGINE,
    humanMainnetAuthorization: true
  });
  assert.equal(state.eligible, true);
  assert.equal(state.orderSubmissionEnabled, true);
  assert.equal(state.signerRequestEnabled, true);
  assert.deepEqual(state.blockers, []);
  assert.throws(() => realTradingEligibility({
    axis: 'KX', market: 'ETHUSDT', chainId: 56,
    feedProvenanceVerified: true,
    brainAddress: BRAIN,
    positionEngineAddress: ENGINE,
    humanMainnetAuthorization: true
  }), /REAL_TRADING_AXIS_MARKET_MISMATCH/);
});


test('production roles are immutable USD indexes alongside unchanged USDT reference bindings',()=>{
 for(const [axis,asset,id] of [['KX','BTC',0],['KY','ETH',1],['KZ','BNB',2]]){
  const binding=getRealTradingBinding(axis),market=asset+'/USD INDEX';
  assert.equal(binding.market,asset+'USDT');assert.equal(binding.display,asset+'/USDT');assert.equal(binding.referenceQuoteCurrency,'USDT');
  assert.deepEqual(binding.production,{market,quoteCurrency:'USD',settlementAsset:'KGEN'});
  assert.ok(Object.isFrozen(binding.production));assert.equal(binding.contractMarket,id);assert.equal(binding.chainId,56);
  assert.equal(assertProductionAxisMarket({axis,market}),binding);
  assert.throws(()=>assertProductionAxisMarket({axis,market:binding.market}),/REAL_TRADING_AXIS_MARKET_MISMATCH/);
  assert.throws(()=>assertRealTradingAxisMarket({axis,market}),/REAL_TRADING_AXIS_MARKET_MISMATCH/);
  assert.throws(()=>assertProductionAxisMarket({axis,market,chainId:97}),/REAL_TRADING_CHAIN_MISMATCH/);
  const other=getRealTradingBinding(axis==='KX'?'KY':'KX').production.market;
  assert.throws(()=>assertProductionAxisMarket({axis,market:other}),/REAL_TRADING_AXIS_MARKET_MISMATCH/);
 }
});

test('production metadata checks never create execution readiness even with every caller flag set',()=>{
 const input={axis:'KX',market:'BTC/USD INDEX',chainId:56,feedProvenanceVerified:true,brainAddress:BRAIN,positionEngineAddress:ENGINE,humanMainnetAuthorization:true,settlementAuthority:true};
 const result=productionTradingMetadataEligibility(input);
 assert.equal(result.metadataEligible,true);assert.deepEqual(result.blockers,[]);
 assert.equal(result.executionReady,false);assert.equal(result.oracleVerification,'NOT_PERFORMED');
 assert.equal(result.orderSubmissionEnabled,false);assert.equal(result.signerRequestEnabled,false);
 const blocked=productionTradingMetadataEligibility({axis:input.axis,market:input.market});
 assert.equal(blocked.metadataEligible,false);assert.equal(blocked.blockers.length,4);assert.equal(blocked.executionReady,false);
});


test('production metadata eligibility ignores unrelated getters and reads each named field once',()=>{
 const values={axis:'KX',market:'BTC/USD INDEX',chainId:56,feedProvenanceVerified:true,brainAddress:BRAIN,positionEngineAddress:ENGINE,humanMainnetAuthorization:true};
 const reads={},input={};
 for(const [key,value] of Object.entries(values))Object.defineProperty(input,key,{enumerable:true,get(){reads[key]=(reads[key]||0)+1;return value}});
 for(const key of ['provider','request','signer','settlementAuthority','transactionPayload'])Object.defineProperty(input,key,{enumerable:true,get(){throw new Error('UNRELATED_GETTER_EXECUTED')}});
 const result=productionTradingMetadataEligibility(input);
 assert.equal(result.metadataEligible,true);assert.equal(result.executionReady,false);assert.equal(result.oracleVerification,'NOT_PERFORMED');
 assert.deepEqual(reads,Object.fromEntries(Object.keys(values).map(key=>[key,1])));
});
