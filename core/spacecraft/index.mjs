import { requireFields, requireId } from "../shared/schema.mjs";
import { invariant } from "../shared/errors.mjs";

export const SPACECRAFT_FIELDS = Object.freeze([
  "spacecraft_id", "model", "manufacturer", "owner", "price", "currency_id", "speed", "range", "energy",
  "cargo", "seats", "capabilities", "maintenance", "status", "history", "location_id", "civilization_id", "spaceship_owned"
]);

export function validateSpacecraft(spacecraft) {
  requireFields(spacecraft, SPACECRAFT_FIELDS, "Spacecraft");
  requireId(spacecraft.spacecraft_id, "spacecraft_id");
  invariant(!(spacecraft.spaceship_owned && !spacecraft.owner), "SPACECRAFT_OWNER_REQUIRED", "Owned spacecraft requires an owner");
  invariant(!(spacecraft.spaceship_owned && spacecraft.status === "CONCEPT"), "CONCEPT_CANNOT_BE_OWNED", "Concept spacecraft cannot be owned");
  return spacecraft;
}

export function createSpacecraftRegistry(store, createRegistry) {
  return createRegistry({ domain: "SPACECRAFT", stream: "SPACECRAFT", idField: "spacecraft_id", validate: validateSpacecraft, store });
}
