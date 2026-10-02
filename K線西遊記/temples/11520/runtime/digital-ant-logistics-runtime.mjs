/*
KGEN_META
VERSION: 1.3.0
REVISION: 2026-10-03.DIGITAL-ANT-CARGO-RISK-GAME
STATUS: ACTIVE / SIMULATION-FIRST
SOURCE_OF_TRUTH: LOGISTICS_UNIVERSE_SPEC.md / HUAGUOSHAN_TAIWAN_EXCHANGE_WHITEPAPER.md
CHANGE_REASON: Define Digital Ant as an armored cash courier / Market Life guardian, separate physical route from K-space positions, and add fail-closed cargo hedge planning without risking cargo principal or player assets.
*/

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
    vehicle:{vehicleId:String(vehicle?.vehicleId||'ATM-UFO-DIGITAL-ANT-0001'),type:String(vehicle?.type||ATM_UFO_TRANSPORT_MODE),lifeId:vehicle?.lifeId||null,independentLife:false},
    finance:{earned:0,spent:0,tips:0,freight:0,fuel:0,salary:0,maintenance:0,risk:0,time:0,lastNet:0},
    cargoRisk:{desk:'AI_ANT_COMPANY_CARGO_RISK_DESK',policy:null,reserveKaios:0,incidents:[],replayKeys:[],lastRaidAt:0},
  };
}

export function createDeliveryMission({
  missionId=`DELIVERY-${Date.now()}`,cargoKind='CASH',amount=0,unit='KAIOS',destinationAtmId,
  price=LOGISTICS_ANCHOR,demand=1,mode='OBSERVE',marketEdge=0,freightOffer=0,
  distanceMeters=null,metersPerWorldUnit=1,baseFreight=0,distanceRate=0,loadRate=0,riskRate=0,
  fuelPerMeter=0,salaryPerSecond=0,maintenancePerMeter=0,timeCostPerSecond=0,riskProbability=0,riskLoss=0,
  speedMetersPerSecond=null,tipRate=0,movementC=1,flightAltitude=6,arrivalOffsetY=1.1,transportMode=ATM_UFO_TRANSPORT_MODE,
  gameplayRiskPool=0,maxRaidLoss=100
}={}){
  const normalizedMode=DELIVERY_MODES.includes(String(mode).toUpperCase())?String(mode).toUpperCase():'OBSERVE';
  const explicitDistance=distanceMeters===null||distanceMeters===undefined||distanceMeters===''?null:Math.max(0,n(distanceMeters));
  const explicitSpeed=speedMetersPerSecond===null||speedMetersPerSecond===undefined||speedMetersPerSecond===''?null:Math.max(0,n(speedMetersPerSecond));
  return {
    missionId,cargoKind,amount:Math.max(0,n(amount)),unit:String(unit||'KAIOS'),destinationAtmId:String(destinationAtmId||''),
    price:n(price,LOGISTICS_ANCHOR),demand:n(demand),mode:normalizedMode,marketEdge:n(marketEdge),freightOffer:Math.max(0,n(freightOffer)),
    economics:{distanceMeters:explicitDistance,metersPerWorldUnit:Math.max(0.000001,n(metersPerWorldUnit,1)),baseFreight:Math.max(0,n(baseFreight)),distanceRate:Math.max(0,n(distanceRate)),loadRate:Math.max(0,n(loadRate)),riskRate:Math.max(0,n(riskRate)),fuelPerMeter:Math.max(0,n(fuelPerMeter)),salaryPerSecond:Math.max(0,n(salaryPerSecond)),maintenancePerMeter:Math.max(0,n(maintenancePerMeter)),timeCostPerSecond:Math.max(0,n(timeCostPerSecond)),riskProbability:clamp(riskProbability,0,1),riskLoss:Math.max(0,n(riskLoss)),speedMetersPerSecond:explicitSpeed,tipRate:Math.max(0,n(tipRate))},
    movementC:n(movementC,1),flightAltitude:Math.max(1,n(flightAltitude,6)),arrivalOffsetY:Math.max(0,n(arrivalOffsetY,1.1)),transportMode:String(transportMode||ATM_UFO_TRANSPORT_MODE),
    gameplayRiskPool:whole(gameplayRiskPool,'GAMEPLAY_RISK_POOL'),gameplayRiskPoolRemaining:whole(gameplayRiskPool,'GAMEPLAY_RISK_POOL'),maxRaidLoss:whole(maxRaidLoss,'MAX_RAID_LOSS'),lastMovement:{x:0,y:0,z:0},
    status:'CREATED',createdAt:Date.now(),pickedUpAt:null,deliveredAt:null,failedAt:null,receiptVerified:false,
  };
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
  const salary=(travelSeconds??0)*n(e.salaryPerSecond);
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
  if(!m||m.status!=='IN_TRANSIT')return {ok:false,reason:'NOT_IN_TRANSIT',state:ant.state};
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
  ant.capital=Math.max(0,ant.capital+q.net);
  if(q.net>0){const reserve=q.net*0.2;ant.retirementReserve+=reserve;ant.capital=Math.max(0,ant.capital-reserve);}
  return {ok:true,delivered:true,atmId:m.destination.atmId,cargo:delivered,missionId:m.missionId,receiptId:m.receiptId,quote:q,retirementReserve:ant.retirementReserve};
}

export function deliverySnapshot(ant){
  const m=ant.mission;
  return {
    lifeId:ant.lifeId,name:ant.name,species:ant.species,role:ant.role,state:ant.state,
    position:{x:ant.x,y:ant.y,z:ant.z},vehicle:{...ant.vehicle},vitality:ant.vitality,capital:ant.capital,retirementReserve:ant.retirementReserve,targetRetirementReserve:ant.targetRetirementReserve,cargo:{...ant.cargo},finance:{...ant.finance},cargoRisk:structuredClone(ant.cargoRisk),
    mission:m?{missionId:m.missionId,status:m.status,destinationAtmId:m.destinationAtmId,route:m.route,level:m.level,cargoKind:m.cargoKind,amount:m.amount,unit:m.unit,mode:m.mode,movementC:m.movementC,transportMode:m.transportMode,flightPhase:m.flightPhase,flightWaypointIndex:m.flightWaypointIndex,flightPlan:m.flightPlan,quote:m.quote,gameplayRiskPool:m.gameplayRiskPool,gameplayRiskPoolRemaining:m.gameplayRiskPoolRemaining,lastMovement:m.lastMovement,receiptVerified:Boolean(m.receiptVerified)}:null,
    simulation:true,realAssetTransfer:false,mainnetWrite:false,
  };
}
