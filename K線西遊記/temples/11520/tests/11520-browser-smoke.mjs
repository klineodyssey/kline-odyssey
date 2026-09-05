import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1000);
assert.deepEqual(errors,[],'boot page errors: '+errors.join('\n'));

// Product intro is intentional, but it must never block automated or returning-player controls forever.
if(await page.locator('#intro11520').count()){
  const enter=page.locator('#intro11520 .introSkip');
  if(await enter.isVisible())await enter.click({timeout:3000});
  await page.waitForTimeout(600);
}

const assertVisible=async id=>{
  const loc=page.locator('#'+id);
  const diag=await loc.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{id:el.id,display:s.display,visibility:s.visibility,opacity:s.opacity,w:r.width,h:r.height,x:r.x,y:r.y}});
  assert.ok(diag.w>0&&diag.h>0&&diag.display!=='none'&&diag.visibility!=='hidden',`control ${id} not visible: ${JSON.stringify(diag)}`);
};
const intersects=(a,b)=>!!(a&&b&&a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y);

// Default formal screen is clean play: joystick + combat + one fixed settings toggle.
for(const id of ['joy','attack','skill','dodge','gameModeToggle'])await assertVisible(id);
for(const id of ['attack','skill','dodge']){await page.locator('#'+id).click({timeout:3000});await page.waitForTimeout(20)}

// Single XZ joystick must actually change world position and stay clear of the nearby action buttons.
const joyBox=await page.locator('#joy').boundingBox();assert.ok(joyBox);
assert.ok(joyBox.x<=4,`XZ joystick was not moved to the left clearance edge: ${JSON.stringify(joyBox)}`);
for(const id of ['attack','skill','dodge','flat','orderFire']){
  const b=await page.locator('#'+id).boundingBox();
  assert.equal(intersects(joyBox,b),false,`XZ joystick overlaps ${id}: joy=${JSON.stringify(joyBox)} target=${JSON.stringify(b)}`);
}
const before=await page.locator('#xyz').textContent();
await page.dispatchEvent('#joy','pointerdown',{pointerId:1,pointerType:'touch',clientX:joyBox.x+joyBox.width/2,clientY:joyBox.y+joyBox.height/2});
await page.dispatchEvent('#joy','pointermove',{pointerId:1,pointerType:'touch',clientX:joyBox.x+joyBox.width/2,clientY:joyBox.y+30});
await page.waitForTimeout(450);
await page.dispatchEvent('#joy','pointerup',{pointerId:1,pointerType:'touch',clientX:joyBox.x+joyBox.width/2,clientY:joyBox.y+30});
const after=await page.locator('#xyz').textContent();assert.notEqual(after,before,'joystick did not move XZ');

// Branded Y/C/K pictures are fixed at the top of each energy track, not moving thumbs.
for(const id of ['yControl','cControl','lotsControl']){
  const icon=page.locator(`#${id} .energyTap`);
  const bg=await icon.evaluate(el=>getComputedStyle(el).backgroundImage);
  assert.ok(bg&&bg!=='none',`${id} fixed energy icon missing`);
}
assert.equal(await page.locator('#yEnergyMarker').count(),0,'legacy glowing Y energy marker should be removed');

// Enter settings/control screen. Wallet handle, AI, music and organ menu must stay reachable.
await page.locator('#gameModeToggle').click({timeout:3000});
await page.waitForTimeout(80);
for(const id of ['walletToggle','dockToggle','orderFire','tradeSword','flat','aiChatButton','bgmButton'])await assertVisible(id);

// AI panel must open and close without covering the game permanently.
await page.locator('#aiChatButton').click({timeout:3000});await page.waitForTimeout(30);
assert.equal(await page.locator('#aiChatPanel').evaluate(el=>el.classList.contains('open')),true,'AI chat did not open');
await page.locator('#aiClose').click({timeout:3000});await page.waitForTimeout(30);
assert.equal(await page.locator('#aiChatPanel').evaluate(el=>el.classList.contains('open')),false,'AI chat did not close');

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
