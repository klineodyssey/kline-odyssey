
// KGEN 12345 V10.20 holy cup simple
// 路徑：/K線西遊記/temples/12345/modules/kgen-12345-holy-cup.js
// 規則：取消 0/3 視覺干擾；按三次聖盃即前端通過，可領發財金。這不改合約，只是前端儀式 gate。
(function(){
  'use strict';
  const KEY='kgen12345.v1011.holyCup.simple';
  const $=id=>document.getElementById(id);
  function panel(){return $('kgen-heart-live-panel');}
  function get(){try{return JSON.parse(localStorage.getItem(KEY)||'{"count":0,"done":false}');}catch(_){return {count:0,done:false};}}
  function set(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch(_){}}
  function log(msg){try{const l=$('kh-log'); if(l) l.textContent=String(msg||'');}catch(_){} }
  function render(){
    const p=panel(); if(!p)return;
    let box=p.querySelector('.kh-cupbox'); if(!box)return;
    const s=get();
    const count=Math.max(0,Math.min(3,Number(s.count)||0));
    const done=!!s.done || count>=3;
    box.innerHTML=`
      <div class="kh-cup-title"><span>三次聖盃驗證</span><span>${done?'已通過':'按三次通過'}</span></div>
      <div class="kgen-v1011-cup-row">
        <button type="button" data-cup="1" class="${count>=1?'done':''}">聖盃一<br>${count>=1?'已過':'請按'}</button>
        <button type="button" data-cup="2" class="${count>=2?'done':''}">聖盃二<br>${count>=2?'已過':'請按'}</button>
        <button type="button" data-cup="3" class="${count>=3?'done':''}">聖盃三<br>${count>=3?'已過':'請按'}</button>
        <button type="button" data-cup="reset">重置</button>
      </div>
      <div class="kgen-v1011-cup-status">聖盃狀態：${done?'已完成，可進行 fortuneClaim 發財金。':'未完成，請依序按滿三次聖盃。'}</div>`;
    box.querySelectorAll('button[data-cup]').forEach(b=>{
      b.addEventListener('click',function(e){
        e.preventDefault();e.stopPropagation();
        const v=this.dataset.cup;
        if(v==='reset'){set({count:0,done:false});log('三聖盃已重置。');render();return;}
        const cur=get();
        let n=Math.max(0,Math.min(3,Number(cur.count)||0));
        n=Math.min(3,n+1);
        set({count:n,done:n>=3,updatedAt:new Date().toISOString()});
        log(n>=3?'三聖盃已通過，可以進行發財金。':'聖盃已記錄，請繼續按滿三次。');
        render();
      },true);
    });
  }
  window.KGEN12345_V1011_CUP={render,get,set};
  document.addEventListener('DOMContentLoaded',render); if(document.readyState!=='loading') render(); setTimeout(render,800); setTimeout(render,2200);
})();
