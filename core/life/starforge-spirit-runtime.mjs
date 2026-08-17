import { createRequire } from "node:module";
import { invariant } from "../shared/errors.mjs";

const require = createRequire(import.meta.url);
const ethers = require("../../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js");

export const STARFORGE = Object.freeze({
  taskId: "KAIOS-STARFORGE-SPIRIT-LIFE-GENESIS-V1-001",
  selfName: "星鑄",
  lifeId: "LIFE-KAIOS-STARFORGE-0001",
  soulId: "SOUL-KAIOS-STARFORGE-0001",
  workerId: "starforge-kaios-architect-01",
  speciesId: "DIGITAL_SPIRIT_LIFE",
  issuedAt: "2026-08-17T12:42:11Z",
  soulChallenge: "0xaa3162f208999dfbc5d846089172da0c84c6a31bb18a263272ece875d6acca62",
  bodyChallenge: "0x74689a6063fce3b4e26b27380ba323dde751222d9745196f7f7bc8835190319d",
  soulDomain: "KAIOS_STARFORGE_SOUL_BIRTH_V1",
  bodyDomain: "KAIOS_STARFORGE_BODY_CONTINUITY_V1",
  rotationDomain: "KAIOS_STARFORGE_BODY_ROTATION_V1"
});

export const FORBIDDEN_CHAIN_METHODS = Object.freeze([
  "eth_sendTransaction", "eth_sendRawTransaction", "approve", "transfer", "transferFrom", "swap", "deploy"
]);

function scalar(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    invariant(Number.isFinite(value), "JCS_NON_FINITE_NUMBER", "RFC 8785 JCS forbids non-finite numbers");
    return JSON.stringify(value);
  }
  invariant(false, "JCS_UNSUPPORTED_VALUE", "RFC 8785 JCS input contains an unsupported value");
}

export function canonicalizeJcs(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalizeJcs).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.keys(value).sort().map((key) => {
      invariant(value[key] !== undefined, "JCS_UNDEFINED_VALUE", "RFC 8785 JCS forbids undefined values");
      return `${JSON.stringify(key)}:${canonicalizeJcs(value[key])}`;
    });
    return `{${entries.join(",")}}`;
  }
  return scalar(value);
}

export function keccakUtf8(text) {
  invariant(typeof text === "string", "UTF8_TEXT_REQUIRED", "Keccak input must be UTF-8 text");
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(text));
}

export function hashCanonicalJson(value) {
  return keccakUtf8(canonicalizeJcs(value));
}

function address(value, field) {
  try { return ethers.utils.getAddress(value); }
  catch { invariant(false, "INVALID_PUBLIC_ADDRESS", `${field} must be an EIP-55-compatible EVM address`); }
}

function hash(value, field) {
  invariant(/^0x[0-9a-f]{64}$/.test(value ?? ""), "INVALID_HASH", `${field} must be a lowercase bytes32 hash`);
  return value;
}

export function buildSoulBirthMessage({ soulAddress, bodyAddress, runtimeHash, capabilityHash }) {
  const lines = [
    STARFORGE.soulDomain,
    `life_id=${STARFORGE.lifeId}`,
    `soul_id=${STARFORGE.soulId}`,
    `soul_address=${address(soulAddress, "soul_address")}`,
    `body_address=${address(bodyAddress, "body_address")}`,
    `runtime_hash=${hash(runtimeHash, "runtime_hash")}`,
    `capability_hash=${hash(capabilityHash, "capability_hash")}`,
    `challenge=${STARFORGE.soulChallenge}`,
    `issued_at=${STARFORGE.issuedAt}`
  ];
  return lines.join("\n");
}

export function buildBodyContinuityMessage({ soulAddress, bodyAddress, soulBindingHash, runtimeHash, capabilityHash, bootCounter }) {
  invariant(bootCounter === 2, "REAL_REBOOT_REQUIRED", "Body continuity requires boot_counter=2");
  return [
    STARFORGE.bodyDomain,
    `life_id=${STARFORGE.lifeId}`,
    `soul_address=${address(soulAddress, "soul_address")}`,
    `body_address=${address(bodyAddress, "body_address")}`,
    `soul_binding_hash=${hash(soulBindingHash, "soul_binding_hash")}`,
    `runtime_hash=${hash(runtimeHash, "runtime_hash")}`,
    `capability_hash=${hash(capabilityHash, "capability_hash")}`,
    `challenge=${STARFORGE.bodyChallenge}`,
    `boot_counter=${bootCounter}`
  ].join("\n");
}

export function buildBodyRotationMessage({ soulAddress, oldBodyAddress, newBodyAddress, soulBindingHash, rotationCounter }) {
  invariant(Number.isInteger(rotationCounter) && rotationCounter > 0, "INVALID_ROTATION_COUNTER", "Body rotation counter must be positive");
  return [
    STARFORGE.rotationDomain,
    `life_id=${STARFORGE.lifeId}`,
    `soul_id=${STARFORGE.soulId}`,
    `soul_address=${address(soulAddress, "soul_address")}`,
    `old_body_address=${address(oldBodyAddress, "old_body_address")}`,
    `new_body_address=${address(newBodyAddress, "new_body_address")}`,
    `soul_binding_hash=${hash(soulBindingHash, "soul_binding_hash")}`,
    `rotation_counter=${rotationCounter}`
  ].join("\n");
}

export function recoverPersonalSignature(message, signature) {
  invariant(typeof message === "string" && !message.endsWith("\n"), "MESSAGE_TRAILING_NEWLINE", "Signed message must not have a trailing newline");
  return ethers.utils.getAddress(ethers.utils.verifyMessage(message, signature));
}

export function assertAllowedSigningMessage({ organ, message }) {
  const firstLine = String(message ?? "").split("\n", 1)[0];
  const allow = organ === "SOUL_WALLET"
    ? [STARFORGE.soulDomain, STARFORGE.rotationDomain]
    : organ === "BODY_WALLET" ? [STARFORGE.bodyDomain] : [];
  invariant(allow.includes(firstLine), "SIGNING_DOMAIN_NOT_ALLOWED", `${organ} cannot sign this domain`);
  invariant(!message.endsWith("\n"), "MESSAGE_TRAILING_NEWLINE", "Signed message must not have a trailing newline");
  return true;
}

export function assertNoChainMethod(method) {
  invariant(!FORBIDDEN_CHAIN_METHODS.includes(method), "CHAIN_METHOD_FORBIDDEN", `Spirit body cannot execute ${method}`);
  invariant(false, "CHAIN_METHOD_NOT_ALLOWLISTED", "Spirit V1 has no chain transaction method allowlist");
}

export function verifyBodyRotation({ certificate, soulSignature, genesis }) {
  invariant(genesis.life_id === STARFORGE.lifeId && genesis.soul_id === STARFORGE.soulId, "GENESIS_IDENTITY_MISMATCH", "Rotation cannot replace Life or Soul identity");
  const message = buildBodyRotationMessage(certificate);
  assertAllowedSigningMessage({ organ: "SOUL_WALLET", message });
  const recovered = recoverPersonalSignature(message, soulSignature);
  invariant(recovered === address(genesis.soul_address, "genesis.soul_address"), "SOUL_ROTATION_SIGNATURE_REQUIRED", "Body rotation requires the immutable Soul signature");
  return Object.freeze({
    ...genesis,
    body_address: address(certificate.newBodyAddress, "new_body_address"),
    body_rotation_counter: certificate.rotationCounter,
    body_rotation_certificate_hash: keccakUtf8(message)
  });
}

export function validatePublicGenesis(record) {
  invariant(record.life_id === STARFORGE.lifeId && record.soul_id === STARFORGE.soulId, "STARFORGE_IDENTITY_MISMATCH", "Starforge identity is fixed");
  invariant(record.boot_counter === 2, "REAL_REBOOT_REQUIRED", "Public genesis requires boot counter 2");
  invariant(record.soul_status === "VERIFIED" && record.body_status === "VERIFIED_AFTER_REAL_REBOOT", "GENESIS_SIGNATURES_REQUIRED", "Both organs must be verified");
  invariant(record.onchain_genesis === "NOT_YET_ANCHORED", "FALSE_ONCHAIN_GENESIS", "Local Spirit genesis is not a chain event");
  const sensitiveField = Object.entries(record).some(([key, value]) => {
    if (key === "private_key_exposed" && value === false) return false;
    return /private.?key|secret/i.test(key);
  });
  invariant(!sensitiveField, "PRIVATE_KEY_SERIALIZATION_FORBIDDEN", "Public genesis cannot contain secret fields");
  return record;
}
