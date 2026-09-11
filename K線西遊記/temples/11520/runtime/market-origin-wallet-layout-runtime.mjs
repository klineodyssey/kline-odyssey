/* KGEN_META
VERSION: 1.4.0
STATUS: ACTIVE
FORMAL_ORGAN_NAME: 11520 Market/XYZ Separation + Stable Wallet Layout Runtime
PURPOSE: Keep KX/KY/KZ market axes separate from autonomous player XYZ space while preserving the stable wallet toggle, mobile action-rail clearance, and top-layer layout behavior introduced by the prior compatibility organ. The historical filename is retained to avoid creating a duplicate runtime organ.
*/
const $=s=>document.querySelector(s);
const LEGACY_MARKET_ORIGIN_KEY='k11520.marketOrigin.v1';
let walletInitial=null;

function installStyle(){let s=$('#k11520StableWalletRailStyle');if(!s){s=document.createElement('style');s.id='k11520StableWalletRailStyle';document.head.appendChild(s)}s.textContent=`
#walletToggle{position:fixed!important;right:72px!important;top:398px!important;bottom:auto!important;left:auto!important;transform:none!important;z-index:9900!important;width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;margin:0!important}
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
function layoutReport(){const rail=rect($('#yControl')),dock=rect($('#dock')),wallet=walletAnchor();const overlap=overlapRect(rail,dock);if(!walletInitial&&wallet)walletInitial={...wallet};const walletStable=!!walletInitial&&!!wallet&&Math.abs(walletInitial.x-wallet.x)<1&&Math.abs(walletInitial.y-wallet.y)<1;const out={version:'1.4.0',rail,dock,overlap,walletAnchor:wallet,walletInitial,walletStable,walletViewportPinned:$('#walletToggle')?.parentElement===document.body};const status=!overlap&&walletStable&&out.walletViewportPinned?'PASS':'RED';document.documentElement.dataset.k11520MarketOriginLayout=status;document.documentElement.dataset.k11520WalletLayout=status;globalThis.__K11520_MARKET_ORIGIN_LAYOUT__=out;globalThis.__K11520_WALLET_ANCHOR__={initial:walletInitial,current:wallet,stable:walletStable,viewportPinned:out.walletViewportPinned};return out}
function clearLegacyMarketProjection(){for(const el of [$('#xyz'),$('#yRead')]){if(!el)continue;delete el.dataset.k11520GlobalText;if(el.getAttribute('aria-label')?.includes(' · '))el.removeAttribute('aria-label')}try{sessionStorage.removeItem(LEGACY_MARKET_ORIGIN_KEY)}catch{}delete globalThis.__K11520_MARKET_ORIGIN__;delete globalThis.__K11520_GLOBAL_WORLD_COORDS__}
function tick(){installStyle();pinWalletToggle();clearLegacyMarketProjection();const layout=layoutReport();globalThis.__K11520_MARKET_ORIGIN_RUNTIME__={version:'1.4.0',origin:null,global:null,layout,coordinateAuthority:'AUTONOMOUS_PLAYER_XYZ',marketAxes:'KX_KY_KZ_SEPARATE',marketAxesSeparate:true,visibleAuthority:'CANONICAL_XYZ_RUNTIME'};return globalThis.__K11520_MARKET_ORIGIN_RUNTIME__}
export function install11520MarketOriginWalletLayout(){if(typeof document==='undefined')return null;installStyle();pinWalletToggle();const timer=setInterval(tick,60);globalThis.__K11520_MARKET_ORIGIN_TIMER__&&clearInterval(globalThis.__K11520_MARKET_ORIGIN_TIMER__);globalThis.__K11520_MARKET_ORIGIN_TIMER__=timer;const mo=new MutationObserver(()=>queueMicrotask(()=>{pinWalletToggle();layoutReport()}));mo.observe(document.body,{childList:true,subtree:true});globalThis.__K11520_WALLET_PIN_OBSERVER__?.disconnect?.();globalThis.__K11520_WALLET_PIN_OBSERVER__=mo;addEventListener('resize',tick,{passive:true});for(const t of [0,120,300,700,1400])setTimeout(tick,t);return tick()}
if(typeof document!=='undefined')install11520MarketOriginWalletLayout();
