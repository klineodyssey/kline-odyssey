import { invariant } from "../shared/errors.mjs";

const ETHERSCAN_V2_API = "https://api.etherscan.io/v2/api";

function requireSuccess(payload) {
  if (payload.status === "1" && Array.isArray(payload.result)) return payload.result;
  if (payload.status === "0" && /no transactions found/i.test(String(payload.message) + String(payload.result))) return [];
  throw new Error("Trusted history indexer did not return a complete result");
}

export class EtherscanBscHistoryIndexer {
  constructor({ apiKey, fetchImpl = globalThis.fetch, endpoint = ETHERSCAN_V2_API } = {}) {
    invariant(apiKey, "HISTORY_INDEXER_KEY_REQUIRED", "Complete BSC history requires an Etherscan V2 API key");
    invariant(typeof fetchImpl === "function", "FETCH_UNAVAILABLE", "History indexer requires fetch");
    this.apiKey = apiKey;
    this.fetchImpl = fetchImpl;
    this.endpoint = endpoint;
  }

  async #query(action, address, extra = {}) {
    const query = new URLSearchParams({ chainid: "56", module: "account", action, address, startblock: "0", endblock: "9999999999", page: "1", offset: "10000", sort: "asc", ...extra, apikey: this.apiKey });
    const response = await this.fetchImpl(`${this.endpoint}?${query}`);
    if (!response.ok) throw new Error("Trusted history indexer is unavailable");
    return requireSuccess(await response.json());
  }

  async listNativeIncoming(address) {
    const [normal, internal] = await Promise.all([this.#query("txlist", address), this.#query("txlistinternal", address)]);
    const target = address.toLowerCase();
    const normalize = (item, kind) => ({
      kind,
      tx_hash: item.hash,
      block_number: Number(item.blockNumber),
      transaction_index: Number(item.transactionIndex ?? 0),
      trace_id: item.traceId ?? null,
      to: item.to,
      value_wei: item.value,
      indexer_timestamp: Number(item.timeStamp),
      successful: String(item.isError ?? "0") === "0"
    });
    return [...normal.map((item) => normalize(item, "NORMAL")), ...internal.map((item) => normalize(item, "INTERNAL"))]
      .filter((item) => item.successful && item.to?.toLowerCase() === target && BigInt(item.value_wei) > 0n)
      .sort((left, right) => left.block_number - right.block_number || left.transaction_index - right.transaction_index || String(left.trace_id).localeCompare(String(right.trace_id)));
  }

  async listTokenIncoming(address, contractAddress) {
    const transfers = await this.#query("tokentx", address, { contractaddress: contractAddress });
    const target = address.toLowerCase();
    return transfers.filter((item) => item.to?.toLowerCase() === target && BigInt(item.value) > 0n && String(item.isError ?? "0") === "0").map((item) => ({
      tx_hash: item.hash,
      block_number: Number(item.blockNumber),
      transaction_index: Number(item.transactionIndex ?? 0),
      to: item.to,
      contract_address: item.contractAddress,
      value_raw: item.value,
      decimals: Number(item.tokenDecimal),
      symbol: item.tokenSymbol
    })).sort((left, right) => left.block_number - right.block_number || left.transaction_index - right.transaction_index);
  }
}
