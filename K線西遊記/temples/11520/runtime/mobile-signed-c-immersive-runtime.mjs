/* KGEN_META
VERSION: 1.1.0
STATUS: ACTIVE / UI-ONLY
FORMAL_ORGAN_NAME: 11520 Signed C + Immersive Mobile Runtime
PURPOSE: Make C a signed velocity control centered at 0, map +C to 多 and -C to 空 through the existing canonical trade-side control, preserve positive lot mass, center the normal-axis energy rail in the mobile viewport, provide configurable professional long/short color semantics, and request standards-based immersive fullscreen without claiming control over unsupported host/browser chrome. Direction selection never executes an order.
*/

const $=s=>document.querySelector(s);
const ROOT=document.documentElement;
const MOBILE_MAX=600;
const ABS_LEVELS=Object.freeze([0,0.000001,0.00001,0.0001,0.001,0.01,0.1,1,10,100,1000]);
const signedByAxis={KX:0.001,KY:0.001,KZ:0.001};
const sideSyncedByAxis={KX:'LONG',KY:'LONG',KZ:'LONG'};
const COLOR_STORE='k11520.trade.colorScheme';
const COLOR_SCHEMES=Object.freeze({
  TW_RED_LONG:Object.freeze({id:'TW_RED_LONG',label:'台股｜多紅 空綠',long:'#ff4f5e',short:'#35d07f',neutral:'#d8e4eb'}),
  GLOBAL_GREEN_LONG:Object.freeze({id:'GLOBAL_GREEN_LONG',label:'國際｜多綠 空紅',long:'#35d07f',short:'#ff4f5e',neutral:'#d8e4eb'})
});
let colorSchemeId='TW_RED_LONG';
let fallbackImmersive=false,lastError=null,cPointer=null,internalNative=false,busySide=false,observer=null,timer=null;

const activeCard=()=>$('#axes [data-axis].active')||$('#axes [data-axis="KX"]');
const activeAxis=()=>activeCard()?.dataset.axis||'KX';
const fullEl=()=>document.fullscreenElement||document.webkitFullscreenElement||null;
const viewportHeight=()=>Math.max(1,Math.round(globalThis.visualViewport?.height||innerHeight||document.documentElement.clientHeight||1));
const parseSide=text=>/空|SHORT|SELL/i.test(String(text||''))?'SHORT':'LONG';
const signSide=v=>v<0?'SHORT':v>0?'LONG':'NEUTRAL';
const formatC=v=>v===0?'0C':`${v>0?'+':''}${Number(v).toLocaleString(undefined,{maximumFractionDigits:6,useGrouping:false})}C`;

function loadColorScheme(){try{const saved=localStorage.getItem(COLOR_STORE);if(saved&&COLOR_SCHEMES[saved])colorSchemeId=saved}catch{}return colorSchemeId}
function setColorScheme(id,{persist=true}={}){const next=COLOR_SCHEMES[id]?id:'TW_RED_LONG';colorSchemeId=next;const scheme=COLOR_SCHEMES[next];ROOT.style.setProperty('--k11520-long-color',scheme.long);ROOT.style.setProperty('--k11520-short-color',scheme.short);ROOT.style.setProperty('--k11520-neutral-color',scheme.neutral);ROOT.dataset.k11520TradeColorScheme=next;const select=$('#k11520TradeColorScheme');if(select&&select.value!==next)select.value=next;if(persist)try{localStorage.setItem(COLOR_STORE,next)}catch{}paintSignedC();publish();return next}
function ensureColorSetting(){const panel=$('#k11520UiSettings');if(!panel)return false;let row=$('#k11520TradeColorRow');if(!row){row=document.createElement('label');row.id='k11520TradeColorRow';row.className='row full k11520TradeColorRow';row.innerHTML=`<span>多空配色</span><select id="k11520TradeColorScheme" aria-label="多空配色"><option value="TW_RED_LONG">台股｜多紅 空綠</option><option value="GLOBAL_GREEN_LONG">國際｜多綠 空紅</option></select>`;panel.appendChild(row);const select=row.querySelector('select');select.addEventListener('change',()=>setColorScheme(select.value));}const select=$('#k11520TradeColorScheme');if(select&&select.value!==colorSchemeId)select.value=colorSchemeId;return true}

function ensureStyle(){
  if($('#k11520SignedCImmersiveStyle'))return;
  const s=document.createElement('style');s.id='k11520SignedCImmersiveStyle';s.textContent=`
:root{--k11520-long-color:#ff4f5e;--k11520-short-color:#35d07f;--k11520-neutral-color:#d8e4eb}
html.k11520ImmersiveViewport,html.k11520ImmersiveViewport body{width:100vw!important;height:var(--k11520-visible-vh,100dvh)!important;min-height:var(--k11520-visible-vh,100dvh)!important;max-height:var(--k11520-visible-vh,100dvh)!important;overflow:hidden!important}
html.k11520ImmersiveViewport #three{width:100vw!important;height:var(--k11520-visible-vh,100dvh)!important;min-height:var(--k11520-visible-vh,100dvh)!important;max-height:var(--k11520-visible-vh,100dvh)!important}
#k11520ImmersiveExit{position:fixed;z-index:13050;right:4px;top:max(4px,env(safe-area-inset-top));width:30px;height:30px;border:1px solid #68e4ff66;border-radius:9px;background:#071018dd;color:#dffaff;font:900 15px system-ui;display:none;place-items:center;touch-action:manipulation;box-shadow:0 4px 18px #000b}
html.k11520ImmersiveViewport #k11520ImmersiveExit{display:grid}
#cControl .track{background:linear-gradient(to bottom,color-mix(in srgb,var(--k11520-long-color) 42%,#071018) 0%,color-mix(in srgb,var(--k11520-long-color) 42%,#071018) 49.2%,var(--k11520-neutral-color) 49.2%,var(--k11520-neutral-color) 50.8%,color-mix(in srgb,var(--k11520-short-color) 42%,#071018) 50.8%,color-mix(in srgb,var(--k11520-short-color) 42%,#071018) 100%)!important}
#cControl[data-c-sign="positive"]{border-color:var(--k11520-long-color)!important;box-shadow:0 0 16px color-mix(in srgb,var(--k11520-long-color) 30%,transparent)!important}
#cControl[data-c-sign="negative"]{border-color:var(--k11520-short-color)!important;box-shadow:0 0 16px color-mix(in srgb,var(--k11520-short-color) 30%,transparent)!important}
#cControl[data-c-sign="zero"]{border-color:color-mix(in srgb,var(--k11520-neutral-color) 55%,transparent)!important;box-shadow:0 0 10px color-mix(in srgb,var(--k11520-neutral-color) 18%,transparent)!important}
#cControl[data-c-sign="positive"] label,#cControl[data-c-sign="positive"] .read{color:var(--k11520-long-color)!important}
#cControl[data-c-sign="negative"] label,#cControl[data-c-sign="negative"] .read{color:var(--k11520-short-color)!important}
#cControl[data-c-sign="zero"] label,#cControl[data-c-sign="zero"] .read{color:var(--k11520-neutral-color)!important}
#orderFire[data-k11520-side="LONG"]{border-color:var(--k11520-long-color)!important}
#orderFire[data-k11520-side="SHORT"]{border-color:var(--k11520-short-color)!important}
#k11520TradeColorRow{grid-template-columns:1fr 116px!important}
#k11520TradeColorScheme{width:116px;height:25px;border:1px solid #68e4ff55;border-radius:7px;background:#10202d;color:#e9fbff;font:800 8px system-ui,"Noto Sans TC",sans-serif;padding:0 4px}
@media(max-width:${MOBILE_MAX}px){html.k11520ImmersiveViewport body{overscroll-behavior:none!important}}
`;
  document.head.appendChild(s);
}

function syncViewport(){const next=`${viewportHeight()}px`;if(ROOT.style.getPropertyValue('--k11520-visible-vh')!==next)ROOT.style.setProperty('--k11520-visible-vh',next)}
function immersiveOn(){return !!fullEl()||fallbackImmersive}
function syncImmersive(){syncViewport();ROOT.classList.toggle('k11520ImmersiveViewport',immersiveOn());const mode=fullEl()?'fullscreen':fallbackImmersive?'viewport-fallback':'off';if(ROOT.dataset.k11520ImmersiveMode!==mode)ROOT.dataset.k11520ImmersiveMode=mode;const sw=$('#k11520FullscreenSwitch');if(sw){sw.dataset.k11520SignedCFullscreen='1';sw.setAttribute('aria-checked',String(immersiveOn()));const label=sw.closest('.row')?.querySelector('span');if(label&&label.textContent!=='沉浸全螢幕')label.textContent='沉浸全螢幕'}const exit=$('#k11520ImmersiveExit');if(exit){const title=fullEl()?'退出全螢幕':'退出沉浸模式';exit.title=title;exit.setAttribute('aria-label',title)}publish()}
async function requestImmersiveFullscreen(){lastError=null;try{if(fullEl())return true;const el=document.documentElement;if(typeof el.requestFullscreen==='function')await el.requestFullscreen({navigationUI:'hide'});else if(typeof el.webkitRequestFullscreen==='function')await el.webkitRequestFullscreen();else throw new Error('FULLSCREEN_API_UNAVAILABLE');fallbackImmersive=false;syncImmersive();return true}catch(err){lastError=String(err?.message||err||'FULLSCREEN_REJECTED');fallbackImmersive=true;syncImmersive();return false}}
async function exitImmersive(){try{if(document.fullscreenElement&&document.exitFullscreen)await document.exitFullscreen();else if(document.webkitFullscreenElement&&document.webkitExitFullscreen)await document.webkitExitFullscreen()}catch(err){lastError=String(err?.message||err)}fallbackImmersive=false;syncImmersive();return true}
async function toggleImmersive(){return immersiveOn()?exitImmersive():requestImmersiveFullscreen()}
function setFallbackImmersive(on=true){fallbackImmersive=!!on;syncImmersive();return immersiveOn()}
function ensureExit(){let b=$('#k11520ImmersiveExit');if(!b){b=document.createElement('button');b.id='k11520ImmersiveExit';b.type='button';b.textContent='↙';document.body.appendChild(b)}if(!b.dataset.bound){b.dataset.bound='1';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();void exitImmersive()},{capture:true})}return b}
function bindFullscreenSwitch(){const b=$('#k11520FullscreenSwitch');if(!b||b.dataset.k11520SignedCBound)return !!b;b.dataset.k11520SignedCBound='1';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();void toggleImmersive()},{capture:true});syncImmersive();return true}

function nearestAbsIndex(magnitude){let best=0;for(let i=1;i<ABS_LEVELS.length;i++)if(Math.abs(ABS_LEVELS[i]-magnitude)<Math.abs(ABS_LEVELS[best]-magnitude))best=i;return best}
function signedFromPointer(clientY,rect){const centered=Math.max(-1,Math.min(1,1-2*((clientY-rect.top)/Math.max(1,rect.height))));if(Math.abs(centered)<.055)return 0;const i=Math.max(1,Math.round(Math.abs(centered)*(ABS_LEVELS.length-1)));return Math.sign(centered)*ABS_LEVELS[i]}
function signedThumbTop(value){if(value===0)return 50;const idx=nearestAbsIndex(Math.abs(value));const span=idx/(ABS_LEVELS.length-1)*50;return 50-Math.sign(value)*span}
function dispatchNativeMagnitude(magnitude){const el=$('#cControl');if(!el)return;const r=el.getBoundingClientRect(),idx=nearestAbsIndex(Math.abs(magnitude)),t=idx/(ABS_LEVELS.length-1),y=r.top+(1-t)*r.height,x=r.left+r.width/2;internalNative=true;try{for(const [type,buttons] of [['pointerdown',1],['pointerup',0]])el.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:911,pointerType:'touch',clientX:x,clientY:y,buttons}))}finally{internalNative=false}}
function paintSignedC(axis=activeAxis()){
  const value=Number(signedByAxis[axis]||0),control=$('#cControl'),read=$('#cRead'),thumb=$('#cThumb');if(!control||!read||!thumb)return false;
  const sign=value>0?'positive':value<0?'negative':'zero';control.dataset.cSign=sign;control.dataset.cSide=signSide(value);control.setAttribute('aria-label',`C 速度 ${formatC(value)}；上正、中央 0、下負；${value>0?'多':value<0?'空':'中性'}`);control.title=control.getAttribute('aria-label');
  const text=formatC(value);if(read.textContent!==text)read.textContent=text;const top=`${signedThumbTop(value)}%`;if(thumb.style.top!==top)thumb.style.top=top;
  const label=control.querySelector('label');if(label&&label.textContent!=='C 速度')label.textContent='C 速度';
  const order=$('#orderFire');if(order){order.dataset.k11520SignedC=text;order.dataset.k11520Side=signSide(value);order.setAttribute('aria-label',`下單確認：${axis} ${text} ${value>0?'多':value<0?'空':'中性'}；方向由 C 正負決定`)}
  renderTradeSideLock();publish();return true;
}
async function syncCanonicalSide(value){const wanted=signSide(value),axis=activeAxis();if(wanted==='NEUTRAL'||busySide||sideSyncedByAxis[axis]===wanted)return true;busySide=true;ROOT.classList.add('k11520SignedCSideSync');try{const trade=$('[data-organ="trade"]');if(!trade)throw new Error('TRADE_ORGAN_NOT_FOUND');trade.click();await new Promise(r=>requestAnimationFrame(r));let side=$('#sideBtn');if(!side)throw new Error('SIDE_BUTTON_NOT_FOUND');if(parseSide(side.textContent)!==wanted){side.click();await new Promise(r=>requestAnimationFrame(r));side=$('#sideBtn')||side}if(parseSide(side.textContent)!==wanted)throw new Error('SIDE_SYNC_FAILED');sideSyncedByAxis[axis]=wanted;$('#sheetClose')?.click();await new Promise(r=>requestAnimationFrame(r));paintSignedC(axis);return true}catch(err){lastError=String(err?.message||err);return false}finally{ROOT.classList.remove('k11520SignedCSideSync');busySide=false;publish()}}
function applySignedValue(value,{syncSide=true}={}){const axis=activeAxis();signedByAxis[axis]=Object.is(value,-0)?0:value;dispatchNativeMagnitude(Math.abs(value));paintSignedC(axis);if(syncSide)void syncCanonicalSide(value);return signedByAxis[axis]}
function renderTradeSideLock(){const side=$('#sideBtn');if(!side)return;const value=Number(signedByAxis[activeAxis()]||0),wanted=signSide(value),text=wanted==='LONG'?'多':wanted==='SHORT'?'空':'中性';side.textContent=`方向：${text}（由 ${formatC(value)}）`;side.disabled=true;side.dataset.k11520Side=wanted;side.setAttribute('aria-disabled','true');side.title='多空由 C 正負唯一決定；不可另外切換'}
function onCEvent(e){if(internalNative)return;const el=e.target?.closest?.('#cControl');if(!el)return;if(e.type==='pointerdown'){cPointer=e.pointerId;try{el.setPointerCapture?.(cPointer)}catch{}}if(e.type==='pointermove'&&e.pointerId!==cPointer)return;if((e.type==='pointerup'||e.type==='pointercancel')&&e.pointerId!==cPointer)return;e.preventDefault();e.stopImmediatePropagation();if(e.type!=='pointerup'&&e.type!=='pointercancel'){const v=signedFromPointer(e.clientY,el.getBoundingClientRect());applySignedValue(v)}else cPointer=null}
function onDocumentClick(e){if(e.target?.id==='sideBtn'){e.preventDefault();e.stopImmediatePropagation();renderTradeSideLock();return}const card=e.target?.closest?.('#axes [data-axis]');if(card)setTimeout(()=>{paintSignedC(card.dataset.axis);void syncCanonicalSide(Number(signedByAxis[card.dataset.axis]||0))},0)}
function bindC(){const el=$('#cControl');if(!el||el.dataset.k11520SignedCBound)return !!el;el.dataset.k11520SignedCBound='1';for(const type of ['pointerdown','pointermove','pointerup','pointercancel'])el.addEventListener(type,onCEvent,{capture:true,passive:false});paintSignedC();return true}
function publish(){const scheme=COLOR_SCHEMES[colorSchemeId];globalThis.__K11520_SIGNED_C_IMMERSIVE__={version:'1.1.0',ready:true,activeAxis:activeAxis(),signedC:Number(signedByAxis[activeAxis()]||0),signedByAxis:{...signedByAxis},lotsRemainPositive:true,cSemantics:'SIGNED_VELOCITY_PLUS_LONG_MINUS_SHORT',colorScheme:colorSchemeId,colorSemantics:{long:scheme.long,short:scheme.short,neutral:scheme.neutral},fullscreen:!!fullEl(),fallbackImmersive,immersive:immersiveOn(),navigationUiRequested:'hide',lastError,api:{applySignedValue,setColorScheme,setFallbackImmersive,requestImmersiveFullscreen,exitImmersive,toggleImmersive,paintSignedC}}}
function install(){if(typeof document==='undefined')return null;ensureStyle();loadColorScheme();setColorScheme(colorSchemeId,{persist:false});ensureExit();bindFullscreenSwitch();bindC();ensureColorSetting();syncImmersive();paintSignedC();if(!ROOT.dataset.k11520SignedCGlobalBound){ROOT.dataset.k11520SignedCGlobalBound='1';document.addEventListener('click',onDocumentClick,true);document.addEventListener('fullscreenchange',syncImmersive);document.addEventListener('webkitfullscreenchange',syncImmersive);addEventListener('resize',()=>{syncViewport();paintSignedC()},{passive:true});globalThis.visualViewport?.addEventListener?.('resize',syncViewport,{passive:true})}observer?.disconnect?.();observer=new MutationObserver(()=>{ensureExit();bindFullscreenSwitch();bindC();ensureColorSetting();renderTradeSideLock();paintSignedC()});observer.observe(document.documentElement,{subtree:true,childList:true});clearInterval(timer);timer=setInterval(()=>{bindFullscreenSwitch();bindC();ensureColorSetting();renderTradeSideLock();paintSignedC()},140);publish();return globalThis.__K11520_SIGNED_C_IMMERSIVE__}

export function install11520SignedCImmersive(){return install()}
if(typeof document!=='undefined')install();