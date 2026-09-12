import assert from 'node:assert/strict';
import {driveMultiplier,scaledControlState} from '../runtime/combat-drive-live-runtime.mjs';

assert.equal(driveMultiplier(0),1,'0C keeps ordinary local walk speed');
assert.equal(driveMultiplier(.1),.1);
assert.equal(driveMultiplier(1),1,'1C is the light-speed/spot reference layer');
assert.equal(driveMultiplier(10),10);
assert.equal(driveMultiplier(100),100);

const source={mode:'XZ',vector:{x:1,y:-.5,z:.25}};
assert.deepEqual(scaledControlState(source,{c:0,lots:1,kaiosMass:1000}).vector,{x:1,y:-.5,z:.25});
assert.deepEqual(scaledControlState(source,{c:10,lots:3,kaiosMass:3000}).vector,{x:10,y:-5,z:2.5});
assert.deepEqual(source.vector,{x:1,y:-.5,z:.25},'source control state must not be mutated');

const negativeAxes=scaledControlState(
  {mode:'XZ',vector:{x:-1,y:0,z:-1}},
  {c:10,lots:1,kaiosMass:1000},
);
assert.deepEqual(negativeAxes.vector,{x:-10,y:0,z:-10},'negative XYZ remains signed and may cross zero along local physical axes');
assert.equal(negativeAxes.drive.signedXyzCoordinates,true);
assert.equal(negativeAxes.drive.zeroCrossingAllowed,true);
assert.equal(negativeAxes.drive.negativeCoordinateMeaning,'NEGATIVE_XYZ_AXIS');
assert.equal(negativeAxes.drive.mirrorUniverseCoupling,'SEPARATE_K_DIRECTION_ONLY');

const deepNegativeAxes=scaledControlState(
  {mode:'XYZ',vector:{x:-12.5,y:-0.25,z:-40}},
  {c:100,lots:2,kaiosMass:2000},
);
assert.deepEqual(
  deepNegativeAxes.vector,
  {x:-1250,y:-25,z:-4000},
  'signed local XYZ coordinates are not clamped at zero regardless of negative magnitude',
);

console.log('11520 live drive bridge PASS: C scales signed XYZ intent; zero crossing is legal; negative coordinates stay on signed local XYZ axes while K mirror semantics remain separate; lots/KAIOS remain metadata; source control state is not mutated');