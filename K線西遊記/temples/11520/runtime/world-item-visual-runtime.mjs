/* KGEN_META
VERSION: 1.2.1
STATUS: ACTIVE
PURPOSE: Keep one canonical 3D item identity across ground drops, backpack storage, Digital Ant cargo and ATM unloading, while physical cash uses explicit custody containers and ground drops remain visibly identifiable in the live world.
*/

import {createProceduralItemBody,itemVisualDescriptor} from './item-visual-runtime.mjs';

export const LIVE_CARGO_ITEM_WIRING_VERSION='11520-LIVE-CARGO-ITEM-V2.1';
export const WORLD_ITEM_CONTEXTS=Object.freeze(['GROUND_DROP','BACKPACK','ANT_CARGO','ATM_UNLOAD']);
export const CASH_CUSTODY_BY_CONTEXT=Object.freeze({
  GROUND_DROP:'CASH_CASE',
  BACKPACK:'MONEY_POUCH',
  ANT_CARGO:'ARMORED_CASH_CASE',
  ATM_UNLOAD:'ATM_CASSETTE',
});

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

export function custodyDescriptor(item={},context='GROUND_DROP'){
  const ctx=WORLD_ITEM_CONTEXTS.includes(String(context).toUpperCase())?String(context).toUpperCase():'GROUND_DROP';
  const itemDescriptor=itemVisualDescriptor(item);
  const custodyType=itemDescriptor.shape==='CASH_BUNDLE'?CASH_CUSTODY_BY_CONTEXT[ctx]:null;
  return {context:ctx,custodyType,physicalCash:itemDescriptor.shape==='CASH_BUNDLE',ledgerTransfer:false,requiresCustodyContainer:Boolean(custodyType)};
}

export function canonicalWorldItem(item={},context='GROUND_DROP'){
  const ctx=WORLD_ITEM_CONTEXTS.includes(String(context).toUpperCase())?String(context).toUpperCase():'GROUND_DROP';
  const descriptor=itemVisualDescriptor(item);
  const custody=custodyDescriptor(item,ctx);
  return {
    item:{...item},context:ctx,descriptor,custody,
    identityKey:[item.itemId||descriptor.name,descriptor.shape,descriptor.label,descriptor.species||''].join('|'),
    custodyKey:custody.custodyType?[item.itemId||descriptor.name,custody.custodyType,ctx].join('|'):null,
  };
}

function mat(THREE,color,metalness=.35,roughness=.55,extra={}){return new THREE.MeshStandardMaterial({color,metalness,roughness,...extra})}

export function createCashCustodyContainer(THREE,{type='CASH_CASE',innerRoot=null}={}){
  if(!THREE)throw new Error('THREE_REQUIRED');
  const root=new THREE.Group();root.name=`CASH_CUSTODY:${type}`;root.userData={cashCustody:true,custodyType:type};
  const dark=mat(THREE,type==='CASH_CASE'?0x2b4650:0x17222d,.52,.42),gold=mat(THREE,0xd5a43a,.7,.26),green=mat(THREE,0x48b876,.16,.48);
  if(type==='MONEY_POUCH'){
    const pouch=new THREE.Mesh(new THREE.SphereGeometry(.62,18,12),dark);pouch.scale.set(1,.72,.54);root.add(pouch);
    const mouth=new THREE.Mesh(new THREE.TorusGeometry(.34,.055,8,24),gold);mouth.rotation.x=Math.PI/2;mouth.position.y=.32;root.add(mouth);
    if(innerRoot){innerRoot.scale.multiplyScalar(.48);innerRoot.position.set(0,.08,.34);root.add(innerRoot)}
  }else if(type==='ATM_CASSETTE'){
    const tray=new THREE.Mesh(new THREE.BoxGeometry(1.34,.52,.86),dark);root.add(tray);
    const face=new THREE.Mesh(new THREE.BoxGeometry(1.05,.33,.04),green);face.position.z=.45;root.add(face);
    for(const x of[-.42,.42]){const rail=new THREE.Mesh(new THREE.BoxGeometry(.08,.58,.92),gold);rail.position.x=x;root.add(rail)}
    if(innerRoot){innerRoot.scale.multiplyScalar(.55);innerRoot.position.set(0,.06,.12);root.add(innerRoot)}
  }else{
    const armored=type==='ARMORED_CASH_CASE';
    const shell=new THREE.Mesh(new THREE.BoxGeometry(armored?1.48:1.34,armored?.82:.72,armored?.94:.86),dark);root.add(shell);
    const window=new THREE.Mesh(new THREE.BoxGeometry(.86,.36,.035),green);window.position.z=armored?.49:.45;root.add(window);
    const latch=new THREE.Mesh(new THREE.BoxGeometry(.28,.16,.08),gold);latch.position.set(0,.16,armored?.51:.47);root.add(latch);
    const handle=new THREE.Mesh(new THREE.TorusGeometry(.22,.035,8,18,Math.PI),gold);handle.rotation.z=Math.PI;handle.position.set(0,.45,0);root.add(handle);
    if(armored){for(const x of[-.58,.58]){const bumper=new THREE.Mesh(new THREE.BoxGeometry(.10,.86,1.0),gold);bumper.position.x=x;root.add(bumper)}}
    if(innerRoot){innerRoot.scale.multiplyScalar(.52);innerRoot.position.set(0,-.02,.18);root.add(innerRoot)}
  }
  return root;
}

function addGroundDropBeacon(THREE,root){
  const glow=mat(THREE,0x69e6ff,.2,.28,{emissive:0x173f4d});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.82,.045,8,32),glow);ring.name='WORLD_ITEM_DROP_RING';ring.rotation.x=Math.PI/2;ring.position.y=-.34;root.add(ring);
  const marker=new THREE.Mesh(new THREE.OctahedronGeometry(.15,0),glow);marker.name='WORLD_ITEM_DROP_MARKER';marker.position.y=1.18;root.add(marker);
}

export function createWorldItemVisual(THREE,item={},options={}){
  if(!THREE)throw new Error('THREE_REQUIRED');
  const state=canonicalWorldItem(item,options.context);
  const itemRoot=createProceduralItemBody(THREE,item,options.scale??1);
  itemRoot.name=`WORLD_ITEM_BODY:${item.itemId||state.descriptor.name}`;
  itemRoot.userData={...(itemRoot.userData||{}),canonicalItemBody:true,identityKey:state.identityKey};
  let root=itemRoot;
  if(state.custody.requiresCustodyContainer)root=createCashCustodyContainer(THREE,{type:state.custody.custodyType,innerRoot:itemRoot});
  if(state.context==='GROUND_DROP')addGroundDropBeacon(THREE,root);
  root.name=`WORLD_ITEM:${state.context}:${item.itemId||state.descriptor.name}`;
  root.userData={...(root.userData||{}),worldItem:true,context:state.context,identityKey:state.identityKey,custodyType:state.custody.custodyType,custodyKey:state.custodyKey,physicalCash:state.custody.physicalCash,ledgerTransfer:false,groundDropBeacon:state.context==='GROUND_DROP'};
  const yOffset=finite(options.yOffset,.18);
  root.position.set(finite(options.x),finite(options.y)+yOffset,finite(options.z));
  root.rotation.y=finite(options.rotationY,.45);
  return {root,itemRoot,...state};
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
