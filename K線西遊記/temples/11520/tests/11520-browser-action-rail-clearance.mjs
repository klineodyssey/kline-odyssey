import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const OUT='artifacts/11520-visual-qa';
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1900);
if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click({timeout:1500}).catch(()=>{});
await page.locator('#intro11520').waitFor({state:'hidden',timeout:3000}).catch(()=>{});
await page.waitForTimeout(900);
assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));
await page.waitForFunction(()=>globalThis.__K11520_ACTION_RAIL_CLEARANCE__?.version==='1.2.1',null,{timeout:3000});
const r=await page.evaluate(()=>structuredClone(globalThis.__K11520_ACTION_RAIL_CLEARANCE__));
assert.ok(r.rail,'remaining-axis rail missing');
assert.ok(r.dock,'right utility dock missing');
assert.ok(r.dockGap>=14,`remaining-axis rail must keep a live dock gap: ${r.dockGap}`);
assert.equal(r.railDockOverlap,false,'remaining-axis rail must not overlap right utility dock');
for(const sel of ['#cControl','#lotsControl','#yControl','#orderFire','#attack']){const b=await page.locator(sel).boundingBox();assert.ok(b,`${sel} missing`);assert.ok(b.x>=0&&b.x+b.width<=390,`${sel} must fit viewport`)}
const railBox=await page.locator('#yControl').boundingBox(),dockBox=await page.locator('#dock').boundingBox();assert.ok(railBox&&dockBox);assert.ok(railBox.x+railBox.width+14<=dockBox.x,'remaining-axis rail must sit clear left of the actual utility dock');

await page.waitForFunction(()=>globalThis.__K11520_WALLET_ANCHOR__?.version==='1.1.0',null,{timeout:3000});
const walletBefore=await page.locator('#walletToggle').boundingBox();
assert.ok(walletBefore,'wallet toggle missing');
await page.locator('#walletToggle').click({force:true});
await page.waitForTimeout(180);
const walletAfterOne=await page.locator('#walletToggle').boundingBox();
await page.locator('#walletToggle').click({force:true});
await page.waitForTimeout(180);
const walletAfterTwo=await page.locator('#walletToggle').boundingBox();
for(const b of [walletAfterOne,walletAfterTwo]){assert.ok(b,'wallet toggle disappeared');assert.ok(Math.abs(b.x-walletBefore.x)<1&&Math.abs(b.y-walletBefore.y)<1,`wallet toggle anchor moved: before=${JSON.stringify(walletBefore)} after=${JSON.stringify(b)}`)}

await page.evaluate(()=>document.querySelector('#confirm')?.classList.add('open'));
await page.waitForTimeout(180);
const layer=await page.evaluate(()=>{const open=document.querySelector('#confirm.open');const z=open?Number(getComputedStyle(open).zIndex)||0:0;const hud=['#dock','#backpackButton','#walletPanel','#chatHandle','#k11520HudCollapseAll'].map(s=>{const e=document.querySelector(s);return e?(Number(getComputedStyle(e).zIndex)||0):0});return{z,hudMax:Math.max(...hud),rect:open?(()=>{const r=open.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}})():null,hit:(()=>{if(!open)return false;const r=open.getBoundingClientRect(),x=r.left+r.width/2,y=Math.max(r.top+20,Math.min(r.bottom-20,r.top+r.height/2)),h=document.elementFromPoint(x,y);return !!h&&(h===open||open.contains(h))})()}});
await page.screenshot({path:`${OUT}/11520-mobile-action-rail-clearance.png`,fullPage:true});
assert.ok(layer.rect&&layer.rect.left>=0&&layer.rect.right<=390&&layer.rect.top>=0&&layer.rect.bottom<=844,`open order/confirm surface must fit viewport: ${JSON.stringify(layer)}`);
assert.ok(layer.z>layer.hudMax,`open order/confirm surface must be top layer: ${JSON.stringify(layer)}`);
assert.equal(layer.hit,true,'open order/confirm surface must receive pointer hit testing above HUD');
await browser.close();
console.log('11520 action/rail clearance PASS: live dock geometry, fixed wallet anchor, topmost action surface');
