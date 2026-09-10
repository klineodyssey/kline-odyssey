import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const OUT='artifacts/11520-visual-qa';
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.route('https://api.binance.com/api/v3/ticker/price',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([
  {symbol:'BTCUSDT',price:'65000.25'},
  {symbol:'ETHUSDT',price:'3500.5'},
  {symbol:'BNBUSDT',price:'600.75'}
])}));
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1900);
if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click({timeout:1500}).catch(()=>{});
await page.locator('#intro11520').waitFor({state:'hidden',timeout:3000}).catch(()=>{});
await page.waitForTimeout(900);
assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));
await page.waitForFunction(()=>globalThis.__K11520_ACTION_RAIL_CLEARANCE__?.version==='1.2.0',null,{timeout:4000});
await page.waitForFunction(()=>globalThis.__K11520_MARKET_ORIGIN_RUNTIME__?.origin&&globalThis.__K11520_GLOBAL_WORLD_COORDS__?.physical,null,{timeout:5000});
const r=await page.evaluate(()=>structuredClone(globalThis.__K11520_ACTION_RAIL_CLEARANCE__));
assert.ok(r.rail,'remaining-axis rail missing');
assert.ok(r.dock,'right utility dock missing');
assert.ok(r.rightSafeGap>=80,`right rail safe gap too small: ${r.rightSafeGap}`);
assert.equal(r.railDockOverlap,false,'remaining-axis rail must not overlap right utility dock');
for(const sel of ['#cControl','#lotsControl','#yControl','#orderFire','#attack']){const b=await page.locator(sel).boundingBox();assert.ok(b,`${sel} missing`);assert.ok(b.x>=0&&b.x+b.width<=390,`${sel} must fit viewport`)}
const railBox=await page.locator('#yControl').boundingBox(),dockBox=await page.locator('#dock').boundingBox();assert.ok(railBox&&dockBox);assert.ok(railBox.x+railBox.width+80<=390,'Y/remaining-axis rail must reserve right utility safe zone');assert.ok(railBox.x+railBox.width<=dockBox.x,'Y/remaining-axis rail must sit left of utility dock');

// Global XYZ contract: market quote snapshot is the origin; local movement adds signed displacement without moving the origin itself.
const initial=await page.evaluate(()=>({origin:structuredClone(globalThis.__K11520_MARKET_ORIGIN__),global:structuredClone(globalThis.__K11520_GLOBAL_WORLD_COORDS__),text:document.querySelector('#xyz')?.textContent||''}));
assert.equal(initial.origin.x,65000.25);assert.equal(initial.origin.y,3500.5);assert.equal(initial.origin.z,600.75);
assert.deepEqual(initial.global.origin,{x:65000.25,y:3500.5,z:600.75});
assert.ok(!/^X\s+0(?:\.0+)?\s+·\s+Y\s+0(?:\.0+)?\s+·\s+Z\s+0/.test(initial.text),'visible XYZ must not start at 0/0/0 once market origin is ready');
const joy=await page.locator('#joy').boundingBox();assert.ok(joy,'joystick missing');
await page.mouse.move(joy.x+joy.width*.24,joy.y+joy.height*.5);await page.mouse.down();await page.mouse.move(joy.x+joy.width*.82,joy.y+joy.height*.5,{steps:5});await page.waitForTimeout(450);await page.mouse.up();await page.waitForTimeout(200);
const moved=await page.evaluate(()=>({origin:structuredClone(globalThis.__K11520_MARKET_ORIGIN__),global:structuredClone(globalThis.__K11520_GLOBAL_WORLD_COORDS__)}));
assert.deepEqual({x:moved.origin.x,y:moved.origin.y,z:moved.origin.z},{x:initial.origin.x,y:initial.origin.y,z:initial.origin.z},'market origin must remain immutable while player moves');
assert.ok(Math.abs(moved.global.displacement.x)+Math.abs(moved.global.displacement.y)+Math.abs(moved.global.displacement.z)>0.001,'player movement must produce nonzero local displacement');
for(const k of ['x','y','z'])assert.ok(Math.abs(moved.global.physical[k]-(moved.origin[k]+moved.global.displacement[k]))<1e-6,`global ${k} must equal market origin + signed displacement`);

// Wallet contract: one fixed toggle anchor before/after open/close.
const wallet=page.locator('#walletToggle');await wallet.waitFor({state:'visible',timeout:3000});const w0=await wallet.boundingBox();assert.ok(w0,'wallet toggle missing');
await wallet.click({force:true});await page.waitForTimeout(180);const w1=await wallet.boundingBox();assert.ok(w1,'wallet toggle missing after first toggle');
await wallet.click({force:true});await page.waitForTimeout(180);const w2=await wallet.boundingBox();assert.ok(w2,'wallet toggle missing after second toggle');
for(const w of [w1,w2]){assert.ok(Math.abs(w.x-w0.x)<1&&Math.abs(w.y-w0.y)<1,`wallet toggle anchor moved: ${JSON.stringify({w0,w})}`)}
const walletState=await page.evaluate(()=>structuredClone(globalThis.__K11520_WALLET_ANCHOR__));assert.equal(walletState.stable,true,'wallet runtime must report stable fixed anchor');

// Open-order layer contract: the existing confirm surface must render and hit-test above every ordinary HUD organ.
await page.evaluate(()=>document.querySelector('#confirm')?.classList.add('open'));
await page.waitForTimeout(180);
const layer=await page.evaluate(()=>{const open=document.querySelector('#confirm.open');const z=open?Number(getComputedStyle(open).zIndex)||0:0;const hud=['#dock','#backpackButton','#walletPanel','#chatHandle','#k11520HudCollapseAll'].map(s=>{const e=document.querySelector(s);return e?(Number(getComputedStyle(e).zIndex)||0):0});return{z,hudMax:Math.max(...hud),rect:open?(()=>{const r=open.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}})():null,hit:(()=>{if(!open)return false;const r=open.getBoundingClientRect(),x=r.left+r.width/2,y=Math.max(r.top+20,Math.min(r.bottom-20,r.top+r.height/2)),h=document.elementFromPoint(x,y);return !!h&&(h===open||open.contains(h))})()}});
await page.screenshot({path:`${OUT}/11520-mobile-action-rail-clearance.png`,fullPage:true});
assert.ok(layer.rect&&layer.rect.left>=0&&layer.rect.right<=390&&layer.rect.top>=0&&layer.rect.bottom<=844,`open order/confirm surface must fit viewport: ${JSON.stringify(layer)}`);
assert.ok(layer.z>layer.hudMax,`open order/confirm surface must be top layer: ${JSON.stringify(layer)}`);
assert.equal(layer.hit,true,'open order/confirm surface must receive pointer hit testing above HUD');
await browser.close();
console.log('11520 action/rail + market-origin + wallet-anchor PASS');
