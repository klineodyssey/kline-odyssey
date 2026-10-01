import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createLocalPlayerStore,createCloudPlayerStore,getActivePlayerId,PLAYER_LIFE_STORAGE_KEY,HOME_STAGES} from '../runtime/player-life-runtime.mjs';
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
