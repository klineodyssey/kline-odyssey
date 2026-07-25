import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  K11520_RIGHT_CLASSES,
  adaptLandParcels,
  stampOrganismIntegrity
} from "../adapters/organism-schema-v2-adapter.js";
import { validateWorldFixture } from "../data/world-store.js";
import { createInspectorProjection } from "../inspector/inspector-view.js";
import { createLandRuntime } from "../land/land-runtime.js";
import { SelectionController } from "../selection/selection-controller.js";

const root = new URL("../", import.meta.url);
const world = validateWorldFixture(JSON.parse(await readFile(new URL("data/synthetic-world.json", root), "utf8")));
const candidates = JSON.parse(await readFile(new URL("data/schema-v2-land-candidates.json", root), "utf8"));
const sourceBefore = JSON.stringify(world);
let passed = 0;

async function test(name, callback) {
  await callback();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
}

async function rejects(code, callback) {
  await assert.rejects(callback, (error) => error?.code === code);
}

const adapted = await adaptLandParcels({
  legacyParcels: world.parcels,
  organismRecords: candidates.records,
  sandboxMode: true
});

await test("all 12 parcels remain available", () => assert.equal(adapted.length, 12));
await test("legacy parcel identifiers are preserved", () => assert.deepEqual(adapted.map(({ id }) => id), world.parcels.map(({ id }) => id)));
await test("Schema V2 candidates map 12 of 12", () => assert.equal(adapted.filter((p) => p.organism_schema_v2.source_mode === "SCHEMA_V2").length, 12));
await test("organism_id mapping is unique", () => assert.equal(new Set(adapted.map((p) => p.organism_schema_v2.organism_id)).size, 12));
await test("species_id maps to Land Parcel", () => assert.ok(adapted.every((p) => p.organism_schema_v2.species_id === "KAIOS_LAND_PARCEL_V1")));
await test("taxonomy has 12 levels", () => assert.ok(adapted.every((p) => Object.keys(p.organism_schema_v2.taxonomy).length === 12)));
await test("land-title class is explicit", () => assert.ok(adapted.every((p) => p.organism_schema_v2.land_title_class === "LAND_TITLE")));
await test("ownership remains separate", () => assert.ok(adapted.every((p) => p.organism_schema_v2.ownership_class === "OWNERSHIP")));
await test("occupancy remains separate", () => assert.ok(adapted.every((p) => p.organism_schema_v2.occupancy_class === "OCCUPANCY")));
await test("usage right remains separate", () => assert.ok(adapted.every((p) => p.organism_schema_v2.usage_right_class === "USAGE_RIGHT")));
await test("control authority remains separate", () => assert.ok(adapted.every((p) => p.organism_schema_v2.control_authority_class === "CONTROL_AUTHORITY")));
await test("building title is conditional", () => {
  assert.equal(adapted[0].organism_schema_v2.building_title_class, "CONDITIONAL_PRESENT");
  assert.ok(adapted.some((p) => p.organism_schema_v2.building_title_class === "NOT_APPLICABLE"));
});
await test("all ten K11520 right classes are projected", () => assert.deepEqual(Object.keys(adapted[0].organism_schema_v2.rights), [...K11520_RIGHT_CLASSES]));
await test("candidate integrity hashes verify", () => assert.ok(adapted.every((p) => p.organism_schema_v2.integrity_status === "CANDIDATE_HASH_VERIFIED")));
await test("malformed parcel is rejected", () => rejects("MALFORMED_PARCEL", () => adaptLandParcels({ legacyParcels: [{ id: "bad" }] })));
await test("missing Species is rejected", async () => {
  const manifest = structuredClone(candidates.records[0].organism_manifest);
  delete manifest.species_id;
  delete manifest.taxonomy.species;
  await rejects("MISSING_SPECIES", () => adaptLandParcels({
    legacyParcels: [world.parcels[0]],
    organismRecords: [{ source_parcel_id: "parcel-001", organism_manifest: manifest }]
  }));
});
await test("invalid taxonomy is rejected", async () => {
  const manifest = structuredClone(candidates.records[0].organism_manifest);
  manifest.taxonomy.species = "WRONG_SPECIES";
  await rejects("INVALID_TAXONOMY", () => adaptLandParcels({
    legacyParcels: [world.parcels[0]],
    organismRecords: [{ source_parcel_id: "parcel-001", organism_manifest: manifest }]
  }));
});
await test("duplicate organism_id is rejected", async () => {
  const first = candidates.records[0];
  const second = structuredClone(candidates.records[1]);
  second.organism_manifest.organism_id = first.organism_manifest.organism_id;
  second.organism_manifest = await stampOrganismIntegrity(second.organism_manifest);
  await rejects("DUPLICATE_ORGANISM_ID", () => adaptLandParcels({
    legacyParcels: world.parcels.slice(0, 2),
    organismRecords: [first, second]
  }));
});
await test("live integrity mismatch is rejected", async () => {
  const manifest = structuredClone(candidates.records[0].organism_manifest);
  manifest.status = "LIVE";
  await rejects("INTEGRITY_HASH_MISMATCH", () => adaptLandParcels({
    legacyParcels: [world.parcels[0]],
    organismRecords: [{ source_parcel_id: "parcel-001", organism_manifest: manifest }]
  }));
});
await test("candidate placeholders are accepted only in sandbox", async () => {
  let manifest = structuredClone(candidates.records[0].organism_manifest);
  manifest.organism_id = "AUTO_GENERATE";
  manifest = await stampOrganismIntegrity(manifest);
  const records = [{ source_parcel_id: "parcel-001", organism_manifest: manifest }];
  assert.equal((await adaptLandParcels({ legacyParcels: [world.parcels[0]], organismRecords: records, sandboxMode: true })).length, 1);
  await rejects("PLACEHOLDER_NOT_ALLOWED", () => adaptLandParcels({ legacyParcels: [world.parcels[0]], organismRecords: records, sandboxMode: false }));
});
await test("legacy-only adaptation remains supported", async () => {
  const legacy = await adaptLandParcels({ legacyParcels: [world.parcels[0]] });
  assert.equal(legacy[0].organism_schema_v2.source_mode, "LEGACY_ADAPTER");
});
await test("Inspector exposes Schema V2 projection", () => {
  const projection = createInspectorProjection({
    world: { ...world, parcels: adapted },
    selection: { type: "LAND_PARCEL", id: "parcel-001" }
  });
  assert.equal(projection.schemaV2Data["Species ID"], "KAIOS_LAND_PARCEL_V1");
  assert.equal(projection.schemaV2Data["Land Title"], "LAND_TITLE");
  assert.match(projection.schemaV2Data["Safety Labels"], /NO_REAL_SETTLEMENT/);
});
await test("selection behavior remains unchanged", () => {
  const selection = new SelectionController();
  selection.select("parcel-001", { entityType: "LAND_PARCEL" });
  assert.equal(selection.snapshot().selectedId, "parcel-001");
});
await test("proposal history remains available", () => {
  const land = createLandRuntime({ world: { ...world, parcels: adapted } });
  assert.ok(Array.isArray(land.getParcelSnapshot("parcel-001").proposal_history));
  land.destroy();
});
await test("revision selection remains available", () => {
  const land = createLandRuntime({ world: { ...world, parcels: adapted } });
  assert.equal(land.getParcelSnapshot("parcel-001", "parcel-001-r1").revision_viewer.selected_revision.revision_id, "parcel-001-r1");
  land.destroy();
});
await test("adapter does not mutate source parcels", () => assert.equal(JSON.stringify(world), sourceBefore));
await test("no ownership mutation is introduced", () => assert.ok(adapted.every((p, i) => p.owner_id === world.parcels[i].owner_id)));
await test("no wallet is created", () => assert.ok(adapted.every((p) => p.organism_schema_v2.wallet_active === false)));
await test("no settlement is activated", () => assert.ok(adapted.every((p) => p.organism_schema_v2.settlement_active === false)));
await test("no Runtime is activated", () => assert.ok(adapted.every((p) => p.organism_schema_v2.runtime_active === false)));
await test("dry-run output preserves source fixture", () => {
  assert.equal(candidates.source_data_modified, false);
  assert.equal(candidates.operation, "DRY_RUN");
  assert.equal(candidates.activation_status, "NOT_ACTIVE");
});
await test("dry-run utility rejects source fixture overwrite", () => {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL("../tools/migrate-land-parcels-v2.mjs", import.meta.url)),
      "--output",
      fileURLToPath(new URL("../data/synthetic-world.json", import.meta.url))
    ],
    { encoding: "utf8" }
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must not overwrite the source fixture/);
});
await test("protected authority remains false", () => assert.ok(candidates.records.every((entry) => (
  entry.organism_manifest.release.runtime_authority === false
  && entry.organism_manifest.release.wallet_authority === false
  && entry.organism_manifest.release.exchange_settlement === false
))));

assert.equal(passed, 33);
console.log(`RESULT ${passed}/33 PASS`);
