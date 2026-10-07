/* KGEN_META
VERSION: 1.3.0
REVISION: 2026-10-07.BSC56-KGEN-TRANSFER-PREVIEW-UI
PRODUCT_CONTEXT: V2.9.5
STATUS: CANDIDATE
LAST_UPDATED: 2026-10-07
UPDATED_BY: dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER / HUMAN_AUTHORIZED_2026_10_05
REVIEWED_BY: dot / independent scoped view/controller review / 2026-10-07; browser UI QA pending, no release approval
SOURCE_COMMIT: 7160d3a34cd4a61149e56239131cd6642f7d2371
TASK_ID: K11520-BSC56-PRODUCTION-20261007
CHANGE_REASON: Wire timestamped read-only KGEN transfer preview into existing wallet panel and singleton; no wallet handoff.
ANCESTOR: K線西遊記/temples/11520/runtime/real-trading-preflight-ui.mjs @ 7160d3a34cd4a61149e56239131cd6642f7d2371
SOURCE_OF_TRUTH: TRUE
PURPOSE: Player-visible preflight and blocked unsigned custody review. Never signs or broadcasts.
*/
import {getWalletSession11520} from './wallet-game-bridge.mjs';
import {getRealTradingBinding,assertRealTradingAxisMarket,realTradingEligibility} from './real-trading-market-binding.mjs';
import {KGEN_TOKEN_ADDRESS,KGEN_CHAIN_ID} from './evm-wallet-runtime.mjs';
import {buildBsc56UnsignedCustodyReview} from './real-trading-order-intent.mjs';

const $=s=>document.querySelector(s);

export const BSC56_REVIEW_FIELDS=Object.freeze(['CHAIN','WALLET','CONTRACT','FUNCTION','TOKEN','AMOUNT','EXPECTED_EFFECT','MAXIMUM_EXPOSURE']);
const BSC56_REVIEW_ACTIONS=Object.freeze(['approve','depositMargin','withdrawMargin','claimSettlement']);

// View state only. The callback is an existing trusted readback/registry owner,
// not page storage, an event payload, or a request to connect/sign/broadcast.
// The current page has no deployed binding owner and therefore defaults blocked.
export function createBsc56UnsignedReviewController({getWalletSnapshot,getReviewContext=()=>null,codec=()=>globalThis.ethers?.utils||globalThis.ethers,build=buildBsc56UnsignedCustodyReview,onChange=()=>{}}={}){
  if(typeof getWalletSnapshot!=='function')throw new Error('EXISTING_WALLET_SNAPSHOT_REQUIRED');
  let generation=0,opened=false,disposed=false,currentKey=null,result=null,status='CLOSED',reason='REVIEW_CLOSED';
  let draft={action:'',amountWei:'',positionKey:''};
  const own=(object,key)=>{const d=object&&Object.getOwnPropertyDescriptor(object,key);if(d&&!Object.hasOwn(d,'value'))throw new Error('REVIEW_CONTEXT_ACCESSOR_FORBIDDEN');return d?.value};
  const text=value=>typeof value==='string'&&value.length<=256?value:'';
  // Bounded data-only context: hashing/rendering never invokes getters/toJSON.
  // All source fields participate in invalidation, including gas and allowance.
  function dataSnapshot(value){
    let nodes=0,bytes=0;const ancestors=new Set(),encoder=new TextEncoder();
    function copy(v,depth){
      if(++nodes>512||depth>10)throw new Error('REVIEW_CONTEXT_BUDGET_EXCEEDED');
      if(v===null||typeof v==='boolean')return v;
      if(typeof v==='string'){bytes+=encoder.encode(v).length;if(v.length>2048||bytes>32768)throw new Error('REVIEW_CONTEXT_BUDGET_EXCEEDED');return v}
      if(typeof v==='number'&&Number.isSafeInteger(v))return v;
      if(!v||typeof v!=='object'||ancestors.has(v)||(!Array.isArray(v)&&Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null))throw new Error('REVIEW_CONTEXT_DATA_REQUIRED');
      const keys=Reflect.ownKeys(v);if(keys.length>65||keys.some(k=>typeof k!=='string'))throw new Error('REVIEW_CONTEXT_DATA_REQUIRED');
      ancestors.add(v);const result=Array.isArray(v)?[]:{};
      if(Array.isArray(v)&&(v.length>64||keys.length!==v.length+1))throw new Error('REVIEW_CONTEXT_DATA_REQUIRED');
      for(const key of keys.sort()){
        if(Array.isArray(v)&&key==='length')continue;
        const d=Object.getOwnPropertyDescriptor(v,key);if(!d||!Object.hasOwn(d,'value')||!d.enumerable)throw new Error('REVIEW_CONTEXT_ACCESSOR_FORBIDDEN');
        bytes+=encoder.encode(key).length;if(bytes>32768)throw new Error('REVIEW_CONTEXT_BUDGET_EXCEEDED');
        if(Array.isArray(v)&&!/^(0|[1-9][0-9]*)$/.test(key))throw new Error('REVIEW_CONTEXT_DATA_REQUIRED');
        Object.defineProperty(result,key,{value:copy(d.value,depth+1),enumerable:true,writable:true,configurable:true});
      }
      ancestors.delete(v);return result;
    }return copy(value,0);
  }
  function context(){
    const w=getWalletSnapshot()||{},r=getReviewContext(),wallet={account:text(own(w,'account')),chainId:own(w,'chainId'),status:text(own(w,'status'))};
    const source=r==null?null:dataSnapshot(r);
    const values={account:wallet.account.toLowerCase(),chainId:Number.isSafeInteger(wallet.chainId)?wallet.chainId:null,status:wallet.status,
      sourceHead:text(own(source,'sourceHead')),bindingDigest:text(own(source,'bindingDigest')),blockHash:text(own(source,'blockHash')),blockNumber:text(own(source,'blockNumber')),pendingNonce:text(own(source,'pendingNonce')),
      action:draft.action,amountWei:draft.amountWei,positionKey:draft.positionKey};
    return {wallet,values,source,key:JSON.stringify({values,source})};
  }
  let latestContext=null;
  function reconcile(){
    if(disposed)return;
    try{
      const ctx=context();latestContext=ctx;
      if(currentKey!==ctx.key){const before=currentKey;currentKey=ctx.key;generation++;result=null;
        if(opened){status=before===null?'BLOCKED':'STALE';reason=before===null?'REVIEW_INPUTS_REQUIRED':'REVIEW_CONTEXT_CHANGED'}}
    }catch{latestContext=null;currentKey=null;generation++;result=null;if(opened){status='BLOCKED';reason='REVIEW_CONTEXT_INVALID'}}
  }
  function fields(ctx){
    const rows={CHAIN:`BNB Smart Chain · ${KGEN_CHAIN_ID} / wallet ${ctx?.values.chainId??'UNKNOWN'}`,WALLET:ctx?.wallet.account||'未連線 / UNKNOWN',CONTRACT:'NOT_DEPLOYED / UNKNOWN',FUNCTION:draft.action||'NOT_SELECTED',TOKEN:`KGEN · ${KGEN_TOKEN_ADDRESS} · 18 decimals`,AMOUNT:'NOT_PROVIDED / UNKNOWN',EXPECTED_EFFECT:'候選資訊不足，尚未建立未簽署交易',MAXIMUM_EXPOSURE:'UNKNOWN · 缺少可信部署、nonce 或 gas cap'};
    if(result){const r=result.review;rows.CHAIN=`${r.CHAIN.name} · ${r.CHAIN.chainId}`;rows.WALLET=r.WALLET;rows.CONTRACT=r.CONTRACT||'NOT_DEPLOYED / UNKNOWN';rows.FUNCTION=r.FUNCTION;rows.TOKEN=`${r.TOKEN.symbol} · ${r.TOKEN.address} · ${r.TOKEN.decimals} decimals`;rows.AMOUNT=JSON.stringify(r.AMOUNT);rows.EXPECTED_EFFECT=r.EXPECTED_EFFECT;rows.MAXIMUM_EXPOSURE=JSON.stringify(r.MAXIMUM_EXPOSURE,null,2)}
    return Object.freeze(rows);
  }
  function snapshot(){reconcile();return Object.freeze({status,reason,opened,generation,draft:Object.freeze({...draft}),fields:fields(latestContext),bindingDigest:result?.bindingDigest||null,intentDigest:result?.intentDigest||null,hasTransaction:!!result?.transaction,executionReady:false,signerRequested:false,broadcast:false,scope:'UNSIGNED_INPUT_METADATA_ONLY_NOT_EXECUTABLE'})}
  const publish=()=>{const state=snapshot();try{onChange(state)}catch{}return state};
  function invalidate(nextReason,nextStatus='STALE'){generation++;result=null;status=nextStatus;reason=nextReason;return publish()}
  const sync=()=>publish();
  return Object.freeze({snapshot,sync,
    open(){if(disposed)return snapshot();opened=true;currentKey=null;return sync()},
    close(){opened=false;return invalidate('REVIEW_CLOSED','CLOSED')},
    setDraft(patch={}){const next={...draft};for(const key of ['action','amountWei','positionKey']){const value=own(patch,key);if(value!==undefined){if(typeof value!=='string'||value.length>(key==='amountWei'?78:key==='positionKey'?66:32))throw new Error('REVIEW_DRAFT_INVALID');next[key]=value}}if(next.action&&!BSC56_REVIEW_ACTIONS.includes(next.action))throw new Error('REVIEW_ACTION_NOT_SUPPORTED');draft=next;return sync()},
    async prepare(){
      if(disposed||!opened)return snapshot();reconcile();const ctx=latestContext;if(!ctx)return publish();
      const ticket=++generation,key=ctx.key;result=null;status='BUILDING';reason='UNSIGNED_REVIEW_ONLY';publish();if(ticket!==generation)return snapshot();
      const finishBlocked=code=>{if(ticket!==generation||!opened||disposed)return snapshot();status='BLOCKED';reason=code;return publish()};
      if(ctx.wallet.status!=='CONNECTED'||ctx.wallet.chainId!==KGEN_CHAIN_ID||!/^0x[0-9a-fA-F]{40}$/.test(ctx.wallet.account))return finishBlocked('ACTIVE_CHAIN56_SESSION_REQUIRED');
      if(!draft.action)return finishBlocked('CUSTODY_ACTION_REQUIRED');
      if(!ctx.source||! /^[0-9a-f]{40}$/.test(ctx.values.sourceHead)||! /^0x[0-9a-fA-F]{64}$/.test(ctx.values.bindingDigest)||! /^0x[0-9a-fA-F]{64}$/.test(ctx.values.blockHash)||! /^(0|[1-9][0-9]*)$/.test(ctx.values.blockNumber)||! /^(0|[1-9][0-9]*)$/.test(ctx.values.pendingNonce))return finishBlocked('DEPLOYED_BINDING_AND_READBACK_REQUIRED');
      try{
        const deployment=own(ctx.source,'deployment');
        if(own(deployment,'reviewedCommit')!==ctx.values.sourceHead||own(deployment,'blockHash')?.toLowerCase()!==ctx.values.blockHash.toLowerCase()||own(deployment,'blockNumber')!==ctx.values.blockNumber||own(deployment,'pendingNonce')!==ctx.values.pendingNonce)throw new Error('REVIEW_CONTEXT_BINDING_MISMATCH');
        const input={action:draft.action,chainId:KGEN_CHAIN_ID,walletAddress:ctx.wallet.account,nonce:ctx.values.pendingNonce,gasLimit:own(ctx.source,'gasLimit'),gasPriceWei:own(ctx.source,'gasPriceWei'),maximumGasFeeWei:own(ctx.source,'maximumGasFeeWei'),deployment,...(ctx.values.action==='claimSettlement'?{positionKey:ctx.values.positionKey}:{amountWei:ctx.values.amountWei})};
        const built=await build(input,{ethers:codec(),expectedBindingDigest:ctx.values.bindingDigest});
        if(disposed||!opened||ticket!==generation)return snapshot();
        const latest=context();if(latest.key!==key){currentKey=latest.key;return invalidate('REVIEW_CONTEXT_CHANGED')}
        if(built?.schema!=='K11520_BSC56_UNSIGNED_CUSTODY_REVIEW_V1'||built.executionReady!==false||built.signerRequested!==false||built.broadcast!==false||built.bindingVerification!=='INPUT_METADATA_ONLY_NOT_CHAIN_VERIFIED'||built.transactionFormat!=='ETHERS_STYLE_UNSIGNED_REVIEW_NOT_EIP1193_RPC'||built.bindingDigest!==ctx.values.bindingDigest)throw new Error('UNSIGNED_REVIEW_BOUNDARY_REQUIRED');
        if(built.review?.WALLET?.toLowerCase()!==ctx.wallet.account.toLowerCase()||built.review?.CHAIN?.chainId!==KGEN_CHAIN_ID||built.review?.FUNCTION!==draft.action)throw new Error('UNSIGNED_REVIEW_CONTEXT_MISMATCH');
        result=built;status='UNSIGNED_REVIEW';reason='FRESH_READBACK_AND_WALLET_OWNER_CONFIRMATION_REQUIRED';return publish();
      }catch(error){return finishBlocked(/^[A-Z][A-Z0-9_]{0,95}$/.test(error?.message||'')?error.message:'UNSIGNED_REVIEW_UNAVAILABLE')}
    },
    dispose(){disposed=true;opened=false;return invalidate('REVIEW_CLOSED','CLOSED')}
  });
}


const KGEN_PREVIEW_INPUTS=Object.freeze(['recipient','amountKgen','gasLimit','gasPriceWei','maximumGasFeeWei']);
export const KGEN_TRANSFER_PREVIEW_FIELDS=Object.freeze(['CHAIN','WALLET','RECIPIENT','CONTRACT','FUNCTION','TOKEN','AMOUNT','EXPECTED_EFFECT','MAXIMUM_EXPOSURE']);
// Bounded view-data copy only: rendering never calls getters/toJSON or grants
// authority to a caller-supplied review, codec, provider, digest or transaction.
function transferPreviewData(value){
  let nodes=0,bytes=0;const parents=new Set();
  const copy=(v,depth)=>{
    if(++nodes>512||depth>10)throw Error('TRANSFER_PREVIEW_DATA_BUDGET');
    if(v===null||typeof v==='boolean'||(typeof v==='number'&&Number.isSafeInteger(v)))return v;
    if(typeof v==='string'){bytes+=new TextEncoder().encode(v).length;if(v.length>4096||bytes>32768)throw Error('TRANSFER_PREVIEW_DATA_BUDGET');return v}
    if(!v||typeof v!=='object'||parents.has(v)||(Array.isArray(v)?Object.getPrototypeOf(v)!==Array.prototype:![Object.prototype,null].includes(Object.getPrototypeOf(v))))throw Error('TRANSFER_PREVIEW_PLAIN_DATA_REQUIRED');
    const keys=Reflect.ownKeys(v),array=Array.isArray(v);if(keys.length>65||keys.some(k=>typeof k!=='string')||(array&&(v.length>64||keys.length!==v.length+1)))throw Error('TRANSFER_PREVIEW_PLAIN_DATA_REQUIRED');
    parents.add(v);const out=array?[]:Object.create(null);
    for(const key of keys){if(array&&key==='length')continue;bytes+=new TextEncoder().encode(key).length;if(bytes>32768)throw Error('TRANSFER_PREVIEW_DATA_BUDGET');const d=Object.getOwnPropertyDescriptor(v,key);if(!d||!Object.hasOwn(d,'value')||!d.enumerable||(array&&!/^(0|[1-9][0-9]*)$/.test(key)))throw Error('TRANSFER_PREVIEW_ACCESSOR_FORBIDDEN');Object.defineProperty(out,key,{value:copy(d.value,depth+1),enumerable:true})}
    parents.delete(v);return Object.freeze(out);
  };return copy(value,0);
}

export function createKgenTransferPreviewController({session,onChange=()=>{}}={}){
  if(!session||!['snapshot','transferSnapshot','prepareKgenTransfer','invalidateTransferReview'].every(k=>typeof session[k]==='function'))throw Error('EXISTING_WALLET_SESSION_REQUIRED');
  let opened=false,disposed=false,generation=0,status='CLOSED',reason='PREVIEW_CLOSED',wallet=null,walletKey=null,accepted=null,acceptedIdentity=null;
  let draft=Object.freeze(Object.fromEntries(KGEN_PREVIEW_INPUTS.map(k=>[k,''])));
  const invalidate=(why,next='STALE')=>{++generation;accepted=null;acceptedIdentity=null;status=next;reason=why;session.invalidateTransferReview(why)};
  function reconcile(){
    if(disposed)return;
    try{
      const w=transferPreviewData(session.snapshot()),key=JSON.stringify([w.account,w.chainId,w.status,w.kgen,w.bnb]);wallet=w;
      if(walletKey!==key){const initial=walletKey===null;walletKey=key;invalidate(initial?'TRANSFER_INPUTS_REQUIRED':'TRANSFER_WALLET_CONTEXT_CHANGED',opened?(initial?'BLOCKED':'STALE'):'CLOSED')}
      if(acceptedIdentity&&session.transferSnapshot()!==acceptedIdentity)invalidate('TRANSFER_OBSERVATION_INVALIDATED',opened?'STALE':'CLOSED');
    }catch{wallet=null;walletKey=null;invalidate('TRANSFER_WALLET_CONTEXT_UNKNOWN',opened?'BLOCKED':'CLOSED')}
  }
  function snapshot(){
    reconcile();const r=accepted?.review?.review;
    const fields=r?{CHAIN:`${r.CHAIN.name} · ${r.CHAIN.chainId}`,WALLET:r.WALLET,RECIPIENT:r.RECIPIENT,CONTRACT:r.CONTRACT,FUNCTION:r.FUNCTION,TOKEN:`${r.TOKEN.symbol} · ${r.TOKEN.address} · ${r.TOKEN.decimals} decimals`,AMOUNT:`${r.AMOUNT.inputKgen} KGEN\n${r.AMOUNT.baseUnits} wei`,EXPECTED_EFFECT:r.EXPECTED_EFFECT,MAXIMUM_EXPOSURE:JSON.stringify(r.MAXIMUM_EXPOSURE,null,2)}:{CHAIN:`BNB Smart Chain · 56 / wallet ${wallet?.chainId??'UNKNOWN'}`,WALLET:wallet?.account||'DISCONNECTED / UNKNOWN',RECIPIENT:draft.recipient||'NOT_PROVIDED',CONTRACT:KGEN_TOKEN_ADDRESS,FUNCTION:'transfer(address,uint256) · preview only',TOKEN:'KGEN · 18 decimals',AMOUNT:draft.amountKgen?draft.amountKgen+' KGEN · UNVERIFIED':'NOT_PROVIDED',EXPECTED_EFFECT:'尚未讀取綁定區塊的轉帳觀察資料',MAXIMUM_EXPOSURE:'UNKNOWN · 必須填寫 gas 與費用上限'};
    const facts=accepted?{observedAt:accepted.observedAt||'UNKNOWN',blockNumber:accepted.review.readback.blockNumber,blockHash:accepted.review.readback.blockHash,tokenBalanceWei:accepted.review.readback.tokenBalanceWei,nativeBalanceWei:accepted.review.readback.nativeBalanceWei,pendingNonce:accepted.review.readback.pendingNonce,pendingNonceScope:accepted.pendingNonceScope||'UNKNOWN',readbackScope:accepted.readbackScope||'UNKNOWN',builderSourceScope:accepted.builderSourceScope||'UNKNOWN',builderSourceCommit:accepted.review.readback.sourceCommit||'UNKNOWN',gasScope:accepted.gasScope||'UNKNOWN',recipientCodePresentAtReadback:typeof r.recipientCodePresentAtReadback==='boolean'?r.recipientCodePresentAtReadback:'UNKNOWN',recipientCodeWarning:'Contract code at the observed block is not permanent identity, trust or recovery proof. No code observed does not guarantee an EOA or safe recipient. Verify the full recipient independently.',tax:r.taxObservation}:null;
    return Object.freeze({status,reason,opened,generation,draft,fields:Object.freeze(fields),facts:facts?Object.freeze(facts):null,executionReady:false,walletHandoffReady:false,signerRequested:false,broadcast:false,scope:'TIMESTAMPED_READ_ONLY_OBSERVATION_NOT_EXECUTION_CAPABILITY'});
  }
  const publish=()=>{const model=snapshot();try{onChange(model)}catch{}return model};
  return Object.freeze({snapshot,sync:publish,
    open(){if(disposed)return snapshot();opened=true;invalidate('TRANSFER_INPUTS_REQUIRED','BLOCKED');return publish()},
    close(){opened=false;invalidate('PREVIEW_CLOSED','CLOSED');return publish()},
    setDraft(patch){
      try{const p=transferPreviewData(patch);if(!p||Array.isArray(p)||Object.keys(p).some(k=>!KGEN_PREVIEW_INPUTS.includes(k))||Object.values(p).some(v=>typeof v!=='string'||v.length>98))throw Error('TRANSFER_PREVIEW_DRAFT_INVALID');const next=Object.freeze({...draft,...p});if(JSON.stringify(next)!==JSON.stringify(draft)){draft=next;invalidate('TRANSFER_INPUT_CHANGED',opened?'STALE':'CLOSED')}}
      catch{invalidate('TRANSFER_PREVIEW_DRAFT_INVALID',opened?'BLOCKED':'CLOSED')}return publish();
    },
    async prepare(){
      reconcile();if(disposed||!opened||status==='READING')return snapshot();
      if(wallet?.status!=='CONNECTED'||wallet.chainId!==56||!/^0x[0-9a-fA-F]{40}$/.test(wallet.account||'')){invalidate('TRANSFER_ACTIVE_CHAIN56_SESSION_REQUIRED','BLOCKED');return publish()}
      if(KGEN_PREVIEW_INPUTS.some(k=>!draft[k])){invalidate('TRANSFER_EXPLICIT_INPUTS_REQUIRED','BLOCKED');return publish()}
      invalidate('PINNED_READ_ONLY_PREPARATION','READING');const ticket=generation,key=walletKey,request=draft;publish();if(disposed||!opened||ticket!==generation)return snapshot();
      try{
        const raw=await session.prepareKgenTransfer(request);reconcile();if(disposed||!opened||ticket!==generation||walletKey!==key)return snapshot();
        const value=transferPreviewData(raw);
        if(!['executionReady','walletHandoffReady','signerRequested','broadcast'].every(k=>value[k]===false))throw Error('TRANSFER_PREVIEW_BOUNDARY_INVALID');
        if(value.status!=='READ_ONLY_REVIEW'){invalidate(/^[A-Z][A-Z0-9_]{0,100}$/.test(value.reason||'')?value.reason:'TRANSFER_READBACK_UNKNOWN','BLOCKED');return publish()}
        const r=value.review?.review;
        if(raw!==session.transferSnapshot()||value.review?.schema!=='K11520_BSC56_KGEN_TRANSFER_REVIEW_V1'||!['executionReady','walletHandoffReady','signerRequested','broadcast'].every(k=>value.review[k]===false)||r?.CHAIN?.chainId!==56||r?.WALLET?.toLowerCase()!==wallet.account.toLowerCase()||r?.RECIPIENT?.toLowerCase()!==request.recipient.toLowerCase()||r?.AMOUNT?.inputKgen!==request.amountKgen||r?.CONTRACT!==KGEN_TOKEN_ADDRESS||r?.TOKEN?.address!==KGEN_TOKEN_ADDRESS)throw Error('TRANSFER_PREVIEW_CONTEXT_MISMATCH');
        accepted=value;acceptedIdentity=raw;status='READ_ONLY_REVIEW';reason='WALLET_HANDOFF_NOT_IMPLEMENTED';return publish();
      }catch{if(ticket===generation&&!disposed&&opened){invalidate('TRANSFER_PREVIEW_UNAVAILABLE','BLOCKED');return publish()}return snapshot()}
    },
    dispose(){disposed=true;opened=false;invalidate('PREVIEW_CLOSED','CLOSED');return publish()}
  });
}

const kgenTransferPreviewMounts=new WeakMap();
export function installKgenTransferPreviewUi(){
  const panel=$('#walletPanel');if(!panel)return null;if(kgenTransferPreviewMounts.has(panel))return kgenTransferPreviewMounts.get(panel);
  const root=document.createElement('details');root.id='k11520KgenTransferPreview';root.dataset.executionReady='false';root.dataset.componentRevision='2026-10-07.BSC56-KGEN-TRANSFER-PREVIEW-UI';
  const text=(tag,value,parent=root)=>{const element=document.createElement(tag);element.textContent=value;parent.appendChild(element);return element};
  text('summary','KGEN 轉帳資料預覽 · BSC56');
  const provenance=text('p','WIP / NOT_RELEASE · component 1.3.0 · revision 2026-10-07.BSC56-KGEN-TRANSFER-PREVIEW-UI · source PARENT 7160d3a34cd4a61149e56239131cd6642f7d2371 (not current component HEAD) · PRODUCT_VERSION_BUILD_INFO_SYNC_PENDING');provenance.dataset.kgenTransferProvenance='';
  text('p','只讀取資料與建立未簽署預覽；不會送出、簽署或 Approve。所有地址與金額必須自行輸入。Gas 欄位是自訂上限，並非網路估算。');
  const inputs={};for(const [key,label,mode] of [['recipient','收款地址（完整0x地址）','text'],['amountKgen','KGEN 數量（最多18位小數）','decimal'],['gasLimit','Gas limit（整數）','numeric'],['gasPriceWei','Gas price（wei／gas，整數）','numeric'],['maximumGasFeeWei','最高 gas 費用（BNB wei，整數）','numeric']]){
    const wrapper=document.createElement('label');wrapper.htmlFor='kgenTransferPreview-'+key;wrapper.textContent=label;root.appendChild(wrapper);
    const input=document.createElement('input');input.id=wrapper.htmlFor;input.type='text';input.inputMode=mode;input.maxLength=98;input.autocomplete='off';input.spellcheck=false;input.dataset.kgenTransferInput=key;root.appendChild(input);inputs[key]=input;
  }
  const button=text('button','讀取轉帳預覽（不送出）');button.type='button';button.className='btn';
  const status=text('p','');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const rows=document.createElement('dl');rows.className='exchangeRows';root.appendChild(rows);const values={};
  for(const field of KGEN_TRANSFER_PREVIEW_FIELDS){const row=document.createElement('div');rows.appendChild(row);text('dt',field,row);const value=text('dd','',row);value.dataset.kgenTransferField=field;values[field]=value}
  const facts=text('pre','');facts.dataset.kgenTransferFacts='';
  text('p','資料只代表顯示區塊／時間的觀察；目前有效性未持續驗證。Tax pair／免稅狀態可變動，不保證收款人上鏈淨額。需重新讀取；錢包送出與收據確認尚未開放。');
  const session=getWalletSession11520(),controller=createKgenTransferPreviewController({session,onChange:model=>{
    root.dataset.previewState=model.status;root.dataset.executionReady='false';root.dataset.walletHandoffReady='false';status.textContent=`${model.status} · ${model.reason} · READ ONLY / NOT EXECUTABLE`;
    for(const field of KGEN_TRANSFER_PREVIEW_FIELDS)values[field].textContent=model.fields[field];
    facts.textContent=JSON.stringify({observation:model.facts||'Pinned balance / block / observation time: UNKNOWN',executionReady:false,walletHandoffReady:false,signerRequested:false,broadcast:false},null,2);button.disabled=model.status==='READING';
  }});
  const update=()=>controller.setDraft(Object.fromEntries(KGEN_PREVIEW_INPUTS.map(k=>[k,inputs[k].value])));
  for(const input of Object.values(inputs))input.addEventListener('input',update);
  button.addEventListener('click',()=>{update();void controller.prepare()});root.addEventListener('toggle',()=>root.open?controller.open():controller.close());
  const unsubscribe=session.subscribe(()=>controller.sync()),visibility=()=>{root.hidden=panel.classList.contains('collapsed');if(root.hidden){root.open=false;controller.close()}};
  const observer=new MutationObserver(visibility);observer.observe(panel,{attributes:true,attributeFilter:['class']});
  const mounted=Object.freeze({controller,root,dispose(){unsubscribe();observer.disconnect();controller.dispose();root.remove();kgenTransferPreviewMounts.delete(panel)}});kgenTransferPreviewMounts.set(panel,mounted);
  const anchor=$('#k11520Bsc56UnsignedReview')||$('#walletSimulation');if(anchor?.parentElement===panel)anchor.after(root);else panel.appendChild(root);controller.close();visibility();return mounted;
}

const bsc56ReviewMounts=new WeakMap();
export function installBsc56UnsignedReviewUi(){
  const panel=$('#walletPanel');if(!panel)return null;if(bsc56ReviewMounts.has(panel))return bsc56ReviewMounts.get(panel);
  const root=document.createElement('details');root.id='k11520Bsc56UnsignedReview';root.className='card';
  const title=document.createElement('summary');title.textContent='BSC56 未簽署審核';title.style.minHeight='44px';root.appendChild(title);
  const notice=document.createElement('p');notice.textContent='僅檢視候選資訊；不會簽署、送出交易或變更交易模式。部署／readback 尚未齊備時維持封鎖。';root.appendChild(notice);
  const select=document.createElement('select');select.id='bsc56ReviewAction';select.setAttribute('aria-label','未簽署審核操作');select.style.minHeight='44px';select.style.maxWidth='100%';
  for(const [value,label] of [['','選擇審核操作'],['approve','Approve / revoke 審核'],['depositMargin','Deposit Margin 審核'],['withdrawMargin','Withdraw Margin 審核'],['claimSettlement','Claim Settlement 審核']]){const option=document.createElement('option');option.value=value;option.textContent=label;select.appendChild(option)}root.appendChild(select);
  const amount=document.createElement('input');amount.type='text';amount.inputMode='numeric';amount.maxLength=78;amount.placeholder='KGEN 最小單位整數（wei）';amount.setAttribute('aria-label','審核用 KGEN 最小單位整數');amount.style.cssText='box-sizing:border-box;max-width:100%;min-height:44px';root.appendChild(amount);
  const claim=document.createElement('input');claim.type='text';claim.maxLength=66;claim.placeholder='Claim position key（bytes32）';claim.setAttribute('aria-label','Claim position key');claim.style.cssText='box-sizing:border-box;max-width:100%;min-height:44px';claim.hidden=true;root.appendChild(claim);
  const refresh=document.createElement('button');refresh.type='button';refresh.className='btn';refresh.textContent='更新審核資訊';refresh.style.minHeight='44px';root.appendChild(refresh);
  const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.appendChild(status);
  const rows=document.createElement('dl');rows.className='exchangeRows';const values={};for(const field of BSC56_REVIEW_FIELDS){const row=document.createElement('div'),label=document.createElement('dt'),value=document.createElement('dd');label.textContent=field;value.dataset.bsc56ReviewField=field;value.style.whiteSpace='pre-wrap';row.append(label,value);rows.appendChild(row);values[field]=value}root.appendChild(rows);
  const session=getWalletSession11520(),controller=createBsc56UnsignedReviewController({getWalletSnapshot:()=>session.snapshot(),onChange:model=>{root.dataset.reviewState=model.status;root.dataset.executionReady='false';status.textContent=`${model.status} · ${model.reason} · NOT EXECUTABLE`;for(const field of BSC56_REVIEW_FIELDS)values[field].textContent=model.fields[field];refresh.disabled=model.status==='BUILDING'}});
  const draft=()=>controller.setDraft({action:select.value,amountWei:amount.value,positionKey:claim.value});
  select.addEventListener('change',()=>{claim.hidden=select.value!=='claimSettlement';amount.hidden=!claim.hidden;draft()});amount.addEventListener('input',draft);claim.addEventListener('input',draft);
  refresh.addEventListener('click',()=>{draft();void controller.prepare()});root.addEventListener('toggle',()=>{if(root.open)controller.open();else controller.close()});
  const unsubscribe=session.subscribe(()=>controller.sync()),syncVisibility=()=>{root.hidden=panel.classList.contains('collapsed');if(root.hidden){root.open=false;controller.close()}};
  const observer=new MutationObserver(syncVisibility);observer.observe(panel,{attributes:true,attributeFilter:['class']});
  const mounted=Object.freeze({controller,root,dispose(){unsubscribe();observer.disconnect();controller.dispose();root.remove();bsc56ReviewMounts.delete(panel)}});bsc56ReviewMounts.set(panel,mounted);
  const existing=$('#walletSimulation');if(existing?.parentElement===panel)existing.after(root);else panel.appendChild(root);controller.close();syncVisibility();return mounted;
}

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
#k11520Bsc56UnsignedReview{min-width:0;max-width:100%;overflow-wrap:anywhere}\n#k11520Bsc56UnsignedReview summary{cursor:pointer}\n#k11520Bsc56UnsignedReview input,#k11520Bsc56UnsignedReview select{display:block;width:100%;margin:8px 0;background:#08131e;color:#e6f4ff;border:1px solid #456477;border-radius:4px;padding:8px;font:inherit}
#k11520Bsc56UnsignedReview option{background:#08131e;color:#e6f4ff}
#k11520Bsc56UnsignedReview input::placeholder{color:#abbcc8;opacity:1}
#k11520Bsc56UnsignedReview input:focus-visible,#k11520Bsc56UnsignedReview select:focus-visible,#k11520Bsc56UnsignedReview button:focus-visible{outline:2px solid #8ceaff;outline-offset:2px}
#k11520Bsc56UnsignedReview input:disabled,#k11520Bsc56UnsignedReview select:disabled,#k11520Bsc56UnsignedReview button:disabled{background:#142332;color:#abbcc8;opacity:1;border-color:#456477;cursor:not-allowed}\n#k11520Bsc56UnsignedReview[hidden],#k11520Bsc56UnsignedReview [hidden]{display:none}
#k11520Bsc56UnsignedReview .exchangeRows dt,#k11520Bsc56UnsignedReview .exchangeRows dd{min-width:0;overflow-wrap:anywhere;word-break:break-word}\n#k11520KgenTransferPreview{margin-top:12px;padding:10px;border:1px solid #4c708c;border-radius:10px;background:#0b1722;color:#e6edf5;font-size:12px;line-height:1.5;min-width:0;overflow-wrap:anywhere}
#k11520KgenTransferPreview summary,#k11520KgenTransferPreview button{min-height:44px;cursor:pointer}
#k11520KgenTransferPreview label{display:block;margin-top:8px}
#k11520KgenTransferPreview input,#k11520KgenTransferPreview button{display:block;box-sizing:border-box;width:100%;min-height:44px;background:#0d1d2c;color:#e6edf5;border:1px solid #6f91ad;border-radius:7px;padding:8px;font:inherit}
#k11520KgenTransferPreview input:focus-visible,#k11520KgenTransferPreview button:focus-visible{outline:2px solid #7fe7ff;outline-offset:2px}
#k11520KgenTransferPreview button:disabled{background:#142332;color:#abbcc8;opacity:1;cursor:not-allowed}
#k11520KgenTransferPreview [hidden],#k11520KgenTransferPreview[hidden]{display:none}
#k11520KgenTransferPreview dt,#k11520KgenTransferPreview dd,#k11520KgenTransferPreview pre{min-width:0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}
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
  if($('#walletPanel')){installBsc56UnsignedReviewUi();installKgenTransferPreviewUi()}
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
