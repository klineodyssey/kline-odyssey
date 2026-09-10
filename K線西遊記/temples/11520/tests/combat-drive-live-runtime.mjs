import assert from 'node:assert/strict';
import {driveMultiplier,scaledControlState,clampVectorToNonnegativeWorld} from '../runtime/combat-drive-live-runtime.mjs';

assert.equal(driveMultiplier(0),1,'0C keeps ordinary local walk speed');
assert.equal(driveMultiplier(.1),.1);
assert.equal(driveMultiplier(1),1,'1C is the light-speed/spot reference layer');
assert.equal(driveMultiplier(10),10);
assert.equal(driveMultiplier(100),100);

const source={mode:'XZ',vector:{x:1,y:-.5,z:.25}};
assert.deepEqual(scaledControlState(source,{c:0,lots:1,kaiosMass:1000}).vector,{x:1,y:-.5,z:.25});
assert.deepEqual(scaledControlState(source,{c:10,lots:3,kaiosMass:3000}).vector,{x:10,y:-5,z:2.5});
assert.deepEqual(source.vector,{x:1,y:-.5,z:.25},'source control state must not be mutated');

assert.deepEqual(
  clampVectorToNonnegativeWorld({x:-1,y:-2,z:-3},{x:10,y:20,z:30},.1),
  {x:-1,y:-2,z:-3},
  'negative movement direction remains legal while the absolute coordinate stays above zero',
);
assert.deepEqual(
  clampVectorToNonnegativeWorld({x:-4,y:-2,z:-10},{x:.2,y:.1,z:.25},.1),
  {x:-2,y:-1,z:-2.5},
  'a negative-direction step is shortened exactly at the zero coordinate boundary',
);
const bounded=scaledControlState({mode:'XZ',vector:{x:-1,y:0,z:-1}},{c:10,lots:1,kaiosMass:1000},{physical:{x:.25,y:0,z:.4}}).vector;
assert.deepEqual(bounded,{x:-2.5,y:0,z:-4},'10C negative direction must not overshoot the nonnegative XYZ floor');

console.log('11520 live drive bridge PASS: C scales XYZ intent; negative direction is preserved; absolute XYZ cannot step below zero; lots/KAIOS remain metadata; source market/control state is not mutated');
