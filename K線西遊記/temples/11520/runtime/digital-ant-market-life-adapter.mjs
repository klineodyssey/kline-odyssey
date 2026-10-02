/*
KGEN_META
VERSION: 1.1.0
REVISION: 2026-10-03.DIGITAL-ANT-MARKET-GUARDIAN-ADAPTER
STATUS: ACTIVE
PURPOSE: Let Digital Ant / Exchange Brain logistics publish visible Market Life into 11520 without treating physical movement as a market order.
*/

import {publishMarketLifeSourceEvent} from './market-life-source-runtime.mjs';

function axisPositions({axis='KY',market='BTCUSDT',side=1,lots=1,c=.001,pnl=0}={}){
  if(Number(side)!==1&&Number(side)!==-1)return {};
  return {[axis]:{market,side,lots,c,pnl}};
}

function visualSpecies(ant){return ant?.vehicle?.type==='ATM_UFO_5D'?'DIGITAL_ANT_ATM_UFO':ant?.species||'DIGITAL_ANT'}
function sourceMeta(ant){return {role:ant.role||null,origin:'DIGITAL_ANT_ADAPTER',vehicle:ant.vehicle||null,cargoLootable:false,playerAssetTheft:false,physicalRouteIsMarketOrder:false,motionAuthority:'DIGITAL_ANT_LOGISTICS_RUNTIME'}}

export function publishDigitalAntSpawn(ant,{sourceId='DIGITAL-ANT-EXCHANGE-BRAIN',axis='KY',market='BTCUSDT',side=0,lots=0,c=0,mission=null,route=null}={}){
  if(!ant?.lifeId)throw new Error('DIGITAL_ANT_LIFE_ID_REQUIRED');
  return publishMarketLifeSourceEvent({
    type:'SPAWN',sourceId,lifeId:ant.lifeId,name:ant.name||'Digital Ant',species:visualSpecies(ant),
    intelligence:ant.intelligence||3,markets:[market],capital:ant.capital??20,vitality:ant.vitality??100,
    maxHp:100,attack:4,speed:.02,rewardKaios:0,positions:axisPositions({axis,market,side,lots,c}),
    x:ant.x??0,y:ant.y??0,z:ant.z??0,strategy:ant.state||'LOGISTICS',mission:mission||ant.mission||null,
    cargo:ant.cargo||null,route:route||ant.mission?.route||null,meta:sourceMeta(ant),
  });
}

export function publishDigitalAntUpdate(ant,{sourceId='DIGITAL-ANT-EXCHANGE-BRAIN',axis='KY',market='BTCUSDT',side=0,lots=0,c=0}={}){
  if(!ant?.lifeId)throw new Error('DIGITAL_ANT_LIFE_ID_REQUIRED');
  return publishMarketLifeSourceEvent({
    type:'UPDATE',sourceId,lifeId:ant.lifeId,name:ant.name||'Digital Ant',species:visualSpecies(ant),
    intelligence:ant.intelligence||3,markets:[market],capital:ant.capital??20,vitality:ant.vitality??100,
    maxHp:100,attack:4,speed:.02,rewardKaios:0,positions:axisPositions({axis,market,side,lots,c}),
    x:ant.x??0,y:ant.y??0,z:ant.z??0,strategy:ant.state||'LOGISTICS',mission:ant.mission||null,cargo:ant.cargo||null,
    route:ant.mission?.route||null,meta:sourceMeta(ant),
  });
}

export function publishDigitalAntDespawn(ant,{sourceId='DIGITAL-ANT-EXCHANGE-BRAIN',reason='MISSION_COMPLETE'}={}){
  if(!ant?.lifeId)throw new Error('DIGITAL_ANT_LIFE_ID_REQUIRED');
  return publishMarketLifeSourceEvent({type:'DESPAWN',sourceId,lifeId:ant.lifeId,reason});
}
