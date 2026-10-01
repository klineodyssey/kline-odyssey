import {normalizeSignedC,signedPositionSide,requiredMargin,createKgenLedger} from './kgen-margin-runtime.mjs';
import {requireV1TradingC} from '../controls/nonlinear-controls.mjs';
const ERC20_BALANCE_OF='0x70a08231';
export const PUBLIC_WALLET_IDENTITY_KEY='klineodyssey.public-wallet-identity.v1';
export const PLAYER_SESSION_KEY='k11520.player-session.v1';
export const KGEN_TOKEN_ADDRESS='0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be';
export const KGEN_CHAIN_ID=56;
const EVM_ADDRESS=/^0x[0-9a-fA-F]{40}$/;
export const LOCAL_PRODUCT_EVENTS=Object.freeze(['UNIQUE_PLAYER','SESSION','MONSTER_KILL','LOOT_DROP','TRADE_OPEN','TRADE_FILL','TRADE_CLOSE','LIQUIDATION','RETURNING_PLAYER','ERROR']);
// A namespace is isolation against application mix-ups, NOT authentication of
// another person sharing this browser. Player IDs never authorize chain assets.
export function createPlayerScopedStorage(storage,playerId){
  if(storage===undefined){try{storage=globalThis.localStorage}catch{storage=null}}
  if(!/^KAIOS-P-[a-zA-Z0-9-]{16,80}$/.test(playerId||''))throw new Error('INVALID_PLAYER_ID');
  const prefix='k11520.player:'+playerId+':',claimKey='k11520.player-life.legacy-owner';
  const allowed=new Set([PLAYER_SESSION_KEY,'k11520.journey.tutorial','11520.backpack.v1','k11520.local-product.v1:guest']);
  // Claim precedes copying. A failed storage write must never silently claim
  // the same old save for every newly-created guest. Originals remain intact.
  let legacyOwner=null;
  try{legacyOwner=storage?.getItem(claimKey);if(!legacyOwner&&storage){storage.setItem(claimKey,playerId);legacyOwner=storage.getItem(claimKey)}}catch{}
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
// Local, unauthenticated simulation progress only. No cross-device identity,
// real-player KPI, chain claim, secret or wallet-provider object is stored here.
export function createSimulationPlayerStore({ledger,storage,playerId=null}={}){
  if(storage===undefined){try{storage=globalThis.localStorage}catch{storage=null}}
  if(playerId)storage=createPlayerScopedStorage(storage,playerId);
  let owner=null,key=null,revision=0,progress=null,persistent=true,storageStatus='READY',rawPresent=false;
  const read=()=>{try{const raw=storage?.getItem(key);rawPresent=raw!=null;return JSON.parse(raw||'null')}catch{storageStatus='CORRUPT_SAVE';return null}};
  const fresh=()=>({kaios:0,claimableKaios:0,loot:0,xp:0,engineXp:0,events:{},playedMs:0});
  function check(){if(!persistent)return;if((read()?.revision??0)!==revision)throw new Error('PLAYER_SESSION_CHANGED_RELOAD_REQUIRED')}
  function save(){
    if(storageStatus==='CORRUPT_SAVE')return;
    check();const value={schema:'K11520_LOCAL_SIMULATION_V1',owner,revision:revision+1,ledger,progress};
    try{storage?.setItem(key,JSON.stringify(value));revision++;persistent=!!storage}catch{persistent=false}
  }
  function activate(address){
    const next=EVM_ADDRESS.test(address||'')?address.toLowerCase():'guest';if(owner===next)return false;
    // Never overwrite another tab's newer revision when changing account.
    owner=next;key='k11520.local-product.v1:'+owner;persistent=true;storageStatus='READY';rawPresent=false;
    const value=read();revision=value?.revision??0;progress=fresh();
    for(const k of Object.keys(ledger))delete ledger[k];Object.assign(ledger,createKgenLedger(100));
    const encoded=JSON.stringify(value);
    const saved=value?.schema==='K11520_LOCAL_SIMULATION_V1'&&value.owner===owner&&encoded.length<2000000&&!/[<>&]/.test(encoded)?value:null;
    const validSaved=saved&&['total','free','lockedMargin','reservedOrders','realizedPnl','unrealizedPnl'].every(k=>Number.isFinite(saved.ledger?.[k]));
    if((rawPresent&&!validSaved)||storageStatus==='CORRUPT_SAVE'){storageStatus='CORRUPT_SAVE';persistent=false}
    if(validSaved){
      for(const k of ['total','free','lockedMargin','reservedOrders','realizedPnl','unrealizedPnl'])ledger[k]=saved.ledger[k];
      const b=saved.ledger.simulation;
      if(b&&Number.isSafeInteger(b.sequence)&&['orders','positions','receipts'].every(k=>Array.isArray(b[k]))&&b.observations&&typeof b.observations==='object')ledger.simulation=structuredClone(b);
      if(saved.progress){for(const k of ['kaios','claimableKaios','loot','xp','engineXp','playedMs'])progress[k]=Math.max(0,Number(saved.progress[k])||0);for(const event of LOCAL_PRODUCT_EVENTS)progress.events[event]=Math.max(0,Number(saved.progress.events?.[event])||0)}
    }
    ledger.owner=owner;
    progress.events.UNIQUE_PLAYER=1;
    if(progress.events.SESSION)progress.events.RETURNING_PLAYER=(progress.events.RETURNING_PLAYER||0)+1;
    progress.events.SESSION=(progress.events.SESSION||0)+1;save();return true;
  }
  function record(event,{reward=0,elapsedMs=0}={}){
    check();if(LOCAL_PRODUCT_EVENTS.includes(event))progress.events[event]=(progress.events[event]||0)+1;
    const boundedReward=Math.max(0,Math.min(100,Number(reward)||0));
    if(event==='MONSTER_KILL')progress.xp+=10;
    if(event==='LOOT_DROP'){progress.loot++;progress.kaios+=boundedReward;progress.xp+=5;if(owner!=='guest')progress.claimableKaios+=boundedReward}
    if(event==='TRADE_FILL'){progress.xp+=4;progress.engineXp+=6}
    if(event==='TRADE_CLOSE'){progress.xp+=12;progress.engineXp+=18}
    if(event==='LIQUIDATION'){progress.xp+=2;progress.engineXp+=4}
    progress.playedMs+=Math.max(0,Math.min(10000,Number(elapsedMs)||0));save();
  }
  function snapshot(){
    const p=structuredClone(progress),level=1+Math.min(9,Math.floor(Math.sqrt(p.xp/25))),engineLevel=1+Math.min(9,Math.floor(Math.sqrt(p.engineXp/20)));
    return {owner,playerId,persistent,storageStatus,scope:'LOCAL_SIMULATION_NOT_VERIFIED_HUMAN_KPI',...p,level,engineLevel,
      nextLevelXp:level>=10?null:25*level*level,nextEngineXp:engineLevel>=10?null:20*engineLevel*engineLevel,
      kaiosRewardStatus:owner==='guest'?'LOCAL_ONLY_CONNECT_WALLET_TO_BIND':'WALLET_BOUND_CLAIMABLE_PENDING_DISTRIBUTION'};
  }
  return {activate,check,save,record,snapshot};
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
export async function bindTempleReturnWalletContinuity({linkId='return-to-11520',statusId='return-wallet-continuity',sourceWorld='UNKNOWN',ethereum,storage=globalThis.localStorage}={}){
  const provider=detectInjectedWallet(ethereum),link=globalThis.document?.getElementById(linkId),status=globalThis.document?.getElementById(statusId);
  if(globalThis.document?.body){if(link)document.body.appendChild(link);if(status)document.body.appendChild(status)}
  const render=value=>{const label=value?.address?`${value.address.slice(0,6)}…${value.address.slice(-4)}`:'尚未連結';if(status)status.textContent=`錢包延續：${label}`;if(link){link.dataset.walletContinuity=value?.address?'retained':'none';link.title=value?.address?`返回 11520 並保留公開錢包識別 ${label}`:'返回 11520；尚無公開錢包識別'}};
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

if(typeof document!=='undefined'&&/\/temples\/11520\/game-5d\.html$/i.test(globalThis.location?.pathname||'')){
  import('./life-visual-bootstrap.mjs').catch(()=>{});
  pin11520WalletToggle();
  import('./game-mobile-shell.mjs').catch(()=>{});
  import('./backpack-ui.mjs').then(()=>import('./living-world-browser-bridge.mjs')).catch(()=>{});
  import('./game-ui-product-fixes.mjs').catch(()=>{});
  import('./real-trading-preflight-ui.mjs').then(({install11520RealTradingPreflightUi})=>install11520RealTradingPreflightUi()).catch(()=>{});
}
