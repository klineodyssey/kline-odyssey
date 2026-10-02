import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const OUT='artifacts/11520-visual-qa';
const BASE_URL=process.env.K11520_TEST_BASE_URL||'http://127.0.0.1:4173';
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(`${BASE_URL}/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html`,{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2200);
if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click().catch(()=>{});
await page.waitForTimeout(700);

await page.waitForFunction(()=>globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__?.snapshot?.()?.lifeId==='DIGITAL_ANT_0001',null,{timeout:5000});
assert.equal(await page.locator('#cargoInterceptionButton').isVisible(),true,'missile interception must be visible in the first mobile viewport instead of being buried in the ATM sheet');
assert.equal(await page.locator('#homeDeliveryButton').isVisible(),true,'cash/goods home delivery must be visible in the first mobile viewport');
const missileButtonBox=await page.locator('#cargoInterceptionButton').boundingBox();
assert.ok(missileButtonBox&&missileButtonBox.x>=0&&missileButtonBox.y>=0&&missileButtonBox.x+missileButtonBox.width<=390&&missileButtonBox.y+missileButtonBox.height<=844,'missile interception entry must remain inside 390x844');
const homeButtonBox=await page.locator('#homeDeliveryButton').boundingBox();
assert.ok(homeButtonBox&&homeButtonBox.x>=0&&homeButtonBox.y>=0&&homeButtonBox.x+homeButtonBox.width<=390&&homeButtonBox.y+homeButtonBox.height<=844,'home delivery entry must remain inside 390x844');
await page.screenshot({path:`${OUT}/11520-missile-entry-visible.png`});
await page.locator('#homeDeliveryButton').click();
await page.locator('#homeRequest').waitFor({state:'visible'});
assert.match(await page.locator('#sheetBody').textContent(),/玩家下單 → 飛碟送到家 → 玩家驗收 → 入帳/);
assert.match(await page.locator('#sheetBody').textContent(),/貨物本金是受限庫存，不是公司收入/);
await page.locator('#sheetClose').click();
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

// Browser-complete home delivery uses an explicitly QA-seeded local-game balance;
// this never touches a provider, wallet balance or chain state.
await page.evaluate(()=>{
  const p=globalThis.__K11520_PRODUCT__.snapshot(),key=`k11520.player:${p.playerId}:k11520.local-product.v1:guest`,saved=JSON.parse(localStorage.getItem(key));
  saved.progress.kaios=50;saved.progress.claimableKaios=0;localStorage.setItem(key,JSON.stringify(saved));
});
await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(1800);
if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click().catch(()=>{});
await page.waitForFunction(()=>globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__?.snapshot?.()?.lifeId==='DIGITAL_ANT_0001',null,{timeout:5000});
const deliveryKaiosBefore=await page.evaluate(()=>globalThis.__K11520_PRODUCT__.snapshot().kaios);
await page.locator('#homeDeliveryButton').click();await page.locator('#homeRequest').waitFor({state:'visible'});
await page.locator('#homeAmount').fill('1000');await page.locator('#homeMovementC').selectOption('1');await page.locator('#homeRequest').click();
const assignedHome=await page.evaluate(()=>globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__.snapshot());
assert.equal(assignedHome.mission.serviceType,'PLAYER_HOME_CASH_DELIVERY');assert.equal(assignedHome.finance.earned,0);assert.equal(assignedHome.payroll.paid,0);
await page.locator('#homeLaunch').click();
await page.waitForFunction(()=>globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__?.snapshot?.()?.mission?.status==='ARRIVED_AWAITING_RECEIPT',null,{timeout:15000});
assert.equal((await page.evaluate(()=>globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__.snapshot())).payroll.paid,0,'arrival alone must not pay salary');
await page.locator('#sheetClose').click();await page.evaluate(()=>document.getElementById('playerLifeOpen')?.click());await page.locator('#playerLifeHomeNav').click();
await page.waitForFunction(()=>{const p=globalThis.__K11520_PRODUCT__.snapshot(),x=globalThis.__K11520_WORLD_COORDS__?.physical,h=p.home?.xyz;return h&&Math.hypot(x.x-h.x,x.y-h.y,x.z-h.z)<=2.5},null,{timeout:10000});
await page.locator('#homeDeliveryButton').click();await page.locator('#homeAccept').click();
await page.waitForFunction(()=>globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__?.snapshot?.()?.mission?.status==='DELIVERED',null,{timeout:3000});
const deliveredHome=await page.evaluate(()=>({ant:globalThis.__K11520_DIGITAL_ANT_5D_LOGISTICS__.snapshot(),player:globalThis.__K11520_PRODUCT__.snapshot()}));
assert.equal(deliveredHome.ant.mission.accounting.cargoPrincipalRecognizedAsRevenue,false);assert.ok(deliveredHome.ant.mission.accounting.freightRevenue>0);assert.ok(deliveredHome.ant.payroll.paid>0);assert.equal(deliveredHome.player.kaios,deliveryKaiosBefore-deliveredHome.ant.mission.accounting.freightRevenue);assert.match(deliveredHome.ant.mission.receiptId,/^HOME-RECEIPT-/);
assert.match(await page.locator('#homeDeliveryReceipt').textContent(),/DELIVERY VERIFIED/);
await page.screenshot({path:`${OUT}/11520-player-home-delivery-receipt.png`});await page.locator('#sheetClose').click();
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

await browser.close();
console.log(`11520 Digital Ant living-world + routed canonical 3D selected-Life HP/XYZ browser visual QA PASS (${picked.lifeId})`);
