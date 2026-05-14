// KGEN 12345 V10.10 panel router
// 路徑：/K線西遊記/temples/12345/modules/kgen-12345-v10.10-panel-router.js
// 只控制原本 #coord-panel，不再新增第二個右側神規小面板。
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  function text(el){return String((el&&el.textContent)||'').replace(/\s+/g,'').trim();}
  function say(msg){try{ if(window.app&&typeof app.log==='function') app.log(msg); }catch(_){} }
  function coord(){return $('coord-panel')||document.querySelector('.coord-panel')||$('right-info-panel')||document.querySelector('.right-info-panel');}
  function addCoordClose(){
    const p=coord(); if(!p || $('kgen-v1010-coord-close')) return;
    const title=p.querySelector('.cp-title')||p.firstElementChild||p;
    const btn=document.createElement('button'); btn.id='kgen-v1010-coord-close'; btn.type='button'; btn.className='kgen-v1010-panel-close'; btn.textContent='收合';
    btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();setRight(false);},true);
    title.appendChild(btn);
  }
  function setRight(open){
    const p=coord(); if(!p) return;
    document.body.classList.toggle('kgen-v1010-right-rule-open',!!open);
    document.body.classList.toggle('kgen-v1010-right-rule-closed',!open);
    p.style.display=open?'block':'none'; p.style.visibility=open?'visible':'hidden'; p.style.pointerEvents=open?'auto':'none';
    addCoordClose(); say(open?'右側神規已展開':'右側神規已收合');
  }
  function toggleRight(){ const open=!document.body.classList.contains('kgen-v1010-right-rule-open'); setRight(open); }
  function setHeart(open){
    const p=$('web3-panel'); if(!p) return;
    document.body.classList.toggle('kgen-v1010-heart-open',!!open);
    document.body.classList.toggle('kgen-v1010-heart-closed',!open);
    p.style.display=open?'block':'none'; p.style.visibility=open?'visible':'hidden'; p.style.pointerEvents=open?'auto':'none';
    say(open?'悟空心臟已展開':'悟空心臟已收合');
  }
  function toggleHeart(){ const open=!document.body.classList.contains('kgen-v1010-heart-open'); setHeart(open); }
  function ensureFestivalButton(){
    const nav=$('universe-nav'); if(!nav) return;
    let btn=$('kgen-v1010-festival-toggle');
    if(!btn){btn=document.createElement('div');btn.id='kgen-v1010-festival-toggle';btn.className='nav-btn nav-help';btn.setAttribute('role','button');btn.textContent='節日活動｜5/20・11/11・12/31';nav.appendChild(btn);} 
    btn.onclick=function(e){e.preventDefault();e.stopPropagation();toggleFestival();return false;};
  }
  function ensureFestivalPanel(){
    const p=$('kgen-v102-festival-panel'); if(!p) return;
    if(!$('kgen-v1010-festival-head')){const head=document.createElement('div');head.id='kgen-v1010-festival-head';head.innerHTML='<span>節日活動</span><button type="button" class="kgen-v1010-panel-close" id="kgen-v1010-festival-close">收合</button>';p.insertBefore(head,p.firstChild);$('kgen-v1010-festival-close').onclick=function(e){e.preventDefault();e.stopPropagation();setFestival(false);return false;};}
    const voice=$('kgen-v102-festival-voice'); if(voice){voice.onclick=function(e){e.preventDefault();e.stopPropagation();say('節日活動規則已顯示，請依合約時間與冷卻條件操作。');return false;};}
  }
  function setFestival(open){const p=$('kgen-v102-festival-panel'); if(!p) return; p.classList.toggle('kgen-v1010-open',!!open); p.style.display=open?'block':'none'; ensureFestivalPanel();}
  function toggleFestival(){const p=$('kgen-v102-festival-panel'); if(!p)return; setFestival(!p.classList.contains('kgen-v1010-open'));}
  function bindFooter(){
    const btns=Array.from(document.querySelectorAll('.footer-terminal .term-btn,.footer-terminal button,button.term-btn'));
    if(btns.length>=8){
      // 保留原八大按鈕，只確保第五與第八功能接線正確。
      btns[4].dataset.kgenV1010Heart='1';
      btns[7].dataset.kgenV1010RightRule='1';
      if(!/右側神規/.test(btns[7].textContent||'')) btns[7].innerHTML='🛡<br>右側神規';
    }
  }
  function init(){addCoordClose();ensureFestivalButton();ensureFestivalPanel();bindFooter();setFestival(false);}
  window.KGEN12345_V1010_PANELS={setRight,toggleRight,setHeart,toggleHeart,setFestival,toggleFestival};
  document.addEventListener('click',function(e){
    const b=e.target&&e.target.closest&&e.target.closest('button,.term-btn,.nav-btn,[role="button"'); if(!b) return;
    const t=text(b);
    if(b.dataset.kgenV1010RightRule==='1'||/右側神規|右神神規/.test(t)){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation&&e.stopImmediatePropagation();toggleRight();return false;}
    if(b.dataset.kgenV1010Heart==='1'||/悟空心臟|心臟操作/.test(t)){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation&&e.stopImmediatePropagation();toggleHeart();return false;}
    if(b.id==='kgen-v1010-festival-toggle'||/節日活動|5\/20・11\/11・12\/31/.test(t)){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation&&e.stopImmediatePropagation();toggleFestival();return false;}
  },true);
  document.addEventListener('DOMContentLoaded',init); if(document.readyState!=='loading') init(); setInterval(init,2000);
})();
