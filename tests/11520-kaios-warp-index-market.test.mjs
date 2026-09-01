import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KaiosWarpIndexMarket,
  computePnlKaios,
  liquidationIndex,
  DEFAULT_INDEX_SYMBOLS
} from '../K線西遊記/temples/11520/modules/kaios-warp-index-market.mjs';

test('1 index point = 1 KAIOS at 1C', () => {
  assert.equal(computePnlKaios({ entryIndex: 100000, currentIndex: 100010, direction: 'LONG', warpC: 1 }), 10);
  assert.equal(computePnlKaios({ entryIndex: 100000, currentIndex: 100010, direction: 'SHORT', warpC: 1 }), -10);
});

test('warp speed multiplies index PnL', () => {
  assert.equal(computePnlKaios({ entryIndex: 100000, currentIndex: 100010, direction: 'LONG', warpC: 100 }), 1000);
});

test('liquidation index respects collateral and maintenance margin', () => {
  const longLiq = liquidationIndex({ entryIndex: 100000, direction: 'LONG', warpC: 100, collateralKaios: 1000, maintenanceMarginBps: 500 });
  assert.equal(longLiq, 99990.5);
  const shortLiq = liquidationIndex({ entryIndex: 100000, direction: 'SHORT', warpC: 100, collateralKaios: 1000, maintenanceMarginBps: 500 });
  assert.equal(shortLiq, 100009.5);
});

test('local player can deposit, open and close one position', () => {
  const m = new KaiosWarpIndexMarket({ maintenanceMarginBps: 500, maxWarpC: 1000 });
  m.setIndex('BTC/USDT', 100000, { source: 'TEST_FIXTURE' });
  m.depositLocal('0xplayer', 1000);
  const p = m.openPosition({ playerId: '0xplayer', symbol: 'BTC/USDT', direction: 'LONG', warpC: 10, collateralKaios: 100 });
  assert.equal(p.entryIndex, 100000);
  assert.equal(m.snapshot('0xplayer').reservedKaios, 100);
  m.setIndex('BTC/USDT', 100005, { source: 'TEST_FIXTURE' });
  const closed = m.closePosition(p.positionId);
  assert.equal(closed.realizedPnlKaios, 50);
  assert.equal(m.snapshot('0xplayer').equityKaios, 1050);
  m.setIndex('BTC/USDT', 100010, { source: 'TEST_FIXTURE' });
  assert.equal(m.snapshot('0xplayer').equityKaios, 1050);
});

test('loss is bounded by position collateral', () => {
  const m = new KaiosWarpIndexMarket({ maxWarpC: 1000 });
  m.setIndex('BTC/USDT', 100000);
  m.depositLocal('p', 100);
  const p = m.openPosition({ playerId: 'p', symbol: 'BTC/USDT', direction: 'LONG', warpC: 1000, collateralKaios: 100 });
  m.setIndex('BTC/USDT', 1);
  const closed = m.closePosition(p.positionId);
  assert.equal(closed.realizedPnlKaios, -100);
  assert.equal(m.snapshot('p').equityKaios, 0);
});

test('cannot reserve more KAIOS than available', () => {
  const m = new KaiosWarpIndexMarket();
  m.setIndex('BTC/USDT', 100000);
  m.depositLocal('p', 10);
  assert.throws(() => m.openPosition({ playerId: 'p', symbol: 'BTC/USDT', direction: 'LONG', warpC: 1, collateralKaios: 11 }), /INSUFFICIENT_AVAILABLE_MARGIN/);
});

test('current index registry includes requested BTC pair families', () => {
  for (const symbol of ['BTC/USDT', 'BTC/BNB', 'BTC/WBNB', 'BTC/KGEN', 'BTC/KAIOS']) assert.ok(DEFAULT_INDEX_SYMBOLS.includes(symbol));
});
