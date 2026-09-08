import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const OUT='artifacts/11520-visual-qa';
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1900);
if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click({timeout:1500}).catch(()=>{});
await page.locator('#intro11520').waitFor({state:'hidden',timeout:3000}).catch(()=>{});
await page.waitForTimeout(900);
assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));

const box=async sel=>{const b=await page.locator(sel).boundingBox();assert.ok(b,`${sel} missing`);return b};
const visible=async sel=>page.locator(sel).evaluate(el=>{const s=getComputedStyle(el),b=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&b.width>0&&b.height>0});

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
assert.ok(c.x<c.x+c.width&&c.x+c.width<=lots.x&&lots.x+lots.width<=rail.x,'three rails must be ordered C → lots → remaining-axis without overlap');
assert.ok(rail.y+rail.height<=844,'three-rail group must remain inside 390x844 viewport');
await page.locator('#k11520EnergyRead').waitFor({state:'visible',timeout:2500});
const trackBg=await page.locator('#yControl .track').evaluate(el=>getComputedStyle(el).backgroundImage);
assert.match(trackBg,/linear-gradient/i,'remaining-axis track must encode positive/negative energy zones');

const wallet=await box('#walletPanel'),chat=await box('#aiChatButton');
assert.ok(wallet.x>=330,`collapsed wallet button must be on right rail: ${JSON.stringify(wallet)}`);
assert.ok(chat.x>=330,`chat button must be on right rail: ${JSON.stringify(chat)}`);

const toggle='#k11520HudCollapseAll';
assert.equal(await visible(toggle),true,'master HUD collapse toggle must remain visible');
await page.locator(toggle).click();await page.waitForTimeout(120);
assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('k11520HudCollapsed')),true,'master collapse must set collapsed state');
for(const sel of ['.top','.axes','.tele','.monsterHud','.minimapWrap','.joyWrap','#cControl','#lotsControl','#yControl','.controls','#walletPanel','#aiChatButton','#bgmButton','.dock'])assert.equal(await visible(sel),false,`${sel} must collapse under master HUD switch`);
assert.equal(await visible(toggle),true,'master collapse toggle must stay usable while collapsed');
await page.screenshot({path:`${OUT}/11520-mobile-hud-collapsed.png`,fullPage:true});

await page.locator(toggle).click();await page.waitForTimeout(120);
assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('k11520HudCollapsed')),false,'master collapse must restore expanded state');
for(const sel of ['.top','.axes','.tele','.monsterHud','.minimapWrap','.joyWrap','#cControl','#lotsControl','#yControl','.controls','#walletPanel','#aiChatButton','.dock'])assert.equal(await visible(sel),true,`${sel} must restore after master expand`);
await page.screenshot({path:`${OUT}/11520-mobile-hud-3rail.png`,fullPage:true});

const report=await page.evaluate(()=>structuredClone(globalThis.__K11520_MOBILE_CONTROL_LAYOUT__||null));
assert.ok(report?.ok,`mobile layout report must PASS: ${JSON.stringify(report)}`);
assert.equal(report.threeRailAligned,true,'layout report must confirm three-rail alignment');
assert.equal(report.equalWorldLifeWidth,true,'layout report must confirm equal world/life widths');
await browser.close();
console.log('11520 mobile HUD three-rail + right organ rail + master collapse browser QA PASS');
