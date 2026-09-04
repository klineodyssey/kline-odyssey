/*
KGEN_META
VERSION: 1.1.0
REVISION: 2026-09-04.LIVING-WORLD-SOURCE
STATUS: ACTIVE
SOURCE_OF_TRUTH: HUAGUOSHAN_TAIWAN_EXCHANGE_WHITEPAPER.md / MARKET_LIFE_AI_SPEC.md / LIVING_WORLD_ECOSYSTEM_SPEC.md
PURPOSE: Standard ingress for Exchange Brain / Digital Ant Market Life plus baseline wild ecology.
*/

export const MARKET_LIFE_SOURCE_VERSION='11520-MARKET-LIFE-SOURCE-V1';
export const SOURCE_EVENT=Object.freeze({SPAWN:'SPAWN',UPDATE:'UPDATE',DESPAWN:'DESPAWN'});
const CHANNEL='kline-odyssey-11520-market-life-source-v1';
const STORAGE='11520.marketLifeSource.queue.v1';
const memoryQueue=[];

function finite(n,fallback=0){n=Number(n);return Number.isFinite(n)?n:fallback}
function side(v){v=Number(v);return v>0?1:v<0?-1:0}
function positions(input={}){const out={};for(const axis of ['KX','KY','KZ']){const p=input?.[axis];if(!p)continue;const s=side(p.side);if(!s)continue;out[axis]={market:String(p.market||''),side:s,lots:Math.max(0,finite(p.lots,0)),c:Math.max(0,finite(p.c,0)),pnl:finite(p.pnl,0)}}return out}

export function normalizeMarketLifeSourceEvent(raw={}){
  const type=String(raw.type||'').toUpperCase();if(!Object.values(SOURCE_EVENT).includes(type))throw new Error('INVALID_SOURCE_EVENT_TYPE');
  const sourceId=String(raw.sourceId||'').trim(),lifeId=String(raw.lifeId||'').trim();if(!sourceId)throw new Error('SOURCE_ID_REQUIRED');if(!lifeId)throw new Error('LIFE_ID_REQUIRED');
  if(type===SOURCE_EVENT.DESPAWN)return{version:MARKET_LIFE_SOURCE_VERSION,type,sourceId,lifeId,reason:String(raw.reason||'SOURCE_DESPAWN'),at:finite(raw.at,Date.now())};
  const markets=[...new Set((raw.markets||[]).map(String).filter(Boolean))],p=positions(raw.positions||{});for(const x of Object.values(p))if(x.market&&!markets.includes(x.market))markets.push(x.market);
  return{version:MARKET_LIFE_SOURCE_VERSION,type,sourceId,lifeId,name:String(raw.name||'Market Life'),species:String(raw.species||'MARKET_LIFE'),intelligence:Math.max(1,Math.round(finite(raw.intelligence,1))),markets,capital:Math.max(0,finite(raw.capital,0)),vitality:Math.max(0,Math.min(100,finite(raw.vitality,100))),maxHp:Math.max(1,finite(raw.maxHp,100)),attack:Math.max(0,finite(raw.attack,0)),speed:Math.max(0,finite(raw.speed,.018)),rewardKaios:Math.max(0,finite(raw.rewardKaios,0)),positions:p,x:finite(raw.x,0),y:finite(raw.y,0),z:finite(raw.z,0),strategy:String(raw.strategy||'SOURCE_DRIVEN'),mission:raw.mission?structuredClone(raw.mission):null,cargo:raw.cargo?structuredClone(raw.cargo):null,route:raw.route?structuredClone(raw.route):null,meta:raw.meta?structuredClone(raw.meta):{},at:finite(raw.at,Date.now())};
}

function persist(event){if(typeof localStorage==='undefined')return;try{const q=JSON.parse(localStorage.getItem(STORAGE)||'[]');q.push(event);localStorage.setItem(STORAGE,JSON.stringify(q.slice(-256)))}catch{}}
export function publishMarketLifeSourceEvent(raw,{persistLocal=true,broadcast=true}={}){const event=normalizeMarketLifeSourceEvent(raw);memoryQueue.push(event);if(persistLocal)persist(event);if(broadcast&&typeof BroadcastChannel!=='undefined'){try{const c=new BroadcastChannel(CHANNEL);c.postMessage(event);c.close()}catch{}}if(typeof window!=='undefined'){try{window.dispatchEvent(new CustomEvent('11520:market-life-source',{detail:event}))}catch{}}return event}

const WILD=[
 ['FISH','花果山魚',-12,-8,30],['FISH','花果山魚',-9,-11,30],['SHRIMP','花果山蝦',-15,-10,18],['SHRIMP','花果山蝦',-11,-13,18],
 ['COW','花果山牛',16,12,120],['COW','花果山牛',20,9,120],['SHEEP','花果山羊',12,16,75],['SHEEP','花果山羊',18,17,75],
 ['TREE','花果山樹',-18,16,160],['TREE','花果山樹',-22,12,160],['TREE','花果山樹',22,-14,160],['FLOWER','花果山花',-6,18,20],['FLOWER','花果山花',7,18,20],['FLOWER','花果山花',18,-6,20]
];
function seedWildEcology(){
  if(typeof sessionStorage==='undefined')return;const key='11520.wildEcology.seed.v1';if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');
  WILD.forEach((w,i)=>memoryQueue.push(normalizeMarketLifeSourceEvent({type:'SPAWN',sourceId:'WILD-ECOLOGY-11520',lifeId:`LIFE-WILD-11520-${w[0]}-${String(i+1).padStart(3,'0')}`,name:`${w[1]} ${i+1}`,species:w[0],intelligence:w[0]==='TREE'||w[0]==='FLOWER'?1:2,markets:[],capital:0,vitality:100,maxHp:w[4],attack:0,speed:w[0]==='TREE'||w[0]==='FLOWER'?0:.008,x:w[2],y:0,z:w[3],strategy:'WILD_ECOLOGY',meta:{sourceClass:'WILD_ECOLOGY',collectable:true,playerOwnable:true}})));
}

let listenersInstalled=false;
export function installMarketLifeSourceListeners(){
  if(listenersInstalled||typeof window==='undefined')return;listenersInstalled=true;seedWildEcology();
  window.addEventListener('11520:market-life-source',e=>{if(e?.detail)try{memoryQueue.push(normalizeMarketLifeSourceEvent(e.detail))}catch{}});
  if(typeof BroadcastChannel!=='undefined'){try{const c=new BroadcastChannel(CHANNEL);c.onmessage=e=>{if(e?.data)try{memoryQueue.push(normalizeMarketLifeSourceEvent(e.data))}catch{}};globalThis.__K11520_MARKET_LIFE_CHANNEL__=c}catch{}}
}

export function drainMarketLifeSourceEvents({includePersisted=true,max=256}={}){installMarketLifeSourceListeners();const out=[];if(includePersisted&&typeof localStorage!=='undefined')try{const q=JSON.parse(localStorage.getItem(STORAGE)||'[]');localStorage.removeItem(STORAGE);for(const x of q)try{out.push(normalizeMarketLifeSourceEvent(x))}catch{}}catch{}while(memoryQueue.length&&out.length<max)out.push(memoryQueue.shift());const seen=new Set();return out.filter(e=>{const k=`${e.type}|${e.sourceId}|${e.lifeId}|${e.at}`;if(seen.has(k))return false;seen.add(k);return true})}

export function sourceContractExample(){return{version:MARKET_LIFE_SOURCE_VERSION,type:'SPAWN',sourceId:'DIGITAL-ANT-BRAIN-001',lifeId:'LIFE-DIGITAL-ANT-001',name:'Digital Ant 001',species:'DIGITAL_ANT',intelligence:3,markets:['BTCUSDT'],capital:20,vitality:100,positions:{KY:{market:'BTCUSDT',side:1,lots:2,c:.001}},x:-18,y:0,z:6,mission:{type:'LOGISTICS',cargo:'BTC',destination:'ATM-11520-001'},strategy:'DELIVERY'}}
