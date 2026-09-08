/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE
PURPOSE: Read-only/fail-closed KAIOS ATM receiving and reconciliation runtime for the existing 11520 product. This module never signs or sends a transaction.
*/

export const KAIOS_ATM_RECEIVING_VERSION='KAIOS_ATM_RECEIVING_MODULE_V1';
export const DELIVERY_STATES=Object.freeze([
  'CARGO_REGISTERED','AWAITING_EXACT_AUTHORIZATION','READY_FOR_DISPATCH','TX_PENDING','RECEIPT_FOUND',
  'BALANCE_RECONCILED','ARRIVED_AT_11520','ATM_INVENTORY_ACCEPTED','DELIVERED',
]);
export const DELIVERY_ERRORS=Object.freeze([
  'RECONCILIATION_REQUIRED','RPC_DISAGREEMENT','TX_REVERTED','TX_DROPPED','AMOUNT_MISMATCH','WRONG_RECEIVER',
  'REPLAY_BLOCKED','DELIVERY_REJECTED','DIRECTION_ROUTE_MISMATCH','ROUTE_EVIDENCE_MISSING',
]);
const STATE_INDEX=new Map(DELIVERY_STATES.map((x,i)=>[x,i]));
const ADDR=/^0x[0-9a-fA-F]{40}$/;
const TX=/^0x[0-9a-fA-F]{64}$/;
const clone=x=>JSON.parse(JSON.stringify(x));
const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const normAddr=v=>ADDR.test(String(v||''))?String(v).toLowerCase():null;
const eqAddr=(a,b)=>normAddr(a)!==null&&normAddr(a)===normAddr(b);

function advance(record,next){
  if(!STATE_INDEX.has(next))throw new Error(`UNKNOWN_DELIVERY_STATE:${next}`);
  const cur=STATE_INDEX.get(record.delivery_status);
  const wanted=STATE_INDEX.get(next);
  if(wanted!==cur+1)throw new Error(`INVALID_DELIVERY_TRANSITION:${record.delivery_status}->${next}`);
  record.delivery_status=next;
}
function journal(record,type,data={}){
  record._journal.push(Object.freeze({seq:record._journal.length+1,type,at:new Date().toISOString(),data:clone(data)}));
}
function fail(record,status,data={}){record.last_error=status;journal(record,status,data);return {ok:false,status,snapshot:snapshot(record)}}

export function validateRouteEvidence({axis,direction,from,to,routeEvidence,decisionEvidence,marketState,technicalIndicators,risk,cost,expectedProfit}={}){
  const a=String(axis||'').toUpperCase(),d=String(direction||'').toUpperCase();
  if(!['KX','KY','KZ'].includes(a)||!['LONG','SHORT'].includes(d)||!routeEvidence||!decisionEvidence||!marketState||!technicalIndicators)
    return {ok:false,status:'ROUTE_EVIDENCE_MISSING'};
  if(!Number.isFinite(Number(risk))||!Number.isFinite(Number(cost))||!Number.isFinite(Number(expectedProfit)))return {ok:false,status:'ROUTE_EVIDENCE_MISSING'};
  const key={KX:'x',KY:'y',KZ:'z'}[a],delta=finite(to?.[key])-finite(from?.[key]);
  if((d==='LONG'&&delta<=0)||(d==='SHORT'&&delta>=0))return {ok:false,status:'DIRECTION_ROUTE_MISMATCH',delta};
  return {ok:true,axis:a,direction:d,delta};
}

export function createKaiosAtmReceivingModule(config={}){
  const receiver=normAddr(config.receiver_contract_or_escrow_address);
  const token=normAddr(config.KAIOS_token_address);
  const record={
    receiver_module_id:config.receiver_module_id||KAIOS_ATM_RECEIVING_VERSION,
    receiver_chain_id:56,
    receiver_contract_or_escrow_address:receiver,
    KAIOS_token_address:token,
    cargo_manifest_id:null,sender:null,authorized_amount:0,received_amount:0,freight_fee:0,
    restricted_inventory_balance:0,custody_liability_balance:0,available_ATM_inventory:0,
    purpose_hash:null,replay_key:null,valid_from:null,expires_at:null,transaction_hash:null,block_number:null,
    receipt_status:'NOT_FOUND',token_balance_before:null,token_balance_after:null,
    delivery_status:'CARGO_REGISTERED',receiver_acceptance:false,accounting_status:'UNRECONCILED',
    custody_policy_id:config.custody_policy_id||null,receipt_verifier_id:config.receipt_verifier_id||null,
    last_error:null,freight_fee_revenue:0,gas_cost_bnb:0,delivery_cost:0,net_profit:0,
    _journal:[],_usedReplayKeys:new Set(),_verifiedReceipt:null,
  };
  journal(record,'MODULE_CREATED',{receiverConfigured:Boolean(receiver),tokenConfigured:Boolean(token)});

  function registerCargo(manifest={}){
    if(record.cargo_manifest_id)return fail(record,'DELIVERY_REJECTED',{reason:'CARGO_ALREADY_REGISTERED'});
    if(!manifest.cargo_manifest_id||!normAddr(manifest.sender)||finite(manifest.authorized_amount)<=0||!manifest.purpose_hash||!manifest.replay_key)
      return fail(record,'DELIVERY_REJECTED',{reason:'MANIFEST_INCOMPLETE'});
    record.cargo_manifest_id=String(manifest.cargo_manifest_id);record.sender=normAddr(manifest.sender);record.authorized_amount=finite(manifest.authorized_amount);
    record.freight_fee=Math.max(0,finite(manifest.freight_fee));record.purpose_hash=String(manifest.purpose_hash);record.replay_key=String(manifest.replay_key);
    record.valid_from=manifest.valid_from||null;record.expires_at=manifest.expires_at||null;
    record.restricted_inventory_balance=record.authorized_amount;record.custody_liability_balance=record.authorized_amount;
    advance(record,'AWAITING_EXACT_AUTHORIZATION');journal(record,'CARGO_REGISTERED',{cargo_manifest_id:record.cargo_manifest_id,authorized_amount:record.authorized_amount});
    return {ok:true,snapshot:snapshot(record)};
  }
  function authorizeExactReceiver(){
    if(record.delivery_status!=='AWAITING_EXACT_AUTHORIZATION')return fail(record,'DELIVERY_REJECTED',{reason:'WRONG_STATE'});
    if(!record.receiver_contract_or_escrow_address||!record.KAIOS_token_address||!record.custody_policy_id||!record.receipt_verifier_id)
      return fail(record,'DELIVERY_REJECTED',{reason:'11520_REAL_KAIOS_RECEIVING_GATE_NOT_DEPLOYED'});
    if(record._usedReplayKeys.has(record.replay_key))return fail(record,'REPLAY_BLOCKED');
    advance(record,'READY_FOR_DISPATCH');journal(record,'EXACT_RECEIVER_AUTHORIZED',{receiver:record.receiver_contract_or_escrow_address});
    return {ok:true,snapshot:snapshot(record)};
  }
  function noteExternalTransaction(txHash){
    if(record.delivery_status!=='READY_FOR_DISPATCH')return fail(record,'DELIVERY_REJECTED',{reason:'NOT_READY_FOR_DISPATCH'});
    if(!TX.test(String(txHash||'')))return fail(record,'DELIVERY_REJECTED',{reason:'INVALID_TX_HASH'});
    record.transaction_hash=String(txHash).toLowerCase();advance(record,'TX_PENDING');journal(record,'EXTERNAL_TX_NOTED',{transaction_hash:record.transaction_hash});
    return {ok:true,snapshot:snapshot(record)};
  }
  function verifyReceiptEvidence(evidence={}){
    if(record.delivery_status!=='TX_PENDING')return fail(record,'DELIVERY_REJECTED',{reason:'WRONG_STATE'});
    if(evidence.rpc_agreement===false)return fail(record,'RPC_DISAGREEMENT');
    if(evidence.dropped===true)return fail(record,'TX_DROPPED');
    if(evidence.status!==1&&evidence.status!=='0x1'&&evidence.status!==true)return fail(record,'TX_REVERTED');
    if(String(evidence.transaction_hash||'').toLowerCase()!==record.transaction_hash)return fail(record,'DELIVERY_REJECTED',{reason:'TX_HASH_MISMATCH'});
    if(record._usedReplayKeys.has(record.replay_key))return fail(record,'REPLAY_BLOCKED');
    const transfer=evidence.transfer||{};
    if(!eqAddr(transfer.token,record.KAIOS_token_address)||!eqAddr(transfer.from,record.sender)||!eqAddr(transfer.to,record.receiver_contract_or_escrow_address))
      return fail(record,'WRONG_RECEIVER',{transfer});
    const amount=finite(transfer.amount);
    if(amount!==record.authorized_amount)return fail(record,'AMOUNT_MISMATCH',{expected:record.authorized_amount,received:amount});
    record.received_amount=amount;record.block_number=Number.isFinite(Number(evidence.block_number))?Number(evidence.block_number):null;
    record.receipt_status='FOUND_VERIFIED';record._verifiedReceipt=clone(evidence);record._usedReplayKeys.add(record.replay_key);
    advance(record,'RECEIPT_FOUND');journal(record,'RECEIPT_VERIFIED',{block_number:record.block_number,amount});
    return {ok:true,snapshot:snapshot(record)};
  }
  function reconcileBalance({token_balance_before,token_balance_after}={}){
    if(record.delivery_status!=='RECEIPT_FOUND')return fail(record,'RECONCILIATION_REQUIRED',{reason:'RECEIPT_NOT_READY'});
    const before=finite(token_balance_before,NaN),after=finite(token_balance_after,NaN);
    if(!Number.isFinite(before)||!Number.isFinite(after)||after-before!==record.received_amount)return fail(record,'RECONCILIATION_REQUIRED',{before,after,expectedDelta:record.received_amount});
    record.token_balance_before=before;record.token_balance_after=after;record.accounting_status='BALANCE_RECONCILED';advance(record,'BALANCE_RECONCILED');
    journal(record,'BALANCE_RECONCILED',{before,after,delta:after-before});return {ok:true,snapshot:snapshot(record)};
  }
  function markArrived(){if(record.delivery_status!=='BALANCE_RECONCILED')return fail(record,'RECONCILIATION_REQUIRED');advance(record,'ARRIVED_AT_11520');journal(record,'ARRIVED_AT_11520');return {ok:true,snapshot:snapshot(record)}}
  function acceptAtmInventory({accepted=true}={}){
    if(record.delivery_status!=='ARRIVED_AT_11520')return fail(record,'DELIVERY_REJECTED',{reason:'NOT_ARRIVED'});
    if(accepted!==true)return fail(record,'DELIVERY_REJECTED',{reason:'RECEIVER_REJECTED'});
    record.receiver_acceptance=true;record.available_ATM_inventory=record.received_amount;record.accounting_status='RESTRICTED_INVENTORY_WITH_MATCHING_LIABILITY';advance(record,'ATM_INVENTORY_ACCEPTED');journal(record,'ATM_INVENTORY_ACCEPTED',{amount:record.available_ATM_inventory});
    return {ok:true,snapshot:snapshot(record)};
  }
  function markDelivered({gas_cost_bnb=0,delivery_cost=0,freight_fee_evidence=false}={}){
    if(record.delivery_status!=='ATM_INVENTORY_ACCEPTED'||!record.receiver_acceptance)return fail(record,'DELIVERY_REJECTED',{reason:'ATM_NOT_ACCEPTED'});
    record.gas_cost_bnb=Math.max(0,finite(gas_cost_bnb));record.delivery_cost=Math.max(0,finite(delivery_cost));
    record.freight_fee_revenue=freight_fee_evidence===true?record.freight_fee:0;record.net_profit=record.freight_fee_revenue-record.delivery_cost;
    advance(record,'DELIVERED');journal(record,'DELIVERED',{freight_fee_revenue:record.freight_fee_revenue,delivery_cost:record.delivery_cost,gas_cost_bnb:record.gas_cost_bnb});
    return {ok:true,snapshot:snapshot(record)};
  }
  return {registerCargo,authorizeExactReceiver,noteExternalTransaction,verifyReceiptEvidence,reconcileBalance,markArrived,acceptAtmInventory,markDelivered,snapshot:()=>snapshot(record),journal:()=>record._journal.map(clone)};
}

export function snapshot(record){
  const out={};for(const [k,v] of Object.entries(record)){if(!k.startsWith('_'))out[k]=v}
  out.real_receiving_gate=record.receiver_contract_or_escrow_address&&record.KAIOS_token_address&&record.custody_policy_id&&record.receipt_verifier_id?'CONFIGURED':'NOT_DEPLOYED';
  out.mainnet_write_executed=false;return clone(out);
}
