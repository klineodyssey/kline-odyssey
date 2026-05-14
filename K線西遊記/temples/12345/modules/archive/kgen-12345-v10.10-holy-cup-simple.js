// KGEN 12345 V10.10 holy cup simple
// 路徑：/K線西遊記/temples/12345/modules/kgen-12345-v10.10-holy-cup-simple.js
// 規則：不再顯示 0/3、1/3；按三次聖盃即通過，並同步舊版 localStorage 給 fortuneClaim 使用。
(function(){
  'use strict';
  const KEY='KGEN_12345_CUP_COUNT_V1010';
  const $=id=>document.getElementById(id);
  function get(){return Math.max(0,Math.min(3,Number(localStorage.getItem(KEY)||window.__templeCupCount||0)||0));}
  function sync(n){
    localStorage.setItem(KEY,String(n));
    localStorage.setItem('kgen12345CupOk',String(n));
    localStorage.setItem('k12345CupCount',String(n));
    localStorage.setItem('KGEN_12345_V907_CUP_COUNT',String(n));
    localStorage.setItem('KGEN_12345_V908_CUP_COUNT',String(n));
    localStorage.setItem('KGEN_12345_CUP_COUNT_V892',String(n));
    if(n>=3){localStorage.setItem('k12345CupOk','1');localStorage.setItem('kgen12345CupHistory',JSON.stringify(['聖盃一','聖盃二','聖盃三']));}
    window.__templeCupCount=n; window.__templeCupOk=n>=3;
  }
  function set(n){n=Math.max(0,Math.min(3,Number(n)||0));sync(n);render();}
  function status(){const n=get(); return n>=3?'聖盃已通過，可以領發財金。':'請按聖盃三次；每按一次即通過一杯。';}
  function ensure(){
    const box=$('v714-cupbox')||$('kh-cupbox')||$('kgen-v109-cup-box'); if(!box) return;
    box.classList.add('kgen-v1010-cupbox');
    if(!$('kgen-v1010-cup-status')){const st=document.createElement('div');st.id='kgen-v1010-cup-status';box.insertBefore(st,box.firstChild&&box.firstChild.nextSibling?box.firstChild.nextSibling:box.firstChild);}
    const buttons=Array.from(box.querySelectorAll('button,[data-cup],.v714-cup'));
    buttons.forEach(function(btn,idx){
      if(idx<3){btn.dataset.kgenV1010Cup='1';btn.textContent=['聖盃一','聖盃二','聖盃三'][idx]||'聖盃';btn.onclick=function(e){e.preventDefault();e.stopPropagation();pass();return false;};}
      else if(/重置/.test(btn.textContent||'')){btn.onclick=function(e){e.preventDefault();e.stopPropagation();set(0);return false;};}
    });
    render();
  }
  function render(){
    const n=get(); const st=$('kgen-v1010-cup-status'); if(st) st.textContent=status();
    document.querySelectorAll('[data-kgen-v1010-cup="1"],.v714-cup').forEach(function(b,idx){b.classList.toggle('done',idx<n);b.classList.toggle('kgen-v1010-cup-done',idx<n);});
    ['v715-cup-log','v715-cup-status','v714-cup-status','v57-cup-status','kh-cup-status'].forEach(id=>{const e=$(id);if(e)e.textContent='';});
  }
  function pass(){const n=get(); if(n>=3){render();return;} set(n+1);}
  function reset(){set(0);}
  const old=Object.assign({},window.templeOps||{});
  window.templeOps=Object.assign(window.templeOps||{}, {
    cup:function(){ensure(); pass();},
    resetCup:function(){reset();},
    fortune: async function(){sync(get()); if(get()<3){pass(); if(get()<3){return;} } if(old.fortune) return old.fortune.apply(this,arguments);}
  });
  document.addEventListener('click',function(e){const b=e.target&&e.target.closest&&e.target.closest('button,[data-cup],.v714-cup');if(!b)return;const t=(b.textContent||'').replace(/\s+/g,'');if(/聖盃|請示/.test(t)){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation&&e.stopImmediatePropagation();ensure();pass();return false;}},true);
  document.addEventListener('DOMContentLoaded',ensure); if(document.readyState!=='loading') ensure(); setInterval(ensure,1500);
})();
