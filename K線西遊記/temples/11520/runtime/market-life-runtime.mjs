/*
KGEN_META
VERSION: 1.1.0
REVISION: 2026-09-08.MARKET-LIFE-PSYCHE
STATUS: ACTIVE
SOURCE_OF_TRUTH: MARKET_LIFE_AI_SPEC.md / LIVING_WORLD_ECOSYSTEM_SPEC.md
CHANGE_REASON: Give living Market Life survival instinct, seven-emotion and six-desire state so monsters may fear death, retreat, become angry, seek profit, remember outcomes, and pass through the existing Naihe/Mengpo/Rebirth lifecycle.
*/

export const MARKET_LIFE_ACTIONS=Object.freeze(['HOLD','FOLLOW','OPPOSE','HEDGE','REALLOCATE','REDUCE','RETREAT','REENTER']);
export const MARKET_LIFE_STATES=Object.freeze(['ALIVE','WOUNDED','RETREATING','DEAD','NAIHE','MENGPO_RECOVERY','REBIRTH']);
export const UNMARKETED_WORLD_SPECIES=Object.freeze(['FISH','SHRIMP','COW','SHEEP','CHICKEN','DUCK','TREE','FLOWER']);
export const SEVEN_EMOTIONS=Object.freeze(['joy','anger','sorrow','fear','love','aversion','desire']);
export const SIX_DESIRES=Object.freeze(['survival','wealth','comfort','status','attachment','curiosity']);

const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
const copy=v=>JSON.parse(JSON.stringify(v));
const psycheMap=(keys,defaults,input={})=>Object.fromEntries(keys.map(k=>[k,clamp(input?.[k]??defaults[k]??0,0,1)]));

function defaultEmotions({fear=.35,profitDrive=.65}={}){
  return {joy:.45,anger:.25,sorrow:.18,fear:clamp(fear,0,1),love:.28,aversion:.24,desire:clamp(.35+profitDrive*.35,0,1)};
}
function defaultDesires({profitDrive=.65}={}){
  return {survival:.92,wealth:clamp(profitDrive,0,1),comfort:.45,status:.32,attachment:.30,curiosity:.38};
}

export function createMarketLife({
  lifeId,name,species='MARKET_LIFE',intelligence=1,markets=['BTCUSDT'],capital=100,vitality=100,
  fear=0.35,profitDrive=0.65,emotions=null,desires=null,memoryCapacity=24,positions={}
}={}){
  if(!lifeId)throw new Error('MARKET_LIFE_REQUIRES_LIFE_ID');
  const allowed=[...new Set(markets)].filter(Boolean);
  const isInactiveSourceSlot=species==='SOURCE_SLOT';
  const isWildEcology=UNMARKETED_WORLD_SPECIES.includes(species);
  if(!allowed.length&&!isInactiveSourceSlot&&!isWildEcology)throw new Error('MARKET_LIFE_REQUIRES_MARKET');
  const e=psycheMap(SEVEN_EMOTIONS,defaultEmotions({fear,profitDrive}),emotions||{});
  const d=psycheMap(SIX_DESIRES,defaultDesires({profitDrive}),desires||{});
  return {
    lifeId,name:name||lifeId,species,
    intelligence:Math.max(1,Math.floor(intelligence)),
    marketDimensions:allowed,
    capital:Math.max(0,Number(capital)||0),
    startingCapital:Math.max(0,Number(capital)||0),
    vitality:clamp(vitality,0,100),
    fear:e.fear,profitDrive:d.wealth,
    emotions:e,desires:d,
    positions:copy(positions),memory:[],memoryCapacity:Math.max(4,Math.floor(memoryCapacity)),
    state:isInactiveSourceSlot?'DEAD':'ALIVE',strategy:isInactiveSourceSlot?'HIDDEN':isWildEcology?'WILD_ECOLOGY':'HOLD',confidence:isInactiveSourceSlot?0:0.5,lastDecisionAt:0,
    growth:{experience:0,wins:0,losses:0,dimensionUnlocks:0},
    lifecycle:{diedAt:null,naiheAt:null,mengpoAt:null,rebornAt:null},
  };
}

export function perceiveMarketLife(life,{playerAxes={},quotes={},threat=0,escapeAvailable=true,now=Date.now()}={}){
  const visible={};
  for(const [axis,p] of Object.entries(playerAxes||{})){
    if(!p?.market||!life.marketDimensions.includes(p.market))continue;
    visible[axis]={market:p.market,side:p.side||null,lots:Number(p.lots)||0,c:Number(p.c)||0,pnl:Number(p.pnl)||0};
  }
  const perception={now,visiblePlayerAxes:visible,quotes:{},threat:clamp(threat,0,1),escapeAvailable:escapeAvailable!==false};
  for(const m of life.marketDimensions)if(Number.isFinite(Number(quotes?.[m])))perception.quotes[m]=Number(quotes[m]);
  return perception;
}

function exposureScore(perception){
  return Object.values(perception.visiblePlayerAxes||{}).reduce((s,p)=>s+Math.abs(Number(p.lots)||0)*Math.max(0.000001,Math.abs(Number(p.c)||0)),0);
}

export function psychePressure(life,perception={}){
  const capRatio=life.startingCapital>0?life.capital/life.startingCapital:0;
  const e=life.emotions||defaultEmotions({fear:life.fear,profitDrive:life.profitDrive});
  const d=life.desires||defaultDesires({profitDrive:life.profitDrive});
  const materialLoss=clamp(1-capRatio,0,1);
  const bodilyRisk=clamp(1-life.vitality/100,0,1);
  const externalThreat=clamp(perception.threat,0,1);
  const survival=clamp((bodilyRisk*.46+materialLoss*.24+externalThreat*.30)*(0.65+d.survival*.55)+e.fear*.28+e.sorrow*.10,0,1);
  const aggression=clamp(e.anger*.46+d.status*.20+e.aversion*.16+e.desire*.10-e.fear*.36-bodilyRisk*.22,0,1);
  const greed=clamp(d.wealth*.52+e.desire*.28+e.joy*.08-e.fear*.20,0,1);
  return {survival,aggression,greed,bodilyRisk,materialLoss,externalThreat};
}

export function decideMarketLife(life,perception,{random=()=>0.5}={}){
  if(life.state==='DEAD'||life.state==='NAIHE'||life.state==='MENGPO_RECOVERY')return decision(life,'HOLD',0,'LIFECYCLE_LOCK',perception.now);
  if(!life.marketDimensions.length)return decision(life,'HOLD',0,'UNMARKETED_WORLD_LIFE',perception.now);
  const p=psychePressure(life,perception);
  const seen=Object.values(perception.visiblePlayerAxes||{});
  const exposure=exposureScore(perception);
  let action='HOLD',reason='NO_PLAYER_EXPOSURE';
  if(p.survival>0.72&&perception.escapeAvailable!==false){action='RETREAT';reason='FEAR_OF_DEATH';}
  else if(p.survival>0.50){action=random()<0.68?'REDUCE':'HEDGE';reason='SELF_PRESERVATION';}
  else if(seen.length){
    const r=random();
    const intelligenceBias=clamp((life.intelligence-1)/8,0,0.65);
    if(seen.length>1&&life.marketDimensions.length>1&&r<intelligenceBias){action='REALLOCATE';reason='MULTI_MARKET_OPPORTUNITY';}
    else if(p.aggression>0.62&&r<0.62){action='OPPOSE';reason='ANGER_OR_RIVALRY';}
    else if(r<0.28+p.greed*.40){action='FOLLOW';reason='DESIRE_FOR_PROFIT';}
    else if(r<0.76){action='OPPOSE';reason='COUNTERPARTY_OPPORTUNITY';}
    else {action='HEDGE';reason='RISK_CONTROL';}
  }
  const confidence=clamp(0.34+life.intelligence*.055+Math.min(.2,exposure*.01)-p.survival*.28+p.aggression*.06,0.05,0.98);
  return decision(life,action,confidence,reason,perception.now,{psyche:p});
}

function decision(life,action,confidence,reason,now,extra={}){
  life.strategy=action;life.confidence=confidence;life.lastDecisionAt=now;
  return {lifeId:life.lifeId,action,confidence,reason,state:life.state,now,...extra};
}

export function applyMarketResult(life,{pnl=0,market=null,reason='MARKET_RESULT',now=Date.now()}={}){
  const value=Number(pnl)||0;
  life.capital=Math.max(0,life.capital+value);
  const loss=value<0?Math.abs(value):0;
  const gain=value>0?value:0;
  if(loss>0){
    const damage=clamp((loss/Math.max(1,life.startingCapital))*70,0,45);
    life.vitality=clamp(life.vitality-damage,0,100);life.growth.losses++;
    if(life.emotions){life.emotions.fear=clamp(life.emotions.fear+.12,0,1);life.emotions.sorrow=clamp(life.emotions.sorrow+.14,0,1);life.emotions.anger=clamp(life.emotions.anger+.08,0,1);life.emotions.joy=clamp(life.emotions.joy-.12,0,1);}
  }else if(gain>0){
    life.vitality=clamp(life.vitality+Math.min(5,gain/Math.max(1,life.startingCapital)*10),0,100);life.growth.wins++;
    if(life.emotions){life.emotions.joy=clamp(life.emotions.joy+.12,0,1);life.emotions.fear=clamp(life.emotions.fear-.06,0,1);life.emotions.desire=clamp(life.emotions.desire+.05,0,1);life.emotions.sorrow=clamp(life.emotions.sorrow-.05,0,1);}
  }
  if(life.emotions)life.fear=life.emotions.fear;
  if(life.desires)life.profitDrive=life.desires.wealth;
  life.growth.experience+=Math.abs(value);
  remember(life,{at:now,type:'MARKET_RESULT',market,pnl:value,reason,capital:life.capital,vitality:life.vitality,emotions:life.emotions?copy(life.emotions):null});
  if(life.capital<=0||life.vitality<=0){life.state='DEAD';life.lifecycle.diedAt=now;}
  else if(life.vitality<35)life.state='WOUNDED';
  else if(life.strategy==='RETREAT')life.state='RETREATING';
  else life.state='ALIVE';
  return snapshotMarketLife(life);
}

export function advanceMarketLifeCycle(life,{now=Date.now(),naiheDelayMs=1500,mengpoDelayMs=3000,rebirthDelayMs=8000}={}){
  if(life.state==='DEAD'&&life.lifecycle.diedAt!==null&&now-life.lifecycle.diedAt>=naiheDelayMs){life.state='NAIHE';life.lifecycle.naiheAt=now;remember(life,{at:now,type:'NAIHE_ENTER'});}
  if(life.state==='NAIHE'&&life.lifecycle.naiheAt!==null&&now-life.lifecycle.naiheAt>=mengpoDelayMs){
    life.state='MENGPO_RECOVERY';life.lifecycle.mengpoAt=now;
    if(life.emotions){life.emotions.anger=clamp(life.emotions.anger*.35,0,1);life.emotions.sorrow=clamp(life.emotions.sorrow*.35,0,1);life.emotions.fear=clamp(.2+life.emotions.fear*.25,0,1);life.fear=life.emotions.fear;}
    remember(life,{at:now,type:'MENGPO_RECOVERY'});
  }
  if(life.state==='MENGPO_RECOVERY'&&life.lifecycle.mengpoAt!==null&&now-life.lifecycle.mengpoAt>=rebirthDelayMs){
    life.state='REBIRTH';life.lifecycle.rebornAt=now;life.vitality=100;life.capital=Math.max(1,life.startingCapital*0.5);life.strategy='REENTER';
    if(life.emotions){life.emotions.joy=clamp(Math.max(life.emotions.joy,.45),0,1);life.emotions.sorrow=clamp(life.emotions.sorrow*.5,0,1);}
    remember(life,{at:now,type:'REBIRTH'});
  }
  if(life.state==='REBIRTH'){life.state='ALIVE';life.strategy='REENTER';}
  return snapshotMarketLife(life);
}

export function maybeGrowMarketLife(life,{availableMarkets=[]}={}){
  if(!life.marketDimensions.length)return {grown:false,life:snapshotMarketLife(life)};
  const threshold=50*Math.max(1,life.marketDimensions.length);
  if(life.growth.experience<threshold)return {grown:false,life:snapshotMarketLife(life)};
  const next=(availableMarkets||[]).find(m=>m&&!life.marketDimensions.includes(m));
  if(!next)return {grown:false,life:snapshotMarketLife(life)};
  life.marketDimensions.push(next);life.growth.dimensionUnlocks++;life.growth.experience-=threshold;life.intelligence++;
  if(life.desires)life.desires.curiosity=clamp(life.desires.curiosity+.08,0,1);
  remember(life,{at:Date.now(),type:'DIMENSION_UNLOCK',market:next,intelligence:life.intelligence});
  return {grown:true,unlockedMarket:next,life:snapshotMarketLife(life)};
}

export function remember(life,event){life.memory.push(copy(event));if(life.memory.length>life.memoryCapacity)life.memory.splice(0,life.memory.length-life.memoryCapacity);return life.memory.length;}
export function snapshotMarketLife(life){return copy(life);}
