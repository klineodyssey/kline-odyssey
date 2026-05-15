
// KGEN 12345 V10.21 panel router
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
      rp.style.maxHeight = cs.maxHeight && cs.maxHeight !== 'none' ? cs.maxHeight : '62vh';
      rp.style.overflow = 'auto';
      rp.style.boxSizing = 'border-box';
    }catch(_){
      rp.style.width = 'min(390px, calc(100vw - 28px))';
      rp.style.maxHeight = '62vh';
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
  function init(){ensureRightClose();ensureFestivalClose();bindFooter(); setFestival(false);}
  window.KGEN12345_V1011_PANELS={setRight,toggleRight,setHeart,toggleHeart,setFestival,toggleFestival};
  document.addEventListener('DOMContentLoaded',init); if(document.readyState!=='loading') init(); setTimeout(init,500); setTimeout(init,1800); setInterval(bindFooter,2500);
})();
