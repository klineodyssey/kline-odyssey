export function createKgenLedger(total=0){
  const value=Math.max(0,Number(total)||0);
  return {total:value,free:value,lockedMargin:0,reservedOrders:0,realizedPnl:0,unrealizedPnl:0};
}

export function equity(ledger){
  return Number(ledger.free||0)+Number(ledger.lockedMargin||0)+Number(ledger.reservedOrders||0)+Number(ledger.unrealizedPnl||0);
}

export function available(ledger){return Math.max(0,Number(ledger.free||0));}

// 11520 locked KGEN law: 1 KGEN = 1 lot of principal/margin.
// C is NOT used to reduce principal. C only multiplies PnL velocity.
export function requiredMargin({lots}){
  return Math.max(0,Number(lots)||0);
}

export function pnlForMove({entry,mark,side,lots,c}){
  const direction=String(side).toUpperCase()==='SHORT'||side==='空'?-1:1;
  return (Number(mark)-Number(entry))*direction*Math.max(0,Number(lots)||0)*Math.max(0,Number(c)||0);
}

export function maxAdversePoints(c){
  const speed=Math.max(0,Number(c)||0);
  return speed===0?Infinity:1/speed;
}

export function liquidationMark({entry,side,c}){
  const distance=maxAdversePoints(c);
  if(!Number.isFinite(distance))return null;
  const long=!(String(side).toUpperCase()==='SHORT'||side==='空');
  return Number(entry)+(long?-distance:distance);
}

export function clampPositionPnl({principal,pnl}){
  const p=Math.max(0,Number(principal)||0),x=Number(pnl)||0;
  return Math.max(-p,x);
}

export function positionRisk({entry,mark,side,lots,c}){
  const principal=requiredMargin({lots});
  const rawPnl=pnlForMove({entry,mark,side,lots,c});
  const pnl=clampPositionPnl({principal,pnl:rawPnl});
  const remaining=Math.max(0,principal+pnl);
  return {principal,pnl,rawPnl,remaining,liquidated:rawPnl<=-principal,maxAdversePoints:maxAdversePoints(c),liquidationMark:liquidationMark({entry,side,c})};
}

export function reserveOrder(ledger,amount){
  const n=Math.max(0,Number(amount)||0);
  if(n===0)return {ok:false,reason:'ZERO_MARGIN'};
  if(ledger.free<n)return {ok:false,reason:'INSUFFICIENT_FREE_KGEN',required:n,free:ledger.free};
  ledger.free-=n;ledger.reservedOrders+=n;return {ok:true,amount:n};
}

export function cancelReservedOrder(ledger,amount){
  const n=Math.min(Math.max(0,Number(amount)||0),Number(ledger.reservedOrders||0));
  ledger.reservedOrders-=n;ledger.free+=n;return {ok:true,amount:n};
}

export function activateMargin(ledger,amount){
  const n=Math.min(Math.max(0,Number(amount)||0),Number(ledger.reservedOrders||0));
  ledger.reservedOrders-=n;ledger.lockedMargin+=n;return {ok:n>0,amount:n};
}

export function closeMargin(ledger,{margin=0,pnl=0}){
  const m=Math.min(Math.max(0,Number(margin)||0),Number(ledger.lockedMargin||0));
  const capped=Math.max(-m,Number(pnl)||0);
  ledger.lockedMargin-=m;
  ledger.realizedPnl+=capped;
  ledger.free+=Math.max(0,m+capped);
  ledger.total=Math.max(0,Number(ledger.free||0)+Number(ledger.lockedMargin||0)+Number(ledger.reservedOrders||0));
  return {ok:true,released:m,realizedPnl:capped,liquidated:capped<=-m};
}

export function setUnrealizedPnl(ledger,pnl){ledger.unrealizedPnl=Number(pnl)||0;return ledger.unrealizedPnl;}

export function snapshot(ledger){return {total:Number(ledger.total||0),free:Number(ledger.free||0),lockedMargin:Number(ledger.lockedMargin||0),reservedOrders:Number(ledger.reservedOrders||0),unrealizedPnl:Number(ledger.unrealizedPnl||0),realizedPnl:Number(ledger.realizedPnl||0),equity:equity(ledger)};}
