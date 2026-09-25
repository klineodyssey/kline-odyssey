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
    await page.route('https://data-api.binance.vision/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{symbol:'BTCUSDT',price:'100000'},{symbol:'ETHUSDT',price:String(eth)},{symbol:'BNBUSDT',price:'600'}])}));
    await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',async route=>{
      const prefix='https://cdn.jsdelivr.net/npm/three@0.180.0/';
      let body=await fs.readFile(`node_modules/three/${route.request().url().slice(prefix.length)}`,'utf8');
      body=body.replaceAll("from 'three'",`from '${prefix}build/three.module.js'`).replaceAll('from "three"',`from "${prefix}build/three.module.js"`);
      await route.fulfill({status:200,contentType:'text/javascript',body});
    });
    await page.goto(`${base}/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>globalThis.__K11520_SIMULATION_EXCHANGE__?.snapshot().observations.ETHUSDT,{timeout:15000});
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
    for(let i=0;i<3;i++){await page.setViewportSize({width:390,height:844});await page.waitForTimeout(120);await page.setViewportSize({width:844,height:390});await page.waitForTimeout(120)}
    await page.setViewportSize({width,height});await page.waitForTimeout(200);await shot('rotation');
    const canvas=await page.locator('#three').boundingBox();assert.ok(Math.abs(canvas.height-height)<=2);
    const hit=await page.locator('#attack').evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))});assert.equal(hit,true,'attack pointer path');
    assert.deepEqual(errors,[]);await fs.writeFile(`${out}/${width}x${height}-result.json`,JSON.stringify({mode:'DETERMINISTIC_SIMULATION_FIXTURES',functional:'PASS',visual:'REQUIRES_DIRECT_IMAGE_INSPECTION',snapshot:s},null,2));
    await page.close();
  }
  console.log('PASS: real Chromium pending/cross/fill/isolated liquidation/receipts/wallet/rotation (both viewports)');
} finally {await browser.close()}
