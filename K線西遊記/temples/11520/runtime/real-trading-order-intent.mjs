/* KGEN_META
VERSION: 1.0.0
REVISION: 2026-10-09.PUBLIC-SIM-FEED-ADMISSION
PRODUCT_CONTEXT: V2.9.5
STATUS: CANDIDATE
LAST_UPDATED: 2026-10-09
UPDATED_BY: Codex / delegated implementation / HUMAN_AUTHORIZED_2026_10_09
REVIEWED_BY: PENDING_DIFFERENT_TECHNICAL_REVIEW / required before merge
SOURCE_COMMIT: b39c16e5cc5f2409590d62fa9a53b5ceb3750300
TASK_ID: K11520-PUBLIC-FREE-SIM-FEED-20261009
CHANGE_REASON: Stop SIMULATION price-dependent transitions on UNKNOWN, STALE or FAILED public quality while preserving existing positions, margin, receipts and cancel/exploration behavior.
ANCESTOR: K線西遊記/temples/11520/runtime/real-trading-order-intent.mjs @ c35320c6f95ea9411fd9e5f3ad295599f029a3ae
SOURCE_OF_TRUTH: TRUE
PURPOSE: Build unsigned, non-broadcast 11520 real-trading order intents from fixed axis/market bindings.
*/
import {assertRealTradingAxisMarket,realTradingEligibility} from './real-trading-market-binding.mjs';
import {deterministicSimulationObservation,SIMULATION_PRICE_SOURCE,PUBLIC_MARKET_SYMBOLS,
  PUBLIC_MARKET_QUOTE_SOURCE,publicMarketQuoteSetStatus} from './public-market-quotes.mjs';
import {requireV1TradingC} from '../controls/nonlinear-controls.mjs';
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
export function createExecutionAdapter({ledger,deployment=null,wallet=null,ethereum=null,ethers=null,...options}={}){
  if(deployment?.mode==='BSC_TESTNET')return createTestnetExecutionAdapter({deployment,ethereum:ethereum??wallet?.provider,ethers,...options});
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
  const run=(fn,mutating=false)=>{try{if(mutating)options.beforeMutation?.();const result=fn();if(result.ok&&mutating)options.afterMutation?.();return result.ok?{...result,executionMode:'SIMULATION'}:executionFailure(result)}catch(error){return executionFailure(error)}};
  const fallback=options.simulationFallback===true;
  let publicMarketQuality=publicMarketQuoteSetStatus(null,{symbols:PUBLIC_MARKET_SYMBOLS});
  const updatePublicMarketQuality=(observations,{now=Date.now()}={})=>{
    publicMarketQuality=publicMarketQuoteSetStatus(observations,{symbols:PUBLIC_MARKET_SYMBOLS,now});
    return publicMarketQuality;
  };
  const currentPublicMarketQuality=now=>publicMarketQuoteSetStatus(publicMarketQuality.rows,{symbols:PUBLIC_MARKET_SYMBOLS,now});
  const priceTransitionBlock=now=>{
    if(!fallback)return null;
    const state=currentPublicMarketQuality(now);
    if(state.allowsPriceTransitions)return null;
    return {ok:false,code:'ORACLE_STALE',reason:`PUBLIC_QUOTE_${state.quality}`,quoteQuality:state.quality,
      priceTransitions:false,events:[],executionMode:'SIMULATION'};
  };
  const quote=(market,{now=Date.now(),book=simulationSnapshot(ledger)}={})=>{
    const previous=book.observations[market],pending=book.orders.filter(o=>o.market===market&&o.status==='PENDING'),open=book.positions.filter(p=>p.market===market&&p.status==='OPEN'),active=pending.length>0||open.length>0;
    const pinned=pending.some(o=>(o.executionPriceSource||o.priceSource)===SIMULATION_PRICE_SOURCE)||open.some(p=>p.priceSource===SIMULATION_PRICE_SOURCE);
    if((!previous&&active)||(pinned&&previous?.source!==SIMULATION_PRICE_SOURCE))throw new Error('SIMULATION_RECOVERY_REQUIRED');
    if(previous&&(!Number.isFinite(previous.price)||previous.price<=0||!Number.isSafeInteger(previous.at)||previous.at<0))throw new Error(active?'SIMULATION_RECOVERY_REQUIRED':'INVALID_SIMULATION_SOURCE');
    if(fallback&&previous?.source===SIMULATION_PRICE_SOURCE){
      try{return deterministicSimulationObservation({market,previous,now})}catch(error){if(active)throw new Error('SIMULATION_RECOVERY_REQUIRED');throw error}
    }
    return previous;
  };
  const applyQuote=(target,market,now)=>{
    const book=simulationSnapshot(target),selected=quote(market,{now,book});
    if(!selected||selected.source!==SIMULATION_PRICE_SOURCE||selected.at===book.observations[market]?.at)return {ok:true,events:[]};
    return observeSimulationPrice(target,{...selected,observedAt:selected.at,now,productV1:options.productV1===true});
  };
  const preview=(input,{now=Date.now()}={})=>priceTransitionBlock(now)||run(()=>{
    if(options.productV1)requireV1TradingC(input.c);
    const selected=quote(input.market,{now}),intent=buildExecutionOrderIntent({...input,...(fallback?{currentPrice:selected?.price}:{}),now}),book=simulationSnapshot(ledger);
    if(!selected||now<selected.at||now-selected.at>15000)throw new Error('STALE_PRICE');
    if(book.orders.some(o=>o.axis===intent.axis&&o.status==='PENDING')||book.positions.some(p=>p.axis===intent.axis&&p.status==='OPEN'))throw new Error('AXIS_ALREADY_ACTIVE');
    const margin=requiredMargin(intent),available=book.wallet.free;
    if(!Number.isFinite(available)||available<margin)throw new Error('INSUFFICIENT_FREE_KGEN');
    return {ok:true,...intent,intent,requiredMargin:margin,available,
      estimatedLiquidationPrice:Math.max(0,liquidationMark({entry:intent.triggerPrice,c:intent.c,side:intent.side})),
      pnlModel:'INDEX_DELTA_C_LOTS_V1',liquidationModel:'SIMULATION_ISOLATED_ZERO_MAINTENANCE_NO_FEES',
      currentPrice:selected.price,priceObservedAt:selected.at,priceSource:selected.source||'SIMULATION_OBSERVATION',simulationOnly:true,executionMode:'SIMULATION'};
  });
  return Object.freeze({name:'SIMULATION_ADAPTER',mode:'SIMULATION',enabled:true,preview,quote,
    updatePublicMarketQuality,publicMarketStatus:({now=Date.now()}={})=>currentPublicMarketQuality(now),
    submit:(input,{now=Date.now()}={})=>priceTransitionBlock(now)||run(()=>{
      const checked=preview(input,{now});if(!checked.ok)return checked;
      const draft=structuredClone(ledger),observation=applyQuote(draft,checked.market,now);if(!observation.ok)return observation;
      const result=placeSimulationOrder(draft,checked.intent);
      if(result.ok)Object.assign(ledger,draft);
      return result.ok?{...result,status:'PENDING_TRIGGER'}:result;
    },true),
    observe:(observation)=>priceTransitionBlock(observation?.now??Date.now())||run(()=>{
      // Once local fallback is selected, public recovery cannot jump a pending
      // order/open position to another source, including after wallet reload.
      if(fallback){
        const expected=currentPublicMarketQuality(observation?.now??Date.now()).rows[observation.market];
        if(observation.source!==PUBLIC_MARKET_QUOTE_SOURCE.id||expected?.source!==observation.source||
          expected?.updatedAt!==observation.observedAt||expected?.sequence!==observation.sequence||expected?.price!==observation.price)return {ok:false,reason:'PUBLIC_QUOTE_ADMISSION_MISMATCH'};
        const book=simulationSnapshot(ledger);quote(observation.market,{now:observation.now??Date.now(),book});
        if(book.observations[observation.market]?.source===SIMULATION_PRICE_SOURCE)return {ok:true,ignored:true,events:[]};
      }
      if(observation.source===SIMULATION_PRICE_SOURCE)return {ok:false,reason:'SIMULATION_SOURCE_REQUIRES_LOCAL_CLOCK'};
      return observeSimulationPrice(ledger,{...observation,productV1:options.productV1===true});
    },true),
    tick:({now=Date.now()}={})=>priceTransitionBlock(now)||run(()=>{
      if(!fallback)return {ok:true,events:[]};
      const draft=structuredClone(ledger),events=[];
      for(const market of ['BTCUSDT','ETHUSDT','BNBUSDT']){const r=applyQuote(draft,market,now);if(!r.ok)return r;events.push(...r.events)}
      Object.assign(ledger,draft);return {ok:true,events};
    },true),
    close:(positionId,{now=Date.now()}={})=>priceTransitionBlock(now)||run(()=>{
      const draft=structuredClone(ledger),position=simulationSnapshot(draft).positions.find(p=>p.positionId===positionId);
      if(position?.status==='OPEN'){const advanced=applyQuote(draft,position.market,now);if(!advanced.ok)return advanced;
        const settled=advanced.events.find(r=>r.positionId===positionId&&r.kind==='SETTLEMENT');if(settled){Object.assign(ledger,draft);return {ok:true,receipt:settled};}}
      const result=closeSimulationPosition(draft,positionId,{now});if(result.ok)Object.assign(ledger,draft);return result;
    },true),
    cancel:(orderId)=>run(()=>cancelSimulationOrder(ledger,orderId),true),
    snapshot:()=>simulationSnapshot(ledger)});
}

export function assertRealExecutionPriceSource({priceSource,source,simulationOnly,quoteState}={}){
  if(simulationOnly===true||[priceSource,source].some(value=>typeof value==='string'&&/SIMULATION/.test(value)))throw new Error('SIMULATION_PRICE_NOT_REAL');
  if(quoteState!==undefined&&quoteState!=='LIVE')throw new Error('REAL_QUOTE_NOT_LIVE');
}

export function buildRealTradingOrderIntent({
  axis,market,chainId=56,side,lots,c,price,
  walletAddress,brainAddress,positionEngineAddress,
  feedProvenanceVerified=false,humanMainnetAuthorization=false,priceSource,source,simulationOnly,quoteState
}={}){
  assertRealExecutionPriceSource({priceSource,source,simulationOnly,quoteState});
  const binding=assertRealTradingAxisMarket({axis,market,chainId});
  const trader=normalizeAddress(walletAddress,'WALLET_ADDRESS');
  const eligibility=realTradingEligibility({axis,market,chainId,feedProvenanceVerified,brainAddress,positionEngineAddress,humanMainnetAuthorization});
  if(!eligibility.eligible)throw new Error(`REAL_TRADING_BLOCKED:${eligibility.blockers.join(',')}`);
  const normalizedLots=integerRange(lots,'LOTS',1,100);
  const signedC=requireV1TradingC(normalizeSignedC(c)),leverage=Math.abs(signedC);
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

// ABI fragments are the existing reviewed organs, not a second settlement engine.
export const TESTNET_EXECUTION_ABI=Object.freeze({
  testToken:['function balanceOf(address) view returns(uint256)','function decimals() view returns(uint8)',
    'function allowance(address,address) view returns(uint256)','function approve(address,uint256) returns(bool)','function faucet()',
    'event Approval(address indexed owner,address indexed spender,uint256 value)',
    'event Transfer(address indexed from,address indexed to,uint256 value)'],
  brainProxy:['function kgen() view returns(address)','function principalOf(address) view returns(uint256)',
    'function lockedPrincipalOf(address) view returns(uint256)','function availablePrincipal(address) view returns(uint256)',
    'function SETTLEMENT_ROLE() view returns(bytes32)','function hasRole(bytes32,address) view returns(bool)',
    'function depositMargin(uint256) returns(uint256)','function withdrawMargin(uint256)',
    'event MarginDeposited(address indexed user,uint256 requestedWei,uint256 receivedWei)',
    'event MarginWithdrawn(address indexed user,uint256 amountWei)'],
  orderTriggerEngine:['function brain() view returns(address)','function engine() view returns(address)','function nextOrderId() view returns(uint256)',
    'function createOrder(uint8,int256,uint256,uint256) returns(uint256)','function cancelOrder(uint256)',
    'function closePosition(uint256)',
    'function order(uint256) view returns(tuple(uint256 orderId,address trader,uint8 market,int256 c,uint256 lots,uint256 triggerPrice,uint256 createdAt,uint256 triggeredAt,uint256 observedPrice,uint256 fillPrice,uint256 positionId,uint8 status,uint256 previousPrice,uint256 observedAt,uint256 observationSequence))',
    'function fillReceipt(uint256) view returns(tuple(uint256 orderId,uint256 positionId,address trader,uint8 market,int256 c,uint256 lots,uint256 createdAt,uint256 triggeredAt,uint256 previousPrice,uint256 triggerPrice,uint256 observedPrice,uint256 fillPrice,uint256 walletBefore,uint256 marginLocked,uint256 walletAfter,int8 side,uint256 observationSequence))',
    'event OrderCreated(uint256 indexed orderId,address indexed trader)',
    'event OrderFilled(uint256 indexed orderId,uint256 indexed positionId,uint256 price)',
    'event OrderTerminated(uint256 indexed orderId,uint8 status)'],
  positionEngine:['function brainSettlement() view returns(address)','function executor() view returns(address)',
    'function readMarketPrice(uint8) view returns(uint256 priceWad,uint256 observedAt,uint8 validSources)',
    'function marketConfig(uint8) view returns(uint16 initialMarginBps,uint16 maintenanceMarginBps,uint32 maxOracleAge,uint256 minPriceWad,uint256 maxPriceWad,bool enabled)',
    'function positionSnapshot(uint256) view returns(tuple(address trader,uint8 market,int256 sizeWad,uint256 collateralWad,uint256 entryPriceWad,uint64 openedAt,uint64 closedAt,uint256 exitPriceWad,int256 rawPnlWad,int256 realizedPnlWad,uint256 badDebtWad,uint8 status))',
    'function orderTerms(uint256) view returns(uint256 orderId,int256 cWad,uint256 lots,uint256 lastPrice,uint256 observedAt,uint256 observationSequence)',
    'function liquidationBoundary(uint256) view returns(uint256)',
    'function markPosition(uint256) view returns(int256 unrealizedPnlWad,int256 equityWad,uint256 maintenanceMarginWad,bool liquidatable)',
    'function settlementReceipt(uint256) view returns(tuple(uint256 positionId,uint256 orderId,uint8 market,int256 cWad,uint256 lots,uint256 entryPrice,uint256 liquidationTrigger,uint256 previousPrice,uint256 observedPrice,uint256 observedAt,uint256 settledAt,uint256 marginBefore,uint256 marginAfter,int256 rawPnl,int256 realizedPnl,uint256 badDebt,uint8 status,address trader,int8 side,uint256 settlementPrice,uint256 triggeredAt,uint256 observationSequence))',
    'event PositionOpened(uint256 indexed positionId,address indexed trader,uint8 indexed market,int256 sizeWad,uint256 collateralWad,uint256 entryPriceWad,bytes32 positionKey)',
    'event PositionClosed(uint256 indexed positionId,uint256 exitPriceWad,int256 rawPnlWad,int256 realizedPnlWad,uint256 badDebtWad)',
    'event PositionLiquidated(uint256 indexed positionId,uint256 markPriceWad,int256 rawPnlWad,int256 realizedPnlWad,uint256 badDebtWad)']
});
// Opt-in only for a manifest-bound candidate deployment. Never call these on the
// old public rehearsal or turn missing methods into fabricated zero balances.
export const CAPITAL_EXECUTION_ABI=Object.freeze({
  brainProxy:['function playerClaimable(address) view returns(uint256)','function settlementCapital() view returns(uint256)',
    'function reservedSettlementLiability() view returns(uint256)','function availableRiskCapacity() view returns(uint256)',
    'function settlementClaims(bytes32) view returns(address user,uint256 orderId,uint256 positionId,uint256 dueWei,uint256 paidWei,uint256 remainingWei,uint256 createdAt,uint256 updatedAt)',
    'function claimSettlement(bytes32) returns(uint256)',
    'event SettlementClaimRecorded(bytes32 indexed positionKey,address indexed user,uint256 dueWei,uint256 paidWei,uint256 remainingWei)',
    'event SettlementClaimPaid(bytes32 indexed positionKey,address indexed user,uint256 paidWei,uint256 remainingWei)'],
  positionEngine:['function previewLiquidationBoundary(uint8,int256,uint256,uint256) view returns(uint256)','function positionKey(uint256) view returns(bytes32)']
});

// A timed-out wallet prompt cannot be cancelled by JavaScript. Keep its write
// lease across adapter recreation until rejection or mined-receipt reconciliation.
const TESTNET_PENDING_WALLET_REQUESTS=new WeakMap();

/** Public TESTNET only. Caller supplies a repository-reviewed deployment manifest
 * and the vendored ethers v6 codec. No key, arbitrary calldata, keeper/oracle write,
 * mainnet switch, or simulation-ledger mutation is exposed here. Every mutation
 * requires a separate user action invoking one of the named methods below. */
export function createTestnetExecutionAdapter({deployment,ethereum,ethers,receiptTimeoutMs=90000,
  pollMs=1500,rpcTimeoutMs=15000,walletRequestTimeoutMs=120000,onState=()=>{},readOnly=false,exitOnly=false}={}){
  const blank=()=>({mode:'BSC_TESTNET',label:'TESTNET · NO REAL VALUE',status:'NOT_DEPLOYED_OR_AUTHORIZED',
    chainId:97,account:null,wallet:null,orders:[],positions:[],receipts:[],observations:{},transaction:null,
    readOnly:readOnly===true,...readOnly?{readScope:'BALANCES_ONLY',block:null,blockHash:null,rpcReadCount:null,balanceStatus:'UNKNOWN',historyStatus:'NOT_REQUESTED',positionsStatus:'NOT_REQUESTED',pnlStatus:'NOT_REQUESTED',claimsStatus:'NOT_REQUESTED',oracleStatus:'NOT_REQUESTED'}:{},exitOnly:exitOnly===true,deploymentContext:'97:'+String(deployment?.addresses?.brainProxy||'').toLowerCase()});
  let rpcRequestCount=0,state=blank(),busy=false,displayActive=true,generation=0,refreshRevision=0,appliedRefreshRevision=0,refreshFlight=null,lastReadyRefresh=null;
  const copy=value=>JSON.parse(JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v));
  const snapshot=()=>copy({...state,writeBlocked:readOnly===true||!!ethereum&&TESTNET_PENDING_WALLET_REQUESTS.has(ethereum)});
  const publish=patch=>{state={...state,...patch};try{onState(snapshot())}catch{}return snapshot()};
  const keys=Object.keys(TESTNET_EXECUTION_ABI),validAddress=v=>/^0x[0-9a-fA-F]{40}$/.test(v||'')&&!/^0x0{40}$/i.test(v);
  const a=Object.freeze({...deployment?.addresses}),hashes=Object.freeze({...deployment?.codeHashes});
  const configValid=deployment?.mode==='BSC_TESTNET'&&deployment?.status==='DEPLOYED_CONFIG_VERIFIED'&&deployment?.publicNetwork===true&&deployment?.chainId===97&&deployment?.testOnly===true&&
    deployment?.verified===true&&Number.isSafeInteger(deployment?.deploymentBlock)&&deployment.deploymentBlock>=0&&
    [...keys,'brainImplementation'].every(k=>validAddress(a[k])&&/^0x[0-9a-fA-F]{64}$/.test(hashes[k]||''))&&
    new Set([...keys,'brainImplementation'].map(k=>a[k]?.toLowerCase())).size===keys.length+1&&typeof ethereum?.request==='function'&&typeof ethers?.Interface==='function';
  if(!configValid){
    const blocked=async()=>executionFailure(new Error('EVM_ADAPTER_NOT_DEPLOYED_OR_AUTHORIZED'));
    return Object.freeze({name:'EVM_ADAPTER',mode:'BSC_TESTNET',enabled:false,snapshot,preview:blocked,submit:blocked,
      close:blocked,cancel:blocked,approve:blocked,deposit:blocked,withdraw:blocked,claim:blocked,faucet:blocked,refresh:blocked,recover:blocked,switchChain:blocked,observe:blocked,dispose(){}});
  }
  const capitalEnabled=deployment.capabilities?.settlementCapital==='ISOLATED_V1';
  const pnlModel=deployment.pnlModel||'NOTIONAL_RETURN_V1';
  if(!['NOTIONAL_RETURN_V1','INDEX_DELTA_C_LOTS_V1'].includes(pnlModel))throw new Error('UNSUPPORTED_PNL_MODEL');
  const fromBlock=deployment.deploymentBlock,abi=Object.fromEntries(keys.map(k=>[k,new ethers.Interface([...TESTNET_EXECUTION_ABI[k],...(capitalEnabled?CAPITAL_EXECUTION_ABI[k]||[]:[])])]));
  const req=async(method,params=[],timeoutOverride=null)=>{
    rpcRequestCount++;
    if(readOnly&&!['eth_chainId','eth_accounts','eth_getCode','eth_getStorageAt','eth_blockNumber','eth_getBlockByNumber','eth_getBalance','eth_call','wallet_switchEthereumChain'].includes(method))throw new Error('M1_READ_ONLY_WALLET');
    let timer;
    const timeout=timeoutOverride??(method==='eth_sendTransaction'||method.startsWith('wallet_')?walletRequestTimeoutMs:rpcTimeoutMs);
    let request;
    if(method==='eth_sendTransaction'){
      if(TESTNET_PENDING_WALLET_REQUESTS.has(ethereum))throw new Error('WALLET_REQUEST_UNRESOLVED');
      const lease={from:params[0].from,to:params[0].to,hash:null};TESTNET_PENDING_WALLET_REQUESTS.set(ethereum,lease);
      request=Promise.resolve().then(()=>ethereum.request({method,params})).then(hash=>{lease.hash=hash;return hash},error=>{
        // Only explicit user rejection proves no broadcast. Other errors stay
        // fail-closed: an uncertain provider response is not permission to retry.
        if(Number(error?.code)===4001||error?.code==='ACTION_REJECTED')TESTNET_PENDING_WALLET_REQUESTS.delete(ethereum);
        throw error;
      });
    }else request=ethereum.request({method,params});
    try{return await Promise.race([request,new Promise((_,reject)=>{
      timer=setTimeout(()=>reject(new Error('RECEIPT_TIMEOUT')),timeout);
    })])}finally{clearTimeout(timer)}
  };
  const hex=n=>`0x${BigInt(n).toString(16)}`,lower=v=>String(v).toLowerCase();
  const wad=v=>BigInt(ethers.parseUnits(String(v),18).toString()),num=v=>Number(ethers.formatUnits(v,18));
  // The repository ships ethers 5; this also accepts ethers 6 test tooling.
  const decoded=value=>{
    if(value?._isBigNumber)return BigInt(value.toString());
    if(Array.isArray(value)){const out=value.map(decoded);let named=value;try{if(value.toObject)named=value.toObject()}catch{}
      for(const key of Object.keys(named))if(!/^\d+$/.test(key))out[key]=decoded(named[key]);return out}
    return value;
  };
  const fail=reason=>{throw new Error(reason)};
  const call=async(k,method,args=[],block='latest')=>decoded(abi[k].decodeFunctionResult(method,
    await req('eth_call',[{to:a[k],data:abi[k].encodeFunctionData(method,args)},block])));
  const identity=async()=>{
    if(BigInt(await req('eth_chainId'))!==97n)fail('WRONG_CHAIN');
    const accounts=await req('eth_accounts');if(!validAddress(accounts?.[0]))fail('DISCONNECTED');return accounts[0];
  };
  const sameSession=async(account,ticket)=>{if(ticket!==generation||lower(await identity())!==lower(account))fail('DISCONNECTED')};
  const verify=async(block='latest')=>{
    const account=await identity();
    for(const k of [...keys,'brainImplementation']){const code=await req('eth_getCode',[a[k],block]);if(code==='0x'||lower(ethers.keccak256(code))!==lower(hashes[k]))fail('DEPLOYMENT_CODE_MISMATCH')}
    const implementation=await req('eth_getStorageAt',[a.brainProxy,'0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',block]);
    if(lower(`0x${implementation.slice(-40)}`)!==lower(a.brainImplementation))fail('PROXY_IMPLEMENTATION_MISMATCH');
    const links=await Promise.all([call('brainProxy','kgen',[],block),call('positionEngine','brainSettlement',[],block),call('positionEngine','executor',[],block),
      call('orderTriggerEngine','engine',[],block),call('orderTriggerEngine','brain',[],block),call('testToken','decimals',[],block),call('brainProxy','SETTLEMENT_ROLE',[],block)]);
    if([a.testToken,a.brainProxy,a.orderTriggerEngine,a.positionEngine,a.brainProxy].some((v,i)=>lower(v)!==lower(links[i][0]))||Number(links[5][0])!==18)fail('DEPLOYMENT_LINK_MISMATCH');
    if(!(await call('brainProxy','hasRole',[links[6][0],a.positionEngine],block))[0])fail('SETTLEMENT_ROLE_MISSING');
    return account;
  };
  const marketNames=['BTCUSDT','ETHUSDT','BNBUSDT'],axes=['KX','KY','KZ'];
  const logsFor=async(k,event,topics,to,cache=null)=>{
    const result=[],base=abi[k].encodeFilterTopics(event,topics);
    // One pinned-height event query per refresh, rather than one slow index
    // request per position. Exact indexed-ID filtering remains mandatory below.
    const query=cache&&['OrderFilled','PositionClosed','PositionLiquidated'].includes(event)?base.slice(0,1):base;
    if(to-fromBlock>2000000)fail('RECOVERY_HISTORY_REQUIRES_INDEXER');
    const topicMatch=log=>base.every((expected,i)=>{
      if(expected==null)return true;
      const actual=lower(log.topics?.[i]||'');
      return Array.isArray(expected)?expected.some(v=>lower(v)===actual):lower(expected)===actual;
    });
    const load=async()=>{
      const rows=[];
      const fetchRange=async(start,end)=>{
        try{return await req('eth_getLogs',[{address:a[k],fromBlock:hex(start),toBlock:hex(end),topics:query}])}
        catch(error){
          if(end-start<=2047)throw error;
          const mid=Math.floor((start+end)/2);
          return [...await fetchRange(start,mid),...await fetchRange(mid+1,end)];
        }
      };
      for(let start=fromBlock;start<=to;start+=16384){
        rows.push(...await fetchRange(start,Math.min(to,start+16383)));
      }
      return rows;
    };
    let logs;
    if(cache){
      const key=k+'@'+to+'@'+JSON.stringify(query);
      if(!cache.has(key))cache.set(key,load());
      logs=await cache.get(key);
    }else logs=await load();
    for(const log of logs){
      if(log.removed||lower(log.address)!==lower(a[k])||!topicMatch(log))continue;
      try{const parsed=abi[k].parseLog(log);if(parsed?.name===event)result.push({...log,parsed:{name:parsed.name,args:decoded(parsed.args)}})}catch{}
    }
    return result;
  };
  const txEvidence=async(log,method)=>{
    const r=await req('eth_getTransactionReceipt',[log.transactionHash]);
    if(!r||BigInt(r.status)!==1n||lower(r.blockHash)!==lower(log.blockHash))fail('RECEIPT_NOT_CANONICAL');
    const block=await req('eth_getBlockByNumber',[r.blockNumber,false]);
    if(readOnly&&(!block||lower(block.hash)!==lower(r.blockHash)||lower(r.transactionHash)!==lower(log.transactionHash)||BigInt(r.blockNumber)!==BigInt(log.blockNumber)))fail('RECEIPT_NOT_CANONICAL');
    return {txHash:r.transactionHash,block:Number(BigInt(r.blockNumber)),timestamp:Number(BigInt(block.timestamp))*1000,
      contract:log.address,method,status:'RECEIPT_CONFIRMED',transactionStatus:'RECEIPT_CONFIRMED',executionMode:'BSC_TESTNET'};
  };
  const refreshRead=async()=>{
    const revision=++refreshRevision;
    try{
    if(readOnly){
      const rpcStart=rpcRequestCount,ticket=generation,height=Number(BigInt(await req('eth_blockNumber'))),tag=hex(height);
      const pinned=await req('eth_getBlockByNumber',[tag,false]);
      if(!/^0x[0-9a-f]{64}$/i.test(pinned?.hash||''))fail('RECOVERY_BLOCK_UNVERIFIED');
      const account=await verify(tag);
      const [native,balance]=await Promise.all([req('eth_getBalance',[account,tag]),call('testToken','balanceOf',[account],tag)]);
      if(typeof native!=='string'||!/^0x[0-9a-f]{1,64}$/i.test(native))fail('INVALID_NATIVE_BALANCE_RESPONSE');
      const canonical=await req('eth_getBlockByNumber',[tag,false]);
      if(lower(canonical?.hash)!==lower(pinned.hash))fail('RECOVERY_BLOCK_CHANGED');
      await sameSession(account,ticket);
      if(ticket!==generation)fail('DISCONNECTED');
      if(revision<appliedRefreshRevision||height<(state.block??0))return {ok:true,superseded:true,...snapshot()};
      appliedRefreshRevision=revision;
      publish({account,chainId:97,status:'M1_BALANCES_VERIFIED',rpcReadCount:rpcRequestCount-rpcStart,balanceStatus:'VERIFIED',error:null,block:height,blockHash:pinned.hash,
        wallet:{readScope:'BALANCES_ONLY',testBnbBalance:ethers.formatUnits(BigInt(native),18),testBnbBalanceWei:String(BigInt(native)),testTokenBalance:num(balance[0]),testTokenBalanceWei:String(balance[0]),
          principal:null,total:null,principalWei:null,free:null,availableWei:null,withdrawable:null,allowanceWei:null,allowance:null,allowanceUnlimited:null,claimable:null,claimableStatus:'NOT_REQUESTED',locked:null,lockedMargin:null,lockedWei:null,equity:null,unrealizedPnl:null,realizedPnl:null},
        capital:null,claims:[],orders:[],positions:[],receipts:[],observations:{},transaction:null});
      return {ok:true,executionMode:'BSC_TESTNET',...snapshot()};
    }
    const ticket=generation,account=await verify(),height=Number(BigInt(await req('eth_blockNumber'))),tag=hex(height),recoveryLogCache=new Map();
    const pinnedBlock=readOnly?await req('eth_getBlockByNumber',[tag,false]):null;
    if(readOnly&&!/^0x[0-9a-f]{64}$/i.test(pinnedBlock?.hash||''))fail('RECOVERY_BLOCK_UNVERIFIED');
    const lf=(...args)=>logsFor(...args,recoveryLogCache);
    const [nativeBalance,balance,principal,locked,available,created,deposits,approvals,mints,allowance,withdrawals]=await Promise.all([
      req('eth_getBalance',[account,tag]),
      call('testToken','balanceOf',[account],tag),call('brainProxy','principalOf',[account],tag),
      call('brainProxy','lockedPrincipalOf',[account],tag),call('brainProxy','availablePrincipal',[account],tag),
      lf('orderTriggerEngine','OrderCreated',[null,account],height),lf('brainProxy','MarginDeposited',[account],height),
      lf('testToken','Approval',[account,a.brainProxy],height),lf('testToken','Transfer',['0x'+'0'.repeat(40),account],height),
      call('testToken','allowance',[account,a.brainProxy],tag),lf('brainProxy','MarginWithdrawn',[account],height)]);
    if(typeof nativeBalance!=='string'||!/^0x[0-9a-f]{1,64}$/i.test(nativeBalance))fail('INVALID_NATIVE_BALANCE_RESPONSE');
    // Some public BSC97 RPC nodes return empty eth_getLogs for old ranges while
    // eth_call and transaction receipts remain available. Recover canonical
    // orders from enumerable contract state instead of treating empty logs as no history.
    if(created.length===0){
      const [nextOrderId]=await call('orderTriggerEngine','nextOrderId',[],tag);
      const upper=BigInt(nextOrderId);if(upper>10001n)fail('RECOVERY_HISTORY_REQUIRES_INDEXER');
      for(let id=1n;id<upper;id++){
        const [o]=await call('orderTriggerEngine','order',[id],tag);
        if(lower(o.trader)!==lower(account))continue;
        created.push({transactionHash:null,blockHash:null,address:a.orderTriggerEngine,parsed:{name:'OrderCreated',args:{orderId:id,trader:o.trader}},stateRecovered:true});
      }
    }
    const orders=[],positions=[],receipts=[],observations={},claims=[];let unrealized=0,realized=0,markUnavailable=false,capital=null;
    if(capitalEnabled){
      const [claimable,funded,reserved,capacity,recorded,paid]=await Promise.all([
        call('brainProxy','playerClaimable',[account],tag),call('brainProxy','settlementCapital',[],tag),
        call('brainProxy','reservedSettlementLiability',[],tag),call('brainProxy','availableRiskCapacity',[],tag),
        lf('brainProxy','SettlementClaimRecorded',[null,account],height),lf('brainProxy','SettlementClaimPaid',[null,account],height)]);
      capital={claimable:num(claimable[0]),claimableWei:String(claimable[0]),settlementCapital:num(funded[0]),reservedSettlementLiability:num(reserved[0]),availableRiskCapacity:num(capacity[0])};
      for(const key of new Set(recorded.map(log=>log.parsed.args.positionKey))){const claim=await call('brainProxy','settlementClaims',[key],tag);
        if(lower(claim.user)!==lower(account))fail('CLAIM_TRADER_MISMATCH');
        claims.push({key,orderId:String(claim.orderId),positionId:String(claim.positionId),due:num(claim.dueWei),paid:num(claim.paidWei),remaining:num(claim.remainingWei)});}
      for(const log of [...recorded,...paid])receipts.push({...await txEvidence(log,log.parsed.name),id:log.transactionHash,receiptId:log.transactionHash,kind:log.parsed.name,
        positionKey:log.parsed.args.positionKey,paid:num(log.parsed.args.paidWei),remaining:num(log.parsed.args.remainingWei)});
    }
    for(let m=0;m<3;m++){
      try{const q=await call('positionEngine','readMarketPrice',[m],tag);observations[marketNames[m]]={price:num(q[0]),at:Number(q[1])*1000,validSources:Number(q[2]),source:'ON_CHAIN_ORACLE'}}
      catch{observations[marketNames[m]]={error:'ORACLE_STALE',source:'ON_CHAIN_ORACLE'}}
    }
    for(const log of [...approvals,...deposits,...mints,...withdrawals])receipts.push({...await txEvidence(log,log.parsed.name),id:log.transactionHash,receiptId:log.transactionHash,kind:log.parsed.name==='Transfer'?'TEST_TOKEN_MINT':log.parsed.name,
      amount:log.parsed.args.amountWei!=null?num(log.parsed.args.amountWei):log.parsed.args.receivedWei!=null?num(log.parsed.args.receivedWei):log.parsed.args.value!=null?num(log.parsed.args.value):null});
    for(const log of created){
      const id=log.parsed.args.orderId,[o]=await call('orderTriggerEngine','order',[id],tag);
      if(lower(o.trader)!==lower(account))fail('ORDER_TRADER_MISMATCH');
      const order={id:String(id),orderId:String(id),axis:axes[Number(o.market)],market:marketNames[Number(o.market)],c:num(o.c),lots:Number(o.lots),
        side:o.c>0n?'LONG':'SHORT',status:['NONE','PENDING','FILLED','CANCELLED','REJECTED'][Number(o.status)],
        triggerPrice:num(o.triggerPrice),createdAt:Number(o.createdAt)*1000,triggeredAt:Number(o.triggeredAt)*1000,
        observedPrice:num(o.observedPrice),fillPrice:num(o.fillPrice),positionId:String(o.positionId)};
      orders.push(order);receipts.push({...log.stateRecovered?{status:'STATE_RECOVERED',transactionStatus:'RPC_LOG_INDEX_UNAVAILABLE',executionMode:'BSC_TESTNET'}:await txEvidence(log,'createOrder'),...order,id:`ORDER-${id}`,receiptId:`ORDER-${id}`,kind:'ORDER_CREATED'});
      if(o.positionId===0n)continue;
      const pid=o.positionId,[p]=await call('positionEngine','positionSnapshot',[pid],tag),terms=await call('positionEngine','orderTerms',[pid],tag);
      if(lower(p.trader)!==lower(account))fail('POSITION_TRADER_MISMATCH');
      const isOpen=Number(p.status)===1;let metrics=[0n],boundary=0n,markError=null;
      if(isOpen){
        try{metrics=await call('positionEngine','markPosition',[pid],tag)}catch{metrics=null;markError='ORACLE_STALE';markUnavailable=true}
        // Boundary is a pure configured reporting calculation, not a fresh quote.
        boundary=(await call('positionEngine','liquidationBoundary',[pid],tag))[0];
      }
      const position={id:String(pid),positionId:String(pid),orderId:String(id),axis:order.axis,market:order.market,side:order.side,c:num(terms.cWad),lots:Number(terms.lots),
        status:['NONE','OPEN','CLOSED','LIQUIDATED'][Number(p.status)],entry:num(p.entryPriceWad),mark:observations[order.market]?.price??null,
        margin:num(p.collateralWad),liquidationPrice:num(boundary),unrealizedPnl:metrics?num(metrics[0]):null,markError,realizedPnl:num(p.realizedPnlWad),
        equity:metrics?num(p.collateralWad)+num(metrics[0]):null,deltaIndex:observations[order.market]?.price==null?null:observations[order.market].price-num(p.entryPriceWad),
        observedAt:observations[order.market]?.at??null,observationSequence:String(terms.observationSequence),pnlModel,
        rawPnl:num(p.rawPnlWad),badDebt:num(p.badDebtWad),openedAt:Number(p.openedAt)*1000,closedAt:Number(p.closedAt)*1000};
      positions.push(position);if(position.unrealizedPnl!==null)unrealized+=position.unrealizedPnl;realized+=position.realizedPnl;
      if(capitalEnabled){
        const [key]=await call('positionEngine','positionKey',[pid],tag);
        if(!claims.some(c=>c.key===key)){const claim=await call('brainProxy','settlementClaims',[key],tag);
          if(claim.dueWei>0n){if(lower(claim.user)!==lower(account))fail('CLAIM_TRADER_MISMATCH');
            claims.push({key,orderId:String(claim.orderId),positionId:String(claim.positionId),due:num(claim.dueWei),paid:num(claim.paidWei),remaining:num(claim.remainingWei),evidence:'CONTRACT_STATE'});}}
      }
      const [fill]=await call('orderTriggerEngine','fillReceipt',[id],tag),fillLogs=await lf('orderTriggerEngine','OrderFilled',[id],height);
      if(fillLogs.length>1)fail('FILL_RECEIPT_INCONSISTENT');
      const fillEvidence=fillLogs.length===1?await txEvidence(fillLogs[0],'observeOrder'):{status:'STATE_RECOVERED',transactionStatus:'RPC_LOG_INDEX_UNAVAILABLE',executionMode:'BSC_TESTNET'};
      receipts.push({...fillEvidence,...order,id:`FILL-${id}`,receiptId:`FILL-${id}`,kind:'FILL',
        walletBefore:num(fill.walletBefore),marginLocked:num(fill.marginLocked),walletAfter:num(fill.walletAfter),previousPrice:num(fill.previousPrice)});
      if(!isOpen){const [s]=await call('positionEngine','settlementReceipt',[pid],tag),event=position.status==='LIQUIDATED'?'PositionLiquidated':'PositionClosed',settled=await lf('positionEngine',event,[pid],height);
        position.liquidationPrice=num(s.liquidationTrigger);
        if(settled.length>1)fail('SETTLEMENT_RECEIPT_INCONSISTENT');
        const settlementEvidence=settled.length===1?await txEvidence(settled[0],event):{status:'STATE_RECOVERED',transactionStatus:'RPC_LOG_INDEX_UNAVAILABLE',executionMode:'BSC_TESTNET'};
        receipts.push({...settlementEvidence,...position,id:`SETTLEMENT-${pid}`,receiptId:`SETTLEMENT-${pid}`,kind:'SETTLEMENT',
          entryPrice:num(s.entryPrice),liquidationTrigger:num(s.liquidationTrigger),
          previousPrice:num(s.previousPrice),observedPrice:num(s.observedPrice),settlementPrice:num(s.settlementPrice),
          marginBefore:num(s.marginBefore),marginAfter:num(s.marginAfter),liquidationPrice:num(s.liquidationTrigger),
          triggeredAt:Number(s.triggeredAt)*1000,settledAt:Number(s.settledAt)*1000});}
    }
    await sameSession(account,ticket);
    if(revision<appliedRefreshRevision||height<(state.block??0))return {ok:true,superseded:true,executionMode:'BSC_TESTNET',...snapshot()};
    const lease=TESTNET_PENDING_WALLET_REQUESTS.get(ethereum);
    if(!readOnly&&lease?.hash&&/^0x[0-9a-fA-F]{64}$/.test(lease.hash)){
      const r=await req('eth_getTransactionReceipt',[lease.hash]);
      if(r&&['0x0','0x1'].includes(r.status)&&Number(BigInt(r.blockNumber))<=height&&
        lower(r.from)===lower(lease.from)&&lower(r.to)===lower(lease.to)&&lower(r.transactionHash)===lower(lease.hash)){
        if(TESTNET_PENDING_WALLET_REQUESTS.get(ethereum)===lease)TESTNET_PENDING_WALLET_REQUESTS.delete(ethereum);
      }
    }
    if(revision<appliedRefreshRevision)return {ok:true,superseded:true,executionMode:'BSC_TESTNET',...snapshot()};
    if(readOnly){
      const canonical=await req('eth_getBlockByNumber',[tag,false]);
      if(canonical?.hash?.toLowerCase()!==pinnedBlock.hash.toLowerCase())fail('RECOVERY_BLOCK_CHANGED');
      await sameSession(account,ticket);
      if(revision<appliedRefreshRevision)return {ok:true,superseded:true,...snapshot()};
    }
    appliedRefreshRevision=revision;
    publish({account,chainId:97,error:null,status:markUnavailable||Object.values(observations).some(q=>q.error)?'ORACLE_STALE':'READY',wallet:{testBnbBalance:ethers.formatUnits(BigInt(nativeBalance),18),testBnbBalanceWei:String(BigInt(nativeBalance)),testTokenBalance:num(balance[0]),testTokenBalanceWei:String(balance[0]),
      principal:num(principal[0]),total:num(principal[0]),principalWei:String(principal[0]),free:num(available[0]),availableWei:String(available[0]),withdrawable:num(available[0]),
      allowanceWei:String(allowance[0]),allowance:num(allowance[0]),allowanceUnlimited:allowance[0]===(1n<<256n)-1n,
      claimable:capital?.claimable??null,claimableStatus:capital?'VERIFIED':'UNSUPPORTED_LEGACY_DEPLOYMENT',locked:num(locked[0]),lockedMargin:num(locked[0]),
      lockedWei:String(locked[0]),equity:markUnavailable?null:num(principal[0])+unrealized+(capital?.claimable||0),unrealizedPnl:markUnavailable?null:unrealized,
      markError:markUnavailable?'ORACLE_STALE':null,realizedPnl:realized},capital,claims,pnlModel,orders,positions,receipts,observations,block:height,blockHash:pinnedBlock?.hash||null});
    lastReadyRefresh=state.status==='READY'?{at:Date.now(),account,ticket}:null;
    return {ok:true,executionMode:'BSC_TESTNET',...snapshot()};
    }catch(error){if(revision<appliedRefreshRevision)return {ok:true,superseded:true,...snapshot()};throw error}
  };
  const refreshInternal=async(force=false)=>{
    if(refreshFlight){if(!force)return refreshFlight;await refreshFlight.catch(()=>{});}
    if(refreshFlight)return refreshInternal(force);
    const flight=refreshRead();refreshFlight=flight;
    try{return await flight}finally{if(refreshFlight===flight)refreshFlight=null}
  };
  const run=async fn=>{try{return await fn()}catch(error){lastReadyRefresh=null;const failure=executionFailure(error),lost=['WRONG_CHAIN','DISCONNECTED'].includes(failure.code);
    publish({...lost||readOnly?blank():{},status:failure.code,error:failure.reason,
      transaction:state.transaction?{...state.transaction,status:failure.code}:null});return failure}};
  const previewInternal=async(input,{forceRefresh=false}={})=>{
    assertRealExecutionPriceSource(input);
    const intent=buildExecutionOrderIntent(input),ticket=generation,account=await identity(),recent=lastReadyRefresh;
    // Display-only history reuse avoids repeating a just-completed RPC recovery.
    // Identity and oracle are always live; a write always forces full recovery.
    const age=recent?Date.now()-recent.at:Infinity;
    const reuse=!forceRefresh&&recent&&age>=0&&age<=5000&&recent.ticket===ticket&&state.status==='READY'&&state.wallet&&lower(recent.account)===lower(account)&&lower(state.account)===lower(account);
    if(!reuse)await refreshInternal(forceRefresh);
    await sameSession(account,ticket);if(state.status!=='READY'||!state.wallet)fail(state.status==='ORACLE_STALE'?'ORACLE_STALE':'DISCONNECTED');
    const wallet=state.wallet;
    let quote;try{quote=await call('positionEngine','readMarketPrice',[intent.contractMarket])}catch{fail('ORACLE_STALE')}
    if(quote[0]<=0n)fail('ORACLE_STALE');
    if(intent.stopPrice!==null||intent.takeProfitPrice!==null)fail('ONCHAIN_STOP_TP_NOT_SUPPORTED');
    if(BigInt(wallet.availableWei)<wad(intent.lots))fail('INSUFFICIENT_MARGIN');
    const cfg=await call('positionEngine','marketConfig',[intent.contractMarket]);
    if(!cfg.enabled)fail('MARKET_DISABLED');
    const c=wad(Math.abs(intent.c)),margin=wad(intent.lots);
    if((c*BigInt(intent.lots)*BigInt(cfg.initialMarginBps)+9999n)/10000n>margin)fail('INSUFFICIENT_MARGIN');
    const mm=Number(cfg.maintenanceMarginBps)/10000,leverage=Math.abs(intent.c);
    let estimate=intent.c>0?(leverage<=1?0:intent.triggerPrice*(leverage-1)/(leverage*(1-mm))):intent.triggerPrice*(leverage+1)/(leverage*(1+mm));
    if(pnlModel==='INDEX_DELTA_C_LOTS_V1'){
      if(!capitalEnabled)fail('CAPITAL_CAPABILITY_REQUIRED');
      estimate=num((await call('positionEngine','previewLiquidationBoundary',[intent.contractMarket,wad(intent.c),BigInt(intent.lots),wad(intent.triggerPrice)]))[0]);
    }
    await sameSession(account,ticket);if(state.status!=='READY')fail(state.status==='ORACLE_STALE'?'ORACLE_STALE':'DISCONNECTED');
    return {ok:true,...intent,intent,currentPrice:num(quote[0]),requiredMargin:intent.lots,available:wallet.free,
      estimatedLiquidationPrice:estimate,pnlModel,liquidationModel:'ON_CHAIN_INITIAL_AND_MAINTENANCE_MARGIN_ESTIMATE',executionMode:'BSC_TESTNET'};
  };
  const send=async(k,method,args,expectedEvent)=>{
    const account=await verify(),ticket=generation,data=abi[k].encodeFunctionData(method,args);
    publish({transaction:{status:'PREFLIGHT',method}});
    // Settlement estimation executes bounded risk/receipt calculations, often
    // repeatedly. Keep a larger but finite budget than ordinary balance reads.
    const preflightTimeout=Math.max(rpcTimeoutMs,60000);
    await req('eth_call',[{from:account,to:a[k],data},'latest'],preflightTimeout); // no mutation
    const estimate=BigInt(await req('eth_estimateGas',[{from:account,to:a[k],data,value:'0x0'}],preflightTimeout));
    if(estimate<=0n||estimate>3000000n)fail('TRANSACTION_GAS_LIMIT');
    await sameSession(account,ticket);publish({transaction:{status:'WALLET_REQUEST',method}});
    const hash=await req('eth_sendTransaction',[{from:account,to:a[k],data,value:'0x0',chainId:'0x61',gas:hex((estimate*12n+9n)/10n)}]);
    if(!/^0x[0-9a-fA-F]{64}$/.test(hash||''))fail('TX_HASH_INVALID');
    publish({transaction:{status:'TX_SUBMITTED',method,txHash:hash}});
    const started=Date.now();let receipt;
    while(Date.now()-started<receiptTimeoutMs){await sameSession(account,ticket);receipt=await req('eth_getTransactionReceipt',[hash]);if(receipt)break;await new Promise(resolve=>setTimeout(resolve,pollMs))}
    if(!receipt)fail('RECEIPT_TIMEOUT');
    if(lower(receipt.to)!==lower(a[k])||lower(receipt.from)!==lower(account)||lower(receipt.transactionHash)!==lower(hash))fail('RECEIPT_IDENTITY_MISMATCH');
    if(BigInt(receipt.status)!==1n){TESTNET_PENDING_WALLET_REQUESTS.delete(ethereum);fail('TX_REVERTED')}
    const eventKey=method==='closePosition'?'positionEngine':k;
    const event=(receipt.logs||[]).filter(l=>lower(l.address)===lower(a[eventKey])).map(l=>{try{return abi[eventKey].parseLog(l)}catch{return null}})
      .find(l=>method==='closePosition'?['PositionClosed','PositionLiquidated'].includes(l?.name)&&String(l.args.positionId)===String(args[0]):l?.name===expectedEvent);
    if(expectedEvent&&!event)fail('RECEIPT_EVENT_MISSING');
    await sameSession(account,ticket);
    await refreshInternal(true);publish({transaction:{status:'RECEIPT_CONFIRMED',method,txHash:hash,block:Number(BigInt(receipt.blockNumber))}});
    return {ok:true,status:method==='createOrder'?'ON_CHAIN_ORDER_CREATED':'RECEIPT_CONFIRMED',txHash:hash,
      orderId:event?.args?.orderId==null?null:String(event.args.orderId),executionMode:'BSC_TESTNET'};
  };
  const mutate=(fn,operation)=>run(async()=>{if(readOnly)fail('M1_READ_ONLY_WALLET');if(exitOnly&&!['close','cancel','withdraw','claim'].includes(operation))fail('LEGACY_EXIT_ONLY_NO_NEW_RISK');if(busy)fail('TRANSACTION_IN_PROGRESS');if(TESTNET_PENDING_WALLET_REQUESTS.has(ethereum))fail('WALLET_REQUEST_UNRESOLVED');busy=true;try{return await fn()}finally{busy=false}});
  const invalidate=()=>{lastReadyRefresh=null;generation++;appliedRefreshRevision=++refreshRevision;if(displayActive)publish({...blank(),status:'RECONNECT_REQUIRED'})};
  for(const event of ['accountsChanged','chainChanged','disconnect'])ethereum.on?.(event,invalidate);
  return Object.freeze({name:'EVM_ADAPTER',mode:'BSC_TESTNET',enabled:true,readOnly:readOnly===true,exitOnly:exitOnly===true,snapshot,
    preview:input=>run(()=>{if(readOnly)fail('M1_READ_ONLY_WALLET');if(exitOnly)fail('LEGACY_EXIT_ONLY_NO_NEW_RISK');return previewInternal(input)}),refresh:()=>run(refreshInternal),recover:()=>run(refreshInternal),
    submit:input=>mutate(async()=>{const checked=await previewInternal(input,{forceRefresh:true});return send('orderTriggerEngine','createOrder',
      [checked.contractMarket,wad(checked.c),BigInt(checked.lots),wad(checked.triggerPrice)],'OrderCreated')}),
    approve:(amount,{unlimited=false}={})=>mutate(async()=>{const value=unlimited?(1n<<256n)-1n:wad(finitePositive(amount,'AMOUNT'));return send('testToken','approve',[a.brainProxy,value],'Approval')}),
    faucet:()=>mutate(()=>send('testToken','faucet',[],'Transfer')),
    deposit:amount=>mutate(async()=>{const value=wad(finitePositive(amount,'AMOUNT')),account=await verify();
      if((await call('testToken','balanceOf',[account]))[0]<value)fail('INSUFFICIENT_BALANCE');
      if((await call('testToken','allowance',[account,a.brainProxy]))[0]<value)fail('APPROVAL_REQUIRED');
      return send('brainProxy','depositMargin',[value],'MarginDeposited')}),
    withdraw:amount=>mutate(async()=>{const value=wad(finitePositive(amount,'AMOUNT')),account=await verify();
      if((await call('brainProxy','availablePrincipal',[account]))[0]<value)fail('INSUFFICIENT_MARGIN');
      return send('brainProxy','withdrawMargin',[value],'MarginWithdrawn')},'withdraw'),
    claim:key=>mutate(async()=>{if(!capitalEnabled)fail('CLAIM_NOT_SUPPORTED_BY_DEPLOYMENT');
      if(!/^0x[0-9a-fA-F]{64}$/.test(key||''))fail('INVALID_CLAIM_KEY');
      const account=await verify(),claim=await call('brainProxy','settlementClaims',[key]);
      if(lower(claim.user)!==lower(account)||claim.remainingWei<=0n)fail('CLAIM_NOT_AVAILABLE');
      return send('brainProxy','claimSettlement',[key],'SettlementClaimPaid')},'claim'),
    close:id=>mutate(()=>send('orderTriggerEngine','closePosition',[BigInt(id)],'PositionClosed'),'close'),
    cancel:id=>mutate(()=>send('orderTriggerEngine','cancelOrder',[BigInt(id)],'OrderTerminated'),'cancel'),
    observe:async()=>executionFailure(new Error('KEEPER_OBSERVATION_REQUIRED')),
    switchChain:()=>run(async()=>{await req('wallet_switchEthereumChain',[{chainId:'0x61'}]);if(BigInt(await req('eth_chainId'))!==97n)fail('WRONG_CHAIN');return {ok:true,chainId:97}}),
    // Presentation suspension never grants execution authority. Identity events
    // still fence every pending operation but cannot erase an inactive book.
    setDisplayActive(active){
      if(typeof active!=='boolean')fail('INVALID_DISPLAY_STATE');
      const wasActive=displayActive;displayActive=active;
      if(!active){lastReadyRefresh=null;generation++;appliedRefreshRevision=++refreshRevision}
      else if(!wasActive)invalidate()
    },
    dispose(){generation++;for(const event of ['accountsChanged','chainChanged','disconnect'])ethereum.removeListener?.(event,invalidate)}
  });
}
