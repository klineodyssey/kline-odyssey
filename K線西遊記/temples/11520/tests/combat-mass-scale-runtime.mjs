import assert from 'node:assert/strict';
import {K11520_COMBAT_SCALE,lotMass,combatExposure,warpVelocity,scaleInvariant} from '../runtime/combat-mass-scale-runtime.mjs';

assert.equal(scaleInvariant(),true);
assert.deepEqual(lotMass(1),{lots:1,kgenEquivalent:1,indexUnits:1,kaiosMass:1000,kgMass:1000});
assert.deepEqual(lotMass(3),{lots:3,kgenEquivalent:3,indexUnits:3,kaiosMass:3000,kgMass:3000});
assert.equal(K11520_COMBAT_SCALE.kaiosPerKgen,1000);
assert.equal(combatExposure({lots:2,playerKaiosAvailable:2500}).exposedKaios,2000);
assert.equal(combatExposure({lots:2,playerKaiosAvailable:1500}).exposedKaios,1500);
assert.equal(combatExposure({lots:2,playerKaiosAvailable:1500}).fullyBacked,false);
assert.equal(warpVelocity(4,3),12);
assert.equal(warpVelocity(4,-3),0);

console.log('11520 combat mass scale PASS: 1 KGEN = 1 lot = 1 index = 1000 KAIOS = 1000 kg; C scales velocity only');
