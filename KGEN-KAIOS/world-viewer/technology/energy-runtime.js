import { createBoundedLedgerRuntime } from "./runtime-ledger.js";

export const COSMIC_ENERGY_IDS = Object.freeze([
  "FIRE", "ELECTRICITY", "NUCLEAR", "FUSION", "ANTI_GRAVITY_ENERGY",
  "DARK_ENERGY", "ANTI_MATTER_ENERGY", "TIMELINE_ENERGY"
]);

export function createCosmicEnergyRuntime({ config, storage, storageKey = "kaios.world-viewer.cosmic-energy.v1" } = {}) {
  if (JSON.stringify(config?.map(({ energy_id: id }) => id)) !== JSON.stringify(COSMIC_ENERGY_IDS)) {
    throw new TypeError("Cosmic Energy Runtime requires the approved eight-energy catalog");
  }
  const ledger = createBoundedLedgerRuntime({
    runtime: "COSMIC_ENERGY_ALPHA",
    catalog: config,
    idField: "energy_id",
    initialField: "initial_reserve",
    valueField: "reserve",
    storage,
    storageKey,
    auditPrefix: "cosmic-energy-audit"
  });
  return Object.freeze({
    ...ledger,
    generate(energyId, quantity = 4) {
      return ledger.add(energyId, quantity, "REVIEWED_SYNTHETIC_GENERATION");
    }
  });
}
