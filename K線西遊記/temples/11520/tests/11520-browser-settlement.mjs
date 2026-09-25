import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

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
