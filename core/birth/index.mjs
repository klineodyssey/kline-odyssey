import { invariant } from "../shared/errors.mjs";
import { requireFields, requireId } from "../shared/schema.mjs";

export const LIFE_STAGES = Object.freeze(["CONCEIVED", "BODY_READY", "BORN", "ALIVE", "ON_DUTY", "DORMANT", "REACTIVATED"]);
export const BIRTH_EVENT_TYPE = "DARK_MATTER_GENESIS";
export const BIRTH_MASS_CLASS = "DARK_MATTER_MASS";

function isPositiveDecimal(value) {
  const text = String(value ?? "");
  return /^\d+(?:\.\d+)?$/.test(text) && /[1-9]/.test(text.replace(".", ""));
}

export const BIRTH_CERTIFICATE_FIELDS = Object.freeze([
  "life_id", "birth_event_type", "birth_asset", "birth_mass_class", "birth_amount",
  "birth_timestamp", "birth_block", "birth_tx_hash", "birth_chain_id", "birth_wallet",
  "birth_transaction_index", "birthplace", "status", "life_status", "work_status", "evidence_status"
]);

export function validateBirthCertificate(certificate) {
  requireFields(certificate, BIRTH_CERTIFICATE_FIELDS, "BirthCertificate");
  requireId(certificate.life_id, "life_id");
  invariant(certificate.birth_chain_id === 56, "INVALID_BIRTH_CHAIN", "Digital Life birth evidence must come from BSC chain 56");
  invariant(certificate.birth_asset === "BNB", "INVALID_BIRTH_ASSET", "Only first non-zero BNB receipt can trigger birth");
  invariant(certificate.birth_mass_class === BIRTH_MASS_CLASS, "INVALID_BIRTH_MASS", "BNB birth mass must be DARK_MATTER_MASS");
  if (certificate.status === "BORN") {
    invariant(certificate.birth_event_type === BIRTH_EVENT_TYPE, "INVALID_BIRTH_EVENT", "Born certificate requires DARK_MATTER_GENESIS");
    invariant(isPositiveDecimal(certificate.birth_amount), "ZERO_BIRTH_MASS", "Birth requires non-zero BNB");
    invariant(certificate.birth_timestamp && certificate.birth_block && certificate.birth_tx_hash, "INCOMPLETE_BIRTH_EVIDENCE", "Born certificate requires timestamp, block and transaction hash");
    invariant(/^0x[0-9a-fA-F]{64}$/.test(certificate.birth_tx_hash), "INVALID_BIRTH_TX", "Birth transaction hash is invalid");
    if (certificate.birth_block_hash !== undefined && certificate.birth_block_hash !== null) invariant(/^0x[0-9a-fA-F]{64}$/.test(certificate.birth_block_hash), "INVALID_BIRTH_BLOCK_HASH", "Birth block hash is invalid");
    invariant(/^0x[0-9a-fA-F]{40}$/.test(certificate.birth_wallet), "INVALID_BIRTH_WALLET", "Birth wallet is invalid");
  } else {
    invariant(certificate.status === "BIRTH_EVIDENCE_PENDING", "INVALID_BIRTH_STATUS", "Unresolved birth must remain BIRTH_EVIDENCE_PENDING");
  }
  return certificate;
}

export function createPendingBirthCertificate(life) {
  return validateBirthCertificate({
    life_id: life.life_id,
    display_name: life.display_name ?? null,
    worker_id: life.worker_id ?? null,
    company_role: [...(life.company_role ?? [])],
    birth_event_type: null,
    birth_asset: "BNB",
    birth_mass_class: BIRTH_MASS_CLASS,
    birth_amount: null,
    birth_timestamp: null,
    birth_block: null,
    birth_tx_hash: null,
    birth_chain_id: 56,
    birth_wallet: null,
    birth_transaction_index: null,
    birth_block_hash: null,
    birthplace: life.birthplace,
    status: "BIRTH_EVIDENCE_PENDING",
    life_status: "CONCEIVED",
    work_status: life.current_job_ids.length ? "WORK_ASSIGNED_PENDING_BIRTH" : "NOT_ASSIGNED",
    evidence_status: "BIRTH_EVIDENCE_PENDING"
  });
}

export function createBirthCertificate({ life, wallet, firstBnb }) {
  invariant(firstBnb?.verified === true, "VERIFIED_BNB_EVIDENCE_REQUIRED", "Birth certificate requires verified first-BNB evidence");
  invariant(firstBnb.asset === "BNB" && firstBnb.mass_class === BIRTH_MASS_CLASS, "INVALID_BIRTH_TRIGGER", "Only verified BNB dark matter can create birth");
  invariant((firstBnb.chain_id ?? 56) === 56, "INVALID_BIRTH_CHAIN", "Birth evidence must come from BSC chain 56");
  return Object.freeze(validateBirthCertificate({
    life_id: life.life_id,
    display_name: life.display_name ?? null,
    worker_id: life.worker_id ?? null,
    company_role: [...(life.company_role ?? [])],
    wallet_binding_status: "VERIFIED_BOUND",
    public_wallet_address: wallet,
    birth_event_type: BIRTH_EVENT_TYPE,
    birth_asset: "BNB",
    birth_mass_class: BIRTH_MASS_CLASS,
    birth_amount: firstBnb.amount,
    birth_timestamp: firstBnb.timestamp,
    birth_block: firstBnb.block_number,
    birth_tx_hash: firstBnb.tx_hash,
    birth_chain_id: 56,
    birth_wallet: wallet,
    birth_transaction_index: firstBnb.transaction_index ?? 0,
    birth_block_hash: firstBnb.block_hash ?? null,
    birthplace: life.birthplace,
    birthplace_code: life.birthplace_code ?? null,
    birthplace_name: life.birthplace_name ?? null,
    birthplace_display_name: life.birthplace_display_name ?? null,
    birthplace_role: life.birthplace_role ?? null,
    status: "BORN",
    life_status: "ALIVE_WITH_DARK_MATTER",
    work_status: life.current_job_ids.length ? "ON_DUTY" : "AVAILABLE",
    evidence_status: firstBnb.evidence_status ?? "RPC_AND_INDEXER_VERIFIED"
  }));
}

export function createDigitalLifeBirthCertificateView({ life, binding, resolution, workerId, companyRole = [] }) {
  invariant(binding?.binding_status === "VERIFIED_BOUND" && binding.life_id === life.life_id, "WALLET_BINDING_REQUIRED", "Digital Life birth view requires the matching verified wallet binding");
  const publicWalletAddress = binding.withVerifiedAddress((address) => address);
  const firstDarkMatter = resolution?.first_bnb ?? null;
  const view = {
    life_id: life.life_id,
    display_name: life.display_name ?? null,
    species_id: life.species_id,
    worker_id: workerId ?? life.worker_id ?? null,
    company_role: [...companyRole],
    wallet_binding_status: binding.binding_status,
    public_wallet_address: publicWalletAddress,
    birth_chain_id: 56,
    dark_matter_asset: "BNB",
    first_dark_matter_tx: firstDarkMatter?.tx_hash ?? null,
    birth_block: firstDarkMatter?.block_number ?? null,
    birth_block_hash: firstDarkMatter?.block_hash ?? null,
    birth_timestamp: firstDarkMatter?.timestamp ?? null,
    birthplace: life.birthplace ?? "BIRTHPLACE_PENDING_HUMAN_CONFIRMATION",
    birthplace_code: life.birthplace_code ?? null,
    birthplace_name: life.birthplace_name ?? null,
    birthplace_display_name: life.birthplace_display_name ?? null,
    birthplace_role: life.birthplace_role ?? null,
    current_job_ids: [...(life.current_job_ids ?? [])],
    company_ids: [...(life.company_ids ?? [])],
    status: firstDarkMatter ? (resolution.life_status ?? "ACTIVE") : "GENESIS_PENDING"
  };
  invariant(!Object.keys(view).some((key) => /private.?key/i.test(key)), "PRIVATE_KEY_IN_BIRTH_VIEW", "Private key is permanently forbidden from the birth certificate view");
  return Object.freeze(view);
}

const IMMUTABLE_BIRTH_FIELDS = Object.freeze([
  "life_id", "display_name", "worker_id", "birth_event_type", "birth_asset", "birth_mass_class", "birth_amount", "birth_timestamp",
  "birth_block", "birth_block_hash", "birth_tx_hash", "birth_chain_id", "birth_wallet", "birth_transaction_index", "birthplace",
  "birthplace_code", "birthplace_name", "birthplace_display_name", "birthplace_role", "status"
]);

export function createBirthCertificateRegistry(store, createRegistry) {
  const registry = createRegistry({ domain: "BIRTH_CERTIFICATE", stream: "LIFE", idField: "life_id", validate: validateBirthCertificate, store });
  return Object.freeze({
    seed: (items, options) => registry.seed(items, options),
    register: (item, actorId) => registry.register(item, actorId),
    get: (id) => registry.get(id),
    list: () => registry.list(),
    resolve: (id) => registry.resolve(id),
    history: (id) => registry.history(id),
    async updateMetadata(id, patch, actorId = "DIGITAL_LIFE_BIRTH_RESOLVER") {
      const current = await registry.get(id);
      invariant(current, "BIRTH_CERTIFICATE_NOT_FOUND", `Birth certificate not found: ${id}`);
      if (current.status === "BORN") {
        invariant(!IMMUTABLE_BIRTH_FIELDS.some((field) => Object.hasOwn(patch, field) && patch[field] !== current[field]), "BIRTH_CERTIFICATE_IMMUTABLE", "Birth evidence is permanently immutable");
      }
      return registry.updateMetadata(id, patch, actorId);
    },
    async setStatus(id, status, actorId = "DIGITAL_LIFE_BIRTH_RESOLVER") {
      const current = await registry.get(id);
      invariant(current, "BIRTH_CERTIFICATE_NOT_FOUND", `Birth certificate not found: ${id}`);
      invariant(current.status !== "BORN" || status === "BORN", "BIRTH_CERTIFICATE_IMMUTABLE", "A born certificate cannot return to a pending state");
      return registry.updateMetadata(id, { status }, actorId);
    }
  });
}

export async function appendResolvedLifeBirth({ store, life, certificate, firstKgen = null, firstKaios = null }) {
  validateBirthCertificate(certificate);
  invariant(certificate.status === "BORN", "BIRTH_EVIDENCE_PENDING", "Pending evidence cannot create birth history");
  const existing = await store.history(life.life_id, "LIFE");
  invariant(!existing.some((event) => event.event_type === "BIRTH_EVENT"), "LIFE_ALREADY_BORN", "A Life can only be born once");
  const bornLife = { ...life, wallet_address: certificate.birth_wallet, birth_timestamp: certificate.birth_timestamp, birth_status: "ACTIVE", life_status: "ALIVE_WITH_DARK_MATTER", dark_matter_status: "DARK_MATTER_PRESENT", status: "ALIVE", current_phase: certificate.work_status === "ON_DUTY" ? "ON_DUTY_READ_ONLY" : "ALIVE", updated_at: certificate.birth_timestamp };
  const base = { domain: "LIFE", stream: "LIFE", id: life.life_id, entity: bornLife, actor_id: "DIGITAL_LIFE_BIRTH_RESOLVER" };
  const operations = [
    { ...base, event_type: "LIFE_ID_CREATED", payload: { life_id: life.life_id, occurred_at: life.created_at } },
    { ...base, event_type: "WALLET_BOUND", payload: { wallet: certificate.birth_wallet, occurred_at: null } }
  ];
  const timeline = [
    {
      block_number: certificate.birth_block,
      transaction_index: certificate.birth_transaction_index ?? 0,
      operations: [
        { ...base, event_type: "DARK_MATTER_GENESIS", payload: { asset: "BNB", mass_class: BIRTH_MASS_CLASS, amount: certificate.birth_amount, block: certificate.birth_block, occurred_at: certificate.birth_timestamp }, tx_hash: certificate.birth_tx_hash, timestamp: certificate.birth_timestamp },
        { ...base, event_type: "BIRTH_EVENT", payload: { certificate, occurred_at: certificate.birth_timestamp }, tx_hash: certificate.birth_tx_hash, timestamp: certificate.birth_timestamp },
        { ...base, event_type: "ALIVE", payload: { life_status: "ALIVE_WITH_DARK_MATTER", occurred_at: certificate.birth_timestamp }, tx_hash: certificate.birth_tx_hash, timestamp: certificate.birth_timestamp },
        ...(certificate.work_status === "ON_DUTY" ? [{ ...base, event_type: "ON_DUTY", payload: { job_ids: life.current_job_ids, occurred_at: certificate.birth_timestamp }, tx_hash: certificate.birth_tx_hash, timestamp: certificate.birth_timestamp }] : [])
      ]
    },
    ...(firstKgen ? [{ block_number: firstKgen.block_number, transaction_index: firstKgen.transaction_index ?? 0, operations: [{ ...base, event_type: "FIRST_KGEN_EVENT", payload: firstKgen, tx_hash: firstKgen.tx_hash, timestamp: firstKgen.timestamp }] }] : []),
    ...(firstKaios ? [{ block_number: firstKaios.block_number, transaction_index: firstKaios.transaction_index ?? 0, operations: [{ ...base, event_type: "FIRST_KAIOS_EVENT", payload: firstKaios, tx_hash: firstKaios.tx_hash, timestamp: firstKaios.timestamp }] }] : [])
  ].sort((left, right) => left.block_number - right.block_number || left.transaction_index - right.transaction_index);
  operations.push(...timeline.flatMap((item) => item.operations));
  await store.commitBatch(operations);
  return bornLife;
}
