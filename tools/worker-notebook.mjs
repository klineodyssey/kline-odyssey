/** Local secretary candidate. Not identity, scheduler, company dispatch or financial authority. */
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const digest = s => createHash('sha256').update(s).digest('hex');
const fail = m => { throw new Error(m); };
const utc = s => typeof s === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(s) && Number.isFinite(Date.parse(s));
const allowedWindows = new Set([491,572,573,559]);
export const fields = ['WAKE_AT_UTC','SLEEP_AT_UTC','NEXT_WAKE_AT','TRIGGER_ID','RUN_ID','MODEL','EXECUTOR','QUOTA_POOL_ID','FIVE_HOUR_REMAINING_BEFORE','FIVE_HOUR_REMAINING_AFTER','WEEKLY_REMAINING_BEFORE','WEEKLY_REMAINING_AFTER','CREDITS_BEFORE','CREDITS_AFTER','RESET_AT','USAGE_SOURCE','MEASUREMENT_PRECISION','TASK_ID','CHECKPOINT_URL','RESULT','FAILURE_REASON','TEST_EVIDENCE','TOOLS','DURATION_SECONDS'];
export function health(input = {}) {
  for (const k of Object.keys(input)) if (!fields.includes(k)) fail('UNKNOWN_HEALTH_FIELD');
  const out=Object.fromEntries(fields.map(k=>[k,input[k]??'UNKNOWN']));
  for(const [k,v] of Object.entries(out)) {
    if(typeof v!=='string' || v.length>500) fail('INVALID_HEALTH_VALUE');
    if(v==='UNKNOWN')continue;
    if(/AT_UTC$|NEXT_WAKE_AT|RESET_AT/.test(k) && !utc(v))fail('INVALID_UTC');
    if(k.includes('REMAINING') && (!/^\d+(\.\d+)?$/.test(v)||Number(v)>100))fail('INVALID_PERCENT');
    if((k.startsWith('CREDITS_')||k==='DURATION_SECONDS') && (!/^\d+(\.\d+)?$/.test(v)))fail('INVALID_MEASUREMENT');
  }
  if(out.WAKE_AT_UTC!=='UNKNOWN' && out.SLEEP_AT_UTC!=='UNKNOWN' && Date.parse(out.SLEEP_AT_UTC)<Date.parse(out.WAKE_AT_UTC))fail('CLOCK_REVERSED');
  if(fields.some(k=>(k.includes('REMAINING')||k.startsWith('CREDITS_'))&&out[k]!=='UNKNOWN') && out.USAGE_SOURCE==='UNKNOWN')fail('MEASUREMENT_SOURCE_REQUIRED');
  return out;
}
export async function load(dir) {
  let head;
  try { head=JSON.parse(await readFile(resolve(dir,'HEAD.json'),'utf8')); }
  catch(e){ if(e.code==='ENOENT')return {revision:0,contacts:{},runs:[],hash:null};throw e; }
  if(!Number.isSafeInteger(head.revision)||head.revision<1||!/^[a-f0-9]{64}$/.test(head.hash))fail('CORRUPT_HEAD');
  const raw=await readFile(resolve(dir,`${head.revision}-${head.hash}.json`),'utf8');
  if(digest(raw)!==head.hash)fail('CORRRUPT_CHECKPOINT');
  const state=JSON.parse(raw);
  if(state.revision!==head.revision)fail('REVISION_MISMATCH');
  return {...state,hash:head.hash};
}
export async function save(dir,expectedRevision,operation) {
  await mkdir(dir,{recursive:true,mode:0o700});
  const lockPath=resolve(dir,'LOCK');const lock=await open(lockPath,'wx',0o600);
  let tmp;
  try {
    const prior=await load(dir);
    if(prior.revision!==expectedRevision)fail('STALE_REVISION');
    const next=structuredClone(prior);delete next.hash;
    if(operation.kind==='contact') {
      const {issue,lastReadCommentId,trackedAt}=operation;
      if(!allowedWindows.has(issue)||!Number.isSafeInteger(lastReadCommentId)||lastReadCommentId<0||!utc(trackedAt))fail('INVALID_CONTACT');
      const old=next.contacts[issue];
      if(old&&(lastReadCommentId<old.lastReadCommentId||trackedAt<old.trackedAt))fail('CURSOR_REGRESSION');
      next.contacts[issue]={issue,url:`https://github.com/klineodyssey/kline-odyssey/issues/${issue}`,lastReadCommentId,trackedAt};
    } else if(operation.kind==='run') {
      if(typeof operation.recordId!=='string'||!/^NOTE-[a-zA-Z0-9-]{1,80}$/.test(operation.recordId))fail('INVALID_RECORD_ID');
      const entry={recordId:operation.recordId,health:health(operation.health)};
      const old=next.runs.find(r=>r.recordId===entry.recordId);
      if(old){if(JSON.stringify(old)!==JSON.stringify(entry))fail('REPLAY_MISMATCH');return prior;}
      next.runs.push(entry);
    } else fail('INVALID_OPERATION');
    next.revision=prior.revision+1;next.previousHash=prior.hash;
    const raw=JSON.stringify(next);const hash=digest(raw);
    await writeFile(resolve(dir,`${next.revision}-${hash}.json`),raw,{flag:'wx',mode:0o600});
    tmp=resolve(dir,`HEAD-${randomUUID()}.tmp`);
    await writeFile(tmp,JSON.stringify({revision:next.revision,hash}),{flag:'wx',mode:0o600});
    await rename(tmp,resolve(dir,'HEAD.json'));tmp=null;
    return {...next,hash};
  } finally { if(tmp)await unlink(tmp).catch(()=>{});await lock.close();await unlink(lockPath); }
}
// Public projection deliberately omits quota, model, executor, run/controller details and free text.
export function publicCheckpoint(state) {
  return {schema:'KAIOS_WORKER_NOTE_PUBLIC_V1',revision:state.revision,contacts:state.contacts,recordCount:state.runs.length,checkpointHash:state.hash,hashMeaning:'CONTENT_INTEGRITY_NOT_IDENTITY',schedulerRuns:'NOT_VERIFIED',recipientAck:'NOT_VERIFIED'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [command,dir,inputPath]=process.argv.slice(2);
 if(!dir)fail('DIRECTORY_REQUIRED');
 if(command==='read')console.log(JSON.stringify(publicCheckpoint(await load(dir))));
 else if(command==='save') { const x=JSON.parse(await readFile(inputPath,'utf8'));const s=await save(dir,x.expectedRevision,x.operation);console.log(JSON.stringify(publicCheckpoint(s))); }
 else fail('COMMAND_READ_OR_SAVE_REQUIRED');
}
