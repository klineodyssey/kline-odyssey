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
async function nativeMovementC(page,value){await page.locator('#cNumericInput').fill(String(value));await page.locator('#cNumericInput').press('Enter');await page.waitForFunction(c=>globalThis.__K11520_SIGNED_C_IMMERSIVE__?.signedC===c,value)}
async function killFirstMonster(page){
  await closePanels(page);
  await nativeMovementC(page,.1);
  const joy=await page.locator('#joy').boundingBox(),x=joy.x+joy.width/2,y=joy.y+joy.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y-40,{steps:5});
  try{await page.waitForFunction(()=>__K11520_KSPACE_COMBAT__?.distance<2,null,{timeout:15000})}finally{await page.mouse.up()}
  await nativeMovementC(page,0);const before=(await snap(page)).player.xp;
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
  await closePanels(page);await nativeMovementC(page,.1);
  const before=await page.evaluate(()=>({distance:__K11520_KSPACE_COMBAT__.distance,xyz:{...__K11520_WORLD_COORDS__.physical}}));
  const joy=await page.locator('#joy').boundingBox(),x=joy.x+joy.width/2,y=joy.y+joy.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y-40,{steps:6});
  try{await page.waitForFunction(()=>__K11520_KSPACE_COMBAT__.distance<1.9,null,{timeout:15000})}finally{await page.mouse.up()}
  const after=await page.evaluate(()=>({distance:__K11520_KSPACE_COMBAT__.distance,xyz:{...__K11520_WORLD_COORDS__.physical}}));
  assert(after.distance<2);assert(after.xyz.z>before.xyz.z,'real joystick must move forward, not teleport target');await nativeMovementC(page,0);return {before,after};
}
async function selectEncounterUI(page,id){
  await openLife(page);const button=page.locator(`[data-journey-encounter="${id}"]`);await expandDetails(page,`[data-journey-encounter="${id}"]`);assert.equal(await button.isEnabled(),true,id+' unlocked');await button.scrollIntoViewIfNeeded();await button.click();
  await page.waitForFunction(expected=>__K11520_KSPACE_COMBAT__?.target?.profileId===expected,id);
}
async function pursueMovingEncounter(page){
  const state=await page.evaluate(()=>__K11520_KSPACE_COMBAT__);
  if(state.target.state==='DEAD'||state.distance<=1.2||await page.locator('#journeyRecover').isVisible())return;
  const priorC=await page.evaluate(()=>globalThis.__K11520_SIGNED_C_IMMERSIVE__.signedC);await nativeMovementC(page,.1);
  // Roaming lives are no longer stationary. Use the existing physical joystick,
  // not a teleport/frozen target or wider attack radius. Keep all strike limits.
  const joy=await page.locator('#joy').boundingBox(),x=joy.x+joy.width/2,y=joy.y+joy.height/2;
  const d=Math.hypot(state.relative.x,state.relative.z)||1;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+state.relative.x/d*35,y-state.relative.z/d*35,{steps:4});
  try{await page.waitForFunction(()=>__K11520_KSPACE_COMBAT__.distance<.8||document.querySelector('#journeyRecover')?.getBoundingClientRect().width>0,null,{timeout:5000})}finally{await page.mouse.up();await nativeMovementC(page,priorC)}
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
      await page.waitForFunction(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__?.active);await page.locator('#sheet').waitFor({state:'hidden'});await nativeMovementC(page,.1);
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
