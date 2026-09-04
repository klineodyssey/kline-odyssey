import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1000);
assert.deepEqual(errors,[],'boot page errors: '+errors.join('\n'));

const assertVisible=async id=>{
  const loc=page.locator('#'+id);
  const diag=await loc.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{id:el.id,display:s.display,visibility:s.visibility,opacity:s.opacity,w:r.width,h:r.height,x:r.x,y:r.y}});
  assert.ok(diag.w>0&&diag.h>0&&diag.display!=='none'&&diag.visibility!=='hidden',`control ${id} not visible: ${JSON.stringify(diag)}`);
};

// Default formal screen is clean play: joystick + combat + one fixed settings toggle.
for(const id of ['joy','attack','skill','dodge','gameModeToggle'])await assertVisible(id);
for(const id of ['attack','skill','dodge']){await page.locator('#'+id).click({timeout:3000});await page.waitForTimeout(20)}

// Single XZ joystick must actually change world position.
const before=await page.locator('#xyz').textContent();
const box=await page.locator('#joy').boundingBox();assert.ok(box);
await page.dispatchEvent('#joy','pointerdown',{pointerId:1,pointerType:'touch',clientX:box.x+box.width/2,clientY:box.y+box.height/2});
await page.dispatchEvent('#joy','pointermove',{pointerId:1,pointerType:'touch',clientX:box.x+box.width/2,clientY:box.y+30});
await page.waitForTimeout(450);
await page.dispatchEvent('#joy','pointerup',{pointerId:1,pointerType:'touch',clientX:box.x+box.width/2,clientY:box.y+30});
const after=await page.locator('#xyz').textContent();assert.notEqual(after,before,'joystick did not move XZ');

// Enter settings/control screen. Wallet handle and organ menu must stay at fixed, clickable locations there.
await page.locator('#gameModeToggle').click({timeout:3000});
await page.waitForTimeout(80);
for(const id of ['walletToggle','dockToggle','orderFire','tradeSword','flat'])await assertVisible(id);

// Wallet collapse control stays at the same screen position after expand/collapse.
const toggleBefore=await page.locator('#walletToggle').boundingBox();assert.ok(toggleBefore);
await page.locator('#walletToggle').click({timeout:3000});await page.waitForTimeout(80);
const toggleAfter=await page.locator('#walletToggle').boundingBox();assert.ok(toggleAfter);
assert.ok(Math.abs(toggleAfter.x-toggleBefore.x)<12&&Math.abs(toggleAfter.y-toggleBefore.y)<12,'wallet toggle moved away after expand/collapse');

// All 14 formal organs are reachable before any modal can intentionally cover the UI.
assert.equal(await page.locator('#rail [data-organ]').count(),14);
await page.locator('#dockToggle').click({timeout:3000});
for(const id of ['trade','positions','orders','history','assets','records','market','bag','character','worldmap','atm','settings','help']){
  await page.locator(`#rail [data-organ="${id}"]`).click({timeout:3000});
  await page.waitForTimeout(20);
  assert.equal(await page.locator('#sheet').evaluate(el=>el.classList.contains('open')),true,`organ ${id} did not open`);
  await page.locator('#sheetClose').click({timeout:3000});
  await page.locator('#dockToggle').click({timeout:3000});
}

// Wallet connect is checked last because no-injected-wallet flow may intentionally open a launch sheet/modal.
await page.locator('#walletConnect').click({timeout:3000});await page.waitForTimeout(50);
assert.ok((await page.locator('#walletMsg').textContent()).length>0);

assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));
await browser.close();
console.log('11520 standardized mobile browser smoke PASS');
