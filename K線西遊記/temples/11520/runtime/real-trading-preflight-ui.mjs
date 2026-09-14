/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE_SAFE_PREFLIGHT
PURPOSE: Player-visible 11520 real-trading readiness preflight. Never signs or broadcasts.
*/
import {readPublicWalletIdentity} from './evm-wallet-runtime.mjs';
import {getRealTradingBinding,assertRealTradingAxisMarket,realTradingEligibility} from './real-trading-market-binding.mjs';

const $=s=>document.querySelector(s);

const BLOCKER_TEXT=Object.freeze({
  PRODUCTION_FEED_PROVENANCE_REQUIRED:'正式價格來源尚未驗證',
  BRAIN_DEPLOYED_ADDRESS_REQUIRED:'Brain 真實交易合約尚未部署/綁定',
  POSITION_ENGINE_DEPLOYED_ADDRESS_REQUIRED:'Position Engine 尚未部署/綁定',
  HUMAN_MAINNET_EXECUTION_AUTHORIZATION_REQUIRED:'等待 Mainnet 最終執行授權'
});

export function inspectRealTradingUiPreflight({axis,market,chainId=56,walletIdentity=null,feedProvenanceVerified=false,brainAddress=null,positionEngineAddress=null,humanMainnetAuthorization=false}={}){
  const binding=assertRealTradingAxisMarket({axis,market,chainId});
  const blockers=[];
  if(!walletIdentity?.address)blockers.push('WALLET_PUBLIC_IDENTITY_REQUIRED');
  const eligibility=realTradingEligibility({axis,market,chainId,feedProvenanceVerified,brainAddress,positionEngineAddress,humanMainnetAuthorization});
  blockers.push(...eligibility.blockers);
  return Object.freeze({
    binding,
    ready:blockers.length===0,
    blockers:Object.freeze(blockers),
    signerRequested:false,
    transactionPayload:null,
    broadcast:false
  });
}

function activeAxisMarket(){
  const active=document.querySelector('[data-axis].active')||document.querySelector('[data-axis]');
  const axis=active?.dataset?.axis||'KX';
  const select=document.querySelector(`[data-market="${axis}"]`);
  const market=(select?.value||getRealTradingBinding(axis).market).replace('/','');
  return {axis,market};
}

function blockerLabel(code){if(code==='WALLET_PUBLIC_IDENTITY_REQUIRED')return'請先連接/恢復公開錢包識別';return BLOCKER_TEXT[code]||code}

function ensureStyle(){
  if($('#k11520RealTradePreflightStyle'))return;
  const style=document.createElement('style');style.id='k11520RealTradePreflightStyle';style.textContent=`
#k11520RealTradePreflight{position:fixed;z-index:475;right:58px;bottom:366px;display:grid;gap:4px;justify-items:end;pointer-events:none}
#k11520RealTradePreflight button{pointer-events:auto;border:1px solid #f1ca7377;background:#111923ee;color:#f5de9c;border-radius:10px;padding:7px 9px;font-size:8px;font-weight:900;touch-action:manipulation;box-shadow:0 6px 20px #0008}
#k11520RealTradePreflight .state{max-width:190px;padding:5px 7px;border-radius:8px;background:#071018e8;border:1px solid #ffffff16;color:#aebdca;font-size:7px;text-align:right;line-height:1.2}
#k11520RealTradePreflight[data-ready="1"] .state{color:#73e7a7;border-color:#73e7a744}
@media(max-width:420px){#k11520RealTradePreflight{right:58px;bottom:366px}.game-clean-mode #k11520RealTradePreflight{display:none!important}}
`;document.head.appendChild(style)
}

function renderPreflight(){
  const host=$('#k11520RealTradePreflight');if(!host)return null;
  let axis,market,binding;
  try{({axis,market}=activeAxisMarket());binding=getRealTradingBinding(axis)}catch{return null}
  const identity=readPublicWalletIdentity();
  let result;
  try{result=inspectRealTradingUiPreflight({axis,market,chainId:identity?.chainId??56,walletIdentity:identity})}
  catch(error){result={ready:false,blockers:[String(error?.message||error)],binding,signerRequested:false,transactionPayload:null,broadcast:false}}
  host.dataset.ready=result.ready?'1':'0';
  const state=host.querySelector('.state');
  if(state){
    const wallet=identity?.address?`${identity.address.slice(0,6)}…${identity.address.slice(-4)}`:'未連錢包';
    const expected=`${binding.axis}=${binding.display}`;
    state.textContent=result.ready?`真實交易預檢 READY · ${expected} · ${wallet}`:`真實交易未啟用 · ${expected} · ${wallet}`;
    state.title=result.blockers.map(blockerLabel).join('；');
  }
  host.dataset.blockers=result.blockers.join(',');
  globalThis.__K11520_REAL_TRADING_PREFLIGHT__={...result,walletAddress:identity?.address||null,checkedAt:new Date().toISOString()};
  return result
}

export function install11520RealTradingPreflightUi(){
  ensureStyle();
  let host=$('#k11520RealTradePreflight');
  if(!host){host=document.createElement('div');host.id='k11520RealTradePreflight';host.innerHTML='<button type="button" id="k11520RealTradePreflightBtn">真實交易預檢</button><div class="state">真實交易未啟用</div>';document.body.appendChild(host)}
  const btn=$('#k11520RealTradePreflightBtn');if(btn&&!btn.dataset.bound){btn.dataset.bound='1';btn.addEventListener('click',()=>{const result=renderPreflight();const message=result?.ready?'真實交易條件已齊；仍需由錢包明確確認交易':'真實交易仍封鎖：'+(result?.blockers||[]).map(blockerLabel).join('、');const toast=$('#toast');if(toast){toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2600)}})}
  for(const el of document.querySelectorAll('[data-market]'))el.addEventListener('change',renderPreflight);
  for(const el of document.querySelectorAll('[data-axis]'))el.addEventListener('click',()=>setTimeout(renderPreflight,0));
  addEventListener('storage',event=>{if(event.key==='klineodyssey.public-wallet-identity.v1')renderPreflight()});
  renderPreflight();
  return host
}
