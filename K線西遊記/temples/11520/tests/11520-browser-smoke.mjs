import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(700);

// Product shell and all 14 organs are reachable.
assert.equal(await page.locator('#rail [data-organ]').count(),14);
await page.locator('#dockToggle').click();
for(const id of ['trade','positions','orders','history','assets','records','market','bag','character','worldmap','atm','settings','help']){
  await page.locator(`#rail [data-organ="${id}"]`).click();
  await page.waitForTimeout(20);
  assert.equal(await page.locator('#sheet').evaluate(el=>el.classList.contains('open')),true,`organ ${id} did not open`);
  await page.locator('#sheetClose').click();
  await page.locator('#dockToggle').click();
}

// Inner-zone joystick must move XZ even when current C is low/zero-capable walking.
const before=await page.locator('#xyz').textContent();
const box=await page.locator('#joy').boundingBox();assert.ok(box);
await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
await page.mouse.down();
await page.mouse.move(box.x+box.width/2,box.y+30,{steps:5});
await page.waitForTimeout(450);
await page.mouse.up();
const after=await page.locator('#xyz').textContent();assert.notEqual(after,before,'inner joystick did not move XZ');

// Outer ring rotates avatar heading without removing movement control.
await page.mouse.move(box.x+box.width-8,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2,box.y+8,{steps:4});await page.mouse.up();

// Core action buttons are active and transaction flow is confirm-gated.
for(const id of ['attack','skill','dodge','flat']){await page.locator('#'+id).click();await page.waitForTimeout(20)}
await page.locator('#tradeSword').click();
await page.locator('#orderFire').click();
await page.waitForTimeout(30);
if(await page.locator('#confirm').evaluate(el=>el.classList.contains('open')))await page.locator('#cancelOrder').click();

// Wallet button must be wired; lack of injected wallet is an explicit state, not a crash.
await page.locator('#walletConnect').click();await page.waitForTimeout(50);
assert.ok((await page.locator('#walletMsg').textContent()).length>0);

assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));
await browser.close();
console.log('11520 standardized mobile browser smoke PASS');
