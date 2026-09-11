/*
KGEN_META
VERSION: 1.0.0
REVISION: 2026-09-04.MARKET-RELATION-ENGINE
STATUS: ACTIVE
SOURCE_OF_TRUTH: MARKET_LIFE_AI_SPEC.md
CHANGE_REASON: Render KX/KY/KZ direction relationships as living-world relations and animation intents.
*/

export const RELATION = Object.freeze({ALIGNED:'ALIGNED',OPPOSED:'OPPOSED',NEUTRAL:'NEUTRAL'});
export const RELATION_ANIMATION = Object.freeze({
  ALIGNED:'TRAVEL_TOGETHER',
  OPPOSED:'MARKET_DUEL_WAIT_SETTLEMENT',
  NEUTRAL:'OBSERVE',
  MIXED:'MULTI_DIMENSION_TENSION',
});

export function normalizeSide(side){
  const s=String(side??'').trim().toUpperCase();
  if(['+','LONG','BUY','1'].includes(s))return 1;
  if(['-','SHORT','SELL','-1'].includes(s))return -1;
  return 0;
}

export function relationForAxis(playerPosition,lifePosition){
  const p=normalizeSide(playerPosition?.side),m=normalizeSide(lifePosition?.side);
  if(!p||!m)return RELATION.NEUTRAL;
  return p===m?RELATION.ALIGNED:RELATION.OPPOSED;
}

export function deriveMarketRelations({playerAxes={},lifePositions={}}={}){
  const axes=['KX','KY','KZ'];
  const byAxis={};let aligned=0,opposed=0,neutral=0;
  for(const axis of axes){
    const player=playerAxes[axis]||null;
    const life=lifePositions[axis]||null;
    const relation=relationForAxis(player,life);
    if(relation===RELATION.ALIGNED)aligned++;
    else if(relation===RELATION.OPPOSED)opposed++;
    else neutral++;
    byAxis[axis]={axis,relation,playerSide:normalizeSide(player?.side),lifeSide:normalizeSide(life?.side),playerMarket:player?.market||null,lifeMarket:life?.market||null};
  }
  const overall=opposed&&aligned?'MIXED':opposed?'OPPOSED':aligned?'ALIGNED':'NEUTRAL';
  return {byAxis,counts:{aligned,opposed,neutral},overall,animationIntent:RELATION_ANIMATION[overall]};
}

export function animationIntentForRelations(relations,{settlement=null}={}){
  if(relations.overall==='OPPOSED'){
    if(!settlement)return {state:'DUEL_READY',clip:'combat_idle',lockedToMarketSettlement:true};
    if(settlement.winner==='PLAYER')return {state:'PLAYER_WIN',clip:'attack',counterpartyClip:'hit',lockedToMarketSettlement:false};
    if(settlement.winner==='LIFE')return {state:'LIFE_WIN',clip:'hit',counterpartyClip:'attack',lockedToMarketSettlement:false};
    return {state:'DUEL_DRAW',clip:'combat_idle',lockedToMarketSettlement:false};
  }
  if(relations.overall==='ALIGNED')return {state:'COMPANION_TRAVEL',clip:'walk',formation:'SIDE_BY_SIDE',lockedToMarketSettlement:false};
  if(relations.overall==='MIXED')return {state:'MULTI_AXIS_TENSION',clip:'combat_idle',formation:'DYNAMIC',lockedToMarketSettlement:true};
  return {state:'OBSERVE',clip:'idle',lockedToMarketSettlement:false};
}

// Market settlement is deliberately an input. Animation never invents a winner.
export function applySettlementToRelation(relations,settlement){
  if(!settlement||!['PLAYER','LIFE','DRAW'].includes(settlement.winner))throw new Error('MARKET_SETTLEMENT_REQUIRED');
  return {...relations,settlement:{...settlement},animation:animationIntentForRelations(relations,{settlement})};
}
