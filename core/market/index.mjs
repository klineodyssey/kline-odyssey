import { requireFields, requireId, requireEnum } from "../shared/schema.mjs";
import { invariant } from "../shared/errors.mjs";
import { assertRightsOfferAllowed } from "../permissions/index.mjs";

export const LISTING_TYPES = Object.freeze(["FIXED_PRICE", "AUCTION", "LICENSE", "SUBSCRIPTION", "RENTAL", "JOB", "SERVICE", "EQUITY", "REVENUE_SHARE"]);
export const LISTING_FIELDS = Object.freeze(["listing_id", "asset_id", "seller_id", "listing_type", "currency_id", "price", "quantity", "rights_offered", "start_time", "end_time", "status"]);
export const ORDER_FIELDS = Object.freeze(["order_id", "listing_id", "buyer_id", "seller_id", "asset_id", "currency_id", "amount", "quantity", "fee", "rights_transferred", "created_at", "settled_at", "tx_hash", "status", "action_reason"]);
export const LISTING_STATUSES = Object.freeze(["LOCAL_DRAFT", "NOT_DEPLOYED", "LISTED", "CANCELLED"]);

export function validateListing(listing) {
  requireFields(listing, LISTING_FIELDS, "Listing");
  requireId(listing.listing_id, "listing_id");
  requireEnum(listing.listing_type, LISTING_TYPES, "listing_type");
  invariant(Array.isArray(listing.rights_offered), "INVALID_RIGHTS_OFFER", "rights_offered must be an array");
  requireEnum(listing.status, LISTING_STATUSES, "listing.status");
  const unpriced = listing.pricing_status === "UNPRICED";
  invariant((unpriced && listing.price === null) || (!unpriced && Number(listing.price) >= 0), "INVALID_LISTING_PRICE", "Unpriced listings require price=null; priced listings require a non-negative price");
  invariant(Number(listing.quantity) > 0, "INVALID_LISTING_AMOUNT", "Listing quantity is invalid");
  return listing;
}

export function createListing({ listing, asset, seller, sellerController = null }) {
  validateListing(listing);
  invariant([seller, sellerController].filter(Boolean).includes(asset.controller_id) || [seller, sellerController].filter(Boolean).includes(asset.owner_id), "LISTING_PERMISSION_DENIED", "Seller does not control this asset");
  assertRightsOfferAllowed(asset, listing.rights_offered);
  if (listing.status === "LISTED") {
    invariant(asset.asset_type !== "LIFE", "LIFE_IDENTITY_NOT_FOR_SALE", "A formal profile listing cannot use the Life identity asset");
    invariant(listing.registry_scope === "LOCAL_11520", "FORMAL_LOCAL_REGISTRY_REQUIRED", "LISTED requires a completed local 11520 Registry record");
    invariant(listing.settlement_status === "NOT_DEPLOYED", "UNVERIFIED_SETTLEMENT_STATUS", "Local listing registration cannot claim on-chain settlement");
    invariant(listing.identity_right_offered === false && !listing.rights_offered.includes("identity_right"), "LIFE_IDENTITY_NOT_FOR_SALE", "Life identity cannot be offered by a profile listing");
  }
  return structuredClone(listing);
}

export async function replayCanonical11520Listing({ store, listing, asset, life }) {
  validateListing(listing);
  invariant(listing.status === "LISTED" && listing.registry_scope === "LOCAL_11520", "CANONICAL_LISTING_NOT_FORMAL", "Canonical 11520 listing must be formally registered in the local Registry");
  invariant(asset.asset_id === listing.asset_id && asset.asset_type !== "LIFE", "INVALID_PROFILE_LISTING_ASSET", "Canonical Life Profile listing cannot list the Life identity asset");
  const marketHistory = await store.history(listing.listing_id, "MARKET");
  if (marketHistory.some((event) => event.event_type === "11520_LISTING_EVENT")) return Object.freeze({ status: "IDEMPOTENT_NOOP" });
  const payload = Object.freeze({
    listing_id: listing.listing_id,
    life_id: life.life_id,
    asset_id: asset.asset_id,
    registry_scope: listing.registry_scope,
    settlement_status: listing.settlement_status,
    pricing_status: listing.pricing_status,
    identity_right_offered: false
  });
  const base = { actor_id: life.life_id, timestamp: listing.start_time, event_type: "11520_LISTING_EVENT", payload, tx_hash: null };
  const events = await store.commitBatch([
    { ...base, domain: "MARKET", stream: "MARKET", id: listing.listing_id, entity: listing },
    { ...base, domain: "ASSET", stream: "ASSET", id: asset.asset_id, entity: asset },
    { ...base, domain: "LIFE", stream: "LIFE", id: life.life_id, entity: life }
  ]);
  return Object.freeze({ status: "LOCAL_11520_LISTING_REPLAYED", events });
}

export function validateOrder(order) {
  requireFields(order, ORDER_FIELDS, "Order");
  requireId(order.order_id, "order_id");
  invariant(order.buyer_id !== order.seller_id, "SELF_MATCH_FORBIDDEN", "Buyer and seller cannot self-match");
  invariant(order.action_reason?.trim(), "ACTION_REASON_REQUIRED", "Every market action requires a reason");
  return order;
}

export function createMarketRegistry(store, createRegistry) {
  return createRegistry({ domain: "MARKET", stream: "MARKET", idField: "listing_id", validate: validateListing, store });
}

export const UNIVERSAL_11520_MARKET = Object.freeze({
  market_id: "K11520_UNIVERSAL_EXCHANGE",
  company_address: "0.00011520",
  company_k_coordinate: "K11520",
  quote_currencies: Object.freeze(["KGEN", "KAIOS"]),
  physical_asset_types: Object.freeze(["GOODS", "EQUIPMENT", "SPACECRAFT"]),
  runtime_status: "LOCAL_REGISTRY_AND_PAPER_SETTLEMENT_CANDIDATE",
  mainnet_settlement: false
});

function unsignedAtomic(value, field) {
  invariant(/^\d+$/.test(String(value)), "INVALID_ATOMIC_AMOUNT", `${field} must be an unsigned integer atomic amount`);
  return BigInt(value);
}

export function verify11520ActorContext({ actorContext, verifyActorContext, purpose, observedAt }) {
  invariant(typeof verifyActorContext === "function", "ACTOR_CONTEXT_VERIFIER_REQUIRED", "11520 actions require an independent actor-context verifier");
  const authority = verifyActorContext(actorContext, Object.freeze({
    purpose,
    market_id: UNIVERSAL_11520_MARKET.market_id,
    observed_at: observedAt
  }));
  requireFields(authority, ["actor_id", "controller_id", "authentication_status", "authentication_method", "evidence_id"], "Verified11520ActorContext");
  invariant(authority.authentication_status === "VERIFIED", "ACTOR_CONTEXT_NOT_VERIFIED", "11520 actor context must be independently verified");
  invariant(authority.actor_id && authority.controller_id && authority.evidence_id, "ACTOR_CONTEXT_INCOMPLETE", "Verified actor context is incomplete");
  return Object.freeze({ ...authority });
}

export function validate11520WarehouseReceipt(receipt, { asset, depositorAuthority }) {
  requireFields(receipt, [
    "receipt_id", "warehouse_id", "asset_id", "asset_type", "depositor_actor_id", "supplier_id",
    "model", "serial_number", "ownership_evidence_id", "cargo_receipt_id", "acquisition_cost_atomic",
    "acquisition_currency", "deposited_at", "evidence_class", "status"
  ], "WarehouseReceipt11520");
  requireId(receipt.receipt_id, "warehouse_receipt.receipt_id");
  invariant(receipt.warehouse_id === "0.00011520_K11520_GPU_BONDED_WAREHOUSE", "WAREHOUSE_DESTINATION_MISMATCH", "Physical 11520 inventory must be deposited at the registered K11520 warehouse");
  invariant(receipt.asset_id === asset.asset_id && receipt.asset_type === asset.asset_type, "WAREHOUSE_ASSET_MISMATCH", "Warehouse receipt must identify the listed asset");
  invariant(receipt.depositor_actor_id === depositorAuthority.actor_id, "WAREHOUSE_DEPOSITOR_MISMATCH", "Warehouse depositor must match the verified listing actor");
  invariant(receipt.evidence_class === "EXTERNAL_VERIFIED" && receipt.status === "VERIFIED_CANDIDATE", "WAREHOUSE_EVIDENCE_REQUIRED", "Physical inventory requires externally verifiable warehouse evidence before formal activation");
  for (const field of ["supplier_id", "model", "serial_number", "ownership_evidence_id", "cargo_receipt_id"]) {
    invariant(typeof receipt[field] === "string" && receipt[field].trim().length > 0, "WAREHOUSE_PROVENANCE_REQUIRED", `Warehouse receipt requires ${field}`);
  }
  invariant(unsignedAtomic(receipt.acquisition_cost_atomic, "warehouse acquisition cost") > 0n, "WAREHOUSE_COST_REQUIRED", "Warehouse receipt requires a positive acquisition cost");
  invariant(UNIVERSAL_11520_MARKET.quote_currencies.includes(receipt.acquisition_currency), "WAREHOUSE_CURRENCY_FORBIDDEN", "Warehouse acquisition currency must be KGEN or KAIOS for this candidate");
  return Object.freeze({ ...receipt });
}

export function create11520UniversalListingCandidate({
  listing,
  asset,
  sellerActorContext,
  verifyActorContext,
  observedAt,
  unitPriceAtomic,
  quantityAtomic,
  evidenceIds,
  warehouseReceipt = null
}) {
  const sellerAuthority = verify11520ActorContext({ actorContext: sellerActorContext, verifyActorContext, purpose: "CREATE_UNIVERSAL_LISTING", observedAt });
  invariant(listing.status === "LOCAL_DRAFT", "UNREVIEWED_LISTING_CANNOT_BE_LIVE", "Universal listing candidates begin as local drafts");
  invariant(listing.seller_id === sellerAuthority.actor_id, "LISTING_ACTOR_MISMATCH", "Listing seller must match the verified actor");
  invariant(UNIVERSAL_11520_MARKET.quote_currencies.includes(listing.currency_id), "LISTING_QUOTE_CURRENCY_FORBIDDEN", "11520 candidate listings quote only in KGEN or KAIOS");
  invariant(asset.asset_type !== "LIFE", "LIFE_IDENTITY_NOT_FOR_SALE", "A Life identity cannot be listed; list a separate Job or Service asset");
  const checked = createListing({ listing, asset, seller: sellerAuthority.actor_id, sellerController: sellerAuthority.controller_id });
  const unitPrice = unsignedAtomic(unitPriceAtomic, "listing unit price");
  const quantity = unsignedAtomic(quantityAtomic, "listing quantity");
  invariant(unitPrice > 0n && quantity > 0n, "LISTING_ATOMIC_AMOUNT_REQUIRED", "Listing price and quantity must be positive atomic amounts");
  invariant(Array.isArray(evidenceIds) && evidenceIds.length > 0 && evidenceIds.every((id) => typeof id === "string" && id.length > 0), "LISTING_EVIDENCE_REQUIRED", "Universal listing candidates require evidence references");

  const physical = UNIVERSAL_11520_MARKET.physical_asset_types.includes(asset.asset_type);
  const warehouse = physical ? validate11520WarehouseReceipt(warehouseReceipt, { asset, depositorAuthority: sellerAuthority }) : null;
  invariant(!physical || warehouse, "PHYSICAL_INVENTORY_WAREHOUSE_REQUIRED", "Physical assets require a verified warehouse receipt");

  return Object.freeze({
    candidate_id: `CANDIDATE_${listing.listing_id}`,
    market_id: UNIVERSAL_11520_MARKET.market_id,
    company_address: UNIVERSAL_11520_MARKET.company_address,
    listing: Object.freeze({ ...checked }),
    asset_id: asset.asset_id,
    asset_type: asset.asset_type,
    seller_authority: sellerAuthority,
    unit_price_atomic: unitPrice.toString(),
    quantity_atomic: quantity.toString(),
    total_ask_atomic: (unitPrice * quantity).toString(),
    quote_currency: listing.currency_id,
    evidence_ids: Object.freeze([...evidenceIds]),
    warehouse_receipt: warehouse,
    inventory_class: physical ? "PHYSICAL_WAREHOUSE_CANDIDATE" : "DIGITAL_OR_SERVICE_CANDIDATE",
    status: "READY_FOR_DISTINCT_LISTING_REVIEW",
    settlement_status: "NOT_DEPLOYED",
    custody_transfer: false,
    mainnet_transaction_sent: false
  });
}
