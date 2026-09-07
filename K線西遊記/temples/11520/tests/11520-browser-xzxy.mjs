import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const OUT='artifacts/11520-visual-qa';
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1700);
if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click({timeout:1500}).catch(()=>{});
await page.locator('#intro11520').waitFor({state:'hidden',timeout:3000}).catch(()=>{});
await page.waitForTimeout(500);
assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));

const xyz=async()=>{const t=await page.locator('#xyz').textContent();const m=String(t).match(/X\s*(-?\d+(?:\.\d+)?)\s*·\s*Y\s*(-?\d+(?:\.\d+)?)\s*·\s*Z\s*(-?\d+(?:\.\d+)?)/);assert.ok(m,'XYZ parse failed: '+t);return{x:+m[1],y:+m[2],z:+m[3]}};
const drag=async(toX,toY,id)=>{const b=await page.locator('#joy').boundingBox();assert.ok(b,'joy missing');const p=(x,y,buttons=1)=>({pointerId:id,pointerType:'touch',clientX:b.x+b.width*x,clientY:b.y+b.height*y,buttons});await page.dispatchEvent('#joy','pointerdown',p(.5,.5));await page.dispatchEvent('#joy','pointermove',p(toX,toY));await page.waitForTimeout(280);await page.dispatchEvent('#joy','pointerup',p(toX,toY,0));await page.waitForTimeout(80)};
const visible=async sel=>{const r=await page.locator(sel).evaluate(el=>{const b=el.getBoundingClientRect(),s=getComputedStyle(el);return{w:b.width,h:b.height,display:s.display,visibility:s.visibility,opacity:s.opacity}});assert.ok(r.w>0&&r.h>0&&r.display!=='none'&&r.visibility!=='hidden'&&r.opacity!=='0',`${sel} not visible ${JSON.stringify(r)}`)};

await visible('#joy');await visible('#knob img');
assert.equal(await page.locator('html').getAttribute('data-k11520-joy-plane'),'XZ','default joystick plane must be XZ');
let p0=await xyz();await drag(.90,.50,101);let p1=await xyz();assert.ok(p1.x>p0.x,'XZ right must X+');
await drag(.10,.50,102);let p2=await xyz();assert.ok(p2.x<p1.x,'XZ left must X-');
await drag(.50,.10,103);let p3=await xyz();assert.ok(p3.z>p2.z,'XZ up must Z+');
await drag(.50,.90,104);let p4=await xyz();assert.ok(p4.z<p3.z,'XZ down must Z-');
await visible('#knob img');

await page.locator('#knob').click({timeout:2000});await page.waitForTimeout(120);
assert.equal(await page.locator('html').getAttribute('data-k11520-joy-plane'),'XY','center image tap must switch to XY');
assert.match(await page.locator('#k11520PlaneLabel').textContent(),/XY/);
assert.match(await page.locator('#k11520DirTop').textContent(),/Y\+/);
assert.match(await page.locator('#knob img').getAttribute('alt'),/XY/);
const yShell=page.locator('#yJoyV250');if(await yShell.count())assert.equal(await yShell.evaluate(el=>getComputedStyle(el).display),'none','legacy separate Y UI must be retired');
let q0=await xyz();await drag(.50,.10,105);let q1=await xyz();assert.ok(q1.y>q0.y,'XY up must Y+');assert.ok(Math.abs(q1.z-q0.z)<0.25,'XY up must not materially change Z');
await drag(.50,.90,106);let q2=await xyz();assert.ok(q2.y<q1.y,'XY down must Y-');
await drag(.90,.50,107);let q3=await xyz();assert.ok(q3.x>q2.x,'XY right must keep X+');
await visible('#knob img');

await page.locator('#knob').click({timeout:2000});await page.waitForTimeout(120);
assert.equal(await page.locator('html').getAttribute('data-k11520-joy-plane'),'XZ','second center tap must return XZ');
assert.match(await page.locator('#k11520DirTop').textContent(),/Z\+/);

await visible('#walletToggle');await page.locator('#walletToggle').click({timeout:2000});await page.waitForTimeout(100);assert.equal(await page.locator('#walletPanel').evaluate(el=>el.classList.contains('collapsed')),false,'wallet must expand');await visible('#walletConnect');
await visible('#backpackButton');
await page.screenshot({path:`${OUT}/11520-mobile-390x844.png`,fullPage:true});
await fs.writeFile(`${OUT}/11520-xzxy-layout.json`,JSON.stringify({capturedAt:new Date().toISOString(),organ:'XZXY Joystick',mode:await page.locator('html').getAttribute('data-k11520-joy-plane'),xyz:await xyz(),version:await page.locator('.brandMetaV250 span:first-child').textContent().catch(()=>null)},null,2));
await browser.close();
console.log('11520 XZXY browser QA PASS');
