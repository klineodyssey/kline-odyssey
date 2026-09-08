import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const OUT='artifacts/11520-visual-qa';
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await page.addInitScript(()=>{try{localStorage.setItem('k11520.joystick.plane','XZ')}catch{}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2200);
if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click().catch(()=>{});
await page.waitForTimeout(800);
assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));

await page.waitForFunction(()=>globalThis.__K11520_XYZ_INPUT_AUTHORITY__?.legacyXZBubbleSuppressed===true,{timeout:3000});
await page.waitForFunction(()=>globalThis.__K11520_PLANE_MAP__?.mode==='XZ',{timeout:3000});
assert.ok(await page.locator('#minimap').count(),'minimap missing');
assert.ok(await page.locator('.k11520PlaneMapOverlay').count(),'plane map overlay missing');

const tapCenter=async(id)=>{
  const b=await page.locator('#joy').boundingBox();assert.ok(b,'joystick missing');
  const p={pointerId:id,pointerType:'touch',clientX:b.x+b.width/2,clientY:b.y+b.height/2,buttons:1};
  await page.dispatchEvent('#joy','pointerdown',p);await page.waitForTimeout(70);await page.dispatchEvent('#joy','pointerup',{...p,buttons:0});await page.waitForTimeout(260);
};
const plane=async()=>page.evaluate(()=>structuredClone(globalThis.__K11520_PLANE_MAP__));
let m=await plane();assert.equal(m.mode,'XZ');assert.equal(m.hAxis,'X');assert.equal(m.vAxis,'Z');assert.equal(m.depthAxis,'Y');assert.equal(m.normalAxis,'KY');
await page.screenshot({path:`${OUT}/11520-plane-map-xz.png`,fullPage:true});

await tapCenter(701);await page.waitForFunction(()=>globalThis.__K11520_PLANE_MAP__?.mode==='XY',{timeout:2000});m=await plane();assert.equal(m.hAxis,'X');assert.equal(m.vAxis,'Y');assert.equal(m.depthAxis,'Z');assert.equal(m.normalAxis,'KZ');
await page.screenshot({path:`${OUT}/11520-plane-map-xy.png`,fullPage:true});

await tapCenter(702);await page.waitForFunction(()=>globalThis.__K11520_PLANE_MAP__?.mode==='YZ',{timeout:2000});m=await plane();assert.equal(m.hAxis,'Y');assert.equal(m.vAxis,'Z');assert.equal(m.depthAxis,'X');assert.equal(m.normalAxis,'KX');
await page.screenshot({path:`${OUT}/11520-plane-map-yz.png`,fullPage:true});

const authority=await page.evaluate(()=>structuredClone(globalThis.__K11520_XYZ_INPUT_AUTHORITY__));
assert.equal(authority.authoritative,true);assert.equal(authority.legacyXZBubbleSuppressed,true);
await browser.close();
console.log('11520 authoritative XYZ input + XZ/XY/YZ plane map browser QA PASS');
