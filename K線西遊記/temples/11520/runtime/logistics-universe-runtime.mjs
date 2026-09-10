/*
KGEN_META
VERSION: 1.0.0
REVISION: 2026-09-04.LOGISTICS-UNIVERSE
STATUS: ACTIVE / SIMULATION-FIRST
SOURCE_OF_TRUTH: LOGISTICS_UNIVERSE_SPEC.md
*/

export const LOGISTICS_ANCHOR=0.00011520;

export function universeLevel(price){
  const p=Number(price);
  if(!Number.isFinite(p)||p<=0)return {ok:false,level:null,label:'UNKNOWN'};
  const exponent=Math.floor(Math.log10(p));
  if(p<1)return {ok:true,level:Math.abs(exponent),exponent,label:`地下第 ${Math.abs(exponent)} 層宇宙`};
  return {ok:true,level:exponent,exponent,label:`第 ${exponent} 層宇宙`};
}

export function routeFromAnchor(destination,{anchor=LOGISTICS_ANCHOR}={}){
  const d=Number(destination),a=Number(anchor);
  if(!Number.isFinite(d)||!Number.isFinite(a)||d<=0||a<=0)return {ok:false,route:'UNKNOWN',side:0};
  if(Math.abs(d-a)<=Math.max(1e-18,a*1e-12))return {ok:true,route:'HOLD_ROUTE',side:0,label:'同層待命'};
  if(d>a)return {ok:true,route:'UP_ROUTE',side:1,label:'往上派貨 / 多向'};
  return {ok:true,route:'DOWN_ROUTE',side:-1,label:'往下派貨 / 空向'};
}

export function logisticsDecision({destination,anchor=LOGISTICS_ANCHOR,demand=0,capital=0,vitality=100,cargoCapacity=0,currentCargo=0}={}){
  const route=routeFromAnchor(destination,{anchor});
  if(!route.ok)return {action:'WAIT',reason:'INVALID_ROUTE',route};
  if(Number(vitality)<=15)return {action:'RETREAT',reason:'LOW_VITALITY',route};
  if(Number(capital)<=0)return {action:'RETURN',reason:'NO_CAPITAL',route};
  if(Number(demand)<=0)return {action:'WAIT',reason:'NO_DEMAND',route};
  if(Number(currentCargo)<=0&&Number(cargoCapacity)>0)return {action:'LOAD',reason:'DEMAND_PRESENT',route};
  return {action:route.route,reason:'ROUTE_READY',route};
}

export function makeLogisticsSnapshot(life,{price,destination,anchor=LOGISTICS_ANCHOR,demand=0,cargoCapacity=0,currentCargo=0}={}){
  const level=universeLevel(price),route=routeFromAnchor(destination,{anchor});
  return {
    lifeId:life?.lifeId||null,
    name:life?.name||null,
    species:life?.species||null,
    level,
    route,
    demand:Number(demand)||0,
    cargo:{current:Number(currentCargo)||0,capacity:Number(cargoCapacity)||0},
    capital:Number(life?.capital)||0,
    vitality:Number(life?.vitality)||0,
    simulation:true,
  };
}
