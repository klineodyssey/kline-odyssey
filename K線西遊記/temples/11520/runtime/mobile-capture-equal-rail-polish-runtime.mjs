/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE
PURPOSE: Make the backpack capture control visibly render as 捕 and keep Y/C/lot mobile energy tracks on one canonical 26px width without changing control authority.
*/

const MOBILE_MAX=600;
const STYLE_ID='k11520CaptureEqualRailPolish';

function installStyle(){
  if(typeof document==='undefined')return;
  let style=document.getElementById(STYLE_ID);
  if(!style){style=document.createElement('style');style.id=STYLE_ID;document.head.appendChild(style)}
  style.textContent=`
@media(max-width:${MOBILE_MAX}px){
  html[data-k11520-layout-owner] #yControl .track,
  html[data-k11520-layout-owner] #cControl .track,
  html[data-k11520-layout-owner] #lotsControl .track{
    box-sizing:border-box!important;
    left:50%!important;
    right:auto!important;
    width:26px!important;
    min-width:26px!important;
    max-width:26px!important;
    transform:translateX(-50%)!important;
  }
}
#backpackPanel #backpackCaptureNearby{
  appearance:none;
  -webkit-appearance:none;
  flex:0 0 42px;
  width:42px;
  height:36px;
  display:grid;
  place-items:center;
  padding:0;
  margin:0;
  border:1px solid #f1ca7388;
  border-radius:10px;
  background:#13212bee;
  color:#f1ca73;
  font:900 22px/1 system-ui,-apple-system,"Noto Sans TC",sans-serif;
  text-indent:0;
  letter-spacing:0;
  box-shadow:inset 0 0 0 1px #ffffff0a,0 3px 10px #0007;
  cursor:pointer;
  touch-action:manipulation;
}
#backpackPanel #backpackCaptureNearby:active{transform:scale(.96)}
#backpackPanel #backpackCaptureNearby:focus-visible{outline:2px solid #65e798;outline-offset:2px}
`;
}

function polishBackpack(){
  const panel=document.getElementById('backpackPanel');
  if(!panel)return false;
  const head=panel.querySelector('.bpHead');
  const capture=document.getElementById('backpackCaptureNearby');
  const title=head?.querySelector('b');
  if(title&&title.textContent!=='🎒 花果山背包 · 活體收納')title.textContent='🎒 花果山背包 · 活體收納';
  if(capture){
    capture.textContent='捕';
    capture.title='捕捉附近生命';
    capture.setAttribute('aria-label','捕捉附近牛、魚、蝦、雞、鴨');
    capture.dataset.k11520CaptureControl='READY';
  }
  const empty=panel.querySelector('.bpEmpty');
  if(empty)empty.textContent='背包目前是空的。靠近可捕捉生命後按「捕」，即可將牛、魚、蝦、雞、鴨等活體收入背包；寶物則由採集取得。';
  return Boolean(capture);
}

function rect(sel){const el=document.querySelector(sel);if(!el)return null;const r=el.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width}}
function measure(){
  if(typeof document==='undefined'||innerWidth>MOBILE_MAX)return {ok:true,skipped:true};
  const y=rect('#yControl .track'),c=rect('#cControl .track'),lots=rect('#lotsControl .track');
  const widths=[y?.width,c?.width,lots?.width].filter(Number.isFinite);
  const equal=widths.length===3&&widths.every(w=>Math.abs(w-26)<1)&&Math.max(...widths)-Math.min(...widths)<1;
  const report={version:'1.0.0',targetWidth:26,y,c,lots,equal};
  document.documentElement.dataset.k11520EqualRailTracks=equal?'PASS':'RED';
  globalThis.__K11520_CAPTURE_EQUAL_RAIL_POLISH__=report;
  return report;
}

function apply(){installStyle();polishBackpack();requestAnimationFrame(()=>measure())}

export function install11520CaptureEqualRailPolish(){
  if(typeof document==='undefined')return {ok:true,skipped:true};
  apply();
  const observer=new MutationObserver(()=>apply());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  addEventListener('resize',apply,{passive:true});
  return measure();
}

if(typeof document!=='undefined')install11520CaptureEqualRailPolish();
