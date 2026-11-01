/* KGEN_META
VERSION: 1.0.0
REVISION: 2026-10-31.READONLY-KGEN-WBNB-REFERENCE
PRODUCT_CONTEXT: V2.9.5
STATUS: ACTIVE
LAST_UPDATED: 2026-10-31
UPDATED_BY: Codex / original thread 01a189ef-ecbc-7699-b87b-a4538d57c029 / HUMAN_AUTHORIZED_LOCAL_CANDIDATE
REVIEWED_BY: PENDING_ORIGINAL_INDEPENDENT_REVIEW; previous header preserved in exact base snapshot
SOURCE_COMMIT: b7e4a244f5eeb5583d4cf27ae09a0b19a3d09880
TASK_ID: K11520-KGEN-WBNB-REFERENCE-20261031
CHANGE_REASON: Add isolated read-only registered-pool WBNB reference without USD conversion, S.quotes/world/SY/Z or trading changes.
ANCESTOR: K線西遊記/temples/11520/runtime/public-market-quotes.mjs @ e26f3a76ef0be7f43058225f46def3fbe123371e
SOURCE_OF_TRUTH: LOCAL_CANDIDATE_NOT_CANONICAL
PURPOSE: Fetch validated, read-only 11520 public market reference quotes from Binance's market-data-only origin.
*/

import {KGEN_SWAP_CONFIG} from '../../../../core/integrations/kgen-pancakeswap-v2.mjs';

export const PUBLIC_MARKET_QUOTE_SOURCE=Object.freeze({
  id:'BINANCE_PUBLIC_MARKET_DATA_ONLY',
  origin:'https://data-api.binance.vision',
  path:'/api/v3/ticker/price',
  security:'NONE',
  credentials:'OMIT',
  readOnly:true,
});

export const FREE_ORACLE_MAX_AGE_MS=15000;
// Public REST references are simulation/world inputs, not authenticated USD
// settlement reports. Never manufacture provider time from receipt time.
export function publicObservationStatus(observation,now=Date.now()){
  const age=observation?now-observation.updatedAt:null;
  const stale=!observation||!Number.isFinite(age)||age<0||age>FREE_ORACLE_MAX_AGE_MS;
  return {...observation,age,stale,staleThreshold:FREE_ORACLE_MAX_AGE_MS,
    sourceStatus:stale?'MARKET DATA STALE':'REFERENCE_FRESH',fallbackStatus:'NONE_FAIL_CLOSED',
    settlementAuthority:false,quoteCurrency:'USDT',subSecond:false};
}
export async function fetchPublicMarketObservations({symbols,fetchImpl=globalThis.fetch,now=Date.now,timeoutMs=8000}={}){
  const expected=normalizeSymbols(symbols),controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{return Object.fromEntries(await Promise.all(expected.map(async market=>{
    const url=new URL('/api/v3/aggTrades',PUBLIC_MARKET_QUOTE_SOURCE.origin);
    url.searchParams.set('symbol',market);url.searchParams.set('limit','1');
    const response=await fetchImpl(url.href,{method:'GET',mode:'cors',cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:controller.signal});
    if(!response?.ok)throw new Error('PUBLIC_REFERENCE_UNAVAILABLE');
    const rows=await response.json(),row=Array.isArray(rows)&&rows.length===1?rows[0]:null;
    if(!row||!Number.isFinite(Number(row.p))||Number(row.p)<=0||!Number.isSafeInteger(row.T)||row.T<=0||!Number.isSafeInteger(row.a)||row.a<0)throw new Error('INVALID_PROVIDER_OBSERVATION');
    return [market,publicObservationStatus({market,price:Number(row.p),updatedAt:row.T,sequence:row.a,receivedAt:now(),source:PUBLIC_MARKET_QUOTE_SOURCE.id},now())];
  })))}finally{controller.abort();clearTimeout(timer)}
}

function normalizeSymbols(symbols){
  if(!Array.isArray(symbols)||symbols.length<1||symbols.length>20)throw new TypeError('symbols must contain 1..20 public market symbols');
  const normalized=[...new Set(symbols.map(symbol=>String(symbol||'').trim().toUpperCase()))];
  if(normalized.some(symbol=>!/^[A-Z0-9]{5,20}$/.test(symbol)))throw new TypeError('invalid public market symbol');
  return Object.freeze(normalized);
}

export function buildPublicMarketQuoteUrl(symbols){
  const normalized=normalizeSymbols(symbols),url=new URL(PUBLIC_MARKET_QUOTE_SOURCE.path,PUBLIC_MARKET_QUOTE_SOURCE.origin);
  url.searchParams.set('symbols',JSON.stringify(normalized));
  return url.href;
}

export function parsePublicMarketQuotes(payload,{symbols}={}){
  const expected=normalizeSymbols(symbols);
  if(!Array.isArray(payload))throw new TypeError('public market quote payload must be an array');
  const received=new Map();
  for(const row of payload){
    const symbol=String(row?.symbol||'').trim().toUpperCase(),price=Number(row?.price);
    if(!expected.includes(symbol))continue;
    if(received.has(symbol))throw new TypeError('duplicate public market quote: '+symbol);
    if(!Number.isFinite(price)||price<=0)throw new TypeError('invalid public market quote: '+symbol);
    received.set(symbol,price);
  }
  if(expected.some(symbol=>!received.has(symbol)))throw new TypeError('incomplete public market quote set');
  return Object.freeze(Object.fromEntries(expected.map(symbol=>[symbol,received.get(symbol)])));
}

export async function fetchPublicMarketQuotes({symbols,fetchImpl=globalThis.fetch,timeoutMs=8000}={}){
  if(typeof fetchImpl!=='function')throw new TypeError('fetch implementation required');
  const url=buildPublicMarketQuoteUrl(symbols),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),Math.max(250,Number(timeoutMs)||8000));
  try{
    const response=await fetchImpl(url,{method:'GET',mode:'cors',cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:controller.signal,headers:{accept:'application/json'}});
    if(!response?.ok)throw new Error('public market quote HTTP '+(response?.status??'UNKNOWN'));
    return parsePublicMarketQuotes(await response.json(),{symbols});
  }finally{clearTimeout(timer)}
}

// Local gameplay fixtures, not market prices, Universe constants or a settlement
// Oracle. The existing simulation ledger alone consumes these observations.
export const SIMULATION_PRICE_SOURCE='K11520_DETERMINISTIC_SIMULATION';
const SIMULATION_SEEDS=Object.freeze({BTCUSDT:100000,ETHUSDT:4000,BNBUSDT:600});
export function deterministicSimulationObservation({market,previous=null,now=Date.now()}={}){
  if(!Object.hasOwn(SIMULATION_SEEDS,market))throw new RangeError('MARKET_NOT_SUPPORTED');
  if(!Number.isSafeInteger(now)||now<0)throw new RangeError('INVALID_TIMESTAMP');
  if(previous&&(!Number.isFinite(previous.price)||previous.price<=0||!Number.isSafeInteger(previous.at)||previous.at<0))throw new RangeError('INVALID_SIMULATION_SOURCE');
  const pinned=previous?.source===SIMULATION_PRICE_SOURCE;
  const anchorPrice=pinned?previous.simulationAnchorPrice:Number.isFinite(previous?.price)&&previous.price>0?previous.price:SIMULATION_SEEDS[market];
  const anchorAt=pinned?previous.simulationAnchorAt:now;
  if(!Number.isFinite(anchorPrice)||anchorPrice<=0||!Number.isSafeInteger(anchorAt)||anchorAt<0||now<anchorAt||now<(previous?.at??0))throw new RangeError('INVALID_SIMULATION_SOURCE');
  // A clock-bound 128-second triangular path, two seconds per 0.125 index
  // step and +/-2 index maximum. No random/feed values or order-aware fills.
  const priceAt=at=>{const phase=Math.floor((at-anchorAt)/2000)%64;
    const offset=(phase<=16?phase:phase<=48?32-phase:phase-64)/8;
    return Math.max(anchorPrice/2,anchorPrice+offset)};
  // Consistency validation, not authentication: a lone corrupted finite anchor
  // must not manufacture a price jump or liquidate an existing local position.
  if(pinned&&(previous.at<anchorAt||previous.price!==priceAt(previous.at)))throw new RangeError('INVALID_SIMULATION_SOURCE');
  return Object.freeze({market,price:priceAt(now),at:now,
    source:SIMULATION_PRICE_SOURCE,sourceStatus:'SIMULATION_DETERMINISTIC',simulationOnly:true,
    simulationAnchorPrice:anchorPrice,simulationAnchorAt:anchorAt,settlementAuthority:false});
}

// Independent read-only reserve ratio. Never an input to S.quotes, market Z,
// native matched-trade CT, wallet execution or the production settlement Oracle.
export const KGEN_POOL_REFERENCE_SOURCE=Object.freeze({
  id:'BSC56_KGEN_WBNB_POOL_RESERVE_REFERENCE',rpc:'https://bsc-dataseed.bnbchain.org',
  chainId:KGEN_SWAP_CONFIG.chain_id,pool:KGEN_SWAP_CONFIG.pair_address,
  token0:KGEN_SWAP_CONFIG.token_address,token1:KGEN_SWAP_CONFIG.wbnb_address,
  decimals:KGEN_SWAP_CONFIG.token_decimals,quoteCurrency:'WBNB',readOnly:true,
  refreshMs:3600000,maxBlockAgeMs:60000,maxReadAgeMs:60000,displayDecimals:24
});
const kgenError=code=>Object.assign(new Error(code),{code});
const failKgen=(ok,code)=>{if(!ok)throw kgenError(code)};
const addressEqual=(a,b)=>typeof a==='string'&&a.toLowerCase()===b.toLowerCase();
const safeTime=value=>Number.isSafeInteger(value)&&value>0;
function rpcQuantity(value){failKgen(typeof value==='string'&&/^0x(?:0|[1-9a-f][0-9a-f]*)$/i.test(value),'RPC_QUANTITY_INVALID');return BigInt(value)}
function abiWords(value,count){failKgen(typeof value==='string'&&new RegExp('^0x[0-9a-f]{'+count*64+'}$','i').test(value),'RPC_ABI_INVALID');return Array.from({length:count},(_,i)=>value.slice(2+i*64,2+(i+1)*64))}
function abiAddress(value){const word=abiWords(value,1)[0];failKgen(/^0{24}/.test(word),'RPC_ADDRESS_PADDING_INVALID');return '0x'+word.slice(24)}
function atomicReserve(value){failKgen(typeof value==='string'&&/^[1-9]\d*$/.test(value),'ZERO_OR_INVALID_RESERVES');const n=BigInt(value);failKgen(n<(1n<<112n),'RESERVE_OVERFLOW');return n}
function ratioText(numerator,denominator){const scale=10n**BigInt(KGEN_POOL_REFERENCE_SOURCE.displayDecimals),n=numerator*scale/denominator;failKgen(n>0n,'RATIO_BELOW_DISPLAY_PRECISION');const whole=n/scale,fraction=String(n%scale).padStart(KGEN_POOL_REFERENCE_SOURCE.displayDecimals,'0').replace(/0+$/,'');return String(whole)+(fraction?'.'+fraction:'')}
function canonicalBlockHash(value){
  const hash=typeof value==='string'?value.toLowerCase():'';
  failKgen(/^0x[0-9a-f]{64}$/.test(hash)&&!/^0x0{64}$/.test(hash),'BLOCK_HEADER_INVALID');return hash;
}
function normalizedKgenReference(value){
  const source=KGEN_POOL_REFERENCE_SOURCE;
  failKgen(value?.schema==='KGEN_WBNB_POOL_REFERENCE_V1'&&value.source===source.id&&value.rpc===source.rpc,'REFERENCE_SOURCE_MISMATCH');
  failKgen(value.chainId===source.chainId&&addressEqual(value.pool,source.pool),'REFERENCE_CHAIN_OR_POOL_MISMATCH');
  failKgen(addressEqual(value.token0,source.token0)&&addressEqual(value.token1,source.token1),'PAIR_TOKEN_DIRECTION_MISMATCH');
  failKgen(value.decimals0===18&&value.decimals1===18,'TOKEN_DECIMALS_MISMATCH');
  const reserve0=atomicReserve(value.reserve0),reserve1=atomicReserve(value.reserve1);
  const blockHash=canonicalBlockHash(value.blockHash);
  failKgen(Number.isSafeInteger(value.blockNumber)&&value.blockNumber>0,'BLOCK_HEADER_INVALID');
  failKgen(safeTime(value.blockTime)&&safeTime(value.readAt)&&value.blockTime<=value.readAt&&Number.isSafeInteger(value.reserveUpdatedAt)&&value.reserveUpdatedAt>=0&&value.reserveUpdatedAt<=value.blockTime,'REFERENCE_TIMESTAMPS_INVALID');
  return {schema:value.schema,source:source.id,rpc:source.rpc,chainId:56,pool:source.pool,token0:source.token0,token1:source.token1,decimals0:18,decimals1:18,reserve0:String(reserve0),reserve1:String(reserve1),blockNumber:value.blockNumber,blockHash,blockTime:value.blockTime,reserveUpdatedAt:value.reserveUpdatedAt,readAt:value.readAt,pricePerKgen:ratioText(reserve1,reserve0),quoteCurrency:'WBNB',usdPrice:null,settlementAuthority:false,tradeTime:null,transport:value.transport==='INJECTED_TEST'?'INJECTED_TEST':'PUBLIC_RPC'};
}
export function kgenPoolReferenceStatus(value,now=Date.now(),reason=null){
  let quote;try{if(value)quote=normalizedKgenReference(value)}catch(error){reason=error.code||'INVALID_REFERENCE';}
  if(!safeTime(now))return {status:'NO_DATA',reason:'LOCAL_CLOCK_INVALID',quote:null,settlementAuthority:false};
  if(!quote)return {status:'NO_DATA',reason:reason||'NOT_READ',quote:null,settlementAuthority:false};
  const blockAgeMs=now-quote.blockTime,readAgeMs=now-quote.readAt;
  if(blockAgeMs<0||readAgeMs<0)return {status:'NO_DATA',reason:'REFERENCE_TIME_IN_FUTURE',quote:null,settlementAuthority:false};
  const stale=blockAgeMs>KGEN_POOL_REFERENCE_SOURCE.maxBlockAgeMs||readAgeMs>KGEN_POOL_REFERENCE_SOURCE.maxReadAgeMs;
  return {status:stale?'STALE':'REFERENCE_FRESH',reason:stale?'BLOCK_OR_READ_TOO_OLD':reason,quote,blockAgeMs,readAgeMs,settlementAuthority:false};
}

export async function fetchKgenPoolReference({fetchImpl=globalThis.fetch,now=Date.now,timeoutMs=8000,signal,setTimeoutFn=setTimeout,clearTimeoutFn=clearTimeout}={}){
  failKgen(typeof fetchImpl==='function'&&typeof now==='function','REFERENCE_TRANSPORT_REQUIRED');
  failKgen(Number.isSafeInteger(timeoutMs)&&timeoutMs>0&&timeoutMs<=30000,'REFERENCE_TIMEOUT_INVALID');
  const source=KGEN_POOL_REFERENCE_SOURCE,controller=new AbortController();let abortCode='RPC_ABORTED',sequence=0;
  const externalAbort=()=>controller.abort();signal?.addEventListener('abort',externalAbort,{once:true});
  const aborted=new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(kgenError(abortCode)),{once:true}));
  if(signal?.aborted)controller.abort();
  const timer=setTimeoutFn(()=>{abortCode='RPC_TIMEOUT';controller.abort()},timeoutMs);
  async function rpc(method,params){
    failKgen(!controller.signal.aborted,abortCode);const id=++sequence;let response;
    try{response=await fetchImpl(source.rpc,{method:'POST',mode:'cors',cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id,method,params}),signal:controller.signal})}catch(cause){throw Object.assign(kgenError(controller.signal.aborted?abortCode:'RPC_NETWORK_ERROR'),{cause})}
    failKgen(!controller.signal.aborted,abortCode);failKgen(response?.ok,'RPC_HTTP_'+(Number.isInteger(response?.status)?response.status:'ERROR'));
    let payload;try{payload=await response.json()}catch{throw kgenError('RPC_JSON_INVALID')}
    failKgen(!controller.signal.aborted,abortCode);failKgen(payload?.jsonrpc==='2.0'&&payload.id===id&&!payload.error&&Object.hasOwn(payload,'result'),'RPC_RESPONSE_INVALID');return payload.result;
  }
  const call=(to,data,block)=>rpc('eth_call',[{to,data},block]);
  const read=async()=>{
    failKgen(rpcQuantity(await rpc('eth_chainId',[]))===56n,'WRONG_CHAIN');
    const tag=await rpc('eth_blockNumber',[]),number=rpcQuantity(tag);failKgen(number>0n&&number<=BigInt(Number.MAX_SAFE_INTEGER),'BLOCK_NUMBER_INVALID');
    const header=await rpc('eth_getBlockByNumber',[tag,false]);
    failKgen(header&&rpcQuantity(header.number)===number,'BLOCK_HEADER_INVALID');const blockHash=canonicalBlockHash(header.hash);
    const seconds=rpcQuantity(header.timestamp);failKgen(seconds>0n&&seconds<=BigInt(Math.floor(Number.MAX_SAFE_INTEGER/1000)),'BLOCK_TIME_INVALID');
    const [raw0,raw1,reserves]=await Promise.all([call(source.pool,'0x0dfe1681',tag),call(source.pool,'0xd21220a7',tag),call(source.pool,'0x0902f1ac',tag)]);
    failKgen(addressEqual(abiAddress(raw0),source.token0)&&addressEqual(abiAddress(raw1),source.token1),'PAIR_TOKEN_DIRECTION_MISMATCH');
    const [dec0,dec1]=await Promise.all([call(source.token0,'0x313ce567',tag),call(source.token1,'0x313ce567',tag)]);
    failKgen(BigInt('0x'+abiWords(dec0,1)[0])===18n&&BigInt('0x'+abiWords(dec1,1)[0])===18n,'TOKEN_DECIMALS_MISMATCH');
    const words=abiWords(reserves,3),r0=BigInt('0x'+words[0]),r1=BigInt('0x'+words[1]),last=BigInt('0x'+words[2]);
    failKgen(r0>0n&&r1>0n,'ZERO_OR_INVALID_RESERVES');failKgen(last<(1n<<32n),'RESERVE_TIMESTAMP_INVALID');
    // uint32 pair timestamp, unwrapped relative to this block (not last trade).
    let updated=seconds-seconds%(1n<<32n)+last;if(updated>seconds)updated-=1n<<32n;failKgen(updated>=0n,'RESERVE_TIMESTAMP_INVALID');
    const finalHeader=await rpc('eth_getBlockByNumber',[tag,false]);
    failKgen(canonicalBlockHash(finalHeader?.hash)===blockHash&&finalHeader?.number===header.number&&finalHeader?.timestamp===header.timestamp,'BLOCK_CHANGED_DURING_READ');
    return normalizedKgenReference({schema:'KGEN_WBNB_POOL_REFERENCE_V1',source:source.id,rpc:source.rpc,chainId:56,pool:source.pool,token0:source.token0,token1:source.token1,decimals0:18,decimals1:18,reserve0:String(r0),reserve1:String(r1),blockNumber:Number(number),blockHash,blockTime:Number(seconds)*1000,reserveUpdatedAt:Number(updated)*1000,readAt:now(),transport:fetchImpl===globalThis.fetch?'PUBLIC_RPC':'INJECTED_TEST'});
  };
  try{return await Promise.race([read(),aborted])}finally{clearTimeoutFn(timer);signal?.removeEventListener('abort',externalAbort);controller.abort()}
}

// Caller-driven hourly reference cache; scheduling and cross-process claims stay with the existing host.
export const KGEN_REFERENCE_HOUR_MS=3600000;
const referenceHour=at=>Math.floor(at/KGEN_REFERENCE_HOUR_MS);
const referenceClock=at=>safeTime(at)&&Number.isFinite(new Date(at).valueOf());
const referenceCopy=value=>structuredClone(value);
function hourlyReferenceView(raw,at){
  let state;try{state=referenceCopy(raw)}catch{return {status:'NO_DATA',reason:'HOURLY_STATE_INVALID',quote:null,pricePerKgen:null,settlementAuthority:false}}
  const common={cadence:'HOURLY_REFERENCE',continuousLive:false,settlementAuthority:false,usdPrice:null,quoteCurrency:'USDT',reading:state.reading===true,permissionDenied:state.permissionDenied===true,lastCheckedAt:state.lastCheckedAt,lastCheckedBlock:state.lastObservedPool?.blockNumber??null,lastAttemptPeriod:state.lastAttemptPeriod,lastAttemptAt:state.lastAttemptAt,lastAttemptTrigger:state.lastAttemptTrigger,permissionDeniedTarget:state.permissionDeniedTarget??null,periodKey:referenceClock(at)?new Date(referenceHour(at)*KGEN_REFERENCE_HOUR_MS).toISOString():null,hourlyState:state};
  if(state.schema!=='KGEN_HOURLY_REFERENCE_STATE_V1'||!referenceClock(at))return {...common,status:'NO_DATA',reason:'LOCAL_CLOCK_OR_STATE_INVALID',quote:null,pricePerKgen:null};
  let derived=null,quote=null;
  try{if(state.quote){quote=normalizedKgenReference(state.quote);failKgen(safeTime(state.changedAt)&&state.changedAt<=at,'HOURLY_TIME_INVALID');derived=kgenUsdtReferenceStatus(quote,state.bnbObservation,state.changedAt);failKgen(derived.status==='DERIVED_REFERENCE_FRESH','HOURLY_LASTGOOD_INVALID')}}catch{return {...common,status:'NO_DATA',reason:'HOURLY_LASTGOOD_INVALID',quote:null,pricePerKgen:null}}
  const checked=safeTime(state.lastCheckedAt)&&state.lastCheckedAt<=at&&state.lastSuccessPeriod===referenceHour(state.lastCheckedAt),due=!checked||state.lastSuccessPeriod!==referenceHour(at);
  const error=state.error&&state.error!=='READING'?state.error:null;
  const status=!quote?'NO_DATA':state.permissionDenied||error?'LAST_KNOWN_GOOD':state.reading?'READING_PERIODIC_REFERENCE':due?'STALE_PERIODIC_REFERENCE':state.lastCheckChanged?'PERIODIC_REFERENCE':'PERIODIC_REFERENCE_UNCHANGED';
  const legs=derived?.legs; if(legs){legs.pool.ageMs=at-quote.blockTime;legs.bnb.ageMs=at-state.bnbObservation.updatedAt;legs.pool.status='PERIODIC_AS_OF';legs.bnb.status='PERIODIC_AS_OF'}
  return {...common,status,reason:state.permissionDenied?'SOURCE_PERMISSION_DENIED':error||(!quote?'NOT_READ':due?'HOURLY_CHECK_DUE':state.reading?'READING':null),quote,bnbObservation:state.bnbObservation,pricePerKgen:derived?.pricePerKgen??null,legs,transport:derived?.transport||'NOT_VERIFIED',wrapReference:derived?.wrapReference??null,changedAt:state.changedAt,checkAgeMs:checked?at-state.lastCheckedAt:null,poolClient:{state:state.permissionDenied||error?'ERROR':due?'STALE':'PERIODIC_REFERENCE',permissionDenied:state.permissionDenied===true,reading:state.reading===true,reason:error}};
}
export function createKgenPoolReference({readReference=fetchKgenPoolReference,readBnbObservation=()=>fetchPublicMarketObservations({symbols:['BNBUSDT'],fetchImpl:async(url,options)=>{const response=await globalThis.fetch(url,options);failKgen(response?.ok,'PUBLIC_HTTP_'+response?.status);return response}}).then(rows=>rows.BNBUSDT),now=Date.now,resumeState=null}={}){
  const empty={schema:'KGEN_HOURLY_REFERENCE_STATE_V1',quote:null,bnbObservation:null,lastObservedPool:null,lastObservedBnb:null,changedAt:null,lastCheckedAt:null,lastSuccessPeriod:null,lastAttemptPeriod:null,lastAttemptAt:null,lastAttemptTrigger:null,permissionDeniedTarget:null,lastCheckChanged:false,error:null,permissionDenied:false,reading:false};
  let state=resumeState?referenceCopy(resumeState):empty,inFlight=null,generation=0;
  if(resumeState){failKgen(state.schema===empty.schema&&referenceClock(now())&&(state.lastAttemptPeriod===null||Number.isSafeInteger(state.lastAttemptPeriod)&&state.lastAttemptPeriod>=0&&state.lastAttemptPeriod<=referenceHour(now()))&&typeof state.permissionDenied==='boolean','HOURLY_RESUME_INVALID');state.reading=false;const view=hourlyReferenceView(state,now());failKgen(!state.quote||!!view.quote,'HOURLY_RESUME_INVALID')}
  const snapshot=()=>hourlyReferenceView(state,now());
  function refresh({trigger='background',force=false}={}){
    if(!['background','daily','initial','manual'].includes(trigger)||typeof force!=='boolean')return Promise.resolve({...snapshot(),reason:'REFERENCE_TRIGGER_INVALID'});
    if(state.permissionDenied)return Promise.resolve(snapshot());
    const at=now();if(!referenceClock(at))return Promise.resolve({...snapshot(),reason:'LOCAL_CLOCK_INVALID'});
    const period=referenceHour(at);
    if(state.lastAttemptPeriod!==null&&period<state.lastAttemptPeriod)return Promise.resolve({...snapshot(),reason:'LOCAL_CLOCK_REGRESSION'});
    if(inFlight&&inFlight.period===period)return inFlight.promise;
    if(state.lastAttemptPeriod===period)return Promise.resolve(snapshot()); // force/manual never bypass hourly/permission policy.
    inFlight?.controller.abort();const controller=new AbortController(),current=++generation;state.lastAttemptPeriod=period;state.lastAttemptAt=at;state.lastAttemptTrigger=force?'manual':trigger;state.error='READING';state.reading=true;let activeTarget='LP_RPC';
    const promise=Promise.resolve().then(async()=>{
      const next=normalizedKgenReference(await readReference({signal:controller.signal}));if(current!==generation||controller.signal.aborted)return;
      activeTarget='BNBUSDT_PUBLIC';const observed=await readBnbObservation({signal:controller.signal});if(current!==generation||controller.signal.aborted)return;
      const finished=now();failKgen(referenceClock(finished)&&finished>=at,'REFERENCE_COMPLETION_CLOCK_REGRESSION');const bnb=strictPublicReference(observed,'BNBUSDT',finished),derived=kgenUsdtReferenceStatus(next,bnb,finished);
      failKgen(derived.status==='DERIVED_REFERENCE_FRESH','HOURLY_INCOMING_SOURCE_STALE_OR_INVALID');
      const previous=state.lastObservedPool;
      failKgen(!previous||next.blockNumber>=previous.blockNumber,'BLOCK_REGRESSION');
      failKgen(!previous||next.blockTime>=previous.blockTime&&next.readAt>=previous.readAt&&next.reserveUpdatedAt>=previous.reserveUpdatedAt,'REFERENCE_TIME_REGRESSION');
      failKgen(!previous||next.blockNumber!==previous.blockNumber||next.blockHash===previous.blockHash,'BLOCK_HASH_CONFLICT');
      if(previous&&next.blockNumber===previous.blockNumber)failKgen(next.reserve0===previous.reserve0&&next.reserve1===previous.reserve1&&next.blockTime===previous.blockTime&&next.reserveUpdatedAt===previous.reserveUpdatedAt,'BLOCK_REFERENCE_CONFLICT');
      const oldBnb=state.lastObservedBnb;
      failKgen(!oldBnb||bnb.sequence>=oldBnb.sequence&&bnb.updatedAt>=oldBnb.updatedAt&&bnb.receivedAt>=oldBnb.receivedAt,'BNB_REFERENCE_REGRESSION');
      if(oldBnb&&bnb.sequence===oldBnb.sequence)failKgen(bnb.price===oldBnb.price&&bnb.updatedAt===oldBnb.updatedAt,'BNB_REFERENCE_CONFLICT');
      const changed=!state.quote||BigInt(next.reserve1)*BigInt(state.quote.reserve0)!==BigInt(state.quote.reserve1)*BigInt(next.reserve0)||bnb.price!==state.bnbObservation.price;
      if(changed){state.quote=next;state.bnbObservation=referenceCopy(bnb);state.changedAt=finished}
      state.lastObservedPool=next;state.lastObservedBnb=referenceCopy(bnb);state.lastCheckedAt=finished;state.lastSuccessPeriod=referenceHour(finished);state.lastCheckChanged=changed;state.error=null;
    }).catch(cause=>{const code=/^[A-Z0-9_]{1,96}$/.test(cause?.code||'')?cause.code:'REFERENCE_READ_FAILED';if(['RPC_HTTP_401','RPC_HTTP_403','PUBLIC_HTTP_401','PUBLIC_HTTP_403'].includes(code)){state.permissionDenied=true;state.permissionDeniedTarget=activeTarget;state.error=code;if(current!==generation&&inFlight){generation++;inFlight.controller.abort();inFlight=null;state.reading=false}return}if(current!==generation)return;state.error=code}).finally(()=>{if(current===generation){inFlight=null;state.reading=false}}).then(snapshot);
    inFlight={promise,controller,period,trigger};return promise;
  }
  function pause(){if(!inFlight||['background','daily'].includes(inFlight.trigger))return;generation++;inFlight.controller.abort();inFlight=null;state.reading=false;state.error='READ_CANCELLED'}
  return Object.freeze({refresh,pause,snapshot});
}

export function mountKgenPoolReference(container,view){
  let node=container.querySelector('[data-kgen-pool-reference]');
  if(!node){node=container.ownerDocument.createElement('section');node.className='card';node.setAttribute('data-kgen-pool-reference','');node.setAttribute('aria-label','KGEN / WBNB 池參考價');node.innerHTML='<h3>KGEN / WBNB 池參考價</h3><p data-kgen-reference-price></p><p data-kgen-reference-status></p><p data-kgen-reference-source style="overflow-wrap:anywhere"></p><p data-kgen-reference-times></p><p class="muted">以 WBNB 表示的儲備比例參考，非成交價或結算報價。儲備更新時間及區塊時間皆不代表最後成交時間。</p>';container.appendChild(node)}
  renderKgenPoolReference(node,view);return node;
}
export function renderKgenPoolReference(node,view){
  const source=KGEN_POOL_REFERENCE_SOURCE,q=view.quote,utc=value=>new Date(value).toISOString();
  node.dataset.referenceStatus=view.status;
  node.querySelector('[data-kgen-reference-price]').textContent=q?`1 KGEN ≈ ${q.pricePerKgen} WBNB${view.status==='STALE'?'（過期參考）':''}`:'1 KGEN = NO_DATA WBNB';
  const explain=view.cadence==='HOURLY_REFERENCE'?('每小時定期參考，非連續即時；'+(view.reason||'本小時檢查完成')):view.permissionDenied?'伺服器拒絕；此頁停止重讀，等待處理':view.status==='STALE'?'區塊或本機讀取已超過60秒':view.status==='NO_DATA'?'尚無可用資料':view.status==='LAST_KNOWN_GOOD'?'保留最後有效參考；本次未取得新資料':'同區塊儲備參考';
  node.querySelector('[data-kgen-reference-status]').textContent=`${q?.transport==='INJECTED_TEST'?'TEST_FIXTURE · ':''}${view.status} · ${explain}${view.reason?' · '+view.reason:''}`;
  node.querySelector('[data-kgen-reference-source]').textContent=`BSC ${source.chainId} · 池 ${source.pool} · token0 KGEN ${source.token0} / token1 WBNB ${source.token1} · 18 / 18 decimals · RPC ${source.rpc}`;
  node.querySelector('[data-kgen-reference-times]').textContent=q?`區塊 #${q.blockNumber} · block時間 ${utc(q.blockTime)} · reserve更新 ${utc(q.reserveUpdatedAt)} · 本機讀取 ${utc(q.readAt)}`:'區塊／block時間／reserve更新／本機讀取：NO_DATA';
}

// SHARED_AXIS_REFERENCE_UI_BEGIN — read-only UI; no ledger/world/position authority.
export const AXIS_REFERENCE_CHOICES=Object.freeze([
  Object.freeze({id:'BTCUSDT',label:'BTC / USDT'}),Object.freeze({id:'ETHUSDT',label:'ETH / USDT'}),
  Object.freeze({id:'BNBUSDT',label:'BNB / USDT'}),Object.freeze({id:'KGEN',label:'KGEN / USDT（LP換算參考）'}),
  Object.freeze({id:'TAIWAN_FUTURES',label:'台指期貨（盤後日K／待接）'})
]);
export function createAxisReferenceSelection(){
  const values={KX:'BTCUSDT',KY:'ETHUSDT',KZ:'BNBUSDT'},known=new Map();let generation=0;
  return Object.freeze({snapshot:()=>Object.freeze({...values,generation}),select(axis,instrument){
    if(!Object.hasOwn(values,axis)||!AXIS_REFERENCE_CHOICES.some(x=>x.id===instrument))return {ok:false,reason:'INVALID_AXIS_OR_INSTRUMENT'};
    const changed=values[axis]!==instrument;if(changed){values[axis]=instrument;generation++}return {ok:true,changed,generation};
  },reference(instrument,references,now=Date.now()){
    if(!safeTime(now))return {...(known.get(instrument)||{instrument,price:null}),poolClient:instrument==='KGEN'?poolClientState(references?.poolContext):undefined,status:'NO_DATA',reason:'LOCAL_CLOCK_INVALID'};
    const next=axisReferenceView(instrument,references,now),previous=known.get(instrument),fresh=['REFERENCE_FRESH','DERIVED_REFERENCE_FRESH'].includes(next.status);
    if(instrument==='KGEN'&&references?.poolContext?.hourlyState)return referenceCopy(next);
    if(fresh){
      const advanced=!previous||(next.legs?next.legs.pool.block>previous.legs.pool.block||next.legs.bnb.updatedAt>previous.legs.bnb.updatedAt||next.legs.bnb.sequence>previous.legs.bnb.sequence:next.updatedAt>previous.updatedAt||next.sequence>previous.sequence);
      const regressed=previous&&(next.legs?next.legs.pool.block<previous.legs.pool.block||next.legs.bnb.updatedAt<previous.legs.bnb.updatedAt||next.legs.bnb.sequence<previous.legs.bnb.sequence:next.updatedAt<previous.updatedAt||next.sequence<previous.sequence);
      if(!regressed&&advanced){known.set(instrument,next);return ageReferenceView(next,now)}
      if(previous&&!regressed&&next.price===previous.price)return ageReferenceView(previous,now);
    }
    if(!previous)return next;
    const aged=ageReferenceView(previous,now);return {...aged,poolClient:next.poolClient??aged.poolClient,status:aged.status==='NO_DATA'?'NO_DATA':aged.status==='STALE'||next.status==='STALE'?'STALE':'LAST_KNOWN_GOOD',reason:next.reason||'NO_VALID_SOURCE_UPDATE'};
  }});
}
function ageReferenceView(view,now){
  if(view.legs){const pool={...view.legs.pool,ageMs:now-view.legs.pool.blockTime},bnb={...view.legs.bnb,ageMs:now-view.legs.bnb.updatedAt};return {...view,legs:{pool,bnb},status:pool.ageMs<0||now-pool.readAt<0||bnb.ageMs<0||now-bnb.readAt<0?'NO_DATA':pool.ageMs>KGEN_POOL_REFERENCE_SOURCE.maxBlockAgeMs||now-pool.readAt>KGEN_POOL_REFERENCE_SOURCE.maxReadAgeMs||bnb.ageMs>FREE_ORACLE_MAX_AGE_MS?'STALE':view.status}}
  return {...view,ageMs:now-view.updatedAt,status:now-view.updatedAt<0||now-view.readAt<0?'NO_DATA':now-view.updatedAt>FREE_ORACLE_MAX_AGE_MS?'STALE':view.status};
}
function strictPublicReference(observation,market,now){
  try{observation=observation&&{...observation}}catch{return null}
  if(!safeTime(now)||!observation||observation.market!==market||observation.source!==PUBLIC_MARKET_QUOTE_SOURCE.id||!Number.isFinite(observation.price)||observation.price<=0||!Number.isSafeInteger(observation.sequence)||observation.sequence<0||!safeTime(observation.updatedAt)||!safeTime(observation.receivedAt)||observation.receivedAt>now||observation.updatedAt>observation.receivedAt)return null;
  return publicObservationStatus(observation,now);
}
function decimalProduct(a,b){
  const parse=value=>{const s=String(value);if(!/^\d{1,30}(?:\.\d{1,30})?$/.test(s))throw new Error('DECIMAL_REFERENCE_INVALID');const [whole,fraction='']=s.split('.');return {value:BigInt(whole+fraction),scale:fraction.length}};
  const x=parse(a),y=parse(b),decimals=x.scale+y.scale,scale=10n**BigInt(decimals),n=x.value*y.value;
  if(n<=0n)throw new Error('DECIMAL_REFERENCE_INVALID');const whole=n/scale,fraction=String(n%scale).padStart(decimals,'0').slice(0,24).replace(/0+$/,'');
  const text=String(whole)+(fraction?'.'+fraction:'');if(Number(text)<=0||!Number.isFinite(Number(text)))throw new Error('DECIMAL_REFERENCE_INVALID');return text;
}
function poolClientState(value){
  if(value==null)return null;
  let context;try{context={...value}}catch{return {state:'UNVERIFIED',status:'NO_DATA',reason:'CONTEXT_UNAVAILABLE',permissionDenied:false,reading:false}}
  const status=context.status,reason=typeof context.reason==='string'&&/^[A-Z0-9_]{1,96}$/.test(context.reason)?context.reason:null,denied=context.permissionDenied===true,reading=context.reading===true;
  const valid=['REFERENCE_FRESH','LAST_KNOWN_GOOD','STALE','NO_DATA'].includes(status)&&typeof context.permissionDenied==='boolean'&&typeof context.reading==='boolean'&&(context.reason===null||reason!==null);
  const failed=reason&&!['NOT_READ','READING','READ_CANCELLED','BLOCK_OR_READ_TOO_OLD'].includes(reason);
  const state=denied?'ERROR':!valid?'UNVERIFIED':failed?'ERROR':reading||reason==='READING'?'READING':reason==='READ_CANCELLED'?'PAUSED':status==='STALE'?'STALE':status==='REFERENCE_FRESH'?'READY':status==='LAST_KNOWN_GOOD'?'DEGRADED':'UNAVAILABLE';
  return {state,status:valid?status:'NO_DATA',reason:valid?reason:'CONTEXT_UNVERIFIED',permissionDenied:denied,reading};
}
export function kgenUsdtReferenceStatus(poolValue,bnbObservation,now=Date.now(),poolContext=null){
  let periodicState;try{periodicState=poolContext?.hourlyState}catch{return {status:'NO_DATA',reason:'HOURLY_CONTEXT_UNAVAILABLE',pricePerKgen:null,quoteCurrency:'USDT',usdPrice:null,settlementAuthority:false}}
  if(periodicState){
    let view=hourlyReferenceView(periodicState,now);
    try{if(view.quote)failKgen(JSON.stringify(normalizedKgenReference(poolValue))===JSON.stringify(view.quote),'HOURLY_CONTEXT_POOL_MISMATCH')}catch{return {...view,status:'NO_DATA',reason:'HOURLY_CONTEXT_POOL_MISMATCH',quote:null,pricePerKgen:null}}
    if(poolContext.permissionDenied===true&&!view.permissionDenied){const state=referenceCopy(view.hourlyState);state.permissionDenied=true;view=hourlyReferenceView(state,now)}
    if(poolContext.status!==view.status||poolContext.reason!==view.reason){return {...referenceCopy(view),status:view.quote?'LAST_KNOWN_GOOD':'NO_DATA',reason:typeof poolContext.reason==='string'&&/^[A-Z0-9_]{1,96}$/.test(poolContext.reason)?poolContext.reason:'HOURLY_CONTEXT_STATUS_MISMATCH'}}
    return referenceCopy(view);
  }
  let poolSnapshot=null;try{poolSnapshot=poolValue&&{...poolValue}}catch{}
  const pool=kgenPoolReferenceStatus(poolSnapshot,now),bnb=strictPublicReference(bnbObservation,'BNBUSDT',now);
  const legs={pool:{status:pool.status,block:pool.quote?.blockNumber??null,blockTime:pool.quote?.blockTime??null,readAt:pool.quote?.readAt??null,ageMs:pool.blockAgeMs??null,unit:'WBNB/KGEN'},bnb:{status:bnb?.sourceStatus||'NO_DATA',source:bnb?.source||null,market:'BNBUSDT',sequence:bnb?.sequence??null,updatedAt:bnb?.updatedAt??null,readAt:bnb?.receivedAt??null,ageMs:bnb?.age??null,unit:'USDT/BNB'}};
  const client=poolClientState(poolContext),common={quoteCurrency:'USDT',usdPrice:null,settlementAuthority:false,legs,poolClient:client,wrapReference:'WBNB = BSC native BNB 1:1 wrapped reference; no redemption or cross-chain conversion',transport:pool.quote?.transport==='INJECTED_TEST'||bnb?.transport==='INJECTED_TEST'?'INJECTED_TEST':'PUBLIC_REFERENCE'};
  if(client&&client.state!=='READY')return {...common,status:pool.status==='STALE'||bnb?.stale||client.status==='STALE'?'STALE':'NO_DATA',reason:client.permissionDenied?'POOL_PERMISSION_DENIED':client.reason?'POOL_'+client.reason:'POOL_CLIENT_'+client.state,pricePerKgen:null};
  if(pool.status!=='REFERENCE_FRESH'||!bnb||bnb.stale)return {...common,status:pool.status==='STALE'||bnb?.stale?'STALE':'NO_DATA',reason:pool.status!=='REFERENCE_FRESH'?'POOL_LEG_'+pool.status:'BNB_LEG_UNAVAILABLE_OR_STALE',pricePerKgen:null};
  try{return {...common,status:'DERIVED_REFERENCE_FRESH',reason:null,pricePerKgen:decimalProduct(pool.quote.pricePerKgen,bnb.price)}}catch{return {...common,status:'NO_DATA',reason:'DECIMAL_REFERENCE_INVALID',pricePerKgen:null}};
}
export function axisReferenceView(instrument,{pool=null,poolContext=null,observations={}}={},now=Date.now()){
  if(instrument==='TAIWAN_FUTURES')return {instrument,status:'NOT_CONFIGURED',cadence:'POST_CLOSE_DAILY',lastTradingDate:null,price:null,reason:'TAIFEX 盤後資料→既有轉版引擎→日K，每日一次、非即時；契約／月份／交易時段／來源接線待核',quoteCurrency:null,settlementAuthority:false};
  if(instrument==='KGEN'){const derived=kgenUsdtReferenceStatus(pool,observations.BNBUSDT,now,poolContext);return {...derived,instrument,price:derived.pricePerKgen}}
  if(!['BTCUSDT','ETHUSDT','BNBUSDT'].includes(instrument))return {instrument,status:'NO_DATA',price:null,settlementAuthority:false};
  const quote=strictPublicReference(observations[instrument],instrument,now);return {instrument,status:!quote?'NO_DATA':quote.stale?'STALE':'REFERENCE_FRESH',price:quote?String(quote.price):null,quoteCurrency:'USDT',source:quote?.source||null,transport:quote?quote.transport==='INJECTED_TEST'?'INJECTED_TEST':'PUBLIC_REFERENCE':'NOT_VERIFIED',updatedAt:quote?.updatedAt??null,sequence:quote?.sequence??null,readAt:quote?.receivedAt??null,ageMs:quote?.age??null,settlementAuthority:false};
}
export function renderAxisReferenceControls(node,selection,references,now=Date.now()){
  const values=selection.snapshot();
  for(const axis of ['KX','KY','KZ']){
    const select=node.querySelector(`[data-axis-reference-select="${axis}"]`),output=node.querySelector(`[data-axis-reference-output="${axis}"]`),view=selection.reference(values[axis],references,now);
    if(select.value!==values[axis])select.value=values[axis];
    output.dataset.referenceStatus=view.status;
    const times=view.legs?` · pool block ${view.legs.pool.block??'--'} / age ${view.legs.pool.ageMs??'--'}ms · BNB provider ${view.legs.bnb.updatedAt??'--'} / age ${view.legs.bnb.ageMs??'--'}ms`:` · provider ${view.updatedAt??'--'} / age ${view.ageMs??'--'}ms`;
    const client=view.poolClient,context=client&&client.state!=='READY'?` · ${client.state==='READING'?'來源讀取中／保留參考':client.state==='PAUSED'?'來源讀取已暫停':client.state==='ERROR'?'來源失敗／降級':client.state==='STALE'?'來源過期／降級':'來源未就緒／降級'}${client.permissionDenied?' · permissionDenied（停止重讀）':''}`:'';
    output.textContent=`${view.transport==='INJECTED_TEST'?'TEST_FIXTURE · ':''}${view.status} · ${view.price===null?'NO_DATA':view.price+' '+view.quoteCurrency}${view.reason?' · '+view.reason:''}${context}${times}`;
  }
}
export function mountAxisReferenceControls(container,selection,readReferences,now=Date.now){
  let node=container.querySelector('[data-axis-reference-controls]');
  if(!node){
    const doc=container.ownerDocument;node=doc.createElement('section');node.className='card';node.setAttribute('data-axis-reference-controls','');
    const title=doc.createElement('h3');title.textContent='三軸行情選擇';node.appendChild(title);
    const note=doc.createElement('p');note.textContent='每軸共用五個選項；僅改行情檢視，不改持倉、交易商品或角色位置，不會送單。交易／球膜映射待獨立整合。KGEN 換算採 WBNB 與 BNB 1:1 包裝參考；USDT 不等於 USD。';node.appendChild(note);
    for(const axis of ['KX','KY','KZ']){
      const label=doc.createElement('label');label.textContent=axis;const select=doc.createElement('select');select.setAttribute('data-axis-reference-select',axis);select.setAttribute('aria-label',axis+' 行情商品');
      for(const choice of AXIS_REFERENCE_CHOICES){const option=doc.createElement('option');option.value=choice.id;option.textContent=choice.label;select.appendChild(option)}
      select.addEventListener('change',()=>{selection.select(axis,select.value);renderAxisReferenceControls(node,selection,readReferences(),now())});label.appendChild(select);node.appendChild(label);
      const output=doc.createElement('p');output.setAttribute('data-axis-reference-output',axis);output.style.overflowWrap='anywhere';node.appendChild(output);
    }
    container.appendChild(node);
  }
  renderAxisReferenceControls(node,selection,readReferences(),now());return node;
}
