import { requireFields, requireId } from "../shared/schema.mjs";

export function validateLocation(location) {
  requireFields(location, ["location_id", "name", "location_type", "parent_location_id", "civilization_id", "primary_settlement_currency_id", "status"], "Location");
  requireId(location.location_id, "location_id");
  return location;
}

export function createLocationRegistry(store, createRegistry) {
  return createRegistry({ domain: "LOCATION", stream: "ASSET", idField: "location_id", validate: validateLocation, store });
}
