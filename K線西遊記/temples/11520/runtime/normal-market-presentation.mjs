/* KGEN_META
VERSION: 1.0.1
STATUS: ACTIVE
FORMAL_ORGAN_NAME: Normal Market Presentation
PURPOSE: Present the K-sphere normal-axis market implied by the active 3D control plane without changing the trading selection or world coordinates. XZ -> KY, XY -> KZ, YZ -> KX. All three K-axis markets remain visible; only the current normal axis is visually emphasized.
*/
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const NORMAL_BY_PLANE={XZ:'KY',XY:'KZ',YZ:'KX'};
let timer=null,lastKey='';

function ensureStyle(){
  if($('#k11520NormalMarketStyle'))return;
  const s=document.createElement('style');
  s.id='k11520NormalMarketStyle';
  s.textContent=`
#axes .axis.k11520NormalActive{outline:2px solid #f6d56f!important;box-shadow:0 0 0 1px #f6d56f44,0 0 18px #f6d56f38!important}
#axes .axis.k11520NormalActive .axisHead span{color:#ffe89b!important}
#axes .axis .k11520NormalBadge{display:none;margin-left:5px;padding:1px 5px;border-radius:999px;border:1px solid #f6d56f88;color:#ffe89b;background:#3b2b0acc;font:900 8px system-ui,"Noto Sans TC",sans-serif;vertical-align:middle;white-space:nowrap}
#axes .axis.k11520NormalActive .k11520NormalBadge{display:inline-block}
#k11520PlaneLabel{top:-47px!important;left:2px!important;right:auto!important;width:122px!important;min-height:34px!important;padding:4px 7px!important;border-radius:9px!important;border:1px solid #68e4ff55!important;background:#07141de8!important;box-shadow:0 4px 14px #0008!important;text-align:left!important;line-height:1.15!important;white-space:nowrap!important}
#k11520PlaneLabel .k11520PlaneName{display:block;color:#8eeaff;font:900 9px system-ui,"Noto Sans TC",sans-serif;letter-spacing:.02em}
#k11520NormalMarketHint{display:block;margin-top:2px;color:#ffe89b;font:900 7.5px system-ui,"Noto Sans TC",sans-serif;letter-spacing:0;text-shadow:0 1px 2px #000;white-space:nowrap}
@media(max-width:420px){#axes .axis .k11520NormalBadge{font-size:7px;padding:1px 3px}#k11520PlaneLabel{top:-45px!important;width:116px!important;padding:4px 6px!important}#k11520PlaneLabel .k11520PlaneName{font-size:8.5px}#k11520NormalMarketHint{font-size:7px}}
`;
  document.head.appendChild(s);
}

function state(){return globalThis.__K11520_3D_CONTROL__||globalThis.__K11520_JOYSTICK_XZXY__||null}
function normalAxis(mode){return NORMAL_BY_PLANE[mode]||'KY'}
function decorateAxes(normal){
  for(const el of $$('[data-axis]')){
    const active=el.dataset.axis===normal;
    el.classList.toggle('k11520NormalActive',active);
    const head=el.querySelector('.axisHead span');
    if(!head)continue;
    let badge=head.querySelector('.k11520NormalBadge');
    if(!badge){badge=document.createElement('em');badge.className='k11520NormalBadge';head.appendChild(badge)}
    badge.textContent='⊥ 法向作功';
    badge.setAttribute('aria-label',`${el.dataset.axis} 法向作功`);
  }
}
function decorateJoystick(mode,normal){
  const label=$('#k11520PlaneLabel');
  if(!label)return;
  let planeName=label.querySelector('.k11520PlaneName');
  if(!planeName){planeName=document.createElement('span');planeName.className='k11520PlaneName';label.prepend(planeName)}
  planeName.textContent=`${mode} 操控面`;
  for(const node of [...label.childNodes]){
    if(node.nodeType===Node.TEXT_NODE&&node.textContent.trim())node.textContent='';
  }
  let hint=$('#k11520NormalMarketHint');
  if(!hint){hint=document.createElement('span');hint.id='k11520NormalMarketHint';label.appendChild(hint)}
  hint.textContent=`⊥ ${normal} 多空 · 法向作功`;
  label.setAttribute('aria-label',`${mode} 操控面，法向 ${normal} 多空市場`);
}
function paint(){
  const mode=state()?.mode||'XZ',normal=normalAxis(mode),key=`${mode}|${normal}|${$$('[data-axis]').length}`;
  ensureStyle();decorateAxes(normal);decorateJoystick(mode,normal);
  globalThis.__K11520_NORMAL_MARKET__={mode,normalAxis:normal,semantics:'NORMAL_ONLY_WORK',marketsRemainConcurrent:true,tradingAxisUntouched:true};
  lastKey=key;
}
export function install11520NormalMarketPresentation(){
  ensureStyle();paint();
  if(timer)clearInterval(timer);
  timer=setInterval(()=>{const mode=state()?.mode||'XZ',normal=normalAxis(mode),key=`${mode}|${normal}|${$$('[data-axis]').length}`;if(key!==lastKey||!$('#k11520NormalMarketHint')||!$('[data-axis].k11520NormalActive'))paint()},120);
  return true;
}
