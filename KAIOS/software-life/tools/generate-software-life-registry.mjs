/**
 * KAIOS SOFTWARE LIFE
 * life_id: LIFE-KAIOS-SOFTWARE-LIFE-REGISTRY-GENERATOR
 * species_id: SPECIES-KAIOS-SOFTWARE-TOOL
 * genome_id: GENOME-KAIOS-SOFTWARE-LIFE-REGISTRY-GENERATOR
 * genome_version: 1.0.0
 * generation: 1
 * organ_type: PROCESSING_ORGAN
 * canonical_filename: generate-software-life-registry.mjs
 * lifecycle_state: ACTIVE
 * authority: SIMULATION_ONLY
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const sourceArg = process.argv.find((value) => value.startsWith("--source-commit="));
const generatedArg = process.argv.find((value) => value.startsWith("--generated-at="));
const outputArg = process.argv.find((value) => value.startsWith("--output="));
const outputPath = outputArg
  ? resolve(root, outputArg.slice("--output=".length))
  : resolve(root, "KAIOS/software-life/KAIOS_SOFTWARE_LIFE_REGISTRY.json");
const sourceCommit = execFileSync(
  "git",
  ["-C", root, "rev-parse", sourceArg?.slice("--source-commit=".length) || "HEAD"],
  { encoding: "utf8" }
).trim();
const generatedAt = generatedArg?.slice("--generated-at=".length)
  || new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const trackedPaths = execFileSync(
  "git",
  ["-C", root, "ls-tree", "-r", "--name-only", "-z", sourceCommit]
).toString("utf8").split("\0").filter(Boolean);
const tracked = new Set(trackedPaths);

const catalog = [
  {
    key: "OFFICIAL-HOMEPAGE",
    name: "kaios-official-homepage",
    display: "KAIOS Official Homepage",
    lifeType: "APPLICATION",
    entryPath: "index.html",
    canonicalPath: "index.html",
    artifacts: ["index.html"],
    publicUrl: "/kline-odyssey/",
    runtimeStatus: "ACTIVE_SIMULATION",
    dependencies: ["LIFE-KAIOS-WORLD-VIEWER", "LIFE-KAIOS-K280-WORLD-VIEWER"]
  },
  {
    key: "WORLD-VIEWER",
    name: "kaios-world-viewer",
    display: "KAIOS World Viewer",
    lifeType: "VIEWER",
    entryPath: "world-viewer/index.html",
    canonicalPath: "world-viewer/index.html",
    artifacts: [
      "world-viewer/index.html",
      "KGEN-KAIOS/world-viewer/index.html",
      "KGEN-KAIOS/world-viewer/app.js",
      "KGEN-KAIOS/world-viewer/ui/shell.js",
      "KGEN-KAIOS/world-viewer/ui/styles.css",
      "KGEN-KAIOS/world-viewer/data/world-store.js"
    ],
    publicUrl: "/kline-odyssey/world-viewer/",
    runtimeStatus: "ACTIVE_SIMULATION",
    dependencies: []
  },
  {
    key: "K280-RUNTIME",
    name: "kaios-k280-runtime",
    display: "K280 Digital Life Runtime",
    lifeType: "RUNTIME",
    entryPath: "KAIOS/K280/runtime/k280-runtime.js",
    canonicalPath: "KAIOS/K280/runtime/k280-runtime.js",
    artifacts: ["KAIOS/K280/runtime/k280-runtime.js"],
    runtimeStatus: "ACTIVE_SIMULATION",
    dependencies: ["LIFE-KAIOS-CANONICAL-LIFE-SCHEMA"]
  },
  {
    key: "K280-WORLD-VIEWER",
    name: "kaios-k280-world-viewer",
    display: "K280 World Viewer",
    lifeType: "VIEWER",
    entryPath: "world-viewer/k280/index.html",
    canonicalPath: "world-viewer/k280/index.html",
    artifacts: ["world-viewer/k280/index.html"],
    publicUrl: "/kline-odyssey/world-viewer/k280/",
    runtimeStatus: "ACTIVE_SIMULATION",
    dependencies: ["LIFE-KAIOS-K280-RUNTIME", "LIFE-KAIOS-K280-API"]
  },
  {
    key: "PLAYER-GENESIS",
    name: "kaios-player-genesis",
    display: "KAIOS Player Genesis",
    lifeType: "APPLICATION",
    entryPath: "world-viewer/player-genesis/index.html",
    canonicalPath: "world-viewer/player-genesis/index.html",
    artifacts: ["world-viewer/player-genesis/index.html"],
    publicUrl: "/kline-odyssey/world-viewer/player-genesis/",
    runtimeStatus: "ACTIVE_SIMULATION",
    dependencies: ["LIFE-KAIOS-WORLD-VIEWER"]
  },
  {
    key: "CAUSAL-WORLD-RUNTIME",
    name: "kaios-causal-world-runtime",
    display: "KAIOS Real Causal World Runtime",
    lifeType: "RUNTIME",
    entryPath: "KGEN-KAIOS/world-viewer/causal-runtime/causal-world-runtime.js",
    canonicalPath: "KGEN-KAIOS/world-viewer/causal-runtime/causal-world-runtime.js",
    artifacts: [
      "KGEN-KAIOS/world-viewer/causal-runtime/causal-world-runtime.js",
      "KGEN-KAIOS/world-viewer/causal-runtime/app.js",
      "KGEN-KAIOS/world-viewer/causal-runtime/index.html"
    ],
    runtimeStatus: "ACTIVE_SIMULATION",
    dependencies: ["LIFE-KAIOS-WORLD-VIEWER"]
  },
  {
    key: "CAUSAL-WORLD-VIEWER",
    name: "kaios-causal-world-viewer",
    display: "KAIOS Causal World Viewer",
    lifeType: "VIEWER",
    entryPath: "world-viewer/causal-runtime/index.html",
    canonicalPath: "world-viewer/causal-runtime/index.html",
    artifacts: ["world-viewer/causal-runtime/index.html"],
    publicUrl: "/kline-odyssey/world-viewer/causal-runtime/",
    runtimeStatus: "ACTIVE_SIMULATION",
    dependencies: ["LIFE-KAIOS-CAUSAL-WORLD-RUNTIME"]
  },
  {
    key: "LIFE-RUNTIME",
    name: "kaios-life-runtime",
    display: "KAIOS Life Runtime",
    lifeType: "RUNTIME",
    entryPath: "KAIOS/life/runtime/foundational-life-runtime.js",
    canonicalPath: "KAIOS/life/runtime/foundational-life-runtime.js",
    artifacts: [
      "KAIOS/life/runtime/foundational-life-runtime.js",
      "KAIOS/life/runtime/foundational-life-loader.js"
    ],
    runtimeStatus: "ACTIVE_SIMULATION",
    dependencies: ["LIFE-KAIOS-CANONICAL-LIFE-SCHEMA"]
  },
  {
    key: "LIFE-RUNTIME-VIEWER",
    name: "kaios-life-runtime-viewer",
    display: "KAIOS Life Runtime Viewer",
    lifeType: "VIEWER",
    entryPath: "world-viewer/life-runtime/index.html",
    canonicalPath: "world-viewer/life-runtime/index.html",
    artifactPrefix: "world-viewer/life-runtime/",
    publicUrl: "/kline-odyssey/world-viewer/life-runtime/",
    runtimeStatus: "ACTIVE_SIMULATION",
    dependencies: ["LIFE-KAIOS-LIFE-RUNTIME", "LIFE-KAIOS-LIFE-RUNTIME-API"]
  },
  {
    key: "ECOSYSTEM-RUNTIME",
    name: "kaios-ecosystem-runtime",
    display: "KAIOS Reproduction and Ecology Runtime",
    lifeType: "RUNTIME",
    entryPath: "KGEN-KAIOS/world-viewer/ecosystem/ecosystem-runtime.js",
    canonicalPath: "KGEN-KAIOS/world-viewer/ecosystem/ecosystem-runtime.js",
    artifacts: ["KGEN-KAIOS/world-viewer/ecosystem/ecosystem-runtime.js"],
    runtimeStatus: "ACTIVE_SIMULATION",
    dependencies: ["LIFE-KAIOS-LIFE-RUNTIME"]
  },
  {
    key: "ECOSYSTEM-VIEWER",
    name: "kaios-ecosystem-viewer",
    display: "KAIOS Ecosystem Viewer",
    lifeType: "VIEWER",
    entryPath: "world-viewer/ecosystem-v1/index.html",
    canonicalPath: "world-viewer/ecosystem/index.html",
    artifactPrefix: "world-viewer/ecosystem-v1/",
    publicUrl: "/kline-odyssey/world-viewer/ecosystem/",
    runtimeStatus: "ACTIVE_SIMULATION",
    pathStatus: "MIGRATION_PENDING",
    dependencies: ["LIFE-KAIOS-ECOSYSTEM-RUNTIME", "LIFE-KAIOS-ECOSYSTEM-API"]
  },
  {
    key: "AQUACULTURE-RUNTIME",
    name: "kaios-fishpond-aquaculture-runtime",
    display: "KAIOS Fishpond Aquaculture Runtime",
    lifeType: "RUNTIME",
    entryPath: "KGEN-KAIOS/world-viewer/aquaculture/aquaculture-runtime.js",
    canonicalPath: "KGEN-KAIOS/world-viewer/aquaculture/aquaculture-runtime.js",
    artifacts: ["KGEN-KAIOS/world-viewer/aquaculture/aquaculture-runtime.js"],
    runtimeStatus: "ACTIVE_SIMULATION",
    dependencies: ["LIFE-KAIOS-ECOSYSTEM-RUNTIME", "LIFE-KAIOS-CAUSAL-WORLD-RUNTIME"]
  },
  {
    key: "AQUACULTURE-VIEWER",
    name: "kaios-fishpond-aquaculture-viewer",
    display: "KAIOS Fishpond Aquaculture Viewer",
    lifeType: "VIEWER",
    entryPath: "world-viewer/aquaculture-v1/index.html",
    canonicalPath: "world-viewer/aquaculture/index.html",
    artifactPrefix: "world-viewer/aquaculture-v1/",
    publicUrl: "/kline-odyssey/world-viewer/aquaculture/",
    runtimeStatus: "ACTIVE_SIMULATION",
    pathStatus: "MIGRATION_PENDING",
    dependencies: ["LIFE-KAIOS-AQUACULTURE-RUNTIME", "LIFE-KAIOS-AQUACULTURE-API"]
  },
  {
    key: "AI-COMPANY-RUNTIME",
    name: "kaios-ai-company-runtime",
    display: "KAIOS AI Company Order and Project Runtime",
    lifeType: "RUNTIME",
    entryPath: "KGEN-KAIOS/world-viewer/ai-company/ai-company-project-runtime.js",
    canonicalPath: "KGEN-KAIOS/world-viewer/ai-company/ai-company-project-runtime.js",
    artifacts: ["KGEN-KAIOS/world-viewer/ai-company/ai-company-project-runtime.js"],
    runtimeStatus: "ACTIVE_SIMULATION",
    dependencies: ["LIFE-KAIOS-CAUSAL-WORLD-RUNTIME", "LIFE-KAIOS-AQUACULTURE-RUNTIME"]
  },
  {
    key: "AI-COMPANY-VIEWER",
    name: "kaios-ai-company-viewer",
    display: "KAIOS AI Company Viewer",
    lifeType: "VIEWER",
    entryPath: "world-viewer/ai-company-v1/index.html",
    canonicalPath: "world-viewer/ai-company/index.html",
    artifactPrefix: "world-viewer/ai-company-v1/",
    publicUrl: "/kline-odyssey/world-viewer/ai-company/",
    runtimeStatus: "ACTIVE_SIMULATION",
    pathStatus: "MIGRATION_PENDING",
    dependencies: ["LIFE-KAIOS-AI-COMPANY-RUNTIME", "LIFE-KAIOS-AI-COMPANY-API"]
  },
  {
    key: "FOREST-AGRICULTURE-WORKLINE",
    name: "kaios-forest-agriculture-workline",
    display: "KAIOS Forest and Agriculture Workline",
    lifeType: "SCHEMA",
    entryPath: "KAIOS/life/forest-agriculture/KAIOS_FOREST_AGRICULTURE_RUNTIME_V1_SPEC.md",
    canonicalPath: "KAIOS/life/forest-agriculture/KAIOS_FOREST_AGRICULTURE_RUNTIME_V1_SPEC.md",
    artifacts: ["KAIOS/life/forest-agriculture/KAIOS_FOREST_AGRICULTURE_RUNTIME_V1_SPEC.md"],
    runtimeStatus: "SPECIFICATION_ONLY",
    organismStatus: "SPECIFICATION_ONLY",
    pathStatus: "DOCUMENT_VERSION_ALLOWED",
    dependencies: ["LIFE-KAIOS-ECOSYSTEM-RUNTIME"]
  },
  {
    key: "CHARTER-PROGRAM-CENTER",
    name: "kaios-charter-program-center",
    display: "KAIOS Genesis Charter Program Center",
    lifeType: "VIEWER",
    entryPath: "KGEN-KAIOS/world-viewer/program-center/program-center-view.js",
    canonicalPath: "KGEN-KAIOS/world-viewer/program-center/program-center-view.js",
    artifacts: ["KGEN-KAIOS/world-viewer/program-center/program-center-view.js"],
    runtimeStatus: "READ_ONLY_PROJECTION",
    dependencies: ["LIFE-KAIOS-WORLD-VIEWER", "LIFE-KAIOS-CHARTER-PROGRAMS-API"]
  },
  {
    key: "WORKER-REGISTRY",
    name: "kaios-worker-registry",
    display: "KAIOS Worker Registry",
    lifeType: "SCHEMA",
    entryPath: "KGEN-KAIOS/worker_registry.json",
    canonicalPath: "KGEN-KAIOS/worker_registry.json",
    artifacts: ["KGEN-KAIOS/worker_registry.json", "KGEN-KAIOS/WORKER_REGISTRY.md"],
    runtimeStatus: "SCHEMA_ONLY",
    dependencies: []
  },
  {
    key: "CURSOR-QUEUE",
    name: "kaios-cursor-work-queue",
    display: "KAIOS Cursor Continuous Work Queue",
    lifeType: "WORKER",
    entryPath: "KAIOS/life/forest-agriculture/KAIOS_CURSOR_CONTINUOUS_WORK_QUEUE.json",
    canonicalPath: "KAIOS/life/forest-agriculture/KAIOS_CURSOR_CONTINUOUS_WORK_QUEUE.json",
    artifacts: ["KAIOS/life/forest-agriculture/KAIOS_CURSOR_CONTINUOUS_WORK_QUEUE.json"],
    runtimeStatus: "READ_ONLY_PROJECTION",
    dependencies: ["LIFE-KAIOS-WORKER-REGISTRY"]
  },
  {
    key: "IDENTITY-AUTHORITY",
    name: "kaios-identity-authority",
    display: "KAIOS Unique Life Identity Authority",
    lifeType: "SCHEMA",
    entryPath: "KGEN-KAIOS/governance/agents/unique-life-identity-v0.1/KAIOS_UNIQUE_LIFE_IDENTITY_REGISTRY_SCHEMA_V0_1.json",
    canonicalPath: "KGEN-KAIOS/governance/agents/unique-life-identity/KAIOS_UNIQUE_LIFE_IDENTITY_REGISTRY_SCHEMA.json",
    artifacts: [
      "KGEN-KAIOS/governance/agents/unique-life-identity-v0.1/KAIOS_UNIQUE_LIFE_IDENTITY_REGISTRY_SCHEMA_V0_1.json",
      "KGEN-KAIOS/governance/agents/unique-life-identity-v0.1/KAIOS_UNIQUE_LIFE_IDENTITY_AND_EMBODIMENT_ARCHITECTURE_V0_1.md"
    ],
    runtimeStatus: "SCHEMA_ONLY",
    pathStatus: "MIGRATION_PENDING",
    dependencies: []
  },
  {
    key: "RIGHTS-AUTHORITY",
    name: "kaios-canonical-life-rights",
    display: "KAIOS Canonical Life Rights Authority",
    lifeType: "SCHEMA",
    entryPath: "KAIOS_CANONICAL_LIFE_RIGHTS_V1.md",
    canonicalPath: "KAIOS_CANONICAL_LIFE_RIGHTS_V1.md",
    artifacts: ["KAIOS_CANONICAL_LIFE_RIGHTS_V1.md"],
    runtimeStatus: "SPECIFICATION_ONLY",
    organismStatus: "SPECIFICATION_ONLY",
    pathStatus: "DOCUMENT_VERSION_ALLOWED",
    dependencies: []
  },
  {
    key: "SUPPLY-CHAIN-SPECIFICATION",
    name: "kaios-supply-chain-specification",
    display: "KAIOS Supply Chain Specification",
    lifeType: "SCHEMA",
    entryPath: "KAIOS_INDUSTRIAL_SUPPLY_CHAIN_SPEC.md",
    canonicalPath: "KAIOS_INDUSTRIAL_SUPPLY_CHAIN_SPEC.md",
    artifacts: ["KAIOS_INDUSTRIAL_SUPPLY_CHAIN_SPEC.md", "KAIOS_SUPPLY_CHAIN_SCHEMA.json"],
    runtimeStatus: "SPECIFICATION_ONLY",
    organismStatus: "SPECIFICATION_ONLY",
    pathStatus: "DOCUMENT_VERSION_ALLOWED",
    dependencies: []
  },
  {
    key: "PHYSICAL-LABOR-SPECIFICATION",
    name: "kaios-physical-labor-specification",
    display: "KAIOS Physical Labor Specification",
    lifeType: "SCHEMA",
    entryPath: "KAIOS_PHYSICAL_LABOR_ACCOUNTING_SPEC.md",
    canonicalPath: "KAIOS_PHYSICAL_LABOR_ACCOUNTING_SPEC.md",
    artifacts: ["KAIOS_PHYSICAL_LABOR_ACCOUNTING_SPEC.md", "KAIOS_PHYSICAL_LABOR_SCHEMA.json"],
    runtimeStatus: "SPECIFICATION_ONLY",
    organismStatus: "SPECIFICATION_ONLY",
    pathStatus: "DOCUMENT_VERSION_ALLOWED",
    dependencies: []
  },
  {
    key: "CHARTER-FOUNDATION-RUNTIME",
    name: "kaios-charter-foundation-runtime",
    display: "KAIOS Charter Foundation Runtime",
    lifeType: "RUNTIME",
    entryPath: "KGEN-KAIOS/world-viewer/foundation/charter-foundation-runtime.js",
    canonicalPath: "KGEN-KAIOS/world-viewer/foundation/charter-foundation-runtime.js",
    artifacts: ["KGEN-KAIOS/world-viewer/foundation/charter-foundation-runtime.js"],
    runtimeStatus: "ACTIVE_SIMULATION",
    dependencies: []
  },
  {
    key: "CANONICAL-LIFE-SCHEMA",
    name: "kaios-canonical-life-schema",
    display: "KAIOS Canonical Life Schema",
    lifeType: "SCHEMA",
    entryPath: "KAIOS_CANONICAL_LIFE_SCHEMA_V1.json",
    canonicalPath: "KAIOS_CANONICAL_LIFE_SCHEMA_V1.json",
    artifacts: ["KAIOS_CANONICAL_LIFE_SCHEMA_V1.json"],
    runtimeStatus: "SCHEMA_ONLY",
    pathStatus: "DOCUMENT_VERSION_ALLOWED",
    dependencies: []
  },
  {
    key: "ORGANISM-MANIFEST-SCHEMA",
    name: "kaios-organism-manifest-schema",
    display: "KAIOS Organism Manifest Schema",
    lifeType: "SCHEMA",
    entryPath: "KGEN-KAIOS/provenance/ORGANISM_MANIFEST_SCHEMA.json",
    canonicalPath: "KGEN-KAIOS/provenance/ORGANISM_MANIFEST_SCHEMA.json",
    artifacts: ["KGEN-KAIOS/provenance/ORGANISM_MANIFEST_SCHEMA.json", "KGEN-KAIOS/ORGANISM_MANIFEST_STANDARD.md"],
    runtimeStatus: "SCHEMA_ONLY",
    dependencies: ["LIFE-KAIOS-CANONICAL-LIFE-SCHEMA"]
  },
  {
    key: "TAXONOMY-REGISTRY",
    name: "kaios-taxonomy-registry",
    display: "KAIOS Taxonomy Registry",
    lifeType: "SCHEMA",
    entryPath: "KGEN-KAIOS/organism/taxonomy_registry.json",
    canonicalPath: "KGEN-KAIOS/organism/taxonomy_registry.json",
    artifacts: ["KGEN-KAIOS/organism/taxonomy_registry.json", "KGEN-KAIOS/civilization/BIOLOGY_TAXONOMY_STANDARD.md"],
    runtimeStatus: "SCHEMA_ONLY",
    dependencies: []
  },
  {
    key: "K280-API",
    name: "kaios-k280-api",
    display: "KAIOS K280 Read-only API",
    lifeType: "API",
    entryPath: "api/kaios/k280/index.html",
    canonicalPath: "api/kaios/k280/index.html",
    artifactPrefix: "api/kaios/k280/",
    apiUrl: "/kline-odyssey/api/kaios/k280/",
    runtimeStatus: "READ_ONLY_PROJECTION",
    dependencies: ["LIFE-KAIOS-K280-RUNTIME"]
  },
  {
    key: "LIFE-RUNTIME-API",
    name: "kaios-life-runtime-api",
    display: "KAIOS Life Runtime Read-only API",
    lifeType: "API",
    entryPath: "api/kaios/life-runtime-v1/index.html",
    canonicalPath: "api/kaios/life-runtime/index.html",
    artifactPrefix: "api/kaios/life-runtime-v1/",
    apiUrl: "/kline-odyssey/api/kaios/life-runtime/",
    runtimeStatus: "READ_ONLY_PROJECTION",
    pathStatus: "MIGRATION_PENDING",
    dependencies: ["LIFE-KAIOS-LIFE-RUNTIME"]
  },
  {
    key: "ECOSYSTEM-API",
    name: "kaios-ecosystem-api",
    display: "KAIOS Ecosystem Read-only API",
    lifeType: "API",
    entryPath: "KAIOS/life/ecology/generate-ecosystem-v1-api.mjs",
    canonicalPath: "KAIOS/life/ecology/generate-ecosystem-api.mjs",
    artifacts: ["KAIOS/life/ecology/generate-ecosystem-v1-api.mjs"],
    artifactPrefix: "api/kaios/ecosystem/v1/",
    apiUrl: "/kline-odyssey/api/kaios/ecosystem/",
    runtimeStatus: "READ_ONLY_PROJECTION",
    pathStatus: "MIGRATION_PENDING",
    dependencies: ["LIFE-KAIOS-ECOSYSTEM-RUNTIME"]
  },
  {
    key: "AQUACULTURE-API",
    name: "kaios-aquaculture-api",
    display: "KAIOS Aquaculture Read-only API",
    lifeType: "API",
    entryPath: "KAIOS/life/aquaculture/generate-aquaculture-v1-api.mjs",
    canonicalPath: "KAIOS/life/aquaculture/generate-aquaculture-api.mjs",
    artifacts: ["KAIOS/life/aquaculture/generate-aquaculture-v1-api.mjs"],
    artifactPrefix: "api/kaios/aquaculture/v1/",
    apiUrl: "/kline-odyssey/api/kaios/aquaculture/",
    runtimeStatus: "READ_ONLY_PROJECTION",
    pathStatus: "MIGRATION_PENDING",
    dependencies: ["LIFE-KAIOS-AQUACULTURE-RUNTIME"]
  },
  {
    key: "AI-COMPANY-API",
    name: "kaios-ai-company-api",
    display: "KAIOS AI Company Read-only API",
    lifeType: "API",
    entryPath: "KAIOS/ai-company/generate-ai-company-v1-api.mjs",
    canonicalPath: "KAIOS/ai-company/generate-ai-company-api.mjs",
    artifacts: ["KAIOS/ai-company/generate-ai-company-v1-api.mjs"],
    artifactPrefix: "api/kaios/ai-company/v1/",
    apiUrl: "/kline-odyssey/api/kaios/ai-company/",
    runtimeStatus: "READ_ONLY_PROJECTION",
    pathStatus: "MIGRATION_PENDING",
    dependencies: ["LIFE-KAIOS-AI-COMPANY-RUNTIME"]
  },
  {
    key: "CHARTER-PROGRAMS-API",
    name: "kaios-charter-programs-api",
    display: "KAIOS Charter Programs Read-only API",
    lifeType: "API",
    entryPath: "api/kaios/charter/programs/index.json",
    canonicalPath: "api/kaios/charter/programs/index.json",
    artifactPrefix: "api/kaios/charter/programs/",
    apiUrl: "/kline-odyssey/api/kaios/charter/programs/",
    runtimeStatus: "READ_ONLY_PROJECTION",
    dependencies: ["LIFE-KAIOS-CHARTER-FOUNDATION-RUNTIME"]
  }
];

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function readBlob(path) {
  return execFileSync("git", ["-C", root, "show", `${sourceCommit}:${path}`]);
}

function artifactPaths(entry) {
  const paths = new Set(entry.artifacts ?? []);
  if (entry.artifactPrefix) {
    for (const path of trackedPaths) {
      if (path.startsWith(entry.artifactPrefix)) paths.add(path);
    }
  }
  return [...paths].sort();
}

function birthRecord(path) {
  const output = execFileSync(
    "git",
    ["-C", root, "log", sourceCommit, "--follow", "--format=%H%x09%cI%x09%an <%ae>", "--", path],
    { encoding: "utf8" }
  ).trim().split(/\r?\n/).filter(Boolean);
  if (!output.length) throw new Error(`No birth lineage for ${path}`);
  const [commit, time, creator] = output.at(-1).split("\t");
  return { commit, time, creator };
}

const typeClass = {
  APPLICATION: "APPLICATION_LIFE",
  RUNTIME: "DETERMINISTIC_RUNTIME_LIFE",
  API: "COMMUNICATION_SERVICE_LIFE",
  SCHEMA: "GENOME_CONTRACT_LIFE",
  VIEWER: "VIEWER_APPLICATION_LIFE",
  WORKER: "BOUNDED_WORKER_LIFE"
};

const interfaceProtocol = {
  APPLICATION: "STATIC_HTML",
  RUNTIME: "ECMASCRIPT_MODULE",
  API: "JSON_DOCUMENT",
  SCHEMA: "JSON_DOCUMENT",
  VIEWER: "STATIC_HTML",
  WORKER: "JSON_DOCUMENT"
};

function organType(path, lifeType) {
  const name = path.toLowerCase();
  if (lifeType === "API" || name.includes("generate-") || name.includes("/api/")) return "API_ORGAN";
  if (name.endsWith(".html")) return "VIEWER_ORGAN";
  if (name.endsWith(".css")) return "OUTPUT_ORGAN";
  if (name.includes("runtime") || name.endsWith(".js") || name.endsWith(".mjs")) return "PROCESSING_ORGAN";
  if (name.includes("queue")) return "MEMORY_ORGAN";
  if (name.endsWith(".json")) return "STORAGE_ORGAN";
  if (name.endsWith(".md")) return "IDENTITY_ORGAN";
  return "AUDIT_ORGAN";
}

function taxonomy(entry, lifeId, speciesId, genomeId) {
  const className = typeClass[entry.lifeType];
  const primaryOrgan = entry.lifeType === "API" ? "API_ORGAN" : entry.lifeType === "VIEWER" ? "VIEWER_ORGAN" : "PROCESSING_ORGAN";
  return {
    owner_12: "KGEN-KAIOS/organism/taxonomy_registry.json",
    owner_19: "KGEN-KAIOS/civilization/BIOLOGY_TAXONOMY_STANDARD.md",
    levels_12: {
      domain: "KGEN_UNIVERSE",
      kingdom: "SOFTWARE_LIFE",
      phylum: "PROGRAM_ORGANISM",
      class: className,
      order: "KAIOS_SOFTWARE_ORDER",
      family: `${entry.key}-FAMILY`,
      genus: `${entry.key}-GENUS`,
      species: speciesId,
      cell: "FUNCTION_CELL",
      organ: primaryOrgan,
      runtime: entry.runtimeStatus,
      civilization: "KAIOS_SIMULATION"
    },
    levels_19: {
      Domain: "KGEN_UNIVERSE",
      Kingdom: "SOFTWARE_LIFE",
      Phylum: "PROGRAM_ORGANISM",
      Class: className,
      Order: "KAIOS_SOFTWARE_ORDER",
      Family: `${entry.key}-FAMILY`,
      Genus: `${entry.key}-GENUS`,
      Species: speciesId,
      Individual: lifeId,
      OrganSystem: `${entry.key}-ORGAN-SYSTEM`,
      Organ: primaryOrgan,
      Tissue: `${entry.key}-INTERFACE-GROUP`,
      Cell: "FUNCTION_CELL",
      Organelle: "IMPLEMENTATION_UNIT",
      Genome: genomeId,
      DNA: "STATE_AND_SCHEMA_CONTRACTS",
      RNA: "COMMAND_EVENT_TRANSLATION",
      Gene: `${entry.key}-FEATURE-SET`,
      Expression: entry.runtimeStatus
    }
  };
}

const lives = [];
for (const entry of catalog) {
  if (!tracked.has(entry.entryPath)) throw new Error(`Missing entry path: ${entry.entryPath}`);
  const paths = artifactPaths(entry);
  if (!paths.length) throw new Error(`No artifacts: ${entry.key}`);
  for (const path of paths) if (!tracked.has(path)) throw new Error(`Missing artifact: ${path}`);
  const artifacts = paths.map((path, index) => ({
    organ_id: `ORGAN-${entry.key}-${String(index + 1).padStart(2, "0")}`,
    organ_type: organType(path, entry.lifeType),
    path,
    content_hash: sha256(readBlob(path))
  }));
  const artifactHash = sha256(
    Buffer.from(JSON.stringify(artifacts.map(({ path, content_hash }) => ({ path, content_hash }))))
  );
  const birth = birthRecord(entry.entryPath);
  const lifeId = `LIFE-KAIOS-${entry.key}`;
  const speciesId = `SPECIES-KAIOS-${entry.key}`;
  const genomeId = `GENOME-KAIOS-${entry.key}`;
  const isSpecification = entry.runtimeStatus === "SPECIFICATION_ONLY";
  lives.push({
    life_id: lifeId,
    species_id: speciesId,
    genome_id: genomeId,
    organism_name: entry.name,
    canonical_name: entry.name,
    display_name: entry.display,
    life_type: entry.lifeType,
    taxonomy: taxonomy(entry, lifeId, speciesId, genomeId),
    generation: 1,
    genome_version: "1.0.0",
    runtime_revision: "2026.08.02",
    birth_commit: birth.commit,
    birth_time: birth.time,
    creator: birth.creator,
    maintainer: "CODEX_CONTROLLED",
    location: {
      repository: "klineodyssey/kline-odyssey",
      canonical_path: entry.canonicalPath,
      current_path: entry.entryPath,
      path_status: entry.pathStatus ?? "CANONICAL_ACTIVE"
    },
    embodiment: {
      mode: isSpecification ? "SPECIFICATION_ONLY"
        : entry.lifeType === "API" || entry.lifeType === "SCHEMA" || entry.lifeType === "WORKER"
          ? "READ_ONLY_DATA"
          : entry.lifeType === "VIEWER" || entry.lifeType === "APPLICATION"
            ? "STATIC_WEB"
            : "LOCAL_DETERMINISTIC_SIMULATION",
      entrypoint: entry.entryPath,
      artifact_paths: paths,
      legacy_alias_only: false
    },
    energy_profile: {
      energy_type: isSpecification ? "HUMAN_REVIEW_SIMULATION"
        : entry.lifeType === "API" || entry.lifeType === "SCHEMA" || entry.lifeType === "WORKER"
          ? "STATIC_STORAGE_SIMULATION"
          : "COMPUTE_ELECTRICITY_SIMULATION",
      metering: isSpecification ? "SPECIFICATION_ONLY"
        : entry.lifeType === "RUNTIME" ? "LOCAL_EVENT_ACCOUNTING" : "NOT_METERED_STATIC_ARTIFACT",
      bounded: true
    },
    resource_profile: {
      compute: isSpecification ? "NONE_UNTIL_IMPLEMENTED" : "BOUNDED_CLIENT_OR_LOCAL_EXECUTION",
      memory: isSpecification ? "DOCUMENT_ONLY" : "BOUNDED_BY_HOST_RUNTIME",
      storage: "REPOSITORY_AND_LOCAL_SIMULATION_ONLY",
      network: entry.lifeType === "API" ? "READ_ONLY_GITHUB_PAGES" : "NO_EXTERNAL_AUTONOMY",
      external_side_effects: false
    },
    rights: {
      owner: "KLINE_ODYSSEY_REPOSITORY_SIMULATION",
      custodian: "CODEX_CANONICAL_REVIEW",
      operator: "LOCAL_USER_SIMULATION",
      maintainer: "CODEX_CONTROLLED",
      use_right: "SIMULATED_USE_ONLY",
      mutation_right: "CODEX_REVIEW_REQUIRED",
      reproduction_right: "CODEX_REVIEW_REQUIRED",
      transplant_right: "CODEX_REVIEW_REQUIRED",
      transfer_right: "SIMULATION_ONLY",
      real_legal_effect: false
    },
    dependencies: entry.dependencies,
    organs: artifacts,
    interfaces: [{
      interface_id: `INTERFACE-${entry.key}-PRIMARY`,
      direction: entry.lifeType === "API" || entry.lifeType === "SCHEMA" ? "OUTPUT" : "BIDIRECTIONAL",
      protocol: interfaceProtocol[entry.lifeType],
      read_only: entry.lifeType === "API" || entry.lifeType === "SCHEMA" || entry.lifeType === "WORKER"
    }],
    compatibility: {
      epoch: "KAIOS-GENESIS",
      hosts: entry.lifeType === "RUNTIME" ? ["LOCAL_NODE_OR_BROWSER"] : ["STATIC_GITHUB_PAGES_OR_LOCAL_HTTP"],
      legacy_alias_supported: entry.pathStatus === "MIGRATION_PENDING",
      production_authorized: false
    },
    reproduction_policy: { mode: "PROHIBITED_UNTIL_STANDARD", automatic: false, codex_review_required: true },
    mutation_policy: { mode: "BOUNDED_REVIEW_ONLY", automatic: false, codex_review_required: true },
    transplant_policy: { mode: "PROHIBITED_UNTIL_STANDARD", automatic: false, codex_review_required: true },
    marketplace_policy: { status: "NOT_ELIGIBLE", simulated_only: true, real_kgen: false, onchain_transfer: false },
    lifecycle_state: isSpecification ? "SPECIFIED" : "ACTIVE",
    health_state: isSpecification ? "NOT_EXECUTABLE" : "HEALTHY",
    event_history: [{
      event_id: `EVENT-${entry.key}-REGISTRY-BINDING`,
      event_type: "SOFTWARE_LIFE_REGISTRY_BOUND",
      simulation_time: generatedAt,
      actor: "CODEX_CANONICAL_REVIEW",
      status: "RECORDED",
      reason: "Existing repository organism registered without changing Runtime authority.",
      previous_state_hash: null,
      next_state_hash: artifactHash
    }],
    provenance: {
      source_commit: sourceCommit,
      source_paths: paths,
      generator: "KAIOS/software-life/tools/generate-software-life-registry.mjs",
      review_authority: "CODEX_CANONICAL_REVIEW"
    },
    security_boundary: {
      simulation_only: true,
      real_wallet: false,
      real_kgen: false,
      onchain_transfer: false,
      external_autonomy: false,
      production_authority: false,
      current_modification: false,
      constitution_source_modification: false
    },
    authority_level: "SIMULATION_ONLY",
    organism_status: entry.organismStatus ?? "AUTHORITATIVE",
    runtime_status: entry.runtimeStatus,
    parents: [],
    children: [],
    transplants: [],
    mutations: [],
    marketplace_status: "NOT_ELIGIBLE",
    public_url: entry.publicUrl ?? null,
    api_url: entry.apiUrl ?? null,
    code_hash: sha256(readBlob(entry.entryPath)),
    artifact_hash: artifactHash,
    legacy_aliases: []
  });
}

const registry = {
  metadata: {
    schema_version: "1.0.0",
    task_id: "KAIOS-SOFTWARE-LIFE-CANONICALIZATION-24H-001",
    generated_at: generatedAt,
    source_commit: sourceCommit,
    status: "CODEX_REVIEWED_REGISTRY",
    authority: "SIMULATION_ONLY",
    manifest_schema: "KAIOS/software-life/KAIOS_SOFTWARE_LIFE_MANIFEST_SCHEMA.json",
    taxonomy_crosswalk: "KAIOS/software-life/KAIOS_SOFTWARE_LIFE_TAXONOMY_CROSSWALK.json",
    registry_entries: lives.length,
    public_json_projections_owned: trackedPaths.filter((path) => path.startsWith("api/kaios/") && path.endsWith(".json")).length,
    automatic_canonical_promotion: false
  },
  policy: {
    one_life_one_authoritative_implementation: true,
    duplicate_life_ids: false,
    duplicate_genome_ids: false,
    duplicate_canonical_executable_identities: false,
    migration_pending_paths_are_not_aliases_yet: true,
    real_wallet: false,
    real_kgen: false,
    onchain_transfer: false,
    production_authority: false,
    external_autonomy: false
  },
  software_lives: lives
};

await writeFile(outputPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
console.log(JSON.stringify(registry.metadata, null, 2));
