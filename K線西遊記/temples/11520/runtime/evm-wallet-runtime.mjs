const ERC20_BALANCE_OF='0x70a08231';
function padAddress(address){return String(address).toLowerCase().replace(/^0x/,'').padStart(64,'0');}
function hexToBigInt(hex){return BigInt(hex&&hex!=='0x'?hex:'0x0');}
function providerCandidates(explicit){return [explicit,globalThis.trustwallet?.ethereum,globalThis.ethereum,globalThis.BinanceChain,globalThis.okxwallet].filter(Boolean);}
export function detectInjectedWallet(ethereum){return providerCandidates(ethereum).find(p=>typeof p?.request==='function')||null;}
export function formatUnits(value,decimals=18){
  const n=typeof value==='bigint'?value:BigInt(value||0),d=10n**BigInt(decimals),whole=n/d,frac=(n%d).toString().padStart(decimals,'0').replace(/0+$/,'');
  return frac?`${whole}.${frac}`:`${whole}`;
}
async function readChainId(provider){const chainHex=await provider.request({method:'eth_chainId'});return Number.parseInt(chainHex,16);}
async function trySwitchChain(provider,targetChainId){
  if(!targetChainId)return {ok:false,reason:'NO_TARGET_CHAIN'};
  try{await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:`0x${Number(targetChainId).toString(16)}`} ]});return {ok:true,chainId:await readChainId(provider)};}catch(error){return {ok:false,reason:'CHAIN_SWITCH_REJECTED',error};}
}
export async function connectInjectedWallet({ethereum,allowedChainIds=[56,97],switchChain=true}={}){
  const provider=detectInjectedWallet(ethereum);
  if(!provider)return {ok:false,reason:'NO_INJECTED_WALLET'};
  const accounts=await provider.request({method:'eth_requestAccounts'});
  if(!accounts?.[0])return {ok:false,reason:'NO_ACCOUNT'};
  let chainId=await readChainId(provider);
  if(allowedChainIds.length&&!allowedChainIds.includes(chainId)&&switchChain){
    const switched=await trySwitchChain(provider,allowedChainIds[0]);
    if(switched.ok)chainId=switched.chainId;
  }
  if(allowedChainIds.length&&!allowedChainIds.includes(chainId))return {ok:false,reason:'UNSUPPORTED_CHAIN',account:accounts[0],chainId,provider};
  return {ok:true,account:accounts[0],chainId,provider};
}
export async function readNativeBalance({provider,account}){
  const raw=await provider.request({method:'eth_getBalance',params:[account,'latest']});
  return {raw:hexToBigInt(raw),formatted:formatUnits(hexToBigInt(raw),18)};
}
export async function readErc20Balance({provider,token,account,decimals=18}){
  if(!/^0x[0-9a-fA-F]{40}$/.test(token||''))return {ok:false,reason:'INVALID_TOKEN_ADDRESS'};
  const data=ERC20_BALANCE_OF+padAddress(account);
  const rawHex=await provider.request({method:'eth_call',params:[{to:token,data},'latest']});
  const raw=hexToBigInt(rawHex);return {ok:true,raw,formatted:formatUnits(raw,decimals)};
}
export function watchWallet({provider,onAccountsChanged,onChainChanged}){
  if(!provider?.on)return ()=>{};
  const a=accounts=>onAccountsChanged?.(accounts||[]),c=chain=>onChainChanged?.(Number.parseInt(chain,16));
  provider.on('accountsChanged',a);provider.on('chainChanged',c);
  return ()=>{provider.removeListener?.('accountsChanged',a);provider.removeListener?.('chainChanged',c)};
}
export function assertExecutableOrder({wallet,chainId,marketAdapter,order}){
  if(!wallet?.account)return {ok:false,reason:'WALLET_NOT_CONNECTED'};
  if(wallet.chainId!==chainId)return {ok:false,reason:'WRONG_CHAIN'};
  if(!marketAdapter?.preview||!marketAdapter?.submit)return {ok:false,reason:'NO_VERIFIED_MARKET_ADAPTER'};
  if(!order?.axis||!order?.side||!(Number(order?.notional)>0))return {ok:false,reason:'INVALID_ORDER'};
  return {ok:true};
}

function pin11520WalletToggle(){
  if(typeof document==='undefined')return;
  const btn=document.getElementById('walletToggle');
  if(!btn||btn.dataset.k11520Pinned==='1')return;
  btn.dataset.k11520Pinned='1';
  btn.classList.add('k11520-fixed-wallet-toggle');
  document.body.appendChild(btn);
  const style=document.createElement('style');
  style.id='k11520FixedWalletToggleStyle';
  style.textContent=`
    #walletToggle.k11520-fixed-wallet-toggle{position:fixed!important;z-index:980!important;right:72px!important;top:398px!important;width:44px!important;min-width:44px!important;height:44px!important;min-height:44px!important;padding:0!important;border:1px solid #68e4ff66!important;border-radius:11px!important;background:#101a25!important;color:#8ceaff!important;display:block!important;transform:none!important;touch-action:manipulation!important}
    body.game-clean-mode #walletToggle.k11520-fixed-wallet-toggle{display:none!important}
    @media(min-width:421px){#walletToggle.k11520-fixed-wallet-toggle{right:68px!important;top:302px!important}}
  `;
  document.head.appendChild(style);
  const panel=document.getElementById('walletPanel');
  if(panel){
    const sync=()=>{btn.textContent=panel.classList.contains('collapsed')?'◀':'▶';btn.setAttribute('aria-expanded',String(!panel.classList.contains('collapsed')))};
    new MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:['class']});
    sync();
  }
}

if(typeof document!=='undefined'&&/\/temples\/11520\/game-5d\.html$/i.test(globalThis.location?.pathname||'')){
  pin11520WalletToggle();
  import('./game-mobile-shell.mjs').catch(()=>{});
}
