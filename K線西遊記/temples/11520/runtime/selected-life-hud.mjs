/* KGEN_META
VERSION: 1.1.0
REVISION: 2026-09-09.CANONICAL-SHEET-BRIDGE
STATUS: CANDIDATE
PURPOSE: Mirror the existing canonical 3D world/entity selection sheet into a compact selected-Life HUD; do not create a second raycast or combat authority.
*/
const PANEL_ID='selectedLifeHud';
const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const fmt=v=>finite(v).toFixed(1).replace(/\.0$/,'');

export function selectedLifeSnapshot(data={}){
  const hp=Math.max(0,finite(data.hp,finite(data.vitality,0)));
  const maxHp=Math.max(1,finite(data.maxHp,100));
  return {lifeId:data.lifeId||data.sourceLifeId||'UNKNOWN-LIFE',name:data.displayName||data.name||data.species||'生命',species:data.species||'LIFE',x:finite(data.x),y:finite(data.y),z:finite(data.z),hp,maxHp,state:String(data.state||data.combatState||'ALIVE').toUpperCase()};
}
export function selectedLifeText(data={}){const s=selectedLifeSnapshot(data);return `${s.name} · ${s.species}\nHP ${fmt(s.hp)} / ${fmt(s.maxHp)}\nXYZ ${fmt(s.x)}, ${fmt(s.y)}, ${fmt(s.z)}\n${s.state}\n${s.lifeId}`}
function ensurePanel(){if(typeof document==='undefined')return null;let p=document.getElementById(PANEL_ID);if(p)return p;p=document.createElement('section');p.id=PANEL_ID;p.hidden=true;p.setAttribute('aria-live','polite');p.setAttribute('aria-label','選中生命資訊');p.style.cssText='position:fixed;left:12px;top:152px;z-index:470;max-width:min(250px,calc(100vw - 24px));padding:9px 11px;border:1px solid rgba(126,228,255,.65);border-radius:10px;background:rgba(4,17,27,.88);color:#e8fbff;font:600 12px/1.45 system-ui,sans-serif;white-space:pre-line;pointer-events:none;box-shadow:0 6px 24px rgba(0,0,0,.3)';document.body.appendChild(p);return p}
function parseCanonicalSheet(){
  if(typeof document==='undefined')return null;
  const sheet=document.getElementById('sheet'),body=document.getElementById('sheetBody');
  if(!sheet?.classList.contains('open')||!body)return null;
  const h=body.querySelector('h3')?.textContent?.trim()||'';
  const lines=[...body.querySelectorAll('p')].map(p=>p.textContent?.trim()||'');
  const type=lines.find(x=>x.startsWith('OBJECT_TYPE：'))?.slice('OBJECT_TYPE：'.length).trim();
  const lifeId=lines.find(x=>x.startsWith('LIFE_ID：'))?.slice('LIFE_ID：'.length).trim();
  const xyz=lines.find(x=>x.startsWith('X/Y/Z：'))?.slice('X/Y/Z：'.length).split('/').map(x=>Number(x.trim()));
  const fn=lines.find(x=>x.startsWith('功能：'))||'';
  const hp=fn.match(/HP\s+([\d.]+)\s*\/\s*([\d.]+)/i);
  if(!h||!type||!lifeId||lifeId==='NOT_ASSIGNED'||!hp||!xyz||xyz.length!==3)return null;
  return {name:h,displayName:h,species:type,lifeId,x:xyz[0],y:xyz[1],z:xyz[2],hp:Number(hp[1]),maxHp:Number(hp[2]),state:'SELECTED'};
}
function syncFromCanonicalSheet(){const d=parseCanonicalSheet(),p=ensurePanel();if(!p)return null;if(!d){p.hidden=true;delete p.dataset.lifeId;return null}p.textContent=selectedLifeText(d);p.hidden=false;p.dataset.lifeId=d.lifeId;return d}
export function installSelectedLifeHud(){if(typeof document==='undefined')return {ok:true,browserOnly:true};ensurePanel();const sheet=document.getElementById('sheet'),body=document.getElementById('sheetBody');if(sheet&&!sheet.__k11520SelectedLifeObserver){sheet.__k11520SelectedLifeObserver=true;const obs=new MutationObserver(syncFromCanonicalSheet);obs.observe(sheet,{attributes:true,attributeFilter:['class']});if(body)obs.observe(body,{childList:true,subtree:true,characterData:true});}globalThis.K11520SelectedLifeHud={selectedLifeSnapshot,selectedLifeText,syncFromCanonicalSheet,parseCanonicalSheet};syncFromCanonicalSheet();return {ok:true,authority:'CANONICAL_WORLD_ENTITY_SHEET'}}
installSelectedLifeHud();
