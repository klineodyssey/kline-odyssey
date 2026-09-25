import assert from 'node:assert/strict';
import {createKgenLedger,requiredMargin,reserveOrder,cancelReservedOrder,activateMargin,closeMargin,snapshot,pnlForMove,maxAdversePoints,positionRisk,MAX_C_LEVERAGE,normalizeSignedC,signedCFromLegacyMagnitude} from '../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs';
import {formatUnits,readErc20Balance,assertExecutableOrder} from '../K線西遊記/temples/11520/runtime/evm-wallet-runtime.mjs';
import {placeSimulationOrder,cancelSimulationOrder,observeSimulationPrice,closeSimulationPosition,simulationSnapshot,touchedOrCrossed} from '../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs';

assert.equal(MAX_C_LEVERAGE,100);
assert.equal(requiredMargin({lots:8}),8);
assert.equal(requiredMargin({lots:100}),100);
assert.equal(pnlForMove({entry:100,mark:101,side:'多',lots:100,c:100}),100);
assert.equal(pnlForMove({entry:100,mark:99,side:'多',lots:100,c:100}),-100);
assert.equal(pnlForMove({entry:100,mark:101,side:'空',lots:100,c:-100}),-100);
assert.equal(signedCFromLegacyMagnitude(100,'空'),-100);
assert.equal(normalizeSignedC(-0,{allowNeutral:true}),0);
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
const mock={request:async ({method})=>method==='eth_call'?'0x0de0b6b3a7640000':null};
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
