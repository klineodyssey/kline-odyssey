import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRealTradingOrderIntent,buildExecutionOrderIntent,createExecutionAdapter,normalizeExecutionError,EXECUTION_FAILURE_STATES} from '../K線西遊記/temples/11520/runtime/real-trading-order-intent.mjs';
import {createKgenLedger} from '../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs';
import {C_DETENTS} from '../K線西遊記/temples/11520/controls/nonlinear-controls.mjs';
import {createRequire} from 'node:module';
import {TESTNET_EXECUTION_ABI} from '../K線西遊記/temples/11520/runtime/real-trading-order-intent.mjs';

const WALLET='0x3333333333333333333333333333333333333333';
const BRAIN='0x1111111111111111111111111111111111111111';
const ENGINE='0x2222222222222222222222222222222222222222';
const base={
 axis:'KX',market:'BTCUSDT',chainId:56,side:'多',lots:2,c:100,price:65000,
 walletAddress:WALLET,brainAddress:BRAIN,positionEngineAddress:ENGINE,
 feedProvenanceVerified:true,humanMainnetAuthorization:true
};

test('builds unsigned non-broadcast exact-market intent at 100C hard cap only after all protected gates',()=>{
 const intent=buildRealTradingOrderIntent(base);
 assert.equal(intent.axis,'KX');assert.equal(intent.market,'BTCUSDT');assert.equal(intent.contractMarket,0);
 assert.equal(intent.c,100);assert.equal(intent.leverage,100);assert.equal(intent.side,'LONG');
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
 for(const c of [-100,-.001,.001,100]){
  const intent=buildRealTradingOrderIntent({...base,c,side:undefined});
  assert.equal(intent.c,c);assert.equal(intent.leverage,Math.abs(c));assert.equal(intent.side,c<0?'SHORT':'LONG');
  assert.equal(intent.broadcast,false);assert.equal(intent.signerRequested,false);
 }
 for(const [c,side] of [[100,'SHORT'],[-100,'LONG']])assert.throws(()=>buildRealTradingOrderIntent({...base,c,side}),/C_SIDE_MISMATCH/);
 for(const c of [-0,-100.0001,-1000,Infinity])assert.throws(()=>buildRealTradingOrderIntent({...base,c}),/C_/);
 for(const lots of [-1,0,1.5,101,Infinity])assert.throws(()=>buildRealTradingOrderIntent({...base,lots}),/LOTS_OUT_OF_RANGE/);
});

const simulationInput={axis:'KX',market:'BTCUSDT',c:100,lots:10,currentPrice:100,triggerPrice:101};
function fixture(){const ledger=createKgenLedger(1000),adapter=createExecutionAdapter({ledger});assert.equal(adapter.observe({market:'BTCUSDT',price:100,observedAt:1000,now:1000}).ok,true);return {ledger,adapter}}
test('all canonical signed C detents retain precision across common and unsigned EVM intents',()=>{
 for(const c of C_DETENTS.filter(c=>c!==0)){
  const common=buildExecutionOrderIntent({...simulationInput,c,now:1001});
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
 assert.equal(preview.estimatedLiquidationPrice,99.99);assert.equal(preview.executionMode,'SIMULATION');
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
function testnetFixture(){
 const addresses={testToken:'0x'+'11'.repeat(20),brainProxy:'0x'+'22'.repeat(20),positionEngine:'0x'+'33'.repeat(20),orderTriggerEngine:'0x'+'44'.repeat(20),brainImplementation:'0x'+'55'.repeat(20)};
 const code='0x60006000',codeHashes=Object.fromEntries(Object.keys(addresses).map(k=>[k,codec.keccak256(code)]));
 const deployment={mode:'BSC_TESTNET',status:'DEPLOYED_CONFIG_VERIFIED',chainId:97,testOnly:true,publicNetwork:true,verified:true,deploymentBlock:1,addresses,codeHashes};
 const abi=Object.fromEntries(Object.entries(TESTNET_EXECUTION_ABI).map(([k,v])=>[k,new codec.Interface(v)]));
 const keyFor=address=>Object.keys(addresses).find(k=>addresses[k].toLowerCase()===address.toLowerCase());
 const role='0x'+'aa'.repeat(32),blockHash='0x'+'bb'.repeat(32),hash='0x'+'cc'.repeat(32),wad=v=>codec.parseUnits(String(v),18);
 let chain='0x61',account=WALLET,phase='none',sendError=null,reverted=false,pendingReceipts=0,amount=1000,token=5000,approved=0,stale=false,closeLiquidates=false,sendDelay=null,blockedRead=null,suppressLogs=false;
 const listeners=new Map(),calls=[],logs=[],receipts=new Map();
 function log(k,name,args){const ev=abi[k].encodeEventLog(abi[k].getEvent(name),args),value={...ev,address:addresses[k],blockNumber:'0x2',blockHash,transactionHash:hash,logIndex:'0x0',removed:false};logs.push(value);return value}
 function record(k,event,args){const eventLog=log(k,event,args);receipts.set(hash,{transactionHash:hash,blockNumber:'0x2',blockHash,status:reverted?'0x0':'0x1',to:addresses[k],from:account,logs:[eventLog]})}
 const provider={on(event,fn){listeners.set(event,fn)},removeListener(event){listeners.delete(event)},async request({method,params=[]}){
  calls.push({method,params});
  if(method==='eth_chainId')return chain;if(method==='eth_accounts')return account?[account]:[];
  if(method==='wallet_switchEthereumChain'){chain=params[0].chainId;return null}
  if(method==='eth_getCode')return code;
  if(method==='eth_estimateGas')return '0x20000';
  if(method==='eth_getStorageAt')return '0x'+addresses.brainImplementation.slice(2).padStart(64,'0');
  if(method==='eth_blockNumber')return '0x2';
  if(method==='eth_getBlockByNumber')return {timestamp:'0x64',hash:blockHash};
  if(method==='eth_getTransactionReceipt'){if(pendingReceipts-->0)return null;return receipts.get(params[0])??null}
  if(method==='eth_getLogs')return suppressLogs?[]:logs.filter(l=>l.address===params[0].address&&params[0].topics.every((t,i)=>t===null||t===l.topics[i]));
  if(method==='eth_sendTransaction'){
   if(sendDelay)await sendDelay;
   if(sendError)throw sendError;const k=keyFor(params[0].to),parsed=abi[k].parseTransaction(params[0]);
   if(parsed.name==='createOrder'){if(!reverted){phase='pending';record(k,'OrderCreated',[1,account])}else receipts.set(hash,{status:'0x0',to:addresses[k],from:account,transactionHash:hash});}
   if(parsed.name==='approve'){approved=Number(codec.formatUnits(parsed.args[1],18));record(k,'Approval',[account,addresses.brainProxy,parsed.args[1]])}
   if(parsed.name==='depositMargin'){const n=Number(codec.formatUnits(parsed.args[0],18));amount+=n;token-=n;record(k,'MarginDeposited',[account,parsed.args[0],parsed.args[0]])}
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
    case 'balanceOf':out=[wad(token)];break;case 'allowance':out=[wad(approved)];break;
    case 'principalOf':out=[wad(amount)];break;case 'lockedPrincipalOf':out=[wad(phase==='filled'?2:0)];break;
    case 'availablePrincipal':out=[wad(amount-(phase==='filled'?2:0))];break;
    case 'readMarketPrice':if(stale)throw {code:'CALL_EXCEPTION'};out=[wad(100),100,3];break;
    case 'marketConfig':out=[100,50,3600,1,wad(1000000),true];break;
    case 'nextOrderId':out=[phase==='none'?1:2];break;
    case 'order':out=[[1,account,0,wad(100),2,wad(100),90,phase!=='pending'?100:0,wad(100),wad(100),phase!=='pending'?1:0,phase!=='pending'?2:1,wad(99),100,1]];break;
    case 'positionSnapshot':out=[[account,0,wad(2),wad(phase==='filled'?2:0),wad(100),100,phase==='filled'?0:101,0,0,0,0,phase==='liquidated'?3:phase==='closed'?2:1]];break;
    case 'orderTerms':out=[1,wad(100),2,wad(100),100,1];break;
    case 'markPosition':if(stale)throw {code:'CALL_EXCEPTION'};out=[wad(0.1),wad(2.1),wad(0.01),false];break;
    case 'liquidationBoundary':out=[wad(99.5)];break;
    case 'fillReceipt':out=[[1,1,account,0,wad(100),2,90,100,wad(99),wad(100),wad(100),wad(100),wad(1000),wad(2),wad(998),1,1]];break;
    case 'settlementReceipt':out=[[1,1,0,wad(100),2,wad(100),wad(99.5),wad(100),wad(99),101,101,wad(2),0,wad(-2),wad(-2),0,phase==='liquidated'?3:2,account,1,wad(99),101,2]];break;
    case 'createOrder':out=[1];break;case 'approve':out=[true];break;case 'depositMargin':out=[parsed.args[0]];break;case 'faucet':out=[];break;
    case 'closePosition':out=[];break;
    default:throw new Error(`fixture missing ${parsed.name}`);
   }
   const encoded=abi[k].encodeFunctionResult(parsed.name,out);
   if(blockedRead&&parsed.name==='principalOf'){const wait=blockedRead;blockedRead=null;await wait}
   return encoded;
  }
  throw new Error(`fixture missing RPC ${method}`);
 }};
 return {deployment,provider,calls,make:(extra={})=>createExecutionAdapter({deployment,ethereum:provider,ethers:codec,pollMs:1,receiptTimeoutMs:3000,...extra}),
  setChain:v=>{chain=v},setAccount:v=>{account=v;listeners.get('accountsChanged')?.(v?[v]:[])},
  setReject:()=>{sendError={code:4001}},setRevert:()=>{reverted=true},setPending:n=>{pendingReceipts=n},setStale:()=>{stale=true},
  setCloseLiquidates:()=>{closeLiquidates=true},setAmount:v=>{amount=v},setSuppressLogs:v=>{suppressLogs=!!v},
  delaySend:()=>{let release;sendDelay=new Promise(r=>{release=r});return ()=>{release();sendDelay=null}},
  delayRead:()=>{let release;blockedRead=new Promise(r=>{release=r});return release},
  fill(){phase='filled';record('orderTriggerEngine','OrderFilled',[1,1,wad(100)])}};
}
const onchainInput={axis:'KX',market:'BTCUSDT',c:100,lots:2,currentPrice:100,triggerPrice:100};
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
