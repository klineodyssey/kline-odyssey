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
  const providers=[];
  const add=p=>{if(p?.request&&!providers.includes(p))providers.push(p)};
  add(globalThis.ethereum);for(const p of globalThis.ethereum?.providers||[])add(p);add(globalThis.trustwallet?.ethereum);add(globalThis.trustwallet);add(globalThis.BinanceChain);add(globalThis.okxwallet);add(globalThis.bitkeep?.ethereum);
  return providers[0]||null;
}

function siteRootPath(){
  const path=decodeURI(location.pathname||'');
  const marker='/K線西遊記/';
  const i=path.indexOf(marker);
  return i>=0?path.slice(0,i):'';
}

function wallet12345BridgeUrl(){
  const root=siteRootPath();
  const u=new URL(`${root}/wallet-12345.html`,location.origin);
  u.searchParams.set('autoconnect','1');
  u.searchParams.set('source','11520');
  u.searchParams.set('from','game-5d');
  u.searchParams.set('bridge','1');
  return u.href;
}

function installWalletLauncher(){
  const connect=document.getElementById('walletConnect');if(!connect||document.getElementById('walletLaunchSheet'))return;
  const title=document.querySelector('#walletPanel .walletHead b');if(title)title.textContent='🔗 12345 錢包｜BSC / KGEN';
  const msg=document.getElementById('walletMsg');if(msg&&!bestProvider())msg.textContent='12345 負責錢包選擇與入口；11520 只讀 BSC 56、地址、BNB、KGEN verified。';
  const sheet=document.createElement('section');sheet.id='walletLaunchSheet';sheet.innerHTML=`<h3>12345 錢包中心</h3><p>11520 不另建第二套錢包。由 12345 Wallet Bridge 負責 MetaMask、Trust Wallet、OKX、Bitget、Binance、Direct / WalletConnect 等既有錢包入口；回到可提供 EIP-1193 provider 的環境後，11520 只讀 BSC 56、地址、BNB 與 KGEN verified 餘額。</p><div class="wallet-actions"><a id="open12345Wallet" rel="noopener">前往 12345 錢包中心</a><button id="retry11520Wallet" type="button">重新偵測錢包</button><button id="close11520WalletSheet" type="button">關閉</button></div>`;document.body.appendChild(sheet);
  sheet.querySelector('#open12345Wallet').href=wallet12345BridgeUrl();
  sheet.querySelector('#close11520WalletSheet').onclick=()=>sheet.classList.remove('open');
  sheet.querySelector('#retry11520Wallet').onclick=()=>{if(bestProvider()){sheet.classList.remove('open');connect.click()}else sheet.querySelector('p').textContent='目前瀏覽器仍沒有 EIP-1193 provider。請先進 12345 錢包中心選擇錢包／開啟 DApp 連線，再回 11520 讀取 BSC/KGEN。'};
  connect.addEventListener('click',e=>{if(bestProvider())return;e.preventDefault();e.stopImmediatePropagation();sheet.classList.add('open')},true);
  let retrying=false;const retry=()=>{if(retrying||!bestProvider())return;retrying=true;sheet.classList.remove('open');queueMicrotask(()=>connect.click());setTimeout(()=>{retrying=false},600)};
  addEventListener('focus',retry);document.addEventListener('visibilitychange',()=>{if(!document.hidden)retry()});
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
