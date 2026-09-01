import { invariant } from "../shared/errors.mjs";
import { validateOrder, verify11520ActorContext, UNIVERSAL_11520_MARKET } from "../market/index.mjs";
import { assertRightsOfferAllowed } from "../permissions/index.mjs";

export async function settleOrder({ store, order, asset, life = null, evidence }) {
  validateOrder(order);
  invariant(evidence?.tx_hash && /^0x[0-9a-fA-F]{64}$/.test(evidence.tx_hash), "VERIFIED_SETTLEMENT_REQUIRED", "Settlement requires a verified transaction hash");
  invariant(order.status === "PENDING", "ORDER_NOT_PENDING", "Only a pending order can settle");
  invariant(asset.owner_id === order.seller_id || asset.controller_id === order.seller_id, "SETTLEMENT_PERMISSION_DENIED", "Seller does not control the settled asset");
  assertRightsOfferAllowed(asset, order.rights_transferred);
  const settledAt = evidence.settled_at ?? new Date().toISOString();
  const settledOrder = { ...order, status: "SETTLED", settled_at: settledAt, tx_hash: evidence.tx_hash };
  const nextAsset = order.rights_transferred.includes("ownership_right") ? { ...asset, owner_id: order.buyer_id, controller_id: order.buyer_id, updated_at: settledAt } : asset;
  const operations = [
    { domain: "ORDER", stream: "MARKET", id: order.order_id, entity: settledOrder, event_type: "ORDER_SETTLED", actor_id: order.buyer_id, payload: { order: settledOrder }, tx_hash: evidence.tx_hash },
    { domain: "ASSET", stream: "ASSET", id: asset.asset_id, entity: nextAsset, event_type: "ASSET_RIGHTS_TRANSFERRED", actor_id: order.seller_id, payload: { rights: order.rights_transferred, buyer_id: order.buyer_id }, tx_hash: evidence.tx_hash }
  ];
  if (life) operations.push({ domain: "LIFE", stream: "LIFE", id: life.life_id, entity: life, event_type: "LIFE_MARKET_SETTLEMENT_RECORDED", actor_id: order.buyer_id, payload: { order_id: order.order_id, asset_id: asset.asset_id }, tx_hash: evidence.tx_hash });
  await store.commitBatch(operations);
  return { order: settledOrder, asset: nextAsset };
}

export function notDeployedSettlement() {
  return Object.freeze({ status: "NOT_DEPLOYED", reason: "No verified settlement adapter is deployed." });
}

function atomic(value, field) {
  invariant(/^\d+$/.test(String(value)), "INVALID_SETTLEMENT_AMOUNT", `${field} must be an unsigned integer atomic amount`);
  return BigInt(value);
}

export function create11520EscrowCandidate({ listingCandidate, buyerActorContext, verifyActorContext, observedAt, amountAtomic }) {
  invariant(listingCandidate?.status === "READY_FOR_DISTINCT_LISTING_REVIEW", "LISTING_CANDIDATE_REQUIRED", "Escrow planning requires a reviewed-ready listing candidate");
  const buyer = verify11520ActorContext({ actorContext: buyerActorContext, verifyActorContext, purpose: "CREATE_ESCROW_CANDIDATE", observedAt });
  const seller = listingCandidate.seller_authority;
  invariant(buyer.actor_id !== seller.actor_id, "SELF_MATCH_FORBIDDEN", "Buyer and seller actor cannot match");
  invariant(buyer.controller_id !== seller.controller_id, "SAME_CONTROLLER_MATCH_FORBIDDEN", "Buyer and seller controller cannot match");
  const amount = atomic(amountAtomic, "escrow amount");
  invariant(amount === BigInt(listingCandidate.total_ask_atomic), "ESCROW_AMOUNT_MISMATCH", "Escrow amount must exactly match the listing total");
  return Object.freeze({
    escrow_id: `ESCROW_${listingCandidate.listing.listing_id}_${buyer.actor_id}`,
    listing_id: listingCandidate.listing.listing_id,
    market_id: UNIVERSAL_11520_MARKET.market_id,
    buyer_authority: buyer,
    seller_actor_id: seller.actor_id,
    beneficiary: seller.actor_id,
    asset_id: listingCandidate.asset_id,
    currency_id: listingCandidate.quote_currency,
    amount_atomic: amount.toString(),
    status: "UNFUNDED_MODEL_ONLY",
    settlement_adapter: "NOT_DEPLOYED",
    unsigned_payload: null,
    allowance_requested: false,
    custody_received: false,
    mainnet_transaction_sent: false
  });
}

export const GPU_ATOMIC_SETTLEMENT_11520_REQUIREMENTS = Object.freeze({
  chain_id: 56,
  market_id: UNIVERSAL_11520_MARKET.market_id,
  warehouse_id: "0.00011520_K11520_GPU_BONDED_WAREHOUSE",
  allowed_quote_currencies: Object.freeze(["KGEN", "KAIOS"]),
  atomic_actions: Object.freeze([
    "COLLECT_EXACT_BUYER_PAYMENT",
    "LOCK_EXACT_GPU_WAREHOUSE_UNIT",
    "PAY_FIXED_SELLER_BENEFICIARY",
    "TRANSFER_EXACT_GPU_OWNERSHIP_AND_CUSTODY_TO_BUYER",
    "EMIT_SINGLE_BINDING_SETTLEMENT_RECEIPT"
  ]),
  deployed_v1_status: "INCOMPATIBLE_WITH_ATOMIC_GPU_TRADE_SETTLEMENT",
  production_adapter_status: "NOT_IMPLEMENTED"
});

/**
 * Builds the complete immutable binding envelope a future 11520 GPU settlement
 * adapter must consume. This is deliberately not a transaction builder: the
 * deployed V1 adapter cannot settle a buyer-to-seller physical GPU trade, and
 * no repository-bound warehouse/capital/signer connector exists yet.
 */
export function create11520GpuAtomicSettlementCandidate({
  listingCandidate,
  buyerActorContext,
  verifyActorContext,
  observedAt,
  expiresAt,
  tradeNonce,
  consumedTradeNonces = []
}) {
  invariant(listingCandidate?.market_id === UNIVERSAL_11520_MARKET.market_id, "GPU_SETTLEMENT_MARKET_MISMATCH", "GPU settlement must use the canonical K11520 market");
  invariant(listingCandidate?.asset_type === "EQUIPMENT", "GPU_SETTLEMENT_ASSET_TYPE_INVALID", "GPU settlement requires a physical equipment listing");
  invariant(GPU_ATOMIC_SETTLEMENT_11520_REQUIREMENTS.allowed_quote_currencies.includes(listingCandidate.quote_currency), "GPU_SETTLEMENT_CURRENCY_FORBIDDEN", "GPU settlement quote currency must be KGEN or KAIOS");
  invariant(listingCandidate.warehouse_receipt?.warehouse_id === GPU_ATOMIC_SETTLEMENT_11520_REQUIREMENTS.warehouse_id, "GPU_SETTLEMENT_WAREHOUSE_MISMATCH", "GPU settlement must bind the canonical K11520 warehouse");
  invariant(listingCandidate.warehouse_receipt?.asset_id === listingCandidate.asset_id, "GPU_SETTLEMENT_WAREHOUSE_ASSET_MISMATCH", "Warehouse receipt must bind the listed GPU asset");
  invariant(typeof listingCandidate.warehouse_receipt?.serial_number === "string" && listingCandidate.warehouse_receipt.serial_number.trim(), "GPU_SETTLEMENT_SERIAL_REQUIRED", "GPU settlement must bind one GPU serial number");
  invariant(listingCandidate.seller_authority?.actor_id && listingCandidate.seller_authority?.controller_id, "GPU_SETTLEMENT_SELLER_AUTHORITY_REQUIRED", "GPU settlement requires verified seller authority");

  const buyer = verify11520ActorContext({ actorContext: buyerActorContext, verifyActorContext, purpose: "CREATE_GPU_ATOMIC_SETTLEMENT_CANDIDATE", observedAt });
  const seller = listingCandidate.seller_authority;
  invariant(buyer.actor_id !== seller.actor_id, "SELF_MATCH_FORBIDDEN", "GPU buyer and seller actor cannot match");
  invariant(buyer.controller_id !== seller.controller_id, "SAME_CONTROLLER_MATCH_FORBIDDEN", "GPU buyer and seller controller cannot match");
  invariant(typeof tradeNonce === "string" && /^[A-Za-z0-9:_-]{8,128}$/.test(tradeNonce), "GPU_SETTLEMENT_NONCE_INVALID", "GPU settlement requires a stable bounded nonce");
  invariant(Array.isArray(consumedTradeNonces) && !consumedTradeNonces.includes(tradeNonce), "GPU_SETTLEMENT_NONCE_REPLAY", "GPU settlement nonce has already been consumed");
  const observed = Date.parse(observedAt);
  const expires = Date.parse(expiresAt);
  invariant(Number.isFinite(observed) && Number.isFinite(expires) && expires > observed, "GPU_SETTLEMENT_EXPIRY_INVALID", "GPU settlement expiry must be later than its observation time");

  const warehouse = listingCandidate.warehouse_receipt;
  return Object.freeze({
    candidate_id: `GPU_ATOMIC_${listingCandidate.listing.listing_id}_${tradeNonce}`,
    trade_nonce: tradeNonce,
    chain_id: GPU_ATOMIC_SETTLEMENT_11520_REQUIREMENTS.chain_id,
    market_id: UNIVERSAL_11520_MARKET.market_id,
    listing_id: listingCandidate.listing.listing_id,
    asset_id: listingCandidate.asset_id,
    gpu_serial_number: warehouse.serial_number,
    warehouse_id: warehouse.warehouse_id,
    warehouse_receipt_id: warehouse.receipt_id,
    ownership_evidence_id: warehouse.ownership_evidence_id,
    cargo_receipt_id: warehouse.cargo_receipt_id,
    buyer_actor_id: buyer.actor_id,
    buyer_controller_id: buyer.controller_id,
    seller_actor_id: seller.actor_id,
    seller_controller_id: seller.controller_id,
    beneficiary: seller.actor_id,
    currency_id: listingCandidate.quote_currency,
    amount_atomic: atomic(listingCandidate.total_ask_atomic, "GPU settlement amount").toString(),
    observed_at: observedAt,
    expires_at: expiresAt,
    atomic_actions: GPU_ATOMIC_SETTLEMENT_11520_REQUIREMENTS.atomic_actions,
    binding_status: "COMPLETE_CANDIDATE_FIELDS_FAIL_CLOSED",
    warehouse_evidence_status: warehouse.status,
    deployed_v1_compatibility: GPU_ATOMIC_SETTLEMENT_11520_REQUIREMENTS.deployed_v1_status,
    production_adapter_status: GPU_ATOMIC_SETTLEMENT_11520_REQUIREMENTS.production_adapter_status,
    blockers: Object.freeze([
      "WAREHOUSE_EVIDENCE_NOT_REPOSITORY_VERIFIED",
      "FUNDED_TRADING_CAPITAL_NOT_BOUND",
      "BUYER_PAYMENT_CUSTODY_NOT_IMPLEMENTED",
      "GPU_INVENTORY_CUSTODY_TRANSFER_NOT_IMPLEMENTED",
      "PRODUCTION_GPU_SETTLEMENT_ADAPTER_NOT_IMPLEMENTED",
      "TRANSACTION_POLICY_BROKER_NOT_CONNECTED",
      "NO_BROADCAST_FORK_SIMULATION_MISSING",
      "DISTINCT_REVIEW_NOT_ACCEPTED"
    ]),
    replay_state: "CALLER_INDEX_CHECKED_DURABLE_STORE_REQUIRED",
    settlement_ready: false,
    unsigned_payload: null,
    signer_requested: false,
    allowance_requested: false,
    buyer_payment_collected: false,
    gpu_custody_transferred: false,
    revenue_recognized: false,
    real_trade_executed: false,
    mainnet_transaction_sent: false
  });
}

export function validate11520SettlementReceipt(receipt, { escrowCandidate, verifyChainReceipt, consumedReceiptIds = [] }) {
  invariant(escrowCandidate?.status === "UNFUNDED_MODEL_ONLY", "ESCROW_CANDIDATE_REQUIRED", "Settlement verification requires the exact escrow candidate");
  invariant(typeof verifyChainReceipt === "function", "CHAIN_RECEIPT_VERIFIER_REQUIRED", "Settlement receipt fields must be checked by an independent BSC receipt verifier");
  const fields = ["receipt_id", "listing_id", "escrow_id", "chain_id", "tx_hash", "block_number", "receipt_status", "buyer_actor_id", "seller_actor_id", "beneficiary", "asset_id", "currency_id", "amount_atomic", "confirmed_at"];
  for (const field of fields) invariant(receipt?.[field] !== undefined && receipt[field] !== null, "SETTLEMENT_RECEIPT_FIELD_REQUIRED", `Settlement receipt requires ${field}`);
  invariant(!consumedReceiptIds.includes(receipt.receipt_id), "SETTLEMENT_RECEIPT_REPLAY", "Settlement receipt has already been consumed");
  invariant(/^0x[0-9a-f]{64}$/i.test(receipt.tx_hash), "SETTLEMENT_CHAIN_RECEIPT_INVALID", "Settlement requires a BSC transaction hash");
  const verifiedChainReceipt = verifyChainReceipt(receipt.tx_hash);
  invariant(verifiedChainReceipt?.chain_id === 56 && verifiedChainReceipt.receipt_status === 1 && Number.isInteger(verifiedChainReceipt.block_number) && verifiedChainReceipt.block_number > 0, "SETTLEMENT_CHAIN_RECEIPT_INVALID", "Settlement requires an independently verified successful BSC receipt");
  invariant(receipt.chain_id === verifiedChainReceipt.chain_id && receipt.block_number === verifiedChainReceipt.block_number && receipt.receipt_status === verifiedChainReceipt.receipt_status, "SETTLEMENT_CHAIN_RECEIPT_MISMATCH", "Caller-supplied receipt fields must match independently read BSC evidence");
  invariant(receipt.listing_id === escrowCandidate.listing_id && receipt.escrow_id === escrowCandidate.escrow_id, "SETTLEMENT_BINDING_MISMATCH", "Receipt must bind the exact listing and escrow");
  invariant(receipt.buyer_actor_id === escrowCandidate.buyer_authority.actor_id && receipt.seller_actor_id === escrowCandidate.seller_actor_id && receipt.beneficiary === escrowCandidate.beneficiary, "SETTLEMENT_BENEFICIARY_MISMATCH", "Receipt parties and beneficiary cannot be redirected");
  invariant(receipt.asset_id === escrowCandidate.asset_id && receipt.currency_id === escrowCandidate.currency_id && atomic(receipt.amount_atomic, "receipt amount") === BigInt(escrowCandidate.amount_atomic), "SETTLEMENT_VALUE_MISMATCH", "Receipt asset, currency and amount must match escrow");
  return Object.freeze({
    ...receipt,
    status: "CHAIN_RECEIPT_CANDIDATE_NOT_REPOSITORY_BOUND",
    replay_state: "UNCONSUMED_IN_CALLER_PROVIDED_INDEX_ONLY",
    verification_authority: "FORMAL_REPOSITORY_BOUND_SETTLEMENT_CONNECTOR_REQUIRED",
    chain_settlement_proven: false
  });
}
