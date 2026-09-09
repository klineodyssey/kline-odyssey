/* KGEN_META
VERSION: 1.0.0
STATUS: PROTOTYPE
FORMAL_ORGAN_NAME: 11520 Combat Mass Scale Runtime
PURPOSE: Canonical simulation-only bridge between KGEN lot/index scale and KAIOS XYZ game mass. No wallet, trade, chain, settlement, payment, or treasury mutation.
*/

export const K11520_COMBAT_SCALE = Object.freeze({
  kgenPerLot: 1,
  indexUnitsPerLot: 1,
  kaiosPerKgen: 1000,
  kgPerKaios: 1,
  kgPerLot: 1000,
});

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

export function warpVelocity(baseVelocity, c) {
  const base = finite(baseVelocity) ? Number(baseVelocity) : 0;
  const warp = finite(c) ? Math.max(0, Number(c)) : 0;
  return base * warp;
}

export function scaleInvariant() {
  const one = lotMass(1);
  return one.kgenEquivalent===1 && one.indexUnits===1 && one.kaiosMass===1000 && one.kgMass===1000;
}
