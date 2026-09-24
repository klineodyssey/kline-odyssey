import assert from 'node:assert/strict';
import {createKgenLedger,requiredMargin,reserveOrder,cancelReservedOrder,activateMargin,closeMargin,snapshot,pnlForMove,maxAdversePoints,positionRisk,MAX_C_LEVERAGE} from '../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs';
import {formatUnits,readErc20Balance,assertExecutableOrder} from '../K線西遊記/temples/11520/runtime/evm-wallet-runtime.mjs';

assert.equal(MAX_C_LEVERAGE,100);
assert.equal(requiredMargin({lots:8}),8);
assert.equal(requiredMargin({lots:100}),100);
assert.equal(pnlForMove({entry:100,mark:101,side:'多',lots:100,c:100}),100);
assert.equal(pnlForMove({entry:100,mark:99,side:'多',lots:100,c:100}),-100);
assert.equal(pnlForMove({entry:100,mark:101,side:'空',lots:100,c:100}),-100);
assert.equal(maxAdversePoints(100,100),1);
assert.equal(maxAdversePoints(50,100),2);
assert.throws(()=>pnlForMove({entry:100,mark:101,side:'多',lots:1,c:1000}),/C_LEVERAGE_OUT_OF_RANGE/);
assert.throws(()=>pnlForMove({entry:100,mark:101,side:'多',lots:1,c:'not-a-number'}),/C_LEVERAGE_OUT_OF_RANGE/);
assert.throws(()=>pnlForMove({entry:100,mark:Infinity,side:'多',lots:1,c:1}),/MARK_PRICE_MUST_BE_POSITIVE/);
assert.throws(()=>pnlForMove({entry:100,mark:101,side:'多',lots:Infinity,c:1}),/LOTS_MUST_BE_NON_NEGATIVE/);
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
assert.equal(assertExecutableOrder({wallet:{account:'0x1',chainId:56},chainId:56,marketAdapter:{preview(){},submit(){}},order:{axis:'KX',side:'LONG',notional:1}}).ok,true);
assert.equal(assertExecutableOrder({wallet:{account:'0x1',chainId:56},chainId:56,marketAdapter:null,order:{axis:'KX',side:'LONG',notional:1}}).reason,'NO_VERIFIED_MARKET_ADAPTER');
console.log('11520 KGEN 100C leverage cap + isolated wallet foundation PASS');
