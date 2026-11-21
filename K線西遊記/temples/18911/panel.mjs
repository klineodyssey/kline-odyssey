import {createKufoClient} from './kufo-client.mjs';

const PAYLOAD_SHA256='b4c9a5f85dc50074bf016796110c891e0d010561a66e8042163bf3cb29a6714c';
const ORDER=['KUFO','KAIOSAlchemyFurnace','KUFOOutputJindouyun168888','KSHIP','KSHIPConverter'];
const LABELS={KUFO:'KUFO 仙丹',KAIOSAlchemyFurnace:'18911 煉丹爐',KUFOOutputJindouyun168888:'168888 金斗雲',KSHIP:'KSHIP 載體',KSHIPConverter:'511111 蟲洞'};
const ORGAN_LABELS={Furnace:'18911 煉丹爐',Output:'168888 金斗雲',Converter:'511111 KSHIP 蟲洞'};
const KIND_LABELS={deploy:'部署合約',propose:'提出器官啟用提案',execute:'執行到期提案',approve:'授權這次 KAIOS 數量',burn:'煉丹：銷毀 KAIOS 並取得 KUFO'};
const ZERO='0x'+'0'.repeat(40),ZERO_ID='0x'+'0'.repeat(64);
const $=id=>document.getElementById(id),lower=x=>String(x||'').toLowerCase(),same=(a,b)=>!!a&&!!b&&lower(a)===lower(b);
let payload=null,client=null,provider=null,unsubscribe=null,view=null,uiBusy=false,lastError='',reviewDecodeFailed=false,uiEpoch=0,recoveryIntentId=null;
let mobileProvider=null,mobileRaw=null,mobileMetadata=null,mobileTopic=null,sdkLoading=null,bridgePending=null,bridgeReadPending=null,bridgeAttempt=null;
let publicProvider=null,nativeIntent=false,nativeAttempt=null,restorePending=null,restoreAttempt=null,nextNativeWallet='',bridgeMessage='';
let mobileNetworkRaw=null;
let confirmAttempt=null,approvalFollowUp=null,continuedReviewId=null;
const BRIDGE_MS=60000;
const SESSION_HINT='kaios18911.walletconnect.hint.v1';
const networkRequests=new WeakMap();
const networkProviderRoots=new WeakMap();
const announcedWallets=new Map();
const BINANCE_WALLET='幣安 Web3 錢包';
const WALLET_DIRECTORY_RECOMMENDATIONS=[
 '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709', // OKX Wallet
 '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4', // Binance Wallet
];
let visibleWallets=[];

export function walletBridgeLanding(href,{connect=true}={}){
 const url=new URL(href);
 if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))throw new Error('錢包橋接需要正式 HTTPS 網址。');
 if(connect){url.searchParams.set('walletBridge','1');url.hash='playerPanel';}return url;
}
export function walletNativeLink(wallet,href,{connect=true}={}){
 const landing=walletBridgeLanding(href,{connect});
 if(wallet==='metamask')return 'https://link.metamask.io/dapp/'+landing.href.replace(/^https:\/\//,'');
 if(wallet==='trust')return 'https://link.trustwallet.com/open_url?coin_id=20000714&url='+encodeURIComponent(landing.href);
 throw new Error('未知的錢包入口。');
}
export function walletNetworkRequestPending(selected){return !!selected&&networkRequests.has(networkProviderRoots.get(selected)||selected);}
function mobileNetworkPending(){return walletNetworkRequestPending(mobileNetworkRaw);}
export async function ensureWalletBsc(selected,{isCurrent=()=>true,timeoutMs=BRIDGE_MS,onSettled=()=>{}}={}){
 if(typeof selected?.request!=='function')throw Object.assign(new Error('請先選擇本人錢包。'),{code:'NO_INJECTED_WALLET'});
 const key=networkProviderRoots.get(selected)||selected;
 if(networkRequests.has(key))throw Object.assign(new Error('原切網請求尚未結束，請先在錢包確認或取消。'),{code:'WALLET_NETWORK_PENDING'});
 let live=true,timer;const slot={};networkRequests.set(key,slot);
 const check=()=>{if(!live||!isCurrent())throw Object.assign(new Error('頁面或錢包已變更，請本人重新連接。'),{code:'CONTEXT_CHANGED'});};
 const request=async args=>{check();const result=await selected.request(args);check();return result;};
 const chain=async()=>{const value=await request({method:'eth_chainId'});try{return BigInt(value);}catch{throw Object.assign(new Error('錢包網路回覆無法核對。'),{code:'INVALID_CHAIN_ID'});}};
 const work=(async()=>{
  if(await chain()===56n)return;
  try{await request({method:'wallet_switchEthereumChain',params:[{chainId:'0x38'}]});}
  catch(error){
   check();
   const code=Number(error?.code);
   if(code===4001)throw Object.assign(new Error('已取消切換網路；請在錢包選擇 BSC 56 後再連接，沒有送出交易。'),{code});
   if(code===4902)throw Object.assign(new Error('錢包尚未加入 BNB Smart Chain；請先在錢包加入 BSC 主網（56），再回來連接。'),{code});
   if(code===4200||code===-32601)throw Object.assign(new Error('此錢包不支援網頁切網；請在錢包手動選擇 BSC 主網（56），再回來連接。'),{code});
   throw error;
  }
  if(await chain()!==56n)throw Object.assign(new Error('錢包尚未切換至 BSC 主網（56），請確認錢包網路後重新連接。'),{code:'WRONG_CHAIN'});
 })();
 work.finally(()=>{if(networkRequests.get(key)===slot)networkRequests.delete(key);try{onSettled();}catch{}}).catch(()=>{});
 try{return await Promise.race([work,new Promise((_,reject)=>{timer=setTimeout(()=>{live=false;reject(Object.assign(new Error('切換網路等待逾時；原請求結束前不重複要求，請先查看錢包。'),{code:'WALLET_NETWORK_TIMEOUT'}));},timeoutMs);})]);}
 finally{live=false;clearTimeout(timer);}
}
export function waitForWalletProvider(pick,{target=window,timeoutMs=4000,intervalMs=100,signal}={}){
 return new Promise((resolve,reject)=>{
  let timer,interval,settled=false;
  const cleanup=()=>{clearTimeout(timer);clearInterval(interval);target.removeEventListener('ethereum#initialized',probe);target.removeEventListener('eip6963:announceProvider',announced);signal?.removeEventListener('abort',aborted);};
  const finish=(value,error)=>{if(settled)return;settled=true;cleanup();error?reject(error):resolve(value);};
  const probe=provider=>{try{const selected=pick(provider);if(typeof selected?.request==='function')finish(selected);}catch(error){finish(null,error);}};
  const announced=event=>probe(event.detail?.provider);
  const aborted=()=>finish(null,Object.assign(new Error('已取消等待錢包。'),{name:'AbortError',code:'WALLET_DISCOVERY_CANCELLED'}));
  if(signal?.aborted){aborted();return;}
  target.addEventListener('ethereum#initialized',probe);target.addEventListener('eip6963:announceProvider',announced);signal?.addEventListener('abort',aborted,{once:true});
  probe();if(settled)return;
  timer=setTimeout(()=>finish(null),timeoutMs);interval=setInterval(()=>probe(),intervalMs);
  target.dispatchEvent(new (target.Event||Event)('eip6963:requestProvider'));
 });
}
function walletMetadata(){
 const url=new URL(window.location.href);url.search='';url.hash='';
 return {name:'K18911 KUFO 煉丹爐',description:'18911 本人錢包連線',url:url.href,icons:[],redirect:{universal:walletBridgeLanding(url.href).href}};
}
function sessionHint(value){try{if(value===undefined)return sessionStorage.getItem(SESSION_HINT)==='1';value?sessionStorage.setItem(SESSION_HINT,'1'):sessionStorage.removeItem(SESSION_HINT);}catch{}return false;}
export function walletConnectSessionPermits(raw,metadata,topic,account){
 const s=raw?.session,m=s?.self?.metadata;
 if(!metadata||!topic||s?.topic!==topic||m?.name!==metadata.name||m?.url!==metadata.url||!Number.isSafeInteger(s?.expiry)||s.expiry<=Date.now()/1000)return false;
 const accounts=[s.namespaces?.eip155,s.namespaces?.['eip155:56']].flatMap(n=>Array.isArray(n?.accounts)?n.accounts:[]).filter(a=>/^eip155:56:0x[0-9a-f]{40}$/i.test(a));
 return account?accounts.some(a=>a.toLowerCase()==='eip155:56:'+String(account).toLowerCase()):accounts.length>0;
}
function showWalletBridge(){
 const linked=!!view?.account&&Number(view.chainId)===56&&provider!==publicProvider&&(provider!==mobileProvider||walletConnectSessionPermits(mobileRaw,mobileMetadata,mobileTopic,view.account));
 resetConsent();invalidate(linked?'此頁已連線；另開錢包內頁不會移走此頁的連線，交易仍須重新預覽。':'連接目前頁面後，在錢包確認並返回這裡查看帳戶；連線不會送出交易。');
 $('walletBridgePanel').hidden=false;
 requestInjectedWallets();
 renderInjectedWallets();
 $('walletBridgePanel').scrollIntoView({behavior:'auto',block:'start'});
}
function cancelWalletBridge(){
 sessionHint(false);
 nativeIntent=false;const native=nativeAttempt;nativeAttempt=null;native?.cancel();rollbackBridgeClient(native);
 const restoring=restoreAttempt;restoreAttempt=null;restoring?.cancel();rollbackBridgeClient(restoring);
 consumeNativeIntent();nextNativeWallet='';bridgeMessage='';
 const attempt=bridgeAttempt;bridgeAttempt=null;attempt?.cancel();
 try{mobileRaw?.modal?.closeModal?.();}catch{}
 rollbackBridgeClient(attempt);
 lastError=bridgePending||bridgeReadPending?'已取消接入；等待原錢包請求結束，遲到回覆不會連線或送交易。':'已取消錢包連線。';
 if(native?.client)verifyStopped='已取消錢包內頁連線；請本人重新連接，或按查詢鏈上狀態唯讀核對。';
 render();scheduleVerification();
}
function rollbackBridgeClient(attempt){
 if(attempt?.client&&(client===attempt.client||provider===attempt.adoptedProvider)){
  [mobileProvider,mobileRaw,mobileMetadata,mobileTopic]=attempt.previousMobile;
  initializeClient(attempt.previousProvider);
 }
}
function setupWalletUrls(){
 const furnace=new URL('index.html',window.location.href);furnace.search='';furnace.hash='';
 const targets={furnace:furnace.href,site:new URL('../../../',furnace).href};let copyEpoch=0;
 for(const [inputId,linkId,copyId,key,label]of [
  ['officialSiteUrl','officialSiteLink','copyOfficialSiteUrl','site','官網'],
  ['furnacePageUrl','furnacePageLink','copyFurnaceUrl','furnace','18911'],
 ]){
  const input=$(inputId);input.value=targets[key];$(linkId).href=targets[key];
  $(copyId).addEventListener('click',async()=>{
   const sequence=++copyEpoch,epoch=uiEpoch,current=()=>sequence===copyEpoch&&epoch===uiEpoch&&!pageAway&&document.visibilityState==='visible';
   try{await navigator.clipboard.writeText(input.value);if(current())text('walletUrlStatus',label+'網址已複製，可貼到錢包的 DApp 瀏覽器。');}
   catch{if(!current())return;input.focus();input.select();text('walletUrlStatus','已選取'+label+'網址，請長按或按 Ctrl+C 複製。');}
  });
 }
 const update=()=>{
  const key=$('walletDestination').value==='site'?'site':'furnace';
  $('walletDestinationLink').href=targets[key];$('walletDestinationLink').textContent=targets[key];
  for(const [id,wallet]of [['openMetaMask','metamask'],['openTrustWallet','trust']]){
   $(id).href=walletNativeLink(wallet,targets[key],{connect:key==='furnace'});
   $(id).textContent='只在 '+(wallet==='metamask'?'MetaMask':'Trust Wallet')+' 內開啟'+(key==='furnace'?'18911':'官網首頁');
  }
 };
 $('walletDestination').addEventListener('change',update);update();
}
function walletFactory(){
 const sdk=window.WalletConnectEthereumProvider||window['@walletconnect/ethereum-provider'];
 return sdk?.init?sdk:sdk?.EthereumProvider?.init?sdk.EthereumProvider:sdk?.default;
}
async function loadWalletFactory(){
 if(!walletFactory()?.init){
  // Fixed browser compatibility value for the existing pinned SDK, not host environment access.
  if(typeof window.process==='undefined')window.process=Object.freeze({env:Object.freeze({NODE_ENV:'production'})});
  sdkLoading ||= new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src='https://unpkg.com/@walletconnect/ethereum-provider@2.12.2/dist/index.umd.js';
   script.integrity='sha384-Fuh8lPTDFjBwwB4D6KOigvxCgDcPV9rAbE7m0OcFJ5IISKrEqq76h7EANVG5Vy6S';script.crossOrigin='anonymous';
   script.onload=resolve;script.onerror=()=>reject(new Error('錢包橋接套件載入失敗，請稍後手動重試。'));document.head.append(script);
  }).catch(error=>{sdkLoading=null;throw error;});
  await sdkLoading;
 }
 const factory=walletFactory();if(!factory?.init)throw new Error('錢包橋接套件入口不可用。');return factory;
}
function mobileWalletOptions(metadata){
 return {
  projectId:'ed256d3118a9c971d550ed5ee522b4d9',
  chains:[56],
  optionalMethods:['wallet_switchEthereumChain'],
  metadata,
  storageOptions:{database:'kaios18911-walletconnect'},
  showQrModal:true,
  qrModalOptions:{themeMode:'dark',enableExplorer:true,explorerRecommendedWalletIds:[...WALLET_DIRECTORY_RECOMMENDATIONS]},
 };
}
function guardedMobile(raw,metadata,topic){
 const guarded={async request(args){
  const sender=args.method==='eth_sendTransaction'?args.params?.[0]?.from:undefined;
  if(!walletConnectSessionPermits(raw,metadata,topic,sender))throw new Error('錢包連線已到期或未授權 BSC 帳戶，請重新連線。');
  const result=await raw.request(args);
  if(['eth_accounts','eth_requestAccounts'].includes(args.method)&&(!Array.isArray(result)||result.some(a=>!walletConnectSessionPermits(raw,metadata,topic,a))))throw new Error('錢包回傳的帳戶不在本次 BSC 授權內。');
  return result;
 },on:(...args)=>raw.on?.(...args),removeListener:(...args)=>raw.removeListener?.(...args)};
 networkProviderRoots.set(guarded,raw);return guarded;
}
async function connectMobileWallet({chooseAgain=false}={}){
 if(bridgePending||bridgeReadPending||bridgeAttempt||restorePending||nativeAttempt||uiBusy||walletNetworkRequestPending(provider)||mobileNetworkPending())return;
 $('walletBridgePanel').hidden=false;$('cancelWalletBridge').scrollIntoView({behavior:'auto',block:'center'});
 resetVerification();resetConsent();invalidate('正在連接這個頁面；請在錢包確認連線後返回這裡查看帳戶。');
 const metadata=walletMetadata();
 let cancel,timeout;const stopped=new Promise((_,reject)=>{cancel=()=>reject(Object.assign(new Error('錢包連線已取消。'),{code:4001}));timeout=setTimeout(()=>reject(new Error('錢包連線等待逾時；原請求結束前不重複連線。')),BRIDGE_MS);});
 const attempt={cancel,previousProvider:provider,previousMobile:[mobileProvider,mobileRaw,mobileMetadata,mobileTopic]};bridgeAttempt=attempt;lastError='';
 const work=(async()=>{
  const factory=await loadWalletFactory();if(bridgeAttempt!==attempt)return null;
  const raw=await factory.init(mobileWalletOptions(metadata));
  if(bridgeAttempt!==attempt)return null;mobileRaw=raw;
  const previousTopic=raw.session?.topic;
  const pairAgain=!!raw.session&&(chooseAgain||!walletConnectSessionPermits(raw,metadata,previousTopic));
  if(pairAgain)await raw.connect();
  else await raw.enable();
  if(bridgeAttempt!==attempt)return null;
  const topic=raw.session?.topic;
  if(pairAgain&&topic===previousTopic)throw new Error('未收到新的錢包連線。請重新選擇錢包並批准本頁。');
  if(!walletConnectSessionPermits(raw,metadata,topic))throw new Error('錢包未授權有效的 BSC 56 帳戶，尚未連線。');
  return {raw,topic};
 })();
 bridgePending=work;render();
 work.finally(()=>{if(bridgePending===work){bridgePending=null;render();scheduleVerification();}}).catch(()=>{});
 try{
  const ready=await Promise.race([work,stopped]);if(!ready||bridgeAttempt!==attempt)return;
  sessionHint(true);
  // Wallet app approval can arrive while this browser is backgrounded. Resume only reads on return.
  if(document.visibilityState!=='visible'||pageAway){
   await Promise.race([new Promise(resolve=>{
    const visible=()=>{if(document.visibilityState==='visible'&&!pageAway){document.removeEventListener('visibilitychange',visible);window.removeEventListener('pageshow',visible);resolve();}};
    attempt.cleanup=()=>{document.removeEventListener('visibilitychange',visible);window.removeEventListener('pageshow',visible);};
    document.addEventListener('visibilitychange',visible);window.addEventListener('pageshow',visible);
   }),stopped]);
  }
  if(bridgeAttempt!==attempt)return;
  mobileMetadata=metadata;mobileTopic=ready.topic;mobileProvider=guardedMobile(ready.raw,metadata,ready.topic);
  initializeClient(mobileProvider);attempt.client=client;attempt.adoptedProvider=mobileProvider;
  const connection=run(connectOnBsc);bridgeReadPending=connection;
  connection.finally(()=>{if(bridgeReadPending===connection){bridgeReadPending=null;render();scheduleVerification();}}).catch(()=>{});
  await Promise.race([connection,stopped]);
  if(bridgeAttempt===attempt&&client===attempt.client&&view?.account&&Number(view.chainId)===56){
   $('walletBridgePanel').hidden=!nextNativeWallet;
   if(!nextNativeWallet&&document.visibilityState==='visible'&&!pageAway)$('originalPageConnection').scrollIntoView({behavior:'auto',block:'center'});
   bridgeMessage=nextNativeWallet?'原頁已連線。現在再點「在錢包內開啟18911」，錢包內頁也會請你確認連線。':'';
  }
 }catch(error){if(bridgeAttempt===attempt){rollbackBridgeClient(attempt);lastError=Number(error.code)===4001?'錢包連線已取消；沒有送出交易。':message(error);render();}}
 finally{clearTimeout(timeout);attempt.cleanup?.();if(bridgeAttempt===attempt)bridgeAttempt=null;render();scheduleVerification();}
}
function consumeNativeIntent(){
 const url=new URL(window.location.href);if(!url.searchParams.has('walletBridge'))return;
 url.searchParams.delete('walletBridge');history.replaceState(history.state,'',url.href);
}
async function restoreMobileSession(){
 if(restorePending||bridgeAttempt||bridgePending||nativeAttempt||uiBusy||!sessionHint())return false;
 clearVerificationTimer();
 let cancel,timeout;
 const stopped=new Promise((_,reject)=>{cancel=()=>reject(Object.assign(new Error('已取消恢復連線。'),{code:4001}));timeout=setTimeout(()=>reject(new Error('恢復連線逾時；原查核結束前不重複恢復，仍可查詢狀態。')),BRIDGE_MS);});
 const epoch=uiEpoch,metadata=walletMetadata(),attempt={cancel,previousProvider:provider,previousMobile:[mobileProvider,mobileRaw,mobileMetadata,mobileTopic]};restoreAttempt=attempt;
 $('walletBridgePanel').hidden=false;
 const restoring=(async()=>{
  const factory=await loadWalletFactory();if(restoreAttempt!==attempt||epoch!==uiEpoch||pageAway||document.visibilityState!=='visible')return false;
  const raw=await factory.init(mobileWalletOptions(metadata));
  if(restoreAttempt!==attempt||epoch!==uiEpoch||pageAway||document.visibilityState!=='visible')return false;
  const topic=raw.session?.topic;
  if(!walletConnectSessionPermits(raw,metadata,topic)){sessionHint(false);bridgeMessage='先前連線已到期或尚未獲准，請按連線重新選擇本人錢包。';return false;}
  mobileRaw=raw;mobileMetadata=metadata;mobileTopic=topic;mobileProvider=guardedMobile(raw,metadata,topic);
  initializeClient(mobileProvider);attempt.client=client;attempt.adoptedProvider=mobileProvider;
  await run(current=>current.refresh());
  const connected=restoreAttempt===attempt&&client===attempt.client&&!!view?.account&&Number(view.chainId)===56&&!view.error&&['CONNECTED','PENDING'].includes(view.phase)&&!pageAway&&document.visibilityState==='visible';
  if(connected)$('walletBridgePanel').hidden=!nextNativeWallet;
  return connected;
 })();
 restorePending=restoring;render();
 restoring.finally(()=>{if(restorePending===restoring){restorePending=null;render();scheduleVerification();}}).catch(()=>{});
 try{return await Promise.race([restoring,stopped]);}catch(error){if(restoreAttempt===attempt){rollbackBridgeClient(attempt);sessionHint(false);lastError=message(error);}return false;}
 finally{clearTimeout(timeout);if(restoreAttempt===attempt)restoreAttempt=null;render();scheduleVerification();}
}
async function connectNativeLanding(){
 if(!nativeIntent||nativeAttempt||bridgeAttempt||restoreAttempt||pageAway||document.visibilityState!=='visible')return;
 clearVerificationTimer();
 let cancel,timeout;
 const stopped=new Promise((_,reject)=>{cancel=()=>reject(Object.assign(new Error('錢包連線已取消。'),{code:4001}));timeout=setTimeout(()=>reject(new Error('錢包連線逾時；原請求結束前不重複要求連線。')),BRIDGE_MS);});
 const attempt={controller:new AbortController(),cancel:()=>{attempt.controller.abort();cancel();},epoch:uiEpoch,previousProvider:provider,previousMobile:[mobileProvider,mobileRaw,mobileMetadata,mobileTopic]};nativeAttempt=attempt;
 bridgeMessage='正在等待錢包開啟18911並提供連線，請在本人錢包確認。';$('walletBridgePanel').hidden=false;render();
 try{
  const selected=await Promise.race([waitForWalletProvider(chooseInjectedProvider,{signal:attempt.controller.signal}),stopped]);
  if(nativeAttempt!==attempt||attempt.epoch!==uiEpoch||pageAway||document.visibilityState!=='visible')return;
  nativeIntent=false;consumeNativeIntent();
  if(injectedWallets().length>1){
   showWalletBridge();
  }else if(selected){
   initializeClient(selected);attempt.client=client;attempt.adoptedProvider=selected;
   const connection=run(connectOnBsc);bridgeReadPending=connection;
   connection.finally(()=>{if(bridgeReadPending===connection){bridgeReadPending=null;render();scheduleVerification();}}).catch(()=>{});
   await Promise.race([connection,stopped]);
   if(nativeAttempt===attempt&&client===attempt.client&&view?.account&&Number(view.chainId)===56)$('walletBridgePanel').hidden=true;
  }else{nativeAttempt=null;clearTimeout(timeout);if(!await restoreMobileSession()){bridgeMessage='錢包尚未提供連線。可按「連接原頁」重新選擇錢包，或在錢包內重新開啟18911。';$('walletBridgePanel').hidden=false;}}
 }catch(error){if(nativeAttempt===attempt&&error.code!=='WALLET_DISCOVERY_CANCELLED'){rollbackBridgeClient(attempt);nativeIntent=false;consumeNativeIntent();lastError=message(error);if(attempt.client)verifyStopped=lastError;}}
 finally{clearTimeout(timeout);if(nativeAttempt===attempt)nativeAttempt=null;render();scheduleVerification();}
}
const VERIFY_INTERVAL_MS=30000;
const UNKNOWN_HASH_STOP='原交易尚無 hash，請從本人錢包取回此次原請求的 hash，再於下方唯讀核對。';
let verifyTimer=null,verifyFailures=0,verifyStopped='',lastVerifiedAt=null,pageAway=false;
const errors={
 WRONG_CHAIN:'錢包尚未切換至 BSC 主網（56），請在錢包確認後再連接。',
 NOT_CONNECTED:'請先連接本人錢包，再查核鏈上狀態。',
 OWNER_REQUIRED:'這是王母部署／啟用操作，普通玩家仍可使用已啟用的煉丹功能。',
 OWNER_CHANGED:'Registry Owner 已變更；請由合法持有人核定後再操作。',
 DEPLOYMENTS_REQUIRED:'新五合約尚未全部核實，煉丹尚未啟用。',
 ALLOWANCE_REQUIRED:'此金額需要先授權 KAIOS，授權核實後會接續煉丹確認。',
 APPROVAL_REQUIRED:'此金額需要先授權 KAIOS，授權核實後會接續煉丹確認。',
 KAIOS_BALANCE_INSUFFICIENT:'本人 KAIOS 餘額不足。',
 KGEN_BALANCE_INSUFFICIENT:'KGEN 持有量未達門檻；這裡只查餘額，不會扣除 KGEN。',
 BNB_BALANCE_INSUFFICIENT:'BNB 餘額不足以支付本筆估算費用。',
 WEB_LOCKS_REQUIRED:'瀏覽器不支援安全跨分頁鎖，無法送交易。請使用支援 Web Locks 的 HTTPS 錢包瀏覽器。',
 REVIEW_EXPIRED:'這份費用預覽已到期，請重新預覽。',
 REVIEW_INVALID:'原預覽已失效，請重新核對。',
 CONTEXT_CHANGED:'頁面或錢包已變更；請本人重新連接並重新預覽。',
 SUBMISSION_UNKNOWN:'錢包送出狀態未知。保留原紀錄，請先核對，不能重送。',
 PENDING_INTENT:'已有待確認交易，請先查核原交易回執。',
 PENDING_ACCOUNT_MISMATCH:'請使用原交易帳戶核對；原紀錄保留。',
 STORAGE_READ_FAILED:'無法讀取交易紀錄，停止送出。請確認此站可使用瀏覽器儲存。',
 STORAGE_WRITE_FAILED:'保存交易紀錄失敗，停止送出。',
 STORAGE_READBACK_FAILED:'交易紀錄讀回不一致，停止送出。',
 AMOUNT_DECIMAL:'請填入精確 KAIOS 數量，最多 18 位小數。',
 INVALID_ALCHEMY_RATIO:'數量須至少 1000 wei，且可精確按原比例轉化。',
 CONFIG_LOCKED:'已有部署紀錄，需先核實是否全部確定失敗；成功或結果不明的部署不能變更時間。',
 RECOVERY_CONSENT_REQUIRED:'請確認這是本人錢包此次原請求的交易 hash。',
 RECOVERY_NOT_CONFIRMED:'這筆交易尚未取得可核實的鏈上回執，原紀錄保留，不能重送。',
 RECOVERY_HASH_CONFLICT:'此 hash 已屬於另一份已保存交易，不能替換原請求。',
 LEGACY_RECOVERY_UNBOUNDED:'舊紀錄缺少可核對的送出時界，無法安全接回 hash；請保留紀錄人工核對。',
 NO_INJECTED_WALLET:'請按「連接本人錢包」，選擇錢包橋接或開啟手機錢包。',
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
function clearVerificationTimer(){if(verifyTimer!==null)clearTimeout(verifyTimer);verifyTimer=null;}
function renderVerification(){
 const el=$('autoVerifyStatus');if(!el)return;
 const last=lastVerifiedAt?'；上次 '+dateTW(lastVerifiedAt/1000):'';
 const state=verifyStopped?'已停止：'+verifyStopped:pageAway||document.visibilityState==='hidden'?'頁面在背景，已暫停':view?.review?'預覽中，暫停自動查核':uiBusy||view?.active?'等待目前操作完成':'前景每 30 秒查核，不會自動送交易';
 el.textContent='自動唯讀查核：'+state+last;
 el.dataset.state=verifyStopped?'STOPPED':pageAway||document.visibilityState==='hidden'?'HIDDEN':view?.review?'REVIEW':uiBusy||view?.active?'BUSY':'READY';
}
function resetVerification(){clearVerificationTimer();verifyFailures=0;verifyStopped='';renderVerification();}
function scheduleVerification(delay=VERIFY_INTERVAL_MS){
 if(view?.phase==='CONFIRMED_REVERTED'&&!verifyStopped)verifyStopped='原交易已在鏈上失敗，證據已保存；請先按查詢鏈上狀態核對。';
 clearVerificationTimer();renderVerification();
 if(!client||pageAway||document.visibilityState==='hidden'||verifyStopped||bridgeAttempt||nativeIntent||nativeAttempt||restoreAttempt)return;
 verifyTimer=setTimeout(()=>{verifyTimer=null;void verifyAutomatically();},delay);
}
async function verifyAutomatically(){
 if(!client||pageAway||document.visibilityState==='hidden'||verifyStopped)return;
 if(uiBusy||view?.active||view?.review||bridgeAttempt||nativeIntent||nativeAttempt||restoreAttempt){scheduleVerification();return;}
 if(view?.pending&&!view.pending.hash){verifyStopped=UNKNOWN_HASH_STOP;renderVerification();return;}
 const epoch=uiEpoch,current=client,isCurrent=()=>epoch===uiEpoch&&current===client;
 uiBusy=true;render();
 try{
  await current.verify();
  if(isCurrent()){lastError='';lastVerifiedAt=Date.now();await continueAlchemy(current,isCurrent);}
 }
 catch(error){
  if(!isCurrent()||pageAway||document.visibilityState==='hidden')return;
  lastError=message(error);
  const code=String(error?.code||''),technical=(!code||error?.name==='TimeoutError'||['RPC_READ_FAILED','NETWORK_ERROR','SERVER_ERROR','TIMEOUT','TRANSPORT_CLOSED','-32000','-32603'].includes(code))&&!/revert|denied|forbidden|permission|unauthori[sz]ed|quota|rate.limit|limit.exceeded|拒絕|權限|政策|額度/i.test(String(error?.message||''));
  if(['CONTEXT_CHANGED','DISPOSED'].includes(code))return;
  if(code==='ANOTHER_TAB_ACTIVE'){
   lastError='另一分頁正在處理錢包操作。操作鎖釋放後，面板會自動核對原回執。';
   return;
  }
  if(technical)verifyFailures++;
  if(!technical||verifyFailures>=2)verifyStopped=technical?'已發生兩次讀查錯誤；請按查詢鏈上狀態後重新核對。':lastError;
 }
 finally{if(isCurrent()){uiBusy=false;view=current.snapshot();render();scheduleVerification();}}
}
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
  if(!response.ok){const status=response.status,denied=[401,402,403].includes(status),limited=status===429;throw Object.assign(new Error(denied?'鏈上唯讀查詢權限遭拒絕，已停止自動查核。':limited?'公開查詢額度已達限制，已停止自動查核。':'鏈上唯讀查詢暫時不可用。'),{code:denied?'RPC_PERMISSION_DENIED':limited?'RPC_QUOTA_LIMIT':status>=500?'RPC_READ_FAILED':'RPC_REQUEST_FAILED',httpStatus:status});}
  const result=await response.json();if(result.error){const raw=String(result.error.message||'鏈上查詢失敗'),rpcCode=Number(result.error.code),blocked=[401,402,403,4001,4100].includes(rpcCode)||/denied|forbidden|permission|unauthori[sz]ed|拒絕|權限|政策/i.test(raw),limited=[-32005,429].includes(rpcCode)||/quota|rate.limit|limit.exceeded|額度/i.test(raw);throw Object.assign(new Error(raw),{code:blocked?'RPC_PERMISSION_DENIED':limited?'RPC_QUOTA_LIMIT':'RPC_READ_FAILED',rpcCode});}
  return result.result;
 }};
}
function injectedWallets(){
 const wallets=new Map();
 const add=(candidate,name='')=>{
  if(typeof candidate?.request!=='function'||wallets.has(candidate))return;
  const label=name||(
   candidate.isBinance===true?BINANCE_WALLET:
   candidate.isOkxWallet===true?'OKX Wallet':
   candidate.isTrust===true||candidate.isTrustWallet===true?'Trust Wallet':
   candidate.isCoinbaseWallet===true?'Coinbase Wallet':
   candidate.isMetaMask===true?'MetaMask':'瀏覽器錢包'
  );
  wallets.set(candidate,label);
 };
 add(window.binancew3w?.ethereum,BINANCE_WALLET);
 add(window.BinanceChain,BINANCE_WALLET);
 add(window.okxwallet?.ethereum||window.okxwallet,'OKX Wallet');
 add(window.trustwallet?.ethereum||window.trustwallet,'Trust Wallet');
 for(const [candidate,name] of announcedWallets)add(candidate,name);
 const ethereum=window.ethereum;
 const legacy=Array.isArray(ethereum?.providers)?ethereum.providers.filter(candidate=>typeof candidate?.request==='function'):[];
 for(const candidate of legacy)add(candidate);
 if(!legacy.length)add(ethereum);
 return [...wallets];
}
function requestInjectedWallets(){
 window.dispatchEvent(new Event('eip6963:requestProvider'));
}
function chooseInjectedProvider(){
 return injectedWallets()[0]?.[0]||null;
}
function chooseProvider(wallets=injectedWallets()){
 if(wallets.some(([candidate])=>candidate===provider))return provider;
 if(mobileProvider&&walletConnectSessionPermits(mobileRaw,mobileMetadata,mobileTopic))return mobileProvider;
 return wallets.length===1?wallets[0][0]:null;
}
function renderInjectedWallets(){
 if($('walletBridgePanel').hidden)return;
 const options=$('injectedWalletOptions'),wallets=injectedWallets();
 if(wallets.length!==visibleWallets.length||wallets.some(([candidate,label],i)=>candidate!==visibleWallets[i][0]||label!==visibleWallets[i][1])){
  const buttons=wallets.map(([candidate,label])=>{
   const button=document.createElement('button');
   button.type='button';
   button.textContent=label;
   button.addEventListener('click',()=>connectSelectedProvider(candidate));
   return button;
  });
  options.replaceChildren(...buttons);
  visibleWallets=wallets;
 }
 options.hidden=wallets.length===0;
 const locked=$('chooseWallet').disabled;
 for(const [i,button] of Array.from(options.children).entries()){
  button.disabled=locked;
  button.setAttribute('aria-pressed',String(wallets[i][0]===provider&&!!view?.account));
 }
}
function walletConnectionBusy(){
 return (provider!==publicProvider&&(uiBusy||!!view?.active))||walletNetworkRequestPending(provider)||mobileNetworkPending()||!!bridgePending||!!bridgeReadPending||!!bridgeAttempt||!!nativeAttempt||!!restoreAttempt;
}
function connectSelectedProvider(selected){
 if(!selected||selected===publicProvider||walletConnectionBusy())return;
 if(selected!==mobileProvider&&!injectedWallets().some(([candidate])=>candidate===selected))return;
 resetVerification();
 try{
  if(selected!==provider||uiBusy)initializeClient(selected);
  void run(connectOnBsc);
 }catch(error){lastError=message(error);render();}
}
function initializeClient(selected){
 clearVerificationTimer();
 uiEpoch++;uiBusy=false;confirmAttempt=null;approvalFollowUp=null;
 unsubscribe?.();client?.dispose();provider=selected;
 let storage;
 try{storage=window.localStorage;}catch{throw Object.assign(new Error('瀏覽器拒絕存取交易紀錄，無法安全送單。'),{code:'STORAGE_READ_FAILED'});}
 client=createKufoClient({provider,ethers:window.ethers,payload,storage,lockManager:navigator.locks});
 unsubscribe=client.subscribe(snapshot=>{
  if(approvalFollowUp&&(!same(snapshot.account,approvalFollowUp.account)||Number(snapshot.chainId)!==56))approvalFollowUp=null;
  view=snapshot;render();
 });
 scheduleVerification(0);
}
function invalidate(reason){
 lastError='';approvalFollowUp=null;
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
 const isApproval=review.kind==='approve',isBurn=review.kind==='burn';
 text('reviewTitle',isApproval?'授權 KAIOS':isBurn?'確認煉丹':'核對這一筆交易');
 text('confirmReview',isApproval?'用錢包確認授權':isBurn?'用錢包確認煉丹':'交由本人錢包確認');
 const continuation=$('alchemyContinuation');
 continuation.hidden=!isApproval&&review.reviewId!==continuedReviewId;
 continuation.textContent=isApproval?'授權核實後會接續煉丹，金額會保留。':'授權完成，請確認煉丹。';
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
function renderConfirmFeedback(s){
 const el=$('confirmStatus'),attempt=confirmAttempt;
 if(!attempt||attempt.client!==client||attempt.epoch!==uiEpoch){el.hidden=true;return;}
 let state,body,error=false,code=s.error?.code||'';
 if(s.pending){
  state=s.pending.hash?'SUBMITTED':'PENDING';
  body=s.pending.hash?'已取得原交易 ID，仍須核對鏈上回執；不會自動送下一筆。':'原請求已保存，正在最後核對或等待本人錢包；尚未取得交易 ID，請勿重複點按。';
  if(lastError){body+=' '+lastError;error=true;}
 }else if(lastError||s.error){state='ERROR';body=lastError||message(s.error);error=true;}
 else if(s.phase==='REJECTED'){state='REJECTED';body=s.status;}
 else if(!attempt.finished){state='CHECKING';body='已收到確認，正在重新核對帳戶、授權及費用，尚未開啟錢包確認。請勿重複點按。';}
 else{state=s.phase||'IDLE';body=s.status||'核對已結束；請查看這筆原紀錄，不會自動接續交易。';}
 if(attempt.terminal&&!s.pending){({state,body,error,code}=attempt.terminal);}
 else if(attempt.finished&&!s.pending&&['ERROR','REJECTED'].includes(state))attempt.terminal={state,body,error,code};
 el.hidden=false;el.textContent=body;el.dataset.state=state;el.dataset.errorCode=code;el.classList.toggle('error',error);
 if(attempt.stage!==state||attempt.code!==code){
  attempt.stage=state;attempt.code=code;
  if(!pageAway&&document.visibilityState==='visible')requestAnimationFrame(()=>{if(confirmAttempt===attempt&&client===attempt.client&&uiEpoch===attempt.epoch&&!pageAway&&document.visibilityState==='visible'&&!el.hidden)el.scrollIntoView({behavior:'auto',block:'center'});});
 }
}
function render(){
 if(!client||!view)return;
 const s=view,busy=uiBusy||!!s.active||!!bridgeAttempt||!!nativeAttempt||!!restoreAttempt,pending=!!s.pending,connected=!!s.account&&Number(s.chainId)===56;
 text('walletBridgeStatus',nativeAttempt?'正在等待錢包內18911連線，可隨時取消。':restoreAttempt?'正在恢復原頁已核准的連線，不會重新配對或送交易。':bridgeAttempt?'正在連接這個頁面；請在錢包批准後返回此頁完成連線，可隨時取消。':bridgePending||bridgeReadPending?'原連線請求尚未結束；遲到回覆不會自動接入。':restorePending?'原恢復查核尚未結束，同類請求不重複；仍可查詢狀態。':lastError||bridgeMessage||'從 BSC 錢包目錄配對後，請返回這裡核對帳戶。App 內開啟入口會另開頁面。');
 const deployments={...(s.chainActive?s.chainDeployments:{}),...s.deployments};
 const cfg=s.chainActive?s.chainConfig:s.config;
 const scheduled=s.chainActive&&s.chainConfig?.activationTime&&s.block?.timestamp&&BigInt(s.block.timestamp)<BigInt(s.chainConfig.activationTime);
 const owner=connected&&same(s.account,s.owner)&&same(s.owner,payload.expectedOwner);
 document.body.classList.toggle('loading',busy);
 text('appStatus',lastError||s.status||'先核對，再由本人錢包確認。');$('appStatus').dataset.state=lastError?'BLOCKED':s.phase||'IDLE';$('appStatus').classList.toggle('error',!!lastError||!!s.error);
  $('appStatus').dataset.errorCode=s.error?.code||'';
 text('walletAccount',s.account||'尚未連接');
 const thisPageMobile=connected&&provider===mobileProvider&&walletConnectSessionPermits(mobileRaw,mobileMetadata,mobileTopic,s.account);
 text('originalPageConnection',thisPageMobile?'此頁已透過 WalletConnect 連線；從錢包返回這裡可繼續查看本人帳戶。':connected&&provider!==publicProvider&&provider!==mobileProvider?'此頁已連接本人錢包（BSC 56）；帳戶及操作只屬於目前這個頁面。':bridgeAttempt?'正在等待本人錢包批准；請返回這個原頁查看連線結果。':'此頁尚未連接。按「連接本人錢包」後，在錢包批准並返回這裡；只另開錢包內頁不會連接此頁。');
 text('walletChain',s.chainId?Number(s.chainId)===56?'BNB Smart Chain · 56':'目前網路 '+s.chainId+'，需要 BSC 56':'需要 BNB Smart Chain · 56');
 text('ownerAddress',s.owner||'尚未查核');
 const wrongChain=s.chainId!=null&&Number(s.chainId)!==56;
 text('chainState',wrongChain?'目前網路無法查核；請先切換至 BSC 主網（56）。':s.chainActive?(scheduled?'新版路由已核實，等待 '+dateTW(s.chainConfig.activationTime)+' 啟用':'新版五合約與原 Registry 路由已核實／已啟用'):Object.keys(s.deployments||{}).length?'已有核實部署，啟用狀態待查核':'新版尚未核實啟用，保留玩家說明');
 $('switchWalletChain').hidden=!wrongChain||provider===publicProvider;
 $('switchWalletChain').disabled=busy||walletNetworkRequestPending(provider)||mobileNetworkPending()||!!bridgePending||!!bridgeReadPending;
 $('connectWallet').disabled=(busy&&provider!==publicProvider)||walletNetworkRequestPending(provider)||mobileNetworkPending()||!!bridgePending||!!bridgeReadPending||!!nativeAttempt||!!restoreAttempt;$('refreshStatus').disabled=busy;
 $('chooseWallet').disabled=busy||walletNetworkRequestPending(provider)||mobileNetworkPending()||!!bridgePending||!!bridgeReadPending;
 $('connectMobileWallet').disabled=busy||walletNetworkRequestPending(provider)||mobileNetworkPending()||!!bridgePending||!!bridgeReadPending||!!restorePending;
 renderInjectedWallets();
 $('prepareDeploy').disabled=busy||pending||!owner||s.chainActive||Object.keys(deployments||{}).length===5;
 $('prepareAlchemy').disabled=busy||pending||!connected;
 $('activationTime').disabled=busy||pending||!!deployments.KUFO?.address;
 $('activationNow').disabled=$('activationTime').disabled;
 if(cfg?.activationTime&&deployments.KUFO?.address)$('activationTime').value=localTW(cfg.activationTime);
 text('ownerReason',pending?'先查核原交易，不能重新部署或變更啟用時間。':owner?'請核對不可變啟用時間。每次只預覽及確認下一筆，沒有自動批次送單。':'此區由王母本人操作。連線帳戶須同時符合指定王母與目前 Registry Owner。');
 const allowanceWei=connected&&!s.error&&!lastError&&s.alchemy?.source==='VERIFIED_CHAIN_ROUTES'?s.alchemy.allowanceWei:null;
 let alchemyReason;
 if(pending)alchemyReason=s.pending.intentId===approvalFollowUp?.intentId?'正在查核授權回執，核實後會接續煉丹。':'原交易待確認，請先核回執；授權成功也不代表 KUFO 已產出。';
 else if(scheduled)alchemyReason='正式啟用時間尚未到，請於 '+dateTW(s.chainConfig.activationTime)+' 後重新核對。';
 else if(!s.chainActive)alchemyReason='請先查核新版五合約與原 Registry 啟用狀態；不會改用舊 49 Epoch 煉丹爐。';
 else if(!connected)alchemyReason='連接本人 BSC 錢包後，這裡會顯示可用的煉丹授權。';
 else if(allowanceWei==null)alchemyReason='目前的煉丹授權尚未核對。';
 else if(BigInt(allowanceWei)===0n)alchemyReason='輸入金額並按「煉丹」，依畫面確認授權及煉丹。';
 else alchemyReason='目前尚有 '+ether(allowanceWei).replace(/\.0$/,'')+' KAIOS 授權可用。完成煉丹須另由本人錢包確認。KUFO 產出以煉丹回執為準。';
 const alchemyNotice=$('alchemyReason');
 if(alchemyNotice.textContent!==alchemyReason)alchemyNotice.textContent=alchemyReason;
 text('playerBalance',connected&&s.alchemy?.kaiosBalanceWei!=null?ether(s.alchemy.kaiosBalanceWei)+' KAIOS':'連線並查詢後顯示');
 if(s.review?.amountWei){text('requiredKgen',ether(BigInt(s.review.amountWei)/1000n)+' KGEN（只查）');text('expectedKufo',ether(BigInt(s.review.amountWei)*1000n)+' KUFO');}
 else{text('requiredKgen','依預覽數量核對');text('expectedKufo','依原 1 : 1,000 比例');}
 renderSteps({...s,deployments},owner,busy||pending);
 renderReview(s.review);
 const cap=$('reviewCap').value.trim(),validCap=/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(cap)&&/[1-9]/.test(cap);
 $('confirmReview').disabled=busy||pending||!s.review||reviewDecodeFailed||!$('acceptReview').checked||!validCap||['REVIEW_EXPIRED','REVIEW_INVALID','FRESH_STATE_CHANGED','CONTEXT_CHANGED'].includes(s.error?.code);
 $('cancelReview').disabled=busy;
 $('pendingPanel').hidden=!pending;
 if(pending){
  text('pendingState',s.pending.phase==='AWAITING_WALLET'?'正在等待本人錢包；送出結果未取得前不能重送。':'保留原交易，只查核原回執，不會自動送下一筆。');
  text('pendingHash',s.pending.hash||'尚未取得交易 hash；請先查看本人錢包的原請求。');
 }
  const unknown=pending&&!s.pending.hash,identity=s.pending?.intentId||null;
  if(identity!==recoveryIntentId){recoveryIntentId=identity;$('receiptHash').value='';$('acceptRecoveryHash').checked=false;}
  $('hashRecovery').hidden=!unknown;
  $('receiptHash').disabled=busy||!unknown;
  $('acceptRecoveryHash').disabled=busy||!unknown;
  $('recoverPendingHash').disabled=busy||!unknown||!connected||!$('acceptRecoveryHash').checked||!/^0x[0-9a-fA-F]{64}$/.test($('receiptHash').value.trim());
  $('resumePending').disabled=busy||!s.pending?.hash;
 $('copyPending').disabled=!s.pending?.hash;
 renderConfirmFeedback(s);renderVerification();
}
function resetConsent(){confirmAttempt=null;lastError='';$('acceptReview').checked=false;$('reviewCap').value='';}
function alchemyRequest(){
 return {kind:'burn',amount:$('kaiosAmount').value.trim(),lifeId:$('lifeId').value.trim()||ZERO_ID};
}
async function continueAlchemy(current,isCurrent){
 const followUp=approvalFollowUp;
 const s=current.snapshot();
 if(!followUp||!isCurrent()||pageAway||document.visibilityState!=='visible'||s.pending||s.review)return;
 if(!same(s.account,followUp.account)||Number(s.chainId)!==56){approvalFollowUp=null;return;}
 const {journal}=current.exportEvidence();
 const record=journal.evidence.find(({intent})=>intent?.intentId===followUp.intentId&&same(intent.hash,followUp.hash));
 if(!record)return;
 approvalFollowUp=null;
 if(record.verification.status!=='CONFIRMED'||record.intent.kind!=='approve')return;
 const request=alchemyRequest();
 if(request.amount!==followUp.request.amount||request.lifeId!==followUp.request.lifeId)return;
 resetConsent();
 await current.prepare(request);
 if(!isCurrent())return;
 const review=current.snapshot().review;
 if(!review||!same(review.account,followUp.account)||review.amountWei!==record.intent.amountWei||
    !ORDER.every(name=>same(review.deploymentAddresses?.[name],record.intent.deploymentAddresses?.[name]))){
  current.invalidate('煉丹路由或帳戶已變更，請重新核對。');
  return;
 }
 continuedReviewId=review.reviewId;
 $('reviewPanel').scrollIntoView({behavior:'auto',block:'start'});
}
async function applyActivation(current,activationTime){
 if(current.snapshot().config.activationTime===activationTime)return;
 try{current.setConfig({activationTime});}
 catch(error){if(error?.code!=='CONFIG_LOCKED')throw error;await current.resetFailedDeploymentConfig({activationTime});}
}
async function connectOnBsc(current,isCurrent){
 const selected=provider,native=nativeAttempt,bridge=bridgeAttempt,mobileRoot=networkProviderRoots.get(selected);let interrupted=false;
 const stop=()=>{interrupted=true;};
 const valid=()=>isCurrent()&&provider===selected&&!pageAway&&document.visibilityState==='visible'&&!interrupted&&nativeAttempt===native&&bridgeAttempt===bridge;
 resetConsent();current.invalidate('正在核對錢包網路；需要時請在本人錢包確認切換至 BSC 56。');
 selected.on?.('accountsChanged',stop);selected.on?.('disconnect',stop);
 try{
  if(mobileRoot)mobileNetworkRaw=mobileRoot;
  await ensureWalletBsc(selected,{isCurrent:valid,onSettled:()=>{if(mobileNetworkRaw===mobileRoot&&!walletNetworkRequestPending(mobileRoot))mobileNetworkRaw=null;render();scheduleVerification();}});
  if(!valid())throw Object.assign(new Error('頁面或錢包已變更，請本人重新連接。'),{code:'CONTEXT_CHANGED'});
 }finally{selected.removeListener?.('accountsChanged',stop);selected.removeListener?.('disconnect',stop);}
 return current.connect();
}
async function run(operation){
 if(uiBusy)return;
 clearVerificationTimer();
 const epoch=uiEpoch,current=client,isCurrent=()=>epoch===uiEpoch&&current===client;
 uiBusy=true;lastError='';render();
 try{await operation(current,isCurrent);}catch(error){if(isCurrent()){lastError=message(error);if(['RPC_PERMISSION_DENIED','RPC_QUOTA_LIMIT','WALLET_NETWORK_TIMEOUT','WALLET_NETWORK_PENDING'].includes(error?.code))verifyStopped=lastError;}}
 finally{if(isCurrent()){uiBusy=false;view=current?.snapshot()||view;render();scheduleVerification(view?.pending?.hash?0:VERIFY_INTERVAL_MS);}}
}
async function confirmReviewed(){
 if(uiBusy||!client)return;
 const attempt={client,epoch:uiEpoch,finished:false,stage:null,code:null};confirmAttempt=attempt;
 await run(async(current,isCurrent)=>{
  try{
   const s=current.snapshot();if(!s.review)throw Object.assign(new Error('請重新預覽。'),{code:'REVIEW_INVALID'});
   const request=s.review.kind==='approve'?alchemyRequest():null;
   const result=await current.confirm(s.review.reviewId,{accepted:$('acceptReview').checked,maxCostBNB:$('reviewCap').value.trim()});
   if(request&&isCurrent()&&confirmAttempt===attempt&&result.pending?.kind==='approve'&&result.pending.hash&&
      same(result.account,s.review.account)&&Number(result.chainId)===56){
    const {intentId,hash,account}=result.pending;
    approvalFollowUp={intentId,hash,account,request};
   }
  }finally{if(isCurrent()&&confirmAttempt===attempt){attempt.finished=true;$('acceptReview').checked=false;}}
 });
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
 setupWalletUrls();
 if(!window.ethers||!window.KGEN_Wallet)await new Promise(resolve=>window.addEventListener('load',resolve,{once:true}));
 if(!window.ethers?.utils||!window.KGEN_Wallet?.getEthereum)throw new Error('既有錢包或 ABI 工具未載入。');
 window.addEventListener('eip6963:announceProvider',event=>{
  const {provider:candidate,info}=event.detail||{};
  if(typeof candidate?.request!=='function'||announcedWallets.has(candidate))return;
  const name=typeof info?.name==='string'?info.name.trim().slice(0,64):'';
  announcedWallets.set(candidate,candidate.isBinance===true?BINANCE_WALLET:name);
  renderInjectedWallets();
 });
 window.addEventListener('ethereum#initialized',renderInjectedWallets);
 requestInjectedWallets();
 payload=await verifyPayload();
 if(window.__K18911_MOCK__===true)$('mockNotice').hidden=false;
 const month=new Date(Date.now()+28800000).getUTCMonth(),tier=payload.presentation.tierNames[month],star=payload.presentation.constellationNames[payload.calendar.constellationByMonth[month]-1];
 text('monthBadge',(month+1)+' 月 · '+tier+' · '+star+'（整月）');
 const table=$('monthTable');
 for(let i=0;i<12;i++){const row=document.createElement('tr');for(const value of [(i+1)+'月',payload.presentation.tierNames[i],payload.presentation.constellationNames[payload.calendar.constellationByMonth[i]-1]]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}table.append(row);}
 text('sourceEvidence','原五合約 '+payload.programCommit.slice(0,8)+' · 來源 main '+payload.sourceMain.slice(0,8)+' · 合約資料 SHA256 '+PAYLOAD_SHA256);
 const incoming=new URL(window.location.href);nativeIntent=incoming.searchParams.get('walletBridge')==='1';
 publicProvider=makeReadonlyProvider();
 initializeClient(chooseProvider()||publicProvider);
 $('connectWallet').addEventListener('click',()=>{
  if(walletConnectionBusy())return;
  requestInjectedWallets();
  const wallets=injectedWallets();
  if(wallets.length>1){showWalletBridge();return;}
  const selected=chooseProvider(wallets);
  if(selected){connectSelectedProvider(selected);return;}
  resetVerification();
  if(uiBusy&&provider===publicProvider)initializeClient(publicProvider);
  nextNativeWallet='';
  void connectMobileWallet();
 });
 $('switchWalletChain').addEventListener('click',()=>connectSelectedProvider(provider));
 $('chooseWallet').addEventListener('click',()=>{if(!uiBusy&&!walletNetworkRequestPending(provider)&&!mobileNetworkPending()&&!bridgeAttempt&&!nativeAttempt&&!restoreAttempt){nextNativeWallet='';showWalletBridge();}});
 $('connectMobileWallet').addEventListener('click',()=>{void connectMobileWallet({chooseAgain:true});});
 $('cancelWalletBridge').addEventListener('click',cancelWalletBridge);
 $('refreshStatus').addEventListener('click',()=>{if(uiBusy)return;resetVerification();run(async(current,isCurrent)=>{resetConsent();current.invalidate('正在重新查核鏈上狀態。');await current.verify();if(isCurrent()){lastVerifiedAt=Date.now();await continueAlchemy(current,isCurrent);}});});
  $('activationNow').addEventListener('click',()=>run(async current=>{resetConsent();$('activationTime').value=localTW(Math.floor(Date.now()/1000));await applyActivation(current,readActivation());}));
  $('activationTime').addEventListener('change',()=>run(async current=>{resetConsent();await applyActivation(current,readActivation());}));
 for(const id of ['kaiosAmount','lifeId'])$(id).addEventListener('input',()=>invalidate('煉丹內容已變更，請重新預覽。'));
  $('prepareDeploy').addEventListener('click',()=>run(async(current,isCurrent)=>{resetConsent();await applyActivation(current,readActivation());await current.prepare({kind:'deploy'});if(isCurrent())$('reviewPanel').scrollIntoView({behavior:'auto',block:'start'});}));
 $('prepareAlchemy').addEventListener('click',()=>run(async(current,isCurrent)=>{approvalFollowUp=null;resetConsent();const request=alchemyRequest();try{await current.prepare(request);}catch(error){if(!isCurrent())return;if(!['ALLOWANCE_REQUIRED','APPROVAL_REQUIRED'].includes(error.code))throw error;await current.prepare({...request,kind:'approve'});}if(isCurrent())$('reviewPanel').scrollIntoView({behavior:'auto',block:'start'});}));
 $('cancelReview').addEventListener('click',()=>{resetConsent();invalidate('預覽已取消；沒有送交錢包。');});
 for(const id of ['acceptReview','reviewCap'])$(id).addEventListener('input',render);
 $('confirmReview').addEventListener('click',confirmReviewed);
 $('resumePending').addEventListener('click',()=>run(async(current,isCurrent)=>{await current.resume();await continueAlchemy(current,isCurrent);}));
  $('receiptHash').addEventListener('input',()=>{$('acceptRecoveryHash').checked=false;render();});
  $('acceptRecoveryHash').addEventListener('change',render);
  $('recoverPendingHash').addEventListener('click',()=>run(async(current,isCurrent)=>{resetConsent();await current.recoverPendingHash({hash:$('receiptHash').value.trim(),accepted:$('acceptRecoveryHash').checked});if(isCurrent()){$('acceptRecoveryHash').checked=false;if(verifyStopped===UNKNOWN_HASH_STOP)verifyStopped='';}}));
 $('copyPending').addEventListener('click',()=>run(async(current,isCurrent)=>{const hash=current.snapshot().pending?.hash;if(hash){await navigator.clipboard.writeText(hash);if(isCurrent())lastError='交易 hash 已複製，請保留原紀錄。';}}));
  $('exportEvidence').addEventListener('click',()=>{try{const data=JSON.stringify({sourceMain:payload.sourceMain,exportedUTC:new Date().toISOString(),...client.exportEvidence(),realWalletConfirmation:'Only the holder wallet can confirm transactions'},null,2);const blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='KUFO-18911-public-progress.json';link.click();URL.revokeObjectURL(url);}catch(error){lastError=message(error);render();}});
 document.addEventListener('visibilitychange',()=>{clearVerificationTimer();if(document.visibilityState==='hidden'){if(nativeAttempt&&!nativeAttempt.client)nativeAttempt.controller.abort();renderVerification();return;}if(nativeIntent){void connectNativeLanding();return;}scheduleVerification(0);});
 window.addEventListener('pagehide',()=>{pageAway=true;if(nativeAttempt){const attempt=nativeAttempt;nativeAttempt=null;if(attempt.client){nativeIntent=false;verifyStopped='原連線請求尚待核對；請本人重新連接或唯讀查詢，不自動重送。';}attempt.cancel();rollbackBridgeClient(attempt);}if(restoreAttempt){const attempt=restoreAttempt;restoreAttempt=null;attempt.cancel();rollbackBridgeClient(attempt);}clearVerificationTimer();uiEpoch++;uiBusy=false;unsubscribe?.();client?.dispose();renderVerification();});
 window.addEventListener('pageshow',event=>{pageAway=false;if(!event.persisted)return;try{resetConsent();initializeClient(chooseProvider()||publicProvider);if(nativeIntent)void connectNativeLanding();else if(!chooseInjectedProvider()&&sessionHint())void restoreMobileSession();}catch(error){lastError=message(error);render();}});
 if(nativeIntent)void connectNativeLanding();else if(!chooseInjectedProvider()&&sessionHint())void restoreMobileSession();
}
if(typeof window!=='undefined'&&typeof document!=='undefined')boot().catch(error=>{text('appStatus',message(error));$('appStatus').dataset.state='BLOCKED';$('appStatus').classList.add('error');for(const id of ['connectWallet','refreshStatus','prepareDeploy','prepareAlchemy','activationNow','confirmReview','resumePending','recoverPendingHash','exportEvidence'])$(id).disabled=true;});
