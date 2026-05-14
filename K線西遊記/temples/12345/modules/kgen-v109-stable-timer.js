
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  function pad(n){return String(n).padStart(2,'0');}
  function diffText(target){
    let ms=Math.max(0,target-Date.now());
    let m=Math.ceil(ms/60000); // 分鐘級，避免秒數跳動
    const d=Math.floor(m/1440); m-=d*1440;
    const h=Math.floor(m/60); m-=h*60;
    return d+'天 '+pad(h)+'時 '+pad(m)+'分';
  }
  function nextNewYear(){
    const now=new Date();
    let y=now.getFullYear();
    let t=new Date(y,11,31,23,59,59,999).getTime();
    if(Date.now()>t) t=new Date(y+1,11,31,23,59,59,999).getTime();
    return t;
  }
  function nextFestival(){
    const now=new Date(); const y=now.getUTCFullYear();
    const events=[
      ['5/20 悟空生日',Date.UTC(y,4,20,0,0,0)],
      ['11/11 孤勇日',Date.UTC(y,10,11,0,0,0)],
      ['12/31 跨年倒數',Date.UTC(y,11,31,23,50,0)]
    ];
    let ev=events.find(e=>Date.now()<=e[1]);
    if(!ev) ev=['明年 5/20 悟空生日',Date.UTC(y+1,4,20,0,0,0)];
    return ev;
  }
  function ensureNy(){
    const slot=$('kh-ny-slot');
    if(slot && !$('kgen-v109-ny-stable')){
      const s=document.createElement('span');s.id='kgen-v109-ny-stable';slot.appendChild(s);
    }
  }
  function ensureFestivalStable(){
    const old=$('kgen-v102-festival-countdown');
    if(old && !$('kgen-v109-festival-stable-countdown')){
      const d=document.createElement('div');d.id='kgen-v109-festival-stable-countdown';old.insertAdjacentElement('afterend',d);
    }
  }
  function update(){
    ensureNy(); ensureFestivalStable();
    const ny=$('kgen-v109-ny-stable'); if(ny) ny.textContent='距跨年倒數 '+diffText(nextNewYear());
    const f=$('kgen-v109-festival-stable-countdown'); if(f){ const ev=nextFestival(); f.textContent='下一個活動：'+ev[0]+'｜倒數 '+diffText(ev[1]); }
  }
  window.KGEN_V109_TIMER={update};
  document.addEventListener('DOMContentLoaded',()=>{update(); setInterval(update,60000);});
  if(document.readyState!=='loading'){update(); setInterval(update,60000);}
})();
