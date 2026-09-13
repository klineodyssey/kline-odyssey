/*
KGEN_META
VERSION: 1.1.0
REVISION: 2026-09-08.MARKET-LIFE-LIFESTYLE-ECONOMY
STATUS: ACTIVE / SIMULATION-FIRST
SOURCE_OF_TRUTH: MARKET_LIFE_AI_SPEC.md / LIVING_WORLD_ECOSYSTEM_SPEC.md / HUAGUOSHAN_TAIWAN_EXCHANGE_WHITEPAPER.md
CHANGE_REASON: Extend Market Life from combat-only strategy into work, travel, rest, social, exploration and retirement behavior while preserving survival, market and Naihe lifecycle semantics.
*/

export const MARKET_LIFE_ACTIONS=Object.freeze(['HOLD','FOLLOW','OPPOSE','HEDGE','REALLOCATE','REDUCE','RETREAT','REENTER']);
export const MARKET_LIFE_STATES=Object.freeze(['ALIVE','WOUNDED','RETREATING','DEAD','NAIHE','MENGPO_RECOVERY','REBIRTH']);
export const MARKET_LIFE_LIFESTYLE_ACTIONS=Object.freeze(['WORK','TRADE','TRAVEL','REST','EAT','SOCIAL','EXPLORE','RETIRE','RETREAT']);
export const UNMARKETED_WORLD_SPECIES=Object.freeze(['FISH','SHRIMP','COW','SHEEP','CHICKEN','DUCK','TREE','FLOWER']);

const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
const copy=v=>JSON.parse(JSON.stringify(v));

export function createMarketLife({
  lifeId,name,species='MARKET_LIFE',intelligence=1,markets=['BTCUSDT'],capital=100,vitality=100,
  fear=0.35,profitDrive=0.65,memoryCapacity=24,positions={},age=18,retirementReserve=0,targetRetirementReserve=100,
  home={x:0,y:0,z:0},position={x:0,y:0,z:0},needs={hunger:0.15,fatigue:0.15,social:0.25,curiosity:0.45},preferences={travel:0.5,work:0.55,comfort:0.45}
}={}){
  if(!lifeId)throw new Error('MARKET_LIFE_REQUIRES_LIFE_ID');
  const allowed=[...new Set(markets)].filter(Boolean);
  const isInactiveSourceSlot=species==='SOURCE_SLOT';
  const isWildEcology=UNMARKETED_WORLD_SPECIES.includes(species);
  if(!allowed.length&&!isInactiveSourceSlot&&!isWildEcology)throw new Error('MARKET_LIFE_REQUIRES_MARKET');
  return {
    lifeId,name:name||lifeId,species,
    intelligence:Math.max(1,Math.floor(intelligence)),
    marketDimensions:allowed,
    capital:Math.max(0,Number(capital)||0),startingCapital:Math.max(0,Number(capital)||0),
    retirementReserve:Math.max(0,Number(retirementReserve)||0),targetRetirementReserve:Math.max(1,Number(targetRetirementReserve)||100),age:Math.max(0,Number(age)||0),
    vitality:clamp(vitality,0,100),fear:clamp(fear,0,1),profitDrive:clamp(profitDrive,0,1),
    positions:copy(positions),memory:[],memoryCapacity:Math.max(4,Math.floor(memoryCapacity)),
    state:isInactiveSourceSlot?'DEAD':'ALIVE',strategy:isInactiveSourceSlot?'HIDDEN':isWildEcology?'WILD_ECOLOGY':'HOLD',confidence:isInactiveSourceSlot?0:0.5,lastDecisionAt:0,
    growth:{experience:0,wins:0,losses:0,dimensionUnlocks:0},lifecycle:{diedAt:null,naiheAt:null,mengpoAt:null,rebornAt:null},
    world:{home:copy(home),position:copy(position),destination:null,lastTravelAt:null},
    needs:{hunger:clamp(needs?.hunger,0,1),fatigue:clamp(needs?.fatigue,0,1),social:clamp(needs?.social,0,1),curiosity:clamp(needs?.curiosity,0,1)},
    preferences:{travel:clamp(preferences?.travel,0,1),work:clamp(preferences?.work,0,1),comfort:clamp(preferences?.comfort,0,1)},
    lifestyle:{action:isInactiveSourceSlot?'HIDDEN':'REST',reason:'BORN',income:0,expenses:0,retirementContributions:0,lastAt:0},
  };
}

export function perceiveMarketLife(life,{playerAxes={},quotes={},now=Date.now()}={}){
  const visible={};
  for(const [axis,p] of Object.entries(playerAxes||{})){
    if(!p?.market||!life.marketDimensions.includes(p.market))continue;
    visible[axis]={market:p.market,side:p.side||null,lots:Number(p.lots)||0,c:Number(p.c)||0,pnl:Number(p.pnl)||0};
  }
  const perception={now,visiblePlayerAxes:visible,quotes:{}};
  for(const m of life.marketDimensions)if(Number.isFinite(Number(quotes?.[m])))perception.quotes[m]=Number(quotes[m]);
  return perception;
}

function exposureScore(perception){return Object.values(perception.visiblePlayerAxes||{}).reduce((s,p)=>s+Math.abs(Number(p.lots)||0)*Math.max(0.000001,Math.abs(Number(p.c)||0)),0);}

export function decideMarketLife(life,perception,{random=()=>0.5}={}){
  if(life.state==='DEAD'||life.state==='NAIHE'||life.state==='MENGPO_RECOVERY')return decision(life,'HOLD',0,'LIFECYCLE_LOCK',perception.now);
  if(!life.marketDimensions.length)return decision(life,'HOLD',0,'UNMARKETED_WORLD_LIFE',perception.now);
  const capRatio=life.startingCapital>0?life.capital/life.startingCapital:0;
  const survivalPressure=clamp((1-life.vitality/100)*0.55+(1-capRatio)*0.45,0,1);
  const seen=Object.values(perception.visiblePlayerAxes||{}),exposure=exposureScore(perception);
  let action='HOLD',reason='NO_PLAYER_EXPOSURE';
  if(survivalPressure>0.72){action='RETREAT';reason='SURVIVAL_CRITICAL';}
  else if(survivalPressure>0.48){action=random()<0.6?'REDUCE':'HEDGE';reason='SURVIVAL_PRESSURE';}
  else if(seen.length){const r=random(),intelligenceBias=clamp((life.intelligence-1)/8,0,0.65);if(seen.length>1&&life.marketDimensions.length>1&&r<intelligenceBias){action='REALLOCATE';reason='MULTI_MARKET_OPPORTUNITY';}else if(r<0.35+life.profitDrive*0.25){action='FOLLOW';reason='MOMENTUM_PROFIT';}else if(r<0.72){action='OPPOSE';reason='COUNTERPARTY_OPPORTUNITY';}else{action='HEDGE';reason='RISK_CONTROL';}}
  const confidence=clamp(0.35+life.intelligence*0.055+Math.min(0.2,exposure*0.01)-survivalPressure*0.3,0.05,0.98);
  return decision(life,action,confidence,reason,perception.now);
}

function decision(life,action,confidence,reason,now){life.strategy=action;life.confidence=confidence;life.lastDecisionAt=now;return {lifeId:life.lifeId,action,confidence,reason,state:life.state,now};}

export function decideMarketLifeLifestyle(life,{jobs=[],destinations=[],marketOpportunity=0,threat=0,now=Date.now(),random=()=>0.5}={}){
  if(['DEAD','NAIHE','MENGPO_RECOVERY'].includes(life.state))return lifestyleDecision(life,'REST','LIFECYCLE_LOCK',now);
  const retirementRatio=life.retirementReserve/Math.max(1,life.targetRetirementReserve);
  const survival=clamp((1-life.vitality/100)*0.65+clamp(threat,0,1)*0.35,0,1);
  if(survival>0.72)return lifestyleDecision(life,'RETREAT','SURVIVAL_FIRST',now);
  if(life.needs.hunger>0.72)return lifestyleDecision(life,'EAT','HUNGER',now);
  if(life.needs.fatigue>0.7)return lifestyleDecision(life,'REST','FATIGUE',now);
  if(retirementRatio>=1&&life.preferences.comfort>=0.4)return lifestyleDecision(life,'RETIRE','RETIREMENT_RESERVE_READY',now);
  const viableJobs=(jobs||[]).filter(j=>Number(j?.expectedNet)>0).sort((a,b)=>Number(b.expectedNet)-Number(a.expectedNet));
  if(viableJobs.length&&life.preferences.work>random())return lifestyleDecision(life,'WORK','POSITIVE_JOB_AVAILABLE',now,{job:copy(viableJobs[0])});
  if(Number(marketOpportunity)>0&&life.marketDimensions.length&&life.profitDrive>random())return lifestyleDecision(life,'TRADE','MARKET_OPPORTUNITY',now);
  if(life.needs.social>0.65)return lifestyleDecision(life,'SOCIAL','SOCIAL_NEED',now);
  if(destinations?.length&&life.preferences.travel>random()){
    const destination=copy(destinations[Math.floor(random()*destinations.length)%destinations.length]);
    life.world.destination=destination;life.world.lastTravelAt=now;
    return lifestyleDecision(life,life.needs.curiosity>0.55?'EXPLORE':'TRAVEL',life.needs.curiosity>0.55?'CURIOSITY':'LEISURE_TRAVEL',now,{destination});
  }
  return lifestyleDecision(life,'REST','NO_URGENT_WORK_REQUIRED',now);
}

function lifestyleDecision(life,action,reason,now,extra={}){life.lifestyle.action=action;life.lifestyle.reason=reason;life.lifestyle.lastAt=now;remember(life,{at:now,type:'LIFESTYLE_DECISION',action,reason,...extra});return {lifeId:life.lifeId,action,reason,state:life.state,now,...extra};}

export function applyLifestyleEconomy(life,{income=0,expenses=0,retirementRate=0.15,reason='LIFESTYLE_ECONOMY',now=Date.now()}={}){
  const gross=Number(income)||0,cost=Math.max(0,Number(expenses)||0),net=gross-cost;
  life.capital=Math.max(0,life.capital+net);
  const contribution=net>0?net*clamp(retirementRate,0,1):0;
  life.retirementReserve+=contribution;life.capital=Math.max(0,life.capital-contribution);
  life.lifestyle.income+=gross;life.lifestyle.expenses+=cost;life.lifestyle.retirementContributions+=contribution;
  remember(life,{at:now,type:'LIFESTYLE_ECONOMY',income:gross,expenses:cost,net,retirementContribution:contribution,reason});
  return {capital:life.capital,retirementReserve:life.retirementReserve,net,contribution};
}

export function tickMarketLifeNeeds(life,{deltaHours=1,working=false,traveling=false,resting=false,eating=false,socializing=false}={}){
  const h=Math.max(0,Number(deltaHours)||0);
  life.needs.hunger=clamp(life.needs.hunger+h*(eating?-0.35:0.035),0,1);
  life.needs.fatigue=clamp(life.needs.fatigue+h*(resting?-0.28:working?0.09:traveling?0.06:0.02),0,1);
  life.needs.social=clamp(life.needs.social+h*(socializing?-0.3:0.025),0,1);
  life.needs.curiosity=clamp(life.needs.curiosity+h*(traveling?-0.14:0.018),0,1);
  return copy(life.needs);
}

export function travelMarketLife(life,{destination=null,deltaMs=16,speed=0.01}={}){
  const target=destination||life.world.destination;
  if(!target)return {ok:false,reason:'NO_DESTINATION'};
  const p=life.world.position,dx=(Number(target.x)||0)-(Number(p.x)||0),dy=(Number(target.y)||0)-(Number(p.y)||0),dz=(Number(target.z)||0)-(Number(p.z)||0),d=Math.hypot(dx,dy,dz);
  if(d<=0.35){p.x=Number(target.x)||0;p.y=Number(target.y)||0;p.z=Number(target.z)||0;life.world.destination=null;return {ok:true,arrived:true,position:copy(p)};}
  const step=Math.min(d,Math.max(0,Number(speed)||0)*Math.max(0,Number(deltaMs)||0)),len=d||1;
  p.x+=dx/len*step;p.y+=dy/len*step;p.z+=dz/len*step;
  return {ok:true,arrived:false,remaining:Math.hypot((Number(target.x)||0)-p.x,(Number(target.y)||0)-p.y,(Number(target.z)||0)-p.z),position:copy(p)};
}

export function applyMarketResult(life,{pnl=0,market=null,reason='MARKET_RESULT',now=Date.now()}={}){
  const value=Number(pnl)||0;life.capital=Math.max(0,life.capital+value);const loss=value<0?Math.abs(value):0,gain=value>0?value:0;
  if(loss>0){const damage=clamp((loss/Math.max(1,life.startingCapital))*70,0,45);life.vitality=clamp(life.vitality-damage,0,100);life.growth.losses++;}else if(gain>0){life.vitality=clamp(life.vitality+Math.min(5,gain/Math.max(1,life.startingCapital)*10),0,100);life.growth.wins++;}
  life.growth.experience+=Math.abs(value);remember(life,{at:now,type:'MARKET_RESULT',market,pnl:value,reason,capital:life.capital,vitality:life.vitality});
  if(life.capital<=0||life.vitality<=0){life.state='DEAD';life.lifecycle.diedAt=now;}else if(life.vitality<35)life.state='WOUNDED';else if(life.strategy==='RETREAT')life.state='RETREATING';else life.state='ALIVE';
  return snapshotMarketLife(life);
}

export function advanceMarketLifeCycle(life,{now=Date.now(),naiheDelayMs=1500,mengpoDelayMs=3000,rebirthDelayMs=8000}={}){
  if(life.state==='DEAD'&&life.lifecycle.diedAt!==null&&now-life.lifecycle.diedAt>=naiheDelayMs){life.state='NAIHE';life.lifecycle.naiheAt=now;remember(life,{at:now,type:'NAIHE_ENTER'});}
  if(life.state==='NAIHE'&&life.lifecycle.naiheAt!==null&&now-life.lifecycle.naiheAt>=mengpoDelayMs){life.state='MENGPO_RECOVERY';life.lifecycle.mengpoAt=now;remember(life,{at:now,type:'MENGPO_RECOVERY'});}
  if(life.state==='MENGPO_RECOVERY'&&life.lifecycle.mengpoAt!==null&&now-life.lifecycle.mengpoAt>=rebirthDelayMs){life.state='REBIRTH';life.lifecycle.rebornAt=now;life.vitality=100;life.capital=Math.max(1,life.startingCapital*0.5);life.strategy='REENTER';life.needs={hunger:0.1,fatigue:0.1,social:0.2,curiosity:0.5};remember(life,{at:now,type:'REBIRTH'});}
  if(life.state==='REBIRTH'){life.state='ALIVE';life.strategy='REENTER';}
  return snapshotMarketLife(life);
}

export function maybeGrowMarketLife(life,{availableMarkets=[]}={}){
  if(!life.marketDimensions.length)return {grown:false,life:snapshotMarketLife(life)};const threshold=50*Math.max(1,life.marketDimensions.length);if(life.growth.experience<threshold)return {grown:false,life:snapshotMarketLife(life)};const next=(availableMarkets||[]).find(m=>m&&!life.marketDimensions.includes(m));if(!next)return {grown:false,life:snapshotMarketLife(life)};life.marketDimensions.push(next);life.growth.dimensionUnlocks++;life.growth.experience-=threshold;life.intelligence++;remember(life,{at:Date.now(),type:'DIMENSION_UNLOCK',market:next,intelligence:life.intelligence});return {grown:true,unlockedMarket:next,life:snapshotMarketLife(life)};
}

export function remember(life,event){life.memory.push(copy(event));if(life.memory.length>life.memoryCapacity)life.memory.splice(0,life.memory.length-life.memoryCapacity);return life.memory.length;}
export function snapshotMarketLife(life){return copy(life);}
