/* KGEN_META
VERSION: 1.2.2
REVISION: 2026-10-07.NAVIGATOR-RECONSTRUCTION-MOTION
PRODUCT_CONTEXT: V2.9.6
LAST_UPDATED: 2026-10-07
UPDATED_BY: dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER / HUMAN_AUTHORIZED_2026_10_07
REVIEWED_BY: PENDING / Draft reconstruction checkpoint; no release approval
SOURCE_COMMIT: f7f67950418ebbb6f7a5a309a32d529232fcb3b6
TASK_ID: K11520-NAVIGATOR-RECONSTRUCTION-20261007
CHANGE_REASON: Reconstruct only the elapsed shared-C local motion delta using existing actor, coordinate and waypoint owners.
ANCESTOR: K線西遊記/temples/11520/runtime/combat-mass-scale-runtime.mjs @ f7f67950418ebbb6f7a5a309a32d529232fcb3b6; partial evidence blob 65350fe6569059212f7ccc5b911605a123c3dc5e
SOURCE_OF_TRUTH: TRUE
STATUS: PROTOTYPE
FORMAL_ORGAN_NAME: 11520 Combat Mass Scale Runtime
PURPOSE: Canonical simulation-only bridge between KGEN lot/index scale and KAIOS XYZ game mass. C is a signed velocity ratio: +C and -C are opposite velocity directions with the same speed magnitude; c itself remains a positive constant. Lot mass stays non-negative. No wallet, trade, chain, settlement, payment, or treasury mutation.
*/

import {C_DETENTS,requireCanonicalC} from '../controls/nonlinear-controls.mjs';
export const K11520_COMBAT_SCALE = Object.freeze({
  kgenPerLot: 1,
  indexUnitsPerLot: 1,
  kaiosPerKgen: 1000,
  kgPerKaios: 1,
  kgPerLot: 1000,
});

export const K11520_C_LEVELS = C_DETENTS;

const finite = value => Number.isFinite(Number(value));

export function normalizeLots(value) {
  const lots = Number(value);
  if (!finite(lots) || lots < 0) return 0;
  return lots;
}

export function lotMass(lotsInput = 1) {
  const lots = normalizeLots(lotsInput);
  const kgenEquivalent = lots * K11520_COMBAT_SCALE.kgenPerLot;
  const indexUnits = lots * K11520_COMBAT_SCALE.indexUnitsPerLot;
  const kaiosMass = kgenEquivalent * K11520_COMBAT_SCALE.kaiosPerKgen;
  const kgMass = kaiosMass * K11520_COMBAT_SCALE.kgPerKaios;
  return Object.freeze({lots,kgenEquivalent,indexUnits,kaiosMass,kgMass});
}

export function combatExposure({lots=1, playerKaiosAvailable=Infinity}={}) {
  const scale = lotMass(lots);
  const available = Math.max(0, finite(playerKaiosAvailable) ? Number(playerKaiosAvailable) : 0);
  const exposedKaios = Math.min(scale.kaiosMass, available);
  return Object.freeze({...scale,playerKaiosAvailable:available,exposedKaios,fullyBacked:available>=scale.kaiosMass});
}

export function normalizeC(value) {
  return requireCanonicalC(value);
}

export function cMode(value) {
  const c = normalizeC(value);
  if (c===0) return 'PAUSED';
  if (c===1) return 'LIGHT_SPEED_SPOT';
  if (c===-1) return 'REVERSE_LIGHT_SPEED';
  const speed=Math.abs(c);
  if (speed<1) return c<0?'REVERSE_SUBLIGHT':'SUBLIGHT_WARP';
  return c<0?'REVERSE_SUPERLUMINAL':'SUPERLUMINAL_WARP';
}

export function movementVelocity({localBaseVelocity=1,c=0}={}) {
  const base = finite(localBaseVelocity) ? Math.max(0,Number(localBaseVelocity)) : 0;
  const velocityRatio = normalizeC(c);
  // C is signed velocity ratio. 0C pauses local locomotion. The signed legacy ratio is presentation only; physical motion uses magnitude.
  return base*velocityRatio;
}

export function scaleInvariant() {
  const one = lotMass(1);
  return one.kgenEquivalent===1 && one.indexUnits===1 && one.kaiosMass===1000 && one.kgMass===1000 && cMode(0)==='PAUSED' && cMode(1)==='LIGHT_SPEED_SPOT' && cMode(-1)==='REVERSE_LIGHT_SPEED';
}
