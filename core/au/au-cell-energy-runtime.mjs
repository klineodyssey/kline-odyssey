export const AU_CELL_ENERGY_SCHEMA='AU_CELL_ENERGY_V1';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function checkedPct(x){if(x==null)return null;if(!finite(x)||x<0||x>100)throw Error('BAD_PERCENT');return x;}
function time(s){if(typeof s!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(s)||!Number.isFinite(Date.parse(s)))throw Error('BAD_UTC');return Date.parse(s);}
function ident(s){if(typeof s!=='string'||!/^[\w:-]{1,96}$/.test(s))throw Error('BAD_ID');return s;}
export function recordCellRun(v){
 const cellId=ident(v.cellId),runId=ident(v.runId),poolId=ident(v.poolId);
 const wake=time(v.wakeAtUtc),sleep=time(v.sleepAtUtc);if(sleep<wake)throw Error('TIME_REVERSED');
 const before=checkedPct(v.sevenDayBeforePct),after=checkedPct(v.sevenDayAfterPct);
 const fiveBefore=checkedPct(v.fiveHourBeforePct),fiveAfter=checkedPct(v.fiveHourAfterPct);
 if(!['OFFICIAL_UI','OFFICIAL_TOOL','NOT_AVAILABLE'].includes(v.sourceKind))throw Error('BAD_SOURCE');
 if(v.sourceKind==='NOT_AVAILABLE'&&[before,after,fiveBefore,fiveAfter].some(x=>x!==null))throw Error('UNSOURCED_USAGE');
 const resetBefore=v.resetBeforeUtc??null,resetAfter=v.resetAfterUtc??null;
 if(resetBefore)time(resetBefore);if(resetAfter)time(resetAfter);
 const sameWindow=!!resetBefore&&resetBefore===resetAfter;
 const poolDeltaPct=sameWindow&&before!==null&&after!==null&&after<=before?before-after:null;
 return Object.freeze({schema:AU_CELL_ENERGY_SCHEMA,cellId,runId,poolId,wakeAtUtc:v.wakeAtUtc,sleepAtUtc:v.sleepAtUtc,durationSeconds:(sleep-wake)/1000,sourceKind:v.sourceKind,sevenDayBeforePct:before,sevenDayAfterPct:after,fiveHourBeforePct:fiveBefore,fiveHourAfterPct:fiveAfter,resetBeforeUtc:resetBefore,resetAfterUtc:resetAfter,poolDeltaPct,individualUsagePct:null,individualUsageStatus:'SHARED_POOL_NOT_ATTRIBUTABLE',kufoConsumed:null,kufoRate:'NOT_DEFINED',checkpointUrl:v.checkpointUrl??null});
}
export function aggregateRuns(runs){const seen=new Set(),cells=new Map();for(const r of runs){const k=r.cellId+':'+r.runId;if(seen.has(k))throw Error('DUPLICATE_RUN');seen.add(k);const c=cells.get(r.cellId)??{cellId:r.cellId,runs:0,activeSeconds:0,observedPoolDeltaPct:0};c.runs++;c.activeSeconds+=r.durationSeconds;if(r.poolDeltaPct!==null)c.observedPoolDeltaPct+=r.poolDeltaPct;cells.set(r.cellId,c);}return Object.freeze([...cells.values()]);}
export function simulateOfflineCultivation({elapsedSeconds,xpPerHour=10,maxOfflineHours=24,initialKufo=0,halfLifeSeconds,claimed=false}={}){
 if([elapsedSeconds,xpPerHour,maxOfflineHours,initialKufo,halfLifeSeconds].some(x=>!finite(x)||x<0)||halfLifeSeconds===0)throw Error('BAD_CULTIVATION_INPUT');
 if(claimed)throw Error('ALREADY_SETTLED');
 const effectiveSeconds=Math.min(elapsedSeconds,maxOfflineHours*3600);
 const decayedKufo=initialKufo*(1-2**(-effectiveSeconds/halfLifeSeconds));
 return Object.freeze({mode:'LOCAL_SIMULATION_ONLY',effectiveSeconds,xp:effectiveSeconds/3600*xpPerHour,remainingKufo:initialKufo-decayedKufo,decayedKufo,generatedKship:decayedKufo*1000,fertilizer:0,realKgenTransfer:0,realKaiosTransfer:0,computeQuotaConversion:'NOT_DEFINED'});
}
export function calculatePhysicalWork({forceNewtons,distanceMeters,angleRadians=0}){if(![forceNewtons,distanceMeters,angleRadians].every(finite)||distanceMeters<0)throw Error('BAD_WORK_INPUT');return {joules:forceNewtons*distanceMeters*Math.cos(angleRadians),units:'N*m=J',note:'Physical work distinct from K-axis financial work'};}
