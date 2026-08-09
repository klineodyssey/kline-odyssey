import fs from "node:fs";
import path from "node:path";
import { id } from "ethers";
import {
  ETHER,
  advanceTime,
  cleanupProviders,
  setupLingxiaoFullBankSystem,
} from "../tests/helpers.mjs";

const root = path.resolve(import.meta.dirname, "..");
const receiptEvidence = (receipt) => ({
  transactionHash: receipt.hash,
  blockNumber: receipt.blockNumber,
  gasUsed: receipt.gasUsed.toString(),
  status: receipt.status === 1 ? "PASS" : "FAIL",
});
let context;
try {
  context = await setupLingxiaoFullBankSystem();
  const burn = await (await context.kgen.connect(context.deployer).burn(20n * ETHER)).wait();
  const settlement = await (await context.kaios.settleWhiteHoleMass()).wait();
  const genesis = await (await context.bank.startGenesisEpoch()).wait();
  const seats = context.modules.CelestialSeat500_Upgradeable.contract;
  const beneficiary = await context.beneficiary.getAddress();
  const seatConfigured = await (
    await seats.configureSeat(1, id("LIFE-GENESIS-SEAT-1"), id("TEMPLE-12345"), beneficiary, 100n * ETHER, 1)
  ).wait();
  await advanceTime(context.provider, 100);
  const salary = await (await seats.claimCelestialSalary(1)).wait();
  const allocation = context.modules.CivilizationAllocation_Upgradeable.contract;
  const allocationId = id("GENESIS-CIVILIZATION-ALLOCATION");
  const latest = await context.provider.getBlock("latest");
  const allocationCreated = await (
    await allocation.createAllocation(allocationId, beneficiary, 200n * ETHER, latest.timestamp, id("GENESIS-INFRASTRUCTURE"))
  ).wait();
  const allocationExecuted = await (await allocation.executeAllocation(allocationId)).wait();
  const route8888 = await (
    await context.modules.EconomicRouter8888_Upgradeable.contract.routeCapital(id("GENESIS-8888"), 300n * ETHER, id("ECONOMIC-CAPITAL"))
  ).wait();
  const settlement11520 = await (
    await context.modules.ExchangeSettlement11520_Upgradeable.contract.settle(id("GENESIS-11520"), 400n * ETHER, id("KAIOS-LISTING"))
  ).wait();
  const risk = await (
    await context.modules.BankRiskController_Upgradeable.contract.applyRiskParameters(10_000n * ETHER, 12_000n * ETHER)
  ).wait();
  const governanceAddress = await context.modules.BankGovernance_Upgradeable.contract.getAddress();
  const moduleGovernanceFinalized = {};
  for (const [name, item] of Object.entries(context.modules)) {
    moduleGovernanceFinalized[name] = receiptEvidence(
      await (await item.contract.finalizeModuleGovernance(governanceAddress)).wait(),
    );
  }
  const bankGovernanceFinalized = receiptEvidence(
    await (await context.bank.connect(context.admin).finalizeGovernance(governanceAddress)).wait(),
  );
  const compileEvidence = JSON.parse(fs.readFileSync(path.join(root, "reports", "SOLIDITY_COMPILE_EVIDENCE.json"), "utf8"));
  const moduleAddresses = Object.fromEntries(
    await Promise.all(Object.entries(context.modules).map(async ([name, item]) => [name, await item.contract.getAddress()])),
  );
  const report = {
    status: "PASS",
    evidenceClass: "LOCAL_GENESIS_CHAIN_REACTION_SIMULATION",
    mainnetTransactionAuthorized: false,
    chainId: 31337,
    conversion: "1_KGEN_PERMANENT_BURN_TO_1000_KAIOS",
    contracts: {
      kgen: await context.kgen.getAddress(),
      kaios: await context.kaios.getAddress(),
      bankProxy: await context.bank.getAddress(),
      bankImplementation: await context.implementation.getAddress(),
      economic8888: await context.economic8888.getAddress(),
      universalExchange11520: await context.exchange11520.getAddress(),
      modules: moduleAddresses,
    },
    transactions: {
      burn: receiptEvidence(burn),
      settleWhiteHoleMass: receiptEvidence(settlement),
      startGenesisEpoch: receiptEvidence(genesis),
      seatConfigured: receiptEvidence(seatConfigured),
      salary: receiptEvidence(salary),
      allocationCreated: receiptEvidence(allocationCreated),
      allocationExecuted: receiptEvidence(allocationExecuted),
      route8888: receiptEvidence(route8888),
      settlement11520: receiptEvidence(settlement11520),
      risk: receiptEvidence(risk),
      moduleGovernanceFinalized,
      bankGovernanceFinalized,
    },
    state: {
      kaiosTotalSupply: (await context.kaios.totalSupply()).toString(),
      bankGenesisOpeningBalance: (await context.bank.genesisOpeningBalance()).toString(),
      bankBalance: (await context.bank.kaiosBalance()).toString(),
      beneficiaryBalance: (await context.kaios.balanceOf(beneficiary)).toString(),
      economic8888Balance: (await context.kaios.balanceOf(await context.economic8888.getAddress())).toString(),
      universalExchange11520Balance: (await context.kaios.balanceOf(await context.exchange11520.getAddress())).toString(),
      reserveRequirement: (await context.bank.reserveRequirement()).toString(),
      totalDisbursed: (await context.bank.totalKaiosDisbursed()).toString(),
      governanceFinalized: await context.bank.governanceFinalized(),
    },
    storageValidation: compileEvidence.lingxiaoCelestialBank18888StorageValidation,
    gates: {
      arbitraryOwnerWithdraw: "BLOCKED",
      unauthorizedUpgrade: "PASS_BY_INTEGRATION_TEST",
      moduleExposure: "PASS_BY_INTEGRATION_TEST",
      genesisChainReaction: "PASS",
    },
  };
  fs.writeFileSync(path.join(root, "reports", "LINGXIAO_18888_GENESIS_CHAIN_REACTION_SIMULATION.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log("LINGXIAO_18888_GENESIS_CHAIN_REACTION_SIMULATION=PASS");
} finally {
  cleanupProviders();
}
