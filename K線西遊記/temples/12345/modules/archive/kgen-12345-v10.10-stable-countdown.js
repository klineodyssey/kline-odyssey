// KGEN 12345 V10.10 stable countdown
// 路徑：/K線西遊記/temples/12345/modules/kgen-12345-v10.10-stable-countdown.js
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  function pad(n){return String(n).padStart(2,'0');}
  function diffText(target){let m=Math.max(0,Math.ceil((target-Date.now())/60000));const d=Math.floor(m/1440);m-=d*1440;const h=Math.floor(m/60);m-=h*60;return d+'天 '+pad(h)+'時 '+pad(m)+'分';}
  function nextNY(){const now=new Date();let y=now.getFullYear();let t=new Date(y,11,31,23,59,59,999).getTime();if(Date.now()>t)t=new Date(y+1,11,31,23,59,59,999).getTime();return t;}
  function nextFestival(){const now=new Date();const y=now.getUTCFullYear();let arr=[['5/20 悟空生日',Date.UTC(y,4,20,0,0,0)],['11/11 孤勇日',Date.UTC(y,10,11,0,0,0)],['12/31 跨年倒數',Date.UTC(y,11,31,23,50,0)]];let ev=arr.find(e=>Date.now()<=e[1]);return ev||['明年 5/20 悟空生日',Date.UTC(y+1,4,20,0,0,0)];}
  function ensure(){
    const ny=$('kh-ny-slot'); if(ny && !$('kgen-v1010-ny-stable')){const s=document.createElement('span');s.id='kgen-v1010-ny-stable';ny.insertAdjacentElement('afterend',s);}
    const old=$('kgen-v102-festival-countdown'); if(old && !$('kgen-v1010-festival-stable')){const s=document.createElement('div');s.id='kgen-v1010-festival-stable';old.insertAdjacentElement('afterend',s);}
  }
  function update(){ensure();const ny=$('kgen-v1010-ny-stable');if(ny)ny.textContent='距跨年倒數 '+diffText(nextNY());const fs=$('kgen-v1010-festival-stable');if(fs){const ev=nextFestival();fs.textContent='下一個活動：'+ev[0]+'｜倒數 '+diffText(ev[1]);}}
  document.addEventListener('DOMContentLoaded',()=>{update();setInterval(update,60000);}); if(document.readyState!=='loading'){update();setInterval(update,60000);} setInterval(update,5000);
})();
