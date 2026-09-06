/* KGEN_META
VERSION: 2.5.6
STATUS: ACTIVE
PURPOSE: Runtime visual repair for the human-tested 11520 mobile layout. Keeps canonical control behavior while fixing missing XZ art, compacting the wallet valve, separating Y from combat, sizing control imagery, synchronizing version labels, and retiring the known lookPad interceptor. No trade, wallet, chain, settlement, payment, treasury, or governance behavior changes.
*/
const $=s=>document.querySelector(s);

const ASSET={xz:'./assets/ui/brand-k-ui.webp',y:'./assets/ui/goddess-ui.webp',lots:'./assets/ui/kgen-user-ui.webp',warp:'./assets/ui/ufo-ui.png'};
const REQUIRED_CONTROLS=Object.freeze([['XZ','#knob',ASSET.xz],['Y','#yJoyV250 .yKnob',ASSET.y],['LOTS','#lotsThumb',ASSET.lots],['WARP','#cThumb',ASSET.warp]]);

function ensureStyle(){
  if($('#k11520ControlsV256Style'))return;
  for(const id of ['k11520ControlsV251Style','k11520ControlsV252Style','k11520ControlsV253Style','k11520ControlsV254Style','k11520ControlsV255Style'])$('#'+id)?.remove();
  const s=document.createElement('style');s.id='k11520ControlsV256Style';s.textContent=`
  #joy #knob{overflow:hidden!important;padding:0!important;background:#071018!important;border:2px solid #68e4ff!important;box-shadow:0 5px 18px #000a,0 0 14px #68e4ff55!important;touch-action:none!important}
  #joy #knob .v256ControlImg{width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;border-radius:50%!important;pointer-events:none!important;user-select:none!important}
  #yJoyV250{pointer-events:none!important}
  #yJoyV250 .yPlane,#yJoyV250 .yGuide,#yJoyV250 .yTitle,#yJoyV250 .yPlus,#yJoyV250 .yMinus,#yJoyV250 .yReadout{pointer-events:none!important}
  #yJoyV250 .yKnob{overflow:hidden!important;padding:0!important;background:#071018!important;width:44px!important;height:44px!important;margin:-22px 0 0 -22px!important;border:2px solid #f1ca73!important;box-shadow:0 5px 16px #000a!important;pointer-events:auto!important;touch-action:none!important}
  #yJoyV250 .yKnob .v256ControlImg{width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;object-position:center!important;border-radius:50%!important;pointer-events:none!important;user-select:none!important}
  #yControl{display:block!important;position:fixed!important;left:-200px!important;top:0!important;width:42px!important;height:112px!important;opacity:0!important;pointer-events:none!important;z-index:-1!important}
  #cControl .thumb,#lotsControl .thumb{width:36px!important;height:36px!important;border-radius:50%!important;overflow:hidden!important;padding:0!important;background:#071018!important;box-shadow:0 4px 14px #000b!important;z-index:3!important;touch-action:none!important}
  #cControl .thumb .v256ControlImg,#lotsControl .thumb .v256ControlImg{width:100%!important;height:100%!important;display:block!important;object-fit:contain!important;border-radius:50%!important;pointer-events:none!important;user-select:none!important}
  #cControl .track,#lotsControl .track{left:50%!important;right:auto!important;width:9px!important;transform:translateX(-50%)!important;background:repeating-linear-gradient(to top,#2b4c58 0 2px,#071018 2px 12px)!important}
  #cControl,#lotsControl{overflow:visible!important}#cControl label,#lotsControl label{font-weight:900!important;color:#f1ca73!important}#cControl .read,#lotsControl .read{font-weight:900!important;color:#eafcff!important}
  #aiChatPanel{z-index:4200!important}#sheet{z-index:4100!important}#confirm{z-index:4300!important}
  #lookPad{display:none!important;pointer-events:none!important}
  @media(max-width:420px){
    #joy{left:14px!important;width:146px!important;height:146px!important}
    #yJoyV250{right:50px!important;bottom:max(12px,env(safe-area-inset-bottom))!important;width:58px!important;height:128px!important;z-index:452!important}
    .sliderDock{right:130px!important;bottom:190px!important;gap:6px!important;transform:none!important;z-index:455!important}.sliderDock .v{width:42px!important;height:118px!important}
    .controls{right:114px!important;bottom:10px!important;width:110px!important;height:158px!important;transform:none!important}
    .attack{width:50px!important;height:50px!important;right:0!important;bottom:0!important}.skill{width:38px!important;height:38px!important;right:54px!important;bottom:5px!important}.dodge{width:38px!important;height:38px!important;right:94px!important;bottom:7px!important}.flat{width:38px!important;height:38px!important;right:58px!important;bottom:58px!important}.order{width:52px!important;height:52px!important;right:0!important;bottom:64px!important}.tool{right:54px!important;bottom:106px!important;width:40px!important;height:40px!important}
    .bagRelocatedV250{right:5px!important;bottom:84px!important;width:42px!important;height:42px!important}#aiChatButton{right:5px!important;bottom:138px!important;width:42px!important;height:42px!important}#bgmButton{right:5px!important;bottom:186px!important;width:42px!important;height:42px!important}
    .dock,.dock.open{right:5px!important;bottom:max(10px,env(safe-area-inset-bottom))!important;z-index:3000!important}.dock.open .rail{right:0!important;bottom:64px!important;z-index:3001!important;max-height:calc(100vh - 82px)!important}
    #walletPanel.collapsed{width:46px!important;height:46px!important;max-width:46px!important;min-width:46px!important;right:66px!important;left:auto!important;bottom:238px!important;padding:4px!important;overflow:hidden!important}
  }`;
  document.head.appendChild(s);
}

function putImage(host,src,alt){if(!host)return false;host.querySelectorAll('img.v252ControlImg,img.v255ControlImg,img.v256ControlImg').forEach((img,i)=>{if(i)img.remove()});let img=host.querySelector('img.v256ControlImg')||host.querySelector('img.v255ControlImg')||host.querySelector('img.v252ControlImg');if(!img){host.textContent='';img=document.createElement('img');host.appendChild(img)}img.className='v256ControlImg';if(img.getAttribute('src')!==src)img.src=src;img.alt=alt;img.draggable=false;return true}
function installImages(){let ok=true;for(const [name,selector,src] of REQUIRED_CONTROLS)ok=putImage($(selector),src,`${name} control`)&&ok;return ok}
function retireKnownBlocker(){const look=$('#lookPad');if(look){look.style.display='none';look.style.pointerEvents='none';look.dataset.v256Retired='1'}}
function syncVersionLabel(){const meta=document.querySelector('.brandMetaV250 span:first-child');if(meta)meta.textContent='V2.5.6 · 5D K線西遊記'}
function normalizeWallet(){
  const p=$('#walletPanel');if(!p)return false;
  if(p.classList.contains('collapsed')){
    for(const [k,v] of [['width','46px'],['height','46px'],['min-width','46px'],['max-width','46px'],['right','66px'],['left','auto'],['bottom','238px'],['padding','4px'],['overflow','hidden']])p.style.setProperty(k,v,'important');
  }else{
    for(const k of ['width','height','min-width','max-width','right','left','bottom','padding','overflow'])p.style.removeProperty(k);
  }
  return true;
}
function controlHealth(){const report={version:'2.5.6',ok:true,controls:{},knownBlockers:{lookPad:'ABSENT'},bridges:{yControl:'UNKNOWN'},wallet:'UNKNOWN'};for(const [name,selector,src] of REQUIRED_CONTROLS){const host=$(selector),img=host?.querySelector('img.v256ControlImg'),rect=host?.getBoundingClientRect?.();const visible=!!host&&!!rect&&rect.width>0&&rect.height>0&&getComputedStyle(host).display!=='none';const hasImage=!!img&&!!img.src;report.controls[name]={present:!!host,visible,hasImage,src:img?.getAttribute('src')||src};if(!host||!visible||!hasImage)report.ok=false}const yBridge=$('#yControl'),yr=yBridge?.getBoundingClientRect?.();report.bridges.yControl=(yBridge&&yr?.width>0&&yr?.height>0)?'READY':'ZERO_RECT';if(report.bridges.yControl!=='READY')report.ok=false;const look=$('#lookPad');if(look){const cs=getComputedStyle(look);report.knownBlockers.lookPad=(cs.display==='none'||cs.pointerEvents==='none')?'RETIRED':'ACTIVE';if(report.knownBlockers.lookPad==='ACTIVE')report.ok=false}const wp=$('#walletPanel'),wr=wp?.getBoundingClientRect?.();report.wallet=wp?.classList.contains('collapsed')?(wr&&wr.width<=50?'COMPACT':'BAD_COLLAPSED_WIDTH'):'EXPANDED';if(report.wallet==='BAD_COLLAPSED_WIDTH')report.ok=false;document.documentElement.dataset.v256ControlHealth=report.ok?'PASS':'RED';globalThis.__K11520_CONTROL_HEALTH__=report;return report}

export function install11520ControlsV251(){ensureStyle();retireKnownBlocker();syncVersionLabel();normalizeWallet();let tries=0,lastAllReady=false;const tick=()=>{tries++;ensureStyle();retireKnownBlocker();syncVersionLabel();normalizeWallet();lastAllReady=installImages();controlHealth();if(!lastAllReady&&tries<40)setTimeout(tick,150)};tick();const observer=new MutationObserver(()=>{retireKnownBlocker();syncVersionLabel();normalizeWallet();const ready=installImages();controlHealth();if(ready&&lastAllReady)queueMicrotask(()=>observer.disconnect());lastAllReady=ready});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});setTimeout(()=>{try{observer.disconnect()}catch{}retireKnownBlocker();syncVersionLabel();normalizeWallet();controlHealth()},9000);return controlHealth()}
export {controlHealth as get11520ControlHealth};
