import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const OUT='artifacts/11520-visual-qa';
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
async function boot(){
  await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(1900);
  if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click({timeout:1500}).catch(()=>{});
  await page.locator('#intro11520').waitFor({state:'hidden',timeout:3000}).catch(()=>{});
  await page.waitForTimeout(900);
  assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));
}
await boot();

const box=async sel=>{const b=await page.locator(sel).boundingBox();assert.ok(b,`${sel} missing`);return b};
const visible=async sel=>page.locator(sel).evaluate(el=>{const s=getComputedStyle(el),b=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&b.width>0&&b.height>0});
const centerReachable=async sel=>page.locator(sel).evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!hit&&(hit===el||el.contains(hit))});
const rectsClose=(a,b,tol=1)=>Math.abs(a.x-b.x)<=tol&&Math.abs(a.y-b.y)<=tol&&Math.abs(a.width-b.width)<=tol&&Math.abs(a.height-b.height)<=tol;

const hq=(await page.locator('.brand .hqLine').textContent()||'').trim();
const meta=(await page.locator('.brand .brandMetaV250').textContent()||'').trim();
assert.ok(!hq.includes('華爾街'),`華爾街 must move off first line: ${hq}`);
assert.ok(meta.includes('華爾街'),`華爾街 must be on second line: ${meta}`);

const axes=await box('.axes'),worldHud=await box('.tele'),lifeHud=await box('.monsterHud');
assert.ok(worldHud.y>=axes.y+axes.height+8,`world HUD must clear market cards: ${JSON.stringify({axes,worldHud})}`);
assert.ok(lifeHud.y>=axes.y+axes.height+8,`life HUD must clear market cards: ${JSON.stringify({axes,lifeHud})}`);
assert.ok(Math.abs(worldHud.width-lifeHud.width)<2,`world/life HUD widths must match: ${worldHud.width}/${lifeHud.width}`);

const c=await box('#cControl'),lots=await box('#lotsControl'),rail=await box('#yControl');
assert.ok(Math.abs(c.y-lots.y)<2&&Math.abs(lots.y-rail.y)<2,`C/lots/remaining-axis rails must align: ${JSON.stringify({c,lots,rail})}`);
assert.ok(c.x+c.width<=lots.x&&lots.x+lots.width<=rail.x,'three rails must be ordered C → lots → remaining-axis without overlap');
assert.ok(lots.x-(c.x+c.width)>=6&&rail.x-(lots.x+lots.width)>=6,'three rails need readable visual gutters');
assert.ok(rail.y+rail.height<=844,'three-rail group must remain inside 390x844 viewport');
const trackBg=await page.locator('#yControl .track').evaluate(el=>getComputedStyle(el).backgroundImage);
assert.match(trackBg,/linear-gradient/i,'remaining-axis track must encode positive/negative energy zones');

const expectedAxis={XZ:'Y',XY:'Z',YZ:'X'};
async function setPlane(target){
  for(let i=0;i<3;i++){
    const current=await page.locator('html').getAttribute('data-k11520-joy-plane');
    if(current===target)return;
    const knob=await box('#knob'),x=knob.x+knob.width/2,y=knob.y+knob.height/2;
    await page.mouse.move(x,y);await page.mouse.down();await page.mouse.up();await page.waitForTimeout(150);
  }
  assert.equal(await page.locator('html').getAttribute('data-k11520-joy-plane'),target,`failed to switch to ${target}`);
}
let energyPointerId=800;
async function pressEnergy(sign){
  const b=await box('#yControl'),id=energyPointerId++;
  const cx=b.x+b.width/2,cy=b.y+b.height/2,targetY=sign>0?b.y+b.height*.14:b.y+b.height*.86;
  await page.dispatchEvent('#yControl','pointerdown',{pointerId:id,pointerType:'touch',clientX:cx,clientY:cy,buttons:1});
  await page.dispatchEvent('#yControl','pointermove',{pointerId:id,pointerType:'touch',clientX:cx,clientY:targetY,buttons:1});
  await page.waitForTimeout(220);
  return async()=>{await page.dispatchEvent('#yControl','pointerup',{pointerId:id,pointerType:'touch',clientX:cx,clientY:targetY,buttons:0});await page.waitForTimeout(120)};
}

for(const mode of ['XZ','XY','YZ']){
  await setPlane(mode);await page.waitForTimeout(160);
  const label=(await page.locator('#yControl label').textContent()||'').trim();
  assert.ok(label.startsWith(expectedAxis[mode]+' 縱搖桿'),`${mode} normal axis must be ${expectedAxis[mode]}: ${label}`);
  assert.ok(label.includes('中性能階'),`${mode} zero state must be neutral energy: ${label}`);
}
await setPlane('XZ');await page.waitForTimeout(160);
assert.equal(await page.locator('#yControl').getAttribute('data-energy-sign'),'zero','boot/reset normal-axis energy must be neutral');
assert.match((await page.locator('#yControl label').textContent())||'',/中性能階/,'neutral energy label missing');
await page.screenshot({path:`${OUT}/11520-mobile-hud-energy-zero.png`,fullPage:true});

let releaseEnergy=await pressEnergy(1);
assert.equal(await page.locator('#yControl').getAttribute('data-energy-sign'),'positive','positive normal-axis energy state missing');
assert.match((await page.locator('#yControl label').textContent())||'',/正能階/,'positive energy label missing');
const positiveColor=await page.locator('#yControl .read').evaluate(el=>getComputedStyle(el).color);
await page.screenshot({path:`${OUT}/11520-mobile-hud-energy-positive.png`,fullPage:true});
await releaseEnergy();

await page.reload({waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1900);
if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click({timeout:1500}).catch(()=>{});
await page.locator('#intro11520').waitFor({state:'hidden',timeout:3000}).catch(()=>{});
await page.waitForTimeout(900);
await setPlane('XZ');await page.waitForTimeout(160);
releaseEnergy=await pressEnergy(-1);
assert.equal(await page.locator('#yControl').getAttribute('data-energy-sign'),'negative','negative normal-axis energy state missing');
assert.match((await page.locator('#yControl label').textContent())||'',/負能階/,'negative energy label missing');
const negativeColor=await page.locator('#yControl .read').evaluate(el=>getComputedStyle(el).color);
assert.notEqual(positiveColor,negativeColor,'positive and negative energy must use visibly different colors');
await page.screenshot({path:`${OUT}/11520-mobile-hud-energy-negative.png`,fullPage:true});
await releaseEnergy();

const wallet=await box('#walletPanel'),chat=await box('#chatHandle');
assert.ok(wallet.x>=330,`collapsed wallet button must be on right rail: ${JSON.stringify(wallet)}`);
assert.ok(chat.x>=330,`real chat handle must be on right rail: ${JSON.stringify(chat)}`);
for(const sel of ['#walletToggle','#chatHandle','#aiChatButton','#bgmButton','.bagRelocatedV250','#dockToggle']){
  assert.equal(await visible(sel),true,`${sel} must be visible on right utility rail`);
  assert.equal(await centerReachable(sel),true,`${sel} center must not be intercepted by a transparent/overlapping layer`);
}

const toggle='#k11520HudCollapseAll';
assert.equal(await visible(toggle),true,'master HUD collapse toggle must remain visible');
const tracked=['#cControl','#lotsControl','#yControl','#walletPanel','#chatHandle','#aiChatButton','#bgmButton','#dock'];
const before={};for(const sel of tracked)before[sel]=await box(sel);
for(let cycle=0;cycle<2;cycle++){
  await page.locator(toggle).click();await page.waitForTimeout(140);
  assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('k11520HudCollapsed')),true,`cycle ${cycle+1}: master collapse must set collapsed state`);
  for(const sel of ['.top','.axes','.tele','.monsterHud','.minimapWrap','.joyWrap','#cControl','#lotsControl','#yControl','.controls','#walletPanel','#chatHandle','#aiChatButton','#bgmButton','.dock'])assert.equal(await visible(sel),false,`${sel} must collapse under master HUD switch`);
  assert.equal(await visible(toggle),true,'master collapse toggle must stay usable while collapsed');
  if(cycle===0)await page.screenshot({path:`${OUT}/11520-mobile-hud-collapsed.png`,fullPage:true});
  await page.locator(toggle).click();await page.waitForTimeout(160);
  assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('k11520HudCollapsed')),false,`cycle ${cycle+1}: master collapse must restore expanded state`);
  for(const sel of ['.top','.axes','.tele','.monsterHud','.minimapWrap','.joyWrap','#cControl','#lotsControl','#yControl','.controls','#walletPanel','#chatHandle','#aiChatButton','#bgmButton','.dock'])assert.equal(await visible(sel),true,`${sel} must restore after master expand`);
}
for(const sel of tracked){const after=await box(sel);assert.equal(rectsClose(before[sel],after,1),true,`${sel} drifted after collapse/expand cycles: before=${JSON.stringify(before[sel])} after=${JSON.stringify(after)}`)}
await page.screenshot({path:`${OUT}/11520-mobile-hud-3rail.png`,fullPage:true});

const report=await page.evaluate(()=>structuredClone(globalThis.__K11520_MOBILE_CONTROL_LAYOUT__||null));
assert.ok(report?.ok,`mobile layout report must PASS: ${JSON.stringify(report)}`);
assert.equal(report.threeRailAligned,true,'layout report must confirm three-rail alignment');
assert.equal(report.equalWorldLifeWidth,true,'layout report must confirm equal world/life widths');
assert.deepEqual(errors,[],'page errors after interactions: '+errors.join('\n'));
await browser.close();
console.log('11520 mobile HUD P1 visual hardening QA PASS: three rails, XYZ normal-axis labels, neutral boot plus real +/- rail gestures, right-rail pointer reachability, two collapse/expand cycles, no drift');
