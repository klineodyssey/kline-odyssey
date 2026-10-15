import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,readFile,writeFile,readdir,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';
import {save,load,health,publicCheckpoint,canonicalPatch} from '../tools/worker-notebook.mjs';
async function fixture(t){const d=await mkdtemp(join(tmpdir(),'notebook-'));t.after(()=>rm(d,{recursive:true,force:true}));return d;}
const endpoint=(endpoint_id,address_or_ref)=>({endpoint_id,purpose:'coordination',provider:'GitHub',address_or_ref,owner_proof:'UNKNOWN',scope:'public-read',health:'UNKNOWN',last_verified_utc:'UNKNOWN',last_read_cursor:'UNKNOWN',backup_priority:0,recovery_method:'manual',signature_verification:'NOT_VERIFIED'});
const directory=(contactId,issue)=>({contactId,issue,sourceUrl:'UNKNOWN',observedAt:'UNKNOWN',SELF_NAME:contactId,ROLE:'UNKNOWN',WINDOW_VERIFICATION:'UNKNOWN',LAST_CONTACT_AT_UTC:'UNKNOWN',LAST_READ_MESSAGE_ID:'UNKNOWN',PENDING_MESSAGES:[],NEXT_FOLLOWUP_AT_UTC:'UNKNOWN',CONTROLLER_VERIFICATION:'NOT_VERIFIED',SIGNATURE_STATUS:'NOT_VERIFIED',PRIMARY_WINDOW_URL:issue==='UNKNOWN'?'UNKNOWN':`https://github.com/klineodyssey/kline-odyssey/issues/${issue}`,endpoints:issue==='UNKNOWN'?[]:[endpoint(`${contactId}-primary`,`https://github.com/klineodyssey/kline-odyssey/issues/${issue}`)]});
const trackedAt='2026-10-11T11:13:24Z';
test('separate processes restore cursor and reject stale revision',async t=>{const d=await fixture(t),input=join(d,'input.json');await writeFile(input,JSON.stringify({expectedRevision:0,operation:{kind:'contact',issue:572,lastReadCommentId:123,trackedAt}}));execFileSync(process.execPath,['tools/worker-notebook.mjs','save',d,input]);const s=JSON.parse(execFileSync(process.execPath,['tools/worker-notebook.mjs','read',d]));assert.equal(s.contacts[572].lastReadCommentId,123);await assert.rejects(save(d,0,{kind:'contact',issue:572,lastReadCommentId:124,trackedAt}),/STALE/);assert.equal((await load(d)).revision,1);});
test('duplicate health record is idempotent; changed replay rejected',async t=>{const d=await fixture(t);const op={kind:'run',recordId:'NOTE-test',health:{WAKE_AT_UTC:trackedAt}};await save(d,0,op);assert.equal((await save(d,1,op)).revision,1);await assert.rejects(save(d,1,{...op,health:{RESULT:'changed'}}),/REPLAY/);assert.equal((await load(d)).runs[0].health.RUN_ID,'UNKNOWN');});
test('invalid time, percentages and unsourced measurements rejected',()=>{assert.throws(()=>health({WAKE_AT_UTC:'tomorrow'}));assert.throws(()=>health({FIVE_HOUR_REMAINING_BEFORE:'101'}));assert.throws(()=>health({CREDITS_BEFORE:'10'}),/SOURCE/);assert.throws(()=>health({privateKey:'x'}));assert.throws(()=>health({WAKE_AT_UTC:trackedAt,SLEEP_AT_UTC:'2026-10-10T00:00:00Z'}),/REVERSED/);});
test('concurrent writers allow one commit; no cursor rollback',async t=>{const d=await fixture(t);const op={kind:'contact',issue:573,lastReadCommentId:5,trackedAt};const results=await Promise.allSettled([save(d,0,op),save(d,0,op)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);await assert.rejects(save(d,1,{...op,lastReadCommentId:4}),/REGRESSION/);});
test('tamper blocks restore and preserves old immutable versions',async t=>{const d=await fixture(t);await save(d,0,{kind:'contact',issue:491,lastReadCommentId:1,trackedAt});await save(d,1,{kind:'contact',issue:491,lastReadCommentId:2,trackedAt});const h=JSON.parse(await readFile(join(d,'HEAD.json')));assert.equal((await readdir(d)).filter(f=>/^\d+-/.test(f)).length,2);await writeFile(join(d,`${h.revision}-${h.hash}.json`),'{}');await assert.rejects(load(d),/CORR/);});
test('public projection strips private health and never asserts ACK or wake',async t=>{const d=await fixture(t);const s=await save(d,0,{kind:'run',recordId:'NOTE-private',health:{MODEL:'private-model',USAGE_SOURCE:'private-source',CREDITS_BEFORE:'10'}});const p=publicCheckpoint(s);assert.ok(!JSON.stringify(p).includes('private'));assert.equal(p.schedulerRuns,'NOT_VERIFIED');assert.equal(p.recipientAck,'NOT_VERIFIED');});
test('abandoned lock fails closed without deleting evidence',async t=>{const d=await fixture(t);await writeFile(join(d,'LOCK'),'crash evidence');await assert.rejects(save(d,0,{kind:'run',recordId:'NOTE-recover'}),/EEXIST/);assert.equal(await readFile(join(d,'LOCK'),'utf8'),'crash evidence');assert.equal((await load(d)).revision,0);});
test('unsupported public window is rejected without creating HEAD',async t=>{const d=await fixture(t);await assert.rejects(save(d,0,{kind:'contact',issue:999,lastReadCommentId:1,trackedAt}),/CONTACT/);assert.equal((await load(d)).revision,0);});

test('V1.1 directory onboarding restores across processes and preserves unknown windows',async t=>{
 const d=await fixture(t);let revision=0;
 for(const issue of [584,572,573,577,491,575])await save(d,revision++,{kind:'directory',record:directory(`cell-${issue}`,issue)});
 await save(d,revision++,{kind:'directory',record:directory('future','UNKNOWN')});
 const s=JSON.parse(execFileSync(process.execPath,['tools/worker-notebook.mjs','onboard',d]));
 assert.equal(s.status,'READY_FOR_CANON_READ');assert.equal(s.executionAuthority,'NOT_GRANTED');
 assert.equal(s.directory.future.url,'UNKNOWN');assert.equal(s.directory.future.identityStatus,'NOT_VERIFIED');
 await assert.rejects(save(d,revision,{kind:'directory',record:{contactId:'secret',issue:491,controller:'private'}}),/FIELD/);
 await assert.rejects(save(d,revision,{kind:'directory',record:directory('bad',999)}),/DIRECTORY/);
});
test('message persistence deduplicates semantic replay and keeps readback separate from ACK',async t=>{
 const d=await fixture(t);await save(d,0,{kind:'directory',record:directory('sender',491)});
 await save(d,1,{kind:'directory',record:directory('recipient',584)});
 const envelope={messageId:'message-1',fromContact:'sender',toContact:'recipient',sentAt:'UNKNOWN',sourceUrl:'UNKNOWN',taskId:'task-1',contentHash:'a'.repeat(64),replyTo:'UNKNOWN',READ_RECEIPT:'UNKNOWN',TEXT_SIGNATURE:'UNKNOWN',CRYPTOGRAPHIC_SIGNATURE_STATUS:'NOT_VERIFIED'};
 await assert.rejects(save(d,2,{kind:'message',envelope:{...envelope,fromContact:'constructor'}}),/CONTACT_REQUIRED/);
 const s=await save(d,2,{kind:'message',envelope});assert.equal(s.revision,3);
 assert.equal((await save(d,3,{kind:'message',envelope:Object.fromEntries(Object.entries(envelope).reverse())})).revision,3);
 await assert.rejects(save(d,3,{kind:'message',envelope:{...envelope,contentHash:'b'.repeat(64)}}),/REPLAY/);
 await assert.rejects(save(d,3,{kind:'message',envelope:{...envelope,token:'private'}}),/FIELD/);
 const receipt={kind:'receipt',messageId:'message-1',status:'READBACK_OBSERVED',observedAt:trackedAt,evidenceUrl:'https://github.com/klineodyssey/kline-odyssey/issues/491#issuecomment-123'};
 await save(d,3,receipt);assert.equal((await save(d,4,receipt)).revision,4);
 await save(d,4,{...receipt,status:'RECIPIENT_RESPONSE_OBSERVED'});
 assert.equal((await load(d)).messages[0].recipientAck,'NOT_VERIFIED');
 await assert.rejects(save(d,5,{...receipt,status:'IDENTITY_ACK_VERIFIED'}),/RECEIPT/);
});
test('seven checkpoint stages preserve UNKNOWN and reject unsupported secrets or unsourced completion',async t=>{
 const d=await fixture(t);const s=await save(d,0,{kind:'checkpoint',checkpointId:'wake-1',stages:{CLOCK:{status:'RECORDED',observedAt:trackedAt,evidenceUrl:'https://github.com/klineodyssey/kline-odyssey/issues/491#issuecomment-123'}}});
 assert.equal(Object.keys(s.checkpoints[0].stages).length,7);assert.equal(s.checkpoints[0].stages.SLEEP.observedAt,'UNKNOWN');
 await assert.rejects(save(d,1,{kind:'checkpoint',checkpointId:'wake-2',stages:{QUOTA:{credits:10}}}),/FIELD/);
 await assert.rejects(save(d,1,{kind:'checkpoint',checkpointId:'wake-2',stages:{SLEEP:{status:'RECORDED'}}}),/EVIDENCE/);
 const view=JSON.parse(execFileSync(process.execPath,['tools/worker-notebook.mjs','onboard',d]));
 assert.equal(view.status,'DIRECTORY_INCOMPLETE');assert.equal(view.latestCheckpoint.checkpointId,'wake-1');
});
test('restore verifies ancestors, not only current checkpoint hash',async t=>{
 const d=await fixture(t);const first=await save(d,0,{kind:'checkpoint',checkpointId:'one'});
 const second=await save(d,1,{kind:'checkpoint',checkpointId:'two'});assert.equal(second.previousHash,first.hash);
 await writeFile(join(d,`1-${first.hash}.json`),'{}');await assert.rejects(load(d),/CHAIN/);
});

test('directory rejects omissions, window duplicates, rebinding and cursor rollback',async t=>{
 const d=await fixture(t);const base=directory('one',491);
 for(const field of Object.keys(base)){const bad={...base};delete bad[field];await assert.rejects(save(d,0,{kind:'directory',record:bad}));}
 await save(d,0,{kind:'directory',record:{...base,LAST_READ_MESSAGE_ID:10,LAST_CONTACT_AT_UTC:trackedAt}});
 await assert.rejects(save(d,1,{kind:'directory',record:directory('two',491)}),/DUPLICATE/);
 await assert.rejects(save(d,1,{kind:'directory',record:{...directory('one',584)}}),/IMMUTABLE/);
 await assert.rejects(save(d,1,{kind:'directory',record:{...base,SELF_NAME:'impostor'}}),/IMMUTABLE/);
 await assert.rejects(save(d,1,{kind:'directory',record:base}),/REGRESSION/);
 await assert.rejects(save(d,1,{kind:'directory',record:{...base,SIGNATURE_STATUS:'VERIFIED'}}),/UNVERIFIED/);
 const next={...base,LAST_READ_MESSAGE_ID:11,LAST_CONTACT_AT_UTC:trackedAt,PENDING_MESSAGES:['msg-2']};
 await save(d,1,{kind:'directory',record:next});assert.equal((await load(d)).directory.one.LAST_READ_MESSAGE_ID,11);
});
test('message signature fields are required and VERIFIED cannot be injected',async t=>{
 const d=await fixture(t);await save(d,0,{kind:'directory',record:directory('a',491)});await save(d,1,{kind:'directory',record:directory('b',584)});
 const e={messageId:'m',fromContact:'a',toContact:'b',sentAt:'UNKNOWN',sourceUrl:'UNKNOWN',taskId:'t',contentHash:'a'.repeat(64),replyTo:'UNKNOWN',READ_RECEIPT:'UNKNOWN',TEXT_SIGNATURE:'a',CRYPTOGRAPHIC_SIGNATURE_STATUS:'NOT_VERIFIED'};
 for(const k of ['READ_RECEIPT','TEXT_SIGNATURE','CRYPTOGRAPHIC_SIGNATURE_STATUS']){const x={...e};delete x[k];await assert.rejects(save(d,2,{kind:'message',envelope:x}));}
 await assert.rejects(save(d,2,{kind:'message',envelope:{...e,CRYPTOGRAPHIC_SIGNATURE_STATUS:'VERIFIED'}}));
 await save(d,2,{kind:'message',envelope:e});
 const state=await load(d);state.directory.a.privateKey='SECRET';state.contacts[491]={issue:491,url:'safe',lastReadCommentId:1,trackedAt,executor:'SECRET'};
 state.runs.push({health:{MODEL:'SECRET'}});
 const p=publicCheckpoint(state);assert.equal(p.messages[0].envelope.TEXT_SIGNATURE,'a');assert.ok(!JSON.stringify(p).includes('SECRET'));assert.equal(p.directory.a.CONTROLLER_VERIFICATION,'NOT_VERIFIED');
});
test('canonical patch fence bytes reproduce LF hash scope',()=>{
 const raw='diff --git a/a b/a\r\n--- a/a\r\n+++ b/a\r\n\r\n';
 const patch=canonicalPatch(raw+"+ const nested='```';\n");const comment='````diff\n'+patch+'````';
 const extracted=comment.match(/^````diff\n([\s\S]*?)^````$/m)[1];
 assert.equal(extracted,patch);assert.equal(canonicalPatch(extracted),patch);assert.equal(canonicalPatch(patch+'\n'),patch);
});
test('one cell supports multiple bounded endpoints; endpoint ownership cannot drift',async t=>{
 const d=await fixture(t);const a=directory('a',491);a.endpoints.push(endpoint('backup','https://github.com/klineodyssey/kline-odyssey/issues/575'));a.endpoints.push(endpoint('private','PRIVATE_REF:approved-mailbox'));
 await save(d,0,{kind:'directory',record:a});const b=directory('b',584);
 await assert.rejects(save(d,1,{kind:'directory',record:{...b,endpoints:[...b.endpoints,endpoint('other','https://github.com/klineodyssey/kline-odyssey/issues/575')]}}),/ALREADY_BOUND/);
 await assert.rejects(save(d,1,{kind:'directory',record:{...b,endpoints:[...b.endpoints,endpoint('private','PRIVATE_REF:different')]}}),/ALREADY_BOUND/);
 await assert.rejects(save(d,1,{kind:'directory',record:{...a,endpoints:[a.endpoints[0],endpoint('backup','https://github.com/klineodyssey/kline-odyssey/issues/577'),a.endpoints[2]]}}),/IMMUTABLE/);
 await assert.rejects(save(d,1,{kind:'directory',record:{...a,endpoints:[...a.endpoints,endpoint('secret','person@example.com')]}}),/PRIVATE_ADDRESS/);
 await assert.rejects(save(d,1,{kind:'directory',record:{...a,PRIMARY_WINDOW_URL:'UNKNOWN'}}),/PRIMARY/);
 const publicData=publicCheckpoint(await load(d));assert.equal(publicData.directory.a.endpoints.length,3);assert.equal(publicData.directory.a.endpoints[2].address_or_ref,'PRIVATE_REF:approved-mailbox');
});
