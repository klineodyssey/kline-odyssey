/* KGEN_META
VERSION: 1.0.0
REVISION: 2026-10-07.BSC56-KGEN-TRANSFER-READONLY-PREPARATION
PRODUCT_CONTEXT: V2.9.5
STATUS: CANDIDATE
LAST_UPDATED: 2026-10-07
UPDATED_BY: dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER / HUMAN_AUTHORIZED_2026_10_05
REVIEWED_BY: dot / scoped self-review / 2026-10-07; session preparation review pending, no handoff or release approval
SOURCE_COMMIT: a1eaed4f332486d1301f8b38c5dab2df53470731
TASK_ID: K11520-BSC56-KGEN-TRANSFER-20261007
CHANGE_REASON: Add existing-session bounded read-only transfer preparation with approved codec, pinned facts and generation fencing; no wallet handoff.
ANCESTOR: K線西遊記/temples/11520/runtime/evm-wallet-runtime.mjs @ a1eaed4f332486d1301f8b38c5dab2df53470731
SOURCE_OF_TRUTH: TRUE
*/
import {normalizeSignedC,signedPositionSide,requiredMargin,createKgenLedger} from './kgen-margin-runtime.mjs';
import {requireV1TradingC} from '../controls/nonlinear-controls.mjs';
const ERC20_BALANCE_OF='0x70a08231';
export const PUBLIC_WALLET_IDENTITY_KEY='klineodyssey.public-wallet-identity.v1';
export const PLAYER_SESSION_KEY='k11520.player-session.v1';
export const KGEN_TOKEN_ADDRESS='0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be';
export const KGEN_CHAIN_ID=56;
const EVM_ADDRESS=/^0x[0-9a-fA-F]{40}$/;
// Source-bound canonical expectation from the existing Mainnet manifest:
// nonOraclePreparation20260930.publicReadback.tokenCodeHash. This pin is an
// identity check, not a claim that source-to-bytecode recompilation was done.
export const KGEN_BSC56_TOKEN_CODE_HASH='0x251cff271c2c754743f9eb3bc11982163fd7ca756e0b0378cb0358418ffeecc1';
export const KGEN_BSC56_TRANSFER_ABI=Object.freeze(['function transfer(address to,uint256 value) returns(bool)','event Transfer(address indexed from,address indexed to,uint256 value)']);

/** Pure input-metadata review. No provider, session mutation, wallet request,
 * signature, allowance, storage, receipt or simulation-ledger side effect.
 * Codec is caller-supplied: method shape is checked, not module authenticity.
 * Only a future session-owned approved codec and fresh readback can support a wallet handoff. */
export function buildBsc56KgenTransferReview(input,{ethers}={}){
  const topKeys=['chainId','sender','recipient','amountKgen','nonce','gasLimit','gasPriceWei','maximumGasFeeWei','readback'];
  const readKeys=['chainId','tokenAddress','sender','recipient','tokenCodeHash','sourceCommit','blockNumber','blockHash','pendingNonce','tokenBalanceWei','nativeBalanceWei','senderTaxExempt','recipientTaxExempt','senderMarketMakerPair','recipientMarketMakerPair','recipientCodePresent'];
  let bytes=0;const encoder=new TextEncoder();
  const copy=(value,keys,nested=false)=>{
    if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw new Error('TRANSFER_PLAIN_DATA_REQUIRED');
    const descriptors=Object.getOwnPropertyDescriptors(value),names=Reflect.ownKeys(descriptors);
    if(names.length!==keys.length||names.some(k=>typeof k!=='string'||!keys.includes(k)))throw new Error('TRANSFER_EXACT_FIELDS_REQUIRED');
    const result={};for(const key of keys){
      const descriptor=descriptors[key];if(!descriptor||!Object.hasOwn(descriptor,'value')||!descriptor.enumerable)throw new Error('TRANSFER_ACCESSOR_FORBIDDEN');
      const v=descriptor.value;
      if(key==='readback'&&!nested){result[key]=copy(v,readKeys,true);continue}
      if(!['string','number','boolean'].includes(typeof v))throw new Error('TRANSFER_PRIMITIVE_REQUIRED');
      if(typeof v==='string'){bytes+=encoder.encode(v).length;if(v.length>1024||bytes>8192)throw new Error('TRANSFER_INPUT_BUDGET_EXCEEDED')}
      result[key]=v;
    }return result;
  };
  // Snapshot every used field before any codec callback can mutate its origin.
  const data=copy(input,topKeys),r=data.readback;
  if(typeof ethers?.Interface!=='function'||typeof ethers?.getAddress!=='function'||typeof ethers?.keccak256!=='function'||typeof ethers?.toUtf8Bytes!=='function')throw new Error('TRANSFER_CODEC_INTERFACE_REQUIRED');
  const uint=(value,label,{zero=false,max=(1n<<256n)-1n}={})=>{
    if(typeof value!=='string'||value.length>78||!/^(0|[1-9][0-9]*)$/.test(value))throw new Error('TRANSFER_'+label+'_UINT_REQUIRED');
    const n=BigInt(value);if((zero?n<0n:n<=0n)||n>max)throw new Error('TRANSFER_'+label+'_OUT_OF_RANGE');return n;
  };
  const address=(value,label)=>{
    if(typeof value!=='string'||!EVM_ADDRESS.test(value)||/^0x0{40}$/i.test(value))throw new Error('TRANSFER_'+label+'_ADDRESS_INVALID');
    try{return ethers.getAddress(value)}catch{throw new Error('TRANSFER_'+label+'_CHECKSUM_INVALID')}
  };
  if(data.chainId!==KGEN_CHAIN_ID||r.chainId!==KGEN_CHAIN_ID)throw new Error('TRANSFER_CHAIN56_REQUIRED');
  const sender=address(data.sender,'SENDER'),recipient=address(data.recipient,'RECIPIENT'),token=address(r.tokenAddress,'TOKEN');
  if(token!==ethers.getAddress(KGEN_TOKEN_ADDRESS)||r.tokenCodeHash!==KGEN_BSC56_TOKEN_CODE_HASH)throw new Error('TRANSFER_CANONICAL_TOKEN_IDENTITY_REQUIRED');
  if(address(r.sender,'READBACK_SENDER')!==sender||address(r.recipient,'READBACK_RECIPIENT')!==recipient)throw new Error('TRANSFER_READBACK_ACCOUNT_MISMATCH');
  if(recipient===sender||recipient===token)throw new Error('TRANSFER_SELF_OR_TOKEN_RECIPIENT_FORBIDDEN');
  if(typeof r.sourceCommit!=='string'||! /^[0-9a-f]{40}$/.test(r.sourceCommit)||typeof r.blockHash!=='string'||! /^0x[0-9a-fA-F]{64}$/.test(r.blockHash)||/^0x0{64}$/i.test(r.blockHash))throw new Error('TRANSFER_SOURCE_BLOCK_BINDING_REQUIRED');
  uint(r.blockNumber,'BLOCK_NUMBER');
  const nonce=uint(data.nonce,'NONCE',{zero:true,max:(1n<<64n)-2n});if(r.pendingNonce!==data.nonce)throw new Error('TRANSFER_PENDING_NONCE_MISMATCH');
  const rawBalance=uint(r.tokenBalanceWei,'TOKEN_BALANCE',{zero:true}),nativeBalance=uint(r.nativeBalanceWei,'NATIVE_BALANCE',{zero:true});
  if(rawBalance>72000000n*10n**18n)throw new Error('TRANSFER_BALANCE_EXCEEDS_CANONICAL_SUPPLY');
  if(typeof data.amountKgen!=='string'||data.amountKgen.length>98||!/^(0|[1-9][0-9]*)(?:\.[0-9]{1,18})?$/.test(data.amountKgen))throw new Error('TRANSFER_EXACT_KGEN_DECIMAL_REQUIRED');
  const [whole,fraction='']=data.amountKgen.split('.'),amount=BigInt(whole)*10n**18n+BigInt(fraction.padEnd(18,'0'));
  if(amount<=0n||amount>(1n<<256n)-1n)throw new Error('TRANSFER_AMOUNT_OUT_OF_RANGE');
  if(amount>rawBalance)throw new Error('TRANSFER_INSUFFICIENT_KGEN');
  const gasLimit=uint(data.gasLimit,'GAS_LIMIT',{max:(1n<<64n)-1n}),gasPrice=uint(data.gasPriceWei,'GAS_PRICE'),gasCap=uint(data.maximumGasFeeWei,'GAS_CAP'),gasMaximum=gasLimit*gasPrice;
  if(gasMaximum>gasCap)throw new Error('TRANSFER_GAS_CAP_EXCEEDED');if(gasMaximum>nativeBalance)throw new Error('TRANSFER_INSUFFICIENT_BNB_FOR_GAS_CAP');
  for(const key of ['senderTaxExempt','recipientTaxExempt','senderMarketMakerPair','recipientMarketMakerPair','recipientCodePresent'])if(typeof r[key]!=='boolean')throw new Error('TRANSFER_TAX_AND_RECIPIENT_FLAGS_REQUIRED');
  const taxableAtReadback=!r.senderTaxExempt&&!r.recipientTaxExempt&&(r.senderMarketMakerPair||r.recipientMarketMakerPair),maximumTax=amount*30n/10000n,estimatedTax=taxableAtReadback?maximumTax:0n;
  const quantity=n=>'0x'+n.toString(16),calldata=new ethers.Interface(KGEN_BSC56_TRANSFER_ABI).encodeFunctionData('transfer',[recipient,amount.toString()]);
  const transaction={chainId:quantity(BigInt(KGEN_CHAIN_ID)),type:'0x0',from:sender,to:token,value:'0x0',nonce:quantity(nonce),gas:quantity(gasLimit),gasPrice:quantity(gasPrice),data:calldata};
  const taxObservation={senderTaxExempt:r.senderTaxExempt,recipientTaxExempt:r.recipientTaxExempt,senderMarketMakerPair:r.senderMarketMakerPair,recipientMarketMakerPair:r.recipientMarketMakerPair,taxableAtReadback,estimatedTaxWei:estimatedTax.toString(),primaryRecipientTransferAtReadbackWei:(amount-estimatedTax).toString(),maximumTaxIfFlagsChangeWei:maximumTax.toString(),minimumNetIfOnlyTaxFlagsChangeWei:(amount-maximumTax).toString(),miningTimeNetGuaranteed:false};
  const review={CHAIN:{name:'BNB Smart Chain Mainnet',chainId:56},WALLET:sender,RECIPIENT:recipient,CONTRACT:token,FUNCTION:'transfer(address,uint256)',TOKEN:{symbol:'KGEN',address:token,decimals:18},AMOUNT:{inputKgen:data.amountKgen,canonicalKgen:formatUnits(amount,18),baseUnits:amount.toString(),decimals:18},EXPECTED_EFFECT:'Request a KGEN transfer to the exact displayed recipient. This does not swap, approve, deposit margin or settle a trade. Recipient net is an observation, not a mining-time promise.',MAXIMUM_EXPOSURE:{walletTokenDebitWei:amount.toString(),nativeGasFeeWei:gasMaximum.toString(),approvedGasFeeCapWei:gasCap.toString(),nativeTransferValueWei:'0',allowanceChanged:false},taxObservation,recipientCodePresentAtReadback:r.recipientCodePresent};
  const intentDigest=ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({transaction,readback:r,review})));
  const freeze=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v)}return v};
  return freeze({schema:'K11520_BSC56_KGEN_TRANSFER_REVIEW_V1',status:'UNSIGNED_INPUT_REVIEW_ONLY',scope:'INPUT_METADATA_ONLY_NOT_CHAIN_VERIFIED',transactionFormat:'EIP1474_QUANTITY_UNSIGNED_REVIEW_NOT_WALLET_REQUEST',review,transaction,intentDigest,readback:r,blockers:['SESSION_OWNED_FRESH_TOKEN_BALANCE_TAX_NONCE_GAS_READBACK_REQUIRED','EXPLICIT_WALLET_OWNER_CONFIRMATION_REQUIRED','CONFIRMED_MATCHING_TRANSACTION_AND_RECEIPT_REQUIRED'],executionReady:false,walletHandoffReady:false,signerRequested:false,broadcast:false});
}

// The host JS intrinsics, module loader and WebCrypto/Node crypto are trusted.
// Verified bytes execute in fresh private CommonJS state, never require.cache or
// globalThis.ethers. A cached module exports only an immutable fresh-state factory.
// Browser CSP is not changed: denied private Blob modules fail preparation closed.
const KGEN_TRANSFER_CODEC_INTEGRITY='sha384-Htz1SE4Sl5aitpvFgr2j0sfsGUIuSXI6t8hEyrlQ93zflEF3a29bH2AvkUROUw7J';
const KGEN_TRANSFER_BUILDER_REVIEWED_COMMIT='a1eaed4f332486d1301f8b38c5dab2df53470731';
let kgenTransferCodecPromise;
function kgenTransferCodecModuleSource(source){
  return `const instantiate=()=>{const module={exports:{}};const exports=module.exports;\n${source}\n;
const library=module.exports.ethers;if(library?.version!=='ethers/5.7.2'||!library.utils)throw new Error('TRANSFER_APPROVED_CODEC_REQUIRED');
const u=library.utils;const Interface=function(fragments){const inner=new u.Interface(fragments);const encoder=Object.create(null);Object.defineProperty(encoder,'encodeFunctionData',{enumerable:true,value:Object.freeze((name,args)=>inner.encodeFunctionData(name,args))});return Object.freeze(encoder)};
Object.freeze(Interface.prototype);Object.freeze(Interface);const codec=Object.create(null);
Object.assign(codec,{Interface,getAddress:Object.freeze(value=>u.getAddress(value)),keccak256:Object.freeze(value=>u.keccak256(value)),toUtf8Bytes:Object.freeze(value=>u.toUtf8Bytes(value))});return Object.freeze(codec)};export default Object.freeze(instantiate);`;
}
function approvedKgenTransferCodec(){
  if(kgenTransferCodecPromise)return kgenTransferCodecPromise;
  kgenTransferCodecPromise=(async()=>{
    let namespace;
    if(typeof document==='undefined'){
      const [{readFile},{createHash}]=await Promise.all([import('node:fs/promises'),import('node:crypto')]);
      const bytes=await readFile(new URL('../../../assets/ethers-5.7.2.umd.min.js',import.meta.url));
      if(bytes.length>1048576||'sha384-'+createHash('sha384').update(bytes).digest('base64')!==KGEN_TRANSFER_CODEC_INTEGRITY)throw new Error('TRANSFER_CODEC_INTEGRITY_MISMATCH');
      namespace=await import('data:text/javascript;base64,'+Buffer.from(kgenTransferCodecModuleSource(bytes.toString('utf8'))).toString('base64'));
    }else{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);let bytes;
      try{
        const response=await fetch(new URL('../../../assets/ethers-5.7.2.umd.min.js',import.meta.url),{cache:'no-store',credentials:'same-origin',integrity:KGEN_TRANSFER_CODEC_INTEGRITY,signal:controller.signal});
        if(!response.ok||!response.body)throw new Error('TRANSFER_CODEC_FETCH_FAILED');
        const reader=response.body.getReader(),chunks=[];let size=0;
        while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>1048576){await reader.cancel();throw new Error('TRANSFER_CODEC_BYTES_EXCEEDED')}chunks.push(part.value)}
        bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
      }finally{clearTimeout(timer)}
      const digest=new Uint8Array(await crypto.subtle.digest('SHA-384',bytes));
      if('sha384-'+btoa(String.fromCharCode(...digest))!==KGEN_TRANSFER_CODEC_INTEGRITY)throw new Error('TRANSFER_CODEC_INTEGRITY_MISMATCH');
      const url=URL.createObjectURL(new Blob([kgenTransferCodecModuleSource(new TextDecoder('utf-8',{fatal:true}).decode(bytes))],{type:'text/javascript'}));
      try{namespace=await import(url)}catch{throw new Error('TRANSFER_PRIVATE_CODEC_MODULE_BLOCKED')}finally{URL.revokeObjectURL(url)}
    }
    return namespace.default();
  })().catch(error=>{kgenTransferCodecPromise=null;throw error});
  return kgenTransferCodecPromise;
}

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

/** One read-only EIP-1193 connection organ. No chain switch, signing or send methods. */
export function createWalletSession({ethereum,storage,timeoutMs=12000}={}){
  let provider=null,stopWatch=()=>{},generation=0,disposed=false,active=false;
  const listeners=new Set();
  let state={account:null,chainId:null,status:'DISCONNECTED',error:null,kgen:null,bnb:null,network:null,balanceReadOnly:true,executionMode:'SIMULATION'};
  const snapshot=()=>Object.freeze({...state});
  const publish=patch=>{invalidateTransferReview('TRANSFER_WALLET_CONTEXT_CHANGED');state={...state,...patch};const value=snapshot();for(const listener of listeners){try{listener(value)}catch{}}return value};
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
  // Read-only preparation is owned by this same provider/session. Pure review
  // objects and caller-supplied digests cannot become a handoff capability.
  let transferGeneration=0,transferState=Object.freeze({status:'EMPTY',reason:'TRANSFER_INPUT_REQUIRED',review:null,executionReady:false,walletHandoffReady:false,signerRequested:false,broadcast:false});
  const transferSnapshot=()=>transferState;
  function invalidateTransferReview(reason='TRANSFER_INPUT_CHANGED'){
    ++transferGeneration;transferState=Object.freeze({status:'EMPTY',reason,review:null,executionReady:false,walletHandoffReady:false,signerRequested:false,broadcast:false});return transferState;
  }
  async function prepareKgenTransfer(input){
    const ownKeys=['recipient','amountKgen','gasLimit','gasPriceWei','maximumGasFeeWei'];let draft,calls=0;
    const blocked=reason=>Object.freeze({status:'BLOCKED',reason,review:null,rpcReadCount:calls,executionReady:false,walletHandoffReady:false,signerRequested:false,broadcast:false});
    invalidateTransferReview();const ticket=transferGeneration,walletTicket=generation,sender=state.account;
    const stillCurrent=()=>!disposed&&active&&!!provider&&ticket===transferGeneration&&walletTicket===generation&&state.status==='CONNECTED'&&state.chainId===KGEN_CHAIN_ID&&state.account===sender;
    const fail=reason=>{if(ticket===transferGeneration)transferState=blocked(reason);return transferState};
    if(!stillCurrent())return fail('TRANSFER_ACTIVE_CHAIN56_SESSION_REQUIRED');
    try{
      if(!input||typeof input!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(input)))throw new Error('TRANSFER_PREPARATION_FIELDS_REQUIRED');
      const ds=Object.getOwnPropertyDescriptors(input),keys=Reflect.ownKeys(ds);
      if(keys.length!==ownKeys.length||keys.some(k=>!ownKeys.includes(k)))throw new Error('TRANSFER_PREPARATION_FIELDS_REQUIRED');
      draft={};for(const key of ownKeys){const d=ds[key];if(!d||!Object.hasOwn(d,'value')||!d.enumerable||typeof d.value!=='string'||d.value.length>98)throw new Error('TRANSFER_PREPARATION_PLAIN_STRINGS_REQUIRED');draft[key]=d.value}Object.freeze(draft);
      transferState=Object.freeze({status:'READING',reason:'PINNED_READ_ONLY_PREPARATION',review:null,executionReady:false,walletHandoffReady:false,signerRequested:false,broadcast:false});
      const codec=await approvedKgenTransferCodec();if(!stillCurrent())return transferState;
      if(!/^(0|[1-9][0-9]*)(?:\.[0-9]{1,18})?$/.test(draft.amountKgen))throw new Error('TRANSFER_EXACT_KGEN_DECIMAL_REQUIRED');
      const [whole,fraction='']=draft.amountKgen.split('.'),amount=BigInt(whole)*10n**18n+BigInt(fraction.padEnd(18,'0'));
      if(amount<=0n||amount>72000000n*10n**18n)throw new Error('TRANSFER_AMOUNT_OUT_OF_RANGE');
      for(const key of ['gasLimit','gasPriceWei','maximumGasFeeWei'])if(!/^[1-9][0-9]{0,77}$/.test(draft[key]))throw new Error('TRANSFER_GAS_UINT_REQUIRED');
      if(BigInt(draft.gasLimit)>=(1n<<64n)||BigInt(draft.gasPriceWei)>=(1n<<256n)||BigInt(draft.maximumGasFeeWei)>=(1n<<256n)||BigInt(draft.gasLimit)*BigInt(draft.gasPriceWei)>BigInt(draft.maximumGasFeeWei))throw new Error('TRANSFER_GAS_CAP_EXCEEDED');
      const recipient=codec.getAddress(draft.recipient);if(!EVM_ADDRESS.test(recipient)||/^0x0{40}$/i.test(recipient)||recipient.toLowerCase()===sender.toLowerCase()||recipient.toLowerCase()===KGEN_TOKEN_ADDRESS.toLowerCase())throw new Error('TRANSFER_RECIPIENT_ADDRESS_INVALID');
      const field=(object,key)=>{const d=object&&Object.getOwnPropertyDescriptor(object,key);if(!d||!Object.hasOwn(d,'value'))throw new Error('TRANSFER_RPC_DATA_DESCRIPTOR_REQUIRED');return d.value};
      const capturedBlock=value=>{if(!value||typeof value!=='object')throw new Error('TRANSFER_PINNED_HEAD_UNKNOWN');return Object.freeze({number:field(value,'number'),hash:field(value,'hash'),timestamp:field(value,'timestamp')})};
      const immutable=v=>{if(v&&typeof v==='object'){for(const item of Object.values(v))immutable(item);Object.freeze(v)}return v};
      const methods=new Set(['eth_accounts','eth_chainId','eth_getBlockByNumber','eth_getCode','eth_call','eth_getBalance','eth_getTransactionCount']);
      const read=async(method,params=[])=>{
        if(!stillCurrent())throw new Error('TRANSFER_CONTEXT_CHANGED');
        if(!methods.has(method)||++calls>15)throw new Error('TRANSFER_READ_ONLY_RPC_BUDGET_EXCEEDED');
        const value=await request(immutable({method,params}));if(!stillCurrent())throw new Error('TRANSFER_CONTEXT_CHANGED');
        if(method==='eth_getBlockByNumber')return capturedBlock(value);
        if(method==='eth_accounts'){if(!Array.isArray(value)||field(value,'length')<1||field(value,'length')>64)throw new Error('TRANSFER_ACTIVE_ACCOUNT_UNKNOWN');return Object.freeze([field(value,'0')])}
        return value;
      };
      const quantity=(value,label)=>{if(typeof value!=='string'||value.length>66||!/^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/.test(value))throw new Error('TRANSFER_'+label+'_QUANTITY_INVALID');return BigInt(value)};
      const identity=(accounts,chain)=>{if(!Array.isArray(accounts)||accounts.length<1||typeof accounts[0]!=='string'||!EVM_ADDRESS.test(accounts[0])||accounts[0].toLowerCase()!==sender.toLowerCase()||quantity(chain,'CHAIN')!==56n)throw new Error('TRANSFER_ACTIVE_ACCOUNT_OR_CHAIN_CHANGED')};
      const [accounts,chain,head]=await Promise.all([read('eth_accounts'),read('eth_chainId'),read('eth_getBlockByNumber',['latest',false])]);identity(accounts,chain);
      if(!head||typeof head!=='object'||typeof head.hash!=='string'||!/^0x[0-9a-fA-F]{64}$/.test(head.hash)||/^0x0{64}$/i.test(head.hash))throw new Error('TRANSFER_PINNED_HEAD_UNKNOWN');
      const number=quantity(head.number,'BLOCK'),timestamp=quantity(head.timestamp,'BLOCK_TIME');
      if(number===0n||timestamp*1000n>BigInt(Date.now()+30000)||timestamp*1000n<BigInt(Date.now()-120000))throw new Error('TRANSFER_PINNED_HEAD_STALE_OR_FUTURE');
      const block=Object.freeze({blockHash:head.hash,requireCanonical:true});
      const abi=new codec.Interface(['function balanceOf(address) view returns(uint256)','function isTaxExempt(address) view returns(bool)','function isMarketMakerPair(address) view returns(bool)']);
      const call=(name,account)=>read('eth_call',[{to:KGEN_TOKEN_ADDRESS,data:abi.encodeFunctionData(name,[account])},block]);
      const [code,balance,native,senderExempt,recipientExempt,senderPair,recipientPair,recipientCode,nonce]=await Promise.all([
        read('eth_getCode',[KGEN_TOKEN_ADDRESS,block]),call('balanceOf',sender),read('eth_getBalance',[sender,block]),call('isTaxExempt',sender),call('isTaxExempt',recipient),call('isMarketMakerPair',sender),call('isMarketMakerPair',recipient),read('eth_getCode',[recipient,block]),read('eth_getTransactionCount',[sender,'pending'])
      ]);
      const codeBytes=value=>{if(typeof value!=='string'||value.length>131074||!/^0x(?:[0-9a-fA-F]{2})*$/.test(value))throw new Error('TRANSFER_CODE_RESPONSE_INVALID');return value};
      if(codeBytes(code)==='0x'||codec.keccak256(code)!==KGEN_BSC56_TOKEN_CODE_HASH)throw new Error('TRANSFER_CANONICAL_TOKEN_CODE_MISMATCH');
      const word=value=>{if(typeof value!=='string'||!/^0x[0-9a-fA-F]{64}$/.test(value))throw new Error('TRANSFER_ABI_RESPONSE_INVALID');return BigInt(value)};
      const flag=value=>{const n=word(value);if(n!==0n&&n!==1n)throw new Error('TRANSFER_TAX_FLAG_RESPONSE_INVALID');return n===1n};
      const readback={chainId:56,tokenAddress:KGEN_TOKEN_ADDRESS,sender,recipient,tokenCodeHash:KGEN_BSC56_TOKEN_CODE_HASH,sourceCommit:KGEN_TRANSFER_BUILDER_REVIEWED_COMMIT,blockNumber:number.toString(),blockHash:head.hash,pendingNonce:quantity(nonce,'NONCE').toString(),tokenBalanceWei:word(balance).toString(),nativeBalanceWei:quantity(native,'NATIVE_BALANCE').toString(),senderTaxExempt:flag(senderExempt),recipientTaxExempt:flag(recipientExempt),senderMarketMakerPair:flag(senderPair),recipientMarketMakerPair:flag(recipientPair),recipientCodePresent:codeBytes(recipientCode)!=='0x'};
      const [confirmedHead,confirmedAccounts,confirmedChain]=await Promise.all([read('eth_getBlockByNumber',[head.number,false]),read('eth_accounts'),read('eth_chainId')]);identity(confirmedAccounts,confirmedChain);
      if(!confirmedHead||typeof confirmedHead.hash!=='string'||confirmedHead.hash.toLowerCase()!==head.hash.toLowerCase()||quantity(confirmedHead.number,'CONFIRM_BLOCK')!==number||quantity(confirmedHead.timestamp,'CONFIRM_TIME')!==timestamp)throw new Error('TRANSFER_PINNED_HEAD_REORG_OR_MISMATCH');
      const review=buildBsc56KgenTransferReview({chainId:56,sender,recipient,amountKgen:draft.amountKgen,nonce:readback.pendingNonce,gasLimit:draft.gasLimit,gasPriceWei:draft.gasPriceWei,maximumGasFeeWei:draft.maximumGasFeeWei,readback},{ethers:codec});
      if(!stillCurrent())return transferState;
      const publishedAt=Date.now();
      if(timestamp*1000n>BigInt(publishedAt+30000)||timestamp*1000n<BigInt(publishedAt-120000))throw new Error('TRANSFER_PINNED_HEAD_STALE_OR_FUTURE');
      transferState=Object.freeze({status:'READ_ONLY_REVIEW',reason:'WALLET_HANDOFF_NOT_IMPLEMENTED',review,rpcReadCount:calls,observedAt:new Date(publishedAt).toISOString(),readbackScope:'PROVIDER_OBSERVATION_NOT_FINALITY_PROOF',pendingNonceScope:'PENDING_SEPARATE_FROM_HASH_PINNED_STATE',gasScope:'EXPLICIT_INPUT_CAPS_NOT_NETWORK_ESTIMATE',builderSourceScope:'REVIEWED_PURE_BUILDER_ANCESTOR_NOT_CURRENT_DEPLOYMENT',codecIntegrity:KGEN_TRANSFER_CODEC_INTEGRITY,executionReady:false,walletHandoffReady:false,signerRequested:false,broadcast:false});return transferState;
    }catch(error){
      if(ticket!==transferGeneration)return transferState;
      let message;try{const d=Object.getOwnPropertyDescriptor(error||{},'message');if(d&&Object.hasOwn(d,'value'))message=d.value}catch{}
      return fail(typeof message==='string'&&/^[A-Z][A-Z0-9_]{0,100}$/.test(message)?message:'TRANSFER_READBACK_UNKNOWN');
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
    prepareKgenTransfer,transferSnapshot,invalidateTransferReview,
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
