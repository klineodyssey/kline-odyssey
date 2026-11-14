import {createKufoClient} from './kufo-client.mjs';

const PAYLOAD_SHA256='b4c9a5f85dc50074bf016796110c891e0d010561a66e8042163bf3cb29a6714c';
const ORDER=['KUFO','KAIOSAlchemyFurnace','KUFOOutputJindouyun168888','KSHIP','KSHIPConverter'];
const LABELS={KUFO:'KUFO 仙丹',KAIOSAlchemyFurnace:'18911 煉丹爐',KUFOOutputJindouyun168888:'168888 金斗雲',KSHIP:'KSHIP 載體',KSHIPConverter:'511111 蟲洞'};
const ORGAN_LABELS={Furnace:'18911 煉丹爐',Output:'168888 金斗雲',Converter:'511111 KSHIP 蟲洞'};
const KIND_LABELS={deploy:'部署合約',propose:'提出器官啟用提案',execute:'執行到期提案',approve:'授權這次 KAIOS 數量',burn:'煉丹：銷毀 KAIOS 並取得 KUFO'};
const ZERO='0x'+'0'.repeat(40),ZERO_ID='0x'+'0'.repeat(64);
const $=id=>document.getElementById(id),lower=x=>String(x||'').toLowerCase(),same=(a,b)=>!!a&&!!b&&lower(a)===lower(b);
let payload=null,client=null,provider=null,unsubscribe=null,view=null,uiBusy=false,lastError='',reviewDecodeFailed=false,uiEpoch=0;
const errors={
 WRONG_CHAIN:'請在錢包切換至 BNB Smart Chain 主網（56）。',
 NOT_CONNECTED:'請先連接本人錢包，再查核鏈上狀態。',
 OWNER_REQUIRED:'這是王母部署／啟用操作，普通玩家仍可使用已啟用的煉丹功能。',
 OWNER_CHANGED:'Registry Owner 已變更；請由合法持有人核定後再操作。',
 DEPLOYMENTS_REQUIRED:'新五合約尚未全部核實，煉丹尚未啟用。',
 ALLOWANCE_REQUIRED:'請先核准這次確切 KAIOS 數量，再重新預覽煉丹。',
 APPROVAL_REQUIRED:'請先核准這次確切 KAIOS 數量，再重新預覽煉丹。',
 KAIOS_BALANCE_INSUFFICIENT:'本人 KAIOS 餘額不足。',
 KGEN_BALANCE_INSUFFICIENT:'KGEN 持有量未達門檻；這裡只查餘額，不會扣除 KGEN。',
 BNB_BALANCE_INSUFFICIENT:'BNB 餘額不足以支付本筆估算費用。',
 WEB_LOCKS_REQUIRED:'瀏覽器不支援安全跨分頁鎖，無法送交易。請使用支援 Web Locks 的 HTTPS 錢包瀏覽器。',
 REVIEW_EXPIRED:'這份費用預覽已到期，請重新預覽。',
 REVIEW_INVALID:'原預覽已失效，請重新核對。',
 CONTEXT_CHANGED:'帳號、網路或頁面已變更，原預覽已失效。',
 SUBMISSION_UNKNOWN:'錢包送出狀態未知。保留原紀錄，請先核對，不能重送。',
 PENDING_INTENT:'已有待確認交易，請先查核原交易回執。',
 PENDING_ACCOUNT_MISMATCH:'請使用原交易帳戶核對；原紀錄保留。',
 STORAGE_READ_FAILED:'無法讀取交易紀錄，停止送出。請確認此站可使用瀏覽器儲存。',
 STORAGE_WRITE_FAILED:'保存交易紀錄失敗，停止送出。',
 STORAGE_READBACK_FAILED:'交易紀錄讀回不一致，停止送出。',
 AMOUNT_DECIMAL:'請填入精確 KAIOS 數量，最多 18 位小數。',
 INVALID_ALCHEMY_RATIO:'數量須至少 1000 wei，且可精確按原比例轉化。',
 CONFIG_LOCKED:'已有合約部署紀錄，啟用時間不能再變更。',
 NO_INJECTED_WALLET:'請使用本人錢包的 DApp 瀏覽器開啟本站，或安裝相容的錢包擴充套件。',
};
function message(error){
 const code=String(error?.code||'');
 if(errors[code])return errors[code];
 const raw=String(error?.message||'');
 if(/[\u3400-\u9fff]/u.test(raw))return raw;
 return '核對未完成，沒有自動接續交易。'+(code?'（'+code+'）':'');
}
function text(id,value){$(id).textContent=String(value??'—');}
function ether(value){try{return window.ethers.utils.formatEther(String(value));}catch{return '尚未核對';}}
function dateTW(seconds){try{return new Date(Number(seconds)*1000).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false})+' UTC+8';}catch{return '尚未核對';}}
function localTW(seconds){return new Date(Number(seconds)*1000+28800000).toISOString().slice(0,19);}
function readActivation(){
 const value=$('activationTime').value;
 if(!/^\d{4,}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?$/.test(value))throw Object.assign(new Error('請先選定台灣時間的正式啟用時間。'),{code:'ACTIVATION_REQUIRED'});
 const milliseconds=Date.parse(value+'+08:00');
 if(!Number.isSafeInteger(milliseconds)||milliseconds<=0)throw new Error('啟用時間無法核對。');
 return String(Math.floor(milliseconds/1000));
}
function makeReadonlyProvider(){
 const allowed=new Set(['eth_chainId','eth_accounts','eth_getBlockByNumber','eth_getCode','eth_call','eth_getBalance','eth_getTransactionReceipt','eth_getTransactionByHash']);
 let id=0;
 return {async request({method,params=[]}){
  if(method==='eth_accounts')return [];
  if(!allowed.has(method))throw Object.assign(new Error('請連接本人錢包才可進行此步驟。'),{code:'NOT_CONNECTED'});
  const response=await fetch('https://bsc-dataseed.bnbchain.org',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params}),signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('鏈上唯讀查詢暫時不可用。');
  const result=await response.json();if(result.error)throw Object.assign(new Error(result.error.message||'鏈上查詢失敗'),{code:'RPC_READ_FAILED'});
  return result.result;
 }};
}
function chooseProvider(){return window.KGEN_Wallet?.getEthereum?.()||null;}
function initializeClient(selected){
 uiEpoch++;uiBusy=false;
 unsubscribe?.();client?.dispose();provider=selected;
 let storage;
 try{storage=window.localStorage;}catch{throw Object.assign(new Error('瀏覽器拒絕存取交易紀錄，無法安全送單。'),{code:'STORAGE_READ_FAILED'});}
 client=createKufoClient({provider,ethers:window.ethers,payload,storage,lockManager:navigator.locks});
 unsubscribe=client.subscribe(snapshot=>{view=snapshot;render();});
}
function invalidate(reason){
 lastError='';
 try{client?.invalidate?.(reason);}catch(error){lastError=message(error);}
 if(view?.review&&!client?.invalidate){view={...view,review:null};}
 $('acceptReview').checked=false;render();
}
function addDefinition(parent,label,value,mono=false){
 const dt=document.createElement('dt'),dd=document.createElement('dd');
 dt.textContent=label;dd.textContent=String(value??'—');if(mono)dd.className='mono';parent.append(dt,dd);
}
function renderReview(review){
 reviewDecodeFailed=false;
 $('reviewPanel').hidden=!review;
 if(!review)return;
 const host=$('reviewDetails');host.replaceChildren();
 addDefinition(host,'操作',KIND_LABELS[review.kind]||review.kind);
 if(review.contract)addDefinition(host,'合約',LABELS[review.contract]||review.contract);
 if(review.organ)addDefinition(host,'器官',ORGAN_LABELS[review.organ]||review.organ);
 addDefinition(host,'本人帳戶',review.account||review.tx?.from,true);
 addDefinition(host,'網路','BNB Smart Chain · 56');
 addDefinition(host,'目標',review.tx?.to||'建立新合約（不是轉入任意地址）',true);
 if(review.config?.activationTime)addDefinition(host,'不可變啟用時間',dateTW(review.config.activationTime));
 if(review.kind==='deploy'){
  try{
   const artifact=payload.contracts[review.contract],iface=new window.ethers.utils.Interface(artifact.abi);
   if(!review.tx.data.toLowerCase().startsWith(artifact.bytecode.toLowerCase()))throw new Error('建立資料不是本頁原合約。');
   const decoded=window.ethers.utils.defaultAbiCoder.decode(iface.deploy.inputs,'0x'+review.tx.data.slice(artifact.bytecode.length));
   const labels={registry:'Registry 地址',kaiosToken:'KAIOS 地址',kgenToken:'KGEN 地址',canonicalKufoToken:'已核 KUFO 地址',furnace18911:'已核 Furnace 地址',kufoToken:'已核 KUFO 地址',kshipToken:'已核 KSHIP 地址'};
   for(const [i,param]of iface.deploy.inputs.entries()){
    if(param.baseType==='tuple'){
     const c=decoded[i];
     addDefinition(host,'曆法版本',c.version||c[0],true);
     addDefinition(host,'啟用 timestamp',(c.activationTime||c[1]).toString());
     addDefinition(host,'時區',(c.utcOffsetSeconds??c[2]).toString()+' 秒（UTC+8）');
     addDefinition(host,'1 至 12 月星座 ID',Array.from(c.constellationByMonth||c[3],Number).join('、'));
    }else addDefinition(host,labels[param.name]||param.name,decoded[i].toString(),param.type==='address');
   }
  }catch(error){reviewDecodeFailed=true;addDefinition(host,'參數核對失敗','無法從實際交易資料解碼，不開放本人確認。');}
 }
 if(review.candidate)addDefinition(host,'候選合約地址',review.candidate,true);
 if(review.organKey)addDefinition(host,'原器官 key',review.organKey,true);
 if(review.minimumDelay)addDefinition(host,'治理等待',review.minimumDelay+' 秒；以實際提案回執起算');
 if(review.amountWei){addDefinition(host,'KAIOS 數量',ether(review.amountWei));addDefinition(host,'KGEN 持有量門檻',ether(BigInt(review.amountWei)/1000n));addDefinition(host,'預計 KUFO',ether(BigInt(review.amountWei)*1000n));}
 if(review.lifeId)addDefinition(host,'lifeId',review.lifeId===ZERO_ID?'未指定（bytes32 zero）':review.lifeId,true);
 if(review.tx?.data)addDefinition(host,'交易資料雜湊',window.ethers.utils.keccak256(review.tx.data),true);
 text('reviewCost','本筆估算 '+ether(review.maxCostWei)+' BNB。這是此刻的 gas 與費率；送交前會再查核，不會自動提高你的上限。');
}
function renderSteps(s,owner,busy){
 const host=$('deploySteps');host.replaceChildren();
 for(const [index,name]of ORDER.entries()){
  const record=s.deployments?.[name],li=document.createElement('li'),left=document.createElement('div'),label=document.createElement('div'),status=document.createElement('span');
  label.className='step-name';label.textContent=(index+1)+'. '+LABELS[name];left.append(label);
  if(record?.address){const address=document.createElement('div');address.className='step-address mono';address.textContent=record.address;left.append(address);}
  status.className='step-status';status.textContent=record?.address?'鏈上已核':'尚未核實部署';li.append(left,status);host.append(li);
 }
 const organHost=$('organSteps');organHost.replaceChildren();
 for(const [organ,name]of [['Furnace','KAIOSAlchemyFurnace'],['Output','KUFOOutputJindouyun168888'],['Converter','KSHIPConverter']]){
  const route=s.routes?.[organ],candidate=s.deployments?.[name]?.address,enabled=same(route?.address,candidate),hasPending=route&&route.pendingCandidate&&!same(route.pendingCandidate,ZERO),pendingMatches=hasPending&&same(route.pendingCandidate,candidate);
  const box=document.createElement('section');box.className='organ';
  const title=document.createElement('h3');title.textContent=ORGAN_LABELS[organ];box.append(title);
  const status=document.createElement('p');status.className='muted';
  status.textContent=enabled?'原 Registry 已啟用':hasPending?'鏈上已有提案，可執行時間：'+dateTW(route.executableAt):'尚無啟用提案。先核實五份部署回執。';
  box.append(status);
  const controls=document.createElement('div');controls.className='row';
  for(const [action,label]of [['propose','預覽啟用提案'],['execute','預覽到期執行']]){
   const button=document.createElement('button');button.type='button';button.className='prepare-organ';button.dataset.action=action;button.dataset.organ=organ;button.textContent=label;
   const matured=pendingMatches&&s.block?.timestamp&&BigInt(s.block.timestamp)>=BigInt(route.executableAt||0);
   button.disabled=busy||!owner||!candidate||enabled||(action==='propose'?!!hasPending:!matured);
   button.addEventListener('click',()=>run(async current=>{resetConsent();await current.prepare({kind:action,organ});}));controls.append(button);
  }
  box.append(controls);organHost.append(box);
 }
}
function render(){
 if(!client||!view)return;
 const s=view,busy=uiBusy||!!s.active,pending=!!s.pending,connected=!!s.account&&Number(s.chainId)===56;
 const deployments={...(s.chainActive?s.chainDeployments:{}),...s.deployments};
 const cfg=s.chainActive?s.chainConfig:s.config;
 const scheduled=s.chainActive&&s.chainConfig?.activationTime&&s.block?.timestamp&&BigInt(s.block.timestamp)<BigInt(s.chainConfig.activationTime);
 const owner=connected&&same(s.account,s.owner)&&same(s.owner,payload.expectedOwner);
 document.body.classList.toggle('loading',busy);
 text('appStatus',lastError||s.status||'先核對，再由本人錢包確認。');$('appStatus').dataset.state=s.phase||'IDLE';$('appStatus').classList.toggle('error',!!lastError||!!s.error);
 text('walletAccount',s.account||'尚未連接');
 text('walletChain',s.chainId?Number(s.chainId)===56?'BNB Smart Chain · 56':'目前網路 '+s.chainId+'，需要 BSC 56':'需要 BNB Smart Chain · 56');
 text('ownerAddress',s.owner||'尚未查核');
 text('chainState',s.chainActive?(scheduled?'新版路由已核實，等待 '+dateTW(s.chainConfig.activationTime)+' 啟用':'新版五合約與原 Registry 路由已核實／已啟用'):Object.keys(s.deployments||{}).length?'已有核實部署，啟用狀態待查核':'新版尚未核實啟用，保留玩家說明');
 $('connectWallet').disabled=busy;$('refreshStatus').disabled=busy;
 $('prepareDeploy').disabled=busy||pending||!owner||s.chainActive||Object.keys(deployments||{}).length===5;
 $('prepareAlchemy').disabled=busy||pending||!connected;
 $('activationTime').disabled=busy||pending||!!deployments.KUFO?.address;
 $('activationNow').disabled=$('activationTime').disabled;
 if(cfg?.activationTime&&deployments.KUFO?.address)$('activationTime').value=localTW(cfg.activationTime);
 text('ownerReason',pending?'先查核原交易，不能重新部署或變更啟用時間。':owner?'請核對不可變啟用時間。每次只預覽及確認下一筆，沒有自動批次送單。':'此區由王母本人操作。連線帳戶須同時符合指定王母與目前 Registry Owner。');
 text('alchemyReason',pending?'原交易待確認，請先核回執；授權成功也不代表 KUFO 已產出。':scheduled?'正式啟用時間尚未到，請於 '+dateTW(s.chainConfig.activationTime)+' 後重新核對。':s.chainActive?'先預覽。若需要 KAIOS 授權，錢包會先確認該筆；其後由你再預覽煉丹。':'請先查核新版五合約與原 Registry 啟用狀態；不會改用舊 49 Epoch 煉丹爐。');
 text('playerBalance',connected&&s.alchemy?.kaiosBalanceWei!=null?ether(s.alchemy.kaiosBalanceWei)+' KAIOS':'連線並查詢後顯示');
 if(s.review?.amountWei){text('requiredKgen',ether(BigInt(s.review.amountWei)/1000n)+' KGEN（只查）');text('expectedKufo',ether(BigInt(s.review.amountWei)*1000n)+' KUFO');}
 else{text('requiredKgen','依預覽數量核對');text('expectedKufo','依原 1 : 1,000 比例');}
 renderSteps({...s,deployments},owner,busy||pending);
 renderReview(s.review);
 const cap=$('reviewCap').value.trim(),validCap=/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(cap)&&/[1-9]/.test(cap);
 $('confirmReview').disabled=busy||pending||!s.review||reviewDecodeFailed||!$('acceptReview').checked||!validCap;
 $('cancelReview').disabled=busy;
 $('pendingPanel').hidden=!pending;
 if(pending){
  text('pendingState',s.pending.phase==='AWAITING_WALLET'?'正在等待本人錢包；送出結果未取得前不能重送。':'保留原交易，只查核原回執，不會自動送下一筆。');
  text('pendingHash',s.pending.hash||'尚未取得交易 hash；請先查看本人錢包的原請求。');
 }
 $('resumePending').disabled=busy||!pending;
 $('copyPending').disabled=!s.pending?.hash;
}
function resetConsent(){lastError='';$('acceptReview').checked=false;$('reviewCap').value='';}
async function run(operation){
 if(uiBusy)return;
 const epoch=uiEpoch,current=client,isCurrent=()=>epoch===uiEpoch&&current===client;
 uiBusy=true;lastError='';render();
 try{await operation(current,isCurrent);}catch(error){if(isCurrent())lastError=message(error);}
 finally{if(isCurrent()){uiBusy=false;view=current?.snapshot()||view;render();}}
}
async function verifyPayload(){
 const response=await fetch(new URL('./contracts.json',import.meta.url),{cache:'no-cache'});
 if(!response.ok)throw new Error('合約資料載入失敗，請重新整理。');
 const raw=await response.text();
 if(!crypto.subtle)throw new Error('需要安全 HTTPS 環境才能核對合約資料。');
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw))),b=>b.toString(16).padStart(2,'0')).join('');
 if(digest!==PAYLOAD_SHA256)throw new Error('合約資料指紋不符，已停止送單。請重新取得原站資料。');
 return JSON.parse(raw);
}
async function boot(){
 if(!window.ethers||!window.KGEN_Wallet)await new Promise(resolve=>window.addEventListener('load',resolve,{once:true}));
 if(!window.ethers?.utils||!window.KGEN_Wallet?.getEthereum)throw new Error('既有錢包或 ABI 工具未載入。');
 payload=await verifyPayload();
 if(window.__K18911_MOCK__===true)$('mockNotice').hidden=false;
 $('receiptHash').closest('label').hidden=true;
 const month=new Date(Date.now()+28800000).getUTCMonth(),tier=payload.presentation.tierNames[month],star=payload.presentation.constellationNames[payload.calendar.constellationByMonth[month]-1];
 text('monthBadge',(month+1)+' 月 · '+tier+' · '+star+'（整月）');
 const table=$('monthTable');
 for(let i=0;i<12;i++){const row=document.createElement('tr');for(const value of [(i+1)+'月',payload.presentation.tierNames[i],payload.presentation.constellationNames[payload.calendar.constellationByMonth[i]-1]]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}table.append(row);}
 text('sourceEvidence','原五合約 '+payload.programCommit.slice(0,8)+' · 來源 main '+payload.sourceMain.slice(0,8)+' · 合約資料 SHA256 '+PAYLOAD_SHA256);
 initializeClient(chooseProvider()||makeReadonlyProvider());
 $('connectWallet').addEventListener('click',()=>{if(uiBusy)return;try{const selected=chooseProvider();if(selected&&selected!==provider)initializeClient(selected);run(async current=>{if(!selected)throw Object.assign(new Error('請使用本人錢包 DApp 瀏覽器。'),{code:'NO_INJECTED_WALLET'});await current.connect();});}catch(error){lastError=message(error);render();}});
 $('refreshStatus').addEventListener('click',()=>run(current=>current.refresh()));
 $('activationNow').addEventListener('click',()=>{try{$('activationTime').value=localTW(Math.floor(Date.now()/1000));client.setConfig({activationTime:readActivation()});lastError='';}catch(error){lastError=message(error);}render();});
 $('activationTime').addEventListener('change',()=>{resetConsent();try{client.setConfig({activationTime:readActivation()});}catch(error){lastError=message(error);}render();});
 for(const id of ['kaiosAmount','lifeId'])$(id).addEventListener('input',()=>invalidate('煉丹內容已變更，請重新預覽。'));
 $('prepareDeploy').addEventListener('click',()=>run(async(current,isCurrent)=>{resetConsent();const time=readActivation();if(current.snapshot().config.activationTime!==time)current.setConfig({activationTime:time});await current.prepare({kind:'deploy'});if(isCurrent())$('reviewPanel').scrollIntoView({behavior:'auto',block:'start'});}));
 $('prepareAlchemy').addEventListener('click',()=>run(async(current,isCurrent)=>{resetConsent();const request={kind:'burn',amount:$('kaiosAmount').value.trim(),lifeId:$('lifeId').value.trim()||ZERO_ID};try{await current.prepare(request);}catch(error){if(!isCurrent())return;if(!['ALLOWANCE_REQUIRED','APPROVAL_REQUIRED'].includes(error.code))throw error;await current.prepare({...request,kind:'approve'});}if(isCurrent())$('reviewPanel').scrollIntoView({behavior:'auto',block:'start'});}));
 $('cancelReview').addEventListener('click',()=>{resetConsent();invalidate('預覽已取消；沒有送交錢包。');});
 for(const id of ['acceptReview','reviewCap'])$(id).addEventListener('input',render);
 $('confirmReview').addEventListener('click',()=>run(async(current,isCurrent)=>{const s=current.snapshot();if(!s.review)throw Object.assign(new Error('請重新預覽。'),{code:'REVIEW_INVALID'});await current.confirm(s.review.reviewId,{accepted:$('acceptReview').checked,maxCostBNB:$('reviewCap').value.trim()});if(isCurrent()){$('acceptReview').checked=false;if(current.snapshot().pending)$('pendingPanel').scrollIntoView({behavior:'auto',block:'start'});}}));
 $('resumePending').addEventListener('click',()=>run(current=>current.resume()));
 $('copyPending').addEventListener('click',()=>run(async(current,isCurrent)=>{const hash=current.snapshot().pending?.hash;if(hash){await navigator.clipboard.writeText(hash);if(isCurrent())lastError='交易 hash 已複製，請保留原紀錄。';}}));
 $('exportEvidence').addEventListener('click',()=>{try{const data=JSON.stringify({sourceMain:payload.sourceMain,exportedUTC:new Date().toISOString(),snapshot:client.snapshot(),realWalletConfirmation:'Only the holder wallet can confirm transactions'},null,2);const blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='KUFO-18911-public-progress.json';link.click();URL.revokeObjectURL(url);}catch(error){lastError=message(error);render();}});
 window.addEventListener('pagehide',()=>{uiEpoch++;uiBusy=false;unsubscribe?.();client?.dispose();});
 window.addEventListener('pageshow',event=>{if(!event.persisted)return;try{resetConsent();initializeClient(chooseProvider()||makeReadonlyProvider());}catch(error){lastError=message(error);render();}});
}
boot().catch(error=>{text('appStatus',message(error));$('appStatus').dataset.state='BLOCKED';$('appStatus').classList.add('error');for(const id of ['connectWallet','refreshStatus','prepareDeploy','prepareAlchemy','activationNow','confirmReview','resumePending','exportEvidence'])$(id).disabled=true;});
