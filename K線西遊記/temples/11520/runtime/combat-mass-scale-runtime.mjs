/* KGEN_META
VERSION: 1.1.0
STATUS: PROTOTYPE
FORMAL_ORGAN_NAME: 11520 Combat Mass Scale Runtime
PURPOSE: Canonical simulation-only bridge between KGEN lot/index scale and KAIOS XYZ game mass, while preserving the existing discrete C warp rail. Local walking at C=0 is allowed and does not become spot/warp trading. No wallet, trade, chain, settlement, payment, or treasury mutation.
*/

export const K11520_COMBAT_SCALE = Object.freeze({
  kgenPerLot: 1,
  indexUnitsPerLot: 1,
  kaiosPerKgen: 1000,
  kgPerKaios: 1,
  kgPerLot: 1000,
});

export const K11520_C_LEVELS = Object.freeze([0,0.000001,0.00001,0.0001,0.001,0.01,0.1,1,10,100,1000]);

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
  const c = finite(value) ? Number(value) : 0;
  return K11520_C_LEVELS.reduce((best,level)=>Math.abs(level-c)<Math.abs(best-c)?level:best,K11520_C_LEVELS[0]);
}

export function cMode(value) {
  const c = normalizeC(value);
  if (c===0) return 'LOCAL_WALK';
  if (c<1) return 'SUBLIGHT_WARP';
  if (c===1) return 'LIGHT_SPEED_SPOT';
  return 'SUPERLUMINAL_WARP';
}

export function movementVelocity({localBaseVelocity=1,c=0}={}) {
  const base = finite(localBaseVelocity) ? Math.max(0,Number(localBaseVelocity)) : 0;
  const warp = normalizeC(c);
  // C=0 remains ordinary local XYZ walking. The C rail is not a literal multiplier that would freeze walking.
  return warp===0 ? base : base*warp;
}

export function scaleInvariant() {
  const one = lotMass(1);
  return one.kgenEquivalent===1 && one.indexUnits===1 && one.kaiosMass===1000 && one.kgMass===1000 && cMode(0)==='LOCAL_WALK' && cMode(1)==='LIGHT_SPEED_SPOT';
}
