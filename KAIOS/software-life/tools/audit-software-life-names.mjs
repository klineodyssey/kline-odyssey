/**
 * KAIOS SOFTWARE LIFE
 * life_id: LIFE-KAIOS-SOFTWARE-LIFE-NAMING-AUDITOR
 * species_id: SPECIES-KAIOS-SOFTWARE-TOOL
 * genome_id: GENOME-KAIOS-SOFTWARE-LIFE-NAMING-AUDITOR
 * genome_version: 1.0.0
 * generation: 1
 * organ_type: AUDIT_ORGAN
 * canonical_filename: audit-software-life-names.mjs
 * lifecycle_state: ACTIVE
 * authority: SIMULATION_ONLY
 */

import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const outputRoot = resolve(root, "KAIOS/software-life");
const sourceCommitArg = process.argv.find((value) => value.startsWith("--source-commit="));
const requestedSourceCommit = sourceCommitArg
  ? sourceCommitArg.slice("--source-commit=".length)
  : "HEAD";
const sourceCommit = execFileSync("git", ["-C", root, "rev-parse", requestedSourceCommit], {
  encoding: "utf8"
}).trim();
const generatedAtArg = process.argv.find((value) => value.startsWith("--generated-at="));
const generatedAt = generatedAtArg
  ? generatedAtArg.slice("--generated-at=".length)
  : new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

const trackedFiles = execFileSync("git", ["-C", root, "ls-tree", "-r", "--name-only", "-z", sourceCommit])
  .toString("utf8")
  .split("\0")
  .filter(Boolean)
  .sort((left, right) => left.localeCompare(right, "en"));
const changedSinceSource = new Set(
  execFileSync("git", ["-C", root, "diff", "--name-only", "-z", sourceCommit, "--"])
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
);

async function readSourceFile(path) {
  if (changedSinceSource.has(path)) {
    return execFileSync("git", ["-C", root, "show", `${sourceCommit}:${path}`]);
  }
  return readFile(resolve(root, path));
}

const executableExtensions = new Set([
  ".cjs", ".css", ".html", ".js", ".mjs", ".ps1", ".py", ".sh", ".sol"
]);
const textExtensions = new Set([
  ".cjs", ".css", ".csv", ".html", ".js", ".json", ".md", ".mjs", ".ps1",
  ".py", ".sh", ".sol", ".svg", ".txt", ".yaml", ".yml"
]);
const identityKeys = new Set([
  "life_id", "species_id", "genome_id", "organism_id", "organism_name", "canonical_name"
]);
const classificationOrder = [
  "DOCUMENT_VERSION_ALLOWED",
  "SCHEMA_METADATA_ALLOWED",
  "RELEASE_RECORD_ALLOWED",
  "ARCHIVE_NAME_ALLOWED",
  "LEGACY_ROUTE_ALLOWED",
  "EXECUTABLE_CANONICAL_NAME_VIOLATION",
  "MODULE_CANONICAL_NAME_VIOLATION",
  "PUBLIC_ROUTE_CANONICAL_NAME_VIOLATION",
  "LIFE_IDENTITY_VIOLATION",
  "AMBIGUOUS_REVIEW_REQUIRED"
];
const violationTypes = new Set([
  "EXECUTABLE_CANONICAL_NAME_VIOLATION",
  "MODULE_CANONICAL_NAME_VIOLATION",
  "PUBLIC_ROUTE_CANONICAL_NAME_VIOLATION",
  "LIFE_IDENTITY_VIOLATION"
]);

const versionTokenPattern = /(?:^|[-_.])(v(?:ersion)?[-_.]?\d+(?:[-_.]\d+)*|final|latest|new|copy|backup|rev(?:ision)?(?:[-_.]?\d+(?:[-_.]\d+)*)?)(?=$|[-_.])/gi;
const identityVersionPattern = /(?:^|[-_.])v\d+(?:[-_.]\d+)*(?=$|[-_.])/i;
const versionDirectoryPattern = /^(?:v(?:ersion)?[-_.]?\d+(?:[-_.]\d+)*|.*[-_.]v\d+(?:[-_.]\d+)*)$/i;
const documentRolePattern = /(?:^|[-_.])(spec|report|closeout|recovery|audit|plan|readme|release|whitepaper|work[-_]?order|status|architecture|review|decision|inventory|guide|proposal|manifest|index|changelog|test[-_]?plan)(?:[-_.]|$)/i;
const protectedPattern = /^(?:PRIMEFORGE_GENESIS_BOOT_SEQUENCE(?:_V1_4)?(?:\/|$)|docs\/physics\/|docs\/maps\/UniverseMap_|KGEN\/contracts\/|KGEN\/runtime\/|KGEN\/scripts\/runtime\/|wallet\/)/i;
const constitutionSourcePattern = /(?:^|\/)(?:constitution|constitution-v2-audit|genesis-v2\.1-source)(?:\/|$)/i;

function normalized(path) {
  return path.replaceAll("\\", "/");
}

function tokensFor(path) {
  const matches = [];
  for (const segment of normalized(path).split("/")) {
    versionTokenPattern.lastIndex = 0;
    for (const match of segment.matchAll(versionTokenPattern)) {
      matches.push(match[1]);
    }
  }
  return [...new Set(matches.map((value) => value.toLowerCase()))];
}

function hasVersionedDirectory(path) {
  const parts = normalized(path).split("/").slice(0, -1);
  return parts.some((part) => versionDirectoryPattern.test(part));
}

function isPublicVersionedPath(path) {
  const value = normalized(path);
  return (
    /^world-viewer\/[^/]*[-_.]v\d+(?:[-_.]\d+)*(?:\/|$)/i.test(value) ||
    /^api\/kaios\/.*\/v\d+(?:[-_.]\d+)*(?:\/|$)/i.test(value) ||
    /^api\/kaios\/[^/]*[-_.]v\d+(?:[-_.]\d+)*(?:\/|$)/i.test(value)
  );
}

function isArchived(path) {
  return normalized(path).split("/").some((part) => /^(?:archive|archived|backup)$/i.test(part));
}

function stripVersionTokens(value) {
  let result = value;
  result = result.replace(/([_-])v\d+(?:[_.-]\d+)*/gi, "");
  result = result.replace(/([_-])(?:final|latest|new|copy|backup|rev(?:ision)?(?:[_.-]?\d+(?:[_.-]\d+)*)?)(?=([_.-]|$))/gi, "$2");
  result = result.replace(/__+/g, "_").replace(/--+/g, "-");
  result = result.replace(/[-_.]+(?=\.[^.]+$)/, "");
  return result;
}

function canonicalizePath(path) {
  const parts = normalized(path).split("/");
  const canonical = [];
  for (const part of parts) {
    if (/^v\d+(?:[_.-]\d+)*$/i.test(part)) continue;
    const stripped = stripVersionTokens(part);
    if (stripped) canonical.push(stripped);
  }
  return canonical.join("/");
}

function classifyPath(path) {
  const value = normalized(path);
  const extension = extname(value).toLowerCase();
  const filename = basename(value);
  if (isArchived(value)) {
    return { type: "ARCHIVE_NAME_ALLOWED", action: "KEEP_IMMUTABLE_ARCHIVE_NAME" };
  }
  if (constitutionSourcePattern.test(value)) {
    return { type: "DOCUMENT_VERSION_ALLOWED", action: "KEEP_READ_ONLY_LINEAGE_NAME" };
  }
  if (protectedPattern.test(value)) {
    return { type: "RELEASE_RECORD_ALLOWED", action: "HOLD_PROTECTED_OR_DEPLOYED_ARTIFACT" };
  }
  if (isPublicVersionedPath(value)) {
    return { type: "PUBLIC_ROUTE_CANONICAL_NAME_VIOLATION", action: "CREATE_UNVERSIONED_ROUTE_AND_LEGACY_ALIAS" };
  }
  if (hasVersionedDirectory(value) && /(?:^|\/)KAIOS\/life\/candidates\//i.test(`/${value}`)) {
    return { type: "LIFE_IDENTITY_VIOLATION", action: "MIGRATE_CANDIDATE_PACKAGE_PATH_AFTER_OWNER_REVIEW" };
  }
  if (hasVersionedDirectory(value)) {
    return { type: "MODULE_CANONICAL_NAME_VIOLATION", action: "MIGRATE_MODULE_DIRECTORY_WITH_COMPATIBILITY_ALIAS" };
  }
  if (executableExtensions.has(extension)) {
    return { type: "EXECUTABLE_CANONICAL_NAME_VIOLATION", action: "RENAME_EXECUTABLE_AND_PRESERVE_COMPATIBILITY_ENTRY" };
  }
  if (extension === ".json" && /schema/i.test(filename)) {
    return { type: "MODULE_CANONICAL_NAME_VIOLATION", action: "MOVE_SCHEMA_VERSION_TO_METADATA_AND_ALIAS_OLD_NAME" };
  }
  if ([".md", ".pdf", ".docx", ".xlsx", ".txt"].includes(extension) || documentRolePattern.test(filename)) {
    return { type: "DOCUMENT_VERSION_ALLOWED", action: "KEEP_VERSIONED_DOCUMENT_OR_RELEASE_RECORD" };
  }
  if (/^(?:VERSION|RELEASE|CHANGELOG)/i.test(filename)) {
    return { type: "RELEASE_RECORD_ALLOWED", action: "KEEP_RELEASE_RECORD_NAME" };
  }
  return { type: "AMBIGUOUS_REVIEW_REQUIRED", action: "REVIEW_OWNER_BEFORE_RENAME" };
}

function migrationRisk(path, type) {
  const value = normalized(path);
  if (protectedPattern.test(value) || /(?:^|\/)(?:contracts?|wallet)(?:\/|$)/i.test(value)) return "P0_HOLD";
  if (type === "PUBLIC_ROUTE_CANONICAL_NAME_VIOLATION" || value.startsWith(".github/")) return "HIGH";
  if (type === "EXECUTABLE_CANONICAL_NAME_VIOLATION" || type === "MODULE_CANONICAL_NAME_VIOLATION") return "MEDIUM";
  if (type === "LIFE_IDENTITY_VIOLATION") return "MEDIUM_HIGH";
  return "LOW";
}

function publicUrls(path, canonicalPath) {
  if (!isPublicVersionedPath(path)) return { old_public_url: null, canonical_public_url: null };
  const oldRoot = normalized(path).replace(/\/(?:index\.html|[^/]+\.(?:json|js|css))$/i, "/");
  const canonicalRoot = normalized(canonicalPath).replace(/\/(?:index\.html|[^/]+\.(?:json|js|css))$/i, "/");
  return {
    old_public_url: `/kline-odyssey/${oldRoot}`,
    canonical_public_url: `/kline-odyssey/${canonicalRoot}`
  };
}

function walkIdentityValues(value, path, pointer = "") {
  const hits = [];
  if (Array.isArray(value)) {
    value.forEach((entry, index) => hits.push(...walkIdentityValues(entry, path, `${pointer}/${index}`)));
    return hits;
  }
  if (!value || typeof value !== "object") return hits;
  for (const [key, entry] of Object.entries(value)) {
    const nextPointer = `${pointer}/${key}`;
    if (identityKeys.has(key) && typeof entry === "string" && identityVersionPattern.test(entry)) {
      hits.push({ path, key, pointer: nextPointer, value: entry });
    }
    hits.push(...walkIdentityValues(entry, path, nextPointer));
  }
  return hits;
}

const items = [];
let sequence = 0;
for (const path of trackedFiles) {
  const versionTokens = tokensFor(path);
  if (versionTokens.length) {
    const classification = classifyPath(path);
    const recommended = violationTypes.has(classification.type) ? canonicalizePath(path) : path;
    const urls = publicUrls(path, recommended);
    items.push({
      audit_id: `SOFTWARE-LIFE-NAME-${String(++sequence).padStart(5, "0")}`,
      location_kind: "PATH",
      path,
      filename: basename(path),
      type: classification.type,
      current_role: hasVersionedDirectory(path) ? "VERSION_BEARING_DIRECTORY_OR_PATH" : "VERSION_BEARING_FILENAME",
      version_token: versionTokens,
      canonical_identity: recommended,
      recommended_name: basename(recommended),
      migration_risk: migrationRisk(path, classification.type),
      references: [],
      reference_count: 0,
      public_url_impact: Boolean(urls.old_public_url),
      test_impact: [],
      action: classification.action,
      ...urls
    });
  }

  if (extname(path).toLowerCase() !== ".json") continue;
  try {
    const raw = await readSourceFile(path);
    if (raw.length > 5_000_000) continue;
    const parsed = JSON.parse(raw.toString("utf8"));
    for (const identity of walkIdentityValues(parsed, path)) {
      const canonicalIdentity = stripVersionTokens(identity.value);
      items.push({
        audit_id: `SOFTWARE-LIFE-NAME-${String(++sequence).padStart(5, "0")}`,
        location_kind: "JSON_IDENTITY",
        path,
        filename: basename(path),
        type: "LIFE_IDENTITY_VIOLATION",
        current_role: `${identity.pointer} (${identity.key})`,
        version_token: tokensFor(identity.value),
        canonical_identity: canonicalIdentity,
        recommended_name: canonicalIdentity,
        migration_risk: migrationRisk(path, "LIFE_IDENTITY_VIOLATION"),
        references: [],
        reference_count: 0,
        public_url_impact: false,
        test_impact: [],
        action: "MIGRATE_IDENTITY_WITH_LINEAGE_ALIAS_AFTER_OWNER_REVIEW",
        old_public_url: null,
        canonical_public_url: null,
        current_identity: identity.value
      });
    }
  } catch {
    // Invalid or non-standard JSON is handled by repository JSON validation.
  }
}

const targets = new Map();
for (const item of items) {
  const candidates = item.location_kind === "JSON_IDENTITY"
    ? [item.current_identity]
    : [item.path, item.filename];
  for (const candidate of candidates.filter((value) => value && value.length >= 5)) {
    if (!targets.has(candidate)) targets.set(candidate, []);
    targets.get(candidate).push(item);
  }
}

const targetValues = [...targets.keys()].sort((left, right) => right.length - left.length);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const chunks = [];
for (let index = 0; index < targetValues.length; index += 60) {
  chunks.push(new RegExp(targetValues.slice(index, index + 60).map(escapeRegex).join("|"), "g"));
}
const references = new Map(targetValues.map((target) => [target, new Set()]));
for (const path of trackedFiles) {
  if (!textExtensions.has(extname(path).toLowerCase())) continue;
  let content;
  try {
    const raw = await readSourceFile(path);
    if (raw.length > 3_000_000) continue;
    content = raw.toString("utf8");
  } catch {
    continue;
  }
  for (const pattern of chunks) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) references.get(match[0])?.add(path);
  }
}

for (const [target, targetItems] of targets) {
  const refs = [...(references.get(target) ?? [])].sort();
  for (const item of targetItems) {
    const ownless = refs.filter((path) => path !== item.path);
    item.references = [...new Set([...item.references, ...ownless])].slice(0, 25);
    item.reference_count = new Set([...item.references, ...ownless]).size;
    item.test_impact = item.references.filter((path) => /(?:^|\/)(?:tests?|\.github)(?:\/|$)/i.test(path));
  }
}

const classificationCounts = Object.fromEntries(classificationOrder.map((key) => [key, 0]));
for (const item of items) classificationCounts[item.type] += 1;
const pathItems = items.filter((item) => item.location_kind === "PATH");
const identityItems = items.filter((item) => item.location_kind === "JSON_IDENTITY");
const canonicalCollisions = Object.entries(
  items
    .filter((item) => violationTypes.has(item.type))
    .reduce((groups, item) => {
      const key = item.canonical_identity;
      groups[key] ??= [];
      groups[key].push(item.audit_id);
      return groups;
    }, {})
).filter(([, auditIds]) => auditIds.length > 1)
  .map(([canonical_identity, audit_ids]) => ({ canonical_identity, audit_ids }));

const audit = {
  metadata: {
    schema_version: "1.0.0",
    task_id: "KAIOS-SOFTWARE-LIFE-CANONICALIZATION-24H-001",
    generated_at: generatedAt,
    source_commit: sourceCommit,
    authority: "CODEX_CANONICAL_REVIEW",
    mode: "AUDIT_ONLY_NO_RENAME",
    simulation_only: true,
    source_scope: "GIT_TRACKED_FILES_AT_SOURCE_COMMIT"
  },
  summary: {
    files_audited: trackedFiles.length,
    path_hits: pathItems.length,
    identity_hits: identityItems.length,
    total_items: items.length,
    classifications: classificationCounts,
    violation_items: items.filter((item) => violationTypes.has(item.type)).length,
    canonical_collision_groups: canonicalCollisions.length
  },
  classification_policy: {
    document_versions_remain_allowed: true,
    schema_versions_belong_in_metadata: true,
    release_records_remain_allowed: true,
    archives_remain_immutable: true,
    protected_or_deployed_KGEN_artifacts_are_held: true,
    versioned_public_routes_require_unversioned_canonical_routes_and_legacy_aliases: true,
    no_rename_was_executed: true
  },
  canonical_collisions: canonicalCollisions,
  items
};

const migrationItems = items
  .filter((item) => violationTypes.has(item.type))
  .map((item) => ({
    audit_id: item.audit_id,
    location_kind: item.location_kind,
    old_path: item.path,
    canonical_path: item.location_kind === "PATH" ? item.canonical_identity : item.path,
    old_identity: item.current_identity ?? null,
    canonical_identity: item.location_kind === "JSON_IDENTITY" ? item.canonical_identity : null,
    old_public_url: item.old_public_url,
    canonical_public_url: item.canonical_public_url,
    old_imports: item.references,
    new_imports: item.references.map((path) => ({ path, replace_with: item.canonical_identity })),
    redirect_required: item.type === "PUBLIC_ROUTE_CANONICAL_NAME_VIOLATION",
    alias_required: item.type === "PUBLIC_ROUTE_CANONICAL_NAME_VIOLATION" || item.reference_count > 0,
    compatibility_period: item.type === "PUBLIC_ROUTE_CANONICAL_NAME_VIOLATION"
      ? "UNTIL_PRODUCTION_LINK_AND_CACHE_MIGRATION_EVIDENCE_PASSES"
      : "AT_LEAST_ONE_REVIEWED_RELEASE_CYCLE",
    tests: item.test_impact,
    rollback: item.location_kind === "PATH"
      ? `Restore ${item.path} as the sole entry and remove the unversioned alias created by that batch.`
      : `Restore ${item.current_identity} as the active identity and retain the attempted identity only in lineage history.`,
    risk: item.migration_risk,
    action: item.action,
    status: "PLANNED_NOT_EXECUTED"
  }));
const renamePlan = {
  metadata: {
    schema_version: "1.0.0",
    task_id: audit.metadata.task_id,
    generated_at: generatedAt,
    source_commit: sourceCommit,
    status: "PLANNED_NOT_EXECUTED",
    rename_batches: [
      "AI_COMPANY_EXECUTABLE_AND_API_GENERATORS",
      "LIFE_RUNTIME_AND_ECOLOGY_MODULES",
      "FISHPOND_AND_AGRICULTURE_MODULES",
      "WORLD_VIEWER_AND_PUBLIC_APPLICATIONS",
      "SCHEMAS_AND_API_ROUTES",
      "REMAINING_SOFTWARE_LIFE_ORGANISMS"
    ]
  },
  safety: {
    one_authoritative_implementation_per_life: true,
    compatibility_aliases_required: true,
    protected_current_changes: false,
    real_wallet_changes: false,
    real_kgen_changes: false,
    onchain_transfer: false,
    production_authority: false
  },
  canonical_collisions: canonicalCollisions,
  migrations: migrationItems
};

const report = `# KAIOS Software Life Naming Audit Report

Generated: \`${generatedAt}\`

Source commit: \`${sourceCommit}\`

Mode: \`AUDIT_ONLY_NO_RENAME\`

## Result

The audit read all ${trackedFiles.length} Git-tracked repository files. It found
${pathItems.length} version-bearing path records and ${identityItems.length}
version-bearing JSON identity records. No path, import, public URL, Runtime,
CURRENT, Wallet, KGEN or Constitution source was changed by the audit.

| Classification | Count |
|---|---:|
${classificationOrder.map((key) => `| \`${key}\` | ${classificationCounts[key]} |`).join("\n")}

Violation items: **${audit.summary.violation_items}**

Canonical collision groups requiring owner review: **${canonicalCollisions.length}**

## Decision Rules

- Versioned specifications, reports, release records and immutable archives
  remain valid historical records.
- Protected or deployed KGEN and Wallet artifacts are held; this program does
  not rename or execute them.
- A versioned executable, module identity, public route or Life identity is a
  migration candidate, not permission for a blind rename.
- Public migration creates an unversioned canonical route first. The old route
  remains a generated \`LEGACY_ALIAS / NOT_CANONICAL / DEPRECATION_PENDING\`.
- One generator or implementation owns both canonical and compatibility
  projections.
- JSON identity changes require lineage aliases and owner review; string
  replacement is forbidden.

## Controlled Batches

1. AI Company executable and API generators.
2. Life Runtime and Ecology modules.
3. Fishpond and Agriculture modules.
4. World Viewer and public applications.
5. Schemas and API routes.
6. Remaining software-life organisms.

Each batch must update imports, links, tests, manifests, hashes, Recovery and
Closeout together. The complete item inventory and references are in
\`KAIOS_SOFTWARE_LIFE_NAMING_AUDIT.json\`; the executable migration contract is
in \`KAIOS_SOFTWARE_LIFE_RENAME_PLAN.json\`.

## Boundaries

\`SIMULATION_ONLY\`, \`NO_REAL_WALLET\`, \`NO_REAL_KGEN\`,
\`NO_ONCHAIN_TRANSFER\`, \`NO_PRODUCTION_AUTHORITY\`,
\`NO_CONSTITUTION_SOURCE_MODIFICATION\`, and
\`NO_PROTECTED_CURRENT_MODIFICATION\` remain in force.
`;

await writeFile(resolve(outputRoot, "KAIOS_SOFTWARE_LIFE_NAMING_AUDIT.json"), `${JSON.stringify(audit, null, 2)}\n`, "utf8");
await writeFile(resolve(outputRoot, "KAIOS_SOFTWARE_LIFE_RENAME_PLAN.json"), `${JSON.stringify(renamePlan, null, 2)}\n`, "utf8");
await writeFile(resolve(outputRoot, "KAIOS_SOFTWARE_LIFE_NAMING_AUDIT_REPORT.md"), report, "utf8");

console.log(JSON.stringify(audit.summary, null, 2));
