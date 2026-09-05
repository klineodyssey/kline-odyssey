import { NAIHE_SOURCE_POLICY } from "./naihe-source-registry.mjs";
import { invariant } from "../shared/errors.mjs";
import {
  KAIOS_AI_COMPANY_ACTIVE_MEMBERSHIP_STATUS,
  KAIOS_AI_COMPANY_ID,
  KAIOS_AI_COMPANY_PARENT_BASIS,
  KAIOS_AI_COMPANY_PARENT_POLICY_ID,
  SPIRIT_ANCHOR_REPLAY_SERIALIZATION,
  assertPersistentSpiritGenesisAnchorLedger,
  createBirthCertificate,
  createPendingBirthCertificate,
  deriveSpiritGenesisAnchorReplayProtectionId,
  validateSpiritGenesisAnchorV2
} from "./index.mjs";
import { assertCanonicalStarforgeEnergyWalletBinding } from "../life/starforge-energy-wallet.mjs";

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

function formatUnits(value, decimals = 18) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const text = absolute.toString().padStart(decimals + 1, "0");
  const whole = text.slice(0, -decimals);
  const fraction = text.slice(-decimals).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

function topicAddress(address) { return `0x${address.toLowerCase().slice(2).padStart(64, "0")}`; }
function hexQuantity(value) { return BigInt(value ?? "0x0"); }
function firstCanonical(items = []) {
  return [...items].sort((left, right) =>
    Number(left.block_number) - Number(right.block_number)
    || Number(left.transaction_index ?? 0) - Number(right.transaction_index ?? 0)
    || String(left.trace_id ?? "").localeCompare(String(right.trace_id ?? ""))
  )[0] ?? null;
}
function pendingWorkStatus(life) { return life.current_job_ids?.length ? "WORK_ASSIGNED_PENDING_BIRTH" : "NOT_ASSIGNED"; }
function companyParentState(membership) {
  const active = membership?.membership_status === KAIOS_AI_COMPANY_ACTIVE_MEMBERSHIP_STATUS;
  return Object.freeze({
    company_id: KAIOS_AI_COMPANY_ID,
    company_membership_status: membership?.membership_status ?? "NOT_VERIFIED",
    company_membership_evidence_status: membership?.verification_status ?? "NOT_VERIFIED",
    regeneration_parent_id: active ? KAIOS_AI_COMPANY_ID : null,
    regeneration_parent_address: null,
    regeneration_parent_basis: active ? KAIOS_AI_COMPANY_PARENT_BASIS : "PENDING_ACTIVE_MEMBERSHIP",
    company_parent_policy_id: KAIOS_AI_COMPANY_PARENT_POLICY_ID,
    parent_assignment_status: active ? "COMPANY_POLICY_ASSIGNED" : "UNASSIGNED_PENDING_ACTIVE_MEMBERSHIP"
  });
}
function chronological(left, right) {
  return Number(left.block_number) - Number(right.block_number)
    || Number(left.transaction_index ?? 0) - Number(right.transaction_index ?? 0)
    || Number(left.trace_index ?? 0) - Number(right.trace_index ?? 0)
    || String(left.tx_hash ?? "").localeCompare(String(right.tx_hash ?? ""));
}

const REJECTABLE_NAIHE_CANDIDATE_CODES = new Set([
  "UNVERIFIED_BNB_RECEIPT", "BIRTH_BLOCK_HASH_MISMATCH", "BNB_TRANSACTION_MISMATCH", "BNB_TRANSACTION_INDEX_MISMATCH",
  "BNB_RECIPIENT_MISMATCH", "BNB_AMOUNT_MISMATCH", "BNB_SOURCE_ADDRESS_REQUIRED",
  "NAIHE_RPC_FROM_MISMATCH", "NAIHE_TRACE_ATTESTATION_REQUIRED", "NAIHE_TRACE_ATTESTATION_MISMATCH"
]);

export class JsonRpcClient {
  constructor({ url, fetchImpl = globalThis.fetch }) {
    invariant(url, "BSC_RPC_REQUIRED", "BSC_RPC_URL is required");
    this.url = url;
    this.fetchImpl = fetchImpl;
  }
  async send(method, params = []) {
    const response = await this.fetchImpl(this.url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
    if (!response.ok) throw new Error("BSC RPC unavailable");
    const payload = await response.json();
    if (payload.error) throw new Error("BSC RPC rejected a read request");
    return payload.result;
  }
}

export class DigitalLifeBirthResolver {
  constructor({ rpc, historyIndexer = null, tokens, naiheSourceRegistry = null, trustedCompanyMembershipVerifier = null, anchorLedger = null, environment = "PRODUCTION", minimumConfirmations = NAIHE_SOURCE_POLICY.minimum_confirmations }) {
    invariant(trustedCompanyMembershipVerifier === null || typeof trustedCompanyMembershipVerifier === "function", "COMPANY_MEMBERSHIP_VERIFIER_INVALID", "Company membership verifier must be a trusted function");
    this.rpc = rpc;
    this.historyIndexer = historyIndexer;
    this.tokens = tokens;
    this.naiheSourceRegistry = naiheSourceRegistry;
    this.trustedCompanyMembershipVerifier = trustedCompanyMembershipVerifier;
    this.anchorLedger = anchorLedger;
    this.environment = environment;
    invariant(Number.isSafeInteger(minimumConfirmations) && minimumConfirmations > 0, "NAIHE_FINALITY_POLICY_INVALID", "Naihe minimum confirmations must be a positive safe integer");
    invariant(environment === "TEST" || minimumConfirmations === NAIHE_SOURCE_POLICY.minimum_confirmations, "NAIHE_FINALITY_POLICY_DOWNGRADE", "Production Naihe finality cannot be caller-downgraded");
    this.minimumConfirmations = minimumConfirmations;
    if (naiheSourceRegistry) naiheSourceRegistry.assertCompatibleEnvironment(environment);
  }

  async #blockEvidence(blockNumber) {
    const block = await this.rpc.send("eth_getBlockByNumber", [`0x${BigInt(blockNumber).toString(16)}`, false]);
    invariant(block, "BIRTH_BLOCK_NOT_FOUND", "Birth evidence block is unavailable");
    invariant(/^0x[0-9a-fA-F]{64}$/.test(block.hash ?? ""), "BIRTH_BLOCK_HASH_MISSING", "Birth evidence block hash is unavailable");
    invariant(Number(hexQuantity(block.number)) === Number(blockNumber), "BIRTH_BLOCK_NUMBER_MISMATCH", "Birth evidence block number does not match the requested canonical block");
    return { block_number: Number(hexQuantity(block.number)), block_hash: block.hash, timestamp: new Date(Number(hexQuantity(block.timestamp)) * 1000).toISOString() };
  }

  async #verifyNative(candidate, wallet, { requireFinality = false } = {}) {
    const [receipt, transaction, block] = await Promise.all([
      this.rpc.send("eth_getTransactionReceipt", [candidate.tx_hash]),
      this.rpc.send("eth_getTransactionByHash", [candidate.tx_hash]),
      this.#blockEvidence(candidate.block_number)
    ]);
    invariant(receipt?.status === "0x1" && Number(hexQuantity(receipt.blockNumber)) === candidate.block_number, "UNVERIFIED_BNB_RECEIPT", "First BNB receipt could not be verified");
    invariant(receipt.blockHash?.toLowerCase() === block.block_hash.toLowerCase(), "BIRTH_BLOCK_HASH_MISMATCH", "Birth receipt and canonical block hash do not match");
    invariant(receipt.transactionHash?.toLowerCase() === candidate.tx_hash.toLowerCase(), "BNB_TRANSACTION_MISMATCH", "BNB receipt transaction hash is missing or does not match the indexed candidate");
    invariant(receipt.transactionIndex !== undefined && Number(hexQuantity(receipt.transactionIndex)) === Number(candidate.transaction_index), "BNB_TRANSACTION_INDEX_MISMATCH", "BNB receipt transaction index is missing or does not match the indexed candidate");
    invariant(transaction?.hash?.toLowerCase() === candidate.tx_hash.toLowerCase(), "BNB_TRANSACTION_MISMATCH", "BNB RPC transaction is missing or does not match the indexed candidate");
    invariant(transaction.blockHash?.toLowerCase() === block.block_hash.toLowerCase() && Number(hexQuantity(transaction.blockNumber)) === candidate.block_number, "BIRTH_BLOCK_HASH_MISMATCH", "BNB RPC transaction is not bound to the canonical evidence block");
    invariant(transaction.transactionIndex !== undefined && Number(hexQuantity(transaction.transactionIndex)) === candidate.transaction_index, "BNB_TRANSACTION_INDEX_MISMATCH", "BNB RPC transaction index is missing or does not match the indexed candidate");
    if (candidate.block_hash !== undefined) invariant(candidate.block_hash?.toLowerCase() === block.block_hash.toLowerCase(), "BIRTH_BLOCK_HASH_MISMATCH", "Indexed candidate block hash is not canonical");
    let qualifiedCandidate = candidate;
    if (candidate.kind === "NORMAL") {
      invariant(transaction?.to?.toLowerCase() === wallet.toLowerCase(), "BNB_RECIPIENT_MISMATCH", "Normal BNB recipient does not match the bound wallet");
      invariant(hexQuantity(transaction.value) === BigInt(candidate.value_wei), "BNB_AMOUNT_MISMATCH", "Normal BNB amount does not match RPC");
      const expectedSource = candidate.verified_source_address ?? candidate.from;
      invariant(/^0x[0-9a-fA-F]{40}$/.test(expectedSource ?? "") && /^0x[0-9a-fA-F]{40}$/.test(transaction?.from ?? ""), "BNB_SOURCE_ADDRESS_REQUIRED", "Normal BNB verification requires both indexed and RPC source addresses");
      invariant(transaction.from.toLowerCase() === expectedSource.toLowerCase(), "NAIHE_RPC_FROM_MISMATCH", "RPC transaction.from does not match the verified Naihe source");
    } else {
      invariant(this.naiheSourceRegistry, "NAIHE_TRACE_ATTESTATION_REQUIRED", "Internal source requires the canonical Naihe registry");
      qualifiedCandidate = await this.naiheSourceRegistry.verifyInternalTrace(candidate);
    }

    let confirmationCount = null;
    let canonicalBlockVerified = false;
    let finalityStatus = "NOT_REQUIRED_FOR_GENERIC_BIRTH";
    if (requireFinality) {
      const latestBlock = Number(hexQuantity(await this.rpc.send("eth_blockNumber", [])));
      invariant(latestBlock >= block.block_number, "NAIHE_FINALITY_BLOCK_INVALID", "Latest block is behind the Naihe evidence block");
      const canonical = await this.#blockEvidence(candidate.block_number);
      invariant(canonical.block_hash.toLowerCase() === block.block_hash.toLowerCase(), "NAIHE_REORG_DETECTED", "Canonical Naihe block changed during finality verification");
      confirmationCount = latestBlock - block.block_number + 1;
      invariant(confirmationCount >= this.minimumConfirmations, "NAIHE_FINALITY_NOT_REACHED", "Naihe anchor has not reached the required confirmation depth");
      canonicalBlockVerified = true;
      finalityStatus = "FINALIZED";
    }
    return Object.freeze({
      verified: true,
      evidence_class: candidate.kind === "NORMAL" ? "RPC_VERIFIED_NORMAL_TRANSFER" : "STRUCTURED_INTERNAL_TRACE_AND_RPC_RECEIPT",
      evidence_status: requireFinality ? "RPC_SOURCE_AND_FINALITY_VERIFIED" : "RPC_AND_INDEXER_VERIFIED",
      source_evidence_type: candidate.kind === "NORMAL" ? "RPC_NORMAL_TRANSACTION_FROM_CROSSCHECK" : qualifiedCandidate.source_evidence_type,
      source_evidence_status: candidate.kind === "NORMAL" ? (requireFinality ? "RPC_FROM_RECEIPT_AND_FINALITY_VERIFIED" : "RPC_FROM_AND_RECEIPT_VERIFIED") : qualifiedCandidate.source_evidence_status,
      verified_source_address: qualifiedCandidate.verified_source_address ?? qualifiedCandidate.from,
      source_registry_id: qualifiedCandidate.source_registry_id,
      tx_hash: candidate.tx_hash,
      block_number: block.block_number,
      block_hash: block.block_hash,
      transaction_index: candidate.transaction_index ?? 0,
      trace_index: candidate.kind === "INTERNAL" ? candidate.trace_index : null,
      timestamp: block.timestamp,
      recipient: wallet,
      amount: formatUnits(BigInt(candidate.value_wei)),
      amount_wei: candidate.value_wei,
      asset: "BNB",
      mass_class: "DARK_MATTER_MASS",
      chain_id: 56,
      confirmation_count: confirmationCount,
      minimum_confirmations: requireFinality ? this.minimumConfirmations : null,
      finality_status: finalityStatus,
      canonical_block_verified: canonicalBlockVerified
    });
  }

  async #firstQualifiedNaiheCandidate(candidates, wallet, context) {
    for (const rawCandidate of [...candidates].sort(chronological)) {
      let candidate;
      try {
        candidate = this.naiheSourceRegistry.verifyCandidate(rawCandidate, context);
      } catch (error) {
        if (error?.code) continue;
        throw error;
      }
      try {
        const verified = await this.#verifyNative(candidate, wallet, { requireFinality: true });
        return Object.freeze({ candidate, verified });
      } catch (error) {
        if (REJECTABLE_NAIHE_CANDIDATE_CODES.has(error?.code)) continue;
        throw error;
      }
    }
    return null;
  }

  async #verifyToken(candidate, wallet, expectedContract, eventType) {
    const [receipt, block] = await Promise.all([this.rpc.send("eth_getTransactionReceipt", [candidate.tx_hash]), this.#blockEvidence(candidate.block_number)]);
    invariant(receipt?.status === "0x1", "UNVERIFIED_TOKEN_RECEIPT", `${eventType} receipt failed`);
    const targetTopic = topicAddress(wallet);
    const log = receipt.logs?.find((item) => item.address?.toLowerCase() === expectedContract.toLowerCase() && item.topics?.[0]?.toLowerCase() === TRANSFER_TOPIC && item.topics?.[2]?.toLowerCase() === targetTopic);
    invariant(log && hexQuantity(log.data) === BigInt(candidate.value_raw), "TOKEN_TRANSFER_LOG_MISMATCH", `${eventType} Transfer log could not be verified`);
    return Object.freeze({ event_type: eventType, asset: candidate.symbol, amount: formatUnits(BigInt(candidate.value_raw), candidate.decimals), amount_raw: candidate.value_raw, block_number: block.block_number, transaction_index: candidate.transaction_index, timestamp: block.timestamp, tx_hash: candidate.tx_hash, verified: true });
  }

  async #currentBalances(wallet) {
    const balanceOfData = (address) => `0x70a08231${address.toLowerCase().slice(2).padStart(64, "0")}`;
    const [bnb, kgen, kaios] = await Promise.all([
      this.rpc.send("eth_getBalance", [wallet, "latest"]),
      this.rpc.send("eth_call", [{ to: this.tokens.KGEN, data: balanceOfData(wallet) }, "latest"]),
      this.rpc.send("eth_call", [{ to: this.tokens.KAIOS, data: balanceOfData(wallet) }, "latest"])
    ]);
    return Object.freeze({ BNB: formatUnits(hexQuantity(bnb)), KGEN: formatUnits(hexQuantity(kgen)), KAIOS: formatUnits(hexQuantity(kaios)) });
  }


  async #verifiedCompanyMembership(lifeId) {
    if (!this.trustedCompanyMembershipVerifier) return null;
    const membership = await this.trustedCompanyMembershipVerifier({ life_id: lifeId, company_id: KAIOS_AI_COMPANY_ID });
    if (!membership) return null;
    invariant(membership.life_id === lifeId, "COMPANY_MEMBERSHIP_LIFE_MISMATCH", "Company membership evidence belongs to another Life");
    invariant(membership.company_id === KAIOS_AI_COMPANY_ID, "COMPANY_PARENT_POLICY_SCOPE_MISMATCH", "Other companies require their own separately reviewed parent policy");
    invariant(typeof membership.membership_status === "string", "COMPANY_MEMBERSHIP_STATUS_INVALID", "Company membership status is missing");
    invariant(membership.verification_status === "VERIFIED_COMPANY_REGISTRY", "COMPANY_MEMBERSHIP_EVIDENCE_UNVERIFIED", "Company membership must come from a trusted company registry verifier");
    return Object.freeze({ ...membership });
  }

  async resolveSpiritGenesisAnchor({ life, energyWalletBinding, birthRequestId, challenge }) {
    invariant(life.life_id === "LIFE-KAIOS-STARFORGE-0001" && life.local_genesis === "VERIFIED", "LOCAL_GENESIS_REQUIRED", "Spirit anchor requires the existing verified local Genesis");
    const binding = assertCanonicalStarforgeEnergyWalletBinding(energyWalletBinding, { lifeId: life.life_id });
    const soulId = binding.soul_id;
    const energyWalletAddress = binding.withVerifiedAddress((address) => address);
    const membership = await this.#verifiedCompanyMembership(life.life_id);
    const parent = companyParentState(membership);
    if (membership?.membership_status !== KAIOS_AI_COMPANY_ACTIVE_MEMBERSHIP_STATUS) {
      return Object.freeze({ status: "PENDING", nai_he_source_status: NAIHE_SOURCE_POLICY.status, onchain_genesis: "NOT_YET_ANCHORED", ...parent });
    }
    const chainId = Number(hexQuantity(await this.rpc.send("eth_chainId", [])));
    invariant(chainId === 56, "WRONG_CHAIN", "Spirit anchor requires BSC mainnet chain 56");
    if (!this.historyIndexer || !this.naiheSourceRegistry) return Object.freeze({ status: "PENDING", nai_he_source_status: NAIHE_SOURCE_POLICY.status, onchain_genesis: "NOT_YET_ANCHORED", ...parent });
    const candidates = await this.historyIndexer.listNativeIncoming(energyWalletAddress);
    const qualified = await this.#firstQualifiedNaiheCandidate(candidates, energyWalletAddress, { lifeId: life.life_id, soulId, energyWalletAddress, birthRequestId, challenge });
    if (!qualified) return Object.freeze({ status: "PENDING", nai_he_source_status: "NO_FULLY_VERIFIED_SOURCE_EVIDENCE", onchain_genesis: "NOT_YET_ANCHORED", ...parent });
    const { candidate, verified } = qualified;
    const draft = {
      life_id: life.life_id,
      soul_id: soulId,
      energy_wallet_address: energyWalletAddress,
      birth_source_address: verified.verified_source_address,
      ...parent,
      naihe_water_source_id: verified.source_registry_id,
      birth_request_id: birthRequestId,
      source_evidence_type: verified.source_evidence_type,
      source_evidence_status: verified.source_evidence_status,
      anchor_tx_hash: verified.tx_hash,
      anchor_block: verified.block_number,
      anchor_block_hash: verified.block_hash,
      anchor_timestamp: verified.timestamp,
      transaction_index: verified.transaction_index,
      trace_index: verified.trace_index,
      chain_id: 56,
      exact_amount_wei: verified.amount_wei,
      confirmation_count: verified.confirmation_count,
      minimum_confirmations: verified.minimum_confirmations,
      finality_status: verified.finality_status,
      canonical_block_verified: verified.canonical_block_verified,
      replay_serialization: SPIRIT_ANCHOR_REPLAY_SERIALIZATION,
      parent_freeze_status: "FROZEN_COMPANY_PARENT_ID_ON_FIRST_FINALIZED_ANCHOR",
      status: "DARK_MATTER_EMBODIMENT_ACTIVATION",
      event_type: "SPIRIT_GENESIS_ANCHOR",
      onchain_genesis: "ANCHORED",
      first_dark_matter: verified
    };
    const record = validateSpiritGenesisAnchorV2({ ...draft, replay_protection_id: deriveSpiritGenesisAnchorReplayProtectionId(draft) });
    const anchorLedger = assertPersistentSpiritGenesisAnchorLedger(this.anchorLedger);
    await anchorLedger.commitAnchor(record);
    return record;
  }

  async resolveWithBinding({ life, binding }) {
    invariant(binding?.binding_status === "VERIFIED_BOUND", "WALLET_BINDING_REQUIRED", "Birth resolution requires verified Digital Life wallet binding");
    invariant(binding.life_id === life.life_id, "LIFE_BINDING_MISMATCH", "Birth resolution binding must belong to the supplied Life");
    return binding.withVerifiedAddress((wallet) => this.resolve({ life, wallet }));
  }

  async resolve({ life, wallet }) {
    const chainId = Number(hexQuantity(await this.rpc.send("eth_chainId", [])));
    invariant(chainId === 56, "WRONG_CHAIN", "Birth evidence must resolve on BSC mainnet chain 56");
    const balances = await this.#currentBalances(wallet);
    if (!this.historyIndexer) return Object.freeze({ binding_status: "WALLET_BOUND", derived_address_match: true, birth_evidence_status: "BIRTH_EVIDENCE_PENDING", certificate: createPendingBirthCertificate(life), first_bnb: null, first_kgen: null, first_kaios: null, balances, life_status: "BODY_READY", work_status: pendingWorkStatus(life), dark_matter_status: "BIRTH_EVIDENCE_PENDING" });

    const [native, kgenTransfers, kaiosTransfers] = await Promise.all([
      this.historyIndexer.listNativeIncoming(wallet),
      this.historyIndexer.listTokenIncoming(wallet, this.tokens.KGEN),
      this.historyIndexer.listTokenIncoming(wallet, this.tokens.KAIOS)
    ]);
    const nativeCandidate = firstCanonical(native);
    const kgenCandidate = firstCanonical(kgenTransfers);
    const kaiosCandidate = firstCanonical(kaiosTransfers);
    const firstBnb = nativeCandidate ? await this.#verifyNative(nativeCandidate, wallet) : null;
    const firstKgen = kgenCandidate ? await this.#verifyToken(kgenCandidate, wallet, this.tokens.KGEN, "FIRST_KGEN_EVENT") : null;
    const firstKaios = kaiosCandidate ? await this.#verifyToken(kaiosCandidate, wallet, this.tokens.KAIOS, "FIRST_KAIOS_EVENT") : null;
    if (!firstBnb) return Object.freeze({ binding_status: "WALLET_BOUND", derived_address_match: true, birth_evidence_status: "BIRTH_EVIDENCE_PENDING", certificate: createPendingBirthCertificate(life), first_bnb: null, first_kgen: firstKgen, first_kaios: firstKaios, balances, life_status: "BODY_READY", work_status: pendingWorkStatus(life), dark_matter_status: "BIRTH_EVIDENCE_PENDING" });
    const certificate = createBirthCertificate({ life, wallet, firstBnb });
    const depleted = balances.BNB === "0";
    return Object.freeze({ binding_status: "WALLET_BOUND", derived_address_match: true, birth_evidence_status: "VERIFIED", certificate, first_bnb: firstBnb, first_kgen: firstKgen, first_kaios: firstKaios, balances, life_status: depleted ? "DORMANT" : "ALIVE_WITH_DARK_MATTER", work_status: certificate.work_status, dark_matter_status: depleted ? "DARK_MATTER_DEPLETED" : "DARK_MATTER_PRESENT" });
  }
}
