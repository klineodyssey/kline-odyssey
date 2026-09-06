/* KGEN_META
VERSION: 2.4.8
STATUS: ACTIVE
PURPOSE: Right-positive X control, one real backpack, no center look-pad blocker, fixed dock toggle, dedicated XZ/Y controls.
*/
import {install11520ProductFixes as installV23} from './game-ui-product-fixes-v23.mjs';
const $=s=>document.querySelector(s);
let clockTimer=null,yPid=null,yInterval=null,yDir=0,cleanupTimer=null;

function ensureStyle(){
  if($('#k11520V248Style'))return;
  $('#k11520V246Style')?.remove();$('#k11520V247Style')?.remove();
  const s=document.createElement('style');s.id='k11520V248Style';s.textContent=`
.brand .hqLine{display:flex!important;align-items:center;gap:5px;font-weight:900}.brand .hqFlag{font-size:14px}.brand .brandMetaV248{display:flex;align-items:center;gap:7px;margin-top:2px;font-size:10px;line-height:1.2;color:#9eabbc;font-weight:700;white-space:nowrap}.brand .brandClockV248{color:#70e5c0;font-variant-numeric:tabular-nums}
#lookPad{display:none!important;pointer-events:none!important}
#joy{--guideSize:104px;--knobSize:50px}.joyWrap{touch-action:none!important}
#joy .joyPlane{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;border-radius:50%!important;pointer-events:none!important}
#joy .joyGuide{position:absolute!important;width:var(--guideSize)!important;height:var(--guideSize)!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;border-radius:50%!important;pointer-events:none!important}
#joy #knob{position:absolute!important;width:var(--knobSize)!important;height:var(--knobSize)!important;left:50%!important;top:50%!important;margin-left:calc(var(--knobSize)/-2)!important;margin-top:calc(var(--knobSize)/-2)!important;pointer-events:none!important;display:grid!important;place-items:center!important;color:#fff!important;font-weight:900!important}
#joy .joyPlane:after{content:'XZ 模式（移動 + 旋轉）'!important;left:0!important;right:0!important;text-align:center!important;top:-20px!important}
#yControl{display:none!important}.sliderDock{right:174px!important;bottom:178px!important}.sliderDock #cControl,.sliderDock #lotsControl{display:block!important}
#yJoyV248{position:fixed;z-index:452;width:104px;height:146px;right:66px;bottom:max(14px,env(safe-area-inset-bottom));touch-action:none;user-select:none}
#yJoyV248 .yTitle{position:absolute;left:0;right:0;top:-20px;text-align:center;color:#f1ca73;font-size:8px;font-weight:900;white-space:nowrap}#yJoyV248 .yPlane{position:absolute;left:9px;right:9px;top:0;bottom:0;border-radius:52px;border:2px solid #f1ca7390;background:#07141de8}#yJoyV248 .yGuide{position:absolute;left:26px;right:26px;top:28px;bottom:28px;border-radius:36px;border:1px solid #68e4ff38;pointer-events:none}#yJoyV248 .yKnob{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;border:2px solid #68e4ff;background:#17445f;display:grid;place-items:center;color:#fff;font-weight:900;pointer-events:none;transform:translateY(0)}#yJoyV248 .yPlus,#yJoyV248 .yMinus{position:absolute;left:0;right:0;text-align:center;font-size:10px;font-weight:900;color:#f1ca73;pointer-events:none}#yJoyV248 .yPlus{top:8px}#yJoyV248 .yMinus{bottom:8px}#yJoyV248 .yReadout{position:absolute;left:0;right:0;bottom:-16px;text-align:center;color:#9deaff;font-size:8px;pointer-events:none}
#bagQuickV246,#bagQuickV247{display:none!important}.bagRelocatedV248{position:fixed!important;z-index:990!important;right:5px!important;bottom:84px!important;width:42px!important;height:42px!important;border-radius:13px!important;margin:0!important;display:grid!important;place-items:center!important}
.dock,.dock.open{top:auto!important;right:5px!important;bottom:max(10px,env(safe-area-inset-bottom))!important;position:fixed!important}.dock .dockToggle,.dock.open .dockToggle{position:relative!important;top:auto!important;right:auto!important;bottom:auto!important}
@media(max-width:420px){#joy{--guideSize:98px;--knobSize:48px}.joyWrap{left:14px!important;bottom:max(14px,env(safe-area-inset-bottom))!important;width:146px!important;height:146px!important}#yJoyV248{right:68px;width:92px;height:142px}.sliderDock{right:122px!important;bottom:176px!important;gap:4px!important}.brand .brandMetaV248{font-size:8.5px;gap:5px}.brand .hqLine{font-size:12px}.dock.open .rail{max-height:calc(100vh - 110px)!important;overflow:auto!important}.bagRelocatedV248{right:5px!important;bottom:84px!important}}
`;
  document.head.appendChild(s);
}

function currentY(){return Number(($('#yRead')?.textContent||'0').match(/-?\d+(?:\.\d+)?/)?.[0]||0)}
function dispatchY(y){const c=$('#yControl');if(!c)return;const r=c.getBoundingClientRect(),t=Math.max(0,Math.min(1,y/40)),cy=r.top+(1-t)*r.height;for(const type of ['pointerdown','pointerup'])c.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:8844,pointerType:'touch',clientX:r.left+r.width/2,clientY:cy,buttons:type==='pointerdown'?1:0}))}
function stopY(){clearInterval(yInterval);yInterval=null;yDir=0;const k=$('#yJoyV248 .yKnob');if(k)k.style.transform='translateY(0)'}
function moveY(e){const joy=$('#yJoyV248'),k=$('#yJoyV248 .yKnob');if(!joy)return;const r=joy.getBoundingClientRect(),rel=(e.clientY-(r.top+r.height/2))/(r.height/2);yDir=rel<-.12?1:rel>.12?-1:0;if(k)k.style.transform=`translateY(${Math.max(-38,Math.min(38,rel*44))}px)`;clearInterval(yInterval);if(!yDir)return;const tick=()=>{const y=currentY(),next=Math.max(0,Math.min(40,Math.round((y+yDir*.5)*10)/10));if(next===y){stopY();return}dispatchY(next);const out=$('#yJoyV248 .yReadout');if(out)out.textContent=`Y ${next.toFixed(1)}`};tick();yInterval=setInterval(tick,120)}
function installYJoy(){if($('#yJoyV248'))return true;if(!$('#yControl'))return false;$('#yJoyV245')?.remove();$('#yJoyV246')?.remove();$('#yJoyV247')?.remove();const j=document.createElement('div');j.id='yJoyV248';j.innerHTML='<div class="yTitle">Y 模式（升降）</div><div class="yPlane"></div><div class="yGuide"></div><div class="yPlus">Y+</div><div class="yMinus">Y−</div><div class="yKnob">Y</div><div class="yReadout">Y 0.0</div>';document.body.appendChild(j);j.addEventListener('pointerdown',e=>{e.preventDefault();yPid=e.pointerId;try{j.setPointerCapture?.(yPid)}catch{}moveY(e)});j.addEventListener('pointermove',e=>{if(e.pointerId===yPid){e.preventDefault();moveY(e)}});for(const ev of ['pointerup','pointercancel','lostpointercapture'])j.addEventListener(ev,e=>{if(e.pointerId===yPid){yPid=null;stopY()}});return true}
function installXZLabels(){const joy=$('#joy');if(!joy)return false;for(const [id,text,css] of [['joyV248Up','Z+','top:7px;left:50%;transform:translateX(-50%)'],['joyV248Down','Z−','bottom:7px;left:50%;transform:translateX(-50%)'],['joyV248Left','X−','left:6px;top:50%;transform:translateY(-50%)'],['joyV248Right','X+','right:6px;top:50%;transform:translateY(-50%)']]){if($('#'+id))continue;const n=document.createElement('span');n.id=id;n.textContent=text;n.style.cssText=`position:absolute;${css};font-size:8px;font-weight:900;color:#68e4ff;pointer-events:none;z-index:3`;joy.appendChild(n)}const k=$('#knob');if(k){k.textContent='K';k.classList.remove('leftYCenter','yUp','yDown');k.dataset.yCenterInstalled='v248-separate'}return true}
function taiwanTime(){return new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',hour12:false,month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date()).replace('24:','00:')}
function stampBrand(){const b=document.querySelector('.brand b');if(!b)return;b.innerHTML='<span class="hqLine"><span class="hqFlag" aria-hidden="true">🇺🇸</span><span>11520 花果山美國（華爾街）</span></span><span class="brandMetaV248"><span>V2.4.8 · 5D K線西遊記</span><span class="brandClockV248" id="brandClockV248"></span></span>';const tick=()=>{const n=$('#brandClockV248');if(n)n.textContent='台灣 '+taiwanTime()};tick();if(!clockTimer)clockTimer=setInterval(tick,1000)}

function bagCandidates(){return [...document.querySelectorAll('button,[role="button"],[title],[aria-label]')].filter(el=>el.id!=='bagQuickV246'&&el.id!=='bagQuickV247'&&/背包|🎒/.test((el.textContent||'')+' '+(el.title||'')+' '+(el.getAttribute('aria-label')||'')))}
function placeOnlyRealBag(){
  $('#bagQuickV246')?.remove();$('#bagQuickV247')?.remove();
  const all=bagCandidates();if(!all.length)return false;
  let chosen=all.find(el=>el.classList.contains('bagRelocatedV248'));
  if(!chosen){chosen=all.map(el=>{const r=el.getBoundingClientRect();let score=(r.width>0&&r.height>0?50:0)+(el.onclick?40:0)+(el.closest('.rail,.dock')?0:80);return{el,score}}).sort((a,b)=>b.score-a.score)[0]?.el}
  if(!chosen)return false;
  for(const el of all){if(el!==chosen){el.classList.remove('bagRelocatedV248');el.style.display='none'}}
  chosen.classList.add('bagRelocatedV248');chosen.style.display='grid';
  if(chosen.parentElement!==document.body)document.body.appendChild(chosen);
  return true;
}
function clearCenterBlocker(){const p=$('#lookPad');if(p){p.style.display='none';p.style.pointerEvents='none'}for(const el of [...document.body.children]){if(el.id==='lookPad'||el.id==='three'||el.id==='joy'||el.id==='yJoyV248'||el.matches?.('.top,.axes,.tele,.monsterHud,.minimapWrap,.controls,.dock,.sliderDock'))continue;const cs=getComputedStyle(el),r=el.getBoundingClientRect(),txt=(el.textContent||'').replace(/\s+/g,'').trim();if(!['fixed','absolute'].includes(cs.position))continue;const central=r.left<innerWidth*.12&&r.right>innerWidth*.78&&r.top>innerHeight*.56&&r.top<innerHeight*.76&&r.height>=45&&r.height<=130;if(central&&txt.length<=4){el.remove()}}}
function scheduleCleanup(){clearTimeout(cleanupTimer);cleanupTimer=setTimeout(()=>{placeOnlyRealBag();clearCenterBlocker()},100)}
function updateAiCopy(){const msgs=$('#aiMsgs');if(!msgs||msgs.dataset.v248Help)return;msgs.dataset.v248Help='1';const n=document.createElement('div');n.className='aiMsg';n.textContent='V2.4.8：X 右移增加、左移減少；只保留一個真背包；中央空白操作條移除；右下選單鍵展開時固定原位。';msgs.appendChild(n)}
export function install11520ProductFixes(){const knob=$('#knob');if(knob)knob.dataset.yCenterInstalled='v248-separate';const result=installV23();const ready=()=>{const k=$('#knob');if(k)k.dataset.yCenterInstalled='v248-separate';ensureStyle();stampBrand();updateAiCopy();const ok=installXZLabels()&&installYJoy();scheduleCleanup();return ok};if(!ready()){const mo=new MutationObserver(()=>{scheduleCleanup();if(ready())mo.disconnect()});mo.observe(document.documentElement,{childList:true,subtree:true})}else{const mo=new MutationObserver(scheduleCleanup);mo.observe(document.body,{childList:true,subtree:true})}return{...result,version:'2.4.8',features:[...(result?.features||[]).filter(x=>x!=='left-center-y'),'x-right-positive','single-real-backpack','look-pad-blocker-removed','dock-toggle-fixed-in-place','restored-xz-center-touch','dedicated-y-joystick','wall-street-brand-flag-clock']}}
