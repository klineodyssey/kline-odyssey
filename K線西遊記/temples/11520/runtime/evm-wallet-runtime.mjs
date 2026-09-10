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
  if(!btn)return;
  if(btn.dataset.k11520Pinned!=='1'){
    btn.dataset.k11520Pinned='1';
    btn.classList.add('k11520-fixed-wallet-toggle');
    document.body.appendChild(btn);
  }
  let style=document.getElementById('k11520FixedWalletToggleStyle');
  if(!style){style=document.createElement('style');style.id='k11520FixedWalletToggleStyle';document.head.appendChild(style)}
  style.textContent=`
    #walletToggle.k11520-fixed-wallet-toggle{position:fixed!important;z-index:9810!important;right:72px!important;top:398px!important;left:auto!important;bottom:auto!important;width:44px!important;min-width:44px!important;height:44px!important;min-height:44px!important;padding:0!important;margin:0!important;border:1px solid #68e4ff66!important;border-radius:11px!important;background:#101a25!important;color:#8ceaff!important;display:grid!important;place-items:center!important;transform:none!important;translate:none!important;touch-action:manipulation!important}
    #hudToggleAxes,#hudToggleMonster,#hudToggleParams{right:72px!important}
    @media(max-width:420px){body:not(.game-clean-mode) #walletPanel{position:fixed!important;right:68px!important;top:398px!important;width:calc(100vw - 84px)!important;max-width:calc(100vw - 84px)!important}#walletToggle.k11520-fixed-wallet-toggle{right:72px!important;top:398px!important}}
    @media(min-width:421px){#walletToggle.k11520-fixed-wallet-toggle{right:68px!important;top:302px!important}}
  `;
  const panel=document.getElementById('walletPanel');
  if(panel){
    const anchor=()=>{
      btn.style.setProperty('position','fixed','important');
      btn.style.setProperty('right',innerWidth<=420?'72px':'68px','important');
      btn.style.setProperty('top',innerWidth<=420?'398px':'302px','important');
      btn.style.setProperty('left','auto','important');
      btn.style.setProperty('bottom','auto','important');
      btn.style.setProperty('transform','none','important');
      const r=btn.getBoundingClientRect();
      globalThis.__K11520_WALLET_ANCHOR__={version:'1.1.0',collapsed:panel.classList.contains('collapsed'),x:r.x,y:r.y,width:r.width,height:r.height};
    };
    const sync=()=>{btn.textContent=panel.classList.contains('collapsed')?'◀':'▶';btn.setAttribute('aria-expanded',String(!panel.classList.contains('collapsed')));anchor()};
    if(!panel.dataset.k11520WalletAnchorObserved){new MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:['class','style']});panel.dataset.k11520WalletAnchorObserved='1'}
    addEventListener('resize',anchor,{passive:true});
    sync();requestAnimationFrame(anchor);setTimeout(anchor,120);setTimeout(anchor,500);
  }
}

if(typeof document!=='undefined'&&/\/temples\/11520\/game-5d\.html$/i.test(globalThis.location?.pathname||'')){
  import('./life-visual-bootstrap.mjs').catch(()=>{});
  pin11520WalletToggle();
  import('./market-world-coordinate-runtime.mjs').catch(()=>{});
  import('./game-mobile-shell.mjs').catch(()=>{});
  import('./backpack-ui.mjs').then(()=>import('./living-world-browser-bridge.mjs')).catch(()=>{});
  import('./game-ui-product-fixes.mjs').catch(()=>{});
}
