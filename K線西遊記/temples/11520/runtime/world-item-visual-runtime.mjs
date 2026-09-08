/* KGEN_META
VERSION: 1.1.0
STATUS: ACTIVE
PURPOSE: Keep one canonical 3D identity for an item across ground drops, backpack storage, Digital Ant cargo and ATM unloading.
*/

import {createProceduralItemBody,itemVisualDescriptor} from './item-visual-runtime.mjs';

export const WORLD_ITEM_CONTEXTS=Object.freeze(['GROUND_DROP','BACKPACK','ANT_CARGO','ATM_UNLOAD']);

function finite(v,f=0){return Number.isFinite(Number(v))?Number(v):f}

export function cargoItemFromLife(life={}){
  const cargo=life.cargo||{};
  const unit=String(cargo.unit||cargo.currency||cargo.asset||cargo.kind||'').toUpperCase();
  const species=String(cargo.species||cargo.lifeSpecies||'').toUpperCase();
  const living=Boolean(species||cargo.lifeId||cargo.kind==='LIVING_CARGO');
  const itemId=cargo.itemId||cargo.cargoId||life.mission?.cargoId||`${life.lifeId||life.id||'LIFE'}-CARGO`;
  const amount=finite(cargo.amount??cargo.qty,1);
  if(living)return {itemId,kind:'LIVING_CARGO',name:cargo.name||species||'Living Cargo',species:species||'LIFE',lifeId:cargo.lifeId||null,qty:amount,meta:{cargoKind:'LIVING_CARGO',unit}};
  if(unit.includes('KGEN'))return {itemId,kind:'MATERIAL',name:cargo.name||'KGEN 貨筒',qty:amount,meta:{cargoKind:'KGEN',unit:'KGEN'}};
  if(unit.includes('KAIOS')||unit.includes('CASH'))return {itemId,kind:'MATERIAL',name:cargo.name||'KAIOS 現鈔',qty:amount,meta:{cargoKind:'CASH',unit:'KAIOS'}};
  return {itemId,kind:'MATERIAL',name:cargo.name||cargo.kind||'物流貨物',qty:amount,meta:{cargoKind:unit||'MATERIAL',unit}};
}

export function canonicalWorldItem(item={},context='GROUND_DROP'){
  const ctx=WORLD_ITEM_CONTEXTS.includes(String(context).toUpperCase())?String(context).toUpperCase():'GROUND_DROP';
  const descriptor=itemVisualDescriptor(item);
  return {
    item:{...item},
    context:ctx,
    descriptor,
    identityKey:[item.itemId||descriptor.name,descriptor.shape,descriptor.label,descriptor.species||''].join('|'),
  };
}

export function createWorldItemVisual(THREE,item={},options={}){
  if(!THREE)throw new Error('THREE_REQUIRED');
  const state=canonicalWorldItem(item,options.context);
  const root=createProceduralItemBody(THREE,item,options.scale??1);
  root.name=`WORLD_ITEM:${state.context}:${item.itemId||state.descriptor.name}`;
  root.userData={...(root.userData||{}),worldItem:true,context:state.context,identityKey:state.identityKey};
  const yOffset=finite(options.yOffset,.18);
  root.position.set(finite(options.x),finite(options.y)+yOffset,finite(options.z));
  root.rotation.y=finite(options.rotationY,.45);
  return {root,...state};
}

export function syncWorldItemVisual(root,{x,y,z,rotationY,visible=true,context}={}){
  if(!root)return null;
  if(Number.isFinite(Number(x)))root.position.x=Number(x);
  if(Number.isFinite(Number(y)))root.position.y=Number(y);
  if(Number.isFinite(Number(z)))root.position.z=Number(z);
  if(Number.isFinite(Number(rotationY)))root.rotation.y=Number(rotationY);
  root.visible=visible!==false;
  if(context&&WORLD_ITEM_CONTEXTS.includes(String(context).toUpperCase()))root.userData.context=String(context).toUpperCase();
  return root;
}

export function assertSameCanonicalItemIdentity(item={},contexts=WORLD_ITEM_CONTEXTS){
  const states=contexts.map(context=>canonicalWorldItem(item,context));
  const key=states[0]?.identityKey||null;
  return {ok:Boolean(key)&&states.every(s=>s.identityKey===key),identityKey:key,states};
}
