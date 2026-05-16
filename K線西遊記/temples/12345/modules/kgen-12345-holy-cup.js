// KGEN 12345 V10.36 Holy Cup + Amount Stable Runtime
// 規則：三聖盃只管資格；金額欄由操作者自行輸入，不自動填 8；不重繪輸入框；不把心跳/呼吸當跨年。
(function(){
  'use strict';
  const KEY='kgen12345.holyCup.v1036';
  function $(id){return document.getElementById(id)}
  function qsa(s){return Array.prototype.slice.call(document.querySelectorAll(s))}
  function get(){try{return JSON.parse(localStorage.getItem(KEY)||'null')||{count:0,done:false}}catch(_){return {count:0,done:false}}}
  function set(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(_){}}
  function speak(m){try{ if(window.app&&typeof app.speak==='function') return app.speak(m); if('speechSynthesis'in window){speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(String(m)); u.lang='zh-TW'; speechSynthesis.speak(u)}}catch(_){}}
  function log(m){['kh-log','bp-status','last-event','kgen-log'].forEach(id=>{const el=$(id); if(el) el.textContent=m})}
  function ensureStyle(){
    if($('kgen-12345-holy-cup-v1036-style')) return;
    const st=document.createElement('style'); st.id='kgen-12345-holy-cup-v1036-style';
    st.textContent=`
      .kgen-cup-final{margin:10px 0!important;padding:12px!important;border:1px solid rgba(255,215,120,.45)!important;border-radius:14px!important;background:rgba(255,215,120,.075)!important;color:#fff!important;animation:none!important;}
      .kgen-cup-final *{animation:none!important;transition:none!important;}
      .kgen-cup-final-title{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:8px!important;color:#ffe39a!important;font-weight:900!important;margin-bottom:9px!important;}
      .kgen-cup-final-title .ok{color:#7fffd4!important;}
      .kgen-cup-final-row{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;margin-top:8px!important;}
      .kgen-cup-final-row button{min-height:44px!important;padding:8px 6px!important;border-radius:12px!important;border:1px solid rgba(255,215,120,.45)!important;background:rgba(0,0,0,.38)!important;color:#fff!important;font-weight:900!important;white-space:normal!important;}
      .kgen-cup-final-row button.done{background:linear-gradient(135deg,rgba(255,215,120,.78),rgba(0,242,255,.22))!important;color:#111!important;box-shadow:none!important;}
      .kgen-cup-final-status,.kgen-amount-hint{margin-top:8px!important;padding:9px 10px!important;border:1px solid rgba(255,215,120,.30)!important;border-radius:10px!important;background:rgba(0,0,0,.36)!important;color:#ffe39a!important;line-height:1.55!important;min-height:36px!important;white-space:normal!important;overflow:visible!important;opacity:1!important;}
      .kgen-v1036-amount-box{margin-top:10px!important;display:grid!important;gap:6px!important;}
      .kgen-v1036-amount-box input{width:100%!important;box-sizing:border-box!important;padding:10px!important;border-radius:10px!important;border:1px solid rgba(255,215,120,.35)!important;background:#050505!important;color:#fff!important;font-weight:900!important;}
    `; document.head.appendChild(st);
  }
  function fields(){return qsa('#kgen-12345-amount-input,#amt-in,#fortune-amount,#kh-amount,input[data-kgen-amount]')}
  function getAmount(){const f=$('kgen-12345-amount-input')||$('amt-in')||fields()[0]; return f?String(f.value||'').trim():''}
  function syncFrom(src){const v=src?String(src.value||''):''; fields().forEach(f=>{if(f!==src && f.value!==v)f.value=v}); try{localStorage.setItem('kgen12345.sharedAmount',v)}catch(_){}}
  function bindAmount(){
    fields().forEach(f=>{
      f.removeAttribute('value');
      if(!f.getAttribute('placeholder')) f.setAttribute('placeholder','輸入 KGEN 數量，由操作者自行填寫');
      if(!f.__kgenAmountBound){ f.__kgenAmountBound=true; f.addEventListener('input',()=>syncFrom(f)); f.addEventListener('focus',()=>{try{f.select()}catch(_){}}); }
    });
  }
  function containers(){const arr=[]; ['kh-cupbox','v714-cupbox'].forEach(id=>{const el=$(id); if(el)arr.push(el)}); qsa('.kh-cupbox').forEach(el=>{if(arr.indexOf(el)<0)arr.push(el)}); return arr}
  function ensureBox(){
    let list=containers();
    if(!list.length){
      const host=$('web3-panel')||document.body; const box=document.createElement('div'); box.id='kh-cupbox'; box.className='kh-cupbox'; host.appendChild(box); list=[box];
    }
    return list;
  }
  function render(){
    ensureStyle(); bindAmount();
    const s=get(), count=Math.max(0,Math.min(3,Number(s.count)||0)), done=!!s.done||count>=3, need=Math.max(0,3-count);
    const status=done?'聖盃狀態：三次已完成。可按「領發財金 fortuneClaim」。金額請由操作者自行輸入；前端不自動填數字。':'聖盃狀態：已完成 '+count+' 次，還差 '+need+' 次。請按滿三次。';
    const current=getAmount();
    const html=`<div class="kgen-cup-final">
      <div class="kgen-cup-final-title"><span>三次聖盃驗證</span><span class="${done?'ok':''}">${done?'已通過，可領發財金':'還差 '+need+' 次'}</span></div>
      <div class="kgen-cup-final-row">
        <button type="button" data-cup="tap" class="${count>=1?'done':''}">${count>=1?'第一次完成':'按我擲聖盃'}</button>
        <button type="button" data-cup="tap" class="${count>=2?'done':''}">${count>=2?'第二次完成':'再按一次'}</button>
        <button type="button" data-cup="tap" class="${count>=3?'done':''}">${count>=3?'第三次完成':'完成第三次'}</button>
        <button type="button" data-cup="reset">重置</button>
      </div>
      <div class="kgen-cup-final-status">${status}</div>
      <div class="kgen-v1036-amount-box">
        <label for="kgen-12345-amount-input">KGEN 金額輸入</label>
        <input id="kgen-12345-amount-input" class="kgen-amount-input" type="number" min="0" step="any" inputmode="decimal" placeholder="例如 8、88、888，由操作者自行輸入" value="${current.replace(/"/g,'&quot;')}">
        <div class="kgen-amount-hint">這是全神殿共用金額：Approve、發財金、還願、點燈讀這一格。系統不自動補 8，也不擅自改數字。</div>
      </div>
    </div>`;
    ensureBox().forEach(el=>{ if(!el.querySelector('input:focus')) el.innerHTML=html; });
    bindAmount();
  }
  function tap(){const cur=get(); let n=Math.max(0,Math.min(3,Number(cur.count)||0)); n=Math.min(3,n+1); const done=n>=3; set({count:n,done,updatedAt:new Date().toISOString()}); const msg=done?'三次聖盃完成，可以按 fortuneClaim 領發財金。':'聖盃已記錄，目前完成 '+n+' 次。'; log(msg); speak(msg); render()}
  function reset(){set({count:0,done:false,updatedAt:new Date().toISOString()}); log('三次聖盃已重置。'); speak('三次聖盃已重置。'); render()}
  document.addEventListener('click',function(e){const btn=e.target&&e.target.closest?e.target.closest('[data-cup],.v714-cup,.kh-cupbox button,#v714-cupbox button'):null; if(!btn)return; if(btn.getAttribute('data-cup')==='reset'||/重置/.test(btn.textContent||'')){e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); reset(); return false;} if(btn.closest('.kh-cupbox')||btn.closest('#v714-cupbox')||btn.hasAttribute('data-cup')){e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); tap(); return false;}},true);
  function boot(){render();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot); else boot(); window.addEventListener('load',boot); setTimeout(boot,300); setTimeout(boot,1200); setInterval(()=>{bindAmount();},2000);
  window.KGEN12345_HOLY_CUP={version:'V10.36',render,get,set,tap,reset,getAmount};
  window.KGEN12345_AMOUNT={get:getAmount,sync:bindAmount};
})();
