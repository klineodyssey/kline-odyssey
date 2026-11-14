/**
 * KAIOS Meeting Market V1 — isolated off-chain gameplay candidate.
 * Source of point identity: docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json.
 * No signer, escrow, blockchain, or real-world GPS capability is implemented here.
 */
const K_INDEX_KM = 384400 / 16888;
const C_SPEED_K_PER_SECOND = 0.001;
const TOKEN_DECIMALS = 18;
const SETTLEMENT_STATUS = 'NO_ONCHAIN_SETTLEMENT';

export function parseAtomic(input) {
  const value=String(input ?? '').trim();
  if(!/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(value)) throw new Error('PRICE_FORMAT_INVALID');
  const [whole,fraction='']=value.split('.');
  return BigInt(whole)*10n**18n + BigInt(fraction.padEnd(18,'0')||'0');
}
export function displayAtomic(value) {
  const v=BigInt(value);
  const neg=v<0n?'-':'';
  const abs=v<0n?-v:v;
  const tail=(abs%10n**18n).toString().padStart(18,'0').replace(/0+$/,'');
  return neg+(abs/10n**18n).toString()+(tail?'.'+tail:'');
}
export function loadPoints(map) {
  if(!map || !Array.isArray(map.point_index_sorted)) throw new Error('CANON_MAP_REQUIRED');
  const ids=new Set();
  const list=map.point_index_sorted.map(p=>{
    if(!p.id || typeof p.coord!=='number' || !Number.isFinite(p.coord) || !p.name) throw new Error('POINT_INVALID');
    if(ids.has(p.id)) throw new Error('POINT_ID_DUPLICATE');
    ids.add(p.id);
    return Object.freeze({id:p.id,k:p.coord,name:p.name});
  });
  return Object.freeze(list);
}
export function getPoint(points,id) {
  const point=points.find(p=>p.id===id);
  if(!point) throw new Error('POINT_NOT_FOUND');
  return point;
}
export function createRequest({orderId,buyer,buyerPointId,seller,sellerPointId,meetingPointId,asset,quantity=1,currency='KAIOS',buyerBid,sellerAsk,dealPrice=null,points}) {
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,100}$/.test(orderId||'')) throw new Error('ORDER_ID_INVALID');
  if(!buyer || !seller || buyer===seller) throw new Error('TRADING_PARTIES_DISTINCT_REQUIRED');
  if(!asset || !String(asset).trim()) throw new Error('ASSET_REQUIRED');
  if(!Number.isSafeInteger(quantity)||quantity<=0) throw new Error('QUANTITY_INVALID');
  if(!['KAIOS','KGEN'].includes(currency)) throw new Error('CURRENCY_UNSUPPORTED');
  const buyerPoint=getPoint(points,buyerPointId),sellerPoint=getPoint(points,sellerPointId),meetingPoint=getPoint(points,meetingPointId);
  const bid=parseAtomic(buyerBid),ask=parseAtomic(sellerAsk);
  if(bid<=0n||ask<=0n) throw new Error('PRICE_MUST_BE_POSITIVE');
  const deal=dealPrice===null?null:parseAtomic(dealPrice);
  if(deal!==null && (deal<ask||deal>bid)) throw new Error('DEAL_OUTSIDE_ACCEPTED_RANGE');
  const quoteStatus=deal===null?'AWAITING_DEAL_PRICE':'AWAITING_DUAL_ACCEPTANCE';
  return Object.freeze({
    orderId,buyer,seller,buyerPointId:buyerPoint.id,sellerPointId:sellerPoint.id,
    meetingPointId:meetingPoint.id,asset:String(asset).trim(),quantity,currency,
    buyerBidAtomic:bid.toString(),sellerAskAtomic:ask.toString(),dealPriceAtomic:deal?.toString()??null,
    quoteStatus,buyerAccepted:false,sellerAccepted:false,deliveryStatus:'NOT_STARTED',
    paymentStatus:SETTLEMENT_STATUS,claimable:false,receipt:null
  });
}
export function acceptPrice(order,who){
  if(order.quoteStatus==='AWAITING_DEAL_PRICE') throw new Error('DEAL_PRICE_PENDING');
  if(!['buyer','seller'].includes(who)) throw new Error('PARTY_INVALID');
  const next={...order,[who+'Accepted']:true};
  next.quoteStatus=next.buyerAccepted&&next.sellerAccepted?'AGREED_MEETING_PENDING':'AWAITING_DUAL_ACCEPTANCE';
  return Object.freeze(next);
}
export function makeTrip(points,fromId,toId,{mode,walkKmh=null,vehicleC=null}){
  const from=getPoint(points,fromId),to=getPoint(points,toId);
  if(from.id!==to.id && from.k===to.k) return Object.freeze({fromId,toId,mode,status:'LOCAL_XYZ_REQUIRED',distanceK:null,etaSeconds:null});
  const distanceK=Math.abs(to.k-from.k);
  let speedKPerSec;
  if(mode==='WALK') {
    if(!(walkKmh>0&&walkKmh<=10)) throw new Error('WALK_SPEED_REQUIRED');
    speedKPerSec=walkKmh/(K_INDEX_KM*3600);
  } else if(mode==='VEHICLE') {
    if(!(vehicleC>0&&vehicleC<=100)) throw new Error('VEHICLE_C_CAPABILITY_REQUIRED');
    speedKPerSec=vehicleC*C_SPEED_K_PER_SECOND;
  } else throw new Error('TRANSPORT_MODE_INVALID');
  return Object.freeze({fromId,toId,mode,status:distanceK===0?'ARRIVED_SIMULATED':'SIMULATED_ROUTE',distanceK,etaSeconds:distanceK/speedKPerSec,speedKPerSec,elapsedSeconds:0,progressK:0,arrivalProof:'SIMULATION_ONLY'});
}
export function advanceTrip(trip,seconds){
  if(trip.status==='LOCAL_XYZ_REQUIRED') throw new Error('LOCAL_XYZ_REQUIRED');
  if(!Number.isFinite(seconds)||seconds<=0||seconds>86400*30) throw new Error('ADVANCE_TIME_INVALID');
  if(trip.status==='ARRIVED_SIMULATED')return trip;
  const elapsed=Math.min(trip.etaSeconds,trip.elapsedSeconds+seconds);
  return Object.freeze({...trip,elapsedSeconds:elapsed,progressK:Math.min(trip.distanceK,trip.speedKPerSec*elapsed),status:elapsed>=trip.etaSeconds?'ARRIVED_SIMULATED':'SIMULATED_ROUTE'});
}
export function deliveryPreview(order,buyerTrip,sellerTrip,{goodsChecked=false,buyerDeliveryAccepted=false}={}){
  if(order.quoteStatus!=='AGREED_MEETING_PENDING') return Object.freeze({status:'DEAL_NOT_ACCEPTED',receipt:null,paymentStatus:SETTLEMENT_STATUS});
  if(!buyerTrip||!sellerTrip||buyerTrip.toId!==order.meetingPointId||sellerTrip.toId!==order.meetingPointId)return Object.freeze({status:'MEETING_ROUTE_UNBOUND',receipt:null,paymentStatus:SETTLEMENT_STATUS});
  if(buyerTrip.status!=='ARRIVED_SIMULATED'||sellerTrip.status!=='ARRIVED_SIMULATED')return Object.freeze({status:'PARTIES_NOT_AT_MEETING',receipt:null,paymentStatus:SETTLEMENT_STATUS});
  if(!goodsChecked||!buyerDeliveryAccepted)return Object.freeze({status:'DELIVERY_NOT_ACCEPTED',receipt:null,paymentStatus:SETTLEMENT_STATUS});
  return Object.freeze({status:'GAME_DELIVERY_ACCEPTED_PAYMENT_PENDING',receipt:null,paymentStatus:SETTLEMENT_STATUS,gameOnly:true});
}
