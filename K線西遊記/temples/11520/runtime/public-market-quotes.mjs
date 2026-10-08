/* KGEN_META
VERSION: 1.0.0
REVISION: 2026-10-06.SIMULATION-ORDER-PLAYABILITY
PRODUCT_CONTEXT: V2.9.5
STATUS: ACTIVE
LAST_UPDATED: 2026-10-06
UPDATED_BY: dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER / HUMAN_AUTHORIZED_2026_10_05
REVIEWED_BY: dot / independent scoped metadata and provenance review / 2026-10-06; no registered Reviewer role or release approval
SOURCE_COMMIT: 0ad0cffe33d23d1104baa963fedef25ad149a0ac
TASK_ID: K11520-SIMULATION-TRADING-P0-20261006
CHANGE_REASON: Add explicitly simulation-only deterministic observations while preserving raw public quote state and provenance.
ANCESTOR: K線西遊記/temples/11520/runtime/public-market-quotes.mjs @ e26f3a76ef0be7f43058225f46def3fbe123371e
SOURCE_OF_TRUTH: TRUE
PURPOSE: Fetch validated, read-only 11520 public market reference quotes from Binance's market-data-only origin.
*/

export const PUBLIC_MARKET_QUOTE_SOURCE=Object.freeze({
  id:'BINANCE_PUBLIC_MARKET_DATA_ONLY',
  origin:'https://data-api.binance.vision',
  path:'/api/v3/ticker/price',
  security:'NONE',
  credentials:'OMIT',
  readOnly:true,
});

export const FREE_ORACLE_MAX_AGE_MS=15000;
export const PUBLIC_MARKET_SYMBOLS=Object.freeze(['BTCUSDT','ETHUSDT','BNBUSDT']);
export const PUBLIC_QUOTE_QUALITY=Object.freeze({UNKNOWN:'UNKNOWN',FRESH:'FRESH',STALE:'STALE',FAILED:'FAILED'});
// Public REST references are simulation/world inputs, not authenticated USD
// settlement reports. Never manufacture provider time from receipt time.
export function publicObservationStatus(observation,now=Date.now()){
  const age=observation?now-observation.updatedAt:null;
  const unknown=!observation||observation?.quality===PUBLIC_QUOTE_QUALITY.UNKNOWN,failed=Boolean(observation?.failure);
  const invalid=!unknown&&!failed&&(observation?.source!==PUBLIC_MARKET_QUOTE_SOURCE.id
    ||!Number.isFinite(Number(observation?.price))||Number(observation?.price)<=0
    ||!Number.isSafeInteger(Number(observation?.updatedAt))||Number(observation?.updatedAt)<=0
    ||!Number.isSafeInteger(Number(observation?.sequence))||Number(observation?.sequence)<0);
  const stale=unknown||failed||invalid||!Number.isFinite(age)||age<0||age>FREE_ORACLE_MAX_AGE_MS;
  const quality=unknown?PUBLIC_QUOTE_QUALITY.UNKNOWN:(failed||invalid)?PUBLIC_QUOTE_QUALITY.FAILED:stale?PUBLIC_QUOTE_QUALITY.STALE:PUBLIC_QUOTE_QUALITY.FRESH;
  return {...observation,age,stale,staleThreshold:FREE_ORACLE_MAX_AGE_MS,
    quality,allowsPriceTransitions:quality===PUBLIC_QUOTE_QUALITY.FRESH,
    sourceStatus:quality===PUBLIC_QUOTE_QUALITY.FRESH?'REFERENCE_FRESH':quality==='FAILED'?'MARKET_DATA_FAILED':quality==='UNKNOWN'?'MARKET_DATA_UNKNOWN':'MARKET_DATA_STALE',
    failure:failed?String(observation.failure):invalid?'INVALID_PROVIDER_OBSERVATION':null,fallbackStatus:'NONE_FAIL_CLOSED',
    divergenceStatus:'NOT_VERIFIED_SINGLE_SOURCE',settlementAuthority:false,quoteCurrency:'USDT',subSecond:false};
}

export function publicMarketQuoteSetStatus(observations,{symbols=PUBLIC_MARKET_SYMBOLS,now=Date.now()}={}){
  const expected=normalizeSymbols(symbols),rows=Object.fromEntries(expected.map(market=>[market,publicObservationStatus(observations?.[market],now)]));
  const qualities=Object.values(rows).map(row=>row.quality);
  const quality=qualities.includes(PUBLIC_QUOTE_QUALITY.FAILED)?PUBLIC_QUOTE_QUALITY.FAILED:
    qualities.includes(PUBLIC_QUOTE_QUALITY.UNKNOWN)?PUBLIC_QUOTE_QUALITY.UNKNOWN:
    qualities.includes(PUBLIC_QUOTE_QUALITY.STALE)?PUBLIC_QUOTE_QUALITY.STALE:PUBLIC_QUOTE_QUALITY.FRESH;
  return Object.freeze({quality,allowsPriceTransitions:quality===PUBLIC_QUOTE_QUALITY.FRESH,
    requiredSymbols:Object.freeze(expected),rows:Object.freeze(rows),
    divergenceStatus:'NOT_VERIFIED_SINGLE_SOURCE',settlementAuthority:false});
}

export function publicMarketFailureObservations({symbols=PUBLIC_MARKET_SYMBOLS,now=Date.now(),failure='PUBLIC_REFERENCE_UNAVAILABLE'}={}){
  const receivedAt=Number(now),code=String(failure||'PUBLIC_REFERENCE_UNAVAILABLE');
  return Object.freeze(Object.fromEntries(normalizeSymbols(symbols).map(market=>[market,publicObservationStatus({
    market,price:null,updatedAt:null,sequence:null,receivedAt,source:PUBLIC_MARKET_QUOTE_SOURCE.id,failure:code
  },receivedAt)])));
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
