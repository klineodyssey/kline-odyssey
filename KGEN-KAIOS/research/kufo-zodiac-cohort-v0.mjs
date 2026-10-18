// KUFO zodiac cohort experiment: off-chain preview only. PR #201 is the parent design.
// This adds no wallet, signer, mint, burn, transaction, deployment, or live order.
export const ZODIAC=Object.freeze(["鼠","牛","虎","兔","龍","蛇","馬","羊","猴","雞","狗","豬"]);
export const KSHIP_PER_KUFO=1000n;
function secs(text) {
  if(typeof text!=="string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(text)) throw new TypeError("UTC_TIMESTAMP_REQUIRED");
  const n=Date.parse(text);
  if(!Number.isFinite(n)||new Date(n).toISOString()!==text.replace("Z",".000Z")) throw new RangeError("INVALID_UTC_TIMESTAMP");
  return BigInt(n/1000);
}
// The active KGEN zodiac calendar is an external, versioned INPUT.
// The final element is a mandatory upper-bound sentinel to fail closed.
export function makeZodiacCalendar(version,years) {
  if(typeof version!=="string"||version.length<3)throw new TypeError("CALENDAR_VERSION_REQUIRED");
  if(!Array.isArray(years)||years.length<4)throw new RangeError("CALENDAR_COVERAGE_REQUIRED");
  const entries=years.map(y=>{
    if(!Number.isInteger(y.year)||y.year<1||!ZODIAC.includes(y.zodiac))throw new RangeError("INVALID_COHORT");
    return Object.freeze({year:y.year,zodiac:y.zodiac,start:secs(y.startUtc)});
  });
  for(let i=1;i<entries.length;i++){
    if(entries[i].year!==entries[i-1].year+1||entries[i].start<=entries[i-1].start)throw new RangeError("INVALID_YEAR_ORDER");
    if(ZODIAC.indexOf(entries[i].zodiac)!==(ZODIAC.indexOf(entries[i-1].zodiac)+1)%12)throw new RangeError("INVALID_ZODIAC_ORDER");
  }
  return Object.freeze({version,entries:Object.freeze(entries)});
}
function yearFor(t,cal) {
  if(typeof t!=="bigint"||t<0n)throw new TypeError("NONNEGATIVE_BIGINT_EPOCH_REQUIRED");
  if(!cal||!Array.isArray(cal.entries))throw new TypeError("CALENDAR_REQUIRED");
  for(let i=0;i<cal.entries.length-1;i++){
    if(t>=cal.entries[i].start&&t<cal.entries[i+1].start)return cal.entries[i];
  }
  throw new RangeError("YEAR_NOT_COVERED");
}
// Same-year KUFO births retain their birth zodiac, and change ACTIVE zodiac
// at the same shared year-boundary. 50/75/100% targets reuse PR #201.
export function previewKufoZodiacCohort({batchId,initialKufoWei,convertedKufoWei,bornAtSec,asOfSec,calendar}){
  if(typeof batchId!=="string"||!batchId)throw new TypeError("BATCH_ID_REQUIRED");
  if(typeof initialKufoWei!=="bigint"||typeof convertedKufoWei!=="bigint"||
     initialKufoWei<=0n||convertedKufoWei<0n||convertedKufoWei>initialKufoWei)throw new RangeError("INVALID_AMOUNT");
  if(typeof bornAtSec!=="bigint"||typeof asOfSec!=="bigint"||asOfSec<bornAtSec)throw new RangeError("INVALID_TIME");
  const born=yearFor(bornAtSec,calendar),now=yearFor(asOfSec,calendar);
  const autumn=Math.min(3,now.year-born.year);
  if(autumn<0)throw new RangeError("NEGATIVE_COHORT_AGE");
  const target=autumn===0?0n:autumn===1?initialKufoWei/2n:autumn===2?initialKufoWei*3n/4n:initialKufoWei;
  if(convertedKufoWei>target)throw new RangeError("CONVERTED_EXCEEDS_TARGET");
  const eligibleKufoWei=target-convertedKufoWei;
  return Object.freeze({batchId,calendarVersion:calendar.version,birthYear:born.year,birthZodiac:born.zodiac,
     activeYear:now.year,activeZodiac:now.zodiac,autumn,eligibleKufoWei,
     projectedKshipWei:eligibleKufoWei*KSHIP_PER_KUFO,remainingKufoWei:initialKufoWei-target,
     terminal:target===initialKufoWei,execution:"SIMULATION_PREVIEW_ONLY",chainWritesAuthorized:false});
}
export function sameRuntimeLatency(events){
  if(!Array.isArray(events)||events.length<2)return {status:"UNKNOWN",reason:"MISSING_EVENTS"};
  const segments=[];
  for(let i=1;i<events.length;i++){
    const a=events[i-1],b=events[i];
    if(!a||!b||!a.name||!b.name||typeof a.ns!=="bigint"||typeof b.ns!=="bigint")
       return {status:"UNKNOWN",reason:"INVALID_CLOCK"};
    if(b.ns<a.ns)return {status:"UNKNOWN",reason:"BACKWARD_CLOCK"};
    segments.push({from:a.name,to:b.name,durationNs:b.ns-a.ns});
  }
  return {status:"SAME_RUNTIME_ONLY",totalNs:events.at(-1).ns-events[0].ns,segments};
}