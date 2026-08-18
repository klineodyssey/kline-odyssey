import { invariant } from "../shared/errors.mjs";
import { createBirthCertificate, createPendingBirthCertificate } from "./index.mjs";

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
  constructor({ rpc, historyIndexer = null, tokens }) {
    this.rpc = rpc;
    this.historyIndexer = historyIndexer;
    this.tokens = tokens;
  }

  async #blockEvidence(blockNumber) {
    const block = await this.rpc.send("eth_getBlockByNumber", [`0x${BigInt(blockNumber).toString(16)}`, false]);
    invariant(block, "BIRTH_BLOCK_NOT_FOUND", "Birth evidence block is unavailable");
    invariant(/^0x[0-9a-fA-F]{64}$/.test(block.hash ?? ""), "BIRTH_BLOCK_HASH_MISSING", "Birth evidence block hash is unavailable");
    return { block_number: Number(hexQuantity(block.number)), block_hash: block.hash, timestamp: new Date(Number(hexQuantity(block.timestamp)) * 1000).toISOString() };
  }

  async #verifyNative(candidate, wallet) {
    const [receipt, transaction, block] = await Promise.all([
      this.rpc.send("eth_getTransactionReceipt", [candidate.tx_hash]),
      this.rpc.send("eth_getTransactionByHash", [candidate.tx_hash]),
      this.#blockEvidence(candidate.block_number)
    ]);
    invariant(receipt?.status === "0x1" && Number(hexQuantity(receipt.blockNumber)) === candidate.block_number, "UNVERIFIED_BNB_RECEIPT", "First BNB receipt could not be verified");
    invariant(receipt.blockHash?.toLowerCase() === block.block_hash.toLowerCase(), "BIRTH_BLOCK_HASH_MISMATCH", "Birth receipt and canonical block hash do not match");
    if (candidate.kind === "NORMAL") {
      invariant(transaction?.hash?.toLowerCase() === candidate.tx_hash.toLowerCase(), "BNB_TRANSACTION_MISMATCH", "Normal BNB transaction hash does not match the indexed candidate");
      invariant(transaction?.to?.toLowerCase() === wallet.toLowerCase(), "BNB_RECIPIENT_MISMATCH", "Normal BNB recipient does not match the bound wallet");
      invariant(hexQuantity(transaction.value) === BigInt(candidate.value_wei), "BNB_AMOUNT_MISMATCH", "Normal BNB amount does not match RPC");
    }
    return Object.freeze({ verified: true, evidence_class: candidate.kind === "NORMAL" ? "RPC_VERIFIED_NORMAL_TRANSFER" : "INDEXER_INTERNAL_TRACE_AND_RPC_RECEIPT", evidence_status: candidate.evidence_status ?? "RPC_AND_INDEXER_VERIFIED", tx_hash: candidate.tx_hash, block_number: block.block_number, block_hash: block.block_hash, transaction_index: candidate.transaction_index, timestamp: block.timestamp, recipient: wallet, amount: formatUnits(BigInt(candidate.value_wei)), amount_wei: candidate.value_wei, asset: "BNB", mass_class: "DARK_MATTER_MASS", chain_id: 56 });
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
