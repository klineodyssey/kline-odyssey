/* KGEN_META
VERSION: 1.1.0
STATUS: ACTIVE
FORMAL_ORGAN_NAME: 11520 Market-Origin Runtime
PURPOSE: Derive the player's displayed XYZ world origin from the currently selected live KX/KY/KZ market quotes while preserving the local 3D render/collision frame. Player movement remains signed and is added as an offset to this market origin.
*/
const AXES=['KX','KY','KZ'];
const XYZ=['x','y','z'];
export function deriveMarketOrigin({axes={},quotes={}}={}){
  const origin={x:0,y:0,z:0};
  const sources={};
  for(let i=0;i<3;i++){
    const axis=AXES[i],coord=XYZ[i],market=axes?.[axis]?.market;
    const raw=market?Number(quotes?.[market]):NaN;
    origin[coord]=Number.isFinite(raw)?raw:0;
    sources[axis]={market:market||null,value:Number.isFinite(raw)?raw:null};
  }
  const ready=AXES.every(a=>sources[a].market&&Number.isFinite(sources[a].value));
  return {version:'1.1.0',ready,origin,sources,semantics:'WORLD_XYZ = live KX/KY/KZ market origin + signed local XYZ offset'};
}
export function marketWorldCoordinates(origin={x:0,y:0,z:0},local={x:0,y:0,z:0}){
  return {x:Number(origin.x||0)+Number(local.x||0),y:Number(origin.y||0)+Number(local.y||0),z:Number(origin.z||0)+Number(local.z||0)};
}
export function applyMarketOriginOnce(state){
  if(!state||state.marketOriginApplied)return {applied:false,reason:'ALREADY_APPLIED'};
  const r=deriveMarketOrigin(state);
  if(!r.ready)return {applied:false,reason:'MARKET_QUOTES_NOT_READY',...r};
  state.marketOriginApplied=true;
  state.marketOrigin={...r.origin};
  const local=state.intentXYZ||{x:0,y:0,z:0};
  state.marketWorldXYZ=marketWorldCoordinates(r.origin,local);
  globalThis.__K11520_MARKET_ORIGIN__={...r,applied:true,localFramePreserved:true};
  return {applied:true,...r,world:{...state.marketWorldXYZ}};
}
