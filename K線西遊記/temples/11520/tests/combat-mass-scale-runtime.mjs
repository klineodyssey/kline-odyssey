import assert from 'node:assert/strict';
import {K11520_COMBAT_SCALE,K11520_C_LEVELS,lotMass,combatExposure,normalizeC,cMode,movementVelocity,scaleInvariant} from '../runtime/combat-mass-scale-runtime.mjs';

assert.equal(scaleInvariant(),true);
assert.deepEqual(lotMass(1),{lots:1,kgenEquivalent:1,indexUnits:1,kaiosMass:1000,kgMass:1000});
assert.deepEqual(lotMass(3),{lots:3,kgenEquivalent:3,indexUnits:3,kaiosMass:3000,kgMass:3000});
assert.equal(K11520_COMBAT_SCALE.kaiosPerKgen,1000);
assert.equal(combatExposure({lots:2,playerKaiosAvailable:2500}).exposedKaios,2000);
assert.equal(combatExposure({lots:2,playerKaiosAvailable:1500}).exposedKaios,1500);
assert.equal(combatExposure({lots:2,playerKaiosAvailable:1500}).fullyBacked,false);
assert.deepEqual(K11520_C_LEVELS,[0,0.000001,0.00001,0.0001,0.001,0.01,0.1,1,10,100,1000]);
assert.equal(normalizeC(0),0);
assert.equal(normalizeC(0.000001),0.000001);
assert.equal(cMode(0),'LOCAL_WALK');
assert.equal(cMode(0.1),'SUBLIGHT_WARP');
assert.equal(cMode(1),'LIGHT_SPEED_SPOT');
assert.equal(cMode(10),'SUPERLUMINAL_WARP');
assert.equal(movementVelocity({localBaseVelocity:4,c:0}),4,'C=0 must preserve ordinary local XYZ walking');
assert.equal(movementVelocity({localBaseVelocity:4,c:0.001}),4,'sublight C must never make local gameplay motion slower than walking');
assert.equal(movementVelocity({localBaseVelocity:4,c:0.1}),4,'all sublight rail levels preserve local traversability');
assert.equal(movementVelocity({localBaseVelocity:4,c:1}),4,'C=1 light-speed/spot remains the normalized gameplay baseline');
assert.equal(movementVelocity({localBaseVelocity:4,c:10}),40,'superluminal C expands gameplay travel speed');

console.log('11520 combat mass/C scale PASS: 1 KGEN = 1 lot = 1 index = 1000 KAIOS = 1000 kg; C<=1 preserves local traversability; C>1 increases travel speed');
