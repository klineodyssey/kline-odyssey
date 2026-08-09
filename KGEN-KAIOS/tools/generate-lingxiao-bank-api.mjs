import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Contract, JsonRpcProvider } from "ethers";

const root = path.resolve(import.meta.dirname, "..");
const rpcUrl = process.env.BSC_MAINNET_RPC_URL;
const bankProxy = process.env.LINGXIAO_18888_BANK_PROXY;
if (!rpcUrl || !bankProxy) {
  throw new Error("BSC_MAINNET_RPC_URL and LINGXIAO_18888_BANK_PROXY must exist; values are never persisted");
}
const provider = new JsonRpcProvider(rpcUrl, 56, { staticNetwork: true });
const network = await provider.getNetwork();
if (network.chainId !== 56n) throw new Error(`Refusing non-Mainnet chainId ${network.chainId}`);
const abi = JSON.parse(fs.readFileSync(path.join(root, "abi", "LingxiaoCelestialBank18888_Upgradeable.json"), "utf8"));
const bank = new Contract(bankProxy, abi, provider);
const health = await bank.bankHealth();
const output = {
  generatedAt: new Date().toISOString(),
  source: "READ_ONLY_CHAIN_STATE",
  chainId: 56,
  bank: {
    proxy: bankProxy,
    implementation: await bank.implementationAddress(),
    version: await bank.version(),
    kgen: await bank.kgen(),
    kaios: await bank.kaios(),
    kaiosBalance: (await bank.kaiosBalance()).toString(),
  },
  genesis: {
    started: await bank.genesisStarted(),
    startedAt: (await bank.genesisStartedAt()).toString(),
    openingBalance: (await bank.genesisOpeningBalance()).toString(),
  },
  risk: {
    reserve: health.reserve.toString(),
    available: health.available.toString(),
    healthy: health.healthy,
    paused: health.isPaused,
  },
  governance: { finalized: await bank.governanceFinalized() },
};
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
