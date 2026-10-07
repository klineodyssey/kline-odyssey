/* KGEN_META
STATUS: ACTIVE
FORMAL_ORGAN_NAME: K11520 Product Progress Board
VERSION: 1.0.0
PURPOSE: Read one controlled product-status source and present it through the existing utility rail and shared sheet. No product, wallet, settlement, cargo, Player Life, Physics or deployment authority.
*/
const SOURCE_URL='./K11520_PRODUCT_PROGRESS_CURRENT.json';
export const ALLOWED_PROGRESS_STATUSES=Object.freeze(['AVAILABLE','IN_PROGRESS','TESTING','BLOCKED','NOT_READY','STALE','UNKNOWN']);
const ALLOWED=new Set(ALLOWED_PROGRESS_STATUSES);
const CORE_KEYS=Object.freeze(['WORLD_MOVEMENT','COMBAT','INVENTORY','PLAYER_LIFE','BTC','ETH','BNB','LONG_SHORT','C','LOTS','ORDER','TRIGGER','FILL','POSITION','PNL','LIQUIDATION','CLOSE','RECEIPTS','WALLET','BSC56','CARGO','COURIER','ATM','UNIVERSE_DELIVERY','PUBLIC_RUNTIME']);
const PROTECTED_FINANCIAL_KEYS=Object.freeze(['REAL_WALLET','REAL_ORDER','REAL_SETTLEMENT']);
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

export function validateProgressSource(data,{now=Date.now()}={}){
  const errors=[];
  if(!data||typeof data!=='object')errors.push('SOURCE_OBJECT_REQUIRED');
  if(data?.schemaVersion!=='K11520_PRODUCT_PROGRESS_V1')errors.push('SCHEMA_VERSION_INVALID');
  if(data?.sourceOfTruth!==true)errors.push('SOURCE_OF_TRUTH_REQUIRED');
  for(const key of CORE_KEYS){const item=data?.features?.[key];if(!item)errors.push(`FEATURE_MISSING:${key}`);else if(!ALLOWED.has(item.status))errors.push(`STATUS_INVALID:${key}`)}
  for(const [key,item] of Object.entries(data?.engineering||{}))if(!ALLOWED.has(item?.status))errors.push(`ENGINEERING_STATUS_INVALID:${key}`);
  const evidence=data?.evidence&&typeof data.evidence==='object'?data.evidence:{};
  const blockedFeatures=Array.isArray(evidence.blockedFeatures)?evidence.blockedFeatures:[];
  const failedFeatures=Array.isArray(evidence.failedFeatures)?evidence.failedFeatures:[];
  if(!Array.isArray(evidence.blockedFeatures))errors.push('BLOCKED_FEATURES_REQUIRED');
  if(!Array.isArray(evidence.failedFeatures))errors.push('FAILED_FEATURES_REQUIRED');
  for(const key of [...blockedFeatures,...failedFeatures])if(!CORE_KEYS.includes(key))errors.push(`EVIDENCE_FEATURE_INVALID:${key}`);
  if(evidence.latestMain!==data?.engineering?.LATEST_MAIN?.value)errors.push('LATEST_MAIN_EVIDENCE_MISMATCH');
  if(evidence.publicPagesState!=='success'&&['AVAILABLE','TESTING'].includes(data?.features?.PUBLIC_RUNTIME?.status))errors.push('PUBLIC_RUNTIME_EVIDENCE_MISMATCH');
  if(evidence.publicPagesState!=='success'&&data?.engineering?.PAGES_STATUS?.status==='AVAILABLE')errors.push('PAGES_STATUS_EVIDENCE_MISMATCH');
  for(const key of PROTECTED_FINANCIAL_KEYS){const item=data?.engineering?.[key];if(item?.status==='AVAILABLE'&&(item?.evidence?.status!=='VERIFIED'||item?.evidence?.head!==evidence.latestMain))errors.push(`FINANCIAL_EVIDENCE_REQUIRED:${key}`)}
  const updated=Date.parse(data?.lastUpdatedAt||''),hours=Number(data?.staleAfterHours);
  const sourceFuture=Number.isFinite(updated)&&updated>now;
  if(sourceFuture)errors.push('SOURCE_TIMESTAMP_FUTURE');
  const expiresAt=Number.isFinite(updated)&&Number.isFinite(hours)&&hours>0?updated+hours*3600000:null;
  const sourceStale=expiresAt===null||sourceFuture||now>=expiresAt;
  return {ok:errors.length===0,errors,sourceStale,sourceFuture,updatedAt:Number.isFinite(updated)?updated:null,expiresAt,blockedFeatures:[...new Set(blockedFeatures)],failedFeatures:[...new Set(failedFeatures)]};
}

function effectiveStatus(status,validation,key){if(validation?.sourceStale)return 'STALE';if(validation?.failedFeatures?.includes(key))return 'UNKNOWN';if(validation?.blockedFeatures?.includes(key))return 'BLOCKED';return ALLOWED.has(status)?status:'UNKNOWN'}
export function classifyPlayerSections(data,validation={sourceStale:false}){
  const sections={available:[],building:[],blocked:[]};
  for(const key of CORE_KEYS){const source=data.features[key],status=effectiveStatus(source.status,validation,key),item={key,...source,status,summary:validation.sourceStale?'受控進度來源已過期；本項狀態不可驗證。':validation.failedFeatures?.includes(key)?'顯式失敗證據優先；本項狀態降級為 UNKNOWN。':validation.blockedFeatures?.includes(key)?'顯式 blocker 證據優先；本項不可宣稱可用。':source.summary};if(status==='AVAILABLE')sections.available.push(item);else if(status==='IN_PROGRESS'||status==='TESTING')sections.building.push(item);else sections.blocked.push(item)}
  return sections;
}

function statusLabel(status){return {AVAILABLE:'可玩',IN_PROGRESS:'施工中',TESTING:'測試中',BLOCKED:'受阻',NOT_READY:'未就緒',STALE:'過期',UNKNOWN:'未知'}[status]||'未知'}
function itemHtml(item){return `<li data-progress-key="${escapeHtml(item.key)}" data-progress-status="${item.status}"><span>${escapeHtml(item.label)}</span><b>${statusLabel(item.status)}</b><small>${escapeHtml(item.summary)}</small></li>`}
export function renderPlayerProgress(data,validation){const s=classifyPlayerSections(data,validation),warning=validation.sourceStale?'<div class="progressWarning">進度資料已過期；所有舊狀態降級為 STALE，請等待受控來源更新。</div>':'';const next=validation.sourceStale?'受控進度來源過期；下一步不可驗證。':data.nextMilestone;return `${warning}<section><h3>目前可玩</h3><ul>${s.available.map(itemHtml).join('')||'<li>尚無可驗證項目</li>'}</ul></section><section><h3>施工中</h3><ul>${s.building.map(itemHtml).join('')||'<li>目前沒有已驗證的施工項目</li>'}</ul></section><section><h3>未開放 / 卡住</h3><ul>${s.blocked.map(itemHtml).join('')||'<li>目前沒有已驗證的 blocker</li>'}</ul></section><section class="progressNext"><h3>下一步</h3><p>${escapeHtml(next)}</p></section>`}
function engineeringValue(value){return Array.isArray(value)?`<ul>${value.map(v=>`<li>${escapeHtml(v)}</li>`).join('')}</ul>`:`<code>${escapeHtml(value)}</code>`}
export function renderEngineeringProgress(data,validation){const warning=validation.sourceStale?'<div class="progressWarning">SOURCE_STATUS = STALE; CLAIM_VALUES_WITHHELD</div>':'';return `${warning}<dl>${Object.entries(data.engineering).map(([key,item])=>{const status=effectiveStatus(item.status,validation,key),value=validation.sourceStale?'STALE_SOURCE_VALUE_WITHHELD':item.value;return `<div><dt>${escapeHtml(key)} <b data-progress-status="${status}">${status}</b></dt><dd>${engineeringValue(value)}</dd></div>`}).join('')}<div><dt>LAST_UPDATED_AT</dt><dd><code>${escapeHtml(data.lastUpdatedAt)}</code></dd></div><div><dt>SOURCE_FRESHNESS</dt><dd><code>${validation.sourceStale?'STALE':'AVAILABLE'}</code></dd></div></dl>`}
export function renderProgressError(reason){return `<div class="progressWarning" role="alert">進度資料無法驗證。<br><code>${escapeHtml(reason||'UNKNOWN')}</code><br>所有狀態以 UNKNOWN 處理，不會被冒充為已完成。</div>`}
export function renderProgressMode(data,validation,mode='player'){if(!validation?.ok)return renderProgressError(validation?.errors?.join(',')||'SOURCE_INVALID');return mode==='engineering'?renderEngineeringProgress(data,validation):renderPlayerProgress(data,validation)}

function installStyle(){if(document.getElementById('k11520ProgressBoardStyle'))return;const style=document.createElement('style');style.id='k11520ProgressBoardStyle';style.textContent=`
#sheet:has(#k11520ProgressBoard){display:flex;flex-direction:column;overflow:hidden;background:#07121cf8!important}
html[data-k11520-progress-board-open="true"] #toast{visibility:hidden!important}
#sheet:has(#k11520ProgressBoard) .sheetHead{flex:0 0 auto;position:sticky;top:0;z-index:4;background:#101923}
#sheet:has(#k11520ProgressBoard) #sheetBody{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain}
#sheet:has(#k11520ProgressBoard) #sheetClose{min-width:44px;min-height:44px}
#k11520ProgressBoard{max-width:760px;margin:0 auto;padding-bottom:18px;overflow-wrap:anywhere}
.progressTabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;position:sticky;top:0;z-index:3;padding:4px 0 8px;background:#07121cf8}
.progressTabs button{min-height:44px;border:1px solid #68e4ff55;border-radius:10px;background:#102332;color:#dffaff;font-weight:800}
.progressTabs button[aria-selected="true"]{border-color:#f1ca73;background:#243023;color:#fff3b5}
#k11520ProgressContent section{margin:10px 0;padding:10px;border:1px solid #a77b3544;border-radius:12px;background:#ffffff04}
#k11520ProgressContent h3{margin:0 0 8px;color:#f3d794;font-size:14px}
#k11520ProgressContent ul{list-style:none;margin:0;padding:0;display:grid;gap:7px}
#k11520ProgressContent li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 8px;padding:8px;border:1px solid #ffffff12;border-radius:9px;background:#071018}
#k11520ProgressContent li small{grid-column:1/-1;color:#aebbc5;line-height:1.4}
#k11520ProgressContent [data-progress-status="AVAILABLE"]{color:#65e798}
#k11520ProgressContent [data-progress-status="IN_PROGRESS"],#k11520ProgressContent [data-progress-status="TESTING"]{color:#68e4ff}
#k11520ProgressContent [data-progress-status="BLOCKED"],#k11520ProgressContent [data-progress-status="NOT_READY"]{color:#ffbd73}
#k11520ProgressContent [data-progress-status="STALE"],#k11520ProgressContent [data-progress-status="UNKNOWN"]{color:#ff737a}
.progressWarning{padding:10px;border:1px solid #ff737a88;border-radius:10px;background:#32141acc;color:#ffd5d8;line-height:1.45}
#k11520ProgressContent dl{display:grid;gap:8px;margin:10px 0}#k11520ProgressContent dl>div{padding:9px;border:1px solid #ffffff12;border-radius:9px;background:#071018}
#k11520ProgressContent dt{font-weight:900;color:#f3d794}#k11520ProgressContent dd{margin:5px 0 0;color:#dffaff}#k11520ProgressContent code{white-space:normal;word-break:break-word;color:#9eeeff}
@media(max-width:420px){#k11520ProgressBoard{font-size:12px}.progressTabs{top:0}}
`;document.head.appendChild(style)}

let cached=null,currentError=null,currentMode='player',boardOpen=false,lastTrigger=null,previousDialogAttributes=null,loadGeneration=0,activeController=null,staleTimer=null;
function clearStaleTimer(){if(staleTimer!==null){clearTimeout(staleTimer);staleTimer=null}}
function scheduleStalePaint(validation){clearStaleTimer();if(!boardOpen||validation?.sourceStale||!Number.isFinite(validation?.expiresAt))return;const delay=Math.max(0,Math.min(2_147_000_000,validation.expiresAt-Date.now()));staleTimer=setTimeout(()=>{staleTimer=null;if(boardOpen)paint()},delay)}
async function loadSource({generation,signal}){const response=await fetch(SOURCE_URL,{cache:'no-store',signal});if(!response.ok)throw new Error(`HTTP_${response.status}`);const data=await response.json(),validation=validateProgressSource(data);if(!validation.ok)throw new Error(validation.errors.join(','));if(generation!==loadGeneration||signal.aborted)return null;cached={data,validation};currentError=null;return cached}
function paint(){const content=document.getElementById('k11520ProgressContent');if(!content)return;clearStaleTimer();if(currentError){content.innerHTML=renderProgressError(currentError);return}if(!cached){content.innerHTML=renderProgressError('SOURCE_NOT_LOADED');return}const validation=validateProgressSource(cached.data);cached={data:cached.data,validation};content.innerHTML=renderProgressMode(cached.data,validation,currentMode);scheduleStalePaint(validation);for(const button of document.querySelectorAll('#k11520ProgressBoard [data-progress-mode]')){const selected=button.dataset.progressMode===currentMode;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1}content.setAttribute('aria-labelledby',`k11520ProgressTab-${currentMode}`)}
function restoreDialogState(sheet){if(previousDialogAttributes){for(const [name,value]of Object.entries(previousDialogAttributes)){if(value===null)sheet.removeAttribute(name);else sheet.setAttribute(name,value)}}previousDialogAttributes=null}
function finishClose(){if(!boardOpen)return;boardOpen=false;loadGeneration+=1;activeController?.abort();activeController=null;clearStaleTimer();delete document.documentElement.dataset.k11520ProgressBoardOpen;const sheet=document.getElementById('sheet');if(sheet)restoreDialogState(sheet);document.removeEventListener('keydown',onKeydown);document.removeEventListener('visibilitychange',onVisibilityChange);document.dispatchEvent(new CustomEvent('k11520:progress-board-closed',{detail:{trigger:lastTrigger}}));lastTrigger=null}
function selectMode(mode,{focus=false}={}){if(!['player','engineering'].includes(mode))return;currentMode=mode;paint();document.getElementById('sheetBody')?.scrollTo?.({top:0});if(focus)document.querySelector(`#k11520ProgressBoard [data-progress-mode="${mode}"]`)?.focus()}
function onKeydown(event){if(!boardOpen)return;const tab=event.target?.closest?.('[data-progress-mode]');if(tab&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const mode=event.key==='Home'?'player':event.key==='End'?'engineering':tab.dataset.progressMode==='player'?'engineering':'player';selectMode(mode,{focus:true});return}if(event.key!=='Escape')return;event.preventDefault();document.getElementById('sheet')?.classList.remove('open');finishClose()}
function onVisibilityChange(){if(boardOpen&&document.visibilityState==='visible')paint()}
async function openBoard(event){const sheet=document.getElementById('sheet'),body=document.getElementById('sheetBody'),title=document.getElementById('sheetTitle');if(!sheet||!body||!title)return;const generation=++loadGeneration;activeController?.abort();activeController=new AbortController();cached=null;currentError=null;clearStaleTimer();lastTrigger=event?.detail?.trigger||document.getElementById('k11520ProgressButton');previousDialogAttributes={role:sheet.getAttribute('role'),'aria-modal':sheet.getAttribute('aria-modal'),'aria-labelledby':sheet.getAttribute('aria-labelledby')};sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-labelledby','sheetTitle');title.textContent='K11520 遊戲進度';body.dataset.simOrgan='';body.innerHTML='<div id="k11520ProgressBoard" aria-label="K11520 遊戲進度看板"><div class="progressTabs" role="tablist" aria-label="進度檢視模式"><button id="k11520ProgressTab-player" type="button" data-progress-mode="player" role="tab" aria-controls="k11520ProgressContent" aria-selected="true">PLAYER</button><button id="k11520ProgressTab-engineering" type="button" data-progress-mode="engineering" role="tab" aria-controls="k11520ProgressContent" aria-selected="false">ENGINEERING</button></div><div id="k11520ProgressContent" role="tabpanel" aria-labelledby="k11520ProgressTab-player" aria-live="polite">載入受控進度資料…</div></div>';document.documentElement.dataset.k11520ProgressBoardOpen='true';sheet.classList.add('open');boardOpen=true;body.scrollTop=0;for(const button of body.querySelectorAll('[data-progress-mode]'))button.onclick=()=>selectMode(button.dataset.progressMode);const close=document.getElementById('sheetClose');close?.addEventListener('click',()=>queueMicrotask(finishClose),{once:true});document.removeEventListener('keydown',onKeydown);document.addEventListener('keydown',onKeydown);document.removeEventListener('visibilitychange',onVisibilityChange);document.addEventListener('visibilitychange',onVisibilityChange);try{const loaded=await loadSource({generation,signal:activeController.signal});if(loaded&&generation===loadGeneration&&boardOpen)paint()}catch(error){if(generation!==loadGeneration||error?.name==='AbortError')return;cached=null;currentError=String(error?.message||error);paint();globalThis.__K11520_PROGRESS_BOARD__={status:'UNKNOWN',error:currentError,source:SOURCE_URL,open:openBoard}}finally{if(generation===loadGeneration&&boardOpen)close?.focus({preventScroll:true})}}

export function install11520ProductProgressBoard(){if(typeof document==='undefined')return {ok:true,browserOnly:true};installStyle();if(!document.getElementById('rail'))return {ok:false,reason:'EXISTING_UTILITY_RAIL_REQUIRED'};document.addEventListener('k11520:open-progress-board',openBoard);globalThis.__K11520_PROGRESS_BOARD__={status:'AVAILABLE',source:SOURCE_URL,open:openBoard,validate:validateProgressSource};return {ok:true,source:SOURCE_URL,owner:'MARKET_ORIGIN_WALLET_LAYOUT_RUNTIME'} }
