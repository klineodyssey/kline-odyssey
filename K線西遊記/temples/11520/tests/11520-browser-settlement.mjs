import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

if(process.argv.includes('--local-candidate')){
  await localCandidateBrowserQA();process.exit(0);
}

if(process.argv.includes('--testnet97')){
  try{await publicTestnetBrowserQA();process.exit(0)}
  catch(error){console.error('TESTNET_BROWSER_QA_FAILED',/^[A-Z_0-9]+$/.test(String(error?.code||''))?error.code:'CHECK_PUBLIC_QA_ARTIFACTS');process.exit(1)}
}

// Real Chromium, deterministic read-only quote fixtures. Never a live-funds oracle.
const base=process.env.K11520_BASE_URL||'http://127.0.0.1:4173';
const out='artifacts/11520-settlement-qa';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try {
  for(const [width,height] of [[390,844],[844,390]]) {
    let eth=4000;
    const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    // Ordinary simulation QA must remain independent of a public rehearsal.
    // An unverified manifest may not silently activate wallet transactions.
    await page.route('**/docs/K11520_BSC_TESTNET_DEPLOYMENT_MANIFEST.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:'PREPARED_NOT_DEPLOYED',chainId:97,testOnly:true})}));
    // Exercise late optional UI delivery after the authoritative bootstrap has
    // already dismissed its intro. It must not create a second pointer blocker.
    await page.route('**/runtime/game-ui-product-fixes-v23.mjs',async route=>{
      await new Promise(resolve=>setTimeout(resolve,3500));await route.continue();
    });
    // Synthetic EIP-1193 provider, not a connected Human wallet or live balance.
    await page.addInitScript(()=>{
      const listeners=new Map();
      const fixture={account:'0x1111111111111111111111111111111111111111',chain:'0x38',reject:false,calls:[],emit(name,value){for(const fn of listeners.get(name)||[])fn(value)}};
      window.__walletFixture=fixture;
      window.ethereum={on:(name,fn)=>{if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn)},removeListener:(name,fn)=>listeners.get(name)?.delete(fn),request:async({method})=>{
        fixture.calls.push(method);
        if(method==='eth_requestAccounts'&&fixture.reject)throw Object.assign(new Error('Rejected fixture'),{code:4001});
        if(method==='eth_accounts'||method==='eth_requestAccounts')return [fixture.account];
        if(method==='eth_chainId')return fixture.chain;
        if(method==='eth_getBalance')return '0xde0b6b3a7640000';
        if(method==='eth_call')return '0x'+(12345n*10n**18n).toString(16).padStart(64,'0');
        throw new Error('Forbidden fixture wallet method '+method);
      }};
    });
    await page.route('https://data-api.binance.vision/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{symbol:'BTCUSDT',price:'100000'},{symbol:'ETHUSDT',price:String(eth)},{symbol:'BNBUSDT',price:'600'}])}));
    await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',async route=>{
      const prefix='https://cdn.jsdelivr.net/npm/three@0.180.0/';
      let body=await fs.readFile(`node_modules/three/${route.request().url().slice(prefix.length)}`,'utf8');
      body=body.replaceAll("from 'three'",`from '${prefix}build/three.module.js'`).replaceAll('from "three"',`from "${prefix}build/three.module.js"`);
      await route.fulfill({status:200,contentType:'text/javascript',body});
    });
    await page.goto(`${base}/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>globalThis.__K11520_SIMULATION_EXCHANGE__?.snapshot().observations.ETHUSDT,{timeout:15000});
    await page.screenshot({path:`${out}/${width}x${height}-late-ui-boot.png`});
    assert.equal(await page.locator('#intro11520 .introSkip').count(),0,'late legacy UI must not recreate an intro over the live game');
    if(await page.locator('#enter11520').isVisible())await page.locator('#enter11520').click({timeout:1500}).catch(()=>{});
    await page.locator('#intro11520').waitFor({state:'hidden',timeout:5000});
    await page.locator('#cNumericInput').fill('100');await page.locator('#cNumericInput').press('Enter');
    await page.locator('#lotsNumericInput').fill('10');await page.locator('#lotsNumericInput').press('Enter');
    const organ=async name=>{
      if(await page.locator('#sheet').isVisible())await page.locator('#sheetClose').click();
      if(!await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
      if(!await page.locator(`#dock [data-organ="${name}"]`).isVisible())await page.locator('#dockToggle').click();
      await page.locator(`#dock [data-organ="${name}"]`).click();
    };
    const shot=async name=>page.screenshot({path:`${out}/${width}x${height}-${name}.png`});
    await shot('game');
    assert.equal(await page.evaluate(()=>__walletFixture.calls.filter(m=>m==='eth_requestAccounts').length),0,'no automatic account request');
    await page.locator('#k11520UtilityMaster').click();await page.locator('#walletToggle').click();
    await page.evaluate(()=>{__walletFixture.reject=true});
    await page.locator('#walletConnect').click();
    await page.waitForFunction(()=>document.querySelector('#walletMsg').textContent.includes('USER_REJECTED'));
    await shot('wallet-rejected');
    await page.evaluate(()=>{__walletFixture.reject=false});
    await page.locator('#walletConnect').click();
    await page.waitForFunction(()=>document.querySelector('#wKgen').textContent==='12345');
    for(const id of ['walletConnect','walletRefresh']){
      const usable=await page.locator('#'+id).evaluate(el=>{const r=el.getBoundingClientRect();return r.height>=44&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))});
      assert.equal(usable,true,id+' must be unclipped and pointer reachable');
    }
    assert.equal(await page.locator('#wAddr').innerText(),'0x1111111111111111111111111111111111111111');
    assert.equal(await page.locator('#executionMode').isDisabled(),true,'unverified deployment must stay fail closed');
    assert.equal(await page.evaluate(()=>__K11520_EXECUTION__.snapshot().mode),'SIMULATION_WALLET');
    assert.match(await page.locator('#wChain').innerText(),/BNB Smart Chain.*56/);
    await shot('wallet-connected');
    await page.locator('#walletPanel').evaluate(el=>{el.scrollTop=el.scrollHeight});
    await shot('wallet-metrics');
    await page.locator('#walletPanel').evaluate(el=>{el.scrollTop=0});
    await page.locator('#walletToggle').click();
    await organ('trade');await page.locator('#sheetClose').click();await page.locator('#k11520UtilityMaster').click();await page.locator('#orderFire').click();
    await page.locator('#simulationTriggerPrice').fill('4001');
    await shot('pending-confirm');
    await page.locator('#confirmOrder').click();
    // PENDING ledger state is observable before the async click handler opens
    // the orders sheet. Wait for that real UI transition before navigating it.
    await page.locator('#confirm').waitFor({state:'hidden'});
    await page.locator('#sheet.open').waitFor({state:'visible'});
    const snap=()=>page.evaluate(()=>globalThis.__K11520_SIMULATION_EXCHANGE__.snapshot());
    let s=await snap();assert.equal(s.orders[0].status,'PENDING');assert.equal(s.wallet.lockedMargin,0);
    await organ('orders');await shot('pending');
    eth=4002;
    await page.waitForFunction(()=>globalThis.__K11520_SIMULATION_EXCHANGE__.snapshot().orders[0]?.status==='FILLED',null,{timeout:15000});
    s=await snap();assert.equal(s.positions.length,1);assert.equal(s.wallet.lockedMargin,10);assert.equal(s.wallet.free,90);
    assert.equal(s.receipts.filter(r=>r.kind==='FILL').length,1);
    await organ('positions');await shot('filled');
    const openId=s.positions[0].positionId;
    await page.evaluate(()=>{__walletFixture.account='0x2222222222222222222222222222222222222222';__walletFixture.emit('accountsChanged',[__walletFixture.account])});
    await page.waitForFunction(()=>document.querySelector('#wAddr').textContent==='0x2222222222222222222222222222222222222222');
    await page.evaluate(()=>{__walletFixture.chain='0x1';__walletFixture.emit('chainChanged','0x1')});
    await page.waitForFunction(()=>document.querySelector('#walletMsg').textContent.includes('WRONG_CHAIN'));
    assert.equal(await page.locator('#wKgen').innerText(),'--');
    assert.equal((await snap()).positions[0].positionId,openId,'wallet events must not reload or reset simulation');
    await page.evaluate(()=>{__walletFixture.chain='0x38';__walletFixture.emit('chainChanged','0x38')});
    await page.waitForFunction(()=>document.querySelector('#wKgen').textContent==='12345');
    eth=3920;
    await page.waitForFunction(()=>globalThis.__K11520_SIMULATION_EXCHANGE__.snapshot().positions[0]?.status==='LIQUIDATED',null,{timeout:15000});
    s=await snap();assert.equal(s.positions[0].margin,0);assert.equal(s.wallet.free,90);assert.equal(s.wallet.lockedMargin,0);
    assert.equal(s.receipts.filter(r=>r.kind==='SETTLEMENT').length,1);assert.ok(s.receipts.at(-1).badDebt>0);
    await organ('history');await page.locator('#sheetBody summary').first().click();await shot('liquidation-receipt');
    await organ('assets');await shot('wallet');
    assert.match(await page.locator('#sheetBody').innerText(),/SIMULATION WALLET/);
    for(const label of ['AVAILABLE','LOCKED MARGIN','EQUITY','UNREALIZED PNL','REALIZED PNL'])assert.match(await page.locator('#sheetBody').innerText(),new RegExp(label));
    eth=4002;await page.waitForTimeout(5500);s=await snap();assert.equal(s.positions[0].status,'LIQUIDATED');assert.equal(s.receipts.length,2);
    await page.locator('#sheetClose').click();
    if(await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
    await page.locator('#orderFire').click();await page.locator('#simulationTriggerPrice').fill('4003');await page.locator('#confirmOrder').click();
    eth=4004;
    await page.waitForFunction(()=>globalThis.__K11520_SIMULATION_EXCHANGE__.snapshot().positions[1]?.status==='OPEN',null,{timeout:15000});
    eth=4008;
    await page.waitForFunction(()=>globalThis.__K11520_SIMULATION_EXCHANGE__.snapshot().wallet.unrealizedPnl>0,null,{timeout:15000});
    await organ('positions');await shot('pnl');
    await page.locator('[data-sim-close]').click();
    s=await snap();assert.equal(s.positions[1].status,'CLOSED');assert.equal(s.wallet.lockedMargin,0);assert.ok(s.wallet.free>90);
    assert.equal(s.receipts.length,4);assert.equal(s.receipts.at(-1).status,'CLOSED');
    await organ('history');await page.locator('#sheetBody summary').first().click();await shot('close-receipt');
    await page.evaluate(()=>__walletFixture.emit('disconnect',{}));
    await page.waitForFunction(()=>document.querySelector('#wAddr').textContent==='DISCONNECTED');
    assert.equal((await snap()).receipts.length,4);
    assert.equal(await page.evaluate(()=>__walletFixture.calls.some(m=>!/^(eth_requestAccounts|eth_accounts|eth_chainId|eth_getBalance|eth_call)$/.test(m))),false);
    await page.locator('#sheetClose').click();
    if(await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
    for(let i=0;i<3;i++){await page.setViewportSize({width:390,height:844});await page.waitForTimeout(120);await page.setViewportSize({width:844,height:390});await page.waitForTimeout(120)}
    await page.setViewportSize({width,height});await page.waitForTimeout(200);await shot('rotation');
    const canvas=await page.locator('#three').boundingBox();assert.ok(Math.abs(canvas.height-height)<=2);
    const hit=await page.locator('#attack').evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))});assert.equal(hit,true,'attack pointer path');
    assert.deepEqual(errors,[]);await fs.writeFile(`${out}/${width}x${height}-result.json`,JSON.stringify({mode:'DETERMINISTIC_SIMULATION_FIXTURES',functional:'PASS',visual:'REQUIRES_DIRECT_IMAGE_INSPECTION',snapshot:s},null,2));
    await page.close();
  }
  console.log('PASS: real Chromium pending/cross/fill/isolated liquidation/receipts/wallet/rotation (both viewports)');
} finally {await browser.close()}

// Actual candidate contracts in a disposable local EVM. No configured keys,
// public RPC or public transactions; the manifest is intercepted only in QA.
async function localCandidateBrowserQA(){
  const {execFileSync}=await import('node:child_process');
  execFileSync(process.execPath,['KGEN/scripts/rehearse_bsc_testnet.mjs'],{stdio:'pipe'});
  const {default:ganache}=await import('ganache');
  const {BrowserProvider,Contract,ContractFactory,Interface,parseEther,keccak256,ZeroAddress}=await import('ethers');
  const rpc=ganache.provider({chain:{chainId:97},wallet:{totalAccounts:4},miner:{timestampIncrement:1},logging:{quiet:true}});
  const provider=new BrowserProvider(rpc);provider.pollingInterval=10;
  const signers=await Promise.all([0,1,2,3].map(i=>provider.getSigner(i))),accounts=await Promise.all(signers.map(s=>s.getAddress()));
  const artifacts=JSON.parse(await fs.readFile('artifacts/bsc97/build.json','utf8')).artifacts;
  const deployed={};
  async function deploy(key,args=[]){const c=await new ContractFactory(artifacts[key].abi,artifacts[key].bytecode,signers[0]).deploy(...args);await c.waitForDeployment();deployed[key]=c;return c}
  const send=async(c,method,args=[])=>{const tx=await c[method](...args);const receipt=await tx.wait();assert.equal(receipt.status,1);return receipt};
  const token=await deploy('testToken'),impl=await deploy('brainImplementation');
  const init=new Interface(artifacts.brainImplementation.abi).encodeFunctionData('initialize',[token.target,accounts[0],ZeroAddress,accounts[0],accounts[0],accounts[0],0]);
  const proxy=await deploy('brainProxy',[impl.target,init]),brain=new Contract(proxy.target,artifacts.brainImplementation.abi,signers[0]);
  const position=await deploy('positionEngine',[accounts[0],proxy.target,proxy.target]),trigger=await deploy('orderTriggerEngine',[position.target,accounts[0]]);
  await send(position,'setExecutor',[trigger.target]);await send(brain,'grantRole',[await brain.SETTLEMENT_ROLE(),position.target]);
  const feeds=[];
  for(let market=0;market<3;market++){
    const set=[];for(let i=0;i<3;i++)set.push(await deploy('oracle',[parseEther('100')]));feeds.push(set);
    await send(position,'configureMarket',[market,100,10,3600,parseEther('98'),parseEther('102'),true]);
    await send(position,'configureOracle',[market,set.map(f=>f.target),2,500]);
  }
  await send(token,'mint',[accounts[0],parseEther('200000')]);await send(token,'approve',[proxy.target,parseEther('200000')]);
  await send(brain,'fundSettlementCapital',[parseEther('100000')]);await send(brain,'fundInsurance',[parseEther('10000')]);
  for(const account of accounts.slice(1))await send(token,'mint',[account,parseEther('10000')]);
  const addresses=Object.fromEntries(['testToken','brainImplementation','brainProxy','positionEngine','orderTriggerEngine'].map(k=>[k,deployed[k].target]));
  const codeHashes=Object.fromEntries(await Promise.all(Object.entries(addresses).map(async([k,a])=>[k,keccak256(await provider.getCode(a))])));
  // publicNetwork is an adapter gate exercised under isolated route interception;
  // this synthetic QA manifest is never saved/published as a public deployment.
  const fixtureManifest={mode:'BSC_TESTNET',status:'DEPLOYED_CONFIG_VERIFIED',chainId:97,testOnly:true,publicNetwork:true,verified:true,deploymentBlock:1,addresses,codeHashes,
    capabilities:{settlementCapital:'ISOLATED_V1'},pnlModel:'INDEX_DELTA_C_LOTS_V1'};
  const price=async(value)=>{const block=await rpc.request({method:'eth_getBlockByNumber',params:['latest',false]});for(const f of feeds[1])await send(f,'set',[parseEther(String(value)),Number(BigInt(block.timestamp))])};
  const out='artifacts/11520-candidate-wallet-qa';await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch({headless:true});let active=accounts[1],connected=false,writes=0;
  try{for(const [width,height,player] of [[390,844,1],[844,390,2]]){
    active=accounts[player];connected=false;await price(100);
    const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true}),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));let stage='boot';const rpcFailures=[];
    await page.exposeBinding('candidateRpc',async(_source,{method,params=[]})=>{
      if(method==='eth_accounts')return connected?[active]:[];
      if(method==='eth_requestAccounts'){connected=true;return[active]}
      if(method==='wallet_switchEthereumChain'){assert.equal(params[0].chainId,'0x61');return null}
      if(method==='eth_sendTransaction'){
        assert.equal(params[0].from.toLowerCase(),active.toLowerCase());assert.equal(BigInt(params[0].value||0),0n);
        assert.ok(Object.values(addresses).some(a=>a.toLowerCase()===params[0].to.toLowerCase()));writes++;
      }
      const started=Date.now();try{return await rpc.request({method,params})}catch(error){rpcFailures.push({method,message:String(error?.message),data:error?.data});throw error}finally{if(Date.now()-started>5000)console.log('LOCAL_RPC_DURATION',method,params[0]?.data?.slice(0,10)||'',Date.now()-started)}
    });
    await page.addInitScript(()=>{const listeners=new Map();window.ethereum={request:r=>window.candidateRpc(r),on:(e,f)=>{if(!listeners.has(e))listeners.set(e,new Set());listeners.get(e).add(f)},removeListener:(e,f)=>listeners.get(e)?.delete(f)};window.candidateAccountChanged=a=>{for(const f of listeners.get('accountsChanged')||[])f([a])}});
    await page.route('**/docs/K11520_BSC_TESTNET_DEPLOYMENT_MANIFEST.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(fixtureManifest)}));
    await page.route('https://data-api.binance.vision/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify([{symbol:'BTCUSDT',price:'100000'},{symbol:'ETHUSDT',price:'4000'},{symbol:'BNBUSDT',price:'600'}])}));
    await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',async r=>{const prefix='https://cdn.jsdelivr.net/npm/three@0.180.0/';let body=await fs.readFile('node_modules/three/'+r.request().url().slice(prefix.length),'utf8');body=body.replaceAll("from 'three'",`from '${prefix}build/three.module.js'`).replaceAll('from "three"',`from "${prefix}build/three.module.js"`);await r.fulfill({contentType:'text/javascript',body})});
    const shot=async name=>page.screenshot({path:`${out}/${width}x${height}-${name}.png`});
    const snap=()=>page.evaluate(()=>globalThis.__K11520_EXECUTION__?.snapshot()??null);
    // Fresh deploy + full receipt recovery competes with software WebGL on CI.
    // Wait for actual state, never replace it with fabricated UI success.
    const wait=fn=>page.waitForFunction(fn,null,{timeout:120000});
    const wallet=async()=>{if(await page.locator('#sheet').isVisible())await page.locator('#sheetClose').click();if(!await page.locator('html').evaluate(e=>e.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();if(await page.locator('#walletPanel').evaluate(e=>e.classList.contains('collapsed')))await page.locator('#walletToggle').click()};
    const game=async()=>{if(await page.locator('#sheet').isVisible())await page.locator('#sheetClose').click();if(!await page.locator('#walletPanel').evaluate(e=>e.classList.contains('collapsed')))await page.locator('#walletToggle').click();if(await page.locator('html').evaluate(e=>e.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click()};
    const organ=async name=>{await wallet();await page.locator('#walletToggle').click();if(!await page.locator(`#dock [data-organ="${name}"]`).isVisible())await page.locator('#dockToggle').click();await page.locator(`#dock [data-organ="${name}"]`).click()};
    try{
      await page.goto(`${process.env.K11520_BASE_URL||'http://127.0.0.1:4182'}/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html`,{waitUntil:'domcontentloaded'});
      await wait(()=>globalThis.__K11520_SIMULATION_EXCHANGE__?.snapshot().observations.ETHUSDT);await page.locator('#intro11520').waitFor({state:'hidden'});
      stage='wallet';await wallet();const before=writes;await page.locator('#walletConnect').click();await page.locator('#executionMode').click();await wait(()=>__K11520_EXECUTION__.snapshot().status==='READY');assert.equal(writes,before,'connect and mode read only');
      assert.equal(await page.locator('#testnetUnlimited').isChecked(),true);await shot('connect-readonly');
      await page.locator('[data-deposit-preset="1000"]').click();await page.locator('#testnetApprove').click();await wait(()=>__K11520_EXECUTION__.snapshot().wallet?.allowanceUnlimited===true);
      await page.locator('#testnetDeposit').click();await wait(()=>__K11520_EXECUTION__.snapshot().wallet?.free===1000);assert.equal(await page.locator('#testnetApprove').isDisabled(),true);
      await shot('deposit-controls');await page.locator('#walletPanel').evaluate(e=>e.scrollTop=e.scrollHeight);await shot('brain-account');
      stage='order';await game();await page.locator('#cNumericInput').fill('100');await page.locator('#cNumericInput').press('Enter');await page.locator('#lotsNumericInput').fill('100');await page.locator('#lotsNumericInput').press('Enter');
await page.locator('#orderFire').click();await page.locator('#simulationTriggerPrice').fill('100.001');await page.waitForFunction(()=>document.querySelector('#simulationOrderPreview')?.textContent.includes('INDEX_DELTA_C_LOTS_V1')&&!document.querySelector('#confirmOrder').disabled,null,{timeout:120000});await page.locator('#confirm').evaluate(el=>el.scrollTop=0);await page.locator('#confirmBody').evaluate(el=>el.scrollTop=0);await shot('100c100lots-preview');await page.locator('#confirmOrder').click();await wait(()=>__K11520_EXECUTION__.snapshot().orders.some(o=>o.status==='PENDING'));
      let book=await snap(),order=book.orders.at(-1);await shot('pending');await price(100.002);await send(trigger,'observeOrder',[BigInt(order.orderId)]);await wallet();await page.locator('#walletRefresh').click();await wait(()=>__K11520_EXECUTION__.snapshot().positions.some(p=>p.status==='OPEN'));
      book=await snap();const pid=book.positions.at(-1).positionId;assert.equal(book.wallet.lockedMargin,100);await price(100.007);await page.locator('#walletRefresh').click();await wait(()=>__K11520_EXECUTION__.snapshot().wallet.unrealizedPnl>0);
      await organ('positions');await shot('position-pnl');await page.locator(`[data-sim-close="${pid}"]`).click();await wait(()=>__K11520_EXECUTION__.snapshot().positions.every(p=>p.status!=='OPEN'));assert.equal((await snap()).wallet.free,1050);
      await organ('history');await page.locator('#sheetBody summary').first().click();await shot('close-receipt');
      stage='liquidation';await price(100);await wallet();await page.locator('#walletRefresh').click();await game();await page.locator('#orderFire').click();await page.locator('#simulationTriggerPrice').fill('100');await page.locator('#confirmOrder').click();await wait(()=>__K11520_EXECUTION__.snapshot().orders.some(o=>o.status==='PENDING'));
      order=(await snap()).orders.at(-1);await send(trigger,'observeOrder',[BigInt(order.orderId)]);await price(99.98);await send(trigger,'observePosition',[BigInt((await trigger.order(order.orderId)).positionId)]);
      await wallet();await page.locator('#walletRefresh').click();await wait(()=>__K11520_EXECUTION__.snapshot().positions.some(p=>p.status==='LIQUIDATED'));book=await snap();assert.equal(book.wallet.free,950);assert.equal(book.wallet.lockedMargin,0);
      await organ('history');await page.locator('#sheetBody summary').first().click();await shot('liquidation-receipt');
      stage='withdraw';await wallet();await page.locator('#testnetAmount').fill('100');await page.locator('#testnetWithdraw').click();await wait(()=>__K11520_EXECUTION__.snapshot().wallet.free===850);await page.locator('#walletPanel').evaluate(e=>e.scrollTop=e.scrollHeight);await shot('withdraw-account');
      stage='multiplayer';active=accounts[3];await page.evaluate(a=>candidateAccountChanged(a),active);await wait(()=>__K11520_EXECUTION__.snapshot().account?.toLowerCase()===document.querySelector('#wAddr').textContent.toLowerCase()&&__K11520_EXECUTION__.snapshot().wallet?.free===0);
      assert.equal((await snap()).orders.length,0);await shot('player-c-isolated');active=accounts[player];await page.evaluate(a=>candidateAccountChanged(a),active);await wait(()=>__K11520_EXECUTION__.snapshot().wallet?.free===850);
const receiptCount=(await snap()).receipts.length;await page.reload({waitUntil:'domcontentloaded'});await wait(()=>globalThis.__K11520_EXECUTION__?.snapshot().wallet?.free===850);assert.equal((await snap()).receipts.length,receiptCount);
      await wallet();await page.locator('#walletPanel').evaluate(e=>e.scrollTop=e.scrollHeight);await shot('reload-recovered');assert.deepEqual(errors,[]);
      await fs.writeFile(`${out}/${width}x${height}-result.json`,JSON.stringify({mode:'LOCAL_ACTUAL_CANDIDATE_EVM_NOT_PUBLIC_TESTNET',functional:'PASS',visual:'REQUIRES_DIRECT_IMAGE_INSPECTION',snapshot:await snap()},null,2));
    }catch(error){await shot('FAILURE');await fs.writeFile(`${out}/${width}x${height}-FAILURE.json`,JSON.stringify({stage,snapshot:await snap(),errors,rpcFailures,toast:await page.locator('#toast').textContent(),message:String(error?.message)},null,2));console.error('LOCAL_CANDIDATE_STAGE',stage);throw error}finally{await page.close()}
  }console.log('PASS local actual candidate EVM + Chromium wallet/order/close/liquidation/withdraw/multiplayer/reload');
  }finally{await browser.close();await rpc.disconnect()}
}

// Explicit opt-in public test-assets rehearsal. The configured signer stays in
// Node; the browser receives only public account and EIP-1193 responses. This is
// an automated signing broker, not a claim that a Human clicked MetaMask.
async function publicTestnetBrowserQA(){
  const {Wallet,JsonRpcProvider,Interface,parseEther,parseUnits,keccak256}=await import('ethers');
  const manifest=JSON.parse(await fs.readFile('docs/K11520_BSC_TESTNET_DEPLOYMENT_MANIFEST.json','utf8'));
  assert.equal(manifest.status,'DEPLOYED_CONFIG_VERIFIED');assert.equal(manifest.chainId,97);
  assert.equal(manifest.publicNetwork,true);assert.equal(manifest.testOnly,true);assert.equal(manifest.verified,true);
  assert.equal(manifest.pnlModel,'INDEX_DELTA_C_LOTS_V1','public candidate QA must not target legacy percentage-PnL deployment');
  assert.equal(manifest.capabilities?.settlementCapital,'ISOLATED_V1','candidate isolated capital capability required');
  const readOnly=process.argv.includes('--read-only');
  const resumeArg=process.argv.find(x=>x.startsWith('--resume-order='));
  const resumeOrderId=resumeArg?.slice('--resume-order='.length);
  if(resumeArg)assert.match(resumeOrderId,/^[1-9][0-9]*$/,'exact existing QA order required');
  assert.ok(process.env.BSC_TESTNET_RPC_URL&&(readOnly||process.env.BSC_TESTNET_PRIVATE_KEY),'SIGNER_BLOCKED');
  // Public BSC endpoints differ in batch support; EIP-1193 forwards individual
  // requests, so keep the Node test broker's transport equivalent to a wallet.
  const provider=new JsonRpcProvider(process.env.BSC_TESTNET_RPC_URL,undefined,{batchMaxCount:1});provider.pollingInterval=1000;
  // An optional read-only event index must be on the same chain. Returned logs
  // are still verified against transaction receipts/blocks by the real adapter.
  const logProvider=process.env.BSC_TESTNET_LOG_RPC_URL?new JsonRpcProvider(process.env.BSC_TESTNET_LOG_RPC_URL,undefined,{batchMaxCount:1}):provider;
  assert.equal(BigInt(await logProvider.send('eth_chainId',[])),97n);
  const signer=readOnly?null:new Wallet(process.env.BSC_TESTNET_PRIVATE_KEY,provider),account=readOnly?manifest.admin:await signer.getAddress();
  assert.equal(BigInt(await provider.send('eth_chainId',[])),97n);
  const {TESTNET_EXECUTION_ABI,CAPITAL_EXECUTION_ABI}=await import('../runtime/real-trading-order-intent.mjs');
  const a=manifest.addresses,interfaces=Object.fromEntries(Object.entries(TESTNET_EXECUTION_ABI).map(([k,v])=>[k,new Interface([...v,...(CAPITAL_EXECUTION_ABI[k]||[])])]));
  const lower=x=>String(x).toLowerCase(),receipts=[],budget=parseEther('0.005');let reserved=0n,sending=false;
  const keys=['testToken','brainProxy','positionEngine','orderTriggerEngine','brainImplementation'];
  for(const k of keys)assert.equal(lower(keccak256(await provider.getCode(a[k]))),lower(manifest.codeHashes[k]),'deployed code identity');
  const allowed=new Map(keys.map(k=>[lower(a[k]),k]));
  const feeds=manifest.oracles.find(o=>o.axis==='KX').feeds;
  assert.equal(feeds.length,3);assert.equal(new Set(feeds.map(lower)).size,3);
  const feedCodeHashes=new Map(Object.entries(manifest.runtimeCodeHashesByAddress||{}).map(([address,hash])=>[lower(address),hash]));
  async function verifyTestFeeds(){
    assert.equal(BigInt(await provider.send('eth_chainId',[])),97n);
    for(const feed of feeds){const expected=feedCodeHashes.get(lower(feed));assert.match(expected||'',/^0x[0-9a-fA-F]{64}$/,'missing feed runtime code hash');assert.equal(lower(keccak256(await provider.getCode(feed))),lower(expected),'test feed runtime code identity')}
  }
  await verifyTestFeeds();
  const oracleInterface=new Interface(['function set(int256,uint256)']);
  const keeperInterface=new Interface(['function observeOrder(uint256) returns(bool)','function observePosition(uint256) returns(bool)']);
  const base=process.env.K11520_BASE_URL||'http://127.0.0.1:4182',root=new URL(base).origin;
  const out=readOnly?'artifacts/11520-testnet-readonly-qa':'artifacts/11520-testnet-browser-qa';await fs.mkdir(out,{recursive:true});
  const brokerFailures=[];
  const persist=()=>fs.writeFile(`${out}/transactions.json`,JSON.stringify({chainId:97,testOnly:true,signerMode:'NODE_ONLY_CONFIGURED_TESTNET_SIGNER',account,gasBudget:'0.005 tBNB',receipts},null,2));
  async function send(to,data,method){
    assert.equal(readOnly,false,'read-only QA cannot broadcast');
    assert.equal(sending,false,'single transaction at a time');sending=true;
    try{
      assert.equal(BigInt(await provider.send('eth_chainId',[])),97n);
      const price=(await provider.getFeeData()).gasPrice;assert.ok(price>0n&&price<=parseUnits('10','gwei'),'GAS_PRICE_CAP');
      const estimate=await provider.estimateGas({from:account,to,data,value:0n}),gas=estimate*12n/10n+10000n;
      assert.ok(reserved+gas*price<=budget,'TOTAL_GAS_CAP');reserved+=gas*price;
      const tx=await signer.sendTransaction({to,data,value:0n,chainId:97,gasLimit:gas,gasPrice:price});
      const item={txHash:tx.hash,contract:to,method,status:'SUBMITTED'};receipts.push(item);await persist();
      const receipt=await tx.wait(1,120000);assert.equal(receipt.status,1);const block=await provider.getBlock(receipt.blockNumber);
      Object.assign(item,{status:'CONFIRMED',block:receipt.blockNumber,timestamp:block.timestamp});await persist();return tx.hash;
    }finally{sending=false}
  }
  // Wallet-boundary failure fixtures never switch the actual RPC network and
  // are explicitly recorded separately from public chain transaction evidence.
  const walletBoundary={chain:'0x61',connected:true,rejectNext:false};
  async function broker({method,params=[]}){
    if(method==='eth_accounts'||method==='eth_requestAccounts')return walletBoundary.connected?[account]:[];
    if(method==='eth_chainId')return walletBoundary.chain;
    if(method==='wallet_switchEthereumChain'){assert.equal(params[0]?.chainId,'0x61');walletBoundary.chain='0x61';return null}
    if(method==='eth_sendTransaction'){
      assert.equal(walletBoundary.chain,'0x61','wrong wallet network cannot send');assert.equal(walletBoundary.connected,true,'disconnected wallet cannot send');
      if(walletBoundary.rejectNext){walletBoundary.rejectNext=false;throw Object.assign(new Error('USER_REJECTED'),{code:4001})}
      const tx=params[0];assert.equal(lower(tx.from),lower(account));assert.equal(BigInt(tx.chainId),97n);assert.equal(BigInt(tx.value||0),0n);
      const key=allowed.get(lower(tx.to));assert.ok(key&&interfaces[key],'unapproved destination');
      const parsed=interfaces[key].parseTransaction({data:tx.data});
      assert.ok(({testToken:['approve','faucet'],brainProxy:['depositMargin','withdrawMargin','claimSettlement'],orderTriggerEngine:['createOrder','closePosition','cancelOrder']}[key]||[]).includes(parsed.name),'unapproved method');
      if(parsed.name==='approve')assert.equal(lower(parsed.args[0]),lower(a.brainProxy));
      if(parsed.name==='depositMargin')assert.ok(parsed.args[0]>0n&&parsed.args[0]<=parseEther('1000'),'DEPOSIT_TEST_AMOUNT_CAP');
      if(parsed.name==='withdrawMargin')assert.ok(parsed.args[0]>0n&&parsed.args[0]<=parseEther('100'),'WITHDRAW_TEST_AMOUNT_CAP');
      return send(tx.to,tx.data,parsed.name);
    }
    assert.ok(['eth_getBalance','eth_call','eth_estimateGas','eth_getCode','eth_getStorageAt','eth_blockNumber','eth_getLogs','eth_getTransactionReceipt','eth_getBlockByNumber','eth_getBlockByHash'].includes(method),'read method allowlist');
    if(method==='eth_call'||method==='eth_estimateGas')assert.ok(allowed.has(lower(params[0].to)),'read destination allowlist');
    if(method==='eth_getLogs'){assert.ok(allowed.has(lower(params[0].address)),'log destination allowlist');return logProvider.send(method,params)}
    return provider.send(method,params);
  }
  const browser=await chromium.launch({headless:true});
  async function tick(price){
    assert.equal(lower(account),lower(manifest.keeper),'keeper identity');
    await verifyTestFeeds(); // Re-read all three code hashes before every keeper write batch.
    const timestamp=(await provider.getBlock('latest')).timestamp;
    for(const feed of feeds)await send(feed,oracleInterface.encodeFunctionData('set',[parseEther(String(price)),timestamp]),'TEST_ORACLE.set');
  }
  async function observe(method,id){assert.equal(lower(account),lower(manifest.keeper),'keeper identity');await send(a.orderTriggerEngine,keeperInterface.encodeFunctionData(method,[BigInt(id)]),method)}
  try{
    for(const [width,height] of [[390,844],[844,390]]){
      const resume=width===390&&resumeOrderId;
      if(!readOnly&&!resume)await tick(100000);
      Object.assign(walletBoundary,{chain:'0x38',connected:true,rejectNext:false});
      const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true});
      const errors=[];page.on('pageerror',e=>errors.push(String(e)));
      let stage='BOOT';
      try{
      await page.exposeBinding('__testnetBroker',async(source,args)=>{assert.equal(source.frame,source.page.mainFrame());assert.equal(new URL(source.frame.url()).origin,root);try{return {ok:true,value:await broker(args)}}catch(error){brokerFailures.push({method:args.method,code:String(error?.code||'UNKNOWN').replace(/[^A-Z_0-9-]/gi,'').slice(0,60),assertion:error?.code==='ERR_ASSERTION'?String(error.message).slice(0,120):null});await fs.writeFile(`${out}/broker-failures.json`,JSON.stringify(brokerFailures,null,2));return {ok:false,code:Number(error?.code)===4001?4001:-32603,reason:Number(error?.code)===4001?'USER_REJECTED':'TESTNET_BROKER_REQUEST_FAILED'}}});
      await page.addInitScript(()=>{const listeners=new Map(),emit=(name,value)=>{for(const fn of listeners.get(name)||[])fn(value)};window.__testnetWalletEvents={emit};window.ethereum={request:async args=>{const response=await window.__testnetBroker(args);if(!response.ok)throw Object.assign(new Error(response.reason),{code:response.code});if(args.method==='wallet_switchEthereumChain')emit('chainChanged','0x61');return response.value},on:(name,fn)=>{if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn)},removeListener:(name,fn)=>listeners.get(name)?.delete(fn)}});
      await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',async route=>{const prefix='https://cdn.jsdelivr.net/npm/three@0.180.0/';let body=await fs.readFile(`node_modules/three/${route.request().url().slice(prefix.length)}`,'utf8');body=body.replaceAll("from 'three'",`from '${prefix}build/three.module.js'`).replaceAll('from "three"',`from "${prefix}build/three.module.js"`);await route.fulfill({status:200,contentType:'text/javascript',body})});
      await page.goto(`${base}/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html`,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>globalThis.__K11520_EXECUTION__,null,{timeout:45000});
      if(await page.locator('#enter11520').isVisible())await page.locator('#enter11520').click({timeout:1500}).catch(()=>{});
      await page.locator('#intro11520').waitFor({state:'hidden',timeout:10000});
      const snapshot=()=>page.evaluate(()=>__K11520_EXECUTION__.snapshot());
      const shot=name=>page.screenshot({path:`${out}/${width}x${height}-${name}.png`});
      const wallet=async()=>{if(!await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();if(await page.locator('#walletPanel').evaluate(el=>el.classList.contains('collapsed')))await page.locator('#walletToggle').click()};
      const organ=async id=>{if(await page.locator('#sheet').isVisible())await page.locator('#sheetClose').click();if(!await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();if(!await page.locator(`#dock [data-organ="${id}"]`).isVisible())await page.locator('#dockToggle').click();await page.locator(`#dock [data-organ="${id}"]`).click()};
      stage='CONNECT_AND_SELECT_TESTNET';await wallet();await page.locator('#walletConnect').click();await page.locator('#executionMode').click();
      await page.waitForFunction(()=>__K11520_EXECUTION__.snapshot().status==='WRONG_CHAIN',null,{timeout:120000});
      await shot('wrong-chain');assert.equal((await snapshot()).wallet,null);
      stage='SWITCH_CHAIN_AND_RECOVER';await page.locator('#testnetSwitch').click();
      await page.waitForFunction(()=>__K11520_EXECUTION__.snapshot().status==='READY',null,{timeout:120000});
      await page.locator('#walletPanel').evaluate(el=>{el.scrollTop=0});await shot('connected');stage='FAUCET_APPROVE_DEPOSIT';
      if(readOnly){
        const recovered=await snapshot();
        for(const position of recovered.positions.filter(p=>p.status==='CLOSED'||p.status==='LIQUIDATED')){
          const settlement=recovered.receipts.find(r=>r.receiptId===`SETTLEMENT-${position.positionId}`);
          assert.ok(settlement,'historical position requires its actual settlement receipt');
          assert.equal(position.liquidationPrice,settlement.liquidationPrice,'historical liquidation boundary comes from its receipt');
        }
        await page.locator('#walletPanel').evaluate(el=>{el.scrollTop=el.scrollHeight});await shot('wallet-details');
        await page.locator('#walletPanel').evaluate(el=>{el.scrollTop=0});await page.locator('#walletToggle').click();
        await organ('positions');await shot('historical-positions');await organ('history');await shot('recovered-receipts');
        await fs.writeFile(`${out}/${width}x${height}-result.json`,JSON.stringify({status:'READY',writes:receipts.length,historicalBoundary:'ACTUAL_SETTLEMENT_RECEIPT',snapshot:recovered},null,2));await page.close();continue
      }
      assert.equal((await snapshot()).pnlModel,'INDEX_DELTA_C_LOTS_V1');assert.ok((await snapshot()).capital);
      if(!resume){
      // The faucet is one-shot per address. Reuse the100 test tokens returned
      // by the first orientation's withdrawal instead of asking twice for1000.
      if((await snapshot()).wallet.testTokenBalance<100){await page.locator('#testnetFaucet').click();await page.waitForFunction(()=>__K11520_EXECUTION__.snapshot().wallet?.testTokenBalance>=100,null,{timeout:120000})}
      await page.locator('#testnetAmount').fill('100');
      if(BigInt((await snapshot()).wallet.allowanceWei)<parseEther('100')){
        await page.locator('#testnetApprove').click();
        await page.waitForFunction(()=>BigInt(__K11520_EXECUTION__.snapshot().wallet.allowanceWei)>=100n*10n**18n,null,{timeout:120000});
      }
      if(width===390){
        const beforeRejection=receipts.length,principalBeforeRejection=(await snapshot()).wallet.principal;
        walletBoundary.rejectNext=true;await page.locator('#testnetDeposit').click();
        await page.waitForFunction(()=>__K11520_EXECUTION__.snapshot().transaction?.status==='USER_REJECTED',null,{timeout:120000});
        assert.equal(receipts.length,beforeRejection,'wallet rejection must not send any transaction');assert.equal((await snapshot()).wallet.principal,principalBeforeRejection,'wallet rejection must not debit principal');await shot('user-rejected');
      }
      const principalBeforeDeposit=(await snapshot()).wallet.principal;
      await page.locator('#testnetDeposit').click();
      await page.waitForFunction(()=>__K11520_EXECUTION__.snapshot().transaction?.method==='depositMargin'&&__K11520_EXECUTION__.snapshot().transaction?.status==='RECEIPT_CONFIRMED',null,{timeout:120000});
      assert.equal((await snapshot()).wallet.principal,principalBeforeDeposit+100);
      await page.locator('#walletPanel').evaluate(el=>{el.scrollTop=0});await shot('wallet-metrics');
      await page.locator('#walletPanel').evaluate(el=>{el.scrollTop=el.scrollHeight});await shot('deposit');
      }
      await page.locator('#walletPanel').evaluate(el=>{el.scrollTop=0});await page.locator('#walletToggle').click();await page.locator('#k11520UtilityMaster').click();
      for(let i=0;i<3&&(await page.evaluate(()=>__K11520_TRADE_AXIS_API__.current()))!=='KX';i++){await page.locator('#joy').tap();await page.waitForTimeout(200)}
      await page.locator('#cNumericInput').fill('100');await page.locator('#cNumericInput').press('Enter');await page.locator('#lotsNumericInput').fill('100');await page.locator('#lotsNumericInput').press('Enter');
      stage='CREATE_ORDER';const before=new Set((await snapshot()).orders.map(o=>o.orderId));
      const accountBeforeOrder=(await snapshot()).wallet,capitalBeforeOrder=(await snapshot()).capital;
      let order;
      if(resume){
        order=(await snapshot()).orders.find(o=>o.orderId===resumeOrderId);
        assert.ok(order,'resume order must belong to the connected account');
        assert.equal(order.status,'PENDING');assert.equal(order.market,'BTCUSDT');
        assert.equal(order.c,100);assert.equal(order.lots,100);assert.equal(order.triggerPrice,100000.001);
        assert.equal((await snapshot()).observations.BTCUSDT.price,100000.002,'resume preserves already confirmed crossing observation');
        await organ('orders');await shot('pending-resumed');
      }else{
      await page.locator('#orderFire').click();await page.locator('#simulationTriggerPrice').fill('100000.001');await page.waitForFunction(()=>document.querySelector('#simulationOrderPreview')?.textContent.includes('INDEX_DELTA_C_LOTS_V1')&&!document.querySelector('#confirmOrder').disabled,null,{timeout:120000});await page.locator('#confirm').evaluate(e=>e.scrollTop=0);await page.locator('#confirmBody').evaluate(e=>e.scrollTop=0);await shot('preview');await page.locator('#confirmOrder').click();
      await page.waitForFunction(n=>__K11520_EXECUTION__.snapshot().orders.length>n,before.size,{timeout:120000});
      order=(await snapshot()).orders.find(o=>!before.has(o.orderId));assert.equal(order.status,'PENDING');await shot('pending');
      }
      stage='KEEPER_FILL';if(!resume)await tick(100000.002);await observe('observeOrder',order.orderId);
      await page.waitForFunction(id=>__K11520_EXECUTION__.snapshot().orders.find(o=>o.orderId===id)?.status==='FILLED',order.orderId,{timeout:120000});
      let position=(await snapshot()).positions.find(p=>p.orderId===order.orderId);assert.equal(position.status,'OPEN');
      assert.equal(position.c,100);assert.equal(position.lots,100);assert.equal(position.margin,100);
      assert.equal((await snapshot()).wallet.lockedMargin,accountBeforeOrder.lockedMargin+100);
      assert.ok((await snapshot()).capital.reservedSettlementLiability>capitalBeforeOrder.reservedSettlementLiability,'real funded risk reservation');
      await organ('positions');await shot('filled');
      stage=width===390?'NORMAL_CLOSE':'LIQUIDATION';if(width===390){
        await tick(100000.007);await page.waitForFunction(id=>Math.abs((__K11520_EXECUTION__.snapshot().positions.find(p=>p.positionId===id)?.unrealizedPnl??0)-50)<1e-6,position.positionId,{timeout:120000});await shot('positive-pnl');
        await page.locator(`[data-sim-close="${position.positionId}"]`).click();await page.waitForFunction(id=>__K11520_EXECUTION__.snapshot().positions.find(p=>p.positionId===id)?.status==='CLOSED',position.positionId,{timeout:120000});assert.equal((await snapshot()).wallet.principal,accountBeforeOrder.principal+50);
      }else {await tick(99999.98);await observe('observePosition',position.positionId);await page.waitForFunction(id=>__K11520_EXECUTION__.snapshot().positions.find(p=>p.positionId===id)?.status==='LIQUIDATED',position.positionId,{timeout:120000});position=(await snapshot()).positions.find(p=>p.positionId===position.positionId);assert.equal(position.margin,0);assert.equal((await snapshot()).wallet.principal,accountBeforeOrder.principal-100);assert.ok((await snapshot()).wallet.free>0)}
      assert.equal((await snapshot()).wallet.lockedMargin,accountBeforeOrder.lockedMargin);assert.equal((await snapshot()).capital.reservedSettlementLiability,capitalBeforeOrder.reservedSettlementLiability);
      const settled=(await snapshot()).positions.find(p=>p.positionId===position.positionId);assert.ok(Math.abs(settled.rawPnl-(width===390?50:-220))<1e-6,'candidate raw PnL is delta index times100C times100lots');
      const settlement=(await snapshot()).receipts.find(r=>r.receiptId===`SETTLEMENT-${position.positionId}`);assert.ok(settlement);assert.equal(settlement.marginAfter,0);assert.equal(settlement.executionMode,'BSC_TESTNET');
      await shot(width===390?'closed':'liquidated');await organ('history');await shot('receipts');
      stage='WITHDRAW_AVAILABLE';if(await page.locator('#sheet').isVisible())await page.locator('#sheetClose').click();await wallet();await page.locator('#testnetAmount').fill('100');const beforeWithdraw=(await snapshot()).wallet;
      await page.locator('#testnetWithdraw').click();await page.waitForFunction(()=>__K11520_EXECUTION__.snapshot().transaction?.method==='withdrawMargin'&&__K11520_EXECUTION__.snapshot().transaction?.status==='RECEIPT_CONFIRMED',null,{timeout:120000});assert.equal((await snapshot()).wallet.principal,beforeWithdraw.principal-100);assert.equal((await snapshot()).wallet.testTokenBalance,beforeWithdraw.testTokenBalance+100);await shot('withdraw');
      stage='DISCONNECT_RELOAD';const recoveredIds=(await snapshot()).receipts.map(r=>r.receiptId);
      const recoveredAccount=(await snapshot()).wallet;
      walletBoundary.connected=false;await page.evaluate(()=>__testnetWalletEvents.emit('disconnect',{code:4900}));
      await page.waitForFunction(()=>__K11520_EXECUTION__.snapshot().wallet===null);
      await shot('disconnected');walletBoundary.connected=true;await page.reload({waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>globalThis.__K11520_EXECUTION__?.snapshot().status==='READY',null,{timeout:120000});
      for(const id of recoveredIds)assert.ok((await snapshot()).receipts.some(r=>r.receiptId===id),'reload receipt recovery');
      assert.equal((await snapshot()).wallet.principal,recoveredAccount.principal);assert.equal((await snapshot()).wallet.lockedMargin,recoveredAccount.lockedMargin);assert.equal((await snapshot()).wallet.claimable,recoveredAccount.claimable);
      await wallet();await shot('reload');assert.deepEqual(errors,[]);
      await fs.writeFile(`${out}/${width}x${height}-result.json`,JSON.stringify({functional:'PASS',visual:'REQUIRES_DIRECT_IMAGE_INSPECTION',chainId:97,broker:'NODE_ONLY_CONFIGURED_SIGNER_NOT_HUMAN_METAMASK',walletBoundaryFixtures:[...(!resume&&width===390?['USER_REJECTED_NO_BROADCAST']:[]),'WRONG_CHAIN_NO_BROADCAST','EXPLICIT_CHAIN_SWITCH','DISCONNECT_CLEARS_STATE','PAGE_RELOAD_RECOVERY'],oracleCodeIdentity:'THREE_FEED_RUNTIME_HASHES_RECHECKED_BEFORE_EACH_WRITE_BATCH',snapshot:await snapshot()},null,2));
      }catch(error){
        // Explicitly select public product fields; never serialize a provider,
        // signer, RPC URL, raw error object or the Node environment.
        const diagnostic=await page.evaluate(()=>({snapshot:globalThis.__K11520_EXECUTION__?.snapshot()??null,walletMessage:document.querySelector('#walletMsg')?.textContent,chain:document.querySelector('#wChain')?.textContent,mode:document.querySelector('#testnetGate')?.textContent,switchDisabled:document.querySelector('#testnetSwitch')?.disabled,connectDisabled:document.querySelector('#walletConnect')?.disabled})).catch(()=>({snapshot:null}));
        const safeText=value=>String(value).replace(/https?:\/\/\S+/g,'[URL REDACTED]').replace(/0x[0-9a-fA-F]{64}/g,'[HASH REDACTED]').slice(0,1000);
        await page.screenshot({path:`${out}/${width}x${height}-FAILURE.png`}).catch(()=>{});
        await fs.writeFile(`${out}/${width}x${height}-FAILURE.json`,JSON.stringify({stage,code:/^[A-Z_0-9]+$/.test(String(error?.code||''))?error.code:'QA_FAILURE',message:safeText(error?.message||error?.name),pageErrors:errors.map(safeText),...diagnostic},null,2));
        console.error('TESTNET_BROWSER_STAGE_FAILED',stage,diagnostic.snapshot?.status||'NO_RUNTIME');throw error;
      }
      await page.close();
    }
    console.log(readOnly?'PASS: PUBLIC BSC97 read-only network recovery, zero broadcasts; inspect screenshots separately':'PASS: PUBLIC BSC97 browser approval/deposit/order/fill/close/liquidation/reload; inspect screenshots separately');
  }finally{await browser.close();if(logProvider!==provider)logProvider.destroy();provider.destroy();await persist()}
}
