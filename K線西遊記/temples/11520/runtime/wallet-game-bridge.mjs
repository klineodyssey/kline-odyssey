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

export function bindTradingReceiptLookup({session, kind, hashLabel, input, button, status, storage, fetchManifest = globalThis.fetch}) {
  const manifestUrl = new URL('../../../../docs/K11520_MAINNET_DEPLOYMENT_MANIFEST.json', import.meta.url);
  const messages = {
    BINDING_UNAVAILABLE: '尚無已核實的 BSC 56 合約及部署紀錄。',
    PENDING: '這筆提款仍在等待區塊確認。',
    REVERTED: '這筆提款執行失敗。',
    EVIDENCE_MISMATCH: '交易、合約或代幣轉帳紀錄與這個帳戶的提款條件不符。',
    ACCOUNT_MISMATCH: '錢包帳戶已變更，請用原帳戶查詢。',
    WRONG_CHAIN: '請連接 BNB Smart Chain（56）。',
    INVALID_INPUT: '請核對錢包帳戶及完整提款交易雜湊。',
    UNKNOWN: '目前無法核實這筆交易，稍後可再查原回執。'
  };

  function orderResult(result) {
    const stages = {
      ORDER_CREATED:'已建立委託', ORDER_FILLED:'已成交', POSITION_CLOSED:'已平倉',
      POSITION_LIQUIDATED:'已強平', ORDER_CANCELLED:'已撤單', ORDER_REJECTED:'委託已拒絕'
    };
    const known = result.status === 'UNKNOWN' ? result.lastKnown : result;
    const stage = stages[known?.status];
    if (!stage) return messages[result.status] || messages.UNKNOWN;
    const parts = [stage + ' · 委託 ' + known.orderId];
    if (known.positionId) parts.push('部位 ' + known.positionId);
    if (known.entryPriceWad) parts.push('成交價 ' + formatUnits(BigInt(known.entryPriceWad), 18) + ' USD');
    if (known.realizedPnlWei !== undefined) {
      const pnl = BigInt(known.realizedPnlWei);
      parts.push('合約實現損益 ' + (pnl < 0n ? '−' : '') + formatUnits(pnl < 0n ? -pnl : pnl, 18) + ' KGEN');
    }
    if (known.claimStatus === 'VERIFIED_AT_CLOSE') {
      parts.push('本筆撥入合約本金 ' + formatUnits(BigInt(known.paidWei),18) + ' KGEN');
      parts.push('平倉時仍待清償 ' + formatUnits(BigInt(known.remainingClaimWei),18) + ' KGEN');
    }
    if (known.fillTxHash) parts.push('成交回執 ' + known.fillTxHash);
    if (known.closeTxHash) parts.push('結算回執 ' + known.closeTxHash);
    if (result.status === 'UNKNOWN') parts.push('後續狀態尚未核實');
    return parts.join('。');
  }
  let generation = 0;
  let cursor;
  let walletReady = false;
  let storageKey = null;
  if (storage === undefined) {
    try { storage = globalThis.localStorage; } catch { storage = null; }
  }
  function saveLookup(txHash, order, cursor) {
    try {
      if (storageKey) storage?.setItem(storageKey, JSON.stringify({txHash, type:order ? 'order' : 'withdrawal', cursor}));
    } catch { /* Receipt lookup remains usable when storage is full or unavailable. */ }
  }
  function restoreLookup() {
    if (!storageKey) return;
    try {
      const raw = storage?.getItem(storageKey);
      if (!raw || raw.length > 2048) return;
      const saved = JSON.parse(raw);
      if (!['order','withdrawal'].includes(saved?.type) || !/^0x[0-9a-f]{64}$/i.test(saved.txHash)) return;
      input.value = saved.txHash;
      if (kind) kind.value = saved.type;
      reset();
      cursor = saved.cursor;
      if (cursor) button.textContent = '繼續查下一段區塊';
    } catch { /* Only the original hash and a search hint are retained. */ }
  }
  const hashValid = () => /^0x[0-9a-f]{64}$/i.test(input.value.trim());
  function reset() {
    generation++;
    cursor = undefined;
    button.textContent = '查原回執';
    if (hashLabel) hashLabel.textContent = kind?.value === 'order' ? '原建立委託交易雜湊' : '提款交易雜湊';
    button.disabled = !walletReady || !hashValid();
    status.textContent = walletReady ? '' : '請連接原交易使用的 BSC 56 錢包。';
  }
  const unsubscribe = session.subscribe(wallet => {
    walletReady = wallet.status === 'CONNECTED' && wallet.chainId === 56;
    const nextKey = walletReady && /^0x[0-9a-f]{40}$/i.test(wallet.account) ? 'k11520.receipt.56.' + wallet.account.toLowerCase() : null;
    if (storageKey && storageKey !== nextKey) input.value = '';
    storageKey = nextKey;
    reset();
    restoreLookup();
  });
  input.addEventListener('input', reset);
  kind?.addEventListener('change', reset);
  async function lookup() {
    if (!walletReady || !hashValid() || button.disabled) return;
    const txHash = input.value.trim(), ticket = ++generation;
    button.disabled = true;
    const order = kind?.value === 'order';
    saveLookup(txHash, order, cursor);
    status.textContent = order ? '正在查核原委託與後續成交…' : '正在查核提款回執…';
    try {
      const response = await fetchManifest(manifestUrl, {cache:'no-store', credentials:'omit', redirect:'error', signal:AbortSignal.timeout(12000)});
      if (!response.ok) throw new Error('MANIFEST_UNAVAILABLE');
      const manifest = await response.json();
      if (ticket !== generation) return;
      const result = order ? await session.readTradingReceipt({manifest, txHash, cursor}) : await session.readWithdrawalReceipt({manifest, txHash});
      if (ticket !== generation) return;
      if (order) {
        cursor = result.nextCursor;
        saveLookup(txHash, order, cursor);
        button.textContent = cursor ? '繼續查下一段區塊' : '查原回執';
        status.textContent = orderResult(result);
      } else if (result.status === 'CREDIT_CONFIRMED') {
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
    kind?.removeEventListener('change', reset);
    button.removeEventListener('click', lookup);
  };
}
