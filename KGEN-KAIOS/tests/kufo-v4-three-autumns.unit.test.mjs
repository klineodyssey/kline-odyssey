import assert from "node:assert/strict";
import test from "node:test";
import { alchemyQuote, makeAnnualCohortCalendar, mintOrigin, cohortYear, currentAutumn,
  threeAutumnState, newCohortTranches, splitCohortTranches, claimableTranches, ZODIAC
} from "../runtime/kufo-v4-policy.mjs";

// Deliberately noncanonical January 1 fixture. Production calendar remains absent.
const years = Array.from({ length: 5 }, (_, i) => ({ year: 2030 + i, zodiac: ZODIAC[(6 + i) % 12], startUtc: `${2030 + i}-01-01T00:00:00Z` }));
const calendar = makeAnnualCohortCalendar("TEST-ONLY-JAN1", years);
const firstBoundary = calendar.entries[1].start;
const E18 = 10n ** 18n;

test("protocol quote is independent of merchant price and uses current KGEN balance only", () => {
  assert.deepEqual(alchemyQuote(E18 / 1000n), { requiredKgenWei: E18 / 1_000_000n, kufoWei: E18 });
  assert.throws(() => alchemyQuote(1001n), /DIVISIBLE_BY_1000/);
});

test("shared annual boundary is 0 before and 50 percent exactly and after", () => {
  assert.equal(threeAutumnState(E18, 0n, 2030, firstBoundary - 1n, calendar).claimableKufoWei, 0n);
  for (const t of [firstBoundary, firstBoundary + 1n]) {
    assert.equal(threeAutumnState(E18, 0n, 2030, t, calendar).claimableKufoWei, E18 / 2n);
  }
});

test("end-of-year and early-year births share the first boundary and immutable zodiac", () => {
  const early = mintOrigin(calendar.entries[0].start, calendar);
  const late = mintOrigin(firstBoundary - 1n, calendar);
  assert.equal(early.birthYear, late.birthYear);
  assert.equal(early.birthZodiac, late.birthZodiac);
  assert.equal(late.birthConstellation, "UNCONFIGURED");
  assert.equal(currentAutumn(late.birthYear, firstBoundary, calendar), 1);
});

test("second boundary catches up to75 percent and duplicate projection yields zero additional", () => {
  const at = calendar.entries[2].start;
  assert.equal(threeAutumnState(E18, 0n, 2030, at, calendar).claimableKufoWei, E18 * 3n / 4n);
  assert.equal(threeAutumnState(E18, E18 * 3n / 4n, 2030, at, calendar).claimableKufoWei, 0n);
});

test("third boundary sweeps all odd and one-unit residue, including forever after horizon", () => {
  for (const amount of [1n, 3n, 1003n, E18]) {
    const prior = amount * 3n / 4n;
    const state = threeAutumnState(amount, prior, 2030, calendar.entries[3].start, calendar);
    assert.equal(state.projectedRemainingKufoWei, 0n);
    assert.equal(prior + state.claimableKufoWei, amount);
    assert.equal(state.expectedKshipWei, (amount - prior) * 1000n);
    assert.equal(state.terminal, true);
    assert.equal(threeAutumnState(amount, 0n, 2031, 999999999999n, calendar).claimableKufoWei, amount);
  }
});

test("partial transfer conserves every outstanding tranche before or after settlement", () => {
  for (let initial = 1n; initial <= 99n; initial++) {
    const born = newCohortTranches(initial);
    for (const original of [born, { ...born, first: 0n }, { first: 1n, second: 1n, terminal: 0n }]) {
      const live = original.first + original.second + original.terminal;
      for (let take = 1n; take <= live; take++) {
        const { parent, child } = splitCohortTranches(original, take);
        assert.equal(child.first + child.second + child.terminal, take);
        for (const key of ["first", "second", "terminal"]) {
          assert.ok(parent[key] >= 0n && child[key] >= 0n);
          assert.equal(parent[key] + child[key], original[key]);
        }
      }
    }
  }
});

test("ordinary midyear/crossyear projections do not mutate, merge or settle tranches", () => {
  const original = newCohortTranches(1003n);
  const split = splitCohortTranches(original, 267n);
  assert.deepEqual(original, newCohortTranches(1003n));
  for (const at of [firstBoundary - 1n, firstBoundary, calendar.entries[2].start, calendar.entries[3].start]) {
    assert.equal(claimableTranches(split.parent, 2030, at, calendar) + claimableTranches(split.child, 2030, at, calendar), claimableTranches(original, 2030, at, calendar));
  }
});

test("mint rounding remains proof-granular when same birth year coalesces", () => {
  const a = newCohortTranches(1n), b = newCohortTranches(1n);
  assert.equal(a.first + b.first, 0n);
  assert.equal(newCohortTranches(2n).first, 1n);
  assert.equal(a.terminal + b.terminal, 2n);
});

test("calendar fails closed for absent/invalid calendar and closed issuance years", () => {
  assert.throws(() => makeAnnualCohortCalendar("", years), /CALENDAR_VERSION_REQUIRED/);
  assert.throws(() => makeAnnualCohortCalendar("test", years.slice(0, 3)), /CALENDAR_COVERAGE_REQUIRED/);
  assert.throws(() => makeAnnualCohortCalendar("test", [...years].reverse()), /INVALID_YEAR_ORDER/);
  assert.throws(() => makeAnnualCohortCalendar("test", years.map((y, i) => i === 1 ? { ...y, zodiac: years[0].zodiac } : y)), /INVALID_ZODIAC_ORDER/);
  assert.throws(() => mintOrigin(calendar.entries[2].start, calendar), /INVALID_BIRTH_YEAR/);
  assert.throws(() => cohortYear(calendar.entries[0].start - 1n, calendar), /TIME_BEFORE_CALENDAR/);
  assert.throws(() => cohortYear(1n), /CALENDAR_REQUIRED/);
  assert.throws(() => threeAutumnState(3n, 2n, 2030, firstBoundary, calendar), /CONVERTED_OUT_OF_RANGE/);
});
