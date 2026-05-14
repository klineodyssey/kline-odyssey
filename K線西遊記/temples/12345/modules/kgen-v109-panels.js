
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  function noVoice(){};
  function closeAllExcept(id){ ['kgen-v109-right-rule-panel','kgen-v102-festival-panel'].forEach(pid=>{if(pid!==id){const p=$(pid); if(p) p.classList.remove('kgen-v109-open');}}); }
  function ensureRightRule(){
    if($('kgen-v109-right-rule-panel')) return;
    const p=document.createElement('div'); p.id='kgen-v109-right-rule-panel';
    p.innerHTML='<div id="kgen-v109-right-rule-head"><span>右側神規｜Heart / Brain</span><button type="button" id="kgen-v109-right-rule-close">收合</button></div><div class="rule-card"><b>主流程</b><br>連接錢包 → Approve Heart → 三聖盃 → fortuneClaim 發財金。</div><div class="rule-card"><b>Heart V3.2.6</b><br>合約生命不修改；前端只負責顯示、提醒與按鈕接線。</div><div class="rule-card"><b>節日活動</b><br>5/20 悟空生日、11/11 孤勇日、12/31 跨年倒數，需符合合約時間與冷卻條件。</div><div class="rule-card"><b>注意</b><br>鏈上操作會跳錢包確認；本頁不會自動扣款。</div>';
    document.body.appendChild(p); $('kgen-v109-right-rule-close').onclick=()=>toggleRight(false);
  }
  function toggleRight(force){ ensureRightRule(); const p=$('kgen-v109-right-rule-panel'); const open=(force===undefined)?!p.classList.contains('kgen-v109-open'):!!force; closeAllExcept('kgen-v109-right-rule-panel'); p.classList.toggle('kgen-v109-open',open); }
  function ensureFestival(){
    const nav=$('universe-nav'); if(nav && !$('kgen-v109-festival-toggle')){ const b=document.createElement('div'); b.id='kgen-v109-festival-toggle'; b.className='nav-btn nav-help'; b.setAttribute('role','button'); b.textContent='節日活動｜5/20・11/11・12/31'; nav.appendChild(b); }
    const panel=$('kgen-v102-festival-panel');
    if(panel){ panel.classList.add('kgen-v109-festival-panel'); if(!$('kgen-v109-festival-head')){ const head=document.createElement('div'); head.id='kgen-v109-festival-head'; head.innerHTML='<span>節日活動</span><button type="button" id="kgen-v109-festival-close">收合</button>'; panel.insertBefore(head,panel.firstChild); $('kgen-v109-festival-close').onclick=()=>toggleFestival(false); } }
    const voice=$('kgen-v102-festival-voice'); if(voice){ voice.onclick=function(e){e.preventDefault();e.stopPropagation(); const st=$('bp-status')||$('kh-log'); if(st) st.textContent='節日活動：請確認日期、冷卻與合約條件後再執行。'; return false;}; }
  }
  function toggleFestival(force){ ensureFestival(); const p=$('kgen-v102-festival-panel'); if(!p) return; const open=(force===undefined)?!p.classList.contains('kgen-v109-open'):!!force; closeAllExcept('kgen-v102-festival-panel'); p.classList.toggle('kgen-v109-open',open); }
  function toggleHeart(force){ const p=$('web3-panel'); if(!p) return; const open=(force===undefined)?p.classList.contains('v109-collapsed'):!!force; p.classList.toggle('v109-collapsed',!open); if(open && window.KGEN_V109_CUP) window.KGEN_V109_CUP.ensure(); }
  function bind(){ ensureRightRule(); ensureFestival(); }
  window.KGEN_V109_PANELS={toggleRight,toggleFestival,toggleHeart};
  window.addEventListener('click',function(e){
    const el=e.target; const b=el&&el.closest&&el.closest('button,.term-btn,a,#kgen-v109-festival-toggle,.nav-btn,[role="button"]'); if(!b) return;
    const t=(b.textContent||'').replace(/\s+/g,'');
    if(t.includes('右側神規')||t.includes('右神神規')||t==='神規'||t.includes('Heart/Brain')){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation&&e.stopImmediatePropagation();toggleRight();return false;}
    if(t.includes('節日活動')||t.includes('5/20・11/11・12/31')){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation&&e.stopImmediatePropagation();toggleFestival();return false;}
    if(t.includes('悟空心臟')||t.includes('心臟操作窗')){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation&&e.stopImmediatePropagation();toggleHeart();return false;}
  },true);
  document.addEventListener('DOMContentLoaded',bind); if(document.readyState!=='loading') bind(); setInterval(bind,2000);
})();
