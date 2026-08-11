import process from "node:process";
import { ContractFactory, Interface, getAddress, getCreateAddress, id } from "ethers";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const readArtifact = (name) => JSON.parse(fs.readFileSync(path.join(root, "artifacts", `${name}.json`), "utf8"));
const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required (public address/parameter only)`);
  return value;
};
const requiredUint = (name) => {
  const value = BigInt(required(name));
  if (value < 0n) throw new Error(`${name} must be unsigned`);
  return value;
};
const deployer = getAddress(required("MAINNET_DEPLOYMENT_SIGNER_ADDRESS"));
const startNonce = requiredUint("MAINNET_DEPLOYMENT_SIGNER_NONCE");
const admin = getAddress(process.env.FORMAL_BANK_ADMIN ?? "0xCd60BF474e691F2484950a0276Eaf507616Ca4b9");
const bootstrapUpgrader = getAddress(process.env.BOOTSTRAP_BANK_UPGRADER ?? admin);
const distinctGovernanceApprover = getAddress(required("FORMAL_BANK_GOVERNANCE_APPROVER"));
const formalPauser = getAddress(required("FORMAL_BANK_PAUSER"));
if (distinctGovernanceApprover === admin) throw new Error("FORMAL_BANK_GOVERNANCE_APPROVER must be distinct from the bootstrap proposer");
const kgen = getAddress("0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be");
const exchange11520 = getAddress("0xd0605F4EF10e5C1438F11AF9edc36926769239d6");
const legacyTreasury8888 = getAddress("0x2caE692310b5A89C44c4E09Ba9F26385359d1Aa9");
const governanceDelay = 3_600n;
const celestialSalaryBase = requiredUint("CELESTIAL_SALARY_BASE_WEI");
const furnaceEpochSeconds = requiredUint("ALCHEMY_FURNACE_EPOCH_SECONDS");
if (celestialSalaryBase === 0n || celestialSalaryBase > (1n << 128n) - 1n) {
  throw new Error("CELESTIAL_SALARY_BASE_WEI must be a nonzero uint128");
}
if (furnaceEpochSeconds === 0n) throw new Error("ALCHEMY_FURNACE_EPOCH_SECONDS must be nonzero");

const modulePolicies = {
  CelestialSeat500_Upgradeable: {
    perTransactionLimit: requiredUint("SEAT500_PER_TRANSACTION_LIMIT_WEI"),
    epochLimit: requiredUint("SEAT500_DAILY_LIMIT_WEI"),
    active: true,
  },
  CivilizationAllocation_Upgradeable: {
    perTransactionLimit: requiredUint("CIVILIZATION_ALLOCATION_PER_TRANSACTION_LIMIT_WEI"),
    epochLimit: requiredUint("CIVILIZATION_ALLOCATION_DAILY_LIMIT_WEI"),
    active: true,
  },
  EconomicRouter8888_Upgradeable: {
    perTransactionLimit: requiredUint("ECONOMIC_8888_PER_TRANSACTION_LIMIT_WEI"),
    epochLimit: requiredUint("ECONOMIC_8888_DAILY_LIMIT_WEI"),
    active: true,
  },
  ExchangeSettlement11520_Upgradeable: {
    perTransactionLimit: requiredUint("EXCHANGE_11520_PER_TRANSACTION_LIMIT_WEI"),
    epochLimit: requiredUint("EXCHANGE_11520_DAILY_LIMIT_WEI"),
    active: true,
  },
  BankRiskController_Upgradeable: {
    perTransactionLimit: 0n,
    epochLimit: 0n,
    active: true,
  },
  BankGovernance_Upgradeable: {
    perTransactionLimit: 0n,
    epochLimit: 0n,
    active: true,
  },
  BankMigration_Upgradeable: {
    perTransactionLimit: 0n,
    epochLimit: 0n,
    active: false,
  },
};
const reserveMinimum = requiredUint("BANK_RESERVE_MINIMUM_WEI");
const riskAlertThreshold = requiredUint("BANK_RISK_ALERT_THRESHOLD_WEI");
if (riskAlertThreshold < reserveMinimum) throw new Error("BANK_RISK_ALERT_THRESHOLD_WEI must be >= BANK_RESERVE_MINIMUM_WEI");

const addressAt = (offset) => getCreateAddress({ from: deployer, nonce: startNonce + BigInt(offset) });
const actions = [];
async function deploymentData(name, args = []) {
  const artifact = readArtifact(name);
  return (await new ContractFactory(artifact.abi, artifact.bytecode).getDeployTransaction(...args)).data;
}
async function appendDirect(name, args, identity) {
  const expectedAddress = addressAt(actions.length);
  actions.push({
    order: actions.length + 1,
    kind: "DEPLOY_CONTRACT",
    identity,
    contract: name,
    expectedAddress,
    actualAddress: null,
    autoBackfill: "SUCCESSFUL_RECEIPT_CONTRACT_ADDRESS_THEN_CODEHASH_VERIFY",
    data: await deploymentData(name, args),
  });
  return expectedAddress;
}
async function appendUpgradeable(name, initializeArgs, identity) {
  const implementation = await appendDirect(name, [], `${identity}_IMPLEMENTATION`);
  const initializer = new Interface(readArtifact(name).abi).encodeFunctionData("initialize", initializeArgs);
  const proxy = await appendDirect("ERC1967Proxy", [implementation, initializer], `${identity}_PROXY`);
  return { implementation, proxy };
}

const registry = await appendDirect("KAIOSOrganRegistry", [admin, governanceDelay], "KAIOS_ORGAN_REGISTRY");
const bank = await appendUpgradeable(
  "LingxiaoCelestialBank18888_Upgradeable",
  [admin, bootstrapUpgrader, kgen],
  "LINGXIAO_18888_BANK",
);
const economic8888 = await appendUpgradeable(
  "GaolaozhuangCommercialBank8888_Upgradeable",
  [admin, bootstrapUpgrader, kgen, bank.proxy, legacyTreasury8888],
  "GAOLAOZHUANG_8888_COMMERCIAL_BANK",
);
const seat = await appendUpgradeable(
  "CelestialSeat500_Upgradeable",
  [bank.proxy, admin, bootstrapUpgrader, celestialSalaryBase],
  "CELESTIAL_SEAT_500",
);
const allocation = await appendUpgradeable(
  "CivilizationAllocation_Upgradeable",
  [bank.proxy, admin, bootstrapUpgrader],
  "CIVILIZATION_ALLOCATION",
);
const router8888 = await appendUpgradeable(
  "EconomicRouter8888_Upgradeable",
  [bank.proxy, admin, bootstrapUpgrader, economic8888.proxy],
  "ECONOMIC_ROUTER_8888",
);
const settlement11520 = await appendUpgradeable(
  "ExchangeSettlement11520_Upgradeable",
  [bank.proxy, admin, bootstrapUpgrader, exchange11520],
  "EXCHANGE_SETTLEMENT_11520",
);
const risk = await appendUpgradeable(
  "BankRiskController_Upgradeable",
  [bank.proxy, admin, bootstrapUpgrader],
  "BANK_RISK_CONTROLLER",
);
const governance = await appendUpgradeable(
  "BankGovernance_Upgradeable",
  [bank.proxy, admin, bootstrapUpgrader, governanceDelay],
  "BANK_GOVERNANCE",
);
const migration = await appendUpgradeable(
  "BankMigration_Upgradeable",
  [bank.proxy, admin, bootstrapUpgrader],
  "BANK_MIGRATION",
);
const kaios = await appendDirect("KAIOS", [kgen, bank.proxy, registry], "KAIOS_TOKEN_CORE");
const furnace18911 = await appendDirect(
  "KAIOSAlchemyFurnace",
  [kaios, registry, furnaceEpochSeconds],
  "ALCHEMY_FURNACE_18911",
);

const deployedModules = {
  CelestialSeat500_Upgradeable: seat,
  CivilizationAllocation_Upgradeable: allocation,
  EconomicRouter8888_Upgradeable: router8888,
  ExchangeSettlement11520_Upgradeable: settlement11520,
  BankRiskController_Upgradeable: risk,
  BankGovernance_Upgradeable: governance,
  BankMigration_Upgradeable: migration,
};
const moduleIds = {
  CelestialSeat500_Upgradeable: id("KAIOS.BANK.MODULE.CELESTIAL_SEAT_500"),
  CivilizationAllocation_Upgradeable: id("KAIOS.BANK.MODULE.CIVILIZATION_ALLOCATION"),
  EconomicRouter8888_Upgradeable: id("KAIOS.BANK.MODULE.ECONOMIC_ROUTER_8888"),
  ExchangeSettlement11520_Upgradeable: id("KAIOS.BANK.MODULE.EXCHANGE_SETTLEMENT_11520"),
  BankRiskController_Upgradeable: id("KAIOS.BANK.MODULE.RISK_CONTROLLER"),
  BankGovernance_Upgradeable: id("KAIOS.BANK.MODULE.GOVERNANCE"),
  BankMigration_Upgradeable: id("KAIOS.BANK.MODULE.MIGRATION"),
};
const bankInterface = new Interface(readArtifact("LingxiaoCelestialBank18888_Upgradeable").abi);
const registryInterface = new Interface(readArtifact("KAIOSOrganRegistry").abi);
const riskInterface = new Interface(readArtifact("BankRiskController_Upgradeable").abi);
const governanceInterface = new Interface(readArtifact("BankGovernance_Upgradeable").abi);
const economic8888Interface = new Interface(readArtifact("GaolaozhuangCommercialBank8888_Upgradeable").abi);
const postDeployCalls = [];
const appendCall = (identity, target, signer, data) => postDeployCalls.push({
  order: postDeployCalls.length + 1,
  identity,
  target,
  signer,
  data,
  actualTransactionHash: null,
  autoBackfill: "SUCCESSFUL_RECEIPT_HASH_AND_BLOCK",
});

appendCall("BANK_BIND_KAIOS", bank.proxy, admin, bankInterface.encodeFunctionData("bindKAIOS", [kaios]));
appendCall("BANK_8888_BIND_KAIOS", economic8888.proxy, admin, economic8888Interface.encodeFunctionData("bindKAIOS", [kaios]));
appendCall(
  "GRANT_DISTINCT_GOVERNANCE_APPROVER",
  governance.proxy,
  admin,
  governanceInterface.encodeFunctionData("grantRole", [id("APPROVER_ROLE"), distinctGovernanceApprover]),
);
for (const [name, deployed] of Object.entries(deployedModules)) {
  const policy = modulePolicies[name];
  appendCall(
    `CONFIGURE_${name}`,
    bank.proxy,
    admin,
    bankInterface.encodeFunctionData("configureModule", [
      moduleIds[name],
      deployed.proxy,
      id(`${name}:${name === "CelestialSeat500_Upgradeable" ? "2.0.0" : "1.0.0"}`),
      policy.perTransactionLimit,
      policy.epochLimit,
      policy.active,
    ]),
  );
}
appendCall("SET_RISK_CONTROLLER", bank.proxy, admin, bankInterface.encodeFunctionData("setRiskController", [risk.proxy]));
appendCall(
  "APPLY_HUMAN_APPROVED_RISK_PARAMETERS",
  risk.proxy,
  admin,
  riskInterface.encodeFunctionData("applyRiskParameters", [reserveMinimum, riskAlertThreshold]),
);
for (const [organId, address, label] of [
  [id("KAIOS.ORGAN.EXCHANGE_TREASURY.11520"), exchange11520, "11520"],
  [id("KAIOS.ORGAN.LINGXIAO_BANK.18888"), bank.proxy, "18888"],
  [id("KAIOS.ORGAN.KAIOS"), kaios, "KAIOS"],
  [id("KAIOS.ORGAN.FURNACE.18911"), furnace18911, "18911"],
]) {
  appendCall(`REGISTRY_BOOTSTRAP_${label}`, registry, admin, registryInterface.encodeFunctionData("bootstrapOrgan", [organId, address]));
}
appendCall("REGISTRY_SEAL_BOOTSTRAP", registry, admin, registryInterface.encodeFunctionData("sealBootstrap"));
for (const [name, deployed] of Object.entries(deployedModules)) {
  appendCall(
    `FINALIZE_${name}_GOVERNANCE`,
    deployed.proxy,
    admin,
    new Interface(readArtifact(name).abi).encodeFunctionData("finalizeModuleGovernance", [governance.proxy]),
  );
}
appendCall("FINALIZE_BANK_GOVERNANCE", bank.proxy, admin, bankInterface.encodeFunctionData("finalizeGovernance", [governance.proxy]));
appendCall(
  "FINALIZE_BANK_8888_GOVERNANCE",
  economic8888.proxy,
  admin,
  economic8888Interface.encodeFunctionData("finalizeGovernance", [governance.proxy, formalPauser]),
);

const plan = {
  status: "UNSIGNED_MAINNET_DEPLOYMENT_PACKAGE_ONLY",
  mainnetTransactionAuthorized: false,
  chainId: 56,
  deployer,
  startNonce: startNonce.toString(),
  canon: {
    kgen,
    exchange11520,
    economic8888Proxy: economic8888.proxy,
    legacyTreasury8888,
    admin,
    bootstrapUpgrader,
    registry,
    bankProxy: bank.proxy,
    kaios,
    furnace18911,
    finalUpgrader: governance.proxy,
    governanceDelaySeconds: governanceDelay.toString(),
    distinctGovernanceApprover,
    formalPauser,
  },
  humanApprovedParameters: {
    celestialSalaryBaseWei: celestialSalaryBase.toString(),
    celestialSalaryCalendar: "MONTHLY_DAY_5_00_00_UTC_PLUS_8",
    furnaceEpochSeconds: furnaceEpochSeconds.toString(),
    reserveMinimumWei: reserveMinimum.toString(),
    riskAlertThresholdWei: riskAlertThreshold.toString(),
    modulePolicies,
  },
  predicted: { registry, bank, economic8888, ...deployedModules, kaios, furnace18911 },
  deploymentActions: actions,
  postDeployCalls,
  genesis: {
    amountInputAccepted: false,
    instruction: "Re-read formal KGEN totalSupply at execution block, call KAIOS.settleWhiteHoleMass(), verify receipt, then start Genesis Epoch and auto-generate inscription.",
  },
  blockers: [
    "RECONFIRM_SIGNER_CONTROL_BALANCE_NONCE_AND_ALL_CODEHASHES",
    "DISTINCT_GOVERNANCE_APPROVER_MUST_BE_GRANTED_AND_VERIFIED_BEFORE_FINALIZATION",
    "MAINNET_DEPLOY_APPROVED_NOT_RECEIVED",
  ],
};
process.stdout.write(`${JSON.stringify(plan, (_, value) => typeof value === "bigint" ? value.toString() : value, 2)}\n`);
