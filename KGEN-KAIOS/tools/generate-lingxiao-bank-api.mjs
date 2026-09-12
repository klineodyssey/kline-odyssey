import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Contract, JsonRpcProvider } from "ethers";

const root = path.resolve(import.meta.dirname, "..");
const rpcUrl = process.env.BSC_MAINNET_RPC_URL;
const bankProxy = process.env.LINGXIAO_18888_BANK_PROXY;
const economic8888Proxy = process.env.GAOLAOZHUANG_8888_BANK_PROXY;
if (!rpcUrl || !bankProxy || !economic8888Proxy) {
  throw new Error("BSC_MAINNET_RPC_URL, LINGXIAO_18888_BANK_PROXY and GAOLAOZHUANG_8888_BANK_PROXY must exist; values are never persisted");
}
const provider = new JsonRpcProvider(rpcUrl, 56, { staticNetwork: true });
const network = await provider.getNetwork();
if (network.chainId !== 56n) throw new Error(`Refusing non-Mainnet chainId ${network.chainId}`);
const abi = JSON.parse(fs.readFileSync(path.join(root, "abi", "LingxiaoCelestialBank18888_Upgradeable.json"), "utf8"));
const bank = new Contract(bankProxy, abi, provider);
const economic8888Abi = JSON.parse(fs.readFileSync(path.join(root, "abi", "GaolaozhuangCommercialBank8888_Upgradeable.json"), "utf8"));
const economic8888 = new Contract(economic8888Proxy, economic8888Abi, provider);
const health = await bank.bankHealth();
const economic8888Health = await economic8888.bankHealth();
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
  economic8888: {
    proxy: economic8888Proxy,
    implementation: await economic8888.implementationAddress(),
    version: await economic8888.version(),
    legacyTreasury: await economic8888.legacyTreasury(),
    kaios: await economic8888.kaios(),
    calendarEpoch: (await economic8888.currentCalendarEpoch()).toString(),
    bankingEpoch: (await economic8888.currentBankingEpoch()).toString(),
    health: {
      balance: economic8888Health.balance.toString(),
      customerLiability: economic8888Health.customerLiability.toString(),
      interestReserve: economic8888Health.interestReserve.toString(),
      pendingInterest: economic8888Health.pendingInterest.toString(),
      reserve: economic8888Health.reserve.toString(),
      available: economic8888Health.available.toString(),
      solvent: economic8888Health.solvent,
      paused: economic8888Health.isPaused,
    },
  },
};
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
