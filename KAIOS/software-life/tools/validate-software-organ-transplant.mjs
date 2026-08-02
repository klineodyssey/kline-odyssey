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
import { readFileSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const CANONICAL_REGISTRY_PATH = "KAIOS/software-life/KAIOS_SOFTWARE_LIFE_REGISTRY.json";
const CANONICAL_SCHEMA_PATH = "KAIOS/software-life/KAIOS_SOFTWARE_ORGAN_COMPATIBILITY_SCHEMA.json";
const CANONICAL_WORKER_REGISTRY_PATH = "KGEN-KAIOS/worker_registry.json";
const CANONICAL_REVIEWER_ALIAS = "CODEX_CANONICAL_REVIEW";
const CANONICAL_REVIEWER_WORKER_ID = "codex-gm-01";
const gitRootCache = new Map();
const commitCache = new Map();
const blobCache = new Map();
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

const push = (errors, code, path, message) => errors.push({ code, path, message });

const jsonPointerValue = (document, pointer) => {
  if (pointer === "#") return document;
  if (!pointer.startsWith("#/")) return undefined;
  return pointer.slice(2).split("/").reduce((value, token) => (
    value?.[token.replaceAll("~1", "/").replaceAll("~0", "~")]
  ), document);
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
    if (schema.format === "date-time" && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
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

const repositoryFile = (repositoryRoot, repositoryPath) => {
  const root = resolve(repositoryRoot);
  const target = resolve(root, repositoryPath);
  const relativeTarget = relative(root, target);
  const escapesRoot = relativeTarget === ".."
    || relativeTarget.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
    || isAbsolute(relativeTarget);
  if (escapesRoot) return null;
  try {
    return statSync(target).isFile() ? target : null;
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
  const headBlob = gitBlob(repositoryRoot, "HEAD", path);
  if (!headBlob) {
    push(errors, "CANONICAL_GOVERNANCE_FILE_UNTRACKED", path, `${path} must be an immutable Git blob at HEAD`);
    return null;
  }
  const cacheKey = `${resolve(repositoryRoot)}\0${path}`;
  try {
    const workingBytes = readFileSync(target);
    if (computeContentHash(workingBytes) !== computeContentHash(headBlob)) {
      push(errors, "CANONICAL_GOVERNANCE_WORKTREE_DRIFT", path, `${path} must match its committed HEAD blob`);
      return null;
    }
    if (canonicalJsonCache.has(cacheKey)) return canonicalJsonCache.get(cacheKey);
    const value = JSON.parse(workingBytes.toString("utf8"));
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
  const actualGitRoot = gitRoot(root);
  if (!actualGitRoot || actualGitRoot.toLowerCase() !== root.toLowerCase()) {
    push(errors, "CANONICAL_REPOSITORY_ROOT_REQUIRED", "repositoryRoot", "repositoryRoot must equal the Git top-level directory");
    return { root };
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
    if (!commitExists(root, metadata.source_commit)) {
      push(errors, "CANONICAL_REGISTRY_SOURCE_COMMIT_INVALID", `${CANONICAL_REGISTRY_PATH}#metadata.source_commit`, "Registry source_commit must resolve to a Git commit");
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

  if (!organ || !review || !transplant) {
    push(errors, "RECORD_SECTION_MISSING", "$", "organ, compatibility_review and transplant are required");
    return { ok: false, errors };
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
      const registeredBlob = gitBlob(repositoryRoot, registry?.metadata?.source_commit, registeredOrgan.path);
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
    if (!commitExists(repositoryRoot, plan.baseline_commit)) {
      push(errors, "BASELINE_COMMIT_NOT_FOUND", `transplant.${name}.baseline_commit`, "baseline_commit must resolve to an existing Git commit");
    }
    const expectedHostPath = hostLife?.location?.canonical_path;
    if (expectedHostPath && plan.baseline_state_ref !== expectedHostPath) {
      push(errors, "BASELINE_HOST_REFERENCE_MISMATCH", `transplant.${name}.baseline_state_ref`, "baseline_state_ref must equal the registered host canonical path");
    }
    const baselineBlob = repositoryRoot && plan.baseline_commit && plan.baseline_state_ref
      ? gitBlob(repositoryRoot, plan.baseline_commit, plan.baseline_state_ref)
      : null;
    if (!baselineBlob) {
      push(errors, "BASELINE_STATE_NOT_REPRODUCIBLE", `transplant.${name}.baseline_state_ref`, "baseline state must resolve to an immutable Git blob at baseline_commit");
    } else if (plan.baseline_state_hash !== computeContentHash(baselineBlob)) {
      push(errors, "BASELINE_STATE_HASH_INVALID", `transplant.${name}.baseline_state_hash`, "baseline_state_hash must equal the referenced Git blob SHA-256");
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

  const boundary = record.security_boundary ?? {};
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
    if (evidence && !commitExists(repositoryRoot, evidence.evidence_commit)) {
      push(errors, "EVIDENCE_COMMIT_NOT_FOUND", `compatibility_review.gate_evidence.${gate}.evidence_commit`, "evidence_commit must resolve to an existing Git commit");
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
          ? gitBlob(repositoryRoot, evidence.evidence_commit, reference)
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
    if (event.next_transplant_state === "APPROVED_SIMULATION" && !isAuthorizedWorker(workerRegistry, event.actor, true)) {
      push(errors, "APPROVAL_ACTOR_NOT_AUTHORIZED", `${path}.actor`, "approved simulation transition requires the canonical Codex reviewer");
    }
    if (event.previous_state_hash !== priorHash) push(errors, "EVENT_HASH_CHAIN_BROKEN", `${path}.previous_state_hash`, "previous hash must equal the prior event next hash");
    if (event.previous_transplant_state !== priorState) push(errors, "EVENT_STATE_CHAIN_BROKEN", `${path}.previous_transplant_state`, "previous state must equal the prior event next state");
    if (!ALLOWED_TRANSITIONS.get(priorState)?.has(event.next_transplant_state)) {
      push(errors, "INVALID_STATE_TRANSITION", `${path}.next_transplant_state`, `${priorState ?? "NULL"} cannot transition to ${event.next_transplant_state}`);
    }
    if (event.next_state_hash !== computeTransplantEventHash(event)) {
      push(errors, "EVENT_HASH_INVALID", `${path}.next_state_hash`, "next state hash must be recomputed from the canonical event envelope");
    }
    if (event.seed !== seed) push(errors, "EVENT_SEED_MISMATCH", `${path}.seed`, "all events in one deterministic replay must use one seed");
    const currentTime = Date.parse(event.simulation_time);
    if (!Number.isFinite(currentTime) || (priorTime !== null && currentTime < priorTime)) {
      push(errors, "EVENT_TIME_INVALID", `${path}.simulation_time`, "event times must be valid and nondecreasing");
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

  if (priorState !== transplant.state) {
    push(errors, "FINAL_STATE_MISMATCH", "transplant.state", "transplant state must equal the final event state");
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
