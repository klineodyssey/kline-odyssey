/*
KGEN_META
VERSION: 1.6.0
REVISION: 2026-10-03.DIGITAL-ANT-PLAYER-COURIER
STATUS: ACTIVE / SIMULATION-FIRST
SOURCE_OF_TRUTH: LOGISTICS_UNIVERSE_SPEC.md / HUAGUOSHAN_TAIWAN_EXCHANGE_WHITEPAPER.md
CHANGE_REASON: Extend the existing Digital Ant logistics runtime with persistent background Player Courier missions, explicit bandit raids, canonical cargo ownership and one-shot local-game settlement while preserving ATM-UFO delivery and keeping cargo principal out of revenue.
*/

import {acquireLocalGameWriter} from './evm-wallet-runtime.mjs';
import {universeLevel,routeFromAnchor,logisticsDecision,LOGISTICS_ANCHOR} from './logistics-universe-runtime.mjs';
import {deriveMarketRelations} from './market-relation-runtime.mjs';

export const DIGITAL_ANT_SPECIES='DIGITAL_ANT';
export const DIGITAL_ANT_ROLE='WUZHISHAN_WUKONG_CAISHEN_GATEKEEPER_AND_LOGISTICS_LIFE';
export const DELIVERY_MODES=Object.freeze(['OBSERVE','LONG','SHORT']);
export const CFO_ACTIONS=Object.freeze(['ACCEPT','REQUOTE','REJECT','WAIT','RETURN','RETREAT']);
export const DIGITAL_ANT_GAME_ROLE='ARMORED_CASH_COURIER_MARKET_GUARDIAN';
export const DIGITAL_ANT_ENCOUNTER_ACTIONS=Object.freeze(['OBSERVE','ESCORT','MOVEMENT_LONG_SHORT_DUEL_WAIT_SETTLEMENT','DEFEND_AND_REROUTE','RETREAT']);
export const CARGO_HEDGE_ACTIONS=Object.freeze(['NO_HEDGE','HOLD','HEDGE_CANDIDATE']);
export const K_INDEX_KM=384400/16888;
export const C_SPEED_K_PER_SECOND=.001;
export const KAIOS_PER_CARGO_LOT=1000;
export const ATM_UFO_TRANSPORT_MODE='ATM_UFO_5D';
export const CARGO_RISK_CAUSES=Object.freeze(['THEFT_ROBBERY','NATURAL_DISASTER','CARGO_DAMAGE','DELIVERY_INTERRUPTION']);
export const CARGO_INSURANCE_MODES=Object.freeze(['BROKERAGE_QUOTE_ONLY','UNDERWRITING_READY','LOCAL_SIMULATION_COVERED']);
export const CARGO_RAID_RANGE_METERS=5;
export const MISSILE_MAX_RANGE_METERS=120;
export const HOME_DELIVERY_ACCEPTANCE_RANGE_METERS=2.5;
export const PLAYER_COURIER_STORAGE_KEY='K11520_PLAYER_COURIER';
export const PLAYER_COURIER_SCHEMA='K11520_PLAYER_COURIER';
export const PLAYER_COURIER_TERMINAL_STATES=Object.freeze(['DELIVERED','ROBBED','FAILED']);
export const PLAYER_COURIER_ACTIVE_STATES=Object.freeze(['ACTIVE','CLOCK_REVIEW','DELIVERY_PENDING_CREDIT']);
export const PLAYER_COURIER_MIN_DURATION_MS=60_000;
export const PLAYER_COURIER_MAX_DURATION_MS=7_200_000;
export const PLAYER_COURIER_RAID_COOLDOWN_MS=30_000;
export const KAIOS_MASS_KG=1;
// Gameplay hull normalization. It converts simulated joules into the UFO's
// bounded 0..100 operational-energy meter; it is not a real materials claim.
export const JOULES_PER_OPERATIONAL_ENERGY=250;
export const ATM_UFO_MAX_OPERATIONAL_ENERGY=100;
export const LIGHT_SPEED_METERS_PER_SECOND=299792458;

const n=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,n(v)));
const whole=(value,label='AMOUNT')=>{const parsed=Number(value);if(!Number.isSafeInteger(parsed)||parsed<0)throw new Error(`INVALID_${label}`);return parsed};
const bps=(value,label='BPS')=>{const parsed=whole(value,label);if(parsed>10000)throw new Error(`INVALID_${label}`);return parsed};
const mulBpsCeil=(amount,rate)=>Number((BigInt(amount)*BigInt(rate)+9999n)/10000n);
const raidHash=value=>{let h=2166136261;for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};

function exposurePositions(exposures=[]){
  const out={};
  for(const exposure of exposures||[]){
    const axis=String(exposure?.axis||'').toUpperCase();
    const side=n(exposure?.side)>0?1:n(exposure?.side)<0?-1:0;
    if(!['KX','KY','KZ'].includes(axis)||!side)continue;
    out[axis]={market:String(exposure.market||''),side,lots:Math.max(0,n(exposure.lots)),c:Math.max(0,n(exposure.c))};
  }
  return out;
}

function movementRelations(playerMovement={},antMovement={}){
  const axes={};
  for(const axis of ['X','Y','Z']){
    const playerSide=Math.sign(n(playerMovement[axis.toLowerCase()])),antSide=Math.sign(n(antMovement[axis.toLowerCase()]));
    axes[axis]={playerSide,antSide,relation:!playerSide||!antSide?'NEUTRAL':playerSide===antSide?'ALIGNED':'OPPOSED'};
  }
  const active=Object.values(axes).map(value=>value.relation).filter(value=>value!=='NEUTRAL');
  const overall=!active.length?'NEUTRAL':active.every(value=>value==='ALIGNED')?'ALIGNED':active.every(value=>value==='OPPOSED')?'OPPOSED':'MIXED';
  return {axes,overall};
}

export function planDigitalAntEncounter({
  playerAxes={},antExposures=[],playerMovement={},antMovement={},cargoAmount=0,cargoCustody='RESTRICTED_INVENTORY',routeRisk=0,threat=0
}={}){
  const lifePositions=exposurePositions(antExposures);
  const hedgeRelations=deriveMarketRelations({playerAxes,lifePositions});
  const movement=movementRelations(playerMovement,antMovement);
  const carryingRestricted=Math.max(0,n(cargoAmount))>0&&String(cargoCustody).toUpperCase()!=='GAME_REWARD_POOL';
  let action='OBSERVE',reason='NO_MOVEMENT_RELATION';
  if(carryingRestricted&&(clamp(threat,0,1)>=0.7||clamp(routeRisk,0,1)>=0.8)){
    action='DEFEND_AND_REROUTE';reason='RESTRICTED_CARGO_AT_RISK';
  }else if(movement.overall==='OPPOSED'||movement.overall==='MIXED'){
    action='MOVEMENT_LONG_SHORT_DUEL_WAIT_SETTLEMENT';reason='OPPOSING_XYZ_MOVEMENT';
  }else if(movement.overall==='ALIGNED'){
    action='ESCORT';reason='ALIGNED_XYZ_MOVEMENT';
  }
  return {
    role:DIGITAL_ANT_GAME_ROLE,action,reason,movementRelations:movement,hedgeRelations,
    cargoCustody,carryingRestricted,
    cargoLootable:false,restrictedCargoDirectlyLootable:false,robberyChallengeAllowed:true,gameplayRewardPoolRequired:true,playerAssetTheft:false,cargoPrincipalAtRisk:false,
    combatScope:'SIMULATION_ONLY',settlementRequired:action==='MOVEMENT_LONG_SHORT_DUEL_WAIT_SETTLEMENT',
    rewardPolicy:'FUNDED_GAME_REWARD_POOL_ONLY',physicalRouteAuthority:'UNIVERSE_MAP_XYZ',
    battleDirectionAuthority:'XYZ_MOVEMENT_ONLY',marketDirectionAuthority:'VERIFIED_KSPACE_HEDGE_EXPOSURE_ONLY',
  };
}

export function planCargoHedge({
  cargoAsset='KAIOS',cargoAmount=0,deliveryLiabilityAsset='KAIOS',
  variableCostExposure=null,marketAvailable=false,authorized=false,
  operatingRiskReserve=0,maxHedgeRatio=1,maxOrderLeverage=1
}={}){
  const principal=Math.max(0,n(cargoAmount));
  const cargo=String(cargoAsset||'').toUpperCase(),liability=String(deliveryLiabilityAsset||'').toUpperCase();
  const costAsset=String(variableCostExposure?.asset||'').toUpperCase();
  const costNotional=Math.max(0,n(variableCostExposure?.notional));
  const market=String(variableCostExposure?.market||'');
  const exposureSide=String(variableCostExposure?.type||'PAYABLE').toUpperCase()==='RECEIVABLE'?'SHORT':'LONG';
  const matchedPrincipal=Boolean(cargo&&liability&&cargo===liability);
  const common={cargoAsset:cargo,cargoAmount:principal,deliveryLiabilityAsset:liability,matchedPrincipal,cargoPrincipalAsMargin:false,realOrderCreated:false,simulation:true};
  if(principal<=0)return {...common,action:'NO_HEDGE',reason:'NO_CARGO_EXPOSURE',hedgeNotional:0};
  if(matchedPrincipal&&costNotional<=0)return {...common,action:'NO_HEDGE',reason:'MATCHED_ASSET_AND_LIABILITY',hedgeNotional:0};
  if(!costAsset||!market||costNotional<=0)return {...common,action:'HOLD',reason:'VERIFIABLE_COST_EXPOSURE_REQUIRED',hedgeNotional:0};
  if(!marketAvailable)return {...common,action:'HOLD',reason:'HEDGE_MARKET_UNAVAILABLE',hedgeNotional:0};
  if(!authorized)return {...common,action:'HOLD',reason:'HEDGE_AUTHORIZATION_REQUIRED',hedgeNotional:0};
  const cappedRatio=clamp(maxHedgeRatio,0,1),reserve=Math.max(0,n(operatingRiskReserve));
  const hedgeNotional=Math.min(costNotional,costNotional*cappedRatio,reserve);
  if(hedgeNotional<=0)return {...common,action:'HOLD',reason:'OPERATING_RISK_RESERVE_REQUIRED',hedgeNotional:0};
  return {
    ...common,action:'HEDGE_CANDIDATE',reason:'VARIABLE_COST_EXPOSURE',
    exposure:{asset:costAsset,notional:costNotional,type:String(variableCostExposure.type||'PAYABLE').toUpperCase()},
    hedge:{market,side:exposureSide,notional:hedgeNotional,orderLeverage:clamp(maxOrderLeverage,0,1)},
    hedgeNotional,riskReserveUsed:hedgeNotional,requiresSeparateCollateral:true,requiresReceipt:true,
  };
}

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

export function createPlayerHomeDestination({requestId,requesterLifeId,homePlotId,position={}}={}){
  const requester=String(requesterLifeId||'').trim(),plot=String(homePlotId||'').trim(),id=String(requestId||'').trim();
  if(!requester||!plot||!id)return {ok:false,reason:'PLAYER_HOME_IDENTITY_REQUIRED'};
  const coordinates={x:Number(position.x),y:Number(position.y),z:Number(position.z)};
  if(Object.values(coordinates).some(value=>!Number.isFinite(value)))return {ok:false,reason:'PLAYER_HOME_XYZ_REQUIRED'};
  const suffix=raidHash(`${requester}:${plot}:${id}`).toString(16).padStart(8,'0');
  return {ok:true,destination:{atmId:`PLAYER-HOME-${suffix}`,kind:'PLAYER_HOME',name:'玩家住家到府收貨點',requestId:id,requesterLifeId:requester,homePlotId:plot,...coordinates,online:true,cashDemand:0,kgenDemand:0,kaiosDemand:0,dynamic:true}};
}

export function createDigitalAnt({
  lifeId='LIFE-DIGITAL-ANT-11520-001',name='Digital Ant',capital=20,vitality=100,cargoCapacity=100,
  retirementReserve=0,targetRetirementReserve=100,x=0,y=0,z=0,
  vehicle={vehicleId:'ATM-UFO-DIGITAL-ANT-0001',type:ATM_UFO_TRANSPORT_MODE,lifeId:null}
}={}){
  return {
    lifeId,name,species:DIGITAL_ANT_SPECIES,role:DIGITAL_ANT_ROLE,
    capital:Math.max(0,n(capital)),vitality:clamp(vitality,0,100),cargoCapacity:Math.max(0,n(cargoCapacity)),
    retirementReserve:Math.max(0,n(retirementReserve)),targetRetirementReserve:Math.max(1,n(targetRetirementReserve,100)),
    cargo:{kind:null,amount:0,unit:null},mission:null,state:'IDLE',x:n(x),y:n(y),z:n(z),
    vehicle:{vehicleId:String(vehicle?.vehicleId||'ATM-UFO-DIGITAL-ANT-0001'),type:String(vehicle?.type||ATM_UFO_TRANSPORT_MODE),lifeId:vehicle?.lifeId||null,independentLife:false,maxOperationalEnergy:ATM_UFO_MAX_OPERATIONAL_ENERGY,operationalEnergy:ATM_UFO_MAX_OPERATIONAL_ENERGY,propulsion:'ONLINE'},
    finance:{earned:0,spent:0,tips:0,freight:0,fuel:0,salary:0,maintenance:0,risk:0,time:0,lastNet:0},
    payroll:{earned:0,paid:0,balance:0,currency:'KAIOS',scope:'LOCAL_SIMULATION_ONLY',lastReceiptId:null},
    cargoRisk:{desk:'AI_ANT_COMPANY_CARGO_RISK_DESK',policy:null,reserveKaios:0,incidents:[],replayKeys:[],lastRaidAt:0},
  };
}

export function createDeliveryMission({
  missionId=`DELIVERY-${Date.now()}`,cargoKind='CASH',amount=0,unit='KAIOS',destinationAtmId,
  price=LOGISTICS_ANCHOR,demand=1,mode='OBSERVE',marketEdge=0,freightOffer=0,
  distanceMeters=null,metersPerWorldUnit=1,baseFreight=0,distanceRate=0,loadRate=0,riskRate=0,
  fuelPerMeter=0,salaryPerSecond=0,maintenancePerMeter=0,timeCostPerSecond=0,riskProbability=0,riskLoss=0,
  speedMetersPerSecond=null,tipRate=0,movementC=1,flightAltitude=6,arrivalOffsetY=1.1,transportMode=ATM_UFO_TRANSPORT_MODE,
  gameplayRiskPool=0,maxRaidLoss=100,workerSalaryOffer=0
}={}){
  const normalizedMode=DELIVERY_MODES.includes(String(mode).toUpperCase())?String(mode).toUpperCase():'OBSERVE';
  const explicitDistance=distanceMeters===null||distanceMeters===undefined||distanceMeters===''?null:Math.max(0,n(distanceMeters));
  const explicitSpeed=speedMetersPerSecond===null||speedMetersPerSecond===undefined||speedMetersPerSecond===''?null:Math.max(0,n(speedMetersPerSecond));
  return {
    missionId,cargoKind,amount:Math.max(0,n(amount)),unit:String(unit||'KAIOS'),destinationAtmId:String(destinationAtmId||''),
    price:n(price,LOGISTICS_ANCHOR),demand:n(demand),mode:normalizedMode,marketEdge:n(marketEdge),freightOffer:Math.max(0,n(freightOffer)),
    economics:{distanceMeters:explicitDistance,metersPerWorldUnit:Math.max(0.000001,n(metersPerWorldUnit,1)),baseFreight:Math.max(0,n(baseFreight)),distanceRate:Math.max(0,n(distanceRate)),loadRate:Math.max(0,n(loadRate)),riskRate:Math.max(0,n(riskRate)),fuelPerMeter:Math.max(0,n(fuelPerMeter)),salaryPerSecond:Math.max(0,n(salaryPerSecond)),workerSalaryOffer:Math.max(0,n(workerSalaryOffer)),maintenancePerMeter:Math.max(0,n(maintenancePerMeter)),timeCostPerSecond:Math.max(0,n(timeCostPerSecond)),riskProbability:clamp(riskProbability,0,1),riskLoss:Math.max(0,n(riskLoss)),speedMetersPerSecond:explicitSpeed,tipRate:Math.max(0,n(tipRate))},
    movementC:n(movementC,1),flightAltitude:Math.max(1,n(flightAltitude,6)),arrivalOffsetY:Math.max(0,n(arrivalOffsetY,1.1)),transportMode:String(transportMode||ATM_UFO_TRANSPORT_MODE),
    gameplayRiskPool:whole(gameplayRiskPool,'GAMEPLAY_RISK_POOL'),gameplayRiskPoolRemaining:whole(gameplayRiskPool,'GAMEPLAY_RISK_POOL'),maxRaidLoss:whole(maxRaidLoss,'MAX_RAID_LOSS'),lastMovement:{x:0,y:0,z:0},
    status:'CREATED',createdAt:Date.now(),pickedUpAt:null,deliveredAt:null,failedAt:null,crashedAt:null,receiptVerified:false,
  };
}

export function createPlayerHomeDeliveryRequest({
  requestId=`HOME-DELIVERY-${Date.now()}`,requesterLifeId,homePlotId,homePosition={},origin={},cargoKind='CASH',amount=1000,unit='KAIOS',movementC=1,freightFee=null,workerSalary=null,price=LOGISTICS_ANCHOR
}={}){
  const cargo=String(cargoKind||'').toUpperCase();
  if(!['CASH','GOODS'].includes(cargo))return {ok:false,reason:'UNSUPPORTED_HOME_CARGO'};
  let cargoAmount;try{cargoAmount=whole(amount,'CARGO_AMOUNT')}catch(error){return {ok:false,reason:error.message}}
  if(cargoAmount<1)return {ok:false,reason:'CARGO_AMOUNT_REQUIRED'};
  const home=createPlayerHomeDestination({requestId,requesterLifeId,homePlotId,position:homePosition});
  if(!home.ok)return home;
  const distanceWorld=buildAtmUfoFlightPlan(origin,home.destination,{flightAltitude:6,arrivalOffsetY:1.1}).distanceWorld;
  const calculatedFee=Math.max(1,Math.ceil(2+distanceWorld*.05+cargoAmount/1000));
  let fee,salary;
  try{fee=freightFee==null?calculatedFee:whole(freightFee,'FREIGHT_FEE');salary=workerSalary==null?Math.max(1,Math.floor(fee*.4)):whole(workerSalary,'WORKER_SALARY')}catch(error){return {ok:false,reason:error.message}}
  if(salary>fee)return {ok:false,reason:'SALARY_EXCEEDS_FREIGHT_FEE'};
  const mission=createDeliveryMission({missionId:String(requestId),cargoKind:cargo,amount:cargoAmount,unit,destinationAtmId:home.destination.atmId,price,movementC,flightAltitude:6,arrivalOffsetY:1.1,transportMode:ATM_UFO_TRANSPORT_MODE,demand:1,freightOffer:fee,workerSalaryOffer:salary,fuelPerMeter:.002,maintenancePerMeter:.003,riskProbability:.01,riskLoss:Math.max(1,Math.ceil(cargoAmount*.001))});
  Object.assign(mission,{serviceType:cargo==='CASH'?'PLAYER_HOME_CASH_DELIVERY':'PLAYER_HOME_GOODS_DELIVERY',requesterLifeId:String(requesterLifeId),homePlotId:String(homePlotId),customerAcceptanceRequired:true,acceptanceRangeMeters:HOME_DELIVERY_ACCEPTANCE_RANGE_METERS,cargoCustody:'RESTRICTED_INVENTORY_WITH_MATCHING_LIABILITY',cargoPrincipalRevenue:false,paymentScope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'});
  return {ok:true,request:{requestId:String(requestId),requesterLifeId:String(requesterLifeId),homePlotId:String(homePlotId),cargoKind:cargo,amount:cargoAmount,unit:String(unit),freightFeeKaios:fee,workerSalaryKaios:salary,status:'REQUESTED_BY_PLAYER',createdAt:mission.createdAt,scope:'LOCAL_SIMULATION_ONLY'},destination:home.destination,mission};
}

export function distance3d(a={},b={}){
  return Math.hypot(n(a.x)-n(b.x),n(a.y)-n(b.y),n(a.z)-n(b.z));
}

const routeSide=delta=>delta>0?'LONG':delta<0?'SHORT':'HOLD';

export function calculateKRouteKinematics({origin={},destination={},c=0,lots=0}={}){
  const values=[origin.x,origin.y,origin.z,destination.x,destination.y,destination.z,c,lots].map(Number);
  if(values.some(value=>!Number.isFinite(value)))return {ok:false,reason:'INVALID_ROUTE_NUMBER'};
  const [x0,y0,z0,x1,y1,z1,signedC,cargoLots]=values;
  if(cargoLots<0||!Number.isInteger(cargoLots))return {ok:false,reason:'INVALID_CARGO_LOTS'};
  const dx=x1-x0,dy=y1-y0,dz=z1-z0;
  const distanceK=Math.hypot(dx,dy,dz);
  const speedKPerSecond=Math.abs(signedC)*C_SPEED_K_PER_SECOND;
  const arrived=distanceK===0;
  const etaSeconds=arrived?0:speedKPerSecond>0?distanceK/speedKPerSecond:null;
  const scale=distanceK>0&&speedKPerSecond>0?speedKPerSecond/distanceK:0;
  return {
    ok:true,
    coordinateSpace:'PHYSICAL_K_XYZ',
    origin:{x:x0,y:y0,z:z0},destination:{x:x1,y:y1,z:z1},delta:{x:dx,y:dy,z:dz},
    distanceK,distanceKm:distanceK*K_INDEX_KM,
    c:signedC,cSide:signedC>0?'LONG':signedC<0?'SHORT':'NO_ORDER',
    speedKPerSecond,etaSeconds,
    velocityKPerSecond:{x:dx*scale,y:dy*scale,z:dz*scale},
    movementBattleAxes:{X:routeSide(dx),Y:routeSide(dy),Z:routeSide(dz)},
    hedgeOrderAxes:{KX:'NOT_PLACED',KY:'NOT_PLACED',KZ:'NOT_PLACED'},
    cargo:{lots:cargoLots,kgen:cargoLots,indexUnits:cargoLots,kaios:cargoLots*KAIOS_PER_CARGO_LOT,kmScalePerLot:K_INDEX_KM},
    status:arrived?'ARRIVED':speedKPerSecond>0?'ROUTE_CALCULATED':'LOCAL_WALK_RATE_REQUIRED',
    marketOrderCreated:false,requiresOrderAuthorization:true,simulation:true,
  };
}

export function sixDirectionVector(a={},b={}){
  const dx=n(b.x)-n(a.x),dy=n(b.y)-n(a.y),dz=n(b.z)-n(a.z);
  const axes=[['+X',dx],['-X',-dx],['+Y',dy],['-Y',-dy],['+Z',dz],['-Z',-dz]].sort((p,q)=>q[1]-p[1]);
  return {dx,dy,dz,primary:axes[0][1]>0?axes[0][0]:'HOLD',axes:Object.fromEntries(axes)};
}

export function buildAtmUfoFlightPlan(origin={},destination={},mission={}){
  const start={x:n(origin.x),y:n(origin.y),z:n(origin.z)};
  const arrival={x:n(destination.x),y:n(destination.y)+Math.max(0,n(mission.arrivalOffsetY,1.1)),z:n(destination.z)};
  const cruiseY=Math.max(start.y,arrival.y,Math.max(1,n(mission.flightAltitude,6)));
  const raw=[
    {phase:'ASCEND',x:start.x,y:cruiseY,z:start.z},
    {phase:'CRUISE_5D',x:arrival.x,y:cruiseY,z:arrival.z},
    {phase:'DESCEND',...arrival},
  ];
  const waypoints=[];let previous=start;
  for(const waypoint of raw){if(distance3d(previous,waypoint)>.000001){waypoints.push(waypoint);previous=waypoint}}
  const distanceWorld=waypoints.reduce((total,waypoint,index)=>total+distance3d(index?waypoints[index-1]:start,waypoint),0);
  return {transportMode:ATM_UFO_TRANSPORT_MODE,start,arrival,cruiseY,waypoints,distanceWorld,fullXYZ:true,flatRoute:false};
}

export function cSpeedMetersPerSecond(c=0){return Math.abs(n(c))*C_SPEED_K_PER_SECOND*K_INDEX_KM*1000}

export function quoteDeliveryEconomics(ant,mission,atm){
  const e=mission.economics||{};
  const flightPlan=mission.transportMode===ATM_UFO_TRANSPORT_MODE?buildAtmUfoFlightPlan(ant,atm,mission):null;
  const worldDistance=flightPlan?.distanceWorld??distance3d(ant,atm);
  const distanceMeters=e.distanceMeters===null||e.distanceMeters===undefined?worldDistance*Math.max(0.000001,n(e.metersPerWorldUnit,1)):Math.max(0,n(e.distanceMeters));
  const speed=e.speedMetersPerSecond===null||e.speedMetersPerSecond===undefined?cSpeedMetersPerSecond(mission.movementC):Math.max(0,n(e.speedMetersPerSecond));
  const travelSeconds=speed>0?distanceMeters/speed:null;
  const freight=Math.max(0,n(mission.freightOffer))||Math.max(0,n(e.baseFreight)+distanceMeters*n(e.distanceRate)+mission.amount*n(e.loadRate)+distanceMeters*n(e.riskRate));
  const fuel=distanceMeters*n(e.fuelPerMeter);
  const salary=n(e.workerSalaryOffer)>0?n(e.workerSalaryOffer):(travelSeconds??0)*n(e.salaryPerSecond);
  const maintenance=distanceMeters*n(e.maintenancePerMeter);
  const time=(travelSeconds??0)*n(e.timeCostPerSecond);
  const risk=n(e.riskProbability)*n(e.riskLoss);
  const mode=DELIVERY_MODES.includes(mission.mode)?mission.mode:'OBSERVE';
  const signedEdge=mode==='LONG'?n(mission.marketEdge):mode==='SHORT'?-n(mission.marketEdge):0;
  const tip=mode==='OBSERVE'?0:Math.max(0,signedEdge)*Math.max(0,n(e.tipRate))*Math.max(0,mission.amount);
  const revenue=freight+tip;
  const cost=fuel+salary+maintenance+time+risk;
  const net=revenue-cost;
  return {distanceWorld:worldDistance,distanceMeters,travelSeconds,speedMetersPerSecond:speed,freight,tip,revenue,fuel,salary,maintenance,time,risk,cost,net,mode,marketEdge:n(mission.marketEdge),direction:sixDirectionVector(ant,atm),flightPlan,simulation:true};
}

export function quoteCargoInsurance({
  cargoAmount=0,coverageBps=8000,deductibleBps=1000,theftRateBps=120,disasterRateBps=30,
  damageRateBps=50,interruptionRateBps=40,claimsOpsRateBps=20,capitalChargeRateBps=25,
  marginRateBps=20,reserveKaios=0
}={}){
  const cargo=whole(cargoAmount,'CARGO_AMOUNT'),coverage=bps(coverageBps,'COVERAGE_BPS'),deductible=bps(deductibleBps,'DEDUCTIBLE_BPS');
  const covered=mulBpsCeil(cargo,coverage),deductibleAmount=mulBpsCeil(covered,deductible);
  const rates={theft:theftRateBps,disaster:disasterRateBps,damage:damageRateBps,interruption:interruptionRateBps,claimsOps:claimsOpsRateBps,capitalCharge:capitalChargeRateBps,margin:marginRateBps};
  for(const [key,value] of Object.entries(rates))rates[key]=bps(value,key.toUpperCase()+'_BPS');
  const components=Object.fromEntries(Object.entries(rates).map(([key,rate])=>[key,mulBpsCeil(covered,rate)]));
  const premiumKaios=Object.values(components).reduce((sum,value)=>sum+value,0),maxClaimKaios=Math.max(0,covered-deductibleAmount),reserve=whole(reserveKaios,'RESERVE_KAIOS');
  return {
    desk:'AI_ANT_COMPANY_CARGO_RISK_DESK',currency:'KAIOS',cargoAmount:cargo,coverageBps:coverage,deductibleBps:deductible,
    coveredAmountKaios:covered,deductibleKaios:deductibleAmount,maxClaimKaios,premiumKaios,components,reserveKaios:reserve,
    mode:reserve>=maxClaimKaios?'UNDERWRITING_READY':'BROKERAGE_QUOTE_ONLY',cargoPrincipalAsReserve:false,
    coveredCauses:[...CARGO_RISK_CAUSES],settlement:'LOCAL_SIMULATION_ONLY',mainnetWrite:false,
  };
}

export function activateCargoInsurance(ant,quote,{policyId=`CARGO-POLICY-${Date.now()}`,premiumPaidKaios=0,reserveSource=''}={}){
  if(!ant?.mission)return {ok:false,reason:'MISSION_REQUIRED'};
  if(!quote||quote.mode!=='UNDERWRITING_READY')return {ok:false,reason:'INDEPENDENT_RESERVE_REQUIRED'};
  if(String(reserveSource)!=='LOCAL_GAME_INSURANCE_RESERVE')return {ok:false,reason:'CARGO_PRINCIPAL_CANNOT_BE_RESERVE'};
  if(whole(premiumPaidKaios,'PREMIUM_PAID')!==quote.premiumKaios)return {ok:false,reason:'EXACT_PREMIUM_REQUIRED'};
  ant.cargoRisk.reserveKaios=quote.reserveKaios;
  ant.cargoRisk.policy={...structuredClone(quote),policyId:String(policyId),mode:'LOCAL_SIMULATION_COVERED',premiumPaidKaios:quote.premiumKaios,activatedAt:Date.now(),claimsPaidKaios:0,status:'ACTIVE'};
  return {ok:true,policy:structuredClone(ant.cargoRisk.policy)};
}

function axisBattle(playerMovement={},antMovement={}){
  const axes={};let opposed=0,aligned=0;
  for(const axis of ['x','y','z']){
    const player=Math.sign(n(playerMovement[axis])),ant=Math.sign(n(antMovement[axis]));
    const relation=!player||!ant?'NEUTRAL':player===ant?'ALIGNED':'OPPOSED';
    if(relation==='OPPOSED')opposed++;if(relation==='ALIGNED')aligned++;
    axes[axis.toUpperCase()]={player,ant,relation};
  }
  return {axes,opposed,aligned};
}

function vectorMagnitude(value={}){return Math.hypot(n(value.x),n(value.y),n(value.z))}
function normalizedOpposite(value={}){
  const length=vectorMagnitude(value);
  return length>0?{x:-n(value.x)/length,y:-n(value.y)/length,z:-n(value.z)/length}:{x:-1,y:0,z:0};
}

/**
 * Local game physics preview. KAIOS supplies inertial mass at the CURRENT
 * 1 KAIOS = 1 kg scale. Impact kinetic energy and atmospheric drag are kept
 * separate: drag is a flight loss, never a substitute for impact damage.
 */
export function calculateMissileImpact({
  kaiosMass=0,attackC=0,targetC=0,attackDirection={},targetDirection={},
  atmosphereDensityKgM3=0,dragCoefficient=.3,frontalAreaM2=.02,flightDistanceMeters=0,
  couplingBps=3500,joulesPerOperationalEnergy=JOULES_PER_OPERATIONAL_ENERGY
}={}){
  const massKaios=whole(kaiosMass,'KAIOS_MASS');
  if(massKaios<1||massKaios>100)return {ok:false,reason:'KAIOS_MISSILE_MASS_OUT_OF_RANGE'};
  const signedAttackC=n(attackC),signedTargetC=n(targetC);
  if(!signedAttackC||Math.abs(signedAttackC)>100)return {ok:false,reason:'INVALID_ATTACK_C'};
  if(signedTargetC&&Math.sign(signedAttackC)===Math.sign(signedTargetC))return {ok:false,reason:'OPPOSITE_C_REQUIRED'};
  const attackSpeed=cSpeedMetersPerSecond(signedAttackC),targetSpeed=cSpeedMetersPerSecond(signedTargetC);
  const fallbackTarget={x:1,y:0,z:0};
  const targetUnit=vectorMagnitude(targetDirection)>0?Object.fromEntries(['x','y','z'].map(axis=>[axis,n(targetDirection[axis])/vectorMagnitude(targetDirection)])):fallbackTarget;
  const attackUnit=vectorMagnitude(attackDirection)>0?Object.fromEntries(['x','y','z'].map(axis=>[axis,n(attackDirection[axis])/vectorMagnitude(attackDirection)])):normalizedOpposite(targetUnit);
  const relativeVelocity={x:attackUnit.x*attackSpeed-targetUnit.x*targetSpeed,y:attackUnit.y*attackSpeed-targetUnit.y*targetSpeed,z:attackUnit.z*attackSpeed-targetUnit.z*targetSpeed};
  const relativeSpeed=vectorMagnitude(relativeVelocity),beta=Math.min(.999999999999,relativeSpeed/LIGHT_SPEED_METERS_PER_SECOND);
  const massKg=massKaios*KAIOS_MASS_KG;
  const kineticEnergyJ=beta<.01?.5*massKg*relativeSpeed**2:(1/Math.sqrt(1-beta**2)-1)*massKg*LIGHT_SPEED_METERS_PER_SECOND**2;
  const density=Math.max(0,n(atmosphereDensityKgM3)),cd=Math.max(0,n(dragCoefficient)),area=Math.max(0,n(frontalAreaM2)),distance=Math.max(0,n(flightDistanceMeters));
  const dragForceN=.5*density*cd*area*attackSpeed**2,dragWorkJ=Math.min(kineticEnergyJ,dragForceN*distance);
  const impactEnergyJ=Math.max(0,kineticEnergyJ-dragWorkJ),coupling=bps(couplingBps,'COUPLING_BPS');
  const coupledEnergyJ=impactEnergyJ*coupling/10000,normalizer=Math.max(1,n(joulesPerOperationalEnergy,JOULES_PER_OPERATIONAL_ENERGY));
  const operationalDamage=Math.max(1,Math.floor(coupledEnergyJ/normalizer));
  return {ok:true,simulation:true,weapon:'KAIOS_MASS_MISSILE_GAME_SIMULATION',massKaios,massKg,attackC:signedAttackC,targetC:signedTargetC,attackSpeedMetersPerSecond:attackSpeed,targetSpeedMetersPerSecond:targetSpeed,relativeVelocity,relativeSpeedMetersPerSecond:relativeSpeed,beta,energyFormula:beta<.01?'CLASSICAL_0_5_M_V2':'RELATIVISTIC_GAMMA_MINUS_1_M_C2',kineticEnergyJ,dragModel:'SEPARATE_EN_ROUTE_LOSS',dragForceN,dragWorkJ,impactEnergyJ,couplingBps:coupling,coupledEnergyJ,joulesPerOperationalEnergy:normalizer,operationalDamage,realWeapon:false,mainnetWrite:false};
}

export function previewMissileInterception(ant,{
  attackerLifeId,attackerController='PLAYER_LOCAL',playerPosition={},kaiosMass=1,availableKaios=0,attackC=-1,
  replayKey,now=Date.now(),maxDistance=MISSILE_MAX_RANGE_METERS,atmosphereDensityKgM3=0
}={}){
  const mission=ant?.mission,risk=ant?.cargoRisk;
  if(!mission||mission.status!=='IN_TRANSIT')return {ok:false,reason:'IN_TRANSIT_MISSION_REQUIRED'};
  if(!attackerLifeId||String(attackerLifeId)===String(ant.lifeId))return {ok:false,reason:'DISTINCT_ATTACKER_LIFE_REQUIRED'};
  if(String(attackerController)==='DIGITAL_ANT_0001')return {ok:false,reason:'SAME_CONTROLLER_RAID_BLOCKED'};
  if(!replayKey)return {ok:false,reason:'REPLAY_KEY_REQUIRED'};
  if(risk.replayKeys.includes(String(replayKey)))return {ok:false,reason:'RAID_REPLAY_BLOCKED'};
  if(now-risk.lastRaidAt<1500)return {ok:false,reason:'RAID_COOLDOWN'};
  const mass=whole(kaiosMass,'KAIOS_MASS');
  if(whole(availableKaios,'AVAILABLE_KAIOS')<mass)return {ok:false,reason:'INSUFFICIENT_LOCAL_KAIOS_AMMUNITION'};
  const distance=distance3d(playerPosition,ant),range=Math.max(1,n(maxDistance,MISSILE_MAX_RANGE_METERS));
  if(distance>range)return {ok:false,reason:'OUT_OF_MISSILE_RANGE',distance,maxDistance:range};
  const targetDirection=mission.lastMovement,attackDirection=normalizedOpposite(targetDirection);
  const physics=calculateMissileImpact({kaiosMass:mass,attackC,targetC:mission.movementC,attackDirection,targetDirection,flightDistanceMeters:distance,atmosphereDensityKgM3});
  if(!physics.ok)return physics;
  return {ok:true,replayKey:String(replayKey),now,distance,attackerLifeId:String(attackerLifeId),attackerController:String(attackerController),physics,expectedEnergyBefore:whole(Math.max(0,Math.round(ant.vehicle.operationalEnergy)),'UFO_ENERGY'),simulation:true};
}

export function resolveMissileInterception(ant,preview={}){
  const mission=ant?.mission,risk=ant?.cargoRisk;
  if(!preview?.ok||!preview.physics)return {ok:false,reason:'VALID_MISSILE_PREVIEW_REQUIRED'};
  if(!mission||mission.status!=='IN_TRANSIT')return {ok:false,reason:'IN_TRANSIT_MISSION_REQUIRED'};
  if(risk.replayKeys.includes(String(preview.replayKey)))return {ok:false,reason:'RAID_REPLAY_BLOCKED'};
  const energyBefore=Math.max(0,n(ant.vehicle.operationalEnergy,ATM_UFO_MAX_OPERATIONAL_ENERGY));
  if(Math.round(energyBefore)!==preview.expectedEnergyBefore)return {ok:false,reason:'MISSILE_PREVIEW_STALE'};
  const damage=Math.min(Math.ceil(energyBefore),Math.max(1,whole(preview.physics.operationalDamage,'OPERATIONAL_DAMAGE'))),energyAfter=Math.max(0,energyBefore-damage),destroyed=energyAfter<=0;
  const pool=whole(mission.gameplayRiskPoolRemaining,'GAMEPLAY_RISK_POOL_REMAINING');
  const rewardKaios=destroyed?Math.min(pool,mission.maxRaidLoss):0;
  const loot=destroyed?[
    {itemId:`${preview.replayKey}:KUFO`,name:'KUFO 仙丹碎晶',kind:'FOOD',qty:1,weightEach:.001,stackable:true,treasureClass:'KUFO_GAME_FUEL_FRAGMENT'},
    {itemId:`${preview.replayKey}:KSHIP`,name:'KSHIP 飯物質能燃料',kind:'MATERIAL',qty:1,weightEach:.001,stackable:true,treasureClass:'KSHIP_GAME_FEED_MASS'},
    {itemId:`${preview.replayKey}:TECH`,name:'ATM UFO 製造科技碎片',kind:'TREASURE',qty:1,weightEach:.25,stackable:true,treasureClass:'UFO_TECH_FRAGMENT'},
  ]:[];
  const incidentLossKaios=destroyed?Math.min(whole(mission.amount,'CARGO_AMOUNT'),mission.maxRaidLoss):0;
  const incident={incidentId:`RAID-${raidHash(preview.replayKey).toString(16).padStart(8,'0')}`,missionId:mission.missionId,replayKey:String(preview.replayKey),cause:'MISSILE_INTERCEPTION',occurredAt:preview.now,attackerLifeId:preview.attackerLifeId,distance:preview.distance,physics:structuredClone(preview.physics),energyBefore,damage,energyAfter,destroyed,outcome:destroyed?'UFO_CRASHING_LOCAL_LOOT_PENDING':'MISSILE_HIT_UFO_STILL_FLYING',rewardKaios,loot,incidentLossKaios,custodyPrincipalChanged:false,chainBalanceChanged:false,evidenceStatus:'LOCAL_GAME_EVIDENCE',claimStatus:destroyed&&risk.policy?.status==='ACTIVE'?'CLAIM_ELIGIBLE':'NOT_COVERED_OR_NO_LOSS'};
  ant.vehicle.operationalEnergy=energyAfter;ant.vitality=clamp(energyAfter,0,100);risk.replayKeys.push(String(preview.replayKey));risk.lastRaidAt=preview.now;risk.incidents.push(incident);
  if(destroyed){mission.status='CRASHING';mission.flightPhase='CRASHING';mission.lastMovement={x:0,y:0,z:0};ant.vehicle.propulsion='OFFLINE';ant.state='CRASHING'}
  return {ok:true,success:true,destroyed,rewardKaios:0,ammoConsumedKaios:preview.physics.massKaios,incident:structuredClone(incident),cargoPrincipalChanged:false,mainnetWrite:false};
}

export function attemptCargoRobbery(ant,{
  attackerLifeId,attackerController='PLAYER_LOCAL',playerPosition={},playerMovement={},attackPower=1,energySpent=1,
  replayKey,now=Date.now(),maxDistance=CARGO_RAID_RANGE_METERS
}={}){
  const mission=ant?.mission,risk=ant?.cargoRisk;
  if(!mission||mission.status!=='IN_TRANSIT')return {ok:false,reason:'IN_TRANSIT_MISSION_REQUIRED'};
  if(!attackerLifeId||String(attackerLifeId)===String(ant.lifeId))return {ok:false,reason:'DISTINCT_ATTACKER_LIFE_REQUIRED'};
  if(String(attackerController)==='DIGITAL_ANT_0001')return {ok:false,reason:'SAME_CONTROLLER_RAID_BLOCKED'};
  if(!replayKey)return {ok:false,reason:'REPLAY_KEY_REQUIRED'};
  if(risk.replayKeys.includes(String(replayKey)))return {ok:false,reason:'RAID_REPLAY_BLOCKED'};
  if(now-risk.lastRaidAt<1500)return {ok:false,reason:'RAID_COOLDOWN'};
  const distance=distance3d(playerPosition,ant);
  if(distance>Math.max(.1,n(maxDistance,CARGO_RAID_RANGE_METERS)))return {ok:false,reason:'OUT_OF_RAID_RANGE',distance,maxDistance};
  const energy=whole(energySpent,'RAID_ENERGY');if(energy<1)return {ok:false,reason:'RAID_ENERGY_REQUIRED'};
  const power=whole(attackPower,'ATTACK_POWER');if(power<1||power>100)return {ok:false,reason:'INVALID_ATTACK_POWER'};
  const battle=axisBattle(playerMovement,mission.lastMovement);
  if(battle.opposed<1)return {ok:false,reason:'OPPOSING_XYZ_MOVEMENT_REQUIRED',battle};
  const attackScore=power+energy*3+battle.opposed*12;
  const defenseScore=35+Math.round(clamp(ant.vitality,0,100)*.25)+(risk.policy?.status==='ACTIVE'?8:0);
  const variance=(raidHash(replayKey)%21)-10,success=attackScore+variance>defenseScore;
  const pool=whole(mission.gameplayRiskPoolRemaining,'GAMEPLAY_RISK_POOL_REMAINING');
  const rewardKaios=success?Math.min(pool,Math.max(1,Math.min(mission.maxRaidLoss,Math.floor((attackScore+variance-defenseScore)/2)+1))):0;
  const incidentLossKaios=success?Math.min(whole(mission.amount,'CARGO_AMOUNT'),mission.maxRaidLoss):0;
  const incident={
    incidentId:`RAID-${raidHash(replayKey).toString(16).padStart(8,'0')}`,missionId:mission.missionId,replayKey:String(replayKey),
    cause:'THEFT_ROBBERY',occurredAt:now,attackerLifeId:String(attackerLifeId),distance,battle,attackScore,defenseScore,variance,
    outcome:success?'ROBBERY_SUCCESS_LOCAL_REWARD':'ROBBERY_REPELLED',rewardKaios,incidentLossKaios,
    custodyPrincipalChanged:false,chainBalanceChanged:false,evidenceStatus:'LOCAL_GAME_EVIDENCE',claimStatus:incidentLossKaios>0&&risk.policy?.status==='ACTIVE'?'CLAIM_ELIGIBLE':'NOT_COVERED_OR_NO_LOSS',
  };
  risk.replayKeys.push(String(replayKey));risk.lastRaidAt=now;risk.incidents.push(incident);
  mission.gameplayRiskPoolRemaining=Math.max(0,pool-rewardKaios);
  ant.vitality=clamp(ant.vitality-(success?12:4),0,100);
  return {ok:true,success,rewardKaios,incident:structuredClone(incident),cargoPrincipalChanged:false,mainnetWrite:false};
}

export function settleCargoInsuranceClaim(ant,{incidentId}={}){
  const risk=ant?.cargoRisk,policy=risk?.policy,incident=risk?.incidents?.find(item=>item.incidentId===incidentId);
  if(!incident)return {ok:false,reason:'INCIDENT_NOT_FOUND'};
  if(incident.evidenceStatus!=='LOCAL_GAME_EVIDENCE'||incident.missionId!==ant?.mission?.missionId)return {ok:false,reason:'VERIFIED_INCIDENT_EVIDENCE_REQUIRED'};
  if(policy?.status!=='ACTIVE')return {ok:false,reason:'ACTIVE_POLICY_REQUIRED'};
  if(incident.claimStatus==='PAID')return {ok:false,reason:'CLAIM_REPLAY_BLOCKED'};
  if(!policy.coveredCauses.includes(incident.cause))return {ok:false,reason:'CAUSE_NOT_COVERED'};
  const afterDeductible=Math.max(0,incident.incidentLossKaios-policy.deductibleKaios),remainingLimit=Math.max(0,policy.maxClaimKaios-policy.claimsPaidKaios);
  const payoutKaios=Math.min(afterDeductible,remainingLimit,risk.reserveKaios);
  if(payoutKaios<=0)return {ok:false,reason:'NO_PAYABLE_CLAIM'};
  risk.reserveKaios-=payoutKaios;policy.claimsPaidKaios+=payoutKaios;incident.claimStatus='PAID';incident.claimPayoutKaios=payoutKaios;
  return {ok:true,incidentId,payoutKaios,reserveRemainingKaios:risk.reserveKaios,settlement:'LOCAL_SIMULATION_ONLY',mainnetWrite:false};
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
  if(!(quote.speedMetersPerSecond>0))return {action:'WAIT',reason:'NO_5D_MOVEMENT_SPEED',quote};
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
  const destination={...atm,y:n(atm.y)};
  const flightPlan=buildAtmUfoFlightPlan(ant,destination,mission);
  ant.mission={...mission,status:'ASSIGNED',destination,route:routeFromAnchor(mission.price),level:universeLevel(mission.price),quote:cfo.quote,flightPlan,flightWaypointIndex:0,flightPhase:'READY_TO_ASCEND'};
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

export function tickDigitalAntDelivery(ant,{deltaMs=16,speed=null}={}){
  const m=ant.mission;
  if(!m||!['IN_TRANSIT','CRASHING'].includes(m.status))return {ok:false,reason:'NOT_IN_TRANSIT',state:ant.state};
  if(m.status==='CRASHING'){
    const descent=Math.max(.01,n(deltaMs)*.008);ant.y=Math.max(0,ant.y-descent);m.lastMovement={x:0,y:-descent,z:0};
    if(ant.y>0)return {ok:true,arrived:false,delivered:false,crashing:true,state:'CRASHING',remainingAltitude:ant.y};
    m.status='CRASHED';m.flightPhase='CRASHED';m.crashedAt=Date.now();ant.state='CRASHED';
    const incident=ant.cargoRisk.incidents.at(-1);if(incident?.destroyed){incident.outcome='UFO_CRASHED_LOCAL_LOOT';incident.lootAvailable=true;m.gameplayRiskPoolRemaining=Math.max(0,whole(m.gameplayRiskPoolRemaining)-incident.rewardKaios)}
    return {ok:true,arrived:false,delivered:false,crashed:true,state:'CRASHED',incident:incident?structuredClone(incident):null};
  }
  if(ant.vitality<=15){ant.state='RETREAT';return {ok:false,reason:'LOW_VITALITY',state:ant.state}};
  if(ant.capital<=0){ant.state='RETURN';return {ok:false,reason:'NO_CAPITAL',state:ant.state}};
  const waypoints=m.flightPlan?.waypoints||[m.destination];
  const index=Math.max(0,Math.min(waypoints.length-1,Number(m.flightWaypointIndex)||0));
  const target=waypoints[index],d=distance3d(ant,target);
  if(d<=.15){
    ant.x=target.x;ant.y=target.y;ant.z=target.z;
    if(index<waypoints.length-1){m.flightWaypointIndex=index+1;m.flightPhase=waypoints[index+1].phase;ant.state=m.flightPhase;return {ok:true,arrived:false,delivered:false,state:ant.state,flightPhase:m.flightPhase,waypointIndex:m.flightWaypointIndex,remaining:distance3d(ant,waypoints[index+1]),direction:sixDirectionVector(ant,waypoints[index+1]),route:m.route}}
    m.status='ARRIVED_AWAITING_RECEIPT';ant.state='ARRIVED_AWAITING_RECEIPT';
    m.flightPhase='LANDED_AWAITING_RECEIPT';
    return {ok:true,arrived:true,delivered:false,atmId:m.destination.atmId,missionId:m.missionId,cargo:{...ant.cargo},flightPhase:m.flightPhase};
  }
  m.flightPhase=target.phase||'CRUISE_5D';ant.state=m.flightPhase;
  const speedWorldPerMs=speed===null||speed===undefined?(cSpeedMetersPerSecond(m.movementC)/Math.max(.000001,n(m.economics?.metersPerWorldUnit,1)))/1000:Math.max(0,n(speed));
  const dx=target.x-ant.x,dy=target.y-ant.y,dz=target.z-ant.z,len=Math.hypot(dx,dy,dz)||1,step=Math.min(d,speedWorldPerMs*n(deltaMs));
  m.lastMovement={x:dx/len*step,y:dy/len*step,z:dz/len*step};
  ant.x+=dx/len*step;ant.y+=dy/len*step;ant.z+=dz/len*step;
  return {ok:true,arrived:false,delivered:false,state:ant.state,flightPhase:m.flightPhase,waypointIndex:index,remaining:distance3d(ant,target),direction:sixDirectionVector(ant,target),route:m.route};
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
  ant.payroll??={earned:0,paid:0,balance:0,currency:'KAIOS',scope:'LOCAL_SIMULATION_ONLY',lastReceiptId:null};
  ant.payroll.earned+=q.salary;ant.payroll.paid+=q.salary;ant.payroll.balance+=q.salary;ant.payroll.lastReceiptId=m.receiptId;
  m.accounting={scope:'LOCAL_SIMULATION_ONLY',currency:'KAIOS',cargoPrincipal:m.amount,cargoPrincipalRecognizedAsRevenue:false,freightRevenue:q.freight,tipRevenue:q.tip,workerSalary:q.salary,operatingCost:q.cost-q.salary,companyNet:q.net,chainTransfer:false};
  ant.capital=Math.max(0,ant.capital+q.net);
  if(q.net>0){const reserve=q.net*0.2;ant.retirementReserve+=reserve;ant.capital=Math.max(0,ant.capital-reserve);}
  return {ok:true,delivered:true,atmId:m.destination.atmId,cargo:delivered,missionId:m.missionId,receiptId:m.receiptId,quote:q,accounting:structuredClone(m.accounting),payroll:structuredClone(ant.payroll),retirementReserve:ant.retirementReserve};
}

export function previewPlayerHomeAcceptance(ant,{requesterLifeId,playerPosition={}}={}){
  const m=ant?.mission;
  if(!m||m.status!=='ARRIVED_AWAITING_RECEIPT')return {ok:false,reason:'NOT_AWAITING_RECEIPT'};
  if(!m.customerAcceptanceRequired||!String(m.serviceType||'').startsWith('PLAYER_HOME_'))return {ok:false,reason:'NOT_PLAYER_HOME_DELIVERY'};
  if(String(requesterLifeId||'')!==String(m.requesterLifeId||''))return {ok:false,reason:'RECEIVER_IDENTITY_MISMATCH'};
  const position={x:Number(playerPosition.x),y:Number(playerPosition.y),z:Number(playerPosition.z)};
  if(Object.values(position).some(value=>!Number.isFinite(value)))return {ok:false,reason:'RECEIVER_XYZ_REQUIRED'};
  const distance=distance3d(position,m.destination),limit=Math.max(0.1,n(m.acceptanceRangeMeters,HOME_DELIVERY_ACCEPTANCE_RANGE_METERS));
  if(distance>limit)return {ok:false,reason:'RECEIVER_NOT_AT_HOME',distance,acceptanceRangeMeters:limit};
  return {ok:true,missionId:m.missionId,requesterLifeId:m.requesterLifeId,distance,acceptanceRangeMeters:limit,freightFeeKaios:whole(m.quote?.freight??m.freightOffer,'FREIGHT_FEE'),paymentScope:m.paymentScope};
}

export function acceptPlayerHomeDelivery(ant,{requesterLifeId,playerPosition={},paymentEvidence=null,now=Date.now()}={}){
  const preview=previewPlayerHomeAcceptance(ant,{requesterLifeId,playerPosition});
  if(!preview.ok)return preview;
  let paidAmount=null;
  try{paidAmount=whole(paymentEvidence?.amount,'FREIGHT_PAYMENT')}catch{return {ok:false,reason:'VERIFIED_LOCAL_FREIGHT_PAYMENT_REQUIRED',freightFeeKaios:preview.freightFeeKaios}}
  if(preview.freightFeeKaios>0&&(!paymentEvidence?.ok||paidAmount!==preview.freightFeeKaios||paymentEvidence.scope!=='LOCAL_SIMULATION_NO_CHAIN_TRANSFER'))return {ok:false,reason:'VERIFIED_LOCAL_FREIGHT_PAYMENT_REQUIRED',freightFeeKaios:preview.freightFeeKaios};
  const receiptId=`HOME-RECEIPT-${raidHash(`${ant.mission.missionId}:${requesterLifeId}:${now}`).toString(16).padStart(8,'0')}`;
  ant.mission.customerAcceptance={requesterLifeId:String(requesterLifeId),acceptedAt:now,position:{x:Number(playerPosition.x),y:Number(playerPosition.y),z:Number(playerPosition.z)},distance:preview.distance,payment:{amount:preview.freightFeeKaios,scope:preview.paymentScope},receiptAuthority:'RUNTIME_GENERATED_FROM_PLAYER_ACCEPTANCE'};
  return verifyDeliveryReceipt(ant,{receiptId,verified:true,now});
}

function courierClone(value){return value==null?value:JSON.parse(JSON.stringify(value))}
function courierId(value,label){const id=String(value||'').trim();if(!id||id.length>160||/[<>\x00-\x1f]/.test(id))throw new Error(`INVALID_${label}`);return id}
function courierClock(value,label){const parsed=Number(value);if(!Number.isSafeInteger(parsed)||parsed<0||parsed>Number.MAX_SAFE_INTEGER)throw new Error(`INVALID_${label}`);return parsed}
function courierTerminal(status){return PLAYER_COURIER_TERMINAL_STATES.includes(String(status))}

export function estimatePlayerCourierDuration({
  distanceMeters=0,cargoAmount=0,risk=0,missionType='STANDARD',speedMetersPerSecond=13.8888888889,
  baseDurationMs=300_000,minDurationMs=PLAYER_COURIER_MIN_DURATION_MS,maxDurationMs=PLAYER_COURIER_MAX_DURATION_MS
}={}){
  const distance=Math.max(0,n(distanceMeters)),amount=whole(cargoAmount,'CARGO_AMOUNT'),routeSpeed=Math.max(.1,n(speedMetersPerSecond,13.8888888889));
  const base=Math.max(0,n(baseDurationMs,300_000)),travel=distance/routeSpeed*1000,handling=Math.min(1_200_000,Math.ceil(amount/1000)*10_000);
  const danger=Math.round((base+travel+handling)*clamp(risk,0,1)*.2),type=String(missionType||'STANDARD').toUpperCase()==='CASH'?60_000:0;
  return Math.round(clamp(base+travel+handling+danger+type,Math.max(1,n(minDurationMs,PLAYER_COURIER_MIN_DURATION_MS)),Math.max(n(minDurationMs,PLAYER_COURIER_MIN_DURATION_MS),n(maxDurationMs,PLAYER_COURIER_MAX_DURATION_MS))));
}

export function createPlayerCourierOffer({
  missionId=`COURIER-${Date.now()}`,requesterLifeId,cargoId,cargoKind='CASH',cargoAmount=0,cargoUnit='KAIOS',
  origin={},destination={},distanceMeters=null,risk=0,freightFeeKaios=0,courierSalaryKaios=0,
  estimatedDurationMs=null,insuranceQuote=null,createdAt=Date.now()
}={}){
  const id=courierId(missionId,'MISSION_ID'),requester=courierId(requesterLifeId,'REQUESTER_LIFE_ID');
  const kind=String(cargoKind||'').toUpperCase(),unit=String(cargoUnit||'').toUpperCase();
  if(!['CASH','GOODS','KUFO','KSHIP'].includes(kind))throw new Error('INVALID_CARGO_KIND');
  if(!['KAIOS','KGEN','KUFO','KSHIP','GOODS'].includes(unit))throw new Error('INVALID_CARGO_UNIT');
  const amount=whole(cargoAmount,'CARGO_AMOUNT');if(amount<1)throw new Error('CARGO_AMOUNT_REQUIRED');
  const fee=whole(freightFeeKaios,'FREIGHT_FEE'),salary=whole(courierSalaryKaios,'COURIER_SALARY');if(salary>fee)throw new Error('SALARY_EXCEEDS_FREIGHT_FEE');
  const distance=distanceMeters==null?distance3d(origin,destination):Math.max(0,n(distanceMeters));
  const duration=estimatedDurationMs==null?estimatePlayerCourierDuration({distanceMeters:distance,cargoAmount:amount,risk,missionType:kind}):courierClock(estimatedDurationMs,'ESTIMATED_DURATION');
  if(duration<PLAYER_COURIER_MIN_DURATION_MS||duration>PLAYER_COURIER_MAX_DURATION_MS)throw new Error('INVALID_ESTIMATED_DURATION');
  const freightShare=Math.max(0,Math.floor((fee-salary)*.25)),operatingCost=Math.max(0,Number(((fee-salary-freightShare)*.25).toFixed(3)));
  const insurance=insuranceQuote?{
    status:'QUOTE_ONLY',
    policyId:`COURIER-POLICY-${raidHash(`${id}:${cargoId||id}`).toString(16).padStart(8,'0')}`,
    coverageBps:bps(insuranceQuote.coverageBps??8000,'COVERAGE_BPS'),deductibleKaios:whole(insuranceQuote.deductibleKaios??0,'DEDUCTIBLE'),
    maxClaimKaios:whole(insuranceQuote.maxClaimKaios??0,'MAX_CLAIM'),premiumKaios:whole(insuranceQuote.premiumKaios??0,'PREMIUM'),premiumPaidKaios:0,claimStatus:'NOT_CLAIMED'
  }:{status:'UNINSURED',policyId:null,coverageBps:0,deductibleKaios:0,maxClaimKaios:0,premiumKaios:0,claimStatus:'NOT_APPLICABLE'};
  return {
    schema:PLAYER_COURIER_SCHEMA,missionId:id,requesterLifeId:requester,mode:'PLAYER_COURIER',status:'OFFERED',createdAt:courierClock(createdAt,'CREATED_AT'),
    estimatedDurationMs:duration,origin:{x:n(origin.x),y:n(origin.y),z:n(origin.z)},destination:{x:n(destination.x),y:n(destination.y),z:n(destination.z)},distanceMeters:distance,risk:clamp(risk,0,1),
    cargo:{cargoId:courierId(cargoId||`CARGO-${raidHash(id).toString(16).padStart(8,'0')}`,'CARGO_ID'),kind,amount,unit,durability:100,ownerState:'LOGISTICS_INVENTORY',ownerLifeId:null,dropId:null,lootClaimedAt:null},
    economics:{currency:'KAIOS',cargoPrincipal:amount,cargoPrincipalRecognizedAsRevenue:false,freightRevenue:fee,courierSalary:salary,courierFreightShare:freightShare,courierPayout:salary+freightShare,operatingCost,companyNet:Number((fee-salary-freightShare-operatingCost).toFixed(3)),chainTransfer:false},
    insurance,startedAt:null,dueAt:null,lastWallAt:null,lastMonotonicAt:null,clockSessionId:null,clockState:'NOT_STARTED',settlement:null,
    bandit:{modeRequired:'BANDIT_MODE',actionRequired:'CARGO_RAID_ACTION',attackWindowStartsAt:null,lastRaidAt:0,cooldownMs:PLAYER_COURIER_RAID_COOLDOWN_MS,attempts:[],lootReceiptId:null},
    backgroundMission:true,blocksMovement:false,blocksCombat:false,blocksExploration:false,blocksHome:false,
    scope:'LOCAL_GAME_CARGO_ONLY',realKaiosTransfer:false,realKgenTransfer:false,mainnetWrite:false
  };
}

function validateCourierMission(mission){
  if(!mission||mission.schema!==PLAYER_COURIER_SCHEMA)throw new Error('INVALID_COURIER_MISSION');
  courierId(mission.missionId,'MISSION_ID');courierId(mission.requesterLifeId,'REQUESTER_LIFE_ID');courierId(mission.cargo?.cargoId,'CARGO_ID');
  if(!['OFFERED','ACTIVE','CLOCK_REVIEW','DELIVERY_PENDING_CREDIT',...PLAYER_COURIER_TERMINAL_STATES].includes(mission.status))throw new Error('INVALID_COURIER_STATUS');
  if(!Number.isSafeInteger(mission.cargo?.amount)||mission.cargo.amount<1||!Number.isFinite(mission.cargo?.durability)||mission.cargo.durability<0||mission.cargo.durability>100)throw new Error('INVALID_COURIER_CARGO');
  if((courierTerminal(mission.status)||mission.status==='DELIVERY_PENDING_CREDIT')!==Boolean(mission.settlement))throw new Error('INVALID_COURIER_SETTLEMENT');
  const deliveryCredit=mission.settlement?.credit,insuranceCredit=mission.insurance?.credit;
  for(const [credit,insurance] of [[deliveryCredit,false],[insuranceCredit,true]])if(credit){
    const expectedAmount=insurance?mission.insurance.payoutKaios:mission.settlement.rewardKaios,expectedId=insurance?mission.insurance.payoutReceiptId:mission.settlement.receiptId;
    const expectedStatus=insurance?(mission.insurance.claimStatus==='PAID'?'CONFIRMED':mission.insurance.claimStatus==='APPROVED'?'PENDING':null):(mission.status==='DELIVERED'?'CONFIRMED':mission.status==='DELIVERY_PENDING_CREDIT'?'PENDING':null);
    if(!expectedStatus||credit.status!==expectedStatus||credit.playerId!==mission.courierLifeId||credit.missionId!==mission.missionId||credit.receiptId!==expectedId||credit.rewardKaios!==expectedAmount||!Number.isSafeInteger(expectedAmount)||expectedAmount<0||expectedAmount>(insurance?1080000:1000)||!(credit.owner==='guest'||/^0x[0-9a-f]{40}$/.test(credit.owner||''))||credit.purpose!==(insurance?'PLAYER_COURIER_INSURANCE_PAYOUT':'PLAYER_COURIER_REWARD')||mission.scope!=='LOCAL_GAME_CARGO_ONLY'||mission.realKaiosTransfer!==false||mission.realKgenTransfer!==false||mission.mainnetWrite!==false||mission.settlement?.chainTransfer!==false)throw new Error('INVALID_PENDING_COURIER_CREDIT');
    if(insurance){if(mission.status!=='ROBBED'||mission.settlement.outcome!=='ROBBED'||mission.insurance.status!=='ACTIVE'||expectedAmount!==mission.settlement.insurancePayoutKaios)throw new Error('INVALID_PENDING_COURIER_CREDIT')}
    else if(mission.settlement.outcome!==mission.status||expectedAmount!==mission.economics?.courierPayout||expectedAmount!==mission.settlement.salaryKaios+mission.settlement.freightShareKaios)throw new Error('INVALID_PENDING_COURIER_CREDIT');
  }
  if(mission.status==='DELIVERY_PENDING_CREDIT'&&(!deliveryCredit||mission.cargo.ownerState!=='OWNED_BY_COURIER'||mission.cargo.ownerLifeId!==mission.courierLifeId))throw new Error('INVALID_PENDING_COURIER_CREDIT');
  if(mission.status==='ROBBED'&&!['LOOT_CRATE','CLAIMED_BY_BANDIT'].includes(mission.cargo.ownerState))throw new Error('INVALID_ROBBED_OWNERSHIP');
  if(mission.status==='DELIVERED'&&mission.cargo.ownerState!=='DELIVERED_TO_DESTINATION')throw new Error('INVALID_DELIVERED_OWNERSHIP');
  return mission;
}

function freshCourierEnvelope(){return {schema:PLAYER_COURIER_SCHEMA,revision:0,missions:{},activeByCourier:{},settledReceipts:[],lootReceipts:[]}}
function validateCourierEnvelope(value){
  if(!value||value.schema!==PLAYER_COURIER_SCHEMA||!Number.isSafeInteger(value.revision)||value.revision<0||typeof value.missions!=='object'||!value.missions||Array.isArray(value.missions)||typeof value.activeByCourier!=='object'||!value.activeByCourier||Array.isArray(value.activeByCourier)||!Array.isArray(value.settledReceipts)||!Array.isArray(value.lootReceipts))throw new Error('CORRUPT_COURIER_SAVE');
  for(const [id,mission] of Object.entries(value.missions)){if(id!==mission.missionId)throw new Error('CORRUPT_COURIER_SAVE');validateCourierMission(mission)}
  if(new Set(value.settledReceipts).size!==value.settledReceipts.length||new Set(value.lootReceipts).size!==value.lootReceipts.length)throw new Error('CORRUPT_COURIER_SAVE');
  return value;
}

export function createPlayerCourierStore({storage,now=Date.now,monotonicNow=()=>globalThis.performance?.now?.()??0,sessionId=`SESSION-${Math.random().toString(16).slice(2)}`,locks,coordinationScope,resolveCreditPort}={}){
  if(storage===undefined){try{storage=globalThis.localStorage}catch{storage=null}}
  const writer=acquireLocalGameWriter({storage,locks,coordinationScope});
  let raw=null,state=freshCourierEnvelope(),status=storage?'READY':'STORAGE_UNAVAILABLE';
  function readState(){try{raw=storage?.getItem(PLAYER_COURIER_STORAGE_KEY)??null;if(raw&&raw.length>2_000_000)throw new Error('COURIER_STORE_CAPACITY');state=raw?validateCourierEnvelope(JSON.parse(raw)):freshCourierEnvelope();status=storage?'READY':'STORAGE_UNAVAILABLE'}catch{status='CORRUPT_SAVE';throw new Error(status)}return snapshot()}
  function reload(){writer.assertIdle();return readState()}
  try{readState()}catch(error){writer.dispose();throw error}
  function persist(next){validateCourierEnvelope(next);const encoded=JSON.stringify(next);if(encoded.length>2_000_000)throw new Error('COURIER_STORE_CAPACITY');writer.assert();if(storage.getItem(PLAYER_COURIER_STORAGE_KEY)!==raw)throw new Error('REVISION_CONFLICT_RELOAD_REQUIRED');try{storage.setItem(PLAYER_COURIER_STORAGE_KEY,encoded);if(storage.getItem(PLAYER_COURIER_STORAGE_KEY)!==encoded)throw new Error('READBACK_FAILED');writer.assert()}catch{status='PERSISTENCE_UNCERTAIN';throw new Error('COURIER_SAVE_NOT_CONFIRMED')}state=next;raw=encoded}
  function mutate(fn){return writer.run(()=>{if(status!=='READY')throw new Error(status);readState();const next=courierClone(state),result=fn(next);if(result&&typeof result.then==='function')throw new Error('ASYNC_LOCAL_MUTATION_FORBIDDEN');next.revision++;next.writeProtocol='LOCAL_GAME_SINGLE_WRITER';persist(next);return courierClone(result)})}
  function missionIn(envelope,missionId){const mission=envelope.missions[String(missionId||'')];if(!mission)throw new Error('COURIER_MISSION_NOT_FOUND');return mission}
  function activeMission(courierLifeId){const id=state.activeByCourier[String(courierLifeId||'')],mission=id?state.missions[id]:null;return mission?courierClone(mission):null}
  function accept(offer,{courierLifeId,wallNow=now(),monoNow=monotonicNow()}={}){
    validateCourierMission(offer);if(offer.status!=='OFFERED')throw new Error('COURIER_OFFER_REQUIRED');const courier=courierId(courierLifeId,'COURIER_LIFE_ID'),at=courierClock(wallNow,'CLOCK'),mono=Math.max(0,n(monoNow));
    return mutate(envelope=>{const activeId=envelope.activeByCourier[courier],active=activeId&&envelope.missions[activeId];if(active&&!courierTerminal(active.status))throw new Error('COURIER_ALREADY_ACTIVE');if(envelope.missions[offer.missionId])throw new Error('MISSION_REPLAY_BLOCKED');const mission=courierClone(offer);mission.status='ACTIVE';mission.courierLifeId=courier;mission.startedAt=at;mission.dueAt=at+mission.estimatedDurationMs;mission.lastWallAt=at;mission.lastMonotonicAt=mono;mission.clockSessionId=String(sessionId);mission.clockState='OK';mission.cargo.ownerState='OWNED_BY_COURIER';mission.cargo.ownerLifeId=courier;mission.bandit.attackWindowStartsAt=at+Math.floor(mission.estimatedDurationMs*.2);envelope.missions[mission.missionId]=mission;envelope.activeByCourier[courier]=mission.missionId;return mission})
  }
  function observeClock(mission,{wallNow=now(),monoNow=monotonicNow()}={}){
    const wall=courierClock(wallNow,'CLOCK'),mono=Math.max(0,n(monoNow));let reason=null;
    if(wall+1000<mission.lastWallAt)reason='CLOCK_ROLLBACK_DETECTED';
    if(!reason&&mission.clockSessionId===String(sessionId)){
      const wallElapsed=wall-mission.lastWallAt,monoElapsed=mono-mission.lastMonotonicAt;
      if(Math.abs(wallElapsed-monoElapsed)>5000)reason='CLOCK_DRIFT_DETECTED';
    }
    mission.lastWallAt=Math.max(mission.lastWallAt,wall);mission.lastMonotonicAt=mono;mission.clockSessionId=String(sessionId);
    if(reason){mission.status='CLOCK_REVIEW';mission.clockState=reason}
    return {ok:!reason,reason,wall};
  }
  function observe(missionId,options={}){return mutate(envelope=>{const mission=missionIn(envelope,missionId);if(courierTerminal(mission.status)||mission.status==='DELIVERY_PENDING_CREDIT')return mission;observeClock(mission,options);return mission})}
  function creditPort(courierLifeId){
    const port=resolveCreditPort?.(courierLifeId),selected=port?.snapshot?.();
    if(!port||typeof port.recordCourierSettlement!=='function'||selected?.playerId!==courierLifeId||selected.storageStatus!=='READY'||!selected.persistent||!selected.writeCapability?.writeEnabled||!(selected.owner==='guest'||/^0x[0-9a-f]{40}$/.test(selected.owner||'')))throw new Error('COURIER_CREDIT_OWNER_UNAVAILABLE');
    return {port,selected};
  }
  function durableCredit(credit,insurance=false){
    const key=`k11520.player:${credit.playerId}:k11520.local-product.v1:${credit.owner}`,saved=JSON.parse(storage.getItem(key)||'null'),binding=saved?.progress?.[insurance?'courierInsuranceBindings':'courierReceiptBindings']?.[credit.receiptId];
    return saved?.schema==='K11520_LOCAL_SIMULATION_V2'&&saved.playerId===credit.playerId&&saved.owner===credit.owner&&binding&&Object.keys(credit).filter(k=>k!=='status').every(k=>credit[k]===binding[k]);
  }
  function reconcileCredit(missionId){
    writer.assert();reload();const mission=missionIn(state,missionId),credit=mission.settlement?.credit;
    if(mission.status!=='DELIVERY_PENDING_CREDIT'||credit?.status!=='PENDING')throw new Error('PENDING_COURIER_CREDIT_REQUIRED');
    let evidence;
    try{const {port,selected}=creditPort(mission.courierLifeId);if(selected.owner!==credit.owner||selected.playerId!==credit.playerId)return {ok:false,reason:'COURIER_REWARD_OWNER_MISMATCH',mission:courierClone(mission)};evidence=port.recordCourierSettlement({...credit,reward:credit.rewardKaios})}catch(error){return {ok:false,reason:error.message,mission:courierClone(mission)}}
    if(!evidence?.ok)return {ok:false,reason:evidence?.reason||'COURIER_CREDIT_NOT_CONFIRMED',mission:courierClone(mission)};
    return mutate(envelope=>{const latest=missionIn(envelope,missionId),pending=latest.settlement?.credit;const {selected}=creditPort(latest.courierLifeId);if(latest.status!=='DELIVERY_PENDING_CREDIT'||!durableCredit(pending)||selected.owner!==pending.owner||selected.playerId!==pending.playerId||Object.keys(pending).filter(k=>k!=='status').some(k=>pending[k]!==evidence[k])||evidence.scope!=='LOCAL_SIMULATION_NO_CHAIN_TRANSFER')throw new Error('EXACT_COURIER_CREDIT_EVIDENCE_REQUIRED');pending.status='CONFIRMED';latest.status='DELIVERED';latest.settlement.outcome='DELIVERED';latest.cargo.ownerState='DELIVERED_TO_DESTINATION';latest.cargo.ownerLifeId=null;delete envelope.activeByCourier[latest.courierLifeId];return {ok:true,mission:latest,credit:evidence}});
  }
  function settleDue(missionId,{courierLifeId,wallNow=now(),monoNow=monotonicNow()}={}){
    writer.assert();reload();const existing=missionIn(state,missionId);if(String(existing.courierLifeId)!==String(courierLifeId))throw new Error('COURIER_LIFE_MISMATCH');if(existing.status==='DELIVERY_PENDING_CREDIT')return reconcileCredit(missionId);
    const pending=mutate(envelope=>{const mission=missionIn(envelope,missionId);if(courierTerminal(mission.status))throw new Error('MISSION_ALREADY_SETTLED');const clock=observeClock(mission,{wallNow,monoNow});if(!clock.ok)return {ok:false,reason:clock.reason,mission};if(clock.wall<mission.dueAt)return {ok:false,reason:'DELIVERY_TIMER_ACTIVE',remainingMs:mission.dueAt-clock.wall,mission};if(mission.status!=='ACTIVE'||mission.cargo.ownerState!=='OWNED_BY_COURIER'||mission.cargo.ownerLifeId!==mission.courierLifeId)throw new Error('CARGO_SURVIVAL_CHECK_FAILED');const {selected}=creditPort(mission.courierLifeId),receiptId=`COURIER-RECEIPT-${raidHash(`${mission.missionId}:${mission.courierLifeId}:${mission.dueAt}`).toString(16).padStart(8,'0')}`;if(envelope.settledReceipts.includes(receiptId))throw new Error('SETTLEMENT_REPLAY_BLOCKED');mission.status='DELIVERY_PENDING_CREDIT';mission.settlement={outcome:'DELIVERY_PENDING_CREDIT',receiptId,settledAt:clock.wall,courierLifeId:mission.courierLifeId,rewardKaios:mission.economics.courierPayout,salaryKaios:mission.economics.courierSalary,freightShareKaios:mission.economics.courierFreightShare,insurancePayoutKaios:0,scope:'LOCAL_SIMULATION_ONLY',chainTransfer:false,credit:{status:'PENDING',receiptId,missionId:mission.missionId,playerId:selected.playerId,owner:selected.owner,rewardKaios:mission.economics.courierPayout,purpose:'PLAYER_COURIER_REWARD'}};envelope.settledReceipts.push(receiptId);return {ok:true,mission}});
    return pending.ok?reconcileCredit(missionId):pending;
  }
  function applyCombatDamage(missionId,{courierLifeId,damage=0,source='MONSTER',eligibleCargoRaid=false,wallNow=now()}={}){
    return mutate(envelope=>{const mission=missionIn(envelope,missionId);if(mission.status!=='ACTIVE')throw new Error('ACTIVE_COURIER_MISSION_REQUIRED');if(String(mission.courierLifeId)!==String(courierLifeId))throw new Error('COURIER_LIFE_MISMATCH');const amount=Math.min(100,whole(damage,'CARGO_DAMAGE')),special=Boolean(eligibleCargoRaid)&&['BOSS_SPECIAL_RAID','BANDIT_CARGO_RAID'].includes(String(source));mission.cargo.durability=Math.max(special?0:1,mission.cargo.durability-amount);mission.risk=clamp(mission.risk+amount/500,0,1);if(mission.cargo.durability<=0){mission.status='FAILED';mission.cargo.ownerState='DESTROYED';mission.cargo.ownerLifeId=null;mission.settlement={outcome:'FAILED',reason:'CARGO_DESTROYED_BY_ELIGIBLE_RAID',receiptId:`COURIER-FAILED-${raidHash(`${mission.missionId}:${wallNow}`).toString(16).padStart(8,'0')}`,settledAt:courierClock(wallNow,'CLOCK'),rewardKaios:0,scope:'LOCAL_SIMULATION_ONLY',chainTransfer:false};envelope.settledReceipts.push(mission.settlement.receiptId);delete envelope.activeByCourier[mission.courierLifeId]}return mission})
  }
  function previewInsuranceActivation(missionId,{courierLifeId}={}){
    const mission=missionIn(state,missionId);if(mission.status!=='ACTIVE')throw new Error('ACTIVE_COURIER_MISSION_REQUIRED');if(String(mission.courierLifeId)!==String(courierLifeId))throw new Error('COURIER_LIFE_MISMATCH');if(mission.insurance.status!=='QUOTE_ONLY')throw new Error('INSURANCE_QUOTE_REQUIRED');
    return {ok:true,missionId:mission.missionId,courierLifeId:mission.courierLifeId,premiumKaios:mission.insurance.premiumKaios,purpose:'PLAYER_COURIER_INSURANCE_PREMIUM',scope:'LOCAL_SIMULATION_NO_CHAIN_TRANSFER'};
  }
  function activateInsurance(missionId,{courierLifeId,paymentEvidence,wallNow=now()}={}){
    return mutate(envelope=>{const mission=missionIn(envelope,missionId);if(mission.status!=='ACTIVE')throw new Error('ACTIVE_COURIER_MISSION_REQUIRED');if(String(mission.courierLifeId)!==String(courierLifeId))throw new Error('COURIER_LIFE_MISMATCH');if(mission.insurance.status!=='QUOTE_ONLY')throw new Error('INSURANCE_QUOTE_REQUIRED');const paid=Number(paymentEvidence?.amount);if(paymentEvidence?.ok!==true||!Number.isSafeInteger(paid)||paid!==mission.insurance.premiumKaios||paymentEvidence?.purpose!=='PLAYER_COURIER_INSURANCE_PREMIUM'||paymentEvidence?.scope!=='LOCAL_SIMULATION_NO_CHAIN_TRANSFER')throw new Error('EXACT_LOCAL_PREMIUM_EVIDENCE_REQUIRED');mission.insurance.status='ACTIVE';mission.insurance.premiumPaidKaios=paid;mission.insurance.activatedAt=courierClock(wallNow,'CLOCK');mission.insurance.paymentEvidence={amount:paid,purpose:paymentEvidence.purpose,scope:paymentEvidence.scope};return mission})
  }
  function raid(missionId,{attackerLifeId,banditMode=false,action='',attackPower=0,defensePower=0,distanceMeters,maxDistanceMeters=8,replayKey,wallNow=now()}={}){
    return mutate(envelope=>{const mission=missionIn(envelope,missionId),at=courierClock(wallNow,'CLOCK');if(mission.status!=='ACTIVE')throw new Error('ACTIVE_COURIER_MISSION_REQUIRED');if(at>=mission.dueAt)throw new Error('MISSION_DUE_SETTLEMENT_REQUIRED');const attacker=courierId(attackerLifeId,'ATTACKER_LIFE_ID');if(attacker===mission.courierLifeId)throw new Error('DISTINCT_ATTACKER_LIFE_REQUIRED');if(!banditMode||action!=='CARGO_RAID_ACTION')throw new Error('BANDIT_MODE_AND_RAID_ACTION_REQUIRED');const distance=Number(distanceMeters),limit=Number(maxDistanceMeters);if(!Number.isFinite(distance)||distance<0)throw new Error('TARGET_POSITION_UNVERIFIED');if(!Number.isFinite(limit)||limit<=0||distance>limit)throw new Error('TARGET_OUT_OF_LOCAL_RANGE');if(at<mission.bandit.attackWindowStartsAt)throw new Error('RAID_WINDOW_NOT_OPEN');if(at-mission.bandit.lastRaidAt<mission.bandit.cooldownMs)throw new Error('RAID_COOLDOWN');const key=courierId(replayKey,'REPLAY_KEY');if(mission.bandit.attempts.some(item=>item.replayKey===key))throw new Error('RAID_REPLAY_BLOCKED');const attack=whole(attackPower,'ATTACK_POWER'),defense=whole(defensePower,'DEFENSE_POWER'),variance=(raidHash(key)%21)-10,success=attack+variance>defense+Math.round(mission.cargo.durability*.2);const attempt={replayKey:key,attackerLifeId:attacker,at,attack,defense,variance,success,distanceMeters:distance};mission.bandit.attempts.push(attempt);mission.bandit.lastRaidAt=at;if(!success){mission.cargo.durability=Math.max(1,mission.cargo.durability-5);mission.risk=clamp(mission.risk+.1,0,1);return {mission,attempt}}
      const dropId=`CARGO-DROP-${raidHash(`${mission.missionId}:${key}`).toString(16).padStart(8,'0')}`,lootReceiptId=`LOOT-${raidHash(`${dropId}:${attacker}`).toString(16).padStart(8,'0')}`;mission.status='ROBBED';mission.cargo.ownerState='LOOT_CRATE';mission.cargo.ownerLifeId=attacker;mission.cargo.dropId=dropId;mission.bandit.lootReceiptId=lootReceiptId;let insurancePayout=0;if(mission.insurance.status==='ACTIVE'&&mission.insurance.claimStatus==='NOT_CLAIMED'){insurancePayout=Math.min(mission.insurance.maxClaimKaios,Math.max(0,mission.cargo.amount-mission.insurance.deductibleKaios));mission.insurance.claimStatus='APPROVED';mission.insurance.payoutKaios=insurancePayout;mission.insurance.payoutReceiptId=`COURIER-INSURANCE-${raidHash(`${mission.missionId}:${mission.insurance.policyId}:${key}`).toString(16).padStart(8,'0')}`}mission.settlement={outcome:'ROBBED',receiptId:`COURIER-ROBBED-${raidHash(`${mission.missionId}:${key}`).toString(16).padStart(8,'0')}`,settledAt:at,attackerLifeId:attacker,rewardKaios:0,insurancePayoutKaios:insurancePayout,dropId,lootReceiptId,scope:'LOCAL_SIMULATION_ONLY',chainTransfer:false};envelope.settledReceipts.push(mission.settlement.receiptId);delete envelope.activeByCourier[mission.courierLifeId];return {mission,attempt}})
  }
  function previewLoot(missionId,{attackerLifeId}={}){const mission=missionIn(state,missionId);if(mission.status!=='ROBBED'||mission.cargo.ownerState!=='LOOT_CRATE')throw new Error('LOOT_NOT_AVAILABLE');if(String(attackerLifeId)!==mission.cargo.ownerLifeId)throw new Error('LOOT_OWNER_MISMATCH');const receiptId=mission.bandit.lootReceiptId;if(state.lootReceipts.includes(receiptId))throw new Error('LOOT_REPLAY_BLOCKED');return {missionId:mission.missionId,cargo:courierClone(mission.cargo),receiptId,scope:'LOCAL_GAME_CARGO_ONLY',chainTransfer:false}}
  function claimLoot(missionId,{attackerLifeId,backpackEvidence}={}){return mutate(envelope=>{const mission=missionIn(envelope,missionId);if(mission.status!=='ROBBED'||mission.cargo.ownerState!=='LOOT_CRATE')throw new Error('LOOT_NOT_AVAILABLE');if(String(attackerLifeId)!==mission.cargo.ownerLifeId)throw new Error('LOOT_OWNER_MISMATCH');const receiptId=mission.bandit.lootReceiptId;if(envelope.lootReceipts.includes(receiptId))throw new Error('LOOT_REPLAY_BLOCKED');if(backpackEvidence?.ok!==true||backpackEvidence?.rewardId!==receiptId||backpackEvidence?.scope!=='LOCAL_PLAYER_BACKPACK')throw new Error('BACKPACK_DELIVERY_EVIDENCE_REQUIRED');mission.cargo.ownerState='CLAIMED_BY_BANDIT';mission.cargo.lootClaimedAt=courierClock(now(),'CLOCK');envelope.lootReceipts.push(receiptId);return {missionId:mission.missionId,cargo:courierClone(mission.cargo),receiptId,scope:'LOCAL_GAME_CARGO_ONLY',chainTransfer:false}})}
  function claimInsurancePayout(missionId,{courierLifeId,wallNow=now()}={}){
    writer.assert();reload();let mission=missionIn(state,missionId);
    if(mission.courierLifeId!==courierLifeId)throw new Error('COURIER_LIFE_MISMATCH');
    if(mission.status!=='ROBBED'||mission.insurance.status!=='ACTIVE'||mission.insurance.claimStatus!=='APPROVED')throw new Error('INSURANCE_PAYOUT_NOT_APPROVED');
    if(!mission.insurance.credit)mission=mutate(envelope=>{const current=missionIn(envelope,missionId),{selected}=creditPort(courierLifeId);current.insurance.credit={status:'PENDING',receiptId:current.insurance.payoutReceiptId,missionId,playerId:selected.playerId,owner:selected.owner,rewardKaios:current.insurance.payoutKaios,purpose:'PLAYER_COURIER_INSURANCE_PAYOUT'};return current});
    const credit=mission.insurance.credit,{port,selected}=creditPort(courierLifeId);
    if(selected.owner!==credit.owner||selected.playerId!==credit.playerId)return {ok:false,reason:'COURIER_REWARD_OWNER_MISMATCH'};
    const evidence=port.recordCourierInsurancePayout?.({...credit,reward:credit.rewardKaios});
    if(!evidence?.ok)return {ok:false,reason:evidence?.reason||'COURIER_INSURANCE_CREDIT_NOT_CONFIRMED'};
    return {ok:true,evidence,mission:confirmInsurancePayout(missionId,{courierLifeId,paymentEvidence:evidence,wallNow})};
  }
  function confirmInsurancePayout(missionId,{courierLifeId,paymentEvidence,wallNow=now()}={}){return mutate(envelope=>{const mission=missionIn(envelope,missionId);if(mission.status!=='ROBBED'||mission.insurance.status!=='ACTIVE')throw new Error('INSURED_ROBBERY_REQUIRED');if(String(mission.courierLifeId)!==String(courierLifeId))throw new Error('COURIER_LIFE_MISMATCH');if(mission.insurance.claimStatus!=='APPROVED')throw new Error(mission.insurance.claimStatus==='PAID'?'INSURANCE_PAYOUT_REPLAY_BLOCKED':'INSURANCE_PAYOUT_NOT_APPROVED');const credit=mission.insurance.credit,{selected}=creditPort(mission.courierLifeId);if(!credit||selected.owner!==credit.owner||selected.playerId!==credit.playerId||!durableCredit(credit,true))throw new Error('DURABLE_INSURANCE_CREDIT_REQUIRED');const value=Number(paymentEvidence?.rewardKaios),receiptId=String(paymentEvidence?.receiptId||'');if(Object.keys(credit).filter(k=>k!=='status').some(k=>credit[k]!==paymentEvidence?.[k])||paymentEvidence?.ok!==true||receiptId!==mission.insurance.payoutReceiptId||value!==mission.insurance.payoutKaios||paymentEvidence?.purpose!=='PLAYER_COURIER_INSURANCE_PAYOUT'||paymentEvidence?.scope!=='LOCAL_SIMULATION_NO_CHAIN_TRANSFER')throw new Error('EXACT_LOCAL_INSURANCE_PAYOUT_EVIDENCE_REQUIRED');credit.status='CONFIRMED';mission.insurance.claimStatus='PAID';mission.insurance.paidAt=courierClock(wallNow,'CLOCK');mission.insurance.payoutEvidence={receiptId,rewardKaios:value,scope:paymentEvidence.scope,replayed:Boolean(paymentEvidence.replayed)};return mission})}
  function snapshot(missionId=null){const mission=missionId?state.missions[String(missionId)]||null:null;return {schema:PLAYER_COURIER_SCHEMA,status,writeCapability:writer.capability(),revision:state.revision,mission:courierClone(mission),missions:courierClone(state.missions),activeByCourier:courierClone(state.activeByCourier)}}
  return Object.freeze({accept,activeMission,observe,settleDue,applyCombatDamage,previewInsuranceActivation,activateInsurance,raid,previewLoot,claimLoot,confirmInsurancePayout,claimInsurancePayout,reconcileCredit,snapshot,reload,get ready(){return writer.ready},requestWriter:writer.requestWriter,dispose:writer.dispose});
}

export function deliverySnapshot(ant){
  const m=ant.mission;
  return {
    lifeId:ant.lifeId,name:ant.name,species:ant.species,role:ant.role,state:ant.state,
    position:{x:ant.x,y:ant.y,z:ant.z},vehicle:{...ant.vehicle},vitality:ant.vitality,capital:ant.capital,retirementReserve:ant.retirementReserve,targetRetirementReserve:ant.targetRetirementReserve,cargo:{...ant.cargo},finance:{...ant.finance},payroll:structuredClone(ant.payroll),cargoRisk:structuredClone(ant.cargoRisk),
    mission:m?{missionId:m.missionId,status:m.status,destinationAtmId:m.destinationAtmId,route:m.route,level:m.level,cargoKind:m.cargoKind,amount:m.amount,unit:m.unit,mode:m.mode,movementC:m.movementC,transportMode:m.transportMode,flightPhase:m.flightPhase,flightWaypointIndex:m.flightWaypointIndex,flightPlan:m.flightPlan,quote:m.quote,serviceType:m.serviceType,requesterLifeId:m.requesterLifeId,homePlotId:m.homePlotId,customerAcceptanceRequired:Boolean(m.customerAcceptanceRequired),customerAcceptance:m.customerAcceptance,accounting:m.accounting,gameplayRiskPool:m.gameplayRiskPool,gameplayRiskPoolRemaining:m.gameplayRiskPoolRemaining,lastMovement:m.lastMovement,receiptVerified:Boolean(m.receiptVerified),receiptId:m.receiptId}:null,
    simulation:true,realAssetTransfer:false,mainnetWrite:false,
  };
}
