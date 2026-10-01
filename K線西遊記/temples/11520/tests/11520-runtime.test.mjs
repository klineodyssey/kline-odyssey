import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveCMode,requireV1TradingC} from '../controls/nonlinear-controls.mjs';
import {createSimulationPlayerStore,createPlayerScopedStorage,PLAYER_SESSION_KEY} from '../runtime/evm-wallet-runtime.mjs';
import {createKgenLedger} from '../runtime/kgen-margin-runtime.mjs';
import {createExecutionAdapter} from '../runtime/real-trading-order-intent.mjs';
import {createJourneyTutorial} from '../runtime/world-runtime.mjs';

test('Player Life namespaces isolate identical wallet, guest session and first-owner migration',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  const a='KAIOS-P-11111111-1111-4111-8111-111111111111',b='KAIOS-P-22222222-2222-4222-8222-222222222222';
  storage.setItem(PLAYER_SESSION_KEY,'legacy-XYZ');
  const as=createPlayerScopedStorage(storage,a),bs=createPlayerScopedStorage(storage,b);
  assert.equal(as.getItem(PLAYER_SESSION_KEY),'legacy-XYZ');assert.equal(bs.getItem(PLAYER_SESSION_KEY),null);
  as.setItem('11520.backpack.v1','A-only');assert.equal(bs.getItem('11520.backpack.v1'),null);
  const wa='0x'+'a'.repeat(40),sa=createSimulationPlayerStore({ledger:createKgenLedger(),storage,playerId:a}),sb=createSimulationPlayerStore({ledger:createKgenLedger(),storage,playerId:b});
  sa.activate(wa);sa.record('LOOT_DROP',{reward:5});sb.activate(wa);
  assert.equal(sa.snapshot().kaios,5);assert.equal(sb.snapshot().kaios,0);assert.equal(sb.snapshot().claimableKaios,0);
  assert.throws(()=>createPlayerScopedStorage(storage,'guest'),/INVALID_PLAYER_ID/);
  const unavailable=createSimulationPlayerStore({ledger:createKgenLedger(),storage:null,playerId:a});unavailable.activate(null);
  assert.equal(unavailable.snapshot().persistent,false);
});

test('journey tutorial follows actual play, survives reload and never grants rewards or trades',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
  const t=createJourneyTutorial({storage});assert.equal(t.snapshot().stage,'MOVE');
  assert.equal(createJourneyTutorial({storage,returning:true}).snapshot().stage,'MOVE','reload before moving preserves the first lesson');
  t.event('LOOT');t.event('PREVIEW',{c:.001});assert.equal(t.snapshot().stage,'MOVE');
  t.event('MOVE',{distance:1});assert.equal(t.snapshot().stage,'MOVE');
  t.event('MOVE',{distance:2});t.event('HIT');t.event('LOOT');assert.equal(t.snapshot().stage,'PHASE');
  t.event('CONTROL',{plane:'XZ',c:100});t.event('CONTROL',{plane:'YZ',c:-100});assert.equal(t.snapshot().stage,'PHASE');
  t.event('CONTROL',{plane:'XZ',c:.001});t.event('CONTROL',{plane:'YZ',c:-.001});assert.equal(t.snapshot().stage,'PREVIEW');
  const restored=createJourneyTutorial({storage,returning:true});assert.equal(restored.snapshot().stage,'PREVIEW');
  restored.event('PREVIEW',{c:100});assert.equal(restored.snapshot().complete,false);
  restored.event('PREVIEW',{c:.001});assert.equal(restored.snapshot().complete,true);
  restored.replay();assert.equal(restored.snapshot().stage,'MOVE');restored.skip();assert.equal(restored.snapshot().complete,true);
  assert.equal(createJourneyTutorial({storage:null,returning:true}).snapshot().complete,true);
  const blocked=createJourneyTutorial({storage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}});
  blocked.event('MOVE',{distance:3});assert.equal(blocked.snapshot().stage,'HIT');
  assert.equal(blocked.snapshot().scope,'LOCAL_TUTORIAL_NO_REWARD');
});

test('V1 magnitude mode preserves short direction, zero journey and high-C production lock',()=>{
  for(const c of [0,.0009,-.0009])assert.equal(resolveCMode(c).mode,'MONSTER_MODE');
  for(const c of [.001,.01,.1,1,-.001,-.01,-.1,-1]){assert.equal(resolveCMode(c).mode,'FREE_TRADING_MODE');assert.equal(requireV1TradingC(c),c);assert.equal(resolveCMode(c).feeBps,0)}
  for(const c of [5,-5,100,-100]){assert.equal(resolveCMode(c).mode,'LOCKED_HIGH_SPEED_MODE');assert.throws(()=>requireV1TradingC(c))}
  for(const c of [NaN,Infinity,1000,-1000])assert.equal(resolveCMode(c).canTrade,false);
  assert.equal(resolveCMode(-.01).side,'SHORT');assert.throws(()=>requireV1TradingC(.002));
});
test('KGEN is the cross-market settlement currency and KAIOS is the loot currency',()=>{
  assert.equal(WORLD_RULES.settlement,'KGEN');
  assert.equal(WORLD_RULES.tradeSettlement,'KGEN');
  assert.equal(WORLD_RULES.lootCurrency,'KAIOS');
});

test('wallet-bound KAIOS rewards and progression stay local until distribution is authorized',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  const guestLedger=createKgenLedger(),guest=createSimulationPlayerStore({ledger:guestLedger,storage});guest.activate(null);
  guest.record('MONSTER_KILL');guest.record('LOOT_DROP',{reward:5});
  let g=guest.snapshot();assert.equal(g.kaios,5);assert.equal(g.claimableKaios,0);assert.equal(g.kaiosRewardStatus,'LOCAL_ONLY_CONNECT_WALLET_TO_BIND');assert.ok(g.xp>=15);
  const wallet='0x'+'a'.repeat(40),ledger=createKgenLedger(),store=createSimulationPlayerStore({ledger,storage});store.activate(wallet);
  store.record('MONSTER_KILL');store.record('LOOT_DROP',{reward:5});store.record('TRADE_FILL');store.record('TRADE_CLOSE');
  const p=store.snapshot();assert.equal(p.kaios,5);assert.equal(p.claimableKaios,5);assert.equal(p.kaiosRewardStatus,'WALLET_BOUND_CLAIMABLE_PENDING_DISTRIBUTION');assert.ok(p.level>=2);assert.ok(p.engineLevel>=2);assert.ok(p.nextLevelXp>p.xp);assert.ok(p.nextEngineXp>p.engineXp);
});

test('V1 address profiles recover existing ledger without cross-account receipts; stale preserves margin',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  const ledger=createKgenLedger(),store=createSimulationPlayerStore({ledger,storage});
  const a='0x'+'1'.repeat(40),b='0x'+'2'.repeat(40);store.activate(a);
  const adapter=createExecutionAdapter({ledger,productV1:true,beforeMutation:store.check,afterMutation:store.save});
  assert.ok(adapter.observe({market:'ETHUSDT',price:100,observedAt:1000,now:1000}).ok);
  const input={axis:'KY',market:'ETHUSDT',c:1,lots:1,currentPrice:100,triggerPrice:101};
  assert.equal(adapter.submit({...input,c:5},{now:1001}).ok,false);
  assert.ok(adapter.submit(input,{now:1001}).ok);
  assert.ok(adapter.observe({market:'ETHUSDT',price:102,observedAt:1002,now:1002}).ok);
  assert.equal(adapter.snapshot().positions[0].trader,a);
  const before=adapter.snapshot();
  assert.equal(adapter.observe({market:'ETHUSDT',price:50,observedAt:1003,now:20000}).ok,false);
  assert.deepEqual(adapter.snapshot(),before);assert.equal(adapter.close(before.positions[0].positionId,{now:20000}).ok,false);
  store.activate(b);assert.equal(adapter.snapshot().positions.length,0);assert.equal(adapter.snapshot().wallet.free,100);
  store.activate(a);assert.deepEqual(adapter.snapshot(),before);
  const restoredLedger=createKgenLedger(),restored=createSimulationPlayerStore({ledger:restoredLedger,storage});restored.activate(a);
  const reloaded=createExecutionAdapter({ledger:restoredLedger,productV1:true,beforeMutation:restored.check,afterMutation:restored.save});
  assert.deepEqual(reloaded.snapshot(),before);
  assert.throws(()=>store.check(),/RELOAD_REQUIRED/,'same account stale tab may not overwrite recovered state');
  assert.ok(reloaded.observe({market:'ETHUSDT',price:103,observedAt:20001,now:20001}).ok);
  assert.ok(reloaded.close(before.positions[0].positionId,{now:20002}).ok);
  assert.equal(reloaded.snapshot().positions[0].status,'CLOSED');
  assert.equal(reloaded.snapshot().wallet.lockedMargin,0);
  assert.equal(reloaded.snapshot().receipts[1].trader,a);
});
test('offline 0C journey attacks, drops local-only loot once, respawns without settlement',()=>{
  const world=createWorldState(0);world.journeyEnabled=true;createKSpaceEncounter(world);
  const player={x:0,y:0,z:6};let time=1000,drops=0;
  for(let i=0;i<60;i++){
    const r=attackKSpace(world,player,{plane:'XZ',c:0,skill:'slash',now:time});time+=400;
    if(r.loot){drops++;assert.equal(r.loot.noRealValue,true);assert.equal(r.rewardKaios,5)}
    if(r.defeated)break;
  }
  assert.equal(drops,1);assert.equal(kMarketSnapshot(world).status,'WAIT');
  assert.equal(attackKSpace(world,player,{plane:'XZ',c:0,now:time}).reason,'NO_TARGET');
  tickWorld(world,player,time+6000);assert.equal(kCombatSnapshot(world,player).target.state,'GUARD');
  assert.equal(kCombatSnapshot(world,player).target.hp,120);
});
test('returning player receives the first journey encounter locally instead of hundreds of meters away',()=>{
  const world=createWorldState(0);world.journeyEnabled=true;const player={x:210,y:.013172,z:186};createKSpaceEncounter(world,undefined,player);
  const snap=kCombatSnapshot(world,player,{plane:'XZ',c:0});assert.ok(snap.distance>=6.9&&snap.distance<=7.1);
  assert.equal(snap.monsterLocal.x,player.x);assert.equal(snap.monsterLocal.z,player.z+7);
  assert.ok((world.ambientLife||[]).every(m=>Math.hypot(m.x-player.x,m.z-player.z)<=17));
  const ambientIds=new Set(world.ambientLife.map(m=>m.id));
  assert.ok(world.monsters.every(m=>!ambientIds.has(m.id)),'ambient must not occupy canonical source slots');
  const before=world.ambientLife.map(m=>({...m.localPosition,x:m.x,z:m.z}));tickWorld(world,player,5000);
  assert.ok(world.ambientLife.every((m,i)=>Math.hypot(m.x-before[i].x,m.z-before[i].z)>.01));
  assert.ok(world.ambientLife.every(m=>Math.hypot(m.x-player.x,m.z-player.z)<8));
});

test('journey world starts with a nearby moving ecology and six-phase combat metadata',()=>{
  const world=createWorldState(0);world.journeyEnabled=true;createKSpaceEncounter(world);const ambient=world.ambientLife||[];
  assert.equal(ambient.length,4);assert.deepEqual(new Set(ambient.map(m=>m.species)),new Set(['STONE_APE','FIRE_WISP']));
  const before=ambient.map(m=>[m.x,m.y,m.z]);tickWorld(world,{x:0,y:0,z:0},5000);assert.ok(ambient.some((m,i)=>m.x!==before[i][0]||m.y!==before[i][1]||m.z!==before[i][2]));
  const snap=kCombatSnapshot(world,{x:0,y:0,z:0},{plane:'XZ',c:-.1});assert.equal(snap.target.phaseRule,'XZ→KY · XY→KZ · YZ→KX');assert.equal(snap.target.selectedBody,'KY-');assert.ok(snap.distance<=8);
});

test('journey encounter cycles through common guardian, KAIOS courier and three-market boss',()=>{
  const world=createWorldState(0);world.journeyEnabled=true;createKSpaceEncounter(world);const player={x:0,y:0,z:0},guardian=world.monsters.find(m=>m.simulationCombat);
  let now=10000;
  for(let cycle=1;cycle<=5;cycle++){
    guardian.state='DEAD';guardian.defeatedAt=now;tickWorld(world,player,now+6000);now+=7000;
    if(cycle===3){assert.equal(guardian.name,'KAIOS 運鈔妖');assert.equal(guardian.journeyTier,'RARE');assert.equal(guardian.rewardKaios,8);assert.equal(guardian.hp,180)}
    if(cycle===5){assert.equal(guardian.name,'三市場魔王');assert.equal(guardian.journeyTier,'EPIC');assert.equal(guardian.rewardKaios,20);assert.equal(guardian.hp,300)}
  }
});

test('player level increases boss combat power without changing market leverage rules',()=>{
  const make=()=>{const world=createWorldState(0);world.journeyEnabled=true;createKSpaceEncounter(world);const g=world.monsters.find(m=>m.simulationCombat);g.hp=g.maxHp=300;for(const b of Object.values(g.bodies))b.hp=b.maxHp=50;return world};
  const player={x:0,y:0,z:6},low=make(),high=make();
  const a=attackKSpace(low,player,{plane:'XZ',c:0,skill:'slash',now:1000,powerLevel:1});
  const b=attackKSpace(high,player,{plane:'XZ',c:0,skill:'slash',now:1000,powerLevel:10});
  assert.ok(b.damage>a.damage);assert.equal(resolveCMode(5).mode,'LOCKED_HIGH_SPEED_MODE');
});

test('V1 revalidates old high-C pending records; sequence replay cannot fill or liquidate',()=>{
  const ledger=createKgenLedger(100),sim=createExecutionAdapter({ledger});
  sim.observe({market:'BTCUSDT',price:100,observedAt:1000,now:1000,sequence:10});
  sim.submit({axis:'KX',market:'BTCUSDT',c:100,lots:1,currentPrice:100,triggerPrice:101},{now:1001});
  const v1=createExecutionAdapter({ledger,productV1:true}),before=v1.snapshot();
  assert.equal(v1.observe({market:'BTCUSDT',price:102,observedAt:1002,now:1002,sequence:9}).ok,false);
  assert.deepEqual(v1.snapshot(),before);
  assert.ok(v1.observe({market:'BTCUSDT',price:102,observedAt:1002,now:1002,sequence:11}).ok);
  assert.equal(v1.snapshot().orders[0].status,'REJECTED');assert.equal(v1.snapshot().positions.length,0);assert.equal(v1.snapshot().wallet.free,100);
});
import {movementStep,defaultInventory,useInventoryItem,exchangeLocal,previewOrder,executeOrder,closePosition,tradeStats} from '../runtime/game-ui-runtime.mjs';
import {WORLD_RULES,createWorldState,resolvePlayerMove,playerAttack,tickWorld,tickSourceManagedLife,applyMarketLifeSourceEvents} from '../runtime/world-runtime.mjs';
import {createMarketLife,decideMarketLifeLifestyle,applyLifestyleEconomy,travelMarketLife} from '../runtime/market-life-runtime.mjs';
import {createDigitalAnt,createDeliveryMission,buildAtmRegistry,quoteDeliveryEconomics,cfoEvaluateDelivery,chooseBestDelivery,assignDelivery,loadCargo,tickDigitalAntDelivery,verifyDeliveryReceipt} from '../runtime/digital-ant-logistics-runtime.mjs';
import {publishMarketLifeSourceEvent} from '../runtime/market-life-source-runtime.mjs';
import {SPATIAL_CALIBRATION,gameUnitsToMeters,metersToGameUnits,gameUnitsToK,kToGameUnits,kmToK,kToKm,formatGameDistanceK,localPositionToK,marketToPhysicalK} from '../runtime/spatial-coordinate-runtime.mjs';
import {normalizeKPrice,inverseKPrice,kPositionFromReference,composeKWorld,combatPhase,createKSpaceEncounter,kCombatSnapshot,attackKSpace,KSPACE_REFERENCE,updateKMarketReference,kMarketSnapshot,formatKCoordinate} from '../runtime/world-runtime.mjs';

test('Human local meter calibration uses the CURRENT Moon K anchor without market tick coercion',()=>{
  assert.equal(gameUnitsToMeters(1),1);assert.equal(metersToGameUnits(1),1);
  assert.equal(SPATIAL_CALIBRATION.kmPerK,384400/16888);
  const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10*Math.max(1,Math.abs(b)),`${a} != ${b}`);
  near(gameUnitsToK(22761.724301279),1);
  for(const value of [-1000,-27.7,-2.2,0,.000001,1,2.2,27.7,22761.724301279])near(kToGameUnits(gameUnitsToK(value)),value);
  for(const value of [-2,0,.0001,1,100])near(kmToK(kToKm(value)),value);
  near(gameUnitsToK(2.2),2.2*16888/384400000);near(gameUnitsToK(27.7),27.7*16888/384400000);
  assert.equal(formatGameDistanceK(2.2),'0.0000966535K');assert.equal(formatGameDistanceK(27.7),'0.00121696K');
  assert.equal(formatGameDistanceK(-0),'0K');assert.match(formatGameDistanceK(27.7,{detail:true}),/27.7 m/);
  assert.equal(formatGameDistanceK(2.2,{compact:true}),'9.67e-5K');
  assert.equal(formatGameDistanceK(-.001,{compact:true}),'-4.39e-8K');
  for(const value of [NaN,Infinity,'1',null])assert.throws(()=>gameUnitsToK(value));
  assert.throws(()=>marketToPhysicalK({KX:1,KY:2,KZ:3}),/NOT_CONFIGURED/);
  assert.throws(()=>marketToPhysicalK({KX:1},()=>({x:1,y:0,z:0})),/DIMENSION/);
});

test('rounded market K coordinates never display negative zero',()=>{
  assert.equal(formatKCoordinate(-.0001),'0.00');assert.equal(formatKCoordinate(-0),'0.00');
  assert.equal(formatKCoordinate(1.01),'+1.01');assert.equal(formatKCoordinate(-18.816),'-18.82');
  const halfCent=100*(2501/4000-1);
  assert.equal(halfCent,-37.475);assert.equal(formatKCoordinate(halfCent),'-37.47');
  assert.equal(halfCent.toFixed(2),'-37.48','plain toFixed is not the canonical display rounding authority');
});

test('public market K waits, validates atomically, rejects old batches and distinguishes stale last-good data',()=>{
  const w=createWorldState(0),prices={BTCUSDT:81185,ETHUSDT:2631.54,BNBUSDT:767.8};
  assert.equal(kMarketSnapshot(w).status,'WAIT');assert.equal(w.kSpace,undefined);
  for(const bad of [{}, {...prices,BNBUSDT:0},{...prices,ETHUSDT:NaN},{...prices,BTCUSDT:'81185'}]){
    assert.throws(()=>updateKMarketReference(w,bad,100));assert.equal(w.kSpace,undefined);
  }
  updateKMarketReference(w,prices,100);
  const before=structuredClone(w.kSpace),m=kMarketSnapshot(w,101);
  assert.equal(m.status,'LIVE');assert.equal(m.markets.length,3);
  for(const item of m.markets){
    assert.equal(item.k,normalizeKPrice(prices[item.symbol],item.anchor));
    assert.ok(Math.abs(inverseKPrice(item.k,item.anchor)-item.price)<1e-8);
    for(const axis of ['KX','KY','KZ'])assert.equal(item.point[axis],axis===item.axis?item.k:0);
  }
  assert.throws(()=>updateKMarketReference(w,{...prices,BNBUSDT:Infinity},200));assert.deepEqual(w.kSpace,before);
  assert.equal(updateKMarketReference(w,{...prices,BTCUSDT:90000},99),false);assert.deepEqual(w.kSpace,before);
  assert.equal(kMarketSnapshot(w,15101).status,'STALE');w.kSpace.quoteFailed=true;
  assert.equal(kMarketSnapshot(w,101).status,'STALE');assert.deepEqual(kMarketSnapshot(w,101).markets,m.markets);
  updateKMarketReference(w,prices,201);assert.equal(kMarketSnapshot(w,202).status,'LIVE');
});

test('market-frame translation preserves local position, rendered guardian, relative K/range, HP and cooldown',()=>{
  const w=createWorldState(0),local={x:0,y:0,z:6};
  updateKMarketReference(w,{BTCUSDT:81000,ETHUSDT:2600,BNBUSDT:768},100);
  attackKSpace(w,local,{plane:'XZ',c:-1,now:1000});
  const before=kCombatSnapshot(w,local),guardian=w.monsters.find(m=>m.simulationCombat),rendered=[guardian.x,guardian.y,guardian.z];
  updateKMarketReference(w,{BTCUSDT:90000,ETHUSDT:3100,BNBUSDT:699},200);
  const after=kCombatSnapshot(w,local);
  assert.notDeepEqual(after.playerK,before.playerK);assert.deepEqual(after.playerLocal,local);
  assert.deepEqual(after.deltaK,before.deltaK);assert.ok(Math.abs(after.distance-before.distance)<1e-10);
  assert.deepEqual(after.target,before.target);assert.deepEqual(after.lastResult,before.lastResult);
  assert.deepEqual([guardian.x,guardian.y,guardian.z],rendered);assert.equal(w.kSpace.lastAttackAt,1000);
});

test('K-space normalization is scale independent, reversible and rejects unsafe inputs',()=>{
  for(const anchor of [600,4000,100000])for(const ratio of [.5,1,1.01,2]){
    const price=anchor*ratio,k=normalizeKPrice(price,anchor);
    assert.ok(Math.abs(k-100*(ratio-1))<1e-10);assert.ok(Math.abs(inverseKPrice(k,anchor)-price)<1e-8);
  }
  for(const value of [NaN,Infinity,-1,0,'100'])assert.throws(()=>normalizeKPrice(value,100));
  assert.equal(Object.is(normalizeKPrice(100,100),-0),false);
  assert.throws(()=>composeKWorld({KX:1,KY:2,KZ:3},{x:4,y:-2,z:8}),/DIMENSION/);
  assert.deepEqual(composeKWorld({space:'PHYSICAL_K',x:0,y:0,z:0},{x:4,y:-2,z:8}),localPositionToK({x:4,y:-2,z:8}));
  assert.throws(()=>composeKWorld({KX:1,KY:2,KZ:3},{x:NaN,y:0,z:0}));
});
test('Plane and C exclusively determine all six body phases',()=>{
  for(const [plane,axis] of [['XZ','KY'],['XY','KZ'],['YZ','KX']])for(const c of [-.3,0,.3]){
    const s=combatPhase(plane,c);assert.equal(s.axis,axis);assert.equal(s.body,c===0?null:axis+(c>0?'+':'-'));
  }
  assert.equal(combatPhase('INVALID',1),null);assert.equal(combatPhase('XZ',Infinity),null);
});
function practice(){const world=createWorldState(0);createKSpaceEncounter(world);return world}
test('K-space is traceable; local movement changes distance, not reference authority',()=>{
  const w=practice(),a=kCombatSnapshot(w,{x:0,y:0,z:0}),b=kCombatSnapshot(w,{x:0,y:0,z:5});
  assert.ok(Math.abs(a.distance-7)<1e-10);assert.ok(Math.abs(b.distance-2)<1e-10);assert.deepEqual(a.playerK,b.playerK);
  assert.equal(a.distanceK,gameUnitsToK(7));assert.equal(b.distanceK,gameUnitsToK(2));
  assert.equal(a.marketPhysicalTransform,'NOT_CONFIGURED');
  w.monsters.find(m=>m.simulationCombat).kPosition.KZ+=1000;
  assert.equal(kCombatSnapshot(w,{x:0,y:0,z:5}).distanceK,b.distanceK,'market delta cannot become meters or attack range');
  assert.deepEqual(a.deltaK,{KX:0,KY:0,KZ:1});assert.deepEqual(a.reference,KSPACE_REFERENCE);
  assert.deepEqual(a.playerK,kPositionFromReference());assert.equal(createKSpaceEncounter(w),w.kSpace);
  assert.equal(w.monsters.filter(m=>m.simulationCombat).length,1);
});
test('combat fails closed on neutral, height/range and cooldown; no capital or rewards',()=>{
  const w=practice(),p={x:0,y:0,z:5},opts={plane:'XZ',c:-.3,now:1000};
  assert.equal(attackKSpace(w,p,{...opts,c:0}).reason,'NEUTRAL_PHASE');
  assert.equal(attackKSpace(w,{...p,y:20},opts).reason,'OUT_OF_RANGE');
  assert.equal(w.monsters.at(-1).hp,600);
  const r=attackKSpace(w,p,{...opts,now:2000});assert.equal(r.reason,'WEAK_POINT');assert.equal(r.hits[0].body,'KY-');assert.equal(r.damage,53);assert.equal(r.rewardKaios,0);
  assert.equal(attackKSpace(w,p,{...opts,now:2001}).reason,'COOLDOWN');assert.equal(w.monsters.at(-1).hp,547);
  assert.equal(attackKSpace(w,p,{...opts,skill:'unknown',now:3000}).reason,'INVALID_INPUT');
});
test('three skills have distinct body selection, reach and sweep tactics',()=>{
  const opts={plane:'XZ',c:-.3,now:1000},p={x:0,y:0,z:4};
  assert.equal(attackKSpace(practice(),p,opts).reason,'OUT_OF_RANGE');
  const rain=attackKSpace(practice(),p,{...opts,skill:'goldenRain'});
  assert.deepEqual(rain.hits.map(h=>h.body),['KX-','KZ-']);
  const axe=attackKSpace(practice(),p,{...opts,skill:'phantomAxe',heading:0});
  assert.deepEqual(axe.hits.map(h=>h.body),['KX-','KY-','KZ-']);
  assert.equal(attackKSpace(practice(),p,{...opts,skill:'phantomAxe',heading:Math.PI}).reason,'OUTSIDE_SWEEP');
  const guarded=attackKSpace(practice(),{...p,z:5},{...opts,c:.3});assert.equal(guarded.reason,'BLOCKED_RESIST');assert.ok(guarded.damage<axe.hits.find(h=>h.body==='KY-').damage);
});
test('combat never damages source-managed Life; dead bodies cannot mint or repeat damage',()=>{
  const w=practice(),p={x:0,y:0,z:5};
  applyMarketLifeSourceEvents(w,[{type:'SPAWN',sourceId:'QA',lifeId:'QA-REAL-SOURCE',name:'Source',species:'BULL_DEMON',intelligence:1,markets:['BTCUSDT'],capital:50,vitality:100,maxHp:100,attack:0,rewardKaios:0,speed:0,positions:{},...p}]);
  const source=structuredClone(w.monsters.find(m=>m.sourceManaged));
  for(let i=0;i<20;i++)attackKSpace(w,p,{plane:'XZ',c:-.3,now:1000+i*1000});
  assert.deepEqual(w.monsters.find(m=>m.sourceManaged),source);assert.equal(w.monsters.at(-1).bodies['KY-'].hp,0);
  assert.equal(attackKSpace(w,p,{plane:'XZ',c:-.3,now:99999}).reason,'BODY_DISABLED');
});
test('a defeated practice entity never becomes a source-managed capacity slot',()=>{
  const w=practice(),guardian=w.monsters.at(-1);guardian.state='DEAD';guardian.hp=0;
  const events=Array.from({length:25},(_,i)=>({type:'SPAWN',sourceId:'QA',lifeId:'QA-CAPACITY-'+i,name:'Source',species:'DIGITAL_ANT',intelligence:1,markets:['BTCUSDT'],capital:1,vitality:100,maxHp:100,attack:0,rewardKaios:0,speed:0,positions:{},x:0,y:0,z:0}));
  const result=applyMarketLifeSourceEvents(w,events);assert.equal(result.at(-1).reason,'NO_FREE_SOURCE_SLOT');
  assert.equal(guardian.simulationCombat,true);assert.equal(guardian.sourceManaged,false);assert.equal(guardian.lifeId,null);
});

test('0C still allows ordinary XZ walking',()=>{const s=movementStep({forward:1,turn:0,heading:0,warp:0});assert.ok(s.distance>0);assert.ok(s.dz>0)});
test('joystick horizontal rotates player',()=>{const s=movementStep({forward:0,turn:1,heading:0,warp:0});assert.ok(s.heading>0);assert.equal(s.distance,0)});
test('collision blocks building',()=>{const r=resolvePlayerMove({x:0,y:0,z:0},{x:-7,y:0,z:7});assert.equal(r.blocked,true)});

test('baseline chicken and duck may exist without market dimensions',()=>{
  for(const species of ['CHICKEN','DUCK']){
    const life=createMarketLife({lifeId:`LIFE-QA-${species}-001`,species,markets:[],capital:0,vitality:100});
    assert.deepEqual(life.marketDimensions,[]);
    assert.equal(life.strategy,'WILD_ECOLOGY');
    assert.equal(life.state,'ALIVE');
  }
});

test('source-driven Market Life spawns, requires settlement, and despawns',()=>{
  const w=createWorldState(0),p={x:2,y:0,z:2};
  assert.equal(w.monsters.some(m=>m.sourceManaged),false,'inactive source slots must not appear as living monsters');
  publishMarketLifeSourceEvent({type:'SPAWN',sourceId:'QA-DIGITAL-ANT',lifeId:'LIFE-QA-DIGITAL-ANT-001',name:'QA Digital Ant',species:'DIGITAL_ANT',intelligence:3,markets:['BTCUSDT'],capital:20,vitality:100,maxHp:100,positions:{KX:{market:'BTCUSDT',side:1,lots:1,c:.001}},x:2,y:0,z:2},{persistLocal:false,broadcast:false});
  tickWorld(w,p,100);
  const life=w.monsters.find(m=>m.sourceManaged&&m.lifeId==='LIFE-QA-DIGITAL-ANT-001');
  assert.ok(life,'source event must activate a world slot');
  const r=playerAttack(w,p,24,101);
  assert.equal(r.reason,'SOURCE_SETTLEMENT_REQUIRED');
  assert.equal(r.rewardKaios,0);
  publishMarketLifeSourceEvent({type:'DESPAWN',sourceId:'QA-DIGITAL-ANT',lifeId:'LIFE-QA-DIGITAL-ANT-001',reason:'QA_DONE'},{persistLocal:false,broadcast:false});
  tickWorld(w,p,102);
  assert.equal(w.monsters.some(m=>m.sourceManaged&&m.lifeId==='LIFE-QA-DIGITAL-ANT-001'),false);
});

test('source updates merge market dimensions without Set-only APIs',()=>{
  const w=createWorldState(0);
  const base={type:'SPAWN',sourceId:'QA-SOURCE',lifeId:'LIFE-QA-SOURCE-MARKETS',name:'旅妖',species:'BULL_DEMON',intelligence:4,markets:['BTCUSDT'],capital:50,vitality:100,maxHp:100,attack:2,rewardKaios:0,speed:.01,positions:{},x:0,y:0,z:0};
  applyMarketLifeSourceEvents(w,[base]);
  assert.doesNotThrow(()=>applyMarketLifeSourceEvents(w,[{...base,type:'UPDATE',markets:['ETHUSDT'],x:1,y:2,z:3}]));
  const slot=w.monsters.find(m=>m.lifeId==='LIFE-QA-SOURCE-MARKETS');
  assert.deepEqual(slot.marketLife.marketDimensions.sort(),['BTCUSDT','ETHUSDT']);
  assert.deepEqual({x:slot.x,y:slot.y,z:slot.z},{x:1,y:2,z:3});
});

test('source-managed Market Life can visibly travel in full XYZ',()=>{
  const w=createWorldState(0);
  applyMarketLifeSourceEvents(w,[{type:'SPAWN',sourceId:'QA-LIFE',lifeId:'LIFE-QA-3D-TRAVEL',name:'遊山妖',species:'BULL_DEMON',intelligence:4,markets:['BTCUSDT'],capital:50,vitality:100,maxHp:100,attack:2,rewardKaios:0,speed:.02,positions:{},x:0,y:0,z:0}]);
  const slot=w.monsters.find(m=>m.lifeId==='LIFE-QA-3D-TRAVEL');
  slot.marketLife.preferences={work:0,travel:1,comfort:.2};slot.marketLife.needs={hunger:.1,fatigue:.1,social:.1,curiosity:.9};
  const before={x:slot.x,y:slot.y,z:slot.z};
  const r=tickSourceManagedLife(slot,{now:2000,deltaMs:500,makeDecision:true,random:()=>0});
  assert.equal(r.ok,true);
  assert.ok(['EXPLORE','TRAVEL'].includes(r.action));
  assert.notDeepEqual({x:slot.x,y:slot.y,z:slot.z},before);
  assert.deepEqual({x:slot.x,y:slot.y,z:slot.z},slot.marketLife.world.position);
});

test('source-managed Digital Ant uses ATM mission as visible work destination',()=>{
  const w=createWorldState(0);
  applyMarketLifeSourceEvents(w,[{type:'SPAWN',sourceId:'QA-ANT',lifeId:'LIFE-QA-ANT-WORLD',name:'Digital Ant',species:'DIGITAL_ANT',intelligence:5,markets:['BTCUSDT'],capital:50,vitality:100,maxHp:100,attack:0,rewardKaios:0,speed:.02,positions:{},x:0,y:4,z:0,mission:{missionId:'ATM-RUN',status:'IN_TRANSIT',destinationAtmId:'ATM-11520-001',quote:{net:4}}}]);
  const slot=w.monsters.find(m=>m.lifeId==='LIFE-QA-ANT-WORLD');
  const r=tickSourceManagedLife(slot,{now:2000,deltaMs:500,makeDecision:true,random:()=>.5});
  assert.equal(r.action,'WORK');
  assert.equal(r.destination.id,'ATM-11520-001');
  assert.ok(slot.x>0);
  assert.ok(slot.z>0);
  assert.ok(slot.y<4,'3D delivery path must also move vertically toward the ATM');
});

test('Digital Ant CFO can reject loss-making freight and choose positive EV delivery',()=>{
  const ant=createDigitalAnt({capital:20,cargoCapacity:100});
  const atms=buildAtmRegistry([{id:'ATM-A',type:'ATM',x:3,y:4,z:0},{id:'ATM-B',type:'ATM',x:1,y:1,z:1}]);
  const loss=createDeliveryMission({missionId:'LOSS',amount:10,destinationAtmId:'ATM-A',freightOffer:1,demand:1,fuelPerMeter:1,speedMetersPerSecond:1});
  const good=createDeliveryMission({missionId:'GOOD',amount:10,destinationAtmId:'ATM-B',freightOffer:10,demand:1,fuelPerMeter:.1,speedMetersPerSecond:1});
  assert.equal(cfoEvaluateDelivery(ant,loss,atms[0]).action,'REQUOTE');
  const chosen=chooseBestDelivery(ant,[loss,good],atms);
  assert.equal(chosen.action,'ACCEPT');
  assert.equal(chosen.mission.missionId,'GOOD');
});

test('OBSERVE delivery earns no market tip while favorable LONG can earn one',()=>{
  const ant=createDigitalAnt({capital:20});
  const atm={atmId:'ATM-Q',x:3,y:4,z:0,online:true};
  const observe=createDeliveryMission({amount:10,destinationAtmId:'ATM-Q',mode:'OBSERVE',freightOffer:5,marketEdge:2,tipRate:.5,demand:1});
  const long=createDeliveryMission({amount:10,destinationAtmId:'ATM-Q',mode:'LONG',freightOffer:5,marketEdge:2,tipRate:.5,demand:1});
  assert.equal(quoteDeliveryEconomics(ant,observe,atm).tip,0);
  assert.ok(quoteDeliveryEconomics(ant,long,atm).tip>0);
});

test('Digital Ant travels full XYZ and requires verified receipt before delivery settlement',()=>{
  const ant=createDigitalAnt({capital:20,cargoCapacity:100});
  const atms=buildAtmRegistry([{id:'ATM-XYZ',type:'ATM',x:1,y:1,z:1}]);
  const mission=createDeliveryMission({missionId:'XYZ',amount:10,destinationAtmId:'ATM-XYZ',freightOffer:10,demand:1,speedMetersPerSecond:1});
  assert.equal(assignDelivery(ant,mission,atms).ok,true);
  assert.equal(loadCargo(ant).ok,true);
  let result;
  for(let i=0;i<20;i++){result=tickDigitalAntDelivery(ant,{deltaMs:100,speed:.02});if(result.arrived)break;}
  assert.equal(result.arrived,true);
  assert.ok(ant.y>0,'Y must move during XYZ delivery');
  assert.equal(ant.mission.status,'ARRIVED_AWAITING_RECEIPT');
  assert.equal(verifyDeliveryReceipt(ant,{receiptId:null,verified:false}).ok,false);
  const settled=verifyDeliveryReceipt(ant,{receiptId:'QA-RECEIPT-001',verified:true});
  assert.equal(settled.ok,true);
  assert.equal(ant.mission.status,'DELIVERED');
  assert.ok(ant.retirementReserve>=0);
});

test('Market Life may work, travel, rest, or retire instead of being forced into combat',()=>{
  const worker=createMarketLife({lifeId:'LIFE-QA-WORKER',markets:['BTCUSDT'],capital:20,retirementReserve:0,targetRetirementReserve:100,preferences:{work:1,travel:0,comfort:.5}});
  const work=decideMarketLifeLifestyle(worker,{jobs:[{id:'JOB-1',expectedNet:5}],random:()=>0});
  assert.equal(work.action,'WORK');
  const econ=applyLifestyleEconomy(worker,{income:10,expenses:2,retirementRate:.25});
  assert.equal(econ.net,8);
  assert.equal(econ.contribution,2);

  const traveler=createMarketLife({lifeId:'LIFE-QA-TRAVEL',markets:['BTCUSDT'],preferences:{work:0,travel:1,comfort:.2},needs:{hunger:.1,fatigue:.1,social:.1,curiosity:.9}});
  const travel=decideMarketLifeLifestyle(traveler,{destinations:[{id:'SCENIC-1',x:2,y:3,z:4}],random:()=>0});
  assert.equal(travel.action,'EXPLORE');
  const moved=travelMarketLife(traveler,{deltaMs:100,speed:.01});
  assert.equal(moved.ok,true);
  assert.ok(moved.position.y>0);

  const retiree=createMarketLife({lifeId:'LIFE-QA-RETIRE',markets:['BTCUSDT'],retirementReserve:120,targetRetirementReserve:100,preferences:{work:.2,travel:.5,comfort:.8}});
  assert.equal(decideMarketLifeLifestyle(retiree,{random:()=>.5}).action,'RETIRE');
});

test('consumable item mutates inventory and hp',()=>{const inv=defaultInventory(),r=useInventoryItem(inv,'POTION-001',50);assert.equal(r.ok,true);assert.equal(r.hp,85);assert.equal(inv.find(i=>i.id==='POTION-001').qty,2)});
test('local ATM is explicit state conversion',()=>{const s={kgen:10,kaios:100};assert.equal(exchangeLocal(s,1,10).ok,true);assert.equal(s.kgen,9);assert.equal(s.kaios,110)});
test('order preview -> execute -> close keeps fixed principal and index-delta accounting',()=>{const s={kgen:10,pos:{KX:null,KY:null,KZ:null},history:[]};const p=previewOrder({axis:'KX',symbol:'BTCUSDT',fire:2,leverage:5,price:100,kgen:s.kgen,hasPosition:false});assert.equal(p.ok,true);assert.equal(p.order.im,2);executeOrder(s,p.order);assert.equal(s.kgen,8);const c=closePosition(s,'KX',103);assert.equal(c.ok,true);assert.equal(c.pnl,30);assert.ok(Math.abs(s.kgen-40)<1e-12);const st=tradeStats(s.history);assert.equal(st.closed,1);assert.equal(st.realizedPnl,30)});
test('legacy order preview rejects lots or C above the shared 100 boundary',()=>{assert.equal(previewOrder({axis:'KX',symbol:'BTCUSDT',fire:101,leverage:1,price:100,kgen:1000,hasPosition:false}).reason,'BAD_LOTS');assert.equal(previewOrder({axis:'KX',symbol:'BTCUSDT',fire:1,leverage:101,price:100,kgen:1000,hasPosition:false}).reason,'BAD_C')});
test('cancel invariant: preview alone does not mutate balances/position/history',()=>{const s={kgen:10,pos:{KX:null},history:[]};const snap=structuredClone(s);const p=previewOrder({axis:'KX',symbol:'BTCUSDT',fire:1,leverage:-1,price:100,kgen:10,hasPosition:false});assert.equal(p.ok,true);assert.equal(p.order.side,'空');assert.deepEqual(s,snap)});
test('order execution rejects forged C, lots, side, margin and duplicate positions atomically',()=>{
 const base=previewOrder({axis:'KX',symbol:'BTCUSDT',fire:1,leverage:-100,price:100,kgen:1000,hasPosition:false}).order;
 for(const patch of [{c:0},{c:1000},{c:-1000},{lots:-1},{lots:101},{lots:1.5},{side:'多'},{im:0},{price:NaN}]){
  const state={kgen:1000,pos:{KX:null},history:[]},before=structuredClone(state);
  assert.equal(executeOrder(state,{...base,...patch}).ok,false);assert.deepEqual(state,before);
 }
 const state={kgen:1000,pos:{KX:null},history:[]};assert.equal(executeOrder(state,base).ok,true);
 const once=structuredClone(state);assert.equal(executeOrder(state,base).reason,'POSITION_EXISTS');assert.deepEqual(state,once);
 assert.equal(previewOrder({axis:'KX',fire:-1,leverage:1,price:100,kgen:1000}).reason,'BAD_LOTS');
});
