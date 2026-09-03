import {connectInjectedWallet,readNativeBalance,readErc20Balance,watchWallet} from './evm-wallet-runtime.mjs';

const KGEN='0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be';
const CHAIN_ID=56;
const state={account:null,chainId:null,bnb:null,kgen:null,status:'DISCONNECTED',provider:null,stopWatch:null};
const fmt=(v,d=6)=>Number(v).toLocaleString(undefined,{maximumFractionDigits:d});
const short=a=>a?`${a.slice(0,6)}…${a.slice(-4)}`:'未連線';

function ensureUi(){
  if(document.querySelector('#wallet11520')) return;
  const box=document.createElement('section');
  box.id='wallet11520';
  box.setAttribute('aria-label','11520 真錢包');
  box.style.cssText='position:fixed;z-index:1550;right:8px;top:138px;width:min(270px,calc(100vw - 16px));background:#09121aed;border:1px solid #65dff766;border-radius:12px;padding:8px;color:#eee;font:11px system-ui,"Noto Sans TC",sans-serif;box-shadow:0 8px 24px #0008';
  box.innerHTML=`<div style="display:flex;gap:6px;align-items:center"><b style="color:#67e8ff;flex:1">🔗 BSC 真錢包</b><button id="walletConnect11520" style="border:1px solid #65dff766;background:#102331;color:#fff;border-radius:8px;padding:6px 8px">連線</button><button id="walletRefresh11520" style="border:1px solid #ffffff22;background:#111;color:#fff;border-radius:8px;padding:6px">↻</button></div><div id="walletState11520" style="margin-top:5px;color:#9faab4">未連線｜只讀，不會自動送交易</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px"><div>地址<br><b id="walletAddr11520">--</b></div><div>Chain<br><b id="walletChain11520">--</b></div><div>BNB<br><b id="walletBnb11520">--</b></div><div>KGEN verified<br><b id="walletKgen11520">--</b></div></div>`;
  document.body.appendChild(box);
  document.querySelector('#walletConnect11520').addEventListener('click',connect);
  document.querySelector('#walletRefresh11520').addEventListener('click',refresh);
}

function render(){
  ensureUi();
  const $=s=>document.querySelector(s);
  $('#walletAddr11520').textContent=short(state.account);
  $('#walletChain11520').textContent=state.chainId??'--';
  $('#walletBnb11520').textContent=state.bnb==null?'--':fmt(state.bnb);
  $('#walletKgen11520').textContent=state.kgen==null?'--':`${fmt(state.kgen)} KGEN`;
  $('#walletState11520').textContent=state.status==='CONNECTED'?'已連線｜鏈上餘額只讀｜交易送鏈仍需正式 Settlement 驗證':state.status==='WRONG_CHAIN'?`鏈錯誤：目前 ${state.chainId}，需要 BSC 56`:state.status==='NO_WALLET'?'找不到瀏覽器/手機注入式 EVM 錢包':state.status==='ERROR'?'錢包讀取失敗，請重試':'未連線｜只讀，不會自動送交易';
  $('#walletState11520').style.color=state.status==='CONNECTED'?'#62e99a':state.status==='DISCONNECTED'?'#9faab4':'#ff9b6b';
  document.documentElement.dataset.wallet11520=state.status;
  window.dispatchEvent(new CustomEvent('k11520:wallet',{detail:{account:state.account,chainId:state.chainId,bnb:state.bnb,kgen:state.kgen,status:state.status,verified:state.status==='CONNECTED'}}));
}

async function refresh(){
  if(!state.provider||!state.account){render();return;}
  try{
    if(state.chainId!==CHAIN_ID){state.status='WRONG_CHAIN';render();return;}
    const [native,token]=await Promise.all([
      readNativeBalance({provider:state.provider,account:state.account}),
      readErc20Balance({provider:state.provider,token:KGEN,account:state.account,decimals:18})
    ]);
    state.bnb=Number(native.formatted);
    state.kgen=token.ok?Number(token.formatted):null;
    state.status=token.ok?'CONNECTED':'ERROR';
  }catch{state.status='ERROR'}
  render();
}

async function connect(){
  try{
    const w=await connectInjectedWallet({allowedChainIds:[CHAIN_ID]});
    if(!w.ok){
      state.account=w.account||null;state.chainId=w.chainId??null;state.status=w.reason==='NO_INJECTED_WALLET'?'NO_WALLET':w.reason==='UNSUPPORTED_CHAIN'?'WRONG_CHAIN':'ERROR';render();return;
    }
    state.account=w.account;state.chainId=w.chainId;state.provider=w.provider;state.status='CONNECTED';
    state.stopWatch?.();
    state.stopWatch=watchWallet({provider:w.provider,onAccountsChanged:async accounts=>{state.account=accounts?.[0]||null;if(!state.account){state.status='DISCONNECTED';state.bnb=null;state.kgen=null;render();return}await refresh()},onChainChanged:async chainId=>{state.chainId=chainId;state.status=chainId===CHAIN_ID?'CONNECTED':'WRONG_CHAIN';state.bnb=null;state.kgen=null;if(chainId===CHAIN_ID)await refresh();else render()}});
    await refresh();
  }catch{state.status='ERROR';render()}
}

function attachAssetObserver(){
  const sheet=document.querySelector('#organSheet');
  if(!sheet)return;
  const inject=()=>{
    const title=document.querySelector('#organTitle')?.textContent||'';
    const body=document.querySelector('#organBody');
    if(!body||!title.includes('資產總覽')||body.querySelector('#verifiedWalletAsset11520'))return;
    const card=document.createElement('div');
    card.id='verifiedWalletAsset11520';
    card.className='card';
    card.style.marginTop='8px';
    card.innerHTML=`<h3>🔗 鏈上真錢包（Verified Read）</h3><div>地址：${short(state.account)}</div><div>Chain：${state.chainId??'--'}</div><div>BNB：${state.bnb==null?'--':fmt(state.bnb)}</div><div>KGEN：${state.kgen==null?'--':fmt(state.kgen)+' KGEN'}</div><div class="muted">與本機遊戲 Free / Locked / PnL 分開顯示；此區不會自動改寫本機持倉。</div>`;
    body.appendChild(card);
  };
  new MutationObserver(inject).observe(sheet,{subtree:true,childList:true,characterData:true,attributes:true});
  window.addEventListener('k11520:wallet',inject);
}

function boot(){ensureUi();render();attachAssetObserver()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

export function getVerifiedWallet11520(){return {...state,provider:undefined,stopWatch:undefined}}
