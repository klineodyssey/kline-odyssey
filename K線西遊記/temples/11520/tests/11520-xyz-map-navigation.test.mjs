import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeWorldTarget3D,planePointToWorld,vectorToward3D} from '../runtime/xyz-map-navigation-runtime.mjs';

test('world target keeps all XYZ coordinates and clamps only below-ground Y',()=>{
  assert.deepEqual(normalizeWorldTarget3D({x:12.5,y:8.25,z:-3.75}),{x:12.5,y:8.25,z:-3.75});
  assert.deepEqual(normalizeWorldTarget3D({x:2,y:-9,z:4}),{x:2,y:0,z:4});
});

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

import {advanceLocalMotionClock,integrateLocalMotion,gameUnitsToK} from '../runtime/spatial-coordinate-runtime.mjs';
import {readCanonicalDriveState} from '../runtime/combat-drive-adapter.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
const freeMove=(_from,next)=>({...next,blocked:false});
const speed=c=>readCanonicalDriveState({source:{ready:true,activeAxis:'KX',signedByAxis:{KX:c}},activeAxis:'KX'}).speedKPerSecond;
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-10,`${actual} != ${expected}`);

for(const c of [0,.001,-.001,.1,-.1,1,-1,100,-100])test(`strict shared C ${c} supplies physical magnitude without changing its sign`,()=>{
  near(speed(c),Math.abs(c)*.001);
});
test('missing, invalid or wrong-axis C cannot fall back to DOM or implicit walking',()=>{
  for(const source of [null,{}, {ready:true,activeAxis:'KY',signedByAxis:{KX:1}}, {ready:true,activeAxis:'KX',signedByAxis:{KX:'1'}}, {ready:true,activeAxis:'KX',signedByAxis:{KX:3}}]){
    const r=readCanonicalDriveState({source,activeAxis:'KX'});assert.equal(r.available,false);assert.equal(r.speedKPerSecond,null);
  }
});
for(const fps of [30,60,120])for(const c of [1,-1,.1])test(`${fps} FPS actual local displacement is .001K/s per 1C at ${c}C`,()=>{
  let p={x:0,y:0,z:0},clock=null;
  for(let i=0;i<=fps;i++){
    clock=advanceLocalMotionClock(clock,i*1000/fps,{ownerKey:'player-a'});
    p=integrateLocalMotion({position:p,vector:{x:1,y:0,z:0},elapsedSeconds:clock.elapsedSeconds,speedKPerSecond:speed(c),resolveMove:freeMove}).position;
  }
  near(gameUnitsToK(p.x),Math.abs(c)*.001);near(p.y,0);near(p.z,0);
});
test('C0 pauses manual movement and routes with unchanged target/position',()=>{
  const p={x:1,y:2,z:3};for(const target of [null,{x:5,y:2,z:3}]){
    const r=integrateLocalMotion({position:p,vector:{x:1,y:0,z:0},target,elapsedSeconds:.1,speedKPerSecond:0,resolveMove:()=>{throw Error('C0 must not collide or move')}});
    assert.equal(r.status,'PAUSED');assert.deepEqual(r.position,p);assert.equal(r.distanceMovedK,0);
  }
});
test('clock excludes hidden/resumed time, owner changes and suspended frames',()=>{
  let c=advanceLocalMotionClock(null,0,{ownerKey:'a'});assert.equal(c.elapsedSeconds,0);
  c=advanceLocalMotionClock(c,100,{ownerKey:'a'});near(c.elapsedSeconds,.1);
  c=advanceLocalMotionClock(c,200,{visible:false,ownerKey:'a'});assert.equal(c.elapsedSeconds,0);
  c=advanceLocalMotionClock(c,5000,{ownerKey:'a'});assert.equal(c.elapsedSeconds,0);
  c=advanceLocalMotionClock(c,5100,{ownerKey:'a'});near(c.elapsedSeconds,.1);
  c=advanceLocalMotionClock(c,5200,{ownerKey:'b'});assert.equal(c.elapsedSeconds,0);
  c=advanceLocalMotionClock(c,9000,{ownerKey:'b'});assert.equal(c.elapsedSeconds,0);
});
test('diagonal input cannot exceed the shared speed budget and target cannot overshoot',()=>{
  const r=integrateLocalMotion({position:{x:0,y:0,z:0},vector:{x:1,y:1,z:1},elapsedSeconds:.1,speedKPerSecond:.001,resolveMove:freeMove});
  near(r.distanceMovedK,.0001);
  const a=integrateLocalMotion({position:{x:0,y:0,z:0},target:{x:.05,y:0,z:0},elapsedSeconds:.1,speedKPerSecond:.1,resolveMove:freeMove});
  assert.equal(a.status,'ARRIVED');near(a.position.x,.05);
});
test('high C sweeps cannot tunnel; only resolved coordinates commit at boundaries',()=>{
  let maxStep=0;
  const r=integrateLocalMotion({position:{x:0,y:0,z:0},vector:{x:1,y:0,z:0},elapsedSeconds:.1,speedKPerSecond:.1,resolveMove:(from,next)=>{
    maxStep=Math.max(maxStep,next.x-from.x);return next.x>=1?{...from,blocked:true,blocker:{name:'OBSTACLE'}}:freeMove(from,next);
  }});
  assert.equal(r.status,'BLOCKED');assert.ok(r.position.x<1);assert.ok(maxStep<=.25+1e-10);
  const b=integrateLocalMotion({position:{x:0,y:0,z:0},vector:{x:1,y:0,z:0},elapsedSeconds:.1,speedKPerSecond:.001,resolveMove:(_from,next)=>({...next,x:Math.min(.6,next.x),blocked:false})});
  near(b.position.x,.6);near(b.distanceMovedK,gameUnitsToK(.6));assert.equal(b.blocker.name,'WORLD_BOUNDARY');
});
test('actual main movement owner commits shared-C displacement and camera state cannot alter it',()=>{
  const main=fs.readFileSync(new URL('../runtime/game-5d-main.mjs',import.meta.url),'utf8');
  const owner=main.slice(main.indexOf('function resolveLocalPlayerStep('),main.indexOf('function setWaypoint('));
  const signed={ready:true,activeAxis:'KX',signedByAxis:{KX:1}},state={axis:'KX',xyz:{x:0,y:5,z:0},intentXYZ:{x:0,y:5,z:0},heading:0,camYaw:2},collision={};
  const context=vm.createContext({S:state,playerMotionClock:{},playerHomeFraming:false,playerLife:{activePlayer:()=>({playerId:'a'})},syncTradeAxisFromPlane:()=>{},readCanonicalDriveState:o=>readCanonicalDriveState({...o,source:signed}),prepareLocalNavigationFrame:()=>null,commitLocalNavigationFrame:()=>{},controlVector:()=>({x:1,y:0,z:0}),integrateLocalMotion,resolvePlayerMove:freeMove,clampWorldPosition:p=>p,worldHeading:v=>Math.atan2(v.x,v.z),$:()=>collision});
  vm.runInContext(owner,context);vm.runInContext('moveManual(.1)',context);near(gameUnitsToK(state.xyz.x),.0001);near(state.xyz.y,5);
  state.camYaw=-2;vm.runInContext('moveManual(.1)',context);near(gameUnitsToK(state.xyz.x),.0002);
  signed.signedByAxis.KX=0;const stopped={...state.xyz};vm.runInContext('moveManual(.1)',context);assert.deepEqual({...state.xyz},stopped);
  assert.ok(main.includes('avatar.position.set(S.xyz.x,S.xyz.y,S.xyz.z)'),'existing actual actor render must follow committed coordinates');
  assert.ok(!main.includes('const speed=.10'));assert.ok(!main.includes('S.navActive'));
});
