/* KGEN_META
VERSION: 1.0.3
STATUS: ACTIVE / UI-ONLY
FORMAL_ORGAN_NAME: 11520 Character Status Runtime
PURPOSE: Give the player a readable HP summary and an inspectable character card from the visible avatar/character organ. Reads current browser UI/runtime state only; no wallet, trade, chain, payment, treasury, governance, or secret mutation.
*/

const $=s=>document.querySelector(s);
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const fmt=(v,d=1)=>n(v).toLocaleString(undefined,{maximumFractionDigits:d});

function readHp(){
  const raw=n($('#hp')?.textContent||100);
  const max=100;
  const pct=Math.max(0,Math.min(100,raw/max*100));
  return {current:raw,max,pct,status:raw<=0?'倒下':raw<=25?'危急':raw<=60?'受傷':'健康'};
}
function coords(){const p=globalThis.__K11520_WORLD_COORDS__?.physical||{};return{x:n(p.x),y:n(p.y),z:n(p.z)}}
function drive(){const d=globalThis.__K11520_COMBAT_DRIVE__||globalThis.__K11520_COMBAT_DRIVE_LIVE__||{};return{c:n(d.c),lots:n(d.lots),kaiosMass:n(d.kaiosMass)}}
function positions(){return ['KX','KY','KZ'].map(axis=>{const card=document.querySelector(`[data-axis="${axis}"]`);return{axis,text:(card?.querySelector('.pos')?.textContent||'空倉').trim()}})}
function ensureHpDetail(){let el=$('#k11520HpDetail');if(el)return el;const host=$('.monsterHud');if(!host)return null;el=document.createElement('div');el.id='k11520HpDetail';el.style.cssText='font-size:8px;line-height:1.25;color:#dff7ff;margin-top:2px;font-weight:800';const hpbar=$('#hpbar')?.parentElement;host.insertBefore(el,hpbar?.nextSibling||host.firstChild);return el}
function renderHp(){const h=readHp(),el=ensureHpDetail();if(el)el.textContent=`HP ${Math.round(h.current)} / ${h.max} · ${h.pct.toFixed(1)}% · ${h.status}`;document.documentElement.dataset.k11520HpStatus=h.status;return h}
function characterEntity(){const h=readHp(),p=coords(),d=drive();return{hp:h,p,d,positions:positions(),kaios:n($('#topKaios')?.textContent?.replace(/,/g,''))}}
function openCard(){const sheet=$('#sheet'),title=$('#sheetTitle'),body=$('#sheetBody');if(!sheet||!title||!body)return false;const x=characterEntity();title.textContent='角色資料';body.innerHTML=`<div class="card" id="k11520CharacterCard"><h3>悟空 · 11520 玩家</h3><p><b>生命：</b>${Math.round(x.hp.current)} / ${x.hp.max} (${x.hp.pct.toFixed(1)}%) · ${x.hp.status}</p><p><b>KAIOS：</b>${fmt(x.kaios,1)}</p><p><b>XYZ：</b>X ${fmt(x.p.x,2)} / Y ${fmt(x.p.y,2)} / Z ${fmt(x.p.z,2)}</p><p><b>C 曲速：</b>${x.d.c}C</p><p><b>口數：</b>${fmt(x.d.lots,2)}口${x.d.kaiosMass?` · ${fmt(x.d.kaiosMass,0)} KAIOS 質量`:''}</p>${x.positions.map(v=>`<p><b>${v.axis}：</b>${v.text}</p>`).join('')}<p class="muted">角色資料為 11520 遊戲狀態顯示；不代表鏈上資產已被移動或結算。</p></div>`;$('#dock')?.classList.remove('open');sheet.classList.add('open');sheet.style.setProperty('z-index','12000','important');globalThis.__K11520_CHARACTER_CARD__=x;return true}
function bindCharacterOrgan(){for(const el of document.querySelectorAll('#dock button,.dock button,[data-organ]')){const text=((el.textContent||'')+' '+(el.title||'')+' '+(el.getAttribute('aria-label')||'')).trim();if(!/角色|character|🧍/i.test(text)||el.dataset.k11520CharacterInspect)continue;el.dataset.k11520CharacterInspect='1';el.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openCard()},{capture:true})}}
function bindAvatarTap(){const canvas=$('#three');if(!canvas||canvas.dataset.k11520AvatarInspect)return;canvas.dataset.k11520AvatarInspect='1';canvas.addEventListener('k11520:player-tap',()=>openCard())}
function tick(){renderHp();bindCharacterOrgan();bindAvatarTap()}
export function install11520CharacterStatus(){if(typeof document==='undefined')return null;tick();clearInterval(globalThis.__K11520_CHARACTER_STATUS_TIMER__);globalThis.__K11520_CHARACTER_STATUS_TIMER__=setInterval(tick,250);globalThis.__K11520_CHARACTER_STATUS_API__={openCard,readHp,characterEntity,renderHp};globalThis.__K11520_CHARACTER_STATUS__={version:'1.0.3',hpDetail:true,characterCard:true,avatarTap:true,avatarRaycast:true,worldTapPassthrough:true,simulationOnly:true};return globalThis.__K11520_CHARACTER_STATUS__}
