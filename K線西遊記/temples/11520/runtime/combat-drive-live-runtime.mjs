/* KGEN_META
VERSION: 1.0.0
STATUS: PROTOTYPE
FORMAL_ORGAN_NAME: 11520 Live Combat Drive Bridge
PURPOSE: Apply the existing discrete C rail to XYZ joystick intent and expose lot/KAIOS mass to the game HUD. Simulation-only; never mutates KX/KY/KZ positions, wallets, balances, chain state, payments, treasury, or governance.
*/
import {buildDriveState,readDriveStateFromDom} from './combat-drive-adapter.mjs';

const finite=v=>Number.isFinite(Number(v));

export function driveMultiplier(c){
  const d=buildDriveState({c,lots:1,localBaseVelocity:1});
  return d.xyzStep;
}

export function scaledControlState(source,drive){
  if(!source||typeof source!=='object')return source;
  const v=source.vector||{x:0,y:0,z:0};
  const factor=driveMultiplier(drive?.c||0);
  return {...source,vector:{x:(Number(v.x)||0)*factor,y:(Number(v.y)||0)*factor,z:(Number(v.z)||0)*factor},drive:{...drive,vectorMultiplier:factor}};
}

export function exposeDriveState(root=globalThis.document){
  const drive=readDriveStateFromDom(root);
  const control=globalThis.__K11520_3D_CONTROL__||globalThis.__K11520_JOYSTICK_XZXY__||null;
  const live=scaledControlState(control,drive);
  globalThis.__K11520_COMBAT_DRIVE__={...drive,controlVector:live?.vector||{x:0,y:0,z:0},simulationOnly:true};
  return globalThis.__K11520_COMBAT_DRIVE__;
}

export function renderDriveHud(root=globalThis.document){
  if(!root?.querySelector)return null;
  const drive=exposeDriveState(root);
  let el=root.querySelector('#k11520DriveHud');
  const host=root.querySelector('.monsterHud');
  if(!el&&host){el=root.createElement('div');el.id='k11520DriveHud';el.style.cssText='margin-top:2px;font-size:6.5px;line-height:1.15;color:#f6d984';host.appendChild(el)}
  if(el)el.textContent=`${drive.c}C ${drive.cMode} · ${drive.lots}口 · ${drive.kaiosMass} KAIOS / ${drive.kgMass}kg`;
  return drive;
}

export function install11520LiveCombatDrive({root=globalThis.document,intervalMs=120}={}){
  const tick=()=>renderDriveHud(root);
  tick();
  clearInterval(globalThis.__K11520_COMBAT_DRIVE_TIMER__);
  globalThis.__K11520_COMBAT_DRIVE_TIMER__=setInterval(tick,Math.max(60,Number(intervalMs)||120));
  globalThis.__K11520_COMBAT_DRIVE_API__={read:()=>exposeDriveState(root),render:tick,scaleVector(vector={}){const d=exposeDriveState(root),f=driveMultiplier(d.c);return{x:(finite(vector.x)?Number(vector.x):0)*f,y:(finite(vector.y)?Number(vector.y):0)*f,z:(finite(vector.z)?Number(vector.z):0)*f}}};
  return globalThis.__K11520_COMBAT_DRIVE__;
}
