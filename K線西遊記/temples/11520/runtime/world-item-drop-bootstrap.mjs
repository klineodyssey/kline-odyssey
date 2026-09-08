/* KGEN_META
VERSION: 1.0.1
STATUS: ACTIVE
PURPOSE: Capture the production Three.js world scene before game boot, turn backpack discard into a real canonical 3D ground drop, and allow nearby pickup without changing the item's identity.
*/

import * as THREE from 'three';
import {createWorldItemVisual} from './world-item-visual-runtime.mjs';

export const WORLD_ITEM_DROP_VERSION='11520-WORLD-ITEM-DROP-V1.0.1';
const drops=new Map();
let worldScene=null,installed=false,nextId=1,pickupButton=null;

const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const position=()=>{
  const p=globalThis.__K11520_WORLD_COORDS__?.physical||{};
  return {x:finite(p.x),y:Math.max(0,finite(p.y)),z:finite(p.z)};
};
const visibleDropPosition=()=>{const p=position();return{x:p.x+1.15,y:p.y,z:p.z+.75}};

function captureWorldScene(){
  if(worldScene)return;
  const proto=THREE.Scene?.prototype;if(!proto?.add)return;
  const original=proto.add;if(original.__k11520DropCapture)return;
  function wrapped(...objects){
    const result=original.apply(this,objects);
    if(!worldScene&&objects.some(o=>o?.userData?.isGround===true)){
      worldScene=this;
      proto.add=original;
      if(globalThis.__K11520_WORLD_ITEM_DROP__)globalThis.__K11520_WORLD_ITEM_DROP__.sceneReady=true;
    }
    return result;
  }
  wrapped.__k11520DropCapture=true;proto.add=wrapped;
}

function cloneOne(item={}){return {...item,qty:1,meta:{...(item.meta||{})}}}

export function dropBackpackItemToWorld(item={},at=null){
  if(!worldScene)return {ok:false,reason:'WORLD_SCENE_NOT_READY'};
  if(!item?.itemId)return {ok:false,reason:'ITEM_REQUIRED'};
  const spot=at?{x:finite(at.x),y:Math.max(0,finite(at.y)),z:finite(at.z)}:visibleDropPosition();
  const unit=cloneOne(item),id=`DROP-${Date.now()}-${nextId++}`;
  const visual=createWorldItemVisual(THREE,unit,{context:'GROUND_DROP',scale:.62,x:spot.x,y:spot.y,z:spot.z,yOffset:.32,rotationY:.55});
  visual.root.userData={...(visual.root.userData||{}),worldDropId:id,itemId:unit.itemId,collectable:true};
  worldScene.add(visual.root);
  drops.set(id,{id,item:unit,root:visual.root,identityKey:visual.identityKey,shape:visual.descriptor.shape,custodyType:visual.custody?.custodyType||null,x:spot.x,y:spot.y,z:spot.z,createdAt:Date.now()});
  return {ok:true,id,identityKey:visual.identityKey,shape:visual.descriptor.shape,custodyType:visual.custody?.custodyType||null,position:spot};
}

function nearestDrop(maxDistance=2.6){
  const p=position();let best=null,bestD=Infinity;
  for(const d of drops.values()){
    const q=d.root?.position||d;const dist=Math.hypot(finite(q.x)-p.x,finite(q.y)-p.y,finite(q.z)-p.z);
    if(dist<=maxDistance&&dist<bestD){best=d;bestD=dist}
  }
  return best?{drop:best,distance:bestD}:null;
}

export function collectNearestWorldItem(){
  const hit=nearestDrop();if(!hit)return {ok:false,reason:'NO_WORLD_ITEM_NEARBY'};
  const backpack=globalThis.K11520Backpack;if(!backpack?.addItem)return {ok:false,reason:'BACKPACK_NOT_READY'};
  const stored=backpack.addItem(hit.drop.item);if(!stored?.ok)return stored||{ok:false,reason:'BACKPACK_REJECTED'};
  worldScene?.remove(hit.drop.root);drops.delete(hit.drop.id);
  return {ok:true,item:hit.drop.item,identityKey:hit.drop.identityKey,distance:hit.distance};
}

function ensurePickupButton(){
  if(pickupButton||typeof document==='undefined')return pickupButton;
  const style=document.createElement('style');style.id='k11520WorldItemDropStyle';style.textContent=`#worldItemPickup{position:fixed;z-index:975;right:6px;top:274px;max-width:156px;min-height:38px;border:1px solid #68e4ff88;border-radius:11px;background:#0b1822ee;color:#dffaff;padding:6px 9px;font:800 9px system-ui;display:none;box-shadow:0 8px 24px #0008}#worldItemPickup.show{display:block}`;document.head.appendChild(style);
  pickupButton=document.createElement('button');pickupButton.id='worldItemPickup';pickupButton.type='button';pickupButton.onclick=()=>collectNearestWorldItem();document.body.appendChild(pickupButton);return pickupButton;
}

function refreshPickup(){
  const b=ensurePickupButton(),hit=nearestDrop();if(!b)return;
  if(!hit){b.classList.remove('show');b.textContent='';return}
  b.classList.add('show');b.textContent=`拾取 ${hit.drop.item.name||'3D物品'} · ${hit.distance.toFixed(1)}m`;
}

function interceptBackpackDiscard(event){
  const button=event.target?.closest?.('[data-action="discard"][data-item-id]');if(!button)return;
  const api=globalThis.K11520Backpack,snapshot=api?.get?.();const item=snapshot?.items?.find(i=>i.itemId===button.dataset.itemId);if(!item)return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
  const dropped=dropBackpackItemToWorld(item);if(!dropped.ok)return;
  const removed=api.remove(item.itemId,1);if(!removed?.ok){const rec=drops.get(dropped.id);if(rec){worldScene?.remove(rec.root);drops.delete(dropped.id)}}
}

export function install11520WorldItemDropBridge(){
  if(installed)return globalThis.__K11520_WORLD_ITEM_DROP__;installed=true;
  captureWorldScene();
  document.addEventListener('click',interceptBackpackDiscard,true);
  ensurePickupButton();setInterval(refreshPickup,250);
  const api={version:WORLD_ITEM_DROP_VERSION,sceneReady:Boolean(worldScene),drops,dropItem:dropBackpackItemToWorld,collectNearest:collectNearestWorldItem,nearest:nearestDrop};
  globalThis.__K11520_WORLD_ITEM_DROP__=api;return api;
}
