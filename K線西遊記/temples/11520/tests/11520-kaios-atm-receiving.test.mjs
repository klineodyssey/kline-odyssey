import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createKaiosAtmReceivingModule,validateRouteEvidence} from '../runtime/kaios-atm-receiving-runtime.mjs';
import {createDigitalAntKaiosReceivingBridge,DIGITAL_ANT_11520_CARGO} from '../runtime/digital-ant-kaios-receiving-bridge.mjs';

const RECEIVER='0x1111111111111111111111111111111111111111';
const TOKEN='0x2222222222222222222222222222222222222222';
const SENDER=DIGITAL_ANT_11520_CARGO.sender;
const TX='0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const BLOCK_HASH='0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const TRANSFER_TOPIC='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
function activeWindow(){const now=Date.now();return {valid_from:new Date(now-60_000).toISOString(),expires_at:new Date(now+3_600_000).toISOString()}}
function replayRegistry({failReserve=false,failCommit=false}={}){
  const entries=new Map();let seq=0;
  return {
    durability:'DURABLE_SHARED_REPLAY_REGISTRY',registry_id:'QA-DURABLE-REPLAY',
    reserve(binding){
      if(failReserve)throw new Error('registry unavailable');
      const key=`${binding.namespace}:${binding.replay_key}`;
      if(entries.has(key))return {ok:false,status:'DUPLICATE'};
      const reservation_id=`QA-RESERVATION-${++seq}`;entries.set(key,{binding,reservation_id,status:'RESERVED'});
      return {ok:true,status:'RESERVED',reservation_id};
    },
    commit(receipt){
      if(failCommit)throw new Error('registry unavailable');
      const key=`${receipt.namespace}:${receipt.replay_key}`,entry=entries.get(key);
      if(!entry||entry.reservation_id!==receipt.reservation_id||entry.status!=='RESERVED')return {ok:false,status:'DUPLICATE'};
      entry.status='COMMITTED';entry.receipt=receipt;return {ok:true,status:'COMMITTED'};
    },
  };
}
function module(config={}){return createKaiosAtmReceivingModule({receiver_contract_or_escrow_address:RECEIVER,KAIOS_token_address:TOKEN,custody_policy_id:'QA-CUSTODY',receipt_verifier_id:'QA-VERIFIER',required_confirmations:12,replay_registry:replayRegistry(),...config})}
function register(m,{replay='REPLAY-1',amount='1080000',fee='888',...window}={}){return m.registerCargo({cargo_manifest_id:'QA-CARGO',sender:SENDER,authorized_amount:amount,freight_fee:fee,purpose_hash:'QA-PURPOSE',replay_key:replay,...activeWindow(),...window})}
function receipt(overrides={}){
  const base={
    receipt_verifier_id:'QA-VERIFIER',chain_id:56,status:1,transaction_hash:TX,block_number:'123456',block_hash:BLOCK_HASH,
    observed_head_block:'123467',rpc_agreement:true,
    transfer:{token:TOKEN,from:SENDER,to:RECEIVER,amount:'1080000',transaction_hash:TX,block_number:'123456',block_hash:BLOCK_HASH,log_index:'7',event_signature:TRANSFER_TOPIC},
  };
  return {...base,...overrides};
}

test('default module is NOT_DEPLOYED and cannot authorize a dispatch',()=>{
  const m=createKaiosAtmReceivingModule();register(m);const a=m.authorizeExactReceiver();
  assert.equal(a.ok,false);assert.equal(m.snapshot().real_receiving_gate,'NOT_DEPLOYED');assert.equal(m.snapshot().delivery_status,'AWAITING_EXACT_AUTHORIZATION');
});

test('configured module also requires an explicit confirmation policy',()=>{
  const m=createKaiosAtmReceivingModule({receiver_contract_or_escrow_address:RECEIVER,KAIOS_token_address:TOKEN,custody_policy_id:'QA-CUSTODY',receipt_verifier_id:'QA-VERIFIER'});
  register(m);assert.equal(m.authorizeExactReceiver().ok,false);assert.equal(m.snapshot().real_receiving_gate,'NOT_DEPLOYED');
});

test('configured module requires a durable shared replay registry',()=>{
  const m=createKaiosAtmReceivingModule({receiver_contract_or_escrow_address:RECEIVER,KAIOS_token_address:TOKEN,custody_policy_id:'QA-CUSTODY',receipt_verifier_id:'QA-VERIFIER',required_confirmations:12});
  register(m);const result=m.authorizeExactReceiver();assert.equal(result.ok,false);assert.equal(result.snapshot.real_receiving_gate,'NOT_DEPLOYED');assert.equal(result.snapshot.replay_registry_authority,'NOT_CONNECTED');
});

test('shared replay registry atomically blocks the same replay key across module instances',()=>{
  const shared=replayRegistry();
  const first=module({replay_registry:shared});register(first,{replay:'SHARED-REPLAY'});assert.equal(first.authorizeExactReceiver().ok,true);
  const second=module({replay_registry:shared});register(second,{replay:'SHARED-REPLAY'});const duplicate=second.authorizeExactReceiver();
  assert.equal(duplicate.ok,false);assert.equal(duplicate.status,'REPLAY_BLOCKED');assert.equal(duplicate.snapshot.delivery_status,'AWAITING_EXACT_AUTHORIZATION');
});

test('replay registry outage fails closed at reserve and commit boundaries',()=>{
  const reserveDown=module({replay_registry:replayRegistry({failReserve:true})});register(reserveDown);assert.equal(reserveDown.authorizeExactReceiver().status,'REPLAY_REGISTRY_UNAVAILABLE');
  const commitDown=module({replay_registry:replayRegistry({failCommit:true})});register(commitDown);assert.equal(commitDown.authorizeExactReceiver().ok,true);commitDown.noteExternalTransaction(TX);
  const result=commitDown.verifyReceiptEvidence(receipt());assert.equal(result.status,'REPLAY_REGISTRY_UNAVAILABLE');assert.equal(result.snapshot.delivery_status,'TX_PENDING');assert.equal(result.snapshot.receipt_status,'NOT_FOUND');
});

test('missing or malformed manifest time may register cargo but cannot authorize dispatch',()=>{
  const missing=module();const a=missing.registerCargo({cargo_manifest_id:'QA-CARGO',sender:SENDER,authorized_amount:'1',purpose_hash:'QA-PURPOSE',replay_key:'R'});assert.equal(a.ok,true);assert.equal(missing.authorizeExactReceiver().status,'MANIFEST_TIME_INVALID');
  const reversed=module();const now=Date.now();const b=register(reversed,{valid_from:new Date(now+60_000).toISOString(),expires_at:new Date(now).toISOString()});assert.equal(b.ok,true);assert.equal(reversed.authorizeExactReceiver().status,'MANIFEST_TIME_INVALID');
});

test('manifest cannot authorize before valid_from or at/after expires_at',()=>{
  const now=Date.now();
  const future=module();register(future,{valid_from:new Date(now+3_600_000).toISOString(),expires_at:new Date(now+7_200_000).toISOString()});assert.equal(future.authorizeExactReceiver().status,'MANIFEST_NOT_YET_VALID');
  const expired=module();register(expired,{valid_from:new Date(now-7_200_000).toISOString(),expires_at:new Date(now-3_600_000).toISOString()});assert.equal(expired.authorizeExactReceiver().status,'MANIFEST_EXPIRED');
});

test('happy path requires exact chain/log identity, finality, manifest time, balance reconciliation and ATM acceptance before DELIVERED',()=>{
  const m=module();register(m);assert.equal(m.authorizeExactReceiver().ok,true);assert.equal(m.noteExternalTransaction(TX).ok,true);
  assert.equal(m.verifyReceiptEvidence(receipt()).ok,true);assert.equal(m.snapshot().available_ATM_inventory,'0');
  assert.equal(m.snapshot().replay_registry_authority,'EXTERNAL_DURABLE_SHARED_REGISTRY');assert.equal(m.snapshot().replay_reservation_status,'COMMITTED');
  assert.equal(m.snapshot().block_number,'123456');assert.equal(m.snapshot().block_hash,BLOCK_HASH);assert.equal(m.snapshot().transfer_log_index,'7');assert.equal(m.snapshot().confirmations,'12');
  assert.equal(m.snapshot().receipt_evidence_authority,'STRUCTURAL_CHAIN_EVIDENCE_ONLY_NOT_INDEPENDENT_RPC_AUTHORITY');assert.equal(m.snapshot().manifest_time_authority,'SYSTEM_WALL_CLOCK_FAIL_CLOSED');
  assert.equal(m.reconcileBalance({token_balance_before:'10',token_balance_after:'1080010'}).ok,true);assert.equal(m.markArrived().ok,true);assert.equal(m.acceptAtmInventory({accepted:true}).ok,true);
  const delivered=m.markDelivered({gas_cost_bnb:.001,delivery_cost:'100',freight_fee_evidence:true});assert.equal(delivered.ok,true);
  const s=m.snapshot();assert.equal(s.delivery_status,'DELIVERED');assert.equal(s.restricted_inventory_balance,'1080000');assert.equal(s.custody_liability_balance,'1080000');assert.equal(s.available_ATM_inventory,'1080000');assert.equal(s.freight_fee,'888');assert.equal(s.freight_fee_revenue,'0');assert.equal(s.freight_fee_revenue_status,'UNVERIFIED_NO_INDEPENDENT_ACCOUNTING_EVIDENCE');assert.equal(s.freight_fee_revenue_authority,'NONE_CONNECTED');assert.equal(s.net_profit,'-100');assert.equal(s.mainnet_write_executed,false);
});

test('caller-supplied freight fee evidence cannot manufacture recognized revenue',()=>{
  const m=module();register(m,{fee:'888'});m.authorizeExactReceiver();m.noteExternalTransaction(TX);m.verifyReceiptEvidence(receipt());
  m.reconcileBalance({token_balance_before:'10',token_balance_after:'1080010'});m.markArrived();m.acceptAtmInventory({accepted:true});
  const delivered=m.markDelivered({delivery_cost:'0',freight_fee_evidence:true});assert.equal(delivered.ok,true);
  const s=m.snapshot();assert.equal(s.freight_fee,'888');assert.equal(s.freight_fee_revenue,'0');assert.equal(s.freight_fee_revenue_status,'UNVERIFIED_NO_INDEPENDENT_ACCOUNTING_EVIDENCE');assert.equal(s.freight_fee_revenue_authority,'NONE_CONNECTED');assert.equal(s.net_profit,'0');
  const last=m.journal().at(-1);assert.equal(last.type,'DELIVERED');assert.equal(last.data.caller_freight_fee_evidence_ignored,true);assert.equal(last.data.freight_fee_revenue,'0');
});

test('exact integer accounting preserves values above Number.MAX_SAFE_INTEGER',()=>{
  const amount='900719925474099312345678901234567890';
  const before='123456789012345678901234567890';
  const after=(BigInt(before)+BigInt(amount)).toString();
  const m=module();register(m,{amount,fee:'999999999999999999'});m.authorizeExactReceiver();m.noteExternalTransaction(TX);
  const ev=receipt();ev.transfer={...ev.transfer,amount};
  assert.equal(m.verifyReceiptEvidence(ev).ok,true);
  assert.equal(m.reconcileBalance({token_balance_before:before,token_balance_after:after}).ok,true);m.markArrived();m.acceptAtmInventory({accepted:true});
  assert.equal(m.snapshot().authorized_amount,amount);assert.equal(m.snapshot().received_amount,amount);assert.equal(m.snapshot().available_ATM_inventory,amount);
});

test('unsafe or fractional Number amounts fail closed instead of rounding',()=>{
  const unsafe=module();const a=register(unsafe,{amount:Number.MAX_SAFE_INTEGER+10});assert.equal(a.ok,false);assert.equal(a.status,'INVALID_EXACT_AMOUNT');
  const fractional=module();const b=register(fractional,{amount:1.5});assert.equal(b.ok,false);assert.equal(b.status,'INVALID_EXACT_AMOUNT');
});

test('receipt verifier id and chain id are exact fail-closed boundaries',()=>{
  const a=module();register(a);a.authorizeExactReceiver();a.noteExternalTransaction(TX);assert.equal(a.verifyReceiptEvidence(receipt({receipt_verifier_id:'CALLER-FORGED'})).status,'VERIFIER_ID_MISMATCH');
  const b=module();register(b);b.authorizeExactReceiver();b.noteExternalTransaction(TX);assert.equal(b.verifyReceiptEvidence(receipt({chain_id:97})).status,'CHAIN_ID_MISMATCH');
});

test('receipt requires exact block identity and configured finality',()=>{
  const a=module();register(a);a.authorizeExactReceiver();a.noteExternalTransaction(TX);assert.equal(a.verifyReceiptEvidence(receipt({block_hash:null})).status,'BLOCK_IDENTITY_MISSING');
  const b=module();register(b);b.authorizeExactReceiver();b.noteExternalTransaction(TX);assert.equal(b.verifyReceiptEvidence(receipt({observed_head_block:'123466'})).status,'FINALITY_REQUIRED');
  const c=module();register(c);c.authorizeExactReceiver();c.noteExternalTransaction(TX);assert.equal(c.verifyReceiptEvidence(receipt({observed_head_block:'123455'})).status,'FINALITY_REQUIRED');
});

test('decoded Transfer must bind transaction, block, log index and ERC20 event signature',()=>{
  for(const [field,value] of [['transaction_hash','0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'],['block_hash','0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'],['event_signature','0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee']]){
    const m=module();register(m);m.authorizeExactReceiver();m.noteExternalTransaction(TX);const ev=receipt();ev.transfer={...ev.transfer,[field]:value};assert.equal(m.verifyReceiptEvidence(ev).status,'LOG_IDENTITY_MISSING');
  }
  const missing=module();register(missing);missing.authorizeExactReceiver();missing.noteExternalTransaction(TX);const ev=receipt();ev.transfer={...ev.transfer,log_index:null};assert.equal(missing.verifyReceiptEvidence(ev).status,'LOG_IDENTITY_MISSING');
});

test('cannot jump directly to delivered from local state',()=>{const m=module();register(m);assert.equal(m.markDelivered({freight_fee_evidence:true}).ok,false);assert.notEqual(m.snapshot().delivery_status,'DELIVERED')});

test('wrong receiver and amount mismatch fail closed',()=>{
  const a=module();register(a);a.authorizeExactReceiver();a.noteExternalTransaction(TX);const ea=receipt();ea.transfer={...ea.transfer,to:'0x3333333333333333333333333333333333333333'};assert.equal(a.verifyReceiptEvidence(ea).status,'WRONG_RECEIVER');
  const b=module();register(b);b.authorizeExactReceiver();b.noteExternalTransaction(TX);const eb=receipt();eb.transfer={...eb.transfer,amount:'1079999'};assert.equal(b.verifyReceiptEvidence(eb).status,'AMOUNT_MISMATCH');
});

test('RPC disagreement, reverted and dropped transaction are explicit errors',()=>{
  const a=module();register(a);a.authorizeExactReceiver();a.noteExternalTransaction(TX);assert.equal(a.verifyReceiptEvidence(receipt({rpc_agreement:false})).status,'RPC_DISAGREEMENT');
  const b=module();register(b);b.authorizeExactReceiver();b.noteExternalTransaction(TX);assert.equal(b.verifyReceiptEvidence(receipt({status:0})).status,'TX_REVERTED');
  const c=module();register(c);c.authorizeExactReceiver();c.noteExternalTransaction(TX);assert.equal(c.verifyReceiptEvidence(receipt({dropped:true})).status,'TX_DROPPED');
});

test('balance delta mismatch does not release ATM inventory',()=>{const m=module();register(m);m.authorizeExactReceiver();m.noteExternalTransaction(TX);m.verifyReceiptEvidence(receipt());const r=m.reconcileBalance({token_balance_before:'0',token_balance_after:'100'});assert.equal(r.status,'RECONCILIATION_REQUIRED');assert.equal(m.snapshot().available_ATM_inventory,'0')});

test('append-only journal advances monotonically',()=>{const m=module();register(m);m.authorizeExactReceiver();const a=m.journal();assert.ok(a.length>=3);assert.deepEqual(a.map(x=>x.seq),a.map((_,i)=>i+1));a[0].type='MUTATED_COPY';assert.notEqual(m.journal()[0].type,'MUTATED_COPY')});

test('route direction requires evidence and agrees with target coordinate',()=>{
  assert.equal(validateRouteEvidence({axis:'KX',direction:'LONG'}).status,'ROUTE_EVIDENCE_MISSING');
  const common={axis:'KX',from:{x:1,y:0,z:0},to:{x:2,y:0,z:0},routeEvidence:{id:'R'},decisionEvidence:{id:'D'},marketState:{id:'M'},technicalIndicators:{id:'T'},risk:1,cost:2,expectedProfit:3};
  assert.equal(validateRouteEvidence({...common,direction:'LONG'}).ok,true);assert.equal(validateRouteEvidence({...common,direction:'SHORT'}).status,'DIRECTION_ROUTE_MISMATCH');
});

test('Digital Ant bridge preserves SAME_LIFE_ID and waits when real receiver is absent',()=>{
  const b=createDigitalAntKaiosReceivingBridge();const r=b.registerCargo();assert.equal(r.ok,true);const s=b.snapshot();assert.equal(s.ant.lifeId,'DIGITAL_ANT_0001');assert.equal(s.receiving.real_receiving_gate,'NOT_DEPLOYED');assert.equal(s.receiving.delivery_status,'AWAITING_EXACT_AUTHORIZATION');assert.equal(s.ant.state,'WAIT');
});

test('receiving source contains no signer/private-key or transaction-send capability',async()=>{
  const src=await fs.readFile(new URL('../runtime/kaios-atm-receiving-runtime.mjs',import.meta.url),'utf8');
  for(const forbidden of ['private'+'Key','send'+'Transaction','eth_'+'sendTransaction','wallet.'+'sign','new Wallet'])assert.equal(src.includes(forbidden),false,`forbidden capability found: ${forbidden}`);
});
