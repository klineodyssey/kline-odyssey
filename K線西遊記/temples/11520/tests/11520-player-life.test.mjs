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
