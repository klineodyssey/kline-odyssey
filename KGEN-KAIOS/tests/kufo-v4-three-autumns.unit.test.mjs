import assert from "node:assert/strict";
import test from "node:test";
import {AbiCoder,keccak256} from "ethers";
import { alchemyQuote, makeAnnualCohortCalendar, mintOrigin, cohortYear, currentAutumn,
  threeAutumnState, newCohortTranches, splitCohortTranches, claimableTranches, ZODIAC,
  makeBirthGroupCalendar, birthGroupAt, transferBirthGroups, settleBirthGroups, MAX_BATCH_GROUPS,
  packBirthWindow,unpackBirthWindow,constructorCalendarConfig,currentAnnualStage,annualConversionState
} from "../runtime/kufo-policy.mjs";

// Deliberately noncanonical January 1 fixture. Production calendar remains absent.
const years = Array.from({ length: 5 }, (_, i) => ({ year: 2030 + i, zodiac: ZODIAC[(6 + i) % 12], startUtc: `${2030 + i}-01-01T00:00:00Z` }));
const calendar = makeAnnualCohortCalendar("TEST-ONLY-JAN1", years);
const firstBoundary = calendar.entries[1].start;
const E18 = 10n ** 18n;
const sec = text=>BigInt(Date.parse(text)/1000);
const groupConfig = ()=>({version:'0x'+'11'.repeat(32),firstFinancialYear:2030,
  yearStarts:calendar.entries.map(row=>row.start),birthWindows:[
    {start:sec('2030-01-01T00:00:00Z'),end:sec('2030-07-01T00:00:00Z'),zodiac:7,constellation:1},
    {start:sec('2030-07-01T00:00:00Z'),end:sec('2030-12-15T00:00:00Z'),zodiac:7,constellation:2},
    {start:sec('2030-12-15T00:00:00Z'),end:sec('2031-02-01T00:00:00Z'),zodiac:8,constellation:12},
    {start:sec('2031-02-01T00:00:00Z'),end:sec('2032-01-01T00:00:00Z'),zodiac:8,constellation:1},
  ]});
const birthCalendar=makeBirthGroupCalendar(groupConfig());

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

test("early and year-end births share maturity while identities use independent exact windows", () => {
  const early = mintOrigin(calendar.entries[0].start, birthCalendar);
  const late = mintOrigin(firstBoundary - 1n, birthCalendar);
  assert.equal(early.birthYear, late.birthYear);
  assert.equal(early.birthZodiac, 7);assert.equal(late.birthZodiac, 8);
  assert.equal(early.birthConstellation, 1);assert.equal(late.birthConstellation, 12);
  assert.equal(early.calendarHash,birthCalendar.calendarHash);assert.equal(late.calendarHash,birthCalendar.calendarHash);
  assert.ok(Object.isFrozen(early));assert.ok(Object.isFrozen(late));
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
  assert.throws(() => mintOrigin(calendar.entries[2].start, birthCalendar), /ISSUANCE_CALENDAR_CLOSED/);
  assert.throws(() => mintOrigin(firstBoundary, calendar), /BIRTH_WINDOWS_REQUIRED/);
  assert.throws(() => cohortYear(calendar.entries[0].start - 1n, calendar), /TIME_BEFORE_CALENDAR/);
  assert.throws(() => cohortYear(1n), /CALENDAR_REQUIRED/);
  assert.throws(() => threeAutumnState(3n, 2n, 2030, firstBoundary, calendar), /CONVERTED_OUT_OF_RANGE/);
});

test('birth groups sweep independent financial and identity boundaries and retain immutable inputs',()=>{
  const input=groupConfig(),cal=makeBirthGroupCalendar(input);
  assert.deepEqual(cal.groups.map(g=>[g.groupId,g.financialYear,g.zodiac,g.constellation]),[
    [1,2030,7,1],[2,2030,7,2],[3,2030,8,12],[4,2031,8,12],[5,2031,8,1]]);
  for(const [i,group] of cal.groups.entries()){
    assert.equal(birthGroupAt(group.start,cal).groupId,i+1);
    assert.equal(birthGroupAt(group.end-1n,cal).groupId,i+1);
    if(i+1<cal.groups.length)assert.equal(birthGroupAt(group.end,cal).groupId,i+2);
  }
  const old=mintOrigin(sec('2030-12-31T23:59:59Z'),cal);
  input.birthWindows[2].constellation=3;input.yearStarts[1]+=10n;
  assert.equal(old.birthYear,2030);assert.equal(old.birthZodiac,8);assert.equal(old.birthConstellation,12);
  assert.equal(mintOrigin(old.bornAtSec,cal).birthConstellation,12);
  assert.ok(Object.isFrozen(cal.groups));assert.ok(cal.groups.every(Object.isFrozen));
  assert.ok(Object.isFrozen(cal.birthWindows));assert.ok(cal.birthWindows.every(Object.isFrozen));
  assert.throws(()=>{cal.groups[2].constellation=3;},TypeError);
  assert.throws(()=>birthGroupAt(cal.yearStarts[0]-1n,cal),/ISSUANCE_CALENDAR_CLOSED/);
  assert.throws(()=>birthGroupAt(cal.yearStarts[cal.issuanceCohorts],cal),/ISSUANCE_CALENDAR_CLOSED/);
  assert.equal(currentAnnualStage(2030,firstBoundary,cal),1);
  assert.equal(annualConversionState(3n,0n,2030,cal.entries[3].start,cal).claimableKufoWei,3n);
});

test('packed constructor words and calendar hash exactly match the Solidity ABI layout',()=>{
  const cfg=groupConfig(),cal=makeBirthGroupCalendar(cfg),encoded=constructorCalendarConfig(cal);
  assert.deepEqual(encoded.packedBirthWindows.map(unpackBirthWindow),cfg.birthWindows);
  assert.equal(encoded.packedBirthWindows[0],cfg.birthWindows[0].start | cfg.birthWindows[0].end<<64n | 7n<<128n | 1n<<136n);
  assert.equal(cal.calendarHash,keccak256(AbiCoder.defaultAbiCoder().encode(
    ['bytes32','uint32','uint64[]','uint256[]'],[cfg.version,cfg.firstFinancialYear,cfg.yearStarts,encoded.packedBirthWindows])));
  const changed=groupConfig();changed.birthWindows[1].constellation=3;
  assert.notEqual(makeBirthGroupCalendar(changed).calendarHash,cal.calendarHash);
  assert.ok(Object.isFrozen(encoded));assert.ok(Object.isFrozen(encoded.packedBirthWindows));
  for(const word of [-1n,1n<<144n,packBirthWindow(cfg.birthWindows[0])|1n<<200n,0n])assert.throws(()=>unpackBirthWindow(word));
  assert.throws(()=>packBirthWindow({...cfg.birthWindows[0],constellation:0}),/UNCONFIGURED/);
});

test('full explicit windows fail closed on gaps, overlap, unknown identities and malformed calendar',()=>{
  for(const mutate of [
    c=>c.version='0x'+'00'.repeat(32),c=>c.birthWindows=[],
    c=>c.birthWindows[0].zodiac=0,c=>c.birthWindows[0].constellation=0,
    c=>c.birthWindows[0].zodiac=13,c=>c.birthWindows[0].constellation=13,
    c=>c.birthWindows[0].end-=1n,c=>c.birthWindows[1].start-=1n,
    c=>c.birthWindows[0].start-=1n,c=>c.birthWindows.at(-1).end+=1n,
    c=>c.birthWindows[1].end=c.birthWindows[1].start,c=>c.yearStarts[1]=c.yearStarts[0],
    c=>c.yearStarts[0]=1,c=>c.yearStarts[0]=1n<<64n,
    c=>c.firstFinancialYear=0xffffffff,c=>c.birthWindows=Array(513).fill(c.birthWindows[0]),
  ]){const input=groupConfig();mutate(input);assert.throws(()=>makeBirthGroupCalendar(input));}
});

test('partial group transfers preserve exact birth attributes and every remaining tranche after settlement',()=>{
  const holdings=[{groupId:3,...newCohortTranches(1003n)},{groupId:4,...newCohortTranches(1001n)}];
  const before=structuredClone(holdings),first=settleBirthGroups(holdings,200n,[3],firstBoundary,birthCalendar);
  const moved=transferBirthGroups(first.parent,900n,[3,4],birthCalendar);
  for(const original of first.parent){
    const parent=moved.parent.find(g=>g.groupId===original.groupId),child=moved.child.find(g=>g.groupId===original.groupId);
    for(const field of ['first','second','terminal'])assert.equal(parent[field]+(child?.[field]??0n),original[field]);
  }
  for(const item of moved.child){
    const metadata=birthCalendar.groups[item.groupId-1];assert.equal(metadata.constellation,12);
    assert.equal(metadata.zodiac,8);assert.equal(metadata.financialYear,item.groupId===3?2030:2031);
  }
  const forever=calendar.entries.at(-1).start+99999999999n;
  const settled=settleBirthGroups(moved.child,900n,[3,4],forever,birthCalendar);
  assert.equal(settled.expectedKshipWei,900000n);
  assert.equal(settled.parent.reduce((n,g)=>n+g.first+g.second+g.terminal,0n),0n);
  assert.deepEqual(holdings,before,'projections never rewrite caller holdings or birth metadata');
  assert.throws(()=>settleBirthGroups(holdings,1n,[4],firstBoundary,birthCalendar),/MATURITY_INSUFFICIENT/);
  assert.throws(()=>transferBirthGroups(holdings,1004n,[3],birthCalendar),/BALANCE_INSUFFICIENT/);
});

test('more than one bounded batch remains movable and settleable without new groups or age reset',()=>{
  const cfg={version:'0x'+'22'.repeat(32),firstFinancialYear:4100,yearStarts:[1000n,1330n,1660n,1990n],
    birthWindows:Array.from({length:33},(_,i)=>({start:1000n+BigInt(i)*10n,end:1010n+BigInt(i)*10n,zodiac:1,constellation:i%12+1}))};
  const cal=makeBirthGroupCalendar(cfg),all=cal.groups.map(g=>({groupId:g.groupId,...newCohortTranches(1n)}));
  const ids=all.map(g=>g.groupId);
  assert.equal(MAX_BATCH_GROUPS,32);assert.throws(()=>transferBirthGroups(all,33n,ids,cal),/INVALID_GROUP_SELECTION/);
  const first=transferBirthGroups(all,32n,ids.slice(0,32),cal),last=transferBirthGroups(first.parent,1n,[33],cal);
  assert.equal(last.parent.reduce((n,g)=>n+g.first+g.second+g.terminal,0n),0n);
  const settledFirst=settleBirthGroups(first.child,32n,ids.slice(0,32),999999999n,cal);
  const settledLast=settleBirthGroups(last.child,1n,[33],999999999n,cal);
  assert.equal(settledFirst.expectedKshipWei+settledLast.expectedKshipWei,33000n);
  for(const selection of [[],[0],[34],[2,1],[1,1]])assert.throws(()=>transferBirthGroups(all,1n,selection,cal),/INVALID_GROUP_SELECTION/);
  assert.throws(()=>transferBirthGroups([all[0],all[0]],1n,[1],cal),/INVALID_GROUP_HOLDINGS/);
});
