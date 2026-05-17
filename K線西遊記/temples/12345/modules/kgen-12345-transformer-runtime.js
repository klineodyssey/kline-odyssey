/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: kgen-12345-transformer-runtime.js
VERSION: V10.39.2_EXECUTION_MAP_GOVERNANCE
BUILD: 20260517-V10.39.2-EXECUTION-MAP-GOVERNANCE
BASE_FROM: KGEN_12345_V10_39_1_TEMPLE_ARCHITECTURE_MASTER_FULL.zip
RULE: Official filename is fixed. Version is written here, not in filename.
*/
/*
KGEN 12345 Transformer Runtime V10.35
- Standard filename, internal version only.
- CY 真實時空 XY 大跳躍，不回寫 WARP。
- WARP 宇宙電梯 0~300，只做垂直層級引擎。
- renderY = cyY + warpY；兩套數值疊加但互不污染。
*/
(function(){
  'use strict';
  if(window.__KGEN_V1035_RUNTIME__) return;
  window.__KGEN_V1035_RUNTIME__=true;
  const V=(window.KGEN12345_VERSION&&window.KGEN12345_VERSION.version)||'V10.35';
  const BUILD=(window.KGEN12345_VERSION&&window.KGEN12345_VERSION.build)||'TRANSFORMER-FINAL-MODULE-LINK';
  const $=(id)=>document.getElementById(id);
  const qsa=(sel)=>Array.from(document.querySelectorAll(sel));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const state={cyX:0,cyY:0,warp:20,warpY:0,renderX:0,renderY:0,cup:0,lastCountdown:'',amountTouched:false};
  function speak(msg){try{window.app&&app.speak&&app.speak(msg);}catch(e){} try{window.ui&&ui.toast&&ui.toast(msg);}catch(e){} }
  function setText(el,txt){if(el && el.textContent!==txt) el.textContent=txt;}
  function fmt(n){return String(Math.round(Number(n)||0));}
  function setVersion(){
    const text=`VERSION 12345-TEMPLE-${V}｜${BUILD}`;
    qsa('#ver-st,.version,.kgen-version,[data-version]').forEach(el=>setText(el,text));
    document.title='KGEN 12345 五指山悟空財神殿｜'+V;
  }
  function pad(n){return String(n).padStart(2,'0');}
  function nextDate(month,day,h=23,m=59,s=59){
    const now=new Date(); let t=new Date(now.getFullYear(),month-1,day,h,m,s);
    if(t.getTime()<now.getTime()) t=new Date(now.getFullYear()+1,month-1,day,h,m,s);
    return t;
  }
  function fmtLeft(ms){
    let sec=Math.max(0,Math.floor(ms/1000)); const d=Math.floor(sec/86400); sec%=86400;
    const h=Math.floor(sec/3600); sec%=3600; const mi=Math.floor(sec/60);
    return `${d}天 ${pad(h)}時${pad(mi)}分`;
  }
  function stableCountdown(){
    const text='距跨年：'+fmtLeft(nextDate(12,31).getTime()-Date.now());
    if(text===state.lastCountdown) return;
    state.lastCountdown=text;
    qsa('#kh-ny-slot,#cd-1231,#kh-ny-countdown,.kh-ny-countdown,#kgen-ny-countdown,#v714-ny-count,[data-kgen-countdown="newyear"]').forEach(el=>{
      setText(el,text); el.style.animation='none'; el.style.transition='none'; el.style.opacity='1'; el.style.whiteSpace='nowrap';
    });
    const slot=$('kgen-v1035-ny-slot'); if(slot) setText(slot,text);
  }
  function ensureCountdownSingleton(){
    if(window.__KGEN_V1035_COUNTDOWN__) return;
    stableCountdown();
    window.__KGEN_V1035_COUNTDOWN__=setInterval(stableCountdown,30000);
  }
  function amountInputs(){
    return qsa('#amt-in,#kh-amount,#bp-amount,#bet-amount,#amount-input,.bp-input,input[placeholder*="金額"],input[placeholder*="KGEN"],input[data-kgen-amount]');
  }
  function lockAmountInputs(){
    amountInputs().forEach(el=>{
      if(!el || el.dataset.kgenV1035Amount) return;
      el.dataset.kgenV1035Amount='1'; el.dataset.kgenAmount='1';
      el.setAttribute('inputmode','decimal'); el.setAttribute('autocomplete','off');
      el.placeholder='請自行輸入 KGEN 金額 / 天數';
      if(!el.dataset.userTouched && /^8(\.0+)?$/.test((el.value||'').trim())) el.value='';
      el.addEventListener('focus',()=>{el.dataset.userTouched='1'; state.amountTouched=true;},true);
      el.addEventListener('input',()=>{el.dataset.userTouched='1'; state.amountTouched=true;},true);
      el.addEventListener('change',()=>{el.dataset.userTouched='1'; state.amountTouched=true;},true);
    });
  }
  function getAmount(){
    const el=amountInputs().find(x=>x && x.offsetParent!==null) || amountInputs()[0];
    return el ? (el.value||'').trim() : '';
  }
  function warpToY(w){return clamp(-(Number(w)-20)*0.82,-236,22);}
  function applyTransform(){
    state.warpY=warpToY(state.warp);
    state.renderX=state.cyX; state.renderY=state.cyY+state.warpY;
    document.documentElement.style.setProperty('--kgen-cy-x',fmt(state.cyX)+'px');
    document.documentElement.style.setProperty('--kgen-cy-y',fmt(state.cyY)+'px');
    document.documentElement.style.setProperty('--kgen-warp-y',fmt(state.warpY)+'px');
    document.documentElement.style.setProperty('--kgen-render-x',fmt(state.renderX)+'px');
    document.documentElement.style.setProperty('--kgen-render-y',fmt(state.renderY)+'px');
    const core=$('core-anchor'); if(core) core.style.transform=`translate(calc(-50% + ${fmt(state.renderX)}px), calc(-50% + ${fmt(state.renderY)}px))`;
    const label=$('move-joystick-label'); if(label) label.textContent=`CY X ${fmt(state.cyX)} / Y ${fmt(state.cyY)}`;
    const status=$('kgen-v1035-status'); if(status) status.textContent=`CY(${fmt(state.cyX)},${fmt(state.cyY)}) + 宇宙電梯(${fmt(state.warp)}/300, Y${fmt(state.warpY)}) = Render(${fmt(state.renderX)},${fmt(state.renderY)})`;
  }
  function ensureStatus(){
    if(!$('kgen-v1035-status')){const d=document.createElement('div');d.id='kgen-v1035-status';document.body.appendChild(d);}
  }
  function ensureWarpScale(){
    const rail=$('warp-rail-body')||document.querySelector('.warp-rail'); if(!rail || rail.querySelector('.kgen-warp-scale')) return;
    const sc=document.createElement('div'); sc.className='kgen-warp-scale';
    [300,250,200,150,100,50,20,0].forEach(v=>{const s=document.createElement('span');s.textContent=v;s.style.bottom=(v/300*100)+'%';sc.appendChild(s);});
    rail.appendChild(sc);
  }
  function setWarp(raw){
    const w=clamp(raw,0,300); state.warp=w;
    const input=$('warp-input-val'); if(input){input.min='0';input.max='300';input.step='1';if(Number(input.value)!==w) input.value=String(w);}
    const pct=w/300*100;
    const fill=$('energy-fill'); if(fill) fill.style.height=pct+'%';
    const thumb=$('warp-thumb'); if(thumb) thumb.style.bottom=`calc(${pct}% - 17px)`;
    const txt=$('warp-txt'); if(txt) txt.textContent=`宇宙電梯 ${fmt(w)} / 300`;
    applyTransform();
  }
  function bindWarp(){
    ensureWarpScale();
    const input=$('warp-input-val'); if(!input) return;
    if(!input.dataset.kgenV1035Warp){
      input.dataset.kgenV1035Warp='1'; input.min='0'; input.max='300'; input.step='1';
      input.addEventListener('input',e=>setWarp(e.target.value),true);
      input.addEventListener('change',e=>setWarp(e.target.value),true);
    }
    let v=Number(input.value); if(!Number.isFinite(v)) v=20; if(v<=100) v=Math.round(v*3); if(v<0||v>300) v=20;
    setWarp(v);
    if(window.app && !app.__kgenV1035WarpPatched){
      app.__kgenV1035WarpPatched=true;
      app.updateWarp=function(v){setWarp(v);};
    }
  }
  function ensureMove(){
    let wrap=$('move-joystick-wrap');
    if(!wrap){
      wrap=document.createElement('div');wrap.id='move-joystick-wrap';
      wrap.innerHTML='<div id="move-joystick-base"></div><div id="move-joystick-knob"></div><div id="move-joystick-label">CY X 0 / Y 0</div>';
      document.body.appendChild(wrap);
    }
    return wrap;
  }
  function bindMove(){
    const wrap=ensureMove(); const knob=$('move-joystick-knob'); if(!wrap||!knob||wrap.dataset.kgenV1035Move) return;
    wrap.dataset.kgenV1035Move='1'; let pid=null;
    function resetKnob(){knob.style.left='40px';knob.style.top='40px';}
    function setFromPoint(x,y){
      const r=wrap.getBoundingClientRect(); const cx=r.left+r.width/2; const cy=r.top+r.height/2;
      let dx=x-cx, dy=y-cy; const len=Math.hypot(dx,dy)||1, max=44; if(len>max){dx=dx/len*max;dy=dy/len*max;}
      knob.style.left=(40+dx)+'px'; knob.style.top=(40+dy)+'px';
      state.cyX=clamp(dx*4.8,-240,240); state.cyY=clamp(dy*4.8,-240,240); applyTransform();
    }
    function end(e){if(pid!==null){try{wrap.releasePointerCapture(pid);}catch(_){}} pid=null; resetKnob(); applyTransform();}
    wrap.addEventListener('pointerdown',e=>{e.preventDefault();pid=e.pointerId;try{wrap.setPointerCapture(pid);}catch(_){} setFromPoint(e.clientX,e.clientY);},true);
    wrap.addEventListener('pointermove',e=>{if(pid!==e.pointerId)return;e.preventDefault();setFromPoint(e.clientX,e.clientY);},true);
    wrap.addEventListener('pointerup',end,true); wrap.addEventListener('pointercancel',end,true); wrap.addEventListener('lostpointercapture',end,true);
    wrap.addEventListener('dblclick',()=>{state.cyX=0;state.cyY=0;resetKnob();applyTransform();speak('CY 真實時空座標已歸零。');},true);
  }
  function updateCupUI(){
    const msg=state.cup>=3?'三聖盃完成，可以領發財金。':`聖盃狀態：${state.cup}/3`;
    qsa('#v57-cup-status,#cup-status,#kh-cup-status,.cup-status,[data-cup-status]').forEach(el=>setText(el,msg));
  }
  function patchTempleOps(){
    const old=window.templeOps||{}; if(old.__kgenV1035Patched) return;
    const ops=Object.assign({},old);
    ops.__kgenV1035Patched=true;
    ops.cup=function(){state.cup=Math.min(3,state.cup+1);updateCupUI();speak(state.cup>=3?'三聖盃完成，可以領發財金。':'第 '+state.cup+' 次聖盃完成。'); if(old.cup&&!old.cup.__skip) try{return old.cup.call(old);}catch(e){}};
    ops.resetCup=function(){state.cup=0;updateCupUI();speak('三聖盃已重置。');};
    [['approve','Approve 授權'],['fortune','發財金 fortuneClaim'],['heartbeat','整點心跳 heartbeatClaim'],['ignite','轉日呼吸 igniteAndClaim'],['vow','還願補血 vowTo'],['lamp','點燈續命 lightLamp'],['wish','許願上鏈 makeWish']].forEach(([k,label])=>{
      const prior=old[k]; ops[k]=function(){const amt=getAmount(); if(['approve','fortune','vow','lamp'].includes(k)&&!amt) speak(label+'：請先自行輸入 KGEN 金額。'); else speak(label+'：請確認錢包交易。'); if(typeof prior==='function') try{return prior.call(old);}catch(e){console.warn(k,e);}};
    });
    window.templeOps=ops;
  }
  function bindMirrorOrders(){
    if(document.body.dataset.kgenV1035Mirror) return; document.body.dataset.kgenV1035Mirror='1';
    document.addEventListener('click',ev=>{
      const b=ev.target&&ev.target.closest?ev.target.closest('button,a'):null; if(!b) return;
      const t=(b.textContent||'').trim(); if(!/下單|ORDER|UP|DOWN|多方|空方|買|賣|fortuneClaim|發財金/.test(t)) return;
      const short=/DOWN|空|賣|後鏡/i.test(t);
      const list=qsa('button,a');
      const target=list.find(x=>short?/後鏡|巡禮|空方/.test(x.textContent||''):/前鏡|自拍|多方/.test(x.textContent||''));
      if(target) setTimeout(()=>{try{target.click();}catch(e){}},180);
    },true);
  }
  function ensureMasterCollapse(){
    if($('kgen-master-collapse')) return;
    const b=document.createElement('button'); b.id='kgen-master-collapse'; b.type='button'; b.textContent='總收合';
    b.onclick=()=>{document.body.classList.toggle('kgen-all-collapsed'); b.textContent=document.body.classList.contains('kgen-all-collapsed')?'總展開':'總收合';};
    document.body.appendChild(b);
  }
  function install(){
    setVersion(); ensureStatus(); ensureCountdownSingleton(); lockAmountInputs(); bindWarp(); bindMove(); patchTempleOps(); bindMirrorOrders(); ensureMasterCollapse(); stableCountdown(); applyTransform(); updateCupUI();
  }
  function boot(){install(); setTimeout(install,500); setTimeout(install,1600);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('load',()=>setTimeout(install,600));
  setInterval(()=>{setVersion(); lockAmountInputs(); stableCountdown();},5000);
  window.KGEN12345_Runtime={version:V,build:BUILD,state,setWarp,applyTransform,install,stableCountdown};
})();



(function(){
  'use strict';
  const VERSION = 'KGEN-12345-HEART-UI-V10.35.4-HEART-BREATH-DISPLAY-FIX';

  if(window.__KGEN_V1035_4_HEART_BREATH_FIX__) return;
  window.__KGEN_V1035_4_HEART_BREATH_FIX__ = true;

  function $(id){ return document.getElementById(id); }
  function pad(n){ return String(n).padStart(2,'0'); }

  function nextTopHour(){
    const n = new Date();
    const t = new Date(n);
    t.setMinutes(0,0,0);
    t.setHours(t.getHours()+1);
    return t;
  }

  function nextUtcMidnight(){
    const n = new Date();
    return new Date(Date.UTC(
      n.getUTCFullYear(),
      n.getUTCMonth(),
      n.getUTCDate()+1,
      0,0,0,0
    ));
  }

  function nextTaiwanNewYear(){
    const now = new Date();
    let y = now.getFullYear();
    let t = new Date(y,11,31,23,59,59,999);
    if(t.getTime() <= now.getTime()) t = new Date(y+1,11,31,23,59,59,999);
    return t;
  }

  function diff(ms, withDay){
    ms = Math.max(0, ms);
    const s = Math.floor(ms/1000);
    const d = Math.floor(s/86400);
    const h = Math.floor((s%86400)/3600);
    const m = Math.floor((s%3600)/60);
    const sec = s%60;
    if(withDay) return d + '天 ' + pad(h) + '時' + pad(m) + '分';
    if(h > 0) return h + '時' + pad(m) + '分' + pad(sec) + '秒';
    return m + '分' + pad(sec) + '秒';
  }

  function setText(el, txt){
    if(!el) return;
    if(el.textContent !== txt) el.textContent = txt;
    el.style.animation = 'none';
    el.style.transition = 'none';
    el.style.opacity = '1';
  }

  function setByLabel(labelText, valueText){
    const panel = $('kgen-heart-live-panel');
    if(!panel) return;
    const labels = Array.from(panel.querySelectorAll('.kh-k'));
    labels.forEach(label=>{
      if((label.textContent || '').trim() === labelText){
        const value = label.nextElementSibling;
        if(value) setText(value, valueText);
      }
    });
  }

  function ensureLabels(){
    const panel = $('kgen-heart-live-panel');
    if(!panel) return;
    Array.from(panel.querySelectorAll('.kh-k')).forEach(label=>{
      const t = (label.textContent || '').trim();
      if(t === 'NY Slot') label.textContent = '跨年倒數槽';
    });
  }

  function tickFast(){
    const now = Date.now();
    const heart = '距下次整點 ' + diff(nextTopHour().getTime() - now, false);
    const breath = '距 UTC 00:00 ' + diff(nextUtcMidnight().getTime() - now, false);

    setText($('kh-heartbeat-countdown'), heart);
    setText($('kh-ignite-countdown'), breath);
    setByLabel('心跳倒數', heart);
    setByLabel('呼吸倒數', breath);

    // 三聖盃下方原本被拿去放跨年倒數，改成實際操作說明。
    const cupInfo = $('kh-ny-countdown');
    if(cupInfo){
      setText(cupInfo, '聖盃完成後才可領發財金。下方金額欄由操作者自行輸入；Approve、fortuneClaim、vowTo 還願、lightLamp 點燈共用此欄。');
    }

    const amount = $('kh-amount') || document.querySelector('#kgen-heart-live-panel input[placeholder*="發財金"], #kgen-heart-live-panel input[placeholder*="KGEN"]');
    if(amount){
      amount.removeAttribute('value');
      if(amount.value === '8') amount.value = '';
      amount.placeholder = '輸入發財金數量（1 到 888）或還願 / 點燈 KGEN 金額';
      amount.autocomplete = 'off';
    }
  }

  let lastNY = '';
  function tickSlow(){
    ensureLabels();
    const ny = '距跨年：' + diff(nextTaiwanNewYear().getTime() - Date.now(), true);
    if(ny !== lastNY){
      lastNY = ny;
      setText($('kh-ny-slot'), ny);
      setText($('cd-1231'), ny.replace('距跨年：',''));
      setText($('v714-ny-count'), ny);
      setText($('kgen-ny-countdown'), ny);
    }
    const ver = $('ver-st');
    if(ver && (ver.textContent||'').indexOf('V10.35.4') < 0){
      ver.textContent = 'VERSION ' + VERSION;
    }
  }

  function installObserver(){
    const panel = $('kgen-heart-live-panel') || document.body;
    if(!panel || window.__KGEN_V1035_4_OBSERVER__) return;
    window.__KGEN_V1035_4_OBSERVER__ = new MutationObserver(function(){
      if(window.__KGEN_V1035_4_OBSERVER_LOCK__) return;
      window.__KGEN_V1035_4_OBSERVER_LOCK__ = true;
      requestAnimationFrame(function(){
        tickFast();
        window.__KGEN_V1035_4_OBSERVER_LOCK__ = false;
      });
    });
    window.__KGEN_V1035_4_OBSERVER__.observe(panel, {childList:true, subtree:true, characterData:true});
  }

  function boot(){
    tickFast();
    tickSlow();
    installObserver();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  setTimeout(boot, 500);
  setTimeout(boot, 1800);
  setInterval(tickFast, 1000);
  setInterval(tickSlow, 30000);

  window.KGEN12345_V1035_4_HEART_BREATH_FIX = { version: VERSION, tickFast, tickSlow };
})();

