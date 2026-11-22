import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBsc56UnsignedOrderReview,buildBsc56UnsignedCustodyReview,buildRealTradingOrderIntent,buildExecutionOrderIntent,createExecutionAdapter,createPreviewSimulationExecutionAdapter,createK11520PreviewRequestId,k11520ServerPreviewType,createSimulationAutopilot,normalizeExecutionError,EXECUTION_FAILURE_STATES} from '../K線西遊記/temples/11520/runtime/real-trading-order-intent.mjs';
import {createKgenLedger,C_PNL_MODEL} from '../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs';
import {C_DETENTS} from '../K線西遊記/temples/11520/controls/nonlinear-controls.mjs';
import {PUBLIC_MARKET_QUOTE_SOURCE,SIMULATION_PRICE_SOURCE} from '../K線西遊記/temples/11520/runtime/public-market-quotes.mjs';
import {createRequire} from 'node:module';
import {TESTNET_EXECUTION_ABI,CAPITAL_EXECUTION_ABI} from '../K線西遊記/temples/11520/runtime/real-trading-order-intent.mjs';

const WALLET='0x3333333333333333333333333333333333333333';
const BRAIN='0x1111111111111111111111111111111111111111';
const ENGINE='0x2222222222222222222222222222222222222222';
const base={
 axis:'KX',market:'BTCUSDT',chainId:56,side:'多',lots:2,c:1,price:65000,
 walletAddress:WALLET,brainAddress:BRAIN,positionEngineAddress:ENGINE,
 feedProvenanceVerified:true,humanMainnetAuthorization:true
};

test('V1 unsigned intent has 1C ceiling after all protected gates; 100C simulation is not production authority',()=>{
 const intent=buildRealTradingOrderIntent(base);
 assert.equal(intent.axis,'KX');assert.equal(intent.market,'BTCUSDT');assert.equal(intent.contractMarket,0);
 assert.equal(intent.c,1);assert.equal(intent.leverage,1);assert.equal(intent.side,'LONG');
 for(const c of [5,-5,100,-100])assert.throws(()=>buildRealTradingOrderIntent({...base,c}),/V1_HIGH_SPEED_PRODUCTION_LOCKED/);
 assert.equal(intent.lots,2);assert.equal(intent.transactionPayload,null);assert.equal(intent.calldata,null);
 assert.equal(intent.signerRequested,false);assert.equal(intent.broadcast,false);
 assert.equal(intent.status,'READY_FOR_EXPLICIT_WALLET_ACTION_NOT_SUBMITTED');
});
test('rejects wrong axis market, chain and missing protected authorization',()=>{
 assert.throws(()=>buildRealTradingOrderIntent({...base,market:'ETHUSDT'}),/REAL_TRADING_AXIS_MARKET_MISMATCH/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,chainId:97}),/REAL_TRADING_CHAIN_MISMATCH/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,humanMainnetAuthorization:false}),/HUMAN_MAINNET_EXECUTION_AUTHORIZATION_REQUIRED/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,feedProvenanceVerified:false}),/PRODUCTION_FEED_PROVENANCE_REQUIRED/);
});
test('rejects invalid order values, leverage above 100C and wallet identity',()=>{
 assert.throws(()=>buildRealTradingOrderIntent({...base,lots:0}),/LOTS_OUT_OF_RANGE/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,c:0}),/C_NEUTRAL_NO_POSITION/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,c:NaN}),/C_LEVERAGE_OUT_OF_RANGE/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,c:100.0001}),/C_LEVERAGE_OUT_OF_RANGE/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,c:1000}),/C_LEVERAGE_OUT_OF_RANGE/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,price:0}),/PRICE_MUST_BE_POSITIVE/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,walletAddress:'0xdead'}),/WALLET_ADDRESS_INVALID/);
});
test('signed C alone supplies direction; contradictory side and negative lots cannot execute',()=>{
 for(const c of [-1,-.001,.001,1]){
  const intent=buildRealTradingOrderIntent({...base,c,side:undefined});
  assert.equal(intent.c,c);assert.equal(intent.leverage,Math.abs(c));assert.equal(intent.side,c<0?'SHORT':'LONG');
  assert.equal(intent.broadcast,false);assert.equal(intent.signerRequested,false);
 }
 for(const [c,side] of [[1,'SHORT'],[-1,'LONG']])assert.throws(()=>buildRealTradingOrderIntent({...base,c,side}),/C_SIDE_MISMATCH/);
 for(const c of [-0,-100.0001,-1000,Infinity])assert.throws(()=>buildRealTradingOrderIntent({...base,c}),/C_/);
 for(const lots of [-1,0,1.5,101,Infinity])assert.throws(()=>buildRealTradingOrderIntent({...base,lots}),/LOTS_OUT_OF_RANGE/);
});

const simulationInput={axis:'KX',market:'BTCUSDT',c:100,lots:10,currentPrice:100,triggerPrice:101};
function fixture(){const ledger=createKgenLedger(1000),adapter=createExecutionAdapter({ledger});assert.equal(adapter.observe({market:'BTCUSDT',price:100,observedAt:1000,now:1000}).ok,true);return {ledger,adapter}}
test('all canonical signed C detents retain precision across common and unsigned EVM intents',()=>{
 for(const c of C_DETENTS.filter(c=>c!==0)){
  const common=buildExecutionOrderIntent({...simulationInput,c,now:1001});
  if(Math.abs(c)>1){assert.throws(()=>buildRealTradingOrderIntent({...base,c,side:undefined}),/V1_HIGH_SPEED_PRODUCTION_LOCKED/);assert.equal(common.c,c);continue}
  const evm=buildRealTradingOrderIntent({...base,c,side:undefined});
  assert.equal(common.c,c);assert.equal(evm.c,c);assert.equal(common.leverage,Math.abs(c));
  assert.equal(common.side,evm.side);assert.equal(evm.broadcast,false);
  const {adapter}=fixture();const preview=adapter.preview(common,{now:1001});
  assert.equal(preview.ok,true);assert.equal(preview.c,c);assert.equal(preview.leverage,Math.abs(c));
 }
});
test('noncanonical C is rejected by preview, submit and unsigned EVM boundary without snapping or debit',()=>{
 const {ledger,adapter}=fixture(),before=structuredClone(ledger);
 for(const c of [.0001,-.0001,.3,-.3,3.742,-3.742,17.382,-17.382,99.6,-99.6]){
  assert.throws(()=>buildExecutionOrderIntent({...simulationInput,c}),/INVALID_C_DETENT/);
  assert.throws(()=>buildRealTradingOrderIntent({...base,c,side:undefined}),/INVALID_C_DETENT/);
  assert.equal(adapter.preview({...simulationInput,c},{now:1001}).reason,'INVALID_C_DETENT');
  assert.equal(adapter.submit({...simulationInput,c},{now:1001}).reason,'INVALID_C_DETENT');
  assert.deepEqual(ledger,before);
 }
});
test('common intent needs no wallet and rejects invalid signed C/lots/identity without clamping',()=>{
 for(const c of [-100,100])for(const lots of [1,100]){
  const intent=buildExecutionOrderIntent({...simulationInput,c,lots,now:1000});
  assert.equal(intent.side,c<0?'SHORT':'LONG');assert.equal(intent.leverage,100);assert.equal(intent.lots,lots);assert.ok(Object.isFrozen(intent));
 }
 for(const c of [0,-0,100.001,-100.001,1000,NaN,Infinity])assert.throws(()=>buildExecutionOrderIntent({...simulationInput,c}),/C_/);
 for(const lots of [0,-1,1.5,101,NaN,Infinity])assert.throws(()=>buildExecutionOrderIntent({...simulationInput,lots}),/LOTS_OUT_OF_RANGE/);
 assert.throws(()=>buildExecutionOrderIntent({...simulationInput,market:'ETHUSDT'}),/AXIS_MARKET_MISMATCH/);
 assert.throws(()=>buildExecutionOrderIntent({...simulationInput,side:'SHORT'}),/C_SIDE_MISMATCH/);
 assert.throws(()=>buildExecutionOrderIntent({...simulationInput,triggerPrice:0}),/TRIGGER_PRICE/);
 assert.throws(()=>buildExecutionOrderIntent({...simulationInput,stopPrice:102}),/INVALID_STOP_DIRECTION/);
 assert.throws(()=>buildExecutionOrderIntent({...simulationInput,takeProfitPrice:100}),/INVALID_TP_DIRECTION/);
});
test('single adapter preview is pure; pending is not a fill; cross reserves once; normal close settles existing ledger',()=>{
 const {ledger,adapter}=fixture(),before=structuredClone(ledger);
 const preview=adapter.preview(simulationInput,{now:1001});
 assert.equal(preview.ok,true);assert.equal(preview.requiredMargin,10);assert.equal(preview.available,1000);
 assert.equal(preview.estimatedLiquidationPrice,100);assert.equal(preview.executionMode,'SIMULATION');
 assert.deepEqual(ledger,before);
 const pending=adapter.submit(preview.intent,{now:1002});
 assert.equal(pending.status,'PENDING_TRIGGER');assert.equal(pending.order.status,'PENDING');assert.equal(ledger.free,1000);assert.equal(ledger.lockedMargin,0);
 assert.equal(adapter.observe({market:'BTCUSDT',price:102,observedAt:1003,now:1003}).ok,true);
 let book=adapter.snapshot();assert.equal(book.orders[0].status,'FILLED');assert.equal(book.positions[0].status,'OPEN');
 assert.equal(ledger.free,990);assert.equal(ledger.lockedMargin,10);assert.equal(book.receipts.length,1);
 adapter.observe({market:'BTCUSDT',price:103,observedAt:1004,now:1004});
 assert.ok(ledger.unrealizedPnl>0);assert.equal(adapter.snapshot().receipts.length,1);
 const settled=adapter.close(book.positions[0].positionId,{now:1005});
 assert.equal(settled.ok,true);assert.equal(settled.receipt.status,'CLOSED');assert.equal(ledger.lockedMargin,0);
 assert.ok(ledger.realizedPnl>0);assert.equal(ledger.free,1000+ledger.realizedPnl);assert.equal(adapter.snapshot().receipts.length,2);
 const terminal=structuredClone(ledger);assert.equal(adapter.close(book.positions[0].positionId,{now:1006}).ok,false);assert.deepEqual(ledger,terminal);
});
test('exact touch, upward cross, downward cross fill once and liquidation is isolated, terminal with margin zero',()=>{
 for(const [c,trigger,next,liquidation] of [[100,100,100,99],[100,101,102,98],[-100,99,98,100]]){
  const {ledger,adapter}=fixture();
  assert.equal(adapter.submit({...simulationInput,c,triggerPrice:trigger},{now:1001}).ok,true);
  assert.equal(adapter.observe({market:'BTCUSDT',price:next,observedAt:1002,now:1002}).ok,true);
  assert.equal(adapter.snapshot().receipts.length,1);
  adapter.observe({market:'BTCUSDT',price:liquidation,observedAt:1003,now:1003});
  const book=adapter.snapshot();assert.equal(book.positions[0].status,'LIQUIDATED');assert.equal(book.positions[0].margin,0);
  assert.equal(book.receipts[1].marginAfter,0);assert.equal(ledger.free,990);assert.equal(ledger.lockedMargin,0);
  adapter.observe({market:'BTCUSDT',price:next,observedAt:1004,now:1004});
  assert.equal(adapter.snapshot().positions.length,1);assert.equal(adapter.snapshot().receipts.length,2);
 }
});
test('invalid requests, stale observations and insufficient margin fail without debiting ledger',()=>{
 const {ledger,adapter}=fixture(),before=structuredClone(ledger);
 for(const input of [{...simulationInput,c:1000},{...simulationInput,lots:101}])assert.equal(adapter.submit(input,{now:1001}).code,'ORDER_REJECTED');
 assert.equal(adapter.submit(simulationInput,{now:20000}).code,'ORACLE_STALE');
 assert.equal(adapter.observe({market:'BTCUSDT',price:105,observedAt:999,now:1000}).code,'ORACLE_STALE');
 assert.deepEqual(ledger,before);
 ledger.free=0;const poor=structuredClone(ledger);
 assert.equal(adapter.submit(simulationInput,{now:1001}).code,'INSUFFICIENT_MARGIN');assert.deepEqual(ledger,poor);
});
test('cancel operates on the existing book without margin debit or synthetic receipt',()=>{
 const {ledger,adapter}=fixture(),placed=adapter.submit(simulationInput,{now:1001});
 assert.equal(adapter.cancel(placed.order.orderId).ok,true);
 adapter.observe({market:'BTCUSDT',price:102,observedAt:1002,now:1002});
 assert.equal(ledger.free,1000);assert.equal(adapter.snapshot().positions.length,0);assert.equal(adapter.snapshot().receipts.length,0);
});
test('EVM seam stays disabled despite flags; no provider calls and no fallback or simulation debit on rejection',()=>{
 const {ledger}=fixture(),before=structuredClone(ledger);let walletCalls=0;
 const adapter=createExecutionAdapter({ledger,wallet:{request(){walletCalls++;throw new Error('must not call')}},
  deployment:{mode:'ON_CHAIN',verified:true,humanExecutionAuthorized:true,adapter:{submit(){walletCalls++}}}});
 assert.equal(adapter.name,'EVM_ADAPTER');assert.equal(adapter.enabled,false);assert.equal(adapter.mode,'ON_CHAIN');
 for(const action of [()=>adapter.preview(simulationInput),()=>adapter.submit(simulationInput),()=>adapter.observe({}),()=>adapter.close('x'),()=>adapter.cancel('x')]){
  const result=action();assert.equal(result.ok,false);assert.equal(result.code,'ORDER_REJECTED');assert.match(result.reason,/NOT_DEPLOYED_OR_AUTHORIZED/);
 }
 assert.equal(walletCalls,0);assert.deepEqual(ledger,before);assert.equal(adapter.snapshot().wallet,null);
});
test('stable wallet/transaction failure states are bounded and do not leak provider details',()=>{
 for(const state of EXECUTION_FAILURE_STATES)assert.equal(normalizeExecutionError({code:state}),state);
 for(const [code,state] of [[4001,'USER_REJECTED'],[4900,'DISCONNECTED'],[4901,'WRONG_CHAIN'],['INSUFFICIENT_FUNDS','INSUFFICIENT_BALANCE'],['CALL_EXCEPTION','TX_REVERTED'],['TRANSACTION_REPLACED','TX_DROPPED'],['TIMEOUT','RECEIPT_TIMEOUT']])assert.equal(normalizeExecutionError({code}),state);
 assert.equal(normalizeExecutionError({message:'INSUFFICIENT_FREE_KGEN'}),'INSUFFICIENT_MARGIN');
 assert.equal(normalizeExecutionError({message:'STALE_PRICE'}),'ORACLE_STALE');
 assert.equal(normalizeExecutionError({message:'untrusted provider data'}),'ORDER_REJECTED');
});

// Explicit local EIP-1193 fixtures: these addresses/receipts are NOT public deployments.
const vendored=createRequire(import.meta.url)('../K線西遊記/assets/ethers-5.7.2.umd.min.js');
const codec=vendored.ethers.utils;
function testnetFixture({capital=false,height=2}={}){
 const addresses={testToken:'0x'+'11'.repeat(20),brainProxy:'0x'+'22'.repeat(20),positionEngine:'0x'+'33'.repeat(20),orderTriggerEngine:'0x'+'44'.repeat(20),brainImplementation:'0x'+'55'.repeat(20)};
 const code='0x60006000',codeHashes=Object.fromEntries(Object.keys(addresses).map(k=>[k,codec.keccak256(code)]));
 const deployment={mode:'BSC_TESTNET',status:'DEPLOYED_CONFIG_VERIFIED',chainId:97,testOnly:true,publicNetwork:true,verified:true,deploymentBlock:1,addresses,codeHashes};
 if(capital){deployment.capabilities={settlementCapital:'ISOLATED_V1'};deployment.pnlModel='INDEX_DELTA_C_LOTS_V1'}
 const abi=Object.fromEntries(Object.entries(TESTNET_EXECUTION_ABI).map(([k,v])=>[k,new codec.Interface([...v,...(capital?CAPITAL_EXECUTION_ABI[k]||[]:[])])]));
 const keyFor=address=>Object.keys(addresses).find(k=>addresses[k].toLowerCase()===address.toLowerCase());
 const role='0x'+'aa'.repeat(32),blockHash='0x'+'bb'.repeat(32),hash='0x'+'cc'.repeat(32),wad=v=>codec.parseUnits(String(v),18);
 let chain='0x61',account=WALLET,phase='none',sendError=null,reverted=false,pendingReceipts=0,amount=1000,token=5000,approved=0n,stale=false,closeLiquidates=false,sendDelay=null,blockedRead=null,suppressLogs=false;
 const listeners=new Map(),calls=[],logs=[],receipts=new Map();let claimable=0;
 function log(k,name,args){const ev=abi[k].encodeEventLog(abi[k].getEvent(name),args),value={...ev,address:addresses[k],blockNumber:'0x2',blockHash,transactionHash:hash,logIndex:'0x0',removed:false};logs.push(value);return value}
 function record(k,event,args){const eventLog=log(k,event,args);receipts.set(hash,{transactionHash:hash,blockNumber:'0x2',blockHash,status:reverted?'0x0':'0x1',to:addresses[k],from:account,logs:[eventLog]})}
 const provider={on(event,fn){if(!listeners.has(event))listeners.set(event,new Set());listeners.get(event).add(fn)},removeListener(event,fn){listeners.get(event)?.delete(fn)},async request({method,params=[]}){
  calls.push({method,params});
  if(method==='eth_chainId')return chain;if(method==='eth_accounts')return account?[account]:[];
  if(method==='wallet_switchEthereumChain'){chain=params[0].chainId;return null}
  if(method==='eth_getCode')return code;
  if(method==='eth_getBalance')return '0x58d15e17628000';
  if(method==='eth_estimateGas')return '0x20000';
  if(method==='eth_getStorageAt')return '0x'+addresses.brainImplementation.slice(2).padStart(64,'0');
   if(method==='eth_blockNumber')return '0x'+BigInt(height).toString(16);
   if(method==='eth_getBlockByNumber')return {number:params[0],timestamp:'0x64',hash:blockHash};
  if(method==='eth_getTransactionReceipt'){if(pendingReceipts-->0)return null;return receipts.get(params[0])??null}
  if(method==='eth_getLogs')return suppressLogs?[]:logs.filter(l=>l.address===params[0].address&&params[0].topics.every((t,i)=>t===null||t===l.topics[i]));
  if(method==='eth_sendTransaction'){
   if(sendDelay)await sendDelay;
   if(sendError)throw sendError;const k=keyFor(params[0].to),parsed=abi[k].parseTransaction(params[0]);
   if(parsed.name==='createOrder'){if(!reverted){phase='pending';record(k,'OrderCreated',[1,account])}else receipts.set(hash,{status:'0x0',to:addresses[k],from:account,transactionHash:hash});}
   if(parsed.name==='approve'){approved=BigInt(parsed.args[1].toString());record(k,'Approval',[account,addresses.brainProxy,parsed.args[1]])}
   if(parsed.name==='depositMargin'){const n=Number(codec.formatUnits(parsed.args[0],18));amount+=n;token-=n;record(k,'MarginDeposited',[account,parsed.args[0],parsed.args[0]])}
   if(parsed.name==='withdrawMargin'){const n=Number(codec.formatUnits(parsed.args[0],18));amount-=n;token+=n;record(k,'MarginWithdrawn',[account,parsed.args[0]])}
   if(parsed.name==='claimSettlement'){amount+=claimable;const paid=claimable;claimable=0;record(k,'SettlementClaimPaid',[parsed.args[0],account,wad(paid),0])}
   if(parsed.name==='faucet'){token+=1000;record(k,'Transfer',['0x'+'0'.repeat(40),account,wad(1000)])}
   if(parsed.name==='closePosition'){
    phase=closeLiquidates?'liquidated':'closed';
    const eventLog=log('positionEngine',closeLiquidates?'PositionLiquidated':'PositionClosed',[1,wad(99),wad(-2),wad(-2),0]);
    receipts.set(hash,{transactionHash:hash,blockNumber:'0x2',blockHash,status:'0x1',to:addresses[k],from:account,logs:[eventLog]});
   }
   return hash;
  }
  if(method==='eth_call'){
   const k=keyFor(params[0].to),parsed=abi[k].parseTransaction(params[0]);let out;
   switch(parsed.name){
    case 'kgen':out=[addresses.testToken];break;
    case 'brain':case 'brainSettlement':out=[addresses.brainProxy];break;
    case 'engine':out=[addresses.positionEngine];break;case 'executor':out=[addresses.orderTriggerEngine];break;
    case 'decimals':out=[18];break;case 'SETTLEMENT_ROLE':out=[role];break;case 'hasRole':out=[true];break;
    case 'balanceOf':out=[wad(token)];break;case 'allowance':out=[approved];break;
    case 'principalOf':out=[wad(amount)];break;case 'lockedPrincipalOf':out=[wad(phase==='filled'?2:0)];break;
    case 'availablePrincipal':out=[wad(amount-(phase==='filled'?2:0))];break;
    case 'playerClaimable':out=[wad(claimable)];break;
    case 'settlementCapital':case 'availableRiskCapacity':out=[wad(500)];break;
    case 'reservedSettlementLiability':out=[wad(250)];break;
    case 'previewLiquidationBoundary':out=[wad(99.991)];break;
    case 'positionKey':out=['0x'+'dd'.repeat(32)];break;
    case 'settlementClaims':out=[account,1,1,wad(50),wad(50-claimable),wad(claimable),100,100];break;
    case 'claimSettlement':out=[wad(claimable)];break;
    case 'readMarketPrice':if(stale)throw {code:'CALL_EXCEPTION'};out=[wad(100),100,3];break;
    case 'marketConfig':out=[100,50,3600,1,wad(1000000),true];break;
    case 'nextOrderId':out=[phase==='none'?1:2];break;
    case 'order':out=[[parsed.args[0],account,0,wad(100),2,wad(100),90,phase!=='pending'?100:0,wad(100),wad(100),phase!=='pending'?parsed.args[0]:0,phase!=='pending'?2:1,wad(99),100,1]];break;
    case 'positionSnapshot':out=[[account,0,wad(2),wad(phase==='filled'?2:0),wad(100),100,phase==='filled'?0:101,0,0,0,0,phase==='liquidated'?3:phase==='closed'?2:1]];break;
    case 'orderTerms':out=[parsed.args[0],wad(100),2,wad(100),100,1];break;
    case 'markPosition':if(stale)throw {code:'CALL_EXCEPTION'};out=[wad(0.1),wad(2.1),wad(0.01),false];break;
    case 'liquidationBoundary':out=[wad(99.5)];break;
    case 'fillReceipt':out=[[parsed.args[0],parsed.args[0],account,0,wad(100),2,90,100,wad(99),wad(100),wad(100),wad(100),wad(1000),wad(2),wad(998),1,1]];break;
    case 'settlementReceipt':out=[[parsed.args[0],parsed.args[0],0,wad(100),2,wad(100),wad(99.5),wad(100),wad(99),101,101,wad(2),0,wad(-2),wad(-2),0,phase==='liquidated'?3:2,account,1,wad(99),101,2]];break;
    case 'createOrder':out=[1];break;case 'approve':out=[true];break;case 'depositMargin':out=[parsed.args[0]];break;case 'faucet':out=[];break;
    case 'closePosition':case 'withdrawMargin':out=[];break;
    default:throw new Error(`fixture missing ${parsed.name}`);
   }
   const encoded=abi[k].encodeFunctionResult(parsed.name,out);
   if(blockedRead&&parsed.name==='principalOf'){const wait=blockedRead;blockedRead=null;await wait}
   return encoded;
  }
  throw new Error(`fixture missing RPC ${method}`);
 }};
 return {deployment,provider,calls,make:(extra={})=>createExecutionAdapter({deployment,ethereum:provider,ethers:codec,pollMs:1,receiptTimeoutMs:3000,...extra}),
  setChain:v=>{chain=v},setAccount:v=>{account=v;for(const fn of listeners.get('accountsChanged')||[])fn(v?[v]:[])},
  setReject:()=>{sendError={code:4001}},setRevert:()=>{reverted=true},setPending:n=>{pendingReceipts=n},setStale:()=>{stale=true},
  setCloseLiquidates:()=>{closeLiquidates=true},setAmount:v=>{amount=v},setSuppressLogs:v=>{suppressLogs=!!v},
  claimFixture(){claimable=50;record('brainProxy','SettlementClaimRecorded',['0x'+'dd'.repeat(32),account,wad(50),0,wad(50)])},
  delaySend:()=>{let release;sendDelay=new Promise(r=>{release=r});return ()=>{release();sendDelay=null}},
  delayRead:()=>{let release;blockedRead=new Promise(r=>{release=r});return release},
  settledOrders(count,liquidated=false){phase=liquidated?'liquidated':'closed';for(let id=1;id<=count;id++){record('orderTriggerEngine','OrderCreated',[id,account]);record('orderTriggerEngine','OrderFilled',[id,id,wad(100)]);record('positionEngine',liquidated?'PositionLiquidated':'PositionClosed',[id,wad(99),wad(-2),wad(-2),0])}record('orderTriggerEngine','OrderFilled',[999,999,wad(100)]);record('positionEngine',liquidated?'PositionLiquidated':'PositionClosed',[999,wad(99),wad(-2),wad(-2),0])},
  fill(){phase='filled';record('orderTriggerEngine','OrderFilled',[1,1,wad(100)])}};
}
const onchainInput={axis:'KX',market:'BTCUSDT',c:100,lots:2,currentPrice:100,triggerPrice:100};
test('recovery groups settlement event queries per pinned refresh and filters exact position IDs',async()=>{
 for(const liquidated of [false,true]){
  const f=testnetFixture();f.settledOrders(3,liquidated);const adapter=f.make();assert.equal((await adapter.recover()).ok,true);
  const book=adapter.snapshot();assert.deepEqual(book.positions.map(p=>p.positionId),['1','2','3']);
  assert.deepEqual(book.receipts.filter(r=>r.kind==='FILL').map(r=>r.receiptId),['FILL-1','FILL-2','FILL-3']);
  assert.deepEqual(book.receipts.filter(r=>r.kind==='SETTLEMENT').map(r=>r.receiptId),['SETTLEMENT-1','SETTLEMENT-2','SETTLEMENT-3']);
  for(const [key,event] of [['orderTriggerEngine','OrderFilled'],['positionEngine',liquidated?'PositionLiquidated':'PositionClosed']]){
   const face=new codec.Interface(TESTNET_EXECUTION_ABI[key]),topic=face.getEventTopic(event);
   const calls=f.calls.filter(c=>c.method==='eth_getLogs'&&c.params[0].topics[0]===topic);
   assert.equal(calls.length,1,event+' queried once rather than per position');assert.equal(calls[0].params[0].topics.length,1);assert.equal(calls[0].params[0].toBlock,'0x2');
  }
  const createdTopic=new codec.Interface(TESTNET_EXECUTION_ABI.orderTriggerEngine).getEventTopic('OrderCreated');
  const created=f.calls.find(c=>c.method==='eth_getLogs'&&c.params[0].topics[0]===createdTopic);assert.equal(created.params[0].topics[2].toLowerCase(),'0x'+WALLET.slice(2).toLowerCase().padStart(64,'0'),'trader filter remains narrow');
  f.calls.length=0;assert.equal((await adapter.refresh()).ok,true);assert.ok(f.calls.some(c=>c.method==='eth_getLogs'),'cache cannot cross refresh snapshot');
 }
});
test('historical position liquidation boundary comes from its canonical settlement receipt including genuine zero',async()=>{
 for(const liquidated of [false,true])for(const boundary of ['99.5','0']){
  const f=testnetFixture();f.settledOrders(1,liquidated);const request=f.provider.request,face=new codec.Interface(TESTNET_EXECUTION_ABI.positionEngine);
  f.provider.request=async args=>{const raw=await request(args);if(args.method==='eth_call'&&args.params[0].to===f.deployment.addresses.positionEngine&&args.params[0].data.startsWith(face.getSighash('settlementReceipt'))){const [s]=face.decodeFunctionResult('settlementReceipt',raw),values=Array.from(s);values[6]=codec.parseUnits(boundary,18);return face.encodeFunctionResult('settlementReceipt',[values])}return raw};
  const adapter=f.make();assert.equal((await adapter.recover()).ok,true);const position=adapter.snapshot().positions[0],receipt=adapter.snapshot().receipts.find(r=>r.kind==='SETTLEMENT');
  assert.equal(position.status,liquidated?'LIQUIDATED':'CLOSED');assert.equal(position.liquidationPrice,Number(boundary));assert.equal(position.liquidationPrice,receipt.liquidationTrigger);
  assert.equal(f.calls.some(c=>c.method==='eth_call'&&c.params[0].to===f.deployment.addresses.positionEngine&&c.params[0].data.startsWith(face.getSighash('liquidationBoundary'))),false,'historical boundary must not be recomputed from a live oracle');
 }
});
test('BSC97 adapter refuses unverified/local/mainnet/empty deployment without RPC',async()=>{
 for(const override of [{verified:false},{publicNetwork:false},{chainId:56},{status:'PREPARED_NOT_DEPLOYED'},{addresses:{}},{codeHashes:{}}]){
  const f=testnetFixture(),adapter=f.make({deployment:{...f.deployment,...override}});assert.equal(adapter.enabled,false);
  assert.equal((await adapter.submit(onchainInput)).ok,false);assert.equal(f.calls.length,0);
 }
});
test('BSC97 vendored ethers5 adapter validates deployment and reads only real-contract fields',async()=>{
 const f=testnetFixture(),adapter=f.make();assert.equal((await adapter.refresh()).ok,true);
 assert.equal(adapter.snapshot().wallet.free,1000);assert.equal(adapter.snapshot().wallet.testTokenBalance,5000);
 const preview=await adapter.preview(onchainInput);assert.equal(preview.ok,true);assert.equal(preview.requiredMargin,2);
 assert.equal(f.calls.some(c=>c.method==='eth_sendTransaction'),false);
 assert.equal((await adapter.observe({price:1})).reason,'KEEPER_OBSERVATION_REQUIRED');
});
test('display preview reuses only a bounded fresh READY recovery and still reads live identity and oracle',async t=>{
 let now=Date.now();t.mock.method(Date,'now',()=>now);const f=testnetFixture(),adapter=f.make();assert.equal((await adapter.refresh()).ok,true);
 f.calls.length=0;now+=5000;assert.equal((await adapter.preview(onchainInput)).ok,true);
 assert.equal(f.calls.some(c=>c.method==='eth_getLogs'),false,'fresh preview must not recover history again');
 assert.ok(f.calls.some(c=>c.method==='eth_chainId'));assert.ok(f.calls.some(c=>c.method==='eth_accounts'));
 const face=new codec.Interface(TESTNET_EXECUTION_ABI.positionEngine);
 assert.ok(f.calls.some(c=>c.method==='eth_call'&&c.params[0].data.startsWith(face.getSighash('readMarketPrice'))),'selected oracle is checked at latest even inside TTL');
 f.calls.length=0;now++;assert.equal((await adapter.preview(onchainInput)).ok,true);assert.ok(f.calls.some(c=>c.method==='eth_getLogs'),'5001ms forces history refresh');
 f.setStale();assert.equal((await adapter.preview(onchainInput)).code,'ORACLE_STALE','recent READY is not permission to ignore a newly stale oracle');
});
test('display preview cache never survives changed account, wrong chain, or mid-preview session invalidation',async()=>{
 const f=testnetFixture(),adapter=f.make();await adapter.refresh();f.calls.length=0;
 const other='0x'+'77'.repeat(20);f.setAccount(other);assert.equal((await adapter.preview(onchainInput)).ok,true);assert.equal(adapter.snapshot().account,other);assert.ok(f.calls.some(c=>c.method==='eth_getLogs'));
 f.setChain('0x38');assert.equal((await adapter.preview(onchainInput)).code,'WRONG_CHAIN');assert.equal(adapter.snapshot().wallet,null);
 const g=testnetFixture(),second=g.make();await second.refresh();const request=g.provider.request;
 const face=new codec.Interface(TESTNET_EXECUTION_ABI.positionEngine);
 g.provider.request=async args=>{const result=await request(args);if(args.method==='eth_call'&&args.params[0].data.startsWith(face.getSighash('marketConfig')))g.setAccount(null);return result};
 assert.equal((await second.preview(onchainInput)).code,'DISCONNECTED');assert.equal(second.snapshot().wallet,null);
});
test('submit never uses display snapshot cache and rejects changed margin before any wallet request',async()=>{
 const f=testnetFixture(),adapter=f.make();await adapter.refresh();assert.equal((await adapter.preview(onchainInput)).ok,true);
 f.setAmount(0);f.calls.length=0;const sent=await adapter.submit(onchainInput);assert.equal(sent.code,'INSUFFICIENT_MARGIN');
 assert.ok(f.calls.some(c=>c.method==='eth_getLogs'),'submit performs a fresh full recovery even within5seconds');
 assert.equal(f.calls.some(c=>c.method==='eth_sendTransaction'),false);assert.equal(adapter.snapshot().wallet.free,0);
});
test('onchain order only confirms after successful receipt; reload rebuilds pending and fill from events/state',async()=>{
 const f=testnetFixture(),states=[],adapter=f.make({onState:s=>states.push(s)});f.setPending(2);
 const submitted=await adapter.submit(onchainInput);assert.equal(submitted.ok,true);assert.equal(submitted.status,'ON_CHAIN_ORDER_CREATED');
 assert.equal(states.find(s=>s.transaction?.status==='TX_SUBMITTED').orders.length,0);
 assert.equal(adapter.snapshot().orders[0].status,'PENDING');assert.equal(adapter.snapshot().wallet.lockedMargin,0);
 adapter.dispose();const reloaded=f.make();assert.equal((await reloaded.recover()).ok,true);assert.equal(reloaded.snapshot().orders[0].orderId,'1');
 f.fill();assert.equal((await reloaded.refresh()).ok,true);assert.equal(reloaded.snapshot().positions[0].status,'OPEN');
 assert.equal(reloaded.snapshot().positions[0].liquidationPrice,99.5);assert.equal(reloaded.snapshot().wallet.lockedMargin,2);
 assert.equal(reloaded.snapshot().receipts.filter(r=>r.kind==='FILL').length,1);
});
test('wallet reject, wrong chain, reverted receipt and timeout never create phantom onchain state',async()=>{
 for(const scenario of ['reject','chain','revert','timeout']){
  const f=testnetFixture(),adapter=f.make({receiptTimeoutMs:scenario==='timeout'?30:3000});if(scenario==='reject')f.setReject();if(scenario==='chain')f.setChain('0x38');if(scenario==='revert')f.setRevert();if(scenario==='timeout')f.setPending(9999);
  const r=await adapter.submit(onchainInput);assert.equal(r.ok,false,scenario);
  assert.equal(r.code,{reject:'USER_REJECTED',chain:'WRONG_CHAIN',revert:'TX_REVERTED',timeout:'RECEIPT_TIMEOUT'}[scenario]);
  assert.equal(adapter.snapshot().orders.length,0);assert.equal(adapter.snapshot().positions.length,0);
 }
});
test('test token approval and deposit are separate explicit wallet actions, disconnect clears recovered balances',async()=>{
 const f=testnetFixture(),adapter=f.make();assert.equal((await adapter.deposit(10)).reason,'APPROVAL_REQUIRED');
 assert.equal(f.calls.filter(c=>c.method==='eth_sendTransaction').length,0);
 assert.equal((await adapter.approve(10)).ok,true);assert.equal((await adapter.deposit(10)).ok,true);
 assert.equal(adapter.snapshot().wallet.free,1010);assert.equal(adapter.snapshot().wallet.testTokenBalance,4990);
 f.setAccount(null);assert.equal(adapter.snapshot().wallet,null);assert.equal((await adapter.refresh()).code,'DISCONNECTED');
 f.setChain('0x38');assert.equal((await adapter.switchChain()).ok,true);assert.equal(f.calls.at(-1).method,'eth_chainId');
});
test('allowance is read-only; max approval is explicit, reusable, and withdrawal cannot consume locked funds',async()=>{
 const f=testnetFixture(),adapter=f.make();await adapter.refresh();
 assert.equal(adapter.snapshot().wallet.allowanceWei,'0');assert.equal(adapter.snapshot().wallet.claimable,null);
 assert.equal(f.calls.filter(c=>c.method==='eth_sendTransaction').length,0);
 assert.equal((await adapter.approve(100,{unlimited:true})).ok,true);
 assert.equal(adapter.snapshot().wallet.allowanceWei,((1n<<256n)-1n).toString());
 assert.equal(adapter.snapshot().wallet.allowanceUnlimited,true);
 assert.equal((await adapter.deposit(100)).ok,true);assert.equal((await adapter.deposit(500)).ok,true);
 assert.equal(f.calls.filter(c=>c.method==='eth_sendTransaction'&&c.params[0].to===f.deployment.addresses.testToken).length,1);
 await adapter.submit(onchainInput);f.fill();await adapter.refresh();
 assert.equal(adapter.snapshot().wallet.withdrawable,1598);
 assert.equal((await adapter.withdraw(1599)).code,'INSUFFICIENT_MARGIN');
 assert.equal((await adapter.withdraw(100)).ok,true);assert.equal(adapter.snapshot().wallet.free,1498);
 assert.equal(adapter.snapshot().receipts.some(r=>r.kind==='MarginWithdrawn'&&r.amount===100),true);
});
test('stale onchain oracle preserves recovered balances/order/receipt but never fabricates PnL or READY',async()=>{
 const f=testnetFixture(),adapter=f.make();assert.equal((await adapter.submit(onchainInput)).ok,true);f.fill();f.setStale();
 const result=await adapter.recover();assert.equal(result.ok,true);const book=adapter.snapshot();
 assert.equal(book.status,'ORACLE_STALE');assert.equal(book.wallet.free,998);assert.equal(book.wallet.lockedMargin,2);
 assert.equal(book.wallet.equity,null);assert.equal(book.wallet.unrealizedPnl,null);assert.equal(book.positions[0].unrealizedPnl,null);
 assert.equal(book.receipts.some(r=>r.kind==='FILL'),true);assert.equal((await adapter.preview(onchainInput)).code,'ORACLE_STALE');
});
test('test-only faucet requests one explicit wallet transaction and recovers confirmed token mint',async()=>{
 const f=testnetFixture(),adapter=f.make();assert.equal(f.calls.length,0);const r=await adapter.faucet();
 assert.equal(r.ok,true);assert.equal(r.status,'RECEIPT_CONFIRMED');assert.equal(adapter.snapshot().wallet.testTokenBalance,6000);
 assert.equal(adapter.snapshot().receipts.filter(v=>v.kind==='TEST_TOKEN_MINT').length,1);
 assert.equal(f.calls.filter(v=>v.method==='eth_sendTransaction').length,1);
});
test('close at liquidation boundary confirms PositionLiquidated for the requested position',async()=>{
 const f=testnetFixture(),adapter=f.make();assert.equal((await adapter.submit(onchainInput)).ok,true);f.fill();f.setCloseLiquidates();
 const result=await adapter.close('1');assert.equal(result.ok,true);assert.equal(result.status,'RECEIPT_CONFIRMED');
 assert.equal(adapter.snapshot().positions[0].status,'LIQUIDATED');assert.equal(adapter.snapshot().positions[0].margin,0);
 assert.equal(adapter.snapshot().receipts.find(r=>r.kind==='SETTLEMENT').status,'LIQUIDATED');
});
test('overlapping polling refreshes share one snapshot; post-mutation refresh cannot be overwritten by old read',async()=>{
 const f=testnetFixture(),adapter=f.make();await adapter.refresh();
 const release=f.delayRead(),older=adapter.refresh();
 await new Promise(r=>setTimeout(r,20));const overlapping=adapter.refresh();
 const requestCount=f.calls.filter(v=>v.method==='eth_call').length;
 await new Promise(r=>setTimeout(r,20));assert.equal(f.calls.filter(v=>v.method==='eth_call').length,requestCount);
 release();assert.equal((await older).ok,true);assert.equal((await overlapping).ok,true);
 f.setAmount(1200);await adapter.refresh();assert.equal(adapter.snapshot().wallet.principal,1200);
 assert.equal((await adapter.submit(onchainInput)).ok,true);assert.equal(adapter.snapshot().orders.length,1);
 await Promise.all([older,overlapping]);assert.equal(adapter.snapshot().orders.length,1);assert.equal(adapter.snapshot().wallet.principal,1200);
});
test('ambiguous wallet timeout holds lease through late approval and adapter recreation until receipt recovery',async()=>{
 const f=testnetFixture(),release=f.delaySend(),adapter=f.make({walletRequestTimeoutMs:10});
 assert.equal((await adapter.submit(onchainInput)).code,'RECEIPT_TIMEOUT');assert.equal(adapter.snapshot().writeBlocked,true);
 assert.equal((await adapter.submit(onchainInput)).reason,'WALLET_REQUEST_UNRESOLVED');
 adapter.dispose();const reload=f.make();assert.equal((await reload.deposit(1)).reason,'WALLET_REQUEST_UNRESOLVED');
 assert.equal(f.calls.filter(v=>v.method==='eth_sendTransaction').length,1);
 release();await new Promise(r=>setTimeout(r,10));assert.equal((await reload.submit(onchainInput)).reason,'WALLET_REQUEST_UNRESOLVED');
 assert.equal((await reload.recover()).ok,true);assert.equal(reload.snapshot().writeBlocked,false);
 assert.equal(reload.snapshot().orders.length,1);assert.equal(f.calls.filter(v=>v.method==='eth_sendTransaction').length,1);
});


test('BSC97 recovery falls back to canonical contract state when RPC log index returns empty',async()=>{
 const f=testnetFixture(),adapter=f.make();
 assert.equal((await adapter.submit(onchainInput)).ok,true);f.fill();f.setSuppressLogs(true);
 adapter.dispose();const reloaded=f.make();const recovered=await reloaded.recover();assert.equal(recovered.ok,true);
 assert.equal(reloaded.snapshot().orders[0].orderId,'1');assert.equal(reloaded.snapshot().positions[0].status,'OPEN');
 assert.equal(reloaded.snapshot().receipts.find(r=>r.kind==='ORDER_CREATED').transactionStatus,'RPC_LOG_INDEX_UNAVAILABLE');
 assert.equal(reloaded.snapshot().receipts.find(r=>r.kind==='FILL').transactionStatus,'RPC_LOG_INDEX_UNAVAILABLE');
});
test('manifest-bound capital accounting and claim recovery use candidate ABI; legacy does not invent zeros',async()=>{
 const old=testnetFixture(),legacy=old.make();await legacy.refresh();assert.equal(legacy.snapshot().wallet.claimable,null);
 assert.equal((await legacy.claim('0x'+'dd'.repeat(32))).reason,'CLAIM_NOT_SUPPORTED_BY_DEPLOYMENT');
 const f=testnetFixture({capital:true}),adapter=f.make();f.claimFixture();await adapter.recover();
 assert.equal(adapter.snapshot().wallet.claimable,50);assert.equal(adapter.snapshot().wallet.equity,1050);
 assert.equal(adapter.snapshot().capital.reservedSettlementLiability,250);
 const preview=await adapter.preview(onchainInput);assert.equal(preview.estimatedLiquidationPrice,99.991);
 assert.equal(preview.pnlModel,'INDEX_DELTA_C_LOTS_V1');
 const key=adapter.snapshot().claims[0].key;assert.equal((await adapter.claim(key)).ok,true);
 assert.equal(adapter.snapshot().wallet.free,1050);assert.equal(adapter.snapshot().wallet.claimable,0);
 assert.equal(adapter.snapshot().wallet.equity,1050);assert.equal((await adapter.claim(key)).reason,'CLAIM_NOT_AVAILABLE');
 adapter.dispose();const reload=f.make();await reload.recover();assert.equal(reload.snapshot().wallet.free,1050);
 assert.equal(reload.snapshot().receipts.some(r=>r.kind==='SettlementClaimPaid'),true);
});
test('candidate claims remain actionable when the RPC log index is empty and canonical positions recover',async()=>{
 const f=testnetFixture({capital:true}),adapter=f.make();await adapter.submit(onchainInput);f.fill();f.claimFixture();f.setSuppressLogs(true);
 adapter.dispose();const reload=f.make();assert.equal((await reload.recover()).ok,true);
 assert.equal(reload.snapshot().wallet.claimable,50);assert.equal(reload.snapshot().claims[0].remaining,50);
 assert.equal(reload.snapshot().claims[0].evidence,'CONTRACT_STATE');
 assert.equal(reload.snapshot().receipts.some(r=>r.kind==='SettlementClaimRecorded'),false,'no fabricated event receipt');
});

test('M1 chain97 reads native gas and test token balances without approval and isolates A B reload',async()=>{
 const f=testnetFixture(),request=f.provider.request,other='0x'+'77'.repeat(20),nativeCalls=[],tokenFace=new codec.Interface(TESTNET_EXECUTION_ABI.testToken);
 f.provider.request=async args=>{
  if(args.method==='eth_getBalance'){nativeCalls.push(args.params);return codec.parseUnits(args.params[0].toLowerCase()===WALLET.toLowerCase()?'0.025':'0.05',18).toHexString()}
  if(args.method==='eth_call'&&args.params[0].to===f.deployment.addresses.testToken&&args.params[0].data.startsWith(tokenFace.getSighash('balanceOf'))){const [owner]=tokenFace.decodeFunctionData('balanceOf',args.params[0].data);return tokenFace.encodeFunctionResult('balanceOf',[codec.parseUnits(owner.toLowerCase()===WALLET.toLowerCase()?'5000':'6000',18)])}
  return request(args);
 };
 let adapter=f.make();assert.equal((await adapter.recover()).ok,true);
 assert.equal(adapter.snapshot().account,WALLET);assert.equal(adapter.snapshot().chainId,97);
 assert.equal(adapter.snapshot().wallet.testBnbBalance,'0.025');assert.equal(adapter.snapshot().wallet.testTokenBalance,5000);
 assert.equal(adapter.snapshot().wallet.allowanceWei,'0');assert.equal(f.calls.some(c=>c.method==='eth_sendTransaction'),false);
 f.setAccount(other);assert.equal(adapter.snapshot().wallet,null);assert.equal((await adapter.recover()).ok,true);
 assert.equal(adapter.snapshot().account,other);assert.equal(adapter.snapshot().wallet.testBnbBalance,'0.05');assert.equal(adapter.snapshot().wallet.testTokenBalance,6000);
 adapter.dispose();adapter=f.make();assert.equal((await adapter.recover()).ok,true);assert.equal(adapter.snapshot().account,other);assert.equal(adapter.snapshot().wallet.testBnbBalance,'0.05');
 f.setAccount(WALLET);await adapter.recover();assert.equal(adapter.snapshot().wallet.testBnbBalance,'0.025');assert.equal(adapter.snapshot().wallet.testTokenBalance,5000);
 assert.ok(nativeCalls.length>=4);assert.ok(nativeCalls.every(([,tag])=>tag==='0x2'),'native balance is pinned to the same recovered block');
 f.setChain('0x38');assert.equal((await adapter.recover()).code,'WRONG_CHAIN');assert.equal(adapter.snapshot().wallet,null);
 assert.equal(f.calls.some(c=>c.method==='eth_sendTransaction'),false);
});


test('M1 zero native balance is verified but missing or malformed RPC balance remains unavailable',async()=>{
 for(const native of ['0x0','0x',null,'NaN','0x'+'f'.repeat(65)]){
  const f=testnetFixture(),request=f.provider.request;f.setStale();
  f.provider.request=async args=>args.method==='eth_getBalance'?native:request(args);
  const adapter=f.make(),result=await adapter.recover();
  if(native==='0x0'){assert.equal(result.ok,true);assert.equal(adapter.snapshot().wallet.testBnbBalance,'0.0');assert.equal(adapter.snapshot().status,'ORACLE_STALE')}
  else{assert.equal(result.reason,'INVALID_NATIVE_BALANCE_RESPONSE');assert.equal(adapter.snapshot().wallet,null)}
  assert.equal(f.calls.some(c=>c.method==='eth_sendTransaction'),false);
 }
});

test('M1 late Wallet A native read cannot repaint after B switch and one wei stays exact',async()=>{
 const f=testnetFixture(),request=f.provider.request,other='0x'+'77'.repeat(20),states=[];let release,started;
 const gate=new Promise(r=>{release=r}),entered=new Promise(r=>{started=r});
 f.provider.request=async args=>{if(args.method==='eth_getBalance'){if(args.params[0]===WALLET){started();await gate;return codec.parseUnits('9',18).toHexString()}return '0x1'}return request(args)};
 const adapter=f.make({onState:s=>states.push(s)}),old=adapter.recover();await entered;f.setAccount(other);const marker=states.length;release();await old;
 assert.equal(states.slice(marker).some(s=>s.wallet?.testBnbBalance==='9.0'),false);
 assert.equal((await adapter.recover()).ok,true);assert.equal(adapter.snapshot().account,other);assert.equal(adapter.snapshot().wallet.testBnbBalance,'0.000000000000000001');assert.equal(adapter.snapshot().wallet.testBnbBalanceWei,'1');
 assert.equal(f.calls.some(c=>c.method==='eth_sendTransaction'),false);
});

test('M1 immutable read-only capability rejects every mutation before any provider request',async()=>{
 const f=testnetFixture({capital:true}),adapter=f.make({readOnly:true});
 const forbidden=[];const request=f.provider.request;f.provider.request=async args=>{if(/eth_send|personal_sign|eth_sign|signTypedData/.test(args.method))forbidden.push(args.method);return request(args)};
 for(const action of [()=>adapter.preview(onchainInput),()=>adapter.submit(onchainInput),()=>adapter.submit({...onchainInput,c:100}),()=>adapter.approve(1),()=>adapter.deposit(1),()=>adapter.faucet(),()=>adapter.withdraw(1),()=>adapter.claim('0x'+'dd'.repeat(32)),()=>adapter.close('1'),()=>adapter.cancel('1')]){
  assert.equal((await action()).reason,'M1_READ_ONLY_WALLET');
 }
 assert.equal(f.calls.length,0);assert.deepEqual(forbidden,[]);assert.equal(adapter.readOnly,true);assert.equal(adapter.snapshot().writeBlocked,true);
 assert.equal((await adapter.recover()).ok,true);assert.equal(adapter.snapshot().wallet.testTokenBalance,5000);assert.deepEqual(forbidden,[]);
});
test('legacy EXIT-ONLY preserves owner principal and claim exits but cannot enable any C new risk',async()=>{
 for(const action of ['withdraw','claim','close']){
  const f=testnetFixture({capital:true});if(action==='claim')f.claimFixture();if(action==='close'){const old=f.make();await old.submit(onchainInput);f.fill();old.dispose()}
  const adapter=f.make({exitOnly:true});f.calls.length=0;
  for(const c of [0.001,1,-1,5,100])assert.equal((await adapter.submit({...onchainInput,c})).reason,'LEGACY_EXIT_ONLY_NO_NEW_RISK');
  for(const method of ['approve','deposit','faucet'])assert.equal((await adapter[method](1)).reason,'LEGACY_EXIT_ONLY_NO_NEW_RISK');
  assert.equal(f.calls.length,0,'new-risk and funding capabilities reject before RPC');
  const result=await(action==='withdraw'?adapter.withdraw(1):action==='claim'?adapter.claim('0x'+'dd'.repeat(32)):adapter.close('1'));
  assert.equal(result.ok,true,action+': '+result.reason);
 }
});
test('aged non-capital EXIT-ONLY verifies pinned principal without claiming an empty financial history',async()=>{
 const f=testnetFixture({height:2000002}),request=f.provider.request,tag='0x'+(2000002).toString(16);
 const faces=Object.fromEntries(Object.entries(TESTNET_EXECUTION_ABI).map(([k,v])=>[f.deployment.addresses[k].toLowerCase(),new codec.Interface(v)]));
 const principal=9007199254740993000000000000000001n,locked=1n,allowed=new Set(['kgen','brainSettlement','executor','engine','brain','decimals','SETTLEMENT_ROLE','hasRole','balanceOf','principalOf','lockedPrincipalOf','availablePrincipal']);let observedReads=0;
 f.provider.request=async args=>{
  observedReads++;
  assert.ok(!['eth_getLogs','eth_getTransactionReceipt','eth_sendTransaction','eth_estimateGas'].includes(args.method),'principal reads neither history nor a financial request');
  if(args.method==='eth_getCode')assert.equal(args.params[1],tag);
  if(args.method==='eth_getStorageAt')assert.equal(args.params[2],tag);
  if(args.method==='eth_getBalance')assert.equal(args.params[1],tag);
  if(args.method==='eth_call'){
   const face=faces[args.params[0].to.toLowerCase()],parsed=face.parseTransaction(args.params[0]);assert.ok(allowed.has(parsed.name));assert.equal(args.params[1],tag);
   if(['principalOf','lockedPrincipalOf','availablePrincipal'].includes(parsed.name)){
    assert.equal(parsed.args[0].toLowerCase(),WALLET.toLowerCase());
    return face.encodeFunctionResult(parsed.name,[parsed.name==='principalOf'?principal:parsed.name==='lockedPrincipalOf'?locked:principal-locked]);
   }
  }
  return request(args);
 };
 const adapter=f.make({exitOnly:true}),result=await adapter.recover();assert.equal(result.ok,true,result.reason);assert.equal(observedReads,26,'fixed26 requests include all principal reads');assert.equal(f.calls.length,23);
 const s=adapter.snapshot();assert.equal(s.status,'LEGACY_PRINCIPAL_VERIFIED');assert.equal(s.readScope,'LEGACY_PRINCIPAL_ONLY');assert.equal(s.wallet.readScope,s.readScope);assert.equal(s.balanceStatus,'VERIFIED');
 assert.equal(s.wallet.principalWei,String(principal));assert.equal(s.wallet.lockedWei,'1');assert.equal(s.wallet.availableWei,String(principal-locked));assert.equal(s.block,2000002);assert.equal(s.blockHash,'0x'+'bb'.repeat(32));
 assert.equal(s.historyStatus,'INDEXER_REQUIRED');assert.equal(s.historyError,'RECOVERY_HISTORY_REQUIRES_INDEXER');
 for(const key of ['ordersStatus','positionsStatus','pnlStatus','claimsStatus','oracleStatus'])assert.equal(s[key],'UNKNOWN',key);
 for(const key of ['equity','unrealizedPnl','realizedPnl','claimable','allowance','allowanceWei','allowanceUnlimited'])assert.equal(s.wallet[key],null,key);
 for(const key of ['orders','positions','receipts','claims'])assert.deepEqual(s[key],[]);assert.deepEqual(s.observations,{});assert.equal(s.capital,null);
});
test('principal recovery requires aged EXIT-ONLY and preserves both full-history bounds',async()=>{
 for(const capital of [false,true]){
  const f=testnetFixture({capital,height:2000002}),adapter=f.make();
  assert.equal((await adapter.recover()).reason,'RECOVERY_HISTORY_REQUIRES_INDEXER');assert.equal(adapter.snapshot().wallet,null);assert.notEqual(adapter.snapshot().readScope,'LEGACY_PRINCIPAL_ONLY');
 }
 const boundary=testnetFixture({height:2000001}),within=boundary.make({exitOnly:true});assert.equal((await within.recover()).ok,true);assert.ok(boundary.calls.some(c=>c.method==='eth_getLogs'),'exact2m still uses the original full path');
 const upper=testnetFixture(),request=upper.provider.request,trigger=new codec.Interface(TESTNET_EXECUTION_ABI.orderTriggerEngine);let enumerated=0;
 upper.provider.request=async args=>{if(args.method==='eth_call'&&args.params[0].to===upper.deployment.addresses.orderTriggerEngine){const parsed=trigger.parseTransaction(args.params[0]);if(parsed.name==='nextOrderId')return trigger.encodeFunctionResult(parsed.name,[10002]);if(parsed.name==='order')enumerated++}return request(args)};
 const limited=upper.make({exitOnly:true});assert.equal((await limited.recover()).reason,'RECOVERY_HISTORY_REQUIRES_INDEXER');assert.equal(enumerated,0);assert.equal(limited.snapshot().wallet,null);
 const m1=testnetFixture({height:2000002}).make({readOnly:true});assert.equal((await m1.recover()).ok,true);assert.equal(m1.snapshot().readScope,'BALANCES_ONLY');assert.equal(m1.snapshot().wallet.principalWei,null);
});
test('aged capital-capable EXIT-ONLY preserves manifest capabilities while exposing only pinned principal and withdrawal',async()=>{
 const f=testnetFixture({capital:true,height:2000002});Object.assign(f.deployment.capabilities,{reservedSettlementLiability:true,playerClaimable:true,withdraw:true});
 const originalCapabilities=structuredClone(f.deployment.capabilities),adapter=f.make({exitOnly:true}),tag='0x'+(2000002).toString(16);
 assert.equal((await adapter.recover()).ok,true);assert.equal(f.calls.length,26);const before=adapter.snapshot();
 assert.equal(before.status,'LEGACY_PRINCIPAL_VERIFIED');assert.equal(before.wallet.principalWei,codec.parseEther('1000').toString());assert.equal(before.wallet.availableWei,codec.parseEther('1000').toString());assert.equal(before.historyStatus,'INDEXER_REQUIRED');
 for(const key of ['ordersStatus','positionsStatus','pnlStatus','claimsStatus','oracleStatus'])assert.equal(before[key],'UNKNOWN',key);
 assert.equal(before.capital,null);assert.equal(before.wallet.claimable,null);assert.equal(before.wallet.equity,null);
 for(const call of f.calls){if(call.method==='eth_call'||call.method==='eth_getCode'||call.method==='eth_getBalance')assert.equal(call.params[1],tag);if(call.method==='eth_getStorageAt')assert.equal(call.params[2],tag)}
 f.calls.length=0;for(const action of [()=>adapter.close('1'),()=>adapter.cancel('1'),()=>adapter.claim('0x'+'dd'.repeat(32))])assert.equal((await action()).reason,'LEGACY_PRINCIPAL_ONLY_WITHDRAW_REQUIRED');
 assert.equal(f.calls.some(c=>/eth_send|eth_estimateGas/.test(c.method)),false);
 const result=await adapter.withdraw(1);assert.equal(result.ok,true,result.reason);const after=adapter.snapshot();assert.equal(after.wallet.availableWei,codec.parseEther('999').toString());assert.equal(after.historyStatus,'INDEXER_REQUIRED');assert.equal(after.transaction.status,'RECEIPT_CONFIRMED');assert.equal(after.writeBlocked,false);
 assert.equal(f.calls.some(c=>c.method==='eth_getLogs'),false);const sends=f.calls.filter(c=>c.method==='eth_sendTransaction');assert.equal(sends.length,1);const tx=sends[0].params[0];assert.equal(tx.to,f.deployment.addresses.brainProxy);assert.equal(tx.chainId,'0x61');assert.equal(tx.value,'0x0');assert.equal(BigInt(tx.gas),(0x20000n*12n+9n)/10n);assert.equal(new codec.Interface(TESTNET_EXECUTION_ABI.brainProxy).parseTransaction(tx).name,'withdrawMargin');assert.equal(f.calls.filter(c=>c.method==='eth_estimateGas').length,1);assert.deepEqual(f.deployment.capabilities,originalCapabilities);
 const m1=testnetFixture({capital:true,height:2000002}).make({readOnly:true});assert.equal((await m1.recover()).ok,true);assert.equal(m1.snapshot().readScope,'BALANCES_ONLY');assert.equal(m1.snapshot().wallet.principalWei,null);assert.equal((await m1.withdraw(1)).reason,'M1_READ_ONLY_WALLET');
});
test('aged principal recovery rejects inconsistent balances, deployment mismatches and noncanonical pins',async()=>{
 const faults={available:'PRINCIPAL_BALANCE_MISMATCH',locked:'PRINCIPAL_BALANCE_MISMATCH',native:'INVALID_NATIVE_BALANCE_RESPONSE',code:'DEPLOYMENT_CODE_MISMATCH',proxy:'PROXY_IMPLEMENTATION_MISMATCH',link:'DEPLOYMENT_LINK_MISMATCH',pin:'RECOVERY_BLOCK_UNVERIFIED',reorg:'RECOVERY_BLOCK_CHANGED'};
 for(const [fault,expected]of Object.entries(faults)){
  const f=testnetFixture({height:2000002}),request=f.provider.request,brain=new codec.Interface(TESTNET_EXECUTION_ABI.brainProxy);let headers=0;
  f.provider.request=async args=>{
   if(fault==='native'&&args.method==='eth_getBalance')return 'unknown';
   if(fault==='code'&&args.method==='eth_getCode')return '0x6001';
   if(fault==='proxy'&&args.method==='eth_getStorageAt')return '0x'+'00'.repeat(32);
   if(args.method==='eth_call'&&args.params[0].to===f.deployment.addresses.brainProxy){const parsed=brain.parseTransaction(args.params[0]);
    if(fault==='available'&&parsed.name==='availablePrincipal')return brain.encodeFunctionResult(parsed.name,[1]);
    if(fault==='locked'&&parsed.name==='lockedPrincipalOf')return brain.encodeFunctionResult(parsed.name,[codec.parseEther('1001')]);
    if(fault==='link'&&parsed.name==='kgen')return brain.encodeFunctionResult(parsed.name,['0x'+'77'.repeat(20)]);
   }
   const value=await request(args);
   if(args.method==='eth_getBlockByNumber'){headers++;if(fault==='pin')return {...value,number:'0x1'};if(fault==='reorg'&&headers===2)return {...value,hash:'0x'+'99'.repeat(32)}}
   return value;
  };
  const adapter=f.make({exitOnly:true});assert.equal((await adapter.recover()).reason,expected,fault);assert.equal(adapter.snapshot().wallet,null,fault);assert.equal(adapter.snapshot().balanceStatus,'UNKNOWN',fault);assert.equal(f.calls.some(c=>c.method==='eth_sendTransaction'),false);
 }
});
test('aged principal reads fence wrong identity, A B A changes and failed rereads without retaining stale balances',async()=>{
 for(const missing of ['account','chain']){const f=testnetFixture({height:2000002});if(missing==='account')f.setAccount(null);else f.setChain('0x38');const adapter=f.make({exitOnly:true});assert.equal((await adapter.recover()).code,missing==='account'?'DISCONNECTED':'WRONG_CHAIN');assert.equal(adapter.snapshot().wallet,null)}
 const f=testnetFixture({height:2000002}),request=f.provider.request,release=f.delayRead();let entered;const started=new Promise(resolve=>{entered=resolve});
 const brain=new codec.Interface(TESTNET_EXECUTION_ABI.brainProxy);f.provider.request=args=>{if(args.method==='eth_call'&&args.params[0].to===f.deployment.addresses.brainProxy&&brain.parseTransaction(args.params[0]).name==='principalOf')entered();return request(args)};
 const adapter=f.make({exitOnly:true}),old=adapter.recover();await started;f.setAccount('0x'+'77'.repeat(20));f.setAccount(WALLET);release();assert.equal((await old).superseded,true,'the existing revision fence discards the old account read');assert.equal(adapter.snapshot().wallet,null);
 assert.equal((await adapter.recover()).ok,true);f.provider.request=args=>{if(args.method==='eth_getBalance')throw Error('RPC_UNAVAILABLE');return request(args)};
 assert.equal((await adapter.recover()).ok,false);assert.equal(adapter.snapshot().wallet,null);assert.equal(adapter.snapshot().balanceStatus,'UNKNOWN');
 const zero=testnetFixture({height:2000002});zero.setAmount(0);const empty=zero.make({exitOnly:true});assert.equal((await empty.recover()).ok,true);assert.equal(empty.snapshot().wallet.availableWei,'0');assert.equal(empty.snapshot().balanceStatus,'VERIFIED');
});
test('aged principal scope permits only available withdrawal and preserves its canonical receipt and lease boundary',async()=>{
 const f=testnetFixture({height:2000002});f.fill();const adapter=f.make({exitOnly:true});assert.equal((await adapter.recover()).ok,true);assert.equal(adapter.snapshot().wallet.availableWei,codec.parseEther('998').toString());f.calls.length=0;
 for(const action of [()=>adapter.submit(onchainInput),()=>adapter.approve(1),()=>adapter.deposit(1),()=>adapter.faucet()])assert.equal((await action()).reason,'LEGACY_EXIT_ONLY_NO_NEW_RISK');assert.equal(f.calls.length,0);
 for(const action of [()=>adapter.close('1'),()=>adapter.cancel('1'),()=>adapter.claim('0x'+'dd'.repeat(32))])assert.equal((await action()).reason,'LEGACY_PRINCIPAL_ONLY_WITHDRAW_REQUIRED');
 assert.equal((await adapter.withdraw(999)).code,'INSUFFICIENT_MARGIN');assert.equal(f.calls.some(c=>c.method==='eth_sendTransaction'),false);
 const result=await adapter.withdraw(100);assert.equal(result.ok,true,result.reason);const s=adapter.snapshot();assert.equal(s.wallet.principalWei,codec.parseEther('900').toString());assert.equal(s.wallet.availableWei,codec.parseEther('898').toString());assert.equal(s.wallet.lockedWei,codec.parseEther('2').toString());
 assert.equal(s.status,'LEGACY_PRINCIPAL_VERIFIED');assert.equal(s.historyStatus,'INDEXER_REQUIRED');assert.equal(s.transaction.status,'RECEIPT_CONFIRMED');assert.equal(s.transaction.method,'withdrawMargin');assert.equal(s.writeBlocked,false);
 const sends=f.calls.filter(c=>c.method==='eth_sendTransaction');assert.equal(sends.length,1);assert.equal(new codec.Interface(TESTNET_EXECUTION_ABI.brainProxy).parseTransaction(sends[0].params[0]).name,'withdrawMargin');assert.ok(f.calls.some(c=>c.method==='eth_estimateGas'));assert.equal(f.calls.some(c=>c.method==='eth_getLogs'),false);
 const fresh=testnetFixture({height:2000002}),withoutRecovery=fresh.make({exitOnly:true});assert.equal((await withoutRecovery.close('1')).reason,'LEGACY_PRINCIPAL_ONLY_WITHDRAW_REQUIRED');assert.equal(fresh.calls.some(c=>c.method==='eth_sendTransaction'),false);
});
test('a confirmed legacy withdrawal remains confirmed when its later principal reread fails',async()=>{
 const f=testnetFixture({height:2000002}),request=f.provider.request,brain=new codec.Interface(TESTNET_EXECUTION_ABI.brainProxy);let mined=false;
 f.provider.request=async args=>{if(mined&&args.method==='eth_call'&&args.params[0].to===f.deployment.addresses.brainProxy&&brain.parseTransaction(args.params[0]).name==='principalOf')throw Error('RPC_UNAVAILABLE');const value=await request(args);if(args.method==='eth_getTransactionReceipt'&&value)mined=true;return value};
 const adapter=f.make({exitOnly:true});assert.equal((await adapter.recover()).ok,true);assert.equal((await adapter.withdraw(1)).ok,true);
 let s=adapter.snapshot();assert.equal(s.status,'LEGACY_PRINCIPAL_RECHECK_REQUIRED');assert.equal(s.wallet,null);assert.equal(s.account,null);assert.equal(s.balanceStatus,'UNKNOWN');assert.equal(s.transaction.status,'RECEIPT_CONFIRMED');assert.equal(s.writeBlocked,false);
 assert.equal(s.transaction.account,WALLET);assert.equal(s.transaction.chainId,97);assert.equal(s.transaction.deploymentContext,'97:'+f.deployment.addresses.brainProxy.toLowerCase());assert.equal(s.transaction.to,f.deployment.addresses.brainProxy);
 assert.equal((await adapter.recover()).ok,false);s=adapter.snapshot();assert.equal(s.transaction.status,'RECEIPT_CONFIRMED');assert.equal(s.wallet,null);
 assert.equal((await adapter.withdraw(1)).ok,false);assert.equal(f.calls.filter(c=>c.method==='eth_sendTransaction').length,1,'failed rereads never resend the confirmed withdrawal');
 f.setAccount('0x'+'77'.repeat(20));s=adapter.snapshot();assert.equal(s.account,null);assert.equal(s.wallet,null);assert.equal(s.balanceStatus,'UNKNOWN');assert.equal(s.transaction,null,'a different wallet cannot inherit the earlier receipt attribution');
});
test('final legacy withdrawal session gate rejects A B A during awaited identity before any wallet request',async()=>{
 const f=testnetFixture({height:2000002}),request=f.provider.request;let finalGate=false,injected=false;
 f.provider.request=async args=>{
  if(args.method==='eth_estimateGas'){const result=await request(args);finalGate=true;return result}
  if(args.method==='eth_accounts'&&finalGate&&!injected){injected=true;f.setAccount('0x'+'77'.repeat(20));f.setAccount(WALLET)}
  return request(args);
 };
 const adapter=f.make({exitOnly:true});assert.equal((await adapter.recover()).ok,true);f.calls.length=0;
 assert.equal((await adapter.withdraw(1)).code,'DISCONNECTED');assert.equal(injected,true,'the account events occur during the final awaited identity after gas estimation');
 assert.equal(f.calls.filter(c=>c.method==='eth_estimateGas').length,1);assert.equal(f.calls.some(c=>/eth_send|personal_sign|eth_sign|signTypedData/.test(c.method)),false);
 const s=adapter.snapshot();assert.equal(s.wallet,null);assert.equal(s.account,null);assert.equal(s.balanceStatus,'UNKNOWN');assert.equal(s.transaction,null);
});
test('aged principal recovery cannot clear an unresolved or noncanonical withdrawal lease',async()=>{
 const f=testnetFixture({height:2000002}),request=f.provider.request,release=f.delaySend();let corrupt=true;
 f.provider.request=async args=>{const value=await request(args);return args.method==='eth_getTransactionReceipt'&&value&&corrupt?{...value,blockHash:'0x'+'99'.repeat(32)}:value};
 const adapter=f.make({exitOnly:true,walletRequestTimeoutMs:10});assert.equal((await adapter.recover()).ok,true);assert.equal((await adapter.withdraw(1)).code,'RECEIPT_TIMEOUT');assert.equal(adapter.snapshot().writeBlocked,true);
 release();await new Promise(resolve=>setTimeout(resolve,10));assert.equal((await adapter.recover()).ok,true);assert.equal(adapter.snapshot().writeBlocked,true,'a noncanonical mined receipt cannot clear the lease');
 assert.equal((await adapter.withdraw(1)).reason,'WALLET_REQUEST_UNRESOLVED');assert.equal(f.calls.filter(c=>c.method==='eth_sendTransaction').length,1);
 corrupt=false;assert.equal((await adapter.recover()).ok,true);assert.equal(adapter.snapshot().writeBlocked,false);assert.equal(adapter.snapshot().wallet.principalWei,codec.parseEther('999').toString());assert.equal(f.calls.filter(c=>c.method==='eth_sendTransaction').length,1);
});
test('read-only recovery cannot consume a legacy unresolved lease or mutate its recovered cache',async()=>{
 const f=testnetFixture(),release=f.delaySend(),legacy=f.make({walletRequestTimeoutMs:10});
 assert.equal((await legacy.submit(onchainInput)).code,'RECEIPT_TIMEOUT');release();await new Promise(r=>setTimeout(r,10));
 const before=JSON.stringify(legacy.snapshot()),view=f.make({readOnly:true});assert.equal((await view.recover()).ok,true);
 assert.equal(JSON.stringify(legacy.snapshot()),before,'legacy cache and lease remain byte-for-byte unchanged');
 assert.equal(legacy.snapshot().writeBlocked,true);assert.equal((await legacy.submit(onchainInput)).reason,'WALLET_REQUEST_UNRESOLVED');
 assert.equal((await legacy.recover()).ok,true);assert.equal(legacy.snapshot().writeBlocked,false);
 assert.equal(f.calls.filter(c=>c.method==='eth_sendTransaction').length,1);
});


test('M1 fan-out account events fence operations without erasing an inactive legacy receipt cache',async()=>{
 const f=testnetFixture(),legacy=f.make({exitOnly:true});f.settledOrders(1);await legacy.recover();
 const before=JSON.stringify(legacy.snapshot());legacy.setDisplayActive(false);
 const view=f.make({readOnly:true});await view.recover();f.setAccount('0x'+'77'.repeat(20));await view.recover();
 assert.equal(JSON.stringify(legacy.snapshot()),before,'inactive legacy book remains byte-for-byte unchanged');
 assert.notEqual(view.snapshot().account,legacy.snapshot().account);assert.equal(f.calls.some(c=>c.method==='eth_sendTransaction'),false);
 legacy.setDisplayActive(true);await legacy.recover();assert.equal(legacy.snapshot().account,'0x'+'77'.repeat(20));
});


test('M1 pinned recovery exposes canonical block hash and rejects a reorg during reads',async()=>{
 const f=testnetFixture(),view=f.make({readOnly:true});await view.recover();assert.equal(view.snapshot().blockHash,'0x'+'bb'.repeat(32));
 const g=testnetFixture(),request=g.provider.request;let reads=0;
 g.provider.request=async args=>{const result=await request(args);if(args.method==='eth_getBlockByNumber'&&++reads>1)return {...result,hash:'0x'+'99'.repeat(32)};return result};
 const changed=g.make({readOnly:true});assert.equal((await changed.recover()).reason,'RECOVERY_BLOCK_CHANGED');assert.equal(changed.snapshot().wallet,null);assert.equal(g.calls.some(c=>c.method==='eth_sendTransaction'),false);
});

test('M1 balances-only recovery has a fixed RPC bound and never enumerates financial history',async()=>{
 const f=testnetFixture({capital:true}),request=f.provider.request,allowed=new Set(['kgen','brainSettlement','executor','engine','brain','decimals','SETTLEMENT_ROLE','hasRole','balanceOf']);
 const faces=Object.fromEntries(Object.entries(TESTNET_EXECUTION_ABI).map(([k,v])=>[f.deployment.addresses[k].toLowerCase(),new codec.Interface([...v,...(CAPITAL_EXECUTION_ABI[k]||[])]) ]));
 f.provider.request=async args=>{assert.ok(!['eth_getLogs','eth_getTransactionReceipt'].includes(args.method),'no history RPC');if(args.method==='eth_call'){const name=faces[args.params[0].to.toLowerCase()].parseTransaction(args.params[0]).name;assert.ok(allowed.has(name),'no financial state enumeration '+name);assert.equal(args.params[1],'0x2')}if(args.method==='eth_getCode')assert.equal(args.params[1],'0x2');if(args.method==='eth_getStorageAt')assert.equal(args.params[2],'0x2');return request(args)};
 const view=f.make({readOnly:true});for(let i=0;i<2;i++){const before=f.calls.length;assert.equal((await view.recover()).ok,true);assert.equal(f.calls.length-before,23,'fixed23 RPC requests per successful recovery');}
 const s=view.snapshot();assert.equal(s.readScope,'BALANCES_ONLY');assert.equal(s.balanceStatus,'VERIFIED');for(const key of ['historyStatus','positionsStatus','pnlStatus','claimsStatus','oracleStatus'])assert.equal(s[key],'NOT_REQUESTED');
 for(const key of ['free','principal','lockedMargin','unrealizedPnl','realizedPnl','claimable','withdrawable','equity'])assert.equal(s.wallet[key],null);assert.deepEqual(s.receipts,[]);assert.equal(s.capital,null);
});

test('M1 failed balance reread clears prior value to UNKNOWN and keeps a verified zero distinct',async()=>{
 for(const method of ['eth_getBalance','eth_call']){
  const f=testnetFixture(),request=f.provider.request,view=f.make({readOnly:true});assert.equal((await view.recover()).ok,true);
  f.provider.request=async args=>{if(args.method===method)throw Error('RPC_UNAVAILABLE');return request(args)};
  assert.equal((await view.recover()).ok,false);assert.equal(view.snapshot().wallet,null);assert.equal(view.snapshot().balanceStatus,'UNKNOWN');assert.equal(view.snapshot().historyStatus,'NOT_REQUESTED');
 }
 const f=testnetFixture(),request=f.provider.request;f.provider.request=args=>args.method==='eth_getBalance'?'0x0':request(args);const view=f.make({readOnly:true});assert.equal((await view.recover()).ok,true);assert.equal(view.snapshot().wallet.testBnbBalanceWei,'0');assert.equal(view.snapshot().balanceStatus,'VERIFIED');
});

test('M1 balances-only A B reload and A B A fencing retain one canonical account',async()=>{
 const f=testnetFixture(),request=f.provider.request,other='0x'+'77'.repeat(20);let release,entered;
 const gate=new Promise(r=>{release=r}),started=new Promise(r=>{entered=r});let delay=false;
 f.provider.request=async args=>{if(args.method==='eth_getBalance'){if(delay){entered();await gate;}return args.params[0].toLowerCase()===WALLET.toLowerCase()?'0x1':'0x2'}return request(args)};
 let view=f.make({readOnly:true});await view.recover();assert.equal(view.snapshot().wallet.testBnbBalanceWei,'1');f.setAccount(other);await view.recover();assert.equal(view.snapshot().wallet.testBnbBalanceWei,'2');view.dispose();view=f.make({readOnly:true});await view.recover();assert.equal(view.snapshot().account,other);
 delay=true;const old=view.recover();await started;f.setAccount(WALLET);f.setAccount(other);release();assert.equal((await old).superseded,true);assert.equal(view.snapshot().wallet,null);delay=false;await view.recover();assert.equal(view.snapshot().account,other);assert.equal(view.snapshot().wallet.testBnbBalanceWei,'2');
});

// Human P0: public quote availability must not disable explicit local simulation.
for(const [axis,market] of [['KX','BTCUSDT'],['KY','ETHUSDT'],['KZ','BNBUSDT']])for(const c of [1,-1])test(`offline SIMULATION ${market} ${c>0?'LONG':'SHORT'} reuses pending/fill/PnL/close history without providers`,()=>{
 const ledger=createKgenLedger(100),provider=new Proxy({}, {get(){throw new Error('SIMULATION_PROVIDER_ACCESS')}});
 const adapter=createExecutionAdapter({ledger,productV1:true,simulationFallback:true,ethereum:provider,ethers:provider,wallet:provider});
 const now=20000,input={axis,market,c,lots:2,triggerPrice:{BTCUSDT:100000,ETHUSDT:4000,BNBUSDT:600}[market]};
 const before=structuredClone(ledger),p=adapter.preview(input,{now});assert.equal(p.ok,true);assert.equal(p.priceSource,'K11520_DETERMINISTIC_SIMULATION');assert.deepEqual(ledger,before,'preview stays pure');
 assert.equal(adapter.submit(input,{now}).ok,true);assert.equal(adapter.snapshot().orders[0].status,'PENDING');assert.equal(ledger.lockedMargin,0);
 assert.equal(adapter.tick({now:now+1000}).ok,true);let book=adapter.snapshot();assert.equal(book.orders[0].status,'FILLED');assert.equal(book.positions[0].status,'OPEN');assert.equal(ledger.lockedMargin,2);
 adapter.tick({now:now+(c>0?4000:68000)});book=adapter.snapshot();assert.ok(ledger.unrealizedPnl>0);assert.equal(book.positions[0].status,'OPEN');
 const closed=adapter.close(book.positions[0].positionId,{now:now+(c>0?5000:69000)});assert.equal(closed.ok,true);assert.equal(closed.receipt.status,'CLOSED');assert.equal(closed.receipt.priceSource,'K11520_DETERMINISTIC_SIMULATION');assert.ok(ledger.realizedPnl>0);assert.equal(ledger.lockedMargin,0);
 assert.equal(adapter.snapshot().receipts.length,2);assert.ok(adapter.snapshot().receipts.every(r=>r.simulationOnly&&r.priceSource==='K11520_DETERMINISTIC_SIMULATION'));
});

test('verified public simulation freezes offline and resumes only on accepted provider observations',()=>{
 const ledger=createKgenLedger(100);
 let saves=0;
 const adapter=createExecutionAdapter({ledger,productV1:true,verifiedPublicQuotes:true,simulationFallback:true,afterMutation:()=>saves++});
 const input={axis:'KX',market:'BTCUSDT',c:1,lots:2,currentPrice:99999,triggerPrice:75000};
 const publicQuote=(price,observedAt,sequence,changes={})=>({
   market:'BTCUSDT',price,observedAt,sequence,source:PUBLIC_MARKET_QUOTE_SOURCE.id,now:observedAt,...changes,
 });
 const initial=structuredClone(ledger);
 assert.equal(adapter.preview(input,{now:1000}).code,'ORACLE_STALE');
 assert.equal(adapter.submit(input,{now:1000}).code,'ORACLE_STALE');
 assert.deepEqual(adapter.tick({now:1000}).events,[]);
 assert.deepEqual(ledger,initial);
 assert.equal(saves,0);
 for(const changes of [
   {source:SIMULATION_PRICE_SOURCE},
   {source:undefined},
   {sequence:undefined},
   {sequence:'4'},
   {observedAt:1001},
   {observedAt:undefined},
   {price:'75000'},
 ])assert.equal(adapter.observe(publicQuote(75000,1000,4,changes)).ok,false);
 assert.deepEqual(ledger,initial);
 assert.equal(saves,0);

 assert.equal(adapter.observe(publicQuote(75000,1000,4)).ok,true);
 const review=adapter.preview(input,{now:1000});
 assert.equal(review.currentPrice,75000);
 assert.equal(review.intent.currentPrice,75000);
 assert.equal(review.priceObservedAt,1000);
 assert.equal(adapter.submit(input,{now:1000}).status,'PENDING_TRIGGER');
 const beforeFill=structuredClone(ledger);
 assert.equal(adapter.observe(publicQuote(75001,999,5,{now:1000})).code,'ORACLE_STALE');
 assert.equal(adapter.observe(publicQuote(75001,1000,4)).code,'ORACLE_STALE');
 assert.deepEqual(ledger,beforeFill);
 const fill=adapter.observe(publicQuote(75000,1000,5));
 assert.equal(fill.ok,true,fill.reason);
 assert.equal(fill.events[0].fillPrice,75000);
 const positionId=fill.events[0].positionId;
 const beforeOffline=structuredClone(ledger),beforeOfflineSaves=saves;
 assert.equal(adapter.close(positionId,{now:16001}).code,'ORACLE_STALE');
 assert.deepEqual(adapter.tick({now:16001}).events,[]);
 assert.deepEqual(ledger,beforeOffline);
 assert.equal(saves,beforeOfflineSaves);
 assert.equal(adapter.observe(publicQuote(85000,16002,6)).ok,true);
 const close=adapter.close(positionId,{now:16002});
 assert.equal(close.ok,true,close.reason);
 assert.equal(close.receipt.realizedPnl,2);
 assert.equal(close.receipt.priceSource,PUBLIC_MARKET_QUOTE_SOURCE.id);
 assert.equal(ledger.free,102);
});

test('verified public simulation holds historical synthetic risk and preserves cancellation and independent markets',()=>{
 const ledger=createKgenLedger(100);
 const adapter=createExecutionAdapter({ledger,productV1:true,verifiedPublicQuotes:true});
 const source=PUBLIC_MARKET_QUOTE_SOURCE.id;
 const btc={market:'BTCUSDT',price:75000,observedAt:1000,sequence:1,source,now:1000};
 const input={axis:'KX',market:'BTCUSDT',c:1,lots:1,currentPrice:75000,triggerPrice:75000};
 assert.equal(adapter.observe(btc).ok,true);
 const first=adapter.submit(input,{now:1000});
 assert.equal(first.ok,true,first.reason);
 ledger.simulation.orders[0].executionPriceSource=SIMULATION_PRICE_SOURCE;
 const held=structuredClone(ledger);
 const later={...btc,price:85000,observedAt:1100,sequence:2,now:1100};
 assert.throws(()=>adapter.quote('BTCUSDT',{now:1100}),/SIMULATION_RECOVERY_REQUIRED/);
 assert.equal(adapter.observe(later).reason,'SIMULATION_RECOVERY_REQUIRED');
 assert.deepEqual(ledger,held);
 assert.equal(adapter.observe({...later,market:'ETHUSDT',price:4000}).ok,true);
 assert.equal(adapter.cancel(first.order.orderId).ok,true);
 assert.equal(adapter.observe(later).ok,true);

 const second=adapter.submit({...input,triggerPrice:85000},{now:1100});
 assert.equal(second.ok,true,second.reason);
 const filled=adapter.observe({...later,observedAt:1200,sequence:3,now:1200});
 assert.equal(filled.ok,true,filled.reason);
 const positionId=filled.events[0].positionId;
 const position=ledger.simulation.positions[0];
 for(const key of ['priceSource','markPriceSource']){
   const provenance=position[key];
   position[key]=SIMULATION_PRICE_SOURCE;
   const before=structuredClone(ledger);
   assert.equal(adapter.observe({...later,observedAt:1300,sequence:4,now:1300}).reason,'SIMULATION_RECOVERY_REQUIRED');
   assert.equal(adapter.close(positionId,{now:1300}).reason,'SIMULATION_RECOVERY_REQUIRED');
   assert.deepEqual(ledger,before);
   position[key]=provenance;
 }
});

test('verified public simulation can replace an idle synthetic observation without using it to cross an order',()=>{
 const ledger=createKgenLedger(100);
 const legacy=createExecutionAdapter({ledger,simulationFallback:true});
 assert.equal(legacy.tick({now:100000}).ok,true);
 const adapter=createExecutionAdapter({ledger,verifiedPublicQuotes:true});
 assert.throws(()=>adapter.quote('BTCUSDT',{now:100000}),/PUBLIC_QUOTE_SOURCE_REQUIRED/);
 const result=adapter.observe({market:'BTCUSDT',price:75000,observedAt:99990,now:100000,sequence:1,
   source:PUBLIC_MARKET_QUOTE_SOURCE.id});
 assert.equal(result.ok,true,result.reason);
 assert.deepEqual(result.events,[]);
 const snapshot=adapter.snapshot();
 assert.equal(snapshot.observations.BTCUSDT.price,75000);
 assert.equal(snapshot.observations.ETHUSDT.source,SIMULATION_PRICE_SOURCE);
 assert.deepEqual(snapshot.orders,[]);
 assert.deepEqual(snapshot.receipts,[]);
});

test('Android HTTP preview requires the server marker on a private host and uses same-origin admission',async()=>{
 const origin='http://192.168.1.108:11520';
 const location=new URL(origin+'/?preview=server&world=12682');
 const shell={querySelector:selector=>selector==='meta[name="k11520-private-preview"]'?{content:'lan'}:null};
 assert.equal(k11520ServerPreviewType(location,shell),'lan');
 assert.equal(k11520ServerPreviewType(location,{querySelector:()=>null}),null);
 assert.equal(k11520ServerPreviewType(new URL(origin+'/?world=12682'),shell),null);
 assert.equal(k11520ServerPreviewType(new URL('http://172.32.0.42:11520/?preview=server'),shell),null);
 assert.equal(k11520ServerPreviewType(new URL('http://127.0.0.1:11520/?preview=server')),'loopback');
 const webCrypto={getRandomValues:bytes=>bytes.fill(0xc7)};
 assert.equal(createK11520PreviewRequestId(webCrypto),'c7'.repeat(16));
 assert.throws(()=>createK11520PreviewRequestId({}),/SECURE_RANDOM_UNAVAILABLE/);
 assert.throws(()=>createPreviewSimulationExecutionAdapter({origin}),/LOCAL_PREVIEW_ORIGIN_REQUIRED/);
 assert.throws(()=>createPreviewSimulationExecutionAdapter({origin:'http://203.0.113.1:11520',lanPreview:true}),/LOCAL_PREVIEW_ORIGIN_REQUIRED/);

 const saved=new Map(),requests=[];
 const adapter=createPreviewSimulationExecutionAdapter({
   origin,lanPreview:true,
   storage:{getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)},
   fetchImpl:async(url,options)=>{
     assert.equal(new URL(url).origin,origin);
     assert.equal(options.credentials,'same-origin');
     assert.equal(options.mode,'same-origin');
     const path=new URL(url).pathname;
     requests.push(path);
     const replies={
       '/api/v1/markets':{observations:{},statuses:{}},
       '/api/v1/login':{ok:true,token:'a'.repeat(48),player:{id:'wifi-demo'}},
       '/api/v1/orders':{ok:true,mode:'SIMULATION_WALLET',wallet:{free:10},orders:[],positions:[],receipts:[],observations:{}},
     };
     assert.ok(Object.hasOwn(replies,path));
     return {status:200,ok:true,json:async()=>replies[path]};
   },
 });
 assert.equal((await adapter.refresh()).ok,true);
 assert.deepEqual(requests.sort(),['/api/v1/login','/api/v1/markets','/api/v1/orders']);
});

test('local preview restores one server identity and replays the exact reviewed order after a lost response',async()=>{
 const origin='http://127.0.0.1:11520',stored=new Map(),token='a'.repeat(48),serverOrders=[],requests=[];
 let loseResponse=true,loginCount=0,time=1000,expire=false;
 const expected={BTCUSDT:{market:'BTCUSDT',price:75000,updatedAt:1000,sequence:7,source:PUBLIC_MARKET_QUOTE_SOURCE.id}};
 const storage={getItem:key=>stored.get(key)??null,setItem:(key,value)=>stored.set(key,value)};
 const respond=(status,data)=>({status,ok:status>=200&&status<300,json:async()=>structuredClone(data)});
 const fetchImpl=async(url,options)=>{
   const u=new URL(url),body=options.body&&JSON.parse(options.body);
   assert.equal(u.origin,origin);
   assert.equal(options.mode,'same-origin');
   assert.equal(options.credentials,'omit');
   assert.equal(options.redirect,'error');
   requests.push({url:u.pathname,body});
   if(u.pathname==='/api/v1/markets'){
     assert.equal(options.headers.authorization,undefined);
     return respond(200,{observations:expected,statuses:{BTCUSDT:{available:time<=16000}}});
   }
   if(u.pathname==='/api/v1/login'){
     loginCount++;
     assert.equal(options.headers.authorization,undefined);
     return respond(200,{ok:true,token,player:{id:'local-player'}});
   }
   assert.equal(options.headers.authorization,'Bearer '+token);
   if(expire)return respond(401,{ok:false,reason:'UNAUTHORIZED'});
   if(u.pathname==='/api/v1/orders')return respond(200,{ok:true,mode:'SIMULATION_WALLET',
     wallet:{free:10},orders:serverOrders,positions:[],receipts:[],observations:{}});
   if(u.pathname==='/api/v1/order'){
     const found=serverOrders.find(o=>o.requestId===body.requestId);
     if(found)return respond(200,{ok:true,order:found,replayed:true});
     const order={...body,orderId:'SIM-O-1',status:'PENDING'};
     serverOrders.push(order);
     if(loseResponse){loseResponse=false;throw new Error('network response lost')}
     return respond(200,{ok:true,order,replayed:false});
   }
   if(u.pathname==='/api/v1/order/cancel'){
     assert.deepEqual(body,{orderId:'SIM-O-1'});
     serverOrders[0].status='CANCELLED';
     return respond(200,{ok:true,order:serverOrders[0]});
   }
   assert.fail('unexpected route '+u.pathname);
 };
 const construct=()=>createPreviewSimulationExecutionAdapter({origin,storage,fetchImpl,now:()=>time});
 assert.throws(()=>createPreviewSimulationExecutionAdapter({origin:'https://public.example'}),/LOCAL_PREVIEW_ORIGIN_REQUIRED/);
 const adapter=construct();
 assert.equal(requests.length,0,'constructing never provisions a guest');
 assert.equal((await adapter.refresh()).ok,true);
 assert.equal(loginCount,1);
 assert.equal(adapter.marketSnapshot().observations.BTCUSDT.price,75000);
 assert.equal(adapter.quote('BTCUSDT').at,1000);
 const input={axis:'KX',market:'BTCUSDT',c:1,lots:2,triggerPrice:75000,currentPrice:90000,clientRequestId:'reviewed-click'};
 assert.equal(adapter.preview(input).intent.currentPrice,75000);
 assert.equal(adapter.observe(expected.BTCUSDT).reason,'SERVER_OWNS_EXECUTION_QUOTE');
 assert.equal((await adapter.submit(input)).reason,'PREVIEW_ORDER_UNRESOLVED');
 assert.equal(serverOrders.length,1);
 assert.equal(adapter.pendingOrder().clientRequestId,'reviewed-click');
 const firstPost=requests.find(r=>r.url==='/api/v1/order').body;
 assert.deepEqual(firstPost,{axis:'KX',market:'BTCUSDT',c:1,side:'LONG',lots:2,triggerPrice:75000,
   stopPrice:null,takeProfitPrice:null,requestId:'reviewed-click'});

 const reopened=construct();
 time=17000;
 assert.equal((await reopened.refresh()).ok,true);
 assert.equal(loginCount,1);
 assert.equal(reopened.snapshot().orders.length,1);
 assert.equal(reopened.preview(input).code,'ORACLE_STALE');
 assert.equal((await reopened.submit({...input,lots:3})).reason,'PREVIEW_ORDER_UNRESOLVED');
 assert.equal(requests.filter(r=>r.url==='/api/v1/order').length,1);
 const recovered=await reopened.retryPendingOrder();
 assert.equal(recovered.ok,true,recovered.reason);
 assert.equal(recovered.replayed,true);
 assert.equal(serverOrders.length,1);
 assert.deepEqual(requests.filter(r=>r.url==='/api/v1/order')[1].body,firstPost);
 assert.equal(reopened.pendingOrder(),null);
 assert.equal(JSON.stringify(reopened.snapshot()).includes(token),false);
 assert.equal((await reopened.cancel('SIM-O-1')).ok,true,'cancellation does not need a fresh quote');
 assert.equal(reopened.snapshot().orders[0].status,'CANCELLED');

 expire=true;
 const expired=await construct().refresh();
 assert.equal(expired.reason,'PREVIEW_SESSION_UNAUTHORIZED');
 assert.equal(loginCount,1,'an expired preview account does not create a replacement');
});

test('fallback source stays pinned through pending, position, public recovery and adapter reload',()=>{
 const ledger=createKgenLedger(100),adapter=createExecutionAdapter({ledger,productV1:true,simulationFallback:true});
 adapter.observe({market:'ETHUSDT',price:4000,observedAt:1000,now:1000});
 const input={axis:'KY',market:'ETHUSDT',c:1,lots:1,triggerPrice:4000};
 assert.equal(adapter.submit(input,{now:20000}).ok,true);
 assert.equal(adapter.observe({market:'ETHUSDT',price:1,observedAt:21000,now:21000}).ignored,true,'public recovery cannot reprice pinned pending order');
 adapter.tick({now:21000});assert.equal(adapter.snapshot().positions[0].status,'OPEN');
 const reloaded=createExecutionAdapter({ledger:structuredClone(ledger),productV1:true,simulationFallback:true});
 assert.equal(reloaded.quote('ETHUSDT',{now:22000}).source,'K11520_DETERMINISTIC_SIMULATION');
 assert.equal(reloaded.observe({market:'ETHUSDT',price:1,observedAt:23000,now:23000}).ignored,true);
 assert.equal(reloaded.close(reloaded.snapshot().positions[0].positionId,{now:24000}).ok,true);
});

test('offline fallback liquidates both directions once with isolated collateral and source-bound receipts',()=>{
 for(const c of [1,-1]){
  const ledger=createKgenLedger(100),adapter=createExecutionAdapter({ledger,productV1:true,simulationFallback:true});
  // Explicit low-price fixture: the unchanged +/-2 deterministic path crosses
  // the actual one-floor-unit boundary at 1C in both directions.
  assert.equal(adapter.observe({market:'ETHUSDT',price:4,observedAt:1000,now:1000}).ok,true);
  const now=17000;
  assert.equal(adapter.submit({axis:'KY',market:'ETHUSDT',c,lots:2,triggerPrice:4},{now}).ok,true);adapter.tick({now:now+1000});
  adapter.tick({now:now+(c>0?96000:32000)});const book=adapter.snapshot();assert.equal(book.positions[0].status,'LIQUIDATED');assert.equal(ledger.free,98);assert.equal(ledger.lockedMargin,0);assert.equal(book.receipts.length,2);
  adapter.tick({now:now+130000});assert.equal(adapter.snapshot().receipts.length,2);
 }
});

test('simulation fallback preserves canonical validation, margin and V1 ceiling, rejecting REAL source substitution',()=>{
 const ledger=createKgenLedger(100),adapter=createExecutionAdapter({ledger,productV1:true,simulationFallback:true});
 const input={axis:'KY',market:'ETHUSDT',c:1,lots:1,triggerPrice:4000},before=structuredClone(ledger);
 for(const invalid of [{c:0},{c:5},{c:-5},{lots:0},{lots:101},{market:'BTCUSDT'},{triggerPrice:NaN}])assert.equal(adapter.submit({...input,...invalid},{now:1000}).ok,false);
 assert.deepEqual(ledger,before);ledger.free=0;assert.equal(adapter.preview(input,{now:1000}).code,'INSUFFICIENT_MARGIN');
 for(const quoteState of ['WAIT','STALE','INVALID'])assert.throws(()=>buildRealTradingOrderIntent({...base,quoteState}),/REAL_QUOTE_NOT_LIVE/);
 assert.throws(()=>buildRealTradingOrderIntent({...base,priceSource:'K11520_DETERMINISTIC_SIMULATION'}),/SIMULATION_PRICE_NOT_REAL/);
 const real=createExecutionAdapter({ledger,deployment:{mode:'ON_CHAIN'},simulationFallback:true});assert.equal(real.preview(input).ok,false);assert.equal(real.submit(input).ok,false);assert.equal(real.tick,undefined);
});

test('fallback ticks and close stage all mutations before persistence, including corrupt source and clock rollback',()=>{
 const ledger=createKgenLedger(100);let saves=0;
 const adapter=createExecutionAdapter({ledger,productV1:true,simulationFallback:true,afterMutation:()=>saves++});
 adapter.tick({now:1000});ledger.simulation.observations.BNBUSDT.simulationAnchorPrice=NaN;
 const before=structuredClone(ledger),saved=saves;assert.equal(adapter.tick({now:3000}).ok,false);assert.deepEqual(ledger,before,'later-market failure cannot commit earlier market');assert.equal(saves,saved);
 ledger.simulation.observations.BNBUSDT.simulationAnchorPrice=600;
 adapter.submit({axis:'KY',market:'ETHUSDT',c:1,lots:1,triggerPrice:4000},{now:1000});adapter.tick({now:2000});
 const position=adapter.snapshot().positions[0],open=structuredClone(ledger),afterFill=saves;
 assert.equal(adapter.close(position.positionId,{now:500}).ok,false);assert.deepEqual(ledger,open);assert.equal(saves,afterFill);
 assert.equal(adapter.tick({now:500}).ok,false);assert.deepEqual(ledger,open);assert.equal(saves,afterFill);
 assert.equal(adapter.close('SIM-P-MISSING',{now:5000}).ok,false);assert.deepEqual(ledger,open);assert.equal(saves,afterFill);
});

test('fresh reference is retained until stale; fallback cannot overwrite public input or be injected as an observation',()=>{
 const ledger=createKgenLedger(100),adapter=createExecutionAdapter({ledger,productV1:true,simulationFallback:true});
 const publicQuote={market:'BTCUSDT',price:65000,observedAt:1000,now:1000,source:'BINANCE_PUBLIC_MARKET_DATA_ONLY'},original=structuredClone(publicQuote);
 assert.equal(adapter.observe(publicQuote).ok,true);assert.equal(adapter.quote('BTCUSDT',{now:15000}).source,publicQuote.source);
 adapter.tick({now:15000});assert.equal(adapter.snapshot().observations.BTCUSDT.source,publicQuote.source);
 adapter.tick({now:17000});const fallback=adapter.snapshot().observations.BTCUSDT;assert.equal(fallback.source,'K11520_DETERMINISTIC_SIMULATION');assert.equal(fallback.price,65000);assert.deepEqual(publicQuote,original);
 const fresh=createExecutionAdapter({ledger:createKgenLedger(100),simulationFallback:true});
 assert.equal(fresh.observe({market:'BTCUSDT',price:99,observedAt:1000,now:1000,source:'K11520_DETERMINISTIC_SIMULATION'}).ok,false);
});

test('real Testnet rejects simulation provenance and non-live quote state before any provider read or write',async()=>{
 const f=testnetFixture(),adapter=f.make({simulationFallback:true});
 for(const extra of [{priceSource:'K11520_DETERMINISTIC_SIMULATION'},{simulationOnly:true},{quoteState:'WAIT'},{quoteState:'STALE'},{quoteState:'INVALID'}]){
  const before=f.calls.length,input={...simulationInput,c:1,...extra};
  assert.equal((await adapter.preview(input)).ok,false);assert.equal((await adapter.submit(input)).ok,false);assert.equal(f.calls.length,before);
 }
});

test('offline simulation retains every legal V1 signed-C value across all three market bindings',()=>{
 for(const [axis,market,triggerPrice] of [['KX','BTCUSDT',100000],['KY','ETHUSDT',4000],['KZ','BNBUSDT',600]])for(const c of [-1,-.1,-.01,-.001,.001,.01,.1,1]){
  const ledger=createKgenLedger(100),adapter=createExecutionAdapter({ledger,productV1:true,simulationFallback:true}),input={axis,market,c,lots:1,triggerPrice};
  assert.equal(adapter.preview(input,{now:1000}).ok,true);assert.equal(adapter.submit(input,{now:1000}).ok,true);adapter.tick({now:2000});
  const position=adapter.snapshot().positions[0];assert.equal(position.c,c);assert.equal(position.side,c<0?'SHORT':'LONG');assert.equal(position.principal,1);
 }
});

test('malformed saved observations fail closed rather than reanchoring an existing position to synthetic seed',()=>{
 for(const invalid of [{price:NaN,at:1000},{price:-1,at:1000},{price:4000,at:undefined},{price:4000,at:-1}]){
  const ledger=createKgenLedger(100);ledger.simulation={sequence:0,orders:[],positions:[],receipts:[],observations:{ETHUSDT:invalid}};
  const adapter=createExecutionAdapter({ledger,simulationFallback:true}),before=structuredClone(ledger);
  assert.equal(adapter.preview({axis:'KY',market:'ETHUSDT',c:1,lots:1,triggerPrice:4000},{now:20000}).ok,false);
  assert.equal(adapter.tick({now:20000}).ok,false);assert.deepEqual(ledger,before);
 }
});

test('missing observation on a pending/open saved market cannot mint a new anchor or fabricate liquidation',()=>{
 for(const c of [1,-1])for(const filled of [false,true]){
  const ledger=createKgenLedger(100),adapter=createExecutionAdapter({ledger,productV1:true,simulationFallback:true});
  adapter.observe({market:'ETHUSDT',price:3000,observedAt:1000,now:1000});
  adapter.submit({axis:'KY',market:'ETHUSDT',c,lots:1,triggerPrice:3000},{now:1001});
  if(filled)adapter.observe({market:'ETHUSDT',price:3000,observedAt:2000,now:2000});
  delete ledger.simulation.observations.ETHUSDT;
  const before=structuredClone(ledger),reloaded=createExecutionAdapter({ledger,productV1:true,simulationFallback:true});
  assert.equal(reloaded.tick({now:17000}).reason,'SIMULATION_RECOVERY_REQUIRED');assert.deepEqual(ledger,before);
  if(filled){assert.equal(reloaded.close(reloaded.snapshot().positions[0].positionId,{now:17000}).reason,'SIMULATION_RECOVERY_REQUIRED');assert.deepEqual(ledger,before)}
  else {assert.equal(reloaded.preview({axis:'KY',market:'ETHUSDT',c,lots:1,triggerPrice:3000},{now:17000}).reason,'SIMULATION_RECOVERY_REQUIRED');assert.deepEqual(ledger,before)}
 }
});


test('active LONG/SHORT source metadata corruption and future anchors require recovery without mutation',()=>{
 for(const c of [1,-1])for(const filled of [false,true])for(const invalid of [{simulationAnchorPrice:null},{simulationAnchorPrice:NaN},{simulationAnchorPrice:400000},{simulationAnchorAt:999999},{simulationAnchorAt:undefined}]){
  const ledger=createKgenLedger(100),adapter=createExecutionAdapter({ledger,productV1:true,simulationFallback:true});
  adapter.submit({axis:'KY',market:'ETHUSDT',c,lots:1,triggerPrice:4000},{now:1000});if(filled)adapter.tick({now:2000});
  Object.assign(ledger.simulation.observations.ETHUSDT,invalid);const before=structuredClone(ledger),reloaded=createExecutionAdapter({ledger,simulationFallback:true});
  assert.equal(reloaded.tick({now:17000}).reason,'SIMULATION_RECOVERY_REQUIRED');assert.deepEqual(ledger,before);
  if(filled){assert.equal(reloaded.close(ledger.simulation.positions[0].positionId,{now:17000}).reason,'SIMULATION_RECOVERY_REQUIRED');assert.deepEqual(ledger,before)}
 }
});

test('public observe cannot bypass recovery or reset a pinned pending/open source after saved metadata loss',()=>{
 for(const c of [1,-1])for(const filled of [false,true])for(const corruption of ['missing','marker','price']){
  const ledger=createKgenLedger(100),adapter=createExecutionAdapter({ledger,simulationFallback:true});
  adapter.submit({axis:'KY',market:'ETHUSDT',c,lots:1,triggerPrice:filled?4000:4001},{now:1000});adapter.tick({now:2000});
  if(corruption==='missing')delete ledger.simulation.observations.ETHUSDT;
  if(corruption==='marker')ledger.simulation.observations.ETHUSDT.source='BINANCE_PUBLIC_MARKET_DATA_ONLY';
  if(corruption==='price')ledger.simulation.observations.ETHUSDT.price=5000;
  const before=structuredClone(ledger),reloaded=createExecutionAdapter({ledger,simulationFallback:true});
  assert.equal(reloaded.observe({market:'ETHUSDT',price:c<0?5000:3000,observedAt:3000,now:3000,source:'BINANCE_PUBLIC_MARKET_DATA_ONLY'}).reason,'SIMULATION_RECOVERY_REQUIRED');assert.deepEqual(ledger,before);
 }
 const ledger=createKgenLedger(100),adapter=createExecutionAdapter({ledger,simulationFallback:true});
 adapter.observe({market:'ETHUSDT',price:4000,observedAt:1000,now:1000,source:'BINANCE_PUBLIC_MARKET_DATA_ONLY'});
 adapter.submit({axis:'KY',market:'ETHUSDT',c:-1,lots:1,triggerPrice:4001},{now:1001});adapter.tick({now:17000});
 assert.equal(ledger.simulation.orders[0].priceSource,'BINANCE_PUBLIC_MARKET_DATA_ONLY');assert.equal(ledger.simulation.orders[0].executionPriceSource,'K11520_DETERMINISTIC_SIMULATION');
 ledger.simulation.observations.ETHUSDT.source='BINANCE_PUBLIC_MARKET_DATA_ONLY';const before=structuredClone(ledger);
 assert.equal(adapter.observe({market:'ETHUSDT',price:5000,observedAt:18000,now:18000}).reason,'SIMULATION_RECOVERY_REQUIRED');assert.deepEqual(ledger,before);
});

// Explicit synthetic test parameters, never product defaults or a trading recommendation.
const autopilotParameters={axis:'KX',market:'BTCUSDT',cMagnitude:.1,lots:2,
 longAbove:100,shortBelow:99.8,maxLossKgen:5,maxOrders:4};
function autopilotFixture({parameters={},balance=1000,hooks={}}={}){
 const ledger=createKgenLedger(balance),config={...autopilotParameters,...parameters};
 let playerContext={id:'SYNTHETIC_PLAYER_A',readOnly:false};
 const adapter=createExecutionAdapter({ledger,productV1:true,...hooks});
 const observe=(price,now,market=config.market)=>{
  const result=adapter.observe({market,price,observedAt:now,now});
  assert.equal(result.ok,true,'the existing simulator accepts the test observation');return result;
 };
 observe(100,1000);
 const pilot=createSimulationAutopilot({adapter,getContext:()=>playerContext});
 return {ledger,adapter,config,pilot,observe,setContext:value=>{playerContext=value}};
}
async function openAutopilotLong(f,fillPrice=100){
 if(fillPrice!==100)f.observe(fillPrice,1001);
 assert.equal(f.pilot.arm(f.config).ok,true);
 assert.equal((await f.pilot.step({now:1001})).ok,true);
 assert.equal(f.adapter.snapshot().orders[0].status,'PENDING');
 assert.equal(f.adapter.snapshot().positions.length,0,'an autopilot submit does not fabricate a fill');
 f.observe(fillPrice,1002);
 const position=f.adapter.snapshot().positions.find(p=>p.status==='OPEN');
 assert.equal(position.side,'LONG');return position;
}

test('manual and autopilot use the same actual-fill floor model and signed settlement receipts',async()=>{
 for(const [c,entry,exit] of [[1,75000,85000],[-1,85000,75000]]){
  const results=[];
  for(const automated of [false,true]){
   const ledger=createKgenLedger(100),adapter=createExecutionAdapter({ledger,productV1:true});
   assert.equal(adapter.observe({market:'BTCUSDT',price:entry,observedAt:1000,now:1000}).ok,true);
   let pilot;
   if(automated){
    pilot=createSimulationAutopilot({adapter,getContext:()=>({id:'SYNTHETIC_FLOOR_PLAYER',readOnly:false})});
    assert.equal(pilot.arm({axis:'KX',market:'BTCUSDT',cMagnitude:1,lots:1,longAbove:c>0?entry:90000,shortBelow:c<0?entry:70000,maxLossKgen:5,maxOrders:2,...(c>0?{longTakeProfitPrice:exit}:{shortTakeProfitPrice:exit})}).ok,true);
    assert.equal((await pilot.step({now:1001})).ok,true);
   }else assert.equal(adapter.submit({axis:'KX',market:'BTCUSDT',c,lots:1,currentPrice:entry,triggerPrice:entry,takeProfitPrice:exit},{now:1001}).ok,true);
   assert.equal(adapter.snapshot().orders[0].status,'PENDING');assert.equal(ledger.lockedMargin,0);
   assert.equal(adapter.observe({market:'BTCUSDT',price:entry,observedAt:1002,now:1002}).ok,true);
   const open=adapter.snapshot();assert.equal(open.positions[0].status,'OPEN');assert.equal(open.positions[0].entry,entry);assert.equal(open.positions[0].pnlModel,C_PNL_MODEL);
   assert.equal(open.receipts[0].entryFloorUnit,10000);assert.equal(open.receipts[0].pnlModel,C_PNL_MODEL);assert.equal(ledger.lockedMargin,1);
   assert.equal(adapter.observe({market:'BTCUSDT',price:exit,observedAt:1003,now:1003}).ok,true);
   const book=adapter.snapshot(),receipt=book.receipts.at(-1);
   assert.equal(receipt.status,'TAKE_PROFIT');assert.equal(receipt.pnlModel,C_PNL_MODEL);assert.equal(receipt.entryFloorUnit,10000);assert.equal(receipt.realizedPnl,1);assert.equal(receipt.rawPnl,1);assert.equal(receipt.marginBefore,1);assert.equal(receipt.marginAfter,0);
   assert.equal(book.receipts.length,2);assert.equal(ledger.free,101);assert.equal(ledger.lockedMargin,0);
   if(pilot){assert.equal((await pilot.step({now:1004})).ok,true);assert.equal(pilot.snapshot().submittedOrders,1);assert.equal(pilot.snapshot().realizedPnl,1);assert.equal(pilot.snapshot().broadcast,false)}
   results.push(book);
  }
  assert.deepEqual(results[1],results[0],'manual intent and autopilot settle through the same adapter and receipt owner');
 }
});

test('autopilot requires every strategy and risk parameter without economic defaults',async()=>{
 for(const key of Object.keys(autopilotParameters)){
  const f=autopilotFixture(),before=structuredClone(f.ledger),incomplete={...f.config};delete incomplete[key];
  assert.equal(f.pilot.arm(incomplete).ok,false,'missing '+key);
  assert.equal(f.pilot.snapshot().state,'STOPPED');assert.equal(f.pilot.snapshot().config,null);
  assert.equal((await f.pilot.step({now:1001})).ok,false);assert.deepEqual(f.ledger,before);
 }
 for(const invalid of [{market:'ETHUSDT'},{cMagnitude:0},{cMagnitude:.3},{cMagnitude:10},
  {lots:0},{longAbove:99},{shortBelow:100},{maxLossKgen:0},{maxOrders:0},{maxOrders:1.5},
  {longStopPrice:101},{shortTakeProfitPrice:101}]){
  const f=autopilotFixture(),before=structuredClone(f.ledger);
  assert.equal(f.pilot.arm({...f.config,...invalid}).ok,false,JSON.stringify(invalid));assert.deepEqual(f.ledger,before);
 }
});

test('autopilot accepts only the actual simulation factory and an explicit writable player context',()=>{
 const {adapter,ledger}=fixture(),before=structuredClone(ledger),context=()=> 'SYNTHETIC_PLAYER_A';
 assert.throws(()=>createSimulationAutopilot({adapter:{...adapter},getContext:context}),/SIMULATION_ADAPTER_REQUIRED/);
 assert.throws(()=>createSimulationAutopilot({adapter:Object.create(adapter),getContext:context}),/SIMULATION_ADAPTER_REQUIRED/);
 const evm=createExecutionAdapter({ledger,deployment:{mode:'ON_CHAIN'}});
 assert.throws(()=>createSimulationAutopilot({adapter:evm,getContext:context}),/SIMULATION_ADAPTER_REQUIRED/);
 const testnet=testnetFixture(),testnetAdapter=testnet.make(),callsBefore=testnet.calls.length;
 assert.throws(()=>createSimulationAutopilot({adapter:testnetAdapter,getContext:context}),/SIMULATION_ADAPTER_REQUIRED/);
 assert.equal(testnet.calls.length,callsBefore,'rejected autopilot never requests Testnet identity, signing or transmission');
 assert.throws(()=>createSimulationAutopilot({adapter}),/PLAYER_CONTEXT_REQUIRED/);
 for(const getContext of [()=>'',()=>null,()=>({id:'SYNTHETIC_PLAYER_A',readOnly:true})]){
  const pilot=createSimulationAutopilot({adapter,getContext});assert.equal(pilot.arm(autopilotParameters).ok,false);
 }
 assert.deepEqual(ledger,before);
});

test('autopilots retain all three fixed financial market bindings without cross-market fills',async()=>{
 const ledger=createKgenLedger(100),adapter=createExecutionAdapter({ledger,productV1:true});
 const bindings=[['KX','BTCUSDT'],['KY','ETHUSDT'],['KZ','BNBUSDT']],pilots=[];
 for(const [axis,market]of bindings){
  assert.equal(adapter.observe({market,price:100,observedAt:1000,now:1000}).ok,true);
  const pilot=createSimulationAutopilot({adapter,getContext:()=> 'SYNTHETIC_PLAYER_A'});
  assert.equal(pilot.arm({...autopilotParameters,axis,market}).ok,true);pilots.push(pilot);
 }
 await Promise.all(pilots.map(p=>p.step({now:1001})));
 assert.deepEqual(adapter.snapshot().orders.map(o=>[o.axis,o.market,o.status]),bindings.map(b=>[...b,'PENDING']));
 assert.equal(adapter.observe({market:'BTCUSDT',price:100,observedAt:1002,now:1002}).ok,true);
 const book=adapter.snapshot();assert.deepEqual(book.positions.map(p=>[p.axis,p.market]),[['KX','BTCUSDT']]);
 assert.equal(book.orders.filter(o=>o.status==='PENDING').length,2);assert.equal(book.wallet.lockedMargin,2);
 assert.equal(pilots[1].snapshot().submittedOrders,1);assert.equal(pilots[2].snapshot().submittedOrders,1);
});

test('autopilot reverses only a receipted closed LONG and earns a falling-price SHORT through the original take-profit engine',async()=>{
 const f=autopilotFixture({parameters:{shortTakeProfitPrice:99.4}}),long=await openAutopilotLong(f);
 f.observe(99.8,1003);assert.equal((await f.pilot.step({now:1004})).ok,true);
 let book=f.adapter.snapshot(),closed=book.positions.find(p=>p.positionId===long.positionId);
 assert.equal(closed.status,'CLOSED');assert.equal(closed.margin,0);
 const closeReceipt=book.receipts.find(r=>r.positionId===long.positionId&&r.kind==='SETTLEMENT');
 assert.equal(closeReceipt.status,'CLOSED');assert.equal(closeReceipt.marginAfter,0);
 assert.equal(book.orders.length,2);assert.equal(book.orders[1].side,'SHORT');assert.equal(book.orders[1].c,-.1);
 assert.equal(book.orders[1].status,'PENDING');assert.equal(book.positions.length,1);
 f.observe(99.8,1005);assert.equal(f.adapter.snapshot().positions[1].side,'SHORT');
 f.observe(99.4,1006);book=f.adapter.snapshot();
 const shortReceipt=book.receipts.find(r=>r.kind==='SETTLEMENT'&&r.positionId===book.positions[1].positionId);
 assert.equal(shortReceipt.status,'TAKE_PROFIT');assert.ok(shortReceipt.realizedPnl>0,'the SHORT benefits from the actual lower observation');
 assert.ok(book.wallet.realizedPnl>0);assert.equal(book.wallet.lockedMargin,0);
 assert.ok(Math.abs(book.wallet.free-(1000+book.wallet.realizedPnl))<1e-9);
 await f.pilot.step({now:1007});assert.equal(f.adapter.snapshot().orders.length,2,'the same signal does not issue another order after settlement');
 assert.ok(Math.abs(f.pilot.snapshot().realizedPnl-book.wallet.realizedPnl)<1e-9);
 assert.equal(f.pilot.snapshot().signerRequested,false);assert.equal(f.pilot.snapshot().broadcast,false);
});

test('autopilot single-flight and repeated pending observations never duplicate or cancel an existing order',async()=>{
 const f=autopilotFixture();assert.equal(f.pilot.arm(f.config).ok,true);
 const first=f.pilot.step({now:1001});assert.equal(f.pilot.snapshot().busy,true);
 const overlap=f.pilot.step({now:1001}),rearm=f.pilot.arm(f.config);
 assert.equal(rearm.reason,'ACTION_IN_PROGRESS');assert.equal((await overlap).reason,'ACTION_IN_PROGRESS');await first;
 assert.equal(f.pilot.snapshot().busy,false);
 const before=structuredClone(f.ledger);
 for(let i=0;i<4;i++)assert.equal((await f.pilot.step({now:1002+i})).state,'PENDING_TRIGGER');
 assert.deepEqual(f.ledger,before);assert.equal(f.pilot.snapshot().submittedOrders,1);
 f.pilot.stop();assert.equal((await f.pilot.step({now:1007})).ok,false);
 assert.deepEqual(f.ledger,before,'stop disarms decisions without cancelling the previously accepted pending order');
});

test('autopilot stale or corrupt quotes and insufficient margin stop without creating an order',async()=>{
 for(const kind of ['stale','future','invalid-price','missing-price','margin']){
  const f=autopilotFixture({balance:kind==='margin'?1:1000});assert.equal(f.pilot.arm(f.config).ok,true);
  if(kind==='future')f.ledger.simulation.observations.BTCUSDT.at=2000;
  if(kind==='invalid-price')f.ledger.simulation.observations.BTCUSDT.price=NaN;
  if(kind==='missing-price')delete f.ledger.simulation.observations.BTCUSDT;
  const before=structuredClone(f.ledger),result=await f.pilot.step({now:kind==='stale'?16001:1001});
  assert.equal(result.ok,false,kind);assert.equal(f.pilot.snapshot().state,'STOPPED',kind);
  assert.deepEqual(f.ledger,before,kind+' leaves the prior ledger intact');
 }
});

test('autopilot stop, player switch and read-only transition during preview forbid the later submit',async()=>{
 for(const interrupt of ['stop','player','readonly']){
  const f=autopilotFixture();assert.equal(f.pilot.arm(f.config).ok,true);const before=structuredClone(f.ledger);
  const result=f.pilot.step({now:1001});assert.equal(f.pilot.snapshot().busy,true);
  if(interrupt==='stop')f.pilot.stop();
  else f.setContext({id:interrupt==='player'?'SYNTHETIC_PLAYER_B':'SYNTHETIC_PLAYER_A',readOnly:interrupt==='readonly'});
  assert.equal((await result).ok,false,interrupt);assert.deepEqual(f.ledger,before,interrupt);
  assert.equal(f.pilot.snapshot().state,'STOPPED');assert.equal(f.pilot.snapshot().submittedOrders,0);
 }
 for(const interrupt of ['stop','player','readonly']){
  let injecting=false,f,mutationHooks=0;
  f=autopilotFixture({hooks:{beforeMutation(){
   if(!injecting)return;mutationHooks++;
   if(interrupt==='stop')f.pilot.stop();
   else f.setContext({id:interrupt==='player'?'SYNTHETIC_PLAYER_B':'SYNTHETIC_PLAYER_A',readOnly:interrupt==='readonly'});
  }}});
  assert.equal(f.pilot.arm(f.config).ok,true);const before=JSON.stringify(f.ledger);injecting=true;
  assert.equal((await f.pilot.step({now:1001})).ok,false,interrupt+' in the actual submit hook');
  assert.equal(mutationHooks,1);assert.equal(JSON.stringify(f.ledger),before,'post-hook guard prevents any '+interrupt+' submit mutation');
  assert.equal(f.pilot.snapshot().submittedOrders,0);assert.equal(f.pilot.snapshot().state,'STOPPED');
 }
});

test('autopilot cancellation during a completed-close await keeps that settlement but forbids a reverse order',async()=>{
 for(const interrupt of ['stop','player','readonly']){
  const f=autopilotFixture(),long=await openAutopilotLong(f);f.observe(99.8,1003);
  const operation=f.pilot.step({now:1004});
  assert.equal(f.adapter.snapshot().positions.find(p=>p.positionId===long.positionId).status,'CLOSED','the real close happened before the async continuation');
  if(interrupt==='stop')f.pilot.stop();
  else f.setContext({id:interrupt==='player'?'SYNTHETIC_PLAYER_B':'SYNTHETIC_PLAYER_A',readOnly:interrupt==='readonly'});
  assert.equal((await operation).ok,false,interrupt);
  const book=f.adapter.snapshot();assert.equal(book.orders.length,1);assert.equal(book.positions.length,1);
  assert.equal(book.receipts.filter(r=>r.kind==='SETTLEMENT').length,1);assert.equal(f.pilot.snapshot().submittedOrders,1);
  assert.equal(f.pilot.snapshot().state,'STOPPED');assert.equal(f.pilot.snapshot().busy,false);
 }
 for(const interrupt of ['stop','player','readonly']){
  let injecting=false,f,mutationHooks=0;
  f=autopilotFixture({hooks:{beforeMutation(){
   if(!injecting)return;mutationHooks++;
   if(interrupt==='stop')f.pilot.stop();
   else f.setContext({id:interrupt==='player'?'SYNTHETIC_PLAYER_B':'SYNTHETIC_PLAYER_A',readOnly:interrupt==='readonly'});
  }}});
  await openAutopilotLong(f);f.observe(99.8,1003);const before=JSON.stringify(f.ledger);injecting=true;
  assert.equal((await f.pilot.step({now:1004})).ok,false,interrupt+' in the actual close hook');
  assert.equal(mutationHooks,1);assert.equal(JSON.stringify(f.ledger),before,'post-hook guard prevents '+interrupt+' close or reversal');
  assert.equal(f.pilot.snapshot().submittedOrders,1);assert.equal(f.pilot.snapshot().state,'STOPPED');
 }
});

test('autopilot close rejection or a missing persisted settlement cannot authorize a reverse',async()=>{
 for(const fault of ['before-close','missing-receipt']){
  let inject=false,f;
  const hooks={beforeMutation(){if(inject&&fault==='before-close')throw new Error('SYNTHETIC_CLOSE_FAILURE')},
   afterMutation(){if(inject&&fault==='missing-receipt')f.ledger.simulation.receipts=f.ledger.simulation.receipts.filter(r=>r.kind!=='SETTLEMENT')}};
  f=autopilotFixture({hooks});const long=await openAutopilotLong(f);f.observe(99.8,1003);inject=true;
  assert.equal((await f.pilot.step({now:1004})).ok,false,fault);
  assert.equal(f.pilot.snapshot().reason,'CLOSE_NOT_CONFIRMED');assert.equal(f.adapter.snapshot().orders.length,1);
  assert.equal(f.adapter.snapshot().positions.find(p=>p.positionId===long.positionId).status,fault==='before-close'?'OPEN':'CLOSED');
  const stopped=structuredClone(f.ledger);await f.pilot.step({now:1005});assert.deepEqual(f.ledger,stopped,'failed close is never retried');
 }
});

test('autopilot loss budget and order budget stop new decisions on the existing settlement evidence',async()=>{
 const loss=autopilotFixture({parameters:{maxLossKgen:.05}}),lossPosition=await openAutopilotLong(loss);
 loss.observe(74,1003);assert.equal((await loss.pilot.step({now:1004})).reason,'LOSS_LIMIT_REACHED');
 assert.equal(loss.adapter.snapshot().positions.find(p=>p.positionId===lossPosition.positionId).status,'CLOSED');
 assert.equal(loss.adapter.snapshot().orders.length,1);assert.ok(loss.pilot.snapshot().realizedPnl<-.05);
 const limited=autopilotFixture({parameters:{maxOrders:1}}),limitedPosition=await openAutopilotLong(limited);
 limited.observe(99.8,1003);assert.equal((await limited.pilot.step({now:1004})).reason,'ORDER_LIMIT_REACHED');
 assert.equal(limited.adapter.snapshot().positions.find(p=>p.positionId===limitedPosition.positionId).status,'CLOSED');
 assert.equal(limited.adapter.snapshot().orders.length,1);assert.equal(limited.pilot.snapshot().submittedOrders,1);
});

test('autopilot never adopts manual positions, ignores neither external close nor liquidation, and preserves their ledger',async()=>{
 for(const filled of [false,true]){
  const f=autopilotFixture();const manual=f.adapter.submit({axis:'KX',market:'BTCUSDT',c:.1,lots:1,currentPrice:100,triggerPrice:100},{now:1001});
  assert.equal(manual.ok,true);if(filled)f.observe(100,1002);
  const before=structuredClone(f.ledger);assert.equal(f.pilot.arm(f.config).reason,'AXIS_ALREADY_ACTIVE');assert.deepEqual(f.ledger,before);
 }
 const collision=autopilotFixture();assert.equal(collision.pilot.arm(collision.config).ok,true);
 const inFlight=collision.pilot.step({now:1001});
 const manual=collision.adapter.submit({axis:'KX',market:'BTCUSDT',c:-.1,lots:1,currentPrice:100,triggerPrice:99.8},{now:1001});
 assert.equal(manual.ok,true);await inFlight;
 assert.deepEqual(collision.adapter.snapshot().orders.map(o=>o.orderId),[manual.order.orderId]);assert.equal(collision.pilot.snapshot().state,'STOPPED');
 for(const terminal of ['external-close','liquidated']){
  const liquidated=terminal==='liquidated',f=autopilotFixture({parameters:liquidated?{cMagnitude:1}:{}}),position=await openAutopilotLong(f,liquidated?101:100);
  if(terminal==='external-close')assert.equal(f.adapter.close(position.positionId,{now:1003}).ok,true);else f.observe(.5,1003);
  const before=structuredClone(f.ledger);assert.equal((await f.pilot.step({now:1004})).ok,false);
  assert.equal(f.pilot.snapshot().reason,terminal==='external-close'?'POSITION_CLOSED_EXTERNALLY':'AUTOPILOT_LIQUIDATED');assert.deepEqual(f.ledger,before);
 }
 for(const terminal of ['cancelled','missing','rejected']){
  const f=autopilotFixture({balance:2});assert.equal(f.pilot.arm(f.config).ok,true);await f.pilot.step({now:1001});
  const owned=f.adapter.snapshot().orders[0];
  if(terminal==='cancelled')assert.equal(f.adapter.cancel(owned.orderId).ok,true);
  else if(terminal==='missing')f.ledger.simulation.orders=[];
  else{
   // A separate real simulation fill uses the funds while the original order is pending.
   f.observe(100,1002,'ETHUSDT');
   assert.equal(f.adapter.submit({axis:'KY',market:'ETHUSDT',c:.1,lots:1,currentPrice:100,triggerPrice:100},{now:1003}).ok,true);
   f.observe(100,1004,'ETHUSDT');assert.equal(f.adapter.snapshot().wallet.free,1);
   f.observe(100,1005);assert.equal(f.adapter.snapshot().orders.find(o=>o.orderId===owned.orderId).status,'REJECTED');
   assert.equal(f.adapter.snapshot().orders.find(o=>o.orderId===owned.orderId).reason,'INSUFFICIENT_FREE_KGEN');
  }
  f.observe(99.8,1006);const before=JSON.stringify(f.ledger);
  assert.equal((await f.pilot.step({now:1007})).reason,'AUTOPILOT_ORDER_'+terminal.toUpperCase());
  assert.equal(f.pilot.snapshot().state,'STOPPED');assert.equal(f.pilot.snapshot().submittedOrders,1);
  assert.equal(JSON.stringify(f.ledger),before,terminal+' never retries or reverses on the opposite signal');
 }
});

// Synthetic metadata only. These bindings are NOT deployed/approved addresses.
const canonicalReviewJson=value=>value&&typeof value==='object'?Array.isArray(value)?'['+value.map(canonicalReviewJson).join(',')+']':'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonicalReviewJson(value[k])).join(',')+'}':JSON.stringify(value);
const reviewDigest=value=>codec.keccak256(codec.toUtf8Bytes(canonicalReviewJson(value)));
const custodyFragments=[TESTNET_EXECUTION_ABI.testToken.find(f=>f.startsWith('function approve(')),...TESTNET_EXECUTION_ABI.brainProxy.filter(f=>/^function (depositMargin|withdrawMargin)\(/.test(f)),CAPITAL_EXECUTION_ABI.brainProxy.find(f=>f.startsWith('function claimSettlement('))];
function custodyFixture(){
 const hash='0x'+'ab'.repeat(32),deployment={schema:'K11520_BSC56_DEPLOYMENT_BINDING_V1',status:'DEPLOYED_CONFIG_VERIFIED',chainId:56,testOnly:false,
  tokenAddress:'0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be',brainAddress:BRAIN,brainImplementation:ENGINE,walletAddress:WALLET,pendingNonce:'7',allowanceWei:'0',
  tokenCodeHash:hash,brainCodeHash:hash,implementationCodeHash:hash,brainSourceHash:hash,abiHash:reviewDigest(custodyFragments),blockHash:hash,blockNumber:'123',reviewedCommit:'a'.repeat(40),accountingModel:'ISOLATED_SETTLEMENT_CAPITAL_V1'};
 const input={action:'depositMargin',chainId:56,walletAddress:WALLET,amountWei:'1000000000000000001',nonce:'7',gasLimit:'100000',gasPriceWei:'50000000',maximumGasFeeWei:'5000000000000',deployment};
 return {input,options:{ethers:codec,expectedBindingDigest:reviewDigest(deployment)}};
}

test('BSC56 pure builder encodes exact current ABI units and all eight Human review fields without live approval',()=>{
 const {input,options}=custodyFixture(),before=JSON.stringify(input),r=buildBsc56UnsignedCustodyReview(input,options);
 const abi=new codec.Interface(custodyFragments),decoded=abi.parseTransaction(r.transaction);
 assert.equal(decoded.name,'depositMargin');assert.equal(decoded.args[0].toString(),'1000000000000000001');
 assert.equal(r.transactionFormat,'ETHERS_STYLE_UNSIGNED_REVIEW_NOT_EIP1193_RPC');assert.equal(r.bindingVerification,'INPUT_METADATA_ONLY_NOT_CHAIN_VERIFIED');assert.equal(r.transaction.to,BRAIN);assert.equal(r.transaction.chainId,56);assert.equal(r.transaction.value,'0');assert.equal(r.transaction.nonce,'7');
 for(const key of ['CHAIN','WALLET','CONTRACT','FUNCTION','TOKEN','AMOUNT','EXPECTED_EFFECT','MAXIMUM_EXPOSURE'])assert.ok(Object.hasOwn(r.review,key));
 assert.equal(r.review.MAXIMUM_EXPOSURE.walletTokenDebitWei,input.amountWei);assert.equal(r.review.MAXIMUM_EXPOSURE.nativeGasFeeWei,input.maximumGasFeeWei);
 assert.equal(r.executionReady,false);assert.equal(r.signerRequested,false);assert.equal(r.broadcast,false);assert.equal(r.status,'UNSIGNED_REVIEW_ONLY');
 assert.ok(r.blockers.includes('HUMAN_WALLET_OWNER_CONFIRMATION_REQUIRED'));assert.ok(r.blockers.includes('FRESH_CHAIN_CODE_ACCOUNT_NONCE_AND_STATE_READBACK_REQUIRED'));
 assert.equal(JSON.stringify(input),before);assert.ok(Object.isFrozen(r.review.MAXIMUM_EXPOSURE));
});

test('BSC56 approve/revoke fixes token target and exact Brain spender; withdraw affects principal, not allowance',()=>{
 const {input,options}=custodyFixture(),abi=new codec.Interface(custodyFragments);
 for(const amountWei of ['0','1','900719925474099312345678901234567890']){
  const r=buildBsc56UnsignedCustodyReview({...input,action:'approve',amountWei},options),d=abi.parseTransaction(r.transaction);
  assert.equal(d.name,'approve');assert.equal(d.args[0],BRAIN);assert.equal(d.args[1].toString(),amountWei);
  assert.equal(r.transaction.to,input.deployment.tokenAddress);assert.equal(r.review.SPENDER,BRAIN);assert.equal(r.review.MAXIMUM_EXPOSURE.allowanceAfterWei,amountWei);assert.equal(r.review.MAXIMUM_EXPOSURE.walletTokenDebitWei,'0');
 }
 const w=buildBsc56UnsignedCustodyReview({...input,action:'withdrawMargin'},options);
 assert.equal(abi.parseTransaction(w.transaction).name,'withdrawMargin');assert.equal(w.review.MAXIMUM_EXPOSURE.principalDebitWei,input.amountWei);assert.equal(w.review.MAXIMUM_EXPOSURE.walletTokenDebitWei,'0');
});

test('BSC56 claim uses the existing position key and never fabricates a payable amount or wallet transfer',()=>{
 const {input,options}=custodyFixture(),positionKey='0x'+'cd'.repeat(32);delete input.amountWei;
 const r=buildBsc56UnsignedCustodyReview({...input,action:'claimSettlement',positionKey},options),d=new codec.Interface(custodyFragments).parseTransaction(r.transaction);
 assert.equal(d.name,'claimSettlement');assert.equal(d.args[0],positionKey);assert.equal(r.review.AMOUNT.kind,'CONTRACT_RECORDED_CLAIM');
 assert.equal(r.review.MAXIMUM_EXPOSURE.walletTokenDebitWei,'0');assert.equal(r.review.MAXIMUM_EXPOSURE.principalDebitWei,'0');
 assert.throws(()=>buildBsc56UnsignedCustodyReview({...input,action:'claimSettlement',positionKey,amountWei:'1'},options),/CLAIM_AMOUNT_IS_CONTRACT_STATE/);
});

test('BSC56 missing/proposed deployment remains a useful review proposal with no transaction or guessed target',()=>{
 const {input,options}=custodyFixture();
 for(const deployment of [null,{...input.deployment,status:'NOT_DEPLOYED'}]){
  const r=buildBsc56UnsignedCustodyReview({...input,deployment},options);
  assert.equal(r.status,'PROPOSAL_MISSING_DEPLOYED_BINDING');assert.equal(r.transaction,null);assert.equal(r.review.CONTRACT,null);assert.equal(r.intentDigest,null);
  assert.ok(r.blockers.includes('BSC56_DEPLOYED_BINDING_REQUIRED'));assert.equal(r.executionReady,false);
 }
 const {brainAddress,...missing}=input.deployment;
 assert.throws(()=>buildBsc56UnsignedCustodyReview({...input,deployment:missing},{...options,expectedBindingDigest:reviewDigest(missing)}),/BRAIN_INVALID/);
});

test('BSC56 rejects wrong chain/token/capability/target/spender and zero/colliding addresses',()=>{
 const {input,options}=custodyFixture();
 for(const chainId of [97,'56',1,null])assert.throws(()=>buildBsc56UnsignedCustodyReview({...input,chainId},options),/BSC56_CHAIN_REQUIRED/);
 for(const walletAddress of ['0x'+'00'.repeat(20),'invalid'])assert.throws(()=>buildBsc56UnsignedCustodyReview({...input,walletAddress},options),/WALLET_INVALID/);
 assert.throws(()=>buildBsc56UnsignedCustodyReview({...input,spenderAddress:ENGINE},options),/BRAIN_SPENDER_MISMATCH/);
 assert.throws(()=>buildBsc56UnsignedCustodyReview({...input,contractAddress:ENGINE},options),/CUSTODY_TARGET_MISMATCH/);
 for(const changed of [{chainId:97},{testOnly:true},{tokenAddress:ENGINE},{brainAddress:WALLET},{brainImplementation:BRAIN},{accountingModel:'NOTIONAL_RETURN_V1'}]){
  const deployment={...input.deployment,...changed};
  assert.throws(()=>buildBsc56UnsignedCustodyReview({...input,deployment},{...options,expectedBindingDigest:reviewDigest(deployment)}),/BSC56_PRODUCTION_BINDING_REQUIRED|CANONICAL_KGEN_TOKEN_REQUIRED|CUSTODY_ROLE_ADDRESS_COLLISION|CAPITAL_ABI_CAPABILITY_REQUIRED/);
 }
 for(const action of ['createOrder','faucet','fundSettlementCapital','sweepToTreasury','setTreasury'])assert.throws(()=>buildBsc56UnsignedCustodyReview({...input,action},options),/ACTION_NOT_SUPPORTED/);
});

test('BSC56 rejects floats, numbers, exponent/hex/negative/leading-zero strings, overflow and unbounded allowance',()=>{
 const {input,options}=custodyFixture();
 for(const amountWei of [1,1.1,'1.1','1e18','0x10','-1','01','',String(1n<<256n),'9'.repeat(100000),'0'])assert.throws(()=>buildBsc56UnsignedCustodyReview({...input,amountWei},options),/AMOUNT_|REVIEW_JSON_STRING_BUDGET_EXCEEDED/);
 assert.throws(()=>buildBsc56UnsignedCustodyReview({...input,action:'approve',amountWei:String((1n<<256n)-1n)},options),/UNLIMITED/);
 for(const [key,value] of [['nonce',7],['nonce',String(1n<<64n)],['gasLimit','0'],['gasPriceWei','0'],['maximumGasFeeWei','4999999999999']])assert.throws(()=>buildBsc56UnsignedCustodyReview({...input,[key]:value},options),/NONCE_|GAS_/);
});

test('BSC56 binds source/ABI/readback/account/nonce and intent identity, without claiming replay prevention',()=>{
 const {input,options}=custodyFixture();
 assert.throws(()=>buildBsc56UnsignedCustodyReview(input,{ethers:codec}),/EXPECTED_BINDING_DIGEST_INVALID/);
 for(const field of ['brainSourceHash','brainCodeHash','tokenCodeHash','blockHash','reviewedCommit','abiHash']){
  const deployment={...input.deployment,[field]:field==='reviewedCommit'?'b'.repeat(40):'0x'+'ef'.repeat(32)};
  assert.throws(()=>buildBsc56UnsignedCustodyReview({...input,deployment},options),/DEPLOYMENT_BINDING_DIGEST_MISMATCH/);
 }
 assert.throws(()=>buildBsc56UnsignedCustodyReview({...input,nonce:'8'},options),/WALLET_NONCE_BINDING_MISMATCH/);
 const badAbi={...input.deployment,abiHash:'0x'+'ef'.repeat(32)};
 assert.throws(()=>buildBsc56UnsignedCustodyReview({...input,deployment:badAbi},{...options,expectedBindingDigest:reviewDigest(badAbi)}),/CUSTODY_ABI_HASH_MISMATCH/);
 const a=buildBsc56UnsignedCustodyReview(input,options),b=buildBsc56UnsignedCustodyReview({...input,amountWei:'2'},options);
 assert.notEqual(a.intentDigest,b.intentDigest);assert.equal(a.replayProtection,'FRESH_WALLET_NONCE_REQUIRED_AT_CONFIRMATION');
 assert.equal(buildBsc56UnsignedCustodyReview(input,options).intentDigest,a.intentDigest,'pure build is deterministic, not a second nonce ledger');
});

test('BSC56 construction never accesses provider/wallet callbacks or mutates the existing simulation ledger',()=>{
 const {input,options}=custodyFixture(),ledger=createKgenLedger(100),before=JSON.stringify(ledger);
 const denied=()=>{throw new Error('PROVIDER_OR_WALLET_ACCESSED')};
 const r=buildBsc56UnsignedCustodyReview({...input,ledger,ethereum:{request:denied},wallet:{request:denied,sendTransaction:denied},humanMainnetAuthorization:false},options);
 assert.equal(r.broadcast,false);assert.equal(JSON.stringify(ledger),before);
});

test('BSC56 approval review binds existing allowance, blocks replacement races and discloses revoke exposure',()=>{
 const {input,options}=custodyFixture(),deployment={...input.deployment,allowanceWei:'500'},bound={...options,expectedBindingDigest:reviewDigest(deployment)};
 assert.throws(()=>buildBsc56UnsignedCustodyReview({...input,action:'approve',amountWei:'100',deployment},bound),/ALLOWANCE_RESET_CONFIRMATION_REQUIRED/);
 const r=buildBsc56UnsignedCustodyReview({...input,action:'approve',amountWei:'0',deployment},bound);
 assert.equal(r.review.MAXIMUM_EXPOSURE.allowanceAtReadbackWei,'500');assert.equal(r.review.MAXIMUM_EXPOSURE.allowanceAfterWei,'0');assert.equal(r.review.MAXIMUM_EXPOSURE.allowanceTransitionUpperBoundWei,'500');
 assert.match(r.review.EXPECTED_EFFECT,/may be consumed before revocation/);
 const {allowanceWei,...missing}=deployment;
 assert.throws(()=>buildBsc56UnsignedCustodyReview({...input,action:'approve',deployment:missing},{...options,expectedBindingDigest:reviewDigest(missing)}),/BOUND_ALLOWANCE_EXACT_UINT_STRING_REQUIRED/);
 const newApproval=buildBsc56UnsignedCustodyReview({...input,action:'approve'},options);
 assert.equal(newApproval.review.MAXIMUM_EXPOSURE.allowanceTransitionUpperBoundWei,input.amountWei);
});

test('BSC56 rejects changing-target and action/amount/gas accessors before invoking them',()=>{
 const {input,options}=custodyFixture();let reads=0;
 Object.defineProperty(input.deployment,'brainAddress',{enumerable:true,get(){return ++reads===1?BRAIN:'0x4444444444444444444444444444444444444444'}});
 assert.throws(()=>buildBsc56UnsignedCustodyReview(input,options),/REVIEW_JSON_ACCESSOR_FORBIDDEN/);assert.equal(reads,0);
 for(const key of ['action','amountWei','gasLimit','gasPriceWei','walletAddress','deployment']){
  const f=custodyFixture();let invoked=0;Object.defineProperty(f.input,key,{enumerable:true,get(){invoked++;return 'unsafe'}});
  assert.throws(()=>buildBsc56UnsignedCustodyReview(f.input,f.options),/REVIEW_JSON_ACCESSOR_FORBIDDEN/);assert.equal(invoked,0);
 }
});

test('BSC56 hash and construction use one snapshot even when original input changes during hashing',()=>{
 const {input,options}=custodyFixture(),originalAmount=input.amountWei;
 const hooked={...codec,keccak256(bytes){input.deployment.brainAddress='0x4444444444444444444444444444444444444444';input.amountWei='9';input.action='withdrawMargin';input.gasLimit='1';return codec.keccak256(bytes)}};
 const r=buildBsc56UnsignedCustodyReview(input,{...options,ethers:hooked}),d=new codec.Interface(custodyFragments).parseTransaction(r.transaction);
 assert.equal(r.bindingDigest,options.expectedBindingDigest);assert.equal(r.transaction.to,BRAIN);assert.equal(d.name,'depositMargin');assert.equal(d.args[0].toString(),originalAmount);
 assert.equal(r.review.FUNCTION,'depositMargin');assert.equal(r.review.AMOUNT.baseUnits,originalAmount);assert.equal(r.transaction.gasLimit,'100000');assert.equal(r.executionReady,false);
});

test('BSC56 untrusted binding snapshot has cycle, depth, node, UTF-8-byte and shape budgets',()=>{
 const f=()=>custodyFixture();let x=f();x.input.deployment.cycle=x.input.deployment;
 assert.throws(()=>buildBsc56UnsignedCustodyReview(x.input,x.options),/REVIEW_JSON_CYCLE/);
 x=f();let deep={};x.input.deployment.extra=deep;for(let i=0;i<10;i++){deep.child={};deep=deep.child}
 assert.throws(()=>buildBsc56UnsignedCustodyReview(x.input,x.options),/STRUCTURE_BUDGET/);
 x=f();x.input.deployment.extra=Array.from({length:5},()=>Array(60).fill(1));
 assert.throws(()=>buildBsc56UnsignedCustodyReview(x.input,x.options),/STRUCTURE_BUDGET/);
 x=f();x.input.deployment.extra=Object.fromEntries(Array.from({length:6},(_,i)=>['unicode'+i,'漢'.repeat(1000)]));
 assert.throws(()=>buildBsc56UnsignedCustodyReview(x.input,x.options),/BYTE_BUDGET/);
 for(const extra of [Array(100).fill(1),new Array(5),new Date(),Object.create(null),{[Symbol('hidden')]:'x'}]){
  x=f();x.input.deployment.extra=extra;assert.throws(()=>buildBsc56UnsignedCustodyReview(x.input,x.options),/REVIEW_JSON_/);
 }
 x=f();let calls=0;x.input.deployment.extra={get toJSON(){calls++;return ()=>({})}};
 assert.throws(()=>buildBsc56UnsignedCustodyReview(x.input,x.options),/ACCESSOR_FORBIDDEN/);assert.equal(calls,0);
});

// Synthetic reviewed input for the ABI encoder. No RPC or wallet is installed.
const orderFragments=TESTNET_EXECUTION_ABI.orderTriggerEngine.filter(f=>/^function (createOrder|closePosition)\(/.test(f));
function bsc56OrderFixture(action='createOrder'){
  const hash='0x'+'aa'.repeat(32), nowMs=1700000010000;
  const target='0x4444444444444444444444444444444444444444';
  const token='0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be';
  const identity={triggerBrain:BRAIN,triggerPosition:ENGINE,positionExecutor:target,positionBrain:BRAIN,
    brainToken:token,brainImplementation:'0x5555555555555555555555555555555555555555',positionHasSettlementRole:true,
    tokenCodeHash:hash,brainCodeHash:hash,implementationCodeHash:hash,engineCodeHash:hash,triggerCodeHash:hash,
    sourceBundleHash:hash,abiHash:reviewDigest(orderFragments)};
  const deployment={schema:'K11520_BSC56_ORDER_BINDING_V1',status:'DEPLOYED_CONFIG_VERIFIED',chainId:56,testOnly:false,
    walletAddress:WALLET,pendingNonce:'7',tokenAddress:token,brainAddress:BRAIN,positionEngineAddress:ENGINE,
    orderTriggerAddress:target,reviewedCommit:'c'.repeat(40),blockHash:hash,blockNumber:'135',blockTimeMs:nowMs-500,identity,
    quote:{axis:'KX',market:'BTCUSDT',contractMarket:0,source:'ONCHAIN_USD_SETTLEMENT_ORACLE',unit:'USD',validated:true,
      feedSetEvidenceHash:hash,usdUsdtBasisEvidenceHash:hash,priceWad:(75000n*10n**18n).toString(),minPriceWad:'1',
      maxPriceWad:(100000n*10n**18n).toString(),sequence:'13',observedAtMs:nowMs-1000,maxAgeMs:15000,minimumSources:2,validSources:3},
    admission:{state:'OPEN',settlementModel:'FIXED_ENTRY_FLOOR',custodyEnabled:true,ordersEnabled:true,
      capabilityValidUntilMs:nowMs+30000,capabilityEvidenceHash:hash,maximumCWad:'1000000000000000000',availablePrincipalWei:'3000000000000000000'},
    position:{positionId:'3',contractMarket:0,trader:WALLET,status:'OPEN',collateralWad:'2000000000000000000'}};
  const input={chainId:56,action,walletAddress:WALLET,nonce:'7',gasLimit:'110000',gasPriceWei:'50000000',
    maximumGasFeeWei:'5500000000000',deployment,
    ...(action==='createOrder'?{cWad:'-10000000000000000',lots:'2',triggerPriceWad:(75000n*10n**18n+1n).toString(),
      triggerUnit:'USD',maximumMarginWei:'2000000000000000000'}:{positionId:'3'}),axis:'KX',market:'BTCUSDT'};
  // Independent expected digest input; refresh only in tests exercising another explicitly reviewed fixture.
  const options={ethers:codec,expectedBindingDigest:reviewDigest(deployment),nowMs};
  return {input,options};
}

test('BSC56 unsigned order review ABI round-trips exact trigger, signed C and close ID; replay only reproduces the same intent',()=>{
  for(const action of ['createOrder','closePosition']){
    const {input,options}=bsc56OrderFixture(action);
    const review=buildBsc56UnsignedOrderReview(input,options);
    const tx=review.transaction;
    assert.equal(tx.to,input.deployment.orderTriggerAddress);
    assert.equal(tx.from,WALLET);
    assert.equal(tx.nonce,'7');
    assert.equal(tx.value,'0');
    const decoded=new codec.Interface(orderFragments).parseTransaction(tx);
    assert.equal(decoded.name,action);
    assert.equal(review.status,'UNSIGNED_REVIEW_ONLY');
    assert.equal(review.executionReady,false);
    assert.equal(review.broadcast,false);
    assert.equal(review.signerRequested,false);
    assert.equal(review.review.MAXIMUM_EXPOSURE.walletTokenDebitWei,'0');
    if(action==='createOrder'){
      assert.deepEqual(Array.from(decoded.args,x=>x.toString()),['0',input.cWad,input.lots,input.triggerPriceWad]);
      assert.equal(review.review.MAXIMUM_EXPOSURE.marginAtFillWei,'2000000000000000000');
    }else{
      assert.equal(decoded.args[0].toString(),input.positionId);
      assert.equal(review.review.MAXIMUM_EXPOSURE.isolatedPrincipalAtRiskWei,'2000000000000000000');
    }
    const restored=JSON.parse(JSON.stringify(input));
    assert.deepEqual(buildBsc56UnsignedOrderReview(restored,options),review);
    assert.ok(Object.isFrozen(review.transaction));
  }
});

test('BSC56 missing binding never guesses a mainnet target or accepts client readiness flags',()=>{
  const {input,options}=bsc56OrderFixture();
  delete input.deployment;
  Object.assign(input,{humanMainnetAuthorization:true,feedProvenanceVerified:true,executionReady:true,contractAddress:BRAIN});
  const r=buildBsc56UnsignedOrderReview(input,options);
  assert.equal(r.transaction,null);
  assert.equal(r.review.CONTRACT,null);
  assert.equal(r.executionReady,false);
  assert.ok(r.blockers.includes('BSC56_DEPLOYED_BINDING_REQUIRED'));
});

test('BSC56 rejects substituted binding, stale wallet nonce, wrong role, ABI, token, target, or chain',()=>{
  const x=bsc56OrderFixture();x.input.deployment.orderTriggerAddress=ENGINE;
  assert.throws(()=>buildBsc56UnsignedOrderReview(x.input,x.options),/DIGEST_MISMATCH/);
  for(const [patch,reason] of [
    [i=>i.nonce='8',/NONCE_BINDING/],[i=>i.contractAddress=BRAIN,/TARGET_MISMATCH/],
    [i=>i.deployment.identity.positionExecutor=ENGINE,/ROUTING/],
    [i=>i.deployment.identity.abiHash='0x'+'bb'.repeat(32),/ABI_HASH_MISMATCH/],
    [i=>i.deployment.tokenAddress=WALLET,/CANONICAL_KGEN/],[i=>i.chainId=97,/BSC56_CHAIN_REQUIRED/],
    [i=>i.gasPriceWei='50000001',/GAS_FEE_CAP_EXCEEDED/],
    [i=>i.walletAddress=ENGINE,/WALLET_NONCE_BINDING/]
  ]){
    const {input,options}=bsc56OrderFixture();patch(input);
    options.expectedBindingDigest=reviewDigest(input.deployment);
    assert.throws(()=>buildBsc56UnsignedOrderReview(input,options),reason);
  }
});

test('BSC56 disconnected or mismatched oracle data blocks order review without substituting a public quote',()=>{
  for(const [patch,reason] of [
    [i=>delete i.deployment.quote,/SETTLEMENT_QUOTE_REQUIRED/],[i=>i.deployment.quote.source='BINANCE_PUBLIC',/SETTLEMENT_QUOTE_REQUIRED/],
    [i=>i.deployment.quote.unit='USDT',/SETTLEMENT_QUOTE_REQUIRED/],[i=>i.triggerUnit='USDT',/SETTLEMENT_TRIGGER_UNIT_REQUIRED/],
    [i=>i.deployment.quote.observedAtMs-=15000,/STALE_OR_FUTURE/],[i=>i.deployment.quote.observedAtMs+=1000,/STALE_OR_FUTURE/],
    [i=>i.deployment.quote.validSources=1,/QUORUM_REQUIRED/],[i=>i.market='BNBUSDT',/AXIS_MARKET_MISMATCH/],
    [i=>i.deployment.quote.contractMarket=1,/SETTLEMENT_QUOTE_REQUIRED/],
    [i=>i.deployment.quote.maxPriceWad=i.deployment.quote.priceWad,/ORDER_PRICE_OUT_OF_MARKET_BOUNDS/]
  ]){
    const {input,options}=bsc56OrderFixture();patch(input);
    options.expectedBindingDigest=reviewDigest(input.deployment);
    assert.throws(()=>buildBsc56UnsignedOrderReview(input,options),reason);
  }
});

test('BSC56 constrains new isolated risk to available principal, exact signed detent, fixed entry floor and active capability',()=>{
  for(const [patch,reason] of [
    [i=>i.cWad='1000000000000000001',/INVALID_SIGNED_C/],[i=>i.cWad='11000000000000000',/INVALID_C_DETENT/],
    [i=>i.cWad='-0',/INVALID_SIGNED_C/],[i=>i.lots='101',/LOTS_OUT_OF_RANGE/],
    [i=>i.maximumMarginWei='1999999999999999999',/MARGIN_CAP_EXCEEDED/],
    [i=>i.deployment.admission.availablePrincipalWei='1',/INSUFFICIENT_MARGIN/],
    [i=>i.deployment.admission.state='EXIT_ONLY',/ADMISSION_UNAVAILABLE/],
    [i=>i.deployment.admission.settlementModel='INDEX_DELTA',/ADMISSION_UNAVAILABLE/],
    [i=>i.deployment.admission.capabilityValidUntilMs-=30000,/ADMISSION_UNAVAILABLE/],
    [i=>i.deployment.admission.maximumCWad='1000000000000000',/MARKET_C_CAP_EXCEEDED/]
  ]){
    const {input,options}=bsc56OrderFixture();patch(input);
    options.expectedBindingDigest=reviewDigest(input.deployment);
    assert.throws(()=>buildBsc56UnsignedOrderReview(input,options),reason);
  }
});

test('BSC56 exit-only owner close preserves exit in frozen admissions and refuses wrong owner, ID or market',()=>{
  for(const [patch,reason] of [
    [i=>delete i.deployment.admission,null],
    [i=>i.deployment.quote.priceWad=(175000n*10n**18n).toString(),null],
    [i=>i.deployment.quote.observedAtMs-=15000,/STALE_OR_FUTURE/],
    [i=>i.deployment.position.trader=BRAIN,/POSITION_OWNER_AND_MARKET/],
    [i=>i.positionId='4',/POSITION_OWNER_AND_MARKET/],
    [i=>i.deployment.position.status='CLOSED',/POSITION_OWNER_AND_MARKET/],
    [i=>i.deployment.position.contractMarket=2,/POSITION_OWNER_AND_MARKET/],
    [i=>i.lots='1',/CLOSE_AMOUNT_IS_POSITION_STATE/]
  ]){
    const {input,options}=bsc56OrderFixture('closePosition');patch(input);
    options.expectedBindingDigest=reviewDigest(input.deployment);
    if(reason)assert.throws(()=>buildBsc56UnsignedOrderReview(input,options),reason);
    else assert.equal(buildBsc56UnsignedOrderReview(input,options).status,'UNSIGNED_REVIEW_ONLY');
  }
});

test('BSC56 pairs each reviewed market axis and raw-USD trigger with its contract market index',()=>{
  for(const [axis,market,contractMarket] of [['KX','BTCUSDT',0],['KY','ETHUSDT',1],['KZ','BNBUSDT',2]]){
    const {input,options}=bsc56OrderFixture();
    Object.assign(input,{axis,market,cWad:'1000000000000000000'});
    Object.assign(input.deployment.quote,{axis,market,contractMarket});
    options.expectedBindingDigest=reviewDigest(input.deployment);
    const review=buildBsc56UnsignedOrderReview(input,options);
    const decoded=new codec.Interface(orderFragments).parseTransaction(review.transaction);
    assert.equal(Number(decoded.args[0]),contractMarket);
    assert.equal(decoded.args[3].toString(),input.triggerPriceWad);
    assert.equal(review.review.OBSERVATION.priceWad,input.deployment.quote.priceWad);
  }
});
