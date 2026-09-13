import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  MultiverseLifeTaxPaperRuntime,
  REQUIRED_TAX_CLASSES,
  REQUIRED_UNIVERSE_SYMBOLS,
  calculateProgressiveTaxReference,
  classifyPlanetaryLife,
  validateTaxSourceRegistry,
  validateUniverseRegistry
} from "./multiverse-life-tax-simulator.mjs";

const registry = JSON.parse(readFileSync(new URL("./universe-registry.candidate.json", import.meta.url), "utf8"));
const taxCatalog = JSON.parse(readFileSync(new URL("./tax-source-registry.candidate.json", import.meta.url), "utf8"));
const schema = JSON.parse(readFileSync(new URL("./multiverse-life-tax.schema.json", import.meta.url), "utf8"));

function fresh() {
  return new MultiverseLifeTaxPaperRuntime({
    registry: structuredClone(registry),
    taxCatalog: structuredClone(taxCatalog)
  });
}

function addLife(runtime, {
  suffix = "001",
  universeId = "KGEN_MARKET_UNIVERSE",
  birthPlanetId = "EARTH",
  currentPlanetId = birthPlanetId,
  bornAt = "2026-08-23T17:31:07+08:00"
} = {}) {
  return runtime.registerLife({
    lifeId: `LIFE-PAPER-${suffix}`,
    universeId,
    birthPlanetId,
    currentPlanetId,
    mapId: `MAP-PAPER-${suffix}`,
    walletRef: `WALLET-PAPER-${suffix}`,
    bornAt,
    fluidBalance: "1000"
  });
}

function singleCompany(runtime, authorizedLifeIds = ["LIFE-PAPER-001"]) {
  return runtime.registerCompany({
    companyId: "COMPANY-PAPER-001",
    scope: "SINGLE_UNIVERSE",
    registrationUniverseId: "KGEN_MARKET_UNIVERSE",
    universeEntities: [{
      universeId: "KGEN_MARKET_UNIVERSE",
      entityId: "ENTITY-KGEN-001",
      ledgerId: "LEDGER-KGEN-001",
      walletRef: "COMPANY-WALLET-KGEN-001"
    }],
    authorizedLifeIds,
    registeredAt: "2026-08-23T17:31:08+08:00"
  });
}

test("candidate registries are parseable and satisfy fail-closed validation", () => {
  assert.equal(validateUniverseRegistry(registry), true);
  assert.equal(validateTaxSourceRegistry(taxCatalog), true);
});

test("formal registry schema closes every object definition", () => {
  const visit = (node, pointer = "#") => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    if (node.type === "object") assert.equal(node.additionalProperties, false, pointer);
    for (const [key, value] of Object.entries(node)) visit(value, `${pointer}/${key}`);
  };
  visit(schema);
});

test("all five requested market universes exist with separate K18888 authorities", () => {
  assert.deepEqual(registry.market_universes.map((item) => item.symbol), REQUIRED_UNIVERSE_SYMBOLS);
  assert.equal(new Set(registry.market_universes.map((item) => item.tax_authority_id)).size, 5);
  assert.ok(registry.market_universes.every((item) => item.company_registry_status === "NOT_CREATED"));
});

test("parallel market universes stay on Earth and do not become alien planets", () => {
  for (const universe of registry.market_universes) {
    assert.equal(universe.host_planet_id, "EARTH");
    assert.equal(universe.planet_frame_id, "EARTH_K280_SURFACE_V1_CANDIDATE");
    assert.equal(universe.life_classification, "EARTH_PARALLEL_MARKET_UNIVERSE_AI_LIFE");
  }
});

test("Earth K280 and Mars use distinct planet-centered surface frames", () => {
  const earth = registry.planet_frames.find((item) => item.planet_id === "EARTH");
  const mars = registry.planet_frames.find((item) => item.planet_id === "MARS");
  assert.equal(earth.surface_anchor, "K280");
  assert.equal(earth.origin, "EARTH_CENTER_OF_MASS");
  assert.equal(mars.origin, "MARS_CENTER_OF_MASS");
  assert.equal(mars.local_origin_label, "MARS/K0");
  assert.notEqual(earth.frame_id, mars.frame_id);
});

test("KDNA remains a proposed Earth market universe and is not falsely deployed", () => {
  const kdna = registry.market_universes.find((item) => item.symbol === "KDNA");
  assert.equal(kdna.asset_status, "HUMAN_PROPOSED_NOT_FOUND_DEPLOYED");
  assert.equal(kdna.universe_state, "PAPER_SIMULATION_ONLY");
});

test("planetary classification distinguishes market universes from planets", () => {
  assert.equal(classifyPlanetaryLife({ birthPlanetId: "EARTH", currentPlanetId: "EARTH" }), "EARTH_PARALLEL_MARKET_UNIVERSE_AI_LIFE");
  assert.equal(classifyPlanetaryLife({ birthPlanetId: "MARS", currentPlanetId: "MARS" }), "MARTIAN_LIFE");
  assert.equal(classifyPlanetaryLife({ birthPlanetId: "EARTH", currentPlanetId: "MARS" }), "EARTH_ORIGIN_EXTRATERRESTRIAL_ON_MARS");
  assert.equal(classifyPlanetaryLife({ birthPlanetId: "MARS", currentPlanetId: "EARTH" }), "MARTIAN_EXTRATERRESTRIAL_ON_EARTH");
});

test("one map binds to one Life even across market universes", () => {
  const runtime = fresh();
  addLife(runtime);
  assert.throws(() => runtime.registerLife({
    lifeId: "LIFE-PAPER-002",
    universeId: "KAIOS_MARKET_UNIVERSE",
    birthPlanetId: "EARTH",
    mapId: "MAP-PAPER-001",
    walletRef: "WALLET-PAPER-002",
    bornAt: "2026-08-23T17:31:08+08:00"
  }), { code: "MAP_ALREADY_BOUND_TO_LIFE" });
});

test("parallel Lives cannot share a personal wallet reference", () => {
  const runtime = fresh();
  addLife(runtime);
  assert.throws(() => runtime.registerLife({
    lifeId: "LIFE-PAPER-002",
    universeId: "KSHIP_MARKET_UNIVERSE",
    birthPlanetId: "EARTH",
    mapId: "MAP-PAPER-002",
    walletRef: "WALLET-PAPER-001",
    bornAt: "2026-08-23T17:31:08+08:00"
  }), { code: "PERSONAL_WALLET_SHARED_ACROSS_LIVES" });
});

test("parallel Lives require distinct Life IDs", () => {
  const runtime = fresh();
  addLife(runtime);
  assert.throws(() => addLife(runtime, { universeId: "KUFO_MARKET_UNIVERSE" }), { code: "DUPLICATE_LIFE" });
});

test("a paper heartbeat moves Life fluid without creating or destroying it", () => {
  const runtime = fresh();
  addLife(runtime);
  const pulse = runtime.pulseLife({
    pulseId: "PULSE-001",
    lifeId: "LIFE-PAPER-001",
    occurredAt: "2026-08-23T17:31:08+08:00",
    fromOrgan: "HEART",
    toOrgan: "BRAIN",
    amount: "100",
    totalFluidBefore: "1000",
    totalFluidAfter: "1000"
  });
  assert.equal(pulse.heartbeat_sequence, 1);
  assert.equal(pulse.conservation_status, "PASS");
});

test("Life circulation rejects fluid duplication or loss", () => {
  const runtime = fresh();
  addLife(runtime);
  assert.throws(() => runtime.pulseLife({
    pulseId: "PULSE-001",
    lifeId: "LIFE-PAPER-001",
    occurredAt: "2026-08-23T17:31:08+08:00",
    fromOrgan: "HEART",
    toOrgan: "BODY",
    amount: "100",
    totalFluidBefore: "1000",
    totalFluidAfter: "1001"
  }), { code: "LIFE_FLUID_CONSERVATION_FAILED" });
});

test("heartbeat IDs are replay protected", () => {
  const runtime = fresh();
  addLife(runtime);
  const pulse = {
    pulseId: "PULSE-001",
    lifeId: "LIFE-PAPER-001",
    occurredAt: "2026-08-23T17:31:08+08:00",
    fromOrgan: "HEART",
    toOrgan: "BODY",
    amount: "100",
    totalFluidBefore: "1000",
    totalFluidAfter: "1000"
  };
  runtime.pulseLife(pulse);
  assert.throws(() => runtime.pulseLife({ ...pulse, occurredAt: "2026-08-23T17:31:09+08:00" }), { code: "PULSE_REPLAY" });
});

test("heartbeat timestamps must increase", () => {
  const runtime = fresh();
  addLife(runtime);
  assert.throws(() => runtime.pulseLife({
    pulseId: "PULSE-001",
    lifeId: "LIFE-PAPER-001",
    occurredAt: "2026-08-23T17:31:07+08:00",
    fromOrgan: "HEART",
    toOrgan: "BODY",
    amount: "1",
    totalFluidBefore: "1000",
    totalFluidAfter: "1000"
  }), { code: "NON_MONOTONIC_HEARTBEAT" });
});

test("a dormant Life cannot heartbeat", () => {
  const runtime = fresh();
  addLife(runtime);
  runtime.setLifeStatus({ lifeId: "LIFE-PAPER-001", status: "PAPER_DORMANT", occurredAt: "2026-08-23T17:31:08+08:00" });
  assert.throws(() => runtime.pulseLife({
    pulseId: "PULSE-001",
    lifeId: "LIFE-PAPER-001",
    occurredAt: "2026-08-23T17:31:09+08:00",
    fromOrgan: "HEART",
    toOrgan: "BODY",
    amount: "1",
    totalFluidBefore: "1000",
    totalFluidAfter: "1000"
  }), { code: "LIFE_NOT_ACTIVE" });
});

test("a parcel must use its own planet surface frame", () => {
  const runtime = fresh();
  addLife(runtime);
  assert.throws(() => runtime.registerParcel({
    parcelId: "PARCEL-001",
    universeId: "KGEN_MARKET_UNIVERSE",
    planetId: "EARTH",
    planetFrameId: "MARS_CENTERED_SURFACE_V1_REFERENCE",
    ownerLifeId: "LIFE-PAPER-001",
    registeredAt: "2026-08-23T17:31:08+08:00"
  }), { code: "PARCEL_PLANET_FRAME_MISMATCH" });
});

test("one parcel accepts only one primary mansion, residence, mall or factory", () => {
  const runtime = fresh();
  addLife(runtime);
  runtime.registerParcel({
    parcelId: "PARCEL-001",
    universeId: "KGEN_MARKET_UNIVERSE",
    planetId: "EARTH",
    planetFrameId: "EARTH_K280_SURFACE_V1_CANDIDATE",
    ownerLifeId: "LIFE-PAPER-001",
    registeredAt: "2026-08-23T17:31:08+08:00"
  });
  const structure = runtime.buildPrimaryStructure({
    structureId: "HOUSE-001",
    parcelId: "PARCEL-001",
    structureType: "RESIDENCE",
    builtAt: "2026-08-23T17:31:09+08:00"
  });
  assert.equal(structure.structure_type, "RESIDENCE");
  assert.equal(structure.real_world_building_created, false);
  assert.throws(() => runtime.buildPrimaryStructure({
    structureId: "MALL-001",
    parcelId: "PARCEL-001",
    structureType: "MALL",
    builtAt: "2026-08-23T17:31:10+08:00"
  }), { code: "PARCEL_PRIMARY_STRUCTURE_ALREADY_EXISTS" });
});

test("unlisted primary building types fail closed", () => {
  const runtime = fresh();
  addLife(runtime);
  runtime.registerParcel({
    parcelId: "PARCEL-001",
    universeId: "KGEN_MARKET_UNIVERSE",
    planetId: "EARTH",
    planetFrameId: "EARTH_K280_SURFACE_V1_CANDIDATE",
    ownerLifeId: "LIFE-PAPER-001",
    registeredAt: "2026-08-23T17:31:08+08:00"
  });
  assert.throws(() => runtime.buildPrimaryStructure({
    structureId: "CASTLE-001",
    parcelId: "PARCEL-001",
    structureType: "CASTLE",
    builtAt: "2026-08-23T17:31:09+08:00"
  }), { code: "STRUCTURE_TYPE_INVALID" });
});

test("a small company remains confined to one registered universe", () => {
  const runtime = fresh();
  addLife(runtime);
  const company = singleCompany(runtime);
  assert.equal(company.scope, "SINGLE_UNIVERSE");
  assert.equal(company.universe_entities.length, 1);
  assert.equal(company.real_company_created, false);
});

test("a cross-market group requires multiple separately accounted universe entities", () => {
  const runtime = fresh();
  addLife(runtime);
  const company = runtime.registerCompany({
    companyId: "COMPANY-GROUP-001",
    scope: "CROSS_MARKET_GROUP",
    registrationUniverseId: "KGEN_MARKET_UNIVERSE",
    universeEntities: [
      { universeId: "KGEN_MARKET_UNIVERSE", entityId: "ENTITY-KGEN-001", ledgerId: "LEDGER-KGEN-001", walletRef: "COMPANY-WALLET-KGEN-001" },
      { universeId: "KAIOS_MARKET_UNIVERSE", entityId: "ENTITY-KAIOS-001", ledgerId: "LEDGER-KAIOS-001", walletRef: "COMPANY-WALLET-KAIOS-001" }
    ],
    authorizedLifeIds: ["LIFE-PAPER-001"],
    registeredAt: "2026-08-23T17:31:08+08:00"
  });
  assert.equal(company.scope, "CROSS_MARKET_GROUP");
  assert.equal(new Set(company.universe_entities.map((item) => item.ledgerId)).size, 2);
  assert.equal(new Set(company.universe_entities.map((item) => item.walletRef)).size, 2);
});

test("cross-market entities cannot share a ledger or wallet", () => {
  const runtime = fresh();
  addLife(runtime);
  assert.throws(() => runtime.registerCompany({
    companyId: "COMPANY-GROUP-001",
    scope: "CROSS_MARKET_GROUP",
    registrationUniverseId: "KGEN_MARKET_UNIVERSE",
    universeEntities: [
      { universeId: "KGEN_MARKET_UNIVERSE", entityId: "ENTITY-KGEN-001", ledgerId: "LEDGER-SHARED", walletRef: "COMPANY-WALLET-SHARED" },
      { universeId: "KAIOS_MARKET_UNIVERSE", entityId: "ENTITY-KAIOS-001", ledgerId: "LEDGER-SHARED", walletRef: "COMPANY-WALLET-SHARED" }
    ],
    authorizedLifeIds: ["LIFE-PAPER-001"],
    registeredAt: "2026-08-23T17:31:08+08:00"
  }), { code: "COMPANY_LEDGER_SHARED_ACROSS_UNIVERSES" });
});

test("receiving an order records business activity but not realized revenue", () => {
  const runtime = fresh();
  addLife(runtime);
  singleCompany(runtime);
  const order = runtime.acceptOrder({
    orderId: "ORDER-001",
    companyId: "COMPANY-PAPER-001",
    workerLifeId: "LIFE-PAPER-001",
    receivedAt: "2026-08-23T17:31:09+08:00",
    quotedAmount: "100000",
    currency: "TWD"
  });
  assert.equal(order.status, "ORDER_RECEIVED");
  assert.equal(order.revenue_recognized, false);
  assert.equal(order.recognized_revenue, "0");
  assert.equal(runtime.snapshot().tax_events, 0);
});

test("accepted delivery plus settlement evidence creates a paper company tax event", () => {
  const runtime = fresh();
  addLife(runtime);
  singleCompany(runtime);
  runtime.acceptOrder({
    orderId: "ORDER-001",
    companyId: "COMPANY-PAPER-001",
    workerLifeId: "LIFE-PAPER-001",
    receivedAt: "2026-08-23T17:31:09+08:00",
    quotedAmount: "100000",
    currency: "TWD"
  });
  const completed = runtime.completeOrder({
    orderId: "ORDER-001",
    workerLifeId: "LIFE-PAPER-001",
    universeId: "KGEN_MARKET_UNIVERSE",
    deliveredAt: "2026-08-23T17:31:10+08:00",
    deliveryAccepted: true,
    settlementEvidenceStatus: "SETTLED_OR_LEGALLY_RECOGNIZED_PAPER",
    recognizedRevenue: "100000"
  });
  assert.equal(completed.status, "PAPER_REVENUE_RECOGNIZED");
  assert.equal(runtime.snapshot().tax_events, 1);
  assert.equal(runtime.taxEvents.get(completed.tax_event_id).tax_authority_id, "K18888_KGEN_PAPER");
  assert.equal(runtime.taxEvents.get(completed.tax_event_id).payment_status, "NOT_PAID_PAPER_ONLY");
});

test("an order cannot recognize revenue without delivery and evidence", () => {
  const runtime = fresh();
  addLife(runtime);
  singleCompany(runtime);
  runtime.acceptOrder({
    orderId: "ORDER-001",
    companyId: "COMPANY-PAPER-001",
    workerLifeId: "LIFE-PAPER-001",
    receivedAt: "2026-08-23T17:31:09+08:00",
    quotedAmount: "100000",
    currency: "TWD"
  });
  assert.throws(() => runtime.completeOrder({
    orderId: "ORDER-001",
    workerLifeId: "LIFE-PAPER-001",
    universeId: "KGEN_MARKET_UNIVERSE",
    deliveredAt: "2026-08-23T17:31:10+08:00",
    deliveryAccepted: false,
    settlementEvidenceStatus: "NONE",
    recognizedRevenue: "100000"
  }), { code: "DELIVERY_ACCEPTANCE_REQUIRED" });
});

test("another authorized Life can continue when the first Life is dormant", () => {
  const runtime = fresh();
  addLife(runtime, { suffix: "001" });
  addLife(runtime, { suffix: "002", universeId: "KAIOS_MARKET_UNIVERSE" });
  singleCompany(runtime, ["LIFE-PAPER-001", "LIFE-PAPER-002"]);
  runtime.acceptOrder({
    orderId: "ORDER-001",
    companyId: "COMPANY-PAPER-001",
    workerLifeId: "LIFE-PAPER-001",
    receivedAt: "2026-08-23T17:31:09+08:00",
    quotedAmount: "100000",
    currency: "TWD"
  });
  runtime.setLifeStatus({ lifeId: "LIFE-PAPER-001", status: "PAPER_DORMANT", occurredAt: "2026-08-23T17:31:10+08:00" });
  const completed = runtime.completeOrder({
    orderId: "ORDER-001",
    workerLifeId: "LIFE-PAPER-002",
    universeId: "KGEN_MARKET_UNIVERSE",
    deliveredAt: "2026-08-23T17:31:11+08:00",
    deliveryAccepted: true,
    settlementEvidenceStatus: "SETTLED_OR_LEGALLY_RECOGNIZED_PAPER",
    recognizedRevenue: "100000"
  });
  assert.equal(completed.completed_by_life_id, "LIFE-PAPER-002");
});

test("the affected company function fails closed when no authorized Life is active", () => {
  const runtime = fresh();
  addLife(runtime);
  singleCompany(runtime);
  runtime.acceptOrder({
    orderId: "ORDER-001",
    companyId: "COMPANY-PAPER-001",
    workerLifeId: "LIFE-PAPER-001",
    receivedAt: "2026-08-23T17:31:09+08:00",
    quotedAmount: "100000",
    currency: "TWD"
  });
  runtime.setLifeStatus({ lifeId: "LIFE-PAPER-001", status: "PAPER_DORMANT", occurredAt: "2026-08-23T17:31:10+08:00" });
  assert.throws(() => runtime.completeOrder({
    orderId: "ORDER-001",
    workerLifeId: "LIFE-PAPER-001",
    universeId: "KGEN_MARKET_UNIVERSE",
    deliveredAt: "2026-08-23T17:31:11+08:00",
    deliveryAccepted: true,
    settlementEvidenceStatus: "SETTLED_OR_LEGALLY_RECOGNIZED_PAPER",
    recognizedRevenue: "100000"
  }), { code: "ACTIVE_AUTHORIZED_WORKER_REQUIRED" });
  assert.equal(runtime.snapshot().companies, 1);
});

test("every material appearance creates a tax profile without inventing tax due", () => {
  const runtime = fresh();
  addLife(runtime);
  const event = runtime.recordMaterialAppearance({
    materialId: "MATERIAL-001",
    universeId: "KGEN_MARKET_UNIVERSE",
    ownerLifeId: "LIFE-PAPER-001",
    quantity: "1",
    unit: "KGEN_MASS_UNIT",
    appearedAt: "2026-08-23T17:31:08+08:00"
  });
  assert.equal(event.tax_class, "MATERIAL_APPEARANCE_TAX_PROFILE");
  assert.equal(event.amount_due, null);
  assert.equal(event.calculation_status, "OFFICIAL_EFFECTIVE_RULE_REVIEW_REQUIRED");
});

test("official tax catalog includes the full referenced national and local class set", () => {
  assert.deepEqual(taxCatalog.tax_classes.map((item) => item.code), REQUIRED_TAX_CLASSES);
  assert.ok(taxCatalog.official_sources.every((item) => item.url.startsWith("https://www.etax.nat.gov.tw/")));
});

test("2026 Taiwan resident progressive reference computes 1,000,000 TWD as 77,300 TWD", () => {
  assert.equal(calculateProgressiveTaxReference({
    taxableIncome: "1000000",
    brackets: taxCatalog.individual_income_tax_2026_reference.brackets
  }), "77300");
  assert.equal(fresh().calculateIndividualIncomeTax2026Reference("1000000").payment_status, "NOT_PAID");
});

test("paper runtime cannot file or pay real tax", () => {
  assert.throws(() => fresh().markTaxPaid(), { code: "REAL_TAX_PAYMENT_FORBIDDEN" });
});

test("candidate registry creates no formal Life, company or real-world state", () => {
  const runtime = fresh();
  assert.deepEqual(runtime.snapshot(), {
    mode: "PAPER_SIMULATION_ONLY",
    lives: 0,
    maps: 0,
    parcels: 0,
    companies: 0,
    orders: 0,
    materials: 0,
    tax_events: 0,
    real_world_state_changed: false,
    chain_state_changed: false
  });
  assert.equal(registry.long_horizon.one_hundred_million_year_survival_guarantee, false);
});
