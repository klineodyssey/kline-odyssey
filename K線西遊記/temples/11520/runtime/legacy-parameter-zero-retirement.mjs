/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE / COMPATIBILITY RETIREMENT
FORMAL_ORGAN_NAME: 11520 Legacy Parameter Zero Retirement
PURPOSE: Retire obsolete 0-lot and bottom-zero-C presentation semantics left by the V2.6.4 product-fix layer. Preserve signed-C center zero and positive-only lots while routing corrected lot input through the existing canonical pointer path. No order execution, wallet, chain, treasury or governance mutation.
*/
const $=s=>document.querySelector(s);
let correcting=false,observer=null;
function ensureStyle(){let s=$('#k11520LegacyParameterZeroRetirementStyle');if(!s){s=document.createElement('style');s.id='k11520LegacyParameterZeroRetirementStyle';document.head.appendChild(s)}s.textContent='#cControl::after,#lotsControl::after{content:none!important;display:none!important}';}
function correctionPoint(el){const r=el.getBoundingClientRect(),t=.013;return{x:r.left+r.width/2,y:r.top+(1-t)*r.height}}
function firePositiveMinimum(){const el=$('#lotsControl');if(!el||correcting)return false;correcting=true;try{const {x,y}=correctionPoint(el);for(const [type,buttons] of [['pointerdown',1],['pointerup',0]])el.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,composed:true,pointerId:9913,pointerType:'touch',isPrimary:true,clientX:x,clientY:y,buttons,button:buttons?0:-1}))}finally{correcting=false}return true}
function retireDatasets(){const lots=$('#lotsControl'),c=$('#cControl');if(lots){lots.dataset.zeroSemantics='retired';lots.dataset.zeroLots='0'}if(c){c.dataset.zeroSemantics='retired';c.dataset.zeroWarp='0'}document.documentElement.dataset.k11520LegacyZeroParameters='RETIRED'}
function enforcePositiveLots(){const read=$('#lotsRead');if(!read)return false;const n=parseInt(read.textContent||'',10);if(Number.isFinite(n)&&n>=1)return true;return firePositiveMinimum()}
function bind(){ensureStyle();retireDatasets();const lots=$('#lotsControl');if(lots&&lots.dataset.k11520PositiveLotRetirementBound!=='1'){lots.dataset.k11520PositiveLotRetirementBound='1';for(const type of ['pointerdown','pointermove','pointerup'])lots.addEventListener(type,()=>queueMicrotask(enforcePositiveLots))}if(observer)observer.disconnect();const read=$('#lotsRead');if(read){observer=new MutationObserver(()=>{if(!correcting)queueMicrotask(enforcePositiveLots)});observer.observe(read,{childList:true,characterData:true,subtree:true})}queueMicrotask(enforcePositiveLots);return true}
function publish(){globalThis.__K11520_LEGACY_PARAMETER_ZERO_RETIREMENT__={version:'1.0.0',ready:true,legacyZeroLotsRetired:true,legacyBottomZeroCRetired:true,lotsPositiveOnly:true,cZeroLocation:'CENTER',authority:'SIGNED_C_PLUS_POSITIVE_LOTS'}}
export function install11520LegacyParameterZeroRetirement(){if(typeof document==='undefined')return null;bind();publish();for(const delay of [120,400,900])setTimeout(()=>{bind();publish()},delay);return globalThis.__K11520_LEGACY_PARAMETER_ZERO_RETIREMENT__}
if(typeof document!=='undefined')install11520LegacyParameterZeroRetirement();
