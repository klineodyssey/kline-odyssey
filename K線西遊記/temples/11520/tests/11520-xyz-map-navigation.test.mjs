import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeWorldTarget3D,planePointToWorld,vectorToward3D,buildLocalNavigationPreview,resolveLocalNavigationStep,prepareLocalNavigationFrame,commitLocalNavigationFrame,setWorldTarget3D,startWorldNavigation3D,stopWorldNavigation3D,install11520XyzMapNavigation} from '../runtime/xyz-map-navigation-runtime.mjs';
import {advanceLocalMotionClock,integrateLocalMotion,gameUnitsToK} from '../runtime/spatial-coordinate-runtime.mjs';
import {readCanonicalDriveState} from '../runtime/combat-drive-adapter.mjs';

const origin=()=>({x:0,y:0,z:0});
const freeMove=(_from,next)=>({...next,blocked:false});
const near=(actual,expected,tolerance=1e-9)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected}`);
function withNavigation(fn){
  const keys=['document','Element','addEventListener','requestAnimationFrame','__K11520_3D_CONTROL__','__K11520_WORLD_COORDS__','__K11520_XYZ_MAP_NAV_INSTALLED__','__K11520_XYZ_MAP_NAVIGATION__','__K11520_XYZ_NAV_VECTOR__'];
  const saved=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)])),listeners=new Map(),windowListeners=new Map();let rafCalls=0;
  const add=(map,type,listener)=>map.set(type,[...(map.get(type)||[]),listener]);
  class Element{matches(){return false}closest(){return null}}
  const document={visibilityState:'visible',querySelector:()=>null,body:{appendChild(){}},createElement:()=>({remove(){},setAttribute(){}}),addEventListener:(type,listener)=>add(listeners,type,listener)};
  Object.assign(globalThis,{document,Element,addEventListener:(type,listener)=>add(windowListeners,type,listener),requestAnimationFrame:()=>{rafCalls++},__K11520_3D_CONTROL__:{mode:'XZ',vector:origin()},__K11520_WORLD_COORDS__:{physical:origin()}});
  delete globalThis.__K11520_XYZ_MAP_NAV_INSTALLED__;
  const emit=(map,type,event={})=>{for(const listener of map.get(type)||[])listener(event)};
  try{return fn({document,emit:(type,event)=>emit(listeners,type,event),emitWindow:(type,event)=>emit(windowListeners,type,event),rafCalls:()=>rafCalls,snapshot:()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__})}
  finally{stopWorldNavigation3D(null,{clearTarget:true});for(const [key,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key]}}
}
function startTarget(target={x:10,y:0,z:0},options={mode:'WORLD',source:'TEST'}){setWorldTarget3D(target,options);assert.equal(startWorldNavigation3D(),true);return prepareLocalNavigationFrame()}

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

test('local preview uses 3D distance and calibrated physical speed without a market mapping',()=>{
  const preview=buildLocalNavigationPreview({position:origin(),target:{x:3,y:4,z:12},speedKPerSecond:gameUnitsToK(2),marketPrice:100000});
  assert.equal(preview.distance,13);assert.equal(preview.distanceK,gameUnitsToK(13));near(preview.etaSeconds,6.5);assert.equal(preview.status,'ESTIMATE');assert.equal(preview.distanceSpace,'LOCAL_METERS');
  assert.equal(buildLocalNavigationPreview({position:origin(),target:{x:.1,y:.1,z:.1},speedKPerSecond:0}).etaSeconds,0);
});

test('ETA rejects missing, negative, nonfinite and underflow speeds without a false countdown',()=>{
  for(const speed of [null,undefined,0,-1,NaN,Infinity,'1',Number.MIN_VALUE]){
    const preview=buildLocalNavigationPreview({position:origin(),target:{x:10,y:0,z:0},speedKPerSecond:speed});
    assert.equal(preview.status,'WAIT',String(speed));assert.equal(preview.etaSeconds,null);
  }
  for(const point of [null,{x:NaN,y:0,z:0},{x:'0',y:0,z:0},{x:0,y:0}]){
    const preview=buildLocalNavigationPreview({position:point,target:origin(),speedKPerSecond:1});assert.equal(preview.status,'UNAVAILABLE');assert.equal(preview.distance,null);assert.equal(preview.etaSeconds,null);
  }
  assert.equal(buildLocalNavigationPreview({position:{x:-Number.MAX_VALUE,y:0,z:0},target:{x:Number.MAX_VALUE,y:0,z:0},speedKPerSecond:1}).status,'UNAVAILABLE');
});

test('one actor motion clock produces the same travel at 30, 60 and 120 frames per second',()=>{
  for(const fps of [30,60,120]){
    let clock=advanceLocalMotionClock(null,0,{ownerKey:'PLAYER_A'}),position=origin();
    for(let i=1;i<=fps*2;i++){
      clock=advanceLocalMotionClock(clock,i*1000/fps,{ownerKey:'PLAYER_A'});
      const result=integrateLocalMotion({position,vector:{x:.6,y:0,z:.8},elapsedSeconds:clock.elapsedSeconds,speedKPerSecond:gameUnitsToK(6),resolveMove:freeMove});
      assert.equal(result.blocked,false);position=result.position;
    }
    near(position.x,7.2);near(position.y,0);near(position.z,9.6);
  }
});

test('clock hides, suspension, backwards time and player changes discard elapsed time instead of catching up',()=>{
  let clock=advanceLocalMotionClock(null,100,{ownerKey:'A'});assert.equal(clock.elapsedSeconds,0);
  clock=advanceLocalMotionClock(clock,150,{ownerKey:'A'});near(clock.elapsedSeconds,.05);
  clock=advanceLocalMotionClock(clock,200,{ownerKey:'A',visible:false});assert.equal(clock.elapsedSeconds,0);
  clock=advanceLocalMotionClock(clock,20000,{ownerKey:'A'});assert.equal(clock.elapsedSeconds,0);
  clock=advanceLocalMotionClock(clock,20050,{ownerKey:'B'});assert.equal(clock.elapsedSeconds,0);
  clock=advanceLocalMotionClock(clock,20025,{ownerKey:'B'});assert.equal(clock.elapsedSeconds,0);
  clock=advanceLocalMotionClock(clock,21000,{ownerKey:'B'});assert.equal(clock.elapsedSeconds,0);
  clock=advanceLocalMotionClock(clock,21050,{ownerKey:'B'});near(clock.elapsedSeconds,.05);
});

test('canonical positive and negative C have equal target motion and never overshoot the destination',()=>{
  const results=[];
  for(const c of [1,-1]){
    const drive=readCanonicalDriveState({source:{ready:true,activeAxis:'KX',signedByAxis:{KX:c}}});assert.equal(drive.available,true);
    const result=integrateLocalMotion({position:origin(),target:{x:2,y:0,z:0},elapsedSeconds:.25,speedKPerSecond:drive.speedKPerSecond,resolveMove:freeMove});
    assert.equal(result.status,'ARRIVED');assert.deepEqual(result.position,{x:2,y:0,z:0});results.push(result.position);
    const still=integrateLocalMotion({position:result.position,target:{x:2,y:0,z:0},elapsedSeconds:.25,speedKPerSecond:drive.speedKPerSecond,resolveMove:freeMove});
    assert.equal(still.distanceMoved,0);assert.equal(still.status,'ARRIVED');
  }
  assert.deepEqual(results[0],results[1]);
});

test('swept collision commits only safe substeps and blocked navigation stops with no ETA',()=>withNavigation(({snapshot})=>{
  const frame=startTarget(),result=integrateLocalMotion({position:origin(),target:frame.target,elapsedSeconds:.25,speedKPerSecond:gameUnitsToK(6),resolveMove:(from,next)=>next.x>.5?{...from,blocked:true,blocker:{id:'WALL',name:'wall'}}:freeMove(from,next)});
  assert.equal(result.status,'BLOCKED');near(result.position.x,.5);near(result.distanceMoved,.5);assert.equal(result.substeps,3);
  assert.equal(commitLocalNavigationFrame(result,{frame,speedKPerSecond:gameUnitsToK(6)}),true);
  assert.equal(snapshot().active,false);assert.equal(snapshot().motionStatus,'BLOCKED');assert.equal(snapshot().etaStatus,'BLOCKED');assert.equal(snapshot().etaSeconds,null);assert.equal(prepareLocalNavigationFrame(),null);
}));

test('frame commits reject stale target, replay, stop and old-player preparation tokens',()=>withNavigation(({snapshot})=>{
  const result={position:{x:1,y:0,z:0},status:'MOVING',observedSpeedKPerSecond:gameUnitsToK(2)};
  const old=startTarget(),current=prepareLocalNavigationFrame();assert.equal(commitLocalNavigationFrame(result,{frame:old}),false);
  assert.equal(commitLocalNavigationFrame(result,{frame:current}),true);assert.equal(commitLocalNavigationFrame(result,{frame:current}),false);
  const beforeTarget=prepareLocalNavigationFrame();setWorldTarget3D({x:20,y:0,z:0});startWorldNavigation3D();assert.equal(commitLocalNavigationFrame(result,{frame:beforeTarget}),false);
  const beforePlayerChange=prepareLocalNavigationFrame();stopWorldNavigation3D(null,{clearTarget:true});assert.equal(commitLocalNavigationFrame(result,{frame:beforePlayerChange}),false);assert.equal(snapshot().target,null);assert.equal(startWorldNavigation3D(),false);
}));

test('navigation ETA follows observed motion and waits on reset, paused or detour results',()=>withNavigation(({snapshot})=>{
  let frame=startTarget();commitLocalNavigationFrame({position:{x:2,y:0,z:0},status:'MOVING',observedSpeedKPerSecond:gameUnitsToK(2)},{frame,speedKPerSecond:gameUnitsToK(6)});near(snapshot().etaSeconds,4);assert.equal(snapshot().etaStatus,'ESTIMATE');
  for(const result of [{status:'MOVING',observedSpeedKPerSecond:0},{status:'IDLE',observedSpeedKPerSecond:gameUnitsToK(6)},{status:'PAUSED',observedSpeedKPerSecond:0},{status:'DETOUR',detour:true,observedSpeedKPerSecond:gameUnitsToK(2)}]){
    frame=prepareLocalNavigationFrame();commitLocalNavigationFrame({position:{x:2,y:0,z:0},...result},{frame,speedKPerSecond:gameUnitsToK(6)});assert.equal(snapshot().etaSeconds,null);assert.equal(snapshot().active,true);
  }
  frame=prepareLocalNavigationFrame();commitLocalNavigationFrame({position:{x:10,y:0,z:0},status:'ARRIVED',observedSpeedKPerSecond:gameUnitsToK(2)},{frame,speedKPerSecond:gameUnitsToK(2)});assert.equal(snapshot().etaSeconds,0);assert.equal(snapshot().etaStatus,'ARRIVED');assert.equal(snapshot().active,false);
}));

test('invalid committed positions and false arrival fail closed instead of announcing arrival',()=>withNavigation(({snapshot})=>{
  let frame=startTarget();assert.equal(commitLocalNavigationFrame({position:{x:NaN,y:0,z:0},status:'MOVING'},{frame}),false);assert.equal(snapshot().motionStatus,'BLOCKED');assert.equal(snapshot().etaSeconds,null);
  frame=startTarget();assert.equal(commitLocalNavigationFrame({position:origin(),status:'ARRIVED'},{frame}),false);assert.equal(snapshot().motionStatus,'BLOCKED');assert.equal(snapshot().etaSeconds,null);
}));

test('XZ map detours reuse the collision resolver without extra displacement budget',()=>{
  const from=origin(),next={x:.25,y:0,z:0},calls=[];
  const result=resolveLocalNavigationStep(from,next,{mode:'XZ',source:'PLANE_MAP',resolveMove:(a,b)=>{calls.push({...b});return b.z<0?freeMove(a,b):{...a,blocked:true,blocker:{id:'TREE'}}}});
  assert.equal(calls.length,3);assert.equal(result.detour,true);near(Math.hypot(result.x,result.y,result.z),.25);assert.deepEqual(result,{x:0,y:0,z:-.25,blocked:false,detour:true});
});

test('invalid or truncated detours cannot bypass collision and non-map or vertical routes never detour',()=>{
  const from=origin(),next={x:.25,y:0,z:0},blocked={...from,blocked:true,blocker:{id:'WALL'}};
  for(const candidate of [{x:NaN,y:0,z:.25},{x:0,y:0,z:.1},{x:0,y:0,z:2},null]){
    let calls=0;const result=resolveLocalNavigationStep(from,next,{mode:'XZ',source:'PLANE_MAP',resolveMove:()=>++calls===1?blocked:candidate});assert.strictEqual(result,blocked);assert.equal(calls,3);
  }
  for(const [mode,source,target] of [['XY','PLANE_MAP',next],['YZ','PLANE_MAP',next],['XZ','WORLD',next],['XZ','PLANE_MAP',{x:.25,y:.1,z:0}]]){
    let calls=0;assert.strictEqual(resolveLocalNavigationStep(from,target,{mode,source,resolveMove:()=>{calls++;return blocked}}),blocked);assert.equal(calls,1);
  }
});

test('installed navigation has no private animation clock and hidden/pagehide invalidates pending motion',()=>withNavigation(({document,emit,emitWindow,rafCalls,snapshot})=>{
  install11520XyzMapNavigation();assert.equal(rafCalls(),0);
  let frame=startTarget();document.visibilityState='hidden';emit('visibilitychange');assert.equal(snapshot().active,false);assert.equal(snapshot().target,null);assert.equal(snapshot().etaSeconds,null);assert.equal(commitLocalNavigationFrame({position:{x:1,y:0,z:0},status:'MOVING'},{frame,speedKPerSecond:1}),false);
  document.visibilityState='visible';emit('visibilitychange');assert.equal(startWorldNavigation3D(),false);
  frame=startTarget();emitWindow('pagehide');assert.equal(snapshot().active,false);assert.equal(snapshot().target,null);assert.equal(commitLocalNavigationFrame({position:{x:1,y:0,z:0},status:'MOVING'},{frame,speedKPerSecond:1}),false);assert.equal(rafCalls(),0);
}));
