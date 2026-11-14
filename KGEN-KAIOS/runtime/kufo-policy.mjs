// KUFO monthly-calendar review candidate. Pure projections; no wallet or execution.
// Gregorian algorithms: https://howardhinnant.github.io/date_algorithms.html
// Production constructor values require Human adoption; no default is selected.
import { AbiCoder, keccak256 } from "ethers";
export const ZODIAC = Object.freeze(["鼠","牛","虎","兔","龍","蛇","馬","羊","猴","雞","狗","豬"]);
export const THIRTEEN_ZODIAC = Object.freeze([...ZODIAC, "AI類"]);
export const UNIVERSE_TIERS = Object.freeze([
 "修練佛","魔王","凡人","龍","神仙","神明","神君（玉皇大帝）",
 "外星人","變形金剛","十三生肖","人類","萬靈",
]);
// Reference IDs, not a chosen month mapping. Supply all12 explicitly.
export const CONSTELLATIONS = Object.freeze(["牡羊","金牛","雙子","巨蟹","獅子","處女","天秤","天蠍","射手","摩羯","水瓶","雙魚"]);
export const KAIOS_PER_KGEN=1000n, KUFO_PER_KAIOS=1000n, KSHIP_PER_KUFO=1000n;
export const MAX_BATCH_GROUPS=32;
const U32=0xffffffffn,U64=(1n<<64n)-1n,DAY=86400n;
export const MONTH_CONSTELLATION_IDS=Object.freeze([10,11,12,1,2,3,4,5,6,7,8,9]);
const configuredCalendars=new WeakSet();
export function universeMonth(absoluteMonth) {
 if(typeof absoluteMonth!=="bigint"||absoluteMonth<1n||absoluteMonth>U32)throw new RangeError("UNIVERSE_MONTH_UINT32_REQUIRED");
 const elapsed=absoluteMonth-1n,monthInYear=Number(elapsed%12n)+1,year=elapsed/12n+1n;
 return Object.freeze({absoluteMonth,year,monthInYear,tierId:monthInYear,tier:UNIVERSE_TIERS[monthInYear-1],
  constellationSlot:monthInYear,epoch500:(year-1n)/500n+1n,yearInEpoch500:Number((year-1n)%500n)+1});
}
function seconds(value){if(typeof value!=="bigint"||value<0n||value>U64)throw new RangeError("INVALID_UINT64_TIMESTAMP");return value;}
function offset(value){if(!Number.isInteger(value)||value< -43200||value>50400||value%60)throw new RangeError("INVALID_UTC_OFFSET");return BigInt(value);}
const leap=y=>y%4n===0n&&(y%100n!==0n||y%400n===0n);
const monthDays=(y,m)=>m===2?(leap(y)?29:28):([4,6,9,11].includes(m)?30:31);
function civilDays(y,m,d){
 y-=m<=2?1n:0n;const era=y/400n,yoe=y-era*400n;
 const mp=BigInt(m+(m>2?-3:9)),doy=(153n*mp+2n)/5n+BigInt(d)-1n;
 return era*146097n+yoe*365n+yoe/4n-yoe/100n+doy-719468n;
}
export function civilTimestamp(year,month,day=1,utcOffsetSeconds=0){
 if(!Number.isInteger(year)||year<1970||year>0xffffffff||!Number.isInteger(month)||month<1||month>12||
 !Number.isInteger(day)||day<1||day>monthDays(BigInt(year),month))throw new RangeError("INVALID_CIVIL_DATE");
 return seconds(civilDays(BigInt(year),month,day)*DAY-offset(utcOffsetSeconds));
}
function wideCivilDate(timestamp,utcOffsetSeconds=0){
 const local=seconds(timestamp)+offset(utcOffsetSeconds);
 if(local<0n)throw new RangeError("TIME_BEFORE_CIVIL_EPOCH");
 const z=local/DAY+719468n,era=z/146097n,doe=z-era*146097n;
 const yoe=(doe-doe/1460n+doe/36524n-doe/146096n)/365n;
 let year=yoe+era*400n;const doy=doe-(365n*yoe+yoe/4n-yoe/100n),mp=(5n*doy+2n)/153n;
 const day=doy-(153n*mp+2n)/5n+1n,month=mp+(mp<10n?3n:-9n);
 year+=month<=2n?1n:0n;

 return Object.freeze({year:Number(year),month:Number(month),day:Number(day)});
}
export function civilDate(timestamp,utcOffsetSeconds=0){
 const result=wideCivilDate(timestamp,utcOffsetSeconds);
 if(result.year>0xffffffff)throw new RangeError("CIVIL_YEAR_OVERFLOW");
 return result;
}
export function makeMonthlyCalendar(config){
 if(!config||typeof config.version!=="string"||!/^0x[0-9a-fA-F]{64}$/.test(config.version)||/^0x0{64}$/i.test(config.version))throw new TypeError("CALENDAR_VERSION_REQUIRED");
 const activationTime=seconds(config.activationTime);if(!activationTime)throw new RangeError("ACTIVATION_REQUIRED");
 offset(config.utcOffsetSeconds);
 const mapping=config.constellationByMonth;
 if(!Array.isArray(mapping)||mapping.length!==12||new Set(mapping).size!==12||
 mapping.some(v=>!Number.isInteger(v)||v<1||v>12))throw new RangeError("CONSTELLATION_MAPPING_REQUIRED");
 if(config.utcOffsetSeconds!==28800||mapping.some((v,i)=>v!==MONTH_CONSTELLATION_IDS[i]))throw new RangeError("UNAPPROVED_MONTHLY_RULES");
 const firstDate=civilDate(activationTime,config.utcOffsetSeconds),firstBirthYear=firstDate.year,firstGroupId=firstDate.month;
 if(firstBirthYear>0xffffffff-3)throw new RangeError("CALENDAR_YEAR_OVERFLOW");
 const constellationByMonth=Object.freeze([...mapping]),version=config.version.toLowerCase();
 const calendarHash=keccak256(AbiCoder.defaultAbiCoder().encode(
 ["bytes32","uint64","int32","uint8[12]"],[version,activationTime,config.utcOffsetSeconds,constellationByMonth]));
 const result=Object.freeze({version,activationTime,utcOffsetSeconds:config.utcOffsetSeconds,
 constellationByMonth,firstBirthYear,firstGroupId,calendarHash});
 configuredCalendars.add(result);return result;
}
function validateCalendar(calendar){if(!configuredCalendars.has(calendar))throw new TypeError("MONTHLY_CALENDAR_REQUIRED");}
export function constructorCalendarConfig(calendar){
 validateCalendar(calendar);return Object.freeze({version:calendar.version,activationTime:calendar.activationTime,
 utcOffsetSeconds:calendar.utcOffsetSeconds,constellationByMonth:calendar.constellationByMonth});
}
export function calendarBoundary(index,calendar){
 validateCalendar(calendar);
 if(!Number.isInteger(index)||index<0||calendar.firstBirthYear+index>0xffffffff)throw new RangeError("CALENDAR_YEAR_OVERFLOW");
 return civilTimestamp(calendar.firstBirthYear+index,1,1,calendar.utcOffsetSeconds);
}
export function birthGroupMetadata(groupId,calendar){
 validateCalendar(calendar);
 if(!Number.isInteger(groupId)||groupId<calendar.firstGroupId||BigInt(groupId)>U32)throw new RangeError("INVALID_BIRTH_GROUP");
 const financialYear=calendar.firstBirthYear+Math.floor((groupId-1)/12),month=(groupId-1)%12+1;
 if(financialYear>0xffffffff-3)throw new RangeError("CALENDAR_YEAR_OVERFLOW");
 const monthStart=civilDays(BigInt(financialYear),month,1)*DAY-offset(calendar.utcOffsetSeconds), start=monthStart<calendar.activationTime?calendar.activationTime:monthStart,
 end=civilTimestamp(month===12?financialYear+1:financialYear,month===12?1:month+1,1,calendar.utcOffsetSeconds);
 return Object.freeze({groupId,start,end,financialYear,month,tierId:month,constellation:calendar.constellationByMonth[month-1]});
}
export function groupCalendarHash(groupId,calendar){birthGroupMetadata(groupId,calendar);return calendar.calendarHash;}
export function birthGroupAt(timestamp,calendar){
 validateCalendar(calendar);seconds(timestamp);
 if(timestamp<calendar.activationTime)throw new RangeError("ISSUANCE_NOT_ACTIVE");
 const date=wideCivilDate(timestamp,calendar.utcOffsetSeconds);
 const id=BigInt(date.year-calendar.firstBirthYear)*12n+BigInt(date.month);
 if(id<1n||id>U32)throw new RangeError("CALENDAR_IDENTIFIER_OVERFLOW");
 return birthGroupMetadata(Number(id),calendar);
}
export function cohortYear(timestamp,calendar){
 validateCalendar(calendar);if(seconds(timestamp)<calendar.activationTime)throw new RangeError("TIME_BEFORE_CALENDAR");
 return wideCivilDate(timestamp,calendar.utcOffsetSeconds).year;
}
function birthYearCheck(year,calendar){
 validateCalendar(calendar);
 if(!Number.isInteger(year)||year<calendar.firstBirthYear||year>0xffffffff-3||
 BigInt(year-calendar.firstBirthYear)*12n+1n>U32)throw new RangeError("INVALID_BIRTH_YEAR");
}
export function mintOrigin(timestamp,calendar){
 const group=birthGroupAt(timestamp,calendar);
 return Object.freeze({bornAtSec:timestamp,birthYear:group.financialYear,birthMonth:group.month,birthTierId:group.tierId,
 birthConstellation:group.constellation,groupId:group.groupId,calendarVersion:calendar.version,calendarHash:calendar.calendarHash});
}
export function alchemyQuote(kaiosWei){
 if(typeof kaiosWei!=="bigint"||kaiosWei<1000n||kaiosWei%1000n)throw new RangeError("KAIOS_AMOUNT_MUST_BE_AT_LEAST_1000_WEI_AND_DIVISIBLE_BY_1000");
 return Object.freeze({requiredKgenWei:kaiosWei/1000n,kufoWei:kaiosWei*1000n});
}
export function currentAnnualStage(birthYear,asOfSec,calendar){
 birthYearCheck(birthYear,calendar);
 return Math.min(3,Math.max(0,cohortYear(asOfSec,calendar)-birthYear));
}
export function annualConversionTarget(initialKufoWei,birthYear,asOfSec,calendar){
 if(typeof initialKufoWei!=="bigint"||initialKufoWei<0n)throw new TypeError("initialKufoWei");
 const stage=currentAnnualStage(birthYear,asOfSec,calendar);
 return stage===0?0n:stage===1?initialKufoWei/2n:stage===2?initialKufoWei*3n/4n:initialKufoWei;
}
export function annualConversionState(initialKufoWei,alreadyConvertedWei,birthYear,asOfSec,calendar){
 const target=annualConversionTarget(initialKufoWei,birthYear,asOfSec,calendar);
 if(typeof alreadyConvertedWei!=="bigint"||alreadyConvertedWei<0n||alreadyConvertedWei>target)throw new RangeError("CONVERTED_OUT_OF_RANGE");
 const claimableKufoWei=target-alreadyConvertedWei;
 return Object.freeze({targetConvertedKufoWei:target,claimableKufoWei,expectedKshipWei:claimableKufoWei*1000n,
 projectedRemainingKufoWei:initialKufoWei-target,terminal:currentAnnualStage(birthYear,asOfSec,calendar)===3});
}
// Historical source-compatible function names; all use this one annual policy.
export const currentAutumn=currentAnnualStage,threeAutumnTarget=annualConversionTarget,threeAutumnState=annualConversionState;

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
  const autumn = currentAnnualStage(birthYear, asOfSec, calendar);
  return (autumn >= 1 ? item.first : 0n) + (autumn >= 2 ? item.second : 0n) + (autumn >= 3 ? item.terminal : 0n);
}

function selectedHoldings(holdings, ids, calendar) {
  validateCalendar(calendar);
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > MAX_BATCH_GROUPS || ids.some((id,i)=>!Number.isInteger(id) || id < 1 || BigInt(id) > U32 || i && id <= ids[i-1])) throw new RangeError("INVALID_GROUP_SELECTION");
  if (!Array.isArray(holdings) || holdings.length > 0xffffffff) throw new RangeError("INVALID_GROUP_HOLDINGS");
  for(const groupId of ids)birthGroupMetadata(groupId,calendar);
  const balances=new Map();
  for (const item of holdings) {
    validateTranches(item);
    if (!Number.isInteger(item.groupId) || item.groupId < 1 || BigInt(item.groupId) > U32 || balances.has(item.groupId)) throw new RangeError("INVALID_GROUP_HOLDINGS");
    birthGroupMetadata(item.groupId,calendar);
    balances.set(item.groupId,{groupId:item.groupId,first:item.first,second:item.second,terminal:item.terminal});
  }
  return balances;
}
const freezeHoldings = balances => Object.freeze([...balances.values()].map(Object.freeze));

// Selected groups are explicit, strictly ordered, and limited to the same finite
// batch as the contract. Transfer is a holdings-construction projection without an
// as-of clock; settlement additionally checks current virtual IDs. No provider or mutation.
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
  validateCalendar(calendar);
  seconds(asOfSec);
  const date=wideCivilDate(asOfSec,calendar.utcOffsetSeconds);
  const virtualMaximum=Math.min(0xffffffff,(0xffffffff-3-calendar.firstBirthYear+1)*12);
  const currentCount=asOfSec<calendar.activationTime?0:Math.min(virtualMaximum,(date.year-calendar.firstBirthYear)*12+date.month);
  if(!Array.isArray(ids)||ids.some(id=>id>currentCount))throw new RangeError("INVALID_GROUP_SELECTION");
  const parent=selectedHoldings(holdings,ids,calendar);
  if (typeof amount !== "bigint" || amount <= 0n) throw new RangeError("POSITIVE_AMOUNT_REQUIRED");
  let remaining=amount;
  for (const groupId of ids) {
    if (!remaining) break;
    const item=parent.get(groupId);
    if (!item) continue;
    const group=birthGroupMetadata(groupId,calendar), autumn=currentAnnualStage(group.financialYear,asOfSec,calendar);
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
