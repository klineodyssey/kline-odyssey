import {createWalletSession} from './evm-wallet-runtime.mjs';

// The game renders its existing wallet panel. This bridge shares one connection
// and public read-only state; it must not create another floating wallet/ledger.
let session;
export function getWalletSession11520(){
  if(!session){
    session=createWalletSession();
    session.subscribe(value=>{
      if(typeof document!=='undefined')document.documentElement.dataset.wallet11520=value.status;
      if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('k11520:wallet',{detail:{...value,verified:value.status==='CONNECTED'}}));
    });
  }
  return session;
}
export function getVerifiedWallet11520(){return {...getWalletSession11520().snapshot(),verified:getWalletSession11520().snapshot().status==='CONNECTED'}}
