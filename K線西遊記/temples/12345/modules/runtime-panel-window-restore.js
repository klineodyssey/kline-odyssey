/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: runtime-panel-window-restore.js
VERSION: V10.40.3_MOBILE_LAYOUT_SAFE_ASSET_FIX
BUILD: 20260518-V10.40.3-MOBILE-LAYOUT-SAFE-ASSET-FIX
BASE_FROM: KGEN_12345_V10_40_2_V9_RECORDER_CORE_RESTORE_FULL.zip
RULE: Active JS/CSS stays in modules single layer. V9 recorder core restored.
*/

(function(){
  'use strict';
  if(window.__KGEN_PANEL_LAYOUT_V10402__) return; window.__KGEN_PANEL_LAYOUT_V10402__=true;
  const $=(id)=>document.getElementById(id); const all=(s)=>Array.from(document.querySelectorAll(s));
  const txt=e=>(e&&e.textContent||'').replace(/\s+/g,' ').trim();
  function makePanel(id,title,body,where){ let p=$(id); if(!p){ p=document.createElement('section'); p.id=id; p.className='kgen-v10402-panel'; p.innerHTML='<div class="phead"><b>'+title+'</b><button type="button" data-close="'+id+'">收合</button></div><div class="pbody">'+body+'</div>'; document.body.appendChild(p);} Object.assign(p.style,where); if(!p.dataset.open) {p.dataset.open='0'; p.style.display='none';} return p; }
  function toggle(id){ const p=$(id); if(!p) return; const open=p.dataset.open==='1' && getComputedStyle(p).display!=='none'; p.dataset.open=open?'0':'1'; p.style.display=open?'none':'block'; }
  function ensure(){
    makePanel('kgen-left-heart-panel','悟空心臟｜Heart Motion','<p>左下悟空心臟專用視窗，不是左上控制台。</p><p><b>heart.png</b>：MOVE / WARP 移動中暫態圖；停止後回多空圖。</p>',{position:'fixed',left:'12px',bottom:'156px',zIndex:910});
    makePanel('kgen-right-rule-panel','右側神規｜Heart / Brain','<p>TempleHeart / Brain 對齊規則。</p><p>fortuneClaim：1 到 888。heartbeatClaim：每小時一次。igniteAndClaim：UTC 00:00–00:10。</p>',{position:'fixed',right:'82px',bottom:'166px',zIndex:915});
    makePanel('kgen-holy-cup-panel','三聖盃檢查系統','<p>只控制本視窗。收合後可再開。</p><p>連續完成三次聖盃後，才提示可領發財金。</p>',{position:'fixed',left:'50%',bottom:'104px',transform:'translateX(-50%)',zIndex:905});
    let tab=$('kgen-holy-cup-tab-v10402'); if(!tab){ tab=document.createElement('button'); tab.id='kgen-holy-cup-tab-v10402'; tab.type='button'; tab.textContent='三聖盃檢查'; tab.onclick=()=>toggle('kgen-holy-cup-panel'); document.body.appendChild(tab); }
    all('[data-close]').forEach(b=>{ if(b.dataset.kclose) return; b.dataset.kclose='1'; b.onclick=(ev)=>{ev.preventDefault();ev.stopPropagation(); const p=$(b.dataset.close); if(p){p.dataset.open='0'; p.style.display='none';}}; });
  }
  function bind(){
    all('button,a,[role="button"],.term-btn,.nav-btn,.chip').forEach(b=>{
      if(!b.dataset.kgenPanel10402 && /悟空心臟/.test(txt(b))){ b.dataset.kgenPanel10402='heart'; b.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation(); toggle('kgen-left-heart-panel');},true); }
      if(!b.dataset.kgenRule10402 && /右側神規|神規/.test(txt(b))){ b.dataset.kgenRule10402='rule'; b.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation(); toggle('kgen-right-rule-panel');},true); }
      if(!b.dataset.kgenCup10402 && /三聖盃檢查|聖盃檢查/.test(txt(b))){ b.dataset.kgenCup10402='cup'; b.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation(); toggle('kgen-holy-cup-panel');},true); }
    });
  }
  function cleanupTop(){ all('body *').forEach(e=>{ if(e.children.length) return; const t=txt(e); if((t==='C | 曲速宇宙電梯'||t.startsWith('C |')||t.startsWith('CT |')) && e.getBoundingClientRect().top<185){ e.classList.add('kgen-hide-stray-label'); } }); }
  function boot(){ ensure(); bind(); cleanupTop(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot(); setInterval(boot,2000);
})();
