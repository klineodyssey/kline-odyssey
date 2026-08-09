import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { id } from "ethers";
import {
  ETHER,
  MODULE_ECONOMIC_ROUTER_8888,
  advanceTime,
  cleanupProviders,
  deploy,
  eventArgs,
  setupLingxiaoFullBankSystem,
} from "./helpers.mjs";

afterEach(cleanupProviders);

async function settle(context, wholeKgen) {
  await (await context.kgen.connect(context.deployer).burn(BigInt(wholeKgen) * ETHER)).wait();
  await (await context.kaios.settleWhiteHoleMass()).wait();
}

test("KAIOS Genesis chain reaction settles exact mass once and starts the 18888 Genesis Epoch", async () => {
  const context = await setupLingxiaoFullBankSystem();
  await settle(context, 1);
  assert.equal(await context.kaios.totalSupply(), 1_000n * ETHER);
  assert.equal(await context.bank.kaiosBalance(), 1_000n * ETHER);
  await assert.rejects(context.kaios.settleWhiteHoleMass());

  await (await context.bank.startGenesisEpoch()).wait();
  assert.equal(await context.bank.genesisStarted(), true);
  assert.equal(await context.bank.genesisOpeningBalance(), 1_000n * ETHER);
  assert.equal(await context.bank.totalKaiosAccountedInflow(), 1_000n * ETHER);
  await assert.rejects(async () => (await context.bank.startGenesisEpoch({ gasLimit: 500_000 })).wait());
  for (const item of Object.values(context.modules)) {
    await assert.rejects(item.implementation.initialize(...item.initializeArgs));
  }
});

test("500 Celestial Seats accrue retry-safe salary and never redirect the fixed beneficiary", async () => {
  const context = await setupLingxiaoFullBankSystem();
  const seats = context.modules.CelestialSeat500_Upgradeable.contract;
  const beneficiaryAddress = await context.beneficiary.getAddress();
  const attacker = context.signers[7];
  await settle(context, 3);

  await (
    await seats.configureSeat(500, id("LIFE-500"), id("TEMPLE-12345"), beneficiaryAddress, 1_000n * ETHER, 1)
  ).wait();
  await assert.rejects(
    seats.configureSeat(501, id("LIFE-501"), id("TEMPLE-12345"), beneficiaryAddress, ETHER, 1),
  );
  const firstCheckpoint = (await seats.seat(500)).salaryCheckpoint;
  await advanceTime(context.provider, 100);
  const firstReceipt = await (await seats.connect(attacker).claimCelestialSalary(500)).wait();
  const firstSalaryEvent = eventArgs(firstReceipt, seats, "SalaryClaimed");
  assert.equal(firstSalaryEvent.fromEpoch, firstCheckpoint);
  assert.equal(
    firstSalaryEvent.amount,
    (firstSalaryEvent.toEpoch - firstSalaryEvent.fromEpoch) * 1_000n * ETHER,
  );
  assert.equal(await context.kaios.balanceOf(beneficiaryAddress), firstSalaryEvent.amount);
  assert.equal(await context.kaios.balanceOf(await attacker.getAddress()), 0n);
  await assert.rejects(seats.connect(attacker).claimCelestialSalary(500));

  await (
    await seats.configureSeat(1, id("LIFE-1"), id("TEMPLE-18888"), beneficiaryAddress, 5_000n * ETHER, 1)
  ).wait();
  const checkpoint = (await seats.seat(1)).salaryCheckpoint;
  await advanceTime(context.provider, 100);
  await assert.rejects(seats.connect(attacker).claimCelestialSalary(1));
  assert.equal((await seats.seat(1)).salaryCheckpoint, checkpoint);
  await settle(context, 20);
  const retryReceipt = await (await seats.connect(attacker).claimCelestialSalary(1)).wait();
  const salaryEvent = eventArgs(retryReceipt, seats, "SalaryClaimed");
  assert.equal(salaryEvent.amount, (salaryEvent.toEpoch - salaryEvent.fromEpoch) * 5_000n * ETHER);
  assert.equal((await seats.seat(1)).claimedAmount, salaryEvent.amount);
});

test("civilization, 8888 and 11520 rails are replay-safe, authorized and beneficiary-fixed", async () => {
  const context = await setupLingxiaoFullBankSystem();
  const allocation = context.modules.CivilizationAllocation_Upgradeable.contract;
  const router = context.modules.EconomicRouter8888_Upgradeable.contract;
  const exchange = context.modules.ExchangeSettlement11520_Upgradeable.contract;
  const beneficiary = context.signers[8];
  const attacker = context.signers[9];
  await settle(context, 10);

  const latest = await context.provider.getBlock("latest");
  const allocationId = id("CIVILIZATION-ALLOCATION-1");
  await (
    await allocation.createAllocation(
      allocationId,
      await beneficiary.getAddress(),
      1_000n * ETHER,
      latest.timestamp,
      id("PUBLIC-INFRASTRUCTURE"),
    )
  ).wait();
  await (await allocation.connect(attacker).executeAllocation(allocationId)).wait();
  assert.equal(await context.kaios.balanceOf(await beneficiary.getAddress()), 1_000n * ETHER);
  await assert.rejects(allocation.connect(attacker).executeAllocation(allocationId));

  await assert.rejects(
    context.bank.connect(attacker).executeModulePayment(id("FAKE"), await attacker.getAddress(), ETHER),
  );
  await assert.rejects(
    context.bank.connect(context.upgrader).executeModulePayment(id("UPGRADER-CANNOT-PAY"), await attacker.getAddress(), ETHER),
  );
  await assert.rejects(router.connect(attacker).routeCapital(id("8888-UNAUTHORIZED"), ETHER, id("BAD")));
  await (await router.routeCapital(id("8888-ROUTE-1"), 2_000n * ETHER, id("AI-COMPANY-CAPITAL"))).wait();
  assert.equal(await context.kaios.balanceOf(await context.economic8888.getAddress()), 2_000n * ETHER);
  assert.equal(await context.kaios.balanceOf(await context.governance.getAddress()), 0n);

  await assert.rejects(exchange.connect(attacker).settle(id("11520-BAD"), ETHER, id("LISTING")));
  await (await exchange.settle(id("11520-SETTLEMENT-1"), 2_000n * ETHER, id("KAIOS-LISTING"))).wait();
  assert.equal(await context.kaios.balanceOf(await context.exchange11520.getAddress()), 2_000n * ETHER);
});

test("risk reserve, module exposure and pause prevent drains while lawful circulation remains available", async () => {
  const context = await setupLingxiaoFullBankSystem();
  const risk = context.modules.BankRiskController_Upgradeable.contract;
  const router = context.modules.EconomicRouter8888_Upgradeable.contract;
  await settle(context, 1);
  await (await risk.applyRiskParameters(900n * ETHER, 950n * ETHER)).wait();
  await assert.rejects(router.routeCapital(id("OVER-RESERVE"), 101n * ETHER, id("CAPITAL")));
  await (await router.routeCapital(id("AT-RESERVE"), 100n * ETHER, id("CAPITAL"))).wait();
  assert.equal(await context.bank.kaiosBalance(), 900n * ETHER);

  await (
    await context.bank.connect(context.admin).configureModule(
      MODULE_ECONOMIC_ROUTER_8888,
      await router.getAddress(),
      id("EconomicRouter8888_Upgradeable:1.0.0"),
      100n * ETHER,
      150n * ETHER,
      true,
    )
  ).wait();
  await settle(context, 1);
  await (await router.routeCapital(id("EPOCH-CAP-100"), 100n * ETHER, id("CAPITAL"))).wait();
  await assert.rejects(router.routeCapital(id("EPOCH-CAP-OVER"), 51n * ETHER, id("CAPITAL")));

  await (await context.bank.connect(context.admin).pause()).wait();
  await assert.rejects(router.routeCapital(id("PAUSED"), ETHER, id("CAPITAL")));
  await (await context.bank.connect(context.admin).unpause()).wait();
  assert.equal((await context.bank.bankHealth()).healthy, true);
});

test("governance is delayed and two-party, migration is evidence-only, and UUPS rejects unauthorized or non-UUPS changes", async () => {
  const context = await setupLingxiaoFullBankSystem();
  const governanceModule = context.modules.BankGovernance_Upgradeable.contract;
  const migration = context.modules.BankMigration_Upgradeable.contract;
  const approver = context.signers[8];
  const outsider = context.signers[9];
  const governanceAddress = await governanceModule.getAddress();
  const seat = context.modules.CelestialSeat500_Upgradeable;
  const preservedBeneficiary = await context.beneficiary.getAddress();
  const migrationId = id("MIGRATION-EVIDENCE-ONLY");

  await (
    await governanceModule.grantRole(await governanceModule.APPROVER_ROLE(), await approver.getAddress())
  ).wait();
  await (
    await migration.proposeMigration(migrationId, 2048, await outsider.getAddress(), id("STATE"), id("MANIFEST"))
  ).wait();
  await (
    await seat.contract.configureSeat(
      1,
      id("UPGRADE-PRESERVED-LIFE"),
      id("UPGRADE-PRESERVED-TEMPLE"),
      preservedBeneficiary,
      88n * ETHER,
      1,
    )
  ).wait();
  for (const item of Object.values(context.modules)) {
    await (await item.contract.finalizeModuleGovernance(governanceAddress)).wait();
    assert.equal(await item.contract.governanceFinalized(), true);
  }
  await (await context.bank.connect(context.admin).finalizeGovernance(governanceAddress)).wait();
  assert.equal(await context.bank.governanceFinalized(), true);
  await assert.rejects(
    context.bank.connect(context.admin).configureModule(
      MODULE_ECONOMIC_ROUTER_8888,
      await context.modules.EconomicRouter8888_Upgradeable.contract.getAddress(),
      id("HIDDEN-REPLACEMENT"),
      1,
      1,
      true,
    ),
  );
  await assert.rejects(
    seat.contract.configureSeat(2, id("BYPASS-LIFE"), id("BYPASS-TEMPLE"), preservedBeneficiary, ETHER, 1),
  );
  await assert.rejects(
    migration.proposeMigration(id("BYPASS-MIGRATION"), 2048, await outsider.getAddress(), id("STATE-2"), id("MANIFEST-2")),
  );
  const proposalId = id("PAUSE-THROUGH-DELAYED-GOVERNANCE");
  const pauseData = context.bank.interface.encodeFunctionData("pause");
  await (await governanceModule.propose(proposalId, await context.bank.getAddress(), 0, pauseData)).wait();
  await assert.rejects(governanceModule.approve(proposalId));
  await (await governanceModule.connect(approver).approve(proposalId)).wait();
  await assert.rejects(governanceModule.connect(outsider).execute(proposalId, pauseData));
  await advanceTime(context.provider, 3601);
  await (
    await governanceModule.connect(outsider).execute(proposalId, pauseData, { gasLimit: 1_000_000 })
  ).wait();
  assert.equal(await context.bank.paused(), true);

  assert.equal((await migration.migration(migrationId)).successor, await outsider.getAddress());
  assert.equal(await context.bank.kaiosBalance(), 0n);

  const replacement = await deploy("LingxiaoCelestialBank18888_Upgradeable", context.deployer);
  const nonUups = await deploy("MockNonUUPS", context.deployer);
  const kgenBefore = await context.bank.kgen();
  await assert.rejects(
    context.bank.connect(outsider).upgradeToAndCall(await replacement.getAddress(), "0x"),
  );
  await assert.rejects(
    context.bank.connect(context.upgrader).upgradeToAndCall(await replacement.getAddress(), "0x"),
  );
  const maliciousUpgradeData = context.bank.interface.encodeFunctionData("upgradeToAndCall", [
    await nonUups.getAddress(),
    "0x",
  ]);
  const maliciousUpgradeId = id("DELAYED-MALICIOUS-NON-UUPS-UPGRADE");
  await (
    await governanceModule.propose(maliciousUpgradeId, await context.bank.getAddress(), 0, maliciousUpgradeData)
  ).wait();
  await (await governanceModule.connect(approver).approve(maliciousUpgradeId)).wait();
  await advanceTime(context.provider, 3601);
  await assert.rejects(async () => (
    await governanceModule.connect(outsider).execute(
      maliciousUpgradeId,
      maliciousUpgradeData,
      { gasLimit: 1_000_000 },
    )
  ).wait());

  const validUpgradeData = context.bank.interface.encodeFunctionData("upgradeToAndCall", [
    await replacement.getAddress(),
    "0x",
  ]);
  const validUpgradeId = id("DELAYED-VALID-BANK-UPGRADE");
  await (
    await governanceModule.propose(validUpgradeId, await context.bank.getAddress(), 0, validUpgradeData)
  ).wait();
  await (await governanceModule.connect(approver).approve(validUpgradeId)).wait();
  await advanceTime(context.provider, 3601);
  await (
    await governanceModule.connect(outsider).execute(validUpgradeId, validUpgradeData, { gasLimit: 1_000_000 })
  ).wait();
  assert.equal(await context.bank.kgen(), kgenBefore);
  assert.equal(await context.bank.paused(), true);

  const seatReplacement = await deploy("CelestialSeat500_Upgradeable", context.deployer);
  await assert.rejects(
    seat.contract.connect(outsider).upgradeToAndCall(await seatReplacement.getAddress(), "0x"),
  );
  await assert.rejects(
    seat.contract.connect(context.moduleUpgrader).upgradeToAndCall(await seatReplacement.getAddress(), "0x"),
  );
  const seatUpgradeData = seat.contract.interface.encodeFunctionData("upgradeToAndCall", [
    await seatReplacement.getAddress(),
    "0x",
  ]);
  const seatUpgradeId = id("DELAYED-VALID-SEAT-UPGRADE");
  await (
    await governanceModule.propose(seatUpgradeId, await seat.contract.getAddress(), 0, seatUpgradeData)
  ).wait();
  await (await governanceModule.connect(approver).approve(seatUpgradeId)).wait();
  await advanceTime(context.provider, 3601);
  await (
    await governanceModule.connect(outsider).execute(seatUpgradeId, seatUpgradeData, { gasLimit: 1_000_000 })
  ).wait();
  assert.equal(await seat.contract.MAX_SEATS(), 500n);
  assert.equal((await seat.contract.seat(1)).beneficiary, preservedBeneficiary);
});
