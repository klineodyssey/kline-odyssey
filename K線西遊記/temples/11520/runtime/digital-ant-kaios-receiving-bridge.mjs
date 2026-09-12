/* KGEN_META
VERSION: 1.0.1
STATUS: ACTIVE
PURPOSE: Bridge DIGITAL_ANT_0001 Market Life visualization to the read-only 11520 KAIOS ATM receiving state machine without signing or fabricating settlement.
*/

import {createKaiosAtmReceivingModule,validateRouteEvidence} from './kaios-atm-receiving-runtime.mjs';
import {publishDigitalAntSpawn,publishDigitalAntUpdate} from './digital-ant-market-life-adapter.mjs';

export const DIGITAL_ANT_KAIOS_RECEIVING_BRIDGE_VERSION='DIGITAL_ANT_KAIOS_RECEIVING_BRIDGE_V1';
export const DIGITAL_ANT_11520_CARGO=Object.freeze({
  lifeId:'DIGITAL_ANT_0001',
  sender:'0xc8346d6DC80f16941ee874D523f0C17F1548d437',
  amount:1080000,
  sourceTx:'0x101cc5df545d8228d40637f393ac184d531c49dc91bfa3c425284fc321758d95',
  source:'18888 Lingxiao Bank Proxy',
  accounting:'RESTRICTED_INVENTORY_WITH_MATCHING_LIABILITY',
});

const GAME_ACTION_BY_STATE=Object.freeze({
  CARGO_REGISTERED:'LOAD',AWAITING_EXACT_AUTHORIZATION:'WAIT',READY_FOR_DISPATCH:'DEPART',TX_PENDING:'TRAVEL',
  RECEIPT_FOUND:'WAIT',BALANCE_RECONCILED:'ARRIVE',ARRIVED_AT_11520:'ARRIVE',ATM_INVENTORY_ACCEPTED:'DELIVER',DELIVERED:'DELIVER',
});

export function createDigitalAntKaiosReceivingBridge(config={}){
  const receiving=createKaiosAtmReceivingModule(config);
  const ant={
    lifeId:DIGITAL_ANT_11520_CARGO.lifeId,name:'Digital Ant 0001',species:'DIGITAL_ANT',role:'ATM_CASH_DELIVERY',
    state:'WAIT',x:0,y:0,z:0,capital:0,vitality:100,
    cargo:{cargoId:config.cargo_manifest_id||'KAIOS-11520-DIGITAL-ANT-0001',amount:DIGITAL_ANT_11520_CARGO.amount,unit:'KAIOS',sourceTx:DIGITAL_ANT_11520_CARGO.sourceTx},
    mission:{status:'AWAITING_EXACT_AUTHORIZATION',route:null},
  };
  function syncVisual({spawn=false,stateOverride=null,missionStatusOverride=null}={}){
    const s=receiving.snapshot();ant.state=stateOverride||GAME_ACTION_BY_STATE[s.delivery_status]||'WAIT';ant.mission={...ant.mission,status:missionStatusOverride||s.delivery_status,settlementMode:s.real_receiving_gate==='CONFIGURED'?'CHAIN_EVIDENCE_REQUIRED':'SIMULATION_BLOCKED',deliveryStatus:s.delivery_status,receiptStatus:s.receipt_status,receiverAcceptance:s.receiver_acceptance};
    const options={axis:'KY',market:'KAIOS_ATM_LOGISTICS',side:1,lots:1,c:0,mission:ant.mission,route:ant.mission.route};
    return spawn?publishDigitalAntSpawn(ant,options):publishDigitalAntUpdate(ant,options);
  }
  function registerCargo(extra={}){
    const manifest={cargo_manifest_id:extra.cargo_manifest_id||ant.cargo.cargoId,sender:DIGITAL_ANT_11520_CARGO.sender,authorized_amount:DIGITAL_ANT_11520_CARGO.amount,freight_fee:extra.freight_fee||0,purpose_hash:extra.purpose_hash||`KAIOS_11520_ATM:${DIGITAL_ANT_11520_CARGO.sourceTx}`,replay_key:extra.replay_key||DIGITAL_ANT_11520_CARGO.sourceTx,valid_from:extra.valid_from||null,expires_at:extra.expires_at||null};
    const out=receiving.registerCargo(manifest);syncVisual({spawn:true});return out;
  }
  function setRoute(route={}){
    const proof=validateRouteEvidence(route);if(!proof.ok){ant.mission={...ant.mission,route};syncVisual({stateOverride:'REJECT',missionStatusOverride:proof.status});return proof}
    ant.mission={...ant.mission,route:{...route,proof}};syncVisual();return {ok:true,proof};
  }
  function authorize(){const out=receiving.authorizeExactReceiver();syncVisual();return out}
  function noteExternalTransaction(txHash){const out=receiving.noteExternalTransaction(txHash);syncVisual();return out}
  function consumeReceipt(evidence){const out=receiving.verifyReceiptEvidence(evidence);syncVisual();return out}
  function reconcile(balanceEvidence){const out=receiving.reconcileBalance(balanceEvidence);syncVisual();return out}
  function arrive(){const out=receiving.markArrived();syncVisual();return out}
  function acceptInventory(input){const out=receiving.acceptAtmInventory(input);syncVisual();return out}
  function deliver(accountingEvidence){const out=receiving.markDelivered(accountingEvidence);syncVisual();return out}
  return {ant,receiving,registerCargo,setRoute,authorize,noteExternalTransaction,consumeReceipt,reconcile,arrive,acceptInventory,deliver,syncVisual,snapshot:()=>({bridgeVersion:DIGITAL_ANT_KAIOS_RECEIVING_BRIDGE_VERSION,ant:{...ant},receiving:receiving.snapshot()})};
}

export function installDigitalAntKaiosReceivingBridge(config={}){
  if(globalThis.__K11520_DIGITAL_ANT_KAIOS_RECEIVING__)return globalThis.__K11520_DIGITAL_ANT_KAIOS_RECEIVING__;
  const bridge=createDigitalAntKaiosReceivingBridge(config);
  globalThis.__K11520_DIGITAL_ANT_KAIOS_RECEIVING__=bridge;
  globalThis.__K11520_KAIOS_ATM_RECEIVING_GATE__=bridge.receiving.snapshot();
  return bridge;
}
