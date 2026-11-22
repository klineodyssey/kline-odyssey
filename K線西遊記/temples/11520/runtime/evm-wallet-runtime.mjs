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
  const fresh=()=>({kaios:0,claimableKaios:0,spentKaios:0,loot:0,xp:0,engineXp:0,events:{},playedMs:0,courierReceipts:[],courierInsuranceReceipts:{}});
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
      if(saved.progress){for(const k of ['kaios','claimableKaios','spentKaios','loot','xp','engineXp','playedMs'])progress[k]=Math.max(0,Number(saved.progress[k])||0);for(const event of LOCAL_PRODUCT_EVENTS)progress.events[event]=Math.max(0,Number(saved.progress.events?.[event])||0);if(Array.isArray(saved.progress.courierReceipts)&&saved.progress.courierReceipts.length<=1000&&saved.progress.courierReceipts.every(value=>/^COURIER-RECEIPT-[0-9a-f]{8}$/i.test(value))&&new Set(saved.progress.courierReceipts).size===saved.progress.courierReceipts.length)progress.courierReceipts=[...saved.progress.courierReceipts];const insurance=saved.progress.courierInsuranceReceipts;if(insurance&&typeof insurance==='object'&&!Array.isArray(insurance)){const entries=Object.entries(insurance);if(entries.length<=1000&&entries.every(([id,value])=>/^COURIER-INSURANCE-[0-9a-f]{8}$/i.test(id)&&Number.isSafeInteger(value)&&value>=0&&value<=1080000))progress.courierInsuranceReceipts=Object.fromEntries(entries)}}
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
  function spendKaios(amount,{purpose='LOCAL_GAME_PURCHASE'}={}){
    check();const value=Number(amount);
    if(!Number.isSafeInteger(value)||value<1||value>1000000)return {ok:false,reason:'INVALID_LOCAL_KAIOS_SPEND'};
    if(progress.kaios<value)return {ok:false,reason:'INSUFFICIENT_LOCAL_KAIOS',availableKaios:progress.kaios};
    progress.kaios-=value;progress.claimableKaios=Math.max(0,progress.claimableKaios-value);progress.spentKaios+=value;
    progress.events.KAIOS_SPEND=(progress.events.KAIOS_SPEND||0)+1;save();
    return {ok:true,amount:value,purpose:String(purpose),remainingKaios:progress.kaios,scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'};
  }
  function recordCourierSettlement({receiptId,reward=0}={}){
    check();const id=String(receiptId||''),value=Number(reward);
    if(!/^COURIER-RECEIPT-[0-9a-f]{8}$/i.test(id))return {ok:false,reason:'INVALID_COURIER_RECEIPT'};
    if(progress.courierReceipts.includes(id))return {ok:false,reason:'COURIER_REWARD_REPLAY_BLOCKED'};
    if(!Number.isSafeInteger(value)||value<0||value>1000)return {ok:false,reason:'INVALID_COURIER_REWARD'};
    progress.courierReceipts.push(id);progress.events.COURIER_SETTLEMENT=(progress.events.COURIER_SETTLEMENT||0)+1;progress.kaios+=value;progress.xp+=12;if(owner!=='guest')progress.claimableKaios+=value;save();
    return {ok:true,receiptId:id,rewardKaios:value,scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'};
  }
  function recordCourierInsurancePayout({receiptId,reward=0}={}){
    check();const id=String(receiptId||''),value=Number(reward);
    if(!/^COURIER-INSURANCE-[0-9a-f]{8}$/i.test(id))return {ok:false,reason:'INVALID_COURIER_INSURANCE_RECEIPT'};
    if(!Number.isSafeInteger(value)||value<0||value>1080000)return {ok:false,reason:'INVALID_COURIER_INSURANCE_PAYOUT'};
    const recorded=progress.courierInsuranceReceipts[id];
    if(recorded!==undefined)return recorded===value?{ok:true,replayed:true,receiptId:id,rewardKaios:value,purpose:'PLAYER_COURIER_INSURANCE_PAYOUT',scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'}:{ok:false,reason:'COURIER_INSURANCE_RECEIPT_CONFLICT'};
    progress.courierInsuranceReceipts[id]=value;progress.events.COURIER_INSURANCE_PAYOUT=(progress.events.COURIER_INSURANCE_PAYOUT||0)+1;progress.kaios+=value;if(owner!=='guest')progress.claimableKaios+=value;save();
    return {ok:true,replayed:false,receiptId:id,rewardKaios:value,purpose:'PLAYER_COURIER_INSURANCE_PAYOUT',scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'};
  }
  function snapshot(){
    const p=structuredClone(progress),level=1+Math.min(9,Math.floor(Math.sqrt(p.xp/25))),engineLevel=1+Math.min(9,Math.floor(Math.sqrt(p.engineXp/20)));
    return {owner,playerId,persistent,storageStatus,scope:'LOCAL_SIMULATION_NOT_VERIFIED_HUMAN_KPI',...p,level,engineLevel,
      nextLevelXp:level>=10?null:25*level*level,nextEngineXp:engineLevel>=10?null:20*engineLevel*engineLevel,
      kaiosRewardStatus:owner==='guest'?'LOCAL_ONLY_CONNECT_WALLET_TO_BIND':'WALLET_BOUND_CLAIMABLE_PENDING_DISTRIBUTION'};
  }
  return {activate,check,save,record,spendKaios,recordCourierSettlement,recordCourierInsurancePayout,snapshot};
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

const HASH32 = /^0x[0-9a-f]{64}$/i;
const RPC_QUANTITY = /^0x(?:0|[1-9a-f][0-9a-f]*)$/i;
const WITHDRAW_SELECTOR = '0x0cea7534'; // withdrawMargin(uint256)
const WITHDRAW_EVENT = '0xa633914e4e8c156017d6b25c76553167f0e357050e1c7bb31e23cf108ea001f7';
const TRANSFER_EVENT = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const EMPTY_CODE_HASH = '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470';

function matchesHex(a, b) {
  return typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase();
}

function reviewedBinding(manifest, trading = false) {
  if (manifest?.documentType !== 'K11520_MAINNET_DEPLOYMENT_MANIFEST' ||
      manifest.status !== 'DEPLOYED_CONFIG_VERIFIED' || manifest.CHAIN_ID !== KGEN_CHAIN_ID ||
      !matchesHex(manifest.KGEN_TOKEN, KGEN_TOKEN_ADDRESS)) return null;
  const roles = [
    [KGEN_TOKEN_ADDRESS, manifest.codeHashes?.kgenToken],
    [manifest.BRAIN_PROXY, manifest.codeHashes?.brainProxy],
    [manifest.BRAIN_IMPLEMENTATION, manifest.codeHashes?.brainImplementation],
  ];
  if (trading) roles.push([manifest.ORDER_TRIGGER_ENGINE, manifest.codeHashes?.orderTriggerEngine],
    [manifest.POSITION_ENGINE, manifest.codeHashes?.positionEngine]);
  if (!roles.every(([address, hash]) => EVM_ADDRESS.test(address) && !/^0x0{40}$/i.test(address) &&
      HASH32.test(hash) && !/^0x0{64}$/i.test(hash) && !matchesHex(hash, EMPTY_CODE_HASH))) return null;
  if (new Set(roles.map(([address]) => address.toLowerCase())).size !== roles.length) return null;
  return {brain: roles[1][0], implementation: roles[2][0], trigger: roles[3]?.[0], position: roles[4]?.[0], roles};
}

async function bindingAt(request, binding, block) {
  const routes = [[binding.brain, '0x28991fa7', KGEN_TOKEN_ADDRESS]]; // Brain.kgen()
  if (binding.trigger) routes.push(
    [binding.trigger, '0xf956d3af', binding.brain], [binding.trigger, '0xc9d4623f', binding.position],
    [binding.position, '0xc34c08e5', binding.trigger], [binding.position, '0xc1c15bb5', binding.brain]
  ); // Trigger.brain(), Trigger.engine(), Position.executor(), Position.brainSettlement()
  const [implementation, routeWords, accounts] = await Promise.all([
    request('eth_getStorageAt', [binding.brain, IMPLEMENTATION_SLOT, block]),
    Promise.all(routes.map(([to, data]) => request('eth_call', [{to, data}, block]))),
    Promise.all(binding.roles.map(([address]) => request('eth_getProof', [address, [], block]))),
  ]);
  return matchesHex(implementation, '0x' + padAddress(binding.implementation)) &&
    routes.every((route, i) => matchesHex(routeWords[i], '0x' + padAddress(route[2]))) &&
    binding.roles.every(([address, hash], i) =>
      matchesHex(accounts[i]?.address, address) && matchesHex(accounts[i]?.codeHash, hash));
}

function transactionChain(tx) {
  if (RPC_QUANTITY.test(tx.chainId)) return BigInt(tx.chainId);
  if (tx.chainId == null && (tx.type == null || tx.type === '0x0') && RPC_QUANTITY.test(tx.v) && BigInt(tx.v) >= 35n) {
    return (BigInt(tx.v) - 35n) / 2n;
  }
  return null;
}

function includedInBlock(block, receipt) {
  if (!block || !matchesHex(block.hash, receipt.blockHash) || block.number !== receipt.blockNumber ||
      !Array.isArray(block.transactions) || !RPC_QUANTITY.test(receipt.transactionIndex)) return false;
  const index = Number(BigInt(receipt.transactionIndex));
  return Number.isSafeInteger(index) && matchesHex(block.transactions[index], receipt.transactionHash);
}

function withdrawalCredit(receipt, brain, account, amount) {
  const walletWord = '0x' + padAddress(account), brainWord = '0x' + padAddress(brain);
  let received = null, debited = 0n, priorIndex = -1n, withdrawal = false;
  if (!Array.isArray(receipt.logs)) return null;
  for (const log of receipt.logs) {
    const topics = log?.topics;
    const isToken = matchesHex(log?.address, KGEN_TOKEN_ADDRESS) && matchesHex(topics?.[0], TRANSFER_EVENT);
    const isBrain = matchesHex(log?.address, brain) && matchesHex(topics?.[0], WITHDRAW_EVENT);
    if (!isToken && !isBrain) continue;
    if (!Array.isArray(topics) || log.removed === true || !matchesHex(log.transactionHash, receipt.transactionHash) ||
        !matchesHex(log.blockHash, receipt.blockHash) || log.blockNumber !== receipt.blockNumber ||
        log.transactionIndex !== receipt.transactionIndex || !RPC_QUANTITY.test(log.logIndex) ||
        BigInt(log.logIndex) <= priorIndex || !HASH32.test(log.data) || withdrawal) return null;
    priorIndex = BigInt(log.logIndex);
    const value = BigInt(log.data);
    if (isBrain) {
      if (topics.length !== 2 || !matchesHex(topics[1], walletWord) || value !== amount) return null;
      withdrawal = true;
    } else {
      if (topics.length !== 3 || !matchesHex(topics[1], brainWord) ||
          !/^0x0{24}[0-9a-f]{40}$/i.test(topics[2]) || matchesHex(topics[2], brainWord)) return null;
      debited += value;
      if (matchesHex(topics[2], walletWord)) {
        if (received !== null || value === 0n) return null;
        received = value;
      }
    }
  }
  return withdrawal && debited === amount ? received : null;
}

// The caller supplies the site's reviewed manifest and the currently selected account.
// This function only reads the original hash. It never applies a credit to a local ledger.
export async function readK11520WithdrawalReceipt({provider, manifest, account, txHash, amountWei} = {}) {
  const result = (status, details = {}) => ({ok: status === 'CREDIT_CONFIRMED', status, txHash, ...details});
  const binding = reviewedBinding(manifest);
  if (!binding) return result('BINDING_UNAVAILABLE');
  if (!HASH32.test(txHash) || /^0x0{64}$/i.test(txHash) || !EVM_ADDRESS.test(account) ||
      /^0x0{40}$/i.test(account) || binding.roles.some(([address]) => matchesHex(address, account)) ||
      (amountWei !== undefined && (typeof amountWei !== 'string' || !/^[1-9]\d{0,77}$/.test(amountWei) ||
       BigInt(amountWei) >= 1n << 256n))) return result('INVALID_INPUT');
  if (typeof provider?.request !== 'function') return result('UNKNOWN', {reason: 'PROVIDER_UNAVAILABLE'});
  let finished = false;
  const request = (method, params = []) => {
    if (finished) throw new Error('READ_EXPIRED');
    return provider.request({method, params});
  };
  async function walletStatus() {
    const [chain, accounts] = await Promise.all([request('eth_chainId'), request('eth_accounts')]);
    if (parseChainId(chain) !== KGEN_CHAIN_ID) return 'WRONG_CHAIN';
    if (!Array.isArray(accounts) || !matchesHex(accounts[0], account)) return 'ACCOUNT_MISMATCH';
    return null;
  }
  async function read() {
    const context = await walletStatus();
    if (context) return result(context);
    const [tx, receipt] = await Promise.all([
      request('eth_getTransactionByHash', [txHash]), request('eth_getTransactionReceipt', [txHash]),
    ]);
    if (!tx) return result('UNKNOWN', {reason: 'TRANSACTION_NOT_FOUND'});
    // Some nodes return only the EIP-155 signature v for a legacy transaction.
    const txChain = transactionChain(tx);
    if (txChain === null) return result('UNKNOWN', {reason: 'TRANSACTION_CHAIN_UNCONFIRMED'});
    if (!matchesHex(tx.hash, txHash) || !matchesHex(tx.from, account) || !matchesHex(tx.to, binding.brain) ||
        txChain !== BigInt(KGEN_CHAIN_ID) || tx.value !== '0x0' || typeof tx.input !== 'string' ||
        !tx.input.toLowerCase().startsWith(WITHDRAW_SELECTOR) || !HASH32.test('0x' + tx.input.slice(10))) {
      return result('EVIDENCE_MISMATCH', {reason: 'TRANSACTION_TERMS'});
    }
    const amount = BigInt('0x' + tx.input.slice(10));
    if (amount === 0n || (amountWei !== undefined && amount !== BigInt(amountWei))) {
      return result('EVIDENCE_MISMATCH', {reason: 'WITHDRAWAL_AMOUNT'});
    }
    if (!receipt) {
      const pending = tx.blockHash === null && tx.blockNumber === null && tx.transactionIndex === null;
      return result(pending ? 'PENDING' : 'UNKNOWN', {reason: 'RECEIPT_NOT_AVAILABLE'});
    }
    if (!matchesHex(receipt.transactionHash, txHash) || !matchesHex(receipt.from, account) ||
        !matchesHex(receipt.to, binding.brain) || !HASH32.test(receipt.blockHash) || /^0x0{64}$/i.test(receipt.blockHash) ||
        !matchesHex(receipt.blockHash, tx.blockHash) || !RPC_QUANTITY.test(receipt.blockNumber) ||
        receipt.blockNumber !== tx.blockNumber || receipt.transactionIndex !== tx.transactionIndex) {
      return result('EVIDENCE_MISMATCH', {reason: 'RECEIPT_IDENTITY'});
    }
    const block = receipt.blockNumber;
    const canonical = async () => includedInBlock(await request('eth_getBlockByNumber', [block, false]), receipt);
    if (!await canonical()) return result('UNKNOWN', {reason: 'CANONICAL_BLOCK_UNCONFIRMED'});
    if (receipt.status === '0x0') return result(await walletStatus() ?? 'REVERTED');
    if (receipt.status !== '0x1') return result('UNKNOWN', {reason: 'RECEIPT_STATUS_UNAVAILABLE'});
    if (!await bindingAt(request, binding, block)) {
      return result('EVIDENCE_MISMATCH', {reason: 'DEPLOYMENT_CODE_OR_ROUTING'});
    }
    const received = withdrawalCredit(receipt, binding.brain, account, amount);
    if (received === null) return result('EVIDENCE_MISMATCH', {reason: 'WITHDRAWAL_OR_TRANSFERS'});
    if (!await canonical()) return result('UNKNOWN', {reason: 'CANONICAL_BLOCK_UNCONFIRMED'});
    const finalContext = await walletStatus();
    if (finalContext) return result(finalContext);
    return result('CREDIT_CONFIRMED', {account, brainAddress: binding.brain, tokenAddress: KGEN_TOKEN_ADDRESS,
      blockNumber: block, blockHash: receipt.blockHash, confirmationScope: 'CANONICAL_AT_READ', requestedWei: amount.toString(),
      receivedWei: received.toString(), feeWei: (amount - received).toString()});
  }
  let timer;
  try {
    return await Promise.race([read(), new Promise(resolve => {
      timer = setTimeout(() => resolve(result('UNKNOWN', {reason: 'RPC_TIMEOUT'})), 12000);
    })]);
  } catch {
    return result('UNKNOWN', {reason: 'RPC_READ_UNAVAILABLE'});
  } finally {
    finished = true;
    clearTimeout(timer);
  }
}

/** One read-only EIP-1193 connection organ. No chain switch, signing or send methods. */
// Static ABI of the repository's Trigger, Position and Brain events.
const TRADING_EVENT = Object.freeze({
  created: '0x4ceaea0569072c9203c8c195ffccdbca9851b9d0410f577878a6792f12ec9b52',
  filled: '0xc75938696bc974b3973ac0c1440e2ee3e9240af3b97c884edc4dc153be013e7b',
  terminated: '0x9586bccc10ad0a2b2ead8a4993ea6bcced8c812a6ddf3baad33149302e2c0711',
  opened: '0xf205f93106e5473b4b41a75e235b6844f9bc4223059a79a7209c93062965b567',
  closed: '0x630931d0062d79ef241caf9a148fc106b8fb56e25c376c883a7eb67955fc8205',
  liquidated: '0xd4a3c8d47f17fe9a2481e9c0dfa0721e7a2f7d0b12c77279f5b2dcf791b4e696',
  settled: '0xfa5c660562cd5226d312d9c6808d38badcfa193228341d8ea9c551ecef4f68e0',
  claim: '0x09ac49600517f47d30ffc298cf1a682db32aee67c0debfe0ba6eaedac3ec8ea6',
});

function tradeEvidence(condition, reason = 'EVENT_OR_CALL_MISMATCH') {
  if (!condition) throw new Error(reason);
}

function abiWords(data, count) {
  tradeEvidence(typeof data === 'string' && data.length === 2 + 64 * count && /^0x[0-9a-f]*$/i.test(data));
  return (data.slice(2).match(/.{64}/g) ?? []).map(word => '0x' + word.toLowerCase());
}

function callWords(tx, selector, count) {
  tradeEvidence(typeof tx.input === 'string' && tx.input.slice(0, 10).toLowerCase() === selector);
  return abiWords('0x' + tx.input.slice(10), count);
}

function logBelongs(log, receipt) {
  return log && log.removed !== true && matchesHex(log.blockHash, receipt.blockHash) &&
    matchesHex(log.transactionHash, receipt.transactionHash) && log.blockNumber === receipt.blockNumber &&
    log.transactionIndex === receipt.transactionIndex && RPC_QUANTITY.test(log.logIndex);
}

function tradeEvent(receipt, address, signature, topicCount, dataCount) {
  const events = receipt.logs.filter(log => matchesHex(log?.address, address) && matchesHex(log?.topics?.[0], signature));
  tradeEvidence(events.length === 1, 'EVENT_MISSING_OR_AMBIGUOUS');
  const [event] = events;
  tradeEvidence(logBelongs(event, receipt) && Array.isArray(event.topics) && event.topics.length === topicCount &&
    event.topics.every(topic => HASH32.test(topic)));
  return {event, topics: event.topics, data: abiWords(event.data, dataCount)};
}

function exactDiscovery(found, actual) {
  tradeEvidence(found.logIndex === actual.logIndex && matchesHex(found.blockHash, actual.blockHash) &&
    found.blockNumber === actual.blockNumber && found.transactionIndex === actual.transactionIndex &&
    matchesHex(found.transactionHash, actual.transactionHash) && matchesHex(found.address, actual.address) &&
    Array.isArray(found.topics) && found.topics.length === actual.topics.length &&
    found.topics.every((topic, i) => matchesHex(topic, actual.topics[i])) && matchesHex(found.data, actual.data));
}

async function nextTradeLog(request, start, tip, address, signatures, id) {
  const first = BigInt(start), last = BigInt(tip);
  // Some BSC providers cap eth_getLogs by block range. Never infer that an
  // order or position is still open beyond a range we actually searched.
  const limit = first + 4095n, end = last < limit ? last : limit;
  for (let from = first; from <= end; from += 512n) {
    const to = from + 511n < end ? from + 511n : end;
    const hex = n => '0x' + n.toString(16);
    const logs = await request('eth_getLogs', [{address, topics: [signatures, id], fromBlock: hex(from), toBlock: hex(to)}]);
    tradeEvidence(Array.isArray(logs) && logs.length <= 1, 'LOG_SEARCH_AMBIGUOUS');
    if (logs.length) {
      const [log] = logs;
      tradeEvidence(log?.removed !== true && matchesHex(log?.address, address) &&
        signatures.some(signature => matchesHex(log?.topics?.[0], signature)) && matchesHex(log?.topics?.[1], id) &&
        HASH32.test(log.transactionHash) && RPC_QUANTITY.test(log.blockNumber) &&
        BigInt(log.blockNumber) >= from && BigInt(log.blockNumber) <= to);
      return log;
    }
  }
  if (end < last) {
    const error = new Error('SEARCH_WINDOW_INCOMPLETE');
    error.throughBlock = '0x' + end.toString(16);
    throw error;
  }
  return null;
}

function follows(previous, next) {
  return BigInt(next.blockNumber) > BigInt(previous.blockNumber) ||
    (next.blockNumber === previous.blockNumber && BigInt(next.transactionIndex) > BigInt(previous.transactionIndex));
}

export async function readK11520TradingReceipt({provider, manifest, account, txHash, cursor = null} = {}) {
  const binding = reviewedBinding(manifest, true);
  const output = (status, fields = {}) => ({ok: ['ORDER_CREATED','ORDER_FILLED','POSITION_CLOSED',
    'POSITION_LIQUIDATED','ORDER_CANCELLED','ORDER_REJECTED'].includes(status), status, txHash, ...fields});
  if (!binding) return output('BINDING_UNAVAILABLE');
  if (!HASH32.test(txHash) || /^0x0{64}$/i.test(txHash) || !EVM_ADDRESS.test(account) ||
      /^0x0{40}$/i.test(account) || binding.roles.some(([address]) => matchesHex(address, account))) return output('INVALID_INPUT');
  if (typeof provider?.request !== 'function') return output('UNKNOWN', {reason: 'PROVIDER_UNAVAILABLE'});
  let done = false, timer, lastKnown = null, tip;
  const checked = new Map();
  const request = async (method, params = []) => {
    tradeEvidence(!done, 'READ_EXPIRED');
    try { return await provider.request({method, params}); }
    catch { throw new Error('RPC_READ_UNAVAILABLE'); }
  };
  const walletWord = '0x' + padAddress(account);
  const balanceScope = 'BRAIN_PRINCIPAL_ONLY_NO_WALLET_TRANSFER_EVIDENCE';
  async function context() {
    const [chain, accounts] = await Promise.all([request('eth_chainId'), request('eth_accounts')]);
    tradeEvidence(parseChainId(chain) === KGEN_CHAIN_ID, 'WRONG_CHAIN');
    tradeEvidence(Array.isArray(accounts) && matchesHex(accounts[0], account), 'ACCOUNT_MISMATCH');
  }
  async function stage(hash) {
    const [tx, receipt] = await Promise.all([request('eth_getTransactionByHash', [hash]), request('eth_getTransactionReceipt', [hash])]);
    tradeEvidence(tx, 'TRANSACTION_NOT_FOUND');
    tradeEvidence(matchesHex(tx.hash, hash) && EVM_ADDRESS.test(tx.from) && matchesHex(tx.to, binding.trigger) &&
      transactionChain(tx) === BigInt(KGEN_CHAIN_ID) && tx.value === '0x0', 'TRANSACTION_MISMATCH');
    if (!receipt) return {tx, receipt: null};
    tradeEvidence(matchesHex(receipt.from, tx.from) && matchesHex(receipt.to, tx.to) &&
      matchesHex(receipt.transactionHash, hash) && HASH32.test(receipt.blockHash) &&
      matchesHex(receipt.blockHash, tx.blockHash) && RPC_QUANTITY.test(receipt.blockNumber) &&
      receipt.blockNumber === tx.blockNumber && receipt.transactionIndex === tx.transactionIndex &&
      Array.isArray(receipt.logs), 'RECEIPT_IDENTITY');
    const block = await request('eth_getBlockByNumber', [receipt.blockNumber, false]);
    tradeEvidence(includedInBlock(block, receipt), 'CANONICAL_BLOCK_UNCONFIRMED');
    if (!checked.has(receipt.blockNumber)) {
      tradeEvidence(await bindingAt(request, binding, receipt.blockNumber), 'DEPLOYMENT_CODE_OR_ROUTING');
      checked.set(receipt.blockNumber, block.hash);
    } else tradeEvidence(matchesHex(checked.get(receipt.blockNumber), block.hash), 'CANONICAL_BLOCK_UNCONFIRMED');
    return {tx, receipt};
  }
  async function withKeeper(tx, receipt) {
    const keeper = await request('eth_call', [{to: binding.trigger, data: '0xaced1661'}, receipt.blockNumber]);
    tradeEvidence(matchesHex(keeper, '0x' + padAddress(tx.from)), 'KEEPER_IDENTITY_UNCONFIRMED');
  }
  function pin(number, hash) {
    tradeEvidence(!checked.has(number) || matchesHex(checked.get(number), hash), 'CANONICAL_BLOCK_UNCONFIRMED');
    checked.set(number, hash);
  }
  async function checkOpenState(phase, id, tag, order) {
    const isOrder = phase === 'ORDER';
    const encoded = await request('eth_call', [{
      to: isOrder ? binding.trigger : binding.position,
      data: (isOrder ? '0x21603f43' : '0xa227aebb') + id.slice(2),
    }, tag]); // Trigger.order(id) and Position.positionSnapshot(id); both structs contain only static ABI types.
    const state = abiWords(encoded, isOrder ? 15 : 12);
    tradeEvidence(BigInt(state[11]) === 1n && matchesHex(state[isOrder ? 1 : 0], walletWord),
      'OPEN_STATE_NOT_CONFIRMED');
    if (isOrder) tradeEvidence(matchesHex(state[0], id) && matchesHex(state[2], order.market) &&
      matchesHex(state[3], order.c) && matchesHex(state[4], order.lots) && matchesHex(state[5], order.trigger));
    else tradeEvidence(matchesHex(state[1], order.market));
  }
  async function searchStart(phase, initial, id, order) {
    if (!cursor || cursor.phase !== phase) return initial;
    tradeEvidence(cursor.chainId === KGEN_CHAIN_ID && matchesHex(cursor.account, account) && matchesHex(cursor.txHash, txHash) &&
      RPC_QUANTITY.test(cursor.throughBlock) && HASH32.test(cursor.throughBlockHash) &&
      BigInt(cursor.throughBlock) >= BigInt(initial) && BigInt(cursor.throughBlock) <= BigInt(tip.number), 'CURSOR_INVALID');
    const block = await request('eth_getBlockByNumber', [cursor.throughBlock, false]);
    tradeEvidence(block?.number === cursor.throughBlock && matchesHex(block.hash, cursor.throughBlockHash), 'CURSOR_BLOCK_CHANGED');
    pin(block.number, block.hash);
    // A supplied cursor is a lookup hint. The terminal transitions are one-way;
    // the contract's historical state must prove no matching event was skipped.
    await checkOpenState(phase, id, block.number, order);
    return '0x' + (BigInt(block.number) + 1n).toString(16);
  }
  async function read() {
    await context();
    const created = await stage(txHash);
    tradeEvidence(matchesHex(created.tx.from, account), 'ORDER_TRADER_MISMATCH');
    const [market, c, lots, trigger] = callWords(created.tx, '0x53ce9741', 4);
    tradeEvidence(BigInt(market) < 3n && BigInt(c) !== 0n && BigInt(lots) > 0n && BigInt(trigger) > 0n);
    const creation = created.receipt;
    if (!creation) {
      const pending = ['blockHash','blockNumber','transactionIndex'].every(key => created.tx[key] === null);
      return output(pending ? 'PENDING' : 'UNKNOWN', {reason: 'RECEIPT_NOT_AVAILABLE'});
    }
    if (creation.status === '0x0') return output('REVERTED');
    tradeEvidence(creation.status === '0x1', 'RECEIPT_STATUS_UNAVAILABLE');
    const {topics: [, orderId, trader]} = tradeEvent(creation, binding.trigger, TRADING_EVENT.created, 3, 0);
    tradeEvidence(matchesHex(trader, walletWord) && BigInt(orderId) > 0n);
    const anchor = {account, orderId: BigInt(orderId).toString(), creationTxHash: txHash, market: Number(BigInt(market)),
      cWad: BigInt.asIntN(256, BigInt(c)).toString(), lots: BigInt(lots).toString(),
      triggerPriceWad: BigInt(trigger).toString(), balanceScope};
    lastKnown = output('ORDER_CREATED', anchor);
    tip = await request('eth_getBlockByNumber', ['latest', false]);
    tradeEvidence(HASH32.test(tip?.hash) && RPC_QUANTITY.test(tip.number) &&
      BigInt(tip.number) >= BigInt(creation.blockNumber), 'CANONICAL_BLOCK_UNCONFIRMED');
    const terms = {market, c, lots, trigger};
    tradeEvidence(!cursor || ['ORDER','POSITION'].includes(cursor.phase), 'CURSOR_INVALID');
    let found, next;
    if (cursor?.phase === 'POSITION') {
      tradeEvidence(HASH32.test(cursor.fillTxHash) && matchesHex(cursor.account, account) &&
        matchesHex(cursor.txHash, txHash) && cursor.chainId === KGEN_CHAIN_ID, 'CURSOR_INVALID');
      next = await stage(cursor.fillTxHash);
      tradeEvidence(next.receipt, 'FILL_RECEIPT_NOT_AVAILABLE');
      found = tradeEvent(next.receipt, binding.trigger, TRADING_EVENT.filled, 3, 1).event;
      tradeEvidence(matchesHex(found.topics[1], orderId) && BigInt(found.blockNumber) <= BigInt(tip.number));
    } else {
      const start = await searchStart('ORDER', creation.blockNumber, orderId, terms);
      found = await nextTradeLog(request, start, tip.number, binding.trigger,
        [TRADING_EVENT.filled, TRADING_EVENT.terminated], orderId);
      if (!found) { await checkOpenState('ORDER', orderId, tip.number, terms); return lastKnown; }
      next = await stage(found.transactionHash);
    }
    const fill = next.receipt;
    tradeEvidence(fill?.status === '0x1' && follows(creation, fill));
    if (matchesHex(found.topics[0], TRADING_EVENT.terminated)) {
      const terminal = tradeEvent(fill, binding.trigger, TRADING_EVENT.terminated, 2, 1);
      exactDiscovery(found, terminal.event);
      const kind = BigInt(terminal.data[0]);
      tradeEvidence(kind === 3n || kind === 4n);
      const [id] = callWords(next.tx, kind === 3n ? '0x514fcac7' : '0xf814fd4e', 1);
      tradeEvidence(matchesHex(id, orderId));
      if (kind === 3n) tradeEvidence(matchesHex(next.tx.from, account)); else await withKeeper(next.tx, fill);
      return output(kind === 3n ? 'ORDER_CANCELLED' : 'ORDER_REJECTED', {...anchor, terminationTxHash: fill.transactionHash});
    }
    const [observedOrder] = callWords(next.tx, '0xee0f2054', 1);
    tradeEvidence(matchesHex(observedOrder, orderId));
    await withKeeper(next.tx, fill);
    const filled = tradeEvent(fill, binding.trigger, TRADING_EVENT.filled, 3, 1);
    exactDiscovery(found, filled.event);
    const positionId = filled.topics[2];
    const opened = tradeEvent(fill, binding.position, TRADING_EVENT.opened, 4, 4);
    const [size, margin, entry, positionKey] = opened.data;
    tradeEvidence(BigInt(positionId) > 0n && matchesHex(opened.topics[1], positionId) &&
      matchesHex(opened.topics[2], walletWord) && matchesHex(opened.topics[3], market) &&
      BigInt(entry) > 0n && matchesHex(filled.data[0], entry) && BigInt(margin) === BigInt(lots) * 10n ** 18n &&
      BigInt.asIntN(256, BigInt(size)) === BigInt(margin) * BigInt.asIntN(256, BigInt(c)) / BigInt(entry) &&
      BigInt(opened.event.logIndex) < BigInt(filled.event.logIndex) && BigInt(positionKey) > 0n);
    const position = {...anchor, fillTxHash: fill.transactionHash, positionId: BigInt(positionId).toString(),
      entryPriceWad: BigInt(entry).toString(), marginWei: BigInt(margin).toString()};
    lastKnown = output('ORDER_FILLED', position);
    const closeStart = await searchStart('POSITION', fill.blockNumber, positionId, terms);
    const end = await nextTradeLog(request, closeStart, tip.number, binding.position,
      [TRADING_EVENT.closed, TRADING_EVENT.liquidated], positionId);
    if (!end) { await checkOpenState('POSITION', positionId, tip.number, terms); return lastKnown; }
    const final = await stage(end.transactionHash), close = final.receipt;
    tradeEvidence(close?.status === '0x1' && follows(fill, close));
    const byKeeper = final.tx.input?.slice(0,10).toLowerCase() === '0x7891ebc6';
    const [targetId] = callWords(final.tx, byKeeper ? '0x7891ebc6' : '0xa126d601', 1);
    tradeEvidence(matchesHex(targetId, positionId));
    if (byKeeper) await withKeeper(final.tx, close); else tradeEvidence(matchesHex(final.tx.from, account));
    const liquidated = matchesHex(end.topics[0], TRADING_EVENT.liquidated);
    const closing = tradeEvent(close, binding.position, end.topics[0], 2, 4);
    exactDiscovery(end, closing.event);
    const ledger = tradeEvent(close, binding.brain, TRADING_EVENT.settled, 3, 5);
    const [exit, raw, realized, debt] = closing.data;
    tradeEvidence(matchesHex(ledger.topics[1], positionKey) && matchesHex(ledger.topics[2], walletWord) &&
      matchesHex(ledger.data[0], margin) && matchesHex(ledger.data[1], realized) && matchesHex(ledger.data[2], debt) &&
      BigInt(exit) > 0n && BigInt(ledger.event.logIndex) < BigInt(closing.event.logIndex));
    const pnl = BigInt.asIntN(256, BigInt(realized));
    let claim = {claimStatus: pnl > 0n ? 'CLAIM_EVENT_UNAVAILABLE' : 'NO_PROFIT_CLAIM'};
    if (close.logs.some(log => matchesHex(log?.address, binding.brain) && matchesHex(log?.topics?.[0], TRADING_EVENT.claim))) {
      const credited = tradeEvent(close, binding.brain, TRADING_EVENT.claim, 3, 3);
      const [due, paid, remaining] = credited.data.map(word => BigInt(word));
      tradeEvidence(pnl > 0n && due === pnl && paid + remaining === due && paid <= BigInt(ledger.data[4]) &&
        matchesHex(credited.topics[1], positionKey) && matchesHex(credited.topics[2], walletWord) &&
        BigInt(credited.event.logIndex) < BigInt(ledger.event.logIndex), 'PROFIT_CLAIM_MISMATCH');
      claim = {claimStatus: 'VERIFIED_AT_CLOSE', dueWei: due.toString(), paidWei: paid.toString(), remainingClaimWei: remaining.toString()};
    }
    return output(liquidated ? 'POSITION_LIQUIDATED' : 'POSITION_CLOSED', {...position, ...claim, closeTxHash: close.transactionHash,
      exitPriceWad: BigInt(exit).toString(), rawPnlWei: BigInt.asIntN(256, BigInt(raw)).toString(),
      realizedPnlWei: pnl.toString(), badDebtWei: BigInt(debt).toString(),
      principalAfterWei: BigInt(ledger.data[4]).toString()});
  }
  async function verify() {
    let result;
    try { result = await read(); }
    catch (error) {
      if (['ACCOUNT_MISMATCH','WRONG_CHAIN'].includes(error.message)) return output(error.message);
      const details = {reason: error.message, lastKnown};
      if (error.message === 'SEARCH_WINDOW_INCOMPLETE' && lastKnown && RPC_QUANTITY.test(error.throughBlock)) {
        const block = await request('eth_getBlockByNumber', [error.throughBlock, false]);
        tradeEvidence(block?.number === error.throughBlock && HASH32.test(block.hash), 'CANONICAL_BLOCK_UNCONFIRMED');
        pin(block.number, block.hash);
        details.nextCursor = {chainId: KGEN_CHAIN_ID, account, txHash, phase: lastKnown.fillTxHash ? 'POSITION' : 'ORDER',
          throughBlock: block.number, throughBlockHash: block.hash, ...(lastKnown.fillTxHash ? {fillTxHash: lastKnown.fillTxHash} : {})};
      }
      result = output('UNKNOWN', details);
    }
    if (tip) pin(tip.number, tip.hash);
    for (const [number, hash] of checked) {
      const canonical = await request('eth_getBlockByNumber', [number, false]);
      if (canonical?.number !== number || !matchesHex(canonical.hash, hash)) return output('UNKNOWN', {reason: 'CANONICAL_BLOCK_UNCONFIRMED'});
    }
    await context();
    return {...result, ...(tip ? {snapshotBlock: tip.number, snapshotBlockHash: tip.hash} : {})};
  }
  try {
    return await Promise.race([verify(), new Promise(resolve => {
      timer = setTimeout(() => resolve(output('UNKNOWN', {reason: 'RPC_TIMEOUT'})), 20000);
    })]);
  } catch (error) {
    return ['WRONG_CHAIN','ACCOUNT_MISMATCH'].includes(error.message) ? output(error.message) :
      output('UNKNOWN', {reason:error.message === 'CANONICAL_BLOCK_UNCONFIRMED' ? error.message : 'RPC_READ_UNAVAILABLE'});
  } finally {
    done = true;
    clearTimeout(timer);
  }
}

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
  async function receiptForSession(reader, {manifest, txHash, amountWei, cursor} = {}) {
    const ticket = generation, account = state.account, selected = provider;
    const unavailable = reason => ({ok: false, status: 'UNKNOWN', reason, txHash});
    if (!current(ticket) || !account || !selected) return unavailable('WALLET_NOT_CONNECTED');
    if (state.chainId !== KGEN_CHAIN_ID) return {ok: false, status: 'WRONG_CHAIN', txHash};
    const scoped = {request(args) {
      if (!current(ticket) || provider !== selected) throw new Error('WALLET_SESSION_CHANGED');
      return selected.request(args);
    }};
    const result = await reader({manifest, account, txHash, amountWei, cursor, provider: scoped});
    return current(ticket) && selected === provider ? result : unavailable('WALLET_SESSION_CHANGED');
  }
  return Object.freeze({
    connect:()=>attach()?sync({prompt:true}):Promise.resolve(snapshot()),
    refresh:()=>attach()?sync():Promise.resolve(snapshot()),
    disconnect:()=>detach(),snapshot,
    readWithdrawalReceipt:input=>receiptForSession(readK11520WithdrawalReceipt,input),
    readTradingReceipt:input=>receiptForSession(readK11520TradingReceipt,input),
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
