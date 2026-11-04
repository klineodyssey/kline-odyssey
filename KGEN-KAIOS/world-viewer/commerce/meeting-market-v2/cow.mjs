import {deliveryPreview,SETTLEMENT_STATUS} from './market.mjs';
/**
 * KAIOS Meeting Market V2: digital cow construction, on-site delivery and grazing.
 * This is an off-chain, deterministic game-world simulation, NOT a Life ID authority,
 * financial settlement, wallet, GPS, or physical-world animal registry.
 */
export const COW_FRAME='LOCAL_XYZ_METERS';
export const COW_WORK_SECONDS=3600;
const TOLERANCE_METERS=2.5;
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const vec=v=>v && ['x','y','z'].every(k=>finite(v[k]));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const freeze=obj=>Object.freeze(obj);
export function createCowOrderSpec({order,site,grassPatch,blueprintId='DIGITAL_COW_V1',cowName='花果山牛牛',materialUnits=1}) {
  if(!order||order.asset!=='數位牛創生服務'||order.quantity!==1)throw Error('COW_ORDER_REQUIRES_ONE_COW');
  if(!site||site.pointId!==order.meetingPointId||site.pointId!==order.buyerPointId||site.frame!==COW_FRAME||!vec(site))throw Error('COW_SITE_XYZ_INVALID');
  if(!grassPatch||grassPatch.pointId!==site.pointId||grassPatch.frame!==COW_FRAME||!vec(grassPatch)||distance(site,grassPatch)>50)throw Error('COW_GRASS_RESOURCE_REQUIRED');
  if(!Number.isSafeInteger(materialUnits)||materialUnits!==1)throw Error('COW_SINGLE_BLUEPRINT_REQUIRED');
  if(!/^[A-Za-z0-9_-]{3,80}$/.test(blueprintId))throw Error('COW_BLUEPRINT_INVALID');
  return freeze({orderId:order.orderId,site:freeze({...site}),grassPatch:freeze({...grassPatch}),cowName:String(cowName).slice(0,50),blueprintId,materialUnits,productType:'COW_CREATION_SERVICE',lifeId:null,status:'PENDING_CONSTRUCTION',owner:order.buyer});
}
export function createCowMission(spec,{timeToBuildSeconds=COW_WORK_SECONDS,enemyCount=1}={}) {
  if(!spec||spec.status!=='PENDING_CONSTRUCTION') throw Error('COW_SPEC_REQUIRED');
  if(!Number.isSafeInteger(timeToBuildSeconds)||timeToBuildSeconds<=0||timeToBuildSeconds>86400)throw Error('COW_BUILD_DURATION_INVALID');
  if(!Number.isSafeInteger(enemyCount)||enemyCount<0||enemyCount>5)throw Error('COW_ENEMY_COUNT_INVALID');
  return freeze({spec,elapsedSeconds:0,buildDuration:timeToBuildSeconds,enemyCount,monstersHandled:0,constructionReady:false,goodsChecked:false,buyerAccepted:false,status:'AWAITING_MEETING',cow:null,paymentStatus:SETTLEMENT_STATUS,receipt:null});
}
export function advanceCowMission(mission,{order,buyerTrip,sellerTrip,seconds,monsterAction='FOLLOW'}={}) {
  if(!mission||mission.status==='COW_ACTIVE_GAME'||mission.cow)throw Error('COW_ALREADY_CREATED');
  if(!['FOLLOW','HARD_FIGHT','REVERSE_ATTACK','AVOID'].includes(monsterAction))throw Error('INVALID_MONSTER_ACTION');
  if(!Number.isSafeInteger(seconds)||seconds<=0||seconds>86400)throw Error('GAME_TIME_INVALID');
  if(!order||order.orderId!==mission.spec.orderId||order.quoteStatus!=='AGREED_MEETING_PENDING')throw Error('COW_PRICE_NOT_ACCEPTED');
  const meeting=deliveryPreview(order,buyerTrip,sellerTrip,{});
  if(meeting.status!=='DELIVERY_NOT_ACCEPTED')throw Error('COW_BOTH_PARTIES_MUST_ARRIVE');
  const elapsed=Math.min(mission.buildDuration,mission.elapsedSeconds+seconds);
  const monstersHandled=monsterAction==='AVOID'?mission.monstersHandled:Math.min(mission.enemyCount,mission.monstersHandled+1);
  const constructionReady=elapsed===mission.buildDuration&&monstersHandled===mission.enemyCount;
  return freeze({...mission,elapsedSeconds:elapsed,monstersHandled,constructionReady,status:constructionReady?'READY_FOR_INSPECTION':'IN_CONSTRUCTION'});
}
export function inspectCowMission(mission,{goodsChecked=false,buyerAccepted=false,buyerPosition,sellerPosition}={}){
  if(!mission||mission.status==='COW_ACTIVE_GAME')throw Error('COW_ALREADY_CREATED');
  if(!mission.constructionReady)throw Error('COW_CONSTRUCTION_NOT_READY');
  const loc=mission.spec.site;
  if(!vec(buyerPosition)||!vec(sellerPosition)||distance(buyerPosition,loc)>TOLERANCE_METERS||distance(sellerPosition,loc)>TOLERANCE_METERS)throw Error('COW_LOCAL_XYZ_MEETING_REQUIRED');
  if(!goodsChecked||!buyerAccepted)throw Error('COW_INSPECTION_OR_ACCEPTANCE_REQUIRED');
  return freeze({...mission,goodsChecked,buyerAccepted,status:'DELIVERY_ACCEPTED_BIRTH_PENDING'});
}
export function activateCow(mission,{existingCowIds=[],grassAvailable=true}={}) {
  if(!mission||mission.status!=='DELIVERY_ACCEPTED_BIRTH_PENDING'||!mission.goodsChecked||!mission.buyerAccepted)throw Error('COW_DELIVERY_NOT_ACCEPTED');
  if(!Array.isArray(existingCowIds))throw Error('COW_REGISTRY_REQUIRED');
  const id='COW-'+mission.spec.orderId;
  if(existingCowIds.includes(id))throw Error('COW_DUPLICATE_BIRTH');
  if(!grassAvailable)throw Error('COW_GRASS_NOT_AVAILABLE');
  const {site,grassPatch}=mission.spec;
  const cow=freeze({cowId:id,lifeId:null,identityStatus:'GAME_COW_ONLY_NOT_FORMAL_LIFE',name:mission.spec.cowName,owner:mission.spec.owner,pointId:site.pointId,frame:COW_FRAME,position:freeze({x:site.x,y:site.y,z:site.z}),grassPatch,ageSeconds:0,hunger:80,energy:90,activity:'GRAZING',health:100,originWorkId:mission.spec.orderId,duplicated:false});
  return freeze({...mission,status:'COW_ACTIVE_GAME',cow,materialConsumed:true,lifeId:null,receipt:null,paymentStatus:SETTLEMENT_STATUS});
}
export function tickCow(cow,{seconds,grassAvailable=true,grassUnits=1}={}) {
  if(!cow||cow.activity==='DEAD')throw Error('COW_UNAVAILABLE');
  if(!Number.isSafeInteger(seconds)||seconds<=0||seconds>86400)throw Error('COW_TIME_INVALID');
  if(!Number.isSafeInteger(grassUnits)||grassUnits<0||grassUnits>100)throw Error('COW_GRASS_UNITS_INVALID');
  const hasFood=grassAvailable&&grassUnits>0;
  const eating=hasFood&&cow.hunger>0;
  const foodConsumed=eating?1:0;
  const hunger=eating?Math.max(0,cow.hunger-25):Math.min(100,cow.hunger+10);
  const energy=eating?Math.min(100,cow.energy+5):Math.max(0,cow.energy-5);
  const position=freeze(eating?{...cow.position,x:cow.grassPatch.x,z:cow.grassPatch.z}:{...cow.position,x:cow.position.x+0.2,z:cow.position.z+0.1});
  return freeze({...cow,position,activity:eating?'GRAZING':(hunger>=90?'HUNGRY':'ROAMING'),hunger,energy,ageSeconds:cow.ageSeconds+seconds,foodConsumed});
}

/** A local-only snapshot is never chain settlement or formal Life identity evidence. */
export function restoreCowSnapshot(data){
  if(!data||data.version!==1||!Array.isArray(data.cowIds)||data.cowIds.length>1000||new Set(data.cowIds).size!==data.cowIds.length)throw Error('COW_SNAPSHOT_INVALID');
  if(data.cowIds.some(x=>typeof x!=='string'||!/^COW-[A-Za-z0-9_-]{1,101}$/.test(x)))throw Error('COW_SNAPSHOT_INVALID');
  const cow=data.cow;
  if(cow!==null){
    if(!cow||!data.cowIds.includes(cow.cowId)||cow.identityStatus!=='GAME_COW_ONLY_NOT_FORMAL_LIFE'||cow.lifeId!==null||!vec(cow.position)||!vec(cow.grassPatch)||cow.frame!==COW_FRAME||cow.pointId!==cow.grassPatch.pointId)throw Error('COW_SNAPSHOT_INVALID');
    if(!Number.isFinite(cow.hunger)||!Number.isFinite(cow.energy)||!Number.isSafeInteger(cow.ageSeconds))throw Error('COW_SNAPSHOT_INVALID');
  }
  return freeze({cowIds:freeze([...data.cowIds]),cow:cow?freeze({...cow,position:freeze({...cow.position}),grassPatch:freeze({...cow.grassPatch})}):null});
}
