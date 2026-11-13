// KUFO review candidate. Pure projections; no wallet, ledger or execution.
// All timestamps and identity windows are explicit inputs, never a guessed calendar.
import { AbiCoder, keccak256 } from "ethers";
export const ZODIAC = Object.freeze(["鼠","牛","虎","兔","龍","蛇","馬","羊","猴","雞","狗","豬"]);

export const KAIOS_PER_KGEN = 1000n;
export const KUFO_PER_KAIOS = 1000n;
export const KSHIP_PER_KUFO = 1000n;
export const MAX_ISSUANCE_COHORTS = 32;
export const MAX_BIRTH_WINDOWS = 512;
export const MAX_BATCH_GROUPS = 32;
const U64 = (1n << 64n) - 1n;
const configuredBirthCalendars = new WeakSet();

function utcSeconds(text) {
  if (typeof text !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(text)) throw new TypeError("UTC_TIMESTAMP_REQUIRED");
  const value = Date.parse(text);
  if (!Number.isFinite(value) || new Date(value).toISOString() !== text.replace("Z", ".000Z")) throw new RangeError("INVALID_UTC_TIMESTAMP");
  return BigInt(value / 1000);
}
function seconds(value) {
  if (typeof value !== "bigint" || value <= 0n || value > U64) throw new RangeError("INVALID_UINT64_TIMESTAMP");
  return value;
}

export function packBirthWindow(row) {
  if (!row || !Number.isInteger(row.zodiac) || row.zodiac < 1 || row.zodiac > 12 || !Number.isInteger(row.constellation) || row.constellation < 1 || row.constellation > 12) throw new RangeError("BIRTH_IDENTITY_UNCONFIGURED");
  const start=seconds(row.start),end=seconds(row.end);
  if(start>=end)throw new RangeError("INVALID_BIRTH_WINDOW");
  return start | end<<64n | BigInt(row.zodiac)<<128n | BigInt(row.constellation)<<136n;
}
export function unpackBirthWindow(word) {
  if(typeof word!=="bigint" || word<0n || word>>144n!==0n)throw new RangeError("INVALID_PACKED_BIRTH_WINDOW");
  const row={start:word&U64,end:word>>64n&U64,zodiac:Number(word>>128n&255n),constellation:Number(word>>136n&255n)};
  packBirthWindow(row);
  return Object.freeze(row);
}

export function alchemyQuote(kaiosWei) {
  if (typeof kaiosWei !== "bigint" || kaiosWei < 1000n || kaiosWei % KAIOS_PER_KGEN !== 0n) {
    throw new RangeError("KAIOS_AMOUNT_MUST_BE_AT_LEAST_1000_WEI_AND_DIVISIBLE_BY_1000");
  }
  return Object.freeze({ requiredKgenWei: kaiosWei / KAIOS_PER_KGEN, kufoWei: kaiosWei * KUFO_PER_KAIOS });
}

export function makeAnnualCohortCalendar(version, years) {
  if (typeof version !== "string" || version.length < 3) throw new TypeError("CALENDAR_VERSION_REQUIRED");
  if (!Array.isArray(years) || years.length < 4) throw new RangeError("CALENDAR_COVERAGE_REQUIRED");
  const entries = years.map(row => {
    if (!Number.isInteger(row.year) || row.year < 1 || !ZODIAC.includes(row.zodiac)) throw new RangeError("INVALID_COHORT");
    return Object.freeze({year:row.year, zodiac:row.zodiac, start:utcSeconds(row.startUtc)});
  });
  for (let i = 1; i < entries.length; i++) {
    if (entries[i].year !== entries[i-1].year + 1 || entries[i].start <= entries[i-1].start) throw new RangeError("INVALID_YEAR_ORDER");
    if (ZODIAC.indexOf(entries[i].zodiac) !== (ZODIAC.indexOf(entries[i-1].zodiac) + 1) % 12) throw new RangeError("INVALID_ZODIAC_ORDER");
  }
  const issuanceCohorts = entries.length - 3;
  if (issuanceCohorts < 1 || issuanceCohorts > MAX_ISSUANCE_COHORTS ||
      entries[0].start <= 0n || entries.at(-1).year > 0xffffffff) {
    throw new RangeError("INVALID_BOUNDED_ISSUANCE_CALENDAR");
  }
  // Historical annual helper's zodiac labels do not configure mint identities.
  return Object.freeze({version, entries:Object.freeze(entries), issuanceCohorts});
}

// Mirrors KUFO CalendarConfig. Bounds are candidate complexity limits, not an
// approved civil/lunar calendar or an authorization to deploy these parameters.
export function makeBirthGroupCalendar(config) {
  if (!config || typeof config.version !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(config.version) || /^0x0{64}$/i.test(config.version)) throw new TypeError("CALENDAR_VERSION_REQUIRED");
  const {firstFinancialYear:first, yearStarts, birthWindows} = config;
  if (!Number.isInteger(first) || first < 1 || !Array.isArray(yearStarts) || yearStarts.length < 4 || yearStarts.length > MAX_ISSUANCE_COHORTS + 3 || first + yearStarts.length - 1 > 0xffffffff) throw new RangeError("INVALID_BOUNDED_ISSUANCE_CALENDAR");
  const starts = yearStarts.map(seconds);
  if (starts.some((start, i) => i && start <= starts[i-1])) throw new RangeError("INVALID_YEAR_ORDER");
  const issuanceCohorts = starts.length - 3;
  if (!Array.isArray(birthWindows) || birthWindows.length < 1 || birthWindows.length > MAX_BIRTH_WINDOWS) throw new RangeError("BIRTH_WINDOWS_REQUIRED");
  const windows = birthWindows.map(row => {
    if (!row || !Number.isInteger(row.zodiac) || row.zodiac < 1 || row.zodiac > 12 || !Number.isInteger(row.constellation) || row.constellation < 1 || row.constellation > 12) throw new RangeError("BIRTH_IDENTITY_UNCONFIGURED");
    const start=seconds(row.start), end=seconds(row.end);
    if (start >= end) throw new RangeError("INVALID_BIRTH_WINDOW");
    return Object.freeze({start,end,zodiac:row.zodiac,constellation:row.constellation});
  });
  if (windows[0].start !== starts[0] || windows.at(-1).end !== starts[issuanceCohorts] || windows.some((row,i)=>i && row.start !== windows[i-1].end)) throw new RangeError("BIRTH_WINDOW_COVERAGE_REQUIRED");
  const groups=[];
  let yearIndex=0, windowIndex=0;
  while (yearIndex < issuanceCohorts && windowIndex < windows.length) {
    const window=windows[windowIndex], start=starts[yearIndex] > window.start ? starts[yearIndex] : window.start;
    const end=starts[yearIndex+1] < window.end ? starts[yearIndex+1] : window.end;
    groups.push(Object.freeze({groupId:groups.length+1,start,end,financialYear:first+yearIndex,zodiac:window.zodiac,constellation:window.constellation}));
    if (end === starts[yearIndex+1]) yearIndex++;
    if (end === window.end) windowIndex++;
  }
  const packedBirthWindows=Object.freeze(windows.map(packBirthWindow));
  const calendarHash=keccak256(AbiCoder.defaultAbiCoder().encode(
    ["bytes32","uint32","uint64[]","uint256[]"],[config.version,first,starts,packedBirthWindows]));
  const calendar=Object.freeze({version:config.version.toLowerCase(), firstFinancialYear:first, calendarHash,
    yearStarts:Object.freeze(starts), birthWindows:Object.freeze(windows),
    packedBirthWindows,
    entries:Object.freeze(starts.map((start,i)=>Object.freeze({year:first+i,start}))),
    issuanceCohorts, groups:Object.freeze(groups)});
  configuredBirthCalendars.add(calendar);
  return calendar;
}

export function constructorCalendarConfig(calendar) {
  if (!configuredBirthCalendars.has(calendar)) throw new TypeError("BIRTH_WINDOWS_REQUIRED");
  return Object.freeze({version:calendar.version,firstFinancialYear:calendar.firstFinancialYear,
    yearStarts:calendar.yearStarts,packedBirthWindows:calendar.packedBirthWindows});
}

export function birthGroupAt(bornAtSec, calendar) {
  if (!configuredBirthCalendars.has(calendar)) throw new TypeError("BIRTH_WINDOWS_REQUIRED");
  if (typeof bornAtSec !== "bigint" || bornAtSec < calendar.yearStarts[0] || bornAtSec >= calendar.yearStarts[calendar.issuanceCohorts]) throw new RangeError("ISSUANCE_CALENDAR_CLOSED");
  return calendar.groups.find(group=>bornAtSec >= group.start && bornAtSec < group.end);
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
  const group = birthGroupAt(bornAtSec, calendar);
  return Object.freeze({birthYear:group.financialYear, bornAtSec, birthZodiac:group.zodiac,
    birthConstellation:group.constellation, groupId:group.groupId, calendarVersion:calendar.version,
    calendarHash:calendar.calendarHash});
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

// Historical source-compatible names above retain a single implementation.
// New integrations use annual terminology; these are aliases, not another policy.
export const currentAnnualStage = currentAutumn;
export const annualConversionTarget = threeAutumnTarget;
export const annualConversionState = threeAutumnState;

function selectedHoldings(holdings, ids, calendar) {
  if (!configuredBirthCalendars.has(calendar)) throw new TypeError("BIRTH_WINDOWS_REQUIRED");
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > MAX_BATCH_GROUPS || ids.some((id,i)=>!Number.isInteger(id) || id < 1 || id > calendar.groups.length || i && id <= ids[i-1])) throw new RangeError("INVALID_GROUP_SELECTION");
  if (!Array.isArray(holdings) || holdings.length > calendar.groups.length) throw new RangeError("INVALID_GROUP_HOLDINGS");
  const balances=new Map();
  for (const item of holdings) {
    validateTranches(item);
    if (!Number.isInteger(item.groupId) || item.groupId < 1 || item.groupId > calendar.groups.length || balances.has(item.groupId)) throw new RangeError("INVALID_GROUP_HOLDINGS");
    balances.set(item.groupId,{groupId:item.groupId,first:item.first,second:item.second,terminal:item.terminal});
  }
  return balances;
}
const freezeHoldings = balances => Object.freeze([...balances.values()].map(Object.freeze));

// Selected groups are explicit, strictly ordered, and limited to the same finite
// batch as the contract. No provider or mutation is performed by these helpers.
export function transferBirthGroups(holdings, amount, ids, calendar) {
  const parent=selectedHoldings(holdings,ids,calendar), child=[];
  if (typeof amount !== "bigint" || amount <= 0n) throw new RangeError("POSITIVE_AMOUNT_REQUIRED");
  let remaining=amount;
  for (const groupId of ids) {
    if (!remaining) break;
    const item=parent.get(groupId);
    if (!item) continue;
    const live=item.first+item.second+item.terminal, take=live < remaining ? live : remaining;
    if (!take) continue;
    const split=splitCohortTranches(item,take);
    parent.set(groupId,{groupId,...split.parent});child.push(Object.freeze({groupId,...split.child}));remaining-=take;
  }
  if (remaining) throw new RangeError("SELECTED_GROUP_BALANCE_INSUFFICIENT");
  return Object.freeze({parent:freezeHoldings(parent),child:Object.freeze(child),transferredWei:amount});
}

export function settleBirthGroups(holdings, amount, ids, asOfSec, calendar) {
  const parent=selectedHoldings(holdings,ids,calendar);
  if (typeof amount !== "bigint" || amount <= 0n) throw new RangeError("POSITIVE_AMOUNT_REQUIRED");
  let remaining=amount;
  for (const groupId of ids) {
    if (!remaining) break;
    const item=parent.get(groupId);
    if (!item) continue;
    const group=calendar.groups[groupId-1], autumn=currentAnnualStage(group.financialYear,asOfSec,calendar);
    const eligible=claimableTranches(item,group.financialYear,asOfSec,calendar), take=eligible < remaining ? eligible : remaining;
    let unpaid=take;
    for (const [key,mature] of [["first",autumn>=1],["second",autumn>=2],["terminal",autumn>=3]]) {
      if (mature) {const paid=item[key] < unpaid ? item[key] : unpaid;item[key]-=paid;unpaid-=paid;}
    }
    remaining-=take;
  }
  if (remaining) throw new RangeError("SELECTED_GROUP_MATURITY_INSUFFICIENT");
  return Object.freeze({parent:freezeHoldings(parent),kufoBurned:amount,expectedKshipWei:amount*KSHIP_PER_KUFO});
}
