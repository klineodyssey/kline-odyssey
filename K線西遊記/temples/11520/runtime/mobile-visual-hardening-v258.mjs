/* KGEN_META
VERSION: 2.5.8
STATUS: ACTIVE
PURPOSE: Final mobile visual hardening for the 11520 product. Keeps the collapsed wallet valve visibly inside its panel, relocates exactly one real backpack outside the organ rail before visual capture, and exposes a small runtime health record. No wallet, trade, settlement, chain, payment, treasury, or governance behavior changes.
*/
const $=s=>document.querySelector(s);

function ensureStyle(){
  if($('#k11520MobileVisualV258'))return;
  const s=document.createElement('style');s.id='k11520MobileVisualV258';s.textContent=`
  #walletPanel.collapsed{display:block!important;position:fixed!important;width:46px!important;height:46px!important;min-width:46px!important;max-width:46px!important;padding:4px!important;overflow:hidden!important}
  #walletPanel.collapsed .walletHead{display:block!important;position:static!important;width:38px!important;height:38px!important;margin:0!important;padding:0!important}
  #walletPanel.collapsed #walletToggle{display:grid!important;position:static!important;inset:auto!important;transform:none!important;place-items:center!important;width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;margin:0!important;padding:0!important;opacity:1!important;visibility:visible!important;color:#9eeeff!important;background:#101923!important;border:1px solid #68e4ff66!important;border-radius:10px!important;font-size:18px!important;line-height:1!important;z-index:1!important}
  .bagRelocatedV258{position:fixed!important;z-index:2990!important;right:5px!important;bottom:84px!important;width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important;margin:0!important;padding:0!important;display:grid!important;place-items:center!important;border-radius:13px!important;opacity:1!important;visibility:visible!important}
  @media(max-width:420px){#walletPanel.collapsed{right:66px!important;bottom:238px!important}.bagRelocatedV258{right:5px!important;bottom:84px!important}}
  `;document.head.appendChild(s);
}

function setText(el,value){if(el&&(el.textContent||'')!==value)el.textContent=value}
function setAttr(el,name,value){if(el&&el.getAttribute(name)!==value)el.setAttribute(name,value)}
function syncVersion(){const n=document.querySelector('.brandMetaV250 span:first-child');setText(n,'V2.5.8 · 5D K線西遊記')}
function hardenWallet(){
  const p=$('#walletPanel'),t=$('#walletToggle');if(!p||!t)return false;
  const collapsed=p.classList.contains('collapsed'),glyph=collapsed?'▶':'◀',label=collapsed?'展開 12345 / BSC 錢包':'收合 12345 / BSC 錢包';
  setText(t,glyph);setAttr(t,'aria-label',label);if(t.title!==label)t.title=label;
  if(collapsed){
    const head=p.querySelector('.walletHead');if(head&&t.parentElement!==head)head.prepend(t);
    for(const [k,v] of [['position','static'],['top','auto'],['right','auto'],['bottom','auto'],['left','auto'],['transform','none'],['width','38px'],['height','38px'],['min-width','38px'],['min-height','38px'],['margin','0'],['padding','0']])t.style.setProperty(k,v,'important');
  }else{
    for(const k of ['position','top','right','bottom','left','transform','width','height','min-width','min-height','margin','padding'])t.style.removeProperty(k);
  }
  return true
}
function relocateBag(){
  const all=[...document.querySelectorAll('[data-organ="bag"],button[title*="背包"],button[aria-label*="背包"]')].filter((el,i,a)=>a.indexOf(el)===i);if(!all.length)return false;
  const bag=all.find(el=>el.classList.contains('bagRelocatedV258'))||all.find(el=>el.classList.contains('bagRelocatedV250'))||all[0];
  for(const el of all){if(el!==bag){if(el.classList.contains('bagRelocatedV250'))el.classList.remove('bagRelocatedV250');if(el.classList.contains('bagRelocatedV258'))el.classList.remove('bagRelocatedV258');if(el.style.display!=='none')el.style.display='none'}}
  if(!bag.classList.contains('bagRelocatedV250'))bag.classList.add('bagRelocatedV250');if(!bag.classList.contains('bagRelocatedV258'))bag.classList.add('bagRelocatedV258');if(bag.style.display!=='grid')bag.style.display='grid';if(!(bag.textContent||'').trim())setText(bag,'🎒');if(!bag.title)bag.title='背包';if(!bag.getAttribute('aria-label'))bag.setAttribute('aria-label','背包');if(bag.parentElement!==document.body)document.body.appendChild(bag);return true
}
function health(){const p=$('#walletPanel'),t=$('#walletToggle'),b=$('.bagRelocatedV258');const pr=p?.getBoundingClientRect(),tr=t?.getBoundingClientRect(),br=b?.getBoundingClientRect();const report={version:'2.5.8',walletCollapsed:!!p?.classList.contains('collapsed'),walletCompact:!!pr&&pr.width<=50&&pr.height<=50,walletToggleVisible:!!tr&&tr.width>0&&tr.height>0&&(t?.textContent||'').trim().length>0,walletToggleInside:!!pr&&!!tr&&tr.left>=pr.left-1&&tr.right<=pr.right+1&&tr.top>=pr.top-1&&tr.bottom<=pr.bottom+1,bagStandalone:!!b&&b.parentElement===document.body,bagVisible:!!br&&br.width>0&&br.height>0};report.ok=Object.values(report).every((v,k)=>k<1||typeof v!=='boolean'||v);globalThis.__K11520_MOBILE_VISUAL_HEALTH__=report;document.documentElement.dataset.v258VisualHealth=report.ok?'PASS':'RED';return report}
function apply(){ensureStyle();syncVersion();hardenWallet();relocateBag();return health()}

export function install11520MobileVisualHardeningV258(){apply();let n=0;const tick=()=>{n++;apply();if(n<36)setTimeout(tick,120)};setTimeout(tick,80);let queued=false;const mo=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;apply()})});mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});setTimeout(()=>{try{mo.disconnect()}catch{}apply()},7000);return health()}
export {health as get11520MobileVisualHealth};
