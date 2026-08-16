import { createRequire } from "node:module";
import { DomainError, invariant } from "../shared/errors.mjs";

export const DIGITAL_ANT_ENV = Object.freeze({
  privateKey: "DIGITAL_ANT_0001_PRIVATE_KEY",
  walletAddress: "DIGITAL_ANT_0001_WALLET_ADDRESS"
});

export function diagnoseDigitalAntEnvironment(environment = process.env) {
  return Object.freeze({
    DIGITAL_ANT_0001_PRIVATE_KEY: environment[DIGITAL_ANT_ENV.privateKey] ? "PRESENT" : "MISSING",
    DIGITAL_ANT_0001_WALLET_ADDRESS: environment[DIGITAL_ANT_ENV.walletAddress] ? "PRESENT" : "MISSING"
  });
}

function ethersRuntime() {
  const require = createRequire(import.meta.url);
  return require("../../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js");
}

function stopped(code, message) {
  throw new DomainError(code, message, { binding_status: "STOP" });
}

export function verifyDigitalAntWalletBinding(environment = process.env) {
  const privateKey = environment[DIGITAL_ANT_ENV.privateKey];
  const expectedAddress = environment[DIGITAL_ANT_ENV.walletAddress];
  if (!privateKey) stopped("MISSING_PRIVATE_KEY", "Digital Ant wallet binding STOP: private key environment variable is missing");
  if (!expectedAddress) stopped("MISSING_WALLET_ADDRESS", "Digital Ant wallet binding STOP: wallet address environment variable is missing");

  let wallet;
  let expected;
  try {
    const ethers = ethersRuntime();
    expected = ethers.utils.getAddress(expectedAddress);
    wallet = new ethers.Wallet(privateKey);
    if (ethers.utils.getAddress(wallet.address) !== expected) stopped("WALLET_ADDRESS_MISMATCH", "Digital Ant wallet binding STOP: derived address mismatch");
  } catch (error) {
    if (error instanceof DomainError) throw error;
    stopped("INVALID_WALLET_BINDING", "Digital Ant wallet binding STOP: invalid local wallet material");
  }

  return Object.freeze({
    life_id: "DIGITAL_ANT_0001",
    binding_status: "VERIFIED_BOUND",
    bindLife(life) {
      invariant(life.life_id === "DIGITAL_ANT_0001", "LIFE_BINDING_MISMATCH", "Wallet capability can only bind DIGITAL_ANT_0001");
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
    toJSON() { return { life_id: "DIGITAL_ANT_0001", binding_status: "VERIFIED_BOUND" }; }
  });
}

export function assertNoSensitiveSerialization(value) {
  const serialized = JSON.stringify(value);
  invariant(!/["'](?:private_key|privateKey|secret_key|secretKey)["']\s*:/i.test(serialized), "SENSITIVE_SERIALIZATION", "Private key fields cannot be serialized");
  return serialized;
}
