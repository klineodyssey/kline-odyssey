// 11520 shared nonlinear vertical-control curves.
// Precision is concentrated around zero/common values; extremes accelerate.

export function clamp01(v){ return Math.max(0, Math.min(1, Number(v)||0)); }
export function clampSigned(v){ return Math.max(-1, Math.min(1, Number(v)||0)); }

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
export function warpC(t){ return Math.round(segmentedPositive(t,{fineMax:10,max:1000})); }
// Trading leverage is separate from C. 1x minimum once a trade is armed.
export function leverageL(t){ return Math.max(1,Math.round(segmentedPositive(t,{fineMax:10,max:1000}))); }
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
  WARP_C:{min:0,fineMax:10,max:1000,unit:'C',zeroMeaning:'靜止'},
  LEVERAGE_L:{min:1,fineMax:10,max:1000,unit:'x'},
  Y:{center:0,meaning:'空間高度／升降',returnsToCenter:true}
});

export const ECONOMY_DOMAINS=Object.freeze({
  K_FIELD:{coordinates:['KX','KY','KZ'],settlement:'KGEN',meaning:'宇宙邊界／金融市場戰場'},
  LIFE_WORLD:{coordinates:['X','Y','Z'],settlement:'KAIOS',meaning:'5D生活世界／怪物／任務／日常'}
});
