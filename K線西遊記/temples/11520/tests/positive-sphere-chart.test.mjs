import test from 'node:test';
import assert from 'node:assert/strict';
import {sphereMetrics,crossSectionAtZ,validatePositiveSphere,toLocalCartesian,fromLocalCartesian,moveOnXY,moveElevatorZ,toLegacyLocalWorld,fromLegacyLocalWorld,distanceInLocalWorld,K280_RADIUS_METERS} from '../runtime/positive-sphere-chart.mjs';

const R=100, near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('K280 index calibrates to physical radius',()=>{near(K280_RADIUS_METERS,280*(384400/16888)*1000)});
test('canonical circle and sphere formulas',()=>{const m=sphereMetrics(2);near(m.circumferenceMeters,4*Math.PI);near(m.crossSectionAreaM2,4*Math.PI);near(m.surfaceAreaM2,16*Math.PI);near(m.volumeM3,32*Math.PI/3)});
test('Z=0 center plane maximum, Z=R tip zero cross section',()=>{near(crossSectionAtZ(0,R).radiusMeters,R);near(crossSectionAtZ(0,R).areaM2,Math.PI*R*R);near(crossSectionAtZ(R,R).radiusMeters,0);near(crossSectionAtZ(60,R).radiusMeters,80)});
test('positive chart rejects mirror-like negative and out-of-sphere points',()=>{assert.deepEqual(validatePositiveSphere({x:0,y:0,z:0},R),{x:0,y:0,z:0});for(const p of [{x:-1,y:0,z:0},{x:0,y:-1,z:0},{x:0,y:0,z:-1},{x:0,y:0,z:101},{x:90,y:0,z:60}])assert.throws(()=>validatePositiveSphere(p,R),RangeError)});
test('XY move holds Z, and boundary blocks instead of crossing',()=>{const start={x:20,y:0,z:60};const ok=moveOnXY(start,{northMeters:10},R);assert.equal(ok.ok,true);near(ok.position.z,60);const blocked=moveOnXY(start,{eastMeters:80},R);assert.equal(blocked.blocked,true);assert.deepEqual(blocked.position,start)});
test('elevator holds XY, changes only Z, cannot cross narrowing slice',()=>{const start={x:20,y:0,z:0};const ok=moveElevatorZ(start,60,R);assert.equal(ok.ok,true);near(ok.position.x,20);near(ok.position.y,0);near(ok.position.z,60);const block=moveElevatorZ(start,100,R);assert.equal(block.blocked,true);const negative=moveElevatorZ(start,-1,R);assert.equal(negative.blocked,true)});
test('legacy Cartesian conversion roundtrip and combat distance',()=>{const a={x:20,y:Math.PI/2,z:60},b={x:30,y:Math.PI/2,z:60};const old=toLegacyLocalWorld(a,R);near(old.x,0);near(old.y,60);near(old.z,20);const again=fromLegacyLocalWorld(old,R);near(again.x,a.x);near(again.y,a.y);near(again.z,a.z);near(distanceInLocalWorld(a,b,R),10)});
