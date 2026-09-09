import {createBackpack,storeItem,removeItem,storeLivingLife,backpackSnapshot} from './backpack-runtime.mjs';
import {itemVisualDescriptor,renderItemPreview} from './item-visual-runtime.mjs';

const KEY='11520.backpack.v1';
function load(){try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');if(raw?.items&&raw?.capacitySlots)return raw}catch{}return createBackpack()}
let backpack=typeof localStorage!=='undefined'?load():createBackpack();
function save(){if(typeof localStorage!=='undefined')localStorage.setItem(KEY,JSON.stringify(backpack));}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function notice(text){const n=document.getElementById('backpackNotice');if(!n)return;n.textContent=text;n.hidden=false;clearTimeout(notice.t);notice.t=setTimeout(()=>{n.hidden=true},2400)}

function install(){
  if(typeof document==='undefined'||document.getElementById('backpackButton'))return;
  const style=document.createElement('style');style.id='backpackStyle';style.textContent=`
  #backpackButton{position:fixed;z-index:2400;right:72px;bottom:78px;width:50px;height:50px;border-radius:14px;border:1px solid #f1ca7366;background:#101923ee;color:#f1ca73;font-size:23px;box-shadow:0 7px 24px #0009;touch-action:manipulation}
  #backpackButton[aria-expanded="true"]{box-shadow:0 0 0 2px #f1ca7333,0 7px 24px #0009;background:#172231}
  #backpackPanel{position:fixed;z-index:2300;left:10px;right:70px;bottom:12px;max-height:min(66vh,520px);border:1px solid #f1ca7366;border-radius:16px;background:#08131df8;box-shadow:0 20px 70px #000d;display:none;overflow:hidden}
  #backpackPanel.open{display:grid;grid-template-rows:auto auto auto 1fr auto}.bpHead{display:flex;align-items:center;gap:8px;padding:11px;border-bottom:1px solid #fff1}.bpHead b{color:#f1ca73;flex:1}.bpStats{display:flex;gap:12px;padding:7px 11px;color:#9ca8b3;font-size:10px;border-bottom:1px solid #fff1}.bpNotice{margin:7px 10px 0;padding:7px 9px;border-radius:8px;border:1px solid #68e4ff44;background:#0b1a23;color:#9eeeff;font-size:10px}.bpGrid{padding:10px;overflow:auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.bpSlot{min-height:112px;border:1px solid #ffffff18;border-radius:11px;background:#ffffff06;padding:6px;position:relative;overflow:hidden}.bp3d{width:100%;aspect-ratio:1/1;display:block;border-radius:8px;background:radial-gradient(circle at 50% 38%,#17303b88,#07111900 72%)}.bpSlot b{display:block;font-size:10px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bpSlot small{display:block;color:#9ca8b3;font-size:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:34px}.bpSlot .shape{position:absolute;left:6px;top:6px;border:1px solid #ffffff24;border-radius:6px;background:#08131dcc;color:#b8d9e7;font-size:7px;padding:2px 4px;letter-spacing:.04em}.bpSlot button{position:absolute;right:4px;bottom:4px;border:0;border-radius:7px;background:#192b22;color:#aef0ba;font-size:9px;padding:4px 6px}.bpSlot button.discard{background:#341b1d;color:#ff9ca0}.bpEmpty{grid-column:1/-1;padding:24px;text-align:center;color:#9ca8b3;font-size:12px}.bpHint{padding:0 11px 10px;color:#8aa0ad;font-size:9px}
  body.game-clean-mode #backpackButton{display:block!important}@media(max-width:420px){#backpackButton{right:72px;bottom:76px;width:46px;height:46px}#backpackPanel{right:66px}.bpGrid{grid-template-columns:repeat(3,minmax(0,1fr))}.bpSlot{min-height:106px}}
  `;document.head.appendChild(style);
  const btn=document.createElement('button');btn.id='backpackButton';btn.type='button';btn.title='背包';btn.setAttribute('aria-label','開啟背包');btn.setAttribute('aria-expanded','false');btn.textContent='🎒';document.body.appendChild(btn);
  const panel=document.createElement('section');panel.id='backpackPanel';panel.setAttribute('aria-hidden','true');panel.innerHTML=`<div class="bpHead"><b>🎒 花果山背包 · 3D 物品識別</b></div><div class="bpStats" id="backpackStats"></div><div class="bpNotice" id="backpackNotice" hidden></div><div class="bpGrid" id="backpackGrid"></div><div class="bpHint">物品與角色採同一原則：先看 3D 外形即可辨識類型，再用名稱與 LIFE_ID／貨物資訊確認。寶物、材料、食物、KGEN、KAIOS/現鈔與活體貨箱使用不同幾何語言。</div>`;document.body.appendChild(panel);
  const syncToggle=()=>{const open=panel.classList.contains('open');btn.setAttribute('aria-expanded',String(open));btn.setAttribute('aria-label',open?'收合背包':'開啟背包');btn.title=open?'收合背包':'開啟背包';panel.setAttribute('aria-hidden',String(!open));btn.dataset.k11520BackpackOpen=open?'1':'0'};
  btn.onclick=()=>{panel.classList.toggle('open');syncToggle();render()};
  syncToggle();render();
}

async function render3dPreviews(items){
  for(const item of items){
    const canvas=document.querySelector(`canvas.bp3d[data-item-id="${CSS.escape(item.itemId)}"]`);if(!canvas)continue;
    try{await renderItemPreview(canvas,item,{size:88})}catch(error){canvas.dataset.item3d='error';canvas.setAttribute('aria-label',`${item.name} 3D preview unavailable`);console.warn('[11520 ITEM 3D]',item.itemId,error)}
  }
}

async function requestLivingRelease(item){
  if(globalThis.K11520LivingWorldInventory?.releaseItem){
    const r=await globalThis.K11520LivingWorldInventory.releaseItem(item.itemId);
    if(r?.ok){removeItem(backpack,item.itemId,1);save();render();notice(`${item.name} 已放回土地`)}else notice(`不能放出：${r?.reason||'WORLD_REJECTED'}`);
    return r;
  }
  const detail={item,handled:false,result:null};
  document.dispatchEvent(new CustomEvent('11520:release-life-request',{detail}));
  if(detail.handled&&detail.result?.ok){removeItem(backpack,item.itemId,1);save();render();notice(`${item.name} 已放回土地`);return detail.result;}
  notice('目前沒有 Living World 放出處理器，生命仍安全留在背包');
  return {ok:false,reason:'NO_LIVING_WORLD_RELEASE_HANDLER'};
}

function render(){
  if(typeof document==='undefined')return;
  const stats=document.getElementById('backpackStats'),grid=document.getElementById('backpackGrid');if(!stats||!grid)return;
  const s=backpackSnapshot(backpack);stats.textContent=`格數 ${s.usedSlots}/${s.capacitySlots} · 重量 ${s.usedWeight.toFixed(1)}/${s.capacityWeight}`;
  grid.innerHTML=s.items.length?s.items.map(i=>{const d=itemVisualDescriptor(i);return `<div class="bpSlot" data-item="${esc(i.itemId)}"><canvas class="bp3d" width="88" height="88" data-item-id="${esc(i.itemId)}"></canvas><span class="shape">${esc(d.label)}</span><b>${esc(i.name)}${i.qty>1?` ×${i.qty}`:''}</b><small>${esc(i.kind)}${i.lifeId?` · ${esc(i.lifeId)}`:''}</small><button class="${i.kind==='LIVING_CARGO'?'':'discard'}" data-action="${i.kind==='LIVING_CARGO'?'release':'discard'}" data-item-id="${esc(i.itemId)}">${i.kind==='LIVING_CARGO'?'放出':'丟棄'}</button></div>`}).join(''):`<div class="bpEmpty">背包目前是空的。靠近可採集生命或取得寶物後才會放入，不預塞假物品。</div>`;
  grid.querySelectorAll('[data-action]').forEach(b=>b.onclick=async()=>{const item=backpack.items.find(i=>i.itemId===b.dataset.itemId);if(!item)return;if(b.dataset.action==='release')await requestLivingRelease(item);else{removeItem(backpack,item.itemId,1);save();render();notice(`${item.name} 已丟棄`)}});
  void render3dPreviews(s.items);
}

export function addBackpackItem(item){const r=storeItem(backpack,item);if(r.ok){save();render()}return r}
export function captureLifeToBackpack(life,options){const r=storeLivingLife(backpack,life,options);if(r.ok){save();render()}return r}
export function getBackpack(){return backpackSnapshot(backpack)}
export function removeBackpackItem(itemId,qty=1){const r=removeItem(backpack,itemId,qty);if(r.ok){save();render()}return r}

if(typeof document!=='undefined')install();
if(typeof globalThis!=='undefined')globalThis.K11520Backpack={addItem:addBackpackItem,captureLife:captureLifeToBackpack,get:getBackpack,remove:removeBackpackItem};
