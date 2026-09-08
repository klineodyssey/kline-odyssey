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
await page.waitForFunction(()=>globalThis.__K11520_XYZ_MAP_NAV_INSTALLED__===true&&globalThis.__K11520_XYZ_MAP_NAVIGATION__?.legacyXZPreserved===true,{timeout:3000});
assert.ok(await page.locator('#minimap').count(),'minimap missing');
assert.ok(await page.locator('.k11520PlaneMapOverlay').count(),'plane map overlay missing');

const tapCenter=async(id)=>{
  const b=await page.locator('#joy').boundingBox();assert.ok(b,'joystick missing');
  const p={pointerId:id,pointerType:'touch',clientX:b.x+b.width/2,clientY:b.y+b.height/2,buttons:1};
  await page.dispatchEvent('#joy','pointerdown',p);await page.waitForTimeout(70);await page.dispatchEvent('#joy','pointerup',{...p,buttons:0});await page.waitForTimeout(260);
};
const plane=async()=>page.evaluate(()=>structuredClone(globalThis.__K11520_PLANE_MAP__));
const coords=async()=>page.evaluate(()=>structuredClone(globalThis.__K11520_WORLD_COORDS__?.physical||{x:0,y:0,z:0}));
const mapTap=async(fx,fy,id)=>{
  const b=await page.locator('#minimap').boundingBox();assert.ok(b,'minimap box missing');
  const p={pointerId:id,pointerType:'touch',clientX:b.x+b.width*fx,clientY:b.y+b.height*fy,buttons:1};
  await page.dispatchEvent('#minimap','pointerdown',p);await page.waitForTimeout(40);await page.dispatchEvent('#minimap','pointerup',{...p,buttons:0});await page.waitForTimeout(120);
};
const startPlaneNav=async()=>{await page.locator('#xyzWaypointAction').click();await page.waitForFunction(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__?.active===true,{timeout:2000})};
const cancelPlaneNav=async(id)=>{
  const b=await page.locator('#joy').boundingBox();assert.ok(b);
  const p={pointerId:id,pointerType:'touch',clientX:b.x+b.width*.80,clientY:b.y+b.height*.50,buttons:1};
  await page.dispatchEvent('#joy','pointerdown',p);await page.waitForTimeout(50);await page.dispatchEvent('#joy','pointerup',{...p,buttons:0});await page.waitForTimeout(120);
};
let m=await plane();assert.equal(m.mode,'XZ');assert.equal(m.hAxis,'X');assert.equal(m.vAxis,'Z');assert.equal(m.depthAxis,'Y');assert.equal(m.normalAxis,'KY');
await page.screenshot({path:`${OUT}/11520-plane-map-xz.png`,fullPage:true});

await tapCenter(701);await page.waitForFunction(()=>globalThis.__K11520_PLANE_MAP__?.mode==='XY',{timeout:2000});m=await plane();assert.equal(m.hAxis,'X');assert.equal(m.vAxis,'Y');assert.equal(m.depthAxis,'Z');assert.equal(m.normalAxis,'KZ');
const xy0=await coords();await mapTap(.72,.34,711);await page.waitForFunction(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__?.target&&globalThis.__K11520_XYZ_MAP_NAVIGATION__.mode==='XY',{timeout:2000});
const xyt=await page.evaluate(()=>structuredClone(globalThis.__K11520_XYZ_MAP_NAVIGATION__.target));assert.ok(xyt.x>xy0.x);assert.ok(xyt.y>=xy0.y);assert.equal(Number(xyt.z.toFixed(3)),Number(xy0.z.toFixed(3)));
await startPlaneNav();await page.waitForFunction(([x,y])=>{const p=globalThis.__K11520_WORLD_COORDS__?.physical||{};return Math.abs((p.x||0)-x)>.12||Math.abs((p.y||0)-y)>.12},[xy0.x,xy0.y],{timeout:4000});
await cancelPlaneNav(712);assert.equal(await page.evaluate(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__?.active),false);
await page.screenshot({path:`${OUT}/11520-plane-map-xy.png`,fullPage:true});

await tapCenter(702);await page.waitForFunction(()=>globalThis.__K11520_PLANE_MAP__?.mode==='YZ',{timeout:2000});m=await plane();assert.equal(m.hAxis,'Y');assert.equal(m.vAxis,'Z');assert.equal(m.depthAxis,'X');assert.equal(m.normalAxis,'KX');
const yz0=await coords();await mapTap(.70,.66,721);await page.waitForFunction(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__?.target&&globalThis.__K11520_XYZ_MAP_NAVIGATION__.mode==='YZ',{timeout:2000});
const yzt=await page.evaluate(()=>structuredClone(globalThis.__K11520_XYZ_MAP_NAVIGATION__.target));assert.equal(Number(yzt.x.toFixed(3)),Number(yz0.x.toFixed(3)));assert.ok(Math.abs(yzt.y-yz0.y)>.1||Math.abs(yzt.z-yz0.z)>.1);
await startPlaneNav();await page.waitForFunction(([y,z])=>{const p=globalThis.__K11520_WORLD_COORDS__?.physical||{};return Math.abs((p.y||0)-y)>.12||Math.abs((p.z||0)-z)>.12},[yz0.y,yz0.z],{timeout:4000});
await cancelPlaneNav(722);await page.screenshot({path:`${OUT}/11520-plane-map-yz.png`,fullPage:true});

const world0=await coords(),worldTarget={x:world0.x+1.2,y:world0.y+1.1,z:world0.z-1.0};
await page.evaluate(target=>{const nav=globalThis.__K11520_XYZ_MAP_NAVIGATION__;nav.setWorldTarget(target,{mode:'WORLD',source:'WORLD_ENTITY'});nav.start()},worldTarget);
await page.waitForFunction(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__?.active===true&&globalThis.__K11520_XYZ_MAP_NAVIGATION__?.source==='WORLD_ENTITY'&&globalThis.__K11520_XYZ_MAP_NAVIGATION__?.worldTargetAuthority===true,{timeout:2000});
const publishedTarget=await page.evaluate(()=>structuredClone(globalThis.__K11520_XYZ_MAP_NAVIGATION__.target));for(const k of ['x','y','z'])assert.equal(Number(publishedTarget[k].toFixed(3)),Number(worldTarget[k].toFixed(3)));
await page.waitForFunction(([x,y,z])=>{const p=globalThis.__K11520_WORLD_COORDS__?.physical||{};return Math.hypot((p.x||0)-x,(p.y||0)-y,(p.z||0)-z)>.16},[world0.x,world0.y,world0.z],{timeout:4000});
await page.evaluate(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__.stop('WORLD target QA stop'));

const authority=await page.evaluate(()=>structuredClone(globalThis.__K11520_XYZ_INPUT_AUTHORITY__));
assert.equal(authority.authoritative,true);assert.equal(authority.legacyXZBubbleSuppressed,true);
assert.deepEqual(errors,[],'page errors after XYZ navigation: '+errors.join('\n'));
await browser.close();
console.log('11520 authoritative XYZ input + XZ/XY/YZ plane map + canonical WORLD target travel browser QA PASS');
