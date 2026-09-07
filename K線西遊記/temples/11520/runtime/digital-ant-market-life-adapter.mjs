/*
KGEN_META
VERSION: 1.0.0
REVISION: 2026-09-04.DIGITAL-ANT-MARKET-LIFE-ADAPTER
STATUS: ACTIVE
PURPOSE: Let Digital Ant / Exchange Brain logistics publish visible Market Life into 11520.
*/

import {publishMarketLifeSourceEvent} from './market-life-source-runtime.mjs';

function axisPositions({axis='KY',market='BTCUSDT',side=1,lots=1,c=.001,pnl=0}={}){
  return {[axis]:{market,side,lots,c,pnl}};
}

export function publishDigitalAntSpawn(ant,{sourceId='DIGITAL-ANT-EXCHANGE-BRAIN',axis='KY',market='BTCUSDT',side=1,lots=1,c=.001,mission=null,route=null}={}){
  if(!ant?.lifeId)throw new Error('DIGITAL_ANT_LIFE_ID_REQUIRED');
  return publishMarketLifeSourceEvent({
    type:'SPAWN',sourceId,lifeId:ant.lifeId,name:ant.name||'Digital Ant',species:ant.species||'DIGITAL_ANT',
    intelligence:ant.intelligence||3,markets:[market],capital:ant.capital??20,vitality:ant.vitality??100,
    maxHp:100,attack:4,speed:.02,rewardKaios:0,positions:axisPositions({axis,market,side,lots,c}),
    x:ant.x??0,y:ant.y??0,z:ant.z??0,strategy:ant.state||'LOGISTICS',mission:mission||ant.mission||null,
    cargo:ant.cargo||null,route:route||ant.mission?.route||null,meta:{role:ant.role||null,origin:'DIGITAL_ANT_ADAPTER'},
  });
}

export function publishDigitalAntUpdate(ant,{sourceId='DIGITAL-ANT-EXCHANGE-BRAIN',axis='KY',market='BTCUSDT',side=1,lots=1,c=.001}={}){
  if(!ant?.lifeId)throw new Error('DIGITAL_ANT_LIFE_ID_REQUIRED');
  return publishMarketLifeSourceEvent({
    type:'UPDATE',sourceId,lifeId:ant.lifeId,name:ant.name||'Digital Ant',species:ant.species||'DIGITAL_ANT',
    intelligence:ant.intelligence||3,markets:[market],capital:ant.capital??20,vitality:ant.vitality??100,
    maxHp:100,attack:4,speed:.02,rewardKaios:0,positions:axisPositions({axis,market,side,lots,c}),
    x:ant.x??0,y:ant.y??0,z:ant.z??0,strategy:ant.state||'LOGISTICS',mission:ant.mission||null,cargo:ant.cargo||null,
    route:ant.mission?.route||null,meta:{role:ant.role||null,origin:'DIGITAL_ANT_ADAPTER'},
  });
}

export function publishDigitalAntDespawn(ant,{sourceId='DIGITAL-ANT-EXCHANGE-BRAIN',reason='MISSION_COMPLETE'}={}){
  if(!ant?.lifeId)throw new Error('DIGITAL_ANT_LIFE_ID_REQUIRED');
  return publishMarketLifeSourceEvent({type:'DESPAWN',sourceId,lifeId:ant.lifeId,reason});
}
