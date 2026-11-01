// Offchain-only regression vectors for PR #201 cohort-year proposal.
import test from "node:test";
import assert from "node:assert/strict";
import {makeZodiacCalendar,previewKufoZodiacCohort,sameRuntimeLatency,ZODIAC} from "./kufo-zodiac-cohort-v0.mjs";
const U=10n**18n;
const calendar=makeZodiacCalendar("EXAMPLE-JAN1-NOT-CANONICAL-v0",[
 {year:2025,zodiac:"蛇",startUtc:"2025-01-01T00:00:00Z"},
 {year:2026,zodiac:"馬",startUtc:"2026-01-01T00:00:00Z"},
 {year:2027,zodiac:"羊",startUtc:"2027-01-01T00:00:00Z"},
 {year:2028,zodiac:"猴",startUtc:"2028-01-01T00:00:00Z"},
 {year:2029,zodiac:"雞",startUtc:"2029-01-01T00:00:00Z"},
 {year:2030,zodiac:"狗",startUtc:"2030-01-01T00:00:00Z"}
]);
const s=iso=>BigInt(Date.parse(iso)/1000);
const check=(born,at,converted=0n,initial=U)=>previewKufoZodiacCohort({
 batchId:"test",initialKufoWei:initial,convertedKufoWei:converted,
 bornAtSec:s(born),asOfSec:s(at),calendar
});
test("12 zodiac distinct",()=>assert.equal(new Set(ZODIAC).size,12));
test("same birth year shares birth zodiac and common first crossover",()=>{
 for(const born of ["2026-01-01T00:00:01Z","2026-06-02T08:00:00Z","2026-12-31T23:59:59Z"]){
  const a=check(born,"2027-01-01T00:00:00Z");
  assert.equal(a.birthZodiac,"馬");assert.equal(a.activeZodiac,"羊");
  assert.equal(a.projectedKshipWei,500n*U);assert.equal(a.remainingKufoWei,U/2n);
 }
});
test("before boundary no KUFO eligible",()=>{
 const a=check("2026-01-01T00:00:00Z","2026-12-31T23:59:59Z");
 assert.equal(a.projectedKshipWei,0n);
});
test("second autumn yields cumulative 75% and incremental 250 KSHIP",()=>{
 const a=check("2026-08-01T00:00:00Z","2028-01-01T00:00:00Z",U/2n);
 assert.equal(a.projectedKshipWei,250n*U);assert.equal(a.remainingKufoWei,U/4n);
});
test("third autumn yields cumulative 100% and zero dust",()=>{
 const a=check("2026-08-01T00:00:00Z","2029-01-01T00:00:00Z",U*3n/4n);
 assert.equal(a.projectedKshipWei,250n*U);assert.equal(a.remainingKufoWei,0n);
 assert.equal(a.terminal,true);
});
test("idempotent conversion projection after already settled",()=>{
 const a=check("2026-08-01T00:00:00Z","2027-01-01T00:00:00Z",U/2n);
 assert.equal(a.eligibleKufoWei,0n);
});
test("nonuniform wei rounding all consumed after third",()=>{
 const a=check("2026-08-01T00:00:00Z","2029-02-01T00:00:00Z",751n,1003n);
 assert.equal(a.projectedKshipWei,252000n);assert.equal(a.remainingKufoWei,0n);
});
test("unsupported future year, negative age and excessive conversion fail closed",()=>{
 assert.throws(()=>check("2026-12-31T23:59:59Z","2026-01-01T00:00:00Z"),/INVALID_TIME/);
 assert.throws(()=>check("2026-01-01T00:00:00Z","2027-01-01T00:00:00Z",U),/CONVERTED_EXCEEDS_TARGET/);
 assert.throws(()=>check("2026-01-01T00:00:00Z","2030-01-01T00:00:00Z"),/YEAR_NOT_COVERED/);
});
test("neural stage timings require same process monotonic clock",()=>{
 const a=sameRuntimeLatency([{name:"market",ns:10n},{name:"risk",ns:20n},{name:"preview",ns:55n}]);
 assert.equal(a.totalNs,45n);
 assert.equal(sameRuntimeLatency([{name:"send",ns:20n},{name:"ack",ns:5n}]).status,"UNKNOWN");
});
