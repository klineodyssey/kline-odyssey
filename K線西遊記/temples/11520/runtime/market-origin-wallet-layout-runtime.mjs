/* KGEN_META
VERSION: 1.5.2
STATUS: ACTIVE
FORMAL_ORGAN_NAME: 11520 Market/XYZ Separation + Stable Wallet Layout Runtime
PURPOSE: Keep KX/KY/KZ market axes separate from autonomous player XYZ space, reserve a clean three-rail mobile control zone, keep the wallet toggle stable in the upper utility rail, and prevent utility buttons from overlapping one another or the three vertical rails.
*/
const $=s=>document.querySelector(s);
const LEGACY_MARKET_ORIGIN_KEY='k11520.marketOrigin.v1';
let walletInitial=null;
function installStyle(){let s=$('#k11520StableWalletRailStyle');if(!s){s=document.createElement('style');s.id='k11520StableWalletRailStyle';document.head.appendChild(s)}s.textContent=`
#walletToggle{position:fixed!important;right:8px!important;top:auto!important;bottom:326px!important;left:auto!important;transform:none!important;z-index:9900!important;width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important;margin:0!important;background-position:center!important;background-repeat:no-repeat!important;background-size:34px 34px!important}
@media(max-width:420px){
  #walletPanel{right:62px!important;left:auto!important;max-width:calc(100vw - 76px)!important}
  .joyWrap{left:-50px!important;width:136px!important;height:136px!important}
  .joyGuide{left:22px!important;top:22px!important;width:92px!important;height:92px!important}
  .knob{left:46px!important;top:46px!important;width:44px!important;height:44px!important}
  #cControl,#lotsControl,#yControl{width:48px!important;height:142px!important;bottom:14px!important;right:auto!important;z-index:456!important}
  #cControl{left:148px!important}#lotsControl{left:202px!important}#yControl{left:256px!important}
  #cControl .track,#lotsControl .track,#yControl .track{left:8px!important;right:8px!important;top:27px!important;bottom:24px!important;min-width:32px!important}
  #cControl .thumb,#lotsControl .thumb,#yControl .thumb{width:40px!important;height:18px!important}
  .controls{right:58px!important;bottom:166px!important;width:184px!important;height:44px!important;z-index:470!important}
  .controls .attack,.controls .order{bottom:218px!important;width:58px!important;height:44px!important;z-index:475!important}
  .controls .attack{right:126px!important;left:auto!important}.controls .order{right:62px!important;left:auto!important}
  #dock{right:5px!important;bottom:218px!important;z-index:500!important}
  #gameModeToggle{position:fixed!important;right:5px!important;left:auto!important;top:auto!important;bottom:278px!important}
  #walletToggle{right:5px!important;bottom:326px!important}
  #aiChatButton{right:5px!important;bottom:374px!important}
  #bgmButton{right:5px!important;bottom:422px!important}
  #chatHandle{position:fixed!important;right:5px!important;left:auto!important;top:auto!important;bottom:470px!important;width:42px!important;height:46px!important;z-index:9950!important;border-left:1px solid #68e4ff66!important;border-radius:13px!important}
  #k11520HudCollapseAll{position:fixed!important;right:5px!important;left:auto!important;top:auto!important;bottom:522px!important;width:42px!important;height:42px!important;z-index:9940!important}
}
`;return s}
function pinWalletToggle(){const b=$('#walletToggle');if(!b)return null;if(b.parentElement!==document.body)document.body.appendChild(b);for(const [k,v] of Object.entries({position:'fixed',right:'8px',top:'auto',bottom:'326px',left:'auto',transform:'none',zIndex:'9900',width:'48px',height:'48px',minWidth:'48px',minHeight:'48px',margin:'0'}))b.style.setProperty(k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),v,'important');if(!b.textContent?.trim()||b.textContent.trim()==='◀'||b.textContent.trim()==='▶')b.textContent='💰';b.dataset.k11520ViewportPinned='1';return b}
function walletAnchor(){const b=pinWalletToggle();if(!b)return null;const r=b.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}}
function overlapRect(a,b){return !!a&&!!b&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top}
function rect(el){if(!el)return null;const r=el.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
function layoutReport(){const rails=['#cControl','#lotsControl','#yControl'].map(s=>rect($(s))),dock=rect($('#dock')),wallet=walletAnchor();const utilitySelectors=['#dock','#gameModeToggle','#walletToggle','#aiChatButton','#bgmButton','#backpackButton','#chatHandle','#k11520HudCollapseAll'];const utility=utilitySelectors.map(s=>({selector:s,rect:rect($(s))}));const railOverlaps=utility.flatMap(b=>rails.map((r,i)=>({button:b.selector,rail:i,overlap:overlapRect(b.rect,r)}))).filter(x=>x.overlap);const utilityOverlaps=[];for(let i=0;i<utility.length;i++)for(let j=i+1;j<utility.length;j++)if(overlapRect(utility[i].rect,utility[j].rect))utilityOverlaps.push([utility[i].selector,utility[j].selector]);if(!walletInitial&&wallet)walletInitial={...wallet};const walletStable=!!walletInitial&&!!wallet&&Math.abs(walletInitial.x-wallet.x)<1&&Math.abs(walletInitial.y-wallet.y)<1;const railWidths=rails.filter(Boolean).map(r=>r.width);const standardRails=railWidths.length===3&&railWidths.every(w=>w>=46);const out={version:'1.5.2',rails,dock,railOverlaps,utilityOverlaps,walletAnchor:wallet,walletInitial,walletStable,walletViewportPinned:$('#walletToggle')?.parentElement===document.body,standardRails,cleanThreeRailZone:railOverlaps.length===0,cleanUtilityStack:utilityOverlaps.length===0};const status=out.cleanThreeRailZone&&out.cleanUtilityStack&&walletStable&&out.walletViewportPinned&&standardRails?'PASS':'RED';document.documentElement.dataset.k11520MarketOriginLayout=status;document.documentElement.dataset.k11520WalletLayout=status;document.documentElement.dataset.k11520ThreeRailLayout=status;globalThis.__K11520_MARKET_ORIGIN_LAYOUT__=out;globalThis.__K11520_WALLET_ANCHOR__={initial:walletInitial,current:wallet,stable:walletStable,viewportPinned:out.walletViewportPinned};return out}
function clearLegacyMarketProjection(){for(const el of [$('#xyz'),$('#yRead')]){if(!el)continue;delete el.dataset.k11520GlobalText;if(el.getAttribute('aria-label')?.includes(' · '))el.removeAttribute('aria-label')}try{sessionStorage.removeItem(LEGACY_MARKET_ORIGIN_KEY)}catch{}delete globalThis.__K11520_MARKET_ORIGIN__;delete globalThis.__K11520_GLOBAL_WORLD_COORDS__}
function tick(){installStyle();pinWalletToggle();clearLegacyMarketProjection();const layout=layoutReport();globalThis.__K11520_MARKET_ORIGIN_RUNTIME__={version:'1.5.2',origin:null,global:null,layout,coordinateAuthority:'AUTONOMOUS_PLAYER_XYZ',marketAxes:'KX_KY_KZ_SEPARATE',marketAxesSeparate:true,visibleAuthority:'CANONICAL_XYZ_RUNTIME'};return globalThis.__K11520_MARKET_ORIGIN_RUNTIME__}
export function install11520MarketOriginWalletLayout(){if(typeof document==='undefined')return null;installStyle();pinWalletToggle();const timer=setInterval(tick,60);globalThis.__K11520_MARKET_ORIGIN_TIMER__&&clearInterval(globalThis.__K11520_MARKET_ORIGIN_TIMER__);globalThis.__K11520_MARKET_ORIGIN_TIMER__=timer;const mo=new MutationObserver(()=>queueMicrotask(()=>{pinWalletToggle();layoutReport()}));mo.observe(document.body,{childList:true,subtree:true});globalThis.__K11520_WALLET_PIN_OBSERVER__?.disconnect?.();globalThis.__K11520_WALLET_PIN_OBSERVER__=mo;addEventListener('resize',tick,{passive:true});for(const t of [0,120,300,700,1400])setTimeout(tick,t);return tick()}
if(typeof document!=='undefined')install11520MarketOriginWalletLayout();
