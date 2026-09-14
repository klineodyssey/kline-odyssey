/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE / UI-ONLY
FORMAL_ORGAN_NAME: 11520 Mobile Immersive Trading Runtime
PURPOSE: Use the available mobile viewport efficiently, request browser fullscreen with navigation UI hidden when the browser permits it, provide a fail-open immersive viewport fallback when it does not, and expose direct LONG/SHORT selection on the active K-axis card without executing an order. Canonical order confirmation remains unchanged; no wallet, chain, payment, treasury, governance, signer or authority mutation.
*/

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const ROOT=document.documentElement;
const MOBILE_MAX=600;
const SIDES={LONG:'多',SHORT:'空'};
const sideByAxis={KX:'LONG',KY:'LONG',KZ:'LONG'};
let fallbackImmersive=false,busy=false,lastError=null,axesObserver=null,bodyObserver=null;

const sleepFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));
function mobile(){return innerWidth<=MOBILE_MAX}
function activeCard(){return $('[data-axis].active')||$('[data-axis="KX"]')||$('[data-axis]')}
function activeAxis(){return activeCard()?.dataset.axis||'KX'}
function parseSide(text=''){return /空|SHORT|SELL/i.test(text)?'SHORT':'LONG'}
function fullscreenElement(){return document.fullscreenElement||document.webkitFullscreenElement||null}

function ensureStyle(){
  if($('#k11520ImmersiveTradingStyle'))return;
  const s=document.createElement('style');s.id='k11520ImmersiveTradingStyle';s.textContent=`
html.k11520ImmersiveViewport,html.k11520ImmersiveViewport body{width:100vw!important;height:var(--k11520-visible-vh,100dvh)!important;min-height:var(--k11520-visible-vh,100dvh)!important;max-height:var(--k11520-visible-vh,100dvh)!important;overflow:hidden!important}
html.k11520ImmersiveViewport #three{width:100vw!important;height:var(--k11520-visible-vh,100dvh)!important;min-height:var(--k11520-visible-vh,100dvh)!important;max-height:var(--k11520-visible-vh,100dvh)!important}
#k11520ImmersiveExit{position:fixed;z-index:13050;right:4px;top:max(4px,env(safe-area-inset-top));width:30px;height:30px;border:1px solid #68e4ff66;border-radius:9px;background:#071018dd;color:#dffaff;font:900 15px system-ui;display:none;place-items:center;touch-action:manipulation;box-shadow:0 4px 18px #000b}
html.k11520ImmersiveViewport #k11520ImmersiveExit{display:grid}
html.k11520DirectionSyncing #sheet{visibility:hidden!important;opacity:0!important;pointer-events:none!important;transition:none!important}
.k11520DirectionPicker{display:none;margin-top:4px;grid-template-columns:1fr 1fr;gap:3px}
.k11520DirectionButton{min-width:0;height:24px;padding:0 3px;border-radius:7px;font:900 7px system-ui,"Noto Sans TC",sans-serif;line-height:1;border:1px solid transparent;touch-action:manipulation}
.k11520DirectionLong{background:#0c3d2f;color:#8dffc0;border-color:#65e79866}
.k11520DirectionShort{background:#4a1d24;color:#ffadb1;border-color:#ff737a66}
.k11520DirectionButton[aria-pressed="true"]{outline:2px solid #fff9;box-shadow:0 0 12px currentColor}
.axis.active .k11520DirectionPicker{display:grid}
.axis.active[data-k11520-side="LONG"]{box-shadow:0 0 0 1px #65e79833,0 0 16px #65e79818!important}
.axis.active[data-k11520-side="SHORT"]{box-shadow:0 0 0 1px #ff737a33,0 0 16px #ff737a18!important}
@media(max-width:${MOBILE_MAX}px){
  .axis.active .k11520DirectionPicker{display:grid}
  .k11520DirectionButton{height:23px;font-size:6.8px}
  html.k11520ImmersiveViewport body{overscroll-behavior:none!important}
}
`;
  document.head.appendChild(s);
}

function viewportHeight(){return Math.max(1,Math.round(globalThis.visualViewport?.height||innerHeight||document.documentElement.clientHeight||1))}
function syncViewport(){ROOT.style.setProperty('--k11520-visible-vh',`${viewportHeight()}px`)}
function immersiveOn(){return !!fullscreenElement()||fallbackImmersive}
function syncImmersive(){
  syncViewport();
  ROOT.classList.toggle('k11520ImmersiveViewport',immersiveOn());
  ROOT.dataset.k11520ImmersiveMode=fullscreenElement()?'fullscreen':fallbackImmersive?'viewport-fallback':'off';
  const sw=$('#k11520FullscreenSwitch');if(sw){sw.setAttribute('aria-checked',String(immersiveOn()));sw.dataset.k11520ImmersiveFullscreen='1'}
  const label=sw?.closest?.('.row')?.querySelector('span');if(label)label.textContent='沉浸全螢幕';
  const exit=$('#k11520ImmersiveExit');if(exit){exit.title=fullscreenElement()?'退出全螢幕':'退出沉浸模式';exit.setAttribute('aria-label',exit.title)}
  publish();
}

async function requestImmersiveFullscreen(){
  lastError=null;
  if(fullscreenElement())return true;
  const el=document.documentElement;
  try{
    if(typeof el.requestFullscreen==='function')await el.requestFullscreen({navigationUI:'hide'});
    else if(typeof el.webkitRequestFullscreen==='function')await el.webkitRequestFullscreen();
    else throw new Error('FULLSCREEN_API_UNAVAILABLE');
    fallbackImmersive=false;
    syncImmersive();
    return true;
  }catch(err){
    lastError=String(err?.message||err||'FULLSCREEN_REJECTED');
    fallbackImmersive=true;
    syncImmersive();
    return false;
  }
}
async function exitImmersive(){
  try{
    if(document.fullscreenElement&&typeof document.exitFullscreen==='function')await document.exitFullscreen();
    else if(document.webkitFullscreenElement&&typeof document.webkitExitFullscreen==='function')await document.webkitExitFullscreen();
  }catch(err){lastError=String(err?.message||err)}
  fallbackImmersive=false;syncImmersive();return true;
}
async function toggleImmersive(){return immersiveOn()?exitImmersive():requestImmersiveFullscreen()}
function setFallbackImmersive(on=true){fallbackImmersive=!!on;syncImmersive();return immersiveOn()}

function ensureExit(){
  let b=$('#k11520ImmersiveExit');if(!b){b=document.createElement('button');b.id='k11520ImmersiveExit';b.type='button';b.textContent='↙';document.body.appendChild(b)}
  if(!b.dataset.bound){b.dataset.bound='1';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();void exitImmersive()},{capture:true})}
  return b;
}
function bindFullscreenSwitch(){
  const b=$('#k11520FullscreenSwitch');if(!b||b.dataset.k11520ImmersiveBound)return !!b;
  b.dataset.k11520ImmersiveBound='1';
  b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();void toggleImmersive()},{capture:true});
  syncImmersive();
  return true;
}

function ensurePicker(card){
  let p=card.querySelector('.k11520DirectionPicker');
  if(!p){p=document.createElement('div');p.className='k11520DirectionPicker';p.innerHTML='<button type="button" class="k11520DirectionButton k11520DirectionLong" data-k11520-side="LONG">多 LONG</button><button type="button" class="k11520DirectionButton k11520DirectionShort" data-k11520-side="SHORT">空 SHORT</button>';card.appendChild(p)}
  return p;
}
function paintDirections(){
  for(const card of $$('[data-axis]')){
    const axis=card.dataset.axis;if(!axis||!sideByAxis[axis])continue;
    ensurePicker(card);const side=sideByAxis[axis];card.dataset.k11520Side=side;
    for(const b of card.querySelectorAll('[data-k11520-side]')){const on=b.dataset.k11520Side===side;b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',`${axis} ${b.dataset.k11520Side==='LONG'?'做多 LONG':'做空 SHORT'}；只選方向，不直接下單`)}
  }
  const order=$('#orderFire');if(order){const axis=activeAxis(),side=sideByAxis[axis];order.dataset.k11520SelectedSide=side;order.setAttribute('aria-label',`下單確認：${axis} ${side==='LONG'?'多 LONG':'空 SHORT'}；仍需確認`)}
  publish();
}
async function syncCanonicalSide(axis,target){
  if(busy||!SIDES[target]||!['KX','KY','KZ'].includes(axis))return false;
  busy=true;
  try{
    let card=$(`[data-axis="${axis}"]`);if(!card)return false;
    if(!card.classList.contains('active')){card.click();await sleepFrame();card=$(`[data-axis="${axis}"]`)||card}
    ROOT.classList.add('k11520DirectionSyncing');
    const trade=$('[data-organ="trade"]');if(!trade)throw new Error('TRADE_ORGAN_NOT_FOUND');
    trade.click();await sleepFrame();
    let sideBtn=$('#sideBtn');if(!sideBtn)throw new Error('SIDE_BUTTON_NOT_FOUND');
    if(parseSide(sideBtn.textContent)!==target){sideBtn.click();await sleepFrame();sideBtn=$('#sideBtn')||sideBtn}
    if(parseSide(sideBtn.textContent)!==target)throw new Error('SIDE_SYNC_FAILED');
    sideByAxis[axis]=target;
    $('#sheetClose')?.click();await sleepFrame();
    paintDirections();
    return true;
  }catch(err){lastError=String(err?.message||err);return false}
  finally{ROOT.classList.remove('k11520DirectionSyncing');busy=false;publish()}
}

function onDocumentClick(e){
  const dir=e.target?.closest?.('[data-k11520-side]');
  if(dir){e.preventDefault();e.stopImmediatePropagation();const card=dir.closest('[data-axis]'),axis=card?.dataset.axis,target=dir.dataset.k11520Side;if(axis&&target)void syncCanonicalSide(axis,target);return}
  if(e.target?.id==='sideBtn')setTimeout(()=>{sideByAxis[activeAxis()]=parseSide($('#sideBtn')?.textContent||'');paintDirections()},0);
}
function observeAxes(){
  const axes=$('#axes');if(!axes)return false;
  if(axesObserver)axesObserver.disconnect();
  axesObserver=new MutationObserver(()=>queueMicrotask(paintDirections));axesObserver.observe(axes,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});paintDirections();return true;
}
function publish(){globalThis.__K11520_IMMERSIVE_TRADING__={version:'1.0.0',ready:true,mobile:mobile(),immersive:immersiveOn(),fullscreen:!!fullscreenElement(),fallbackImmersive,lastError,activeAxis:activeAxis(),sideByAxis:{...sideByAxis},directionSelectionOnly:true,orderConfirmationUnchanged:true,navigationUiRequested:'hide',api:{requestImmersiveFullscreen,exitImmersive,toggleImmersive,setFallbackImmersive,syncCanonicalSide,paintDirections}}}

function install(){
  if(typeof document==='undefined')return null;
  ensureStyle();ensureExit();bindFullscreenSwitch();observeAxes();syncImmersive();paintDirections();
  if(!ROOT.dataset.k11520ImmersiveTradingBound){ROOT.dataset.k11520ImmersiveTradingBound='1';document.addEventListener('click',onDocumentClick,true);document.addEventListener('fullscreenchange',syncImmersive);document.addEventListener('webkitfullscreenchange',syncImmersive);addEventListener('resize',()=>{syncViewport();paintDirections()},{passive:true});globalThis.visualViewport?.addEventListener?.('resize',syncViewport,{passive:true})}
  if(bodyObserver)bodyObserver.disconnect();bodyObserver=new MutationObserver(()=>{ensureExit();bindFullscreenSwitch();if(!axesObserver||!$('#axes')?.contains?.(activeCard()))observeAxes();paintDirections();syncImmersive()});bodyObserver.observe(document.documentElement,{childList:true,subtree:true});
  for(const delay of [0,120,400,900,1800])setTimeout(()=>{ensureExit();bindFullscreenSwitch();observeAxes();syncImmersive();paintDirections()},delay);
  publish();return globalThis.__K11520_IMMERSIVE_TRADING__;
}

export function install11520MobileImmersiveTrading(){return install()}
if(typeof document!=='undefined')install();
