import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

assert.ok(!process.argv.includes('--local-store-integrity-only')||!(process.env.K11520_COURIER_REVIEW_ONLY==='1'||process.env.K11520_COURIER_DESKTOP_ONLY==='1'),'select only one isolated browser mode');
if(!process.argv.includes('--local-store-integrity-only')){
const OUT='artifacts/11520-visual-qa';
const BASE_URL=process.env.K11520_TEST_BASE_URL||'http://127.0.0.1:4173';
const processStarted=performance.now();
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
const reviewOnly=process.env.K11520_COURIER_REVIEW_ONLY==='1',desktopOnly=process.env.K11520_COURIER_DESKTOP_ONLY==='1';
assert.ok(!(reviewOnly&&desktopOnly),'select only one isolated browser mode');
const errors=[];
if(!reviewOnly){
let page,diagnosticMissionId=null,expectedCourierLifeId=null,diagnosticRunning=false;
const diagnosticPrefix=desktopOnly?'11520-living-world-desktop':'11520-living-world';
const stageTimes=[],elapsed=()=>Math.round(performance.now()-processStarted);
const stage=async name=>{
  const entry={name,elapsedMs:elapsed(),remainingBudgetMs:Math.max(0,90000-elapsed())};
  stageTimes.push(entry);console.log('[11520 LIVING STAGE]',JSON.stringify(entry));
  await fs.writeFile(`${OUT}/${diagnosticPrefix}-timings.json`,JSON.stringify({sourceSha:process.env.GITHUB_SHA||'LOCAL',budgetMs:90000,stages:stageTimes},null,2));
};
// Read-only evidence before the unchanged outer 90s cap. This timer does not
// retry, advance game time, suppress failures, or extend any assertion timeout.
const captureDiagnostic=async (reason,{screenshot=true}={})=>{
  if(diagnosticRunning)return;diagnosticRunning=true;
  const report={reason,elapsedMs:elapsed(),remainingBudgetMs:Math.max(0,90000-elapsed()),stage:stageTimes.at(-1)?.name,stages:[...stageTimes]};
  let timer;
  try{
    report.state=await Promise.race([page.evaluate(({missionId,expectedLifeId})=>{
      const product=globalThis.__K11520_PRODUCT__?.snapshot?.(),store=globalThis.__K11520_PLAYER_COURIER__;
      const stored=JSON.parse(localStorage.getItem('K11520_PLAYER_COURIER')||'null'),live=missionId?store?.snapshot?.(missionId)?.mission:null,persisted=stored?.missions?.[missionId];
      const mission=m=>m?{status:m.status,claimStatus:m.insurance?.claimStatus,insuranceStatus:m.insurance?.status,premiumPaidKaios:m.insurance?.premiumPaidKaios,payoutKaios:m.insurance?.payoutKaios,receiptPresent:!!m.insurance?.payoutReceiptId,cargoOwnerState:m.cargo?.ownerState}:null;
      return {readyState:document.readyState,charState:document.getElementById('charState')?.textContent,introVisible:!!document.getElementById('intro11520')?.getClientRects().length,storeReady:!!store,productReady:!!product,expectedPlayerActive:!!expectedLifeId&&product?.playerId===expectedLifeId,liveMission:mission(live),persistedMission:mission(persisted),courierRevision:stored?.revision,localKaios:product?.kaios,productPersistent:product?.persistent,productStorageStatus:product?.storageStatus,insuranceReceiptCount:Object.keys(product?.courierInsuranceReceipts||{}).length,expectedReceiptRecorded:!!persisted?.insurance?.payoutReceiptId&&product?.courierInsuranceReceipts?.[persisted.insurance.payoutReceiptId]===persisted.insurance.payoutKaios};
    },{missionId:diagnosticMissionId,expectedLifeId:expectedCourierLifeId}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('DIAGNOSTIC_STATE_TIMEOUT')),1500)})]);
  }catch(error){report.stateError=String(error)}finally{clearTimeout(timer)}
  // No local profile names, wallet addresses, full storage dumps or credentials.
  await fs.writeFile(`${OUT}/${diagnosticPrefix}-${reason}.json`,JSON.stringify(report,null,2));
  if(screenshot)await page?.screenshot({path:`${OUT}/${diagnosticPrefix}-${reason}.png`,timeout:1500}).catch(()=>{});
  diagnosticRunning=false;
};
const watchdog=setTimeout(()=>{void captureDiagnostic('pre-timeout').catch(error=>console.error('Diagnostic capture failed',String(error)))},Math.max(0,80000-elapsed()));
try{
if(desktopOnly){
await stage('desktop-boot');
page=await browser.newPage({viewport:{width:1280,height:800},isMobile:false,hasTouch:false});
page.on('pageerror',e=>errors.push(String(e)));
await page.goto(`${BASE_URL}/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html`,{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2200);
if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click().catch(()=>{});
await page.waitForTimeout(700);

await page.waitForFunction(()=>globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__?.snapshot?.()?.lifeId==='DIGITAL_ANT_0001',null,{timeout:5000});
// Desktop starts fresh, then crosses the compact breakpoint in both tray states.
const verifyDesktopContext=async(label)=>{
  const boxes=await page.evaluate(()=>['cargoInterceptionButton','homeDeliveryButton'].map(id=>{const el=document.getElementById(id),r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{id,x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,hit:el===hit||el.contains(hit)}}));
  for(const box of boxes){assert.ok(box.width>=44&&box.height>=44&&box.hit,`${label}: ${box.id} owns its desktop touch target`);assert.ok(box.x>=0&&box.y>=0&&box.right<=1280&&box.bottom<=800)}
  assert.ok(boxes[0].bottom<=boxes[1].y||boxes[1].bottom<=boxes[0].y,`${label}: desktop Courier/Raid cannot overlap`);
  await page.screenshot({path:`${OUT}/desktop-context-${label}-1280x800.png`});
};
const desktopMoreStyle=await page.locator('#k11520UtilityMaster').evaluate(el=>{const s=getComputedStyle(el);return{label:el.textContent,color:s.color,background:s.backgroundColor}});
assert.equal(desktopMoreStyle.label,'☰');assert.equal(desktopMoreStyle.color,'rgb(223, 250, 255)');assert.match(desktopMoreStyle.background,/^rgba?\(16, 25, 35/,'native desktop More keeps the existing readable dark control style');
assert.equal(await page.locator('#cargoInterceptionButton').isVisible(),false,'fresh desktop idle Raid hidden');
assert.equal(await page.locator('#homeDeliveryButton').isVisible(),false,'fresh desktop idle Courier hidden');
await page.screenshot({path:`${OUT}/desktop-context-idle-1280x800.png`});
await page.locator('#k11520UtilityMaster').click();await verifyDesktopContext('fresh-open');
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);await page.setViewportSize({width:1280,height:800});await page.waitForTimeout(150);await verifyDesktopContext('rotate-open');
await page.locator('#k11520UtilityMaster').click();await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);await page.setViewportSize({width:1280,height:800});await page.waitForTimeout(150);
assert.equal(await page.locator('#cargoInterceptionButton').isVisible(),false,'rotated desktop idle Raid hidden');
assert.equal(await page.locator('#homeDeliveryButton').isVisible(),false,'rotated desktop idle Courier hidden');
// Native desktop verifies actual context clicks with its own isolated local mission.
await page.locator('#k11520UtilityMaster').click();
await page.locator('#cargoInterceptionButton').click();await page.locator('#sheet.open').waitFor();assert.match(await page.locator('#sheetTitle').textContent(),/ATM|導彈攔截/);await page.locator('#sheetClose').click();
await page.locator('#homeDeliveryButton').click();await page.locator('#homeRequest').waitFor({state:'visible'});
await page.locator('#homeDeliveryMode').selectOption('PLAYER_COURIER');await page.locator('#homeAmount').fill('2400');await page.locator('#homeRequest').click();await page.locator('#homeLaunch').click();
await page.waitForFunction(()=>globalThis.__K11520_PLAYER_COURIER__?.active?.()?.status==='ACTIVE');
await page.locator('#k11520UtilityMaster').click();assert.equal(await page.locator('#homeDeliveryButton').isVisible(),true,'native desktop active Courier visible with More closed');
await page.locator('#homeDeliveryButton').click();assert.equal(await page.locator('#playerCourierDetails').isVisible(),true);await page.screenshot({path:`${OUT}/desktop-native-active-courier-1280x800.png`});
await page.close();
await stage('desktop-complete');assert.deepEqual(errors,[]);
console.log('11520 native desktop contextual Courier/Raid QA PASS');
}else{
await stage('mobile-boot');
// Preserve the original mobile touch context and fresh state for all mobile QA.
page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(String(e)));
await page.goto(`${BASE_URL}/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html`,{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2200);if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click().catch(()=>{});await page.waitForTimeout(700);
await page.waitForFunction(()=>globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__?.snapshot?.()?.lifeId==='DIGITAL_ANT_0001',null,{timeout:5000});
assert.equal(await page.locator('#cargoInterceptionButton').isVisible(),false,'inactive Raid stays out of the world');
assert.equal(await page.locator('#homeDeliveryButton').isVisible(),false,'inactive Courier stays out of the world');
await page.locator('#k11520UtilityMaster').click();
assert.equal(await page.locator('#cargoInterceptionButton').isVisible(),true,'Raid remains available in the existing More rail');
assert.equal(await page.locator('#homeDeliveryButton').isVisible(),true,'cash/goods home delivery must be visible in the first mobile viewport');
const missileButtonBox=await page.locator('#cargoInterceptionButton').boundingBox();
assert.ok(missileButtonBox&&missileButtonBox.x>=0&&missileButtonBox.y>=0&&missileButtonBox.x+missileButtonBox.width<=390&&missileButtonBox.y+missileButtonBox.height<=844,'missile interception entry must remain inside 390x844');
assert.ok(missileButtonBox&&missileButtonBox.width>=44&&missileButtonBox.height>=44,'raid context action must retain a 44px touch target');
const homeButtonBox=await page.locator('#homeDeliveryButton').boundingBox();
assert.ok(homeButtonBox&&homeButtonBox.x>=0&&homeButtonBox.y>=0&&homeButtonBox.x+homeButtonBox.width<=390&&homeButtonBox.y+homeButtonBox.height<=844,'home delivery entry must remain inside 390x844');
assert.ok(homeButtonBox&&homeButtonBox.width>=44&&homeButtonBox.height>=44,'courier context action must retain a 44px touch target');
await page.screenshot({path:`${OUT}/11520-missile-entry-visible.png`});
await page.locator('#homeDeliveryButton').click();
await page.locator('#homeRequest').waitFor({state:'visible'});
assert.match(await page.locator('#sheetBody').textContent(),/二選一物流玩法/);
assert.match(await page.locator('#sheetBody').textContent(),/貨物本金是受限/);
await page.locator('#homeDeliveryMode').selectOption('PLAYER_COURIER');await page.locator('#homeAmount').fill('2400');await page.locator('#homeInsurance').selectOption('YES');await page.locator('#homeRequest').click();
assert.match(await page.locator('#homeDeliveryReceipt').textContent(),/Player Courier/);await page.locator('#homeLaunch').click();
await page.waitForFunction(()=>globalThis.__K11520_PLAYER_COURIER__?.active?.()?.status==='ACTIVE',null,{timeout:3000});
const courierMission=await page.evaluate(()=>globalThis.__K11520_PLAYER_COURIER__.active());assert.equal(courierMission.backgroundMission,true);assert.equal(courierMission.blocksMovement,false);assert.equal(courierMission.blocksCombat,false);assert.equal(courierMission.blocksExploration,false);assert.equal(courierMission.cargo.ownerState,'OWNED_BY_COURIER');assert.equal(courierMission.insurance.status,'QUOTE_ONLY','insurance remains a quote when the local premium cannot be paid');
assert.equal(await page.locator('#playerCourierChip').isVisible(),false,'legacy top courier chip must not occupy the world area');
await page.locator('#k11520UtilityMaster').click();
assert.equal(await page.locator('#homeDeliveryButton').isVisible(),true,'active Courier remains visible after closing More');
await page.setViewportSize({width:1280,height:800});await page.waitForTimeout(150);
assert.equal(await page.locator('#homeDeliveryButton').isVisible(),true,'active desktop Courier remains visible with More closed');
await page.locator('#homeDeliveryButton').click();assert.equal(await page.locator('#playerCourierDetails').isVisible(),true);await page.screenshot({path:`${OUT}/desktop-context-active-courier-1280x800.png`});await page.locator('#homeDeliveryButton').click();
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);

assert.match(await page.locator('#homeDeliveryButton').getAttribute('aria-label'),/Courier 外送中/);await page.locator('#homeDeliveryButton').click();assert.equal(await page.locator('#playerCourierDetails').isVisible(),true);assert.match(await page.locator('#playerCourierDetails').textContent(),/不鎖定移動、戰鬥、探索或回家/);await page.screenshot({path:`${OUT}/11520-player-courier-390x844.png`});await page.locator('#homeDeliveryButton').click();
await page.evaluate(()=>globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__.open());
await page.waitForSelector('#atmMovementC',{timeout:3000});
await page.locator('#atmMovementC').selectOption('0.1');
await page.locator('#atmAmount').fill('1000');
const initialY=await page.evaluate(()=>globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__.snapshot().position.y);
await page.locator('#atmDispatch').click();
assert.match(await page.locator('#atmInsuranceStatus').textContent(),/UNDERWRITING_READY/,'independent local reserve should produce a visible underwriting-ready quote');
await page.locator('#atmInsure').click();
assert.match(await page.locator('#atmInsuranceStatus').textContent(),/LOCAL_SIMULATION_COVERED/,'insurance activation must remain explicitly local simulation');
await page.locator('#atmLoad').click();
await page.waitForFunction(y=>{
  const snapshot=globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__?.snapshot?.();
  return snapshot?.mission?.transportMode==='ATM_UFO_5D'&&snapshot.position.y>y;
},initialY,{timeout:4000});
const liveFlight=await page.evaluate(()=>globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__.snapshot());
assert.equal(liveFlight.lifeId,'DIGITAL_ANT_0001');
assert.equal(liveFlight.vehicle.type,'ATM_UFO_5D');
assert.equal(liveFlight.mission.amount,1000);
assert.equal(liveFlight.mission.unit,'KAIOS');
assert.equal(liveFlight.mission.flightPlan.flatRoute,false);
assert.ok(liveFlight.position.y>initialY,'production ATM UI must move the real Digital Ant UFO upward in XYZ');
assert.equal(liveFlight.cargoRisk.policy.mode,'LOCAL_SIMULATION_COVERED');
assert.equal(liveFlight.cargoRisk.policy.cargoPrincipalAsReserve,false);
assert.equal(await page.evaluate(()=>globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__.runtimeId),'DIGITAL_ANT_5D_ATM_UFO');
const kaiosBeforeForgedRaid=await page.evaluate(()=>globalThis.__K11520_PRODUCT__.snapshot().kaios);
await page.evaluate(()=>document.dispatchEvent(new CustomEvent('k11520:cargo-robbery-resolved',{detail:{rewardKaios:100,incidentId:'RAID-deadbeef',outcome:'ROBBERY_SUCCESS_LOCAL_REWARD'}})));
await page.waitForTimeout(30);
assert.equal(await page.evaluate(()=>globalThis.__K11520_PRODUCT__.snapshot().kaios),kaiosBeforeForgedRaid,'caller-invented raid event cannot mint local KAIOS');
await page.locator('#atmRaid').click();
await page.locator('#missileKaiosMass').waitFor({state:'visible'});
assert.match(await page.locator('#sheetTitle').textContent(),/導彈攔截/);
assert.match(await page.locator('#sheetBody').textContent(),/撞擊動能/,'missile panel must show a physics preview');
await page.locator('#atmMissileLaunch').click();
assert.match(await page.locator('#logisticsActionToast').textContent(),/不能發射：INSUFFICIENT_LOCAL_KAIOS_AMMUNITION/,'zero local KAIOS must fail visibly instead of creating free ammunition');
await page.waitForTimeout(80);
assert.equal(await page.locator('#logisticsActionToast').getAttribute('role'),'status');
assert.equal(await page.locator('#logisticsActionToast').evaluate(node=>node.classList.contains('show')),true,'raid feedback must remain visibly announced after the next animation frame');
await page.screenshot({path:`${OUT}/11520-missile-physics-panel.png`});
await page.locator('#sheetClose').click();

await stage('home-delivery');
// Browser-complete home delivery uses an explicitly QA-seeded local-game balance;
// this never touches a provider, wallet balance or chain state.
await page.evaluate(()=>{
  const p=globalThis.__K11520_PRODUCT__.snapshot(),key=`k11520.player:${p.playerId}:k11520.local-product.v1:guest`,saved=JSON.parse(localStorage.getItem(key));
  saved.progress.kaios=50;saved.progress.claimableKaios=0;localStorage.setItem(key,JSON.stringify(saved));
});
await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(1800);
if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click().catch(()=>{});
await page.waitForFunction(()=>globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__?.snapshot?.()?.lifeId==='DIGITAL_ANT_0001',null,{timeout:5000});
await page.waitForFunction(()=>globalThis.__K11520_PLAYER_COURIER__?.active?.()?.status==='ACTIVE',null,{timeout:3000});
assert.equal((await page.evaluate(()=>globalThis.__K11520_PLAYER_COURIER__.active())).missionId,courierMission.missionId,'Player Courier mission must survive reload without resetting its timer');
const deliveryKaiosBefore=await page.evaluate(()=>globalThis.__K11520_PRODUCT__.snapshot().kaios);
await page.locator('#homeDeliveryButton').click();await page.locator('#courierOpenLogistics').click();await page.locator('#homeRequest').waitFor({state:'visible'});
await page.locator('#homeAmount').fill('1000');await page.locator('#homeMovementC').selectOption('1');await page.locator('#homeRequest').click();
const assignedHome=await page.evaluate(()=>globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__.snapshot());
assert.equal(assignedHome.mission.serviceType,'PLAYER_HOME_CASH_DELIVERY');assert.equal(assignedHome.finance.earned,0);assert.equal(assignedHome.payroll.paid,0);
await page.locator('#homeLaunch').click();
await page.waitForFunction(()=>globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__?.snapshot?.()?.mission?.status==='ARRIVED_AWAITING_RECEIPT',null,{timeout:15000});
assert.equal((await page.evaluate(()=>globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__.snapshot())).payroll.paid,0,'arrival alone must not pay salary');
await page.locator('#sheetClose').click();await page.evaluate(()=>document.getElementById('playerLifeOpen')?.click());await page.locator('#playerLifeHomeNav').click();
await page.waitForFunction(()=>{const p=globalThis.__K11520_PRODUCT__.snapshot(),x=globalThis.__K11520_WORLD_COORDS__?.physical,h=p.home?.xyz;return h&&Math.hypot(x.x-h.x,x.y-h.y,x.z-h.z)<=2.5},null,{timeout:10000});
await page.locator('#homeDeliveryButton').click();await page.locator('#courierOpenLogistics').click();await page.locator('#homeAccept').click();
await page.waitForFunction(()=>globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__?.snapshot?.()?.mission?.status==='DELIVERED',null,{timeout:3000});
const deliveredHome=await page.evaluate(()=>({ant:globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__.snapshot(),player:globalThis.__K11520_PRODUCT__.snapshot()}));
assert.equal(deliveredHome.ant.mission.accounting.cargoPrincipalRecognizedAsRevenue,false);assert.ok(deliveredHome.ant.mission.accounting.freightRevenue>0);assert.ok(deliveredHome.ant.payroll.paid>0);assert.equal(deliveredHome.player.kaios,deliveryKaiosBefore-deliveredHome.ant.mission.accounting.freightRevenue);assert.match(deliveredHome.ant.mission.receiptId,/^HOME-RECEIPT-/);
assert.match(await page.locator('#homeDeliveryReceipt').textContent(),/DELIVERY VERIFIED/);
await page.screenshot({path:`${OUT}/11520-player-home-delivery-receipt.png`});await page.locator('#sheetClose').click();
await stage('selected-life');
// Start the existing selected-Life visual QA with a fresh camera centered on
// the player's persisted position; the home-delivery flow intentionally leaves
// the player at home instead of teleporting back to the world origin.
await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(1800);
if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click().catch(()=>{});
await page.waitForFunction(()=>globalThis.__K11520_WORLD_SELECTION_PROJECTION__?.visibleLifeCanvasHitPoints,null,{timeout:5000});

await page.evaluate(async()=>{
  const src=await import('/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/market-life-source-runtime.mjs');
  const now=Date.now(),player=globalThis.__K11520_WORLD_COORDS__?.physical||{x:0,y:0,z:0};
  src.publishMarketLifeSourceEvent({type:'SPAWN',sourceId:'QA-LIVING-WORLD',lifeId:'LIFE-QA-DIGITAL-ANT-VISUAL',name:'Digital Ant 5D ATM 飛碟運鈔員',species:'DIGITAL_ANT_ATM_UFO',intelligence:6,markets:['BTCUSDT'],capital:60,vitality:100,maxHp:100,attack:0,rewardKaios:0,speed:0,positions:{},x:player.x,y:player.y,z:player.z+2.2,strategy:'DELIVERY',cargo:{kind:'CASH',amount:18,unit:'KAIOS'},mission:{missionId:'QA-VISUAL-CASH-RUN',status:'IN_TRANSIT',transportMode:'ATM_UFO_5D',flightPhase:'CRUISE_5D',destinationAtmId:'ATM-11520-001',quote:{net:5,freight:4,tip:1}},meta:{retirementReserve:12,targetRetirementReserve:100,motionAuthority:'DIGITAL_ANT_LOGISTICS_RUNTIME'},at:now},{persistLocal:false,broadcast:false});
});
await page.waitForFunction(()=>document.querySelector('#monsterList')?.textContent?.includes('Digital Ant 5D ATM 飛碟運鈔員'),null,{timeout:4000});
await page.waitForTimeout(1100);
assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));
assert.ok((await page.locator('#monsterList').textContent()).includes('WORK'),'Digital Ant should expose WORK lifestyle in living-world HUD');
await page.screenshot({path:`${OUT}/11520-living-world-digital-ant.png`,fullPage:true});

// A completed delivery leaves the player at the private home plot. Fixed HUD
// panels cover different world regions on different mobile aspect ratios, so
// place the QA Life through its real UPDATE ingress at the first raycast-visible
// and physically uncovered point instead of assuming one hard-coded coordinate.
const qaLifePlacement=await page.evaluate(async()=>{
  const src=await import('/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/market-life-source-runtime.mjs');
  const lifeId='LIFE-QA-DIGITAL-ANT-VISUAL',sourceId='QA-LIVING-WORLD',canvas=document.querySelector('#three');
  const player=globalThis.__K11520_WORLD_COORDS__?.physical||{x:0,y:0,z:0};
  const offsets=[];
  for(const z of[-8,-6,-4,-2,2,4,6,8])for(const x of[0,-2,2,-4,4,-6,6])offsets.push({x,y:0,z});
  for(const offset of offsets){
    src.publishMarketLifeSourceEvent({type:'UPDATE',sourceId,lifeId,name:'Digital Ant 5D ATM 飛碟運鈔員',species:'DIGITAL_ANT_ATM_UFO',intelligence:6,markets:['BTCUSDT'],capital:60,vitality:100,maxHp:100,attack:0,rewardKaios:0,speed:0,positions:{},x:player.x+offset.x,y:player.y+offset.y,z:player.z+offset.z,strategy:'DELIVERY',cargo:{kind:'CASH',amount:18,unit:'KAIOS'},mission:{missionId:'QA-VISUAL-CASH-RUN',status:'IN_TRANSIT',transportMode:'ATM_UFO_5D',flightPhase:'CRUISE_5D',destinationAtmId:'ATM-11520-001',quote:{net:5,freight:4,tip:1}},meta:{retirementReserve:12,targetRetirementReserve:100,motionAuthority:'DIGITAL_ANT_LOGISTICS_RUNTIME'},at:Date.now()},{persistLocal:false,broadcast:false});
    await new Promise(resolve=>setTimeout(resolve,120));
    const point=globalThis.__K11520_WORLD_SELECTION_PROJECTION__?.lifeCanvasHitPoints?.(lifeId)?.find(p=>document.elementFromPoint(p.clientX,p.clientY)===canvas);
    if(point)return{offset,point};
  }
  return null;
});
assert.ok(qaLifePlacement,`QA Digital Ant must have an uncovered, raycast-routable canvas point after home delivery: ${JSON.stringify(await page.evaluate(()=>globalThis.__K11520_WORLD_SELECTION_PROJECTION__?.playerHomeSnapshot?.()))}`);
await page.evaluate(()=>{globalThis.__K11520_QA_WORLD_TAP_ROUTES__=[];document.querySelector('#three')?.addEventListener('k11520:world-tap',e=>globalThis.__K11520_QA_WORLD_TAP_ROUTES__.push(e.detail||null))});
let pickedRoute=null,tapDiagnostic=null;
for(let attempt=0;attempt<24;attempt+=1){
  const point=await page.evaluate(()=>{
    const canvas=document.querySelector('#three'),points=globalThis.__K11520_WORLD_SELECTION_PROJECTION__.visibleLifeCanvasHitPoints();
    return points.find(p=>document.elementFromPoint(p.clientX,p.clientY)===canvas)||null;
  });
  if(!point){await page.waitForTimeout(60);continue}
  await page.evaluate(()=>{globalThis.__K11520_QA_WORLD_TAP_ROUTES__=[]});
  await page.mouse.move(point.clientX,point.clientY);
  await page.mouse.down();
  await page.waitForTimeout(45);
  await page.mouse.up();
  await page.waitForTimeout(140);
  tapDiagnostic=await page.evaluate(()=>({routes:structuredClone(globalThis.__K11520_QA_WORLD_TAP_ROUTES__||[]),selectedLifeId:document.querySelector('#selectedLifeHud')?.dataset.lifeId||null}));
  pickedRoute=tapDiagnostic.routes.at(-1)||null;
  if(pickedRoute?.route==='ENTITY'&&pickedRoute.entityType==='MONSTER'&&pickedRoute.lifeId)break;
  pickedRoute=null;
  await page.evaluate(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__?.stop?.('selected-Life QA retry'));
}
assert.ok(pickedRoute,`a real Chromium pointer tap must route a raycast-visible Life through the canonical MONSTER path: ${JSON.stringify(tapDiagnostic)}`);
await page.waitForFunction(()=>{const hud=document.getElementById('selectedLifeHud');return hud&&!hud.hidden&&hud.dataset.lifeId},{timeout:3000});
const picked=await page.locator('#selectedLifeHud').evaluate(hud=>({lifeId:hud.dataset.lifeId,text:hud.textContent||''}));
const selectedText=await page.locator('#selectedLifeHud').textContent();
assert.equal(selectedText,picked.text,'selected-Life HUD must remain stable after the canonical tap');
assert.ok(picked.lifeId&&picked.lifeId!=='NOT_ASSIGNED','selected Life HUD must expose LIFE_ID');
assert.equal(picked.lifeId,pickedRoute.lifeId,'selected Life HUD must expose the exact Life ID emitted by the canonical MONSTER route');
assert.match(selectedText,/HP \d+(?:\.\d+)? \/ \d+(?:\.\d+)?/,'selected Life HUD must show HP/MAX HP');
assert.match(selectedText,/XYZ -?\d+(?:\.\d+)?, -?\d+(?:\.\d+)?, -?\d+(?:\.\d+)?/,'selected Life HUD must show XYZ');
const selectedBox=await page.locator('#selectedLifeHud').boundingBox();
assert.ok(selectedBox,'selected Life HUD must have a rendered box');
assert.ok(selectedBox.x>=0&&selectedBox.y>=0&&selectedBox.x+selectedBox.width<=390&&selectedBox.y+selectedBox.height<=844,'selected Life HUD must remain fully inside 390x844 viewport');
await page.screenshot({path:`${OUT}/11520-selected-life-hud.png`,fullPage:true});
assert.deepEqual(errors,[],'page errors after selected-Life click: '+errors.join('\n'));

if(await page.locator('#sheet').evaluate(sheet=>sheet.classList.contains('open')))await page.locator('#sheetClose').click();
async function verifyActiveLandscapeContext(kind){
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(250);
  if(await page.locator('#k11520UtilityMaster').getAttribute('aria-expanded')==='true')await page.locator('#k11520UtilityMaster').click();
  for(const id of ['#cargoInterceptionButton','#homeDeliveryButton'])assert.equal(await page.locator(id).isVisible(),false,'landscape context actions stay in More even when active');
  await page.waitForFunction(()=>document.querySelector('#k11520UtilityMaster')?.dataset.contextActive==='true');
  assert.match(await page.locator('#k11520UtilityMaster').getAttribute('aria-label'),/Courier|攔截|搶鈔|運鈔/,'More announces the existing active context');
  assert.match(await page.locator('#k11520UtilityMaster').evaluate(el=>getComputedStyle(el,'::after').content),/•/,'More visibly signals active work');
  const hits=await page.evaluate(()=>['#tradeSword','#attack','#orderFire','#dodge','#flat','#skill','#k11520MonsterGuide','#k11520UtilityMaster'].map(selector=>{const el=document.querySelector(selector),r=el.getBoundingClientRect(),inset=8,points=[[r.x+r.width/2,r.y+r.height/2],[r.x+inset,r.y+r.height/2],[r.right-inset,r.y+r.height/2],[r.x+r.width/2,r.y+inset],[r.x+r.width/2,r.bottom-inset]];return{selector,owned:points.every(([x,y])=>{const h=document.elementFromPoint(x,y);return h===el||el.contains(h)})}}));
  assert.ok(hits.every(h=>h.owned),`active landscape context must not steal combat hits: ${JSON.stringify(hits)}`);
  await page.screenshot({path:`${OUT}/11520-${kind}-context-closed-844x390.png`});
  await page.locator('#k11520UtilityMaster').click();
  const chatState=await page.locator('#gameChat').evaluate(el=>{const r=el.getBoundingClientRect();return{open:el.classList.contains('open'),inViewport:r.left<innerWidth&&r.right>0&&r.top<innerHeight&&r.bottom>0}});
  assert.deepEqual(chatState,{open:false,inViewport:false},'More must not reveal closed chat or steal context-action input');
  await page.locator('#chatHandle').click();await page.locator('#gameChat.open').waitFor();
  await page.locator('#chatClose').click();await page.waitForFunction(()=>{const el=document.querySelector('#gameChat'),r=el.getBoundingClientRect();return!el.classList.contains('open')&&(r.top>=innerHeight||r.bottom<=0||r.left>=innerWidth||r.right<=0)},null,{timeout:2500});
  const open=await page.evaluate(()=>['#cargoInterceptionButton','#homeDeliveryButton'].map(selector=>{const el=document.querySelector(selector),r=el.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{selector,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,hit:h===el||el.contains(h)}}));
  assert.ok(open.every(x=>x.width>=44&&x.height>=44&&x.hit),'both context actions remain usable inside existing More');
  const guide=await page.locator('#k11520MonsterGuide').boundingBox();assert.ok(open.every(x=>!guide||x.right<=guide.x||x.left>=guide.x+guide.width||x.bottom<=guide.y||x.top>=guide.y+guide.height),'open context actions remain clear of the world target');
  assert.equal(await page.locator('#tradeSword').isVisible(),false,'existing landscape More disclosure hides combat until closed');
  assert.ok(open[0].right<=open[1].left||open[1].right<=open[0].left||open[0].bottom<=open[1].top||open[1].bottom<=open[0].top,'context actions do not overlap each other');
  await page.screenshot({path:`${OUT}/11520-${kind}-context-menu-844x390.png`});
}
await verifyActiveLandscapeContext('courier');
assert.equal(await page.locator('#playerCourierChip').isVisible(),false,'legacy courier chip stays retired in 844x390');
await page.locator('#homeDeliveryButton').click();const landscapeDetails=await page.locator('#playerCourierDetails').boundingBox();assert.ok(landscapeDetails&&landscapeDetails.x>=0&&landscapeDetails.y>=0&&landscapeDetails.x+landscapeDetails.width<=844&&landscapeDetails.y+landscapeDetails.height<=390,'expanded Player Courier details must remain inside 844x390');await page.screenshot({path:`${OUT}/11520-player-courier-844x390.png`});
await page.locator('#k11520UtilityMaster').click();assert.equal(await page.locator('#playerCourierDetails').isVisible(),false,'closing More closes Courier presentation instead of stranding it');
assert.equal(await page.evaluate(()=>__K11520_PLAYER_COURIER__.active().missionId),courierMission.missionId,'closing More never cancels the mission');

await stage('bandit-flow');
// Public Player Courier bandit flow is intentionally same-browser LOCAL
// GAMEPLAY. A second local Life can raid the first Life's persisted cargo;
// this does not claim a realtime multiplayer backend.
await page.setViewportSize({width:390,height:844});
const localLives=await page.evaluate(async()=>{
  const {createLocalPlayerStore}=await import('/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/player-life-runtime.mjs');
  const store=createLocalPlayerStore(),courierLifeId=store.activePlayer().playerId,position=globalThis.__K11520_WORLD_COORDS__?.physical||{x:0,y:0,z:0};
  const attacker=store.createPlayer({lastXYZ:{x:position.x,y:position.y,z:position.z}});
  return {courierLifeId,attackerLifeId:attacker.playerId};
});
await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(1800);
if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click().catch(()=>{});
await page.waitForFunction(()=>globalThis.__K11520_PLAYER_COURIER__?.banditTarget?.()?.status==='ACTIVE',null,{timeout:5000});
assert.equal(await page.locator('#playerBanditTarget').isVisible(),false,'legacy top bandit target chip must not occupy the world area');
await verifyActiveLandscapeContext('raid');
assert.match(await page.locator('#cargoInterceptionButton').getAttribute('aria-label'),/合法運鈔目標/);await page.locator('#cargoInterceptionButton').click();assert.match(await page.locator('#playerBanditPanel').textContent(),/LOCAL GAMEPLAY/);assert.match(await page.locator('#playerBanditPanel').textContent(),/未實作跨裝置 realtime multiplayer/);assert.equal(await page.locator('#banditRaidButton').isDisabled(),true,'ordinary combat cannot raid cargo before explicit Bandit mode');
await page.locator('#banditModeButton').click();assert.equal(await page.locator('#banditRaidButton').isDisabled(),false);await page.locator('#banditRaidButton').click();assert.match(await page.locator('#playerBanditPanel').textContent(),/搶鈔未成立：搶鈔窗口尚未開放/,'closed attack window must return a visible reason');
await page.locator('#k11520UtilityMaster').click();assert.equal(await page.locator('#playerBanditPanel').isVisible(),false,'closing More closes Raid presentation');
assert.equal(await page.evaluate(()=>__K11520_PLAYER_COURIER__.banditTarget().status),'ACTIVE','closing More preserves the active target');await page.setViewportSize({width:390,height:844});

await stage('uninsured-raid');
// Open a deterministic QA attack window without waiting minutes. The action
// and settlement still go through the public buttons and canonical raid().
await page.evaluate(id=>{const e=JSON.parse(localStorage.getItem('K11520_PLAYER_COURIER')),m=e.missions[id];m.bandit.attackWindowStartsAt=Date.now()-1000;m.bandit.lastRaidAt=0;m.cargo.durability=1;localStorage.setItem('K11520_PLAYER_COURIER',JSON.stringify(e))},courierMission.missionId);
await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(1800);if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click().catch(()=>{});
await page.locator('#cargoInterceptionButton').click();await page.locator('#banditModeButton').click();await page.locator('#banditRaidButton').click();await page.waitForFunction(()=>globalThis.__K11520_PLAYER_COURIER__?.banditTarget?.()?.status==='ROBBED');
let robbed=await page.evaluate(()=>globalThis.__K11520_PLAYER_COURIER__.banditTarget());assert.equal(robbed.cargo.ownerLifeId,localLives.attackerLifeId);assert.equal(robbed.cargo.ownerState,'LOOT_CRATE');assert.equal(robbed.settlement.rewardKaios,0,'cargo principal and robbery must not become courier salary');assert.equal(robbed.settlement.insurancePayoutKaios,0,'QUOTE_ONLY robbery is uninsured and pays no claim');
await page.locator('#banditLootButton').click();assert.equal(await page.evaluate(id=>globalThis.__K11520_PLAYER_COURIER__.snapshot(id).mission.cargo.ownerState,courierMission.missionId),'CLAIMED_BY_BANDIT');assert.equal(await page.locator('#playerBanditTarget').isVisible(),false,'claimed loot must not restore the retired top chip');assert.equal(await page.locator('#cargoInterceptionButton').getAttribute('data-context-state'),'cruise','claimed loot returns the shared raid action to cruise');assert.equal(await page.locator('#banditLootButton').count(),0,'one-shot loot removes the public action and prevents a second click');

await stage('insured-acceptance');
// Return to the original courier and pay an exact local premium through the
// real public Player Courier acceptance path.
await page.evaluate(async id=>{const {createLocalPlayerStore}=await import('/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/player-life-runtime.mjs');createLocalPlayerStore().activatePlayer(id)},localLives.courierLifeId);
await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(1800);if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click().catch(()=>{});
await page.locator('#homeDeliveryButton').click();await page.locator('#courierOpenLogistics').click();await page.locator('#homeRequest').waitFor({state:'visible'});await page.locator('#homeDeliveryMode').selectOption('PLAYER_COURIER');await page.locator('#homeAmount').fill('1000');await page.locator('#homeInsurance').selectOption('YES');await page.locator('#homeRequest').click();await page.locator('#homeLaunch').click();
await page.waitForFunction(()=>globalThis.__K11520_PLAYER_COURIER__?.active?.()?.insurance?.status==='ACTIVE',null,{timeout:3000});const insuredMission=await page.evaluate(()=>globalThis.__K11520_PLAYER_COURIER__.active()),insuredBeforeKaios=await page.evaluate(()=>globalThis.__K11520_PRODUCT__.snapshot().kaios);assert.ok(insuredMission.insurance.premiumPaidKaios>0,'public flow must move QUOTE_ONLY to ACTIVE after exact local premium payment');
diagnosticMissionId=insuredMission.missionId;expectedCourierLifeId=localLives.courierLifeId;
await stage('insured-raid');
await page.evaluate(async({attackerLifeId,missionId})=>{const e=JSON.parse(localStorage.getItem('K11520_PLAYER_COURIER')),m=e.missions[missionId];m.bandit.attackWindowStartsAt=Date.now()-1000;m.bandit.lastRaidAt=0;m.cargo.durability=1;localStorage.setItem('K11520_PLAYER_COURIER',JSON.stringify(e));const {createLocalPlayerStore}=await import('/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/player-life-runtime.mjs');createLocalPlayerStore().activatePlayer(attackerLifeId)},{attackerLifeId:localLives.attackerLifeId,missionId:insuredMission.missionId});
await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(1800);if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click().catch(()=>{});
await page.locator('#cargoInterceptionButton').click();await page.locator('#banditModeButton').click();await page.locator('#banditRaidButton').click();await page.waitForFunction(id=>globalThis.__K11520_PLAYER_COURIER__?.snapshot?.(id)?.mission?.status==='ROBBED',insuredMission.missionId);
robbed=await page.evaluate(id=>globalThis.__K11520_PLAYER_COURIER__.snapshot(id).mission,insuredMission.missionId);assert.equal(robbed.insurance.status,'ACTIVE');assert.equal(robbed.insurance.claimStatus,'APPROVED','robbery cannot mark insurance paid before the courier ledger is credited');assert.ok(robbed.settlement.insurancePayoutKaios>0,'insured robbery must create a local payout entitlement');assert.equal(robbed.economics.cargoPrincipalRecognizedAsRevenue,false);
const banditBox=await page.locator('#playerBanditPanel').boundingBox();assert.ok(banditBox&&banditBox.x>=0&&banditBox.y>=0&&banditBox.x+banditBox.width<=390&&banditBox.y+banditBox.height<=844,'Bandit panel must remain inside 390x844');await page.screenshot({path:`${OUT}/11520-player-courier-bandit-390x844.png`});await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);const banditLandscape=await page.locator('#playerBanditPanel').boundingBox();assert.ok(banditLandscape&&banditLandscape.x>=0&&banditLandscape.y>=0&&banditLandscape.x+banditLandscape.width<=844&&banditLandscape.y+banditLandscape.height<=390,'Bandit panel must remain inside 844x390');await page.screenshot({path:`${OUT}/11520-player-courier-bandit-844x390.png`});

await stage('insured-courier-restoration');
// Only the original courier can turn the approved claim into a replay-proof
// local player-ledger credit. The raid itself never marks it paid.
await page.evaluate(async id=>{const {createLocalPlayerStore}=await import('/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/player-life-runtime.mjs');createLocalPlayerStore().activatePlayer(id)},localLives.courierLifeId);
await page.setViewportSize({width:390,height:844});await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(1800);if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click().catch(()=>{});await stage('await-approved-after-reload');
await captureDiagnostic('approved-restoration',{screenshot:false});
await page.waitForFunction(id=>globalThis.__K11520_PLAYER_COURIER__?.snapshot?.(id)?.mission?.insurance?.claimStatus==='APPROVED',insuredMission.missionId);
await stage('approved-restored');await page.locator('#homeDeliveryButton').click();
// Existing renderCourier replaces the details subtree on its countdown tick.
// Read canonical eligibility, current visibility and geometry in one browser
// task; a handle captured by a previous wait can already be detached. Do not
// wait for compliant dimensions: the unchanged 44px assertion must still fail
// for a genuinely undersized visible control.
await stage('claim-geometry');
const claimGeometry=await page.waitForFunction(id=>{
  if(globalThis.__K11520_PLAYER_COURIER__?.snapshot?.(id)?.mission?.insurance?.claimStatus!=='APPROVED')return false;
  const el=document.querySelector('#courierInsuranceClaim');if(!el?.isConnected)return false;
  const style=getComputedStyle(el),r=el.getBoundingClientRect();if(style.visibility==='hidden'||style.display==='none'||!r.width||!r.height)return false;
  return {x:r.x,y:r.y,width:r.width,height:r.height};
},insuredMission.missionId);
const insuranceClaimBox=await claimGeometry.jsonValue();await claimGeometry.dispose();assert.ok(insuranceClaimBox&&insuranceClaimBox.height>=44&&insuranceClaimBox.x>=0&&insuranceClaimBox.x+insuranceClaimBox.width<=390,'insurance claim must be a full-width 44px mobile touch target');await stage('claim-click');await page.locator('#courierInsuranceClaim').click();await stage('await-paid');await page.waitForFunction(id=>globalThis.__K11520_PLAYER_COURIER__?.snapshot?.(id)?.mission?.insurance?.claimStatus==='PAID',insuredMission.missionId);
const insuranceAfter=await page.evaluate(id=>({mission:globalThis.__K11520_PLAYER_COURIER__.snapshot(id).mission,kaios:globalThis.__K11520_PRODUCT__.snapshot().kaios}),insuredMission.missionId);assert.equal(insuranceAfter.kaios,insuredBeforeKaios+insuranceAfter.mission.insurance.payoutKaios,'approved insurance payout credits the original courier local ledger exactly once');const replayResult=await page.evaluate(m=>globalThis.__K11520_PRODUCT__.recordCourierInsurancePayout(m.insurance.payoutReceiptId,m.insurance.payoutKaios),insuranceAfter.mission);assert.equal(replayResult.replayed,true);assert.equal(await page.evaluate(()=>globalThis.__K11520_PRODUCT__.snapshot().kaios),insuranceAfter.kaios,'replaying the insurance receipt never credits twice');assert.equal(await page.locator('#courierInsuranceClaim').count(),0,'paid claim action disappears after one-shot settlement');

await stage('ordinary-complete');
assert.deepEqual(errors,[]);
console.log(`11520 Digital Ant living-world + routed canonical 3D selected-Life HP/XYZ browser visual QA PASS (${picked.lifeId})`);
}
}catch(error){await captureDiagnostic('failure').catch(()=>{});throw error}
finally{clearTimeout(watchdog)}
}

if(reviewOnly){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(String(error)));
  const boot=async()=>{
    await page.goto(`${BASE_URL}/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html`,{waitUntil:'domcontentloaded',timeout:15000});
    await page.waitForFunction(()=>document.getElementById('enter11520')||globalThis.__K11520_PRODUCT__?.snapshot?.()?.playerId,null,{timeout:10000});
    if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click({timeout:5000});
    await page.waitForFunction(()=>globalThis.__K11520_PLAYER_COURIER__?.snapshot?.()&&globalThis.__K11520_PRODUCT__?.snapshot?.()?.playerId&&document.querySelector('.brandMetaV250 span:first-child')?.dataset.k11520ProductVersion==='V2.9.3',null,{timeout:15000});
    await page.locator('#intro11520').waitFor({state:'hidden',timeout:5000});
    await page.waitForFunction(()=>/READY|FALLBACK/.test(document.getElementById('charState')?.textContent||''),null,{timeout:15000});
  };
  try{
    await boot();
    const before=await page.evaluate(async()=>{
      const {createPlayerCourierOffer,createPlayerCourierStore}=await import('./runtime/digital-ant-logistics-runtime.mjs'),player=globalThis.__K11520_PRODUCT__.snapshot(),at=Date.now()-120_000,store=createPlayerCourierStore({sessionId:'QA-REVIEW-EXPLANATION',now:()=>at,monotonicNow:()=>100});
      const m=store.accept(createPlayerCourierOffer({missionId:'QA-EXPLANATION-ONLY',requesterLifeId:player.playerId,cargoId:'QA-EXPLANATION-CARGO',cargoAmount:1000,freightFeeKaios:17,courierSalaryKaios:6,estimatedDurationMs:60_000}),{courierLifeId:player.playerId});
      store.observe(m.missionId,{wallNow:Date.now(),monoNow:101});localStorage.setItem('11520.playerCourier.lastMission',m.missionId);
      return {mission:store.snapshot(m.missionId).mission,kaios:player.kaios};
    });
    assert.equal(before.mission.status,'CLOCK_REVIEW');await boot();
    const savedEnvelope=await page.evaluate(()=>localStorage.getItem('K11520_PLAYER_COURIER')),screenshots=[];
    for(const [width,height] of [[390,844],[844,390],[432,856],[412,772],[480,900],[360,740]]){
      if(await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
      await page.setViewportSize({width,height});await page.waitForTimeout(250);
      await page.waitForFunction(()=>document.getElementById('homeDeliveryButton')?.getAttribute('aria-label')?.includes('時間待核對'),null,{timeout:3000});
      if(width>height){
        await page.waitForFunction(()=>document.getElementById('k11520UtilityMaster')?.getAttribute('aria-label')?.includes('時間待核對'),null,{timeout:3000});
        assert.equal(await page.locator('#homeDeliveryButton').isVisible(),false,'landscape context remains owned by existing More');
        await page.screenshot({path:`${OUT}/11520-courier-review-compact-${width}x${height}.png`});await page.locator('#k11520UtilityMaster').click();
      }else await page.screenshot({path:`${OUT}/11520-courier-review-compact-${width}x${height}.png`});
      const entry=await page.locator('#homeDeliveryButton').evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,hit:hit===el||el.contains(hit)}});
      assert.ok(entry.width>=44&&entry.height>=44&&entry.hit&&entry.x>=0&&entry.y>=0&&entry.right<=width&&entry.bottom<=height,`paused contextual action stays reachable ${width}x${height}: ${JSON.stringify(entry)}`);
      assert.match(await page.locator('#homeDeliveryButton').textContent(),/暫停/);assert.doesNotMatch(await page.locator('#homeDeliveryButton').textContent(),/00:00/);
      await page.locator('#homeDeliveryButton').click();
      const details=await page.locator('#playerCourierDetails').textContent();
      for(const message of ['暫停／時間待核對','尚未完成或發獎','目前沒有安全的恢復操作','重新整理不會解除此暫停','勿清除本機儲存或重複接單','仍可繼續移動、戰鬥與探索'])assert.ok(details.includes(message),message);
      assert.equal(await page.locator('#courierRecoveryConfirm,#courierRecoveryPrepare').count(),0,'explanation-only UI must not expose a recovery action');
      if(width===390&&height===844)assert.equal(await page.evaluate(async()=>{const node=document.querySelector('[data-courier-clock-guidance]');await new Promise(resolve=>setTimeout(resolve,1200));return node?.isConnected&&node===document.querySelector('[data-courier-clock-guidance]')}),true,'paused guidance node remains stable across two countdown render ticks');
      const panel=await page.locator('#playerCourierDetails').boundingBox();assert.ok(panel&&panel.x>=0&&panel.y>=0&&panel.x+panel.width<=width&&panel.y+panel.height<=height,`details stay inside ${width}x${height}`);
      if(width>height){
        await page.locator('#playerCourierDetails').evaluate(el=>{el.scrollTop=0});
        await page.screenshot({path:`${OUT}/11520-courier-review-details-initial-${width}x${height}.png`});
        const controls=await page.evaluate(()=>['yControl','cControl','lotsControl','joy','attack','orderFire','k11520CameraReset','k11520MarketRow'].map(id=>{const el=document.getElementById(id),r=el.getBoundingClientRect();return{id,x:r.x,y:r.y,width:r.width,height:r.height}}));
        for(const control of controls)assert.ok(panel.x+panel.width<=control.x||control.x+control.width<=panel.x||panel.y+panel.height<=control.y||control.y+control.height<=panel.y,`paused details must not cover ${control.id}`);
        for(const selector of ['#yThumb','#cThumb','#lotsThumb'])await page.locator(selector).click({trial:true,timeout:2000});
        await page.locator('#courierOpenLogistics').scrollIntoViewIfNeeded();
        const action=await page.locator('#courierOpenLogistics').evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{height:r.height,hit:hit===el||el.contains(hit)}});
        assert.ok(action.height>=44&&action.hit,'scrolling retains a reachable44px Logistics action');
      }
      await page.locator('[data-courier-clock-guidance]').scrollIntoViewIfNeeded();await page.screenshot({path:`${OUT}/11520-courier-review-details-${width}x${height}.png`});screenshots.push(`${width}x${height}`);
      await page.locator('#homeDeliveryButton').click();assert.equal(await page.locator('#playerCourierDetails').isVisible(),false);
      if(await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
      const after=await page.evaluate(()=>({mission:globalThis.__K11520_PLAYER_COURIER__.active(),kaios:globalThis.__K11520_PRODUCT__.snapshot().kaios}));
      assert.equal(after.mission.status,'CLOCK_REVIEW');assert.equal(after.mission.settlement,null);assert.deepEqual(after.mission.cargo,before.mission.cargo);assert.deepEqual(after.mission.economics,before.mission.economics);assert.deepEqual(after.mission.insurance,before.mission.insurance);assert.equal(after.kaios,before.kaios);assert.equal(await page.evaluate(()=>localStorage.getItem('K11520_PLAYER_COURIER')),savedEnvelope,'opening/closing disclosure does not rewrite the Courier envelope or receipt indexes');
    }
    await boot();assert.equal(await page.evaluate(()=>globalThis.__K11520_PLAYER_COURIER__.active().status),'CLOCK_REVIEW','reload never implies an automatic recovery');assert.equal(await page.evaluate(()=>localStorage.getItem('K11520_PLAYER_COURIER')),savedEnvelope,'reload retains the Courier save and receipt indexes');assert.deepEqual(errors,[]);
    await fs.writeFile(`${OUT}/11520-courier-review-report.json`,JSON.stringify({sourceSha:process.env.K11520_SOURCE_SHA||process.env.GITHUB_SHA||'LOCAL',version:'V2.9.3',scope:'EXPLANATION_ONLY',screenshots,noRecoveryAction:true,missionAndEconomicsPreserved:true,errors},null,2));
    console.log('11520 Courier review explanation QA PASS: six viewports, reachable context action, retained state, no recovery/credit action');
  }catch(error){await page.screenshot({path:`${OUT}/11520-courier-review-failure.png`}).catch(()=>{});await fs.writeFile(`${OUT}/11520-courier-review-failure.json`,JSON.stringify({error:String(error),errors},null,2));throw error}
  finally{await context.close()}
}
await browser.close();

}else{await runLocalStoreIntegrity()}

// Independent native-browser suite. Every context is disposable CI data, and
// every acceptance lease is Chromium's own navigator.locks implementation.
async function runLocalStoreIntegrity(){
  const {execFileSync}=await import('node:child_process');
  const out='artifacts/11520-local-store-integrity';
  const base=process.env.K11520_TEST_BASE_URL||'http://127.0.0.1:4173';
  assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname),'native integrity QA only permits an isolated loopback server');
  const root='/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/';
  const pinned='765d0e24e3fbe7353a80329c99bc3b5c3025fd12';
  const knightUrl='https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/main/addons/kaykit_character_pack_adventures/Characters/gltf/Knight.glb';
  const {createHash}=await import('node:crypto');
  const requiredVisuals=['knight','fallback'].flatMap(mode=>['initial','cleared','dismissed'].flatMap(state=>['390x844','844x390'].map(size=>`local-store-${mode}-${state}-${size}.png`)));
  const playerA='KAIOS-P-QA-INTEGRITY-A-1234567890',playerB='KAIOS-P-QA-INTEGRITY-B-1234567890';
  const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const report={schema:'K11520_NATIVE_LOCAL_STORE_QA_V1',head,ciHead:process.env.GITHUB_SHA||null,tree:execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim(),trackedChanges:!!execFileSync('git',['status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim(),scope:'SYNTHETIC_CI_PRODUCT_AND_COURIER_ONLY',functionalQA:'RUNNING',visualQA:'NOT_REVIEWED',bfcacheAcceptance:'NOT_EXERCISED',acceptanceCompleteness:'INCOMPLETE',releaseStatus:'HOLD',startedAt:new Date().toISOString(),cases:[],diagnostics:[],screenshots:[],limitations:['Player Life, backpack, world state and preferences are outside this lease. No whole-game atomicity or read-only guarantee.','Mixed-version rollout is unsupported. Pinned-client observations are diagnostics, never safety acceptance.','Screenshots require direct human/agent image review; capture is not VISUAL_QA PASS.']};
  await fs.mkdir(out,{recursive:true});
  const save=()=>fs.writeFile(`${out}/report.json`,JSON.stringify(report,null,2));
  await save();
  let nativeBrowser;
  const captureError=error=>({name:error.name,message:error.message,stack:error.stack});
  // Faults wrap the real Storage prototype, never replace it with a Map or
  // inject a fake lock. Checkpoint bytes and write attempts remain reviewable.
  const instrument=({missingLocks=false,missingStorage=false,providerTrap=true}={})=>{
    let storage;try{storage=globalThis.localStorage}catch{}
    const get=Storage.prototype.getItem,set=Storage.prototype.setItem,remove=Storage.prototype.removeItem,clear=Storage.prototype.clear;
    const protectedKey=key=>String(key).includes('k11520.local-product.v1:')||key==='K11520_PLAYER_COURIER';
    const probe=globalThis.__lsiProbe={writes:[],events:[],providerCalls:[],fault:{},nativeLocks:!!navigator.locks&&/\[native code\]/.test(String(navigator.locks.request)),nativeStorage:/\[native code\]/.test(String(set)),documentId:crypto.randomUUID()};
    const revision=bytes=>{try{return JSON.parse(bytes)?.revision??null}catch{return null}};
    Storage.prototype.getItem=function(key){if(this===storage&&String(key).includes('local-product')&&probe.fault.readback){probe.fault.readback=false;throw new DOMException('QA native readback denial','SecurityError')}return get.call(this,key)};
    Storage.prototype.setItem=function(key,value){
      if(this!==storage||!protectedKey(key))return set.call(this,key,value);
      const entry={key:String(key),beforeRevision:revision(get.call(this,key)),afterRevision:revision(value),outcome:'ATTEMPT'};probe.writes.push(entry);
      const product=String(key).includes('local-product'),envelope=key==='K11520_PLAYER_COURIER'?JSON.parse(value):null,previous=envelope?JSON.parse(get.call(this,key)||'{"missions":{}}'):null;
      const newAck=envelope&&Object.values(envelope.missions).some(m=>(m.status==='DELIVERED'&&previous.missions[m.missionId]?.status!=='DELIVERED')||(m.insurance?.claimStatus==='PAID'&&previous.missions[m.missionId]?.insurance?.claimStatus!=='PAID'));
      if((product&&probe.fault.product)||(newAck&&probe.fault.ack)){entry.outcome='QUOTA_DENIED';throw new DOMException('QA native quota boundary','QuotaExceededError')}
      const result=set.call(this,key,value);entry.outcome='COMMITTED';
      if(product&&probe.fault.afterProduct){probe.fault.afterProduct=false;probe.fault.readback=true}
      if(product&&probe.fault.afterWrite){const hook=probe.fault.afterWrite;delete probe.fault.afterWrite;hook()}
      return result;
    };
    Storage.prototype.removeItem=function(key){if(this===storage&&protectedKey(key))probe.writes.push({key:String(key),outcome:'REMOVE'});return remove.call(this,key)};
    Storage.prototype.clear=function(){if(this===storage)probe.writes.push({key:'*',outcome:'CLEAR'});return clear.call(this)};
    addEventListener('storage',e=>{if(protectedKey(e.key))probe.events.push({key:e.key,oldRevision:revision(e.oldValue),newRevision:revision(e.newValue),trusted:e.isTrusted})});
    globalThis.ethereum=providerTrap?{on(){},removeListener(){},async request(args){const method=String(args?.method||'UNKNOWN');probe.providerCalls.push(method);await globalThis.__lsiRecordProviderAttempt(method);throw new Error('QA_PROVIDER_FORBIDDEN')}}:undefined;
    if(missingLocks)Object.defineProperty(navigator,'locks',{configurable:true,value:undefined});
    if(missingStorage)Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new DOMException('QA storage getter denied','SecurityError')}});
  };
  async function contextFor(caseReport,{production=false,avatarMode='FALLBACK_BLOCKED',...faults}={}){
    const context=await nativeBrowser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    caseReport.requestsBlocked=[];caseReport.pageErrors=[];caseReport.providerCalls=[];caseReport.providerAttempts=[];caseReport.assetEvidence=[];
    let knightAsset=null;
    context.on('page',page=>{page.setDefaultTimeout(10000);page.on('pageerror',error=>caseReport.pageErrors.push(String(error)))});
    await context.exposeBinding('__lsiRecordProviderAttempt',({page},method)=>{caseReport.providerAttempts.push({url:page.url(),method})});
    await context.addInitScript(instrument,{...faults,providerTrap:!production});
    await context.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(url.origin===new URL(base).origin){
        if(url.pathname.startsWith('/__lsi_old__/')){
          const path=decodeURIComponent(url.pathname.slice('/__lsi_old__/'.length));
          if(!/^K線西遊記\/temples\/11520\/(runtime|controls)\/[a-z0-9-]+\.mjs$/.test(path))return route.abort('blockedbyclient');
          try{const body=execFileSync('git',['show',`${pinned}:${path}`],{encoding:'utf8',maxBuffer:4000000});caseReport.pinnedSources??=[];if(!caseReport.pinnedSources.includes(path))caseReport.pinnedSources.push(path);return route.fulfill({status:200,contentType:'text/javascript',body})}catch(error){caseReport.pinnedReadError=String(error);return route.abort('failed')}
        }
        if(url.pathname.startsWith('/__lsi__/'))return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><title>Isolated native store QA</title><p>Disposable CI local-game store fixture</p>'});
        if(production&&url.pathname.endsWith('K11520_BSC_TESTNET_DEPLOYMENT_MANIFEST.json'))return route.fulfill({status:200,contentType:'application/json',body:'{"status":"PREPARED_NOT_DEPLOYED","chainId":97,"testOnly":true}'});
        return route.continue();
      }
      // The only additional real-network permission is this exact public GET.
      // Redirects are refused; response bytes/hash are retained as evidence and
      // reused for reloads. All other external requests retain existing routing.
      if(production&&avatarMode==='KNIGHT_READY'&&url.href===knightUrl&&route.request().method()==='GET'){
        try{
          if(!knightAsset){const response=await route.fetch({method:'GET',headers:{Accept:'model/gltf-binary'},maxRedirects:0,timeout:20000});assert.equal(response.status(),200,'exact public Knight asset must return200 without redirect');const body=await response.body();assert.ok(body.length>20&&body.length<=10000000);assert.equal(body.subarray(0,4).toString(),'glTF','Knight response must be GLB bytes');knightAsset={body,sha256:createHash('sha256').update(body).digest('hex'),responseUrl:response.url()};assert.equal(knightAsset.responseUrl,knightUrl)}
          caseReport.assetEvidence.push({url:knightUrl,method:'GET',sha256:knightAsset.sha256,bytes:knightAsset.body.length,responseUrl:knightAsset.responseUrl,scope:'EXACT_EXISTING_PUBLIC_ASSET'});
          return route.fulfill({status:200,contentType:'model/gltf-binary',body:knightAsset.body,headers:{'access-control-allow-origin':'*'}});
        }catch(error){caseReport.assetError=String(error);return route.abort('failed')}
      }
      if(production&&url.href.startsWith('https://cdn.jsdelivr.net/npm/three@0.180.0/')){
        const prefix='https://cdn.jsdelivr.net/npm/three@0.180.0/',path=url.pathname.slice('/npm/three@0.180.0/'.length);
        if(path.includes('..'))return route.abort();
        let body=await fs.readFile(`node_modules/three/${path}`,'utf8');body=body.replaceAll("from 'three'",`from '${prefix}build/three.module.js'`).replaceAll('from "three"',`from "${prefix}build/three.module.js"`);
        return route.fulfill({status:200,contentType:'text/javascript',body});
      }
      if(production&&url.origin==='https://data-api.binance.vision'){
        const prices={BTCUSDT:100000,ETHUSDT:4000,BNBUSDT:600},body=url.pathname.endsWith('/aggTrades')?[{p:String(prices[url.searchParams.get('symbol')]||100),T:Date.now(),a:Date.now()}]:Object.entries(prices).map(([symbol,price])=>({symbol,price:String(price)}));
        return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
      }
      caseReport.requestsBlocked.push({url:url.origin+url.pathname,method:route.request().method()});return route.abort('blockedbyclient');
    });
    return context;
  }
  async function fixture(context,playerId=playerA,{old=false,productOnly=false}={}){
    const page=await context.newPage();await page.goto(`${base}/__lsi__/fixture.html`);
    await initialize(page,playerId,{old,productOnly});return page;
  }
  async function initialize(page,playerId,{old=false,productOnly=false}={}){
    return page.evaluate(async({moduleRoot,playerId,old,productOnly})=>{
      const [wallet,margin,logistics]=await Promise.all([import(moduleRoot+'runtime/evm-wallet-runtime.mjs'),import(moduleRoot+'runtime/kgen-margin-runtime.mjs'),import(moduleRoot+'runtime/digital-ant-logistics-runtime.mjs')]);
      const attempt=fn=>{try{return{value:fn()??null}}catch(error){return{error:error.message}}};
      const q=globalThis.__lsi={wallet,margin,logistics,playerId,attempt,products:[],old};
      q.newProduct=id=>{const p=wallet.createSimulationPlayerStore({playerId:id,ledger:margin.createKgenLedger()});q.products.push(p);return p};
      q.p=q.newProduct(playerId);await q.p.ready;q.p.activate(null);q.current=q.p;
      q.offer=(id,extra={})=>logistics.createPlayerCourierOffer({missionId:id,requesterLifeId:playerId,cargoAmount:1000,freightFeeKaios:8,courierSalaryKaios:3,estimatedDurationMs:60000,createdAt:10000,...extra});
      q.newCourier=()=>logistics.createPlayerCourierStore({sessionId:'NATIVE-QA',now:()=>10000,monotonicNow:()=>0,resolveCreditPort:()=>q.current});
      if(!productOnly){q.c=q.newCourier();await q.c.ready}
      q.accept=(id,extra={})=>q.c.accept(q.offer(id,extra),{courierLifeId:playerId,wallNow:10000,monoNow:0});
      q.due=m=>q.c.settleDue(m.missionId,{courierLifeId:playerId,wallNow:m.dueAt,monoNow:m.estimatedDurationMs});
      q.bytes=()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k.includes('local-product')||k==='K11520_PLAYER_COURIER'||k==='k11520.player-life.legacy-owner').sort().map(k=>[k,localStorage.getItem(k)]));
      q.key=(id=playerId,owner='guest')=>`k11520.player:${id}:k11520.local-product.v1:${owner}`;
      q.snapshot=()=>({product:q.p.snapshot(),courier:q.c?.snapshot(),bytes:q.bytes(),writes:structuredClone(__lsiProbe.writes),storageEvents:structuredClone(__lsiProbe.events),providerCalls:[...__lsiProbe.providerCalls]});
      return{nativeLocks:__lsiProbe.nativeLocks,nativeStorage:__lsiProbe.nativeStorage,capability:q.p.snapshot().writeCapability};
    },{moduleRoot:old?'/__lsi_old__/'+root.slice(1):root,playerId,old,productOnly});
  }
  async function run(name,fn,options={}){
    const item={name,status:'RUNNING',startedAt:new Date().toISOString()};report.cases.push(item);await save();let context;
    try{context=await contextFor(item,options);await fn(context,item);for(const page of context.pages()){const calls=await page.evaluate(()=>globalThis.__lsiProbe?.providerCalls||[]).catch(()=>[]);item.providerCalls.push(...calls)}assert.deepEqual(item.providerCalls,[],'no wallet/provider/sign/send calls');assert.deepEqual(item.providerAttempts,[],'no provider attempts across any document, including closed/reloaded pages');assert.deepEqual(item.pageErrors,[],'uncaught browser errors');item.status='PASS'}
    catch(error){item.status='FAIL';item.error=captureError(error);if(context)for(const [index,page] of context.pages().entries()){if(page.isClosed())continue;item.failureState??=[];item.failureState.push(await page.evaluate(()=>globalThis.__lsi?.snapshot?.()||{product:globalThis.__K11520_PRODUCT__?.snapshot?.(),courier:globalThis.__K11520_PLAYER_COURIER__?.snapshot?.(),writes:globalThis.__lsiProbe?.writes}).catch(()=>null));await page.screenshot({path:`${out}/failure-${report.cases.length}-${index}.png`,timeout:5000}).catch(()=>{})}}
    finally{await context?.close();item.finishedAt=new Date().toISOString();console.log('[11520 LOCAL STORE]',name,item.status);await save()}
  }
  try{
    nativeBrowser=await chromium.launch({headless:true,ignoreDefaultArgs:['--disable-back-forward-cache'],...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
    report.browserVersion=nativeBrowser.version();
    await run('simultaneous same-player admission; follower zero writes; owner close takeover',async(context,item)=>{
      const pages=await Promise.all([context.newPage(),context.newPage()]);await Promise.all(pages.map(p=>p.goto(`${base}/__lsi__/simultaneous.html`)));
      const admissions=await Promise.all(pages.map(p=>initialize(p,playerA)));item.admissions=admissions;assert.ok(admissions.every(x=>x.nativeLocks&&x.nativeStorage));assert.deepEqual(admissions.map(x=>x.capability.status).sort(),['FOLLOWER','WRITER']);
      const owner=pages[admissions.findIndex(x=>x.capability.writeEnabled)],follower=pages.find(p=>p!==owner);
      item.owner=await owner.evaluate(()=>{__lsi.p.record('LOOT_DROP',{reward:20});__lsi.accept('QA-SAME-PLAYER');return __lsi.snapshot()});
      await follower.waitForFunction(()=>__lsiProbe.events.length>0);assert.equal(await follower.evaluate(()=>__lsiProbe.events.every(e=>e.trusted)),true);
      item.follower=await follower.evaluate(()=>{const q=__lsi,before=q.bytes(),calls={record:q.attempt(()=>q.p.record('LOOT_DROP',{reward:5})),save:q.attempt(()=>q.p.save()),ledger:q.attempt(()=>q.p.transactLedger(()=>{})),spend:q.p.spendKaios(1),credit:q.p.recordCourierSettlement({}),insurance:q.p.recordCourierInsurancePayout({}),accept:q.attempt(()=>q.accept('QA-FOLLOWER')),observe:q.attempt(()=>q.c.observe('QA-SAME-PLAYER')),settle:q.attempt(()=>q.c.settleDue('QA-SAME-PLAYER',{courierLifeId:q.playerId})),damage:q.attempt(()=>q.c.applyCombatDamage('QA-SAME-PLAYER',{courierLifeId:q.playerId,damage:1})),raid:q.attempt(()=>q.c.raid('QA-SAME-PLAYER',{})),claim:q.attempt(()=>q.c.claimInsurancePayout('QA-SAME-PLAYER',{courierLifeId:q.playerId})),ack:q.attempt(()=>q.c.confirmInsurancePayout('QA-SAME-PLAYER',{})),loot:q.attempt(()=>q.c.claimLoot('QA-SAME-PLAYER',{}))};q.p.activate('0x'+'a'.repeat(40));q.p.activate(null);return{before,after:q.bytes(),calls,snapshot:q.snapshot()}});
      assert.deepEqual(item.follower.after,item.follower.before);assert.deepEqual(item.follower.snapshot.writes,[],'not even a protected setItem attempt from follower activation/mutation');for(const result of Object.values(item.follower.calls))assert.match(result.error||result.reason,/LOCAL_GAME_FOLLOWER/);
      await owner.close();await follower.waitForFunction(async()=>!(await navigator.locks.query()).held.some(x=>x.name==='k11520.local-game-writer'));
      item.takeover=await follower.evaluate(async()=>{const status=await __lsi.p.requestWriter();__lsi.p.refresh();__lsi.c.reload();__lsi.p.record('LOOT_DROP',{reward:1});return{status,...__lsi.snapshot()}});assert.equal(item.takeover.status,'WRITER');assert.equal(item.takeover.product.kaios,21);assert.equal(item.takeover.courier.missions['QA-SAME-PLAYER'].status,'ACTIVE');
    });
    await run('different-player contention and shared same-tab product/Courier refcounts',async(context,item)=>{
      const owner=await fixture(context),follower=await fixture(context,playerB);
      item.initial=await follower.evaluate(()=>__lsi.snapshot());assert.equal(item.initial.product.writeCapability.status,'FOLLOWER');assert.deepEqual(item.initial.writes,[]);
      item.sameTab=await owner.evaluate(async()=>{const q=__lsi,p2=q.newProduct(q.playerId);await p2.ready;p2.activate(null);q.p.record('LOOT_DROP',{reward:3});p2.record('LOOT_DROP',{reward:4});q.p.dispose();const disposed=q.attempt(()=>q.p.record('LOOT_DROP',{reward:1}));p2.record('LOOT_DROP',{reward:1});p2.dispose();return{disposed,second:p2.snapshot(),courier:q.c.snapshot()}});assert.match(item.sameTab.disposed.error,/DISPOSED/);assert.equal(item.sameTab.second.kaios,8);assert.equal(item.sameTab.courier.writeCapability.status,'WRITER');assert.equal(await follower.evaluate(()=>__lsi.p.requestWriter()),'FOLLOWER');
      await owner.evaluate(()=>__lsi.c.dispose());await follower.waitForFunction(async()=>!(await navigator.locks.query()).held.some(x=>x.name==='k11520.local-game-writer'));
      item.takeover=await follower.evaluate(async()=>{await __lsi.p.requestWriter();__lsi.p.refresh();__lsi.c.reload();__lsi.p.record('LOOT_DROP',{reward:2});__lsi.accept('QA-OTHER-PLAYER');return __lsi.snapshot()});assert.equal(item.takeover.product.kaios,2);assert.equal(JSON.parse(item.takeover.bytes[`k11520.player:${playerA}:k11520.local-product.v1:guest`]).progress.kaios,8);
    });
    await run('native pagehide fences old generation; history return and explicit reacquisition',async(context,item)=>{
      const page=await fixture(context);await page.evaluate(()=>{const q=__lsi;q.p.record('LOOT_DROP',{reward:5});addEventListener('pagehide',event=>{const before=q.bytes(),attempt=q.attempt(()=>q.p.record('LOOT_DROP',{reward:99}));sessionStorage.setItem('qa-pagehide',JSON.stringify({trusted:event.isTrusted,persisted:event.persisted,capability:q.p.snapshot().writeCapability,attempt,unchanged:JSON.stringify(before)===JSON.stringify(q.bytes())}))});addEventListener('pageshow',event=>{globalThis.__lsiPageshow={trusted:event.isTrusted,persisted:event.persisted}})});
      await page.goto(`${base}/__lsi__/away.html`);item.pagehide=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('qa-pagehide')));assert.equal(item.pagehide.trusted,true);assert.equal(item.pagehide.capability.status,'PAGE_HIDDEN');assert.match(item.pagehide.attempt.error,/PAGE_HIDDEN/);assert.equal(item.pagehide.unchanged,true);
      await page.goBack();item.history=await page.evaluate(()=>({restored:!!globalThis.__lsi,pageshow:globalThis.__lsiPageshow||null,navigation:performance.getEntriesByType('navigation')[0]?.type,notRestoredReasons:performance.getEntriesByType('navigation')[0]?.notRestoredReasons?.toJSON?.()||null}));
      if(item.history.pageshow?.persisted){assert.equal(item.history.pageshow.trusted,true);assert.equal(await page.evaluate(()=>__lsi.p.snapshot().writeCapability.status),'PAGE_HIDDEN');item.bfcache='EXERCISED_NATIVE_PERSISTED_PAGESHOW';report.bfcacheAcceptance='PASS'}else{item.bfcache='NOT_EXERCISED_BROWSER_DID_NOT_CACHE';report.diagnostics.push({name:'BFCache',status:'NOT_EXERCISED',evidence:item.history});await initialize(page,playerA)}
      item.reacquired=await page.evaluate(async()=>{await __lsi.p.requestWriter();__lsi.p.refresh();__lsi.c.reload();__lsi.p.record('LOOT_DROP',{reward:1});return __lsi.snapshot()});assert.equal(item.reacquired.product.kaios,6);assert.equal(item.reacquired.product.writeCapability.status,'WRITER');
      // Native asynchronous acquisition invalidated before callback admission.
      await page.evaluate(()=>{__lsi.p.dispose();__lsi.c.dispose()});await page.waitForFunction(async()=>!(await navigator.locks.query()).held.some(x=>x.name==='k11520.local-game-writer'));
      item.disposedPending=await page.evaluate(async()=>{const p=__lsi.newProduct(__lsi.playerId),ready=p.ready;p.dispose();await ready;return{snapshot:p.snapshot(),attempt:__lsi.attempt(()=>p.activate(null))}});assert.equal(item.disposedPending.snapshot.writeCapability.status,'DISPOSED');assert.match(item.disposedPending.attempt.error,/DISPOSED/);
    });
    await run('rapid native owner reload reacquires; no permanent ifAvailable follower',async(context,item)=>{
      const page=await fixture(context);item.reloads=[];
      for(let i=0;i<6;i++){
        await page.reload({waitUntil:'domcontentloaded'});const admitted=await initialize(page,playerA);const state=await page.evaluate(async()=>({capability:__lsi.p.snapshot().writeCapability,locks:await navigator.locks.query(),writes:__lsiProbe.writes}));item.reloads.push({index:i,admitted,state});
        if(state.capability.status!=='WRITER'){await page.waitForTimeout(250);item.reloads.at(-1).afterRelease=await page.evaluate(async()=>({capability:__lsi.p.snapshot().writeCapability,locks:await navigator.locks.query()}));throw new Error('RAPID_RELOAD_ONE_SHOT_ADMISSION_DID_NOT_ACQUIRE: '+JSON.stringify(item.reloads.at(-1)))}
        assert.equal(state.locks.held.filter(x=>x.name==='k11520.local-game-writer').length,1);
      }
    });
    await run('delivery pending intent, owner/player namespace mismatch, immutable retry',async(context,item)=>{
      const page=await fixture(context);
      item.failure=await page.evaluate(()=>{const q=__lsi,m=q.accept('QA-PENDING');__lsiProbe.fault.product=true;const result=q.due(m);return{result,snapshot:q.snapshot()}});assert.equal(item.failure.result.ok,false);assert.equal(item.failure.result.mission.status,'DELIVERY_PENDING_CREDIT');assert.equal(item.failure.result.mission.cargo.ownerState,'OWNED_BY_COURIER');assert.equal(item.failure.snapshot.product.kaios,0);
      const binding=item.failure.result.mission.settlement.credit;
      item.namespaces=await page.evaluate(async other=>{const q=__lsi;__lsiProbe.fault.product=false;q.p.activate('0x'+'b'.repeat(40));const wallet=q.c.reconcileCredit('QA-PENDING');const p2=q.newProduct(other);await p2.ready;p2.activate(null);q.current=p2;const player=q.c.reconcileCredit('QA-PENDING');q.current=q.p;q.p.activate(null);const final=q.c.reconcileCredit('QA-PENDING'),repeat=q.attempt(()=>q.due(final.mission));return{wallet,player,final,repeat,other:p2.snapshot(),snapshot:q.snapshot()}},playerB);
      assert.equal(item.namespaces.wallet.reason,'COURIER_REWARD_OWNER_MISMATCH');assert.equal(item.namespaces.player.reason,'COURIER_CREDIT_OWNER_UNAVAILABLE');assert.equal(item.namespaces.other.kaios,0);assert.equal(item.namespaces.final.ok,true);assert.deepEqual({...item.namespaces.final.mission.settlement.credit,status:'PENDING'},binding);assert.equal(item.namespaces.final.mission.cargo.ownerState,'DELIVERED_TO_DESTINATION');assert.equal(item.namespaces.snapshot.product.kaios,binding.rewardKaios);assert.equal(item.namespaces.snapshot.product.courierReceipts.length,1);assert.match(item.namespaces.repeat.error,/MISSION_ALREADY_SETTLED/);
    });
    await run('uncertain product readback preserves committed bytes; ack-only retry writes no product',async(context,item)=>{
      const page=await fixture(context);
      item.uncertain=await page.evaluate(()=>{const q=__lsi,m=q.accept('QA-READBACK');__lsiProbe.fault.afterProduct=true;const result=q.due(m);return{result,snapshot:q.snapshot()}});assert.equal(item.uncertain.result.ok,false);assert.equal(item.uncertain.snapshot.product.storageStatus,'PERSISTENCE_UNCERTAIN');assert.equal(item.uncertain.snapshot.product.kaios,0);assert.equal(JSON.parse(item.uncertain.snapshot.bytes[`k11520.player:${playerA}:k11520.local-product.v1:guest`]).progress.kaios,4);
      item.recovered=await page.evaluate(()=>{__lsi.p.refresh();const result=__lsi.c.reconcileCredit('QA-READBACK');return{result,snapshot:__lsi.snapshot()}});assert.equal(item.recovered.result.credit.replayed,true);assert.equal(item.recovered.snapshot.product.kaios,4);
      item.ack=await page.evaluate(()=>{const q=__lsi,m=q.accept('QA-ACK');__lsiProbe.fault.ack=true;const attempt=q.attempt(()=>q.due(m));const before=q.bytes(),writes=__lsiProbe.writes.length;__lsiProbe.fault.ack=false;__lsiProbe.fault.product=true;q.c.reload();const result=q.c.reconcileCredit(m.missionId);return{attempt,before,after:q.bytes(),newWrites:__lsiProbe.writes.slice(writes),result,snapshot:q.snapshot()}});assert.match(item.ack.attempt.error,/COURIER_SAVE_NOT_CONFIRMED/);assert.equal(item.ack.result.ok,true);assert.equal(item.ack.result.credit.replayed,true);assert.equal(item.ack.newWrites.filter(x=>x.key.includes('local-product')).length,0);assert.equal(item.ack.after[`k11520.player:${playerA}:k11520.local-product.v1:guest`],item.ack.before[`k11520.player:${playerA}:k11520.local-product.v1:guest`]);assert.equal(item.ack.snapshot.product.kaios,8);assert.equal(item.ack.snapshot.product.courierReceipts.length,2);
    });
    await run('owner destruction preserves pending credit for native follower takeover',async(context,item)=>{
      const owner=await fixture(context),follower=await fixture(context);
      item.interrupted=await owner.evaluate(()=>{const q=__lsi,m=q.accept('QA-CLOSE-PENDING');__lsiProbe.fault.ack=true;const result=q.attempt(()=>q.due(m));return{result,snapshot:q.snapshot()}});assert.match(item.interrupted.result.error,/COURIER_SAVE_NOT_CONFIRMED/);assert.equal(item.interrupted.snapshot.courier.missions['QA-CLOSE-PENDING'].status,'DELIVERY_PENDING_CREDIT');assert.equal(item.interrupted.snapshot.product.kaios,4);
      await owner.close();await follower.waitForFunction(async()=>!(await navigator.locks.query()).held.some(x=>x.name==='k11520.local-game-writer'));
      item.recovered=await follower.evaluate(async()=>{const q=__lsi;await q.p.requestWriter();q.p.refresh();q.c.reload();const before=q.bytes(),count=__lsiProbe.writes.length;__lsiProbe.fault.product=true;const result=q.c.reconcileCredit('QA-CLOSE-PENDING');return{result,before,after:q.bytes(),writes:__lsiProbe.writes.slice(count),snapshot:q.snapshot()}});assert.equal(item.recovered.result.ok,true);assert.equal(item.recovered.result.credit.replayed,true);assert.equal(item.recovered.snapshot.product.kaios,4);assert.equal(item.recovered.snapshot.product.courierReceipts.length,1);assert.equal(item.recovered.writes.filter(w=>w.key.includes('local-product')).length,0);
    });
    await run('reentrant account changes and disposal during committed readback stay fenced',async(context,item)=>{
      const page=await fixture(context);
      item.reentrant=await page.evaluate(()=>{const q=__lsi,m=q.accept('QA-REENTRANT'),checks={};__lsiProbe.fault.afterWrite=()=>{checks.activate=q.attempt(()=>q.p.activate('0x'+'e'.repeat(40)));checks.refresh=q.attempt(()=>q.p.refresh());checks.record=q.attempt(()=>q.p.record('LOOT_DROP',{reward:100}))};const result=q.due(m);return{checks,result,snapshot:q.snapshot()}});for(const result of Object.values(item.reentrant.checks))assert.match(result.error,/REENTRANT_WRITE/);assert.equal(item.reentrant.result.ok,true);assert.equal(item.reentrant.snapshot.product.kaios,4);assert.equal(item.reentrant.snapshot.product.owner,'guest');
      item.disposed=await page.evaluate(()=>{const q=__lsi,m=q.accept('QA-DISPOSE-READBACK');__lsiProbe.fault.afterWrite=()=>q.p.dispose();const result=q.due(m);return{result,snapshot:q.snapshot()}});assert.equal(item.disposed.result.ok,false);assert.equal(item.disposed.snapshot.product.writeCapability.status,'DISPOSED');assert.equal(item.disposed.snapshot.product.kaios,4);assert.equal(item.disposed.snapshot.product.storageStatus,'PERSISTENCE_UNCERTAIN');assert.equal(JSON.parse(item.disposed.snapshot.bytes[`k11520.player:${playerA}:k11520.local-product.v1:guest`]).progress.kaios,8);
      item.recovered=await page.evaluate(async()=>{const q=__lsi,p=q.newProduct(q.playerId);await p.ready;p.activate(null);q.current=p;const result=q.c.reconcileCredit('QA-DISPOSE-READBACK');return{result,product:p.snapshot(),courier:q.c.snapshot()}});assert.equal(item.recovered.result.ok,true);assert.equal(item.recovered.result.credit.replayed,true);assert.equal(item.recovered.product.kaios,8);
    });
    await run('insurance pending owner binding and durable ack-only retry',async(context,item)=>{
      const page=await fixture(context);
      item.pending=await page.evaluate(()=>{const q=__lsi,quote=q.logistics.quoteCargoInsurance({cargoAmount:1000,reserveKaios:1000}),m=q.accept('QA-INSURANCE',{insuranceQuote:quote});q.p.record('LOOT_DROP',{reward:100});const payment=q.p.spendKaios(quote.premiumKaios,{purpose:'PLAYER_COURIER_INSURANCE_PREMIUM'});q.c.activateInsurance(m.missionId,{courierLifeId:q.playerId,paymentEvidence:payment});q.c.raid(m.missionId,{attackerLifeId:'KAIOS-P-QA-BANDIT-1234567890',banditMode:true,action:'CARGO_RAID_ACTION',attackPower:100,defensePower:0,distanceMeters:1,replayKey:'QA-INSURANCE-RAID',wallNow:Math.max(m.bandit.attackWindowStartsAt,m.bandit.cooldownMs)});const balance=q.p.snapshot().kaios;__lsiProbe.fault.product=true;const result=q.c.claimInsurancePayout(m.missionId,{courierLifeId:q.playerId});return{balance,result,snapshot:q.snapshot()}});assert.equal(item.pending.result.ok,false);const pending=item.pending.snapshot.courier.missions['QA-INSURANCE'];assert.equal(pending.insurance.claimStatus,'APPROVED');assert.equal(pending.insurance.credit.status,'PENDING');assert.equal(item.pending.snapshot.product.kaios,item.pending.balance);
      item.retry=await page.evaluate(async other=>{const q=__lsi;__lsiProbe.fault.product=false;q.p.activate('0x'+'c'.repeat(40));const mismatch=q.c.claimInsurancePayout('QA-INSURANCE',{courierLifeId:q.playerId});const otherProduct=q.newProduct(other);await otherProduct.ready;otherProduct.activate(null);q.current=otherProduct;const playerMismatch=q.attempt(()=>q.c.claimInsurancePayout('QA-INSURANCE',{courierLifeId:q.playerId}));q.current=q.p;q.p.activate(null);__lsiProbe.fault.ack=true;const failedAck=q.attempt(()=>q.c.claimInsurancePayout('QA-INSURANCE',{courierLifeId:q.playerId}));const before=q.bytes(),count=__lsiProbe.writes.length;__lsiProbe.fault.ack=false;__lsiProbe.fault.product=true;q.c.reload();const paid=q.c.claimInsurancePayout('QA-INSURANCE',{courierLifeId:q.playerId}),repeat=q.attempt(()=>q.c.claimInsurancePayout('QA-INSURANCE',{courierLifeId:q.playerId}));return{mismatch,playerMismatch,otherProduct:otherProduct.snapshot(),failedAck,paid,repeat,before,after:q.bytes(),newWrites:__lsiProbe.writes.slice(count),snapshot:q.snapshot()}},playerB);assert.equal(item.retry.mismatch.reason,'COURIER_REWARD_OWNER_MISMATCH');assert.match(item.retry.playerMismatch.error,/COURIER_CREDIT_OWNER_UNAVAILABLE/);assert.equal(item.retry.otherProduct.kaios,0);assert.match(item.retry.failedAck.error,/COURIER_SAVE_NOT_CONFIRMED/);assert.equal(item.retry.paid.ok,true);assert.equal(item.retry.paid.evidence.replayed,true);assert.equal(item.retry.paid.mission.insurance.claimStatus,'PAID');assert.equal(item.retry.newWrites.filter(x=>x.key.includes('local-product')).length,0);assert.equal(item.retry.snapshot.product.kaios,item.pending.balance+pending.insurance.payoutKaios);assert.match(item.retry.repeat.error,/INSURANCE_PAYOUT_NOT_APPROVED/);
    });
    for(const [name,options,expected] of [['missing native Web Locks',{missingLocks:true},'LOCKS_UNAVAILABLE'],['denied native localStorage getter',{missingStorage:true},'STORAGE_UNAVAILABLE']])await run(name,async(context,item)=>{
      const page=await fixture(context);item.result=await page.evaluate(()=>({product:__lsi.p.snapshot(),courier:__lsi.c.snapshot(),record:__lsi.attempt(()=>__lsi.p.record('LOOT_DROP',{reward:2})),accept:__lsi.attempt(()=>__lsi.accept('QA-NO-CAPABILITY')),writes:__lsiProbe.writes}));assert.equal(item.result.product.writeCapability.status,expected);assert.equal(item.result.product.persistent,false);assert.match(item.result.record.error,new RegExp(expected));assert.match(item.result.accept.error,new RegExp(expected));assert.deepEqual(item.result.writes,[]);
    },options);
    await run('scoped legacy migration, replay tombstones/capacity, corrupt-byte preservation',async(context,item)=>{
      const page=await fixture(context);
      item.migration=await page.evaluate(()=>{const q=__lsi,key=q.key(),saved=JSON.parse(localStorage.getItem(key));saved.schema='K11520_LOCAL_SIMULATION_V1';delete saved.playerId;saved.futureTop={retained:true};saved.ledger.futureLedger={retained:true};saved.progress.futureProgress={retained:true};saved.progress.courierReceipts=['COURIER-RECEIPT-01020304'];saved.progress.kaios=9;localStorage.setItem(key,JSON.stringify(saved));q.p.refresh();q.p.record(null,{elapsedMs:1});const migrated=JSON.parse(localStorage.getItem(key));const tombstone=q.p.recordCourierSettlement({receiptId:'COURIER-RECEIPT-01020304',missionId:'QA-TOMBSTONE',playerId:q.playerId,owner:'guest',reward:1});migrated.progress.courierReceipts=Array.from({length:1000},(_,i)=>'COURIER-RECEIPT-'+i.toString(16).padStart(8,'0'));localStorage.setItem(key,JSON.stringify(migrated));q.p.refresh();const before=localStorage.getItem(key),capacity=q.p.recordCourierSettlement({receiptId:'COURIER-RECEIPT-ffffffff',missionId:'QA-CAPACITY',playerId:q.playerId,owner:'guest',reward:1});return{migrated,tombstone,capacity,before,after:localStorage.getItem(key),snapshot:q.p.snapshot()}});assert.equal(item.migration.migrated.schema,'K11520_LOCAL_SIMULATION_V2');assert.equal(item.migration.migrated.futureTop.retained,true);assert.equal(item.migration.migrated.ledger.futureLedger.retained,true);assert.equal(item.migration.migrated.progress.futureProgress.retained,true);assert.equal(item.migration.tombstone.reason,'LEGACY_COURIER_RECEIPT_REQUIRES_REVIEW');assert.equal(item.migration.capacity.reason,'COURIER_RECEIPT_CAPACITY');assert.equal(item.migration.after,item.migration.before);assert.equal(item.migration.snapshot.courierReceipts.length,1000);assert.equal(item.migration.snapshot.kaios,9);
      item.corrupt=await page.evaluate(()=>{const q=__lsi,key=q.key(),saved=JSON.parse(localStorage.getItem(key));saved.progress.courierInsuranceReceipts=null;const bad=JSON.stringify(saved);localStorage.setItem(key,bad);const refresh=q.attempt(()=>q.p.refresh()),write=q.attempt(()=>q.p.record('LOOT_DROP',{reward:1}));return{bad,after:localStorage.getItem(key),refresh,write}});assert.match(item.corrupt.refresh.error,/CORRUPT/);assert.match(item.corrupt.write.error,/CORRUPT/);assert.equal(item.corrupt.after,item.corrupt.bad);
    });
    await run('unscoped legacy guest quarantine survives namespace roundtrip and takeover',async(context,item)=>{
      const seed=await context.newPage();await seed.goto(`${base}/__lsi__/seed.html`);await seed.evaluate(async root=>{const {createKgenLedger}=await import(root+'runtime/kgen-margin-runtime.mjs');localStorage.setItem('k11520.local-product.v1:guest',JSON.stringify({schema:'K11520_LOCAL_SIMULATION_V1',owner:'guest',revision:1,ledger:createKgenLedger(),progress:{kaios:12}}))},root);
      const owner=await fixture(context),follower=await fixture(context);
      item.owner=await owner.evaluate(()=>{const q=__lsi,before=localStorage.getItem('k11520.local-product.v1:guest');localStorage.setItem('k11520.player-life.legacy-owner',q.playerId);const initial=q.p.snapshot();q.p.activate('0x'+'d'.repeat(40));q.p.activate(null);return{initial,refresh:q.attempt(()=>q.p.refresh()),write:q.p.spendKaios(1),before,after:localStorage.getItem('k11520.local-product.v1:guest'),scoped:localStorage.getItem(q.key())}});assert.equal(item.owner.initial.storageStatus,'LEGACY_PRODUCT_REVIEW_REQUIRED');assert.match(item.owner.refresh.error,/LEGACY_PRODUCT_REVIEW_REQUIRED/);assert.equal(item.owner.scoped,null);assert.equal(item.owner.after,item.owner.before);
      await owner.close();await follower.waitForFunction(async()=>!(await navigator.locks.query()).held.some(x=>x.name==='k11520.local-game-writer'));item.takeover=await follower.evaluate(async()=>{await __lsi.p.requestWriter();return{refresh:__lsi.attempt(()=>__lsi.p.refresh()),bytes:__lsi.bytes(),scoped:localStorage.getItem(__lsi.key())}});assert.match(item.takeover.refresh.error,/LEGACY_PRODUCT_REVIEW_REQUIRED/);assert.equal(item.takeover.scoped,null);assert.equal(item.takeover.bytes['k11520.local-product.v1:guest'],item.owner.before);
    });
    // Mixed-version behavior is diagnostic only. In particular, an unsafe old
    // write is never an assertion that must succeed or a passing invariant.
    const mixed={name:'actual pinned old client on the same origin',pinnedHead:pinned,status:'RUNNING',excludedFromAcceptance:true,executionComplete:false};report.diagnostics.push(mixed);let mixedContext;
    try{
      assert.equal(execFileSync('git',['rev-parse',`${pinned}^{commit}`],{encoding:'utf8'}).trim(),pinned);
      mixedContext=await contextFor(mixed);const current=await fixture(mixedContext);await current.evaluate(()=>__lsi.accept('QA-MIXED-ACTIVE'));
      const old=await fixture(mixedContext,playerA,{old:true,productOnly:true});
      mixed.before=await current.evaluate(async()=>({snapshot:__lsi.snapshot(),locks:await navigator.locks.query()}));
      mixed.oldActive=await old.evaluate(()=>{const q=__lsi;let courier;const admission=q.attempt(()=>{courier=q.newCourier();return courier.snapshot()});const observation=courier?q.attempt(()=>courier.observe('QA-MIXED-ACTIVE',{wallNow:10001,monoNow:1})):null;return{admission,observation,product:q.p.snapshot(),bytes:q.bytes(),writes:__lsiProbe.writes,providerCalls:__lsiProbe.providerCalls}});
      mixed.after=await current.evaluate(async()=>({bytes:__lsi.bytes(),locks:await navigator.locks.query()}));
      mixed.observedOldWriteWhileCurrentLeaseHeld=mixed.oldActive.writes.some(w=>w.outcome==='COMMITTED')&&mixed.after.locks.held.some(l=>l.name==='k11520.local-game-writer');
      await current.evaluate(()=>{__lsi.c.reload();__lsiProbe.fault.product=true;__lsi.c.settleDue('QA-MIXED-ACTIVE',{courierLifeId:__lsi.playerId,wallNow:70000,monoNow:60000})});
      mixed.oldPending=await old.evaluate(()=>{const q=__lsi,before=q.bytes(),admission=q.attempt(()=>q.newCourier());return{admissionError:admission.error||null,before,after:q.bytes(),providerCalls:__lsiProbe.providerCalls}});
      assert.deepEqual(mixed.oldActive.providerCalls,[]);assert.deepEqual(mixed.oldPending.providerCalls,[]);assert.deepEqual(mixed.providerAttempts,[]);assert.deepEqual(mixed.requestsBlocked,[],'minimal pinned store imports must not attempt external requests');assert.deepEqual(mixed.pageErrors,[]);
      mixed.status='OBSERVED_UNSUPPORTED_MIXED_VERSION';mixed.executionComplete=true;
      mixed.conclusion='These observations do not establish mixed-version safety. Evaluation requires closing/reloading old tabs.';
    }catch(error){mixed.status='DIAGNOSTIC_NOT_COMPLETED';mixed.error=captureError(error)}finally{await mixedContext?.close();await save()}
    for(const avatarMode of ['KNIGHT_READY','FALLBACK_BLOCKED'])await run(`production shell pending retry after reload; ${avatarMode} visual evidence`,async(context,item)=>{
      item.avatarMode=avatarMode;const visualMode=avatarMode==='KNIGHT_READY'?'knight':'fallback';
      const page=await context.newPage();
      const boot=async()=>{
        await page.goto(`${base}${root}game-5d.html`,{waitUntil:'domcontentloaded',timeout:20000});
        await page.waitForFunction(()=>globalThis.__K11520_PRODUCT__?.snapshot?.()?.playerId&&globalThis.__K11520_PLAYER_COURIER__?.snapshot?.(),null,{timeout:25000});
        if(await page.locator('#enter11520').isVisible())try{await page.locator('#enter11520').click({timeout:2000})}catch(error){if(await page.locator('#intro11520').isVisible())throw error}
        await page.locator('#intro11520').waitFor({state:'hidden',timeout:10000});
        await page.waitForFunction(expected=>document.getElementById('charState')?.textContent===expected,avatarMode==='KNIGHT_READY'?'Knight 3D READY':'PRIMITIVE FALLBACK',{timeout:25000});
      };
      await boot();item.initial=await page.evaluate(async()=>({product:__K11520_PRODUCT__.snapshot(),courier:__K11520_PLAYER_COURIER__.snapshot(),locks:await navigator.locks.query()}));assert.equal(item.initial.product.writeCapability.status,'WRITER');assert.equal(item.initial.courier.writeCapability.status,'WRITER');
      item.pending=await page.evaluate(async root=>{
        const {createPlayerCourierOffer,createPlayerCourierStore}=await import(root+'runtime/digital-ant-logistics-runtime.mjs');const player=__K11520_PRODUCT__.snapshot(),at=Date.now()-120000,store=createPlayerCourierStore({sessionId:'QA-SHELL-PENDING',now:()=>at,monotonicNow:()=>0,resolveCreditPort:()=>__K11520_PRODUCT__.courierCreditPort});await store.ready;
        try{const mission=store.accept(createPlayerCourierOffer({missionId:'QA-SHELL-PENDING-RELOAD',requesterLifeId:player.playerId,cargoAmount:1000,freightFeeKaios:8,courierSalaryKaios:3,estimatedDurationMs:60000,createdAt:at}),{courierLifeId:player.playerId});localStorage.setItem('11520.playerCourier.lastMission',mission.missionId);__lsiProbe.fault.product=true;const result=store.settleDue(mission.missionId,{courierLifeId:player.playerId,wallNow:mission.dueAt,monoNow:60000});return{result,balance:player.kaios,bytes:localStorage.getItem('K11520_PLAYER_COURIER'),product:__K11520_PRODUCT__.snapshot(),writes:__lsiProbe.writes}}finally{store.dispose()}
      },root);assert.equal(item.pending.result.ok,false);assert.equal(item.pending.result.mission.status,'DELIVERY_PENDING_CREDIT');assert.equal(item.pending.product.kaios,item.pending.balance);
      // Reload recreates the production owners. No test requestWriter/refresh
      // intervention is allowed here: this probes real one-shot boot admission.
      await boot();item.reloadAdmission=await page.evaluate(async()=>({product:__K11520_PRODUCT__.snapshot(),courier:__K11520_PLAYER_COURIER__.snapshot(),locks:await navigator.locks.query()}));assert.equal(item.reloadAdmission.product.writeCapability.status,'WRITER','production reload must acquire its native lease');
      await page.waitForFunction(()=>__K11520_PLAYER_COURIER__.snapshot('QA-SHELL-PENDING-RELOAD').mission?.status==='DELIVERED',null,{timeout:10000});
      item.delivered=await page.evaluate(()=>{const product=__K11520_PRODUCT__.snapshot(),mission=__K11520_PLAYER_COURIER__.snapshot('QA-SHELL-PENDING-RELOAD').mission;return{product,mission,persisted:JSON.parse(localStorage.getItem(`k11520.player:${product.playerId}:k11520.local-product.v1:${product.owner}`)),writes:__lsiProbe.writes}});const credit=item.delivered.mission.settlement.credit;assert.equal(credit.status,'CONFIRMED');assert.equal(item.delivered.product.kaios,item.pending.balance+credit.rewardKaios);assert.deepEqual(item.delivered.persisted.progress.courierReceiptBindings[credit.receiptId],Object.fromEntries(Object.entries(credit).filter(([key])=>key!=='status')));assert.equal(item.delivered.persisted.progress.courierReceipts.filter(id=>id===credit.receiptId).length,1);
      item.viewports=[];
      const toastState=()=>page.evaluate(()=>['toast','logisticsActionToast'].map(id=>{const el=document.getElementById(id),r=el?.getBoundingClientRect(),style=el&&getComputedStyle(el);return{id,present:!!el,show:el?.classList.contains('show')||false,opacity:style?Number(style.opacity):null,text:el?.textContent||'',box:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null}}));
      const hitGrid=selectors=>page.evaluate(selectors=>selectors.map(selector=>{const el=document.querySelector(selector),r=el?.getBoundingClientRect();if(!el||!r)return{selector,missing:true,points:[]};const points=[];for(const dx of [.15,.5,.85])for(const dy of [.15,.5,.85]){const x=r.left+r.width*dx,y=r.top+r.height*dy,hit=document.elementFromPoint(x,y);points.push({x,y,owned:hit===el||el.contains(hit),hitId:hit?.id||null,hitTag:hit?.tagName||null,hitClass:typeof hit?.className==='string'?hit.className:null})}return{selector,box:{x:r.x,y:r.y,width:r.width,height:r.height},inViewport:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,points}}),selectors);
      const openDetails=async(width,height)=>{
        if(await page.locator('#playerCourierDetails').isVisible())await page.locator('#homeDeliveryButton').click();
        if(await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
        await page.setViewportSize({width,height});await page.waitForTimeout(250);
        if(!await page.locator('#homeDeliveryButton').isVisible())await page.locator('#k11520UtilityMaster').click();
        await page.locator('#homeDeliveryButton').click();await page.locator('#playerCourierDetails').waitFor({state:'visible'});assert.match(await page.locator('#playerCourierDetails').textContent(),/DELIVERED/);
        const panel=await page.locator('#playerCourierDetails').boundingBox();assert.ok(panel&&panel.x>=0&&panel.y>=0&&panel.x+panel.width<=width&&panel.y+panel.height<=height,`Courier result must fit ${width}x${height}`);return panel;
      };
      const capture=async(state,width,height)=>{const file=`local-store-${visualMode}-${state}-${width}x${height}.png`,toasts=await toastState();await page.screenshot({path:`${out}/${file}`});report.screenshots.push({file,avatarMode,viewport:{width,height},entry:'game-5d.html',state,characterState:await page.locator('#charState').textContent(),toasts,visualQA:'REQUIRES_DIRECT_REVIEW'});return file};
      // Preserve the first post-settlement observations before waiting for
      // existing timers. Asset decode can outlast a toast; metadata records its
      // actual state. Never hide toasts, reset timers or alter CSS/classes.
      for(const [width,height] of [[390,844],[844,390]]){
        const panel=await openDetails(width,height),file=await capture('initial',width,height);item.viewports.push({width,height,panel});
        if(avatarMode==='FALLBACK_BLOCKED')await fs.copyFile(`${out}/${file}`,`${out}/local-store-${width}x${height}.png`);
      }
      const clearanceStarted=Date.now();
      await page.waitForFunction(()=>['toast','logisticsActionToast'].every(id=>{const el=document.getElementById(id);return el&&!el.classList.contains('show')&&Number(getComputedStyle(el).opacity)<=.01}),null,{timeout:10000});
      item.naturalToastClearance={waitedMs:Date.now()-clearanceStarted,layers:await toastState()};
      for(const [width,height] of [[390,844],[844,390]]){
        const state=item.viewports.find(v=>v.width===width);state.panel=await openDetails(width,height);
        await page.waitForFunction(()=>['toast','logisticsActionToast'].every(id=>{const el=document.getElementById(id);return el&&!el.classList.contains('show')&&Number(getComputedStyle(el).opacity)<=.01}),null,{timeout:10000});
        state.openPanelControls=await hitGrid(['#courierOpenLogistics','#homeDeliveryButton']);
        for(const control of state.openPanelControls){assert.ok(control.inViewport&&control.box.width>=44&&control.box.height>=44&&control.points.every(p=>p.owned),`Courier action/toggle-close must own its reachable44px area: ${JSON.stringify(control)}`);await page.locator(control.selector).click({trial:true,timeout:2000})}
        state.openVerticalGrid={scope:'DIAGNOSTIC_NOT_A_PASS_INVARIANT',controls:await hitGrid(['#yControl','#cControl','#lotsControl'])};
        await capture('cleared',width,height);
        // Dismiss using existing controls, then test the actual world/control
        // layer. The open-panel overlap diagnostic is deliberately not hidden.
        await page.locator('#homeDeliveryButton').click();await page.locator('#playerCourierDetails').waitFor({state:'hidden'});
        if(await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();
        state.dismissedVerticalGrid=await hitGrid(['#yControl','#cControl','#lotsControl']);
        for(const control of state.dismissedVerticalGrid)assert.ok(control.inViewport&&control.points.every(p=>p.owned),`dismissed vertical control must not remain obstructed: ${JSON.stringify(control)}`);
        for(const selector of ['#yThumb','#cThumb','#lotsThumb'])await page.locator(selector).click({trial:true,timeout:2000});
        state.dismissedWorldGrid=await page.evaluate(()=>{const canvas=document.querySelector('#three'),points=[];for(const dx of [.3,.45,.6,.75])for(const dy of [.32,.45,.58,.7]){const x=innerWidth*dx,y=innerHeight*dy,hit=document.elementFromPoint(x,y);points.push({x,y,owned:hit===canvas,hitId:hit?.id||null,hitTag:hit?.tagName||null})}return points});
        assert.ok(state.dismissedWorldGrid.some(p=>p.owned),'dismissed world canvas must have a reachable visible point');
        await capture('dismissed',width,height);
      }
      item.characterState=await page.locator('#charState').textContent();
      if(avatarMode==='KNIGHT_READY'){assert.equal(item.characterState,'Knight 3D READY');assert.ok(item.assetEvidence.length>=1&&item.assetEvidence.every(a=>a.url===knightUrl&&a.method==='GET'&&/^[a-f0-9]{64}$/.test(a.sha256)));assert.ok(!item.requestsBlocked.some(r=>r.url===knightUrl))}
      else{assert.equal(item.characterState,'PRIMITIVE FALLBACK');assert.ok(item.requestsBlocked.some(r=>r.url===knightUrl&&r.method==='GET'));assert.deepEqual(item.assetEvidence,[])}
      item.afterRender=await page.evaluate(()=>__K11520_PRODUCT__.snapshot());assert.equal(item.afterRender.courierReceipts.filter(id=>id===credit.receiptId).length,1);assert.equal(item.afterRender.kaios,item.pending.balance+credit.rewardKaios);
    },{production:true,avatarMode});
    report.functionalQA=report.cases.every(c=>c.status==='PASS')?'PASS':'FAIL';
    report.visualQA=requiredVisuals.every(file=>report.screenshots.some(s=>s.file===file))?'CAPTURED_REQUIRES_DIRECT_REVIEW':'MISSING_REQUIRED_SCREENSHOTS';
    if(!mixed.executionComplete)report.functionalQA='FAIL_DIAGNOSTIC_EXECUTION_INCOMPLETE';
    report.acceptanceCompleteness=report.functionalQA==='PASS'&&report.bfcacheAcceptance==='PASS'?'NATIVE_CASES_EXERCISED_VISUAL_REVIEW_PENDING':'INCOMPLETE';
  }catch(error){report.functionalQA='FAIL';report.fatal=captureError(error)}
  finally{await nativeBrowser?.close();report.finishedAt=new Date().toISOString();await save()}
  console.log(JSON.stringify({functionalQA:report.functionalQA,visualQA:report.visualQA,bfcacheAcceptance:report.bfcacheAcceptance,acceptanceCompleteness:report.acceptanceCompleteness,releaseStatus:report.releaseStatus,cases:report.cases.map(({name,status})=>({name,status})),report:`${out}/report.json`}));
  if(report.functionalQA!=='PASS'||!requiredVisuals.every(file=>report.screenshots.some(s=>s.file===file)))process.exitCode=1;
}
