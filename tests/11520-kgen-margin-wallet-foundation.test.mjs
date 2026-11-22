import assert from 'node:assert/strict';
import test from 'node:test';
import {createKgenLedger,requiredMargin,reserveOrder,cancelReservedOrder,activateMargin,closeMargin,snapshot,pnlForMove,maxAdversePoints,positionRisk,MAX_C_LEVERAGE,normalizeSignedC,signedCFromLegacyMagnitude,C_PNL_MODEL,LEGACY_SIMULATION_PNL_MODEL} from '../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs';
import {formatUnits,readNativeBalance,readErc20Balance,assertExecutableOrder,createWalletSession,PUBLIC_WALLET_IDENTITY_KEY,bindTempleReturnWalletContinuity} from '../K線西遊記/temples/11520/runtime/evm-wallet-runtime.mjs';
import {placeSimulationOrder,cancelSimulationOrder,observeSimulationPrice,closeSimulationPosition,simulationSnapshot,touchedOrCrossed} from '../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs';
import {C_DETENTS} from '../K線西遊記/temples/11520/controls/nonlinear-controls.mjs';
import {createDigitalAnt,createDeliveryMission,assignDelivery,loadCargo,planCargoHedge,createDigitalAntPersistenceEnvelope,restoreDigitalAntPersistenceEnvelope,tickDigitalAntDelivery,acceptSimulatedAtmDeliveryReceipt} from '../K線西遊記/temples/11520/runtime/digital-ant-logistics-runtime.mjs';

assert.equal(MAX_C_LEVERAGE,100);
assert.equal(requiredMargin({lots:8}),8);
assert.equal(requiredMargin({lots:100}),100);
assert.equal(C_PNL_MODEL,'UNIVERSE_ENTRY_FLOOR_DELTA_C_LOTS_V1');
assert.equal(LEGACY_SIMULATION_PNL_MODEL,'INDEX_DELTA_C_LOTS_V1');
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
  assert.ok(Math.abs(r.rawPnl-change*c*lots)<1e-9);
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
assert.ok(Math.abs(safe.pnl+50)<1e-8);assert.ok(Math.abs(safe.remaining-50)<1e-8);assert.equal(safe.liquidated,false);assert.equal(safe.liquidationMark,98);

// K11520-BNB-LIQUIDATION-STATUS-20261007: the risk flag follows the same
// exact price boundary as the existing lifecycle, without rounding PnL.
const marketRiskFixtures=[['KX','BTCUSDT',60000.0004,10000],['KY','ETHUSDT',3000.0004,1000],['KZ','BNBUSDT',600.0004,100]];
function adjacentPositivePrice(value,up){
  const bytes=new ArrayBuffer(8),price=new Float64Array(bytes),bits=new BigUint64Array(bytes);
  price[0]=value;bits[0]+=up?1n:-1n;return price[0];
}
for(const [axis,market,entry,unit] of marketRiskFixtures)for(const c of C_DETENTS.filter(c=>c!==0))for(const lots of [1,100]){
  const boundary=entry-unit/c;
  assert.equal(positionRisk({entry,mark:entry,c,lots}).liquidationMark,boundary);
  if(boundary<=0){
    assert.equal(positionRisk({entry,mark:Number.MIN_VALUE,c,lots}).liquidated,false,'positive prices cannot reach a nonpositive LONG boundary');
    continue;
  }
  for(const mark of [adjacentPositivePrice(boundary,false),boundary,adjacentPositivePrice(boundary,true)]){
    const risk=positionRisk({entry,mark,c,lots}),liquidated=c>0?mark<=boundary:mark>=boundary;
    assert.equal(risk.entryFloorUnit,unit);assert.equal(risk.pnlModel,C_PNL_MODEL);
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
  assert.ok(Math.abs(l.unrealizedPnl-.00001*c)<1e-10);
  assert.equal(closeSimulationPosition(l,filled.positions[0].positionId,{now:1004}).ok,true);
  const closed=simulationSnapshot(l);
  assert.equal(closed.receipts[1].c,c);assert.equal(closed.receipts[1].status,'CLOSED');
  assert.equal(l.lockedMargin,0);assert.ok(Math.abs(l.free-(1000+.00001*c))<1e-10);
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
  assert.equal(receipt.marginBefore,lots);assert.equal(receipt.marginAfter,0);assert.equal(receipt.badDebt,lots);
  assert.equal(receipt.liquidationTrigger,c>0?99:101,'receipt boundary remains based on the fixed entry floor and C after margin is zeroed');
  assert.equal(receipt.pnlModel,C_PNL_MODEL);assert.equal(receipt.entryFloorUnit,100);
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
  assert.equal(simulationSnapshot(l).positions[0].status,'STOPPED');assert.ok(Math.abs(l.free-950)<1e-8);
}
{
  const l=createKgenLedger(1000);tick(l,100,1000);order(l,{c:-100,takeProfitPrice:99.5});tick(l,100,1002);tick(l,99.5,1003);
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

test('gap fills retain the actual-fill floor through a mark in the previous decade and JSON restart',()=>{
  for(const [axis,market,whole,unit] of [['KX','BTCUSDT',10000,10000],['KY','ETHUSDT',1000,1000],['KZ','BNBUSDT',100,100]])for(const c of [-1,1]){
    let book=createKgenLedger(10);
    const observe=(price,at)=>observeSimulationPrice(book,{market,price,observedAt:at,now:at,productV1:true});
    assert.equal(observe(whole-1,1000).ok,true);
    assert.equal(placeSimulationOrder(book,{axis,market,c,lots:2,triggerPrice:whole-.5,now:1001}).ok,true);
    const fill=observe(whole+.25,1002).events[0];
    assert.equal(fill.status,'FILLED');assert.equal(fill.fillPrice,whole+.25);
    assert.equal(fill.pnlModel,C_PNL_MODEL);assert.equal(fill.entryFloorUnit,unit,'trigger is in the lower decade, but actual fill owns the floor');
    assert.equal(book.free,8);assert.equal(book.lockedMargin,2);
    book=JSON.parse(JSON.stringify(book));
    const fillReceipt=structuredClone(simulationSnapshot(book).receipts[0]);
    assert.equal(observe(whole-.25,1003).events.length,0);
    const position=simulationSnapshot(book).positions[0],risk=positionRisk(position);
    assert.equal(position.pnlModel,C_PNL_MODEL);assert.equal(risk.entryFloorUnit,unit);
    assert.equal(risk.rawPnl,-c/unit,'mark crossing a decade cannot change the fixed financial distance');
    assert.equal(book.unrealizedPnl,-c/unit);
    const closed=closeSimulationPosition(book,position.positionId,{now:1004});
    assert.equal(closed.ok,true);assert.equal(closed.receipt.status,'CLOSED');
    assert.equal(closed.receipt.pnlModel,C_PNL_MODEL);assert.equal(closed.receipt.entryFloorUnit,unit);
    assert.equal(closed.receipt.rawPnl,-c/unit);assert.equal(closed.receipt.realizedPnl,-c/unit);
    assert.equal(book.free,10-c/unit);assert.equal(book.lockedMargin,0);assert.equal(book.unrealizedPnl,0);
    assert.deepEqual(simulationSnapshot(book).receipts[0],fillReceipt,'closing cannot rewrite the original fill receipt');
  }
});

test('untagged legacy OPEN positions keep raw-index settlement after restart without retagging saved state',()=>{
  for(const c of [-1,1])for(const liquidate of [false,true]){
    let book=createKgenLedger(10);
    const observe=(price,at)=>observeSimulationPrice(book,{market:'BTCUSDT',price,observedAt:at,now:at,productV1:true});
    observe(149,1000);
    assert.equal(placeSimulationOrder(book,{axis:'KX',market:'BTCUSDT',c,lots:2,triggerPrice:150,now:1001}).ok,true);
    assert.equal(observe(150,1002).events[0].status,'FILLED');
    // Restore the pre-model saved shape, not a new fill incorrectly labeled legacy.
    book=JSON.parse(JSON.stringify(book));
    delete book.simulation.positions[0].pnlModel;
    delete book.simulation.receipts[0].pnlModel;delete book.simulation.receipts[0].entryFloorUnit;
    const beforeSnapshot=structuredClone(book),legacyView=simulationSnapshot(book);
    assert.equal(legacyView.positions[0].pnlModel,LEGACY_SIMULATION_PNL_MODEL);
    assert.deepEqual(book,beforeSnapshot,'read-only compatibility labels cannot mutate saved history');
    const fillReceipt=structuredClone(legacyView.receipts[0]);
    const outcome=observe(150-c*(liquidate?2:.25),1003);
    assert.equal(outcome.ok,true);
    const position=simulationSnapshot(book).positions[0];
    const closed=liquidate?outcome.events[0]:closeSimulationPosition(book,position.positionId,{now:1004}).receipt;
    assert.equal(closed.status,liquidate?'LIQUIDATED':'CLOSED');
    assert.equal(closed.pnlModel,LEGACY_SIMULATION_PNL_MODEL);assert.equal(closed.entryFloorUnit,1);
    assert.equal(closed.liquidationTrigger,150-c);
    assert.equal(closed.rawPnl,liquidate?-4:-.5);assert.equal(closed.realizedPnl,liquidate?-2:-.5);
    assert.equal(closed.badDebt,liquidate?2:0);
    assert.equal(book.free,liquidate?8:9.5);assert.equal(book.lockedMargin,0);assert.equal(book.unrealizedPnl,0);
    assert.equal(Object.hasOwn(book.simulation.positions[0],'pnlModel'),false,'settlement preserves the historical position shape');
    assert.deepEqual(simulationSnapshot(book).receipts[0],fillReceipt);
    const settled=structuredClone(book);
    assert.equal(closeSimulationPosition(book,position.positionId,{now:1005}).reason,'POSITION_NOT_OPEN');assert.deepEqual(book,settled);
  }
});

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
      assert.equal(observeSimulationPrice(book,{market,price:149,observedAt:1000,now:1000,productV1:true}).ok,true);
      const order=placeSimulationOrder(book,{axis,market,c,side:plan.hedge.side,lots:2,triggerPrice:150,now:1001});
      assert.equal(order.ok,true);
      const fill=observeSimulationPrice(book,{market,price:150,observedAt:1002,now:1002,productV1:true}).events[0];
      assert.equal(fill.status,'FILLED');assert.equal(fill.pnlModel,C_PNL_MODEL);assert.equal(fill.entryFloorUnit,100);
    }
    assert.equal(book.free,0);
    assert.equal(book.lockedMargin,6);
    assert.deepEqual(ant,custody,'orders cannot move, deliver or debit cargo');
    book=JSON.parse(JSON.stringify(book));
    const recovered=restoreDigitalAntPersistenceEnvelope(JSON.parse(JSON.stringify(createDigitalAntPersistenceEnvelope(ant,{revision:1,savedAt:1002}))),{expectedLifeId:ant.lifeId});
    assert.deepEqual(recovered,custody);
    for(const [i,[axis,market]] of cargoMarkets.entries()){
      const before=structuredClone(book);
      assert.equal(observeSimulationPrice(book,{market,price:150,observedAt:1002,now:1002,productV1:true}).reason,'OUT_OF_ORDER_PRICE');
      assert.deepEqual(book,before,'restart must not replay a fill');
      const peers=simulationSnapshot(book).positions.filter(p=>p.market!==market);
      // Positive raw USDT gaps beyond the fixed floor's 50/250 liquidation marks.
      const outcome=observeSimulationPrice(book,{market,price:signs[i]>0?40:260,observedAt:1003,now:1003,productV1:true});
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

const K11520_TEST_EPOCH = 1790000000000;
const K11520_TEST_MARKETS = Object.freeze({
  BTCUSDT: {axis:'KX', price:65000},
  ETHUSDT: {axis:'KY', price:3400},
  BNBUSDT: {axis:'KZ', price:620},
});

async function makeK11520BackendFixture(t, {legacy, pollIntervalMs = 0, lanPreview} = {}) {
  const {mkdtemp, readFile, writeFile, unlink, rmdir} = await import('node:fs/promises');
  const {join} = await import('node:path');
  const {tmpdir} = await import('node:os');
  const {createK11520Server, BINANCE_AGGREGATE_SOURCE, BYBIT_TRADES_SOURCE} =
    await import('../K線西遊記/temples/11520/backend/server.mjs');
  const directory = await mkdtemp(join(tmpdir(), 'k11520-offline-api-test-'));
  const dataFile = join(directory, 'players.json');
  const nextBatches = new Map();
  const unavailable = new Set();
  const independent = new Map();
  let currentTime = K11520_TEST_EPOCH;
  let service = null;
  let origin;

  async function stop() {
    if (!service) return;
    const previous = service;
    service = null;
    origin = null;
    await previous.close();
  }
  t.after(async () => {
    await stop();
    try {
      await unlink(dataFile);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await rmdir(directory);
  });

  async function start() {
    assert.equal(service, null);
    service = await createK11520Server({
      dataFile,
      now: () => currentTime,
      readMarket: async ({market}) => {
        if (unavailable.has(market)) throw new Error('FIXTURE_SOURCE_UNAVAILABLE');
        const observations = nextBatches.get(market) ?? [];
        nextBatches.delete(market);
        return observations;
      },
      readIndependent: async ({market}) => independent.get(market) ?? null,
      pollIntervalMs,
      lanPreview,
    });
    const {port} = await service.listen({port: 0});
    origin = 'http://127.0.0.1:' + port;
  }

  async function request(path, {method = 'GET', token, body} = {}) {
    assert.ok(origin);
    const response = await fetch(origin + path, {
      method,
      headers: {
        ...(token ? {authorization: 'Bearer ' + token} : {}),
        ...(body !== undefined ? {'content-type': 'application/json'} : {}),
      },
      ...(body !== undefined ? {body: JSON.stringify(body)} : {}),
      signal: AbortSignal.timeout(5000),
    });
    return {status: response.status, body: await response.json()};
  }

  function quote(market, price, sequence, {age = 0, corroborates = null, quoteSource} = {}) {
    const updatedAt = currentTime - age;
    nextBatches.set(market, [{market, price, updatedAt, sequence, source: quoteSource ?? BINANCE_AGGREGATE_SOURCE}]);
    if (corroborates === null) independent.delete(market);
    else independent.set(market, {market, price: corroborates, updatedAt, sequence, source: BYBIT_TRADES_SOURCE});
  }
  function prime() {
    for (const [market, {price}] of Object.entries(K11520_TEST_MARKETS)) quote(market, price, 1);
  }
  async function login(body = {}) {
    const response = await request('/api/v1/login', {method: 'POST', body});
    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.equal(response.body.ok, true);
    assert.equal(typeof response.body.token, 'string');
    assert.ok(response.body.player?.id);
    return response.body;
  }
  async function book(token) {
    const response = await request('/api/v1/orders', {token});
    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.equal(response.body.ok, true);
    return response.body;
  }

  if (legacy) await writeFile(dataFile, JSON.stringify(legacy), 'utf8');
  await start();
  return {
    request, login, book, prime, quote, unavailable,
    get origin() { return origin; },
    poll: () => service.poll(),
    advance: (ms = 1000) => currentTime += ms,
    restart: async () => { await stop(); await start(); },
    readDatabase: () => readFile(dataFile, 'utf8').then(JSON.parse),
  };
}

function k11520OrderRequest(market, requestId, extra = {}) {
  return {
    requestId,
    market,
    axis: K11520_TEST_MARKETS[market].axis,
    c: 1,
    side: 'LONG',
    lots: 2,
    ...extra,
  };
}

test('K11520 server admits only fresh verified quotes for the selected market', async t => {
  const f = await makeK11520BackendFixture(t);
  const {token} = await f.login({name: '報價驗收'});
  const post = body => f.request('/api/v1/order', {method: 'POST', token, body});
  const draft = k11520OrderRequest('BTCUSDT', 'quote-test-cold-btc-001', {triggerPrice: 65000});
  const cold = await post({...draft, price: 100000});
  assert.ok(cold.status >= 400, 'caller price cannot bypass missing server quote');
  assert.equal((await f.book(token)).orders.length, 0);

  f.prime();
  await f.poll();
  const ready = (await f.request('/api/v1/markets')).body;
  for (const [market, {price}] of Object.entries(K11520_TEST_MARKETS)) {
    assert.equal(ready.statuses[market].status, 'READY');
    assert.equal(ready.observations[market].price, price);
  }
  f.unavailable.add('BTCUSDT');
  f.advance();
  f.quote('ETHUSDT', 3401, 2);
  f.quote('BNBUSDT', 621, 2, {quoteSource: 'UNRECOGNIZED_FIXTURE_SOURCE'});
  await f.poll();
  const split = (await f.request('/api/v1/markets')).body;
  assert.notEqual(split.statuses.BTCUSDT.status, 'READY');
  assert.equal(split.statuses.ETHUSDT.status, 'READY');
  assert.equal(split.observations.ETHUSDT.price, 3401);
  assert.equal(split.statuses.BNBUSDT.reason, 'INVALID_OBSERVATION');
  assert.ok((await post(k11520OrderRequest('BNBUSDT', 'quote-test-invalid-bnb-001', {triggerPrice: 625}))).status >= 400);
  assert.ok((await post(draft)).status >= 400, 'fresh-looking prior quote cannot bypass known disconnection');
  const selected = await post(k11520OrderRequest('ETHUSDT', 'quote-test-healthy-eth-001'));
  assert.equal(selected.body.ok, true, JSON.stringify(selected.body));
  assert.equal(selected.body.order.triggerPrice, 3401, 'default comes from the selected ready market');
  assert.equal((await f.book(token)).orders.length, 1);

  f.advance(61000);
  f.quote('BNBUSDT', 621, 2, {age: 61000});
  await f.poll();
  const aged = (await f.request('/api/v1/markets')).body;
  assert.notEqual(aged.statuses.ETHUSDT.status, 'READY', 'empty feed expires the accepted observation');
  assert.equal(aged.statuses.BNBUSDT.reason, 'STALE_PRICE', 'receiving an old response does not refresh the price');
  assert.ok((await post(k11520OrderRequest('BNBUSDT', 'quote-test-stale-bnb-001', {triggerPrice: 625}))).status >= 400);
  const book = await f.book(token);
  assert.equal(book.orders.length, 1);
  assert.equal(book.orders[0].status, 'PENDING');
  assert.equal(book.receipts.length, 0);
});

test('K11520 server persists idempotent orders and isolated settlement across client absence and service restart', async t => {
  const f = await makeK11520BackendFixture(t);
  f.prime();
  await f.poll();
  const {token, player} = await f.login({name: '離線委託驗收'});
  const post = body => f.request('/api/v1/order', {method: 'POST', token, body});
  const before = await f.book(token);
  const btc = k11520OrderRequest('BTCUSDT', 'order-test-offline-btc-001', {triggerPrice: 65100});
  const placed = await post(btc);
  assert.equal(placed.body.ok, true, JSON.stringify(placed.body));
  const {orderId} = placed.body.order;
  assert.ok(orderId);
  assert.equal(placed.body.order.status, 'PENDING');
  const duplicate = await post(btc);
  assert.equal(duplicate.body.ok, true, JSON.stringify(duplicate.body));
  assert.equal(duplicate.body.replayed, true);
  assert.equal(duplicate.body.order.orderId, orderId);
  assert.ok((await post({...btc, triggerPrice: 65101})).status >= 400);
  const eth = k11520OrderRequest('ETHUSDT', 'order-test-offline-eth-001', {triggerPrice: 3410, stopPrice: 3390});
  assert.equal((await post(eth)).body.ok, true);

  // No API consumer is attached while these polls feed the owner ledger.
  const unconfirmedAt = f.advance();
  f.quote('BTCUSDT', 130000, 2);
  f.quote('ETHUSDT', 3410, 2);
  await f.poll();
  const whilePaused = await f.book(token);
  const evidence = (await f.request('/api/v1/markets')).body;
  assert.notEqual(evidence.statuses.BTCUSDT.status, 'READY');
  assert.equal(whilePaused.orders.find(o => o.orderId === orderId).status, 'PENDING');
  assert.equal(whilePaused.receipts.some(r => r.market === 'BTCUSDT'), false);
  assert.equal(whilePaused.receipts.find(r => r.market === 'ETHUSDT').triggeredAt, unconfirmedAt);

  f.advance();
  f.quote('BTCUSDT', 65200, 3);
  await f.poll();
  assert.equal((await f.book(token)).orders.find(o => o.orderId === orderId).status, 'PENDING',
    'a reconnect price beyond the trigger cannot establish a crossing through the source gap');

  const touchAt = f.advance();
  f.quote('BTCUSDT', 65100, 4);
  await f.poll();
  const withFill = await f.book(token);
  const fill = withFill.receipts.find(r => r.kind === 'FILL' && r.orderId === orderId);
  assert.ok(fill, JSON.stringify(withFill.receipts));
  assert.equal(fill.fillPrice, 65100);
  assert.equal(fill.triggeredAt, touchAt);
  assert.equal(fill.pnlModel, C_PNL_MODEL);
  assert.equal(fill.entryFloorUnit, 10000);
  assert.equal(fill.walletBefore - fill.walletAfter, btc.lots);
  assert.equal(fill.priceSource, evidence.observations.ETHUSDT.source);
  assert.equal(fill.priceObservedAt, touchAt);
  assert.equal(fill.priceSequence, 4);
  const fillSnapshot = structuredClone(fill);

  f.advance();
  f.quote('BTCUSDT', 65100, 4, {age: 1000});
  await f.poll();
  assert.equal((await f.book(token)).receipts.filter(r => r.orderId === orderId).length, 1);
  const liquidationAt = f.advance();
  f.quote('BTCUSDT', 51000, 5, {corroborates: 51001});
  await f.poll();
  const settled = await f.book(token);
  const liquidation = settled.receipts.find(r => r.orderId === orderId && r.kind === 'SETTLEMENT');
  assert.ok(liquidation, JSON.stringify(settled.receipts));
  assert.equal(liquidation.status, 'LIQUIDATED');
  assert.equal(liquidation.settlementPrice, 51000);
  assert.equal(liquidation.settledAt, liquidationAt);
  assert.equal(liquidation.realizedPnl, -btc.lots);
  assert.ok(liquidation.badDebt > 0);
  assert.equal(settled.wallet.free, before.wallet.free - btc.lots - eth.lots);
  assert.ok(settled.wallet.free >= 0);
  assert.equal(settled.wallet.lockedMargin, eth.lots);
  assert.equal(settled.positions.find(p => p.market === 'ETHUSDT').status, 'OPEN');
  assert.deepEqual(settled.receipts.find(r => r.receiptId === fill.receiptId), fillSnapshot);

  const stopAt = f.advance();
  f.quote('ETHUSDT', 3390, 3);
  await f.poll();
  const afterStops = await f.book(token);
  const stop = afterStops.receipts.find(r => r.market === 'ETHUSDT' && r.kind === 'SETTLEMENT');
  assert.ok(stop, JSON.stringify(afterStops.receipts));
  assert.equal(stop.status, 'STOPPED');
  assert.equal(stop.settlementPrice, 3390);
  assert.equal(stop.settledAt, stopAt);
  assert.equal(stop.realizedPnl, -0.04);
  assert.equal(afterStops.wallet.lockedMargin, 0);
  assert.deepEqual(afterStops.receipts.find(r => r.receiptId === liquidation.receiptId), liquidation);

  await f.restart();
  const resumed = await f.login({token});
  assert.equal(resumed.player.id, player.id);
  assert.equal(resumed.token, token);
  const readback = await f.book(token);
  assert.deepEqual(readback.receipts, afterStops.receipts);
  assert.deepEqual(readback.wallet, afterStops.wallet);
  const replayAfterRestart = await post(btc);
  assert.equal(replayAfterRestart.body.ok, true, JSON.stringify(replayAfterRestart.body));
  assert.equal(replayAfterRestart.body.replayed, true);
  assert.equal(replayAfterRestart.body.order.orderId, orderId);
  assert.equal((await f.book(token)).receipts.filter(r => r.orderId === orderId).length, 2);
});

test('K11520 server keeps legacy records private and preserves their historical balance', async t => {
  const legacyPlayer = {
    id: 'legacy-fixture-id',
    name: '舊帳戶',
    xyz: {x: 1, y: 2, z: 3},
    kgen: 4.5,
    kaios: 80,
    kufo: 1,
    hp: 70,
    home: null,
    updatedAt: '2026-11-01T00:00:00.000Z',
    orders: [{id: 'old-order-1', price: 100000, priceSource: 'HISTORICAL', status: 'CLOSED'}],
  };
  const legacy = {[legacyPlayer.id]: legacyPlayer};
  const f = await makeK11520BackendFixture(t, {legacy});
  const attempted = await f.request('/api/v1/login', {method: 'POST', body: {playerId: legacyPlayer.id}});
  assert.ok(attempted.status >= 400);
  const unauthorized = await f.request('/api/v1/orders');
  assert.equal(unauthorized.status, 401);
  const {token, player} = await f.login({name: '新帳戶'});
  assert.notEqual(player.id, legacyPlayer.id);
  const fresh = await f.book(token);
  assert.equal(fresh.orders.length, 0);
  assert.equal(fresh.receipts.length, 0);
  function findLegacy(value) {
    if (value === null || typeof value !== 'object') return undefined;
    if (value.id === legacyPlayer.id) return value;
    return Object.values(value).map(findLegacy).find(Boolean);
  }
  assert.deepEqual(findLegacy(await f.readDatabase()), legacyPlayer);
  await f.restart();
  assert.deepEqual(findLegacy(await f.readDatabase()), legacyPlayer);
});

test('K11520 background poll persists a single touch without a connected player page', async t => {
  const {setTimeout: wait} = await import('node:timers/promises');
  const f = await makeK11520BackendFixture(t, {pollIntervalMs: 20});
  const {token, player} = await f.login({name: '排程驗收'});
  async function eventuallyRead(read, label) {
    const expires = performance.now() + 5000;
    do {
      const result = await read();
      if (result) return result;
      await wait(20);
    } while (performance.now() < expires);
    const {body: marketState} = await f.request('/api/v1/markets');
    const orderBook = await f.book(token);
    assert.fail(label + ' ' + JSON.stringify({marketState, orders: orderBook.orders, receipts: orderBook.receipts}));
  }
  f.prime();
  await eventuallyRead(async () => {
    const {body} = await f.request('/api/v1/markets');
    return body.statuses.BNBUSDT.status === 'READY';
  }, 'background polling should warm the public quote');
  const response = await f.request('/api/v1/order', {
    method: 'POST', token,
    body: k11520OrderRequest('BNBUSDT', 'order-test-background-bnb-001', {triggerPrice: 621}),
  });
  assert.equal(response.body.ok, true, JSON.stringify(response.body));
  const {orderId} = response.body.order;

  // After submission, no HTTP request occurs until the scheduler has committed the receipt.
  const touchedAt = f.advance();
  f.quote('BNBUSDT', 621, 2);
  const persisted = await eventuallyRead(async () => {
    const state = await f.readDatabase();
    return state.players[player.id]?.ledger?.simulation?.receipts?.find(r => r.orderId === orderId);
  }, 'background polling should commit a fill without a browser page');
  assert.equal(persisted.kind, 'FILL');
  assert.equal(persisted.fillPrice, 621);
  assert.equal(persisted.triggeredAt, touchedAt);

  await f.restart();
  assert.deepEqual((await f.book(token)).receipts, [persisted]);
});

test('K11520 LAN preview pairs the device and shares only the authenticated simulation book', async t => {
  const {randomBytes} = await import('node:crypto');
  const {request} = await import('node:http');
  const {networkInterfaces} = await import('node:os');
  const address = Object.values(networkInterfaces()).flat().find(entry =>
    entry?.family === 'IPv4' && !entry.internal &&
    /^(?:10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(entry.address)
  )?.address;
  if (!address) {
    t.skip('No assigned private IPv4 interface');
    return;
  }

  const accessCode = randomBytes(24).toString('hex');
  const f = await makeK11520BackendFixture(t, {lanPreview: {address, accessCode}});
  const lanOrigin = 'http://' + address + ':' + new URL(f.origin).port;
  const gamePath = encodeURI('/K線西遊記/temples/11520/game-5d.html');
  const gameUrl = gamePath + '?world=88888&preview=server';
  const previewMarker = '<meta name="k11520-private-preview" content="lan">';

  function send(path, {method = 'GET', headers, body} = {}) {
    return new Promise((resolve, reject) => {
      const req = request(new URL(path, lanOrigin), {
        method, headers, signal: AbortSignal.timeout(5000),
      }, res => {
        let text = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { text += chunk; });
        res.on('error', reject);
        res.on('end', () => resolve({status: res.statusCode, headers: res.headers, text}));
      });
      req.on('error', reject);
      req.end(body);
    });
  }

  function pair(code, origin = lanOrigin) {
    return send('/preview/access', {
      method: 'POST',
      headers: {origin, 'content-type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({code, world: '88888'}).toString(),
    });
  }

  const unpaired = await send(gameUrl);
  assert.equal(unpaired.status, 401);
  assert.match(unpaired.headers['content-type'], /^text\/html\b/);
  assert.match(unpaired.text, /action="\/preview\/access"/);
  assert.match(unpaired.text, /name="world" value="88888"/);
  assert.equal(unpaired.text.includes(previewMarker), false);
  assert.equal(unpaired.text.includes(accessCode), false);
  assert.equal((await send('/api/v1/markets')).status, 401);

  const wrongCode = await pair('0'.repeat(accessCode.length));
  assert.equal(wrongCode.status, 401);
  assert.equal(wrongCode.headers['set-cookie'], undefined);
  const wrongOrigin = await pair(accessCode, f.origin);
  assert.equal(wrongOrigin.status, 403);
  assert.equal(wrongOrigin.headers['set-cookie'], undefined);

  const paired = await pair(accessCode);
  assert.equal(paired.status, 303);
  assert.equal(paired.headers.location, gameUrl);
  assert.equal(paired.headers['set-cookie']?.length, 1);
  const [setCookie] = paired.headers['set-cookie'];
  assert.match(setCookie, /;\s*HttpOnly(?:;|$)/i);
  assert.match(setCookie, /;\s*SameSite=Strict(?:;|$)/i);
  assert.equal(setCookie.includes(accessCode), false);
  const [cookie] = setCookie.split(';', 1);

  const shell = await send(gameUrl, {headers: {cookie}});
  assert.equal(shell.status, 200);
  assert.ok(shell.text.includes(previewMarker));
  const localShell = await fetch(f.origin + gameUrl, {signal: AbortSignal.timeout(5000)});
  assert.equal(localShell.status, 200);
  assert.equal((await localShell.text()).includes(previewMarker), false);
  assert.equal((await send(gameUrl, {headers: {cookie, host: 'unrelated.invalid'}})).status, 403);
  assert.equal((await send('/api/v1/markets', {headers: {cookie, origin: f.origin}})).status, 403);
  assert.equal((await send('/api/v1/orders', {headers: {cookie}})).status, 401);

  const jsonHeaders = {cookie, origin: lanOrigin, 'content-type': 'application/json'};
  const login = await send('/api/v1/login', {
    method: 'POST', headers: jsonHeaders, body: JSON.stringify({name: '區網試玩'}),
  });
  assert.equal(login.status, 200);
  const {ok, token} = JSON.parse(login.text);
  assert.equal(ok, true);
  assert.equal(typeof token, 'string');
  assert.ok(token.length > 0);
  const authorization = 'Bearer ' + token;
  assert.equal((await send('/api/v1/orders', {headers: {authorization}})).status, 401);

  f.prime();
  await f.poll();
  const posted = await send('/api/v1/order', {
    method: 'POST', headers: {...jsonHeaders, authorization},
    body: JSON.stringify(k11520OrderRequest('BTCUSDT', 'lan-preview-btc-order-001', {triggerPrice: 65100})),
  });
  assert.equal(posted.status, 200, posted.text);
  const {order} = JSON.parse(posted.text);
  assert.equal(order.status, 'PENDING');
  assert.deepEqual((await f.book(token)).orders, [order]);

  const touchedAt = f.advance();
  f.quote('BTCUSDT', 65100, 2);
  await f.poll();
  const filled = await send('/api/v1/orders', {headers: {cookie, authorization}});
  assert.equal(filled.status, 200);
  const {receipts} = JSON.parse(filled.text);
  assert.equal(receipts.length, 1);
  assert.equal(receipts[0].kind, 'FILL');
  assert.equal(receipts[0].orderId, order.orderId);
  assert.equal(receipts[0].fillPrice, 65100);
  assert.equal(receipts[0].triggeredAt, touchedAt);
  assert.deepEqual((await f.book(token)).receipts, receipts);

  await f.restart();
  assert.deepEqual((await f.book(token)).receipts, receipts);
});
