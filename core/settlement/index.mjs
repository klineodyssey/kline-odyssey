import { invariant } from "../shared/errors.mjs";
import { validateOrder } from "../market/index.mjs";
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
