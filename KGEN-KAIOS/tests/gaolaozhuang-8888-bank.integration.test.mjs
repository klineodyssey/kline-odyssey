import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { ZeroHash, id } from "ethers";
import {
  ETHER,
  advanceTime,
  artifact,
  cleanupProviders,
  deploy,
  setupLingxiaoFullBankSystem,
} from "./helpers.mjs";

afterEach(cleanupProviders);

async function settle(context, wholeKgen) {
  await (await context.kgen.connect(context.deployer).burn(BigInt(wholeKgen) * ETHER)).wait();
  await (await context.kaios.settleWhiteHoleMass()).wait();
}

async function routeCapital(context, label, amount) {
  const router = context.modules.EconomicRouter8888_Upgradeable.contract;
  await (await router.routeCapital(id(label), amount, id("ECONOMIC_CAPITAL_8888"))).wait();
}

async function advanceTo(context, timestamp) {
  const latest = await context.provider.getBlock("latest");
  const delta = Number(timestamp) - Number(latest.timestamp);
  if (delta > 0) await advanceTime(context.provider, delta);
}

test("8888 initializer, lineage binding and implementation lock establish the formal code-bearing Bank", async () => {
  const context = await setupLingxiaoFullBankSystem();
  const bank = context.economic8888;
  assert.equal(await bank.POINT_ID(), 8_888n);
  assert.equal(await bank.runtimeMode(), "NORMAL_CIVILIZATION_COMMERCIAL_BANK");
  assert.equal(await bank.legacyTreasury(), context.legacy8888);
  assert.equal(await bank.celestialBank18888(), await context.bank.getAddress());
  assert.equal(await bank.kaios(), await context.kaios.getAddress());
  assert.equal(await bank.kaiosBound(), true);
  await assert.rejects(bank.bindKAIOS(await context.kaios.getAddress()));
  await assert.rejects(
    context.economic8888Deployment.implementation.initialize(
      await context.admin.getAddress(),
      await context.upgrader.getAddress(),
      await context.kgen.getAddress(),
      await context.bank.getAddress(),
      context.legacy8888,
    ),
  );
});

test("8888 payroll unlocks exactly on the monthly day-5 UTC+8 boundary and unclaimed salary accumulates", async () => {
  const context = await setupLingxiaoFullBankSystem();
  const bank = context.economic8888;
  const beneficiary = context.beneficiary;
  const beneficiaryAddress = await beneficiary.getAddress();
  const accountId = id("8888-LIFE-SAVINGS");
  await settle(context, 10);
  await routeCapital(context, "8888-PAYROLL-CAPITAL", 5_000n * ETHER);
  await (
    await bank.createAccount(
      accountId,
      id("IDENTITY-LIFE-8888"),
      id("LIFE-8888"),
      id("NONE"),
      beneficiaryAddress,
      beneficiaryAddress,
      1,
    )
  ).wait();

  const firstEpoch = (await bank.currentCalendarEpoch()) + 1n;
  const secondEpoch = firstEpoch + 1n;
  const walletPayroll = id("8888-PAYROLL-WALLET");
  const savingsPayroll = id("8888-PAYROLL-SAVINGS");
  await (await bank.schedulePayroll(walletPayroll, id("LIFE-8888"), beneficiaryAddress, 100n * ETHER, firstEpoch)).wait();
  await (await bank.schedulePayroll(savingsPayroll, id("LIFE-8888"), beneficiaryAddress, 200n * ETHER, secondEpoch)).wait();

  const firstClaimableAt = await bank.epochClaimableAt(firstEpoch);
  await advanceTo(context, firstClaimableAt - 5n);
  await assert.rejects(bank.claimSalary(walletPayroll, 1, ZeroHash));
  await advanceTo(context, firstClaimableAt);
  await (await bank.connect(context.signers[9]).claimSalary(walletPayroll, 1, ZeroHash)).wait();
  assert.equal(await context.kaios.balanceOf(beneficiaryAddress), 100n * ETHER);
  await assert.rejects(bank.claimSalary(walletPayroll, 1, ZeroHash));

  const secondClaimableAt = await bank.epochClaimableAt(secondEpoch);
  await advanceTo(context, secondClaimableAt + 30n * 24n * 60n * 60n);
  assert.equal((await bank.payroll(savingsPayroll)).claimed, false);
  await assert.rejects(bank.claimSalary(savingsPayroll, 2, id("WRONG-ACCOUNT")));
  await (await bank.connect(context.signers[8]).claimSalary(savingsPayroll, 2, accountId)).wait();
  assert.equal((await bank.account(accountId)).balance, 200n * ETHER);
  assert.equal(await bank.totalSalaryCreditedToAccounts(), 200n * ETHER);
});

test("8888 savings, company accounts and business payments preserve ownership and block replay or redirect", async () => {
  const context = await setupLingxiaoFullBankSystem();
  const bank = context.economic8888;
  const worker = context.beneficiary;
  const company = context.signers[7];
  const attacker = context.signers[8];
  const workerAddress = await worker.getAddress();
  const companyAddress = await company.getAddress();
  const workerAccount = id("8888-WORKER-ACCOUNT");
  const companyAccount = id("8888-COMPANY-ACCOUNT");
  await settle(context, 10);
  await routeCapital(context, "8888-COMMERCIAL-CAPITAL", 5_000n * ETHER);
  await (await bank.createAccount(workerAccount, id("WORKER-ID"), id("WORKER-LIFE"), id("NONE"), workerAddress, workerAddress, 1)).wait();
  await (await bank.createAccount(companyAccount, id("COMPANY-ID"), id("NONE"), id("AI-COMPANY"), companyAddress, companyAddress, 2)).wait();

  const epoch = (await bank.currentCalendarEpoch()) + 1n;
  const payrollId = id("8888-DEPOSIT-SEED-SALARY");
  await (await bank.schedulePayroll(payrollId, id("WORKER-LIFE"), workerAddress, 1_000n * ETHER, epoch)).wait();
  await advanceTo(context, await bank.epochClaimableAt(epoch));
  await (await bank.claimSalary(payrollId, 1, ZeroHash)).wait();
  await (await context.kaios.connect(worker).approve(await bank.getAddress(), 1_000n * ETHER)).wait();
  await (await bank.connect(worker).depositToAccount(workerAccount, 1_000n * ETHER)).wait();
  assert.equal((await bank.account(workerAccount)).balance, 1_000n * ETHER);

  await assert.rejects(bank.connect(attacker).withdrawAccount(workerAccount, ETHER));
  await assert.rejects(
    bank.connect(worker).createBusinessPayment(
      id("REDIRECTED-PAYMENT"),
      workerAccount,
      await attacker.getAddress(),
      companyAccount,
      10n * ETHER,
      2,
      2,
    ),
  );
  const paymentId = id("SUPPLY-CHAIN-PAYMENT-1");
  await (
    await bank.connect(worker).createBusinessPayment(
      paymentId,
      workerAccount,
      companyAddress,
      companyAccount,
      250n * ETHER,
      4,
      2,
    )
  ).wait();
  await (await bank.connect(attacker).executeBusinessPayment(paymentId)).wait();
  assert.equal((await bank.account(workerAccount)).balance, 750n * ETHER);
  assert.equal((await bank.account(companyAccount)).balance, 250n * ETHER);
  await assert.rejects(bank.executeBusinessPayment(paymentId));
  await assert.rejects(
    bank.connect(worker).createBusinessPayment(paymentId, workerAccount, companyAddress, companyAccount, ETHER, 2, 2),
  );
  assert.equal(await bank.totalCustomerLiability(), 1_000n * ETHER);
});

test("8888 interest checkpoints apply only prospectively and use a separately funded reserve", async () => {
  const context = await setupLingxiaoFullBankSystem();
  const bank = context.economic8888;
  const worker = context.beneficiary;
  const workerAddress = await worker.getAddress();
  const accountId = id("8888-INTEREST-ACCOUNT");
  await settle(context, 10);
  await routeCapital(context, "8888-INTEREST-CAPITAL", 5_000n * ETHER);
  await (await bank.createAccount(accountId, id("INTEREST-ID"), id("INTEREST-LIFE"), id("NONE"), workerAddress, workerAddress, 1)).wait();
  const salaryEpoch = (await bank.currentCalendarEpoch()) + 1n;
  await (await bank.schedulePayroll(id("INTEREST-SEED"), id("INTEREST-LIFE"), workerAddress, 1_100n * ETHER, salaryEpoch)).wait();
  await advanceTo(context, await bank.epochClaimableAt(salaryEpoch));
  await (await bank.claimSalary(id("INTEREST-SEED"), 1, ZeroHash)).wait();
  await (await context.kaios.connect(worker).approve(await bank.getAddress(), 1_100n * ETHER)).wait();
  await (await bank.connect(worker).depositToAccount(accountId, 1_000n * ETHER)).wait();
  await (await bank.connect(worker).fundInterest(100n * ETHER)).wait();

  const startEpoch = await bank.currentBankingEpoch();
  await assert.rejects(bank.scheduleInterestRate(startEpoch, 10_000));
  await (await bank.scheduleInterestRate(startEpoch + 1n, 10_000)).wait();
  await advanceTo(context, await bank.epochClaimableAt(startEpoch + 2n));
  await (await bank.checkpointInterest(accountId)).wait();
  assert.equal((await bank.account(accountId)).accruedInterest, 10n * ETHER);
  await (await bank.scheduleInterestRate(startEpoch + 3n, 20_000)).wait();
  await advanceTo(context, await bank.epochClaimableAt(startEpoch + 4n));
  await (await bank.checkpointInterest(accountId)).wait();
  const account = await bank.account(accountId);
  assert.equal(account.accruedInterest, 40_300000000000000000n);
  assert.equal(account.pendingInterest, 0n);
  assert.equal(await bank.interestRateCheckpointCount(), 2n);
});

test("8888 pause, fixed-beneficiary withdrawals and delayed-governance UUPS upgrade preserve storage", async () => {
  const context = await setupLingxiaoFullBankSystem();
  const bank = context.economic8888;
  const outsider = context.signers[8];
  const approver = context.signers[9];
  const governance = context.modules.BankGovernance_Upgradeable.contract;
  await (await bank.grantPauser(await outsider.getAddress())).wait();
  await (await bank.connect(outsider).pause()).wait();
  await assert.rejects(bank.depositToAccount(id("NO-ACCOUNT"), ETHER));
  await (await bank.unpause()).wait();

  await (await governance.grantRole(await governance.APPROVER_ROLE(), await approver.getAddress())).wait();
  await (await bank.finalizeGovernance(await governance.getAddress(), await outsider.getAddress())).wait();
  const originalImplementation = await bank.implementationAddress();
  const replacement = await deploy("GaolaozhuangCommercialBank8888_Upgradeable", context.deployer);
  await assert.rejects(bank.connect(outsider).upgradeToAndCall(await replacement.getAddress(), "0x"));
  await assert.rejects(bank.connect(context.upgrader).upgradeToAndCall(await replacement.getAddress(), "0x"));

  const preservedLegacy = await bank.legacyTreasury();
  const upgradeData = bank.interface.encodeFunctionData("upgradeToAndCall", [await replacement.getAddress(), "0x"]);
  const upgradeId = id("8888-DELAYED-UPGRADE");
  await (await governance.propose(upgradeId, await bank.getAddress(), 0, upgradeData)).wait();
  await (await governance.connect(approver).approve(upgradeId)).wait();
  await assert.rejects(governance.connect(outsider).execute(upgradeId, upgradeData));
  await advanceTime(context.provider, 3_601);
  await (await governance.connect(outsider).execute(upgradeId, upgradeData, { gasLimit: 1_000_000 })).wait();
  assert.equal(await bank.legacyTreasury(), preservedLegacy);

  const rollbackData = bank.interface.encodeFunctionData("upgradeToAndCall", [originalImplementation, "0x"]);
  const rollbackId = id("8888-DELAYED-ROLLBACK");
  await (await governance.propose(rollbackId, await bank.getAddress(), 0, rollbackData)).wait();
  await (await governance.connect(approver).approve(rollbackId)).wait();
  await advanceTime(context.provider, 3_601);
  await (await governance.connect(outsider).execute(rollbackId, rollbackData, { gasLimit: 1_000_000 })).wait();
  assert.equal(await bank.implementationAddress(), originalImplementation);
  assert.equal(await bank.legacyTreasury(), preservedLegacy);

  const functions = artifact("GaolaozhuangCommercialBank8888_Upgradeable").abi
    .filter((item) => item.type === "function")
    .map((item) => item.name);
  assert.equal(functions.includes("sweep"), false);
  assert.equal(functions.includes("withdrawAll"), false);
  assert.equal(functions.includes("arbitraryTransfer"), false);
});

test("fuzz/invariant: 8888 commerce preserves solvency and exact customer liabilities", async () => {
  const context = await setupLingxiaoFullBankSystem();
  const bank = context.economic8888;
  const worker = context.beneficiary;
  const merchant = context.signers[7];
  const workerAddress = await worker.getAddress();
  const merchantAddress = await merchant.getAddress();
  const workerAccount = id("8888-FUZZ-WORKER");
  const merchantAccount = id("8888-FUZZ-MERCHANT");
  await settle(context, 20);
  await routeCapital(context, "8888-FUZZ-CAPITAL", 15_000n * ETHER);
  await (await bank.createAccount(workerAccount, id("FUZZ-WORKER-ID"), id("FUZZ-LIFE"), ZeroHash, workerAddress, workerAddress, 1)).wait();
  await (await bank.createAccount(merchantAccount, id("FUZZ-MERCHANT-ID"), ZeroHash, id("FUZZ-COMPANY"), merchantAddress, merchantAddress, 2)).wait();
  const epoch = (await bank.currentCalendarEpoch()) + 1n;
  await (await bank.schedulePayroll(id("FUZZ-PAYROLL"), id("FUZZ-LIFE"), workerAddress, 10_000n * ETHER, epoch)).wait();
  await advanceTo(context, await bank.epochClaimableAt(epoch));
  await (await bank.claimSalary(id("FUZZ-PAYROLL"), 2, workerAccount)).wait();

  const amounts = [1n, 17n, 88n, 233n, 610n, 987n, 1_597n, 377n];
  for (const [index, wholeAmount] of amounts.entries()) {
    const paymentId = id(`8888-FUZZ-PAYMENT-${index}`);
    const toInternalAccount = index % 2 === 0;
    await (
      await bank.connect(worker).createBusinessPayment(
        paymentId,
        workerAccount,
        merchantAddress,
        toInternalAccount ? merchantAccount : ZeroHash,
        wholeAmount * ETHER,
        (index % 8) + 2,
        toInternalAccount ? 2 : 1,
      )
    ).wait();
    await (await bank.executeBusinessPayment(paymentId)).wait();
    const workerState = await bank.account(workerAccount);
    const merchantState = await bank.account(merchantAccount);
    const liability = await bank.totalCustomerLiability();
    assert.equal(liability, workerState.balance + merchantState.balance);
    const health = await bank.bankHealth();
    assert.equal(health.solvent, true);
    assert.ok(health.balance >= liability);
  }
});
