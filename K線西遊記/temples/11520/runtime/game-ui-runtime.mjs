import './wallet-game-bridge.mjs';
import {clampPositionPnl,pnlForMove,requiredMargin} from './kgen-margin-runtime.mjs';
import {normalizeSignedC,signedPositionSide,signedCFromLegacyMagnitude} from './kgen-margin-runtime.mjs';

export const WALK_SPEED = 0.07;
export const TURN_SPEED = 0.075;
export const DESTINATIONS = Object.freeze({
  main:{name:'花果山主城',x:0,z:0}, fire:{name:'火焰山',x:24,z:-20}, spider:{name:'盤絲洞',x:-18,z:-24}, ape:{name:'木猿谷',x:-28,z:18}, atm:{name:'ATM 飛碟站',x:8,z:5}, shop:{name:'花果山市集',x:13,z:-10}
});
export function warpMultiplier(c){c=Math.max(0,Math.min(100,Number(c)||0));return 1+c/125}
export function movementStep({forward=0,turn=0,heading=0,warp=0}){
  const nextHeading=heading+Math.max(-1,Math.min(1,turn))*TURN_SPEED;
  const distance=Math.max(-1,Math.min(1,forward))*WALK_SPEED*warpMultiplier(warp);
  return {heading:nextHeading,dx:Math.sin(nextHeading)*distance,dz:Math.cos(nextHeading)*distance,distance:Math.abs(distance)};
}
export function defaultInventory(){return [
  {id:'SWORD-001',icon:'⚔',name:'花果山劍',qty:1,type:'EQUIPMENT'},
  {id:'FRUIT-001',icon:'🍎',name:'仙果',qty:8,type:'CONSUMABLE',heal:10},
  {id:'POTION-001',icon:'🧪',name:'生命藥水',qty:3,type:'CONSUMABLE',heal:35},
  {id:'ORE-001',icon:'🪨',name:'礦石',qty:12,type:'MATERIAL'},
  {id:'HERB-001',icon:'🌿',name:'藥草',qty:16,type:'MATERIAL'},
  {id:'QUEST-001',icon:'📜',name:'任務卷軸',qty:2,type:'QUEST'},
  {id:'KEY-001',icon:'🔑',name:'民宅鑰匙',qty:1,type:'KEY'},
  {id:'COMPASS-001',icon:'🧭',name:'導航羅盤',qty:1,type:'TOOL'},
  {id:'ARMOR-001',icon:'🛡',name:'護甲',qty:1,type:'EQUIPMENT'},
  {id:'CRYSTAL-001',icon:'💎',name:'晶石',qty:5,type:'MATERIAL'}
]}
export function useInventoryItem(inventory,itemId,hp){const item=inventory.find(i=>i.id===itemId);if(!item)return{ok:false,reason:'NOT_FOUND',hp};if(item.type!=='CONSUMABLE')return{ok:false,reason:'NOT_CONSUMABLE',hp};if(item.qty<=0)return{ok:false,reason:'EMPTY',hp};if(hp>=100)return{ok:false,reason:'HP_FULL',hp};item.qty-=1;return{ok:true,hp:Math.min(100,hp+(item.heal||0)),item}}
export function exchangeLocal(state,kgen=1,rate=10){if(state.kgen<kgen)return{ok:false,reason:'INSUFFICIENT_KGEN'};state.kgen-=kgen;state.kaios+=kgen*rate;return{ok:true}}
export function previewOrder({axis,symbol,fire,leverage,price,kgen,hasPosition}){const lots=Number(fire),c=Number(leverage);if(!Number.isInteger(lots)||lots<1||lots>100)return{ok:false,reason:'BAD_LOTS'};try{normalizeSignedC(c)}catch{return{ok:false,reason:'BAD_C'}}if(!Number.isFinite(Number(price))||Number(price)<=0)return{ok:false,reason:'NO_PRICE'};if(hasPosition)return{ok:false,reason:'POSITION_EXISTS'};const side=c>0?'多':'空',im=requiredMargin({lots}),mm=im*.75;if(!Number.isFinite(Number(kgen))||Number(kgen)<im)return{ok:false,reason:'INSUFFICIENT_KGEN',im};return{ok:true,order:{axis,symbol,side,lots,c,L:Math.abs(c),price:Number(price),im,mm}}}
export function executeOrder(state,order){
  if(!order)return{ok:false,reason:'NO_ORDER'};
  // Revalidate at execution; callers must not bypass preview with forged orders.
  let c,margin;try{c=normalizeSignedC(order.c);signedPositionSide(c,order.side);margin=requiredMargin({lots:order.lots})}catch(e){return{ok:false,reason:e.message}}
  if(!Object.hasOwn(state.pos,order.axis))return{ok:false,reason:'BAD_AXIS'};
  if(state.pos[order.axis])return{ok:false,reason:'POSITION_EXISTS'};
  if(!Number.isFinite(Number(order.price))||Number(order.price)<=0)return{ok:false,reason:'NO_PRICE'};
  if(order.im!==margin)return{ok:false,reason:'MARGIN_MISMATCH'};
  if(state.kgen<margin)return{ok:false,reason:'INSUFFICIENT_KGEN'};
  const side=c>0?'多':'空';state.kgen-=margin;state.pos[order.axis]={side,lots:order.lots,c,signedC:c,leverage:Math.abs(c),entry:Number(order.price),symbol:order.symbol,margin,maintenance:margin*.75};state.history.unshift({time:new Date().toLocaleTimeString(),axis:order.axis,symbol:order.symbol,event:`${side}開倉`,pnl:0});return{ok:true}
}
export function positionPnl(position,quote){if(!position)return 0;const legacyC=position.c??position.leverage,c=position.signedC??(Number(legacyC)<0?normalizeSignedC(legacyC):signedCFromLegacyMagnitude(legacyC,position.side));return pnlForMove({entry:position.entry,mark:quote??position.entry,side:position.side,lots:position.lots,c})}
export function closePosition(state,axis,quote){const p=state.pos[axis];if(!p)return{ok:false,reason:'NO_POSITION'};const pnl=clampPositionPnl({principal:p.margin,pnl:positionPnl(p,quote)}),refund=Math.max(0,p.margin+pnl);state.kgen+=refund;state.history.unshift({time:new Date().toLocaleTimeString(),axis,symbol:p.symbol,event:'平倉',pnl});state.pos[axis]=null;return{ok:true,pnl,refund}}
export function tradeStats(history){const closed=history.filter(h=>h.event==='平倉'),wins=closed.filter(h=>Number(h.pnl)>0).length,pnl=closed.reduce((s,h)=>s+Number(h.pnl||0),0);return{closed:closed.length,wins,winRate:closed.length?wins/closed.length:0,realizedPnl:pnl,best:closed.length?Math.max(...closed.map(h=>Number(h.pnl||0))):0,worst:closed.length?Math.min(...closed.map(h=>Number(h.pnl||0))):0}}
