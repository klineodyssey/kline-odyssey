import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { Contract, id } from "ethers";
import {
  ETHER,
  artifact,
  cleanupProviders,
  deploy,
  deployUpgradeable,
  setupLingxiaoBank,
  setupLingxiaoFullBankSystem,
} from "./helpers.mjs";

afterEach(cleanupProviders);

const WEIGHT = 1_000_000n;
const taipeiMidnightUtc = (year, month, day) => BigInt(Date.UTC(year, month - 1, day - 1, 16, 0, 0) / 1_000);

async function advanceTo(context, timestamp) {
  await context.eip1193.request({ method: "evm_setTime", params: [Number(timestamp) * 1_000] });
  await context.eip1193.request({ method: "evm_mine", params: [] });
}

async function settle(context, wholeKgen) {
  await (await context.kgen.connect(context.deployer).burn(BigInt(wholeKgen) * ETHER)).wait();
  await (await context.kaios.settleWhiteHoleMass()).wait();
}

test("calendar views enforce exact day-5 UTC+8 boundaries across Gregorian month lengths and year transition", async () => {
  const context = await setupLingxiaoFullBankSystem();
  const seats = context.modules.CelestialSeat500_Upgradeable.contract;
  const cases = [
    [2027, 2],
    [2027, 4],
    [2027, 5],
    [2028, 2],
    [2028, 3],
    [2028, 12],
    [2029, 1],
  ];
  for (const [year, month] of cases) {
    const monthId = BigInt(year * 100 + month);
    assert.equal(await seats.salaryMonthMaturityAt(monthId), taipeiMidnightUtc(year, month, 5));
  }

  await advanceTo(context, taipeiMidnightUtc(2027, 2, 5) - 1n);
  assert.equal(await seats.currentCivilizationMonth(), 202702n);
  assert.equal(await seats.salaryMonthMatured(202702), false);
  await advanceTo(context, taipeiMidnightUtc(2027, 2, 5));
  assert.equal(await seats.salaryMonthMatured(202702), true);

  await advanceTo(context, taipeiMidnightUtc(2028, 2, 5));
  assert.equal(await seats.salaryMonthMatured(202802), true);
  await advanceTo(context, taipeiMidnightUtc(2028, 2, 29));
  assert.equal(await seats.currentCivilizationMonth(), 202802n);
  assert.equal(await seats.salaryMonthMatured(202802), true);
  await advanceTo(context, taipeiMidnightUtc(2028, 3, 1));
  assert.equal(await seats.currentCivilizationMonth(), 202803n);
  assert.equal(await seats.salaryMonthMatured(202803), false);
  await advanceTo(context, taipeiMidnightUtc(2028, 3, 5));
  assert.equal(await seats.salaryMonthMatured(202803), true);
  await advanceTo(context, taipeiMidnightUtc(2029, 1, 5));
  assert.equal(await seats.currentCivilizationMonth(), 202901n);
  assert.equal(await seats.salaryMonthMatured(202901), true);
});

test("never-claimed seat accumulates every matured calendar month without a 30-day approximation", async () => {
  const context = await setupLingxiaoFullBankSystem();
  const seats = context.modules.CelestialSeat500_Upgradeable.contract;
  const beneficiaryAddress = await context.beneficiary.getAddress();
  await settle(context, 10);
  await advanceTo(context, taipeiMidnightUtc(2027, 7, 3));
  await (
    await seats.configureSeat(1, id("CALENDAR-LIFE-1"), id("CALENDAR-TEMPLE-1"), beneficiaryAddress, WEIGHT, 1)
  ).wait();
  const state = await seats.calendarSeatState(1);
  assert.equal(state.firstSalaryMonth, 202708n);
  assert.equal(state.lastClaimedMonth, 202707n);
  await advanceTo(context, taipeiMidnightUtc(2027, 11, 5));
  const preview = await seats.previewSalaryClaim(1);
  assert.equal(preview.throughMonth, 202711n);
  assert.equal(preview.amount, 4_000n * ETHER);
  await (await seats.connect(context.signers[9]).claimCelestialSalary(1)).wait();
  assert.equal(await context.kaios.balanceOf(beneficiaryAddress), 4_000n * ETHER);
  assert.equal((await seats.calendarSeatState(1)).lastClaimedMonth, 202711n);
});

test("one claimed month followed by a multi-month gap remains exactly claimable once", async () => {
  const context = await setupLingxiaoFullBankSystem();
  const seats = context.modules.CelestialSeat500_Upgradeable.contract;
  const beneficiaryAddress = await context.beneficiary.getAddress();
  await settle(context, 10);
  await advanceTo(context, taipeiMidnightUtc(2027, 1, 2));
  await (
    await seats.configureSeat(2, id("CALENDAR-LIFE-2"), id("CALENDAR-TEMPLE-2"), beneficiaryAddress, WEIGHT, 1)
  ).wait();
  await advanceTo(context, taipeiMidnightUtc(2027, 2, 5));
  await (await seats.claimCelestialSalary(2)).wait();
  assert.equal((await seats.calendarSeatState(2)).lastClaimedMonth, 202702n);
  await advanceTo(context, taipeiMidnightUtc(2027, 6, 5));
  assert.equal((await seats.previewSalaryClaim(2)).amount, 4_000n * ETHER);
  await (await seats.claimCelestialSalary(2)).wait();
  assert.equal((await seats.seat(2)).claimedAmount, 5_000n * ETHER);
  await assert.rejects(seats.claimCelestialSalary(2));
});

test("salary base, weight and beneficiary checkpoints affect future months only", async () => {
  const context = await setupLingxiaoFullBankSystem();
  const seats = context.modules.CelestialSeat500_Upgradeable.contract;
  const firstBeneficiary = await context.beneficiary.getAddress();
  const secondBeneficiary = await context.signers[7].getAddress();
  await settle(context, 20);
  await advanceTo(context, taipeiMidnightUtc(2027, 7, 2));
  await (
    await seats.configureSeat(3, id("CALENDAR-LIFE-3"), id("CALENDAR-TEMPLE-3"), firstBeneficiary, WEIGHT, 1)
  ).wait();
  await assert.rejects(seats.scheduleSalaryBase(2_000n * ETHER, 202707));
  await assert.rejects(seats.scheduleSeatTerms(3, secondBeneficiary, 2n * WEIGHT, 202707));
  await (await seats.scheduleSalaryBase(2_000n * ETHER, 202709)).wait();
  await (await seats.scheduleSeatTerms(3, secondBeneficiary, 2n * WEIGHT, 202710)).wait();
  assert.equal(await seats.salaryBaseForMonth(202708), 1_000n * ETHER);
  assert.equal(await seats.salaryBaseForMonth(202709), 2_000n * ETHER);
  assert.equal(await seats.salaryWeightForMonth(3, 202709), WEIGHT);
  assert.equal(await seats.salaryWeightForMonth(3, 202710), 2n * WEIGHT);
  assert.equal(await seats.salaryBeneficiaryForMonth(3, 202709), firstBeneficiary);
  assert.equal(await seats.salaryBeneficiaryForMonth(3, 202710), secondBeneficiary);

  await advanceTo(context, taipeiMidnightUtc(2027, 11, 5));
  assert.equal((await seats.previewSalaryClaim(3)).amount, 11_000n * ETHER);
  await (await seats.connect(context.signers[8]).claimCelestialSalary(3)).wait();
  assert.equal(await context.kaios.balanceOf(firstBeneficiary), 3_000n * ETHER);
  assert.equal(await context.kaios.balanceOf(secondBeneficiary), 8_000n * ETHER);
});

test("insufficient balance and pause preserve the complete entitlement for retry", async () => {
  const context = await setupLingxiaoFullBankSystem();
  const seats = context.modules.CelestialSeat500_Upgradeable.contract;
  const risk = context.modules.BankRiskController_Upgradeable.contract;
  const beneficiaryAddress = await context.beneficiary.getAddress();
  await settle(context, 2);
  await advanceTo(context, taipeiMidnightUtc(2027, 1, 2));
  await (
    await seats.configureSeat(4, id("CALENDAR-LIFE-4"), id("CALENDAR-TEMPLE-4"), beneficiaryAddress, WEIGHT, 1)
  ).wait();
  await advanceTo(context, taipeiMidnightUtc(2027, 2, 5));
  const checkpoint = (await seats.calendarSeatState(4)).lastClaimedMonth;
  await (await context.bank.connect(context.admin).pause()).wait();
  await assert.rejects(seats.claimCelestialSalary(4));
  assert.equal((await seats.calendarSeatState(4)).lastClaimedMonth, checkpoint);
  await (await context.bank.connect(context.admin).unpause()).wait();
  const balance = await context.kaios.balanceOf(await context.bank.getAddress());
  await (await risk.applyRiskParameters(balance, balance)).wait();
  await assert.rejects(seats.claimCelestialSalary(4));
  assert.equal((await seats.calendarSeatState(4)).lastClaimedMonth, checkpoint);
  assert.equal((await seats.seat(4)).claimedAmount, 0n);
  await settle(context, 2);
  await (await seats.claimCelestialSalary(4)).wait();
  assert.equal((await seats.calendarSeatState(4)).lastClaimedMonth, 202702n);
  assert.equal((await seats.seat(4)).claimedAmount, 1_000n * ETHER);
});

test("500-seat cap and fixed-beneficiary claim surface block invalid seats and caller redirect", async () => {
  const context = await setupLingxiaoFullBankSystem();
  const seats = context.modules.CelestialSeat500_Upgradeable.contract;
  const beneficiaryAddress = await context.beneficiary.getAddress();
  const attackerAddress = await context.signers[9].getAddress();
  await settle(context, 2);
  await (
    await seats.configureSeat(500, id("CALENDAR-LIFE-500"), id("CALENDAR-TEMPLE-500"), beneficiaryAddress, WEIGHT, 1)
  ).wait();
  await assert.rejects(
    seats.configureSeat(501, id("CALENDAR-LIFE-501"), id("CALENDAR-TEMPLE-501"), beneficiaryAddress, WEIGHT, 1),
  );
  await advanceTo(context, await seats.nextSalaryMaturityAt(500));
  await (await seats.connect(context.signers[9]).claimCelestialSalary(500)).wait();
  assert.equal(await context.kaios.balanceOf(beneficiaryAddress), 1_000n * ETHER);
  assert.equal(await context.kaios.balanceOf(attackerAddress), 0n);
});

test("fuzz/invariant: Gregorian maturity timestamps match UTC+8 day 5 across multiple years", async () => {
  const context = await setupLingxiaoFullBankSystem();
  const seats = context.modules.CelestialSeat500_Upgradeable.contract;
  let previous = 0n;
  for (let year = 2027; year <= 2036; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      const monthId = BigInt(year * 100 + month);
      const actual = await seats.salaryMonthMaturityAt(monthId);
      const expected = taipeiMidnightUtc(year, month, 5);
      assert.equal(actual, expected);
      assert.ok(actual > previous);
      previous = actual;
    }
  }
  assert.equal(await seats.salaryMonthMaturityAt(202802), taipeiMidnightUtc(2028, 2, 5));
  assert.equal(taipeiMidnightUtc(2028, 3, 1) - taipeiMidnightUtc(2028, 2, 1), 29n * 86_400n);
});

test("duration candidate upgrades append-only into calendar candidate without rewriting the V1 prefix", async () => {
  const context = await setupLingxiaoBank();
  const governance = context.signers[3];
  const moduleUpgrader = context.signers[4];
  const beneficiary = await context.signers[5].getAddress();
  const old = await deployUpgradeable(
    "CelestialSeat500_DurationEpochV1Fixture",
    context.deployer,
    [await context.bank.getAddress(), await governance.getAddress(), await moduleUpgrader.getAddress(), 2_592_000],
  );
  const oldContract = old.contract.connect(governance);
  await (
    await oldContract.configureFixtureSeat(
      9,
      id("V1-PRESERVED-LIFE"),
      id("V1-PRESERVED-TEMPLE"),
      beneficiary,
      77n * ETHER,
      1,
    )
  ).wait();
  const before = await oldContract.seat(9);
  const replacement = await deploy("CelestialSeat500_Upgradeable", context.deployer);
  await assert.rejects(oldContract.connect(context.signers[8]).upgradeToAndCall(await replacement.getAddress(), "0x"));
  await (await oldContract.connect(moduleUpgrader).upgradeToAndCall(await replacement.getAddress(), "0x")).wait();
  const calendar = new Contract(await old.proxy.getAddress(), artifact("CelestialSeat500_Upgradeable").abi, governance);
  const after = await calendar.seat(9);
  assert.equal(await calendar.salaryEpochSeconds(), 2_592_000n);
  assert.equal(await calendar.seatCount(), 1n);
  assert.equal(after.lifeId, before.lifeId);
  assert.equal(after.templeId, before.templeId);
  assert.equal(after.beneficiary, before.beneficiary);
  assert.equal(after.salaryPerEpoch, before.salaryPerEpoch);
  assert.equal(after.activatedAt, before.activatedAt);
  assert.equal(after.salaryCheckpoint, before.salaryCheckpoint);
  assert.equal(after.claimedAmount, before.claimedAmount);
  assert.equal(after.status, before.status);
  assert.equal((await calendar.calendarSeatState(9)).firstSalaryMonth, 0n);
  await assert.rejects(replacement.initialize(
    await context.bank.getAddress(),
    await governance.getAddress(),
    await moduleUpgrader.getAddress(),
    1_000n * ETHER,
  ));
});
