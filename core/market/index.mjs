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

export function createListing({ listing, asset, seller }) {
  validateListing(listing);
  invariant(asset.controller_id === seller || asset.owner_id === seller, "LISTING_PERMISSION_DENIED", "Seller does not control this asset");
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
