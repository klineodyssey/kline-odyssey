const ERC20_BALANCE_OF='0x70a08231';
function padAddress(address){return String(address).toLowerCase().replace(/^0x/,'').padStart(64,'0');}
function hexToBigInt(hex){return BigInt(hex&&hex!=='0x'?hex:'0x0');}
export function formatUnits(value,decimals=18){
  const n=typeof value==='bigint'?value:BigInt(value||0),d=10n**BigInt(decimals),whole=n/d,frac=(n%d).toString().padStart(decimals,'0').replace(/0+$/,'');
  return frac?`${whole}.${frac}`:`${whole}`;
}
export async function connectInjectedWallet({ethereum=globalThis.ethereum,allowedChainIds=[56,97]}={}){
  if(!ethereum?.request)return {ok:false,reason:'NO_INJECTED_WALLET'};
  const accounts=await ethereum.request({method:'eth_requestAccounts'});
  if(!accounts?.[0])return {ok:false,reason:'NO_ACCOUNT'};
  const chainHex=await ethereum.request({method:'eth_chainId'}),chainId=Number.parseInt(chainHex,16);
  if(allowedChainIds.length&&!allowedChainIds.includes(chainId))return {ok:false,reason:'UNSUPPORTED_CHAIN',account:accounts[0],chainId};
  return {ok:true,account:accounts[0],chainId,provider:ethereum};
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
