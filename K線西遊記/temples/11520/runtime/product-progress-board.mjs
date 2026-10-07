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
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

export function validateProgressSource(data,{now=Date.now()}={}){
  const errors=[];
  if(!data||typeof data!=='object')errors.push('SOURCE_OBJECT_REQUIRED');
  if(data?.schemaVersion!=='K11520_PRODUCT_PROGRESS_V1')errors.push('SCHEMA_VERSION_INVALID');
  if(data?.sourceOfTruth!==true)errors.push('SOURCE_OF_TRUTH_REQUIRED');
  for(const key of CORE_KEYS){const item=data?.features?.[key];if(!item)errors.push(`FEATURE_MISSING:${key}`);else if(!ALLOWED.has(item.status))errors.push(`STATUS_INVALID:${key}`)}
  for(const [key,item] of Object.entries(data?.engineering||{}))if(!ALLOWED.has(item?.status))errors.push(`ENGINEERING_STATUS_INVALID:${key}`);
  const updated=Date.parse(data?.lastUpdatedAt||''),hours=Number(data?.staleAfterHours);
  const sourceStale=!Number.isFinite(updated)||!Number.isFinite(hours)||hours<=0||now-updated>hours*3600000;
  return {ok:errors.length===0,errors,sourceStale,updatedAt:Number.isFinite(updated)?updated:null};
}

export function classifyPlayerSections(data){
  const sections={available:[],building:[],blocked:[]};
  for(const key of CORE_KEYS){const item={key,...data.features[key]};if(item.status==='AVAILABLE')sections.available.push(item);else if(item.status==='IN_PROGRESS'||item.status==='TESTING')sections.building.push(item);else sections.blocked.push(item)}
  return sections;
}

function statusLabel(status){return {AVAILABLE:'可玩',IN_PROGRESS:'施工中',TESTING:'測試中',BLOCKED:'受阻',NOT_READY:'未就緒',STALE:'過期',UNKNOWN:'未知'}[status]||'未知'}
function itemHtml(item){return `<li data-progress-key="${escapeHtml(item.key)}" data-progress-status="${item.status}"><span>${escapeHtml(item.label)}</span><b>${statusLabel(item.status)}</b><small>${escapeHtml(item.summary)}</small></li>`}
function playerHtml(data,validation){const s=classifyPlayerSections(data),warning=validation.sourceStale?'<div class="progressWarning">進度資料已過期；以 STALE 顯示，請等待受控來源更新。</div>':'';return `${warning}<section><h3>目前可玩</h3><ul>${s.available.map(itemHtml).join('')||'<li>尚無可驗證項目</li>'}</ul></section><section><h3>施工中</h3><ul>${s.building.map(itemHtml).join('')||'<li>目前沒有已驗證的施工項目</li>'}</ul></section><section><h3>未開放 / 卡住</h3><ul>${s.blocked.map(itemHtml).join('')||'<li>目前沒有已驗證的 blocker</li>'}</ul></section><section class="progressNext"><h3>下一步</h3><p>${escapeHtml(data.nextMilestone)}</p></section>`}
function engineeringValue(value){return Array.isArray(value)?`<ul>${value.map(v=>`<li>${escapeHtml(v)}</li>`).join('')}</ul>`:`<code>${escapeHtml(value)}</code>`}
function engineeringHtml(data,validation){const warning=validation.sourceStale?'<div class="progressWarning">SOURCE_STATUS = STALE</div>':'';return `${warning}<dl>${Object.entries(data.engineering).map(([key,item])=>`<div><dt>${escapeHtml(key)} <b data-progress-status="${item.status}">${item.status}</b></dt><dd>${engineeringValue(item.value)}</dd></div>`).join('')}<div><dt>LAST_UPDATED_AT</dt><dd><code>${escapeHtml(data.lastUpdatedAt)}</code></dd></div><div><dt>SOURCE_FRESHNESS</dt><dd><code>${validation.sourceStale?'STALE':'AVAILABLE'}</code></dd></div></dl>`}
function errorHtml(reason){return `<div class="progressWarning" role="alert">進度資料無法驗證。<br><code>${escapeHtml(reason||'UNKNOWN')}</code><br>未知狀態不會被冒充為已完成。</div>`}

function installStyle(){if(document.getElementById('k11520ProgressBoardStyle'))return;const style=document.createElement('style');style.id='k11520ProgressBoardStyle';style.textContent=`
#sheet:has(#k11520ProgressBoard){display:flex;flex-direction:column;overflow:hidden;background:#07121cf8!important}
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

let cached=null,currentMode='player',boardOpen=false,lastTrigger=null,previousDialogAttributes=null;
async function loadSource(){const response=await fetch(SOURCE_URL,{cache:'no-store'});if(!response.ok)throw new Error(`HTTP_${response.status}`);const data=await response.json(),validation=validateProgressSource(data);if(!validation.ok)throw new Error(validation.errors.join(','));cached={data,validation};return cached}
function paint(){const content=document.getElementById('k11520ProgressContent');if(!content)return;if(!cached){content.innerHTML=errorHtml('SOURCE_NOT_LOADED');return}content.innerHTML=currentMode==='engineering'?engineeringHtml(cached.data,cached.validation):playerHtml(cached.data,cached.validation);for(const button of document.querySelectorAll('#k11520ProgressBoard [data-progress-mode]')){const selected=button.dataset.progressMode===currentMode;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1}content.setAttribute('aria-labelledby',`k11520ProgressTab-${currentMode}`)}
function restoreDialogState(sheet){if(previousDialogAttributes){for(const [name,value]of Object.entries(previousDialogAttributes)){if(value===null)sheet.removeAttribute(name);else sheet.setAttribute(name,value)}}previousDialogAttributes=null}
function finishClose(){if(!boardOpen)return;boardOpen=false;const sheet=document.getElementById('sheet');if(sheet)restoreDialogState(sheet);document.removeEventListener('keydown',onKeydown);document.dispatchEvent(new CustomEvent('k11520:progress-board-closed',{detail:{trigger:lastTrigger}}));lastTrigger=null}
function onKeydown(event){if(event.key!=='Escape'||!boardOpen)return;event.preventDefault();document.getElementById('sheet')?.classList.remove('open');finishClose()}
async function openBoard(event){const sheet=document.getElementById('sheet'),body=document.getElementById('sheetBody'),title=document.getElementById('sheetTitle');if(!sheet||!body||!title)return;lastTrigger=event?.detail?.trigger||document.getElementById('k11520ProgressButton');previousDialogAttributes={role:sheet.getAttribute('role'),'aria-modal':sheet.getAttribute('aria-modal'),'aria-labelledby':sheet.getAttribute('aria-labelledby')};sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-labelledby','sheetTitle');title.textContent='K11520 遊戲進度';body.dataset.simOrgan='';body.innerHTML='<div id="k11520ProgressBoard" aria-label="K11520 遊戲進度看板"><div class="progressTabs" role="tablist" aria-label="進度檢視模式"><button id="k11520ProgressTab-player" type="button" data-progress-mode="player" role="tab" aria-controls="k11520ProgressContent" aria-selected="true">PLAYER</button><button id="k11520ProgressTab-engineering" type="button" data-progress-mode="engineering" role="tab" aria-controls="k11520ProgressContent" aria-selected="false">ENGINEERING</button></div><div id="k11520ProgressContent" role="tabpanel" aria-labelledby="k11520ProgressTab-player" aria-live="polite">載入受控進度資料…</div></div>';sheet.classList.add('open');boardOpen=true;body.scrollTop=0;for(const button of body.querySelectorAll('[data-progress-mode]'))button.onclick=()=>{currentMode=button.dataset.progressMode;paint();body.scrollTop=0};const close=document.getElementById('sheetClose');close?.addEventListener('click',()=>queueMicrotask(finishClose),{once:true});document.addEventListener('keydown',onKeydown);try{await loadSource();paint()}catch(error){const content=document.getElementById('k11520ProgressContent');if(content)content.innerHTML=errorHtml(error?.message);globalThis.__K11520_PROGRESS_BOARD__={status:'UNKNOWN',error:String(error?.message||error),source:SOURCE_URL,open:openBoard}}finally{if(boardOpen)close?.focus({preventScroll:true})}}

export function install11520ProductProgressBoard(){if(typeof document==='undefined')return {ok:true,browserOnly:true};installStyle();if(!document.getElementById('rail'))return {ok:false,reason:'EXISTING_UTILITY_RAIL_REQUIRED'};document.addEventListener('k11520:open-progress-board',openBoard);globalThis.__K11520_PROGRESS_BOARD__={status:'AVAILABLE',source:SOURCE_URL,open:openBoard,validate:validateProgressSource};return {ok:true,source:SOURCE_URL,owner:'MARKET_ORIGIN_WALLET_LAYOUT_RUNTIME'} }
