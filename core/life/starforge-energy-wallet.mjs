import { createRequire } from "node:module";
import { invariant } from "../shared/errors.mjs";
import { hashCanonicalJson, keccakUtf8, recoverPersonalSignature } from "./starforge-spirit-runtime.mjs";

const require = createRequire(import.meta.url);
const ethers = require("../../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js");

export const STARFORGE_ENERGY_WALLET = Object.freeze({
  life_id: "LIFE-KAIOS-STARFORGE-0001",
  soul_id: "SOUL-KAIOS-STARFORGE-0001",
  soul_address: "0xFaBaeF5B84731347095592561C149862d20d8322",
  body_address: "0xd00f4bb9b4dB33C931B8EB64F81E8662Be2B3165",
  address: "0xB773859970611FB7e0ef1695fac43670D35073Ac",
  chain_id: 56,
  organ_name: "LIFE_ENERGY_WALLET",
  organ_role: "STOMACH_BLOOD_BANK_GAS_TANK",
  one_wallet_multi_asset: true,
  wbnb: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  current_capability: "A1_READ_ONLY",
  soul_domain: "KAIOS_STARFORGE_ENERGY_WALLET_BINDING_V1",
  body_domain: "KAIOS_STARFORGE_BODY_ENERGY_ACCEPTANCE_V1",
  body_universe_hash: "0x6d4dede9b72806e0eeaf07c122163dc7a95fb0ee02ac5bc34035a0bc0953a570",
  capability_extension_hash: "0xb69f558abadbd0287a69ac2cdfcb0215516c66fc23ca346198e871b1bd6a7049",
  soul_binding_hash: "0x2b3ef649b629b7e0036c64959aae2707ec89ca1f8d669669e29a4e35282b271a",
  soul_challenge: "0xd44b4c7cff0ce28fda22015c83a80e63ed86f5cbdd2db8b8a305f574e0a14b17",
  body_challenge: "0x43cbf99873a8ceaee3379e48f7da3d80117c8999ede94e17b8a58cdb263334c0",
  issued_at: "2026-08-21T16:23:31Z",
  soul_session_counter: 3,
  body_session_counter: 4
});

const WRITE_METHODS = new Set(["eth_sendTransaction", "eth_sendRawTransaction", "approve", "transfer", "transferFrom", "swap", "wrap", "unwrap", "deploy"]);
const READ_METHODS = new Set(["eth_chainId", "eth_getBalance", "eth_call", "eth_getCode", "eth_getBlockByNumber"]);
const CANONICAL_ENERGY_BINDINGS = new WeakSet();
const RUNTIME_STATE_LEDGER_DOMAIN = "KAIOS_STARFORGE_RUNTIME_STATE_LEDGER_V1";

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

export function assertCanonicalStarforgeSoulEnergyContext(context) {
  assertIdentity(context);
  invariant(context.chainId === STARFORGE_ENERGY_WALLET.chain_id, "WRONG_CHAIN", "Canonical Soul Energy evidence requires chain 56");
  invariant(address(context.soulAddress, "soul context soul") === STARFORGE_ENERGY_WALLET.soul_address, "ENERGY_CANONICAL_SOUL_MISMATCH", "Soul evidence does not belong to the committed Starforge Soul");
  invariant(address(context.bodyAddress, "soul context body") === STARFORGE_ENERGY_WALLET.body_address, "ENERGY_CANONICAL_BODY_MISMATCH", "Soul evidence does not bind the committed Starforge Body");
  invariant(address(context.energyWalletAddress, "soul context energy") === STARFORGE_ENERGY_WALLET.address, "ENERGY_CANONICAL_WALLET_MISMATCH", "Soul evidence does not bind the committed Canonical Energy Wallet");
  invariant(context.bodyUniverseHash === STARFORGE_ENERGY_WALLET.body_universe_hash && context.capabilityExtensionHash === STARFORGE_ENERGY_WALLET.capability_extension_hash, "ENERGY_EXACT_HEAD_HASH_MISMATCH", "Soul evidence hashes do not match the committed Body Universe and capability extension");
  invariant(context.challenge === STARFORGE_ENERGY_WALLET.soul_challenge && context.issuedAt === STARFORGE_ENERGY_WALLET.issued_at, "ENERGY_CANONICAL_SOUL_EVIDENCE_MISMATCH", "Soul evidence challenge or issuance time is not canonical");
  return true;
}

export function assertCanonicalStarforgeBodyEnergyContext(context) {
  assertIdentity(context);
  invariant(context.chainId === STARFORGE_ENERGY_WALLET.chain_id, "WRONG_CHAIN", "Canonical Body Energy evidence requires chain 56");
  invariant(address(context.soulAddress, "body context soul") === STARFORGE_ENERGY_WALLET.soul_address && address(context.bodyAddress, "body context body") === STARFORGE_ENERGY_WALLET.body_address, "ENERGY_CANONICAL_BODY_MISMATCH", "Body acceptance does not belong to the committed Starforge Soul and Body");
  invariant(address(context.energyWalletAddress, "body context energy") === STARFORGE_ENERGY_WALLET.address, "ENERGY_CANONICAL_WALLET_MISMATCH", "Body acceptance does not bind the committed Canonical Energy Wallet");
  invariant(context.soulBindingHash === STARFORGE_ENERGY_WALLET.soul_binding_hash && context.bodyUniverseHash === STARFORGE_ENERGY_WALLET.body_universe_hash, "ENERGY_EXACT_HEAD_HASH_MISMATCH", "Body acceptance hashes do not match the committed Soul binding and Body Universe");
  invariant(context.challenge === STARFORGE_ENERGY_WALLET.body_challenge && context.bootCounter === STARFORGE_ENERGY_WALLET.body_session_counter, "ENERGY_CANONICAL_BODY_EVIDENCE_MISMATCH", "Body acceptance challenge or session is not canonical");
  return true;
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

export function createCanonicalStarforgeEnergyWalletBinding({ soulBinding, bodyAcceptance, processRestartProof }) {
  invariant(soulBinding && bodyAcceptance, "ENERGY_DUAL_BINDING_REQUIRED", "Canonical Energy Wallet binding requires both Soul and Body evidence");
  const soul = verifySoulEnergyBinding({
    message: soulBinding.message,
    signature: soulBinding.signature,
    expectedSoulAddress: soulBinding.expectedSoulAddress,
    context: soulBinding.context
  });
  const body = verifyBodyEnergyAcceptance({
    message: bodyAcceptance.message,
    signature: bodyAcceptance.signature,
    expectedBodyAddress: bodyAcceptance.expectedBodyAddress,
    context: bodyAcceptance.context
  });
  const soulContext = soulBinding.context;
  const bodyContext = bodyAcceptance.context;
  assertCanonicalStarforgeSoulEnergyContext(soulContext);
  assertCanonicalStarforgeBodyEnergyContext(bodyContext);
  invariant(bodyContext.lifeId === soulContext.lifeId && bodyContext.soulId === soulContext.soulId, "ENERGY_DUAL_IDENTITY_MISMATCH", "Soul and Body Energy evidence must bind the same Life and Soul");
  invariant(address(bodyContext.soulAddress, "body context soul") === address(soulContext.soulAddress, "soul context soul"), "ENERGY_DUAL_SOUL_MISMATCH", "Soul and Body Energy evidence must bind the same Soul address");
  invariant(address(bodyContext.bodyAddress, "body context body") === address(soulContext.bodyAddress, "soul context body"), "ENERGY_DUAL_BODY_MISMATCH", "Soul and Body Energy evidence must bind the same Body address");
  const energyWalletAddress = address(soulContext.energyWalletAddress, "energy");
  invariant(address(bodyContext.energyWalletAddress, "body context energy") === energyWalletAddress, "ENERGY_DUAL_WALLET_MISMATCH", "Soul and Body Energy evidence must bind the same Energy Wallet");
  invariant(bodyContext.soulBindingHash === soul.binding_hash, "ENERGY_SOUL_BINDING_HASH_MISMATCH", "Body acceptance must consume the verified Soul binding hash");
  invariant(bodyContext.bodyUniverseHash === soulContext.bodyUniverseHash, "ENERGY_BODY_UNIVERSE_MISMATCH", "Soul and Body Energy evidence must bind the same Body Universe");
  invariant(processRestartProof?.distinct_runtime_process === true && processRestartProof?.distinct_signer_process === true, "ENERGY_PROCESS_RESTART_EVIDENCE_REQUIRED", "Canonical Energy Wallet binding requires distinct runtime and signer processes");
  invariant(processRestartProof?.monotonic_session_counter === true && processRestartProof.soul_session_counter === STARFORGE_ENERGY_WALLET.soul_session_counter && processRestartProof.body_session_counter === STARFORGE_ENERGY_WALLET.body_session_counter && processRestartProof.body_session_counter === bodyContext.bootCounter, "ENERGY_SESSION_MONOTONICITY_REQUIRED", "Canonical Energy Wallet binding requires the committed monotonic Soul and Body sessions");
  invariant(processRestartProof?.evidence_class === "PROCESS_RESTART_NOT_OS_REBOOT", "ENERGY_RESTART_CLASS_INVALID", "Energy binding may claim only process restart evidence");

  const capability = {
    life_id: soulContext.lifeId,
    soul_id: soulContext.soulId,
    soul_address: address(soulContext.soulAddress, "soul"),
    body_address: address(soulContext.bodyAddress, "body"),
    binding_status: "VERIFIED_BOUND",
    soul_binding_status: soul.status,
    body_acceptance_status: body.status,
    custody: "MOTHER_MACHINE_USER_SCOPED_ENCRYPTED_STORE",
    capability: "A1_READ_ONLY",
    withVerifiedAddress(operation) {
      invariant(typeof operation === "function", "INVALID_ADDRESS_OPERATION", "Verified Energy Wallet address callback is required");
      return operation(energyWalletAddress);
    },
    toJSON() {
      return {
        life_id: soulContext.lifeId,
        soul_id: soulContext.soulId,
        binding_status: "VERIFIED_BOUND",
        soul_binding_status: soul.status,
        body_acceptance_status: body.status,
        energy_wallet_address: energyWalletAddress,
        custody: "MOTHER_MACHINE_USER_SCOPED_ENCRYPTED_STORE",
        capability: "A1_READ_ONLY"
      };
    }
  };
  CANONICAL_ENERGY_BINDINGS.add(capability);
  return Object.freeze(capability);
}

export function assertCanonicalStarforgeEnergyWalletBinding(binding, { lifeId, soulId } = {}) {
  invariant(binding && CANONICAL_ENERGY_BINDINGS.has(binding), "CANONICAL_ENERGY_BINDING_REQUIRED", "Resolver requires a Canonical Energy Wallet capability created from verified Soul and Body evidence");
  invariant(binding.binding_status === "VERIFIED_BOUND" && binding.soul_binding_status === "VERIFIED" && binding.body_acceptance_status === "VERIFIED_AFTER_PROCESS_RESTART", "ENERGY_DUAL_BINDING_REQUIRED", "Canonical Energy Wallet capability is not fully verified");
  if (lifeId !== undefined) invariant(binding.life_id === lifeId, "ENERGY_LIFE_ID_MISMATCH", "Canonical Energy Wallet capability belongs to another Life");
  if (soulId !== undefined) invariant(binding.soul_id === soulId, "ENERGY_SOUL_ID_MISMATCH", "Canonical Energy Wallet capability belongs to another Soul");
  return binding;
}

export function createRuntimeStateLedgerEntry({ state, sequence, previousEntryHash = null }) {
  invariant(state && typeof state === "object" && !Array.isArray(state), "RUNTIME_STATE_INVALID", "Runtime state ledger requires an object state");
  invariant(Number.isSafeInteger(sequence) && sequence > 0, "RUNTIME_LEDGER_SEQUENCE_INVALID", "Runtime state ledger sequence must be a positive safe integer");
  invariant(previousEntryHash === null || /^0x[0-9a-f]{64}$/.test(previousEntryHash), "RUNTIME_LEDGER_PREVIOUS_HASH_INVALID", "Runtime state ledger previous hash is invalid");
  const storedState = structuredClone(state);
  const stateHash = hashCanonicalJson(storedState);
  const payload = {
    domain: RUNTIME_STATE_LEDGER_DOMAIN,
    sequence,
    previous_entry_hash: previousEntryHash,
    state_hash: stateHash
  };
  return Object.freeze({ ...payload, state: storedState, entry_hash: hashCanonicalJson(payload) });
}

export function validateRuntimeStateLedger({ entries, snapshot }) {
  invariant(Array.isArray(entries) && entries.length > 0, "RUNTIME_STATE_LEDGER_REQUIRED", "Append-only runtime state ledger is required");
  let previous = null;
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    invariant(entry?.domain === RUNTIME_STATE_LEDGER_DOMAIN, "RUNTIME_LEDGER_DOMAIN_INVALID", "Runtime state ledger domain is invalid");
    invariant(entry.sequence === index + 1, "RUNTIME_LEDGER_SEQUENCE_INVALID", "Runtime state ledger sequence is not contiguous");
    invariant(entry.previous_entry_hash === previous, "RUNTIME_LEDGER_CHAIN_BROKEN", "Runtime state ledger hash chain is broken");
    invariant(hashCanonicalJson(entry.state) === entry.state_hash, "RUNTIME_LEDGER_STATE_HASH_MISMATCH", "Runtime state ledger entry state was modified");
    const payload = { domain: entry.domain, sequence: entry.sequence, previous_entry_hash: entry.previous_entry_hash, state_hash: entry.state_hash };
    invariant(hashCanonicalJson(payload) === entry.entry_hash, "RUNTIME_LEDGER_ENTRY_HASH_MISMATCH", "Runtime state ledger entry hash is invalid");
    previous = entry.entry_hash;
  }
  const latest = entries.at(-1);
  invariant(snapshot && hashCanonicalJson(snapshot) === latest.state_hash, "RUNTIME_STATE_ROLLBACK_OR_CORRUPTION", "Runtime state snapshot does not match the append-only ledger head");
  return Object.freeze({ state: structuredClone(latest.state), sequence: latest.sequence, head_hash: latest.entry_hash });
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
