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
// Fixed existing daily item recipe. Additive/inert until a reviewed caller uses it.
export function dailyJourneyRewardItem(playerId,rewardId){
  if(typeof playerId!=='string'||!ID.test(playerId)||typeof rewardId!=='string'||!rewardId.startsWith('DAILY_JOURNEY:')||!text(rewardId,128))fail('INVALID_DAILY_REWARD_ID');
  return {itemId:rewardId,rewardId,kind:'MATERIAL',name:'每日星塵',qty:1,weightEach:.02,meta:{scope:'LOCAL_GAME_ONLY',playerId,rarity:'UNCOMMON'}};
}
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

/**
 * Inert Stage1 storage primitive. NO production caller or automatic cutover.
 * Coverage is deliberately PLAYER_LIFE only; partial markers are not a complete
 * local-game migration. Other domains and restore fail closed until reviewed.
 * IndexedDB replaces authority only after explicit future integration. Existing
 * localStorage functions above are unchanged by import/construction/open.
 */
export const LOCAL_GAME_AUTHORITY_DATABASE='KAIOS_LOCAL_GAME';
const AUTHORITY_SCHEMA='KAIOS_LOCAL_GAME_AUTHORITY_STAGE1';
const AUTHORITY_INTEGRATION='UNINTEGRATED_DRAFT';
const AUTHORITY_DOMAIN='PLAYER_LIFE';
const AUTHORITY_STORE='records';
const AUTHORITY_READ_KEYS=['$authority',AUTHORITY_DOMAIN,'$initialized','$keys'];
const SOURCE_HASH_ENCODING='JSON_SOURCE_STRING_V1';
const FULL_AUTHORITY_SCHEMA='KAIOS_LOCAL_GAME_FULL_DRAFT_V1';
const DAILY_AUTHORITY_SCHEMA='KAIOS_LOCAL_GAME_DAILY_DRAFT_V1';
const DAILY_PROTOCOL_LIMITS=Object.freeze({operationSlots:256,entryBytes:32768,totalBytes:1048576,protocolBytes:65536,legacyEntries:256});
const DAILY_OP=/^[a-f0-9]{32}$/;
const FULL_AUTHORITY_DOMAINS=['PLAYER_LIFE','BACKPACK','PRODUCT','COURIER'];
const GAME_CAPTURE_SCHEMA='LOCAL_GAME_MIGRATION_CAPTURE_V1';
const GAME_CAPTURE_POLICY='STRICT_SCOPED_REVIEW_V1';
const GAME_CAPTURE_LIMITS=Object.freeze({enumeratedNames:4096,relevantEntries:512,sourceCodeUnits:4000000,capturedCodeUnits:8000000,candidateBytes:16000000,candidates:8,archiveBytes:32000000});
const equalData=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function authorityDomain(domain){if(domain!==AUTHORITY_DOMAIN)fail('DOMAIN_NOT_IMPLEMENTED')}
function exactAuthorityJson(value,limit=4000000){
  const ancestors=new Set();let characters=0;
  const invalid=()=>fail('INVALID_AUTHORITY_JSON');
  const add=text=>{characters+=text.length;if(characters>limit)invalid()};
  function visit(v,depth=0){
    if(depth>128)invalid();
    if(v===null||typeof v==='string'||typeof v==='boolean'){add(JSON.stringify(v));return}
    if(typeof v==='number'){if(!Number.isFinite(v))invalid();add(JSON.stringify(v));return}
    if(typeof v!=='object'||ancestors.has(v)||(!Array.isArray(v)&&![Object.prototype,null].includes(Object.getPrototypeOf(v))))invalid();
    ancestors.add(v);const descriptors=Object.getOwnPropertyDescriptors(v),names=Reflect.ownKeys(descriptors);
    if(Array.isArray(v)){
      if(names.length!==v.length+1)invalid();add('[]');
      for(let n=0;n<v.length;n++){const d=descriptors[n];if(!d||!d.enumerable||!Object.hasOwn(d,'value'))invalid();if(n)add(',');visit(d.value,depth+1)}
    }else{
      add('{}');for(let n=0;n<names.length;n++){const key=names[n],d=descriptors[key];if(typeof key!=='string'||!d.enumerable||!Object.hasOwn(d,'value'))invalid();if(n)add(',');add(JSON.stringify(key));add(':');visit(d.value,depth+1)}
    }
    ancestors.delete(v);
  }
  visit(value);
}
function authorityEnvelope(value){
  try{exactAuthorityJson(value);if(!object(value)||(value.activePlayerId!==null&&(typeof value.activePlayerId!=='string'||!ID.test(value.activePlayerId))))fail('INVALID_ACTIVE_PLAYER_ID');validateEnvelope(value);if(JSON.stringify(value).length>4000000)fail('STORE_CAPACITY')}
  catch{fail('CORRUPT_AUTHORITY')}
  return value;
}
function authoritySnapshot(meta,envelope){
  if(meta===undefined&&envelope===undefined)return {status:'UNINITIALIZED',coverage:[AUTHORITY_DOMAIN],integration:AUTHORITY_INTEGRATION};
  if(!keys(meta,['schema','integration','coverage','authorityEpoch','selectionEpoch','activePlayerId'])||meta.schema!==AUTHORITY_SCHEMA||meta.integration!==AUTHORITY_INTEGRATION||!equalData(meta.coverage,[AUTHORITY_DOMAIN])||typeof meta.authorityEpoch!=='string'||!/^[a-f0-9]{32}$/.test(meta.authorityEpoch)||!integer(meta.selectionEpoch,Number.MAX_SAFE_INTEGER))fail('CORRUPT_AUTHORITY');
  authorityEnvelope(envelope);
  if(meta.activePlayerId!==envelope.activePlayerId)fail('CORRUPT_AUTHORITY');
  return clone({status:'READY',coverage:meta.coverage,integration:meta.integration,authorityEpoch:meta.authorityEpoch,selectionEpoch:meta.selectionEpoch,revision:envelope.revision,activePlayerId:envelope.activePlayerId,envelope});
}
export function createLocalGameAuthority({indexedDB,crypto,now=Date.now,databaseName=LOCAL_GAME_AUTHORITY_DATABASE}={}){
  // No global storage getter, DB request, event listener, or random generation
  // occurs here. Explicit open is the first interaction with browser storage.
  if(typeof databaseName!=='string'||(databaseName!==LOCAL_GAME_AUTHORITY_DATABASE&&!/^KAIOS_LOCAL_GAME_TEST:[a-zA-Z0-9_-]{1,100}$/.test(databaseName)))fail('INVALID_AUTHORITY_DATABASE');
  let db=null,opening=null,generation=0,reducing=false,gameRegistry=null;
  const transactions=new Set();
  const requireOpen=()=>{if(!db)fail('AUTHORITY_OPEN_REQUIRED');return db};
  const secureCrypto=()=>crypto??globalThis.crypto;
  const token=()=>{const c=secureCrypto();if(typeof c?.getRandomValues!=='function')fail('SECURE_RANDOM_UNAVAILABLE');const b=new Uint8Array(16);c.getRandomValues(b);return [...b].map(v=>v.toString(16).padStart(2,'0')).join('')};
  async function hash(raw){const c=secureCrypto();if(typeof c?.subtle?.digest!=='function')fail('HASH_UNAVAILABLE');const b=await c.subtle.digest('SHA-256',new TextEncoder().encode(raw));return [...new Uint8Array(b)].map(v=>v.toString(16).padStart(2,'0')).join('')}
  // localStorage exposes UTF-16 strings, not raw disk bytes. JSON escaping
  // preserves lone code units that direct TextEncoder(raw) would replace.
  const hashSource=raw=>hash(JSON.stringify({present:true,raw}));
  function close(){generation++;opening=null;gameRegistry=null;for(const tx of transactions){try{tx.abort()}catch{}}db?.close();db=null}
  function open(){
    if(db)return Promise.resolve();if(opening)return opening;
    const admitted=generation;
    opening=new Promise((resolve,reject)=>{
      let request,settled=false;
      const rejectOnce=error=>{if(!settled){settled=true;reject(error)}};
      try{const factory=indexedDB??globalThis.indexedDB;if(!factory?.open)fail('INDEXEDDB_UNAVAILABLE');request=factory.open(databaseName,1)}catch(error){rejectOnce(error);return}
      request.onblocked=()=>rejectOnce(new Error('AUTHORITY_OPEN_BLOCKED'));
      request.onerror=()=>rejectOnce(request.error||new Error('AUTHORITY_OPEN_FAILED'));
      request.onupgradeneeded=event=>{try{if(settled||admitted!==generation)fail('AUTHORITY_CLOSED');if(event.oldVersion!==0)fail('AUTHORITY_SCHEMA_UNSUPPORTED');request.result.createObjectStore(AUTHORITY_STORE)}catch(error){request.transaction?.abort();rejectOnce(error)}};
      request.onsuccess=()=>{
        const connection=request.result;
        if(settled||admitted!==generation){connection.close();rejectOnce(new Error('AUTHORITY_CLOSED'));return}
        if(connection.objectStoreNames.length!==1||!connection.objectStoreNames.contains(AUTHORITY_STORE)){connection.close();rejectOnce(new Error('AUTHORITY_SCHEMA_UNSUPPORTED'));return}
        db=connection;db.onversionchange=()=>close();db.onclose=()=>{if(db===connection)close()};settled=true;resolve();
      };
    }).finally(()=>{if(admitted===generation)opening=null});
    return opening;
  }
  function transaction(mode,recordKeys,work,expandKeys=null){
    const connection=requireOpen(),admitted=generation;
    return new Promise((resolve,reject)=>{
      let tx,result,workError=null;
      const abort=error=>{workError??=error;try{tx.abort()}catch{reject(workError)}};
      try{tx=connection.transaction(AUTHORITY_STORE,mode,{durability:'strict'});transactions.add(tx)}catch(error){reject(error);return}
      // Request success is not commit acknowledgement. Install all terminal
      // handlers before the first request, and never suppress a request error.
      tx.oncomplete=()=>{transactions.delete(tx);if(admitted!==generation||connection!==db){reject(new Error('AUTHORITY_CLOSED'));return}resolve(clone(result))};
      tx.onabort=()=>{transactions.delete(tx);reject(workError||tx.error||new Error('AUTHORITY_TRANSACTION_ABORTED'))};
      tx.onerror=()=>{workError??=tx.error||new Error('AUTHORITY_TRANSACTION_FAILED')};
      const store=tx.objectStore(AUTHORITY_STORE),values={};
      const apply=()=>{try{if(admitted!==generation||connection!==db)fail('AUTHORITY_CLOSED');result=work(values,store);if(result&&typeof result.then==='function')fail('ASYNC_TRANSACTION_REDUCER')}catch(error){abort(error)}};
      function readKeys(keys,done){
        let remaining=keys.length;if(!remaining){done();return}
        try{for(const key of keys){const request=key==='$keys'?store.getAllKeys():store.get(key);request.onerror=()=>{workError??=request.error};request.onsuccess=()=>{values[key]=request.result;if(--remaining===0)done()}}}catch(error){abort(error)}
      }
      readKeys(recordKeys,()=>{try{if(admitted!==generation||connection!==db)fail('AUTHORITY_CLOSED');const extra=expandKeys?expandKeys(values):[];readKeys(extra,apply)}catch(error){abort(error)}});
    });
  }
  const loaded=values=>{
    const meta=values.$authority,envelope=values[AUTHORITY_DOMAIN],marker=values.$initialized;
    if(meta?.schema===DAILY_AUTHORITY_SCHEMA)fail('DAILY_AUTHORITY_REQUIRES_DAILY_API');
    if(meta?.schema===FULL_AUTHORITY_SCHEMA)fail('FULL_AUTHORITY_REQUIRES_GAME_API');
    const history=values.$keys?.some(key=>typeof key==='string'&&key.startsWith('archive:'));
    if(meta===undefined&&envelope===undefined){if(marker!==undefined||history)fail('CORRUPT_AUTHORITY')}
    else if(!keys(marker,['authorityEpoch','coverage'])||marker.authorityEpoch!==meta?.authorityEpoch||!equalData(marker.coverage,[AUTHORITY_DOMAIN])||!values.$keys?.includes('archive:'+meta.authorityEpoch))fail('CORRUPT_AUTHORITY');
    return authoritySnapshot(meta,envelope);
  };
  function read({domain=AUTHORITY_DOMAIN}={}){authorityDomain(domain);return transaction('readonly',AUTHORITY_READ_KEYS,loaded)}
  function initialRecords(envelope,epoch){
    authorityEnvelope(envelope);const data=clone(envelope);
    const meta={schema:AUTHORITY_SCHEMA,integration:AUTHORITY_INTEGRATION,coverage:[AUTHORITY_DOMAIN],authorityEpoch:epoch,selectionEpoch:0,activePlayerId:data.activePlayerId};
    return {data,meta};
  }
  function initialize(input={}){
    exactAuthorityJson(input);authorityDomain(input.domain);if(!keys(input,['domain','envelope','confirmLifeOnlyDraft']))fail('INVALID_INITIALIZATION');if(input.confirmLifeOnlyDraft!==true)fail('EXPLICIT_DRAFT_CONFIRMATION_REQUIRED');
    const {data,meta}=initialRecords(input.envelope,token());
    return transaction('readwrite',AUTHORITY_READ_KEYS,(values,store)=>{
      if(loaded(values).status!=='UNINITIALIZED')fail('AUTHORITY_ALREADY_INITIALIZED');
      store.add({kind:'INITIAL_LIFE_DRAFT',raw:JSON.stringify(data),coverage:[AUTHORITY_DOMAIN]},'archive:'+meta.authorityEpoch);
      store.add({authorityEpoch:meta.authorityEpoch,coverage:[AUTHORITY_DOMAIN]},'$initialized');store.add(meta,'$authority');store.add(data,AUTHORITY_DOMAIN);return authoritySnapshot(meta,data);
    });
  }
  // Reducers are trusted existing domain-transition code, not arbitrary user
  // patches. Structural validation does not replace import/wallet-proof policy.
  function command(input={},reducer){
    if(reducing)fail('REENTRANT_COMMAND');exactAuthorityJson(input);authorityDomain(input.domain);
    if(!keys(input,['domain','kind','playerId','expected'])||!['UPDATE','CREATE','IMPORT','SWITCH'].includes(input.kind))fail('INVALID_AUTHORITY_COMMAND');
    if(!keys(input.expected,['authorityEpoch','selectionEpoch','revision'])||Object.keys(input.expected).length!==3)fail('INVALID_AUTHORITY_EXPECTATIONS');
    input=clone(input);const expectations=input.expected;
    return transaction('readwrite',AUTHORITY_READ_KEYS,(values,store)=>{
      const before=loaded(values);if(before.status!=='READY')fail('AUTHORITY_UNINITIALIZED');
      if(!keys(expectations,['authorityEpoch','selectionEpoch','revision'])||expectations.authorityEpoch!==before.authorityEpoch||expectations.selectionEpoch!==before.selectionEpoch||expectations.revision!==before.revision)fail('REVISION_CONFLICT_RELOAD_REQUIRED');
      const previous=before.envelope,next=clone(previous),meta=clone(values.$authority),oldIds=Object.keys(previous.players);
      if(typeof input.playerId!=='string'||!ID.test(input.playerId))fail('INVALID_PLAYER_ID');
      if(input.kind==='SWITCH'){
        if(reducer!==undefined)fail('SWITCH_REDUCER_FORBIDDEN');if(!Object.hasOwn(next.players,input.playerId))fail('PLAYER_NOT_FOUND');next.activePlayerId=input.playerId;
      }else{
        if(typeof reducer!=='function')fail('SYNCHRONOUS_REDUCER_REQUIRED');
        if(reducer.constructor?.name==='AsyncFunction')fail('ASYNC_TRANSACTION_REDUCER');
        if(input.kind==='UPDATE'&&input.playerId!==previous.activePlayerId)fail('PLAYER_NOT_ACTIVE');
        reducing=true;let result;
        try{result=reducer(next)}finally{reducing=false}
        if(result&&typeof result.then==='function'){Promise.resolve(result).catch(()=>{});fail('ASYNC_TRANSACTION_REDUCER')}
        exactAuthorityJson(next);
        if(next.revision!==previous.revision)fail('REVISION_MUTATION_FORBIDDEN');
        const nextIds=Object.keys(next.players);
        if(input.kind==='UPDATE'){
          if(!equalData(nextIds,oldIds))fail('PLAYER_REGISTRY_MUTATION_FORBIDDEN');if(next.activePlayerId!==previous.activePlayerId)fail('SELECTION_MUTATION_FORBIDDEN');
          for(const id of oldIds)if(id!==input.playerId&&!equalData(next.players[id],previous.players[id]))fail('NON_TARGET_PLAYER_MUTATION');
          const oldEvents=previous.players[input.playerId].events;
          if(!equalData(next.players[input.playerId].events.slice(0,oldEvents.length),oldEvents))fail('CONSUMED_EVENTS_MUTATION_FORBIDDEN');
        }else{
          if(oldIds.includes(input.playerId)||nextIds.length!==oldIds.length+1||next.activePlayerId!==input.playerId||!Object.hasOwn(next.players,input.playerId))fail('INVALID_PLAYER_REGISTRY_CHANGE');
          for(const id of oldIds)if(!equalData(next.players[id],previous.players[id]))fail('NON_TARGET_PLAYER_MUTATION');
        }
        if(!equalData(next.usedNonces.slice(0,previous.usedNonces.length),previous.usedNonces))fail('CONSUMED_NONCES_MUTATION_FORBIDDEN');
        if(next.schema!==previous.schema||next.scope!==previous.scope||next.legacyMigrated!==previous.legacyMigrated)fail('GLOBAL_AUTHORITY_MUTATION_FORBIDDEN');
      }
      if(previous.revision>=Number.MAX_SAFE_INTEGER)fail('REVISION_CAPACITY');next.revision=previous.revision+1;
      if(next.activePlayerId!==previous.activePlayerId){if(meta.selectionEpoch>=Number.MAX_SAFE_INTEGER)fail('SELECTION_EPOCH_CAPACITY');meta.selectionEpoch++;meta.activePlayerId=next.activePlayerId}
      authorityEnvelope(next);const after=authoritySnapshot(meta,next);
      store.put(next,AUTHORITY_DOMAIN);store.put(meta,'$authority');return after;
    });
  }
  function validateCandidate(candidate){
    if(candidate?.hashEncoding!==SOURCE_HASH_ENCODING)fail('UNSUPPORTED_MIGRATION_HASH_ENCODING_HOLD');
    if(!keys(candidate,['schema','id','coverage','sourceKey','raw','sha256','hashEncoding','ownerIds','activePlayerId'])||candidate.schema!=='LIFE_DRAFT_MIGRATION_CANDIDATE'||typeof candidate.id!=='string'||!/^[a-f0-9]{32}$/.test(candidate.id)||!equalData(candidate.coverage,[AUTHORITY_DOMAIN])||candidate.sourceKey!==PLAYER_LIFE_STORAGE_KEY||typeof candidate.raw!=='string'||candidate.raw.length>4000000||typeof candidate.sha256!=='string'||!/^[a-f0-9]{64}$/.test(candidate.sha256))fail('INVALID_MIGRATION_CANDIDATE');
    let parsed;try{parsed=JSON.parse(candidate.raw)}catch{fail('INVALID_MIGRATION_CANDIDATE')}authorityEnvelope(parsed);
    if(candidate.activePlayerId!==parsed.activePlayerId||!equalData(candidate.ownerIds,Object.keys(parsed.players).sort()))fail('INVALID_MIGRATION_OWNER');return parsed;
  }
  async function prepareMigration(input={}){
    authorityDomain(input.domain);if(!keys(input,['domain','sourceStorage']))fail('INVALID_MIGRATION_CANDIDATE');requireOpen();const admitted=generation;
    const raw=input.sourceStorage?.getItem(PLAYER_LIFE_STORAGE_KEY);if(typeof raw!=='string')fail('LEGACY_SOURCE_MISSING');if(raw.length>4000000)fail('STORE_CAPACITY');
    let envelope;try{envelope=JSON.parse(raw)}catch{fail('INVALID_MIGRATION_CANDIDATE')}authorityEnvelope(envelope);
    const candidate={schema:'LIFE_DRAFT_MIGRATION_CANDIDATE',id:token(),coverage:[AUTHORITY_DOMAIN],sourceKey:PLAYER_LIFE_STORAGE_KEY,raw,sha256:await hashSource(raw),hashEncoding:SOURCE_HASH_ENCODING,ownerIds:Object.keys(envelope.players).sort(),activePlayerId:envelope.activePlayerId};
    if(admitted!==generation)fail('AUTHORITY_CLOSED');
    return transaction('readwrite',AUTHORITY_READ_KEYS,(values,store)=>{if(loaded(values).status!=='UNINITIALIZED')fail('AUTHORITY_ALREADY_INITIALIZED');store.add(candidate,'candidate:'+candidate.id);return candidate});
  }
  function readCandidate(id){if(typeof id!=='string'||!/^[a-f0-9]{32}$/.test(id))fail('INVALID_MIGRATION_CANDIDATE');return transaction('readonly',['candidate:'+id],values=>{const value=values['candidate:'+id];validateCandidate(value);if(value.id!==id)fail('MIGRATION_CANDIDATE_ID_MISMATCH');return value})}
  async function commitMigration(input={}){
    authorityDomain(input.domain);if(!keys(input,['domain','candidateId','sha256','sourceStorage','confirmLifeOnlyDraft']))fail('INVALID_MIGRATION_CANDIDATE');if(input.confirmLifeOnlyDraft!==true)fail('EXPLICIT_DRAFT_CONFIRMATION_REQUIRED');requireOpen();const admitted=generation;
    input={...input};const candidate=await readCandidate(input.candidateId);if(candidate.sha256!==input.sha256||await hashSource(candidate.raw)!==candidate.sha256)fail('MIGRATION_CONTENT_MISMATCH');
    if(input.sourceStorage?.getItem(PLAYER_LIFE_STORAGE_KEY)!==candidate.raw)fail('LEGACY_SOURCE_DIVERGED_HOLD');if(admitted!==generation)fail('AUTHORITY_CLOSED');
    const {data,meta}=initialRecords(validateCandidate(candidate),token());
    return transaction('readwrite',[...AUTHORITY_READ_KEYS,'candidate:'+input.candidateId],(values,store)=>{
      if(loaded(values).status!=='UNINITIALIZED')fail('AUTHORITY_ALREADY_INITIALIZED');if(!equalData(values['candidate:'+input.candidateId],candidate))fail('MIGRATION_CONTENT_MISMATCH');
      // This recheck detects observed divergence only. It is NOT an atomic
      // multi-key legacy snapshot or a lock on uncooperative old clients.
      if(input.sourceStorage?.getItem(PLAYER_LIFE_STORAGE_KEY)!==candidate.raw)fail('LEGACY_SOURCE_DIVERGED_HOLD');
      store.add({kind:'MIGRATED_LIFE_DRAFT',candidate},'archive:'+meta.authorityEpoch);store.add({authorityEpoch:meta.authorityEpoch,coverage:[AUTHORITY_DOMAIN]},'$initialized');store.add(meta,'$authority');store.add(data,AUTHORITY_DOMAIN);return authoritySnapshot(meta,data);
    });
  }

  // Full mode is a separate inert storage-mechanics prototype. No public API
  // initializes/promotes its marker; isolated tests seed reviewed fixtures.
  async function openGame(){
    const admitted=generation;
    const [bag,product,courier]=await Promise.all([import('./backpack-runtime.mjs'),import('./kgen-margin-runtime.mjs'),import('./digital-ant-logistics-runtime.mjs')]);
    if(admitted!==generation)fail('AUTHORITY_CLOSED');
    if(typeof bag.validateCanonicalBackpack!=='function'||typeof product.validateLocalSimulationProductRecord!=='function'||typeof product.validateLocalCourierCreditTransition!=='function'||typeof courier.validateCanonicalCourierEnvelope!=='function')fail('DOMAIN_VALIDATORS_UNAVAILABLE');
    await open();if(admitted!==generation)fail('AUTHORITY_CLOSED');
    gameRegistry=Object.freeze({bag:bag.validateCanonicalBackpack,product:product.validateLocalSimulationProductRecord,credit:product.validateLocalCourierCreditTransition,courier:courier.validateCanonicalCourierEnvelope,storeItem:bag.storeItem,normalizeItem:bag.normalizeItem});
  }
  const gameFailure=()=>fail('CORRUPT_FULL_AUTHORITY');
  function referenceKey(ref){
    if(!keys(ref,['domain','playerId','owner']))gameFailure();
    if(['PLAYER_LIFE','COURIER'].includes(ref.domain)){if(Object.keys(ref).length!==1)gameFailure();return ref.domain}
    if(typeof ref.playerId!=='string'||!/^KAIOS-P-[a-zA-Z0-9-]{16,80}$/.test(ref.playerId))gameFailure();
    if(ref.domain==='BACKPACK'&&Object.keys(ref).length===2)return 'BACKPACK:'+ref.playerId;
    if(ref.domain==='PRODUCT'&&Object.keys(ref).length===3&&typeof ref.owner==='string'&&(ref.owner==='guest'||/^0x[0-9a-f]{40}$/.test(ref.owner)))return 'PRODUCT:'+ref.playerId+':'+ref.owner;
    gameFailure();
  }
  function fullCatalog(values,protocol='full'){
    const daily=protocol==='daily';
    const meta=values.$authority,marker=values.$initialized,census=values.$keys;
    if(meta?.schema===AUTHORITY_SCHEMA)fail('PARTIAL_AUTHORITY_REQUIRES_REVIEW');
    if(!daily&&meta?.schema===DAILY_AUTHORITY_SCHEMA)fail('DAILY_AUTHORITY_REQUIRES_DAILY_API');
    if(daily&&meta?.schema!==DAILY_AUTHORITY_SCHEMA)fail('DAILY_PROTOCOL_REQUIRED');
    if(meta===undefined)fail('FULL_AUTHORITY_NOT_INITIALIZED');
    exactAuthorityJson(meta);exactAuthorityJson(marker);
    if((meta.activePlayerId!==null&&(typeof meta.activePlayerId!=='string'||!ID.test(meta.activePlayerId)))||!keys(meta,['schema','integration','coverage','authorityEpoch','selectionEpoch','activePlayerId','catalogRevision','catalog','legacyUnbound',...(daily?['dailyProtocol']:[])])||meta.schema!==(daily?DAILY_AUTHORITY_SCHEMA:FULL_AUTHORITY_SCHEMA)||meta.integration!==AUTHORITY_INTEGRATION||!equalData(meta.coverage,FULL_AUTHORITY_DOMAINS)||typeof meta.authorityEpoch!=='string'||!/^[a-f0-9]{32}$/.test(meta.authorityEpoch)||!integer(meta.selectionEpoch,Number.MAX_SAFE_INTEGER)||!integer(meta.catalogRevision,Number.MAX_SAFE_INTEGER)||!Array.isArray(meta.catalog)||meta.catalog.length<2||meta.catalog.length>128||!Array.isArray(meta.legacyUnbound)||meta.legacyUnbound.some(v=>typeof v!=='string')||new Set(meta.legacyUnbound).size!==meta.legacyUnbound.length)gameFailure();
    if(daily&&marker?.dailyGeneration!==meta.dailyProtocol?.generation)gameFailure();
    if(!keys(marker,['authorityEpoch','coverage','catalogRevision',...(daily?['dailyGeneration']:[])])||marker.authorityEpoch!==meta.authorityEpoch||marker.catalogRevision!==meta.catalogRevision||!equalData(marker.coverage,FULL_AUTHORITY_DOMAINS)||!Array.isArray(census)||!census.includes('archive:'+meta.authorityEpoch))gameFailure();
    const catalog=new Map();
    for(const entry of meta.catalog){if(!keys(entry,['ref','presence'])||Object.keys(entry).length!==2||!['PRESENT','ABSENT'].includes(entry.presence))gameFailure();const key=referenceKey(entry.ref);if(catalog.has(key))gameFailure();catalog.set(key,entry);if(census.includes(key)!==(entry.presence==='PRESENT'))gameFailure()}
    if(catalog.get('PLAYER_LIFE')?.presence!=='PRESENT'||!catalog.has('COURIER'))gameFailure();
    for(const key of census)if(!catalog.has(key)&&!['$authority','$initialized'].includes(key)&&!(daily&&(key==='$daily'||(typeof key==='string'&&/^daily-operation:[a-f0-9]{32}$/.test(key))))&&!(typeof key==='string'&&/^(archive|candidate):[a-f0-9]{32}$/.test(key)))gameFailure();
    return catalog;
  }
  const legacyToken=(ref,purpose,receiptId,missionId=null)=>JSON.stringify([referenceKey(ref),purpose,receiptId,missionId]);
  function fullState(values,protocol='full'){
    const catalog=fullCatalog(values,protocol),meta=values.$authority,life=values.PLAYER_LIFE,records=[];authorityEnvelope(life);
    if(meta.activePlayerId!==life.activePlayerId)gameFailure();const playerIds=Object.keys(life.players);let aggregate=JSON.stringify(meta).length;
    for(const playerId of playerIds)if(!catalog.has('BACKPACK:'+playerId)||!catalog.has('PRODUCT:'+playerId+':guest'))gameFailure();
    for(const [key,entry] of catalog){
      const raw=values[key],ref=entry.ref;
      if(ref.playerId&&!playerIds.includes(ref.playerId))gameFailure();
      if(entry.presence==='ABSENT'){if(raw!==undefined)gameFailure();records.push({ref:clone(ref),revision:null,value:null});continue}
      if(raw===undefined)gameFailure();exactAuthorityJson(raw);aggregate+=JSON.stringify(raw).length;if(aggregate>8_000_000)fail('FULL_AUTHORITY_CAPACITY');
      let revision,value;
      if(ref.domain==='BACKPACK'){if(!keys(raw,['revision','data'])||Object.keys(raw).length!==2||!integer(raw.revision,Number.MAX_SAFE_INTEGER))gameFailure();gameRegistry.bag(raw.data,{ownerId:ref.playerId});revision=raw.revision;value=raw.data}
      else{value=raw;revision=raw.revision;if(ref.domain==='PRODUCT')gameRegistry.product(raw,{playerId:ref.playerId,owner:ref.owner});else if(ref.domain==='COURIER')gameRegistry.courier(raw,{playerIds});else authorityEnvelope(raw)}
      if(!integer(revision,Number.MAX_SAFE_INTEGER))gameFailure();records.push({ref:clone(ref),revision,value:clone(value)});
    }
    const byKey=new Map(records.map(e=>[referenceKey(e.ref),e])),courier=byKey.get('COURIER')?.value,unbound=[];
    const bindingEqual=(binding,credit)=>binding&&credit&&['receiptId','missionId','playerId','owner','rewardKaios','purpose'].every(k=>binding[k]===credit[k]);
    for(const record of records)if(record.ref.domain==='PRODUCT'&&record.value){
      const p=record.value.progress;
      for(const insurance of [false,true]){const bindings=p[insurance?'courierInsuranceBindings':'courierReceiptBindings'],ids=insurance?Object.keys(p.courierInsuranceReceipts):p.courierReceipts,purpose=insurance?'PLAYER_COURIER_INSURANCE_PAYOUT':'PLAYER_COURIER_REWARD';
        for(const id of ids){const binding=bindings[id];if(!binding){unbound.push(legacyToken(record.ref,purpose,id));continue}const mission=courier?.missions[binding.missionId],credit=insurance?mission?.insurance?.credit:mission?.settlement?.credit;if(!bindingEqual(binding,credit)||mission.courierLifeId!==record.ref.playerId)fail('INVALID_FULL_CREDIT_REFERENCE')}
      }
    }
    for(const mission of Object.values(courier?.missions||{})){
      for(const insurance of [false,true]){const credit=insurance?mission.insurance?.credit:mission.settlement?.credit,purpose=insurance?'PLAYER_COURIER_INSURANCE_PAYOUT':'PLAYER_COURIER_REWARD',receiptId=insurance?mission.insurance?.payoutReceiptId:mission.settlement?.receiptId;
        const completed=insurance?mission.insurance?.claimStatus==='PAID':mission.status==='DELIVERED';
        if(credit){const product=byKey.get(referenceKey({domain:'PRODUCT',playerId:credit.playerId,owner:credit.owner}))?.value,binding=product?.progress[insurance?'courierInsuranceBindings':'courierReceiptBindings']?.[credit.receiptId];if(!product||(binding&&!bindingEqual(binding,credit))||(credit.status==='CONFIRMED'&&!binding))fail('INVALID_FULL_CREDIT_REFERENCE')}
        else if(completed)unbound.push(legacyToken({domain:'COURIER'},purpose,receiptId,mission.missionId));
      }
      if(mission.cargo.ownerState==='CLAIMED_BY_BANDIT'){const bag=byKey.get(referenceKey({domain:'BACKPACK',playerId:mission.cargo.ownerLifeId}))?.value;if(!bag?.rewardReceipts.includes(mission.bandit.lootReceiptId))fail('INVALID_FULL_LOOT_REFERENCE')}
    }
    if(!equalData([...unbound].sort(),[...meta.legacyUnbound].sort()))fail('LEGACY_PROVENANCE_MISMATCH');
    return {status:'READY',integration:AUTHORITY_INTEGRATION,coverage:clone(FULL_AUTHORITY_DOMAINS),authorityEpoch:meta.authorityEpoch,selectionEpoch:meta.selectionEpoch,activePlayerId:meta.activePlayerId,catalogRevision:meta.catalogRevision,records};
  }
  function gameTransaction(mode,work){
    requireOpen();if(!gameRegistry)fail('GAME_VALIDATORS_NOT_READY');
    return transaction(mode,['$authority','$initialized','$keys'],work,values=>[...fullCatalog(values).keys()]);
  }
  function readGame(){return gameTransaction('readonly',fullState)}
  function retainedArray(before,after){if(!Array.isArray(after)||!equalData(before,after.slice(0,before.length)))fail('IMMUTABLE_HISTORY_CHANGED')}
  function retainedMap(before,after){for(const [key,value] of Object.entries(before))if(!Object.hasOwn(after,key)||!equalData(value,after[key]))fail('IMMUTABLE_BINDING_CHANGED')}
  function retainedCredit(before,after){if(!before)return;if(!after||!equalData({...before,status:undefined},{...after,status:undefined})||!['PENDING','CONFIRMED'].includes(after.status)||(before.status==='CONFIRMED'&&after.status!=='CONFIRMED'))fail('IMMUTABLE_BINDING_CHANGED')}
  function retainedSimulation(before,after){
    if(!before)return;if(!after||after.sequence<before.sequence)fail('SIMULATION_HISTORY_CHANGED');
    retainedArray(before.receipts,after.receipts);
    for(const kind of ['orders','positions']){
      if(after[kind].length<before[kind].length)fail('SIMULATION_HISTORY_CHANGED');
      for(let n=0;n<before[kind].length;n++){
        const a=before[kind][n],b=after[kind][n],id=kind==='orders'?'orderId':'positionId';if(a[id]!==b[id])fail('SIMULATION_HISTORY_CHANGED');
        const mutable=kind==='orders'?['status','triggeredAt','observedPrice','fillPrice','positionId','reason']:['status','margin','mark','observedAt','observationSequence','deltaIndex','equity','settledAt'];
        const omit=v=>Object.fromEntries(Object.entries(v).filter(([k])=>!mutable.includes(k)));if(!equalData(omit(a),omit(b)))fail('SIMULATION_IDENTITY_CHANGED');
        if((kind==='orders'?a.status!=='PENDING':a.status!=='OPEN')&&!equalData(a,b))fail('SIMULATION_HISTORY_CHANGED');
        if(kind==='positions'&&b.observedAt<a.observedAt)fail('SIMULATION_HISTORY_CHANGED');
      }
    }
    for(const [market,a] of Object.entries(before.observations)){const b=after.observations[market];if(!b||(!equalData(a,b)&&b.at<=a.at))fail('SIMULATION_HISTORY_CHANGED')}
  }
  function commandGame(input={},reducer){
    if(reducing)fail('REENTRANT_COMMAND');exactAuthorityJson(input);
    if(!keys(input,['kind','playerId','owner','missionId','expected'])||!['PLAYER_UPDATE','INVENTORY_UPDATE','PRODUCT_UPDATE','OWN_COURIER_TRANSACTION','SWITCH'].includes(input.kind))fail('INVALID_GAME_COMMAND');input=clone(input);
    return gameTransaction('readwrite',(values,store)=>{
      const before=fullState(values),meta=clone(values.$authority),catalog=fullCatalog(values),expect=input.expected;
      if(!keys(expect,['authorityEpoch','selectionEpoch','catalogRevision','records'])||Object.keys(expect).length!==4||expect.authorityEpoch!==before.authorityEpoch||expect.selectionEpoch!==before.selectionEpoch||expect.catalogRevision!==before.catalogRevision||!Array.isArray(expect.records)||expect.records.length!==before.records.length)fail('REVISION_CONFLICT_RELOAD_REQUIRED');
      const expected=new Map();for(const entry of expect.records){if(!keys(entry,['ref','revision'])||Object.keys(entry).length!==2)fail('INVALID_GAME_EXPECTATIONS');const key=referenceKey(entry.ref);if(expected.has(key)||!catalog.has(key))fail('INVALID_GAME_EXPECTATIONS');expected.set(key,entry.revision)}
      for(const record of before.records)if(!expected.has(referenceKey(record.ref))||expected.get(referenceKey(record.ref))!==record.revision)fail('REVISION_CONFLICT_RELOAD_REQUIRED');
      const life=before.records.find(e=>e.ref.domain==='PLAYER_LIFE').value;
      if(typeof input.playerId!=='string'||!ID.test(input.playerId)||!Object.hasOwn(life.players,input.playerId)||typeof input.owner!=='string'||!(input.owner==='guest'||/^0x[0-9a-f]{40}$/.test(input.owner)))fail('INVALID_GAME_NAMESPACE');
      if(input.kind!=='SWITCH'&&input.playerId!==before.activePlayerId)fail('PLAYER_NOT_ACTIVE');
      const bagKey=referenceKey({domain:'BACKPACK',playerId:input.playerId}),productKey=referenceKey({domain:'PRODUCT',playerId:input.playerId,owner:input.owner});
      const allowed=new Set(input.kind==='PLAYER_UPDATE'||input.kind==='SWITCH'?['PLAYER_LIFE']:input.kind==='INVENTORY_UPDATE'?[bagKey]:input.kind==='PRODUCT_UPDATE'?[productKey]:['COURIER',productKey]);
      for(const key of allowed)if(catalog.get(key)?.presence!=='PRESENT')fail('DOMAIN_RECORD_ABSENT');
      const oldCourier=before.records.find(e=>e.ref.domain==='COURIER')?.value;
      if(input.kind==='OWN_COURIER_TRANSACTION'){if(typeof input.missionId!=='string'||oldCourier?.missions[input.missionId]?.courierLifeId!==input.playerId)fail('UNDECLARED_COURIER_PARTICIPANT')}
      else if(input.missionId!==undefined)fail('UNDECLARED_COURIER_PARTICIPANT');
      const drafts=before.records.map(({ref,value})=>({ref:clone(ref),value:clone(value)}));
      if(input.kind==='SWITCH'){if(reducer!==undefined)fail('SWITCH_REDUCER_FORBIDDEN');drafts.find(e=>e.ref.domain==='PLAYER_LIFE').value.activePlayerId=input.playerId}
      else{if(typeof reducer!=='function'||reducer.constructor?.name==='AsyncFunction')fail('SYNCHRONOUS_REDUCER_REQUIRED');reducing=true;let result;try{result=reducer(drafts)}finally{reducing=false}if(result&&typeof result.then==='function'){Promise.resolve(result).catch(()=>{});fail('ASYNC_TRANSACTION_REDUCER')}}
      exactAuthorityJson(drafts,8000000);if(drafts.length!==before.records.length)fail('CATALOG_MUTATION_FORBIDDEN');
      const nextValues={...values},changed=[];
      for(let n=0;n<drafts.length;n++){
        const entry=drafts[n],previous=before.records[n],key=referenceKey(previous.ref);
        if(!keys(entry,['ref','value'])||Object.keys(entry).length!==2||referenceKey(entry.ref)!==key)fail('CATALOG_MUTATION_FORBIDDEN');
        if(equalData(entry.value,previous.value))continue;
        if(!allowed.has(key))fail('NON_TARGET_RECORD_MUTATION');if(previous.revision===null)fail('DOMAIN_RECORD_ABSENT');
        const value=entry.value,old=previous.value;
        if(previous.ref.domain!=='BACKPACK'&&value?.revision!==old.revision)fail('REVISION_MUTATION_FORBIDDEN');
        if(previous.ref.domain==='PLAYER_LIFE'){
          if(!equalData(Object.keys(value.players),Object.keys(old.players)))fail('PLAYER_REGISTRY_MUTATION_FORBIDDEN');
          for(const id of Object.keys(old.players))if((input.kind==='SWITCH'||id!==input.playerId)&&!equalData(value.players[id],old.players[id]))fail('NON_TARGET_PLAYER_MUTATION');
          if(input.kind!=='SWITCH'&&value.activePlayerId!==old.activePlayerId)fail('SELECTION_MUTATION_FORBIDDEN');
          if(['schema','scope','legacyMigrated'].some(k=>value[k]!==old[k]))fail('GLOBAL_AUTHORITY_MUTATION_FORBIDDEN');retainedArray(old.usedNonces,value.usedNonces);for(const id of Object.keys(old.players))retainedArray(old.players[id].events,value.players[id].events);
        }else if(previous.ref.domain==='BACKPACK'){
          retainedArray(old.rewardReceipts,value.rewardReceipts);if(value.rewardReceipts.slice(old.rewardReceipts.length).some(id=>/^LOOT-[0-9a-f]{8}$/.test(id)))fail('CROSS_PARTY_LOOT_NOT_IMPLEMENTED');
        }else if(previous.ref.domain==='PRODUCT'){
          retainedSimulation(old.ledger.simulation,value.ledger.simulation);
          for(const field of ['spentKaios','loot','xp','engineXp','playedMs'])if(value.progress[field]<old.progress[field])fail('PRODUCT_HISTORY_CHANGED');
          for(const [event,count] of Object.entries(old.progress.events))if(!Object.hasOwn(value.progress.events,event)||value.progress.events[event]<count)fail('PRODUCT_HISTORY_CHANGED');
          retainedArray(old.progress.courierReceipts,value.progress.courierReceipts);for(const field of ['courierInsuranceReceipts','courierReceiptBindings','courierInsuranceBindings'])retainedMap(old.progress[field],value.progress[field]);
          for(const field of ['courierReceipts','courierInsuranceReceipts','courierReceiptBindings','courierInsuranceBindings'])if(input.kind!=='OWN_COURIER_TRANSACTION'&&!equalData(old.progress[field],value.progress[field]))fail('COURIER_TRANSACTION_REQUIRED');
          if(input.kind==='OWN_COURIER_TRANSACTION')for(const field of ['courierReceiptBindings','courierInsuranceBindings'])for(const [id,b] of Object.entries(value.progress[field]))if(!Object.hasOwn(old.progress[field],id)&&b.missionId!==input.missionId)fail('UNDECLARED_COURIER_PARTICIPANT');
        }else{
          if(!equalData(Object.keys(old.missions),Object.keys(value.missions)))fail('MISSION_CREATION_NOT_IMPLEMENTED');
          for(const [id,mission] of Object.entries(old.missions))if(id!==input.missionId&&!equalData(mission,value.missions[id]))fail('NON_TARGET_MISSION_MUTATION');
          const a=old.missions[input.missionId],b=value.missions[input.missionId];
          if(['DELIVERED','FAILED'].includes(a.status)&&!equalData(a,b))fail('TERMINAL_MISSION_CHANGED');
          if(a.status==='ROBBED'&&!equalData({...a,insurance:null},{...b,insurance:null}))fail('TERMINAL_MISSION_CHANGED');
          for(const field of ['schema','missionId','courierLifeId','requesterLifeId','mode','createdAt','estimatedDurationMs','startedAt','dueAt','origin','destination','economics'])if(!equalData(a[field],b[field]))fail('IMMUTABLE_MISSION_CHANGED');
          for(const field of ['cargoId','kind','amount','unit'])if(a.cargo[field]!==b.cargo[field])fail('IMMUTABLE_MISSION_CHANGED');
          const transitions={ACTIVE:['ACTIVE','CLOCK_REVIEW','DELIVERY_PENDING_CREDIT','FAILED'],CLOCK_REVIEW:['CLOCK_REVIEW'],DELIVERY_PENDING_CREDIT:['DELIVERY_PENDING_CREDIT','DELIVERED'],DELIVERED:['DELIVERED'],ROBBED:['ROBBED'],FAILED:['FAILED']};if(!transitions[a.status]?.includes(b.status))fail('UNSUPPORTED_COURIER_TRANSITION');
          retainedArray(old.settledReceipts,value.settledReceipts);retainedArray(old.lootReceipts,value.lootReceipts);
          if(!equalData(a.bandit,b.bandit))fail('CROSS_PARTY_RAID_NOT_IMPLEMENTED');
          if(['DELIVERED','ROBBED','FAILED'].includes(a.status)&&!equalData(a.cargo,b.cargo))fail('IMMUTABLE_CUSTODY_CHANGED');
          if(a.settlement){const omitCredit=s=>Object.fromEntries(Object.entries(s).filter(([k])=>!['credit','outcome'].includes(k)));if(!b.settlement||!equalData(omitCredit(a.settlement),omitCredit(b.settlement)))fail('IMMUTABLE_SETTLEMENT_CHANGED')}
          for(const field of ['status','claimStatus']){const allowed=field==='status'?{UNINSURED:['UNINSURED'],QUOTE_ONLY:['QUOTE_ONLY'],ACTIVE:['ACTIVE']}:{NOT_APPLICABLE:['NOT_APPLICABLE'],NOT_CLAIMED:['NOT_CLAIMED'],APPROVED:['APPROVED','PAID'],PAID:['PAID']};if(!allowed[a.insurance[field]]?.includes(b.insurance[field]))fail('UNSUPPORTED_INSURANCE_TRANSITION')}
          for(const field of ['policyId','coverageBps','deductibleKaios','maxClaimKaios','premiumKaios'])if(!equalData(a.insurance[field],b.insurance[field]))fail('IMMUTABLE_INSURANCE_CHANGED');
          for(const field of ['activatedAt','paymentEvidence','payoutKaios','payoutReceiptId','paidAt','payoutEvidence'])if(Object.hasOwn(a.insurance,field)&&!equalData(a.insurance[field],b.insurance[field]))fail('IMMUTABLE_INSURANCE_CHANGED');
          retainedCredit(a.settlement?.credit,b.settlement?.credit);retainedCredit(a.insurance?.credit,b.insurance?.credit);
          if(value.settledReceipts.slice(old.settledReceipts.length).some(id=>id!==b.settlement?.receiptId)||value.lootReceipts.length!==old.lootReceipts.length)fail('UNDECLARED_COURIER_PARTICIPANT');
        }
        if(previous.revision>=Number.MAX_SAFE_INTEGER)fail('REVISION_CAPACITY');
        const raw=previous.ref.domain==='BACKPACK'?{revision:previous.revision+1,data:value}:{...value,revision:previous.revision+1};nextValues[key]=raw;changed.push(key);
      }
      if(input.kind==='SWITCH'&&life.activePlayerId!==input.playerId){if(meta.selectionEpoch>=Number.MAX_SAFE_INTEGER)fail('SELECTION_EPOCH_CAPACITY');meta.selectionEpoch++;meta.activePlayerId=input.playerId;nextValues.$authority=meta}
      const after=fullState(nextValues);
      if(input.kind==='OWN_COURIER_TRANSACTION'){
        const oldProduct=before.records.find(e=>referenceKey(e.ref)===productKey).value,newProduct=after.records.find(e=>referenceKey(e.ref)===productKey).value,mission=after.records.find(e=>e.ref.domain==='COURIER').value.missions[input.missionId];
        let confirmed=false;
        for(const insurance of [false,true]){
          const field=insurance?'courierInsuranceBindings':'courierReceiptBindings';for(const id of Object.keys(newProduct.progress[field]))if(!Object.hasOwn(oldProduct.progress[field],id)&&(insurance?mission.insurance.claimStatus!=='PAID':mission.status!=='DELIVERED'))fail('INCOMPLETE_NEW_CREDIT_ACK');
          const credit=insurance?mission.insurance.credit:mission.settlement?.credit;if(credit&&credit.owner!==input.owner)fail('BOUND_OWNER_CONTEXT_REQUIRED');
          if(credit?.status==='CONFIRMED'){
            const binding=Object.fromEntries(['receiptId','missionId','playerId','owner','rewardKaios','purpose'].map(key=>[key,credit[key]]));
            gameRegistry.credit(oldProduct,newProduct,{binding,expectedRevision:oldProduct.revision+(changed.includes(productKey)?1:0)});confirmed=true;
          }
        }
        if(!confirmed&&!equalData(oldProduct,newProduct))fail('COURIER_CREDIT_REQUIRED');
      }
      for(const key of changed)store.put(nextValues[key],key);if(nextValues.$authority!==values.$authority)store.put(nextValues.$authority,'$authority');return after;
    });
  }

  // Capture/review only: no full initializer, promotion, source write or restore.
  // Closed daily-only semantic prototype. Same database/store; no initializer,
  // promotion or generic reducer exposure. These receipts are not full recovery.
  const dailyFailure=()=>fail('CORRUPT_DAILY_AUTHORITY');
  const dailyShape=(v,names)=>keys(v,names)&&Object.keys(v).length===names.length;
  const dailyBytes=(key,value)=>new TextEncoder().encode(JSON.stringify({key,value})).byteLength;
  const dailyKey=id=>'daily-operation:'+id;
  const dailyToken=(playerId,rewardId)=>JSON.stringify([playerId,rewardId]);
  function dailyRequest(input,kind,base){
    exactAuthorityJson(input,32768);
    if(!dailyShape(input,['opId','playerId','expected',...(kind==='FULFILL_DAILY'?['claimRef']:[])])||!DAILY_OP.test(input.opId)||typeof input.opId!=='string'||typeof input.playerId!=='string'||!ID.test(input.playerId)||(kind==='FULFILL_DAILY'&&(typeof input.claimRef!=='string'||!DAILY_OP.test(input.claimRef))))fail('INVALID_DAILY_COMMAND');
    const e=input.expected;
    if(!dailyShape(e,['authorityEpoch','dailyGeneration','selectionEpoch','catalogRevision','dailySequence','records'])||typeof e.authorityEpoch!=='string'||!DAILY_OP.test(e.authorityEpoch)||typeof e.dailyGeneration!=='string'||!DAILY_OP.test(e.dailyGeneration)||!integer(e.selectionEpoch,Number.MAX_SAFE_INTEGER)||!integer(e.catalogRevision,Number.MAX_SAFE_INTEGER)||!integer(e.dailySequence,Number.MAX_SAFE_INTEGER)||!Array.isArray(e.records)||e.records.length!==base.records.length)fail('INVALID_DAILY_EXPECTATIONS');
    const refs=new Map(base.records.map(r=>[referenceKey(r.ref),r.ref])),seen=new Set(),records=[];
    for(const r of e.records){if(!dailyShape(r,['ref','revision']))fail('INVALID_DAILY_EXPECTATIONS');const key=referenceKey(r.ref);if(!refs.has(key)||seen.has(key)||(r.revision!==null&&!integer(r.revision,Number.MAX_SAFE_INTEGER)))fail('INVALID_DAILY_EXPECTATIONS');seen.add(key);records.push({ref:clone(refs.get(key)),revision:r.revision})}
    records.sort((a,b)=>referenceKey(a.ref)<referenceKey(b.ref)?-1:referenceKey(a.ref)>referenceKey(b.ref)?1:0);
    return {opId:input.opId,playerId:input.playerId,expected:{authorityEpoch:e.authorityEpoch,dailyGeneration:e.dailyGeneration,selectionEpoch:e.selectionEpoch,catalogRevision:e.catalogRevision,dailySequence:e.dailySequence,records},...(kind==='FULFILL_DAILY'?{claimRef:input.claimRef}:{})};
  }
  function dailyAccounting(receipts,pending,generation){
    const acceptedBytes=receipts.reduce((total,r)=>total+dailyBytes(dailyKey(r.request.opId),r),0),acceptedCount=receipts.length;
    const head={schema:'DAILY_HEAD_V1',generation,sequence:acceptedCount,acceptedCount,acceptedBytes,pendingCount:pending,reservedSlots:pending,reservedBytes:pending*DAILY_PROTOCOL_LIMITS.entryBytes};
    if(acceptedCount+pending>DAILY_PROTOCOL_LIMITS.operationSlots||acceptedBytes+head.reservedBytes>DAILY_PROTOCOL_LIMITS.totalBytes)fail('DAILY_RECEIPT_CAPACITY');return head;
  }
  function dailyState(values){
    const base=fullState(values,'daily'),p=values.$authority.dailyProtocol;
    exactAuthorityJson(p,DAILY_PROTOCOL_LIMITS.protocolBytes);
    if(!dailyShape(p,['generation','limits','legacyClaims','legacyDeliveries'])||typeof p.generation!=='string'||!DAILY_OP.test(p.generation)||!dailyShape(p.limits,Object.keys(DAILY_PROTOCOL_LIMITS))||Object.keys(DAILY_PROTOCOL_LIMITS).some(k=>p.limits[k]!==DAILY_PROTOCOL_LIMITS[k])||dailyBytes('$dailyProtocol',p)>DAILY_PROTOCOL_LIMITS.protocolBytes)dailyFailure();
    if(!equalData(values['archive:'+base.authorityEpoch]?.dailyProtocol,p))fail('DAILY_PROVENANCE_MISMATCH');
    const life=base.records.find(r=>r.ref.domain==='PLAYER_LIFE').value,bagFor=id=>base.records.find(r=>r.ref.domain==='BACKPACK'&&r.ref.playerId===id),allClaims=new Map(),allDeliveries=new Set();
    for(const [id,player] of Object.entries(life.players)){
      for(const event of player.events)if(event.type==='DAILY_JOURNEY')allClaims.set(dailyToken(id,event.id),event);
      for(const rewardId of bagFor(id)?.value?.rewardReceipts||[])if(rewardId.startsWith('DAILY_JOURNEY:'))allDeliveries.add(dailyToken(id,rewardId));
    }
    for(const [field,source] of [['legacyClaims',allClaims],['legacyDeliveries',allDeliveries]])if(!Array.isArray(p[field])||p[field].length>DAILY_PROTOCOL_LIMITS.legacyEntries||p[field].some(v=>typeof v!=='string'||!source.has(v))||new Set(p[field]).size!==p[field].length)fail('DAILY_PROVENANCE_MISMATCH');
    const receiptKeys=values.$keys.filter(k=>typeof k==='string'&&k.startsWith('daily-operation:'));if(receiptKeys.length>DAILY_PROTOCOL_LIMITS.operationSlots)fail('DAILY_RECEIPT_CAPACITY');
    const receipts=receiptKeys.map(key=>{const r=values[key];exactAuthorityJson(r,DAILY_PROTOCOL_LIMITS.entryBytes);if(dailyBytes(key,r)>DAILY_PROTOCOL_LIMITS.entryBytes||!dailyShape(r,['schema','kind','sequence','request','reducerVersion','at',r?.kind==='CLAIM_DAILY'?'claim':'delivery'])||r.schema!=='DAILY_OPERATION_V1'||!['CLAIM_DAILY','FULFILL_DAILY'].includes(r.kind)||r.reducerVersion!=='DAILY_RULES_V1'||!integer(r.sequence,DAILY_PROTOCOL_LIMITS.operationSlots)||r.sequence<1||key!==dailyKey(r.request?.opId))dailyFailure();dayAt(r.at);return r}).sort((a,b)=>a.sequence-b.sequence);
    const byId=new Map(),claims=new Map(),claimTokens=new Set(),fulfilled=new Map();
    for(let n=0;n<receipts.length;n++){
      const r=receipts[n],request=dailyRequest(r.request,r.kind,base),e=request.expected;
      if(r.sequence!==n+1||!equalData(request,r.request)||e.authorityEpoch!==base.authorityEpoch||e.dailyGeneration!==p.generation||e.catalogRevision!==base.catalogRevision||e.selectionEpoch>base.selectionEpoch||e.dailySequence!==n||!Object.hasOwn(life.players,request.playerId))dailyFailure();byId.set(request.opId,r);
      if(r.kind==='CLAIM_DAILY'){
        const c=r.claim,day=dayAt(r.at),rewardId='DAILY_JOURNEY:'+day,token=dailyToken(request.playerId,rewardId),event=allClaims.get(token),prior=e.records.find(v=>v.ref.domain==='PLAYER_LIFE').revision;
        if(!dailyShape(c,['day','rewardId','lifeBefore','lifeAfter','item'])||c.day!==day||c.rewardId!==rewardId||!integer(prior,Number.MAX_SAFE_INTEGER-1)||c.lifeBefore!==prior||c.lifeAfter!==prior+1||life.revision<c.lifeAfter||!equalData(c.item,dailyJourneyRewardItem(request.playerId,rewardId))||!event||event.at!==r.at||claimTokens.has(token)||p.legacyClaims.includes(token)||p.legacyDeliveries.includes(token))dailyFailure();
        claimTokens.add(token);claims.set(request.opId,r);
      }else{
        const claim=claims.get(request.claimRef),d=r.delivery,bag=bagFor(request.playerId),prior=e.records.find(v=>v.ref.domain==='BACKPACK'&&v.ref.playerId===request.playerId)?.revision;
        if(!claim||claim.request.playerId!==request.playerId||fulfilled.has(request.claimRef)||!dailyShape(d,['rewardId','bagBefore','bagAfter','destinationItemId','quantityBefore','quantityAfter'])||d.rewardId!==claim.claim.rewardId||!integer(prior,Number.MAX_SAFE_INTEGER-1)||d.bagBefore!==prior||d.bagAfter!==prior+1||!bag?.value||bag.revision<d.bagAfter||!text(d.destinationItemId,256)||!d.destinationItemId||!integer(d.quantityBefore,999999)||d.quantityAfter!==d.quantityBefore+1||!bag.value.rewardReceipts.includes(d.rewardId)||p.legacyDeliveries.includes(dailyToken(request.playerId,d.rewardId)))dailyFailure();
        if(bag.revision===d.bagAfter){
          const target=bag.value.items.find(item=>item.itemId===d.destinationItemId),recipe=gameRegistry.normalizeItem(claim.claim.item);
          if(!target||target.qty!==d.quantityAfter||bag.value.updatedAt!==r.at||['kind','name','species','stackable'].some(field=>target[field]!==recipe[field])||(d.quantityBefore===0&&!equalData(target,recipe)))fail('DAILY_CURRENT_PROJECTION_MISMATCH');
        }
        fulfilled.set(request.claimRef,r);
      }
    }
    const expectedClaims=new Set([...p.legacyClaims,...claimTokens]),expectedDeliveries=new Set([...p.legacyDeliveries,...[...fulfilled.values()].map(r=>dailyToken(r.request.playerId,r.delivery.rewardId))]);
    if(allClaims.size!==expectedClaims.size||[...allClaims.keys()].some(k=>!expectedClaims.has(k))||allDeliveries.size!==expectedDeliveries.size||[...allDeliveries].some(k=>!expectedDeliveries.has(k)))fail('DAILY_PROVENANCE_MISMATCH');
    const pending=[...claims.values()].filter(r=>!fulfilled.has(r.request.opId)),head=dailyAccounting(receipts,pending.length,p.generation);
    exactAuthorityJson(values.$daily,2048);if(!dailyShape(values.$daily,Object.keys(head))||Object.keys(head).some(k=>values.$daily[k]!==head[k]))dailyFailure();
    return {base,protocol:p,receipts,byId,claims,fulfilled,head,snapshot:{...base,daily:{generation:p.generation,sequence:head.sequence,acceptedCount:head.acceptedCount,acceptedBytes:head.acceptedBytes,reservedSlots:head.reservedSlots,reservedBytes:head.reservedBytes,pending:pending.map(r=>({claimRef:r.request.opId,playerId:r.request.playerId,rewardId:r.claim.rewardId,item:clone(r.claim.item)})),receipts:clone(receipts)}}};
  }
  function dailyTransaction(mode,work){
    requireOpen();if(!gameRegistry)fail('GAME_VALIDATORS_NOT_READY');
    return transaction(mode,['$authority','$initialized','$keys'],work,values=>{
      const refs=[...fullCatalog(values,'daily').keys()],ops=values.$keys.filter(k=>typeof k==='string'&&k.startsWith('daily-operation:'));
      if(ops.length>DAILY_PROTOCOL_LIMITS.operationSlots)fail('DAILY_RECEIPT_CAPACITY');return [...refs,'$daily','archive:'+values.$authority.authorityEpoch,...ops];
    });
  }
  function readDaily(){return dailyTransaction('readonly',values=>dailyState(values).snapshot)}
  function dailyCommand(kind,input){
    if(reducing)fail('REENTRANT_COMMAND');exactAuthorityJson(input,32768);input=clone(input);
    return dailyTransaction('readwrite',(values,store)=>{
      const state=dailyState(values),request=dailyRequest(input,kind,state.base),e=request.expected,b=state.base;
      if(request.playerId!==b.activePlayerId)fail('PLAYER_NOT_ACTIVE');
      if(e.authorityEpoch!==b.authorityEpoch||e.dailyGeneration!==state.protocol.generation||e.selectionEpoch!==b.selectionEpoch||e.catalogRevision!==b.catalogRevision)fail('REVISION_CONFLICT_RELOAD_REQUIRED');
      const prior=state.byId.get(request.opId);if(prior){if(prior.kind!==kind||!equalData(prior.request,request))fail('OPERATION_ID_CONFLICT');return {ok:true,replayed:true,receipt:prior}}
      if(e.dailySequence!==state.head.sequence||e.records.some(r=>b.records.find(v=>referenceKey(v.ref)===referenceKey(r.ref)).revision!==r.revision))fail('REVISION_CONFLICT_RELOAD_REQUIRED');
      const next={...values},life=values.PLAYER_LIFE,player=life.players[request.playerId],bagKey='BACKPACK:'+request.playerId;let affected,key;
      if(typeof now!=='function')fail('CLOCK_UNAVAILABLE');const at=now();dayAt(at);
      const receipt={schema:'DAILY_OPERATION_V1',kind,sequence:state.head.sequence+1,request,reducerVersion:'DAILY_RULES_V1',at};
      if(kind==='CLAIM_DAILY'){
        const d=dailyFor(player.events,at),token=dailyToken(request.playerId,d.rewardId);
        if(state.protocol.legacyClaims.includes(token)||state.protocol.legacyDeliveries.includes(token))fail('LEGACY_DAILY_REVIEW_REQUIRED');
        if(d.claimed)fail('DAILY_ALREADY_CLAIMED');if(!d.ready)fail('DAILY_NOT_COMPLETE');if(life.revision>=Number.MAX_SAFE_INTEGER)fail('REVISION_CAPACITY');
        const envelope=clone(life),p=envelope.players[request.playerId];p.events.push({id:d.rewardId,type:'DAILY_JOURNEY',at});Object.assign(p,projectEvents(p.events,p.legacyProgress));p.achievements=p.events.some(isKill)?['FIRST_MONSTER']:[];p.lastSeenAt=Math.max(p.lastSeenAt,at);envelope.revision++;
        receipt.claim={day:d.day,rewardId:d.rewardId,lifeBefore:life.revision,lifeAfter:envelope.revision,item:dailyJourneyRewardItem(request.playerId,d.rewardId)};affected=envelope;key='PLAYER_LIFE';
      }else{
        const claim=state.claims.get(request.claimRef);if(!claim||claim.request.playerId!==request.playerId)fail('DAILY_CLAIM_NOT_OWNED');if(state.fulfilled.has(request.claimRef))fail('DAILY_ALREADY_FULFILLED');
        const row=values[bagKey];if(!row)fail('DOMAIN_RECORD_ABSENT');if(row.revision>=Number.MAX_SAFE_INTEGER)fail('REVISION_CAPACITY');
        const draft=clone(row.data),result=gameRegistry.storeItem(draft,claim.claim.item,{at});
        if(!result.ok)return {ok:false,reason:result.reason,pending:true};
        const before=row.data.items.find(item=>item.itemId===result.item.itemId)?.qty||0;if(result.item.qty!==before+1)fail('DAILY_QUANTITY_MISMATCH');
        receipt.delivery={rewardId:claim.claim.rewardId,bagBefore:row.revision,bagAfter:row.revision+1,destinationItemId:result.item.itemId,quantityBefore:before,quantityAfter:result.item.qty};affected={revision:row.revision+1,data:draft};key=bagKey;
      }
      const entryKey=dailyKey(request.opId);exactAuthorityJson(receipt,DAILY_PROTOCOL_LIMITS.entryBytes);if(dailyBytes(entryKey,receipt)>DAILY_PROTOCOL_LIMITS.entryBytes)fail('DAILY_RECEIPT_CAPACITY');
      const pending=state.head.pendingCount+(kind==='CLAIM_DAILY'?1:-1),head=dailyAccounting([...state.receipts,receipt],pending,state.protocol.generation);
      next[key]=affected;next[entryKey]=receipt;next.$daily=head;next.$keys=[...values.$keys,entryKey];dailyState(next);
      store.put(affected,key);store.add(receipt,entryKey);store.put(head,'$daily');return {ok:true,replayed:false,receipt};
    });
  }
  function claimDaily(input){return dailyCommand('CLAIM_DAILY',input)}
  function fulfillDaily(input){return dailyCommand('FULFILL_DAILY',input)}

  const captureFixed=[PLAYER_LIFE_STORAGE_KEY,'K11520_PLAYER_COURIER','k11520.player-life.legacy-owner','11520.backpack.v1','k11520.local-product.v1:guest','k11520.player-session.v1','k11520.journey.tutorial','11520.playerCourier.pendingInsurancePayment','11520.playerCourier.lastMission'];
  const captureSuffixes=['11520.backpack.v1','k11520.local-product.v1:guest','k11520.player-session.v1','k11520.journey.tutorial'];
  function captureRule(key){
    if(typeof key!=='string')return null;
    if(captureFixed.includes(key))return {capture:true,scope:'GLOBAL'};
    if(key==='k11520.market-life.training')return {capture:false,reason:'UNSUPPORTED_TRAINING_COMPANION'};
    if(/^k11520\.local-product\.v1:0x[0-9a-f]{40}$/.test(key))return {capture:true,scope:'GLOBAL'};
    const match=/^k11520\.player:(KAIOS-P-[0-9a-f]{32}):(.+)$/.exec(key);
    if(match){const [,playerId,suffix]=match;if(suffix==='k11520.market-life.training')return {capture:false,reason:'UNSUPPORTED_TRAINING_COMPANION',playerId};if(captureSuffixes.includes(suffix)||/^k11520\.local-product\.v1:0x[0-9a-f]{40}$/.test(suffix))return {capture:true,scope:'SCOPED',playerId,suffix};return {capture:false,reason:'UNKNOWN_SCOPED_SOURCE',playerId}}
    if(key.startsWith('k11520.player:')||key.startsWith('k11520.local-product.v1:'))return {capture:false,reason:'UNKNOWN_SCOPED_SOURCE'};
    return null;
  }
  function captureExpectedKeys(names,owners){
    const keys=new Set(captureFixed);for(const id of owners)for(const suffix of captureSuffixes)keys.add('k11520.player:'+id+':'+suffix);
    for(const key of names){const rule=captureRule(key);if(rule?.capture&&(rule.scope==='GLOBAL'||owners.includes(rule.playerId)))keys.add(key)}return [...keys].sort();
  }
  function captureEmpty(values){
    if(values.$keys.some(key=>typeof key!=='string'||!/^candidate:[a-f0-9]{32}$/.test(key)))fail('AUTHORITY_OR_UNKNOWN_RECORDS_HOLD');
    if(values.$keys.length>=GAME_CAPTURE_LIMITS.candidates)fail('CAPTURE_ARCHIVE_CAPACITY_HOLD');
    return null;
  }
  const captureBytes=value=>new TextEncoder().encode(JSON.stringify(value)).byteLength;
  function captureStorage(input){
    if(!object(input)||![Object.prototype,null].includes(Object.getPrototypeOf(input)))fail('INVALID_CAPTURE_INPUT');
    const descriptors=Object.getOwnPropertyDescriptors(input),d=descriptors.sourceStorage;if(Reflect.ownKeys(descriptors).length!==1||!d?.enumerable||!Object.hasOwn(d,'value')||!d.value)fail('INVALID_CAPTURE_INPUT');
    const storage=d.value,method=name=>{let cursor=storage;for(let n=0;cursor&&n<8;n++,cursor=Object.getPrototypeOf(cursor)){const found=Object.getOwnPropertyDescriptor(cursor,name);if(found){if(!Object.hasOwn(found,'value')||typeof found.value!=='function')fail('INVALID_CAPTURE_STORAGE');return found.value.bind(storage)}}fail('INVALID_CAPTURE_STORAGE')};
    return {getItem:method('getItem'),key:method('key'),length:()=>storage.length};
  }
  function capturePass(source,budget){
    let length;try{length=source.length()}catch{fail('CAPTURE_READ_UNAVAILABLE_HOLD')}
    if(!Number.isSafeInteger(length)||length<0||length>GAME_CAPTURE_LIMITS.enumeratedNames)fail('CAPTURE_ENUMERATION_CAPACITY_HOLD');
    const all=new Set(),names=[];
    for(let n=0;n<length;n++){let key;try{key=source.key(n)}catch{fail('CAPTURE_READ_UNAVAILABLE_HOLD')}if(typeof key!=='string'||all.has(key))fail('CAPTURE_CENSUS_UNSTABLE_HOLD');all.add(key);if(captureRule(key)){if(key.length>256)fail('CAPTURE_SOURCE_CAPACITY_HOLD');names.push(key)}}
    let endLength;try{endLength=source.length()}catch{fail('CAPTURE_READ_UNAVAILABLE_HOLD')}if(endLength!==length)fail('CAPTURE_CENSUS_UNSTABLE_HOLD');names.sort();if(names.length>GAME_CAPTURE_LIMITS.relevantEntries)fail('CAPTURE_SOURCE_CAPACITY_HOLD');
    const values=new Map(),read=key=>{if(values.has(key))return values.get(key);let raw;try{raw=source.getItem(key)}catch{fail('CAPTURE_READ_UNAVAILABLE_HOLD')}if(raw!==null&&typeof raw!=='string')fail('CAPTURE_READ_UNAVAILABLE_HOLD');if(raw!==null){budget.units+=raw.length;if(raw.length>GAME_CAPTURE_LIMITS.sourceCodeUnits||budget.units>GAME_CAPTURE_LIMITS.capturedCodeUnits)fail('CAPTURE_SOURCE_CAPACITY_HOLD')}values.set(key,raw);return raw};
    const lifeRaw=read(PLAYER_LIFE_STORAGE_KEY);let owners=[];try{const life=JSON.parse(lifeRaw);authorityEnvelope(life);owners=Object.keys(life.players)}catch{}
    const wanted=captureExpectedKeys(names,owners);if(wanted.length>GAME_CAPTURE_LIMITS.relevantEntries)fail('CAPTURE_SOURCE_CAPACITY_HOLD');
    const sources=wanted.map(key=>{const raw=read(key);return {key,present:raw!==null,raw}});
    return {names,sources};
  }
  const captureHash=entry=>hash(JSON.stringify({present:entry.present,raw:entry.raw}));
  function interpretCapture(sources,observed,censuses){
    const byKey=new Map(sources.map(e=>[e.key,e])),holds=[],add=(code,sourceKey=null)=>{if(!holds.some(h=>h.code===code&&h.sourceKey===sourceKey))holds.push({code,sourceKey})};
    if(!censuses.sourceStringsEqual||!equalData(censuses.before,censuses.after)||!equalData(sources.map(e=>[e.key,e.present,e.sha256]),observed.map(e=>[e.key,e.present,e.sha256])))add('SOURCE_DIVERGED_HOLD');
    for(const [entries,names] of [[sources,censuses.before],[observed,censuses.after]])for(const entry of entries)if(entry.present!==names.includes(entry.key))add('SOURCE_DIVERGED_HOLD',entry.key);
    for(const key of new Set([...censuses.before,...censuses.after])){const rule=captureRule(key);if(rule&&!rule.capture)add(rule.reason,key);const entry=byKey.get(key);if(rule?.capture&&entry&&!entry.present)add('SOURCE_DIVERGED_HOLD',key)}
    const parse=(key,required=false)=>{const e=byKey.get(key);if(!e?.present){if(required)add('INCOMPLETE_SOURCE',key);return null}try{return JSON.parse(e.raw)}catch{add('INVALID_SOURCE',key);return null}};
    let life=parse(PLAYER_LIFE_STORAGE_KEY,true),courier=parse('K11520_PLAYER_COURIER',true),owners=[];try{authorityEnvelope(life);owners=Object.keys(life.players).sort()}catch{if(byKey.get(PLAYER_LIFE_STORAGE_KEY)?.present)add('INVALID_SOURCE',PLAYER_LIFE_STORAGE_KEY);life=null}
    for(const key of new Set([...censuses.before,...censuses.after])){const rule=captureRule(key);if(rule?.playerId&&!owners.includes(rule.playerId))add('ORPHAN_SCOPED_SOURCE',key)}
    try{if(courier!==null)gameRegistry.courier(courier,{playerIds:owners});else if(byKey.get('K11520_PLAYER_COURIER')?.present)add('INVALID_SOURCE','K11520_PLAYER_COURIER')}catch{add('INVALID_SOURCE','K11520_PLAYER_COURIER');courier=null}
    for(const e of sources){const rule=captureRule(e.key);if(rule?.scope==='SCOPED'&&!owners.includes(rule.playerId))add('ORPHAN_SCOPED_SOURCE',e.key);if(e.present&&(e.key==='11520.backpack.v1'||e.key.startsWith('k11520.local-product.v1:')||e.key==='k11520.player-session.v1'||e.key==='k11520.journey.tutorial'))add('AMBIGUOUS_LEGACY_SOURCE',e.key)}
    const claim=byKey.get('k11520.player-life.legacy-owner');if(claim?.present&&!owners.includes(claim.raw))add('LEGACY_OWNER_AMBIGUITY','k11520.player-life.legacy-owner');
    if(byKey.get('11520.playerCourier.pendingInsurancePayment')?.present)add('PENDING_INSURANCE_RECONCILIATION_HOLD','11520.playerCourier.pendingInsurancePayment');
    const hint=byKey.get('11520.playerCourier.lastMission');if(hint?.present&&(!courier||!Object.hasOwn(courier.missions,hint.raw)))add('UNRESOLVED_MISSION_HINT','11520.playerCourier.lastMission');
    const records=[],catalog=[],legacyUnbound=[],addRecord=(ref,value,sourceKey)=>{catalog.push({ref,presence:value===null?(byKey.get(sourceKey)?.present?'INVALID':'ABSENT'):'PRESENT'});records.push({ref,sourceKey,value})};
    if(life){addRecord({domain:'PLAYER_LIFE'},life,PLAYER_LIFE_STORAGE_KEY);addRecord({domain:'COURIER'},courier,'K11520_PLAYER_COURIER')}
    for(const playerId of owners){
      const prefix='k11520.player:'+playerId+':',bagKey=prefix+'11520.backpack.v1';let bag=parse(bagKey,true);
      try{if(bag?.ownerId==='PLAYER-11520')add('AMBIGUOUS_LEGACY_BAG_OWNER',bagKey);if(bag!==null)gameRegistry.bag(bag,{ownerId:playerId});else if(byKey.get(bagKey)?.present)add('INVALID_SOURCE',bagKey)}catch{add('INVALID_SOURCE',bagKey);bag=null}addRecord({domain:'BACKPACK',playerId},bag,bagKey);
      const productKeys=new Set([prefix+'k11520.local-product.v1:guest',...sources.filter(e=>{const r=captureRule(e.key);return r?.playerId===playerId&&r.suffix?.startsWith('k11520.local-product.v1:')}).map(e=>e.key)]);
      for(const key of [...productKeys].sort()){
        const owner=key.slice((prefix+'k11520.local-product.v1:').length);let product=parse(key,true);
        try{
          if(product?.schema==='K11520_LOCAL_SIMULATION_V1'){
            if(product.owner!==owner||(product.playerId!==undefined&&product.playerId!==playerId)||!object(product.ledger)||!object(product.progress))fail('INVALID_SOURCE');
            product=clone(product);product.schema='K11520_LOCAL_SIMULATION_V2';product.playerId=playerId;
            for(const [field,fallback] of Object.entries({courierReceipts:[],courierInsuranceReceipts:{},courierReceiptBindings:{},courierInsuranceBindings:{}}))if(product.progress[field]===undefined)product.progress[field]=fallback;
          }
          if(product!==null)gameRegistry.product(product,{playerId,owner});else if(byKey.get(key)?.present)add('INVALID_SOURCE',key);
        }catch{add('INVALID_SOURCE',key);product=null}addRecord({domain:'PRODUCT',playerId,owner},product,key);
      }
      const sessionKey=prefix+'k11520.player-session.v1',tutorialKey=prefix+'k11520.journey.tutorial',session=parse(sessionKey),tutorial=parse(tutorialKey),p=life.players[playerId];
      if(byKey.get(sessionKey)?.present&&(!object(session)||session.version!==1||session.world!=='K11520'||!object(session.xyz)||!object(session.intentXYZ)||![session.xyz,session.intentXYZ].every(v=>['x','y','z'].every(k=>typeof v[k]==='number'&&Number.isFinite(v[k])&&Math.abs(v[k])<=1e9))||!equalData(session.xyz,p.lastXYZ)))add('SESSION_RECONCILIATION_HOLD',sessionKey);
      if(byKey.get(tutorialKey)?.present&&(!object(tutorial)||!['MOVE','HIT','LOOT','PHASE','PREVIEW','DONE'].includes(tutorial.stage)||tutorial.stage!==p.journeyProgress?.tutorialStage))add('TUTORIAL_RECONCILIATION_HOLD',tutorialKey);
    }
    for(const record of records){const p=record.value?.progress;if(record.ref.domain==='PRODUCT'&&p)for(const insurance of [false,true])for(const id of insurance?Object.keys(p.courierInsuranceReceipts):p.courierReceipts)if(!p[insurance?'courierInsuranceBindings':'courierReceiptBindings'][id])legacyUnbound.push(legacyToken(record.ref,insurance?'PLAYER_COURIER_INSURANCE_PAYOUT':'PLAYER_COURIER_REWARD',id))}
    for(const m of Object.values(courier?.missions||{})){if(m.status==='DELIVERED'&&!m.settlement.credit)legacyUnbound.push(legacyToken({domain:'COURIER'},'PLAYER_COURIER_REWARD',m.settlement.receiptId,m.missionId));if(m.insurance.claimStatus==='PAID'&&!m.insurance.credit)legacyUnbound.push(legacyToken({domain:'COURIER'},'PLAYER_COURIER_INSURANCE_PAYOUT',m.insurance.payoutReceiptId,m.missionId))}legacyUnbound.sort();
    // Generic item IDs (including daily rewards) are Life-scoped. Only the
    // explicit living identity can signal unresolved cross-Life custody here.
    const livingOwners=new Map();for(const r of records)if(r.ref.domain==='BACKPACK'&&r.value)for(const item of r.value.items)if(item.lifeId!==null){if(livingOwners.has(item.lifeId)&&livingOwners.get(item.lifeId)!==r.ref.playerId)add('CUSTODY_IDENTITY_CONFLICT',r.sourceKey);livingOwners.set(item.lifeId,r.ref.playerId)}
    if(life){
      const meta={schema:FULL_AUTHORITY_SCHEMA,integration:AUTHORITY_INTEGRATION,coverage:FULL_AUTHORITY_DOMAINS,authorityEpoch:'0'.repeat(32),selectionEpoch:0,activePlayerId:life.activePlayerId,catalogRevision:0,catalog,legacyUnbound};
      const values={$authority:meta,$initialized:{authorityEpoch:meta.authorityEpoch,coverage:FULL_AUTHORITY_DOMAINS,catalogRevision:0},$keys:['$authority','$initialized','archive:'+meta.authorityEpoch]};for(const r of records)if(r.value!==null){const key=referenceKey(r.ref);values[key]=r.ref.domain==='BACKPACK'?{revision:0,data:r.value}:r.value;values.$keys.push(key)}
      try{fullState(values)}catch{add('CROSS_DOMAIN_REVIEW_HOLD')}
    }
    holds.sort((a,b)=>{const x=a.code+'|'+a.sourceKey,y=b.code+'|'+b.sourceKey;return x<y?-1:x>y?1:0});
    return {status:holds.length?'HOLD':'REVIEWABLE_CAPTURE',holds,owners,coverage:FULL_AUTHORITY_DOMAINS,legacyUnbound,proposal:life?{catalog,records}:null};
  }
  async function prepareGameMigration(input={}){
    requireOpen();if(!gameRegistry)fail('GAME_VALIDATORS_NOT_READY');const source=captureStorage(input),admitted=generation,check=()=>{if(admitted!==generation||!db||!gameRegistry)fail('AUTHORITY_CLOSED')};
    await transaction('readonly',['$keys'],captureEmpty);check();const budget={units:0},before=capturePass(source,budget);
    const sources=await Promise.all(before.sources.map(async e=>({...e,sha256:await captureHash(e)})));check();const after=capturePass(source,budget),observed=await Promise.all(after.sources.map(async e=>({key:e.key,present:e.present,sha256:await captureHash(e)})));check();
    const censuses={before:before.names,after:after.names,sourceStringsEqual:equalData(before.sources,after.sources)},analysis=interpretCapture(sources,observed,censuses),body={schema:GAME_CAPTURE_SCHEMA,id:token(),integration:'REVIEW_ONLY',hashEncoding:SOURCE_HASH_ENCODING,policy:GAME_CAPTURE_POLICY,limits:GAME_CAPTURE_LIMITS,sources,observed,censuses,...analysis};
    if(captureBytes(body)>GAME_CAPTURE_LIMITS.candidateBytes)fail('CAPTURE_CANDIDATE_CAPACITY_HOLD');exactAuthorityJson(body,GAME_CAPTURE_LIMITS.candidateBytes);const candidate={...body,manifestSha256:await hash(JSON.stringify(body))};check();const bytes=captureBytes(candidate);if(bytes>GAME_CAPTURE_LIMITS.candidateBytes)fail('CAPTURE_CANDIDATE_CAPACITY_HOLD');
    return transaction('readwrite',['$keys'],(values,store)=>{captureEmpty(values);let total=bytes;for(const key of values.$keys){exactAuthorityJson(values[key],GAME_CAPTURE_LIMITS.candidateBytes);total+=captureBytes(values[key])}if(total>GAME_CAPTURE_LIMITS.archiveBytes)fail('CAPTURE_ARCHIVE_CAPACITY_HOLD');store.add(candidate,'candidate:'+candidate.id);return candidate},values=>{captureEmpty(values);return values.$keys});
  }
  async function readGameCandidate(id){
    if(typeof id!=='string'||!/^[a-f0-9]{32}$/.test(id))fail('INVALID_GAME_CANDIDATE');requireOpen();if(!gameRegistry)fail('GAME_VALIDATORS_NOT_READY');const admitted=generation;
    const candidate=await transaction('readonly',['candidate:'+id],values=>{const value=values['candidate:'+id];if(value===undefined)fail('INVALID_GAME_CANDIDATE');exactAuthorityJson(value,GAME_CAPTURE_LIMITS.candidateBytes);return value});
    exactAuthorityJson(candidate,GAME_CAPTURE_LIMITS.candidateBytes);
    if(!keys(candidate,['schema','id','integration','hashEncoding','policy','limits','sources','observed','censuses','status','holds','owners','coverage','legacyUnbound','proposal','manifestSha256'])||Object.keys(candidate).length!==16||candidate.schema!==GAME_CAPTURE_SCHEMA||candidate.id!==id||candidate.integration!=='REVIEW_ONLY'||!equalData(candidate.limits,GAME_CAPTURE_LIMITS)||captureBytes(candidate)>GAME_CAPTURE_LIMITS.candidateBytes)fail('INVALID_GAME_CANDIDATE');
    if(candidate.hashEncoding!==SOURCE_HASH_ENCODING)fail('UNSUPPORTED_MIGRATION_HASH_ENCODING_HOLD');
    if(candidate.policy!==GAME_CAPTURE_POLICY)fail('UNSUPPORTED_CAPTURE_POLICY_HOLD');
    if(!Array.isArray(candidate.sources)||candidate.sources.length>GAME_CAPTURE_LIMITS.relevantEntries||!Array.isArray(candidate.observed)||candidate.observed.length>GAME_CAPTURE_LIMITS.relevantEntries||!keys(candidate.censuses,['before','after','sourceStringsEqual'])||Object.keys(candidate.censuses).length!==3||typeof candidate.censuses.sourceStringsEqual!=='boolean')fail('INVALID_GAME_CANDIDATE');
    const ordered=entries=>{let prior='';for(const entry of entries){if(typeof entry.key!=='string'||entry.key<=prior||!captureRule(entry.key)?.capture||typeof entry.present!=='boolean'||typeof entry.sha256!=='string'||!/^[a-f0-9]{64}$/.test(entry.sha256))fail('INVALID_GAME_CANDIDATE');prior=entry.key}};ordered(candidate.sources);ordered(candidate.observed);
    if(captureFixed.some(key=>!candidate.sources.some(e=>e.key===key)||!candidate.observed.some(e=>e.key===key)))fail('INVALID_GAME_CANDIDATE');
    let units=0;for(const entry of candidate.sources){if(!keys(entry,['key','present','raw','sha256'])||Object.keys(entry).length!==4||(entry.present?typeof entry.raw!=='string':entry.raw!==null))fail('INVALID_GAME_CANDIDATE');units+=entry.raw?.length||0;if((entry.raw?.length||0)>GAME_CAPTURE_LIMITS.sourceCodeUnits||units>GAME_CAPTURE_LIMITS.capturedCodeUnits||await captureHash(entry)!==entry.sha256)fail('GAME_CANDIDATE_CONTENT_MISMATCH')}
    for(const entry of candidate.observed)if(!keys(entry,['key','present','sha256'])||Object.keys(entry).length!==3)fail('INVALID_GAME_CANDIDATE');
    for(const names of [candidate.censuses.before,candidate.censuses.after])if(!Array.isArray(names)||names.length>GAME_CAPTURE_LIMITS.relevantEntries||names.some((key,n)=>typeof key!=='string'||key.length>256||!captureRule(key)||(n&&key<=names[n-1])))fail('INVALID_GAME_CANDIDATE');
    const lifeSource=candidate.sources.find(e=>e.key===PLAYER_LIFE_STORAGE_KEY),lifeObserved=candidate.observed.find(e=>e.key===PLAYER_LIFE_STORAGE_KEY);let owners=[];try{const life=JSON.parse(lifeSource.raw);authorityEnvelope(life);owners=Object.keys(life.players)}catch{}
    if(!equalData(captureExpectedKeys(candidate.censuses.before,owners),candidate.sources.map(e=>e.key)))fail('INVALID_GAME_CANDIDATE');
    if(lifeSource.present===lifeObserved.present&&lifeSource.sha256===lifeObserved.sha256&&!equalData(captureExpectedKeys(candidate.censuses.after,owners),candidate.observed.map(e=>e.key)))fail('INVALID_GAME_CANDIDATE');
    const {manifestSha256,...body}=candidate;if(typeof manifestSha256!=='string'||await hash(JSON.stringify(body))!==manifestSha256)fail('GAME_CANDIDATE_CONTENT_MISMATCH');
    const analysis=interpretCapture(candidate.sources,candidate.observed,candidate.censuses);for(const key of Object.keys(analysis))if(!equalData(analysis[key],candidate[key]))fail('GAME_CANDIDATE_INTERPRETATION_MISMATCH');
    if(admitted!==generation||!db||!gameRegistry)fail('AUTHORITY_CLOSED');return clone(candidate);
  }

  return Object.freeze({open,openGame,close,read,readGame,readDaily,claimDaily,fulfillDaily,initialize,command,commandGame,prepareMigration,readCandidate,commitMigration,prepareGameMigration,readGameCandidate,restore(){fail('RESTORE_NOT_IMPLEMENTED')}});
}
