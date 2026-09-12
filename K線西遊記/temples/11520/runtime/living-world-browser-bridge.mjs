/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE
PURPOSE: Browser interaction bridge for nearby wild-life capture -> backpack -> same LIFE_ID release.
*/
import {baselineWildEcology,publishMarketLifeSourceEvent} from './market-life-source-runtime.mjs';

const CAPTURE_DISTANCE=3.2;
const SUPPORTED=new Set(['COW','FISH','SHRIMP','CHICKEN','DUCK']);
const registry=new Map();
for(const life of baselineWildEcology())registry.set(life.lifeId,{...life,active:true,sourceId:'WILD-ECOLOGY-11520'});

function playerPosition(){
  const text=document.getElementById('xyz')?.textContent||'';
  const x=Number(text.match(/X\s*(-?\d+(?:\.\d+)?)/i)?.[1]||0),y=Number(text.match(/Y\s*(-?\d+(?:\.\d+)?)/i)?.[1]||0),z=Number(text.match(/Z\s*(-?\d+(?:\.\d+)?)/i)?.[1]||0);
  return{x,y,z};
}
function weightFor(species){return({COW:18,FISH:2,SHRIMP:.5,CHICKEN:3,DUCK:4})[species]||1}
function nearest(){
  const p=playerPosition();let best=null,bestD=Infinity;
  for(const life of registry.values()){
    if(!life.active||!life.collectable||!SUPPORTED.has(life.species))continue;
    const d=Math.hypot((life.x||0)-p.x,(life.z||0)-p.z);if(d<=CAPTURE_DISTANCE&&d<bestD){best=life;bestD=d}
  }
  return best?{ok:true,life:best,distance:bestD}:{ok:false,reason:'NO_COLLECTABLE_LIFE_NEARBY'};
}
function syncEvent(event){
  if(!event?.lifeId)return;
  if(event.type==='DESPAWN'){const life=registry.get(event.lifeId);if(life)life.active=false;return}
  const previous=registry.get(event.lifeId)||{};registry.set(event.lifeId,{...previous,...event,collectable:event.meta?.collectable??previous.collectable??false,active:Number(event.vitality??100)>0});
}
if(typeof window!=='undefined')window.addEventListener('11520:market-life-source',e=>syncEvent(e.detail));

export function captureNearestLife(){
  const n=nearest();if(!n.ok)return n;
  const api=globalThis.K11520Backpack;if(!api?.captureLife)return{ok:false,reason:'BACKPACK_NOT_READY'};
  const life=n.life;
  const stored=api.captureLife({lifeId:life.lifeId,species:life.species,name:life.name,hp:life.maxHp,maxHp:life.maxHp,growth:life.growth??1,sourceClass:life.sourceId||'WILD_ECOLOGY'},{weightEach:weightFor(life.species)});
  if(!stored?.ok)return stored;
  try{
    publishMarketLifeSourceEvent({type:'DESPAWN',sourceId:life.sourceId||'WILD-ECOLOGY-11520',lifeId:life.lifeId,reason:'CAPTURED_TO_BACKPACK'});
    life.active=false;life.state='IN_BACKPACK';return{ok:true,life,item:stored.item,distance:n.distance};
  }catch(error){api.remove?.(stored.item?.itemId,1);return{ok:false,reason:'CAPTURE_SOURCE_EVENT_FAILED',error:String(error)}}
}

export function releaseItem(itemId){
  const api=globalThis.K11520Backpack;if(!api?.get)return{ok:false,reason:'BACKPACK_NOT_READY'};
  const item=api.get().items?.find(i=>i.itemId===itemId);if(!item)return{ok:false,reason:'ITEM_NOT_FOUND'};
  if(item.kind!=='LIVING_CARGO'||!item.lifeId)return{ok:false,reason:'ITEM_NOT_LIVING_CARGO'};
  const p=playerPosition(),old=registry.get(item.lifeId)||{};
  const event=publishMarketLifeSourceEvent({type:'SPAWN',sourceId:'PLAYER-LAND-11520',lifeId:item.lifeId,name:item.name,species:item.species,intelligence:2,markets:[],capital:0,vitality:100,maxHp:item.meta?.maxHp||old.maxHp||100,attack:0,speed:.008,x:p.x+1.2,y:Math.max(0,p.y),z:p.z+1.2,strategy:'PLAYER_OWNED_LIFE',meta:{sourceClass:'PLAYER_OWNED',collectable:true,playerOwnable:true,ownerId:'PLAYER-11520'}});
  syncEvent(event);return{ok:true,lifeId:item.lifeId,species:item.species,x:event.x,y:event.y,z:event.z};
}

function installCaptureButton(){
  if(typeof document==='undefined'||document.getElementById('backpackCaptureNearby'))return false;
  const panel=document.getElementById('backpackPanel'),head=panel?.querySelector('.bpHead');if(!panel||!head)return false;
  const btn=document.createElement('button');btn.id='backpackCaptureNearby';btn.type='button';btn.textContent='捕';btn.title='捕捉附近生命';btn.setAttribute('aria-label','捕捉附近牛魚蝦雞鴨');head.insertBefore(btn,head.lastElementChild);
  btn.onclick=()=>{const r=captureNearestLife();const n=document.getElementById('backpackNotice');if(n){n.hidden=false;n.textContent=r.ok?`已捕捉 ${r.life.name}，LIFE_ID 保留`:`捕捉失敗：${r.reason}`;setTimeout(()=>n.hidden=true,2200)}};
  return true;
}
function install(){if(installCaptureButton())return;const o=new MutationObserver(()=>{if(installCaptureButton())o.disconnect()});o.observe(document.documentElement,{childList:true,subtree:true})}

if(typeof document!=='undefined')install();
if(typeof globalThis!=='undefined')globalThis.K11520LivingWorldInventory={captureNearestLife,releaseItem,registry,nearest};
