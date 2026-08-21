import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { assertAllowedSigningMessage, recoverPersonalSignature } from "../life/starforge-spirit-runtime.mjs";
import { assertEnergySigningMessage } from "../life/starforge-energy-wallet.mjs";

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

async function main() {
  const [action, inputPath] = process.argv.slice(2);
  if (!new Set(["address", "sign-soul", "sign-body", "sign-rotation", "sign-energy-soul", "sign-energy-body"]).has(action)) stop("SIGNER_ACTION_NOT_ALLOWED");
  const secret = await readSecretOnce();
  let wallet;
  try { wallet = new ethers.Wallet(secret); }
  catch { stop("SIGNER_MATERIAL_INVALID"); }

  if (action === "address") {
    process.stdout.write(`${JSON.stringify({ address: ethers.utils.getAddress(wallet.address), private_key_exposed: false })}\n`);
    return;
  }

  let request;
  try { request = JSON.parse(await fs.readFile(inputPath, "utf8")); }
  catch { stop("PUBLIC_SIGN_REQUEST_INVALID"); }
  const organ = action === "sign-body" || action === "sign-energy-body" ? "BODY_WALLET" : "SOUL_WALLET";
  if (action.startsWith("sign-energy-")) assertEnergySigningMessage({ organ, message: request.message });
  else assertAllowedSigningMessage({ organ, message: request.message });
  if (request.expected_address !== ethers.utils.getAddress(wallet.address)) stop("SIGNER_ADDRESS_MISMATCH");
  const signature = await wallet.signMessage(request.message);
  const recovered = recoverPersonalSignature(request.message, signature);
  if (recovered !== request.expected_address) stop("SIGNATURE_RECOVERY_MISMATCH");
  process.stdout.write(`${JSON.stringify({ signature, recovered_address: recovered, signer_broker_pid: process.pid, private_key_exposed: false })}\n`);
}

main().catch(() => stop("SIGNER_BROKER_STOP"));
