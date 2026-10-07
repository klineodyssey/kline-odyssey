import assert from 'node:assert/strict';
import {createKgenLedger,requiredMargin,reserveOrder,cancelReservedOrder,activateMargin,closeMargin,snapshot,pnlForMove,maxAdversePoints,positionRisk,MAX_C_LEVERAGE,normalizeSignedC,signedCFromLegacyMagnitude} from '../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs';
import {formatUnits,readNativeBalance,readErc20Balance,assertExecutableOrder,createWalletSession,PUBLIC_WALLET_IDENTITY_KEY,bindTempleReturnWalletContinuity,KGEN_TOKEN_ADDRESS,KGEN_CHAIN_ID} from '../K線西遊記/temples/11520/runtime/evm-wallet-runtime.mjs';
import {placeSimulationOrder,cancelSimulationOrder,observeSimulationPrice,closeSimulationPosition,simulationSnapshot,touchedOrCrossed} from '../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs';
import {C_DETENTS} from '../K線西遊記/temples/11520/controls/nonlinear-controls.mjs';

assert.equal(MAX_C_LEVERAGE,100);
assert.equal(requiredMargin({lots:8}),8);
assert.equal(requiredMargin({lots:100}),100);
assert.equal(pnlForMove({entry:100,mark:101,side:'多',lots:100,c:100}),10000);
assert.equal(pnlForMove({entry:100,mark:99,side:'多',lots:100,c:100}),-10000);
assert.equal(pnlForMove({entry:100,mark:101,side:'空',lots:100,c:-100}),-10000);
assert.equal(signedCFromLegacyMagnitude(100,'空'),-100);
assert.equal(normalizeSignedC(-0,{allowNeutral:true}),0);
for(const c of C_DETENTS){
  assert.equal(normalizeSignedC(c,{allowNeutral:true}),c);
  if(c!==0)assert.ok(Math.abs(pnlForMove({entry:100,mark:101,lots:1,c})-c)<1e-12);
}
for(const c of [.0001,-.0001,.3,-.3,3.742,-3.742,17.382,-17.382,99.6,-99.6]){
  assert.throws(()=>normalizeSignedC(c),/INVALID_C_DETENT/);
  assert.throws(()=>maxAdversePoints(c,100),/INVALID_C_DETENT/);
  assert.throws(()=>signedCFromLegacyMagnitude(Math.abs(c),c<0?'SHORT':'LONG'),/INVALID_C_DETENT/);
  assert.equal(assertExecutableOrder({wallet:{account:'0x1',chainId:56},chainId:56,marketAdapter:{preview(){},submit(){}},order:{axis:'KX',side:c<0?'SHORT':'LONG',notional:1,c,lots:1}}).reason,'INVALID_C_DETENT');
}
for(const c of [100.001,-100.001,1000,-1000])assert.throws(()=>normalizeSignedC(c),/C_LEVERAGE_OUT_OF_RANGE/);
for(const c of [0,-0,101,-101,1000,-1000,NaN,Infinity])assert.throws(()=>pnlForMove({entry:100,mark:101,lots:1,c}),/C_/);
for(const lots of [0,-1,.5,100.1,101,NaN,Infinity])assert.throws(()=>requiredMargin({lots}),/LOTS_OUT_OF_RANGE/);
for(const [c,side] of [[100,'SHORT'],[-100,'LONG'],[1,'invalid']])assert.throws(()=>pnlForMove({entry:100,mark:101,lots:1,c,side}),/C_SIDE_MISMATCH|SIDE_NOT_SUPPORTED/);
for(const c of [-100,100])for(const lots of [1,100])for(const change of [-.02,-.01,-.005,-.001,.001,.005,.01,.02]){
  const r=positionRisk({entry:10000,mark:10000*(1+change),c,lots});
  assert.ok(Math.abs(r.rawPnl-10000*change*c*lots)<1e-5);
  assert.equal(r.remaining,Math.max(0,lots+r.pnl));
  assert.ok(r.pnl>=-lots,'isolated loss cannot consume other principal');
}
assert.equal(maxAdversePoints(100,100),.01);
assert.equal(maxAdversePoints(50,100),.02);
assert.throws(()=>pnlForMove({entry:100,mark:101,side:'多',lots:1,c:1000}),/C_LEVERAGE_OUT_OF_RANGE/);
assert.throws(()=>pnlForMove({entry:100,mark:101,side:'多',lots:1,c:'not-a-number'}),/C_LEVERAGE_OUT_OF_RANGE/);
assert.throws(()=>pnlForMove({entry:100,mark:Infinity,side:'多',lots:1,c:1}),/MARK_PRICE_MUST_BE_POSITIVE/);
assert.throws(()=>pnlForMove({entry:100,mark:101,side:'多',lots:Infinity,c:1}),/LOTS_OUT_OF_RANGE/);
assert.throws(()=>positionRisk({entry:100,mark:NaN,side:'多',lots:1,c:1}),/MARK_PRICE_MUST_BE_POSITIVE/);
const blown=positionRisk({entry:100,mark:99,side:'多',lots:100,c:100});
assert.equal(blown.principal,100);assert.equal(blown.pnl,-100);assert.equal(blown.remaining,0);assert.equal(blown.liquidated,true);assert.equal(blown.liquidationMark,99.99);
const safe=positionRisk({entry:100,mark:99.99,side:'多',lots:100,c:50});
assert.ok(Math.abs(safe.pnl+50)<1e-8);assert.ok(Math.abs(safe.remaining-50)<1e-8);assert.equal(safe.liquidated,false);assert.equal(safe.liquidationMark,99.98);

const ledger=createKgenLedger(100);
assert.equal(reserveOrder(ledger,10).ok,true);
assert.deepEqual(snapshot(ledger),{total:100,free:90,lockedMargin:0,reservedOrders:10,unrealizedPnl:0,realizedPnl:0,equity:100});
assert.equal(cancelReservedOrder(ledger,10).ok,true);
assert.equal(reserveOrder(ledger,10).ok,true);
assert.equal(activateMargin(ledger,10).amount,10);
closeMargin(ledger,{margin:10,pnl:-20});
assert.equal(snapshot(ledger).free,90);
assert.equal(snapshot(ledger).realizedPnl,-10);

assert.equal(formatUnits(1234500000000000000n,18),'1.2345');
const mock={request:async ({method})=>method==='eth_call'?'0x'+(10n**18n).toString(16).padStart(64,'0'):null};
const balance=await readErc20Balance({provider:mock,token:'0x0000000000000000000000000000000000000001',account:'0x0000000000000000000000000000000000000002'});
assert.equal(balance.formatted,'1');
assert.equal(assertExecutableOrder({wallet:{account:'0x1',chainId:56},chainId:56,marketAdapter:{preview(){},submit(){}},order:{axis:'KX',side:'LONG',notional:1,c:1,lots:1}}).ok,true);
for(const order of [{axis:'KX',side:'LONG',notional:1},{axis:'KX',side:'LONG',notional:1,c:-1,lots:1},{axis:'KX',side:'LONG',notional:1,c:1000,lots:1},{axis:'KX',side:'LONG',notional:1,c:1,lots:-1}])assert.equal(assertExecutableOrder({wallet:{account:'0x1',chainId:56},chainId:56,marketAdapter:{preview(){},submit(){}},order}).ok,false);
assert.equal(assertExecutableOrder({wallet:{account:'0x1',chainId:56},chainId:56,marketAdapter:null,order:{axis:'KX',side:'LONG',notional:1}}).reason,'NO_VERIFIED_MARKET_ADAPTER');
console.log('11520 KGEN 100C leverage cap + isolated wallet foundation PASS');

assert.equal(touchedOrCrossed(99900,100000,100050),true);
assert.equal(touchedOrCrossed(100050,100000,99900),true);
assert.equal(touchedOrCrossed(99900,100000,100000),true);
assert.equal(touchedOrCrossed(99900,100000,99950),false);
assert.equal(touchedOrCrossed(100000,100000,100050),false,'a pre-existing touch moving away is not a new fill');
assert.equal(touchedOrCrossed(100000,100000,99900),false,'moving away downward also requires a later new touch/cross');
const tick=(l,price,at)=>observeSimulationPrice(l,{market:'BTCUSDT',price,observedAt:at,now:at});
const order=(l,params={})=>placeSimulationOrder(l,{axis:'KX',market:'BTCUSDT',c:100,lots:100,triggerPrice:100,now:1001,...params});
// Every legal signed detent survives pending -> fill -> mark -> close -> receipt
// without integer rounding, clamping, loss of sub-C precision or wallet mixing.
for(const c of C_DETENTS.filter(c=>c!==0)){
  const l=createKgenLedger(1000);tick(l,99,1000);
  assert.equal(order(l,{c,lots:1}).ok,true);
  assert.equal(tick(l,100,1002).ok,true);
  const filled=simulationSnapshot(l);
  assert.equal(filled.orders[0].c,c);assert.equal(filled.positions[0].c,c);assert.equal(filled.receipts[0].c,c);
  assert.equal(l.free,999);assert.equal(l.lockedMargin,1);
  tick(l,100.001,1003);
  assert.ok(Math.abs(l.unrealizedPnl-.001*c)<1e-10);
  assert.equal(closeSimulationPosition(l,filled.positions[0].positionId,{now:1004}).ok,true);
  const closed=simulationSnapshot(l);
  assert.equal(closed.receipts[1].c,c);assert.equal(closed.receipts[1].status,'CLOSED');
  assert.equal(l.lockedMargin,0);assert.ok(Math.abs(l.free-(1000+.001*c))<1e-10);
}
for(const c of [.3,-.3,3.742,17.382,99.6,100.001,-100.001,1000,-1000]){
  const l=createKgenLedger(1000);tick(l,99,1000);const before=structuredClone(l);
  assert.equal(order(l,{c,lots:1}).ok,false);assert.deepEqual(l,before);
}
{
  const l=createKgenLedger(1000);tick(l,99,1000);order(l,{c:1,lots:1});
  l.simulation.orders[0].c=17.382;const before=structuredClone(l);
  assert.equal(tick(l,100,1002).reason,'INVALID_C_DETENT');assert.deepEqual(l,before,'noncanonical persisted record cannot lock margin or emit a fill');
}
for(const c of [100,-100])for(const lots of [1,100]){
  const l=createKgenLedger(1000);assert.equal(tick(l,99,1000).ok,true);
  const created=order(l,{c,lots});assert.equal(created.order.status,'PENDING');assert.equal(l.free,1000);assert.equal(l.lockedMargin,0);
  assert.equal(tick(l,99.5,1002).events.length,0);
  assert.equal(tick(l,100,1003).events[0].status,'FILLED');
  const filled=simulationSnapshot(l),position=filled.positions[0];
  assert.equal(l.free,1000-lots);assert.equal(l.lockedMargin,lots);assert.equal(filled.receipts.length,1);
  assert.equal(filled.receipts[0].walletBefore,1000);assert.equal(filled.receipts[0].walletAfter,1000-lots);
  assert.equal(filled.receipts[0].previousPrice,99.5);assert.equal(filled.receipts[0].marginLocked,lots);
  assert.throws(()=>{l.simulation.receipts[0].walletAfter=9999},TypeError);
  filled.receipts[0].walletAfter=9999;assert.equal(simulationSnapshot(l).receipts[0].walletAfter,1000-lots);
  const before=structuredClone(l);assert.equal(tick(l,100,1003).reason,'OUT_OF_ORDER_PRICE');assert.deepEqual(l,before);
  assert.equal(observeSimulationPrice(l,{market:'BTCUSDT',price:101,observedAt:1004,now:17005}).reason,'STALE_PRICE');assert.deepEqual(l,before);
  const gap=c>0?98:102;assert.equal(tick(l,gap,1004).events[0].status,'LIQUIDATED');
  const dead=simulationSnapshot(l),receipt=dead.receipts[1];
  assert.equal(dead.positions[0].margin,0);assert.equal(dead.positions[0].status,'LIQUIDATED');
  assert.equal(receipt.marginBefore,lots);assert.equal(receipt.marginAfter,0);assert.ok(Math.abs(receipt.badDebt-199*lots)<1e-9);
  assert.equal(receipt.liquidationTrigger,c>0?99.99:100.01,'receipt boundary remains based on entry and C after margin is zeroed');
  assert.equal(l.free,1000-lots);assert.equal(l.lockedMargin,0);assert.equal(l.realizedPnl,-lots);assert.equal(l.unrealizedPnl,0);
  assert.equal(tick(l,100,1005).events.length,0);assert.equal(simulationSnapshot(l).receipts.length,2);
  assert.equal(closeSimulationPosition(l,position.positionId,{now:1006}).reason,'POSITION_NOT_OPEN');
}
{
  const l=createKgenLedger(1000);tick(l,100,1000);order(l);tick(l,100.5,1002);
  assert.equal(simulationSnapshot(l).orders[0].status,'PENDING');assert.equal(l.lockedMargin,0);assert.equal(l.free,1000);
  tick(l,99.5,1003);assert.equal(simulationSnapshot(l).orders[0].status,'FILLED');assert.equal(simulationSnapshot(l).receipts[0].previousPrice,100.5);
}
{
  const l=createKgenLedger(1000);tick(l,100,1000);const o=order(l,{triggerPrice:101});
  assert.equal(cancelSimulationOrder(l,o.order.orderId).ok,true);tick(l,102,1002);assert.equal(simulationSnapshot(l).receipts.length,0);assert.equal(l.free,1000);
}
{
  const l=createKgenLedger(1000);tick(l,100,1000);order(l,{stopPrice:99.995,takeProfitPrice:101});tick(l,100,1002);tick(l,99.995,1003);
  assert.equal(simulationSnapshot(l).positions[0].status,'STOPPED');assert.ok(Math.abs(l.free-950)<1e-8);
}
{
  const l=createKgenLedger(1000);tick(l,100,1000);order(l,{c:-100,takeProfitPrice:99.995});tick(l,100,1002);tick(l,99.995,1003);
  assert.equal(simulationSnapshot(l).positions[0].status,'TAKE_PROFIT');assert.ok(Math.abs(l.free-1050)<1e-8);
}
{
  const l=createKgenLedger(1000);tick(l,100,1000);order(l);tick(l,100,1002);tick(l,100.1,1003);
  const p=simulationSnapshot(l).positions[0];assert.ok(l.unrealizedPnl>0);assert.equal(closeSimulationPosition(l,p.positionId,{now:1004}).ok,true);assert.equal(l.lockedMargin,0);assert.equal(l.unrealizedPnl,0);
  assert.equal(simulationSnapshot(l).receipts[1].status,'CLOSED');
}
{
  const l=createKgenLedger(1000);tick(l,100,1000);order(l);l.free=0;
  tick(l,100,1002);assert.equal(simulationSnapshot(l).orders[0].status,'REJECTED');assert.equal(l.lockedMargin,0);assert.equal(simulationSnapshot(l).receipts.length,0);
}
console.log('11520 existing-ledger simulation pending/cross/one-shot/isolated receipts PASS');

// EIP-1193 wallet connection is public-address/read-only balance state, not a ledger.
const accountA='0x0000000000000000000000000000000000000001';
const accountB='0x0000000000000000000000000000000000000002';
const abiBalance=value=>'0x'+(BigInt(value)*10n**18n).toString(16).padStart(64,'0');
for(const invalid of ['0x','',null,undefined,'garbage','0xwrong',0]){
  await assert.rejects(()=>readNativeBalance({provider:{request:async()=>invalid},account:accountA}),/INVALID_BALANCE_RESPONSE/,'invalid native response must not become zero');
}
assert.equal((await readNativeBalance({provider:{request:async()=>'0x0'},account:accountA})).formatted,'0');
function walletProvider(){
  const listeners=new Map(),calls=[];
  const provider={accounts:[accountA],chain:'0x38',token:abiBalance(123),calls,handler:null,
    async request(args){calls.push(args);if(provider.handler){const handled=provider.handler(args);if(handled!==undefined)return handled}switch(args.method){case 'eth_requestAccounts':case 'eth_accounts':return provider.accounts;case 'eth_chainId':return provider.chain;case 'eth_getBalance':return '0xde0b6b3a7640000';case 'eth_call':return provider.token;default:throw new Error('Forbidden request '+args.method)}},
    on(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn)},
    removeListener(name,fn){listeners.get(name)?.delete(fn)},
    emit(name,value){for(const fn of [...(listeners.get(name)||[])])fn(value)},
    listenerCount(){return [...listeners.values()].reduce((sum,set)=>sum+set.size,0)}
  };return provider;
}
const microtasks=async()=>{for(let i=0;i<30;i++)await Promise.resolve()};
{
  const previousDocument=globalThis.document;
  try{
    const link={dataset:{kaiosReturn:'PORTAL'}},status={},p=walletProvider(),data=new Map();
    const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
    globalThis.document={getElementById:id=>id==='return-to-11520'?link:status};
    await bindTempleReturnWalletContinuity({sourceWorld:'K12345',returnTitle:'回 KAIOS',ethereum:p,storage});
    assert.equal(link.title,'回 KAIOS');assert.equal(link.dataset.walletContinuity,'retained');
    p.accounts=[accountB];p.emit('accountsChanged',p.accounts);await microtasks();
    assert.equal(link.title,'回 KAIOS','account changes must not overwrite the Portal tooltip');
    assert.equal(JSON.parse(data.get(PUBLIC_WALLET_IDENTITY_KEY)).address,accountB,'tooltip cannot change wallet continuity');
    assert.ok(status.textContent.includes('0002'));
    await bindTempleReturnWalletContinuity({sourceWorld:'K16888',ethereum:walletProvider(),storage});
    assert.match(link.title,/返回 KAIOS 總世界 並保留公開錢包識別/,'other worlds retain their default tooltip');
    assert.ok(p.calls.every(({method})=>['eth_accounts','eth_chainId'].includes(method)),'tooltip change is read-only');
  }finally{if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;}
}
{
  const p=walletProvider(),data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  const s=createWalletSession({ethereum:p,storage}),states=[];const unsubscribe=s.subscribe(value=>states.push(value));
  assert.equal(p.calls.length,0,'construction and subscription cannot request wallet access');
  assert.equal(s.snapshot().status,'DISCONNECTED');
  const connected=await s.connect();assert.equal(connected.status,'CONNECTED');assert.equal(connected.account,accountA);assert.equal(connected.chainId,56);
  assert.equal(connected.kgen,'123');assert.equal(connected.bnb,'1');assert.equal(connected.balanceReadOnly,true);assert.equal(connected.executionMode,'SIMULATION');
  assert.equal(JSON.parse(data.get(PUBLIC_WALLET_IDENTITY_KEY)).address,accountA,'public identity continuity remains compatible');
  assert.equal(p.listenerCount(),3);assert.ok(Object.isFrozen(connected));
  p.accounts=[accountB];p.token=abiBalance(9);p.emit('accountsChanged',p.accounts);
  assert.equal(s.snapshot().kgen,null,'old address balance is cleared synchronously');await microtasks();
  assert.equal(s.snapshot().account,accountB);assert.equal(s.snapshot().kgen,'9');
  p.chain='0x1';p.emit('chainChanged',p.chain);assert.equal(s.snapshot().kgen,null);await microtasks();
  assert.equal(s.snapshot().status,'WRONG_CHAIN');assert.equal(s.snapshot().chainId,1);assert.equal(s.snapshot().kgen,null);assert.equal(s.snapshot().bnb,null);
  p.chain='0x38';p.emit('chainChanged',p.chain);await microtasks();assert.equal(s.snapshot().status,'CONNECTED');
  p.emit('disconnect',{code:4900});assert.equal(s.snapshot().status,'DISCONNECTED');assert.equal(s.snapshot().account,null);assert.equal(s.snapshot().kgen,null);assert.equal(p.listenerCount(),0);
  await s.connect();s.disconnect();assert.equal(p.listenerCount(),0);p.emit('accountsChanged',[accountA]);await microtasks();assert.equal(s.snapshot().account,null,'logical disconnect detaches events');
  assert.ok(p.calls.every(({method})=>['eth_requestAccounts','eth_accounts','eth_chainId','eth_getBalance','eth_call'].includes(method)),'no chain switch/sign/send');
  assert.ok(states.some(value=>value.status==='READING'));unsubscribe();s.dispose();
}
{
  const p=walletProvider(),s=createWalletSession({ethereum:p});await s.connect();
  p.handler=({method})=>method==='eth_requestAccounts'?Promise.reject({code:4001,message:'provider text must not be exposed'}):undefined;
  assert.equal((await s.connect()).error,'USER_REJECTED');assert.equal(s.snapshot().account,null);assert.equal(s.snapshot().kgen,null);
  p.handler=null;p.accounts=['not-an-address'];assert.equal((await s.connect()).error,'INVALID_ACCOUNT');assert.equal(s.snapshot().kgen,null);
  p.accounts=[accountA];p.token='0x';assert.equal((await s.connect()).error,'INVALID_BALANCE_RESPONSE');assert.equal(s.snapshot().kgen,null,'empty eth_call is unknown, never fake zero');
  p.token=abiBalance(0);assert.equal((await s.refresh()).kgen,'0','proper ABI zero is a verified zero');
  p.handler=({method})=>method==='eth_getBalance'?'0x':undefined;
  assert.equal((await s.refresh()).error,'INVALID_BALANCE_RESPONSE');assert.equal(s.snapshot().bnb,null);assert.equal(s.snapshot().kgen,null,'invalid native read cannot retain a stale verified wallet');p.handler=null;
  p.chain='0x38garbage';assert.equal((await s.refresh()).error,'INVALID_CHAIN_ID');assert.equal(s.snapshot().account,null);s.dispose();
}
{
  const p=walletProvider(),s=createWalletSession({ethereum:p});await s.connect();
  let release;let started=false;
  p.handler=({method})=>method==='eth_call'&&!started?(started=true,new Promise(resolve=>{release=resolve})):undefined;
  const oldRead=s.refresh();await microtasks();assert.equal(started,true);
  p.accounts=[accountB];p.token=abiBalance(7);p.emit('accountsChanged',p.accounts);await microtasks();
  assert.equal(s.snapshot().account,accountB);assert.equal(s.snapshot().kgen,'7');
  release(abiBalance(999));await oldRead;assert.equal(s.snapshot().kgen,'7','late previous-account response cannot overwrite new account');
  started=false;const disconnectedRead=s.refresh();await microtasks();s.disconnect();release(abiBalance(888));await disconnectedRead;
  assert.equal(s.snapshot().status,'DISCONNECTED');assert.equal(s.snapshot().account,null);assert.equal(s.snapshot().kgen,null,'late response cannot resurrect disconnected state');s.dispose();
}
{
  const p=walletProvider(),s=createWalletSession({ethereum:p});await s.connect();let release,started=false;
  p.handler=({method})=>method==='eth_call'&&!started?(started=true,new Promise(resolve=>{release=resolve})):undefined;
  const read=s.refresh();await microtasks();p.chain='0x61';p.emit('chainChanged',p.chain);await microtasks();
  assert.equal(s.snapshot().status,'WRONG_CHAIN');release(abiBalance(999));await read;
  assert.equal(s.snapshot().chainId,97);assert.equal(s.snapshot().kgen,null,'BSC balance cannot survive a Testnet chain change');s.dispose();
}
{
  const p=walletProvider(),s=createWalletSession({ethereum:p,timeoutMs:5});
  p.handler=({method})=>method==='eth_requestAccounts'?new Promise(()=>{}):undefined;
  assert.equal((await s.connect()).error,'WALLET_TIMEOUT');assert.equal(s.snapshot().kgen,null);
  p.handler=null;assert.equal((await s.connect()).status,'CONNECTED','timeout is recoverable');s.dispose();assert.equal(p.listenerCount(),0);
}
console.log('11520 read-only EIP-1193 connect/account/chain/disconnect/race/rejection/timeout PASS');

// BSC56 identity evidence only. This test seam is not a wallet/execution adapter.
// Public evidence is opt-in for the dedicated required CI job; default runs use
// deterministic read-only transports and preserve all earlier financial guards.
const bsc56Test=(await import('node:test')).default;
const bsc56Codec=(await import('node:module')).createRequire(import.meta.url)('../K線西遊記/assets/ethers-5.7.2.umd.min.js').ethers.utils;
const bsc56Kgen=KGEN_TOKEN_ADDRESS;
const bsc56Endpoint='https://bsc-dataseed.bnbchain.org';
const bsc56ProxySlots={implementation:'0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',admin:'0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103',beacon:'0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50'};
const bsc56Abi=new bsc56Codec.Interface(['function name() view returns(string)','function symbol() view returns(string)','function decimals() view returns(uint8)','function owner() view returns(address)']);

async function inspectBsc56PinnedKgen({transport,expected,now=Date.now()}={}){
 const evidence={schema:'K11520_BSC56_PINNED_KGEN_IDENTITY_V1',scope:'KGEN_IDENTITY_ONLY_NOT_TRADING_READINESS',status:'UNKNOWN',failureCode:null,endpoint:bsc56Endpoint,requests:[],block:null,readback:null,sourceBinding:expected?.sourceBinding||null,signatures:0,transactionsSent:0,executionReady:false,candidateContractsVerified:false};
 const hash=v=>typeof v==='string'&&/^0x[0-9a-fA-F]{64}$/.test(v)&&!/^0x0{64}$/i.test(v);
 const quantity=v=>typeof v==='string'&&v.length<=66&&/^0x(?:0|[1-9a-f][0-9a-f]*)$/.test(v);
 const fail=(code,status='UNKNOWN')=>{const error=new Error(code);error.evidenceStatus=status;throw error};
 const batch=async requests=>{
  if(requests.length>10||requests.some(r=>!['eth_chainId','eth_getBlockByNumber','eth_getCode','eth_call','eth_getStorageAt'].includes(r.method)))fail('READ_ONLY_RPC_ALLOWLIST');
  evidence.requests.push(...requests.map(r=>({id:r.id,method:r.method,params:structuredClone(r.params)})));
  let responses;try{responses=await transport(requests)}catch{fail('RPC_TRANSPORT_UNAVAILABLE')}
  if(!Array.isArray(responses)||responses.length!==requests.length)fail('RPC_BATCH_INCOMPLETE');
  const ids=new Set(),byId=new Map();for(const r of responses){if(r?.jsonrpc!=='2.0'||!Number.isInteger(r.id)||ids.has(r.id)||!requests.some(q=>q.id===r.id))fail('RPC_BATCH_ID_MISMATCH');ids.add(r.id);byId.set(r.id,r)}
  return requests.map(q=>{const r=byId.get(q.id);if(!r)fail('RPC_BATCH_INCOMPLETE');if(r.error){evidence.rpcFailure={method:q.method,code:Number.isInteger(r.error.code)?r.error.code:null};fail('RPC_RESULT_UNAVAILABLE')}if(!Object.hasOwn(r,'result')||r.result===null)fail('RPC_RESULT_MISSING');return r.result});
 };
 try{
  if(expected?.address!==bsc56Kgen||expected.chainId!==KGEN_CHAIN_ID||expected.decimals!==18||!hash(expected.codeHash)||! /^[0-9a-f]{64}$/.test(expected.sourceBinding?.manifestSha256||'')||! /^[0-9a-f]{64}$/.test(expected.sourceBinding?.tokenSourceSha256||'')||expected.sourceBinding.tokenSourceSha256!==expected.sourceBinding.expectedTokenSourceSha256)fail('REVIEWED_CANON_SOURCE_BINDING_REQUIRED');
  const [chain,head]=await batch([{jsonrpc:'2.0',id:1,method:'eth_chainId',params:[]},{jsonrpc:'2.0',id:2,method:'eth_getBlockByNumber',params:['latest',false]}]);
  if(chain!=='0x38')fail('BSC56_CHAIN_ID_MISMATCH','CANON_CONFLICT');
  if(!quantity(head?.number)||!hash(head?.hash)||!quantity(head?.timestamp))fail('BLOCK_IDENTITY_MISSING');
  const stamp=BigInt(head.timestamp),nowSeconds=BigInt(Math.floor(now/1000));
  if(!Number.isSafeInteger(now)||stamp>nowSeconds+30n||nowSeconds-stamp>180n)fail('LATEST_HEAD_TIME_UNVERIFIED');
  evidence.block={number:head.number,hash:head.hash.toLowerCase(),timestampSeconds:stamp.toString()};
  // EIP-1898 hash references prevent cross-fork state mixing. Unsupported/hash-
  // pruned RPC results stay UNKNOWN; never retry as an unpinned latest read.
  const blockRef={blockHash:evidence.block.hash,requireCanonical:true};
  const calls=['decimals','symbol','name','owner'].map((name,index)=>({jsonrpc:'2.0',id:index+4,method:'eth_call',params:[{to:bsc56Kgen,data:bsc56Abi.encodeFunctionData(name,[])},blockRef]}));
  const values=await batch([{jsonrpc:'2.0',id:3,method:'eth_getCode',params:[bsc56Kgen,blockRef]},...calls,...Object.values(bsc56ProxySlots).map((slot,index)=>({jsonrpc:'2.0',id:index+10,method:'eth_getStorageAt',params:[bsc56Kgen,slot,blockRef]})),{jsonrpc:'2.0',id:8,method:'eth_getBlockByNumber',params:[head.number,false]},{jsonrpc:'2.0',id:9,method:'eth_chainId',params:[]}]);
  const [code,decimalsRaw,symbolRaw,nameRaw,ownerRaw,implementationSlot,adminSlot,beaconSlot,confirmed,finalChain]=values;
  if(finalChain!=='0x38')fail('BSC56_CHAIN_CHANGED','CANON_CONFLICT');
  if(confirmed?.number!==head.number||confirmed?.hash?.toLowerCase()!==evidence.block.hash||confirmed?.timestamp!==head.timestamp)fail('PINNED_BLOCK_CHANGED');
  if(code==='0x')fail('CANONICAL_KGEN_CODE_ABSENT','NOT_DEPLOYED');
  if(typeof code!=='string'||!/^0x(?:[0-9a-fA-F]{2})+$/.test(code)||code.length>131074)fail('CONTRACT_CODE_INVALID');
  const codeHash=bsc56Codec.keccak256(code);let decimals,symbol,name,owner;
  try{if([decimalsRaw,symbolRaw,nameRaw,ownerRaw].some(raw=>typeof raw!=='string'||raw.length>1024))fail('TOKEN_GETTER_RESPONSE_INVALID');decimals=Number(bsc56Abi.decodeFunctionResult('decimals',decimalsRaw)[0]);symbol=bsc56Abi.decodeFunctionResult('symbol',symbolRaw)[0];name=bsc56Abi.decodeFunctionResult('name',nameRaw)[0];owner=bsc56Abi.decodeFunctionResult('owner',ownerRaw)[0]}catch{fail('TOKEN_GETTER_RESPONSE_INVALID')}
  evidence.readback={address:bsc56Kgen,codeBytes:(code.length-2)/2,codeHash,decimals,symbol,name,owner};
  const slots={implementation:implementationSlot,admin:adminSlot,beacon:beaconSlot};
  if(Object.values(slots).some(value=>typeof value!=='string'||!/^0x[0-9a-fA-F]{64}$/.test(value)))fail('TOKEN_PROXY_SLOT_RESPONSE_INVALID');
  evidence.readback.proxyInspection={standard:'EIP1967',slots,interpretation:'Zero standard slots alone do not prove absence of every possible proxy design'};
  if(Object.values(slots).some(value=>!/^0x0{64}$/i.test(value)))fail('UNEXPECTED_TOKEN_PROXY_BINDING','CANON_CONFLICT');
  if(codeHash!==expected.codeHash.toLowerCase()||decimals!==18||symbol!=='KGEN'||name!=='KLINE GENESIS')fail('CANONICAL_KGEN_IDENTITY_MISMATCH','CANON_CONFLICT');
  evidence.status='READY';return evidence;
 }catch(error){evidence.status=error.evidenceStatus||'UNKNOWN';evidence.failureCode=/^[A-Z][A-Z0-9_]+$/.test(error.message||'')?error.message:'READBACK_UNAVAILABLE';return evidence}
}

function bsc56IdentityFixture(change=()=>{}){
 const code='0x60006000',hash='0x'+'12'.repeat(32),timestamp=1791344245;
 const expected={address:bsc56Kgen,chainId:56,decimals:18,codeHash:bsc56Codec.keccak256(code),sourceBinding:{manifestSha256:'a'.repeat(64),tokenSourceSha256:'b'.repeat(64),expectedTokenSourceSha256:'b'.repeat(64),classification:'SYNTHETIC_LOCAL_TEST_NOT_DEPLOYED'}};
 const requests=[];const transport=async batch=>{requests.push(...structuredClone(batch));const header={number:'0x7855f83',hash,timestamp:'0x'+timestamp.toString(16)};
  const result={1:'0x38',2:header,3:code,4:bsc56Abi.encodeFunctionResult('decimals',[18]),5:bsc56Abi.encodeFunctionResult('symbol',['KGEN']),6:bsc56Abi.encodeFunctionResult('name',['KLINE GENESIS']),7:bsc56Abi.encodeFunctionResult('owner',['0x'+'34'.repeat(20)]),8:header,9:'0x38',10:'0x'+'00'.repeat(32),11:'0x'+'00'.repeat(32),12:'0x'+'00'.repeat(32)};
  const responses=batch.map(q=>({jsonrpc:'2.0',id:q.id,result:structuredClone(result[q.id])}));change(responses,batch);return responses.reverse()};
 return {expected,transport,now:(timestamp+1)*1000,requests,hash};
}

bsc56Test('BSC56 pinned identity uses exactly two bounded batches and hash-bound read-only state',async()=>{
 const f=bsc56IdentityFixture(),r=await inspectBsc56PinnedKgen(f);assert.equal(r.status,'READY');assert.equal(f.requests.length,12);assert.equal(r.executionReady,false);assert.equal(r.candidateContractsVerified,false);
 for(const q of f.requests.filter(q=>['eth_call','eth_getCode','eth_getStorageAt'].includes(q.method)))assert.deepEqual(q.params.at(-1),{blockHash:f.hash,requireCanonical:true});
 assert.ok(f.requests.every(q=>['eth_chainId','eth_getBlockByNumber','eth_getCode','eth_call','eth_getStorageAt'].includes(q.method)));assert.equal(r.signatures,0);assert.equal(r.transactionsSent,0);
});
bsc56Test('BSC56 transport, missing/pruned state and malformed batches remain UNKNOWN with no latest fallback',async()=>{
 const cases=[r=>r.splice(0,1),r=>{r[0].id=r[1].id},r=>{r[0].id=999},r=>{r[0].error={code:-32000,message:'missing trie node'}}];
 for(const change of cases){const f=bsc56IdentityFixture((r,b)=>{if(b[0].id===3)change(r)}),v=await inspectBsc56PinnedKgen(f);assert.equal(v.status,'UNKNOWN');assert.equal(f.requests.length,12);assert.equal(v.executionReady,false)}
 const f=bsc56IdentityFixture();f.transport=async()=>{throw new Error('secret/credential-bearing provider text must not be exposed')};const v=await inspectBsc56PinnedKgen(f);assert.equal(v.failureCode,'RPC_TRANSPORT_UNAVAILABLE');assert.ok(!JSON.stringify(v).includes('credential-bearing'));
});
bsc56Test('BSC56 chain, canonical code, ABI identity and source binding mismatches never pass',async()=>{
 for(const [id,value,status] of [[1,'0x61','CANON_CONFLICT'],[9,'0x61','CANON_CONFLICT'],[3,'0x','NOT_DEPLOYED'],[3,'0x6001','CANON_CONFLICT'],[10,'0x'+'00'.repeat(12)+'11'.repeat(20),'CANON_CONFLICT'],[12,'0x','UNKNOWN'],[4,bsc56Abi.encodeFunctionResult('decimals',[6]),'CANON_CONFLICT'],[5,bsc56Abi.encodeFunctionResult('symbol',['tKGEN']),'CANON_CONFLICT']]){
  const f=bsc56IdentityFixture(r=>{const q=r.find(v=>v.id===id);if(q)q.result=value});assert.equal((await inspectBsc56PinnedKgen(f)).status,status);
 }
 const f=bsc56IdentityFixture();f.expected.codeHash=null;const r=await inspectBsc56PinnedKgen(f);assert.equal(r.status,'UNKNOWN');assert.equal(r.failureCode,'REVIEWED_CANON_SOURCE_BINDING_REQUIRED');assert.equal(f.requests.length,0);
 const changed=bsc56IdentityFixture();changed.expected.sourceBinding.tokenSourceSha256='c'.repeat(64);assert.equal((await inspectBsc56PinnedKgen(changed)).failureCode,'REVIEWED_CANON_SOURCE_BINDING_REQUIRED');assert.equal(changed.requests.length,0);
});
bsc56Test('BSC56 hash/time/roundtrip block inconsistency remains UNKNOWN rather than fabricated evidence',async()=>{
 for(const change of [r=>{const x=r.find(v=>v.id===8);if(x)x.result.hash='0x'+'56'.repeat(32)},r=>{const x=r.find(v=>v.id===4);if(x)x.result='0x'},r=>{const x=r.find(v=>v.id===2);if(x)x.result.timestamp='0x1'}]){
  const f=bsc56IdentityFixture(change),r=await inspectBsc56PinnedKgen(f);assert.equal(r.status,'UNKNOWN');assert.equal(r.executionReady,false);
 }
});

if(process.env.K11520_RUN_BSC56_READONLY==='1')bsc56Test('BSC56 public pinned KGEN identity evidence (no signer or transactions)',async()=>{
 const {readFileSync,mkdirSync,writeFileSync}=await import('node:fs'),{createHash}=await import('node:crypto');
 const manifestPath=new URL('../docs/K11520_MAINNET_DEPLOYMENT_MANIFEST.json',import.meta.url),tokenSourcePath=new URL('../KGEN/contracts/KGEN_Token_V7_5_2.sol',import.meta.url);
 const bytes=readFileSync(manifestPath),manifest=JSON.parse(bytes),source=manifest.nonOraclePreparation20260930?.publicReadback;
 const sourceBinding={manifestPath:'docs/K11520_MAINNET_DEPLOYMENT_MANIFEST.json',manifestSha256:createHash('sha256').update(bytes).digest('hex'),codeHashField:'nonOraclePreparation20260930.publicReadback.tokenCodeHash',tokenSourcePath:'KGEN/contracts/KGEN_Token_V7_5_2.sol',tokenSourceSha256:createHash('sha256').update(readFileSync(tokenSourcePath)).digest('hex'),expectedTokenSourceSha256:manifest.productDecision20261007?.readOnlyIdentityGate?.tokenSourceSha256,sourceToBytecodeRecompilation:'NOT_PERFORMED_BY_THIS_IDENTITY_PROBE',sourceRef:process.env.K11520_REVIEWED_COMMIT||null,sourceRefVerification:process.env.CI==='true'?'CI_EXACT_CHECKOUT_GUARD_REQUIRED':'LOCAL_UNCOMMITTED_CANDIDATE',probeSourceSha256:createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex')};
 let httpRequests=0;
 const transport=async requests=>{
  assert.equal(process.env.K11520_BSC56_RPC_URL||bsc56Endpoint,bsc56Endpoint,'Only the public credential-free Canon endpoint is allowed');assert.ok(++httpRequests<=2,'bounded HTTP request budget');
  const response=await fetch(bsc56Endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(requests),signal:AbortSignal.timeout(15000)});assert.ok(response.ok,'RPC HTTP status unavailable');
  const reader=response.body.getReader(),chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1048576){await reader.cancel();throw new Error('RPC_RESPONSE_TOO_LARGE')}chunks.push(value)}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
 };
 const result=await inspectBsc56PinnedKgen({transport,expected:{address:manifest.KGEN_TOKEN,chainId:manifest.CHAIN_ID,decimals:source?.tokenDecimals,codeHash:source?.tokenCodeHash,sourceBinding}});
 result.httpRequests=httpRequests;result.observedAt=new Date().toISOString();mkdirSync('artifacts/bsc56-readonly',{recursive:true});writeFileSync('artifacts/bsc56-readonly/kgen-identity.json',JSON.stringify(result,null,2)+'\n');
 assert.equal(result.status,'READY',`BSC56 identity ${result.status}: ${result.failureCode||'UNAVAILABLE'}`);
});

// Pure transfer fixtures: synthetic sender/recipient metadata, never a provider.
const transferModule=await import('../K線西遊記/temples/11520/runtime/evm-wallet-runtime.mjs');
const transferSender='0x1111111111111111111111111111111111111111',transferRecipient='0x2222222222222222222222222222222222222222';
function transferFixture(){return {chainId:56,sender:transferSender,recipient:transferRecipient,amountKgen:'1.000000000000000001',nonce:'7',gasLimit:'100000',gasPriceWei:'50000000',maximumGasFeeWei:'5000000000000',readback:{chainId:56,tokenAddress:KGEN_TOKEN_ADDRESS,sender:transferSender,recipient:transferRecipient,tokenCodeHash:transferModule.KGEN_BSC56_TOKEN_CODE_HASH,sourceCommit:'a'.repeat(40),blockNumber:'123',blockHash:'0x'+'ab'.repeat(32),pendingNonce:'7',tokenBalanceWei:'2000000000000000000',nativeBalanceWei:'10000000000000000',senderTaxExempt:false,recipientTaxExempt:false,senderMarketMakerPair:false,recipientMarketMakerPair:false,recipientCodePresent:false}}}
const transferBuild=(input=transferFixture(),ethers=bsc56Codec)=>transferModule.buildBsc56KgenTransferReview(input,{ethers});

bsc56Test('KGEN transfer pure review encodes exact ERC20 recipient/amount and RPC quantities',()=>{
 const input=transferFixture(),before=structuredClone(input),r=transferBuild(input),tx=r.transaction;
 assert.deepEqual(input,before);assert.equal(tx.to,KGEN_TOKEN_ADDRESS);assert.equal(tx.from,transferSender);assert.equal(tx.value,'0x0');assert.equal(tx.chainId,'0x38');assert.equal(tx.type,'0x0');assert.equal(tx.nonce,'0x7');assert.equal(tx.gas,'0x186a0');assert.equal(tx.gasPrice,'0x2faf080');assert.equal(tx.gasLimit,undefined);
 assert.equal(tx.data.slice(0,10),'0xa9059cbb');const decoded=new bsc56Codec.Interface(transferModule.KGEN_BSC56_TRANSFER_ABI).parseTransaction(tx);assert.equal(decoded.name,'transfer');assert.equal(decoded.args[0],transferRecipient);assert.equal(decoded.args[1].toString(),'1000000000000000001');
 for(const field of ['CHAIN','WALLET','RECIPIENT','CONTRACT','FUNCTION','TOKEN','AMOUNT','EXPECTED_EFFECT','MAXIMUM_EXPOSURE'])assert.ok(Object.hasOwn(r.review,field));assert.equal(r.review.RECIPIENT,transferRecipient);assert.equal(r.review.AMOUNT.inputKgen,input.amountKgen);assert.equal(r.review.AMOUNT.canonicalKgen,input.amountKgen);assert.equal(r.review.MAXIMUM_EXPOSURE.walletTokenDebitWei,'1000000000000000001');assert.equal(r.review.MAXIMUM_EXPOSURE.nativeGasFeeWei,'5000000000000');assert.equal(r.review.MAXIMUM_EXPOSURE.allowanceChanged,false);
 assert.equal(r.executionReady,false);assert.equal(r.walletHandoffReady,false);assert.equal(r.signerRequested,false);assert.equal(r.broadcast,false);assert.equal(r.scope,'INPUT_METADATA_ONLY_NOT_CHAIN_VERIFIED');assert.match(r.transactionFormat,/EIP1474_QUANTITY/);assert.ok(Object.isFrozen(r.transaction));assert.ok(Object.isFrozen(r.readback));assert.throws(()=>r.review.RECIPIENT=transferSender,TypeError);
});

bsc56Test('KGEN transfer amount parsing preserves exact decimals and rejects exponents/floats',()=>{
 for(const [amountKgen,expected] of [['0.000000000000000001','1'],['1','1000000000000000000'],['1.000000000000000001','1000000000000000001'],['2.000000000000000000','2000000000000000000']]){const f=transferFixture();f.amountKgen=amountKgen;assert.equal(transferBuild(f).review.AMOUNT.baseUnits,expected)}
 for(const amountKgen of ['0','0.000000000000000000','-1','+1','01','1.','1e-18',' 1','1 ','1,000','1.0000000000000000001','９','9'.repeat(99),1,1.1,NaN,Infinity]){const f=transferFixture();f.amountKgen=amountKgen;assert.throws(()=>transferBuild(f),/TRANSFER_/)}
 const f=transferFixture();f.amountKgen='2.000000000000000001';assert.throws(()=>transferBuild(f),/INSUFFICIENT_KGEN/);f.amountKgen=((1n<<256n)-1n).toString();assert.throws(()=>transferBuild(f),/AMOUNT_OUT_OF_RANGE/);
});

bsc56Test('KGEN transfer observes all tax flag combinations without promising mined net credit',()=>{
 for(let bits=0;bits<16;bits++){
  const f=transferFixture();for(const [i,k] of ['senderTaxExempt','recipientTaxExempt','senderMarketMakerPair','recipientMarketMakerPair'].entries())f.readback[k]=!!(bits&(1<<i));
  const r=transferBuild(f),o=r.review.taxObservation,taxable=!(bits&1)&&!(bits&2)&&!!(bits&12),tax=1000000000000000001n*30n/10000n;
  assert.equal(o.taxableAtReadback,taxable);assert.equal(o.estimatedTaxWei,taxable?tax.toString():'0');assert.equal(o.primaryRecipientTransferAtReadbackWei,(1000000000000000001n-(taxable?tax:0n)).toString());assert.equal(o.maximumTaxIfFlagsChangeWei,tax.toString());assert.equal(o.minimumNetIfOnlyTaxFlagsChangeWei,(1000000000000000001n-tax).toString());assert.equal(o.miningTimeNetGuaranteed,false);
 }
 const f=transferFixture();f.amountKgen='0.000000000000000001';f.readback.recipientMarketMakerPair=true;assert.equal(transferBuild(f).review.taxObservation.estimatedTaxWei,'0','integer rounding follows the exact token source');f.readback.recipientCodePresent=true;assert.equal(transferBuild(f).review.recipientCodePresentAtReadback,true);
});

bsc56Test('KGEN transfer rejects wrong identity, recipient, chain, source and nonce metadata',()=>{
 for(const mutate of [f=>f.chainId=97,f=>f.chainId='56',f=>f.readback.chainId=97,f=>f.sender='0x'+'00'.repeat(20),f=>f.recipient='0x'+'00'.repeat(20),f=>f.recipient='0x123',f=>f.recipient=transferSender,f=>f.recipient=KGEN_TOKEN_ADDRESS,f=>f.readback.sender=transferRecipient,f=>f.readback.recipient=transferSender,f=>f.readback.tokenAddress=transferRecipient,f=>f.readback.tokenCodeHash='0x'+'cd'.repeat(32),f=>f.readback.sourceCommit='x',f=>f.readback.blockHash='0x'+'00'.repeat(32),f=>f.readback.blockNumber='0',f=>f.readback.pendingNonce='8',f=>f.readback.recipientTaxExempt='false',f=>f.readback.recipientCodePresent=0]){const f=transferFixture();mutate(f);assert.throws(()=>transferBuild(f),/TRANSFER_/,mutate.toString())}
 const f=transferFixture();f.recipient='0xBa3d3810e58735cb6813bC1CDc5458C0d71432Be';assert.throws(()=>transferBuild(f),/CHECKSUM_INVALID/);
});

bsc56Test('KGEN transfer enforces gas/native balance and exact uint bounds',()=>{
 for(const mutate of [f=>f.gasLimit='0',f=>f.gasLimit='1e5',f=>f.gasLimit=(1n<<64n).toString(),f=>f.gasPriceWei='0',f=>f.gasPriceWei=(1n<<256n).toString(),f=>f.maximumGasFeeWei='4999999999999',f=>f.readback.nativeBalanceWei='4999999999999',f=>f.nonce='00',f=>f.nonce=((1n<<64n)-1n).toString(),f=>f.readback.tokenBalanceWei='72000000000000000000000001',f=>f.readback.tokenBalanceWei=(1n<<256n).toString(),f=>f.gasPriceWei='9'.repeat(79)]){const f=transferFixture();mutate(f);assert.throws(()=>transferBuild(f),/TRANSFER_/,mutate.toString())}
 const f=transferFixture();f.nonce=f.readback.pendingNonce=((1n<<64n)-2n).toString();assert.equal(transferBuild(f).transaction.nonce,'0xfffffffffffffffe');
});

bsc56Test('KGEN transfer rejects accessor-bearing or oversized structured inputs without invoking them',()=>{
 for(const target of ['recipient','readback','tokenCodeHash']){const f=transferFixture();let calls=0;const obj=target==='tokenCodeHash'?f.readback:f;Object.defineProperty(obj,target,{enumerable:true,get(){calls++;return 'malicious'}});assert.throws(()=>transferBuild(f),/ACCESSOR_FORBIDDEN/);assert.equal(calls,0)}
 for(const mutate of [f=>f.toJSON=()=>({}),f=>f.readback.loop=f,f=>Object.setPrototypeOf(f,{extra:true}),f=>f.recipient='x'.repeat(1025),f=>f[Symbol('hidden')]='x',f=>delete f.readback.nativeBalanceWei,f=>f.function='approve']){const f=transferFixture();mutate(f);assert.throws(()=>transferBuild(f),/TRANSFER_/)}
 assert.throws(()=>transferBuild(null),/PLAIN_DATA_REQUIRED/);assert.throws(()=>transferBuild(transferFixture(),{}),/CODEC_INTERFACE_REQUIRED/);
});

bsc56Test('KGEN transfer codec mutation cannot swap snapshot recipient or amount',()=>{
 const f=transferFixture(),baseline=transferBuild(f);let changed=false;
 const codec={...bsc56Codec,getAddress(value){if(!changed){changed=true;f.recipient='0x3333333333333333333333333333333333333333';f.amountKgen='2';f.readback.recipient=f.recipient;f.readback.tokenCodeHash='0x'+'00'.repeat(32)}return bsc56Codec.getAddress(value)}};
 const r=transferBuild(f,codec);assert.equal(r.intentDigest,baseline.intentDigest);assert.deepEqual(r.transaction,baseline.transaction);assert.deepEqual(r.review,baseline.review);assert.equal(r.readback.recipient,transferRecipient);
});

bsc56Test('KGEN transfer metadata changes bind distinct intents and never invoke global wallet authority',()=>{
 const base=transferBuild(),ledger=createKgenLedger(100),before=structuredClone(ledger),old=globalThis.ethereum;let requests=0;globalThis.ethereum={request(){requests++;throw Error('forbidden')}};
 try{for(const mutate of [f=>f.readback.sourceCommit='b'.repeat(40),f=>f.readback.blockHash='0x'+'cd'.repeat(32),f=>f.readback.recipientTaxExempt=true,f=>f.gasPriceWei='1',f=>f.amountKgen='1',f=>f.nonce=f.readback.pendingNonce='8']){const f=transferFixture();mutate(f);assert.notEqual(transferBuild(f).intentDigest,base.intentDigest)}assert.equal(requests,0);assert.deepEqual(ledger,before)}finally{if(old===undefined)delete globalThis.ethereum;else globalThis.ethereum=old}
});


bsc56Test('KGEN transfer identity, immutable supply and tax bounds match pinned canonical source',async()=>{
 const {readFile}=await import('node:fs/promises'),{createHash}=await import('node:crypto');
 const manifest=JSON.parse(await readFile(new URL('../docs/K11520_MAINNET_DEPLOYMENT_MANIFEST.json',import.meta.url),'utf8'));
 const source=await readFile(new URL('../KGEN/contracts/KGEN_Token_V7_5_2.sol',import.meta.url),'utf8');
 assert.equal(transferModule.KGEN_BSC56_TOKEN_CODE_HASH,manifest.nonOraclePreparation20260930.publicReadback.tokenCodeHash);
 assert.equal(createHash('sha256').update(source).digest('hex'),manifest.productDecision20261007.readOnlyIdentityGate.tokenSourceSha256);
 assert.match(source,/TOTAL_SUPPLY = 72_000_000 \* 1e18/);assert.match(source,/TAX_BPS_TOTAL\s*= 30/);assert.match(source,/contract KGEN_Token_V7_5_2 is ERC20, Ownable/);
});
