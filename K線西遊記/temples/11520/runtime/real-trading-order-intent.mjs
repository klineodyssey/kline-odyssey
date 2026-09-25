/* KGEN_META
VERSION: 1.0.0
STATUS: CANDIDATE
PURPOSE: Build unsigned, non-broadcast 11520 real-trading order intents from fixed axis/market bindings.
*/
import {assertRealTradingAxisMarket,realTradingEligibility} from './real-trading-market-binding.mjs';
import {normalizeSignedC,signedPositionSide,requiredMargin,liquidationMark,placeSimulationOrder,
  observeSimulationPrice,closeSimulationPosition,cancelSimulationOrder,simulationSnapshot} from './kgen-margin-runtime.mjs';

function finitePositive(value,label){const n=Number(value);if(!Number.isFinite(n)||n<=0)throw new Error(`${label}_MUST_BE_POSITIVE`);return n}
function integerRange(value,label,min,max){const n=Number(value);if(!Number.isInteger(n)||n<min||n>max)throw new Error(`${label}_OUT_OF_RANGE`);return n}
function normalizeAddress(value,label){const v=String(value??'');if(!/^0x[0-9a-fA-F]{40}$/.test(v))throw new Error(`${label}_INVALID`);return v}

// One order vocabulary for the game. Wallet identity is optional for simulation;
// neither a connected account nor a browser quote grants on-chain authority.
export function buildExecutionOrderIntent({axis,market,c,side,lots,currentPrice,price,triggerPrice,
  stopPrice=null,takeProfitPrice=null,now=Date.now()}={}){
  const binding=assertRealTradingAxisMarket({axis,market});
  const signedC=normalizeSignedC(c),direction=signedPositionSide(signedC,side);
  const quantity=integerRange(lots,'LOTS',1,100);
  const observedPrice=finitePositive(currentPrice??price,'PRICE');
  const trigger=finitePositive(triggerPrice,'TRIGGER_PRICE');
  const createdAt=Number(now);
  if(!Number.isSafeInteger(createdAt)||createdAt<0)throw new Error('INVALID_TIMESTAMP');
  const stop=stopPrice==null?null:finitePositive(stopPrice,'STOP_PRICE');
  const takeProfit=takeProfitPrice==null?null:finitePositive(takeProfitPrice,'TAKE_PROFIT_PRICE');
  if(stop!==null&&(signedC>0?stop>=trigger:stop<=trigger))throw new Error('INVALID_STOP_DIRECTION');
  if(takeProfit!==null&&(signedC>0?takeProfit<=trigger:takeProfit>=trigger))throw new Error('INVALID_TP_DIRECTION');
  return Object.freeze({schema:'KAIOS_11520_EXECUTION_ORDER_INTENT_V1',axis:binding.axis,
    market:binding.market,contractMarket:binding.contractMarket,side:direction,c:signedC,
    leverage:Math.abs(signedC),lots:quantity,currentPrice:observedPrice,triggerPrice:trigger,
    stopPrice:stop,takeProfitPrice:takeProfit,now:createdAt});
}

export const EXECUTION_FAILURE_STATES=Object.freeze(['USER_REJECTED','WRONG_CHAIN','DISCONNECTED',
  'INSUFFICIENT_BALANCE','INSUFFICIENT_MARGIN','ORACLE_STALE','ORDER_REJECTED',
  'TX_REVERTED','TX_DROPPED','RECEIPT_TIMEOUT']);

export function normalizeExecutionError(error){
  const rawCode=error?.code,reason=String(error?.reason??error?.message??error??'ORDER_REJECTED');
  if(EXECUTION_FAILURE_STATES.includes(rawCode))return rawCode;
  if(EXECUTION_FAILURE_STATES.includes(reason))return reason;
  if(Number(rawCode)===4001||rawCode==='ACTION_REJECTED')return 'USER_REJECTED';
  if(Number(rawCode)===4901||/CHAIN_MISMATCH|WRONG_CHAIN/.test(reason))return 'WRONG_CHAIN';
  if(Number(rawCode)===4900||/DISCONNECTED|WALLET_NOT_CONNECTED/.test(reason))return 'DISCONNECTED';
  if(/INSUFFICIENT_FREE_KGEN|INSUFFICIENT_MARGIN/.test(reason))return 'INSUFFICIENT_MARGIN';
  if(rawCode==='INSUFFICIENT_FUNDS'||/INSUFFICIENT_BALANCE/.test(reason))return 'INSUFFICIENT_BALANCE';
  if(/STALE_PRICE|OUT_OF_ORDER_PRICE|ORACLE_STALE/.test(reason))return 'ORACLE_STALE';
  if(rawCode==='CALL_EXCEPTION'||/TX_REVERTED/.test(reason))return 'TX_REVERTED';
  if(rawCode==='TRANSACTION_REPLACED'||/TX_DROPPED/.test(reason))return 'TX_DROPPED';
  if(rawCode==='TIMEOUT'||/RECEIPT_TIMEOUT/.test(reason))return 'RECEIPT_TIMEOUT';
  return 'ORDER_REJECTED';
}

function executionFailure(error){
  const code=normalizeExecutionError(error),raw=String(error?.reason??error?.message??error??code);
  // UI receives a bounded reason code, never an opaque provider payload/secret.
  return {ok:false,code,reason:/^[A-Z][A-Z0-9_]{0,95}$/.test(raw)?raw:code};
}

// EVM_ADAPTER is deliberately a disabled seam until a separately reviewed,
// authorized deployment/receipt adapter exists. Flags or injected callbacks in
// page storage must never turn this release into a signer/broadcast path.
export function createExecutionAdapter({ledger,deployment=null,wallet=null}={}){
  void wallet; // Connecting a read-only wallet does not switch execution mode.
  const requestedMode=deployment?.mode??'SIMULATION';
  if(requestedMode!=='SIMULATION'){
    const blocked=()=>executionFailure(new Error('EVM_ADAPTER_NOT_DEPLOYED_OR_AUTHORIZED'));
    return Object.freeze({name:'EVM_ADAPTER',mode:'ON_CHAIN',enabled:false,
      preview:blocked,submit:blocked,observe:blocked,close:blocked,cancel:blocked,
      snapshot:()=>({mode:'ON_CHAIN',status:'NOT_DEPLOYED_OR_AUTHORIZED',wallet:null,
        orders:[],positions:[],receipts:[],observations:{}})});
  }
  if(!ledger||typeof ledger!=='object')throw new Error('EXISTING_LEDGER_REQUIRED');
  const run=(fn)=>{try{const result=fn();return result.ok?{...result,executionMode:'SIMULATION'}:executionFailure(result)}catch(error){return executionFailure(error)}};
  const preview=(input,{now=Date.now()}={})=>run(()=>{
    const intent=buildExecutionOrderIntent({...input,now}),book=simulationSnapshot(ledger);
    const quote=book.observations[intent.market];
    if(!quote||now<quote.at||now-quote.at>15000)throw new Error('STALE_PRICE');
    if(book.orders.some(o=>o.axis===intent.axis&&o.status==='PENDING')||book.positions.some(p=>p.axis===intent.axis&&p.status==='OPEN'))throw new Error('AXIS_ALREADY_ACTIVE');
    const margin=requiredMargin(intent),available=book.wallet.free;
    if(!Number.isFinite(available)||available<margin)throw new Error('INSUFFICIENT_FREE_KGEN');
    return {ok:true,...intent,intent,requiredMargin:margin,available,
      estimatedLiquidationPrice:Math.max(0,liquidationMark({entry:intent.triggerPrice,c:intent.c,side:intent.side})),
      liquidationModel:'SIMULATION_ISOLATED_ZERO_MAINTENANCE_NO_FEES',
      currentPrice:quote.price,priceObservedAt:quote.at,executionMode:'SIMULATION'};
  });
  return Object.freeze({name:'SIMULATION_ADAPTER',mode:'SIMULATION',enabled:true,preview,
    submit:(input,{now=Date.now()}={})=>run(()=>{
      const checked=preview(input,{now});if(!checked.ok)return checked;
      const result=placeSimulationOrder(ledger,checked.intent);
      return result.ok?{...result,status:'PENDING_TRIGGER'}:result;
    }),
    observe:(observation)=>run(()=>observeSimulationPrice(ledger,observation)),
    close:(positionId,options)=>run(()=>closeSimulationPosition(ledger,positionId,options)),
    cancel:(orderId)=>run(()=>cancelSimulationOrder(ledger,orderId)),
    snapshot:()=>simulationSnapshot(ledger)});
}

export function buildRealTradingOrderIntent({
  axis,market,chainId=56,side,lots,c,price,
  walletAddress,brainAddress,positionEngineAddress,
  feedProvenanceVerified=false,humanMainnetAuthorization=false
}={}){
  const binding=assertRealTradingAxisMarket({axis,market,chainId});
  const trader=normalizeAddress(walletAddress,'WALLET_ADDRESS');
  const eligibility=realTradingEligibility({axis,market,chainId,feedProvenanceVerified,brainAddress,positionEngineAddress,humanMainnetAuthorization});
  if(!eligibility.eligible)throw new Error(`REAL_TRADING_BLOCKED:${eligibility.blockers.join(',')}`);
  const normalizedLots=integerRange(lots,'LOTS',1,100);
  const signedC=normalizeSignedC(c),leverage=Math.abs(signedC);
  const observedPrice=finitePositive(price,'PRICE');
  const direction=signedPositionSide(signedC,side);
  return Object.freeze({
    schema:'KAIOS_11520_REAL_TRADING_ORDER_INTENT_V1',
    axis:binding.axis,market:binding.market,contractMarket:binding.contractMarket,chainId:binding.chainId,
    trader,side:direction,lots:normalizedLots,c:signedC,leverage,
    observedPrice,
    brainAddress:normalizeAddress(brainAddress,'BRAIN_ADDRESS'),
    positionEngineAddress:normalizeAddress(positionEngineAddress,'POSITION_ENGINE_ADDRESS'),
    transactionPayload:null,calldata:null,signerRequested:false,broadcast:false,
    status:'READY_FOR_EXPLICIT_WALLET_ACTION_NOT_SUBMITTED'
  });
}
