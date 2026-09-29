import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {classify11520OrderRoute} from '../K線西遊記/temples/11520/runtime/real-trading-preflight-ui.mjs';

test('slow order preview is not starved by polling and newer input invalidates stale results',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const fn=source.slice(source.indexOf('async function paintOrderPreview('),source.indexOf('\nfunction openOrder('));
 const button={disabled:false},panel={textContent:''},resolvers=[];
 const context=vm.createContext({pending:{axis:'KY',market:'ETHUSDT'},executionBusy:false,previewSequence:0,previewRequests:0,execution:{preview:()=>new Promise(resolve=>resolvers.push(resolve))},orderInput:()=>({}),$:id=>id==='#confirmOrder'?button:panel});
 vm.runInContext(fn,context);const first=context.paintOrderPreview();
 for(let i=0;i<10;i++)await context.paintOrderPreview({background:true});
 assert.equal(resolvers.length,1,'background polling must not supersede in-flight preview');
 const newer=context.paintOrderPreview();assert.equal(resolvers.length,2,'changed input still requests a fresh preview');
 resolvers[0]({ok:false,code:'OLD',reason:'old'});await first;assert.equal(panel.textContent,'');
 resolvers[1]({ok:false,code:'NEW',reason:'latest input'});await newer;assert.match(panel.textContent,/NEW/);assert.equal(context.previewRequests,0);
 const disconnected=context.paintOrderPreview();context.pending=null;resolvers[2]({ok:true});await disconnected;assert.equal(button.disabled,true,'closed or disconnected preview cannot re-enable confirm');
});

test('selected Testnet route reports Testnet without activating Mainnet or claiming a receipt',()=>{
 const preflight={ready:false,blockers:['HUMAN_MAINNET_EXECUTION_AUTHORIZATION_REQUIRED']};
 const testnet=classify11520OrderRoute({preflight,execution:{mode:'BSC_TESTNET',chainId:97,status:'READY'}});
 assert.equal(testnet.route,'TESTNET_EXPLICIT_WALLET_ACTION');assert.equal(testnet.broadcast,false);assert.equal(testnet.signerRequested,false);
 assert.match(testnet.label,/NO REAL VALUE/);
 assert.equal(classify11520OrderRoute({preflight,execution:{mode:'ON_CHAIN',chainId:56}}).route,'LOCAL_SIMULATION_REAL_BLOCKED');
 assert.equal(classify11520OrderRoute({preflight,execution:{mode:'BSC_TESTNET',chainId:56}}).route,'LOCAL_SIMULATION_REAL_BLOCKED');
});

test('routes to explicit wallet action only when preflight is ready',()=>{
  const route=classify11520OrderRoute({preflight:{ready:true,blockers:[]},localSimulationAvailable:true});
  assert.equal(route.route,'REAL_READY_FOR_EXPLICIT_WALLET_ACTION');
  assert.equal(route.signerRequested,false);
  assert.equal(route.broadcast,false);
});

test('keeps existing order flow local while real trading is blocked',()=>{
  const route=classify11520OrderRoute({preflight:{ready:false,blockers:['PRODUCTION_FEED_PROVENANCE_REQUIRED']},localSimulationAvailable:true});
  assert.equal(route.route,'LOCAL_SIMULATION_REAL_BLOCKED');
  assert.equal(route.localSimulationAvailable,true);
  assert.deepEqual(route.blockers,['PRODUCTION_FEED_PROVENANCE_REQUIRED']);
  assert.equal(route.signerRequested,false);
  assert.equal(route.broadcast,false);
});

test('fails closed when no local or real route is available',()=>{
  const route=classify11520OrderRoute({preflight:{ready:false,blockers:['WALLET_PUBLIC_IDENTITY_REQUIRED']},localSimulationAvailable:false});
  assert.equal(route.route,'ORDER_BLOCKED');
  assert.equal(route.broadcast,false);
});
