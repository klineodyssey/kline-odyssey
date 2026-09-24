export const MAX_C_LEVERAGE=100;

export function normalizeLeverage(c){
  const n=Math.abs(Number(c));
  if(!Number.isFinite(n)||n>MAX_C_LEVERAGE)throw new RangeError('C_LEVERAGE_OUT_OF_RANGE');
  return n;
}

export function createKgenLedger(total=0){
  const value=Math.max(0,Number(total)||0);
  return {total:value,free:value,lockedMargin:0,reservedOrders:0,realizedPnl:0,unrealizedPnl:0};
}

export function equity(ledger){
  return Number(ledger.free||0)+Number(ledger.lockedMargin||0)+Number(ledger.reservedOrders||0)+Number(ledger.unrealizedPnl||0);
}

export function available(ledger){return Math.max(0,Number(ledger.free||0));}

// 11520 law: 1 KGEN = 1 lot of isolated principal/margin.
// |C| is leverage, hard-capped at 100x. sign(C)/side supplies direction.
export function requiredMargin({lots}){
  const n=Number(lots);
  if(!Number.isFinite(n)||n<0)throw new RangeError('LOTS_MUST_BE_NON_NEGATIVE');
  return n;
}

export function pnlForMove({entry,mark,side,lots,c}){
  const e=Number(entry);
  if(!Number.isFinite(e)||e<=0)throw new RangeError('ENTRY_PRICE_MUST_BE_POSITIVE');
  const m=Number(mark);
  if(!Number.isFinite(m)||m<=0)throw new RangeError('MARK_PRICE_MUST_BE_POSITIVE');
  const quantity=requiredMargin({lots});
  const direction=String(side).toUpperCase()==='SHORT'||side==='空'?-1:1;
  const leverage=normalizeLeverage(c);
  const returnFraction=(m-e)/e;
  return returnFraction*direction*quantity*leverage;
}

export function maxAdverseFraction(c){
  const leverage=normalizeLeverage(c);
  return leverage===0?Infinity:1/leverage;
}

export function maxAdversePoints(c,entry=1){
  const fraction=maxAdverseFraction(c);
  const e=Number(entry);
  if(!Number.isFinite(e)||e<=0)throw new RangeError('ENTRY_PRICE_MUST_BE_POSITIVE');
  return Number.isFinite(fraction)?e*fraction:Infinity;
}

export function liquidationMark({entry,side,c}){
  const e=Number(entry);
  if(!Number.isFinite(e)||e<=0)throw new RangeError('ENTRY_PRICE_MUST_BE_POSITIVE');
  const distance=maxAdversePoints(c,e);
  if(!Number.isFinite(distance))return null;
  const long=!(String(side).toUpperCase()==='SHORT'||side==='空');
  return e+(long?-distance:distance);
}

export function clampPositionPnl({principal,pnl}){
  const p=Number(principal),x=Number(pnl);
  if(!Number.isFinite(p)||p<0)throw new RangeError('PRINCIPAL_MUST_BE_NON_NEGATIVE');
  if(!Number.isFinite(x))throw new RangeError('PNL_MUST_BE_FINITE');
  return Math.max(-p,x);
}

export function positionRisk({entry,mark,side,lots,c}){
  const principal=requiredMargin({lots});
  const rawPnl=pnlForMove({entry,mark,side,lots,c});
  const pnl=clampPositionPnl({principal,pnl:rawPnl});
  const remaining=Math.max(0,principal+pnl);
  return {principal,pnl,rawPnl,remaining,liquidated:rawPnl<=-principal,maxAdverseFraction:maxAdverseFraction(c),maxAdversePoints:maxAdversePoints(c,entry),liquidationMark:liquidationMark({entry,side,c})};
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
