import assert from 'node:assert/strict';
import {fireLots,warpC,leverageL,ECONOMY_DOMAINS} from './nonlinear-controls.mjs';

// Firepower: center is zero; inner half is precision 0..10; outer half accelerates 10..100.
assert.equal(fireLots(0),0);
assert.ok(fireLots(0.25)>=4 && fireLots(0.25)<=6);
assert.equal(fireLots(0.5),10);
assert.ok(fireLots(0.75)>10 && fireLots(0.75)<100);
assert.equal(fireLots(1),100);
assert.equal(fireLots(-0.5),-10);
assert.equal(fireLots(-1),-100);

// C: 0 means spatial stop. L remains a trading-only positive multiplier.
assert.equal(warpC(0),0);
assert.equal(warpC(0.5),10);
assert.equal(warpC(1),1000);
assert.equal(leverageL(0),1);
assert.equal(leverageL(0.5),10);
assert.equal(leverageL(1),1000);

assert.equal(ECONOMY_DOMAINS.K_FIELD.settlement,'KGEN');
assert.equal(ECONOMY_DOMAINS.LIFE_WORLD.settlement,'KAIOS');
console.log('11520 nonlinear controls: PASS');
