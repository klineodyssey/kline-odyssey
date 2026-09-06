/* KGEN_META
VERSION: 2.4.6
STATUS: ACTIVE
PURPOSE: Implement the approved one-image-one-life mobile layout: restored XZ joystick touch/rotation, dedicated Y stick, clear center view, quick backpack slot, and top-opening organ rail.
*/
import {install11520ProductFixes as installV23} from './game-ui-product-fixes-v23.mjs';
const $=s=>document.querySelector(s);
let clockTimer=null,yPid=null,yInterval=null,yDir=0,cleanupTimer=null;

function ensureStyle(){if($('#k11520V246Style'))return;const s=document.createElement('style');s.id='k11520V246Style';s.textContent=`
/* approved header */
.brand .hqLine{display:flex!important;align-items:center;gap:5px;font-weight:900}.brand .hqFlag{font-size:14px;line-height:1}.brand .brandMetaV246{display:flex;align-items:center;gap:7px;margin-top:2px;font-size:10px;line-height:1.2;color:#9eabbc;font-weight:700;white-space:nowrap}.brand .brandClockV246{color:#70e5c0;font-variant-numeric:tabular-nums}
/* XZ stick: the center knob must never steal the pointer from the joystick surface. */
#joy{--guideSize:104px;--knobSize:50px}
#joy .joyPlane{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;border-radius:50%!important}
#joy .joyGuide{position:absolute!important;width:var(--guideSize)!important;height:var(--guideSize)!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;border-radius:50%!important}
#joy #knob{position:absolute!important;width:var(--knobSize)!important;height:var(--knobSize)!important;left:50%!important;top:50%!important;margin-left:calc(var(--knobSize)/-2)!important;margin-top:calc(var(--knobSize)/-2)!important;pointer-events:none!important;display:grid!important;place-items:center!important;color:#fff!important;font-weight:900!important}
#joy .joyPlane:after{content:'XZ 模式（移動 + 旋轉）'!important;left:0!important;right:0!important;text-align:center!important;top:-20px!important}
/* old Y slider is retired; C/Lots remain. */
#yControl{display:none!important}.sliderDock{right:174px!important;bottom:178px!important}.sliderDock #cControl,.sliderDock #lotsControl{display:block!important}
/* dedicated spring-centred Y stick */
#yJoyV246{position:fixed;z-index:452;width:104px;height:146px;right:66px;bottom:max(14px,env(safe-area-inset-bottom));touch-action:none;user-select:none}
#yJoyV246 .yTitle{position:absolute;left:0;right:0;top:-20px;text-align:center;color:#f1ca73;font-size:8px;font-weight:900;white-space:nowrap}
#yJoyV246 .yPlane{position:absolute;left:9px;right:9px;top:0;bottom:0;border-radius:52px;border:2px solid #f1ca7390;background:#07141de8;box-shadow:0 0 24px #f1ca7318 inset}
#yJoyV246 .yGuide{position:absolute;left:26px;right:26px;top:28px;bottom:28px;border-radius:36px;border:1px solid #68e4ff38;pointer-events:none}
#yJoyV246 .yKnob{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;border:2px solid #68e4ff;background:#17445f;box-shadow:0 0 18px #68e4ff44;display:grid;place-items:center;color:#fff;font-weight:900;pointer-events:none;transform:translateY(0)}
#yJoyV246 .yPlus,#yJoyV246 .yMinus{position:absolute;left:0;right:0;text-align:center;font-size:10px;font-weight:900;color:#f1ca73;pointer-events:none}#yJoyV246 .yPlus{top:8px}#yJoyV246 .yMinus{bottom:8px}#yJoyV246 .yReadout{position:absolute;left:0;right:0;bottom:-16px;text-align:center;color:#9deaff;font-size:8px;pointer-events:none}
/* quick backpack is a permanent right-side slot below AI */
#bagQuickV246{position:fixed;z-index:990;right:5px;bottom:84px;width:42px;height:42px;border-radius:13px;border:1px solid #68e4ff66;background:#101923ee;color:#fff;box-shadow:0 7px 24px #0009;font-size:20px;display:grid;place-items:center;padding:0}
/* when the organ menu opens, the hamburger itself moves to the top and the rail grows downward, never behind the controls. */
@media(max-width:420px){
  #joy{--guideSize:98px;--knobSize:48px}.joyWrap{left:14px!important;bottom:max(14px,env(safe-area-inset-bottom))!important;width:146px!important;height:146px!important}
  #yJoyV246{right:68px;width:92px;height:142px}.sliderDock{right:122px!important;bottom:176px!important;gap:4px!important}.brand .brandMetaV246{font-size:8.5px;gap:5px}.brand .hqLine{font-size:12px}
  .dock.open{position:fixed!important;top:max(6px,env(safe-area-inset-top))!important;right:5px!important;bottom:auto!important;z-index:1600!important}
  .dock.open .dockToggle{position:relative!important;z-index:2!important}
  .dock.open .rail{display:grid!important;position:absolute!important;top:64px!important;right:0!important;bottom:auto!important;width:48px!important;max-height:calc(100vh - 78px)!important;overflow:auto!important;z-index:1!important}
  #bagQuickV246{right:5px;bottom:84px;width:42px;height:42px}
}
`;document.head.appendChild(s)}

function currentY(){return Number(($('#yRead')?.textContent||'0').match(/-?\d+(?:\.\d+)?/)?.[0]||0)}
function dispatchY(y){const c=$('#yControl');if(!c)return;const r=c.getBoundingClientRect(),t=Math.max(0,Math.min(1,y/40)),cy=r.top+(1-t)*r.height;for(const type of ['pointerdown','pointerup'])c.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:8844,pointerType:'touch',clientX:r.left+r.width/2,clientY:cy,buttons:type==='pointerdown'?1:0}))}
function stopY(){clearInterval(yInterval);yInterval=null;yDir=0;const k=$('#yJoyV246 .yKnob');if(k)k.style.transform='translateY(0)'}
function moveY(e){const joy=$('#yJoyV246'),k=$('#yJoyV246 .yKnob');if(!joy)return;const r=joy.getBoundingClientRect(),rel=(e.clientY-(r.top+r.height/2))/(r.height/2);yDir=rel<-.12?1:rel>.12?-1:0;if(k)k.style.transform=`translateY(${Math.max(-38,Math.min(38,rel*44))}px)`;clearInterval(yInterval);if(!yDir)return;const tick=()=>{const y=currentY(),next=Math.max(0,Math.min(40,Math.round((y+yDir*.5)*10)/10));if(next===y){stopY();return}dispatchY(next);const out=$('#yJoyV246 .yReadout');if(out)out.textContent=`Y ${next.toFixed(1)}`};tick();yInterval=setInterval(tick,120)}
function installYJoy(){if($('#yJoyV246'))return true;if(!$('#yControl'))return false;$('#yJoyV245')?.remove();const j=document.createElement('div');j.id='yJoyV246';j.innerHTML='<div class="yTitle">Y 模式（升降）</div><div class="yPlane"></div><div class="yGuide"></div><div class="yPlus">Y+</div><div class="yMinus">Y−</div><div class="yKnob">Y</div><div class="yReadout">Y 0.0</div>';document.body.appendChild(j);j.addEventListener('pointerdown',e=>{e.preventDefault();yPid=e.pointerId;try{j.setPointerCapture?.(yPid)}catch{}moveY(e)});j.addEventListener('pointermove',e=>{if(e.pointerId===yPid){e.preventDefault();moveY(e)}});for(const ev of ['pointerup','pointercancel','lostpointercapture'])j.addEventListener(ev,e=>{if(e.pointerId===yPid){yPid=null;stopY()}});return true}
function installXZLabels(){const joy=$('#joy');if(!joy)return false;for(const [id,text,css] of [['joyV246Up','Z+','top:7px;left:50%;transform:translateX(-50%)'],['joyV246Down','Z−','bottom:7px;left:50%;transform:translateX(-50%)'],['joyV246Left','X−','left:6px;top:50%;transform:translateY(-50%)'],['joyV246Right','X+','right:6px;top:50%;transform:translateY(-50%)']]){if($('#'+id))continue;const n=document.createElement('span');n.id=id;n.textContent=text;n.style.cssText=`position:absolute;${css};font-size:8px;font-weight:900;color:#68e4ff;pointer-events:none;z-index:3`;joy.appendChild(n)}const k=$('#knob');if(k){k.textContent='K';k.classList.remove('leftYCenter','yUp','yDown');k.dataset.yCenterInstalled='v246-separate'}return true}
function taiwanTime(){return new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',hour12:false,month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date()).replace('24:','00:')}
function stampBrand(){const b=document.querySelector('.brand b');if(!b)return;b.innerHTML='<span class="hqLine"><span class="hqFlag" aria-hidden="true">🇺🇸</span><span>11520 花果山美國（華爾街）</span></span><span class="brandMetaV246"><span>V2.4.6 · 5D K線西遊記</span><span class="brandClockV246" id="brandClockV246"></span></span>';const tick=()=>{const n=$('#brandClockV246');if(n)n.textContent='台灣 '+taiwanTime()};tick();if(!clockTimer)clockTimer=setInterval(tick,1000)}

function findBagSource(){return [...document.querySelectorAll('#rail button,.rail button')].find(b=>/背包|🎒/.test((b.textContent||'')+' '+(b.title||'')))||null}
function installQuickBag(){if($('#bagQuickV246'))return true;const src=findBagSource();if(!src)return false;const b=document.createElement('button');b.id='bagQuickV246';b.type='button';b.textContent='🎒';b.title='背包';b.setAttribute('aria-label','背包');b.onclick=()=>src.click();document.body.appendChild(b);src.style.display='none';return true}
function clearCenterBlockers(){const keep=new Set(['three','lookPad','joy','yJoyV246','toast','waypointAction','aiChatPanel','sheet','confirm']);for(const el of document.body.children){if(keep.has(el.id)||el.closest?.('.top,.axes,.tele,.monsterHud,.minimapWrap,.controls,.dock,.sliderDock'))continue;const cs=getComputedStyle(el),r=el.getBoundingClientRect(),txt=(el.textContent||'').trim();if(!['fixed','absolute'].includes(cs.position))continue;if(r.width<innerWidth*.55||r.width>innerWidth*.94||r.height<42||r.height>115)continue;if(r.top<innerHeight*.52||r.bottom>innerHeight*.79)continue;if(txt.length>2)continue;el.style.display='none';el.dataset.v246Cleared='1'}}
function scheduleCleanup(){clearTimeout(cleanupTimer);cleanupTimer=setTimeout(()=>{installQuickBag();clearCenterBlockers()},80)}
function updateAiCopy(){const msgs=$('#aiMsgs');if(!msgs||msgs.dataset.v246ControlHelp)return;msgs.dataset.v246ControlHelp='1';const n=document.createElement('div');n.className='aiMsg';n.textContent='V2.4.6：左下 XZ 遙桿可直接從中央拖動，控制移動與角色朝向；右下 Y 遙桿獨立升降；背包移到 AI 下方。';msgs.appendChild(n)}
export function install11520ProductFixes(){const knob=$('#knob');if(knob)knob.dataset.yCenterInstalled='v246-separate';const result=installV23();const ready=()=>{const k=$('#knob');if(k)k.dataset.yCenterInstalled='v246-separate';ensureStyle();stampBrand();updateAiCopy();const ok=installXZLabels()&&installYJoy();scheduleCleanup();return ok};if(!ready()){const mo=new MutationObserver(()=>{scheduleCleanup();if(ready())mo.disconnect()});mo.observe(document.documentElement,{childList:true,subtree:true})}else{const mo=new MutationObserver(scheduleCleanup);mo.observe(document.body,{childList:true,subtree:true})}return{...result,version:'2.4.6',features:[...(result?.features||[]).filter(x=>x!=='left-center-y'),'one-image-one-life-layout','restored-xz-center-touch','xz-heading-rotation','dedicated-y-joystick','quick-bag-under-ai','top-opening-organ-rail','center-obstruction-cleanup','wall-street-brand-flag-clock']}}
