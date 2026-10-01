/* KGEN_META
STATUS: CANDIDATE
PURPOSE: Real Chromium Player Life isolation, persistence and mobile visual evidence.
AUTHORITY: Synthetic local browser profiles only; no cloud, real wallet or chain writes.
*/
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
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
const report={head:process.env.GITHUB_SHA||'LOCAL_CANDIDATE',scope:'LOCAL_UNTRUSTED_GAME_DATA',functional:'RUNNING',visual:'SCREENSHOTS_REQUIRE_DIRECT_REVIEW',profiles:[],failures:[]};
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
  if(await page.locator('#enter11520').isVisible()&&await page.locator('#enter11520').isEnabled())await page.locator('#enter11520').click({timeout:1500}).catch(()=>{});
  await page.locator('#intro11520').waitFor({state:'hidden'});
  await page.locator('#charState').filter({hasText:/READY|FALLBACK/}).waitFor({timeout:45000});
}
async function openLife(page){
  if(await page.locator('#sheet').isVisible())await page.locator('#sheetClose').click();
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
async function reloadAction(page,selector){
  await page.bringToFront();await reachable(page,selector);
  await Promise.all([page.waitForEvent('domcontentloaded',{timeout:30000}),page.locator(selector).click()]);
  await page.waitForFunction(()=>globalThis.__K11520_PLAYER_LIFE__?.snapshot?.().player&&globalThis.K11520Backpack?.get&&globalThis.__K11520_SIMULATION_EXCHANGE__);
}
async function expandDetails(page,selector){const details=page.locator(selector).locator('xpath=ancestor::details[1]');if(!await details.evaluate(el=>el.open))await details.locator('summary').click();}
async function closePanels(page){
  if(await page.locator('#sheet').isVisible())await page.locator('#sheetClose').click();
  if(await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
}
async function killFirstMonster(page){
  await closePanels(page);
  await page.locator('#cNumericInput').fill('0');await page.locator('#cNumericInput').press('Enter');
  const joy=await page.locator('#joy').boundingBox(),x=joy.x+joy.width/2,y=joy.y+joy.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y-40,{steps:5});
  try{await page.waitForFunction(()=>__K11520_KSPACE_COMBAT__?.distance<2,null,{timeout:15000})}finally{await page.mouse.up()}
  const before=(await snap(page)).player.xp;
  for(let i=0;i<30&&(await snap(page)).player.xp===before;i++){await page.locator('#attack').click();await page.waitForTimeout(400)}
  const after=await snap(page);assert.ok(after.player.xp>before,'real monster interaction must grant canonical XP');assert.equal(after.player.inventory.ownerPlayerId,after.player.playerId);assert.ok(await page.evaluate(()=>K11520Backpack.get().items.length>0),'loot appears in the single scoped backpack');
  return after;
}

try{
  for(const [width,height] of [[390,844],[844,390]].filter(([w])=>!process.env.K11520_PLAYER_QA_SCENARIO&&(!process.env.K11520_PLAYER_QA_VIEW||String(w)===process.env.K11520_PLAYER_QA_VIEW))){
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
      await page.locator('#charState').filter({hasText:/READY|FALLBACK/}).waitFor({timeout:45000});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));profile.homeVisual=await page.evaluate(()=>__K11520_WORLD_SELECTION_PROJECTION__.playerHomeSnapshot());
      await shot(page,`${width}x${height}-home-navigation`);profile.checks.push('REAL_HOME_NAVIGATION');
      const calls=await page.evaluate(()=>__playerLifeWalletFixture.calls);assert.equal(calls.some(m=>!/^(eth_accounts|eth_requestAccounts|eth_chainId|eth_getBalance|eth_call|personal_sign)$/.test(m)),false,'no transaction or approval method allowed');
      assert.deepEqual(await page.evaluate(()=>__playerLifeWalletFixture.sensorCalls),[],'Player Life does not request location');
      assert.deepEqual(profile.pageErrors,[],'Player Life paths must not throw uncaught browser errors');
    }catch(error){profile.failureState=await page.evaluate(()=>({life:globalThis.__K11520_PLAYER_LIFE__?.snapshot(),xyz:globalThis.__K11520_WORLD_COORDS__,nav:globalThis.__K11520_XYZ_MAP_NAVIGATION__,visibility:document.visibilityState,message:document.querySelector('#playerLifeMessage')?.textContent,sheetTitle:document.querySelector('#sheetTitle')?.textContent,sheetChildren:document.querySelector('#sheetBody')?.children.length})).catch(()=>null);await shot(page,`${width}x${height}-failure`).catch(()=>{});throw error}
    finally{await context.close()}
  }
  for(const scenario of ['CORRUPT_SAVE','STORAGE_UNAVAILABLE','QUOTA_EXCEEDED'].filter(s=>!process.env.K11520_PLAYER_QA_SCENARIO||s===process.env.K11520_PLAYER_QA_SCENARIO)){
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
