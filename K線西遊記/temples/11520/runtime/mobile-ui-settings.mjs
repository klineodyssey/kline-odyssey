import './mobile-action-rail-clearance-runtime.mjs';
import {SHARED_GAME_VERSION} from '../../../../assets/kaios-world-registry.mjs';
/* KGEN_META
VERSION: 2.6.17
REVISION: 2026-11-01.HUD-R2-PREF1
ACTUAL_AUTHOR: Codex original technical executor / 01a189ef-ecbc-7699-b87b-a4538d57c029
SOURCE_COMMIT: a4957c9cfcec952187228d0801e36a38f61d8497
TASK_ID: K11520-FIRST-VIEW-ZERO-CARDS-NATURE-20261012-001
CHANGE_REASON: Restore discoverable cockpit HUD while preserving saved master/organ preferences and independent trade confirmation.
STATUS: ACTIVE
FORMAL_ORGAN_NAME: Mobile UI Settings
PURPOSE: One lower-right settings console owns HUD visibility. Legacy scattered drawer toggles are retired from the visible UI; chat has an explicit expand/collapse handle; wallet and backpack are protected organs; right-rail hit targets stay separated on mobile. Formal filename is version-free.
*/
const $=s=>document.querySelector(s);
const STORE='k11520.ui.settings';
const LEGACY_STORE='k11520.ui.settings.v267';
const LEGACY_CLEAN='11520.play.cleanMode';
const SURFACES=[
  ['hud','上方 HUD','.top'],
  ['markets','三軸行情','.axes'],
  ['status','世界/生命狀態','.tele,.monsterHud'],
  ['map','小地圖','.minimapWrap'],
  ['combat','戰鬥按鈕','.controls'],
  ['params','C / 口數','.sliderDock'],
  ['chat','聊天','#chatHandle,#gameChat'],
  ['ai','AI 助手','#aiChatButton'],
  ['music','音樂','#bgmButton'],
  ['dock','器官選單','#dock']
];
const PROTECTED=['#walletPanel','#walletToggle','#walletConnect','#backpackButton'];
let state=Object.fromEntries(SURFACES.map(([k])=>[k,true])),allOn=true;
const HUD_PROFILES=['MINIMAL','STANDARD','FULL'];
const MARKET_IDLE_MS=15000;
const UI_REVISION='HUD-R2-PREF1';
const INFO_KEYS=['hud','markets','status','map'];
const disclosedSurfaces=new Set();
let profile='MINIMAL',marketOpen=false,marketTimer=0,marketPointers=new Set(),controlsOpen=false,infoOpen=false;
// V2.9.6 candidate: transient disclosure never changes saved organ preferences.
let settingsInstalled=false,worldFirstBound=false;
// Human 2026-10-05 12:43: hide/inert the background right HUD while
// Settings owns the foreground, including partly covered C/lots/Y rails.
// Preserve each organ's values/preferences; this owns only interaction.
const SETTINGS_BACKGROUND='#k11520UtilityMaster,#cargoInterceptionButton,#homeDeliveryButton,#whiteholeEscortButton,#dock,#gameModeToggle,#walletToggle,#walletPanel,#chatHandle,#gameChat,#bgmButton,#aiChatButton,#aiChatPanel,#backpackButton,#backpackPanel,#k11520HudCollapseAll,#kaiosPortalButton,#playerCourierDetails,#playerBanditPanel,#k11520RealTradePreflight,#k11520MarketRow,#k11520ControlsClose,#cControl,#lotsControl,#yControl,.sliderDock,.controls';
const settingsInertBefore=new Map();
let settingsWasOpen=false,settingsEscapeBound=false;
function syncSettingsContext(){
  const open=!!$('#k11520UiSettings')?.classList.contains('open');
  document.documentElement.classList.toggle('k11520SettingsOpen',open);
  $('#gameModeToggle')?.setAttribute('aria-expanded',String(open));
  if(open){
    for(const el of document.querySelectorAll(SETTINGS_BACKGROUND)){
      if(!settingsInertBefore.has(el))settingsInertBefore.set(el,el.hasAttribute('inert'));
      if(!el.inert)el.inert=true;
    }
  }else if(settingsWasOpen){
    for(const [el,inert] of settingsInertBefore)el.inert=inert;
    settingsInertBefore.clear();
  }
  settingsWasOpen=open;
  document.dispatchEvent(new CustomEvent('k11520:settings-context',{detail:{open}}));
}
function setSettingsOpen(open){
  $('#k11520UiSettings')?.classList.toggle('open',open);syncSettingsContext();
  if(open)$('#k11520UiSettingsClose')?.focus({preventScroll:true});
  else $('#gameModeToggle')?.focus({preventScroll:true});
}
// Visibility stays in this existing owner; geometry remains in Mobile Control Layout.
export const WORLD_FIRST_HUD_POLICY=Object.freeze({
  ALWAYS_VISIBLE:['player/world'],
  CONTEXTUAL:['faint idle movement outline / stronger while held','explicitly retained movement/lots/C controls','explicit information cards','explicit trade context','camera recenter','target details','missile details','delivery details'],
  EVENT_ONLY:['warning','arrival','robbery','insurance','mission complete'],
  MANUAL:['wallet','backpack','settings','chat','audio'],
});

function load(){try{const raw=localStorage.getItem(STORE)||localStorage.getItem(LEGACY_STORE)||'{}',x=JSON.parse(raw);for(const k of Object.keys(state))if(typeof x[k]==='boolean')state[k]=x[k];if(typeof x.allOn==='boolean')allOn=x.allOn;if(HUD_PROFILES.includes(x.profile))profile=x.profile}catch{}marketOpen=false;disclosedSurfaces.clear();controlsOpen=allOn&&state.params;infoOpen=allOn}
function save(){try{localStorage.setItem(STORE,JSON.stringify({...state,allOn,profile}))}catch{}}
function syncWorldFirst(){
  const root=document.documentElement;root.dataset.k11520HudProfile=profile;root.dataset.k11520HudMode='ON_DEMAND';
  root.classList.toggle('k11520MarketOpen',marketOpen||infoOpen);
  root.classList.toggle('k11520TradeOpen',marketOpen);
  root.classList.toggle('k11520ControlsOpen',controlsOpen);root.classList.toggle('k11520InfoOpen',infoOpen);
  const row=$('#k11520MarketRow');if(row){row.hidden=false;row.inert=false;row.tabIndex=0;row.textContent=infoOpen?'資訊×':'ⓘ';row.title=infoOpen?'收合資訊卡；保留操作控制':'資訊卡／操作顯示設定';row.setAttribute('aria-label',row.title);row.setAttribute('aria-expanded',String(infoOpen));row.removeAttribute('aria-hidden');row.onclick=()=>{if(infoOpen)closeInformation();else setSettingsOpen(true)}}
  const close=$('#k11520ControlsClose');if(close){close.hidden=!controlsOpen;close.setAttribute('aria-expanded',String(controlsOpen));close.title=allOn&&state.params?'收合操作；保留已設定的口數與 C':'操作縱桿已在設定隱藏；可由資訊設定叫回'}
  // CSS plus the capture guard suppress hidden actions. Do not overwrite
  // financial owners' hidden/inert/disabled flags, including changes made idle.
  for(const el of document.querySelectorAll('#orderFire,#flat')){
    el.dataset.k11520ContextSuppressed=marketOpen?'0':'1';
  }
  if(globalThis.__K11520_UI_SETTINGS__)Object.assign(globalThis.__K11520_UI_SETTINGS__,{tradeOpen:marketOpen,controlsOpen,infoOpen});
  document.dispatchEvent(new CustomEvent('k11520:hud-context',{detail:{tradeOpen:marketOpen,controlsOpen,infoOpen}}));
}
function cancelControlInput(){document.dispatchEvent(new CustomEvent('k11520:controls-cancel-input'))}
function setControlsOpen(open){if(!open){cancelControlInput();hideMarketCards();disclosedSurfaces.delete('params')}controlsOpen=!!open;apply();document.dispatchEvent(new CustomEvent('k11520:controls-context',{detail:{open:controlsOpen}}))}
function showControls(){if($('#k11520UiSettings')?.classList.contains('open'))setSettingsOpen(false);document.documentElement.classList.remove('k11520HudCollapsed');controlsOpen=true;disclosedSurfaces.add('params');apply()}
function showInformation(){if($('#k11520UiSettings')?.classList.contains('open'))setSettingsOpen(false);document.documentElement.classList.remove('k11520HudCollapsed');infoOpen=true;for(const key of INFO_KEYS)disclosedSurfaces.add(key);apply()}
function closeInformation(){hideMarketCards();infoOpen=false;for(const key of INFO_KEYS)disclosedSurfaces.delete(key);apply()}
function hideMarketCards(){clearTimeout(marketTimer);marketPointers.clear();marketOpen=false;syncWorldFirst()}
function scheduleMarketHide(){
  clearTimeout(marketTimer);if(!marketOpen||marketPointers.size)return;
  marketTimer=setTimeout(hideMarketCards,MARKET_IDLE_MS);
}
function showMarketCards(){if($('#k11520UiSettings')?.classList.contains('open'))setSettingsOpen(false);controlsOpen=true;infoOpen=true;marketOpen=true;for(const key of ['params',...INFO_KEYS])disclosedSurfaces.add(key);apply();scheduleMarketHide()}
function ensureBuildStamp(){let stamp=$('#k11520BuildStamp');if(!stamp){stamp=document.createElement('small');stamp.id='k11520BuildStamp';document.body.appendChild(stamp)}stamp.textContent=`${SHARED_GAME_VERSION} · UI:${UI_REVISION}`;stamp.title='已載入的 UI 來源修訂；不代表 Git／PWA 全部資源已更新';document.documentElement.dataset.k11520UiRevision=UI_REVISION}
function installWorldFirst(){
  if(worldFirstBound)return;worldFirstBound=true;
  const panel=$('#k11520UiSettings'),picker=document.createElement('select');picker.id='k11520HudProfile';picker.className='full';picker.setAttribute('aria-label','HUD 顯示模式');
  for(const value of HUD_PROFILES){const opt=document.createElement('option');opt.value=value;opt.textContent={MINIMAL:'MINIMAL · 世界優先',STANDARD:'STANDARD · 狀態資訊',FULL:'FULL HUD · 完整資訊'}[value];picker.appendChild(opt)}
  picker.value=profile;picker.onchange=()=>{profile=picker.value;infoOpen=profile!=='MINIMAL';for(const key of INFO_KEYS)infoOpen?disclosedSurfaces.add(key):disclosedSurfaces.delete(key);save();apply()};panel?.appendChild(picker);
  for(const [id,label,act] of [['k11520ShowControls','顯示操作：移動／口數／C',showControls],['k11520ShowInformation','顯示資訊：行情／座標／小地圖',showInformation],['k11520ShowTrade','交易／點火資訊（仍須下單確認）',showMarketCards],['k11520HideTrade','收合資訊卡；保留操作',closeInformation]]){if($('#'+id))continue;const button=document.createElement('button');button.id=id;button.type='button';button.className='btn full';button.textContent=label;button.onclick=act;panel?.appendChild(button)}
  let close=$('#k11520ControlsClose');if(!close){close=document.createElement('button');close.id='k11520ControlsClose';close.type='button';close.textContent='收操作 ×';close.setAttribute('aria-label','收合操作控制；保留口數與 C');document.body.appendChild(close);close.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();cancelControlInput();try{close.setPointerCapture(e.pointerId)}catch{}},{passive:false});close.addEventListener('pointerup',e=>{e.preventDefault();e.stopPropagation();setControlsOpen(false);try{close.releasePointerCapture(e.pointerId)}catch{}},{passive:false});close.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setControlsOpen(false)})}
  let row=$('#k11520MarketRow');if(!row){row=document.createElement('button');row.id='k11520MarketRow';row.type='button';document.body.appendChild(row)}
  document.addEventListener('k11520:movement-context',e=>{if(e.detail?.active)setControlsOpen(true)});
  const axes=$('#axes');
  document.addEventListener('pointerdown',e=>{if(marketOpen&&e.target.closest?.('#axes,#cControl,#lotsControl,#yControl,.controls')){marketPointers.add(e.pointerId);clearTimeout(marketTimer)}},true);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,e=>{if(marketPointers.delete(e.pointerId))scheduleMarketHide()},true);
  // Key/input activity restarts the idle interval; a held pointer never loses its card.
  for(const type of ['keydown','input','focusin','pointermove'])axes?.addEventListener(type,scheduleMarketHide);
  // An explicit stationary hold in the existing joystick requests information,
  // never a click/order. Plane changes and movement no longer reveal cards.
  document.addEventListener('k11520:trade-context',e=>{if(e.detail?.open===true&&e.detail?.source==='joystick-hold')showMarketCards();else if(e.detail?.open===false)hideMarketCards()});
  document.addEventListener('click',e=>{if(!marketOpen&&e.target.closest?.('#orderFire,#flat')){e.preventDefault();e.stopImmediatePropagation()}},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeInformation();setControlsOpen(false)}});
  addEventListener('blur',hideMarketCards);document.addEventListener('visibilitychange',()=>{if(document.hidden)hideMarketCards()});syncWorldFirst();
}
function retireLegacyCleanMode(){if(document.body?.classList.contains('game-clean-mode'))document.body.classList.remove('game-clean-mode');try{if(localStorage.getItem(LEGACY_CLEAN)!=='0')localStorage.setItem(LEGACY_CLEAN,'0')}catch{}}
function retireLegacyDrawerToggles(){for(const btn of document.querySelectorAll('.hud-drawer-toggle')){btn.hidden=true;btn.setAttribute('aria-hidden','true');btn.tabIndex=-1}for(const el of document.querySelectorAll('.axes,.tele,.monsterHud,.minimapWrap,.sliderDock'))el.classList.remove('hud-collapsed-left','hud-collapsed-right','hud-collapsed-top')}
function style(){if($('#k11520UiSettingsStyle'))return;const s=document.createElement('style');s.id='k11520UiSettingsStyle';s.textContent=`
.hud-drawer-toggle{display:none!important;visibility:hidden!important;pointer-events:none!important}
#gameModeToggle{position:fixed!important;z-index:7080!important;right:5px!important;left:auto!important;top:auto!important;bottom:278px!important;width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;border-radius:12px!important;display:grid!important;place-items:center!important;font-size:16px!important}
body:has(#dock.open) #gameModeToggle{visibility:hidden!important;pointer-events:none!important}
#k11520UiSettings{position:fixed;z-index:8200;right:54px;top:270px;width:220px;max-width:calc(100vw - 66px);padding:8px;border:1px solid #68e4ff66;border-radius:14px;background:#071018f5;box-shadow:0 14px 40px #000c;display:none;grid-template-columns:1fr 1fr;gap:5px 7px;font:800 9px system-ui,"Noto Sans TC",sans-serif;color:#e9fbff}
#k11520UiSettings.open{display:grid}
html.k11520SettingsOpen :is(${SETTINGS_BACKGROUND}){visibility:hidden!important;pointer-events:none!important}
html.k11520SettingsOpen .sliderDock{display:none!important}
#k11520UiSettings.open{z-index:12500;isolation:isolate}
#k11520UiSettings .head{grid-column:1/-1;display:flex;align-items:center;gap:6px;margin-bottom:2px;color:#f1ca73;font-size:11px}
#k11520UiSettings .head b{flex:1}#k11520UiSettings .head button{width:28px;height:28px;border-radius:9px;border:1px solid #68e4ff44;background:#10202d;color:#fff}
#k11520UiSettings .row{display:grid;grid-template-columns:1fr 38px;align-items:center;gap:4px;min-height:25px;white-space:nowrap}
#k11520UiSettings .row span{overflow:hidden;text-overflow:ellipsis}
#k11520UiSettings .sw{position:relative;width:36px;height:18px;padding:0;border:1px solid #68e4ff55;border-radius:999px;background:#31151a;touch-action:manipulation}
#k11520UiSettings .sw::after{content:'';position:absolute;left:2px;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;transition:transform .12s}
#k11520UiSettings .sw[aria-checked='true']{background:#0e5a46}#k11520UiSettings .sw[aria-checked='true']::after{transform:translateX(18px)}
#k11520UiSettings .full{grid-column:1/-1}.k11520HiddenBySettings{display:none!important}
#k11520ControlsClose{position:fixed;right:max(58px,calc(env(safe-area-inset-right) + 52px));top:68px;bottom:auto;min-width:64px;min-height:44px;z-index:7100;border:1px solid #68e4ff66;border-radius:10px;background:#071018e8;color:#dffaff;touch-action:manipulation}
#k11520ControlsClose[hidden]{display:none!important}
#k11520BuildStamp{position:fixed;left:max(6px,env(safe-area-inset-left));top:max(4px,env(safe-area-inset-top));z-index:12001;max-width:calc(100vw - 64px);padding:3px 5px;border-radius:5px;background:#071018f2;color:#dffaff;font:700 10px system-ui,sans-serif;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}
#k11520UiSettings{max-height:calc(100dvh - 64px);overflow:auto;top:32px}
@media(orientation:landscape) and (max-height:600px){#k11520ControlsClose{left:212px;right:auto;top:66px;bottom:auto;width:64px}#k11520UiSettings{top:16px;max-height:calc(100dvh - 32px)}}
#backpackButton.bagRelocatedV258{position:fixed!important;z-index:7050!important;right:5px!important;bottom:70px!important;width:46px!important;height:46px!important;min-width:46px!important;min-height:46px!important;margin:0!important;display:grid!important;place-items:center!important}
@media(max-width:420px){.sliderDock{bottom:222px!important}#k11520UiSettings{top:32px;right:54px;width:220px}#gameChat.open{right:54px!important;max-width:calc(100vw - 66px)!important}}
`;
document.head.appendChild(s)}
function targets(sel){try{return [...document.querySelectorAll(sel)]}catch{return[]}}
function applyOne(key,on){const spec=SURFACES.find(x=>x[0]===key);if(!spec)return;for(const el of targets(spec[2])){const hidden=!on;if(el.classList.contains('k11520HiddenBySettings')!==hidden)el.classList.toggle('k11520HiddenBySettings',hidden);if(key==='chat'&&hidden&&el.id==='gameChat')el.classList.remove('open')}}
function protectWalletBackpack(){for(const sel of PROTECTED)for(const el of targets(sel)){el.classList.remove('k11520HiddenBySettings');el.removeAttribute('aria-hidden')}const bag=$('#backpackButton');if(bag){bag.dataset.k11520ProtectedOrgan='1';bag.style.removeProperty('display')}const wallet=$('#walletPanel');if(wallet)wallet.dataset.k11520ProtectedOrgan='1'}
function apply(){retireLegacyCleanMode();retireLegacyDrawerToggles();for(const [k] of SURFACES)applyOne(k,allOn&&state[k]||disclosedSurfaces.has(k)&&(k==='params'?controlsOpen:infoOpen));protectWalletBackpack();ensureBuildStamp();syncWorldFirst();syncSettingsContext();const p=$('#k11520UiSettings');if(p)for(const b of p.querySelectorAll('[data-ui-key]')){const k=b.dataset.uiKey,v=String(k==='all'?allOn:state[k]);if(b.getAttribute('aria-checked')!==v)b.setAttribute('aria-checked',v)}globalThis.__K11520_UI_SETTINGS__={organ:'Mobile UI Settings',version:'2.6.17',profile,tradeOpen:marketOpen,controlsOpen,infoOpen,candidateProductVersion:SHARED_GAME_VERSION,uiRevision:UI_REVISION,marketIdleMs:MARKET_IDLE_MS,policy:WORLD_FIRST_HUD_POLICY,allOn,state:{...state},legacyDrawerTogglesRetired:true,protectedOrgans:['wallet','backpack'],chatReplacesY:true,walletHitTargetProtected:true,chatToggleExplicit:true}}
function toggleKey(key){if(key==='all'){allOn=!allOn;disclosedSurfaces.clear();if(!allOn){cancelControlInput();controlsOpen=false;infoOpen=false;hideMarketCards()}}else{state[key]=!state[key];disclosedSurfaces.delete(key);if(state[key])allOn=true}save();apply()}
async function toggleFullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();else await document.exitFullscreen?.()}catch{}syncFullscreen()}
function syncFullscreen(){const b=$('#k11520FullscreenSwitch');if(b)b.setAttribute('aria-checked',String(!!document.fullscreenElement))}
function makeLauncher(){let old=$('#gameModeToggle');if(!old)return null;if(old.dataset.k11520UiSettings)return old;const launcher=old.cloneNode(true);launcher.removeAttribute('onclick');launcher.dataset.k11520UiSettings='1';launcher.textContent='⚙';launcher.title='介面展開收合設定';launcher.setAttribute('aria-label','介面展開收合設定');old.replaceWith(launcher);return launcher}
function installPanel(){let p=$('#k11520UiSettings');if(!p){p=document.createElement('section');p.id='k11520UiSettings';p.setAttribute('role','dialog');p.setAttribute('aria-label','介面展開收合設定');const rows=[['all','全部介面'],...SURFACES.map(([k,n])=>[k,n])].map(([k,n])=>`<label class="row ${k==='all'?'full':''}"><span>${n}</span><button type="button" class="sw" role="switch" aria-checked="true" data-ui-key="${k}" aria-label="${n} 右開左關"></button></label>`).join('');p.innerHTML=`<div class="head"><b>⚙ 介面收合設定</b><small>←關　開→</small><button id="k11520UiSettingsClose" type="button">×</button></div>${rows}<label class="row full"><span>瀏覽器全螢幕</span><button id="k11520FullscreenSwitch" type="button" class="sw" role="switch" aria-checked="false" aria-label="全螢幕 右開左關"></button></label><button id="journeyReplay" type="button" class="btn full" style="min-height:44px">重播取經序章</button>`;document.body.appendChild(p);p.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setSettingsOpen(false)}else if(e.key==='Tab'){const controls=[...p.querySelectorAll('button,select,input,[tabindex]')].filter(el=>!el.disabled&&el.tabIndex>=0),first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}});$('#journeyReplay').onclick=()=>{setSettingsOpen(false);if(document.documentElement.classList.contains('k11520UtilitiesOpen'))$('#k11520UtilityMaster')?.click();dispatchEvent(new Event('k11520:replay-journey'))};p.addEventListener('click',e=>{const b=e.target.closest?.('[data-ui-key]');if(b){e.preventDefault();toggleKey(b.dataset.uiKey)}});$('#k11520UiSettingsClose').onclick=()=>setSettingsOpen(false);$('#k11520FullscreenSwitch').onclick=e=>{e.preventDefault();toggleFullscreen()}}
  const launcher=makeLauncher();if(launcher&&!launcher.dataset.k11520Handlers){launcher.dataset.k11520Handlers='1';for(const type of ['pointerdown','pointerup','touchstart','touchend'])launcher.addEventListener(type,e=>{e.stopImmediatePropagation()},{capture:true,passive:false});launcher.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();retireLegacyCleanMode();setSettingsOpen(!p.classList.contains('open'));apply();syncFullscreen()},{capture:true})}return !!launcher}
function ensureWallet(){const p=$('#walletPanel'),t=$('#walletToggle'),c=$('#walletConnect');if(!p||!t||!c)return false;t.setAttribute('aria-label','展開或收合 11520 錢包');c.setAttribute('aria-label','連線瀏覽器 EVM 錢包');p.dataset.k11520ProtectedOrgan='1';return true}
function ensureBackpack(){const canonical=$('#backpackButton');if(!canonical)return false;canonical.dataset.k11520RealBag='1';canonical.dataset.k11520ProtectedOrgan='1';canonical.classList.add('bagRelocatedV250','bagRelocatedV258');canonical.title='背包 / 活體收納';canonical.setAttribute('aria-label','背包 / 活體收納；開啟後可捕捉附近牛魚蝦雞鴨並保留 LIFE_ID');canonical.style.removeProperty('display');const panel=$('#backpackPanel');if(panel){panel.dataset.k11520CanonicalBackpack='1';const h=panel.querySelector('.bpHead b');if(h&&(h.textContent||'')!=='🎒 花果山背包 · 活體收納')h.textContent='🎒 花果山背包 · 活體收納'}return true}
function ensureChatToggle(){const handle=$('#chatHandle'),panel=$('#gameChat');if(!handle||!panel)return false;if(handle.dataset.k11520ChatToggle)return true;handle.dataset.k11520ChatToggle='1';handle.setAttribute('aria-controls','gameChat');const sync=()=>{const open=panel.classList.contains('open');handle.setAttribute('aria-expanded',String(open));handle.title=open?'收合聊天':'展開聊天'};handle.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();panel.classList.toggle('open');sync()},{capture:true});sync();return true}
function criticalNode(n){return n?.nodeType===1&&(n.id==='gameModeToggle'||n.id==='walletPanel'||n.id==='walletToggle'||n.id==='walletConnect'||n.id==='backpackButton'||n.id==='chatHandle'||n.id==='gameChat'||n.classList?.contains('hud-drawer-toggle')||n.querySelector?.('#gameModeToggle,#walletPanel,#walletToggle,#walletConnect,#backpackButton,#chatHandle,#gameChat,.hud-drawer-toggle'))}
function boot(){if(settingsInstalled)return globalThis.__K11520_UI_SETTINGS__;settingsInstalled=true;if(!settingsEscapeBound){document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#k11520UiSettings')?.classList.contains('open')){e.preventDefault();e.stopImmediatePropagation();setSettingsOpen(false)}},true);settingsEscapeBound=true}style();load();retireLegacyCleanMode();retireLegacyDrawerToggles();installPanel();ensureWallet();ensureBackpack();ensureChatToggle();apply();document.addEventListener('fullscreenchange',syncFullscreen);for(const delay of [120,400,1000,2200])setTimeout(()=>{installPanel();retireLegacyDrawerToggles();ensureWallet();ensureBackpack();ensureChatToggle();apply()},delay);try{globalThis.__K11520_UI_SETTINGS_OBSERVER__?.disconnect()}catch{}let timer=0;const mo=new MutationObserver(mutations=>{if(mutations.some(m=>m.type==='attributes'&&m.target.id==='k11520UiSettings'))syncSettingsContext();const relevant=mutations.some(m=>(m.type==='attributes'&&m.target===document.body&&document.body.classList.contains('game-clean-mode'))||(m.type==='childList'&&[...m.addedNodes,...m.removedNodes].some(criticalNode)));if(!relevant||timer)return;timer=setTimeout(()=>{timer=0;retireLegacyCleanMode();retireLegacyDrawerToggles();installPanel();ensureWallet();ensureBackpack();ensureChatToggle();apply()},100)});mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});globalThis.__K11520_UI_SETTINGS_OBSERVER__=mo;return globalThis.__K11520_UI_SETTINGS__}
export function install11520MobileUiSettings(){const result=boot();installWorldFirst();return result}
