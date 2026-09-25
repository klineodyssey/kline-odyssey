import assert from 'node:assert/strict';
import {K11520_COMBAT_SCALE,K11520_C_LEVELS,lotMass,combatExposure,normalizeC,cMode,movementVelocity,scaleInvariant} from '../runtime/combat-mass-scale-runtime.mjs';
import {C_ABS_DETENTS,C_DETENTS,C_ABS_TRAVEL,isCanonicalC,requireCanonicalC,snapCanonicalC,cFromSignedTravel,signedTravelFromC,formatSignedC} from '../controls/nonlinear-controls.mjs';

assert.equal(scaleInvariant(),true);
assert.deepEqual(lotMass(1),{lots:1,kgenEquivalent:1,indexUnits:1,kaiosMass:1000,kgMass:1000});
assert.deepEqual(lotMass(3),{lots:3,kgenEquivalent:3,indexUnits:3,kaiosMass:3000,kgMass:3000});
assert.equal(K11520_COMBAT_SCALE.kaiosPerKgen,1000);
assert.equal(combatExposure({lots:2,playerKaiosAvailable:2500}).exposedKaios,2000);
assert.equal(combatExposure({lots:2,playerKaiosAvailable:1500}).exposedKaios,1500);
assert.equal(combatExposure({lots:2,playerKaiosAvailable:1500}).fullyBacked,false);
assert.deepEqual(K11520_C_LEVELS,C_DETENTS);
assert.deepEqual(C_ABS_DETENTS,[0,.001,.01,.1,1,...Array.from({length:20},(_,i)=>(i+1)*5)]);
for(const c of C_DETENTS){assert.equal(requireCanonicalC(c),c);assert.equal(normalizeC(c),c);assert.equal(cFromSignedTravel(signedTravelFromC(c)),c);assert.equal(snapCanonicalC(c),c);}
for(const c of [100.001,-100.001,1000,-1000,.0001,17.382,99.6,NaN,Infinity,null,'',true,[1],{valueOf:()=>1}]){assert.equal(isCanonicalC(c),false);assert.throws(()=>requireCanonicalC(c),/INVALID_C_DETENT/);}
assert.equal(isCanonicalC(0,{allowZero:false}),false);
assert.equal(Object.is(requireCanonicalC(-0),-0),false);
assert.equal(Object.is(snapCanonicalC(-0.00001),-0),false);
assert.equal(snapCanonicalC(17),15);assert.equal(snapCanonicalC(17.5),15);assert.equal(snapCanonicalC(-17.5),-15);assert.equal(snapCanonicalC(99.6),100);
assert.equal(snapCanonicalC(.0005),0);assert.equal(snapCanonicalC(.00051),.001);
assert.equal(snapCanonicalC(.005),.001);assert.equal(snapCanonicalC(.006),.01);
assert.equal(snapCanonicalC(100.001),null);
assert.equal(cFromSignedTravel(.06),0);assert.equal(cFromSignedTravel(-.06),0);
assert.equal(C_ABS_TRAVEL[4],.5,'half of each rail side belongs to low-C precision');
assert.ok(C_ABS_TRAVEL[1]>.1,'minimum nonzero C must not be squeezed against zero');
assert.equal(formatSignedC(.001),'+0.001C');assert.equal(formatSignedC(-.01),'-0.01C');assert.equal(formatSignedC(-0),'0C');
assert.equal(normalizeC(0),0);
assert.equal(normalizeC(0.001),0.001);
assert.equal(normalizeC(-0.001),-0.001);
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
