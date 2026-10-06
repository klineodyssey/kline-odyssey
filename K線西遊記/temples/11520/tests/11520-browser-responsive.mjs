import assert from 'node:assert/strict';
import {formatUniverseAddress,signedUniverseAddress} from '../runtime/spatial-coordinate-runtime.mjs';
import {createLocalPlayerStore,PLAYER_LIFE_STORAGE_KEY} from '../runtime/player-life-runtime.mjs';
function freeQuotePayload(route,rows){
  const url=new URL(route.request().url());
  if(!url.pathname.endsWith('/aggTrades'))return rows;
  const row=rows.find(r=>r.symbol===url.searchParams.get('symbol'));
  return row?[{p:String(row.price),T:Date.now(),a:Date.now()}]:[];
}
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';

// Same ordered candidate grid and predicates; reject a covered endpoint before
// paying for the unchanged nine-point scene-origin check. No budget is extended.
function selectWorldFirstPanOrigin({dx,dy}){
  globalThis.worldFirstPointerTrace=[];
  const canvas=document.querySelector('#three'),r=canvas.getBoundingClientRect(),startedAt=performance.now();
  const stats={startedAt,candidates:0,endpointDomChecks:0,endpointRejects:0,originPredicateCalls:0,originRejects:0};globalThis.worldFirstPanPickDiagnostics=stats;
  const finish=()=>{stats.finishedAt=performance.now();stats.elapsedMs=stats.finishedAt-startedAt};
  for(let y=r.top+80;y<r.bottom-80;y+=12)for(let x=r.left+80;x<r.right-80;x+=12){
    stats.candidates++;stats.endpointDomChecks++;
    if(document.elementFromPoint(x+dx,y+dy)!==canvas){stats.endpointRejects++;continue}
    stats.originPredicateCalls++;
    if(!__K11520_CAMERA__.isWorldGestureArea(x,y,10)){stats.originRejects++;continue}
    const before={camera:__K11520_CAMERA__.snapshot(),player:__K11520_WORLD_SELECTION_PROJECTION__.playerHomeSnapshot().playerScreen};finish();
    return{origin:{x,y},before,selectedAt:stats.finishedAt,pickDiagnostics:{...stats}};
  }
  finish();return null;
}

// Qualify the actual trusted down, not an earlier moving-world sample. Only a
// rejected origin can be reacquired; an admitted gesture is asserted once below.
async function acquireAdmittedCameraPan({pick,begin,inspect,cancel,records,now=Date.now}){
  // The deadline cuts off admission; it does not cancel stalled async CDP calls.
  const startedAt=now(),budgetMs=1000,maxAttempts=3;
  for(let index=0;index<maxAttempts&&now()-startedAt<budgetMs;index++){
    const sampled=await pick();if(!sampled)throw new Error('CAMERA_PAN_CLEAR_ORIGIN_REQUIRED');
    const record={attempt:index+1,...sampled,startedAt,elapsedBeforeDown:now()-startedAt};records.push(record);
    if(record.elapsedBeforeDown>=budgetMs){record.reason='ACQUISITION_BUDGET_EXPIRED';break}
    await begin(sampled.origin);record.actualDown=await inspect();
    const down=record.actualDown.down;
    if(!down||down.type!=='pointerdown'||down.isTrusted!==true||down.target!=='three'){
      await cancel();record.cancelled=true;record.reason='TRUSTED_CANVAS_DOWN_REQUIRED';throw new Error(record.reason);
    }
    if(down.canPan!==true&&down.canPan!==false){await cancel();record.cancelled=true;record.reason='BOOLEAN_PAN_ELIGIBILITY_REQUIRED';throw new Error(record.reason)}
    record.elapsedAfterDown=now()-startedAt;
    if(record.elapsedAfterDown>=budgetMs){await cancel();record.cancelled=true;record.reason='ACQUISITION_BUDGET_EXPIRED';record.afterCancel=await inspect();throw new Error('CAMERA_PAN_ACQUISITION_BUDGET_EXPIRED')}
    if(down.canPan===true){record.admitted=true;return {...sampled,admission:record}}
    await cancel();record.cancelled=true;record.reason='ORIGIN_REJECTED_AT_NATIVE_DOWN';record.afterCancel=await inspect();
  }
  throw new Error('CAMERA_PAN_ORIGIN_NOT_ADMITTED_WITHIN_3_ATTEMPTS_1000MS');
}

// Real entry only: never import repairs or change runtime styles from QA.
const OUT='artifacts/11520-responsive-qa';
const BASE=process.env.K11520_BASE_URL||'http://127.0.0.1:4173';
const ROUTE='/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html';
const PRODUCTION=process.env.K11520_PRODUCTION_QA==='1';
const profiles=PRODUCTION?[{name:'pages-360',width:360,height:740},{name:'pages-390',width:390,height:844},{name:'pages-432',width:432,height:856},{name:'pages-landscape-844',width:844,height:390,landscape:true}]:[
  {name:'cold-390',width:390,height:844},{name:'cold-432',width:432,height:856},
  {name:'warm-412',width:412,height:772,warm:true},{name:'cold-360',width:360,height:740},{name:'cold-landscape-844',width:844,height:390,landscape:true},
  {name:'cold-480',width:480,height:900}
];
// Optional local diagnosis only; default CI still exercises every profile.
const selectedProfiles=process.env.K11520_RESPONSIVE_PROFILE?profiles.filter(p=>p.name===process.env.K11520_RESPONSIVE_PROFILE):profiles;
assert.ok(selectedProfiles.length,'Unknown K11520_RESPONSIVE_PROFILE');
const selectors=['#kspaceTarget','#k11520MonsterGuide','.top','.axes','.tele','.monsterHud','.minimapWrap','#joy','#cControl','#lotsControl','#yControl','#cThumb','#lotsThumb','#yThumb','#cRead','#lotsRead','#yRead','#tradeSword','#k11520PlaneLabel','#dockToggle','#skill','#dodge','#flat','#brandClockV250','#k11520RealTradePreflightBtn','#k11520UtilityMaster','#dock','#walletToggle','#chatHandle','#bgmButton','#aiChatButton','#backpackButton','#gameModeToggle','#k11520HudCollapseAll','#orderFire','#attack','#cargoInterceptionButton','#homeDeliveryButton','#k11520CameraReset','#k11520CameraZoomStatus'];
const utilities=['#dock','#walletToggle','#chatHandle','#bgmButton','#aiChatButton','#backpackButton','#gameModeToggle','#k11520HudCollapseAll'];
await fs.mkdir(OUT,{recursive:true});
const launchBrowser=()=>chromium.launch({headless:true,...(process.env.K11520_CHROMIUM_PATH?{executablePath:process.env.K11520_CHROMIUM_PATH}:{})});
let browser=await launchBrowser();
const reports=[],failures=[],sourceChecks=[];
// Skill FX regression requires an earned Lv.3 player in this isolated QA
// browser. Build the save via the actual event authority, not fabricated XP.
// New-guest lock/progression coverage remains in browser-player-life.mjs.
const skillStorage=new Map(),skillStore=createLocalPlayerStore({storage:{getItem:k=>skillStorage.get(k)??null,setItem:(k,v)=>skillStorage.set(k,v)}});
skillStore.createPlayer();for(let i=0;i<10;i++)skillStore.recordEvent({id:`qa-skill-unlock:${i}`,type:'JOURNEY_MONSTER_KILL'});
assert.equal(skillStore.activePlayer().level,3);
const skillFixture={key:PLAYER_LIFE_STORAGE_KEY,encoded:skillStorage.get(PLAYER_LIFE_STORAGE_KEY)};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceSha=bytes=>sha(Buffer.from(Buffer.from(bytes).toString('utf8').replace(/\r\n?/g,'\n'),'utf8'));
// Default-policy coverage is separate from the existing FULL HUD geometry suite.
async function clickWorldFirstMinimap(page,result){
  // Follow closes the sheet synchronously, but its exit transition still owns
  // hit testing. Await dismissal, then let native locator actionability apply.
  await page.locator('#sheet').waitFor({state:'hidden'});
  const minimap=page.locator('#minimap');
  assert.equal(await minimap.getAttribute('data-coordinate-space'),'XYZ');
  assert.equal(await page.evaluate(()=>globalThis.__K11520_PLANE_MAP__?.mode),'XZ');
  const box=await minimap.boundingBox();
  assert.ok(box&&box.width>0&&box.height>0,'minimap must have rendered dimensions');
  result.mapInput={box,position:{x:box.width*.85,y:box.height*.8}};
  await page.evaluate(()=>{globalThis.worldFirstPointerTrace=[]});
  try{
    await minimap.click({position:result.mapInput.position});
  }finally{
    result.mapInput.delivery=await page.evaluate(()=>({events:globalThis.worldFirstPointerTrace||[],plane:globalThis.__K11520_PLANE_MAP__?.mode,coordinateSpace:document.querySelector('#minimap')?.dataset.coordinateSpace,sheetOpen:document.querySelector('#sheet')?.classList.contains('open'),waypoint:!!document.querySelector('#waypointAction'),alternateWaypoint:!!document.querySelector('#xyzWaypointAction')})).catch(()=>null);
  }
  assert.ok(result.mapInput.delivery,'minimap delivery evidence must be readable');
  const events=result.mapInput.delivery.events.filter(e=>e.type==='pointerdown'||e.type==='pointerup');
  assert.equal(events.length,2,'one native minimap down/up pair must be delivered');
  assert.equal(events[0].type,'pointerdown');
  assert.equal(events[1].type,'pointerup');
  assert.ok(events.every(e=>e.target==='minimap'&&e.isTrusted),'native pointer delivery must belong to minimap');
  assert.equal(events[0].id,events[1].id,'minimap pointer identity must remain paired');
  assert.equal(result.mapInput.delivery.plane,'XZ');
  assert.equal(result.mapInput.delivery.coordinateSpace,'XYZ');
}
async function verifyWorldFirst(){
  const results=[];
  for(const profile of selectedProfiles){
    const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    let quoteStep=0;
    if(!PRODUCTION)await page.route('https://data-api.binance.vision/api/v3/aggTrades*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(freeQuotePayload(route,[{symbol:'BTCUSDT',price:80000+quoteStep},{symbol:'ETHUSDT',price:2600},{symbol:'BNBUSDT',price:780}]))}));
    const result={profile,checks:{}};results.push(result);
    try{
      await page.goto(BASE+ROUTE,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>globalThis.__K11520_CAMERA__&&globalThis.__K11520_UI_SETTINGS__&&globalThis.__K11520_MONSTER_FOLLOW__);
      if(await page.locator('#enter11520').isVisible())await page.locator('#enter11520').click({timeout:1500}).catch(async error=>{if(await page.locator('#intro11520').isVisible())throw error});
      await page.locator('#intro11520').waitFor({state:'hidden'});
      // MINIMAL deliberately hides diagnostic telemetry; readiness is state, not visibility.
      await page.waitForFunction(()=>/READY|FALLBACK/.test(document.querySelector('#charState')?.textContent||''),null,{timeout:45000});
      await page.waitForFunction(()=>document.querySelector('.brandMetaV250 span:first-child')?.dataset.k11520ProductVersion==='V2.9.5');
      assert.match(await page.locator('.brandMetaV250 span:first-child').textContent(),/^V2\.9\.5 · 5D K線西遊記$/);
      result.checks.visibleVersion='V2.9.5';
      assert.equal(await page.evaluate(()=>globalThis.__K11520_UI_SETTINGS__.profile),'MINIMAL');
      assert.equal(await page.locator('#axes').isVisible(),false);
      assert.equal(await page.locator('#k11520CameraReset').isVisible(),false,'automatic follow has no persistent Recenter');
      for(const selector of ['#k11520MarketRow']){
        const box=await page.locator(selector).boundingBox();assert.ok(box&&box.height===44&&box.width===44,selector+' must be the single compact edge target, never a ticker row');
        assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=profile.width&&box.y+box.height<=profile.height);
      }
      const contextActions=['#cargoInterceptionButton','#homeDeliveryButton'];
      {
        const inactive=await page.evaluate(selectors=>Object.fromEntries(selectors.map(selector=>{const el=document.querySelector(selector);return[selector,{state:el?.dataset.contextState||'',visible:!!el&&getComputedStyle(el).display!=='none'}]})),contextActions);
        assert.deepEqual(inactive,{'#cargoInterceptionButton':{state:'cruise',visible:false},'#homeDeliveryButton':{state:'idle',visible:false}},'inactive context actions must not occupy the world');
        await page.locator('#k11520UtilityMaster').click();
        for(const selector of contextActions){const box=await page.locator(selector).boundingBox();assert.ok(box&&box.height>=44&&box.width>=44,selector+' must remain accessible in the existing utility rail');assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=profile.width&&box.y+box.height<=profile.height)}
        await page.locator('#k11520UtilityMaster').click();
        result.checks.contextActions='INACTIVE HIDDEN / EXISTING MORE RAIL ACCESSIBLE PASS';
      }
      // Ambient actors keep moving while the utility disclosure is exercised.
      // Reuse the existing startup visual-readiness gate before sampling; a
      // random instant can put otherwise playable actors behind the minimap.
      await page.waitForFunction(()=>__K11520_WORLD_SELECTION_PROJECTION__.journeyLifeSnapshot().filter(m=>m.visible&&m.inView&&m.uncovered).length>=2,null,{timeout:5000});
      result.visibility=await page.evaluate(()=>{
        const p=globalThis.__K11520_WORLD_SELECTION_PROJECTION__.playerHomeSnapshot().playerScreen;
        return{player:p,playerUncovered:document.elementFromPoint(p.x,p.y)?.id==='three',monsters:globalThis.__K11520_WORLD_SELECTION_PROJECTION__.journeyLifeSnapshot()};
      });
      assert.equal(result.visibility.player.inView,true);assert.equal(result.visibility.playerUncovered,true,'HUD cannot cover player');
      assert.ok(result.visibility.monsters.filter(m=>m.visible&&m.inView&&m.uncovered).length>=2,'at least two living monsters must be visibly playable');
      await page.screenshot({path:`${OUT}/world-first-${profile.width}x${profile.height}.png`});
      const read=()=>page.evaluate(()=>globalThis.__K11520_CAMERA__.snapshot());
      const cdp=await context.newCDPSession(page);
      const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y,radiusX:3,radiusY:3,force:1}))});
      // Search the rendered canvas for a real 20px clear gesture origin and
      // four unobstructed drag endpoints. Actors may cross the later path; only
      // the origin is an actionable-target exclusion in the product contract.
      const point=await page.evaluate(()=>{const canvas=document.querySelector('#three'),r=canvas.getBoundingClientRect();for(let y=r.top+80;y<r.bottom-80;y+=12)for(let x=r.left+80;x<r.right-80;x+=12)if(globalThis.__K11520_CAMERA__.isWorldGestureArea(x,y,10)&&[[60,0],[-60,0],[0,60],[0,-60]].every(([dx,dy])=>document.elementFromPoint(x+dx,y+dy)===canvas))return{x,y};return null});
      assert.ok(point,'an unobstructed world gesture surface must exist');
      const start=await read(),{x,y}=point;
      await page.evaluate(()=>{globalThis.worldFirstPointerTrace=[];for(const type of ['pointerdown','pointermove','pointerup','pointercancel'])document.addEventListener(type,e=>{if(worldFirstPointerTrace.length<30)worldFirstPointerTrace.push({type,id:e.pointerId,target:e.target.id,isTrusted:e.isTrusted,x:e.clientX,y:e.clientY,button:e.button,canPan:__K11520_CAMERA__.canPanAt(e.clientX,e.clientY)})},true)});
      const directions=[];
      for(const [name,dx,dy,screenAxis,sign] of [['right',60,0,'x',1],['left',-60,0,'x',-1],['down',0,60,'y',1],['up',0,-60,'y',-1]]){
        if(await page.locator('#k11520CameraReset').isVisible())await page.locator('#k11520CameraReset').click();
        assert.equal(await page.locator('#k11520CameraReset').isVisible(),false,'automatic Camera has no persistent control between gestures');
        // Recenter mutates Camera state immediately, while the projected world
        // catches up on the next rendered frame. Wait for that canonical visual
        // state instead of racing a fixed sleep on a busy landscape runner.
        await page.waitForFunction(origin=>{const c=__K11520_CAMERA__.snapshot(),p=__K11520_WORLD_SELECTION_PROJECTION__.playerHomeSnapshot().playerScreen;return c.zoom===1&&c.panX===0&&c.panZ===0&&c.manual===false&&Math.abs(p.x-origin.x)<.5&&Math.abs(p.y-origin.y)<.5},result.visibility.player,{timeout:3000});
        // Actors keep moving between directions. Reusing the first origin may
        // correctly select a newly arrived actor instead of starting camera pan.
        const acquisition={name,attempts:[]};(result.cameraInputAcquisitions??=[]).push(acquisition);
        const admitted=await acquireAdmittedCameraPan({records:acquisition.attempts,
          pick:()=>page.evaluate(selectWorldFirstPanOrigin,{dx,dy}),
          begin:point=>touch('touchStart',[[1,point.x,point.y]]),cancel:()=>touch('touchCancel',[]),
          inspect:()=>page.evaluate(()=>({down:worldFirstPointerTrace.find(e=>e.type==='pointerdown'&&e.isTrusted)||null,trace:[...worldFirstPointerTrace],camera:__K11520_CAMERA__.snapshot(),player:__K11520_WORLD_SELECTION_PROJECTION__.playerHomeSnapshot().playerScreen}))});
        const gesturePoint=admitted.origin,before=admitted.before,gx=gesturePoint.x,gy=gesturePoint.y;
        await touch('touchMove',[[1,gx+dx/2,gy+dy/2]]);await touch('touchMove',[[1,gx+dx,gy+dy]]);await touch('touchEnd',[]);
        const attempt={name,origin:gesturePoint,before,finger:{dx,dy},admission:admitted.admission};(result.cameraAttempts??=[]).push(attempt);
        try{await page.waitForFunction(({before,screenAxis,sign})=>(__K11520_WORLD_SELECTION_PROJECTION__.playerHomeSnapshot().playerScreen[screenAxis]-before[screenAxis])*sign>8,{before:before.player,screenAxis,sign},{timeout:3000})}
        finally{attempt.after=await page.evaluate(()=>({camera:__K11520_CAMERA__.snapshot(),player:__K11520_WORLD_SELECTION_PROJECTION__.playerHomeSnapshot().playerScreen}));attempt.pointerTrace=await page.evaluate(()=>worldFirstPointerTrace)}
        const after=attempt.after;
        assert.ok((after.player[screenAxis]-before.player[screenAxis])*sign>8,`drag ${name} must move world content ${name}`);
        assert.deepEqual(after.camera.playerXYZ,start.playerXYZ,'camera pan never moves XYZ');
        assert.equal(await page.locator('#k11520CameraReset').isVisible(),true,'native manual pan reveals the existing Recenter');
        directions.push({name,origin:gesturePoint,finger:{dx,dy},content:{dx:after.player.x-before.player.x,dy:after.player.y-before.player.y},camera:after.camera});
        await page.screenshot({path:`${OUT}/camera-${profile.name}-pan-${name}.png`});
      }
      result.pointerTrace=await page.evaluate(()=>({events:worldFirstPointerTrace,touchAction:getComputedStyle(document.querySelector('#three')).touchAction,scale:visualViewport.scale}));result.panOrigin=point;result.cameraDirections=directions;
      // Pinch has a different footprint than the one-sided pan. Both actual
      // finger origins and endpoints must hit canvas, not a left-side HUD.
      const pinchPoint=await page.evaluate(y=>{for(let x=100;x<innerWidth-100;x+=12)if([-90,-30,30,90].every(dx=>document.elementFromPoint(x+dx,y)?.id==='three'))return{x,y};return null},y);
      assert.ok(pinchPoint,'both pinch fingers must originate on world canvas');result.pinchOrigin=pinchPoint;
      await page.locator('#k11520CameraReset').click();await touch('touchStart',[[1,pinchPoint.x-30,y],[2,pinchPoint.x+30,y]]);await touch('touchMove',[[1,pinchPoint.x-90,y],[2,pinchPoint.x+90,y]]);await touch('touchEnd',[]);await page.waitForTimeout(80);
      const zoomMax=await read();assert.equal(zoomMax.zoom,zoomMax.bounds.maxZoom);assert.deepEqual(zoomMax.playerXYZ,start.playerXYZ);assert.match(await page.locator('#k11520CameraZoomStatus').textContent(),/2\.50×/);await page.screenshot({path:`${OUT}/camera-${profile.name}-zoom-max.png`});
      await page.locator('#k11520CameraReset').click();await touch('touchStart',[[1,pinchPoint.x-90,y],[2,pinchPoint.x+90,y]]);await touch('touchMove',[[1,pinchPoint.x-30,y],[2,pinchPoint.x+30,y]]);await touch('touchEnd',[]);await page.waitForTimeout(80);
      const zoomMin=await read();assert.equal(zoomMin.zoom,zoomMin.bounds.minZoom);assert.deepEqual(zoomMin.playerXYZ,start.playerXYZ);assert.match(await page.locator('#k11520CameraZoomStatus').textContent(),/0\.40×/);await page.screenshot({path:`${OUT}/camera-${profile.name}-zoom-min.png`});
      await page.locator('#k11520CameraReset').click();assert.deepEqual(await read(),start);assert.equal(await page.locator('#k11520CameraReset').isVisible(),false,'Recenter returns to contextual hidden state');
      await page.screenshot({path:`${OUT}/camera-${profile.name}-recenter.png`});
      await page.waitForFunction(original=>{const p=__K11520_WORLD_SELECTION_PROJECTION__.playerHomeSnapshot().playerScreen;return Math.abs(p.x-original.x)<.5&&Math.abs(p.y-original.y)<.5},result.visibility.player,{timeout:3000});
      await page.locator('#k11520MarketRow').click();assert.equal(await page.locator('#axes').isVisible(),true);
      const marketReadability=await page.locator('#axes').evaluate(el=>{
        const cards=[...el.querySelectorAll('.axis')];
        return cards.map(card=>{const r=card.getBoundingClientRect(),symbol=card.querySelector('.marketName'),price=card.querySelector('.q'),address=card.querySelector('.marketKValue'),style=address?getComputedStyle(address):null;return{width:r.width,symbol:symbol?.textContent?.trim(),symbolFits:!!symbol&&symbol.scrollWidth<=symbol.clientWidth+1&&symbol.scrollHeight<=parseFloat(getComputedStyle(symbol).lineHeight)+1,price:price?.textContent?.trim(),priceFits:!!price&&price.scrollWidth<=price.clientWidth+1&&price.scrollHeight<=parseFloat(getComputedStyle(price).lineHeight)+1,address:address?.textContent?.trim(),addressFits:!!address&&address.scrollWidth<=address.clientWidth+1&&address.getBoundingClientRect().bottom<=r.bottom-3,overflowWrap:style?.overflowWrap,wordBreak:style?.wordBreak}});
      });
      assert.deepEqual(marketReadability.map(x=>x.symbol),['BTC/USDT','ETH/USDT','BNB/USDT']);
      assert.ok(Math.max(...marketReadability.map(x=>x.width))-Math.min(...marketReadability.map(x=>x.width))<1,'expanded market cards must remain equal width');
      assert.ok(marketReadability.every(x=>x.width>=94),`expanded market cards must retain readable width: ${JSON.stringify(marketReadability)}`);
      for(const card of marketReadability){assert.equal(card.symbolFits,true,card.symbol+' must remain complete on one line');assert.equal(card.priceFits,true,card.symbol+' price must remain complete on one line');assert.match(card.address,/k\s*=\s*-?\d+/);assert.match(card.address,/α\s*=\s*\d/);assert.match(card.address,/θ\s*=\s*(?:0|π)/);assert.equal(card.addressFits,true,card.symbol+' universe address must not overflow its card');assert.equal(card.overflowWrap,'normal');assert.equal(card.wordBreak,'keep-all')}
      const expandedWorld=await page.evaluate(()=>{const guide=document.querySelector('#k11520MonsterGuide').getBoundingClientRect(),player=__K11520_WORLD_SELECTION_PROJECTION__.playerHomeSnapshot().playerScreen;return{guideHeight:guide.height,playerUncovered:document.elementFromPoint(player.x,player.y)?.id==='three'}});
      assert.ok(expandedWorld.guideHeight<=52,'expanded Market must not stretch the compact monster guide across the world');
      assert.equal(expandedWorld.playerUncovered,true,'expanded Market guide must not cover the player');
      result.expandedWorld=expandedWorld;
      await page.screenshot({path:`${OUT}/market-expanded-${profile.width}x${profile.height}.png`});
      // Quotes replace card DOM; read the currently attached visible card and
      // its rectangle atomically instead of using a transient element handle.
      const card=await page.locator('#axes').evaluate(el=>{const card=el.querySelector('.axis');if(!card)return null;const r=card.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}});
      assert.ok(card&&card.width>0&&card.height>0,'expanded market must render a visible card');
      await touch('touchStart',[[1,card.x+10,card.y+12]]);
      // Real deadline test: a held pointer must survive the entire 15s idle interval.
      await page.waitForTimeout(15100);assert.equal(await page.locator('#axes').isVisible(),true);
      await touch('touchMove',[[1,card.x+20,card.y+12]]);await touch('touchEnd',[]);
      if(await page.locator('#sheet').evaluate(el=>el.classList.contains('open')))await page.locator('#sheetClose').click();
      await page.waitForFunction(()=>getComputedStyle(document.getElementById('axes')).display==='none',null,{timeout:17000});
      assert.deepEqual(await read(),start,'card gestures must not pan camera');
      assert.doesNotMatch(await page.locator('#k11520MarketRow').textContent(),/BTC|ETH|BNB|LIVE/,'collapsed Market must not preserve a quote ticker');await page.screenshot({path:`${OUT}/market-idle-hidden-${profile.width}x${profile.height}.png`});
      result.checks.marketIdle='15s / held-pointer / resume / true-hide PASS';result.checks.camera='PAN / PINCH / RESET / XYZ ISOLATION PASS';
      quoteStep=100;
      await page.waitForFunction(()=>globalThis.__K11520_MONSTER_FOLLOW__.snapshot().actors.some(m=>m.intent?.direction==='LONG'),null,{timeout:15000});
      const before=await page.evaluate(()=>globalThis.__K11520_MONSTER_FOLLOW__.snapshot());
      await page.locator('#k11520MonsterGuide').click();
      if(profile.name==='cold-390')await page.screenshot({path:`${OUT}/world-first-follow-details-390.png`});
      await page.locator('#monsterFollowAction').click();
      assert.equal(await page.locator('#k11520FollowMonster').isVisible(),true);
      await page.waitForFunction(old=>globalThis.__K11520_MONSTER_FOLLOW__.snapshot().actors.some((m,i)=>Math.hypot(m.position.x-old[i].position.x,m.position.y-old[i].position.y,m.position.z-old[i].position.z)>.02),before.actors);
      const followed=await page.evaluate(()=>globalThis.__K11520_MONSTER_FOLLOW__.snapshot().followedMonsterId);
      if(profile.name==='cold-390'){
        // Exclude the existing avatar priority ellipse, not an arbitrary entire
        // vertical strip that can reject clearly visible moving actors. Read a
        // fresh projection for each real click because market-life actors keep
        // moving while a slower browser runner is dispatching pointer input.
        let switchControlVisible=false;
        for(let attempt=0;attempt<8&&!switchControlVisible;attempt++){
          const other=await page.evaluate(current=>globalThis.__K11520_WORLD_SELECTION_PROJECTION__.journeyLifeSnapshot().find(m=>m.id!==current&&m.visible&&m.inView&&m.uncovered&&((m.screen.x-innerWidth/2)/34)**2+((m.screen.y-innerHeight/2)/62)**2>1.1&&__K11520_MONSTER_FOLLOW__.snapshot().actors.some(a=>a.id===m.id&&a.alive)),followed);
          assert.ok(other,'a second market-life actor must be selectable');
          await page.mouse.click(other.screen.x,other.screen.y);
          switchControlVisible=await page.locator('#monsterFollowAction').waitFor({state:'visible',timeout:750}).then(()=>true,()=>false);
          if(!switchControlVisible&&await page.locator('#sheet.open').isVisible())await page.locator('#sheetClose').click();
        }
        assert.equal(switchControlVisible,true,'a fresh moving-actor world tap must expose follow control');
        await page.locator('#monsterFollowAction').click();
        assert.notEqual(await page.evaluate(()=>globalThis.__K11520_MONSTER_FOLLOW__.snapshot().followedMonsterId),followed,'player can switch the followed actor');
        await page.locator('#k11520FollowMonster').click();await page.locator('#k11520MonsterGuide').click();await page.locator('#monsterFollowAction').click();
        result.checks.followSwitch='ACTUAL WORLD TAP / SWITCH / CANCEL PASS';
      }
      await clickWorldFirstMinimap(page,result);
      await page.locator('#waypointAction').waitFor({state:'visible'});await page.locator('#waypointAction').click();
      await page.waitForFunction(old=>Math.hypot(globalThis.__K11520_CAMERA__.snapshot().playerXYZ.x-old.x,globalThis.__K11520_CAMERA__.snapshot().playerXYZ.z-old.z)>.5,start.playerXYZ);
      // Canonical joystick remains the movement owner and cancels waypoint navigation.
      const joy=await page.locator('#joy').boundingBox();await page.mouse.move(joy.x+joy.width*.5,joy.y+joy.height*.5);await page.mouse.down();await page.mouse.move(joy.x+joy.width*.7,joy.y+joy.height*.5);await page.mouse.up();
      assert.equal((await read()).panX,0);assert.equal((await read()).zoom,1);
      assert.equal(await page.evaluate(()=>globalThis.__K11520_MONSTER_FOLLOW__.snapshot().followedMonsterId),followed,'manual navigation must remain free while following');
      await page.locator('#k11520FollowMonster').click();assert.equal(await page.evaluate(()=>globalThis.__K11520_MONSTER_FOLLOW__.snapshot().followedMonsterId),null);
      await page.locator('#attack').click();result.checks.navigation='MAP WAYPOINT / MOVEMENT / JOYSTICK CAMERA CONFLICT PASS';result.checks.monster='INTENT / MOVEMENT / FOLLOW / CANCEL / ATTACK CONTROL PASS';
      let completedGrowth=null;
      if(profile.name==='cold-390'){
        // Actual 60s prospective observation, no clock jump or score injection.
        quoteStep=200;
        await page.waitForFunction(id=>globalThis.__K11520_MONSTER_FOLLOW__.snapshot().actors.find(a=>a.id===id)?.growth.wins>=1,followed,{timeout:70000});
        completedGrowth=await page.evaluate(id=>globalThis.__K11520_MONSTER_FOLLOW__.snapshot().actors.find(a=>a.id===id).growth,followed);
        assert.equal(completedGrowth.experience,completedGrowth.wins);assert.equal(completedGrowth.predictionCount,completedGrowth.wins+completedGrowth.losses+(completedGrowth.flat||0));
        result.completedGrowth=completedGrowth;
        result.checks.performance='REAL 60s / CAUSAL RESULT / EXISTING GROWTH PASS';
      }
      await page.locator('#k11520UtilityMaster').click();await page.locator('#gameModeToggle').click();await page.locator('#k11520HudProfile').selectOption('STANDARD');
      await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>globalThis.__K11520_UI_SETTINGS__?.profile==='STANDARD');
      if(completedGrowth){await page.waitForFunction(id=>globalThis.__K11520_MONSTER_FOLLOW__?.snapshot().actors.some(a=>a.id===id),followed);assert.deepEqual(await page.evaluate(id=>globalThis.__K11520_MONSTER_FOLLOW__.snapshot().actors.find(a=>a.id===id).growth,followed),completedGrowth,'reload keeps completed growth without fabricating a new result');result.checks.performanceReload='EXACT GROWTH RETAINED PASS'}
      assert.equal(await page.evaluate(()=>globalThis.__K11520_MONSTER_FOLLOW__?.snapshot().automatesTrading),false);
      assert.deepEqual(errors,[]);result.checks.reload='PREFERENCE RETAINED / NO AUTO TRADE PASS';
    }catch(error){result.error=String(error);result.failureVisibility=await page.evaluate(()=>{const projection=globalThis.__K11520_WORLD_SELECTION_PROJECTION__;if(!projection)return null;return{player:projection.playerHomeSnapshot().playerScreen,monsters:projection.journeyLifeSnapshot().map(m=>{const hit=document.elementFromPoint(m.screen.x,m.screen.y);return{...m,hitOwner:hit?{id:hit.id,classes:String(hit.className),text:(hit.textContent||'').slice(0,100)}:null}})}}).catch(()=>null);result.failurePointerTrace=await page.evaluate(()=>globalThis.worldFirstPointerTrace||[]).catch(()=>[]);result.failurePanPick=await page.evaluate(()=>globalThis.worldFirstPanPickDiagnostics||null).catch(()=>null);await page.screenshot({path:`${OUT}/world-first-${profile.width}-FAIL.png`}).catch(()=>{});throw error}
    finally{await context.close();await fs.writeFile(`${OUT}/world-first-report.json`,JSON.stringify({results,head:process.env.K11520_SOURCE_SHA||null},null,2))}
  }
}
async function ensureExpandedMarket(page){
  if(!await page.locator('#axes').isVisible())await page.locator('#k11520MarketRow').click();
  await page.locator('#axes').waitFor({state:'visible'});
  // Reflow from actual disclosure before geometry assertions, without waiting
  // for a desired margin or weakening any retained clearance threshold.
  await page.evaluate(async()=>{for(let i=0;i<3;i++)await new Promise(requestAnimationFrame)});
}
async function verifyMarketHeaderSeparation(page,report,state){
  const observation=await page.evaluate(()=>{
    const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}},edge=document.querySelector('#k11520MarketRow'),edgeRect=rect(edge),hit=document.elementFromPoint(edgeRect.x+edgeRect.width/2,edgeRect.y+edgeRect.height/2);
    return{edge:edgeRect,edgeHit:hit===edge||edge.contains(hit),width:innerWidth,height:innerHeight,balances:['topFree','topKaios'].map(id=>{const value=document.getElementById(id),pill=value.closest('.pill');return{id,pill:rect(pill),fields:[pill.querySelector('small'),value].map(el=>({text:el.textContent.trim(),rect:rect(el)}))}})};
  });
  assert.equal(observation.edgeHit,true,'Market edge keeps its actual pointer ownership');
  for(const balance of observation.balances){
    assert.ok(balance.pill.width>0&&balance.pill.height>0,'FULL keeps both header balances visible');
    for(const field of balance.fields){const r=field.rect,e=observation.edge,p=balance.pill;
      assert.ok(field.text.length>0&&r.width>0&&r.height>0,'balance label/value remains rendered');
      assert.ok(r.x>=p.x&&r.right<=p.right&&r.y>=p.y&&r.bottom<=p.bottom,'balance label/value fits its own pill: '+JSON.stringify(field));
      assert.ok(r.x>=0&&r.right<=observation.width&&r.y>=0&&r.bottom<=observation.height,'balance label/value remains inside the viewport');
      assert.ok(!(r.x<e.right&&r.right>e.x&&r.y<e.bottom&&r.bottom>e.y),'Market edge must not cover balance label/value: '+balance.id+' '+JSON.stringify(field));
    }
    const e=observation.edge,p=balance.pill;assert.ok(!(p.x<e.right&&p.right>e.x&&p.y<e.bottom&&p.bottom>e.y),'Market edge keeps a separate lane from the full balance pill');
  }
  (report.marketHeaderSeparation||={})[state]=observation;
}
async function verifySettingsInterruptedRails(page,report){
  if(!await page.locator('#gameModeToggle').isVisible())await page.locator('#k11520UtilityMaster').click();
  const cdp=await page.context().newCDPSession(page),selectors=['#cControl','#lotsControl','#yControl'];
  const points=await page.evaluate(selectors=>selectors.map((selector,i)=>{const r=document.querySelector(selector).getBoundingClientRect();return{id:i+21,x:r.x+r.width/2,y:r.y+r.height*.35,radiusX:3,radiusY:3,force:1}}),selectors);
  const read=()=>page.evaluate(()=>({c:__K11520_SIGNED_C_IMMERSIVE__.signedC,lots:__K11520_SIGNED_C_IMMERSIVE__.lots,rail:__K11520_3D_CONTROL__.rail.value,xyz:{...__K11520_WORLD_COORDS__.physical}}));
  const initial=await read();
  try{
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
    await page.waitForFunction(()=>__K11520_3D_CONTROL__.rail.active===true);
    const committed=await read();
    // Native keyboard activation while three existing rail contacts are held.
    await page.locator('#gameModeToggle').focus();await page.keyboard.press('Enter');await page.locator('#k11520UiSettings').waitFor({state:'visible'});
    await page.waitForFunction(()=>__K11520_3D_CONTROL__.rail.active===false);
    const stopped=await read();assert.equal(stopped.c,committed.c);assert.equal(stopped.lots,committed.lots);assert.equal(stopped.rail,0);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points.map(p=>({...p,y:p.y+20}))});await page.waitForTimeout(180);
    assert.deepEqual(await read(),stopped,'captured contacts cannot edit or continue motion while Settings owns the foreground');
    await page.screenshot({path:`${OUT}/${report.profile.name}-settings-interrupted-rails.png`});
    await page.keyboard.press('Escape');await page.locator('#k11520UiSettings').waitFor({state:'hidden'});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points.map(p=>({...p,y:p.y+35}))});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(180);
    assert.deepEqual(await read(),stopped,'old move/up after close cannot resume a cancelled rail');
    const fresh={...points[0],id:31,y:points[0].y+50};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[fresh]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.notEqual((await read()).c,stopped.c,'fresh native pointerdown works after dismissal');
    await page.locator('#cNumericInput').fill(String(initial.c));await page.locator('#cNumericInput').press('Enter');await page.locator('#lotsNumericInput').fill(String(initial.lots));await page.locator('#lotsNumericInput').press('Enter');
    report.interruptedRails='NATIVE_THREE_CONTACT / KEYBOARD_OPEN / CANCEL / ESCAPE / NO_OLD_RESUME / FRESH_DOWN PASS';
  }finally{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}).catch(()=>{});await cdp.detach();if(await page.locator('#k11520UiSettings').isVisible())await page.locator('#k11520UiSettingsClose').click();if(await page.locator('#k11520UtilityMaster').getAttribute('aria-expanded')==='true')await page.locator('#k11520UtilityMaster').click()}
}

async function verifyScrolledControlCenters(page,selector,label){
  // This is a read-only hit-ownership inspection, not an activation. Native
  // scrolling plus stable rendered frames avoids repeating Playwright's input
  // actionability wait for every item in every Settings cycle. Actual clicks,
  // keyboard navigation and preference changes below remain native inputs.
  const inspection=await page.locator(selector).evaluateAll(async controls=>{
    const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility==='visible'&&(!el.checkVisibility||el.checkVisibility())};
    const results=[];
    // Settle the dialog once. Instant scrolling and the subsequent layout read
    // are synchronous, so inspecting each newly scrolled control needs no
    // additional animation-frame/actionability wait.
    const deadline=performance.now()+5000;let previous=null,stable=0;
    while(controls.length&&performance.now()<deadline){
      await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Control inspection animation frame stalled')),Math.max(1,deadline-performance.now()));requestAnimationFrame(()=>{clearTimeout(timer);resolve()})});
      const rects=controls.map(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}});
      if(previous&&rects.every((rect,i)=>Object.keys(rect).every(key=>rect[key]===previous[i][key])))stable++;else stable=0;
      previous=rects;if(stable>=2)break;
    }
    for(const el of controls){
      el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
      const r=el.getBoundingClientRect(),rect={x:r.x,y:r.y,width:r.width,height:r.height};
      const hit=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
      // A wrapped inline anchor has one rendered rectangle per line. Its
      // union-box center can be whitespace in the parent paragraph, not part
      // of the link. Inspect every positive fragment, without accepting the
      // parent or filtering an occluded fragment. Other controls are unchanged.
      const fragments=el.tagName==='A'?[...el.getClientRects()].filter(r=>r.width>0&&r.height>0).map(r=>{const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{rect:{x:r.x,y:r.y,width:r.width,height:r.height},ownsCenter:hit===el||el.contains(hit),hit:hit?.id||hit?.tagName||null}}):[{rect,ownsCenter:hit===el||el.contains(hit),hit:hit?.id||hit?.tagName||null}];
      results.push({id:el.id||el.dataset.uiKey||el.tagName,visible:visible(el),connected:el.isConnected,ownsCenter:fragments.length>0&&fragments.every(fragment=>fragment.ownsCenter),rect,hit:hit?.id||hit?.tagName||null,unionOwnsCenter:hit===el||el.contains(hit),fragments});
    }
    return{stable:stable>=2,results};
  });
  const {results}=inspection;
  assert.ok(results.length,label+' has visible controls');
  assert.equal(inspection.stable,true,label+' dialog reaches stable geometry before inspection');
  for(const result of results){assert.equal(result.connected,true,label+' control remains connected: '+JSON.stringify(result));assert.equal(result.visible,true,label+' control is visible: '+JSON.stringify(result));assert.equal(result.ownsCenter,true,label+' control owns its actual center: '+JSON.stringify(result))}
}
async function verifySettingsContext(page,report){
  const started=Date.now();
  const ids=['k11520UtilityMaster','cargoInterceptionButton','homeDeliveryButton','dock','gameModeToggle','walletToggle','walletPanel','chatHandle','gameChat','bgmButton','aiChatButton','aiChatPanel','backpackButton','backpackPanel','k11520HudCollapseAll','kaiosPortalButton','playerCourierDetails','playerBanditPanel','cControl','lotsControl','yControl'];
  if(!await page.locator('#gameModeToggle').isVisible())await page.locator('#k11520UtilityMaster').click();
  const railValues=await page.locator('#cRead,#lotsRead,#yRead').allTextContents();
  const original=await page.evaluate(ids=>Object.fromEntries(ids.map(id=>{const el=document.getElementById(id);return[id,el?{inert:el.inert,open:el.classList.contains('open'),collapsed:el.classList.contains('collapsed'),display:getComputedStyle(el).display}:null]})),ids);
  for(const [cycle,closeWith] of ['button','Escape','button'].entries()){
    let escapeMarketBefore=null;
    if(closeWith==='Escape'){await page.locator('#gameModeToggle').focus();await page.keyboard.press('Enter')}else await page.locator('#gameModeToggle').click();await page.locator('#k11520UiSettings').waitFor({state:'visible'});
    const keyboardWorld=await page.evaluate(()=>__K11520_CAMERA__.snapshot().playerXYZ);
    for(const key of ['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'])await page.keyboard.press(key);
    assert.deepEqual(await page.evaluate(()=>__K11520_CAMERA__.snapshot().playerXYZ),keyboardWorld,'Settings keyboard focus cannot move the world');
    assert.deepEqual(await page.locator('#cRead,#lotsRead,#yRead').allTextContents(),railValues,'Settings keys cannot edit hidden rails');
    await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.querySelector('#k11520UiSettings').contains(document.activeElement)),true,'reverse Tab stays within Settings');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement?.id),'k11520UiSettingsClose','forward Tab wraps to the dialog close control');
    const hidden=await page.evaluate(ids=>ids.map(id=>{const el=document.getElementById(id),r=el?.getBoundingClientRect(),s=el&&getComputedStyle(el),hit=r&&document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return{id,exists:!!el,inert:el?.inert,visible:!!s&&s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0,ownsHit:!!hit&&(el===hit||el.contains(hit))}}),ids);
    for(const control of hidden.filter(x=>x.exists)){assert.equal(control.inert,true,'Settings must inert '+control.id);assert.equal(control.visible,false,'Settings must hide '+control.id);assert.equal(control.ownsHit,false,'Settings must remove hit ownership from '+control.id)}
    await verifyScrolledControlCenters(page,'#k11520UiSettings button,#k11520UiSettings select','Settings');
    await page.locator('#k11520UiSettingsClose').scrollIntoViewIfNeeded();
    if(cycle===2)await page.screenshot({path:`${OUT}/${report.profile.name}-settings-owned.png`});
    if(closeWith==='Escape'){escapeMarketBefore=await page.locator('#k11520MarketRow').getAttribute('aria-expanded');await page.locator('#k11520MarketRow').click();assert.equal(await page.locator('#k11520UiSettings').isVisible(),true);await page.keyboard.press('Escape')}else await page.locator('#k11520UiSettingsClose').click();
    await page.waitForFunction(()=>!document.documentElement.classList.contains('k11520SettingsOpen'));
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'gameModeToggle','Settings close returns keyboard focus to its launcher');
    if(escapeMarketBefore!==null&&await page.locator('#k11520MarketRow').getAttribute('aria-expanded')!==escapeMarketBefore)await page.locator('#k11520MarketRow').click();
    const restored=await page.evaluate(ids=>Object.fromEntries(ids.map(id=>{const el=document.getElementById(id);return[id,el?{inert:el.inert,open:el.classList.contains('open'),collapsed:el.classList.contains('collapsed'),display:getComputedStyle(el).display}:null]})),ids);
    assert.deepEqual(restored,original,'Settings restores original disclosure/inert states, never opens a hidden organ');
    assert.deepEqual(await page.locator('#cRead,#lotsRead,#yRead').allTextContents(),railValues,'Settings preserves all three rail values');
  }
  // Preferences changed in Settings remain authoritative after the modal closes,
  // including rails reparented out of .sliderDock in short landscape.
  await page.locator('#gameModeToggle').click();await page.locator('[data-ui-key="params"]').click();await page.locator('[data-ui-key="chat"]').click();await page.locator('#k11520UiSettingsClose').click();
  for(const selector of ['#cControl','#lotsControl','#yControl','#chatHandle'])assert.equal(await page.locator(selector).isVisible(),false,selector+' retains its off preference after Settings closes');
  await page.screenshot({path:`${OUT}/${report.profile.name}-settings-preferences-retained.png`});
  await page.locator('#gameModeToggle').click();await page.locator('[data-ui-key="params"]').click();await page.locator('[data-ui-key="chat"]').click();await page.locator('#k11520UiSettingsClose').click();
  for(const selector of ['#cControl','#lotsControl','#yControl','#chatHandle'])assert.equal(await page.locator(selector).isVisible(),true,selector+' returns only after explicit preference-on');
  assert.deepEqual(await page.locator('#cRead,#lotsRead,#yRead').allTextContents(),railValues,'switching visibility never resets committed rail values');
  // Wallet owns its foreground after Settings, without account requests.
  // M1's existing-owner guard hides peer utilities until Wallet is closed.
  await page.locator('#walletToggle').click();await page.waitForFunction(()=>!document.querySelector('#walletPanel').classList.contains('collapsed'));
  await page.waitForFunction(()=>document.querySelector('#gameModeToggle').style.display==='none');await page.waitForTimeout(150);
  // Cross at least two normal owner ticks; polling must not resurrect peers.
  for(const selector of ['#gameModeToggle','#dock','#chatHandle','#bgmButton','#aiChatButton','#backpackButton','#kaiosPortalButton','#cargoInterceptionButton','#homeDeliveryButton'])assert.equal(await page.locator(selector).isVisible(),false,selector+' must not cover Wallet');
  await verifyScrolledControlCenters(page,'#walletPanel button:visible,#walletPanel select:visible,#walletPanel a:visible','Wallet');
  assert.equal(await page.locator('#walletToggle').evaluate(el=>{const r=el.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===el}),true,'Wallet close toggle stays pointer reachable');
  await page.screenshot({path:`${OUT}/${report.profile.name}-wallet-restored.png`});await page.locator('#walletToggle').click();
  await page.locator('#gameModeToggle').waitFor({state:'visible'});for(const selector of ['#cargoInterceptionButton','#homeDeliveryButton'])assert.equal(await page.locator(selector).isVisible(),true,selector+' returns to manual More access after Wallet closes');assert.equal(await page.locator('#walletPanel').isVisible(),false,'Wallet close restores the existing tray');
  await page.locator('#k11520UtilityMaster').click();report.settingsContext='THREE_CYCLES / BUTTON_ESCAPE_FOCUS / ORIGINAL_STATES / WALLET_OWNERSHIP PASS';report.settingsContextMs=Date.now()-started;
}
async function verifyContextualHud(){
  const contextualProfiles=PRODUCTION&&!process.env.K11520_RESPONSIVE_PROFILE?[{name:'pages-360',width:360,height:740},{name:'pages-390',width:390,height:844},{name:'pages-412',width:412,height:772},{name:'pages-432',width:432,height:856},{name:'pages-480',width:480,height:900},{name:'pages-landscape-844',width:844,height:390,landscape:true}]:selectedProfiles;
  for(const profile of contextualProfiles){
    const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[],report={profile,checks:{}};reports.push(report);page.on('pageerror',e=>errors.push(String(e)));
    if(!PRODUCTION)await page.route('https://data-api.binance.vision/api/v3/aggTrades*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(freeQuotePayload(route,[{symbol:'BTCUSDT',price:'77564.83'},{symbol:'ETHUSDT',price:'2511.16'},{symbol:'BNBUSDT',price:'724.23'}]))}));
    try{
      await page.goto(BASE+ROUTE,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>globalThis.__K11520_CAMERA__&&globalThis.__K11520_UI_SETTINGS__&&globalThis.__K11520_PLAYER_COURIER__?.snapshot?.());
      // Bootstrap may disable/remove the intro during its native pointerdown or
      // fail-open transition. Match the existing world-first/returning-player
      // entry contract: a click error is acceptable only after intro dismissal.
      if(await page.locator('#enter11520').isVisible())await page.locator('#enter11520').click({timeout:1500}).catch(async error=>{if(await page.locator('#intro11520').isVisible())throw error});
      await page.locator('#intro11520').waitFor({state:'hidden'});
      await page.waitForFunction(()=>/READY|FALLBACK/.test(document.querySelector('#charState')?.textContent||''));
      assert.equal(await page.locator('#axes').isVisible(),false);assert.equal(await page.locator('#k11520CameraReset').isVisible(),false);
      for(const id of ['cargoInterceptionButton','homeDeliveryButton'])assert.equal(await page.locator('#'+id).isVisible(),false,'idle action is absent from World');
      const edge=await page.locator('#k11520MarketRow').boundingBox();assert.ok(edge.width===44&&edge.height===44,'Market disclosure is one tiny edge control, never a ticker row');assert.doesNotMatch(await page.locator('#k11520MarketRow').textContent(),/BTC|ETH|BNB|LIVE/);
      await page.screenshot({path:`${OUT}/${profile.name}-contextual-world.png`});
      await verifySettingsContext(page,report);
      if(profile.width===390||profile.landscape)await verifySettingsInterruptedRails(page,report);
      // Actual native drag proves the initially hidden left circle has one
      // Camera-only handler and becomes available only after manual input.
      const before=await page.evaluate(()=>__K11520_CAMERA__.snapshot());
      const point=await page.evaluate(async()=>{let candidate=null,since=0,frames=0;const began=performance.now(),eligible=p=>__K11520_CAMERA__.isWorldGestureArea(p.x,p.y,10)&&document.elementFromPoint(p.x+40,p.y)?.id==='three';while(performance.now()-began<2000){if(!candidate||!eligible(candidate)){candidate=null;frames=0;for(let y=90;y<innerHeight-80&&!candidate;y+=12)for(let x=80;x<innerWidth-80;x+=12)if(eligible({x,y})){candidate={x,y};since=performance.now();break}}else if(++frames>=3&&performance.now()-since>=150)return candidate;await new Promise(requestAnimationFrame)}return null});assert.ok(point,'native Camera pan needs an eligible world origin stable across three frames / 150ms');
      await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+40,point.y,{steps:4});await page.mouse.up();
      await page.locator('#k11520CameraReset').waitFor({state:'visible'});const manual=await page.evaluate(()=>__K11520_CAMERA__.snapshot());assert.equal(manual.manual,true);assert.deepEqual(manual.playerXYZ,before.playerXYZ);
      await page.screenshot({path:`${OUT}/${profile.name}-contextual-recenter.png`});await page.locator('#k11520CameraReset').click();assert.equal(await page.locator('#k11520CameraReset').isVisible(),false);assert.deepEqual(await page.evaluate(()=>__K11520_CAMERA__.snapshot()),before);
      await ensureExpandedMarket(page);await page.waitForFunction(()=>globalThis.__K11520_MARKET_K__?.status==='LIVE');
      const cards=await page.locator('#axes').evaluate(el=>[...el.querySelectorAll('.axis')].map(card=>{const r=card.getBoundingClientRect();return{width:r.width,left:r.left,right:r.right,fields:['.marketName','.q','.marketKValue'].map(s=>{const f=card.querySelector(s),b=f.getBoundingClientRect();return{text:f.textContent,width:f.clientWidth,scroll:f.scrollWidth,bottom:b.bottom,cardBottom:r.bottom}})}}));
      assert.equal(cards.length,3);assert.ok(Math.max(...cards.map(x=>x.width))-Math.min(...cards.map(x=>x.width))<1);assert.ok(cards.every(x=>x.width>=94));
      for(const [i,symbol] of ['BTC/USDT','ETH/USDT','BNB/USDT'].entries()){const c=cards[i];assert.equal(c.fields[0].text,symbol);assert.match(c.fields[1].text,/\$/);assert.match(c.fields[2].text,/k.*α.*θ/s);for(const f of c.fields){assert.ok(f.scroll<=f.width+1);assert.ok(f.bottom<=f.cardBottom-3)}}
      if(!profile.landscape){assert.ok(cards[0].left<=7);assert.ok(cards[2].right>=profile.width-7)}
      assert.equal(await page.locator('#axes button').count(),3,'Market grid contains only its three cards');
      await page.screenshot({path:`${OUT}/${profile.name}-contextual-market-expanded.png`});
      await page.locator('#k11520MarketRow').click();assert.equal(await page.locator('#axes').isVisible(),false);await page.screenshot({path:`${OUT}/${profile.name}-contextual-market-hidden.png`});
      // A fresh isolated browser creates the mission through the existing UI.
      // The compact background status survives Settings; no live save is used.
      await page.locator('#k11520UtilityMaster').click();await page.locator('#homeDeliveryButton').click();await page.locator('#homeDeliveryMode').selectOption('PLAYER_COURIER');await page.locator('#homeAmount').fill('2400');await page.locator('#homeRequest').click();await page.locator('#homeLaunch').click();
      await page.waitForFunction(()=>__K11520_PLAYER_COURIER__.active()?.status==='ACTIVE'&&document.querySelector('#homeDeliveryButton').dataset.worldContext==='true');
      const missionId=await page.evaluate(()=>__K11520_PLAYER_COURIER__.active().missionId);
      await page.locator('#k11520UtilityMaster').click();
      assert.equal(await page.locator('#homeDeliveryButton').isVisible(),!profile.landscape,'compact landscape keeps active status on its existing menu affordance');
      if(profile.landscape)assert.equal(await page.locator('#k11520UtilityMaster').getAttribute('data-context-active'),'true');
      else{const compact=await page.locator('#homeDeliveryButton').boundingBox();assert.ok(compact.width===44&&compact.height===44,'active Courier remains compact');}
      await page.screenshot({path:`${OUT}/${profile.name}-contextual-courier-active.png`});
      const activeReport={profile:{...profile,name:profile.name+'-active-courier'}};await verifySettingsContext(page,activeReport);
      assert.equal(await page.evaluate(()=>__K11520_PLAYER_COURIER__.active().missionId),missionId,'Settings never cancels or replaces the mission');report.activeCourier=activeReport.settingsContext;
      await page.locator('#k11520UtilityMaster').click();await page.locator('#gameModeToggle').click();await page.locator('#k11520HudProfile').selectOption('FULL');await page.locator('#k11520UiSettingsClose').click();await page.locator('#k11520UtilityMaster').click();
      assert.equal(await page.locator('#axes').isVisible(),false,'FULL cannot override an explicit Market collapse');await verifyMarketHeaderSeparation(page,report,'full-explicit-collapse');await ensureExpandedMarket(page);await verifyMarketHeaderSeparation(page,report,'full-expanded');
      await page.waitForTimeout(15100);await page.locator('#axes').waitFor({state:'hidden',timeout:2000});assert.equal(await page.locator('#k11520MarketRow').getAttribute('aria-expanded'),'false');
      await verifyMarketHeaderSeparation(page,report,'full-idle-hidden');report.market={cards,idleMs:15000,fullRespectsCollapse:true};report.camera='DEFAULT_HIDDEN / MANUAL_ONLY / RECENTER_HIDES / XYZ_UNCHANGED';assert.deepEqual(errors,[]);
      await page.screenshot({path:`${OUT}/${profile.name}-contextual-full-idle-hidden.png`});
    }catch(error){report.error=String(error);failures.push(profile.name+': '+error);await page.screenshot({path:`${OUT}/${profile.name}-contextual-FAIL.png`}).catch(()=>{})}
    finally{await context.close();await fs.writeFile(`${OUT}/contextual-report.json`,JSON.stringify({head:process.env.K11520_SOURCE_SHA||null,base:BASE,production:PRODUCTION,sourceChecks,reports,failures},null,2))}
  }
}
if(process.env.K11520_CONTEXTUAL_QA==='1'){
  try{if(PRODUCTION)await verifyProductionSource();await verifyContextualHud();assert.deepEqual(failures,[]);console.log('CONTEXTUAL HUD functional Chromium QA PASS; visual review remains mandatory')}catch(error){if(!failures.length)failures.push(String(error));throw error}finally{await browser.close();await fs.writeFile(`${OUT}/contextual-report.json`,JSON.stringify({head:process.env.K11520_SOURCE_SHA||null,base:BASE,production:PRODUCTION,sourceChecks,reports,failures},null,2))}
  process.exit(0);
}

if(process.env.K11520_WORLD_FIRST_QA==='1'){
  try{await verifyWorldFirst();console.log('WORLD_FIRST functional Chromium QA PASS; visual review remains mandatory')}finally{await browser.close()}
  process.exit(0);
}
async function verifyInitialQuoteWait(){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>localStorage.setItem('k11520.ui.settings',JSON.stringify({profile:'FULL'})));
  // A returning player must keep the saved location, not walk 281m back to origin.
  await page.addInitScript(()=>{const xyz={x:210,y:.013172,z:186};localStorage.setItem('k11520.player-session.v1',JSON.stringify({version:1,world:'K11520',xyz,intentXYZ:xyz}));});
  const pattern='https://data-api.binance.vision/api/v3/aggTrades*';let ready=false;
  await page.route(pattern,route=>route.fulfill({contentType:'application/json',body:JSON.stringify(freeQuotePayload(route,ready?[{symbol:'BTCUSDT',price:'81185'},{symbol:'ETHUSDT',price:'2631.54'},{symbol:'BNBUSDT',price:'767.8'}]:[]))}));
  try{
    await page.goto(BASE+ROUTE,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>globalThis.__K11520_3D_CONTROL__&&globalThis.__K11520_MARKET_K__?.status==='WAIT');
    if(await page.locator('#enter11520').isVisible()){
      try{await page.locator('#enter11520').click({timeout:1500})}
      catch(error){if(await page.locator('#intro11520').isVisible())throw error}
    }
    await page.locator('#intro11520').waitFor({state:'hidden',timeout:5000});
    const returning=await page.evaluate(()=>({combat:globalThis.__K11520_KSPACE_API__.snapshot(),coords:globalThis.__K11520_WORLD_COORDS__}));
    assert.equal(returning.coords.physical.x,210);assert.equal(returning.coords.physical.z,186);
    assert.ok(Math.abs(returning.combat.distance-7)<.1,'restored XYZ must receive the guardian at 7m');
    await page.waitForFunction(()=>document.querySelector('.brandMetaV250')?.textContent.includes('V2.9.5'));
    await page.waitForFunction(()=>/READY|FALLBACK/.test(document.querySelector('#charState')?.textContent||''));
    await page.waitForFunction(()=>globalThis.__K11520_WORLD_SELECTION_PROJECTION__?.journeyLifeSnapshot().filter(m=>m.visible&&m.inView&&m.uncovered).length>=2);
    const lifeBefore=await page.evaluate(()=>globalThis.__K11520_WORLD_SELECTION_PROJECTION__.journeyLifeSnapshot());
    await page.screenshot({path:`${OUT}/returning-390-7m.png`});
    await page.waitForTimeout(2400);
    const lifeAfter=await page.evaluate(()=>globalThis.__K11520_WORLD_SELECTION_PROJECTION__.journeyLifeSnapshot());
    assert.equal(lifeAfter.length,4);assert.ok(lifeAfter.every(m=>m.sourceManaged===false));
    assert.ok(lifeAfter.every((m,i)=>Math.hypot(m.position.x-lifeBefore[i].position.x,m.position.z-lifeBefore[i].position.z)>.01),'ambient life must actually move');
    await fs.writeFile(`${OUT}/returning-player.json`,JSON.stringify({returning,lifeBefore,lifeAfter},null,2));
    await page.screenshot({path:`${OUT}/returning-390-ambient-moving.png`});
    assert.match(await page.locator('.brandMetaV250').textContent(),/V2\.9\.5/,'legacy runtime must not overwrite release stamp');
    assert.equal(await page.evaluate(()=>globalThis.__K11520_KSPACE_API__.snapshot().market.status),'WAIT');
    assert.equal(await page.locator('.marketKValue').count(),0);await page.locator('#attack').click();
    await ensureExpandedMarket(page);await page.screenshot({path:`${OUT}/startup-WAIT-no-fake-market.png`});ready=true;
    await page.waitForFunction(()=>globalThis.__K11520_MARKET_K__?.status==='LIVE',null,{timeout:15000});
    assert.equal(await page.evaluate(()=>globalThis.__K11520_KSPACE_API__.snapshot().target.id),'SIM-K-GUARDIAN');assert.deepEqual(errors,[]);
    await ensureExpandedMarket(page);await page.screenshot({path:`${OUT}/startup-first-valid-batch.png`});
  }finally{await context.close()}
}
async function verifyProductionSource(){
  for(const name of ['../game-5d.html','../sw.js','../manifest.webmanifest','../controls/nonlinear-controls.mjs','spatial-coordinate-runtime.mjs','mobile-signed-c-immersive-runtime.mjs','kgen-margin-runtime.mjs','world-runtime.mjs','game-5d-main.mjs','combat-drive-live-runtime.mjs','combat-fx-runtime.mjs','game-5d-bootstrap.mjs','mobile-ui-settings.mjs','joystick-xzxy.mjs','game-mobile-shell.mjs','game-ui-product-fixes.mjs','game-ui-product-fixes-v23.mjs','mobile-control-layout.mjs','market-origin-wallet-layout-runtime.mjs','mobile-action-rail-clearance-runtime.mjs','evm-wallet-runtime.mjs','public-market-quotes.mjs','plane-map-runtime.mjs','xyz-map-navigation-runtime.mjs']){
    // GitHub Pages publishes LF text while Windows checkouts may materialize CRLF.
    // Compare canonical source text so deployment lineage checks remain byte-format agnostic.
    const expected=sourceSha(await fs.readFile(new URL('../runtime/'+name,import.meta.url)));
    let observed=null,status=null;
    for(let attempt=0;attempt<24;attempt++){
      const url=BASE+ROUTE.slice(0,ROUTE.lastIndexOf('/'))+'/runtime/'+name+'?verify='+expected;
      const response=await fetch(url,{signal:AbortSignal.timeout(15000)});status=response.status;
      if(response.ok)observed=sourceSha(Buffer.from(await response.arrayBuffer()));
      if(observed===expected)break;
      await new Promise(resolve=>setTimeout(resolve,5000));
    }
    sourceChecks.push({name,expected,observed,status,match:expected===observed});
    assert.equal(observed,expected,'Public Pages source is not the checked-out deployment: '+name);
  }
}
async function snapshot(page){return page.evaluate(async sels=>{
  // ResizeObserver status flow follows card-height changes after render. Sample
  // geometry stability, never a desired gap: a stable2px gap still fails check().
  const started=performance.now(),frames=[],requiredConsecutive=3,maxWaitMs=500;
  let consecutive=0,previous=null;
  do{
    const geometry={viewport:{width:innerWidth,height:innerHeight},rects:[...document.querySelectorAll('#axes .axis,.tele,.monsterHud')].map(el=>{const r=el.getBoundingClientRect(),style=getComputedStyle(el);return{identity:el.dataset.axis||el.className,x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,display:style.display,visibility:style.visibility}})};
    const signature=JSON.stringify(geometry);consecutive=signature===previous?consecutive+1:1;previous=signature;
    frames.push({at:performance.now(),geometry});
    if(consecutive>=requiredConsecutive||performance.now()-started>=maxWaitMs)break;
    await new Promise(requestAnimationFrame);
  }while(performance.now()-started<maxWaitMs);
  const elapsedMs=performance.now()-started,layoutStability={stable:consecutive>=requiredConsecutive&&elapsedMs<=maxWaitMs,requiredConsecutive,maxWaitMs,elapsedMs,frames};
  const box=el=>{if(!el)return null;const r=el.getBoundingClientRect(),s=getComputedStyle(el);const visible=s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0;const inset=Math.min(10,Math.max(2,Math.min(r.width,r.height)/4)),points=[[r.left+r.width/2,r.top+r.height/2],[r.left+inset,r.top+r.height/2],[r.right-inset,r.top+r.height/2],[r.left+r.width/2,r.top+inset],[r.left+r.width/2,r.bottom-inset]],owners=visible?points.map(([x,y])=>{const h=document.elementFromPoint(x,y);return{owned:!!h&&(h===el||el.contains(h)),id:h?.id||'',classes:String(h?.className||'')}}):[],h=visible?document.elementFromPoint(r.x+r.width/2,r.y+r.height/2):null;return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,visible,hit:!!h&&(h===el||el.contains(h)),ownedHitFraction:owners.length?owners.filter(x=>x.owned).length/owners.length:0,hitOwners:owners,pointer:s.pointerEvents,blocker:h?{id:h.id,classes:String(h.className),pointer:getComputedStyle(h).pointerEvents}:null,scroll:el.scrollHeight,client:el.clientHeight,text:(el.textContent||'').trim().slice(0,240)}};
  const yThumbStyle=getComputedStyle(document.querySelector('#yThumb'));
  return{layoutStability,width:innerWidth,height:innerHeight,boxes:Object.fromEntries(sels.map(s=>[s,box(document.querySelector(s))])),cards:[...document.querySelectorAll('#axes .axis')].map(box),balances:[...document.querySelectorAll('.top>.pill')].map(box),drawers:[...document.querySelectorAll('.hud-drawer-toggle')].map(box),axisArt:{image:yThumbStyle.backgroundImage,position:yThumbStyle.backgroundPosition,size:yThumbStyle.backgroundSize,repeat:yThumbStyle.backgroundRepeat},settingsInstalled:!!globalThis.__K11520_UI_SETTINGS__,layoutInstalled:!!globalThis.__K11520_MOBILE_CONTROL_LAYOUT__,xyzInstalled:!!globalThis.__K11520_3D_CONTROL__,utilityOpen:document.documentElement.classList.contains('k11520UtilitiesOpen'),version:document.querySelector('.brandMetaV250')?.textContent};
},selectors)}
async function verifyFullHudControlOwnership(page,report){
  const controls=['#k11520CameraReset','#cargoInterceptionButton','#homeDeliveryButton','#k11520MarketRow','#gameModeToggle','#k11520UtilityMaster'];
  await page.waitForFunction(()=>globalThis.__K11520_CAMERA__&&globalThis.__K11520_UI_SETTINGS__?.profile==='FULL'&&['k11520CameraReset','cargoInterceptionButton','homeDeliveryButton','k11520MarketRow'].every(id=>document.getElementById(id)),null,{timeout:45000});
  await page.waitForFunction(()=>document.querySelector('.brandMetaV250 span:first-child')?.dataset.k11520ProductVersion==='V2.9.5');
  assert.match(await page.locator('.brandMetaV250 span:first-child').textContent(),/^V2\.9\.5 · 5D K線西遊記$/);
  report.visibleVersion='V2.9.5';
  const ownership=await page.evaluate(selectors=>Object.fromEntries(selectors.map(selector=>{const el=document.querySelector(selector),r=el?.getBoundingClientRect(),style=el?getComputedStyle(el):null;if(!r||style.display==='none'||style.visibility==='hidden')return[selector,null];const inset=Math.min(10,Math.max(2,Math.min(r.width,r.height)/4)),points=[[r.left+r.width/2,r.top+r.height/2],[r.left+inset,r.top+r.height/2],[r.right-inset,r.top+r.height/2],[r.left+r.width/2,r.top+inset],[r.left+r.width/2,r.bottom-inset]],owners=points.map(([x,y])=>{const hit=document.elementFromPoint(x,y);return{owned:hit===el||el.contains(hit),id:hit?.id||'',classes:String(hit?.className||'')}});return[selector,{rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height},owners,ownedHitFraction:owners.filter(x=>x.owned).length/owners.length}]})),selectors);
  for(const selector of controls){const item=ownership[selector];if(!item)continue;assert.ok(item.rect.width>=44&&item.rect.height>=44,selector+' must remain a 44px touch target in FULL HUD');assert.ok(item.ownedHitFraction>0,selector+' has no owned hit area: '+JSON.stringify(item.owners))}
  assert.equal(ownership['#k11520CameraReset'],null,'automatic follow has no persistent Recenter in FULL HUD');
  if(ownership['#cargoInterceptionButton'])assert.equal(ownership['#cargoInterceptionButton'].ownedHitFraction,1,'visible #cargoInterceptionButton must own center and primary hit region in FULL HUD');

  await ensureExpandedMarket(page);
  const marketGeometry=await page.evaluate(()=>{const axes=document.querySelector('.axes'),reset=document.querySelector('#k11520CameraReset'),a=axes.getBoundingClientRect(),r=reset.getBoundingClientRect(),cards=[...axes.querySelectorAll('.axis')].map(card=>{const b=card.getBoundingClientRect(),symbol=card.querySelector('.sym,.symbol,.pair')||[...card.querySelectorAll('*')].find(el=>/^(BTC|ETH|BNB)\/USDT$/.test(el.textContent?.trim()));return{left:b.left,right:b.right,width:b.width,scrollWidth:card.scrollWidth,clientWidth:card.clientWidth,addressFits:!!card.querySelector('.marketKValue')&&card.querySelector('.marketKValue').getBoundingClientRect().bottom<=b.bottom-3,text:(card.textContent||'').trim(),symbol:symbol?.textContent?.trim()||''}}),overlap=(x,y)=>x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top;return{viewport:innerWidth,landscape:matchMedia('(orientation:landscape) and (max-height:600px)').matches,axes:{left:a.left,right:a.right,top:a.top,bottom:a.bottom,width:a.width},reset:{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height},resetOverlapsMarket:overlap(a,r),cards}});
  assert.equal(marketGeometry.resetOverlapsMarket,false,'Camera Recenter must not consume or cover an Expanded Market column');
  assert.equal(marketGeometry.cards.length,3,'Expanded Market must contain exactly three cards');
  assert.ok(Math.max(...marketGeometry.cards.map(card=>card.width))-Math.min(...marketGeometry.cards.map(card=>card.width))<1,'Expanded Market cards must have equal widths');
  assert.ok(marketGeometry.cards.every(card=>card.scrollWidth<=card.clientWidth+1),'Expanded Market card content must not horizontally clip');
  assert.ok(marketGeometry.cards.every(card=>card.addressFits),'Realistic quote k/alpha/theta must stay inside card bottom');
  for(const symbol of ['BTC/USDT','ETH/USDT','BNB/USDT'])assert.ok(marketGeometry.cards.some(card=>card.text.includes(symbol)),symbol+' must remain complete');
  if(!marketGeometry.landscape){assert.ok(marketGeometry.axes.left<=7,'portrait Expanded Market must reach the left safe edge');assert.ok(marketGeometry.axes.right>=marketGeometry.viewport-7,'portrait Expanded Market must reach the right safe edge')}
  report.expandedMarketGeometry=marketGeometry;

  const readCamera=()=>page.evaluate(()=>globalThis.__K11520_CAMERA__.snapshot());
  // Exercise the native browser touch route, as world-first QA does, instead
  // of synthetic DOM pointer events. Keep failed preconditions diagnosable.
  const fullCdp=await page.context().newCDPSession(page),fullTouches=new Map();
  const pointer=async(type,id,x,y)=>{if(type==='pointerup')fullTouches.delete(id);else fullTouches.set(id,{id,x,y,radiusX:3,radiusY:3,force:1});await fullCdp.send('Input.dispatchTouchEvent',{type:type==='pointerdown'?'touchStart':type==='pointerup'?'touchEnd':'touchMove',touchPoints:[...fullTouches.values()]})};
  await page.evaluate(()=>{globalThis.fullHudPointerTrace=[];const state=()=>({camera:__K11520_CAMERA__.snapshot(),status:{shown:document.querySelector('#k11520CameraZoomStatus')?.classList.contains('show'),text:document.querySelector('#k11520CameraZoomStatus')?.textContent}});for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,e=>{if(fullHudPointerTrace.length>=120)return;const sample={type,at:performance.now(),pointerId:e.pointerId,isTrusted:e.isTrusted,isPrimary:e.isPrimary,button:e.button,buttons:e.buttons,x:e.clientX,y:e.clientY,width:e.width,height:e.height,target:e.target.id,classes:String(e.target.className||''),canPan:__K11520_CAMERA__.canPanAt(e.clientX,e.clientY),world:e.type==='pointerdown'?{actors:__K11520_WORLD_SELECTION_PROJECTION__.journeyLifeSnapshot(),home:__K11520_WORLD_SELECTION_PROJECTION__.playerHomeSnapshot(),combat:globalThis.__K11520_KSPACE_API__?.snapshot?.(),footprint:[-20,-10,0,10,20].flatMap(dx=>[-20,-10,0,10,20].map(dy=>({x:e.clientX+dx,y:e.clientY+dy,owner:document.elementFromPoint(e.clientX+dx,e.clientY+dy)?.id,canPan:__K11520_CAMERA__.canPanAt(e.clientX+dx,e.clientY+dy)})))}:null,before:state()};fullHudPointerTrace.push(sample);queueMicrotask(()=>{sample.after=state();sample.afterAt=performance.now()})},true)});
  // Native session and tracing are ready before selecting a live-world origin;
  // intervening setup awaits previously let eligibility change. Require a dense
  //30px neighborhood stable150ms within2s, then one gesture only; never retry
  // a failed drag or freeze actors. Native pointerdown eligibility remains asserted.
  const start=await readCamera(),readiness=await page.evaluate(async()=>{
    const canvas=document.querySelector('#three'),r=canvas.getBoundingClientRect(),began=performance.now(),history=[];
    const diagnostics={centers:0,rows:0,domReads:0,canPanReads:0,domRejects:0,canPanRejects:0,lastCenter:null,firstDomBlock:null,firstCanPanBlock:null,knownPoint:null,frames:[],droppedFrames:0};
    const offsets=[0,-10,10,-20,20,-30,30];
    const clear=(x,y,cache=new Map(),domCache=new Map())=>{
      diagnostics.centers++;diagnostics.lastCenter={x,y};
      // Reject HUD cheaply before any scene raycast; cache only within this
      // synchronous search, never across rendered frames or stability samples.
      const points=offsets.flatMap(dx=>offsets.map(dy=>({x:x+dx,y:y+dy})));
      const canvasAt=(px,py)=>{const key=px+','+py;if(!domCache.has(key)){const owner=document.elementFromPoint(px,py);diagnostics.domReads++;domCache.set(key,owner===canvas);if(owner!==canvas&&!diagnostics.firstDomBlock)diagnostics.firstDomBlock={center:{x,y},sample:{x:px,y:py},owner:owner?.id||null}}return domCache.get(key)};
      if(!canvasAt(x+42,y)||!points.every(p=>canvasAt(p.x,p.y))){diagnostics.domRejects++;if(x===60&&y===550)diagnostics.knownPoint={eligible:false,reason:'DOM_OWNER'};return false}
      const eligible=points.every(p=>{const key=p.x+','+p.y;if(!cache.has(key)){diagnostics.canPanReads++;const allowed=__K11520_CAMERA__.canPanAt(p.x,p.y);cache.set(key,allowed);if(!allowed&&!diagnostics.firstCanPanBlock)diagnostics.firstCanPanBlock={center:{x,y},sample:{...p}}}return cache.get(key)});
      if(!eligible)diagnostics.canPanRejects++;if(x===60&&y===550)diagnostics.knownPoint={eligible,reason:eligible?'ELIGIBLE':'CAN_PAN_REJECTED'};return eligible;
    };
    let point=null,since=0;
    while(performance.now()-began<2000){
      const frameStarted=performance.now(),centersBefore=diagnostics.centers;
      if(point&&!clear(point.x,point.y)){history.push({event:'ELIGIBILITY_CHANGED',at:performance.now(),...point});point=null}
      if(!point){
        const cache=new Map(),domCache=new Map(),landscape=innerWidth>innerHeight;
        // Portrait HUD leaves lower-world gaps; landscape leaves upper-world
        // gaps. Search those first instead of raycasting through occupied HUD.
        const ys=[];for(let y=r.top+60;y<r.bottom-60;y+=10)ys.push(y);if(!landscape)ys.reverse();
        search:for(const y of ys){if(performance.now()-began>=2000)break;diagnostics.rows++;for(let x=r.left+60;x<r.right-60;x+=10)if(clear(x,y,cache,domCache)){point={x,y};since=performance.now();history.push({event:'CANDIDATE',at:since,...point});break search}}
      }
      diagnostics.frames.push({elapsedMs:performance.now()-began,searchMs:performance.now()-frameStarted,centers:diagnostics.centers-centersBefore});if(diagnostics.frames.length>16){diagnostics.frames.shift();diagnostics.droppedFrames++}
      if(point&&performance.now()-since>=150&&performance.now()-began<2000)return{point:{...point,selectedAt:performance.now(),actors:__K11520_WORLD_SELECTION_PROJECTION__.journeyLifeSnapshot(),home:__K11520_WORLD_SELECTION_PROJECTION__.playerHomeSnapshot()},elapsedMs:performance.now()-began,stableMs:performance.now()-since,radius:30,history,diagnostics};
      await new Promise(requestAnimationFrame);
    }
    return{point:null,elapsedMs:performance.now()-began,radius:30,history,diagnostics,actors:__K11520_WORLD_SELECTION_PROJECTION__.journeyLifeSnapshot(),home:__K11520_WORLD_SELECTION_PROJECTION__.playerHomeSnapshot()};
  });
  report.fullHudPanPrecondition={readiness,origin:readiness.point,before:start};
  const point=readiness.point;
  assert.ok(point,'FULL HUD must leave a stable actual world gesture area within2s for one Recenter QA drag');
  await pointer('pointerdown',10,point.x,point.y,1);await pointer('pointermove',10,point.x+21,point.y,1);await pointer('pointermove',10,point.x+42,point.y,1);await pointer('pointerup',10,point.x+42,point.y,0);
  try{await page.waitForFunction(()=>__K11520_CAMERA__.snapshot().panX!==0,null,{timeout:3000})}
  finally{report.fullHudPanPrecondition.after=await readCamera();report.fullHudPanPrecondition.pointerTrace=await page.evaluate(()=>fullHudPointerTrace)}
  assert.equal(report.fullHudPanPrecondition.pointerTrace.find(e=>e.type==='pointerdown')?.canPan,true,'native FULL pan origin must still be eligible at pointerdown');
  assert.notEqual((await readCamera()).panX,0,'FULL HUD pan precondition must move Camera before Recenter');
  assert.equal(await page.locator('#k11520CameraReset').isVisible(),true,'manual pan reveals the existing Recenter');
  const manualReset=await page.locator('#k11520CameraReset').evaluate(el=>{const r=el.getBoundingClientRect(),inset=8,owned=[[r.x+r.width/2,r.y+r.height/2],[r.x+inset,r.y+r.height/2],[r.right-inset,r.y+r.height/2],[r.x+r.width/2,r.y+inset],[r.x+r.width/2,r.bottom-inset]].every(([x,y])=>{const hit=document.elementFromPoint(x,y);return hit===el||el.contains(hit)});return{width:r.width,height:r.height,owned}});assert.ok(manualReset.width>=44&&manualReset.height>=44);assert.equal(manualReset.owned,true,'context-visible Recenter owns all five real hit points');report.manualResetOwnership=manualReset;
  await page.locator('#k11520CameraReset').click();await page.waitForTimeout(60);
  assert.equal(await page.locator('#k11520CameraReset').isVisible(),false,'Recenter hides itself after restoring automatic follow');
  const recentered=await readCamera();assert.equal(recentered.panX,0);assert.equal(recentered.panZ,0);assert.equal(recentered.zoom,1);assert.deepEqual(recentered.playerXYZ,start.playerXYZ,'FULL Recenter must not mutate Player XYZ');
  assert.equal(await page.locator('#sheet').evaluate(el=>el.classList.contains('open')),false,'FULL Recenter must not open a market detail sheet');
  await page.screenshot({path:`${OUT}/${report.profile.name}-full-recenter-hit-owner.png`});

  const pinch=await page.evaluate(()=>{const canvas=document.querySelector('#three'),r=canvas.getBoundingClientRect(),clear=(x,y)=>[-20,-10,0,10,20].every(dx=>[-20,-10,0,10,20].every(dy=>document.elementFromPoint(x+dx,y+dy)===canvas));for(const end of[60,48,40])for(const vertical of[false,true])for(let y=r.top+(vertical?end+20:20);y<r.bottom-(vertical?end+20:20);y+=8)for(let x=r.left+(vertical?20:end+20);x<r.right-(vertical?20:end+20);x+=8){const sx=vertical?0:Math.round(end/3),sy=vertical?Math.round(end/3):0,ex=vertical?0:end,ey=vertical?end:0;if([[x-sx,y-sy],[x+sx,y+sy],[x-ex,y-ey],[x+ex,y+ey]].every(([px,py])=>clear(px,py))){const owner=(px,py)=>{const el=document.elementFromPoint(px,py);return{x:px,y:py,id:el?.id||null,classes:String(el?.className||'')}};return{x,y,sx,sy,ex,ey,selectedAt:performance.now(),beforeCamera:__K11520_CAMERA__.snapshot(),contacts:[[x-sx,y-sy],[x+sx,y+sy],[x-ex,y-ey],[x+ex,y+ey]].map(([px,py])=>({center:owner(px,py),radius3:[[-3,0],[3,0],[0,-3],[0,3]].map(([dx,dy])=>owner(px+dx,py+dy)),radius20:[[-20,0],[20,0],[0,-20],[0,20]].map(([dx,dy])=>owner(px+dx,py+dy))}))}}}return null});
  assert.ok(pinch,'FULL HUD must leave an actual pinch surface');
  report.fullHudPinch={geometry:pinch};
  await pointer('pointerdown',11,pinch.x-pinch.sx,pinch.y-pinch.sy,1);await pointer('pointerdown',12,pinch.x+pinch.sx,pinch.y+pinch.sy,1);
  const nativePinchDowns=await page.evaluate(at=>fullHudPointerTrace.filter(e=>e.isTrusted&&e.type==='pointerdown'&&e.at>=at),pinch.selectedAt);
  report.fullHudPinch.nativeDowns=nativePinchDowns;
  assert.equal(nativePinchDowns.length,2,'FULL pinch must start two actual native contacts');
  assert.ok(nativePinchDowns.every(e=>e.target==='three'),'both actual pinch contacts must hit canvas, not nearby HUD hit adjustment');

  await pointer('pointermove',11,pinch.x-pinch.ex,pinch.y-pinch.ey,1);await pointer('pointermove',12,pinch.x+pinch.ex,pinch.y+pinch.ey,1);
  await page.waitForTimeout(40);
  const zoomSafety=await page.evaluate(()=>{const status=document.querySelector('#k11520CameraZoomStatus'),r=status.getBoundingClientRect(),overlap=b=>r.left<b.right&&r.right>b.left&&r.top<b.bottom&&r.bottom>b.top,controls=['#k11520MonsterGuide','#k11520CameraReset','#cargoInterceptionButton','#homeDeliveryButton','#k11520MarketRow','.axes','.minimapWrap','#joy'].map(selector=>{const el=document.querySelector(selector),b=el?.getBoundingClientRect(),s=el?getComputedStyle(el):null;return{selector,overlap:!!b&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&overlap(b),rect:b?{left:b.left,top:b.top,right:b.right,bottom:b.bottom}:null}}),player=globalThis.__K11520_WORLD_SELECTION_PROJECTION__.playerHomeSnapshot().playerScreen,monsters=globalThis.__K11520_WORLD_SELECTION_PROJECTION__.journeyLifeSnapshot().filter(m=>m.visible&&m.inView).map(m=>m.screen);return{camera:__K11520_CAMERA__.snapshot(),capturedAt:performance.now(),pointerTrace:globalThis.fullHudPointerTrace,shown:status.classList.contains('show'),pointerEvents:getComputedStyle(status).pointerEvents,controls,playerOverlap:player.x>=r.left&&player.x<=r.right&&player.y>=r.top&&player.y<=r.bottom,monsterOverlaps:monsters.filter(p=>p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom).length,rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom}}});
  report.fullHudPinch.after={camera:zoomSafety.camera,capturedAt:zoomSafety.capturedAt,statusShown:zoomSafety.shown,pointerTrace:zoomSafety.pointerTrace};
  assert.notEqual(zoomSafety.camera.zoom,pinch.beforeCamera.zoom,'a lingering Recenter label must not masquerade as a successful pinch');
  assert.equal(zoomSafety.camera.zoom,zoomSafety.camera.bounds.maxZoom,'FULL native pinch must reach the same maximum zoom bound as world-first');
  assert.deepEqual(zoomSafety.camera.playerXYZ,start.playerXYZ,'FULL pinch changes Camera only, never Player XYZ');
  assert.equal(zoomSafety.shown,true,'zoom status must be visible during FULL HUD pinch');assert.equal(zoomSafety.pointerEvents,'none','zoom status must stay non-blocking');assert.deepEqual(zoomSafety.controls.filter(x=>x.overlap),[],'zoom status overlaps a visible HUD/world control');assert.equal(zoomSafety.playerOverlap,false,'zoom status overlaps Player');assert.equal(zoomSafety.monsterOverlaps,0,'zoom status overlaps a visible Monster target');
  await page.screenshot({path:`${OUT}/${report.profile.name}-zoom-status-safe.png`});await pointer('pointerup',11,pinch.x-pinch.ex,pinch.y-pinch.ey,0);await pointer('pointerup',12,pinch.x+pinch.ex,pinch.y+pinch.ey,0);

  let openedUtilityForContextAction=false;
  if(!await page.locator('#cargoInterceptionButton').isVisible()){await page.locator('#k11520UtilityMaster').click();await page.locator('#cargoInterceptionButton').waitFor({state:'visible'});openedUtilityForContextAction=true}
  await page.locator('#cargoInterceptionButton').click();await page.locator('#sheet.open').waitFor();
  // Waiting state routes to the canonical ATM dispatch surface; an airborne
  // target routes to the missile surface. Either proves the compact control
  // retained its own owner and was not intercepted by a market card.
  assert.match(await page.locator('#sheetTitle').textContent(),/ATM|導彈攔截/,'FULL Missile must open its state-appropriate logistics/interception surface');
  assert.doesNotMatch(await page.locator('#sheetTitle').textContent(),/市場/,'FULL Missile must not open a market detail surface');
  await page.screenshot({path:`${OUT}/${report.profile.name}-full-missile-hit-owner.png`});await page.locator('#sheetClose').click();await page.waitForTimeout(250);
  if(openedUtilityForContextAction){await page.locator('#k11520UtilityMaster').click();await page.waitForFunction(()=>!document.documentElement.classList.contains('k11520UtilitiesOpen'))}
  assert.equal(await page.locator('#sheet').evaluate(el=>el.classList.contains('open')),false,'Missile/ATM evidence sheet must remain closed after QA cleanup');
  const landscapeContext=await page.evaluate(()=>{const read=id=>{const el=document.getElementById(id),style=getComputedStyle(el),r=el.getBoundingClientRect();return{state:el.dataset.contextState,visible:style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>0&&r.width>0&&r.height>0,rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom}}};return{landscape:matchMedia('(orientation:landscape) and (max-height:600px)').matches,raid:read('cargoInterceptionButton'),courier:read('homeDeliveryButton')}});
  {if(landscapeContext.raid.state==='cruise')assert.equal(landscapeContext.raid.visible,false,'inactive Raid must not occupy the world');if(landscapeContext.courier.state==='idle')assert.equal(landscapeContext.courier.visible,false,'inactive Courier must not occupy the world')}
  await fullCdp.detach();
  report.fullHudHitOwnership={ownership,recentered,zoomSafety,missile:'OPENED_OWN_SURFACE',landscapeContext};
}
async function verifyKSpaceMap(page,report){
  const read=()=>page.evaluate(()=>globalThis.__K11520_KSPACE_MAP__);
  const shot=async name=>page.screenshot({path:`${OUT}/${report.profile.name}-${name}.png`});
  await page.waitForFunction(()=>globalThis.__K11520_KSPACE_MAP__?.targetId);
  for(const selector of ['#kspaceViewK','#kspaceViewXYZ']){
    const b=await page.locator(selector).boundingBox();assert.ok(b.width>=44&&b.height>=44,selector+' touch target');
    assert.equal(await page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),true,selector+' pointer blocker');
  }
  await page.locator('#minimap').tap();await page.locator('#kspaceMarketMap').waitFor();
  await page.waitForFunction(()=>document.querySelector('#kspaceMapValues')?.textContent.includes('WORLD 11520'));
  assert.match(await page.locator('#kspaceMapValues').textContent(),/WORLD 11520.*KX\/BTC.*k=.*α=.*θ=.*KY\/ETH.*KZ\/BNB.*LOCAL DIST: .*K.*LOCAL XYZ K/s);
  assert.match(await page.locator('#kspaceMarketMap').getAttribute('aria-label'),/共用 α 地圖 \[1,10\).*Gate α 5.11111/);
  assert.doesNotMatch(await page.locator('#kspaceMapValues').textContent(),/norm|正規化/);
  assert.match(await page.locator('#kspaceRelativeValues').textContent(),/P0=100000 USDT.*P0=4000 USDT.*P0=600 USDT.*1.00 pp/s);
  await shot('01_PLAYER_MONSTER_KSPACE');
  // A short landscape sheet must scroll to the actual distance values for evidence.
  await page.locator('#kspaceMapValues').evaluate(el=>el.scrollIntoView({block:'end'}));
  await page.screenshot({path:`${OUT}/${report.profile.landscape?'K_DISTANCE_LANDSCAPE':'K_DISTANCE_PORTRAIT'}.png`});
  const ds=await page.evaluate(()=>globalThis.__K11520_KSPACE_API__.snapshot());assert.ok(Math.abs(ds.distanceK-ds.distance/(384400*1000/16888))<1e-12);assert.equal(ds.marketPhysicalTransform,'NOT_CONFIGURED');
  assert.doesNotMatch(await page.locator('.monsterHud').textContent(),/\d(?:u|units)\b/);
  await page.locator('#sheetBody summary').click();await page.locator('#kspaceDetailMap').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('#sheetClose').evaluate(el=>{const r=el.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.top>=0&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),true,'expanded K-map close must remain visible and pointer-reachable while scrolling');
  await shot('01_NEAR_K_VECTOR');await page.locator('#sheetClose').click();
  const rows=[];
  for(const [plane,axis,c,name] of [['YZ','KX','1','02_KX_POSITIVE_PHASE'],['YZ','KX','-1','03_KX_NEGATIVE_PHASE'],['XZ','KY','1','04_KY_PHASE'],['XY','KZ','-1','05_KZ_PHASE']]){
    for(let i=0;i<3&&(await read()).plane!==plane;i++){await page.locator('#joy').tap();await page.waitForTimeout(180)}
    await page.locator('#cNumericInput').fill(c);await page.locator('#cNumericInput').press('Enter');
    await page.waitForFunction(([axis,c])=>globalThis.__K11520_KSPACE_MAP__?.phase===axis+(c==='1'?'+':'−'),[axis,c]);
    // Sample one rendered quote generation; two CDP reads can straddle a live tick.
    // Keep exact equality and a bounded render-sync deadline, never freeze live prices.
    const sample=await page.waitForFunction(()=>{const model=globalThis.__K11520_KSPACE_MAP__,runtime=globalThis.__K11520_KSPACE_API__.snapshot();return ['KX','KY','KZ'].every(a=>model.player[a]===runtime.playerK[a]&&model.monster[a]===runtime.monsterK[a])?structuredClone({model,runtime}):false},null,{timeout:2500});
    const {model,runtime}=await sample.jsonValue();await sample.dispose();
    assert.equal(model.normal,axis);assert.equal(model.targetId,runtime.target.id);assert.deepEqual(model.monster,runtime.monsterK);assert.deepEqual(model.player,runtime.playerK);assert.deepEqual(model.delta,runtime.deltaK);
    // Only this approximate distance tolerates IEEE-754 drift from live market-frame
    // translations (observed 1.0000000000000036). Snapshot/state assertions stay exact.
    const distanceEpsilon=1e-12; // Absolute tolerance for the expected unit distance; no runtime rounding.
    assert.ok(Math.abs(model.distance-1)<=distanceEpsilon,`K-space distance must be 1 within ${distanceEpsilon}; got ${model.distance}`);
    await shot(name);await page.locator('#kspaceViewK').click();await shot(name+'-detail');await page.locator('#sheetClose').click();rows.push(model);
  }
  await page.locator('#cNumericInput').fill('0');await page.locator('#cNumericInput').press('Enter');await page.waitForFunction(()=>globalThis.__K11520_KSPACE_MAP__?.neutral===true);
  await page.locator('#minimap').tap();await page.waitForFunction(()=>document.querySelector('#kspaceMapValues')?.textContent.includes('NO ATTACK PHASE'));await shot('neutral');
  await page.locator('#kspaceShowLocal').click();await page.waitForFunction(()=>document.querySelector('#minimap')?.dataset.coordinateSpace==='XYZ');
  assert.equal(await page.locator('#sheet').evaluate(el=>el.classList.contains('open')),false);
  await page.locator('#kspaceViewK').click();await page.waitForFunction(()=>globalThis.__K11520_KSPACE_MAP__?.view==='K');
  if(report.profile.landscape)await shot('06_LANDSCAPE_KSPACE');
  // The K control now deliberately opens its information sheet on every entry.
  await page.locator('#sheetClose').click();await page.locator('#sheet.open').waitFor({state:'hidden'});
  report.kspaceMap={rows,status:'FUNCTIONAL_PASS_SCREENSHOTS_REQUIRE_DIRECT_REVIEW'};
}
async function verifyMarketSync(page,report){
  const read=()=>page.evaluate(()=>({market:globalThis.__K11520_MARKET_K__,combat:globalThis.__K11520_KSPACE_API__.snapshot(),map:globalThis.__K11520_KSPACE_MAP__,cards:[...document.querySelectorAll('[data-market-card]')].map(e=>({axis:e.dataset.marketCard,price:e.querySelector('.q').textContent,k:e.querySelector('.marketKValue')?.textContent}))}));
  await page.waitForFunction(()=>globalThis.__K11520_MARKET_K__?.status==='LIVE');
  const first=await read();assert.equal(first.market.markets.length,3);
  for(const m of first.market.markets){
    assert.ok(Math.abs(m.k-100*(m.price/m.anchor-1))<1e-9);
    const card=first.cards.find(c=>c.axis===m.axis);assert.equal(Number(card.price.replace(/[^0-9.]/g,'')),m.price);assert.equal(card.k,formatUniverseAddress(signedUniverseAddress(m.price)));
    assert.deepEqual(m.universe,signedUniverseAddress(m.price));assert.equal(m.quoteUnit,'USDT');assert.equal(m.relativePercent,m.k);
    assert.equal(first.combat.playerK[m.axis],m.k);assert.equal(first.map.player[m.axis],m.k);
  }
  report.marketReference={initial:first,mode:PRODUCTION?'PUBLIC_READ_ONLY':'CONTROLLED_REFERENCE_FAILURE_RECOVERY'};
  if(PRODUCTION)return;
  const pattern='https://data-api.binance.vision/api/v3/aggTrades*';
  const setBatch=async rows=>{await page.unroute(pattern);await page.route(pattern,route=>route.fulfill({contentType:'application/json',body:JSON.stringify(freeQuotePayload(route,rows))}))};
  report.marketReference.boundaries=[];
  for(const prices of [[99999.99,9999.99,999.99],[100000,10000,1000],[51111.1,5111.11,511.111]]){
    await setBatch(['BTCUSDT','ETHUSDT','BNBUSDT'].map((symbol,i)=>({symbol,price:String(prices[i])})));
    await page.waitForFunction(prices=>globalThis.__K11520_MARKET_K__?.markets.every((m,i)=>m.price===prices[i])&&[...document.querySelectorAll('.marketKValue')].every(el=>el.textContent.includes('α=')),prices,{timeout:15000});
    const sample=await read();
    for(const m of sample.market.markets){assert.deepEqual(m.universe,signedUniverseAddress(m.price));assert.equal(sample.cards.find(c=>c.axis===m.axis).k,formatUniverseAddress(m.universe))}
    assert.deepEqual(sample.combat.playerLocal,first.combat.playerLocal);assert.deepEqual(sample.combat.deltaK,first.combat.deltaK);assert.deepEqual(sample.combat.target,first.combat.target);
    report.marketReference.boundaries.push(sample);
  }
  await page.locator('#kspaceViewK').click();await page.waitForFunction(()=>document.querySelector('#kspaceMapValues')?.textContent.includes('$51111.10'));
  await page.screenshot({path:`${OUT}/${report.profile.name}-shared-gate.png`});await page.locator('#sheetClose').click();
  const batch=[{symbol:'BTCUSDT',price:'83000'},{symbol:'ETHUSDT',price:'2800'},{symbol:'BNBUSDT',price:'750'}];
  await setBatch(batch);await page.waitForFunction(()=>globalThis.__K11520_MARKET_K__?.markets[0]?.price===83000,null,{timeout:15000});
  const changed=await read();assert.notDeepEqual(changed.combat.playerK,first.combat.playerK);
  assert.deepEqual(changed.combat.playerLocal,first.combat.playerLocal);assert.deepEqual(changed.combat.deltaK,first.combat.deltaK);assert.deepEqual(changed.combat.target,first.combat.target);
  await page.locator('#kspaceViewK').click();await page.waitForFunction(()=>document.querySelector('#kspaceMapValues')?.textContent.includes('$83000.00'));await page.screenshot({path:`${OUT}/${report.profile.name}-07_MARKET_REFRESH.png`});
  await setBatch(batch.slice(0,2));await page.waitForFunction(()=>globalThis.__K11520_MARKET_K__?.status==='STALE',null,{timeout:15000});
  const stale=await read();assert.deepEqual(stale.market.markets,changed.market.markets);assert.deepEqual(stale.combat.playerK,changed.combat.playerK);await page.screenshot({path:`${OUT}/${report.profile.name}-08_STALE_LAST_VALID.png`});
  await setBatch(batch);await page.waitForFunction(()=>globalThis.__K11520_MARKET_K__?.status==='LIVE',null,{timeout:15000});await page.screenshot({path:`${OUT}/${report.profile.name}-09_RECOVERED.png`});await page.locator('#sheetClose').click();
  report.marketReference.changed=changed;report.marketReference.stale=stale;report.marketReference.recovered=await read();
}
async function verifyKSpaceGameplay(page,report){
  const state=()=>page.evaluate(()=>globalThis.__K11520_KSPACE_API__.snapshot());
  const input=async value=>{await page.locator('#cNumericInput').fill(value);await page.locator('#cNumericInput').press('Enter');await page.waitForTimeout(100)};
  // Preserve the real input and moving target evidence even when a precondition
  // times out. This observer never mutates input, actors, camera or game state.
  const observeApproach=async label=>{
    await page.evaluate(label=>{const read=()=>({at:performance.now(),combat:__K11520_KSPACE_API__.snapshot(),joyRect:(()=>{const r=document.querySelector('#joy').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})()});const trace={label,started:performance.now(),samples:[read()],pointers:[]};globalThis.kspaceApproachTrace=trace;globalThis.kspaceApproachRead=read;const listener=e=>{if(trace.pointers.length<160)trace.pointers.push({at:performance.now(),type:e.type,isTrusted:e.isTrusted,pointerType:e.pointerType,pointerId:e.pointerId,x:e.clientX,y:e.clientY,target:e.target.id,control:e.target.closest?.('#joy,#yControl,#tradeSword')?.id||null,buttons:e.buttons})};for(const t of ['pointerdown','pointermove','pointerup','pointercancel'])document.addEventListener(t,listener,true);trace.timer=setInterval(()=>{if(trace.samples.length<160)trace.samples.push(read())},100);globalThis.kspaceApproachStop=()=>{clearInterval(trace.timer);delete trace.timer;for(const t of ['pointerdown','pointermove','pointerup','pointercancel'])document.removeEventListener(t,listener,true);trace.samples.push(read());return trace}},label);
  };
  const finishApproach=async()=>{const trace=await page.evaluate(()=>kspaceApproachStop());(report.kspaceApproaches??=[]).push(trace);return trace};
  const pursue=async(label,limit,timeoutMs,magnitude,onReady=null)=>{
    const native=await page.context().newCDPSession(page),contacts=new Map(),feedback=[];
    const rail=await page.locator('#yControl').boundingBox();
    assert.ok(rail,'3D pursuit needs the existing Y rail');
    const rx=rail.x+rail.width/2,ry=rail.y+rail.height/2;
    const send=async(type,id,px,py)=>{if(type==='touchEnd')contacts.delete(id);else contacts.set(id,{id,x:px,y:py,radiusX:3,radiusY:3,force:1});await native.send('Input.dispatchTouchEvent',{type,touchPoints:[...contacts.values()]})};
    await observeApproach(label);
    const deadline=Date.now()+timeoutMs,standoff=label==='phantomAxe';let reached=false,lastTrace=null;
    try{
      while(Date.now()<deadline){
        // Keep feedback small while controls are held. Large quote/actor trace
        // serialization between readiness and release caused measured coasting.
        const current=await page.evaluate(()=>{const c=__K11520_KSPACE_API__.snapshot(),v=__K11520_3D_CONTROL__.vector,h=Math.hypot(v.x,v.z),d=Math.hypot(c.relative.x,c.relative.z);return{at:performance.now(),relative:c.relative,distance:c.distance,selection:c.selection,playerLocal:c.playerLocal,input:{...v},forward:h?{x:v.x/h,z:v.z/h}:null,dot:h&&d>.001?(v.x*c.relative.x+v.z*c.relative.z)/(h*d):null}});
        feedback.push(current);
        const relative=current.relative,planar=Math.hypot(relative.x,relative.z),insideBand=planar>=.45&&planar<=.65&&Math.abs(relative.y)<=.25;
        if(current.distance<limit&&(!standoff||(insideBand&&current.forward&&current.dot>=.8))&&Date.now()<=deadline){
          // Exactly one strike, while feedback controls still establish facing.
          // Never release/serialize the trace and then act on a stale snapshot.
          if(onReady)await onReady(current);
          reached=true;break;
        }
        const error=standoff?planar-.55:planar;
        let travel=Math.abs(error)<(standoff?.08:.15)?0:Math.sign(error)*Math.min(magnitude,Math.max(12,Math.abs(error)*70));
        if(standoff&&planar>=.45&&planar<=.65)travel=contacts.has(31)?5:12;
        const vertical=Math.abs(relative.y)<.15?0:Math.max(-1,Math.min(1,relative.y*1.5));
        if(travel!==0&&!contacts.has(31))await send('touchStart',31,x,y);
        if(vertical!==0&&!contacts.has(32))await send('touchStart',32,rx,ry);
        if(contacts.has(31))contacts.set(31,{id:31,x:x+(planar?relative.x/planar*travel:travel),y:y-(planar?relative.z/planar*travel:0),radiusX:3,radiusY:3,force:1});
        if(contacts.has(32))contacts.set(32,{id:32,x:rx,y:ry-vertical*rail.height*.36,radiusX:3,radiusY:3,force:1});
        if(contacts.size)await native.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[...contacts.values()]});
        await page.waitForTimeout(75);
      }
    }finally{
      // Neutralize and end input even if a precondition or the one attack fails.
      try{if(contacts.size){for(const [id,c]of contacts)contacts.set(id,{...c,x:id===31?x:rx,y:id===31?y:ry});await native.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[...contacts.values()]})}}
      finally{try{if(contacts.size)await native.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
        finally{try{lastTrace=await finishApproach();lastTrace.feedback=feedback;lastTrace.goal={distanceBelow:limit,deadlineMs:timeoutMs,standoff:standoff?{horizontalMin:.45,horizontalMax:.65,verticalMax:.25}:null};lastTrace.reached=reached}finally{await native.detach()}}}
    }
    const downs=lastTrace.pointers.filter(e=>e.type==='pointerdown'&&e.pointerType==='touch');
    assert.ok(downs.every(e=>e.isTrusted&&['joy','yControl'].includes(e.control)),'pursuit contacts must hit actual joystick/Y control owners through trusted input');
    if(onReady){const attacks=lastTrace.pointers.filter(e=>e.type==='pointerdown'&&e.control==='tradeSword');assert.equal(attacks.length,1,'exactly one native Axe strike, never retry a failed attack');assert.equal(attacks[0].isTrusted,true);assert.ok(attacks[0].at-lastTrace.started<=timeoutMs,'approach, aim and actual strike must stay within the original5s bound')}
    assert.equal(reached,true,`${label}: real XYZ controls must reach 3D distance <${limit} within ${timeoutMs}ms; inspect kspaceApproaches`);
  };


  await page.waitForFunction(()=>globalThis.__K11520_KSPACE_COMBAT__?.target);
  for(let i=0;i<3&&(await state()).selection.axis!=='KY';i++){await page.locator('#joy').tap();await page.waitForTimeout(150)}
  await input('0');await page.locator('#attack').click();assert.equal((await state()).lastResult.reason,'OUT_OF_RANGE');await page.waitForTimeout(380);
  await input('-1');const start=await state();assert.equal(start.selection.body,'KY-');
  await page.locator('#attack').click();assert.equal((await state()).lastResult.reason,'OUT_OF_RANGE');assert.equal((await state()).target.hp,120);
  const joy=await page.locator('#joy').boundingBox(),x=joy.x+joy.width/2,y=joy.y+joy.height/2;
  await pursue('initial-live-relative',2,15000,40);
  const near=await state();assert.ok(near.playerLocal.z>start.playerLocal.z,'negative phase must not reverse XYZ');
  for(const axis of ['KX','KY','KZ'])assert.ok(Math.abs(near.playerK[axis]-100*(near.reference[axis].price/near.reference[axis].anchor-1))<1e-9,'current K must follow normalized reference, not frozen startup quotes');
  // Derived displacement can accumulate IEEE-754 error as live market frames
  // translate. Keep exact assertions everywhere else and do not round runtime.
  const deltaKEpsilon=1e-12,expectedDeltaK={KX:0,KY:0,KZ:1};
  assert.deepEqual(Object.keys(near.deltaK).sort(),Object.keys(expectedDeltaK).sort());
  for(const axis of Object.keys(expectedDeltaK))assert.ok(Math.abs(near.deltaK[axis]-expectedDeltaK[axis])<=deltaKEpsilon,`derived deltaK.${axis} outside ${deltaKEpsilon}: ${near.deltaK[axis]}`);
  const prefix=report.profile.name;await page.screenshot({path:`${OUT}/${prefix}-kspace-target.png`});
  await page.locator('.monsterHud').click({position:{x:12,y:12}});await page.locator('#sheet.open').waitFor();
  assert.match(await page.locator('#sheetBody').textContent(),/Player 相對基準.*Monster 模擬相對基準.*模擬相對差/s);
  await page.screenshot({path:`${OUT}/${prefix}-kspace-relative-coordinates.png`});await page.locator('#sheetClose').click();
  const cdp=await page.context().newCDPSession(page),results=[];
  for(const [selector,variant,sign,delay,pause,bodies] of [
    ['#attack','slash-negative','-1',45,400,['KY-']],
    ['#attack','slash-positive','1',45,400,['KY+']],
    ['#skill','goldenRain','-1',300,1500,['KX-','KZ-']],
    ['#tradeSword','phantomAxe','-1',180,2000,['KX-','KY-','KZ-']]]){
    await page.locator('.monsterHud').click({position:{x:12,y:12}});await page.locator('#kspacePracticeReset').click();await page.locator('#sheetClose').click();
    await input(sign);await page.waitForTimeout(400);
    // Market lives now move. Pursue via the real joystick before each strike;
    // never freeze/teleport the target or relax the actual combat range rule.
    const b=await page.locator(selector).boundingBox(),point={x:b.x+b.width/2,y:b.y+b.height/2,button:'left',clickCount:1};
    const beforePursuit=await state();
    const strike=async beforeStrike=>{
      (report.kspaceStrikePreconditions??=[]).push({variant,beforePursuit,beforeStrike});
      assert.deepEqual(beforeStrike.selection,beforePursuit.selection,'pursuit must not accidentally tap-cycle plane or clear signed C');
      assert.equal(beforeStrike.selection.body,'KY'+(sign==='1'?'+':'-'));
      if(variant==='phantomAxe'){
        report.axeFacing={combat:beforeStrike,forward:beforeStrike.forward,dot:beforeStrike.dot,at:beforeStrike.at,preStrike:{combat:beforeStrike,forward:beforeStrike.forward,dot:beforeStrike.dot}};
        assert.ok(beforeStrike.forward&&beforeStrike.dot>=.8,'fresh target must remain safely in established forward half-plane immediately before strike');
        assert.ok(beforeStrike.distance<.8,'standoff/facing must preserve original3D approach range');
      }
      try{await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',...point})}
      finally{await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',...point})}
    };
    if(variant==='phantomAxe')await pursue(variant,.8,5000,35,strike);
    else{await pursue(variant,.8,5000,35);await strike(await state())}
    await page.waitForTimeout(delay);
    const result=(await state()).lastResult;assert.equal(result.hit,true,variant+': '+result.reason);assert.deepEqual(result.hits.map(h=>h.body),bodies);assert.equal(result.rewardKaios,0);
    if(report.profile.landscape)assert.equal(await page.evaluate(()=>{const a=document.getElementById('toast').getBoundingClientRect(),b=document.querySelector('.monsterHud').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top}),false,'damage feedback obscures monster HUD');
    if(variant==='slash-negative')assert.equal(result.reason,'WEAK_POINT');if(variant==='slash-positive')assert.equal(result.reason,'BLOCKED_RESIST');
    (report.worldFeedbackLayouts??=[]).push(await verifyWorldFeedbackLayout(page,variant+' before screenshot'));
    const shot=await cdp.send('Page.captureScreenshot',{format:'png'});await fs.writeFile(`${OUT}/${prefix}-kspace-${variant}.png`,Buffer.from(shot.data,'base64'));
    (report.worldFeedbackLayouts??=[]).push(await verifyWorldFeedbackLayout(page,variant));results.push(result);await page.waitForTimeout(pause);
  }
  await cdp.detach();report.kspace={start,near,results,status:'FUNCTIONAL_PASS_SCREENSHOTS_REQUIRE_VISUAL_REVIEW'};
}
async function verifyWorldFeedbackLayout(page,label){
  const sample=await page.evaluate(()=>{
    const toast=document.getElementById('toast');if(!toast?.classList.contains('show'))return null;
    const box=el=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
    const a=box(toast),collisions=[];
    for(const selector of ['#k11520MonsterGuide','.monsterHud','#attack','#skill','#tradeSword','#dodge','#flat','#orderFire','#joy','#cControl','#lotsControl','#yControl']){
      const el=document.querySelector(selector);if(!el)continue;const style=getComputedStyle(el),b=box(el);
      if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0||!b.width||!b.height)continue;
      if(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)collisions.push({selector,box:b});
    }
    return {event:toast.dataset.worldEvent||'GAMEPLAY',transitionProperty:getComputedStyle(toast).transitionProperty,toast:a,viewport:{width:innerWidth,height:innerHeight},collisions};
  });
  if(sample){assert.equal(sample.transitionProperty,'opacity',`${label} visible feedback must not animate layout across gameplay controls`);assert.deepEqual(sample.collisions,[],`${label} world feedback obscures gameplay controls: ${JSON.stringify(sample)}`);assert.ok(sample.toast.left>=0&&sample.toast.top>=0&&sample.toast.right<=sample.viewport.width&&sample.toast.bottom<=sample.viewport.height,`${label} world feedback clipped: ${JSON.stringify(sample)}`)}
  return sample;
}
async function verifyFeedbackFade(page,report){
  // Presentation-only regression: a completed loot toast must fade in place,
  // not jump back across the HUD when its placement styles are cleared.
  report.feedbackFade=await page.evaluate(async()=>{
    const {show11520Toast}=await import('./runtime/game-ui-product-fixes-v23.mjs');
    show11520Toast('擊倒！Heart Fragment · EPIC · 背包已保存 / 本機 KAIOS（候選帳本）',{combat:true,duration:450});
    const toast=document.getElementById('toast'),frames=[],start=performance.now();
    // Observe the completed transition, not an arbitrary frame at exactly 800ms.
    // Retain exact zero and all geometry assertions; a stuck toast fails at 2s.
    await new Promise(resolve=>{function sample(){const r=toast.getBoundingClientRect(),opacity=Number(getComputedStyle(toast).opacity),at=performance.now()-start;frames.push({at,show:toast.classList.contains('show'),opacity,x:r.x,y:r.y,width:r.width,height:r.height});if(at<2000&&(at<800||toast.classList.contains('show')||opacity!==0))requestAnimationFrame(sample);else resolve()}requestAnimationFrame(sample)});
    return frames;
  });
  const visible=report.feedbackFade.filter(f=>f.opacity>0.01),first=visible[0];
  assert(first,'toast must actually become visible');
  assert(visible.some(f=>!f.show),'sample real opacity fade after dismiss timer');
  for(const f of visible)for(const key of ['x','y','width','height'])assert(Math.abs(f[key]-first[key])<1,`toast ${key} moved during visible fade: ${JSON.stringify(f)}`);
  assert.equal(report.feedbackFade.at(-1).opacity,0,'toast must finish fading');
}
async function finalizeLandscape(page,report){
  await page.locator('#confirm').waitFor({state:'hidden'});
  await page.locator('#charState').filter({hasText:/READY|FALLBACK/}).waitFor({timeout:45000});
  const controls=['#joy','#yControl','#cControl','#lotsControl','#cNumericInput','#lotsNumericInput','#attack','#skill','#tradeSword','#dodge','#flat','#orderFire','#k11520UtilityMaster'];
  const boxes=()=>page.evaluate(sels=>Object.fromEntries(sels.map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return[s,{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,hit:h===e||e.contains(h)}]})),controls);
  const overlaps=(a,b)=>a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;
  const initial=await boxes();
  const cdp=await page.context().newCDPSession(page);
  report.combat=[];
  for(const [selector,variant,delay,duration]of [['#attack','slash',45,330],['#skill','goldenRain',300,1100],['#tradeSword','phantomAxe',180,780]]){
    const b=initial[selector],pointer={x:b.x+b.width/2,y:b.y+b.height/2,button:'left',clickCount:1};
    await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',...pointer});await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',...pointer});await page.waitForTimeout(delay);
    const timing=await page.evaluate(()=>({variant:__K11520_COMBAT_FX__.variant,elapsed:Date.now()-__K11520_COMBAT_FX__.at}));assert.equal(timing.variant,variant);assert.ok(timing.elapsed<duration,`${variant} capture missed active window: ${timing.elapsed}ms`);
    (report.worldFeedbackLayouts??=[]).push(await verifyWorldFeedbackLayout(page,'landscape-'+variant+' before screenshot'));
    // CDP captures the presented frame without Playwright waiting for fonts/layout animation settling.
    const shot=await cdp.send('Page.captureScreenshot',{format:'png'});await fs.writeFile(`${OUT}/landscape-${variant}.png`,Buffer.from(shot.data,'base64'));
    (report.worldFeedbackLayouts??=[]).push(await verifyWorldFeedbackLayout(page,'landscape-'+variant));
    report.combat.push({...timing,realClick:true});await page.waitForTimeout(1300);
  }
  await cdp.detach();
  for(const [s,b]of Object.entries(initial)){assert.ok(b.hit,s+' pointer blocked');assert.ok(b.x>=0&&b.y>=0&&b.right<=844&&b.bottom<=390,s+' clipped');assert.ok(b.width>=44&&b.height>=44,s+' touch target below 44px')}
  for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++)assert.ok(!overlaps(initial[controls[i]],initial[controls[j]]),controls[i]+' overlaps '+controls[j]);
  assert.ok(initial['#attack'].width>initial['#skill'].width&&initial['#attack'].width>initial['#tradeSword'].width,'primary attack should be largest');
  report.rotation=[];
  for(let i=0;i<4;i++){
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
    const portrait=await snapshot(page);check('rotation portrait '+i,portrait);if(i===3)await page.screenshot({path:`${OUT}/rotation-portrait-390x844.png`});
    await page.setViewportSize({width:844,height:390});await page.waitForTimeout(400);
    const current=await boxes();for(const s of controls)for(const k of ['x','y','width','height'])assert.ok(Math.abs(current[s][k]-initial[s][k])<1,`${s} ${k} drift after rotation ${i}`);
    assert.deepEqual(await page.locator('#three').evaluate(e=>[e.clientWidth,e.clientHeight]),[844,390]);report.rotation.push({cycle:i,stable:true});
  }
  const input=async(s,v)=>{await page.locator(s).fill(v);await page.locator(s).press('Enter');await page.waitForTimeout(300)};
  const state=()=>page.evaluate(()=>({axis:__K11520_SIGNED_C_IMMERSIVE__.activeAxis,c:__K11520_SIGNED_C_IMMERSIVE__.signedC,lots:__K11520_SIGNED_C_IMMERSIVE__.lots,side:__K11520_SIGNED_C_IMMERSIVE__.canonicalSide,plane:__K11520_3D_CONTROL__.mode}));
  for(const [plane,axis]of [['XZ','KY'],['XY','KZ'],['YZ','KX'],['XZ','KY']]){
    for(let n=0;(await state()).plane!==plane&&n<3;n++){await page.locator('#joy').tap();await page.waitForTimeout(200)}
    assert.equal((await state()).axis,axis,plane+' normal trading axis');
    const before=await state();await ensureExpandedMarket(page);await page.locator('[data-axis="'+(axis==='KX'?'KY':'KX')+'"]').click();await page.locator('#sheet.open').waitFor();assert.deepEqual(await state(),before,'market detail changed trading authority');await page.locator('#sheetClose').click();
  }
  await input('#cNumericInput','-0.1');assert.equal((await state()).side,'空');await input('#lotsNumericInput','7');assert.equal((await state()).lots,7);await input('#lotsNumericInput','-5');assert.equal((await state()).lots,7);await input('#cNumericInput','-0');assert.equal((await state()).c,0);assert.ok(!(await page.locator('#cRead').textContent()).includes('-0'));
  await input('#cNumericInput','1');await input('#lotsNumericInput','1');
  const world=()=>page.evaluate(()=>structuredClone(__K11520_WORLD_COORDS__));
  const drag=async(s,x,y)=>{const b=await page.locator(s).boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width*x,b.y+b.height*y,{steps:8});await page.waitForTimeout(320);await page.mouse.up();await page.waitForTimeout(160)};
  let before=await world();await drag('#joy',.85,.5);assert.ok((await world()).physical.x>before.physical.x,'joystick X+ did not move avatar');before=await world();await drag('#yControl',.5,.15);assert.ok((await world()).physical.y>before.physical.y,'Y+ did not move avatar');await drag('#yControl',.5,.85);
  await page.locator('#orderFire').click();await page.locator('#confirm.open').waitFor();assert.ok((await page.locator('#confirmBody').textContent()).includes('KY'));await page.screenshot({path:`${OUT}/landscape-direct-order.png`});await page.locator('#cancelOrder').click();
  await page.locator('#attack').click();await page.waitForTimeout(420);await page.locator('#attack').click();assert.equal(await page.evaluate(()=>__K11520_COMBAT_FX__.variant),'slash');await page.waitForTimeout(1200);
  before=await world();await page.locator('#dodge').click();assert.notDeepEqual((await world()).physical,before.physical,'dodge did not move');
  await page.screenshot({path:`${OUT}/landscape-final-844x390.png`});
  report.landscapeFinalization='PASS';
}
function check(label,state,{expanded=false,landscape=false}={}){const b=state.boxes;const ok=(value,message)=>{if(!value)failures.push(`${label}: ${message}`)};
  ok(state.layoutStability?.stable===true,'relevant HUD geometry did not settle across3 consecutive frames within500ms');
  ok(/wukong-y-control\.jpg/i.test(state.axisArt.image),'normal-axis thumb lost approved Wukong artwork');
  ok(state.axisArt.position==='31.5% 46.3%','normal-axis artwork focal point drifted: '+state.axisArt.position);
  ok(/^426\.5%(?: auto)?$/.test(state.axisArt.size),'normal-axis artwork is not the upright face crop: '+state.axisArt.size);
  ok(state.axisArt.repeat==='no-repeat','normal-axis artwork unexpectedly repeats');
  const overlap=(a,c)=>a?.visible&&c?.visible&&a.x<c.right&&a.right>c.x&&a.y<c.bottom&&a.bottom>c.y;
  const combatHidden=landscape&&expanded;
  // On short portrait screens, opening More intentionally yields the scarce world area to
  // the 44px utility tray. These two read-only status rows return as soon as More closes.
  const compactUtilityTray=expanded&&!landscape&&state.height<=780;
  const target=b['#kspaceTarget'];ok(!target?.visible,'legacy K-space detail card must stay folded into monster HUD');
  if(!expanded)for(const other of ['.minimapWrap','#joy','#cControl','#lotsControl','#yControl','#attack','#orderFire'])ok(!overlap(b['#k11520MonsterGuide'],b[other]),`contextual target overlaps ${other}`);
  if(landscape&&!expanded)for(const other of ['.tele','.monsterHud'])ok(!overlap(b['#k11520MonsterGuide'],b[other]),`landscape contextual target overlaps ${other}`);
  for(const s of ['.top',...(compactUtilityTray?[]:['.tele','.monsterHud']),'.minimapWrap','#joy','#cControl','#lotsControl','#yControl','#cThumb','#lotsThumb','#yThumb','#k11520UtilityMaster',...(combatHidden?[]:['#orderFire','#attack'])]){const r=b[s];ok(r?.visible,`${s} missing/hidden`);if(r?.visible)ok(r.x>=-1&&r.y>=-1&&r.right<=state.width+1&&r.bottom<=state.height+1,`${s} outside viewport`)}
  if(compactUtilityTray){ok(!b['.tele']?.visible,'short portrait More tray must context-hide world telemetry');ok(!b['.monsterHud']?.visible,'short portrait More tray must context-hide monster status')}
  for(const s of ['#joy','#cControl','#lotsControl','#yControl','#k11520UtilityMaster',...(combatHidden?[]:['#tradeSword','#orderFire','#attack'])])ok(b[s]?.hit,`${s} cannot receive a real click: ${JSON.stringify(b[s]?.blocker)}`);
  const clock=b['#brandClockV250'];if(clock){ok(clock.right<=Math.min(...state.balances.map(r=>r.x))-4,'header clock crosses into balances');ok(clock.bottom<=b['.top'].bottom-4,'header clock escapes header')}
  for(const s of ['#attack','#orderFire','#tradeSword','#k11520PlaneLabel','#dockToggle','#skill','#dodge','#flat']){for(const other of ['#joy','#cControl','#lotsControl','#yControl'])ok(!overlap(b[s],b[other]),`${s} overlaps ${other}`)}
  for(const s of ['#attack','#orderFire'])ok(!overlap(b[s],b['#k11520RealTradePreflightBtn']),`${s} partly covered by preflight button`);
  ok(state.drawers.every(r=>!r?.visible),'legacy drawer controls visible');
  const maxCard=Math.max(...state.cards.map(r=>r.bottom));
  if(!compactUtilityTray)for(const s of ['.tele','.monsterHud'])if(b[s]){ok(b[s].y>=maxCard+6,`${s} overlaps actual market cards`);ok(b[s].scroll<=b[s].client+1,`${s} clips text`)}
  // Current mobile ownership intentionally centers the normal-axis energy rail, then places signed-C and positive lots to its right.
  const rails=['#yControl','#cControl','#lotsControl'].map(s=>b[s]);if(rails.every(Boolean)){ok(rails.every(r=>Math.abs(r.y-rails[0].y)<2),'three rails not aligned');ok(rails[0].right+5<=rails[1].x&&rails[1].right+5<=rails[2].x,'three rails overlap');if(!landscape)ok(Math.abs((rails[0].x+rails[0].width/2)-state.width/2)<2,'normal-axis energy rail not centered')}
  if(landscape)for(const rail of rails){ok(!overlap(rail,b['.monsterHud']),`parameter rail overlaps life HUD`);ok(!overlap(rail,b['.tele']),`parameter rail overlaps world HUD`)}
  for(const [rail,thumb,read] of [['#cControl','#cThumb','#cRead'],['#lotsControl','#lotsThumb','#lotsRead'],['#yControl','#yThumb','#yRead']]){
    const r=b[rail],t=b[thumb],text=b[read];if(r&&t){ok(Math.abs(t.width-t.height)<.5,`${thumb} is not circular`);ok(t.y>=r.y+20&&t.bottom<=r.bottom-20,`${thumb} escapes the track or covers its label`)}
    if(r&&text)ok(text.y>=r.y&&text.bottom<=r.bottom+1,`${read} escapes its control`);
  }
  const joy=b['#joy'],normal=b['#yControl'],badge=b['#k11520PlaneLabel'],sword=b['#tradeSword'];
  ok(joy?.right+8<=normal?.x,'joystick must keep 8px clearance from the centered normal-axis rail');
  ok(badge?.right+8<=sword?.x,'plane badge must keep 8px clearance from the trade sword');
  const master=b['#k11520UtilityMaster'];
  ok(landscape&&!expanded?Math.abs(master.y-58)<1:Math.abs(state.height-master.bottom-(landscape?18:150))<1,'utility master must keep its responsive anchor without drifting across expand/collapse');
  if(landscape&&!expanded){ok(!overlap(master,b['#orderFire']),'utility master overlaps landscape order');ok(!overlap(master,b['#attack']),'utility master overlaps landscape attack')}
  ok(b['#lotsControl']?.right+8<=master.x,'utility master must keep horizontal clearance from parameter rails');
  if(!expanded)ok(utilities.every(s=>!b[s]?.visible),'collapsed utility lane contains extra controls');
  else{
    ok(state.utilityOpen,'expanded utility state missing');
    const controls=['#backpackButton','#aiChatButton','#bgmButton','#chatHandle','#walletToggle','#gameModeToggle','#dockToggle','#k11520UtilityMaster','#k11520HudCollapseAll'];
    for(const selector of controls){const r=b[selector];ok(r?.visible&&r.hit,selector+' must be visible and pointer-reachable when expanded');if(!r?.visible)continue;
      ok(r.width>=44&&r.height>=44,selector+' must have a 44px hit target');
      ok(r.x>=0&&r.y>=0&&r.right<=state.width&&r.bottom<=state.height,selector+' outside viewport');
      for(const other of ['.top','.axes','.tele','.monsterHud','#joy','#yControl','#cControl','#lotsControl','#tradeSword','#skill','#dodge','#flat','#attack','#orderFire'])ok(!overlap(r,b[other]),selector+' overlaps '+other);
    }
    for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){
      const first=b[controls[i]],second=b[controls[j]];ok(!overlap(first,second),controls[i]+' overlaps '+controls[j]);
      if(!landscape&&first?.visible&&second?.visible){const horizontalGap=Math.max(first.x-second.right,second.x-first.right),verticalGap=Math.max(first.y-second.bottom,second.y-first.bottom);ok(horizontalGap>=4||verticalGap>=4,controls[i]+' and '+controls[j]+' need a visible 4px gap')}
    }
  }
}
try{
  if(PRODUCTION)await verifyProductionSource();
  else await verifyInitialQuoteWait();
  for(const profile of selectedProfiles){
    // Cold profiles must not inherit Chromium process/emulation state after the preceding
    // profile's CDP combat captures and repeated mobile rotations. Keep every assertion.
    await browser.close();browser=await launchBrowser();
    const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},isMobile:true,hasTouch:true});const page=await context.newPage();const errors=[],warnings=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(['warning','error'].includes(m.type()))warnings.push(m.text().slice(0,300))});
    // Explicit full-information preference; default MINIMAL is covered by verifyWorldFirst.
    await page.addInitScript(()=>localStorage.setItem('k11520.ui.settings',JSON.stringify({profile:'FULL'})));
    await page.addInitScript(({key,encoded})=>{if(!localStorage.getItem(key))localStorage.setItem(key,encoded)},skillFixture);
    if(!PRODUCTION)await page.route('https://data-api.binance.vision/api/v3/aggTrades*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(freeQuotePayload(route,[{symbol:'BTCUSDT',price:'77564.83000000'},{symbol:'ETHUSDT',price:'2511.16000000'},{symbol:'BNBUSDT',price:'724.23000000'}]))}));
    if(profile.warm)await page.addInitScript(()=>{localStorage.setItem('11520.play.cleanMode','1');localStorage.setItem('k11520.joystick.plane','XZ');localStorage.setItem('klineodyssey.public-wallet-identity.v1',JSON.stringify({version:1,address:'0x1234567890123456789012345678901234567890',chainId:56,sourceWorld:'K12345',updatedAt:new Date().toISOString()}))});
    const report={profile,mode:PRODUCTION?'PUBLIC_PAGES_READ_ONLY':'LOCAL_REALISTIC_QUOTE_FIXTURE',playerFixture:'LOCAL_QA_PLAYER_LEVEL_3_CANONICAL_EVENTS_NO_ECONOMIC_AUTHORITY',errors,warnings,states:{}};reports.push(report);
    try{await page.goto(BASE+ROUTE,{waitUntil:'domcontentloaded',timeout:35000});await page.waitForFunction(()=>globalThis.__K11520_3D_CONTROL__&&globalThis.__K11520_KSPACE_COMBAT__&&globalThis.__K11520_SIGNED_C_IMMERSIVE__&&document.getElementById('k11520UtilityMaster'),null,{timeout:45000});await page.waitForTimeout(7500);if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click();
      await page.locator('#charState').filter({hasText:/READY|FALLBACK/}).waitFor({timeout:45000});
      await verifyFullHudControlOwnership(page,report);
      await verifySettingsContext(page,report);await ensureExpandedMarket(page);await verifyMarketHeaderSeparation(page,report,'full-expanded');
      report.states.cold=await snapshot(page);await page.screenshot({path:`${OUT}/${profile.name}-collapsed.png`,fullPage:true});check(profile.name,report.states.cold,{landscape:!!profile.landscape});
      await verifyFeedbackFade(page,report);
      const authorityBefore=await page.evaluate(()=>({axis:globalThis.__K11520_SIGNED_C_IMMERSIVE__?.activeAxis,order:document.querySelector('#orderFire')?.getAttribute('aria-label')}));
      const inspectedAxis=authorityBefore.axis==='KX'?'KY':'KX';await ensureExpandedMarket(page);await page.locator(`[data-axis="${inspectedAxis}"]`).click();await page.waitForTimeout(100);
      const authorityAfter=await page.evaluate(()=>({axis:globalThis.__K11520_SIGNED_C_IMMERSIVE__?.activeAxis,order:document.querySelector('#orderFire')?.getAttribute('aria-label')}));
      assert.deepEqual(authorityAfter,authorityBefore,'market detail click must not change plane-selected trading authority or order semantics');
      await page.locator('#sheetClose').click();report.marketCardAuthority='PRESERVED';
      if(report.states.cold.boxes['#k11520UtilityMaster']?.hit){
        report.states.utilityCycles=[];
        for(let i=0;i<3;i++){
          await page.locator('#k11520UtilityMaster').click({timeout:2500});await page.waitForTimeout(250);
          const opened=await snapshot(page),priorFailures=failures.length;
          report.states.utilityCycles.push({cycle:i,opened});
          check(profile.name+' expanded cycle '+i,opened,{expanded:true,landscape:!!profile.landscape});
          if(failures.length>priorFailures){
            const diagnostic=report.states.utilityCycles.at(-1);
            diagnostic.failures=failures.slice(priorFailures);
            await page.screenshot({path:`${OUT}/${profile.name}-expanded-cycle-${i}-failure.png`,fullPage:true});
            diagnostic.frames=await page.evaluate(async()=>{const began=performance.now(),frames=[];const read=()=>{const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};return{at:performance.now(),landscapeStatusTop:document.documentElement.style.getPropertyValue('--k11520-landscape-status-top'),cards:[...document.querySelectorAll('#axes .axis')].map(rect),status:['.tele','.monsterHud'].map(selector=>{const el=document.querySelector(selector),style=getComputedStyle(el);return{selector,...rect(el),top:style.top,transition:style.transition,animations:el.getAnimations().map(a=>({state:a.playState,currentTime:a.currentTime}))}})}};do{frames.push(read());await new Promise(requestAnimationFrame)}while(performance.now()-began<500&&frames.length<60);return frames});
          }
          if(i===0){report.states.open=opened;await page.screenshot({path:`${OUT}/${profile.name}-expanded.png`,fullPage:true})}
          await page.locator('#k11520UtilityMaster').click({timeout:2500});await page.waitForTimeout(250);
        }
        report.states.closedAgain=await snapshot(page);check(profile.name+' after cycles',report.states.closedAgain,{landscape:!!profile.landscape});await page.screenshot({path:`${OUT}/${profile.name}-closed-again.png`,fullPage:true});
      }
      // Open a simulation preview directly; neither order nor combat needs arming.
      const quotePresent=await page.locator('[data-axis="KX"] .q').textContent().then(s=>Number(String(s).replace(/[$,]/g,''))>0);
      if(PRODUCTION)assert.equal(quotePresent,true,'Public Pages market-data-only quote source must be LIVE');
      if(report.states.cold.boxes['#orderFire']?.hit){await page.locator('#cNumericInput').fill('1');await page.locator('#cNumericInput').press('Enter');await page.locator('#orderFire').click({timeout:2500});await page.locator('#confirm.open').waitFor({timeout:2500});await page.screenshot({path:`${OUT}/${profile.name}-order-preview.png`,fullPage:true});await page.locator('#cancelOrder').click({timeout:2500});report.orderPreview='OPENED_AND_CANCELLED'}
      // The preceding cancelled-order feedback is transient, not map content.
      await page.waitForFunction(()=>{const el=document.getElementById('toast');return !el||(!el.classList.contains('show')&&Number(getComputedStyle(el).opacity)===0)},null,{timeout:5000});
      await page.locator('#kspaceViewK').click();await page.locator('#kspaceMarketMap').waitFor();
      assert.match(await page.locator('#kspaceMapValues').textContent(),/WORLD 11520.*KX\/BTC.*KY\/ETH.*KZ\/BNB.*LOCAL XYZ/s);
      assert.equal(await page.locator('#sheetClose').evaluate(el=>{const r=el.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.top>=0&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),true);
      await page.screenshot({path:`${OUT}/${profile.name}-canonical-map.png`});await page.locator('#sheetClose').click();
      if(profile.width===390||profile.landscape){await verifyMarketSync(page,report);await verifyKSpaceMap(page,report);await verifyKSpaceGameplay(page,report)}
      if(profile.landscape)await finalizeLandscape(page,report);
      if(PRODUCTION&&warnings.some(message=>/blocked by CORS|data-api\.binance\.vision.*ERR_FAILED/i.test(message)))failures.push(`${profile.name}: public quote CORS regression`);
      if(errors.length)failures.push(`${profile.name}: ${errors.join('; ')}`);
    }catch(error){report.error=String(error);report.errorStack=error?.stack;report.failureFullHudInput=await page.evaluate(()=>({pointerTrace:globalThis.fullHudPointerTrace||[],camera:globalThis.__K11520_CAMERA__?.snapshot?.(),statusShown:document.querySelector('#k11520CameraZoomStatus')?.classList.contains('show')})).catch(()=>null);failures.push(`${profile.name}: ${String(error)}`);await page.screenshot({path:`${OUT}/${profile.name}-failure.png`,fullPage:true,timeout:5000}).catch(()=>{})}finally{await context.close()}
  }
}finally{await browser.close();await fs.writeFile(`${OUT}/report.json`,JSON.stringify({capturedAt:new Date().toISOString(),base:BASE,head:process.env.K11520_SOURCE_SHA||process.env.GITHUB_SHA||null,publicAssetHead:process.env.K11520_PUBLIC_ASSET_SHA||null,sourceChecks,reports,failures},null,2))}
assert.deepEqual(failures,[],'Responsive product failures; inspect screenshots and report.json');
console.log('11520 real-entry responsive/cold-warm/realistic-quotes/real-hit-targets/bounded-thumbs/order-preview/utility-cycles PASS');
