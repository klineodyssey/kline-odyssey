const SCALE = 10n ** 18n;
const QUOTE_STATUS = "UNFROZEN_CANDIDATE";
const MARKET_CELL_COORDINATE = "0.00011520";
const MARKET_CELL_COORDINATE_ROLE = "CANDIDATE_KGEN_UNIVERSE_PRICE_AND_COMPANY_ADDRESS";
const MARKET_CELL_COORDINATE_STATUS = "UNVERIFIED_CANDIDATE";
const MARKET_CELL_COORDINATE_AUTHORITY = null;
const COMPANY_ADDRESS = "0.00011520";
const COMPANY_K_COORDINATE = "K11520";
const KGEN_PRICE_COORDINATE_UNIT = "USD_PER_KGEN";
const GPU_EVIDENCE_REGISTRY_URL = new URL("../runtime/gpu-real-evidence-registry.v1.json", import.meta.url);
const GPU_TRADING_CAPITAL_REGISTRY_URL = new URL("../runtime/company-trading-capital-registry.v1.json", import.meta.url);
const repositoryBoundGpuEvidenceBundles = new WeakSet();
const repositoryBoundGpuEvidenceFetch = typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : null;
const SETTLEMENT_11520_RPC_URLS = Object.freeze([
  "https://bsc-dataseed.binance.org",
  "https://bsc.publicnode.com"
]);
const repositoryBoundSettlement11520Fetch = typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : null;
const verifiedSettlement11520Snapshots = new WeakSet();
const SETTLEMENT_11520_IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const SETTLEMENT_11520_SELECTORS = Object.freeze({
  version: "0x54fd4d50",
  bank: "0x76cdb03b",
  module_id: "0xa1308f27",
  governance_finalized: "0x2f70c6e0",
  fixed_exchange: "0xf1ecdb42",
  total_settled: "0xeace4c91",
  has_role: "0x91d14854"
});

export const EXCHANGE_SETTLEMENT_11520_CONFIG = Object.freeze({
  chain_id: 56,
  proxy: "0x17587F49dFDE4e400D03Ae81364AC2af8E1629Df",
  implementation: "0xA08A9CEcfa18b2FDb9ca8De0063A5029B9Ffc363",
  bank: "0x11d34c0F723aCd334B8F95076f73F07f06202aab",
  governance: "0xa2792fBDCc8A8AaC364053431D44E0a8D335E166",
  fixed_exchange: "0xd0605F4EF10e5C1438F11AF9edc36926769239d6",
  module_id: "0x24b8150af34ecded6c75de16b22b3a7fa6477e94cb23ea338a9453af3ed8961b",
  governance_role: "0x71840dc4906352362b0cdaf79870196c8e42acafade72d5d5a6d59291253ceb1",
  version: "1.0.0",
  deployed_capability: "GOVERNANCE_AUTHORIZED_18888_KAIOS_PAYMENT_TO_FIXED_11520_BRAIN",
  runtime_identity: Object.freeze({
    frozen_source_commit: "9492d73aaac7a9cee2cf9b813aa78468719aadcd",
    compile_evidence_path: "KGEN-KAIOS/reports/SOLIDITY_COMPILE_EVIDENCE.json",
    compiler: "0.8.24+commit.e11b9ed9.Emscripten.clang",
    optimizer_runs: 1,
    via_ir: true,
    evm_version: "paris",
    metadata_bytecode_hash: "none",
    proxy_runtime_bytes: 92,
    proxy_runtime_keccak256: "0x572e640425d4d6c1f70e591dec2930f8d9481f510d67a7b9577543ebaeb5dfb6",
    proxy_runtime_sha256: "0x85361cb9411e9752b95987780720bd7559bc87083fce4d435bfea6acd823d32d",
    implementation_runtime_bytes: 5474,
    implementation_masked_keccak256: "0x505cefc01f6df515406bdf28dec432056fd4e5f7f37c808248d0fe63530378d0",
    implementation_runtime_sha256: "0xb4f497f105c4e234eeaa586c920feb717f237d0639ec2ce6e50f75caad8e34b2",
    immutable_self_address: "0xA08A9CEcfa18b2FDb9ca8De0063A5029B9Ffc363",
    immutable_self_offsets: Object.freeze([
      Object.freeze({ start: 2292, length: 20 }),
      Object.freeze({ start: 2500, length: 20 })
    ])
  })
});

function parseDecimal(value, label = "value") {
  const text = String(value).trim();
  if (!/^\d+(?:\.\d+)?$/.test(text)) throw new TypeError(`${label} must be a positive decimal string`);
  const [whole, fraction = ""] = text.split(".");
  if (fraction.length > 18) throw new RangeError(`${label} supports at most 18 decimals`);
  const raw = BigInt(whole) * SCALE + BigInt((fraction + "0".repeat(18)).slice(0, 18));
  if (raw <= 0n) throw new RangeError(`${label} must be > 0`);
  return raw;
}

function formatDecimal(raw) {
  const whole = raw / SCALE;
  const fraction = String(raw % SCALE).padStart(18, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
}

function normalizeActorId(value, label) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized || normalized === "anonymous" || normalized === "anon") {
    throw new TypeError(`${label} must be a non-anonymous actor/Life identifier`);
  }
  if (!/^[a-z0-9][a-z0-9:._-]{2,127}$/.test(normalized)) {
    throw new TypeError(`${label} must be 3-128 normalized actor/Life characters`);
  }
  return normalized;
}

function normalizeEvidenceId(value) {
  const normalized = String(value ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9:._-]{2,127}$/.test(normalized)) {
    throw new TypeError("verified actor evidence_id must be 3-128 canonical characters");
  }
  return normalized;
}

function resolveVerifiedActorContext({ actorContext, verifyActorContext, timestampMs, purpose, marketId }) {
  if (typeof verifyActorContext !== "function") throw new Error("ACTOR_CONTEXT_VERIFIER_REQUIRED");
  let verified;
  try {
    verified = verifyActorContext(actorContext, Object.freeze({ purpose, market_id: marketId, observed_at_ms: timestampMs }));
  } catch {
    throw new Error("ACTOR_CONTEXT_VERIFICATION_FAILED");
  }
  if (!verified || typeof verified !== "object" || verified.authentication_status !== "VERIFIED") {
    throw new Error("ACTOR_CONTEXT_NOT_VERIFIED");
  }

  const actorId = normalizeActorId(verified.actor_id, "verified actor_id");
  const controllerId = normalizeActorId(verified.controller_id, "verified controller_id");
  const authenticationMethod = String(verified.authentication_method ?? "").trim();
  if (!/^[A-Z][A-Z0-9_]{2,63}$/.test(authenticationMethod)) {
    throw new TypeError("verified authentication_method must be canonical");
  }
  const evidenceId = normalizeEvidenceId(verified.evidence_id);
  const issuedAtMs = Date.parse(String(verified.issued_at ?? ""));
  if (!Number.isFinite(issuedAtMs) || issuedAtMs > timestampMs) throw new Error("ACTOR_CONTEXT_ISSUED_AT_INVALID");

  let expiresAt = null;
  if (verified.expires_at !== null && verified.expires_at !== undefined) {
    const expiresAtMs = Date.parse(String(verified.expires_at));
    if (!Number.isFinite(expiresAtMs) || expiresAtMs < issuedAtMs || timestampMs > expiresAtMs) {
      throw new Error("ACTOR_CONTEXT_EXPIRED");
    }
    expiresAt = new Date(expiresAtMs).toISOString();
  }

  const sessionId = verified.session_id === null || verified.session_id === undefined
    ? null
    : normalizeEvidenceId(verified.session_id);
  return Object.freeze({
    actorId,
    controllerId,
    authenticationStatus: "VERIFIED",
    authenticationMethod,
    evidenceId,
    issuedAt: new Date(issuedAtMs).toISOString(),
    expiresAt,
    sessionId
  });
}

function cloneOrder(order) {
  return {
    id: order.id,
    side: order.side,
    owner: order.owner,
    controller: order.controller,
    actorAuthority: { ...order.actorAuthority },
    price: formatDecimal(order.price),
    quantity: formatDecimal(order.quantity),
    remaining: formatDecimal(order.remaining),
    createdAt: order.createdAt,
    sequence: order.sequence
  };
}

function normalizeSide(side) {
  const normalized = String(side).toUpperCase();
  if (normalized !== "BUY" && normalized !== "SELL") throw new TypeError("side must be BUY or SELL");
  return normalized;
}

function bucketStart(timestampMs, intervalMs) {
  return Math.floor(timestampMs / intervalMs) * intervalMs;
}

/**
 * 11520 KGEN native market-cell engine.
 *
 * PAPER_IN_MEMORY_CANDIDATE_NOT_ACTIVE_RUNTIME
 *
 * Canon / integrity boundary:
 * - `0.00011520` is the fixed K11520 Company address and KGEN Universe
 *   USD-per-KGEN price coordinate.
 * - The fixed coordinate NEVER seeds, fixes or influences matched-trade CT.
 * - CT is undefined before the first valid matched trade.
 * - CT becomes exactly the most recent native 11520 matched trade price.
 * - PancakeSwap/WBNB/USD/L-P data are not pricing inputs.
 * - Anonymous actors, same-owner matches and same-controller matches fail closed.
 * - This module has no signer, custody, settlement, transfer, approval, chain-write or Mainnet authority.
 */
function createVerified11520PaperMarketCell({
  marketId,
  baseAsset,
  baseDecimals,
  quoteAsset,
  quoteDecimals,
  priceStatus,
  tickSize = "0.00000001",
  lotSize = "0.00000001",
  candleIntervalMs = 60_000,
  clock = () => Date.now(),
  verifyActorContext
} = {}) {
  if (!Number.isSafeInteger(candleIntervalMs) || candleIntervalMs <= 0) {
    throw new RangeError("candleIntervalMs must be a positive safe integer");
  }
  if (typeof verifyActorContext !== "function") throw new Error("ACTOR_CONTEXT_VERIFIER_REQUIRED");

  const tickRaw = parseDecimal(tickSize, "tickSize");
  const lotRaw = parseDecimal(lotSize, "lotSize");
  const bids = [];
  const asks = [];
  const trades = [];
  const candles = new Map();
  let nextOrder = 1;
  let sequence = 1;
  let ct = null;

  const compareBid = (a, b) => (a.price === b.price ? a.sequence - b.sequence : a.price > b.price ? -1 : 1);
  const compareAsk = (a, b) => (a.price === b.price ? a.sequence - b.sequence : a.price < b.price ? -1 : 1);

  function sortBooks() {
    bids.sort(compareBid);
    asks.sort(compareAsk);
  }

  function updateCandle(trade) {
    const start = bucketStart(trade.timestampMs, candleIntervalMs);
    const existing = candles.get(start);
    if (!existing) {
      candles.set(start, {
        startTime: new Date(start).toISOString(),
        endTime: new Date(start + candleIntervalMs).toISOString(),
        open: trade.priceRaw,
        high: trade.priceRaw,
        low: trade.priceRaw,
        close: trade.priceRaw,
        volume: trade.quantityRaw,
        trades: 1
      });
      return;
    }
    if (trade.priceRaw > existing.high) existing.high = trade.priceRaw;
    if (trade.priceRaw < existing.low) existing.low = trade.priceRaw;
    existing.close = trade.priceRaw;
    existing.volume += trade.quantityRaw;
    existing.trades += 1;
  }

  function assertNoSelfMatch(taker) {
    const opposite = taker.side === "BUY" ? asks : bids;
    let remaining = taker.remaining;
    for (const maker of opposite) {
      if (remaining <= 0n) break;
      const crosses = taker.side === "BUY" ? taker.price >= maker.price : taker.price <= maker.price;
      if (!crosses) break;
      if (maker.owner === taker.owner) throw new Error("SELF_MATCH_FORBIDDEN_SAME_OWNER");
      if (maker.controller === taker.controller) throw new Error("SELF_MATCH_FORBIDDEN_SAME_CONTROLLER");
      remaining -= remaining < maker.remaining ? remaining : maker.remaining;
    }
  }

  function executeTrade({ maker, taker, quantity, price, timestampMs }) {
    const trade = {
      id: `T${trades.length + 1}`,
      marketId,
      baseAsset,
      quoteAsset,
      priceRaw: price,
      quantityRaw: quantity,
      price: formatDecimal(price),
      quantity: formatDecimal(quantity),
      makerOrderId: maker.id,
      takerOrderId: taker.id,
      makerSide: maker.side,
      takerSide: taker.side,
      makerOwner: maker.owner,
      takerOwner: taker.owner,
      makerController: maker.controller,
      takerController: taker.controller,
      makerActorEvidenceId: maker.actorAuthority.evidenceId,
      takerActorEvidenceId: taker.actorAuthority.evidenceId,
      timestampMs,
      timestamp: new Date(timestampMs).toISOString()
    };
    trades.push(trade);
    ct = price;
    updateCandle(trade);
    return trade;
  }

  function match(taker, timestampMs) {
    assertNoSelfMatch(taker);
    const opposite = taker.side === "BUY" ? asks : bids;
    const fills = [];

    while (taker.remaining > 0n && opposite.length) {
      const maker = opposite[0];
      const crosses = taker.side === "BUY" ? taker.price >= maker.price : taker.price <= maker.price;
      if (!crosses) break;

      const quantity = taker.remaining < maker.remaining ? taker.remaining : maker.remaining;
      const trade = executeTrade({ maker, taker, quantity, price: maker.price, timestampMs });
      fills.push(trade);
      taker.remaining -= quantity;
      maker.remaining -= quantity;
      if (maker.remaining === 0n) opposite.shift();
    }

    return fills;
  }

  function placeOrder({ side, price, quantity, actorContext }) {
    const normalizedSide = normalizeSide(side);
    const priceRaw = parseDecimal(price, "price");
    const quantityRaw = parseDecimal(quantity, "quantity");
    if (priceRaw % tickRaw !== 0n) throw new RangeError("price must align to tickSize");
    if (quantityRaw % lotRaw !== 0n) throw new RangeError("quantity must align to lotSize");
    const timestampMs = Number(clock());
    if (!Number.isFinite(timestampMs)) throw new TypeError("clock must return a finite millisecond timestamp");
    const authority = resolveVerifiedActorContext({
      actorContext,
      verifyActorContext,
      timestampMs,
      purpose: "PLACE_ORDER",
      marketId
    });

    const order = {
      id: `O${nextOrder++}`,
      side: normalizedSide,
      owner: authority.actorId,
      controller: authority.controllerId,
      actorAuthority: {
        authenticationStatus: authority.authenticationStatus,
        authenticationMethod: authority.authenticationMethod,
        evidenceId: authority.evidenceId,
        issuedAt: authority.issuedAt,
        expiresAt: authority.expiresAt,
        sessionId: authority.sessionId
      },
      price: priceRaw,
      quantity: quantityRaw,
      remaining: quantityRaw,
      createdAt: new Date(timestampMs).toISOString(),
      sequence: sequence++
    };

    const fills = match(order, timestampMs);
    if (order.remaining > 0n) {
      (normalizedSide === "BUY" ? bids : asks).push(order);
      sortBooks();
    }

    return {
      order: cloneOrder(order),
      fills: fills.map(({ priceRaw, quantityRaw, ...trade }) => ({ ...trade })),
      ct: ct === null ? null : formatDecimal(ct)
    };
  }

  function cancelOrder(orderId, actorContext) {
    const timestampMs = Number(clock());
    if (!Number.isFinite(timestampMs)) throw new TypeError("clock must return a finite millisecond timestamp");
    const authority = resolveVerifiedActorContext({
      actorContext,
      verifyActorContext,
      timestampMs,
      purpose: "CANCEL_ORDER",
      marketId
    });
    for (const book of [bids, asks]) {
      const index = book.findIndex((order) => order.id === orderId);
      if (index < 0) continue;
      const order = book[index];
      if (order.owner !== authority.actorId || order.controller !== authority.controllerId) {
        throw new Error("CANCEL_AUTHORIZATION_FAILED");
      }
      return cloneOrder(book.splice(index, 1)[0]);
    }
    return null;
  }

  function getOrderBook(depth = 20) {
    const size = Math.max(1, Math.min(200, Number(depth) || 20));
    return {
      bids: bids.slice(0, size).map(cloneOrder),
      asks: asks.slice(0, size).map(cloneOrder),
      bestBid: bids[0] ? formatDecimal(bids[0].price) : null,
      bestAsk: asks[0] ? formatDecimal(asks[0].price) : null
    };
  }

  function getMarketState() {
    const book = getOrderBook(1);
    return Object.freeze({
      marketId,
      marketCellCoordinate: MARKET_CELL_COORDINATE,
      marketCellCoordinateRole: MARKET_CELL_COORDINATE_ROLE,
      marketCellCoordinateStatus: MARKET_CELL_COORDINATE_STATUS,
      marketCellCoordinateAuthority: MARKET_CELL_COORDINATE_AUTHORITY,
      repositoryBoundHumanCoordinateAuthority: false,
      companyAddress: COMPANY_ADDRESS,
      companyKCoordinate: COMPANY_K_COORDINATE,
      kgenUniversePriceCoordinate: MARKET_CELL_COORDINATE,
      kgenUniversePriceCoordinateUnit: KGEN_PRICE_COORDINATE_UNIT,
      runtimeStatus: "PAPER_IN_MEMORY_CANDIDATE_NOT_ACTIVE_RUNTIME",
      baseAsset,
      baseDecimals,
      quoteAsset,
      quoteStatus: QUOTE_STATUS,
      quoteDecimals,
      tickSize: formatDecimal(tickRaw),
      lotSize: formatDecimal(lotRaw),
      priceStatus,
      pricingAuthority: "NATIVE_11520_MATCHED_BUY_SELL_TRADES_ONLY",
      externalReferencePriceAuthority: false,
      ct: ct === null ? null : formatDecimal(ct),
      nativeMatchedTradeCT: ct === null ? null : formatDecimal(ct),
      ctMeaning: "CURRENT_NATIVE_MATCHED_TRADE_PRICE_UNIVERSE_BOUNDARY",
      bestBid: book.bestBid,
      bestAsk: book.bestAsk,
      tradeCount: trades.length,
      selfMatchPolicy: "FAIL_CLOSED_SAME_OWNER_OR_CONTROLLER",
      anonymousActorPolicy: "FORBIDDEN",
      actorAuthentication: "INDEPENDENT_VERIFIER_REQUIRED",
      callerAssertedIdentityAuthority: false,
      settlement: "PAPER_IN_MEMORY_NO_ASSET_TRANSFER",
      chainWrite: false,
      signer: false
    });
  }

  function getTrades(limit = 100) {
    const size = Math.max(1, Math.min(1000, Number(limit) || 100));
    return trades.slice(-size).map(({ priceRaw, quantityRaw, ...trade }) => ({ ...trade }));
  }

  function getCandles(limit = 100) {
    const rows = [...candles.values()].sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
    const size = Math.max(1, Math.min(1000, Number(limit) || 100));
    return rows.slice(-size).map((candle) => ({
      startTime: candle.startTime,
      endTime: candle.endTime,
      open: formatDecimal(candle.open),
      high: formatDecimal(candle.high),
      low: formatDecimal(candle.low),
      close: formatDecimal(candle.close),
      volume: formatDecimal(candle.volume),
      trades: candle.trades
    }));
  }

  return Object.freeze({
    placeOrder,
    cancelOrder,
    getOrderBook,
    getMarketState,
    getTrades,
    getCandles
  });
}

export function createKgenNativeMarketCell(options = {}) {
  return createVerified11520PaperMarketCell({
    ...options,
    marketId: options.marketId ?? "11520_KGEN_NATIVE_MARKET",
    baseAsset: "KGEN",
    baseDecimals: 18,
    quoteAsset: "UNFROZEN_11520_NATIVE_QUOTE_CANDIDATE",
    quoteDecimals: 18,
    priceStatus: "NATIVE_MARKET_PRICE_CANDIDATE"
  });
}

/**
 * Paper-only GPU market at the assigned K11520 company/exchange address.
 *
 * The quote book is isolated by asset: GPU/KGEN and GPU/KAIOS never share
 * orders, CT, OHLC or volume. A caller still needs a verified actor context;
 * this function adds no custody, settlement, signer or chain-write ability.
 */
export function createGpu11520PaperMarket({ quoteAsset, ...options } = {}) {
  const normalizedQuote = String(quoteAsset ?? "").trim().toUpperCase();
  if (!new Set(["KGEN", "KAIOS"]).has(normalizedQuote)) {
    throw new Error("GPU_QUOTE_ASSET_NOT_ALLOWED");
  }
  return createVerified11520PaperMarketCell({
    ...options,
    marketId: options.marketId ?? `11520_NVIDIA_GPU_${normalizedQuote}_PAPER_MARKET`,
    baseAsset: "NVIDIA_GPU_CHIP",
    baseDecimals: 0,
    quoteAsset: normalizedQuote,
    quoteDecimals: 18,
    lotSize: options.lotSize ?? "1",
    priceStatus: `GPU_${normalizedQuote}_MARKET_PRICE_CANDIDATE`
  });
}

function settlementRpcHexQuantity(value, label) {
  if (typeof value !== "string" || !/^0x[0-9a-f]+$/i.test(value)) {
    throw new TypeError(`${label} must be a JSON-RPC hex quantity`);
  }
  const number = Number(BigInt(value));
  if (!Number.isSafeInteger(number)) throw new RangeError(`${label} exceeds the safe integer range`);
  return number;
}

function settlementRpcWord(value, label) {
  if (typeof value !== "string" || !/^0x[0-9a-f]{64}$/i.test(value)) {
    throw new TypeError(`${label} must be one ABI word`);
  }
  return value.toLowerCase();
}

function settlementRpcAddress(value, label) {
  return `0x${settlementRpcWord(value, label).slice(-40)}`;
}

function settlementRpcBoolean(value, label) {
  const parsed = BigInt(settlementRpcWord(value, label));
  if (parsed !== 0n && parsed !== 1n) throw new TypeError(`${label} must be an ABI boolean`);
  return parsed === 1n;
}

function settlementRpcUint(value, label) {
  return BigInt(settlementRpcWord(value, label)).toString();
}

function settlementRpcString(value, label) {
  if (typeof value !== "string" || !/^0x[0-9a-f]+$/i.test(value) || value.length < 130) {
    throw new TypeError(`${label} must be an ABI string`);
  }
  const body = value.slice(2);
  if (BigInt(`0x${body.slice(0, 64)}`) !== 32n) throw new TypeError(`${label} ABI offset is invalid`);
  const byteLength = Number(BigInt(`0x${body.slice(64, 128)}`));
  if (!Number.isSafeInteger(byteLength) || byteLength < 0 || byteLength > 64) {
    throw new TypeError(`${label} ABI length is invalid`);
  }
  const encoded = body.slice(128, 128 + byteLength * 2);
  if (encoded.length !== byteLength * 2) throw new TypeError(`${label} ABI payload is truncated`);
  return new TextDecoder().decode(Uint8Array.from(encoded.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16)));
}

function settlementRoleCallData(role, account) {
  if (!/^0x[0-9a-f]{64}$/i.test(role) || !/^0x[0-9a-f]{40}$/i.test(account)) {
    throw new TypeError("Settlement role query requires canonical role and account values");
  }
  return `${SETTLEMENT_11520_SELECTORS.has_role}${role.slice(2).toLowerCase()}${account.slice(2).toLowerCase().padStart(64, "0")}`;
}

async function settlementCodeSha256(code, label) {
  if (typeof code !== "string" || !/^0x(?:[0-9a-f]{2})+$/i.test(code)) {
    throw new TypeError(`${label} bytecode is missing or malformed`);
  }
  if (!globalThis.crypto?.subtle) throw new Error("SETTLEMENT_11520_CRYPTO_UNAVAILABLE");
  const bytes = Uint8Array.from(code.slice(2).match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return `0x${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

async function settlementRpcRequest({ url, method, params, fetchImpl, signal, id }) {
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    signal
  });
  if (response?.ok !== true) throw new Error(`SETTLEMENT_11520_RPC_HTTP_FAILURE:${method}`);
  const payload = await response.json();
  if (!payload || payload.error !== undefined || payload.result === undefined) {
    throw new Error(`SETTLEMENT_11520_RPC_RESPONSE_FAILURE:${method}`);
  }
  return payload.result;
}

async function observeSettlement11520AtBlock({ url, blockNumber, fetchImpl, signal, requestId }) {
  const blockTag = `0x${BigInt(blockNumber).toString(16)}`;
  const call = (data, offset) => settlementRpcRequest({
    url,
    method: "eth_call",
    params: [{ to: EXCHANGE_SETTLEMENT_11520_CONFIG.proxy, data }, blockTag],
    fetchImpl,
    signal,
    id: requestId + offset
  });
  const [block, proxyCode, implementationWord, implementationCode, bankCode, fixedExchangeCode,
    version, bank, moduleId, governanceFinalized, fixedExchange, totalSettled, governanceRole] = await Promise.all([
    settlementRpcRequest({ url, method: "eth_getBlockByNumber", params: [blockTag, false], fetchImpl, signal, id: requestId }),
    settlementRpcRequest({ url, method: "eth_getCode", params: [EXCHANGE_SETTLEMENT_11520_CONFIG.proxy, blockTag], fetchImpl, signal, id: requestId + 1 }),
    settlementRpcRequest({ url, method: "eth_getStorageAt", params: [EXCHANGE_SETTLEMENT_11520_CONFIG.proxy, SETTLEMENT_11520_IMPLEMENTATION_SLOT, blockTag], fetchImpl, signal, id: requestId + 2 }),
    settlementRpcRequest({ url, method: "eth_getCode", params: [EXCHANGE_SETTLEMENT_11520_CONFIG.implementation, blockTag], fetchImpl, signal, id: requestId + 3 }),
    settlementRpcRequest({ url, method: "eth_getCode", params: [EXCHANGE_SETTLEMENT_11520_CONFIG.bank, blockTag], fetchImpl, signal, id: requestId + 4 }),
    settlementRpcRequest({ url, method: "eth_getCode", params: [EXCHANGE_SETTLEMENT_11520_CONFIG.fixed_exchange, blockTag], fetchImpl, signal, id: requestId + 5 }),
    call(SETTLEMENT_11520_SELECTORS.version, 6),
    call(SETTLEMENT_11520_SELECTORS.bank, 7),
    call(SETTLEMENT_11520_SELECTORS.module_id, 8),
    call(SETTLEMENT_11520_SELECTORS.governance_finalized, 9),
    call(SETTLEMENT_11520_SELECTORS.fixed_exchange, 10),
    call(SETTLEMENT_11520_SELECTORS.total_settled, 11),
    call(settlementRoleCallData(EXCHANGE_SETTLEMENT_11520_CONFIG.governance_role, EXCHANGE_SETTLEMENT_11520_CONFIG.governance), 12)
  ]);
  if (!block || !/^0x[0-9a-f]{64}$/i.test(block.hash)) throw new Error("SETTLEMENT_11520_BLOCK_HASH_REQUIRED");
  if (settlementRpcHexQuantity(block.number, "block.number") !== blockNumber) throw new Error("SETTLEMENT_11520_BLOCK_MISMATCH");
  const implementation = settlementRpcAddress(implementationWord, "implementation slot");
  return Object.freeze({
    block_hash: block.hash.toLowerCase(),
    block_timestamp: settlementRpcHexQuantity(block.timestamp, "block.timestamp"),
    proxy_code_sha256: await settlementCodeSha256(proxyCode, "settlement proxy"),
    implementation,
    implementation_code_sha256: await settlementCodeSha256(implementationCode, "settlement implementation"),
    bank_code_sha256: await settlementCodeSha256(bankCode, "18888 bank"),
    fixed_exchange_code_sha256: await settlementCodeSha256(fixedExchangeCode, "fixed 11520 exchange"),
    version: settlementRpcString(version, "settlement version"),
    bank: settlementRpcAddress(bank, "settlement bank"),
    module_id: settlementRpcWord(moduleId, "settlement module ID"),
    governance_finalized: settlementRpcBoolean(governanceFinalized, "governance finalized"),
    fixed_exchange: settlementRpcAddress(fixedExchange, "fixed exchange"),
    total_settled_atomic: settlementRpcUint(totalSettled, "total settled"),
    governance_role_active: settlementRpcBoolean(governanceRole, "governance role")
  });
}

/**
 * Observe the already deployed ExchangeSettlement11520 proxy through two fixed
 * BSC RPC endpoints at one confirmed block. This is a read-only compatibility
 * probe: it cannot build calldata, request a signer, settle, fund or broadcast.
 */
export async function readExchangeSettlement11520SnapshotQuorum({
  rpcUrls = SETTLEMENT_11520_RPC_URLS,
  confirmations = 3,
  fetchImpl = repositoryBoundSettlement11520Fetch,
  timeoutMs = 15000
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("SETTLEMENT_11520_FETCH_REQUIRED");
  if (!Array.isArray(rpcUrls) || new Set(rpcUrls).size < 2) throw new Error("SETTLEMENT_11520_RPC_QUORUM_REQUIRED");
  if (!rpcUrls.every((url) => /^https:\/\//.test(String(url)))) throw new Error("SETTLEMENT_11520_RPC_HTTPS_REQUIRED");
  if (!Number.isInteger(confirmations) || confirmations < 1) throw new Error("SETTLEMENT_11520_CONFIRMATIONS_REQUIRED");
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) throw new Error("SETTLEMENT_11520_TIMEOUT_INVALID");
  const repositoryBoundTransport = fetchImpl === repositoryBoundSettlement11520Fetch
    && confirmations === 3
    && rpcUrls.length === SETTLEMENT_11520_RPC_URLS.length
    && rpcUrls.every((url, index) => url === SETTLEMENT_11520_RPC_URLS[index]);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const heads = await Promise.all(rpcUrls.map(async (url, index) => {
      const [chainIdHex, blockNumberHex] = await Promise.all([
        settlementRpcRequest({ url, method: "eth_chainId", params: [], fetchImpl, signal: controller.signal, id: index * 100 + 1 }),
        settlementRpcRequest({ url, method: "eth_blockNumber", params: [], fetchImpl, signal: controller.signal, id: index * 100 + 2 })
      ]);
      if (settlementRpcHexQuantity(chainIdHex, "chainId") !== EXCHANGE_SETTLEMENT_11520_CONFIG.chain_id) {
        throw new Error("SETTLEMENT_11520_WRONG_CHAIN");
      }
      return settlementRpcHexQuantity(blockNumberHex, "blockNumber");
    }));
    const blockNumber = Math.min(...heads) - confirmations;
    if (!Number.isSafeInteger(blockNumber) || blockNumber <= 0) throw new Error("SETTLEMENT_11520_CONFIRMED_BLOCK_INVALID");
    const observations = await Promise.all(rpcUrls.map((url, index) => observeSettlement11520AtBlock({
      url,
      blockNumber,
      fetchImpl,
      signal: controller.signal,
      requestId: index * 1000 + 10
    })));
    const expected = JSON.stringify(observations[0]);
    if (!observations.every((observation) => JSON.stringify(observation) === expected)) {
      throw new Error("SETTLEMENT_11520_RPC_QUORUM_MISMATCH");
    }
    const observed = observations[0];
    const snapshot = deepFreeze({
      observed_at: new Date(observed.block_timestamp * 1000).toISOString(),
      block_number: blockNumber,
      block_hash: observed.block_hash,
      chain_id: EXCHANGE_SETTLEMENT_11520_CONFIG.chain_id,
      provider_count: rpcUrls.length,
      confirmations,
      proxy: EXCHANGE_SETTLEMENT_11520_CONFIG.proxy,
      proxy_code_sha256: observed.proxy_code_sha256,
      implementation: observed.implementation,
      implementation_code_sha256: observed.implementation_code_sha256,
      bank: observed.bank,
      bank_code_sha256: observed.bank_code_sha256,
      fixed_exchange: observed.fixed_exchange,
      fixed_exchange_code_sha256: observed.fixed_exchange_code_sha256,
      module_id: observed.module_id,
      version: observed.version,
      governance_finalized: observed.governance_finalized,
      governance_role_active: observed.governance_role_active,
      total_settled_atomic: observed.total_settled_atomic,
      evidence_class: repositoryBoundTransport
        ? "RPC_QUORUM_VERIFIED_READ_ONLY"
        : "CALLER_SUPPLIED_TRANSPORT_SCHEMA_PROBE",
      transaction_payload: null,
      signer_requested: false,
      chain_write: false
    });
    if (repositoryBoundTransport) verifiedSettlement11520Snapshots.add(snapshot);
    return snapshot;
  } finally {
    clearTimeout(timer);
  }
}

export function evaluateExchangeSettlement11520Snapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") throw new TypeError("Settlement11520 snapshot is required");
  const repositoryVerified = verifiedSettlement11520Snapshots.has(snapshot);
  const runtimeIdentityVerified = verifyExchangeSettlement11520RuntimeCodeIdentity(snapshot);
  const checks = Object.freeze({
    repository_bound_rpc_quorum: repositoryVerified,
    chain_56: snapshot.chain_id === EXCHANGE_SETTLEMENT_11520_CONFIG.chain_id,
    proxy: canonicalText(snapshot.proxy).toLowerCase() === EXCHANGE_SETTLEMENT_11520_CONFIG.proxy.toLowerCase(),
    implementation: canonicalText(snapshot.implementation).toLowerCase() === EXCHANGE_SETTLEMENT_11520_CONFIG.implementation.toLowerCase(),
    bank_18888: canonicalText(snapshot.bank).toLowerCase() === EXCHANGE_SETTLEMENT_11520_CONFIG.bank.toLowerCase(),
    fixed_11520_brain: canonicalText(snapshot.fixed_exchange).toLowerCase() === EXCHANGE_SETTLEMENT_11520_CONFIG.fixed_exchange.toLowerCase(),
    module_id: canonicalText(snapshot.module_id).toLowerCase() === EXCHANGE_SETTLEMENT_11520_CONFIG.module_id.toLowerCase(),
    version: snapshot.version === EXCHANGE_SETTLEMENT_11520_CONFIG.version,
    governance_finalized: snapshot.governance_finalized === true,
    governance_role_active: snapshot.governance_role_active === true,
    code_evidence: [snapshot.proxy_code_sha256, snapshot.implementation_code_sha256, snapshot.bank_code_sha256, snapshot.fixed_exchange_code_sha256]
      .every((value) => /^0x[0-9a-f]{64}$/i.test(canonicalText(value))),
    proxy_code_identity: !repositoryVerified || canonicalText(snapshot.proxy_code_sha256).toLowerCase()
      === EXCHANGE_SETTLEMENT_11520_CONFIG.runtime_identity.proxy_runtime_sha256,
    implementation_code_identity: !repositoryVerified || canonicalText(snapshot.implementation_code_sha256).toLowerCase()
      === EXCHANGE_SETTLEMENT_11520_CONFIG.runtime_identity.implementation_runtime_sha256,
    total_settled_valid: /^\d+$/.test(String(snapshot.total_settled_atomic ?? ""))
  });
  const interfaceObserved = Object.values(checks).every(Boolean);
  const deployedRuntimeVerified = interfaceObserved && repositoryVerified && runtimeIdentityVerified;
  const blockers = deployedRuntimeVerified
    ? Object.freeze([])
    : Object.freeze(Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name.toUpperCase()));
  return deepFreeze({
    status: deployedRuntimeVerified
      ? "VERIFIED_HISTORICAL_V1_RUNTIME_IDENTITY"
      : "BLOCKED_SETTLEMENT_IDENTITY_OR_TRANSPORT_MISMATCH",
    checks,
    blockers,
    observed_at: snapshot.observed_at ?? null,
    block_number: snapshot.block_number ?? null,
    block_hash: repositoryVerified ? snapshot.block_hash : null,
    expected_runtime_code_hashes_repository_bound: true,
    runtime_code_identity_verified: deployedRuntimeVerified,
    deployed_capability: deployedRuntimeVerified ? EXCHANGE_SETTLEMENT_11520_CONFIG.deployed_capability : null,
    configured_capability_claim_unverified: deployedRuntimeVerified ? null : EXCHANGE_SETTLEMENT_11520_CONFIG.deployed_capability,
    total_settled_atomic: /^\d+$/.test(String(snapshot.total_settled_atomic ?? "")) ? String(snapshot.total_settled_atomic) : null,
    gpu_trade_compatibility: "INCOMPATIBLE_WITH_ATOMIC_GPU_TRADE_SETTLEMENT",
    incompatibilities: Object.freeze([
      "FIXED_BENEFICIARY_IS_11520_BRAIN_NOT_TRADE_SELLER",
      "KAIOS_ONLY_18888_MODULE_PAYMENT_NOT_BUYER_PAYMENT_RAIL",
      "NO_GPU_INVENTORY_CUSTODY_OR_ATOMIC_DELIVERY",
      "NO_BUYER_SELLER_ORDER_AUTHORITY_BINDING",
      "NO_KGEN_OR_KAIOS_DUAL_QUOTE_MARKET_SETTLEMENT",
      "NO_TRADE_RECEIPT_TO_INVENTORY_SERIAL_BINDING"
    ]),
    production_gpu_settlement_adapter_status: "NOT_IMPLEMENTED",
    company_budget_authorized: false,
    funding_ready: false,
    real_trade_enabled: false,
    transaction_payload: null,
    signer_requested: false,
    chain_write: false
  });
}

export function verifyExchangeSettlement11520RuntimeCodeIdentity(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return false;
  const identity = EXCHANGE_SETTLEMENT_11520_CONFIG.runtime_identity;
  return canonicalText(snapshot.proxy_code_sha256).toLowerCase() === identity.proxy_runtime_sha256
    && canonicalText(snapshot.implementation_code_sha256).toLowerCase() === identity.implementation_runtime_sha256;
}

const GPU_REAL_TRADE_GATE_ORDER = Object.freeze([
  "REPOSITORY_BOUND_GPU_EVIDENCE_VERIFIER_NOT_WIRED",
  "INDEPENDENT_EVIDENCE_BUNDLE_NOT_VERIFIED",
  "VERIFIED_GPU_INVENTORY_REQUIRED",
  "VERIFIED_GPU_OWNERSHIP_REQUIRED",
  "VERIFIED_GPU_CARGO_REQUIRED",
  "VERIFIED_K12345_TO_K11520_TRANSPORT_REQUIRED",
  "VERIFIED_K11520_WAREHOUSE_RECEIPT_REQUIRED",
  "FUNDED_TRADING_CAPITAL_REQUIRED",
  "PRODUCTION_MARKET_NOT_VERIFIED",
  "TRADING_POLICY_BOX_NOT_VERIFIED",
  "PRODUCTION_SETTLEMENT_NOT_VERIFIED",
  "SECURE_SIGNER_NOT_CONNECTED",
  "DISTINCT_T2_REVIEW_NOT_VERIFIED",
  "FORK_SIMULATION_NOT_VERIFIED"
]);

function canonicalText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function exactEvidence(value) {
  return /^[A-Za-z0-9][A-Za-z0-9:._-]{2,127}$/.test(canonicalText(value));
}

function positiveAtomic(value) {
  return /^\d+$/.test(String(value ?? "")) && BigInt(value) > 0n;
}

function exactObjectKeys(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new TypeError(`${label} must use the closed repository schema`);
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

const GPU_REPOSITORY_RECORD_KEYS = Object.freeze([
  "verification_status", "evidence_root", "observed_block", "inventory", "transport",
  "warehouse", "capital", "market", "policy_box", "settlement", "signer",
  "independent_review", "fork_simulation"
]);

function validateRepositoryGpuRecord(record) {
  exactObjectKeys(record, GPU_REPOSITORY_RECORD_KEYS, "GpuRepositoryEvidenceRecord");
  if (record.verification_status !== "VERIFIED") throw new TypeError("GPU repository record must be VERIFIED");
  if (!exactEvidence(record.evidence_root)) throw new TypeError("GPU repository evidence_root is invalid");
  if (!Number.isSafeInteger(record.observed_block) || record.observed_block <= 0) throw new TypeError("GPU repository observed_block is invalid");
  for (const field of GPU_REPOSITORY_RECORD_KEYS.slice(3)) {
    if (!record[field] || typeof record[field] !== "object" || Array.isArray(record[field])) {
      throw new TypeError(`GPU repository ${field} evidence is invalid`);
    }
  }
  return record;
}

function validateGpuEvidenceRegistry(registry) {
  exactObjectKeys(registry, [
    "schema_version", "registry_id", "mode", "company_address", "company_k_coordinate",
    "warehouse_id", "status", "records"
  ], "GpuEvidenceRegistry");
  if (registry.schema_version !== "1.0.0"
    || registry.registry_id !== "KAIOS_11520_GPU_REAL_EVIDENCE_REGISTRY_V1"
    || registry.mode !== "REPOSITORY_BOUND_CANDIDATE"
    || registry.company_address !== COMPANY_ADDRESS
    || registry.company_k_coordinate !== COMPANY_K_COORDINATE
    || registry.warehouse_id !== "0.00011520_K11520_GPU_BONDED_WAREHOUSE") {
    throw new TypeError("GPU evidence registry identity mismatch");
  }
  if (registry.status !== "NO_VERIFIED_REAL_GPU_INVENTORY") {
    throw new TypeError("GPU registry cannot claim verified authority before an external repository-bound verifier is wired");
  }
  if (!Array.isArray(registry.records) || registry.records.length !== 0) {
    throw new TypeError("GPU registry must remain empty until external evidence authority is independently verified");
  }
  return registry;
}

function validateTradingCapitalRegistry(registry) {
  exactObjectKeys(registry, [
    "schema_version", "registry_id", "mode", "company_id", "company_address", "status", "accounts"
  ], "TradingCapitalRegistry");
  if (registry.schema_version !== "1.0.0"
    || registry.registry_id !== "KAIOS_AI_COMPANY_TRADING_CAPITAL_REGISTRY_V1"
    || registry.mode !== "REPOSITORY_BOUND_CANDIDATE"
    || registry.company_id !== "KAIOS_AI_COMPANY"
    || registry.company_address !== COMPANY_ADDRESS) {
    throw new TypeError("Trading capital registry identity mismatch");
  }
  if (registry.status !== "NO_FUNDED_TRADING_CAPITAL") {
    throw new TypeError("Trading capital registry cannot claim funded authority before an external repository-bound verifier is wired");
  }
  if (!Array.isArray(registry.accounts) || registry.accounts.length !== 0) {
    throw new TypeError("Trading capital registry must remain empty until funding authority is independently verified");
  }
  return registry;
}

async function readFixedRepositoryJson(url, errorCode) {
  if (url.protocol === "file:") {
    const { readFile } = await import("node:fs/promises");
    return JSON.parse(await readFile(url, "utf8"));
  }
  if (!repositoryBoundGpuEvidenceFetch) throw new Error("GPU_EVIDENCE_REGISTRY_FETCH_UNAVAILABLE");
  const response = await repositoryBoundGpuEvidenceFetch(url, { cache: "no-store", credentials: "same-origin" });
  if (!response.ok) throw new Error(errorCode);
  return response.json();
}

/**
 * Read the fixed repository GPU evidence registry. Callers may select an
 * evidence root, but cannot substitute the path, parser, transport or data.
 * Empty canonical registries prove only that no verified real GPU inventory
 * or funded trading capital is presently recorded. These source readers are
 * not external evidence verifiers and cannot remove the repository-bound
 * verification-authority blocker.
 */
export async function readRepositoryBoundGpu11520Evidence({ evidenceRoot = null } = {}) {
  if (evidenceRoot !== null && !exactEvidence(evidenceRoot)) throw new TypeError("GPU evidenceRoot is invalid");
  const [registry, capitalRegistry] = await Promise.all([
    readFixedRepositoryJson(GPU_EVIDENCE_REGISTRY_URL, "GPU_EVIDENCE_REGISTRY_READ_FAILED").then(validateGpuEvidenceRegistry),
    readFixedRepositoryJson(GPU_TRADING_CAPITAL_REGISTRY_URL, "GPU_TRADING_CAPITAL_REGISTRY_READ_FAILED").then(validateTradingCapitalRegistry)
  ]);
  const record = evidenceRoot === null
    ? (registry.records.length === 1 ? registry.records[0] : null)
    : (registry.records.find((candidate) => candidate.evidence_root === evidenceRoot) ?? null);
  if (record) {
    const account = capitalRegistry.accounts.find((candidate) => candidate.account_id === record.capital.account_id);
    if (!account
      || account.asset !== record.capital.asset
      || account.available_atomic !== record.capital.available_atomic
      || account.status !== record.capital.status
      || account.authority_evidence_id !== record.capital.funding_receipt_id) {
      throw new TypeError("GPU evidence capital does not match the fixed trading-capital registry");
    }
  }
  const result = deepFreeze(record ? structuredClone(record) : {
    verification_status: "NO_VERIFIED_EVIDENCE",
    evidence_root: evidenceRoot,
    observed_block: null,
    registry_id: registry.registry_id,
    registry_status: registry.status,
    record_count: registry.records.length,
    company_address: registry.company_address,
    company_k_coordinate: registry.company_k_coordinate,
    warehouse_id: registry.warehouse_id,
    capital_registry_id: capitalRegistry.registry_id,
    capital_registry_status: capitalRegistry.status,
    funded_account_count: capitalRegistry.accounts.length,
    real_inventory_created: false,
    transaction_authority: false,
    chain_write: false
  });
  repositoryBoundGpuEvidenceBundles.add(result);
  return result;
}

/**
 * Read-only gate for a future real NVIDIA GPU trade at K11520.
 *
 * This evaluator deliberately has no provider, signer, allowance, transfer,
 * settlement or broadcast method. The injected verifier callback is a schema
 * probe only and is not repository-bound authority. Until a repository-bound
 * verifier is wired, every result remains BLOCKED_FAIL_CLOSED.
 */
export function evaluateGpu11520RealTradeReadiness({
  evidenceBundle,
  verifyEvidenceBundle,
  executorLifeId = "LIFE-CODEX-GM-0001",
  executorControllerId = "codex-gm-01"
} = {}) {
  const repositorySourceWired = repositoryBoundGpuEvidenceBundles.has(evidenceBundle);
  const repositoryVerifierWired = false;
  const blockers = ["REPOSITORY_BOUND_GPU_EVIDENCE_VERIFIER_NOT_WIRED"];
  let verified = null;
  if (typeof verifyEvidenceBundle === "function") {
    try {
      const candidate = verifyEvidenceBundle(evidenceBundle, Object.freeze({
        purpose: "GPU_11520_REAL_TRADE_READINESS",
        company_address: COMPANY_ADDRESS,
        company_k_coordinate: COMPANY_K_COORDINATE,
        route: "K12345_TO_K11520"
      }));
      if (candidate?.verification_status === "VERIFIED"
        && exactEvidence(candidate?.evidence_root)
        && Number.isSafeInteger(candidate?.observed_block)
        && candidate.observed_block > 0) {
        verified = candidate;
      }
    } catch {
      verified = null;
    }
  }
  if (!verified) blockers.push("INDEPENDENT_EVIDENCE_BUNDLE_NOT_VERIFIED");

  const inventory = verified?.inventory;
  const transport = verified?.transport;
  const warehouse = verified?.warehouse;
  const capital = verified?.capital;
  const market = verified?.market;
  const policyBox = verified?.policy_box;
  const settlement = verified?.settlement;
  const signer = verified?.signer;
  const independentReview = verified?.independent_review;
  const forkSimulation = verified?.fork_simulation;
  const quoteAsset = canonicalText(market?.quote_asset).toUpperCase();

  const inventoryVerified = inventory?.status === "VERIFIED_REAL_INVENTORY"
    && inventory?.asset_type === "NVIDIA_GPU_CHIP"
    && canonicalText(inventory?.manufacturer).toUpperCase() === "NVIDIA"
    && canonicalText(inventory?.model)
    && canonicalText(inventory?.serial_number)
    && exactEvidence(inventory?.supplier_evidence_id)
    && positiveAtomic(inventory?.acquisition_cost_atomic)
    && inventory?.paper_simulation === false;
  if (!inventoryVerified) blockers.push("VERIFIED_GPU_INVENTORY_REQUIRED");

  if (!(inventoryVerified
    && exactEvidence(inventory?.ownership_certificate_id)
    && canonicalText(inventory?.owner_life_or_company_id))) {
    blockers.push("VERIFIED_GPU_OWNERSHIP_REQUIRED");
  }

  if (!(inventoryVerified
    && exactEvidence(inventory?.cargo_receipt_id)
    && canonicalText(inventory?.cargo_serial_number) === canonicalText(inventory?.serial_number))) {
    blockers.push("VERIFIED_GPU_CARGO_REQUIRED");
  }

  const costFields = ["energy", "food", "labor", "insurance", "warehouse", "risk_reserve"];
  const transportVerified = transport?.status === "VERIFIED_DELIVERED"
    && transport?.origin === "K12345"
    && transport?.destination === "K11520"
    && transport?.distance_km === "18778.422548555"
    && canonicalText(transport?.vehicle_id)
    && positiveAtomic(transport?.payload_mass_grams)
    && exactEvidence(transport?.delivery_evidence_id)
    && costFields.every((field) => /^\d+$/.test(String(transport?.costs_atomic?.[field] ?? "")));
  if (!transportVerified) blockers.push("VERIFIED_K12345_TO_K11520_TRANSPORT_REQUIRED");

  const warehouseVerified = warehouse?.status === "VERIFIED_IN_CUSTODY"
    && warehouse?.location === "K11520"
    && canonicalText(warehouse?.serial_number) === canonicalText(inventory?.serial_number)
    && exactEvidence(warehouse?.receipt_id)
    && warehouse?.replay_protected === true;
  if (!warehouseVerified) blockers.push("VERIFIED_K11520_WAREHOUSE_RECEIPT_REQUIRED");

  const capitalVerified = capital?.status === "FUNDED_VERIFIED"
    && ["KGEN", "KAIOS"].includes(quoteAsset)
    && capital?.asset === quoteAsset
    && positiveAtomic(capital?.available_atomic)
    && positiveAtomic(capital?.required_atomic)
    && BigInt(capital.available_atomic) >= BigInt(capital.required_atomic)
    && exactEvidence(capital?.funding_receipt_id)
    && capital?.segregated_from_payroll === true
    && capital?.segregated_from_reserves === true;
  if (!capitalVerified) blockers.push("FUNDED_TRADING_CAPITAL_REQUIRED");

  const marketVerified = ["KGEN", "KAIOS"].includes(quoteAsset)
    && market?.market_id === `11520_NVIDIA_GPU_${quoteAsset}_MARKET`
    && market?.status === "ACTIVE_VERIFIED"
    && market?.asset_allowlisted === true
    && market?.route_allowlisted === true
    && market?.price_fresh === true
    && market?.oracle_disagreement_within_limit === true
    && exactEvidence(market?.registry_evidence_id);
  if (!marketVerified) blockers.push("PRODUCTION_MARKET_NOT_VERIFIED");

  const requiredPolicyFields = [
    "max_trade_amount_atomic", "max_hourly_exposure_atomic", "max_daily_exposure_atomic",
    "max_daily_loss_atomic", "max_slippage_bps", "gas_ceiling_wei",
    "minimum_expected_net_profit_atomic", "allowance_ceiling_atomic"
  ];
  const policyVerified = policyBox?.status === "VERIFIED_ACTIVE"
    && policyBox?.chain_id === 56
    && policyBox?.treasury_account_id === capital?.account_id
    && canonicalText(policyBox?.fixed_beneficiary)
    && exactEvidence(policyBox?.policy_id)
    && requiredPolicyFields.every((field) => /^\d+$/.test(String(policyBox?.[field] ?? "")))
    && policyBox?.emergency_pause === false
    && policyBox?.nonce_replay_protection === true
    && policyBox?.receipt_required === true;
  if (!policyVerified) blockers.push("TRADING_POLICY_BOX_NOT_VERIFIED");

  const settlementVerified = settlement?.status === "VERIFIED_PRODUCTION_ADAPTER"
    && settlement?.chain_id === 56
    && canonicalText(settlement?.beneficiary).toLowerCase() === canonicalText(policyBox?.fixed_beneficiary).toLowerCase()
    && settlement?.inventory_serial_number === inventory?.serial_number
    && settlement?.replay_protected === true
    && settlement?.atomic_delivery === true
    && exactEvidence(settlement?.adapter_evidence_id);
  if (!settlementVerified) blockers.push("PRODUCTION_SETTLEMENT_NOT_VERIFIED");

  const signerVerified = signer?.status === "CONNECTED_SECURE_RUNTIME"
    && signer?.chain_id === 56
    && /^0x[0-9a-fA-F]{40}$/.test(canonicalText(signer?.wallet_address))
    && signer?.wallet_address.toLowerCase() === canonicalText(policyBox?.fixed_beneficiary).toLowerCase()
    && signer?.private_key_exposed === false
    && signer?.raw_key_exportable === false
    && exactEvidence(signer?.connection_evidence_id);
  if (!signerVerified) blockers.push("SECURE_SIGNER_NOT_CONNECTED");

  const distinctReviewVerified = independentReview?.status === "PASS"
    && Number.isInteger(independentReview?.trust_level)
    && independentReview.trust_level >= 2
    && canonicalText(independentReview?.reviewer_life_id)
    && canonicalText(independentReview?.reviewer_controller_id)
    && canonicalText(independentReview.reviewer_life_id).toLowerCase() !== canonicalText(executorLifeId).toLowerCase()
    && canonicalText(independentReview.reviewer_controller_id).toLowerCase() !== canonicalText(executorControllerId).toLowerCase()
    && exactEvidence(independentReview?.exact_head_sha);
  if (!distinctReviewVerified) blockers.push("DISTINCT_T2_REVIEW_NOT_VERIFIED");

  const forkVerified = forkSimulation?.status === "PASS_NO_BROADCAST"
    && forkSimulation?.chain_id === 56
    && forkSimulation?.broadcast === false
    && forkSimulation?.atomic_rollback_tested === true
    && forkSimulation?.mass_and_accounting_conservation === true
    && exactEvidence(forkSimulation?.evidence_id);
  if (!forkVerified) blockers.push("FORK_SIMULATION_NOT_VERIFIED");

  const orderedBlockers = GPU_REAL_TRADE_GATE_ORDER.filter((code) => blockers.includes(code));
  return Object.freeze({
    company_address: COMPANY_ADDRESS,
    company_k_coordinate: COMPANY_K_COORDINATE,
    route: "K12345_TO_K11520",
    evidence_root: verified?.evidence_root ?? null,
    observed_block: verified?.observed_block ?? null,
    repository_source_status: repositorySourceWired ? "SOURCE_WIRED_SCHEMA_ONLY" : "SOURCE_NOT_WIRED",
    repository_verifier_status: repositoryVerifierWired ? "WIRED" : "NOT_WIRED",
    quote_asset: quoteAsset || null,
    status: orderedBlockers.length === 0
      ? "READY_FOR_SEPARATE_EXECUTION_REVIEW"
      : "BLOCKED_FAIL_CLOSED",
    blockers: Object.freeze(orderedBlockers),
    real_trade_enabled: false,
    transaction_payload: null,
    signer_requested: false,
    chain_write: false
  });
}
