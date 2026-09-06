import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const ARTIFACT_DIR='artifacts/11520-visual-qa';
await fs.mkdir(ARTIFACT_DIR,{recursive:true});

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
  const d=await loc.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{display:s.display,visibility:s.visibility,w:r.width,h:r.height,x:r.x,y:r.y,right:r.right,bottom:r.bottom}});
  assert.ok(d.w>0&&d.h>0&&d.display!=='none'&&d.visibility!=='hidden',`${selector} not visible: ${JSON.stringify(d)}`);
  return d;
};
const xyz=async()=>{
  const t=await page.locator('#xyz').textContent();
  const m=String(t).match(/X\s*(-?\d+(?:\.\d+)?)\s*·\s*Y\s*(-?\d+(?:\.\d+)?)\s*·\s*Z\s*(-?\d+(?:\.\d+)?)/);
  assert.ok(m,'XYZ HUD parse failed: '+t);return{x:+m[1],y:+m[2],z:+m[3]};
};
const dragReal=async(selector,toX,toY,hold=260)=>{
  const b=await page.locator(selector).boundingBox();assert.ok(b,selector+' missing box');
  const sx=b.x+b.width*.5,sy=b.y+b.height*.5,tx=b.x+b.width*toX,ty=b.y+b.height*toY;
  await page.mouse.move(sx,sy);await page.mouse.down();await page.mouse.move(tx,ty,{steps:5});await page.waitForTimeout(hold);await page.mouse.up();
};
const dragVertical=async(selector,toY,pointerId)=>{
  const b=await page.locator(selector).boundingBox();assert.ok(b,selector+' missing box');
  const p=(y,buttons=1)=>({pointerId,pointerType:'touch',clientX:b.x+b.width*.5,clientY:b.y+b.height*y,buttons});
  await page.dispatchEvent(selector,'pointerdown',p(.5));await page.dispatchEvent(selector,'pointermove',p(toY));await page.waitForTimeout(80);await page.dispatchEvent(selector,'pointerup',p(toY,0));
};
const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y));

for(const id of ['joy','attack','skill','dodge','gameModeToggle'])await assertVisible('#'+id);
await assertVisible('#knob img');
let a=await xyz();await dragReal('#joy',.9,.5);let b=await xyz();assert.ok(b.x>a.x,'right must X+');
await dragReal('#joy',.1,.5);let c=await xyz();assert.ok(c.x<b.x,'left must X-');
await dragReal('#joy',.5,.1);let d=await xyz();assert.ok(d.z>c.z,'up must Z+');
await dragReal('#joy',.5,.9);let e=await xyz();assert.ok(e.z<d.z,'down must Z-');

await page.locator('#gameModeToggle').click({timeout:3000});await page.waitForTimeout(120);
for(const id of ['walletToggle','dockToggle','orderFire','tradeSword','flat','aiChatButton','bgmButton'])await assertVisible('#'+id);
await assertVisible('#yJoyV250 .yKnob img');
const y0=(await xyz()).y;await dragReal('#yJoyV250 .yKnob',.5,.05,360);const y1=(await xyz()).y;assert.ok(y1>y0,'Y up must increase altitude');
await dragReal('#yJoyV250 .yKnob',.5,.95,360);const y2=(await xyz()).y;assert.ok(y2<y1,'Y down must decrease altitude');

await assertVisible('#lotsThumb img');await assertVisible('#cThumb img');
const l0=await page.locator('#lotsRead').textContent();await dragVertical('#lotsControl',.1,71);const l1=await page.locator('#lotsRead').textContent();assert.notEqual(l1,l0,'lots must change');await page.waitForTimeout(120);assert.equal(await page.locator('#lotsRead').textContent(),l1,'lots must retain');
const c0=await page.locator('#cRead').textContent();await dragVertical('#cControl',.1,72);const c1=await page.locator('#cRead').textContent();assert.notEqual(c1,c0,'C must change');await page.waitForTimeout(120);assert.equal(await page.locator('#cRead').textContent(),c1,'C must retain');

if(await page.locator('#lookPad').count()){
  const look=await page.locator('#lookPad').evaluate(el=>({display:getComputedStyle(el).display,pointer:getComputedStyle(el).pointerEvents}));
  assert.ok(look.display==='none'||look.pointer==='none','lookPad still intercepts world');
}
const centerHit=await page.evaluate(()=>document.elementsFromPoint(innerWidth*.5,innerHeight*.58).map(el=>({id:el.id,cls:el.className})).slice(0,10));
assert.ok(centerHit.some(x=>x.id==='three'),`3D canvas unreachable: ${JSON.stringify(centerHit)}`);assert.equal(centerHit.some(x=>x.id==='lookPad'),false,'lookPad occupies center');

/* Visual geometry gate: a functional PASS is not enough if visible controls collide. */
const visual=await page.evaluate(()=>{
  const box=s=>{const el=document.querySelector(s);if(!el)return null;const r=el.getBoundingClientRect(),cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||r.width<=0||r.height<=0)return null;return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height}};
  const blockers=[...document.body.children].map(el=>{const r=el.getBoundingClientRect(),cs=getComputedStyle(el),txt=(el.textContent||'').replace(/\s+/g,'').trim(),hasUseful=!!el.querySelector?.('button,input,select,textarea,img,canvas,svg,a,[role="button"]');return{id:el.id,cls:String(el.className||''),r:{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height},position:cs.position,display:cs.display,pointer:cs.pointerEvents,txt,hasUseful}}).filter(x=>['fixed','absolute'].includes(x.position)&&x.display!=='none'&&x.r.w>innerWidth*.45&&x.r.h>=24&&x.r.h<=110&&x.r.y>innerHeight*.48&&x.r.bottom<innerHeight*.82&&!x.hasUseful&&x.txt.length===0);
  return{viewport:{w:innerWidth,h:innerHeight},boxes:{joy:box('#joy'),y:box('#yJoyV250'),sliders:box('.sliderDock'),combat:box('.controls'),bag:box('.bagRelocatedV250'),dock:box('#dock'),ai:box('#aiChatButton'),bgm:box('#bgmButton'),wallet:box('#walletPanel')},blockers,version:document.querySelector('.brandMetaV250 span:first-child')?.textContent||''};
});
const {boxes}=visual;
for(const [name,v] of Object.entries(boxes))if(v)assert.ok(v.x>=-1&&v.right<=391&&v.y>=-1&&v.bottom<=845,`${name} outside viewport: ${JSON.stringify(v)}`);
if(boxes.y&&boxes.dock)assert.equal(overlap(boxes.y,boxes.dock),0,'Y control overlaps dock');
if(boxes.y&&boxes.bag)assert.equal(overlap(boxes.y,boxes.bag),0,'Y control overlaps backpack');
if(boxes.sliders&&boxes.combat)assert.equal(overlap(boxes.sliders,boxes.combat),0,'C/lots sliders overlap combat dashboard');
assert.equal(visual.blockers.length,0,'large empty center blocker(s): '+JSON.stringify(visual.blockers));
assert.match(visual.version,/V2\.5\.5/,'visible product version is stale: '+visual.version);

await page.screenshot({path:`${ARTIFACT_DIR}/11520-mobile-390x844.png`,fullPage:true});
await fs.writeFile(`${ARTIFACT_DIR}/11520-mobile-layout.json`,JSON.stringify({capturedAt:new Date().toISOString(),...visual,centerHit},null,2));

await page.locator('#aiChatButton').click({timeout:3000});await page.waitForTimeout(30);assert.equal(await page.locator('#aiChatPanel').evaluate(el=>el.classList.contains('open')),true,'AI did not open');
await page.locator('#aiClose').click({timeout:3000});await page.waitForTimeout(30);assert.equal(await page.locator('#aiChatPanel').evaluate(el=>el.classList.contains('open')),false,'AI did not close');

const toggleBefore=await page.locator('#walletToggle').boundingBox();assert.ok(toggleBefore);
await page.locator('#walletToggle').click({timeout:3000});await page.waitForTimeout(80);assert.equal(await page.locator('#walletPanel').evaluate(el=>el.classList.contains('collapsed')),false,'wallet did not expand');
await assertVisible('#walletConnect');await page.locator('#walletConnect').click({timeout:3000});await page.waitForTimeout(50);assert.ok((await page.locator('#walletMsg').textContent()).length>0,'wallet message missing');
await page.locator('#walletToggle').click({timeout:3000});await page.waitForTimeout(80);assert.equal(await page.locator('#walletPanel').evaluate(el=>el.classList.contains('collapsed')),true,'wallet did not collapse');
const toggleAfter=await page.locator('#walletToggle').boundingBox();assert.ok(toggleAfter);assert.ok(Math.abs(toggleAfter.x-toggleBefore.x)<16&&Math.abs(toggleAfter.y-toggleBefore.y)<16,'wallet toggle moved after collapse');

assert.equal(await page.locator('#rail [data-organ]').count(),14);
await page.locator('#dockToggle').click({timeout:3000});
for(const id of ['trade','positions','orders','history','assets','records','market','bag','character','worldmap','atm','settings','help']){
  await page.locator(`#rail [data-organ="${id}"]`).click({timeout:3000});await page.waitForTimeout(20);
  assert.equal(await page.locator('#sheet').evaluate(el=>el.classList.contains('open')),true,`organ ${id} did not open`);
  await page.locator('#sheetClose').click({timeout:3000});await page.locator('#dockToggle').click({timeout:3000});
}

assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));
await browser.close();
console.log('11520 V2.5.5 mobile functional + visual geometry smoke PASS');
