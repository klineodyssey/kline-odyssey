/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE
PURPOSE: Human-first 11520 interaction layer. Keep avatar facing aligned with visible X movement, keep chat/modal surfaces above game HUD, collapse duplicate backpack controls to one real organ, and keep the wallet toggle anchored at one predictable location.
*/
import * as THREE from 'three';

const $=s=>document.querySelector(s);
let cleanupTimer=null;

function installStyle(){
  if($('#k11520HumanUxStyle'))return;
  const s=document.createElement('style');
  s.id='k11520HumanUxStyle';
  s.textContent=`
  #chatHandle{z-index:6100!important;min-width:46px!important;min-height:46px!important;display:grid!important;place-items:center!important}
  #gameChat,#aiChatPanel,.sheet,.confirm{z-index:6500!important}
  #gameChat.open,#aiChatPanel.open,.sheet.open,.confirm.open{pointer-events:auto!important}
  #chatClose,#aiClose,#sheetClose,#confirmX{position:relative!important;z-index:6502!important;min-width:42px!important;min-height:42px!important;touch-action:manipulation!important}
  #walletPanel,#walletPanel.collapsed{right:58px!important;bottom:230px!important}
  #walletPanel.collapsed{width:46px!important;height:46px!important;padding:4px!important;overflow:hidden!important}
  #walletPanel.collapsed .walletHead{width:38px!important;height:38px!important;margin:0!important}
  #walletToggle{min-width:38px!important;min-height:38px!important;touch-action:manipulation!important}
  .bagRelocatedV250,.bagRelocatedV258,[data-k11520-real-bag='1']{min-width:44px!important;min-height:44px!important;touch-action:manipulation!important}
  #dockToggle,#aiChatButton,#bgmButton,#gameModeToggle{min-width:44px!important;min-height:44px!important;touch-action:manipulation!important}
  button[data-k11520-hidden-duplicate='1']{display:none!important;pointer-events:none!important}
  @media(max-width:420px){#walletPanel,#walletPanel.collapsed{right:58px!important;bottom:230px!important}#chatHandle{z-index:6100!important}#gameChat,#aiChatPanel{z-index:6500!important}}
  `;
  document.head.appendChild(s);
}

function patchAvatarFacing(){
  if(THREE.WebGLRenderer.prototype.__k11520HumanFacing)return;
  const original=THREE.WebGLRenderer.prototype.render;
  THREE.WebGLRenderer.prototype.render=function(scene,camera){
    try{
      let player=null;
      scene?.traverse?.(o=>{if(!player&&o?.userData?.isPlayer)player=o});
      if(player?.rotation&&document.querySelector('#three')?.dataset?.xVisualMirror==='1')player.rotation.y=-player.rotation.y;
    }catch{}
    return original.call(this,scene,camera);
  };
  THREE.WebGLRenderer.prototype.__k11520HumanFacing=true;
}

function normalizeBackpack(){
  const candidates=[...document.querySelectorAll('button,[role="button"],[title],[aria-label]')].filter(el=>/背包|🎒/.test(`${el.textContent||''} ${el.title||''} ${el.getAttribute('aria-label')||''}`));
  if(!candidates.length)return false;
  const real=candidates.find(el=>el.classList.contains('bagRelocatedV258'))||candidates.find(el=>el.classList.contains('bagRelocatedV250'))||candidates.find(el=>el.dataset?.organ==='bag')||candidates.find(el=>typeof el.onclick==='function')||candidates[0];
  real.dataset.k11520RealBag='1';
  real.style.removeProperty('display');
  if(!real.getAttribute('aria-label'))real.setAttribute('aria-label','開啟背包');
  for(const el of candidates){
    if(el===real)continue;
    if(el.closest('#rail')&&el.dataset?.organ==='bag')continue;
    el.dataset.k11520HiddenDuplicate='1';
    el.setAttribute('aria-hidden','true');
    el.tabIndex=-1;
  }
  return true;
}

function pinWallet(){
  const panel=$('#walletPanel'),toggle=$('#walletToggle');
  if(!panel||!toggle)return false;
  panel.dataset.k11520StableAnchor='1';
  if(!toggle.getAttribute('aria-label'))toggle.setAttribute('aria-label','展開或收合錢包');
  const sync=()=>{
    const collapsed=panel.classList.contains('collapsed');
    toggle.textContent=collapsed?'▶':'◀';
    toggle.title=collapsed?'展開錢包':'收合錢包';
  };
  if(!toggle.dataset.k11520StableAnchor){toggle.dataset.k11520StableAnchor='1';toggle.addEventListener('click',()=>setTimeout(sync,0))}
  sync();
  return true;
}

function humanizeButtons(){
  const labels={chatHandle:'聊天',dockToggle:'功能選單',aiChatButton:'AI 助手',bgmButton:'音樂',gameModeToggle:'遊戲設定',walletToggle:'錢包'};
  for(const [id,label] of Object.entries(labels)){const el=$('#'+id);if(el&&!el.getAttribute('aria-label'))el.setAttribute('aria-label',label)}
}

function raiseOpenSurface(){
  const ai=$('#aiChatPanel'),chat=$('#gameChat');
  if(ai?.classList.contains('open'))ai.style.zIndex='6500';
  if(chat?.classList.contains('open'))chat.style.zIndex='6500';
}

function cleanup(){installStyle();normalizeBackpack();pinWallet();humanizeButtons();raiseOpenSurface()}
function scheduleCleanup(){clearTimeout(cleanupTimer);cleanupTimer=setTimeout(cleanup,40)}

export function install11520HumanUx(){
  patchAvatarFacing();
  cleanup();
  const mo=new MutationObserver(scheduleCleanup);
  mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  addEventListener('resize',scheduleCleanup,{passive:true});
  globalThis.__K11520_HUMAN_UX__={version:'1.0.0',avatarFacing:'visible-X-aligned',chatTopLayer:true,singleBackpack:true,walletStableAnchor:true};
  return globalThis.__K11520_HUMAN_UX__;
}
