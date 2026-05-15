
// KGEN 12345 V10.21 holy cup humanized
// 路徑：/K線西遊記/temples/12345/modules/kgen-12345-holy-cup.js
// 規則：取消 0/3 視覺干擾；聖盃做成人性化前端引導：任意按三次完成儀式；真正領取仍由 Heart 合約 fortuneClaim 控制。
(function(){
  'use strict';
  const KEY='kgen12345.v1011.holyCup.simple';
  const $=id=>document.getElementById(id);
  function panel(){return $('kgen-heart-live-panel');}
  function get(){try{return JSON.parse(localStorage.getItem(KEY)||'{"count":0,"done":false}');}catch(_){return {count:0,done:false};}}
  function set(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch(_){}}
  function log(msg){try{const l=$('kh-log'); if(l) l.textContent=String(msg||'');}catch(_){} }
  function ensureStyle(){
    if(document.getElementById('kgen-12345-holy-cup-v1021-style')) return;
    const st=document.createElement('style');
    st.id='kgen-12345-holy-cup-v1021-style';
    st.textContent='.kgen-v1011-cup-status{animation:none!important;transition:none!important;opacity:1!important;filter:none!important;color:#ffe39a!important;line-height:1.45!important;min-height:42px!important;padding:8px 10px!important;border:1px solid rgba(255,215,120,.28)!important;border-radius:10px!important;background:rgba(0,0,0,.28)!important}.kgen-v1011-cup-row button{animation:none!important}.kh-cup-title{animation:none!important}';
    document.head.appendChild(st);
  }
  function render(){
    const p=panel(); if(!p)return;
    let box=p.querySelector('.kh-cupbox'); if(!box)return;
    const s=get();
    const count=Math.max(0,Math.min(3,Number(s.count)||0));
    const done=!!s.done || count>=3;
    ensureStyle();
    const need = Math.max(0, 3-count);
    box.innerHTML=`
      <div class="kh-cup-title"><span>三次聖盃驗證</span><span>${done?'已通過':'還差 '+need+' 次'}</span></div>
      <div class="kgen-v1011-cup-row">
        <button type="button" data-cup="1" class="${count>=1?'done':''}">${count>=1?'第一盃已完成':'按我擲聖盃'}</button>
        <button type="button" data-cup="2" class="${count>=2?'done':''}">${count>=2?'第二盃已完成':'再按一次'}</button>
        <button type="button" data-cup="3" class="${count>=3?'done':''}">${count>=3?'第三盃已完成':'完成第三次'}</button>
        <button type="button" data-cup="reset">重置儀式</button>
      </div>
      <div class="kgen-v1011-cup-status">${done?'聖盃狀態：三次儀式已完成。可以按「領發財金」，但最終是否成功仍以 Heart 合約 fortuneClaim 的冷卻、名額與血庫規則為準。':'聖盃狀態：已完成 '+count+' / 3。任意按聖盃按鈕累積到三次即可通過，不需要判斷陰陽，避免前端造成操作困擾。'}</div>`;
    box.querySelectorAll('button[data-cup]').forEach(b=>{
      b.addEventListener('click',function(e){
        e.preventDefault();e.stopPropagation();
        const v=this.dataset.cup;
        if(v==='reset'){set({count:0,done:false});log('三次聖盃已重置，請重新按三次。');render();return;}
        const cur=get();
        let n=Math.max(0,Math.min(3,Number(cur.count)||0));
        n=Math.min(3,n+1);
        set({count:n,done:n>=3,updatedAt:new Date().toISOString()});
        log(n>=3?'三次聖盃已通過，可以按領發財金。':'聖盃已記錄，目前完成 '+n+' / 3。');
        render();
      },true);
    });
  }
  window.KGEN12345_V1011_CUP={render,get,set};
  document.addEventListener('DOMContentLoaded',render); if(document.readyState!=='loading') render(); setTimeout(render,800); setTimeout(render,2200);
})();
