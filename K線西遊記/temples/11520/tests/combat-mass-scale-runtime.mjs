import assert from 'node:assert/strict';
import {K11520_COMBAT_SCALE,K11520_C_LEVELS,lotMass,combatExposure,normalizeC,cMode,movementVelocity,scaleInvariant} from '../runtime/combat-mass-scale-runtime.mjs';

assert.equal(scaleInvariant(),true);
assert.deepEqual(lotMass(1),{lots:1,kgenEquivalent:1,indexUnits:1,kaiosMass:1000,kgMass:1000});
assert.deepEqual(lotMass(3),{lots:3,kgenEquivalent:3,indexUnits:3,kaiosMass:3000,kgMass:3000});
assert.equal(K11520_COMBAT_SCALE.kaiosPerKgen,1000);
assert.equal(combatExposure({lots:2,playerKaiosAvailable:2500}).exposedKaios,2000);
assert.equal(combatExposure({lots:2,playerKaiosAvailable:1500}).exposedKaios,1500);
assert.equal(combatExposure({lots:2,playerKaiosAvailable:1500}).fullyBacked,false);
assert.deepEqual(K11520_C_LEVELS,[-100,-10,-1,-0.1,-0.01,-0.001,-0.0001,-0.00001,-0.000001,0,0.000001,0.00001,0.0001,0.001,0.01,0.1,1,10,100]);
assert.equal(normalizeC(0),0);
assert.equal(normalizeC(0.000001),0.000001);
assert.equal(normalizeC(-0.000001),-0.000001);
assert.equal(normalizeC(-0.1),-0.1);
assert.equal(cMode(0),'LOCAL_WALK');
assert.equal(cMode(0.1),'SUBLIGHT_WARP');
assert.equal(cMode(-0.1),'REVERSE_SUBLIGHT');
assert.equal(cMode(1),'LIGHT_SPEED_SPOT');
assert.equal(cMode(-1),'REVERSE_LIGHT_SPEED');
assert.equal(cMode(10),'SUPERLUMINAL_WARP');
assert.equal(cMode(-10),'REVERSE_SUPERLUMINAL');
assert.equal(movementVelocity({localBaseVelocity:4,c:0}),4,'C=0 must preserve ordinary local XYZ walking');
assert.equal(movementVelocity({localBaseVelocity:4,c:1}),4);
assert.equal(movementVelocity({localBaseVelocity:4,c:-1}),-4,'negative C is opposite velocity direction, not negative mass');
assert.equal(movementVelocity({localBaseVelocity:4,c:10}),40);
assert.equal(movementVelocity({localBaseVelocity:4,c:-10}),-40);

console.log('11520 combat mass/C scale PASS: lot mass remains positive-scale; C is signed velocity ratio with 0 center, +C forward/multi direction and -C reverse/short direction');
