import assert from 'node:assert/strict';
import {createKgenLedger,requiredMargin,reserveOrder,cancelReservedOrder,activateMargin,closeMargin,snapshot,pnlForMove,maxAdversePoints,positionRisk} from '../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs';
import {formatUnits,readErc20Balance,assertExecutableOrder} from '../K線西遊記/temples/11520/runtime/evm-wallet-runtime.mjs';

assert.equal(requiredMargin({lots:8}),8);
assert.equal(requiredMargin({lots:1000}),1000);
assert.equal(pnlForMove({entry:100,mark:101,side:'多',lots:100,c:1}),100);
assert.equal(pnlForMove({entry:100,mark:99,side:'多',lots:100,c:.001}),-.1);
assert.equal(maxAdversePoints(1),1);
assert.equal(maxAdversePoints(.001),1000);
assert.equal(maxAdversePoints(.000001),1000000);
const blown=positionRisk({entry:100,mark:99,side:'多',lots:100,c:1});
assert.equal(blown.principal,100);assert.equal(blown.pnl,-100);assert.equal(blown.remaining,0);assert.equal(blown.liquidated,true);
const safe=positionRisk({entry:100,mark:99,side:'多',lots:100,c:.001});
assert.equal(safe.pnl,-.1);assert.equal(safe.remaining,99.9);assert.equal(safe.liquidated,false);

const ledger=createKgenLedger(100);
assert.equal(reserveOrder(ledger,10).ok,true);
assert.deepEqual(snapshot(ledger),{total:100,free:90,lockedMargin:0,reservedOrders:10,unrealizedPnl:0,realizedPnl:0,equity:100});
assert.equal(cancelReservedOrder(ledger,10).ok,true);
assert.equal(reserveOrder(ledger,10).ok,true);
assert.equal(activateMargin(ledger,10).amount,10);
closeMargin(ledger,{margin:10,pnl:-20});
assert.equal(snapshot(ledger).free,90); // single order cannot lose more than its 10 KGEN principal
assert.equal(snapshot(ledger).realizedPnl,-10);

assert.equal(formatUnits(1234500000000000000n,18),'1.2345');
const mock={request:async ({method})=>method==='eth_call'?'0x0de0b6b3a7640000':null};
const balance=await readErc20Balance({provider:mock,token:'0x0000000000000000000000000000000000000001',account:'0x0000000000000000000000000000000000000002'});
assert.equal(balance.formatted,'1');
assert.equal(assertExecutableOrder({wallet:{account:'0x1',chainId:56},chainId:56,marketAdapter:{preview(){},submit(){}},order:{axis:'KX',side:'LONG',notional:1}}).ok,true);
assert.equal(assertExecutableOrder({wallet:{account:'0x1',chainId:56},chainId:56,marketAdapter:null,order:{axis:'KX',side:'LONG',notional:1}}).reason,'NO_VERIFIED_MARKET_ADAPTER');
console.log('11520 KGEN C-speed principal + wallet foundation PASS');
