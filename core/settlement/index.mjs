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
  return Object.freeze({ ...receipt, status: "CHAIN_VERIFIED_UNCONSUMED_CANDIDATE", replay_state: "UNCONSUMED_IN_PROVIDED_DURABLE_INDEX" });
}
