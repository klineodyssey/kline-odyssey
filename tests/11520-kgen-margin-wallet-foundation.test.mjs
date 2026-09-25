import assert from 'node:assert/strict';
import {createKgenLedger,requiredMargin,reserveOrder,cancelReservedOrder,activateMargin,closeMargin,snapshot,pnlForMove,maxAdversePoints,positionRisk,MAX_C_LEVERAGE,normalizeSignedC,signedCFromLegacyMagnitude} from '../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs';
import {formatUnits,readNativeBalance,readErc20Balance,assertExecutableOrder,createWalletSession,PUBLIC_WALLET_IDENTITY_KEY} from '../K線西遊記/temples/11520/runtime/evm-wallet-runtime.mjs';
import {placeSimulationOrder,cancelSimulationOrder,observeSimulationPrice,closeSimulationPosition,simulationSnapshot,touchedOrCrossed} from '../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs';
import {C_DETENTS} from '../K線西遊記/temples/11520/controls/nonlinear-controls.mjs';

assert.equal(MAX_C_LEVERAGE,100);
assert.equal(requiredMargin({lots:8}),8);
assert.equal(requiredMargin({lots:100}),100);
assert.equal(pnlForMove({entry:100,mark:101,side:'多',lots:100,c:100}),100);
assert.equal(pnlForMove({entry:100,mark:99,side:'多',lots:100,c:100}),-100);
assert.equal(pnlForMove({entry:100,mark:101,side:'空',lots:100,c:-100}),-100);
assert.equal(signedCFromLegacyMagnitude(100,'空'),-100);
assert.equal(normalizeSignedC(-0,{allowNeutral:true}),0);
for(const c of C_DETENTS){
  assert.equal(normalizeSignedC(c,{allowNeutral:true}),c);
  if(c!==0)assert.ok(Math.abs(pnlForMove({entry:100,mark:101,lots:1,c})-.01*c)<1e-12);
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
  assert.ok(Math.abs(r.rawPnl-change*c*lots)<1e-8);
  assert.equal(r.remaining,Math.max(0,lots+r.pnl));
  assert.ok(r.pnl>=-lots,'isolated loss cannot consume other principal');
}
assert.equal(maxAdversePoints(100,100),1);
assert.equal(maxAdversePoints(50,100),2);
assert.throws(()=>pnlForMove({entry:100,mark:101,side:'多',lots:1,c:1000}),/C_LEVERAGE_OUT_OF_RANGE/);
assert.throws(()=>pnlForMove({entry:100,mark:101,side:'多',lots:1,c:'not-a-number'}),/C_LEVERAGE_OUT_OF_RANGE/);
assert.throws(()=>pnlForMove({entry:100,mark:Infinity,side:'多',lots:1,c:1}),/MARK_PRICE_MUST_BE_POSITIVE/);
assert.throws(()=>pnlForMove({entry:100,mark:101,side:'多',lots:Infinity,c:1}),/LOTS_OUT_OF_RANGE/);
assert.throws(()=>positionRisk({entry:100,mark:NaN,side:'多',lots:1,c:1}),/MARK_PRICE_MUST_BE_POSITIVE/);
const blown=positionRisk({entry:100,mark:99,side:'多',lots:100,c:100});
assert.equal(blown.principal,100);assert.equal(blown.pnl,-100);assert.equal(blown.remaining,0);assert.equal(blown.liquidated,true);assert.equal(blown.liquidationMark,99);
const safe=positionRisk({entry:100,mark:99,side:'多',lots:100,c:50});
assert.equal(safe.pnl,-50);assert.equal(safe.remaining,50);assert.equal(safe.liquidated,false);assert.equal(safe.liquidationMark,98);

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
  tick(l,100.01,1003);
  assert.ok(Math.abs(l.unrealizedPnl-.0001*c)<1e-10);
  assert.equal(closeSimulationPosition(l,filled.positions[0].positionId,{now:1004}).ok,true);
  const closed=simulationSnapshot(l);
  assert.equal(closed.receipts[1].c,c);assert.equal(closed.receipts[1].status,'CLOSED');
  assert.equal(l.lockedMargin,0);assert.ok(Math.abs(l.free-(1000+.0001*c))<1e-10);
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
  assert.equal(receipt.marginBefore,lots);assert.equal(receipt.marginAfter,0);assert.ok(Math.abs(receipt.badDebt-lots)<1e-9);
  assert.equal(receipt.liquidationTrigger,c>0?99:101,'receipt boundary remains based on entry and C after margin is zeroed');
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
  const l=createKgenLedger(1000);tick(l,100,1000);order(l,{stopPrice:99.5,takeProfitPrice:101});tick(l,100,1002);tick(l,99.5,1003);
  assert.equal(simulationSnapshot(l).positions[0].status,'STOPPED');assert.equal(l.free,950);
}
{
  const l=createKgenLedger(1000);tick(l,100,1000);order(l,{c:-100,takeProfitPrice:99.5});tick(l,100,1002);tick(l,99.5,1003);
  assert.equal(simulationSnapshot(l).positions[0].status,'TAKE_PROFIT');assert.equal(l.free,1050);
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
