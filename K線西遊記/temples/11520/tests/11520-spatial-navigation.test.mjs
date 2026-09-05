import test from 'node:test';
import assert from 'node:assert/strict';
import {joystickToWorld,worldToNorthUpMap,northUpMapToWorld,bearingCardinal,parseHudXYZ,clampWorldPosition} from '../runtime/spatial-coordinate-runtime.mjs';
import {collectInspectableEntities,inspectMapPoint,waypointSummary} from '../runtime/map-object-navigation-runtime.mjs';

test('canonical camera zero: joystick up means world Z+',()=>{
  const v=joystickToWorld({nx:0,ny:1,camYaw:0});
  assert.ok(Math.abs(v.x)<1e-12);
  assert.ok(v.z>0);
});

test('canonical camera zero: joystick right means world X+',()=>{
  const v=joystickToWorld({nx:1,ny:0,camYaw:0});
  assert.ok(v.x>0);
  assert.ok(Math.abs(v.z)<1e-12);
});

test('north-up map renders Z+ upward and round-trips world coordinates',()=>{
  const view={centerX:0,centerZ:0,range:34,width:340,height:340};
  const p=worldToNorthUpMap({x:10,z:20},view);
  assert.ok(p.px>170);
  assert.ok(p.py<170);
  const w=northUpMapToWorld(p,view);
  assert.ok(Math.abs(w.x-10)<1e-9);
  assert.ok(Math.abs(w.z-20)<1e-9);
});

test('world bounds keep Y in canonical 0..40 range',()=>{
  assert.equal(clampWorldPosition({x:0,y:99,z:0}).y,40);
  assert.equal(clampWorldPosition({x:0,y:-1,z:0}).y,0);
});

test('HUD XYZ parser keeps Z sign instead of display mirroring',()=>{
  assert.deepEqual(parseHudXYZ('X -1.5 · Y 12 · Z 8.25'),{x:-1.5,y:12,z:8.25});
});

test('map click on known object inspects it before navigation',()=>{
  const entities=collectInspectableEntities({objects:[{id:'ATM-1',kind:'ATM',name:'行動 ATM 飛碟站',lifeId:'LIFE-ATM-1',x:8,y:0,z:5}],monsters:[]});
  const view={centerX:0,centerZ:0,range:34,width:340,height:340};
  const p=worldToNorthUpMap(entities[0],view);
  const hit=inspectMapPoint({px:p.px,py:p.py,view,entities});
  assert.equal(hit.kind,'ENTITY');
  assert.equal(hit.entity.lifeId,'LIFE-ATM-1');
});

test('map click on empty space returns waypoint and direction',()=>{
  const view={centerX:0,centerZ:0,range:34,width:340,height:340};
  const hit=inspectMapPoint({px:170,py:80,view,entities:[]});
  assert.equal(hit.kind,'WAYPOINT');
  assert.ok(hit.world.z>0);
  const summary=waypointSummary({x:0,z:0},hit.world);
  assert.equal(summary.direction,'N');
  assert.equal(bearingCardinal({x:0,z:0},{x:10,z:10}),'NE');
});
