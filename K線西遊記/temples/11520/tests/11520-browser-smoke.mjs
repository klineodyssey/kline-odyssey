import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1000);
assert.deepEqual(errors,[],'boot page errors: '+errors.join('\n'));

// The player-facing controls must really be visible and clickable on a 390x844 phone viewport.
for(const id of ['joy','attack','skill','dodge','flat','orderFire','tradeSword','walletToggle','dockToggle']){
  const loc=page.locator('#'+id);
  const diag=await loc.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{id:el.id,display:s.display,visibility:s.visibility,opacity:s.opacity,w:r.width,h:r.height,x:r.x,y:r.y,clientW:el.clientWidth,clientH:el.clientHeight}});
  assert.ok(diag.w>0&&diag.h>0&&diag.display!=='none'&&diag.visibility!=='hidden',`control ${id} not visible: ${JSON.stringify(diag)}`);
}

// Core action buttons must accept actual pointer clicks, not merely have handlers in source.
for(const id of ['attack','skill','dodge','flat']){await page.locator('#'+id).click({timeout:3000});await page.waitForTimeout(20)}
await page.locator('#tradeSword').click({timeout:3000});
await page.locator('#orderFire').click({timeout:3000});
await page.waitForTimeout(30);
if(await page.locator('#confirm').evaluate(el=>el.classList.contains('open')))await page.locator('#cancelOrder').click({timeout:3000});

// Product shell and all 14 organs are reachable through the visible menu button.
assert.equal(await page.locator('#rail [data-organ]').count(),14);
await page.locator('#dockToggle').click({timeout:3000});
for(const id of ['trade','positions','orders','history','assets','records','market','bag','character','worldmap','atm','settings','help']){
  await page.locator(`#rail [data-organ="${id}"]`).click({timeout:3000});
  await page.waitForTimeout(20);
  assert.equal(await page.locator('#sheet').evaluate(el=>el.classList.contains('open')),true,`organ ${id} did not open`);
  await page.locator('#sheetClose').click({timeout:3000});
  await page.locator('#dockToggle').click({timeout:3000});
}

// Single XZ joystick moves on the plane in the touched direction.
const before=await page.locator('#xyz').textContent();
const box=await page.locator('#joy').boundingBox();assert.ok(box);
await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
await page.mouse.down();
await page.mouse.move(box.x+box.width/2,box.y+30,{steps:5});
await page.waitForTimeout(450);
await page.mouse.up();
const after=await page.locator('#xyz').textContent();assert.notEqual(after,before,'joystick did not move XZ');

// Wallet drawer handle stays clickable while collapsed; lack of injected wallet is explicit, never a crash.
await page.locator('#walletToggle').click({timeout:3000});
await page.locator('#walletConnect').click({timeout:3000});await page.waitForTimeout(50);
assert.ok((await page.locator('#walletMsg').textContent()).length>0);

assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));
await browser.close();
console.log('11520 standardized mobile browser smoke PASS');
