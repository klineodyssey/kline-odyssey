import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const OUT='artifacts/11520-visual-qa';
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1800);
if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click({timeout:1500}).catch(()=>{});
await page.locator('#intro11520').waitFor({state:'hidden',timeout:3000}).catch(()=>{});
await page.waitForTimeout(600);
assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));

const xyz=async()=>{const t=await page.locator('#xyz').textContent();const m=String(t).match(/X\s*(-?\d+(?:\.\d+)?)\s*·\s*Y\s*(-?\d+(?:\.\d+)?)\s*·\s*Z\s*(-?\d+(?:\.\d+)?)/);assert.ok(m,'XYZ parse failed: '+t);return{x:+m[1],y:+m[2],z:+m[3]}};
const joyBox=async()=>{const b=await page.locator('#joy').boundingBox();assert.ok(b,'joy missing');return b};
const point=(b,x,y,buttons=1,id=1)=>({pointerId:id,pointerType:'touch',clientX:b.x+b.width*x,clientY:b.y+b.height*y,buttons});
const drag=async(toX,toY,id)=>{const b=await joyBox();await page.dispatchEvent('#joy','pointerdown',point(b,.5,.5,1,id));await page.dispatchEvent('#joy','pointermove',point(b,toX,toY,1,id));await page.waitForTimeout(280);await page.dispatchEvent('#joy','pointerup',point(b,toX,toY,0,id));await page.waitForTimeout(100)};
const tapCenter=async id=>{const b=await joyBox();const p=point(b,.5,.5,1,id);await page.dispatchEvent('#joy','pointerdown',p);await page.waitForTimeout(70);await page.dispatchEvent('#joy','pointerup',{...p,buttons:0});await page.waitForTimeout(160)};
const visible=async sel=>{const r=await page.locator(sel).evaluate(el=>{const b=el.getBoundingClientRect(),s=getComputedStyle(el);return{w:b.width,h:b.height,display:s.display,visibility:s.visibility,opacity:s.opacity,pointer:s.pointerEvents}});assert.ok(r.w>0&&r.h>0&&r.display!=='none'&&r.visibility!=='hidden'&&r.opacity!=='0',`${sel} not visible ${JSON.stringify(r)}`);return r};
const near=(a,b,t=.06)=>Math.abs(a-b)<=t;
const assertNoDrift=async(label)=>{const a=await xyz();await page.waitForTimeout(450);const b=await xyz();assert.ok(near(a.x,b.x)&&near(a.y,b.y)&&near(a.z,b.z),`${label} drifted after plane switch: ${JSON.stringify({a,b})}`)};

await visible('#joy');await visible('#knob');await visible('#knob img');
assert.equal(await page.locator('html').getAttribute('data-k11520-joy-plane'),'XZ','default joystick plane must be XZ');
assert.match(await page.locator('#knob img').getAttribute('src'),/kgen-user-ui\.webp$/,'XZ must use human-approved KGEN art');
assert.match(await page.locator('#cThumb img').getAttribute('src'),/ufo-user-ui\.webp$/,'C warp must use human-approved UFO art');
let p0=await xyz();await drag(.90,.50,101);let p1=await xyz();assert.ok(p1.x>p0.x,'XZ right must X+');
await drag(.10,.50,102);let p2=await xyz();assert.ok(p2.x<p1.x,'XZ left must X-');
await drag(.50,.10,103);let p3=await xyz();assert.ok(p3.z>p2.z,'XZ up must Z+');
await drag(.50,.90,104);let p4=await xyz();assert.ok(p4.z<p3.z,'XZ down must Z-');
await visible('#knob img');

await tapCenter(201);
assert.equal(await page.locator('html').getAttribute('data-k11520-joy-plane'),'XY','center image tap must switch to XY through joystick surface');
assert.match(await page.locator('#k11520PlaneLabel').textContent(),/XY/);
assert.match(await page.locator('#k11520DirTop').textContent(),/Y\+/);
assert.match(await page.locator('#knob img').getAttribute('src'),/goddess-ui\.webp$/,'XY must use Chang\'e art');
assert.equal(await page.locator('#knob').evaluate(el=>getComputedStyle(el).transform==='none'||el.style.transform.includes('0px')) ,true,'plane switch must return knob to origin');
await assertNoDrift('XZ→XY');
const yShell=page.locator('#yJoyV250');if(await yShell.count())assert.equal(await yShell.evaluate(el=>getComputedStyle(el).display),'none','legacy separate Y UI must be retired');
let q0=await xyz();await drag(.50,.10,105);let q1=await xyz();assert.ok(q1.y>q0.y,'XY up must Y+');assert.ok(Math.abs(q1.z-q0.z)<0.25,'XY up must not materially change Z');
await drag(.50,.90,106);let q2=await xyz();assert.ok(q2.y<q1.y,'XY down must Y-');
await drag(.90,.50,107);let q3=await xyz();assert.ok(q3.x>q2.x,'XY right must keep X+');
await visible('#knob img');

await tapCenter(202);
assert.equal(await page.locator('html').getAttribute('data-k11520-joy-plane'),'XZ','second center tap must return XZ');
assert.match(await page.locator('#k11520DirTop').textContent(),/Z\+/);
assert.match(await page.locator('#knob img').getAttribute('src'),/kgen-user-ui\.webp$/);
await assertNoDrift('XY→XZ');

await visible('#gameModeToggle');await page.locator('#gameModeToggle').click({timeout:2000});await page.waitForTimeout(120);await visible('#k11520UiSettings');
const labels=await page.locator('#k11520UiSettings .row span').allTextContents();
assert.ok(labels.includes('聊天'),'settings must replace obsolete Y with chat');
assert.ok(!labels.includes('Y 升降'),'settings must not expose obsolete Y control');
assert.ok(!labels.includes('錢包')&&!labels.includes('背包'),'wallet/backpack must not be globally collapsible');
const legacyVisible=await page.locator('.hud-drawer-toggle').evaluateAll(els=>els.filter(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0}).length);assert.equal(legacyVisible,0,'legacy scattered HUD drawer buttons must be hidden');
await visible('#walletToggle');await visible('#backpackButton');
const allSwitch=page.locator('[data-ui-key="all"]');await allSwitch.click();await page.waitForTimeout(100);await visible('#walletToggle');await visible('#backpackButton');await visible('#gameModeToggle');await allSwitch.click();await page.waitForTimeout(100);
page.locator('#k11520UiSettingsClose').click();

await page.locator('#walletToggle').click({timeout:2000});await page.waitForTimeout(100);assert.equal(await page.locator('#walletPanel').evaluate(el=>el.classList.contains('collapsed')),false,'wallet must expand');await visible('#walletConnect');
await visible('#backpackButton');
await page.screenshot({path:`${OUT}/11520-mobile-390x844.png`,fullPage:true});
await fs.writeFile(`${OUT}/11520-xzxy-layout.json`,JSON.stringify({capturedAt:new Date().toISOString(),organ:'XZXY Joystick',mode:await page.locator('html').getAttribute('data-k11520-joy-plane'),xyz:await xyz(),version:await page.locator('.brandMetaV250 span:first-child').textContent().catch(()=>null),uiSettings:await page.evaluate(()=>globalThis.__K11520_UI_SETTINGS__||null),joystick:await page.evaluate(()=>globalThis.__K11520_JOYSTICK_XZXY__||null)},null,2));
await browser.close();
console.log('11520 XZXY + unified UI settings browser QA PASS');
