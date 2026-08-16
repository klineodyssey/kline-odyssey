import { invariant } from "./errors.mjs";

export function requireFields(entity, fields, entityName) {
  invariant(entity && typeof entity === "object" && !Array.isArray(entity), "INVALID_ENTITY", `${entityName} must be an object`);
  for (const field of fields) {
    invariant(Object.hasOwn(entity, field), "MISSING_FIELD", `${entityName}.${field} is required`, { field });
  }
  return entity;
}

export function requireEnum(value, allowed, field) {
  invariant(allowed.includes(value), "INVALID_ENUM", `${field} must be one of: ${allowed.join(", ")}`, { field, value });
}

export function requireArray(value, field) {
  invariant(Array.isArray(value), "INVALID_ARRAY", `${field} must be an array`, { field });
}

export function requireId(value, field) {
  invariant(typeof value === "string" && /^[A-Z0-9][A-Z0-9_-]*$/.test(value), "INVALID_ID", `${field} is not a canonical ID`, { field });
}
