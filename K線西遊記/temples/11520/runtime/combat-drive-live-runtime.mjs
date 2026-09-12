/* KGEN_META
VERSION: 1.3.1
STATUS: PROTOTYPE
FORMAL_ORGAN_NAME: 11520 Live Combat Drive Bridge
PURPOSE: Apply the existing discrete C rail to XYZ joystick intent and expose lot/KAIOS mass to the game HUD. Local physical XYZ movement remains signed across zero while financial +K/-K and Mirror Universe K-direction semantics stay separate. Simulation-only; never mutates KX/KY/KZ positions, wallets, balances, chain state, payments, treasury, or governance.
*/
import {buildDriveState,readDriveStateFromDom} from './combat-drive-adapter.mjs';

const finite=v=>Number.isFinite(Number(v));
const AXIS_KEY=a=>String(a||'').toLowerCase();

export function driveMultiplier(c){
  const d=buildDriveState({c,lots:1,localBaseVelocity:1});
  return d.xyzStep;
}

export function rawVectorFromControl(source){
  if(!source||typeof source!=='object')return{x:0,y:0,z:0};
  const v={x:0,y:0,z:0};
  const axes=Array.isArray(source.discAxes)?source.discAxes:[];
  if(axes[0])v[AXIS_KEY(axes[0])]=Number(source.disc?.h)||0;
  if(axes[1])v[AXIS_KEY(axes[1])]=Number(source.disc?.v)||0;
  if(source.railAxis)v[AXIS_KEY(source.railAxis)]=Number(source.rail?.value)||0;
  if(!axes.length&&!source.railAxis){
    v.x=Number(source.vector?.x)||0;v.y=Number(source.vector?.y)||0;v.z=Number(source.vector?.z)||0;
  }
  return v;
}

export function scaledControlState(source,drive){
  if(!source||typeof source!=='object')return source;
  const v=rawVectorFromControl(source),factor=driveMultiplier(drive?.c||0);
  const scaled={x:v.x*factor,y:v.y*factor,z:v.z*factor};
  return {
    ...source,
    vector:scaled,
    drive:{
      ...drive,
      vectorMultiplier:factor,
      rawVector:v,
      signedXyzCoordinates:true,
      zeroCrossingAllowed:true,
      negativeCoordinateMeaning:'NEGATIVE_XYZ_AXIS',
      mirrorUniverseCoupling:'SEPARATE_K_DIRECTION_ONLY',
    },
  };
}

export function exposeDriveState(root=globalThis.document,{applyToLiveControl=false}={}){
  const drive=readDriveStateFromDom(root);
  const control=globalThis.__K11520_3D_CONTROL__||globalThis.__K11520_JOYSTICK_XZXY__||null;
  const live=scaledControlState(control,drive);
  if(applyToLiveControl&&live){
    globalThis.__K11520_3D_CONTROL__=live;
    globalThis.__K11520_JOYSTICK_XZXY__=live;
    globalThis.__K11520_JOYSTICK_PLANE__=live;
  }
  globalThis.__K11520_COMBAT_DRIVE__={
    ...drive,
    controlVector:live?.vector||{x:0,y:0,z:0},
    simulationOnly:true,
    appliedToLiveControl:Boolean(applyToLiveControl&&live),
    signedXyzCoordinates:true,
    zeroCrossingAllowed:true,
    negativeCoordinateMeaning:'NEGATIVE_XYZ_AXIS',
    mirrorUniverseCoupling:'SEPARATE_K_DIRECTION_ONLY',
  };
  return globalThis.__K11520_COMBAT_DRIVE__;
}

export function renderDriveHud(root=globalThis.document,{applyToLiveControl=false}={}){
  if(!root?.querySelector)return null;
  const drive=exposeDriveState(root,{applyToLiveControl});
  let el=root.querySelector('#k11520DriveHud');
  const host=root.querySelector('.monsterHud');
  if(!el&&host){el=root.createElement('div');el.id='k11520DriveHud';el.style.cssText='margin-top:2px;font-size:6.5px;line-height:1.15;color:#f6d984';host.appendChild(el)}
  if(el)el.textContent=`${drive.c}C ${drive.cMode} · ${drive.lots}口 · ${drive.kaiosMass} KAIOS / ${drive.kgMass}kg`;
  return drive;
}

export function install11520LiveCombatDrive({root=globalThis.document,intervalMs=60,applyToLiveControl=true}={}){
  const tick=()=>renderDriveHud(root,{applyToLiveControl});
  tick();
  clearInterval(globalThis.__K11520_COMBAT_DRIVE_TIMER__);
  globalThis.__K11520_COMBAT_DRIVE_TIMER__=setInterval(tick,Math.max(40,Number(intervalMs)||60));
  globalThis.__K11520_COMBAT_DRIVE_API__={
    read:()=>exposeDriveState(root,{applyToLiveControl}),
    render:tick,
    scaleVector(vector={}){
      const d=readDriveStateFromDom(root),f=driveMultiplier(d.c);
      return {
        x:(finite(vector.x)?Number(vector.x):0)*f,
        y:(finite(vector.y)?Number(vector.y):0)*f,
        z:(finite(vector.z)?Number(vector.z):0)*f,
      };
    },
  };
  return globalThis.__K11520_COMBAT_DRIVE__;
}