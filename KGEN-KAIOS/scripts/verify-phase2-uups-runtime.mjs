import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  Contract,
  Interface,
  JsonRpcProvider,
  getAddress,
  getCreateAddress,
  keccak256,
} from "ethers";
import {
  immutableReferenceRanges,
  patchUupsSelfAddress,
  verifyUupsRuntime,
} from "../tools/uups-runtime-verifier.mjs";

const root = path.resolve(import.meta.dirname, "..");
const artifact = (name) => JSON.parse(fs.readFileSync(path.join(root, "artifacts", `${name}.json`), "utf8"));
const output = (value) => JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item, 2);
if (!process.env.BSC_MAINNET_RPC_URL) throw new Error("BSC_MAINNET_RPC_URL_MISSING");
const provider = new JsonRpcProvider(process.env.BSC_MAINNET_RPC_URL);
const network = await provider.getNetwork();
if (network.chainId !== 56n) throw new Error(`CHAIN_ID_MISMATCH:${network.chainId}`);

const DEPLOYER = getAddress("0xb3C54ca96De0dED4Ca0151F629ff9781506ba261");
const MOTHER = getAddress("0xCd60BF474e691F2484950a0276Eaf507616Ca4b9");
const JADE = getAddress("0xc15e08834fca9f2d3462a3f8f0bc30524d6dd756");
const GUANYIN = getAddress("0xebeeac6d09d2d28db8010b0923442c9eb2b702fe");
const BANK = getAddress("0x11d34c0F723aCd334B8F95076f73F07f06202aab");
const FURNACE = getAddress("0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1");
const ELIGIBILITY_IMPLEMENTATION = getAddress("0x0D21328BdbE12e9E69838Fd33E3C20F0b27f2779");
const ELIGIBILITY_TX = "0x039c28a90b5a87be6826c8f9323f9489eee67474b1de9fdd8c2377bc4464b93b";
const EXPECTED_UUPS_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const EXPECTED_NONCE = 57;
const config = JSON.parse(fs.readFileSync(path.join(root, "config", "phase2-mainnet-config.final-review.json"), "utf8"));

const eligibilityArtifact = artifact("CelestialEligibility_Upgradeable");
const actualRuntime = await provider.getCode(ELIGIBILITY_IMPLEMENTATION);
const runtimeVerification = verifyUupsRuntime({
  artifact: eligibilityArtifact,
  deployedRuntime: actualRuntime,
  implementationAddress: ELIGIBILITY_IMPLEMENTATION,
});
if (runtimeVerification.status !== "PASS") throw new Error("PATCHED_RUNTIME_MISMATCH");

const deploymentTx = await provider.getTransaction(ELIGIBILITY_TX);
const deploymentReceipt = await provider.getTransactionReceipt(ELIGIBILITY_TX);
const creationBytecodeMatch = deploymentTx?.data?.toLowerCase() === eligibilityArtifact.bytecode.toLowerCase();
if (!creationBytecodeMatch || deploymentReceipt?.status !== 1
  || getAddress(deploymentReceipt.contractAddress) !== ELIGIBILITY_IMPLEMENTATION) {
  throw new Error("ELIGIBILITY_CREATION_LINEAGE_MISMATCH");
}

const eligibility = new Contract(ELIGIBILITY_IMPLEMENTATION, eligibilityArtifact.abi, provider);
const [version, proxiableUUID, defaultAdminRole, governanceRole, upgraderRole] = await Promise.all([
  eligibility.version(),
  eligibility.proxiableUUID(),
  eligibility.DEFAULT_ADMIN_ROLE(),
  eligibility.GOVERNANCE_ROLE(),
  eligibility.UPGRADER_ROLE(),
]);
if (proxiableUUID !== EXPECTED_UUPS_SLOT) throw new Error(`PROXIABLE_UUID_MISMATCH:${proxiableUUID}`);

const roleSubjects = [DEPLOYER, MOTHER, JADE, GUANYIN];
const roleState = {};
for (const subject of roleSubjects) {
  roleState[subject] = {
    DEFAULT_ADMIN_ROLE: await eligibility.hasRole(defaultAdminRole, subject),
    GOVERNANCE_ROLE: await eligibility.hasRole(governanceRole, subject),
    UPGRADER_ROLE: await eligibility.hasRole(upgraderRole, subject),
  };
  if (Object.values(roleState[subject]).some(Boolean)) throw new Error(`UNEXPECTED_IMPLEMENTATION_ROLE:${subject}`);
}

const initializeData = new Interface(eligibilityArtifact.abi).encodeFunctionData("initialize", [
  BANK,
  MOTHER,
  MOTHER,
  GUANYIN,
  FURNACE,
  config.parameters.celestialEligibility.requiredDestinationCode,
]);
let initializerLocked = false;
try {
  await provider.call({ to: ELIGIBILITY_IMPLEMENTATION, from: DEPLOYER, data: initializeData });
} catch {
  initializerLocked = true;
}
if (!initializerLocked) throw new Error("IMPLEMENTATION_INITIALIZER_NOT_LOCKED");

const latestNonce = await provider.getTransactionCount(DEPLOYER, "latest");
const pendingNonce = await provider.getTransactionCount(DEPLOYER, "pending");
if (latestNonce !== pendingNonce || latestNonce !== EXPECTED_NONCE) {
  throw new Error(`LIVE_NONCE_MISMATCH:${latestNonce}/${pendingNonce}`);
}

const remaining = [
  ["CELESTIAL_ELIGIBILITY_PROXY", "ERC1967Proxy"],
  ["KGEN_RESERVE_REDEMPTION_IMPLEMENTATION", "KGENReserveRedemption_Upgradeable"],
  ["KGEN_RESERVE_REDEMPTION_PROXY", "ERC1967Proxy"],
  ["CELESTIAL_CAPITAL_COMMITMENT_IMPLEMENTATION", "CelestialCapitalCommitment_Upgradeable"],
  ["CELESTIAL_CAPITAL_COMMITMENT_PROXY", "ERC1967Proxy"],
].map(([identity, contractName], offset) => ({
  identity,
  contractName,
  nonce: latestNonce + offset,
  predictedAddress: getCreateAddress({ from: DEPLOYER, nonce: latestNonce + offset }),
}));
for (const item of remaining) {
  item.codePresent = (await provider.getCode(item.predictedAddress)) !== "0x";
  if (item.codePresent) throw new Error(`PREDICTED_ADDRESS_OCCUPIED:${item.predictedAddress}`);
}

const futureRuntimePlans = remaining
  .filter(({ contractName }) => contractName.endsWith("_Upgradeable"))
  .map(({ identity, contractName, predictedAddress }) => {
    const compiled = artifact(contractName);
    const patchedRuntime = patchUupsSelfAddress(
      compiled.deployedBytecode,
      compiled.immutableReferences,
      predictedAddress,
    );
    return {
      identity,
      contractName,
      predictedAddress,
      status: "PREDICTED_ONLY_NOT_DEPLOYED",
      artifactBytes: (compiled.deployedBytecode.length - 2) / 2,
      immutableReferences: immutableReferenceRanges(compiled.immutableReferences),
      rawArtifactRuntimeHash: keccak256(compiled.deployedBytecode),
      patchedExpectedRuntimeHash: keccak256(patchedRuntime),
      verificationRule: "PATCH_UUPS_SELF_ADDRESS_AND_COMPARE_EXACT_THEN_NORMALIZE_REFERENCES",
    };
  });

const forkEvidence = JSON.parse(fs.readFileSync(
  path.join(root, "reports", "KAIOS_CIVILIZATION_PHASE2_MAINNET_FORK_REHEARSAL.json"),
  "utf8",
));
const remainingDeploymentGas = [
  forkEvidence.forkDeployments.eligibility.receipts.proxy.gasUsed,
  forkEvidence.forkDeployments.reserve.receipts.implementation.gasUsed,
  forkEvidence.forkDeployments.reserve.receipts.proxy.gasUsed,
  forkEvidence.forkDeployments.capital.receipts.implementation.gasUsed,
  forkEvidence.forkDeployments.capital.receipts.proxy.gasUsed,
].reduce((sum, value) => sum + BigInt(value), 0n);
const transactionGas = (names) => names.reduce((sum, name) => sum + BigInt(forkEvidence.transactions[name].gasUsed), 0n);
const governanceGas = transactionGas([
  "registerEligibility_propose", "registerEligibility_approve", "registerEligibility_execute",
  "registerReserve_propose", "registerReserve_approve", "registerReserve_execute",
  "registerCapital_propose", "registerCapital_approve", "registerCapital_execute",
  "finalizeEligibilityGovernance", "finalizeReserveGovernance", "finalizeCapitalGovernance",
  "setMotherContributionVerifier_propose", "setMotherContributionVerifier_approve",
  "setMotherContributionVerifier_execute",
]);
const directGas = remainingDeploymentGas + governanceGas;
const bufferedGas = (directGas * 120n + 99n) / 100n;
const feeData = await provider.getFeeData();
if (!feeData.gasPrice) throw new Error("GAS_PRICE_UNAVAILABLE");
const balances = Object.fromEntries(await Promise.all([
  ["deploymentSigner", DEPLOYER], ["mother", MOTHER], ["jadeEmperor", JADE], ["guanyin", GUANYIN],
].map(async ([name, address]) => [name, (await provider.getBalance(address)).toString()])));

const evidence = {
  status: "PASS",
  environment: "BSC_MAINNET_READ_ONLY",
  mainnetTransactionSentThisFix: false,
  chainId: 56,
  blockNumber: await provider.getBlockNumber(),
  incident: {
    implementation: ELIGIBILITY_IMPLEMENTATION,
    transactionHash: ELIGIBILITY_TX,
    blockNumber: deploymentReceipt.blockNumber,
    creationBytecodeMatch,
  },
  eligibilityImplementation: {
    address: ELIGIBILITY_IMPLEMENTATION,
    version,
    proxiableUUID,
    initializerLocked,
    ownerFunctionExposed: eligibilityArtifact.abi.some((item) => item.type === "function" && item.name === "owner"),
    roleState,
    runtimeVerification,
  },
  remainingDeployment: {
    liveNonce: { latest: latestNonce, pending: pendingNonce },
    actions: remaining,
    futureImplementationRuntimePlans: futureRuntimePlans,
  },
  gasAndFunding: {
    source: "AUDITED_MAINNET_FORK_RECEIPTS",
    remainingDeploymentGas,
    governanceAndFinalizationGas: governanceGas,
    directGas,
    bufferedGas,
    gasPriceWei: feeData.gasPrice,
    bufferedRequiredWei: bufferedGas * feeData.gasPrice,
    balancesWei: balances,
  },
};

if (process.argv.includes("--write-evidence")) {
  fs.writeFileSync(
    path.join(root, "reports", "PHASE2_UUPS_RUNTIME_VERIFICATION_2026-08-14.json"),
    `${output(evidence)}\n`,
  );
}
console.log(output(evidence));
