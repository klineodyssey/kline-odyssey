/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE
PURPOSE: Player backpack / storage runtime for 11520 living world.
*/

export const BACKPACK_VERSION='11520-BACKPACK-V1';
export const BACKPACK_REWARD_RECEIPT_LIMIT=10000;
export const ITEM_KINDS=Object.freeze(['TREASURE','MATERIAL','FOOD','LIVING_CARGO']);
export const LIVING_SPECIES=Object.freeze(['COW','FISH','SHRIMP','CHICKEN','DUCK']);

function assertPositiveInt(n,name){n=Number(n);if(!Number.isInteger(n)||n<1)throw new Error(`${name}_MUST_BE_POSITIVE_INT`);return n}
function clone(v){return JSON.parse(JSON.stringify(v))}
const validRewardId=id=>typeof id==='string'&&id.length>0&&id.length<=128&&!/[\x00-\x1f<>]/.test(id);

export function createBackpack({capacitySlots=24,capacityWeight=120,ownerId='PLAYER-11520'}={}){
  return {version:BACKPACK_VERSION,ownerId,capacitySlots:assertPositiveInt(capacitySlots,'CAPACITY_SLOTS'),capacityWeight:Number(capacityWeight)>0?Number(capacityWeight):120,items:[],rewardReceipts:[],updatedAt:Date.now()};
}

export function normalizeItem(input={}){
  const kind=String(input.kind||'MATERIAL').toUpperCase();
  if(!ITEM_KINDS.includes(kind))throw new Error('INVALID_ITEM_KIND');
  const qty=assertPositiveInt(input.qty??1,'QTY');
  if(qty>1000000||!Number.isFinite(Number(input.weightEach??1))||Number(input.weightEach??1)<0)throw new Error('INVALID_ITEM_QUANTITY_OR_WEIGHT');
  if(kind==='LIVING_CARGO'&&qty!==1)throw new Error('LIVING_CARGO_QUANTITY_ONE');
  const species=input.species?String(input.species).toUpperCase():null;
  if(kind==='LIVING_CARGO'&&species&&!LIVING_SPECIES.includes(species))throw new Error('UNSUPPORTED_LIVING_SPECIES');
  if(input.rewardId!=null&&!validRewardId(input.rewardId))throw new Error('INVALID_REWARD_ID');
  return {
    itemId:String(input.itemId||cryptoRandomId(kind)),
    name:String(input.name||species||kind),kind,species,qty,
    weightEach:Math.max(0,Number(input.weightEach??1)),
    stackable:kind!=='LIVING_CARGO'&&input.stackable!==false,
    treasureClass:input.treasureClass?String(input.treasureClass):null,
    lifeId:input.lifeId?String(input.lifeId):null,
    rewardId:input.rewardId??null,
    meta:input.meta&&typeof input.meta==='object'?clone(input.meta):{},
  };
}
function cryptoRandomId(prefix){const r=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;return `${prefix}-${r}`}
export function backpackWeight(backpack){return backpack.items.reduce((sum,i)=>sum+i.weightEach*i.qty,0)}
export function backpackSlots(backpack){return backpack.items.length}
export function backpackSnapshot(backpack){return {...clone(backpack),usedSlots:backpackSlots(backpack),usedWeight:backpackWeight(backpack),freeSlots:Math.max(0,backpack.capacitySlots-backpackSlots(backpack)),freeWeight:Math.max(0,backpack.capacityWeight-backpackWeight(backpack))}}

export function canStore(backpack,itemInput){
  const item=normalizeItem(itemInput),existing=item.stackable?backpack.items.find(i=>i.stackable&&i.kind===item.kind&&i.name===item.name&&i.species===item.species):null;
  // These are inventory insertion receipts, not currency, XP or payout records.
  // Never evict old receipts: a full bounded history blocks new reward insertion.
  const receipts=backpack.rewardReceipts||[];
  if(item.rewardId&&receipts.includes(item.rewardId))return {ok:false,reason:'REWARD_ALREADY_CLAIMED',item};
  if(item.rewardId&&receipts.length>=BACKPACK_REWARD_RECEIPT_LIMIT)return {ok:false,reason:'REWARD_RECEIPT_LIMIT',item};
  if(backpack.items.some(i=>i.itemId===item.itemId||(item.lifeId&&i.lifeId===item.lifeId)))return{ok:false,reason:'DUPLICATE_ITEM',item};
  if(existing&&existing.qty+item.qty>1000000)return{ok:false,reason:'ITEM_QUANTITY_LIMIT',item};
  const slotCost=existing?0:1,weightCost=item.weightEach*item.qty;
  if(backpackSlots(backpack)+slotCost>backpack.capacitySlots)return{ok:false,reason:'BACKPACK_SLOT_FULL',item};
  if(backpackWeight(backpack)+weightCost>backpack.capacityWeight)return{ok:false,reason:'BACKPACK_OVERWEIGHT',item};
  return{ok:true,item,existing};
}

export function storeItem(backpack,itemInput){
  const check=canStore(backpack,itemInput);if(!check.ok)return check;
  if(check.existing)check.existing.qty+=check.item.qty;else backpack.items.push(check.item);
  if(check.item.rewardId)(backpack.rewardReceipts??=[]).push(check.item.rewardId);
  backpack.updatedAt=Date.now();return{ok:true,item:check.existing||check.item,snapshot:backpackSnapshot(backpack)};
}

export function removeItem(backpack,itemId,qty=1){
  qty=assertPositiveInt(qty,'QTY');const index=backpack.items.findIndex(i=>i.itemId===itemId);if(index<0)return{ok:false,reason:'ITEM_NOT_FOUND'};
  const item=backpack.items[index];if(qty>item.qty)return{ok:false,reason:'INSUFFICIENT_QTY',item};
  const removed={...clone(item),qty};item.qty-=qty;if(item.qty===0)backpack.items.splice(index,1);backpack.updatedAt=Date.now();return{ok:true,removed,snapshot:backpackSnapshot(backpack)};
}

export function storeLivingLife(backpack,life,{weightEach=1}={}){
  if(!life?.lifeId)return{ok:false,reason:'LIFE_ID_REQUIRED'};
  const species=String(life.species||'').toUpperCase();if(!LIVING_SPECIES.includes(species))return{ok:false,reason:'UNSUPPORTED_LIVING_SPECIES'};
  return storeItem(backpack,{kind:'LIVING_CARGO',name:life.name||species,species,qty:1,weightEach,stackable:false,lifeId:life.lifeId,meta:{hp:life.hp,maxHp:life.maxHp,growth:life.growth,sourceClass:life.sourceClass||'WILD_ECOLOGY'}});
}

/** Local candidate validation only; never economic proof. Legacy owner migrates once via scoped storage. */
export function restoreBackpack(value,ownerId){
  if(!value||!Array.isArray(value.items)||value.items.length>24||value.version!==BACKPACK_VERSION||![ownerId,'PLAYER-11520'].includes(value.ownerId))throw new Error('INVALID_BACKPACK_OWNER_OR_SCHEMA');
  const receipts=value.rewardReceipts===undefined?[]:value.rewardReceipts;
  if(!Array.isArray(receipts)||receipts.length>BACKPACK_REWARD_RECEIPT_LIMIT||receipts.some(id=>!validRewardId(id))||new Set(receipts).size!==receipts.length)throw new Error('INVALID_REWARD_RECEIPTS');
  const result=createBackpack({ownerId}),ids=new Set(),lives=new Set();
  for(const item of value.items){
    if(typeof item.itemId!=='string'||!item.itemId||item.itemId.length>256)throw new Error('INVALID_ITEM_ID');
    if(ids.has(item.itemId)||(item.lifeId&&lives.has(item.lifeId)))throw new Error('DUPLICATE_ITEM');
    if(item.kind==='LIVING_CARGO'&&(typeof item.lifeId!=='string'||!item.lifeId||!LIVING_SPECIES.includes(item.species)))throw new Error('INVALID_LIVING_IDENTITY');
    ids.add(item.itemId);if(item.lifeId)lives.add(item.lifeId);
    const added=storeItem(result,item);if(!added.ok)throw new Error(added.reason);
  }
  result.rewardReceipts=[...new Set([...receipts,...result.rewardReceipts])];
  if(result.rewardReceipts.length>BACKPACK_REWARD_RECEIPT_LIMIT)throw new Error('INVALID_REWARD_RECEIPTS');
  return result;
}

/**
 * Strict, inert canonical persistence validation. This is intentionally distinct
 * from restoreBackpack's explicit legacy normalization. It does not migrate,
 * refresh timestamps, generate IDs, coerce fields or discard unknown data.
 * Owner consistency is local isolation, never authenticated asset ownership.
 */
export function validateCanonicalBackpack(value,{ownerId}={}){
  const invalid=()=>{throw new Error('INVALID_CANONICAL_BACKPACK')};
  const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  const integer=(v,min=0)=>Number.isSafeInteger(v)&&v>=min;
  const text=(v,max=256)=>typeof v==='string'&&v.length>0&&v.length<=max&&!/[\x00-\x1f<>]/.test(v);
  const nullableText=v=>v===null||text(v);
  // IDB payloads must also have an exact JSON archival representation. Reject
  // non-finite/undefined/function/cyclic data instead of silently serializing it.
  const seen=new Set();let bytes=0;
  const add=text=>{for(const character of text){const cp=character.codePointAt(0);bytes+=cp<128?1:cp<2048?2:cp<65536?3:4}if(bytes>2_000_000)invalid()};
  function jsonData(v,depth=0){
    if(depth>128)invalid();
    if(v===null||typeof v==='string'||typeof v==='boolean'){add(JSON.stringify(v));return}
    if(typeof v==='number'){if(!Number.isFinite(v))invalid();add(JSON.stringify(v));return}
    if(typeof v!=='object'||seen.has(v)||(!Array.isArray(v)&&![Object.prototype,null].includes(Object.getPrototypeOf(v))))invalid();
    seen.add(v);const descriptors=Object.getOwnPropertyDescriptors(v),names=Reflect.ownKeys(descriptors);
    if(Array.isArray(v)){
      if(names.length!==v.length+1)invalid();add('[]');
      for(let index=0;index<v.length;index++){const d=descriptors[index];if(!d||!d.enumerable||!Object.hasOwn(d,'value'))invalid();if(index)add(',');jsonData(d.value,depth+1)}
    }else{
      add('{}');for(let index=0;index<names.length;index++){const name=names[index],d=descriptors[name];if(typeof name!=='string'||!d.enumerable||!Object.hasOwn(d,'value'))invalid();if(index)add(',');add(JSON.stringify(name));add(':');jsonData(d.value,depth+1)}
    }
    seen.delete(v);
  }
  jsonData(value);
  if(!object(value)||value.version!==BACKPACK_VERSION||!/^KAIOS-P-[a-zA-Z0-9-]{16,80}$/.test(ownerId||'')||value.ownerId!==ownerId||!integer(value.capacitySlots,1)||!Number.isFinite(value.capacityWeight)||value.capacityWeight<=0||!integer(value.updatedAt)||!Array.isArray(value.items)||value.items.length>24||value.items.length>value.capacitySlots||!Array.isArray(value.rewardReceipts)||value.rewardReceipts.length>BACKPACK_REWARD_RECEIPT_LIMIT||value.rewardReceipts.some(id=>!validRewardId(id))||new Set(value.rewardReceipts).size!==value.rewardReceipts.length)invalid();
  const ids=new Set(),lives=new Set();let weight=0;
  for(const item of value.items){
    if(!object(item)||!text(item.itemId)||!text(item.name)||!ITEM_KINDS.includes(item.kind)||!integer(item.qty,1)||item.qty>1000000||!Number.isFinite(item.weightEach)||item.weightEach<0||typeof item.stackable!=='boolean'||!nullableText(item.species)||!nullableText(item.treasureClass)||!nullableText(item.lifeId)||(item.rewardId!==null&&!validRewardId(item.rewardId))||!item.meta||typeof item.meta!=='object')invalid();
    if(ids.has(item.itemId)||(item.lifeId!==null&&lives.has(item.lifeId)))invalid();ids.add(item.itemId);if(item.lifeId!==null)lives.add(item.lifeId);
    if(item.kind==='LIVING_CARGO'&&(item.qty!==1||item.stackable!==false||!text(item.lifeId)||!LIVING_SPECIES.includes(item.species)))invalid();
    if(item.rewardId!==null&&!value.rewardReceipts.includes(item.rewardId))invalid();
    weight+=item.weightEach*item.qty;if(!Number.isFinite(weight)||weight>value.capacityWeight)invalid();
  }
  return value;
}
