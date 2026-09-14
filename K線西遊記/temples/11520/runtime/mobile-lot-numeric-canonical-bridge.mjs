const $=s=>document.querySelector(s);
let timer=null;
function bind(){
  const input=$('#lotsNumericInput');
  if(!input)return false;
  if(input.dataset.k11520CanonicalLotBridge==='3')return true;
  input.type='text';
  input.inputMode='numeric';
  input.setAttribute('min','1');
  input.setAttribute('max','100');
  input.setAttribute('pattern','-?[0-9]*');
  input.dataset.k11520CanonicalLotBridge='3';
  publish();
  return true;
}
function publish(){
  globalThis.__K11520_LOT_NUMERIC_BRIDGE__={
    version:'1.1.0',
    ready:!!$('#lotsNumericInput'),
    range:[1,100],
    positiveOnly:true,
    controlledTextInput:true,
    authority:'SIGNED_C_RUNTIME_EXISTING_NUMERIC_HANDLER'
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
