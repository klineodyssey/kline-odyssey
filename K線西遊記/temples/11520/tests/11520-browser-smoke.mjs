import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1200);
assert.deepEqual(errors,[],'boot page errors: '+errors.join('\n'));

if(await page.locator('#intro11520').count()){
  const enter=page.locator('#enter11520');
  if(await enter.isVisible())await enter.click({timeout:3000});
  await page.waitForTimeout(700);
}

const assertVisible=async selector=>{
  const loc=page.locator(selector);
  const diag=await loc.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{id:el.id,display:s.display,visibility:s.visibility,opacity:s.opacity,w:r.width,h:r.height,x:r.x,y:r.y}});
  assert.ok(diag.w>0&&diag.h>0&&diag.display!=='none'&&diag.visibility!=='hidden',`control ${selector} not visible: ${JSON.stringify(diag)}`);
  return diag;
};
const intersects=(a,b)=>a&&b&&a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const xyz=async()=>{
  const t=await page.locator('#xyz').textContent();
  const m=String(t).match(/X\s*(-?\d+(?:\.\d+)?)\s*·\s*Y\s*(-?\d+(?:\.\d+)?)\s*·\s*Z\s*(-?\d+(?:\.\d+)?)/);
  assert.ok(m,'XYZ HUD parse failed: '+t);
  return{x:+m[1],y:+m[2],z:+m[3]};
};
const dragPointer=async(selector,{fromX=.5,fromY=.5,toX=.5,toY=.5,pointerId=41,hold=260}={})=>{
  const b=await page.locator(selector).boundingBox();assert.ok(b,selector+' missing box');
  const p=(x,y)=>({pointerId,pointerType:'touch',clientX:b.x+b.width*x,clientY:b.y+b.height*y,buttons:1});
  await page.dispatchEvent(selector,'pointerdown',p(fromX,fromY));
  await page.dispatchEvent(selector,'pointermove',p(toX,toY));
  await page.waitForTimeout(hold);
  await page.dispatchEvent(selector,'pointerup',{...p(toX,toY),buttons:0});
};

for(const id of ['joy','attack','skill','dodge','gameModeToggle'])await assertVisible('#'+id);
for(const id of ['attack','skill','dodge']){await page.locator('#'+id).click({timeout:3000});await page.waitForTimeout(20)}

// Human-approved XZ organ: image thumb moves, right=X+, left=X-, up=Z+, down=Z-.
const joyBox=await page.locator('#joy').boundingBox();assert.ok(joyBox);
for(const id of ['attack','skill','dodge','flat','orderFire']){
  const b=await page.locator('#'+id).boundingBox();
  assert.equal(intersects(joyBox,b),false,`XZ joystick overlaps ${id}: joy=${JSON.stringify(joyBox)} target=${JSON.stringify(b)}`);
}
await assertVisible('#knob img');
let p0=await xyz();
await dragPointer('#joy',{toX:.90,toY:.50,pointerId:51});
let p1=await xyz();assert.ok(p1.x>p0.x,`right drag must increase X: ${JSON.stringify({p0,p1})}`);
await dragPointer('#joy',{toX:.10,toY:.50,pointerId:52});
let p2=await xyz();assert.ok(p2.x<p1.x,`left drag must decrease X: ${JSON.stringify({p1,p2})}`);
await dragPointer('#joy',{toX:.50,toY:.10,pointerId:53});
let p3=await xyz();assert.ok(p3.z>p2.z,`up drag must increase Z: ${JSON.stringify({p2,p3})}`);
await dragPointer('#joy',{toX:.50,toY:.90,pointerId:54});
let p4=await xyz();assert.ok(p4.z<p3.z,`down drag must decrease Z: ${JSON.stringify({p3,p4})}`);

// Enter settings/control screen so Y/C/lots organs are available for direct mobile QA.
await page.locator('#gameModeToggle').click({timeout:3000});
await page.waitForTimeout(120);
for(const id of ['walletToggle','dockToggle','orderFire','tradeSword','flat','aiChatButton','bgmButton'])await assertVisible('#'+id);

// Human-approved Y organ: fairy image is the moving thumb; up=Y+, down=Y-.
await assertVisible('#yJoyV250');
await assertVisible('#yJoyV250 .yKnob img');
const y0=(await xyz()).y;
await dragPointer('#yJoyV250',{toX:.5,toY:.12,pointerId:61,hold:360});
const y1=(await xyz()).y;assert.ok(y1>y0,`Y up must increase altitude: ${y0} -> ${y1}`);
await dragPointer('#yJoyV250',{toX:.5,toY:.88,pointerId:62,hold:360});
const y2=(await xyz()).y;assert.ok(y2<y1,`Y down must decrease altitude: ${y1} -> ${y2}`);

// Lots and C: the images themselves are draggable thumbs, values update live and remain after release.
await assertVisible('#lotsThumb img');
await assertVisible('#cThumb img');
const lots0=await page.locator('#lotsRead').textContent();
await dragPointer('#lotsControl',{toX:.5,toY:.10,pointerId:71});
const lots1=await page.locator('#lotsRead').textContent();assert.notEqual(lots1,lots0,'lots did not change while dragging KGEN thumb');
await page.waitForTimeout(120);assert.equal(await page.locator('#lotsRead').textContent(),lots1,'lots did not retain released level');
const c0=await page.locator('#cRead').textContent();
await dragPointer('#cControl',{toX:.5,toY:.10,pointerId:72});
const c1=await page.locator('#cRead').textContent();assert.notEqual(c1,c0,'C warp did not change while dragging UFO thumb');
await page.waitForTimeout(120);assert.equal(await page.locator('#cRead').textContent(),c1,'C warp did not retain released level');

// Known retired center interceptor must not block the 3D world.
if(await page.locator('#lookPad').count()){
  const look=await page.locator('#lookPad').evaluate(el=>({display:getComputedStyle(el).display,pointer:getComputedStyle(el).pointerEvents}));
  assert.ok(look.display==='none'||look.pointer==='none','lookPad still intercepts the world: '+JSON.stringify(look));
}
const centerHit=await page.evaluate(()=>{
  const x=innerWidth*.5,y=innerHeight*.58;
  return document.elementsFromPoint(x,y).map(el=>({id:el.id,cls:String(el.className||''),tag:el.tagName})).slice(0,8);
});
assert.ok(centerHit.some(x=>x.id==='three'),`3D canvas is not reachable at center: ${JSON.stringify(centerHit)}`);
assert.equal(centerHit.some(x=>x.id==='lookPad'),false,`retired lookPad still occupies center: ${JSON.stringify(centerHit)}`);

// AI panel opens and closes.
await page.locator('#aiChatButton').click({timeout:3000});await page.waitForTimeout(30);
assert.equal(await page.locator('#aiChatPanel').evaluate(el=>el.classList.contains('open')),true,'AI chat did not open');
await page.locator('#aiClose').click({timeout:3000});await page.waitForTimeout(30);
assert.equal(await page.locator('#aiChatPanel').evaluate(el=>el.classList.contains('open')),false,'AI chat did not close');

// Wallet valve stays near its location and the organ expands/collapses.
const toggleBefore=await page.locator('#walletToggle').boundingBox();assert.ok(toggleBefore);
await page.locator('#walletToggle').click({timeout:3000});await page.waitForTimeout(80);
assert.equal(await page.locator('#walletPanel').evaluate(el=>el.classList.contains('collapsed')),false,'wallet did not expand');
await page.locator('#walletToggle').click({timeout:3000});await page.waitForTimeout(80);
assert.equal(await page.locator('#walletPanel').evaluate(el=>el.classList.contains('collapsed')),true,'wallet did not collapse');
const toggleAfter=await page.locator('#walletToggle').boundingBox();assert.ok(toggleAfter);
assert.ok(Math.abs(toggleAfter.x-toggleBefore.x)<16&&Math.abs(toggleAfter.y-toggleBefore.y)<16,'wallet toggle moved away after expand/collapse');

// All 14 formal organs remain reachable through the top-layer dock rail.
assert.equal(await page.locator('#rail [data-organ]').count(),14);
await page.locator('#dockToggle').click({timeout:3000});
for(const id of ['trade','positions','orders','history','assets','records','market','bag','character','worldmap','atm','settings','help']){
  await page.locator(`#rail [data-organ="${id}"]`).click({timeout:3000});
  await page.waitForTimeout(20);
  assert.equal(await page.locator('#sheet').evaluate(el=>el.classList.contains('open')),true,`organ ${id} did not open`);
  await page.locator('#sheetClose').click({timeout:3000});
  await page.locator('#dockToggle').click({timeout:3000});
}

await page.locator('#walletConnect').click({timeout:3000});await page.waitForTimeout(50);
assert.ok((await page.locator('#walletMsg').textContent()).length>0);

assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));
await browser.close();
console.log('11520 V2.5 approved mobile browser smoke PASS');
