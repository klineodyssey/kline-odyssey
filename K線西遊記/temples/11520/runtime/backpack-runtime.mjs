/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE
PURPOSE: Player backpack / storage runtime for 11520 living world.
*/

export const BACKPACK_VERSION='11520-BACKPACK-V1';
export const ITEM_KINDS=Object.freeze(['TREASURE','MATERIAL','FOOD','LIVING_CARGO']);
export const LIVING_SPECIES=Object.freeze(['COW','FISH','SHRIMP','CHICKEN','DUCK']);

function assertPositiveInt(n,name){n=Number(n);if(!Number.isInteger(n)||n<1)throw new Error(`${name}_MUST_BE_POSITIVE_INT`);return n}
function clone(v){return JSON.parse(JSON.stringify(v))}

export function createBackpack({capacitySlots=24,capacityWeight=120,ownerId='PLAYER-11520'}={}){
  return {version:BACKPACK_VERSION,ownerId,capacitySlots:assertPositiveInt(capacitySlots,'CAPACITY_SLOTS'),capacityWeight:Number(capacityWeight)>0?Number(capacityWeight):120,items:[],updatedAt:Date.now()};
}

export function normalizeItem(input={}){
  const kind=String(input.kind||'MATERIAL').toUpperCase();
  if(!ITEM_KINDS.includes(kind))throw new Error('INVALID_ITEM_KIND');
  const qty=assertPositiveInt(input.qty||1,'QTY');
  const species=input.species?String(input.species).toUpperCase():null;
  if(kind==='LIVING_CARGO'&&species&&!LIVING_SPECIES.includes(species))throw new Error('UNSUPPORTED_LIVING_SPECIES');
  return {
    itemId:String(input.itemId||cryptoRandomId(kind)),
    name:String(input.name||species||kind),kind,species,qty,
    weightEach:Math.max(0,Number(input.weightEach??1)),
    stackable:kind!=='LIVING_CARGO'&&input.stackable!==false,
    treasureClass:input.treasureClass?String(input.treasureClass):null,
    lifeId:input.lifeId?String(input.lifeId):null,
    meta:input.meta&&typeof input.meta==='object'?clone(input.meta):{},
  };
}
function cryptoRandomId(prefix){const r=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;return `${prefix}-${r}`}
export function backpackWeight(backpack){return backpack.items.reduce((sum,i)=>sum+i.weightEach*i.qty,0)}
export function backpackSlots(backpack){return backpack.items.length}
export function backpackSnapshot(backpack){return {...clone(backpack),usedSlots:backpackSlots(backpack),usedWeight:backpackWeight(backpack),freeSlots:Math.max(0,backpack.capacitySlots-backpackSlots(backpack)),freeWeight:Math.max(0,backpack.capacityWeight-backpackWeight(backpack))}}

export function canStore(backpack,itemInput){
  const item=normalizeItem(itemInput),existing=item.stackable?backpack.items.find(i=>i.stackable&&i.kind===item.kind&&i.name===item.name&&i.species===item.species):null;
  const slotCost=existing?0:1,weightCost=item.weightEach*item.qty;
  if(backpackSlots(backpack)+slotCost>backpack.capacitySlots)return{ok:false,reason:'BACKPACK_SLOT_FULL',item};
  if(backpackWeight(backpack)+weightCost>backpack.capacityWeight)return{ok:false,reason:'BACKPACK_OVERWEIGHT',item};
  return{ok:true,item,existing};
}

export function storeItem(backpack,itemInput){
  const check=canStore(backpack,itemInput);if(!check.ok)return check;
  if(check.existing)check.existing.qty+=check.item.qty;else backpack.items.push(check.item);
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
