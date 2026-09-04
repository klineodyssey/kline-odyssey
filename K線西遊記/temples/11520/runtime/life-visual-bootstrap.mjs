import * as THREE from 'three';
import {replaceLifeVisual} from './life-visual-factory.mjs';
import {baselineWildEcology} from './market-life-source-runtime.mjs';

const FLAG='__k11520LifeVisualBootstrapV3';
const slots=[];
const byLifeId=new Map();
const pending=[];
const INITIAL=baselineWildEcology().map(w=>[w.lifeId,w.species]);

function bindSlot(index,parent,lifeId,species){
  const slot=slots[index]||(slots[index]={index,parent:null,lifeId:null,species:null});slot.parent=parent;
  if(lifeId){slot.lifeId=lifeId;byLifeId.set(lifeId,slot)}
  if(species)slot.species=species;
  replaceLifeVisual(parent,{species:slot.species||'MARKET_LIFE',lifeId:slot.lifeId});
  parent.userData.slotIndex=index;parent.userData.lifeId=slot.lifeId;parent.userData.species=slot.species;return slot;
}
function freeDynamicSlot(){return slots.find((s,i)=>i>=INITIAL.length&&s?.parent&&!s.lifeId)||null}
function applyEvent(event){
  if(!event?.lifeId)return;
  if(event.type==='DESPAWN'){
    const slot=byLifeId.get(event.lifeId);if(!slot)return;byLifeId.delete(event.lifeId);slot.lifeId=null;slot.species='MARKET_LIFE';slot.parent.userData.lifeId=null;slot.parent.visible=false;return;
  }
  let slot=byLifeId.get(event.lifeId);
  if(!slot&&event.type==='SPAWN'){slot=freeDynamicSlot();if(slot){slot.lifeId=event.lifeId;byLifeId.set(event.lifeId,slot)}}
  if(!slot){pending.push(event);return}
  slot.parent.visible=Number(event.vitality??100)>0;slot.species=event.species||slot.species||'MARKET_LIFE';slot.parent.userData.lifeId=slot.lifeId;slot.parent.userData.species=slot.species;replaceLifeVisual(slot.parent,{species:slot.species,lifeId:slot.lifeId});
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
