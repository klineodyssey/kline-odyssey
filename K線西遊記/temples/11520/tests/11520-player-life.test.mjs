import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createLocalPlayerStore,createCloudPlayerStore,getActivePlayerId,PLAYER_LIFE_STORAGE_KEY,HOME_STAGES,gameplayProfile,GAMEPLAY_UNLOCKS,DAILY_JOURNEY_RULES,PLAYER_EVENT_REWARDS} from '../runtime/player-life-runtime.mjs';
import {createSimulationPlayerStore} from '../runtime/evm-wallet-runtime.mjs';
import {createKgenLedger} from '../runtime/kgen-margin-runtime.mjs';

function memory(){const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}}
const make=(options={})=>createLocalPlayerStore({storage:memory(),...options});
const signature='0x'+'01'.repeat(65),address='0x'+'12'.repeat(20),other='0x'+'34'.repeat(20);
const event=(s,type='MONSTER_KILL',id=randomBytes(8).toString('hex'))=>s.recordEvent({id,type});

test('guest has random non-wallet permanent player ID, optional fields and derived zero state',()=>{
 const s=make(),p=s.ensurePlayer();assert.match(p.playerId,/^KAIOS-P-[a-f0-9]{32}$/);assert.equal(s.ensurePlayer().playerId,p.playerId);assert.equal(p.walletLinks.length,0);assert.equal(p.ageRange,null);assert.deepEqual(p.privacyConsent,{location:false,motion:false,analytics:false});assert.equal(p.level,1);assert.equal(p.homePlot.ownerPlayerId,p.playerId);
});
test('reload preserves profile, progression, house and nonzero XYZ',()=>{
 const storage=memory(),s=make({storage}),p=s.createPlayer({lastXYZ:{x:210,y:2,z:186}});s.updateProfile({displayName:'悟空'});s.buildStarterHouse();event(s);s.saveProgress({journeyProgress:{tutorialStage:'HIT'},lastXYZ:{x:212,y:2,z:186}});const restored=make({storage});assert.equal(restored.activePlayer().playerId,p.playerId);assert.equal(getActivePlayerId(storage),p.playerId);assert.equal(restored.loadProgress().xp,10);assert.equal(restored.loadHomePlot().houseLevel,1);assert.equal(restored.activePlayer().displayName,'悟空');assert.equal(restored.loadProgress().lastXYZ.x,212);
});
test('local players isolated, inactive read denied, explicit switch restores only selected data',()=>{
 const s=make(),a=s.createPlayer();s.updateProfile({displayName:'A'});event(s);s.buildStarterHouse();const b=s.createPlayer();assert.notEqual(a.playerId,b.playerId);assert.equal(s.activePlayer().xp,0);assert.throws(()=>s.loadPlayer(a.playerId),/PLAYER_NOT_ACTIVE/);assert.throws(()=>s.activatePlayer('KAIOS-P-'+'0'.repeat(32)),/PLAYER_NOT_FOUND/);s.activatePlayer(a.playerId);assert.equal(s.activePlayer().xp,10);assert.equal(s.loadHomePlot().houseLevel,1);assert.equal(s.listPlayers().length,2);
});
test('progression authority rejects direct XP level inventory wallet and economic mutation',()=>{
 const s=make();s.createPlayer();for(const patch of [{xp:100},{level:10},{inventory:[]},{walletLinks:[]},{claimable:9},{privateKey:'no'},{realBirthDate:'2000-01-01'},{gpsHistory:[]}]){assert.throws(()=>s.updateProfile(patch),/PROFILE_FIELD_NOT_ALLOWED/);assert.throws(()=>s.saveProgress(patch),/PROGRESS_FIELD_NOT_ALLOWED/)}
});
test('event replay rejected, inventory references existing player-scoped backpack without duplicate ledger',()=>{
 const s=make();const p=s.createPlayer();event(s,'LOOT_DROP','loot-1');assert.throws(()=>event(s,'LOOT_DROP','loot-1'),/EVENT_REPLAY/);assert.throws(()=>s.recordEvent({id:'bad',type:'LOOT_DROP',reward:100000}),/INVALID_EVENT/);assert.deepEqual(s.activePlayer().inventory,{source:'SCOPED_BACKPACK',ownerPlayerId:p.playerId});assert.equal(s.activePlayer().xp,5);assert.equal(s.activePlayer().claimable,undefined);
});
test('home ownership and stage cannot be spoofed, upgrades obey data-driven levels',()=>{
 const s=make();s.createPlayer();const plot=s.loadHomePlot();assert.throws(()=>s.saveHomePlot({...plot,ownerPlayerId:'other'}),/HOME_MUTATION/);s.buildStarterHouse();assert.throws(()=>s.buildStarterHouse(),/HOUSE_ALREADY_BUILT/);assert.throws(()=>s.upgradeHouse(),/HOUSE_LEVEL_REQUIREMENT/);for(let n=0;n<3;n++)event(s);assert.equal(s.upgradeHouse().stage,'HOUSE');assert.equal(HOME_STAGES.length,8);assert.throws(()=>s.updateProfile({homeWorld:'12345'}),/HOME_WORLD_ALREADY_SETTLED/);
});
test('profile privacy whitelist and finite coordinates reject injected data',()=>{
 const s=make();s.createPlayer();for(const patch of [{displayName:'<script>'},{characterAppearance:'external-url'},{ageRange:'date'},{settings:{secret:'x'}},{privacyConsent:{location:true,motion:false,analytics:false,rawGPS:[]}}])assert.throws(()=>s.updateProfile(patch));for(const x of [NaN,Infinity,1e20])assert.throws(()=>s.saveProgress({lastXYZ:{x,y:0,z:0}}));assert.throws(()=>s.saveProgress({journeyProgress:{rawGPS:[]}}));
});
test('privacy opt-in is optional and revocation clears derived reality journey counters',()=>{
 const s=make();s.createPlayer();s.updateProfile({privacyConsent:{location:true,motion:true,analytics:false}});s.saveProgress({journeyProgress:{journeyDistance:20,dailyStepsUsedForGame:10,journeyEnergy:3}});s.updateProfile({privacyConsent:{location:false,motion:false,analytics:false}});assert.equal(s.activePlayer().journeyProgress.journeyDistance,0);
});
test('schema corruption is blocked without destructive overwrite',()=>{
 for(const raw of ['{bad','null','{}']){const storage=memory();storage.setItem(PLAYER_LIFE_STORAGE_KEY,raw);const s=make({storage});assert.equal(s.snapshot().status,'CORRUPT_SAVE');assert.throws(()=>s.ensurePlayer(),/CORRUPT_SAVE/);assert.equal(storage.getItem(PLAYER_LIFE_STORAGE_KEY),raw)}
});
test('tampered derived state, duplicated inventory and home ownership fail reload validation',()=>{
 for(const alter of [p=>p.level=10,p=>p.xp=999,p=>p.inventory={source:'SCOPED_BACKPACK',ownerPlayerId:'fake'},p=>p.homePlot.ownerPlayerId='fake',p=>p.walletLinks.push({address}),p=>p.events.push({id:'z',type:'MONSTER_KILL',at:0})]){const storage=memory(),s=make({storage}),p=s.createPlayer();const e=JSON.parse(storage.getItem(PLAYER_LIFE_STORAGE_KEY));alter(e.players[p.playerId]);storage.setItem(PLAYER_LIFE_STORAGE_KEY,JSON.stringify(e));assert.equal(make({storage}).snapshot().status,'CORRUPT_SAVE')}
});
test('optimistic exact-envelope check prevents old tab or rollback overwrite',()=>{
 const storage=memory(),a=make({storage});a.createPlayer();const old=storage.getItem(PLAYER_LIFE_STORAGE_KEY),b=make({storage});a.updateProfile({displayName:'Latest'});assert.throws(()=>b.updateProfile({displayName:'Stale'}),/REVISION_CONFLICT/);storage.setItem(PLAYER_LIFE_STORAGE_KEY,old);assert.throws(()=>a.updateProfile({displayName:'Rollback'}),/REVISION_CONFLICT/);
});
test('write failure does not commit in-memory progression or replace saved data',()=>{
 const storage=memory(),s=make({storage});s.createPlayer();const before=storage.getItem(PLAYER_LIFE_STORAGE_KEY);storage.setItem=()=>{throw Error('quota')};assert.throws(()=>event(s),/STORAGE_WRITE_FAILED/);assert.equal(s.activePlayer().xp,0);assert.equal(storage.getItem(PLAYER_LIFE_STORAGE_KEY),before);assert.equal(s.snapshot().persistent,false);
});
test('explicit session-only fallback playable offline but not falsely durable',()=>{
 const s=make({storage:null});s.createPlayer();event(s);assert.equal(s.snapshot().status,'SESSION_ONLY');assert.equal(s.snapshot().persistent,false);assert.equal(s.activePlayer().xp,10);
});
test('secure random unavailable fails closed, IDs cannot fall back to Math.random',()=>{
 assert.throws(()=>make({crypto:{}}).createPlayer(),/SECURE_RANDOM_UNAVAILABLE/);
});
test('backup recovers same ID on new device, no wallet or chain economic authority',()=>{
 const a=make(),p=a.createPlayer();a.buildStarterHouse();event(a);const backup=a.exportPlayer(),b=make();assert.throws(()=>b.importPlayer(backup),/EXPLICIT_LOCAL_IMPORT_REQUIRED/);b.importPlayer(backup,{confirmLocalCandidate:true});assert.equal(b.activePlayer().playerId,p.playerId);assert.equal(b.activePlayer().xp,10);assert.equal(b.loadHomePlot().houseLevel,1);assert.equal(b.activePlayer().walletLinks.length,0);assert.equal(b.activePlayer().migration,'BACKUP_LOCAL_CANDIDATE');assert.throws(()=>b.importPlayer(backup,{confirmLocalCandidate:true}),/PLAYER_ALREADY_EXISTS/);
});
test('backup rejects fabricated principal and malformed import',()=>{
 const s=make();s.createPlayer();const b=JSON.parse(s.exportPlayer());b.player.principal=100;assert.throws(()=>make().importPlayer(JSON.stringify(b),{confirmLocalCandidate:true}),/INVALID_PLAYER_FIELDS/);assert.throws(()=>make().importPlayer('bad',{confirmLocalCandidate:true}),/INVALID_BACKUP/);
});
test('legacy migration one-shot nonfinancial and preserves old origin',()=>{
 const s=make();s.createPlayer();s.migrateLegacy({lastXYZ:{x:210,y:0,z:186},journeyProgress:{tutorialStage:'DONE'}});assert.equal(s.activePlayer().lastXYZ.x,210);assert.equal(s.loadHomePlot().xyz.x,215);assert.throws(()=>s.migrateLegacy({}),/LEGACY_MIGRATION_ALREADY_USED/);assert.equal(s.activePlayer().xp,0);
});
test('bounded legacy guest XP migration preserves derived levels through events and reload',()=>{
 const storage=memory(),s=make({storage});s.createPlayer();s.migrateLegacy({legacyProgress:{xp:625,engineXp:320}});
 assert.equal(s.activePlayer().level,6);assert.equal(s.activePlayer().engineLevel,5);event(s);
 const restored=make({storage});assert.equal(restored.activePlayer().xp,635);assert.equal(restored.activePlayer().engineXp,320);assert.equal(restored.activePlayer().legacyProgress.source,'LOCAL_UNVERIFIED_GUEST');
 assert.throws(()=>restored.migrateLegacy({legacyProgress:{xp:100,engineXp:100}}),/LEGACY_MIGRATION_ALREADY_USED/);
 assert.throws(()=>restored.updateProfile({legacyProgress:{xp:999,engineXp:999}}),/PROFILE_FIELD_NOT_ALLOWED/);
 assert.throws(()=>restored.saveProgress({legacyProgress:{xp:999,engineXp:999}}),/PROGRESS_FIELD_NOT_ALLOWED/);
 assert.equal(restored.activePlayer().principal,undefined);assert.equal(restored.activePlayer().claimable,undefined);
});
test('legacy XP baseline rejects invalid values, economic fields, and nonfresh/second players',()=>{
 for(const value of [-1,1.5,NaN,Infinity,1000001]){const s=make();s.createPlayer();assert.throws(()=>s.migrateLegacy({legacyProgress:{xp:value,engineXp:0}}),/INVALID_LEGACY_PROGRESS/);assert.equal(s.activePlayer().xp,0)}
 const s=make();s.createPlayer();assert.throws(()=>s.migrateLegacy({legacyProgress:{xp:1,engineXp:1,claimable:100}}),/INVALID_LEGACY_PROGRESS/);event(s);assert.throws(()=>s.migrateLegacy({legacyProgress:{xp:1,engineXp:1}}),/LEGACY_MIGRATION_NOT_FRESH/);
 const two=make();two.createPlayer();two.createPlayer();assert.throws(()=>two.migrateLegacy({legacyProgress:{xp:1,engineXp:1}}),/LEGACY_MIGRATION_ALREADY_USED/);
});
test('wallet address alone cannot bind; injected actual signature verifier required',async()=>{
 const s=make();s.createPlayer();const challenge=s.beginWalletBinding({address,chainId:56});await assert.rejects(s.bindWallet({challenge,address,chainId:56,signature}),/SIGNATURE_VERIFIER_NOT_CONFIGURED/);assert.equal(s.activePlayer().walletLinks.length,0);
});
test('verified local wallet link is replay-protected and duplicate binding across players rejected',async()=>{
 const s=make({verifyWalletSignature:async()=>address});s.createPlayer();const challenge=s.beginWalletBinding({address,chainId:56});await s.bindWallet({challenge,address,chainId:56,signature});assert.equal(s.activePlayer().walletLinks.length,1);assert.ok(!JSON.stringify(s.snapshot()).includes(signature));await assert.rejects(s.bindWallet({challenge,address,chainId:56,signature}),/INVALID_OR_REPLAYED/);s.createPlayer();const next=s.beginWalletBinding({address,chainId:56});await assert.rejects(s.bindWallet({challenge:next,address,chainId:56,signature}),/DUPLICATE_WALLET_BINDING/);assert.equal(s.activePlayer().walletLinks.length,0);
});
test('wallet spoofing, wrong chain, expired challenge and account switch fail',async()=>{
 let time=1000;const s=make({now:()=>time,verifyWalletSignature:async()=>other});s.createPlayer();const challenge=s.beginWalletBinding({address,chainId:56});await assert.rejects(s.bindWallet({challenge,address,chainId:56,signature}),/WALLET_SIGNATURE_MISMATCH/);await assert.rejects(s.bindWallet({challenge,address,chainId:97,signature}),/INVALID_OR_REPLAYED/);await assert.rejects(s.bindWallet({challenge:{...challenge,domain:'evil'},address,chainId:56,signature}),/INVALID_OR_REPLAYED/);time+=300001;await assert.rejects(s.bindWallet({challenge,address,chainId:56,signature}),/INVALID_OR_REPLAYED/);
});
test('wallet async verification cannot bind after player context switches',async()=>{
 let release;const s=make({verifyWalletSignature:()=>new Promise(r=>release=r)});s.createPlayer();const challenge=s.beginWalletBinding({address,chainId:56}),pending=s.bindWallet({challenge,address,chainId:56,signature});s.createPlayer();release(address);await assert.rejects(pending,/WALLET_CONTEXT_CHANGED/);assert.equal(s.activePlayer().walletLinks.length,0);
});
test('wrong-wallet recovery requires explicit local confirmation and cannot unlink another player',async()=>{
 const s=make({verifyWalletSignature:async()=>address}),first=s.createPlayer();const challenge=s.beginWalletBinding({address,chainId:56});await s.bindWallet({challenge,address,chainId:56,signature});
 assert.throws(()=>s.unlinkWallet(address),/EXPLICIT_LOCAL_UNLINK_REQUIRED/);assert.equal(s.activePlayer().walletLinks.length,1);
 s.createPlayer();assert.throws(()=>s.unlinkWallet(address,{confirmLocalOnly:true}),/WALLET_NOT_LINKED_TO_ACTIVE_PLAYER/);
 s.activatePlayer(first.playerId);assert.equal(s.activePlayer().walletLinks.length,1);s.unlinkWallet(address,{confirmLocalOnly:true});assert.equal(s.activePlayer().walletLinks.length,0);
 await assert.rejects(s.bindWallet({challenge,address,chainId:56,signature}),/INVALID_OR_REPLAYED/);
 const fresh=s.beginWalletBinding({address,chainId:56});assert.notEqual(fresh.nonce,challenge.nonce);await s.bindWallet({challenge:fresh,address,chainId:56,signature});assert.equal(s.activePlayer().walletLinks.length,1);
});
test('unlink invalidates outstanding proof for that association without reviving consumed nonce',async()=>{
 const s=make({verifyWalletSignature:async()=>address});s.createPlayer();const first=s.beginWalletBinding({address,chainId:56});await s.bindWallet({challenge:first,address,chainId:56,signature});const outstanding=s.beginWalletBinding({address,chainId:56});s.unlinkWallet(address,{confirmLocalOnly:true});await assert.rejects(s.bindWallet({challenge:outstanding,address,chainId:56,signature}),/INVALID_OR_REPLAYED/);
});
test('unlink during signature verification cannot asynchronously relink removed association',async()=>{
 let release,waiting=false;const s=make({verifyWalletSignature:()=>waiting?new Promise(r=>release=r):Promise.resolve(address)});s.createPlayer();const first=s.beginWalletBinding({address,chainId:56});await s.bindWallet({challenge:first,address,chainId:56,signature});waiting=true;const next=s.beginWalletBinding({address,chainId:56});const pending=s.bindWallet({challenge:next,address,chainId:56,signature});s.unlinkWallet(address,{confirmLocalOnly:true});release(address);await assert.rejects(pending,/WALLET_CONTEXT_CHANGED/);assert.equal(s.activePlayer().walletLinks.length,0);
});
test('cloud interface is vendor neutral and honestly unavailable',()=>{
 const c=createCloudPlayerStore();assert.equal(c.status,'NOT_CONFIGURED');for(const method of ['createPlayer','loadPlayer','savePlayer','updateProfile','saveProgress','loadProgress','bindWallet','loadHomePlot','saveHomePlot'])assert.throws(()=>c[method](),/CLOUD_NOT_CONFIGURED/);
});

test('corrupt scoped simulation ledger is not silently overwritten during Player Life reload',()=>{
 const storage=memory(),life=make({storage}),player=life.createPlayer();
 const key='k11520.player:'+player.playerId+':k11520.local-product.v1:guest';
 for(const corrupt of ['{broken',JSON.stringify({schema:'WRONG',owner:'guest',revision:0,ledger:{}})]){
   storage.setItem(key,corrupt);const ledger=createKgenLedger(100),sim=createSimulationPlayerStore({storage,ledger,playerId:player.playerId});
   // Either a surfaced fail-closed error or an explicitly ephemeral fallback
   // is allowed, but the original player evidence must remain recoverable.
   try{sim.activate(null)}catch{}
   assert.equal(storage.getItem(key),corrupt);
 }
});

test('V2.9 gameplay progression is configured and never grants financial authority',()=>{
 const s=make();s.createPlayer();let p=s.gameplayProfile();
 assert.equal(p.unlocks.SLASH,true);assert.equal(p.unlocks.GOLDEN_RAIN,false);assert.equal(p.engineMode,'GAME_TRAINING_ONLY');assert.equal(p.fullEngine,'NOT_INTEGRATED');
 assert.equal(p.nextUnlock.id,'GOLDEN_RAIN');assert.equal(p.nextUnlock.label,'天罡金陣');
 assert.deepEqual(p.nextPlayerLevel,{level:2,xp:25,remaining:25});assert.equal(p.nextEngineLevel.xp,20);
 for(let i=0;i<3;i++)event(s,'JOURNEY_MONSTER_KILL','guardian:'+i);
 p=s.gameplayProfile();assert.equal(p.level,2);assert.equal(p.engineXp,12);assert.equal(p.unlocks.GOLDEN_RAIN,true);assert.equal(p.unlocks.BOSS,false);
 for(let i=0;i<37;i++)event(s,'JOURNEY_MONSTER_KILL','strong:'+i);
 p=s.gameplayProfile();assert.equal(p.level,5);assert.equal(p.unlocks.BOSS,true);assert.equal(p.unlocks.HISTORICAL_TRAINING,true);
 assert.ok(Object.isFrozen(GAMEPLAY_UNLOCKS[0]));assert.ok(Object.isFrozen(PLAYER_EVENT_REWARDS.BOSS_DEFEAT));
 for(const prohibited of ['cMax','realLeverage','principal','claimable','mainnet','payout'])assert.equal(p[prohibited],undefined);
});

test('gameplay player and engine XP persist; boss and practice replay cannot double reward',()=>{
 const storage=memory(),s=make({storage}),player=s.createPlayer();
 event(s,'BOSS_DEFEAT','encounter:boss:1');event(s,'SIX_PHASE_PRACTICE','encounter:boss:1:KY-');
 assert.equal(s.activePlayer().xp,55);assert.equal(s.activePlayer().engineXp,38);assert.equal(s.activePlayer().engineLevel,2);
 const restored=make({storage});assert.equal(restored.activePlayer().playerId,player.playerId);assert.equal(restored.activePlayer().xp,55);
 assert.throws(()=>event(restored,'BOSS_DEFEAT','encounter:boss:1'),/EVENT_REPLAY/);
 assert.throws(()=>event(restored,'SIX_PHASE_PRACTICE','encounter:boss:1:KY-'),/EVENT_REPLAY/);
 assert.deepEqual(restored.activePlayer().achievements,['FIRST_MONSTER']);
 const newDevice=make();newDevice.importPlayer(restored.exportPlayer(),{confirmLocalCandidate:true});
 assert.throws(()=>event(newDevice,'BOSS_DEFEAT','encounter:boss:1'),/EVENT_REPLAY/);
});

function finishDaily(s){
 for(let i=0;i<3;i++)event(s,'JOURNEY_MONSTER_KILL','daily:'+s.gameplayProfile().daily.day+':kill:'+i);
 event(s,'SIX_PHASE_PRACTICE','daily:'+s.gameplayProfile().daily.day+':phase');
 for(let i=0;i<10;i++)s.recordExplorationStep();
}
test('Daily Journey awards once after actual event goals, persists, resets next UTC day',()=>{
 let now=Date.UTC(2026,9,1,12);const storage=memory(),s=make({storage,now:()=>now});s.createPlayer();
 assert.throws(()=>s.claimDailyJourney(),/DAILY_NOT_COMPLETE/);finishDaily(s);
 assert.equal(s.gameplayProfile().daily.ready,true);assert.equal(s.gameplayProfile().daily.distanceMeters,50);
 const before=s.activePlayer(),revision=s.snapshot().revision;s.recordExplorationStep();assert.equal(s.snapshot().revision,revision);
 s.claimDailyJourney();assert.equal(s.activePlayer().xp,before.xp+25);assert.equal(s.activePlayer().engineXp,before.engineXp+20);
 assert.equal(s.gameplayProfile().daily.claimed,true);assert.throws(()=>s.claimDailyJourney(),/DAILY_ALREADY_CLAIMED/);
 const restored=make({storage,now:()=>now});assert.throws(()=>restored.claimDailyJourney(),/DAILY_ALREADY_CLAIMED/);
 assert.throws(()=>event(restored,'DAILY_JOURNEY','alternative-id'),/INVALID_DAILY_CLAIM/);
 now+=86400000;assert.equal(restored.gameplayProfile().daily.kills,0);assert.equal(restored.gameplayProfile().daily.claimed,false);
 assert.throws(()=>restored.claimDailyJourney(),/DAILY_NOT_COMPLETE/);finishDaily(restored);restored.claimDailyJourney();
 assert.equal(restored.activePlayer().events.filter(e=>e.type==='DAILY_JOURNEY').length,2);
});

test('Daily progress is per player and cannot borrow another player or previous day goals',()=>{
 let now=Date.UTC(2026,9,1);const s=make({now:()=>now}),a=s.createPlayer();finishDaily(s);s.claimDailyJourney();
 const b=s.createPlayer();assert.equal(s.gameplayProfile().daily.ready,false);assert.equal(s.gameplayProfile().daily.claimed,false);assert.throws(()=>s.claimDailyJourney(),/DAILY_NOT_COMPLETE/);
 s.activatePlayer(a.playerId);assert.equal(s.gameplayProfile().daily.claimed,true);s.activatePlayer(b.playerId);assert.equal(s.activePlayer().xp,0);
 now+=86400000;s.activatePlayer(a.playerId);assert.equal(s.gameplayProfile().daily.distanceMeters,0);assert.equal(s.gameplayProfile().daily.ready,false);
});

test('daily and exploration fixed event shapes reject forged amounts, IDs, and unsatisfied claims',()=>{
 const s=make({now:()=>Date.UTC(2026,9,1)});s.createPlayer();
 assert.throws(()=>event(s,'DAILY_JOURNEY','DAILY_JOURNEY:2026-10-01'),/INVALID_DAILY_CLAIM/);
 assert.throws(()=>event(s,'EXPLORATION_STEP','explore:2026-10-01:99'),/INVALID_EXPLORATION_STEP/);
 assert.throws(()=>s.recordEvent({id:'explore:2026-10-01:1',type:'EXPLORATION_STEP',distanceMeters:500}),/INVALID_EVENT/);
 assert.throws(()=>event(s,'QUEST_COMPLETE','quest:UNLIMITED_MONEY'),/INVALID_QUEST/);
 event(s,'QUEST_COMPLETE','quest:FIRST_JOURNEY');assert.equal(s.activePlayer().xp,15);
 assert.throws(()=>event(s,'QUEST_COMPLETE','quest:FIRST_JOURNEY'),/EVENT_REPLAY/);
 assert.equal(DAILY_JOURNEY_RULES.clock,'UTC_LOCAL_CANDIDATE');
});

test('daily saved claim must remain supported by prior goals and exact date on reload',()=>{
 const storage=memory(),s=make({storage,now:()=>Date.UTC(2026,9,1)}),p=s.createPlayer();finishDaily(s);s.claimDailyJourney();
 const envelope=JSON.parse(storage.getItem(PLAYER_LIFE_STORAGE_KEY));envelope.players[p.playerId].events.at(-1).id='DAILY_JOURNEY:2026-10-02';
 const corrupt=JSON.stringify(envelope);storage.setItem(PLAYER_LIFE_STORAGE_KEY,corrupt);
 assert.equal(make({storage}).snapshot().status,'CORRUPT_SAVE');assert.equal(storage.getItem(PLAYER_LIFE_STORAGE_KEY),corrupt);
});

test('projection leaves V2.8 legacy XP weights and save shape unchanged',()=>{
 const storage=memory(),s=make({storage});s.createPlayer();event(s,'MONSTER_KILL','old-kill');event(s,'TRADE_FILL','old-fill');
 assert.equal(s.activePlayer().xp,14);assert.equal(s.activePlayer().engineXp,6);
 const restored=make({storage});assert.equal(restored.snapshot().status,'READY');const before=storage.getItem(PLAYER_LIFE_STORAGE_KEY);
 const p=gameplayProfile(restored.activePlayer());assert.equal(p.xp,14);assert.equal(storage.getItem(PLAYER_LIFE_STORAGE_KEY),before);
 assert.throws(()=>gameplayProfile({...restored.activePlayer(),engineXp:999}),/INVALID_DERIVED_PROGRESSION/);
});

test('daily persistence failure grants neither XP nor claim; storage remains recoverable',()=>{
 const storage=memory(),s=make({storage});s.createPlayer();finishDaily(s);const before=s.activePlayer(),raw=storage.getItem(PLAYER_LIFE_STORAGE_KEY);
 storage.setItem=()=>{throw Error('quota')};assert.throws(()=>s.claimDailyJourney(),/STORAGE_WRITE_FAILED/);
 assert.equal(s.activePlayer().xp,before.xp);assert.equal(s.gameplayProfile().daily.claimed,false);assert.equal(storage.getItem(PLAYER_LIFE_STORAGE_KEY),raw);
});

test('bounded atomic event bundle persists kill loot and practice in one revision',()=>{
 const storage=memory(),s=make({storage});s.createPlayer();const revision=s.snapshot().revision;
 s.recordEvents([{id:'bundle:kill',type:'JOURNEY_MONSTER_KILL'},{id:'bundle:loot',type:'LOOT_DROP'},{id:'bundle:phase',type:'SIX_PHASE_PRACTICE'}]);
 assert.equal(s.snapshot().revision,revision+1);assert.equal(s.activePlayer().xp,20);assert.equal(s.activePlayer().engineXp,12);
 assert.equal(make({storage}).activePlayer().events.length,3);
 for(const batch of [[],null,Array.from({length:9},(_,i)=>({id:'large:'+i,type:'LOOT_DROP'}))])assert.throws(()=>s.recordEvents(batch),/INVALID_EVENT_BATCH/);
});

test('invalid or replayed later event rolls back entire batch, including first event XP',()=>{
 const storage=memory(),s=make({storage});s.createPlayer();event(s,'LOOT_DROP','existing');
 const raw=storage.getItem(PLAYER_LIFE_STORAGE_KEY),before=s.snapshot();
 for(const batch of [
   [{id:'new:kill',type:'JOURNEY_MONSTER_KILL'},{id:'existing',type:'LOOT_DROP'}],
   [{id:'same',type:'BOSS_DEFEAT'},{id:'same',type:'LOOT_DROP'}],
   [{id:'new:kill',type:'JOURNEY_MONSTER_KILL'},{id:'bad',type:'LOOT_DROP',xp:999}],
   [{id:'new:kill',type:'JOURNEY_MONSTER_KILL'},{id:'bad-daily',type:'DAILY_JOURNEY'}]
 ]){assert.throws(()=>s.recordEvents(batch));assert.equal(storage.getItem(PLAYER_LIFE_STORAGE_KEY),raw);assert.deepEqual(s.snapshot(),before)}
});

test('quota failure cannot persist half of kill and loot reward batch',()=>{
 const storage=memory(),s=make({storage});s.createPlayer();const before=s.activePlayer(),raw=storage.getItem(PLAYER_LIFE_STORAGE_KEY);
 storage.setItem=()=>{throw Error('quota')};assert.throws(()=>s.recordEvents([{id:'kill',type:'JOURNEY_MONSTER_KILL'},{id:'loot',type:'LOOT_DROP'}]),/STORAGE_WRITE_FAILED/);
 assert.deepEqual(s.activePlayer(),before);assert.equal(storage.getItem(PLAYER_LIFE_STORAGE_KEY),raw);
});

// Stage1 is an IN-MEMORY IndexedDB model, not Chromium/disk/old-tab evidence.
// fake-indexeddb6.2.5 (Apache-2.0), official dumbmatter/fakeIndexedDB package.
// npm integrity: sha512-CGnyrvbhPlWYMngksqrSSUT1BAVP49dZocrHuK0SvtR0D5TMs5wP0o3j7jexDJW01KSadjBp1M/71o/KR3nD1w==
import {IDBFactory} from 'fake-indexeddb';
import * as lifeAuthorityModule from '../runtime/player-life-runtime.mjs';
const authorityName='KAIOS_LOCAL_GAME_TEST:life-stage1';
function lifeFixture(){const storage=memory(),s=make({storage});s.createPlayer();return {storage,envelope:JSON.parse(storage.getItem(PLAYER_LIFE_STORAGE_KEY))}}
function newAuthority(indexedDB=new IDBFactory(),extra={}){return lifeAuthorityModule.createLocalGameAuthority({indexedDB,databaseName:authorityName,...extra})}
const expected=s=>({authorityEpoch:s.authorityEpoch,selectionEpoch:s.selectionEpoch,revision:s.revision});
const change=(s,extra={})=>({domain:'PLAYER_LIFE',kind:'UPDATE',playerId:s.activePlayerId,expected:expected(s),...extra});
async function initialized(indexedDB=new IDBFactory()){const a=newAuthority(indexedDB);await a.open();await a.initialize({domain:'PLAYER_LIFE',envelope:lifeFixture().envelope,confirmLifeOnlyDraft:true});return a}
async function rawDb(indexedDB){return new Promise((resolve,reject)=>{const r=indexedDB.open(authorityName,1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function rawWrite(db,key,value){return new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);value===undefined?tx.objectStore('records').delete(key):tx.objectStore('records').put(value,key)})}

test('atomic Life Stage1 import/constructor inert; explicit open creates no authority',async()=>{
 assert.equal(typeof lifeAuthorityModule.createLocalGameAuthority,'function');let opens=0;const a=newAuthority({open(){opens++;throw Error('unexpected open')}});assert.equal(opens,0);a.close();assert.equal(opens,0);
 const b=newAuthority();await b.open();assert.equal((await b.read()).status,'UNINITIALIZED');b.close();assert.throws(()=>b.read(),/AUTHORITY_OPEN_REQUIRED/);
});
test('atomic authority database names reject coercion without invoking a factory or conversion',()=>{
 let opens=0,conversions=0;const indexedDB={open(){opens++;throw Error('unexpected open')}};
 for(const databaseName of [[authorityName],{toString(){conversions++;return authorityName}}])assert.throws(()=>lifeAuthorityModule.createLocalGameAuthority({indexedDB,databaseName}),/INVALID_AUTHORITY_DATABASE/);
 assert.equal(opens,0);assert.equal(conversions,0);
});
test('atomic Life Stage1 N/N conflict, refresh and explicit retry',async()=>{
 const idb=new IDBFactory(),a=await initialized(idb),b=newAuthority(idb);await b.open();const n=await a.read();assert.deepEqual(await b.read(),n);
 const saved=await a.command(change(n),d=>{d.players[n.activePlayerId].displayName='A latest'});assert.equal(saved.revision,n.revision+1);
 await assert.rejects(b.command(change(n),d=>{d.players[n.activePlayerId].displayName='B stale'}),/REVISION_CONFLICT/);assert.deepEqual(await a.read(),saved);
 const fresh=await b.read();const retried=await b.command(change(fresh),d=>{d.players[fresh.activePlayerId].pronoun='safe retry'});assert.equal(retried.envelope.players[fresh.activePlayerId].displayName,'A latest');assert.equal(retried.revision,n.revision+2);a.close();b.close();
});
test('atomic Life Stage1 simultaneous CAS yields one accepted write and one conflict',async()=>{
 const idb=new IDBFactory(),a=await initialized(idb),b=newAuthority(idb);await b.open();const s=await a.read();const results=await Promise.allSettled([a.command(change(s),d=>{d.players[s.activePlayerId].displayName='A'}),b.command(change(s),d=>{d.players[s.activePlayerId].displayName='B'})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.match(results.find(r=>r.status==='rejected').reason.message,/REVISION_CONFLICT/);assert.equal((await a.read()).revision,s.revision+1);a.close();b.close();
});
test('atomic Life Stage1 concurrent initialize, confirmation and domain fail closed',async()=>{
 const idb=new IDBFactory(),a=newAuthority(idb),b=newAuthority(idb);await Promise.all([a.open(),b.open()]);const data={domain:'PLAYER_LIFE',envelope:lifeFixture().envelope,confirmLifeOnlyDraft:true};assert.throws(()=>a.initialize({...data,confirmLifeOnlyDraft:false}),/EXPLICIT_DRAFT_CONFIRMATION/);const r=await Promise.allSettled([a.initialize(data),b.initialize(data)]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);assert.match(r.find(x=>x.status==='rejected').reason.message,/AUTHORITY_ALREADY_INITIALIZED/);
 const ready=await a.read();for(const domain of ['BACKPACK','PRODUCT','COURIER']){assert.throws(()=>a.read({domain}),/DOMAIN_NOT_IMPLEMENTED/);assert.throws(()=>a.initialize({...data,domain}),/DOMAIN_NOT_IMPLEMENTED/);assert.throws(()=>a.command({...change(ready),domain},()=>{}),/DOMAIN_NOT_IMPLEMENTED/)}
 assert.throws(()=>a.initialize({...data,backpack:{}}),/INVALID_INITIALIZATION/);a.close();b.close();
});
test('atomic Life Stage1 reducer throw/thenable/corruption abort without partial writes',async()=>{
 const a=await initialized(),s=await a.read();for(const reducer of [d=>{d.players[s.activePlayerId].displayName='bad';throw Error('REDUCER_FAIL')},()=>Promise.resolve(),d=>{d.revision++},d=>{d.players[s.activePlayerId].xp=999},d=>{d.players[s.activePlayerId].homePlot.ownerPlayerId='other'}]){await assert.rejects(a.command(change(s),reducer));assert.deepEqual(await a.read(),s)}a.close();
});
test('atomic Life Stage1 complete expectation and player isolation are mandatory',async()=>{
 const f=lifeFixture(),legacy=make({storage:f.storage});const first=legacy.activePlayer().playerId,second=legacy.createPlayer().playerId;const envelope=JSON.parse(f.storage.getItem(PLAYER_LIFE_STORAGE_KEY));const a=newAuthority();await a.open();await a.initialize({domain:'PLAYER_LIFE',envelope,confirmLifeOnlyDraft:true});const s=await a.read();
 assert.throws(()=>a.command(change(s,{expected:{revision:s.revision}}),()=>{}),/INVALID_AUTHORITY_EXPECTATIONS/);
 for(const c of [change(s,{playerId:first}),change(s,{expected:{...expected(s),authorityEpoch:'wrong'}})])await assert.rejects(a.command(c,()=>{}));
 await assert.rejects(a.command(change(s),d=>{d.players[first].displayName='wrong Life'}),/NON_TARGET_PLAYER/);await assert.rejects(a.command(change(s),d=>{d.activePlayerId=first}),/SELECTION_MUTATION/);
 const switched=await a.command({domain:'PLAYER_LIFE',kind:'SWITCH',playerId:first,expected:expected(s)});assert.equal(switched.activePlayerId,first);assert.equal(switched.selectionEpoch,s.selectionEpoch+1);assert.equal(switched.envelope.players[second].playerId,second);await assert.rejects(a.command(change(s),()=>{}),/REVISION_CONFLICT/);a.close();
});
test('atomic Life Stage1 immutable cloned snapshots and recursive mutation rejection',async()=>{
 const a=await initialized(),s=await a.read();s.envelope.players[s.activePlayerId].displayName='outside';assert.notEqual((await a.read()).envelope.players[s.activePlayerId].displayName,'outside');const fresh=await a.read();await assert.rejects(a.command(change(fresh),()=>a.command(change(fresh),()=>{})),/REENTRANT_COMMAND/);assert.deepEqual(await a.read(),fresh);assert.throws(()=>a.restore(),/RESTORE_NOT_IMPLEMENTED/);a.close();
});
test('atomic Life Stage1 explicit migration preserves raw source and holds observed divergence',async()=>{
 const {storage,envelope}=lifeFixture(),original=storage.getItem(PLAYER_LIFE_STORAGE_KEY),a=newAuthority();await a.open();const candidate=await a.prepareMigration({domain:'PLAYER_LIFE',sourceStorage:storage});assert.equal(candidate.raw,original);assert.equal((await a.read()).status,'UNINITIALIZED');assert.equal(candidate.sha256.length,64);
 storage.setItem(PLAYER_LIFE_STORAGE_KEY,original+' ');await assert.rejects(a.commitMigration({domain:'PLAYER_LIFE',candidateId:candidate.id,sha256:candidate.sha256,sourceStorage:storage,confirmLifeOnlyDraft:true}),/LEGACY_SOURCE_DIVERGED_HOLD/);assert.equal((await a.read()).status,'UNINITIALIZED');assert.equal((await a.readCandidate(candidate.id)).raw,original);
 storage.setItem(PLAYER_LIFE_STORAGE_KEY,original);const migrated=await a.commitMigration({domain:'PLAYER_LIFE',candidateId:candidate.id,sha256:candidate.sha256,sourceStorage:storage,confirmLifeOnlyDraft:true});assert.deepEqual(migrated.envelope,envelope);assert.equal(storage.getItem(PLAYER_LIFE_STORAGE_KEY),original);assert.deepEqual(migrated.coverage,['PLAYER_LIFE']);assert.equal(migrated.integration,'UNINTEGRATED_DRAFT');a.close();
});
test('atomic Life Stage1 missing/corrupt canonical state never falls back',async()=>{
 for(const mutate of [async db=>rawWrite(db,'PLAYER_LIFE',undefined),async db=>rawWrite(db,'PLAYER_LIFE',{bad:true}),async db=>rawWrite(db,'$authority',{schema:'unsupported'})]){const idb=new IDBFactory(),a=await initialized(idb),db=await rawDb(idb);await mutate(db);await assert.rejects(a.read(),/CORRUPT_AUTHORITY/);await assert.rejects(a.initialize({domain:'PLAYER_LIFE',envelope:lifeFixture().envelope,confirmLifeOnlyDraft:true}),/CORRUPT_AUTHORITY|AUTHORITY_ALREADY_INITIALIZED/);db.close();a.close()}
});

test('atomic Life Stage1 rejects malformed migration and tampered candidate hash',async()=>{
 const {storage}=lifeFixture(),a=newAuthority();await a.open();await assert.rejects(a.prepareMigration({domain:'COURIER',sourceStorage:storage}),/DOMAIN_NOT_IMPLEMENTED/);await assert.rejects(a.prepareMigration({domain:'PLAYER_LIFE',sourceStorage:storage,backpack:{}}),/INVALID_MIGRATION_CANDIDATE/);const c=await a.prepareMigration({domain:'PLAYER_LIFE',sourceStorage:storage});await assert.rejects(a.commitMigration({domain:'PLAYER_LIFE',candidateId:c.id,sha256:'0'.repeat(64),sourceStorage:storage,confirmLifeOnlyDraft:true}),/MIGRATION_CONTENT_MISMATCH/);assert.equal((await a.read()).status,'UNINITIALIZED');a.close();
});
test('atomic Life migration digest distinguishes exact UTF-16 source strings losslessly',async()=>{
 const {storage,envelope}=lifeFixture(),a=newAuthority();await a.open();const player=envelope.players[envelope.activePlayerId];player.displayName='\ud800';const first=JSON.stringify(envelope).replace('\\ud800','\ud800');player.displayName='\ud801';const second=JSON.stringify(envelope).replace('\\ud801','\ud801');assert.notEqual(first,second);assert.deepEqual(new TextEncoder().encode(first),new TextEncoder().encode(second),'direct UTF-8 encoding would lose the differing source code unit');
 storage.setItem(PLAYER_LIFE_STORAGE_KEY,first);const one=await a.prepareMigration({domain:'PLAYER_LIFE',sourceStorage:storage});storage.setItem(PLAYER_LIFE_STORAGE_KEY,second);const two=await a.prepareMigration({domain:'PLAYER_LIFE',sourceStorage:storage});assert.notEqual(one.sha256,two.sha256);assert.equal(one.hashEncoding,'JSON_SOURCE_STRING_V1');assert.equal((await a.readCandidate(one.id)).raw,first);assert.equal((await a.readCandidate(two.id)).raw,second);assert.equal(storage.getItem(PLAYER_LIFE_STORAGE_KEY),second);assert.equal((await a.read()).status,'UNINITIALIZED');a.close();
});
test('atomic Life migration holds unsupported historical digest encoding without rewriting its candidate',async()=>{
 const idb=new IDBFactory(),a=newAuthority(idb),{storage}=lifeFixture();await a.open();const candidate=await a.prepareMigration({domain:'PLAYER_LIFE',sourceStorage:storage}),old=structuredClone(candidate);delete old.hashEncoding;const db=await rawDb(idb);await rawWrite(db,'candidate:'+old.id,old);const original=storage.getItem(PLAYER_LIFE_STORAGE_KEY);
 await assert.rejects(a.readCandidate(old.id),/UNSUPPORTED_MIGRATION_HASH_ENCODING_HOLD/);await assert.rejects(a.commitMigration({domain:'PLAYER_LIFE',candidateId:old.id,sha256:old.sha256,sourceStorage:storage,confirmLifeOnlyDraft:true}),/UNSUPPORTED_MIGRATION_HASH_ENCODING_HOLD/);const saved=await new Promise((resolve,reject)=>{const tx=db.transaction('records','readonly'),r=tx.objectStore('records').get('candidate:'+old.id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});assert.deepEqual(saved,old);assert.equal(storage.getItem(PLAYER_LIFE_STORAGE_KEY),original);assert.equal((await a.read()).status,'UNINITIALIZED');db.close();a.close();
});
test('atomic Life Stage1 immutable candidate identities cannot overwrite',async()=>{
 const {storage}=lifeFixture(),a=newAuthority(new IDBFactory(),{crypto:{getRandomValues:b=>b.fill(7),subtle:globalThis.crypto.subtle}});await a.open();const first=await a.prepareMigration({domain:'PLAYER_LIFE',sourceStorage:storage});await assert.rejects(a.prepareMigration({domain:'PLAYER_LIFE',sourceStorage:storage}));assert.deepEqual(await a.readCandidate(first.id),first);assert.equal((await a.read()).status,'UNINITIALIZED');a.close();
});
test('atomic Life Stage1 put success followed by abort never acknowledges or partially commits',async()=>{
 const idb=new IDBFactory(),a=await initialized(idb),s=await a.read(),db=await rawDb(idb);const probe=db.transaction('records','readonly').objectStore('records'),prototype=Object.getPrototypeOf(probe),original=prototype.put;let successObserved=false;
 prototype.put=function(value,key){const request=original.call(this,value,key);if(key==='PLAYER_LIFE'){const tx=this.transaction;request.addEventListener('success',()=>{successObserved=true;tx.abort()})}return request};
 try{await assert.rejects(a.command(change(s),d=>{d.players[s.activePlayerId].displayName='abort after put'}));assert.equal(successObserved,true)}finally{prototype.put=original}
 assert.deepEqual(await a.read(),s);db.close();a.close();
});
test('atomic Life Stage1 partial initialization puts abort as one transaction',async()=>{
 const idb=new IDBFactory(),a=newAuthority(idb);await a.open();const db=await rawDb(idb),prototype=Object.getPrototypeOf(db.transaction('records','readonly').objectStore('records')),original=prototype.add;
 prototype.add=function(value,key){if(key==='PLAYER_LIFE')throw new DOMException('fixture quota','QuotaExceededError');return original.call(this,value,key)};
 try{await assert.rejects(a.initialize({domain:'PLAYER_LIFE',envelope:lifeFixture().envelope,confirmLifeOnlyDraft:true}),/quota/)}finally{prototype.add=original}
 assert.equal((await a.read()).status,'UNINITIALIZED');const all=await new Promise((resolve,reject)=>{const tx=db.transaction('records','readonly'),r=tx.objectStore('records').getAllKeys();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});assert.deepEqual(all,[]);db.close();a.close();
});
test('atomic Life Stage1 close aborts admitted transaction and reopen is explicit',async()=>{
 const a=await initialized(),s=await a.read(),pending=a.command(change(s),d=>{d.players[s.activePlayerId].displayName='never committed'});a.close();await assert.rejects(pending);assert.throws(()=>a.read(),/AUTHORITY_OPEN_REQUIRED/);await a.open();assert.deepEqual(await a.read(),s);a.close();
});
test('atomic Life Stage1 versionchange closes connection and never recreates newer schema',async()=>{
 const idb=new IDBFactory(),a=await initialized(idb);const newer=await new Promise((resolve,reject)=>{const r=idb.open(authorityName,2);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});assert.throws(()=>a.read(),/AUTHORITY_OPEN_REQUIRED/);await assert.rejects(a.open(),/version|Version/i);newer.close();a.close();
});
test('atomic Life Stage1 close while opening fences delayed admission',async()=>{
 const a=newAuthority(),opening=a.open();a.close();await assert.rejects(opening,/AUTHORITY_CLOSED|Abort/);assert.throws(()=>a.read(),/AUTHORITY_OPEN_REQUIRED/);await a.open();assert.equal((await a.read()).status,'UNINITIALIZED');a.close();
});
test('atomic Life Stage1 CREATE validates new player and never mutates another Life',async()=>{
 const a=await initialized(),s=await a.read(),other=lifeFixture().envelope,player=other.players[other.activePlayerId];const added=await a.command({domain:'PLAYER_LIFE',kind:'CREATE',playerId:player.playerId,expected:expected(s)},d=>{d.players[player.playerId]=player;d.activePlayerId=player.playerId});assert.equal(added.selectionEpoch,s.selectionEpoch+1);assert.deepEqual(added.envelope.players[s.activePlayerId],s.envelope.players[s.activePlayerId]);a.close();
});
test('atomic Life Stage1 consumed event and nonce histories cannot be dropped',async()=>{
 const f=lifeFixture(),legacy=make({storage:f.storage});legacy.recordEvent({id:'consumed',type:'LOOT_DROP'});const a=newAuthority();await a.open();await a.initialize({domain:'PLAYER_LIFE',envelope:JSON.parse(f.storage.getItem(PLAYER_LIFE_STORAGE_KEY)),confirmLifeOnlyDraft:true});const s=await a.read();await assert.rejects(a.command(change(s),d=>{d.players[s.activePlayerId].events=[];d.players[s.activePlayerId].xp=0;d.players[s.activePlayerId].level=1}),/CONSUMED_EVENTS/);assert.deepEqual(await a.read(),s);a.close();
});

test('atomic Life Stage1 actual fresh module import never reads storage globals',async()=>{
 const names=['indexedDB','localStorage'],descriptors=new Map(names.map(n=>[n,Object.getOwnPropertyDescriptor(globalThis,n)]));let touches=0;
 try{for(const n of names)Object.defineProperty(globalThis,n,{configurable:true,get(){touches++;throw Error('inert import touched '+n)}});const fresh=await import('../runtime/player-life-runtime.mjs?inert-stage1-test');const a=fresh.createLocalGameAuthority();assert.equal(touches,0);a.close();assert.equal(touches,0)}finally{for(const n of names){const d=descriptors.get(n);if(d)Object.defineProperty(globalThis,n,d);else delete globalThis[n]}}
});
test('atomic Life Stage1 queued command freezes caller expectation and selected owner',async()=>{
 const a=await initialized(),s=await a.read(),c=change(s),pending=a.command(c,d=>{d.players[s.activePlayerId].displayName='admitted'});c.expected.revision=999;c.playerId='wrong';assert.equal((await pending).envelope.players[s.activePlayerId].displayName,'admitted');a.close();
});
test('atomic Life Stage1 no success before transaction complete',async()=>{
 const idb=new IDBFactory(),a=await initialized(idb),s=await a.read(),db=await rawDb(idb),prototype=Object.getPrototypeOf(db.transaction('records','readonly').objectStore('records')),original=prototype.put;let resolved=false,putSucceeded=false,observedBeforeCommit=false;
 prototype.put=function(value,key){const r=original.call(this,value,key);if(key==='PLAYER_LIFE')r.addEventListener('success',()=>{putSucceeded=true;observedBeforeCommit=!resolved});return r};
 try{await a.command(change(s),d=>{d.players[s.activePlayerId].displayName='committed'}).then(()=>{resolved=true});assert.equal(putSucceeded,true);assert.equal(observedBeforeCommit,true);assert.equal(resolved,true)}finally{prototype.put=original;db.close();a.close()}
});

test('atomic Life Stage1 candidate key and confirmed identity cannot be substituted',async()=>{
 const idb=new IDBFactory(),a=newAuthority(idb),{storage}=lifeFixture();await a.open();const one=await a.prepareMigration({domain:'PLAYER_LIFE',sourceStorage:storage}),two=await a.prepareMigration({domain:'PLAYER_LIFE',sourceStorage:storage}),db=await rawDb(idb);await rawWrite(db,'candidate:'+one.id,two);await assert.rejects(a.readCandidate(one.id),/MIGRATION_CANDIDATE_ID_MISMATCH/);await assert.rejects(a.commitMigration({domain:'PLAYER_LIFE',candidateId:one.id,sha256:one.sha256,sourceStorage:storage,confirmLifeOnlyDraft:true}),/MIGRATION_CANDIDATE_ID_MISMATCH/);assert.equal((await a.read()).status,'UNINITIALIZED');db.close();a.close();
});

test('atomic Life Stage1 missing canonical pair with protected history cannot initialize again',async()=>{
 for(const deleteMarker of [false,true]){const idb=new IDBFactory(),a=await initialized(idb),db=await rawDb(idb);await rawWrite(db,'$authority',undefined);await rawWrite(db,'PLAYER_LIFE',undefined);if(deleteMarker)await rawWrite(db,'$initialized',undefined);await assert.rejects(a.read(),/CORRUPT_AUTHORITY/);await assert.rejects(a.initialize({domain:'PLAYER_LIFE',envelope:lifeFixture().envelope,confirmLifeOnlyDraft:true}),/CORRUPT_AUTHORITY/);await assert.rejects(a.prepareMigration({domain:'PLAYER_LIFE',sourceStorage:lifeFixture().storage}),/CORRUPT_AUTHORITY/);db.close();a.close()}
});

test('atomic Life Stage1 oversized raw legacy source is never archived or initialized',async()=>{
 const {storage}=lifeFixture();storage.setItem(PLAYER_LIFE_STORAGE_KEY,storage.getItem(PLAYER_LIFE_STORAGE_KEY)+' '.repeat(4000000));const a=newAuthority();await a.open();await assert.rejects(a.prepareMigration({domain:'PLAYER_LIFE',sourceStorage:storage}),/STORE_CAPACITY/);assert.equal((await a.read()).status,'UNINITIALIZED');assert.ok(storage.getItem(PLAYER_LIFE_STORAGE_KEY).length>4000000);a.close();
});

test('atomic Life Stage1 validates original non-JSON initialization before cloning',async()=>{
 let getters=0;
 for(const alter of [e=>e.extra=undefined,e=>e.extra=()=>{},e=>e[Symbol('hidden')]=1,e=>e.players[e.activePlayerId].ageRange=NaN,e=>Object.defineProperty(e,'extra',{value:1}),e=>Object.defineProperty(e,'extra',{enumerable:true,get(){getters++;return 1}})]){const a=newAuthority(),envelope=lifeFixture().envelope;await a.open();alter(envelope);assert.throws(()=>a.initialize({domain:'PLAYER_LIFE',envelope,confirmLifeOnlyDraft:true}),/CORRUPT_AUTHORITY|INVALID_AUTHORITY_JSON/);assert.equal((await a.read()).status,'UNINITIALIZED');a.close()}assert.equal(getters,0);
});
test('atomic Life Stage1 refuses non-JSON command tokens before clone can drop fields',async()=>{
 const a=await initialized(),s=await a.read(),input=change(s);input.expected.extra=undefined;assert.throws(()=>a.command(input,()=>{}),/INVALID_AUTHORITY_JSON/);assert.deepEqual(await a.read(),s);a.close();
});

test('atomic Life Stage1 validates reducer draft before equality checks can invoke getters',async()=>{
 const a=await initialized(),s=await a.read();let getters=0;await assert.rejects(a.command(change(s),d=>{Object.defineProperty(d.players[s.activePlayerId],'displayName',{enumerable:true,get(){getters++;return 'must not run'}})}),/INVALID_AUTHORITY_JSON/);assert.equal(getters,0);assert.deepEqual(await a.read(),s);a.close();
});

// Full-mode fixtures are seeded ONLY in isolated fake-IDB. No public migration
// or promotion API exists; this does not establish production cutover.
import {createBackpack,storeItem} from '../runtime/backpack-runtime.mjs';
import {createPlayerCourierOffer,createPlayerCourierStore,quoteCargoInsurance} from '../runtime/digital-ant-logistics-runtime.mjs';
const fullSchema='KAIOS_LOCAL_GAME_FULL_DRAFT_V1';
const fullDomains=['PLAYER_LIFE','BACKPACK','PRODUCT','COURIER'];
const fullKey=ref=>ref.domain==='PLAYER_LIFE'?'PLAYER_LIFE':ref.domain==='COURIER'?'COURIER':ref.domain+':'+ref.playerId+(ref.domain==='PRODUCT'?':'+ref.owner:'');
const fullProduct=playerId=>({schema:'K11520_LOCAL_SIMULATION_V2',playerId,owner:'guest',revision:0,ledger:{...createKgenLedger(100),owner:'guest'},progress:{kaios:0,claimableKaios:0,spentKaios:0,loot:0,xp:0,engineXp:0,playedMs:0,events:{},courierReceipts:[],courierInsuranceReceipts:{},courierReceiptBindings:{},courierInsuranceBindings:{}}});
async function fullFixture({absentBag=false,pending=false,insuranceMode=null}={}){
 const idb=new IDBFactory(),a=newAuthority(idb);await a.open();const f=lifeFixture(),legacy=make({storage:f.storage});const other=legacy.activePlayer().playerId,selected=legacy.createPlayer().playerId,life=JSON.parse(f.storage.getItem(PLAYER_LIFE_STORAGE_KEY));
 let courier={schema:'K11520_PLAYER_COURIER',revision:0,missions:{},activeByCourier:{},settledReceipts:[],lootReceipts:[]};
 if(pending||insuranceMode){
  const cs=memory(),store=createPlayerCourierStore({storage:cs,now:()=>10000,monotonicNow:()=>100,sessionId:'FULL-A'}),quote=insuranceMode?quoteCargoInsurance({cargoAmount:1000,reserveKaios:1000}):null,offer=createPlayerCourierOffer({missionId:'FULL-MISSION',requesterLifeId:'REQUESTER-QA',cargoId:'FULL-CARGO',cargoAmount:1000,freightFeeKaios:8,courierSalaryKaios:3,estimatedDurationMs:300000,createdAt:1000,insuranceQuote:quote}),mission=store.accept(offer,{courierLifeId:selected});
  if(pending){const later=createPlayerCourierStore({storage:cs,now:()=>mission.dueAt,monotonicNow:()=>0,sessionId:'FULL-B'});later.settleDue(mission.missionId,{courierLifeId:selected})}
  if(insuranceMode==='PENDING'){store.activateInsurance(mission.missionId,{courierLifeId:selected,paymentEvidence:{ok:true,amount:quote.premiumKaios,purpose:'PLAYER_COURIER_INSURANCE_PREMIUM',scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'}});store.raid(mission.missionId,{attackerLifeId:other,banditMode:true,action:'CARGO_RAID_ACTION',attackPower:100,defensePower:0,distanceMeters:1,replayKey:'FULL-RAID',wallNow:mission.bandit.attackWindowStartsAt})}
  courier=JSON.parse(cs.getItem('K11520_PLAYER_COURIER'));const m=courier.missions['FULL-MISSION'];
  // Explicit isolated shapes for the pending protocol; this branch has no live pending caller.
  if(pending){m.status='DELIVERY_PENDING_CREDIT';m.settlement.outcome=m.status;m.cargo.ownerState='OWNED_BY_COURIER';m.cargo.ownerLifeId=selected;courier.activeByCourier[selected]=m.missionId;m.settlement.credit={status:'PENDING',receiptId:m.settlement.receiptId,missionId:m.missionId,playerId:selected,owner:'guest',rewardKaios:m.settlement.rewardKaios,purpose:'PLAYER_COURIER_REWARD'}}
  if(insuranceMode==='PENDING')m.insurance.credit={status:'PENDING',receiptId:m.insurance.payoutReceiptId,missionId:m.missionId,playerId:selected,owner:'guest',rewardKaios:m.insurance.payoutKaios,purpose:'PLAYER_COURIER_INSURANCE_PAYOUT'};
 }
 const entries=[{ref:{domain:'PLAYER_LIFE'},value:life},{ref:{domain:'COURIER'},value:courier}];
 for(const playerId of [other,selected]){entries.push({ref:{domain:'BACKPACK',playerId},value:absentBag&&playerId===selected?undefined:{revision:0,data:createBackpack({ownerId:playerId})}});entries.push({ref:{domain:'PRODUCT',playerId,owner:'guest'},value:fullProduct(playerId)})}
 const meta={schema:fullSchema,integration:'UNINTEGRATED_DRAFT',coverage:fullDomains,authorityEpoch:'b'.repeat(32),selectionEpoch:0,activePlayerId:selected,catalogRevision:0,catalog:entries.map(e=>({ref:e.ref,presence:e.value===undefined?'ABSENT':'PRESENT'})),legacyUnbound:[]};
 const db=await rawDb(idb);await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite'),os=tx.objectStore('records');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);os.put(meta,'$authority');os.put({authorityEpoch:meta.authorityEpoch,coverage:fullDomains,catalogRevision:0},'$initialized');os.put({kind:'ISOLATED_FULL_DRAFT_FIXTURE'},'archive:'+meta.authorityEpoch);for(const e of entries)if(e.value!==undefined)os.put(e.value,fullKey(e.ref))});db.close();await a.openGame();return {a,idb,selected,other,meta};
}
const gameExpected=s=>({authorityEpoch:s.authorityEpoch,selectionEpoch:s.selectionEpoch,catalogRevision:s.catalogRevision,records:s.records.map(({ref,revision})=>({ref,revision}))});
const gameCommand=(s,kind='PLAYER_UPDATE',extra={})=>({kind,playerId:s.activePlayerId,owner:'guest',expected:gameExpected(s),...extra});
const domainValue=(drafts,domain,playerId,owner='guest')=>drafts.find(e=>e.ref.domain===domain&&(playerId===undefined||e.ref.playerId===playerId)&&(domain!=='PRODUCT'||e.ref.owner===owner)).value;

test('full atomic draft modes cannot bypass partial/full coverage and expose no migration API',async()=>{
 const partial=await initialized();await partial.openGame();await assert.rejects(partial.readGame(),/PARTIAL_AUTHORITY/);partial.close();const {a}=await fullFixture();await assert.rejects(a.read(),/FULL_AUTHORITY_REQUIRES_GAME_API/);await assert.rejects(a.command({domain:'PLAYER_LIFE',kind:'UPDATE',playerId:'KAIOS-P-'+'a'.repeat(32),expected:{authorityEpoch:'b'.repeat(32),selectionEpoch:0,revision:1}},()=>{}),/FULL_AUTHORITY_REQUIRES_GAME_API/);assert.equal(a.initializeGame,undefined);assert.equal(a.promote,undefined);a.close();
});
test('full atomic draft complete revision vector detects stale non-target records',async()=>{
 const {a,idb,other}=await fullFixture(),s=await a.readGame(),db=await rawDb(idb),record=s.records.find(e=>e.ref.domain==='PRODUCT'&&e.ref.playerId===other);await rawWrite(db,fullKey(record.ref),{...record.value,revision:record.revision+1});await assert.rejects(a.commandGame(gameCommand(s),ds=>{domainValue(ds,'PLAYER_LIFE').players[s.activePlayerId].displayName='stale'}),/REVISION_CONFLICT/);assert.notEqual((await a.readGame()).records.find(e=>e.ref.domain==='PLAYER_LIFE').value.players[s.activePlayerId].displayName,'stale');db.close();a.close();
});
test('full atomic draft rejects omitted/extra revision entries and non-target mutation',async()=>{
 const {a,other}=await fullFixture(),s=await a.readGame();for(const edit of [e=>e.records.pop(),e=>e.records.push(e.records[0]),e=>delete e.catalogRevision]){const input=gameCommand(s);edit(input.expected);await assert.rejects(a.commandGame(input,()=>{}))}
 await assert.rejects(a.commandGame(gameCommand(s),ds=>{domainValue(ds,'PLAYER_LIFE').players[other].displayName='wrong'}),/NON_TARGET/);await assert.rejects(a.commandGame(gameCommand(s,'INVENTORY_UPDATE'),ds=>{domainValue(ds,'BACKPACK',other).updatedAt++}),/NON_TARGET/);assert.deepEqual(await a.readGame(),s);a.close();
});
test('full atomic draft distinguishes declared absence from missing canonical records',async()=>{
 const {a,idb,selected}=await fullFixture({absentBag:true}),s=await a.readGame();assert.equal(s.records.find(e=>e.ref.domain==='BACKPACK'&&e.ref.playerId===selected).revision,null);await assert.rejects(a.commandGame(gameCommand(s,'INVENTORY_UPDATE'),()=>{}),/DOMAIN_RECORD_ABSENT/);const db=await rawDb(idb);await rawWrite(db,'PRODUCT:'+selected+':guest',undefined);await assert.rejects(a.readGame(),/CORRUPT_FULL_AUTHORITY/);db.close();a.close();
});
test('full atomic draft validates catalog census and refuses undeclared rows',async()=>{
 const {a,idb}=await fullFixture(),db=await rawDb(idb);await rawWrite(db,'PRODUCT:unknown:guest',{});await assert.rejects(a.readGame(),/CORRUPT_FULL_AUTHORITY/);db.close();a.close();
});
test('full atomic draft two connections N/N produce one commit and one conflict',async()=>{
 const {a,idb}=await fullFixture(),b=newAuthority(idb);await b.openGame();const s=await a.readGame(),run=(store,name)=>store.commandGame(gameCommand(s),ds=>{domainValue(ds,'PLAYER_LIFE').players[s.activePlayerId].displayName=name});const results=await Promise.allSettled([run(a,'A'),run(b,'B')]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.match(results.find(r=>r.status==='rejected').reason.message,/REVISION_CONFLICT/);a.close();b.close();
});
function creditAndAcknowledge(drafts,playerId){const product=domainValue(drafts,'PRODUCT',playerId),courier=domainValue(drafts,'COURIER'),mission=courier.missions['FULL-MISSION'],credit=mission.settlement.credit,{status,...binding}=credit;product.progress.courierReceipts.push(credit.receiptId);product.progress.courierReceiptBindings[credit.receiptId]=binding;product.progress.kaios+=credit.rewardKaios;product.progress.xp+=12;product.progress.events.COURIER_SETTLEMENT=1;credit.status='CONFIRMED';mission.status='DELIVERED';mission.settlement.outcome='DELIVERED';mission.cargo.ownerState='DELIVERED_TO_DESTINATION';mission.cargo.ownerLifeId=null;delete courier.activeByCourier[playerId]}
test('full atomic draft own Courier credit and acknowledgement commit together',async()=>{
 const {a}=await fullFixture({pending:true}),s=await a.readGame(),after=await a.commandGame(gameCommand(s,'OWN_COURIER_TRANSACTION',{missionId:'FULL-MISSION'}),ds=>creditAndAcknowledge(ds,s.activePlayerId));assert.equal(domainValue(after.records,'COURIER').missions['FULL-MISSION'].status,'DELIVERED');assert.equal(domainValue(after.records,'PRODUCT',s.activePlayerId).progress.courierReceipts.length,1);a.close();
});
test('full atomic draft rejects matching credit metadata without the complete reward delta',async()=>{
 const {a}=await fullFixture({pending:true}),s=await a.readGame();
 for(const missing of ['kaios','xp','events']){await assert.rejects(a.commandGame(gameCommand(s,'OWN_COURIER_TRANSACTION',{missionId:'FULL-MISSION'}),ds=>{creditAndAcknowledge(ds,s.activePlayerId);const p=domainValue(ds,'PRODUCT',s.activePlayerId);p.progress[missing]=structuredClone(domainValue(s.records,'PRODUCT',s.activePlayerId).progress[missing])}));assert.deepEqual(await a.readGame(),s)}a.close();
});
test('full atomic draft confirm-only acknowledgement never rewrites a credited product',async()=>{
 const {a,idb,selected}=await fullFixture({pending:true}),s=await a.readGame(),ds=s.records.map(({ref,value})=>({ref,value:structuredClone(value)}));creditAndAcknowledge(ds,selected);const db=await rawDb(idb);await rawWrite(db,'PRODUCT:'+selected+':guest',domainValue(ds,'PRODUCT',selected));const before=await a.readGame(),product=domainValue(before.records,'PRODUCT',selected);
 const after=await a.commandGame(gameCommand(before,'OWN_COURIER_TRANSACTION',{missionId:'FULL-MISSION'}),drafts=>{const target=domainValue(drafts,'COURIER'),paid=domainValue(ds,'COURIER');target.missions=structuredClone(paid.missions);target.activeByCourier=structuredClone(paid.activeByCourier)});assert.deepEqual(domainValue(after.records,'PRODUCT',selected),product);assert.equal(domainValue(after.records,'COURIER').missions['FULL-MISSION'].status,'DELIVERED');db.close();a.close();
});
function insuranceCreditAndAcknowledge(drafts,playerId){const p=domainValue(drafts,'PRODUCT',playerId).progress,m=domainValue(drafts,'COURIER').missions['FULL-MISSION'],i=m.insurance,{status,...binding}=i.credit;p.courierInsuranceReceipts[binding.receiptId]=binding.rewardKaios;p.courierInsuranceBindings[binding.receiptId]=binding;p.kaios+=binding.rewardKaios;p.events.COURIER_INSURANCE_PAYOUT=1;i.credit.status='CONFIRMED';i.claimStatus='PAID';i.paidAt=m.settlement.settledAt+1;i.payoutEvidence={receiptId:binding.receiptId,rewardKaios:binding.rewardKaios,scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER',replayed:false}}
test('full atomic draft insured payout requires its exact delta and commits with acknowledgement',async()=>{
 const {a}=await fullFixture({insuranceMode:'PENDING'}),s=await a.readGame();
 for(const missing of ['kaios','events']){await assert.rejects(a.commandGame(gameCommand(s,'OWN_COURIER_TRANSACTION',{missionId:'FULL-MISSION'}),ds=>{insuranceCreditAndAcknowledge(ds,s.activePlayerId);domainValue(ds,'PRODUCT',s.activePlayerId).progress[missing]=structuredClone(domainValue(s.records,'PRODUCT',s.activePlayerId).progress[missing])}));assert.deepEqual(await a.readGame(),s)}
 const after=await a.commandGame(gameCommand(s,'OWN_COURIER_TRANSACTION',{missionId:'FULL-MISSION'}),ds=>insuranceCreditAndAcknowledge(ds,s.activePlayerId)),product=domainValue(after.records,'PRODUCT',s.activePlayerId);assert.equal(product.progress.kaios,720);assert.equal(product.progress.xp,0);assert.equal(domainValue(after.records,'COURIER').missions['FULL-MISSION'].insurance.claimStatus,'PAID');const replay=await a.commandGame(gameCommand(after,'OWN_COURIER_TRANSACTION',{missionId:'FULL-MISSION'}),()=>{});assert.deepEqual(replay,after);a.close();
});
test('full atomic draft premium activation remains held without a typed atomic debit',async()=>{
 const {a}=await fullFixture({insuranceMode:'QUOTE'}),s=await a.readGame();await assert.rejects(a.commandGame(gameCommand(s,'OWN_COURIER_TRANSACTION',{missionId:'FULL-MISSION'}),ds=>{const i=domainValue(ds,'COURIER').missions['FULL-MISSION'].insurance;i.status='ACTIVE';i.premiumPaidKaios=i.premiumKaios;i.activatedAt=10000;i.paymentEvidence={amount:i.premiumKaios,purpose:'PLAYER_COURIER_INSURANCE_PREMIUM',scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'}}),/UNSUPPORTED_INSURANCE_TRANSITION/);assert.deepEqual(await a.readGame(),s);a.close();
});
test('full atomic draft terminal missions cannot rewrite clock or custody history',async()=>{
 const {a}=await fullFixture({pending:true}),s=await a.readGame(),paid=await a.commandGame(gameCommand(s,'OWN_COURIER_TRANSACTION',{missionId:'FULL-MISSION'}),ds=>creditAndAcknowledge(ds,s.activePlayerId));await assert.rejects(a.commandGame(gameCommand(paid,'OWN_COURIER_TRANSACTION',{missionId:'FULL-MISSION'}),ds=>{domainValue(ds,'COURIER').missions['FULL-MISSION'].lastWallAt++}),/TERMINAL_MISSION_CHANGED/);assert.deepEqual(await a.readGame(),paid);a.close();
});
test('full atomic draft abort after product put preserves product and Courier',async()=>{
 const {a,idb}=await fullFixture({pending:true}),s=await a.readGame(),db=await rawDb(idb),prototype=Object.getPrototypeOf(db.transaction('records','readonly').objectStore('records')),original=prototype.put;prototype.put=function(v,k){const r=original.call(this,v,k);if(k==='PRODUCT:'+s.activePlayerId+':guest'){const tx=this.transaction;r.addEventListener('success',()=>tx.abort())}return r};try{await assert.rejects(a.commandGame(gameCommand(s,'OWN_COURIER_TRANSACTION',{missionId:'FULL-MISSION'}),ds=>creditAndAcknowledge(ds,s.activePlayerId)))}finally{prototype.put=original}assert.deepEqual(await a.readGame(),s);db.close();a.close();
});
test('full atomic draft prevents unproved acknowledgement and binding downgrade',async()=>{
 const {a}=await fullFixture({pending:true}),s=await a.readGame();await assert.rejects(a.commandGame(gameCommand(s,'OWN_COURIER_TRANSACTION',{missionId:'FULL-MISSION'}),ds=>{creditAndAcknowledge(ds,s.activePlayerId);domainValue(ds,'PRODUCT',s.activePlayerId).progress.courierReceiptBindings={}}));assert.deepEqual(await a.readGame(),s);const after=await a.commandGame(gameCommand(s,'OWN_COURIER_TRANSACTION',{missionId:'FULL-MISSION'}),ds=>creditAndAcknowledge(ds,s.activePlayerId));await assert.rejects(a.commandGame(gameCommand(after,'PRODUCT_UPDATE'),ds=>{domainValue(ds,'PRODUCT',s.activePlayerId).progress.courierReceiptBindings={}}));assert.deepEqual(await a.readGame(),after);a.close();
});

test('full atomic draft dedicated switch changes only shared selection and its epoch',async()=>{
 const {a,other}=await fullFixture(),before=await a.readGame(),after=await a.commandGame(gameCommand(before,'SWITCH',{playerId:other}));assert.equal(after.activePlayerId,other);assert.equal(after.selectionEpoch,before.selectionEpoch+1);for(const r of before.records)if(r.ref.domain!=='PLAYER_LIFE')assert.deepEqual(after.records.find(v=>fullKey(v.ref)===fullKey(r.ref)),r);await assert.rejects(a.commandGame(gameCommand(before),()=>{}),/REVISION_CONFLICT/);a.close();
});
test('full atomic draft credit namespace is immutable and generic product writes cannot bypass acknowledgement',async()=>{
 const {a}=await fullFixture({pending:true}),s=await a.readGame();await assert.rejects(a.commandGame(gameCommand(s,'PRODUCT_UPDATE'),ds=>{const p=domainValue(ds,'PRODUCT',s.activePlayerId),m=domainValue(ds,'COURIER').missions['FULL-MISSION'],{status,...binding}=m.settlement.credit;p.progress.courierReceipts.push(binding.receiptId);p.progress.courierReceiptBindings[binding.receiptId]=binding}),/COURIER_TRANSACTION_REQUIRED/);
 await assert.rejects(a.commandGame(gameCommand(s,'OWN_COURIER_TRANSACTION',{missionId:'FULL-MISSION'}),ds=>{creditAndAcknowledge(ds,s.activePlayerId);domainValue(ds,'COURIER').missions['FULL-MISSION'].settlement.credit.owner='0x'+'a'.repeat(40)}));assert.deepEqual(await a.readGame(),s);a.close();
});
test('full atomic draft legacy classification remains immutable and cannot authorize backpay',async()=>{
 const {a,idb,selected}=await fullFixture(),db=await rawDb(idb),key='PRODUCT:'+selected+':guest',before=await a.readGame(),product=structuredClone(domainValue(before.records,'PRODUCT',selected)),id='COURIER-RECEIPT-12345678';product.progress.courierReceipts.push(id);await rawWrite(db,key,product);await assert.rejects(a.readGame(),/LEGACY_PROVENANCE_MISMATCH/);
 const meta=await new Promise((resolve,reject)=>{const tx=db.transaction('records','readonly'),r=tx.objectStore('records').get('$authority');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});meta.legacyUnbound=[JSON.stringify([key,'PLAYER_COURIER_REWARD',id,null])];await rawWrite(db,'$authority',meta);const legacy=await a.readGame();assert.equal(domainValue(legacy.records,'PRODUCT',selected).progress.courierReceiptBindings[id],undefined);await assert.rejects(a.commandGame(gameCommand(legacy,'PRODUCT_UPDATE'),ds=>{domainValue(ds,'PRODUCT',selected).progress.courierReceipts=[]}),/IMMUTABLE_HISTORY/);assert.deepEqual(await a.readGame(),legacy);db.close();a.close();
});

import {observeSimulationPrice,placeSimulationOrder,closeSimulationPosition} from '../runtime/kgen-margin-runtime.mjs';
test('full atomic draft retains consumed simulation identities instead of resetting the book',async()=>{
 const {a,idb,selected}=await fullFixture(),db=await rawDb(idb),state=await a.readGame(),product=structuredClone(domainValue(state.records,'PRODUCT',selected));observeSimulationPrice(product.ledger,{market:'BTCUSDT',price:99,observedAt:1000,now:1000});placeSimulationOrder(product.ledger,{axis:'KX',market:'BTCUSDT',c:1,lots:1,triggerPrice:100,now:1001});observeSimulationPrice(product.ledger,{market:'BTCUSDT',price:100,observedAt:1002,now:1002});closeSimulationPosition(product.ledger,product.ledger.simulation.positions[0].positionId,{now:1003});await rawWrite(db,'PRODUCT:'+selected+':guest',product);const before=await a.readGame();
 await assert.rejects(a.commandGame(gameCommand(before,'PRODUCT_UPDATE'),ds=>{delete domainValue(ds,'PRODUCT',selected).ledger.simulation}),/SIMULATION_HISTORY_CHANGED/);await assert.rejects(a.commandGame(gameCommand(before,'PRODUCT_UPDATE'),ds=>{domainValue(ds,'PRODUCT',selected).ledger.simulation={sequence:0,orders:[],positions:[],receipts:[],observations:{}}}),/SIMULATION_HISTORY_CHANGED/);assert.deepEqual(await a.readGame(),before);db.close();a.close();
});

test('atomic Life Stage1 rejects array-coerced selected IDs without self-corrupting state',async()=>{
 const a=await initialized(),s=await a.read();await assert.rejects(a.command({domain:'PLAYER_LIFE',kind:'SWITCH',playerId:[s.activePlayerId],expected:expected(s)}),/INVALID_PLAYER_ID/);assert.deepEqual(await a.read(),s);const e=lifeFixture().envelope;e.activePlayerId=[e.activePlayerId];assert.throws(()=>a.initialize({domain:'PLAYER_LIFE',envelope:e,confirmLifeOnlyDraft:true}),/CORRUPT_AUTHORITY/);a.close();
});
test('full atomic draft rejects array-coerced selection, owner and catalog references',async()=>{
 const {a,idb,meta}=await fullFixture(),s=await a.readGame();for(const changes of [{playerId:[s.activePlayerId]},{owner:['0x'+'a'.repeat(40)]}])await assert.rejects(a.commandGame(gameCommand(s,'SWITCH',changes)),/INVALID_GAME_NAMESPACE/);assert.deepEqual(await a.readGame(),s);const db=await rawDb(idb),bad=structuredClone(meta),ref=bad.catalog.find(e=>e.ref.domain==='PRODUCT').ref;ref.playerId=[ref.playerId];await rawWrite(db,'$authority',bad);await assert.rejects(a.readGame(),/CORRUPT_FULL_AUTHORITY/);db.close();a.close();
});

// Stage2B captures synthetic source strings only; no production migration caller.
function gameCaptureFixture(){
 const {envelope}=lifeFixture(),id=envelope.activePlayerId,product=fullProduct(id);product.schema='K11520_LOCAL_SIMULATION_V1';delete product.playerId;delete product.progress.courierReceiptBindings;delete product.progress.courierInsuranceBindings;
 const data=new Map([[PLAYER_LIFE_STORAGE_KEY,JSON.stringify(envelope)],['K11520_PLAYER_COURIER',JSON.stringify({schema:'K11520_PLAYER_COURIER',revision:0,missions:{},activeByCourier:{},settledReceipts:[],lootReceipts:[]})],['k11520.player:'+id+':11520.backpack.v1',JSON.stringify(createBackpack({ownerId:id}))],['k11520.player:'+id+':k11520.local-product.v1:guest',JSON.stringify(product)]]),reads=[];let writes=0;
 const sourceStorage={get length(){return data.size},key:n=>[...data.keys()][n]??null,getItem:key=>{reads.push(key);return data.get(key)??null},setItem(){writes++;throw Error('SOURCE_WRITE_FORBIDDEN')},removeItem(){writes++;throw Error('SOURCE_WRITE_FORBIDDEN')}};
 return {data,reads,sourceStorage,id,envelope,product,get writes(){return writes}};
}
async function captureAuthority(indexedDB=new IDBFactory(),extra={}){const a=newAuthority(indexedDB,extra);await a.openGame();return a}
test('full migration candidate preserves exact sources and creates no authority marker',async()=>{
 const a=await captureAuthority(),f=gameCaptureFixture(),original=[...f.data];const c=await a.prepareGameMigration({sourceStorage:f.sourceStorage});assert.equal(c.status,'REVIEWABLE_CAPTURE');assert.equal(c.hashEncoding,'JSON_SOURCE_STRING_V1');assert.deepEqual(c.holds,[]);assert.equal(c.proposal.records.find(r=>r.ref.domain==='PRODUCT').value.schema,'K11520_LOCAL_SIMULATION_V2');assert.equal(c.sources.find(s=>s.key===PLAYER_LIFE_STORAGE_KEY).raw,f.data.get(PLAYER_LIFE_STORAGE_KEY));assert.deepEqual(await a.readGameCandidate(c.id),c);assert.deepEqual([...f.data],original);assert.equal(f.writes,0);assert.equal((await a.read()).status,'UNINITIALIZED');await assert.rejects(a.readGame(),/FULL_AUTHORITY_NOT_INITIALIZED/);a.close();
});
test('full migration capture never reads secrets, unknown scoped values or training companion',async()=>{
 const a=await captureAuthority(),f=gameCaptureFixture(),unknown='k11520.player:'+f.id+':unknown.future',training='k11520.player:'+f.id+':k11520.market-life.training';f.data.set('auth.secret','secret');f.data.set(unknown,'private unknown');f.data.set(training,'training data');const c=await a.prepareGameMigration({sourceStorage:f.sourceStorage});assert.equal(c.status,'HOLD');for(const k of ['auth.secret',unknown,training]){assert.equal(f.reads.includes(k),false);assert.equal(c.sources.some(s=>s.key===k),false)}assert.ok(c.censuses.before.includes(unknown));assert.ok(c.holds.some(h=>h.code==='UNSUPPORTED_TRAINING_COMPANION'));assert.equal(f.writes,0);a.close();
});
test('full migration explicit null differs from absent and legacy owner cannot assign money',async()=>{
 for(const mode of ['ABSENT','NULL','LEGACY']){const a=await captureAuthority(),f=gameCaptureFixture(),key='k11520.player:'+f.id+':k11520.local-product.v1:guest';if(mode==='ABSENT')f.data.delete(key);if(mode==='NULL')f.data.set(key,'null');if(mode==='LEGACY'){f.data.set('k11520.local-product.v1:guest',f.data.get(key));f.data.set('k11520.player-life.legacy-owner',f.id)}const original=[...f.data],c=await a.prepareGameMigration({sourceStorage:f.sourceStorage});assert.equal(c.status,'HOLD');assert.ok(c.holds.some(h=>h.code===(mode==='ABSENT'?'INCOMPLETE_SOURCE':mode==='NULL'?'INVALID_SOURCE':'AMBIGUOUS_LEGACY_SOURCE')));assert.equal(c.proposal.catalog.find(e=>e.ref.domain==='PRODUCT').presence,mode==='ABSENT'?'ABSENT':mode==='NULL'?'INVALID':'PRESENT');assert.deepEqual([...f.data],original);a.close()}
});
test('full migration orphan namespaces remain unread and explicitly held',async()=>{
 const a=await captureAuthority(),f=gameCaptureFixture(),orphan='k11520.player:KAIOS-P-'+ 'd'.repeat(32)+':11520.backpack.v1';f.data.set(orphan,'orphan private value');const c=await a.prepareGameMigration({sourceStorage:f.sourceStorage});assert.equal(f.reads.includes(orphan),false);assert.equal(c.sources.some(s=>s.key===orphan),false);assert.ok(c.holds.some(h=>h.code==='ORPHAN_SCOPED_SOURCE'&&h.sourceKey===orphan));a.close();
});
async function authorityKeys(idb){const db=await rawDb(idb);try{return await new Promise((resolve,reject)=>{const tx=db.transaction('records','readonly'),r=tx.objectStore('records').getAllKeys();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}finally{db.close()}}
test('full migration V1 conversion preserves1001 tombstones and opaque fields without backpay',async()=>{
 const a=await captureAuthority(),f=gameCaptureFixture(),key='k11520.player:'+f.id+':k11520.local-product.v1:guest';f.product.progress.courierReceipts=Array.from({length:1001},(_,i)=>'COURIER-RECEIPT-'+i.toString(16).padStart(8,'0'));f.product.progress.courierInsuranceReceipts=Object.fromEntries(Array.from({length:1001},(_,i)=>['COURIER-INSURANCE-'+i.toString(16).padStart(8,'0'),i]));f.product.extension={keep:['opaque','界']};f.data.set(key,JSON.stringify(f.product));const original=f.data.get(key),c=await a.prepareGameMigration({sourceStorage:f.sourceStorage}),p=c.proposal.records.find(r=>r.ref.domain==='PRODUCT').value;assert.equal(c.status,'REVIEWABLE_CAPTURE');assert.deepEqual(p.progress.courierReceipts,f.product.progress.courierReceipts);assert.deepEqual(p.progress.courierInsuranceReceipts,f.product.progress.courierInsuranceReceipts);assert.deepEqual(p.extension,f.product.extension);assert.equal(p.progress.kaios,0);assert.equal(c.legacyUnbound.length,2002);assert.equal(c.sources.find(s=>s.key===key).raw,original);assert.deepEqual(await a.readGameCandidate(c.id),c);a.close();
});
test('full migration malformed recognized fields are archived HOLD without normalization',async()=>{
 for(const edit of [v=>v.progress.courierReceipts=null,v=>delete v.progress.kaios,v=>delete v.progress,v=>v.playerId='KAIOS-P-'+ 'f'.repeat(32),v=>v.owner='0x'+'a'.repeat(40),v=>v.progress.courierReceipts=['courier-receipt-abcdef01']]){const a=await captureAuthority(),f=gameCaptureFixture(),key='k11520.player:'+f.id+':k11520.local-product.v1:guest';edit(f.product);const raw=JSON.stringify(f.product);f.data.set(key,raw);const c=await a.prepareGameMigration({sourceStorage:f.sourceStorage});assert.equal(c.status,'HOLD');assert.equal(c.sources.find(s=>s.key===key).raw,raw);assert.equal(f.data.get(key),raw);assert.equal(f.writes,0);a.close()}
});
test('full migration captures source value and census divergence as preserved HOLD',async()=>{
 for(const census of [false,true]){const f=gameCaptureFixture(),idb=new IDBFactory();let changed=false;const crypto={getRandomValues:a=>globalThis.crypto.getRandomValues(a),subtle:{digest:async(...args)=>{if(!changed){changed=true;if(census)f.data.set('k11520.player:'+f.id+':future.data','unexamined');else f.data.set(PLAYER_LIFE_STORAGE_KEY,f.data.get(PLAYER_LIFE_STORAGE_KEY)+' ')}return globalThis.crypto.subtle.digest(...args)}}};const a=await captureAuthority(idb,{crypto}),initial=f.data.get(PLAYER_LIFE_STORAGE_KEY),c=await a.prepareGameMigration({sourceStorage:f.sourceStorage});assert.equal(c.status,'HOLD');assert.ok(c.holds.some(h=>h.code==='SOURCE_DIVERGED_HOLD'));assert.equal(c.sources.find(s=>s.key===PLAYER_LIFE_STORAGE_KEY).raw,initial);assert.deepEqual(await a.readGameCandidate(c.id),c);assert.equal(f.writes,0);a.close()}
});
test('full migration unreadable or unstable enumeration never masquerades as absent',async()=>{
 for(const mode of ['READ','DUPLICATE','NULL_KEY','LIMIT']){const idb=new IDBFactory(),a=await captureAuthority(idb),f=gameCaptureFixture(),source=Object.create(f.sourceStorage);if(mode==='READ')source.getItem=()=>{throw Error('unavailable')};if(mode==='DUPLICATE')source.key=()=>PLAYER_LIFE_STORAGE_KEY;if(mode==='NULL_KEY')source.key=()=>null;if(mode==='LIMIT')Object.defineProperty(source,'length',{value:4097});await assert.rejects(a.prepareGameMigration({sourceStorage:source}),/_HOLD/);assert.deepEqual(await authorityKeys(idb),[]);assert.equal(f.writes,0);a.close()}
});
test('full migration preflight authority and input admission occurs before source reads',async()=>{
 for(const mode of ['PARTIAL','FULL']){const a=mode==='PARTIAL'?await initialized():(await fullFixture()).a;await a.openGame();const f=gameCaptureFixture();await assert.rejects(a.prepareGameMigration({sourceStorage:f.sourceStorage}),/AUTHORITY_OR_UNKNOWN_RECORDS_HOLD/);assert.equal(f.reads.length,0);a.close()}
 const idb=new IDBFactory(),a=await captureAuthority(idb);let calls=0;const input={};Object.defineProperty(input,'sourceStorage',{enumerable:true,get(){calls++;return gameCaptureFixture().sourceStorage}});await assert.rejects(a.prepareGameMigration(input),/INVALID_CAPTURE_INPUT/);assert.equal(calls,0);assert.deepEqual(await authorityKeys(idb),[]);a.close();
});
test('full migration rechecks authority absence after asynchronous capture work',async()=>{
 const idb=new IDBFactory(),f=gameCaptureFixture();let a,installed=false;const crypto={getRandomValues:v=>globalThis.crypto.getRandomValues(v),subtle:{digest:async(...args)=>{if(!installed){installed=true;await a.initialize({domain:'PLAYER_LIFE',envelope:f.envelope,confirmLifeOnlyDraft:true})}return globalThis.crypto.subtle.digest(...args)}}};a=await captureAuthority(idb,{crypto});await assert.rejects(a.prepareGameMigration({sourceStorage:f.sourceStorage}),/AUTHORITY_OR_UNKNOWN_RECORDS_HOLD/);assert.equal((await a.read()).status,'READY');assert.equal((await authorityKeys(idb)).some(key=>key.startsWith('candidate:')),false);assert.equal(f.writes,0);a.close();
});
test('full migration close fences hashing and no abandoned capture can install records',async()=>{
 const idb=new IDBFactory(),f=gameCaptureFixture();let resume,started;const paused=new Promise(r=>started=r),gate=new Promise(r=>resume=r);const crypto={getRandomValues:v=>globalThis.crypto.getRandomValues(v),subtle:{digest:async(...args)=>{started();await gate;return globalThis.crypto.subtle.digest(...args)}}},a=await captureAuthority(idb,{crypto}),pending=a.prepareGameMigration({sourceStorage:f.sourceStorage});await paused;a.close();resume();await assert.rejects(pending,/AUTHORITY_CLOSED/);assert.deepEqual(await authorityKeys(idb),[]);assert.equal(f.writes,0);
});
test('full migration candidate tampering and unsupported interpretation cannot be silently accepted',async()=>{
 const idb=new IDBFactory(),a=await captureAuthority(idb),f=gameCaptureFixture(),c=await a.prepareGameMigration({sourceStorage:f.sourceStorage}),db=await rawDb(idb);for(const edit of [v=>v.sources.find(s=>s.present).raw+=' ',v=>v.owners=[],v=>v.policy='OLD_POLICY',v=>v.hashEncoding='OLD_ENCODING',v=>v.id='e'.repeat(32)]){const bad=structuredClone(c);edit(bad);await rawWrite(db,'candidate:'+c.id,bad);await assert.rejects(a.readGameCandidate(c.id));const preserved=await new Promise(resolve=>{const tx=db.transaction('records','readonly'),r=tx.objectStore('records').get('candidate:'+c.id);r.onsuccess=()=>resolve(r.result)});assert.deepEqual(preserved,bad)}await rawWrite(db,'candidate:'+c.id,c);assert.deepEqual(await a.readGameCandidate(c.id),c);db.close();a.close();
});
test('full migration archive count race admits one final candidate without evicting evidence',async()=>{
 const idb=new IDBFactory(),a=await captureAuthority(idb),b=await captureAuthority(idb),f=gameCaptureFixture(),saved=[];for(let i=0;i<7;i++)saved.push(await a.prepareGameMigration({sourceStorage:f.sourceStorage}));const results=await Promise.allSettled([a.prepareGameMigration({sourceStorage:f.sourceStorage}),b.prepareGameMigration({sourceStorage:f.sourceStorage})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.match(results.find(r=>r.status==='rejected').reason.message,/CAPTURE_ARCHIVE_CAPACITY_HOLD/);assert.equal((await authorityKeys(idb)).length,8);for(const c of saved)assert.deepEqual(await a.readGameCandidate(c.id),c);assert.equal(f.writes,0);a.close();b.close();
});
test('full migration duplicate candidate identity and failed insertion preserve previous/source data',async()=>{
 const idb=new IDBFactory(),crypto={getRandomValues:a=>a.fill(7),subtle:globalThis.crypto.subtle},a=await captureAuthority(idb,{crypto}),f=gameCaptureFixture(),c=await a.prepareGameMigration({sourceStorage:f.sourceStorage});await assert.rejects(a.prepareGameMigration({sourceStorage:f.sourceStorage}));assert.deepEqual(await a.readGameCandidate(c.id),c);assert.equal((await authorityKeys(idb)).length,1);assert.equal(f.writes,0);a.close();
 const other=new IDBFactory(),b=await captureAuthority(other),db=await rawDb(other),prototype=Object.getPrototypeOf(db.transaction('records','readonly').objectStore('records')),original=prototype.add;prototype.add=function(value,key){const request=original.call(this,value,key),tx=this.transaction;if(key.startsWith('candidate:'))request.addEventListener('success',()=>tx.abort());return request};try{await assert.rejects(b.prepareGameMigration({sourceStorage:gameCaptureFixture().sourceStorage}))}finally{prototype.add=original}assert.deepEqual(await authorityKeys(other),[]);db.close();b.close();
});
test('full migration source capacity rejection never truncates or archives a partial source',async()=>{
 const idb=new IDBFactory(),a=await captureAuthority(idb),f=gameCaptureFixture(),large='x'.repeat(4000001);f.data.set(PLAYER_LIFE_STORAGE_KEY,large);await assert.rejects(a.prepareGameMigration({sourceStorage:f.sourceStorage}),/CAPTURE_SOURCE_CAPACITY_HOLD/);assert.equal(f.data.get(PLAYER_LIFE_STORAGE_KEY),large);assert.deepEqual(await authorityKeys(idb),[]);assert.equal(f.writes,0);a.close();
});
test('full migration companion disagreement and legacy premium evidence remain held',async()=>{
 for(const [suffix,raw,code] of [['k11520.player-session.v1',JSON.stringify({version:1,world:'K11520',xyz:{x:999,y:0,z:0},intentXYZ:{x:999,y:0,z:0}}),'SESSION_RECONCILIATION_HOLD'],['k11520.journey.tutorial',JSON.stringify({stage:'DONE'}),'TUTORIAL_RECONCILIATION_HOLD'],['11520.playerCourier.pendingInsurancePayment',JSON.stringify({missionId:'old',paymentEvidence:{amount:10}}),'PENDING_INSURANCE_RECONCILIATION_HOLD']]){const a=await captureAuthority(),f=gameCaptureFixture(),key=suffix.startsWith('11520.playerCourier')?suffix:'k11520.player:'+f.id+':'+suffix;f.data.set(key,raw);const c=await a.prepareGameMigration({sourceStorage:f.sourceStorage});assert.equal(c.status,'HOLD');assert.ok(c.holds.some(h=>h.code===code));assert.equal(c.sources.find(e=>e.key===key).raw,raw);assert.equal(f.writes,0);a.close()}
});
test('full migration accepts strict existing V2 without changing extensions or progress',async()=>{
 const a=await captureAuthority(),f=gameCaptureFixture(),key='k11520.player:'+f.id+':k11520.local-product.v1:guest',p=fullProduct(f.id);p.extension={keep:'exact'};f.data.set(key,JSON.stringify(p));const c=await a.prepareGameMigration({sourceStorage:f.sourceStorage});assert.equal(c.status,'REVIEWABLE_CAPTURE');assert.deepEqual(c.proposal.records.find(e=>e.ref.domain==='PRODUCT').value,p);a.close();
});
test('full migration source hashes preserve lone code units inside archived HOLD records',async()=>{
 const a=await captureAuthority(),f=gameCaptureFixture();f.data.set('11520.backpack.v1','\ud800');const one=await a.prepareGameMigration({sourceStorage:f.sourceStorage});f.data.set('11520.backpack.v1','\ud801');const two=await a.prepareGameMigration({sourceStorage:f.sourceStorage}),source=c=>c.sources.find(e=>e.key==='11520.backpack.v1');assert.notEqual(source(one).sha256,source(two).sha256);assert.equal(source(await a.readGameCandidate(one.id)).raw,'\ud800');assert.equal(source(await a.readGameCandidate(two.id)).raw,'\ud801');a.close();
});
test('full migration aggregate and escaped candidate capacities HOLD without a partial archive',async()=>{
 for(const [raw,reason] of [['x'.repeat(4000000),/CAPTURE_SOURCE_CAPACITY_HOLD/],['\ud800'.repeat(2700000),/CAPTURE_CANDIDATE_CAPACITY_HOLD/]]){const idb=new IDBFactory(),a=await captureAuthority(idb),f=gameCaptureFixture();f.data.set('11520.backpack.v1',raw);await assert.rejects(a.prepareGameMigration({sourceStorage:f.sourceStorage}),reason);assert.equal(f.data.get('11520.backpack.v1'),raw);assert.deepEqual(await authorityKeys(idb),[]);a.close()}
});
test('full migration total archive byte budget preserves every existing candidate',async()=>{
 const idb=new IDBFactory(),a=await captureAuthority(idb),f=gameCaptureFixture(),raw='界'.repeat(1800000);f.data.set('11520.backpack.v1',raw);const saved=[];for(let n=0;n<5;n++)saved.push(await a.prepareGameMigration({sourceStorage:f.sourceStorage}));const keys=await authorityKeys(idb);await assert.rejects(a.prepareGameMigration({sourceStorage:f.sourceStorage}),/CAPTURE_ARCHIVE_CAPACITY_HOLD/);assert.deepEqual(await authorityKeys(idb),keys);assert.equal((await a.readGameCandidate(saved[0].id)).sources.find(e=>e.key==='11520.backpack.v1').raw,raw);assert.equal(f.data.get('11520.backpack.v1'),raw);assert.equal(f.writes,0);a.close();
});
test('full migration malformed structured-clone candidate rejects before JSON result cloning',async()=>{
 const idb=new IDBFactory(),a=await captureAuthority(idb),db=await rawDb(idb),id='c'.repeat(32);await rawWrite(db,'candidate:'+id,{schema:'LOCAL_GAME_MIGRATION_CAPTURE_V1',bad:1n});await assert.rejects(a.readGameCandidate(id),/INVALID_AUTHORITY_JSON/);const cyclic={schema:'LOCAL_GAME_MIGRATION_CAPTURE_V1'};cyclic.self=cyclic;await rawWrite(db,'candidate:'+id,cyclic);await assert.rejects(a.readGameCandidate(id),/INVALID_AUTHORITY_JSON/);assert.deepEqual(await authorityKeys(idb),['candidate:'+id]);db.close();a.close();
});
test('full migration present expected source missing from the census cannot be reviewable',async()=>{
 const a=await captureAuthority(),f=gameCaptureFixture(),hidden=PLAYER_LIFE_STORAGE_KEY,keys=[...f.data.keys()].filter(k=>k!==hidden),source={length:keys.length,key:n=>keys[n]??null,getItem:f.sourceStorage.getItem},c=await a.prepareGameMigration({sourceStorage:source});assert.equal(c.status,'HOLD');assert.ok(c.holds.some(h=>h.code==='SOURCE_DIVERGED_HOLD'&&h.sourceKey===hidden));assert.equal(c.sources.find(e=>e.key===hidden).present,true);assert.equal(c.censuses.before.includes(hidden),false);assert.deepEqual(await a.readGameCandidate(c.id),c);a.close();
});
test('full migration generic item identity stays Life-scoped while shared living custody holds',async()=>{
 for(const living of [false,true]){const a=await captureAuthority(),f=gameCaptureFixture(),legacy=make({storage:{getItem:key=>f.data.get(key)??null,setItem:(key,value)=>f.data.set(key,value)}}),second=legacy.createPlayer().playerId;for(const id of [f.id,second]){const bag=createBackpack({ownerId:id}),item=living?{itemId:'COW-ITEM-'+id,name:'Cow',kind:'LIVING_CARGO',species:'COW',lifeId:'GLOBAL-COW',qty:1,weightEach:1}:{itemId:'DAILY_JOURNEY:2026-10-05',name:'Daily treasure',kind:'TREASURE',rewardId:'DAILY_JOURNEY:2026-10-05',qty:1,weightEach:1};assert.equal(storeItem(bag,item).ok,true);f.data.set('k11520.player:'+id+':11520.backpack.v1',JSON.stringify(bag));f.data.set('k11520.player:'+id+':k11520.local-product.v1:guest',JSON.stringify(fullProduct(id)))}const c=await a.prepareGameMigration({sourceStorage:f.sourceStorage});assert.equal(c.status,living?'HOLD':'REVIEWABLE_CAPTURE');assert.equal(c.holds.some(h=>h.code==='CUSTODY_IDENTITY_CONFLICT'),living);a.close()}
});
test('full migration candidate format requires every expected absent scoped source even with a recomputed digest',async()=>{
 const idb=new IDBFactory(),a=await captureAuthority(idb),f=gameCaptureFixture(),c=await a.prepareGameMigration({sourceStorage:f.sourceStorage}),db=await rawDb(idb),key='k11520.player:'+f.id+':k11520.journey.tutorial',bad=structuredClone(c);bad.sources=bad.sources.filter(e=>e.key!==key);bad.observed=bad.observed.filter(e=>e.key!==key);const {manifestSha256,...body}=bad;bad.manifestSha256=[...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(body))))].map(v=>v.toString(16).padStart(2,'0')).join('');await rawWrite(db,'candidate:'+c.id,bad);await assert.rejects(a.readGameCandidate(c.id),/INVALID_GAME_CANDIDATE/);db.close();a.close();
});
test('full migration lastMission cannot resolve inherited object properties',async()=>{
 for(const hint of ['toString','__proto__']){const a=await captureAuthority(),f=gameCaptureFixture();f.data.set('11520.playerCourier.lastMission',hint);const c=await a.prepareGameMigration({sourceStorage:f.sourceStorage});assert.equal(c.status,'HOLD');assert.ok(c.holds.some(h=>h.code==='UNRESOLVED_MISSION_HINT'));a.close()}
});
test('full migration session companions preserve the existing coordinate bounds',async()=>{
 const a=await captureAuthority(),f=gameCaptureFixture(),xyz=f.envelope.players[f.id].lastXYZ,key='k11520.player:'+f.id+':k11520.player-session.v1';f.data.set(key,JSON.stringify({version:1,world:'K11520',xyz,intentXYZ:{...xyz,x:1e100}}));const c=await a.prepareGameMigration({sourceStorage:f.sourceStorage});assert.equal(c.status,'HOLD');assert.ok(c.holds.some(h=>h.code==='SESSION_RECONCILIATION_HOLD'));a.close();
});
