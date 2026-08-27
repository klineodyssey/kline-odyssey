import assert from "node:assert/strict";
import test from "node:test";
import {
  createGpu11520PaperMarket,
  createKgenNativeMarketCell,
  evaluateGpu11520RealTradeReadiness,
  readRepositoryBoundGpu11520Evidence
} from "../K線西遊記/temples/11520/modules/kgen-native-market-cell.mjs";

const verifiedContexts = new WeakMap();
let nextEvidence = 1;

function actor(name, controller = `${name}-controller`, overrides = {}) {
  const context = Object.freeze({
    claimed_actor_id: overrides.claimed_actor_id ?? `claim:${name}`,
    claimed_controller_id: overrides.claimed_controller_id ?? `claim:${controller}`,
    opaque_nonce: nextEvidence
  });
  verifiedContexts.set(context, Object.freeze({
    actor_id: overrides.actor_id ?? `life:${name}`,
    controller_id: overrides.controller_id ?? `ctrl:${controller}`,
    authentication_status: overrides.authentication_status ?? "VERIFIED",
    authentication_method: overrides.authentication_method ?? "TEST_IDENTITY_REGISTRY",
    evidence_id: overrides.evidence_id ?? `ACTOR-EVIDENCE-${nextEvidence++}`,
    issued_at: overrides.issued_at ?? "2026-08-22T14:00:00.000Z",
    expires_at: overrides.expires_at ?? null,
    session_id: overrides.session_id ?? `SESSION-${name}-${nextEvidence}`
  }));
  return context;
}

function verifyActorContext(context) {
  const verified = verifiedContexts.get(context);
  if (!verified) throw new Error("UNTRUSTED_ACTOR_CONTEXT");
  return verified;
}

function createMarket(options = {}) {
  return createKgenNativeMarketCell({
    verifyActorContext,
    tickSize: "0.00000001",
    lotSize: "0.00000001",
    ...options
  });
}

test("11520 fixed KGEN price coordinate and Company address never seed matched-trade CT", () => {
  const market = createMarket({ marketCellCoordinate: "0.99999999" });
  const state = market.getMarketState();
  assert.equal(state.marketCellCoordinate, "0.00011520");
  assert.equal(state.marketCellCoordinateRole, "KGEN_UNIVERSE_PRICE_AND_COMPANY_ADDRESS");
  assert.equal(state.companyAddress, "0.00011520");
  assert.equal(state.companyKCoordinate, "K11520");
  assert.equal(state.kgenUniversePriceCoordinate, "0.00011520");
  assert.equal(state.kgenUniversePriceCoordinateUnit, "USD_PER_KGEN");
  assert.equal(state.runtimeStatus, "PAPER_IN_MEMORY_CANDIDATE_NOT_ACTIVE_RUNTIME");
  assert.equal(state.ct, null);
  assert.equal(state.nativeMatchedTradeCT, null);
  assert.equal(state.externalReferencePriceAuthority, false);
});

test("quote unit is explicit and remains candidate until frozen", () => {
  const state = createMarket().getMarketState();
  assert.equal(state.baseAsset, "KGEN");
  assert.equal(state.baseDecimals, 18);
  assert.equal(state.quoteAsset, "UNFROZEN_11520_NATIVE_QUOTE_CANDIDATE");
  assert.equal(state.quoteStatus, "UNFROZEN_CANDIDATE");
  assert.equal(state.quoteDecimals, 18);
  assert.equal(state.tickSize, "0.00000001");
  assert.equal(state.lotSize, "0.00000001");
  assert.equal(state.priceStatus, "NATIVE_MARKET_PRICE_CANDIDATE");
});

test("unmatched BUY/SELL quotes do not create CT", () => {
  let now = Date.parse("2026-08-22T15:00:00.000Z");
  const market = createMarket({ clock: () => now });
  market.placeOrder({ side: "BUY", price: "0.00047", quantity: "100", actorContext: actor("buyer") });
  now += 1;
  market.placeOrder({ side: "SELL", price: "0.00049", quantity: "100", actorContext: actor("seller") });
  const state = market.getMarketState();
  assert.equal(state.bestBid, "0.00047");
  assert.equal(state.bestAsk, "0.00049");
  assert.equal(state.ct, null);
  assert.equal(state.tradeCount, 0);
});

test("crossed market creates trade and CT at resting maker price", () => {
  let now = Date.parse("2026-08-22T15:01:00.000Z");
  const market = createMarket({ clock: () => now });

  market.placeOrder({ side: "SELL", price: "0.00048", quantity: "100", actorContext: actor("seller") });
  now += 1;
  const result = market.placeOrder({ side: "BUY", price: "0.00050", quantity: "40", actorContext: actor("buyer") });

  assert.equal(result.fills.length, 1);
  assert.equal(result.fills[0].price, "0.00048");
  assert.equal(result.fills[0].quantity, "40");
  assert.equal(market.getMarketState().ct, "0.00048");
  assert.equal(market.getMarketState().nativeMatchedTradeCT, "0.00048");
  assert.equal(market.getMarketState().tradeCount, 1);
  assert.equal(market.getOrderBook().asks[0].remaining, "60");
});

test("same owner self-match fails closed without CT or volume", () => {
  const market = createMarket();
  market.placeOrder({ side: "SELL", price: "1", quantity: "1", actorContext: actor("same", "seller-control") });
  assert.throws(
    () => market.placeOrder({ side: "BUY", price: "1", quantity: "1", actorContext: actor("same", "buyer-control") }),
    /SELF_MATCH_FORBIDDEN_SAME_OWNER/
  );
  assert.equal(market.getMarketState().ct, null);
  assert.equal(market.getMarketState().tradeCount, 0);
  assert.equal(market.getOrderBook().asks[0].remaining, "1");
});

test("same controller across different owners fails closed", () => {
  const market = createMarket();
  market.placeOrder({ side: "SELL", price: "1", quantity: "1", actorContext: actor("alice", "shared") });
  assert.throws(
    () => market.placeOrder({ side: "BUY", price: "1", quantity: "1", actorContext: actor("bob", "shared") }),
    /SELF_MATCH_FORBIDDEN_SAME_CONTROLLER/
  );
  assert.equal(market.getMarketState().ct, null);
  assert.equal(market.getMarketState().tradeCount, 0);
});

test("unauthenticated forged or unknown actor contexts are forbidden", () => {
  const market = createMarket();
  const issued = actor("alice");
  assert.throws(() => market.placeOrder({ side: "BUY", price: "1", quantity: "1", actorContext: { ...issued } }), /ACTOR_CONTEXT_VERIFICATION_FAILED/);
  assert.throws(() => market.placeOrder({ side: "BUY", price: "1", quantity: "1", owner: "life:alice", controller: "ctrl:alice" }), /ACTOR_CONTEXT_VERIFICATION_FAILED/);
  const unknownMarket = createMarket({ verifyActorContext: () => ({ authentication_status: "UNKNOWN" }) });
  assert.throws(() => unknownMarket.placeOrder({ side: "BUY", price: "1", quantity: "1", actorContext: {} }), /ACTOR_CONTEXT_NOT_VERIFIED/);
});

test("verified actor identifiers normalize before collision checks and ignore claimed labels", () => {
  const market = createMarket();
  market.placeOrder({
    side: "SELL",
    price: "1",
    quantity: "1",
    actorContext: actor("seller-label", "one", { actor_id: " LIFE:ALICE ", claimed_actor_id: "claim:seller" })
  });
  assert.throws(
    () => market.placeOrder({
      side: "BUY",
      price: "1",
      quantity: "1",
      actorContext: actor("buyer-label", "two", { actor_id: "life:alice", claimed_actor_id: "claim:buyer" })
    }),
    /SELF_MATCH_FORBIDDEN_SAME_OWNER/
  );
});

test("price-time priority uses best price then oldest order", () => {
  let now = Date.parse("2026-08-22T15:02:00.000Z");
  const market = createMarket({ clock: () => now });

  market.placeOrder({ side: "SELL", price: "0.00049", quantity: "10", actorContext: actor("late-price") });
  now += 1;
  market.placeOrder({ side: "SELL", price: "0.00048", quantity: "10", actorContext: actor("first-best") });
  now += 1;
  market.placeOrder({ side: "SELL", price: "0.00048", quantity: "10", actorContext: actor("second-best") });
  now += 1;
  const fill = market.placeOrder({ side: "BUY", price: "0.00050", quantity: "15", actorContext: actor("buyer") });

  assert.equal(fill.fills.length, 2);
  assert.equal(fill.fills[0].makerOrderId, "O2");
  assert.equal(fill.fills[0].price, "0.00048");
  assert.equal(fill.fills[0].quantity, "10");
  assert.equal(fill.fills[1].makerOrderId, "O3");
  assert.equal(fill.fills[1].price, "0.00048");
  assert.equal(fill.fills[1].quantity, "5");
});

test("OHLC is derived only from native matched trades", () => {
  let now = Date.parse("2026-08-22T15:03:00.000Z");
  const market = createMarket({ clock: () => now, candleIntervalMs: 60_000 });

  market.placeOrder({ side: "SELL", price: "0.00048", quantity: "10", actorContext: actor("s1") });
  now += 1;
  market.placeOrder({ side: "BUY", price: "0.00048", quantity: "10", actorContext: actor("b1") });

  now += 10_000;
  market.placeOrder({ side: "BUY", price: "0.00050", quantity: "10", actorContext: actor("b2") });
  now += 1;
  market.placeOrder({ side: "SELL", price: "0.00050", quantity: "10", actorContext: actor("s2") });

  now += 10_000;
  market.placeOrder({ side: "SELL", price: "0.00047", quantity: "10", actorContext: actor("s3") });
  now += 1;
  market.placeOrder({ side: "BUY", price: "0.00047", quantity: "10", actorContext: actor("b3") });

  const [candle] = market.getCandles();
  assert.deepEqual(candle, {
    startTime: "2026-08-22T15:03:00.000Z",
    endTime: "2026-08-22T15:04:00.000Z",
    open: "0.00048",
    high: "0.0005",
    low: "0.00047",
    close: "0.00047",
    volume: "30",
    trades: 3
  });
  assert.equal(market.getMarketState().ct, "0.00047");
});

test("cancellation requires a verified actor context, not known identity strings", () => {
  const market = createMarket();
  const auth = actor("buyer");
  const placed = market.placeOrder({ side: "BUY", price: "0.00045", quantity: "5", actorContext: auth });
  assert.throws(() => market.cancelOrder(placed.order.id), /ACTOR_CONTEXT_VERIFICATION_FAILED/);
  assert.throws(() => market.cancelOrder(placed.order.id, { owner: placed.order.owner, controller: placed.order.controller }), /ACTOR_CONTEXT_VERIFICATION_FAILED/);
  assert.throws(() => market.cancelOrder(placed.order.id, actor("attacker")), /CANCEL_AUTHORIZATION_FAILED/);
  assert.equal(market.cancelOrder(placed.order.id, auth)?.remaining, "5");
  assert.equal(market.getOrderBook().bestBid, null);
  assert.equal(market.getMarketState().ct, null);
});

test("tick size and lot size reject misaligned orders", () => {
  const market = createMarket({ tickSize: "0.01", lotSize: "0.1" });
  assert.throws(() => market.placeOrder({ side: "BUY", price: "1.001", quantity: "1", actorContext: actor("buyer") }), /tickSize/);
  assert.throws(() => market.placeOrder({ side: "BUY", price: "1.00", quantity: "1.01", actorContext: actor("buyer2") }), /lotSize/);
});

test("expired actor context is rejected before order placement", () => {
  const market = createMarket({ clock: () => Date.parse("2026-08-22T15:00:00.000Z") });
  const expired = actor("expired", undefined, { expires_at: "2026-08-22T14:59:59.999Z" });
  assert.throws(() => market.placeOrder({ side: "BUY", price: "1", quantity: "1", actorContext: expired }), /ACTOR_CONTEXT_EXPIRED/);
  assert.equal(market.getMarketState().ct, null);
  assert.equal(market.getMarketState().tradeCount, 0);
});

test("caller cannot freeze quote status or emit formal native market price", () => {
  const market = createMarket({ quoteStatus: "FROZEN", quoteAsset: "FAKE_QUOTE" });
  const state = market.getMarketState();
  assert.equal(state.quoteStatus, "UNFROZEN_CANDIDATE");
  assert.equal(state.quoteAsset, "UNFROZEN_11520_NATIVE_QUOTE_CANDIDATE");
  assert.equal(state.priceStatus, "NATIVE_MARKET_PRICE_CANDIDATE");
  assert.notEqual(state.priceStatus, "NATIVE_MARKET_PRICE");
});

test("failed forged crossing cannot change CT volume or resting liquidity", () => {
  const market = createMarket();
  market.placeOrder({ side: "SELL", price: "1", quantity: "2", actorContext: actor("seller") });
  assert.throws(
    () => market.placeOrder({
      side: "BUY",
      price: "1",
      quantity: "2",
      actorContext: { claimed_actor_id: "life:forged", claimed_controller_id: "ctrl:forged" }
    }),
    /ACTOR_CONTEXT_VERIFICATION_FAILED/
  );
  assert.equal(market.getMarketState().ct, null);
  assert.equal(market.getMarketState().tradeCount, 0);
  assert.equal(market.getCandles().length, 0);
  assert.equal(market.getOrderBook().asks[0].remaining, "2");
});

test("GPU/KGEN and GPU/KAIOS are isolated paper books with independent CT", () => {
  const kgen = createGpu11520PaperMarket({ quoteAsset: "KGEN", verifyActorContext });
  const kaios = createGpu11520PaperMarket({ quoteAsset: "KAIOS", verifyActorContext });
  assert.equal(kgen.getMarketState().companyAddress, "0.00011520");
  assert.equal(kgen.getMarketState().baseAsset, "NVIDIA_GPU_CHIP");
  assert.equal(kgen.getMarketState().baseDecimals, 0);
  assert.equal(kgen.getMarketState().quoteAsset, "KGEN");
  assert.equal(kgen.getMarketState().ct, null);
  assert.equal(kaios.getMarketState().quoteAsset, "KAIOS");

  kgen.placeOrder({ side: "SELL", price: "88000", quantity: "1", actorContext: actor("gpu-seller") });
  kgen.placeOrder({ side: "BUY", price: "88000", quantity: "1", actorContext: actor("gpu-buyer") });
  assert.equal(kgen.getMarketState().ct, "88000");
  assert.equal(kgen.getMarketState().tradeCount, 1);
  assert.equal(kaios.getMarketState().ct, null);
  assert.equal(kaios.getMarketState().tradeCount, 0);
});

test("GPU paper market rejects unsupported quote assets and fractional chips", () => {
  assert.throws(() => createGpu11520PaperMarket({ quoteAsset: "BNB", verifyActorContext }), /GPU_QUOTE_ASSET_NOT_ALLOWED/);
  const market = createGpu11520PaperMarket({ quoteAsset: "KAIOS", verifyActorContext });
  assert.throws(() => market.placeOrder({ side: "BUY", price: "1000", quantity: "0.5", actorContext: actor("fractional-buyer") }), /lotSize/);
  assert.equal(market.getMarketState().ct, null);
});

function completeGpuReadinessEvidence() {
  const wallet = "0x4DF6E9629Dad1072103cFd2bC81845fd97429214";
  return {
    verification_status: "VERIFIED",
    evidence_root: "GPU-READINESS-EVIDENCE-ROOT-0001",
    observed_block: 118374460,
    inventory: {
      status: "VERIFIED_REAL_INVENTORY",
      asset_type: "NVIDIA_GPU_CHIP",
      manufacturer: "NVIDIA",
      model: "VERIFIED_MODEL",
      serial_number: "GPU-SERIAL-0001",
      supplier_evidence_id: "SUPPLIER-EVIDENCE-0001",
      acquisition_cost_atomic: "88000000000000000000000",
      ownership_certificate_id: "OWNERSHIP-CERTIFICATE-0001",
      owner_life_or_company_id: "KAIOS_AI_COMPANY",
      cargo_receipt_id: "CARGO-RECEIPT-0001",
      cargo_serial_number: "GPU-SERIAL-0001",
      paper_simulation: false
    },
    transport: {
      status: "VERIFIED_DELIVERED",
      origin: "K12345",
      destination: "K11520",
      distance_km: "18778.422548555",
      vehicle_id: "VEHICLE-VERIFIED-0001",
      payload_mass_grams: "1500",
      delivery_evidence_id: "DELIVERY-EVIDENCE-0001",
      costs_atomic: {
        energy: "1",
        food: "1",
        labor: "1",
        insurance: "1",
        warehouse: "1",
        risk_reserve: "1"
      }
    },
    warehouse: {
      status: "VERIFIED_IN_CUSTODY",
      location: "K11520",
      serial_number: "GPU-SERIAL-0001",
      receipt_id: "WAREHOUSE-RECEIPT-0001",
      replay_protected: true
    },
    capital: {
      account_id: "TRADING-CAPITAL-ACCOUNT-0001",
      status: "FUNDED_VERIFIED",
      asset: "KGEN",
      available_atomic: "100000000000000000000000",
      required_atomic: "88000000000000000000000",
      funding_receipt_id: "FUNDING-RECEIPT-0001",
      segregated_from_payroll: true,
      segregated_from_reserves: true
    },
    market: {
      market_id: "11520_NVIDIA_GPU_KGEN_MARKET",
      quote_asset: "KGEN",
      status: "ACTIVE_VERIFIED",
      asset_allowlisted: true,
      route_allowlisted: true,
      price_fresh: true,
      oracle_disagreement_within_limit: true,
      registry_evidence_id: "MARKET-REGISTRY-EVIDENCE-0001"
    },
    policy_box: {
      status: "VERIFIED_ACTIVE",
      chain_id: 56,
      treasury_account_id: "TRADING-CAPITAL-ACCOUNT-0001",
      fixed_beneficiary: wallet,
      policy_id: "GPU-TRADING-POLICY-0001",
      max_trade_amount_atomic: "100000000000000000000000",
      max_hourly_exposure_atomic: "100000000000000000000000",
      max_daily_exposure_atomic: "100000000000000000000000",
      max_daily_loss_atomic: "1000000000000000000000",
      max_slippage_bps: "50",
      gas_ceiling_wei: "300000000000000",
      minimum_expected_net_profit_atomic: "1",
      allowance_ceiling_atomic: "88000000000000000000000",
      emergency_pause: false,
      nonce_replay_protection: true,
      receipt_required: true
    },
    settlement: {
      status: "VERIFIED_PRODUCTION_ADAPTER",
      chain_id: 56,
      beneficiary: wallet,
      inventory_serial_number: "GPU-SERIAL-0001",
      replay_protected: true,
      atomic_delivery: true,
      adapter_evidence_id: "SETTLEMENT-ADAPTER-EVIDENCE-0001"
    },
    signer: {
      status: "CONNECTED_SECURE_RUNTIME",
      chain_id: 56,
      wallet_address: wallet,
      private_key_exposed: false,
      raw_key_exportable: false,
      connection_evidence_id: "SIGNER-CONNECTION-EVIDENCE-0001"
    },
    independent_review: {
      status: "PASS",
      trust_level: 2,
      reviewer_life_id: "LIFE-INDEPENDENT-REVIEWER-0001",
      reviewer_controller_id: "independent-reviewer-01",
      exact_head_sha: "1234567890abcdef1234567890abcdef12345678"
    },
    fork_simulation: {
      status: "PASS_NO_BROADCAST",
      chain_id: 56,
      broadcast: false,
      atomic_rollback_tested: true,
      mass_and_accounting_conservation: true,
      evidence_id: "FORK-SIMULATION-EVIDENCE-0001"
    }
  };
}

const verifiedReadinessBundles = new WeakMap();
let nextReadinessBundle = 1;

function verifiedGpuReadinessInput(mutate) {
  const verified = completeGpuReadinessEvidence();
  if (typeof mutate === "function") mutate(verified);
  const evidenceBundle = Object.freeze({ opaque_nonce: nextReadinessBundle++ });
  verifiedReadinessBundles.set(evidenceBundle, verified);
  return {
    evidenceBundle,
    verifyEvidenceBundle(candidate) {
      const resolved = verifiedReadinessBundles.get(candidate);
      if (!resolved) throw new Error("UNTRUSTED_GPU_READINESS_EVIDENCE");
      return resolved;
    }
  };
}

test("GPU real-trade gate fails closed with the complete ordered blocker set", () => {
  const result = evaluateGpu11520RealTradeReadiness();
  assert.equal(result.status, "BLOCKED_FAIL_CLOSED");
  assert.deepEqual(result.blockers, [
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
  assert.equal(result.real_trade_enabled, false);
  assert.equal(result.transaction_payload, null);
  assert.equal(result.signer_requested, false);
  assert.equal(result.chain_write, false);
});

test("repository GPU and capital sources are wired but verification authority remains unwired", async () => {
  const evidence = await readRepositoryBoundGpu11520Evidence();
  assert.equal(evidence.verification_status, "NO_VERIFIED_EVIDENCE");
  assert.equal(evidence.registry_status, "NO_VERIFIED_REAL_GPU_INVENTORY");
  assert.equal(evidence.record_count, 0);
  assert.equal(evidence.capital_registry_status, "NO_FUNDED_TRADING_CAPITAL");
  assert.equal(evidence.funded_account_count, 0);
  assert.equal(evidence.real_inventory_created, false);
  assert.equal(evidence.transaction_authority, false);
  assert.equal(evidence.chain_write, false);

  const result = evaluateGpu11520RealTradeReadiness({ evidenceBundle: evidence });
  assert.equal(result.repository_source_status, "SOURCE_WIRED_SCHEMA_ONLY");
  assert.equal(result.repository_verifier_status, "NOT_WIRED");
  assert.ok(result.blockers.includes("REPOSITORY_BOUND_GPU_EVIDENCE_VERIFIER_NOT_WIRED"));
  assert.ok(result.blockers.includes("INDEPENDENT_EVIDENCE_BUNDLE_NOT_VERIFIED"));
  assert.ok(result.blockers.includes("VERIFIED_GPU_INVENTORY_REQUIRED"));
  assert.equal(result.status, "BLOCKED_FAIL_CLOSED");
  assert.equal(result.real_trade_enabled, false);
});

test("copying repository GPU evidence loses source identity", async () => {
  const evidence = await readRepositoryBoundGpu11520Evidence();
  const copied = structuredClone(evidence);
  const result = evaluateGpu11520RealTradeReadiness({ evidenceBundle: copied });
  assert.equal(result.repository_source_status, "SOURCE_NOT_WIRED");
  assert.equal(result.repository_verifier_status, "NOT_WIRED");
  assert.ok(result.blockers.includes("REPOSITORY_BOUND_GPU_EVIDENCE_VERIFIER_NOT_WIRED"));
  assert.equal(result.real_trade_enabled, false);
});

test("complete hypothetical GPU evidence remains blocked without a repository-bound verifier", () => {
  const result = evaluateGpu11520RealTradeReadiness(verifiedGpuReadinessInput());
  assert.equal(result.status, "BLOCKED_FAIL_CLOSED");
  assert.deepEqual(result.blockers, ["REPOSITORY_BOUND_GPU_EVIDENCE_VERIFIER_NOT_WIRED"]);
  assert.equal(result.company_address, "0.00011520");
  assert.equal(result.route, "K12345_TO_K11520");
  assert.equal(result.quote_asset, "KGEN");
  assert.equal(result.evidence_root, "GPU-READINESS-EVIDENCE-ROOT-0001");
  assert.equal(result.observed_block, 118374460);
  assert.equal(result.real_trade_enabled, false);
  assert.equal(result.transaction_payload, null);
  assert.equal(result.signer_requested, false);
  assert.equal(result.chain_write, false);
});

test("GPU readiness rejects unsegregated capital, replayable warehouse and incomplete cost", () => {
  const input = verifiedGpuReadinessInput((evidence) => {
    evidence.capital.segregated_from_payroll = false;
    evidence.warehouse.replay_protected = false;
    delete evidence.transport.costs_atomic.food;
  });
  const result = evaluateGpu11520RealTradeReadiness(input);
  assert.ok(result.blockers.includes("FUNDED_TRADING_CAPITAL_REQUIRED"));
  assert.ok(result.blockers.includes("VERIFIED_K11520_WAREHOUSE_RECEIPT_REQUIRED"));
  assert.ok(result.blockers.includes("VERIFIED_K12345_TO_K11520_TRANSPORT_REQUIRED"));
});

test("GPU readiness rejects wrong signer, self-review and broadcasting fork evidence", () => {
  const input = verifiedGpuReadinessInput((evidence) => {
    evidence.signer.wallet_address = "0x0000000000000000000000000000000000000001";
    evidence.independent_review.reviewer_life_id = "life-codex-gm-0001";
    evidence.fork_simulation.broadcast = true;
  });
  const result = evaluateGpu11520RealTradeReadiness(input);
  assert.ok(result.blockers.includes("SECURE_SIGNER_NOT_CONNECTED"));
  assert.ok(result.blockers.includes("DISTINCT_T2_REVIEW_NOT_VERIFIED"));
  assert.ok(result.blockers.includes("FORK_SIMULATION_NOT_VERIFIED"));
});

test("paper market state can never satisfy the production GPU market gate", () => {
  const paper = createGpu11520PaperMarket({ quoteAsset: "KGEN", verifyActorContext }).getMarketState();
  const input = verifiedGpuReadinessInput((evidence) => {
    evidence.market = {
      market_id: paper.marketId,
      quote_asset: paper.quoteAsset,
      status: paper.runtimeStatus,
      asset_allowlisted: true,
      route_allowlisted: true,
      price_fresh: true,
      oracle_disagreement_within_limit: true,
      registry_evidence_id: "PAPER-MARKET-EVIDENCE-0001"
    };
  });
  const result = evaluateGpu11520RealTradeReadiness(input);
  assert.ok(result.blockers.includes("PRODUCTION_MARKET_NOT_VERIFIED"));
  assert.equal(result.real_trade_enabled, false);
});

test("caller-asserted VERIFIED fields cannot bypass the independent evidence verifier", () => {
  const forged = completeGpuReadinessEvidence();
  const result = evaluateGpu11520RealTradeReadiness(forged);
  assert.ok(result.blockers.includes("INDEPENDENT_EVIDENCE_BUNDLE_NOT_VERIFIED"));
  assert.equal(result.status, "BLOCKED_FAIL_CLOSED");
  assert.equal(result.real_trade_enabled, false);
});
