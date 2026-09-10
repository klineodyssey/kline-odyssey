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

console.log('11520 live drive bridge PASS: C scales XYZ intent; lots/KAIOS remain metadata; source market/control state is not mutated');
