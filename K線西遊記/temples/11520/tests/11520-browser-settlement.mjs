import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

if(process.argv.includes('--m1-read-only')){
  await m1ReadOnlyBrowserQA();process.exit(0);
}

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
    page.setDefaultTimeout(20000);
    const errors=[];page.on('pageerror',e=>{errors.push(String(e));console.error('PAGE_ERROR',String(e))});
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
    let quoteStale=false,tradeSequence=0;
    await page.route('https://data-api.binance.vision/**',route=>{
      const u=new URL(route.request().url()),prices={BTCUSDT:100000,ETHUSDT:eth,BNBUSDT:600};
      const payload=u.pathname.endsWith('/aggTrades')?[{p:String(prices[u.searchParams.get('symbol')]),T:Date.now()-(quoteStale?60000:0),a:++tradeSequence}]:Object.entries(prices).map(([symbol,price])=>({symbol,price:String(price)}));
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
    });
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
    // Character readiness is independent of the MINIMAL telemetry visibility.
    await page.locator('#charState').filter({hasText:/READY|FALLBACK/}).waitFor({state:'attached',timeout:45000});
    await page.locator('#cNumericInput').fill('1');await page.locator('#cNumericInput').press('Enter');
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
    assert.equal((await snap()).positions.length,0,'address B must not see A positions');
    await page.evaluate(()=>{__walletFixture.account='0x1111111111111111111111111111111111111111';__walletFixture.emit('accountsChanged',[__walletFixture.account])});
    await page.waitForFunction(()=>__K11520_SIMULATION_EXCHANGE__.snapshot().positions.length===1);
    assert.equal((await snap()).positions[0].positionId,openId,'address A restores its own position');
    await page.evaluate(()=>{__walletFixture.chain='0x38';__walletFixture.emit('chainChanged','0x38')});
    await page.waitForFunction(()=>document.querySelector('#wKgen').textContent==='12345');
    quoteStale=true;eth=3920;await page.waitForTimeout(6000);
    assert.equal((await snap()).positions[0].status,'OPEN','stale liquidation must not mutate position');
    assert.match(await page.locator('#feed').innerText(),/MARKET DATA STALE/);await shot('stale-position-preserved');
    quoteStale=false;
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
    assert.equal((await snap()).receipts.length,0,'disconnect switches to guest, not A receipts');
    await page.locator('#sheetClose').click();
    if(!await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
    await page.locator('#walletToggle').click();await page.locator('#walletConnect').click();
    await page.waitForFunction(()=>__K11520_SIMULATION_EXCHANGE__.snapshot().receipts.length===4);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>globalThis.__K11520_SIMULATION_EXCHANGE__?.snapshot().receipts.length===4,null,{timeout:15000});
    assert.equal((await snap()).positions[1].status,'CLOSED','reload recovers exact account ledger');
    await shot('reload-recovery');
    await page.locator('#charState').filter({hasText:/READY|FALLBACK/}).waitFor({state:'attached',timeout:45000});
    await page.locator('#cNumericInput').fill('5');await page.locator('#cNumericInput').press('Enter');
    await page.locator('#orderFire').click();
    await page.waitForFunction(()=>document.querySelector('#simulationOrderPreview')?.textContent.includes('V1_HIGH_SPEED_PRODUCTION_LOCKED'));
    assert.equal(await page.locator('#confirmOrder').isDisabled(),true);await shot('high-c-locked');
    await page.locator('#cancelOrder').click();
    await page.locator('#cNumericInput').fill('0');await page.locator('#cNumericInput').press('Enter');
    if(!await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
    await page.locator('#gameModeToggle').click();await page.locator('#journeyReplay').click();
    assert.equal(await page.evaluate(()=>__K11520_JOURNEY__.snapshot().stage),'MOVE');
    await shot('journey-story');await page.locator('#journeyContinue').click();
    const joy=await page.locator('#joy').boundingBox(),jx=joy.x+joy.width/2,jy=joy.y+joy.height/2;
    const knobBefore=await page.locator('#knob').boundingBox();
    await page.mouse.move(jx,jy);await page.mouse.down();await page.mouse.move(jx,jy-40,{steps:5});
    const knobMoved=await page.locator('#knob').boundingBox();assert.ok(knobMoved.y<knobBefore.y,'joystick thumb follows finger');
    try{await page.waitForFunction(()=>globalThis.__K11520_KSPACE_COMBAT__?.distance<2,null,{timeout:15000})}finally{await page.mouse.up()}
    await shot('journey-approach');
    const tutorialLayout=await page.locator('#k11520MonsterGuide').evaluate(el=>{const r=el.getBoundingClientRect(),overlaps=['.minimapWrap','#cControl','#lotsControl','#yControl','#joy','#attack','#orderFire'].filter(s=>{const q=document.querySelector(s)?.getBoundingClientRect();return q&&r.left<q.right&&r.right>q.left&&r.top<q.bottom&&r.bottom>q.top});return {inViewport:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,overlaps}});
    assert.equal(tutorialLayout.inViewport,true);assert.deepEqual(tutorialLayout.overlaps,[],'tutorial must not cover map or controls');
    assert.equal(await page.evaluate(()=>__K11520_JOURNEY__.snapshot().stage),'HIT');
    assert.equal(await page.evaluate(()=>__K11520_BGM__.playing),true,'real joystick gesture unlocks the original BGM');
    const journeyAttackTrace=[];
    for(let i=0;i<30&&await page.evaluate(()=>__K11520_PRODUCT__.snapshot().loot===0);i++){
      const target=await page.evaluate(()=>__K11520_KSPACE_COMBAT__);
      // A roaming target may leave slash range after the initial approach.
      // Pursue with the physical joystick; retain the 30-strike limit, actual
      // attack radius/damage, exact loot count and settlement assertions.
      if(target.distance>1.2){
        const d=Math.hypot(target.relative.x,target.relative.z)||1;
        await page.mouse.move(jx,jy);await page.mouse.down();await page.mouse.move(jx+target.relative.x/d*35,jy-target.relative.z/d*35,{steps:4});
        try{await page.waitForFunction(()=>__K11520_KSPACE_COMBAT__.distance<.8,null,{timeout:5000})}finally{await page.mouse.up()}
      }
      await page.locator('#attack').click();await page.waitForTimeout(400);
      journeyAttackTrace.push(await page.evaluate(()=>{const s=__K11520_KSPACE_COMBAT__;return {distance:s.distance,hp:s.target.hp,result:s.lastResult}}));
    }
    await fs.writeFile(`${out}/${width}x${height}-journey-attacks.json`,JSON.stringify(journeyAttackTrace,null,2));
    assert.equal(await page.evaluate(()=>__K11520_PRODUCT__.snapshot().loot),1);
    assert.equal(await page.evaluate(()=>__K11520_PRODUCT__.snapshot().kaios),5);
    await shot('journey-loot');
    assert.equal(await page.evaluate(()=>__K11520_JOURNEY__.snapshot().stage),'PHASE');
    await page.locator('#cNumericInput').fill('.001');await page.locator('#cNumericInput').press('Enter');
    await page.locator('#joy').tap();
    await page.locator('#cNumericInput').fill('-.001');await page.locator('#cNumericInput').press('Enter');
    await page.waitForFunction(()=>__K11520_JOURNEY__.snapshot().stage==='PREVIEW');await shot('journey-sixphase');
    const ordersBefore=(await snap()).orders.length;await page.locator('#orderFire').click();await shot('journey-preview');
    assert.equal(await page.evaluate(()=>__K11520_JOURNEY__.snapshot().complete),true);
    await page.locator('#cancelOrder').click();assert.equal((await snap()).orders.length,ordersBefore,'tutorial must never submit an order');
    await organ('records');await shot('local-product-metrics');await page.locator('#sheetClose').click();
    await page.locator('#backpackButton').click();assert.match(await page.locator('#backpackStats').innerText(),/取經碎片 1/);await shot('journey-backpack');await page.locator('#backpackButton').click();
    assert.equal(await page.evaluate(()=>__walletFixture.calls.some(m=>!/^(eth_requestAccounts|eth_accounts|eth_chainId|eth_getBalance|eth_call)$/.test(m))),false);
    if(await page.locator('#sheet').isVisible())await page.locator('#sheetClose').click();
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
    await send(position,'configureTradingCapability',[market,[parseEther('1'),(await provider.getBlock('latest')).timestamp+86400,3600,3600,parseEther('1'),'0x'+'11'.repeat(32)]]); // local mock evidence only
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
  fixtureManifest.readOnlyCandidates={wallet1c:{...fixtureManifest,cMin:0.001,cMax:1,viewCapability:'READ_ONLY_M1'}};
  const price=async(value)=>{const block=await rpc.request({method:'eth_getBlockByNumber',params:['latest',false]});for(const f of feeds[1])await send(f,'set',[parseEther(String(value)),Number(BigInt(block.timestamp))])};
  const out='artifacts/11520-candidate-wallet-qa';await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch({headless:true});let active=accounts[1],connected=false,writes=0;
  try{for(const [width,height,player] of [[390,844,1],[844,390,2]]){
    active=accounts[player];connected=false;await price(100);
    const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true}),errors=[],consoleErrors=[],requestFailures=[];
    const safeText=value=>String(value).replace(/https?:\/\/[^\s"']+/g,url=>{try{return new URL(url).origin}catch{return '[URL]'}});
    page.on('pageerror',e=>errors.push(safeText(e.stack||e)));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(safeText(m.text()))});page.on('requestfailed',r=>requestFailures.push({url:safeText(r.url()),error:safeText(r.failure()?.errorText||'REQUEST_FAILED')}));let stage='boot';const rpcFailures=[];
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
    await page.route('https://data-api.binance.vision/**',r=>{
      const url=new URL(r.request().url()),prices={BTCUSDT:100000,ETHUSDT:4000,BNBUSDT:600};
      const payload=url.pathname.endsWith('/aggTrades')
        ? [{p:String(prices[url.searchParams.get('symbol')]),T:Date.now(),a:Date.now()}]
        : Object.entries(prices).map(([symbol,price])=>({symbol,price:String(price)}));
      return r.fulfill({contentType:'application/json',body:JSON.stringify(payload)});
    });
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
      if((await snap()).exitOnly){
        stage='legacy-exit-only-fixture';
        // Local fixture setup establishes existing principal/position; the UI
        // may only close/withdraw it, never approve/deposit/create new risk.
        await send(token.connect(signers[player]),'approve',[proxy.target,parseEther('1000')]);
        await send(brain.connect(signers[player]),'depositMargin',[parseEther('1000')]);
        const oid=await trigger.nextOrderId();await send(trigger.connect(signers[player]),'createOrder',[1,parseEther('1'),2,parseEther('100')]);await send(trigger,'observeOrder',[oid]);
        const pid=(await trigger.order(oid)).positionId;await page.locator('#walletRefresh').click();await wait(()=>__K11520_EXECUTION__.snapshot().wallet?.lockedMargin===2);
        assert.equal(await page.locator('#testnetApprove').isDisabled(),true);assert.equal(await page.locator('#testnetDeposit').isDisabled(),true);await shot('legacy-exit-only');
        await game();await page.locator('#cNumericInput').fill('1');await page.locator('#cNumericInput').press('Enter');await page.locator('#orderFire').click();
        await page.waitForFunction(()=>document.querySelector('#simulationOrderPreview')?.textContent.includes('LEGACY_EXIT_ONLY_NO_NEW_RISK'));assert.equal(await page.locator('#confirmOrder').isDisabled(),true);await page.locator('#cancelOrder').click();
        await price(100.5);await organ('positions');await page.locator(`[data-sim-close="${pid}"]`).click();await wait(()=>__K11520_EXECUTION__.snapshot().positions.every(p=>p.status!=='OPEN'));
        assert.equal((await snap()).wallet.free,1001);await shot('legacy-close-preserved');
        await wallet();await page.locator('#testnetAmount').fill('100');await page.locator('#testnetWithdraw').click();await wait(()=>__K11520_EXECUTION__.snapshot().wallet?.free===901);await shot('legacy-withdraw-preserved');
        const beforeViewWrites=writes,legacyPreference=await page.evaluate(()=>sessionStorage.getItem('k11520.execution-mode'));
        await page.locator('#walletM1ReadOnly').click();await wait(()=>__K11520_EXECUTION__.snapshot().readOnly&&__K11520_EXECUTION__.snapshot().wallet?.testTokenBalance===9100);
        assert.equal(await page.locator('#testnetFinancialControls').isVisible(),false);await shot('m1-readonly');
        active=accounts[3];await page.evaluate(a=>candidateAccountChanged(a),active);await wait(()=>__K11520_EXECUTION__.snapshot().account?.toLowerCase()===document.querySelector('#wAddr').textContent.toLowerCase()&&__K11520_EXECUTION__.snapshot().wallet?.testTokenBalance===10000);assert.equal((await snap()).historyStatus,'NOT_REQUESTED');await shot('m1-other-wallet');
        active=accounts[player];await page.evaluate(a=>candidateAccountChanged(a),active);await wait(()=>__K11520_EXECUTION__.snapshot().wallet?.testTokenBalance===9100);
        await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>globalThis.__K11520_EXECUTION__,null,{timeout:45000});await wait(()=>__K11520_EXECUTION__.snapshot().readOnly&&__K11520_EXECUTION__.snapshot().wallet?.testTokenBalance===9100);await page.locator('#intro11520').waitFor({state:'hidden'});await wallet();await shot('m1-reload');
        assert.equal(writes,beforeViewWrites,'M1 never broadcasts');assert.equal(await page.evaluate(()=>sessionStorage.getItem('k11520.execution-mode')),legacyPreference);
        await page.locator('#walletM1ReadOnly').click();await wait(()=>__K11520_EXECUTION__.snapshot().exitOnly&&__K11520_EXECUTION__.snapshot().wallet?.free===901);await shot('legacy-return');assert.deepEqual(errors,[]);
        await fs.writeFile(`${out}/${width}x${height}-result.json`,JSON.stringify({mode:'LOCAL_ACTUAL_EVM_M1_READ_ONLY_WITH_LEGACY_EXITS',functional:'PASS',visual:'REQUIRES_DIRECT_IMAGE_INSPECTION',m1Writes:0,legacyClose:'PASS',legacyWithdraw:'PASS',newRisk:'BLOCKED',snapshot:await snap()},null,2));
        continue;
      }
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
    }catch(error){await shot('FAILURE').catch(()=>{});const snapshot=await snap().catch(()=>null),toast=await page.locator('#toast').textContent().catch(()=>null);await fs.writeFile(`${out}/${width}x${height}-FAILURE.json`,JSON.stringify({stage,snapshot,errors,rpcFailures,consoleErrors,requestFailures,toast,message:safeText(error?.message),stack:safeText(error?.stack||error)},null,2));console.error('LOCAL_CANDIDATE_STAGE',stage);throw error}finally{await page.close()}
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


// Bind actual browser response bytes, including each real query/cache variant,
// to the deployment checkout. This never replaces a public application response.
// Diagnostics only: no raw RPC parameters, response bodies or extra requests.
function createM1RpcDiagnostics({limit=32,now=()=>Date.now()}={}){
  const cap=Math.min(32,Math.max(1,Number.isSafeInteger(limit)?limit:32)),recent=[],failures=[];
  let sequence=0,failureCount=0,droppedFailures=0,lastStarted=null,lastCompleted=null;
  const read=(value,key)=>{try{return value?.[key]}catch{return undefined}};
  const code=value=>typeof value==='number'&&Number.isSafeInteger(value)?value:['UNKNOWN_ERROR','SERVER_ERROR','TIMEOUT','NETWORK_ERROR','BAD_DATA','CALL_EXCEPTION','INVALID_ARGUMENT','UNSUPPORTED_OPERATION','ACTION_REJECTED'].includes(value)?value:null;
  const errorFields=error=>{
    const rpc=read(error,'error'),message=[read(error,'shortMessage'),read(error,'message'),read(rpc,'message')].filter(x=>typeof x==='string').map(x=>x.slice(0,1024)).join(' ');
    const category=/rate.?limit|too many requests|429|limit exceeded/i.test(message)?'RATE_LIMIT':/timeout|timed out|ETIMEDOUT/i.test(message)?'TIMEOUT':/decode|invalid json|bad data/i.test(message)?'DATA_SHAPE':/network|socket|connection|ECONN|fetch failed/i.test(message)?'TRANSPORT':'UNCLASSIFIED';
    const name=read(error,'name');
    return {errorClass:['Error','TypeError','TimeoutError','AssertionError','RangeError','SyntaxError'].includes(name)?name:'OTHER',code:code(read(error,'code')),rpcCode:code(read(rpc,'code')),category};
  };
  const run=async(meta,request,{existingLogFallback=false}={})=>{
    const started=Object.freeze({sequence:++sequence,method:meta.method,phase:meta.phase,stage:meta.stage,contract:meta.contract||null,
      selector:/^0x[0-9a-fA-F]{8}$/.test(meta.selector||'')?meta.selector:null,startedAt:now()});lastStarted=started;
    const finish=outcome=>{lastCompleted=Object.freeze({...started,elapsedMs:Math.max(0,now()-started.startedAt),...outcome});recent.push(lastCompleted);if(recent.length>cap)recent.shift()};
    try{
      const result=await request();const kind=result===null?'null':Array.isArray(result)?'array':typeof result;
      const length=typeof result==='string'||Array.isArray(result)?read(result,'length'):null;
      finish({ok:true,responseKind:kind,responseLength:Number.isSafeInteger(length)?length:null});return result;
    }catch(error){
      finish({ok:false,...errorFields(error),existingLogFallback});
      failureCount++;failures.push(lastCompleted);if(failures.length>cap){failures.shift();droppedFailures++}
      throw error; // Preserve original rejection; the caller owns log fallback.
    }
  };
  return Object.freeze({run,snapshot:()=>({failureCount,droppedFailures,lastStarted,lastCompleted,recent:[...recent],failures:[...failures]})});
}

async function bootM1ReadOnlyPage(page,url){
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>globalThis.__K11520_EXECUTION__,null,{timeout:45000});
  if(await page.locator('#enter11520').isVisible()){
    try{await page.locator('#enter11520').click({timeout:1500})}
    catch(error){if(await page.locator('#intro11520').isVisible())throw error}
  }
  await page.locator('#intro11520').waitFor({state:'hidden',timeout:5000});
  await page.waitForFunction(()=>/READY|FALLBACK/.test(document.querySelector('#charState')?.textContent||''),null,{timeout:45000});
}

function attachM1PageSourceProof(page,{base,sourceSha,assets,createHash}){
  const prefix=new URL(base).pathname.replace(/\/$/,'')+'/',origin=new URL(base).origin;
  const expected=new Map(assets.map(x=>[x.path,x.sha256])),seen=new Map(),pending=new Set(),errors=[];
  page.on('response',response=>{
    const url=new URL(response.url()),path=decodeURIComponent(url.pathname).slice(prefix.length);
    if(url.origin!==origin||!decodeURIComponent(url.pathname).startsWith(prefix)||!expected.has(path))return;
    const job=(async()=>{try{
      assert.equal(response.status(),200,'PUBLIC_BROWSER_ASSET_HTTP_ERROR '+path);
      const sha256=createHash('sha256').update(await response.body()).digest('hex');
      assert.equal(sha256,expected.get(path),'PUBLIC_BROWSER_ASSET_SOURCE_MISMATCH '+path);
      seen.set(path,{path,sha256,query:url.search,fromServiceWorker:response.fromServiceWorker()});
    }catch(error){errors.push(String(error.message))}})();
    pending.add(job);void job.finally(()=>pending.delete(job));
  });
  return async()=>{
    while(pending.size)await Promise.all([...pending]);assert.deepEqual(errors,[],'actual public browser assets must match checkout');
    for(const path of expected.keys())assert.ok(seen.has(path),'PUBLIC_BROWSER_ASSET_NOT_OBSERVED '+path);
    return {sourceSha,status:'PASS',actualBrowserResponses:[...seen.values()]};
  };
}

// M1 uses real public chain97 reads through a synthetic injected EIP-1193
// transport. No Wallet/signer is constructed; this is not Human MetaMask QA.
async function m1ReadOnlyBrowserQA(){
  const {JsonRpcProvider,Interface,formatUnits}=await import('ethers');
  const manifest=JSON.parse(await fs.readFile('docs/K11520_BSC_TESTNET_DEPLOYMENT_MANIFEST.json','utf8'));
  const candidate=manifest.readOnlyCandidates?.wallet1c;
  assert.equal(candidate?.viewCapability,'READ_ONLY_M1');assert.equal(candidate.chainId,97);assert.equal(candidate.cMax,1);
  const raw=process.argv.find(v=>v.startsWith('--read-only-accounts='))?.slice('--read-only-accounts='.length);
  const accounts=raw?.split(',')||[];assert.equal(new Set(accounts.map(a=>a.toLowerCase())).size,2);assert.ok(accounts.every(a=>/^0x[0-9a-fA-F]{40}$/.test(a)));
  const provider=new JsonRpcProvider(process.env.BSC_TESTNET_RPC_URL||'https://bsc-testnet-dataseed.bnbchain.org',undefined,{batchMaxCount:1});
  assert.equal(BigInt(await provider.send('eth_chainId',[])),97n);
  const base=process.env.K11520_BASE_URL||'http://127.0.0.1:4173',origin=new URL(base).origin,out='artifacts/11520-m1-readonly-qa';await fs.mkdir(out,{recursive:true});
  const publicSource=new URL(base).hostname==='klineodyssey.github.io'?JSON.parse(await fs.readFile(out+'/public-source-before.json','utf8')):null;
  if(publicSource){assert.equal(publicSource.status,'PASS');assert.equal(publicSource.sourceSha,process.env.K11520_SOURCE_SHA)}
  const {createHash}=await import('node:crypto');
  const {TESTNET_EXECUTION_ABI}=await import('../runtime/real-trading-order-intent.mjs'),tokenAbi=new Interface(TESTNET_EXECUTION_ABI.testToken),orderAbi=new Interface(TESTNET_EXECUTION_ABI.orderTriggerEngine);
  const allowedAddresses=new Set([...Object.values(manifest.addresses),...Object.values(candidate.addresses)].map(a=>a.toLowerCase()));
  const browser=await chromium.launch({headless:true});const results=[];
  const routeThree=page=>page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',async route=>{const prefix='https://cdn.jsdelivr.net/npm/three@0.180.0/';let body=await fs.readFile(`node_modules/three/${route.request().url().slice(prefix.length)}`,'utf8');body=body.replaceAll("from 'three'",`from '${prefix}build/three.module.js'`).replaceAll('from "three"',`from "${prefix}build/three.module.js"`);await route.fulfill({contentType:'text/javascript',body})});
  const url=`${base}/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html`;
  const boot=page=>bootM1ReadOnlyPage(page,url);
  try{
    const absent=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    // The no-provider screen never requests the lazily loaded wallet codec.
    const finishAbsentPublicSource=publicSource?attachM1PageSourceProof(absent,{base,...publicSource,assets:publicSource.assets.filter(x=>x.path!=='K線西遊記/assets/ethers-5.7.2.umd.min.js'),createHash}):null;
    try{
      await routeThree(absent);await boot(absent);
      await absent.waitForFunction(()=>document.querySelector('#walletProviderHelp')?.hidden===false);
      if(!await absent.locator('html').evaluate(e=>e.classList.contains('k11520UtilitiesOpen')))await absent.locator('#k11520UtilityMaster').click();
      if(await absent.locator('#walletPanel').evaluate(e=>e.classList.contains('collapsed')))await absent.locator('#walletToggle').click();
      assert.equal(await absent.locator('#walletProviderHelp').isVisible(),true);
      assert.equal(await absent.locator('#wAddr').textContent(),'DISCONNECTED');
      await absent.waitForFunction(()=>document.querySelector('#walletM1ReadOnly')?.disabled===false&&document.querySelector('#k11520RealTradePreflight'));
      // Settings is a late bootstrap import and owns wallet visibility. Wait
      // for that real owner before capturing its source-bound public state.
      if(publicSource)await absent.waitForFunction(()=>globalThis.__K11520_UI_SETTINGS__,null,{timeout:15000});
      await absent.screenshot({path:`${out}/390x844-no-injected-wallet.png`});
      if(finishAbsentPublicSource)await fs.writeFile(out+'/no-provider-source.json',JSON.stringify(await finishAbsentPublicSource(),null,2));
    }catch(error){await absent.screenshot({path:`${out}/390x844-no-provider-FAILURE.png`});await fs.writeFile(`${out}/no-provider-FAILURE.json`,JSON.stringify({message:String(error.message)},null,2));throw error}finally{await absent.close()}
    for(const [width,height]of[[360,740],[390,844],[412,772],[432,856],[480,900],[844,390]]){
      const state={account:accounts[width===390?0:1],chain:'0x1',connected:true},methods=[],forbidden=[],errors=[],phaseCounts={M1:{},LEGACY:{},INITIAL:{}};let logFallbacks=0,phase='INITIAL';
      const consoleErrors=[],requestFailures=[],evidence=[],rpcDiagnostics=createM1RpcDiagnostics();let stage='BOOT';
      const safeText=value=>String(value).replace(/https?:\/\/[^\s"']+/g,url=>{try{return new URL(url).origin}catch{return '[URL]'}});
      const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true});page.setDefaultTimeout(20000);
      const finishPublicSource=publicSource?attachM1PageSourceProof(page,{base,...publicSource,createHash}):null;
      page.on('pageerror',e=>errors.push(safeText(e.stack||e)));
      page.on('console',m=>{if(m.type()==='error')consoleErrors.push(safeText(m.text()))});
      page.on('requestfailed',r=>requestFailures.push({url:safeText(r.url()),resourceType:r.resourceType(),error:safeText(r.failure()?.errorText||'REQUEST_FAILED')}));await routeThree(page);
      await page.exposeBinding('__m1ReadBroker',async(source,{method,params=[]})=>{
        assert.equal(source.frame,source.page.mainFrame());assert.equal(new URL(source.frame.url()).origin,origin);methods.push(method);phaseCounts[phase][method]=(phaseCounts[phase][method]||0)+1;
        if(phase==='M1'){assert.ok(!['eth_getLogs','eth_getTransactionReceipt'].includes(method),'M1 must never request history');if(method==='eth_call'){const allowed=new Set(['kgen()','brainSettlement()','executor()','engine()','brain()','decimals()','SETTLEMENT_ROLE()','hasRole(bytes32,address)','balanceOf(address)'].map(x=>new Interface(['function '+x]).getFunction(x).selector));assert.ok(allowed.has(params[0].data.slice(0,10)),'M1 must not enumerate financial/oracle state')}}
        if(/eth_send|personal_sign|eth_sign|signTypedData/.test(method)){forbidden.push(method);throw Error('M1_WRITE_OR_SIGN_FORBIDDEN')}
        if(method==='eth_accounts'||method==='eth_requestAccounts')return state.connected?[state.account]:[];
        if(method==='eth_chainId')return state.chain;
        if(method==='wallet_switchEthereumChain'){assert.equal(params[0]?.chainId,'0x61');state.chain='0x61';return null}
        assert.ok(['eth_getBalance','eth_call','eth_getCode','eth_getStorageAt','eth_blockNumber','eth_getLogs','eth_getTransactionReceipt','eth_getBlockByNumber'].includes(method),'read-only RPC allowlist');
        if(method==='eth_call')assert.ok(allowedAddresses.has(params[0].to.toLowerCase()));
        const target=['eth_getCode','eth_getStorageAt'].includes(method)?params[0]:params[0]?.to||params[0]?.address,contract=target?['LEGACY','M1'].flatMap(label=>Object.entries(label==='LEGACY'?manifest.addresses:candidate.addresses).filter(([,address])=>address.toLowerCase()===target.toLowerCase()).map(([name])=>label+'.'+name)).join('|'):null;
        const meta={method,phase,stage,contract,selector:method==='eth_call'?params[0]?.data?.slice(0,10):null};
        if(method==='eth_getLogs'){assert.ok(allowedAddresses.has(params[0].address.toLowerCase()));try{return await rpcDiagnostics.run(meta,()=>provider.send(method,params),{existingLogFallback:true})}catch{logFallbacks++;return []}}
        return rpcDiagnostics.run(meta,()=>provider.send(method,params));
      });
      await page.addInitScript(()=>{const listeners=new Map();window.__m1WalletEvents={emit:(name,value)=>{for(const fn of listeners.get(name)||[])fn(value)}};window.ethereum={request:async args=>{const result=await window.__m1ReadBroker(args);if(args.method==='wallet_switchEthereumChain')window.__m1WalletEvents.emit('chainChanged','0x61');return result},on:(n,f)=>{if(!listeners.has(n))listeners.set(n,new Set());listeners.get(n).add(f)},removeListener:(n,f)=>listeners.get(n)?.delete(f)};if(!sessionStorage.getItem('k11520.execution-mode'))sessionStorage.setItem('k11520.execution-mode','SIMULATION')});
      const snap=()=>page.evaluate(()=>globalThis.__K11520_EXECUTION__?.snapshot()??null),shot=name=>page.screenshot({path:`${out}/${width}x${height}-${name}.png`});
      const wallet=async()=>{if(!await page.locator('html').evaluate(e=>e.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();if(await page.locator('#walletPanel').evaluate(e=>e.classList.contains('collapsed')))await page.locator('#walletToggle').click()};
      const verify=async expected=>{
        await page.waitForFunction(a=>{const s=globalThis.__K11520_EXECUTION__?.snapshot();return s?.readOnly&&s.account?.toLowerCase()===a.toLowerCase()&&s.wallet},expected,{timeout:150000});
        const s=await snap(),tag='0x'+s.block.toString(16),native=await provider.send('eth_getBalance',[expected,tag]);
        const [token]=tokenAbi.decodeFunctionResult('balanceOf',await provider.send('eth_call',[{to:candidate.addresses.testToken,data:tokenAbi.encodeFunctionData('balanceOf',[expected])},tag]));
        assert.equal(s.wallet.testBnbBalanceWei,BigInt(native).toString());assert.equal(s.wallet.testBnbBalance,formatUnits(native,18));assert.equal(s.wallet.testTokenBalanceWei,token.toString());
        assert.equal(s.readScope,'BALANCES_ONLY');assert.equal(s.historyStatus,'NOT_REQUESTED');assert.equal(s.positionsStatus,'NOT_REQUESTED');assert.equal(s.balanceStatus,'VERIFIED');assert.ok(s.rpcReadCount<=23,'bounded M1 recovery');assert.equal(s.wallet.free,null);
        assert.deepEqual(s.orders,[]);assert.deepEqual(s.positions,[]);assert.deepEqual(s.receipts,[]);
        await page.locator('#intro11520').waitFor({state:'hidden'});await wallet();await page.locator('#walletPanel').evaluate(el=>{el.scrollTop=0});
        await page.waitForFunction(a=>document.querySelector('#wAddr').textContent.toLowerCase()===a.toLowerCase(),expected);
        assert.equal(await page.locator('#walletRetained').isVisible(),false,'cached hint must not contradict a live provider identity');
        const preflight=page.locator('#k11520RealTradePreflight');
        await page.waitForFunction(a=>document.querySelector('#k11520RealTradePreflight')?.dataset.walletAddress?.toLowerCase()===a.toLowerCase(),expected);
        assert.equal(await preflight.getAttribute('data-wallet-identity-scope'),'ACTIVE_SESSION');
        assert.equal((await preflight.getAttribute('data-wallet-address')).toLowerCase(),expected.toLowerCase());
        const addressLabels=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>el.children.length===0&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(el=>el.textContent).flatMap(text=>text.match(/0x[0-9a-fA-F]{40}|0x[0-9a-fA-F]{4}…[0-9a-fA-F]{4}/g)||[]));
        const expectedShort=expected.slice(0,6)+'…'+expected.slice(-4);assert.ok(addressLabels.length>0);
        for(const label of addressLabels)assert.ok([expected.toLowerCase(),expectedShort.toLowerCase()].includes(label.toLowerCase()),'every visible address label belongs to active account: '+label);
        assert.equal(await page.locator('#wBnb').textContent(),s.wallet.testBnbBalance);assert.equal(await page.locator('#wKgen').textContent(),String(s.wallet.testTokenBalance));
        assert.equal(await page.locator('#testnetFinancialControls').isVisible(),false);assert.equal(await page.locator('#executionMode').isVisible(),false);assert.equal(s.writeBlocked,true);
        // Observe two real canonical-owner timer ticks; no sleep or forced UI success.
        await page.evaluate(()=>{globalThis.__m1ObservedLayout=globalThis.__K11520_MARKET_ORIGIN_RUNTIME__});
        for(let tick=0;tick<2;tick++){
          await page.waitForFunction(()=>{const next=globalThis.__K11520_MARKET_ORIGIN_RUNTIME__;if(!next||next===globalThis.__m1ObservedLayout)return false;globalThis.__m1ObservedLayout=next;return true});
          for(const selector of ['#dock','#aiChatButton','#chatHandle','#bgmButton','#backpackButton','#cargoInterceptionButton','#homeDeliveryButton'])assert.equal(await page.locator(selector).isVisible(),false,'wallet view owns peer utility surface after owner tick '+tick+' '+selector);
        }
        return {account:expected,block:s.block,blockHash:s.blockHash,status:s.status,nativeWei:s.wallet.testBnbBalanceWei,testTokenWei:s.wallet.testTokenBalanceWei,historyStatus:s.historyStatus,positionsStatus:s.positionsStatus,rpcReadCount:s.rpcReadCount,context:s.deploymentContext};
      };
      try{
        await boot(page);await wallet();await page.locator('#walletConnect').click();await page.waitForFunction(()=>!document.querySelector('#walletM1ReadOnly').disabled);
        const legacyPreference=await page.evaluate(()=>sessionStorage.getItem('k11520.execution-mode'));
        phase='M1';await page.locator('#walletM1ReadOnly').click();await page.waitForFunction(()=>__K11520_EXECUTION__.snapshot().readOnly&&__K11520_EXECUTION__.snapshot().status==='WRONG_CHAIN');assert.equal((await snap()).wallet,null);await shot('wrong-chain');
        await page.locator('#testnetSwitch').click();evidence.push(await verify(state.account));await page.locator('#walletPanel').evaluate(el=>{el.scrollTop=0});await shot('connected');stage='ACCOUNT_SWITCH';
        state.account=state.account.toLowerCase()===accounts[0].toLowerCase()?accounts[1]:accounts[0];await page.evaluate(a=>__m1WalletEvents.emit('accountsChanged',[a]),state.account);
        evidence.push(await verify(state.account));await page.locator('#walletPanel').evaluate(el=>{el.scrollTop=0});await shot('account-switched');stage='RELOAD';
        await page.reload({waitUntil:'domcontentloaded'});evidence.push(await verify(state.account));await page.locator('#intro11520').waitFor({state:'hidden'});await wallet();await page.locator('#walletPanel').evaluate(el=>{el.scrollTop=0});await shot('reloaded');stage='DISCONNECT';
        state.connected=false;await page.evaluate(()=>__m1WalletEvents.emit('disconnect',{}));await page.waitForFunction(()=>!__K11520_EXECUTION__.snapshot().wallet);await page.waitForFunction(()=>document.querySelector('#wBnb').textContent==='UNVERIFIED');assert.equal((await page.locator('#walletMsg').textContent()).includes('WRONG NETWORK'),false,'unknown network is not a confirmed wrong network');
        assert.equal(await page.locator('#k11520RealTradePreflight').getAttribute('data-wallet-identity-scope'),'DISCONNECTED');
        assert.equal(await page.locator('#k11520RealTradePreflight').getAttribute('data-wallet-address'),'');
        const disconnectedAddresses=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>el.children.length===0&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').flatMap(el=>el.textContent.match(/0x[0-9a-fA-F]{40}|0x[0-9a-fA-F]{4}…[0-9a-fA-F]{4}/g)||[]));assert.deepEqual(disconnectedAddresses,[],'disconnect must clear all visible current-address labels');await shot('disconnected');stage='RECONNECT';
        state.connected=true;await page.locator('#walletConnect').click();evidence.push(await verify(state.account));await page.locator('#walletPanel').evaluate(el=>{el.scrollTop=0});await shot('reconnected');stage='RETURN_LEGACY';
        assert.equal(await page.evaluate(()=>sessionStorage.getItem('k11520.execution-mode')),legacyPreference);
        phase='LEGACY';await page.locator('#walletM1ReadOnly').click();assert.equal(await page.evaluate(()=>sessionStorage.getItem('k11520.execution-mode')),legacyPreference);await page.locator('#executionMode').click();await page.waitForFunction(a=>{const s=globalThis.__K11520_EXECUTION__?.snapshot();return s?.exitOnly&&s.wallet&&s.account?.toLowerCase()===a.toLowerCase()},state.account,{timeout:150000});
        const legacy=await snap(),legacyTag='0x'+legacy.block.toString(16),brainAbi=new Interface(['function principalOf(address) view returns(uint256)','function availablePrincipal(address) view returns(uint256)']);
        const readLegacy=async name=>brainAbi.decodeFunctionResult(name,await provider.send('eth_call',[{to:manifest.addresses.brainProxy,data:brainAbi.encodeFunctionData(name,[state.account])},legacyTag]))[0].toString();
        assert.equal(legacy.deploymentContext,'97:'+manifest.addresses.brainProxy.toLowerCase());assert.equal(legacy.wallet.principalWei,await readLegacy('principalOf'));assert.equal(legacy.wallet.availableWei,await readLegacy('availablePrincipal'));
        const legacyExitEvidence={account:state.account,block:legacy.block,context:legacy.deploymentContext,principalWei:legacy.wallet.principalWei,availableWei:legacy.wallet.availableWei};
        assert.equal(await page.evaluate(()=>sessionStorage.getItem('k11520.execution-mode')),'BSC_TESTNET');await shot('legacy-exit-preserved');
        const closeHit=await page.locator('#walletToggle').evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))});assert.equal(closeHit,true,'wallet close is reachable');
        await page.locator('#walletToggle').click();await page.waitForFunction(()=>document.querySelector('#walletPanel').classList.contains('collapsed')&&getComputedStyle(document.querySelector('#dock')).display!=='none');
        for(const selector of ['#dock','#aiChatButton','#chatHandle','#bgmButton','#backpackButton'])assert.equal(await page.locator(selector).isVisible(),true,'wallet close restores peer '+selector);await shot('wallet-close-restores-tray');
        const publicBrowserSource=finishPublicSource?await finishPublicSource():null;
        assert.deepEqual(forbidden,[]);assert.deepEqual(errors,[]);results.push({rpcDiagnostics:rpcDiagnostics.snapshot(),publicBrowserSource,viewport:[width,height],functional:'PASS',visual:'REQUIRES_DIRECT_IMAGE_INSPECTION',mode:'ACTUAL_BSC97_READS_SYNTHETIC_EIP1193',humanMetaMask:'NOT_VERIFIED',signedTransactions:0,legacyPreferencePreserved:true,legacyExitEvidence,walletCloseRestoresPeers:true,phaseCounts,legacyHistoryLogFallbacks:logFallbacks,m1HistoryRequests:0,evidence,methods:[...new Set(methods)]});
        await fs.writeFile(`${out}/${width}x${height}-result.json`,JSON.stringify(results.at(-1),null,2));
      }catch(e){await shot('FAILURE').catch(()=>{});const snapshot=await snap().catch(()=>null);await fs.writeFile(`${out}/${width}x${height}-FAILURE.json`,JSON.stringify({stage,message:safeText(e.message),stack:safeText(e.stack||e),snapshot,forbidden,errors,consoleErrors,requestFailures,phaseCounts,legacyHistoryLogFallbacks:logFallbacks,rpcDiagnostics:rpcDiagnostics.snapshot(),evidence,methods:[...new Set(methods)]},null,2));throw e}finally{await page.close()}
    }
    console.log('M1 signer-free public BSC97 read-only browser PASS; Human MetaMask NOT_VERIFIED');
  }finally{await browser.close();provider.destroy()}
}
