export const MAX_C_LEVERAGE=100;
export const MAX_LOTS=100;

export function normalizeSignedC(c,{allowNeutral=false}={}){
  const n=Number(c);
  if(!Number.isFinite(n)||Math.abs(n)>MAX_C_LEVERAGE)throw new RangeError('C_LEVERAGE_OUT_OF_RANGE');
  if(n===0&&!allowNeutral)throw new RangeError('C_NEUTRAL_NO_POSITION');
  return n===0?0:n;
}

export function signedPositionSide(c,side){
  const n=normalizeSignedC(c),direction=n<0?'SHORT':'LONG';
  if(side!==undefined){
    const s=String(side).trim().toUpperCase(),normalized=s==='多'?'LONG':s==='空'?'SHORT':s;
    if(!['LONG','SHORT'].includes(normalized))throw new RangeError('SIDE_NOT_SUPPORTED');
    if(normalized!==direction)throw new RangeError('C_SIDE_MISMATCH');
  }
  return direction;
}

// Explicit adapter for historical magnitude + side records only. New orders use signed C.
export function signedCFromLegacyMagnitude(c,side){
  const magnitude=Number(c);
  if(!Number.isFinite(magnitude)||magnitude<0||magnitude>MAX_C_LEVERAGE)throw new RangeError('C_LEVERAGE_OUT_OF_RANGE');
  const s=String(side).trim().toUpperCase();
  if(!['LONG','SHORT','多','空'].includes(s))throw new RangeError('SIDE_NOT_SUPPORTED');
  return normalizeSignedC((s==='SHORT'||s==='空'?-1:1)*magnitude);
}

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
// |C| is leverage, hard-capped at 100x. sign(C) alone supplies direction.
export function requiredMargin({lots}){
  const n=Number(lots);
  if(!Number.isInteger(n)||n<1||n>MAX_LOTS)throw new RangeError('LOTS_OUT_OF_RANGE');
  return n;
}

export function pnlForMove({entry,mark,side,lots,c}){
  const e=Number(entry);
  if(!Number.isFinite(e)||e<=0)throw new RangeError('ENTRY_PRICE_MUST_BE_POSITIVE');
  const m=Number(mark);
  if(!Number.isFinite(m)||m<=0)throw new RangeError('MARK_PRICE_MUST_BE_POSITIVE');
  const quantity=requiredMargin({lots});
  const direction=signedPositionSide(c,side)==='SHORT'?-1:1;
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
  const long=signedPositionSide(c,side)==='LONG';
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

// Simulation lifecycle on the existing ledger, never a real-funds oracle or wallet.
const SIM_MARKETS=Object.freeze({KX:'BTCUSDT',KY:'ETHUSDT',KZ:'BNBUSDT'});
const SIM_MAX_AGE=15000;
function simulationBook(ledger){return ledger.simulation??{sequence:0,orders:[],positions:[],receipts:[],observations:{}}}
function positivePrice(value){const n=Number(value);if(!Number.isFinite(n)||n<=0)throw new RangeError('PRICE_MUST_BE_POSITIVE');return n}
function timestamp(value){const n=Number(value);if(!Number.isSafeInteger(n)||n<0)throw new RangeError('INVALID_TIMESTAMP');return n}
function commitSimulation(ledger,draft,book){
  draft.simulation=book;
  // Receipts are append-only immutable values; callers receive detached snapshots.
  for(const receipt of book.receipts)Object.freeze(receipt);
  Object.freeze(book.receipts);
  Object.assign(ledger,draft);
}
function simulationDraft(ledger){return {draft:{...ledger},book:structuredClone(simulationBook(ledger))}}
export function touchedOrCrossed(previous,trigger,observed){
  const p=positivePrice(previous),t=positivePrice(trigger),q=positivePrice(observed);
  return q===t||(p<t&&q>t)||(p>t&&q<t);
}
function updateSimulationEquity(draft,book){
  draft.unrealizedPnl=book.positions.filter(p=>p.status==='OPEN').reduce((sum,p)=>sum+positionRisk({...p,mark:p.mark}).pnl,0);
  draft.total=draft.free+draft.lockedMargin+draft.reservedOrders;
}
export function placeSimulationOrder(ledger,{axis,market,c,side,lots,triggerPrice,stopPrice=null,takeProfitPrice=null,now=Date.now()}={}){
  try{
    if(SIM_MARKETS[axis]!==market)throw new RangeError('AXIS_MARKET_MISMATCH');
    const signedC=normalizeSignedC(c),direction=signedPositionSide(signedC,side),margin=requiredMargin({lots}),trigger=positivePrice(triggerPrice),createdAt=timestamp(now);
    const stop=stopPrice==null?null:positivePrice(stopPrice),takeProfit=takeProfitPrice==null?null:positivePrice(takeProfitPrice);
    if(stop!==null&&(signedC>0?stop>=trigger:stop<=trigger))throw new RangeError('INVALID_STOP_DIRECTION');
    if(takeProfit!==null&&(signedC>0?takeProfit<=trigger:takeProfit>=trigger))throw new RangeError('INVALID_TP_DIRECTION');
    const {draft,book}=simulationDraft(ledger),quote=book.observations[market];
    if(!quote||createdAt<quote.at||createdAt-quote.at>SIM_MAX_AGE)throw new RangeError('STALE_PRICE');
    if(book.orders.some(o=>o.axis===axis&&o.status==='PENDING')||book.positions.some(p=>p.axis===axis&&p.status==='OPEN'))throw new RangeError('AXIS_ALREADY_ACTIVE');
    if(!Number.isFinite(draft.free)||draft.free<margin)throw new RangeError('INSUFFICIENT_FREE_KGEN');
    const order={orderId:`SIM-O-${++book.sequence}`,trader:'SIMULATION_LOCAL_PLAYER',axis,market,side:direction,c:signedC,lots:Number(lots),triggerPrice:trigger,stopPrice:stop,takeProfitPrice:takeProfit,createdAt,triggeredAt:null,observedPrice:null,fillPrice:null,positionId:null,status:'PENDING'};
    book.orders.push(order);commitSimulation(ledger,draft,book);return {ok:true,order:{...order}};
  }catch(e){return {ok:false,reason:e.message}}
}
export function cancelSimulationOrder(ledger,orderId){
  const {draft,book}=simulationDraft(ledger),order=book.orders.find(o=>o.orderId===orderId);
  if(!order||order.status!=='PENDING')return {ok:false,reason:'ORDER_NOT_PENDING'};
  order.status='CANCELLED';commitSimulation(ledger,draft,book);return {ok:true,order:{...order}};
}
function settleSimulationPosition(draft,book,position,{previousPrice,observedPrice,at,status}){
  const risk=positionRisk({...position,mark:observedPrice}),marginBefore=position.margin;
  if(draft.lockedMargin<marginBefore)throw new RangeError('COLLATERAL_INVARIANT');
  const realizedPnl=status==='LIQUIDATED'?-marginBefore:risk.pnl;
  closeMargin(draft,{margin:marginBefore,pnl:realizedPnl});
  position.status=status;position.margin=0;position.mark=observedPrice;position.settledAt=at;
  const receipt={receiptId:`SIM-R-${++book.sequence}`,kind:'SETTLEMENT',simulationOnly:true,positionId:position.positionId,orderId:position.orderId,market:position.market,axis:position.axis,side:position.side,c:position.c,lots:position.lots,entryPrice:position.entry,liquidationTrigger:liquidationMark(position),previousPrice,observedPrice,settlementPrice:observedPrice,triggeredAt:at,settledAt:at,marginBefore,marginAfter:0,rawPnl:risk.rawPnl,realizedPnl,badDebt:Math.max(0,-marginBefore-risk.rawPnl),status};
  book.receipts.push(receipt);return receipt;
}
export function observeSimulationPrice(ledger,{market,price,observedAt=Date.now(),now=Date.now()}={}){
  try{
    if(!Object.values(SIM_MARKETS).includes(market))throw new RangeError('MARKET_NOT_SUPPORTED');
    const observedPrice=positivePrice(price),at=timestamp(observedAt),receivedAt=timestamp(now);
    if(at>receivedAt||receivedAt-at>SIM_MAX_AGE)throw new RangeError('STALE_PRICE');
    const {draft,book}=simulationDraft(ledger),previous=book.observations[market];
    if(previous&&at<=previous.at)throw new RangeError('OUT_OF_ORDER_PRICE');
    const previousPrice=previous?.price??observedPrice,events=[];
    book.observations[market]={price:observedPrice,at};
    for(const order of book.orders){
      if(order.market!==market||order.status!=='PENDING'||at<order.createdAt||!touchedOrCrossed(previousPrice,order.triggerPrice,observedPrice))continue;
      const margin=requiredMargin(order);
      if(draft.free<margin){order.status='REJECTED';order.reason='INSUFFICIENT_FREE_KGEN';events.push({kind:'REJECTED',orderId:order.orderId});continue}
      const walletBefore=draft.free;
      const reserved=reserveOrder(draft,margin),locked=reserved.ok&&activateMargin(draft,margin);
      if(!reserved.ok||!locked?.ok||locked.amount!==margin)throw new RangeError('COLLATERAL_INVARIANT');
      const positionId=`SIM-P-${++book.sequence}`;
      const position={positionId,orderId:order.orderId,axis:order.axis,market,side:order.side,c:order.c,signedC:order.c,lots:order.lots,entry:observedPrice,mark:observedPrice,principal:margin,margin,stopPrice:order.stopPrice,takeProfitPrice:order.takeProfitPrice,status:'OPEN',openedAt:at};
      book.positions.push(position);Object.assign(order,{status:'FILLED',triggeredAt:at,observedPrice,fillPrice:observedPrice,positionId});
      const receipt={receiptId:`SIM-R-${++book.sequence}`,kind:'FILL',simulationOnly:true,orderId:order.orderId,positionId,market,axis:order.axis,side:order.side,c:order.c,lots:order.lots,createdAt:order.createdAt,triggeredAt:at,previousPrice,triggerPrice:order.triggerPrice,observedPrice,fillPrice:observedPrice,walletBefore,marginLocked:margin,walletAfter:draft.free,status:'FILLED'};
      book.receipts.push(receipt);events.push({...receipt});
    }
    for(const position of book.positions){
      if(position.market!==market||position.status!=='OPEN')continue;
      const risk=positionRisk({...position,mark:observedPrice});position.mark=observedPrice;
      const long=position.c>0,liquidated=long?observedPrice<=risk.liquidationMark:observedPrice>=risk.liquidationMark;
      const stopped=position.stopPrice!==null&&(long?observedPrice<=position.stopPrice:observedPrice>=position.stopPrice);
      const takeProfit=position.takeProfitPrice!==null&&(long?observedPrice>=position.takeProfitPrice:observedPrice<=position.takeProfitPrice);
      if(liquidated||stopped||takeProfit)events.push({...settleSimulationPosition(draft,book,position,{previousPrice,observedPrice,at,status:liquidated?'LIQUIDATED':stopped?'STOPPED':'TAKE_PROFIT'})});
    }
    updateSimulationEquity(draft,book);commitSimulation(ledger,draft,book);return {ok:true,events};
  }catch(e){return {ok:false,reason:e.message}}
}
export function closeSimulationPosition(ledger,positionId,{now=Date.now()}={}){
  try{
    const {draft,book}=simulationDraft(ledger),position=book.positions.find(p=>p.positionId===positionId);
    if(!position||position.status!=='OPEN')throw new RangeError('POSITION_NOT_OPEN');
    const quote=book.observations[position.market],at=timestamp(now);
    if(!quote||at<quote.at||at-quote.at>SIM_MAX_AGE)throw new RangeError('STALE_PRICE');
    const receipt=settleSimulationPosition(draft,book,position,{previousPrice:quote.price,observedPrice:quote.price,at,status:'CLOSED'});
    updateSimulationEquity(draft,book);commitSimulation(ledger,draft,book);return {ok:true,receipt:{...receipt}};
  }catch(e){return {ok:false,reason:e.message}}
}
export function simulationSnapshot(ledger){return {mode:'SIMULATION_WALLET',wallet:snapshot(ledger),...structuredClone(simulationBook(ledger))}}
