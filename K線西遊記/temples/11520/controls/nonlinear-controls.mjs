// 11520 shared nonlinear vertical-control curves.
// Precision is concentrated around zero/common values; extremes accelerate.

export function clamp01(v){ return Math.max(0, Math.min(1, Number(v)||0)); }
export function clampSigned(v){ return Math.max(-1, Math.min(1, Number(v)||0)); }

// Human-approved executable C authority. Input controls snap; execution boundaries
// validate without snapping. Exact midpoints choose the lower absolute leverage.
export const C_MAX=100;
export const C_MIN_NONZERO=0.001;
export const C_ABS_DETENTS=Object.freeze([0,0.001,0.01,0.1,1,...Array.from({length:20},(_,i)=>(i+1)*5)]);
export const C_DETENTS=Object.freeze([...C_ABS_DETENTS.slice(1).reverse().map(n=>-n),...C_ABS_DETENTS]);
export function isCanonicalC(value,{allowZero=true}={}){
  if(!['number','string'].includes(typeof value)||String(value).trim()==='')return false;
  const n=Number(value);
  return Number.isFinite(n)&&C_DETENTS.includes(n)&&(allowZero||n!==0);
}
export function requireCanonicalC(value,options){
  if(!isCanonicalC(value,options))throw new RangeError('INVALID_C_DETENT');
  return Number(value)===0?0:Number(value);
}
export function snapCanonicalC(value){
  if(!['number','string'].includes(typeof value)||String(value).trim()==='')return null;
  const n=Number(value);if(!Number.isFinite(n)||Math.abs(n)>C_MAX)return null;
  const magnitude=Math.abs(n);
  let best=0;
  for(const level of C_ABS_DETENTS)if(Math.abs(level-magnitude)<Math.abs(best-magnitude)-Number.EPSILON*Math.max(1,magnitude))best=level;
  return best===0?0:Math.sign(n)*best;
}
// Each signed half dedicates its inner 50% to four low-C steps. The outer
// 50% has twenty equally spaced 5C steps. Zero owns a deterministic deadband.
export const C_ABS_TRAVEL=Object.freeze(C_ABS_DETENTS.map((_,i)=>i<=4?i/8:0.5+(i-4)/40));
export function cFromSignedTravel(travel){
  const n=clampSigned(travel),magnitude=Math.abs(n);let best=0;
  for(let i=1;i<C_ABS_TRAVEL.length;i++)if(Math.abs(C_ABS_TRAVEL[i]-magnitude)<Math.abs(C_ABS_TRAVEL[best]-magnitude)-Number.EPSILON)best=i;
  return best===0?0:Math.sign(n)*C_ABS_DETENTS[best];
}
export function signedTravelFromC(value){
  const c=requireCanonicalC(value);return c===0?0:Math.sign(c)*C_ABS_TRAVEL[C_ABS_DETENTS.indexOf(Math.abs(c))];
}
export function formatSignedC(value){const c=requireCanonicalC(value);return `${c>0?'+':''}${c}C`;}

// Unipolar rail: lower half = precision band 0..fineMax;
// upper half = accelerated band fineMax..max.
export function segmentedPositive(t,{fineMax=10,max=100}={}){
  t=clamp01(t);
  if(t<=0.5) return (t/0.5)*fineMax;
  const u=(t-0.5)/0.5;
  return fineMax+(max-fineMax)*(u*u);
}

// Bipolar rail: center = 0. Up is positive, down is negative.
// Each side's first half = 0..fineMax; outer half accelerates to max.
export function segmentedBipolar(v,{fineMax=10,max=100,deadZone=0.025}={}){
  v=clampSigned(v);
  const sign=v<0?-1:1;
  const a=Math.abs(v);
  if(a<=deadZone) return 0;
  if(a<=0.5) return sign*((a-deadZone)/(0.5-deadZone))*fineMax;
  const u=(a-0.5)/0.5;
  return sign*(fineMax+(max-fineMax)*(u*u));
}

// Trading firepower: 0 center, +1..+100 long, -1..-100 short.
export function fireLots(v){ return Math.round(segmentedBipolar(v,{fineMax:10,max:100})); }
// Spatial warp: 0 really means stopped; common travel is concentrated in 0..10C.
// The same Human-approved C boundary is shared with the signed trade preview.
export function warpC(t){ return cFromSignedTravel(clamp01(t)); }
// Compatibility-only alias for older callers. There is no separate L control.
export function leverageL(t){ return Math.max(1,Math.round(segmentedPositive(t,{fineMax:10,max:100}))); }
// Y is spatial vertical velocity, not lots. Center returns to zero.
export function verticalY(v,{fineMax=1,max=10}={}){
  return segmentedBipolar(v,{fineMax,max,deadZone:0.035});
}

export function controlBandLabel(value,{bipolar=false,unit='',fineMax=10}={}){
  const n=Math.abs(Number(value)||0);
  if(n===0) return `0${unit}`;
  const band=n<=fineMax?'精細':'高速';
  if(!bipolar) return `${Math.round(n)}${unit} · ${band}`;
  return `${value>0?'多':'空'} ${Math.round(n)}${unit} · ${band}`;
}

export const CONTROL_SPEC=Object.freeze({
  FIRE:{center:0,fineMax:10,max:100,unit:'口',positive:'多',negative:'空',settlement:'KGEN'},
  WARP_C:{min:0,fineMax:10,max:100,unit:'C',zeroMeaning:'靜止',sharedSignedTradeBoundary:true},
  LEVERAGE_L:{min:1,fineMax:10,max:100,unit:'x',deprecated:true,aliasOf:'ABS_C'},
  Y:{center:0,meaning:'空間高度／升降',returnsToCenter:true}
});

export const ECONOMY_DOMAINS=Object.freeze({
  K_FIELD:{coordinates:['KX','KY','KZ'],settlement:'KGEN',meaning:'宇宙邊界／金融市場戰場'},
  LIFE_WORLD:{coordinates:['X','Y','Z'],settlement:'KAIOS',meaning:'5D生活世界／怪物／任務／日常'}
});
