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

test('public browser QA fails closed on legacy manifest before touching signer and retains bounded candidate writes',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/tests/11520-browser-settlement.mjs',import.meta.url),'utf8');
 const publicSource=source.slice(source.indexOf('async function publicTestnetBrowserQA(){'));
 assert.ok(publicSource.indexOf("assert.equal(manifest.pnlModel,'INDEX_DELTA_C_LOTS_V1'")<publicSource.indexOf('process.env.BSC_TESTNET_PRIVATE_KEY'));
 assert.ok(publicSource.indexOf("assert.equal(manifest.capabilities?.settlementCapital,'ISOLATED_V1'")<publicSource.indexOf('process.env.BSC_TESTNET_PRIVATE_KEY'));
 assert.match(publicSource,/docs\/K11520_BSC_TESTNET_DEPLOYMENT_MANIFEST\.json/);
 assert.match(publicSource,/budget=parseEther\('0\.005'\)/);assert.match(publicSource,/value:0n,chainId:97/);
 assert.match(publicSource,/WITHDRAW_TEST_AMOUNT_CAP/);assert.match(publicSource,/DEPOSIT_TEST_AMOUNT_CAP/);
 assert.match(publicSource,/wallet\.allowanceWei\)<parseEther\('100'\)/);
 assert.match(publicSource,/candidate raw PnL is delta index times100C times100lots/);
 assert.match(publicSource,/readOnly\?null:new Wallet/,'diagnostic mode does not construct a signer');
 assert.match(publicSource,/assert\.equal\(readOnly,false,'read-only QA cannot broadcast'\)/);
 assert.match(publicSource,/assert\.equal\(BigInt\(await logProvider\.send\('eth_chainId',\[\]\)\),97n\)/);
 assert.match(publicSource,/if\(method==='eth_getLogs'\).*logProvider\.send\(method,params\)/,'optional index serves only logs, never transactions');
});

test('selected Testnet route reports Testnet without activating Mainnet or claiming a receipt',()=>{
 const preflight={ready:false,blockers:['HUMAN_MAINNET_EXECUTION_AUTHORIZATION_REQUIRED']};
 const testnet=classify11520OrderRoute({preflight,execution:{mode:'BSC_TESTNET',chainId:97,status:'READY'}});
 assert.equal(testnet.route,'TESTNET_EXPLICIT_WALLET_ACTION');assert.equal(testnet.broadcast,false);assert.equal(testnet.signerRequested,false);
 assert.match(testnet.label,/NO REAL VALUE/);
 assert.equal(classify11520OrderRoute({preflight,execution:{mode:'ON_CHAIN',chainId:56}}).route,'LOCAL_SIMULATION_REAL_BLOCKED');
 assert.equal(classify11520OrderRoute({preflight,execution:{mode:'BSC_TESTNET',chainId:56}}).route,'LOCAL_SIMULATION_REAL_BLOCKED');
});

test('deferred Testnet routing observer preserves execution errors and receipt feedback',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/real-trading-preflight-ui.mjs',import.meta.url),'utf8');
 const fn=source.slice(source.indexOf('function notifyOrderRoute(){'),source.indexOf('\nexport function install11520RealTradingPreflightUi'));
 for(const status of ['READY','ORACLE_STALE','WRONG_CHAIN','DISCONNECTED']){
  const toast={textContent:'ORACLE_STALE · 行情未就緒',classList:{add(){throw new Error('observer must not replace execution feedback')}}};
  const context=vm.createContext({renderPreflight:()=>({ready:false}),classify11520OrderRoute,$:()=>toast,__K11520_EXECUTION__:{snapshot:()=>({mode:'BSC_TESTNET',chainId:97,status})},setTimeout(){throw new Error('observer must not clear execution feedback')}});
  vm.runInContext(fn,context);const route=context.notifyOrderRoute();
  assert.equal(route.route,'TESTNET_EXPLICIT_WALLET_ACTION');assert.equal(route.status,status);
  assert.equal(context.__K11520_ORDER_ROUTE__.status,status);assert.equal(toast.textContent,'ORACLE_STALE · 行情未就緒');
  assert.equal(route.signerRequested,false);assert.equal(route.broadcast,false);
 }
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

test('M1 wallet view never pairs another account or wrong network with recovered Testnet balances',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const fn=source.slice(source.indexOf('function walletExecutionView('),source.indexOf('function renderWallet('));
 const account='0x'+'11'.repeat(20),chain={account,status:'READY',wallet:{testBnbBalance:'0.025',testTokenBalance:100},capital:{settlementCapital:1000},claims:[{remaining:10}]};
 for(const value of [{account:'0x'+'22'.repeat(20),chainId:97},{account,chainId:56},{account:null,chainId:97}]){
  const context=vm.createContext({execution:{snapshot:()=>chain},isTestnet:()=>true,value});const result=vm.runInContext(fn+';walletExecutionView(value)',context);
  assert.equal(result.wallet,null);assert.equal(result.capital,null);assert.equal(result.claims.length,0);assert.equal(result.orders.length,0);assert.equal(result.positions.length,0);assert.equal(result.receipts.length,0);assert.equal(result.transaction,null);
 }
 const context=vm.createContext({execution:{snapshot:()=>chain},isTestnet:()=>true,value:{account,chainId:97}});
 assert.equal(vm.runInContext(fn+';walletExecutionView(value)',context).wallet.testBnbBalance,'0.025');
 assert.match(source, /TEST BNB · GAS ONLY/);assert.match(source,/testBnbBalance\?\?'UNVERIFIED'/);
});


test('M1 wallet-session READING clears cached financial surfaces before adapter recovery',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const start=source.indexOf('walletSession.subscribe(value=>{'),end=source.indexOf('});renderWallet();',start),fn=source.slice(start,end+3);
 const calls=[];let callback;
 const context=vm.createContext({walletSession:{subscribe:fn=>{callback=fn}},execution:{readOnly:true},readOnlyViewRequested:()=>true,playerStore:{activate:()=>false},renderWallet:()=>calls.push('wallet'),isTestnet:()=>true,syncSimulationPositions:()=>calls.push('positions'),refreshSimulationSheet:()=>calls.push('sheet'),refreshTestnet:()=>calls.push('recover')});
 vm.runInContext(fn,context);callback({account:null,status:'READING'});
 assert.deepEqual(calls,['wallet','positions','sheet','recover']);
});

test('M1 candidate config is additive and legacy principal exit context is preserved',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../docs/K11520_BSC_TESTNET_DEPLOYMENT_MANIFEST.json',import.meta.url),'utf8'));
 assert.equal(manifest.addresses.brainProxy,'0x60e3801CDf885830ca45Def76a6141f841B0521d');
 assert.equal(manifest.addresses.testToken,'0x91ac96ff5f6B5D63aab0d6F17DF8D70AC295dBc3');
 const candidate=manifest.readOnlyCandidates.wallet1c;
 assert.equal(candidate.addresses.brainProxy,'0x8bb97Ab011b8983963F98aDEd8F8c93A54969667');assert.equal(candidate.viewCapability,'READ_ONLY_M1');assert.equal(candidate.cMax,1);assert.equal(candidate.chainId,97);
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const view=source.slice(source.indexOf('async function selectReadOnlyWalletView(){'),source.indexOf('async function refreshTestnet(){'));
 assert.match(view,/readOnly:true/);assert.doesNotMatch(view,/executionPreferenceKey|dispose|localStorage/);
 assert.match(source,/exitOnly:true/);assert.match(source,/legacyExecution\|\|createExecutionAdapter/);
});
