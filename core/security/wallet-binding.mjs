import { createRequire } from "node:module";
import { DomainError, invariant } from "../shared/errors.mjs";

export const DIGITAL_ANT_ENV = Object.freeze({
  privateKey: "DIGITAL_ANT_0001_PRIVATE_KEY",
  walletAddress: "DIGITAL_ANT_0001_WALLET_ADDRESS"
});

export const CODEX_GM_ENV = Object.freeze({
  privateKey: "CODEX_GM_0001_PRIVATE_KEY",
  walletAddress: "CODEX_GM_0001_WALLET_ADDRESS"
});

export const CODEX_GM_SIGNER_CONNECTION_PROFILE = Object.freeze({
  profile_id: "KAIOS_REPOSITORY_BOUND_LIFE_WALLET_PROFILE_V1:LIFE-CODEX-GM-0001",
  life_id: "LIFE-CODEX-GM-0001",
  env_prefix: "CODEX_GM_0001",
  wallet_address: "0x4DF6E9629Dad1072103cFd2bC81845fd97429214",
  chain_id: 56,
  identity_sources: Object.freeze([
    "KGEN-KAIOS/worker_registry.json",
    "KGEN-AI-Company/CODEX_MANAGER_PROTOCOL.md"
  ])
});

export function createDigitalLifeEnvironment(envPrefix) {
  invariant(/^[A-Z][A-Z0-9_]*$/.test(envPrefix ?? ""), "INVALID_ENV_PREFIX", "Digital Life wallet environment prefix is invalid");
  return Object.freeze({
    privateKey: `${envPrefix}_PRIVATE_KEY`,
    walletAddress: `${envPrefix}_WALLET_ADDRESS`
  });
}

export function diagnoseDigitalLifeEnvironment({ envPrefix }, environment = process.env) {
  const names = createDigitalLifeEnvironment(envPrefix);
  return Object.freeze({
    [names.privateKey]: environment[names.privateKey] ? "PRESENT" : "MISSING",
    [names.walletAddress]: environment[names.walletAddress] ? "PRESENT" : "MISSING"
  });
}

export function diagnoseDigitalAntEnvironment(environment = process.env) {
  return diagnoseDigitalLifeEnvironment({ envPrefix: "DIGITAL_ANT_0001" }, environment);
}

function ethersRuntime() {
  const require = createRequire(import.meta.url);
  return require("../../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js");
}

function stopped(code, message) {
  throw new DomainError(code, message, { binding_status: "STOP" });
}

export function verifyDigitalLifeWalletBinding({ lifeId, envPrefix, expectedChainId = 56 }, environment = process.env) {
  invariant(typeof lifeId === "string" && lifeId.length > 0, "LIFE_ID_REQUIRED", "Digital Life wallet binding requires a Life ID");
  invariant(Number.isInteger(expectedChainId) && expectedChainId > 0, "INVALID_EXPECTED_CHAIN", "Digital Life wallet binding requires a positive chain ID");
  const names = createDigitalLifeEnvironment(envPrefix);
  const privateKey = environment[names.privateKey];
  const expectedAddress = environment[names.walletAddress];
  if (!privateKey) stopped("MISSING_PRIVATE_KEY", "Digital Life wallet binding STOP: private key environment variable is missing");
  if (!expectedAddress) stopped("MISSING_WALLET_ADDRESS", "Digital Life wallet binding STOP: wallet address environment variable is missing");

  let wallet;
  let expected;
  try {
    const ethers = ethersRuntime();
    expected = ethers.utils.getAddress(expectedAddress);
    wallet = new ethers.Wallet(privateKey);
    if (ethers.utils.getAddress(wallet.address) !== expected) stopped("WALLET_ADDRESS_MISMATCH", "Digital Life wallet binding STOP: derived address mismatch");
  } catch (error) {
    if (error instanceof DomainError) throw error;
    stopped("INVALID_WALLET_BINDING", "Digital Life wallet binding STOP: invalid local wallet material");
  }

  return Object.freeze({
    life_id: lifeId,
    binding_status: "VERIFIED_BOUND",
    expected_chain_id: expectedChainId,
    assertChainId(chainId) {
      const observed = typeof chainId === "string" && chainId.startsWith("0x") ? Number(BigInt(chainId)) : Number(chainId);
      if (observed !== expectedChainId) stopped("WRONG_CHAIN", `Digital Life wallet binding STOP: expected chain ${expectedChainId}`);
      return true;
    },
    bindLife(life) {
      invariant(life.life_id === lifeId, "LIFE_BINDING_MISMATCH", `Wallet capability can only bind ${lifeId}`);
      const runtimeLife = structuredClone(life);
      Object.defineProperty(runtimeLife, "wallet_address", { value: expected, enumerable: false, writable: false, configurable: false });
      Object.defineProperty(runtimeLife, "wallet_binding_status", { value: "VERIFIED_BOUND", enumerable: true, writable: false, configurable: false });
      return Object.freeze(runtimeLife);
    },
    withVerifiedAddress(operation) {
      invariant(typeof operation === "function", "INVALID_ADDRESS_OPERATION", "Verified address callback is required");
      return operation(expected);
    },
    withVerifiedSigner(operation) {
      invariant(typeof operation === "function", "INVALID_CHAIN_OPERATION", "Verified chain operation callback is required");
      return operation(wallet);
    },
    toJSON() { return { life_id: lifeId, binding_status: "VERIFIED_BOUND", expected_chain_id: expectedChainId }; }
  });
}

export function verifyDigitalAntWalletBinding(environment = process.env) {
  return verifyDigitalLifeWalletBinding({ lifeId: "DIGITAL_ANT_0001", envPrefix: "DIGITAL_ANT_0001", expectedChainId: 56 }, environment);
}

/**
 * Produce public, non-secret evidence that the configured credential derives
 * the canonical Life wallet. This proves credential binding only. It grants
 * no transaction, allowance, transfer, trade, treasury or broadcast authority
 * and deliberately does not expose the signer callback.
 */
export function validateRepositoryBoundLifeWalletProfile({
  lifeId,
  envPrefix,
  expectedAddress,
  expectedChainId = 56
} = {}) {
  const profile = CODEX_GM_SIGNER_CONNECTION_PROFILE;
  invariant(
    lifeId === profile.life_id &&
      envPrefix === profile.env_prefix &&
      expectedChainId === profile.chain_id &&
      typeof expectedAddress === "string" &&
      expectedAddress.toLowerCase() === profile.wallet_address.toLowerCase(),
    "REPOSITORY_BOUND_LIFE_WALLET_PROFILE_MISMATCH",
    "Signer connection evidence must match the repository-bound Life, environment, wallet and chain profile"
  );
  return profile;
}

export function verifyDigitalLifeSignerConnection({
  lifeId,
  envPrefix,
  expectedAddress,
  expectedChainId = 56,
  observedAt = new Date().toISOString()
}, environment = process.env) {
  const profile = validateRepositoryBoundLifeWalletProfile({ lifeId, envPrefix, expectedAddress, expectedChainId });
  const observedAtMs = Date.parse(String(observedAt ?? ""));
  invariant(Number.isFinite(observedAtMs), "SIGNER_OBSERVED_AT_INVALID", "Signer connection evidence requires a valid observation timestamp");
  const binding = verifyDigitalLifeWalletBinding({
    lifeId: profile.life_id,
    envPrefix: profile.env_prefix,
    expectedChainId: profile.chain_id
  }, environment);
  binding.assertChainId(profile.chain_id);
  const address = binding.withVerifiedAddress((value) => value);
  const ethers = ethersRuntime();
  const canonicalExpected = ethers.utils.getAddress(profile.wallet_address);
  if (ethers.utils.getAddress(address) !== canonicalExpected) {
    stopped("CANONICAL_LIFE_WALLET_MISMATCH", "Digital Life signer STOP: configured wallet does not match repository-bound Life identity");
  }
  const observedAtIso = new Date(observedAtMs).toISOString();
  return Object.freeze({
    evidence_type: "DIGITAL_LIFE_SIGNER_CONNECTION_V1",
    connection_evidence_id: `SIGNER-CONNECTION:${profile.life_id}:${profile.chain_id}:${canonicalExpected.toLowerCase()}:${observedAtIso}`,
    identity_profile_id: profile.profile_id,
    identity_sources: profile.identity_sources,
    life_id: profile.life_id,
    wallet_address: canonicalExpected,
    chain_id: profile.chain_id,
    observed_at: observedAtIso,
    observation_time_authority: false,
    status: "CONNECTED_BINDING_ONLY",
    credential_binding: "VERIFIED_BOUND",
    identity_authority: false,
    transaction_authority: false,
    policy_broker_connected: false,
    signer_callback_exposed: false,
    raw_key_exportable: false,
    private_key_exposed: false
  });
}

export function assertNoSensitiveSerialization(value) {
  const serialized = JSON.stringify(value);
  invariant(!/["'](?:private_key|privateKey|secret_key|secretKey)["']\s*:/i.test(serialized), "SENSITIVE_SERIALIZATION", "Private key fields cannot be serialized");
  return serialized;
}
