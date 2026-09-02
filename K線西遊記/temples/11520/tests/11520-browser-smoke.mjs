import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.locator('#enterBtn').click();
await page.waitForTimeout(400);
assert.equal(await page.locator('#quickRail [data-organ]').count(),14);
await page.locator('#toolToggle').click();
const ids=['trade','positions','orders','history','assets','records','market','bag','character','worldmap','atm','settings','help'];
for(const id of ids){await page.locator(`#quickRail [data-organ="${id}"]`).click();await page.waitForTimeout(30);assert.equal(await page.locator('#organSheet').evaluate(el=>el.classList.contains('open')),true,`organ ${id} did not open`);await page.locator('#organClose').click();await page.locator('#toolToggle').click()}
const before=await page.locator('#xyz').textContent();const box=await page.locator('#joy').boundingBox();assert.ok(box);await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2,box.y+12,{steps:4});await page.waitForTimeout(500);await page.mouse.up();const after=await page.locator('#xyz').textContent();assert.notEqual(after,before,'0C joystick did not move player');
await page.locator('#attack').click();await page.waitForTimeout(50);assert.ok((await page.locator('#eventLog').textContent()).includes('普通攻擊'));
await page.locator('#skill').click();await page.locator('#dodge').click();await page.locator('#tradeSword').click();assert.equal(await page.locator('#tradeControls').evaluate(el=>el.classList.contains('open')),true);
assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));
await browser.close();console.log('11520 browser smoke PASS');
