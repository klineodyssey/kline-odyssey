export const WALK_SPEED = 0.07;
export const TURN_SPEED = 0.075;
export const DESTINATIONS = Object.freeze({
  main:{name:'花果山主城',x:0,z:0}, fire:{name:'火焰山',x:24,z:-20}, spider:{name:'盤絲洞',x:-18,z:-24}, ape:{name:'木猿谷',x:-28,z:18}, atm:{name:'ATM 飛碟站',x:8,z:5}, shop:{name:'花果山市集',x:13,z:-10}
});
export function warpMultiplier(c){c=Math.max(0,Math.min(1000,Number(c)||0));return 1+c/125}
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
export function previewOrder({axis,symbol,fire,leverage,price,kgen,hasPosition}){if(!fire)return{ok:false,reason:'ZERO_FIRE'};if(!price)return{ok:false,reason:'NO_PRICE'};if(hasPosition)return{ok:false,reason:'POSITION_EXISTS'};const lots=Math.abs(fire),side=fire>0?'多':'空',L=Math.max(1,leverage||1),im=lots/L,mm=im*.75;if(kgen<im)return{ok:false,reason:'INSUFFICIENT_KGEN',im};return{ok:true,order:{axis,symbol,side,lots,L,price,im,mm}}}
export function executeOrder(state,order){if(!order)return{ok:false,reason:'NO_ORDER'};if(state.kgen<order.im)return{ok:false,reason:'INSUFFICIENT_KGEN'};state.kgen-=order.im;state.pos[order.axis]={side:order.side,lots:order.lots,leverage:order.L,entry:order.price,symbol:order.symbol,margin:order.im,maintenance:order.mm};state.history.unshift({time:new Date().toLocaleTimeString(),axis:order.axis,symbol:order.symbol,event:`${order.side}開倉`,pnl:0});return{ok:true}}
export function positionPnl(position,quote,point=1){if(!position)return 0;return((quote??position.entry)-position.entry)*(position.side==='多'?1:-1)*position.lots*point}
export function closePosition(state,axis,quote){const p=state.pos[axis];if(!p)return{ok:false,reason:'NO_POSITION'};const pnl=positionPnl(p,quote),refund=Math.max(0,p.margin+pnl);state.kgen+=refund;state.history.unshift({time:new Date().toLocaleTimeString(),axis,symbol:p.symbol,event:'平倉',pnl});state.pos[axis]=null;return{ok:true,pnl,refund}}
export function tradeStats(history){const closed=history.filter(h=>h.event==='平倉'),wins=closed.filter(h=>Number(h.pnl)>0).length,pnl=closed.reduce((s,h)=>s+Number(h.pnl||0),0);return{closed:closed.length,wins,winRate:closed.length?wins/closed.length:0,realizedPnl:pnl,best:closed.length?Math.max(...closed.map(h=>Number(h.pnl||0))):0,worst:closed.length?Math.min(...closed.map(h=>Number(h.pnl||0))):0}}
