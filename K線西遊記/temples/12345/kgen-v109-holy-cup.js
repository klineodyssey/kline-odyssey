
(function(){
  'use strict';
  const KEY='kgen12345_v109_cup_count';
  const $=id=>document.getElementById(id);
  function get(){return Math.max(0,Math.min(3,Number(localStorage.getItem(KEY)||window.__templeCupCount||0)||0));}
  function set(n){n=Math.max(0,Math.min(3,Number(n)||0));localStorage.setItem(KEY,String(n));window.__templeCupCount=n;render();}
  function statusText(n){
    if(n>=3) return '三聖盃已通過，可以領發財金。';
    if(n<=0) return '尚未請示。按下聖盃一開始。';
    return '已通過第 '+n+' 杯，繼續按下一杯。';
  }
  function ensure(){
    const panel=$('web3-panel'); if(!panel || $('kgen-v109-cup-box')) return;
    const box=document.createElement('div'); box.id='kgen-v109-cup-box';
    box.innerHTML='<div id="kgen-v109-cup-title">三聖盃驗證（簡化版）</div><div id="kgen-v109-cup-status"></div><div id="kgen-v109-cup-row"><button type="button" data-cup="1">聖盃一</button><button type="button" data-cup="2">聖盃二</button><button type="button" data-cup="3">聖盃三</button></div><button type="button" id="kgen-v109-cup-reset">重置聖盃</button>';
    const ref=panel.querySelector('#amt-in') || panel.querySelector('input') || panel.firstElementChild;
    if(ref && ref.parentElement) ref.parentElement.insertBefore(box, ref); else panel.appendChild(box);
    box.querySelectorAll('[data-cup]').forEach(btn=>btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();pass();},true));
    $('kgen-v109-cup-reset').addEventListener('click',function(e){e.preventDefault();e.stopPropagation();set(0);msg('三聖盃已重置。');},true);
    render();
  }
  function render(){
    const n=get(); const st=$('kgen-v109-cup-status'); if(st) st.textContent=statusText(n);
    document.querySelectorAll('#kgen-v109-cup-row [data-cup]').forEach(function(b){ const i=Number(b.dataset.cup); b.classList.toggle('done', i<=n); b.textContent=i<=n?'第 '+i+' 杯已通過':'聖盃'+['一','二','三'][i-1]; });
    const old=['v715-cup-log','v714-cup-status','v57-cup-status']; old.forEach(id=>{const e=$(id); if(e) e.textContent=statusText(n);});
  }
  function msg(t){try{ const e=$('bp-status')||$('kh-log')||$('kgen-v902-left-status'); if(e) e.textContent=t;}catch(_){}}
  function pass(){ const n=get(); if(n>=3){msg('三聖盃已通過，可以領發財金。');render();return;} set(n+1); msg(statusText(get())); }
  function bind(){ ensure(); render(); }
  const oldOps=window.templeOps||{}; window.templeOps=Object.assign(oldOps,{ cup:function(){pass();} });
  window.KGEN_V109_CUP={get,set,pass,render,ensure};
  window.addEventListener('click',function(e){
    const b=e.target&&e.target.closest&&e.target.closest('button,.term-btn,a'); if(!b) return;
    const t=(b.textContent||'').replace(/\s+/g,'');
    if(t.includes('聖盃')||t.includes('請示')){ e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation&&e.stopImmediatePropagation(); ensure(); pass(); return false; }
  },true);
  document.addEventListener('DOMContentLoaded',bind); if(document.readyState!=='loading') bind(); setInterval(bind,1500);
})();
