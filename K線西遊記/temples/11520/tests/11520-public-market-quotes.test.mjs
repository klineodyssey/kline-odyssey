import test from 'node:test';
import assert from 'node:assert/strict';
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
