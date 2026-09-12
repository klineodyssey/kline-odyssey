import assert from "node:assert/strict";
import test from "node:test";
import {
  alchemyQuote,
  splitThreeAutumnLineage,
  threeAutumnState,
  K280_YEAR_SECONDS
} from "../runtime/kufo-v4-policy.mjs";

const E18 = 10n ** 18n;

test("0.001 KAIOS requires 0.000001 KGEN and outputs 1 KUFO", () => {
  const quote = alchemyQuote(E18 / 1000n);
  assert.equal(quote.requiredKgenWei, E18 / 1_000_000n);
  assert.equal(quote.kufoWei, E18);
});

test("alchemy rejects a value that cannot express exact KGEN balance proof", () => {
  assert.throws(() => alchemyQuote(1001n), /DIVISIBLE_BY_1000/);
});

test("before first autumn no KUFO decays", () => {
  const s = threeAutumnState(E18, 0n, K280_YEAR_SECONDS - 1n);
  assert.equal(s.claimableKufoWei, 0n);
  assert.equal(s.remainingKufoWei, E18);
});

test("first autumn converts 50 percent to 500 KSHIP per original KUFO", () => {
  const s = threeAutumnState(E18, 0n, K280_YEAR_SECONDS);
  assert.equal(s.claimableKufoWei, E18 / 2n);
  assert.equal(s.expectedKshipWei, 500n * E18);
  assert.equal(s.remainingKufoWei, E18 / 2n);
});

test("second autumn cumulative conversion is 75 percent", () => {
  const already = E18 / 2n;
  const s = threeAutumnState(E18, already, 2n * K280_YEAR_SECONDS);
  assert.equal(s.claimableKufoWei, E18 / 4n);
  assert.equal(s.expectedKshipWei, 250n * E18);
  assert.equal(s.remainingKufoWei, E18 / 4n);
});

test("third autumn converts every remainder and leaves zero dust", () => {
  const already = E18 * 3n / 4n;
  const s = threeAutumnState(E18, already, 3n * K280_YEAR_SECONDS);
  assert.equal(s.claimableKufoWei, E18 / 4n);
  assert.equal(s.expectedKshipWei, 250n * E18);
  assert.equal(s.remainingKufoWei, 0n);
  assert.equal(s.terminal, true);
});

test("odd smallest-unit dust is forcibly absorbed by third autumn", () => {
  const initial = 1003n;
  const second = threeAutumnState(initial, 0n, 2n * K280_YEAR_SECONDS);
  const third = threeAutumnState(initial, second.targetConvertedKufoWei, 3n * K280_YEAR_SECONDS);
  assert.equal(third.remainingKufoWei, 0n);
  assert.equal(second.targetConvertedKufoWei + third.claimableKufoWei, initial);
});


test("partial transfers preserve precommitted first- and second-autumn totals", () => {
  const original = {
    initialKufoWei: 3n,
    alreadyConvertedWei: 0n,
    firstAutumnTargetWei: 1n,
    secondAutumnTargetWei: 2n
  };
  const { parent, child } = splitThreeAutumnLineage(original, 1n);

  assert.equal(parent.initialKufoWei + child.initialKufoWei, original.initialKufoWei);
  assert.equal(
    parent.firstAutumnTargetWei + child.firstAutumnTargetWei,
    original.firstAutumnTargetWei
  );
  assert.equal(
    parent.secondAutumnTargetWei + child.secondAutumnTargetWei,
    original.secondAutumnTargetWei
  );
  assert.notEqual(
    parent.secondAutumnTargetWei + child.secondAutumnTargetWei,
    parent.initialKufoWei * 3n / 4n + child.initialKufoWei * 3n / 4n
  );
});
