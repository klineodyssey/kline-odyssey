import {C_MAX,requireCanonicalC,resolveCMode} from '../controls/nonlinear-controls.mjs';
// REVISION 2026-09-29: Human-approved absolute index delta, not percentage return.
export const C_PNL_MODEL='INDEX_DELTA_C_LOTS_V1';

export const MAX_C_LEVERAGE=C_MAX;
export const MAX_LOTS=100;

export function normalizeSignedC(c,{allowNeutral=false}={}){
  const n=Number(c);
  if(!Number.isFinite(n)||Math.abs(n)>MAX_C_LEVERAGE)throw new RangeError('C_LEVERAGE_OUT_OF_RANGE');
  if(n===0&&!allowNeutral)throw new RangeError('C_NEUTRAL_NO_POSITION');
  return requireCanonicalC(c,{allowZero:allowNeutral});
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
  return Math.abs(normalizeSignedC(c,{allowNeutral:true}));
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
  return (m-e)*direction*quantity*leverage;
}

export function maxAdverseFraction(c,entry=1){
  const leverage=normalizeLeverage(c);
  const e=Number(entry);
  if(!Number.isFinite(e)||e<=0)throw new RangeError('ENTRY_PRICE_MUST_BE_POSITIVE');
  return leverage===0?Infinity:1/(leverage*e);
}

export function maxAdversePoints(c,entry=1){
  const leverage=normalizeLeverage(c);
  const e=Number(entry);
  if(!Number.isFinite(e)||e<=0)throw new RangeError('ENTRY_PRICE_MUST_BE_POSITIVE');
  return leverage===0?Infinity:1/leverage;
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
  return {principal,pnl,rawPnl,remaining,liquidated:rawPnl<=-principal,pnlModel:C_PNL_MODEL,maxAdverseFraction:maxAdverseFraction(c,entry),maxAdversePoints:maxAdversePoints(c,entry),liquidationMark:liquidationMark({entry,side,c})};
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
    const order={orderId:`SIM-O-${++book.sequence}`,trader:ledger.owner||'SIMULATION_LOCAL_PLAYER',axis,market,side:direction,c:signedC,lots:Number(lots),triggerPrice:trigger,stopPrice:stop,takeProfitPrice:takeProfit,createdAt,triggeredAt:null,observedPrice:null,fillPrice:null,positionId:null,status:'PENDING'};
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
  const receipt={receiptId:`SIM-R-${++book.sequence}`,kind:'SETTLEMENT',simulationOnly:true,trader:position.trader,positionId:position.positionId,orderId:position.orderId,market:position.market,axis:position.axis,side:position.side,c:position.c,lots:position.lots,entryPrice:position.entry,liquidationTrigger:liquidationMark(position),previousPrice,observedPrice,settlementPrice:observedPrice,triggeredAt:at,settledAt:at,marginBefore,marginAfter:0,rawPnl:risk.rawPnl,realizedPnl,badDebt:Math.max(0,-marginBefore-risk.rawPnl),status};
  book.receipts.push(receipt);return receipt;
}
export function observeSimulationPrice(ledger,{market,price,observedAt=Date.now(),now=Date.now(),sequence=null,productV1=false}={}){
  try{
    if(!Object.values(SIM_MARKETS).includes(market))throw new RangeError('MARKET_NOT_SUPPORTED');
    const observedPrice=positivePrice(price),at=timestamp(observedAt),receivedAt=timestamp(now);
    if(at>receivedAt||receivedAt-at>SIM_MAX_AGE)throw new RangeError('STALE_PRICE');
    const {draft,book}=simulationDraft(ledger),previous=book.observations[market];
    if(previous&&at<=previous.at)throw new RangeError('OUT_OF_ORDER_PRICE');
    if(sequence!==null&&(!Number.isSafeInteger(sequence)||sequence<0||(previous?.sequence!=null&&sequence<=previous.sequence)))throw new RangeError('OUT_OF_ORDER_PRICE');
    const previousPrice=previous?.price??observedPrice,events=[];
    book.observations[market]={price:observedPrice,at,...(sequence!==null?{sequence}:{})};
    for(const order of book.orders){
      if(order.market!==market||order.status!=='PENDING'||at<order.createdAt||!touchedOrCrossed(previousPrice,order.triggerPrice,observedPrice))continue;
      // Revalidate persisted/injected pending records before any reserve or receipt.
      if(productV1&&!resolveCMode(order.c).canTrade){order.status='REJECTED';order.reason='V1_HIGH_SPEED_PRODUCTION_LOCKED';events.push({kind:'REJECTED',orderId:order.orderId});continue}
      signedPositionSide(order.c,order.side);
      const margin=requiredMargin(order);
      if(draft.free<margin){order.status='REJECTED';order.reason='INSUFFICIENT_FREE_KGEN';events.push({kind:'REJECTED',orderId:order.orderId});continue}
      const walletBefore=draft.free;
      const reserved=reserveOrder(draft,margin),locked=reserved.ok&&activateMargin(draft,margin);
      if(!reserved.ok||!locked?.ok||locked.amount!==margin)throw new RangeError('COLLATERAL_INVARIANT');
      const positionId=`SIM-P-${++book.sequence}`;
      const position={trader:order.trader,positionId,orderId:order.orderId,axis:order.axis,market,side:order.side,c:order.c,signedC:order.c,lots:order.lots,entry:observedPrice,mark:observedPrice,principal:margin,margin,stopPrice:order.stopPrice,takeProfitPrice:order.takeProfitPrice,status:'OPEN',openedAt:at};
      book.positions.push(position);Object.assign(order,{status:'FILLED',triggeredAt:at,observedPrice,fillPrice:observedPrice,positionId});
      const receipt={receiptId:`SIM-R-${++book.sequence}`,kind:'FILL',simulationOnly:true,trader:order.trader,orderId:order.orderId,positionId,market,axis:order.axis,side:order.side,c:order.c,lots:order.lots,createdAt:order.createdAt,triggeredAt:at,previousPrice,triggerPrice:order.triggerPrice,observedPrice,fillPrice:observedPrice,walletBefore,marginLocked:margin,walletAfter:draft.free,status:'FILLED'};
      book.receipts.push(receipt);events.push({...receipt});
    }
    for(const position of book.positions){
      if(position.market!==market||position.status!=='OPEN')continue;
      const risk=positionRisk({...position,mark:observedPrice});position.mark=observedPrice;position.observedAt=at;position.observationSequence=sequence;position.deltaIndex=observedPrice-position.entry;position.equity=position.margin+risk.pnl;
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

/**
 * Inert LOCAL_SIMULATION_PRODUCT persistence boundary. No production caller,
 * storage access, migration, defaults or authority over real funds. A valid
 * record is returned by identity, including opaque JSON extension fields.
 * Receipt IDs without bindings remain legacy replay tombstones, never credits.
 */
export function validateLocalSimulationProductRecord(value,{playerId,owner}={}){
  const fail=reason=>{throw new Error(reason)};
  const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
  const fields=(v,names)=>object(v)&&names.every(name=>Object.hasOwn(v,name));
  const integer=v=>Number.isSafeInteger(v)&&v>=0;
  const nonnegative=v=>Number.isFinite(v)&&v>=0;
  const price=v=>Number.isFinite(v)&&v>0;
  const optionalPrice=v=>v===null||price(v);
  const namespaceOwner=v=>typeof v==='string'&&(v==='guest'||/^0x[0-9a-f]{40}$/.test(v));
  const namespacePlayer=v=>typeof v==='string'&&/^KAIOS-P-[a-zA-Z0-9-]{16,80}$/.test(v);
  // Count actual UTF-8 JSON bytes without coercing objects or invoking toJSON /
  // accessors. Reject data that serialization would silently omit or transform.
  let bytes=0;
  const ancestors=new Set();
  function add(text){
    for(const character of text){const point=character.codePointAt(0);bytes+=point<0x80?1:point<0x800?2:point<0x10000?3:4;if(bytes>2_000_000)fail('LOCAL_SIMULATION_PRODUCT_CAPACITY')}
  }
  function json(v,depth=0){
    if(depth>128)fail('INVALID_LOCAL_SIMULATION_PRODUCT_JSON');
    if(typeof v==='string'&&v.length>2_000_000-bytes)fail('LOCAL_SIMULATION_PRODUCT_CAPACITY');
    if(v===null||typeof v==='boolean'||typeof v==='string'){add(JSON.stringify(v));return}
    if(typeof v==='number'){if(!Number.isFinite(v))fail('INVALID_LOCAL_SIMULATION_PRODUCT_JSON');add(JSON.stringify(v));return}
    if((!object(v)&&!Array.isArray(v))||ancestors.has(v))fail('INVALID_LOCAL_SIMULATION_PRODUCT_JSON');
    ancestors.add(v);
    const descriptors=Object.getOwnPropertyDescriptors(v),names=Reflect.ownKeys(descriptors);
    if(Array.isArray(v)){
      if(names.length!==v.length+1)fail('INVALID_LOCAL_SIMULATION_PRODUCT_JSON');
      add('[]');
      for(let i=0;i<v.length;i++){
        const d=descriptors[i];if(!d||!d.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_LOCAL_SIMULATION_PRODUCT_JSON');
        if(i)add(',');json(d.value,depth+1);
      }
    }else{
      add('{}');
      for(let i=0;i<names.length;i++){
        const name=names[i],d=descriptors[name];
        if(typeof name!=='string'||!d.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_LOCAL_SIMULATION_PRODUCT_JSON');
        if(name.length>2_000_000-bytes)fail('LOCAL_SIMULATION_PRODUCT_CAPACITY');
        if(i)add(',');add(JSON.stringify(name));add(':');json(d.value,depth+1);
      }
    }
    ancestors.delete(v);
  }
  json(value);
  if(!namespacePlayer(playerId)||!namespaceOwner(owner)||!fields(value,['schema','playerId','owner','revision','ledger','progress'])||value.schema!=='K11520_LOCAL_SIMULATION_V2'||value.playerId!==playerId||value.owner!==owner)fail('LOCAL_SIMULATION_PRODUCT_NAMESPACE_MISMATCH');
  if(!integer(value.revision))fail('INVALID_LOCAL_SIMULATION_PRODUCT_REVISION');
  const ledger=value.ledger,p=value.progress;
  if(!fields(ledger,['owner','total','free','lockedMargin','reservedOrders','realizedPnl','unrealizedPnl'])||ledger.owner!==owner||!['total','free','lockedMargin','reservedOrders'].every(k=>nonnegative(ledger[k]))||!['realizedPnl','unrealizedPnl'].every(k=>Number.isFinite(ledger[k])))fail('INVALID_LOCAL_SIMULATION_PRODUCT_LEDGER');
  if(!fields(p,['kaios','claimableKaios','spentKaios','loot','xp','engineXp','playedMs','events','courierReceipts','courierInsuranceReceipts','courierReceiptBindings','courierInsuranceBindings'])||!['kaios','claimableKaios','playedMs'].every(k=>nonnegative(p[k])&&p[k]<=Number.MAX_SAFE_INTEGER)||!['spentKaios','loot','xp','engineXp'].every(k=>integer(p[k]))||!object(p.events))fail('INVALID_LOCAL_SIMULATION_PRODUCT_PROGRESS');
  const knownEvents=['UNIQUE_PLAYER','SESSION','MONSTER_KILL','LOOT_DROP','COURIER_SETTLEMENT','COURIER_INSURANCE_PAYOUT','KAIOS_SPEND','TRADE_OPEN','TRADE_FILL','TRADE_CLOSE','LIQUIDATION','RETURNING_PLAYER','ERROR'];
  for(const [event,count] of Object.entries(p.events))if(!event||!nonnegative(count)||count>Number.MAX_SAFE_INTEGER||(knownEvents.includes(event)&&!integer(count)))fail('INVALID_LOCAL_SIMULATION_PRODUCT_PROGRESS');
  // Canonical spelling is exact. Historical variants need an explicit no-loss
  // migration; accepting both spellings would split one replay identity.
  const rewardId=/^COURIER-RECEIPT-[0-9a-f]{8}$/,insuranceId=/^COURIER-INSURANCE-[0-9a-f]{8}$/;
  if(!Array.isArray(p.courierReceipts)||p.courierReceipts.some(id=>typeof id!=='string'||!rewardId.test(id))||new Set(p.courierReceipts).size!==p.courierReceipts.length||!object(p.courierInsuranceReceipts)||Object.entries(p.courierInsuranceReceipts).some(([id,amount])=>!insuranceId.test(id)||!integer(amount)||amount>1080000))fail('INVALID_LOCAL_SIMULATION_PRODUCT_RECEIPTS');
  for(const insurance of [false,true]){
    const bindings=p[insurance?'courierInsuranceBindings':'courierReceiptBindings'],ids=new Set(insurance?Object.keys(p.courierInsuranceReceipts):p.courierReceipts),missions=new Set();
    if(!object(bindings))fail('INVALID_LOCAL_SIMULATION_PRODUCT_RECEIPTS');
    for(const [id,b] of Object.entries(bindings)){
      if(!ids.has(id)||!fields(b,['receiptId','missionId','playerId','owner','rewardKaios','purpose'])||b.receiptId!==id||b.playerId!==playerId||b.owner!==owner||b.purpose!==(insurance?'PLAYER_COURIER_INSURANCE_PAYOUT':'PLAYER_COURIER_REWARD')||typeof b.missionId!=='string'||!b.missionId||b.missionId.length>160||b.missionId!==b.missionId.trim()||/[<>\x00-\x1f]/.test(b.missionId)||!integer(b.rewardKaios)||b.rewardKaios>(insurance?1080000:1000)||(insurance&&b.rewardKaios!==p.courierInsuranceReceipts[id])||missions.has(b.missionId))fail('INVALID_LOCAL_SIMULATION_PRODUCT_RECEIPTS');
      missions.add(b.missionId);
    }
  }
  // A fresh ledger legitimately has no simulation book. Explicit null and
  // partial books are corruption, not invitations to generate an empty book.
  if(!Object.hasOwn(ledger,'simulation'))return value;
  const book=ledger.simulation,invalid=()=>fail('INVALID_LOCAL_SIMULATION_PRODUCT_BOOK');
  if(!fields(book,['sequence','orders','positions','receipts','observations'])||!integer(book.sequence)||!['orders','positions','receipts'].every(k=>Array.isArray(book[k]))||!object(book.observations))invalid();
  const ids=new Set(),lastIds={O:0,P:0,R:0},orders=new Map(),positions=new Map(),fills=new Map(),settlements=new Map(),activeAxes=new Set();
  const numericId=(id,kind)=>{
    if(typeof id!=='string'||!new RegExp(`^SIM-${kind}-[1-9][0-9]*$`).test(id))invalid();
    const n=Number(id.slice(6));if(!Number.isSafeInteger(n)||n>book.sequence||n<=lastIds[kind]||ids.has(n))invalid();ids.add(n);lastIds[kind]=n;return n;
  };
  const contract=v=>{
    if(!fields(v,['trader','axis','market','side','c','lots'])||v.trader!==owner||!Object.hasOwn(SIM_MARKETS,v.axis)||SIM_MARKETS[v.axis]!==v.market||!Number.isFinite(v.c)||v.c===0||v.side!==(v.c<0?'SHORT':'LONG')||!Number.isInteger(v.lots)||v.lots<1||v.lots>MAX_LOTS)invalid();
    try{if(normalizeSignedC(v.c)!==v.c)invalid()}catch{invalid()}
  };
  const sameContract=(a,b)=>['trader','axis','market','side','c','lots'].every(k=>a[k]===b[k]);
  for(const [market,q] of Object.entries(book.observations))if(!Object.values(SIM_MARKETS).includes(market)||!fields(q,['price','at'])||!price(q.price)||!integer(q.at)||(Object.hasOwn(q,'sequence')&&!integer(q.sequence)))invalid();
  for(const o of book.orders){
    contract(o);numericId(o.orderId,'O');
    if(!fields(o,['orderId','triggerPrice','stopPrice','takeProfitPrice','createdAt','triggeredAt','observedPrice','fillPrice','positionId','status'])||!price(o.triggerPrice)||!optionalPrice(o.stopPrice)||!optionalPrice(o.takeProfitPrice)||!integer(o.createdAt)||!['PENDING','CANCELLED','REJECTED','FILLED'].includes(o.status))invalid();
    if(o.stopPrice!==null&&(o.c>0?o.stopPrice>=o.triggerPrice:o.stopPrice<=o.triggerPrice)||o.takeProfitPrice!==null&&(o.c>0?o.takeProfitPrice<=o.triggerPrice:o.takeProfitPrice>=o.triggerPrice))invalid();
    const quote=book.observations[o.market];if(!Object.hasOwn(book.observations,o.market)||!quote||o.createdAt-quote.at>SIM_MAX_AGE)invalid();
    if(o.status==='FILLED'){
      if(!integer(o.triggeredAt)||o.triggeredAt<o.createdAt||!price(o.observedPrice)||o.fillPrice!==o.observedPrice||typeof o.positionId!=='string'||quote.at<o.triggeredAt)invalid();
    }else if(o.triggeredAt!==null||o.observedPrice!==null||o.fillPrice!==null||o.positionId!==null)invalid();
    if(o.status==='REJECTED'){if(!['INSUFFICIENT_FREE_KGEN','V1_HIGH_SPEED_PRODUCTION_LOCKED'].includes(o.reason)||quote.at<o.createdAt||(o.reason==='V1_HIGH_SPEED_PRODUCTION_LOCKED'&&resolveCMode(o.c).canTrade))invalid()}
    else if(Object.hasOwn(o,'reason'))invalid();
    if(o.status==='PENDING'){if(activeAxes.has(o.axis))invalid();activeAxes.add(o.axis)}
    orders.set(o.orderId,o);
  }
  for(const position of book.positions){
    contract(position);numericId(position.positionId,'P');
    if(!fields(position,['positionId','orderId','signedC','entry','mark','principal','margin','stopPrice','takeProfitPrice','status','openedAt','observedAt','observationSequence','deltaIndex','equity'])||position.signedC!==position.c||!price(position.entry)||!price(position.mark)||position.principal!==position.lots||!integer(position.openedAt)||!integer(position.observedAt)||position.observedAt<position.openedAt||(position.observationSequence!==null&&!integer(position.observationSequence))||!Number.isFinite(position.deltaIndex)||!nonnegative(position.equity)||!['OPEN','CLOSED','LIQUIDATED','STOPPED','TAKE_PROFIT'].includes(position.status))invalid();
    const o=orders.get(position.orderId),quote=book.observations[position.market];
    if(!o||o.status!=='FILLED'||o.positionId!==position.positionId||!sameContract(o,position)||o.fillPrice!==position.entry||o.triggeredAt!==position.openedAt||o.stopPrice!==position.stopPrice||o.takeProfitPrice!==position.takeProfitPrice||!quote||quote.at<position.observedAt)invalid();
    const risk=positionRisk(position);
    if(position.deltaIndex!==position.mark-position.entry||position.equity!==position.principal+risk.pnl)invalid();
    if(position.status==='OPEN'){
      if(position.margin!==position.principal||Object.hasOwn(position,'settledAt')||activeAxes.has(position.axis)||position.observedAt!==quote.at||position.mark!==quote.price||position.observationSequence!==(Object.hasOwn(quote,'sequence')?quote.sequence:null))invalid();
      if((position.c>0?position.mark<=risk.liquidationMark:position.mark>=risk.liquidationMark)||(position.stopPrice!==null&&(position.c>0?position.mark<=position.stopPrice:position.mark>=position.stopPrice))||(position.takeProfitPrice!==null&&(position.c>0?position.mark>=position.takeProfitPrice:position.mark<=position.takeProfitPrice)))invalid();
      activeAxes.add(position.axis);
    }else if(position.margin!==0||!integer(position.settledAt)||position.settledAt<position.observedAt)invalid();
    positions.set(position.positionId,position);
  }
  for(const r of book.receipts){
    contract(r);numericId(r.receiptId,'R');
    if(!fields(r,['receiptId','kind','simulationOnly','orderId','positionId','triggeredAt','previousPrice','observedPrice','status'])||r.simulationOnly!==true||!integer(r.triggeredAt)||!price(r.previousPrice)||!price(r.observedPrice))invalid();
    const o=orders.get(r.orderId),position=positions.get(r.positionId);
    if(!o||!position||position.orderId!==r.orderId||!sameContract(r,position))invalid();
    if(r.kind==='FILL'){
      if(!fields(r,['createdAt','triggerPrice','fillPrice','walletBefore','marginLocked','walletAfter'])||r.status!=='FILLED'||r.createdAt!==o.createdAt||r.triggeredAt!==o.triggeredAt||r.triggerPrice!==o.triggerPrice||r.observedPrice!==o.observedPrice||r.fillPrice!==o.fillPrice||r.marginLocked!==position.principal||!nonnegative(r.walletBefore)||!nonnegative(r.walletAfter)||r.walletBefore<r.marginLocked||r.walletAfter!==r.walletBefore-r.marginLocked||!touchedOrCrossed(r.previousPrice,r.triggerPrice,r.observedPrice)||fills.has(r.positionId))invalid();
      fills.set(r.positionId,r);
    }else if(r.kind==='SETTLEMENT'){
      if(!fields(r,['entryPrice','liquidationTrigger','settlementPrice','settledAt','marginBefore','marginAfter','rawPnl','realizedPnl','badDebt'])||position.status==='OPEN'||r.status!==position.status||r.entryPrice!==position.entry||r.observedPrice!==position.mark||r.settlementPrice!==position.mark||r.triggeredAt!==position.settledAt||r.settledAt!==position.settledAt||r.marginBefore!==position.principal||r.marginAfter!==0||!Number.isFinite(r.liquidationTrigger)||!Number.isFinite(r.rawPnl)||!Number.isFinite(r.realizedPnl)||!nonnegative(r.badDebt)||settlements.has(r.positionId))invalid();
      const risk=positionRisk(position),liquidated=position.c>0?position.mark<=risk.liquidationMark:position.mark>=risk.liquidationMark;
      const stopped=position.stopPrice!==null&&(position.c>0?position.mark<=position.stopPrice:position.mark>=position.stopPrice);
      const takeProfit=position.takeProfitPrice!==null&&(position.c>0?position.mark>=position.takeProfitPrice:position.mark<=position.takeProfitPrice);
      if(r.liquidationTrigger!==risk.liquidationMark||r.rawPnl!==risk.rawPnl||r.realizedPnl!==(r.status==='LIQUIDATED'?-position.principal:risk.pnl)||r.badDebt!==Math.max(0,-position.principal-risk.rawPnl)||(r.status==='LIQUIDATED'&&!liquidated)||(r.status==='STOPPED'&&(liquidated||!stopped))||(r.status==='TAKE_PROFIT'&&(liquidated||stopped||!takeProfit)))invalid();
      if(r.status==='CLOSED'?(liquidated||stopped||takeProfit||r.previousPrice!==r.observedPrice||r.settledAt-position.observedAt>SIM_MAX_AGE):r.settledAt!==position.observedAt)invalid();
      settlements.set(r.positionId,r);
    }else invalid();
  }
  if(ids.size!==book.sequence)invalid();
  for(const o of orders.values())if(o.status==='FILLED'&&!positions.has(o.positionId))invalid();
  for(const position of positions.values()){
    const fill=fills.get(position.positionId),settlement=settlements.get(position.positionId);
    if(!fill||(position.status==='OPEN'?settlement!==undefined:!settlement)||Number(position.orderId.slice(6))>=Number(position.positionId.slice(6))||Number(position.positionId.slice(6))>=Number(fill.receiptId.slice(6))||(settlement&&Number(fill.receiptId.slice(6))>=Number(settlement.receiptId.slice(6))))invalid();
  }
  return value;
}

/**
 * Pure BEFORE/AFTER credit check for the existing LOCAL Courier reducer rules.
 * A matching receipt alone is not payment evidence: its exact progress delta
 * must be present in the same candidate. This neither issues a credit nor
 * proves the Courier mission; the caller still validates that canonical link.
 * By default revision is unchanged. A guarded adapter may explicitly supply
 * its exact next revision; this never supplies a monotonic-write guard itself.
 */
export function validateLocalCourierCreditTransition(before,after,{binding,expectedRevision}={}){
  const invalid=()=>{throw new Error('INVALID_LOCAL_COURIER_CREDIT_TRANSITION')};
  const bindingFields=['receiptId','missionId','playerId','owner','rewardKaios','purpose'];
  if(binding===null||typeof binding!=='object'||Array.isArray(binding)||(Object.getPrototypeOf(binding)!==Object.prototype&&Object.getPrototypeOf(binding)!==null))invalid();
  const descriptors=Object.getOwnPropertyDescriptors(binding),names=Reflect.ownKeys(descriptors);
  if(names.length!==bindingFields.length||!bindingFields.every(k=>Object.hasOwn(descriptors,k)&&descriptors[k].enumerable&&Object.hasOwn(descriptors[k],'value')))invalid();
  // Read only data descriptors so untrusted binding getters are never invoked.
  const b=Object.fromEntries(bindingFields.map(k=>[k,descriptors[k].value]));
  const insurance=b.purpose==='PLAYER_COURIER_INSURANCE_PAYOUT';
  if(!insurance&&b.purpose!=='PLAYER_COURIER_REWARD')invalid();
  const namespace={playerId:b.playerId,owner:b.owner};
  validateLocalSimulationProductRecord(before,namespace);
  validateLocalSimulationProductRecord(after,namespace);
  const revision=expectedRevision===undefined?before.revision:expectedRevision;
  if(!Number.isSafeInteger(revision)||(revision!==before.revision&&revision!==before.revision+1)||after.revision!==revision)invalid();
  const same=(a,z)=>{
    if(Object.is(a,z))return true;
    if(a===null||z===null||typeof a!=='object'||typeof z!=='object'||Array.isArray(a)!==Array.isArray(z))return false;
    const aKeys=Object.keys(a),zKeys=Object.keys(z);
    return aKeys.length===zKeys.length&&aKeys.every(k=>Object.hasOwn(z,k)&&same(a[k],z[k]));
  };
  const p=before.progress,field=insurance?'courierInsuranceBindings':'courierReceiptBindings',index=insurance?'courierInsuranceReceipts':'courierReceipts',id=b.receiptId;
  if(typeof id!=='string'||!(insurance?/^COURIER-INSURANCE-[0-9a-f]{8}$/:/^COURIER-RECEIPT-[0-9a-f]{8}$/).test(id)||typeof b.missionId!=='string'||!b.missionId||b.missionId.length>160||b.missionId!==b.missionId.trim()||/[<>\x00-\x1f]/.test(b.missionId)||!Number.isSafeInteger(b.rewardKaios)||b.rewardKaios<0||b.rewardKaios>(insurance?1080000:1000))invalid();
  if(Object.hasOwn(p[field],id)){
    // Exact already-bound credits are confirm-only. Preserve all existing
    // binding extensions and reject every other delta, including double pay.
    if(!bindingFields.every(k=>p[field][id][k]===b[k])||!same(after,{...before,revision}))invalid();
    return after;
  }
  if(insurance?Object.hasOwn(p[index],id):p[index].includes(id))invalid();
  const event=insurance?'COURIER_INSURANCE_PAYOUT':'COURIER_SETTLEMENT';
  const expected={...before,revision,progress:{...p,
    kaios:p.kaios+b.rewardKaios,
    claimableKaios:b.owner==='guest'?p.claimableKaios:p.claimableKaios+b.rewardKaios,
    xp:insurance?p.xp:p.xp+12,
    events:{...p.events,[event]:(Object.hasOwn(p.events,event)?p.events[event]:0)+1},
    [index]:insurance?{...p[index],[id]:b.rewardKaios}:[...p[index],id],
    [field]:{...p[field],[id]:b}
  }};
  if(!same(after,expected))invalid();
  return after;
}
