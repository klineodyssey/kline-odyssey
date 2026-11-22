import {createWalletSession,formatUnits} from './evm-wallet-runtime.mjs';

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

export function bindWithdrawalLookup({session, input, button, status, fetchManifest = globalThis.fetch}) {
  const manifestUrl = new URL('../../../../docs/K11520_MAINNET_DEPLOYMENT_MANIFEST.json', import.meta.url);
  const messages = {
    BINDING_UNAVAILABLE: '尚無已核實的 BSC 56 提款合約及部署紀錄。',
    PENDING: '這筆提款仍在等待區塊確認。',
    REVERTED: '這筆提款執行失敗。',
    EVIDENCE_MISMATCH: '交易、合約或代幣轉帳紀錄與這個帳戶的提款條件不符。',
    ACCOUNT_MISMATCH: '錢包帳戶已變更，請用原帳戶查詢。',
    WRONG_CHAIN: '請連接 BNB Smart Chain（56）。',
    INVALID_INPUT: '請核對錢包帳戶及完整提款交易雜湊。',
    UNKNOWN: '目前無法核實這筆提款，稍後可再查原回執。'
  };
  let generation = 0;
  let walletReady = false;
  const hashValid = () => /^0x[0-9a-f]{64}$/i.test(input.value.trim());
  function reset() {
    generation++;
    button.disabled = !walletReady || !hashValid();
    status.textContent = walletReady ? '' : '請連接提款時使用的 BSC 56 錢包。';
  }
  const unsubscribe = session.subscribe(wallet => {
    walletReady = wallet.status === 'CONNECTED' && wallet.chainId === 56;
    reset();
  });
  input.addEventListener('input', reset);
  async function lookup() {
    if (!walletReady || !hashValid() || button.disabled) return;
    const txHash = input.value.trim(), ticket = ++generation;
    button.disabled = true;
    status.textContent = '正在查核提款回執…';
    try {
      const response = await fetchManifest(manifestUrl, {cache:'no-store', credentials:'omit', redirect:'error', signal:AbortSignal.timeout(12000)});
      if (!response.ok) throw new Error('MANIFEST_UNAVAILABLE');
      const manifest = await response.json();
      if (ticket !== generation) return;
      const result = await session.readWithdrawalReceipt({manifest, txHash});
      if (ticket !== generation) return;
      if (result.status === 'CREDIT_CONFIRMED') {
        status.textContent = '錢包實收 ' + formatUnits(BigInt(result.receivedWei), 18) + ' KGEN。提款 ' +
          formatUnits(BigInt(result.requestedWei), 18) + ' KGEN，費用 ' + formatUnits(BigInt(result.feeWei), 18) +
          ' KGEN。區塊 ' + BigInt(result.blockNumber).toString() + '。';
      } else {
        status.textContent = messages[result.status] || messages.UNKNOWN;
      }
    } catch {
      if (ticket === generation) status.textContent = messages.UNKNOWN;
    } finally {
      if (ticket === generation) button.disabled = !walletReady || !hashValid();
    }
  }
  button.addEventListener('click', lookup);
  return () => {
    generation++;
    unsubscribe();
    input.removeEventListener('input', reset);
    button.removeEventListener('click', lookup);
  };
}
