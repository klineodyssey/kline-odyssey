import test from 'node:test';
import assert from 'node:assert/strict';
import {assertVerifiedPublicMarketObservation,fetchPublicMarketObservations,publicObservationStatus,buildAtrLampReference,lampScanPoint,LAMP_DAY_MS,fetchAtrLampReference} from '../runtime/public-market-quotes.mjs';

function lampFixture(){
  const now=40*LAMP_DAY_MS+1000;
  const rows=Array.from({length:40},(_,i)=>[i*LAMP_DAY_MS,String(100+i),String(103+i),String(99+i),String(101+i),'1',(i+1)*LAMP_DAY_MS-1]);
  const observation={market:'BTCUSDT',price:140,updatedAt:now-1,source:'BINANCE_PUBLIC_MARKET_DATA_ONLY',sequence:40};
  return {rows,observation,now};
}
test('lamp Wilder ATR14 and 1001 exact-grid points use only closed daily candles',()=>{
  const f=lampFixture(),r=buildAtrLampReference(f);
  assert.equal(r.atr14,4);assert.equal(r.slope,1);assert.equal(r.horizons.length,9);assert.equal(r.settlementAuthority,false);
  for(let day=1;day<=9;day++){
    const points=Array.from({length:1001},(_,i)=>lampScanPoint(r,day,i-500));
    assert.equal(points[0].price,140+day-4);assert.equal(points[500].price,140+day);assert.equal(points[1000].price,140+day+4);
    assert.equal(new Set(points.map(p=>p.price)).size,1001);assert.equal(points[0].total,1001);
    assert.equal(r.horizons[day-1].targetOpenAt,(40+day)*LAMP_DAY_MS);
  }
  assert.equal(r.horizons[7].day,8);assert.equal(r.horizons[8].day,9);
  assert.equal(r.bullShare,0.625);assert.equal(r.bearShare,0.375);
  const live=[40*LAMP_DAY_MS,'140','100000','1','99999','1',41*LAMP_DAY_MS-1];
  assert.equal(buildAtrLampReference({...f,rows:[...f.rows,live]}).atr14,4);
  assert.equal(buildAtrLampReference({...f,rows:[...f.rows,live]}).slope,1);
});
test('lamp rejects stale/missing/gapped OHLC, invalid grid and unsafe markets',async()=>{
  const f=lampFixture();
  assert.throws(()=>buildAtrLampReference({...f,rows:f.rows.slice(0,-1)}),/STALE/);
  assert.throws(()=>buildAtrLampReference({...f,rows:f.rows.filter((_,i)=>i!==20)}),/CANDLE_INVALID/);
  assert.throws(()=>buildAtrLampReference({...f,observation:{...f.observation,updatedAt:f.now-16000}}),/PRICE_STALE/);
  const broken=structuredClone(f.rows);broken[0][2]='0';assert.throws(()=>buildAtrLampReference({...f,rows:broken}),/CANDLE_INVALID/);
  const r=buildAtrLampReference(f);for(const [d,i] of [[0,0],[10,0],[1,501],[1,-501],[1,0.1]])assert.throws(()=>lampScanPoint(r,d,i),/OUT_OF_RANGE/);
  await assert.rejects(fetchAtrLampReference({market:'ANYTHING'}),/MARKET_INVALID/);
});
test('lamp fetch pins credential-free daily candles and provider timestamps',async()=>{
  const f=lampFixture(),calls=[];
  const r=await fetchAtrLampReference({now:()=>f.now,fetchImpl:async(url,options)=>{
    const u=new URL(url);calls.push(u);assert.equal(u.origin,'https://data-api.binance.vision');assert.equal(options.credentials,'omit');assert.equal(options.method,'GET');
    return {ok:true,json:async()=>u.pathname.endsWith('/klines')?f.rows:[{p:'140',T:f.now-1,a:40}]};
  }});
  assert.equal(r.observedAt,f.now-1);assert.equal(calls.find(u=>u.pathname.endsWith('/klines')).searchParams.get('interval'),'1d');
});

test('free oracle uses provider event timestamp, not fetch time; stale/future/missing times fail closed',async()=>{
  const fetchImpl=async()=>({ok:true,json:async()=>[{p:'100',T:1000,a:42}]});
  const rows=await fetchPublicMarketObservations({symbols:['BTCUSDT','ETHUSDT','BNBUSDT'],fetchImpl,now:()=>20000});
  for(const o of Object.values(rows)){assert.equal(o.updatedAt,1000);assert.equal(o.receivedAt,20000);assert.equal(o.stale,true);assert.equal(o.settlementAuthority,false);assert.equal(o.fallbackStatus,'NONE_FAIL_CLOSED')}
  assert.equal(publicObservationStatus(rows.BTCUSDT,1001).stale,false);
  assert.equal(publicObservationStatus(rows.BTCUSDT,999).stale,true);
  assert.equal(publicObservationStatus(null).stale,true);
  await assert.rejects(fetchPublicMarketObservations({symbols:['BTCUSDT'],fetchImpl:async()=>({ok:true,json:async()=>[{p:'100',a:1}]})}),/INVALID_PROVIDER/);
});
test('execution reference needs the same market, actual provider time, sequence and public source',()=>{
  const quote={market:'BTCUSDT',price:75000,updatedAt:1000,sequence:7,source:PUBLIC_MARKET_QUOTE_SOURCE.id,
    quoteCurrency:'USDT',settlementAuthority:false};
  const verify=observation=>assertVerifiedPublicMarketObservation(observation,{market:'BTCUSDT',now:16000});
  assert.equal(verify(quote),quote);
  const {updatedAt,...adapterFields}=quote;
  assert.doesNotThrow(()=>verify({...adapterFields,observedAt:updatedAt}));
  assert.throws(()=>verify(null),/STALE_PRICE/);
  for(const [changes,reason] of [
    [{updatedAt:999},/STALE_PRICE/],
    [{updatedAt:16001},/STALE_PRICE/],
    [{updatedAt:undefined,receivedAt:16000},/STALE_PRICE/],
    [{observedAt:1001},/INVALID_PROVIDER_OBSERVATION/],
    [{sequence:'7'},/INVALID_PROVIDER_OBSERVATION/],
    [{sequence:-1},/INVALID_PROVIDER_OBSERVATION/],
    [{price:NaN},/INVALID_PROVIDER_OBSERVATION/],
    [{market:'ETHUSDT'},/PUBLIC_QUOTE_MARKET_MISMATCH/],
    [{source:'K11520_DETERMINISTIC_SIMULATION'},/PUBLIC_QUOTE_SOURCE_REQUIRED/],
    [{quoteCurrency:'USD'},/PUBLIC_QUOTE_SOURCE_REQUIRED/],
    [{settlementAuthority:true},/PUBLIC_QUOTE_SOURCE_REQUIRED/],
  ])assert.throws(()=>verify({...quote,...changes}),reason);
});

test('aggregate-trade payload rejects substituted symbols and non-numeric price types',async()=>{
  const baseline={p:'75000',T:1000,a:7};
  for(const invalid of [{s:'ETHUSDT'},{symbol:'ETHUSDT'},{p:true},{p:['75000']},{a:'7'}]){
    const fetchImpl=async()=>({ok:true,json:async()=>[{...baseline,...invalid}]});
    await assert.rejects(fetchPublicMarketObservations({symbols:['BTCUSDT'],fetchImpl,now:()=>1000}),/INVALID_PROVIDER_OBSERVATION/);
  }
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
