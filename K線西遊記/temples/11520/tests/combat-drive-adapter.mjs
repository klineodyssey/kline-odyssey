import assert from 'node:assert/strict';
import {buildDriveState,parseCRead,parseLotsRead,scaleXyzVector} from '../runtime/combat-drive-adapter.mjs';

assert.equal(parseCRead('0C'),0);
assert.equal(parseCRead('1C'),1);
assert.equal(parseCRead('10C'),10);
assert.equal(parseLotsRead('1口'),1);
assert.equal(parseLotsRead('3口'),3);

const walk=buildDriveState({c:0,lots:1,localBaseVelocity:.1});
assert.equal(walk.cMode,'LOCAL_WALK');
assert.equal(walk.xyzStep,.1);
assert.equal(walk.kgenEquivalent,1);
assert.equal(walk.kaiosMass,1000);
assert.equal(walk.kgMass,1000);

const spot=buildDriveState({c:1,lots:2,localBaseVelocity:.1});
assert.equal(spot.cMode,'LIGHT_SPEED_SPOT');
assert.equal(spot.xyzStep,.1);
assert.equal(spot.kaiosMass,2000);

const warp=buildDriveState({c:10,lots:3,localBaseVelocity:.1});
assert.equal(warp.cMode,'SUPERLUMINAL_WARP');
assert.equal(warp.xyzStep,1);
assert.deepEqual(scaleXyzVector({x:1,y:-.5,z:.25},warp),{x:1,y:-.5,z:.25});

console.log('11520 combat drive adapter PASS: C maps movement regime; lots map 1 KGEN = 1000 KAIOS mass; no asset mutation');
