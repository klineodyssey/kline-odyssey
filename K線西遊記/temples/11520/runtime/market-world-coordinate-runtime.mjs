/* KGEN_META
VERSION: 1.0.1
STATUS: ACTIVE
FORMAL_ORGAN_NAME: 11520 Market World Coordinate Runtime
PURPOSE: Present XYZ as live KX/KY/KZ market-origin coordinates plus the player's signed local movement, while leaving the local 3D render/collision frame unchanged.
*/
import {deriveMarketOrigin,marketWorldCoordinates} from './market-origin-runtime.mjs';
const AXES=['KX','KY','KZ'];
const $=s=>document.querySelector(s);
let origin=null,sources=null,lastLocal={x:0,y:0,z:0};
function selectedAxes(){const out={};for(const a of AXES){const card=document.querySelector(`[data-axis="${a}"]`),sel=card?.querySelector('select');out[a]={market:(sel?.value||'').replace('/','')}}return out}
async function loadOrigin(){
  try{
    const r=await fetch('https://api.binance.com/api/v3/ticker/price',{cache:'no-store'}),j=await r.json(),quotes={};
    for(const q of j)quotes[q.symbol]=Number(q.price);
    const d=deriveMarketOrigin({axes:selectedAxes(),quotes});
    if(!d.ready)return false;
    origin={...d.origin};sources=d.sources;render();return true;
  }catch{return false}
}
function localIntent(){const w=globalThis.__K11520_WORLD_COORDS__;return w?.intent?{x:Number(w.intent.x)||0,y:Number(w.intent.y)||0,z:Number(w.intent.z)||0}:lastLocal}
function fmt(n){return Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2})}
function world(){lastLocal=localIntent();return origin?marketWorldCoordinates(origin,lastLocal):null}
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
function render(){
  if(!origin)return;
  const w=world();if(!w)return;
  setText($('#xyz'),`X ${fmt(w.x)} · Y ${fmt(w.y)} · Z ${fmt(w.z)}`);
  const rail=(globalThis.__K11520_3D_CONTROL__?.railAxis||'Y').toUpperCase(),idx={X:'x',Y:'y',Z:'z'}[rail]||'y';
  setText($('#yRead'),`${rail} ${fmt(w[idx])}`);
  const base=globalThis.__K11520_WORLD_COORDS__;if(base){base.marketOrigin={...origin};base.marketWorld={...w}}
  globalThis.__K11520_MARKET_WORLD_COORDS__={version:'1.0.1',origin:{...origin},sources,local:{...lastLocal},world:{...w},signedLocalMovement:true,localRenderFramePreserved:true};
}
export async function install11520MarketWorldCoordinates(){
  if(typeof document==='undefined')return null;
  await loadOrigin();
  for(const a of AXES)document.querySelector(`[data-market="${a}"]`)?.addEventListener('change',()=>{origin=null;setTimeout(async()=>{await loadOrigin();render()},80)});
  const tick=()=>{render();requestAnimationFrame(tick)};requestAnimationFrame(tick);
  setInterval(()=>{if(!origin)void loadOrigin()},1500);
  return globalThis.__K11520_MARKET_WORLD_COORDS__||null;
}
if(typeof document!=='undefined')install11520MarketWorldCoordinates();
