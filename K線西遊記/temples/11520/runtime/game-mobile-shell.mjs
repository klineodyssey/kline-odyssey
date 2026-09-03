const is11520Game=typeof document!=='undefined'&&/\/temples\/11520\/game-5d\.html$/i.test(location.pathname);

function style(){
  if(!is11520Game||document.getElementById('gameMobileShellStyle'))return;
  const s=document.createElement('style');s.id='gameMobileShellStyle';s.textContent=`
  .hud-drawer-toggle{position:fixed;z-index:920;border:1px solid #68e4ff66;background:#09131ddd;color:#8ceaff;border-radius:10px;padding:7px 9px;font:700 10px system-ui;box-shadow:0 6px 20px #0008;touch-action:manipulation}
  .hud-drawer-animate{transition:transform .2s ease,opacity .2s ease}
  .hud-collapsed-left{transform:translateX(calc(-100% - 14px))!important}.hud-collapsed-right{transform:translateX(calc(100% + 14px))!important}.hud-collapsed-top{transform:translateY(calc(-100% - 14px))!important}
  #hudToggleAxes{right:8px;top:72px}#hudToggleTele{left:8px;top:177px}#hudToggleMonster{right:8px;top:177px}#hudToggleMap{left:8px;top:256px}#hudToggleParams{right:8px;bottom:360px}
  #walletLaunchSheet{position:fixed;z-index:2200;left:10px;right:10px;bottom:12px;border:1px solid #68e4ff66;border-radius:16px;background:#08131df5;padding:14px;box-shadow:0 18px 60px #000c;display:none}
  #walletLaunchSheet.open{display:block}#walletLaunchSheet h3{margin:0 0 8px;color:#8ceaff}#walletLaunchSheet p{margin:5px 0 10px;color:#aab5bf;font-size:12px;line-height:1.45}
  #walletLaunchSheet .wallet-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}#walletLaunchSheet button,#walletLaunchSheet a{display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:10px;border:1px solid #68e4ff55;background:#101d28;color:#eef;text-decoration:none;font-weight:700}
  @media(max-width:420px){#hudToggleAxes{top:70px}#hudToggleTele,#hudToggleMonster{top:176px}#hudToggleMap{top:255px}#hudToggleParams{right:4px;bottom:346px}.hud-drawer-toggle{padding:6px 8px;font-size:9px}}
  `;document.head.appendChild(s);
}

function addDrawer({el,id,label,side,storageKey,defaultCollapsed=false}){
  if(!el||document.getElementById(id))return;
  el.classList.add('hud-drawer-animate');
  const btn=document.createElement('button');btn.id=id;btn.className='hud-drawer-toggle';btn.type='button';btn.textContent=label;btn.setAttribute('aria-label',`收合或展開${label}`);document.body.appendChild(btn);
  const cls=side==='left'?'hud-collapsed-left':side==='right'?'hud-collapsed-right':'hud-collapsed-top';
  const saved=localStorage.getItem(storageKey);let collapsed=saved==null?defaultCollapsed:saved==='1';
  const render=()=>{el.classList.toggle(cls,collapsed);btn.textContent=`${label}${collapsed?'›':'‹'}`;btn.setAttribute('aria-expanded',String(!collapsed));};
  btn.addEventListener('click',()=>{collapsed=!collapsed;localStorage.setItem(storageKey,collapsed?'1':'0');render()});render();
}

function bestProvider(){
  const c=[globalThis.trustwallet?.ethereum,globalThis.ethereum,globalThis.BinanceChain,globalThis.okxwallet];
  return c.find(p=>p?.request)||null;
}

function trustDappUrl(){return `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(location.href)}`}

async function copyUrl(btn){
  try{await navigator.clipboard.writeText(location.href);const old=btn.textContent;btn.textContent='已複製';setTimeout(()=>btn.textContent=old,1200)}catch{prompt('複製此網址到錢包 DApp Browser',location.href)}
}

function installWalletLauncher(){
  const connect=document.getElementById('walletConnect');if(!connect||document.getElementById('walletLaunchSheet'))return;
  const sheet=document.createElement('section');sheet.id='walletLaunchSheet';sheet.innerHTML=`<h3>連接真實 BSC 錢包</h3><p>目前頁面會優先使用錢包提供的 EIP-1193 provider。一般 Chrome/Safari 沒有注入式錢包時，請用錢包的 DApp Browser 開啟本頁；連線後只讀地址、BNB、KGEN verified 餘額，不會自動簽名或送交易。</p><div class="wallet-actions"><a id="openTrust11520" rel="noopener">Trust Wallet 開啟</a><button id="copy11520Url" type="button">複製 DApp 網址</button><button id="retry11520Wallet" type="button">重新偵測錢包</button><button id="close11520WalletSheet" type="button">關閉</button></div><p>WalletConnect v2 原地配對尚未啟用：需要正式 Reown/WalletConnect projectId 與網域 allowlist，不能用假的 ID。</p>`;document.body.appendChild(sheet);
  sheet.querySelector('#openTrust11520').href=trustDappUrl();sheet.querySelector('#copy11520Url').onclick=e=>copyUrl(e.currentTarget);sheet.querySelector('#close11520WalletSheet').onclick=()=>sheet.classList.remove('open');sheet.querySelector('#retry11520Wallet').onclick=()=>{if(bestProvider()){sheet.classList.remove('open');connect.click()}else sheet.querySelector('p').textContent='仍未偵測到注入式 EVM provider；請在 Trust Wallet / 其他 EVM 錢包的 DApp Browser 內開啟本頁。'};
  connect.addEventListener('click',e=>{if(bestProvider())return;e.preventDefault();e.stopImmediatePropagation();sheet.classList.add('open')},true);
}

export function install11520MobileShell(){
  if(!is11520Game)return;style();
  addDrawer({el:document.getElementById('axes'),id:'hudToggleAxes',label:'K市場',side:'top',storageKey:'11520.hud.axes'});
  addDrawer({el:document.querySelector('.tele'),id:'hudToggleTele',label:'座標',side:'left',storageKey:'11520.hud.tele'});
  addDrawer({el:document.querySelector('.monsterHud'),id:'hudToggleMonster',label:'生命',side:'right',storageKey:'11520.hud.monster'});
  addDrawer({el:document.querySelector('.minimapWrap'),id:'hudToggleMap',label:'地圖',side:'left',storageKey:'11520.hud.map'});
  addDrawer({el:document.querySelector('.sliderDock'),id:'hudToggleParams',label:'參數',side:'right',storageKey:'11520.hud.params'});
  installWalletLauncher();
}

if(is11520Game){queueMicrotask(install11520MobileShell)}
