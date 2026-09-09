/* KGEN_META
VERSION: 1.0.0
REVISION: 2026-09-09.SELECTED-LIFE-HUD
STATUS: CANDIDATE
PURPOSE: Tap/click an existing 3D Life body and expose canonical XYZ combat identity, HP and state without creating parallel combat data.
*/
import * as THREE from 'three';

const FLAG='__k11520SelectedLifeHudV1';
const PANEL_ID='selectedLifeHud';
const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const fmt=v=>finite(v).toFixed(1).replace(/\.0$/,'');

export function selectedLifeSnapshot(data={}){
  const hp=Math.max(0,finite(data.hp,finite(data.vitality,0)));
  const maxHp=Math.max(1,finite(data.maxHp,100));
  return {
    lifeId:data.lifeId||data.sourceLifeId||'UNKNOWN-LIFE',
    name:data.displayName||data.name||data.species||'生命',
    species:data.species||'LIFE',
    x:finite(data.x),y:finite(data.y),z:finite(data.z),
    hp,maxHp,
    state:String(data.state||data.combatState||'ALIVE').toUpperCase(),
  };
}

export function selectedLifeText(data={}){
  const s=selectedLifeSnapshot(data);
  return `${s.name} · ${s.species}\nHP ${fmt(s.hp)} / ${fmt(s.maxHp)}\nXYZ ${fmt(s.x)}, ${fmt(s.y)}, ${fmt(s.z)}\n${s.state}\n${s.lifeId}`;
}

function ensurePanel(){
  if(typeof document==='undefined')return null;
  let p=document.getElementById(PANEL_ID);if(p)return p;
  p=document.createElement('section');p.id=PANEL_ID;p.hidden=true;p.setAttribute('aria-live','polite');p.setAttribute('aria-label','選中生命資訊');
  p.style.cssText='position:fixed;left:12px;top:152px;z-index:470;max-width:min(250px,calc(100vw - 24px));padding:9px 11px;border:1px solid rgba(126,228,255,.65);border-radius:10px;background:rgba(4,17,27,.88);color:#e8fbff;font:600 12px/1.45 system-ui,sans-serif;white-space:pre-line;pointer-events:none;box-shadow:0 6px 24px rgba(0,0,0,.3)';
  document.body.appendChild(p);return p;
}

function lifeRoot(object){
  let n=object;while(n){if(n.userData?.lifeVisual||n.userData?.lifeId)return n;n=n.parent}return null;
}
function show(root){const p=ensurePanel();if(!p||!root)return null;const d={...(root.userData||{}),x:root.position?.x,y:root.position?.y,z:root.position?.z};p.textContent=selectedLifeText(d);p.hidden=false;p.dataset.lifeId=selectedLifeSnapshot(d).lifeId;return d}

export function installSelectedLifeHud(){
  if(typeof document==='undefined'||THREE.WebGLRenderer.prototype[FLAG])return {ok:true,alreadyInstalled:true};
  const original=THREE.WebGLRenderer.prototype.render;
  THREE.WebGLRenderer.prototype.render=function(scene,camera){
    const canvas=this.domElement;
    if(canvas&&!canvas.__k11520LifePick){
      canvas.__k11520LifePick=true;
      const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
      canvas.addEventListener('pointerup',e=>{
        if(e.button!=null&&e.button!==0)return;
        const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
        pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
        ray.setFromCamera(pointer,canvas.__k11520Camera||camera);
        const hit=ray.intersectObjects((canvas.__k11520Scene||scene).children,true).find(h=>lifeRoot(h.object));
        if(hit)show(lifeRoot(hit.object));
      },{passive:true});
    }
    canvas.__k11520Scene=scene;canvas.__k11520Camera=camera;
    return original.call(this,scene,camera);
  };
  THREE.WebGLRenderer.prototype[FLAG]=true;ensurePanel();
  globalThis.K11520SelectedLifeHud={show,selectedLifeSnapshot,selectedLifeText};
  return {ok:true};
}

installSelectedLifeHud();