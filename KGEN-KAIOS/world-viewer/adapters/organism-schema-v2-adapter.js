const TAXONOMY_LEVELS = Object.freeze([
  "domain",
  "kingdom",
  "phylum",
  "class",
  "order",
  "family",
  "genus",
  "species",
  "cell",
  "organ",
  "runtime",
  "civilization"
]);

export const K11520_RIGHT_CLASSES = Object.freeze([
  "LIFE_IDENTITY",
  "OWNERSHIP",
  "OCCUPANCY",
  "USAGE_RIGHT",
  "CONTROL_AUTHORITY",
  "REPRODUCTION_RIGHT",
  "EVOLUTION_RIGHT",
  "LAND_TITLE",
  "BUILDING_TITLE",
  "ORGAN_LICENSE"
]);

const LIVE_STATUSES = new Set(["ACTIVE", "RELEASED", "RUNTIME_LIFE", "LIVE"]);
const CANDIDATE_STATUSES = new Set(["CANDIDATE_ONLY", "DRY_RUN", "NOT_ACTIVE", "REFERENCE_EXAMPLE"]);
const PLACEHOLDER = /^(?:AUTO_GENERATE|PENDING(?:_|$)|NOT_CREATED|NOT_ASSIGNED|TBD|UNKNOWN)$/i;
const HASH = /^[a-f0-9]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

const LAND_TAXONOMY = Object.freeze({
  domain: "KGEN_UNIVERSE",
  kingdom: "CIVILIZATION_ASSET",
  phylum: "TERRAIN_ORGANISM",
  class: "LAND_ASSET",
  order: "GOVERNED_PARCEL",
  family: "KAIOS_LAND",
  genus: "KAIOS_TERRAIN",
  species: "KAIOS_LAND_PARCEL_V1",
  cell: "TERRAIN_UNIT",
  organ: "ECOSYSTEM_OR_LAND_SYSTEM",
  runtime: "NON_EXECUTABLE_LIFECYCLE",
  civilization: "KAIOS"
});

const LAND_RIGHTS = Object.freeze({
  LIFE_IDENTITY: "NOT_APPLICABLE",
  OWNERSHIP: "SYNTHETIC_READ_ONLY",
  OCCUPANCY: "SYNTHETIC_READ_ONLY",
  USAGE_RIGHT: "SANDBOX_ONLY",
  CONTROL_AUTHORITY: "PROPOSAL_ONLY",
  REPRODUCTION_RIGHT: "NOT_APPLICABLE",
  EVOLUTION_RIGHT: "NOT_APPLICABLE",
  LAND_TITLE: "NOT_LEGAL_TITLE",
  BUILDING_TITLE: "CONDITIONAL",
  ORGAN_LICENSE: "NOT_APPLICABLE"
});

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assert(condition, code, message) {
  if (!condition) {
    const error = new TypeError(message);
    error.code = code;
    throw error;
  }
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function sortForCanonicalJson(value) {
  if (Array.isArray(value)) return value.map(sortForCanonicalJson);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, sortForCanonicalJson(value[key])])
  );
}

export function canonicalOrganismJson(record) {
  const clone = deepClone(record);
  delete clone.integrity_hash;
  return JSON.stringify(sortForCanonicalJson(clone));
}

export async function sha256Hex(value) {
  assert(globalThis.crypto?.subtle, "CRYPTO_UNAVAILABLE", "SHA-256 verification is unavailable.");
  const bytes = new TextEncoder().encode(String(value));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function stampOrganismIntegrity(record) {
  const clone = deepClone(record);
  clone.integrity_hash = await sha256Hex(canonicalOrganismJson(clone));
  return clone;
}

function validateTaxonomy(taxonomy) {
  assert(isRecord(taxonomy), "INVALID_TAXONOMY", "Schema V2 taxonomy is required.");
  for (const level of TAXONOMY_LEVELS) {
    assert(
      typeof taxonomy[level] === "string" && taxonomy[level].trim().length > 0,
      "INVALID_TAXONOMY",
      `Schema V2 taxonomy.${level} is required.`
    );
  }
}

function validateLegacyParcel(parcel) {
  assert(isRecord(parcel), "MALFORMED_PARCEL", "Parcel must be an object.");
  assert(typeof parcel.id === "string" && ID.test(parcel.id), "MALFORMED_PARCEL", "Parcel id is invalid.");
  assert(parcel.object_type === "LAND_PARCEL", "MALFORMED_PARCEL", `${parcel.id} is not a land parcel.`);
  assert(
    Array.isArray(parcel.view?.bounds)
      && parcel.view.bounds.length === 4
      && parcel.view.bounds.every(Number.isFinite),
    "MALFORMED_PARCEL",
    `${parcel.id} requires four numeric rendering bounds.`
  );
  assert(
    isRecord(parcel.coordinate) || parcel.status === "UNKNOWN",
    "MALFORMED_PARCEL",
    `${parcel.id} requires coordinates unless it is explicitly UNKNOWN.`
  );
}

function unwrapManifest(value) {
  return isRecord(value?.organism_manifest) ? value.organism_manifest : value;
}

function placeholder(value) {
  return typeof value === "string" && PLACEHOLDER.test(value);
}

async function validateManifest(record, { sandboxMode }) {
  assert(isRecord(record), "MALFORMED_SCHEMA_V2_RECORD", "Schema V2 record must be an object.");
  assert(record.schema_version === "2.0", "UNSUPPORTED_SCHEMA", "Land organism schema_version must be 2.0.");
  assert(typeof record.organism_id === "string" && ID.test(record.organism_id), "MISSING_ORGANISM_ID", "organism_id is invalid.");
  assert(
    typeof record.species_id === "string" || typeof record.taxonomy?.species === "string",
    "MISSING_SPECIES",
    "Land organism species_id is required."
  );
  validateTaxonomy(record.taxonomy);
  assert(
    record.taxonomy.species === "KAIOS_LAND_PARCEL_V1",
    "INVALID_TAXONOMY",
    "Land organisms must bind to KAIOS_LAND_PARCEL_V1."
  );
  assert(isRecord(record.runtime_binding), "MISSING_RUNTIME_BINDING", "runtime_binding is required.");
  assert(
    typeof record.runtime_binding.runtime_entrypoint === "string"
      && record.runtime_binding.runtime_entrypoint.length > 0,
    "MISSING_RUNTIME_BINDING",
    "runtime_entrypoint is required."
  );
  assert(isRecord(record.release), "MISSING_RELEASE", "release is required.");
  assert(
    record.release.runtime_authority === false
      && record.release.wallet_authority === false
      && record.release.exchange_settlement === false,
    "UNAUTHORIZED_ACTIVATION",
    "Viewer records cannot activate Runtime, wallet, or settlement."
  );

  const hasPlaceholder = placeholder(record.organism_id)
    || placeholder(record.release.release_id)
    || placeholder(record.source_commit);
  if (hasPlaceholder) {
    assert(
      sandboxMode && CANDIDATE_STATUSES.has(record.status),
      "PLACEHOLDER_NOT_ALLOWED",
      "Candidate placeholders require sandbox mode and candidate status."
    );
  }

  const expectedHash = await sha256Hex(canonicalOrganismJson(record));
  const hashPresent = typeof record.integrity_hash === "string" && HASH.test(record.integrity_hash);
  if (LIVE_STATUSES.has(record.status)) {
    assert(hashPresent, "MISSING_INTEGRITY_HASH", "Live records require integrity_hash.");
    assert(record.integrity_hash === expectedHash, "INTEGRITY_HASH_MISMATCH", "Live record integrity_hash mismatch.");
  } else if (hashPresent) {
    assert(record.integrity_hash === expectedHash, "INTEGRITY_HASH_MISMATCH", "Candidate record integrity_hash mismatch.");
  }
  return {
    expectedHash,
    integrityStatus: hashPresent
      ? (LIVE_STATUSES.has(record.status) ? "LIVE_HASH_VERIFIED" : "CANDIDATE_HASH_VERIFIED")
      : "CANDIDATE_HASH_NOT_SUPPLIED"
  };
}

function rightsProjection(parcel) {
  return {
    ...LAND_RIGHTS,
    BUILDING_TITLE: Array.isArray(parcel.building_ids) && parcel.building_ids.length
      ? "CONDITIONAL_PRESENT"
      : "NOT_APPLICABLE"
  };
}

function projectionFor(parcel, manifest, integrityStatus, sourceMode) {
  const taxonomy = manifest?.taxonomy ?? LAND_TAXONOMY;
  return deepFreeze({
    schema_version: manifest?.schema_version ?? "2.0",
    source_mode: sourceMode,
    organism_id: manifest?.organism_id ?? `candidate:land:${parcel.id}:v2`,
    species_id: manifest?.species_id ?? taxonomy.species,
    taxonomy: deepClone(taxonomy),
    lifecycle_status: manifest?.status ?? "LEGACY_SYNTHETIC",
    energy_profile: manifest?.energy_profile_ref ?? "KGEN-KAIOS/organism/profiles/energy_profiles.json#ECOSYSTEM_FLOW",
    embodiment_profile: manifest?.embodiment_profile_ref ?? "KGEN-KAIOS/organism/profiles/embodiment_profiles.json#LAND_PARCEL",
    trade_classification: manifest?.life_behavior?.trade_eligibility ?? "TITLE_TRANSFER",
    ownership_class: "OWNERSHIP",
    occupancy_class: "OCCUPANCY",
    usage_right_class: "USAGE_RIGHT",
    control_authority_class: "CONTROL_AUTHORITY",
    land_title_class: "LAND_TITLE",
    building_title_class: rightsProjection(parcel).BUILDING_TITLE,
    rights: rightsProjection(parcel),
    runtime_entrypoint: manifest?.runtime_binding?.runtime_entrypoint
      ?? "KGEN-KAIOS/organism/runtime/non_executable_lifecycle.py#describe_lifecycle",
    integrity_hash: manifest?.integrity_hash ?? null,
    integrity_status: integrityStatus,
    synthetic: true,
    read_only: true,
    sandbox: true,
    legal_title: false,
    settlement_active: false,
    runtime_active: false,
    wallet_active: false
  });
}

export async function adaptLandParcels({
  legacyParcels,
  organismRecords = [],
  sandboxMode = true
} = {}) {
  assert(Array.isArray(legacyParcels), "MALFORMED_WORLD", "legacyParcels must be an array.");
  assert(Array.isArray(organismRecords), "MALFORMED_SCHEMA_V2_RECORDS", "organismRecords must be an array.");

  const records = new Map();
  const organismIds = new Set();
  for (const raw of organismRecords) {
    const sourceParcelId = raw?.source_parcel_id ?? raw?.parcel_id;
    const manifest = unwrapManifest(raw);
    const validation = await validateManifest(manifest, { sandboxMode });
    assert(!organismIds.has(manifest.organism_id), "DUPLICATE_ORGANISM_ID", `Duplicate organism_id: ${manifest.organism_id}`);
    organismIds.add(manifest.organism_id);
    assert(typeof sourceParcelId === "string", "MISSING_SOURCE_PARCEL", "Schema V2 record requires source_parcel_id.");
    assert(!records.has(sourceParcelId), "DUPLICATE_PARCEL_MAPPING", `Duplicate Schema V2 mapping: ${sourceParcelId}`);
    records.set(sourceParcelId, { manifest, validation });
  }

  return Promise.all(legacyParcels.map(async (parcel) => {
    validateLegacyParcel(parcel);
    const mapped = records.get(parcel.id);
    const projection = mapped
      ? projectionFor(parcel, mapped.manifest, mapped.validation.integrityStatus, "SCHEMA_V2")
      : projectionFor(parcel, null, "LEGACY_DERIVED", "LEGACY_ADAPTER");
    return deepFreeze({ ...deepClone(parcel), organism_schema_v2: projection });
  }));
}

export async function createLandOrganismCandidate(parcel, {
  createdAt = "2026-07-26T00:00:00Z",
  sourceCommit = "19229217dcbf793173103924995a5d5fd384aefe"
} = {}) {
  validateLegacyParcel(parcel);
  const organismId = `candidate:land:${parcel.id}:v2`;
  const manifest = {
    schema_version: "2.0",
    organism_id: organismId,
    organism_name: `${parcel.label} Land Organism Candidate`,
    organism_version: "0.1.0",
    organism_class: "LAND_PARCEL",
    life_category: "NATURAL_KAIOS_INSTANTIATION",
    life_type: "Land Parcel",
    species_id: "KAIOS_LAND_PARCEL_V1",
    ...Object.fromEntries(TAXONOMY_LEVELS.slice(0, 8).map((level) => [level, LAND_TAXONOMY[level]])),
    taxonomy: { ...LAND_TAXONOMY },
    species_ref: "KGEN-KAIOS/organism/species_registry.json#KAIOS_LAND_PARCEL_V1",
    canonical_file: `KGEN-KAIOS/world-viewer/data/synthetic-world.json#${parcel.id}`,
    runtime_entry: "KGEN-KAIOS/organism/runtime/non_executable_lifecycle.py#describe_lifecycle",
    dna_schema: "KGEN-KAIOS/provenance/ORGANISM_MANIFEST_SCHEMA.json",
    dna_ref: "KGEN-KAIOS/organism/species_registry.json#KAIOS_LAND_PARCEL_V1",
    rna_ref: "KGEN-KAIOS/organism/profiles/mutation_profiles.json#GOVERNED_LAND_CHANGE",
    organs_ref: "KGEN-KAIOS/organism/species_registry.json#KAIOS_LAND_PARCEL_V1",
    cells_ref: "KGEN-KAIOS/organism/species_registry.json#KAIOS_LAND_PARCEL_V1",
    runtime_ref: "KGEN-KAIOS/organism/runtime/non_executable_lifecycle.py",
    energy_profile_ref: "KGEN-KAIOS/organism/profiles/energy_profiles.json#ECOSYSTEM_FLOW",
    embodiment_profile_ref: "KGEN-KAIOS/organism/profiles/embodiment_profiles.json#LAND_PARCEL",
    lifecycle_ref: "KGEN-KAIOS/organism/species_registry.json#KAIOS_LAND_PARCEL_V1",
    reproduction_rules_ref: "KGEN-KAIOS/organism/profiles/reproduction_profiles.json#NOT_APPLICABLE",
    mutation_rules_ref: "KGEN-KAIOS/organism/profiles/mutation_profiles.json#GOVERNED_LAND_CHANGE",
    trade_profile_ref: "KGEN-KAIOS/organism/profiles/trade_profiles.json#LAND_TITLE",
    ownership_profile_ref: "KGEN-KAIOS/organism/profiles/trade_profiles.json#LAND_TITLE",
    authority_profile_ref: "KGEN-KAIOS/world-viewer/tasks/LAND_VIEWER_SCHEMA_V2_COMPATIBILITY.task-envelope.json",
    runtime_binding: {
      program_filename: "KGEN-KAIOS/organism/runtime/non_executable_lifecycle.py",
      runtime_entrypoint: "KGEN-KAIOS/organism/runtime/non_executable_lifecycle.py#describe_lifecycle",
      runtime_type: "NON_EXECUTABLE_LIFECYCLE_HANDLER",
      runtime_version: "0.1.0",
      execution_environment: "PYTHON_DRY_RUN",
      required_organs: ["ECOSYSTEM_OR_LAND_SYSTEM"],
      required_cells: ["TERRAIN_UNIT"],
      startup_contract: "VALIDATE_ONLY",
      shutdown_contract: "NO_RUNTIME_STARTED",
      health_check: "KAIOS_NON_EXECUTABLE_LIFECYCLE_NOT_ACTIVE",
      state_path: "KGEN-KAIOS/world-viewer/data/schema-v2-land-candidates.json",
      memory_path: "KGEN-KAIOS/world-viewer/data/synthetic-world.json",
      archive_path: "KGEN-KAIOS/organism/package-template/archive/previous_generations/README.md"
    },
    life_behavior: {
      energy_input: ["sunlight", "water cycle", "soil", "ecosystem maintenance"],
      energy_consumption: "terrain lifecycle dependent",
      food_or_fuel_type: ["NOT_APPLICABLE"],
      growth_rules: ["governed land transformation only"],
      repair_rules: ["restore from source fixture and migration report"],
      reproduction_mode: "NOT_APPLICABLE",
      compatible_species: [],
      offspring_identity_rule: "NOT_APPLICABLE",
      mutation_policy: "GOVERNED_LAND_CHANGE",
      evolution_policy: "reviewed versioned land change",
      death_or_shutdown_boundary: "land lifecycle archive is not biological death",
      trade_eligibility: "TITLE_TRANSFER",
      ownership_boundary: "land identity and ownership are separate",
      occupancy_boundary: "occupancy does not transfer ownership",
      authority_boundary: "control authority requires a separate governed grant"
    },
    release: {
      release_id: `candidate-release:${parcel.id}:v2`,
      release_status: "DRY_RUN",
      activation_status: "NOT_ACTIVE",
      production_authority: false,
      runtime_authority: false,
      wallet_authority: false,
      exchange_settlement: false
    },
    created_at: createdAt,
    integrity_hash: "0".repeat(64),
    parent_species: null,
    ancestor_versions: [],
    compatible_mates: [],
    mutation_rules: ["governed land change only"],
    fusion_rules: [],
    split_rules: ["new parcel and organism identities required"],
    upgrade_path: ["future reviewed candidate"],
    status: "CANDIDATE_ONLY",
    version: "2.0",
    author_agent: "Codex",
    reviewer_agent: "CODEX_AUTONOMOUS_MEDIUM_RISK_REVIEW",
    source_commit: sourceCommit
  };
  return stampOrganismIntegrity(manifest);
}

export async function migrateLegacyParcels(legacyParcels, options = {}) {
  const records = [];
  for (const parcel of legacyParcels) {
    const organismManifest = await createLandOrganismCandidate(parcel, options);
    records.push({
      source_parcel_id: parcel.id,
      organism_id_candidate: organismManifest.organism_id,
      field_mappings: {
        parcel_id: "organism_id",
        land_classification: "taxonomy",
        parcel_status: "status",
        owner_id: "OWNERSHIP",
        building_ids: "BUILDING_TITLE",
        land_use: "USAGE_RIGHT",
        capabilities: "CONTROL_AUTHORITY"
      },
      defaults: {
        species_id: "KAIOS_LAND_PARCEL_V1",
        runtime: "NON_EXECUTABLE_LIFECYCLE_HANDLER",
        trade_profile: "LAND_TITLE",
        settlement: "INACTIVE"
      },
      missing_values: [
        ...(!isRecord(parcel.coordinate) ? ["coordinate"] : []),
        ...(!Number.isFinite(parcel.area_m2) ? ["area_m2"] : [])
      ],
      integrity_hash: organismManifest.integrity_hash,
      rollback_path: "Discard candidate output; original synthetic-world.json remains unchanged.",
      organism_manifest: organismManifest
    });
  }
  return {
    schema_version: "1.0",
    status: "CANDIDATE_ONLY",
    operation: "DRY_RUN",
    activation_status: "NOT_ACTIVE",
    source_fixture: "KGEN-KAIOS/world-viewer/data/synthetic-world.json",
    source_parcel_count: legacyParcels.length,
    generated_record_count: records.length,
    source_data_modified: false,
    runtime_authority: false,
    wallet_created: false,
    settlement_active: false,
    records
  };
}
