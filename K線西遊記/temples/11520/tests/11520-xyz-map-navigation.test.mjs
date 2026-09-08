import test from 'node:test';
import assert from 'node:assert/strict';
import {planePointToWorld,vectorToward3D} from '../runtime/xyz-map-navigation-runtime.mjs';

test('XY map changes X/Y and preserves Z depth',()=>{
  const p=planePointToWorld({px:75,py:25,width:100,height:100,center:{x:10,y:5,z:7},mode:'XY',range:20});
  assert.deepEqual(p,{x:20,y:15,z:7});
});

test('YZ map changes Y/Z and preserves X depth',()=>{
  const p=planePointToWorld({px:25,py:75,width:100,height:100,center:{x:9,y:10,z:-4},mode:'YZ',range:20});
  assert.deepEqual(p,{x:9,y:0,z:-14});
});

test('3D vector is normalized and arrival stops movement',()=>{
  const r=vectorToward3D({x:0,y:0,z:0},{x:3,y:4,z:0});
  assert.equal(r.arrived,false);assert.equal(r.distance,5);assert.deepEqual(r.vector,{x:.6,y:.8,z:0});
  const a=vectorToward3D({x:1,y:2,z:3},{x:1.1,y:2.1,z:3.1});
  assert.equal(a.arrived,true);assert.deepEqual(a.vector,{x:0,y:0,z:0});
});
