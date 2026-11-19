import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {positionRisk} from '../runtime/kgen-margin-runtime.mjs';

// Host-only relative timings in the existing reports. No timer, browser read,
// retry or budget change; each original operation still runs exactly once.
function createSettlementTiming(now=()=>performance.now(),origin=now()){
  const events=[];
  const begin=label=>{const event={label,startMs:now()-origin,status:'RUNNING'};events.push(event);return event};
  const finish=(event,status)=>{if(event.status!=='RUNNING')return;event.endMs=now()-origin;event.durationMs=event.endMs-event.startMs;event.status=status};
  const measure=async(label,operation)=>{
    const event=begin(label);
    try{const value=await operation();finish(event,'COMPLETE');return value}
    catch(error){finish(event,'FAILED');throw error}
  };
  return{begin,finish,measure,snapshot:()=>({clock:'NODE_MONOTONIC_RELATIVE_MS',elapsedMs:now()-origin,events:events.map(event=>({...event}))})};
}

// Keep the application's normal quote poll. For fixture transitions whose
// assertions concern the accepted price rather than wall-clock latency, ask
// that same callback to consume one new routed response immediately.
function captureSettlementQuoteRefresh(){
  const nativeSetInterval=globalThis.setInterval;
  globalThis.setInterval=function register(callback,delay,...args){
    const interval=Reflect.apply(nativeSetInterval,globalThis,[callback,delay,...args]);
    if(typeof callback==='function'&&callback.name==='quotes'&&delay===5000){
      globalThis.setInterval=nativeSetInterval;
      globalThis.__K11520_QA_REFRESH_FIXTURE_QUOTES__=()=>{
        if(document.querySelector('#sheet.open [data-kgen-pool-reference]')){
          throw new Error('Fixture quote refresh cannot request a reserve reference');
        }
        return callback(...args);
      };
    }
    return interval;
  };
}

async function waitForAcceptedFixtureQuote(page,price,previous){
  const observation=await page.waitForFunction(({price,previous})=>{
    const book=globalThis.__K11520_SIMULATION_EXCHANGE__?.snapshot();
    const quote=book?.observations.ETHUSDT;
    if(quote?.price!==price||quote.source!==previous.source||!Number.isSafeInteger(quote.at)||quote.at<=previous.at||
      !Number.isSafeInteger(quote.sequence)||quote.sequence<=previous.sequence)return false;
    return book;
  },{price,previous},{timeout:15000,polling:100});
  try{return await observation.jsonValue()}
  finally{await observation.dispose()}
}

async function driveSettlementFixtureQuote(page,phaseTiming,label,price,setPrice){
  return phaseTiming.measure(label,async()=>{
    const previous=await page.evaluate(()=>globalThis.__K11520_SIMULATION_EXCHANGE__.snapshot().observations.ETHUSDT);
    assert.ok(previous?.source&&Number.isSafeInteger(previous.at)&&Number.isSafeInteger(previous.sequence),
      'Fixture transition requires an existing provider observation');
    setPrice(price);
    const [book]=await Promise.all([
      waitForAcceptedFixtureQuote(page,price,previous),
      page.evaluate(()=>{
        const refresh=globalThis.__K11520_QA_REFRESH_FIXTURE_QUOTES__;
        if(typeof refresh!=='function')throw new Error('Expected the original game quote interval');
        return refresh();
      }),
    ]);
    return book;
  });
}

// Trading regressions explicitly disclose the retained control panel. Default
// gameplay no longer opens C/lots or a fixed disc merely because it was touched.
async function showRetainedControls(page){
  // Only the immutable pre-disclosure baseline uses its original visible
  // controls. Keep its native Submit reproduction, not the new UI setup.
  if(process.argv.includes('--simulation-offline-baseline'))return;
  if(await page.locator('html').evaluate(el=>el.classList.contains('k11520ControlsOpen')))return;
  if(!await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
  if(!await page.locator('#k11520UiSettings').evaluate(el=>el.classList.contains('open')))await page.locator('#gameModeToggle').click();
  await page.locator('#k11520ShowControls').click();
  if(await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
}

if(process.argv.includes('--simulation-offline')||process.argv.includes('--simulation-offline-baseline')){
  await offlineSimulationBrowserQA({baseline:process.argv.includes('--simulation-offline-baseline')});process.exit(0);
}

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
const settlementStarted=performance.now();
const browser=await chromium.launch({headless:true});
try {
  for(const [width,height] of [[390,844],[844,390]]) {
    const phaseTiming=createSettlementTiming(()=>performance.now(),settlementStarted),generalPhase=phaseTiming.begin('generic');
    let eth=4000;
    const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true});
    page.setDefaultTimeout(20000);
    await page.addInitScript(captureSettlementQuoteRefresh);
    const driveQuote=(label,price)=>driveSettlementFixtureQuote(page,phaseTiming,label,price,value=>{eth=value});
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
    await showRetainedControls(page);await page.locator('#cNumericInput').fill('1');await page.locator('#cNumericInput').press('Enter');
    await page.locator('#lotsNumericInput').fill('10');await page.locator('#lotsNumericInput').press('Enter');
    const organ=async name=>{
      if(await page.locator('#sheet').isVisible())await page.locator('#sheetClose').click();
      if(!await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
      if(!await page.locator(`#dock [data-organ="${name}"]`).isVisible())await page.locator('#dockToggle').click();
      await page.locator(`#dock [data-organ="${name}"]`).click();
    };
    const shot=async name=>phaseTiming.measure('generic.screenshot:'+name,()=>page.screenshot({path:`${out}/${width}x${height}-${name}.png`}));
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
    const orderDirection=side=>page.locator(`#confirmBody [data-order-side="${side}"]`);
    const orderCount=await page.evaluate(()=>__K11520_SIMULATION_EXCHANGE__.snapshot().orders.length);
    await orderDirection('SHORT').click();
    await page.waitForFunction(()=>!document.querySelector('#confirmOrder').disabled&&/SHORT/.test(document.querySelector('#simulationOrderPreview').textContent));
    assert.equal(await orderDirection('SHORT').getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('#confirmOrder').textContent(),/確認做空/);
    assert.equal(await page.evaluate(()=>__K11520_SIMULATION_EXCHANGE__.snapshot().orders.length),orderCount);
    await orderDirection('LONG').click();
    await page.waitForFunction(()=>!document.querySelector('#confirmOrder').disabled&&/LONG/.test(document.querySelector('#simulationOrderPreview').textContent));
    assert.equal(await orderDirection('LONG').getAttribute('aria-pressed'),'true');
    await shot('pending-confirm');
    await page.locator('#confirmOrder').click();
    // PENDING ledger state is observable before the async click handler opens
    // the orders sheet. Wait for that real UI transition before navigating it.
    await page.locator('#confirm').waitFor({state:'hidden'});
    await page.locator('#sheet.open').waitFor({state:'visible'});
    const snap=()=>phaseTiming.measure('generic.snapshot',()=>page.evaluate(()=>globalThis.__K11520_SIMULATION_EXCHANGE__.snapshot()));
    let s=await snap();assert.equal(s.orders[0].status,'PENDING');assert.equal(s.orders[0].side,'LONG');assert.equal(s.wallet.lockedMargin,0);
    await organ('orders');await shot('pending');
    const filledQuote=await driveQuote('generic.pending-fill-quote',4002);
    assert.equal(filledQuote.orders[0]?.status,'FILLED');
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
    const gapQuote=2900; // First fill 4002 at k=3 has a long liquidation mark of 3002.
    const beforeStale=await snap();
    quoteStale=true;eth=gapQuote;
    await phaseTiming.measure('generic.stale-fixture-refresh',async()=>{
      const fixtureResponse=page.waitForResponse(response=>{
        const url=new URL(response.url());
        return response.ok()&&url.origin==='https://data-api.binance.vision'&&
          url.pathname.endsWith('/aggTrades')&&url.searchParams.get('symbol')==='ETHUSDT';
      },{timeout:15000});
      const [response]=await Promise.all([
        fixtureResponse,
        page.evaluate(()=>globalThis.__K11520_QA_REFRESH_FIXTURE_QUOTES__()),
        page.waitForFunction(()=>document.querySelector('#feed')?.textContent.includes('MARKET DATA STALE'),null,{timeout:15000}),
      ]);
      const [row]=await response.json();
      assert.equal(Number(row.p),gapQuote,'exercise the fixture gap below the liquidation mark');
      assert.ok(Date.now()-row.T>=45000,'the real quote refresh requested an expired fixture row');
    });
    const staleBook=await snap();
    assert.equal(staleBook.positions[0].status,'OPEN','stale liquidation must not mutate position');
    assert.equal(staleBook.observations.ETHUSDT.price,beforeStale.observations.ETHUSDT.price,'stale gap cannot replace the latest eligible price');
    assert.deepEqual(staleBook.receipts,beforeStale.receipts,'stale gap cannot create a settlement receipt');
    assert.match(await page.locator('#feed').innerText(),/MARKET DATA STALE/);await shot('stale-position-preserved');
    quoteStale=false;
    s=await driveQuote('generic.fresh-gap-liquidation',gapQuote);
    assert.equal(s.positions[0].status,'LIQUIDATED');
    assert.equal(s.positions[0].margin,0);assert.equal(s.wallet.free,90);assert.equal(s.wallet.lockedMargin,0);
    assert.equal(s.receipts.filter(r=>r.kind==='SETTLEMENT').length,1);assert.ok(s.receipts.at(-1).badDebt>0);
    const liquidation=s.receipts.at(-1);
    assert.equal(liquidation.liquidationTrigger,3002,'liquidation uses the fixed entry floor unit in USDT');
    assert.equal(liquidation.settlementPrice,gapQuote,'receipt retains the observed raw USDT price');
    assert.equal(liquidation.realizedPnl,-10,'liquidation loss is limited to the position margin');
    await organ('history');await page.locator('#sheetBody summary').first().click();await shot('liquidation-receipt');
    await organ('assets');await shot('wallet');
    const walletText=await page.locator('#sheetBody').innerText();
    assert.match(walletText,/SIMULATION WALLET/);
    for(const label of ['AVAILABLE','LOCKED MARGIN','EQUITY','UNREALIZED PNL','REALIZED PNL'])assert.match(walletText,new RegExp(label));

    const liquidationQuote=s.observations.ETHUSDT;
    assert.equal(liquidationQuote?.price,gapQuote,'the stale-price fixture must have recovered before liquidation');
    assert.ok(liquidationQuote.source&&Number.isSafeInteger(liquidationQuote.at)&&Number.isSafeInteger(liquidationQuote.sequence),'liquidation must carry a provider source, time and sequence');
    const receiptsBeforeRecovery=s.receipts.map(receipt=>receipt.receiptId);
    // The Assets panel is already verified. Close it before refreshing the
    // synthetic quote so the reserve-reference read guard remains intact.
    await page.locator('#sheetClose').click();
    await page.locator('#sheet').waitFor({state:'hidden'});
    // Observe the next accepted fixture quote and its committed ledger together.
    s=await driveQuote('generic.recovery-quote',4002);
    assert.equal(s.positions[0].positionId,openId);
    assert.equal(s.positions[0].status,'LIQUIDATED');
    assert.equal(s.receipts.length,2);
    assert.deepEqual(s.receipts.map(receipt=>receipt.receiptId),receiptsBeforeRecovery);
    if(await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
    await page.locator('#orderFire').click();await page.locator('#simulationTriggerPrice').fill('4003');await page.locator('#confirmOrder').click();
    await page.waitForFunction(()=>globalThis.__K11520_SIMULATION_EXCHANGE__.snapshot().orders[1]?.status==='PENDING',null,{timeout:15000});
    const secondFillQuote=await driveQuote('generic.second-fill-quote',4004);
    assert.equal(secondFillQuote.positions[1]?.status,'OPEN');
    assert.equal(secondFillQuote.positions[1].entry,4004,'the indexed PnL model keeps the raw fill price');
    const markQuote=await driveQuote('generic.profitable-mark-quote',4008);
    assert.ok(Math.abs(markQuote.wallet.unrealizedPnl-.04)<1e-8,'four USDT at k=3 across ten lots gives 0.04 KGEN');
    await organ('positions');await shot('pnl');
    await page.locator('[data-sim-close]').click();
    s=await snap();assert.equal(s.positions[1].status,'CLOSED');assert.equal(s.wallet.lockedMargin,0);assert.ok(s.wallet.free>90);
    assert.equal(s.receipts.length,4);assert.equal(s.receipts.at(-1).status,'CLOSED');
    assert.ok(Math.abs(s.receipts.at(-1).realizedPnl-.04)<1e-8,'close settles the normalized PnL from the same mark');
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
    await showRetainedControls(page);await page.locator('#cNumericInput').fill('5');await page.locator('#cNumericInput').press('Enter');
    await page.locator('#orderFire').click();
    await page.waitForFunction(()=>document.querySelector('#simulationOrderPreview')?.textContent.includes('V1_HIGH_SPEED_PRODUCTION_LOCKED'));
    assert.equal(await page.locator('#confirmOrder').isDisabled(),true);await shot('high-c-locked');
    await page.locator('#cancelOrder').click();
    await showRetainedControls(page);await page.locator('#cNumericInput').fill('0');await page.locator('#cNumericInput').press('Enter');
    if(!await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
    await page.locator('#gameModeToggle').click();await page.locator('#journeyReplay').click();
    assert.equal(await page.evaluate(()=>__K11520_JOURNEY__.snapshot().stage),'MOVE');
    await shot('journey-story');await page.locator('#journeyContinue').click();
    await showRetainedControls(page);const joy=await page.locator('#joy').boundingBox(),jx=joy.x+joy.width/2,jy=joy.y+joy.height/2;
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
    await showRetainedControls(page);await page.locator('#cNumericInput').fill('.001');await page.locator('#cNumericInput').press('Enter');
    await showRetainedControls(page);await page.locator('#joy').tap();
    await showRetainedControls(page);await page.locator('#cNumericInput').fill('-.001');await page.locator('#cNumericInput').press('Enter');
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
    assert.deepEqual(errors,[]);phaseTiming.finish(generalPhase,'COMPLETE');await fs.writeFile(`${out}/${width}x${height}-result.json`,JSON.stringify({mode:'DETERMINISTIC_SIMULATION_FIXTURES',functional:'PASS',visual:'REQUIRES_DIRECT_IMAGE_INSPECTION',snapshot:s,timing:phaseTiming.snapshot()},null,2));
    await page.close();
    await navigationConsoleBrowserQA({browser,width,height,base,out,timingOrigin:settlementStarted});
  }
  console.log('PASS: real Chromium pending/cross/fill/isolated liquidation/receipts/wallet/rotation (both viewports)');
} finally {await browser.close()}

// The same two existing CI viewports get a separate guest context and ledger.
// Only external read-only quote responses are fixtures; every decision uses the
// real rendered controls, original adapter and original actor/collision clock.
async function navigationConsoleBrowserQA({browser,width,height,base,out,timingOrigin}){
  const phaseTiming=createSettlementTiming(()=>performance.now(),timingOrigin),navigationPhase=phaseTiming.begin('navigation');
  const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true});page.setDefaultTimeout(20000);
  const report={mode:'DETERMINISTIC_SIMULATION_FIXTURES',syntheticQuotes:true,width,height,visual:'REQUIRES_DIRECT_IMAGE_INSPECTION',screenshots:[],controlChecks:[],pageErrors:[],networkAuthorityAttempts:[],blockedReadOnlyReferences:[],checks:{}};
  let eth=4000,sequence=0;
  await page.addInitScript(captureSettlementQuoteRefresh);
  const driveQuote=(label,price)=>driveSettlementFixtureQuote(page,phaseTiming,label,price,value=>{eth=value});
  const {KGEN_POOL_REFERENCE_SOURCE}=await import('../runtime/public-market-quotes.mjs');
  page.on('pageerror',error=>report.pageErrors.push(String(error)));
  page.on('websocket',socket=>report.networkAuthorityAttempts.push({method:'WEBSOCKET',url:socket.url()}));
  await page.addInitScript(()=>{
    window.__navigationQA={providerCalls:[],native:[]};
    window.ethereum={on(){},removeListener(){},request:async({method})=>{
      __navigationQA.providerCalls.push(method);
      if(method==='eth_accounts')return [];
      if(method==='eth_chainId')return '0x38';
      throw new Error('FORBIDDEN_NAVIGATION_QA_PROVIDER_METHOD:'+method);
    }};
    for(const type of ['click','change'])document.addEventListener(type,event=>{
      const element=event.target?.closest?.('#navigationConsole button,#navigationConsole select,#navigationAutopilotAck,#confirmOrder,[data-sim-close]');
      if(element)__navigationQA.native.push({type,id:element.id||element.dataset.simClose,isTrusted:event.isTrusted});
    },true);
  });
  await page.route('https://data-api.binance.vision/**',route=>{
    const url=new URL(route.request().url()),prices={BTCUSDT:100000,ETHUSDT:eth,BNBUSDT:600};
    const payload=url.pathname.endsWith('/aggTrades')?[{p:String(prices[url.searchParams.get('symbol')]),T:Date.now(),a:++sequence}]:Object.entries(prices).map(([symbol,price])=>({symbol,price:String(price)}));
    return route.fulfill({contentType:'application/json',body:JSON.stringify(payload)});
  });
  await page.route('**/docs/K11520_BSC_TESTNET_DEPLOYMENT_MANIFEST.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({status:'PREPARED_NOT_DEPLOYED',chainId:97,testOnly:true})}));
  await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',async route=>{
    const prefix='https://cdn.jsdelivr.net/npm/three@0.180.0/';let body=await fs.readFile('node_modules/three/'+route.request().url().slice(prefix.length),'utf8');
    body=body.replaceAll("from 'three'",`from '${prefix}build/three.module.js'`).replaceAll('from "three"',`from "${prefix}build/three.module.js"`);
    await route.fulfill({contentType:'text/javascript',body});
  });
  await page.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url()),external=url.origin!==new URL(base).origin;
    if(request.url()===new URL(KGEN_POOL_REFERENCE_SOURCE.rpc).href&&request.method()==='POST'){
      let payload;try{payload=request.postDataJSON()}catch{}
      if(payload?.jsonrpc==='2.0'&&payload.method==='eth_chainId'&&Array.isArray(payload.params)&&payload.params.length===0){
        report.blockedReadOnlyReferences.push({url:request.url(),method:payload.method,forwarded:false});
        return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'OFFLINE_READONLY_REFERENCE_UNAVAILABLE'})});
      }
    }
    const rpc=external&&/dataseed|llamarpc|ankr\.com|infura|alchemy|quicknode|(?:^|[./-])rpc(?:[./-]|$)/i.test(url.hostname+url.pathname);
    if(!['GET','HEAD','OPTIONS'].includes(request.method())||rpc){report.networkAuthorityAttempts.push({method:request.method(),origin:url.origin,path:url.pathname,rpc});return route.abort('blockedbyclient')}
    return route.fallback();
  });
  const snapshot=()=>phaseTiming.measure('navigation.snapshot',()=>page.evaluate(()=>({view:__K11520_NAVIGATION_CONSOLE__.snapshot(),book:__K11520_SIMULATION_EXCHANGE__.snapshot(),motion:globalThis.__K11520_LOCAL_MOTION__,fixture:__navigationQA})));
  const near=(actual,expected,label)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=1e-8,`${label}: ${actual} != ${expected}`);
  const game=async()=>{
    if(await page.locator('#confirm').evaluate(el=>el.classList.contains('open')))await page.locator('#cancelOrder').click();
    await page.locator('#confirm').waitFor({state:'hidden'});
    if(await page.locator('#sheet').evaluate(el=>el.classList.contains('open')))await page.locator('#sheetClose').click();
    await page.locator('#sheet').waitFor({state:'hidden'});
    if(await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
  };
  const organ=async name=>{await game();await page.locator('#k11520UtilityMaster').click();if(!await page.locator(`#dock [data-organ="${name}"]`).isVisible())await page.locator('#dockToggle').click();await page.locator(`#dock [data-organ="${name}"]`).click();await page.locator('#sheet.open').waitFor()};
  // This callback is self-contained so single native-action targets and the
  // final read-only batch use exactly the same rendered DOM measurements.
  const inspectNavigationControls=async(root,{selector,selectors}={})=>{
    const rect=element=>{const r=element.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
    const visibleRect=(element,clips,stickyHeader)=>{
      const style=getComputedStyle(element),r=rect(element);if(element.disabled||style.display==='none'||style.visibility==='hidden'||!r.width||!r.height)return null;
      let left=Math.max(0,r.x),top=Math.max(0,r.y),right=Math.min(innerWidth,r.right),bottom=Math.min(innerHeight,r.bottom);
      for(let parent=element.parentElement;parent;parent=parent.parentElement){
        let clip=clips.get(parent);if(!clip){const css=getComputedStyle(parent),p=parent.getBoundingClientRect();clip={x:/auto|scroll|hidden|clip/.test(css.overflowX),y:/auto|scroll|hidden|clip/.test(css.overflowY),left:p.left+parent.clientLeft,right:p.left+parent.clientLeft+parent.clientWidth,top:p.top+parent.clientTop,bottom:p.top+parent.clientTop+parent.clientHeight};clips.set(parent,clip)}
        if(clip.x){left=Math.max(left,clip.left);right=Math.min(right,clip.right)}
        if(clip.y){top=Math.max(top,clip.top);bottom=Math.min(bottom,clip.bottom)}
      }
      const owner=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      // Scrolled controls behind the sticky header are not currently clickable.
      // A pointer-transparent toast over an owned control still counts below.
      if(!owner||!(element===owner||element.contains(owner)))return null;
      // A partly scrolled field can own its center below the opaque sticky
      // header while its top is behind that header. Only that hidden strip is
      // excluded; the current action target retains its full rectangle below.
      if(stickyHeader&&stickyHeader.x<=left&&stickyHeader.right>=right&&stickyHeader.y<=top)top=Math.max(top,stickyHeader.bottom);
      return right>left&&bottom>top?{x:left,y:top,width:right-left,height:bottom-top,right,bottom}:null;
    };
    const rows=[];
    for(const currentSelector of selectors||[selector]){
      const began=Date.now(),el=selectors?root.querySelector(currentSelector):root;if(!el)throw new Error('Missing navigation control: '+currentSelector);
      el.scrollIntoView({block:'center',inline:'nearest'});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const r=rect(el),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2),toast=document.getElementById('toast');
      let feedback=null;
      if(toast?.classList.contains('show')){
        const sheet=document.getElementById('sheet'),header=sheet?.querySelector('.sheetHead'),t=rect(toast);
        // Share only this synchronous snapshot's ancestor clips; each target's
        // scroll and two-frame settle gets fresh measurements above.
        const headerBox=header?rect(header):null,stickyHeader=toast.parentElement===header&&getComputedStyle(header).position==='sticky'&&getComputedStyle(header).backgroundColor==='rgb(16, 25, 35)'?headerBox:null;
        const clips=new Map(),controls=[...document.querySelectorAll('#navigationConsole button,#navigationConsole input,#navigationConsole select,#navigationConsole summary')].map(control=>({id:control.id||control.tagName,rect:visibleRect(control,clips,stickyHeader)})).filter(control=>control.rect);
        feedback={show:true,text:toast.textContent,context:toast.dataset.panelContext,inHeader:toast.parentElement===header,role:toast.getAttribute('role'),live:toast.getAttribute('aria-live'),position:getComputedStyle(toast).position,opacity:Number(getComputedStyle(toast).opacity),toast:t,header:header?rect(header):null,title:header?.querySelector('h2')?rect(header.querySelector('h2')):null,close:header?.querySelector('.close')?rect(header.querySelector('.close')):null,controls,overlaps:controls.filter(control=>Math.min(t.right,control.rect.right)>Math.max(t.x,control.rect.x)&&Math.min(t.bottom,control.rect.bottom)>Math.max(t.y,control.rect.y)).map(control=>control.id)};
      }
      rows.push({selector:currentSelector,elapsedMs:Date.now()-began,...r,inView:r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight,hit:!!hit&&(el===hit||el.contains(hit)),feedback});
    }
    return rows;
  };
  const recordControl=(box,{expectedToast}={})=>{
    report.controlChecks.push(box);const {selector,feedback}=box;
    assert.equal(box.inView,true,selector+' must be in the actual viewport');assert.equal(box.hit,true,selector+' must own its pointer center');assert.ok(box.width>=44&&box.height>=44,selector+' must retain a readable touch target');
    if(expectedToast){assert.equal(feedback?.show,true,'The native missing-ack feedback must still be truly shown');assert.equal(feedback.text,expectedToast)}
    if(feedback){
      assert.equal(feedback.context,'sheet');assert.equal(feedback.inHeader,true);assert.equal(feedback.position,'static');assert.equal(feedback.role,'status');assert.equal(feedback.live,'polite');assert.ok(feedback.opacity>0&&feedback.header&&feedback.title&&feedback.close,'Navigation feedback must be visible in the existing complete header');assert.deepEqual(feedback.overlaps,[],'Visible navigation feedback must not overlap currently clickable controls');
      assert.ok(Math.min(feedback.toast.right,box.right)<=Math.max(feedback.toast.x,box.x)||Math.min(feedback.toast.bottom,box.bottom)<=Math.max(feedback.toast.y,box.y),'Visible navigation feedback must not overlap the complete current action target');
      assert.ok(feedback.toast.width>0&&feedback.toast.height>0&&feedback.toast.x>=0&&feedback.toast.right<=width+1&&feedback.toast.y>=0&&feedback.toast.bottom<=height+1,'Visible navigation feedback must remain inside the viewport');
      assert.ok(feedback.toast.y>=Math.max(feedback.title?.bottom||0,feedback.close?.bottom||0)-1&&feedback.toast.bottom<=feedback.header.bottom+1,'Navigation feedback must have its own header row');
    }
  };
  const control=(selector,options)=>phaseTiming.measure('navigation.control:'+selector,async()=>{
    const element=page.locator(selector),began=Date.now(),[box]=await element.evaluate(inspectNavigationControls,{selector});
    box.elapsedMs=Date.now()-began;recordControl(box,options);return element;
  });
  const shot=async(name,selector)=>{
    if(selector)await control(selector);
    for(const fullPage of [false,true]){const file=`${width}x${height}-navigation-${name}-SYNTHETIC${fullPage?'-fullpage':''}.png`;await phaseTiming.measure('navigation.screenshot:'+name+(fullPage?':fullpage':''),()=>page.screenshot({path:`${out}/${file}`,fullPage}));report.screenshots.push(file)}
  };
  const setC=async value=>{await game();await showRetainedControls(page);await page.locator('#cNumericInput').fill(String(value));await page.locator('#cNumericInput').press('Enter');await page.waitForFunction(value=>__K11520_SIGNED_C_IMMERSIVE__.signedC===value,value)};
  const setTarget=async target=>{for(const axis of ['x','y','z'])await page.locator('#navigation'+axis.toUpperCase()).fill(String(target[axis]))};
  const moveAndStop=async(label,expectedSource='LOCAL_WALK')=>{
    // At filled 1C the canonical local calibration is about 22.76 m/s. Keep
    // an observable route after native scrolling/click delivery, not a 0.53s race.
    const distance=expectedSource==='FILLED_POSITION'?120:12;
    const before=await snapshot(),target={...before.view.playerXYZ,y:before.view.playerXYZ.y+distance};await setTarget(target);
    const planned=await snapshot();assert.equal(planned.view.route.status,'ESTIMATE');assert.ok(planned.view.route.etaSeconds>0);near(planned.view.route.distance,distance,'local XYZ distance');
    await (await control('#navigationGo')).click();
    const observed=await page.waitForFunction(({position,expectedSource})=>{const view=__K11520_NAVIGATION_CONSOLE__.snapshot(),motion=__K11520_LOCAL_MOTION__;return view.navigation?.active&&motion?.status==='MOVING'&&motion.speedSource===expectedSource&&motion.observedSpeedKPerSecond>0&&Math.hypot(...['x','y','z'].map(axis=>view.playerXYZ[axis]-position[axis]))>=1?{view,motion,book:__K11520_SIMULATION_EXCHANGE__.snapshot()}:false},{position:before.view.playerXYZ,expectedSource});
    const moved=await observed.jsonValue();await observed.dispose();assert.equal(moved.motion.speedSource,expectedSource);assert.equal(moved.motion.appliedC,expectedSource==='LOCAL_WALK'?0:1);
    await (await control('#navigationStop')).click();await page.waitForFunction(()=>!__K11520_NAVIGATION_CONSOLE__.snapshot().navigation.active);
    const stopped=await snapshot();await page.waitForTimeout(400);const still=await snapshot();assert.deepEqual(still.view.playerXYZ,stopped.view.playerXYZ,'stopping navigation leaves no second movement clock');
    report.checks[label]={planned:planned.view,moved:{view:moved.view,motion:moved.motion},stopped:stopped.view};await shot(label,'#navigationStop');return moved;
  };
  try{
    await page.goto(`${base}/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>globalThis.__K11520_NAVIGATION_CONSOLE__&&globalThis.__K11520_SIGNED_C_IMMERSIVE__?.ready&&globalThis.__K11520_SIMULATION_EXCHANGE__?.snapshot().observations.ETHUSDT,null,{timeout:15000});
    if(await page.locator('#enter11520').isVisible())await page.locator('#enter11520').click();await page.locator('#intro11520').waitFor({state:'hidden'});
    await organ('worldmap');const initial=await snapshot();report.checks.markets=[];
    for(const [axis,market] of [['KX','BTCUSDT'],['KY','ETHUSDT'],['KZ','BNBUSDT']]){
      await (await control('#navigationMarket')).selectOption(axis);await page.waitForFunction(axis=>__K11520_NAVIGATION_CONSOLE__.snapshot().axis===axis,axis);
      const current=await snapshot();assert.equal(current.view.market,market);assert.equal(current.view.physicalPlane,initial.view.physicalPlane);assert.deepEqual(current.view.playerXYZ,initial.view.playerXYZ);assert.equal(current.book.orders.length,0);report.checks.markets.push(current.view);
    }
    await page.locator('#navigationMarket').selectOption('KY');await shot('three-markets','#navigationMarket');
    await setC(1);await page.locator('#lotsNumericInput').fill('1');await page.locator('#lotsNumericInput').press('Enter');await organ('worldmap');
    const draftMotion=await moveAndStop('draft-c-walk');assert.equal(draftMotion.book.positions.length,0);
    await game();await page.locator('#orderFire').click();await page.locator('#simulationTriggerPrice').fill('4001');await page.locator('#confirmOrder').click();await page.locator('#confirm').waitFor({state:'hidden'});await page.locator('#sheet.open').waitFor();
    let state=await snapshot();assert.equal(state.book.orders.length,1);assert.equal(state.book.orders[0].status,'PENDING');assert.equal(state.book.positions.length,0);
    await organ('worldmap');const pendingMotion=await moveAndStop('pending-c-walk');near(pendingMotion.motion.speedKPerSecond,draftMotion.motion.speedKPerSecond,'pending order cannot ignite C');
    const filledQuote=await driveQuote('navigation.filled-speed-quote',4002);
    assert.equal(filledQuote.positions[0]?.status,'OPEN');
    await page.waitForFunction(()=>__K11520_LOCAL_MOTION__?.speedSource==='FILLED_POSITION');state=await snapshot();assert.equal(state.motion.appliedC,1);assert.ok(state.motion.speedKPerSecond>pendingMotion.motion.speedKPerSecond);report.checks.filledSpeed={motion:state.motion,position:state.book.positions[0]};
    await setC(-1);await organ('worldmap');const filledMotion=await moveAndStop('filled-c-move','FILLED_POSITION');assert.ok(filledMotion.motion.observedSpeedKPerSecond>pendingMotion.motion.observedSpeedKPerSecond,'a filled position changes measured physical speed, rather than presentation alone');state=await snapshot();assert.equal(state.motion.appliedC,1,'changing the draft C preserves the filled position engine');
    const position=state.book.positions[0],receiptIds=state.book.receipts.map(row=>row.receiptId);report.checks.scenarios=[];
    assert.equal(position.entry,4002,'entry floor comes from the raw USDT fill');
    for(const [mark,pnl] of [[10002,6],[1,-1]]){
      await page.locator('#navigationTargetPrice').fill(String(mark));const current=await snapshot(),expected=positionRisk({...position,mark});
      assert.equal(current.view.scenario.status,'ESTIMATE');assert.equal(current.view.scenario.source,'OPEN_POSITION');assert.equal(current.view.scenario.c,position.c);assert.equal(current.view.scenario.feeKgen,0);near(current.view.scenario.pnl,expected.pnl,'original scenario PnL');assert.ok(current.view.scenario.pnl>=-expected.principal);
      near(current.view.scenario.pnl,pnl,'scenario retains the actual fill floor across a natural price boundary');
      assert.deepEqual(current.book.receipts.map(row=>row.receiptId),receiptIds,'scenario preview never settles the real simulation position');assert.equal(current.book.orders.length,1);report.checks.scenarios.push(current.view.scenario);
      await shot(mark===1?'loss-floor-preview':'profit-preview','#navigationTargetPrice');
    }
    await (await control('#navigationManagePositions')).click();await page.locator('[data-sim-close]').click();await page.waitForFunction(()=>__K11520_SIMULATION_EXCHANGE__.snapshot().positions[0]?.status==='CLOSED');
    await organ('worldmap');await page.locator('#navigationAutopilotSettings summary').click();const beforeAutoSnapshot=await snapshot(),beforeAuto=beforeAutoSnapshot.book.orders.length,beforeAutoState=beforeAutoSnapshot.view.autopilot.state;assert.ok(['DISARMED','STOPPED'].includes(beforeAutoState));
    await (await control('#navigationAutoStart')).click();const missingAck=await snapshot();assert.equal(missingAck.view.autopilot.state,beforeAutoState);assert.equal(missingAck.book.orders.length,beforeAuto);assert.match(await page.locator('#toast').textContent(),/請先確認/);
    await page.locator('#navigationAutopilotAck').check();const invalidStart=await control('#navigationAutoStart',{expectedToast:'請先確認模擬自駕設定'});
    const feedbackFile=`${width}x${height}-navigation-autopilot-ack-feedback-SYNTHETIC-header.png`,feedbackBegan=Date.now();await page.locator('#sheet .sheetHead').screenshot({path:`${out}/${feedbackFile}`});report.toastEvidence=[{file:feedbackFile,controlIndex:report.controlChecks.length-1,captureElapsedMs:Date.now()-feedbackBegan}];
    await invalidStart.click();assert.equal((await snapshot()).view.autopilot.state,beforeAutoState);assert.equal((await snapshot()).book.orders.length,beforeAuto);assert.match(await page.locator('#toast').textContent(),/設定未通過/);
    for(const [id,value] of Object.entries({navigationLongAbove:4001,navigationShortBelow:3990,navigationAutoC:1,navigationAutoLots:1,navigationMaxLoss:2,navigationMaxOrders:2}))await page.locator('#'+id).fill(String(value));
    // Staying at the current physical position prevents arrival from being a
    // second reason to stop; this explicit checkbox authorizes continued SIM.
    await setTarget((await snapshot()).view.playerXYZ);await page.locator('#navigationContinue').check();await (await control('#navigationAutoStart')).click();
    await page.waitForFunction(()=>__K11520_NAVIGATION_CONSOLE__.snapshot().autopilot.submittedOrders===1);state=await snapshot();assert.equal(state.view.autopilot.config.market,'ETHUSDT');assert.equal(state.view.autopilot.config.axis,'KY');assert.equal(state.view.autopilot.signerRequested,false);assert.equal(state.view.autopilot.broadcast,false);assert.equal(state.book.orders.length,beforeAuto+1);
    const autoOrderId=state.view.autopilot.orderIds[0];assert.ok(state.book.orders.some(order=>order.orderId===autoOrderId));report.checks.armed=state;
    await (await control('#navigationAutoStop')).click();await page.waitForFunction(()=>__K11520_NAVIGATION_CONSOLE__.snapshot().autopilot.state==='STOPPED');state=await snapshot();assert.ok(state.book.orders.some(order=>order.orderId===autoOrderId),'stop cannot cancel an already-created order');report.checks.stopped=state;await shot('autopilot-stopped','#navigationAutoStop');
    const oppositeQuote=await driveQuote('navigation.stopped-opposite-quote',3988);
    assert.equal(oppositeQuote.observations.ETHUSDT?.price,3988);
    await page.waitForTimeout(2200);state=await snapshot();assert.equal(state.book.orders.length,beforeAuto+1,'stopped decisions cannot reverse on a later opposite signal');assert.equal(state.view.autopilot.state,'STOPPED');assert.ok(state.book.orders.some(order=>order.orderId===autoOrderId));report.checks.afterOppositeSignal=state;
    const selectors=['navigationMarket','navigationX','navigationY','navigationZ','navigationGo','navigationStop','navigationTargetPrice','navigationLongAbove','navigationShortBelow','navigationAutoC','navigationAutoLots','navigationMaxLoss','navigationMaxOrders','navigationAutoStart','navigationAutoStop'].map(id=>'#'+id),batchBegan=Date.now();
    const boxes=await phaseTiming.measure('navigation.control-batch',()=>page.locator('body').evaluate(inspectNavigationControls,{selectors}));report.controlBatch={selectors,elapsedMs:Date.now()-batchBegan,count:boxes.length};assert.equal(boxes.length,selectors.length);for(const box of boxes)recordControl(box);assert.equal(report.controlChecks.length,36,'All original navigation control checks must complete');
    assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.networkAuthorityAttempts,[]);assert.ok(state.fixture.providerCalls.every(method=>['eth_accounts','eth_chainId'].includes(method)),'no wallet connect, signer, chain switch or transaction requests');
    assert.ok(state.fixture.native.some(event=>event.id==='navigationGo'&&event.isTrusted));assert.ok(state.fixture.native.some(event=>event.id==='navigationAutoStart'&&event.isTrusted));assert.ok(state.fixture.native.filter(event=>event.type==='click').every(event=>event.isTrusted),'navigation actions use native rendered controls');
    report.functional='PASS';
  }catch(error){report.functional='FAIL';report.error=String(error?.stack||error);try{await shot('failure')}catch{}throw error}
  finally{try{report.final=await snapshot()}catch{}phaseTiming.finish(navigationPhase,report.functional==='PASS'?'COMPLETE':'FAILED');report.timing=phaseTiming.snapshot();await fs.writeFile(`${out}/${width}x${height}-navigation-result.json`,JSON.stringify(report,null,2));await page.close()}
}

// Opt-in P0 acceptance at the actual game entry. This lane never calls a model
// submit/observe API, replaces runtime code, connects a wallet, or signs a TX.
// Baseline mode records the same native attempt against an explicitly pinned
// pre-repair server; BASELINE_REPRODUCED is not a product/browser PASS.
// Read-only readiness before native input: observe real rendered frames, never
// finish animations, mutate styles, scroll controls, or retry submitted actions.
async function waitForOfflineConfirmationGeometry(page,record){
  await page.evaluate(selector=>{globalThis.__offlineSimulationQA.confirmGeometry={selector,frames:[],stableFrames:0}},record.selector);
  try{
    await page.waitForFunction(()=>{
      const evidence=globalThis.__offlineSimulationQA.confirmGeometry,element=document.querySelector(evidence.selector),surface=document.querySelector('#confirm');
      const rect=element?.getBoundingClientRect(),box=rect?{x:rect.x,y:rect.y,width:rect.width,height:rect.height,right:rect.right,bottom:rect.bottom}:null;
      const ancestors=[];for(let node=element;node;node=node.parentElement){
        const css=getComputedStyle(node);ancestors.push({id:node.id||node.tagName,display:css.display,visibility:css.visibility,opacity:css.opacity,transform:css.transform,
          animations:node.getAnimations().map(animation=>({playState:animation.playState,pending:animation.pending,currentTime:animation.currentTime,progress:animation.effect?.getComputedTiming().progress??null}))});
      }
      const visible=!!surface?.classList.contains('open')&&!!box&&box.width>0&&box.height>0&&ancestors.every(node=>node.display!=='none'&&node.visibility==='visible'&&Number(node.opacity)>0);
      const moving=ancestors.some(node=>node.animations.some(animation=>animation.pending||!['finished','idle'].includes(animation.playState)));
      const previous=evidence.frames.at(-1),same=!!previous?.box&&!!box&&Object.keys(box).every(key=>box[key]===previous.box[key]);
      evidence.stableFrames=visible&&!moving?(same?evidence.stableFrames+1:1):0;
      evidence.frames.push({at:Date.now(),monotonicAt:performance.now(),box,visible,moving,stableFrames:evidence.stableFrames,ancestors});
      return evidence.stableFrames>=3;
    },null,{polling:'raf',timeout:1200});
    record.status='STABLE_RENDERED_GEOMETRY';
  }catch(error){record.status='NOT_STABLE';throw new Error('CONFIRM_GEOMETRY_NOT_STABLE '+String(error.message))}
  finally{record.observation=await page.evaluate(()=>globalThis.__offlineSimulationQA.confirmGeometry).catch(()=>null)}
}

function assertOfflineToastCoverage(result,profile){
  assert.ok(result.toastLayout?.some(sample=>sample.panel==='confirm'&&sample.stage.endsWith('-preview')),'Actual visible native order-preview feedback coverage is required');
  if(profile.width===390)assert.ok(result.toastLayout?.some(sample=>sample.panel==='sheet'&&(sample.stage.endsWith('-close-receipt')||sample.stage==='liquidation')),'Actual visible settlement/history feedback coverage is required');
}

async function offlineSimulationBrowserQA({baseline=false}={}){
  const {KGEN_POOL_REFERENCE_SOURCE}=await import('../runtime/public-market-quotes.mjs');
  const {createHash}=await import('node:crypto');
  const {execFileSync}=await import('node:child_process');
  const base=(process.env.K11520_BASE_URL||'http://127.0.0.1:4173').replace(/\/+$/,'');
  const baseURL=new URL(base);assert.ok(['http:','https:'].includes(baseURL.protocol));assert.equal(baseURL.search,'');assert.equal(baseURL.hash,'');
  const head=process.env.K11520_SOURCE_SHA||process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  assert.match(head,/^[0-9a-f]{40}$/i,'An exact source commit is required');
  const root='K線西遊記/temples/11520/',route=root+'game-5d.html';
  const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
  const sourceBytes=new Map();
  const files=['game-5d.html','runtime/game-5d-main.mjs','runtime/real-trading-order-intent.mjs','runtime/kgen-margin-runtime.mjs','runtime/public-market-quotes.mjs','runtime/mobile-signed-c-immersive-runtime.mjs','runtime/game-ui-product-fixes-v23.mjs'];
  const assets=files.map(relative=>{
    const path=root+relative,bytes=execFileSync('git',['show',head+':'+path]);sourceBytes.set(path,bytes);
    const hasLeadingUtf8Bom=bytes.length>=3&&bytes[0]===0xef&&bytes[1]===0xbb&&bytes[2]===0xbf;
    return {path,sha256:hash(bytes),sourceByteLength:bytes.length,hasLeadingUtf8Bom,
      ...(path===route&&hasLeadingUtf8Bom?{bomStrippedSha256:hash(bytes.subarray(3)),bomStrippedByteLength:bytes.length-3}:{})};
  });
  const expected=Object.fromEntries(assets.map(asset=>[asset.path,asset.sha256]));
  const out=`artifacts/11520-settlement-qa/${baseline?'offline-baseline':'offline-simulation'}`;
  await fs.mkdir(out,{recursive:true});
  const source='K11520_DETERMINISTIC_SIMULATION',results=[],failures=[];
  const profiles=[
    {width:360,height:740,quote:'WAIT',account:null,chain:'0x38'},
    {width:390,height:844,quote:'STALE',account:'0x1111111111111111111111111111111111111111',chain:'0x38'},
    {width:412,height:772,quote:'INVALID',account:'0x1111111111111111111111111111111111111111',chain:'0x1'},
    {width:432,height:856,quote:'WAIT',account:null,chain:'0x38'},
    {width:480,height:900,quote:'STALE',account:null,chain:'0x38'},
    {width:844,height:390,quote:'INVALID',account:null,chain:'0x38'},
  ];
  const cases=[['YZ','KX','BTCUSDT'],['XZ','KY','ETHUSDT'],['XY','KZ','BNBUSDT']].flatMap(([plane,axis,market])=>[1,-1].map(c=>({plane,axis,market,c,side:c>0?'LONG':'SHORT'})));
  const browser=await chromium.launch({headless:true});
  try{for(const profile of profiles){
    const name=`${profile.width}x${profile.height}-${profile.quote.toLowerCase()}`;
    const result={profile,head,baseline,simulatedBrowserClock:true,rawSourceChecks:[],sourceChecks:[],cases:[],screenshots:[],pageErrors:[],requestFailures:[],referenceResponses:[],blockedReadOnlyReferences:[],networkAuthorityAttempts:[]};results.push(result);
    const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},hasTouch:true,isMobile:true,serviceWorkers:'block'}),page=await context.newPage();
    page.setDefaultTimeout(12000);let stage='raw-source-proof',networkSequence=0;
    let seedLiquidationAnchor=!baseline&&profile.width===390;
    page.on('pageerror',error=>result.pageErrors.push(String(error)));
    page.on('requestfailed',request=>result.requestFailures.push({url:request.url(),error:request.failure()?.errorText}));
    const finishBrowserSource=attachM1PageSourceProof(page,{base,sourceSha:head,assets,createHash});
    const sourceProof=async()=>{
      const proof=await finishBrowserSource();result.sourceChecks=proof.observedBrowserResponses;
      result.browserSourceProof={...proof,coverageScope:'EXPLICIT_OFFLINE_SIMULATION_ENTRY_AND_EXECUTION_ASSETS_ONLY'};return proof;
    };
    await page.addInitScript(({account,chain})=>{
      const listeners=new Map(),fixture={account,chain,calls:[],native:[],feedback:[],emit(name,value){for(const fn of listeners.get(name)||[])fn(value)}};
      window.__offlineSimulationQA=fixture;
      document.addEventListener('DOMContentLoaded',()=>{
        const toast=document.querySelector('#toast');if(!toast)return;
        const capture=()=>{const text=toast.textContent||'';if(text&&fixture.feedback.at(-1)?.text!==text)fixture.feedback.push({text,at:Date.now()})};
        fixture.feedbackObserver=new MutationObserver(capture);fixture.feedbackObserver.observe(toast,{childList:true,subtree:true,characterData:true});capture();
      },{once:true});
      window.ethereum={on(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn)},removeListener:(name,fn)=>listeners.get(name)?.delete(fn),request:async({method})=>{
        fixture.calls.push({method,at:Date.now()});
        if(method==='eth_accounts')return fixture.account?[fixture.account]:[];
        if(method==='eth_chainId')return fixture.chain;
        if(method==='eth_getBalance')return '0x0';
        if(method==='eth_call')return '0x'+'0'.repeat(64);
        throw new Error('FORBIDDEN_OFFLINE_QA_PROVIDER_METHOD:'+method);
      }};
      for(const type of ['pointerdown','pointerup','click'])document.addEventListener(type,event=>{
        const target=event.target?.closest?.('#joy,#orderFire,#confirmOrder,#flat,#cancelOrder,#sheetClose,[data-sim-close],[data-sim-cancel]');
        if(target)fixture.native.push({type,id:target.id||target.dataset.simClose||target.dataset.simCancel,isTrusted:event.isTrusted,at:Date.now()});
      },true);
    },profile);
    // Only routed read-only fixtures are served. A single warm profile starts
    // below 10 USDT so its real deterministic fallback can cross a 1C adverse
    // distance of one USDT before proving the same receipt and account lifecycle.
    await page.route('https://data-api.binance.vision/**',request=>{
      const url=new URL(request.request().url()),market=url.searchParams.get('symbol');
      const prices={BTCUSDT:100000,ETHUSDT:seedLiquidationAnchor?4:4000,BNBUSDT:600};
      const fixtureState=seedLiquidationAnchor?'WARM_LIQUIDATION_ANCHOR':profile.quote;
      const age=seedLiquidationAnchor?500:fixtureState==='INVALID'?0:60000;
      const at=Date.now()-age;
      const payload=[{p:fixtureState==='INVALID'?'not-a-price':String(prices[market]),T:at,a:++networkSequence}];
      result.referenceResponses.push({market,state:fixtureState,status:fixtureState==='WAIT'?503:200,payload});
      return request.fulfill({status:fixtureState==='WAIT'?503:200,contentType:'application/json',body:JSON.stringify(fixtureState==='WAIT'?{code:'OFFLINE_QA_REFERENCE_UNAVAILABLE'}:payload)});
    });
    await page.route('**/docs/K11520_BSC_TESTNET_DEPLOYMENT_MANIFEST.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({status:'PREPARED_NOT_DEPLOYED',chainId:97,testOnly:true})}));
    await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',async r=>{
      const prefix='https://cdn.jsdelivr.net/npm/three@0.180.0/';
      let body=await fs.readFile('node_modules/three/'+r.request().url().slice(prefix.length),'utf8');
      body=body.replaceAll("from 'three'",`from '${prefix}build/three.module.js'`).replaceAll('from "three"',`from "${prefix}build/three.module.js"`);
      await r.fulfill({contentType:'text/javascript',body});
    });
    // Synthetic ethereum reads above must not conceal a second real RPC route.
    // Reject and retain every external write/RPC attempt rather than relying on
    // a zero eth_sendTransaction counter as proof of no Mainnet activity.
    await page.route('**/*',async r=>{
      const request=r.request(),url=new URL(request.url()),external=url.origin!==new URL(base).origin;
      const rpc=external&&/dataseed|llamarpc|ankr\.com|infura|alchemy|quicknode|(?:^|[./-])rpc(?:[./-]|$)/i.test(url.hostname+url.pathname);
      // The original assets/market sheet now includes a separate public
      // KGEN/WBNB reference. Fail its first read locally: never forward RPC,
      // never supply a price, and retain every other RPC/write as a failure.
      if(request.url()===new URL(KGEN_POOL_REFERENCE_SOURCE.rpc).href&&request.method()==='POST'){
        let payload;try{payload=request.postDataJSON()}catch{}
        if(payload?.jsonrpc==='2.0'&&Number.isSafeInteger(payload.id)&&payload.method==='eth_chainId'&&Array.isArray(payload.params)&&payload.params.length===0){
          result.blockedReadOnlyReferences.push({url:request.url(),method:payload.method,forwarded:false});
          await r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'OFFLINE_READONLY_REFERENCE_UNAVAILABLE'})});return;
        }
      }
      if(!['GET','HEAD','OPTIONS'].includes(request.method())||rpc){result.networkAuthorityAttempts.push({method:request.method(),origin:url.origin,path:url.pathname,rpc});await r.abort('blockedbyclient');return}
      await r.fallback();
    });
    page.on('websocket',socket=>result.networkAuthorityAttempts.push({method:'WEBSOCKET',url:socket.url()}));
    const snap=()=>page.evaluate(()=>__K11520_SIMULATION_EXCHANGE__.snapshot());
    const state=()=>page.evaluate(()=>{
      const text=selector=>document.querySelector(selector)?.textContent||'',s=globalThis.__K11520_SIGNED_C_IMMERSIVE__,button=document.querySelector('#confirmOrder');
      return {at:Date.now(),url:location.href,plane:globalThis.__K11520_3D_CONTROL__?.mode,axis:s?.activeAxis,c:s?.signedC,lots:s?.lots,canonicalSide:s?.canonicalSide,
        cInput:document.querySelector('#cNumericInput')?.value,lotsInput:document.querySelector('#lotsNumericInput')?.value,
        confirmOpen:document.querySelector('#confirm')?.classList.contains('open'),submitDisabled:button?.disabled,submitLabel:button?.textContent,
        preview:text('#simulationOrderPreview'),trigger:document.querySelector('#simulationTriggerPrice')?.value,toast:text('#toast'),feed:text('#feed'),
        wallet:{address:text('#wAddr'),chain:text('#wChain'),message:text('#walletMsg'),mode:text('#executionMode'),modeDisabled:document.querySelector('#executionMode')?.disabled},
        publicReference:globalThis.__K11520_FREE_ORACLE__||{},marketReference:globalThis.__K11520_MARKET_K__||null,
        execution:globalThis.__K11520_EXECUTION__?.snapshot(),simulation:globalThis.__K11520_SIMULATION_EXCHANGE__?.snapshot(),
        providerCalls:globalThis.__offlineSimulationQA.calls,native:globalThis.__offlineSimulationQA.native,feedback:globalThis.__offlineSimulationQA.feedback};
    });
    const shot=async label=>{
      let validationError=null;
      try{if(!baseline){
        const feedback=await page.evaluate(()=>{
          const toast=document.getElementById('toast'),confirm=document.getElementById('confirm'),sheet=document.getElementById('sheet'),body=document.getElementById('sheetBody');
          const panel=confirm.classList.contains('open')?confirm:sheet.classList.contains('open')&&['orders','positions','history'].includes(body.dataset.simOrgan)?sheet:null;
          if(!panel||!toast.classList.contains('show'))return null;
          const header=panel.querySelector('.sheetHead'),rect=element=>{const r=element.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
          return {panel:panel.id,text:toast.textContent,context:toast.dataset.panelContext,inHeader:toast.parentElement===header,role:toast.getAttribute('role'),live:toast.getAttribute('aria-live'),position:getComputedStyle(toast).position,toast:rect(toast),header:rect(header),title:rect(header.querySelector('h2')),close:rect(header.querySelector('.close'))};
        });
        if(feedback){
          (result.toastLayout??=[]).push({stage:label,...feedback});assert.equal(feedback.context,feedback.panel);assert.equal(feedback.inHeader,true);assert.equal(feedback.position,'static');assert.equal(feedback.role,'status');assert.equal(feedback.live,'polite');
          assert.ok(feedback.toast.width>0&&feedback.toast.height>0&&feedback.toast.x>=0&&feedback.toast.right<=profile.width+1&&feedback.toast.y>=0&&feedback.toast.bottom<=profile.height+1,'Visible panel feedback must remain inside the viewport');
          assert.ok(feedback.toast.y>=Math.max(feedback.title.bottom,feedback.close.bottom)-1&&feedback.toast.bottom<=feedback.header.bottom+1,'Feedback must have its own header row, never overlay title or body');
        }
      }}catch(error){validationError=error}
      const file=`${name}-${label}.png`;
      try{await page.screenshot({path:`${out}/${file}`,fullPage:true});result.screenshots.push(file)}
      catch(error){(result.screenshotErrors??=[]).push({file,error:String(error)});if(!validationError)throw error}
      if(validationError)throw validationError;
    };
    const usable=async selector=>{
      if(['#confirmOrder','#cancelOrder'].includes(selector)){const record={stage,selector};(result.controlReadiness??=[]).push(record);await waitForOfflineConfirmationGeometry(page,record)}
      const box=await page.locator(selector).evaluate(element=>{const r=element.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,hit:hit===element||element.contains(hit),blocker:hit?.id||hit?.tagName}});
      assert.ok(box.width>0&&box.height>0&&box.x>=0&&box.y>=0&&box.right<=profile.width+1&&box.bottom<=profile.height+1,`${selector} clipped: ${JSON.stringify(box)}`);
      assert.ok(box.hit,`${selector} pointer blocked: ${JSON.stringify(box)}`);return box;
    };
    const waitForSimulationBoot=async()=>{
      try{await page.waitForFunction(()=>globalThis.__K11520_SIMULATION_EXCHANGE__&&globalThis.__K11520_SIGNED_C_IMMERSIVE__?.ready&&globalThis.__K11520_3D_CONTROL__,null,{timeout:12000})}
      catch(error){const observed=await state().catch(()=>null);throw new Error('SIMULATION_BOOT_NOT_READY '+JSON.stringify({adapterPresent:!!observed?.simulation,executionMode:observed?.execution?.mode,axis:observed?.axis,url:observed?.url,cause:String(error.message)}))}
    };
    const game=async()=>{
      // A native close may already be finishing its CSS transition. Never
      // click a second time merely because isVisible saw that earlier frame.
      if(await page.locator('#confirm').evaluate(e=>e.classList.contains('open'))){await usable('#cancelOrder');await page.locator('#cancelOrder').click();}
      await page.locator('#confirm').waitFor({state:'hidden',timeout:12000});
      if(await page.locator('#sheet').evaluate(e=>e.classList.contains('open')))await page.locator('#sheetClose').click();
      await page.locator('#sheet').waitFor({state:'hidden',timeout:12000});
      if(!await page.locator('#walletPanel').evaluate(e=>e.classList.contains('collapsed')))await page.locator('#walletToggle').click();
      if(await page.locator('html').evaluate(e=>e.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
    };
    const organ=async name=>{
      await game();await page.locator('#k11520UtilityMaster').click();
      if(!await page.locator(`#dock [data-organ="${name}"]`).isVisible())await page.locator('#dockToggle').click();
      await page.locator(`#dock [data-organ="${name}"]`).click();await page.locator('#sheet.open').waitFor();
    };
    const select=async ({plane,axis,c})=>{
      await game();for(let i=0;i<3&&await page.evaluate(()=>__K11520_3D_CONTROL__.mode)!==plane;i++){
        const previous=await page.evaluate(()=>__K11520_3D_CONTROL__.mode);await showRetainedControls(page);await page.locator('#joy').tap();
        await page.waitForFunction(previous=>__K11520_3D_CONTROL__.mode!==previous,previous);
      }
      await page.waitForFunction(axis=>__K11520_SIGNED_C_IMMERSIVE__.activeAxis===axis,axis);
      await showRetainedControls(page);await page.locator('#cNumericInput').fill(String(c));await page.locator('#cNumericInput').press('Enter');
      await page.locator('#lotsNumericInput').fill('1');await page.locator('#lotsNumericInput').press('Enter');
      await page.waitForFunction(({axis,c})=>__K11520_SIGNED_C_IMMERSIVE__.activeAxis===axis&&__K11520_SIGNED_C_IMMERSIVE__.signedC===c&&__K11520_SIGNED_C_IMMERSIVE__.lots===1,{axis,c});
    };
    const assertNoAuthority=s=>{
      assert.equal(s.execution.mode,'SIMULATION_WALLET','Offline simulation must not switch execution authority');
      assert.equal(s.wallet.modeDisabled,true,'Unverified REAL/Testnet selection stays disabled');
      assert.ok(s.providerCalls.every(call=>['eth_accounts','eth_chainId','eth_getBalance','eth_call'].includes(call.method)),'No connect, signer, chain switch or TX request is permitted');
      assert.deepEqual(result.networkAuthorityAttempts,[],'No unmocked RPC, network write or wallet websocket may be attempted');
      assert.ok(result.blockedReadOnlyReferences.every(row=>row.url===new URL(KGEN_POOL_REFERENCE_SOURCE.rpc).href&&row.method==='eth_chainId'&&row.forwarded===false),'only the exact original public-reference first read is failed locally; no real RPC or synthetic price');
      for(const observation of Object.values(s.publicReference))assert.notEqual(observation.source,source,'Simulation must never become public/REAL provenance');
    };
    const verifyRawSource=async phase=>{
      // APIRequestContext returns raw HTTP bytes. This mandatory exact gate
      // precedes navigation; it cannot use the browser's BOM representation
      // exception and accepts no redirect, changed origin, path or length.
      for(const asset of assets){
        const url=new URL(base+'/'+encodeURI(asset.path)).href,response=await context.request.get(url,{maxRedirects:0});
        const bytes=await response.body(),actual=hash(bytes),record={phase,path:asset.path,url:response.url(),status:response.status(),expectedHash:asset.sha256,expectedLength:asset.sourceByteLength,actualHash:actual,actualLength:bytes.length,bytesEqual:bytes.equals(sourceBytes.get(asset.path))};
        result.rawSourceChecks.push(record);assert.equal(response.url(),url,'Raw source URL/origin/basepath changed');assert.equal(response.status(),200,'Raw source HTTP status');
        assert.equal(record.bytesEqual,true,'Raw source bytes mismatch: '+asset.path);assert.equal(bytes.length,asset.sourceByteLength,'Raw source byte length mismatch: '+asset.path);assert.equal(actual,asset.sha256,'Raw source hash mismatch: '+asset.path);record.match='EXACT_SOURCE_BYTES';
      }
    };
    try{
      await verifyRawSource('BEFORE_BROWSER');
      stage='boot';
      await page.clock.install({time:new Date()});
      await page.goto(base+'/'+encodeURI(route),{waitUntil:'domcontentloaded'});
      await waitForSimulationBoot();
      if(await page.locator('#enter11520').isVisible())await page.locator('#enter11520').click();
      await page.locator('#intro11520').waitFor({state:'hidden'});
      await page.locator('#charState').filter({hasText:/READY|FALLBACK/}).waitFor({state:'attached',timeout:45000});
      if(seedLiquidationAnchor){
        stage='warm-liquidation-anchor';
        await page.waitForFunction(account=>{
          const quote=globalThis.__K11520_SIMULATION_EXCHANGE__?.snapshot().observations.ETHUSDT;
          return document.querySelector('#wAddr')?.textContent===account&&quote?.price===4&&quote.source==='BINANCE_PUBLIC_MARKET_DATA_ONLY';
        },profile.account);
        result.liquidationSeed=(await snap()).observations.ETHUSDT;
        seedLiquidationAnchor=false;
        await page.clock.fastForward(16000);
        await page.waitForFunction(source=>{
          const quote=globalThis.__K11520_SIMULATION_EXCHANGE__?.snapshot().observations.ETHUSDT;
          return quote?.source===source&&quote.simulationAnchorPrice===4;
        },source);
      }
      if(!baseline)await page.waitForFunction(source=>['BTCUSDT','ETHUSDT','BNBUSDT'].every(market=>__K11520_SIMULATION_EXCHANGE__.snapshot().observations[market]?.source===source),source);
      await sourceProof();
      await shot('boot');result.boot=await state();assertNoAuthority(result.boot);
      if(!baseline&&profile.width===390){
        stage='input-validation';await select({...cases[0],c:0});const count=(await snap()).orders.length;await page.locator('#orderFire').click();
        await page.waitForTimeout(150);const neutral=await state();assert.ok(!neutral.confirmOpen||neutral.submitDisabled,'0C must remain blocked');assert.equal(neutral.simulation.orders.length,count);
        await select({...cases[0],c:5});await page.locator('#orderFire').click();await page.locator('#confirm.open').waitFor();
        await page.waitForFunction(()=>document.querySelector('#simulationOrderPreview').textContent.includes('V1_HIGH_SPEED_PRODUCTION_LOCKED'));
        const highC=await state();assert.equal(highC.submitDisabled,true);await shot('high-c-blocked');
        await select(cases[0]);await page.locator('#lotsNumericInput').fill('-5');await page.locator('#lotsNumericInput').press('Enter');
        await page.waitForFunction(()=>__K11520_SIGNED_C_IMMERSIVE__.lots===1&&document.querySelector('#lotsNumericInput').value==='1');
        await page.locator('#orderFire').click();await page.locator('#confirm.open').waitFor();await page.locator('#simulationTriggerPrice').fill('0');
        await page.waitForFunction(()=>document.querySelector('#confirmOrder').disabled&&/TRIGGER_PRICE_MUST_BE_POSITIVE/.test(document.querySelector('#simulationOrderPreview').textContent));
        result.validation={neutral,highC,invalidTrigger:await state()};await shot('invalid-trigger');await game();
      }
      for(const testCase of cases){
        stage=`${testCase.market}-${testCase.side}`;const evidence={...testCase};result.cases.push(evidence);
        await select(testCase);evidence.before=await state();evidence.orderHit=await usable('#orderFire');
        const count=evidence.before.simulation.orders.length;
        await page.locator('#orderFire').click();
        if(baseline){
          await page.waitForTimeout(350);evidence.after=await state();await shot(stage+'-blocked');
          assert.equal(evidence.after.simulation.orders.length,count,'Baseline probe must not create a position/order');
          assert.ok(!evidence.after.confirmOpen||evidence.after.submitDisabled,'Pinned baseline unexpectedly accepts the offline preview');
          evidence.clickFeedback=evidence.after.feedback.slice(evidence.before.feedback.length);
          assert.match(evidence.clickFeedback.map(event=>event.text).join(' ')+' '+evidence.after.preview,/ORACLE_STALE|STALE_PRICE|行情未就緒|PRICE_MUST_BE_POSITIVE/,'Capture the actual old validation blocker before deferred route feedback replaces it');
          evidence.result='BASELINE_REPRODUCED';assertNoAuthority(evidence.after);continue;
        }
        await page.locator('#confirm.open').waitFor();
        const anchor=(await snap()).observations[testCase.market]?.simulationAnchorPrice;
        assert.ok(Number.isFinite(anchor)&&anchor>0,'The observed simulation source must expose its deterministic anchor');
        const triggerPrice=anchor+.125;
        await page.locator('#simulationTriggerPrice').fill(String(triggerPrice));
        await page.waitForFunction(()=>!document.querySelector('#confirmOrder').disabled);
        evidence.preview=await state();assert.match(evidence.preview.preview,new RegExp(source));assertNoAuthority(evidence.preview);
        evidence.submitHit=await usable('#confirmOrder');await shot(stage+'-preview');
        const clickCount=evidence.preview.native.filter(event=>event.id==='confirmOrder'&&event.type==='click').length;
        evidence.submitActionHit=await usable('#confirmOrder');await page.locator('#confirmOrder').click();await page.locator('#confirm').waitFor({state:'hidden'});
        await page.waitForFunction(count=>__K11520_SIMULATION_EXCHANGE__.snapshot().orders.length===count+1,count);
        evidence.submitted=await state();const order=evidence.submitted.simulation.orders.at(-1);
        assert.equal(order.market,testCase.market);assert.equal(order.axis,testCase.axis);assert.equal(order.c,testCase.c);assert.equal(order.lots,1);
        assert.equal(order.side,testCase.side);assert.equal(order.priceSource,source);assert.equal(order.triggerPrice,triggerPrice);
        assert.equal(evidence.submitted.native.filter(event=>event.id==='confirmOrder'&&event.type==='click'&&event.isTrusted).length,clickCount+1,'One trusted native Submit must reach the application');
        assert.ok(['PENDING','FILLED'].includes(order.status),'Submission must create an actual lifecycle record');
        // One full 128-second source cycle is the domain bound, rather than an
        // arbitrary retry count. Advance only the browser clock; the app's own
        // timer, observe guard, trigger crossing and settlement remain in use.
        for(let elapsed=0;elapsed<=128000&&(await snap()).orders.find(o=>o.orderId===order.orderId)?.status==='PENDING';elapsed+=4000)await page.clock.fastForward(4000);
        let book=await snap(),filled=book.orders.find(o=>o.orderId===order.orderId);
        assert.equal(filled.status,'FILLED','The actual deterministic source tick must fill the submitted trigger');
        const position=book.positions.find(p=>p.positionId===filled.positionId);assert.equal(position.status,'OPEN');
        assert.equal(book.receipts.filter(r=>r.orderId===order.orderId&&r.kind==='FILL').length,1,'Fill is exactly once');
        assert.equal(book.wallet.lockedMargin,1);evidence.filled=await state();await shot(stage+'-filled');
        await page.clock.fastForward(4000);book=await snap();const marked=book.positions.find(p=>p.positionId===position.positionId);
        assert.equal(marked.status,'OPEN');
        const entryUnit=10**Number(position.entry.toExponential().split('e')[1]);
        const expectedPnl=(marked.mark-position.entry)/entryUnit*marked.c*marked.lots;
        assert.ok(Math.abs(book.wallet.unrealizedPnl-expectedPnl)<1e-7,'PnL must follow signed C and real simulation mark');
        evidence.marked=await state();
        if(testCase===cases[0]){await organ('positions');assert.match(await page.locator('#sheetBody').innerText(),/UNREALIZED PNL/);await shot(stage+'-position-pnl')}
        await game();await usable('#flat');await page.locator('#flat').click();
        await page.waitForFunction(id=>__K11520_SIMULATION_EXCHANGE__.snapshot().positions.find(p=>p.positionId===id)?.status==='CLOSED',position.positionId);
        evidence.closed=await state();book=evidence.closed.simulation;assert.equal(book.wallet.lockedMargin,0);
        const receipt=book.receipts.find(r=>r.positionId===position.positionId&&r.kind==='SETTLEMENT');
        assert.equal(receipt.status,'CLOSED');assert.equal(receipt.priceSource,source);assert.ok(Number.isFinite(receipt.realizedPnl));
        assert.equal(receipt.entryPrice,position.entry);
        assert.ok(Math.abs(receipt.rawPnl-(receipt.settlementPrice-receipt.entryPrice)/entryUnit*testCase.c)<1e-7,'settlement receipt must preserve the opened price floor and signed C');
        assert.equal(book.receipts.filter(r=>r.positionId===position.positionId&&r.kind==='SETTLEMENT').length,1);
        if(testCase===cases[0]){await organ('history');await page.locator(`[data-receipt="${receipt.receiptId}"] > summary`).click();assert.match(await page.locator('#sheetBody').innerText(),new RegExp(source));await shot(stage+'-close-receipt')}
        assertNoAuthority(evidence.closed);evidence.result='FUNCTIONAL_PASS_VISUAL_REVIEW_REQUIRED';
      }
      if(!baseline&&profile.width===390){
        stage='pending-cancel';await select(cases[0]);await page.locator('#orderFire').click();await page.locator('#confirm.open').waitFor();
        const anchor=(await snap()).observations.BTCUSDT.simulationAnchorPrice;await page.locator('#simulationTriggerPrice').fill(String(anchor+10));
        await page.waitForFunction(()=>!document.querySelector('#confirmOrder').disabled);await usable('#confirmOrder');await page.locator('#confirmOrder').click();await page.locator('#confirm').waitFor({state:'hidden'});
        const pending=(await snap()).orders.at(-1);await page.clock.fastForward(4000);assert.equal((await snap()).orders.at(-1).status,'PENDING');
        await page.locator(`[data-sim-cancel="${pending.orderId}"]`).click();await page.waitForFunction(id=>__K11520_SIMULATION_EXCHANGE__.snapshot().orders.find(o=>o.orderId===id)?.status==='CANCELLED',pending.orderId);
        result.cancel=await state();assert.equal(result.cancel.simulation.receipts.filter(r=>r.orderId===pending.orderId).length,0);await shot('pending-cancelled');
        stage='liquidation';await select(cases.find(c=>c.market==='ETHUSDT'&&c.c===1));await page.locator('#orderFire').click();await page.locator('#confirm.open').waitFor();
        const ethAnchor=(await snap()).observations.ETHUSDT.simulationAnchorPrice;
        assert.equal(ethAnchor,4,'the warmed deterministic price can reach the 1C liquidation threshold');
        await page.locator('#simulationTriggerPrice').fill(String(ethAnchor+.125));
        await page.waitForFunction(()=>!document.querySelector('#confirmOrder').disabled);await usable('#confirmOrder');await page.locator('#confirmOrder').click();await page.locator('#confirm').waitFor({state:'hidden'});
        const liquidationOrder=(await snap()).orders.at(-1);
        for(let elapsed=0;elapsed<=128000&&(await snap()).orders.find(o=>o.orderId===liquidationOrder.orderId).status==='PENDING';elapsed+=4000)await page.clock.fastForward(4000);
        const liquidationPosition=(await snap()).positions.find(p=>p.orderId===liquidationOrder.orderId);assert.equal(liquidationPosition.status,'OPEN');result.beforeLiquidation=await state();
        for(let elapsed=0;elapsed<=128000&&(await snap()).positions.find(p=>p.positionId===liquidationPosition.positionId).status==='OPEN';elapsed+=4000)await page.clock.fastForward(4000);
        result.liquidation=await state();const liquidationReceipt=result.liquidation.simulation.receipts.find(r=>r.positionId===liquidationPosition.positionId&&r.kind==='SETTLEMENT');
        assert.equal(liquidationReceipt?.status,'LIQUIDATED');assert.equal(liquidationReceipt.priceSource,source);assert.equal(liquidationReceipt.realizedPnl,-1);assert.equal(liquidationReceipt.marginAfter,0);assert.equal(result.liquidation.simulation.wallet.lockedMargin,0);
        assert.equal(liquidationReceipt.liquidationTrigger,liquidationPosition.entry-1);
        await organ('history');await page.locator(`[data-receipt="${liquidationReceipt.receiptId}"] > summary`).click();await shot('liquidation');await page.clock.fastForward(8000);assert.equal((await snap()).receipts.filter(r=>r.positionId===liquidationPosition.positionId&&r.kind==='SETTLEMENT').length,1,'Liquidation must not replay');
        stage='account-isolation';const owned=await snap();
        await page.evaluate(()=>{__offlineSimulationQA.account='0x2222222222222222222222222222222222222222';__offlineSimulationQA.emit('accountsChanged',[__offlineSimulationQA.account])});
        await page.waitForFunction(()=>__K11520_SIMULATION_EXCHANGE__.snapshot().receipts.length===0);result.otherAccount=await state();assert.equal(result.otherAccount.simulation.orders.length,0);assertNoAuthority(result.otherAccount);
        await page.evaluate(()=>{__offlineSimulationQA.account='0x1111111111111111111111111111111111111111';__offlineSimulationQA.emit('accountsChanged',[__offlineSimulationQA.account])});
        await page.waitForFunction(length=>__K11520_SIMULATION_EXCHANGE__.snapshot().receipts.length===length,owned.receipts.length);result.ownerRestored=await state();assert.deepEqual(result.ownerRestored.simulation.receipts,owned.receipts);await shot('owner-restored');
      }
      if(!baseline){
        stage='reload-recovery';const before=await snap();await page.reload({waitUntil:'domcontentloaded'});
        await waitForSimulationBoot();
        await page.waitForFunction(length=>globalThis.__K11520_SIMULATION_EXCHANGE__?.snapshot().receipts.length===length,before.receipts.length,{timeout:12000});
        await page.locator('#intro11520').waitFor({state:'hidden'});await page.locator('#charState').filter({hasText:/READY|FALLBACK/}).waitFor({state:'attached',timeout:45000});
        result.reload=await state();assert.deepEqual(result.reload.simulation.orders,before.orders);assert.deepEqual(result.reload.simulation.receipts,before.receipts);assertNoAuthority(result.reload);await shot('reload-recovery');
      }
      if(!baseline)assertOfflineToastCoverage(result,profile);
      await sourceProof();
      await verifyRawSource('AFTER_BROWSER');
      assert.deepEqual(result.pageErrors,[]);result.status=baseline?'BASELINE_REPRODUCED':'FUNCTIONAL_PASS_VISUAL_REVIEW_REQUIRED';
    }catch(error){result.status='FAIL';result.stage=stage;result.error=String(error);result.stack=error.stack;failures.push(`${name}/${stage}: ${error.message}`);result.failureState=await state().catch(()=>null);await shot('failure').catch(()=>{})}
    finally{result.browserSourceObservedAtExit={...finishBrowserSource.snapshot(),coverageScope:'EXPLICIT_OFFLINE_SIMULATION_ENTRY_AND_EXECUTION_ASSETS_ONLY'};result.lastState=await state().catch(()=>null);await page.evaluate(()=>globalThis.__offlineSimulationQA?.feedbackObserver?.disconnect()).catch(()=>{});await fs.writeFile(`${out}/${name}-result.json`,JSON.stringify(result,null,2));await context.close()}
  }}finally{
    await browser.close();await fs.writeFile(`${out}/report.json`,JSON.stringify({head,base,baseline,harnessSha256:hash(await fs.readFile(new URL(import.meta.url))),capturedAt:new Date().toISOString(),expectedSourceHashes:expected,expectedSourceAssets:assets,
      simulatedBrowserClock:true,clockEvidence:'PLAYWRIGHT_VIRTUAL_BROWSER_TIME_ADVANCES_REAL_APPLICATION_TIMERS; NOT_REAL_ELAPSED_MOVEMENT_OR_MARKET_TIME',
      fixtureScope:'EXTERNAL_READ_ONLY_REFERENCE_AND_SYNTHETIC_EIP1193_ONLY',callChain:'native #orderFire → openOrder → orderInput → simulation adapter preview → native #confirmOrder → executionAction → adapter.submit → placeSimulationOrder → real app tick → observeSimulationPrice',
      functional:failures.length?'FAIL':baseline?'BASELINE_REPRODUCED':'PASS',visual:'REQUIRES_DIRECT_IMAGE_INSPECTION',results,failures},null,2));
  }
  assert.deepEqual(failures,[],'Offline simulation real-entry failures; inspect source-bound JSON and screenshots');
  console.log(baseline?'BASELINE_REPRODUCED: offline native Submit blocked; this is not browser product PASS':'FUNCTIONAL_PASS: offline six-market/direction Submit at six sizes; VISUAL_QA requires direct screenshot inspection');
}

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
        await game();await showRetainedControls(page);await page.locator('#cNumericInput').fill('1');await page.locator('#cNumericInput').press('Enter');await page.locator('#orderFire').click();
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
      stage='order';await game();await showRetainedControls(page);await page.locator('#cNumericInput').fill('100');await page.locator('#cNumericInput').press('Enter');await page.locator('#lotsNumericInput').fill('100');await page.locator('#lotsNumericInput').press('Enter');
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
      for(let i=0;i<3&&(await page.evaluate(()=>__K11520_TRADE_AXIS_API__.current()))!=='KX';i++){await showRetainedControls(page);await page.locator('#joy').tap();await page.waitForTimeout(200)}
      await showRetainedControls(page);await page.locator('#cNumericInput').fill('100');await page.locator('#cNumericInput').press('Enter');await page.locator('#lotsNumericInput').fill('100');await page.locator('#lotsNumericInput').press('Enter');
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
  const cap=Math.min(32,Math.max(1,Number.isSafeInteger(limit)?limit:32)),recent=[],failures=[],nonFallbackFailures=[];
  let sequence=0,failureCount=0,droppedFailures=0,nonFallbackFailureCount=0,droppedNonFallbackFailures=0,firstNonFallbackFailure=null,lastStarted=null,lastCompleted=null;
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
      if(!existingLogFallback){nonFallbackFailureCount++;firstNonFallbackFailure??=lastCompleted;nonFallbackFailures.push(lastCompleted);if(nonFallbackFailures.length>cap){nonFallbackFailures.shift();droppedNonFallbackFailures++}}
      throw error; // Preserve original rejection; the caller owns log fallback.
    }
  };
  return Object.freeze({run,snapshot:()=>({failureCount,droppedFailures,nonFallbackFailureCount,droppedNonFallbackFailures,firstNonFallbackFailure,nonFallbackFailures:[...nonFallbackFailures],lastStarted,lastCompleted,recent:[...recent],failures:[...failures]})});
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
  const expected=new Map(assets.map(x=>[x.path,x])),seen=new Map(),pending=new Set(),errors=[],observed=[];
  const snapshot=()=>({sourceSha,status:'NOT_VERIFIED',coverageScope:'EXPLICIT_M1_WALLET_AND_HUD_ASSETS_ONLY',wholeModuleGraphVerified:false,observedBrowserResponses:[...observed],errors:[...errors]});
  page.on('response',response=>{
    const url=new URL(response.url()),path=decodeURIComponent(url.pathname).slice(prefix.length);
    if(url.origin!==origin||!decodeURIComponent(url.pathname).startsWith(prefix)||!expected.has(path))return;
    const source=expected.get(path),record={path,url:url.href,query:url.search,fromServiceWorker:null,
      rawExpectedHash:source.sha256,rawExpectedLength:source.sourceByteLength,
      expectedBrowserRepresentationHash:source.bomStrippedSha256??source.sha256,
      httpStatus:null,actualObservedHash:null,actualObservedLength:null,matchKind:'NOT_VERIFIED'};
    observed.push(record);
    const job=(async()=>{try{
      record.fromServiceWorker=response.fromServiceWorker();
      record.httpStatus=response.status();assert.equal(record.httpStatus,200,'PUBLIC_BROWSER_ASSET_HTTP_ERROR '+path);
      const bytes=await response.body(),sha256=createHash('sha256').update(bytes).digest('hex');
      record.actualObservedHash=sha256;record.actualObservedLength=bytes.length;
      // Raw HTTP equality remains a separate mandatory gate. DevTools may
      // expose text without its one leading UTF-8 BOM; accept only that exact
      // source-derived representation, never whitespace or Unicode changes.
      if(sha256===source.sha256&&bytes.length===source.sourceByteLength)record.matchKind='EXACT_SOURCE_BYTES';
      else if(path==='K線西遊記/temples/11520/game-5d.html'&&source.hasLeadingUtf8Bom===true&&source.bomStrippedByteLength===source.sourceByteLength-3&&sha256===source.bomStrippedSha256&&bytes.length===source.bomStrippedByteLength)record.matchKind='SOURCE_MINUS_LEADING_UTF8_BOM';
      assert.notEqual(record.matchKind,'NOT_VERIFIED','PUBLIC_BROWSER_ASSET_SOURCE_MISMATCH '+path);
      seen.set(path,{...record,sha256});
    }catch(error){errors.push(String(error.message))}})();
    pending.add(job);void job.finally(()=>pending.delete(job));
  });
  const finish=async()=>{
    while(pending.size)await Promise.all([...pending]);assert.deepEqual(errors,[],'actual public browser assets must match checkout');
    for(const path of expected.keys())assert.ok(seen.has(path),'PUBLIC_BROWSER_ASSET_NOT_OBSERVED '+path);
    return {...snapshot(),status:'PASS',actualBrowserResponses:[...seen.values()]};
  };
  finish.snapshot=snapshot;return finish;
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
      // Settings is a late bootstrap import and owns wallet visibility. Wait
      // for that real owner before asserting the no-provider UI is visible.
      await absent.waitForFunction(()=>globalThis.__K11520_UI_SETTINGS__,null,{timeout:15000});
      await absent.waitForFunction(()=>document.querySelector('#walletProviderHelp')?.hidden===false);
      if(!await absent.locator('html').evaluate(e=>e.classList.contains('k11520UtilitiesOpen')))await absent.locator('#k11520UtilityMaster').click();
      if(await absent.locator('#walletPanel').evaluate(e=>e.classList.contains('collapsed')))await absent.locator('#walletToggle').click();
      assert.equal(await absent.locator('#walletProviderHelp').isVisible(),true);
      assert.equal(await absent.locator('#wAddr').textContent(),'DISCONNECTED');
      await absent.waitForFunction(()=>document.querySelector('#walletM1ReadOnly')?.disabled===false&&document.querySelector('#k11520RealTradePreflight'));
      await absent.screenshot({path:`${out}/390x844-no-injected-wallet.png`});
      if(finishAbsentPublicSource)await fs.writeFile(out+'/no-provider-source.json',JSON.stringify(await finishAbsentPublicSource(),null,2));
    }catch(error){await absent.screenshot({path:`${out}/390x844-no-provider-FAILURE.png`});await fs.writeFile(`${out}/no-provider-FAILURE.json`,JSON.stringify({message:String(error.message),publicBrowserSource:finishAbsentPublicSource?.snapshot()??null},null,2));throw error}finally{await absent.close()}
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
      let walletUiBaseline;const walletForegroundEvidence=[];
      const walletUiPreferences=()=>page.evaluate(()=>{const ui=globalThis.__K11520_UI_SETTINGS__;return {controlsOpen:ui.controlsOpen,params:ui.state.params,allOn:ui.allOn}});
      const controlCenter=selector=>page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect(),target=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {rect:{x:r.x,y:r.y,width:r.width,height:r.height},hit:!!target&&el.contains(target),targetId:target?.id||'',hidden:el.hidden}});
      const verifyWalletForeground=async label=>{
        assert.deepEqual(await walletUiPreferences(),walletUiBaseline.preferences,'Wallet foreground must preserve controls/params preferences');
        assert.equal(await page.locator('#k11520ControlsClose').isVisible(),false,'background ControlsClose must not cover the foreground Wallet');
        const close=await controlCenter('#k11520ControlsClose');assert.equal(close.hit,false,'background ControlsClose must not receive a pointer');
        assert.equal(close.hidden,!walletUiBaseline.preferences.controlsOpen,'Wallet suppression must not change ControlsClose hidden preference');
        const controls={};
        for(const selector of ['#walletConnect','#walletRefresh']){
          await page.locator(selector).scrollIntoViewIfNeeded();const center=await controlCenter(selector);
          assert.equal(center.hit,true,selector+' center must receive the actual pointer in the foreground Wallet');controls[selector]=center;
        }
        walletForegroundEvidence.push({label,preferences:await walletUiPreferences(),controlsClose:close,controls});
      };
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
        await verifyWalletForeground('M1_'+stage);
        return {account:expected,block:s.block,blockHash:s.blockHash,status:s.status,nativeWei:s.wallet.testBnbBalanceWei,testTokenWei:s.wallet.testTokenBalanceWei,historyStatus:s.historyStatus,positionsStatus:s.positionsStatus,rpcReadCount:s.rpcReadCount,context:s.deploymentContext};
      };
      try{
        await boot(page);await page.waitForFunction(()=>globalThis.__K11520_UI_SETTINGS__?.state);walletUiBaseline={preferences:await walletUiPreferences(),controlsCloseVisible:await page.locator('#k11520ControlsClose').isVisible()};
        await wallet();await page.locator('#walletConnect').click();await page.waitForFunction(()=>!document.querySelector('#walletM1ReadOnly').disabled);
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
        const historyRequiresIndexer=legacy.block-manifest.deploymentBlock>2000000;
        if(historyRequiresIndexer){
          assert.equal(legacy.status,'LEGACY_PRINCIPAL_VERIFIED');assert.equal(legacy.readScope,'LEGACY_PRINCIPAL_ONLY');
          assert.equal(legacy.balanceStatus,'VERIFIED');assert.equal(legacy.historyStatus,'INDEXER_REQUIRED');
          for(const field of ['ordersStatus','positionsStatus','pnlStatus','claimsStatus','oracleStatus'])assert.equal(legacy[field],'UNKNOWN',field+' must not claim full recovery');
          for(const field of ['unrealizedPnl','realizedPnl','equity','claimable'])assert.equal(legacy.wallet[field],null,field+' cannot be fabricated as0');
          assert.match(await page.locator('#testnetGate').textContent(),/部位與歷史尚未恢復/);
          assert.ok(await page.locator('[data-legacy-principal-only]').count()>0,'verified principal must retain an explicit limited-history notice');
        }
        const legacyExitEvidence={account:state.account,block:legacy.block,context:legacy.deploymentContext,principalWei:legacy.wallet.principalWei,availableWei:legacy.wallet.availableWei,readScope:legacy.readScope??null,historyStatus:legacy.historyStatus??null,fullHistoryVerified:legacy.historyStatus==='VERIFIED'};
        assert.equal(await page.evaluate(()=>sessionStorage.getItem('k11520.execution-mode')),'BSC_TESTNET');await verifyWalletForeground('RETURN_LEGACY');await page.locator('#walletPanel').evaluate(el=>{el.scrollTop=0});await shot('legacy-exit-preserved');
        const closeHit=await page.locator('#walletToggle').evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))});assert.equal(closeHit,true,'wallet close is reachable');
        await page.locator('#walletToggle').click();await page.waitForFunction(()=>document.querySelector('#walletPanel').classList.contains('collapsed')&&getComputedStyle(document.querySelector('#dock')).display!=='none');
        assert.deepEqual(await walletUiPreferences(),walletUiBaseline.preferences,'Wallet close must preserve controls/params preferences');
        assert.equal(await page.locator('#k11520ControlsClose').isVisible(),walletUiBaseline.controlsCloseVisible,'Wallet close must restore the original ControlsClose visibility');
        for(const selector of ['#dock','#aiChatButton','#chatHandle','#bgmButton','#backpackButton'])assert.equal(await page.locator(selector).isVisible(),true,'wallet close restores peer '+selector);await shot('wallet-close-restores-tray');
        const publicBrowserSource=finishPublicSource?await finishPublicSource():null;
        assert.deepEqual(forbidden,[]);assert.deepEqual(errors,[]);results.push({rpcDiagnostics:rpcDiagnostics.snapshot(),publicBrowserSource,viewport:[width,height],functional:'PASS',visual:'REQUIRES_DIRECT_IMAGE_INSPECTION',mode:'ACTUAL_BSC97_READS_SYNTHETIC_EIP1193',humanMetaMask:'NOT_VERIFIED',signedTransactions:0,legacyPreferencePreserved:true,legacyExitEvidence,walletCloseRestoresPeers:true,walletUiBaseline,walletForegroundEvidence,phaseCounts,legacyHistoryLogFallbacks:logFallbacks,m1HistoryRequests:0,evidence,methods:[...new Set(methods)]});
        await fs.writeFile(`${out}/${width}x${height}-result.json`,JSON.stringify(results.at(-1),null,2));
      }catch(e){await shot('FAILURE').catch(()=>{});const snapshot=await snap().catch(()=>null);await fs.writeFile(`${out}/${width}x${height}-FAILURE.json`,JSON.stringify({stage,message:safeText(e.message),stack:safeText(e.stack||e),snapshot,publicBrowserSource:finishPublicSource?.snapshot()??null,forbidden,errors,consoleErrors,requestFailures,phaseCounts,legacyHistoryLogFallbacks:logFallbacks,rpcDiagnostics:rpcDiagnostics.snapshot(),evidence,methods:[...new Set(methods)]},null,2));throw e}finally{await page.close()}
    }
    console.log('M1 signer-free public BSC97 read-only browser PASS; Human MetaMask NOT_VERIFIED');
  }finally{await browser.close();provider.destroy()}
}
