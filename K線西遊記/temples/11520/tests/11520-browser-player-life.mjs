/* KGEN_META
STATUS: CANDIDATE
PURPOSE: Real Chromium Player Life isolation, persistence and mobile visual evidence.
AUTHORITY: Synthetic local browser profiles only; no cloud, real wallet or chain writes.
*/
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {Wallet, getBytes} from 'ethers';

// Native adapter diagnostics are isolated from all ordinary wallet/game fixtures.
if(process.argv.includes('--native-idb-only')){
  if(process.env.K11520_PLAYER_QA_VIEW||process.env.K11520_PLAYER_QA_SCENARIO||process.env.K11520_V29_ONLY)throw new Error('NATIVE_IDB_MODE_MUST_BE_ISOLATED');
  await runNativeIdbDiagnostics();
}else{
const base=process.env.K11520_BASE_URL||'http://127.0.0.1:4173';
const entry=base+'/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html';
const out='artifacts/11520-player-life-qa';
await fs.mkdir(out,{recursive:true});
// Disposable signatures are generated in memory. No private key is printed,
// persisted, exported or used against a public network.
const walletA=Wallet.createRandom(),walletB=Wallet.createRandom();
const startedAt=Date.now();
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const trackedDirty=Boolean(execFileSync('git',['status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim());
const report={head,ciHead:process.env.GITHUB_SHA||null,sourceState:trackedDirty?'HEAD_PLUS_UNCOMMITTED_TRACKED_CHANGES':'CLEAN_TRACKED_HEAD',selection:{viewport:process.env.K11520_PLAYER_QA_VIEW||'BOTH',storageScenario:process.env.K11520_PLAYER_QA_SCENARIO||'ALL'},scope:'LOCAL_UNTRUSTED_GAME_DATA',functional:'RUNNING',visual:'SCREENSHOTS_REQUIRE_DIRECT_REVIEW',profiles:[],failures:[]};
const browser=await chromium.launch({headless:true});
const snap=page=>page.evaluate(()=>globalThis.__K11520_PLAYER_LIFE__.snapshot());

async function prepare(context,{storageFailure=false}={}){
  await context.route('**/docs/K11520_BSC_TESTNET_DEPLOYMENT_MANIFEST.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:'PREPARED_NOT_DEPLOYED',chainId:97,testOnly:true})}));
  let sequence=0;
  await context.route('https://data-api.binance.vision/**',route=>{
    const u=new URL(route.request().url()),prices={BTCUSDT:100000,ETHUSDT:4000,BNBUSDT:600};
    const body=u.pathname.endsWith('/aggTrades')?[{p:String(prices[u.searchParams.get('symbol')]),T:Date.now(),a:++sequence}]:Object.entries(prices).map(([symbol,price])=>({symbol,price:String(price)}));
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  await context.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',async route=>{
    const prefix='https://cdn.jsdelivr.net/npm/three@0.180.0/';
    let body=await fs.readFile('node_modules/three/'+route.request().url().slice(prefix.length),'utf8');
    body=body.replaceAll("from 'three'",`from '${prefix}build/three.module.js'`).replaceAll('from "three"',`from "${prefix}build/three.module.js"`);
    await route.fulfill({status:200,contentType:'text/javascript',body});
  });
  await context.exposeFunction('__signPlayerLifeFixture',async(message,address)=>{
    const wallet=[walletA,walletB].find(w=>w.address.toLowerCase()===address.toLowerCase());
    assert.ok(wallet,'only ephemeral fixture identities may sign');
    return wallet.signMessage(message.startsWith('0x')?getBytes(message):message);
  });
  await context.addInitScript(({addressA,addressB,storageFailure})=>{
    const listeners=new Map();
    const fixture={account:null,addressA,addressB,calls:[],sensorCalls:[],reject:false,spoof:false,switchWhileSigning:false,emit(name,value){for(const fn of listeners.get(name)||[])fn(value)}};
    globalThis.__playerLifeWalletFixture=fixture;
    if(navigator.geolocation){for(const method of ['getCurrentPosition','watchPosition'])navigator.geolocation[method]=()=>{fixture.sensorCalls.push(method);throw new Error('GPS_NOT_AUTHORIZED_IN_PLAYER_LIFE_QA')}}
    globalThis.ethereum={on:(name,fn)=>{if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn)},removeListener:(name,fn)=>listeners.get(name)?.delete(fn),request:async({method,params=[]})=>{
      fixture.calls.push(method);
      if(method==='eth_accounts')return fixture.account?[fixture.account]:[];
      if(method==='eth_requestAccounts'){if(fixture.reject)throw Object.assign(new Error('Rejected fixture'),{code:4001});fixture.account??=addressA;return [fixture.account]}
      if(method==='eth_chainId')return '0x38';
      if(method==='eth_getBalance')return '0x0';
      if(method==='eth_call')return '0x'+'0'.repeat(64);
      if(method==='personal_sign'){
        if(fixture.reject)throw Object.assign(new Error('Rejected fixture'),{code:4001});
        const message=params.find(x=>x!==fixture.account),address=fixture.spoof?addressB:fixture.account;
        const signature=await globalThis.__signPlayerLifeFixture(message,address);
        if(fixture.switchWhileSigning){fixture.account=addressB;fixture.emit('accountsChanged',[addressB]);await new Promise(resolve=>setTimeout(resolve,100))}
        return signature;
      }
      throw new Error('FORBIDDEN_WALLET_METHOD_'+method);
    }};
    if(storageFailure){for(const method of storageFailure==='QUOTA_EXCEEDED'?['setItem']:['getItem','setItem','removeItem'])Storage.prototype[method]=function(){const error=new DOMException('QA storage denied',storageFailure==='QUOTA_EXCEEDED'?'QuotaExceededError':'SecurityError');error.stack=new Error('QA storage denied: '+method).stack;throw error}}
  },{addressA:walletA.address,addressB:walletB.address,storageFailure});
}
async function boot(page){
  page.setDefaultTimeout(15000);
  page.on('dialog',dialog=>dialog.accept());
  await page.goto(entry,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>globalThis.__K11520_PLAYER_LIFE__?.snapshot?.().player,{timeout:45000});
  // Returning-player intro can auto-dismiss between locator reads. A missing
  // button is fine only after its owning intro really became hidden.
  if(await page.locator('#enter11520').isVisible())try{await page.locator('#enter11520').click({timeout:2000})}catch(error){if(await page.locator('#intro11520').isVisible())throw error}
  await page.locator('#intro11520').waitFor({state:'hidden'});
  await page.locator('#charState').filter({hasText:/READY|FALLBACK/}).waitFor({state:'attached',timeout:45000});
}
async function openLife(page){
  if(await page.locator('#sheet').evaluate(el=>el.classList.contains('open')))await page.locator('#sheetClose').click();
  if(!await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
  if(!await page.locator('#playerLifeOpen').isVisible())await page.locator('#gameModeToggle').click();
  await page.locator('#playerLifeOpen').click();
  await page.locator('#playerLifeName').waitFor({state:'visible'});
}
async function reachable(page,selector){
  const el=page.locator(selector);await el.scrollIntoViewIfNeeded();
  const box=await el.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {x:r.x,y:r.y,w:r.width,h:r.height,inViewport:r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,pointer:hit===el||el.contains(hit)}});
  assert.ok(box.inViewport,selector+' must remain in viewport');assert.ok(box.pointer,selector+' pointer interception');assert.ok(box.h>=44,selector+' needs44px target');
  return box;
}
async function shot(page,tag){await page.screenshot({path:out+'/'+tag+'.png'});}
async function modalLayout(page){return page.evaluate(()=>({viewport:{width:innerWidth,height:innerHeight},visibility:document.visibilityState,layout:['#sheet','#sheetBody','#sheet .sheetHead','#playerLifePanel','#playerLifeNew'].map(selector=>{const el=document.querySelector(selector);if(!el)return {selector};const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {selector,x:r.x,y:r.y,width:r.width,height:r.height,scrollTop:el.scrollTop,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,display:s.display,visibility:s.visibility,contentVisibility:s.contentVisibility,overflow:s.overflow,transform:s.transform,cssHeight:s.height,maxHeight:s.maxHeight,detailsOpen:el.closest('details')?.open}})}))}
async function reloadAction(page,selector){
  if(selector==='#playerLifeNew'){report.focusDiagnostics??=[];report.focusDiagnostics.push({stage:'before-foreground',state:await modalLayout(page)})}
  await page.bringToFront();
  if(selector==='#playerLifeNew')report.focusDiagnostics.push({stage:'after-foreground',state:await modalLayout(page)});
  await reachable(page,selector);
  if(selector==='#playerLifeNew')report.focusDiagnostics.push({stage:'after-scroll',state:await modalLayout(page)});
  await Promise.all([page.waitForEvent('domcontentloaded',{timeout:30000}),page.locator(selector).click()]);
  await page.waitForFunction(()=>globalThis.__K11520_PLAYER_LIFE__?.snapshot?.().player&&globalThis.K11520Backpack?.get&&globalThis.__K11520_SIMULATION_EXCHANGE__);
}
async function expandDetails(page,selector){const details=page.locator(selector).locator('xpath=ancestor::details[1]');if(!await details.evaluate(el=>el.open))await details.locator('summary').click();}
async function closePanels(page){
  if(await page.locator('#sheet').evaluate(el=>el.classList.contains('open')))await page.locator('#sheetClose').click();
  if(await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
}
async function killFirstMonster(page){
  await closePanels(page);
  await page.locator('#cNumericInput').fill('0');await page.locator('#cNumericInput').press('Enter');
  const joy=await page.locator('#joy').boundingBox(),x=joy.x+joy.width/2,y=joy.y+joy.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y-40,{steps:5});
  try{await page.waitForFunction(()=>__K11520_KSPACE_COMBAT__?.distance<2,null,{timeout:15000})}finally{await page.mouse.up()}
  const before=(await snap(page)).player.xp;
  for(let i=0;i<30&&(await snap(page)).player.xp===before;i++){await pursueMovingEncounter(page);await page.locator('#attack').click();await page.waitForTimeout(400)}
  const after=await snap(page);assert.ok(after.player.xp>before,'real monster interaction must grant canonical XP');assert.equal(after.player.inventory.ownerPlayerId,after.player.playerId);assert.ok(await page.evaluate(()=>K11520Backpack.get().items.length>0),'loot appears in the single scoped backpack');
  return after;
}

// V2.9: all combat below uses actual controls. Only the explicitly named Boss
// profile is seeded through validated events; it is not reported as earned play.
async function audioProbe(context){await context.addInitScript(()=>{
  const Real=window.AudioContext||window.webkitAudioContext,connect=AudioNode.prototype.connect;
  window.__v29Contexts=[];window.__v29Probes=[];
  AudioNode.prototype.connect=function(destination,...args){const result=connect.call(this,destination,...args);if(destination===this.context.destination){const analyser=this.context.createAnalyser();connect.call(this,analyser);__v29Probes.push(analyser)}return result};
  window.AudioContext=class extends Real{constructor(...args){super(...args);__v29Contexts.push(this)}};window.webkitAudioContext=window.AudioContext;
})}
async function audioState(page){return page.evaluate(async()=>{const {getKaiosAudio}=await import('../../../assets/kaios-audio.mjs');return getKaiosAudio().snapshot()})}
async function signal(page){return page.evaluate(async()=>{let peak=0,rms=0;for(let i=0;i<16;i++){for(const probe of __v29Probes){const values=new Float32Array(probe.fftSize);probe.getFloatTimeDomainData(values);let sum=0;for(const v of values){peak=Math.max(peak,Math.abs(v));sum+=v*v}rms=Math.max(rms,Math.sqrt(sum/values.length))}await new Promise(r=>setTimeout(r,90))}return {peak,rms}})}
async function approachEncounter(page){
  await closePanels(page);await page.locator('#cNumericInput').fill('0');await page.locator('#cNumericInput').press('Enter');
  const before=await page.evaluate(()=>({distance:__K11520_KSPACE_COMBAT__.distance,xyz:{...__K11520_WORLD_COORDS__.physical}}));
  const joy=await page.locator('#joy').boundingBox(),x=joy.x+joy.width/2,y=joy.y+joy.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y-40,{steps:6});
  try{await page.waitForFunction(()=>__K11520_KSPACE_COMBAT__.distance<1.9,null,{timeout:15000})}finally{await page.mouse.up()}
  const after=await page.evaluate(()=>({distance:__K11520_KSPACE_COMBAT__.distance,xyz:{...__K11520_WORLD_COORDS__.physical}}));
  assert(after.distance<2);assert(after.xyz.z>before.xyz.z,'real joystick must move forward, not teleport target');return {before,after};
}
async function selectEncounterUI(page,id){
  await openLife(page);const button=page.locator(`[data-journey-encounter="${id}"]`);await expandDetails(page,`[data-journey-encounter="${id}"]`);assert.equal(await button.isEnabled(),true,id+' unlocked');await button.scrollIntoViewIfNeeded();await button.click();
  await page.waitForFunction(expected=>__K11520_KSPACE_COMBAT__?.target?.profileId===expected,id);
}
async function pursueMovingEncounter(page){
  const state=await page.evaluate(()=>__K11520_KSPACE_COMBAT__);
  if(state.target.state==='DEAD'||state.distance<=1.2||await page.locator('#journeyRecover').isVisible())return;
  // Roaming lives are no longer stationary. Use the existing physical joystick,
  // not a teleport/frozen target or wider attack radius. Keep all strike limits.
  const joy=await page.locator('#joy').boundingBox(),x=joy.x+joy.width/2,y=joy.y+joy.height/2;
  const d=Math.hypot(state.relative.x,state.relative.z)||1;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+state.relative.x/d*35,y-state.relative.z/d*35,{steps:4});
  try{await page.waitForFunction(()=>__K11520_KSPACE_COMBAT__.distance<.8||document.querySelector('#journeyRecover')?.getBoundingClientRect().width>0,null,{timeout:5000})}finally{await page.mouse.up()}
}
async function defeatUsingSlash(page,{tag,onAttack,recoveryEvidence=[],attackTrace=[]}={}){
  for(let i=0;i<55;i++){
    if(await page.evaluate(()=>__K11520_KSPACE_COMBAT__?.target?.state==='DEAD'))break;
    await pursueMovingEncounter(page);
    await page.locator('#attack').click();
    attackTrace.push(await page.evaluate(()=>{const s=__K11520_KSPACE_COMBAT__;return {distance:s.distance,hp:s.target.hp,result:s.lastResult}}));
    await page.waitForTimeout(380);
    if(await page.locator('#journeyRecover').isVisible()){
      const before=await snap(page),targetHp=await page.evaluate(()=>__K11520_KSPACE_COMBAT__.target.hp);
      await page.locator('#journeyRecover').click();await page.locator('#sheet').waitFor({state:'hidden'});assert.equal((await snap(page)).player.xp,before.player.xp,'recovery never grants XP');
      assert.equal(await page.evaluate(()=>__K11520_KSPACE_COMBAT__.target.hp),targetHp,'recovery cannot damage Boss');
      recoveryEvidence.push({xpUnchanged:true,bossHpUnchanged:true,approach:await approachEncounter(page)});
    }
    await onAttack?.(i);
  }
  assert.equal(await page.evaluate(()=>__K11520_KSPACE_COMBAT__.target.state),'DEAD','actual slash controls must defeat '+tag);
  return snap(page);
}
async function runV29(width,height){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,serviceWorkers:'block'});await prepare(context);await audioProbe(context);
  const page=await context.newPage(),profile={viewport:{width,height},scope:'V29_REAL_GUEST_GAMEPLAY',checks:[],pageErrors:[]};report.profiles.push(profile);page.on('pageerror',e=>profile.pageErrors.push(String(e)));
  try{
    await boot(page);await page.waitForFunction(()=>globalThis.__K11520_GAMEPLAY__);
    const fresh=await snap(page);assert.equal(fresh.player.level,1);assert.equal(fresh.player.engineLevel,1);
    await page.waitForFunction(()=>document.querySelector('#skill').dataset.gameplayUnlocked==='false');
    assert.equal(await page.locator('#tradeSword').getAttribute('data-gameplay-unlocked'),'false');
    const originalHp=await page.evaluate(()=>__K11520_KSPACE_COMBAT__.target.hp);await page.locator('#skill').click();
    assert.equal(await page.evaluate(()=>__K11520_KSPACE_COMBAT__.target.hp),originalHp,'locked skill cannot damage target');
    await shot(page,`${width}x${height}-v29-fresh-locked-skill`);profile.checks.push('FRESH_LV1_SKILL_LOCK');
    profile.firstApproach=await approachEncounter(page);assert(Math.abs(profile.firstApproach.before.distance-7)<1,'first enemy starts approximately7m away');
    const first=await defeatUsingSlash(page,{tag:'fresh guardian'}),xp=first.player.xp,engineXp=first.player.engineXp;
    assert(xp>fresh.player.xp);assert(engineXp>0,'monster combat grants Engine XP without trading');
    const inventory=await page.evaluate(()=>K11520Backpack.get().items);assert(inventory.length>0);assert(inventory.every(i=>['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY'].includes(i.meta.rarity)));
    for(let i=0;i<3;i++)await page.locator('#attack').click();assert.equal((await snap(page)).player.xp,xp,'dead target reward only once');
    await shot(page,`${width}x${height}-v29-first-loot`);profile.checks.push('JOYSTICK_APPROACH_SLASH_KILL_XP_ENGINE_XP_LOOT_ONCE');
    await boot(page);assert.equal((await snap(page)).player.xp,xp);assert.equal((await snap(page)).player.engineXp,engineXp);assert.deepEqual(await page.evaluate(()=>K11520Backpack.get().items),inventory);profile.checks.push('RELOAD_XP_ENGINE_INVENTORY_PERSISTENCE');
    await approachEncounter(page);await defeatUsingSlash(page,{tag:'second guardian'});await page.waitForFunction(()=>document.querySelector('#skill').dataset.gameplayUnlocked==='true');assert((await snap(page)).player.level>=2);profile.checks.push('REAL_LEVEL_UP_UNLOCKS_SECOND_SKILL');
    await openLife(page);await page.locator('#ga600Progress').scrollIntoViewIfNeeded();assert.match(await page.locator('#ga600Progress').innerText(),/GA600.*ENGINE Lv/);await shot(page,`${width}x${height}-v29-ga600-progression`);
    await page.locator('#dailyJourney').scrollIntoViewIfNeeded();assert.equal(await page.locator('#dailyJourneyClaim').isEnabled(),false);await shot(page,`${width}x${height}-v29-daily-journey`);profile.checks.push('CONTEXTUAL_PROGRESSION_GA600_DAILY_NO_FINANCIAL_AUTHORITY');
    assert.equal(await page.evaluate(()=>__K11520_GAMEPLAY__.snapshot().realTradingCapUnchanged),true);assert.deepEqual(profile.pageErrors,[]);
  }catch(error){await shot(page,`${width}x${height}-v29-fresh-failure`).catch(()=>{});profile.failure=String(error.stack||error);throw error}finally{await context.close()}

  const bossContext=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,serviceWorkers:'block'});await prepare(bossContext);await audioProbe(bossContext);const bossPage=await bossContext.newPage();
  const boss={viewport:{width,height},scope:'V29_BOSS_CANONICAL_EVENT_SEEDED_FIXTURE_NOT_EARNED_PROGRESSION',checks:[],phases:[],pageErrors:[]};report.profiles.push(boss);bossPage.on('pageerror',e=>boss.pageErrors.push(String(e)));
  try{
    await bossPage.goto(base+'/',{waitUntil:'domcontentloaded'});
    boss.fixture=await bossPage.evaluate(async moduleUrl=>{
      const {createLocalPlayerStore}=await import(moduleUrl);
      const store=createLocalPlayerStore();store.createPlayer();
      for(let i=0;i<40;i++)store.recordEvent({id:'qa-boss-fixture-kill-'+i,type:'MONSTER_KILL'});
      for(let i=0;i<3;i++)store.recordEvent({id:'qa-boss-fixture-practice-'+i,type:'SIX_PHASE_PRACTICE'});
      for(let i=0;i<10;i++)store.recordExplorationStep();
      const p=store.snapshot().player;return {method:'VALIDATED_CANONICAL_EVENTS_BEFORE_GAME_BOOT',level:p.level,engineLevel:p.engineLevel,xp:p.xp,engineXp:p.engineXp,daily:store.gameplayProfile().daily};
    },new URL('runtime/player-life-runtime.mjs',entry).href);assert.equal(boss.fixture.level,5);assert.equal(boss.fixture.engineLevel,2);
    await boot(bossPage);await bossPage.waitForFunction(()=>globalThis.__K11520_GAMEPLAY__);
    // Explicitly seeded eligible daily fixture; claim/reload itself is real UI.
    await openLife(bossPage);await bossPage.locator('#dailyJourneyClaim').scrollIntoViewIfNeeded();assert.equal(await bossPage.locator('#dailyJourneyClaim').isEnabled(),true);
    const dailyBefore=await snap(bossPage);await bossPage.locator('#dailyJourneyClaim').click();
    const dailyClaimed=await snap(bossPage);assert.equal(dailyClaimed.player.xp,dailyBefore.player.xp+25);assert.equal(dailyClaimed.player.engineXp,dailyBefore.player.engineXp+20);assert.equal(dailyClaimed.player.events.filter(e=>e.type==='DAILY_JOURNEY').length,1);
    // The button remains usable to retry item delivery after storage/capacity
    // failures. A retry must not mint a second XP event or another item.
    assert.equal(await bossPage.locator('#dailyJourneyClaim').isEnabled(),true);const dailyItems=await bossPage.evaluate(()=>K11520Backpack.get().items.filter(i=>i.itemId.startsWith('DAILY_JOURNEY:')));assert.equal(dailyItems.length,1);assert.equal(dailyItems[0].qty,1);
    await bossPage.locator('#dailyJourneyClaim').click();assert.equal((await snap(bossPage)).player.xp,dailyClaimed.player.xp);assert.equal((await snap(bossPage)).player.engineXp,dailyClaimed.player.engineXp);assert.match(await bossPage.locator('#toast').innerText(),/不重複領取/);assert.deepEqual(await bossPage.evaluate(()=>K11520Backpack.get().items.filter(i=>i.itemId.startsWith('DAILY_JOURNEY:'))),dailyItems);
    await bossPage.locator('#dailyJourney').scrollIntoViewIfNeeded();await shot(bossPage,`${width}x${height}-v29-daily-claimed-fixture`);
    await boot(bossPage);assert.equal((await snap(bossPage)).player.xp,dailyClaimed.player.xp);assert.equal((await snap(bossPage)).player.engineXp,dailyClaimed.player.engineXp);
    await openLife(bossPage);await bossPage.locator('#dailyJourneyClaim').scrollIntoViewIfNeeded();assert.equal(await bossPage.locator('#dailyJourneyClaim').isEnabled(),true);await bossPage.locator('#dailyJourneyClaim').click();assert.equal((await snap(bossPage)).player.xp,dailyClaimed.player.xp);assert.equal((await snap(bossPage)).player.engineXp,dailyClaimed.player.engineXp);assert.equal((await snap(bossPage)).player.events.filter(e=>e.type==='DAILY_JOURNEY').length,1);assert.deepEqual(await bossPage.evaluate(()=>K11520Backpack.get().items.filter(i=>i.itemId.startsWith('DAILY_JOURNEY:'))),dailyItems);
    boss.daily={fixture:'ELIGIBILITY_SEEDED_THROUGH_VALIDATED_EVENTS',uiClaim:'PASS',xpDelta:25,engineXpDelta:20,itemQuantity:1,reload:'PASS',duplicateClaimControl:'ENABLED_RETRY_WITH_ONCE_ONLY_LEDGER'};boss.checks.push('DAILY_FIXTURE_REAL_UI_CLAIM_ONCE_AND_RELOAD');
    await selectEncounterUI(bossPage,'MARKET_BOSS');
    await shot(bossPage,`${width}x${height}-v29-boss-spawn`);await approachEncounter(bossPage);
    await bossPage.waitForFunction(()=>__K11520_GAMEPLAY__.snapshot().music==='BOSS');
    let a=await audioState(bossPage);if(a.needsGesture||!a.musicEnabled||a.settings.muted){if(!await bossPage.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await bossPage.locator('#k11520UtilityMaster').click();await bossPage.locator('#bgmButton').click();await closePanels(bossPage);await bossPage.waitForTimeout(400)}
    a=await audioState(bossPage);assert.equal(a.contextState,'running');assert.equal(a.activeMusicLayers,1);boss.signal=await signal(bossPage);assert(boss.signal.rms>.001&&boss.signal.peak<.95,'Boss BGM must have nonzero unclipped digital signal');
    const before=await snap(bossPage);boss.recoveries=[];boss.attackTrace=[];const defeated=await defeatUsingSlash(bossPage,{tag:'MARKET_BOSS',recoveryEvidence:boss.recoveries,attackTrace:boss.attackTrace,onAttack:async()=>{
      const t=await bossPage.evaluate(()=>__K11520_KSPACE_COMBAT__.target);if(!boss.phases.includes(t.phase)){boss.phases.push(t.phase);await shot(bossPage,`${width}x${height}-v29-boss-phase-${t.phase}`)}
    }});
    assert(boss.phases.includes(2)&&boss.phases.includes(3),'actual damage crosses Boss phases');assert(defeated.player.xp>before.player.xp);assert.equal(defeated.player.events.filter(e=>e.type==='BOSS_DEFEAT').length,1);
    for(let i=0;i<3;i++)await bossPage.locator('#attack').click();assert.equal((await snap(bossPage)).player.xp,defeated.player.xp,'Boss reward once-only');
    boss.events=await bossPage.evaluate(()=>__K11520_WORLD_AUDIO__.snapshot().events.map(e=>e.event));for(const e of ['BOSS_SPAWN','BOSS_PHASE_CHANGE','BOSS_RAGE','BOSS_LOW_HP','BOSS_DEFEAT'])assert(boss.events.includes(e),e+' feedback from actual combat');
    boss.victoryToast=await bossPage.evaluate(()=>{
      const toast=document.querySelector('#toast'),guide=document.querySelector('#k11520MonsterGuide');
      const a=toast.getBoundingClientRect(),b=guide.getBoundingClientRect();
      return {visible:toast.classList.contains('show')&&a.width>0&&a.height>0,toast:{x:a.x,y:a.y,width:a.width,height:a.height},monsterGuide:{x:b.x,y:b.y,width:b.width,height:b.height},overlap:Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top)};
    });
    assert.equal(boss.victoryToast.visible,true,'actual post-defeat toast must be visible for layout QA');assert.equal(boss.victoryToast.overlap,false,'victory feedback must not overlap compact monster HUD');
    const toastBox=boss.victoryToast.toast;assert.ok(toastBox.x>=0&&toastBox.y>=0&&toastBox.x+toastBox.width<=width&&toastBox.y+toastBox.height<=height,'actual victory feedback must remain entirely inside the viewport');
    await shot(bossPage,`${width}x${height}-v29-boss-victory`);boss.checks.push('BOSS_SELECTED_THROUGH_CONTEXT_UI','REAL_BOSS_PHASE_RAGE_DEFEAT','ONCE_ONLY_REWARD','NONZERO_BOSS_PCM','VICTORY_TOAST_NO_MONSTER_HUD_OVERLAP');
    // An automatic next encounter can legitimately create a new cue while the
    // old one expires. Verify the specific node's lifetime and bounded count.
    await bossPage.evaluate(()=>{globalThis.__v29LastFx=document.querySelector('#journeyEventFx')});
    await bossPage.waitForFunction(()=>!globalThis.__v29LastFx?.isConnected,null,{timeout:2500});assert((await bossPage.locator('#journeyEventFx').count())<=1,'at most one transient world cue');
    if(!await bossPage.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await bossPage.locator('#k11520UtilityMaster').click();
    await bossPage.locator('#bgmButton').click();await bossPage.locator('.kaios-audio-panel').waitFor({state:'visible'});await bossPage.locator('[data-audio-action=mute]').click();await bossPage.getByRole('button',{name:'關閉設定',exact:true}).click();await closePanels(bossPage);
    await bossPage.locator('#attack').click();await bossPage.waitForTimeout(200);boss.muted=await signal(bossPage);assert.equal(boss.muted.peak,0);assert.equal((await audioState(bossPage)).activeMusicLayers,0);assert.equal(await bossPage.evaluate(()=>__v29Contexts.length),1);boss.checks.push('MUTE_BLOCKS_AUTOMATIC_AUDIO','ONE_CONTEXT_ONE_BGM','FX_CLEANUP');
    await boot(bossPage);assert.equal((await snap(bossPage)).player.xp,defeated.player.xp);assert.equal((await snap(bossPage)).player.engineXp,defeated.player.engineXp);boss.checks.push('BOSS_PROGRESS_RELOAD');assert.deepEqual(boss.pageErrors,[]);
  }catch(error){await shot(bossPage,`${width}x${height}-v29-boss-failure`).catch(()=>{});boss.failure=String(error.stack||error);throw error}finally{await bossContext.close()}
}

try{
  for(const [width,height] of [[390,844],[844,390]].filter(([w])=>!process.env.K11520_PLAYER_QA_SCENARIO&&(!process.env.K11520_PLAYER_QA_VIEW||String(w)===process.env.K11520_PLAYER_QA_VIEW)))await runV29(width,height);
  for(const [width,height] of [[390,844],[844,390]].filter(([w])=>!process.env.K11520_V29_ONLY&&!process.env.K11520_PLAYER_QA_SCENARIO&&(!process.env.K11520_PLAYER_QA_VIEW||String(w)===process.env.K11520_PLAYER_QA_VIEW))){
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,acceptDownloads:true,serviceWorkers:'block'});
    await prepare(context);const page=await context.newPage();
    const profile={viewport:{width,height},checks:[],pageErrors:[]};report.profiles.push(profile);page.on('pageerror',error=>profile.pageErrors.push(String(error)));
    try{
      await boot(page);await shot(page,`${width}x${height}-new-guest`);
      const initial=await snap(page);assert.match(initial.player.playerId,/^KAIOS-P-/);
      assert.equal(await page.evaluate(()=>__playerLifeWalletFixture.calls.includes('eth_requestAccounts')),false,'guest starts without wallet prompt');
      await openLife(page);await reachable(page,'#playerLifeSave');
      assert.equal(await page.locator('#playerLifePanel input[type="date"],#playerLifePanel input[type="password"]').count(),0,'profile never requests real birthday or secrets');
      await page.locator('#playerLifeName').fill('取經測試員');await page.locator('#playerLifeAppearance').selectOption('STARGAZER');await page.locator('#playerLifePronoun').fill('旅人');await page.locator('#playerLifeSave').click();
      await page.waitForFunction(()=>__K11520_PLAYER_LIFE__.snapshot().player.displayName==='取經測試員');
      assert.equal((await snap(page)).player.characterAppearance,'STARGAZER');assert.equal((await snap(page)).player.ageRange,null);
      await shot(page,`${width}x${height}-profile`);profile.checks.push('NEW_GUEST_PROFILE');
      // Exercise the actual two legacy cleanup owners deterministically. Neither
      // may classify an aria-labelled profile or its contextual action as a HUD bag.
      assert.equal(await page.locator('#playerLifePanel').isVisible(),true);
      await page.evaluate(async()=>{const fixes=await import('./runtime/game-ui-product-fixes.mjs'),ux=await import('./runtime/human-ux-runtime.mjs');fixes.placeOnlyRealBag();ux.normalizeBackpack()});
      assert.equal(await page.locator('#playerLifePanel').isVisible(),true,'legacy cleanup must not hide Player Life');
      assert.equal(await page.locator('#playerLifeBag').evaluate(el=>Boolean(el.closest('#playerLifePanel'))),true,'contextual backpack action stays in its profile');
      assert.equal(await page.locator('body > #backpackButton').count(),1,'exactly one canonical floating backpack');
      await reachable(page,'#playerLifeBag');await page.locator('#playerLifeBag').click();await page.locator('#backpackPanel').waitFor({state:'visible'});
      if(!await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
      await page.locator('#backpackButton').click();await page.locator('#backpackPanel').waitFor({state:'hidden'});profile.checks.push('LEGACY_CLEANUP_PRESERVES_PROFILE_AND_CONTEXTUAL_BACKPACK');
      const progressed=await killFirstMonster(page);await shot(page,`${width}x${height}-progression`);profile.checks.push('REAL_COMBAT_XP_INVENTORY');
      await openLife(page);await reachable(page,'#playerLifeBuild');await page.locator('#playerLifeBuild').click();
      await page.waitForFunction(()=>__K11520_PLAYER_LIFE__.snapshot().home.houseLevel===1);
      let current=await snap(page);assert.equal(current.home.ownerPlayerId,initial.player.playerId);assert.equal(current.home.stage,'HUT');
      await shot(page,`${width}x${height}-home-built`);profile.checks.push('HOME_OWNERSHIP_BUILD');
      await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>globalThis.__K11520_PLAYER_LIFE__?.snapshot?.().player);
      const restored=await snap(page);assert.equal(restored.player.playerId,initial.player.playerId);assert.equal(restored.player.displayName,'取經測試員');assert.equal(restored.player.xp,progressed.player.xp);assert.equal(restored.player.level,progressed.player.level);assert.equal(restored.home.houseLevel,1);profile.checks.push('RETURNING_GUEST_RELOAD_XP_HOME');
      // Connect is not binding. A forged signature cannot add a wallet link.
      await closePanels(page);await page.locator('#k11520UtilityMaster').click();await page.locator('#walletToggle').click();await page.locator('#walletConnect').click();
      await page.waitForFunction(()=>document.querySelector('#wAddr').textContent.toLowerCase()===__playerLifeWalletFixture.addressA.toLowerCase());
      await page.locator('#walletToggle').click();await openLife(page);await expandDetails(page,'#playerLifeBind');
      await page.evaluate(()=>{__playerLifeWalletFixture.switchWhileSigning=true});await page.locator('#playerLifeBind').click();
      await page.locator('#playerLifeMessage').filter({hasText:'WALLET_CHANGED'}).waitFor();assert.equal((await snap(page)).player.walletLinks.length,0);
      await page.evaluate(()=>{const f=__playerLifeWalletFixture;f.switchWhileSigning=false;f.account=f.addressA;f.emit('accountsChanged',[f.account])});
      await page.waitForFunction(()=>document.querySelector('#wAddr').textContent.toLowerCase()===__playerLifeWalletFixture.addressA.toLowerCase());profile.checks.push('ASYNC_WALLET_ACCOUNT_RACE_REJECTED');
      await page.evaluate(()=>{__playerLifeWalletFixture.spoof=true});await page.locator('#playerLifeBind').click();
      await page.locator('#playerLifeMessage').filter({hasText:'WALLET_SIGNATURE_MISMATCH'}).waitFor();assert.equal((await snap(page)).player.walletLinks.length,0);
      await page.evaluate(()=>{__playerLifeWalletFixture.spoof=false});await page.locator('#playerLifeBind').click();
      await page.waitForFunction(()=>__K11520_PLAYER_LIFE__.snapshot().player.walletLinks.length===1);
      current=await snap(page);assert.equal(current.player.walletLinks[0].address,walletA.address.toLowerCase());assert.equal(current.player.playerId,initial.player.playerId);
      await expandDetails(page,'#playerLifeBind');await shot(page,`${width}x${height}-wallet-bound`);profile.checks.push('FORGED_SIGNATURE_REJECTED','GESTURE_WALLET_BIND');
      // An account event changes the economic session, never the guest PLAYER_ID.
      await page.evaluate(()=>{const f=__playerLifeWalletFixture;f.account=f.addressB;f.emit('accountsChanged',[f.account])});
      await page.waitForFunction(()=>document.querySelector('#wAddr').textContent.toLowerCase()===__playerLifeWalletFixture.addressB.toLowerCase());
      current=await snap(page);assert.equal(current.player.playerId,initial.player.playerId);assert.equal(current.player.walletLinks.length,1);assert.equal(current.player.walletLinks[0].address,walletA.address.toLowerCase());
      assert.equal(await page.evaluate(()=>__K11520_SIMULATION_EXCHANGE__.snapshot().orders.length),0);assert.deepEqual(await page.evaluate(()=>{const p=__K11520_PRODUCT__.snapshot();return {xp:p.xp,level:p.level}}),{xp:current.player.xp,level:current.player.level});profile.checks.push('ACCOUNT_SWITCH_NO_IMPLICIT_BIND_OR_LEDGER_LEAK');
      await openLife(page);await expandDetails(page,'#playerLifeExport');await page.locator('#playerLifeExport').click();
      const backup=await page.locator('#playerLifeImportText').inputValue(),parsed=JSON.parse(backup);
      assert.equal(parsed.schema,'KAIOS_PLAYER_BACKUP_V1');assert.equal(parsed.player.player.walletLinks.length,0,'backup must not export wallet proof as authority');assert.equal(parsed.player.player.playerId,initial.player.playerId);
      assert.equal(Object.hasOwn(parsed.player.player,'ledger'),false,'player backup excludes KGEN ledger');assert.ok(parsed.backpack.items.length>0,'game backpack accompanies portable candidate profile');
      // A separate browser context models a new device with no prior storage.
      const device=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,serviceWorkers:'block'});await prepare(device);const devicePage=await device.newPage();
      try{
        await boot(devicePage);assert.notEqual((await snap(devicePage)).player.playerId,initial.player.playerId);
        await openLife(devicePage);await expandDetails(devicePage,'#playerLifeImport');await devicePage.locator('#playerLifeImportText').fill(backup);
        await reloadAction(devicePage,'#playerLifeImport');await devicePage.waitForFunction(id=>globalThis.__K11520_PLAYER_LIFE__?.snapshot().player.playerId===id,initial.player.playerId);
        const imported=await snap(devicePage);assert.equal(imported.player.xp,progressed.player.xp);assert.equal(imported.home.houseLevel,1);assert.equal(imported.player.walletLinks.length,0);assert.equal(imported.player.migration,'BACKUP_LOCAL_CANDIDATE');
        assert.deepEqual(await devicePage.evaluate(()=>K11520Backpack.get().items),parsed.backpack.items,'same inventory restored on new device without duplication');
        await openLife(devicePage);await shot(devicePage,`${width}x${height}-new-device-import`);profile.checks.push('NEW_DEVICE_EXPLICIT_LOCAL_BACKUP');
      }catch(error){await shot(devicePage,`${width}x${height}-new-device-failure`).catch(()=>{});throw error}finally{await device.close()}
      await reloadAction(page,'#playerLifeNew');await page.waitForFunction(id=>globalThis.__K11520_PLAYER_LIFE__?.snapshot().player.playerId!==id,initial.player.playerId);
      const second=await snap(page);assert.notEqual(second.home.homePlotId,initial.home.homePlotId);assert.equal(second.home.ownerPlayerId,second.player.playerId);assert.equal(second.player.xp,0);assert.equal(second.player.inventory.ownerPlayerId,second.player.playerId);assert.deepEqual(await page.evaluate(()=>K11520Backpack.get().items),[]);assert.deepEqual(second.player.walletLinks,[]);
      assert.equal(await page.evaluate(()=>__K11520_SIMULATION_EXCHANGE__.snapshot().orders.length),0);await openLife(page);await page.locator('#playerLifeName').fill('第二位旅人');await page.locator('#playerLifeSave').click();
      await shot(page,`${width}x${height}-second-player`);profile.checks.push('TWO_PLAYER_HOME_INVENTORY_XP_LEDGER_ISOLATION');
      await closePanels(page);await page.locator('#k11520UtilityMaster').click();await page.locator('#walletToggle').click();await page.locator('#walletConnect').click();
      await page.waitForFunction(()=>document.querySelector('#wAddr').textContent.toLowerCase()===__playerLifeWalletFixture.addressA.toLowerCase());await page.locator('#walletToggle').click();
      await openLife(page);await expandDetails(page,'#playerLifeBind');await page.locator('#playerLifeBind').click();await page.locator('#playerLifeMessage').filter({hasText:'DUPLICATE_WALLET_BINDING'}).waitFor();assert.equal((await snap(page)).player.walletLinks.length,0);profile.checks.push('CROSS_PLAYER_DUPLICATE_WALLET_REJECTED');
      await expandDetails(page,'#playerLifePlayers');await page.locator('#playerLifePlayers').selectOption(initial.player.playerId);await reloadAction(page,'#playerLifeSwitch');
      await page.waitForFunction(id=>globalThis.__K11520_PLAYER_LIFE__?.snapshot().player.playerId===id,initial.player.playerId);
      assert.equal((await snap(page)).player.displayName,'取經測試員');assert.equal((await snap(page)).home.houseLevel,1);assert.deepEqual(await page.evaluate(()=>{const p=__K11520_PRODUCT__.snapshot();return {xp:p.xp,level:p.level}}),{xp:progressed.player.xp,level:progressed.player.level});profile.checks.push('EXPLICIT_LOCAL_PROFILE_SWITCH');
      await openLife(page);await context.setOffline(true);await page.locator('#playerLifeName').fill('離線取經測試員');await page.locator('#playerLifeSave').click();assert.equal((await snap(page)).player.displayName,'離線取經測試員');
      await shot(page,`${width}x${height}-offline-save`);await context.setOffline(false);profile.checks.push('OFFLINE_IN_SESSION_LOCAL_SAVE');
      await expandDetails(page,'#playerLifeConsent');await page.locator('#playerLifeConsent').click();assert.deepEqual((await snap(page)).player.privacyConsent,{location:false,motion:false,analytics:false});profile.checks.push('CONSENT_REVOCATION_NO_SENSOR_REQUEST');
      await openLife(page);await reachable(page,'#playerLifeHomeNav');await page.locator('#playerLifeHomeNav').click();
      await page.waitForFunction(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__?.active);
      await page.waitForFunction(()=>{const h=__K11520_PLAYER_LIFE__.snapshot().home.xyz,p=__K11520_WORLD_COORDS__.physical;return Math.hypot(h.x-p.x,h.y-p.y,h.z-2.2-p.z)<.8&&!__K11520_XYZ_MAP_NAVIGATION__.active},null,{timeout:20000});
      // MINIMAL hides telemetry, not the loaded character. Assert readiness
      // text in the attached node without requiring a diagnostic HUD to show.
      await page.locator('#charState').filter({hasText:/READY|FALLBACK/}).waitFor({state:'attached',timeout:45000});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));profile.homeVisual=await page.evaluate(()=>__K11520_WORLD_SELECTION_PROJECTION__.playerHomeSnapshot());
      await shot(page,`${width}x${height}-home-navigation`);assert.equal(profile.homeVisual.homeScreen.inView,true,'home center must remain visible after navigation');assert.equal(profile.homeVisual.playerScreen.inView,true,'player must remain visible after home navigation');profile.checks.push('REAL_HOME_NAVIGATION');
      const calls=await page.evaluate(()=>__playerLifeWalletFixture.calls);assert.equal(calls.some(m=>!/^(eth_accounts|eth_requestAccounts|eth_chainId|eth_getBalance|eth_call|personal_sign)$/.test(m)),false,'no transaction or approval method allowed');
      assert.deepEqual(await page.evaluate(()=>__playerLifeWalletFixture.sensorCalls),[],'Player Life does not request location');
      assert.deepEqual(profile.pageErrors,[],'Player Life paths must not throw uncaught browser errors');
    }catch(error){profile.failureState=await page.evaluate(()=>({life:globalThis.__K11520_PLAYER_LIFE__?.snapshot(),xyz:globalThis.__K11520_WORLD_COORDS__,nav:globalThis.__K11520_XYZ_MAP_NAVIGATION__,visibility:document.visibilityState,message:document.querySelector('#playerLifeMessage')?.textContent,sheetTitle:document.querySelector('#sheetTitle')?.textContent,sheetChildren:document.querySelector('#sheetBody')?.children.length,layout:['#sheet','#sheetBody','.sheetHead','#playerLifePanel','#playerLifeNew'].map(selector=>{const el=document.querySelector(selector);if(!el)return {selector};const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {selector,x:r.x,y:r.y,width:r.width,height:r.height,scrollTop:el.scrollTop,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,display:s.display,visibility:s.visibility,overflow:s.overflow,transform:s.transform,cssHeight:s.height,maxHeight:s.maxHeight,detailsOpen:el.closest('details')?.open}})})).catch(()=>null);await shot(page,`${width}x${height}-failure`).catch(()=>{});throw error}
    finally{await context.close()}
  }
  for(const scenario of ['CORRUPT_SAVE','STORAGE_UNAVAILABLE','QUOTA_EXCEEDED'].filter(s=>!process.env.K11520_V29_ONLY&&(!process.env.K11520_PLAYER_QA_SCENARIO||s===process.env.K11520_PLAYER_QA_SCENARIO))){
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});await prepare(context,{storageFailure:scenario==='CORRUPT_SAVE'?false:scenario});
    if(scenario==='CORRUPT_SAVE')await context.addInitScript(()=>{localStorage.setItem('KAIOS_PLAYER_LIFE_V1','{"broken":true}')});
    const page=await context.newPage(),errors=[],pageErrors=[];page.on('pageerror',error=>{const value=String(error.stack||error);errors.push(value);pageErrors.push(value)});page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    try{
      await boot(page);const state=await snap(page);assert.equal(state.persistent,false);assert.match(state.status,/CORRUPT_SAVE|STORAGE_UNAVAILABLE|STORAGE_WRITE_FAILED|SESSION_ONLY/);
      if(scenario==='CORRUPT_SAVE')assert.equal(await page.evaluate(()=>localStorage.getItem('KAIOS_PLAYER_LIFE_V1')),'{"broken":true}','corrupt bytes must not be silently overwritten');
      await openLife(page);assert.match(await page.locator('#playerLifeStatus').innerText(),/僅本次記憶體|SESSION_ONLY/);await page.locator('#playerLifeName').fill('暫存旅人');await page.locator('#playerLifeSave').click();assert.equal((await snap(page)).player.displayName,'暫存旅人');
      assert.deepEqual(pageErrors,[],'storage denial must not crash browser modules');await shot(page,'390x844-'+scenario.toLowerCase());report.profiles.push({viewport:{width:390,height:844},checks:[scenario,'VISIBLE_NONPERSISTENT_WARNING','PLAYABLE_MEMORY_FALLBACK']});
    }catch(error){report.failures.push({scenario,errors,state:await page.evaluate(()=>({status:document.querySelector('#charState')?.textContent,life:globalThis.__K11520_PLAYER_LIFE__?.snapshot()})).catch(()=>null)});await shot(page,'390x844-'+scenario.toLowerCase()+'-failure').catch(()=>{});throw error}
    finally{await context.close()}
  }
  report.functional='PASS';console.log('PASS Player Life Chromium checks');
}catch(error){report.functional='FAIL';report.failures.push(String(error.stack||error));throw error}
finally{report.durationSeconds=(Date.now()-startedAt)/1000;await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close()}

} // End unchanged ordinary Player Life harness.

// BEGIN NATIVE PROCESS OBSERVER: pure injected reads, also tested without Chromium.
function createNativeProcessObserver({readFile,parentPid}){
  if(!Number.isSafeInteger(parentPid)||parentPid<=0)throw Error('INVALID_NATIVE_PARENT_PID');
  const stat=async pid=>{
    let raw;try{raw=await readFile(`/proc/${pid}/stat`,'utf8')}catch(error){if(error.code==='ENOENT')return null;throw error}
    const end=raw.lastIndexOf(') '),start=raw.indexOf(' ('),fields=raw.slice(end+2).trim().split(/\s+/);
    if(start<1||end<=start||raw.slice(0,start)!==String(pid)||fields.length<20||!/^\d+$/.test(fields[1])||!Number.isSafeInteger(Number(fields[1]))||!/^\d+$/.test(fields[19]))throw Error('INVALID_NATIVE_PROCESS_STAT');
    return {pid,parentPid:Number(fields[1]),startTicks:fields[19]};
  };
  const same=(a,b)=>Boolean(a&&b&&a.pid===b.pid&&a.startTicks===b.startTicks);
  return {
    async find(profileDir,{allowAbsent=false}={}){
      if(typeof profileDir!=='string'||!profileDir.startsWith('/')||profileDir.includes('\0'))throw Error('INVALID_NATIVE_PROFILE_PATH');
      // Only our own children, never a machine-wide command-line census.
      const raw=await readFile(`/proc/${parentPid}/task/${parentPid}/children`,'utf8');
      if(!/^(?:\d+\s*)*$/.test(raw))throw Error('INVALID_NATIVE_CHILDREN');
      const ids=raw.trim()?raw.trim().split(/\s+/).map(Number):[];
      if(ids.length>128||new Set(ids).size!==ids.length||ids.some(id=>!Number.isSafeInteger(id)||id<=0))throw Error('INVALID_NATIVE_CHILDREN');
      const matches=[];
      for(const pid of ids){
        const before=await stat(pid);if(!before)continue;
        let command;try{command=await readFile(`/proc/${pid}/cmdline`,'utf8')}catch(error){if(error.code==='ENOENT')continue;throw error}
        const args=command.split('\0');
        if(!args.includes('--user-data-dir='+profileDir)||args.some(arg=>arg==='--type'||arg.startsWith('--type=')))continue;
        const after=await stat(pid);
        if(!same(before,after)||after.parentPid!==parentPid||!command.endsWith('\0'))throw Error('UNSTABLE_NATIVE_PROCESS_IDENTITY');
        matches.push(after);
      }
      if(allowAbsent&&matches.length===0)return null;
      if(matches.length!==1)throw Error('NATIVE_BROWSER_PROCESS_NOT_UNIQUE');
      return matches[0];
    },
    async exists(identity){return same(identity,await stat(identity.pid))}
  };
}
// END NATIVE PROCESS OBSERVER.

// BEGIN SYNTHETIC RETAINED NATIVE FIXTURE.
async function seedNativeRetainedFixture({name,source,at,generation}){
  // The same helper is checked with fake-IDB and later invoked in native pages.
  // It is add-only, loopback-harness data preparation, never migration/promotion.
  if(typeof name!=='string'||!/^KAIOS_LOCAL_GAME_TEST:native-retained(?:-[a-z0-9-]{1,40})?$/.test(name))throw Error('SYNTHETIC_RETAINED_DATABASE_REQUIRED');
  if(!Number.isSafeInteger(at)||at<=0||typeof generation!=='string'||!/^[a-f0-9]{32}$/.test(generation)||source?.status!=='READY'||source.integration!=='UNINTEGRATED_DRAFT'||!Array.isArray(source.records)||source.records.some(r=>r.revision===null||r.value===null))throw Error('INVALID_SYNTHETIC_RETAINED_SOURCE');
  const life=__nativeCurrent.life,key='KAIOS_PLAYER_LIFE_V1',input=JSON.parse(JSON.stringify(source));let raw=JSON.stringify(input.records.find(r=>r.ref.domain==='PLAYER_LIFE')?.value);
  const legacy=life.createLocalPlayerStore({storage:{getItem:k=>k===key?raw:null,setItem(k,value){if(k!==key)throw Error('UNEXPECTED_RETAINED_FIXTURE_KEY');raw=value}},now:()=>at});
  if(legacy.activePlayer()?.playerId!==input.activePlayerId||legacy.gameplayProfile().daily.claimed||legacy.gameplayProfile().daily.distanceMeters!==0)throw Error('RETAINED_FIXTURE_BASELINE_NOT_FRESH');
  const day=legacy.gameplayProfile().daily.day,events=[...Array.from({length:3},(_,n)=>({type:'JOURNEY_MONSTER_KILL',id:`native-retained:${day}:kill:${n}`})),{type:'SIX_PHASE_PRACTICE',id:`native-retained:${day}:phase`},...Array.from({length:10},(_,n)=>({type:'EXPLORATION_STEP',id:`explore:${day}:${n+1}`}))];
  legacy.recordEvents(events.slice(0,8));legacy.recordEvents(events.slice(8));if(!legacy.gameplayProfile().daily.ready)throw Error('RETAINED_FIXTURE_NOT_ELIGIBLE');
  const keyFor=ref=>['PLAYER_LIFE','COURIER'].includes(ref.domain)?ref.domain:ref.domain+':'+ref.playerId+(ref.domain==='PRODUCT'?':'+ref.owner:'');
  const rows=Object.fromEntries(input.records.map(r=>[keyFor(r.ref),r.ref.domain==='PLAYER_LIFE'?JSON.parse(raw):r.ref.domain==='BACKPACK'?{revision:r.revision,data:r.value}:r.value]));
  const coverage=['PLAYER_LIFE','BACKPACK','PRODUCT','COURIER'],dailyProtocol={generation:'d'.repeat(32),limits:{operationSlots:256,entryBytes:32768,totalBytes:1048576,protocolBytes:65536,legacyEntries:256},legacyClaims:[],legacyDeliveries:[]};
  const limits={censusKeys:256,operationSlots:32,checkpointBytes:16777216,entryBytes:12582912,totalBytes:33554432,fulfillmentBytes:2097152,headsBytes:65536,captureBytes:67108864},meta={schema:'KAIOS_LOCAL_GAME_RETAINED_DAILY_DRAFT_V1',integration:'UNINTEGRATED_DRAFT',coverage,authorityEpoch:generation,selectionEpoch:input.selectionEpoch,activePlayerId:input.activePlayerId,catalogRevision:0,catalog:input.records.map(r=>({ref:r.ref,presence:'PRESENT'})),legacyUnbound:[],dailyProtocol,retainedProtocol:{generation,targetPlayerId:input.activePlayerId,limits}};
  const hash=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))].map(v=>v.toString(16).padStart(2,'0')).join(''),bytes=(key,value)=>new TextEncoder().encode(JSON.stringify({key,value})).length;
  rows.$authority=meta;rows.$initialized={authorityEpoch:meta.authorityEpoch,coverage,catalogRevision:0,dailyGeneration:dailyProtocol.generation,retainedGeneration:generation};rows['archive:'+meta.authorityEpoch]={kind:'SYNTHETIC_RETAINED_NATIVE_FIXTURE_NOT_MIGRATION',dailyProtocol};rows.$daily={schema:'DAILY_HEAD_V1',generation:dailyProtocol.generation,sequence:0,acceptedCount:0,acceptedBytes:0,pendingCount:0,reservedSlots:0,reservedBytes:0};
  const bagKey='BACKPACK:'+input.activePlayerId,metadata=['$authority','$initialized','archive:'+meta.authorityEpoch],anchorKeys=[...metadata,...meta.catalog.map(e=>keyFor(e.ref)).filter(k=>!['PLAYER_LIFE',bagKey].includes(k))].sort(),anchors=[];
  for(const key of anchorKeys)anchors.push({key,present:true,digest:await hash({present:true,value:rows[key]})});
  const checkpoint={schema:'RETAINED_DAILY_CHECKPOINT_V1',generation,targetPlayerId:input.activePlayerId,life:rows.PLAYER_LIFE,bag:rows[bagKey],daily:rows.$daily,anchors};checkpoint.digest=await hash(checkpoint);rows['$retained-checkpoint']=checkpoint;
  const head={schema:'RETAINED_DAILY_HEAD_V1',generation,sequence:0,checkpointDigest:checkpoint.digest,tipDigest:checkpoint.digest,records:input.records.map(r=>({ref:r.ref,revision:rows[keyFor(r.ref)].revision})),acceptedBytes:bytes('$retained-checkpoint',checkpoint)+metadata.reduce((n,k)=>n+bytes(k,rows[k]),0)+limits.headsBytes,reservedBytes:0,reservedSlots:0};head.digest=await hash(head);rows.$retained=head;
  const store=life.createLocalGameAuthority({indexedDB,crypto,databaseName:name,now:()=>at});let db;
  try{
    await store.openGame();db=await new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
    await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite'),s=tx.objectStore('records');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error('RETAINED_FIXTURE_ABORT'));for(const [key,value] of Object.entries(rows))s.add(value,key)});
    const snapshot=await store.readRetainedDaily();return {scope:'RETAINED_DAILY_DRAFT_V1_SYNTHETIC_DIRECT_IDB_NOT_MIGRATION',name,at,generation,snapshot};
  }finally{db?.close();store.close()}
}
// END SYNTHETIC RETAINED NATIVE FIXTURE.

async function runNativeIdbDiagnostics(){
  const {mkdtemp,rm}=fs,{tmpdir}=await import('node:os'),path=await import('node:path'),{createHash}=await import('node:crypto');
  const out='artifacts/11520-player-life-idb-qa',base=process.env.K11520_BASE_URL||'http://127.0.0.1:4173',origin=new URL(base).origin;
  const root='K線西遊記/temples/11520/',pinned='b513d4e7ca87ebfb5adf5c03b8d2c26ff834b720',dbName='KAIOS_LOCAL_GAME_TEST:native-adapter',dailyDbName='KAIOS_LOCAL_GAME_TEST:native-daily';
  const required=['NATIVE_IDB','CROSS_TAB_STALE_CAS','SIMULTANEOUS_CAS','REFRESH_EXPLICIT_RETRY','SELECTION_EPOCH_ISOLATION','MULTI_RECORD_ABORT','ATOMIC_COURIER_CREDIT','CORRUPT_RECORD_PRESERVATION','FULL_RECORD_ABSENCE_AND_CORRUPTION','REVIEW_CAPTURE_SOURCE_PRESERVATION','PINNED_OLD_WRITES_ISOLATED','DAILY_TYPED_CLAIM_RACE','DAILY_TYPED_FULFILL_ABORT_RETRY','RETAINED_LATEST_RECONSTRUCTION','RETAINED_HISTORY_HOLD','ASYNC_DAILY_UI_ACK_RETRY','ASYNC_DAILY_UI_OWNER_FENCE','CLEAN_BROWSER_RESTART'];
  const digest=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
  const report={schema:'K11520_NATIVE_IDB_DIAGNOSTICS_V3',retainedFixtureScope:'RETAINED_DAILY_DRAFT_V1_SYNTHETIC_DIRECT_IDB_NOT_MIGRATION',asyncUiFixtureScope:'ACTUAL_PLAYER_LIFE_INSTALLER_SYNTHETIC_READONLY_PROJECTION_NOT_PUBLIC_BOOT',dailyFixtureScope:'DAILY_DRAFT_V1_SYNTHETIC_DIRECT_IDB_NOT_MIGRATION',scope:'NATIVE_ADAPTER_DIAGNOSTICS',fixtureSeeding:'SYNTHETIC_DIRECT_IDB_NOT_MIGRATION',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),tree:execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim(),ciHead:process.env.GITHUB_SHA||null,trackedDirty:Boolean(execFileSync('git',['status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim()),functionalQA:'RUNNING',visualQA:'ADAPTER_DIAGNOSTIC_ONLY_NOT_PRODUCT_VISUAL_QA',releaseStatus:'HOLD',wholePlayerLifeP0:'INCOMPLETE',origin,pinnedHead:pinned,startedAt:new Date().toISOString(),cases:required.map(id=>({id,required:true,status:'NOT_RUN'})),diagnostics:[{id:'OLD_PRE_SET_INTERLEAVE',required:false,status:'NOT_EXERCISED'},{id:'BFCACHE',required:false,status:'NOT_EXERCISED'},{id:'REAL_DISK_QUOTA_OR_POWER_LOSS',required:false,status:'NOT_EXERCISED'}],servedSources:[],screenshots:[],blockedRequests:[],pageErrors:[],providerActivity:[],failures:[],limitations:['No production caller, full cutover or migration is exercised.','Clean browser restart is not crash or power-loss proof.','Injected native transaction abort is not physical disk/quota failure.','Diagnostic fixture screenshots do not establish product visual QA.']};
  await fs.mkdir(out,{recursive:true});let context=null,profileDir=null,pageA=null,pageB=null,launches=0,browserProcess=null,pendingLaunch=null,launchGeneration=0,shuttingDown=false,dailyFixtureAt=null,dailyBeforeRestart=null;
  const ownedContexts=new Map();
  const processObserver=createNativeProcessObserver({readFile:fs.readFile,parentPid:process.pid});report.processLaunches=[];
  const checkpoint=()=>fs.writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await checkpoint();
  const bounded=async(promise,label,ms=10000)=>{let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('NATIVE_CASE_TIMEOUT:'+label)),ms)})])}finally{clearTimeout(timer)}};
  const run=async(id,fn)=>{const entry=report.cases.find(c=>c.id===id);entry.status='RUNNING';entry.startedAt=Date.now();await checkpoint();try{entry.evidence=await bounded(fn(),id,25000);entry.status='PASS'}catch(error){entry.status='FAIL';entry.error=String(error.stack||error);throw error}finally{entry.elapsedMs=Date.now()-entry.startedAt;await checkpoint()}};
  const current=new Map(),legacy=new Map();
  async function collect(file,target,old){
    file=path.posix.normalize(file);assert.ok(file.startsWith(root)&&file.endsWith('.mjs')&&!file.includes('..'),'only exact game module sources are eligible');if(target.has(file))return;
    const body=old?execFileSync('git',['show',pinned+':'+file],{encoding:'utf8',maxBuffer:4000000}):await fs.readFile(file,'utf8');target.set(file,body);
    const imports=[...body.matchAll(/\b(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g)]; // Only executed static dependencies; dynamic native roots are explicit above.
    for(const match of imports)if(match[1].startsWith('.'))await collect(path.posix.join(path.posix.dirname(file),match[1]),target,old);
  }
  const fixtureUrl=origin+'/__native_idb_fixture__.html',moduleUrl=(file,old=false)=>origin+(old?'/__pinned_legacy__/':'/')+encodeURI(root+file);
  async function routeContext(ctx){
    await ctx.routeWebSocket('**/*',socket=>{const url=new URL(socket.url());report.blockedRequests.push({url:url.origin+url.pathname,method:'WEBSOCKET'});socket.close({code:1008,reason:'Network forbidden in native adapter diagnostics'})});
    await ctx.route('**/*',async route=>{const request=route.request(),url=new URL(request.url());
      if(url.origin!==origin||request.method()!=='GET'){report.blockedRequests.push({url:url.origin+url.pathname,method:request.method()});return route.abort('blockedbyclient')}
      if(url.pathname==='/__native_idb_fixture__.html')return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Native IDB adapter diagnostic</title><style>body{font:16px system-ui;padding:20px;background:#101820;color:#e6f1f5}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}</style><h1>Native IDB diagnostic</h1><p>Synthetic adapter fixture · production migration and public UI remain unverified.</p><pre id="evidence">Starting</pre><button id="backpackButton" hidden>Fixture guard: no item preview renderer</button>'});
      const old=url.pathname.startsWith('/__pinned_legacy__/'),file=decodeURI(url.pathname.slice(old?'/__pinned_legacy__/'.length:1)),body=(old?legacy:current).get(file);
      if(body!==undefined&&!url.search){const source={version:old?'PINNED_OLD':'CURRENT',path:file,sha256:digest(body)};if(!report.servedSources.some(s=>s.version===source.version&&s.path===file))report.servedSources.push(source);return route.fulfill({status:200,contentType:'text/javascript',body})}
      report.blockedRequests.push({url:url.origin+url.pathname,method:request.method()});return route.abort('blockedbyclient');
    });
    await ctx.addInitScript(()=>{globalThis.__nativeProviderCalls=[];Object.defineProperty(globalThis,'ethereum',{configurable:false,get(){__nativeProviderCalls.push('ethereum');throw Error('PROVIDER_FORBIDDEN_IN_NATIVE_IDB_QA')}});globalThis.__signPlayerLifeFixture=()=>{__nativeProviderCalls.push('signing');throw Error('SIGNER_FORBIDDEN_IN_NATIVE_IDB_QA')}});
  }
  function launch(){
    if(shuttingDown)return Promise.reject(Error('NATIVE_LAUNCH_REVOKED'));
    const generation=launchGeneration;
    const work=(async()=>{
      const ctx=await chromium.launchPersistentContext(profileDir,{headless:true,viewport:{width:390,height:844},serviceWorkers:'block',timeout:20000});
      context=ctx;launches++; // Own cleanup before fallible setup, including a late launch.
      const owned={identity:null,closed:false};owned.closeEvent=new Promise(resolve=>ctx.once('close',()=>{owned.closed=true;resolve()}));ownedContexts.set(ctx,owned);
      if(shuttingDown||generation!==launchGeneration){await closeOwnedContext(ctx);throw Error('NATIVE_LAUNCH_REVOKED')}
      owned.identity=browserProcess=await processObserver.find(profileDir);await routeContext(ctx);
      const probe=await ctx.newPage(),session=await ctx.newCDPSession(probe);let version;
      try{version=await session.send('Browser.getVersion');for(const field of ['product','revision','protocolVersion'])assert.ok(typeof version[field]==='string'&&version[field].length>0,'native browser '+field)}finally{await session.detach();await probe.close()}
      if(shuttingDown||generation!==launchGeneration)throw Error('NATIVE_LAUNCH_REVOKED');
      report.browserVersion=version.product;report.playwrightVersion=JSON.parse(await fs.readFile('node_modules/playwright/package.json','utf8')).version;
      report.processLaunches.push({launch:launches,identity:browserProcess,version:{product:version.product,revision:version.revision,protocolVersion:version.protocolVersion}});return ctx;
    })();
    pendingLaunch=work;work.then(()=>{if(pendingLaunch===work)pendingLaunch=null},()=>{if(pendingLaunch===work)pendingLaunch=null});return work;
  }
  async function closeOwnedContext(ctx,{verifyBefore=false}={}){
    const owned=ownedContexts.get(ctx);assert.ok(owned,'acquired native context required');const identity=owned.identity;
    if(verifyBefore){assert.ok(identity,'acquired native process identity required');assert.equal(await processObserver.exists(identity),true,'browser process must exist before requested close')}
    await bounded(Promise.all([owned.closed?Promise.resolve():ctx.close(),owned.closeEvent]),'persistent-context-close',10000);
    const present=()=>identity?processObserver.exists(identity):processObserver.find(profileDir,{allowAbsent:true}).then(value=>value!==null);
    const deadline=Date.now()+5000;while(await present()){if(Date.now()>=deadline)throw Error('NATIVE_BROWSER_PROCESS_DID_NOT_EXIT');await new Promise(resolve=>setTimeout(resolve,25))}
    assert.equal(owned.closed,true);ownedContexts.delete(ctx);if(context===ctx){context=null;browserProcess=null}return {contextCloseObserved:true,oldProcessAbsent:true,identity};
  }
  async function closeObservedContext(){return closeOwnedContext(context,{verifyBefore:true})}
  async function page(ctx,label){const p=await ctx.newPage();p.setDefaultTimeout(10000);p.on('pageerror',error=>report.pageErrors.push({page:label,error:String(error)}));await p.goto(fixtureUrl+'#'+label,{waitUntil:'domcontentloaded'});return p}
  async function openCurrent(p,name=dbName){return p.evaluate(async({lifeUrl,name})=>{const life=await import(lifeUrl);const store=life.createLocalGameAuthority({indexedDB:globalThis.indexedDB,crypto:globalThis.crypto,databaseName:name});await store.openGame();globalThis.__nativeCurrent={life,store,name};return {factory:Object.prototype.toString.call(indexedDB),secureContext:isSecureContext}}, {lifeUrl:moduleUrl('runtime/player-life-runtime.mjs'),name})}
  const read=p=>p.evaluate(()=>__nativeCurrent.store.readGame());
  async function openDaily(p,at){return p.evaluate(async({name,at})=>{const store=__nativeCurrent.life.createLocalGameAuthority({indexedDB,crypto,databaseName:name,now:()=>at});await store.openGame();globalThis.__nativeDaily={store,at};return at},{name:dailyDbName,at})}
  const readDaily=p=>p.evaluate(()=>__nativeDaily.store.readDaily());
  const expectedDaily=s=>({authorityEpoch:s.authorityEpoch,dailyGeneration:s.daily.generation,selectionEpoch:s.selectionEpoch,catalogRevision:s.catalogRevision,dailySequence:s.daily.sequence,records:s.records.map(({ref,revision})=>({ref,revision}))});
  const dailyInput=(s,opId,claimRef)=>({opId,playerId:s.activePlayerId,expected:expectedDaily(s),...(claimRef?{claimRef}:{})});
  const dailyCommand=(p,method,input)=>p.evaluate(({method,input})=>__nativeDaily.store[method](input),{method,input});
  async function replayDailyWithoutWrites(p,method,input,receipt){
    const methods=['add','put','delete','clear'];
    await p.evaluate(({name,methods})=>{const prototype=IDBObjectStore.prototype,originals=Object.fromEntries(methods.map(m=>[m,prototype[m]]));globalThis.__nativeDailyReplayMutations=[];globalThis.__nativeDailyRestoreReplay=()=>{for(const m of methods)prototype[m]=originals[m]};for(const m of methods)prototype[m]=function(...args){if(this.transaction.db.name===name){__nativeDailyReplayMutations.push(m);throw Error('REPLAY_ATTEMPTED_MUTATION:'+m)}return originals[m].apply(this,args)}},{name:dailyDbName,methods});
    let replay,attempts;try{replay=await dailyCommand(p,method,input)}finally{attempts=await p.evaluate(()=>{__nativeDailyRestoreReplay();const attempts=__nativeDailyReplayMutations;delete globalThis.__nativeDailyRestoreReplay;delete globalThis.__nativeDailyReplayMutations;return attempts})}
    assert.equal(replay.replayed,true);assert.deepEqual(replay.receipt,receipt);assert.deepEqual(attempts,[]);return {methods,attempts};
  }
  const dailyFacts=s=>{const p=s.records.find(r=>r.ref.domain==='PLAYER_LIFE').value.players[s.activePlayerId],bag=s.records.find(r=>r.ref.domain==='BACKPACK'&&r.ref.playerId===s.activePlayerId).value;return {playerId:s.activePlayerId,xp:p.xp,engineXp:p.engineXp,claimEvents:p.events.filter(e=>e.type==='DAILY_JOURNEY').length,stardustQuantity:bag.items.filter(i=>i.kind==='MATERIAL'&&i.name==='每日星塵').reduce((n,i)=>n+i.qty,0),receiptCount:s.daily.receipts.length,pendingCount:s.daily.pending.length,bagRewardReceipts:bag.rewardReceipts}};

  const retainedDbName='KAIOS_LOCAL_GAME_TEST:native-retained',uiAckDbName=retainedDbName+'-ui-ack',uiOwnerDbName=retainedDbName+'-ui-owner';
  let retainedFixtureAt=null,retainedHealthy=null,retainedProofRows=null,retainedOwnerPending=null,retainedUiPaid=null,retainedPendingRows=null;const retainedFaultForks=[];
  async function openRetained(p,name,at){return p.evaluate(async({name,at})=>{globalThis.__nativeRetained?.store.close();const store=__nativeCurrent.life.createLocalGameAuthority({indexedDB,crypto,databaseName:name,now:()=>at});await store.openGame();globalThis.__nativeRetained={store,name,at};return store.readRetainedDaily()},{name,at})}
  const readRetained=p=>p.evaluate(()=>__nativeRetained.store.readRetainedDaily());
  const retainedInput=(s,opId,claimRef)=>({...dailyInput(s,opId,claimRef),expected:{...expectedDaily(s),retainedGeneration:s.retained.generation}});
  const retainedCommand=(p,method,input)=>p.evaluate(({method,input})=>__nativeRetained.store[method](input),{method,input});
  async function retainedRows(p,name){return p.evaluate(async name=>{
    if(!/^KAIOS_LOCAL_GAME_TEST:native-retained(?:-[a-z0-9-]{1,40})?$/.test(name))throw Error('SYNTHETIC_RETAINED_DATABASE_REQUIRED');
    const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
    try{return await new Promise((resolve,reject)=>{const tx=db.transaction('records','readonly'),result=[],r=tx.objectStore('records').openCursor();tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(tx.error);r.onsuccess=()=>{const c=r.result;if(c){result.push([c.key,c.value]);c.continue()}}})}finally{db.close()}
  },name)}
  async function forkRetained(p,name,rows){return p.evaluate(async({name,rows})=>{
    if(!/^KAIOS_LOCAL_GAME_TEST:native-retained-[a-z0-9-]{1,40}$/.test(name))throw Error('SYNTHETIC_RETAINED_FORK_REQUIRED');
    const store=__nativeCurrent.life.createLocalGameAuthority({indexedDB,crypto,databaseName:name});let db;
    try{await store.openGame();db=await new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite'),s=tx.objectStore('records');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);for(const [key,value] of rows)s.add(value,key)})}finally{db?.close();store.close()}
  },{name,rows})}
  async function inspectRetainedWithoutWrites(p,name,at){return p.evaluate(async({name,at})=>{
    const store=__nativeCurrent.life.createLocalGameAuthority({indexedDB,crypto,databaseName:name,now:()=>at});await store.openGame();const methods=['add','put','delete','clear'],prototype=IDBObjectStore.prototype,originals=Object.fromEntries(methods.map(m=>[m,prototype[m]])),attempts=[];
    for(const method of methods)prototype[method]=function(...args){if(this.transaction.db.name===name){attempts.push(method);throw Error('RETAINED_INSPECTOR_ATTEMPTED_WRITE:'+method)}return originals[method].apply(this,args)};
    try{return {result:await store.inspectDailyReconstruction(),error:null,methods,attempts}}catch(error){return {result:null,error:String(error),methods,attempts}}finally{for(const method of methods)prototype[method]=originals[method];store.close()}
  },{name,at})}
  async function mountRetainedUi(p,{name,at,mode}){
    await openCurrent(p);await openRetained(p,name,at);
    return p.evaluate(async({uiUrl,name,at,mode})=>{
      const {installPlayerLifeUI}=await import(uiUrl),state={mode,phase:'READY',calls:0,completions:0,messages:[],replays:[],legacyWriteAttempts:[],release:null};
      const initial=await __nativeRetained.store.readRetainedDaily();state.view=initial;state.visibleOwner=initial.activePlayerId;
      const expected=s=>({authorityEpoch:s.authorityEpoch,dailyGeneration:s.daily.generation,retainedGeneration:s.retained.generation,selectionEpoch:s.selectionEpoch,catalogRevision:s.catalogRevision,dailySequence:s.daily.sequence,records:s.records.map(({ref,revision})=>({ref,revision}))});
      state.claimInput={opId:'a'.repeat(32),playerId:initial.activePlayerId,expected:expected(initial)};state.fulfillInput=null;
      const wait=phase=>{state.phase=phase;return new Promise(resolve=>{state.release=()=>{state.release=null;resolve()}})};
      const player=()=>state.view.records.find(r=>r.ref.domain==='PLAYER_LIFE').value.players[state.visibleOwner];
      const forbidden=kind=>()=>{state.legacyWriteAttempts.push(kind);throw Error('LEGACY_WRITER_FORBIDDEN_IN_RETAINED_UI_FIXTURE')};
      const view={snapshot:()=>({player:player(),home:player().homePlot,status:'READY',persistent:true}),gameplayProfile:()=>__nativeCurrent.life.gameplayProfile(player(),{now:at}),listPlayers:()=>Object.values(state.view.records.find(r=>r.ref.domain==='PLAYER_LIFE').value.players),claimDailyJourney:forbidden('legacy-life-claim')};
      globalThis.K11520Backpack={get:()=>state.view.records.find(r=>r.ref.domain==='BACKPACK'&&r.ref.playerId===state.visibleOwner).value,addItem:forbidden('legacy-bag-add'),remove:forbidden('legacy-bag-remove'),captureLife:forbidden('legacy-bag-capture')};
      document.body.innerHTML='<div id="nativeScope">Synthetic retained async UI fixture · public boot/cutover NOT tested</div><section id="sheet"><header class="sheetHead"><b id="sheetTitle"></b><button id="sheetClose" type="button" aria-label="Close fixture Player Life panel">×</button></header><div id="sheetBody"></div></section><div id="k11520UiSettings" hidden></div><div id="dock" hidden></div><button id="backpackButton" hidden>Fixture guard</button>';
      const style=document.createElement('style');style.textContent='body{margin:0;padding:0;background:#101820;color:#e6f1f5;font:16px system-ui}#nativeScope{position:fixed;top:8px;left:12px;right:12px;font-size:12px;line-height:1.35}#sheet{position:fixed;inset:52px 8px 8px;border:1px solid #7c704b;border-radius:16px;padding:12px;box-sizing:border-box}#sheet:not(.open){display:none}#sheet .sheetHead{display:flex;align-items:center;justify-content:space-between}#sheetClose{background:#101820;color:#e6f1f5;border:1px solid #7c704b;border-radius:50%}#sheetBody{min-height:0}';document.head.append(style);
      const replay=async(method,input)=>{
        const methods=['add','put','delete','clear'],prototype=IDBObjectStore.prototype,originals=Object.fromEntries(methods.map(m=>[m,prototype[m]])),attempts=[];
        for(const m of methods)prototype[m]=function(...args){if(this.transaction.db.name===name){attempts.push(m);throw Error('RETAINED_REPLAY_ATTEMPTED_WRITE:'+m)}return originals[m].apply(this,args)};
        try{const result=await __nativeRetained.store[method](input);if(!result.replayed)throw Error('EXACT_REPLAY_EXPECTED');state.replays.push({method,opId:input.opId,methods,attempts:[...attempts],receipt:result.receipt});return result}finally{for(const m of methods)prototype[m]=originals[m]}
      };
      const claimDaily=async context=>{
        if(context.playerId!==state.claimInput.playerId||!context.isCurrent())throw Error('ORIGINAL_UI_OWNER_REQUIRED');state.calls++;const call=state.calls;state.lastContext=context;
        if(call===1)await wait('BEFORE_CLAIM');if(!context.isCurrent()){state.phase='STALE_BEFORE_CLAIM';return}
        const claim=call===1?await __nativeRetained.store.claimRetainedDaily(state.claimInput):await replay('claimRetainedDaily',state.claimInput);state.claimReceipt=claim.receipt;
        const committed=await __nativeRetained.store.readRetainedDaily();state.claimCommitted=committed;
        if(call===1){await wait('CLAIM_COMMITTED_AWAITING_READBACK');if(mode==='ACK_LOSS'){state.phase='CLAIM_ACK_LOST';throw Error('SYNTHETIC_POST_COMMIT_CLAIM_ACK_LOST')}}
        if(!context.isCurrent()){state.phase='STALE_AFTER_CLAIM';return}
        state.fulfillInput??={opId:'b'.repeat(32),playerId:state.claimInput.playerId,claimRef:state.claimInput.opId,expected:expected(committed)};
        const paid=call<=2?await __nativeRetained.store.fulfillRetainedDaily(state.fulfillInput):await replay('fulfillRetainedDaily',state.fulfillInput);state.fulfillmentReceipt=paid.receipt;state.fulfilled=await __nativeRetained.store.readRetainedDaily();
        if(mode==='ACK_LOSS'&&call===2){await wait('FULFILL_COMMITTED_AWAITING_READBACK');state.phase='FULFILL_ACK_LOST';throw Error('SYNTHETIC_POST_COMMIT_FULFILL_ACK_LOST')}
        if(!context.isCurrent()){state.phase='STALE_AFTER_FULFILL';return}state.view=state.fulfilled;state.phase='COMPLETE';
      };
      state.ui=installPlayerLifeUI({store:view,getXYZ:()=>player().lastXYZ,saveSession:forbidden('legacy-session-save'),claimDaily,onChange:()=>{state.completions++},toast:m=>state.messages.push(m)});
      document.getElementById('sheetClose').onclick=()=>document.getElementById('playerLifeContinue')?.click();state.ui.open();globalThis.__nativeAsyncUi=state;
      return {playerId:state.visibleOwner,claimInput:state.claimInput,scope:'ACTUAL_PLAYER_LIFE_INSTALLER_SYNTHETIC_READONLY_PROJECTION_NOT_PUBLIC_BOOT'};
    },{uiUrl:moduleUrl('runtime/player-life-ui.mjs'),name,at,mode});
  }
  async function uiScreenshot(p,file){await p.screenshot({path:out+'/'+file});report.screenshots.push({file,width:390,height:844,kind:'ISOLATED_ASYNC_UI_NOT_PUBLIC_GAME'});await checkpoint()}

  const expected=s=>({authorityEpoch:s.authorityEpoch,selectionEpoch:s.selectionEpoch,catalogRevision:s.catalogRevision,records:s.records.map(({ref,revision})=>({ref,revision}))});
  const evidence=s=>({hash:digest(s),authorityEpoch:s.authorityEpoch,selectionEpoch:s.selectionEpoch,catalogRevision:s.catalogRevision,activePlayerId:s.activePlayerId,...(s.daily?{dailyGeneration:s.daily.generation,dailySequence:s.daily.sequence}:{}),...(s.retained?{retainedGeneration:s.retained.generation}:{}),records:s.records.map(r=>({ref:r.ref,revision:r.revision,sha256:digest(r.value),consumed:r.ref.domain==='PRODUCT'?{delivery:r.value.progress.courierReceipts,insurance:Object.keys(r.value.progress.courierInsuranceReceipts)}:r.ref.domain==='BACKPACK'?r.value.rewardReceipts:r.ref.domain==='COURIER'?r.value.settledReceipts:r.value.usedNonces}))});
  async function command(p,s,kind='PLAYER_UPDATE',patch={}){return p.evaluate(async({s,kind,patch,expected})=>{const input={kind,playerId:patch.playerId||s.activePlayerId,owner:'guest',expected};if(kind==='SWITCH')return __nativeCurrent.store.commandGame(input);if(kind==='OWN_COURIER_TRANSACTION')input.missionId='NATIVE-COURIER';return __nativeCurrent.store.commandGame(input,records=>{if(kind==='PLAYER_UPDATE'){const life=records.find(r=>r.ref.domain==='PLAYER_LIFE').value,p=life.players[s.activePlayerId];if(patch.name)p.displayName=patch.name;if(patch.pronoun)p.pronoun=patch.pronoun}else{const product=records.find(r=>r.ref.domain==='PRODUCT'&&r.ref.playerId===s.activePlayerId).value,courier=records.find(r=>r.ref.domain==='COURIER').value,m=courier.missions['NATIVE-COURIER'],credit=m.settlement.credit,{status,...binding}=credit;product.progress.kaios+=credit.rewardKaios;product.progress.xp+=12;product.progress.events.COURIER_SETTLEMENT=(product.progress.events.COURIER_SETTLEMENT||0)+1;product.progress.courierReceipts.push(credit.receiptId);product.progress.courierReceiptBindings[credit.receiptId]=binding;credit.status='CONFIRMED';m.status='DELIVERED';m.settlement.outcome='DELIVERED';m.cargo.ownerState='DELIVERED_TO_DESTINATION';m.cargo.ownerLifeId=null;delete courier.activeByCourier[s.activePlayerId]}})}, {s,kind,patch,expected:expected(s)})}
  async function screenshot(p,file,s,daily=null){await p.evaluate(value=>{document.getElementById('evidence').textContent=JSON.stringify(value,null,2)}, {scope:report.scope,functionalQA:report.functionalQA,...(daily?{daily:{scope:report.dailyFixtureScope,...dailyFacts(daily),hash:evidence(daily).hash}}:{}),canonical:evidence(s),releaseStatus:'HOLD',wholePlayerLifeP0:'INCOMPLETE'});await p.screenshot({path:out+'/'+file});report.screenshots.push({file,width:390,height:844,kind:'ADAPTER_DIAGNOSTIC_NOT_PRODUCT_UI'});await checkpoint()}
  try{
    const parsed=new URL(base);assert.ok(['127.0.0.1','localhost'].includes(parsed.hostname)&&parsed.protocol==='http:'&&!parsed.username&&!parsed.password&&!parsed.search&&!parsed.hash&&['','/'].includes(parsed.pathname),'native mode requires a plain loopback origin');
    assert.equal(execFileSync('git',['rev-parse',pinned+'^{commit}'],{encoding:'utf8'}).trim(),pinned,'exact pinned old object is mandatory');
    for(const file of ['runtime/player-life-runtime.mjs','runtime/backpack-runtime.mjs','runtime/kgen-margin-runtime.mjs','runtime/digital-ant-logistics-runtime.mjs','runtime/player-life-ui.mjs'])await collect(root+file,current,false);
    for(const file of ['runtime/player-life-runtime.mjs','runtime/evm-wallet-runtime.mjs','runtime/backpack-ui.mjs','runtime/digital-ant-logistics-runtime.mjs','runtime/world-runtime.mjs'])await collect(root+file,legacy,true);
    profileDir=await mkdtemp(path.join(tmpdir(),'kaios-native-idb-'));context=await launch();pageA=await page(context,'A');pageB=await page(context,'B');
    const old=await pageB.evaluate(async urls=>{
      const life=await import(urls.life),evm=await import(urls.evm),kgen=await import(urls.kgen),courier=await import(urls.courier),world=await import(urls.world);
      const store=life.createLocalPlayerStore({storage:localStorage}),first=store.createPlayer().playerId,second=store.createPlayer().playerId;store.activatePlayer(first);store.saveProgress({journeyProgress:{tutorialStage:'MOVE'}});globalThis.__K11520_PLAYER_LIFE__=store;
      const scoped=evm.createPlayerScopedStorage(localStorage,first),product=evm.createSimulationPlayerStore({ledger:kgen.createKgenLedger(100),storage:localStorage,playerId:first});product.activate(null);
      const backpack=await import(urls.backpack);const inserted=backpack.addBackpackItem({itemId:'NATIVE-SEED',kind:'MATERIAL',name:'Synthetic seed',qty:1,weightEach:1});if(!inserted.ok||!inserted.persistent)throw Error('LEGACY_BACKPACK_SEED_FAILED');
      evm.savePlayerSession({xyz:store.activePlayer().lastXYZ,intentXYZ:store.activePlayer().lastXYZ},scoped);const tutorial=world.createJourneyTutorial({storage:scoped,returning:false});
      const cs=courier.createPlayerCourierStore({storage:localStorage,now:()=>10000,monotonicNow:()=>100,sessionId:'NATIVE-OLD-A'}),offer=courier.createPlayerCourierOffer({missionId:'NATIVE-COURIER',requesterLifeId:'NATIVE-REQUESTER',cargoId:'NATIVE-CARGO',cargoAmount:1000,freightFeeKaios:8,courierSalaryKaios:3,estimatedDurationMs:300000,createdAt:1000}),mission=cs.accept(offer,{courierLifeId:first}),later=courier.createPlayerCourierStore({storage:localStorage,now:()=>mission.dueAt,monotonicNow:()=>0,sessionId:'NATIVE-OLD-B'});later.settleDue(mission.missionId,{courierLifeId:first});
      globalThis.__nativeOld={life:store,product,backpack,scoped,tutorial,evm,courier,courierStore:later,first,second};return {first,second,life:JSON.parse(localStorage.getItem('KAIOS_PLAYER_LIFE_V1')),bag:JSON.parse(scoped.getItem('11520.backpack.v1')),product:JSON.parse(scoped.getItem('k11520.local-product.v1:guest')),courier:JSON.parse(localStorage.getItem('K11520_PLAYER_COURIER'))};
    },{life:moduleUrl('runtime/player-life-runtime.mjs',true),evm:moduleUrl('runtime/evm-wallet-runtime.mjs',true),kgen:moduleUrl('runtime/kgen-margin-runtime.mjs',true),courier:moduleUrl('runtime/digital-ant-logistics-runtime.mjs',true),world:moduleUrl('runtime/world-runtime.mjs',true),backpack:moduleUrl('runtime/backpack-ui.mjs',true)});
    await openCurrent(pageA);await pageA.evaluate(async({old,name,bagUrl,kgenUrl})=>{
      const {createBackpack}=await import(bagUrl),{createKgenLedger}=await import(kgenUrl),owner=old.first,product={...old.product,schema:'K11520_LOCAL_SIMULATION_V2',playerId:owner,progress:{...old.product.progress,courierReceiptBindings:{},courierInsuranceBindings:{}}},courier=old.courier,m=courier.missions['NATIVE-COURIER'];
      // Direct synthetic fixture seeding, not a migration or historical backpay path.
      m.status='DELIVERY_PENDING_CREDIT';m.settlement.outcome=m.status;m.cargo.ownerState='OWNED_BY_COURIER';m.cargo.ownerLifeId=owner;courier.activeByCourier[owner]=m.missionId;m.settlement.credit={status:'PENDING',receiptId:m.settlement.receiptId,missionId:m.missionId,playerId:owner,owner:'guest',rewardKaios:m.settlement.rewardKaios,purpose:'PLAYER_COURIER_REWARD'};
      const empty={schema:'K11520_LOCAL_SIMULATION_V2',playerId:old.second,owner:'guest',revision:0,ledger:{...createKgenLedger(100),owner:'guest'},progress:{kaios:0,claimableKaios:0,spentKaios:0,loot:0,xp:0,engineXp:0,playedMs:0,events:{},courierReceipts:[],courierInsuranceReceipts:{},courierReceiptBindings:{},courierInsuranceBindings:{}}};
      const entries=[{ref:{domain:'PLAYER_LIFE'},value:old.life},{ref:{domain:'COURIER'},value:courier},{ref:{domain:'BACKPACK',playerId:owner},value:{revision:0,data:old.bag}},{ref:{domain:'PRODUCT',playerId:owner,owner:'guest'},value:product},{ref:{domain:'BACKPACK',playerId:old.second},value:{revision:0,data:createBackpack({ownerId:old.second})}},{ref:{domain:'PRODUCT',playerId:old.second,owner:'guest'},value:empty}],key=ref=>['PLAYER_LIFE','COURIER'].includes(ref.domain)?ref.domain:ref.domain+':'+ref.playerId+(ref.domain==='PRODUCT'?':'+ref.owner:'');
      const coverage=['PLAYER_LIFE','BACKPACK','PRODUCT','COURIER'],meta={schema:'KAIOS_LOCAL_GAME_FULL_DRAFT_V1',integration:'UNINTEGRATED_DRAFT',coverage,authorityEpoch:'a'.repeat(32),selectionEpoch:0,activePlayerId:owner,catalogRevision:0,catalog:entries.map(e=>({ref:e.ref,presence:'PRESENT'})),legacyUnbound:[]};
      const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});try{await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite'),s=tx.objectStore('records');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);s.add(meta,'$authority');s.add({authorityEpoch:meta.authorityEpoch,coverage,catalogRevision:0},'$initialized');s.add({kind:'SYNTHETIC_NATIVE_FIXTURE_NOT_MIGRATION'},'archive:'+meta.authorityEpoch);for(const e of entries)s.add(e.value,key(e.ref))})}finally{db.close()}
    },{old,name:dbName,bagUrl:moduleUrl('runtime/backpack-runtime.mjs'),kgenUrl:moduleUrl('runtime/kgen-margin-runtime.mjs')});await openCurrent(pageB);
    await run('NATIVE_IDB',async()=>{const native=await pageA.evaluate(async()=>({factory:Object.prototype.toString.call(indexedDB),databaseNames:(await indexedDB.databases()).map(db=>db.name)})),a=await read(pageA),b=await read(pageB);assert.equal(native.factory,'[object IDBFactory]');assert.ok(native.databaseNames.includes(dbName));assert.deepEqual(a,b);return {nativeFactory:native.factory,database:dbName,tabs:2,seed:'SYNTHETIC_DIRECT_IDB_NOT_MIGRATION',state:evidence(a)}});
    await run('CROSS_TAB_STALE_CAS',async()=>{const a=await read(pageA),b=await read(pageB);assert.deepEqual(expected(a),expected(b));const saved=await command(pageA,a,'PLAYER_UPDATE',{name:'Canonical A N+1'});await assert.rejects(command(pageB,b,'PLAYER_UPDATE',{name:'Stale B'}),/REVISION_CONFLICT/);assert.deepEqual(await read(pageB),saved);return {admittedA:expected(a),admittedB:expected(b),after:evidence(saved),staleOutcome:'REVISION_CONFLICT_RELOAD_REQUIRED'}});
    await run('SIMULTANEOUS_CAS',async()=>{const a=await read(pageA),b=await read(pageB);assert.deepEqual(expected(a),expected(b));const outcomes=await Promise.allSettled([command(pageA,a,'PLAYER_UPDATE',{name:'Concurrent A'}),command(pageB,b,'PLAYER_UPDATE',{name:'Concurrent B'})]);assert.equal(outcomes.filter(v=>v.status==='fulfilled').length,1);assert.match(String(outcomes.find(v=>v.status==='rejected').reason),/REVISION_CONFLICT/);return {admittedA:expected(a),admittedB:expected(b),outcomes:outcomes.map(v=>({status:v.status,error:v.status==='rejected'?String(v.reason):null})),after:evidence(await read(pageA))}});
    await run('REFRESH_EXPLICIT_RETRY',async()=>{const before=await read(pageA),calls=await pageA.evaluate(()=>__nativeProviderCalls);report.providerActivity.push({page:'A_BEFORE_RELOAD',calls});assert.deepEqual(calls,[]);await pageA.reload({waitUntil:'domcontentloaded'});await openCurrent(pageA);const fresh=await read(pageA);assert.deepEqual(fresh,before,'actual reload must read the latest native records');const name=fresh.records.find(r=>r.ref.domain==='PLAYER_LIFE').value.players[old.first].displayName,saved=await command(pageA,fresh,'PLAYER_UPDATE',{pronoun:'Explicit fresh retry'});assert.equal(saved.records.find(r=>r.ref.domain==='PLAYER_LIFE').value.players[old.first].displayName,name);return {reloadOccurred:true,oldCachesOnBPreserved:true,beforeReload:evidence(before),afterReload:evidence(fresh),fresh:expected(fresh),after:evidence(saved)}});
    await run('SELECTION_EPOCH_ISOLATION',async()=>{const before=await read(pageA),switched=await command(pageA,before,'SWITCH',{playerId:old.second});assert.equal(switched.selectionEpoch,before.selectionEpoch+1);await assert.rejects(command(pageB,before,'PLAYER_UPDATE',{name:'Stale selected Life'}),/REVISION_CONFLICT/);const changed=await command(pageB,await read(pageB),'PLAYER_UPDATE',{name:'Second Life only'});assert.deepEqual(changed.records.find(r=>r.ref.domain==='PLAYER_LIFE').value.players[old.first],before.records.find(r=>r.ref.domain==='PLAYER_LIFE').value.players[old.first]);const restored=await command(pageA,changed,'SWITCH',{playerId:old.first});return {before:evidence(before),otherLife:evidence(changed),after:evidence(restored)}});
    await run('MULTI_RECORD_ABORT',async()=>{
      const before=await read(pageA);await pageA.evaluate(()=>{const prototype=IDBObjectStore.prototype,original=prototype.put;globalThis.__nativeAbortEvidence={productRequestSucceeded:0,abortCalls:0,requestDone:false,errors:[]};globalThis.__nativeRestorePut=()=>{prototype.put=original};prototype.put=function(value,key){const r=original.call(this,value,key),tx=this.transaction;if(String(key).startsWith('PRODUCT:'))r.addEventListener('success',()=>{const e=__nativeAbortEvidence;e.productRequestSucceeded++;e.writtenKey=key;e.requestDone=r.readyState==='done';e.abortCalls++;try{tx.abort()}catch(error){e.errors.push(String(error));throw error}});return r}});
      let refusal=null,injectionEvidence;try{await command(pageA,before,'OWN_COURIER_TRANSACTION')}catch(error){refusal=String(error)}finally{injectionEvidence=await pageA.evaluate(()=>{__nativeRestorePut();const e=__nativeAbortEvidence;delete globalThis.__nativeRestorePut;delete globalThis.__nativeAbortEvidence;return e})}
      assert.match(refusal||'',/AUTHORITY_TRANSACTION_ABORTED|AbortError/);assert.equal(injectionEvidence.productRequestSucceeded,1);assert.equal(injectionEvidence.abortCalls,1);assert.equal(injectionEvidence.requestDone,true);assert.deepEqual(injectionEvidence.errors,[]);assert.equal(injectionEvidence.writtenKey,'PRODUCT:'+old.first+':guest');assert.deepEqual(await read(pageB),before);return {injection:'NATIVE_REQUEST_SUCCESS_THEN_TRANSACTION_ABORT',injectionEvidence,refusal,physicalQuotaTest:false,before:evidence(before),after:evidence(await read(pageB))};
    });
    await run('ATOMIC_COURIER_CREDIT',async()=>{const before=await read(pageA),after=await command(pageA,before,'OWN_COURIER_TRANSACTION'),product=after.records.find(r=>r.ref.domain==='PRODUCT'&&r.ref.playerId===old.first).value,courier=after.records.find(r=>r.ref.domain==='COURIER').value;assert.equal(product.progress.kaios,4);assert.equal(product.progress.courierReceipts.length,1);assert.equal(courier.missions['NATIVE-COURIER'].status,'DELIVERED');assert.deepEqual(await read(pageB),after);return {before:evidence(before),after:evidence(after),rewardCount:1}});
    await run('CORRUPT_RECORD_PRESERVATION',async()=>{return pageA.evaluate(async({name})=>{const store=__nativeCurrent.life.createLocalGameAuthority({indexedDB,crypto,databaseName:name});await store.open();const legacy=__nativeCurrent.life.createLocalPlayerStore({storage:{getItem:()=>null,setItem(){}}});legacy.createPlayer();const envelope={schema:'KAIOS_PLAYER_LIFE_V1',scope:'LOCAL_CANDIDATE_NOT_ECONOMIC_AUTHORITY',revision:1,activePlayerId:legacy.activePlayer().playerId,players:{[legacy.activePlayer().playerId]:legacy.activePlayer()},legacyMigrated:false,usedNonces:[]};await store.initialize({domain:'PLAYER_LIFE',envelope,confirmLifeOnlyDraft:true});const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)}),bad={schema:'CORRUPT_NATIVE_FIXTURE'};await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);tx.objectStore('records').put(bad,'PLAYER_LIFE')});let refusal=null;try{await store.read()}catch(error){refusal=error.message}if(!/CORRUPT_AUTHORITY/.test(refusal||''))throw Error('CORRUPT_READ_WAS_NOT_REFUSED');const preserved=await new Promise((resolve,reject)=>{const r=db.transaction('records','readonly').objectStore('records').get('PLAYER_LIFE');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});if(JSON.stringify(preserved)!==JSON.stringify(bad))throw Error('CORRUPT_BYTES_CHANGED');db.close();store.close();return {refusal,preserved:true,repairAttempted:false}}, {name:'KAIOS_LOCAL_GAME_TEST:native-corrupt'})});
    await run('FULL_RECORD_ABSENCE_AND_CORRUPTION',async()=>pageA.evaluate(async()=>{
      const snapshot=await __nativeCurrent.store.readGame(),beforeSource=JSON.stringify(Object.keys(localStorage).sort().map(key=>[key,localStorage.getItem(key)])),out={};
      const key=ref=>['PLAYER_LIFE','COURIER'].includes(ref.domain)?ref.domain:ref.domain+':'+ref.playerId+(ref.domain==='PRODUCT'?':'+ref.owner:'');
      for(const mode of ['ABSENT','MISSING','MALFORMED']){
        const name='KAIOS_LOCAL_GAME_TEST:native-full-'+mode.toLowerCase(),store=__nativeCurrent.life.createLocalGameAuthority({indexedDB,crypto,databaseName:name});await store.openGame();
        const coverage=['PLAYER_LIFE','BACKPACK','PRODUCT','COURIER'],catalog=snapshot.records.map(r=>({ref:r.ref,presence:mode==='ABSENT'&&r.ref.domain==='BACKPACK'&&r.ref.playerId===snapshot.activePlayerId?'ABSENT':'PRESENT'})),meta={schema:'KAIOS_LOCAL_GAME_FULL_DRAFT_V1',integration:'UNINTEGRATED_DRAFT',coverage,authorityEpoch:'b'.repeat(32),selectionEpoch:snapshot.selectionEpoch,activePlayerId:snapshot.activePlayerId,catalogRevision:0,catalog,legacyUnbound:[]},marker={authorityEpoch:meta.authorityEpoch,coverage,catalogRevision:0};
        const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)}),write=work=>new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);work(tx.objectStore('records'))}),get=id=>new Promise((resolve,reject)=>{const r=db.transaction('records','readonly').objectStore('records').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
        await write(s=>{s.add(meta,'$authority');s.add(marker,'$initialized');s.add({kind:'ISOLATED_NATIVE_FAULT_FIXTURE'},'archive:'+meta.authorityEpoch);for(const r of snapshot.records)if(catalog.find(e=>key(e.ref)===key(r.ref)).presence==='PRESENT')s.add(r.ref.domain==='BACKPACK'?{revision:r.revision,data:r.value}:r.value,key(r.ref))});
        const admitted=await store.readGame(),input={kind:mode==='ABSENT'?'INVENTORY_UPDATE':'PLAYER_UPDATE',playerId:admitted.activePlayerId,owner:'guest',expected:{authorityEpoch:admitted.authorityEpoch,selectionEpoch:admitted.selectionEpoch,catalogRevision:admitted.catalogRevision,records:admitted.records.map(({ref,revision})=>({ref,revision}))}},productKey='PRODUCT:'+snapshot.activePlayerId+':guest';let corrupt;
        if(mode==='MISSING')await write(s=>s.delete(productKey));if(mode==='MALFORMED'){corrupt=await get(productKey);corrupt.progress.courierReceipts=null;await write(s=>s.put(corrupt,productKey))}
        let refusal=null;try{await store.commandGame(input,()=>{})}catch(error){refusal=error.message}if(!refusal)throw Error('FULL_FAULT_WAS_NOT_REFUSED:'+mode);
        if(mode==='ABSENT'){const row=admitted.records.find(r=>r.ref.domain==='BACKPACK'&&r.ref.playerId===snapshot.activePlayerId);if(row.revision!==null||refusal!=='DOMAIN_RECORD_ABSENT'||JSON.stringify(await store.readGame())!==JSON.stringify(admitted))throw Error('DECLARED_ABSENCE_CHANGED');out.declaredAbsent={revision:null,refusal,preserved:true}}
        else{let readRefusal=null;try{await store.readGame()}catch(error){readRefusal=error.message}if(!readRefusal)throw Error('FULL_CORRUPT_READ_ACCEPTED');const raw=await get(productKey);if(mode==='MISSING'?raw!==undefined:JSON.stringify(raw)!==JSON.stringify(corrupt))throw Error('FAULTED_ROW_CHANGED');if(JSON.stringify(await get('$authority'))!==JSON.stringify(meta)||JSON.stringify(await get('$initialized'))!==JSON.stringify(marker))throw Error('FAULT_MARKER_CHANGED');out[mode==='MISSING'?'unexpectedMissing':'malformed']={refusal,readRefusal,preserved:true,markerPreserved:true}}
        db.close();store.close();
      }
      if(beforeSource!==JSON.stringify(Object.keys(localStorage).sort().map(key=>[key,localStorage.getItem(key)])))throw Error('FAULT_TEST_CHANGED_LEGACY_SOURCE');out.sourceUnchanged=true;return out;
    }));
    await run('REVIEW_CAPTURE_SOURCE_PRESERVATION',async()=>pageA.evaluate(async()=>{const before=JSON.stringify(Object.keys(localStorage).sort().map(key=>[key,localStorage.getItem(key)])),store=__nativeCurrent.life.createLocalGameAuthority({indexedDB,crypto,databaseName:'KAIOS_LOCAL_GAME_TEST:native-capture'});await store.openGame();const c=await store.prepareGameMigration({sourceStorage:localStorage}),read=await store.readGameCandidate(c.id);if(JSON.stringify(c)!==JSON.stringify(read)||before!==JSON.stringify(Object.keys(localStorage).sort().map(key=>[key,localStorage.getItem(key)])))throw Error('CAPTURE_SOURCE_OR_ARCHIVE_CHANGED');const partial=await store.read();if(partial.status!=='UNINITIALIZED')throw Error('CAPTURE_INSTALLED_AUTHORITY');store.close();return {status:c.status,holds:c.holds.map(h=>h.code),manifestSha256:c.manifestSha256,sourceStringsPreserved:true,authorityInstalled:false}}));
    // This primary old-writer proof does not depend on debugger scheduling.
    await run('PINNED_OLD_WRITES_ISOLATED',async()=>{const canonical=await read(pageA),results=[];for(const operation of ['LIFE','PRODUCT','COURIER','BACKPACK','SESSION','TUTORIAL']){const mutation=await pageB.evaluate(operation=>{const o=__nativeOld,prefix='k11520.player:'+o.first+':',key={LIFE:'KAIOS_PLAYER_LIFE_V1',PRODUCT:prefix+'k11520.local-product.v1:guest',COURIER:'K11520_PLAYER_COURIER',BACKPACK:prefix+'11520.backpack.v1',SESSION:prefix+'k11520.player-session.v1',TUTORIAL:prefix+'k11520.journey.tutorial'}[operation],before=localStorage.getItem(key);if(operation==='LIFE')o.life.updateProfile({displayName:'Pinned old writer changed legacy'});if(operation==='PRODUCT')o.product.record('MONSTER_KILL');if(operation==='COURIER')o.courierStore.accept(o.courier.createPlayerCourierOffer({missionId:'NATIVE-OLD-NEXT',requesterLifeId:'NATIVE-REQUESTER',cargoId:'NATIVE-NEXT-CARGO',cargoAmount:1000,freightFeeKaios:8,courierSalaryKaios:3,estimatedDurationMs:300000,createdAt:1000}),{courierLifeId:o.first});if(operation==='BACKPACK'){const r=o.backpack.addBackpackItem({itemId:'NATIVE-OLD-WRITE',kind:'FOOD',name:'Pinned old item',qty:1,weightEach:1});if(!r.ok||!r.persistent)throw Error('OLD_BACKPACK_DID_NOT_SAVE')}if(operation==='SESSION')o.evm.savePlayerSession({xyz:{x:7,y:0,z:9},intentXYZ:{x:8,y:0,z:9}},o.scoped);if(operation==='TUTORIAL')o.tutorial.event('MOVE',{distance:10});const after=localStorage.getItem(key);if(before===after)throw Error('OLD_WRITER_DID_NOT_CHANGE_STORAGE:'+operation);return {operation,key,changed:true,before,after}},operation);assert.deepEqual(await read(pageA),canonical,operation+' cannot overwrite native canonical records');results.push({operation,key:mutation.key,changed:true,beforeSha256:digest(mutation.before??'ABSENT'),afterSha256:digest(mutation.after),canonicalUnchanged:true})}return {pinnedHead:pinned,operations:results,canonical:evidence(canonical),scope:'TESTED_ADAPTER_KEYSPACE_ONLY_NOT_PRODUCTION_CUTOVER'}});
    let dailyClaimInput=null,dailyMainBaseline=null,dailyLegacyBaseline=null;
    const legacyStrings=p=>p.evaluate(()=>JSON.stringify(Object.keys(localStorage).sort().map(key=>[key,localStorage.getItem(key)])));
    await run('DAILY_TYPED_CLAIM_RACE',async()=>{
      dailyMainBaseline=await read(pageA);dailyLegacyBaseline=await legacyStrings(pageA);
      dailyFixtureAt=await pageA.evaluate(async({name,source})=>{
        const life=__nativeCurrent.life,at=Date.now(),key='KAIOS_PLAYER_LIFE_V1';let raw=JSON.stringify(source.records.find(r=>r.ref.domain==='PLAYER_LIFE').value);
        const legacy=life.createLocalPlayerStore({storage:{getItem:k=>k===key?raw:null,setItem(k,value){if(k!==key)throw Error('UNEXPECTED_DAILY_FIXTURE_KEY');raw=value}},now:()=>at}),day=legacy.gameplayProfile().daily.day;
        if(legacy.gameplayProfile().daily.claimed||legacy.gameplayProfile().daily.distanceMeters!==0)throw Error('DAILY_FIXTURE_BASELINE_NOT_FRESH');
        const events=[...Array.from({length:3},(_,n)=>({type:'JOURNEY_MONSTER_KILL',id:`native-daily:${day}:kill:${n}`})),{type:'SIX_PHASE_PRACTICE',id:`native-daily:${day}:phase`},...Array.from({length:10},(_,n)=>({type:'EXPLORATION_STEP',id:`explore:${day}:${n+1}`}))];legacy.recordEvents(events.slice(0,8));legacy.recordEvents(events.slice(8));if(!legacy.gameplayProfile().daily.ready)throw Error('DAILY_FIXTURE_NOT_ELIGIBLE');
        const store=life.createLocalGameAuthority({indexedDB,crypto,databaseName:name,now:()=>at});await store.openGame();globalThis.__nativeDaily={store,at};
        const entries=source.records.map(r=>({ref:r.ref,value:r.ref.domain==='PLAYER_LIFE'?JSON.parse(raw):r.ref.domain==='BACKPACK'?{revision:r.revision,data:r.value}:r.value})),keyFor=ref=>['PLAYER_LIFE','COURIER'].includes(ref.domain)?ref.domain:ref.domain+':'+ref.playerId+(ref.domain==='PRODUCT'?':'+ref.owner:'');
        const coverage=['PLAYER_LIFE','BACKPACK','PRODUCT','COURIER'],dailyProtocol={generation:'d'.repeat(32),limits:{operationSlots:256,entryBytes:32768,totalBytes:1048576,protocolBytes:65536,legacyEntries:256},legacyClaims:[],legacyDeliveries:[]},meta={schema:'KAIOS_LOCAL_GAME_DAILY_DRAFT_V1',integration:'UNINTEGRATED_DRAFT',coverage,authorityEpoch:'c'.repeat(32),selectionEpoch:source.selectionEpoch,activePlayerId:source.activePlayerId,catalogRevision:0,catalog:entries.map(e=>({ref:e.ref,presence:'PRESENT'})),legacyUnbound:[],dailyProtocol};
        const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
        try{await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite'),s=tx.objectStore('records');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);s.add(meta,'$authority');s.add({authorityEpoch:meta.authorityEpoch,coverage,catalogRevision:0,dailyGeneration:dailyProtocol.generation},'$initialized');s.add({kind:'SYNTHETIC_DAILY_NATIVE_FIXTURE_NOT_MIGRATION',dailyProtocol},'archive:'+meta.authorityEpoch);s.add({schema:'DAILY_HEAD_V1',generation:dailyProtocol.generation,sequence:0,acceptedCount:0,acceptedBytes:0,pendingCount:0,reservedSlots:0,reservedBytes:0},'$daily');for(const e of entries)s.add(e.value,keyFor(e.ref))})}finally{db.close()}return at;
      },{name:dailyDbName,source:dailyMainBaseline});await openDaily(pageB,dailyFixtureAt);
      const a=await readDaily(pageA),b=await readDaily(pageB);assert.deepEqual(a,b);assert.equal(dailyFacts(a).stardustQuantity,0);const inputA=dailyInput(a,'1'.repeat(32)),inputB=dailyInput(b,'2'.repeat(32)),outcomes=await Promise.allSettled([dailyCommand(pageA,'claimDaily',inputA),dailyCommand(pageB,'claimDaily',inputB)]);assert.equal(outcomes.filter(v=>v.status==='fulfilled').length,1);assert.match(String(outcomes.find(v=>v.status==='rejected').reason),/REVISION_CONFLICT/);
      const receipt=outcomes.find(v=>v.status==='fulfilled').value.receipt;dailyClaimInput=receipt.request;const after=await readDaily(pageA),beforeFacts=dailyFacts(a),afterFacts=dailyFacts(after);assert.equal(afterFacts.xp,beforeFacts.xp+25);assert.equal(afterFacts.engineXp,beforeFacts.engineXp+20);assert.equal(afterFacts.claimEvents,beforeFacts.claimEvents+1);assert.equal(afterFacts.receiptCount,1);assert.equal(afterFacts.pendingCount,1);assert.equal(afterFacts.stardustQuantity,0);
      const replay=await replayDailyWithoutWrites(pageB,'claimDaily',dailyClaimInput,receipt);assert.deepEqual(await readDaily(pageB),after);assert.deepEqual(await read(pageA),dailyMainBaseline);assert.equal(await legacyStrings(pageA),dailyLegacyBaseline);
      return {scope:report.dailyFixtureScope,fixtureAt:dailyFixtureAt,tabClocks:await Promise.all([pageA.evaluate(()=>__nativeDaily.at),pageB.evaluate(()=>__nativeDaily.at)]),admittedA:expectedDaily(a),admittedB:expectedDaily(b),outcomes:outcomes.map(v=>({status:v.status,error:v.status==='rejected'?String(v.reason):null})),before:evidence(a),after:evidence(after),beforeFacts,afterFacts,claimReceipt:receipt,replayedWithoutWrite:true,replayMutationMethodsCovered:replay.methods,replayMutationAttempts:replay.attempts,originalCanonicalUnchanged:true,legacySourceStringsUnchanged:true,originalCanonicalHash:evidence(dailyMainBaseline).hash,legacySourceHash:digest(dailyLegacyBaseline)};
    });
    await run('DAILY_TYPED_FULFILL_ABORT_RETRY',async()=>{
      const before=await readDaily(pageA),input=dailyInput(before,'3'.repeat(32),dailyClaimInput.opId),bagKey='BACKPACK:'+before.activePlayerId;
      await pageA.evaluate(({name,bagKey})=>{const prototype=IDBObjectStore.prototype,put=prototype.put;globalThis.__nativeDailyAbort={requestSucceeded:0,abortCalls:0,abortEvents:0,requestDone:false,errors:[]};globalThis.__nativeDailyRestoreAbort=()=>{prototype.put=put};prototype.put=function(value,key){const r=put.call(this,value,key),tx=this.transaction;if(tx.db.name===name&&key===bagKey){tx.addEventListener('abort',()=>__nativeDailyAbort.abortEvents++);r.addEventListener('success',()=>{const e=__nativeDailyAbort;e.requestSucceeded++;e.requestDone=r.readyState==='done';e.writtenKey=key;e.abortCalls++;try{tx.abort()}catch(error){e.errors.push(String(error));throw error}})}return r}},{name:dailyDbName,bagKey});
      let refusal=null,injectionEvidence;try{await dailyCommand(pageA,'fulfillDaily',input)}catch(error){refusal=String(error)}finally{injectionEvidence=await pageA.evaluate(()=>{__nativeDailyRestoreAbort();const e=__nativeDailyAbort;delete globalThis.__nativeDailyRestoreAbort;delete globalThis.__nativeDailyAbort;return e})}
      assert.match(refusal||'',/AUTHORITY_TRANSACTION_ABORTED|AUTHORITY_TRANSACTION_FAILED|AbortError/);assert.equal(injectionEvidence.requestSucceeded,1);assert.equal(injectionEvidence.abortCalls,1);assert.equal(injectionEvidence.abortEvents,1);assert.equal(injectionEvidence.requestDone,true);assert.equal(injectionEvidence.writtenKey,bagKey);assert.deepEqual(injectionEvidence.errors,[]);const afterAbort=await readDaily(pageB);assert.deepEqual(afterAbort,before);
      const paid=await dailyCommand(pageA,'fulfillDaily',input),after=await readDaily(pageB),beforeFacts=dailyFacts(before),afterFacts=dailyFacts(after);assert.equal(paid.replayed,false);assert.equal(afterFacts.xp,beforeFacts.xp);assert.equal(afterFacts.engineXp,beforeFacts.engineXp);assert.equal(afterFacts.claimEvents,beforeFacts.claimEvents);assert.equal(afterFacts.stardustQuantity,1);assert.equal(afterFacts.receiptCount,2);assert.equal(afterFacts.pendingCount,0);assert.equal(afterFacts.bagRewardReceipts.filter(id=>id===paid.receipt.delivery.rewardId).length,1);
      const replay=await replayDailyWithoutWrites(pageA,'fulfillDaily',input,paid.receipt);assert.deepEqual(await readDaily(pageA),after);assert.deepEqual(await read(pageA),dailyMainBaseline);assert.equal(await legacyStrings(pageA),dailyLegacyBaseline);
      return {scope:report.dailyFixtureScope,fixtureAt:dailyFixtureAt,injection:'NATIVE_BAG_REQUEST_SUCCESS_THEN_TRANSACTION_ABORT',physicalQuotaTest:false,injectionEvidence,refusal,before:evidence(before),afterAbort:evidence(afterAbort),after:evidence(after),beforeFacts,afterFacts,fulfillmentReceipt:paid.receipt,replayReceiptEqual:true,replayMutationMethodsCovered:replay.methods,replayMutationAttempts:replay.attempts,originalCanonicalUnchanged:true,legacySourceStringsUnchanged:true,originalCanonicalHash:evidence(dailyMainBaseline).hash,legacySourceHash:digest(dailyLegacyBaseline)};
    });
    const retainedBaseline={main:await read(pageA),daily:await readDaily(pageA),legacy:await legacyStrings(pageA)},uiPages=[];
    const retainedUnchanged=async()=>{assert.deepEqual(await read(pageA),retainedBaseline.main);assert.deepEqual(await readDaily(pageA),retainedBaseline.daily);assert.equal(await legacyStrings(pageA),retainedBaseline.legacy);return {originalCanonicalHash:evidence(retainedBaseline.main).hash,ordinaryDailyHash:evidence(retainedBaseline.daily).hash,legacySourceHash:digest(retainedBaseline.legacy),originalCanonicalUnchanged:true,ordinaryDailyUnchanged:true,legacySourceStringsUnchanged:true}};
    await run('RETAINED_LATEST_RECONSTRUCTION',async()=>{
      retainedFixtureAt=dailyFixtureAt;const seeded=await pageA.evaluate(seedNativeRetainedFixture,{name:retainedDbName,source:dailyMainBaseline,at:retainedFixtureAt,generation:'e'.repeat(32)});const initial=await openRetained(pageA,retainedDbName,retainedFixtureAt);
      assert.deepEqual(initial,seeded.snapshot);const claim=await retainedCommand(pageA,'claimRetainedDaily',retainedInput(initial,'1'.repeat(32))),pending=await readRetained(pageA),pendingRows=await retainedRows(pageA,retainedDbName);
      const paid=await retainedCommand(pageA,'fulfillRetainedDaily',retainedInput(pending,'2'.repeat(32),claim.receipt.request.opId));retainedHealthy=await readRetained(pageA);retainedProofRows=await retainedRows(pageA,retainedDbName);
      const initialRows=new Map(retainedProofRows),checkpoint=initialRows.get('$retained-checkpoint'),bagKey='BACKPACK:'+initial.activePlayerId,variants=[];
      for(const kind of ['MISSING','OLDER','MALFORMED']){
        const name=retainedDbName+'-projection-'+kind.toLowerCase(),rows=structuredClone(retainedProofRows),map=new Map(rows);
        if(kind==='MISSING'){map.delete('PLAYER_LIFE');map.delete(bagKey)}
        if(kind==='OLDER'){map.set('PLAYER_LIFE',checkpoint.life);map.set(bagKey,checkpoint.bag)}
        if(kind==='MALFORMED'){map.set('PLAYER_LIFE',{corrupt:true});map.set(bagKey,{revision:0,data:{corrupt:true}})}
        await forkRetained(pageA,name,[...map]);const before=await retainedRows(pageA,name),inspected=await inspectRetainedWithoutWrites(pageA,name,retainedFixtureAt),after=await retainedRows(pageA,name);
        assert.equal(inspected.error,null);assert.equal(inspected.result.status,'RECONSTRUCTION_CANDIDATE');assert.deepEqual(inspected.result.candidate,retainedHealthy);assert.equal(inspected.result.headDigest,retainedHealthy.retained.headDigest);assert.deepEqual(inspected.result.projectionDamage.sort(),['PLAYER_LIFE',bagKey].sort());assert.deepEqual(inspected.attempts,[]);assert.deepEqual(after,before);
        variants.push({kind,status:inspected.result.status,beforeRawHash:digest(before),afterRawHash:digest(after),candidateHash:digest(inspected.result.candidate),headDigest:inspected.result.headDigest,sequence:inspected.result.sequence,mutationMethods:inspected.methods,mutationAttempts:inspected.attempts,installed:false});
      }
      // Preserve an exact valid prefix for the later higher-projection HOLD case.
      retainedPendingRows=pendingRows;
      const afterFacts=dailyFacts(retainedHealthy);assert.equal(afterFacts.receiptCount,2);assert.equal(afterFacts.pendingCount,0);assert.equal(afterFacts.stardustQuantity,1);
      return {scope:report.retainedFixtureScope,fixtureAt:retainedFixtureAt,before:evidence(initial),claimCommitted:evidence(pending),latest:evidence(retainedHealthy),beforeFacts:dailyFacts(initial),afterFacts,claimReceipt:claim.receipt,fulfillmentReceipt:paid.receipt,proofRowsHash:digest(retainedProofRows),headDigest:retainedHealthy.retained.headDigest,sequence:retainedHealthy.retained.sequence,retainedGeneration:retainedHealthy.retained.generation,variants,...await retainedUnchanged()};
    });
    await run('RETAINED_HISTORY_HOLD',async()=>{
      const foreignName=retainedDbName+'-foreign';await pageA.evaluate(seedNativeRetainedFixture,{name:foreignName,source:dailyMainBaseline,at:retainedFixtureAt,generation:'f'.repeat(32)});const foreignRows=new Map(await retainedRows(pageA,foreignName)),prefix=new Map(retainedPendingRows),variants=[];retainedPendingRows=null;
      for(const kind of ['ABSENT_TAIL','CORRUPT_TAIL','FOREIGN_CHECKPOINT','TRUNCATED_PREFIX_WITH_NEWER_PROJECTION']){
        const name=retainedDbName+'-hold-'+kind.toLowerCase().split('_')[0],map=new Map(structuredClone(retainedProofRows));
        if(kind==='ABSENT_TAIL')map.delete('retained-postimage:'+'2'.repeat(32));
        if(kind==='CORRUPT_TAIL')map.get('retained-postimage:'+'2'.repeat(32)).digest='0'.repeat(64);
        if(kind==='FOREIGN_CHECKPOINT')map.set('$retained-checkpoint',foreignRows.get('$retained-checkpoint'));
        if(kind==='TRUNCATED_PREFIX_WITH_NEWER_PROJECTION'){map.delete('daily-operation:'+'2'.repeat(32));map.delete('retained-postimage:'+'2'.repeat(32));map.set('$daily',prefix.get('$daily'));map.set('$retained',prefix.get('$retained'))}
        await forkRetained(pageA,name,[...map]);const before=await retainedRows(pageA,name),inspected=await inspectRetainedWithoutWrites(pageA,name,retainedFixtureAt),after=await retainedRows(pageA,name);
        assert.equal(inspected.result,null);assert.match(inspected.error,/RETAINED_.*HOLD/);assert.deepEqual(inspected.attempts,[]);assert.deepEqual(after,before);
        retainedFaultForks.push({name,kind,rows:before,error:inspected.error});variants.push({kind,error:inspected.error,beforeRawHash:digest(before),afterRawHash:digest(after),mutationMethods:inspected.methods,mutationAttempts:inspected.attempts,repairAttempted:false});
      }
      assert.deepEqual(await readRetained(pageA),retainedHealthy);assert.deepEqual(await retainedRows(pageA,retainedDbName),retainedProofRows);
      await pageA.evaluate(value=>{document.getElementById('evidence').textContent=JSON.stringify(value,null,2)},{scope:report.retainedFixtureScope,outcome:'EXPECTED_HOLD_SOURCE_PRESERVED',variants:variants.map(v=>({kind:v.kind,error:v.error,unchanged:v.beforeRawHash===v.afterRawHash,writes:v.mutationAttempts.length})),repairImplemented:false,productionCutover:'HOLD'});await pageA.screenshot({path:out+'/native-retained-hold-390x844.png'});report.screenshots.push({file:'native-retained-hold-390x844.png',width:390,height:844,kind:'RETAINED_HOLD_DIAGNOSTIC_NOT_REPAIR'});await checkpoint();
      return {scope:report.retainedFixtureScope,fixtureAt:retainedFixtureAt,healthyHash:evidence(retainedHealthy).hash,healthyProofRowsHash:digest(retainedProofRows),foreignCheckpointGeneration:'f'.repeat(32),expectedGeneration:'e'.repeat(32),variants,...await retainedUnchanged()};
    });
    await run('ASYNC_DAILY_UI_ACK_RETRY',async()=>{
      await pageA.evaluate(seedNativeRetainedFixture,{name:uiAckDbName,source:dailyMainBaseline,at:retainedFixtureAt,generation:'8'.repeat(32)});const p=await page(context,'UI_ACK');uiPages.push(['UI_ACK',p]);const mounted=await mountRetainedUi(p,{name:uiAckDbName,at:retainedFixtureAt,mode:'ACK_LOSS'});const before=await openRetained(pageB,uiAckDbName,retainedFixtureAt),initialRows=await retainedRows(pageB,uiAckDbName);
      await p.locator('#dailyJourneyClaim').click();await p.waitForFunction(()=>__nativeAsyncUi.phase==='BEFORE_CLAIM');assert.equal(await p.locator('#dailyJourneyClaim').isDisabled(),true);await p.evaluate(()=>document.querySelector('#dailyJourneyClaim').click());assert.equal(await p.evaluate(()=>__nativeAsyncUi.calls),1,'disabled native element click must not queue a later retry');assert.deepEqual(await retainedRows(pageB,uiAckDbName),initialRows);await uiScreenshot(p,'native-async-ui-pending-390x844.png');
      await p.evaluate(()=>__nativeAsyncUi.release());await p.waitForFunction(()=>__nativeAsyncUi.phase==='CLAIM_COMMITTED_AWAITING_READBACK');const claimed=await readRetained(pageB);assert.equal(claimed.daily.receipts.length,1);assert.equal(claimed.daily.pending.length,1);assert.equal(claimed.daily.receipts[0].request.opId,mounted.claimInput.opId);await p.evaluate(()=>__nativeAsyncUi.release());await p.waitForFunction(()=>document.querySelector('#playerLifeMessage')?.textContent==='SYNTHETIC_POST_COMMIT_CLAIM_ACK_LOST'&&!document.querySelector('#dailyJourneyClaim').disabled);assert.equal(await p.evaluate(()=>__nativeAsyncUi.completions),0);
      await p.locator('#dailyJourneyClaim').click();await p.waitForFunction(()=>__nativeAsyncUi.phase==='FULFILL_COMMITTED_AWAITING_READBACK');const committed=await readRetained(pageB);assert.equal(dailyFacts(committed).stardustQuantity,1);assert.equal(committed.daily.receipts.length,2);await p.evaluate(()=>__nativeAsyncUi.release());await p.waitForFunction(()=>document.querySelector('#playerLifeMessage')?.textContent==='SYNTHETIC_POST_COMMIT_FULFILL_ACK_LOST'&&!document.querySelector('#dailyJourneyClaim').disabled);assert.equal(await p.evaluate(()=>__nativeAsyncUi.completions),0);
      const paidRows=await retainedRows(pageB,uiAckDbName);await p.locator('#dailyJourneyClaim').click();await p.waitForFunction(()=>__nativeAsyncUi.phase==='COMPLETE'&&__nativeAsyncUi.completions===1&&!document.querySelector('#dailyJourneyClaim').disabled);const after=await readRetained(pageB);assert.deepEqual(after,committed);assert.deepEqual(await retainedRows(pageB,uiAckDbName),paidRows);retainedUiPaid={snapshot:after,rows:paidRows};await p.locator('#dailyJourneyClaim').scrollIntoViewIfNeeded();await uiScreenshot(p,'native-async-ui-confirmed-390x844.png');
      const ui=await p.evaluate(()=>{const s=__nativeAsyncUi;return {calls:s.calls,completions:s.completions,messages:s.messages,replays:s.replays,claimInput:s.claimInput,fulfillInput:s.fulfillInput,claimReceipt:s.claimReceipt,fulfillmentReceipt:s.fulfillmentReceipt,legacyWriteAttempts:s.legacyWriteAttempts}});assert.equal(ui.calls,3);assert.equal(ui.completions,1);assert.deepEqual(ui.legacyWriteAttempts,[]);assert.deepEqual(ui.messages,['SYNTHETIC_POST_COMMIT_CLAIM_ACK_LOST','SYNTHETIC_POST_COMMIT_FULFILL_ACK_LOST']);assert.equal(ui.replays.length,3);for(const replay of ui.replays){assert.deepEqual(replay.methods,['add','put','delete','clear']);assert.deepEqual(replay.attempts,[]);assert.deepEqual(replay.receipt,replay.method==='claimRetainedDaily'?ui.claimReceipt:ui.fulfillmentReceipt)}
      assert.deepEqual(ui.claimInput,mounted.claimInput);assert.equal(dailyFacts(after).xp,dailyFacts(before).xp+25);assert.equal(dailyFacts(after).engineXp,dailyFacts(before).engineXp+20);
      return {scope:report.asyncUiFixtureScope,retainedScope:report.retainedFixtureScope,fixtureAt:retainedFixtureAt,injection:'POST_COMMIT_CALLBACK_RESULT_LOSS_NOT_IDB_ABORT',fixturePath:new URL(p.url()).pathname,actualInstaller:true,claimCrossPageReadback:true,fulfillCrossPageReadback:true,ignoredBusyNativeClick:true,explicitRetryClicks:2,before:evidence(before),claimCommitted:evidence(claimed),fulfillCommitted:evidence(committed),after:evidence(after),beforeFacts:dailyFacts(before),claimCommittedFacts:dailyFacts(claimed),fulfillCommittedFacts:dailyFacts(committed),afterFacts:dailyFacts(after),proofRowsHash:digest(paidRows),headDigest:after.retained.headDigest,sequence:after.retained.sequence,retainedGeneration:after.retained.generation,ui,...await retainedUnchanged()};
    });
    await run('ASYNC_DAILY_UI_OWNER_FENCE',async()=>{
      await pageA.evaluate(seedNativeRetainedFixture,{name:uiOwnerDbName,source:dailyMainBaseline,at:retainedFixtureAt,generation:'9'.repeat(32)});const p=await page(context,'UI_OWNER');uiPages.push(['UI_OWNER',p]);const mounted=await mountRetainedUi(p,{name:uiOwnerDbName,at:retainedFixtureAt,mode:'OWNER_REBIND'}),before=await openRetained(pageB,uiOwnerDbName,retainedFixtureAt),otherId=Object.keys(before.records.find(r=>r.ref.domain==='PLAYER_LIFE').value.players).find(id=>id!==before.activePlayerId);
      await p.locator('#dailyJourneyClaim').click();await p.waitForFunction(()=>__nativeAsyncUi.phase==='BEFORE_CLAIM');await p.evaluate(()=>__nativeAsyncUi.release());await p.waitForFunction(()=>__nativeAsyncUi.phase==='CLAIM_COMMITTED_AWAITING_READBACK');const claimed=await readRetained(pageB);assert.equal(claimed.daily.pending.length,1);const claimedRows=await retainedRows(pageB,uiOwnerDbName);
      await p.evaluate(other=>{__nativeAsyncUi.visibleOwner=other;__nativeAsyncUi.ui.open();__nativeAsyncUi.release()},otherId);await p.waitForFunction(()=>__nativeAsyncUi.phase==='STALE_AFTER_CLAIM');const ui=await p.evaluate(()=>({calls:__nativeAsyncUi.calls,completions:__nativeAsyncUi.completions,messages:__nativeAsyncUi.messages,visibleOwner:__nativeAsyncUi.visibleOwner,originalOwner:__nativeAsyncUi.claimInput.playerId,claimInput:__nativeAsyncUi.claimInput,fulfillInput:__nativeAsyncUi.fulfillInput,legacyWriteAttempts:__nativeAsyncUi.legacyWriteAttempts,panelOwnerVisible:document.querySelector('#playerLifePanel')?.textContent.includes(__nativeAsyncUi.visibleOwner)}));
      assert.equal(ui.calls,1);assert.equal(ui.completions,0);assert.deepEqual(ui.messages,[]);assert.deepEqual(ui.legacyWriteAttempts,[]);assert.equal(ui.fulfillInput,null);assert.equal(ui.visibleOwner,otherId);assert.equal(ui.panelOwnerVisible,true);assert.equal(ui.originalOwner,mounted.playerId);const after=await readRetained(pageB);assert.deepEqual(after,claimed);assert.deepEqual(await retainedRows(pageB,uiOwnerDbName),claimedRows);assert.equal(after.activePlayerId,before.activePlayerId);assert.equal(after.selectionEpoch,before.selectionEpoch);
      const lifeBefore=before.records.find(r=>r.ref.domain==='PLAYER_LIFE').value,lifeAfter=after.records.find(r=>r.ref.domain==='PLAYER_LIFE').value;assert.deepEqual(lifeAfter.players[otherId],lifeBefore.players[otherId]);for(const r of before.records.filter(r=>r.ref.domain==='BACKPACK'))assert.deepEqual(after.records.find(a=>a.ref.domain==='BACKPACK'&&a.ref.playerId===r.ref.playerId),r);
      retainedOwnerPending={snapshot:after,rows:claimedRows};await uiScreenshot(p,'native-async-ui-owner-fenced-390x844.png');
      return {scope:report.asyncUiFixtureScope,retainedScope:report.retainedFixtureScope,fixtureAt:retainedFixtureAt,selectionKind:'SYNTHETIC_UI_REBIND_NOT_AUTHORITY_SWITCH',fixturePath:new URL(p.url()).pathname,actualInstaller:true,before:evidence(before),after:evidence(after),beforeFacts:dailyFacts(before),afterFacts:dailyFacts(after),otherPlayerId:otherId,otherLifeHashBefore:digest(lifeBefore.players[otherId]),otherLifeHashAfter:digest(lifeAfter.players[otherId]),allBagsUnchanged:true,authoritySelectionUnchanged:true,proofRowsHash:digest(claimedRows),headDigest:after.retained.headDigest,sequence:after.retained.sequence,retainedGeneration:after.retained.generation,ui,...await retainedUnchanged()};
    });

    report.diagnostics[0].reason='NOT_EXERCISED: exact pre-set CDP interleave is not substituted by the required post-cutover old-writer case';
    for(const [label,p] of [['A',pageA],['B',pageB],...uiPages]){const calls=await p.evaluate(()=>__nativeProviderCalls);report.providerActivity.push({page:label,calls});assert.deepEqual(calls,[],'provider/signing activity is forbidden')}
    const beforeRestart=await read(pageA);dailyBeforeRestart=await readDaily(pageA);await screenshot(pageA,'native-idb-before-restart-390x844.png',beforeRestart,dailyBeforeRestart);
    await run('CLEAN_BROWSER_RESTART',async()=>{
      const oldProcess=browserProcess,firstVersion=report.processLaunches[0].version,closed=await closeObservedContext();pageA=null;pageB=null;
      context=await launch();const newProcess=browserProcess;assert.ok(oldProcess.pid!==newProcess.pid||oldProcess.startTicks!==newProcess.startTicks,'relaunch must replace the browser process');assert.equal(await processObserver.exists(newProcess),true);
      assert.deepEqual(report.processLaunches[1].version,firstVersion,'both launches use the same installed browser build');
      pageA=await page(context,'REOPENED');await openCurrent(pageA);const reopened=await read(pageA);assert.deepEqual(reopened,beforeRestart,'no reseed, storageState import or repair is permitted after browser relaunch');await openDaily(pageA,dailyFixtureAt);const dailyReopened=await readDaily(pageA);assert.deepEqual(dailyReopened,dailyBeforeRestart,'daily receipts and consumption must reopen without reseed or repair');
      const retainedReopened=[];
      for(const entry of [{name:retainedDbName,snapshot:retainedHealthy,rows:retainedProofRows},{name:uiAckDbName,...retainedUiPaid},{name:uiOwnerDbName,...retainedOwnerPending}]){
        const after=await openRetained(pageA,entry.name,retainedFixtureAt),rows=await retainedRows(pageA,entry.name),inspection=await inspectRetainedWithoutWrites(pageA,entry.name,retainedFixtureAt);assert.deepEqual(after,entry.snapshot);assert.deepEqual(rows,entry.rows);assert.equal(inspection.error,null);assert.equal(inspection.result.status,'VERIFIED_CURRENT');assert.deepEqual(inspection.result.candidate,after);assert.deepEqual(inspection.attempts,[]);
        retainedReopened.push({name:entry.name,before:evidence(entry.snapshot),after:evidence(after),beforeProofRowsHash:digest(entry.rows),afterProofRowsHash:digest(rows),dailyFacts:dailyFacts(after),headDigest:after.retained.headDigest,sequence:after.retained.sequence,mutationMethods:inspection.methods,mutationAttempts:inspection.attempts,reseeded:false,repairAttempted:false});
      }
      const retainedHoldReopened=[];
      for(const entry of retainedFaultForks){const rows=await retainedRows(pageA,entry.name),inspection=await inspectRetainedWithoutWrites(pageA,entry.name,retainedFixtureAt);assert.deepEqual(rows,entry.rows);assert.equal(inspection.result,null);assert.equal(inspection.error,entry.error);assert.deepEqual(inspection.attempts,[]);retainedHoldReopened.push({name:entry.name,kind:entry.kind,beforeRawHash:digest(entry.rows),afterRawHash:digest(rows),error:inspection.error,mutationMethods:inspection.methods,mutationAttempts:inspection.attempts,repairAttempted:false})}
      await screenshot(pageA,'native-idb-after-restart-390x844.png',reopened,dailyReopened);
      return {kind:'CLEAN_BROWSER_RESTART',processObservation:'LINUX_OWN_CHILD_PID_STARTTIME',sameProfileDirectory:true,sameOrigin:origin,contextCloseObserved:closed.contextCloseObserved,oldProcessAbsent:closed.oldProcessAbsent,newProcessObserved:true,oldProcess,newProcess,firstVersion,secondVersion:report.processLaunches[1].version,launches,reseeded:false,storageStateImported:false,before:evidence(beforeRestart),after:evidence(reopened),dailyProtocolScope:report.dailyFixtureScope,dailyFixtureAt,dailyAuthorityReopened:true,dailyBefore:evidence(dailyBeforeRestart),dailyAfter:evidence(dailyReopened),dailyFacts:dailyFacts(dailyReopened),retainedProtocolScope:report.retainedFixtureScope,retainedFixtureAt,retainedReopened,retainedHoldReopened};
    });
    assert.deepEqual(report.blockedRequests,[],'unexpected network activity fails even when blocked');assert.deepEqual(report.pageErrors,[],'uncaught page errors must fail native diagnostics');const reopenedCalls=await pageA.evaluate(()=>__nativeProviderCalls);report.providerActivity.push({page:'REOPENED',calls:reopenedCalls});assert.deepEqual(reopenedCalls,[]);assert.ok(report.cases.every(c=>c.status==='PASS'));report.functionalQA='PASS';
  }catch(error){report.functionalQA='FAIL';report.failures.push(String(error.stack||error));if(pageA)await pageA.screenshot({path:out+'/native-idb-failure.png'}).catch(()=>{});throw error}
  finally{
    shuttingDown=true;launchGeneration++;const activeLaunch=pendingLaunch;let cleanupError=null;
    const cleanupAttempt=async work=>{try{await work()}catch(error){cleanupError??=error;report.failures.push('CLEANUP_FAILED:'+String(error))}};
    await cleanupAttempt(async()=>{for(const ctx of [...ownedContexts.keys()])await closeOwnedContext(ctx)});
    // A timed-out case may still be acquiring a context. Its generation is revoked;
    // wait for its late-close path before inspecting/deleting the disposable profile.
    if(activeLaunch)await cleanupAttempt(()=>bounded(activeLaunch.then(()=>{},()=>{}),'settle-owned-launch',30000));
    await cleanupAttempt(async()=>{for(const ctx of [...ownedContexts.keys()])await closeOwnedContext(ctx)});
    if(!cleanupError)await cleanupAttempt(async()=>{if(profileDir){assert.equal(await processObserver.find(profileDir,{allowAbsent:true}),null,'no profile process may remain before directory cleanup');await rm(profileDir,{recursive:true,force:true})}});
    report.cleanup=cleanupError?{status:'FAIL',error:String(cleanupError.stack||cleanupError),profilePreserved:true}:{status:'PASS',profileRemoved:Boolean(profileDir)};
    const passedBeforeCleanup=report.functionalQA==='PASS';if(cleanupError)report.functionalQA='FAIL';
    report.launches=launches;report.finishedAt=new Date().toISOString();await checkpoint();
    if(cleanupError&&passedBeforeCleanup)throw cleanupError; // Preserve the original scenario error when there is one.
  }
  console.log('PASS native IndexedDB adapter diagnostics; production cutover remains HOLD');
}
