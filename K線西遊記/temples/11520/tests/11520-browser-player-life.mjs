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

async function runNativeIdbDiagnostics(){
  const {mkdtemp,rm}=fs,{tmpdir}=await import('node:os'),path=await import('node:path'),{createHash}=await import('node:crypto');
  const out='artifacts/11520-player-life-idb-qa',base=process.env.K11520_BASE_URL||'http://127.0.0.1:4173',origin=new URL(base).origin;
  const root='K線西遊記/temples/11520/',pinned='b513d4e7ca87ebfb5adf5c03b8d2c26ff834b720',dbName='KAIOS_LOCAL_GAME_TEST:native-adapter';
  const required=['NATIVE_IDB','CROSS_TAB_STALE_CAS','SIMULTANEOUS_CAS','REFRESH_EXPLICIT_RETRY','SELECTION_EPOCH_ISOLATION','MULTI_RECORD_ABORT','ATOMIC_COURIER_CREDIT','CORRUPT_RECORD_PRESERVATION','FULL_RECORD_ABSENCE_AND_CORRUPTION','REVIEW_CAPTURE_SOURCE_PRESERVATION','PINNED_OLD_WRITES_ISOLATED','CLEAN_BROWSER_RESTART'];
  const digest=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
  const report={schema:'K11520_NATIVE_IDB_DIAGNOSTICS_V1',scope:'NATIVE_ADAPTER_DIAGNOSTICS',fixtureSeeding:'SYNTHETIC_DIRECT_IDB_NOT_MIGRATION',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),tree:execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim(),ciHead:process.env.GITHUB_SHA||null,trackedDirty:Boolean(execFileSync('git',['status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim()),functionalQA:'RUNNING',visualQA:'ADAPTER_DIAGNOSTIC_ONLY_NOT_PRODUCT_VISUAL_QA',releaseStatus:'HOLD',wholePlayerLifeP0:'INCOMPLETE',origin,pinnedHead:pinned,startedAt:new Date().toISOString(),cases:required.map(id=>({id,required:true,status:'NOT_RUN'})),diagnostics:[{id:'OLD_PRE_SET_INTERLEAVE',required:false,status:'NOT_EXERCISED'},{id:'BFCACHE',required:false,status:'NOT_EXERCISED'},{id:'REAL_DISK_QUOTA_OR_POWER_LOSS',required:false,status:'NOT_EXERCISED'}],servedSources:[],screenshots:[],blockedRequests:[],pageErrors:[],providerActivity:[],failures:[],limitations:['No production caller, full cutover or migration is exercised.','Clean browser restart is not crash or power-loss proof.','Injected native transaction abort is not physical disk/quota failure.','Diagnostic fixture screenshots do not establish product visual QA.']};
  await fs.mkdir(out,{recursive:true});let context=null,profileDir=null,pageA=null,pageB=null,launches=0;
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
      if(url.pathname==='/__native_idb_fixture__.html')return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Native IDB adapter diagnostic</title><style>body{font:16px system-ui;padding:20px;background:#101820;color:#e6f1f5}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}</style><h1>Native IDB diagnostic</h1><p>Synthetic adapter fixture · production migration and UI remain unverified.</p><pre id="evidence">Starting</pre><button id="backpackButton" hidden>Fixture guard: no item preview renderer</button>'});
      const old=url.pathname.startsWith('/__pinned_legacy__/'),file=decodeURI(url.pathname.slice(old?'/__pinned_legacy__/'.length:1)),body=(old?legacy:current).get(file);
      if(body!==undefined&&!url.search){const source={version:old?'PINNED_OLD':'CURRENT',path:file,sha256:digest(body)};if(!report.servedSources.some(s=>s.version===source.version&&s.path===file))report.servedSources.push(source);return route.fulfill({status:200,contentType:'text/javascript',body})}
      report.blockedRequests.push({url:url.origin+url.pathname,method:request.method()});return route.abort('blockedbyclient');
    });
    await ctx.addInitScript(()=>{globalThis.__nativeProviderCalls=[];Object.defineProperty(globalThis,'ethereum',{configurable:false,get(){__nativeProviderCalls.push('ethereum');throw Error('PROVIDER_FORBIDDEN_IN_NATIVE_IDB_QA')}});globalThis.__signPlayerLifeFixture=()=>{__nativeProviderCalls.push('signing');throw Error('SIGNER_FORBIDDEN_IN_NATIVE_IDB_QA')}});
  }
  async function launch(){const ctx=await chromium.launchPersistentContext(profileDir,{headless:true,viewport:{width:390,height:844},serviceWorkers:'block',timeout:20000});launches++;await routeContext(ctx);report.browserVersion=ctx.browser().version();report.playwrightVersion=JSON.parse(await fs.readFile('node_modules/playwright/package.json','utf8')).version;return ctx}
  async function page(ctx,label){const p=await ctx.newPage();p.setDefaultTimeout(10000);p.on('pageerror',error=>report.pageErrors.push({page:label,error:String(error)}));await p.goto(fixtureUrl+'#'+label,{waitUntil:'domcontentloaded'});return p}
  async function openCurrent(p,name=dbName){return p.evaluate(async({lifeUrl,name})=>{const life=await import(lifeUrl);const store=life.createLocalGameAuthority({indexedDB:globalThis.indexedDB,crypto:globalThis.crypto,databaseName:name});await store.openGame();globalThis.__nativeCurrent={life,store,name};return {factory:Object.prototype.toString.call(indexedDB),secureContext:isSecureContext}}, {lifeUrl:moduleUrl('runtime/player-life-runtime.mjs'),name})}
  const read=p=>p.evaluate(()=>__nativeCurrent.store.readGame());
  const expected=s=>({authorityEpoch:s.authorityEpoch,selectionEpoch:s.selectionEpoch,catalogRevision:s.catalogRevision,records:s.records.map(({ref,revision})=>({ref,revision}))});
  const evidence=s=>({hash:digest(s),authorityEpoch:s.authorityEpoch,selectionEpoch:s.selectionEpoch,activePlayerId:s.activePlayerId,records:s.records.map(r=>({ref:r.ref,revision:r.revision,sha256:digest(r.value),consumed:r.ref.domain==='PRODUCT'?{delivery:r.value.progress.courierReceipts,insurance:Object.keys(r.value.progress.courierInsuranceReceipts)}:r.ref.domain==='BACKPACK'?r.value.rewardReceipts:r.ref.domain==='COURIER'?r.value.settledReceipts:r.value.usedNonces}))});
  async function command(p,s,kind='PLAYER_UPDATE',patch={}){return p.evaluate(async({s,kind,patch,expected})=>{const input={kind,playerId:patch.playerId||s.activePlayerId,owner:'guest',expected};if(kind==='SWITCH')return __nativeCurrent.store.commandGame(input);if(kind==='OWN_COURIER_TRANSACTION')input.missionId='NATIVE-COURIER';return __nativeCurrent.store.commandGame(input,records=>{if(kind==='PLAYER_UPDATE'){const life=records.find(r=>r.ref.domain==='PLAYER_LIFE').value,p=life.players[s.activePlayerId];if(patch.name)p.displayName=patch.name;if(patch.pronoun)p.pronoun=patch.pronoun}else{const product=records.find(r=>r.ref.domain==='PRODUCT'&&r.ref.playerId===s.activePlayerId).value,courier=records.find(r=>r.ref.domain==='COURIER').value,m=courier.missions['NATIVE-COURIER'],credit=m.settlement.credit,{status,...binding}=credit;product.progress.kaios+=credit.rewardKaios;product.progress.xp+=12;product.progress.events.COURIER_SETTLEMENT=(product.progress.events.COURIER_SETTLEMENT||0)+1;product.progress.courierReceipts.push(credit.receiptId);product.progress.courierReceiptBindings[credit.receiptId]=binding;credit.status='CONFIRMED';m.status='DELIVERED';m.settlement.outcome='DELIVERED';m.cargo.ownerState='DELIVERED_TO_DESTINATION';m.cargo.ownerLifeId=null;delete courier.activeByCourier[s.activePlayerId]}})}, {s,kind,patch,expected:expected(s)})}
  async function screenshot(p,file,s){await p.evaluate(value=>{document.getElementById('evidence').textContent=JSON.stringify(value,null,2)}, {scope:report.scope,functionalQA:report.functionalQA,canonical:evidence(s),releaseStatus:'HOLD',wholePlayerLifeP0:'INCOMPLETE'});await p.screenshot({path:out+'/'+file});report.screenshots.push({file,width:390,height:844,kind:'ADAPTER_DIAGNOSTIC_NOT_PRODUCT_UI'});await checkpoint()}
  try{
    const parsed=new URL(base);assert.ok(['127.0.0.1','localhost'].includes(parsed.hostname)&&parsed.protocol==='http:'&&!parsed.username&&!parsed.password&&!parsed.search&&!parsed.hash&&['','/'].includes(parsed.pathname),'native mode requires a plain loopback origin');
    assert.equal(execFileSync('git',['rev-parse',pinned+'^{commit}'],{encoding:'utf8'}).trim(),pinned,'exact pinned old object is mandatory');
    for(const file of ['runtime/player-life-runtime.mjs','runtime/backpack-runtime.mjs','runtime/kgen-margin-runtime.mjs','runtime/digital-ant-logistics-runtime.mjs'])await collect(root+file,current,false);
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
    report.diagnostics[0].reason='NOT_EXERCISED: exact pre-set CDP interleave is not substituted by the required post-cutover old-writer case';
    for(const [label,p] of [['A',pageA],['B',pageB]]){const calls=await p.evaluate(()=>__nativeProviderCalls);report.providerActivity.push({page:label,calls});assert.deepEqual(calls,[],'provider/signing activity is forbidden')}
    const beforeRestart=await read(pageA);await screenshot(pageA,'native-idb-before-restart-390x844.png',beforeRestart);
    await run('CLEAN_BROWSER_RESTART',async()=>{const oldBrowser=context.browser();let disconnected=false,closed=false;const disconnectedEvent=new Promise(resolve=>oldBrowser.once('disconnected',()=>{disconnected=true;resolve()}));context.once('close',()=>{closed=true});await context.close();await bounded(disconnectedEvent,'old-browser-disconnect',5000);assert.equal(closed,true);assert.equal(disconnected,true);assert.equal(oldBrowser.isConnected(),false);context=null;pageA=null;pageB=null;context=await launch();pageA=await page(context,'REOPENED');await openCurrent(pageA);const reopened=await read(pageA);assert.deepEqual(reopened,beforeRestart,'no reseed, storageState import or repair is permitted after browser relaunch');await screenshot(pageA,'native-idb-after-restart-390x844.png',reopened);return {kind:'CLEAN_BROWSER_RESTART',sameProfileDirectory:true,sameOrigin:origin,oldContextClosed:closed,oldBrowserDisconnected:disconnected,newBrowserConnected:context.browser().isConnected(),launches,reseeded:false,storageStateImported:false,before:evidence(beforeRestart),after:evidence(reopened)}});
    assert.deepEqual(report.blockedRequests,[],'unexpected network activity fails even when blocked');assert.deepEqual(report.pageErrors,[],'uncaught page errors must fail native diagnostics');const reopenedCalls=await pageA.evaluate(()=>__nativeProviderCalls);report.providerActivity.push({page:'REOPENED',calls:reopenedCalls});assert.deepEqual(reopenedCalls,[]);assert.ok(report.cases.every(c=>c.status==='PASS'));report.functionalQA='PASS';console.log('PASS native IndexedDB adapter diagnostics; production cutover remains HOLD');
  }catch(error){report.functionalQA='FAIL';report.failures.push(String(error.stack||error));if(pageA)await pageA.screenshot({path:out+'/native-idb-failure.png'}).catch(()=>{});throw error}
  finally{report.launches=launches;report.finishedAt=new Date().toISOString();await checkpoint();if(context)await context.close().catch(()=>{});if(profileDir)await rm(profileDir,{recursive:true,force:true})}
}
