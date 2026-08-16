(function(){
  "use strict";

  const BASE = "./";
  const CONFIG_URL = BASE + "config/contracts.json";
  const ABI_URL = BASE + "abi/temple-heart.json";
  const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address,address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
    "function decimals() view returns (uint8)"
  ];
  const WISH_STATUS = ["尚未許願", "願望已建立", "三聖盃已通過", "可領發財金", "願望已完成", "願望已過期"];
  const WAITING = "等待新版心臟上鏈";
  const DISABLED = "新版財神心臟尚未啟用";
  const ASSET_PENDING = "ASSET_CANON_PENDING_HEART_FRONT";

  const state = {
    config: null, abi: null, chainId: 56, network: null, provider: null,
    resolution: null, heart: null, kgen: null, walletProvider: null,
    signer: null, account: null, walletChainId: null, civilizationId: null,
    wish: null, ritual: 0, latestTimestamp: 0, tx: null, refreshTimer: null
  };

  const $ = id => document.getElementById(id);
  const text = (id, value) => { const el = $(id); if(el) el.textContent = value; };
  const short = value => value ? value.slice(0, 6) + "…" + value.slice(-4) : "—";
  const bn = value => value == null ? null : window.ethers.BigNumber.from(value);
  const whole = value => value == null ? WAITING : Number(window.ethers.utils.formatUnits(value, 18)).toLocaleString("zh-TW", { maximumFractionDigits: 4 });
  const integer = value => value == null ? WAITING : window.ethers.BigNumber.from(value).toString();
  const unix = value => Number(value && value.toString ? value.toString() : value || 0);
  const dateTime = value => value ? new Date(value * 1000).toLocaleString("zh-TW", { hour12: false }) : "尚無紀錄";
  const bytes32 = value => {
    const clean = String(value || "").trim();
    if(/^0x[0-9a-fA-F]{64}$/.test(clean)) return clean;
    if(!clean) throw new Error("請輸入內容");
    return window.ethers.utils.id(clean);
  };
  const reason = error => {
    const raw = error && (error.reason || error.data && error.data.message || error.message) || "交易失敗";
    return String(raw).replace(/^execution reverted:?\s*/i, "").slice(0, 360);
  };

  function panelMarkup(){
    return `
      <div class="v34-console-head">
        <div><strong>悟空財神殿控制台</strong><small>TempleHeart V3.4 Frontend</small></div>
        <button id="v34-console-close" class="v34-close" type="button" aria-label="關閉控制台">×</button>
      </div>
      <div id="v34-heart-banner" class="v34-banner v34-waiting">${DISABLED}</div>
      <section class="v34-card v34-wallet-card">
        <div class="v34-card-title"><span>Wallet / Network</span><span id="v34-chain-pill">BSC Mainnet · 56</span></div>
        <div class="v34-actions">
          <select id="v34-network" aria-label="選擇網路"><option value="56">BSC Mainnet (56)</option><option value="97">BSC Testnet (97)</option></select>
          <button id="v34-connect" type="button">連接錢包</button>
          <button id="v34-walletconnect" type="button">WalletConnect</button>
          <button id="v34-switch" type="button">切換至所選網路</button>
          <button id="v34-refresh" type="button">重新讀取</button>
        </div>
        <div class="v34-inline"><span>Wallet</span><b id="v34-wallet">未連接</b><span id="v34-wallet-network">READ ONLY</span></div>
        <p class="v34-safe">只使用錢包 Provider 簽名；本頁永遠不要求 private key 或 mnemonic。</p>
      </section>
      <section class="v34-card">
        <div class="v34-card-title"><span>TempleHeart V3.4 鏈上儀表</span><span id="v34-current-address">PENDING</span></div>
        <div class="v34-metrics">
          ${metric("version", "version()")}${metric("heartBalance", "Heart KGEN")}${metric("operational", "遊戲生存")}
          ${metric("gameSurvivalGateWhole", "遊戲生存線")}${metric("baseFloorWhole", "獎勵儲備線")}${metric("baseCapWhole", "正常容量")}
          ${metric("totalPilgrims", "總香客")}${metric("totalWishers", "總許願者")}${metric("totalHolyCupPassed", "三聖盃通過")}
          ${metric("totalCustomerWallets", "鏈上香客 Wallet")}${metric("totalHeartbeats", "總心跳")}${metric("totalHeartbeatPaid", "心跳已付 KGEN")}
          ${metric("totalIgnites", "總點火")}${metric("totalIgnitePaid", "點火已付 KGEN")}${metric("totalFortuneClaimants", "發財金領取者")}
          ${metric("totalFortunePaid", "發財金已付 KGEN")}${metric("current11520Treasury", "11520 Treasury")}${metric("fortuneGame", "FortuneGame")}
        </div>
        <div class="v34-thresholds">
          <span><b>108000</b> Heart normal cap</span><span><b>20000</b> reward reserve floor</span><span><b>1888</b> FortuneGame survival gate</span>
        </div>
      </section>
      <section class="v34-card v34-legacy">
        <div class="v34-card-title"><span>鏈上生命沿革 · Legacy read-only</span><span>V3.2.6 DIRECT DEPLOYMENT</span></div>
        <div class="v34-grid"><span>Legacy Heart</span><b id="v34-legacy-address">—</b><span>Legacy KGEN balance</span><b id="v34-legacy-balance">—</b></div>
        <p>此地址只供歷史與餘額展示；不會送出任何 V3.4 selector。</p>
      </section>
      <section class="v34-card" data-v34-panel="wish">
        <div class="v34-card-title"><span>願望 / 三聖盃</span><span id="v34-wish-state">尚未連接</span></div>
        <label>文明 ID<input id="v34-civilization" placeholder="文明名稱或 bytes32" autocomplete="off"></label>
        <label>願望<input id="v34-wish" placeholder="願望內容或 wishHash bytes32" autocomplete="off"></label>
        <div class="v34-actions"><button class="v34-write" id="v34-make-wish" type="button">建立鏈上願望</button></div>
        <div class="v34-grid"><span>鏈上 Civilization ID</span><b id="v34-wish-civ">—</b><span>鏈上三聖盃</span><b id="v34-holy-chain">—</b></div>
        <div class="v34-cups" aria-label="三聖盃 UI ritual">
          <button id="v34-cup-1" type="button">聖盃一</button><button id="v34-cup-2" type="button" disabled>聖盃二</button><button id="v34-cup-3" type="button" disabled>聖盃三</button><button id="v34-cup-reset" type="button">重置儀式</button>
        </div>
        <p id="v34-cup-state">本機儀式 0/3；不代表鏈上資格。</p>
        <div class="v34-service-note">三聖盃驗證服務建設中。submitHolyCupProof 需要正式 signer/backend，本頁不產生假 signature。</div>
      </section>
      <section class="v34-card">
        <div class="v34-card-title"><span>心跳 Heartbeat</span><span>本次 1 KGEN</span></div>
        <div class="v34-grid"><span>Wallet cooldown</span><b id="v34-heartbeat-wallet">—</b><span>Civilization cooldown</span><b id="v34-heartbeat-civ">—</b><span>本 UTC hour</span><b id="v34-heartbeat-hour">— / 88</b><span>Heart reserve</span><b id="v34-heartbeat-reserve">—</b><span>下一次 eligibility</span><b id="v34-heartbeat-next">—</b></div>
        <button class="v34-write" id="v34-heartbeat" type="button">領取心跳 1 KGEN</button>
      </section>
      <section class="v34-card">
        <div class="v34-card-title"><span>點火 / 呼吸</span><span>本次 8 KGEN</span></div>
        <div class="v34-grid"><span>UTC Window</span><b>00:00:00–00:09:59</b><span>目前窗口</span><b id="v34-ignite-window">—</b><span>今日 Global</span><b id="v34-ignite-count">— / 88</b><span>Wallet eligibility</span><b id="v34-ignite-wallet">—</b><span>Civilization eligibility</span><b id="v34-ignite-civ">—</b><span>下一窗口</span><b id="v34-ignite-next">—</b></div>
        <button class="v34-write" id="v34-ignite" type="button">點火領取 8 KGEN</button>
      </section>
      <section class="v34-card">
        <div class="v34-card-title"><span>發財金</span><span>1–8 KGEN · 30 days · 500/epoch</span></div>
        <label>Alchemy proofId (bytes32)<input id="v34-proof" placeholder="0x…64 hex" autocomplete="off"></label>
        <div class="v34-grid"><span>預估值</span><b id="v34-fortune-preview">—</b><span>上次領取</span><b id="v34-fortune-last">—</b><span>上次領取時間</span><b id="v34-fortune-last-at">—</b><span>累積領取</span><b id="v34-fortune-total">—</b><span>累積自願還願</span><b id="v34-repay-total">—</b><span>下一輪還願資格</span><b id="v34-repaid">—</b><span>下一次可申請</span><b id="v34-fortune-next">—</b></div>
        <p>發財金領取後屬於玩家。未自願還願只會限制下一次發財金資格。</p>
        <button class="v34-write" id="v34-fortune" type="button">申請發財金</button>
      </section>
      <section class="v34-card">
        <div class="v34-card-title"><span>自願還願</span><span>approve → voluntaryRepayFortune</span></div>
        <label>自願還願 KGEN 數量<input id="v34-repay-amount" inputmode="decimal" placeholder="例如 1.0"></label>
        <p>此為自願還願。交易會先要求 KGEN approve，確認後才送出 voluntaryRepayFortune。</p>
        <button class="v34-write" id="v34-repay" type="button">自願還願</button>
      </section>
      <section class="v34-card">
        <div class="v34-card-title"><span>心臟調壓</span><span>Human-triggered only</span></div>
        <p>Heart 超過 108000 KGEN 時，超額血量可回流 11520。前端不會自動送出交易。</p>
        <button class="v34-write" id="v34-normalize" type="button">執行 normalizeHeartBalance()</button>
      </section>
      <section class="v34-card">
        <div class="v34-card-title"><span>訪客 / 香客</span><span>三種資料不混用</span></div>
        <div class="v34-grid"><span>網站匿名訪客</span><b id="v34-site-visitors">訪客統計暫不可用</b><span>鏈上香客</span><b id="v34-chain-pilgrims">${WAITING}</b><span>今日鏈上活躍</span><b id="v34-chain-active">${WAITING}</b></div>
      </section>
      <section class="v34-card v34-tx-card">
        <div class="v34-card-title"><span>交易狀態</span><b id="v34-tx-state">READY</b></div>
        <div class="v34-grid"><span>Action</span><b id="v34-tx-action">—</b><span>Tx Hash</span><b id="v34-tx-hash">—</b><span>BscScan</span><b id="v34-tx-link">—</b><span>Reason</span><b id="v34-tx-error">—</b></div>
      </section>`;
  }

  function metric(name, label){ return `<div class="v34-metric"><span>${label}</span><b data-v34-field="${name}">${WAITING}</b></div>`; }
  function setField(name, value){ document.querySelectorAll(`[data-v34-field="${name}"]`).forEach(el => el.textContent = value); }
  function setWrites(enabled, message){
    document.querySelectorAll(".v34-write").forEach(button => { button.disabled = !enabled; button.title = enabled ? "" : message; });
  }
  function setBanner(message, ok){
    const el = $("v34-heart-banner"); if(!el) return;
    el.textContent = message; el.classList.toggle("v34-ready", !!ok); el.classList.toggle("v34-waiting", !ok);
  }

  async function fetchJson(url){ const response = await fetch(url, { cache: "no-store" }); if(!response.ok) throw new Error(`${url} HTTP ${response.status}`); return response.json(); }
  function rpcProvider(network){ return new window.ethers.providers.JsonRpcProvider(network.rpcUrls[0], { chainId: network.chainId, name: network.key }); }

  async function loadNetwork(chainId){
    state.chainId = Number(chainId);
    state.network = window.KGENContractResolver.networkFor(state.config, state.chainId);
    if(!state.network) throw new Error("不支援此 chainId");
    state.provider = rpcProvider(state.network);
    $("v34-network").value = String(state.chainId);
    text("v34-chain-pill", `${state.network.name} · ${state.chainId}`);
    state.resolution = await window.KGENContractResolver.resolveCurrentHeart({
      config: state.config, chainId: state.chainId, provider: state.provider,
      contractFactory: (address) => new window.ethers.Contract(address, state.abi, state.provider)
    });
    const currentAddress = window.KGENContractResolver.addressOf(state.network.currentHeart);
    text("v34-current-address", currentAddress || "PENDING");
    if(state.resolution.ok){
      state.heart = state.resolution.contract;
      state.kgen = new window.ethers.Contract(state.network.kgen.address, ERC20_ABI, state.provider);
      setBanner(`TempleHeart ${state.resolution.version} 已驗證 · ${state.network.currentHeart.status}`, true);
    } else {
      state.heart = null;
      state.kgen = new window.ethers.Contract(state.network.kgen.address, ERC20_ABI, state.provider);
      setBanner(DISABLED, false);
    }
    await refreshAll();
  }

  async function readLegacy(){
    const legacy = window.KGENContractResolver.addressOf(state.network.legacyHeart);
    text("v34-legacy-address", legacy ? `${legacy} · READ ONLY` : "此網路無 Legacy Heart");
    if(!legacy){ text("v34-legacy-balance", "—"); return; }
    try { text("v34-legacy-balance", `${whole(await state.kgen.balanceOf(legacy))} KGEN`); }
    catch(_){ text("v34-legacy-balance", "Legacy balance 暫不可讀"); }
  }

  async function refreshDashboard(){
    if(!state.heart){
      document.querySelectorAll("[data-v34-field]").forEach(el => el.textContent = WAITING);
      text("v34-chain-pilgrims", WAITING); text("v34-chain-active", WAITING);
      setWrites(false, DISABLED); await readLegacy(); dispatchGame(false, null); return;
    }
    const names = ["version","isHeartGameOperational","gameSurvivalGateWhole","baseFloorWhole","baseCapWhole","totalPilgrims","totalWishers","totalHolyCupPassed","totalCustomerWallets","totalHeartbeats","totalHeartbeatPaid","totalIgnites","totalIgnitePaid","totalFortuneClaimants","totalFortunePaid","current11520Treasury","fortuneGame"];
    const calls = names.map(name => state.heart[name]());
    calls.push(state.kgen.balanceOf(state.resolution.address));
    const block = await state.provider.getBlock("latest"); state.latestTimestamp = block.timestamp;
    const results = await Promise.allSettled(calls);
    const value = index => results[index].status === "fulfilled" ? results[index].value : null;
    const map = Object.fromEntries(names.map((name, index) => [name, value(index)]));
    setField("version", map.version || WAITING);
    setField("heartBalance", value(names.length) == null ? "讀取失敗" : `${whole(value(names.length))} KGEN`);
    setField("operational", map.isHeartGameOperational == null ? "讀取失敗" : map.isHeartGameOperational ? "OPERATIONAL" : "低於 1888 · 遊戲暫停");
    ["gameSurvivalGateWhole","baseFloorWhole","baseCapWhole","totalPilgrims","totalWishers","totalHolyCupPassed","totalCustomerWallets","totalHeartbeats","totalIgnites","totalFortuneClaimants"].forEach(name => setField(name, integer(map[name])));
    ["totalHeartbeatPaid","totalIgnitePaid","totalFortunePaid"].forEach(name => setField(name, map[name] == null ? "尚未設定 / 讀取失敗" : `${whole(map[name])} KGEN`));
    setField("current11520Treasury", map.current11520Treasury && map.current11520Treasury !== window.ethers.constants.AddressZero ? short(map.current11520Treasury) : "尚未設定");
    setField("fortuneGame", map.fortuneGame && map.fortuneGame !== window.ethers.constants.AddressZero ? short(map.fortuneGame) : "PENDING");
    text("v34-chain-pilgrims", integer(map.totalCustomerWallets));
    try { text("v34-chain-active", integer(await state.heart.dailyActiveCustomerWallets(Math.floor(block.timestamp / 86400)))); } catch(_){ text("v34-chain-active", "讀取失敗"); }
    const walletReady = !!state.account && state.walletChainId === state.chainId;
    setWrites(walletReady, !state.account ? "請先連接錢包" : state.walletChainId !== state.chainId ? "錢包網路錯誤" : "");
    await readLegacy();
    await refreshEligibility(value(names.length));
    dispatchGame(!!map.isHeartGameOperational, map.fortuneGame);
  }

  async function refreshWish(){
    if(!state.heart || !state.account){ state.wish = null; text("v34-wish-state", state.account ? WAITING : "尚未連接"); return; }
    try {
      const wish = await state.heart.activeWish(state.account); state.wish = wish; state.civilizationId = wish.civilizationId;
      const status = Number(wish.status); text("v34-wish-state", WISH_STATUS[status] || `Status ${status}`);
      text("v34-wish-civ", wish.civilizationId); text("v34-holy-chain", status >= 2 ? "鏈上已通過" : "鏈上尚未通過");
      if(wish.civilizationId !== window.ethers.constants.HashZero && !$("v34-civilization").value) $("v34-civilization").value = wish.civilizationId;
    } catch(error){ state.wish = null; text("v34-wish-state", `讀取失敗：${reason(error)}`); }
  }

  async function refreshEligibility(heartBalance){
    const now = state.latestTimestamp || Math.floor(Date.now()/1000), hour = Math.floor(now/3600), day = Math.floor(now/86400), second = now % 86400;
    let hourClaims = null, dayClaims = null;
    try { hourClaims = await state.heart.heartbeatHourClaims(hour); } catch(_){}
    try { dayClaims = await state.heart.igniteDayClaims(day); } catch(_){}
    text("v34-heartbeat-hour", `${integer(hourClaims)} / 88`); text("v34-ignite-count", `${integer(dayClaims)} / 88`);
    const reserveOk = heartBalance && heartBalance.gte(window.ethers.utils.parseUnits("20001", 18));
    text("v34-heartbeat-reserve", reserveOk ? "高於 20000 reward reserve floor" : "Reserve 不足 / 不可確認");
    if(!state.account || !state.wish){
      ["v34-heartbeat-wallet","v34-heartbeat-civ","v34-heartbeat-next","v34-ignite-wallet","v34-ignite-civ"].forEach(id => text(id, "需連接 Wallet 與鏈上願望"));
      return;
    }
    const civ = state.wish.civilizationId;
    try {
      const [lastWallet,lastCiv,cooldown,lastDay,lastCivDay] = await Promise.all([
        state.heart.lastHeartbeatAt(state.account), state.heart.lastCivilizationHeartbeatAt(civ), state.heart.heartbeatCooldownSeconds(),
        state.heart.lastBreathDay(state.account), state.heart.lastCivilizationBreathDay(civ)
      ]);
      const walletNext = unix(lastWallet) + unix(cooldown), civNext = unix(lastCiv) + unix(cooldown), next = Math.max(walletNext, civNext);
      text("v34-heartbeat-wallet", now >= walletNext ? "可申請（合約最終判定）" : dateTime(walletNext));
      text("v34-heartbeat-civ", now >= civNext ? "可申請（合約最終判定）" : dateTime(civNext));
      text("v34-heartbeat-next", dateTime(next));
      text("v34-ignite-wallet", unix(lastDay) === day ? "今日已領" : "尚未領（合約最終判定）");
      text("v34-ignite-civ", unix(lastCivDay) === day ? "文明今日已領" : "文明尚未領（合約最終判定）");
    } catch(_){}
    try {
      const [preview, eligibility, ledger] = await Promise.all([state.heart.previewFortuneReward(civ), state.heart.nextFortuneEligibility(state.account), state.heart.fortuneLedger(state.account)]);
      text("v34-fortune-preview", `${whole(preview)} KGEN`);
      text("v34-fortune-last", `${whole(ledger.lastClaimAmount)} KGEN`); text("v34-fortune-last-at", dateTime(unix(ledger.lastClaimAt)));
      text("v34-fortune-total", `${whole(ledger.totalClaimed)} KGEN`); text("v34-repay-total", `${whole(ledger.totalVoluntaryRepaid)} KGEN`);
      text("v34-repaid", eligibility.repaymentSatisfied ? "已自願還願，可進下一輪" : "尚未自願還願；僅限制下一次資格");
      text("v34-fortune-next", eligibility.eligible ? "可申請（proof/合約最終判定）" : dateTime(unix(eligibility.cooldownEndsAt)));
    } catch(_){}
  }

  function updateClock(){
    const now = Math.floor(Date.now()/1000), second = now % 86400, open = second < 600;
    text("v34-ignite-window", open ? "OPEN（合約最終判定）" : "CLOSED");
    const next = open ? now + (600-second) : now + (86400-second);
    const remain = Math.max(0, next-now), h = String(Math.floor(remain/3600)).padStart(2,"0"), m=String(Math.floor(remain%3600/60)).padStart(2,"0"), s=String(remain%60).padStart(2,"0");
    text("v34-ignite-next", open ? `窗口剩餘 ${m}:${s}` : `下一個 UTC 00:00 · ${h}:${m}:${s}`);
  }

  async function refreshAll(){
    try { await refreshWish(); await refreshDashboard(); }
    catch(error){ setBanner(`${DISABLED} · ${reason(error)}`, false); setWrites(false, DISABLED); }
  }

  async function connectInjected(){
    if(!window.ethereum) throw new Error("找不到 Injected Wallet；可使用 MetaMask、Trust、OKX、Bitget 或 Binance Wallet");
    await connectRawProvider(window.ethereum, "Injected Wallet");
  }

  async function connectWalletConnect(){
    const walletConnect = await import("https://esm.sh/@walletconnect/ethereum-provider@2.23.10?bundle");
    const EthereumProvider = walletConnect.EthereumProvider || walletConnect.default;
    if(!EthereumProvider || !EthereumProvider.init) throw new Error("WalletConnect library 尚未載入");
    const projectId = state.config.walletConnect && state.config.walletConnect.projectId;
    const raw = await EthereumProvider.init({ projectId, chains:[state.chainId], optionalChains:[56,97], showQrModal:true, rpcMap:{56:state.config.networks["56"].rpcUrls[0],97:state.config.networks["97"].rpcUrls[0]} });
    await raw.connect(); await connectRawProvider(raw, "WalletConnect");
  }

  async function connectRawProvider(raw, label){
    state.walletProvider = raw;
    const web3Provider = new window.ethers.providers.Web3Provider(raw, "any");
    await web3Provider.send("eth_requestAccounts", []);
    const network = await web3Provider.getNetwork(); state.walletChainId = network.chainId;
    state.signer = web3Provider.getSigner(); state.account = await state.signer.getAddress();
    text("v34-wallet", `${short(state.account)} · ${label}`); text("v34-wallet-network", `Wallet chain ${state.walletChainId}`);
    if(raw.on){ raw.on("accountsChanged", () => location.reload()); raw.on("chainChanged", () => location.reload()); }
    await refreshAll();
  }

  async function switchNetwork(){
    if(!state.walletProvider && !window.ethereum) throw new Error("請先連接錢包");
    const raw = state.walletProvider || window.ethereum, hex = "0x" + state.chainId.toString(16);
    try { await raw.request({method:"wallet_switchEthereumChain", params:[{chainId:hex}]}); }
    catch(error){
      if(error.code !== 4902) throw error;
      await raw.request({method:"wallet_addEthereumChain",params:[{chainId:hex,chainName:state.network.name,nativeCurrency:state.network.nativeCurrency,rpcUrls:state.network.rpcUrls,blockExplorerUrls:[state.network.explorer]}]});
    }
    await connectRawProvider(raw, "Injected Wallet");
  }

  function signedHeart(){
    if(!state.resolution || !state.resolution.ok) throw new Error(DISABLED);
    if(!state.signer || !state.account) throw new Error("請先連接錢包");
    if(state.walletChainId !== state.chainId) throw new Error(`網路錯誤：Wallet ${state.walletChainId}，頁面 ${state.chainId}`);
    return new window.ethers.Contract(state.resolution.address, state.abi, state.signer);
  }

  function updateTx(snapshot){
    text("v34-tx-state", snapshot.state); text("v34-tx-action", snapshot.action || "—"); text("v34-tx-hash", snapshot.hash || "—"); text("v34-tx-error", snapshot.error || "—");
    const root = $("v34-tx-link"); if(root) root.innerHTML = snapshot.explorerUrl ? `<a href="${snapshot.explorerUrl}" target="_blank" rel="noopener">開啟 BscScan</a>` : "—";
  }

  async function transact(action, send){
    state.tx.setExplorer(state.network.explorer); state.tx.reset(action);
    try { const receipt = await state.tx.run(action, send); await refreshAll(); return receipt; }
    catch(error){ throw error; }
  }

  async function makeWish(){ const heart=signedHeart(); await transact("makeWish", () => heart.makeWish(bytes32($("v34-wish").value), bytes32($("v34-civilization").value))); }
  async function heartbeat(){ const heart=signedHeart(); await transact("heartbeatClaim", () => heart.heartbeatClaim()); }
  async function ignite(){ const heart=signedHeart(); await transact("igniteAndClaim", () => heart.igniteAndClaim()); }
  async function fortune(){ const proof=bytes32($("v34-proof").value); if(!/^0x[0-9a-fA-F]{64}$/.test($("v34-proof").value.trim())) throw new Error("proofId 必須是正式 bytes32，不會由前端虛構"); const heart=signedHeart(); await transact("fortuneClaim", () => heart.fortuneClaim(proof)); }
  async function repay(){
    const amountText=$("v34-repay-amount").value.trim(); if(!amountText || Number(amountText)<=0) throw new Error("請輸入自願還願數量");
    const amount=window.ethers.utils.parseUnits(amountText,18), heart=signedHeart(), token=new window.ethers.Contract(state.network.kgen.address,ERC20_ABI,state.signer);
    await transact("自願還願 · KGEN approve", () => token.approve(state.resolution.address,amount));
    await transact("自願還願 · voluntaryRepayFortune", () => heart.voluntaryRepayFortune(amount));
  }
  async function normalize(){ const heart=signedHeart(); await transact("normalizeHeartBalance", () => heart.normalizeHeartBalance()); }

  function bindAction(id, fn){ const el=$(id); if(el) el.addEventListener("click", async () => { try { await fn(); } catch(error){ if(state.tx && !["REVERTED","CONFIRMED"].includes(state.tx.snapshot().state)) state.tx.fail(error); setBanner(reason(error), false); } }); }
  function ritual(index){
    if(index !== state.ritual + 1) return;
    state.ritual=index; for(let i=1;i<=3;i++){ const b=$("v34-cup-"+i); b.classList.toggle("v34-cup-done",i<=index); b.disabled=i>index+1; }
    text("v34-cup-state", `本機儀式 ${index}/3；只代表 UI ritual state，不代表鏈上資格。`);
  }

  function dispatchGame(operational, heartGame){
    const configured = state.network && window.KGENContractResolver.addressOf(state.network.fortuneGame);
    const heartReady = !!state.heart;
    const belowGate = heartReady && !operational;
    window.dispatchEvent(new CustomEvent("kgen:fortune-game-state", { detail:{ ready:false, reason: belowGate ? "HEART_BELOW_1888" : "FORTUNE_GAME_PENDING", message: belowGate ? "悟空心臟低於 1888 KGEN，漲跌遊戲暫停，等待補血。" : "漲跌遊戲建設中", configuredAddress:configured, heartAddress:heartGame } }));
  }

  function bindMobilePanels(){
    const body=document.body, heart=$("kgen-heart-live-panel"), nav=$("universe-nav"), game=$("bet-live-panel"), ai=$("kgen-ai-service-panel"), kline=$("kline-chart-panel");
    function closeOthers(keep){ if(keep!=="heart" && heart) closeHeart(); if(keep!=="rules" && nav) nav.classList.remove("v34-drawer-open"); if(keep!=="game" && game){ if(window.KGENFortuneGameUI) window.KGENFortuneGameUI.close(); else game.classList.remove("v34-panel-open","kgen-v30-overlay-open"); } if(keep!=="ai" && ai) ai.classList.remove("v34-ai-open"); if(keep!=="kline" && kline) kline.classList.remove("v34-kline-open"); }
    function closeHeart(){ if(!heart)return; heart.setAttribute("aria-hidden","true"); heart.classList.remove("v34-drawer-open"); const toggle=$("kgen-heart-toggle"); if(toggle){ toggle.setAttribute("aria-expanded","false"); const label=toggle.querySelector(".kgen-heart-state"); if(label) label.textContent="展開"; } }
    $("v34-console-close").addEventListener("click",closeHeart);
    const toggle=$("kgen-heart-toggle"); if(toggle){ toggle.addEventListener("pointerdown",()=>closeOthers("heart")); toggle.addEventListener("click",()=>setTimeout(()=>{ const open=toggle.getAttribute("aria-expanded")==="true"; if(open) heart.classList.add("v34-drawer-open");},0)); }
    if(nav && !nav.querySelector(".v34-nav-close")){ const b=document.createElement("button"); b.type="button"; b.className="v34-nav-close"; b.textContent="× 關閉神規"; b.addEventListener("click",()=>nav.classList.remove("v34-drawer-open")); nav.prepend(b); }
    if(kline){
      const toggleButton=document.createElement("button"); toggleButton.id="v34-kline-toggle"; toggleButton.type="button"; toggleButton.textContent="K線"; toggleButton.addEventListener("pointerdown",event=>{event.preventDefault();closeOthers("kline");kline.classList.toggle("v34-kline-open");}); document.body.appendChild(toggleButton);
      const closeButton=document.createElement("button"); closeButton.type="button"; closeButton.className="v34-kline-close"; closeButton.textContent="× 關閉 K線"; closeButton.addEventListener("pointerdown",event=>{event.preventDefault();kline.classList.remove("v34-kline-open");}); kline.prepend(closeButton);
    }
    document.addEventListener("click", event=>{ const button=event.target.closest("button"); if(!button)return; const label=button.textContent||""; if(label.includes("右側神規")){ closeOthers("rules"); nav && nav.classList.toggle("v34-drawer-open"); } });
    if(ai){ const head=ai.querySelector(".kgen-ai-head, .ai-head, header"); if(head) head.addEventListener("click",()=>{closeOthers("ai");ai.classList.toggle("v34-ai-open");}); }
    window.KGENMobilePanels={
      closeOthers:closeOthers,
      openGame:()=>{closeOthers("game");window.KGENFortuneGameUI&&window.KGENFortuneGameUI.toggle();},
      openRules:()=>{closeOthers("rules");if(!nav)return;if(innerWidth<=900)nav.classList.toggle("v34-drawer-open");else nav.style.display=getComputedStyle(nav).display==="none"?"flex":"none";}
    };
    body.classList.add("v34-mobile-panels-ready");
  }

  function bindAssetFallback(){
    const image=$("fairy-img"); if(!image)return;
    function onError(){ if(image.src.includes("heart-front.png")){ console.warn(ASSET_PENDING); image.dataset.assetCanon=ASSET_PENDING; image.src="./assets/heart.png"; if(!document.querySelector(".v34-asset-pending")){ const note=document.createElement("span"); note.className="v34-asset-pending"; note.textContent=ASSET_PENDING; (image.parentElement||document.body).appendChild(note); } } }
    image.addEventListener("error",onError,true);
    if(image.complete && image.naturalWidth===0) onError();
  }

  function bindEvents(){
    bindAction("v34-connect",connectInjected); bindAction("v34-walletconnect",connectWalletConnect); bindAction("v34-switch",switchNetwork); bindAction("v34-refresh",refreshAll);
    bindAction("v34-make-wish",makeWish); bindAction("v34-heartbeat",heartbeat); bindAction("v34-ignite",ignite); bindAction("v34-fortune",fortune); bindAction("v34-repay",repay); bindAction("v34-normalize",normalize);
    $("v34-network").addEventListener("change",event=>loadNetwork(Number(event.target.value)));
    [1,2,3].forEach(i=>$("v34-cup-"+i).addEventListener("click",()=>ritual(i)));
    $("v34-cup-reset").addEventListener("click",()=>{state.ritual=0;[1,2,3].forEach(i=>{const b=$("v34-cup-"+i);b.classList.remove("v34-cup-done");b.disabled=i!==1;});text("v34-cup-state","本機儀式 0/3；不代表鏈上資格。");});
    window.addEventListener("kgen:visitor-stats",event=>text("v34-site-visitors",event.detail && event.detail.available ? integer(event.detail.uniqueVisitors) : "訪客統計暫不可用"));
  }

  async function init(){
    const root=$("kgen-heart-live-panel"); if(!root || !window.ethers || !window.KGENContractResolver || !window.KGENTransactionState) return;
    document.body.classList.add("kgen-v34-active"); root.innerHTML=panelMarkup();
    state.tx=new window.KGENTransactionState.TransactionController({onChange:updateTx});
    bindEvents(); bindMobilePanels(); bindAssetFallback(); updateClock(); setInterval(updateClock,1000);
    try {
      [state.config,state.abi]=await Promise.all([fetchJson(CONFIG_URL),fetchJson(ABI_URL).then(doc=>doc.abi)]);
      let detected=56; if(window.ethereum){ try { const raw=await window.ethereum.request({method:"eth_chainId"}); const id=window.KGENContractResolver.normalizeChainId(raw); if(id===56||id===97) detected=id; }catch(_){} }
      await loadNetwork(detected); state.refreshTimer=setInterval(()=>{ if(!document.hidden) refreshAll(); },20000);
    } catch(error){ setBanner(`${DISABLED} · ${reason(error)}`,false); setWrites(false,DISABLED); }
    window.web3=Object.assign(window.web3||{}, { connect:connectInjected, smartConnect:connectInjected, connectWalletConnect, openWalletHub:()=>$("walletHubOverlay") && ($("walletHubOverlay").style.display="flex") });
    window.templeOps=Object.assign({},window.templeOps||{}, {
      approve:()=>$("v34-repay") && $("v34-repay").focus(), cup:()=>ritual(Math.min(3,state.ritual+1)), resetCup:()=>$("v34-cup-reset") && $("v34-cup-reset").click(),
      fortune:fortune, heartbeat:heartbeat, ignite:ignite, wish:makeWish, vow:repay,
      lamp:()=>setBanner("V3.4 無此操作",false), festival:()=>setBanner("V3.4 無此操作",false), newyear:()=>setBanner("V3.4 無此操作",false)
    });
    window.KGENTempleHeartRuntime={ state, refresh:refreshAll, connectInjected, connectWalletConnect, switchNetwork, loadNetwork };
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true}); else init();
})();
