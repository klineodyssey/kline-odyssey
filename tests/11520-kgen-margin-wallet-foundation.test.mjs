import assert from 'node:assert/strict';
import test from 'node:test';
import {createKgenLedger,requiredMargin,reserveOrder,cancelReservedOrder,activateMargin,closeMargin,snapshot,pnlForMove,maxAdversePoints,positionRisk,MAX_C_LEVERAGE,normalizeSignedC,signedCFromLegacyMagnitude} from '../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs';
import {formatUnits,readNativeBalance,readErc20Balance,assertExecutableOrder,createWalletSession,PUBLIC_WALLET_IDENTITY_KEY,bindTempleReturnWalletContinuity} from '../K線西遊記/temples/11520/runtime/evm-wallet-runtime.mjs';
import {placeSimulationOrder,cancelSimulationOrder,observeSimulationPrice,closeSimulationPosition,simulationSnapshot,touchedOrCrossed} from '../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs';
import {C_DETENTS} from '../K線西遊記/temples/11520/controls/nonlinear-controls.mjs';
import {createDigitalAnt,createDeliveryMission,assignDelivery,loadCargo,planCargoHedge,createDigitalAntPersistenceEnvelope,restoreDigitalAntPersistenceEnvelope,tickDigitalAntDelivery,acceptSimulatedAtmDeliveryReceipt} from '../K線西遊記/temples/11520/runtime/digital-ant-logistics-runtime.mjs';

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

// K11520-BNB-LIQUIDATION-STATUS-20261007: the risk flag follows the same
// exact price boundary as the existing lifecycle, without rounding PnL.
const marketRiskFixtures=[['KX','BTCUSDT',60000.0004],['KY','ETHUSDT',3000.0004],['KZ','BNBUSDT',600.0004]];
function adjacentPositivePrice(value,up){
  const bytes=new ArrayBuffer(8),price=new Float64Array(bytes),bits=new BigUint64Array(bytes);
  price[0]=value;bits[0]+=up?1n:-1n;return price[0];
}
for(const [axis,market,entry] of marketRiskFixtures)for(const c of C_DETENTS.filter(c=>c!==0))for(const lots of [1,100]){
  const boundary=positionRisk({entry,mark:entry,c,lots}).liquidationMark;
  if(boundary<=0){
    assert.equal(positionRisk({entry,mark:Number.MIN_VALUE,c,lots}).liquidated,false,'positive prices cannot reach a nonpositive LONG boundary');
    continue;
  }
  for(const mark of [adjacentPositivePrice(boundary,false),boundary,adjacentPositivePrice(boundary,true)]){
    const risk=positionRisk({entry,mark,c,lots}),liquidated=c>0?mark<=boundary:mark>=boundary;
    assert.equal(risk.liquidated,liquidated,`${market} ${c}C ${lots} lots at ${mark}`);
    assert.equal(risk.liquidationMark,boundary);
    assert.equal(risk.rawPnl,pnlForMove({entry,mark,c,lots}),'risk status must not round raw PnL');
    assert.equal(risk.pnl,Math.max(-lots,risk.rawPnl));
    assert.equal(risk.remaining,Math.max(0,lots+risk.pnl));
    if(lots!==1||Math.abs(c)>1)continue;
    const l=createKgenLedger(10),observe=(price,at)=>observeSimulationPrice(l,{market,price,observedAt:at,now:at,productV1:true});
    assert.equal(observe(entry-1,1000).ok,true);
    assert.equal(placeSimulationOrder(l,{axis,market,c,lots,triggerPrice:entry,now:1001}).ok,true);
    assert.equal(observe(entry,1002).events[0].status,'FILLED');
    const outcome=observe(mark,1003),state=simulationSnapshot(l);
    assert.equal(state.positions[0].status,liquidated?'LIQUIDATED':'OPEN');
    assert.equal(state.receipts.length,liquidated?2:1);
    if(liquidated){
      assert.equal(outcome.events[0].status,'LIQUIDATED');assert.equal(outcome.events[0].realizedPnl,-1);
      assert.equal(l.free,9);assert.equal(l.lockedMargin,0);
    }else{assert.equal(outcome.events.length,0);assert.equal(l.free,9);assert.equal(l.lockedMargin,1);}
  }
}
{
  const l=createKgenLedger(100),positions=new Map();
  const observe=(market,price,at)=>observeSimulationPrice(l,{market,price,observedAt:at,now:at,sequence:at,productV1:true});
  for(const [i,[axis,market,entry]] of marketRiskFixtures.entries()){
    const c=i===2?-.001:i===1?-1:1,lots=i+1;
    observe(market,entry-1,1000);assert.equal(placeSimulationOrder(l,{axis,market,c,lots,triggerPrice:entry,now:1001}).ok,true);observe(market,entry,1002);
    positions.set(market,simulationSnapshot(l).positions.find(p=>p.market===market));
  }
  const bnb=positions.get('BNBUSDT'),boundary=positionRisk(bnb).liquidationMark;
  assert.equal(positionRisk({...bnb,mark:boundary}).liquidated,true,'BNB -0.001C exact-boundary regression');
  const others=simulationSnapshot(l).positions.filter(p=>p.market!=='BNBUSDT');
  const receipt=observe('BNBUSDT',boundary,1003).events[0];
  assert.equal(receipt.status,'LIQUIDATED');assert.equal(receipt.market,'BNBUSDT');assert.equal(receipt.axis,'KZ');assert.equal(receipt.realizedPnl,-3);
  assert.deepEqual(simulationSnapshot(l).positions.filter(p=>p.market!=='BNBUSDT'),others,'one market liquidation cannot change other positions');
  assert.equal(l.free,94);assert.equal(l.lockedMargin,3);
  for(const market of ['BTCUSDT','ETHUSDT'])assert.equal(closeSimulationPosition(l,positions.get(market).positionId,{now:1004}).receipt.status,'CLOSED');
  assert.equal(l.free,97);assert.equal(l.lockedMargin,0);assert.equal(l.realizedPnl,-3);
  const state=simulationSnapshot(l),before=structuredClone(l);
  assert.equal(state.receipts.length,6);assert.equal(new Set(state.receipts.map(r=>r.receiptId)).size,6);
  assert.equal(closeSimulationPosition(l,bnb.positionId,{now:1005}).reason,'POSITION_NOT_OPEN');assert.deepEqual(l,before);
}
console.log('11520 exact liquidation risk flag + three-market receipt isolation PASS');

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

// K11520-CT-XYZ-AUTO-CARGO-COMBAT-20261009-001 / bounded M0 acceptance.
// Exposure notional, trading lots and cargo principal retain separate units.
// These explicit fixture orders do not infer a notional-to-lots or FX conversion.
const cargoMarkets=[['KX','BTCUSDT','BTC'],['KY','ETHUSDT','ETH'],['KZ','BNBUSDT','BNB']];
for(let directions=0;directions<8;directions++){
  test(`cargo custody survives three-market LONG/SHORT losses and JSON restart (matrix ${directions})`,t=>{
    t.mock.method(Date,'now',()=>1000);
    const ant=createDigitalAnt({lifeId:'SIM-CARGO-QA',capital:100,cargoCapacity:2000});
    const atm={atmId:'SIM-DESTINATION',x:1,y:1,z:1,online:true};
    const mission=createDeliveryMission({missionId:'SIM-CARGO-001',amount:1000,unit:'KAIOS',destinationAtmId:atm.atmId,freightOffer:10,demand:1});
    assert.equal(assignDelivery(ant,mission,[atm]).ok,true);
    assert.equal(loadCargo(ant).ok,true);
    const custody=structuredClone(ant);
    let book=createKgenLedger(6);
    const signs=cargoMarkets.map((_,i)=>directions&(1<<i)?-1:1);
    for(const [i,[axis,market,asset]] of cargoMarkets.entries()){
      const c=signs[i],exposure={asset,notional:10,market,type:c>0?'PAYABLE':'RECEIVABLE'};
      const originalExposure=structuredClone(exposure);
      const plan=planCargoHedge({cargoAsset:'KAIOS',cargoAmount:1000,deliveryLiabilityAsset:'KAIOS',variableCostExposure:exposure,marketAvailable:true,authorized:true,operatingRiskReserve:2,maxHedgeRatio:.5,maxOrderLeverage:1});
      assert.equal(plan.action,'HEDGE_CANDIDATE');
      assert.equal(plan.hedge.side,c>0?'LONG':'SHORT');
      assert.equal(plan.hedgeNotional,2);
      assert.equal(plan.cargoPrincipalAsMargin,false);
      assert.equal(plan.realOrderCreated,false);
      assert.deepEqual(exposure,originalExposure,'planning cannot consume the cost exposure');
      assert.equal(observeSimulationPrice(book,{market,price:99,observedAt:1000,now:1000,productV1:true}).ok,true);
      const order=placeSimulationOrder(book,{axis,market,c,side:plan.hedge.side,lots:2,triggerPrice:100,now:1001});
      assert.equal(order.ok,true);
      assert.equal(observeSimulationPrice(book,{market,price:100,observedAt:1002,now:1002,productV1:true}).events[0].status,'FILLED');
    }
    assert.equal(book.free,0);
    assert.equal(book.lockedMargin,6);
    assert.deepEqual(ant,custody,'orders cannot move, deliver or debit cargo');
    book=JSON.parse(JSON.stringify(book));
    const recovered=restoreDigitalAntPersistenceEnvelope(JSON.parse(JSON.stringify(createDigitalAntPersistenceEnvelope(ant,{revision:1,savedAt:1002}))),{expectedLifeId:ant.lifeId});
    assert.deepEqual(recovered,custody);
    for(const [i,[axis,market]] of cargoMarkets.entries()){
      const before=structuredClone(book);
      assert.equal(observeSimulationPrice(book,{market,price:100,observedAt:1002,now:1002,productV1:true}).reason,'OUT_OF_ORDER_PRICE');
      assert.deepEqual(book,before,'restart must not replay a fill');
      const peers=simulationSnapshot(book).positions.filter(p=>p.market!==market);
      const outcome=observeSimulationPrice(book,{market,price:signs[i]>0?98:102,observedAt:1003,now:1003,productV1:true});
      assert.equal(outcome.ok,true);
      assert.equal(outcome.events.length,1);
      assert.equal(outcome.events[0].status,'LIQUIDATED');
      assert.equal(outcome.events[0].axis,axis);
      assert.equal(outcome.events[0].realizedPnl,-2);
      assert.deepEqual(simulationSnapshot(book).positions.filter(p=>p.market!==market),peers,'one market cannot settle another');
      assert.deepEqual(recovered,custody,'market losses cannot change cargo, freight, salary or position');
    }
    assert.equal(book.free,0);assert.equal(book.lockedMargin,0);assert.equal(book.realizedPnl,-6);
    const receipts=simulationSnapshot(book).receipts;
    assert.equal(receipts.length,6);
    assert.equal(new Set(receipts.map(r=>r.receiptId)).size,6);
    assert.ok(receipts.every(r=>r.simulationOnly===true));
    assert.equal(recovered.cargo.amount,1000);
    assert.equal(recovered.finance.freight,0);assert.equal(recovered.payroll.paid,0);
    // Insolvent trading funds do not halt an independently funded cargo mission.
    let arrived=false;
    for(let i=0;i<80;i++){
      arrived=tickDigitalAntDelivery(recovered,{deltaMs:100,speed:.02}).arrived===true;
      if(arrived)break;
    }
    assert.equal(arrived,true);
    assert.equal(recovered.cargo.amount,1000,'arrival alone does not transfer custody');
    const beforeAcceptance=structuredClone(recovered);
    assert.equal(acceptSimulatedAtmDeliveryReceipt(recovered,{destinationAtmId:atm.atmId,now:1004}).reason,'SIMULATION_DESTINATION_ACCEPTANCE_REQUIRED');
    assert.deepEqual(recovered,beforeAcceptance);
    const acceptance=acceptSimulatedAtmDeliveryReceipt(recovered,{destinationAtmId:atm.atmId,accepted:true,now:1004});
    assert.equal(acceptance.ok,true);
    assert.equal(recovered.cargo.amount,0);
    assert.equal(recovered.mission.status,'DELIVERED');
    assert.equal(recovered.finance.freight,10);
    assert.equal(recovered.payroll.paid,0,'delivery creates no real salary payment');
    const delivered=structuredClone(recovered);
    assert.equal(acceptSimulatedAtmDeliveryReceipt(recovered,{destinationAtmId:atm.atmId,accepted:true,now:1005}).replayed,true);
    assert.deepEqual(recovered,delivered,'duplicate receipt cannot duplicate freight');
  });
}
test('three-market cargo hedge rejects missing market, reserve and stale order data without debiting principal',()=>{
  for(const [axis,market,asset] of cargoMarkets){
    const parameters={cargoAsset:'KAIOS',cargoAmount:1000,deliveryLiabilityAsset:'KAIOS',variableCostExposure:{asset,notional:10,market,type:'PAYABLE'},marketAvailable:true,authorized:true,operatingRiskReserve:2};
    assert.equal(planCargoHedge({...parameters,marketAvailable:false}).reason,'HEDGE_MARKET_UNAVAILABLE');
    assert.equal(planCargoHedge({...parameters,operatingRiskReserve:0}).reason,'OPERATING_RISK_RESERVE_REQUIRED');
    const book=createKgenLedger(2);
    assert.equal(observeSimulationPrice(book,{market,price:99,observedAt:1000,now:1000,productV1:true}).ok,true);
    const before=structuredClone(book);
    assert.equal(placeSimulationOrder(book,{axis,market,c:1,lots:2,triggerPrice:100,now:16001}).reason,'STALE_PRICE');
    assert.deepEqual(book,before);
    assert.equal(placeSimulationOrder(book,{axis,market,c:1,lots:3,triggerPrice:100,now:1001}).reason,'INSUFFICIENT_FREE_KGEN');
    assert.deepEqual(book,before);
  }
});
