import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchPublicMarketObservations,publicObservationStatus,publicMarketQuoteSetStatus,
  publicMarketFailureObservations} from '../runtime/public-market-quotes.mjs';

test('free oracle uses provider event timestamp, not fetch time; stale/future/missing times fail closed',async()=>{
  const fetchImpl=async()=>({ok:true,json:async()=>[{p:'100',T:1000,a:42}]});
  const rows=await fetchPublicMarketObservations({symbols:['BTCUSDT','ETHUSDT','BNBUSDT'],fetchImpl,now:()=>20000});
  for(const o of Object.values(rows)){assert.equal(o.updatedAt,1000);assert.equal(o.receivedAt,20000);assert.equal(o.stale,true);assert.equal(o.settlementAuthority,false);assert.equal(o.fallbackStatus,'NONE_FAIL_CLOSED')}
  assert.equal(publicObservationStatus(rows.BTCUSDT,1001).stale,false);
  assert.equal(publicObservationStatus(rows.BTCUSDT,999).stale,true);
  assert.equal(publicObservationStatus(null).quality,'UNKNOWN');
  await assert.rejects(fetchPublicMarketObservations({symbols:['BTCUSDT'],fetchImpl:async()=>({ok:true,json:async()=>[{p:'100',a:1}]})}),/INVALID_PROVIDER/);
});
import {PUBLIC_MARKET_QUOTE_SOURCE,buildPublicMarketQuoteUrl,parsePublicMarketQuotes,fetchPublicMarketQuotes} from '../runtime/public-market-quotes.mjs';

const SYMBOLS=['BTCUSDT','ETHUSDT','BNBUSDT'];
const PAYLOAD=[
  {symbol:'BTCUSDT',price:'81330.28'},
  {symbol:'ETHUSDT',price:'2642.13'},
  {symbol:'BNBUSDT',price:'767.00'},
];

test('quote URL is pinned to Binance public market-data-only origin',()=>{
  const url=new URL(buildPublicMarketQuoteUrl(SYMBOLS));
  assert.equal(url.origin,PUBLIC_MARKET_QUOTE_SOURCE.origin);
  assert.equal(url.pathname,'/api/v3/ticker/price');
  assert.deepEqual(JSON.parse(url.searchParams.get('symbols')),SYMBOLS);
  assert.equal(PUBLIC_MARKET_QUOTE_SOURCE.security,'NONE');
  assert.equal(PUBLIC_MARKET_QUOTE_SOURCE.readOnly,true);
});

test('quote parser returns one complete finite positive atomic set',()=>{
  assert.deepEqual({...parsePublicMarketQuotes(PAYLOAD,{symbols:SYMBOLS})},{BTCUSDT:81330.28,ETHUSDT:2642.13,BNBUSDT:767});
  assert.throws(()=>parsePublicMarketQuotes(PAYLOAD.slice(0,2),{symbols:SYMBOLS}),/incomplete/);
  assert.throws(()=>parsePublicMarketQuotes([...PAYLOAD,{symbol:'BTCUSDT',price:'1'}],{symbols:SYMBOLS}),/duplicate/);
  assert.throws(()=>parsePublicMarketQuotes(PAYLOAD.map(row=>row.symbol==='ETHUSDT'?{...row,price:'NaN'}:row),{symbols:SYMBOLS}),/invalid/);
});

test('fetch is credential-free CORS GET and never accepts an endpoint override',async()=>{
  let observed=null;
  const quotes=await fetchPublicMarketQuotes({symbols:SYMBOLS,fetchImpl:async(url,options)=>{observed={url,options};return{ok:true,status:200,json:async()=>PAYLOAD}}});
  assert.equal(new URL(observed.url).origin,'https://data-api.binance.vision');
  assert.deepEqual({...quotes},{BTCUSDT:81330.28,ETHUSDT:2642.13,BNBUSDT:767});
  assert.equal(observed.options.method,'GET');
  assert.equal(observed.options.mode,'cors');
  assert.equal(observed.options.credentials,'omit');
  assert.equal(observed.options.redirect,'error');
  assert.equal('authorization' in observed.options.headers,false);
});

test('HTTP and malformed responses fail closed without returning partial quotes',async()=>{
  await assert.rejects(fetchPublicMarketQuotes({symbols:SYMBOLS,fetchImpl:async()=>({ok:false,status:429,json:async()=>({})})}),/HTTP 429/);
  await assert.rejects(fetchPublicMarketQuotes({symbols:SYMBOLS,fetchImpl:async()=>({ok:true,status:200,json:async()=>PAYLOAD.slice(0,1)})}),/incomplete/);
});

test('BTC ETH BNB quality set exposes source, provider time, stale/failure and unverified divergence',()=>{
  const rows=Object.fromEntries(SYMBOLS.map((market,index)=>[market,publicObservationStatus({market,price:index+1,updatedAt:1000,sequence:index,receivedAt:1001,source:PUBLIC_MARKET_QUOTE_SOURCE.id},1001)]));
  const fresh=publicMarketQuoteSetStatus(rows,{symbols:SYMBOLS,now:1001});
  assert.equal(fresh.quality,'FRESH');assert.equal(fresh.allowsPriceTransitions,true);assert.equal(fresh.divergenceStatus,'NOT_VERIFIED_SINGLE_SOURCE');assert.equal(fresh.settlementAuthority,false);
  for(const market of SYMBOLS){assert.equal(fresh.rows[market].source,PUBLIC_MARKET_QUOTE_SOURCE.id);assert.equal(fresh.rows[market].updatedAt,1000);assert.equal(fresh.rows[market].failure,null)}
  const stale=publicMarketQuoteSetStatus(rows,{symbols:SYMBOLS,now:16001});assert.equal(stale.quality,'STALE');assert.equal(stale.allowsPriceTransitions,false);
  const failed=publicMarketQuoteSetStatus(publicMarketFailureObservations({symbols:SYMBOLS,now:2000}),{symbols:SYMBOLS,now:2000});assert.equal(failed.quality,'FAILED');assert.equal(failed.allowsPriceTransitions,false);
  assert.ok(SYMBOLS.every(market=>failed.rows[market].failure==='PUBLIC_REFERENCE_UNAVAILABLE'));
  const invalid={...rows,ETHUSDT:{...rows.ETHUSDT,source:'UNVERIFIED_SOURCE'}};
  const rejected=publicMarketQuoteSetStatus(invalid,{symbols:SYMBOLS,now:1001});
  assert.equal(rejected.quality,'FAILED');assert.equal(rejected.allowsPriceTransitions,false);
  assert.equal(rejected.rows.ETHUSDT.failure,'INVALID_PROVIDER_OBSERVATION');
});
