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
await page.waitForFunction(()=>globalThis.__K11520_SIGNED_C_IMMERSIVE__?.ready===true,null,{timeout:5000});
await page.waitForFunction(()=>document.documentElement.dataset.k11520MobileControlLayout==='PASS',null,{timeout:5000});
await page.waitForTimeout(500);
assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));

const centerX=async sel=>{const b=await page.locator(sel).boundingBox();assert.ok(b,sel+' missing');return b.x+b.width/2};
const yCenter=await centerX('#yControl');
assert.ok(Math.abs(yCenter-195)<=2,`normal-axis energy rail must be centered in 390px viewport, got ${yCenter}`);
const cBox=await page.locator('#cControl').boundingBox(),lotsBox=await page.locator('#lotsControl').boundingBox(),yBox=await page.locator('#yControl').boundingBox();
assert.ok(yBox&&cBox&&lotsBox,'three vertical rails must all have browser geometry');
assert.ok(yBox.x+yBox.width<=cBox.x,`center energy rail must sit left of C rail: ${JSON.stringify({yBox,cBox,lotsBox})}`);
assert.ok(cBox.x+cBox.width<=lotsBox.x,`C rail must sit left of positive lot rail: ${JSON.stringify({yBox,cBox,lotsBox})}`);
assert.ok(lotsBox.x+lotsBox.width<=390,`lot rail must remain inside viewport: ${JSON.stringify({yBox,cBox,lotsBox})}`);

const driveC=async ratio=>{
  await page.locator('#cControl').evaluate((el,ratio)=>{
    const b=el.getBoundingClientRect(),x=b.left+b.width/2,startY=b.top+b.height/2,targetY=b.top+b.height*ratio,pointerId=880;
    const fire=(type,y,buttons)=>el.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,composed:true,pointerId,pointerType:'touch',isPrimary:true,clientX:x,clientY:y,buttons,button:buttons?0:-1}));
    fire('pointerdown',startY,1);fire('pointermove',targetY,1);fire('pointerup',targetY,0);
  },ratio);
  await page.waitForTimeout(180);
};

await page.waitForFunction(()=>document.querySelector('#k11520TradeColorScheme'),null,{timeout:3000});
assert.equal(await page.locator('html').getAttribute('data-k11520-trade-color-scheme'),'TW_RED_LONG','default color scheme must match Taiwan convention');
let colors=await page.evaluate(()=>({long:getComputedStyle(document.documentElement).getPropertyValue('--k11520-long-color').trim(),short:getComputedStyle(document.documentElement).getPropertyValue('--k11520-short-color').trim()}));
assert.deepEqual(colors,{long:'#ff4f5e',short:'#35d07f'},'Taiwan preset must be LONG red / SHORT green');
assert.match((await page.locator('#k11520TradeColorScheme option:checked').textContent()||''),/多紅 空綠/);
await page.evaluate(()=>globalThis.__K11520_SIGNED_C_IMMERSIVE__.api.setColorScheme('GLOBAL_GREEN_LONG'));
colors=await page.evaluate(()=>({scheme:document.documentElement.dataset.k11520TradeColorScheme,long:getComputedStyle(document.documentElement).getPropertyValue('--k11520-long-color').trim(),short:getComputedStyle(document.documentElement).getPropertyValue('--k11520-short-color').trim(),saved:localStorage.getItem('k11520.trade.colorScheme')}));
assert.deepEqual(colors,{scheme:'GLOBAL_GREEN_LONG',long:'#35d07f',short:'#ff4f5e',saved:'GLOBAL_GREEN_LONG'},'international preset must swap LONG/SHORT colors and persist');
await page.selectOption('#k11520TradeColorScheme','TW_RED_LONG');
await page.waitForFunction(()=>document.documentElement.dataset.k11520TradeColorScheme==='TW_RED_LONG',null,{timeout:1500});
assert.equal(await page.evaluate(()=>localStorage.getItem('k11520.trade.colorScheme')),'TW_RED_LONG','settings selection must persist Taiwan preset');

await page.waitForFunction(()=>document.querySelector('#cNumericInput')&&document.querySelector('#lotsNumericInput'),null,{timeout:3000});
assert.equal(await page.locator('#cNumericInput').getAttribute('inputmode'),'decimal');
assert.equal(await page.locator('#lotsNumericInput').getAttribute('min'),'1');
assert.equal(await page.locator('#lotsNumericInput').getAttribute('max'),'100');
await page.locator('#cNumericInput').fill('-0.1');
await page.locator('#cNumericInput').press('Enter');
await page.waitForFunction(()=>globalThis.__K11520_SIGNED_C_IMMERSIVE__?.signedC===-0.1,null,{timeout:2500});
assert.equal((await page.locator('#cRead').textContent()).trim(),'-0.1C','numeric C input must update canonical signed C display');
assert.equal(await page.locator('#cControl').getAttribute('data-c-side'),'SHORT','negative numeric C must select SHORT');
assert.equal(await page.locator('#sheet').evaluate(el=>el.classList.contains('open')),false,'numeric C entry must not leave trade sheet open');
await page.locator('#lotsNumericInput').fill('7');
await page.locator('#lotsNumericInput').press('Enter');
await page.waitForFunction(()=>document.querySelector('#lotsRead')?.textContent?.trim()==='7口',null,{timeout:2500});
assert.equal((await page.locator('#lotsNumericInput').inputValue()).trim(),'7','numeric lot input must remain synchronized');
assert.equal(await page.locator('#sheet').evaluate(el=>el.classList.contains('open')),false,'numeric lot entry must not open order flow');
await page.locator('#lotsNumericInput').fill('-5');
await page.locator('#lotsNumericInput').press('Enter');
await page.waitForFunction(()=>document.querySelector('#lotsRead')?.textContent?.trim()==='1口',null,{timeout:2500});
assert.equal((await page.locator('#lotsNumericInput').inputValue()).trim(),'1','negative lot input must clamp to positive minimum');

await driveC(.5);
assert.equal((await page.locator('#cRead').textContent()).trim(),'0C','C center must be exactly 0C');
assert.equal(await page.locator('#cControl').getAttribute('data-c-sign'),'zero');

await driveC(.18);
let cText=(await page.locator('#cRead').textContent()).trim();
assert.match(cText,/^\+/,'C upward must be positive velocity');
await page.waitForFunction(()=>globalThis.__K11520_SIGNED_C_IMMERSIVE__?.signedC>0,null,{timeout:2500});
assert.equal(await page.locator('#cControl').getAttribute('data-c-side'),'LONG');
const longColor=await page.locator('#cRead').evaluate(el=>getComputedStyle(el).color);
await page.evaluate(()=>document.querySelector('[data-organ="trade"]')?.click());await page.waitForTimeout(120);
assert.match((await page.locator('#sideBtn').textContent())||'',/多/,'positive C must map canonical side to 多');
assert.equal(await page.locator('#sideBtn').isDisabled(),true,'side must be locked to C sign, not separately toggleable');
await page.locator('#sheetClose').click();

await driveC(.82);
cText=(await page.locator('#cRead').textContent()).trim();
assert.match(cText,/^-/,'C downward must be negative velocity');
await page.waitForFunction(()=>globalThis.__K11520_SIGNED_C_IMMERSIVE__?.signedC<0,null,{timeout:2500});
await page.waitForFunction(()=>globalThis.__K11520_COMBAT_DRIVE__?.c<0,null,{timeout:2500});
assert.equal(await page.locator('#cControl').getAttribute('data-c-side'),'SHORT');
const shortColor=await page.locator('#cRead').evaluate(el=>getComputedStyle(el).color);
assert.notEqual(longColor,shortColor,'LONG and SHORT C states must be visually distinct');
await page.evaluate(()=>document.querySelector('[data-organ="trade"]')?.click());await page.waitForTimeout(120);
assert.match((await page.locator('#sideBtn').textContent())||'',/空/,'negative C must map canonical side to 空');
await page.locator('#sheetClose').click();

const lotsText=(await page.locator('#lotsRead').textContent()||'').trim();
assert.doesNotMatch(lotsText,/^-/,`lot/mass control must stay positive: ${lotsText}`);
assert.ok(parseFloat(lotsText)>=1,`lot/mass control must be >=1: ${lotsText}`);

await page.waitForFunction(()=>document.querySelector('#k11520FullscreenSwitch')?.dataset.k11520SignedCBound==='1',null,{timeout:3000});
await page.evaluate(()=>globalThis.__K11520_SIGNED_C_IMMERSIVE__.api.setFallbackImmersive(true));
await page.waitForTimeout(100);
assert.equal(await page.locator('html').getAttribute('data-k11520-immersive-mode'),'viewport-fallback');
assert.equal(await page.locator('#k11520ImmersiveExit').isVisible(),true,'immersive mode needs explicit exit');
assert.equal(await page.locator('#k11520FullscreenSwitch').getAttribute('aria-checked'),'true');
const geometry=await page.evaluate(()=>({visual:Math.round(globalThis.visualViewport?.height||innerHeight),canvas:Math.round(document.querySelector('#three')?.getBoundingClientRect().height||0),css:getComputedStyle(document.documentElement).getPropertyValue('--k11520-visible-vh').trim()}));
assert.ok(Math.abs(geometry.canvas-geometry.visual)<=2,`immersive canvas must use visible viewport: ${JSON.stringify(geometry)}`);
assert.equal(geometry.css,`${geometry.visual}px`);
await page.screenshot({path:`${OUT}/11520-mobile-signed-c-immersive.png`,fullPage:true});
await page.locator('#k11520ImmersiveExit').click();await page.waitForTimeout(80);
assert.equal(await page.locator('html').getAttribute('data-k11520-immersive-mode'),'off');

const layout=await page.evaluate(()=>structuredClone(globalThis.__K11520_MOBILE_CONTROL_LAYOUT__));
assert.equal(layout.axisRailCentered,true,JSON.stringify(layout));
assert.equal(layout.ok,true,JSON.stringify(layout));
for(const [key,value] of Object.entries(layout.overlaps||{}))assert.equal(value,false,`overlap ${key}: ${JSON.stringify(layout)}`);

await browser.close();
console.log('11520 signed-C immersive QA PASS: centered normal-axis rail; +C=多, -C=空; configurable persisted LONG/SHORT color presets; numeric C/lots entry; positive lots; immersive visible-viewport fallback verified at 390x844');