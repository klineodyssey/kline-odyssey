/* KGEN_META
VERSION: 1.4.0
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
  'REPLAY_BLOCKED','DELIVERY_REJECTED','DIRECTION_ROUTE_MISMATCH','ROUTE_EVIDENCE_MISSING','MARKET_DIRECTION_AUTHORITY_NOT_CONNECTED','INVALID_EXACT_AMOUNT',
  'VERIFIER_ID_MISMATCH','CHAIN_ID_MISMATCH','FINALITY_REQUIRED','BLOCK_IDENTITY_MISSING','LOG_IDENTITY_MISSING',
  'MANIFEST_TIME_INVALID','MANIFEST_NOT_YET_VALID','MANIFEST_EXPIRED','REPLAY_REGISTRY_UNAVAILABLE',
  'INDEPENDENT_RECEIPT_VERIFIER_NOT_CONNECTED','INDEPENDENT_RECEIPT_VERIFICATION_FAILED',
]);
const STATE_INDEX=new Map(DELIVERY_STATES.map((x,i)=>[x,i]));
const ADDR=/^0x[0-9a-fA-F]{40}$/;
const TX=/^0x[0-9a-fA-F]{64}$/;
const UINT=/^(0|[1-9][0-9]*)$/;
const TRANSFER_TOPIC='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const clone=x=>JSON.parse(JSON.stringify(x));
const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const normAddr=v=>ADDR.test(String(v||''))?String(v).toLowerCase():null;
const eqAddr=(a,b)=>normAddr(a)!==null&&normAddr(a)===normAddr(b);
function exactUint(v){
  if(typeof v==='bigint'){if(v<0n)throw new Error('INVALID_EXACT_AMOUNT');return v}
  if(typeof v==='number'){if(!Number.isSafeInteger(v)||v<0)throw new Error('INVALID_EXACT_AMOUNT');return BigInt(v)}
  const s=String(v??'');if(!UINT.test(s))throw new Error('INVALID_EXACT_AMOUNT');return BigInt(s);
}
const exactString=v=>exactUint(v).toString();
const exactSub=(a,b)=>(exactUint(a)-exactUint(b)).toString();
const hexUint=v=>exactUint(BigInt(String(v)));
const topicAddress=v=>normAddr(`0x${String(v||'').replace(/^0x/,'').slice(-40)}`);
function parseManifestTime(v){
  if(typeof v!=='string'||!v.trim())return null;
  const ms=Date.parse(v);return Number.isFinite(ms)?ms:null;
}
function manifestWindowStatus(record,now=Date.now()){
  const from=parseManifestTime(record.valid_from),expires=parseManifestTime(record.expires_at);
  if(from===null||expires===null||from>=expires)return {ok:false,status:'MANIFEST_TIME_INVALID'};
  if(now<from)return {ok:false,status:'MANIFEST_NOT_YET_VALID',valid_from:record.valid_from};
  if(now>=expires)return {ok:false,status:'MANIFEST_EXPIRED',expires_at:record.expires_at};
  return {ok:true,valid_from:record.valid_from,expires_at:record.expires_at};
}

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
  const spatial_delta=Object.freeze({x:finite(to?.x)-finite(from?.x),y:finite(to?.y)-finite(from?.y),z:finite(to?.z)-finite(from?.z)});
  return {ok:false,status:'MARKET_DIRECTION_AUTHORITY_NOT_CONNECTED',axis:a,direction:d,spatial_delta,authority:'K_MARKET_DIRECTION_MUST_NOT_BE_DERIVED_FROM_PLAYER_XYZ'};
}

export function createIndependentKaiosReceiptVerifier({verifier_id,providers,min_provider_agreement=2}={}){
  if(!String(verifier_id||'').trim())throw new Error('VERIFIER_ID_REQUIRED');
  if(!Array.isArray(providers)||providers.length<min_provider_agreement||min_provider_agreement<2)throw new Error('INDEPENDENT_RPC_PROVIDERS_REQUIRED');
  for(const provider of providers){
    if(!provider||typeof provider.getChainId!=='function'||typeof provider.getTransactionReceipt!=='function'||typeof provider.getBlockNumber!=='function'||typeof provider.getTokenBalance!=='function')throw new Error('INDEPENDENT_RPC_PROVIDER_INTERFACE_INVALID');
  }
  async function observe(provider,{transaction_hash,token,receiver}){
    const chainId=await provider.getChainId();
    const receipt=await provider.getTransactionReceipt(transaction_hash);
    if(!receipt)throw new Error('RECEIPT_NOT_FOUND');
    const blockNumber=hexUint(receipt.blockNumber);
    const head=exactUint(await provider.getBlockNumber());
    const balanceBefore=exactUint(await provider.getTokenBalance(token,receiver,(blockNumber-1n).toString()));
    const balanceAfter=exactUint(await provider.getTokenBalance(token,receiver,blockNumber.toString()));
    return {chainId:Number(chainId),receipt,blockNumber,head,balanceBefore,balanceAfter};
  }
  return Object.freeze({
    authority:'INDEPENDENT_RPC_RECEIPT_VERIFIER',verifier_id:String(verifier_id),provider_count:providers.length,min_provider_agreement,
    async verify({transaction_hash,token,sender,receiver,amount}){
      if(!TX.test(String(transaction_hash||''))||!normAddr(token)||!normAddr(sender)||!normAddr(receiver))throw new Error('INDEPENDENT_RECEIPT_REQUEST_INVALID');
      const expectedAmount=exactString(amount);
      const observations=await Promise.all(providers.map(provider=>observe(provider,{transaction_hash,token,receiver})));
      const identity=observation=>JSON.stringify({
        chainId:observation.chainId,status:String(observation.receipt.status),transactionHash:String(observation.receipt.transactionHash||'').toLowerCase(),
        blockNumber:observation.blockNumber.toString(),blockHash:String(observation.receipt.blockHash||'').toLowerCase()
      });
      const groups=new Map();for(const observation of observations){const key=identity(observation);groups.set(key,[...(groups.get(key)||[]),observation])}
      const agreed=[...groups.values()].sort((a,b)=>b.length-a.length)[0]||[];
      if(agreed.length<min_provider_agreement)throw new Error('RPC_DISAGREEMENT');
      const canonical=agreed[0];
      if(canonical.chainId!==56)throw new Error('CHAIN_ID_MISMATCH');
      const logs=(canonical.receipt.logs||[]).filter(log=>eqAddr(log.address,token)&&String(log.transactionHash||canonical.receipt.transactionHash||'').toLowerCase()===String(transaction_hash).toLowerCase());
      const log=logs.find(item=>String(item.topics?.[0]||'').toLowerCase()===TRANSFER_TOPIC&&eqAddr(topicAddress(item.topics?.[1]),sender)&&eqAddr(topicAddress(item.topics?.[2]),receiver)&&hexUint(item.data).toString()===expectedAmount);
      if(!log)throw new Error('TRANSFER_LOG_NOT_FOUND');
      const balancesAgree=agreed.every(item=>item.balanceBefore===canonical.balanceBefore&&item.balanceAfter===canonical.balanceAfter);
      if(!balancesAgree)throw new Error('RPC_DISAGREEMENT');
      return Object.freeze({
        receipt_verifier_id:String(verifier_id),chain_id:canonical.chainId,status:canonical.receipt.status,
        transaction_hash:String(canonical.receipt.transactionHash).toLowerCase(),block_number:canonical.blockNumber.toString(),
        block_hash:String(canonical.receipt.blockHash).toLowerCase(),observed_head_block:agreed.reduce((min,item)=>item.head<min?item.head:min,agreed[0].head).toString(),rpc_agreement:true,
        transfer:Object.freeze({token:normAddr(token),from:normAddr(sender),to:normAddr(receiver),amount:expectedAmount,
          transaction_hash:String(canonical.receipt.transactionHash).toLowerCase(),block_number:canonical.blockNumber.toString(),block_hash:String(canonical.receipt.blockHash).toLowerCase(),
          log_index:hexUint(log.logIndex).toString(),event_signature:TRANSFER_TOPIC}),
        token_balance_before:canonical.balanceBefore.toString(),token_balance_after:canonical.balanceAfter.toString(),
        evidence_authority:'INDEPENDENT_RPC_RECEIPT_VERIFIER',provider_agreement_count:agreed.length
      });
    }
  });
}

export function createKaiosAtmReceivingModule(config={}){
  const receiver=normAddr(config.receiver_contract_or_escrow_address);
  const token=normAddr(config.KAIOS_token_address);
  const confirmations=Number(config.required_confirmations);
  const requiredConfirmations=Number.isSafeInteger(confirmations)&&confirmations>0?confirmations:null;
  const replayRegistry=config.replay_registry;
  const receiptVerifier=config.receipt_verifier;
  const receiptVerifierReady=Boolean(receiptVerifier&&receiptVerifier.authority==='INDEPENDENT_RPC_RECEIPT_VERIFIER'&&String(receiptVerifier.verifier_id||'')===String(config.receipt_verifier_id||'')&&typeof receiptVerifier.verify==='function');
  const replayRegistryReady=Boolean(
    replayRegistry&&
    replayRegistry.durability==='DURABLE_SHARED_REPLAY_REGISTRY'&&
    String(replayRegistry.registry_id||'').trim()&&
    typeof replayRegistry.reserve==='function'&&
    typeof replayRegistry.commit==='function'
  );
  const record={
    receiver_module_id:config.receiver_module_id||KAIOS_ATM_RECEIVING_VERSION,
    receiver_chain_id:56,
    receiver_contract_or_escrow_address:receiver,
    KAIOS_token_address:token,
    cargo_manifest_id:null,sender:null,authorized_amount:'0',received_amount:'0',freight_fee:'0',
    restricted_inventory_balance:'0',custody_liability_balance:'0',available_ATM_inventory:'0',
    purpose_hash:null,replay_key:null,valid_from:null,expires_at:null,transaction_hash:null,block_number:null,
    block_hash:null,transfer_log_index:null,observed_head_block:null,confirmations:null,
    receipt_status:'NOT_FOUND',token_balance_before:null,token_balance_after:null,
    delivery_status:'CARGO_REGISTERED',receiver_acceptance:false,accounting_status:'UNRECONCILED',
    custody_policy_id:config.custody_policy_id||null,receipt_verifier_id:config.receipt_verifier_id||null,
    required_confirmations:requiredConfirmations,
    receipt_evidence_authority:receiptVerifierReady?'INDEPENDENT_RPC_RECEIPT_VERIFIER':'STRUCTURAL_CHAIN_EVIDENCE_ONLY_NOT_INDEPENDENT_RPC_AUTHORITY',
    manifest_time_authority:'SYSTEM_WALL_CLOCK_FAIL_CLOSED',
    replay_registry_id:replayRegistryReady?String(replayRegistry.registry_id):null,
    replay_registry_authority:replayRegistryReady?'EXTERNAL_DURABLE_SHARED_REGISTRY':'NOT_CONNECTED',
    replay_reservation_id:null,replay_reservation_status:'NOT_RESERVED',
    last_error:null,freight_fee_revenue:'0',freight_fee_revenue_status:'NOT_EVALUATED',freight_fee_revenue_authority:'NONE_CONNECTED',gas_cost_bnb:0,delivery_cost:'0',net_profit:'0',
    _journal:[],_usedReplayKeys:new Set(),_verifiedReceipt:null,
  };
  journal(record,'MODULE_CREATED',{receiverConfigured:Boolean(receiver),tokenConfigured:Boolean(token),requiredConfirmations,replayRegistryReady,receiptVerifierReady});

  function replayBinding(){
    return Object.freeze({
      namespace:'KAIOS_11520_ATM_RECEIVING_V1',replay_key:record.replay_key,cargo_manifest_id:record.cargo_manifest_id,
      purpose_hash:record.purpose_hash,sender:record.sender,receiver:record.receiver_contract_or_escrow_address,
      token:record.KAIOS_token_address,amount:record.authorized_amount,
    });
  }

  function registerCargo(manifest={}){
    if(record.cargo_manifest_id)return fail(record,'DELIVERY_REJECTED',{reason:'CARGO_ALREADY_REGISTERED'});
    let authorized,fee;
    try{authorized=exactUint(manifest.authorized_amount);fee=exactUint(manifest.freight_fee??0)}catch{return fail(record,'INVALID_EXACT_AMOUNT',{field:'manifest'})}
    if(!manifest.cargo_manifest_id||!normAddr(manifest.sender)||authorized<=0n||!manifest.purpose_hash||!manifest.replay_key)
      return fail(record,'DELIVERY_REJECTED',{reason:'MANIFEST_INCOMPLETE'});
    const validFrom=parseManifestTime(manifest.valid_from),expiresAt=parseManifestTime(manifest.expires_at);
    record.cargo_manifest_id=String(manifest.cargo_manifest_id);record.sender=normAddr(manifest.sender);record.authorized_amount=authorized.toString();
    record.freight_fee=fee.toString();record.purpose_hash=String(manifest.purpose_hash);record.replay_key=String(manifest.replay_key);
    record.valid_from=validFrom===null?(manifest.valid_from||null):new Date(validFrom).toISOString();
    record.expires_at=expiresAt===null?(manifest.expires_at||null):new Date(expiresAt).toISOString();
    record.restricted_inventory_balance=record.authorized_amount;record.custody_liability_balance=record.authorized_amount;
    advance(record,'AWAITING_EXACT_AUTHORIZATION');journal(record,'CARGO_REGISTERED',{cargo_manifest_id:record.cargo_manifest_id,authorized_amount:record.authorized_amount,valid_from:record.valid_from,expires_at:record.expires_at});
    return {ok:true,snapshot:snapshot(record)};
  }
  function authorizeExactReceiver(){
    if(record.delivery_status!=='AWAITING_EXACT_AUTHORIZATION')return fail(record,'DELIVERY_REJECTED',{reason:'WRONG_STATE'});
    if(!record.receiver_contract_or_escrow_address||!record.KAIOS_token_address||!record.custody_policy_id||!record.receipt_verifier_id||!record.required_confirmations||!replayRegistryReady)
      return fail(record,'DELIVERY_REJECTED',{reason:'11520_REAL_KAIOS_RECEIVING_GATE_NOT_DEPLOYED'});
    const window=manifestWindowStatus(record);if(!window.ok)return fail(record,window.status,window);
    if(record._usedReplayKeys.has(record.replay_key))return fail(record,'REPLAY_BLOCKED');
    let reservation;
    try{reservation=replayRegistry.reserve(replayBinding())}catch{return fail(record,'REPLAY_REGISTRY_UNAVAILABLE',{operation:'reserve'})}
    if(!reservation||reservation.ok!==true||!String(reservation.reservation_id||''))return fail(record,'REPLAY_BLOCKED',{registry_status:reservation?.status||'INVALID_RESPONSE'});
    record.replay_reservation_id=String(reservation.reservation_id);record.replay_reservation_status='RESERVED';record._usedReplayKeys.add(record.replay_key);
    advance(record,'READY_FOR_DISPATCH');journal(record,'EXACT_RECEIVER_AUTHORIZED',{receiver:record.receiver_contract_or_escrow_address,required_confirmations:record.required_confirmations,valid_from:record.valid_from,expires_at:record.expires_at});
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
    const window=manifestWindowStatus(record);if(!window.ok)return fail(record,window.status,window);
    if(String(evidence.receipt_verifier_id||'')!==String(record.receipt_verifier_id||''))return fail(record,'VERIFIER_ID_MISMATCH');
    if(Number(evidence.chain_id)!==record.receiver_chain_id)return fail(record,'CHAIN_ID_MISMATCH',{expected:record.receiver_chain_id,received:evidence.chain_id??null});
    if(evidence.rpc_agreement===false)return fail(record,'RPC_DISAGREEMENT');
    if(evidence.dropped===true)return fail(record,'TX_DROPPED');
    if(evidence.status!==1&&evidence.status!=='0x1'&&evidence.status!==true)return fail(record,'TX_REVERTED');
    if(String(evidence.transaction_hash||'').toLowerCase()!==record.transaction_hash)return fail(record,'DELIVERY_REJECTED',{reason:'TX_HASH_MISMATCH'});
    if(record.replay_reservation_status!=='RESERVED'||!record.replay_reservation_id)return fail(record,'REPLAY_BLOCKED',{reason:'RESERVATION_MISSING'});

    let blockNumber,observedHead;
    try{blockNumber=exactUint(evidence.block_number);observedHead=exactUint(evidence.observed_head_block)}catch{return fail(record,'BLOCK_IDENTITY_MISSING')}
    const blockHash=String(evidence.block_hash||'').toLowerCase();
    if(blockNumber<=0n||!TX.test(blockHash))return fail(record,'BLOCK_IDENTITY_MISSING');
    if(observedHead<blockNumber)return fail(record,'FINALITY_REQUIRED',{reason:'HEAD_BEFORE_RECEIPT_BLOCK'});
    const confirmations=observedHead-blockNumber+1n;
    if(confirmations<BigInt(record.required_confirmations))return fail(record,'FINALITY_REQUIRED',{required:String(record.required_confirmations),observed:confirmations.toString()});

    const transfer=evidence.transfer||{};
    let transferBlock,logIndex;
    try{transferBlock=exactUint(transfer.block_number);logIndex=exactUint(transfer.log_index)}catch{return fail(record,'LOG_IDENTITY_MISSING')}
    if(
      transferBlock!==blockNumber||
      String(transfer.block_hash||'').toLowerCase()!==blockHash||
      String(transfer.transaction_hash||'').toLowerCase()!==record.transaction_hash||
      String(transfer.event_signature||'').toLowerCase()!==TRANSFER_TOPIC
    )return fail(record,'LOG_IDENTITY_MISSING');
    if(!eqAddr(transfer.token,record.KAIOS_token_address)||!eqAddr(transfer.from,record.sender)||!eqAddr(transfer.to,record.receiver_contract_or_escrow_address))
      return fail(record,'WRONG_RECEIVER',{transfer});
    let amount;try{amount=exactString(transfer.amount)}catch{return fail(record,'INVALID_EXACT_AMOUNT',{field:'transfer.amount'})}
    if(amount!==record.authorized_amount)return fail(record,'AMOUNT_MISMATCH',{expected:record.authorized_amount,received:amount});

    let committed;
    try{committed=replayRegistry.commit(Object.freeze({...replayBinding(),reservation_id:record.replay_reservation_id,transaction_hash:record.transaction_hash,block_number:blockNumber.toString(),block_hash:blockHash,log_index:logIndex.toString()}))}
    catch{return fail(record,'REPLAY_REGISTRY_UNAVAILABLE',{operation:'commit'})}
    if(!committed||committed.ok!==true||committed.status!=='COMMITTED')return fail(record,'REPLAY_BLOCKED',{registry_status:committed?.status||'INVALID_RESPONSE'});

    record.replay_reservation_status='COMMITTED';record.received_amount=amount;record.block_number=blockNumber.toString();record.block_hash=blockHash;
    record.transfer_log_index=logIndex.toString();record.observed_head_block=observedHead.toString();record.confirmations=confirmations.toString();
    record.receipt_status='FOUND_STRUCTURALLY_VERIFIED_CHAIN_IDENTITY_NOT_INDEPENDENT_RPC_AUTHORITY';record._verifiedReceipt=clone(evidence);record._usedReplayKeys.add(record.replay_key);
    advance(record,'RECEIPT_FOUND');journal(record,'RECEIPT_CHAIN_IDENTITY_VERIFIED',{block_number:record.block_number,block_hash:record.block_hash,log_index:record.transfer_log_index,confirmations:record.confirmations,amount});
    return {ok:true,snapshot:snapshot(record)};
  }
  async function verifyReceiptFromIndependentSource(){
    if(!receiptVerifierReady)return fail(record,'INDEPENDENT_RECEIPT_VERIFIER_NOT_CONNECTED');
    if(record.delivery_status!=='TX_PENDING')return fail(record,'DELIVERY_REJECTED',{reason:'WRONG_STATE'});
    let evidence;
    try{evidence=await receiptVerifier.verify({transaction_hash:record.transaction_hash,token:record.KAIOS_token_address,sender:record.sender,receiver:record.receiver_contract_or_escrow_address,amount:record.authorized_amount})}
    catch(error){return fail(record,'INDEPENDENT_RECEIPT_VERIFICATION_FAILED',{reason:String(error?.message||error)})}
    const verified=verifyReceiptEvidence(evidence);
    if(!verified.ok)return verified;
    record.receipt_evidence_authority='INDEPENDENT_RPC_RECEIPT_VERIFIER';record.receipt_status='FOUND_INDEPENDENTLY_VERIFIED';
    journal(record,'INDEPENDENT_RECEIPT_VERIFIED',{receipt_verifier_id:record.receipt_verifier_id,provider_agreement_count:evidence.provider_agreement_count||null});
    return {ok:true,status:'INDEPENDENT_RECEIPT_VERIFIED',balance_evidence:{token_balance_before:evidence.token_balance_before,token_balance_after:evidence.token_balance_after},snapshot:snapshot(record)};
  }
  function reconcileBalance({token_balance_before,token_balance_after}={}){
    if(record.delivery_status!=='RECEIPT_FOUND')return fail(record,'RECONCILIATION_REQUIRED',{reason:'RECEIPT_NOT_READY'});
    let before,after;try{before=exactUint(token_balance_before);after=exactUint(token_balance_after)}catch{return fail(record,'INVALID_EXACT_AMOUNT',{field:'balance'})}
    if(after<before||after-before!==exactUint(record.received_amount))return fail(record,'RECONCILIATION_REQUIRED',{before:before.toString(),after:after.toString(),expectedDelta:record.received_amount});
    record.token_balance_before=before.toString();record.token_balance_after=after.toString();record.accounting_status='BALANCE_RECONCILED';advance(record,'BALANCE_RECONCILED');
    journal(record,'BALANCE_RECONCILED',{before:record.token_balance_before,after:record.token_balance_after,delta:(after-before).toString()});return {ok:true,snapshot:snapshot(record)};
  }
  function markArrived(){if(record.delivery_status!=='BALANCE_RECONCILED')return fail(record,'RECONCILIATION_REQUIRED');advance(record,'ARRIVED_AT_11520');journal(record,'ARRIVED_AT_11520');return {ok:true,snapshot:snapshot(record)}}
  function acceptAtmInventory({accepted=true}={}){
    if(record.delivery_status!=='ARRIVED_AT_11520')return fail(record,'DELIVERY_REJECTED',{reason:'NOT_ARRIVED'});
    if(accepted!==true)return fail(record,'DELIVERY_REJECTED',{reason:'RECEIVER_REJECTED'});
    record.receiver_acceptance=true;record.available_ATM_inventory=record.received_amount;record.accounting_status='RESTRICTED_INVENTORY_WITH_MATCHING_LIABILITY';advance(record,'ATM_INVENTORY_ACCEPTED');journal(record,'ATM_INVENTORY_ACCEPTED',{amount:record.available_ATM_inventory});
    return {ok:true,snapshot:snapshot(record)};
  }
  function markDelivered({gas_cost_bnb=0,delivery_cost='0',freight_fee_evidence=false}={}){
    if(record.delivery_status!=='ATM_INVENTORY_ACCEPTED'||!record.receiver_acceptance)return fail(record,'DELIVERY_REJECTED',{reason:'ATM_NOT_ACCEPTED'});
    let cost;try{cost=exactUint(delivery_cost)}catch{return fail(record,'INVALID_EXACT_AMOUNT',{field:'delivery_cost'})}
    const callerRevenueClaim=freight_fee_evidence===true;
    record.gas_cost_bnb=Math.max(0,finite(gas_cost_bnb));record.delivery_cost=cost.toString();
    record.freight_fee_revenue='0';
    record.freight_fee_revenue_status=record.freight_fee==='0'?'NO_FREIGHT_FEE':'UNVERIFIED_NO_INDEPENDENT_ACCOUNTING_EVIDENCE';
    record.freight_fee_revenue_authority='NONE_CONNECTED';
    record.net_profit=exactSub(record.freight_fee_revenue,record.delivery_cost);
    advance(record,'DELIVERED');journal(record,'DELIVERED',{freight_fee_revenue:record.freight_fee_revenue,freight_fee_revenue_status:record.freight_fee_revenue_status,freight_fee_revenue_authority:record.freight_fee_revenue_authority,caller_freight_fee_evidence_ignored:callerRevenueClaim,delivery_cost:record.delivery_cost,gas_cost_bnb:record.gas_cost_bnb});
    return {ok:true,snapshot:snapshot(record)};
  }
  return {registerCargo,authorizeExactReceiver,noteExternalTransaction,verifyReceiptEvidence,verifyReceiptFromIndependentSource,reconcileBalance,markArrived,acceptAtmInventory,markDelivered,snapshot:()=>snapshot(record),journal:()=>record._journal.map(clone)};
}

export function snapshot(record){
  const out={};for(const [k,v] of Object.entries(record)){if(!k.startsWith('_'))out[k]=v}
  const configured=record.receiver_contract_or_escrow_address&&record.KAIOS_token_address&&record.custody_policy_id&&record.receipt_verifier_id&&record.required_confirmations&&record.replay_registry_id;
  out.real_receiving_gate=configured?(record.receipt_evidence_authority==='INDEPENDENT_RPC_RECEIPT_VERIFIER'?'READY_INDEPENDENT_RPC_VERIFICATION':'CONFIGURED_STRUCTURAL_VERIFICATION_ONLY'):'NOT_DEPLOYED';
  out.mainnet_write_executed=false;return clone(out);
}
