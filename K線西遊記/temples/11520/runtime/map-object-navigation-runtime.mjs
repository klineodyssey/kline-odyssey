/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE
PURPOSE: North-up map object inspection and waypoint selection for 11520.
*/
import {distanceXZ,bearingCardinal,worldToNorthUpMap,northUpMapToWorld} from './spatial-coordinate-runtime.mjs';

export function describeWorldEntity(entity={}){
  return {
    id:entity.id||null,
    objectName:entity.name||entity.baseName||entity.species||'未知生命',
    objectType:entity.type||entity.kind||entity.species||'LIFE',
    lifeId:entity.lifeId||entity.sourceLifeId||null,
    x:Number(entity.x)||0,
    y:Number(entity.y)||0,
    z:Number(entity.z)||0,
    functionText:entity.functionText||entity.mission||defaultFunction(entity),
    interactionText:entity.interactionText||defaultInteraction(entity),
    sourceManaged:Boolean(entity.sourceManaged),
  };
}

function defaultFunction(e){
  const k=String(e.kind||e.type||e.species||'').toUpperCase();
  if(k.includes('ATM'))return'唯讀錢包／文明金融服務站';
  if(k.includes('SHOP'))return'花果山市集／交易與補給節點';
  if(k.includes('BUILDING'))return'花果山世界建築與地標';
  if(k.includes('ANT'))return'Digital Ant 物流／派貨／Market Life';
  return e.sourceManaged?'來源驅動 Market Life':'Living World 生命';
}
function defaultInteraction(e){return e.sourceManaged?'查看生命資料／設定導航；正式市場結算須由來源 runtime 處理':'查看資料／設定導航'}

export function collectInspectableEntities({objects=[],monsters=[]}={}){
  return [...objects,...monsters.filter(m=>m&&m.state!=='DEAD'&&(m.name||m.baseName))].map(describeWorldEntity);
}

export function findEntityNearWorldPoint(point,entities,{radius=2.8}={}){
  let best=null,bestD=Infinity;
  for(const e of entities||[]){const d=distanceXZ(point,e);if(d<=radius&&d<bestD){best=e;bestD=d}}
  return best?{entity:best,distance:bestD}:null;
}

export function projectEntitiesToMap(entities,view){return(entities||[]).map(e=>({...e,...worldToNorthUpMap(e,view)}))}

export function inspectMapPoint({px,py,view,entities=[],hitRadiusPx=14}={}){
  const projected=projectEntitiesToMap(entities,view);
  let hit=null,hitDistance=Infinity;
  for(const e of projected){const d=Math.hypot(e.px-px,e.py-py);if(d<=hitRadiusPx&&d<hitDistance){hit=e;hitDistance=d}}
  if(hit)return{kind:'ENTITY',entity:hit,hitDistancePx:hitDistance};
  const world=northUpMapToWorld({px,py},view);
  return{kind:'WAYPOINT',world};
}

export function waypointSummary(player,target){
  return{distance:distanceXZ(player,target),direction:bearingCardinal(player,target),targetX:Number(target.x)||0,targetZ:Number(target.z)||0};
}
