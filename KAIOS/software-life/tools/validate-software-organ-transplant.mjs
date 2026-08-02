/**
 * KAIOS SOFTWARE LIFE
 * life_id: LIFE-KAIOS-SOFTWARE-ORGAN-TRANSPLANT-VALIDATOR
 * species_id: SPECIES-KAIOS-SOFTWARE-TOOL
 * genome_id: GENOME-KAIOS-SOFTWARE-ORGAN-TRANSPLANT-VALIDATOR
 * genome_version: 1.0.0
 * generation: 1
 * organ_type: AUDIT_ORGAN
 * canonical_filename: validate-software-organ-transplant.mjs
 * lifecycle_state: ACTIVE
 * authority: SIMULATION_ONLY
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const CANONICAL_REGISTRY_PATH = "KAIOS/software-life/KAIOS_SOFTWARE_LIFE_REGISTRY.json";
const CANONICAL_SCHEMA_PATH = "KAIOS/software-life/KAIOS_SOFTWARE_ORGAN_COMPATIBILITY_SCHEMA.json";
const CANONICAL_WORKER_REGISTRY_PATH = "KGEN-KAIOS/worker_registry.json";
const CANONICAL_REVIEWER_ALIAS = "CODEX_CANONICAL_REVIEW";
const CANONICAL_REVIEWER_WORKER_ID = "codex-gm-01";
const CANONICAL_REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const CANONICAL_REMOTE_URL = "https://github.com/klineodyssey/kline-odyssey.git";
const CANONICAL_LINEAGE_ANCHOR = "cc80135f2c6e6a74aad11f34e793c65ac0ee1938";
const gitRootCache = new Map();
const commitCache = new Map();
const blobCache = new Map();
const regularBlobCache = new Map();
const canonicalJsonCache = new Map();

export const COMPATIBILITY_GATES = Object.freeze([
  "DONOR_IDENTITY_VALID",
  "HOST_IDENTITY_VALID",
  "ORGAN_TYPE_COMPATIBLE",
  "GENOME_CONTRACT_COMPATIBLE",
  "INTERFACE_COMPATIBLE",
  "RIGHTS_APPROVED",
  "SECURITY_APPROVED",
  "RESOURCE_CAPACITY_AVAILABLE",
  "ENERGY_CAPACITY_AVAILABLE",
  "DEPENDENCIES_AVAILABLE",
  "LICENSE_OR_USAGE_RIGHT_VALID_SIMULATION",
  "MIGRATION_PLAN_READY",
  "ROLLBACK_PLAN_READY",
  "TESTS_PASS"
]);

export const TRANSPLANT_STATES = Object.freeze([
  "PROPOSED",
  "DONOR_REVIEW",
  "HOST_REVIEW",
  "COMPATIBILITY_TEST",
  "REJECTED",
  "APPROVED_SIMULATION",
  "TRANSPLANTING",
  "INTEGRATION_TEST",
  "ACCEPTED",
  "REWORK_REQUIRED",
  "ROLLED_BACK",
  "COMPLETE"
]);

const APPROVED_STATES = new Set([
  "APPROVED_SIMULATION",
  "TRANSPLANTING",
  "INTEGRATION_TEST",
  "ACCEPTED",
  "COMPLETE"
]);

const ALLOWED_TRANSITIONS = new Map([
  [null, new Set(["PROPOSED"])],
  ["PROPOSED", new Set(["DONOR_REVIEW", "REJECTED"])],
  ["DONOR_REVIEW", new Set(["HOST_REVIEW", "REWORK_REQUIRED", "REJECTED"])],
  ["HOST_REVIEW", new Set(["COMPATIBILITY_TEST", "REWORK_REQUIRED", "REJECTED"])],
  ["COMPATIBILITY_TEST", new Set(["APPROVED_SIMULATION", "REWORK_REQUIRED", "REJECTED"])],
  ["APPROVED_SIMULATION", new Set(["TRANSPLANTING", "REWORK_REQUIRED"])],
  ["TRANSPLANTING", new Set(["INTEGRATION_TEST", "REWORK_REQUIRED", "ROLLED_BACK"])],
  ["INTEGRATION_TEST", new Set(["ACCEPTED", "REWORK_REQUIRED", "ROLLED_BACK"])],
  ["ACCEPTED", new Set(["COMPLETE", "REWORK_REQUIRED", "ROLLED_BACK"])],
  ["REWORK_REQUIRED", new Set(["DONOR_REVIEW", "HOST_REVIEW", "COMPATIBILITY_TEST", "TRANSPLANTING", "REJECTED", "ROLLED_BACK"])],
  ["REJECTED", new Set()],
  ["ROLLED_BACK", new Set()],
  ["COMPLETE", new Set()]
]);

const canonicalJson = (value) => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
  return `{${entries.join(",")}}`;
};

export const computeContentHash = (value) => createHash("sha256").update(value).digest("hex");

export const computeTransplantEventHash = (event) => {
  const payload = { ...event };
  delete payload.next_state_hash;
  return computeContentHash(canonicalJson(payload));
};

export const computeGateEvidenceHash = (gate, evidence) => computeContentHash(canonicalJson({
    gate,
    result: evidence.result,
    evidence_refs: evidence.evidence_refs,
    evidence_commit: evidence.evidence_commit,
    evidence_content_hashes: evidence.evidence_content_hashes,
    reviewer: evidence.reviewer,
    reason: evidence.reason,
  reviewed_at: evidence.reviewed_at
}));

export const computePlanArtifactHash = (plan) => {
  const payload = { ...plan };
  delete payload.artifact_hash;
  return computeContentHash(canonicalJson(payload));
};

export const computeOrganCompatibilitySignature = (organ, securityBoundary) => computeContentHash(canonicalJson({
  organ_id: organ.organ_id,
  organ_type: organ.organ_type,
  owner_life_id: organ.owner_life_id,
  genome_contract: organ.genome_contract,
  input_interface: organ.input_interface,
  output_interface: organ.output_interface,
  resource_cost: organ.resource_cost,
  energy_cost: organ.energy_cost,
  transplantable: organ.transplantable,
  required_host_capabilities: organ.required_host_capabilities,
  forbidden_hosts: organ.forbidden_hosts,
  dependency_list: organ.dependency_list,
  security_boundary: securityBoundary
}));

export const computeCompletionEvidenceHash = (evidence) => {
  const payload = { ...evidence };
  delete payload.attestation_hash;
  return computeContentHash(canonicalJson(payload));
};

export const computeReplayStateHash = (projection) => computeContentHash(canonicalJson(projection));

const push = (errors, code, path, message) => errors.push({ code, path, message });

const jsonPointerValue = (document, pointer) => {
  if (pointer === "#") return document;
  if (!pointer.startsWith("#/")) return undefined;
  return pointer.slice(2).split("/").reduce((value, token) => (
    value?.[token.replaceAll("~1", "/").replaceAll("~0", "~")]
  ), document);
};

const isValidRfc3339DateTime = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (year === 0 || month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) return false;
  if (hour > 23 || minute > 59 || second > 59) return false;
  if (offsetHourText !== undefined && (Number(offsetHourText) > 23 || Number(offsetMinuteText) > 59)) return false;
  return Number.isFinite(Date.parse(value));
};

const typeMatches = (value, type) => {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type;
};

const schemaErrors = (value, schema, rootSchema, path) => {
  if (schema === true) return [];
  if (schema === false) return [{ path, keyword: "falseSchema", message: "value is forbidden by schema" }];
  if (!schema || typeof schema !== "object") return [{ path, keyword: "schema", message: "schema node is invalid" }];

  const errors = [];
  const add = (keyword, message, childPath = path) => errors.push({ path: childPath, keyword, message });
  if (schema.$ref) {
    const target = jsonPointerValue(rootSchema, schema.$ref);
    if (target === undefined) add("$ref", `unresolved local reference ${schema.$ref}`);
    else errors.push(...schemaErrors(value, target, rootSchema, path));
  }
  for (const child of schema.allOf ?? []) errors.push(...schemaErrors(value, child, rootSchema, path));
  if (schema.anyOf) {
    const branches = schema.anyOf.map((child) => schemaErrors(value, child, rootSchema, path));
    if (!branches.some((branch) => branch.length === 0)) add("anyOf", "value does not match any allowed schema branch");
  }
  if (schema.oneOf) {
    const matches = schema.oneOf.filter((child) => schemaErrors(value, child, rootSchema, path).length === 0).length;
    if (matches !== 1) add("oneOf", `value must match exactly one schema branch; matched ${matches}`);
  }
  if (schema.if) {
    const conditionMatches = schemaErrors(value, schema.if, rootSchema, path).length === 0;
    if (conditionMatches && schema.then) errors.push(...schemaErrors(value, schema.then, rootSchema, path));
    if (!conditionMatches && schema.else) errors.push(...schemaErrors(value, schema.else, rootSchema, path));
  }

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => typeMatches(value, type))) {
      add("type", `expected ${types.join(" or ")}`);
      return errors;
    }
  }
  if (Object.hasOwn(schema, "const") && canonicalJson(value) !== canonicalJson(schema.const)) {
    add("const", `value must equal ${canonicalJson(schema.const)}`);
  }
  if (schema.enum && !schema.enum.some((candidate) => canonicalJson(candidate) === canonicalJson(value))) {
    add("enum", "value is not in the allowed set");
  }

  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) add("minLength", `minimum length is ${schema.minLength}`);
    if (schema.pattern && !(new RegExp(schema.pattern, "u")).test(value)) add("pattern", `value does not match ${schema.pattern}`);
    if (schema.format === "date-time" && !isValidRfc3339DateTime(value)) {
      add("format", "value must be an RFC 3339 date-time");
    }
  }
  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) {
    add("minimum", `minimum value is ${schema.minimum}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) add("minItems", `minimum item count is ${schema.minItems}`);
    if (schema.uniqueItems && new Set(value.map(canonicalJson)).size !== value.length) add("uniqueItems", "array items must be unique");
    if (schema.items) value.forEach((item, index) => errors.push(...schemaErrors(item, schema.items, rootSchema, `${path}[${index}]`)));
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(value, required)) add("required", `${required} is required`, `${path}.${required}`);
    }
    if (schema.minProperties !== undefined && Object.keys(value).length < schema.minProperties) add("minProperties", `minimum property count is ${schema.minProperties}`);
    for (const [key, childValue] of Object.entries(value)) {
      if (schema.properties?.[key]) {
        errors.push(...schemaErrors(childValue, schema.properties[key], rootSchema, `${path}.${key}`));
      } else if (schema.additionalProperties === false) {
        add("additionalProperties", `${key} is not declared`, `${path}.${key}`);
      } else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
        errors.push(...schemaErrors(childValue, schema.additionalProperties, rootSchema, `${path}.${key}`));
      }
    }
  }
  return errors;
};

export const validateJsonSchema202012 = (value, schema) => {
  const errors = schemaErrors(value, schema, schema, "$");
  return { ok: errors.length === 0, errors };
};

const git = (repositoryRoot, args, encoding = "utf8") => execFileSync("git", args, {
  cwd: repositoryRoot,
  encoding,
  maxBuffer: 32 * 1024 * 1024,
  stdio: ["ignore", "pipe", "ignore"]
});

const gitRoot = (repositoryRoot) => {
  const key = resolve(repositoryRoot);
  if (gitRootCache.has(key)) return gitRootCache.get(key);
  try {
    const value = resolve(git(repositoryRoot, ["rev-parse", "--show-toplevel"]).trim());
    gitRootCache.set(key, value);
    return value;
  } catch {
    gitRootCache.set(key, null);
    return null;
  }
};

const commitExists = (repositoryRoot, commit) => {
  if (!repositoryRoot || !commit) return false;
  const key = `${resolve(repositoryRoot)}\0${commit}`;
  if (commitCache.has(key)) return commitCache.get(key);
  try {
    git(repositoryRoot, ["cat-file", "-e", `${commit}^{commit}`]);
    commitCache.set(key, true);
    return true;
  } catch {
    commitCache.set(key, false);
    return false;
  }
};

const commitReachableFromHead = (repositoryRoot, commit) => {
  if (!commitExists(repositoryRoot, commit)) return false;
  try {
    git(repositoryRoot, ["merge-base", "--is-ancestor", commit, "HEAD"]);
    return true;
  } catch {
    return false;
  }
};

const commitStrictAncestor = (repositoryRoot, ancestor, descendant = "HEAD") => {
  if (!commitExists(repositoryRoot, ancestor) || !commitExists(repositoryRoot, descendant)) return false;
  try {
    const resolvedAncestor = git(repositoryRoot, ["rev-parse", `${ancestor}^{commit}`]).trim();
    const resolvedDescendant = git(repositoryRoot, ["rev-parse", `${descendant}^{commit}`]).trim();
    if (resolvedAncestor === resolvedDescendant) return false;
    git(repositoryRoot, ["merge-base", "--is-ancestor", resolvedAncestor, resolvedDescendant]);
    return true;
  } catch {
    return false;
  }
};

const gitBlob = (repositoryRoot, commit, repositoryPath) => {
  if (!repositoryRoot || !commit || !repositoryPath) return null;
  const key = `${resolve(repositoryRoot)}\0${commit}\0${repositoryPath}`;
  if (blobCache.has(key)) return blobCache.get(key);
  try {
    const object = `${commit}:${repositoryPath.replaceAll("\\", "/")}`;
    if (git(repositoryRoot, ["cat-file", "-t", object]).trim() !== "blob") {
      blobCache.set(key, null);
      return null;
    }
    const value = git(repositoryRoot, ["show", object], null);
    blobCache.set(key, value);
    return value;
  } catch {
    blobCache.set(key, null);
    return null;
  }
};

const gitRegularFileBlob = (repositoryRoot, commit, repositoryPath) => {
  if (!repositoryRoot || !commit || !repositoryPath) return null;
  const normalizedPath = repositoryPath.replaceAll("\\", "/");
  const key = `${resolve(repositoryRoot)}\0${commit}\0${normalizedPath}`;
  if (regularBlobCache.has(key)) return regularBlobCache.get(key);
  try {
    const entry = git(repositoryRoot, ["ls-tree", "-z", commit, "--", normalizedPath], null);
    const header = entry.toString("utf8").split("\0", 1)[0] ?? "";
    const match = /^(100644|100755) blob [a-f0-9]+\t/.exec(header);
    const value = match ? gitBlob(repositoryRoot, commit, normalizedPath) : null;
    regularBlobCache.set(key, value);
    return value;
  } catch {
    regularBlobCache.set(key, null);
    return null;
  }
};

const repositoryFile = (repositoryRoot, repositoryPath) => {
  const root = resolve(repositoryRoot);
  const target = resolve(root, repositoryPath);
  const relativeTarget = relative(root, target);
  const escapesRoot = relativeTarget === ".."
    || relativeTarget.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
    || isAbsolute(relativeTarget);
  if (escapesRoot) return null;
  try {
    const rootReal = realpathSync(root);
    const targetReal = realpathSync(target);
    const relativeRealTarget = relative(rootReal, targetReal);
    const escapesRealRoot = relativeRealTarget === ".."
      || relativeRealTarget.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
      || isAbsolute(relativeRealTarget);
    if (escapesRealRoot || lstatSync(target).isSymbolicLink() || !lstatSync(target).isFile()) return null;
    let cursor = root;
    for (const component of relativeTarget.split(/[\\/]+/u).filter(Boolean)) {
      cursor = resolve(cursor, component);
      if (lstatSync(cursor).isSymbolicLink()) return null;
    }
    return target;
  } catch {
    return null;
  }
};

const readCanonicalJson = (repositoryRoot, path, errors) => {
  const target = repositoryFile(repositoryRoot, path);
  if (!target) {
    push(errors, "CANONICAL_GOVERNANCE_FILE_MISSING", path, `${path} must be a regular file in the repository`);
    return null;
  }
  const headBlob = gitRegularFileBlob(repositoryRoot, "HEAD", path);
  if (!headBlob) {
    push(errors, "CANONICAL_GOVERNANCE_FILE_UNTRACKED", path, `${path} must be an immutable Git blob at HEAD`);
    return null;
  }
  try {
    const workingBytes = readFileSync(target);
    const value = JSON.parse(workingBytes.toString("utf8"));
    const workingObjectId = git(repositoryRoot, ["hash-object", `--path=${path}`, "--", path]).trim();
    const committedObjectId = git(repositoryRoot, ["rev-parse", `HEAD:${path}`]).trim();
    if (workingObjectId !== committedObjectId) {
      push(errors, "CANONICAL_GOVERNANCE_WORKTREE_DRIFT", path, `${path} must match its committed HEAD blob`);
      return null;
    }
    const cacheKey = `${resolve(repositoryRoot)}\0${committedObjectId}\0${path}`;
    if (canonicalJsonCache.has(cacheKey)) return canonicalJsonCache.get(cacheKey);
    canonicalJsonCache.set(cacheKey, value);
    return value;
  } catch {
    push(errors, "CANONICAL_GOVERNANCE_FILE_INVALID", path, `${path} must contain valid JSON`);
    return null;
  }
};

const loadCanonicalGovernance = (repositoryRoot, errors) => {
  if (!repositoryRoot) {
    push(errors, "REPOSITORY_ROOT_REQUIRED", "repositoryRoot", "the canonical Git repository root is required");
    return {};
  }
  const root = resolve(repositoryRoot);
  if (root.toLowerCase() !== CANONICAL_REPOSITORY_ROOT.toLowerCase()) {
    push(errors, "CALLER_REPOSITORY_ROOT_FORBIDDEN", "repositoryRoot", "validation must use the repository containing this canonical validator module");
    return { root: CANONICAL_REPOSITORY_ROOT };
  }
  const actualGitRoot = gitRoot(root);
  if (!actualGitRoot || actualGitRoot.toLowerCase() !== root.toLowerCase()) {
    push(errors, "CANONICAL_REPOSITORY_ROOT_REQUIRED", "repositoryRoot", "repositoryRoot must equal the Git top-level directory");
    return { root };
  }
  try {
    if (git(root, ["remote", "get-url", "origin"]).trim() !== CANONICAL_REMOTE_URL) {
      push(errors, "CANONICAL_REPOSITORY_REMOTE_INVALID", "repositoryRoot", "origin must be the KLINE Odyssey canonical repository");
    }
  } catch {
    push(errors, "CANONICAL_REPOSITORY_REMOTE_INVALID", "repositoryRoot", "canonical origin remote is required");
  }
  if (!commitReachableFromHead(root, CANONICAL_LINEAGE_ANCHOR)) {
    push(errors, "CANONICAL_REPOSITORY_LINEAGE_INVALID", "repositoryRoot", "HEAD must descend from the reviewed Software Life Registry lineage anchor");
  }
  const registry = readCanonicalJson(root, CANONICAL_REGISTRY_PATH, errors);
  const schema = readCanonicalJson(root, CANONICAL_SCHEMA_PATH, errors);
  const workerRegistry = readCanonicalJson(root, CANONICAL_WORKER_REGISTRY_PATH, errors);
  if (registry) {
    const metadata = registry.metadata ?? {};
    const policy = registry.policy ?? {};
    if (metadata.schema_version !== "1.0.0"
      || metadata.status !== "CODEX_REVIEWED_REGISTRY"
      || metadata.authority !== "SIMULATION_ONLY"
      || metadata.automatic_canonical_promotion !== false
      || metadata.registry_entries !== registry.software_lives?.length) {
      push(errors, "CANONICAL_REGISTRY_METADATA_INVALID", CANONICAL_REGISTRY_PATH, "Registry metadata does not satisfy the reviewed canonical contract");
    }
    for (const [field, expected] of Object.entries({
      one_life_one_authoritative_implementation: true,
      duplicate_life_ids: false,
      duplicate_genome_ids: false,
      duplicate_canonical_executable_identities: false,
      real_wallet: false,
      real_kgen: false,
      onchain_transfer: false,
      production_authority: false,
      external_autonomy: false
    })) {
      if (policy[field] !== expected) push(errors, "CANONICAL_REGISTRY_POLICY_INVALID", `${CANONICAL_REGISTRY_PATH}#policy.${field}`, `${field} must equal ${expected}`);
    }
    if (!commitReachableFromHead(root, metadata.source_commit)) {
      push(errors, "CANONICAL_REGISTRY_SOURCE_COMMIT_INVALID", `${CANONICAL_REGISTRY_PATH}#metadata.source_commit`, "Registry source_commit must be reachable from canonical HEAD");
    }
  }
  if (workerRegistry && (workerRegistry.metadata?.source_of_truth !== true || workerRegistry.metadata?.status !== "ACTIVE")) {
    push(errors, "WORKER_REGISTRY_AUTHORITY_INVALID", CANONICAL_WORKER_REGISTRY_PATH, "Worker Registry must be the active source of truth");
  }
  return { root, registry, schema, workerRegistry };
};

const registeredWorker = (workerRegistry, actor) => {
  const workerId = actor === CANONICAL_REVIEWER_ALIAS ? CANONICAL_REVIEWER_WORKER_ID : actor;
  return workerRegistry?.workers?.find(({ worker_id }) => worker_id === workerId) ?? null;
};

const isAuthorizedWorker = (workerRegistry, actor, canonicalReview = false) => {
  if (canonicalReview && actor !== CANONICAL_REVIEWER_ALIAS) return false;
  const worker = registeredWorker(workerRegistry, actor);
  const trust = Number.parseInt(String(worker?.trust_level ?? "T0").replace(/^T/, ""), 10);
  return Boolean(worker
    && worker.status === "ACTIVE"
    && ["ACTIVE", "TRUSTED", "SENIOR_TRUSTED"].includes(worker.employee_status)
    && trust >= 2
    && worker.boot_acknowledged === true
    && worker.canon_acknowledged === true
    && worker.workspace_policy_acknowledged === true
    && worker.do_not_touch_acknowledged === true
    && worker.suspension === null
    && (!canonicalReview || (
      worker.worker_id === CANONICAL_REVIEWER_WORKER_ID
      && worker.permission === "system_maintainer"
      && worker.can_push_main === true
      && worker.role.includes("Reviewer")
    )));
};

const registryMaps = (registry) => {
  const lives = Array.isArray(registry?.software_lives) ? registry.software_lives : [];
  const lifeById = new Map(lives.map((life) => [life.life_id, life]));
  const organById = new Map();
  for (const life of lives) {
    for (const organ of life.organs ?? []) organById.set(organ.organ_id, { life, organ });
  }
  return { lives, lifeById, organById };
};

const canonicalActionForState = (state) => {
  if (state === "ROLLED_BACK") return "ROLLBACK-RESTORE";
  if (state === "COMPLETE") return "COMPLETE-TRANSPLANT";
  return `TRANSITION-${state}`;
};

const canonicalStatusForState = (state) => {
  if (state === "COMPLETE") return "COMPLETE";
  if (state === "REJECTED") return "REJECTED";
  return "PASS";
};

const CANONICAL_DECISION_STATES = new Set([
  "APPROVED_SIMULATION",
  "REWORK_REQUIRED",
  "REJECTED",
  "ACCEPTED",
  "ROLLED_BACK",
  "COMPLETE"
]);

const validateExactDelta = (delta, expectedUnit, expectedValue, errors, path, code) => {
  const entries = Object.entries(delta ?? {});
  if (entries.length !== 1 || entries[0][0] !== expectedUnit || entries[0][1] !== expectedValue) {
    push(errors, code, path, `delta must equal exactly { ${expectedUnit}: ${expectedValue} } from the registered organ contract`);
  }
};

export const validateSoftwareOrganTransplant = (record, options = {}) => {
  const errors = [];
  if (Object.hasOwn(options, "registry")) {
    push(errors, "CALLER_REGISTRY_FORBIDDEN", "options.registry", `Registry input must come only from ${CANONICAL_REGISTRY_PATH}`);
  }
  if (Object.hasOwn(options, "schema")) {
    push(errors, "CALLER_SCHEMA_FORBIDDEN", "options.schema", `Schema input must come only from ${CANONICAL_SCHEMA_PATH}`);
  }
  const governance = loadCanonicalGovernance(options.repositoryRoot, errors);
  const { registry, schema, workerRegistry, root: repositoryRoot } = governance;
  if (schema) {
    const structural = validateJsonSchema202012(record, schema);
    for (const error of structural.errors) {
      push(errors, "SCHEMA_VALIDATION_FAILED", error.path, `${error.keyword}: ${error.message}`);
    }
  }
  const organ = record?.organ;
  const review = record?.compatibility_review;
  const transplant = record?.transplant;
  const boundary = record?.security_boundary ?? {};

  if (!organ || !review || !transplant) {
    push(errors, "RECORD_SECTION_MISSING", "$", "organ, compatibility_review and transplant are required");
    return { ok: false, errors };
  }

  if (organ.compatibility_signature !== computeOrganCompatibilitySignature(organ, boundary)) {
    push(errors, "ORGAN_COMPATIBILITY_SIGNATURE_INVALID", "organ.compatibility_signature", "compatibility signature must bind identity, Genome, interfaces, costs, dependencies, capabilities and security boundary");
  }

  const registryIndex = registryMaps(registry);
  if (registryIndex.lives.length === 0) {
    push(errors, "AUTHORITATIVE_REGISTRY_REQUIRED", "registry", "an authoritative Software Life Registry is required");
  }

  if (!isAuthorizedWorker(workerRegistry, review.reviewer, true)) {
    push(errors, "CANONICAL_REVIEWER_NOT_AUTHORIZED", "compatibility_review.reviewer", "reviewer must resolve to the active canonical Codex reviewer in Worker Registry");
  }

  if (organ.organ_id !== review.organ_id || organ.organ_id !== transplant.organ_id) {
    push(errors, "ORGAN_ID_MISMATCH", "organ.organ_id", "organ, review and transplant must reference one organ identity");
  }
  if (organ.owner_life_id !== review.donor_life_id || review.donor_life_id !== transplant.donor_life_id) {
    push(errors, "DONOR_IDENTITY_MISMATCH", "compatibility_review.donor_life_id", "donor identity must own the organ and match the transplant");
  }
  if (organ.genome_contract?.genome_id !== review.donor_genome_id) {
    push(errors, "DONOR_GENOME_MISMATCH", "compatibility_review.donor_genome_id", "reviewed donor Genome must match the organ Genome contract");
  }
  if (review.host_life_id !== transplant.host_life_id) {
    push(errors, "HOST_IDENTITY_MISMATCH", "compatibility_review.host_life_id", "review and transplant host identities must match");
  }
  if (review.review_id !== transplant.compatibility_review_id) {
    push(errors, "REVIEW_ID_MISMATCH", "transplant.compatibility_review_id", "transplant must bind the reviewed compatibility decision");
  }
  if (transplant.automatic !== false) {
    push(errors, "AUTOMATIC_TRANSPLANT_FORBIDDEN", "transplant.automatic", "software organ transplantation requires explicit Codex review");
  }
  if (transplant.rollback_plan?.baseline_commit !== transplant.migration_plan?.baseline_commit) {
    push(errors, "ROLLBACK_BASELINE_COMMIT_MISMATCH", "transplant.rollback_plan.baseline_commit", "rollback and migration plans must bind the same pre-transplant commit");
  }
  if (transplant.rollback_plan?.baseline_state_hash !== transplant.migration_plan?.baseline_state_hash) {
    push(errors, "ROLLBACK_BASELINE_STATE_MISMATCH", "transplant.rollback_plan.baseline_state_hash", "rollback and migration plans must bind the same pre-transplant state hash");
  }
  if (transplant.rollback_plan?.baseline_state_ref !== transplant.migration_plan?.baseline_state_ref) {
    push(errors, "ROLLBACK_BASELINE_REFERENCE_MISMATCH", "transplant.rollback_plan.baseline_state_ref", "rollback and migration plans must bind the same pre-transplant state reference");
  }
  if (organ.forbidden_hosts?.includes(review.host_life_id)) {
    push(errors, "FORBIDDEN_HOST", "compatibility_review.host_life_id", "host is explicitly forbidden by the donor organ");
  }
  if (!organ.genome_contract?.required_host_life_types?.includes(review.host_life_type)) {
    push(errors, "HOST_LIFE_TYPE_INCOMPATIBLE", "compatibility_review.host_life_type", "host Life type is outside the organ Genome contract");
  }
  for (const capability of organ.required_host_capabilities ?? []) {
    if (!review.host_capabilities?.includes(capability)) {
      push(errors, "HOST_CAPABILITY_MISSING", "compatibility_review.host_capabilities", `missing required host capability: ${capability}`);
    }
  }

  const donorLife = registryIndex.lifeById.get(review.donor_life_id);
  const hostLife = registryIndex.lifeById.get(review.host_life_id);
  if (!donorLife) {
    push(errors, "LIFE_ID_NOT_REGISTERED", "compatibility_review.donor_life_id", `${review.donor_life_id} is not registered`);
  } else {
    if (donorLife.genome_id !== review.donor_genome_id) {
      push(errors, "REGISTERED_DONOR_GENOME_MISMATCH", "compatibility_review.donor_genome_id", "donor Genome must equal the authoritative Registry record");
    }
    const registeredOrgan = donorLife.organs?.find(({ organ_id }) => organ_id === organ.organ_id);
    if (!registeredOrgan) {
      push(errors, "DONOR_ORGAN_NOT_REGISTERED", "organ.organ_id", "organ must belong to the registered donor Life");
    } else {
      if (registeredOrgan.organ_type !== organ.organ_type) {
        push(errors, "REGISTERED_ORGAN_TYPE_MISMATCH", "organ.organ_type", "organ type must equal the authoritative Registry projection");
      }
      if (registeredOrgan.content_hash !== organ.genome_contract?.code_or_artifact_hash) {
        push(errors, "REGISTERED_ORGAN_HASH_MISMATCH", "organ.genome_contract.code_or_artifact_hash", "organ artifact hash must equal the authoritative Registry projection");
      }
      const registeredBlob = gitRegularFileBlob(repositoryRoot, registry?.metadata?.source_commit, registeredOrgan.path);
      if (!registeredBlob) {
        push(errors, "REGISTERED_ORGAN_PROVENANCE_MISSING", "organ.genome_contract.code_or_artifact_hash", "registered organ path must resolve at the Registry source commit");
      } else if (registeredOrgan.content_hash !== computeContentHash(registeredBlob)) {
        push(errors, "REGISTERED_ORGAN_PROVENANCE_HASH_INVALID", "organ.genome_contract.code_or_artifact_hash", "registered organ hash must equal the immutable Registry source blob");
      }
    }
  }
  if (!hostLife) {
    push(errors, "LIFE_ID_NOT_REGISTERED", "compatibility_review.host_life_id", `${review.host_life_id} is not registered`);
  } else {
    if (hostLife.genome_id !== review.host_genome_id) {
      push(errors, "REGISTERED_HOST_GENOME_MISMATCH", "compatibility_review.host_genome_id", "host Genome must equal the authoritative Registry record");
    }
    if (hostLife.life_type !== review.host_life_type) {
      push(errors, "REGISTERED_HOST_TYPE_MISMATCH", "compatibility_review.host_life_type", "host Life type must equal the authoritative Registry record");
    }
  }

  const rightsBindings = [
    ["donor_owner", donorLife?.rights?.owner],
    ["donor_custodian", donorLife?.rights?.custodian],
    ["host_owner", hostLife?.rights?.owner],
    ["host_operator", hostLife?.rights?.operator]
  ];
  for (const [field, expected] of rightsBindings) {
    if (expected && review.rights_record?.[field] !== expected) {
      push(errors, "RIGHTS_PRINCIPAL_NOT_REGISTERED", `compatibility_review.rights_record.${field}`, `${field} must equal the authoritative Software Life Registry principal`);
    }
  }

  const migrationPlan = transplant.migration_plan ?? {};
  const rollbackPlan = transplant.rollback_plan ?? {};
  for (const [name, plan] of [["migration_plan", migrationPlan], ["rollback_plan", rollbackPlan]]) {
    if (!isAuthorizedWorker(workerRegistry, plan.owner, true)) {
      push(errors, "PLAN_OWNER_NOT_AUTHORIZED", `transplant.${name}.owner`, "plan owner must resolve to the canonical reviewer in Worker Registry");
    }
    if (plan.artifact_hash !== computePlanArtifactHash(plan)) {
      push(errors, "PLAN_ARTIFACT_HASH_INVALID", `transplant.${name}.artifact_hash`, "artifact_hash must bind the complete deterministic plan");
    }
    if (!commitReachableFromHead(repositoryRoot, plan.baseline_commit)) {
      push(errors, "BASELINE_COMMIT_NOT_REACHABLE", `transplant.${name}.baseline_commit`, "baseline_commit must be reachable from canonical HEAD");
    } else if (!commitStrictAncestor(repositoryRoot, plan.baseline_commit, "HEAD")) {
      push(errors, "BASELINE_COMMIT_NOT_PRE_TRANSPLANT", `transplant.${name}.baseline_commit`, "baseline_commit must be a strict ancestor of canonical HEAD, never HEAD itself");
    }
    const expectedHostPath = hostLife?.location?.canonical_path;
    if (expectedHostPath && plan.baseline_state_ref !== expectedHostPath) {
      push(errors, "BASELINE_HOST_REFERENCE_MISMATCH", `transplant.${name}.baseline_state_ref`, "baseline_state_ref must equal the registered host canonical path");
    }
    const baselineBlob = repositoryRoot && plan.baseline_commit && plan.baseline_state_ref
      ? gitRegularFileBlob(repositoryRoot, plan.baseline_commit, plan.baseline_state_ref)
      : null;
    if (!baselineBlob) {
      push(errors, "BASELINE_STATE_NOT_REPRODUCIBLE", `transplant.${name}.baseline_state_ref`, "baseline state must resolve to an immutable Git blob at baseline_commit");
    } else if (plan.baseline_state_hash !== computeContentHash(baselineBlob)) {
      push(errors, "BASELINE_STATE_HASH_INVALID", `transplant.${name}.baseline_state_hash`, "baseline_state_hash must equal the referenced Git blob SHA-256");
    }
  }
  const baselineRegistryBlob = repositoryRoot && migrationPlan.baseline_commit
    ? gitRegularFileBlob(repositoryRoot, migrationPlan.baseline_commit, CANONICAL_REGISTRY_PATH)
    : null;
  if (!baselineRegistryBlob) {
    push(errors, "BASELINE_REGISTRY_NOT_REPRODUCIBLE", "transplant.migration_plan.baseline_commit", "pre-transplant baseline must contain the canonical Software Life Registry as a regular Git file");
  } else {
    try {
      const baselineRegistry = JSON.parse(baselineRegistryBlob.toString("utf8"));
      const baselineHost = baselineRegistry.software_lives?.find(({ life_id }) => life_id === transplant.host_life_id);
      if (!baselineHost) {
        push(errors, "BASELINE_HOST_NOT_REGISTERED", "transplant.migration_plan.baseline_commit", "host Life must exist in the pre-transplant Registry baseline");
      } else if ((baselineHost.transplants ?? []).some((item) => (
        item === transplant.transplant_id || item?.transplant_id === transplant.transplant_id
      ))) {
        push(errors, "BASELINE_ALREADY_CONTAINS_TRANSPLANT", "transplant.migration_plan.baseline_commit", "pre-transplant Registry baseline must not already contain the transplant identity");
      }
    } catch {
      push(errors, "BASELINE_REGISTRY_INVALID", "transplant.migration_plan.baseline_commit", "pre-transplant Registry baseline must contain valid JSON");
    }
  }
  if (organ.transplantable !== true) {
    push(errors, "ORGAN_NOT_TRANSPLANTABLE", "organ.transplantable", "donor organ must explicitly allow controlled transplant review");
  }
  for (const [index, dependencyId] of (organ.dependency_list ?? []).entries()) {
    if (!registryIndex.lifeById.has(dependencyId) && !registryIndex.organById.has(dependencyId)) {
      push(errors, "DEPENDENCY_NOT_REGISTERED", `organ.dependency_list[${index}]`, `${dependencyId} is not an authoritative Life or Organ ID`);
    }
  }

  if (boundary.simulation_only !== true) {
    push(errors, "SIMULATION_BOUNDARY_MISSING", "security_boundary.simulation_only", "transplant records must remain simulation-only");
  }
  for (const field of [
    "real_wallet",
    "real_kgen",
    "onchain_transfer",
    "external_autonomy",
    "production_authority",
    "self_modifying_production_code",
    "protected_current_modification",
    "constitution_source_modification",
    "real_ownership_transfer"
  ]) {
    if (boundary[field] !== false) push(errors, "AUTHORITY_BOUNDARY_VIOLATION", `security_boundary.${field}`, `${field} must be false`);
  }

  const events = Array.isArray(transplant.events) ? transplant.events : [];
  const evidenceEvents = new Map([
    ...(organ.event_history ?? []).map((event) => [event.event_id, event]),
    ...events.map((event) => [event.event_id, event])
  ]);

  for (const gate of COMPATIBILITY_GATES) {
    const result = review.gates?.[gate];
    const evidence = review.gate_evidence?.[gate];
    if (!evidence) {
      push(errors, "GATE_EVIDENCE_MISSING", `compatibility_review.gate_evidence.${gate}`, "gate evidence is required");
    } else if (result !== evidence.result) {
      push(errors, "GATE_EVIDENCE_MISMATCH", `compatibility_review.gate_evidence.${gate}.result`, "evidence result must equal the aggregate gate result");
    }
    if (evidence && evidence.evidence_hash !== computeGateEvidenceHash(gate, evidence)) {
      push(errors, "GATE_EVIDENCE_HASH_INVALID", `compatibility_review.gate_evidence.${gate}.evidence_hash`, "evidence hash must bind the canonical evidence record");
    }
    if (evidence && evidence.reviewer !== review.reviewer) {
      push(errors, "GATE_REVIEWER_MISMATCH", `compatibility_review.gate_evidence.${gate}.reviewer`, "gate reviewer must equal the compatibility review authority");
    }
    if (evidence && !isAuthorizedWorker(workerRegistry, evidence.reviewer, true)) {
      push(errors, "GATE_REVIEWER_NOT_AUTHORIZED", `compatibility_review.gate_evidence.${gate}.reviewer`, "gate reviewer must resolve to the canonical reviewer in Worker Registry");
    }
    if (evidence && !commitReachableFromHead(repositoryRoot, evidence.evidence_commit)) {
      push(errors, "EVIDENCE_COMMIT_NOT_REACHABLE", `compatibility_review.gate_evidence.${gate}.evidence_commit`, "evidence_commit must be reachable from canonical HEAD");
    } else if (evidence && !commitStrictAncestor(repositoryRoot, migrationPlan.baseline_commit, evidence.evidence_commit)) {
      push(errors, "EVIDENCE_NOT_AFTER_BASELINE", `compatibility_review.gate_evidence.${gate}.evidence_commit`, "review evidence must be committed after the immutable pre-transplant baseline");
    }
    const referencedHashes = evidence?.evidence_content_hashes ?? {};
    const referencedKeys = new Set(evidence?.evidence_refs ?? []);
    if (evidence && !(evidence.evidence_refs ?? []).some((reference) => reference.includes("/"))) {
      push(errors, "EVIDENCE_REPOSITORY_ARTIFACT_REQUIRED", `compatibility_review.gate_evidence.${gate}.evidence_refs`, "every gate requires at least one immutable repository artifact");
    }
    for (const unexpected of Object.keys(referencedHashes).filter((key) => !referencedKeys.has(key))) {
      push(errors, "EVIDENCE_CONTENT_HASH_UNREFERENCED", `compatibility_review.gate_evidence.${gate}.evidence_content_hashes.${unexpected}`, "content hashes may only bind declared evidence references");
    }
    for (const [index, reference] of (evidence?.evidence_refs ?? []).entries()) {
      const path = `compatibility_review.gate_evidence.${gate}.evidence_refs[${index}]`;
      let expectedHash = null;
      if (reference.includes("/")) {
        const target = repositoryRoot ? repositoryFile(repositoryRoot, reference) : null;
        if (!target) {
          push(errors, "EVIDENCE_REFERENCE_NOT_REGULAR_FILE", path, `${reference} must resolve to a regular file under the repository root`);
        }
        const blob = repositoryRoot && evidence?.evidence_commit
          ? gitRegularFileBlob(repositoryRoot, evidence.evidence_commit, reference)
          : null;
        if (!blob) {
          push(errors, "EVIDENCE_GIT_BLOB_NOT_FOUND", path, `${reference} must resolve to an immutable Git blob at evidence_commit`);
        } else {
          expectedHash = computeContentHash(blob);
        }
      } else {
        const event = evidenceEvents.get(reference);
        if (!event) {
          push(errors, "EVIDENCE_REFERENCE_UNRESOLVED", path, `${reference} does not resolve to an event in this record`);
        } else {
          expectedHash = computeContentHash(canonicalJson(event));
        }
      }
      if (!Object.hasOwn(referencedHashes, reference)) {
        push(errors, "EVIDENCE_CONTENT_HASH_MISSING", path, `${reference} requires an immutable content hash`);
      } else if (expectedHash && referencedHashes[reference] !== expectedHash) {
        push(errors, "EVIDENCE_CONTENT_HASH_INVALID", `compatibility_review.gate_evidence.${gate}.evidence_content_hashes.${reference}`, "content hash must equal the referenced Git blob or event SHA-256");
      }
    }
  }

  if (review.gates?.TESTS_PASS === "PASS" || review.gate_evidence?.TESTS_PASS?.result === "PASS") {
    for (const gate of COMPATIBILITY_GATES.filter((name) => name !== "TESTS_PASS")) {
      if (review.gates?.[gate] !== "PASS" || review.gate_evidence?.[gate]?.result !== "PASS") {
        push(errors, "TESTS_PASS_AGGREGATE_INVALID", "compatibility_review.gates.TESTS_PASS", `TESTS_PASS cannot pass while ${gate} is not PASS`);
      }
    }
  }

  const approvalClaimed = review.decision === "APPROVED_SIMULATION"
    || APPROVED_STATES.has(transplant.state)
    || events.some(({ next_transplant_state }) => APPROVED_STATES.has(next_transplant_state));
  if (approvalClaimed) {
    if (review.decision !== "APPROVED_SIMULATION") {
      push(errors, "APPROVAL_DECISION_MISSING", "compatibility_review.decision", "approved transplant state requires an approved review decision");
    }
    for (const gate of COMPATIBILITY_GATES) {
      if (review.gates?.[gate] !== "PASS" || review.gate_evidence?.[gate]?.result !== "PASS") {
        push(errors, "APPROVAL_GATE_NOT_PASS", `compatibility_review.gates.${gate}`, "approved transplant requires PASS gate and PASS evidence");
      }
    }
    if (review.rights_record?.transplant_right !== "APPROVED_SIMULATION") {
      push(errors, "TRANSPLANT_RIGHT_NOT_APPROVED", "compatibility_review.rights_record.transplant_right", "approved transplant requires simulated transplant right");
    }
    if (review.rights_record?.license_or_usage_right !== "APPROVED_SIMULATION") {
      push(errors, "USAGE_RIGHT_NOT_APPROVED", "compatibility_review.rights_record.license_or_usage_right", "approved transplant requires simulated usage right");
    }
    if (!new Set(["CODEX_REVIEW_REQUIRED", "APPROVED_SIMULATION"]).has(donorLife?.rights?.transplant_right)) {
      push(errors, "REGISTERED_TRANSPLANT_RIGHT_UNAVAILABLE", "compatibility_review.rights_record.transplant_right", "donor Registry rights must permit controlled transplant review");
    }
    if (!new Set(["SIMULATED_USE_ONLY", "APPROVED_SIMULATION"]).has(hostLife?.rights?.use_right)) {
      push(errors, "REGISTERED_HOST_USE_RIGHT_UNAVAILABLE", "compatibility_review.rights_record.license_or_usage_right", "host Registry rights must permit simulated use");
    }
  }

  if (events.length === 0) {
    push(errors, "EVENT_CHAIN_MISSING", "transplant.events", "at least one transplant event is required");
    return { ok: false, errors };
  }

  const eventIds = new Set();
  let priorHash = null;
  let priorState = null;
  let priorTime = null;
  const seed = events[0].seed;
  const resourceTotals = {};
  const energyTotals = {};
  const resourceUnit = migrationPlan.resource_budget?.unit;
  const energyUnit = migrationPlan.energy_budget?.unit;
  const expectedResourceUnit = organ.resource_cost?.compute?.unit;
  const expectedEnergyUnit = organ.energy_cost?.per_operation?.unit;
  const expectedResourceValue = organ.resource_cost?.compute?.value;
  const expectedEnergyValue = organ.energy_cost?.per_operation?.value;
  if (resourceUnit !== expectedResourceUnit) {
    push(errors, "PLAN_RESOURCE_UNIT_MISMATCH", "transplant.migration_plan.resource_budget.unit", "migration resource budget unit must equal the organ compute-cost unit");
  }
  if (energyUnit !== expectedEnergyUnit) {
    push(errors, "PLAN_ENERGY_UNIT_MISMATCH", "transplant.migration_plan.energy_budget.unit", "migration energy budget unit must equal the organ per-operation energy unit");
  }
  if (!(expectedResourceValue > 0)) {
    push(errors, "ORGAN_TRANSPLANT_RESOURCE_COST_NOT_POSITIVE", "organ.resource_cost.compute.value", "transplantable organ events require a positive declared compute cost");
  }
  if (!(expectedEnergyValue > 0)) {
    push(errors, "ORGAN_TRANSPLANT_ENERGY_COST_NOT_POSITIVE", "organ.energy_cost.per_operation.value", "transplantable organ events require a positive declared energy cost");
  }
  for (const [index, event] of events.entries()) {
    const path = `transplant.events[${index}]`;
    if (eventIds.has(event.event_id)) push(errors, "DUPLICATE_EVENT_ID", `${path}.event_id`, "event_id must be unique");
    eventIds.add(event.event_id);
    for (const [field, expected] of [
      ["transplant_id", transplant.transplant_id],
      ["donor_life_id", transplant.donor_life_id],
      ["host_life_id", transplant.host_life_id],
      ["organ_id", transplant.organ_id]
    ]) {
      if (event[field] !== expected) push(errors, "EVENT_IDENTITY_MISMATCH", `${path}.${field}`, `${field} must bind the transplant identity`);
    }
    if (!isAuthorizedWorker(workerRegistry, event.actor)) {
      push(errors, "EVENT_ACTOR_NOT_AUTHORIZED", `${path}.actor`, "event actor must resolve to an active Worker Registry identity");
    }
    if (CANONICAL_DECISION_STATES.has(event.next_transplant_state) && !isAuthorizedWorker(workerRegistry, event.actor, true)) {
      push(errors, "CANONICAL_EVENT_ACTOR_NOT_AUTHORIZED", `${path}.actor`, `${event.next_transplant_state} requires the canonical Codex reviewer`);
    }
    if (event.previous_state_hash !== priorHash) push(errors, "EVENT_HASH_CHAIN_BROKEN", `${path}.previous_state_hash`, "previous hash must equal the prior event next hash");
    if (event.previous_transplant_state !== priorState) push(errors, "EVENT_STATE_CHAIN_BROKEN", `${path}.previous_transplant_state`, "previous state must equal the prior event next state");
    if (!ALLOWED_TRANSITIONS.get(priorState)?.has(event.next_transplant_state)) {
      push(errors, "INVALID_STATE_TRANSITION", `${path}.next_transplant_state`, `${priorState ?? "NULL"} cannot transition to ${event.next_transplant_state}`);
    }
    if (event.action !== canonicalActionForState(event.next_transplant_state)) {
      push(errors, "EVENT_ACTION_NOT_DETERMINISTIC", `${path}.action`, `action must equal ${canonicalActionForState(event.next_transplant_state)}`);
    }
    if (event.status !== canonicalStatusForState(event.next_transplant_state)) {
      push(errors, "EVENT_STATUS_NOT_DETERMINISTIC", `${path}.status`, `status must equal ${canonicalStatusForState(event.next_transplant_state)}`);
    }
    if (event.inputs?.plan_step_index !== index || event.inputs?.plan_step_action !== event.action) {
      push(errors, "EVENT_PLAN_STEP_BINDING_INVALID", `${path}.inputs`, "event must bind its zero-based migration plan step index and canonical action");
    }
    if (migrationPlan.steps?.[index] !== event.action) {
      push(errors, "EVENT_NOT_IN_MIGRATION_PLAN", `${path}.action`, "event action must equal the migration plan step at the same deterministic index");
    }
    const expectedRightsDecision = event.next_transplant_state === "APPROVED_SIMULATION" ? "APPROVED_SIMULATION" : null;
    if (event.rights_decision !== expectedRightsDecision) {
      push(errors, "EVENT_RIGHTS_DECISION_NOT_DETERMINISTIC", `${path}.rights_decision`, "rights decision must be emitted only by the approved-simulation transition");
    }
    validateExactDelta(event.resource_delta, expectedResourceUnit, expectedResourceValue, errors, `${path}.resource_delta`, "EVENT_RESOURCE_COST_MISMATCH");
    validateExactDelta(event.energy_delta, expectedEnergyUnit, expectedEnergyValue, errors, `${path}.energy_delta`, "EVENT_ENERGY_COST_MISMATCH");
    resourceTotals[expectedResourceUnit] = (resourceTotals[expectedResourceUnit] ?? 0) + expectedResourceValue;
    energyTotals[expectedEnergyUnit] = (energyTotals[expectedEnergyUnit] ?? 0) + expectedEnergyValue;
    const replayProjection = {
      seed,
      sequence: index + 1,
      simulation_time: event.simulation_time,
      previous_event_hash: priorHash,
      previous_transplant_state: priorState,
      next_transplant_state: event.next_transplant_state,
      resource_totals: resourceTotals,
      energy_totals: energyTotals
    };
    if (event.outputs?.replay_state_hash !== computeReplayStateHash(replayProjection)) {
      push(errors, "REPLAY_STATE_HASH_INVALID", `${path}.outputs.replay_state_hash`, "replay_state_hash must equal the state projected by the canonical interpreter");
    }
    if (event.next_state_hash !== computeTransplantEventHash(event)) {
      push(errors, "EVENT_HASH_INVALID", `${path}.next_state_hash`, "next state hash must be recomputed from the canonical event envelope");
    }
    if (event.seed !== seed) push(errors, "EVENT_SEED_MISMATCH", `${path}.seed`, "all events in one deterministic replay must use one seed");
    const currentTime = Date.parse(event.simulation_time);
    if (!Number.isFinite(currentTime) || (priorTime !== null && currentTime < priorTime)) {
      push(errors, "EVENT_TIME_INVALID", `${path}.simulation_time`, "event times must be valid and nondecreasing");
    }
    if (index === 0 && currentTime < Date.parse(review.reviewed_at)) {
      push(errors, "EVENT_PRECEDES_REVIEW", `${path}.simulation_time`, "transplant execution cannot precede the canonical compatibility review");
    }
    if (event.next_transplant_state === "ROLLED_BACK") {
      if (event.outputs?.restored_state_hash !== transplant.migration_plan?.baseline_state_hash) {
        push(errors, "ROLLBACK_STATE_NOT_RESTORED", `${path}.outputs.restored_state_hash`, "rollback event must restore the migration plan pre-transplant state hash");
      }
      if (event.outputs?.restored_commit !== transplant.migration_plan?.baseline_commit) {
        push(errors, "ROLLBACK_COMMIT_NOT_RESTORED", `${path}.outputs.restored_commit`, "rollback event must restore the migration plan pre-transplant commit");
      }
      if (event.outputs?.restored_state_ref !== transplant.migration_plan?.baseline_state_ref) {
        push(errors, "ROLLBACK_REFERENCE_NOT_RESTORED", `${path}.outputs.restored_state_ref`, "rollback event must restore the migration plan pre-transplant state reference");
      }
    }
    priorHash = event.next_state_hash;
    priorState = event.next_transplant_state;
    priorTime = currentTime;
  }

  if ((resourceTotals[resourceUnit] ?? 0) > (migrationPlan.resource_budget?.value ?? -1)) {
    push(errors, "RESOURCE_BUDGET_EXCEEDED", "transplant.events", "replayed resource consumption exceeds the migration plan budget");
  }
  if ((energyTotals[energyUnit] ?? 0) > (migrationPlan.energy_budget?.value ?? -1)) {
    push(errors, "ENERGY_BUDGET_EXCEEDED", "transplant.events", "replayed energy consumption exceeds the migration plan budget");
  }

  if (priorState !== transplant.state) {
    push(errors, "FINAL_STATE_MISMATCH", "transplant.state", "transplant state must equal the final event state");
  }
  if ((record.metadata?.status === "COMPLETE") !== (transplant.state === "COMPLETE")) {
    push(errors, "METADATA_STATUS_TRANSPLANT_STATE_MISMATCH", "metadata.status", "metadata COMPLETE and transplant COMPLETE must be claimed together");
  }
  if (transplant.state === "COMPLETE") {
    const finalEvent = events.at(-1);
    const completion = finalEvent?.outputs?.completion_evidence;
    if (!completion) {
      push(errors, "COMPLETION_EVIDENCE_MISSING", "transplant.events[-1].outputs.completion_evidence", "COMPLETE requires immutable Registry, Genome, integration, maintenance and rollback-retention evidence");
    } else {
      if (completion.attestation_hash !== computeCompletionEvidenceHash(completion)) {
        push(errors, "COMPLETION_EVIDENCE_HASH_INVALID", "transplant.events[-1].outputs.completion_evidence.attestation_hash", "completion attestation must bind the full evidence envelope");
      }
      if (!commitReachableFromHead(repositoryRoot, completion.completion_commit)) {
        push(errors, "COMPLETION_COMMIT_NOT_REACHABLE", "transplant.events[-1].outputs.completion_evidence.completion_commit", "completion commit must be reachable from canonical HEAD");
      } else if (!commitStrictAncestor(repositoryRoot, migrationPlan.baseline_commit, completion.completion_commit)) {
        push(errors, "COMPLETION_COMMIT_NOT_AFTER_BASELINE", "transplant.events[-1].outputs.completion_evidence.completion_commit", "completion commit must descend strictly from the pre-transplant baseline");
      }
      if (completion.donor_genome_id !== review.donor_genome_id) {
        push(errors, "COMPLETION_DONOR_GENOME_MISMATCH", "transplant.events[-1].outputs.completion_evidence.donor_genome_id", "completion must bind the reviewed donor Genome identity");
      }
      if (completion.host_genome_id !== review.host_genome_id) {
        push(errors, "COMPLETION_HOST_GENOME_MISMATCH", "transplant.events[-1].outputs.completion_evidence.host_genome_id", "completion must bind the reviewed host Genome identity");
      }
      if (!isAuthorizedWorker(workerRegistry, completion.maintenance_owner, true)) {
        push(errors, "COMPLETION_MAINTENANCE_OWNER_NOT_AUTHORIZED", "transplant.events[-1].outputs.completion_evidence.maintenance_owner", "maintenance ownership must be accepted by the canonical Codex authority");
      }
      if (completion.registry_projection_ref !== CANONICAL_REGISTRY_PATH) {
        push(errors, "COMPLETION_REGISTRY_REFERENCE_INVALID", "transplant.events[-1].outputs.completion_evidence.registry_projection_ref", "completion must bind the canonical Software Life Registry projection");
      }
      if (completion.rollback_retention_ref !== rollbackPlan.recovery_ref) {
        push(errors, "COMPLETION_ROLLBACK_RETENTION_INVALID", "transplant.events[-1].outputs.completion_evidence.rollback_retention_ref", "completion must retain the reviewed rollback recovery artifact");
      }
      const verifyCompletionBlob = (reference, claimedHash, path) => {
        const blob = gitRegularFileBlob(repositoryRoot, completion.completion_commit, reference);
        if (!blob) {
          push(errors, "COMPLETION_EVIDENCE_BLOB_MISSING", path, `${reference} must resolve to a regular Git file at completion_commit`);
          return null;
        }
        if (claimedHash !== computeContentHash(blob)) {
          push(errors, "COMPLETION_EVIDENCE_CONTENT_HASH_INVALID", path, `${reference} hash must equal its completion Git blob`);
        }
        return blob;
      };
      const registryBlob = verifyCompletionBlob(
        completion.registry_projection_ref,
        completion.registry_projection_hash,
        "transplant.events[-1].outputs.completion_evidence.registry_projection_hash"
      );
      const genomeBlob = verifyCompletionBlob(
        completion.genome_revision_ref,
        completion.genome_revision_hash,
        "transplant.events[-1].outputs.completion_evidence.genome_revision_hash"
      );
      verifyCompletionBlob(
        completion.rollback_retention_ref,
        completion.rollback_retention_hash,
        "transplant.events[-1].outputs.completion_evidence.rollback_retention_hash"
      );
      const integrationRefs = new Set(completion.integration_evidence_refs ?? []);
      for (const unexpected of Object.keys(completion.integration_evidence_hashes ?? {}).filter((reference) => !integrationRefs.has(reference))) {
        push(errors, "COMPLETION_EVIDENCE_HASH_UNREFERENCED", `transplant.events[-1].outputs.completion_evidence.integration_evidence_hashes.${unexpected}`, "integration hashes may bind only declared references");
      }
      for (const [index, reference] of [...integrationRefs].entries()) {
        if (!Object.hasOwn(completion.integration_evidence_hashes ?? {}, reference)) {
          push(errors, "COMPLETION_EVIDENCE_CONTENT_HASH_MISSING", `transplant.events[-1].outputs.completion_evidence.integration_evidence_refs[${index}]`, `${reference} requires a content hash`);
        } else {
          const integrationBlob = verifyCompletionBlob(
            reference,
            completion.integration_evidence_hashes[reference],
            `transplant.events[-1].outputs.completion_evidence.integration_evidence_hashes.${reference}`
          );
          if (integrationBlob) {
            try {
              const integration = JSON.parse(integrationBlob.toString("utf8"));
              const expected = {
                artifact_type: "SOFTWARE_ORGAN_INTEGRATION_EVIDENCE",
                transplant_id: transplant.transplant_id,
                compatibility_review_id: transplant.compatibility_review_id,
                donor_life_id: transplant.donor_life_id,
                donor_genome_id: review.donor_genome_id,
                host_life_id: transplant.host_life_id,
                host_genome_id: review.host_genome_id,
                organ_id: transplant.organ_id,
                state: "COMPLETE",
                result: "PASS"
              };
              if (Object.entries(expected).some(([field, value]) => integration[field] !== value)) {
                push(errors, "COMPLETION_INTEGRATION_EVIDENCE_IDENTITY_INVALID", `transplant.events[-1].outputs.completion_evidence.integration_evidence_refs[${index}]`, "integration evidence must bind the completed donor, host, Genome, organ, review and transplant identities");
              }
            } catch {
              push(errors, "COMPLETION_INTEGRATION_EVIDENCE_INVALID", `transplant.events[-1].outputs.completion_evidence.integration_evidence_refs[${index}]`, "integration evidence must be a structured JSON attestation");
            }
          }
        }
      }
      if (genomeBlob) {
        try {
          const genomeRevision = JSON.parse(genomeBlob.toString("utf8"));
          const expected = {
            artifact_type: "SOFTWARE_GENOME_REVISION_EVIDENCE",
            life_id: transplant.host_life_id,
            genome_id: review.host_genome_id,
            donor_life_id: transplant.donor_life_id,
            donor_genome_id: review.donor_genome_id,
            transplant_id: transplant.transplant_id,
            organ_id: transplant.organ_id,
            state: "COMPLETE"
          };
          if (Object.entries(expected).some(([field, value]) => genomeRevision[field] !== value)) {
            push(errors, "COMPLETION_GENOME_REVISION_IDENTITY_INVALID", "transplant.events[-1].outputs.completion_evidence.genome_revision_ref", "Genome revision evidence must bind the completed host, donor, Genome, organ and transplant identities");
          }
        } catch {
          push(errors, "COMPLETION_GENOME_REVISION_INVALID", "transplant.events[-1].outputs.completion_evidence.genome_revision_ref", "Genome revision evidence must be a structured JSON attestation");
        }
      }
      if (registryBlob) {
        try {
          const completionRegistry = JSON.parse(registryBlob.toString("utf8"));
          const projectedHost = completionRegistry.software_lives?.find(({ life_id }) => life_id === transplant.host_life_id);
          const projected = projectedHost?.transplants?.find((item) => item?.transplant_id === transplant.transplant_id);
          if (!projected) {
            push(errors, "COMPLETION_REGISTRY_PROJECTION_MISSING", "transplant.events[-1].outputs.completion_evidence.registry_projection_ref", "host Registry projection must contain the completed transplant identity");
          } else {
            const expected = {
              compatibility_review_id: transplant.compatibility_review_id,
              donor_life_id: transplant.donor_life_id,
              donor_genome_id: review.donor_genome_id,
              host_life_id: transplant.host_life_id,
              host_genome_id: review.host_genome_id,
              organ_id: transplant.organ_id,
              state: "COMPLETE",
              completion_commit: completion.completion_commit
            };
            if (Object.entries(expected).some(([field, value]) => projected[field] !== value)) {
              push(errors, "COMPLETION_REGISTRY_PROJECTION_IDENTITY_INVALID", "transplant.events[-1].outputs.completion_evidence.registry_projection_ref", "Registry projection must bind the completed review, donor, host, Genome, organ and completion commit identities");
            }
          }
        } catch {
          push(errors, "COMPLETION_REGISTRY_PROJECTION_INVALID", "transplant.events[-1].outputs.completion_evidence.registry_projection_ref", "completion Registry projection must contain valid JSON");
        }
      }
    }
  }
  const rightsEvent = events.find(({ event_id }) => event_id === review.rights_record?.decision_event_id);
  if (!rightsEvent) {
    push(errors, "RIGHTS_EVENT_MISSING", "compatibility_review.rights_record.decision_event_id", "rights decision must resolve to a transplant event");
  } else if (approvalClaimed && (rightsEvent.next_transplant_state !== "APPROVED_SIMULATION" || rightsEvent.rights_decision !== "APPROVED_SIMULATION")) {
    push(errors, "RIGHTS_EVENT_NOT_APPROVAL", "compatibility_review.rights_record.decision_event_id", "rights decision event must be the recorded approved-simulation transition");
  } else if (approvalClaimed && !isAuthorizedWorker(workerRegistry, rightsEvent.actor, true)) {
    push(errors, "RIGHTS_DECISION_ACTOR_NOT_AUTHORIZED", "compatibility_review.rights_record.decision_event_id", "rights approval event must be issued by the canonical Codex reviewer");
  }

  return { ok: errors.length === 0, errors };
};

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
  const [recordPath, repositoryRootArgument] = process.argv.slice(2);
  if (!recordPath) {
    console.error("Usage: node validate-software-organ-transplant.mjs <record.json> [repository-root]");
    process.exitCode = 2;
  } else {
    const record = JSON.parse(await readFile(recordPath, "utf8"));
    const root = gitRoot(repositoryRootArgument ? resolve(repositoryRootArgument) : process.cwd());
    const result = validateSoftwareOrganTransplant(record, { repositoryRoot: root });
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  }
}
