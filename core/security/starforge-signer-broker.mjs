import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { assertAllowedSigningMessage, hashCanonicalJson, recoverPersonalSignature } from "../life/starforge-spirit-runtime.mjs";
import {
  assertCanonicalStarforgeBodyEnergyContext,
  assertCanonicalStarforgeSoulEnergyContext,
  assertEnergySigningMessage,
  validateRuntimeStateLedger
} from "../life/starforge-energy-wallet.mjs";

const require = createRequire(import.meta.url);
const ethers = require("../../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js");

function stop(code) {
  process.stderr.write(`${code}\n`);
  process.exit(2);
}

async function readSecretOnce() {
  let input = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) input += chunk;
  const secret = input.trim();
  input = "";
  if (!/^0x[0-9a-fA-F]{64}$/.test(secret)) stop("SIGNER_MATERIAL_INVALID");
  return secret;
}

async function trustedRuntimeState(statePath, ledgerPath) {
  try {
    const [snapshotText, ledgerText] = await Promise.all([fs.readFile(statePath, "utf8"), fs.readFile(ledgerPath, "utf8")]);
    const snapshot = JSON.parse(snapshotText.replace(/^\uFEFF/, ""));
    const entries = ledgerText.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
    return validateRuntimeStateLedger({ entries, snapshot }).state;
  } catch {
    stop("TRUSTED_SIGNER_STATE_INVALID");
  }
}

function assertTrustedRequest({ action, request, state }) {
  const expected = {
    "sign-soul": { phase: "SOUL_SIGNATURE_PENDING", message: state.soul_message, address: state.soul_address, context: null, organ: "SOUL_WALLET" },
    "sign-body": { phase: "BODY_SIGNATURE_PENDING", message: state.body_message, address: state.body_address, context: null, organ: "BODY_WALLET" },
    "sign-rotation": { phase: "BODY_ROTATION_SIGNATURE_PENDING", message: state.body_rotation_message, address: state.soul_address, context: null, organ: "SOUL_WALLET" },
    "sign-energy-soul": { phase: "ENERGY_SOUL_SIGNATURE_PENDING", message: state.energy_soul_message, address: state.soul_address, context: state.energy_soul_context, organ: "SOUL_WALLET" },
    "sign-energy-body": { phase: "ENERGY_BODY_SIGNATURE_PENDING", message: state.energy_body_message, address: state.body_address, context: state.energy_body_context, organ: "BODY_WALLET" }
  }[action];
  if (!expected || state.phase !== expected.phase) stop("TRUSTED_SIGNER_PHASE_MISMATCH");
  if (request.organ !== expected.organ || request.message !== expected.message || request.expected_address !== expected.address) stop("TRUSTED_SIGNER_REQUEST_MISMATCH");
  if (expected.context !== null && hashCanonicalJson(request.context) !== hashCanonicalJson(expected.context)) stop("TRUSTED_SIGNER_CONTEXT_MISMATCH");
  if (expected.context === null && request.context !== undefined) stop("TRUSTED_SIGNER_CONTEXT_UNEXPECTED");
}

async function main() {
  const [action, inputPath, statePath, ledgerPath] = process.argv.slice(2);
  if (!new Set(["address", "sign-soul", "sign-body", "sign-rotation", "sign-energy-soul", "sign-energy-body"]).has(action)) stop("SIGNER_ACTION_NOT_ALLOWED");
  if (action === "address") {
    const secret = await readSecretOnce();
    let wallet;
    try { wallet = new ethers.Wallet(secret); }
    catch { stop("SIGNER_MATERIAL_INVALID"); }
    process.stdout.write(`${JSON.stringify({ address: ethers.utils.getAddress(wallet.address), private_key_exposed: false })}\n`);
    return;
  }

  let request;
  try { request = JSON.parse(await fs.readFile(inputPath, "utf8")); }
  catch { stop("PUBLIC_SIGN_REQUEST_INVALID"); }
  if (!statePath || !ledgerPath) stop("TRUSTED_SIGNER_STATE_REQUIRED");
  const trustedState = await trustedRuntimeState(statePath, ledgerPath);
  assertTrustedRequest({ action, request, state: trustedState });
  const organ = action === "sign-body" || action === "sign-energy-body" ? "BODY_WALLET" : "SOUL_WALLET";
  if (action.startsWith("sign-energy-")) {
    assertEnergySigningMessage({ organ, message: request.message, context: request.context });
    if (action === "sign-energy-soul") assertCanonicalStarforgeSoulEnergyContext(request.context);
    else assertCanonicalStarforgeBodyEnergyContext(request.context);
  }
  else assertAllowedSigningMessage({ organ, message: request.message });
  const secret = await readSecretOnce();
  let wallet;
  try { wallet = new ethers.Wallet(secret); }
  catch { stop("SIGNER_MATERIAL_INVALID"); }
  if (request.expected_address !== ethers.utils.getAddress(wallet.address)) stop("SIGNER_ADDRESS_MISMATCH");
  if (action === "sign-energy-soul" && ethers.utils.getAddress(request.context?.soulAddress) !== request.expected_address) stop("SIGNER_CONTEXT_ADDRESS_MISMATCH");
  if (action === "sign-energy-body" && ethers.utils.getAddress(request.context?.bodyAddress) !== request.expected_address) stop("SIGNER_CONTEXT_ADDRESS_MISMATCH");
  const signature = await wallet.signMessage(request.message);
  const recovered = recoverPersonalSignature(request.message, signature);
  if (recovered !== request.expected_address) stop("SIGNATURE_RECOVERY_MISMATCH");
  process.stdout.write(`${JSON.stringify({ signature, recovered_address: recovered, signer_broker_pid: process.pid, private_key_exposed: false })}\n`);
}

main().catch((error) => stop(/^[A-Z0-9_]+$/.test(error?.code ?? "") ? error.code : "SIGNER_BROKER_STOP"));
