/**
 * KAIOS Player Life — provider-neutral local domain, revision 2026-10-01.
 * Author: codex-gm-01 / Human V2.8 work order. First-party implementation.
 * LOCAL CANDIDATE ONLY: validation is not authentication or economic authority.
 * Same-origin scripts/device owners can edit storage; cloud identity needs a server.
 * DNA: KGENVERSE / CivilizationLifeform / RuntimeOrganism / PlayerLife /
 *       Journey / KAIOS / PlayerLifeStore. No chain or provider dependency.
 */
export const PLAYER_LIFE_STORAGE_KEY='KAIOS_PLAYER_LIFE_V1';
export const PLAYER_LIFE_SCHEMA='KAIOS_PLAYER_LIFE_V1';
export const PLAYER_LIFE_SCOPE='LOCAL_CANDIDATE_NOT_ECONOMIC_AUTHORITY';
export const HOME_STAGES=Object.freeze([
  {id:'EMPTY',label:'空地',level:0,minPlayerLevel:1},
  {id:'HUT',label:'草屋',level:1,minPlayerLevel:1},
  {id:'HOUSE',label:'房屋',level:2,minPlayerLevel:2},
  {id:'CAVE',label:'洞府',level:3,minPlayerLevel:3},
  {id:'WAREHOUSE',label:'倉庫',level:4,minPlayerLevel:4},
  {id:'SHOP',label:'商店',level:5,minPlayerLevel:5},
  {id:'ATM',label:'KAIOS ATM 外觀',level:6,minPlayerLevel:7},
  {id:'PORTAL',label:'Portal 外觀',level:7,minPlayerLevel:10}
].map(Object.freeze));
const ID=/^KAIOS-P-[0-9a-f]{32}$/;
const ADDRESS=/^0x[0-9a-fA-F]{40}$/;
const WORLDS=['11520','12345','16888'];
// V2.8 event weights are immutable save-history meaning. Gameplay engine XP uses
// new event names, never retroactively changes an existing player's projection.
export const PLAYER_EVENT_REWARDS=Object.freeze(Object.fromEntries(Object.entries({
  MONSTER_KILL:[10,0],LOOT_DROP:[5,0],TRADE_FILL:[4,6],TRADE_CLOSE:[12,18],LIQUIDATION:[2,4],
  JOURNEY_MONSTER_KILL:[10,4],BOSS_DEFEAT:[50,30],SIX_PHASE_PRACTICE:[5,8],
  QUEST_COMPLETE:[15,12],EXPLORATION_STEP:[0,0],DAILY_JOURNEY:[25,20]
}).map(([k,v])=>[k,Object.freeze(v)])));
const EVENT_XP=PLAYER_EVENT_REWARDS;
export const GAMEPLAY_UNLOCKS=Object.freeze([
  {id:'SLASH',label:'悟空斬',playerLevel:1,engineLevel:1},
  {id:'GOLDEN_RAIN',label:'天罡金陣',playerLevel:2,engineLevel:1},
  {id:'PHANTOM_AXE',label:'盤古幻斧',playerLevel:3,engineLevel:1},
  {id:'STRONG_MONSTERS',label:'強化六相怪',playerLevel:3,engineLevel:1},
  {id:'BOSS',label:'市場守關 Boss',playerLevel:5,engineLevel:1},
  {id:'HISTORICAL_TRAINING',label:'歷史市場訓練',playerLevel:5,engineLevel:2},
  {id:'RARE_ENCOUNTERS',label:'稀有怪與進階掉寶',playerLevel:6,engineLevel:2},
  {id:'ENGINE_MASTERY',label:'GA600 核心成就',playerLevel:6,engineLevel:4}
].map(Object.freeze));
export const DAILY_JOURNEY_RULES=Object.freeze({kills:3,sixPhase:1,distanceMeters:50,stepMeters:5,playerXp:25,engineXp:20,clock:'UTC_LOCAL_CANDIDATE'});
const QUEST_IDS=Object.freeze(['FIRST_JOURNEY','SIX_PHASE_INTRO','HISTORICAL_TRAINING']);
const clone=value=>JSON.parse(JSON.stringify(value));
const fail=code=>{throw Object.assign(new Error(code),{code})};
const integer=(v,max=1000000)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const keys=(v,allowed)=>object(v)&&Object.keys(v).every(k=>allowed.includes(k));
const text=(v,max=48)=>typeof v==='string'&&v.length<=max&&!/[<>\x00-\x1f]/.test(v);
const xyz=v=>keys(v,['x','y','z'])&&['x','y','z'].every(k=>Number.isFinite(v[k])&&Math.abs(v[k])<=1e7);
const level=xp=>1+Math.min(9,Math.floor(Math.sqrt(xp/25)));
const engineLevel=xp=>1+Math.min(9,Math.floor(Math.sqrt(xp/20)));
const settings=v=>keys(v,['music','voice','reducedMotion'])&&Object.values(v).every(x=>typeof x==='boolean');
const consent=v=>keys(v,['location','motion','analytics'])&&['location','motion','analytics'].every(k=>typeof v[k]==='boolean');
const journey=v=>keys(v,['tutorialStage','storyComplete','homeVisited','journeyDistance','dailyStepsUsedForGame','journeyEnergy'])&&Object.entries(v).every(([k,x])=>k==='tutorialStage'?['MOVE','HIT','LOOT','PHASE','PREVIEW','DONE'].includes(x):['storyComplete','homeVisited'].includes(k)?typeof x==='boolean':Number.isFinite(x)&&x>=0&&x<=1e9);
const dayAt=at=>{if(!integer(at,8640000000000000))fail('INVALID_CLOCK');return new Date(at).toISOString().slice(0,10)};
const isKill=e=>['MONSTER_KILL','JOURNEY_MONSTER_KILL','BOSS_DEFEAT'].includes(e.type);
function dailyFor(events,at){
  const day=dayAt(at),today=events.filter(e=>dayAt(e.at)===day),rules=DAILY_JOURNEY_RULES;
  const kills=today.filter(isKill).length,sixPhase=today.filter(e=>e.type==='SIX_PHASE_PRACTICE').length;
  const distanceMeters=today.filter(e=>e.type==='EXPLORATION_STEP').length*rules.stepMeters;
  const claimed=today.some(e=>e.type==='DAILY_JOURNEY');
  return {day,kills,sixPhase,distanceMeters,claimed,ready:kills>=rules.kills&&sixPhase>=rules.sixPhase&&distanceMeters>=rules.distanceMeters,requirements:rules,rewardId:'DAILY_JOURNEY:'+day};
}
function validateGameplayEvent(e,previous){
  if(e.type==='DAILY_JOURNEY'){
    const d=dailyFor(previous,e.at);
    if(e.id!==d.rewardId||!d.ready||d.claimed)fail('INVALID_DAILY_CLAIM');
  }
  if(e.type==='QUEST_COMPLETE'&&(!e.id.startsWith('quest:')||!QUEST_IDS.includes(e.id.slice(6))))fail('INVALID_QUEST');
  // Exploration is capped at today's goal: no unbounded per-frame event log.
  if(e.type==='EXPLORATION_STEP'){
    const d=dailyFor(previous,e.at),index=d.distanceMeters/DAILY_JOURNEY_RULES.stepMeters+1;
    if(e.id!==`explore:${d.day}:${index}`||index>DAILY_JOURNEY_RULES.distanceMeters/DAILY_JOURNEY_RULES.stepMeters)fail('INVALID_EXPLORATION_STEP');
  }
}
function projectEvents(events,baseline={xp:0,engineXp:0}){
  let xp=baseline.xp,engineXp=baseline.engineXp;const seen=new Set(),previous=[];
  if(!Array.isArray(events)||events.length>10000)fail('INVALID_EVENTS');
  for(const e of events){
    if(!keys(e,['id','type','at'])||!text(e.id,128)||!e.id||!EVENT_XP[e.type]||!integer(e.at,Number.MAX_SAFE_INTEGER)||seen.has(e.id))fail('INVALID_EVENT');
    validateGameplayEvent(e,previous);previous.push(e);
    seen.add(e.id);xp+=EVENT_XP[e.type][0];engineXp+=EVENT_XP[e.type][1];
  }
  return {xp,engineXp,level:level(xp),engineLevel:engineLevel(engineXp)};
}
/** Read-only gameplay projection. No finance cap, position or payout authority. */
export function gameplayProfile(player,{now=Date.now()}={}){
  validatePlayerLifePlayer(player);
  const unlocks=Object.fromEntries(GAMEPLAY_UNLOCKS.map(u=>[u.id,player.level>=u.playerLevel&&player.engineLevel>=u.engineLevel]));
  const nextUnlock=GAMEPLAY_UNLOCKS.find(u=>!unlocks[u.id]);
  return {scope:PLAYER_LIFE_SCOPE,playerId:player.playerId,level:player.level,xp:player.xp,engineLevel:player.engineLevel,engineXp:player.engineXp,
    engineMode:'GAME_TRAINING_ONLY',fullEngine:'NOT_INTEGRATED',unlocks,
    unlockTable:GAMEPLAY_UNLOCKS.map(u=>({...u,unlocked:unlocks[u.id]})),
    nextUnlock:nextUnlock?{...nextUnlock}:null,
    nextPlayerLevel:player.level<10?{level:player.level+1,xp:25*player.level**2,remaining:25*player.level**2-player.xp}:null,
    nextEngineLevel:player.engineLevel<10?{level:player.engineLevel+1,xp:20*player.engineLevel**2,remaining:20*player.engineLevel**2-player.engineXp}:null,
    daily:dailyFor(player.events,now)};
}
export function validatePlayerLifePlayer(p){
  if(!keys(p,['playerId','displayName','createdAt','lastSeenAt','characterAppearance','pronoun','ageRange','homeWorld','homePlotId','level','xp','engineLevel','engineXp','inventory','achievements','journeyProgress','lastWorld','lastXYZ','walletLinks','settings','privacyConsent','events','homePlot','migration','legacyProgress']))fail('INVALID_PLAYER_FIELDS');
  if(!ID.test(p.playerId)||!text(p.displayName,32)||!p.displayName||!integer(p.createdAt,Number.MAX_SAFE_INTEGER)||!integer(p.lastSeenAt,Number.MAX_SAFE_INTEGER)||p.lastSeenAt<p.createdAt)fail('INVALID_PLAYER');
  if(!['WUKONG','EXPLORER','STARGAZER'].includes(p.characterAppearance)||!text(p.pronoun,24)||![null,'UNDER_18','18_24','25_44','45_PLUS','PREFER_NOT_TO_SAY'].includes(p.ageRange))fail('INVALID_PROFILE');
  if(!WORLDS.includes(p.homeWorld)||!WORLDS.includes(p.lastWorld)||!xyz(p.lastXYZ)||!settings(p.settings)||!consent(p.privacyConsent)||!journey(p.journeyProgress))fail('INVALID_PROGRESS');
  const baseline=p.legacyProgress;
  if(!keys(baseline,['xp','engineXp','source'])||!integer(baseline.xp)||!integer(baseline.engineXp)||!['NONE','LOCAL_UNVERIFIED_GUEST'].includes(baseline.source)||(baseline.source==='NONE'&&(baseline.xp!==0||baseline.engineXp!==0))||(baseline.source==='LOCAL_UNVERIFIED_GUEST'&&p.migration==='NONE'))fail('INVALID_LEGACY_PROGRESS');
  const derived=projectEvents(p.events,baseline);
  for(const k of ['xp','engineXp','level','engineLevel'])if(p[k]!==derived[k])fail('INVALID_DERIVED_PROGRESSION');
  // Existing backpack remains the only captured-item authority, player-scoped by
  // its adapter. This reference must never become a second inventory ledger.
  if(!keys(p.inventory,['source','ownerPlayerId'])||p.inventory.source!=='SCOPED_BACKPACK'||p.inventory.ownerPlayerId!==p.playerId)fail('INVALID_INVENTORY');
  const achievements=p.events.some(isKill)?['FIRST_MONSTER']:[];
  if(JSON.stringify(p.achievements)!==JSON.stringify(achievements))fail('INVALID_ACHIEVEMENTS');
  const h=p.homePlot;
  if(!keys(h,['homePlotId','worldId','ownerPlayerId','xyz','plotLevel','houseLevel','stage'])||h.homePlotId!=='KAIOS-H-'+p.playerId.slice(8)||h.homePlotId!==p.homePlotId||h.ownerPlayerId!==p.playerId||h.worldId!==p.homeWorld||!xyz(h.xyz)||h.plotLevel!==1||!integer(h.houseLevel,7)||h.stage!==HOME_STAGES[h.houseLevel].id||p.level<HOME_STAGES[h.houseLevel].minPlayerLevel)fail('INVALID_HOME_OWNERSHIP');
  if(!Array.isArray(p.walletLinks)||p.walletLinks.length>16)fail('INVALID_WALLETS');
  const addresses=new Set();
  for(const w of p.walletLinks){
    if(!keys(w,['address','chainId','boundAt','proofStatus'])||!ADDRESS.test(w.address)||w.address!==w.address.toLowerCase()||!integer(w.chainId,1e9)||!w.chainId||!integer(w.boundAt,Number.MAX_SAFE_INTEGER)||w.proofStatus!=='LOCAL_SIGNATURE_VERIFIED_NOT_SERVER_AUTH'||addresses.has(w.address))fail('INVALID_WALLET_LINK');
    addresses.add(w.address);
  }
  if(!['NONE','LEGACY_LOCAL_CANDIDATE','BACKUP_LOCAL_CANDIDATE'].includes(p.migration))fail('INVALID_MIGRATION');
  return true;
}
function validateEnvelope(e){
  if(!keys(e,['schema','scope','revision','activePlayerId','players','legacyMigrated','usedNonces'])||e.schema!==PLAYER_LIFE_SCHEMA||e.scope!==PLAYER_LIFE_SCOPE||!integer(e.revision,Number.MAX_SAFE_INTEGER)||!object(e.players)||Object.keys(e.players).length>20||typeof e.legacyMigrated!=='boolean'||!Array.isArray(e.usedNonces)||e.usedNonces.length>10000||e.usedNonces.some(n=>!/^[0-9a-f]{32}$/.test(n))||new Set(e.usedNonces).size!==e.usedNonces.length)fail('CORRUPT_SAVE');
  const wallets=new Set();
  for(const [id,p] of Object.entries(e.players)){if(id!==p.playerId)fail('CORRUPT_SAVE');validatePlayerLifePlayer(p);for(const w of p.walletLinks){if(wallets.has(w.address))fail('DUPLICATE_WALLET_BINDING');wallets.add(w.address)}}
  if(e.activePlayerId!==null&&!Object.hasOwn(e.players,e.activePlayerId))fail('CORRUPT_SAVE');
  return e;
}
export function getActivePlayerId(storage){
  try{if(storage===undefined)storage=globalThis.localStorage;const e=validateEnvelope(JSON.parse(storage?.getItem(PLAYER_LIFE_STORAGE_KEY)||'null'));return e.activePlayerId}catch{return null}
}
export function createLocalPlayerStore({storage,now=Date.now,crypto=globalThis.crypto,verifyWalletSignature,domain=globalThis.location?.origin||'https://klineodyssey.github.io'}={}){
  let status='READY',raw=null;
  if(storage===undefined){try{storage=globalThis.localStorage}catch{status='STORAGE_UNAVAILABLE';storage=null}}
  let state={schema:PLAYER_LIFE_SCHEMA,scope:PLAYER_LIFE_SCOPE,revision:0,activePlayerId:null,players:{},legacyMigrated:false,usedNonces:[]};
  const challenges=new Map();
  let storageRead=false;
  try{raw=storage?.getItem(PLAYER_LIFE_STORAGE_KEY)??null;storageRead=true;if(raw!==null){if(raw.length>4000000)fail('CORRUPT_SAVE');state=validateEnvelope(JSON.parse(raw))}}catch{status=storageRead?'CORRUPT_SAVE':'STORAGE_UNAVAILABLE'}
  if(!storage&&status==='READY')status='SESSION_ONLY';
  function token(){if(typeof crypto?.getRandomValues!=='function')fail('SECURE_RANDOM_UNAVAILABLE');const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);return [...bytes].map(v=>v.toString(16).padStart(2,'0')).join('')}
  const stamp=()=>{const t=now();if(!integer(t,Number.MAX_SAFE_INTEGER))fail('INVALID_CLOCK');return t};
  function readActive(e=state){const p=e.players[e.activePlayerId];if(!p)fail('NO_ACTIVE_PLAYER');return p}
  function mutate(fn){
    if(!['READY','SESSION_ONLY'].includes(status))fail(status);
    if(storage){let current;try{current=storage.getItem(PLAYER_LIFE_STORAGE_KEY)}catch{status='STORAGE_UNAVAILABLE';fail(status)}if(current!==raw)fail('REVISION_CONFLICT_RELOAD_REQUIRED')}
    const next=clone(state);const result=fn(next);next.revision++;
    if(next.activePlayerId)next.players[next.activePlayerId].lastSeenAt=Math.max(stamp(),next.players[next.activePlayerId].lastSeenAt);
    validateEnvelope(next);const encoded=JSON.stringify(next);if(encoded.length>4000000)fail('STORE_CAPACITY');
    if(storage){try{storage.setItem(PLAYER_LIFE_STORAGE_KEY,encoded)}catch{status='STORAGE_WRITE_FAILED';fail(status)}}
    state=next;raw=encoded;return clone(result??readActive());
  }
  function createPlayer({lastXYZ={x:0,y:0,z:0}}={}){
    if(!xyz(lastXYZ))fail('INVALID_XYZ');
    return mutate(e=>{if(Object.keys(e.players).length>=20)fail('PLAYER_LIMIT');let id='KAIOS-P-'+token();if(e.players[id])fail('ID_COLLISION');const t=stamp(),homePlotId='KAIOS-H-'+id.slice(8);
      const p={playerId:id,displayName:'取經旅人',createdAt:t,lastSeenAt:t,characterAppearance:'WUKONG',pronoun:'',ageRange:null,homeWorld:'11520',homePlotId,level:1,xp:0,engineLevel:1,engineXp:0,inventory:{source:'SCOPED_BACKPACK',ownerPlayerId:id},achievements:[],journeyProgress:{},lastWorld:'11520',lastXYZ:clone(lastXYZ),walletLinks:[],settings:{},privacyConsent:{location:false,motion:false,analytics:false},events:[],homePlot:{homePlotId,worldId:'11520',ownerPlayerId:id,xyz:{x:lastXYZ.x+5,y:lastXYZ.y,z:lastXYZ.z},plotLevel:1,houseLevel:0,stage:'EMPTY'},migration:'NONE',legacyProgress:{xp:0,engineXp:0,source:'NONE'}};
      e.players[id]=p;e.activePlayerId=id;return p});
  }
  function updateProfile(patch){
    if(!keys(patch,['displayName','characterAppearance','pronoun','ageRange','homeWorld','settings','privacyConsent']))fail('PROFILE_FIELD_NOT_ALLOWED');
    return mutate(e=>{const p=readActive(e);if(patch.homeWorld&&patch.homeWorld!==p.homeWorld&&p.homePlot.houseLevel>0)fail('HOME_WORLD_ALREADY_SETTLED');Object.assign(p,clone(patch));p.homePlot.worldId=p.homeWorld;if(patch.privacyConsent&&(!patch.privacyConsent.location||!patch.privacyConsent.motion)){p.journeyProgress.dailyStepsUsedForGame=0;p.journeyProgress.journeyDistance=0;p.journeyProgress.journeyEnergy=0}return p});
  }
  function saveProgress(patch){
    if(!keys(patch,['lastXYZ','lastWorld','journeyProgress']))fail('PROGRESS_FIELD_NOT_ALLOWED');
    return mutate(e=>{const p=readActive(e);Object.assign(p,clone(patch));return p});
  }
  function recordEvents(events){
    if(!Array.isArray(events)||events.length<1||events.length>8)fail('INVALID_EVENT_BATCH');
    for(const event of events)if(!keys(event,['id','type'])||!event.id||!text(event.id,128)||!EVENT_XP[event.type])fail('INVALID_EVENT');
    // One envelope revision and one storage write: a kill/loot/practice bundle
    // either persists together or leaves both memory and storage unchanged.
    return mutate(e=>{const p=readActive(e),seen=new Set(p.events.map(x=>x.id)),at=stamp();for(const event of events){if(seen.has(event.id))fail('EVENT_REPLAY');seen.add(event.id);p.events.push({...event,at})}Object.assign(p,projectEvents(p.events,p.legacyProgress));p.achievements=p.events.some(isKill)?['FIRST_MONSTER']:[];return p});
  }
  function recordEvent(event){return recordEvents([event])}
  function claimDailyJourney(){const d=dailyFor(readActive().events,stamp());if(d.claimed)fail('DAILY_ALREADY_CLAIMED');if(!d.ready)fail('DAILY_NOT_COMPLETE');return recordEvent({id:d.rewardId,type:'DAILY_JOURNEY'})}
  function recordExplorationStep(){const d=dailyFor(readActive().events,stamp());if(d.distanceMeters>=DAILY_JOURNEY_RULES.distanceMeters)return clone(readActive());return recordEvent({id:`explore:${d.day}:${d.distanceMeters/DAILY_JOURNEY_RULES.stepMeters+1}`,type:'EXPLORATION_STEP'})}
  function advanceHouse(starter=false){return mutate(e=>{const p=readActive(e),next=p.homePlot.houseLevel+1;if(starter&&next!==1)fail('HOUSE_ALREADY_BUILT');if(!HOME_STAGES[next]||p.level<HOME_STAGES[next].minPlayerLevel)fail('HOUSE_LEVEL_REQUIREMENT');p.homePlot.houseLevel=next;p.homePlot.stage=HOME_STAGES[next].id;return p.homePlot})}
  function beginWalletBinding({address,chainId}){
    if(!ADDRESS.test(address)||!integer(chainId,1e9)||!chainId)fail('INVALID_WALLET');
    const p=readActive(),nonce=token(),issuedAt=stamp(),expiresAt=issuedAt+300000;
    const challenge={playerId:p.playerId,address:address.toLowerCase(),chainId,nonce,domain,issuedAt,expiresAt};
    challenge.message=`KAIOS Player Life local wallet link\nDomain: ${domain}\nPlayer: ${p.playerId}\nAddress: ${challenge.address}\nChain: ${chainId}\nNonce: ${nonce}\nIssued: ${issuedAt}\nExpires: ${expiresAt}\nNo transaction, token approval or payout. Local proof only.`;
    challenges.set(nonce,clone(challenge));return clone(challenge);
  }
  async function bindWallet({challenge,signature,address,chainId}={}){
    const issued=challenges.get(challenge?.nonce);
    if(!issued||JSON.stringify(issued)!==JSON.stringify(challenge)||issued.playerId!==state.activePlayerId||issued.domain!==domain||stamp()>issued.expiresAt||stamp()<issued.issuedAt||address?.toLowerCase()!==issued.address||chainId!==issued.chainId||state.usedNonces.includes(issued.nonce))fail('INVALID_OR_REPLAYED_WALLET_PROOF');
    if(typeof verifyWalletSignature!=='function')fail('SIGNATURE_VERIFIER_NOT_CONFIGURED');
    if(typeof signature!=='string'||!/^0x[0-9a-fA-F]{130}$/.test(signature))fail('INVALID_SIGNATURE');
    const recovered=await verifyWalletSignature(issued.message,signature);
    if(typeof recovered!=='string'||recovered.toLowerCase()!==issued.address)fail('WALLET_SIGNATURE_MISMATCH');
    // Recheck after async wallet/provider interaction; no account-switch race.
    if(state.activePlayerId!==issued.playerId||stamp()>issued.expiresAt||state.usedNonces.includes(issued.nonce)||!challenges.has(issued.nonce))fail('WALLET_CONTEXT_CHANGED');
    const result=mutate(e=>{for(const p of Object.values(e.players))if(p.walletLinks.some(w=>w.address===issued.address))fail('DUPLICATE_WALLET_BINDING');const p=readActive(e);p.walletLinks.push({address:issued.address,chainId, boundAt:stamp(),proofStatus:'LOCAL_SIGNATURE_VERIFIED_NOT_SERVER_AUTH'});e.usedNonces.push(issued.nonce);return p});
    challenges.delete(issued.nonce);return result;
  }
  function unlinkWallet(address,{confirmLocalOnly=false}={}){
    if(!confirmLocalOnly)fail('EXPLICIT_LOCAL_UNLINK_REQUIRED');
    if(!ADDRESS.test(address||''))fail('INVALID_WALLET');
    const normalized=address.toLowerCase(),playerId=state.activePlayerId;
    const result=mutate(e=>{const p=readActive(e),index=p.walletLinks.findIndex(w=>w.address===normalized);if(index<0)fail('WALLET_NOT_LINKED_TO_ACTIVE_PLAYER');p.walletLinks.splice(index,1);return p});
    for(const [nonce,issued] of challenges)if(issued.playerId===playerId&&issued.address===normalized)challenges.delete(nonce);
    // Consumed nonces remain consumed: unlink never revives a prior signature.
    // This removes only local association, not allowances, assets or chain roles.
    return result;
  }
  function exportPlayer(){const p=clone(readActive());p.walletLinks=[];p.migration='BACKUP_LOCAL_CANDIDATE';return JSON.stringify({schema:PLAYER_LIFE_SCHEMA,scope:PLAYER_LIFE_SCOPE,player:p})}
  function importPlayer(value,{confirmLocalCandidate=false}={}){
    if(!confirmLocalCandidate)fail('EXPLICIT_LOCAL_IMPORT_REQUIRED');if(typeof value!=='string'||value.length>2000000)fail('INVALID_BACKUP');let b;try{b=JSON.parse(value)}catch{fail('INVALID_BACKUP')}
    if(!keys(b,['schema','scope','player'])||b.schema!==PLAYER_LIFE_SCHEMA||b.scope!==PLAYER_LIFE_SCOPE)fail('INVALID_BACKUP');validatePlayerLifePlayer(b.player);
    return mutate(e=>{if(e.players[b.player.playerId])fail('PLAYER_ALREADY_EXISTS_NO_OVERWRITE');if(b.player.walletLinks.length)fail('BACKUP_WALLET_PROOF_NOT_TRUSTED');const p=clone(b.player);p.migration='BACKUP_LOCAL_CANDIDATE';e.players[p.playerId]=p;e.activePlayerId=p.playerId;return p});
  }
  /** Explicit game-only cloud recovery, through the existing local owner. */
  function restoreGameBackup(candidate,{expectedRevision,confirmGameRestore=false}={}){
    if(!confirmGameRestore)fail('EXPLICIT_GAME_RESTORE_REQUIRED');
    if(expectedRevision!==state.revision)fail('REVISION_CONFLICT_RELOAD_REQUIRED');
    validatePlayerLifePlayer(candidate);const current=readActive();
    if(candidate.playerId!==current.playerId)fail('WRONG_PLAYER');
    if(candidate.walletLinks.length)fail('BACKUP_WALLET_PROOF_NOT_TRUSTED');
    const next=clone(candidate);
    for(const field of ['displayName','pronoun','ageRange','privacyConsent','walletLinks'])next[field]=clone(current[field]);
    next.migration='BACKUP_LOCAL_CANDIDATE';validatePlayerLifePlayer(next);
    // Separate immutable local protection copy; a failure stops the restore.
    if(storage){if(storage.getItem(PLAYER_LIFE_STORAGE_KEY)!==raw)fail('REVISION_CONFLICT_RELOAD_REQUIRED');storage.setItem('KAIOS_PLAYER_PRE_RESTORE_V1:'+current.playerId+':'+state.revision,exportPlayer());}
    return mutate(e=>{e.players[current.playerId]=next;return next});
  }
  function migrateLegacy({lastXYZ,journeyProgress,legacyProgress={xp:0,engineXp:0}}={}){
    if(!keys(legacyProgress,['xp','engineXp'])||!integer(legacyProgress.xp)||!integer(legacyProgress.engineXp))fail('INVALID_LEGACY_PROGRESS');
    return mutate(e=>{if(e.legacyMigrated||Object.keys(e.players).length!==1)fail('LEGACY_MIGRATION_ALREADY_USED');const p=readActive(e);if(p.events.length||p.migration!=='NONE')fail('LEGACY_MIGRATION_NOT_FRESH');if(lastXYZ){if(!xyz(lastXYZ))fail('INVALID_XYZ');p.lastXYZ=clone(lastXYZ);p.homePlot.xyz={x:lastXYZ.x+5,y:lastXYZ.y,z:lastXYZ.z}}if(journeyProgress)p.journeyProgress=clone(journeyProgress);p.migration='LEGACY_LOCAL_CANDIDATE';p.legacyProgress={...clone(legacyProgress),source:'LOCAL_UNVERIFIED_GUEST'};Object.assign(p,projectEvents(p.events,p.legacyProgress));e.legacyMigrated=true;return p});
  }
  return Object.freeze({
    createPlayer,ensurePlayer(options){return state.activePlayerId?clone(readActive()):createPlayer(options)},
    activePlayer(){return state.activePlayerId?clone(readActive()):null},
    loadPlayer(id=state.activePlayerId){if(id!==state.activePlayerId)fail('PLAYER_NOT_ACTIVE');return state.players[id]?clone(state.players[id]):null},
    activatePlayer(id){if(!ID.test(id)||!Object.hasOwn(state.players,id))fail('PLAYER_NOT_FOUND');challenges.clear();return mutate(e=>{e.activePlayerId=id;return e.players[id]})},
    listPlayers(){return Object.values(state.players).map(p=>({playerId:p.playerId,displayName:p.displayName}))},
    updateProfile,savePlayer(patch){return updateProfile(patch)},saveProgress,loadProgress(){const p=readActive();return clone({lastXYZ:p.lastXYZ,lastWorld:p.lastWorld,journeyProgress:p.journeyProgress,xp:p.xp,level:p.level,engineXp:p.engineXp,engineLevel:p.engineLevel})},
    recordEvent,recordEvents,claimDailyJourney,recordExplorationStep,gameplayProfile(){return gameplayProfile(readActive(),{now:stamp()})},loadHomePlot(){return clone(readActive().homePlot)},
    saveHomePlot(plot){if(JSON.stringify(plot)!==JSON.stringify(readActive().homePlot))fail('HOME_MUTATION_REQUIRES_PROGRESSION');return clone(plot)},
    buildStarterHouse(){return advanceHouse(true)},upgradeHouse(){return advanceHouse(false)},
    beginWalletBinding,bindWallet,unlinkWallet,exportPlayer,importPlayer,restoreGameBackup,migrateLegacy,
    snapshot(){return {player:state.activePlayerId?clone(readActive()):null,home:state.activePlayerId?clone(readActive().homePlot):null,revision:state.revision,status,scope:PLAYER_LIFE_SCOPE,persistent:!!storage&&status==='READY'}}
  });
}
/** Cloud ports deliberately fail closed: no vendor SDK, account, billing or fake sync. */
export function createCloudPlayerStore(){
  const unavailable=()=>fail('CLOUD_NOT_CONFIGURED');
  return Object.freeze({status:'NOT_CONFIGURED',scope:'SERVER_AUTH_REQUIRED',createPlayer:unavailable,loadPlayer:unavailable,savePlayer:unavailable,updateProfile:unavailable,saveProgress:unavailable,loadProgress:unavailable,bindWallet:unavailable,loadHomePlot:unavailable,saveHomePlot:unavailable});
}
