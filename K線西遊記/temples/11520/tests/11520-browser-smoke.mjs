import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'commit',timeout:15000});
await page.waitForSelector('#joy',{state:'attached',timeout:5000});
// Runtime readiness is separate from HTML shell arrival. This catches CDN/module boot failures explicitly.
await page.waitForFunction(()=>document.getElementById('joy')?.dataset.mobileClearance==='PASS',{timeout:60000});
await page.waitForTimeout(250);
assert.deepEqual(errors,[],'boot page errors: '+errors.join('\n'));

if(await page.locator('#intro11520').count()){
  const enter=page.locator('#intro11520 .introSkip').first();if(await enter.isVisible())await enter.click({timeout:3000});await page.waitForTimeout(300);
}
const assertVisible=async id=>{const loc=page.locator('#'+id),diag=await loc.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{id:el.id,display:s.display,visibility:s.visibility,w:r.width,h:r.height,x:r.x,y:r.y}});assert.ok(diag.w>0&&diag.h>0&&diag.display!=='none'&&diag.visibility!=='hidden',`control ${id} not visible: ${JSON.stringify(diag)}`)};
const intersects=(a,b)=>a&&b&&a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const xyz=async()=>{const t=await page.locator('#xyz').textContent(),m=t.match(/X\s*(-?[\d.]+).*Y\s*(-?[\d.]+).*Z\s*(-?[\d.]+)/);assert.ok(m,t);return{x:+m[1],y:+m[2],z:+m[3]}};

for(const id of ['joy','attack','skill','dodge','gameModeToggle'])await assertVisible(id);
if(await page.locator('body').evaluate(el=>el.classList.contains('game-clean-mode'))){await page.locator('#gameModeToggle').click({timeout:3000});await page.waitForTimeout(80)}
assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('game-clean-mode')),false,'settings mode did not reveal the hidden control dock');
for(const id of ['dockToggle','yControl','cControl','lotsControl'])await assertVisible(id);
const joyBox=await page.locator('#joy').boundingBox();assert.ok(joyBox);assert.ok(joyBox.x<=4,`XZ joystick not at left clearance edge: ${JSON.stringify(joyBox)}`);
for(const id of ['attack','skill','dodge','flat','orderFire']){const b=await page.locator('#'+id).boundingBox();assert.equal(intersects(joyBox,b),false,`XZ joystick overlaps ${id}`)}
const clearance=await page.locator('#joy').getAttribute('data-mobile-clearance');assert.equal(clearance,'PASS','runtime bounding-box clearance failed');

const before=await xyz(),cx=joyBox.x+joyBox.width/2,cy=joyBox.y+joyBox.height/2;
await page.dispatchEvent('#joy','pointerdown',{pointerId:11,pointerType:'touch',clientX:cx,clientY:cy});
await page.dispatchEvent('#joy','pointermove',{pointerId:11,pointerType:'touch',clientX:cx,clientY:joyBox.y+20});
await page.waitForTimeout(450);
await page.dispatchEvent('#joy','pointerup',{pointerId:11,pointerType:'touch',clientX:cx,clientY:joyBox.y+20});
const after=await xyz();assert.ok(after.z>before.z,`joystick up must be Z+: before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);

const knob=page.locator('#knob');await assertVisible('knob');const y0=(await xyz()).y;await knob.click({timeout:3000});await page.waitForTimeout(1250);const y1=(await xyz()).y;assert.ok(y1>y0,`single center tap did not start Y+: ${y0} -> ${y1}`);await knob.click({timeout:3000});await page.waitForTimeout(300);const yStop=(await xyz()).y;await page.waitForTimeout(500);assert.equal((await xyz()).y,yStop,'center tap did not stop Y auto-motion');

for(const id of ['yEnergyTap','cEnergyTap','lotsEnergyTap']){await assertVisible(id);const p=await page.locator('#'+id).boundingBox(),parent=await page.locator('#'+id).locator('..').boundingBox();assert.ok(p.y<=parent.y+40,`${id} is not fixed near panel top`)}
const lots0=await page.locator('#lotsRead').textContent();await page.locator('#lotsEnergyTap').click({timeout:3000});await page.waitForTimeout(40);assert.notEqual(await page.locator('#lotsRead').textContent(),lots0,'Lots top icon is decorative instead of interactive');

await page.locator('#dockToggle').click({timeout:3000});await page.locator('#rail [data-organ="worldmap"]').click({timeout:3000});await page.waitForTimeout(80);await assertVisible('fullMap');const mapBox=await page.locator('#fullMap').boundingBox();assert.ok(mapBox);await page.mouse.click(mapBox.x+mapBox.width*.72,mapBox.y+mapBox.height*.72);await page.waitForTimeout(80);assert.ok(await page.locator('#waypointAction').count(),'empty map click did not create waypoint action');await page.locator('#waypointAction').click({timeout:3000});await page.waitForTimeout(120);assert.match(await page.locator('#navState').textContent(),/前往中|目標/);
await page.locator('#sheetClose').click({timeout:3000});

await page.locator('#dockToggle').click({timeout:3000});await page.locator('#rail [data-organ="worldmap"]').click({timeout:3000});await page.waitForTimeout(60);
const info=await page.evaluate(async()=>{const m=await import('./runtime/map-object-navigation-runtime.mjs');return m.describeWorldEntity({id:'ATM-11520-001',kind:'ATM',name:'行動 ATM 飛碟站',lifeId:'LIFE-ATM-11520-001',x:8,y:0,z:5})});assert.equal(info.lifeId,'LIFE-ATM-11520-001');assert.equal(info.objectType,'ATM');
await page.locator('#sheetClose').click({timeout:3000});

await assertVisible('aiChatButton');await page.locator('#aiChatButton').click({timeout:3000});await page.waitForTimeout(30);assert.equal(await page.locator('#aiChatPanel').evaluate(el=>el.classList.contains('open')),true);
await page.locator('#aiInput').fill('宇宙樓層');await page.locator('#aiSend').click({timeout:3000});await page.waitForTimeout(60);assert.match(await page.locator('#aiMsgs').textContent(),/B12|k=4/,'AI send/reply compatibility regression');await page.locator('#aiClose').click({timeout:3000});

assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));
await browser.close();
console.log('11520 canonical 390x844 browser smoke PASS');
