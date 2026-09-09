import * as THREE from 'three';
import {replaceLifeVisual} from './life-visual-factory.mjs';
import {baselineWildEcology} from './market-life-source-runtime.mjs';
import './selected-life-hud.mjs';

const FLAG='__k11520LifeVisualBootstrapV3';
const slots=[];
const byLifeId=new Map();
const pending=[];
const BASELINE=baselineWildEcology();
const INITIAL=BASELINE.map(w=>[w.lifeId,w.species]);
const baselineByLifeId=new Map(BASELINE.map(w=>[w.lifeId,w]));

function detailFromLife(life={}){return {lifeId:life.lifeId||null,displayName:life.name||life.lifeId||null,species:life.species||'MARKET_LIFE',hp:Number.isFinite(Number(life.hp))?Number(life.hp):Math.max(0,(Number(life.maxHp)||100)*(Number(life.vitality??100)/100)),maxHp:Number(life.maxHp)||100,x:Number(life.x)||0,y:Number(life.y)||0,z:Number(life.z)||0,state:life.state||((Number(life.vitality??100)>0)?'ALIVE':'DEAD')}}
function bindSlot(index,parent,lifeId,species){
  const slot=slots[index]||(slots[index]={index,parent:null,lifeId:null,species:null});slot.parent=parent;
  if(lifeId){slot.lifeId=lifeId;byLifeId.set(lifeId,slot)}
  if(species)slot.species=species;
  replaceLifeVisual(parent,{species:slot.species||'MARKET_LIFE',lifeId:slot.lifeId});
  Object.assign(parent.userData,detailFromLife(baselineByLifeId.get(slot.lifeId)||{lifeId:slot.lifeId,species:slot.species}),{slotIndex:index});return slot;
}
function freeDynamicSlot(){return slots.find(s=>s?.parent&&!s.lifeId)||null}
function applyEvent(event){
  if(!event?.lifeId)return;
  if(event.type==='DESPAWN'){
    const slot=byLifeId.get(event.lifeId);if(!slot)return;byLifeId.delete(event.lifeId);slot.lifeId=null;slot.species='MARKET_LIFE';slot.parent.userData.lifeId=null;slot.parent.visible=false;return;
  }
  let slot=byLifeId.get(event.lifeId);
  if(!slot&&event.type==='SPAWN'){slot=freeDynamicSlot();if(slot){slot.lifeId=event.lifeId;byLifeId.set(event.lifeId,slot)}}
  if(!slot){pending.push(event);return}
  slot.parent.visible=Number(event.vitality??100)>0;slot.species=event.species||slot.species||'MARKET_LIFE';Object.assign(slot.parent.userData,detailFromLife({...event,lifeId:slot.lifeId,species:slot.species}));replaceLifeVisual(slot.parent,{species:slot.species,lifeId:slot.lifeId});
}
function flushPending(){for(let i=0;i<pending.length;){const free=freeDynamicSlot();if(!free)break;const e=pending.splice(i,1)[0];applyEvent(e)}}

export function installLifeVisualBootstrap(){
  if(THREE.Scene.prototype[FLAG])return {ok:true,alreadyInstalled:true};
  const originalAdd=THREE.Scene.prototype.add;
  THREE.Scene.prototype.add=function(...objects){
    for(const obj of objects){
      try{
        const isLegacyRock=obj?.isMesh&&obj.geometry?.type==='DodecahedronGeometry'&&obj.material?.color?.getHex?.()===0x7b2025;
        if(isLegacyRock){const index=slots.length;const initial=INITIAL[index]||[null,'MARKET_LIFE'];bindSlot(index,obj,initial[0],initial[1]);if(index>=INITIAL.length)obj.visible=false;flushPending();}
      }catch{}
    }
    return originalAdd.apply(this,objects);
  };
  if(typeof window!=='undefined')window.addEventListener('11520:market-life-source',e=>{try{applyEvent(e.detail)}catch{}});
  THREE.Scene.prototype[FLAG]=true;
  globalThis.K11520LifeVisuals={version:'V3',slots,byLifeId,applyEvent,get(lifeId){return byLifeId.get(lifeId)||null}};
  return {ok:true};
}

installLifeVisualBootstrap();