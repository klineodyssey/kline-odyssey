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

// Real entry only: never import repairs or change runtime styles from QA.
const OUT='artifacts/11520-responsive-qa';
const BASE=process.env.K11520_BASE_URL||'http://127.0.0.1:4173';
const ROUTE='/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html';
const PRODUCTION=process.env.K11520_PRODUCTION_QA==='1';
const profiles=PRODUCTION?[{name:'pages-360',width:360,height:740},{name:'pages-390',width:390,height:844},{name:'pages-432',width:432,height:856},{name:'pages-landscape-844',width:844,height:390,landscape:true}]:[
  {name:'cold-390',width:390,height:844},{name:'cold-432',width:432,height:856},
  {name:'warm-412',width:412,height:772,warm:true},{name:'cold-360',width:360,height:844},{name:'cold-landscape-844',width:844,height:390,landscape:true},
  {name:'cold-480',width:480,height:900}
];
// Optional local diagnosis only; default CI still exercises every profile.
const selectedProfiles=process.env.K11520_RESPONSIVE_PROFILE?profiles.filter(p=>p.name===process.env.K11520_RESPONSIVE_PROFILE):profiles;
assert.ok(selectedProfiles.length,'Unknown K11520_RESPONSIVE_PROFILE');
const selectors=['#kspaceTarget','#k11520MonsterGuide','.top','.axes','.tele','.monsterHud','.minimapWrap','#joy','#cControl','#lotsControl','#yControl','#cThumb','#lotsThumb','#yThumb','#cRead','#lotsRead','#yRead','#tradeSword','#k11520PlaneLabel','#dockToggle','#skill','#dodge','#flat','#brandClockV250','#k11520RealTradePreflightBtn','#k11520UtilityMaster','#dock','#walletToggle','#chatHandle','#bgmButton','#aiChatButton','#backpackButton','#gameModeToggle','#k11520HudCollapseAll','#orderFire','#attack','#cargoInterceptionButton'];
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
      assert.equal(await page.evaluate(()=>globalThis.__K11520_UI_SETTINGS__.profile),'MINIMAL');
      assert.equal(await page.locator('#axes').isVisible(),false);
      for(const selector of ['#cargoInterceptionButton','#homeDeliveryButton','#k11520MarketRow','#k11520CameraReset']){
        const box=await page.locator(selector).boundingBox();assert.ok(box&&box.height>=44&&box.width>=44,selector+' accessible compact target');
        assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=profile.width&&box.y+box.height<=profile.height);
      }
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
      // Pick an actually empty canvas origin, not a hard-coded monster/UFO pixel.
      const point=await page.evaluate(()=>{for(let y=innerHeight<500?125:250;y<innerHeight*.6;y+=20)for(let x=innerWidth*.4;x<innerWidth-90;x+=20)if([0,30,60].every(dx=>[-24,0,24].every(pad=>[-24,0,24].every(py=>document.elementFromPoint(x+dx+pad,y+py)?.id==='three'))&&globalThis.__K11520_CAMERA__.canPanAt(x+dx,y)))return{x,y};return null});
      assert.ok(point,'an unobstructed world gesture surface must exist');
      const start=await read(),{x,y}=point;
      await page.evaluate(()=>{globalThis.worldFirstPointerTrace=[];for(const type of ['pointerdown','pointermove','pointerup','pointercancel'])document.addEventListener(type,e=>{if(worldFirstPointerTrace.length<30)worldFirstPointerTrace.push({type,id:e.pointerId,target:e.target.id,x:e.clientX,y:e.clientY,button:e.button,canPan:__K11520_CAMERA__.canPanAt(e.clientX,e.clientY)})},true)});
      await touch('touchStart',[[1,x,y]]);await touch('touchMove',[[1,x+30,y]]);await touch('touchMove',[[1,x+60,y]]);await touch('touchEnd',[]);
      result.pointerTrace=await page.evaluate(()=>({events:worldFirstPointerTrace,touchAction:getComputedStyle(document.querySelector('#three')).touchAction,scale:visualViewport.scale}));result.panOrigin=point;
      const pan=await read();assert.notEqual(pan.panX,start.panX,'world drag pans');assert.deepEqual(pan.playerXYZ,start.playerXYZ,'camera pan never moves XYZ');
      await touch('touchStart',[[1,x-35,y],[2,x+35,y]]);await touch('touchMove',[[1,x-60,y],[2,x+60,y]]);await touch('touchEnd',[]);
      const zoom=await read();assert.ok(zoom.zoom>pan.zoom&&zoom.zoom<=zoom.bounds.maxZoom);assert.deepEqual(zoom.playerXYZ,start.playerXYZ);
      await page.locator('#k11520CameraReset').click();assert.deepEqual(await read(),start);
      await page.locator('#k11520MarketRow').click();assert.equal(await page.locator('#axes').isVisible(),true);
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
      result.checks.marketIdle='15s / held-pointer / resume PASS';result.checks.camera='PAN / PINCH / RESET / XYZ ISOLATION PASS';
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
        const other=await page.evaluate(()=>globalThis.__K11520_WORLD_SELECTION_PROJECTION__.journeyLifeSnapshot().find(m=>m.visible&&m.inView&&m.uncovered&&Math.abs(m.screen.x-innerWidth/2)>50&&__K11520_MONSTER_FOLLOW__.snapshot().actors.some(a=>a.id===m.id&&a.alive)));
        assert.ok(other,'a second market-life actor must be selectable');
        await page.mouse.click(other.screen.x,other.screen.y);await page.locator('#monsterFollowAction').waitFor({state:'visible'});await page.locator('#monsterFollowAction').click();
        assert.notEqual(await page.evaluate(()=>globalThis.__K11520_MONSTER_FOLLOW__.snapshot().followedMonsterId),followed,'player can switch the followed actor');
        await page.locator('#k11520FollowMonster').click();await page.locator('#k11520MonsterGuide').click();await page.locator('#monsterFollowAction').click();
        result.checks.followSwitch='ACTUAL WORLD TAP / SWITCH / CANCEL PASS';
      }
      assert.equal(await page.locator('#minimap').getAttribute('data-coordinate-space'),'XYZ');
      const map=await page.locator('#minimap').boundingBox();await page.mouse.click(map.x+map.width*.85,map.y+map.height*.8);
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
    }catch(error){result.error=String(error);await page.screenshot({path:`${OUT}/world-first-${profile.width}-FAIL.png`}).catch(()=>{});throw error}
    finally{await context.close();await fs.writeFile(`${OUT}/world-first-report.json`,JSON.stringify({results,head:process.env.K11520_SOURCE_SHA||null},null,2))}
  }
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
    await page.waitForFunction(()=>document.querySelector('.brandMetaV250')?.textContent.includes('V2.9.0'));
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
    assert.match(await page.locator('.brandMetaV250').textContent(),/V2\.9\.0/,'legacy runtime must not overwrite release stamp');
    assert.equal(await page.evaluate(()=>globalThis.__K11520_KSPACE_API__.snapshot().market.status),'WAIT');
    assert.equal(await page.locator('.marketKValue').count(),0);await page.locator('#attack').click();
    await page.screenshot({path:`${OUT}/startup-WAIT-no-fake-market.png`});ready=true;
    await page.waitForFunction(()=>globalThis.__K11520_MARKET_K__?.status==='LIVE',null,{timeout:15000});
    assert.equal(await page.evaluate(()=>globalThis.__K11520_KSPACE_API__.snapshot().target.id),'SIM-K-GUARDIAN');assert.deepEqual(errors,[]);
    await page.screenshot({path:`${OUT}/startup-first-valid-batch.png`});
  }finally{await context.close()}
}
async function verifyProductionSource(){
  for(const name of ['../game-5d.html','../sw.js','../manifest.webmanifest','../controls/nonlinear-controls.mjs','spatial-coordinate-runtime.mjs','mobile-signed-c-immersive-runtime.mjs','kgen-margin-runtime.mjs','world-runtime.mjs','game-5d-main.mjs','combat-drive-live-runtime.mjs','combat-fx-runtime.mjs','game-5d-bootstrap.mjs','game-ui-product-fixes-v23.mjs','mobile-control-layout.mjs','market-origin-wallet-layout-runtime.mjs','mobile-action-rail-clearance-runtime.mjs','evm-wallet-runtime.mjs','public-market-quotes.mjs','plane-map-runtime.mjs','xyz-map-navigation-runtime.mjs']){
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
async function snapshot(page){return page.evaluate(sels=>{
  const box=el=>{if(!el)return null;const r=el.getBoundingClientRect(),s=getComputedStyle(el);const visible=s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0;const h=visible?document.elementFromPoint(r.x+r.width/2,r.y+r.height/2):null;return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,visible,hit:!!h&&(h===el||el.contains(h)),pointer:s.pointerEvents,blocker:h?{id:h.id,classes:String(h.className),pointer:getComputedStyle(h).pointerEvents}:null,scroll:el.scrollHeight,client:el.clientHeight,text:(el.textContent||'').trim().slice(0,240)}};
  const yThumbStyle=getComputedStyle(document.querySelector('#yThumb'));
  return{width:innerWidth,height:innerHeight,boxes:Object.fromEntries(sels.map(s=>[s,box(document.querySelector(s))])),cards:[...document.querySelectorAll('#axes .axis')].map(box),balances:[...document.querySelectorAll('.top>.pill')].map(box),drawers:[...document.querySelectorAll('.hud-drawer-toggle')].map(box),axisArt:{image:yThumbStyle.backgroundImage,position:yThumbStyle.backgroundPosition,size:yThumbStyle.backgroundSize,repeat:yThumbStyle.backgroundRepeat},settingsInstalled:!!globalThis.__K11520_UI_SETTINGS__,layoutInstalled:!!globalThis.__K11520_MOBILE_CONTROL_LAYOUT__,xyzInstalled:!!globalThis.__K11520_3D_CONTROL__,utilityOpen:document.documentElement.classList.contains('k11520UtilitiesOpen'),version:document.querySelector('.brandMetaV250')?.textContent};
},selectors)}
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
  await page.waitForFunction(()=>globalThis.__K11520_KSPACE_COMBAT__?.target);
  for(let i=0;i<3&&(await state()).selection.axis!=='KY';i++){await page.locator('#joy').tap();await page.waitForTimeout(150)}
  await input('0');await page.locator('#attack').click();assert.equal((await state()).lastResult.reason,'OUT_OF_RANGE');await page.waitForTimeout(380);
  await input('-1');const start=await state();assert.equal(start.selection.body,'KY-');
  await page.locator('#attack').click();assert.equal((await state()).lastResult.reason,'OUT_OF_RANGE');assert.equal((await state()).target.hp,120);
  const joy=await page.locator('#joy').boundingBox(),x=joy.x+joy.width/2,y=joy.y+joy.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y-40);
  try{await page.waitForFunction(()=>globalThis.__K11520_KSPACE_COMBAT__?.distance<2,null,{timeout:15000})}finally{await page.mouse.up()}
  const near=await state();assert.ok(near.playerLocal.z>start.playerLocal.z,'negative phase must not reverse XYZ');
  for(const axis of ['KX','KY','KZ'])assert.ok(Math.abs(near.playerK[axis]-100*(near.reference[axis].price/near.reference[axis].anchor-1))<1e-9,'current K must follow normalized reference, not frozen startup quotes');
  assert.deepEqual(near.deltaK,{KX:0,KY:0,KZ:1});
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
    const relative=(await state()).relative,distance=Math.hypot(relative.x,relative.z)||1;
    await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+relative.x/distance*35,y-relative.z/distance*35);
    try{await page.waitForFunction(()=>globalThis.__K11520_KSPACE_COMBAT__.distance<.8,null,{timeout:5000})}finally{await page.mouse.up()}
    const b=await page.locator(selector).boundingBox(),point={x:b.x+b.width/2,y:b.y+b.height/2,button:'left',clickCount:1};
    await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',...point});await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',...point});await page.waitForTimeout(delay);
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
    const before=await state();await page.locator('[data-axis="'+(axis==='KX'?'KY':'KX')+'"]').click();await page.locator('#sheet.open').waitFor();assert.deepEqual(await state(),before,'market detail changed trading authority');await page.locator('#sheetClose').click();
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
  ok(/wukong-y-control\.jpg/i.test(state.axisArt.image),'normal-axis thumb lost approved Wukong artwork');
  ok(state.axisArt.position==='31.5% 46.3%','normal-axis artwork focal point drifted: '+state.axisArt.position);
  ok(/^426\.5%(?: auto)?$/.test(state.axisArt.size),'normal-axis artwork is not the upright face crop: '+state.axisArt.size);
  ok(state.axisArt.repeat==='no-repeat','normal-axis artwork unexpectedly repeats');
  const overlap=(a,c)=>a?.visible&&c?.visible&&a.x<c.right&&a.right>c.x&&a.y<c.bottom&&a.bottom>c.y;
  const combatHidden=landscape&&expanded;
  const target=b['#kspaceTarget'];ok(!target?.visible,'legacy K-space detail card must stay folded into monster HUD');
  if(!expanded)for(const other of ['.minimapWrap','#joy','#cControl','#lotsControl','#yControl','#attack','#orderFire'])ok(!overlap(b['#k11520MonsterGuide'],b[other]),`contextual target overlaps ${other}`);
  for(const s of ['.top','.tele','.monsterHud','.minimapWrap','#joy','#cControl','#lotsControl','#yControl','#cThumb','#lotsThumb','#yThumb','#k11520UtilityMaster',...(combatHidden?[]:['#orderFire','#attack'])]){const r=b[s];ok(r?.visible,`${s} missing/hidden`);if(r?.visible)ok(r.x>=-1&&r.y>=-1&&r.right<=state.width+1&&r.bottom<=state.height+1,`${s} outside viewport`)}
  for(const s of ['#joy','#cControl','#lotsControl','#yControl','#k11520UtilityMaster',...(combatHidden?[]:['#tradeSword','#orderFire','#attack'])])ok(b[s]?.hit,`${s} cannot receive a real click: ${JSON.stringify(b[s]?.blocker)}`);
  const clock=b['#brandClockV250'];if(clock){ok(clock.right<=Math.min(...state.balances.map(r=>r.x))-4,'header clock crosses into balances');ok(clock.bottom<=b['.top'].bottom-4,'header clock escapes header')}
  for(const s of ['#attack','#orderFire','#tradeSword','#k11520PlaneLabel','#dockToggle','#skill','#dodge','#flat']){for(const other of ['#joy','#cControl','#lotsControl','#yControl'])ok(!overlap(b[s],b[other]),`${s} overlaps ${other}`)}
  for(const s of ['#attack','#orderFire'])ok(!overlap(b[s],b['#k11520RealTradePreflightBtn']),`${s} partly covered by preflight button`);
  ok(state.drawers.every(r=>!r?.visible),'legacy drawer controls visible');
  const maxCard=Math.max(...state.cards.map(r=>r.bottom));
  for(const s of ['.tele','.monsterHud'])if(b[s]){ok(b[s].y>=maxCard+6,`${s} overlaps actual market cards`);ok(b[s].scroll<=b[s].client+1,`${s} clips text`)}
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
    if(landscape){for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++)ok(!overlap(b[controls[i]],b[controls[j]]),controls[i]+' overlaps '+controls[j])}
    else for(let i=0;i<controls.length-1;i++){const upper=b[controls[i]],lower=b[controls[i+1]];ok(upper?.bottom+4<=lower?.y,controls[i]+' needs a visible gap before '+controls[i+1])}
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
      report.states.cold=await snapshot(page);await page.screenshot({path:`${OUT}/${profile.name}-collapsed.png`,fullPage:true});check(profile.name,report.states.cold,{landscape:!!profile.landscape});
      await verifyFeedbackFade(page,report);
      const authorityBefore=await page.evaluate(()=>({axis:globalThis.__K11520_SIGNED_C_IMMERSIVE__?.activeAxis,order:document.querySelector('#orderFire')?.getAttribute('aria-label')}));
      const inspectedAxis=authorityBefore.axis==='KX'?'KY':'KX';await page.locator(`[data-axis="${inspectedAxis}"]`).click();await page.waitForTimeout(100);
      const authorityAfter=await page.evaluate(()=>({axis:globalThis.__K11520_SIGNED_C_IMMERSIVE__?.activeAxis,order:document.querySelector('#orderFire')?.getAttribute('aria-label')}));
      assert.deepEqual(authorityAfter,authorityBefore,'market detail click must not change plane-selected trading authority or order semantics');
      await page.locator('#sheetClose').click();report.marketCardAuthority='PRESERVED';
      if(report.states.cold.boxes['#k11520UtilityMaster']?.hit){for(let i=0;i<3;i++){await page.locator('#k11520UtilityMaster').click({timeout:2500});await page.waitForTimeout(250);const opened=await snapshot(page);check(profile.name+' expanded cycle '+i,opened,{expanded:true,landscape:!!profile.landscape});if(i===0){report.states.open=opened;await page.screenshot({path:`${OUT}/${profile.name}-expanded.png`,fullPage:true})}await page.locator('#k11520UtilityMaster').click({timeout:2500});await page.waitForTimeout(250)}report.states.closedAgain=await snapshot(page);check(profile.name+' after cycles',report.states.closedAgain,{landscape:!!profile.landscape});await page.screenshot({path:`${OUT}/${profile.name}-closed-again.png`,fullPage:true})}
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
    }catch(error){report.error=String(error);failures.push(`${profile.name}: ${String(error)}`);await page.screenshot({path:`${OUT}/${profile.name}-failure.png`,fullPage:true,timeout:5000}).catch(()=>{})}finally{await context.close()}
  }
}finally{await browser.close();await fs.writeFile(`${OUT}/report.json`,JSON.stringify({capturedAt:new Date().toISOString(),base:BASE,head:process.env.K11520_SOURCE_SHA||process.env.GITHUB_SHA||null,sourceChecks,reports,failures},null,2))}
assert.deepEqual(failures,[],'Responsive product failures; inspect screenshots and report.json');
console.log('11520 real-entry responsive/cold-warm/realistic-quotes/real-hit-targets/bounded-thumbs/order-preview/utility-cycles PASS');
