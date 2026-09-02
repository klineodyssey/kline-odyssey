// 11520 shared nonlinear vertical-control curves.
// Design goal: precision around zero/common values, acceleration near the extremes.

export function clamp01(v){ return Math.max(0, Math.min(1, Number(v)||0)); }

// Unipolar control, e.g. C warp or L leverage.
// First 50% of travel covers 0..fineMax; remaining 50% covers fineMax..max.
export function segmentedPositive(t,{fineMax=10,max=100}={}){
  t=clamp01(t);
  if(t<=0.5) return (t/0.5)*fineMax;
  const u=(t-0.5)/0.5;
  return fineMax+(max-fineMax)*(u*u);
}

// Bipolar control, e.g. firepower: center 0, up positive, down negative.
// |v| 0..0.5 => 0..fineMax; |v| 0.5..1 => fineMax..max.
export function segmentedBipolar(v,{fineMax=10,max=100,deadZone=0.025}={}){
  v=Math.max(-1,Math.min(1,Number(v)||0));
  const sign=v<0?-1:1;
  const a=Math.abs(v);
  if(a<=deadZone) return 0;
  if(a<=0.5) return sign*((a-deadZone)/(0.5-deadZone))*fineMax;
  const u=(a-0.5)/0.5;
  return sign*(fineMax+(max-fineMax)*(u*u));
}

export function fireLots(v){ return Math.round(segmentedBipolar(v,{fineMax:10,max:100})); }
export function warpC(t){ return Math.round(segmentedPositive(t,{fineMax:10,max:1000})); }
export function leverageL(t){ return Math.max(1,Math.round(segmentedPositive(t,{fineMax:10,max:1000}))); }

export function controlBandLabel(value,{bipolar=false,unit=''}={}){
  const n=Math.abs(Number(value)||0);
  if(n===0) return `0${unit}`;
  const band=n<=10?'精細':'高速';
  if(!bipolar) return `${Math.round(n)}${unit} · ${band}`;
  return `${value>0?'多':'空'} ${Math.round(n)}${unit} · ${band}`;
}

export const ECONOMY_DOMAINS=Object.freeze({
  K_FIELD:{coordinates:['KX','KY','KZ'],settlement:'KGEN',meaning:'宇宙邊界／金融市場戰場'},
  LIFE_WORLD:{coordinates:['X','Y','Z'],settlement:'KAIOS',meaning:'5D生活世界／怪物／任務／日常'}
});
