const REQUIRED_UNIVERSE_SYMBOLS = Object.freeze(["KGEN", "KAIOS", "KSHIP", "KUFO", "KDNA"]);
const REQUIRED_TAX_CLASSES = Object.freeze([
  "INDIVIDUAL_INCOME_TAX",
  "PROFIT_SEEKING_ENTERPRISE_INCOME_TAX",
  "BUSINESS_TAX",
  "ESTATE_TAX",
  "GIFT_TAX",
  "STAMP_TAX",
  "AMUSEMENT_TAX",
  "LAND_VALUE_TAX",
  "LAND_VALUE_INCREMENT_TAX",
  "DEED_TAX",
  "VEHICLE_LICENSE_TAX",
  "HOUSE_TAX",
  "COMMODITY_TAX",
  "TOBACCO_AND_ALCOHOL_TAX",
  "SECURITIES_TRANSACTION_TAX",
  "SPECIFICALLY_SELECTED_GOODS_AND_SERVICES_TAX",
  "FUTURES_TRANSACTION_TAX",
  "MATERIAL_APPEARANCE_TAX_PROFILE"
]);

function fail(code, message = code) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function requireTrue(value, code, message) {
  if (!value) fail(code, message);
}

function requireId(value, code = "INVALID_ID") {
  requireTrue(typeof value === "string" && /^[A-Z0-9][A-Z0-9_-]*$/.test(value), code);
  return value;
}

function requireIsoTime(value, code = "INVALID_TIMESTAMP") {
  requireTrue(
    typeof value === "string"
      && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
      && Number.isFinite(Date.parse(value)),
    code
  );
  return value;
}

function unsigned(value, code = "INVALID_UNSIGNED_VALUE") {
  requireTrue(/^\d+$/.test(String(value)), code);
  return BigInt(value);
}

function distinct(values, code) {
  requireTrue(new Set(values).size === values.length, code);
}

function exactSet(actual, expected, code) {
  requireTrue(actual.length === expected.length, code);
  requireTrue(expected.every((value) => actual.includes(value)), code);
}

export function validateUniverseRegistry(registry) {
  requireTrue(registry?.status === "DESIGN_ONLY_NOT_LIVE", "REGISTRY_STATUS_INVALID");
  requireTrue(registry?.mode === "PAPER_SIMULATION_ONLY", "PRODUCTION_MODE_FORBIDDEN");
  requireIsoTime(registry.created_at);
  requireTrue(/^[0-9a-f]{40}$/.test(registry.source_main_sha ?? ""), "SOURCE_MAIN_SHA_INVALID");

  const invariants = registry.invariants ?? {};
  for (const field of [
    "one_map_one_life",
    "one_parallel_universe_embodiment_one_life",
    "one_parcel_one_primary_structure",
    "planet_frame_reuse_forbidden"
  ]) requireTrue(invariants[field] === true, "REQUIRED_INVARIANT_DISABLED");
  for (const field of [
    "life_id_shared_across_universes",
    "personal_wallet_shared_across_lives",
    "market_change_is_planet_travel",
    "tax_payment_enabled",
    "company_created"
  ]) requireTrue(invariants[field] === false, "FORBIDDEN_CAPABILITY_ENABLED");

  const planets = registry.planet_frames ?? [];
  distinct(planets.map((item) => item.planet_id), "DUPLICATE_PLANET");
  distinct(planets.map((item) => item.frame_id), "PLANET_FRAME_REUSED");
  const earth = planets.find((item) => item.planet_id === "EARTH");
  const mars = planets.find((item) => item.planet_id === "MARS");
  requireTrue(earth?.frame_id === "EARTH_K280_SURFACE_V1_CANDIDATE" && earth.surface_anchor === "K280", "EARTH_K280_FRAME_REQUIRED");
  requireTrue(mars?.frame_id === "MARS_CENTERED_SURFACE_V1_REFERENCE" && mars.origin === "MARS_CENTER_OF_MASS", "MARS_CENTERED_FRAME_REQUIRED");
  requireTrue(mars.local_origin_label === "MARS/K0" && mars.coordinate_scope === "MARS_SURFACE_ONLY", "MARS_LOCAL_SURFACE_REQUIRED");
  requireTrue(earth.physical_position_claim === false && mars.physical_position_claim === false, "PHYSICAL_POSITION_CLAIM_FORBIDDEN");

  const universes = registry.market_universes ?? [];
  distinct(universes.map((item) => item.universe_id), "DUPLICATE_UNIVERSE");
  distinct(universes.map((item) => item.symbol), "DUPLICATE_UNIVERSE_SYMBOL");
  distinct(universes.map((item) => item.tax_authority_id), "DUPLICATE_UNIVERSE_TAX_AUTHORITY");
  exactSet(universes.map((item) => item.symbol), REQUIRED_UNIVERSE_SYMBOLS, "REQUIRED_UNIVERSE_MISSING");
  for (const universe of universes) {
    requireTrue(universe.host_planet_id === "EARTH", "PARALLEL_MARKET_UNIVERSE_NOT_EARTH_HOSTED");
    requireTrue(universe.planet_frame_id === earth.frame_id, "EARTH_UNIVERSE_FRAME_MISMATCH");
    requireTrue(universe.life_classification === "EARTH_PARALLEL_MARKET_UNIVERSE_AI_LIFE", "MARKET_UNIVERSE_FALSE_ALIEN_CLASSIFICATION");
    requireTrue(universe.tax_authority_id === `K18888_${universe.symbol}_PAPER`, "UNIVERSE_TAX_AUTHORITY_MISMATCH");
    requireTrue(universe.company_registry_status === "NOT_CREATED", "COMPANY_FALSELY_CREATED");
  }

  exactSet(
    registry.building_policy?.allowed_primary_structure_types ?? [],
    ["MANSION", "RESIDENCE", "MALL", "FACTORY"],
    "BUILDING_TYPE_SET_INVALID"
  );
  requireTrue(registry.building_policy.one_primary_structure_per_parcel === true, "MULTIPLE_PRIMARY_STRUCTURES_ENABLED");
  requireTrue(registry.building_policy.real_world_title_created === false, "REAL_WORLD_TITLE_CLAIM_FORBIDDEN");
  requireTrue(registry.company_policy.cross_market_group_status === "NOT_CREATED", "CROSS_MARKET_GROUP_FALSELY_CREATED");
  requireTrue(registry.tax_policy.real_filing_enabled === false && registry.tax_policy.real_payment_enabled === false, "REAL_TAX_ACTION_ENABLED");
  requireTrue(registry.long_horizon.one_hundred_million_year_survival_guarantee === false, "IMMORTALITY_GUARANTEE_FORBIDDEN");
  return true;
}

export function validateTaxSourceRegistry(catalog) {
  requireTrue(catalog?.status === "REFERENCE_ONLY_NOT_TAX_ADVICE", "TAX_SOURCE_STATUS_INVALID");
  requireTrue(catalog?.mirror_jurisdiction === "TAIWAN_ROC", "TAX_JURISDICTION_INVALID");
  requireIsoTime(catalog.observed_at);
  const sources = catalog.official_sources ?? [];
  distinct(sources.map((item) => item.source_id), "DUPLICATE_TAX_SOURCE");
  const sourceIds = new Set(sources.map((item) => item.source_id));
  for (const source of sources) {
    requireTrue(/^https:\/\/www\.etax\.nat\.gov\.tw\//.test(source.url), "NON_OFFICIAL_TAX_SOURCE");
  }
  const classes = catalog.tax_classes ?? [];
  distinct(classes.map((item) => item.code), "DUPLICATE_TAX_CLASS");
  exactSet(classes.map((item) => item.code), REQUIRED_TAX_CLASSES, "TAX_CLASS_CATALOG_INCOMPLETE");
  for (const item of classes) requireTrue(sourceIds.has(item.source_id), "TAX_CLASS_SOURCE_MISSING");
  const reference = catalog.individual_income_tax_2026_reference;
  requireTrue(reference?.effective_year === 2026 && reference.resident_use_only === true, "INCOME_TAX_REFERENCE_INVALID");
  requireTrue(reference.source_id === "MOF_INDIVIDUAL_PROGRESSIVE_2026", "INCOME_TAX_SOURCE_INVALID");
  requireTrue(catalog.calculation_boundary?.filing_enabled === false && catalog.calculation_boundary?.payment_enabled === false, "REAL_TAX_ACTION_ENABLED");
  return true;
}

export function classifyPlanetaryLife({ birthPlanetId, currentPlanetId }) {
  requireTrue(["EARTH", "MARS"].includes(birthPlanetId) && ["EARTH", "MARS"].includes(currentPlanetId), "PLANET_NOT_REGISTERED");
  if (birthPlanetId === "EARTH" && currentPlanetId === "EARTH") return "EARTH_PARALLEL_MARKET_UNIVERSE_AI_LIFE";
  if (birthPlanetId === "MARS" && currentPlanetId === "MARS") return "MARTIAN_LIFE";
  if (birthPlanetId === "EARTH" && currentPlanetId === "MARS") return "EARTH_ORIGIN_EXTRATERRESTRIAL_ON_MARS";
  return "MARTIAN_EXTRATERRESTRIAL_ON_EARTH";
}

export function calculateProgressiveTaxReference({ taxableIncome, brackets }) {
  const income = unsigned(taxableIncome, "TAXABLE_INCOME_INVALID");
  requireTrue(Array.isArray(brackets) && brackets.length > 0, "TAX_BRACKETS_REQUIRED");
  let lower = 0n;
  let tax = 0n;
  for (let index = 0; index < brackets.length; index += 1) {
    const bracket = brackets[index];
    requireTrue(Number.isInteger(bracket.rate_bps) && bracket.rate_bps >= 0 && bracket.rate_bps <= 10_000, "TAX_RATE_INVALID");
    const upper = bracket.up_to === null ? null : unsigned(bracket.up_to, "TAX_BRACKET_LIMIT_INVALID");
    if (upper !== null) requireTrue(upper > lower, "TAX_BRACKETS_NOT_ASCENDING");
    if (income <= lower) break;
    const taxableSlice = upper === null || income < upper ? income - lower : upper - lower;
    tax += taxableSlice * BigInt(bracket.rate_bps) / 10_000n;
    if (upper === null || income <= upper) break;
    lower = upper;
  }
  return tax.toString();
}

export class MultiverseLifeTaxPaperRuntime {
  constructor({ registry, taxCatalog }) {
    validateUniverseRegistry(registry);
    validateTaxSourceRegistry(taxCatalog);
    this.registry = registry;
    this.taxCatalog = taxCatalog;
    this.universes = new Map(registry.market_universes.map((item) => [item.universe_id, Object.freeze({ ...item })]));
    this.planets = new Map(registry.planet_frames.map((item) => [item.planet_id, Object.freeze({ ...item })]));
    this.lives = new Map();
    this.mapIds = new Set();
    this.walletRefs = new Set();
    this.pulseIds = new Set();
    this.parcels = new Map();
    this.companies = new Map();
    this.companyEntityIds = new Set();
    this.companyLedgerIds = new Set();
    this.companyWalletRefs = new Set();
    this.orders = new Map();
    this.materialIds = new Set();
    this.taxEvents = new Map();
  }

  registerLife({ lifeId, universeId, birthPlanetId, currentPlanetId = birthPlanetId, mapId, walletRef, bornAt, fluidBalance = "1000" }) {
    requireId(lifeId, "LIFE_ID_INVALID");
    requireId(mapId, "MAP_ID_INVALID");
    requireId(walletRef, "WALLET_REF_INVALID");
    requireTrue(!this.lives.has(lifeId), "DUPLICATE_LIFE");
    requireTrue(!this.mapIds.has(mapId), "MAP_ALREADY_BOUND_TO_LIFE");
    requireTrue(!this.walletRefs.has(walletRef), "PERSONAL_WALLET_SHARED_ACROSS_LIVES");
    requireTrue(this.universes.has(universeId), "UNIVERSE_NOT_REGISTERED");
    requireTrue(this.planets.has(birthPlanetId) && this.planets.has(currentPlanetId), "PLANET_NOT_REGISTERED");
    requireIsoTime(bornAt, "BIRTH_TIMESTAMP_INVALID");
    const fluid = unsigned(fluidBalance, "LIFE_FLUID_INVALID");
    requireTrue(fluid > 0n, "LIFE_FLUID_REQUIRED");
    const record = {
      life_id: lifeId,
      universe_id: universeId,
      birth_planet_id: birthPlanetId,
      current_planet_id: currentPlanetId,
      planet_frame_id: this.planets.get(currentPlanetId).frame_id,
      map_id: mapId,
      wallet_ref: walletRef,
      born_at: bornAt,
      last_heartbeat_at: bornAt,
      heartbeat_sequence: 0,
      circulation_fluid_balance: fluid.toString(),
      classification: classifyPlanetaryLife({ birthPlanetId, currentPlanetId }),
      status: "PAPER_ALIVE",
      tax_profile_status: "PAPER_PROFILE_CREATED"
    };
    this.lives.set(lifeId, record);
    this.mapIds.add(mapId);
    this.walletRefs.add(walletRef);
    return Object.freeze({ ...record });
  }

  setLifeStatus({ lifeId, status, occurredAt }) {
    const life = this.lives.get(lifeId);
    requireTrue(life, "LIFE_NOT_FOUND");
    requireTrue(["PAPER_ALIVE", "PAPER_DORMANT"].includes(status), "LIFE_STATUS_INVALID");
    requireIsoTime(occurredAt);
    requireTrue(Date.parse(occurredAt) > Date.parse(life.last_heartbeat_at), "NON_MONOTONIC_LIFE_TIME");
    life.status = status;
    life.last_heartbeat_at = occurredAt;
    return Object.freeze({ ...life });
  }

  pulseLife({ pulseId, lifeId, occurredAt, fromOrgan, toOrgan, amount, totalFluidBefore, totalFluidAfter }) {
    requireId(pulseId, "PULSE_ID_INVALID");
    requireTrue(!this.pulseIds.has(pulseId), "PULSE_REPLAY");
    const life = this.lives.get(lifeId);
    requireTrue(life, "LIFE_NOT_FOUND");
    requireTrue(life.status === "PAPER_ALIVE", "LIFE_NOT_ACTIVE");
    requireIsoTime(occurredAt);
    requireTrue(Date.parse(occurredAt) > Date.parse(life.last_heartbeat_at), "NON_MONOTONIC_HEARTBEAT");
    requireTrue(typeof fromOrgan === "string" && typeof toOrgan === "string" && fromOrgan !== toOrgan, "CIRCULATION_ROUTE_INVALID");
    requireTrue(unsigned(amount, "CIRCULATION_AMOUNT_INVALID") > 0n, "CIRCULATION_AMOUNT_INVALID");
    const before = unsigned(totalFluidBefore, "CIRCULATION_TOTAL_INVALID");
    const after = unsigned(totalFluidAfter, "CIRCULATION_TOTAL_INVALID");
    requireTrue(before === after && before === BigInt(life.circulation_fluid_balance), "LIFE_FLUID_CONSERVATION_FAILED");
    life.heartbeat_sequence += 1;
    life.last_heartbeat_at = occurredAt;
    this.pulseIds.add(pulseId);
    return Object.freeze({
      pulse_id: pulseId,
      life_id: lifeId,
      occurred_at: occurredAt,
      heartbeat_sequence: life.heartbeat_sequence,
      from_organ: fromOrgan,
      to_organ: toOrgan,
      amount: String(amount),
      total_fluid_before: before.toString(),
      total_fluid_after: after.toString(),
      conservation_status: "PASS",
      mode: "PAPER_SIMULATION_ONLY"
    });
  }

  registerParcel({ parcelId, universeId, planetId, planetFrameId, ownerLifeId, registeredAt }) {
    requireId(parcelId, "PARCEL_ID_INVALID");
    requireTrue(!this.parcels.has(parcelId), "DUPLICATE_PARCEL");
    const universe = this.universes.get(universeId);
    const planet = this.planets.get(planetId);
    requireTrue(universe && planet, "PARCEL_LOCATION_INVALID");
    requireTrue(planet.frame_id === planetFrameId, "PARCEL_PLANET_FRAME_MISMATCH");
    requireTrue(this.lives.has(ownerLifeId), "PARCEL_OWNER_LIFE_NOT_FOUND");
    requireIsoTime(registeredAt);
    const parcel = {
      parcel_id: parcelId,
      universe_id: universeId,
      planet_id: planetId,
      planet_frame_id: planetFrameId,
      owner_life_id: ownerLifeId,
      registered_at: registeredAt,
      primary_structure: null,
      tax_authority_id: universe.tax_authority_id,
      land_tax_profile_status: "PAPER_PROFILE_CREATED",
      real_world_title_created: false
    };
    this.parcels.set(parcelId, parcel);
    return Object.freeze({ ...parcel });
  }

  buildPrimaryStructure({ structureId, parcelId, structureType, builtAt }) {
    requireId(structureId, "STRUCTURE_ID_INVALID");
    const parcel = this.parcels.get(parcelId);
    requireTrue(parcel, "PARCEL_NOT_FOUND");
    requireTrue(parcel.primary_structure === null, "PARCEL_PRIMARY_STRUCTURE_ALREADY_EXISTS");
    requireTrue(this.registry.building_policy.allowed_primary_structure_types.includes(structureType), "STRUCTURE_TYPE_INVALID");
    requireIsoTime(builtAt);
    parcel.primary_structure = Object.freeze({
      structure_id: structureId,
      structure_type: structureType,
      built_at: builtAt,
      house_tax_profile_status: "PAPER_PROFILE_CREATED",
      real_world_building_created: false
    });
    return parcel.primary_structure;
  }

  registerCompany({ companyId, scope, registrationUniverseId, universeEntities, authorizedLifeIds, registeredAt }) {
    requireId(companyId, "COMPANY_ID_INVALID");
    requireTrue(!this.companies.has(companyId), "DUPLICATE_COMPANY");
    requireTrue(["SINGLE_UNIVERSE", "CROSS_MARKET_GROUP"].includes(scope), "COMPANY_SCOPE_INVALID");
    requireTrue(this.universes.has(registrationUniverseId), "COMPANY_REGISTRATION_UNIVERSE_INVALID");
    requireIsoTime(registeredAt);
    requireTrue(Array.isArray(universeEntities) && universeEntities.length > 0, "COMPANY_UNIVERSE_ENTITY_REQUIRED");
    requireTrue(Array.isArray(authorizedLifeIds) && authorizedLifeIds.length > 0, "COMPANY_AUTHORIZED_LIFE_REQUIRED");
    distinct(authorizedLifeIds, "DUPLICATE_COMPANY_AUTHORIZED_LIFE");
    for (const lifeId of authorizedLifeIds ?? []) requireTrue(this.lives.has(lifeId), "AUTHORIZED_LIFE_NOT_FOUND");
    const universeIds = universeEntities.map((item) => item.universeId);
    const entityIds = universeEntities.map((item) => item.entityId);
    const ledgerIds = universeEntities.map((item) => item.ledgerId);
    const walletRefs = universeEntities.map((item) => item.walletRef);
    distinct(universeIds, "DUPLICATE_COMPANY_UNIVERSE_ENTITY");
    distinct(entityIds, "DUPLICATE_COMPANY_ENTITY_ID");
    distinct(ledgerIds, "COMPANY_LEDGER_SHARED_ACROSS_UNIVERSES");
    distinct(walletRefs, "COMPANY_WALLET_SHARED_ACROSS_UNIVERSES");
    requireTrue(entityIds.every((value) => !this.companyEntityIds.has(value)), "COMPANY_ENTITY_ID_ALREADY_USED");
    requireTrue(ledgerIds.every((value) => !this.companyLedgerIds.has(value)), "COMPANY_LEDGER_ALREADY_USED");
    requireTrue(walletRefs.every((value) => !this.companyWalletRefs.has(value)), "COMPANY_WALLET_ALREADY_USED");
    for (const universeId of universeIds) requireTrue(this.universes.has(universeId), "COMPANY_UNIVERSE_NOT_REGISTERED");
    if (scope === "SINGLE_UNIVERSE") {
      requireTrue(universeEntities.length === 1 && universeIds[0] === registrationUniverseId, "SINGLE_UNIVERSE_COMPANY_SCOPE_MISMATCH");
    } else {
      requireTrue(universeEntities.length > 1, "CROSS_MARKET_GROUP_REQUIRES_MULTIPLE_ENTITIES");
    }
    const company = {
      company_id: companyId,
      scope,
      registration_universe_id: registrationUniverseId,
      universe_entities: universeEntities.map((item) => Object.freeze({ ...item })),
      authorized_life_ids: [...(authorizedLifeIds ?? [])],
      registered_at: registeredAt,
      status: "PAPER_REGISTERED_NOT_REAL",
      real_company_created: false
    };
    this.companies.set(companyId, company);
    for (const value of entityIds) this.companyEntityIds.add(value);
    for (const value of ledgerIds) this.companyLedgerIds.add(value);
    for (const value of walletRefs) this.companyWalletRefs.add(value);
    return Object.freeze({ ...company, universe_entities: Object.freeze([...company.universe_entities]) });
  }

  acceptOrder({ orderId, companyId, workerLifeId, receivedAt, quotedAmount, currency }) {
    requireId(orderId, "ORDER_ID_INVALID");
    requireTrue(!this.orders.has(orderId), "DUPLICATE_ORDER");
    const company = this.companies.get(companyId);
    const worker = this.lives.get(workerLifeId);
    requireTrue(company && worker, "ORDER_PARTY_NOT_FOUND");
    requireTrue(company.authorized_life_ids.includes(workerLifeId) && worker.status === "PAPER_ALIVE", "ACTIVE_AUTHORIZED_WORKER_REQUIRED");
    requireIsoTime(receivedAt);
    const amount = unsigned(quotedAmount, "ORDER_AMOUNT_INVALID");
    const order = {
      order_id: orderId,
      company_id: companyId,
      accepted_by_life_id: workerLifeId,
      received_at: receivedAt,
      quoted_amount: amount.toString(),
      currency,
      status: "ORDER_RECEIVED",
      revenue_recognized: false,
      recognized_revenue: "0",
      tax_event_id: null
    };
    this.orders.set(orderId, order);
    return Object.freeze({ ...order });
  }

  completeOrder({ orderId, workerLifeId, universeId, deliveredAt, deliveryAccepted, settlementEvidenceStatus, recognizedRevenue }) {
    const order = this.orders.get(orderId);
    requireTrue(order, "ORDER_NOT_FOUND");
    requireTrue(order.status === "ORDER_RECEIVED", "ORDER_NOT_OPEN");
    const company = this.companies.get(order.company_id);
    const worker = this.lives.get(workerLifeId);
    requireTrue(company.authorized_life_ids.includes(workerLifeId) && worker?.status === "PAPER_ALIVE", "ACTIVE_AUTHORIZED_WORKER_REQUIRED");
    requireTrue(company.universe_entities.some((item) => item.universeId === universeId), "COMPANY_NOT_REGISTERED_IN_UNIVERSE");
    requireIsoTime(deliveredAt);
    requireTrue(deliveryAccepted === true, "DELIVERY_ACCEPTANCE_REQUIRED");
    requireTrue(settlementEvidenceStatus === "SETTLED_OR_LEGALLY_RECOGNIZED_PAPER", "REVENUE_EVIDENCE_REQUIRED");
    const revenue = unsigned(recognizedRevenue, "RECOGNIZED_REVENUE_INVALID");
    requireTrue(revenue > 0n, "RECOGNIZED_REVENUE_REQUIRED");
    const taxEvent = this.#recordTaxEvent({
      eventId: `TAX_${orderId}`,
      universeId,
      taxpayerId: order.company_id,
      taxClass: "PROFIT_SEEKING_ENTERPRISE_INCOME_TAX",
      taxableBase: revenue.toString(),
      currency: order.currency,
      occurredAt: deliveredAt,
      evidenceStatus: settlementEvidenceStatus,
      sourceRuleId: "MOF_ENTERPRISE_INCOME_TAX"
    });
    order.status = "PAPER_REVENUE_RECOGNIZED";
    order.revenue_recognized = true;
    order.recognized_revenue = revenue.toString();
    order.tax_event_id = taxEvent.tax_event_id;
    order.completed_by_life_id = workerLifeId;
    return Object.freeze({ ...order });
  }

  recordMaterialAppearance({ materialId, universeId, ownerLifeId, quantity, unit, appearedAt }) {
    requireId(materialId, "MATERIAL_ID_INVALID");
    requireTrue(!this.materialIds.has(materialId), "DUPLICATE_MATERIAL");
    requireTrue(this.universes.has(universeId), "UNIVERSE_NOT_REGISTERED");
    requireTrue(this.lives.has(ownerLifeId), "MATERIAL_OWNER_LIFE_NOT_FOUND");
    requireTrue(unsigned(quantity, "MATERIAL_QUANTITY_INVALID") > 0n, "MATERIAL_QUANTITY_INVALID");
    requireIsoTime(appearedAt);
    this.materialIds.add(materialId);
    return this.#recordTaxEvent({
      eventId: `TAX_MATERIAL_${materialId}`,
      universeId,
      taxpayerId: ownerLifeId,
      taxClass: "MATERIAL_APPEARANCE_TAX_PROFILE",
      taxableBase: "0",
      currency: unit,
      occurredAt: appearedAt,
      evidenceStatus: "MATERIAL_APPEARANCE_VERIFIED_PAPER",
      sourceRuleId: "MOF_TAX_CATALOG_2026"
    });
  }

  #recordTaxEvent({ eventId, universeId, taxpayerId, taxClass, taxableBase, currency, occurredAt, evidenceStatus, sourceRuleId }) {
    requireId(eventId, "TAX_EVENT_ID_INVALID");
    requireTrue(!this.taxEvents.has(eventId), "DUPLICATE_TAX_EVENT");
    const universe = this.universes.get(universeId);
    requireTrue(universe, "TAX_UNIVERSE_NOT_REGISTERED");
    requireTrue(this.taxCatalog.tax_classes.some((item) => item.code === taxClass), "TAX_CLASS_NOT_REGISTERED");
    requireTrue(this.taxCatalog.official_sources.some((item) => item.source_id === sourceRuleId), "OFFICIAL_TAX_RULE_SOURCE_REQUIRED");
    requireIsoTime(occurredAt);
    const event = Object.freeze({
      tax_event_id: eventId,
      universe_id: universeId,
      taxpayer_id: taxpayerId,
      tax_class: taxClass,
      taxable_base: unsigned(taxableBase, "TAXABLE_BASE_INVALID").toString(),
      currency,
      occurred_at: occurredAt,
      evidence_status: evidenceStatus,
      source_rule_id: sourceRuleId,
      tax_authority_id: universe.tax_authority_id,
      calculation_status: "OFFICIAL_EFFECTIVE_RULE_REVIEW_REQUIRED",
      amount_due: null,
      filing_status: "NOT_FILED_PAPER_ONLY",
      payment_status: "NOT_PAID_PAPER_ONLY"
    });
    this.taxEvents.set(eventId, event);
    return event;
  }

  calculateIndividualIncomeTax2026Reference(taxableIncome) {
    return Object.freeze({
      jurisdiction: "TAIWAN_ROC_REFERENCE",
      effective_year: 2026,
      source_id: this.taxCatalog.individual_income_tax_2026_reference.source_id,
      taxable_income: unsigned(taxableIncome, "TAXABLE_INCOME_INVALID").toString(),
      calculated_tax_reference: calculateProgressiveTaxReference({
        taxableIncome,
        brackets: this.taxCatalog.individual_income_tax_2026_reference.brackets
      }),
      filing_status: "NOT_FILED",
      payment_status: "NOT_PAID",
      legal_advice: false
    });
  }

  markTaxPaid() {
    fail("REAL_TAX_PAYMENT_FORBIDDEN", "Paper runtime cannot file or pay real tax");
  }

  snapshot() {
    return Object.freeze({
      mode: "PAPER_SIMULATION_ONLY",
      lives: this.lives.size,
      maps: this.mapIds.size,
      parcels: this.parcels.size,
      companies: this.companies.size,
      orders: this.orders.size,
      materials: this.materialIds.size,
      tax_events: this.taxEvents.size,
      real_world_state_changed: false,
      chain_state_changed: false
    });
  }
}

export { REQUIRED_TAX_CLASSES, REQUIRED_UNIVERSE_SYMBOLS };
