
// KGEN 12345 V10.24 panel router
// 路徑：/K線西遊記/temples/12345/modules/kgen-12345-v10.11-panel-router.js
// 原則：只控制原本 #coord-panel 與 #kgen-heart-live-panel，不新增第二個神規小面板。
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const norm=s=>String(s||'').replace(/\s+/g,'').trim();
  function log(msg){try{const l=$('kh-log'); if(l) l.textContent=String(msg||'');}catch(_){}; try{console.log('[KGEN V10.11]',msg);}catch(_){} }
  function rightPanel(){return $('coord-panel')||document.querySelector('.coord-panel');}
  function heartPanel(){return $('kgen-heart-live-panel')||$('web3-panel');}
  function isVisible(el){if(!el)return false; const cs=getComputedStyle(el); return cs.display!=='none'&&cs.visibility!=='hidden'&&el.offsetParent!==null;}
  function matchRightSizeToHeart(){
    const rp=rightPanel(), hp=heartPanel();
    if(!rp || !hp) return;
    try{
      const cs=getComputedStyle(hp);
      // Match the right-side rule panel to the Wukong Heart panel size, but keep right-side placement.
      rp.style.width = cs.width || 'min(390px, calc(100vw - 28px))';
      rp.style.maxHeight = cs.maxHeight && cs.maxHeight !== 'none' ? cs.maxHeight : 'calc(100vh - 180px)';
      rp.style.minHeight = '220px';
      rp.style.overflow = 'auto';
      rp.style.boxSizing = 'border-box';
    }catch(_){
      rp.style.width = 'min(390px, calc(100vw - 28px))';
      rp.style.maxHeight = 'calc(100vh - 180px)';
      rp.style.minHeight = '220px';
      rp.style.overflow = 'auto';
    }
  }
  function ensureRightClose(){
    const p=rightPanel(); if(!p)return;
    let title=p.querySelector('.cp-title')||p.firstElementChild||p;
    if(!$('kgen-v1011-right-close')){
      const b=document.createElement('button'); b.id='kgen-v1011-right-close'; b.type='button'; b.className='kgen-v1011-panel-close'; b.textContent='收合';
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setRight(false);},true);
      title.appendChild(b);
    }
  }
  function setRight(open){
    const p=rightPanel(); if(!p){log('找不到右側神規區塊 #coord-panel'); return;}
    ensureRightClose();
    if(open) matchRightSizeToHeart();
    p.style.display=open?'block':'none'; p.style.visibility=open?'visible':'hidden'; p.style.pointerEvents=open?'auto':'none';
    p.setAttribute('data-kgen-v1011-open', open?'1':'0');
    document.body.classList.toggle('kgen-v1011-right-open',!!open);
    log(open?'右側神規已展開':'右側神規已收合');
  }
  function toggleRight(){const p=rightPanel(); setRight(!(p&&p.getAttribute('data-kgen-v1011-open')==='1'&&isVisible(p)));}
  function setHeart(open){
    const p=heartPanel(); if(!p){log('找不到悟空心臟區塊'); return;}
    p.style.display=open?'block':'none'; p.style.visibility=open?'visible':'hidden'; p.style.pointerEvents=open?'auto':'none';
    p.setAttribute('data-kgen-v1011-open',open?'1':'0');
    log(open?'悟空心臟已展開':'悟空心臟已收合');
  }
  function toggleHeart(){const p=heartPanel(); setHeart(!(p&&p.getAttribute('data-kgen-v1011-open')==='1'&&isVisible(p)));}
  function festivalPanel(){return $('kgen-v102-festival-panel');}
  function ensureFestivalClose(){
    const p=festivalPanel(); if(!p)return;
    if(!$('kgen-v1011-festival-head')){
      const h=document.createElement('div'); h.id='kgen-v1011-festival-head'; h.className='kgen-v1011-festival-head';
      h.innerHTML='<span>節日活動｜5/20・11/11・12/31</span><button type="button" id="kgen-v1011-festival-close" class="kgen-v1011-panel-close">收合</button>';
      p.insertBefore(h,p.firstChild);
      $('kgen-v1011-festival-close').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setFestival(false);},true);
    }
    const voice=$('kgen-v102-festival-voice');
    if(voice){
      voice.onclick=null;
      voice.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();log('節日活動規則：5/20、11/11、12/31 依 Heart V3.2.6 合約時間與冷卻操作。'); return false;},true);
    }
  }
  function setFestival(open){
    const p=festivalPanel(); if(!p){log('找不到節日活動面板');return;}
    ensureFestivalClose();
    document.body.classList.toggle('kgen-v1011-festival-open',!!open);
    p.classList.toggle('kgen-v102-collapsed',!open);
    p.style.display=open?'block':'none'; p.style.visibility=open?'visible':'hidden'; p.style.pointerEvents=open?'auto':'none';
    p.setAttribute('data-kgen-v1011-open',open?'1':'0');
    log(open?'節日活動已展開':'節日活動已收合');
  }
  function toggleFestival(){const p=festivalPanel(); setFestival(!(p&&p.getAttribute('data-kgen-v1011-open')==='1'&&isVisible(p)));}
  function replaceButton(btn, label, handler){
    if(!btn || btn.dataset.kgenV1011Bound==='1') return btn;
    const nb=btn.cloneNode(true);
    nb.removeAttribute('onclick'); nb.dataset.kgenV1011Bound='1'; nb.innerHTML=label;
    nb.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation&&e.stopImmediatePropagation();handler();return false;},true);
    btn.parentNode.replaceChild(nb,btn); return nb;
  }
  function footerButtons(){return Array.from(document.querySelectorAll('.footer-terminal .term-btn,.footer-terminal button,button.term-btn'));}
  function bindFooter(){
    const btns=footerButtons();
    let heart=btns.find(b=>/悟空心臟|心臟/.test(norm(b.textContent)));
    let rule=btns.find(b=>/右側神規|右神神規|神規/.test(norm(b.textContent)));
    if(!heart && btns.length>=8) heart=btns[4];
    if(!rule && btns.length>=8) rule=btns[7];
    replaceButton(heart,'🫀<br>悟空心臟',toggleHeart);
    replaceButton(rule,'🛡<br>右側神規',toggleRight);
    const nav=document.getElementById('universe-nav');
    if(nav){
      let f=$('kgen-v1011-festival-toggle');
      if(!f){
        f=document.createElement('button'); f.id='kgen-v1011-festival-toggle'; f.type='button'; f.className='nav-btn nav-help'; f.textContent='節日活動｜5/20・11/11・12/31';
        nav.appendChild(f);
      }
      if(f.dataset.kgenV1011Bound!=='1'){
        f.dataset.kgenV1011Bound='1'; f.onclick=null;
        f.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation&&e.stopImmediatePropagation();toggleFestival();return false;},true);
      }
    }
    const oldHeartToggle=$('kgen-heart-toggle'); if(oldHeartToggle && oldHeartToggle.dataset.kgenV1011Bound!=='1'){
      oldHeartToggle.dataset.kgenV1011Bound='1'; oldHeartToggle.onclick=null; oldHeartToggle.addEventListener('click',e=>{e.preventDefault();toggleHeart();},true);
    }
  }


  /* V10.23 客服導覽修復：按鈕必須有答案與語音，不再只打開空面板 */
  function speakGuide(msg){
    try{
      if(window.app && typeof window.app.speak==='function') return window.app.speak(msg);
      if(!('speechSynthesis' in window)) return;
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(String(msg||'')); u.lang='zh-TW'; u.rate=1; speechSynthesis.speak(u);
    }catch(_){}
  }
  const GUIDE_ANSWERS={
    intro:'這裡是五指山一二三四五悟空財神殿客服導覽。這是 TempleHeart V3.2.6 前端控制神殿，不是廣寒宮，也不是月老系統。',
    rules:'主流程是連接錢包，Approve Heart，完成三次聖盃，再按 fortuneClaim 領發財金。真正交易是否成功，以鏈上 Heart 合約規則為準。',
    wallet:'請先連接錢包並切換 BSC。畫面會讀取 BNB、KGEN、Allowance 與 Heart 血庫。',
    approve:'Approve 是授權 Heart 合約使用你的 KGEN。領發財金通常不用先付款，但還願、點燈等轉出 KGEN 的動作需要授權。',
    playbook:'完整玩法是領福緣、創造、還願補血，讓 Heart 和 Brain 形成循環。發財金、心跳、呼吸、還願、點燈、許願各自對應不同鏈上動作。',
    qa:'你可以問：發財金怎麼領、為什麼要三次聖盃、五二零活動、十一月十一活動、跨年倒數活動、Heart 和 Brain 怎麼循環。'
  };
  function answerQuestion(q){
    q=String(q||'').trim();
    let ans='你可以問：發財金怎麼領、為什麼要三次聖盃、五二零活動、十一月十一活動、跨年活動、Approve 是什麼。';
    if(/12345|是什麼|神殿/.test(q)) ans=GUIDE_ANSWERS.intro;
    else if(/發財金|fortune/i.test(q)) ans='發財金使用 fortuneClaim，一次輸入一到八百八十八整數。前端需完成三次聖盃；鏈上仍會檢查冷卻、名額與血庫。';
    else if(/聖盃/.test(q)) ans='三次聖盃已改成人性化前端 gate：任意按聖盃按鈕累積三次即通過，不再判斷陰陽，避免操作卡住。';
    else if(/Approve|授權/i.test(q)) ans=GUIDE_ANSWERS.approve;
    else if(/5\/20|520|五二零|悟空生日/.test(q)) ans='五二零是悟空生日活動，對應 festivalClaim(1)。只有合約允許的時間與條件成立時才會成功。';
    else if(/11\/11|1111|十一月十一|孤勇/.test(q)) ans='十一月十一日是孤勇日活動，對應 festivalClaim(2)。';
    else if(/12\/31|1231|跨年|倒數/.test(q)) ans='跨年倒數活動對應 newYearCountdownClaim。畫面只顯示清楚倒數，是否可領仍以合約條件為準。';
    const qbox=$('qa-last'), abox=$('qa-last-a');
    if(qbox) qbox.textContent='Q: '+q;
    if(abox) abox.textContent='A: '+ans;
    log(ans); speakGuide(ans);
  }
  function bindGuideButtons(){
    document.addEventListener('click',function(e){
      const tab=e.target&&e.target.closest?e.target.closest('.guide-tab,[data-sec]'):null;
      if(tab && tab.getAttribute('data-sec')){
        const sec=tab.getAttribute('data-sec');
        const ans=GUIDE_ANSWERS[sec]||GUIDE_ANSWERS.intro;
        const body=$('guide-body')||$('temple-guide-body')||$('qa-last-a');
        if(body && !/qa-last-a/.test(body.id||'')) body.innerHTML='<h3>'+tab.textContent.trim()+'</h3><p>'+ans+'</p>';
        log(ans); speakGuide(ans);
      }
      const qb=e.target&&e.target.closest?e.target.closest('.qa-btn,[data-q]'):null;
      if(qb){
        const q=qb.getAttribute('data-q')||qb.textContent||'';
        if(qb.id==='btn-voice-qa') return;
        e.preventDefault(); e.stopPropagation(); answerQuestion(q); return false;
      }
    },true);
  }

  function init(){ensureRightClose();ensureFestivalClose();bindFooter();bindGuideButtons(); setFestival(false);}
  window.KGEN12345_V1011_PANELS={setRight,toggleRight,setHeart,toggleHeart,setFestival,toggleFestival};
  document.addEventListener('DOMContentLoaded',init); if(document.readyState!=='loading') init(); setTimeout(init,500); setTimeout(init,1800); setInterval(bindFooter,2500);
})();


/* =========================================================
   KGEN 12345 V10.24 RIGHT DRAWER STRUCTURE
   - Right 神規 panel close button fixed at header top-right.
   - Size follows Wukong Heart panel; content scrolls internally.
========================================================= */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  function right(){return $('coord-panel')||document.querySelector('.coord-panel');}
  function heart(){return $('kgen-heart-live-panel')||$('web3-panel');}
  function syncSize(){
    const r=right(), h=heart(); if(!r) return;
    r.classList.add('kgen-v1024-right-drawer');
    if(h){
      const rect=h.getBoundingClientRect();
      if(rect.width>180) document.documentElement.style.setProperty('--kgen-heart-panel-width',Math.round(rect.width)+'px');
      if(rect.height>220) document.documentElement.style.setProperty('--kgen-heart-panel-height',Math.round(Math.min(rect.height, window.innerHeight-190))+'px');
    }
    r.style.overflow='hidden';
  }
  function ensureClose(){
    const r=right(); if(!r) return;
    let b=$('kgen-v1011-right-close')||r.querySelector('.kgen-v1011-panel-close');
    if(!b){b=document.createElement('button'); b.id='kgen-v1011-right-close'; b.className='kgen-v1011-panel-close'; b.type='button'; b.textContent='收合'; r.appendChild(b);}
    b.onclick=function(e){e.preventDefault(); e.stopPropagation(); r.style.display='none'; r.style.visibility='hidden'; r.setAttribute('data-kgen-v1011-open','0');};
  }
  function boot(){syncSize(); ensureClose();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('resize',boot,{passive:true}); setInterval(boot,1600);
})();
