import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createUniverseRuntime } from "../registry/universe-runtime.mjs";
import { runDigitalAntHourlyCycle } from "./index.mjs";
import { readTempleHeart12345 } from "../integrations/temple-heart-12345.mjs";

const require = createRequire(import.meta.url);
const ethers = require("../../ethers-5.7.2.umd.min.js");
const KGEN = "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be";
const KAIOS = "0xD4E67B3a69e41524c424150E6b6e921b01D036db";
const ERC20_READ_ABI = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];

function outputPath(argv) {
  const index = argv.indexOf("--output");
  return index >= 0 && argv[index + 1] ? resolve(argv[index + 1]) : null;
}

function statusError(code, component) {
  const error = new Error(code);
  error.code = code;
  error.component = component;
  return error;
}

async function publicReadCycle({ life }) {
  const rpcUrl = process.env.BSC_RPC_URL;
  if (!rpcUrl) throw statusError("BSC_RPC_URL_MISSING", "BSC_RPC");
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl, 56);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== 56) throw statusError("BSC_CHAIN_56_REQUIRED", "BSC_RPC");
  const kgen = new ethers.Contract(KGEN, ERC20_READ_ABI, provider);
  const kaios = new ethers.Contract(KAIOS, ERC20_READ_ABI, provider);
  const [block, bnb, kgenRaw, kgenDecimals, kaiosRaw, kaiosDecimals, heart] = await Promise.all([
    provider.getBlock("latest"), provider.getBalance(life.wallet_address), kgen.balanceOf(life.wallet_address),
    kgen.decimals(), kaios.balanceOf(life.wallet_address), kaios.decimals(),
    readTempleHeart12345({ ethers, provider, walletAddress: life.wallet_address, wishText: "靠自己的工作活下去，累積自己的資產，有一天靠自己離開五指山。", recentBlockWindow: 25 })
  ]);
  const heartAvailable = heart.status === "CHAIN_READ_VERIFIED";
  return Object.freeze({
    bsc_block: block.number,
    rpc_status: "AVAILABLE",
    heart_status: heartAvailable ? "AVAILABLE" : "UNAVAILABLE",
    kgen_status: "AVAILABLE",
    kaios_status: "AVAILABLE",
    indexer_status: "INDEXER_REQUIRED",
    wallet_state: { status: "PUBLIC_ADDRESS_READ", bnb: ethers.utils.formatEther(bnb) },
    heart_state: { status: heart.status, eligibility_source: heart.eligibility?.source ?? "CLIENT_DERIVED_UNAVAILABLE", event_window: heart.claim_flow_analysis?.status ?? "INDEXER_REQUIRED" },
    finance_state: { BNB: ethers.utils.formatEther(bnb), KGEN: ethers.utils.formatUnits(kgenRaw, Number(kgenDecimals)), KAIOS: ethers.utils.formatUnits(kaiosRaw, Number(kaiosDecimals)), actual_income: "0", actual_expense: "0", actual_gas: "0" },
    work_queue_state: "SCHEMA_READY_EMPTY_QUEUE",
    observations: ["PUBLIC_WALLET_BALANCE_READ", "12345_HEART_READ", "KGEN_BALANCE_READ", "KAIOS_BALANCE_READ", "COMPLETE_FLOW_CLUSTERING_INDEXER_REQUIRED"],
    risk_level: heart.risk_assessment?.level ?? "NORMAL",
    actions_considered: ["HEART_ELIGIBILITY", "GATEKEEPER_REPORT", "CFO_CHECK", "WORK_QUEUE_CHECK", "MISSION_CHECK"],
    error_evidence: heartAvailable ? [{ component: "FLOW_CLUSTERING", code: "INDEXER_REQUIRED", detail: "NO_FLOW_DATA_INFERRED" }] : [{ component: "TEMPLE_HEART_12345", code: heart.reason ?? "CHAIN_READ_UNAVAILABLE", detail: "NO_HEART_STATE_FABRICATED" }]
  });
}

async function main() {
  const seed = JSON.parse(await readFile(new URL("../data/canonical.json", import.meta.url), "utf8"));
  const universe = await createUniverseRuntime({ seed });
  const [life, app] = await Promise.all([
    universe.registries.life.get("DIGITAL_ANT_0001"),
    universe.registries.app.get("DIGITAL_ANT_APP_0001")
  ]);
  const now = new Date().toISOString();
  const result = await runDigitalAntHourlyCycle({ store: universe.store, life, app, scheduledAt: now, startedAt: now, readCycle: publicReadCycle });
  const report = JSON.stringify({
    report_type: "DIGITAL_ANT_PUBLIC_READ_ONLY_HOURLY_WORKER_RESULT",
    scheduler: "EXTERNAL_ADAPTER",
    chain_write: false,
    signer_action: false,
    result
  }, null, 2);
  const target = outputPath(process.argv.slice(2));
  if (target) await writeFile(target, `${report}\n`, { encoding: "utf8", flag: "wx" });
  else process.stdout.write(`${report}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.code ?? "WORKER_RUNTIME_FAILED"}: public read-only worker could not complete.\n`);
  process.exitCode = 1;
});
