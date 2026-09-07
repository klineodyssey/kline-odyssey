/* KGEN_META
VERSION: 1.2.1
STATUS: ACTIVE
PURPOSE: Human-first 11520 interaction layer. Keep avatar facing aligned with visible movement, keep chat/modal surfaces above the HUD, expose one real living-cargo backpack, auto-detect an injected wallet without auto-signing, show BNB/KGEN/KAIOS balances, keep the wallet toggle at one stable screen position, and prevent dock menus from being covered by floating shortcuts.
*/
import * as THREE from 'three';

const $=s=>document.querySelector(s);
const KGEN='0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be';
const PRODUCT_VERSION='V2.6.3 · 5D K線西遊記';
let cleanupTimer=null,walletTimer=null,versionTimer=null;

function installStyle(){
  if($('#k11520HumanUxStyle'))return;
  const s=document.createElement('style');
  s.id='k11520HumanUxStyle';
  s.textContent=`
  #chatHandle{z-index:7100!important;min-width:46px!important;min-height:46px!important;display:grid!important;place-items:center!important}
  #gameChat,#aiChatPanel,.sheet,.confirm,#backpackPanel{z-index:7500!important}
  #gameChat.open,#aiChatPanel.open,.sheet.open,.confirm.open,#backpackPanel.open{pointer-events:auto!important}
  #chatClose,#aiClose,#sheetClose,#confirmX,#backpackClose{position:relative!important;z-index:7502!important;min-width:42px!important;min-height:42px!important;touch-action:manipulation!important}

  #walletPanel,#walletPanel.collapsed{right:58px!important;bottom:230px!important}
  #walletPanel{z-index:6900!important;padding-top:50px!important}
  #walletPanel.collapsed{width:46px!important;height:46px!important;padding:4px!important;overflow:visible!important;background:#101923ee!important}
  #walletPanel.collapsed .walletHead{width:38px!important;height:38px!important;margin:0!important}
  #walletToggle{position:fixed!important;right:62px!important;bottom:234px!important;width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;z-index:6950!important;touch-action:manipulation!important}
  #walletPanel:not(.collapsed) .walletHead{padding-right:44px!important}
  #walletKaiosMetric{display:block!important}

  #backpackButton,[data-k11520-real-bag='1']{z-index:7050!important;right:5px!important;bottom:84px!important;width:46px!important;height:46px!important;min-width:46px!important;min-height:46px!important;touch-action:manipulation!important}
  button[data-k11520-hidden-duplicate='1']{display:none!important;pointer-events:none!important}

  #dockToggle,#aiChatButton,#bgmButton,#gameModeToggle{min-width:44px!important;min-height:44px!important;touch-action:manipulation!important}
  #aiChatButton{z-index:7040!important}
  #dockToggle{z-index:7040!important}
  #bgmButton,#gameModeToggle{opacity:.84}
  [data-k11520-dock-muted='1']{opacity:.08!important;pointer-events:none!important;visibility:hidden!important;transform:scale(.92)!important;transition:opacity .12s ease,transform .12s ease!important}

  @media(max-width:420px){
    #walletPanel,#walletPanel.collapsed{right:58px!important;bottom:230px!important}
    #walletToggle{right:62px!important;bottom:234px!important}
    #chatHandle{z-index:7100!important}
    #gameChat,#aiChatPanel,#backpackPanel{z-index:7500!important}
  }
  `;
  document.head.appendChild(s);
}

function patchAvatarFacing(){
  if(THREE.WebGLRenderer.prototype.__k11520HumanFacingV3)return;
  const original=THREE.WebGLRenderer.prototype.render;
  THREE.WebGLRenderer.prototype.render=function(scene,camera){
    let player=null,originalYaw=null;
    try{
      scene?.traverse?.(o=>{if(!player&&o?.userData?.isPlayer)player=o});
      if(player?.rotation){
        originalYaw=player.rotation.y;
        player.rotation.y=Math.PI-originalYaw;
      }
    }catch{}
    try{return original.call(this,scene,camera)}finally{if(player?.rotation&&originalYaw!==null)player.rotation.y=originalYaw}
  };
  THREE.WebGLRenderer.prototype.__k11520HumanFacingV3=true;
}

function normalizeBackpack(){
  const canonical=$('#backpackButton');
  const candidates=[...document.querySelectorAll('button,[role="button"],[title],[aria-label]')].filter(el=>/背包|🎒/.test(`${el.textContent||''} ${el.title||''} ${el.getAttribute('aria-label')||''}`));
  if(!canonical&&!candidates.length)return false;
  const real=canonical||candidates.find(el=>el.classList.contains('bagRelocatedV258'))||candidates.find(el=>el.classList.contains('bagRelocatedV250'))||candidates[0];
  real.dataset.k11520RealBag='1';
  real.style.removeProperty('display');
  real.title='背包 / 活體收納';
  real.setAttribute('aria-label','開啟背包與活體收納');
  for(const el of candidates){
    if(el===real)continue;
    el.dataset.k11520HiddenDuplicate='1';
    el.setAttribute('aria-hidden','true');
    el.tabIndex=-1;
  }
  const panel=$('#backpackPanel');
  if(panel){panel.dataset.k11520CanonicalBackpack='1';const head=panel.querySelector('.bpHead b');if(head)head.textContent='🎒 花果山背包 · 活體收納'}
  return true;
}

function ensureKaiosMetric(){
  const grid=$('#walletPanel .walletGrid');
  if(!grid)return false;
  let metric=$('#walletKaiosMetric');
  if(!metric){metric=document.createElement('div');metric.id='walletKaiosMetric';metric.className='metric';metric.innerHTML='<small>KAIOS 遊戲餘額</small><b id="wKaios">--</b>';grid.appendChild(metric)}
  return true;
}
function hexToNumber(hex){try{return Number(BigInt(hex||'0x0'))}catch{return 0}}
function formatUnits(hex,decimals=18){try{const n=BigInt(hex||'0x0'),d=10n**BigInt(decimals),whole=n/d,frac=(n%d).toString().padStart(decimals,'0').slice(0,6).replace(/0+$/,'');return frac?`${whole}.${frac}`:String(whole)}catch{return'--'}}
function balanceOfData(address){return '0x70a08231'+String(address||'').toLowerCase().replace(/^0x/,'').padStart(64,'0')}

async function refreshOwnWallet({requestPermission=false}={}){
  ensureKaiosMetric();
  const provider=globalThis.ethereum,msg=$('#walletMsg'),addr=$('#wAddr'),chain=$('#wChain'),bnb=$('#wBnb'),kgen=$('#wKgen'),kaios=$('#wKaios'),connect=$('#walletConnect');
  if(kaios)kaios.textContent=($('#topKaios')?.textContent||'0').trim();
  if(!provider?.request){if(msg)msg.textContent='11520 未偵測到瀏覽器 EVM 錢包；可先使用遊戲內 KAIOS。';if(connect)connect.textContent='未偵測到錢包';return false}
  let accounts=[];try{accounts=await provider.request({method:requestPermission?'eth_requestAccounts':'eth_accounts'})||[]}catch(e){if(msg)msg.textContent=requestPermission?'錢包連線未授權':'已偵測錢包，尚未授權本頁讀取';return false}
  if(!accounts.length){if(msg)msg.textContent='已偵測到錢包；點「連線」後只讀取地址與餘額，不自動簽名或轉帳。';if(connect)connect.textContent='連線錢包';return false}
  const account=accounts[0];
  try{
    const [chainHex,bnbHex,kgenHex]=await Promise.all([provider.request({method:'eth_chainId'}),provider.request({method:'eth_getBalance',params:[account,'latest']}),provider.request({method:'eth_call',params:[{to:KGEN,data:balanceOfData(account)},'latest']})]);
    if(addr)addr.textContent=account.slice(0,6)+'…'+account.slice(-4);if(chain)chain.textContent=String(hexToNumber(chainHex));if(bnb)bnb.textContent=formatUnits(bnbHex,18);if(kgen)kgen.textContent=formatUnits(kgenHex,18);if(kaios)kaios.textContent=($('#topKaios')?.textContent||'0').trim();
    if(msg)msg.textContent=`11520 自有錢包視窗 · ${hexToNumber(chainHex)===56?'BSC 56':'目前鏈 '+hexToNumber(chainHex)} · BNB/KGEN 唯讀；KAIOS 顯示遊戲餘額。`;if(connect)connect.textContent='已連線';return true
  }catch(e){if(msg)msg.textContent='錢包已偵測，但餘額讀取失敗；可稍後重新整理。';return false}
}

function pinWallet(){
  const panel=$('#walletPanel'),toggle=$('#walletToggle'),connect=$('#walletConnect');if(!panel||!toggle)return false;
  panel.dataset.k11520StableAnchor='1';toggle.setAttribute('aria-label','展開或收合 11520 錢包');
  const sync=()=>{const collapsed=panel.classList.contains('collapsed');toggle.textContent=collapsed?'💰':'×';toggle.title=collapsed?'開啟 11520 錢包':'關閉 11520 錢包'};
  if(!toggle.dataset.k11520StableAnchor){toggle.dataset.k11520StableAnchor='1';toggle.addEventListener('click',()=>setTimeout(sync,0))}
  if(connect&&!connect.dataset.k11520OwnWallet){connect.dataset.k11520OwnWallet='1';connect.addEventListener('click',e=>{e.stopImmediatePropagation();refreshOwnWallet({requestPermission:true})},true)}
  ensureKaiosMetric();sync();refreshOwnWallet();if(!walletTimer)walletTimer=setInterval(()=>refreshOwnWallet(),12000);return true;
}

function syncDockOcclusion(){
  const rail=$('#rail')||$('.rail');
  const dock=$('.dock');
  const railVisible=!!rail&&getComputedStyle(rail).display!=='none'&&getComputedStyle(rail).visibility!=='hidden';
  const open=railVisible||!!dock?.classList.contains('open');
  for(const sel of ['#aiChatButton','#bgmButton','#backpackButton']){
    const el=$(sel);if(!el)continue;
    if(open)el.dataset.k11520DockMuted='1';else delete el.dataset.k11520DockMuted;
  }
}
function enforceProductVersion(){const el=document.querySelector('.brandMetaV250 span:first-child');if(el&&el.textContent!==PRODUCT_VERSION)el.textContent=PRODUCT_VERSION}
function humanizeButtons(){const labels={chatHandle:'聊天',dockToggle:'功能選單',aiChatButton:'AI 助手',bgmButton:'音樂',gameModeToggle:'遊戲設定',walletToggle:'11520 錢包',backpackButton:'背包 / 活體收納'};for(const [id,label] of Object.entries(labels)){const el=$('#'+id);if(el)el.setAttribute('aria-label',label)}}
function raiseOpenSurface(){for(const sel of ['#aiChatPanel','#gameChat','#backpackPanel','.sheet','.confirm']){const el=$(sel);if(el&&(el.classList.contains('open')||el.classList.contains('show')))el.style.zIndex='7500'}}
function cleanup(){installStyle();normalizeBackpack();pinWallet();humanizeButtons();raiseOpenSurface();syncDockOcclusion();enforceProductVersion()}
function scheduleCleanup(){clearTimeout(cleanupTimer);cleanupTimer=setTimeout(cleanup,20)}

export function install11520HumanUx(){
  patchAvatarFacing();cleanup();
  const mo=new MutationObserver(scheduleCleanup);mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,characterData:true,attributeFilter:['class','style']});
  addEventListener('resize',scheduleCleanup,{passive:true});
  document.addEventListener('pointerdown',e=>{if(e.target?.closest?.('#dockToggle,.dockToggle'))setTimeout(syncDockOcclusion,0)},true);
  document.addEventListener('click',e=>{if(e.target?.closest?.('#dockToggle,.dockToggle'))setTimeout(syncDockOcclusion,0)},true);
  globalThis.ethereum?.on?.('accountsChanged',()=>refreshOwnWallet());globalThis.ethereum?.on?.('chainChanged',()=>refreshOwnWallet());
  if(!versionTimer)versionTimer=setInterval(enforceProductVersion,250);
  globalThis.__K11520_HUMAN_UX__={version:'1.2.1',productVersion:PRODUCT_VERSION,avatarFacing:'screen-mirrored-yaw-with-model-forward-correction',chatTopLayer:true,singleBackpack:'living-cargo-canonical',walletStableAnchor:true,walletAutoDetect:true,walletBalances:['BNB','KGEN','KAIOS_GAME'],dockPointerSafety:'computed-rail-visibility'};
  return globalThis.__K11520_HUMAN_UX__;
}
