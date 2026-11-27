import test from 'node:test';
import assert from 'node:assert/strict';
import {assertVerifiedPublicMarketObservation,fetchPublicMarketObservations,publicObservationStatus,buildAtrLampReference,buildFirstLampExample,lampScanPoint,LAMP_DAY_MS,fetchAtrLampReference} from '../runtime/public-market-quotes.mjs';

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
test('CT+1 can deliver all 1001 points even when a later research horizon falls below zero',()=>{
  const {rows,observation,now}=lampFixture();
  const falling=rows.map(([openAt,,,,,volume,closeAt],i)=>{
    const close=48-i;
    return [openAt,String(close+1),String(close+3),String(close-1),String(close),volume,closeAt];
  });
  const inputs={rows:falling,observation:{...observation,price:10},now};
  assert.throws(()=>buildAtrLampReference(inputs),/LAMP_MODEL_OUT_OF_RANGE/);
  const reference=buildAtrLampReference({...inputs,horizonDays:1});
  assert.deepEqual(reference.horizons.map(h=>h.day),[1]);
  const prices=Array.from({length:1001},(_,i)=>lampScanPoint(reference,1,i-500).price);
  assert.deepEqual([prices[0],prices[500],prices[1000]],[5,9,13]);
  assert.equal(new Set(prices).size,1001);
  assert.throws(()=>lampScanPoint(reference,2,0),/LAMP_REFERENCE_REQUIRED/);
  for(const horizonDays of [0,10,1.5,'1'])assert.throws(()=>buildAtrLampReference({...inputs,horizonDays}),/LAMP_HORIZON_INVALID/);
});

test('a fresh CT+1 fetch reconstructs the same UTC next-day interval; expired source data fails closed',async()=>{
  const {rows}=lampFixture();
  const midnight=40*LAMP_DAY_MS;
  const sourceTime=midnight-1;
  const pairs=[];
  const fetchImpl=async endpoint=>{
    const url=new URL(endpoint);
    pairs.push(url.searchParams.get('symbol'));
    return {ok:true,json:async()=>url.pathname.endsWith('/klines')?rows:[{p:'140',T:sourceTime,a:40}]};
  };
  const fetchAt=time=>fetchAtrLampReference({market:'ETHUSDT',horizonDays:1,now:()=>time,fetchImpl});
  const initial=await fetchAt(midnight);
  const reloaded=await fetchAt(sourceTime+15000);
  assert.equal(initial.market,'ETHUSDT');assert.equal(initial.observedAt,sourceTime);
  assert.equal(initial.horizons.length,1);assert.deepEqual(reloaded.horizons,initial.horizons);
  assert.equal(initial.horizons[0].targetOpenAt,midnight+LAMP_DAY_MS);
  assert.equal(initial.horizons[0].targetCloseAt,midnight+2*LAMP_DAY_MS-1);
  await assert.rejects(fetchAt(sourceTime+15001),/LAMP_CURRENT_PRICE_STALE/);
  assert.deepEqual(pairs,Array(6).fill('ETHUSDT'));
});

test('fixed first-lamp replay identifies its own source, timestamp, scenario and pressure for each market',()=>{
  const asOf=Date.UTC(2026,10,27);
  for(const [market,price] of [['BTCUSDT',75000],['ETHUSDT',2300],['BNBUSDT',600]]){
    const replay=buildFirstLampExample(market);
    assert.equal(replay.source,'K7744_CT1_EXAMPLE');assert.equal(replay.settlementAuthority,false);
    assert.equal(replay.market,market);assert.equal(replay.currentPrice,price);
    assert.equal(replay.observedAt,asOf);assert.equal(replay.receivedAt,asOf);assert.equal(replay.ctOpenAt,asOf);
    assert.equal(replay.closedCandles.length,40);
    assert.equal(replay.closedCandles.at(-1).closeAt,asOf-1);
    assert.equal(replay.atr14,4);assert.equal(replay.slope,1);
    assert.equal(replay.bullShare,0.625);assert.equal(replay.bearShare,0.375);
    assert.equal(replay.horizons.length,1);assert.equal(replay.horizons[0].targetOpenAt,asOf+LAMP_DAY_MS);
    assert.deepEqual([-500,0,500].map(index=>lampScanPoint(replay,1,index).price),[price-3,price+1,price+5]);
    assert.deepEqual(buildFirstLampExample(market),replay);
  }
  for(const market of ['INVALID','__proto__',null])assert.throws(()=>buildFirstLampExample(market),/LAMP_MARKET_INVALID/);
  const live=lampFixture();
  assert.throws(()=>buildAtrLampReference({...live,observation:{...live.observation,source:'K7744_CT1_EXAMPLE'},horizonDays:1}),/LAMP_CURRENT_PRICE_STALE/);
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
