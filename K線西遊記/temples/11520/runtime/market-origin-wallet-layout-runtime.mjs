/* KGEN_META
VERSION: 1.3.0
STATUS: ACTIVE
FORMAL_ORGAN_NAME: 11520 Market Origin + Stable Wallet Layout Runtime
PURPOSE: Use live KX/KY/KZ market quotes as the immutable global XYZ origin for the play session, add signed player displacement on top, keep the wallet toggle at one fixed viewport anchor outside the collapsible wallet panel, and keep the remaining-axis rail clear of the right utility dock. Local physics stays origin-relative for numerical stability; visible/global coordinates are market-origin based.
*/
const $=s=>document.querySelector(s);
const MARKET_ORIGIN_KEY='k11520.marketOrigin.v1';
const AXES=['KX','KY','KZ'];
const axisKey={KX:'x',KY:'y',KZ:'z'};
let walletInitial=null;

function parseNumber(text){const clean=String(text||'').replace(/,/g,'').replace(/[^0-9+\-.]/g,'');const n=Number(clean);return Number.isFinite(n)?n:null}
function marketPrice(axis){const card=document.querySelector(`[data-axis="${axis}"]`);return parseNumber(card?.querySelector('.q')?.textContent)}
function marketName(axis){return document.querySelector(`[data-axis="${axis}"] [data-market]`)?.value?.replace('/','')||null}
function readOrigin(){const values=Object.fromEntries(AXES.map(a=>[axisKey[a],marketPrice(a)]));if(!Object.values(values).every(Number.isFinite))return null;return{...values,markets:Object.fromEntries(AXES.map(a=>[a,marketName(a)])),source:'KX_KY_KZ_LIVE_MARKET',capturedAt:new Date().toISOString()}}
function installStyle(){let s=$('#k11520StableWalletRailStyle');if(!s){s=document.createElement('style');s.id='k11520StableWalletRailStyle';document.head.appendChild(s)}s.textContent=`
#walletToggle{position:fixed!important;right:72px!important;top:398px!important;bottom:auto!important;left:auto!important;transform:none!important;z-index:9900!important;width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;margin:0!important}
#xyz[data-k11520-global-text],#yRead[data-k11520-global-text]{font-size:0!important}
#xyz[data-k11520-global-text]::after,#yRead[data-k11520-global-text]::after{content:attr(data-k11520-global-text);font:700 11px/1.25 system-ui,"Noto Sans TC",sans-serif!important;color:inherit!important;white-space:nowrap}
@media(max-width:420px){
  #walletPanel{right:68px!important;left:auto!important;max-width:calc(100vw - 84px)!important}
  #cControl{left:136px!important;right:auto!important}
  #lotsControl{left:186px!important;right:auto!important}
  #yControl{left:236px!important;right:auto!important}
  .controls .attack{left:136px!important;right:auto!important}
  .controls .order{left:200px!important;right:auto!important}
}
`;return s}
function pinWalletToggle(){const b=$('#walletToggle');if(!b)return null;if(b.parentElement!==document.body)document.body.appendChild(b);for(const [k,v] of Object.entries({position:'fixed',right:'72px',top:'398px',bottom:'auto',left:'auto',transform:'none',zIndex:'9900',width:'44px',height:'44px',minWidth:'44px',minHeight:'44px',margin:'0'}))b.style.setProperty(k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),v,'important');b.dataset.k11520ViewportPinned='1';return b}
function walletAnchor(){const b=pinWalletToggle();if(!b)return null;const r=b.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}}
function overlapRect(a,b){return !!a&&!!b&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top}
function rect(el){if(!el)return null;const r=el.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
function layoutReport(){const rail=rect($('#yControl')),dock=rect($('#dock')),wallet=walletAnchor();const overlap=overlapRect(rail,dock);if(!walletInitial&&wallet)walletInitial={...wallet};const walletStable=!!walletInitial&&!!wallet&&Math.abs(walletInitial.x-wallet.x)<1&&Math.abs(walletInitial.y-wallet.y)<1;const out={version:'1.3.0',rail,dock,overlap,walletAnchor:wallet,walletInitial,walletStable,walletViewportPinned:$('#walletToggle')?.parentElement===document.body};document.documentElement.dataset.k11520MarketOriginLayout=!overlap&&walletStable&&out.walletViewportPinned?'PASS':'RED';globalThis.__K11520_MARKET_ORIGIN_LAYOUT__=out;globalThis.__K11520_WALLET_ANCHOR__={initial:walletInitial,current:wallet,stable:walletStable,viewportPinned:out.walletViewportPinned};return out}
function publishOrigin(origin){if(!origin)return false;globalThis.__K11520_MARKET_ORIGIN__={...origin,immutableBaseline:true,signedDisplacement:true};try{sessionStorage.setItem(MARKET_ORIGIN_KEY,JSON.stringify(origin))}catch{}document.dispatchEvent(new CustomEvent('k11520:market-origin-ready',{detail:origin}));return true}
function restoreOrSeed(){if(globalThis.__K11520_MARKET_ORIGIN__)return true;try{const old=JSON.parse(sessionStorage.getItem(MARKET_ORIGIN_KEY)||'null');if(old&&[old.x,old.y,old.z].every(Number.isFinite))return publishOrigin(old)}catch{}return publishOrigin(readOrigin())}
function fmt(n){return Number(n).toLocaleString(undefined,{maximumFractionDigits:2})}
function setVisibleGlobal(el,text){if(!el)return;el.dataset.k11520GlobalText=text;el.setAttribute('aria-label',text)}
function globalizeLocal(){const origin=globalThis.__K11520_MARKET_ORIGIN__,local=globalThis.__K11520_WORLD_COORDS__;if(!origin||!local?.physical)return null;const p=local.physical,i=local.intent||p;const physical={x:origin.x+(Number(p.x)||0),y:origin.y+(Number(p.y)||0),z:origin.z+(Number(p.z)||0)};const intent={x:origin.x+(Number(i.x)||0),y:origin.y+(Number(i.y)||0),z:origin.z+(Number(i.z)||0)};const globalCoords={origin:{x:origin.x,y:origin.y,z:origin.z},originMarkets:origin.markets||{},displacement:{x:Number(p.x)||0,y:Number(p.y)||0,z:Number(p.z)||0},physical,intent,mode:local.mode||'XZ',signedMirrorSpace:true,localPhysicsOriginRelative:true};globalThis.__K11520_GLOBAL_WORLD_COORDS__=globalCoords;setVisibleGlobal($('#xyz'),`X ${fmt(physical.x)} · Y ${fmt(physical.y)} · Z ${fmt(physical.z)}`);const control=globalThis.__K11520_3D_CONTROL__||globalThis.__K11520_JOYSTICK_XZXY__;const rail=(control?.railAxis||'Y').toUpperCase(),key=rail.toLowerCase();if(Number.isFinite(physical[key]))setVisibleGlobal($('#yRead'),`${rail} ${fmt(physical[key])}`);return globalCoords}
function tick(){installStyle();pinWalletToggle();restoreOrSeed();const coords=globalizeLocal(),layout=layoutReport();globalThis.__K11520_MARKET_ORIGIN_RUNTIME__={version:'1.3.0',origin:globalThis.__K11520_MARKET_ORIGIN__||null,global:coords,layout,visibleAuthority:'DATA_ATTRIBUTE_PSEUDO'};return globalThis.__K11520_MARKET_ORIGIN_RUNTIME__}
export function install11520MarketOriginWalletLayout(){if(typeof document==='undefined')return null;installStyle();pinWalletToggle();const timer=setInterval(tick,60);globalThis.__K11520_MARKET_ORIGIN_TIMER__&&clearInterval(globalThis.__K11520_MARKET_ORIGIN_TIMER__);globalThis.__K11520_MARKET_ORIGIN_TIMER__=timer;const mo=new MutationObserver(()=>queueMicrotask(()=>{pinWalletToggle();layoutReport()}));mo.observe(document.body,{childList:true,subtree:true});globalThis.__K11520_WALLET_PIN_OBSERVER__?.disconnect?.();globalThis.__K11520_WALLET_PIN_OBSERVER__=mo;addEventListener('resize',tick,{passive:true});for(const t of [0,120,300,700,1400])setTimeout(tick,t);return tick()}
if(typeof document!=='undefined')install11520MarketOriginWalletLayout();
