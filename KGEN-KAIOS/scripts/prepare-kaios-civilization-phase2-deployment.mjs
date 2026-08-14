import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  ContractFactory,
  Interface,
  getAddress,
  getCreateAddress,
  id,
  keccak256,
  sha256,
} from "ethers";

const root = path.resolve(import.meta.dirname, "..");
const artifact = (name) => JSON.parse(fs.readFileSync(path.join(root, "artifacts", `${name}.json`), "utf8"));
const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required (public deployment input only)`);
  return value;
};
const requiredUint = (name) => {
  const value = BigInt(required(name));
  if (value < 0n) throw new Error(`${name} must be unsigned`);
  return value;
};
const output = (value) => JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item, 2);
const configBytes = fs.readFileSync(path.join(root, "config", "phase2-mainnet-config.final-review.json"));
const phase2Config = JSON.parse(configBytes.toString("utf8"));
const configUint = (section, name) => {
  const value = BigInt(phase2Config.parameters[section][name]);
  if (value < 0n) throw new Error(`${section}.${name} must be unsigned`);
  return value;
};

const CHAIN_ID = 56;
const KGEN = getAddress("0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be");
const KAIOS = getAddress("0xD4E67B3a69e41524c424150E6b6e921b01D036db");
const BANK = getAddress("0x11d34c0F723aCd334B8F95076f73F07f06202aab");
const FURNACE = getAddress("0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1");
const BANK_GOVERNANCE = getAddress("0xa2792fBDCc8A8AaC364053431D44E0a8D335E166");
const MOTHER = getAddress("0xCd60BF474e691F2484950a0276Eaf507616Ca4b9");
const JADE_EMPEROR = getAddress("0xc15e08834fca9f2d3462a3f8f0bc30524d6dd756");
const GUANYIN = getAddress("0xebeeac6d09d2d28db8010b0923442c9eb2b702fe");
const GOVERNANCE_DELAY = 3_600;

const deployer = getAddress(required("PHASE2_DEPLOYMENT_SIGNER_ADDRESS"));
const startNonce = requiredUint("PHASE2_DEPLOYMENT_SIGNER_NONCE");
const minimumKgenReserve = configUint("reserveRedemption", "minimumKgenReserveWei");
const maxKgenPerTx = configUint("reserveRedemption", "maxKgenPerTransactionWei");
const maxKgenPerDay = configUint("reserveRedemption", "maxKgenPerUtcDayWei");
const maxKaiosPerTx = configUint("reserveRedemption", "maxKaiosPerTransactionWei");
const maxKaiosPerDay = configUint("reserveRedemption", "maxKaiosPerUtcDayWei");
const capitalLockSeconds = configUint("capitalCommitment", "minimumLockPeriodSeconds");
const destinationCode = phase2Config.parameters.celestialEligibility.requiredDestinationCode;
const contributionVerifier = getAddress(phase2Config.governance.contributionVerifier);
if (!/^0x[0-9a-fA-F]{64}$/.test(destinationCode) || destinationCode === `0x${"0".repeat(64)}`) {
  throw new Error("PHASE2_SPECIAL_ALCHEMY_DESTINATION_CODE must be a nonzero bytes32");
}
if (maxKgenPerTx === 0n || maxKgenPerDay < maxKgenPerTx) throw new Error("invalid KGEN limits");
if (maxKaiosPerTx === 0n || maxKaiosPerDay < maxKaiosPerTx) throw new Error("invalid KAIOS limits");
if (capitalLockSeconds === 0n || capitalLockSeconds > 2n ** 64n - 1n) throw new Error("invalid capital lock");

const actions = [];
const addressAt = (offset) => getCreateAddress({ from: deployer, nonce: startNonce + BigInt(offset) });
async function creationData(name, args = []) {
  return (await new ContractFactory(artifact(name).abi, artifact(name).bytecode).getDeployTransaction(...args)).data;
}
async function appendDirect(name, args, identity) {
  const expectedAddress = addressAt(actions.length);
  actions.push({
    order: actions.length + 1,
    identity,
    contract: name,
    nonce: (startNonce + BigInt(actions.length)).toString(),
    expectedAddress,
    creationData: await creationData(name, args),
    creationDataHash: keccak256(await creationData(name, args)),
    status: "UNSIGNED_NOT_DEPLOYED",
  });
  return expectedAddress;
}
async function appendUpgradeable(name, initializeArgs, identity) {
  const implementation = await appendDirect(name, [], `${identity}_IMPLEMENTATION`);
  const initializer = new Interface(artifact(name).abi).encodeFunctionData("initialize", initializeArgs);
  const proxy = await appendDirect("ERC1967Proxy", [implementation, initializer], `${identity}_PROXY`);
  return { implementation, proxy, initializer };
}

const eligibility = await appendUpgradeable(
  "CelestialEligibility_Upgradeable",
  [BANK, MOTHER, MOTHER, GUANYIN, FURNACE, destinationCode],
  "CELESTIAL_ELIGIBILITY",
);
const reserve = await appendUpgradeable(
  "KGENReserveRedemption_Upgradeable",
  [
    BANK,
    MOTHER,
    MOTHER,
    GUANYIN,
    KGEN,
    KAIOS,
    eligibility.proxy,
    minimumKgenReserve,
    maxKgenPerTx,
    maxKgenPerDay,
    maxKaiosPerTx,
    maxKaiosPerDay,
    false,
  ],
  "KGEN_RESERVE_REDEMPTION",
);
const capital = await appendUpgradeable(
  "CelestialCapitalCommitment_Upgradeable",
  [BANK, MOTHER, MOTHER, GUANYIN, KAIOS, eligibility.proxy, capitalLockSeconds],
  "CELESTIAL_CAPITAL_COMMITMENT",
);

const bankInterface = new Interface(artifact("LingxiaoCelestialBank18888_Upgradeable").abi);
const governanceInterface = new Interface(artifact("BankGovernance_Upgradeable").abi);
const registrations = [
  [id("KAIOS.BANK.MODULE.CELESTIAL_ELIGIBILITY"), eligibility.proxy, id("CelestialEligibility_Upgradeable:1.0.0")],
  [id("KAIOS.BANK.MODULE.KGEN_RESERVE_REDEMPTION"), reserve.proxy, id("KGENReserveRedemption_Upgradeable:1.0.0")],
  [id("KAIOS.BANK.MODULE.CELESTIAL_CAPITAL_COMMITMENT"), capital.proxy, id("CelestialCapitalCommitment_Upgradeable:1.0.0")],
].map(([moduleId, proxy, versionHash]) => {
  const bankCall = bankInterface.encodeFunctionData("configureModule", [moduleId, proxy, versionHash, 0, 0, false]);
  return {
    moduleId,
    proxy,
    initialState: "REGISTERED_BUT_INACTIVE",
    proposalTarget: BANK,
    proposalValue: "0",
    proposalData: bankCall,
    proposalDataHash: keccak256(bankCall),
    governanceFlow: ["MOTHER_PROPOSE", "JADE_EMPEROR_APPROVE", `WAIT_${GOVERNANCE_DELAY}_SECONDS`, "EXECUTE"],
  };
});

const moduleControls = [
  ["CELESTIAL_ELIGIBILITY", eligibility.proxy, "pause"],
  ["KGEN_RESERVE_REDEMPTION", reserve.proxy, "pause"],
  ["CELESTIAL_CAPITAL_COMMITMENT", capital.proxy, "pause"],
].map(([identity, target, functionName]) => {
  const contractName = identity === "CELESTIAL_ELIGIBILITY"
    ? "CelestialEligibility_Upgradeable"
    : identity === "KGEN_RESERVE_REDEMPTION"
      ? "KGENReserveRedemption_Upgradeable"
      : "CelestialCapitalCommitment_Upgradeable";
  const data = new Interface(artifact(contractName).abi).encodeFunctionData(functionName);
  return {
    identity,
    target,
    signer: GUANYIN,
    function: `${functionName}()`,
    calldata: data,
    calldataHash: keccak256(data),
    requiredBeforeReadOnlyValidation: true,
  };
});

const verifierData = new Interface(artifact("CelestialEligibility_Upgradeable").abi)
  .encodeFunctionData("setContributionVerifier", [contributionVerifier, true]);
const futureActivation = [
  ["CELESTIAL_ELIGIBILITY_UNPAUSE", eligibility.proxy, "CelestialEligibility_Upgradeable", "unpause", []],
  ["KGEN_RESERVE_REDEMPTION_UNPAUSE", reserve.proxy, "KGENReserveRedemption_Upgradeable", "unpause", []],
  ["CELESTIAL_CAPITAL_COMMITMENT_UNPAUSE", capital.proxy, "CelestialCapitalCommitment_Upgradeable", "unpause", []],
  ["KGEN_RESERVE_REDEMPTION_ENABLE", reserve.proxy, "KGENReserveRedemption_Upgradeable", "setRedemptionEnabled", [true]],
].map(([identity, target, contractName, functionName, args]) => {
  const data = new Interface(artifact(contractName).abi).encodeFunctionData(functionName, args);
  return {
    identity,
    target,
    proposalValue: "0",
    proposalData: data,
    proposalDataHash: keccak256(data),
    governanceFlow: ["NEW_HUMAN_AUTHORIZATION", "MOTHER_PROPOSE", "JADE_EMPEROR_APPROVE", `WAIT_${GOVERNANCE_DELAY}_SECONDS`, "EXECUTE"],
  };
});

console.log(output({
  status: "UNSIGNED_PHASE2_DEPLOYMENT_PLAN_NO_TRANSACTION",
  chainId: CHAIN_ID,
  deployer,
  startNonce,
  formal: { KGEN, KAIOS, BANK, FURNACE, BANK_GOVERNANCE },
  governance: { MOTHER, JADE_EMPEROR, GUANYIN, delaySeconds: GOVERNANCE_DELAY },
  canonicalConfig: {
    path: "config/phase2-mainnet-config.final-review.json",
    sha256: sha256(configBytes),
    status: phase2Config.status,
  },
  policy: {
    redemptionInitiallyEnabled: false,
    minimumKgenReserve,
    maxKgenPerTx,
    maxKgenPerDay,
    maxKaiosPerTx,
    maxKaiosPerDay,
    destinationCode,
    capitalLockSeconds,
  },
  deployments: actions,
  initialModuleControls: moduleControls,
  moduleRegistration: registrations,
  postFinalizationGovernanceConfiguration: [{
    identity: "CONTRIBUTION_VERIFIER",
    target: eligibility.proxy,
    verifier: contributionVerifier,
    proposalValue: "0",
    proposalData: verifierData,
    proposalDataHash: keccak256(verifierData),
    governanceFlow: ["MOTHER_PROPOSE", "JADE_EMPEROR_APPROVE", `WAIT_${GOVERNANCE_DELAY}_SECONDS`, "EXECUTE"],
  }],
  separateFutureActivationNotAuthorized: futureActivation,
  governanceInterfaceChecks: {
    propose: governanceInterface.getFunction("propose").selector,
    approve: governanceInterface.getFunction("approve").selector,
    execute: governanceInterface.getFunction("execute").selector,
  },
  futureOnly: {
    kgenBankTaxRedirect: "NOT_INCLUDED_REQUIRES_SEPARATE_HUMAN_MAINNET_AUTHORIZATION",
    setTaxWallets: "NOT_ENCODED",
  },
}));
