/*
KGEN_META
VERSION: 1.1.1
REVISION: 2026-09-08.DIGITAL-ANT-CFO-XYZ-LOGISTICS
STATUS: ACTIVE / SIMULATION-FIRST
SOURCE_OF_TRUTH: LOGISTICS_UNIVERSE_SPEC.md / HUAGUOSHAN_TAIWAN_EXCHANGE_WHITEPAPER.md
CHANGE_REASON: Upgrade Digital Ant from fixed XZ delivery to autonomous XYZ dispatch with explicit freight economics, six-direction routing, no-trade decisions, and receipt-gated simulation boundaries. Preserve null distanceMeters as automatic world-distance mode.
*/

import {universeLevel,routeFromAnchor,logisticsDecision,LOGISTICS_ANCHOR} from './logistics-universe-runtime.mjs';

export const DIGITAL_ANT_SPECIES='DIGITAL_ANT';
export const DIGITAL_ANT_ROLE='WUZHISHAN_WUKONG_CAISHEN_GATEKEEPER_AND_LOGISTICS_LIFE';
export const DELIVERY_MODES=Object.freeze(['OBSERVE','LONG','SHORT']);
export const CFO_ACTIONS=Object.freeze(['ACCEPT','REQUOTE','REJECT','WAIT','RETURN','RETREAT']);

const n=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,n(v)));

export function buildAtmRegistry(worldObjects=[]){
  return worldObjects.filter(x=>x?.type==='ATM'||x?.kind==='ATM').map((x,i)=>({
    atmId:x.id||`ATM-11520-${String(i+1).padStart(3,'0')}`,
    lifeId:x.lifeId||null,
    name:x.name||`ATM ${i+1}`,
    x:n(x.x),y:n(x.y),z:n(x.z),
    cashDemand:Math.max(0,n(x.cashDemand)),
    kgenDemand:Math.max(0,n(x.kgenDemand)),
    kaiosDemand:Math.max(0,n(x.kaiosDemand)),
    online:x.online!==false,
  }));
}

export function createDigitalAnt({
  lifeId='LIFE-DIGITAL-ANT-11520-001',name='Digital Ant',capital=20,vitality=100,cargoCapacity=100,
  retirementReserve=0,targetRetirementReserve=100
}={}){
  return {
    lifeId,name,species:DIGITAL_ANT_SPECIES,role:DIGITAL_ANT_ROLE,
    capital:Math.max(0,n(capital)),vitality:clamp(vitality,0,100),cargoCapacity:Math.max(0,n(cargoCapacity)),
    retirementReserve:Math.max(0,n(retirementReserve)),targetRetirementReserve:Math.max(1,n(targetRetirementReserve,100)),
    cargo:{kind:null,amount:0,unit:null},mission:null,state:'IDLE',x:0,y:0,z:0,
    finance:{earned:0,spent:0,tips:0,freight:0,fuel:0,salary:0,maintenance:0,risk:0,time:0,lastNet:0},
  };
}

export function createDeliveryMission({
  missionId=`DELIVERY-${Date.now()}`,cargoKind='CASH',amount=0,unit='KAIOS',destinationAtmId,
  price=LOGISTICS_ANCHOR,demand=1,mode='OBSERVE',marketEdge=0,freightOffer=0,
  distanceMeters=null,metersPerWorldUnit=1,baseFreight=0,distanceRate=0,loadRate=0,riskRate=0,
  fuelPerMeter=0,salaryPerSecond=0,maintenancePerMeter=0,timeCostPerSecond=0,riskProbability=0,riskLoss=0,
  speedMetersPerSecond=1,tipRate=0
}={}){
  const normalizedMode=DELIVERY_MODES.includes(String(mode).toUpperCase())?String(mode).toUpperCase():'OBSERVE';
  const explicitDistance=distanceMeters===null||distanceMeters===undefined||distanceMeters===''?null:Math.max(0,n(distanceMeters));
  return {
    missionId,cargoKind,amount:Math.max(0,n(amount)),unit:String(unit||'KAIOS'),destinationAtmId:String(destinationAtmId||''),
    price:n(price,LOGISTICS_ANCHOR),demand:n(demand),mode:normalizedMode,marketEdge:n(marketEdge),freightOffer:Math.max(0,n(freightOffer)),
    economics:{distanceMeters:explicitDistance,metersPerWorldUnit:Math.max(0.000001,n(metersPerWorldUnit,1)),baseFreight:Math.max(0,n(baseFreight)),distanceRate:Math.max(0,n(distanceRate)),loadRate:Math.max(0,n(loadRate)),riskRate:Math.max(0,n(riskRate)),fuelPerMeter:Math.max(0,n(fuelPerMeter)),salaryPerSecond:Math.max(0,n(salaryPerSecond)),maintenancePerMeter:Math.max(0,n(maintenancePerMeter)),timeCostPerSecond:Math.max(0,n(timeCostPerSecond)),riskProbability:clamp(riskProbability,0,1),riskLoss:Math.max(0,n(riskLoss)),speedMetersPerSecond:Math.max(0.000001,n(speedMetersPerSecond,1)),tipRate:Math.max(0,n(tipRate))},
    status:'CREATED',createdAt:Date.now(),pickedUpAt:null,deliveredAt:null,failedAt:null,receiptVerified:false,
  };
}

export function distance3d(a={},b={}){
  return Math.hypot(n(a.x)-n(b.x),n(a.y)-n(b.y),n(a.z)-n(b.z));
}

export function sixDirectionVector(a={},b={}){
  const dx=n(b.x)-n(a.x),dy=n(b.y)-n(a.y),dz=n(b.z)-n(a.z);
  const axes=[['+X',dx],['-X',-dx],['+Y',dy],['-Y',-dy],['+Z',dz],['-Z',-dz]].sort((p,q)=>q[1]-p[1]);
  return {dx,dy,dz,primary:axes[0][1]>0?axes[0][0]:'HOLD',axes:Object.fromEntries(axes)};
}

export function quoteDeliveryEconomics(ant,mission,atm){
  const e=mission.economics||{};
  const worldDistance=distance3d(ant,atm);
  const distanceMeters=e.distanceMeters===null||e.distanceMeters===undefined?worldDistance*Math.max(0.000001,n(e.metersPerWorldUnit,1)):Math.max(0,n(e.distanceMeters));
  const speed=Math.max(0.000001,n(e.speedMetersPerSecond,1));
  const travelSeconds=distanceMeters/speed;
  const freight=Math.max(0,n(mission.freightOffer))||Math.max(0,n(e.baseFreight)+distanceMeters*n(e.distanceRate)+mission.amount*n(e.loadRate)+distanceMeters*n(e.riskRate));
  const fuel=distanceMeters*n(e.fuelPerMeter);
  const salary=travelSeconds*n(e.salaryPerSecond);
  const maintenance=distanceMeters*n(e.maintenancePerMeter);
  const time=travelSeconds*n(e.timeCostPerSecond);
  const risk=n(e.riskProbability)*n(e.riskLoss);
  const mode=DELIVERY_MODES.includes(mission.mode)?mission.mode:'OBSERVE';
  const signedEdge=mode==='LONG'?n(mission.marketEdge):mode==='SHORT'?-n(mission.marketEdge):0;
  const tip=mode==='OBSERVE'?0:Math.max(0,signedEdge)*Math.max(0,n(e.tipRate))*Math.max(0,mission.amount);
  const revenue=freight+tip;
  const cost=fuel+salary+maintenance+time+risk;
  const net=revenue-cost;
  return {distanceWorld:worldDistance,distanceMeters,travelSeconds,freight,tip,revenue,fuel,salary,maintenance,time,risk,cost,net,mode,marketEdge:n(mission.marketEdge),direction:sixDirectionVector(ant,atm),simulation:true};
}

export function cfoEvaluateDelivery(ant,mission,atm,{minimumProfit=0,requoteMargin=0.08}={}){
  if(!atm)return {action:'REJECT',reason:'ATM_NOT_FOUND',quote:null};
  if(!atm.online)return {action:'REJECT',reason:'ATM_OFFLINE',quote:null};
  if(mission.amount<=0)return {action:'REJECT',reason:'EMPTY_CARGO',quote:null};
  if(mission.amount>ant.cargoCapacity)return {action:'REJECT',reason:'OVER_CAPACITY',quote:null};
  if(ant.vitality<=15)return {action:'RETREAT',reason:'LOW_VITALITY',quote:null};
  if(ant.capital<=0)return {action:'RETURN',reason:'NO_CAPITAL',quote:null};
  if(mission.demand<=0)return {action:'WAIT',reason:'NO_DEMAND',quote:null};
  const quote=quoteDeliveryEconomics(ant,mission,atm);
  if(quote.net>=n(minimumProfit))return {action:'ACCEPT',reason:'POSITIVE_EXPECTED_VALUE',quote};
  const requiredFreight=Math.max(0,quote.cost+n(minimumProfit)-quote.tip)*(1+Math.max(0,n(requoteMargin)));
  if(requiredFreight>quote.freight)return {action:'REQUOTE',reason:'FREIGHT_TOO_LOW',quote,requiredFreight};
  return {action:'REJECT',reason:'NEGATIVE_EXPECTED_VALUE',quote};
}

export function chooseBestDelivery(ant,missions=[],atmRegistry=[],options={}){
  const evaluated=(missions||[]).map(m=>{
    const atm=atmRegistry.find(x=>x.atmId===m.destinationAtmId);
    return {mission:m,atm,evaluation:cfoEvaluateDelivery(ant,m,atm,options)};
  });
  const accepted=evaluated.filter(x=>x.evaluation.action==='ACCEPT').sort((a,b)=>(b.evaluation.quote?.net||-Infinity)-(a.evaluation.quote?.net||-Infinity));
  if(accepted.length)return {...accepted[0],action:'ACCEPT'};
  const requotes=evaluated.filter(x=>x.evaluation.action==='REQUOTE').sort((a,b)=>(a.evaluation.requiredFreight||Infinity)-(b.evaluation.requiredFreight||Infinity));
  if(requotes.length)return {...requotes[0],action:'REQUOTE'};
  return {action:'WAIT',reason:'NO_PROFITABLE_DELIVERY',evaluated};
}

export function assignDelivery(ant,mission,atmRegistry=[],options={}){
  const atm=atmRegistry.find(x=>x.atmId===mission.destinationAtmId);
  const legacy=logisticsDecision({destination:mission.price,demand:mission.demand,capital:ant.capital,vitality:ant.vitality,cargoCapacity:ant.cargoCapacity,currentCargo:0});
  const cfo=cfoEvaluateDelivery(ant,mission,atm,options);
  if(cfo.action!=='ACCEPT')return {ok:false,reason:cfo.reason,decision:legacy,cfo};
  ant.mission={...mission,status:'ASSIGNED',destination:{...atm},route:routeFromAnchor(mission.price),level:universeLevel(mission.price),quote:cfo.quote};
  ant.state='LOAD';
  return {ok:true,mission:ant.mission,decision:legacy,cfo};
}

export function loadCargo(ant){
  if(!ant.mission)return {ok:false,reason:'NO_MISSION'};
  const m=ant.mission;
  ant.cargo={kind:m.cargoKind,amount:m.amount,unit:m.unit};
  m.status='IN_TRANSIT';m.pickedUpAt=Date.now();ant.state=m.route?.route||'IN_TRANSIT';
  return {ok:true,cargo:{...ant.cargo},route:m.route,quote:m.quote};
}

export function tickDigitalAntDelivery(ant,{deltaMs=16,speed=.018}={}){
  const m=ant.mission;
  if(!m||m.status!=='IN_TRANSIT')return {ok:false,reason:'NOT_IN_TRANSIT',state:ant.state};
  if(ant.vitality<=15){ant.state='RETREAT';return {ok:false,reason:'LOW_VITALITY',state:ant.state}};
  if(ant.capital<=0){ant.state='RETURN';return {ok:false,reason:'NO_CAPITAL',state:ant.state}};
  const target=m.destination,d=distance3d(ant,target);
  if(d<=.45){
    ant.x=target.x;ant.y=target.y;ant.z=target.z;
    m.status='ARRIVED_AWAITING_RECEIPT';ant.state='ARRIVED_AWAITING_RECEIPT';
    return {ok:true,arrived:true,delivered:false,atmId:target.atmId,missionId:m.missionId,cargo:{...ant.cargo}};
  }
  const dx=target.x-ant.x,dy=target.y-ant.y,dz=target.z-ant.z,len=Math.hypot(dx,dy,dz)||1,step=Math.min(d,Math.max(0,n(speed)*n(deltaMs)));
  ant.x+=dx/len*step;ant.y+=dy/len*step;ant.z+=dz/len*step;
  return {ok:true,arrived:false,delivered:false,state:ant.state,remaining:distance3d(ant,target),direction:sixDirectionVector(ant,target),route:m.route};
}

export function verifyDeliveryReceipt(ant,{receiptId=null,verified=false,now=Date.now()}={}){
  const m=ant.mission;
  if(!m||m.status!=='ARRIVED_AWAITING_RECEIPT')return {ok:false,reason:'NOT_AWAITING_RECEIPT'};
  if(!verified||!receiptId)return {ok:false,reason:'VERIFIED_RECEIPT_REQUIRED'};
  m.receiptVerified=true;m.receiptId=String(receiptId);m.status='DELIVERED';m.deliveredAt=now;ant.state='DELIVERED';
  const delivered={...ant.cargo};ant.cargo={kind:null,amount:0,unit:null};
  const q=m.quote||quoteDeliveryEconomics(ant,m,m.destination);
  ant.finance.earned+=q.revenue;ant.finance.spent+=q.cost;ant.finance.tips+=q.tip;ant.finance.freight+=q.freight;
  ant.finance.fuel+=q.fuel;ant.finance.salary+=q.salary;ant.finance.maintenance+=q.maintenance;ant.finance.risk+=q.risk;ant.finance.time+=q.time;ant.finance.lastNet=q.net;
  ant.capital=Math.max(0,ant.capital+q.net);
  if(q.net>0){const reserve=q.net*0.2;ant.retirementReserve+=reserve;ant.capital=Math.max(0,ant.capital-reserve);}
  return {ok:true,delivered:true,atmId:m.destination.atmId,cargo:delivered,missionId:m.missionId,receiptId:m.receiptId,quote:q,retirementReserve:ant.retirementReserve};
}

export function deliverySnapshot(ant){
  const m=ant.mission;
  return {
    lifeId:ant.lifeId,name:ant.name,species:ant.species,role:ant.role,state:ant.state,
    position:{x:ant.x,y:ant.y,z:ant.z},vitality:ant.vitality,capital:ant.capital,retirementReserve:ant.retirementReserve,targetRetirementReserve:ant.targetRetirementReserve,cargo:{...ant.cargo},finance:{...ant.finance},
    mission:m?{missionId:m.missionId,status:m.status,destinationAtmId:m.destinationAtmId,route:m.route,level:m.level,cargoKind:m.cargoKind,amount:m.amount,unit:m.unit,mode:m.mode,quote:m.quote,receiptVerified:Boolean(m.receiptVerified)}:null,
    simulation:true,realAssetTransfer:false,mainnetWrite:false,
  };
}
