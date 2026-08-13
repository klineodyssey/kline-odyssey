import fs from "node:fs";
import path from "node:path";
import { BrowserProvider, Contract, ContractFactory, id } from "ethers";
import ganache from "ganache";

const root = path.resolve(import.meta.dirname, "..");
const activeProviders = new Set();

export const ETHER = 10n ** 18n;
export const ORGAN_FURNACE_18911 = id("KAIOS.ORGAN.FURNACE.18911");
export const ORGAN_WORMHOLE_511111 = id("KAIOS.ORGAN.WORMHOLE.511111");
export const ORGAN_KSHIP_CONVERTER = id("KAIOS.ORGAN.KSHIP.CONVERTER");
export const ORGAN_PAIR_REGISTRY = id("KAIOS.ORGAN.PAIR.REGISTRY");
export const ORGAN_KAIOS = id("KAIOS.ORGAN.KAIOS");
export const ORGAN_LINGXIAO_BANK_18888 = id("KAIOS.ORGAN.LINGXIAO_BANK.18888");
export const ORGAN_EXCHANGE_TREASURY_11520 = id("KAIOS.ORGAN.EXCHANGE_TREASURY.11520");
export const MODULE_CELESTIAL_SEAT_500 = id("KAIOS.BANK.MODULE.CELESTIAL_SEAT_500");
export const MODULE_CIVILIZATION_ALLOCATION = id("KAIOS.BANK.MODULE.CIVILIZATION_ALLOCATION");
export const MODULE_ECONOMIC_ROUTER_8888 = id("KAIOS.BANK.MODULE.ECONOMIC_ROUTER_8888");
export const MODULE_EXCHANGE_SETTLEMENT_11520 = id("KAIOS.BANK.MODULE.EXCHANGE_SETTLEMENT_11520");
export const MODULE_RISK_CONTROLLER = id("KAIOS.BANK.MODULE.RISK_CONTROLLER");
export const MODULE_GOVERNANCE = id("KAIOS.BANK.MODULE.GOVERNANCE");
export const MODULE_MIGRATION = id("KAIOS.BANK.MODULE.MIGRATION");
export const MODULE_KGEN_RESERVE_REDEMPTION = id("KAIOS.BANK.MODULE.KGEN_RESERVE_REDEMPTION");
export const MODULE_CELESTIAL_ELIGIBILITY = id("KAIOS.BANK.MODULE.CELESTIAL_ELIGIBILITY");
export const MODULE_CELESTIAL_CAPITAL_COMMITMENT = id("KAIOS.BANK.MODULE.CELESTIAL_CAPITAL_COMMITMENT");
export const SPECIAL_ALCHEMY_DESTINATION = id("KAIOS.ELIGIBILITY.SPECIAL.CELESTIAL.MASS");

export function artifact(name) {
  return JSON.parse(fs.readFileSync(path.join(root, "artifacts", `${name}.json`), "utf8"));
}

export async function deploy(name, signer, args = []) {
  const compiled = artifact(name);
  const factory = new ContractFactory(compiled.abi, compiled.bytecode, signer);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

export async function setupLineage({ delay = 3600, epochSeconds = 100, totalAccounts = 10 } = {}) {
  const eip1193 = ganache.provider({
    chain: { chainId: 31337, hardfork: "shanghai" },
    logging: { quiet: true },
    wallet: { deterministic: true, totalAccounts },
  });
  activeProviders.add(eip1193);
  const provider = new BrowserProvider(eip1193);
  provider.pollingInterval = 25;
  const signers = await Promise.all(Array.from({ length: totalAccounts }, (_, index) => provider.getSigner(index)));
  const [owner, treasury] = signers;

  const registry = await deploy("KAIOSOrganRegistry", owner, [await owner.getAddress(), delay]);
  const kgen = await deploy("MockKGEN", owner, [await owner.getAddress()]);
  const kaios = await deploy("KAIOS", owner, [
    await kgen.getAddress(),
    await treasury.getAddress(),
    await registry.getAddress(),
  ]);
  const kufo = await deploy("KUFO", owner, [await registry.getAddress(), await kaios.getAddress()]);
  const kship = await deploy("KSHIP", owner, [await registry.getAddress(), await kufo.getAddress()]);
  const furnace = await deploy("KAIOSAlchemyFurnace", owner, [
    await kaios.getAddress(),
    await registry.getAddress(),
    epochSeconds,
  ]);
  const wormhole = await deploy("KUFOClaimWormhole", owner, [
    await furnace.getAddress(),
    await kufo.getAddress(),
  ]);
  const converter = await deploy("KSHIPConverter", owner, [
    await kufo.getAddress(),
    await kship.getAddress(),
  ]);
  const pairRegistry = await deploy("KAIOSPairRegistry", owner, [await owner.getAddress()]);
  const exchangeTreasury11520 = await deploy("MockOrgan", owner);

  for (const [organId, contract] of [
    [ORGAN_FURNACE_18911, furnace],
    [ORGAN_WORMHOLE_511111, wormhole],
    [ORGAN_KSHIP_CONVERTER, converter],
    [ORGAN_PAIR_REGISTRY, pairRegistry],
    [ORGAN_EXCHANGE_TREASURY_11520, exchangeTreasury11520],
  ]) {
    await (await registry.bootstrapOrgan(organId, await contract.getAddress())).wait();
  }
  await (await registry.sealBootstrap()).wait();

  return {
    eip1193,
    provider,
    signers,
    owner,
    treasury,
    registry,
    kgen,
    kaios,
    kufo,
    kship,
    furnace,
    wormhole,
    converter,
    pairRegistry,
    exchangeTreasury11520,
    epochSeconds,
  };
}

export async function deployUpgradeable(name, deployer, initializeArgs) {
  const implementation = await deploy(name, deployer);
  const compiled = artifact(name);
  const initializeData = implementation.interface.encodeFunctionData("initialize", initializeArgs);
  const proxy = await deploy("TestERC1967Proxy", deployer, [
    await implementation.getAddress(),
    initializeData,
  ]);
  return {
    implementation,
    proxy,
    contract: new Contract(await proxy.getAddress(), compiled.abi, deployer),
    initializeArgs,
  };
}

export async function setupLingxiaoBank({ chainId = 31337, totalAccounts = 10 } = {}) {
  const eip1193 = ganache.provider({
    chain: { chainId, hardfork: "shanghai" },
    logging: { quiet: true },
    wallet: { deterministic: true, totalAccounts },
  });
  activeProviders.add(eip1193);
  const provider = new BrowserProvider(eip1193);
  provider.pollingInterval = 25;
  const signers = await Promise.all(Array.from({ length: totalAccounts }, (_, index) => provider.getSigner(index)));
  const [deployer, admin, upgrader] = signers;

  const kgen = await deploy("MockKGEN", deployer, [await deployer.getAddress()]);
  const registry = await deploy("KAIOSOrganRegistry", deployer, [await admin.getAddress(), 3600]);
  const implementation = await deploy("LingxiaoCelestialBank18888_Upgradeable", deployer);
  const compiled = artifact("LingxiaoCelestialBank18888_Upgradeable");
  const initializeData = implementation.interface.encodeFunctionData("initialize", [
    await admin.getAddress(),
    await upgrader.getAddress(),
    await kgen.getAddress(),
  ]);
  const proxy = await deploy("TestERC1967Proxy", deployer, [
    await implementation.getAddress(),
    initializeData,
  ]);
  const bank = new Contract(await proxy.getAddress(), compiled.abi, admin);

  return {
    eip1193,
    provider,
    signers,
    deployer,
    admin,
    upgrader,
    kgen,
    registry,
    implementation,
    proxy,
    bank,
  };
}

export async function setupLingxiaoFullBankSystem({ chainId = 31337, totalAccounts = 12 } = {}) {
  const context = await setupLingxiaoBank({ chainId, totalAccounts });
  const [deployer, admin, upgrader, governance, moduleUpgrader, beneficiary] = context.signers;
  const governanceAddress = await governance.getAddress();
  const moduleUpgraderAddress = await moduleUpgrader.getAddress();
  const bankAddress = await context.bank.getAddress();
  const legacy8888 = await context.signers[11].getAddress();
  const economic8888Deployment = await deployUpgradeable(
    "GaolaozhuangCommercialBank8888_Upgradeable",
    deployer,
    [
      await admin.getAddress(),
      await upgrader.getAddress(),
      await context.kgen.getAddress(),
      bankAddress,
      legacy8888,
    ],
  );
  const economic8888 = economic8888Deployment.contract.connect(admin);
  const exchange11520 = await deploy("MockOrgan", deployer);

  const definitions = [
    ["CelestialSeat500_Upgradeable", [bankAddress, governanceAddress, moduleUpgraderAddress, 1_000n * ETHER]],
    ["CivilizationAllocation_Upgradeable", [bankAddress, governanceAddress, moduleUpgraderAddress]],
    ["EconomicRouter8888_Upgradeable", [bankAddress, governanceAddress, moduleUpgraderAddress, await economic8888.getAddress()]],
    ["ExchangeSettlement11520_Upgradeable", [bankAddress, governanceAddress, moduleUpgraderAddress, await exchange11520.getAddress()]],
    ["BankRiskController_Upgradeable", [bankAddress, governanceAddress, moduleUpgraderAddress]],
    ["BankGovernance_Upgradeable", [bankAddress, governanceAddress, moduleUpgraderAddress, 3600]],
    ["BankMigration_Upgradeable", [bankAddress, governanceAddress, moduleUpgraderAddress]],
  ];
  const modules = {};
  for (const [name, args] of definitions) {
    const deployed = await deployUpgradeable(name, deployer, args);
    modules[name] = deployed;
    deployed.contract = deployed.contract.connect(governance);
  }

  const registry = context.registry;
  const kaios = await deploy("KAIOS", deployer, [
    await context.kgen.getAddress(),
    bankAddress,
    await registry.getAddress(),
  ]);
  await (await context.bank.connect(admin).bindKAIOS(await kaios.getAddress())).wait();
  await (await economic8888.bindKAIOS(await kaios.getAddress())).wait();

  const configurations = [
    [MODULE_CELESTIAL_SEAT_500, "CelestialSeat500_Upgradeable", 50_000n * ETHER, 500_000n * ETHER],
    [MODULE_CIVILIZATION_ALLOCATION, "CivilizationAllocation_Upgradeable", 20_000n * ETHER, 200_000n * ETHER],
    [MODULE_ECONOMIC_ROUTER_8888, "EconomicRouter8888_Upgradeable", 20_000n * ETHER, 200_000n * ETHER],
    [MODULE_EXCHANGE_SETTLEMENT_11520, "ExchangeSettlement11520_Upgradeable", 20_000n * ETHER, 200_000n * ETHER],
    [MODULE_RISK_CONTROLLER, "BankRiskController_Upgradeable", 0n, 0n],
    [MODULE_GOVERNANCE, "BankGovernance_Upgradeable", 0n, 0n],
    [MODULE_MIGRATION, "BankMigration_Upgradeable", 0n, 0n],
  ];
  for (const [moduleId, name, perTransactionLimit, epochLimit] of configurations) {
    const deployed = modules[name];
    await (
      await context.bank.connect(admin).configureModule(
        moduleId,
        await deployed.contract.getAddress(),
        id(`${name}:1.0.0`),
        perTransactionLimit,
        epochLimit,
        true,
      )
    ).wait();
  }
  await (
    await context.bank.connect(admin).setRiskController(
      await modules.BankRiskController_Upgradeable.contract.getAddress(),
    )
  ).wait();

  return {
    ...context,
    governance,
    moduleUpgrader,
    beneficiary,
    economic8888,
    economic8888Deployment,
    legacy8888,
    exchange11520,
    kaios,
    modules,
  };
}

export async function setupPhase2System({ chainId = 31337, totalAccounts = 14 } = {}) {
  const context = await setupLingxiaoFullBankSystem({ chainId, totalAccounts });
  const pauser = context.signers[7];
  const life = context.signers[8];
  const verifier = context.signers[9];
  const outsider = context.signers[10];
  const approver = context.signers[11];
  const bankAddress = await context.bank.getAddress();
  const governanceAddress = await context.governance.getAddress();
  const upgraderAddress = await context.moduleUpgrader.getAddress();

  const furnace = await deploy("KAIOSAlchemyFurnace", context.deployer, [
    await context.kaios.getAddress(),
    await context.registry.getAddress(),
    86_400,
  ]);
  await (
    await context.registry.connect(context.admin).bootstrapOrgan(
      ORGAN_FURNACE_18911,
      await furnace.getAddress(),
    )
  ).wait();

  const eligibilityDeployment = await deployUpgradeable(
    "CelestialEligibility_Upgradeable",
    context.deployer,
    [
      bankAddress,
      governanceAddress,
      upgraderAddress,
      await pauser.getAddress(),
      await furnace.getAddress(),
      SPECIAL_ALCHEMY_DESTINATION,
    ],
  );
  eligibilityDeployment.contract = eligibilityDeployment.contract.connect(context.governance);

  const redemptionDeployment = await deployUpgradeable(
    "KGENReserveRedemption_Upgradeable",
    context.deployer,
    [
      bankAddress,
      governanceAddress,
      upgraderAddress,
      await pauser.getAddress(),
      await context.kgen.getAddress(),
      await context.kaios.getAddress(),
      await eligibilityDeployment.contract.getAddress(),
      1n * ETHER,
      10n * ETHER,
      20n * ETHER,
      10_000n * ETHER,
      20_000n * ETHER,
      true,
    ],
  );
  redemptionDeployment.contract = redemptionDeployment.contract.connect(context.governance);

  const capitalDeployment = await deployUpgradeable(
    "CelestialCapitalCommitment_Upgradeable",
    context.deployer,
    [
      bankAddress,
      governanceAddress,
      upgraderAddress,
      await pauser.getAddress(),
      await context.kaios.getAddress(),
      await eligibilityDeployment.contract.getAddress(),
      30 * 86_400,
    ],
  );
  capitalDeployment.contract = capitalDeployment.contract.connect(context.governance);

  for (const [moduleId, deployment, name] of [
    [MODULE_KGEN_RESERVE_REDEMPTION, redemptionDeployment, "KGENReserveRedemption_Upgradeable"],
    [MODULE_CELESTIAL_ELIGIBILITY, eligibilityDeployment, "CelestialEligibility_Upgradeable"],
    [MODULE_CELESTIAL_CAPITAL_COMMITMENT, capitalDeployment, "CelestialCapitalCommitment_Upgradeable"],
  ]) {
    await (
      await context.bank.connect(context.admin).configureModule(
        moduleId,
        await deployment.contract.getAddress(),
        id(`${name}:1.0.0`),
        0,
        0,
        true,
      )
    ).wait();
  }

  return {
    ...context,
    pauser,
    life,
    verifier,
    outsider,
    approver,
    furnace,
    phase2: {
      eligibility: eligibilityDeployment,
      redemption: redemptionDeployment,
      capital: capitalDeployment,
    },
  };
}

export async function allocateKaios(context, beneficiary, amount, suffix = "PHASE2") {
  const allocation = context.modules.CivilizationAllocation_Upgradeable.contract;
  const allocationId = id(`ALLOCATION:${suffix}`);
  await (
    await context.bank.connect(context.admin).configureModule(
      MODULE_CIVILIZATION_ALLOCATION,
      await allocation.getAddress(),
      id("CivilizationAllocation_Upgradeable:PHASE2-TEST"),
      amount,
      amount,
      true,
    )
  ).wait();
  const latest = await context.provider.getBlock("latest");
  await (
    await allocation.createAllocation(
      allocationId,
      await beneficiary.getAddress(),
      amount,
      latest.timestamp,
      id("PHASE2-TEST-FUNDING"),
    )
  ).wait();
  await (await allocation.executeAllocation(allocationId)).wait();
  return allocationId;
}

export function cleanupProviders() {
  for (const provider of activeProviders) {
    provider.disconnect();
    activeProviders.delete(provider);
  }
}

export function eventArgs(receipt, contract, eventName) {
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === eventName) return parsed.args;
    } catch {
      // The receipt includes logs from multiple contracts.
    }
  }
  throw new Error(`Event not found: ${eventName}`);
}

export async function advanceTime(provider, seconds) {
  await provider.send("evm_increaseTime", [seconds]);
  await provider.send("evm_mine", []);
}

export async function mintKaiosByBurningKgen(context, kgenAmount) {
  await (await context.kgen.connect(context.owner).burn(kgenAmount)).wait();
  await (await context.kaios.connect(context.owner).settleWhiteHoleMass()).wait();
  return kgenAmount * 1_000n;
}
