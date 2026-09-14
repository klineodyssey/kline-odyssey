import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REAL_TRADING_MARKET_BINDINGS,
  REAL_TRADING_STATUS,
  getRealTradingBinding,
  assertRealTradingAxisMarket,
  realTradingEligibility
} from '../K線西遊記/temples/11520/runtime/real-trading-market-binding.mjs';

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

test('real funds remain disabled until protected gates are satisfied', () => {
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
