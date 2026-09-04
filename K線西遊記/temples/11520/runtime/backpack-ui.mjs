import {createBackpack,storeItem,removeItem,storeLivingLife,backpackSnapshot} from './backpack-runtime.mjs';

const KEY='11520.backpack.v1';
function load(){try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');if(raw?.items&&raw?.capacitySlots)return raw}catch{}return createBackpack()}
let backpack=typeof localStorage!=='undefined'?load():createBackpack();
function save(){if(typeof localStorage!=='undefined')localStorage.setItem(KEY,JSON.stringify(backpack));}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function icon(item){if(item.kind==='TREASURE')return'💎';return({COW:'🐄',FISH:'🐟',SHRIMP:'🦐',CHICKEN:'🐔',DUCK:'🦆'}[item.species]||'🎒')}

function install(){
  if(typeof document==='undefined'||document.getElementById('backpackButton'))return;
  const style=document.createElement('style');style.id='backpackStyle';style.textContent=`
  #backpackButton{position:fixed;z-index:980;right:72px;bottom:78px;width:50px;height:50px;border-radius:14px;border:1px solid #f1ca7366;background:#101923ee;color:#f1ca73;font-size:23px;box-shadow:0 7px 24px #0009;touch-action:manipulation}
  #backpackPanel{position:fixed;z-index:2300;left:10px;right:70px;bottom:12px;max-height:min(66vh,520px);border:1px solid #f1ca7366;border-radius:16px;background:#08131df8;box-shadow:0 20px 70px #000d;display:none;overflow:hidden}
  #backpackPanel.open{display:grid;grid-template-rows:auto auto 1fr}.bpHead{display:flex;align-items:center;gap:8px;padding:11px;border-bottom:1px solid #fff1}.bpHead b{color:#f1ca73;flex:1}.bpHead button{width:38px;height:38px;border-radius:10px;border:1px solid #ffffff22;background:#101923;color:#fff}.bpStats{display:flex;gap:12px;padding:7px 11px;color:#9ca8b3;font-size:10px;border-bottom:1px solid #fff1}.bpGrid{padding:10px;overflow:auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.bpSlot{min-height:78px;border:1px solid #ffffff18;border-radius:11px;background:#ffffff06;padding:7px;position:relative}.bpSlot .ico{font-size:25px}.bpSlot b{display:block;font-size:10px;margin-top:3px}.bpSlot small{display:block;color:#9ca8b3;font-size:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bpSlot button{position:absolute;right:4px;bottom:4px;border:0;border-radius:7px;background:#341b1d;color:#ff9ca0;font-size:9px;padding:4px 6px}.bpEmpty{grid-column:1/-1;padding:24px;text-align:center;color:#9ca8b3;font-size:12px}.bpHint{padding:0 11px 10px;color:#8aa0ad;font-size:9px}
  body.game-clean-mode #backpackButton{display:block!important}@media(max-width:420px){#backpackButton{right:72px;bottom:76px;width:46px;height:46px}#backpackPanel{right:66px}.bpGrid{grid-template-columns:repeat(3,minmax(0,1fr))}}
  `;document.head.appendChild(style);
  const btn=document.createElement('button');btn.id='backpackButton';btn.type='button';btn.title='背包';btn.setAttribute('aria-label','開啟背包');btn.textContent='🎒';document.body.appendChild(btn);
  const panel=document.createElement('section');panel.id='backpackPanel';panel.innerHTML=`<div class="bpHead"><b>🎒 花果山背包</b><button id="backpackClose">×</button></div><div class="bpStats" id="backpackStats"></div><div class="bpGrid" id="backpackGrid"></div><div class="bpHint">可收納寶物、材料，以及已成功捕捉的牛、魚、蝦、雞、鴨。活體保留 LIFE_ID；放回土地時由 Living World 接續生命狀態。</div>`;document.body.appendChild(panel);
  btn.onclick=()=>{panel.classList.toggle('open');render()};panel.querySelector('#backpackClose').onclick=()=>panel.classList.remove('open');
  render();
}
function render(){if(typeof document==='undefined')return;const stats=document.getElementById('backpackStats'),grid=document.getElementById('backpackGrid');if(!stats||!grid)return;const s=backpackSnapshot(backpack);stats.textContent=`格數 ${s.usedSlots}/${s.capacitySlots} · 重量 ${s.usedWeight.toFixed(1)}/${s.capacityWeight}`;grid.innerHTML=s.items.length?s.items.map(i=>`<div class="bpSlot" data-item="${esc(i.itemId)}"><div class="ico">${icon(i)}</div><b>${esc(i.name)}${i.qty>1?` ×${i.qty}`:''}</b><small>${esc(i.kind)}${i.lifeId?` · ${esc(i.lifeId)}`:''}</small><button data-remove="${esc(i.itemId)}">丟出</button></div>`).join(''):`<div class="bpEmpty">背包目前是空的。靠近可採集生命或取得寶物後才會放入，不預塞假物品。</div>`;grid.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{removeItem(backpack,b.dataset.remove,1);save();render()})}

export function addBackpackItem(item){const r=storeItem(backpack,item);if(r.ok){save();render()}return r}
export function captureLifeToBackpack(life,options){const r=storeLivingLife(backpack,life,options);if(r.ok){save();render()}return r}
export function getBackpack(){return backpackSnapshot(backpack)}
export function removeBackpackItem(itemId,qty=1){const r=removeItem(backpack,itemId,qty);if(r.ok){save();render()}return r}

if(typeof document!=='undefined')install();
if(typeof globalThis!=='undefined')globalThis.K11520Backpack={addItem:addBackpackItem,captureLife:captureLifeToBackpack,get:getBackpack,remove:removeBackpackItem};
