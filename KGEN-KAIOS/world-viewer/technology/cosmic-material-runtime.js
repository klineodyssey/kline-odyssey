import { createBoundedLedgerRuntime } from "./runtime-ledger.js";

export const COSMIC_MATERIAL_IDS = Object.freeze([
  "IRON", "COPPER", "GOLD", "DIAMOND", "METEORITE", "URANIUM",
  "RARE_EARTH", "DARK_MATTER", "ANTI_MATTER", "EXOTIC_MATTER",
  "TIMELINE_CRYSTAL", "WARP_CRYSTAL"
]);

export function createCosmicMaterialRuntime({ config, storage, storageKey = "kaios.world-viewer.cosmic-material.v1" } = {}) {
  if (JSON.stringify(config?.map(({ material_id: id }) => id)) !== JSON.stringify(COSMIC_MATERIAL_IDS)) {
    throw new TypeError("Cosmic Material Runtime requires the approved twelve-material catalog");
  }
  const ledger = createBoundedLedgerRuntime({
    runtime: "COSMIC_MATERIAL_ALPHA",
    catalog: config,
    idField: "material_id",
    initialField: "initial_stock",
    valueField: "stock",
    storage,
    storageKey,
    auditPrefix: "cosmic-material-audit"
  });
  return Object.freeze({
    ...ledger,
    survey(materialId, quantity = 2) {
      return ledger.add(materialId, quantity, "REVIEWED_RESOURCE_SURVEY");
    }
  });
}
