import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const OUT='artifacts/11520-visual-qa';
const BASE_URL=process.env.K11520_TEST_BASE_URL||'http://127.0.0.1:4173';
const processStarted=performance.now();
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
const reviewOnly=process.env.K11520_COURIER_REVIEW_ONLY==='1';
const errors=[];
if(!reviewOnly){
let page,diagnosticMissionId=null,expectedCourierLifeId=null,diagnosticRunning=false;
const stageTimes=[],elapsed=()=>Math.round(performance.now()-processStarted);
const stage=async name=>{
  const entry={name,elapsedMs:elapsed(),remainingBudgetMs:Math.max(0,90000-elapsed())};
  stageTimes.push(entry);console.log('[11520 LIVING STAGE]',JSON.stringify(entry));
  await fs.writeFile(`${OUT}/11520-living-world-timings.json`,JSON.stringify({sourceSha:process.env.GITHUB_SHA||'LOCAL',budgetMs:90000,stages:stageTimes},null,2));
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
  await fs.writeFile(`${OUT}/11520-living-world-${reason}.json`,JSON.stringify(report,null,2));
  if(screenshot)await page?.screenshot({path:`${OUT}/11520-living-world-${reason}.png`,timeout:1500}).catch(()=>{});
  diagnosticRunning=false;
};
const watchdog=setTimeout(()=>{void captureDiagnostic('pre-timeout').catch(error=>console.error('Diagnostic capture failed',String(error)))},Math.max(0,80000-elapsed()));
try{
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
