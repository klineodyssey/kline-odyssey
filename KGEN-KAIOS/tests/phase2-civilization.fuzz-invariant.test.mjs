import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test, { afterEach } from "node:test";
import { id } from "ethers";
import {
  ETHER,
  allocateKaios,
  cleanupProviders,
  setupPhase2System,
} from "./helpers.mjs";

afterEach(cleanupProviders);

function deterministicAmounts(count) {
  let state = 0x18888n;
  return Array.from({ length: count }, () => {
    state = (state * 1_103_515_245n + 12_345n) % 2_147_483_648n;
    return (100n + state % 4_900n) * ETHER + state;
  });
}

test("fuzzed reserve redemptions conserve both supplies and never exceed proportional existing KGEN", async () => {
  const context = await setupPhase2System();
  const eligibility = context.phase2.eligibility.contract;
  const redemption = context.phase2.redemption.contract;
  const lifeId = id("PHASE2-FUZZ-LIFE");
  const amounts = deterministicAmounts(12);
  const totalKaios = amounts.reduce((sum, amount) => sum + amount, 0n);
  const totalExpectedKgen = amounts.reduce((sum, amount) => sum + amount / 1_000n, 0n);

  await (await eligibility.bindLife(lifeId, await context.life.getAddress(), true)).wait();
  await (await eligibility.setReserveRedemptionEligibility(lifeId, true)).wait();
  await (await context.kgen.burn(100n * ETHER)).wait();
  await (await context.kaios.settleWhiteHoleMass()).wait();
  await allocateKaios(context, context.life, totalKaios, "FUZZ-REDEMPTION");
  await (await context.kgen.transfer(await redemption.getAddress(), 100n * ETHER)).wait();
  await (
    await redemption.configureRisk(
      10n * ETHER,
      10n * ETHER,
      90n * ETHER,
      10_000n * ETHER,
      90_000n * ETHER,
    )
  ).wait();
  await (await context.kaios.connect(context.life).approve(await redemption.getAddress(), totalKaios)).wait();

  const kgenSupplyBefore = await context.kgen.totalSupply();
  const kaiosSupplyBefore = await context.kaios.totalSupply();
  const reserveBefore = await redemption.kgenReserveBalance();
  const bankBefore = await context.bank.kaiosBalance();
  const deadline = (await context.provider.getBlock("latest")).timestamp + 86_400;
  for (let index = 0; index < amounts.length; index += 1) {
    const amount = amounts[index];
    await (
      await redemption.connect(context.life).requestRedemption(
        id(`FUZZ-REQUEST-${index}`),
        lifeId,
        amount,
        deadline,
      )
    ).wait();
  }

  assert.equal(await context.kgen.totalSupply(), kgenSupplyBefore);
  assert.equal(await context.kaios.totalSupply(), kaiosSupplyBefore);
  assert.equal(await redemption.totalKaiosDeposited(), totalKaios);
  assert.equal(await redemption.totalKgenRedeemed(), totalExpectedKgen);
  assert.equal(await redemption.kgenReserveBalance(), reserveBefore - totalExpectedKgen);
  assert.equal(await context.bank.kaiosBalance(), bankBefore + totalKaios);
  assert.ok(await redemption.kgenReserveBalance() >= 10n * ETHER);
});

test("Phase-2 ABI invariant exposes no sweep, rescue, arbitrary withdrawal or seat assignment surface", () => {
  const root = path.resolve(import.meta.dirname, "..");
  const forbidden = new Set([
    "sweep",
    "rescue",
    "withdraw",
    "withdrawToken",
    "transferFromPlayer",
    "assignSeat",
    "configureSeat",
    "mint",
  ]);
  for (const name of [
    "KGENReserveRedemption_Upgradeable",
    "CelestialEligibility_Upgradeable",
    "CelestialCapitalCommitment_Upgradeable",
  ]) {
    const artifact = JSON.parse(fs.readFileSync(path.join(root, "artifacts", `${name}.json`), "utf8"));
    const functions = artifact.abi.filter((item) => item.type === "function").map((item) => item.name);
    assert.deepEqual(functions.filter((name) => forbidden.has(name)), []);
    assert.ok((artifact.deployedBytecode.length - 2) / 2 <= 24_576);
  }
});
