import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const ARTIFACT_DIR='artifacts/11520-visual-qa';
await fs.mkdir(ARTIFACT_DIR,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1800);
if(await page.locator('#intro11520').count())await page.locator('#enter11520').click({timeout:1500}).catch(()=>{});
await page.waitForTimeout(350);
assert.deepEqual(errors,[],'boot page errors: '+errors.join('\n'));

const visible=async s=>{const d=await page.locator(s).evaluate(el=>{const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height,display:cs.display,visibility:cs.visibility,pointer:cs.pointerEvents,text:(el.textContent||'').trim()}});assert.ok(d.w>0&&d.h>0&&d.display!=='none'&&d.visibility!=='hidden',`${s} not visible: ${JSON.stringify(d)}`);return d};
const hidden=async s=>{const n=page.locator(s);if(!await n.count())return true;return n.evaluate(el=>{const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return cs.display==='none'||cs.visibility==='hidden'||cs.opacity==='0'||r.width===0||r.height===0})};
const xyz=async()=>{const t=await page.locator('#xyz').textContent();const m=String(t).match(/X\s*(-?\d+(?:\.\d+)?)\s*·\s*Y\s*(-?\d+(?:\.\d+)?)\s*·\s*Z\s*(-?\d+(?:\.\d+)?)/);assert.ok(m,'XYZ HUD parse failed: '+t);return{x:+m[1],y:+m[2],z:+m[3]}};
const energy=async()=>page.evaluate(()=>Number(globalThis.__K11520_LOGICAL_ENERGY_LEVEL__));
const fairyDrag=async(nx,ny,moves=7)=>{const b=await page.locator('#fairyXY11520').boundingBox();assert.ok(b,'fairy control missing box');const sx=b.x+b.width/2,sy=b.y+b.height/2,tx=sx+nx*b.width*.34,ty=sy-ny*b.height*.34;await page.mouse.move(sx,sy);await page.mouse.down();for(let i=1;i<=moves;i++){await page.mouse.move(sx+(tx-sx)*i/moves,sy+(ty-sy)*i/moves,{steps:2});await page.waitForTimeout(35)}await page.mouse.up();await page.waitForTimeout(180)};
const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y));

for(const s of ['#joy','#knob img','#attack','#skill','#dodge','#gameModeToggle','#fairyXY11520','#fairyKnob11520','#bgmButton'])await visible(s);
assert.equal(await hidden('#lotsControl'),true,'duplicate lots control must be hidden');
assert.equal(await hidden('#cControl'),true,'duplicate C control must be hidden');
assert.equal(await hidden('#yControl'),true,'legacy duplicate Y slider must be hidden');
assert.equal(await hidden('#yJoyV250'),true,'legacy Y fairy must be hidden in favor of direct XY fairy');

const f=await visible('#fairyXY11520');const dodge=await visible('#dodge');assert.equal(overlap(f,dodge),0,'fairy control overlaps dodge');
const hit=await page.locator('#fairyXY11520').evaluate(el=>{const r=el.getBoundingClientRect();return document.elementsFromPoint(r.x+r.width/2,r.y+r.height/2).slice(0,6).map(x=>x.id)});assert.ok(hit.includes('fairyXY11520')||hit.includes('fairyKnob11520'),`fairy center is blocked: ${JSON.stringify(hit)}`);

let p0=await xyz();await fairyDrag(.95,0);let p1=await xyz();assert.ok(p1.x>p0.x,`fairy right must move screen/world X+: ${JSON.stringify({p0,p1})}`);
await page.screenshot({path:`${ARTIFACT_DIR}/11520-fairy-x-right.png`,fullPage:true});
await fairyDrag(-.95,0);let p2=await xyz();assert.ok(p2.x<p1.x,`fairy left must move X-: ${JSON.stringify({p1,p2})}`);

let e0=await energy(),y0=(await xyz()).y;await fairyDrag(0,.95,10);let e1=await energy(),y1=(await xyz()).y;assert.ok(e1>e0,`fairy up must increase logical energy: ${e0} -> ${e1}`);assert.ok(y1>=y0,`fairy up must not lower rendered Y: ${y0} -> ${y1}`);
await fairyDrag(0,-.95,18);let e2=await energy();assert.ok(e2<e1,`fairy down must decrease logical energy: ${e1} -> ${e2}`);
for(let i=0;i<5&&await energy()>=0;i++)await fairyDrag(0,-1,18);
const eNeg=await energy();assert.ok(eNeg<0,`logical energy must support negatives, got ${eNeg}`);const yGround=(await xyz()).y;assert.ok(yGround>=0,`rendered ground Y must not go below floor when logical energy is negative: ${yGround}`);

const beforeDiag=await xyz(),beforeDiagE=await energy();await fairyDrag(.8,.8,10);const afterDiag=await xyz(),afterDiagE=await energy();assert.ok(afterDiag.x>beforeDiag.x,'diagonal right-up must include X+');assert.ok(afterDiagE>beforeDiagE,'diagonal right-up must include energy+');
const knobTransform=await page.locator('#fairyKnob11520').evaluate(el=>getComputedStyle(el).transform);assert.ok(knobTransform==='none'||/matrix\(1, 0, 0, 1, 0, 0\)/.test(knobTransform),`fairy knob must return to center after release: ${knobTransform}`);

const bgm=page.locator('#bgmButton');await bgm.click({timeout:3000});await page.waitForTimeout(180);assert.match((await bgm.textContent())||'',/ON/,'music button must enter ON state');const audioOn=await page.evaluate(()=>globalThis.__K11520_FAIRY_FLIGHT_BGM__);assert.equal(!!audioOn,true,'original BGM runtime not installed');assert.match(String(audioOn.bgm),/original-web-audio/,'original BGM identity missing');await bgm.click({timeout:3000});await page.waitForTimeout(180);assert.match((await bgm.textContent())||'',/OFF/,'music button must enter OFF state');await bgm.click({timeout:3000});await page.waitForTimeout(180);assert.match((await bgm.textContent())||'',/ON/,'music button must resume');await bgm.click({timeout:3000});

const visual=await page.evaluate(()=>{const box=s=>{const el=document.querySelector(s);if(!el)return null;const r=el.getBoundingClientRect(),cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||r.width<=0||r.height<=0)return null;return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height,text:(el.textContent||'').trim()}};return{viewport:{w:innerWidth,h:innerHeight},fairy:box('#fairyXY11520'),joy:box('#joy'),dodge:box('#dodge'),music:box('#bgmButton'),wallet:box('#walletPanel'),version:document.querySelector('.brandMetaV250 span:first-child')?.textContent||'',logicalEnergy:globalThis.__K11520_LOGICAL_ENERGY_LEVEL__,runtime:globalThis.__K11520_FAIRY_FLIGHT_BGM__}});
for(const [name,b] of Object.entries({fairy:visual.fairy,joy:visual.joy,dodge:visual.dodge,music:visual.music}))if(b)assert.ok(b.x>=-1&&b.right<=391&&b.y>=-1&&b.bottom<=845,`${name} outside viewport ${JSON.stringify(b)}`);
assert.match(visual.version,/V2\.6\.16/,'visible product version stale: '+visual.version);
await page.screenshot({path:`${ARTIFACT_DIR}/11520-mobile-390x844.png`,fullPage:true});
await fs.writeFile(`${ARTIFACT_DIR}/11520-mobile-layout.json`,JSON.stringify({capturedAt:new Date().toISOString(),...visual,acceptance:{duplicateC:false,duplicateLots:false,legacyY:false,signedEnergy:eNeg,rightX:true,leftX:true,diagonal:true,returnCenter:true,music:true}},null,2));
assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));
await browser.close();console.log('11520 V2.6.16 fairy XY + signed energy + original BGM mobile acceptance PASS');
