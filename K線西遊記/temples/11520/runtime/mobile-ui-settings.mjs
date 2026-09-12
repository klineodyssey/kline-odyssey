import './mobile-action-rail-clearance-runtime.mjs';
/* KGEN_META
VERSION: 2.6.17
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

function load(){try{const raw=localStorage.getItem(STORE)||localStorage.getItem(LEGACY_STORE)||'{}',x=JSON.parse(raw);for(const k of Object.keys(state))if(typeof x[k]==='boolean')state[k]=x[k];if(typeof x.allOn==='boolean')allOn=x.allOn}catch{}}
function save(){try{localStorage.setItem(STORE,JSON.stringify({...state,allOn}))}catch{}}
function retireLegacyCleanMode(){if(document.body?.classList.contains('game-clean-mode'))document.body.classList.remove('game-clean-mode');try{if(localStorage.getItem(LEGACY_CLEAN)!=='0')localStorage.setItem(LEGACY_CLEAN,'0')}catch{}}
function retireLegacyDrawerToggles(){for(const btn of document.querySelectorAll('.hud-drawer-toggle')){btn.hidden=true;btn.setAttribute('aria-hidden','true');btn.tabIndex=-1}for(const el of document.querySelectorAll('.axes,.tele,.monsterHud,.minimapWrap,.sliderDock'))el.classList.remove('hud-collapsed-left','hud-collapsed-right','hud-collapsed-top')}
function style(){if($('#k11520UiSettingsStyle'))return;const s=document.createElement('style');s.id='k11520UiSettingsStyle';s.textContent=`
.hud-drawer-toggle{display:none!important;visibility:hidden!important;pointer-events:none!important}
#gameModeToggle{position:fixed!important;z-index:7080!important;right:5px!important;left:auto!important;top:auto!important;bottom:284px!important;width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;border-radius:12px!important;display:grid!important;place-items:center!important;font-size:16px!important}
body:has(#dock.open) #gameModeToggle{visibility:hidden!important;pointer-events:none!important}
#k11520UiSettings{position:fixed;z-index:8200;right:54px;top:270px;width:220px;max-width:calc(100vw - 66px);padding:8px;border:1px solid #68e4ff66;border-radius:14px;background:#071018f5;box-shadow:0 14px 40px #000c;display:none;grid-template-columns:1fr 1fr;gap:5px 7px;font:800 9px system-ui,"Noto Sans TC",sans-serif;color:#e9fbff}
#k11520UiSettings.open{display:grid}
#k11520UiSettings .head{grid-column:1/-1;display:flex;align-items:center;gap:6px;margin-bottom:2px;color:#f1ca73;font-size:11px}
#k11520UiSettings .head b{flex:1}#k11520UiSettings .head button{width:28px;height:28px;border-radius:9px;border:1px solid #68e4ff44;background:#10202d;color:#fff}
#k11520UiSettings .row{display:grid;grid-template-columns:1fr 38px;align-items:center;gap:4px;min-height:25px;white-space:nowrap}
#k11520UiSettings .row span{overflow:hidden;text-overflow:ellipsis}
#k11520UiSettings .sw{position:relative;width:36px;height:18px;padding:0;border:1px solid #68e4ff55;border-radius:999px;background:#31151a;touch-action:manipulation}
#k11520UiSettings .sw::after{content:'';position:absolute;left:2px;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;transition:transform .12s}
#k11520UiSettings .sw[aria-checked='true']{background:#0e5a46}#k11520UiSettings .sw[aria-checked='true']::after{transform:translateX(18px)}
#k11520UiSettings .full{grid-column:1/-1}.k11520HiddenBySettings{display:none!important}
#backpackButton.bagRelocatedV258{position:fixed!important;z-index:7050!important;right:5px!important;bottom:70px!important;width:46px!important;height:46px!important;min-width:46px!important;min-height:46px!important;margin:0!important;display:grid!important;place-items:center!important}
@media(max-width:420px){.sliderDock{bottom:222px!important}#k11520UiSettings{top:270px;right:54px;width:220px}#gameChat.open{right:54px!important;max-width:calc(100vw - 66px)!important}}
`;
document.head.appendChild(s)}
function targets(sel){try{return [...document.querySelectorAll(sel)]}catch{return[]}}
function applyOne(key,on){const spec=SURFACES.find(x=>x[0]===key);if(!spec)return;for(const el of targets(spec[2])){const hidden=!on;if(el.classList.contains('k11520HiddenBySettings')!==hidden)el.classList.toggle('k11520HiddenBySettings',hidden);if(key==='chat'&&hidden&&el.id==='gameChat')el.classList.remove('open')}}
function protectWalletBackpack(){for(const sel of PROTECTED)for(const el of targets(sel)){el.classList.remove('k11520HiddenBySettings');el.removeAttribute('aria-hidden')}const bag=$('#backpackButton');if(bag){bag.dataset.k11520ProtectedOrgan='1';bag.style.removeProperty('display')}const wallet=$('#walletPanel');if(wallet)wallet.dataset.k11520ProtectedOrgan='1'}
function apply(){retireLegacyCleanMode();retireLegacyDrawerToggles();for(const [k] of SURFACES)applyOne(k,allOn&&state[k]);protectWalletBackpack();const p=$('#k11520UiSettings');if(p)for(const b of p.querySelectorAll('[data-ui-key]')){const k=b.dataset.uiKey,v=String(k==='all'?allOn:state[k]);if(b.getAttribute('aria-checked')!==v)b.setAttribute('aria-checked',v)}globalThis.__K11520_UI_SETTINGS__={organ:'Mobile UI Settings',version:'2.6.17',allOn,state:{...state},legacyDrawerTogglesRetired:true,protectedOrgans:['wallet','backpack'],chatReplacesY:true,walletHitTargetProtected:true,chatToggleExplicit:true}}
function toggleKey(key){if(key==='all')allOn=!allOn;else{state[key]=!state[key];if(state[key])allOn=true}save();apply()}
async function toggleFullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();else await document.exitFullscreen?.()}catch{}syncFullscreen()}
function syncFullscreen(){const b=$('#k11520FullscreenSwitch');if(b)b.setAttribute('aria-checked',String(!!document.fullscreenElement))}
function makeLauncher(){let old=$('#gameModeToggle');if(!old)return null;if(old.dataset.k11520UiSettings)return old;const launcher=old.cloneNode(true);launcher.removeAttribute('onclick');launcher.dataset.k11520UiSettings='1';launcher.textContent='⚙';launcher.title='介面展開收合設定';launcher.setAttribute('aria-label','介面展開收合設定');old.replaceWith(launcher);return launcher}
function installPanel(){let p=$('#k11520UiSettings');if(!p){p=document.createElement('section');p.id='k11520UiSettings';p.setAttribute('aria-label','介面展開收合設定');const rows=[['all','全部介面'],...SURFACES.map(([k,n])=>[k,n])].map(([k,n])=>`<label class="row ${k==='all'?'full':''}"><span>${n}</span><button type="button" class="sw" role="switch" aria-checked="true" data-ui-key="${k}" aria-label="${n} 右開左關"></button></label>`).join('');p.innerHTML=`<div class="head"><b>⚙ 介面收合設定</b><small>←關　開→</small><button id="k11520UiSettingsClose" type="button">×</button></div>${rows}<label class="row full"><span>瀏覽器全螢幕</span><button id="k11520FullscreenSwitch" type="button" class="sw" role="switch" aria-checked="false" aria-label="全螢幕 右開左關"></button></label>`;document.body.appendChild(p);p.addEventListener('click',e=>{const b=e.target.closest?.('[data-ui-key]');if(b){e.preventDefault();toggleKey(b.dataset.uiKey)}});$('#k11520UiSettingsClose').onclick=()=>p.classList.remove('open');$('#k11520FullscreenSwitch').onclick=e=>{e.preventDefault();toggleFullscreen()}}
  const launcher=makeLauncher();if(launcher&&!launcher.dataset.k11520Handlers){launcher.dataset.k11520Handlers='1';for(const type of ['pointerdown','pointerup','touchstart','touchend'])launcher.addEventListener(type,e=>{e.stopImmediatePropagation()},{capture:true,passive:false});launcher.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();retireLegacyCleanMode();p.classList.toggle('open');apply();syncFullscreen()},{capture:true})}return !!launcher}
function ensureWallet(){const p=$('#walletPanel'),t=$('#walletToggle'),c=$('#walletConnect');if(!p||!t||!c)return false;t.setAttribute('aria-label','展開或收合 11520 錢包');c.setAttribute('aria-label','連線瀏覽器 EVM 錢包');p.dataset.k11520ProtectedOrgan='1';return true}
function ensureBackpack(){const canonical=$('#backpackButton');if(!canonical)return false;canonical.dataset.k11520RealBag='1';canonical.dataset.k11520ProtectedOrgan='1';canonical.classList.add('bagRelocatedV250','bagRelocatedV258');canonical.title='背包 / 活體收納';canonical.setAttribute('aria-label','背包 / 活體收納；開啟後可捕捉附近牛魚蝦雞鴨並保留 LIFE_ID');canonical.style.removeProperty('display');const panel=$('#backpackPanel');if(panel){panel.dataset.k11520CanonicalBackpack='1';const h=panel.querySelector('.bpHead b');if(h&&(h.textContent||'')!=='🎒 花果山背包 · 活體收納')h.textContent='🎒 花果山背包 · 活體收納'}return true}
function ensureChatToggle(){const handle=$('#chatHandle'),panel=$('#gameChat');if(!handle||!panel)return false;if(handle.dataset.k11520ChatToggle)return true;handle.dataset.k11520ChatToggle='1';handle.setAttribute('aria-controls','gameChat');const sync=()=>{const open=panel.classList.contains('open');handle.setAttribute('aria-expanded',String(open));handle.title=open?'收合聊天':'展開聊天'};handle.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();panel.classList.toggle('open');sync()},{capture:true});sync();return true}
function criticalNode(n){return n?.nodeType===1&&(n.id==='gameModeToggle'||n.id==='walletPanel'||n.id==='walletToggle'||n.id==='walletConnect'||n.id==='backpackButton'||n.id==='chatHandle'||n.id==='gameChat'||n.classList?.contains('hud-drawer-toggle')||n.querySelector?.('#gameModeToggle,#walletPanel,#walletToggle,#walletConnect,#backpackButton,#chatHandle,#gameChat,.hud-drawer-toggle'))}
function boot(){style();load();retireLegacyCleanMode();retireLegacyDrawerToggles();installPanel();ensureWallet();ensureBackpack();ensureChatToggle();apply();document.addEventListener('fullscreenchange',syncFullscreen);for(const delay of [120,400,1000,2200])setTimeout(()=>{installPanel();retireLegacyDrawerToggles();ensureWallet();ensureBackpack();ensureChatToggle();apply()},delay);try{globalThis.__K11520_UI_SETTINGS_OBSERVER__?.disconnect()}catch{}let timer=0;const mo=new MutationObserver(mutations=>{const relevant=mutations.some(m=>(m.type==='attributes'&&m.target===document.body&&document.body.classList.contains('game-clean-mode'))||(m.type==='childList'&&[...m.addedNodes,...m.removedNodes].some(criticalNode)));if(!relevant||timer)return;timer=setTimeout(()=>{timer=0;retireLegacyCleanMode();retireLegacyDrawerToggles();installPanel();ensureWallet();ensureBackpack();ensureChatToggle();apply()},100)});mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});globalThis.__K11520_UI_SETTINGS_OBSERVER__=mo;return globalThis.__K11520_UI_SETTINGS__}
export function install11520MobileUiSettings(){return boot()}
