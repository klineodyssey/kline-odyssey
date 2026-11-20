/*
KGEN_META
VERSION: 1.2.0
VERSION_SCOPE: MARKET_LIFE_COMPONENT_ONLY; GAME_RELEASE_UNCHANGED
REVISION: 2026-10-06.LIVING-MARKET-LOCAL-PROTOTYPE
STATUS: ACTIVE / SIMULATION-FIRST
SOURCE_OF_TRUTH: MARKET_LIFE_AI_SPEC.md / LIVING_WORLD_ECOSYSTEM_SPEC.md / HUAGUOSHAN_TAIWAN_EXCHANGE_WHITEPAPER.md
CHANGE_REASON: Extend Market Life from combat-only strategy into work, travel, rest, social, exploration and retirement behavior while preserving survival, market and Naihe lifecycle semantics.
PROTOTYPE_SCOPE: Causal session prediction audit and opt-in NPC-only interactions; no scene, navigation or financial activation.
SOURCE_COMMIT: e26f3a76ef0be7f43058225f46def3fbe123371e
TASK_ID: K11520-LIVING-MARKET-ZONE-20261006
UPDATED_BY: dot / temporary Human-authorized engineering maintainer
REVIEWED_BY: PENDING_ROOT_REVIEW
*/

import {HOSTILE_MONSTER_SPECIES} from './monster-aggression-runtime.mjs';
import {getRealTradingBinding} from './real-trading-market-binding.mjs';

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
    growth:{experience:0,wins:0,losses:0,dimensionUnlocks:0,predictionCount:0,flat:0,streak:0},lifecycle:{diedAt:null,naiheAt:null,mengpoAt:null,rebornAt:null},
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

// Persistence of this owner's growth only, not a second score/reward ledger.
// Caller supplies the existing Player Life scoped store. Pending predictions,
// positions, capital, identity and execution authority are NEVER restored.
export function createTrainingMemory(storage){
  const key='k11520.market-life.training',records=new Map();
  let persisted=false;
  try{const data=JSON.parse(storage?.getItem(key)||'null');if(data?.scope==='LOCAL_GAME_OBSERVATIONS'&&Array.isArray(data.actors))for(const row of data.actors.slice(0,32)){
    const g=row?.growth,fields=['predictionCount','wins','losses','flat','streak','experience','dimensionUnlocks'];
    if(typeof row?.id!=='string'||!g||!fields.every(k=>Number.isSafeInteger(g[k])&&g[k]>=0)||g.predictionCount!==g.wins+g.losses+g.flat||g.experience!==g.wins||g.streak>g.wins)continue;
    records.set(row.id,{growth:Object.fromEntries(fields.map(k=>[k,g[k]]))});
  }persisted=!!data}catch{}
  return Object.freeze({
    restore(life){const saved=records.get(life.lifeId);if(saved)Object.assign(life.growth,saved.growth);return !!saved},
    save(life){
      const g=life.growth,growth=Object.fromEntries(['predictionCount','wins','losses','flat','streak','experience','dimensionUnlocks'].map(k=>[k,g[k]||0]));
      if(JSON.stringify(records.get(life.lifeId)?.growth)===JSON.stringify(growth))return persisted;
      records.set(life.lifeId,{growth});
      try{if(!storage)throw new Error('NO_STORAGE');storage.setItem(key,JSON.stringify({scope:'LOCAL_GAME_OBSERVATIONS',actors:[...records].slice(-32).map(([id,r])=>({id,...r}))}));persisted=true}catch{persisted=false}
      return persisted;
    },
    status:()=>({scope:'LOCAL_GAME_OBSERVATIONS',persisted,authority:'NON_FINANCIAL_UNTRUSTED_LOCAL_SAVE'})
  });
}

// These are bounded local teaching parameters, not Physics/vehicle constants.
export const LIVING_MARKET_TRAINING_RULES=Object.freeze({horizonMs:60000,maxGapMs:15000,auditLimit:128,bossEvidencePerStage:5});
const TRAINING_PROFILES=Object.freeze(['MOMENTUM','COUNTERTREND','CAUTIOUS','ADAPTIVE_BOSS']);
const INTERACTIONS=Object.freeze(['FOLLOW','ALLY','COMPETE','FLEE','ABSORB']);
const safeUnits=v=>Number.isSafeInteger(v)&&v>=0;
// Host provenance references are deliberately absent from serialized Life state.
// Cloning/loading a Life does not re-admit it or confer interaction capability.
const livingSourceContexts=new WeakMap();
function localFixtureContext(life,entity,sourceEventId,sourceClass){
  if(!entity||entity.marketLife!==life||entity.lifeId!==life.lifeId||entity.sourceManaged!==false||entity.simulationOnly!==true||
    entity.sourceMeta?.scope!=='LOCAL_GAME_NPC_ONLY'||entity.sourceMeta?.sourceEventId!==sourceEventId||
    (entity.sourceLifeId!=null&&entity.sourceLifeId!==life.lifeId))return false;
  const declared=entity.sourceMeta.sourceType??entity.sourceMeta.sourceClass;
  if(declared!==sourceClass||!['WORLD_EVENT','WILD_ECOLOGY'].includes(declared))return false;
  return [life,life.world,life.meta,entity,entity.meta,entity.sourceMeta].filter(Boolean).every(record=>
    !record.ownerPlayerId&&!record.ownerLandId&&!record.sourceManaged&&!record.mission&&!record.cargo&&
    !['PLAYER_OWNED','COLLECTED','IN_BACKPACK'].includes(record.state)&&
    [record.sourceType,record.sourceClass].every(type=>type==null||type===sourceClass));
}
function trainingState(life){
  if(!life.training)life.training={scope:'GAME_TRAINING_ONLY',lastAt:null,quotes:{},intent:null,pending:null};
  const t=life.training;
  if(!t.audit){
    // Old in-memory pending entries lack an issuance record and cannot be scored.
    t.pending=null;
    Object.assign(t,{dataStatus:'WAIT',reason:'WARMUP',source:null,batchKey:null,lastNow:null,sequence:0,predictionSequence:0,
      audit:[],droppedAuditEvents:0,policyGeneration:0,strategyBias:1,
      session:{issued:0,resolved:0,correct:0,wrong:0,flat:0,invalidated:0,streak:0,wrongStreak:0,
        score:0,peakScore:0,maxDrawdownPoints:0,calibrationCount:0,brierSum:0,
        bins:Array.from({length:5},()=>({count:0,correct:0,confidenceSum:0}))}});
  }
  return t;
}
function auditTraining(life,type,at,detail={}){
  const t=trainingState(life),event=Object.freeze({sequence:++t.sequence,type,at,lifeId:life.lifeId,scope:t.scope,...detail});
  t.audit.push(event);
  if(t.audit.length>LIVING_MARKET_TRAINING_RULES.auditLimit){t.audit.shift();t.droppedAuditEvents++}
  return event;
}
function invalidatePrediction(life,reason,at){
  const t=trainingState(life);
  if(t.pending){t.session.invalidated++;auditTraining(life,'PREDICTION_INVALIDATED',at,{predictionId:t.pending.id,reason});t.pending=null}
}
function unavailableTraining(life,status,reason,now){
  const t=trainingState(life);invalidatePrediction(life,reason,Number.isFinite(now)?now:null);
  t.intent=null;t.dataStatus=status;t.reason=reason;life.strategy='HOLD';life.confidence=null;
  // Preserve last-good evidence; a recovery warms up on two new batches.
  t.needsWarmup=true;return null;
}
function sessionConfidence(t){const n=t.session.correct+t.session.wrong;return n?t.session.correct/n:null}
function settleTrainingPrediction(life,result,at){
  const t=trainingState(life),p=t.pending,s=t.session,g=life.growth;
  const change=Math.sign(result.price-p.price),outcome=change===0?'FLAT':change===p.sign?'CORRECT':'WRONG';
  s.resolved++;g.predictionCount=(g.predictionCount||0)+1;
  if(outcome==='FLAT'){s.flat++;g.flat=(g.flat||0)+1;s.streak=0;s.wrongStreak=0;g.streak=0}
  else if(outcome==='CORRECT'){s.correct++;s.streak++;s.wrongStreak=0;s.score++;g.wins++;g.streak=(g.streak||0)+1;g.experience++}
  else{s.wrong++;s.wrongStreak++;s.streak=0;s.score--;g.losses++;g.streak=0}
  s.peakScore=Math.max(s.peakScore,s.score);s.maxDrawdownPoints=Math.max(s.maxDrawdownPoints,s.peakScore-s.score);
  if(change!==0&&Number.isFinite(p.confidence)){
    const actual=outcome==='CORRECT'?1:0,bin=s.bins[Math.min(4,Math.floor(p.confidence*5))];
    s.calibrationCount++;s.brierSum+=(p.confidence-actual)**2;bin.count++;bin.correct+=actual;bin.confidenceSum+=p.confidence;
  }
  const event=auditTraining(life,'PREDICTION_SETTLED',at,{predictionId:p.id,market:p.market,axis:p.axis,source:p.source,
    entryAt:p.entryAt,issuedAt:p.issuedAt,deadline:p.deadline,exitAt:at,settlementDelayMs:at-p.deadline,
    sign:p.sign,entry:p.price,exit:result.price,confidenceAtIssue:p.confidence,outcome,score:s.score});
  remember(life,{...event,type:'GAME_PREDICTION_RESULT'});t.pending=null;
  if(life.livingMarket?.profile==='ADAPTIVE_BOSS'&&s.wrongStreak>0&&s.wrongStreak%2===0){
    t.strategyBias*=-1;t.policyGeneration++;
    auditTraining(life,'BOSS_POLICY_ADAPTED',at,{reason:'TWO_RESOLVED_ERRORS',strategyBias:t.strategyBias,
      policyGeneration:t.policyGeneration,evidencePredictionId:p.id,simulationOnly:true});
  }
}

// Existing observer remains the only training engine. Source time is explicitly
// HOST_RECEIVED_AT, not exchange time, authenticated truth, or an execution oracle.
export function observeTrainingMarket(life,market,{now=Date.now(),contrarian=false}={}){
  const t=trainingState(life),rules=LIVING_MARKET_TRAINING_RULES;
  if(!['ALIVE','WOUNDED','RETREATING'].includes(life.state))return unavailableTraining(life,'WAIT','LIFECYCLE_LOCK',now);
  if(!Number.isSafeInteger(now)||now<0||!Number.isSafeInteger(market?.receivedAt)||market.receivedAt<0||market.receivedAt>Number.MAX_SAFE_INTEGER-rules.horizonMs)
    return unavailableTraining(life,market?.status==='WAIT'?'WAIT':'INVALID','INVALID_OBSERVATION_TIME',now);
  if(now<market.receivedAt||(t.lastNow!==null&&now<t.lastNow))return unavailableTraining(life,'INVALID','CLOCK_REGRESSION_OR_FUTURE_OBSERVATION',now);
  t.lastNow=now;
  if(market.status!=='LIVE')return unavailableTraining(life,market.status==='STALE'?'STALE':market.status==='WAIT'?'WAIT':'INVALID','SOURCE_NOT_LIVE',now);
  if(now-market.receivedAt>rules.maxGapMs)return unavailableTraining(life,'STALE','OBSERVATION_EXPIRED',now);
  if(!Array.isArray(market.markets))return unavailableTraining(life,'INVALID','MALFORMED_BATCH',now);
  if(market.source!=null&&(typeof market.source!=='string'||!market.source.trim()))return unavailableTraining(life,'INVALID','INVALID_SOURCE',now);
  const rows=market.markets.filter(r=>life.marketDimensions.includes(r?.symbol));
  const seen=new Set();
  if(!rows.length||rows.some(r=>!Number.isFinite(r.price)||r.price<=0||!['KX','KY','KZ'].includes(r.axis)||seen.has(r.symbol)||!seen.add(r.symbol))||
    life.marketDimensions.some(symbol=>!seen.has(symbol)))return unavailableTraining(life,'INVALID','INCOMPLETE_OR_INVALID_BATCH',now);
  // Reuse only the existing pure identity lookup. This does not consult or
  // grant trading eligibility, provenance, chain, wallet or execution authority.
  if(rows.some(r=>getRealTradingBinding(r.axis).market!==r.symbol))return unavailableTraining(life,'INVALID','AXIS_MARKET_BINDING_MISMATCH',now);
  const source=typeof market.source==='string'&&market.source.trim()?market.source:'UNSPECIFIED_REFERENCE';
  const batchKey=JSON.stringify(rows.map(r=>[r.symbol,r.axis,r.price]).sort((a,b)=>a[0].localeCompare(b[0])));
  if(t.lastAt!==null&&market.receivedAt<=t.lastAt){
    if(market.receivedAt===t.lastAt&&source===t.source&&batchKey===t.batchKey)return t.intent;
    return unavailableTraining(life,'INVALID','REPLAY_OR_CONFLICTING_OBSERVATION',now);
  }
  const sourceChanged=t.source!==null&&t.source!==source;
  const axisChanged=rows.some(r=>t.axisBindings?.[r.symbol]&&t.axisBindings[r.symbol]!==r.axis);
  const pendingMarketMissing=t.pending&&!rows.some(r=>r.symbol===t.pending.market);
  const gap=t.lastAt===null?Infinity:market.receivedAt-t.lastAt;
  if(sourceChanged||axisChanged||pendingMarketMissing||gap>rules.maxGapMs){
    invalidatePrediction(life,sourceChanged?'SOURCE_CHANGED':axisChanged?'AXIS_BINDING_CHANGED':pendingMarketMissing?'MARKET_CAPABILITY_CHANGED':'OBSERVATION_GAP',now);t.needsWarmup=true;
  }
  const warmup=t.needsWarmup||rows.some(r=>!(t.quotes[r.symbol]>0));
  const signals=rows.map(r=>({...r,change:warmup?0:r.price/t.quotes[r.symbol]-1})).sort((a,b)=>Math.abs(b.change)-Math.abs(a.change)||a.symbol.localeCompare(b.symbol));
  if(signals.some(r=>!Number.isFinite(r.change)))return unavailableTraining(life,'INVALID','INVALID_SIGNAL_ARITHMETIC',now);
  if(t.pending&&market.receivedAt>=t.pending.deadline)settleTrainingPrediction(life,rows.find(r=>r.symbol===t.pending.market),market.receivedAt);
  const selected=signals[0],profile=life.livingMarket?.profile||(contrarian?'COUNTERTREND':'MOMENTUM');
  const bias=profile==='COUNTERTREND'?-1:profile==='ADAPTIVE_BOSS'?t.strategyBias:1;
  const cautious=profile==='CAUTIOUS'&&Math.abs(selected.change)<(life.livingMarket?.signalThreshold??0.001);
  const sign=warmup||cautious?0:Math.sign(selected.change)*bias,confidence=sessionConfidence(t);
  const reason=warmup?'WARMUP':cautious?'BELOW_GAME_SIGNAL_THRESHOLD':sign===0?'NO_PRICE_CHANGE':bias<0?'LOCAL_COUNTERTREND':'LOCAL_MOMENTUM';
  t.dataStatus=warmup?'WAIT':'LIVE';t.reason=reason;t.source=source;
  t.intent=Object.freeze({scope:t.scope,status:t.dataStatus,market:selected.symbol,axis:selected.axis,
    direction:sign>0?'LONG':sign<0?'SHORT':'NEUTRAL',decision:sign>0?'LONG':sign<0?'SHORT':'WAIT',sign,confidence,fitness:confidence,
    confidenceKind:'EMPIRICAL_SESSION_HIT_RATE_NOT_FORECAST_PROBABILITY',confidenceSamples:t.session.correct+t.session.wrong,
    at:market.receivedAt,issuedAt:now,source,timeBasis:'HOST_RECEIVED_AT',sourceTimestamp:null,reason,signalChange:selected.change,
    policyGeneration:t.policyGeneration,fullGA600:'NOT_INTEGRATED'});
  if(!t.pending&&sign){
    t.pending=Object.freeze({id:`${life.lifeId}:P${++t.predictionSequence}`,market:selected.symbol,axis:selected.axis,price:selected.price,sign,
      entryAt:market.receivedAt,issuedAt:now,deadline:market.receivedAt+rules.horizonMs,source,confidence,
      confidenceSamples:t.session.correct+t.session.wrong,policyGeneration:t.policyGeneration});
    t.session.issued++;auditTraining(life,'PREDICTION_ISSUED',now,{...t.pending,predictionId:t.pending.id,timeBasis:'HOST_RECEIVED_AT'});
  }
  t.lastAt=market.receivedAt;t.batchKey=batchKey;t.quotes=Object.fromEntries(rows.map(r=>[r.symbol,r.price]));
  t.axisBindings=Object.fromEntries(rows.map(r=>[r.symbol,r.axis]));t.needsWarmup=false;
  life.strategy=sign?'FOLLOW':'HOLD';life.confidence=confidence;life.lastDecisionAt=now;
  return t.intent;
}

// Read-only presentation contract. It never writes a target, vector, C, XYZ,
// player control, position, order, quote source or wallet balance.
export function livingMarketDecisionSnapshot(life,{now=Date.now()}={}){
  const t=life.training,hasSession=!!t?.session,expired=!Number.isFinite(now)||!Number.isFinite(t?.lastAt)||now<t.lastAt||now-t.lastAt>LIVING_MARKET_TRAINING_RULES.maxGapMs;
  const lifecycleLocked=!['ALIVE','WOUNDED','RETREATING'].includes(life.state);
  const clockInvalid=!safeUnits(now)||(t?.lastNow!=null&&now<t.lastNow)||(t?.intent?.issuedAt!=null&&now<t.intent.issuedAt);
  const status=clockInvalid?'INVALID':lifecycleLocked?'WAIT':expired?(t?.lastAt==null?'WAIT':'STALE'):(t?.dataStatus||'WAIT');
  const intent=status==='LIVE'?t?.intent:null,s=hasSession?t.session:null;
  const choice=intent?.decision||'WAIT';
  const speedFactor=choice==='WAIT'?0:Math.min(1,Math.abs(intent.signalChange)*100)*clamp(life.vitality/100,0,1)*(intent.confidence??0.5);
  return copy({lifeId:life.lifeId,scope:'GAME_TRAINING_ONLY',status,decision:choice,market:intent?.market||null,axis:intent?.axis||null,
    reason:clockInvalid?'CLOCK_REGRESSION_OR_INVALID_CLOCK':lifecycleLocked?'LIFECYCLE_LOCK':expired?'NO_FRESH_OBSERVATION':t?.reason||'WARMUP',confidence:intent?.confidence??null,confidenceSamples:intent?.confidenceSamples||0,
    source:t?.source||null,timeBasis:'HOST_RECEIVED_AT',sourceTimestamp:null,
    goal:{kind:choice==='WAIT'?'OBSERVE_WAIT':'OBSERVE_MARKET',market:intent?.market||null,sign:intent?.sign||0},
    motion:{status:'NAVIGATION_DEPENDENCY_REQUIRED',requestedSpeedFactor:speedFactor,advisoryOnly:true,controlsPlayer:false,movesCoordinates:false},
    fullGA600:'NOT_INTEGRATED',automatesTrading:false,profitPromise:false,
    sessionMetrics:s?{scope:'CURRENT_SESSION_ONLY',issued:s.issued,predictions:s.resolved,correct:s.correct,wrong:s.wrong,flat:s.flat,invalidated:s.invalidated,
      streak:s.streak,scorePoints:s.score,peakScorePoints:s.peakScore,maxDrawdownPoints:s.maxDrawdownPoints,
      scoreDefinition:'CORRECT +1 / WRONG -1 / FLAT 0; NOT PNL OR MONEY',
      calibration:{kind:'EMPIRICAL_HIT_RATE_DIAGNOSTIC',samples:s.calibrationCount,brier:s.calibrationCount?s.brierSum/s.calibrationCount:null,
        excludes:'FLAT_OUTCOMES_AND_UNMEASURED_CONFIDENCE',bins:s.bins.map((b,i)=>({lower:i/5,upper:(i+1)/5,samples:b.count,
          confidence:b.count?b.confidenceSum/b.count:null,accuracy:b.count?b.correct/b.count:null}))}}:null,
    persistedGrowth:{...life.growth,scope:'UNTRUSTED_LOCAL_GROWTH_NOT_SESSION_CALIBRATION'},
    boss:life.livingMarket?.profile==='ADAPTIVE_BOSS'?{scope:'SIMULATION_NPC_ONLY',evidenceStage:1+Math.floor((s?.resolved||0)/LIVING_MARKET_TRAINING_RULES.bossEvidencePerStage),
      policyGeneration:t?.policyGeneration||0,strategyBias:t?.strategyBias||1,affectsRealMarket:false}:null,
    audit:{events:t?.audit||[],droppedEvents:t?.droppedAuditEvents||0,completeSessionWindow:!(t?.droppedAuditEvents>0),persisted:false,
      authority:'UNTRUSTED_LOCAL_OBSERVATIONS'},pending:t?.pending||null});
}

// Explicit, inert fixture admission. Existing species/ownership are preserved.
// This opt-in game pool has abstract integer units, no KGEN/KAIOS/token meaning.
export function configureLivingMarketLife(life,{sourceEntity,sourceEventId,sourceClass='WORLD_EVENT',profile='MOMENTUM',energyUnits=0,massUnits=0,signalThreshold=0.001,allowAbsorption=false}={}){
  if(!life||!HOSTILE_MONSTER_SPECIES.includes(life.species)||life.ownerPlayerId||life.ownerLandId||life.sourceManaged||life.cargo||
    life.sourceClass==='PLAYER_OWNED'||life.sourceType==='PLAYER_OWNED'||life.mission)return {ok:false,reason:'ONLY_UNOWNED_LOCAL_MONSTER_FIXTURES'};
  if(life.livingMarket)return {ok:false,reason:'ALREADY_CONFIGURED'};
  if(life.training?.lastAt!=null)return {ok:false,reason:'FRESH_FIXTURE_REQUIRED'};
  if(typeof sourceEventId!=='string'||!sourceEventId.trim()||!['WORLD_EVENT','WILD_ECOLOGY'].includes(sourceClass)||!TRAINING_PROFILES.includes(profile)||
    !safeUnits(energyUnits)||!safeUnits(massUnits)||!Number.isFinite(signalThreshold)||signalThreshold<0||signalThreshold>1)
    return {ok:false,reason:'INVALID_LOCAL_GAME_CONFIGURATION'};
  if(!localFixtureContext(life,sourceEntity,sourceEventId,sourceClass))return {ok:false,reason:'HOST_LOCAL_FIXTURE_CONTEXT_REQUIRED'};
  life.livingMarket={scope:'LOCAL_GAME_NPC_ONLY',sourceEventId,sourceClass,profile,signalThreshold,energyUnits,massUnits,
    allowAbsorption:allowAbsorption===true,revision:0,lastInteractionSequence:0,lastInteractionAt:null,relation:'OBSERVE',events:[]};
  livingSourceContexts.set(life,sourceEntity);
  return {ok:true,scope:'LOCAL_GAME_NPC_ONLY',activatedInWorld:false};
}

// Clones are deliberately not admitted; a future preview must revalidate host
// context and construct fresh fixtures. The host supplies a reviewed, one-step
// pair/revision-bound local capability; this is not security
// against DevTools and cannot authorize another owner's financial/cargo state.
export function interactLivingMarketLives(actor,target,{action,sequence,actorRevision,targetRevision,energyUnits=0,massUnits=0,capability,now=Date.now()}={}){
  const a=actor?.livingMarket,b=target?.livingMarket,deny=reason=>({ok:false,reason});
  if(!a||!b||a.scope!=='LOCAL_GAME_NPC_ONLY'||b.scope!=='LOCAL_GAME_NPC_ONLY'||actor.lifeId===target.lifeId)return deny('LOCAL_NPC_PAIR_REQUIRED');
  if([actor,target].some(l=>!HOSTILE_MONSTER_SPECIES.includes(l.species)||
    !localFixtureContext(l,livingSourceContexts.get(l),l.livingMarket.sourceEventId,l.livingMarket.sourceClass)))return deny('OWNED_OR_SOURCE_MANAGED_LIFE_DENIED');
  if(!INTERACTIONS.includes(action)||!Number.isSafeInteger(now)||now<0)return deny('INVALID_INTERACTION');
  if(!['ALIVE','WOUNDED','RETREATING'].includes(actor.state)||(!['ALIVE','WOUNDED','RETREATING'].includes(target.state)&&!(action==='ABSORB'&&target.state==='DEAD')))return deny('LIFECYCLE_LOCK');
  if([a,b].some(pool=>!safeUnits(pool.energyUnits)||!safeUnits(pool.massUnits)||!safeUnits(pool.revision)||pool.revision>=Number.MAX_SAFE_INTEGER||
    !safeUnits(pool.lastInteractionSequence)||pool.lastInteractionSequence>=Number.MAX_SAFE_INTEGER||
    (pool.lastInteractionAt!==null&&(!safeUnits(pool.lastInteractionAt)||now<pool.lastInteractionAt))))return deny('INVALID_OR_STALE_GAME_STATE');
  const c=capability;
  if(!c||c.scope!=='LOCAL_GAME_NPC_INTERACTION'||c.actorLifeId!==actor.lifeId||c.targetLifeId!==target.lifeId||
    c.actorSourceEventId!==a.sourceEventId||c.targetSourceEventId!==b.sourceEventId||!Array.isArray(c.actions)||!c.actions.includes(action)||
    !Number.isFinite(c.issuedAt)||!Number.isFinite(c.expiresAt)||now<c.issuedAt||now>=c.expiresAt||!safeUnits(c.maxEnergyUnits)||!safeUnits(c.maxMassUnits))return deny('LOCAL_CAPABILITY_REQUIRED');
  if(!Number.isSafeInteger(sequence)||sequence!==a.lastInteractionSequence+1||actorRevision!==a.revision||targetRevision!==b.revision)return deny('REPLAY_OR_STALE_REVISION');
  if(c.sequence!==sequence||c.actorRevision!==a.revision||c.targetRevision!==b.revision)return deny('CAPABILITY_ALREADY_USED_OR_STALE');
  if(!safeUnits(energyUnits)||!safeUnits(massUnits)||energyUnits>c.maxEnergyUnits||massUnits>c.maxMassUnits)return deny('INVALID_GAME_UNITS');
  if(action!=='ABSORB'&&(energyUnits!==0||massUnits!==0))return deny('NON_TRANSFER_ACTION');
  if(action==='ABSORB'&&(!b.allowAbsorption||energyUnits>b.energyUnits||massUnits>b.massUnits||!safeUnits(a.energyUnits+energyUnits)||!safeUnits(a.massUnits+massUnits)))return deny('ABSORPTION_CAPABILITY_OR_POOL_LIMIT');
  if(action==='ABSORB'){a.energyUnits+=energyUnits;b.energyUnits-=energyUnits;a.massUnits+=massUnits;b.massUnits-=massUnits}
  a.lastInteractionSequence=sequence;a.revision++;b.revision++;a.lastInteractionAt=now;b.lastInteractionAt=now;
  a.relation=action;b.relation=action==='ALLY'?'ALLY':action==='COMPETE'?'COMPETE':b.relation;
  const event=Object.freeze({id:`${actor.lifeId}:I${sequence}`,sequence,action,actorLifeId:actor.lifeId,targetLifeId:target.lifeId,
    sourceEventId:a.sourceEventId,targetSourceEventId:b.sourceEventId,at:now,energyUnits,massUnits,scope:'LOCAL_GAME_NPC_ONLY',
    movesCoordinates:false,changesOwnership:false,changesWallet:false,changesMarketPrices:false});
  for(const pool of [a,b]){pool.events.push(event);if(pool.events.length>32)pool.events.shift()}
  return {ok:true,event,actorRevision:a.revision,targetRevision:b.revision};
}

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
