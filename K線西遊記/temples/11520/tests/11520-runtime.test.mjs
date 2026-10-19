import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveCMode,requireV1TradingC} from '../controls/nonlinear-controls.mjs';
import {createSimulationPlayerStore,createPlayerScopedStorage,PLAYER_SESSION_KEY,readPublicWalletIdentity,savePublicWalletIdentity,readPlayerSession,savePlayerSession} from '../runtime/evm-wallet-runtime.mjs';
import {createKgenLedger} from '../runtime/kgen-margin-runtime.mjs';
import {createExecutionAdapter} from '../runtime/real-trading-order-intent.mjs';
import {createJourneyTutorial,JOURNEY_ENCOUNTER_PROFILES,GAME_LOOT_TABLE,GA600_GAME_TRAINING,selectJourneyLoot,selectJourneyEncounter,drainJourneyEvents,serializeWorld} from '../runtime/world-runtime.mjs';
import {GAMEPLAY_UNLOCKS} from '../runtime/player-life-runtime.mjs';
import {observeTrainingMarket,createTrainingMemory} from '../runtime/market-life-runtime.mjs';

test('training history reload restores only existing growth, never pending predictions or financial authority',()=>{
  const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
  const life=createMarketLife({lifeId:'TRAIN-1',capital:0});
  Object.assign(life.growth,{wins:2,losses:1,flat:1,predictionCount:4,streak:1,experience:2});
  life.training={pending:{price:100,sign:1},intent:{direction:'LONG'}};
  assert.equal(createTrainingMemory(storage).save(life),true);
  const restored=createMarketLife({lifeId:'TRAIN-1',capital:0});
  assert.equal(createTrainingMemory(storage).restore(restored),true);
  assert.deepEqual(restored.growth,life.growth);assert.equal(restored.training,undefined);assert.equal(restored.capital,0);assert.deepEqual(restored.positions,{});
  assert.equal(createTrainingMemory(null).save(life),false);
  assert.equal(createTrainingMemory(storage).restore(createMarketLife({lifeId:'ANOTHER'})),false);
  const corrupt={getItem:()=>JSON.stringify({scope:'LOCAL_GAME_OBSERVATIONS',actors:[{id:'TRAIN-1',growth:{...life.growth,wins:999}}]})};
  assert.equal(createTrainingMemory(corrupt).restore(createMarketLife({lifeId:'TRAIN-1'})),false);
});

test('training observation is one-shot, causal, gap-safe and cannot mutate capital or positions',()=>{
  const life=createMarketLife({lifeId:'SIM-TRAINING',markets:['BTCUSDT','ETHUSDT','BNBUSDT'],capital:25});
  const quote=(at,price,status='LIVE')=>({receivedAt:at,status,markets:[{axis:'KX',symbol:'BTCUSDT',price},{axis:'KY',symbol:'ETHUSDT',price:20},{axis:'KZ',symbol:'BNBUSDT',price:3}]});
  assert.equal(observeTrainingMarket(life,quote(1000,100),{now:1000}).direction,'NEUTRAL');
  assert.equal(observeTrainingMarket(life,quote(6000,101),{now:6000}).direction,'LONG');
  assert.equal(life.training.pending.price,101);
  for(let at=11000;at<=61000;at+=5000)observeTrainingMarket(life,quote(at,102),{now:at});
  assert.equal(life.growth.predictionCount,0,'no future information before horizon');
  observeTrainingMarket(life,quote(66000,103),{now:66000});
  assert.equal(life.growth.wins,1);assert.equal(life.growth.predictionCount,1);assert.equal(life.growth.experience,1);
  observeTrainingMarket(life,quote(66000,1000),{now:66000});
  assert.equal(life.growth.predictionCount,1,'same timestamp must not settle twice');
  assert.equal(life.training.quotes.BTCUSDT,103);
  assert.equal(observeTrainingMarket(life,quote(71000,1,'STALE'),{now:71000}),null);
  observeTrainingMarket(life,quote(200000,110),{now:200000});
  assert.equal(life.growth.predictionCount,1,'stale horizon is discarded, not a win');
  assert.equal(life.capital,25);assert.deepEqual(life.positions,{});
  const counter=createMarketLife({lifeId:'SIM-COUNTER'});
  observeTrainingMarket(counter,quote(1000,100),{now:1000,contrarian:true});
  assert.equal(observeTrainingMarket(counter,quote(6000,101),{now:6000,contrarian:true}).direction,'SHORT');
  assert.equal(counter.training.intent.fullGA600,'NOT_INTEGRATED');
});

test('blocked browser storage getter cannot abort identity or game session boot',()=>{
  const before=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('STORAGE_DENIED')}});
  try{
    assert.equal(readPublicWalletIdentity(),null);assert.equal(readPlayerSession(),null);
    assert.equal(savePublicWalletIdentity({address:'0x'+'a'.repeat(40)}),null);
    assert.equal(savePlayerSession({xyz:{x:0,y:0,z:0},intentXYZ:{x:0,y:0,z:0}}),null);
  }finally{if(before)Object.defineProperty(globalThis,'localStorage',before);else delete globalThis.localStorage}
});

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

test('local KAIOS ammunition spend is exact, persistent and never creates a chain transfer',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},store=createSimulationPlayerStore({ledger:createKgenLedger(),storage});
  store.activate(null);store.record('LOOT_DROP',{reward:8});
  assert.deepEqual(store.spendKaios(3,{purpose:'KAIOS_MISSILE_GAME_AMMUNITION'}),{ok:true,amount:3,purpose:'KAIOS_MISSILE_GAME_AMMUNITION',remainingKaios:5,scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'});
  assert.equal(store.snapshot().spentKaios,3);assert.equal(store.snapshot().kaios,5);
  assert.equal(store.spendKaios(6).reason,'INSUFFICIENT_LOCAL_KAIOS');
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
  world.playerLevel=5;world.engineLevel=2;
  let now=10000;
  for(let cycle=1;cycle<=5;cycle++){
    guardian.state='DEAD';guardian.defeatedAt=now;tickWorld(world,player,now+6000);now+=7000;
    if(cycle===3){assert.equal(guardian.name,'KAIOS 運鈔妖');assert.equal(guardian.journeyTier,'RARE');assert.equal(guardian.rewardKaios,8);assert.equal(guardian.hp,180)}
    if(cycle===5){assert.equal(guardian.name,'三市場魔王');assert.equal(guardian.journeyTier,'EPIC');assert.equal(guardian.rewardKaios,20);assert.equal(guardian.hp,300)}
  }
});

test('V2.9 Boss admission is game progression only and automatic respawn remains locked for new guests',()=>{
  const world=createWorldState(0);world.journeyEnabled=true;createKSpaceEncounter(world);const player={x:210,y:4,z:186},g=world.monsters.find(m=>m.simulationCombat);
  const before=serializeWorld(world),count=world.monsters.length;
  assert.equal(selectJourneyEncounter(world,player,{profileId:'MARKET_BOSS',playerLevel:4,engineLevel:10}).reason,'PROGRESSION_LOCKED');
  assert.equal(selectJourneyEncounter(world,player,{profileId:'TREND_BOSS',playerLevel:10,engineLevel:1}).reason,'PROGRESSION_LOCKED');
  assert.equal(serializeWorld(world).kSpace.targetId,before.kSpace.targetId);
  world.journeyCycle=4;g.state='DEAD';g.defeatedAt=0;tickWorld(world,player,6000);
  assert.equal(g.profileId,'GUARDIAN');assert.equal(g.boss,false);
  const selected=selectJourneyEncounter(world,player,{profileId:'MARKET_BOSS',playerLevel:5,engineLevel:2,now:10000});
  assert.equal(selected.ok,true);assert.equal(g.boss,true);assert.equal(g.level,5);
  assert.equal(kCombatSnapshot(world,player).distance,7);assert.equal(world.monsters.length,count);
  assert.equal(world.monsters.filter(m=>m.species==='SOURCE_SLOT').length,24);
  assert.equal(g.lifeId,null);assert.equal(g.sourceManaged,false);
  const snapshot=kCombatSnapshot(world,player).target;assert.equal(snapshot.profileId,'MARKET_BOSS');assert.equal(snapshot.phase,1);
  assert.equal(resolveCMode(100).canTrade,false);assert.equal(GA600_GAME_TRAINING.realTradingAuthority,false);
});

test('Boss six-body phases, rage, low HP, defeat, loot and reward key occur once without financial settlement',()=>{
  const world=createWorldState(0);world.journeyEnabled=true;createKSpaceEncounter(world);const player={x:0,y:0,z:6};
  selectJourneyEncounter(world,{x:0,y:0,z:0},{profileId:'MARKET_BOSS',playerLevel:5,engineLevel:2,now:1000});
  const encounter=kCombatSnapshot(world,player).target.encounterId;
  assert.equal(drainJourneyEvents(world).filter(e=>e.type==='BOSS_SPAWN').length,1);assert.equal(drainJourneyEvents(world).length,0);
  const events=[],rewards=[];let now=2000;
  for(let i=0;i<100;i++,now+=400){const result=attackKSpace(world,player,{plane:'YZ',c:0,skill:'slash',now});events.push(...result.events);if(result.rewardId)rewards.push(result);if(result.defeated)break}
  assert.equal(events.filter(e=>e.type==='BOSS_PHASE_CHANGE').length,2);
  for(const type of ['BOSS_RAGE','BOSS_LOW_HP','BOSS_DEFEAT'])assert.equal(events.filter(e=>e.type===type).length,1,type);
  assert.equal(rewards.length,1);assert.equal(rewards[0].rewardId,`journey:${encounter}`);
  assert.equal(rewards[0].rewardXp,undefined);assert.equal(rewards[0].rewardEngineXp,undefined,'Player Life owns all XP projection, not the encounter');
  assert.equal(rewards[0].loot.kind,'GAME_ITEM');assert.equal(rewards[0].loot.tokenized,false);assert.equal(rewards[0].loot.noRealValue,true);
  const again=attackKSpace(world,player,{plane:'YZ',c:0,now:now+1000});assert.equal(again.rewardId,null);assert.equal(again.reason,'NO_TARGET');assert.equal(again.events.length,0);
  assert.equal(drainJourneyEvents(world).length,0,'attack events are not duplicated in the spawn queue');
  selectJourneyEncounter(world,player,{profileId:'MARKET_BOSS',playerLevel:5,engineLevel:2,now:now+2000});
  assert.notEqual(kCombatSnapshot(world,player).target.encounterId,encounter,'replayable encounter gets a distinct actual-spawn identity');
});

test('Boss strike range and rage cadence are local gameplay; defeat stops attacks',()=>{
  const world=createWorldState(0);world.journeyEnabled=true;createKSpaceEncounter(world);
  selectJourneyEncounter(world,{x:0,y:0,z:0},{profileId:'MARKET_BOSS',playerLevel:5,engineLevel:2,now:1000});
  assert.equal(tickWorld(world,{x:0,y:0,z:0},3000).playerDamage,0);
  assert.equal(tickWorld(world,{x:0,y:0,z:6},3001).playerDamage,7);
  assert.equal(tickWorld(world,{x:0,y:0,z:6},3002).playerDamage,0);
  const g=world.monsters.find(m=>m.simulationCombat);g.rage=true;
  const hit=tickWorld(world,{x:0,y:0,z:6},3851);assert.equal(hit.playerDamage,12);assert.equal(hit.events.find(e=>e.type==='PLAYER_HIT').simulationOnly,true);
  g.state='DEAD';g.defeatedAt=3851;assert.equal(tickWorld(world,{x:0,y:0,z:6},5000).playerDamage,0);
});

test('seeded game loot is deterministic and covers every configured rarity without token metadata',()=>{
  const levels={playerLevel:6,engineLevel:2},found=new Set();for(let i=0;i<1000;i++){const item=selectJourneyLoot(`seed-${i}`,'MARKET_BOSS',levels);found.add(item.rarity);assert.deepEqual(item,selectJourneyLoot(`seed-${i}`,'MARKET_BOSS',levels));assert.equal(item.quantity,1);assert.equal(item.localOnly,true);assert.equal(item.tokenized,false);assert.equal(item.contract,undefined)}
  assert.deepEqual(found,new Set(GAME_LOOT_TABLE.map(i=>i.rarity)));
  for(let i=0;i<50;i++)assert.ok(['COMMON','UNCOMMON'].includes(selectJourneyLoot(i).rarity));
  assert.throws(()=>selectJourneyLoot('seed','UNKNOWN'),/UNKNOWN_ENCOUNTER/);
  assert.equal(GA600_GAME_TRAINING.fullEngine,'NOT_INTEGRATED');assert.match(GA600_GAME_TRAINING.dataSource,/SYNTHETIC/);
});

test('encounter gates derive from Player Life unlocks and rare loot fails closed before its unlock',()=>{
  for(const p of Object.values(JOURNEY_ENCOUNTER_PROFILES)){const gate=GAMEPLAY_UNLOCKS.find(u=>u.id===p.unlock);assert.equal(p.minPlayerLevel,gate.playerLevel);assert.equal(p.minEngineLevel,gate.engineLevel)}
  for(const levels of [{playerLevel:5,engineLevel:9},{playerLevel:10,engineLevel:1},{playerLevel:Infinity,engineLevel:10}]){
    for(let seed=0;seed<100;seed++)assert.ok(['COMMON','UNCOMMON'].includes(selectJourneyLoot(seed,'MARKET_BOSS',levels).rarity));
  }
  const world=createWorldState(0);world.journeyEnabled=true;createKSpaceEncounter(world);const player={x:0,y:0,z:0};
  assert.equal(selectJourneyEncounter(world,player,{profileId:'MARKET_BOSS',playerLevel:5,engineLevel:1}).ok,true);
  for(const profileId of ['TREND_BOSS','CRASH_BOSS','RANGE_BOSS'])assert.equal(selectJourneyEncounter(world,player,{profileId,playerLevel:5,engineLevel:2}).ok,true);
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
import {createDigitalAnt,createDigitalAntPersistenceEnvelope,restoreDigitalAntPersistenceEnvelope,createDeliveryMission,createPlayerHomeDestination,createPlayerHomeDeliveryRequest,buildAtmRegistry,quoteDeliveryEconomics,cfoEvaluateDelivery,chooseBestDelivery,assignDelivery,loadCargo,tickDigitalAntDelivery,verifyDeliveryReceipt,acceptSimulatedAtmDeliveryReceipt,resolveCargoInsuranceAfterDelivery,previewPlayerHomeAcceptance,acceptPlayerHomeDelivery,planDigitalAntEncounter,planCargoHedge,calculateKRouteKinematics,buildAtmUfoFlightPlan,cSpeedMetersPerSecond,quoteCargoInsurance,activateCargoInsurance,attemptCargoRobbery,settleCargoInsuranceClaim,calculateMissileImpact,previewMissileInterception,resolveMissileInterception,estimatePlayerCourierDuration,createPlayerCourierOffer,createWhiteholeEscortDemoOffer,reviewWhiteholeEscortDemoOffer,createPlayerCourierStore,WHITEHOLE_ESCORT_WORK_ID,K_INDEX_KM} from '../runtime/digital-ant-logistics-runtime.mjs';
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

test('Digital Ant calculates physical K XYZ distance, C speed, ETA and cargo scale without creating an order',()=>{
  const route=calculateKRouteKinematics({origin:{x:0,y:0,z:0},destination:{x:1,y:1,z:1},c:1,lots:1});
  assert.equal(route.ok,true);
  assert.ok(Math.abs(route.distanceK-Math.sqrt(3))<1e-12);
  assert.ok(Math.abs(route.distanceKm-Math.sqrt(3)*K_INDEX_KM)<1e-12);
  assert.ok(Math.abs(route.etaSeconds-Math.sqrt(3)/.001)<1e-9);
  assert.ok(Math.abs(route.velocityKPerSecond.x-.001/Math.sqrt(3))<1e-12);
  assert.deepEqual(route.movementBattleAxes,{X:'LONG',Y:'LONG',Z:'LONG'});
  assert.deepEqual(route.hedgeOrderAxes,{KX:'NOT_PLACED',KY:'NOT_PLACED',KZ:'NOT_PLACED'});
  assert.equal(route.cSide,'LONG');
  assert.deepEqual(route.cargo,{lots:1,kgen:1,indexUnits:1,kaios:1000,kmScalePerLot:K_INDEX_KM});
  assert.equal(route.marketOrderCreated,false);
});

test('route direction and market C side stay explicit and zero C cannot claim a calculated ETA',()=>{
  const mixed=calculateKRouteKinematics({origin:{x:2,y:0,z:-1},destination:{x:1,y:3,z:-1},c:-1,lots:2});
  assert.deepEqual(mixed.movementBattleAxes,{X:'SHORT',Y:'LONG',Z:'HOLD'});
  assert.equal(mixed.cSide,'SHORT');
  assert.equal(mixed.cargo.kaios,2000);
  const zero=calculateKRouteKinematics({origin:{x:0,y:0,z:0},destination:{x:1,y:0,z:0},c:0,lots:1});
  assert.equal(zero.etaSeconds,null);
  assert.equal(zero.status,'LOCAL_WALK_RATE_REQUIRED');
  assert.equal(zero.cSide,'NO_ORDER');
});

test('ATM UFO uses a real XYZ climb, cruise and descent plan at the declared C speed',()=>{
  const plan=buildAtmUfoFlightPlan({x:0,y:0,z:0},{x:8,y:0,z:5},{flightAltitude:6,arrivalOffsetY:1.1});
  assert.equal(plan.transportMode,'ATM_UFO_5D');assert.equal(plan.fullXYZ,true);assert.equal(plan.flatRoute,false);
  assert.deepEqual(plan.waypoints.map(x=>x.phase),['ASCEND','CRUISE_5D','DESCEND']);
  assert.equal(plan.waypoints[0].y,6);assert.equal(plan.waypoints[1].x,8);assert.equal(plan.waypoints[1].z,5);assert.equal(plan.waypoints[2].y,1.1);
  assert.ok(plan.distanceWorld>Math.hypot(8,5),'5D flight distance includes ascent and descent');
  assert.ok(Math.abs(cSpeedMetersPerSecond(1)-K_INDEX_KM)<1e-12);
  assert.ok(Math.abs(cSpeedMetersPerSecond(-.1)-K_INDEX_KM*.1)<1e-12);
});

test('Digital Ant supports XYZ opposition while restricted custody is never direct browser loot',()=>{
  const aligned=planDigitalAntEncounter({
    playerAxes:{KX:{market:'BTCUSDT',side:-1}},antExposures:[{axis:'KX',market:'BTCUSDT',side:1,lots:2,c:.001}],
    playerMovement:{x:1,y:0,z:1},antMovement:{x:1,y:0,z:1},cargoAmount:1080000
  });
  assert.equal(aligned.action,'ESCORT');assert.equal(aligned.cargoLootable,false);assert.equal(aligned.robberyChallengeAllowed,true);assert.equal(aligned.playerAssetTheft,false);
  assert.equal(aligned.hedgeRelations.overall,'OPPOSED','opposed hedge orders do not create movement combat');
  const opposed=planDigitalAntEncounter({
    playerAxes:{KX:{market:'BTCUSDT',side:1}},antExposures:[{axis:'KX',market:'BTCUSDT',side:1,lots:2,c:.001}],
    playerMovement:{x:-1,y:0,z:1},antMovement:{x:1,y:0,z:1},cargoAmount:1080000
  });
  assert.equal(opposed.action,'MOVEMENT_LONG_SHORT_DUEL_WAIT_SETTLEMENT');assert.equal(opposed.settlementRequired,true);assert.equal(opposed.cargoPrincipalAtRisk,false);
  assert.equal(opposed.hedgeRelations.overall,'ALIGNED','aligned hedge orders do not cancel opposing XYZ combat');
  const reroute=planDigitalAntEncounter({cargoAmount:1080000,threat:.9,routeRisk:.9});
  assert.equal(reroute.action,'DEFEND_AND_REROUTE');assert.equal(reroute.combatScope,'SIMULATION_ONLY');
});

test('cash cargo hedge is exposure-based, capped, separately funded, and never uses cargo principal',()=>{
  const matched=planCargoHedge({cargoAsset:'KAIOS',cargoAmount:1080000,deliveryLiabilityAsset:'KAIOS'});
  assert.equal(matched.action,'NO_HEDGE');assert.equal(matched.reason,'MATCHED_ASSET_AND_LIABILITY');
  const blocked=planCargoHedge({cargoAsset:'KAIOS',cargoAmount:1080000,deliveryLiabilityAsset:'KAIOS',variableCostExposure:{asset:'BNB',notional:100,market:'BNBKAIOS',type:'PAYABLE'},marketAvailable:true,authorized:false,operatingRiskReserve:100});
  assert.equal(blocked.action,'HOLD');assert.equal(blocked.reason,'HEDGE_AUTHORIZATION_REQUIRED');
  const planned=planCargoHedge({cargoAsset:'KAIOS',cargoAmount:1080000,deliveryLiabilityAsset:'KAIOS',variableCostExposure:{asset:'BNB',notional:100,market:'BNBKAIOS',type:'PAYABLE'},marketAvailable:true,authorized:true,operatingRiskReserve:30,maxHedgeRatio:.5,maxOrderLeverage:4});
  assert.equal(planned.action,'HEDGE_CANDIDATE');assert.equal(planned.hedge.side,'LONG');assert.equal(planned.hedgeNotional,30);assert.ok(planned.hedgeNotional<=planned.exposure.notional);assert.equal(planned.hedge.orderLeverage,1);assert.equal(planned.cargoPrincipalAsMargin,false);assert.equal(planned.realOrderCreated,false);
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
  const ant=createDigitalAnt({lifeId:'DIGITAL_ANT_0001',capital:20,cargoCapacity:100});
  const atms=buildAtmRegistry([{id:'ATM-XYZ',type:'ATM',x:1,y:1,z:1}]);
  const mission=createDeliveryMission({missionId:'XYZ',amount:10,destinationAtmId:'ATM-XYZ',freightOffer:10,demand:1,speedMetersPerSecond:1});
  assert.equal(assignDelivery(ant,mission,atms).ok,true);
  assert.equal(loadCargo(ant).ok,true);
  let result,maxY=ant.y;const phases=new Set();
  for(let i=0;i<40;i++){result=tickDigitalAntDelivery(ant,{deltaMs:100,speed:.02});maxY=Math.max(maxY,ant.y);if(result.flightPhase)phases.add(result.flightPhase);if(result.arrived)break;}
  assert.equal(result.arrived,true);
  assert.ok(maxY>=6,'ATM UFO must climb into the Y axis instead of moving on a plane');
  assert.ok(phases.has('ASCEND'));assert.ok(phases.has('CRUISE_5D'));assert.ok(phases.has('DESCEND'));
  assert.equal(ant.vehicle.type,'ATM_UFO_5D');
  assert.equal(ant.mission.status,'ARRIVED_AWAITING_RECEIPT');
  assert.equal(verifyDeliveryReceipt(ant,{receiptId:null,verified:false}).ok,false);
  const settled=verifyDeliveryReceipt(ant,{receiptId:'QA-RECEIPT-001',verified:true});
  assert.equal(settled.ok,true);
  assert.equal(ant.mission.status,'DELIVERED');
  assert.ok(ant.retirementReserve>=0);
});

test('standard ATM receipt acceptance is fail closed, replay safe and permits an uninsured second trip after reload',()=>{
  const ant=createDigitalAnt({lifeId:'DIGITAL_ANT_ATM_LOOP',capital:20,cargoCapacity:100}),atms=buildAtmRegistry([{id:'ATM-LOOP',type:'ATM',x:1,y:1,z:1}]);
  const runTrip=id=>{const mission=createDeliveryMission({missionId:id,amount:10,destinationAtmId:'ATM-LOOP',freightOffer:10,demand:1,speedMetersPerSecond:1});assert.equal(assignDelivery(ant,mission,atms).ok,true);assert.equal(loadCargo(ant).ok,true);let tick;for(let i=0;i<10;i++){tick=tickDigitalAntDelivery(ant,{deltaMs:100,speed:.2});if(tick.arrived)break}assert.equal(tick.arrived,true)};
  runTrip('ATM-LOOP-ONE');const arrived=structuredClone(ant);
  assert.equal(acceptSimulatedAtmDeliveryReceipt(ant,{destinationAtmId:'ATM-WRONG',accepted:true,now:1000}).reason,'WRONG_ATM_DESTINATION');assert.deepEqual(ant,arrived);
  assert.equal(acceptSimulatedAtmDeliveryReceipt(ant,{destinationAtmId:'ATM-LOOP',receiptId:'WRONG',accepted:true,now:1000}).reason,'RECEIPT_EVIDENCE_MISMATCH');assert.deepEqual(ant,arrived);
  assert.equal(acceptSimulatedAtmDeliveryReceipt(ant,{destinationAtmId:'ATM-LOOP',accepted:false,now:1000}).reason,'SIMULATION_DESTINATION_ACCEPTANCE_REQUIRED');assert.deepEqual(ant,arrived);
  const first=acceptSimulatedAtmDeliveryReceipt(ant,{destinationAtmId:'ATM-LOOP',accepted:true,now:1000});assert.equal(first.ok,true);assert.equal(first.replayed,false);assert.equal(first.policyResolution.status,'NO_POLICY');assert.match(first.receiptId,/^ATM-RECEIPT-[0-9a-f]{8}$/);
  const earned=ant.finance.earned,payroll=ant.payroll.paid,replay=acceptSimulatedAtmDeliveryReceipt(ant,{destinationAtmId:'ATM-LOOP',accepted:true,now:1001});assert.equal(replay.ok,true);assert.equal(replay.replayed,true);assert.equal(replay.receiptId,first.receiptId);assert.equal(ant.finance.earned,earned);assert.equal(ant.payroll.paid,payroll);
  const envelope=JSON.parse(JSON.stringify(createDigitalAntPersistenceEnvelope(ant,{savedAt:1002}))),reloaded=restoreDigitalAntPersistenceEnvelope(envelope,{expectedLifeId:'DIGITAL_ANT_ATM_LOOP'}),reloadReplay=acceptSimulatedAtmDeliveryReceipt(reloaded,{destinationAtmId:'ATM-LOOP',accepted:true,now:1002});assert.equal(reloadReplay.replayed,true);assert.equal(reloadReplay.receiptId,first.receiptId);assert.equal(reloaded.finance.earned,earned);assert.equal(reloaded.payroll.paid,payroll);const second=createDeliveryMission({missionId:'ATM-LOOP-TWO',amount:10,destinationAtmId:'ATM-LOOP',freightOffer:10,demand:1,speedMetersPerSecond:1});assert.equal(assignDelivery(reloaded,second,atms).ok,true);assert.equal(loadCargo(reloaded).ok,true);
});

test('insured ATM delivery closes only a no-open-claim simulation policy and retains resolution evidence',()=>{
  const atms=buildAtmRegistry([{id:'ATM-INSURED-LOOP',type:'ATM',x:1,y:1,z:1}]),build=(id)=>{const ant=createDigitalAnt({lifeId:`DIGITAL_ANT_${id}`,capital:20,cargoCapacity:100}),mission=createDeliveryMission({missionId:id,amount:10,destinationAtmId:'ATM-INSURED-LOOP',freightOffer:10,demand:1,speedMetersPerSecond:1});assert.equal(assignDelivery(ant,mission,atms).ok,true);const quote=quoteCargoInsurance({cargoAmount:10,reserveKaios:100});assert.equal(activateCargoInsurance(ant,quote,{policyId:`POLICY-${id}`,premiumPaidKaios:quote.premiumKaios,reserveSource:'LOCAL_GAME_INSURANCE_RESERVE'}).ok,true);assert.equal(loadCargo(ant).ok,true);return ant},arrive=ant=>{let tick;for(let i=0;i<10;i++){tick=tickDigitalAntDelivery(ant,{deltaMs:100,speed:.2});if(tick.arrived)break}assert.equal(tick.arrived,true)};
  const clean=build('ATM-INSURED-CLEAN');arrive(clean);const accepted=acceptSimulatedAtmDeliveryReceipt(clean,{destinationAtmId:'ATM-INSURED-LOOP',accepted:true,now:2000});assert.equal(accepted.ok,true);assert.equal(accepted.policyResolution.ok,true);assert.equal(accepted.policyResolution.resolution.status,'COMPLETED_NO_OPEN_CLAIM');assert.equal(accepted.policyResolution.resolution.premiumRefundKaios,0);assert.equal(accepted.policyResolution.resolution.assetTransfer,false);assert.equal(accepted.policyResolution.resolution.policyEvidence.policyId,'POLICY-ATM-INSURED-CLEAN');assert.equal(accepted.policyResolution.resolution.policyEvidence.missionId,'ATM-INSURED-CLEAN');assert.deepEqual(accepted.policyResolution.resolution.incidentEvidence,[]);assert.equal(clean.cargoRisk.policy,null);assert.equal(clean.cargoRisk.reserveKaios,0);assert.equal(clean.cargoRisk.resolvedPolicies.length,1);
  const envelope=JSON.parse(JSON.stringify(createDigitalAntPersistenceEnvelope(clean,{savedAt:2001}))),reloaded=restoreDigitalAntPersistenceEnvelope(envelope,{expectedLifeId:'DIGITAL_ANT_ATM-INSURED-CLEAN'}),reloadReplay=acceptSimulatedAtmDeliveryReceipt(reloaded,{destinationAtmId:'ATM-INSURED-LOOP',accepted:true,now:2001});assert.equal(reloadReplay.replayed,true);assert.equal(reloadReplay.policyResolution.replayed,true);assert.equal(reloaded.cargoRisk.resolvedPolicies.length,1);const next=createDeliveryMission({missionId:'ATM-INSURED-NEXT',amount:10,destinationAtmId:'ATM-INSURED-LOOP',freightOffer:10,demand:1,speedMetersPerSecond:1});assert.equal(assignDelivery(reloaded,next,atms).ok,true,'resolved no-claim evidence permits a second trip after reload');
  const blocked=build('ATM-INSURED-OPEN-CLAIM');blocked.cargoRisk.incidents.push({incidentId:'OPEN-CLAIM-1',missionId:blocked.mission.missionId,claimStatus:'CLAIM_ELIGIBLE',evidenceStatus:'LOCAL_GAME_EVIDENCE'});arrive(blocked);const blockedReceipt=acceptSimulatedAtmDeliveryReceipt(blocked,{destinationAtmId:'ATM-INSURED-LOOP',accepted:true,now:3000});assert.equal(blockedReceipt.ok,true);assert.equal(blockedReceipt.policyResolution.reason,'UNRESOLVED_CARGO_POLICY_CLAIM');assert.ok(blocked.cargoRisk.policy,'unresolved claim evidence must not be deleted');assert.ok(blocked.cargoRisk.reserveKaios>0);assert.equal(assignDelivery(blocked,createDeliveryMission({missionId:'ATM-BLOCKED-NEXT',amount:10,destinationAtmId:'ATM-INSURED-LOOP',freightOffer:10}),atms).reason,'ACTIVE_CARGO_POLICY_REQUIRES_RESOLUTION');assert.equal(resolveCargoInsuranceAfterDelivery(blocked,{receiptId:blocked.mission.receiptId,now:3001}).reason,'UNRESOLVED_CARGO_POLICY_CLAIM');
  const blockedEnvelope=JSON.parse(JSON.stringify(createDigitalAntPersistenceEnvelope(blocked,{savedAt:3002}))),blockedReload=restoreDigitalAntPersistenceEnvelope(blockedEnvelope,{expectedLifeId:'DIGITAL_ANT_ATM-INSURED-OPEN-CLAIM'});assert.equal(blockedReload.cargoRisk.policy.policyId,'POLICY-ATM-INSURED-OPEN-CLAIM');assert.equal(blockedReload.cargoRisk.reserveKaios,blocked.cargoRisk.reserveKaios);assert.equal(blockedReload.cargoRisk.incidents[0].claimStatus,'CLAIM_ELIGIBLE');assert.equal(assignDelivery(blockedReload,createDeliveryMission({missionId:'ATM-BLOCKED-RELOAD-NEXT',amount:10,destinationAtmId:'ATM-INSURED-LOOP',freightOffer:10}),atms).reason,'ACTIVE_CARGO_POLICY_REQUIRES_RESOLUTION');
});

test('Digital Ant persistence rejects malformed evidence and review state blocks every cargo mutation',()=>{
  const ant=createDigitalAnt({lifeId:'DIGITAL_ANT_PERSISTENCE',cargoCapacity:100}),envelope=createDigitalAntPersistenceEnvelope(ant,{savedAt:1});
  assert.equal(envelope.revision,0);const invalidRevision=structuredClone(envelope);invalidRevision.revision=-1;assert.throws(()=>restoreDigitalAntPersistenceEnvelope(invalidRevision),/INVALID_REVISION/);
  assert.throws(()=>restoreDigitalAntPersistenceEnvelope(envelope,{expectedLifeId:'OTHER_ANT'}),/DIGITAL_ANT_LIFE_ID_MISMATCH/);
  for(const [field,error] of [['finance',/INVALID_DIGITAL_ANT_FINANCE/],['payroll',/INVALID_DIGITAL_ANT_PAYROLL/],['vehicle',/INVALID_DIGITAL_ANT_VEHICLE/]]){
    const incomplete=structuredClone(envelope);delete incomplete.state[field];assert.throws(()=>restoreDigitalAntPersistenceEnvelope(incomplete,{expectedLifeId:'DIGITAL_ANT_PERSISTENCE'}),error,`missing ${field} must fail closed before later receipt or flight mutation`);
  }
  const badFinance=structuredClone(envelope);delete badFinance.state.finance.earned;assert.throws(()=>restoreDigitalAntPersistenceEnvelope(badFinance),/INVALID_DIGITAL_ANT_FINANCE/);
  const badPayroll=structuredClone(envelope);badPayroll.state.payroll.balance=NaN;assert.throws(()=>restoreDigitalAntPersistenceEnvelope(badPayroll),/INVALID_DIGITAL_ANT_PAYROLL/);
  const objectPayroll=structuredClone(envelope);objectPayroll.state.payroll.currency={asset:'KAIOS'};assert.throws(()=>restoreDigitalAntPersistenceEnvelope(objectPayroll),/INVALID_DIGITAL_ANT_PAYROLL/);
  const badVehicle=structuredClone(envelope);badVehicle.state.vehicle.operationalEnergy=badVehicle.state.vehicle.maxOperationalEnergy+1;assert.throws(()=>restoreDigitalAntPersistenceEnvelope(badVehicle),/INVALID_DIGITAL_ANT_VEHICLE/);
  const objectVehicle=structuredClone(envelope);objectVehicle.state.vehicle.vehicleId={id:'ATM-UFO-0001'};assert.throws(()=>restoreDigitalAntPersistenceEnvelope(objectVehicle),/INVALID_DIGITAL_ANT_VEHICLE/);
  const orphan=structuredClone(envelope);orphan.state.cargoRisk.reserveKaios=10;assert.throws(()=>restoreDigitalAntPersistenceEnvelope(orphan,{expectedLifeId:'DIGITAL_ANT_PERSISTENCE'}),/ORPHAN_DIGITAL_ANT_RESERVE/);
  const orphanClaim=structuredClone(envelope);orphanClaim.state.cargoRisk.incidents.push({incidentId:'ORPHAN-CLAIM',missionId:'MISSING',claimStatus:'CLAIM_ELIGIBLE',evidenceStatus:'LOCAL_GAME_EVIDENCE'});assert.throws(()=>restoreDigitalAntPersistenceEnvelope(orphanClaim,{expectedLifeId:'DIGITAL_ANT_PERSISTENCE'}),/ORPHAN_DIGITAL_ANT_OPEN_CLAIM/);
  const fakeArchive=structuredClone(envelope);fakeArchive.state.cargoRisk.resolvedPolicies.push({policyId:'FAKE',missionId:'MISSING',receiptId:'FAKE-RECEIPT',status:'COMPLETED_NO_OPEN_CLAIM',reserveReleasedKaios:10,premiumRefundKaios:0,evidenceRetained:true,incidentEvidence:[],assetTransfer:false,chainTransfer:false,mainnetWrite:false});assert.throws(()=>restoreDigitalAntPersistenceEnvelope(fakeArchive,{expectedLifeId:'DIGITAL_ANT_PERSISTENCE'}),/INVALID_DIGITAL_ANT_POLICY_EVIDENCE/);
  ant.cargoRisk.persistenceState={status:'REVIEW_REQUIRED',reason:'CORRUPT_STORAGE'};const mission=createDeliveryMission({missionId:'PERSISTENCE-BLOCK',amount:10,destinationAtmId:'ATM-PERSISTENCE',freightOffer:10}),blocked='DIGITAL_ANT_PERSISTENCE_REVIEW_REQUIRED';
  for(const mutate of [
    ()=>activateCargoInsurance(ant,null),()=>previewMissileInterception(ant,{}),()=>resolveMissileInterception(ant,{}),()=>attemptCargoRobbery(ant,{}),()=>settleCargoInsuranceClaim(ant,{}),
    ()=>assignDelivery(ant,mission,[{atmId:'ATM-PERSISTENCE',x:1,y:1,z:1,online:true}]),()=>loadCargo(ant),()=>tickDigitalAntDelivery(ant),
    ()=>verifyDeliveryReceipt(ant,{}),()=>resolveCargoInsuranceAfterDelivery(ant,{}),()=>acceptSimulatedAtmDeliveryReceipt(ant,{}),
    ()=>previewPlayerHomeAcceptance(ant,{}),()=>acceptPlayerHomeDelivery(ant,{})
  ])assert.equal(mutate().reason,blocked);
});

test('Digital Ant pickup requires an assigned mission and preserves every rejected state',()=>{
  const ant=createDigitalAnt({capital:20,cargoCapacity:100});
  const atms=buildAtmRegistry([{id:'ATM-PICKUP',type:'ATM',x:1,y:1,z:1}]);
  const mission=createDeliveryMission({missionId:'PICKUP-GUARD',amount:10,destinationAtmId:'ATM-PICKUP',freightOffer:10});
  assert.equal(loadCargo(ant).reason,'NO_MISSION');
  assert.equal(assignDelivery(ant,mission,atms).ok,true);
  for(const status of ['CREATED','IN_TRANSIT','ARRIVED_AWAITING_RECEIPT','DELIVERED','CRASHING','CRASHED','FAILED']){
    ant.mission.status=status;
    const before=structuredClone(ant);
    assert.equal(loadCargo(ant).reason,'ASSIGNED_DELIVERY_MISSION_REQUIRED',status);
    assert.deepEqual(ant,before,`rejected ${status} pickup must not mutate cargo, mission or accounting`);
  }
  ant.mission.status='ASSIGNED';
  assert.equal(loadCargo(ant).ok,true);
  const loaded=structuredClone(ant);
  assert.equal(loadCargo(ant).reason,'ASSIGNED_DELIVERY_MISSION_REQUIRED');
  assert.deepEqual(ant,loaded);
});

test('Digital Ant assignment cannot overwrite in-flight, waiting or crashed cargo',()=>{
  const atms=buildAtmRegistry([{id:'ATM-ASSIGN',type:'ATM',x:1,y:1,z:1}]);
  const next=createDeliveryMission({missionId:'NEXT-CARGO',cargoKind:'CASH',amount:20,destinationAtmId:'ATM-ASSIGN',freightOffer:10});
  for(const status of ['IN_TRANSIT','ARRIVED_AWAITING_RECEIPT','CRASHING','CRASHED']){
    const ant=createDigitalAnt({capital:20,cargoCapacity:100});
    const first=createDeliveryMission({missionId:'FIRST-CARGO',cargoKind:'GOODS',amount:10,destinationAtmId:'ATM-ASSIGN',freightOffer:10});
    assert.equal(assignDelivery(ant,first,atms).ok,true);assert.equal(loadCargo(ant).ok,true);
    ant.mission.status=status;
    const before=structuredClone(ant);
    assert.equal(assignDelivery(ant,next,atms).reason,'DELIVERY_MISSION_UNRESOLVED',status);
    assert.deepEqual(ant,before,`rejected ${status} assignment must retain original cargo and destination`);
  }
});

test('Digital Ant terminal pickup and reassignment cannot repay the same home receipt',()=>{
  const requester='KAIOS-P-PICKUP-REPLAY',home={x:1,y:0,z:1};
  const ant=createDigitalAnt({capital:20,cargoCapacity:2000});
  const request=createPlayerHomeDeliveryRequest({requestId:'HOME-PICKUP-REPLAY',requesterLifeId:requester,homePlotId:'HOME-PICKUP',homePosition:home,origin:ant,cargoKind:'GOODS',amount:1000,freightFee:8,workerSalary:3});
  assert.equal(assignDelivery(ant,request.mission,[request.destination]).ok,true);assert.equal(loadCargo(ant).ok,true);
  let tick;for(let i=0;i<80;i++){tick=tickDigitalAntDelivery(ant,{deltaMs:100,speed:.2});if(tick.arrived)break}
  assert.equal(tick.arrived,true);
  const acceptance={requesterLifeId:requester,playerPosition:home,paymentEvidence:{ok:true,amount:8,scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'},now:5000};
  assert.equal(acceptPlayerHomeDelivery(ant,acceptance).ok,true);
  const delivered=structuredClone(ant);
  assert.equal(loadCargo(ant).reason,'ASSIGNED_DELIVERY_MISSION_REQUIRED');
  assert.equal(tickDigitalAntDelivery(ant,{deltaMs:100,speed:.2}).reason,'NOT_IN_TRANSIT');
  assert.equal(acceptPlayerHomeDelivery(ant,acceptance).reason,'NOT_AWAITING_RECEIPT');
  assert.equal(assignDelivery(ant,request.mission,[request.destination]).reason,'DELIVERY_MISSION_REPLAY_BLOCKED');
  assert.equal(assignDelivery(ant,structuredClone(ant.mission),[request.destination]).reason,'NEW_DELIVERY_MISSION_REQUIRED');
  assert.deepEqual(ant,delivered);assert.equal(ant.finance.earned,8);assert.equal(ant.payroll.paid,3);
  const next=createDeliveryMission({missionId:'FRESH-AFTER-DELIVERY',amount:10,destinationAtmId:request.destination.atmId,freightOffer:10});
  assert.equal(assignDelivery(ant,next,[request.destination]).ok,true);assert.equal(loadCargo(ant).ok,true);
  assert.equal(ant.finance.earned,8);assert.equal(ant.payroll.paid,3,'a new pickup pays nothing');
});

test('Digital Ant unladen quote changes remain available but pickup never replaces retained cargo',()=>{
  const ant=createDigitalAnt({capital:20,cargoCapacity:100});
  const atms=buildAtmRegistry([{id:'ATM-QUOTE',type:'ATM',x:1,y:1,z:1}]);
  const quote=amount=>createDeliveryMission({missionId:`QUOTE-${amount}`,amount,destinationAtmId:'ATM-QUOTE',freightOffer:10});
  assert.equal(assignDelivery(ant,quote(10),atms).ok,true);
  assert.equal(assignDelivery(ant,quote(20),atms).ok,true);
  assert.equal(ant.mission.amount,20);assert.equal(ant.cargo.amount,0);
  ant.cargo={kind:'GOODS',amount:5,unit:'KAIOS'};
  const before=structuredClone(ant);
  assert.equal(loadCargo(ant).reason,'EXISTING_CARGO_REQUIRES_RESOLUTION');
  assert.equal(assignDelivery(ant,quote(30),atms).reason,'DELIVERY_MISSION_UNRESOLVED');
  assert.deepEqual(ant,before);
});

test('Digital Ant active cargo policy and reserve cannot follow a replacement quote',()=>{
  const ant=createDigitalAnt({capital:20,cargoCapacity:6000});
  const atms=buildAtmRegistry([{id:'ATM-POLICY-BINDING',type:'ATM',x:1,y:1,z:1}]);
  const first=createDeliveryMission({missionId:'POLICY-BOUND-FIRST',amount:1000,destinationAtmId:'ATM-POLICY-BINDING',freightOffer:10});
  assert.equal(assignDelivery(ant,first,atms).ok,true);
  const policyQuote=quoteCargoInsurance({cargoAmount:1000,reserveKaios:1000});
  assert.equal(activateCargoInsurance(ant,policyQuote,{policyId:'POLICY-BOUND-FIRST',premiumPaidKaios:policyQuote.premiumKaios,reserveSource:'LOCAL_GAME_INSURANCE_RESERVE'}).ok,true);
  const insured=structuredClone(ant);
  const replacement=createDeliveryMission({missionId:'POLICY-BOUND-REPLACEMENT',amount:5000,destinationAtmId:'ATM-POLICY-BINDING',freightOffer:10});
  assert.equal(assignDelivery(ant,replacement,atms).reason,'ACTIVE_CARGO_POLICY_REQUIRES_RESOLUTION');
  assert.deepEqual(ant,insured,'rejected replacement must preserve the original mission, policy, reserve and payment evidence');
  const sameIdReplacement=createDeliveryMission({missionId:'POLICY-BOUND-FIRST',amount:5000,destinationAtmId:'ATM-POLICY-BINDING',freightOffer:10});
  assert.equal(assignDelivery(ant,sameIdReplacement,atms).reason,'ACTIVE_CARGO_POLICY_REQUIRES_RESOLUTION');
  assert.deepEqual(ant,insured,'a reused mission id must not move old policy evidence onto changed cargo');
  assert.equal(loadCargo(ant).ok,true);
  assert.equal(ant.cargo.amount,1000);
  assert.equal(ant.cargoRisk.policy.cargoAmount,1000);
  assert.equal(ant.cargoRisk.reserveKaios,1000);
  let arrival;for(let i=0;i<80;i++){arrival=tickDigitalAntDelivery(ant,{deltaMs:100,speed:.2});if(arrival.arrived)break}
  assert.equal(arrival.arrived,true);
  assert.equal(verifyDeliveryReceipt(ant,{receiptId:'POLICY-BOUND-DELIVERY-RECEIPT',verified:true}).ok,true);
  const delivered=structuredClone(ant);
  assert.equal(assignDelivery(ant,replacement,atms).reason,'ACTIVE_CARGO_POLICY_REQUIRES_RESOLUTION');
  assert.deepEqual(ant,delivered,'terminal delivery cannot move unresolved policy, reserve or premium evidence to replacement cargo');
});

test('Digital Ant insurance activation binds the existing exact cargo amount without mutation',()=>{
  const ant=createDigitalAnt({capital:20,cargoCapacity:6000});
  const atms=buildAtmRegistry([{id:'ATM-POLICY-AMOUNT',type:'ATM',x:1,y:1,z:1}]);
  const mission=createDeliveryMission({missionId:'POLICY-AMOUNT-MISSION',amount:1000,destinationAtmId:'ATM-POLICY-AMOUNT',freightOffer:10});
  assert.equal(assignDelivery(ant,mission,atms).ok,true);
  const mismatched=quoteCargoInsurance({cargoAmount:5000,reserveKaios:5000});
  const before=structuredClone(ant);
  assert.equal(activateCargoInsurance(ant,mismatched,{policyId:'UNRELATED-POLICY-ID',premiumPaidKaios:mismatched.premiumKaios,reserveSource:'LOCAL_GAME_INSURANCE_RESERVE'}).reason,'CARGO_POLICY_AMOUNT_MISMATCH');
  assert.deepEqual(ant,before,'rejected amount mismatch cannot create policy, reserve or premium evidence');
});

test('Digital Ant insurance activation cannot replace unresolved policy evidence',()=>{
  const ant=createDigitalAnt({capital:20,cargoCapacity:6000});
  const atms=buildAtmRegistry([{id:'ATM-POLICY-REPLAY',type:'ATM',x:1,y:1,z:1}]);
  const mission=createDeliveryMission({missionId:'POLICY-REPLAY-MISSION',amount:1000,destinationAtmId:'ATM-POLICY-REPLAY',freightOffer:10});
  assert.equal(assignDelivery(ant,mission,atms).ok,true);
  const original=quoteCargoInsurance({cargoAmount:1000,reserveKaios:1000});
  assert.equal(activateCargoInsurance(ant,original,{policyId:'POLICY-REPLAY-ORIGINAL',premiumPaidKaios:original.premiumKaios,reserveSource:'LOCAL_GAME_INSURANCE_RESERVE'}).ok,true);
  const before=structuredClone(ant);
  const replacement=quoteCargoInsurance({cargoAmount:1000,coverageBps:0,reserveKaios:0});
  assert.equal(replacement.mode,'UNDERWRITING_READY');
  assert.equal(activateCargoInsurance(ant,replacement,{policyId:'POLICY-REPLAY-REPLACEMENT',premiumPaidKaios:replacement.premiumKaios,reserveSource:'LOCAL_GAME_INSURANCE_RESERVE'}).reason,'ACTIVE_CARGO_POLICY_REQUIRES_RESOLUTION');
  assert.deepEqual(ant,before,'rejected reactivation cannot replace policy, reserve or premium evidence');
});

test('player action creates one home-delivery demand at the canonical player-home XYZ',()=>{
  const destination=createPlayerHomeDestination({requestId:'HOME-QA-1',requesterLifeId:'KAIOS-P-HOME-1234567890',homePlotId:'KAIOS-H-HOME-1234567890',position:{x:4,y:0,z:-3}});
  assert.equal(destination.ok,true);assert.equal(destination.destination.kind,'PLAYER_HOME');assert.deepEqual({x:destination.destination.x,y:destination.destination.y,z:destination.destination.z},{x:4,y:0,z:-3});
  const request=createPlayerHomeDeliveryRequest({requestId:'HOME-QA-1',requesterLifeId:'KAIOS-P-HOME-1234567890',homePlotId:'KAIOS-H-HOME-1234567890',homePosition:{x:4,y:0,z:-3},origin:{x:0,y:1,z:0},cargoKind:'CASH',amount:1000,movementC:.1});
  assert.equal(request.ok,true);assert.equal(request.request.status,'REQUESTED_BY_PLAYER');assert.equal(request.mission.serviceType,'PLAYER_HOME_CASH_DELIVERY');assert.equal(request.mission.cargoCustody,'RESTRICTED_INVENTORY_WITH_MATCHING_LIABILITY');assert.equal(request.mission.cargoPrincipalRevenue,false);assert.ok(request.request.freightFeeKaios>0);assert.ok(request.request.workerSalaryKaios>0);
});

test('home delivery pays no revenue or salary until arrival, correct-player acceptance and exact local freight payment',()=>{
  const requester='KAIOS-P-HOME-DELIVERY-1234567890',home={x:1,y:0,z:1},ant=createDigitalAnt({lifeId:'DIGITAL_ANT_0001',x:0,y:0,z:0,capital:20,cargoCapacity:2000});
  const request=createPlayerHomeDeliveryRequest({requestId:'HOME-QA-SETTLEMENT',requesterLifeId:requester,homePlotId:'KAIOS-H-HOME-DELIVERY',homePosition:home,origin:ant,cargoKind:'GOODS',amount:1000,movementC:1,freightFee:8,workerSalary:3});
  assert.equal(assignDelivery(ant,request.mission,[request.destination]).ok,true);assert.equal(ant.finance.earned,0);assert.equal(ant.payroll.paid,0);
  assert.equal(loadCargo(ant).ok,true);let tick;for(let i=0;i<80;i++){tick=tickDigitalAntDelivery(ant,{deltaMs:100,speed:.2});if(tick.arrived)break}
  assert.equal(tick.arrived,true);assert.equal(ant.mission.status,'ARRIVED_AWAITING_RECEIPT');assert.equal(ant.finance.earned,0);assert.equal(ant.payroll.paid,0,'arrival alone is not salary evidence');
  assert.equal(previewPlayerHomeAcceptance(ant,{requesterLifeId:'KAIOS-P-WRONG-RECEIVER',playerPosition:home}).reason,'RECEIVER_IDENTITY_MISMATCH');
  assert.equal(previewPlayerHomeAcceptance(ant,{requesterLifeId:requester,playerPosition:{x:99,y:0,z:99}}).reason,'RECEIVER_NOT_AT_HOME');
  assert.equal(acceptPlayerHomeDelivery(ant,{requesterLifeId:requester,playerPosition:home,paymentEvidence:null}).reason,'VERIFIED_LOCAL_FREIGHT_PAYMENT_REQUIRED');
  assert.equal(acceptPlayerHomeDelivery(ant,{requesterLifeId:requester,playerPosition:home,paymentEvidence:{ok:true,amount:'not-an-integer',scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'}}).reason,'VERIFIED_LOCAL_FREIGHT_PAYMENT_REQUIRED');
  const settled=acceptPlayerHomeDelivery(ant,{requesterLifeId:requester,playerPosition:home,paymentEvidence:{ok:true,amount:8,scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'},now:5000});
  assert.equal(settled.ok,true);assert.match(settled.receiptId,/^HOME-RECEIPT-[0-9a-f]{8}$/);assert.equal(settled.accounting.cargoPrincipal,1000);assert.equal(settled.accounting.cargoPrincipalRecognizedAsRevenue,false);assert.equal(settled.accounting.freightRevenue,8);assert.equal(settled.accounting.workerSalary,3);assert.equal(settled.accounting.chainTransfer,false);assert.equal(ant.payroll.paid,3);assert.equal(ant.finance.earned,8);
  assert.equal(acceptPlayerHomeDelivery(ant,{requesterLifeId:requester,playerPosition:home,paymentEvidence:{ok:true,amount:8,scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'}}).reason,'NOT_AWAITING_RECEIPT','receipt cannot be replayed');
});

test('Player Courier salary and freight-share receipt credits local KAIOS exactly once across reload',()=>{
  const data=new Map(),storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)},playerId='KAIOS-P-COURIER-REWARD-1234567890',ledger=createKgenLedger(),store=createSimulationPlayerStore({ledger,storage,playerId});store.activate(null);
  const receiptId='COURIER-RECEIPT-1a2b3c4d';assert.equal(store.recordCourierSettlement({receiptId,reward:4}).ok,true);assert.equal(store.snapshot().kaios,4);assert.equal(store.snapshot().events.COURIER_SETTLEMENT,1);assert.equal(store.recordCourierSettlement({receiptId,reward:4}).reason,'COURIER_REWARD_REPLAY_BLOCKED');
  const reloaded=createSimulationPlayerStore({ledger:createKgenLedger(),storage,playerId});reloaded.activate(null);assert.equal(reloaded.snapshot().kaios,4);assert.equal(reloaded.recordCourierSettlement({receiptId,reward:4}).reason,'COURIER_REWARD_REPLAY_BLOCKED');assert.equal(reloaded.snapshot().claimableKaios,0,'guest-mode courier reward remains local and never becomes a chain claim');
  const insuranceId='COURIER-INSURANCE-1a2b3c4d',paid=reloaded.recordCourierInsurancePayout({receiptId:insuranceId,reward:720});assert.equal(paid.ok,true);assert.equal(paid.replayed,false);assert.equal(reloaded.snapshot().kaios,724);const replay=reloaded.recordCourierInsurancePayout({receiptId:insuranceId,reward:720});assert.equal(replay.ok,true);assert.equal(replay.replayed,true);assert.equal(reloaded.snapshot().kaios,724,'insurance receipt replay never credits twice');assert.equal(reloaded.recordCourierInsurancePayout({receiptId:insuranceId,reward:719}).reason,'COURIER_INSURANCE_RECEIPT_CONFLICT');
});

function courierStorage(){const data=new Map();return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)}}
function courierOffer(overrides={}){return createPlayerCourierOffer({missionId:'COURIER-QA-1',requesterLifeId:'KAIOS-P-REQUESTER-1234567890',cargoId:'CARGO-QA-1',cargoKind:'CASH',cargoAmount:2400,cargoUnit:'KAIOS',origin:{x:0,y:0,z:0},destination:{x:25_000,y:0,z:0},distanceMeters:25_000,risk:.2,freightFeeKaios:8,courierSalaryKaios:3,estimatedDurationMs:1_800_000,createdAt:1_000,...overrides})}

test('Player Courier derives a 30-minute route and remains a background mission during movement, combat, exploration and home play',()=>{
  const duration=estimatePlayerCourierDuration({distanceMeters:25_000,cargoAmount:0,risk:0,missionType:'GOODS',speedMetersPerSecond:13.8888888889,baseDurationMs:0,minDurationMs:1,maxDurationMs:7_200_000});
  assert.ok(Math.abs(duration-1_800_000)<2,'25km at 50km/h must remain approximately thirty minutes');
  const offer=courierOffer();assert.equal(offer.estimatedDurationMs,1_800_000);assert.equal(offer.backgroundMission,true);assert.equal(offer.blocksMovement,false);assert.equal(offer.blocksCombat,false);assert.equal(offer.blocksExploration,false);assert.equal(offer.blocksHome,false);
  const store=createPlayerCourierStore({storage:courierStorage(),now:()=>2_000,monotonicNow:()=>10,sessionId:'SESSION-A'}),mission=store.accept(offer,{courierLifeId:'KAIOS-P-COURIER-1234567890'});
  assert.equal(mission.status,'ACTIVE');assert.equal(mission.cargo.ownerState,'OWNED_BY_COURIER');assert.equal(mission.cargo.ownerLifeId,mission.courierLifeId);assert.equal(mission.dueAt,1_802_000);
});

test('Player Courier reload/background resume uses canonical timestamps and one-shot salary/freight accounting',()=>{
  const storage=courierStorage(),courier='KAIOS-P-COURIER-1234567890';
  const first=createPlayerCourierStore({storage,now:()=>10_000,monotonicNow:()=>100,sessionId:'SESSION-A'}),accepted=first.accept(courierOffer({missionId:'COURIER-RESUME'}),{courierLifeId:courier});
  assert.equal(first.settleDue(accepted.missionId,{courierLifeId:courier,wallNow:accepted.dueAt-1,monoNow:1_799_999}).reason,'DELIVERY_TIMER_ACTIVE');
  const reloaded=createPlayerCourierStore({storage,now:()=>accepted.dueAt,monotonicNow:()=>5,sessionId:'SESSION-B'}),active=reloaded.activeMission(courier);
  assert.equal(active.missionId,accepted.missionId);assert.equal(active.status,'ACTIVE','reload restores the attached cargo instead of resetting the timer');
  const settled=reloaded.settleDue(active.missionId,{courierLifeId:courier,wallNow:active.dueAt,monoNow:5});
  assert.equal(settled.ok,true);assert.equal(settled.mission.status,'DELIVERED');assert.equal(settled.mission.cargo.ownerState,'DELIVERED_TO_DESTINATION');assert.equal(settled.mission.economics.cargoPrincipalRecognizedAsRevenue,false);assert.equal(settled.mission.settlement.salaryKaios,3);assert.equal(settled.mission.settlement.freightShareKaios,1);assert.equal(settled.mission.settlement.rewardKaios,4);assert.equal(settled.mission.settlement.chainTransfer,false);
  assert.throws(()=>reloaded.settleDue(active.missionId,{courierLifeId:courier,wallNow:active.dueAt+1,monoNow:6}),/MISSION_ALREADY_SETTLED/,'salary and freight reward cannot be paid twice');
});

test('Player Courier ordinary combat degrades cargo without theft while explicit Bandit raid transfers canonical ownership once',()=>{
  const storage=courierStorage(),courier='KAIOS-P-COURIER-1234567890',bandit='KAIOS-P-BANDIT-1234567890';
  const store=createPlayerCourierStore({storage,now:()=>10_000,monotonicNow:()=>100,sessionId:'SESSION-A'}),mission=store.accept(courierOffer({missionId:'COURIER-ROBBERY'}),{courierLifeId:courier});
  const damaged=store.applyCombatDamage(mission.missionId,{courierLifeId:courier,damage:99,source:'COMMON_MONSTER',wallNow:20_000});assert.equal(damaged.status,'ACTIVE');assert.equal(damaged.cargo.durability,1);assert.equal(damaged.cargo.ownerLifeId,courier,'ordinary combat never steals cargo');
  assert.throws(()=>store.raid(mission.missionId,{attackerLifeId:bandit,banditMode:false,action:'CARGO_RAID_ACTION',attackPower:100,defensePower:0,distanceMeters:1,replayKey:'RAID-A',wallNow:mission.bandit.attackWindowStartsAt}),/BANDIT_MODE_AND_RAID_ACTION_REQUIRED/);
  assert.throws(()=>store.raid(mission.missionId,{attackerLifeId:bandit,banditMode:true,action:'CARGO_RAID_ACTION',attackPower:100,defensePower:0,replayKey:'RAID-NO-POSITION',wallNow:mission.bandit.attackWindowStartsAt}),/TARGET_POSITION_UNVERIFIED/,'missing positions fail closed');
  assert.throws(()=>store.raid(mission.missionId,{attackerLifeId:bandit,banditMode:true,action:'CARGO_RAID_ACTION',attackPower:100,defensePower:0,distanceMeters:8.01,replayKey:'RAID-TOO-FAR',wallNow:mission.bandit.attackWindowStartsAt}),/TARGET_OUT_OF_LOCAL_RANGE/);
  const robbed=store.raid(mission.missionId,{attackerLifeId:bandit,banditMode:true,action:'CARGO_RAID_ACTION',attackPower:100,defensePower:0,distanceMeters:1,replayKey:'RAID-A',wallNow:mission.bandit.attackWindowStartsAt});
  assert.equal(robbed.mission.status,'ROBBED');assert.equal(robbed.mission.cargo.ownerState,'LOOT_CRATE');assert.equal(robbed.mission.cargo.ownerLifeId,bandit);assert.equal(robbed.mission.settlement.insurancePayoutKaios,0);assert.equal(robbed.mission.realKaiosTransfer,false);
  const preview=store.previewLoot(mission.missionId,{attackerLifeId:bandit});assert.equal(store.snapshot(mission.missionId).mission.cargo.ownerState,'LOOT_CRATE','preview never consumes ownership');assert.throws(()=>store.claimLoot(mission.missionId,{attackerLifeId:bandit}),/BACKPACK_DELIVERY_EVIDENCE_REQUIRED/,'failed backpack delivery leaves loot retryable');assert.equal(store.snapshot(mission.missionId).mission.cargo.ownerState,'LOOT_CRATE');
  const loot=store.claimLoot(mission.missionId,{attackerLifeId:bandit,backpackEvidence:{ok:true,rewardId:preview.receiptId,scope:'LOCAL_PLAYER_BACKPACK'}});assert.equal(loot.cargo.ownerState,'CLAIMED_BY_BANDIT');assert.equal(loot.chainTransfer,false);
  assert.throws(()=>store.claimLoot(mission.missionId,{attackerLifeId:bandit}),/LOOT_NOT_AVAILABLE/,'loot is one shot');assert.throws(()=>store.settleDue(mission.missionId,{courierLifeId:courier,wallNow:mission.dueAt}),/MISSION_ALREADY_SETTLED/,'courier and robber cannot both settle cargo');
});

test('Player Courier insured robbery pays only policy evidence while old 80% test value is not a Lamp tier',()=>{
  const storage=courierStorage(),quote=quoteCargoInsurance({cargoAmount:1000,reserveKaios:1000}),courier='KAIOS-P-COURIER-1234567890';
  const store=createPlayerCourierStore({storage,now:()=>10_000,monotonicNow:()=>100,sessionId:'SESSION-A'}),mission=store.accept(courierOffer({missionId:'COURIER-INSURED',cargoAmount:1000,insuranceQuote:quote}),{courierLifeId:courier});
  assert.equal(mission.insurance.status,'QUOTE_ONLY','underwriting-ready quote is not active coverage');
  assert.throws(()=>store.activateInsurance(mission.missionId,{courierLifeId:courier,paymentEvidence:{ok:true,amount:quote.premiumKaios-1,purpose:'PLAYER_COURIER_INSURANCE_PREMIUM',scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'}}),/EXACT_LOCAL_PREMIUM_EVIDENCE_REQUIRED/);
  const covered=store.activateInsurance(mission.missionId,{courierLifeId:courier,paymentEvidence:{ok:true,amount:quote.premiumKaios,purpose:'PLAYER_COURIER_INSURANCE_PREMIUM',scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'}});assert.equal(covered.insurance.status,'ACTIVE');assert.equal(covered.insurance.premiumPaidKaios,quote.premiumKaios);
  const robbed=store.raid(mission.missionId,{attackerLifeId:'KAIOS-P-BANDIT-INSURED-1234567890',banditMode:true,action:'CARGO_RAID_ACTION',attackPower:100,defensePower:0,distanceMeters:1,replayKey:'RAID-INSURED',wallNow:mission.bandit.attackWindowStartsAt});
  assert.equal(quote.coveredAmountKaios,800);assert.equal(robbed.mission.insurance.coverageBps,8000);assert.equal(robbed.mission.insurance.claimStatus,'APPROVED','robbery approves but does not falsely mark an unpaid claim as paid');assert.equal(robbed.mission.settlement.insurancePayoutKaios,720);assert.equal(robbed.mission.settlement.chainTransfer,false);
  const evidence={ok:true,receiptId:robbed.mission.insurance.payoutReceiptId,rewardKaios:720,purpose:'PLAYER_COURIER_INSURANCE_PAYOUT',scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'},paid=store.confirmInsurancePayout(mission.missionId,{courierLifeId:courier,paymentEvidence:evidence,wallNow:mission.bandit.attackWindowStartsAt+1});assert.equal(paid.insurance.claimStatus,'PAID');assert.throws(()=>store.confirmInsurancePayout(mission.missionId,{courierLifeId:courier,paymentEvidence:evidence}),/INSURANCE_PAYOUT_REPLAY_BLOCKED/);
});

test('Player Courier rejects clock tampering, player switching and stale-tab double settlement',()=>{
  const storage=courierStorage(),courier='KAIOS-P-COURIER-1234567890',offer=courierOffer({missionId:'COURIER-ANTI-CHEAT'}),a=createPlayerCourierStore({storage,now:()=>10_000,monotonicNow:()=>100,sessionId:'SESSION-A'}),mission=a.accept(offer,{courierLifeId:courier});
  assert.throws(()=>a.settleDue(mission.missionId,{courierLifeId:'KAIOS-P-OTHER-1234567890',wallNow:mission.dueAt,monoNow:1_800_100}),/COURIER_LIFE_MISMATCH/);
  const drift=a.settleDue(mission.missionId,{courierLifeId:courier,wallNow:mission.lastWallAt+60_000,monoNow:101});assert.equal(drift.ok,false);assert.equal(drift.reason,'CLOCK_DRIFT_DETECTED');assert.equal(a.snapshot(mission.missionId).mission.status,'CLOCK_REVIEW');
  const cleanStorage=courierStorage(),tabA=createPlayerCourierStore({storage:cleanStorage,now:()=>20_000,monotonicNow:()=>200,sessionId:'TAB-A'}),active=tabA.accept(courierOffer({missionId:'COURIER-TABS'}),{courierLifeId:courier}),tabB=createPlayerCourierStore({storage:cleanStorage,now:()=>active.dueAt,monotonicNow:()=>1,sessionId:'TAB-B'});
  assert.equal(tabA.settleDue(active.missionId,{courierLifeId:courier,wallNow:active.dueAt,monoNow:1_800_200}).ok,true);
  assert.throws(()=>tabB.settleDue(active.missionId,{courierLifeId:courier,wallNow:active.dueAt,monoNow:1}),/REVISION_CONFLICT_RELOAD_REQUIRED/);tabB.reload();assert.equal(tabB.snapshot(active.missionId).mission.status,'DELIVERED');
});

test('white-hole escort preserves raw B4 coordinates, KAIOS principal and review-gated KGEN fee without market conversion',()=>{
  const offer=createWhiteholeEscortDemoOffer({createdAt:1_000,offerLifetimeMs:60_000});
  assert.equal(offer.workId,WHITEHOLE_ESCORT_WORK_ID);assert.equal(offer.mode,'WHITEHOLE_ESCORT_DEMO');assert.equal(offer.cargo.amount,50_000);assert.equal(offer.cargo.unit,'KAIOS');
  assert.deepEqual({rawK:offer.routeAddress.origin.rawK,band:offer.routeAddress.origin.band,alpha:offer.routeAddress.origin.alpha},{rawK:'0.00012345',band:'B4',alpha:1.2345});
  assert.deepEqual({rawK:offer.routeAddress.destination.rawK,band:offer.routeAddress.destination.band,alpha:offer.routeAddress.destination.alpha},{rawK:'0.00018921',band:'B4',alpha:1.8921});
  assert.equal(offer.routeAddress.origin.registeredInCurrentUniverseMap,false);assert.equal(offer.routeAddress.destination.registeredInCurrentUniverseMap,false);assert.equal(offer.routeAddress.canonicalLandRouteClaimed,false);assert.equal(offer.routeAddress.localAnimationCoordinatesAreModelDistance,false);assert.equal(offer.distanceMeters,1.496810990052);assert.deepEqual(offer.routeAddress.linearKAxisModel,{deltaK:'0.00006576',distanceMeters:1.496810990052,sameAxisAssumption:true,otherAxesEqualAssumption:true,classification:'LINEAR_K_AXIS_MODEL_DISTANCE_NOT_CADASTRAL_ROUTE_ARC_OR_FULL_FLIGHT'});
  assert.equal(offer.economics.cargoPrincipalAsset,'KAIOS');assert.equal(offer.economics.cargoPrincipalRecognizedAsRevenue,false);assert.equal(offer.economics.cargoPrincipalEligibleAsTradingMargin,false);
  assert.equal(offer.economics.freightRevenueAsset,'KGEN');assert.equal(offer.economics.freightRevenue,10);assert.equal(offer.economics.freightRevenueReceivable.status,'REVIEW_GATED_SIMULATED_RECEIVABLE');assert.equal(offer.economics.freightRevenueReceivable.paid,false);
  assert.equal(offer.whiteholeRule.classification,'SUPPLY_MASS_RULE_NOT_MARKET_PRICE');assert.equal(offer.whiteholeRule.usedForFreightConversion,false);assert.equal(offer.economics.whiteholeMarketConversionUsed,false);
  assert.equal(offer.escort.speedUnit,'LOCAL_ANIMATION_UNITS_PER_SECOND');assert.equal(offer.escort.physicalCSpeedClaim,null,'local progress must not claim a physical C speed');
  assert.equal(offer.quoteReview.formalWorkerAck,false);assert.equal(offer.customerJob.formalCustomerIdentity,false);
});

test('white-hole escort start, movement, destination acceptance and receipt are persistent and replay safe',()=>{
  const storage=courierStorage(),courier='KAIOS-P-WHITEHOLE-COURIER-1234567890',ledger=createKgenLedger(25),ledgerBefore=structuredClone(ledger);
  const pending=createWhiteholeEscortDemoOffer({createdAt:1_000,offerLifetimeMs:60_000}),reviewed=reviewWhiteholeEscortDemoOffer(pending,{reviewedAt:1_500});
  const first=createPlayerCourierStore({storage,now:()=>2_000,monotonicNow:()=>10,sessionId:'WHITEHOLE-A'});
  assert.throws(()=>first.startWhiteholeEscort(pending,{courierLifeId:courier,wallNow:2_000}),/SIMULATION_QUOTE_REVIEW_REQUIRED/);
  const started=first.startWhiteholeEscort(reviewed,{courierLifeId:courier,wallNow:2_000,monoNow:10});assert.equal(started.ok,true);assert.equal(started.replayed,false);assert.equal(started.mission.cargo.ownerState,'OWNED_BY_COURIER');
  const reloaded=createPlayerCourierStore({storage,now:()=>2_100,monotonicNow:()=>1,sessionId:'WHITEHOLE-B'}),replay=reloaded.startWhiteholeEscort(reviewed,{courierLifeId:courier,wallNow:2_100,monoNow:1});
  assert.equal(replay.replayed,true);assert.equal(Object.keys(reloaded.snapshot().missions).length,1,'start/reload replay never duplicates the principal or fee');
  const selected=reloaded.chooseWhiteholeEscortAction(WHITEHOLE_ESCORT_WORK_ID,{courierLifeId:courier,action:'LONG_DUEL'});assert.equal(selected.escort.tradingDirection,'LONG');assert.equal(selected.escort.tradingOwner,'kgen-margin-runtime.mjs');assert.equal(selected.escort.cargoPrincipalAsTradingMargin,false);assert.equal(selected.escort.realOrderCreated,false);assert.deepEqual(ledger,ledgerBefore,'choosing a duel never touches the existing KGEN margin ledger');
  let moved;for(let i=1;i<=5;i++)moved=reloaded.advanceWhiteholeEscort(WHITEHOLE_ESCORT_WORK_ID,{courierLifeId:courier,deltaMs:1000,wallNow:2_000+i*1_000});
  assert.equal(moved.arrived,true);assert.equal(moved.mission.status,'ARRIVED_AWAITING_RECEIPT');assert.equal(moved.mission.escort.position.x,18);assert.equal(moved.mission.cargo.amount,50_000);
  assert.throws(()=>reloaded.advanceWhiteholeEscort(WHITEHOLE_ESCORT_WORK_ID,{courierLifeId:'KAIOS-P-WHITEHOLE-ATTACKER-123456',deltaMs:1000,wallNow:8_000}),/COURIER_LIFE_MISMATCH/,'arrived replay remains identity-gated');
  assert.throws(()=>reloaded.acceptWhiteholeEscortDestination(WHITEHOLE_ESCORT_WORK_ID,{courierLifeId:courier,destinationRawK:'18921',playerPosition:{x:18,y:1,z:0},wallNow:8_000}),/WRONG_WHITEHOLE_DESTINATION/);
  assert.throws(()=>reloaded.acceptWhiteholeEscortDestination(WHITEHOLE_ESCORT_WORK_ID,{courierLifeId:courier,destinationRawK:'0.00018921',playerPosition:{x:0,y:1,z:0},wallNow:8_000}),/DESTINATION_POSITION_MISMATCH/);
  const accepted=reloaded.acceptWhiteholeEscortDestination(WHITEHOLE_ESCORT_WORK_ID,{courierLifeId:courier,destinationRawK:'0.00018921',playerPosition:{x:18,y:1,z:0},wallNow:8_000});
  assert.equal(accepted.ok,true);assert.match(accepted.receiptId,/^WHITEHOLE-RECEIPT-[0-9a-f]{8}$/);assert.equal(accepted.mission.settlement.cargoPrincipal.amount,50_000);assert.equal(accepted.mission.settlement.cargoPrincipal.usedForTradingLoss,false);assert.deepEqual(accepted.mission.settlement.freightRevenueReceivable,{asset:'KGEN',amount:10,status:'REVIEW_GATED_SIMULATED_RECEIVABLE',paid:false,cashReceived:false,recognizedAsCash:false});assert.equal(accepted.mission.settlement.chainTransfer,false);assert.equal(accepted.mission.settlement.mainnetWrite,false);
  const receiptReplay=reloaded.acceptWhiteholeEscortDestination(WHITEHOLE_ESCORT_WORK_ID,{courierLifeId:courier,destinationRawK:'0.00018921',playerPosition:{x:18,y:1,z:0},wallNow:8_001});assert.equal(receiptReplay.replayed,true);assert.equal(receiptReplay.receiptId,accepted.receiptId);assert.equal(reloaded.snapshot().missions[WHITEHOLE_ESCORT_WORK_ID].settlement.receiptId,accepted.receiptId);assert.deepEqual(ledger,ledgerBefore);
  assert.throws(()=>reloaded.acceptWhiteholeEscortDestination(WHITEHOLE_ESCORT_WORK_ID,{courierLifeId:'KAIOS-P-WHITEHOLE-ATTACKER-123456',destinationRawK:'0.00018921',playerPosition:{x:18,y:1,z:0},wallNow:8_002}),/COURIER_LIFE_MISMATCH/,'receipt replay must not disclose to another courier');
  assert.throws(()=>reloaded.acceptWhiteholeEscortDestination(WHITEHOLE_ESCORT_WORK_ID,{courierLifeId:courier,destinationRawK:'WRONG',playerPosition:{x:18,y:1,z:0},wallNow:8_002}),/WRONG_WHITEHOLE_DESTINATION/,'receipt replay remains destination-gated');
  assert.throws(()=>reloaded.acceptWhiteholeEscortDestination(WHITEHOLE_ESCORT_WORK_ID,{courierLifeId:courier,destinationRawK:'0.00018921',playerPosition:{x:999,y:999,z:999},wallNow:8_002}),/DESTINATION_POSITION_MISMATCH/,'receipt replay remains position-gated');
});

test('white-hole escort expires and fails closed without earning the KGEN fee',()=>{
  const courier='KAIOS-P-WHITEHOLE-EXPIRED-1234567890',offer=createWhiteholeEscortDemoOffer({createdAt:1_000,offerLifetimeMs:60_000});
  assert.throws(()=>reviewWhiteholeEscortDemoOffer(offer,{reviewedAt:61_001}),/WHITEHOLE_OFFER_EXPIRED/);
  const reviewed=reviewWhiteholeEscortDemoOffer(offer,{reviewedAt:2_000}),store=createPlayerCourierStore({storage:courierStorage(),now:()=>3_000,monotonicNow:()=>1,sessionId:'WHITEHOLE-EXPIRY'}),started=store.startWhiteholeEscort(reviewed,{courierLifeId:courier,wallNow:3_000});
  store.chooseWhiteholeEscortAction(WHITEHOLE_ESCORT_WORK_ID,{courierLifeId:courier,action:'ESCORT'});const expired=store.advanceWhiteholeEscort(WHITEHOLE_ESCORT_WORK_ID,{courierLifeId:courier,deltaMs:1000,wallNow:started.mission.dueAt+1});
  assert.equal(expired.ok,false);assert.equal(expired.reason,'MISSION_EXPIRED');assert.equal(expired.mission.status,'FAILED');assert.equal(expired.mission.settlement.freightRevenueReceivable.status,'NOT_EARNED');assert.equal(expired.mission.settlement.cargoPrincipal.usedForTradingLoss,false);assert.equal(expired.mission.settlement.chainTransfer,false);
});

test('Cargo Risk Desk quotes exact integer KAIOS and never uses cargo principal as insurance reserve',()=>{
  const quote=quoteCargoInsurance({cargoAmount:1000,reserveKaios:0});
  assert.equal(Number.isSafeInteger(quote.premiumKaios),true);
  assert.equal(quote.mode,'BROKERAGE_QUOTE_ONLY');
  assert.equal(quote.coveredAmountKaios,800);
  assert.equal(quote.deductibleKaios,80);
  assert.equal(quote.maxClaimKaios,720);
  assert.equal(quote.cargoPrincipalAsReserve,false);
  const funded=quoteCargoInsurance({cargoAmount:1000,reserveKaios:1000});
  assert.equal(funded.mode,'UNDERWRITING_READY');
  const ant=createDigitalAnt();
  assert.equal(activateCargoInsurance(ant,funded,{premiumPaidKaios:funded.premiumKaios,reserveSource:'LOCAL_GAME_INSURANCE_RESERVE'}).reason,'MISSION_REQUIRED');
});

test('XYZ-opposed player can raid only the declared local risk pool while restricted cargo principal stays unchanged',()=>{
  const ant=createDigitalAnt({lifeId:'DIGITAL_ANT_0001',x:0,y:0,z:0,capital:20,cargoCapacity:1000});
  const mission=createDeliveryMission({missionId:'RAID-GAME',amount:1000,destinationAtmId:'ATM-R',freightOffer:10,demand:1,speedMetersPerSecond:1,gameplayRiskPool:25,maxRaidLoss:100});
  assert.equal(assignDelivery(ant,mission,[{atmId:'ATM-R',x:8,y:1,z:0,online:true}]).ok,true);
  assert.equal(loadCargo(ant).ok,true);
  ant.mission.lastMovement={x:1,y:1,z:0};
  const quote=quoteCargoInsurance({cargoAmount:1000,reserveKaios:1000});
  assert.equal(activateCargoInsurance(ant,quote,{policyId:'LOCAL-RAID-GAME',premiumPaidKaios:quote.premiumKaios,reserveSource:'LOCAL_GAME_INSURANCE_RESERVE'}).ok,true);
  const beforeCargo=structuredClone(ant.cargo);
  const result=attemptCargoRobbery(ant,{attackerLifeId:'KAIOS-P-RAIDER-1234567890',attackerController:'PLAYER_LOCAL',playerPosition:{x:1,y:0,z:0},playerMovement:{x:-1,y:-1,z:0},attackPower:100,energySpent:3,replayKey:'raid-game:1',now:2000});
  assert.equal(result.ok,true);assert.equal(result.success,true);assert.ok(result.rewardKaios>0);assert.ok(result.rewardKaios<=25);
  assert.equal(result.cargoPrincipalChanged,false);assert.deepEqual(ant.cargo,beforeCargo);assert.equal(result.mainnetWrite,false);
  assert.equal(ant.mission.gameplayRiskPoolRemaining,25-result.rewardKaios);
  const replay=attemptCargoRobbery(ant,{attackerLifeId:'KAIOS-P-RAIDER-1234567890',playerPosition:{x:1,y:0,z:0},playerMovement:{x:-1,y:0,z:0},attackPower:100,energySpent:3,replayKey:'raid-game:1',now:5000});
  assert.equal(replay.reason,'RAID_REPLAY_BLOCKED');
  const claim=settleCargoInsuranceClaim(ant,{incidentId:result.incident.incidentId});
  assert.equal(claim.ok,true);assert.equal(claim.payoutKaios,20);assert.equal(claim.mainnetWrite,false);
  assert.equal(settleCargoInsuranceClaim(ant,{incidentId:result.incident.incidentId}).reason,'CLAIM_REPLAY_BLOCKED');
});

test('Cargo raid fails closed without proximity, energy, distinct identity, or opposing XYZ movement',()=>{
  const build=()=>{const ant=createDigitalAnt({lifeId:'DIGITAL_ANT_0001',x:0,y:0,z:0,cargoCapacity:100});const mission=createDeliveryMission({missionId:'RAID-GATE',amount:10,destinationAtmId:'ATM-R',freightOffer:10,demand:1,speedMetersPerSecond:1,gameplayRiskPool:5});assignDelivery(ant,mission,[{atmId:'ATM-R',x:8,y:1,z:0,online:true}]);loadCargo(ant);ant.mission.lastMovement={x:1,y:0,z:0};return ant};
  assert.equal(attemptCargoRobbery(build(),{attackerLifeId:'DIGITAL_ANT_0001',playerPosition:{x:0,y:0,z:0},playerMovement:{x:-1},attackPower:10,energySpent:1,replayKey:'same'}).reason,'DISTINCT_ATTACKER_LIFE_REQUIRED');
  assert.equal(attemptCargoRobbery(build(),{attackerLifeId:'KAIOS-P-OTHER-1234567890',playerPosition:{x:99,y:0,z:0},playerMovement:{x:-1},attackPower:10,energySpent:1,replayKey:'far'}).reason,'OUT_OF_RAID_RANGE');
  assert.equal(attemptCargoRobbery(build(),{attackerLifeId:'KAIOS-P-OTHER-1234567890',playerPosition:{x:1,y:0,z:0},playerMovement:{x:1},attackPower:10,energySpent:1,replayKey:'aligned'}).reason,'OPPOSING_XYZ_MOVEMENT_REQUIRED');
  assert.equal(attemptCargoRobbery(build(),{attackerLifeId:'KAIOS-P-OTHER-1234567890',playerPosition:{x:1,y:0,z:0},playerMovement:{x:-1},attackPower:10,energySpent:0,replayKey:'energy'}).reason,'RAID_ENERGY_REQUIRED');
});

test('KAIOS missile separates impact energy from drag and uses opposite C relative velocity',()=>{
  const vacuum=calculateMissileImpact({kaiosMass:1,attackC:-1,targetC:1,targetDirection:{x:1,y:0,z:0},flightDistanceMeters:20});
  assert.equal(vacuum.ok,true);assert.equal(vacuum.energyFormula,'CLASSICAL_0_5_M_V2');assert.equal(vacuum.dragWorkJ,0);assert.ok(vacuum.kineticEnergyJ>0);assert.ok(vacuum.operationalDamage>0);
  const air=calculateMissileImpact({kaiosMass:1,attackC:-1,targetC:1,targetDirection:{x:1,y:0,z:0},flightDistanceMeters:20,atmosphereDensityKgM3:1.225});
  assert.ok(air.dragWorkJ>0);assert.ok(air.impactEnergyJ<vacuum.impactEnergyJ);assert.equal(air.dragModel,'SEPARATE_EN_ROUTE_LOSS');
  assert.equal(calculateMissileImpact({kaiosMass:1,attackC:1,targetC:1}).reason,'OPPOSITE_C_REQUIRED');
});

test('missile interception consumes declared game ammunition, disables propulsion, crashes and yields bounded local loot',()=>{
  const ant=createDigitalAnt({lifeId:'DIGITAL_ANT_0001',x:0,y:6,z:0,cargoCapacity:1000});
  const mission=createDeliveryMission({missionId:'MISSILE-GAME',amount:1000,destinationAtmId:'ATM-M',freightOffer:10,demand:1,speedMetersPerSecond:1,movementC:1,gameplayRiskPool:25,maxRaidLoss:100});
  assert.equal(assignDelivery(ant,mission,[{atmId:'ATM-M',x:8,y:1,z:0,online:true}]).ok,true);assert.equal(loadCargo(ant).ok,true);ant.mission.lastMovement={x:1,y:0,z:0};
  const preview=previewMissileInterception(ant,{attackerLifeId:'KAIOS-P-MISSILE-1234567890',playerPosition:{x:1,y:6,z:0},kaiosMass:100,availableKaios:100,attackC:-1,replayKey:'missile:1',now:2000});
  assert.equal(preview.ok,true);const result=resolveMissileInterception(ant,preview);
  assert.equal(result.destroyed,true);assert.equal(result.ammoConsumedKaios,100);assert.equal(ant.vehicle.operationalEnergy,0);assert.equal(ant.vehicle.propulsion,'OFFLINE');assert.equal(ant.mission.status,'CRASHING');assert.equal(result.rewardKaios,0,'loot remains pending until ground impact');
  let tick;for(let i=0;i<20;i++){tick=tickDigitalAntDelivery(ant,{deltaMs:100});if(tick.crashed)break}
  assert.equal(tick.crashed,true);assert.equal(ant.mission.status,'CRASHED');assert.equal(tick.incident.outcome,'UFO_CRASHED_LOCAL_LOOT');assert.equal(tick.incident.rewardKaios,25);assert.deepEqual(tick.incident.loot.map(item=>item.treasureClass),['KUFO_GAME_FUEL_FRAGMENT','KSHIP_GAME_FEED_MASS','UFO_TECH_FRAGMENT']);assert.equal(tick.incident.custodyPrincipalChanged,false);assert.equal(tick.incident.chainBalanceChanged,false);
});

test('missile interception fails closed without local KAIOS, range, opposite C, or fresh replay key',()=>{
  const build=()=>{const ant=createDigitalAnt({lifeId:'DIGITAL_ANT_0001',x:0,y:1,z:0,cargoCapacity:100});const mission=createDeliveryMission({missionId:'MISSILE-GATE',amount:10,destinationAtmId:'ATM-M',freightOffer:10,demand:1,speedMetersPerSecond:1,movementC:1,gameplayRiskPool:5});assignDelivery(ant,mission,[{atmId:'ATM-M',x:8,y:1,z:0,online:true}]);loadCargo(ant);ant.mission.lastMovement={x:1,y:0,z:0};return ant};
  assert.equal(previewMissileInterception(build(),{attackerLifeId:'KAIOS-P-MISSILE-1234567890',playerPosition:{x:1,y:1,z:0},kaiosMass:1,availableKaios:0,attackC:-1,replayKey:'no-money'}).reason,'INSUFFICIENT_LOCAL_KAIOS_AMMUNITION');
  assert.equal(previewMissileInterception(build(),{attackerLifeId:'KAIOS-P-MISSILE-1234567890',playerPosition:{x:999,y:1,z:0},kaiosMass:1,availableKaios:1,attackC:-1,replayKey:'far'}).reason,'OUT_OF_MISSILE_RANGE');
  assert.equal(previewMissileInterception(build(),{attackerLifeId:'KAIOS-P-MISSILE-1234567890',playerPosition:{x:1,y:1,z:0},kaiosMass:1,availableKaios:1,attackC:1,replayKey:'same-c'}).reason,'OPPOSITE_C_REQUIRED');
  const ant=build(),p=previewMissileInterception(ant,{attackerLifeId:'KAIOS-P-MISSILE-1234567890',playerPosition:{x:1,y:1,z:0},kaiosMass:1,availableKaios:1,attackC:-1,replayKey:'once',now:3000});assert.equal(p.ok,true);resolveMissileInterception(ant,p);assert.equal(previewMissileInterception(ant,{attackerLifeId:'KAIOS-P-MISSILE-1234567890',playerPosition:{x:1,y:1,z:0},kaiosMass:1,availableKaios:1,attackC:-1,replayKey:'once',now:5000}).reason,'RAID_REPLAY_BLOCKED');
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

// LivingMarketZone local prototype. Append-only: existing Player Life/Courier
// regression sections above remain byte-for-byte identical to source main.
import {LIVING_MARKET_TRAINING_RULES,livingMarketDecisionSnapshot,configureLivingMarketLife,interactLivingMarketLives} from '../runtime/market-life-runtime.mjs';

const livingQuote=(at,price,extra={})=>({status:'LIVE',source:'DETERMINISTIC_GAME_FIXTURE',receivedAt:at,markets:[{axis:'KX',symbol:'BTCUSDT',price}],...extra});
const livingFeed=(life,at,price,extra={})=>observeTrainingMarket(life,livingQuote(at,price,extra),{now:at});
const livingTestEntities=new WeakMap();
function livingActor(id,profile='MOMENTUM',options={}){
  const life=createMarketLife({lifeId:id,species:profile==='ADAPTIVE_BOSS'?'BULL_DEMON':profile==='COUNTERTREND'?'FIRE_WISP':'STONE_APE',markets:['BTCUSDT'],capital:25});
  const sourceEntity={lifeId:id,marketLife:life,sourceManaged:false,simulationOnly:true,
    sourceMeta:{scope:'LOCAL_GAME_NPC_ONLY',sourceType:'WORLD_EVENT',sourceEventId:`fixture:${id}`}};
  livingTestEntities.set(life,sourceEntity);
  assert.equal(configureLivingMarketLife(life,{sourceEntity,sourceEventId:`fixture:${id}`,profile,energyUnits:10,massUnits:4,...options}).ok,true);
  return life;
}
function livingResolve(life,exit){
  const p=life.training.pending;assert.ok(p);
  const hold=life.training.quotes[p.market];
  for(let at=life.training.lastAt+5000;at<p.deadline;at+=5000)livingFeed(life,at,hold);
  livingFeed(life,p.deadline,exit);return p;
}
function livingCapability(actor,target,actions=['FOLLOW','ALLY','COMPETE','FLEE','ABSORB']){
  return {scope:'LOCAL_GAME_NPC_INTERACTION',actorLifeId:actor.lifeId,targetLifeId:target.lifeId,
    actorSourceEventId:actor.livingMarket.sourceEventId,targetSourceEventId:target.livingMarket.sourceEventId,
    actorRevision:actor.livingMarket.revision,targetRevision:target.livingMarket.revision,sequence:actor.livingMarket.lastInteractionSequence+1,
    actions,issuedAt:0,expiresAt:1000000,maxEnergyUnits:10,maxMassUnits:4};
}

test('LivingMarket three market lives and one Boss derive distinct choices without any movement authority',()=>{
  const profiles=['MOMENTUM','COUNTERTREND','CAUTIOUS','ADAPTIVE_BOSS'];
  const actors=profiles.map((p,i)=>livingActor(`ZONE-${i}`,p));
  const originals=actors.map(l=>({capital:l.capital,positions:structuredClone(l.positions),world:structuredClone(l.world)}));
  for(const l of actors){livingFeed(l,1000,100);livingFeed(l,6000,100.01)}
  assert.deepEqual(actors.map(l=>livingMarketDecisionSnapshot(l,{now:6000}).decision),['LONG','SHORT','WAIT','LONG']);
  for(const [i,l] of actors.entries()){
    const v=livingMarketDecisionSnapshot(l,{now:6000});
    assert.equal(v.motion.status,'NAVIGATION_DEPENDENCY_REQUIRED');assert.equal(v.motion.controlsPlayer,false);assert.equal(v.motion.movesCoordinates,false);
    assert.equal(v.fullGA600,'NOT_INTEGRATED');assert.equal(v.automatesTrading,false);assert.equal(v.profitPromise,false);
    assert.deepEqual({capital:l.capital,positions:l.positions,world:l.world},originals[i]);
    assert.ok(v.motion.requestedSpeedFactor>=0&&v.motion.requestedSpeedFactor<=1);
  }
  assert.equal(livingMarketDecisionSnapshot(actors[2],{now:6000}).motion.requestedSpeedFactor,0);
  assert.equal(livingMarketDecisionSnapshot(actors[3],{now:6000}).boss.affectsRealMarket,false);
});

test('LivingMarket freezes issuance provenance, resolves after its horizon and excludes hindsight edits',()=>{
  const life=livingActor('CAUSAL');livingFeed(life,1000,100);livingFeed(life,6000,101);
  const p=life.training.pending;assert.equal(p.deadline,66000);assert.equal(p.issuedAt,6000);assert.equal(p.confidence,null);
  assert.throws(()=>{p.sign=-1},TypeError);assert.throws(()=>{p.price=90},TypeError);
  for(let at=11000;at<66000;at+=5000)livingFeed(life,at,102);
  assert.equal(life.growth.predictionCount,0);assert.equal(life.training.session.resolved,0);
  livingFeed(life,66000,103);
  const settled=life.training.audit.find(e=>e.type==='PREDICTION_SETTLED');
  assert.equal(settled.predictionId,p.id);assert.equal(settled.entry,101);assert.equal(settled.exit,103);
  assert.equal(settled.deadline,66000);assert.equal(settled.exitAt,66000);assert.equal(settled.settlementDelayMs,0);
  assert.equal(settled.source,'DETERMINISTIC_GAME_FIXTURE');assert.equal(settled.confidenceAtIssue,null);
  assert.equal(life.training.audit[0].timeBasis,'HOST_RECEIVED_AT');
  const snapshot=livingMarketDecisionSnapshot(life,{now:66000});snapshot.audit.events[0].price=1;
  assert.equal(life.training.audit[0].price,101,'snapshot is detached from owner state');
});

test('LivingMarket identical replay cannot score twice; conflicting replay invalidates and preserves last-good evidence',()=>{
  const life=livingActor('REPLAY');livingFeed(life,1000,100);livingFeed(life,6000,101);
  const p=life.training.pending,events=life.training.audit.length;
  livingFeed(life,6000,101);assert.equal(life.training.pending,p);assert.equal(life.training.audit.length,events);
  assert.equal(livingFeed(life,6000,1000),null);
  assert.equal(life.training.pending,null);assert.equal(life.training.quotes.BTCUSDT,101);
  assert.equal(livingMarketDecisionSnapshot(life,{now:6000}).status,'INVALID');
  assert.equal(life.training.session.invalidated,1);assert.equal(life.growth.predictionCount,0);
  assert.equal(livingFeed(life,11000,102).decision,'WAIT','recovery must warm up, not reuse quarantined signal');
  assert.equal(livingFeed(life,16000,103).decision,'LONG');
});

test('LivingMarket WAIT, STALE, INVALID and future/clock failures never become actionable LIVE',()=>{
  const cases=[
    {name:'WAIT',batch:livingQuote(11000,101,{status:'WAIT'}),now:11000,status:'WAIT'},
    {name:'STALE',batch:livingQuote(11000,101,{status:'STALE'}),now:11000,status:'STALE'},
    {name:'unknown status',batch:livingQuote(11000,101,{status:'PENDING'}),now:11000,status:'INVALID'},
    {name:'expired',batch:livingQuote(11000,101),now:26001,status:'STALE'},
    {name:'future',batch:livingQuote(11000,101),now:10000,status:'INVALID'},
    {name:'clock reversal',batch:livingQuote(7000,101),now:5000,status:'INVALID'},
    {name:'NaN clock',batch:livingQuote(11000,101),now:NaN,status:'STALE'},
    {name:'negative timestamp',batch:livingQuote(-1,101),now:11000,status:'INVALID'},
    {name:'missing batch',batch:livingQuote(11000,101,{markets:null}),now:11000,status:'INVALID'},
    {name:'zero price',batch:livingQuote(11000,0),now:11000,status:'INVALID'},
    {name:'infinite price',batch:livingQuote(11000,Infinity),now:11000,status:'INVALID'},
    {name:'numeric string',batch:livingQuote(11000,'102'),now:11000,status:'INVALID'},
    {name:'invalid axis',batch:livingQuote(11000,102,{markets:[{axis:'W',symbol:'BTCUSDT',price:102}]}),now:11000,status:'INVALID'},
    {name:'duplicate market',batch:livingQuote(11000,102,{markets:[{axis:'KX',symbol:'BTCUSDT',price:102},{axis:'KY',symbol:'BTCUSDT',price:103}]}),now:11000,status:'INVALID'},
  ];
  for(const c of cases){
    const life=livingActor(c.name);livingFeed(life,1000,100);livingFeed(life,6000,101);
    assert.equal(observeTrainingMarket(life,c.batch,{now:c.now}),null,c.name);
    const view=livingMarketDecisionSnapshot(life,{now:c.now});
    assert.equal(view.decision,'WAIT',c.name);assert.notEqual(view.status,'LIVE',c.name);
    assert.equal(view.motion.requestedSpeedFactor,0,c.name);assert.equal(life.training.pending,null,c.name);
    assert.equal(view.sessionMetrics.predictions,0,c.name);assert.equal(life.training.session.invalidated,1,c.name);
  }
});

test('LivingMarket source changes and missing markets invalidate whole predictions rather than cherry-pick outcomes',()=>{
  const life=livingActor('SOURCE');livingFeed(life,1000,100);livingFeed(life,6000,101);
  const r=livingFeed(life,11000,999,{source:'OTHER_SOURCE'});
  assert.equal(r.decision,'WAIT');assert.equal(r.status,'WAIT');assert.equal(life.training.pending,null);
  assert.ok(life.training.audit.some(e=>e.reason==='SOURCE_CHANGED'));
  const multi=createMarketLife({lifeId:'MULTI',markets:['BTCUSDT','ETHUSDT']});
  const batch=at=>({receivedAt:at,status:'LIVE',source:'FIXTURE',markets:[{axis:'KX',symbol:'BTCUSDT',price:at},{axis:'KY',symbol:'ETHUSDT',price:100}]});
  observeTrainingMarket(multi,batch(1000),{now:1000});observeTrainingMarket(multi,batch(6000),{now:6000});
  const partial=batch(11000);partial.markets.pop();
  assert.equal(observeTrainingMarket(multi,partial,{now:11000}),null);
  assert.equal(multi.training.pending,null);assert.equal(multi.training.session.invalidated,1);
});

test('LivingMarket gap invalidation is one-shot; a fresh recovery cannot score the discarded horizon',()=>{
  const life=livingActor('GAP');livingFeed(life,1000,100);livingFeed(life,6000,101);
  assert.equal(livingFeed(life,66000,200).decision,'WAIT');assert.equal(life.training.session.invalidated,1);
  assert.equal(life.training.session.resolved,0);assert.equal(life.growth.wins,0);
  for(let i=0;i<500;i++)observeTrainingMarket(life,livingQuote(66000,200,{status:'STALE'}),{now:66000+i});
  assert.equal(life.training.session.invalidated,1);assert.equal(life.training.audit.length,2,'stale render ticks do not flood history');
  assert.equal(livingFeed(life,71000,201).decision,'WAIT');assert.equal(livingFeed(life,76000,202).decision,'LONG');
});

test('LivingMarket correct/wrong/flat, streak, drawdown and calibration are auditable game points',()=>{
  const life=livingActor('METRICS');livingFeed(life,1000,100);livingFeed(life,6000,101);
  livingResolve(life,103);livingResolve(life,102);livingResolve(life,102);
  const m=livingMarketDecisionSnapshot(life,{now:186000}).sessionMetrics;
  assert.deepEqual([m.predictions,m.correct,m.wrong,m.flat,m.streak],[3,1,1,1,0]);
  assert.deepEqual([m.scorePoints,m.peakScorePoints,m.maxDrawdownPoints],[0,1,1]);
  assert.equal(m.calibration.samples,1);assert.equal(m.calibration.brier,1,'second prediction captured 100% prior empirical accuracy, then failed');
  assert.equal(m.calibration.bins.reduce((n,b)=>n+b.samples,0),1);
  assert.match(m.scoreDefinition,/NOT PNL OR MONEY/);assert.equal(life.capital,25);assert.deepEqual(life.positions,{});
});

test('LivingMarket session metrics do not borrow restored growth or fabricate calibration after reload',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
  const life=livingActor('RELOAD');livingFeed(life,1000,100);livingFeed(life,6000,101);livingResolve(life,103);
  assert.equal(createTrainingMemory(storage).save(life),true);
  const restored=createMarketLife({lifeId:'RELOAD',species:'STONE_APE'});assert.equal(createTrainingMemory(storage).restore(restored),true);
  assert.equal(livingMarketDecisionSnapshot(restored,{now:1000}).sessionMetrics,null);
  livingFeed(restored,1000,100);const intent=livingFeed(restored,6000,101);
  assert.equal(intent.confidence,null);assert.equal(intent.confidenceSamples,0);
  const m=livingMarketDecisionSnapshot(restored,{now:6000});
  assert.equal(m.sessionMetrics.predictions,0);assert.equal(m.sessionMetrics.calibration.brier,null);
  assert.equal(m.persistedGrowth.wins,1);assert.equal(m.audit.persisted,false);
});

test('LivingMarket Boss adapts only from settled errors, with causal policy lineage and no market field authority',()=>{
  const life=livingActor('BOSS','ADAPTIVE_BOSS');livingFeed(life,1000,100);livingFeed(life,6000,101);
  livingResolve(life,100);assert.equal(life.training.policyGeneration,0);
  livingResolve(life,101);
  const state=livingMarketDecisionSnapshot(life,{now:126000});
  assert.equal(state.boss.policyGeneration,1);assert.equal(state.boss.strategyBias,-1);assert.equal(state.decision,'SHORT');
  const adaptation=state.audit.events.find(e=>e.type==='BOSS_POLICY_ADAPTED');
  assert.ok(adaptation.evidencePredictionId);assert.equal(adaptation.at,126000);assert.equal(adaptation.simulationOnly,true);
  assert.equal(life.training.pending.policyGeneration,1);assert.equal(state.boss.affectsRealMarket,false);
  assert.equal(life.capital,25);assert.deepEqual(life.positions,{});
});

test('LivingMarket bounded audit reports truncation honestly while monotonically retaining summary counts',()=>{
  const life=livingActor('BOUNDED');livingFeed(life,1000,100);livingFeed(life,6000,101);
  for(let i=0;i<80;i++)livingResolve(life,102+i);
  const view=livingMarketDecisionSnapshot(life,{now:life.training.lastAt});
  assert.equal(view.sessionMetrics.predictions,80);assert.equal(view.audit.events.length,LIVING_MARKET_TRAINING_RULES.auditLimit);
  assert.ok(view.audit.droppedEvents>0);assert.equal(view.audit.completeSessionWindow,false);
  assert.ok(view.audit.events.every((e,i,a)=>i===0||e.sequence>a[i-1].sequence));
  assert.equal(view.audit.events.at(-1).sequence,life.training.sequence);
});

test('LivingMarket only configures unowned existing monster fixtures; ecology, cargo and ownership are protected',()=>{
  for(const props of [{species:'FISH'},{species:'DIGITAL_ANT'},{species:'STONE_APE',ownerPlayerId:'PLAYER'},{species:'STONE_APE',ownerLandId:'LAND'},
    {species:'STONE_APE',sourceManaged:true},{species:'STONE_APE',cargo:{principal:100}},{species:'STONE_APE',sourceClass:'PLAYER_OWNED'}]){
    const life=Object.assign(createMarketLife({lifeId:'DENIED',species:props.species}),props),before=structuredClone(life);
    assert.equal(configureLivingMarketLife(life,{sourceEventId:'fixture'}).ok,false);assert.deepEqual(life,before);
  }
  const life=livingActor('ONLY_ONCE');assert.equal(configureLivingMarketLife(life,{sourceEventId:'again',energyUnits:999}).reason,'ALREADY_CONFIGURED');
  for(const input of [{energyUnits:-1},{energyUnits:0.1},{massUnits:Infinity},{sourceClass:'PLAYER_OWNED'},{profile:'FULL_GA600'}]){
    const candidate=createMarketLife({lifeId:'INVALID',species:'STONE_APE'});
    assert.equal(configureLivingMarketLife(candidate,{sourceEventId:'fixture',...input}).ok,false);assert.equal(candidate.livingMarket,undefined);
  }
});

test('LivingMarket FOLLOW, ALLY, COMPETE and FLEE change only game relation evidence, never movement or capital',()=>{
  const a=livingActor('A'),b=livingActor('B');
  const original=[a,b].map(l=>({world:structuredClone(l.world),capital:l.capital,positions:structuredClone(l.positions),state:l.state}));
  for(const [i,action] of ['FOLLOW','ALLY','COMPETE','FLEE'].entries()){
    const r=interactLivingMarketLives(a,b,{action,sequence:i+1,actorRevision:a.livingMarket.revision,targetRevision:b.livingMarket.revision,capability:livingCapability(a,b),now:100+i});
    assert.equal(r.ok,true);assert.equal(r.event.movesCoordinates,false);assert.equal(r.event.changesOwnership,false);
  }
  assert.deepEqual([a,b].map(l=>({world:l.world,capital:l.capital,positions:l.positions,state:l.state})),original);
  assert.equal(a.livingMarket.energyUnits,10);assert.equal(b.livingMarket.massUnits,4);
});

test('LivingMarket ABSORB conserves bounded game mass/energy and rejects replay and stale concurrent revisions',()=>{
  const a=livingActor('ABSORBER'),b=livingActor('YIELDING','COUNTERTREND',{allowAbsorption:true}),capability=livingCapability(a,b);
  const request={action:'ABSORB',sequence:1,actorRevision:0,targetRevision:0,energyUnits:7,massUnits:3,capability,now:100};
  assert.equal(interactLivingMarketLives(a,b,request).ok,true);
  assert.deepEqual([a.livingMarket.energyUnits,b.livingMarket.energyUnits,a.livingMarket.massUnits,b.livingMarket.massUnits],[17,3,7,1]);
  assert.equal(a.livingMarket.energyUnits+b.livingMarket.energyUnits,20);assert.equal(a.livingMarket.massUnits+b.livingMarket.massUnits,8);
  const before=structuredClone([a,b]);assert.equal(interactLivingMarketLives(a,b,request).reason,'REPLAY_OR_STALE_REVISION');
  assert.deepEqual([a,b],before);
  assert.equal(interactLivingMarketLives(a,b,{...request,sequence:2,actorRevision:1}).reason,'REPLAY_OR_STALE_REVISION');
  assert.equal(a.capital,25);assert.equal(b.capital,25);assert.deepEqual(a.positions,{});assert.deepEqual(b.positions,{});
});

test('LivingMarket interactions reject missing, expired, mismatched, excess, fractional and non-transfer capabilities atomically',()=>{
  for(const mutation of [
    r=>({...r,capability:null}),r=>({...r,capability:{...r.capability,scope:'WALLET'}}),
    r=>({...r,capability:{...r.capability,targetLifeId:'OTHER'}}),r=>({...r,capability:{...r.capability,targetSourceEventId:'OTHER'}}),
    r=>({...r,capability:{...r.capability,expiresAt:100}}),r=>({...r,capability:{...r.capability,issuedAt:101}}),
    r=>({...r,capability:{...r.capability,actions:['FOLLOW']}}),r=>({...r,energyUnits:11}),r=>({...r,massUnits:-1}),
    r=>({...r,massUnits:.5}),r=>({...r,action:'FOLLOW',energyUnits:1}),r=>({...r,sequence:2}),
  ]){
    const a=livingActor('DENY-A'),b=livingActor('DENY-B','MOMENTUM',{allowAbsorption:true});
    const request=mutation({action:'ABSORB',sequence:1,actorRevision:0,targetRevision:0,energyUnits:1,massUnits:1,capability:livingCapability(a,b),now:100});
    const before=structuredClone([a,b]);assert.equal(interactLivingMarketLives(a,b,request).ok,false);assert.deepEqual([a,b],before);
  }
  const a=livingActor('NO-A'),b=livingActor('NO-B');
  assert.equal(interactLivingMarketLives(a,b,{action:'ABSORB',sequence:1,actorRevision:0,targetRevision:0,energyUnits:1,capability:livingCapability(a,b),now:100}).ok,false);
});

test('LivingMarket late accepted observation records actual horizon delay without retroactive settlement',()=>{
  const life=livingActor('DELAY');livingFeed(life,1000,100);livingFeed(life,6000,101);
  for(let at=11000;at<=61000;at+=5000)livingFeed(life,at,102);
  assert.equal(life.training.session.resolved,0);
  livingFeed(life,71000,103);
  const e=life.training.audit.find(e=>e.type==='PREDICTION_SETTLED');
  assert.equal(e.deadline,66000);assert.equal(e.exitAt,71000);assert.equal(e.settlementDelayMs,5000);
  assert.equal(e.exit,103,'no interpolated or invented price at the missed deadline');
});

test('LivingMarket market-axis rebinding cannot settle a prediction under a changed coordinate binding',()=>{
  const life=livingActor('REBIND');livingFeed(life,1000,100);livingFeed(life,6000,101);
  const r=livingFeed(life,11000,999,{markets:[{axis:'KY',symbol:'BTCUSDT',price:999}]});
  assert.equal(r,null);assert.equal(life.training.dataStatus,'INVALID');assert.equal(life.training.pending,null);
  assert.ok(life.training.audit.some(e=>e.reason==='AXIS_MARKET_BINDING_MISMATCH'));
  assert.equal(life.training.session.resolved,0);
});

test('LivingMarket rejects unsafe clocks, invalid source provenance and overflowing signal arithmetic',()=>{
  for(const [batch,now] of [
    [livingQuote(Number.MAX_SAFE_INTEGER,100),Number.MAX_SAFE_INTEGER],
    [livingQuote(11000.5,100),11000.5],
    [livingQuote(11000,100,{source:{name:'pretend'}}),11000],
    [livingQuote(11000,100,{source:''}),11000],
  ]){
    const life=livingActor('BAD-CLOCK');livingFeed(life,1000,100);livingFeed(life,6000,101);
    assert.equal(observeTrainingMarket(life,batch,{now}),null);assert.equal(life.training.pending,null);
    assert.equal(life.training.session.resolved,0);
  }
  const life=livingActor('OVERFLOW');livingFeed(life,1000,1e-300);
  assert.equal(livingFeed(life,6000,1e300),null);assert.equal(life.training.reason,'INVALID_SIGNAL_ARITHMETIC');
  assert.equal(life.training.pending,null);assert.equal(life.training.session.issued,0);
});

test('LivingMarket lifecycle lock prevents dead/recovery lives from issuing predictions or presenting motion',()=>{
  for(const state of ['DEAD','NAIHE','MENGPO_RECOVERY','REBIRTH']){
    const life=livingActor(state);livingFeed(life,1000,100);livingFeed(life,6000,101);life.state=state;
    assert.equal(livingMarketDecisionSnapshot(life,{now:6000}).decision,'WAIT');
    assert.equal(livingFeed(life,11000,102),null);assert.equal(life.training.pending,null);
    assert.equal(life.training.reason,'LIFECYCLE_LOCK');assert.equal(life.training.session.resolved,0);
  }
});

test('LivingMarket profile cannot be configured retrospectively after observing a result',()=>{
  const life=createMarketLife({lifeId:'OLD',species:'STONE_APE'});livingFeed(life,1000,100);
  const before=structuredClone(life);
  assert.equal(configureLivingMarketLife(life,{sourceEventId:'hindsight',profile:'ADAPTIVE_BOSS'}).reason,'FRESH_FIXTURE_REQUIRED');
  assert.deepEqual(life,before);
});

test('LivingMarket transfer rejects corrupted pools, integer overflow, changed ownership and time reversal atomically',()=>{
  for(const corrupt of [l=>{l.livingMarket.energyUnits=-1},l=>{l.livingMarket.massUnits=.5},l=>{l.livingMarket.revision=Number.MAX_SAFE_INTEGER},
    l=>{l.ownerPlayerId='OWNER'},l=>{l.state='NAIHE'},l=>{l.livingMarket.lastInteractionAt=200}]){
    const a=livingActor('CORRUPT-A'),b=livingActor('CORRUPT-B','MOMENTUM',{allowAbsorption:true});corrupt(b);
    const before=structuredClone([a,b]);
    assert.equal(interactLivingMarketLives(a,b,{action:'ABSORB',sequence:1,actorRevision:a.livingMarket.revision,targetRevision:b.livingMarket.revision,
      energyUnits:1,massUnits:1,capability:livingCapability(a,b),now:100}).ok,false);
    assert.deepEqual([a,b],before);
  }
  const a=livingActor('FULL','MOMENTUM',{energyUnits:Number.MAX_SAFE_INTEGER}),b=livingActor('OFFER','MOMENTUM',{allowAbsorption:true});
  const before=structuredClone([a,b]);
  assert.equal(interactLivingMarketLives(a,b,{action:'ABSORB',sequence:1,actorRevision:0,targetRevision:0,energyUnits:1,capability:livingCapability(a,b),now:100}).ok,false);
  assert.deepEqual([a,b],before);
});

test('LivingMarket interaction history is bounded without reopening old sequence replay',()=>{
  const a=livingActor('LONG-A'),b=livingActor('LONG-B');
  for(let sequence=1;sequence<=40;sequence++)assert.equal(interactLivingMarketLives(a,b,{action:'ALLY',sequence,actorRevision:a.livingMarket.revision,
    targetRevision:b.livingMarket.revision,capability:livingCapability(a,b),now:sequence}).ok,true);
  assert.equal(a.livingMarket.events.length,32);assert.equal(b.livingMarket.events.length,32);
  const before=structuredClone([a,b]);
  assert.equal(interactLivingMarketLives(a,b,{action:'ALLY',sequence:1,actorRevision:40,targetRevision:40,capability:livingCapability(a,b),now:41}).reason,'REPLAY_OR_STALE_REVISION');
  assert.deepEqual([a,b],before);
});

test('LivingMarket snapshot never projects a signal before its issuance or the last observed host clock',()=>{
  const life=livingActor('SNAPSHOT-CLOCK');livingFeed(life,1000,100);
  observeTrainingMarket(life,livingQuote(6000,101),{now:12000});
  assert.equal(life.training.pending.issuedAt,12000);assert.equal(life.training.intent.issuedAt,12000);
  const before=structuredClone(life);
  for(const now of [6500,11999,NaN,-1,12000.5]){
    const view=livingMarketDecisionSnapshot(life,{now});
    assert.equal(view.status,'INVALID');assert.equal(view.decision,'WAIT');assert.equal(view.motion.requestedSpeedFactor,0);
  }
  assert.equal(livingMarketDecisionSnapshot(life,{now:12000}).decision,'LONG');assert.deepEqual(life,before,'projection remains read-only');
});

test('LivingMarket removed pending market invalidates instead of throwing or scoring a different market',()=>{
  const life=livingActor('REMOVED-MARKET');livingFeed(life,1000,100);livingFeed(life,6000,101);
  for(let at=11000;at<=61000;at+=5000)livingFeed(life,at,102);
  life.marketDimensions=['ETHUSDT'];
  const changed=livingQuote(66000,999,{markets:[{axis:'KY',symbol:'ETHUSDT',price:999}]});
  const view=observeTrainingMarket(life,changed,{now:66000});
  assert.equal(view.decision,'WAIT');assert.equal(life.training.pending,null);assert.equal(life.training.session.resolved,0);
  assert.ok(life.training.audit.some(e=>e.reason==='MARKET_CAPABILITY_CHANGED'));
});

test('LivingMarket setup requires host wrapper provenance and rejects sourceType and wrapper-only logistics ownership',()=>{
  const bare=createMarketLife({lifeId:'BARE',species:'STONE_APE'});
  assert.equal(configureLivingMarketLife(bare,{sourceEventId:'fixture'}).reason,'HOST_LOCAL_FIXTURE_CONTEXT_REQUIRED');
  for(const edit of [
    (l,e)=>{l.sourceType='PLAYER_OWNED'},(l,e)=>{l.mission={type:'LOGISTICS',cargo:'BTC'}},
    (l,e)=>{e.sourceManaged=true},(l,e)=>{e.cargo={principal:100}},(l,e)=>{e.mission={type:'LOGISTICS'}},
    (l,e)=>{e.ownerPlayerId='OWNER'},(l,e)=>{e.sourceMeta.sourceType='PLAYER_OWNED'},
    (l,e)=>{e.sourceMeta.sourceClass='BRAIN_LOGISTICS'},(l,e)=>{e.lifeId='OTHER'},
    (l,e)=>{e.sourceMeta.sourceEventId='OTHER'},
  ]){
    const life=createMarketLife({lifeId:'WRAPPED',species:'STONE_APE'});
    const entity={lifeId:life.lifeId,marketLife:life,sourceManaged:false,simulationOnly:true,
      sourceMeta:{scope:'LOCAL_GAME_NPC_ONLY',sourceType:'WORLD_EVENT',sourceEventId:'fixture'}};
    edit(life,entity);const before=structuredClone(life);
    assert.equal(configureLivingMarketLife(life,{sourceEntity:entity,sourceEventId:'fixture'}).ok,false);assert.deepEqual(life,before);
  }
});

test('LivingMarket interactions revalidate external host ownership and source context on every transition',()=>{
  for(const edit of [e=>{e.ownerLandId='PLOT'},e=>{e.sourceMeta.sourceType='PLAYER_OWNED'},e=>{e.mission={type:'LOGISTICS'}},
    e=>{e.sourceManaged=true},e=>{e.cargo={principal:1}},e=>{e.sourceMeta.sourceEventId='REPLACED'}]){
    const a=livingActor('CONTEXT-A'),b=livingActor('CONTEXT-B','MOMENTUM',{allowAbsorption:true});
    edit(livingTestEntities.get(b));const before=structuredClone([a,b]);
    assert.equal(interactLivingMarketLives(a,b,{action:'ABSORB',sequence:1,actorRevision:0,targetRevision:0,
      energyUnits:1,capability:livingCapability(a,b),now:100}).reason,'OWNED_OR_SOURCE_MANAGED_LIFE_DENIED');
    assert.deepEqual([a,b],before);
  }
});

test('LivingMarket serialized clones cannot restore provenance or gain interaction authority',()=>{
  const a=livingActor('CLONE-A'),b=livingActor('CLONE-B','MOMENTUM',{allowAbsorption:true});
  assert.doesNotThrow(()=>JSON.stringify([a,b]),'host world-entity references cannot introduce serializable cycles');
  const [aa,bb]=structuredClone([a,b]),before=structuredClone([aa,bb]);
  assert.equal(interactLivingMarketLives(aa,bb,{action:'ABSORB',sequence:1,actorRevision:0,targetRevision:0,
    energyUnits:1,capability:livingCapability(aa,bb),now:100}).reason,'OWNED_OR_SOURCE_MANAGED_LIFE_DENIED');
  assert.deepEqual([aa,bb],before);
});

test('LivingMarket one-transition unit cap cannot be reused by advancing sequence and revisions',()=>{
  const a=livingActor('SINGLE-A'),b=livingActor('SINGLE-B','MOMENTUM',{allowAbsorption:true});
  const capability={...livingCapability(a,b),maxEnergyUnits:1,maxMassUnits:0};
  const request={action:'ABSORB',sequence:1,actorRevision:0,targetRevision:0,energyUnits:1,capability,now:100};
  assert.equal(interactLivingMarketLives(a,b,request).ok,true);
  const before=structuredClone([a,b]);
  assert.equal(interactLivingMarketLives(a,b,{...request,sequence:2,actorRevision:1,targetRevision:1,now:101}).reason,'CAPABILITY_ALREADY_USED_OR_STALE');
  assert.deepEqual([a,b],before);assert.equal(a.livingMarket.energyUnits,11);assert.equal(b.livingMarket.energyUnits,9);
});

test('LivingMarket generated transfer cases preserve exact integer energy and mass without touching financial records',()=>{
  for(let n=0;n<60;n++){
    const a=livingActor(`CONSERVE-A-${n}`,'MOMENTUM',{energyUnits:n,massUnits:2*n}),b=livingActor(`CONSERVE-B-${n}`,'MOMENTUM',{energyUnits:100,massUnits:100,allowAbsorption:true});
    const energy=n%11,mass=n%5,capability={...livingCapability(a,b),maxEnergyUnits:10,maxMassUnits:4};
    assert.equal(interactLivingMarketLives(a,b,{action:'ABSORB',sequence:1,actorRevision:0,targetRevision:0,energyUnits:energy,massUnits:mass,capability,now:n}).ok,true);
    assert.equal(BigInt(a.livingMarket.energyUnits)+BigInt(b.livingMarket.energyUnits),BigInt(n+100));
    assert.equal(BigInt(a.livingMarket.massUnits)+BigInt(b.livingMarket.massUnits),BigInt(2*n+100));
    assert.equal(a.capital+b.capital,50);assert.deepEqual([a.positions,b.positions],[{},{}]);
  }
});

import {getRealTradingBinding as livingCanonicalBinding} from '../runtime/real-trading-market-binding.mjs';
test('LivingMarket canonical symbol-axis owner rejects every wrong pair before warmup or actionable intent',()=>{
  const bindings=['KX','KY','KZ'].map(livingCanonicalBinding);
  for(const symbolBinding of bindings)for(const axisBinding of bindings){
    if(symbolBinding.axis===axisBinding.axis)continue;
    const life=createMarketLife({lifeId:`WRONG-${symbolBinding.axis}-${axisBinding.axis}`,markets:[symbolBinding.market]});
    for(const [at,price] of [[1000,100],[6000,101],[11000,102]]){
      const quote=livingQuote(at,price,{markets:[{axis:axisBinding.axis,symbol:symbolBinding.market,price}]});
      assert.equal(observeTrainingMarket(life,quote,{now:at}),null);
      assert.equal(life.training.reason,'AXIS_MARKET_BINDING_MISMATCH');assert.equal(life.training.dataStatus,'INVALID');
      const view=livingMarketDecisionSnapshot(life,{now:at});assert.equal(view.decision,'WAIT');assert.equal(view.motion.requestedSpeedFactor,0);
      assert.equal(life.training.session.issued,0);assert.equal(life.training.session.resolved,0);assert.equal(life.training.pending,null);
    }
  }
});

test('LivingMarket trusted world producer conforms to the existing binding owner and remains accepted',()=>{
  const world=createWorldState(1000);
  const bindings=['KX','KY','KZ'].map(livingCanonicalBinding);
  const quotes=Object.fromEntries(bindings.map((binding,i)=>[binding.market,100+i]));
  updateKMarketReference(world,quotes,1000);
  const life=createMarketLife({lifeId:'PRODUCER-CONTRACT',markets:bindings.map(binding=>binding.market)});
  let market=kMarketSnapshot(world,1000);
  for(const row of market.markets)assert.equal(row.symbol,livingCanonicalBinding(row.axis).market);
  assert.equal(observeTrainingMarket(life,market,{now:1000}).decision,'WAIT');
  quotes[bindings[1].market]+=5;updateKMarketReference(world,quotes,6000);market=kMarketSnapshot(world,6000);
  const intent=observeTrainingMarket(life,market,{now:6000});
  assert.equal(intent.decision,'LONG');assert.equal(intent.market,bindings[1].market);assert.equal(intent.axis,bindings[1].axis);
  assert.equal(life.training.pending.source,market.source);assert.equal(life.training.session.issued,1);
});
