import test from 'node:test';
import assert from 'node:assert/strict';
import {planeSpec,projectPlanePoint,kSpaceMapModel,kSpaceMapDetails,projectKSpaceMap,projectMarketKMap} from '../runtime/plane-map-runtime.mjs';
import {gameUnitsToK,formatGameDistanceK} from '../runtime/spatial-coordinate-runtime.mjs';

test('market overview fits all three axis intercepts and player/target in every plane',()=>{
  const playerK={KX:-18.815,KY:-34.2115,KZ:27.9667};
  const market={status:'LIVE',markets:['KX','KY','KZ'].map(axis=>({axis,point:Object.fromEntries(['KX','KY','KZ'].map(a=>[a,a===axis?playerK[a]:0]))}))};
  for(const plane of ['XZ','XY','YZ'])for(const [width,height] of [[106,80],[340,180]]){
    const model=kSpaceMapModel({playerK,monsterK:{...playerK,KZ:playerK.KZ+1},target:{id:'guardian'},market,selection:{sign:-1}},plane),p=projectMarketKMap(model,width,height);
    for(const v of [p.origin,p.player,p.monster,...market.markets.map(m=>p.point(m.point))])assert.ok(v.x>=0&&v.x<=width&&v.y>=0&&v.y<=height,JSON.stringify(v));
    assert.notDeepEqual(p.player,p.monster,'overview retains depth instead of flattening third axis');
  }
});

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

const sample={playerK:{KX:1,KY:-.5,KZ:1},monsterK:{KX:1,KY:-.5,KZ:2},playerLocal:{x:31,y:0,z:3},target:{id:'guardian'},selection:{sign:1}};
test('K map uses only normalized snapshot K, not local XYZ or world attack distance',()=>{
  const m=kSpaceMapModel({...sample,distance:900},'YZ');
  assert.equal(m.phase,'KX+');assert.equal(m.h,'KY');assert.equal(m.v,'KZ');
  assert.deepEqual(m.delta,{KX:0,KY:0,KZ:1});assert.equal(m.distance,1);
  assert.deepEqual(m.player,sample.playerK);assert.equal(m.local.x,31);
  assert.equal(kSpaceMapModel({...sample,selection:{sign:-1}},'XZ').phase,'KY−');
  assert.equal(kSpaceMapModel({...sample,selection:{sign:0}},'XY').phase,'KZ0');
});
test('depth rail preserves a monster coincident in XY projection without fake planar displacement',()=>{
  const m=kSpaceMapModel(sample,'XY'),p=projectKSpaceMap(m,104,80);
  assert.deepEqual(p.player,p.monster);assert.notEqual(p.depthPlayer,p.depthMonster);
});
test('target change and missing target cannot reuse stale marker/delta',()=>{
  const next=kSpaceMapModel({...sample,target:{id:'next'},monsterK:{KX:4,KY:1,KZ:1}},'YZ');
  assert.equal(next.targetId,'next');assert.deepEqual(next.delta,{KX:3,KY:1.5,KZ:0});
  const missing=kSpaceMapModel({...sample,target:null},'YZ');
  assert.equal(missing.monster,null);assert.equal(missing.delta,null);assert.equal(missing.distance,null);
  assert.equal(kSpaceMapModel({...sample,playerK:{KX:NaN,KY:0,KZ:0}}),null);
});

test('local physical distances and XYZ K never reuse market-normalized delta',()=>{
  const m=kSpaceMapModel({...sample,distance:900},'YZ');
  assert.equal(m.distance,1);
  assert.equal(m.localDistance,900);
  assert.equal(m.localDistanceK,gameUnitsToK(900));
  assert.equal(m.localK.x,gameUnitsToK(31));
  assert.equal(m.marketPhysicalTransform,'NOT_CONFIGURED');
  const text=kSpaceMapDetails(m);
  assert.match(text,/NORM DIST: 1.00 norm/);
  assert.ok(text.includes(`LOCAL DIST: ${formatGameDistanceK(900,{detail:true})}`));
  assert.ok(text.includes(`LOCAL XYZ K: X ${formatGameDistanceK(31,{detail:true})}`));
  assert.match(text,/市場 → 物理距離轉換：未設定/);
  assert.doesNotMatch(text,/\bKu\b/);
  const missing=kSpaceMapModel({...sample,target:null,distance:900});
  assert.equal(missing.localDistance,null);
  assert.equal(missing.localDistanceK,null);
  assert.match(kSpaceMapDetails(missing),/LOCAL DIST: —/);
});
