/* KGEN_META
VERSION: 2.5.3
STATUS: REVIEW_FIRST
PURPOSE: Human-approved 11520 mobile control imagery with stable DOM installation, explicit blocker cleanup and control-health instrumentation. No trade, wallet, chain, or settlement behavior changes.
*/
const $=s=>document.querySelector(s);

const ASSET={
  xz:'./assets/ui/brand-user-ui.webp',
  y:'../16888/assets/fairy_sprite_36.png',
  lots:'./assets/ui/kgen-user-ui.webp',
  warp:'./assets/ui/ufo-user-ui.webp',
};

const REQUIRED_CONTROLS=Object.freeze([
  ['XZ','#knob',ASSET.xz],
  ['Y','#yJoyV250 .yKnob',ASSET.y],
  ['LOTS','#lotsThumb',ASSET.lots],
  ['WARP','#cThumb',ASSET.warp],
]);

function ensureStyle(){
  if($('#k11520ControlsV253Style'))return;
  $('#k11520ControlsV251Style')?.remove();
  $('#k11520ControlsV252Style')?.remove();
  const s=document.createElement('style');
  s.id='k11520ControlsV253Style';
  s.textContent=`
  /* Approved control map: XZ=brand logo, Y=16888 fairy, lots=KGEN logo, warp=UFO. */
  #joy #knob{overflow:hidden!important;padding:0!important;background:#071018!important;border:2px solid #68e4ff!important;box-shadow:0 5px 18px #000a,0 0 14px #68e4ff55!important;touch-action:none!important}
  #joy #knob .v253ControlImg{width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;border-radius:50%!important;pointer-events:none!important;user-select:none!important}

  /* Y control is thumb-start only: the large visual rail must never intercept combat/dashboard taps. */
  #yJoyV250{pointer-events:none!important}
  #yJoyV250 .yPlane,#yJoyV250 .yGuide,#yJoyV250 .yPlus,#yJoyV250 .yMinus,#yJoyV250 .yReadout{pointer-events:none!important}
  #yJoyV250 .yKnob{overflow:hidden!important;padding:0!important;background:#071018!important;width:52px!important;height:52px!important;margin:-26px 0 0 -26px!important;border:2px solid #f1ca73!important;box-shadow:0 5px 16px #000a!important;pointer-events:auto!important;touch-action:none!important;cursor:grab!important}
  #yJoyV250 .yKnob:active{cursor:grabbing!important}
  #yJoyV250 .yKnob .v253ControlImg{width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;object-position:center 18%!important;border-radius:50%!important;pointer-events:none!important;user-select:none!important}

  #cControl .thumb,#lotsControl .thumb{width:44px!important;height:44px!important;border-radius:50%!important;overflow:hidden!important;padding:0!important;background:#071018!important;box-shadow:0 4px 14px #000b!important;z-index:3!important;touch-action:none!important}
  #cControl .thumb .v253ControlImg,#lotsControl .thumb .v253ControlImg{width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;border-radius:50%!important;pointer-events:none!important;user-select:none!important}
  #cControl .track,#lotsControl .track{left:50%!important;right:auto!important;width:12px!important;transform:translateX(-50%)!important;background:repeating-linear-gradient(to top,#2b4c58 0 2px,#071018 2px 13px)!important}
  #cControl,#lotsControl{overflow:visible!important}
  #cControl label,#lotsControl label{font-weight:900!important;color:#f1ca73!important}
  #cControl .read,#lotsControl .read{font-weight:900!important;color:#eafcff!important}

  /* The old full-screen look layer is the known obsolete center interceptor. Remove only this known organ. */
  #lookPad{display:none!important;pointer-events:none!important}

  /* Keep controls separated on ~390px phones: XZ left, combat center, Y lower-right, C/lots above center-right. */
  @media(max-width:420px){
    #joy{left:14px!important}
    #yJoyV250{right:8px!important;width:68px!important;height:124px!important}
    .sliderDock{right:94px!important;bottom:176px!important;gap:7px!important}
    .sliderDock .v{width:46px!important;height:124px!important}
    #cControl .thumb,#lotsControl .thumb{width:42px!important;height:42px!important}
  }
  `;
  document.head.appendChild(s);
}

function putImage(host,src,alt){
  if(!host)return false;
  let img=host.querySelector('img.v253ControlImg');
  if(!img){
    host.querySelectorAll('img.v251ControlImg,img.v252ControlImg').forEach(n=>n.remove());
    host.textContent='';
    img=document.createElement('img');
    img.className='v253ControlImg';
    host.appendChild(img);
  }
  if(img.getAttribute('src')!==src)img.src=src;
  img.alt=alt;
  img.draggable=false;
  return true;
}

function installImages(){
  let ok=true;
  for(const [name,selector,src] of REQUIRED_CONTROLS){
    const host=$(selector);
    ok=putImage(host,src,`${name} control`)&&ok;
  }
  return ok;
}

function removeKnownBlockers(){
  const look=$('#lookPad');
  if(look){
    look.style.display='none';
    look.style.pointerEvents='none';
    look.dataset.v253Retired='1';
  }
}

function controlHealth(){
  const report={version:'2.5.3',ok:true,controls:{},knownBlockers:{lookPad:'ABSENT'},interaction:{yThumbOnly:true}};
  for(const [name,selector,src] of REQUIRED_CONTROLS){
    const host=$(selector),img=host?.querySelector('img.v253ControlImg');
    const rect=host?.getBoundingClientRect?.();
    const visible=!!host&&!!rect&&rect.width>0&&rect.height>0&&getComputedStyle(host).display!=='none';
    const hasImage=!!img&&!!img.src;
    report.controls[name]={present:!!host,visible,hasImage,src:img?.getAttribute('src')||src};
    if(!host||!visible||!hasImage)report.ok=false;
  }
  const look=$('#lookPad');
  if(look){
    const cs=getComputedStyle(look);
    report.knownBlockers.lookPad=(cs.display==='none'||cs.pointerEvents==='none')?'RETIRED':'ACTIVE';
    if(report.knownBlockers.lookPad==='ACTIVE')report.ok=false;
  }
  document.documentElement.dataset.v253ControlHealth=report.ok?'PASS':'RED';
  globalThis.__K11520_CONTROL_HEALTH__=report;
  return report;
}

export function install11520ControlsV251(){
  ensureStyle();
  removeKnownBlockers();
  let tries=0,lastAllReady=false;
  const tick=()=>{
    tries++;
    ensureStyle();
    removeKnownBlockers();
    lastAllReady=installImages();
    controlHealth();
    if(!lastAllReady&&tries<40)setTimeout(tick,150);
  };
  tick();
  const observer=new MutationObserver(()=>{
    removeKnownBlockers();
    const ready=installImages();
    controlHealth();
    if(ready&&lastAllReady)queueMicrotask(()=>observer.disconnect());
    lastAllReady=ready;
  });
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>{try{observer.disconnect()}catch{}controlHealth()},9000);
  return controlHealth();
}

export {controlHealth as get11520ControlHealth};
