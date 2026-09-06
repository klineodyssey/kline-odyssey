/* KGEN_META
VERSION: 2.4.0
STATUS: ACTIVE
PURPOSE: Fail-open 11520 bootstrap. The player must always be able to enter the full game even when storage, audio, speech, CDN, or optional capabilities fail.
*/
const $=s=>document.querySelector(s);

function ensureIntro(){
  if($('#intro11520')) return $('#intro11520');
  const style=document.createElement('style');
  style.id='k11520BootstrapV240';
  style.textContent=`
  #intro11520{position:fixed;z-index:7000;inset:0;display:grid;place-items:center;overflow:hidden;background:radial-gradient(circle at 50% 42%,#173c66 0,#07111e 45%,#010307 100%);color:#fff;font-family:system-ui,"Noto Sans TC",sans-serif;transition:opacity .32s}
  #intro11520 .stars{position:absolute;inset:-25%;opacity:.34;background-image:radial-gradient(#fff 1px,transparent 1px),radial-gradient(#69e6ff 1px,transparent 1px);background-size:34px 34px,57px 57px;background-position:0 0,17px 11px;animation:kdrift 18s linear infinite}
  #intro11520 .ring{position:absolute;width:min(76vw,520px);aspect-ratio:1;border:1px solid #6de8ff44;border-radius:50%;box-shadow:0 0 70px #62dcff22,inset 0 0 70px #62dcff16;animation:kspin 12s linear infinite}
  #intro11520 .core{position:relative;z-index:2;text-align:center;padding:28px}
  #intro11520 .logo{width:118px;height:118px;margin:auto;border-radius:50%;background:#101923 url('./assets/ui/brand-k-ui.webp') center/cover no-repeat;box-shadow:0 0 0 8px #68e4ff16,0 0 48px #68e4ff55}
  #intro11520 .title{margin-top:18px;color:#f6d984;font-size:25px;font-weight:900}.sub{margin-top:6px;color:#9ceeff}.life{margin-top:7px;color:#73e7a7;font-size:11px;letter-spacing:.1em}
  #intro11520 button{margin-top:20px;border:1px solid #74e8ff88;background:#0d1c2bea;color:#e8fbff;border-radius:13px;padding:13px 22px;font:800 16px system-ui;touch-action:manipulation}
  #intro11520 .status{margin-top:10px;font-size:11px;color:#9ca8b3}#intro11520.hide{opacity:0;pointer-events:none}
  @keyframes kdrift{to{transform:translate3d(8%,10%,0)}}@keyframes kspin{to{transform:rotate(360deg)}}`;
  document.head.appendChild(style);
  const o=document.createElement('div');o.id='intro11520';
  o.innerHTML=`<div class="stars"></div><div class="ring"></div><div class="core"><div class="logo"></div><div class="title">11520 花果山 V2.4</div><div class="sub">5D K線西遊記</div><div class="life">INTERACTIVE RUNTIME · LIVING MARKET</div><button id="enter11520" type="button">進入活世界</button><div class="status" id="boot11520Status">核心載入中…</div></div>`;
  document.body.appendChild(o);return o;
}

const intro=ensureIntro(),btn=$('#enter11520'),status=$('#boot11520Status');
let entered=false;
function optionalAudio(){
  try{const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return;const ctx=new C();ctx.resume?.();const g=ctx.createGain(),o=ctx.createOscillator();g.gain.value=.018;o.frequency.value=174.6;o.connect(g);g.connect(ctx.destination);o.start();setTimeout(()=>{try{o.stop()}catch{}},420)}catch{}
}
function optionalVoice(){
  try{if(!('speechSynthesis' in globalThis))return;const u=new SpeechSynthesisUtterance('歡迎回到一一五二零花果山');u.lang='zh-TW';u.rate=1;speechSynthesis.cancel();speechSynthesis.speak(u)}catch{}
}
function enterWorld(e){
  if(e){try{e.preventDefault();e.stopPropagation()}catch{}}
  if(entered)return;entered=true;
  if(btn){btn.disabled=true;btn.textContent='進入中…'}
  // CRITICAL: release the player BEFORE optional browser capabilities.
  try{intro.classList.add('hide')}catch{}
  setTimeout(()=>{try{intro.remove()}catch{}},340);
  setTimeout(optionalAudio,0);setTimeout(optionalVoice,0);
}
if(btn){btn.onclick=enterWorld;btn.addEventListener('pointerup',enterWorld);btn.addEventListener('touchend',enterWorld,{passive:false})}

// Load the complete production runtime behind the intro. A failed optional capability must never block entry.
(async()=>{
  try{
    await import('./game-5d-main.mjs');
    if(status)status.textContent='完整世界 READY';
  }catch(err){
    console.error('[11520 bootstrap] full runtime failed',err);
    if(status)status.textContent='完整世界載入失敗 · 可進入本地介面';
    const c=$('#charState');if(c)c.textContent='RUNTIME DEGRADED';
  }
})();
