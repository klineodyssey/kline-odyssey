/* KGEN_META
VERSION: 2.4.0
REVISION: 2026-10-06.TOAST-DISMISSAL-PLACEMENT
PRODUCT_CONTEXT: V2.9.5
STATUS: ACTIVE
LAST_UPDATED: 2026-10-06
UPDATED_BY: dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER / HUMAN_AUTHORIZED_2026_10_05
REVIEWED_BY: dot / independent scoped metadata and provenance review / 2026-10-06; no registered Reviewer role or release approval
SOURCE_COMMIT: de5c876bb713b0d4bbd7b6de4c84c11d27b4e9e9
TASK_ID: K11520-SIMULATION-TRADING-P0-20261006
CHANGE_REASON: Preserve visible toast placement at dismissal while retaining next-message and trading-panel context updates.
ANCESTOR: K線西遊記/temples/11520/runtime/game-ui-product-fixes-v23.mjs @ de5c876bb713b0d4bbd7b6de4c84c11d27b4e9e9
SOURCE_OF_TRUTH: TRUE
PURPOSE: Playable 11520 product behavior: mobile clearance, center-Y, fixed Y/C/Lots controls, canonical floors, compass, local AI help, BGM and intro.
*/
import {C_DETENTS,signedTravelFromC} from '../controls/nonlinear-controls.mjs';
import {signedUniverseAddress} from './spatial-coordinate-runtime.mjs';
import {getKaiosAudio} from '../../../../assets/kaios-audio.mjs';
import {mountAudioControl} from '../../../../assets/kaios-audio-ui.mjs';
const isGame=typeof document!=='undefined'&&/\/temples\/11520\/game-5d\.html$/i.test(globalThis.location?.pathname||'');
const A='./assets/ui/';
const MIN_GAP=14;

// Presentation only. This observes already-accepted game state; it never awards
// XP, loot, wallet credit, economic claims or changes combat outcomes.
export const WORLD_FEEDBACK=Object.freeze({MONSTER_DETECTED:'附近有取經怪物',WEAK_POINT:'WEAK POINT · 六相弱點命中',BOSS_SPAWN:'三市場魔王現身',BOSS_PHASE_CHANGE:'魔王進入下一戰鬥階段',BOSS_RAGE:'魔王狂暴 · 留意距離',BOSS_LOW_HP:'魔王瀕危 · 最後攻勢',BOSS_DEFEAT:'BOSS DEFEATED · 取經勝利',COMMON_LOOT:'掉寶出現 · 遊戲道具',RARE_LOOT:'RARE · 稀有遊戲戰利品',EPIC_LOOT:'EPIC · 史詩遊戲戰利品',LEGENDARY_LOOT:'LEGENDARY · 傳說遊戲戰利品',PLAYER_LEVEL_UP:'LEVEL UP! · 玩家內容解鎖',ENGINE_LEVEL_UP:'GA600 LEVEL UP! · 遊戲訓練成長',GA600_LEVEL_UP:'GA600 LEVEL UP! · 遊戲訓練成長',HOME_BUILD:'第一間草屋落成',HOME_UPGRADE:'起家地升級',PORTAL_OPEN:'返回 KAIOS 總世界',WORLD_ENTER:'花果山 · 旅程開始',QUEST_COMPLETE:'取經任務完成'});
export function createWorldFeedbackObserver(emit){
  let previous=null;
  return state=>{
    const next={...state};if(!previous){previous=next;return []}
    const events=[];
    if(next.playerId!==previous.playerId){previous=next;return events}
    if(next.level>previous.level)events.push('PLAYER_LEVEL_UP');
    if(next.engineLevel>previous.engineLevel)events.push('ENGINE_LEVEL_UP');
    if(next.houseLevel>previous.houseLevel)events.push(previous.houseLevel===0?'HOME_BUILD':'HOME_UPGRADE');
    if(next.questComplete&&!previous.questComplete)events.push('QUEST_COMPLETE');
    if(next.bossAlive){
      if(!previous.bossAlive||next.encounter!==previous.encounter)events.push('BOSS_SPAWN');
      else if(next.phase!==previous.phase)events.push('BOSS_PHASE_CHANGE');
    }
    previous=next;for(const event of events)emit(event);return events;
  };
}
const feedbackHistory=[];
let toastContextObserver=null;
// Reuse the one toast inside the active trading panel's existing header. Direct
// route/joystick writers still address #toast; context changes do not reset time.
function place11520Toast(toast){
  const confirm=document.getElementById('confirm'),sheet=document.getElementById('sheet'),body=document.getElementById('sheetBody');
  const organ=body?.dataset.simOrgan,title=['orders','positions','history'].includes(organ)?document.querySelector('#rail [data-organ="'+organ+'"]')?.getAttribute('title'):null;
  const panel=confirm?.classList.contains('open')?confirm:sheet?.classList.contains('open')&&title&&document.getElementById('sheetTitle')?.textContent===title?sheet:null;
  const header=panel?.querySelector('.sheetHead');
  if(header){
    if(toast.parentElement!==header)header.appendChild(toast);
    toast.dataset.panelContext=panel.id;
    for(const key of ['top','bottom','left','transform','max-width','box-sizing','font-size'])toast.style.removeProperty(key);
    return;
  }
  if(toast.parentElement!==document.body)document.body.appendChild(toast);
  delete toast.dataset.panelContext;
  const guide=document.getElementById('k11520MonsterGuide')?.getBoundingClientRect();
  if(guide?.width>0){
    for(const [key,value] of Object.entries({top:(guide.bottom+6)+'px',bottom:'auto',left:guide.left+'px',transform:'none','max-width':guide.width+'px','box-sizing':'border-box','font-size':'10px'}))toast.style.setProperty(key,value,'important');
    const height=toast.getBoundingClientRect().height;
    if(guide.bottom+6+height>innerHeight-6)toast.style.setProperty('top',Math.max(6,guide.top-6-height)+'px','important');
  }
}
function install11520ToastContext(){
  const toast=document.getElementById('toast');if(!toast)return;
  toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');
  if(!toastContextObserver){
    toastContextObserver=new MutationObserver(records=>{
      // Dismissal starts an opacity fade; keep its placement until the next
      // message. Actual panel-context changes must still move the same node.
      if(records.every(record=>record.target===toast)&&!toast.classList.contains('show'))return;
      place11520Toast(toast);
    });
    for(const id of ['confirm','sheet','toast']){const node=document.getElementById(id);if(node)toastContextObserver.observe(node,{attributes:true,attributeFilter:['class']})}
    const body=document.getElementById('sheetBody');if(body)toastContextObserver.observe(body,{attributes:true,attributeFilter:['data-sim-organ']});
    const title=document.getElementById('sheetTitle');if(title)toastContextObserver.observe(title,{childList:true,characterData:true,subtree:true});
  }
  place11520Toast(toast);
}
function dispose11520ToastContext(){toastContextObserver?.disconnect();toastContextObserver=null}
if(isGame)addEventListener('pageshow',install11520ToastContext);
// One placement/timer owner for ordinary gameplay and world-event messages.
export function show11520Toast(text,{combat=false,event='',duration=1700}={}){
  if(typeof document==='undefined')return;
  const toast=document.getElementById('toast');if(!toast)return;
  clearTimeout(show11520Toast.timer);toast.textContent=text;toast.dataset.kspaceFeedback=String(combat);
  if(event)toast.dataset.worldEvent=event;else delete toast.dataset.worldEvent;
  toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.style.transition='opacity .2s';toast.classList.add('show');toast.style.pointerEvents='none';toast.style.zIndex='2147482000';
  install11520ToastContext();
  // Keep placement while opacity fades. Clearing it at dismissal moves still-
  // visible loot text back into the HUD. The next message replaces placement;
  // pagehide remains the cleanup owner. No extra timer or DOM node is needed.
  show11520Toast.timer=setTimeout(()=>{toast.classList.remove('show');delete toast.dataset.worldEvent},duration);
}
export function emit11520WorldFeedback(event){
  const label=WORLD_FEEDBACK[event];if(!label)return false;
  getKaiosAudio().play(event);feedbackHistory.push({event,at:Date.now()});if(feedbackHistory.length>32)feedbackHistory.shift();
  if(typeof document!=='undefined'){
    show11520Toast(label,{event,duration:2000});
    const stage=document.getElementById('three');if(stage&&!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches){emit11520WorldFeedback.animation?.cancel();emit11520WorldFeedback.animation=stage.animate?.([{filter:'brightness(1)'},{filter:'brightness(1.12)'},{filter:'brightness(1)'}],{duration:420})}
    // One disposable visual cue, not a permanent HUD or pointer interceptor.
    document.getElementById('journeyEventFx')?.remove();clearTimeout(emit11520WorldFeedback.fxTimer);
    const fx=document.createElement('div');fx.id='journeyEventFx';fx.setAttribute('aria-hidden','true');fx.dataset.event=event;
    const engine=/ENGINE|GA600/.test(event),rare=/RARE|EPIC|LEGENDARY/.test(event),boss=event.startsWith('BOSS'),color=engine?'#7dfbff':rare?'#d59cff':boss?'#ff9b69':'#ffe89d';
    fx.style.cssText=`position:fixed;pointer-events:none;z-index:510;left:50%;top:47%;width:${rare?34:150}px;height:${rare?160:150}px;border:3px solid ${color};border-radius:${rare?'45%':'50%'};transform:translate(-50%,-50%);box-shadow:0 0 24px ${color}88,inset 0 0 18px ${color}44;opacity:.8`;
    document.body.append(fx);if(!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)fx.animate?.([{opacity:.8,transform:'translate(-50%,-50%) scale(.45)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.4)'}],{duration:900,fill:'forwards'});
    emit11520WorldFeedback.fxTimer=setTimeout(()=>fx.remove(),1000);
  }
  return true;
}
globalThis.__K11520_WORLD_AUDIO__=Object.freeze({snapshot:()=>({events:feedbackHistory.map(row=>({...row})),authority:'PRESENTATION_ONLY'})});
if(typeof document!=='undefined')addEventListener('pagehide',()=>{dispose11520ToastContext();clearTimeout(show11520Toast.timer);clearTimeout(emit11520WorldFeedback.fxTimer);emit11520WorldFeedback.animation?.cancel();document.getElementById('journeyEventFx')?.remove();const toast=document.getElementById('toast');if(toast){toast.classList.remove('show');delete toast.dataset.worldEvent;for(const key of ['z-index','top','bottom','left','transform','max-width','box-sizing','font-size'])toast.style.removeProperty(key)}});

function installCss(){
  if(document.getElementById('k11520ProductFixesStyleV23'))return;
  const s=document.createElement('style');s.id='k11520ProductFixesStyleV23';s.textContent=`
.energyTap{position:absolute;z-index:18;left:50%;top:3px;width:31px;height:31px;transform:translateX(-50%);border:1px solid #68e4ff88;border-radius:9px;background:#0b1822ee center/27px 27px no-repeat;padding:0;box-shadow:0 4px 14px #0008;touch-action:manipulation}.energyTap::after{content:attr(data-step);position:absolute;left:50%;top:29px;transform:translateX(-50%);white-space:nowrap;font-size:6px;color:#9deaff}.sliderDock .thumb{height:16px!important;width:36px!important;border-radius:9px!important;background:#173f56!important;border:1px solid var(--cyan)!important}#yEnergyTap{background-image:url('${A}goddess-ui.webp')}#cEnergyTap{background-image:url('${A}ufo-ui.png')}#lotsEnergyTap{background-image:url('${A}brand-k-ui.webp')}
#knob.leftYCenter{pointer-events:auto!important;display:grid!important;place-items:center!important;color:#dffaff!important;font-size:9px!important;font-weight:900!important;user-select:none!important}#knob.leftYCenter.yUp{border-color:#7cf6ad!important;box-shadow:0 0 20px #7cf6ad66!important}#knob.leftYCenter.yDown{border-color:#ffb079!important;box-shadow:0 0 20px #ffb07966!important}.universeFloorBadge{display:block;margin-top:3px;padding-top:3px;border-top:1px solid #68e4ff22;font-size:7px;color:#9deaff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.universeFloorBadge b{color:#f4d77f}.universeFloorBadge em{font-style:normal;color:#dffaff}
#minimapCompass{position:absolute;z-index:9;left:6px;right:6px;top:24px;bottom:17px;pointer-events:none;color:#dffaff;font-size:9px;font-weight:900;text-shadow:0 1px 4px #000}#minimapCompass .h{position:absolute;left:8px;right:8px;top:50%;height:1px;background:#68e4ff99}#minimapCompass .v{position:absolute;top:8px;bottom:8px;left:50%;width:1px;height:auto;background:#68e4ff99}#minimapCompass b{position:absolute;line-height:1;margin:0}.mcN{left:50%;top:0;transform:translateX(-50%);color:#fff3a8}.mcS{left:50%;bottom:0;transform:translateX(-50%)}.mcE{right:0;top:50%}.mcW{left:0;top:50%}
#walletPanel.collapsed{display:block!important;width:46px!important;height:50px!important;padding:6px!important;overflow:hidden!important;right:8px!important;left:auto!important}#walletPanel.collapsed .walletHead b,#walletPanel.collapsed #walletConnect,#walletPanel.collapsed #walletRefresh,#walletPanel.collapsed #walletMsg,#walletPanel.collapsed .walletGrid{display:none!important}#walletPanel.collapsed .walletHead{display:block!important}#walletPanel.collapsed #walletToggle{width:34px!important;height:38px!important;padding:0!important}
#kaiosPortalButton{position:fixed;z-index:985;right:8px;bottom:400px;width:46px;height:46px;border-radius:13px;border:1px solid #f1ca7366;background:#101923ee;color:#f1ca73;box-shadow:0 7px 24px #0009;font-weight:900}#aiChatButton,#bgmButton{position:fixed;z-index:985;right:8px;width:46px;height:46px;border-radius:13px;border:1px solid #68e4ff66;background:#101923ee;color:#9eeeff;box-shadow:0 7px 24px #0009;font-weight:800}#aiChatButton{bottom:292px}#bgmButton{bottom:346px;color:#ffd978}#aiChatPanel{position:fixed;z-index:2400;left:10px;right:64px;bottom:12px;max-height:66vh;border:1px solid #ff8df077;border-radius:16px;background:#08131df8;display:none;overflow:hidden}#aiChatPanel.open{display:grid;grid-template-rows:auto 1fr auto}.aiHead{display:flex;padding:10px;gap:8px}.aiHead b{flex:1}.aiMsgs{padding:10px;overflow:auto;min-height:160px;max-height:42vh}.aiMsg{margin:5px 0;padding:8px 10px;border-radius:12px;background:#122230}.aiMsg.user{margin-left:12%;background:#28324c}.aiComposer{display:grid;grid-template-columns:1fr 42px;gap:6px;padding:10px}.aiComposer input{min-width:0;background:#071019;border:1px solid #68e4ff33;border-radius:10px;padding:9px}.aiComposer button,.aiHead button{background:#10202d;border:1px solid #68e4ff44;border-radius:10px}
#intro11520{position:fixed;z-index:5000;inset:0;background:radial-gradient(circle at 50% 45%,#153257 0,#071018 45%,#020407 100%);display:grid;place-items:center;transition:opacity .45s}.introCore{text-align:center;width:min(92vw,430px);padding:18px}.introLogo{width:108px;height:108px;margin:auto;border-radius:50%;background:url('${A}brand-k-ui.webp') center/cover;box-shadow:0 0 44px #68e4ff33}.introTitle{margin-top:16px;color:#f5d680;font-size:24px;font-weight:900}.introSub{margin-top:5px;color:#9deaff}.introPath{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:16px 0 8px}.introPath span{display:grid;place-items:center;min-height:62px;padding:7px 5px;border:1px solid #68e4ff33;border-radius:12px;background:#07121dcc;color:#dff8ff;font-size:11px;line-height:1.25}.introPath b{display:block;color:#f5d680;font-size:16px}.introHint{color:#93a6b8;font-size:10px;line-height:1.45}.introSkip{margin-top:14px;border:1px solid #68e4ff66;background:linear-gradient(180deg,#17344a,#0d1722);border-radius:12px;padding:11px 20px;min-width:150px;font-weight:900;box-shadow:0 8px 28px #0007}#intro11520.hide{opacity:0;pointer-events:none}
@media(max-width:420px){.energyTap{width:27px;height:27px;background-size:23px 23px}.energyTap::after{display:none}#walletPanel.collapsed{width:42px!important;height:44px!important;padding:4px!important}#walletPanel.collapsed #walletToggle{width:32px!important;height:34px!important}#aiChatButton,#bgmButton{right:5px;width:42px;height:42px}#aiChatButton{bottom:138px}#bgmButton{bottom:186px}#kaiosPortalButton{right:5px!important;bottom:234px!important;width:42px!important;height:42px!important}}
`;document.head.appendChild(s);
}

function dispatchVertical(control,t){if(!control)return false;const r=control.getBoundingClientRect(),y=r.top+(1-Math.max(0,Math.min(1,t)))*r.height;for(const type of['pointerdown','pointerup'])control.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:7711,pointerType:'touch',clientX:r.left+r.width/2,clientY:y,buttons:type==='pointerdown'?1:0}));return true}
function currentY(){return Number(globalThis.__K11520_WORLD_COORDS__?.physical?.y)||0}
function installEnergyTaps(){
  const specs=[
    ['yControl','yEnergyTap','Y +5',()=>Math.min(1,(currentY()>=40?0:currentY()+5)/40)],
    ['cControl','cEnergyTap','C 下一階',()=>{const n=Number((document.getElementById('cRead')?.textContent||'0').replace('C','')),i=Math.max(0,C_DETENTS.indexOf(n)),next=C_DETENTS[(i+1)%C_DETENTS.length];return(1+signedTravelFromC(next))/2}],
    ['lotsControl','lotsEnergyTap','口數 +1',()=>{const n=Number((document.getElementById('lotsRead')?.textContent||'1').match(/\d+/)?.[0]||1);return(n>=100?1:n+1)/100}]
  ];
  let ok=true;for(const[cid,id,label,getT]of specs){const c=document.getElementById(cid);if(!c){ok=false;continue}if(document.getElementById(id))continue;const b=document.createElement('button');b.id=id;b.className='energyTap';b.type='button';b.dataset.step=label;b.title=label;b.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault()});b.addEventListener('click',e=>{e.stopPropagation();dispatchVertical(c,getT())});c.appendChild(b)}return ok;
}

let yTimer=null,tapTimer=null,taps=0;
function center(){return document.getElementById('knob')}
function paint(t,d=0){const b=center();if(!b)return;b.classList.add('leftYCenter');b.classList.toggle('yUp',d>0);b.classList.toggle('yDown',d<0);b.textContent=t}
function stopY(){if(yTimer)clearInterval(yTimer);if(tapTimer)clearTimeout(tapTimer);yTimer=tapTimer=null;taps=0;paint('Y')}
function startY(dir){stopY();paint(dir>0?'Y+':'Y−',dir);const tick=()=>{const y=currentY(),next=Math.max(0,Math.min(40,Math.round((y+dir*.5)*10)/10));if(next===y)return stopY();dispatchVertical(document.getElementById('yControl'),next/40)};tick();yTimer=setInterval(tick,180)}
function installCenterY(){const b=center(),joy=document.getElementById('joy');if(!b||!joy)return false;if(b.dataset.yCenterInstalled)return true;b.dataset.yCenterInstalled='1';paint('Y');let down=null,moved=false;b.addEventListener('pointerdown',e=>{e.stopPropagation();down={x:e.clientX,y:e.clientY};moved=false});b.addEventListener('pointermove',e=>{e.stopPropagation();if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>8)moved=true});b.addEventListener('pointerup',e=>{e.stopPropagation();if(moved){down=null;stopY();return}down=null;if(yTimer)return stopY();taps++;if(tapTimer)clearTimeout(tapTimer);paint(taps>=2?'Y− 1s':'Y+ 1s');tapTimer=setTimeout(()=>{const n=taps;taps=0;tapTimer=null;startY(n>=2?-1:1)},1000)});joy.addEventListener('pointerdown',e=>{if(e.target!==b)stopY()},{capture:true});return true}

function floorOf(x){const n=Number(x);if(!Number.isFinite(n)||n===0)return null;const {k,alpha}=signedUniverseAddress(n);return{k,alpha,label:k<0?`B${-k}`:`k=${k}`}}
function updateFloors(){const cards=[...document.querySelectorAll('#axes [data-axis]')];if(!cards.length)return false;for(const c of cards){let b=c.querySelector('.universeFloorBadge');if(!b){b=document.createElement('span');b.className='universeFloorBadge';c.appendChild(b)}const q=Number((c.querySelector('.q')?.textContent||'').replace(/[$,]/g,'')),f=floorOf(q),market=c.querySelector('select')?.value||'--';const next=f?`宇宙層：<b>${f.label}</b> · <em>${market}</em> · α ${f.alpha.toFixed(4)}`:'宇宙層：<b>WAIT</b>';if(b.innerHTML!==next)b.innerHTML=next}return true}
function watchFloors(){const a=document.getElementById('axes');if(!a)return false;if(!a.dataset.floorWatch){a.dataset.floorWatch='1';new MutationObserver(()=>queueMicrotask(updateFloors)).observe(a,{childList:true,subtree:true,characterData:true})}return updateFloors()}
function compass(){const w=document.querySelector('.minimapWrap');if(!w||!document.getElementById('minimap'))return false;if(!document.getElementById('minimapCompass')){const c=document.createElement('div');c.id='minimapCompass';c.innerHTML='<i class="h"></i><i class="v"></i><b class="mcN">N·Z+</b><b class="mcE">E·X+</b><b class="mcS">S·Z−</b><b class="mcW">W·X−</b>';w.appendChild(c)}return true}
function gap(a,b){const dx=Math.max(0,Math.max(a.left,b.left)-Math.min(a.right,b.right)),dy=Math.max(0,Math.max(a.top,b.top)-Math.min(a.bottom,b.bottom));return dx&&dy?Math.hypot(dx,dy):Math.max(dx,dy)}
function clearance(){if(innerWidth>420)return true;const j=document.getElementById('joy'),d=document.getElementById('dodge');if(!j||!d)return false;const g=gap(j.getBoundingClientRect(),d.getBoundingClientRect());j.dataset.dodgeGap=g.toFixed(1);j.dataset.mobileClearance=g>=MIN_GAP?'PASS':'FAIL';return g>=MIN_GAP}

function localAiReply(q){if(/怎麼玩|新手|取經|打怪|掉寶/.test(q))return'新手路線：0C 先走路取經、靠近守關怪並攻擊掉寶；想交易時再把 C 推到 ±0.001～±1。>1C 目前鎖定。不用連錢包也能先玩模擬世界。';if(/宇宙|樓層|B12|11520/.test(q))return'Universe Elevator：k=floor(log10(abs(x)))；0.0000000000011520 = B12；11520 = k=4。';if(/座標|方向|Z\+|X\+/.test(q))return'世界座標：Z+ 是北、X+ 是東，Y 是高度；小地圖與世界地圖都使用同一套座標。';if(/Y|高度/.test(q))return'左下 XZ 遙桿中央：單擊後 1 秒啟動 Y+；雙擊後 1 秒啟動 Y−；移動 XZ 或再點中央會停止。';if(/交易|下單|錢包/.test(q))return'目前交易是模擬/本機帳本；錢包只讀，不自動簽名、不轉帳、不送 Mainnet。';return'11520 AI 本機說明可回答座標、導航、宇宙樓層、Y 控制與交易安全邊界。'}
let aiVoiceOn=true;
function speakAi(text){if(!aiVoiceOn||!text)return false;const audio=getKaiosAudio();if(audio.snapshot().unlocked)return audio.speak(text);if(globalThis.navigator?.userActivation?.isActive){audio.unlock().then(ok=>{if(ok&&aiVoiceOn)audio.speak(text)});return true}return false}
function installPortalNav(){if(document.getElementById('kaiosPortalButton'))return true;const b=document.createElement('button');b.id='kaiosPortalButton';b.type='button';b.textContent='🌌';b.title='回 KAIOS 總世界';b.setAttribute('aria-label','回 KAIOS 總世界');b.onclick=async()=>{b.disabled=true;emit11520WorldFeedback('PORTAL_OPEN');await getKaiosAudio().transitionToWorld('PORTAL');location.href='../../../'};addEventListener('pageshow',()=>{b.disabled=false});document.body.appendChild(b);return true}
function installAi(){if(document.getElementById('aiChatButton'))return true;const b=document.createElement('button');b.id='aiChatButton';b.type='button';b.textContent='AI';document.body.appendChild(b);const p=document.createElement('section');p.id='aiChatPanel';p.innerHTML='<div class="aiHead"><b>🧚 11520 AI 客服</b><button id="aiVoice" type="button" aria-label="AI 語音開關">🔊</button><button id="aiClose" type="button">×</button></div><div class="aiMsgs" id="aiMsgs"><div class="aiMsg">可問座標、導航、宇宙樓層。</div></div><div class="aiComposer"><input id="aiInput" placeholder="輸入問題"><button id="aiSend" type="button">➤</button></div>';document.body.appendChild(p);const msgs=p.querySelector('#aiMsgs'),input=p.querySelector('#aiInput');const send=()=>{const q=input.value.trim();if(!q)return;input.value='';const u=document.createElement('div');u.className='aiMsg user';u.textContent=q;msgs.appendChild(u);const reply=localAiReply(q),a=document.createElement('div');a.className='aiMsg';a.textContent=reply;msgs.appendChild(a);msgs.scrollTop=msgs.scrollHeight;speakAi(reply)};b.onclick=()=>p.classList.toggle('open');p.querySelector('#aiClose').onclick=()=>p.classList.remove('open');const voice=p.querySelector('#aiVoice');voice.onclick=()=>{aiVoiceOn=!aiVoiceOn;voice.textContent=aiVoiceOn?'🔊':'🔇';if(!aiVoiceOn&&'speechSynthesis' in globalThis)speechSynthesis.cancel()};p.querySelector('#aiSend').onclick=send;input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();send()}});return true}

function stopBgm(){getKaiosAudio().setMusicEnabled(false)}
let enteredWorld=false;
function startBgm(){const audio=getKaiosAudio();audio.setWorld('11520');audio.setMusicEnabled(true);audio.unlock().then(ok=>{if(ok&&!enteredWorld){enteredWorld=true;emit11520WorldFeedback('WORLD_ENTER')}}).catch(()=>{});return true}
function gameSfx(kind='hit'){
  return getKaiosAudio().play(kind);
}
globalThis.__K11520_AUDIO_FX__={play:gameSfx,speak:speakAi,startBgm,stopBgm};
function installBgm(){if(document.getElementById('bgmButton'))return true;const audio=getKaiosAudio();audio.setWorld('11520');const b=document.createElement('button');b.id='bgmButton';b.type='button';b.textContent='🔊';b.title='KAIOS 聲音設定';b.setAttribute('aria-label','KAIOS 聲音設定');document.body.appendChild(b);mountAudioControl({button:b,world:'11520'});globalThis.__K11520_BGM__={version:'2.0.0',title:'花果山・星際戰場',original:true,synthetic:true,start:startBgm,stop:stopBgm,get playing(){return audio.snapshot().playing},get contextState(){return audio.snapshot().contextState}};return true}
// The persistent bootstrap marker owns entry even after its overlay is removed.
// A late optional skin must never reopen an intro over the running game.
function intro(){if(document.getElementById('k11520Bootstrap')||sessionStorage.getItem('11520.intro.seen.v2')||document.getElementById('intro11520'))return true;const o=document.createElement('div');o.id='intro11520';o.innerHTML='<div class="introCore"><div class="introLogo"></div><div class="introTitle">11520 花果山 5D</div><div class="introSub">先取經，再交易。你的市場冒險從 0C 開始。</div><div class="introPath"><span><b>①</b>走路取經<br>探索 XYZ</span><span><b>②</b>斬妖掉寶<br>累積戰利品</span><span><b>③</b>0.001C<br>解鎖 K 場交易</span></div><div class="introHint">不用連錢包也能先玩 · 0 手續費模擬交易 · >1C 高速模式暫鎖</div><button class="introSkip" type="button">開始取經</button></div>';document.body.appendChild(o);const close=(withAudio=false)=>{sessionStorage.setItem('11520.intro.seen.v2','1');if(withAudio){startBgm();speakAi('歡迎來到花果山。先用左下搖桿取經，找到附近妖怪，靠近後按打怪。')}o.classList.add('hide');setTimeout(()=>o.remove(),480)};o.querySelector('button').onclick=()=>close(true);setTimeout(()=>close(false),6000);return true}

export function install11520ProductFixes(){if(!isGame)return{ok:false,reason:'NOT_11520_GAME'};const root=document.documentElement;if(root.dataset.k11520ProductFixesInstalled==='1')return{ok:true,alreadyInstalled:true};root.dataset.k11520ProductFixesInstalled='1';install11520ToastContext();installCss();installPortalNav();installAi();installBgm();intro();const ready=()=>installEnergyTaps()&&installCenterY()&&watchFloors()&&compass()&&clearance();if(!ready()){const mo=new MutationObserver(()=>{if(ready())mo.disconnect()});mo.observe(document.documentElement,{childList:true,subtree:true})}addEventListener('resize',()=>requestAnimationFrame(clearance));return{ok:true,features:['mobile-layout-single-owner','joystick-clearance','left-center-y','fixed-energy-icons','canonical-floors','north-up-compass','kaios-portal-nav','ai-send-reply','original-synthetic-bgm','bgm','intro']}}
