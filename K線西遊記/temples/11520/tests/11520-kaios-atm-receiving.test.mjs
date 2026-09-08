import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createKaiosAtmReceivingModule,validateRouteEvidence} from '../runtime/kaios-atm-receiving-runtime.mjs';
import {createDigitalAntKaiosReceivingBridge,DIGITAL_ANT_11520_CARGO} from '../runtime/digital-ant-kaios-receiving-bridge.mjs';

const RECEIVER='0x1111111111111111111111111111111111111111';
const TOKEN='0x2222222222222222222222222222222222222222';
const SENDER=DIGITAL_ANT_11520_CARGO.sender;
const TX='0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
function module(config={}){return createKaiosAtmReceivingModule({receiver_contract_or_escrow_address:RECEIVER,KAIOS_token_address:TOKEN,custody_policy_id:'QA-CUSTODY',receipt_verifier_id:'QA-VERIFIER',...config})}
function register(m,{replay='REPLAY-1'}={}){return m.registerCargo({cargo_manifest_id:'QA-CARGO',sender:SENDER,authorized_amount:1080000,freight_fee:888,purpose_hash:'QA-PURPOSE',replay_key:replay})}
function receipt(overrides={}){return {status:1,transaction_hash:TX,block_number:123456,rpc_agreement:true,transfer:{token:TOKEN,from:SENDER,to:RECEIVER,amount:1080000},...overrides}}

test('default module is NOT_DEPLOYED and cannot authorize a dispatch',()=>{
  const m=createKaiosAtmReceivingModule();register(m);const a=m.authorizeExactReceiver();
  assert.equal(a.ok,false);assert.equal(m.snapshot().real_receiving_gate,'NOT_DEPLOYED');assert.equal(m.snapshot().delivery_status,'AWAITING_EXACT_AUTHORIZATION');
});

test('happy path requires exact receipt, balance reconciliation, ATM acceptance before DELIVERED',()=>{
  const m=module();register(m);assert.equal(m.authorizeExactReceiver().ok,true);assert.equal(m.noteExternalTransaction(TX).ok,true);
  assert.equal(m.verifyReceiptEvidence(receipt()).ok,true);assert.equal(m.snapshot().available_ATM_inventory,0);
  assert.equal(m.reconcileBalance({token_balance_before:10,token_balance_after:1080010}).ok,true);assert.equal(m.markArrived().ok,true);assert.equal(m.acceptAtmInventory({accepted:true}).ok,true);
  const delivered=m.markDelivered({gas_cost_bnb:.001,delivery_cost:100,freight_fee_evidence:true});assert.equal(delivered.ok,true);
  const s=m.snapshot();assert.equal(s.delivery_status,'DELIVERED');assert.equal(s.restricted_inventory_balance,1080000);assert.equal(s.custody_liability_balance,1080000);assert.equal(s.available_ATM_inventory,1080000);assert.equal(s.freight_fee_revenue,888);assert.equal(s.net_profit,788);assert.equal(s.mainnet_write_executed,false);
});

test('cannot jump directly to delivered from local state',()=>{const m=module();register(m);assert.equal(m.markDelivered({freight_fee_evidence:true}).ok,false);assert.notEqual(m.snapshot().delivery_status,'DELIVERED')});

test('wrong receiver and amount mismatch fail closed',()=>{
  const a=module();register(a);a.authorizeExactReceiver();a.noteExternalTransaction(TX);assert.equal(a.verifyReceiptEvidence(receipt({transfer:{token:TOKEN,from:SENDER,to:'0x3333333333333333333333333333333333333333',amount:1080000}})).status,'WRONG_RECEIVER');
  const b=module();register(b);b.authorizeExactReceiver();b.noteExternalTransaction(TX);assert.equal(b.verifyReceiptEvidence(receipt({transfer:{token:TOKEN,from:SENDER,to:RECEIVER,amount:1079999}})).status,'AMOUNT_MISMATCH');
});

test('RPC disagreement, reverted and dropped transaction are explicit errors',()=>{
  const a=module();register(a);a.authorizeExactReceiver();a.noteExternalTransaction(TX);assert.equal(a.verifyReceiptEvidence(receipt({rpc_agreement:false})).status,'RPC_DISAGREEMENT');
  const b=module();register(b);b.authorizeExactReceiver();b.noteExternalTransaction(TX);assert.equal(b.verifyReceiptEvidence(receipt({status:0})).status,'TX_REVERTED');
  const c=module();register(c);c.authorizeExactReceiver();c.noteExternalTransaction(TX);assert.equal(c.verifyReceiptEvidence(receipt({dropped:true})).status,'TX_DROPPED');
});

test('balance delta mismatch does not release ATM inventory',()=>{const m=module();register(m);m.authorizeExactReceiver();m.noteExternalTransaction(TX);m.verifyReceiptEvidence(receipt());const r=m.reconcileBalance({token_balance_before:0,token_balance_after:100});assert.equal(r.status,'RECONCILIATION_REQUIRED');assert.equal(m.snapshot().available_ATM_inventory,0)});

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
