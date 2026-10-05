/* KGEN_META
VERSION: 1.1.0
STATUS: ACTIVE_SAFE_PREFLIGHT
PURPOSE: Player-visible 11520 real-trading readiness preflight and order-route classification. Never signs or broadcasts.
*/
import {getWalletSession11520} from './wallet-game-bridge.mjs';
import {getRealTradingBinding,assertRealTradingAxisMarket,realTradingEligibility} from './real-trading-market-binding.mjs';

const $=s=>document.querySelector(s);

// Offline package inspection only. A digest proves content identity, not Human
// approval, deployed bytecode, oracle independence, funding or permission to sign.
// This function deliberately cannot make the live UI/Mainnet adapter ready.
function canonicalPackageJson(value){
  if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
  if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(canonicalPackageJson).join(',')+']';
  if(value&&Object.getPrototypeOf(value)===Object.prototype)return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonicalPackageJson(value[k])).join(',')+'}';
  throw new Error('NON_JSON_PACKAGE');
}

export async function inspectMainnetUnsignedPackage(candidate,{expectedDigest}={}){
  const errors=[];
  const check=(ok,code)=>{if(!ok)errors.push(code)};
  const address=v=>typeof v==='string'&&/^0x[0-9a-fA-F]{40}$/.test(v)&&!/^0x0{40}$/i.test(v);
  const decimal=v=>typeof v==='string'&&/^(0|[1-9][0-9]*)$/.test(v);
  let digest=null;
  try{
    const p=JSON.parse(canonicalPackageJson(candidate));
    const {packageDigest,...payload}=p;
    const bytes=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalPackageJson(payload)));
    digest='sha256:'+Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
    check(digest===packageDigest,'PACKAGE_DIGEST_MISMATCH');
    check(typeof expectedDigest==='string'&&digest===expectedDigest,'EXPECTED_PACKAGE_DIGEST_REQUIRED_OR_MISMATCH');
    check(p.documentType==='K11520_MAINNET_UNSIGNED_EXECUTION_PACKAGE'&&p.schemaVersion===1,'PACKAGE_SCHEMA_INVALID');
    check(p.chainId===56&&p.mode==='BUILD_ONLY'&&p.broadcast===false&&p.executionAuthorized===false,'BUILD_ONLY_MAINNET_BOUNDARY_REQUIRED');
    check(p.status==='UNSIGNED_REQUIRES_HUMAN_APPROVAL'&&Array.isArray(p.blockers)&&p.blockers.length===0,'PACKAGE_INPUTS_BLOCKED');
    check(p.deploymentReadbacks==='NOT_PERFORMED','UNSIGNED_PACKAGE_CANNOT_CLAIM_DEPLOYMENT');
    check(!p.signature&&!p.signedTransaction&&!p.approvalReceipt,'UNSIGNED_PACKAGE_REQUIRED');
    const input=p.input||{},token=input.token||{},gas=input.gas||{},funding=input.funding||{};
    check(input.chainId===56&&token.chainId===56&&token.testOnly===false&&token.decimals===18&&address(token.address),'PRODUCTION_TOKEN_METADATA_REQUIRED');
    check(/^0x[0-9a-fA-F]{64}$/.test(token.codeHash||'')&&typeof token.provenance==='string'&&token.provenance.length>0,'TOKEN_CODE_PROVENANCE_REQUIRED');
    check(address(funding.account)&&['settlementCapitalWei','insuranceWei','totalKgenWei'].every(k=>decimal(funding[k])),'EXPLICIT_FUNDING_REQUIRED');
    if(['settlementCapitalWei','insuranceWei','totalKgenWei'].every(k=>decimal(funding[k])))check(BigInt(funding.totalKgenWei)===BigInt(funding.settlementCapitalWei)+BigInt(funding.insuranceWei),'FUNDING_SUM_MISMATCH');
    check(decimal(gas.maximumGasPriceWei)&&BigInt(gas.maximumGasPriceWei)>0n&&decimal(gas.totalGasCostCapWei)&&BigInt(gas.totalGasCostCapWei)>0n&&gas.nativeValuePerTransactionWei==='0','EXPLICIT_GAS_VALUE_CAPS_REQUIRED');
    const predicted=p.predictedAddresses||{};
    check(address(predicted.brainProxy)&&address(predicted.brainImplementation)&&predicted.brainProxy.toLowerCase()!==predicted.brainImplementation.toLowerCase(),'BRAIN_PROXY_IMPLEMENTATION_SEPARATION_REQUIRED');
    check(p.sourceHashes&&Object.keys(p.sourceHashes).length>0&&p.artifactDigests&&Object.keys(p.artifactDigests).length>0,'SOURCE_BYTECODE_BINDING_REQUIRED');
    check(Array.isArray(p.transactions)&&p.transactions.length>=4,'UNSIGNED_TRANSACTIONS_REQUIRED');
    const nonces=new Map();let totalGas=0n;
    for(const tx of p.transactions||[]){
      check(tx.chainId===56&&tx.type===0&&tx.value==='0'&&address(tx.from)&&(tx.to===null||address(tx.to)),'TRANSACTION_BOUNDARY_INVALID');
      check(typeof tx.data==='string'&&/^0x(?:[0-9a-fA-F]{2})+$/.test(tx.data),'CALLDATA_REQUIRED');
      check(!tx.signature&&!tx.signedTransaction&&!tx.r&&!tx.s,'SIGNED_TRANSACTION_FORBIDDEN');
      check(decimal(tx.gasLimit)&&BigInt(tx.gasLimit)>0n&&decimal(tx.gasPrice)&&tx.gasPrice===gas.maximumGasPriceWei,'TRANSACTION_GAS_INVALID');
      if(decimal(tx.gasLimit)&&decimal(tx.gasPrice))totalGas+=BigInt(tx.gasLimit)*BigInt(tx.gasPrice);
      const sender=String(tx.from).toLowerCase(),expected=nonces.get(sender)??input.startingNonces?.[sender];
      check(Number.isSafeInteger(tx.nonce)&&tx.nonce>=0&&tx.nonce===expected,'TRANSACTION_NONCE_SEQUENCE_INVALID');
      nonces.set(sender,tx.nonce+1);
    }
    if(decimal(gas.totalGasCostCapWei))check(totalGas<=BigInt(gas.totalGasCostCapWei),'TOTAL_GAS_CAP_EXCEEDED');
  }catch{errors.push('PACKAGE_INVALID_OR_DIGEST_UNAVAILABLE')}
  return Object.freeze({reviewable:errors.length===0,ready:false,packageDigest:digest,
    blockers:Object.freeze([...new Set(errors),'HUMAN_EXACT_MANIFEST_APPROVAL_REQUIRED','FRESH_CHAIN_CODE_NONCE_ORACLE_FUNDING_READBACK_REQUIRED']),
    signerRequested:false,transactionPayload:null,broadcast:false});
}

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

export function classify11520OrderRoute({preflight=null,localSimulationAvailable=true,execution=null}={}){
  // Reporting only: this does not construct an adapter, sign, or authorize a
  // Mainnet path. The actual adapter still verifies manifest/code/chain/receipt.
  if(execution?.mode==='BSC_TESTNET'&&execution?.chainId===97)return Object.freeze({route:'TESTNET_EXPLICIT_WALLET_ACTION',label:'BSC TESTNET 97 · NO REAL VALUE',status:execution.status,signerRequested:false,broadcast:false});
  if(preflight?.ready===true)return Object.freeze({route:'REAL_READY_FOR_EXPLICIT_WALLET_ACTION',localSimulationAvailable:!!localSimulationAvailable,signerRequested:false,broadcast:false});
  if(localSimulationAvailable)return Object.freeze({route:'LOCAL_SIMULATION_REAL_BLOCKED',localSimulationAvailable:true,signerRequested:false,broadcast:false,blockers:Object.freeze([...(preflight?.blockers||[])])});
  return Object.freeze({route:'ORDER_BLOCKED',localSimulationAvailable:false,signerRequested:false,broadcast:false,blockers:Object.freeze([...(preflight?.blockers||[])])});
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
  const session=getWalletSession11520().snapshot();
  const identity=session.account?{address:session.account,chainId:session.chainId}:null;
  let result;
  try{result=inspectRealTradingUiPreflight({axis,market,chainId:identity?.chainId??56,walletIdentity:identity})}
  catch(error){result={ready:false,blockers:[String(error?.message||error)],binding,signerRequested:false,transactionPayload:null,broadcast:false}}
  host.dataset.ready=result.ready?'1':'0';
  const state=host.querySelector('.state');
  if(state){
    // Identity comes only from the existing live session; no ownership/signature claim.
    const wallet=identity?.address?`錢包帳戶 ${identity.address.slice(0,6)}…${identity.address.slice(-4)}`:'錢包未連接';
    const expected=`${binding.axis}=${binding.display}`;
    state.textContent=result.ready?`BSC97 TESTNET READY · ${expected} · ${wallet}`:`SIMULATION · ${expected} · ${wallet}`;
    state.title=result.blockers.map(blockerLabel).join('；');
  }
  host.dataset.walletIdentityScope=identity?'ACTIVE_SESSION':'DISCONNECTED';
  host.dataset.walletAddress=identity?.address||'';
  host.dataset.blockers=result.blockers.join(',');
  globalThis.__K11520_REAL_TRADING_PREFLIGHT__={...result,walletAddress:identity?.address||null,walletIdentityScope:identity?'ACTIVE_SESSION':'DISCONNECTED',checkedAt:new Date().toISOString()};
  return result
}

function notifyOrderRoute(){
  const preflight=renderPreflight();
  const route=classify11520OrderRoute({preflight,localSimulationAvailable:true,execution:globalThis.__K11520_EXECUTION__?.snapshot?.()});
  globalThis.__K11520_ORDER_ROUTE__={...route,checkedAt:new Date().toISOString()};
  // The Testnet execution UI owns validation, confirmation and receipt feedback.
  // This deferred routing observer must not overwrite ORACLE_STALE (or another
  // actual order failure) with a generic instruction to confirm in the wallet.
  if(route.route==='TESTNET_EXPLICIT_WALLET_ACTION')return route;
  const toast=$('#toast');
  if(!toast)return route;
  if(route.route==='REAL_READY_FOR_EXPLICIT_WALLET_ACTION')toast.textContent='真實交易條件已齊；下一步仍需錢包明確確認';
  else toast.textContent='目前下單走本機模擬；真實交易仍封鎖';
  toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800);
  return route
}

export function install11520RealTradingPreflightUi(){
  ensureStyle();
  let host=$('#k11520RealTradePreflight');
  if(!host){host=document.createElement('div');host.id='k11520RealTradePreflight';host.innerHTML='<button type="button" id="k11520RealTradePreflightBtn">⚡ 交易模式</button><div class="state">SIMULATION</div>';document.body.appendChild(host)}
  const btn=$('#k11520RealTradePreflightBtn');if(btn&&!btn.dataset.bound){btn.dataset.bound='1';btn.addEventListener('click',()=>{const result=renderPreflight();const message=result?.ready?'真實交易條件已齊；仍需由錢包明確確認交易':'真實交易仍封鎖：'+(result?.blockers||[]).map(blockerLabel).join('、');const toast=$('#toast');if(toast){toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2600)}})}
  const order=$('#orderFire');if(order&&!order.dataset.realTradeRouteBound){order.dataset.realTradeRouteBound='1';order.addEventListener('click',()=>setTimeout(notifyOrderRoute,0))}
  for(const el of document.querySelectorAll('[data-market]'))el.addEventListener('change',renderPreflight);
  for(const el of document.querySelectorAll('[data-axis]'))el.addEventListener('click',()=>setTimeout(renderPreflight,0));
  addEventListener('k11520:wallet',renderPreflight);
  renderPreflight();
  return host
}
