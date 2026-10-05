import {normalizeSignedC,signedPositionSide,requiredMargin,createKgenLedger} from './kgen-margin-runtime.mjs';
import {requireV1TradingC} from '../controls/nonlinear-controls.mjs';
const ERC20_BALANCE_OF='0x70a08231';
export const PUBLIC_WALLET_IDENTITY_KEY='klineodyssey.public-wallet-identity.v1';
export const PLAYER_SESSION_KEY='k11520.player-session.v1';
export const KGEN_TOKEN_ADDRESS='0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be';
export const KGEN_CHAIN_ID=56;
const EVM_ADDRESS=/^0x[0-9a-fA-F]{40}$/;
export const LOCAL_PRODUCT_EVENTS=Object.freeze(['UNIQUE_PLAYER','SESSION','MONSTER_KILL','LOOT_DROP','COURIER_SETTLEMENT','COURIER_INSURANCE_PAYOUT','KAIOS_SPEND','TRADE_OPEN','TRADE_FILL','TRADE_CLOSE','LIQUIDATION','RETURNING_PLAYER','ERROR']);
// A namespace is isolation against application mix-ups, NOT authentication of
// another person sharing this browser. Player IDs never authorize chain assets.
export function createPlayerScopedStorage(storage,playerId,{claimLegacy=true}={}){
  if(storage===undefined){try{storage=globalThis.localStorage}catch{storage=null}}
  if(!/^KAIOS-P-[a-zA-Z0-9-]{16,80}$/.test(playerId||''))throw new Error('INVALID_PLAYER_ID');
  const prefix='k11520.player:'+playerId+':',claimKey='k11520.player-life.legacy-owner';
  const allowed=new Set([PLAYER_SESSION_KEY,'k11520.journey.tutorial','11520.backpack.v1']);
  // Claim precedes copying. A failed storage write must never silently claim
  // the same old save for every newly-created guest. Originals remain intact.
  let legacyOwner=null;
  try{legacyOwner=storage?.getItem(claimKey);if(claimLegacy&&!legacyOwner&&storage){storage.setItem(claimKey,playerId);legacyOwner=storage.getItem(claimKey)}}catch{}
  return Object.freeze({
    getItem(key){
      const saved=storage?.getItem(prefix+key);if(saved!=null)return saved;
      if(legacyOwner===playerId&&allowed.has(key)){const old=storage?.getItem(key);if(old!=null){storage.setItem(prefix+key,old);return old}}
      return null;
    },
    setItem(key,value){if(!storage)throw new Error('STORAGE_UNAVAILABLE');storage.setItem(prefix+key,value)},
    removeItem(key){storage?.removeItem(prefix+key)}
  });
}
// Cooperative, origin-wide single-writer lease for the TWO existing local-game
// envelopes. It is not authentication, a localStorage CAS, or an old-client lock.
export const LOCAL_GAME_WRITE_LOCK='k11520.local-game-writer';
const localGameCoordinators=new WeakMap();
export function acquireLocalGameWriter({storage,locks=globalThis.navigator?.locks,coordinationScope=globalThis}={}){
  let entries=localGameCoordinators.get(coordinationScope);
  if(!entries){entries=new WeakMap();localGameCoordinators.set(coordinationScope,entries)}
  const identity=storage&&typeof storage==='object'?storage:coordinationScope;
  let c=entries.get(identity);
  if(!c){
    c={refs:0,status:storage?'LOCK_PENDING':'STORAGE_UNAVAILABLE',generation:0,busy:false,release:null,ready:Promise.resolve(),locks};
    entries.set(identity,c);
    c.stop=reason=>{c.generation++;c.status=reason;c.ready=Promise.resolve(reason);c.requesting=false;const release=c.release;c.release=null;release?.()};
    c.request=()=>{
      if(c.status==='WRITER')return Promise.resolve(c.status);
      if(c.status==='LOCK_PENDING'&&c.requesting)return c.ready;
      if(!storage)return Promise.resolve(c.status='STORAGE_UNAVAILABLE');
      if(typeof locks?.request!=='function')return Promise.resolve(c.status='LOCKS_UNAVAILABLE');
      const generation=++c.generation;c.status='LOCK_PENDING';c.requesting=true;
      let finish;c.ready=new Promise(resolve=>finish=resolve);
      try{Promise.resolve(locks.request(LOCAL_GAME_WRITE_LOCK,{mode:'exclusive',ifAvailable:true},lock=>{
        if(generation!==c.generation||!c.refs){finish(c.status);return}
        c.requesting=false;
        if(!lock){c.status='FOLLOWER';finish(c.status);return}
        c.status='WRITER';finish(c.status);
        return new Promise(resolve=>{c.release=resolve});
      })).catch(()=>{if(generation===c.generation){c.requesting=false;c.status='LOCK_FAILED'}finish(c.status)})}
      catch{c.requesting=false;c.status='LOCK_FAILED';finish(c.status)}
      return c.ready;
    };
    // BFCache restore never silently reacquires a lease. A fresh explicit
    // requestWriter plus store refresh is required before another mutation.
    coordinationScope.addEventListener?.('pagehide',()=>c.stop('PAGE_HIDDEN'));
  }
  c.refs++;let disposed=false;
  const assert=()=>{if(disposed)throw new Error('LOCAL_GAME_STORE_DISPOSED');if(c.status!=='WRITER'||!c.release)throw new Error('LOCAL_GAME_'+c.status)};
  if(c.refs===1&&!c.release)void c.request();
  return Object.freeze({
    get ready(){return c.ready},
    capability:()=>({status:disposed?'DISPOSED':c.status,writeEnabled:!disposed&&c.status==='WRITER'&&!!c.release,scope:'ORIGIN_WIDE_PRODUCT_AND_COURIER',cooperativeOnly:true}),
    requestWriter:()=>disposed?Promise.resolve('DISPOSED'):c.request(),assert,
    assertIdle(){if(disposed)throw new Error('LOCAL_GAME_STORE_DISPOSED');if(c.busy)throw new Error('LOCAL_GAME_REENTRANT_WRITE')},
    run(fn){assert();if(c.busy)throw new Error('LOCAL_GAME_REENTRANT_WRITE');c.busy=true;try{return fn()}finally{c.busy=false}},
    dispose(){if(disposed)return;disposed=true;if(--c.refs===0)c.stop('RELEASED')}
  });
}
const PRODUCT_SCHEMA='K11520_LOCAL_SIMULATION_V2';
const PRODUCT_MAX_RECEIPTS=1000;
const productClone=value=>structuredClone(value);
const productOwner=value=>value==='guest'||EVM_ADDRESS.test(value||'');
const productReceipt=/^COURIER-RECEIPT-[0-9a-f]{8}$/i;
const insuranceReceipt=/^COURIER-INSURANCE-[0-9a-f]{8}$/i;
const productProgress=()=>({kaios:0,claimableKaios:0,spentKaios:0,loot:0,xp:0,engineXp:0,events:{},playedMs:0,courierReceipts:[],courierInsuranceReceipts:{},courierReceiptBindings:{},courierInsuranceBindings:{}});
// Local, unauthenticated simulation progress only. No chain/provider operations.
export function createSimulationPlayerStore({ledger,storage,playerId=null,locks,coordinationScope}={}){
  if(storage===undefined){try{storage=globalThis.localStorage}catch{storage=null}}
  const underlying=storage,writer=acquireLocalGameWriter({storage:underlying,locks,coordinationScope});
  try{if(playerId)storage=createPlayerScopedStorage(storage,playerId,{claimLegacy:false})}catch(error){writer.dispose();throw error}
  let owner=null,key=null,raw=null,value=null,progress=productProgress(),storageStatus='READY',disposed=false;
  const replaceLedger=next=>{for(const k of Object.keys(ledger))delete ledger[k];Object.assign(ledger,productClone(next))};
  const fresh=()=>({schema:PRODUCT_SCHEMA,owner,playerId,revision:0,ledger:{...createKgenLedger(100),owner},progress:productProgress()});
  function validate(saved){
    const encoded=JSON.stringify(saved),p=saved?.progress;
    if(!saved||!['K11520_LOCAL_SIMULATION_V1',PRODUCT_SCHEMA].includes(saved.schema)||saved.owner!==owner||!productOwner(owner)||!Number.isSafeInteger(saved.revision)||saved.revision<0||encoded.length>2_000_000||/[<>&]/.test(encoded)||!p||typeof p!=='object'||Array.isArray(p)||!['total','free','lockedMargin','reservedOrders','realizedPnl','unrealizedPnl'].every(k=>Number.isFinite(saved.ledger?.[k])))throw new Error('CORRUPT_SAVE');
    if(saved.schema===PRODUCT_SCHEMA&&saved.playerId!==playerId)throw new Error('PRODUCT_NAMESPACE_MISMATCH');
    for(const k of ['kaios','claimableKaios','spentKaios','loot','xp','engineXp','playedMs'])if(p[k]!==undefined&&(!Number.isFinite(p[k])||p[k]<0||p[k]>Number.MAX_SAFE_INTEGER))throw new Error('CORRUPT_SAVE');
    const receipts=p.courierReceipts===undefined?[]:p.courierReceipts,insurance=p.courierInsuranceReceipts===undefined?{}:p.courierInsuranceReceipts;
    if(!Array.isArray(receipts)||receipts.length>PRODUCT_MAX_RECEIPTS||!receipts.every(id=>productReceipt.test(id))||new Set(receipts).size!==receipts.length||!insurance||typeof insurance!=='object'||Array.isArray(insurance)||Object.keys(insurance).length>PRODUCT_MAX_RECEIPTS||!Object.entries(insurance).every(([id,amount])=>insuranceReceipt.test(id)&&Number.isSafeInteger(amount)&&amount>=0&&amount<=1080000))throw new Error('CORRUPT_RECEIPT_EVIDENCE');
    const next=productClone(saved);next.schema=PRODUCT_SCHEMA;next.playerId=playerId;next.progress={...productProgress(),...next.progress};
    if(!next.progress.events||typeof next.progress.events!=='object'||Array.isArray(next.progress.events)||!Object.values(next.progress.events).every(n=>Number.isFinite(n)&&n>=0&&n<=Number.MAX_SAFE_INTEGER))throw new Error('CORRUPT_SAVE');
    for(const [field,ids] of [['courierReceiptBindings',receipts],['courierInsuranceBindings',Object.keys(insurance)]]){
      const bindings=next.progress[field];if(!bindings||typeof bindings!=='object'||Array.isArray(bindings))throw new Error('CORRUPT_RECEIPT_EVIDENCE');
      for(const [id,b] of Object.entries(bindings))if(b?.purpose!==(field==='courierInsuranceBindings'?'PLAYER_COURIER_INSURANCE_PAYOUT':'PLAYER_COURIER_REWARD')||b?.rewardKaios>(field==='courierInsuranceBindings'?1080000:1000)||!ids.includes(id)||(field==='courierInsuranceBindings'&&b?.rewardKaios!==insurance[id])||b?.receiptId!==id||b.playerId!==playerId||b.owner!==owner||!Number.isSafeInteger(b.rewardKaios)||b.rewardKaios<0||typeof b.missionId!=='string'||!b.missionId)throw new Error('CORRUPT_RECEIPT_EVIDENCE');
    }
    return next;
  }
  function read(){
    let bytes;try{bytes=storage?.getItem(key)??null}catch{storageStatus='STORAGE_READ_FAILED';throw new Error(storageStatus)}
    try{if(bytes==null&&playerId&&owner==='guest'&&underlying?.getItem(key)!=null)throw new Error('LEGACY_PRODUCT_REVIEW_REQUIRED');if(bytes&&bytes.length>2_000_000)throw new Error('CORRUPT_SAVE');return {raw:bytes,value:bytes==null?fresh():validate(JSON.parse(bytes))}}catch(error){storageStatus=['CORRUPT_RECEIPT_EVIDENCE','LEGACY_PRODUCT_REVIEW_REQUIRED','STORAGE_READ_FAILED'].includes(error.message)?error.message:'CORRUPT_SAVE';throw new Error(storageStatus)}
  }
  function apply(saved){value=productClone(saved);progress=value.progress;replaceLedger(value.ledger)}
  function refresh(){
    writer.assertIdle();if(!key)return snapshot();
    try{const current=read();raw=current.raw;apply(current.value);storageStatus='READY'}catch(error){storageStatus=['CORRUPT_RECEIPT_EVIDENCE','LEGACY_PRODUCT_REVIEW_REQUIRED','STORAGE_READ_FAILED'].includes(error.message)?error.message:'CORRUPT_SAVE';throw new Error(storageStatus)}
    return snapshot();
  }
  function check(){writer.assert();if(disposed)throw new Error('LOCAL_GAME_STORE_DISPOSED');if(!key||storageStatus!=='READY')throw new Error(storageStatus==='READY'?'PLAYER_NOT_ACTIVE':storageStatus);if((storage.getItem(key)??null)!==raw)throw new Error('PLAYER_SESSION_CHANGED_RELOAD_REQUIRED')}
  function persist(next,expected){
    validate(next);writer.assert();if((storage.getItem(key)??null)!==expected)throw new Error('PLAYER_SESSION_CHANGED_RELOAD_REQUIRED');
    if(!Number.isSafeInteger(next.revision+1))throw new Error('PRODUCT_REVISION_CAPACITY');next.revision++;const encoded=JSON.stringify(next);if(encoded.length>2_000_000)throw new Error('PRODUCT_STORE_CAPACITY');
    try{storage.setItem(key,encoded);if(storage.getItem(key)!==encoded)throw new Error('LOCAL_SAVE_READBACK_FAILED');writer.assert()}
    catch{storageStatus='PERSISTENCE_UNCERTAIN';throw new Error('LOCAL_SAVE_NOT_CONFIRMED')}
    raw=encoded;apply(next);return true;
  }
  function transact(fn,{skipPersist=()=>false}={}){
    return writer.run(()=>{
      if(storageStatus!=='READY'||!key)throw new Error(storageStatus==='READY'?'PLAYER_NOT_ACTIVE':storageStatus);
      let before={value:productClone(value),ledger:productClone(ledger),raw};
      try{
        const current=read();raw=current.raw;apply(current.value);before={value:productClone(value),ledger:productClone(ledger),raw};
        const loaded=productClone(value);const result=fn();if(result&&typeof result.then==='function')throw new Error('ASYNC_LOCAL_MUTATION_FORBIDDEN');
        if(result?.ok===false||skipPersist(result)){writer.assert();apply(loaded);return result;}
        value.ledger=productClone(ledger);value.progress=productClone(progress);persist(value,current.raw);return result;
      }catch(error){if(before.value){value=before.value;progress=value.progress}replaceLedger(before.ledger);raw=before.raw;throw error}
    });
  }
  function activate(address){
    writer.assertIdle();const next=EVM_ADDRESS.test(address||'')?address.toLowerCase():'guest';if(owner===next)return false;
    owner=next;key='k11520.local-product.v1:'+owner;storageStatus='READY';apply(fresh());
    try{refresh()}catch{return true}
    // Read-only followers do not bump SESSION, claim legacy data or migrate.
    if(!writer.capability().writeEnabled)return true;
    try{transact(()=>{
      progress.events.UNIQUE_PLAYER=1;if(progress.events.SESSION)progress.events.RETURNING_PLAYER=(progress.events.RETURNING_PLAYER||0)+1;progress.events.SESSION=(progress.events.SESSION||0)+1;
    })}catch(error){if(storageStatus==='READY')storageStatus=error.message;}
    return true;
  }
  // Compatibility save never reloads-and-replaces an externally changed ledger.
  // Production simulation uses transactLedger around the entire engine call.
  function save(){return writer.run(()=>{const before=productClone(value);try{check();persist({...productClone(value),ledger:productClone(ledger),progress:productClone(progress)},raw);return true}catch(error){apply(before);throw error}})}
  function record(event,{reward=0,elapsedMs=0}={}){return transact(()=>{
    if(LOCAL_PRODUCT_EVENTS.includes(event))progress.events[event]=(progress.events[event]||0)+1;
    const boundedReward=Math.max(0,Math.min(100,Number(reward)||0));
    if(event==='MONSTER_KILL')progress.xp+=10;
    if(event==='LOOT_DROP'){progress.loot++;progress.kaios+=boundedReward;progress.xp+=5;if(owner!=='guest')progress.claimableKaios+=boundedReward}
    if(event==='TRADE_FILL'){progress.xp+=4;progress.engineXp+=6}
    if(event==='TRADE_CLOSE'){progress.xp+=12;progress.engineXp+=18}
    if(event==='LIQUIDATION'){progress.xp+=2;progress.engineXp+=4}
    progress.playedMs+=Math.max(0,Math.min(10000,Number(elapsedMs)||0));
  })}
  function spendKaios(amount,{purpose='LOCAL_GAME_PURCHASE'}={}){try{return transact(()=>{
    const n=Number(amount);if(!Number.isSafeInteger(n)||n<1||n>1000000)return {ok:false,reason:'INVALID_LOCAL_KAIOS_SPEND'};
    if(progress.kaios<n)return {ok:false,reason:'INSUFFICIENT_LOCAL_KAIOS',availableKaios:progress.kaios};
    progress.kaios-=n;progress.claimableKaios=Math.max(0,progress.claimableKaios-n);progress.spentKaios+=n;progress.events.KAIOS_SPEND=(progress.events.KAIOS_SPEND||0)+1;
    return {ok:true,amount:n,purpose:String(purpose),remainingKaios:progress.kaios,scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'};
  })}catch(error){return {ok:false,reason:error.message}}}
  function credit({receiptId,reward=0,missionId,playerId:expectedPlayer,owner:expectedOwner}={},insurance=false){try{return transact(()=>{
    const id=String(receiptId||''),amount=Number(reward),prefix=insurance?'COURIER_INSURANCE':'COURIER';
    if(!(insurance?insuranceReceipt:productReceipt).test(id))return {ok:false,reason:'INVALID_'+prefix+'_RECEIPT'};
    if(!Number.isSafeInteger(amount)||amount<0||amount>(insurance?1080000:1000))return {ok:false,reason:'INVALID_'+prefix+'_REWARD'};
    if(expectedPlayer!==playerId||expectedOwner!==owner||!playerId||typeof missionId!=='string'||!missionId)return {ok:false,reason:'COURIER_REWARD_OWNER_MISMATCH'};
    const binding={receiptId:id,missionId,playerId,owner,rewardKaios:amount,purpose:insurance?'PLAYER_COURIER_INSURANCE_PAYOUT':'PLAYER_COURIER_REWARD'};
    const bindings=insurance?progress.courierInsuranceBindings:progress.courierReceiptBindings,known=bindings[id],ids=insurance?Object.keys(progress.courierInsuranceReceipts):progress.courierReceipts;
    if(known){if(Object.keys(binding).some(k=>known[k]!==binding[k]))return {ok:false,reason:insurance?'COURIER_INSURANCE_RECEIPT_CONFLICT':'COURIER_RECEIPT_CONFLICT'};return {ok:true,replayed:true,...binding,scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'}}
    if(ids.includes(id))return {ok:false,reason:'LEGACY_COURIER_RECEIPT_REQUIRES_REVIEW'};
    if(ids.length>=PRODUCT_MAX_RECEIPTS)return {ok:false,reason:'COURIER_RECEIPT_CAPACITY'};
    // Verify the binding against the canonical mission, never caller data alone.
    const courierBytes=underlying.getItem('K11520_PLAYER_COURIER');if(!courierBytes||courierBytes.length>2_000_000)return {ok:false,reason:'CANONICAL_COURIER_CREDIT_REQUIRED'};
    const envelope=JSON.parse(courierBytes),mission=envelope?.missions?.[missionId],pending=insurance?mission?.insurance?.credit:mission?.settlement?.credit;
    const semantic=insurance?mission?.status==='ROBBED'&&mission.settlement?.outcome==='ROBBED'&&mission.insurance?.status==='ACTIVE'&&['APPROVED','PAID'].includes(mission.insurance.claimStatus)&&mission.insurance.payoutReceiptId===id&&mission.insurance.payoutKaios===amount&&mission.settlement.insurancePayoutKaios===amount&&pending?.status===(mission.insurance.claimStatus==='PAID'?'CONFIRMED':'PENDING'):['DELIVERY_PENDING_CREDIT','DELIVERED'].includes(mission?.status)&&mission.settlement?.outcome===mission.status&&mission.settlement.receiptId===id&&mission.settlement.rewardKaios===amount&&mission.economics?.courierPayout===amount&&mission.settlement.salaryKaios+mission.settlement.freightShareKaios===amount&&pending?.status===(mission.status==='DELIVERED'?'CONFIRMED':'PENDING');
    if(envelope.schema!=='K11520_PLAYER_COURIER'||!Number.isSafeInteger(envelope.revision)||envelope.revision<0||!semantic||mission.missionId!==missionId||mission.courierLifeId!==playerId||mission.scope!=='LOCAL_GAME_CARGO_ONLY'||mission.realKaiosTransfer!==false||mission.realKgenTransfer!==false||mission.mainnetWrite!==false||mission.settlement.chainTransfer!==false||!pending||Object.keys(binding).some(k=>pending[k]!==binding[k]))return {ok:false,reason:'CANONICAL_COURIER_CREDIT_REQUIRED'};
    bindings[id]=binding;if(insurance)progress.courierInsuranceReceipts[id]=amount;else progress.courierReceipts.push(id);
    const event=insurance?'COURIER_INSURANCE_PAYOUT':'COURIER_SETTLEMENT';progress.events[event]=(progress.events[event]||0)+1;progress.kaios+=amount;if(!insurance)progress.xp+=12;if(owner!=='guest')progress.claimableKaios+=amount;
    return {ok:true,replayed:false,...binding,scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'};
  },{skipPersist:result=>result?.replayed===true})}catch(error){return {ok:false,reason:error.message}}}
  function snapshot(){const p=productClone(progress),level=1+Math.min(9,Math.floor(Math.sqrt(p.xp/25))),engineLevel=1+Math.min(9,Math.floor(Math.sqrt(p.engineXp/20)));return {owner,playerId,persistent:!!underlying&&raw!=null&&storageStatus==='READY',storageStatus,writeCapability:writer.capability(),scope:'LOCAL_SIMULATION_NOT_VERIFIED_HUMAN_KPI',...p,level,engineLevel,nextLevelXp:level>=10?null:25*level*level,nextEngineXp:engineLevel>=10?null:20*engineLevel*engineLevel,kaiosRewardStatus:owner==='guest'?'LOCAL_ONLY_CONNECT_WALLET_TO_BIND':'WALLET_BOUND_CLAIMABLE_PENDING_DISTRIBUTION'}}
  return Object.freeze({activate,check,save,record,spendKaios,recordCourierSettlement:input=>credit(input),recordCourierInsurancePayout:input=>credit(input,true),snapshot,refresh,transactLedger:fn=>transact(fn),get ready(){return writer.ready},requestWriter:writer.requestWriter,dispose(){disposed=true;writer.dispose()}});
}
function padAddress(address){return String(address).toLowerCase().replace(/^0x/,'').padStart(64,'0');}
function hexToBigInt(hex){if(typeof hex!=='string'||!/^0x[0-9a-fA-F]+$/.test(hex))throw new Error('INVALID_BALANCE_RESPONSE');return BigInt(hex);}
function parseChainId(value){if(typeof value!=='string'||!/^0x[0-9a-fA-F]+$/.test(value))throw new Error('INVALID_CHAIN_ID');const n=Number(BigInt(value));if(!Number.isSafeInteger(n)||n<=0)throw new Error('INVALID_CHAIN_ID');return n;}
function providerCandidates(explicit){return [explicit,globalThis.trustwallet?.ethereum,globalThis.ethereum,globalThis.BinanceChain,globalThis.okxwallet].filter(Boolean);}
export function detectInjectedWallet(ethereum){return providerCandidates(ethereum).find(p=>typeof p?.request==='function')||null;}
export function readPublicWalletIdentity(storage){
  try{if(storage===undefined)storage=globalThis.localStorage;const value=JSON.parse(storage?.getItem(PUBLIC_WALLET_IDENTITY_KEY)||'null');return value?.version===1&&EVM_ADDRESS.test(value.address||'')?value:null}catch{return null}
}
export function savePublicWalletIdentity({address,chainId=null,sourceWorld='UNKNOWN'},storage){
  if(!EVM_ADDRESS.test(address||''))return null;
  const value={version:1,address,chainId:Number.isFinite(Number(chainId))?Number(chainId):null,sourceWorld:String(sourceWorld||'UNKNOWN'),updatedAt:new Date().toISOString()};
  try{if(storage===undefined)storage=globalThis.localStorage;storage?.setItem(PUBLIC_WALLET_IDENTITY_KEY,JSON.stringify(value));return value}catch{return null}
}
function validXYZ(value){return value&&['x','y','z'].every(axis=>Number.isFinite(Number(value[axis]))&&Math.abs(Number(value[axis]))<=1e9)}
export function readPlayerSession(storage){
  try{if(storage===undefined)storage=globalThis.localStorage;const value=JSON.parse(storage?.getItem(PLAYER_SESSION_KEY)||'null');return value?.version===1&&value.world==='K11520'&&validXYZ(value.xyz)&&validXYZ(value.intentXYZ)?value:null}catch{return null}
}
export function savePlayerSession({xyz,intentXYZ},storage){
  if(!validXYZ(xyz)||!validXYZ(intentXYZ))return null;
  const value={version:1,world:'K11520',xyz:{x:Number(xyz.x),y:Number(xyz.y),z:Number(xyz.z)},intentXYZ:{x:Number(intentXYZ.x),y:Number(intentXYZ.y),z:Number(intentXYZ.z)},savedAt:new Date().toISOString()};
  try{if(storage===undefined)storage=globalThis.localStorage;storage?.setItem(PLAYER_SESSION_KEY,JSON.stringify(value));return value}catch{return null}
}
export async function bindTempleReturnWalletContinuity({linkId='return-to-11520',statusId='return-wallet-continuity',sourceWorld='UNKNOWN',returnTitle,ethereum,storage=globalThis.localStorage}={}){
  const provider=detectInjectedWallet(ethereum),link=globalThis.document?.getElementById(linkId),status=globalThis.document?.getElementById(statusId);
  if(globalThis.document?.body){if(link)document.body.appendChild(link);if(status)document.body.appendChild(status)}
  const render=value=>{const label=value?.address?`${value.address.slice(0,6)}…${value.address.slice(-4)}`:'尚未連結';if(status)status.textContent=`錢包延續：${label}`;if(link){const destination=link.dataset.kaiosReturn==='PORTAL'?'KAIOS 總世界':'11520';link.dataset.walletContinuity=value?.address?'retained':'none';link.title=returnTitle??(value?.address?`返回 ${destination} 並保留公開錢包識別 ${label}`:`返回 ${destination}；尚無公開錢包識別`)}};
  const refresh=async accounts=>{let value=readPublicWalletIdentity(storage);const list=accounts||await provider?.request?.({method:'eth_accounts'}).catch(()=>[])||[];if(EVM_ADDRESS.test(list[0]||'')){const chainHex=await provider?.request?.({method:'eth_chainId'}).catch(()=>null);value=savePublicWalletIdentity({address:list[0],chainId:chainHex?Number.parseInt(chainHex,16):null,sourceWorld},storage)}render(value);return value};
  await refresh();
  if(provider?.on)provider.on('accountsChanged',accounts=>{void refresh(accounts)});
  return {provider,identity:readPublicWalletIdentity(storage)};
}
export function formatUnits(value,decimals=18){
  const n=typeof value==='bigint'?value:BigInt(value||0),d=10n**BigInt(decimals),whole=n/d,frac=(n%d).toString().padStart(decimals,'0').replace(/0+$/,'');
  return frac?`${whole}.${frac}`:`${whole}`;
}
async function readChainId(provider){return parseChainId(await provider.request({method:'eth_chainId'}));}
async function trySwitchChain(provider,targetChainId){
  if(!targetChainId)return {ok:false,reason:'NO_TARGET_CHAIN'};
  try{await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:`0x${Number(targetChainId).toString(16)}`} ]});return {ok:true,chainId:await readChainId(provider)};}catch(error){return {ok:false,reason:'CHAIN_SWITCH_REJECTED',error};}
}
export async function connectInjectedWallet({ethereum,allowedChainIds=[56,97],switchChain=false}={}){
  const provider=detectInjectedWallet(ethereum);
  if(!provider)return {ok:false,reason:'NO_INJECTED_WALLET'};
  const accounts=await provider.request({method:'eth_requestAccounts'});
  if(!Array.isArray(accounts)||!EVM_ADDRESS.test(accounts[0]||''))return {ok:false,reason:'NO_ACCOUNT'};
  let chainId=await readChainId(provider);
  if(allowedChainIds.length&&!allowedChainIds.includes(chainId)&&switchChain){
    const switched=await trySwitchChain(provider,allowedChainIds[0]);
    if(switched.ok)chainId=switched.chainId;
  }
  if(allowedChainIds.length&&!allowedChainIds.includes(chainId))return {ok:false,reason:'UNSUPPORTED_CHAIN',account:accounts[0],chainId,provider};
  return {ok:true,account:accounts[0],chainId,provider};
}
export async function readNativeBalance({provider,account}){
  if(!EVM_ADDRESS.test(account||''))throw new Error('INVALID_ACCOUNT');
  const raw=await provider.request({method:'eth_getBalance',params:[account,'latest']});
  return {raw:hexToBigInt(raw),formatted:formatUnits(hexToBigInt(raw),18)};
}
export async function readErc20Balance({provider,token,account,decimals=18}){
  if(!/^0x[0-9a-fA-F]{40}$/.test(token||''))return {ok:false,reason:'INVALID_TOKEN_ADDRESS'};
  if(!EVM_ADDRESS.test(account||''))return {ok:false,reason:'INVALID_ACCOUNT'};
  const data=ERC20_BALANCE_OF+padAddress(account);
  const rawHex=await provider.request({method:'eth_call',params:[{to:token,data},'latest']});
  // balanceOf returns one ABI uint256. An empty response is not a zero balance.
  if(typeof rawHex!=='string'||!/^0x[0-9a-fA-F]{64}$/.test(rawHex))return {ok:false,reason:'INVALID_BALANCE_RESPONSE'};
  const raw=hexToBigInt(rawHex);return {ok:true,raw,formatted:formatUnits(raw,decimals)};
}
export function watchWallet({provider,onAccountsChanged,onChainChanged,onDisconnect}){
  if(!provider?.on)return ()=>{};
  const a=accounts=>onAccountsChanged?.(accounts||[]),c=chain=>{let parsed=null;try{parsed=parseChainId(chain)}catch{}onChainChanged?.(parsed)},d=()=>onDisconnect?.();
  provider.on('accountsChanged',a);provider.on('chainChanged',c);provider.on('disconnect',d);
  return ()=>{provider.removeListener?.('accountsChanged',a);provider.removeListener?.('chainChanged',c);provider.removeListener?.('disconnect',d)};
}

/** One read-only EIP-1193 connection organ. No chain switch, signing or send methods. */
export function createWalletSession({ethereum,storage,timeoutMs=12000}={}){
  let provider=null,stopWatch=()=>{},generation=0,disposed=false,active=false;
  const listeners=new Set();
  let state={account:null,chainId:null,status:'DISCONNECTED',error:null,kgen:null,bnb:null,network:null,balanceReadOnly:true,executionMode:'SIMULATION'};
  const snapshot=()=>Object.freeze({...state});
  const publish=patch=>{state={...state,...patch};const value=snapshot();for(const listener of listeners){try{listener(value)}catch{}}return value};
  const clear={kgen:null,bnb:null};
  const current=ticket=>!disposed&&active&&ticket===generation;
  const duration=Number.isFinite(timeoutMs)&&timeoutMs>0?Math.min(timeoutMs,60000):12000;
  const request=args=>new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('WALLET_TIMEOUT')),duration);
    Promise.resolve().then(()=>provider.request(args)).then(resolve,reject).finally(()=>clearTimeout(timer));
  });
  const boundedProvider={request};
  const classify=error=>Number(error?.code)===4001?'USER_REJECTED':Number(error?.code)===4900?'DISCONNECTED':Number(error?.code)===4901?'WRONG_CHAIN':['WALLET_TIMEOUT','INVALID_CHAIN_ID','INVALID_ACCOUNT','INVALID_BALANCE_RESPONSE'].includes(error?.message)?error.message:'WALLET_READ_FAILED';
  const retain=()=>{try{savePublicWalletIdentity({address:state.account,chainId:state.chainId,sourceWorld:'K11520'},storage??globalThis.localStorage)}catch{}};
  async function sync({prompt=false,accounts:providedAccounts,chainId:providedChain}={}){
    if(disposed)return snapshot();
    const ticket=++generation;
    publish({...clear,account:null,chainId:null,network:null,status:prompt?'CONNECTING':'READING',error:null});
    try{
      const accounts=providedAccounts===undefined?await request({method:prompt?'eth_requestAccounts':'eth_accounts'}):providedAccounts;
      if(!current(ticket))return snapshot();
      if(!Array.isArray(accounts))throw new Error('INVALID_ACCOUNT');
      if(!accounts.length)return publish({...clear,account:null,chainId:null,network:null,status:'DISCONNECTED',error:'DISCONNECTED'});
      if(!EVM_ADDRESS.test(accounts[0]||''))throw new Error('INVALID_ACCOUNT');
      const account=accounts[0];
      const chainId=providedChain===undefined?await readChainId(boundedProvider):providedChain;
      if(!current(ticket))return snapshot();
      if(!Number.isSafeInteger(chainId)||chainId<=0)throw new Error('INVALID_CHAIN_ID');
      publish({account,chainId,network:chainId===KGEN_CHAIN_ID?'BNB Smart Chain':`Chain ${chainId}`,status:chainId===KGEN_CHAIN_ID?'READING':'WRONG_CHAIN',error:chainId===KGEN_CHAIN_ID?null:'WRONG_CHAIN'});
      retain();
      if(chainId!==KGEN_CHAIN_ID)return snapshot();
      const [native,token]=await Promise.all([readNativeBalance({provider:boundedProvider,account}),readErc20Balance({provider:boundedProvider,account,token:KGEN_TOKEN_ADDRESS})]);
      if(!current(ticket))return snapshot();
      if(!token.ok)throw new Error(token.reason);
      return publish({status:'CONNECTED',error:null,kgen:token.formatted,bnb:native.formatted});
    }catch(error){
      if(!current(ticket))return snapshot();
      const reason=classify(error),identityLost=['USER_REJECTED','DISCONNECTED','INVALID_ACCOUNT','INVALID_CHAIN_ID'].includes(reason);
      return publish({...clear,...(identityLost?{account:null,chainId:null,network:null}:{}),status:reason==='DISCONNECTED'?'DISCONNECTED':reason==='WRONG_CHAIN'?'WRONG_CHAIN':'ERROR',error:reason});
    }
  }
  function attach(){
    if(disposed)return false;
    if(active&&provider)return true;
    provider=detectInjectedWallet(ethereum);
    if(!provider){publish({...clear,account:null,chainId:null,network:null,status:'NO_WALLET',error:'NO_INJECTED_WALLET'});return false}
    active=true;
    stopWatch=watchWallet({provider,
      onAccountsChanged:accounts=>{if(active)void sync({accounts})},
      onChainChanged:chainId=>{if(active)void sync({chainId})},
      onDisconnect:()=>detach('DISCONNECTED')
    });
    return true;
  }
  function detach(error=null){++generation;active=false;stopWatch();stopWatch=()=>{};return publish({...clear,account:null,chainId:null,network:null,status:'DISCONNECTED',error})}
  return Object.freeze({
    connect:()=>attach()?sync({prompt:true}):Promise.resolve(snapshot()),
    refresh:()=>attach()?sync():Promise.resolve(snapshot()),
    disconnect:()=>detach(),snapshot,
    subscribe(listener){if(typeof listener!=='function'||disposed)return ()=>{};listeners.add(listener);try{listener(snapshot())}catch{}return ()=>listeners.delete(listener)},
    dispose(){detach();disposed=true;listeners.clear()}
  });
}
export function assertExecutableOrder({wallet,chainId,marketAdapter,order}){
  if(!wallet?.account)return {ok:false,reason:'WALLET_NOT_CONNECTED'};
  if(wallet.chainId!==chainId)return {ok:false,reason:'WRONG_CHAIN'};
  if(!marketAdapter?.preview||!marketAdapter?.submit)return {ok:false,reason:'NO_VERIFIED_MARKET_ADAPTER'};
  if(!order?.axis||!order?.side||!(Number(order?.notional)>0))return {ok:false,reason:'INVALID_ORDER'};
  try{normalizeSignedC(order.c);if(chainId===56)requireV1TradingC(order.c);signedPositionSide(order.c,order.side);requiredMargin({lots:order.lots})}catch(e){return {ok:false,reason:e.message}}
  if(!['KX','KY','KZ'].includes(order.axis)||!Number.isFinite(Number(order.notional)))return {ok:false,reason:'INVALID_ORDER'};
  return {ok:true};
}

function pin11520WalletToggle(){
  if(typeof document==='undefined')return;
  const btn=document.getElementById('walletToggle');
  if(!btn||btn.dataset.k11520Pinned==='1')return;
  btn.dataset.k11520Pinned='1';
  btn.classList.add('k11520-fixed-wallet-toggle');
  document.body.appendChild(btn);
  const style=document.createElement('style');
  style.id='k11520FixedWalletToggleStyle';
  style.textContent=`
    #walletToggle.k11520-fixed-wallet-toggle{position:fixed!important;z-index:980!important;right:72px!important;top:398px!important;width:44px!important;min-width:44px!important;height:44px!important;min-height:44px!important;padding:0!important;border:1px solid #68e4ff66!important;border-radius:11px!important;background:#101a25!important;color:#8ceaff!important;display:block!important;transform:none!important;touch-action:manipulation!important}
    #hudToggleAxes,#hudToggleMonster,#hudToggleParams{right:72px!important}
    body.game-clean-mode #walletToggle.k11520-fixed-wallet-toggle{display:none!important}
    @media(max-width:420px){body:not(.game-clean-mode) #walletPanel{right:68px!important;width:calc(100vw - 84px)!important;max-width:calc(100vw - 84px)!important}}
    @media(min-width:421px){#walletToggle.k11520-fixed-wallet-toggle{right:68px!important;top:302px!important}}
  `;
  document.head.appendChild(style);
  const panel=document.getElementById('walletPanel');
  if(panel){
    const sync=()=>{btn.textContent=panel.classList.contains('collapsed')?'◀':'▶';btn.setAttribute('aria-expanded',String(!panel.classList.contains('collapsed')))};
    new MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:['class']});
    sync();
  }
}

if(typeof document!=='undefined'&&/\/temples\/11520\/game-5d\.html$/i.test(decodeURI(globalThis.location?.pathname||''))){
  import('./life-visual-bootstrap.mjs').catch(()=>{});
  pin11520WalletToggle();
  import('./game-mobile-shell.mjs').catch(error=>console.warn('[11520 mobile shell] optional UI degraded',error));
  import('./backpack-ui.mjs').then(()=>import('./living-world-browser-bridge.mjs')).catch(()=>{});
  import('./game-ui-product-fixes.mjs').catch(()=>{});
  import('./real-trading-preflight-ui.mjs').then(({install11520RealTradingPreflightUi})=>install11520RealTradingPreflightUi()).catch(()=>{});
}
