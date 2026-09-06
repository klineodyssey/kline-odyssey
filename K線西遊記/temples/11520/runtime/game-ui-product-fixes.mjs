/* KGEN_META
VERSION: 2.4.2
STATUS: ACTIVE
PURPOSE: Thumb-first joystick: touch/drag controls XZ, quick tap-release toggles Y mode, Y touch/drag controls altitude; align mobile rings.
*/
import {install11520ProductFixes as installV23} from './game-ui-product-fixes-v23.mjs';

const $=s=>document.querySelector(s);
let yMode=false,yPid=null,yTimer=null,yInterval=null,yDir=0,tapPid=null,tapStart=null,tapMoved=false,tapAt=0;

function ensureStyle(){if($('#k11520YModeV24Style'))return;const s=document.createElement('style');s.id='k11520YModeV24Style';s.textContent=`
#joy{--joySize:154px;--guideSize:104px;--knobSize:50px}
#joy .joyPlane{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;border-radius:50%!important}
#joy .joyGuide{position:absolute!important;width:var(--guideSize)!important;height:var(--guideSize)!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;border-radius:50%!important}
#joy #knob{position:absolute!important;width:var(--knobSize)!important;height:var(--knobSize)!important;left:50%!important;top:50%!important;margin-left:calc(var(--knobSize)/-2)!important;margin-top:calc(var(--knobSize)/-2)!important}
#joy[data-control-mode="Y"] .joyPlane{border-color:#f1ca73aa!important;box-shadow:0 0 28px #f1ca7330 inset}
#joy[data-control-mode="Y"] #knob{border-color:#f1ca73!important;background:#5a431d!important;box-shadow:0 0 18px #f1ca7355!important}
#joyModeV24{position:absolute;left:10px;right:-64px;top:-22px;text-align:center;font-size:8px;font-weight:900;color:#68e4ff;pointer-events:none}
#joy[data-control-mode="Y"] #joyModeV24{color:#f1ca73}
.joyAxisV24{position:absolute;font-size:8px;font-weight:900;color:#68e4ff;pointer-events:none;text-shadow:0 1px 3px #000}.joyAxisV24.up{top:6px;left:50%;transform:translateX(-50%)}.joyAxisV24.down{bottom:6px;left:50%;transform:translateX(-50%)}.joyAxisV24.left{left:5px;top:50%;transform:translateY(-50%)}.joyAxisV24.right{right:5px;top:50%;transform:translateY(-50%)}
#joy[data-control-mode="Y"] .joyAxisV24{color:#f1ca73}#joy[data-control-mode="Y"] .joyAxisV24.left,#joy[data-control-mode="Y"] .joyAxisV24.right{display:none}
@media(max-width:420px){#joy{--joySize:146px;--guideSize:98px;--knobSize:48px}}
`;document.head.appendChild(s)}
function currentY(){return Number(($('#yRead')?.textContent||'0').match(/-?\d+(?:\.\d+)?/)?.[0]||0)}
function dispatchY(y){const c=$('#yControl');if(!c)return;const r=c.getBoundingClientRect(),t=Math.max(0,Math.min(1,y/40)),cy=r.top+(1-t)*r.height;for(const type of ['pointerdown','pointerup'])c.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:8844,pointerType:'touch',clientX:r.left+r.width/2,clientY:cy,buttons:type==='pointerdown'?1:0}))}
function stopY(){clearTimeout(yTimer);clearInterval(yInterval);yTimer=yInterval=null;yDir=0}
function updateUi(){const joy=$('#joy'),knob=$('#knob'),m=$('#joyModeV24'),up=$('#joyV24Up'),dn=$('#joyV24Down'),lt=$('#joyV24Left'),rt=$('#joyV24Right');if(!joy||!knob)return;joy.dataset.controlMode=yMode?'Y':'XZ';knob.textContent=yMode?'Y':'K';knob.setAttribute('aria-label',yMode?'Y 高度模式；觸控上下控制，輕點切回 XZ':'XZ 模式；拖曳移動，輕點切換 Y');if(m)m.textContent=yMode?'Y MODE · 接觸上下控制 · 輕點切回 XZ':'XZ MODE · 接觸拖曳移動 · 輕點切 Y';if(up)up.textContent=yMode?'Y+':'Z+';if(dn)dn.textContent=yMode?'Y−':'Z−';if(lt)lt.textContent='X−';if(rt)rt.textContent='X+'}
function setMode(next){stopY();yPid=null;yMode=!!next;updateUi()}
function installLabels(){const joy=$('#joy');if(!joy||$('#joyModeV24'))return;const mode=document.createElement('div');mode.id='joyModeV24';joy.appendChild(mode);for(const [id,cls,text] of [['joyV24Up','up','Z+'],['joyV24Down','down','Z−'],['joyV24Left','left','X−'],['joyV24Right','right','X+']]){const n=document.createElement('span');n.id=id;n.className='joyAxisV24 '+cls;n.textContent=text;joy.appendChild(n)}updateUi()}
function dirFromEvent(e){const r=$('#joy').getBoundingClientRect();return e.clientY<r.top+r.height/2?1:-1}
function beginY(e){stopY();yDir=dirFromEvent(e);const tick=()=>{const y=currentY(),next=Math.max(0,Math.min(40,Math.round((y+yDir*.5)*10)/10));if(next===y){stopY();return}dispatchY(next)};tick();yInterval=setInterval(tick,120)}
function installOverride(){const joy=$('#joy'),knob=$('#knob');if(!joy||!knob||joy.dataset.v24YInstalled)return false;joy.dataset.v24YInstalled='1';ensureStyle();installLabels();
  /* Capture the whole pad. A quick stationary tap toggles modes; a drag remains movement. */
  joy.addEventListener('pointerdown',e=>{tapPid=e.pointerId;tapStart={x:e.clientX,y:e.clientY};tapMoved=false;tapAt=performance.now();if(yMode){e.preventDefault();e.stopImmediatePropagation();yPid=e.pointerId;try{joy.setPointerCapture?.(yPid)}catch{}beginY(e)}},{capture:true});
  joy.addEventListener('pointermove',e=>{if(e.pointerId===tapPid&&tapStart&&Math.hypot(e.clientX-tapStart.x,e.clientY-tapStart.y)>10)tapMoved=true;if(yMode&&e.pointerId===yPid){e.preventDefault();e.stopImmediatePropagation();yDir=dirFromEvent(e)}},{capture:true});
  joy.addEventListener('pointerup',e=>{if(e.pointerId!==tapPid&&e.pointerId!==yPid)return;const quick=e.pointerId===tapPid&&!tapMoved&&performance.now()-tapAt<320;if(yMode&&e.pointerId===yPid){e.preventDefault();e.stopImmediatePropagation();yPid=null;stopY()}if(e.pointerId===tapPid){tapPid=null;tapStart=null;tapMoved=false;if(quick)setMode(!yMode)}},{capture:true});
  for(const ev of ['pointercancel','lostpointercapture'])joy.addEventListener(ev,e=>{if(e.pointerId===yPid){yPid=null;stopY()}if(e.pointerId===tapPid){tapPid=null;tapStart=null;tapMoved=false}},{capture:true});
  return true}
function stampVersion(){const b=document.querySelector('.brand b');if(b)b.innerHTML='<span>11520 花果山 V2.4</span><br><span>5D K線西遊記</span>'}
function updateAiCopy(){const msgs=$('#aiMsgs');if(!msgs||msgs.dataset.v242ControlHelp)return;msgs.dataset.v242ControlHelp='1';const n=document.createElement('div');n.className='aiMsg';n.textContent='V2.4 控制：XZ 模式接觸拖曳即移動；輕點遙桿放開切 Y；Y 模式接觸上/下控制 Y+/Y−；再輕點切回 XZ。';msgs.appendChild(n)}
export function install11520ProductFixes(){const knob=$('#knob');if(knob)knob.dataset.yCenterInstalled='v24-owner';const result=installV23();const ready=()=>{const k=$('#knob');if(k)k.dataset.yCenterInstalled='v24-owner';stampVersion();updateAiCopy();return installOverride()};if(!ready()){const mo=new MutationObserver(()=>{if(ready())mo.disconnect()});mo.observe(document.documentElement,{childList:true,subtree:true})}return{...result,version:'2.4.2',features:[...(result?.features||[]).filter(x=>x!=='left-center-y'),'thumb-first-xz','tap-release-y-toggle','direct-y-touch','aligned-joystick-rings','legacy-center-y-disabled']}}
