// KGEN 12345 MASTER STABLE V10.31 holy cup amount sync
// 路徑：/K線西遊記/temples/12345/modules/kgen-12345-holy-cup.js
// BASE_FROM: V10.22 + V10.12 rotation master
// 規則：三聖盃不再重繪輸入框；金額由操作者自行輸入；跨年資訊不隱藏、不閃爍。
(function(){
  'use strict';
  const KEY='kgen12345.holyCup.v1024';
  const $=id=>document.getElementById(id);
  const qsa=s=>Array.prototype.slice.call(document.querySelectorAll(s));
  function get(){
    try{
      const a=JSON.parse(localStorage.getItem(KEY)||'null');
      if(a) return a;
      const old=JSON.parse(localStorage.getItem('kgen12345.holyCup.v1022')||'null');
      if(old) return old;
    }catch(_){}
    return {count:0,done:false};
  }
  function set(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch(_){} }
  function speak(msg){
    try{ if(!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(String(msg||'')); u.lang='zh-TW'; u.rate=1; speechSynthesis.speak(u); }catch(_){}
  }
  function log(msg){
    ['kh-log','bp-status','last-event','kgen-log'].forEach(id=>{const el=$(id); if(el) el.textContent=String(msg||'');});
  }
  function nextNYText(){
    const now=new Date(); let y=now.getUTCFullYear(); let t=new Date(Date.UTC(y,11,31,23,50,0)); if(t-now<=0)t=new Date(Date.UTC(y+1,11,31,23,50,0));
    const diff=Math.max(0,t-now), m=Math.floor(diff/60000), d=Math.floor(m/1440), h=Math.floor((m%1440)/60), mm=m%60;
    return '12/31 跨年倒數 newYearCountdownClaim：距離活動約 '+d+'天 '+String(h).padStart(2,'0')+'時 '+String(mm).padStart(2,'0')+'分。';
  }
  function ensureStyle(){
    if($('kgen-12345-holy-cup-v1023-style')) return;
    const st=document.createElement('style'); st.id='kgen-12345-holy-cup-v1023-style';
    st.textContent=`
      .kh-cupbox,#kh-cupbox,#v714-cupbox,#v917-cup-result{display:block!important;visibility:visible!important;opacity:1!important;overflow:visible!important;animation:none!important;transition:none!important;filter:none!important;}
      .kh-cupbox * ,#kh-cupbox * ,#v714-cupbox *{animation:none!important;transition:none!important;filter:none!important;text-shadow:none!important;}
      .kgen-cup-final{margin:10px 0!important;padding:12px!important;border:1px solid rgba(255,215,120,.45)!important;border-radius:14px!important;background:rgba(255,215,120,.075)!important;color:#fff!important;}
      .kgen-cup-final-title{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:8px!important;color:#ffe39a!important;font-weight:900!important;margin-bottom:9px!important;}
      .kgen-cup-final-title .ok{color:#7fffd4!important;}
      .kgen-cup-final-row{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;margin-top:8px!important;}
      .kgen-cup-final-row button{min-height:44px!important;padding:8px 6px!important;border-radius:12px!important;border:1px solid rgba(255,215,120,.45)!important;background:rgba(0,0,0,.38)!important;color:#fff!important;font-weight:900!important;white-space:normal!important;}
      .kgen-cup-final-row button.done{background:linear-gradient(135deg,rgba(255,215,120,.78),rgba(0,242,255,.22))!important;color:#111!important;box-shadow:none!important;}
      .kgen-cup-final-status,.kgen-cup-final-ny{margin-top:8px!important;padding:9px 10px!important;border:1px solid rgba(255,215,120,.30)!important;border-radius:10px!important;background:rgba(0,0,0,.36)!important;color:#ffe39a!important;line-height:1.55!important;min-height:36px!important;white-space:normal!important;overflow:visible!important;opacity:1!important;}
      .kgen-cup-final-ny{color:#9ff!important;border-color:rgba(0,242,255,.28)!important;}
      #kh-ny-slot,.kh-ny-countdown,#kgen-v102-festival-countdown,[data-kgen-countdown],#cd-1231{display:block!important;visibility:visible!important;opacity:1!important;animation:none!important;transition:none!important;filter:none!important;white-space:normal!important;overflow:visible!important;color:#9ff!important;}
    `;
    document.head.appendChild(st);
  }
  function containers(){
    const arr=[];
    ['kh-cupbox','v714-cupbox'].forEach(id=>{const el=$(id); if(el) arr.push(el);});
    qsa('.kh-cupbox').forEach(el=>{if(arr.indexOf(el)<0)arr.push(el);});
    return arr;
  }
  function markup(){
    const s=get(); const count=Math.max(0,Math.min(3,Number(s.count)||0)); const done=!!s.done||count>=3; const need=Math.max(0,3-count);
    const status=done
      ? '聖盃狀態：三次已完成。可按「領發財金 fortuneClaim」，將使用下方共用 KGEN 數量；鏈上仍會檢查冷卻、名額與 Heart 血庫。'
      : '聖盃狀態：已完成 '+count+' 次，還差 '+need+' 次。請按滿三次，完成後才能啟動領發財金按鈕。';
    return `<div class="kgen-cup-final">
      <div class="kgen-cup-final-title"><span>三次聖盃驗證</span><span class="${done?'ok':''}">${done?'已通過，可領發財金':'還差 '+need+' 次'}</span></div>
      <div class="kgen-cup-final-row">
        <button type="button" data-cup="tap" class="${count>=1?'done':''}">${count>=1?'第一次完成':'按我擲聖盃'}</button>
        <button type="button" data-cup="tap" class="${count>=2?'done':''}">${count>=2?'第二次完成':'再按一次'}</button>
        <button type="button" data-cup="tap" class="${count>=3?'done':''}">${count>=3?'第三次完成':'完成第三次'}</button>
        <button type="button" data-cup="reset">重置</button>
      </div>
      <div class="kgen-cup-final-status">${status}</div>
      <div class="kgen-v1024-amount-box">
        <label for="kgen-12345-amount-input">輸入 KGEN 數量</label>
        <input id="kgen-12345-amount-input" class="kgen-amount-input" type="number" min="1" max="888" step="1" value="" inputmode="decimal" placeholder="由操作者輸入，例如 8、88、888">
        <div class="hint">這是全神殿共用金額：Approve 授權、fortuneClaim 發財金、vowTo 還願、lightLamp 點燈都讀這一格。發財金建議 1～888。</div>
      </div>
      <div class="kgen-cup-final-ny" data-kgen-countdown>${nextNYText()}</div>
    </div>`;
  }
  function render(){
    ensureStyle();
    const active=document.activeElement;
    const isAmountActive=active && (active.id==='kgen-12345-amount-input' || active.matches?.('input[data-kgen-amount],.kgen-amount-input,#amt-in,#kh-amount'));
    const currentValue=isAmountActive ? active.value : '';
    const html=markup();
    containers().forEach(el=>{
      // 金額輸入中不重繪整個聖盃區，避免手機鍵盤彈出後被重建、跳開、閃爍。
      if(isAmountActive && el.contains(active)) return;
      if(el.innerHTML!==html) el.innerHTML=html;
    });
    if(isAmountActive){ try{active.value=currentValue;}catch(_){} }
    updateNY();
  }
  function updateNY(){
    const t=nextNYText();
    qsa('[data-kgen-countdown],.kh-ny-countdown,#kh-ny-slot,#kgen-v102-festival-countdown,#cd-1231').forEach(el=>{ if(el && el.textContent!==t) el.textContent=t; });
  }
  function tap(){ const cur=get(); let n=Math.max(0,Math.min(3,Number(cur.count)||0)); n=Math.min(3,n+1); const done=n>=3; set({count:n,done,updatedAt:new Date().toISOString()}); const msg=done?'三次聖盃完成，可以按 fortuneClaim 領發財金。':'聖盃已記錄，目前完成 '+n+' 次。'; log(msg); speak(msg); render(); }
  function reset(){ set({count:0,done:false,updatedAt:new Date().toISOString()}); log('三次聖盃已重置。'); speak('三次聖盃已重置，請重新按三次。'); render(); }
  document.addEventListener('click',function(e){ const btn=e.target&&e.target.closest?e.target.closest('[data-cup],.v714-cup,.kh-cupbox button,#v714-cupbox button'):null; if(!btn) return; if(btn.getAttribute('data-cup')==='reset'||/重置/.test(btn.textContent||'')){e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); reset(); return false;} if(btn.closest('.kh-cupbox')||btn.closest('#v714-cupbox')||btn.hasAttribute('data-cup')){e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); tap(); return false;} },true);
  function boot(){render();}
  window.KGEN12345_HOLY_CUP={version:'V10.31_MASTER_STABLE_LOCK',render,get,set,tap,reset};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('load',boot); setTimeout(boot,300); setTimeout(boot,1000); setInterval(updateNY,60000);
})();


/* V10.24 amount input sync: keep legacy amount fields synchronized with the shared amount box. */
(function(){
  function $(id){return document.getElementById(id)}
  function fields(){return Array.prototype.slice.call(document.querySelectorAll('#kgen-12345-amount-input,#amt-in,#fortune-amount,#kh-amount,input[data-kgen-amount]'));}
  function syncFrom(el){
    const v=el&&el.value?String(el.value):'';
    fields().forEach(f=>{if(f!==el) f.value=v;});
    try{if(v){localStorage.setItem('kgen12345.sharedAmount',v)}else{localStorage.removeItem('kgen12345.sharedAmount')}}catch(_){}
  }
  function boot(){
    fields().forEach(f=>{
      // 金額欄屬於操作者，系統不得自動塞 8 或任何預設值。
      f.removeAttribute('value');
      if(!f.dataset.kgenAmountBound){
        f.dataset.kgenAmountBound='1';
        f.addEventListener('input',function(){syncFrom(f)},{passive:true});
        ['pointerdown','mousedown','touchstart','click','focus','keydown','keyup'].forEach(ev=>{
          f.addEventListener(ev,function(e){e.stopPropagation();},true);
        });
      }
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot); else boot();
  setInterval(boot,5000);
  window.KGEN12345_AMOUNT={get:function(){const f=$('kgen-12345-amount-input')||$('amt-in'); return f&&f.value?f.value:'';},sync:boot};
})();
