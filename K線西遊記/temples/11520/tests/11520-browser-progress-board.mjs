import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.K11520_PLAYWRIGHT_MODULE||'playwright');

const OUT='artifacts/11520-progress-board';
const BASE=process.env.K11520_BASE_URL||'http://127.0.0.1:4173';
const ROUTE='/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html';
const profiles=[{name:'portrait',width:390,height:844},{name:'landscape',width:844,height:390}];
const overlap=(a,b)=>!!a&&!!b&&a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const settlePaint=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const ensureProgressRuntime=page=>page.evaluate(async()=>{await import(new URL('./runtime/market-origin-wallet-layout-runtime.mjs',location.href).href);const {install11520ProductProgressBoard}=await import(new URL('./runtime/product-progress-board.mjs',location.href).href);if(!globalThis.__K11520_PROGRESS_BOARD__)install11520ProductProgressBoard()});
async function assertDialogChrome(page){
  await page.waitForFunction(()=>{const title=document.querySelector('#sheetTitle'),close=document.querySelector('#sheetClose'),visible=el=>{const r=el?.getBoundingClientRect(),s=el&&getComputedStyle(el);return !!(r&&r.width&&r.height&&s.visibility!=='hidden'&&s.display!=='none'&&Number(s.opacity)>0)};return title?.textContent?.includes('遊戲進度')&&visible(title)&&visible(close)});
  await settlePaint(page);
  const chrome=await page.evaluate(()=>Object.fromEntries(['#sheetTitle','#sheetClose'].map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return[selector,{x:r.x,y:r.y,width:r.width,height:r.height}]})));
  assert.ok(chrome['#sheetTitle'].width>0&&chrome['#sheetTitle'].height>0,'Progress title must be painted and visible');
  assert.ok(chrome['#sheetClose'].width>=44&&chrome['#sheetClose'].height>=44,'Progress close control must be painted and visible');
  return chrome;
}
async function assertNoProgressOverlay(page,label){
  const result=await page.evaluate(()=>{const rect=selector=>{const el=document.querySelector(selector),r=el?.getBoundingClientRect(),s=el&&getComputedStyle(el),visible=!!(r&&r.width&&r.height&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0);return{visible,rect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null}},toast=rect('#toast'),content=rect('#k11520ProgressContent'),intersects=(a,b)=>!!a&&!!b&&a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;return{toast,content,intersection:toast.visible&&content.visible&&intersects(toast.rect,content.rect)}});
  assert.equal(result.intersection,false,`${label}: gameplay feedback must not cover Progress content`);
  assert.equal(result.toast.visible,false,`${label}: existing toast must be temporarily hidden while Progress owns the modal surface`);
  return result;
}

await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.K11520_CHROMIUM_PATH?{executablePath:process.env.K11520_CHROMIUM_PATH}:{})});
const reports=[];
try{
  for(const profile of profiles){
    const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://data-api.binance.vision/api/v3/aggTrades*',route=>route.fulfill({contentType:'application/json',body:'[]'}));
    await page.goto(`${BASE}${ROUTE}?progress-board-v1=1`,{waitUntil:'domcontentloaded'});
    await ensureProgressRuntime(page);
    await page.waitForFunction(()=>globalThis.__K11520_PROGRESS_BOARD__?.status==='AVAILABLE'&&document.querySelector('#k11520ProgressButton'));
    if(await page.locator('#enter11520').isVisible())await page.locator('#enter11520').click().catch(()=>{});
    await page.locator('#intro11520').waitFor({state:'hidden'});
    await page.locator('#k11520UtilityMaster').click();
    await page.locator('#dockToggle').waitFor({state:'visible'});
    await page.locator('#dockToggle').click();
    const progress=page.locator('#k11520ProgressButton');await progress.waitFor({state:'visible'});
    const buttonBox=await progress.boundingBox();assert.ok(buttonBox&&buttonBox.width>=44&&buttonBox.height>=44,'Progress must be an accessible utility action');
    const beforeOpen=await page.evaluate(()=>{const visibleRect=selector=>{const el=document.querySelector(selector),style=el&&getComputedStyle(el),r=el?.getBoundingClientRect();return el&&style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>0&&r.width&&r.height?{x:r.x,y:r.y,width:r.width,height:r.height}:null};const projection=globalThis.__K11520_WORLD_SELECTION_PROJECTION__,player=projection?.playerHomeSnapshot?.().playerScreen,monsters=projection?.journeyLifeSnapshot?.()||[];return{controls:Object.fromEntries(['#joy','#cControl','#lotsControl','#orderFire','#attack'].map(selector=>[selector,visibleRect(selector)])),layout:globalThis.__K11520_MARKET_ORIGIN_LAYOUT__,player,playerUncovered:player?document.elementFromPoint(player.x,player.y)?.id==='three':false,monsterUncovered:monsters.some(m=>m.visible&&m.inView&&m.uncovered)}});
    for(const [selector,box] of Object.entries(beforeOpen.controls))assert.equal(overlap(buttonBox,box),false,`Progress utility action must not overlap ${selector}`);
    assert.ok(beforeOpen.layout?.utility?.some(item=>item.selector==='#k11520ProgressButton'&&item.rect),'canonical utility layout report must include visible Progress');
    assert.equal(beforeOpen.layout?.railOverlaps?.some(item=>item.button==='#k11520ProgressButton'),false,'Progress must not overlap C/Lots/remaining-axis rails');
    assert.equal(beforeOpen.playerUncovered,true,'Progress rail must not cover Player');
    assert.equal(beforeOpen.monsterUncovered,true,'Progress rail must not cover every visible Monster');
    await page.evaluate(async()=>{const module=await import(new URL('./runtime/game-ui-product-fixes-v23.mjs',location.href).href);module.show11520Toast('花果山 · 旅程開始',{event:'WORLD_ENTER',duration:60000})});
    await page.locator('#toast').waitFor({state:'visible'});
    await progress.click();await page.locator('#k11520ProgressBoard').waitFor({state:'visible'});
    await page.waitForFunction(()=>document.activeElement?.id==='sheetClose');
    assert.equal(await page.locator('#sheet').getAttribute('role'),'dialog');
    assert.equal(await page.locator('#sheet').getAttribute('aria-modal'),'true');
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'sheetClose');
    assert.match(await page.locator('#sheetTitle').textContent(),/遊戲進度/);
    assert.equal(await page.locator('[data-progress-mode="player"]').getAttribute('aria-selected'),'true');
    const playerText=await page.locator('#k11520ProgressContent').textContent();
    for(const title of ['目前可玩','施工中','未開放 / 卡住','下一步'])assert.ok(playerText.includes(title));
    assert.equal(await page.locator('[data-progress-key="WALLET"]').getAttribute('data-progress-status'),'NOT_READY');
    assert.equal(await page.locator('[data-progress-key="PUBLIC_RUNTIME"]').getAttribute('data-progress-status'),'STALE');
    const scroll=await page.locator('#sheetBody').evaluate(el=>({height:el.clientHeight,scrollHeight:el.scrollHeight,overflow:getComputedStyle(el).overflowY}));assert.ok(scroll.scrollHeight>scroll.height,'Progress content must scroll');assert.equal(scroll.overflow,'auto');
    const playerChrome=await assertDialogChrome(page);
    const playerOverlay=await assertNoProgressOverlay(page,`${profile.width}x${profile.height} Player`);
    await page.screenshot({path:`${OUT}/${profile.width}x${profile.height}-player.png`});
    await page.locator('[data-progress-mode="engineering"]').click();
    await page.waitForFunction(()=>document.querySelector('[data-progress-mode="engineering"]')?.getAttribute('aria-selected')==='true');
    const engineeringText=await page.locator('#k11520ProgressContent').textContent();
    for(const field of ['LATEST_MAIN','PUBLIC_BUILD','ACTIVE_PROJECTS','REAL_WALLET','REAL_ORDER','REAL_SETTLEMENT','BLOCKERS','LAST_UPDATED_AT'])assert.ok(engineeringText.includes(field));
    const engineeringChrome=await assertDialogChrome(page);
    const engineeringOverlay=await assertNoProgressOverlay(page,`${profile.width}x${profile.height} Engineering`);
    await page.screenshot({path:`${OUT}/${profile.width}x${profile.height}-engineering.png`});
    await page.locator('[data-progress-mode="engineering"]').focus();
    await page.keyboard.press('Home');
    assert.equal(await page.locator('[data-progress-mode="player"]').getAttribute('aria-selected'),'true','Home must select the first Progress tab');
    assert.equal(await page.evaluate(()=>document.activeElement?.dataset?.progressMode),'player','keyboard tab navigation must move focus with selection');
    await page.keyboard.press('Escape');await page.locator('#sheet').waitFor({state:'hidden'});
    await progress.waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'k11520ProgressButton','Escape must restore focus to Progress in the reopened utility rail');
    await page.locator('#toast').waitFor({state:'visible'});
    await progress.click();await page.locator('#k11520ProgressBoard').waitFor({state:'visible'});
    await page.locator('#sheetClose').click();await page.locator('#sheet').waitFor({state:'hidden'});
    await progress.waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'k11520ProgressButton','Close must restore focus to Progress');
    const world=await page.evaluate(()=>{const projection=globalThis.__K11520_WORLD_SELECTION_PROJECTION__,player=projection?.playerHomeSnapshot?.().playerScreen,monsters=projection?.journeyLifeSnapshot?.()||[];return{player,playerUncovered:player?document.elementFromPoint(player.x,player.y)?.id==='three':false,monsterUncovered:monsters.some(m=>m.visible&&m.inView&&m.uncovered)}});
    assert.equal(world.playerUncovered,true,'closed board must restore uncovered Player');
    assert.equal(world.monsterUncovered,true,'closed board must restore an uncovered Monster');
    assert.deepEqual(errors,[],'real runtime must not emit page errors');
    reports.push({profile,buttonBox,controls:beforeOpen.controls,layout:{railOverlaps:beforeOpen.layout?.railOverlaps,cleanUtilityStack:beforeOpen.layout?.cleanUtilityStack},scroll,world,playerChrome,engineeringChrome,playerOverlay,engineeringOverlay,playerMode:'PASS',engineeringMode:'PASS',escape:'PASS',close:'PASS',focusReturn:'PASS'});
    await context.close();
  }

  const canonical=JSON.parse(await fs.readFile('K線西遊記/temples/11520/K11520_PRODUCT_PROGRESS_CURRENT.json','utf8'));
  for(const sourceCase of ['stale','future']){
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();
    const injected=structuredClone(canonical);injected.lastUpdatedAt=sourceCase==='stale'?'2026-09-01T00:00:00Z':'2999-01-01T00:00:00Z';
    await page.route('**/K11520_PRODUCT_PROGRESS_CURRENT.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(injected)}));
    await page.route('https://data-api.binance.vision/api/v3/aggTrades*',route=>route.fulfill({contentType:'application/json',body:'[]'}));
    await page.goto(`${BASE}${ROUTE}?progress-board-${sourceCase}=1`,{waitUntil:'domcontentloaded'});
    await ensureProgressRuntime(page);
    await page.waitForFunction(()=>globalThis.__K11520_PROGRESS_BOARD__?.open&&document.querySelector('#k11520ProgressButton'));
    if(await page.locator('#enter11520').isVisible())await page.locator('#enter11520').click().catch(()=>{});
    await page.locator('#intro11520').waitFor({state:'hidden'});
    await page.locator('#k11520UtilityMaster').click();await page.locator('#dockToggle').click();await page.locator('#k11520ProgressButton').click();
    await page.locator('#k11520ProgressBoard').waitFor({state:'visible'});await settlePaint(page);
    if(sourceCase==='stale'){
      assert.equal(await page.locator('[data-progress-status="AVAILABLE"]').count(),0,'stale Player view must expose no AVAILABLE claim');
      assert.equal(await page.locator('#k11520ProgressContent b').filter({hasText:/^可玩$/}).count(),0,'stale Player view must expose no playable label');
      assert.equal(await page.locator('[data-progress-status="STALE"]').count(),25,'stale Player view must downgrade every core feature');
      await page.locator('[data-progress-mode="engineering"]').click();await settlePaint(page);
      assert.equal(await page.locator('[data-progress-status="AVAILABLE"]').count(),0,'stale Engineering view must expose no AVAILABLE claim');
      assert.ok(await page.locator('[data-progress-status="STALE"]').count()>0,'stale Engineering view must downgrade claims');
      assert.match(await page.locator('#k11520ProgressContent').textContent(),/STALE_SOURCE_VALUE_WITHHELD/);
    }else{
      const error=await page.locator('#k11520ProgressContent').textContent();
      assert.match(error,/SOURCE_TIMESTAMP_FUTURE/);
      assert.match(error,/UNKNOWN/);
      assert.equal(await page.locator('[data-progress-status="AVAILABLE"]').count(),0,'future source must expose no AVAILABLE claim');
    }
    await context.close();
  }

  {
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();
    const expiring=structuredClone(canonical);expiring.lastUpdatedAt=new Date().toISOString();expiring.staleAfterHours=0.003;
    await page.route('**/K11520_PRODUCT_PROGRESS_CURRENT.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(expiring)}));
    await page.route('https://data-api.binance.vision/api/v3/aggTrades*',route=>route.fulfill({contentType:'application/json',body:'[]'}));
    await page.goto(`${BASE}${ROUTE}?progress-board-expiry=1`,{waitUntil:'domcontentloaded'});
    await ensureProgressRuntime(page);
    await page.waitForFunction(()=>globalThis.__K11520_PROGRESS_BOARD__?.open&&document.querySelector('#k11520ProgressButton'));
    if(await page.locator('#enter11520').isVisible())await page.locator('#enter11520').click().catch(()=>{});
    await page.locator('#intro11520').waitFor({state:'hidden'});await page.locator('#k11520UtilityMaster').click();await page.locator('#dockToggle').click();await page.locator('#k11520ProgressButton').click();
    await page.locator('[data-progress-key="WORLD_MOVEMENT"][data-progress-status="AVAILABLE"]').waitFor();
    await page.waitForFunction(()=>document.querySelectorAll('[data-progress-status="AVAILABLE"]').length===0,{timeout:15000});
    assert.equal(await page.locator('[data-progress-status="STALE"]').count(),25,'an open board must age to STALE at the exact TTL without reopen or tab switch');
    await context.close();
  }

  {
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();
    let requestCount=0;
    await page.route('**/K11520_PRODUCT_PROGRESS_CURRENT.json',async route=>{requestCount+=1;const response=structuredClone(canonical);if(requestCount===1){await new Promise(resolve=>setTimeout(resolve,400))}else response.evidence.blockedFeatures=['ORDER'];await route.fulfill({contentType:'application/json',body:JSON.stringify(response)})});
    await page.route('https://data-api.binance.vision/api/v3/aggTrades*',route=>route.fulfill({contentType:'application/json',body:'[]'}));
    await page.goto(`${BASE}${ROUTE}?progress-board-race=1`,{waitUntil:'domcontentloaded'});
    await ensureProgressRuntime(page);
    await page.waitForFunction(()=>globalThis.__K11520_PROGRESS_BOARD__?.open&&document.querySelector('#k11520ProgressButton'));
    if(await page.locator('#enter11520').isVisible())await page.locator('#enter11520').click().catch(()=>{});
    await page.locator('#intro11520').waitFor({state:'hidden'});await page.locator('#k11520UtilityMaster').click();await page.locator('#dockToggle').click();
    await page.evaluate(()=>{const trigger=document.querySelector('#k11520ProgressButton');document.dispatchEvent(new CustomEvent('k11520:open-progress-board',{detail:{trigger}}));document.dispatchEvent(new CustomEvent('k11520:open-progress-board',{detail:{trigger}}))});
    await page.locator('[data-progress-key="ORDER"][data-progress-status="BLOCKED"]').waitFor();
    await page.waitForTimeout(500);
    assert.equal(await page.locator('[data-progress-key="ORDER"]').getAttribute('data-progress-status'),'BLOCKED','an older response must not overwrite a newer generation');
    await context.close();
  }

  {
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();
    let requestCount=0;
    await page.route('**/K11520_PRODUCT_PROGRESS_CURRENT.json',route=>{requestCount+=1;return requestCount===1?route.fulfill({contentType:'application/json',body:JSON.stringify(canonical)}):route.fulfill({status:503,contentType:'text/plain',body:'unavailable'})});
    await page.route('https://data-api.binance.vision/api/v3/aggTrades*',route=>route.fulfill({contentType:'application/json',body:'[]'}));
    await page.goto(`${BASE}${ROUTE}?progress-board-failure=1`,{waitUntil:'domcontentloaded'});
    await ensureProgressRuntime(page);
    await page.waitForFunction(()=>globalThis.__K11520_PROGRESS_BOARD__?.open&&document.querySelector('#k11520ProgressButton'));
    if(await page.locator('#enter11520').isVisible())await page.locator('#enter11520').click().catch(()=>{});
    await page.locator('#intro11520').waitFor({state:'hidden'});await page.locator('#k11520UtilityMaster').click();await page.locator('#dockToggle').click();await page.locator('#k11520ProgressButton').click();
    await page.locator('[data-progress-key="WORLD_MOVEMENT"][data-progress-status="AVAILABLE"]').waitFor();await page.keyboard.press('Escape');await page.locator('#sheet').waitFor({state:'hidden'});
    await page.locator('#k11520ProgressButton').click();await page.locator('#k11520ProgressContent').filter({hasText:'HTTP_503'}).waitFor();
    await page.locator('[data-progress-mode="engineering"]').click();
    assert.match(await page.locator('#k11520ProgressContent').textContent(),/HTTP_503/,'tab switch after a failed read must preserve UNKNOWN error state');
    assert.equal(await page.locator('[data-progress-status="AVAILABLE"]').count(),0,'failed read must not resurrect cached AVAILABLE status');
    await context.close();
  }
}finally{await browser.close()}
await fs.writeFile(`${OUT}/report.json`,JSON.stringify({status:'PASS',sourceTruthCases:{stale:'PASS',future:'PASS',exactTtl:'PASS',responseGeneration:'PASS',failedReadNoResurrection:'PASS'},reports},null,2));
console.log(JSON.stringify({status:'PASS',profiles:reports.map(r=>`${r.profile.width}x${r.profile.height}`),artifacts:OUT}));
