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
await page.waitForFunction(()=>globalThis.__K11520_COMBAT_DRIVE_API__&&globalThis.__K11520_COMBAT_DRIVE__,null,{timeout:4000});
await page.waitForTimeout(300);
assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));

const box=async sel=>{const b=await page.locator(sel).boundingBox();assert.ok(b,`${sel} missing`);return b};
let pointerId=1200;
async function setVertical(sel,t){
  const b=await box(sel),id=pointerId++,x=b.x+b.width/2,y=b.y+b.height*(1-t);
  await page.dispatchEvent(sel,'pointerdown',{pointerId:id,pointerType:'touch',clientX:x,clientY:y,buttons:1});
  await page.dispatchEvent(sel,'pointermove',{pointerId:id,pointerType:'touch',clientX:x,clientY:y,buttons:1});
  await page.dispatchEvent(sel,'pointerup',{pointerId:id,pointerType:'touch',clientX:x,clientY:y,buttons:0});
  await page.waitForTimeout(240);
}
async function drive(){return page.evaluate(()=>structuredClone(globalThis.__K11520_COMBAT_DRIVE__))}

// C=0: ordinary pilgrimage walking remains live, not frozen.
await setVertical('#cControl',0);
let d=await drive();
assert.equal(d.c,0);assert.equal(d.cMode,'LOCAL_WALK');assert.equal(d.xyzStep,.1);
assert.equal((await page.locator('#k11520DriveHud').textContent()).includes('0C LOCAL_WALK'),true);

// C=1: canonical light-speed/spot layer preserves the public base XYZ step at 0.1.
await setVertical('#cControl',.7);
d=await drive();
assert.equal(d.c,1);assert.equal(d.cMode,'LIGHT_SPEED_SPOT');assert.equal(d.xyzStep,.1);

// C=10: superluminal layer scales XYZ intent by 10, without changing the source disc/rail state.
await setVertical('#cControl',.8);
d=await drive();
assert.equal(d.c,10);assert.equal(d.cMode,'SUPERLUMINAL_WARP');assert.equal(d.xyzStep,1);

const joy=await box('#joy'),id=pointerId++,cx=joy.x+joy.width/2,cy=joy.y+joy.height/2;
await page.dispatchEvent('#joy','pointerdown',{pointerId:id,pointerType:'touch',clientX:cx,clientY:cy,buttons:1});
await page.dispatchEvent('#joy','pointermove',{pointerId:id,pointerType:'touch',clientX:joy.x+joy.width*.88,clientY:cy,buttons:1});
await page.waitForTimeout(260);
const states=await page.evaluate(()=>({drive:structuredClone(globalThis.__K11520_COMBAT_DRIVE__),control:structuredClone(globalThis.__K11520_3D_CONTROL__)}));
assert.ok(Math.abs(states.control.disc.h)<=1.01,'raw joystick disc must remain normalized');
assert.ok(Math.abs(states.drive.controlVector.x)>=Math.abs(states.control.disc.h)*9,'10C must scale live XYZ intent');
await page.dispatchEvent('#joy','pointerup',{pointerId:id,pointerType:'touch',clientX:joy.x+joy.width*.88,clientY:cy,buttons:0});
await page.waitForTimeout(180);

// 3 lots = 3 KGEN/index units = 3000 KAIOS = 3000 kg. This is scale/accounting only, not an asset transfer.
await setVertical('#lotsControl',.03);
d=await drive();
assert.equal(d.lots,3);assert.equal(d.kgenEquivalent,3);assert.equal(d.indexUnits,3);assert.equal(d.kaiosMass,3000);assert.equal(d.kgMass,3000);assert.equal(d.simulationOnly,true);
const hud=await page.locator('#k11520DriveHud').textContent();assert.match(hud,/10C SUPERLUMINAL_WARP/);assert.match(hud,/3口/);assert.match(hud,/3000 KAIOS/);assert.match(hud,/3000kg/);

await page.screenshot({path:`${OUT}/11520-mobile-combat-drive-c10-3lots.png`,fullPage:true});
assert.deepEqual(errors,[]);
await browser.close();
console.log('11520 combat drive browser QA PASS: 0C walk, 1C spot, 10C warp, 3 lots = 3000 KAIOS/kg, screenshot captured');
