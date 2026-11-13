import assert from "node:assert/strict";
import test from "node:test";
import {AbiCoder,keccak256} from "ethers";
import { alchemyQuote, makeAnnualCohortCalendar, mintOrigin, cohortYear, currentAutumn,
  threeAutumnState, newCohortTranches, splitCohortTranches, claimableTranches, ZODIAC,
  makeBirthGroupCalendar, birthGroupAt, transferBirthGroups, settleBirthGroups, MAX_BATCH_GROUPS,
  packBirthWindow,unpackBirthWindow,constructorCalendarConfig,currentAnnualStage,annualConversionState,
  appendBirthGroupCalendar,calendarAppendHash,groupCalendarHash
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

// Synthetic civil fixtures test capacity, not an asserted millennial lunar or
// astronomical ephemeris. Production birth identities still need reviewed data.
const civilStart=year=>BigInt(Date.UTC(year,0,1)/1000);
function voyageSegment(first,count=32){
  const yearStarts=Array.from({length:count+3},(_,i)=>civilStart(first+i));
  const birthWindows=[];
  for(let year=first;year<first+count;year++)for(let month=0;month<12;month++){
    birthWindows.push({start:BigInt(Date.UTC(year,month,1)/1000),end:BigInt(Date.UTC(year,month+1,1)/1000),
      zodiac:(year-4)%12+1,constellation:month+1});
  }
  return {version:'0x'+'77'.repeat(32),firstFinancialYear:first,yearStarts,birthWindows};
}

test('calendar continuation commits exact new data without rewriting original rights or constructor identity',()=>{
  const cfg=voyageSegment(2027,2),original=makeBirthGroupCalendar(cfg);
  const born=mintOrigin(civilStart(2027),original),next=voyageSegment(2029,2);
  const extended=appendBirthGroupCalendar(original,next);
  const expected=keccak256(AbiCoder.defaultAbiCoder().encode(['bytes32','bytes32'],[original.calendarHash,calendarAppendHash(next)]));
  assert.equal(extended.latestCalendarHash,expected);
  assert.equal(extended.calendarHash,original.calendarHash);
  assert.deepEqual(mintOrigin(civilStart(2027),extended),born);
  assert.equal(groupCalendarHash(born.groupId,extended),born.calendarHash);
  assert.equal(mintOrigin(civilStart(2029),extended).calendarHash,expected);
  assert.equal(original.issuanceCohorts,2);assert.equal(extended.issuanceCohorts,4);
  assert.throws(()=>birthGroupAt(civilStart(2029),original),/ISSUANCE_CALENDAR_CLOSED/);
  assert.equal(birthGroupAt(civilStart(2029),extended).financialYear,2029);
  assert.equal(currentAnnualStage(2027,civilStart(2030),extended),3);
  assert.throws(()=>constructorCalendarConfig(extended),/SEGMENT_CONFIG_REQUIRED/);
  assert.throws(()=>appendBirthGroupCalendar({...original},next),/BIRTH_WINDOWS_REQUIRED/);
});

test('calendar continuation rejects changed shared maturity boundaries, labels, gaps and excessive segment work',()=>{
  const original=makeBirthGroupCalendar(voyageSegment(2027,2));
  for(const mutate of [
    c=>c.firstFinancialYear++,c=>c.yearStarts[0]++,c=>c.yearStarts[1]++,c=>c.yearStarts[2]++,
    c=>c.birthWindows[1].start++,c=>c.birthWindows[0].zodiac=0,
    c=>c.version='0x'+'00'.repeat(32),
  ]){const cfg=voyageSegment(2029,2);mutate(cfg);assert.throws(()=>appendBirthGroupCalendar(original,cfg));}
  assert.throws(()=>appendBirthGroupCalendar(original,voyageSegment(2029,33)),/BOUNDED_ISSUANCE/);
  assert.equal(original.groups.length,24);assert.equal(original.issuanceCohorts,2);
});

test('civil year10000 is representable and Gregorian century/leap rules remain exact across400-year cycles',()=>{
  for(const y of [2027,2100,2400,10000,12027])assert.equal(civilStart(y+400)-civilStart(y),146097n*86400n);
  for(const [y,days] of [[2100,365],[2400,366],[10000,366]])assert.equal(civilStart(y+1)-civilStart(y),BigInt(days)*86400n);
  const rows=Array.from({length:5},(_,i)=>({year:9999+i,zodiac:ZODIAC[i],
    startUtc:new Date(Number(civilStart(9999+i))*1000).toISOString().replace('.000Z','Z')}));
  assert.ok(rows[1].startUtc.startsWith('+010000-'));
  const cal=makeAnnualCohortCalendar('TEST_ONLY_EXTENDED_ISO',rows);
  assert.equal(cohortYear(civilStart(10000),cal),10000);
  const invalid=rows.map(row=>({...row}));invalid[1].startUtc='+010000-02-30T00:00:00Z';
  assert.throws(()=>makeAnnualCohortCalendar('TEST_ONLY_INVALID_DATE',invalid),/INVALID_UTC_TIMESTAMP/);
});

test('ten-thousand-year explicit continuation keeps IDs above65535, hashes, ages and selected rights intact',()=>{
  let cal=makeBirthGroupCalendar(voyageSegment(2027,32));
  const first=mintOrigin(civilStart(2027),cal),baseHash=cal.calendarHash;
  for(let count=32;count<10000;count+=16)cal=appendBirthGroupCalendar(cal,voyageSegment(2027+count,Math.min(16,10000-count)));
  assert.equal(cal.issuanceCohorts,10000);assert.equal(cal.yearStarts.length,10003);
  assert.equal(cal.groups.length,120000);assert.equal(cal.yearStarts[10000],civilStart(12027));
  assert.equal(cal.calendarHash,baseHash);assert.deepEqual(mintOrigin(civilStart(2027),cal),first);
  const last=mintOrigin(civilStart(12027)-1n,cal);
  assert.equal(last.groupId,120000);assert.ok(last.groupId>65535);
  assert.equal(last.birthYear,12026);assert.equal(last.birthConstellation,12);
  for(const g of cal.groups){
    assert.equal(birthGroupAt(g.start,cal).groupId,g.groupId);
    assert.equal(birthGroupAt(g.end-1n,cal).groupId,g.groupId);
  }
  const future=civilStart(12029);
  const holdings=[{groupId:first.groupId,...newCohortTranches(1003n)},{groupId:last.groupId,...newCohortTranches(1001n)}];
  const moved=transferBirthGroups(holdings,2004n,[first.groupId,last.groupId],cal);
  const settled=settleBirthGroups(moved.child,2004n,[first.groupId,last.groupId],future,cal);
  assert.equal(settled.expectedKshipWei,2004000n);
  assert.equal(settled.parent.reduce((sum,g)=>sum+g.first+g.second+g.terminal,0n),0n);
  assert.equal(currentAnnualStage(2027,civilStart(12027),cal),3);
  assert.equal(currentAnnualStage(12026,civilStart(12027),cal),1);
  assert.equal(currentAnnualStage(12026,civilStart(12028),cal),2);
  assert.equal(currentAnnualStage(12026,future,cal),3);
});

test('Earth lunar new year remains independent from civil financial years across appended2027-2028 data',()=>{
  // HKO T2027e/T2028e: Feb6 and Jan26, localUTC+8 midnight. Civil star
  // labels here are test fixtures, not astronomical solar-ingress predictions.
  const local=(year,month,day)=>BigInt(Date.UTC(year,month-1,day)/1000)-28800n;
  function lunarSegment(year,month,day,beforeZodiac){
    const starts=Array.from({length:4},(_,i)=>local(year+i,1,1));
    const newYear=local(year,month,day);
    const edges=[starts[0],local(year,1,20),local(year,2,19),local(year,3,21),local(year,4,20),
      local(year,5,21),local(year,6,22),local(year,7,23),local(year,8,23),local(year,9,23),
      local(year,10,24),local(year,11,23),local(year,12,22),starts[1],newYear]
      .sort((a,b)=>a<b?-1:a>b?1:0).filter((v,i,a)=>!i||v!==a[i-1]);
    const starEdges=[starts[0],local(year,1,20),local(year,2,19),local(year,3,21),local(year,4,20),
      local(year,5,21),local(year,6,22),local(year,7,23),local(year,8,23),local(year,9,23),
      local(year,10,24),local(year,11,23),local(year,12,22)];
    const stars=[10,11,12,1,2,3,4,5,6,7,8,9,10];
    return {version:'0x'+'88'.repeat(32),firstFinancialYear:year,yearStarts:starts,
      birthWindows:edges.slice(0,-1).map((start,i)=>({start,end:edges[i+1],
        zodiac:start<newYear?beforeZodiac:beforeZodiac%12+1,
        constellation:stars[starEdges.findLastIndex(edge=>edge<=start)]}))};
  }
  const original=makeBirthGroupCalendar(lunarSegment(2027,2,6,7));
  const early=mintOrigin(local(2027,1,1),original);
  const extended=appendBirthGroupCalendar(original,lunarSegment(2028,1,26,8));
  assert.deepEqual(mintOrigin(local(2027,1,1),extended),early);
  for(const [y,m,d,before,after] of [[2027,2,6,7,8],[2028,1,26,8,9]]){
    const atNewYear=local(y,m,d),a=mintOrigin(atNewYear-1n,extended),b=mintOrigin(atNewYear,extended);
    assert.equal(a.birthZodiac,before);assert.equal(b.birthZodiac,after);
    assert.equal(a.birthYear,y);assert.equal(b.birthYear,y);
    assert.equal(a.birthConstellation,b.birthConstellation);
  }
  assert.equal(mintOrigin(local(2028,1,1),extended).birthZodiac,8);
  assert.equal(mintOrigin(local(2028,2,29),extended).birthConstellation,12);
  assert.equal(currentAnnualStage(2027,local(2028,1,1),extended),1);
});

test('post-deployment append bounds storage work independently of constructor capacity',()=>{
  const parent=makeBirthGroupCalendar(voyageSegment(2027,2));
  const config=voyageSegment(2029,2),start=config.yearStarts[0],end=config.yearStarts[2];
  config.birthWindows=Array.from({length:257},(_,i)=>({
    start:start+(end-start)*BigInt(i)/257n,end:start+(end-start)*BigInt(i+1)/257n,zodiac:1,constellation:i%12+1}));
  assert.equal(makeBirthGroupCalendar(config).birthWindows.length,257,'constructor retains its existing512-window bound');
  assert.throws(()=>appendBirthGroupCalendar(parent,config),/CALENDAR_APPEND_WINDOW_BOUND/);
});
