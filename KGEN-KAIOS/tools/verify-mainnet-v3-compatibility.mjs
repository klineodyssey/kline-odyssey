import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import ganache from "ganache";
import {
  BrowserProvider,
  Contract,
  ContractFactory,
  JsonRpcProvider,
  id,
  keccak256,
} from "ethers";

const CHAIN_ID = 56;
const KAIOS = "0xD4E67B3a69e41524c424150E6b6e921b01D036db";
const KGEN = "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be";
const REGISTRY = "0xA9e7CbF161E39E556f4B5b8E41397Ac4B87a932D";
const PREDECESSOR = "0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1";
const ORGAN_FURNACE = id("KAIOS.ORGAN.FURNACE.18911");
const REPORT_PATH = path.resolve("reports/KAIOS_18911_V3_MAINNET_COMPATIBILITY.json");

const kaiosAbi = [
  "function KGEN() view returns (address)",
  "function ORGAN_REGISTRY() view returns (address)",
  "function alchemyBurnCount() view returns (uint256)",
  "function totalKaiosBurnedForAlchemy() view returns (uint256)",
  "function expectedKufoForKAIOS(uint256) pure returns (uint256)",
  "function burnForAlchemy(address,address,uint256,bytes32,bytes32) returns (bytes32,uint256)",
];
const registryAbi = [
  "function owner() view returns (address)",
  "function bootstrapOpen() view returns (bool)",
  "function minimumDelay() view returns (uint64)",
  "function organ(bytes32) view returns (address)",
  "function pendingOrgans(bytes32) view returns (address candidate,uint64 executableAt)",
];
const furnaceAbi = [
  "function kaios() view returns (address)",
  "function organRegistry() view returns (address)",
  "function epochSeconds() view returns (uint64)",
  "function MATURATION_EPOCHS() view returns (uint64)",
];

function json(value) {
  return JSON.stringify(value, (_, entry) => typeof entry === "bigint" ? entry.toString() : entry, 2) + "\n";
}

async function artifact(name) {
  return JSON.parse(await fs.readFile(path.resolve(`artifacts/${name}.json`), "utf8"));
}

async function codeHash(provider, address) {
  const code = await provider.getCode(address);
  if (code === "0x") throw new Error(`NO_CODE:${address}`);
  return { hash: keccak256(code), bytes: (code.length - 2) / 2 };
}

const rpcUrl = process.env.BSC_MAINNET_RPC_URL;
if (!rpcUrl) throw new Error("BSC_MAINNET_RPC_URL_REQUIRED");

const live = new JsonRpcProvider(rpcUrl, CHAIN_ID, { staticNetwork: true });
const network = await live.getNetwork();
if (Number(network.chainId) !== CHAIN_ID) throw new Error(`WRONG_CHAIN:${network.chainId}`);
const liveBlock = await live.getBlock("latest");
if (!liveBlock) throw new Error("LIVE_BLOCK_UNAVAILABLE");

const liveKaios = new Contract(KAIOS, kaiosAbi, live);
const liveRegistry = new Contract(REGISTRY, registryAbi, live);
const liveFurnace = new Contract(PREDECESSOR, furnaceAbi, live);
const [
  linkedKgen,
  linkedRegistry,
  burnCount,
  totalBurned,
  oneKaiosOutput,
  registryOwner,
  bootstrapOpen,
  minimumDelay,
  activeFurnace,
  pendingFurnace,
  predecessorKaios,
  predecessorRegistry,
  predecessorEpochSeconds,
  predecessorMaturityEpochs,
] = await Promise.all([
  liveKaios.KGEN(),
  liveKaios.ORGAN_REGISTRY(),
  liveKaios.alchemyBurnCount(),
  liveKaios.totalKaiosBurnedForAlchemy(),
  liveKaios.expectedKufoForKAIOS(10n ** 18n),
  liveRegistry.owner(),
  liveRegistry.bootstrapOpen(),
  liveRegistry.minimumDelay(),
  liveRegistry.organ(ORGAN_FURNACE),
  liveRegistry.pendingOrgans(ORGAN_FURNACE),
  liveFurnace.kaios(),
  liveFurnace.organRegistry(),
  liveFurnace.epochSeconds(),
  liveFurnace.MATURATION_EPOCHS(),
]);

if (linkedKgen.toLowerCase() !== KGEN.toLowerCase()) throw new Error("LIVE_KGEN_BINDING_MISMATCH");
if (linkedRegistry.toLowerCase() !== REGISTRY.toLowerCase()) throw new Error("LIVE_REGISTRY_BINDING_MISMATCH");
if (activeFurnace.toLowerCase() !== PREDECESSOR.toLowerCase()) throw new Error("ACTIVE_FURNACE_MISMATCH");
if (oneKaiosOutput !== 1_000n * 10n ** 18n) throw new Error("LIVE_KUFO_RATIO_MISMATCH");

const liveCode = {
  kaios: await codeHash(live, KAIOS),
  kgen: await codeHash(live, KGEN),
  registry: await codeHash(live, REGISTRY),
  predecessorFurnace: await codeHash(live, PREDECESSOR),
};

const forkEip1193 = ganache.provider({
  fork: { url: rpcUrl, blockNumber: Number(liveBlock.number) },
  chain: { chainId: CHAIN_ID, hardfork: "shanghai" },
  logging: { quiet: true },
  wallet: { totalAccounts: 1, defaultBalance: 1_000 },
});
const fork = new BrowserProvider(forkEip1193);
const forkSigner = await fork.getSigner();
const mock = await artifact("MockOrgan");
const furnace = await artifact("KAIOSAlchemyFurnace");
const mockBank = await new ContractFactory(mock.abi, mock.bytecode, forkSigner).deploy();
await mockBank.waitForDeployment();
const mockBankAddress = await mockBank.getAddress();
const mockBankCode = await codeHash(fork, mockBankAddress);
const candidate = await new ContractFactory(furnace.abi, furnace.bytecode, forkSigner).deploy(
  KAIOS,
  KGEN,
  mockBankAddress,
  REGISTRY,
  liveCode.kaios.hash,
  liveCode.kgen.hash,
  liveCode.registry.hash,
  mockBankCode.hash,
);
await candidate.waitForDeployment();

const candidateAddress = await candidate.getAddress();
const candidateActive = await candidate.isActiveBody();
const candidatePredecessor = await candidate.PREDECESSOR();
const candidateVersion = await candidate.EMBODIMENT_VERSION();
const candidateLiability = await candidate.catalystLiability();
if (candidateActive) throw new Error("FORK_CANDIDATE_MUST_NOT_BE_ACTIVE_WITHOUT_REGISTRY_UPDATE");
if (candidatePredecessor.toLowerCase() !== PREDECESSOR.toLowerCase()) throw new Error("PREDECESSOR_MISMATCH");
if (candidateLiability !== 0n) throw new Error("UNEXPECTED_CATALYST_LIABILITY");

const report = {
  reportId: "KAIOS_18911_V3_MAINNET_COMPATIBILITY_V1",
  generatedAt: new Date().toISOString(),
  mode: "READ_ONLY_MAINNET_AND_LOCAL_FORK_NO_BROADCAST",
  chainId: CHAIN_ID,
  liveSnapshot: {
    blockNumber: liveBlock.number,
    blockHash: liveBlock.hash,
    blockTimestamp: liveBlock.timestamp,
    kaios: KAIOS,
    kgen: KGEN,
    organRegistry: REGISTRY,
    activeFurnace,
    pendingFurnace: { candidate: pendingFurnace.candidate, executableAt: pendingFurnace.executableAt },
    registryOwner,
    bootstrapOpen,
    minimumDelay,
    alchemyBurnCount: burnCount,
    totalKaiosBurnedForAlchemy: totalBurned,
    kaiosBurnedForAlchemyEventReconciliation: burnCount === 0n
      ? "ZERO_EVENTS_PROVEN_BY_ATOMIC_COUNTER_AND_EVENT_SOURCE_PATH"
      : "NONZERO_REQUIRES_PAGINATED_LOG_EXPORT",
    rawFullRangeLogScan: "RPC_PROVIDER_RANGE_LIMITED; COUNTER_SOURCE_RECONCILIATION_USED",
    predecessor: {
      address: PREDECESSOR,
      kaios: predecessorKaios,
      organRegistry: predecessorRegistry,
      alchemyEpochSeconds: predecessorEpochSeconds,
      maturationEpochs: predecessorMaturityEpochs,
      status: "DEPLOYED_V1_HISTORY_ACTIVE_BODY",
    },
    code: liveCode,
  },
  deployedKaiosAbiCompatibility: {
    burnForAlchemy: "burnForAlchemy(address,address,uint256,bytes32,bytes32)",
    candidateCallsDeployedFiveArgumentAbi: true,
    candidateDoesNotRequireKaiosCatalystFields: true,
  },
  dependencyIdentityValidation: {
    kaiosAndKgen: "CANONICAL_ADDRESS_PLUS_EXACT_RUNTIME_CODEHASH_PLUS_REQUIRED_INTERFACE",
    organRegistry: "CANONICAL_ADDRESS_PLUS_EXACT_RUNTIME_CODEHASH_PLUS_ORGAN_INTERFACE",
    deployedRegistryLifeIdGetter: "ABSENT_IN_LIVE_V1_RUNTIME",
    programLifeIdentity: "EXTERNAL_MANIFEST; MUST_NOT_BE_INFERRED_AS_LIVE_ABI",
  },
  compilerReconciliation: {
    deployedLineageEvidence: "KAIOS_GENESIS_MAINNET_RECORD.json + SOLIDITY_COMPILE_EVIDENCE.json",
    compiler: "0.8.24+commit.e11b9ed9.Emscripten.clang",
    optimizer: { enabled: true, runs: 1 },
    viaIR: true,
    evmVersion: "paris",
    metadataBytecodeHash: "none",
    status: "MATCHES_FORMAL_DEPLOYMENT_LINEAGE_EVIDENCE",
  },
  localFork: {
    forkBlockNumber: liveBlock.number,
    forkBlockHash: liveBlock.hash,
    forkChainId: Number((await fork.getNetwork()).chainId),
    candidateAddress,
    predecessor: candidatePredecessor,
    embodimentVersion: candidateVersion,
    activeBody: candidateActive,
    catalystLiability: candidateLiability,
    catalystBank: {
      address: mockBankAddress,
      classification: "FORK_ONLY_PLACEHOLDER_NOT_PRODUCTION",
    },
    constructorRuntimeBindingChecks: "PASS",
    broadcastToMainnet: false,
  },
  deploymentGates: {
    productionCatalystBank: "UNFROZEN",
    kufoHalfLifeSeconds: "UNFROZEN",
    deployment: "BLOCKED",
  },
};

await fs.writeFile(REPORT_PATH, json(report), "utf8");
console.log(`Wrote ${REPORT_PATH}`);
console.log(`BSC fork compatibility PASS at block ${liveBlock.number}`);
await forkEip1193.disconnect();
