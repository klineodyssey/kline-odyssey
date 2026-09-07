/* KGEN_META
VERSION: 2.6.9
STATUS: ACTIVE
FORMAL_ORGAN_NAME: XZXY Joystick
PURPOSE: Merge low-frequency Y movement into the existing left-bottom circular joystick as a persistent XZ/XY plane mode. Tap the joystick center image to switch planes; X remains horizontal in both modes, vertical maps to Z in XZ and Y in XY. The former separate Y control stays as a hidden compatibility actuator only. No wallet, trade, settlement, chain, treasury or governance behavior changes.
*/
const $=s=>document.querySelector(s);
const STORE='k11520.joystick.plane';
const KGEN='./assets/ui/brand-k-ui.webp';
const FAIRY='./assets/ui/goddess-ui.webp';
let mode='XZ',xyPid=null,xyProxyPid=null,centerTap=null;

function loadMode(){try{const v=localStorage.getItem(STORE);mode=v==='XY'?'XY':'XZ'}catch{mode='XZ'}}
function saveMode(){try{localStorage.setItem(STORE,mode)}catch{}}
function style(){if($('#k11520JoystickPlaneStyle'))return;const s=document.createElement('style');s.id='k11520JoystickPlaneStyle';s.textContent=`
#joy{overflow:visible!important}
#joy .joyPlane:after{display:none!important}
#k11520PlaneLabel{position:absolute;left:0;right:0;top:-20px;text-align:center;font:800 10px system-ui,"Noto Sans TC",sans-serif;color:#68e4ff;pointer-events:none;text-shadow:0 1px 2px #000}
#k11520DirTop,#k11520DirBottom,#k11520DirLeft,#k11520DirRight{position:absolute;z-index:6;pointer-events:none;font:900 10px system-ui;color:#9eeeff;text-shadow:0 1px 2px #000}
#k11520DirTop{left:50%;top:6px;transform:translateX(-50%)}#k11520DirBottom{left:50%;bottom:5px;transform:translateX(-50%)}#k11520DirLeft{left:5px;top:50%;transform:translateY(-50%)}#k11520DirRight{right:5px;top:50%;transform:translateY(-50%)}
#knob{z-index:8!important;cursor:pointer!important;overflow:hidden!important;pointer-events:auto!important;touch-action:none!important}
#knob img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;border-radius:50%!important;pointer-events:none!important;user-select:none!important}
#yJoyV250{display:none!important;pointer-events:none!important}
#yControl{position:fixed!important;left:-120px!important;right:auto!important;top:auto!important;bottom:0!important;width:42px!important;height:112px!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important}
`;
document.head.appendChild(s)}
function ensureLabels(){const joy=$('#joy');if(!joy)return false;for(const id of ['k11520PlaneLabel','k11520DirTop','k11520DirBottom','k11520DirLeft','k11520DirRight'])if(!$('#'+id)){const n=document.createElement('span');n.id=id;joy.appendChild(n)}return true}
function ensureKnobImage(){const knob=$('#knob');if(!knob)return false;let img=knob.querySelector('img');if(!img){img=document.createElement('img');img.draggable=false;knob.replaceChildren(img)}img.src=mode==='XY'?FAIRY:KGEN;img.alt=mode==='XY'?'XY 模式仙女':'XZ 模式 KGEN';img.style.display='block';img.style.visibility='visible';img.style.opacity='1';return true}
function render(){ensureLabels();ensureKnobImage();const label=$('#k11520PlaneLabel'),top=$('#k11520DirTop'),bottom=$('#k11520DirBottom'),left=$('#k11520DirLeft'),right=$('#k11520DirRight');if(label)label.textContent=`${mode} 模式 · 點中央圖切換`;if(left)left.textContent='X−';if(right)right.textContent='X+';if(top)top.textContent=mode==='XY'?'Y+':'Z+';if(bottom)bottom.textContent=mode==='XY'?'Y−':'Z−';document.documentElement.dataset.k11520JoyPlane=mode;globalThis.__K11520_JOYSTICK_XZXY__={organ:'XZXY Joystick',version:'2.6.9',mode,persistent:true,horizontal:'X',vertical:mode==='XY'?'Y':'Z'};globalThis.__K11520_JOYSTICK_PLANE__=globalThis.__K11520_JOYSTICK_XZXY__}
function flash(text){const t=$('#toast');if(!t)return;t.textContent=text;t.classList.add('show');clearTimeout(flash.t);flash.t=setTimeout(()=>t.classList.remove('show'),1000)}
function toggle(){mode=mode==='XZ'?'XY':'XZ';saveMode();render();flash(mode==='XY'?'XY 模式：左右 X、上下 Y':'XZ 模式：左右 X、上下 Z')}
function yEvent(type,source,pointerId){const y=$('#yControl'),joy=$('#joy');if(!y||!joy)return;const jr=joy.getBoundingClientRect(),yr=y.getBoundingClientRect();if(!jr.height||!yr.height)return;const rel=Math.max(0,Math.min(1,(source.clientY-jr.top)/jr.height));const clientY=yr.top+rel*yr.height,clientX=yr.left+yr.width/2;const ev=new PointerEvent(type,{bubbles:true,cancelable:true,pointerId,pointerType:'touch',clientX,clientY,buttons:type==='pointerup'||type==='pointercancel'?0:1});Object.defineProperty(ev,'__k11520XYProxy',{value:true});y.dispatchEvent(ev)}
function neutralizeZ(source){const joy=$('#joy');if(!joy)return;const r=joy.getBoundingClientRect();const ev=new PointerEvent('pointermove',{bubbles:true,cancelable:true,pointerId:source.pointerId,pointerType:source.pointerType||'touch',clientX:source.clientX,clientY:r.top+r.height/2,buttons:source.buttons||1});Object.defineProperty(ev,'__k11520XYProxy',{value:true});joy.dispatchEvent(ev)}
function inKnob(x,y){const k=$('#knob');if(!k)return false;const r=k.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom}
function bind(){const joy=$('#joy'),knob=$('#knob');if(!joy||!knob||joy.dataset.k11520PlaneBound)return false;joy.dataset.k11520PlaneBound='1';
  joy.addEventListener('pointerdown',e=>{if(e.__k11520XYProxy)return;if(inKnob(e.clientX,e.clientY))centerTap={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};if(mode!=='XY')return;xyPid=e.pointerId;xyProxyPid=900000+(Number(e.pointerId)||1);queueMicrotask(()=>{if(xyPid!==e.pointerId)return;neutralizeZ(e);yEvent('pointerdown',e,xyProxyPid)})},{capture:true,passive:true});
  joy.addEventListener('pointermove',e=>{if(e.__k11520XYProxy)return;if(centerTap&&centerTap.id===e.pointerId&&Math.hypot(e.clientX-centerTap.x,e.clientY-centerTap.y)>8)centerTap=null;if(mode!=='XY'||e.pointerId!==xyPid)return;queueMicrotask(()=>{if(xyPid!==e.pointerId)return;neutralizeZ(e);yEvent('pointermove',e,xyProxyPid)})},{capture:true,passive:true});
  const end=e=>{if(e.__k11520XYProxy)return;const tap=centerTap;centerTap=null;if(tap&&tap.id===e.pointerId&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)<=8&&performance.now()-tap.t<420){e.preventDefault();e.stopPropagation();toggle()}if(e.pointerId!==xyPid)return;const pid=xyProxyPid;xyPid=null;xyProxyPid=null;queueMicrotask(()=>yEvent(e.type==='pointercancel'?'pointercancel':'pointerup',e,pid||999999))};
  joy.addEventListener('pointerup',end,{capture:true,passive:false});joy.addEventListener('pointercancel',end,{capture:true,passive:false});return true}
function install(){style();loadMode();ensureLabels();render();bind();let n=0;const tick=()=>{n++;render();bind();if(n<20)setTimeout(tick,180)};setTimeout(tick,80);return globalThis.__K11520_JOYSTICK_XZXY__}
export function install11520JoystickXZXY(){return install()}
