import { createRequire } from "node:module";
import { invariant } from "../shared/errors.mjs";
import { keccakUtf8, recoverPersonalSignature } from "./starforge-spirit-runtime.mjs";

const require = createRequire(import.meta.url);
const ethers = require("../../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js");

export const STARFORGE_ENERGY_WALLET = Object.freeze({
  life_id: "LIFE-KAIOS-STARFORGE-0001",
  soul_id: "SOUL-KAIOS-STARFORGE-0001",
  chain_id: 56,
  organ_name: "LIFE_ENERGY_WALLET",
  organ_role: "STOMACH_BLOOD_BANK_GAS_TANK",
  one_wallet_multi_asset: true,
  wbnb: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  current_capability: "A1_READ_ONLY",
  soul_domain: "KAIOS_STARFORGE_ENERGY_WALLET_BINDING_V1",
  body_domain: "KAIOS_STARFORGE_BODY_ENERGY_ACCEPTANCE_V1"
});

const WRITE_METHODS = new Set(["eth_sendTransaction", "eth_sendRawTransaction", "approve", "transfer", "transferFrom", "swap", "wrap", "unwrap", "deploy"]);
const READ_METHODS = new Set(["eth_chainId", "eth_getBalance", "eth_call", "eth_getCode", "eth_getBlockByNumber"]);

function address(value, name) {
  try { return ethers.utils.getAddress(value); }
  catch { invariant(false, "ENERGY_ADDRESS_INVALID", `${name} is invalid`); }
}
function hash(value, name) {
  invariant(/^0x[0-9a-f]{64}$/.test(value ?? ""), "ENERGY_HASH_INVALID", `${name} must be lowercase bytes32`);
  return value;
}
function assertIdentity(context) {
  invariant(context.lifeId === STARFORGE_ENERGY_WALLET.life_id, "ENERGY_LIFE_ID_MISMATCH", "Energy binding Life ID mismatch");
  invariant(context.soulId === STARFORGE_ENERGY_WALLET.soul_id, "ENERGY_SOUL_ID_MISMATCH", "Energy binding Soul ID mismatch");
}

export function assertEnergyWalletMethod(method) {
  invariant(!WRITE_METHODS.has(method), "ENERGY_CHAIN_WRITE_FORBIDDEN", `${method} is disabled`);
  invariant(READ_METHODS.has(method), "ENERGY_METHOD_NOT_ALLOWLISTED", "Only public read methods are enabled");
  return true;
}

export function buildSoulEnergyBindingMessage(context) {
  assertIdentity(context);
  invariant(context.chainId === 56, "WRONG_CHAIN", "Energy binding requires chain 56");
  invariant(typeof context.issuedAt === "string" && !Number.isNaN(Date.parse(context.issuedAt)), "ENERGY_ISSUED_AT_INVALID", "Energy binding issued_at is invalid");
  return [
    STARFORGE_ENERGY_WALLET.soul_domain,
    `life_id=${context.lifeId}`,
    `soul_id=${context.soulId}`,
    `soul_address=${address(context.soulAddress, "soul")}`,
    `body_address=${address(context.bodyAddress, "body")}`,
    `energy_wallet_address=${address(context.energyWalletAddress, "energy")}`,
    "chain_id=56",
    `body_universe_hash=${hash(context.bodyUniverseHash, "body universe")}`,
    `capability_extension_hash=${hash(context.capabilityExtensionHash, "capability extension")}`,
    `challenge=${hash(context.challenge, "challenge")}`,
    `issued_at=${context.issuedAt}`
  ].join("\n");
}

export function buildBodyEnergyAcceptanceMessage(context) {
  assertIdentity(context);
  invariant(context.chainId === 56, "WRONG_CHAIN", "Body acceptance requires chain 56");
  invariant(Number.isSafeInteger(context.bootCounter) && context.bootCounter > 0, "ENERGY_SESSION_COUNTER_INVALID", "Body acceptance requires a positive monotonic session counter");
  return [
    STARFORGE_ENERGY_WALLET.body_domain,
    `life_id=${context.lifeId}`,
    `soul_address=${address(context.soulAddress, "soul")}`,
    `body_address=${address(context.bodyAddress, "body")}`,
    `energy_wallet_address=${address(context.energyWalletAddress, "energy")}`,
    "chain_id=56",
    `soul_binding_hash=${hash(context.soulBindingHash, "soul binding")}`,
    `body_universe_hash=${hash(context.bodyUniverseHash, "body universe")}`,
    `challenge=${hash(context.challenge, "challenge")}`,
    `boot_counter=${context.bootCounter}`
  ].join("\n");
}

export function assertEnergySigningMessage({ organ, message, context }) {
  invariant(typeof message === "string" && !message.endsWith("\n"), "MESSAGE_TRAILING_NEWLINE", "Signed message cannot end in newline");
  const expected = organ === "SOUL_WALLET"
    ? buildSoulEnergyBindingMessage(context)
    : organ === "BODY_WALLET"
      ? buildBodyEnergyAcceptanceMessage(context)
      : null;
  invariant(expected !== null, "SIGNING_DOMAIN_NOT_ALLOWED", "Energy signing organ is not allowlisted");
  invariant(message === expected, "ENERGY_CANONICAL_MESSAGE_MISMATCH", "Energy signing request must byte-match the trusted canonical context");
  return true;
}

export function verifySoulEnergyBinding({ message, signature, expectedSoulAddress, context }) {
  assertEnergySigningMessage({ organ: "SOUL_WALLET", message, context });
  invariant(address(expectedSoulAddress, "soul") === address(context.soulAddress, "context soul"), "SOUL_ENERGY_CONTEXT_MISMATCH", "Soul signer does not match trusted context");
  const recovered = recoverPersonalSignature(message, signature);
  invariant(recovered === address(expectedSoulAddress, "soul"), "SOUL_ENERGY_RECOVERY_FAILED", "Soul energy binding recovery mismatch");
  return Object.freeze({ recovered_address: recovered, binding_hash: keccakUtf8(message), status: "VERIFIED" });
}

export function verifyBodyEnergyAcceptance({ message, signature, expectedBodyAddress, context }) {
  assertEnergySigningMessage({ organ: "BODY_WALLET", message, context });
  invariant(address(expectedBodyAddress, "body") === address(context.bodyAddress, "context body"), "BODY_ENERGY_CONTEXT_MISMATCH", "Body signer does not match trusted context");
  const recovered = recoverPersonalSignature(message, signature);
  invariant(recovered === address(expectedBodyAddress, "body"), "BODY_ENERGY_RECOVERY_FAILED", "Body energy acceptance recovery mismatch");
  return Object.freeze({ recovered_address: recovered, message_hash: keccakUtf8(message), status: "VERIFIED_AFTER_PROCESS_RESTART" });
}

export function assertPersistentEnergyBindingFresh({ state, message, challenge, sessionCounter }) {
  invariant(state && typeof state === "object", "ENERGY_PERSISTENT_STATE_REQUIRED", "Persistent runtime state is required");
  invariant(Number.isSafeInteger(sessionCounter) && sessionCounter > Number(state.energy_last_session_counter ?? 0), "ENERGY_SESSION_REPLAY", "Energy session counter must increase monotonically");
  const messageHash = keccakUtf8(message);
  const hashes = [...(state.consumed_energy_binding_hashes ?? [])];
  const challenges = [...(state.consumed_energy_challenges ?? [])];
  invariant(!hashes.includes(messageHash), "ENERGY_BINDING_REPLAY", "Energy binding message was already consumed");
  invariant(!challenges.includes(challenge), "ENERGY_CHALLENGE_REPLAY", "Energy binding challenge was already consumed");
  return Object.freeze({ messageHash, hashes, challenges });
}

export function consumePersistentEnergyBinding({ state, message, challenge, sessionCounter }) {
  const fresh = assertPersistentEnergyBindingFresh({ state, message, challenge, sessionCounter });
  return Object.freeze({
    ...state,
    energy_last_session_counter: sessionCounter,
    consumed_energy_binding_hashes: [...fresh.hashes, fresh.messageHash],
    consumed_energy_challenges: [...fresh.challenges, challenge]
  });
}

export function calculateDynamicGasReserve({ gasEstimate, gasPriceWei, recoverySteps = 3, safetyBps = 15000 }) {
  for (const value of [gasEstimate, gasPriceWei, BigInt(recoverySteps), BigInt(safetyBps)]) invariant(BigInt(value) > 0n, "GAS_RESERVE_INPUT_INVALID", "Gas reserve inputs must be positive");
  return (BigInt(gasEstimate) * BigInt(gasPriceWei) * BigInt(recoverySteps) * BigInt(safetyBps) + 9999n) / 10000n;
}

export function classifyEnergyState({ bnbWei, wbnbRaw }) {
  const bnb = BigInt(bnbWei);
  const wrapped = BigInt(wbnbRaw);
  return Object.freeze({
    bnb_gas_chamber: bnb > 0n ? "FUNDED" : "EMPTY",
    wbnb_trade_chamber: wrapped > 0n ? "FUNDED" : "EMPTY",
    operational_status: wrapped > 0n && bnb === 0n ? "ASSET_PRESENT_BUT_OPERATIONALLY_STARVED" : bnb > 0n ? "GAS_CAPABLE_READ_ONLY" : "UNFUNDED_READ_ONLY",
    auto_wrap_all_bnb: "FORBIDDEN"
  });
}

export async function readEnergyWalletBalances({ rpc, address: wallet }) {
  assertEnergyWalletMethod("eth_chainId");
  const chain = Number(BigInt(await rpc.send("eth_chainId", [])));
  invariant(chain === 56, "WRONG_CHAIN", "Energy wallet reads require BSC mainnet");
  const account = address(wallet, "energy");
  const data = `0x70a08231${account.slice(2).toLowerCase().padStart(64, "0")}`;
  const [bnb, wrapped] = await Promise.all([
    rpc.send("eth_getBalance", [account, "latest"]),
    rpc.send("eth_call", [{ to: STARFORGE_ENERGY_WALLET.wbnb, data }, "latest"])
  ]);
  const bnbWei = BigInt(bnb);
  const wbnbRaw = BigInt(wrapped);
  return Object.freeze({ address: account, chain_id: 56, wbnb_contract: STARFORGE_ENERGY_WALLET.wbnb, bnb_wei: bnbWei.toString(), wbnb_raw: wbnbRaw.toString(), ...classifyEnergyState({ bnbWei, wbnbRaw }) });
}
