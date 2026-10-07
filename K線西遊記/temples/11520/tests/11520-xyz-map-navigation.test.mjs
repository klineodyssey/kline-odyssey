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

test('existing airborne local movement remains unbounded above the ground collision zone',()=>{
  const main=fs.readFileSync(new URL('../runtime/game-5d-main.mjs',import.meta.url),'utf8'),fn=main.slice(main.indexOf('function resolveLocalPlayerStep('),main.indexOf('function moveManual('));
  const context=vm.createContext({resolvePlayerMove:()=>{throw Error('airborne movement must not acquire the ground-only bounds')}});vm.runInContext(fn,context);
  const result=vm.runInContext('resolveLocalPlayerStep({x:80,y:42,z:0},{x:81,y:43,z:0})',context);
  assert.deepEqual({...result},{x:81,y:43,z:0,blocked:false});
});

import {resolvePlayerMove} from '../runtime/world-runtime.mjs';
test('restored exterior player recovers inward or upward without clamping teleport',()=>{
  const origin={x:210,y:.013172,z:186};
  const resolver=(from,next)=>from.y<4||next.y<4?resolvePlayerMove(from,next,{allowBoundsRecovery:true}):freeMove(from,next);
  const move=(position,vector)=>integrateLocalMotion({position,vector,elapsedSeconds:1/60,speedKPerSecond:.001,resolveMove:resolver});
  const inward=move(origin,{x:-1,y:0,z:0});assert.ok(inward.position.x<210&&inward.position.x>209);assert.equal(inward.blocked,false);
  const outward=move(origin,{x:1,y:0,z:0});assert.deepEqual(outward.position,origin);assert.equal(outward.blocked,true);
  let p=origin;for(let i=0;i<15;i++){const result=move(p,{x:0,y:1,z:0});assert.equal(result.blocked,false);p=result.position}
  assert.ok(p.y>4);near(p.x,210);near(p.z,186);
  const inbound=move({x:60.1,y:0,z:0},{x:-1,y:0,z:0});assert.ok(inbound.position.x<60);assert.equal(inbound.blocked,false);
  const collision=resolvePlayerMove({x:8,y:0,z:2.9},{x:8,y:0,z:3.4},{allowBoundsRecovery:true});assert.equal(collision.blocked,true,'opt-in recovery cannot bypass existing object collision');
});

test('actual waypoint owner publishes pause, cancellation, arrival and player-clear states without stale ETA',()=>{
  const source=fs.readFileSync(new URL('../runtime/xyz-map-navigation-runtime.mjs',import.meta.url),'utf8').replace(/^import .*;$/m,'').replaceAll('export function ','function ');
  const document={querySelector:()=>null,createElement:()=>({remove(){},setAttribute(){}}),body:{appendChild(){}}};
  const context=vm.createContext({document,gameUnitsToK,formatGameDistanceK:String});vm.runInContext(source,context);
  vm.runInContext("setWorldTarget3D({x:10,y:0,z:0});startWorldNavigation3D();commitLocalNavigationFrame({position:{x:0,y:0,z:0},status:'PAUSED',blocked:false},{speedKPerSecond:0})",context);
  assert.equal(context.__K11520_XYZ_MAP_NAVIGATION__.etaStatus,'PAUSED');assert.equal(context.__K11520_XYZ_MAP_NAVIGATION__.etaSeconds,null);
  vm.runInContext("commitLocalNavigationFrame({position:{x:1,y:0,z:0},status:'MOVING',blocked:false},{speedKPerSecond:.001});stopWorldNavigation3D()",context);
  assert.equal(context.__K11520_XYZ_MAP_NAVIGATION__.etaStatus,'CANCELLED');assert.equal(context.__K11520_XYZ_MAP_NAVIGATION__.etaSeconds,null);assert.equal(context.__K11520_XYZ_MAP_NAVIGATION__.active,false);
  vm.runInContext("startWorldNavigation3D();commitLocalNavigationFrame({position:{x:10,y:0,z:0},status:'ARRIVED',blocked:false},{speedKPerSecond:.001})",context);
  assert.equal(context.__K11520_XYZ_MAP_NAVIGATION__.etaStatus,'ARRIVED');assert.equal(context.__K11520_XYZ_MAP_NAVIGATION__.etaSeconds,0);
  vm.runInContext("stopWorldNavigation3D(null,{clearTarget:true})",context);assert.equal(context.__K11520_XYZ_MAP_NAVIGATION__.target,null);
});

import {resolveLocalNavigationStep} from '../runtime/xyz-map-navigation-runtime.mjs';
test('preserved XZ obstacle detour reaches the ATM-crossing target with one clock and budget',()=>{
  let position={x:4,y:0,z:5},detours=0,total=0;const target={x:12,y:0,z:5};
  const resolver=(from,next)=>resolvePlayerMove(from,next,{allowBoundsRecovery:true});
  for(let i=0;i<900;i++){
    const motion=integrateLocalMotion({position,target,elapsedSeconds:1/60,speedKPerSecond:.0001,resolveMove:(from,next)=>resolveLocalNavigationStep(from,next,{mode:'XZ',source:'PLANE_MAP',resolveMove:resolver})});
    assert.equal(motion.blocked,false);assert.ok(motion.distanceMovedK<=.0001/60+1e-12,'detour may not spend extra movement budget');
    position=motion.position;total+=motion.distanceMoved;detours+=Number(motion.detour);if(motion.status==='ARRIVED')break;
  }
  assert.ok(detours>0,'actual ATM collision must exercise the preserved sidestep');near(position.x,target.x);near(position.z,target.z);assert.ok(total>8);
  const outside=resolveLocalNavigationStep({x:210,y:0,z:186},{x:210.2,y:0,z:186},{mode:'XZ',source:'PLANE_MAP',resolveMove:resolver});assert.equal(outside.blocked,true,'detour cannot bypass recovery direction policy');
});

test('world collision default callers retain their original result shape and bounds behavior',()=>{
  assert.deepEqual(resolvePlayerMove({x:0,y:0,z:0},{x:1,y:0,z:0}),{x:1,y:0,z:0,blocked:false,blocker:null});
  assert.deepEqual(resolvePlayerMove({x:210,y:0,z:186},{x:209,y:0,z:186}),{x:60,y:0,z:60,blocked:false,blocker:null});
});
