/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE
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
