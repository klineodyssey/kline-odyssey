/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE
FORMAL_ORGAN_NAME: 11520 Market-Origin Runtime
PURPOSE: Derive the player's initial XYZ world origin from the currently selected live KX/KY/KZ market quotes, then preserve autonomous signed XYZ movement as offsets from that market origin. Read-only with respect to markets and chain state.
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
  const ready=XYZ.every(k=>Number.isFinite(origin[k]))&&AXES.every(a=>sources[a].market&&Number.isFinite(sources[a].value));
  return {version:'1.0.0',ready,origin,sources,semantics:'XYZ = live-market-origin + signed player offset'};
}
export function applyMarketOriginOnce(state){
  if(!state||state.marketOriginApplied)return {applied:false,reason:'ALREADY_APPLIED'};
  const r=deriveMarketOrigin(state);
  if(!r.ready)return {applied:false,reason:'MARKET_QUOTES_NOT_READY',...r};
  state.marketOriginApplied=true;
  state.marketOrigin={...r.origin};
  state.xyz={...r.origin};
  state.intentXYZ={...r.origin};
  globalThis.__K11520_MARKET_ORIGIN__={...r,applied:true};
  return {applied:true,...r};
}
