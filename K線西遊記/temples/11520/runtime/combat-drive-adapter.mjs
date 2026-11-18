/* KGEN_META
VERSION: 1.0.0
STATUS: PROTOTYPE
FORMAL_ORGAN_NAME: 11520 Combat Drive Adapter
PURPOSE: Pure adapter that connects the existing C rail and lot rail to XYZ movement/combat scale without mutating markets, wallets, balances, chain state, or governance.
*/
import {K11520_C_LEVELS,cMode,lotMass,movementVelocity,normalizeC} from './combat-mass-scale-runtime.mjs';

const finite=v=>Number.isFinite(Number(v));

export function parseCRead(text='0C'){
  const n=Number(String(text).replace(/C/gi,'').trim());
  return normalizeC(n);
}

export function parseLotsRead(text='1口'){
  const n=Number(String(text).replace(/口/g,'').trim());
  return finite(n)&&n>=0?n:0;
}

export function buildDriveState({c=0,lots=1,localBaseVelocity=.1}={}){
  const normalizedC=normalizeC(c),mass=lotMass(lots);
  return Object.freeze({
    c:normalizedC,
    cMode:cMode(normalizedC),
    cLevelIndex:K11520_C_LEVELS.indexOf(normalizedC),
    lots:mass.lots,
    kgenEquivalent:mass.kgenEquivalent,
    indexUnits:mass.indexUnits,
    kaiosMass:mass.kaiosMass,
    kgMass:mass.kgMass,
    xyzStep:movementVelocity({localBaseVelocity,c:normalizedC}),
    simulationOnly:true,
  });
}

export function scaleXyzVector(vector={x:0,y:0,z:0},drive=buildDriveState()){
  const step=Number(drive.xyzStep)||0;
  return Object.freeze({
    x:(Number(vector.x)||0)*step,
    y:(Number(vector.y)||0)*step,
    z:(Number(vector.z)||0)*step,
  });
}

export function readDriveStateFromDom(root=globalThis.document){
  const cText=root?.querySelector?.('#cRead')?.textContent||'0C';
  const lotsText=root?.querySelector?.('#lotsRead')?.textContent||'1口';
  return buildDriveState({c:parseCRead(cText),lots:parseLotsRead(lotsText)});
}

// 2026-11-18: integrate the bounded motion reader from PR523 c8e930c1.
// The existing signed-C owner remains authoritative. Physical movement uses
// magnitude only; this reader never reverses an input vector or selects a market.
// At 0C, the actor owner may explicitly provide its existing LOCAL_WALK speed.
export function readCanonicalDriveState({source=globalThis.__K11520_SIGNED_C_IMMERSIVE__,activeAxis=source?.activeAxis}={}){
  const unavailable=()=>Object.freeze({available:false,c:null,activeAxis:activeAxis??null,speedKPerSecond:null,status:'SPEED_UNAVAILABLE',source:'EXISTING_SIGNED_C_OWNER'});
  if(source?.ready!==true||!['KX','KY','KZ'].includes(activeAxis)||source.activeAxis!==activeAxis||!Object.hasOwn(source.signedByAxis||{},activeAxis))return unavailable();
  const value=source.signedByAxis[activeAxis];if(typeof value!=='number')return unavailable();
  let c;try{c=normalizeC(value)}catch{return unavailable()}
  return Object.freeze({available:true,c,activeAxis,speedKPerSecond:.001*Math.abs(c),status:c===0?'LOCAL_WALK':'READY',source:'EXISTING_SIGNED_C_OWNER'});
}
