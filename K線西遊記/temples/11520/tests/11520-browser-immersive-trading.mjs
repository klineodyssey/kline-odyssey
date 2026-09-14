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
await page.waitForFunction(()=>globalThis.__K11520_IMMERSIVE_TRADING__?.ready===true,null,{timeout:5000});
await page.waitForTimeout(700);
assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));

const apiState=await page.evaluate(()=>globalThis.__K11520_IMMERSIVE_TRADING__);
assert.equal(apiState.directionSelectionOnly,true,'direction picker must only select direction');
assert.equal(apiState.orderConfirmationUnchanged,true,'order confirmation invariant must remain intact');
assert.equal(apiState.navigationUiRequested,'hide','fullscreen request must ask browser to hide navigation UI when supported');

const activeAxis=await page.locator('#axes [data-axis].active').getAttribute('data-axis');
assert.ok(['KX','KY','KZ'].includes(activeAxis),'active K axis missing');
assert.equal(await page.locator('#axes [data-axis].active .k11520DirectionPicker').count(),1,'active axis must expose exactly one direct direction picker');
assert.equal(await page.locator('#axes [data-axis].active [data-k11520-side="LONG"]').isVisible(),true,'LONG control must be visible on active axis');
assert.equal(await page.locator('#axes [data-axis].active [data-k11520-side="SHORT"]').isVisible(),true,'SHORT control must be visible on active axis');

await page.locator('#axes [data-axis].active [data-k11520-side="SHORT"]').click();
await page.waitForFunction(axis=>globalThis.__K11520_IMMERSIVE_TRADING__?.sideByAxis?.[axis]==='SHORT',activeAxis,{timeout:2500});
assert.equal(await page.locator('#sheet').evaluate(el=>el.classList.contains('open')),false,'direct SHORT selection must not leave a trade sheet open');
await page.evaluate(()=>document.querySelector('[data-organ="trade"]')?.click());
await page.waitForTimeout(80);
assert.match((await page.locator('#sideBtn').textContent()||'').trim(),/空/,'direct SHORT must synchronize canonical existing trade direction');
await page.locator('#sheetClose').click();

await page.locator(`#axes [data-axis="${activeAxis}"] [data-k11520-side="LONG"]`).click();
await page.waitForFunction(axis=>globalThis.__K11520_IMMERSIVE_TRADING__?.sideByAxis?.[axis]==='LONG',activeAxis,{timeout:2500});
assert.equal(await page.locator('#sheet').evaluate(el=>el.classList.contains('open')),false,'direct LONG selection must not leave a trade sheet open');
await page.evaluate(()=>document.querySelector('[data-organ="trade"]')?.click());
await page.waitForTimeout(80);
assert.match((await page.locator('#sideBtn').textContent()||'').trim(),/多/,'direct LONG must synchronize canonical existing trade direction');
await page.locator('#sheetClose').click();

await page.locator('#axes [data-axis="KY"]').click({position:{x:12,y:12}});
await page.waitForFunction(()=>document.querySelector('#axes [data-axis="KY"]')?.classList.contains('active')===true,null,{timeout:3000});
await page.waitForTimeout(100);
const visiblePickers=await page.locator('#axes .k11520DirectionPicker').evaluateAll(nodes=>nodes.filter(n=>getComputedStyle(n).display!=='none'&&n.getBoundingClientRect().width>0).length);
assert.equal(visiblePickers,1,'only the active K axis should show direct LONG/SHORT controls');
assert.equal(await page.locator('#axes [data-axis="KY"] [data-k11520-side="LONG"]').isVisible(),true,'new active axis must inherit direct direction controls after canonical axis rerender');

await page.waitForFunction(()=>document.querySelector('#k11520FullscreenSwitch')?.dataset.k11520ImmersiveBound==='1',null,{timeout:3000});
const fullscreenLabel=(await page.locator('#k11520FullscreenSwitch').locator('xpath=..').locator('span').textContent()||'').trim();
assert.equal(fullscreenLabel,'沉浸全螢幕','settings fullscreen row should describe immersive fullscreen');

await page.evaluate(()=>globalThis.__K11520_IMMERSIVE_TRADING__.api.setFallbackImmersive(true));
await page.waitForTimeout(80);
assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('k11520ImmersiveViewport')),true,'fallback immersive viewport class missing');
assert.equal(await page.locator('html').getAttribute('data-k11520-immersive-mode'),'viewport-fallback','fallback immersive mode must be explicit');
assert.equal(await page.locator('#k11520ImmersiveExit').isVisible(),true,'immersive mode must keep an explicit exit affordance');
assert.equal(await page.locator('#k11520FullscreenSwitch').getAttribute('aria-checked'),'true','immersive switch must reflect fallback immersive state');
const viewportGeometry=await page.evaluate(()=>({visual:Math.round(globalThis.visualViewport?.height||innerHeight),canvas:Math.round(document.querySelector('#three')?.getBoundingClientRect().height||0),css:getComputedStyle(document.documentElement).getPropertyValue('--k11520-visible-vh').trim()}));
assert.ok(Math.abs(viewportGeometry.canvas-viewportGeometry.visual)<=2,`immersive canvas must consume available visible viewport: ${JSON.stringify(viewportGeometry)}`);
assert.equal(viewportGeometry.css,`${viewportGeometry.visual}px`,'visible viewport CSS variable must track VisualViewport height');
await page.screenshot({path:`${OUT}/11520-mobile-immersive-trading.png`,fullPage:true});

await page.locator('#k11520ImmersiveExit').click();
await page.waitForTimeout(80);
assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('k11520ImmersiveViewport')),false,'explicit exit must leave fallback immersive mode');
assert.equal(await page.locator('#k11520FullscreenSwitch').getAttribute('aria-checked'),'false','immersive switch must reset after exit');

await browser.close();
console.log('11520 immersive mobile trading PASS: visible-viewport fullscreen fallback, explicit exit, active-axis LONG/SHORT selection, canonical side sync and confirmation invariant verified at 390x844');
