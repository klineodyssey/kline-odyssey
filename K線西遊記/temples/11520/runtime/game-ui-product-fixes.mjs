/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE
PURPOSE: Product-level mobile UI corrections that must not alter gameplay control semantics.
*/

const isGame=typeof document!=='undefined'&&/\/temples\/11520\/game-5d\.html$/i.test(globalThis.location?.pathname||'');

function installCss(){
  if(!isGame||document.getElementById('k11520ProductFixesStyle'))return;
  const s=document.createElement('style');s.id='k11520ProductFixesStyle';s.textContent=`
    #yControl .track{position:absolute!important}
    #yEnergyMarker{position:absolute;z-index:6;left:50%;width:12px;height:12px;transform:translate(-50%,50%);border-radius:50%;border:1px solid #d8fbff;background:#7feeff;box-shadow:0 0 7px #7feeff,0 0 16px #68e4ff,0 0 28px #68e4ff88;pointer-events:none;transition:bottom .045s linear}
    #yThumb{transition:top .045s linear;box-shadow:0 0 10px #68e4ff88}
    @media(max-width:420px){
      .controls{right:82px!important}
      .sliderDock{right:74px!important}
    }
  `;document.head.appendChild(s);
}

function yRatio(){
  const text=document.getElementById('yRead')?.textContent||'Y 0';
  const value=Number(text.match(/-?\d+(?:\.\d+)?/)?.[0]||0);
  return Math.max(0,Math.min(1,value/40));
}

function installYMarker(){
  const control=document.getElementById('yControl'),track=control?.querySelector('.track'),thumb=document.getElementById('yThumb');
  if(!control||!track||!thumb)return false;
  let marker=document.getElementById('yEnergyMarker');
  if(!marker){marker=document.createElement('i');marker.id='yEnergyMarker';track.appendChild(marker);}
  const sync=()=>{
    const r=yRatio();
    marker.style.bottom=`${(r*100).toFixed(2)}%`;
    // The original vertical control is 140px tall; track runs from 28px to 115px.
    // Keep the real thumb centre on the same Y energy level instead of fixed at 50%.
    thumb.style.top=`${(115-r*87).toFixed(2)}px`;
    thumb.dataset.energyRatio=r.toFixed(4);
  };
  const read=document.getElementById('yRead');
  if(read)new MutationObserver(sync).observe(read,{childList:true,subtree:true,characterData:true});
  for(const ev of ['pointerdown','pointermove','pointerup','touchmove'])control.addEventListener(ev,sync,{passive:true});
  let last=0;const loop=t=>{if(t-last>60){sync();last=t}requestAnimationFrame(loop)};requestAnimationFrame(loop);sync();return true;
}

export function install11520ProductFixes(){
  if(!isGame)return {ok:false,reason:'NOT_11520_GAME'};
  installCss();
  if(!installYMarker()){
    const observer=new MutationObserver(()=>{if(installYMarker())observer.disconnect()});
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
  return {ok:true};
}

if(isGame)queueMicrotask(install11520ProductFixes);
