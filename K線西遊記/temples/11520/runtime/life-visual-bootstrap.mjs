import * as THREE from 'three';
import {replaceLifeVisual} from './life-visual-factory.mjs';
import {publishMarketLifeSourceEvent} from './market-life-source-runtime.mjs';

const FLAG='__k11520LifeVisualBootstrapV2';
const slots=[];
const byLifeId=new Map();
const INITIAL=[
  ['LIFE-WILD-11520-CHICKEN-001','CHICKEN'],['LIFE-WILD-11520-CHICKEN-002','CHICKEN'],
  ['LIFE-WILD-11520-DUCK-001','DUCK'],['LIFE-WILD-11520-DUCK-002','DUCK'],
  ['LIFE-WILD-11520-FISH-001','FISH'],['LIFE-WILD-11520-FISH-002','FISH'],
  ['LIFE-WILD-11520-SHRIMP-003','SHRIMP'],['LIFE-WILD-11520-SHRIMP-004','SHRIMP'],
  ['LIFE-WILD-11520-COW-005','COW'],['LIFE-WILD-11520-COW-006','COW'],
  ['LIFE-WILD-11520-SHEEP-007','SHEEP'],['LIFE-WILD-11520-SHEEP-008','SHEEP'],
  ['LIFE-WILD-11520-TREE-009','TREE'],['LIFE-WILD-11520-TREE-010','TREE'],['LIFE-WILD-11520-TREE-011','TREE'],
  ['LIFE-WILD-11520-FLOWER-012','FLOWER'],['LIFE-WILD-11520-FLOWER-013','FLOWER'],['LIFE-WILD-11520-FLOWER-014','FLOWER']
];

function seedChickenDuck(){
  if(typeof sessionStorage==='undefined')return;
  const key='11520.wildEcology.chickenDuck.v1';if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');
  const rows=[
    ['CHICKEN','花果山雞 1',10,10],['CHICKEN','花果山雞 2',13,8],['DUCK','花果山鴨 1',-5,-16],['DUCK','花果山鴨 2',-2,-18]
  ];
  rows.forEach((r,i)=>publishMarketLifeSourceEvent({type:'SPAWN',sourceId:'WILD-ECOLOGY-11520',lifeId:`LIFE-WILD-11520-${r[0]}-${String(i%2+1).padStart(3,'0')}`,name:r[1],species:r[0],intelligence:2,markets:[],capital:0,vitality:100,maxHp:r[0]==='CHICKEN'?32:38,attack:0,speed:.01,x:r[2],y:0,z:r[3],strategy:'WILD_ECOLOGY',meta:{sourceClass:'WILD_ECOLOGY',collectable:true,playerOwnable:true}},{persistLocal:false,broadcast:false}));
}

function bindSlot(index,parent,lifeId,species){
  const slot=slots[index]||(slots[index]={index,parent:null,lifeId:null,species:null});slot.parent=parent;
  if(lifeId){slot.lifeId=lifeId;byLifeId.set(lifeId,slot)}
  if(species)slot.species=species;
  replaceLifeVisual(parent,{species:slot.species||'MARKET_LIFE',lifeId:slot.lifeId});
  parent.userData.slotIndex=index;return slot;
}
function freeDynamicSlot(){return slots.find((s,i)=>i>=INITIAL.length&&s?.parent&&!s.lifeId)||null}
function applyEvent(event){
  if(!event?.lifeId)return;
  if(event.type==='DESPAWN'){
    const slot=byLifeId.get(event.lifeId);if(!slot)return;byLifeId.delete(event.lifeId);slot.lifeId=null;slot.species='MARKET_LIFE';replaceLifeVisual(slot.parent,{species:'MARKET_LIFE'});return;
  }
  let slot=byLifeId.get(event.lifeId);
  if(!slot&&event.type==='SPAWN'){slot=freeDynamicSlot();if(slot){slot.lifeId=event.lifeId;byLifeId.set(event.lifeId,slot)}}
  if(slot){slot.species=event.species||slot.species||'MARKET_LIFE';replaceLifeVisual(slot.parent,{species:slot.species,lifeId:slot.lifeId})}
}

export function installLifeVisualBootstrap(){
  if(THREE.Scene.prototype[FLAG])return {ok:true,alreadyInstalled:true};
  seedChickenDuck();
  const originalAdd=THREE.Scene.prototype.add;
  THREE.Scene.prototype.add=function(...objects){
    for(const obj of objects){
      try{
        const isLegacyRock=obj?.isMesh&&obj.geometry?.type==='DodecahedronGeometry'&&obj.material?.color?.getHex?.()===0x7b2025;
        if(isLegacyRock){const index=slots.length;const initial=INITIAL[index]||[null,'MARKET_LIFE'];bindSlot(index,obj,initial[0],initial[1]);}
      }catch{}
    }
    return originalAdd.apply(this,objects);
  };
  if(typeof window!=='undefined')window.addEventListener('11520:market-life-source',e=>{try{applyEvent(e.detail)}catch{}});
  THREE.Scene.prototype[FLAG]=true;
  globalThis.K11520LifeVisuals={slots,byLifeId,applyEvent};
  return {ok:true};
}

installLifeVisualBootstrap();
