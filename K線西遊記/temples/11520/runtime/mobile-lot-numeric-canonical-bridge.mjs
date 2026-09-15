const $=s=>document.querySelector(s);
let timer=null;
function currentLots(){const n=parseInt($('#lotsRead')?.textContent||'1',10);return Number.isFinite(n)?Math.max(1,Math.min(100,n)):1}
function commitThroughCanonical(input){const api=globalThis.__K11520_SIGNED_C_IMMERSIVE__?.api;if(!api?.setLotsFromNumeric)return null;const result=api.setLotsFromNumeric(input.value);input.value=String(result==null?currentLots():result);return result}
function bind(){
  const input=$('#lotsNumericInput');
  if(!input)return false;
  if(input.dataset.k11520CanonicalLotBridge==='4')return true;
  input.type='text';
  input.inputMode='numeric';
  input.setAttribute('min','1');
  input.setAttribute('max','100');
  input.setAttribute('pattern','-?[0-9]*');
  input.dataset.k11520CanonicalLotBridge='4';
  input.addEventListener('keydown',e=>{
    if(e.key!=='Enter')return;
    e.preventDefault();
    e.stopImmediatePropagation();
    commitThroughCanonical(input);
    input.blur();
  },{capture:true});
  publish();
  return true;
}
function publish(){
  globalThis.__K11520_LOT_NUMERIC_BRIDGE__={
    version:'1.2.0',
    ready:!!$('#lotsNumericInput'),
    range:[1,100],
    positiveOnly:true,
    controlledTextInput:true,
    authority:'SIGNED_C_RUNTIME_API',
    enterCommitCapture:true
  };
}
export function install11520LotNumericCanonicalBridge(){
  if(typeof document==='undefined')return null;
  bind();
  clearInterval(timer);
  timer=setInterval(()=>{bind();publish()},160);
  publish();
  return globalThis.__K11520_LOT_NUMERIC_BRIDGE__;
}
if(typeof document!=='undefined')install11520LotNumericCanonicalBridge();
