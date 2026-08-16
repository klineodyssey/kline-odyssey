import { requireFields, requireId } from "../shared/schema.mjs";
import { invariant } from "../shared/errors.mjs";

export function validateDream(dream) {
  requireFields(dream, ["dream_id", "life_id", "target_asset_id", "target_asset_type", "target_name", "status", "progress", "created_at", "updated_at"], "Dream");
  requireId(dream.dream_id, "dream_id");
  return dream;
}

export function completeAssetDream(dream, spacecraft, settlement) {
  invariant(settlement?.status === "SETTLED" && settlement.tx_hash, "VERIFIED_PURCHASE_REQUIRED", "Dream ownership requires a settled purchase with transaction hash");
  invariant(settlement.asset_id === dream.target_asset_id, "DREAM_ASSET_MISMATCH", "Settlement asset does not match dream target");
  return {
    dream: { ...dream, status: "ACHIEVED", progress: 100, updated_at: settlement.settled_at },
    spacecraft: { ...spacecraft, owner: dream.life_id, spaceship_owned: true, status: "OWNED", history: [...spacecraft.history, settlement.order_id] }
  };
}
