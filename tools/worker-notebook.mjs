/** Local secretary candidate. Not identity, scheduler, company dispatch or financial authority. */
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const digest = s => createHash('sha256').update(s).digest('hex');
const fail = m => { throw new Error(m); };
const utc = s => typeof s === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(s) && Number.isFinite(Date.parse(s));
const allowedWindows = new Set([491,572,573,559,584,577,575]);
const object = x => x && typeof x==='object' && !Array.isArray(x);
function keys(x, allowed) {
  if(!object(x)||Object.keys(x).some(k=>!allowed.includes(k)))fail('UNEXPECTED_FIELD');
}
const id = x => typeof x==='string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(x);
const windowUrl = issue => `https://github.com/klineodyssey/kline-odyssey/issues/${issue}`;
const evidence = x => x==='UNKNOWN' || (typeof x==='string' && /^https:\/\/github\.com\/klineodyssey\/kline-odyssey\/(issues|pull)\/[1-9][0-9]*(#issuecomment-[1-9][0-9]*)?$/.test(x));
const directoryFields=['contactId','issue','sourceUrl','observedAt','SELF_NAME','ROLE','WINDOW_VERIFICATION','LAST_CONTACT_AT_UTC','LAST_READ_MESSAGE_ID','PENDING_MESSAGES','NEXT_FOLLOWUP_AT_UTC','CONTROLLER_VERIFICATION','SIGNATURE_STATUS','PRIMARY_WINDOW_URL','endpoints'];
const label=x=>typeof x==='string' && x.length>0 && x.length<=120 && !/[\r\n<>]/.test(x);
const endpointFields=['endpoint_id','purpose','provider','address_or_ref','owner_proof','scope','health','last_verified_utc','last_read_cursor','backup_priority','recovery_method','signature_verification'];
function endpointRecord(x) {
  keys(x,endpointFields);if(endpointFields.some(k=>!Object.hasOwn(x,k)))fail('ENDPOINT_FIELD_REQUIRED');
  if(!id(x.endpoint_id)||!label(x.purpose)||!label(x.provider)||!label(x.scope)||!label(x.recovery_method))fail('INVALID_ENDPOINT');
  if(!(evidence(x.address_or_ref)||/^PRIVATE_REF:[A-Za-z0-9_-]{1,80}$/.test(x.address_or_ref)))fail('PRIVATE_ADDRESS_FORBIDDEN');
  if(!evidence(x.owner_proof)||!['UNKNOWN','NOT_VERIFIED'].includes(x.signature_verification)||!['UNKNOWN','RECENT_ACTIVITY_ONLY','DEGRADED','UNREACHABLE'].includes(x.health))fail('INVALID_ENDPOINT');
  if(!(x.last_verified_utc==='UNKNOWN'||utc(x.last_verified_utc))||!(x.last_read_cursor==='UNKNOWN'||Number.isSafeInteger(x.last_read_cursor)&&x.last_read_cursor>=0)||!Number.isSafeInteger(x.backup_priority)||x.backup_priority<0)fail('INVALID_ENDPOINT');
  return Object.fromEntries(endpointFields.map(k=>[k,x[k]]));
}
export function directoryRecord(x) {
  keys(x,directoryFields);
  if(directoryFields.some(k=>!Object.hasOwn(x,k)))fail('DIRECTORY_FIELD_REQUIRED');
  if(!id(x.contactId)||!(x.issue==='UNKNOWN'||allowedWindows.has(x.issue)))fail('INVALID_DIRECTORY');
  if(!label(x.SELF_NAME)||!label(x.ROLE)||!evidence(x.sourceUrl))fail('INVALID_DIRECTORY');
  for(const k of ['observedAt','LAST_CONTACT_AT_UTC','NEXT_FOLLOWUP_AT_UTC'])if(!(x[k]==='UNKNOWN'||utc(x[k])))fail('INVALID_DIRECTORY');
  for(const k of ['WINDOW_VERIFICATION','CONTROLLER_VERIFICATION','SIGNATURE_STATUS'])if(!['UNKNOWN','NOT_VERIFIED'].includes(x[k]))fail('UNVERIFIED_ONLY');
  if(!(x.LAST_READ_MESSAGE_ID==='UNKNOWN'||Number.isSafeInteger(x.LAST_READ_MESSAGE_ID)&&x.LAST_READ_MESSAGE_ID>=0)||!Array.isArray(x.PENDING_MESSAGES)||x.PENDING_MESSAGES.length>100||x.PENDING_MESSAGES.some(v=>!id(v))||new Set(x.PENDING_MESSAGES).size!==x.PENDING_MESSAGES.length)fail('INVALID_DIRECTORY');
  if(x.PRIMARY_WINDOW_URL!==(x.issue==='UNKNOWN'?'UNKNOWN':windowUrl(x.issue))||!Array.isArray(x.endpoints)||x.endpoints.length>50)fail('INVALID_PRIMARY_WINDOW');
  const endpoints=x.endpoints.map(endpointRecord);
  if(new Set(endpoints.map(e=>e.endpoint_id)).size!==endpoints.length||new Set(endpoints.filter(e=>e.address_or_ref!=='UNKNOWN').map(e=>e.address_or_ref)).size!==endpoints.filter(e=>e.address_or_ref!=='UNKNOWN').length)fail('DUPLICATE_ENDPOINT');
  if(x.PRIMARY_WINDOW_URL!=='UNKNOWN'&&endpoints.filter(e=>e.address_or_ref===x.PRIMARY_WINDOW_URL).length!==1)fail('PRIMARY_ENDPOINT_REQUIRED');
  return {...Object.fromEntries(directoryFields.map(k=>[k,structuredClone(x[k])])),url:x.issue==='UNKNOWN'?'UNKNOWN':windowUrl(x.issue),identityStatus:'NOT_VERIFIED'};
}
export function messageEnvelope(x) {
  keys(x,['messageId','fromContact','toContact','sentAt','sourceUrl','taskId','contentHash','replyTo','READ_RECEIPT','TEXT_SIGNATURE','CRYPTOGRAPHIC_SIGNATURE_STATUS']);
  if(!id(x.messageId)||!id(x.fromContact)||!id(x.toContact)||!id(x.taskId))fail('INVALID_MESSAGE');
  if(!(x.sentAt==='UNKNOWN'||utc(x.sentAt))||!evidence(x.sourceUrl)||!/^[a-f0-9]{64}$/.test(x.contentHash)||!(x.replyTo==='UNKNOWN'||id(x.replyTo)))fail('INVALID_MESSAGE');
  if(!['UNKNOWN','NOT_VERIFIED'].includes(x.CRYPTOGRAPHIC_SIGNATURE_STATUS)||!['UNKNOWN','NOT_VERIFIED'].includes(x.READ_RECEIPT)||!label(x.TEXT_SIGNATURE))fail('UNVERIFIED_ONLY');
  return Object.fromEntries(['messageId','fromContact','toContact','sentAt','sourceUrl','taskId','contentHash','replyTo','READ_RECEIPT','TEXT_SIGNATURE','CRYPTOGRAPHIC_SIGNATURE_STATUS'].map(k=>[k,x[k]]));
}
export const stages=['CLOCK','QUOTA','BOOT','CONTACTS','WORK','SAVE','SLEEP'];
export function lifecycle(x={}) {
  keys(x,stages);
  return Object.fromEntries(stages.map(stage=>{
    const row=x[stage]??{};keys(row,['status','observedAt','evidenceUrl']);
    const status=row.status??'UNKNOWN', observedAt=row.observedAt??'UNKNOWN', evidenceUrl=row.evidenceUrl??'UNKNOWN';
    if(!['UNKNOWN','RECORDED','BLOCKED'].includes(status)||!(observedAt==='UNKNOWN'||utc(observedAt))||!evidence(evidenceUrl))fail('INVALID_STAGE');
    if(status!=='UNKNOWN'&&(observedAt==='UNKNOWN'||evidenceUrl==='UNKNOWN'))fail('STAGE_EVIDENCE_REQUIRED');
    return [stage,{status,observedAt,evidenceUrl}];
  }));
}
export function onboarding(state) {
  const publicState=publicCheckpoint(state);
  const known=new Set(Object.values(publicState.directory).map(x=>x.issue));
  const missing=[584,572,573,577,491,575].filter(x=>!known.has(x));
  return {status:missing.length?'DIRECTORY_INCOMPLETE':'READY_FOR_CANON_READ',missingWindows:missing,
    revision:state.revision,checkpointHash:state.hash,contacts:publicState.contacts,directory:publicState.directory,
    latestCheckpoint:publicState.checkpoints.at(-1)??null,
    executionAuthority:'NOT_GRANTED',requiredReads:['LATEST_MAIN','COMPANY_BOOT','WORK_ORDER','OWNER_AND_CLAIM'],
    identityStatus:'NOT_VERIFIED',recipientAck:'NOT_VERIFIED'};
}
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
  // Verify the complete retained revision chain before accepting a restore.
  let cursor=state;
  for(let revision=head.revision-1;revision>=1;revision--) {
    if(!/^[a-f0-9]{64}$/.test(cursor.previousHash))fail('CORRUPT_CHAIN');
    const ancestorRaw=await readFile(resolve(dir,`${revision}-${cursor.previousHash}.json`),'utf8');
    if(digest(ancestorRaw)!==cursor.previousHash)fail('CORRUPT_CHAIN');
    cursor=JSON.parse(ancestorRaw);if(cursor.revision!==revision)fail('CORRUPT_CHAIN');
  }
  if(cursor.previousHash!==null)fail('CORRUPT_CHAIN');
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
      keys(operation,['kind','issue','lastReadCommentId','trackedAt']);
      const {issue,lastReadCommentId,trackedAt}=operation;
      if(!allowedWindows.has(issue)||!Number.isSafeInteger(lastReadCommentId)||lastReadCommentId<0||!utc(trackedAt))fail('INVALID_CONTACT');
      const old=next.contacts[issue];
      if(old&&(lastReadCommentId<old.lastReadCommentId||trackedAt<old.trackedAt))fail('CURSOR_REGRESSION');
      next.contacts[issue]={issue,url:`https://github.com/klineodyssey/kline-odyssey/issues/${issue}`,lastReadCommentId,trackedAt};
    } else if(operation.kind==='run') {
      keys(operation,['kind','recordId','health']);
      if(typeof operation.recordId!=='string'||!/^NOTE-[a-zA-Z0-9-]{1,80}$/.test(operation.recordId))fail('INVALID_RECORD_ID');
      const entry={recordId:operation.recordId,health:health(operation.health)};
      const old=next.runs.find(r=>r.recordId===entry.recordId);
      if(old){if(JSON.stringify(old)!==JSON.stringify(entry))fail('REPLAY_MISMATCH');return prior;}
      next.runs.push(entry);
    } else if(operation.kind==='directory') {
      keys(operation,['kind','record']);const entry=directoryRecord(operation.record);
      next.directory??={};const old=Object.hasOwn(next.directory,entry.contactId)?next.directory[entry.contactId]:null;
      if(old) {
        for(const k of ['issue','SELF_NAME','ROLE','PRIMARY_WINDOW_URL'])if(old[k]!==entry[k])fail('IDENTITY_BINDING_IMMUTABLE');
        for(const k of ['observedAt','LAST_CONTACT_AT_UTC','LAST_READ_MESSAGE_ID']) {
          if(old[k]!==undefined && old[k]!=='UNKNOWN' && (entry[k]==='UNKNOWN'||(k==='LAST_READ_MESSAGE_ID'?entry[k]<old[k]:Date.parse(entry[k])<Date.parse(old[k]))))fail('DIRECTORY_REGRESSION');
        }
      }
      if(entry.issue!=='UNKNOWN'&&Object.values(next.directory).some(v=>v.contactId!==entry.contactId&&v.issue===entry.issue))fail('DUPLICATE_WINDOW');
      const others=Object.values(next.directory).filter(v=>v.contactId!==entry.contactId);
      for(const e of entry.endpoints) {
        if(others.some(v=>(v.endpoints??[]).some(o=>o.endpoint_id===e.endpoint_id||(e.address_or_ref!=='UNKNOWN'&&o.address_or_ref===e.address_or_ref))))fail('ENDPOINT_ALREADY_BOUND');
        const previous=old?.endpoints?.find(v=>v.endpoint_id===e.endpoint_id);
        if(previous) {
          for(const k of ['address_or_ref','provider','purpose','scope'])if(previous[k]!==e[k])fail('ENDPOINT_BINDING_IMMUTABLE');
          if(previous.last_read_cursor!=='UNKNOWN'&&(e.last_read_cursor==='UNKNOWN'||e.last_read_cursor<previous.last_read_cursor))fail('ENDPOINT_CURSOR_REGRESSION');
        }
      }
      if(old?.endpoints?.some(e=>!entry.endpoints.some(v=>v.endpoint_id===e.endpoint_id)))fail('ENDPOINT_REMOVAL_REQUIRES_MIGRATION');
      next.directory[entry.contactId]=entry;
    } else if(operation.kind==='message') {
      keys(operation,['kind','envelope']);const envelope=messageEnvelope(operation.envelope);
      if(!Object.hasOwn(next.directory??{},envelope.fromContact)||!Object.hasOwn(next.directory??{},envelope.toContact))fail('CONTACT_REQUIRED');
      next.messages??=[];const old=next.messages.find(x=>x.envelope.messageId===envelope.messageId);
      if(old){if(JSON.stringify(old.envelope)!==JSON.stringify(envelope))fail('REPLAY_MISMATCH');return prior;}
      next.messages.push({envelope,receipts:[],recipientAck:'NOT_VERIFIED'});
    } else if(operation.kind==='receipt') {
      keys(operation,['kind','messageId','status','observedAt','evidenceUrl']);
      const entry=next.messages?.find(x=>x.envelope.messageId===operation.messageId);
      if(!entry)fail('MESSAGE_REQUIRED');
      if(!['READBACK_OBSERVED','RECIPIENT_RESPONSE_OBSERVED'].includes(operation.status)||!utc(operation.observedAt)||!evidence(operation.evidenceUrl)||operation.evidenceUrl==='UNKNOWN')fail('INVALID_RECEIPT');
      const receipt={status:operation.status,observedAt:operation.observedAt,evidenceUrl:operation.evidenceUrl};
      if(entry.receipts.some(x=>JSON.stringify(x)===JSON.stringify(receipt)))return prior;
      entry.receipts.push(receipt); // observation only; never authenticates recipient/controller
    } else if(operation.kind==='checkpoint') {
      keys(operation,['kind','checkpointId','stages']);if(!id(operation.checkpointId))fail('INVALID_CHECKPOINT');
      const entry={checkpointId:operation.checkpointId,stages:lifecycle(operation.stages)};
      next.checkpoints??=[];const old=next.checkpoints.find(x=>x.checkpointId===entry.checkpointId);
      if(old){if(JSON.stringify(old)!==JSON.stringify(entry))fail('REPLAY_MISMATCH');return prior;}
      next.checkpoints.push(entry);
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
export function canonicalPatch(raw) {
  return raw.replace(/\r\n?/g,'\n').replace(/\n*$/,'')+'\n';
}
export function publicCheckpoint(state) {
  const pick=(row,fields)=>Object.fromEntries(fields.filter(k=>Object.hasOwn(row,k)).map(k=>[k,structuredClone(row[k])]));
  return {schema:'KAIOS_WORKER_NOTE_PUBLIC_V1',revision:state.revision,
    contacts:Object.fromEntries(Object.entries(state.contacts).map(([k,v])=>[k,pick(v,['issue','url','lastReadCommentId','trackedAt'])])),
    directory:Object.fromEntries(Object.entries(state.directory??{}).map(([k,v])=>[k,pick(directoryRecord(vWithoutDerived(v)),directoryFields.concat(['url','identityStatus']))])),
    messages:(state.messages??[]).map(v=>({envelope:messageEnvelope(v.envelope),receipts:v.receipts.map(r=>pick(r,['status','observedAt','evidenceUrl'])),recipientAck:'NOT_VERIFIED'})),
    checkpoints:(state.checkpoints??[]).map(v=>({checkpointId:v.checkpointId,stages:lifecycle(v.stages)})),
    recordCount:state.runs.length,checkpointHash:state.hash,hashMeaning:'CONTENT_INTEGRITY_NOT_IDENTITY',schedulerRuns:'NOT_VERIFIED',recipientAck:'NOT_VERIFIED'};
}
function vWithoutDerived(v) { return Object.fromEntries(directoryFields.filter(k=>Object.hasOwn(v,k)).map(k=>[k,v[k]])); }
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [command,dir,inputPath]=process.argv.slice(2);
 if(!dir)fail('DIRECTORY_REQUIRED');
 if(command==='read')console.log(JSON.stringify(publicCheckpoint(await load(dir))));
 else if(command==='onboard')console.log(JSON.stringify(onboarding(await load(dir))));
 else if(command==='save') { const x=JSON.parse(await readFile(inputPath,'utf8'));const s=await save(dir,x.expectedRevision,x.operation);console.log(JSON.stringify(publicCheckpoint(s))); }
 else fail('COMMAND_READ_OR_SAVE_REQUIRED');
}
