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

test('existing utility owner gives expanded wallet an unobstructed view and restores peers on close',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/market-origin-wallet-layout-runtime.mjs',import.meta.url),'utf8');
 const fn=source.slice(source.indexOf('function syncUtilityMaster(){'),source.indexOf('function walletAnchor(){'));
 let walletClosed=false,hudHidden=false,utilitiesOpen=true;const hiddenPreferences=new Set();
 const nodes={};for(const id of ['walletPanel','walletToggle','dock','aiChatButton','chatHandle','bgmButton','backpackButton','gameModeToggle','k11520HudCollapseAll','kaiosPortalButton','cargoInterceptionButton','homeDeliveryButton'])nodes[id]={id,style:{values:{},setProperty(k,v){this.values[k]=v},removeProperty(k){delete this.values[k]}},classList:{contains:name=>name==='k11520HiddenBySettings'?hiddenPreferences.has(id):id==='walletPanel'&&name==='collapsed'?walletClosed:false},dataset:{},getAttribute:()=>''};
 const toggle={dataset:{},setAttribute(){},textContent:'',title:''},selectors=Object.keys(nodes).filter(k=>!['cargoInterceptionButton','homeDeliveryButton'].includes(k)).map(k=>'#'+k);
 const context=vm.createContext({walletWasOpen:false,put:(el,k,v)=>el.style.setProperty(k,v),installUtilityMaster:()=>toggle,document:{documentElement:{classList:{contains:name=>(name==='k11520UtilitiesOpen'&&utilitiesOpen)||(name==='k11520HudCollapsed'&&hudHidden)}},querySelectorAll:s=>nodes[s.slice(1)]?[nodes[s.slice(1)]]:[]},$:s=>nodes[s.slice(1)],OPTIONAL_UTILITIES:selectors,matchMedia:()=>({matches:false})});
 // The existing owner now composes with Settings; evaluate its real dependency
 // rather than bypassing that guard in this Wallet-only fixture.
 vm.runInContext(source.slice(source.indexOf('const settingsOpen='),source.indexOf('function put(')),context);
 vm.runInContext(source.slice(source.indexOf('function pinMobileUtilityStack(){'),source.indexOf('function installUtilityMaster(){')),context);vm.runInContext(fn,context);vm.runInContext('syncUtilityMaster()',context);
 for(const id of ['dock','aiChatButton','chatHandle','bgmButton','backpackButton'])assert.equal(nodes[id].style.values.display,'none');
 assert.notEqual(nodes.walletPanel.style.values.display,'none');assert.notEqual(nodes.walletToggle.style.values.display,'none');
 for(const id of ['cargoInterceptionButton','homeDeliveryButton'])assert.equal(nodes[id].style.values.display,'none');
 // Exercise the real owner sequence across repeated ticks and changed context eligibility.
 for(const [cargo,home] of [['cruise','idle'],['raid','delivery'],['cruise','delivery']]){nodes.cargoInterceptionButton.dataset.contextState=cargo;nodes.homeDeliveryButton.dataset.contextState=home;nodes.cargoInterceptionButton.dataset.worldContext=String(cargo!=='cruise');nodes.homeDeliveryButton.dataset.worldContext=String(home!=='idle');for(let tick=0;tick<2;tick++){vm.runInContext('pinMobileUtilityStack();syncUtilityMaster()',context);for(const id of ['cargoInterceptionButton','homeDeliveryButton','dock'])assert.equal(nodes[id].style.values.display,'none')}}
 hiddenPreferences.add('chatHandle');
 hudHidden=true;vm.runInContext('syncUtilityMaster()',context);assert.notEqual(nodes.k11520HudCollapseAll.style.values.display,'none','HUD restore remains reachable');hudHidden=false;vm.runInContext('pinMobileUtilityStack();syncUtilityMaster()',context);
 walletClosed=true;vm.runInContext('syncUtilityMaster()',context);for(const id of ['dock','aiChatButton','bgmButton','backpackButton'])assert.notEqual(nodes[id].style.values.display,'none');
 for(const id of ['cargoInterceptionButton','homeDeliveryButton'])assert.equal(nodes[id].style.values.display,'grid');
 assert.equal(nodes.chatHandle.style.values.display,'none','current hidden chat preference survives wallet close');
 utilitiesOpen=false;vm.runInContext('pinMobileUtilityStack();syncUtilityMaster()',context);assert.equal(nodes.cargoInterceptionButton.style.values.display,'none','now-idle cargo stays hidden');assert.equal(nodes.homeDeliveryButton.style.values.display,'grid','currently eligible delivery remains visible');
 assert.match(source,/walletOpen\?\['#k11520UtilityMaster',\.\.\.visibleContextActions,'#walletToggle'\]/);
});


test('wallet identity hints distinguish restored live identity, disconnect and confirmed wrong chain',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const hint=source.split('\n').find(line=>line.includes("const retainedHint=$('#walletRetained')"));
 const message=source.split('\n').find(line=>line.includes("$('#walletMsg').textContent=isTestnet()?"));
 const nodes={walletRetained:{hidden:false},walletMsg:{textContent:''}};
 const context=vm.createContext({$:selector=>nodes[selector.slice(1)],value:{account:'0xabc',chainId:97},chain:{status:'ORACLE_STALE'},isTestnet:()=>true,executionLabel:()=>'TESTNET'});
 const render=()=>vm.runInContext("(()=>{"+hint+message+"})()",context);render();assert.equal(nodes.walletRetained.hidden,true);assert.doesNotMatch(nodes.walletMsg.textContent,/WRONG NETWORK/);
 context.value={account:null,chainId:null};render();assert.equal(nodes.walletRetained.hidden,false);assert.doesNotMatch(nodes.walletMsg.textContent,/WRONG NETWORK/);
 context.value={account:'0xabc',chainId:1};render();assert.match(nodes.walletMsg.textContent,/WRONG NETWORK/);
});


test('M1 financial displays are explicitly NOT_REQUESTED and never infer zero positions or PnL',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const wallet={readScope:'BALANCES_ONLY',testBnbBalance:'0.1',testTokenBalance:1000,free:null};
 const context=vm.createContext({execution:{readOnly:true},walletExecutionView:()=>({readOnly:true,wallet,positions:[]}),receiptRows:rows=>JSON.stringify(rows)});
 vm.runInContext(source.slice(source.indexOf('function crossMarketSnapshot(){'),source.indexOf('function syncSimulationPositions(){')),context);
 const cross=vm.runInContext('crossMarketSnapshot()',context);assert.equal(cross.status,'NOT_REQUESTED');for(const key of ['openPositions','free','lockedMargin','realizedPnl','unrealizedPnl'])assert.equal(cross[key],null);
 vm.runInContext(source.slice(source.indexOf('function simulationOrganHTML(id){'),source.indexOf('function bindSimulationSheet(')),context);
 for(const organ of ['assets','orders','positions','history']){const html=vm.runInContext('simulationOrganHTML("'+organ+'")',context);assert.match(html,/NOT_REQUESTED/);assert.doesNotMatch(html,/尚無部位|尚無委託|尚無成交/)}
});


test('M1 market cards and close action never interpret unrequested positions as empty',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 assert.match(source,/execution\.readOnly\?'NOT_REQUESTED':x\.pos/);assert.match(source,/持倉：\$\{execution\.readOnly\?'NOT_REQUESTED':p/);
 const fn=source.slice(source.indexOf('async function closePos(){'),source.indexOf("$('#closeAll')",source.indexOf('async function closePos(){')));
 const prefix=fn.slice(0,fn.indexOf('const p=axis().pos;'))+'}';let message;
 const context=vm.createContext({execution:{readOnly:true},toast:x=>{message=x}});vm.runInContext(prefix,context);await vm.runInContext('closePos()',context);assert.match(message,/NOT_REQUESTED/);
});


test('execution owner initializes before startup world feedback can synchronously render market axes',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const declaration=source.split('\n').find(line=>line.startsWith('let execution=simulationExecution,'));
 assert.ok(source.indexOf(declaration)>source.indexOf('const simulationExecution='));assert.ok(source.indexOf(declaration)<source.indexOf('\nsyncWorldFeedback();'),'existing owner must be initialized before earliest synchronous HUD callback');
 const render=source.slice(source.indexOf('function renderAxes(){'),source.indexOf('function openMarketCard('));
 function fixture(){
  const cards=new Map(),axis={market:'BTCUSDT',pos:null};
  const axes={querySelector:selector=>cards.get(selector.match(/data-market-card="([^"]+)"/)[1])||null,appendChild:card=>cards.set(card.dataset.marketCard,card)};
  const document={createElement(){
   const attributes={},fields=Object.fromEntries(['.axisHead b','.marketName','.q','.pos'].map(selector=>[selector,{textContent:''}]));
   return {dataset:{},classList:{toggle(){}},querySelector:selector=>fields[selector],getAttribute:name=>attributes[name]??null,setAttribute(name,value){attributes[name]=String(value);if(name==='data-axis')this.dataset.axis=String(value);if(name==='data-market-card')this.dataset.marketCard=String(value)}};
  }};
  const context=vm.createContext({document,simulationExecution:{mode:'SIMULATION'},syncMarketKLabels:()=>{},S:{axis:'KX',axes:{KX:axis,KY:axis,KZ:axis},quotes:{}},$:selector=>selector==='#axes'?axes:null,$$:()=>[],fmt:String});
  return {cards,context};
 }
 const {context:preInit}=fixture();assert.throws(()=>vm.runInContext(render+'renderAxes();'+declaration,preInit),/Cannot access 'execution' before initialization/,'reproduce the exact CI startup failure ordering');
 const {cards,context}=fixture();vm.runInContext(declaration+render,context);vm.runInContext('renderAxes()',context);assert.equal(cards.size,3);for(const card of cards.values())assert.match(card.querySelector('.pos').textContent,/空倉/);
 vm.runInContext('execution={readOnly:true};renderAxes()',context);for(const card of cards.values()){assert.match(card.querySelector('.pos').textContent,/NOT_REQUESTED/);assert.doesNotMatch(card.querySelector('.pos').textContent,/空倉/)}
});

for(const [axis,market] of [['KX','BTCUSDT'],['KY','ETHUSDT'],['KZ','BNBUSDT']])for(const c of [1,-1])test(`actual openOrder owner opens ${market} ${c>0?'LONG':'SHORT'} while public quote is WAIT`,async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const {createExecutionAdapter}=await import('../K線西遊記/temples/11520/runtime/real-trading-order-intent.mjs');
 const {createKgenLedger,normalizeSignedC,signedCFromLegacyMagnitude}=await import('../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs');
 const ledger=createKgenLedger(100),execution=createExecutionAdapter({ledger,productV1:true,simulationFallback:true}),before=structuredClone(ledger);
 const nodes={'#confirmOrder':{},'#confirmBody':{},'#confirm':{classList:{add:v=>{nodes.open=v}}}},toasts=[];
 const state={axis,quotes:{},axes:{[axis]:{market,c,lots:1}}};let previews=0;
 const context=vm.createContext({S:state,execution,pending:null,axis:()=>state.axes[axis],syncTradeAxisFromPlane(){},isTestnet:()=>false,price:()=>0,toast:x=>toasts.push(x),normalizeSignedC,signedCFromLegacyMagnitude,$:id=>nodes[id],$$:()=>[],paintOrderPreview:()=>previews++,journey:{event:()=>false},__K11520_SIGNED_C_IMMERSIVE__:{signedByAxis:{[axis]:c}}});
 vm.runInContext(source.slice(source.indexOf('function executionQuote('),source.indexOf('function orderInput(')),context);
 vm.runInContext(source.slice(source.indexOf('function openOrder(){'),source.indexOf("$('#cancelOrder').onclick")),context);context.openOrder();
 assert.equal(nodes.open,'open');assert.equal(previews,1);assert.equal(context.pending.market,market);assert.equal(context.pending.c,c);assert.deepEqual(toasts,[]);assert.deepEqual(ledger,before,'opening preview must not debit or mutate simulation');assert.deepEqual(state.quotes,{},'never relabel fallback as LIVE public data');
});

test('actual order UI catches corrupt-source and rollback quote failures and clears stale confirmation',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 for(const message of ['INVALID_SIMULATION_SOURCE','provider payload with private content']){
  const nodes={'#confirmOrder':{disabled:false},'#confirm':{classList:{remove:value=>{nodes.removed=value}}}},toasts=[];
  const context=vm.createContext({execution:{mode:'SIMULATION',quote(){throw new Error(message)}},pending:{axis:'KY'},axis:()=>({market:'ETHUSDT'}),syncTradeAxisFromPlane(){},$:id=>nodes[id],toast:value=>toasts.push(value)});
  vm.runInContext(source.slice(source.indexOf('function executionQuote('),source.indexOf('function orderInput(')),context);
  vm.runInContext(source.slice(source.indexOf('function openOrder(){'),source.indexOf("$('#cancelOrder').onclick")),context);
  assert.doesNotThrow(()=>context.openOrder());assert.equal(context.pending,null);assert.equal(nodes['#confirmOrder'].disabled,true);assert.equal(nodes.removed,'open');
  assert.equal(toasts[0],message==='INVALID_SIMULATION_SOURCE'?'ORDER_REJECTED · INVALID_SIMULATION_SOURCE':'ORDER_REJECTED · INVALID_EXECUTION_QUOTE');
 }
});

test('order presentation distinguishes creation provenance from current pending/fill source and SIM time',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const {createExecutionAdapter}=await import('../K線西遊記/temples/11520/runtime/real-trading-order-intent.mjs');
 const {createKgenLedger}=await import('../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs');
 const adapter=createExecutionAdapter({ledger:createKgenLedger(100),simulationFallback:true});
 adapter.observe({market:'ETHUSDT',price:4000,observedAt:1000,now:1000,source:'BINANCE_PUBLIC_MARKET_DATA_ONLY'});
 adapter.submit({axis:'KY',market:'ETHUSDT',c:1,lots:1,triggerPrice:4001},{now:1001});
 adapter.tick({now:17000});
 const context=vm.createContext({execution:{readOnly:false},walletExecutionView:()=>adapter.snapshot(),isTestnet:()=>false,receiptRows:rows=>JSON.stringify(rows),receiptTime:x=>x,executionLabel:()=>'SIMULATION'});
 vm.runInContext(source.slice(source.indexOf('function simulationOrganHTML(id){'),source.indexOf('function bindSimulationSheet(')),context);
 for(const time of [17000,33000]){
  if(time===33000)adapter.tick({now:time});
  const html=vm.runInContext("simulationOrganHTML('orders')",context);
  assert.ok(html.includes('["SOURCE AT CREATION","BINANCE_PUBLIC_MARKET_DATA_ONLY"]'));
  assert.ok(html.includes('["EXECUTION SOURCE","K11520_DETERMINISTIC_SIMULATION"]'));
 }
 assert.match(source,/isTestnet\(\)\?'ORACLE TIME':'OBSERVED AT \(SIMULATION\)'/);
});
