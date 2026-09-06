/* KGEN_META
VERSION: 2.4.1
STATUS: ACTIVE
PURPOSE: Preserve V2.3 product fixes while making the V2.4 joystick the only center-Y controller: XZ<->Y mode toggle and 0.5s hold Y+/Y-.
*/
import {install11520ProductFixes as installV23} from './game-ui-product-fixes-v23.mjs';

const $=s=>document.querySelector(s);
let yMode=false,yPid=null,yTimer=null,yInterval=null,yDir=0,centerPid=null,centerMoved=false,centerStart=null;

function ensureStyle(){if($('#k11520YModeV24Style'))return;const s=document.createElement('style');s.id='k11520YModeV24Style';s.textContent=`
#joy[data-control-mode="Y"] .joyPlane{border-color:#f1ca73aa!important;box-shadow:0 0 28px #f1ca7330 inset}
#joy[data-control-mode="Y"] #knob{border-color:#f1ca73!important;background:#5a431d!important;box-shadow:0 0 18px #f1ca7355!important}
#joyModeV24{position:absolute;left:10px;right:-64px;top:-22px;text-align:center;font-size:8px;font-weight:900;color:#68e4ff;pointer-events:none}
#joy[data-control-mode="Y"] #joyModeV24{color:#f1ca73}
.joyAxisV24{position:absolute;font-size:8px;font-weight:900;color:#68e4ff;pointer-events:none;text-shadow:0 1px 3px #000}.joyAxisV24.up{top:6px;left:50%;transform:translateX(-50%)}.joyAxisV24.down{bottom:6px;left:50%;transform:translateX(-50%)}.joyAxisV24.left{left:5px;top:50%;transform:translateY(-50%)}.joyAxisV24.right{right:5px;top:50%;transform:translateY(-50%)}
#joy[data-control-mode="Y"] .joyAxisV24{color:#f1ca73}#joy[data-control-mode="Y"] .joyAxisV24.left,#joy[data-control-mode="Y"] .joyAxisV24.right{display:none}
`;document.head.appendChild(s)}

function currentY(){return Number(($('#yRead')?.textContent||'0').match(/-?\d+(?:\.\d+)?/)?.[0]||0)}
function dispatchY(y){const c=$('#yControl');if(!c)return;const r=c.getBoundingClientRect(),t=Math.max(0,Math.min(1,y/40)),cy=r.top+(1-t)*r.height;for(const type of ['pointerdown','pointerup'])c.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:8844,pointerType:'touch',clientX:r.left+r.width/2,clientY:cy,buttons:type==='pointerdown'?1:0}))}
function stopY(){clearTimeout(yTimer);clearInterval(yInterval);yTimer=yInterval=null;yDir=0}
function updateUi(){const joy=$('#joy'),knob=$('#knob'),m=$('#joyModeV24'),up=$('#joyV24Up'),dn=$('#joyV24Down'),lt=$('#joyV24Left'),rt=$('#joyV24Right');if(!joy||!knob)return;joy.dataset.controlMode=yMode?'Y':'XZ';knob.textContent=yMode?'Y':'K';knob.setAttribute('aria-label',yMode?'Y 高度模式，點一下回 XZ':'XZ 模式，點一下切換 Y 高度');if(m)m.textContent=yMode?'Y MODE · 按住 0.5 秒：上 Y+ / 下 Y−':'XZ MODE · 點中央 K 切換 Y';if(up)up.textContent=yMode?'Y+':'Z+';if(dn)dn.textContent=yMode?'Y−':'Z−';if(lt)lt.textContent='X−';if(rt)rt.textContent='X+'}
function setMode(next){stopY();yPid=null;yMode=!!next;updateUi()}
function installLabels(){const joy=$('#joy');if(!joy||$('#joyModeV24'))return;const mode=document.createElement('div');mode.id='joyModeV24';joy.appendChild(mode);for(const [id,cls,text] of [['joyV24Up','up','Z+'],['joyV24Down','down','Z−'],['joyV24Left','left','X−'],['joyV24Right','right','X+']]){const n=document.createElement('span');n.id=id;n.className='joyAxisV24 '+cls;n.textContent=text;joy.appendChild(n)}updateUi()}
function dirFromEvent(e){const joy=$('#joy'),r=joy.getBoundingClientRect();return e.clientY<r.top+r.height/2?1:-1}
function beginY(e){stopY();yDir=dirFromEvent(e);yTimer=setTimeout(()=>{const tick=()=>{const y=currentY(),next=Math.max(0,Math.min(40,Math.round((y+yDir*.5)*10)/10));if(next===y){stopY();return}dispatchY(next)};tick();yInterval=setInterval(tick,120)},500)}
function installOverride(){const joy=$('#joy'),knob=$('#knob');if(!joy||!knob||joy.dataset.v24YInstalled)return false;joy.dataset.v24YInstalled='1';ensureStyle();installLabels();
  knob.addEventListener('pointerdown',e=>{centerPid=e.pointerId;centerStart={x:e.clientX,y:e.clientY};centerMoved=false;e.preventDefault();e.stopImmediatePropagation();try{knob.setPointerCapture?.(centerPid)}catch{}},{capture:true});
  knob.addEventListener('pointermove',e=>{if(e.pointerId!==centerPid)return;if(centerStart&&Math.hypot(e.clientX-centerStart.x,e.clientY-centerStart.y)>8)centerMoved=true;e.preventDefault();e.stopImmediatePropagation()},{capture:true});
  knob.addEventListener('pointerup',e=>{if(e.pointerId!==centerPid)return;const toggle=!centerMoved;centerPid=null;centerStart=null;centerMoved=false;e.preventDefault();e.stopImmediatePropagation();if(toggle)setMode(!yMode)},{capture:true});
  knob.addEventListener('pointercancel',e=>{if(e.pointerId!==centerPid)return;centerPid=null;centerStart=null;centerMoved=false;e.preventDefault();e.stopImmediatePropagation()},{capture:true});
  joy.addEventListener('pointerdown',e=>{if(!yMode||e.target===knob)return;e.preventDefault();e.stopImmediatePropagation();yPid=e.pointerId;try{joy.setPointerCapture?.(yPid)}catch{}beginY(e)},{capture:true});
  joy.addEventListener('pointermove',e=>{if(!yMode||e.pointerId!==yPid)return;e.preventDefault();e.stopImmediatePropagation();yDir=dirFromEvent(e)},{capture:true});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(ev,e=>{if(!yMode||e.pointerId!==yPid)return;e.preventDefault();e.stopImmediatePropagation();yPid=null;stopY()},{capture:true});
  return true}
function stampVersion(){const b=document.querySelector('.brand b');if(b)b.innerHTML='<span>11520 花果山 V2.4</span><br><span>5D K線西遊記</span>'}
function updateAiCopy(){const msgs=$('#aiMsgs');if(!msgs||msgs.dataset.v24ControlHelp)return;msgs.dataset.v24ControlHelp='1';const n=document.createElement('div');n.className='aiMsg';n.textContent='V2.4 控制：中央 K 點一下切換 XZ/Y；Y 模式按住 0.5 秒，上半 Y+、下半 Y−，放手停止。';msgs.appendChild(n)}

export function install11520ProductFixes(){
  /* Tell V2.3 that center-Y is already owned so it must not install the retired single/double-tap listeners. */
  const knob=$('#knob');if(knob)knob.dataset.yCenterInstalled='v24-owner';
  const result=installV23();
  const ready=()=>{const k=$('#knob');if(k)k.dataset.yCenterInstalled='v24-owner';stampVersion();updateAiCopy();return installOverride()};
  if(!ready()){const mo=new MutationObserver(()=>{if(ready())mo.disconnect()});mo.observe(document.documentElement,{childList:true,subtree:true})}
  return{...result,version:'2.4.1',features:[...(result?.features||[]).filter(x=>x!=='left-center-y'),'xz-y-mode-toggle','y-hold-500ms','legacy-center-y-disabled']}
}
