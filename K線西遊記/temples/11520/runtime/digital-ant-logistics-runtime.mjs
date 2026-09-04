/*
KGEN_META
VERSION: 1.0.0
REVISION: 2026-09-04.DIGITAL-ANT-ATM-DELIVERY
STATUS: ACTIVE / SIMULATION-FIRST
SOURCE_OF_TRUTH: LOGISTICS_UNIVERSE_SPEC.md
*/

import {universeLevel,routeFromAnchor,logisticsDecision,LOGISTICS_ANCHOR} from './logistics-universe-runtime.mjs';

export const DIGITAL_ANT_SPECIES='DIGITAL_ANT';
export const DIGITAL_ANT_ROLE='WUZHISHAN_WUKONG_CAISHEN_GATEKEEPER_AND_LOGISTICS_LIFE';

export function buildAtmRegistry(worldObjects=[]){
  return worldObjects.filter(x=>x?.type==='ATM'||x?.kind==='ATM').map((x,i)=>({
    atmId:x.id||`ATM-11520-${String(i+1).padStart(3,'0')}`,
    lifeId:x.lifeId||null,
    name:x.name||`ATM ${i+1}`,
    x:Number(x.x)||0,
    y:Number(x.y)||0,
    z:Number(x.z)||0,
    online:true,
  }));
}

export function createDigitalAnt({lifeId='LIFE-DIGITAL-ANT-11520-001',name='Digital Ant',capital=20,vitality=100,cargoCapacity=100}={}){
  return {
    lifeId,name,species:DIGITAL_ANT_SPECIES,role:DIGITAL_ANT_ROLE,
    capital:Number(capital)||0,vitality:Number(vitality)||0,cargoCapacity:Number(cargoCapacity)||0,
    cargo:{kind:null,amount:0,unit:null},mission:null,state:'IDLE',x:0,y:0,z:0,
  };
}

export function createDeliveryMission({missionId=`DELIVERY-${Date.now()}`,cargoKind='CASH',amount=0,unit='KAIOS',destinationAtmId,price=LOGISTICS_ANCHOR,demand=1}={}){
  return {
    missionId,cargoKind,amount:Math.max(0,Number(amount)||0),unit:String(unit||'KAIOS'),destinationAtmId:String(destinationAtmId||''),
    price:Number(price)||LOGISTICS_ANCHOR,demand:Number(demand)||0,status:'CREATED',createdAt:Date.now(),pickedUpAt:null,deliveredAt:null,failedAt:null,
  };
}

export function assignDelivery(ant,mission,atmRegistry=[]){
  const atm=atmRegistry.find(x=>x.atmId===mission.destinationAtmId);
  if(!atm)return {ok:false,reason:'ATM_NOT_FOUND'};
  if(!atm.online)return {ok:false,reason:'ATM_OFFLINE'};
  if(mission.amount<=0)return {ok:false,reason:'EMPTY_CARGO'};
  if(mission.amount>ant.cargoCapacity)return {ok:false,reason:'OVER_CAPACITY'};
  const decision=logisticsDecision({destination:mission.price,demand:mission.demand,capital:ant.capital,vitality:ant.vitality,cargoCapacity:ant.cargoCapacity,currentCargo:0});
  if(['RETREAT','RETURN','WAIT'].includes(decision.action)&&decision.reason!=='NO_DEMAND')return {ok:false,reason:decision.reason,decision};
  ant.mission={...mission,status:'ASSIGNED',destination:{...atm},route:routeFromAnchor(mission.price),level:universeLevel(mission.price)};
  ant.state='LOAD';
  return {ok:true,mission:ant.mission,decision};
}

export function loadCargo(ant){
  if(!ant.mission)return {ok:false,reason:'NO_MISSION'};
  const m=ant.mission;
  ant.cargo={kind:m.cargoKind,amount:m.amount,unit:m.unit};
  m.status='IN_TRANSIT';m.pickedUpAt=Date.now();ant.state=m.route.route;
  return {ok:true,cargo:{...ant.cargo},route:m.route};
}

function distance(a,b){return Math.hypot((a.x||0)-(b.x||0),(a.z||0)-(b.z||0))}

export function tickDigitalAntDelivery(ant,{deltaMs=16,speed=.018}={}){
  const m=ant.mission;
  if(!m||m.status!=='IN_TRANSIT')return {ok:false,reason:'NOT_IN_TRANSIT',state:ant.state};
  if(ant.vitality<=15){ant.state='RETREAT';return {ok:false,reason:'LOW_VITALITY',state:ant.state}};
  if(ant.capital<=0){ant.state='RETURN';return {ok:false,reason:'NO_CAPITAL',state:ant.state}};
  const target=m.destination,d=distance(ant,target);
  if(d<=.45){
    ant.x=target.x;ant.y=target.y||0;ant.z=target.z;
    m.status='DELIVERED';m.deliveredAt=Date.now();ant.state='DELIVERED';
    const delivered={...ant.cargo};ant.cargo={kind:null,amount:0,unit:null};
    return {ok:true,delivered:true,atmId:target.atmId,cargo:delivered,missionId:m.missionId};
  }
  const dx=target.x-ant.x,dz=target.z-ant.z,len=Math.hypot(dx,dz)||1,step=Math.min(d,Math.max(0,speed*Number(deltaMs||0)));
  ant.x+=dx/len*step;ant.z+=dz/len*step;
  return {ok:true,delivered:false,state:ant.state,remaining:distance(ant,target),route:m.route};
}

export function deliverySnapshot(ant){
  const m=ant.mission;
  return {
    lifeId:ant.lifeId,name:ant.name,species:ant.species,role:ant.role,state:ant.state,
    position:{x:ant.x,y:ant.y,z:ant.z},vitality:ant.vitality,capital:ant.capital,cargo:{...ant.cargo},
    mission:m?{missionId:m.missionId,status:m.status,destinationAtmId:m.destinationAtmId,route:m.route,level:m.level,cargoKind:m.cargoKind,amount:m.amount,unit:m.unit}:null,
    simulation:true,
  };
}
