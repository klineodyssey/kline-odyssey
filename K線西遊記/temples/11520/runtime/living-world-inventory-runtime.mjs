/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE
PURPOSE: Atomic capture/release bridge between wild ecology and the player backpack.
*/

import {backpackSnapshot,removeItem,storeItem,storeLivingLife} from './backpack-runtime.mjs';
import {collectWildLife,releaseToLand} from './wild-ecology-source-runtime.mjs';

export const LIVING_WORLD_INVENTORY_VERSION='11520-LIVING-WORLD-INVENTORY-V1';

function restoreWild(life,previous){
  Object.assign(life,previous);
}

export function captureLifeToBackpack({ecology,backpack,lifeId,weightEach=1}={}){
  if(!ecology||!backpack)return {ok:false,reason:'ECOSYSTEM_AND_BACKPACK_REQUIRED'};
  const life=ecology.lives?.find(v=>v.lifeId===lifeId);
  if(!life)return {ok:false,reason:'LIFE_NOT_FOUND'};
  const before={state:life.state,ownerLandId:life.ownerLandId,x:life.x,y:life.y,z:life.z,homeX:life.homeX,homeZ:life.homeZ};
  const collected=collectWildLife(ecology,lifeId);
  if(!collected.ok)return collected;
  const stored=storeLivingLife(backpack,life,{weightEach});
  if(!stored.ok){restoreWild(life,before);return {...stored,rolledBack:true};}
  life.state='IN_BACKPACK';
  return {ok:true,life,item:stored.item,backpack:backpackSnapshot(backpack)};
}

export function releaseLifeFromBackpack({ecology,backpack,itemId,landId,x=0,z=0}={}){
  if(!ecology||!backpack)return {ok:false,reason:'ECOSYSTEM_AND_BACKPACK_REQUIRED'};
  const item=backpack.items?.find(v=>v.itemId===itemId);
  if(!item)return {ok:false,reason:'ITEM_NOT_FOUND'};
  if(item.kind!=='LIVING_CARGO'||!item.lifeId)return {ok:false,reason:'ITEM_NOT_LIVING_CARGO'};
  const life=ecology.lives?.find(v=>v.lifeId===item.lifeId);
  if(!life)return {ok:false,reason:'LIFE_NOT_FOUND'};
  const before={state:life.state,ownerLandId:life.ownerLandId,x:life.x,y:life.y,z:life.z,homeX:life.homeX,homeZ:life.homeZ};
  const released=releaseToLand(ecology,life.lifeId,{landId,x,z});
  if(!released.ok)return released;
  const removed=removeItem(backpack,itemId,1);
  if(!removed.ok){restoreWild(life,before);return {...removed,rolledBack:true};}
  return {ok:true,life,removed:removed.removed,backpack:backpackSnapshot(backpack)};
}

export function collectTreasureToBackpack({backpack,treasure}={}){
  if(!backpack)return {ok:false,reason:'BACKPACK_REQUIRED'};
  const t=treasure||{};
  return storeItem(backpack,{
    kind:'TREASURE',
    itemId:t.itemId,
    name:t.name||'未知寶物',
    qty:t.qty||1,
    weightEach:t.weightEach??0.5,
    treasureClass:t.treasureClass||'COMMON',
    stackable:t.stackable!==false,
    meta:t.meta||{},
  });
}

export function nearestCollectableLife(ecology,{x=0,z=0,maxDistance=3}={}){
  let best=null,bestD=Infinity;
  for(const life of ecology?.lives||[]){
    if(life.state!=='WILD'||life.collectable!==true)continue;
    const d=Math.hypot((life.x||0)-x,(life.z||0)-z);
    if(d<=maxDistance&&d<bestD){best=life;bestD=d;}
  }
  return best?{ok:true,life:best,distance:bestD}:{ok:false,reason:'NO_COLLECTABLE_LIFE_NEARBY'};
}
