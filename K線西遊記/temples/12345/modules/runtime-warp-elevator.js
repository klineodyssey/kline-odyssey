/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: runtime-warp-elevator.js
VERSION: V10.40.0_GITHUB_RELEASE_CLEAN
BUILD: 20260517-V10.40.0-GITHUB-RELEASE-CLEAN
BASE_FROM: KGEN_12345_V10_39_2_EXECUTION_MAP_GOVERNANCE_FULL.zip
RULE: GitHub release layer only keeps active files. Modules single-layer.
*/
(function(){
  "use strict";
  if (window.__KGEN_WARP_ELEVATOR__) return;
  window.__KGEN_WARP_ELEVATOR__ = true;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  function ensureElevator(){
    let el=document.getElementById("kgen-warp-elevator");
    if(!el){
      el=document.createElement("div");
      el.id="kgen-warp-elevator"; el.className="kgen-warp-elevator";
      el.innerHTML=`<div style="position:absolute;right:32px;top:0;bottom:0;width:2px;background:linear-gradient(to top,rgba(90,255,255,.15),rgba(90,255,255,.85));box-shadow:0 0 16px rgba(90,255,255,.5);"></div><div id="kgen-warp-level-label" style="position:absolute;right:0;top:-24px;color:#bff;font-size:11px;font-weight:900;text-shadow:0 0 8px #0ff;">C 0/300</div><img id="kgen-warp-core" class="kgen-warp-core" src="./assets/warp-core.png" alt="warp-core">`;
      document.body.appendChild(el);
    }
    let img=document.getElementById("kgen-warp-core");
    if(!img){
      img=document.createElement("img"); img.id="kgen-warp-core"; img.className="kgen-warp-core"; img.src="./assets/warp-core.png"; img.alt="warp-core"; el.appendChild(img);
    } else if(!/warp-core\.png/.test(img.getAttribute("src")||"")) img.src="./assets/warp-core.png";
    return el;
  }
  function ensureDrive(){
    let d=document.getElementById("kgen-drive-ring");
    if(!d){
      d=document.createElement("button");
      d.id="kgen-drive-ring"; d.className="kgen-drive-ring"; d.type="button"; d.textContent="DRIVE";
      d.style.cssText="width:66px;height:66px;border-radius:50%;border:1px solid rgba(135,247,255,.65);background:radial-gradient(circle,rgba(90,255,255,.35),rgba(0,0,0,.85));color:#dffcff;font-size:11px;font-weight:900;";
      d.onclick=()=>window.KGEN_SET_WARP_LEVEL((Number(window.KGEN_WARP_LEVEL||0)>=300)?0:Number(window.KGEN_WARP_LEVEL||0)+20);
      document.body.appendChild(d);
    }
    return d;
  }
  window.KGEN_SET_WARP_LEVEL=function(level){
    const el=ensureElevator(), core=document.getElementById("kgen-warp-core"), label=document.getElementById("kgen-warp-level-label"), drive=ensureDrive();
    const c=clamp(Number(level)||0,0,300); window.KGEN_WARP_LEVEL=c;
    if(window.KGEN_RUNTIME_STATE?.universe) window.KGEN_RUNTIME_STATE.universe.C=c;
    const h=el.clientHeight||260, coreH=56, top=(h-coreH)-((c/300)*(h-coreH));
    core.style.top=`${top}px`;
    core.style.filter=`drop-shadow(0 0 ${10+c/12}px rgba(90,255,255,.85)) brightness(${1+c/600})`;
    if(label) label.textContent=`C ${Math.round(c)}/300`;
    drive.classList.toggle("kgen-drive-active",c>0);
    drive.style.boxShadow=c>0?`0 0 ${12+c/8}px rgba(90,255,255,.65)`:"";
  };
  function boot(){ensureElevator();ensureDrive();window.KGEN_SET_WARP_LEVEL(window.KGEN_WARP_LEVEL||0);}
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
  setInterval(()=>window.KGEN_SET_WARP_LEVEL(window.KGEN_WARP_LEVEL||0),2500);
})();
