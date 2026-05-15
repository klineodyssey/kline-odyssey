// KGEN 12345 V10.22 holy cup humanized / resilient
// 路徑：/K線西遊記/temples/12345/modules/kgen-12345-holy-cup.js
// 規則：前端聖盃儀式改為「任意聖盃按鈕累積三次即通過」，不再卡 0/3；完成後明確提示可按 fortuneClaim。
(function(){
  'use strict';
  const KEY='kgen12345.holyCup.v1022';
  const $=id=>document.getElementById(id);
  function panel(){return $('kgen-heart-live-panel')||$('web3-panel');}
  function box(){const p=panel(); return p ? p.querySelector('.kh-cupbox') : null;}
  function get(){try{return JSON.parse(localStorage.getItem(KEY)||'{"count":0,"done":false}');}catch(_){return {count:0,done:false};}}
  function set(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch(_){}}
  function speak(msg){
    try{
      if(!('speechSynthesis' in window)) return;
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(String(msg||''));
      u.lang='zh-TW'; u.rate=1; u.pitch=1;
      speechSynthesis.speak(u);
    }catch(_){}
  }
  function log(msg){try{const l=$('kh-log')||$('bp-status'); if(l) l.textContent=String(msg||'');}catch(_){} }
  function ensureStyle(){
    if($('kgen-12345-holy-cup-v1022-style')) return;
    const st=document.createElement('style');
    st.id='kgen-12345-holy-cup-v1022-style';
    st.textContent=`
      .kh-cupbox,.kh-cupbox *{animation:none!important;transition:none!important;filter:none!important;text-shadow:none!important;}
      .kh-cupbox{min-height:118px!important;overflow:visible!important;}
      .kh-cup-title{display:flex!important;justify-content:space-between!important;gap:8px!important;color:#ffe39a!important;font-weight:900!important;margin-bottom:8px!important;}
      .kgen-v1011-cup-row{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:7px!important;margin-top:8px!important;}
      .kgen-v1011-cup-row button{min-height:42px!important;padding:8px 6px!important;border-radius:11px!important;border:1px solid rgba(255,215,120,.45)!important;background:rgba(0,0,0,.34)!important;color:#fff!important;font-weight:900!important;white-space:normal!important;}
      .kgen-v1011-cup-row button.done{background:linear-gradient(135deg,rgba(255,215,120,.72),rgba(0,242,255,.16))!important;color:#111!important;box-shadow:none!important;}
      .kgen-v1011-cup-status{animation:none!important;transition:none!important;opacity:1!important;filter:none!important;color:#ffe39a!important;line-height:1.55!important;min-height:46px!important;padding:8px 10px!important;border:1px solid rgba(255,215,120,.32)!important;border-radius:10px!important;background:rgba(0,0,0,.32)!important;white-space:normal!important;}
    `;
    document.head.appendChild(st);
  }
  function render(){
    ensureStyle();
    const b=box(); if(!b) return false;
    const s=get();
    const count=Math.max(0,Math.min(3,Number(s.count)||0));
    const done=!!s.done || count>=3;
    const need=Math.max(0,3-count);
    b.innerHTML=`
      <div class="kh-cup-title"><span>三次聖盃驗證</span><span>${done?'已通過，可領發財金':'還差 '+need+' 次'}</span></div>
      <div class="kgen-v1011-cup-row">
        <button type="button" data-cup="tap" class="${count>=1?'done':''}">${count>=1?'第一次完成':'按我請聖盃'}</button>
        <button type="button" data-cup="tap" class="${count>=2?'done':''}">${count>=2?'第二次完成':'再按一次'}</button>
        <button type="button" data-cup="tap" class="${count>=3?'done':''}">${count>=3?'第三次完成':'完成第三次'}</button>
        <button type="button" data-cup="reset">重置</button>
      </div>
      <div class="kgen-v1011-cup-status">${done?'聖盃狀態：已完成三次。現在可以按 fortuneClaim／領發財金；是否成功仍以 Heart 合約冷卻、名額、血庫與錢包交易為準。':'聖盃狀態：已完成 '+count+' 次，請再按 '+need+' 次。這裡不再判斷陰陽，避免前端卡住。'}</div>`;
    return true;
  }
  function tap(){
    const cur=get();
    let n=Math.max(0,Math.min(3,Number(cur.count)||0));
    n=Math.min(3,n+1);
    const done=n>=3;
    set({count:n,done,updatedAt:new Date().toISOString()});
    const msg=done?'三次聖盃已完成，可以按領發財金。':'聖盃已記錄，目前完成 '+n+' 次，請繼續。';
    log(msg); speak(msg); render();
  }
  function reset(){set({count:0,done:false,updatedAt:new Date().toISOString()}); log('三次聖盃已重置。'); speak('三次聖盃已重置，請重新按三次。'); render();}

  document.addEventListener('click',function(e){
    const btn=e.target&&e.target.closest?e.target.closest('.kh-cupbox button,[data-cup]'):null;
    if(!btn) return;
    const v=btn.getAttribute('data-cup')||'';
    if(v || btn.closest('.kh-cupbox')){
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      if(v==='reset' || /重置/.test(btn.textContent||'')) reset(); else tap();
      return false;
    }
  },true);

  function boot(){render();}
  window.KGEN12345_HOLY_CUP={version:'V10.22',render,get,set,tap,reset};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('load',boot);
  setTimeout(boot,300); setTimeout(boot,1000); setTimeout(boot,2500);
  // 舊 runtime 會重畫 0/3；這裡固定守住新版聖盃 UI。
  setInterval(render,1200);
})();
