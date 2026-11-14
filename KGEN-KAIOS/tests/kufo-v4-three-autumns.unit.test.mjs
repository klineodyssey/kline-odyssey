import assert from "node:assert/strict";
import test from "node:test";
import { AbiCoder,keccak256 } from "ethers";
import { alchemyQuote,makeMonthlyCalendar,constructorCalendarConfig,civilDate,civilTimestamp,
 calendarBoundary,birthGroupAt,birthGroupMetadata,mintOrigin,groupCalendarHash,cohortYear,
 currentAnnualStage,annualConversionState,newCohortTranches,splitCohortTranches,claimableTranches,
 transferBirthGroups,settleBirthGroups,MAX_BATCH_GROUPS,ZODIAC,THIRTEEN_ZODIAC,UNIVERSE_TIERS,
 universeMonth,MONTH_CONSTELLATION_IDS,CONSTELLATIONS } from "../runtime/kufo-policy.mjs";
// Explicit synthetic deployment fixture, not production adoption.
const cfg=()=>({version:"0x"+"11".repeat(32),activationTime:BigInt(Date.UTC(2027,0,1)/1000)-28800n,
 utcOffsetSeconds:28800,constellationByMonth:[10,11,12,1,2,3,4,5,6,7,8,9]});
const calendar=makeMonthlyCalendar(cfg()),E18=10n**18n;
const at=(y,m=1,d=1)=>BigInt(Date.UTC(y,m-1,d)/1000)-28800n;
test("protocol quote preserves exact burn ratio and KGEN current-balance threshold",()=>{
 assert.deepEqual(alchemyQuote(E18),{requiredKgenWei:E18/1000n,kufoWei:E18*1000n});
 for(const n of [0n,999n,1001n,1,1.2,"1000",null])assert.throws(()=>alchemyQuote(n));
 assert.deepEqual(alchemyQuote(1000n),{requiredKgenWei:1n,kufoWei:1000000n});
});
test("calendar constructor commits all required fields and freezes the exact ABI payload",()=>{
 const input=cfg(),cal=makeMonthlyCalendar(input),payload=constructorCalendarConfig(cal);
 assert.equal(cal.calendarHash,keccak256(AbiCoder.defaultAbiCoder().encode(
 ["bytes32","uint64","int32","uint8[12]"],[input.version,input.activationTime,input.utcOffsetSeconds,input.constellationByMonth])));
 input.constellationByMonth.reverse();input.utcOffsetSeconds=0;
 assert.equal(cal.utcOffsetSeconds,28800);assert.equal(cal.constellationByMonth[0],10);
 assert.ok(Object.isFrozen(cal)&&Object.isFrozen(cal.constellationByMonth)&&Object.isFrozen(payload));
 assert.throws(()=>{payload.constellationByMonth[0]=12;},TypeError);
 const changed=cfg();changed.constellationByMonth.reverse();assert.throws(()=>makeMonthlyCalendar(changed),/UNAPPROVED_MONTHLY_RULES/);
});
test("missing malformed and duplicate configuration fails closed without silent defaults",()=>{
 for(const mutate of [c=>c.utcOffsetSeconds=0,c=>c.constellationByMonth=Array.from({length:12},(_,i)=>i+1),c=>delete c.version,c=>c.version="0x"+"00".repeat(32),c=>c.activationTime=0n,
 c=>c.activationTime=1n<<64n,c=>c.activationTime=123,c=>delete c.utcOffsetSeconds,c=>c.utcOffsetSeconds=28801,
 c=>c.utcOffsetSeconds=-43260,c=>c.utcOffsetSeconds=50460,c=>c.constellationByMonth.pop(),
 c=>c.constellationByMonth[0]=0,c=>c.constellationByMonth[0]=13,c=>c.constellationByMonth[0]=2,
 c=>c.constellationByMonth[0]="1"]){const input=cfg();mutate(input);assert.throws(()=>makeMonthlyCalendar(input));}
 assert.throws(()=>mintOrigin(at(2027),{...calendar}),/MONTHLY_CALENDAR_REQUIRED/);
});
test("whole months switch together at the timezone boundary and never within a month",()=>{
 for(let month=1;month<=12;month++){
  const t=at(2027,month),g=birthGroupAt(t,calendar);
  assert.equal(g.month,month);assert.equal(g.tierId,month);assert.equal(g.constellation,MONTH_CONSTELLATION_IDS[month-1]);
  assert.deepEqual(birthGroupAt(g.end-1n,calendar),g);
  assert.equal(mintOrigin(g.start,calendar).birthMonth,month);
  if(month>1)assert.equal(birthGroupAt(t-1n,calendar).month,month-1);
 }
 assert.equal(birthGroupAt(at(2028)-1n,calendar).tierId,12);
 assert.equal(birthGroupAt(at(2028),calendar).tierId,1);
 assert.equal(birthGroupAt(at(2027,11,14),calendar).tierId,11);
});
test("activation in the middle of a month cannot backdate a mint",()=>{
 const input=cfg();input.activationTime=at(2027,3,17)+7n;
 const cal=makeMonthlyCalendar(input);
 assert.throws(()=>mintOrigin(input.activationTime-1n,cal),/ISSUANCE_NOT_ACTIVE/);
 assert.equal(birthGroupAt(input.activationTime,cal).groupId,3);
 assert.equal(birthGroupAt(input.activationTime,cal).start,input.activationTime);
 assert.equal(calendarBoundary(1,cal),at(2028));
 assert.throws(()=>birthGroupMetadata(2,cal),/INVALID_BIRTH_GROUP/);
 const early=makeMonthlyCalendar({...cfg(),activationTime:1n});assert.equal(birthGroupAt(1n,early).start,1n);
});
test("Gregorian leap century and distant dates match an independent ECMAScript date oracle",()=>{
 for(const y of [1971,2000,2027,2100,2400,9999,10000,12000,12027,275000]){
  for(const m of [1,2,3,6,12])for(const d of [1,15,28]){
   const expected=BigInt(Date.UTC(y,m-1,d)/1000);
   for(const off of [-43200,0,28800,50400]){
    assert.equal(civilTimestamp(y,m,d,off),expected-BigInt(off));
    assert.deepEqual(civilDate(expected-BigInt(off),off),{year:y,month:m,day:d});
   }
  }
 }
 assert.throws(()=>civilTimestamp(2100,2,29),/INVALID_CIVIL_DATE/);
 for(const y of [2000,2400,10000,12000])assert.equal(civilDate(civilTimestamp(y,2,29)).day,29);
});
test("10000 years of real civil month boundaries need no table or append",()=>{
 const original=mintOrigin(at(2027,10),calendar);
 let id=1;
 for(let y=2027;y<12027;y++)for(let m=1;m<=12;m++,id++){
  const start=at(y,m),next=m===12?at(y+1):at(y,m+1),g=birthGroupAt(start,calendar);
  assert.equal(g.groupId,id);assert.equal(g.start,start);assert.equal(g.end,next);
  assert.equal(g.month,m);assert.equal(g.tierId,m);assert.equal(g.constellation,MONTH_CONSTELLATION_IDS[m-1]);
 }
 assert.equal(birthGroupAt(at(2039),calendar).financialYear,2039);
 assert.equal(birthGroupAt(at(12027),calendar).groupId,120001);
 assert.deepEqual(mintOrigin(original.bornAtSec,calendar),original);
 assert.equal(groupCalendarHash(120001,calendar),calendar.calendarHash);
});
test("shared annual boundaries remain50 75 100 and monthly switches do not mature money",()=>{
 const born=2027;
 assert.equal(currentAnnualStage(born,at(2027,12,31),calendar),0);
 for(const [year,stage,amount] of [[2028,1,E18/2n],[2029,2,E18*3n/4n],[2030,3,E18]]){
  assert.equal(currentAnnualStage(born,at(year),calendar),stage);
  assert.equal(annualConversionState(E18,0n,born,at(year),calendar).claimableKufoWei,amount);
 }
 assert.equal(annualConversionState(E18,0n,born,at(2028)-1n,calendar).claimableKufoWei,0n);
 const late=mintOrigin(at(2028)-1n,calendar);
 assert.equal(currentAnnualStage(late.birthYear,at(2028),calendar),1);
 assert.equal(cohortYear(at(2028),calendar),2028);
});
test("missed years remain claimable and the terminal tranche sweeps every odd residue",()=>{
 for(const amount of [1n,3n,1003n,E18]){
  const prior=amount*3n/4n;
  const state=annualConversionState(amount,prior,2027,at(12027),calendar);
  assert.equal(state.claimableKufoWei+prior,amount);assert.equal(state.projectedRemainingKufoWei,0n);
  assert.equal(state.expectedKshipWei,(amount-prior)*1000n);assert.ok(state.terminal);
  assert.equal(annualConversionState(amount,amount,2027,at(12027),calendar).claimableKufoWei,0n);
 }
 assert.throws(()=>annualConversionState(3n,2n,2027,at(2028),calendar),/CONVERTED_OUT_OF_RANGE/);
});
test("partial transfer conserves every outstanding tranche before and after settlement",()=>{
 for(let initial=1n;initial<=99n;initial++){
  const born=newCohortTranches(initial);
  for(const original of [born,{...born,first:0n},{first:1n,second:1n,terminal:0n}]){
   const live=original.first+original.second+original.terminal;
   for(let take=1n;take<=live;take++){
    const {parent,child}=splitCohortTranches(original,take);
    assert.equal(child.first+child.second+child.terminal,take);
    for(const key of ["first","second","terminal"]){assert.ok(parent[key]>=0n&&child[key]>=0n);assert.equal(parent[key]+child[key],original[key]);}
   }
  }
 }
});
test("mint rounding stays proof granular after same-month aggregation",()=>{
 const a=newCohortTranches(1n),b=newCohortTranches(1n);
 assert.equal(a.first+b.first,0n);assert.equal(newCohortTranches(2n).first,1n);
 assert.equal(a.terminal+b.terminal,2n);
});
test("group transfers preserve immutable metadata and settlement uses each original year",()=>{
 const holdings=[{groupId:10,...newCohortTranches(1003n)},{groupId:13,...newCohortTranches(1001n)}];
 const before=structuredClone(holdings),first=settleBirthGroups(holdings,200n,[10],at(2028),calendar);
 const moved=transferBirthGroups(first.parent,900n,[10,13],calendar);
 for(const original of first.parent){
  const parent=moved.parent.find(g=>g.groupId===original.groupId),child=moved.child.find(g=>g.groupId===original.groupId);
  for(const k of ["first","second","terminal"])assert.equal(parent[k]+(child?.[k]??0n),original[k]);
 }
 assert.equal(birthGroupMetadata(10,calendar).tierId,10);assert.equal(birthGroupMetadata(13,calendar).financialYear,2028);
 const settled=settleBirthGroups(moved.child,900n,[10,13],at(12027),calendar);
 assert.equal(settled.expectedKshipWei,900000n);
 assert.equal(settled.parent.reduce((n,g)=>n+g.first+g.second+g.terminal,0n),0n);
 assert.deepEqual(holdings,before);
 assert.throws(()=>settleBirthGroups(holdings,1n,[13],at(2028),calendar),/MATURITY_INSUFFICIENT/);
 assert.throws(()=>transferBirthGroups(holdings,1004n,[10],calendar),/BALANCE_INSUFFICIENT/);
});
test("33 real monthly groups remain movable through bounded32 plus1 batches",()=>{
 const holdings=Array.from({length:33},(_,i)=>({groupId:i+1,...newCohortTranches(1n)})),ids=holdings.map(g=>g.groupId);
 assert.equal(MAX_BATCH_GROUPS,32);assert.throws(()=>transferBirthGroups(holdings,33n,ids,calendar),/INVALID_GROUP_SELECTION/);
 const first=transferBirthGroups(holdings,32n,ids.slice(0,32),calendar),last=transferBirthGroups(first.parent,1n,[33],calendar);
 const a=settleBirthGroups(first.child,32n,ids.slice(0,32),at(12027),calendar),b=settleBirthGroups(last.child,1n,[33],at(12027),calendar);
 assert.equal(a.expectedKshipWei+b.expectedKshipWei,33000n);
 assert.equal(last.parent.reduce((n,g)=>n+g.first+g.second+g.terminal,0n),0n);
 for(const selection of [[],[0],[2,1],[1,1],[0x100000000]])assert.throws(()=>transferBirthGroups(holdings,1n,selection,calendar),/INVALID_GROUP_SELECTION/);
 assert.throws(()=>transferBirthGroups([holdings[0],holdings[0]],1n,[1],calendar),/INVALID_GROUP_HOLDINGS/);
});
test("time and identifiers fail closed before truncation while old holdings settle at the far horizon",()=>{
 for(const t of [-1n,1n<<64n,123,NaN,"1"])assert.throws(()=>civilDate(t));
 for(const id of [0,-1,1.5,0x100000000])assert.throws(()=>birthGroupMetadata(id,calendar));
 assert.throws(()=>mintOrigin(at(2027)-1n,calendar),/ISSUANCE_NOT_ACTIVE/);
 assert.throws(()=>birthGroupAt((1n<<64n)-1n,calendar),/CALENDAR_IDENTIFIER_OVERFLOW/);
 assert.equal(currentAnnualStage(2027,(1n<<64n)-1n,calendar),3);
 assert.throws(()=>civilDate((1n<<64n)-1n,28800),/CIVIL_YEAR_OVERFLOW/);
 const holding=[{groupId:1,...newCohortTranches(1000n)}];
 assert.throws(()=>settleBirthGroups(holding,1n,[1,25],at(2028),calendar),/INVALID_GROUP_SELECTION/);
 assert.equal(settleBirthGroups(holding,1000n,[1],(1n<<64n)-1n,calendar).expectedKshipWei,1000000n);
 assert.throws(()=>currentAnnualStage(2026,at(2028),calendar),/INVALID_BIRTH_YEAR/);
});

const monthlyTierNames = [
  "修練佛", "魔王", "凡人", "龍", "神仙", "神明", "神君（玉皇大帝）",
  "外星人", "變形金剛", "十三生肖", "人類", "萬靈",
];

test("the monthly universe tiers have the exact frozen12-entry order and retain the Earth zodiac", () => {
  assert.deepEqual(THIRTEEN_ZODIAC, [...ZODIAC, "AI類"]);
  assert.deepEqual(MONTH_CONSTELLATION_IDS.map(id=>CONSTELLATIONS[id-1]),["摩羯","水瓶","雙魚","牡羊","金牛","雙子","巨蟹","獅子","處女","天秤","天蠍","射手"]);
  assert.equal(THIRTEEN_ZODIAC.length, 13);
  assert.equal(THIRTEEN_ZODIAC.includes("人類"), false);
  assert.ok(Object.isFrozen(THIRTEEN_ZODIAC));
  assert.throws(() => { THIRTEEN_ZODIAC[12] = "人類"; }, TypeError);
  assert.deepEqual(UNIVERSE_TIERS, monthlyTierNames);
  assert.equal(UNIVERSE_TIERS.length, 12);
  assert.deepEqual(ZODIAC, ["鼠", "牛", "虎", "兔", "龍", "蛇", "馬", "羊", "猴", "雞", "狗", "豬"]);
  assert.ok(Object.isFrozen(ZODIAC));
  assert.ok(Object.isFrozen(UNIVERSE_TIERS));
  assert.throws(() => { UNIVERSE_TIERS[0] = "changed"; }, TypeError);
  assert.throws(() => { UNIVERSE_TIERS.push("extra"); }, TypeError);
  assert.deepEqual(UNIVERSE_TIERS, monthlyTierNames);
});

test("monthly tiers and constellation slots advance through12-month years and500-year epochs", () => {
  const boundaries = [
    [1n, 1n, 1, "修練佛", 1n, 1],
    [10n, 1n, 10, "十三生肖", 1n, 1],
    [11n, 1n, 11, "人類", 1n, 1],
    [12n, 1n, 12, "萬靈", 1n, 1],
    [13n, 2n, 1, "修練佛", 1n, 2],
    [5999n, 500n, 11, "人類", 1n, 500],
    [6000n, 500n, 12, "萬靈", 1n, 500],
    [6001n, 501n, 1, "修練佛", 2n, 1],
    [120_000n, 10_000n, 12, "萬靈", 20n, 500],
  ];
  for (const [absoluteMonth, year, monthInYear, tier, epoch500, yearInEpoch500] of boundaries) {
    assert.deepEqual(universeMonth(absoluteMonth), {
      absoluteMonth, year, monthInYear, tierId: monthInYear, tier,
      constellationSlot: monthInYear, epoch500, yearInEpoch500,
    });
  }
});

test("120000 relative months match independent monthly cursors and preserve earlier records", () => {
  let year = 1n;
  let monthInYear = 1;
  let epoch500 = 1n;
  let yearInEpoch500 = 1;
  const earlier = universeMonth(6000n);
  const earlierSnapshot = { ...earlier };
  for (let absoluteMonth = 1n; absoluteMonth <= 120_000n; absoluteMonth += 1n) {
    const projected = universeMonth(absoluteMonth);
    assert.deepEqual(projected, {
      absoluteMonth, year, monthInYear, tierId: monthInYear,
      tier: monthlyTierNames[monthInYear - 1], constellationSlot: monthInYear,
      epoch500, yearInEpoch500,
    });
    assert.ok(Object.isFrozen(projected));
    monthInYear += 1;
    if (monthInYear === 13) {
      monthInYear = 1;
      year += 1n;
      yearInEpoch500 += 1;
      if (yearInEpoch500 === 501) {
        yearInEpoch500 = 1;
        epoch500 += 1n;
      }
    }
  }
  assert.deepEqual(earlier, earlierSnapshot);
  assert.throws(() => { earlier.tier = "changed"; }, TypeError);
  assert.throws(() => { earlier.constellationSlot = 0; }, TypeError);
  assert.equal(universeMonth(120_000n).year, 10_000n);
  assert.equal(universeMonth(120_000n).monthInYear, 12);
  assert.equal(universeMonth(120_000n).epoch500, 20n);
  assert.equal(universeMonth(120_000n).yearInEpoch500, 500);
});

test("universe month projections reject coercion and values outside the positive uint32 domain", () => {
  const invalid = [1, 12, 1.5, NaN, Infinity, "1", "13", null, undefined, true, {}, [], Object(1n), 0n, -1n, 1n << 32n];
  for (const value of invalid) {
    assert.throws(() => universeMonth(value), { name: "RangeError", message: "UNIVERSE_MONTH_UINT32_REQUIRED" });
  }
  const maximum = 0xffff_ffffn;
  const projected = universeMonth(maximum);
  assert.equal(projected.absoluteMonth, maximum);
  assert.ok(Object.isFrozen(projected));
  assert.ok(Number.isInteger(projected.monthInYear) && projected.monthInYear >= 1 && projected.monthInYear <= 12);
  assert.ok(Number.isInteger(projected.yearInEpoch500) && projected.yearInEpoch500 >= 1 && projected.yearInEpoch500 <= 500);
  assert.equal(projected.tierId, projected.monthInYear);
  assert.equal(projected.constellationSlot, projected.monthInYear);
  assert.equal(projected.tier, monthlyTierNames[projected.monthInYear - 1]);
  assert.equal((projected.year - 1n) * 12n + BigInt(projected.monthInYear), maximum);
  assert.equal((projected.epoch500 - 1n) * 500n + BigInt(projected.yearInEpoch500), projected.year);
});
