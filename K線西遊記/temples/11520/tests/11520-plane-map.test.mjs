import test from 'node:test';
import assert from 'node:assert/strict';
import {planeSpec,projectPlanePoint} from '../runtime/plane-map-runtime.mjs';

test('plane specs follow controller and normal-axis canon',()=>{
  assert.deepEqual(planeSpec('XZ'),{h:'X',v:'Z',depth:'Y',normal:'KY'});
  assert.deepEqual(planeSpec('XY'),{h:'X',v:'Y',depth:'Z',normal:'KZ'});
  assert.deepEqual(planeSpec('YZ'),{h:'Y',v:'Z',depth:'X',normal:'KX'});
});

test('XY projects X/Y and preserves Z as signed depth',()=>{
  const p=projectPlanePoint({x:10,y:5,z:-7},{x:0,y:0,z:-2},'XY',{width:100,height:100,range:10});
  assert.equal(p.px,100);
  assert.equal(p.py,25);
  assert.equal(p.depth,-5);
  assert.equal(p.depthAxis,'Z');
});

test('YZ projects Y/Z and preserves X as signed depth',()=>{
  const p=projectPlanePoint({x:9,y:-4,z:6},{x:4,y:-4,z:1},'YZ',{width:120,height:80,range:10});
  assert.equal(p.px,60);
  assert.equal(p.py,20);
  assert.equal(p.depth,5);
  assert.equal(p.depthAxis,'X');
});
