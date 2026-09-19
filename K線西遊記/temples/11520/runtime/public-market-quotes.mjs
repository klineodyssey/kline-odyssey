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
