import { requireArray, requireFields, requireId, requireEnum } from "../shared/schema.mjs";
import { invariant } from "../shared/errors.mjs";

export const SERVICE_PRICING_STATUSES = Object.freeze(["UNPRICED", "PRICED", "NOT_DEPLOYED"]);
export const SERVICE_AVAILABILITY = Object.freeze(["AVAILABLE", "LIMITED", "UNAVAILABLE", "NOT_DEPLOYED"]);

export function validateService(service) {
  requireFields(service, [
    "service_id", "provider_life_id", "name", "description", "capabilities", "requirements",
    "pricing_status", "settlement_currency", "availability", "work_history", "review_policy",
    "customer_count", "skills", "permissions", "pricing_model", "license_model", "status",
    "service_readiness", "work_evidence_count", "successful_cycles", "failed_cycles", "price_status",
    "revenue", "contracts", "payments",
    "location_id", "civilization_id"
  ], "Service");
  requireId(service.service_id, "service_id");
  requireId(service.provider_life_id, "provider_life_id");
  for (const field of ["capabilities", "requirements", "work_history", "skills", "permissions"]) requireArray(service[field], field);
  requireEnum(service.pricing_status, SERVICE_PRICING_STATUSES, "service.pricing_status");
  requireEnum(service.availability, SERVICE_AVAILABILITY, "service.availability");
  invariant(Number.isInteger(service.customer_count) && service.customer_count >= 0, "INVALID_CUSTOMER_COUNT", "customer_count must be a non-negative integer");
  for (const field of ["work_evidence_count", "successful_cycles", "failed_cycles", "contracts", "payments"]) invariant(Number.isInteger(service[field]) && service[field] >= 0, "INVALID_SERVICE_EVIDENCE_COUNT", `${field} must be a non-negative integer`);
  invariant(Number(service.revenue) === 0 || service.payments > 0, "FAKE_SERVICE_REVENUE", "Service revenue requires payment evidence");
  invariant(service.price_status === service.pricing_status, "SERVICE_PRICE_STATUS_MISMATCH", "price_status must mirror pricing_status");
  invariant(service.pricing_status !== "UNPRICED" || service.pricing_model === "UNPRICED", "UNPRICED_SERVICE_HAS_PRICE_MODEL", "An unpriced service cannot claim a price model");
  return service;
}

export function createServiceRegistry(store, createRegistry) {
  return createRegistry({ domain: "SERVICE", stream: "SERVICE", idField: "service_id", validate: validateService, store });
}
