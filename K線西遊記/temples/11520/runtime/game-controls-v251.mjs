/* KGEN_META
VERSION: 2.5.1
STATUS: REVIEW_FIRST
PURPOSE: Apply the human-approved 11520 mobile control imagery and compact touch layout without changing trade, wallet, chain, or settlement behavior.
*/
const $=s=>document.querySelector(s);

const ASSET={
  xz:'./assets/ui/brand-user-ui.webp',
  y:'../16888/assets/fairy_sprite_36.png',
  lots:'./assets/ui/kgen-user-ui.webp',
  warp:'./assets/ui/ufo-user-ui.webp',
};

function ensureStyle(){
  if($('#k11520ControlsV251Style'))return;
  const s=document.createElement('style');
  s.id='k11520ControlsV251Style';
  s.textContent=`
  /* Approved control map: XZ=brand logo, Y=16888 fairy, lots=KGEN logo, warp=UFO. */
  #joy #knob{overflow:hidden!important;padding:0!important;background:#071018!important;border:2px solid #68e4ff!important;box-shadow:0 5px 18px #000a,0 0 14px #68e4ff55!important}
  #joy #knob .v251ControlImg{width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;border-radius:50%!important;pointer-events:none!important}
  #yJoyV250 .yKnob{overflow:hidden!important;padding:0!important;background:#071018!important;width:52px!important;height:52px!important;margin:-26px 0 0 -26px!important;border:2px solid #f1ca73!important;box-shadow:0 5px 16px #000a!important}
  #yJoyV250 .yKnob .v251ControlImg{width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;object-position:center 18%!important;border-radius:50%!important;pointer-events:none!important}
  #cControl .thumb,#lotsControl .thumb{width:44px!important;height:44px!important;border-radius:50%!important;overflow:hidden!important;padding:0!important;background:#071018!important;box-shadow:0 4px 14px #000b!important;z-index:3!important}
  #cControl .thumb .v251ControlImg,#lotsControl .thumb .v251ControlImg{width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;border-radius:50%!important;pointer-events:none!important}
  #cControl .track,#lotsControl .track{left:50%!important;right:auto!important;width:12px!important;transform:translateX(-50%)!important;background:repeating-linear-gradient(to top,#2b4c58 0 2px,#071018 2px 13px)!important}
  #cControl,#lotsControl{overflow:visible!important}
  #cControl label,#lotsControl label{font-weight:900!important;color:#f1ca73!important}
  #cControl .read,#lotsControl .read{font-weight:900!important;color:#eafcff!important}
  #lookPad{display:none!important;pointer-events:none!important}
  @media(max-width:420px){
    .sliderDock{right:122px!important;bottom:176px!important;gap:7px!important}
    .sliderDock .v{width:48px!important;height:124px!important}
    #cControl .thumb,#lotsControl .thumb{width:42px!important;height:42px!important}
    #yJoyV250{right:54px!important;width:78px!important;height:132px!important}
    #joy{left:14px!important}
  }
  `;
  document.head.appendChild(s);
}

function putImage(host,src,alt){
  if(!host)return false;
  host.textContent='';
  let img=host.querySelector('img.v251ControlImg');
  if(!img){img=document.createElement('img');img.className='v251ControlImg';host.appendChild(img)}
  img.src=src;img.alt=alt;img.draggable=false;
  return true;
}

function installImages(){
  const a=putImage($('#knob'),ASSET.xz,'XZ 品牌遙桿');
  const b=putImage($('#yJoyV250 .yKnob'),ASSET.y,'16888 仙女 Y 升降');
  const c=putImage($('#lotsThumb'),ASSET.lots,'KGEN 口數');
  const d=putImage($('#cThumb'),ASSET.warp,'UFO C 曲速');
  return a&&b&&c&&d;
}

function removeBlankBlockers(){
  const keep=new Set(['three','joy','yJoyV250','toast','sheet','confirm','walletPanel','intro11520']);
  for(const el of [...document.body.children]){
    if(keep.has(el.id)||el.matches?.('.top,.axes,.tele,.monsterHud,.minimapWrap,.controls,.dock,.sliderDock,.assetTag'))continue;
    const cs=getComputedStyle(el),r=el.getBoundingClientRect(),txt=(el.textContent||'').replace(/\s+/g,'').trim();
    if(!['fixed','absolute'].includes(cs.position))continue;
    const largeBlank=r.width>innerWidth*.45&&r.height>56&&r.height<innerHeight*.38&&r.top>innerHeight*.42&&r.top<innerHeight*.82&&txt.length<8;
    if(largeBlank){el.style.display='none';el.dataset.v251BlankRemoved='1'}
  }
}

export function install11520ControlsV251(){
  ensureStyle();
  let tries=0;
  const tick=()=>{
    tries++;
    ensureStyle();installImages();removeBlankBlockers();
    if(tries<24)setTimeout(tick,150);
  };
  tick();
  const observer=new MutationObserver(()=>{installImages();removeBlankBlockers()});
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),7000);
}
