import {
  PRODUCT_CONTRACTS,
  TOKEN_ADDRESSES,
  connectedContext,
  productAvailability,
  createKaiosSellQuote,
  acceptAtmQuoteOnChain,
  depositKaiosMargin,
  openWarpPositionOnChain,
  closeWarpPositionOnChain,
  withdrawKaiosMargin,
  readClearingBalance
} from './kaios-chain-transaction-bridge.mjs';

const ID='kaios-live-chain-controls';
const $=id=>document.getElementById(id);
const out=(message,ok=false)=>{const n=$('liveChainStatus');if(n){n.textContent=message;n.dataset.ok=ok?'true':'false';}};

function html(){return `<section id="${ID}" class="card full">
<h2>鏈上閉環 · 換匯 → 保證金 → 成交 → 結算 → 出金</h2>
<p class="muted">此區只在存在可驗證部署地址時送出交易。地址未登記就 fail-closed，不會把幣送到猜測地址。</p>
<div class="row"><button id="liveConnect">連接 Injected Wallet</button><button id="liveRefresh">刷新鏈上保證金</button></div>
<p id="liveIdentity" class="muted">尚未連線</p>
<div class="row">
<div><label>ATM Quote ID（接受別人的報價）</label><input id="liveQuoteId" inputmode="numeric" placeholder="例如 1"></div><button id="liveAcceptQuote">接受 ATM 報價並原子換 KAIOS</button>
<div><label>KAIOS 入金</label><input id="liveDeposit" type="number" min="0" step="any" value="100"></div><button id="liveDepositBtn">Approve + 存入保證金</button>
<div><label>Position ID（平倉）</label><input id="livePositionId" inputmode="numeric" placeholder="例如 1"></div><button id="liveCloseBtn">平倉結算到 KAIOS cash</button>
<div><label>KAIOS 出金</label><input id="liveWithdraw" type="number" min="0" step="any" value="10"></div><button id="liveWithdrawBtn">提出 KAIOS 到錢包</button>
</div>
<div class="row"><button id="liveCreateQuote">用上方飛碟欄位建立 Maker 報價</button><button id="liveOpenBtn">用上方曲速欄位送出鏈上 LONG/SHORT</button></div>
<p id="liveDirection" class="muted">鏈上下單方向預設取最後按下的 LONG/SHORT；未指定時為 LONG。</p>
<p id="liveChainStatus" class="muted">等待錢包。</p>
</section>`;}

let ctx=null; let lastDirection='LONG';

async function connect(){
  try{
    if(!globalThis.ethereum) throw new Error('NO_INJECTED_WALLET');
    await globalThis.ethereum.request({method:'eth_requestAccounts'});
    ctx=await connectedContext(globalThis.ethereum);
    const available=productAvailability(ctx.chainId);
    $('liveIdentity').textContent=`${ctx.account} · chain ${ctx.chainId}`;
    out(available.fullyConnected?'ATM/CLEARING 已部署，可簽章交易。':`尚未完成產品合約部署：${available.reason}` ,available.fullyConnected);
    await refresh();
  }catch(e){out(`連線失敗：${e.message}`);}
}

function need(){if(!ctx)throw new Error('CONNECT_WALLET_FIRST');return ctx;}
async function refresh(){
  try{
    const c=need();
    const av=productAvailability(c.chainId);
    if(!av.clearing){out('Clearing 尚無已驗證部署地址；提款/實單保持鎖定。');return;}
    const b=await readClearingBalance({providerOrSigner:c.signer,chainId:c.chainId,account:c.account});
    out(`鏈上 Cash ${b.cashKaios} KAIOS · Locked ${b.lockedKaios} KAIOS`,true);
  }catch(e){out(e.message);}
}

async function createQuote(){
  try{
    const c=need();
    const asset=$('atmAsset')?.value||'KGEN';
    const pay=$('atmPay')?.value; const kaios=$('atmKaios')?.value; const mins=Number($('atmMinutes')?.value||5);
    const receipt=await createKaiosSellQuote({signer:c.signer,chainId:c.chainId,payAsset:asset,payAmount:pay,kaiosAmount:kaios,expiresAt:new Date(Date.now()+mins*60000).toISOString()});
    out(`Maker 報價已上鏈：${receipt.transactionHash}`,true);
  }catch(e){out(`建立報價失敗：${e.message}`);}
}
async function acceptQuote(){try{const c=need();const id=$('liveQuoteId').value;const r=await acceptAtmQuoteOnChain({signer:c.signer,chainId:c.chainId,quoteId:id});out(`ATM 原子換匯成交：${r.transactionHash}`,true);await refresh();}catch(e){out(`換匯失敗：${e.message}`);}}
async function deposit(){try{const c=need();const r=await depositKaiosMargin({signer:c.signer,chainId:c.chainId,amountKaios:$('liveDeposit').value});out(`KAIOS 入金完成：${r.transactionHash}`,true);await refresh();}catch(e){out(`入金失敗：${e.message}`);}}
async function open(){try{const c=need();const r=await openWarpPositionOnChain({signer:c.signer,chainId:c.chainId,symbol:$('symbol').value,direction:lastDirection,warpC:$('warp').value,collateralKaios:$('collateral').value});out(`曲速訂單成交：${r.transactionHash}`,true);await refresh();}catch(e){out(`下單失敗：${e.message}`);}}
async function close(){try{const c=need();const r=await closeWarpPositionOnChain({signer:c.signer,chainId:c.chainId,positionId:$('livePositionId').value});out(`平倉已結算：${r.transactionHash}`,true);await refresh();}catch(e){out(`平倉失敗：${e.message}`);}}
async function withdraw(){try{const c=need();const r=await withdrawKaiosMargin({signer:c.signer,chainId:c.chainId,amountKaios:$('liveWithdraw').value});out(`KAIOS 已提出錢包：${r.transactionHash}`,true);await refresh();}catch(e){out(`出金失敗：${e.message}`);}}

export function mountLiveWalletControls(){
  if(typeof document==='undefined'||$(ID))return false;
  const log=$('log'); const anchor=log?.closest('section');
  if(!anchor)return false;
  anchor.insertAdjacentHTML('beforebegin',html());
  $('liveConnect').onclick=connect;$('liveRefresh').onclick=refresh;$('liveCreateQuote').onclick=createQuote;$('liveAcceptQuote').onclick=acceptQuote;$('liveDepositBtn').onclick=deposit;$('liveOpenBtn').onclick=open;$('liveCloseBtn').onclick=close;$('liveWithdrawBtn').onclick=withdraw;
  $('long')?.addEventListener('click',()=>{lastDirection='LONG';$('liveDirection').textContent='鏈上下單方向：LONG';});
  $('short')?.addEventListener('click',()=>{lastDirection='SHORT';$('liveDirection').textContent='鏈上下單方向：SHORT';});
  const chain=56; const av=productAvailability(chain);
  out(`Mainnet tokens known: ${Object.keys(TOKEN_ADDRESSES[chain]||{}).join(', ')}；產品合約：${av.reason}`);
  return true;
}

if(typeof document!=='undefined'){
  queueMicrotask(()=>mountLiveWalletControls());
  addEventListener('load',()=>mountLiveWalletControls(),{once:true});
}
