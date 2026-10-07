import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.K11520_PLAYWRIGHT_MODULE||'playwright');

const OUT='artifacts/11520-progress-board';
const BASE=process.env.K11520_BASE_URL||'http://127.0.0.1:4173';
const ROUTE='/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html';
const profiles=[{name:'portrait',width:390,height:844},{name:'landscape',width:844,height:390}];
const overlap=(a,b)=>!!a&&!!b&&a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;

await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.K11520_CHROMIUM_PATH?{executablePath:process.env.K11520_CHROMIUM_PATH}:{})});
const reports=[];
try{
  for(const profile of profiles){
    const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://data-api.binance.vision/api/v3/aggTrades*',route=>route.fulfill({contentType:'application/json',body:'[]'}));
    await page.goto(`${BASE}${ROUTE}?progress-board-v1=1`,{waitUntil:'domcontentloaded'});
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
    await page.screenshot({path:`${OUT}/${profile.width}x${profile.height}-player.png`});
    await page.locator('[data-progress-mode="engineering"]').click();
    const engineeringText=await page.locator('#k11520ProgressContent').textContent();
    for(const field of ['LATEST_MAIN','PUBLIC_BUILD','ACTIVE_PROJECTS','REAL_WALLET','REAL_ORDER','REAL_SETTLEMENT','BLOCKERS','LAST_UPDATED_AT'])assert.ok(engineeringText.includes(field));
    await page.screenshot({path:`${OUT}/${profile.width}x${profile.height}-engineering.png`});
    await page.keyboard.press('Escape');await page.locator('#sheet').waitFor({state:'hidden'});
    await progress.waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'k11520ProgressButton','Escape must restore focus to Progress in the reopened utility rail');
    await progress.click();await page.locator('#k11520ProgressBoard').waitFor({state:'visible'});
    await page.locator('#sheetClose').click();await page.locator('#sheet').waitFor({state:'hidden'});
    await progress.waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'k11520ProgressButton','Close must restore focus to Progress');
    const world=await page.evaluate(()=>{const projection=globalThis.__K11520_WORLD_SELECTION_PROJECTION__,player=projection?.playerHomeSnapshot?.().playerScreen,monsters=projection?.journeyLifeSnapshot?.()||[];return{player,playerUncovered:player?document.elementFromPoint(player.x,player.y)?.id==='three':false,monsterUncovered:monsters.some(m=>m.visible&&m.inView&&m.uncovered)}});
    assert.equal(world.playerUncovered,true,'closed board must restore uncovered Player');
    assert.equal(world.monsterUncovered,true,'closed board must restore an uncovered Monster');
    assert.deepEqual(errors,[],'real runtime must not emit page errors');
    reports.push({profile,buttonBox,controls:beforeOpen.controls,layout:{railOverlaps:beforeOpen.layout?.railOverlaps,cleanUtilityStack:beforeOpen.layout?.cleanUtilityStack},scroll,world,playerMode:'PASS',engineeringMode:'PASS',escape:'PASS',close:'PASS',focusReturn:'PASS'});
    await context.close();
  }
}finally{await browser.close()}
await fs.writeFile(`${OUT}/report.json`,JSON.stringify({status:'PASS',reports},null,2));
console.log(JSON.stringify({status:'PASS',profiles:reports.map(r=>`${r.profile.width}x${r.profile.height}`),artifacts:OUT}));
