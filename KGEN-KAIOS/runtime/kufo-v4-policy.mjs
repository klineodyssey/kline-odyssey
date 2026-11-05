// Product 05 review candidate. Pure projections; no wallet, ledger or execution.
// Calendar parsing and zodiac order reuse the preserved PR #600 research source.
import { makeZodiacCalendar, ZODIAC } from "../research/kufo-zodiac-cohort-v0.mjs";

export const KAIOS_PER_KGEN = 1000n;
export const KUFO_PER_KAIOS = 1000n;
export const KSHIP_PER_KUFO = 1000n;
export const MAX_ISSUANCE_COHORTS = 32;
export const BIRTH_CONSTELLATION = "UNCONFIGURED";

export function alchemyQuote(kaiosWei) {
  if (typeof kaiosWei !== "bigint" || kaiosWei < 1000n || kaiosWei % KAIOS_PER_KGEN !== 0n) {
    throw new RangeError("KAIOS_AMOUNT_MUST_BE_AT_LEAST_1000_WEI_AND_DIVISIBLE_BY_1000");
  }
  return Object.freeze({ requiredKgenWei: kaiosWei / KAIOS_PER_KGEN, kufoWei: kaiosWei * KUFO_PER_KAIOS });
}

export function makeAnnualCohortCalendar(version, years) {
  const parsed = makeZodiacCalendar(version, years);
  const issuanceCohorts = parsed.entries.length - 3;
  if (issuanceCohorts < 1 || issuanceCohorts > MAX_ISSUANCE_COHORTS ||
      parsed.entries[0].start <= 0n || parsed.entries.at(-1).year > 0xffffffff) {
    throw new RangeError("INVALID_BOUNDED_ISSUANCE_CALENDAR");
  }
  return Object.freeze({ ...parsed, issuanceCohorts });
}

function validateCalendar(calendar) {
  if (!calendar || !Number.isInteger(calendar.issuanceCohorts) ||
      calendar.issuanceCohorts < 1 || calendar.issuanceCohorts > MAX_ISSUANCE_COHORTS ||
      calendar.entries?.length !== calendar.issuanceCohorts + 3) throw new TypeError("CALENDAR_REQUIRED");
}

export function cohortYear(asOfSec, calendar) {
  validateCalendar(calendar);
  if (typeof asOfSec !== "bigint" || asOfSec < calendar.entries[0].start) throw new RangeError("TIME_BEFORE_CALENDAR");
  // Settlement stays available forever after the last configured boundary.
  for (let i = calendar.entries.length - 1; i >= 0; i--) {
    if (asOfSec >= calendar.entries[i].start) return calendar.entries[i].year;
  }
}

function birthIndex(birthYear, calendar) {
  validateCalendar(calendar);
  const index = birthYear - calendar.entries[0].year;
  if (!Number.isInteger(index) || index < 0 || index >= calendar.issuanceCohorts) throw new RangeError("INVALID_BIRTH_YEAR");
  return index;
}

export function mintOrigin(bornAtSec, calendar) {
  const birthYear = cohortYear(bornAtSec, calendar);
  const index = birthIndex(birthYear, calendar);
  return Object.freeze({ birthYear, bornAtSec, birthZodiac: calendar.entries[index].zodiac,
    birthConstellation: BIRTH_CONSTELLATION, calendarVersion: calendar.version });
}

export function currentAutumn(birthYear, asOfSec, calendar) {
  birthIndex(birthYear, calendar);
  return Math.min(3, Math.max(0, cohortYear(asOfSec, calendar) - birthYear));
}

export function threeAutumnTarget(initialKufoWei, birthYear, asOfSec, calendar) {
  if (typeof initialKufoWei !== "bigint" || initialKufoWei < 0n) throw new TypeError("initialKufoWei");
  const autumn = currentAutumn(birthYear, asOfSec, calendar);
  return autumn === 0 ? 0n : autumn === 1 ? initialKufoWei / 2n : autumn === 2 ? initialKufoWei * 3n / 4n : initialKufoWei;
}

// Projection for an unsplit origin proof. Holder balances after transfers/merges use
// claimableTranches against their remaining tranche state, never this original-amount helper.
export function threeAutumnState(initialKufoWei, alreadyConvertedWei, birthYear, asOfSec, calendar) {
  const target = threeAutumnTarget(initialKufoWei, birthYear, asOfSec, calendar);
  if (typeof alreadyConvertedWei !== "bigint" || alreadyConvertedWei < 0n || alreadyConvertedWei > target) {
    throw new RangeError("CONVERTED_OUT_OF_RANGE");
  }
  const claimableKufoWei = target - alreadyConvertedWei;
  return Object.freeze({ targetConvertedKufoWei: target, claimableKufoWei,
    expectedKshipWei: claimableKufoWei * KSHIP_PER_KUFO,
    projectedRemainingKufoWei: initialKufoWei - target,
    terminal: currentAutumn(birthYear, asOfSec, calendar) === 3 });
}

export function newCohortTranches(amount) {
  if (typeof amount !== "bigint" || amount <= 0n) throw new RangeError("POSITIVE_AMOUNT_REQUIRED");
  const first = amount / 2n;
  const cumulativeSecond = amount * 3n / 4n;
  return Object.freeze({ first, second: cumulativeSecond - first, terminal: amount - cumulativeSecond });
}

function validateTranches(item) {
  if (!item || [item.first, item.second, item.terminal].some(x => typeof x !== "bigint" || x < 0n)) {
    throw new RangeError("INVALID_TRANCHES");
  }
}

export function splitCohortTranches(item, take) {
  validateTranches(item);
  const live = item.first + item.second + item.terminal;
  if (typeof take !== "bigint" || take <= 0n || take > live) throw new RangeError("INVALID_TRANSFER");
  const first = item.first * take / live;
  const cumulativeSecond = (item.first + item.second) * take / live;
  const child = Object.freeze({ first, second: cumulativeSecond - first, terminal: take - cumulativeSecond });
  const parent = Object.freeze({ first: item.first - child.first, second: item.second - child.second,
    terminal: item.terminal - child.terminal });
  return Object.freeze({ parent, child });
}

export function claimableTranches(item, birthYear, asOfSec, calendar) {
  validateTranches(item);
  const autumn = currentAutumn(birthYear, asOfSec, calendar);
  return (autumn >= 1 ? item.first : 0n) + (autumn >= 2 ? item.second : 0n) + (autumn >= 3 ? item.terminal : 0n);
}

export { ZODIAC };
