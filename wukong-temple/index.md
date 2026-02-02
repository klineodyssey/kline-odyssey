---
layout: default
title: 五指山・悟空財神廟｜信念與紀律
permalink: /wukong-temple/
---

<!-- ✅ 五指山・悟空財神廟（定稿版）｜最新 commit 續寫：直接覆蓋這份 index.md 即可 -->
<!-- 檔案建議路徑：/wukong-temple/index.md -->

<!-- =========================
     右上角浮動視窗：總訪客 / 今日訪客
     ========================= -->
<div id="wm-float"
  style="position:fixed; top:14px; right:14px; z-index:9999;
         width:min(320px, 92vw);
         border:1px solid #111; border-radius:14px;
         background:#fff; padding:12px 14px;
         box-shadow:0 10px 30px rgba(0,0,0,.12);">
  <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
    <div style="font-weight:900; letter-spacing:.3px;">Mount Five-Finger · Wukong Discipline Temple</div>
    <button id="wm-float-toggle"
      style="border:1px solid #111; background:#fff; border-radius:999px;
             padding:6px 10px; font-weight:800; cursor:pointer;">
      Hide
    </button>
  </div>

  <div id="wm-float-body" style="margin-top:10px;">
    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <div style="flex:1; min-width:130px; border:1px solid #111; border-radius:12px; padding:10px;">
        <div style="font-size:12px; opacity:.75;">Total Visitors</div>
        <div id="wm-total" style="font-size:22px; font-weight:900;">...</div>
      </div>
      <div style="flex:1; min-width:130px; border:1px solid #111; border-radius:12px; padding:10px;">
        <div style="font-size:12px; opacity:.75;">Today Visitors</div>
        <div id="wm-today" style="font-size:22px; font-weight:900;">...</div>
      </div>
    </div>

    <div style="margin-top:10px; font-size:12px; opacity:.75; line-height:1.35;">
      This counter works in two modes:
      <br>• Default: local-only (per device).
      <br>• Global mode: connect a Google Apps Script Web App URL (optional).
    </div>
  </div>
</div>

<script>
/* =========================================
   五指山・悟空財神廟｜核心設定（可改一個地方就好）
   1) GAS_WEBAPP_URL 留空 => 本機計數與本機燈牆（不會影響 GitHub Pages）
   2) 填入 GAS Web App URL => 全站「總訪客/今日訪客」與「公共光明燈牆」可變成全球共享
   ========================================= */
const GAS_WEBAPP_URL = ""; // 例: "https://script.google.com/macros/s/xxxxxxxxxxxxxxxx/exec"

/* ========= 時區：台灣 UTC+8，避免 UTC 跨日 ========= */
function twISODate() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const tw  = new Date(utc + 8 * 3600000);
  return tw.toISOString().slice(0, 10);
}

/* ========= 浮窗：顯示/隱藏 ========= */
(function initFloat(){
  const btn = document.getElementById("wm-float-toggle");
  const body = document.getElementById("wm-float-body");
  const key = "wm_float_hidden";
  const hidden = localStorage.getItem(key) === "1";
  if (hidden) { body.style.display = "none"; btn.innerText = "Show"; }

  btn.addEventListener("click", () => {
    const isHidden = body.style.display === "none";
    body.style.display = isHidden ? "block" : "none";
    btn.innerText = isHidden ? "Hide" : "Show";
    localStorage.setItem(key, isHidden ? "0" : "1");
  });
})();

/* ========= 訪客計數：本機模式 ========= */
function localVisitTick() {
  const day = twISODate();
  const totalKey = "wm_total_visits";
  const todayKey = "wm_today_visits_" + day;

  let total = parseInt(localStorage.getItem(totalKey) || "0", 10);
  let today = parseInt(localStorage.getItem(todayKey) || "0", 10);

  total += 1;
  today += 1;

  localStorage.setItem(totalKey, String(total));
  localStorage.setItem(todayKey, String(today));

  return { total, today };
}

/* ========= 訪客計數：GAS 模式（可選） ========= */
async function gasVisitTick() {
  const day = twISODate();
  const url = GAS_WEBAPP_URL + "?action=visit&day=" + encodeURIComponent(day);
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error("GAS visit failed");
  return await res.json(); // { total, today }
}

/* ========= 更新浮窗數字 ========= */
async function updateCounters() {
  let data;
  try {
    if (GAS_WEBAPP_URL) data = await gasVisitTick();
    else data = localVisitTick();
  } catch (e) {
    data = localVisitTick();
  }
  document.getElementById("wm-total").innerText = data.total ?? "0";
  document.getElementById("wm-today").innerText = data.today ?? "0";
}

updateCounters();
</script>

# 🏯 五指山・悟空財神廟
## 信念不是祈求，是紀律

這不是一座求財的廟。  
這是一個提醒你不要亂來的地方。

在《K線西遊記》的宇宙中，悟空不保證你賺錢。  
他只提醒你一件事：

> 市場只獎勵守紀律的人。

---

## KGEN 的定義（定稿）
在五指山系統裡，KGEN 被定義為「質量發財金」。

- 1 KGEN = 1 NTD = 1 kg  
- KGEN 是「質量」，不是承諾  
- 質量不等於獲利，質量只代表你能承受多少重力與速度  
- 這裡不談投資回報，只談秩序與存在

---

## 悟空不給你什麼
- 不給明牌  
- 不給保證  
- 不給暴富  
- 不替你承擔風險  

---

## 悟空提醒你什麼
- 方向錯了要停  
- 情緒來了要退  
- 貪念出現要斷  
- 紀律破了會被市場處決  

---

# 🕯️ 光明燈（公共）
光明燈是「可被全宇宙看見」的燈牆。  
若你尚未接 GAS 全域儲存，系統會先以「本機模式」運作（只在你的裝置可見）。  
當你提供 GAS Web App URL 後，燈牆即可升級為全球共享。

<!-- =========================
     光明燈：公共燈牆（預設本機 / 可升級 GAS）
     ========================= -->
<section style="max-width:760px;margin:22px auto;padding:18px 18px;border:1px solid #111;border-radius:18px;">
  <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:10px;flex-wrap:wrap;">
    <div>
      <div style="font-size:18px;font-weight:900;">Public Lamp Wall</div>
      <div style="font-size:12px;opacity:.75;">Leave a name or stay anonymous.</div>
    </div>
    <div style="font-size:12px;opacity:.75;">
      Mode: <span id="wm-lamp-mode">...</span>
    </div>
  </div>

  <hr style="border:none;border-top:1px solid #111; margin:14px 0;">

  <input id="wmLampName" placeholder="暱稱（可留空）"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:8px;">

  <textarea id="wmLampMsg" placeholder="一句話（可留空）"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;min-height:88px;margin-bottom:10px;"></textarea>

  <button id="wmLampBtn"
    style="padding:10px 16px;border-radius:999px;border:1px solid #111;font-weight:900;background:#fff;cursor:pointer;">
    點亮光明燈
  </button>

  <span id="wmLampStatus" style="margin-left:10px;font-size:12px;opacity:.8;"></span>

  <hr style="border:none;border-top:1px solid #111; margin:14px 0;">

  <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
    <div style="font-weight:900;">Latest Lamps</div>
    <button id="wmRefreshLamps"
      style="padding:8px 12px;border-radius:999px;border:1px solid #111;font-weight:900;background:#fff;cursor:pointer;">
      Refresh
    </button>
  </div>

  <div id="wmLampList" style="margin-top:10px; display:grid; gap:10px;"></div>

  <div style="margin-top:12px;font-size:12px;opacity:.75;line-height:1.45;">
    Disclaimer: no investment advice, no ROI promise, no trading service. This is narrative and presence record only.
  </div>
</section>

<script>
/* ========= 光明燈：資料結構 ========= */
function lampPayload(kind) {
  const name = (document.getElementById("wmLampName").value || "").trim() || "Anonymous";
  const msg  = (document.getElementById("wmLampMsg").value || "").trim() || "(silent)";
  return {
    kind, // "public"
    name,
    msg,
    day: twISODate(),
    ts: Date.now()
  };
}

/* ========= 本機：光明燈存取 ========= */
const LOCAL_PUBLIC_KEY = "wm_public_lamps";
function localLoadPublic() {
  return JSON.parse(localStorage.getItem(LOCAL_PUBLIC_KEY) || "[]");
}
function localSavePublic(item) {
  const arr = localLoadPublic();
  arr.unshift(item);
  localStorage.setItem(LOCAL_PUBLIC_KEY, JSON.stringify(arr.slice(0, 50)));
}

/* ========= GAS：光明燈存取（可選） ========= */
async function gasPostLamp(item) {
  const res = await fetch(GAS_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "lamp_post", data: item })
  });
  if (!res.ok) throw new Error("GAS lamp_post failed");
  return await res.json(); // ok
}
async function gasGetLamps() {
  const url = GAS_WEBAPP_URL + "?action=lamp_list";
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error("GAS lamp_list failed");
  return await res.json(); // { items: [...] }
}

/* ========= UI：渲染燈牆 ========= */
function renderLampList(items) {
  const box = document.getElementById("wmLampList");
  box.innerHTML = "";
  const safe = (s) => String(s).replace(/[<>]/g, "");
  if (!items || items.length === 0) {
    box.innerHTML = '<div style="border:1px dashed #111;border-radius:14px;padding:12px;opacity:.75;">No lamps yet.</div>';
    return;
  }
  items.slice(0, 12).forEach(it => {
    const d = new Date(it.ts || Date.now());
    const card = document.createElement("div");
    card.style.border = "1px solid #111";
    card.style.borderRadius = "14px";
    card.style.padding = "12px";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <div style="font-weight:900;">${safe(it.name || "Anonymous")}</div>
        <div style="font-size:12px;opacity:.7;">${safe(d.toLocaleString())}</div>
      </div>
      <div style="margin-top:6px;line-height:1.5;">${safe(it.msg || "")}</div>
    `;
    box.appendChild(card);
  });
}

/* ========= 讀取/刷新 ========= */
async function refreshPublicLamps() {
  try {
    if (GAS_WEBAPP_URL) {
      document.getElementById("wm-lamp-mode").innerText = "Global (GAS)";
      const data = await gasGetLamps();
      renderLampList(data.items || []);
    } else {
      document.getElementById("wm-lamp-mode").innerText = "Local (device)";
      renderLampList(localLoadPublic());
    }
  } catch (e) {
    document.getElementById("wm-lamp-mode").innerText = "Local (fallback)";
    renderLampList(localLoadPublic());
  }
}

document.getElementById("wmRefreshLamps").addEventListener("click", refreshPublicLamps);

/* ========= 點亮光明燈 ========= */
document.getElementById("wmLampBtn").addEventListener("click", async () => {
  const status = document.getElementById("wmLampStatus");
  status.innerText = "Submitting...";
  const item = lampPayload("public");

  try {
    if (GAS_WEBAPP_URL) await gasPostLamp(item);
    else localSavePublic(item);

    status.innerText = "Done.";
    document.getElementById("wmLampMsg").value = "";
    await refreshPublicLamps();
  } catch (e) {
    localSavePublic(item);
    status.innerText = "Saved locally (fallback).";
    await refreshPublicLamps();
  }
});

refreshPublicLamps();
</script>

---

# 🎈 天燈（只看自己的）
天燈是「只屬於你自己」的紀錄，不公開。  
你可以寫願望、寫約束、寫誓言，只有你看得到。

<section style="max-width:760px;margin:22px auto;padding:18px 18px;border:1px solid #111;border-radius:18px;">
  <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:10px;flex-wrap:wrap;">
    <div>
      <div style="font-size:18px;font-weight:900;">Sky Lantern (Private)</div>
      <div style="font-size:12px;opacity:.75;">Only visible on your device.</div>
    </div>
    <button id="wmSkyListBtn"
      style="padding:8px 12px;border-radius:999px;border:1px solid #111;font-weight:900;background:#fff;cursor:pointer;">
      🔍 我點過的燈
    </button>
  </div>

  <hr style="border:none;border-top:1px solid #111; margin:14px 0;">

  <input id="wmSkyTitle" placeholder="標題（可留空）"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:8px;">

  <textarea id="wmSkyText" placeholder="寫下你的願望或紀律（可留空）"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;min-height:110px;margin-bottom:10px;"></textarea>

  <button id="wmSkyBtn"
    style="padding:10px 16px;border-radius:999px;border:1px solid #111;font-weight:900;background:#fff;cursor:pointer;">
    放天燈
  </button>

  <span id="wmSkyStatus" style="margin-left:10px;font-size:12px;opacity:.8;"></span>

  <div id="wmSkyPanel" style="display:none;margin-top:14px;">
    <hr style="border:none;border-top:1px solid #111; margin:14px 0;">
    <div style="font-weight:900;">My Sky Lanterns</div>
    <div id="wmSkyList" style="margin-top:10px; display:grid; gap:10px;"></div>
  </div>
</section>

<script>
const SKY_KEY = "wm_sky_lanterns";

function loadSky() {
  return JSON.parse(localStorage.getItem(SKY_KEY) || "[]");
}
function saveSky(item) {
  const arr = loadSky();
  arr.unshift(item);
  localStorage.setItem(SKY_KEY, JSON.stringify(arr.slice(0, 80)));
}
function renderSky() {
  const list = document.getElementById("wmSkyList");
  const items = loadSky();
  list.innerHTML = "";
  const safe = (s) => String(s).replace(/[<>]/g, "");
  if (!items.length) {
    list.innerHTML = '<div style="border:1px dashed #111;border-radius:14px;padding:12px;opacity:.75;">No sky lanterns yet.</div>';
    return;
  }
  items.slice(0, 20).forEach(it => {
    const d = new Date(it.ts || Date.now());
    const card = document.createElement("div");
    card.style.border = "1px solid #111";
    card.style.borderRadius = "14px";
    card.style.padding = "12px";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <div style="font-weight:900;">${safe(it.title || "Untitled")}</div>
        <div style="font-size:12px;opacity:.7;">${safe(d.toLocaleString())}</div>
      </div>
      <div style="margin-top:6px;line-height:1.5;">${safe(it.text || "")}</div>
    `;
    list.appendChild(card);
  });
}

document.getElementById("wmSkyBtn").addEventListener("click", () => {
  const status = document.getElementById("wmSkyStatus");
  const title = (document.getElementById("wmSkyTitle").value || "").trim() || "Untitled";
  const text  = (document.getElementById("wmSkyText").value || "").trim() || "(silent)";
  saveSky({ title, text, ts: Date.now(), day: twISODate() });
  document.getElementById("wmSkyText").value = "";
  status.innerText = "Saved.";
});

document.getElementById("wmSkyListBtn").addEventListener("click", () => {
  const p = document.getElementById("wmSkyPanel");
  const open = p.style.display !== "none";
  p.style.display = open ? "none" : "block";
  if (!open) renderSky();
});
</script>

---

# 🏆 聖盃（誠意按鈕）
這是一個「誠意」動作，不是資格審核。  
按下去，只是提醒自己：你不是來求快錢的。

<section style="max-width:760px;margin:22px auto;padding:18px 18px;border:1px solid #111;border-radius:18px;">
  <div style="font-size:18px;font-weight:900;">Holy Cup</div>
  <div style="font-size:12px;opacity:.75;">A discipline ritual. No promises.</div>

  <hr style="border:none;border-top:1px solid #111; margin:14px 0;">

  <button id="wmCupBtn"
    style="padding:12px 16px;border-radius:999px;border:1px solid #111;font-weight:900;background:#fff;cursor:pointer;">
    Press the Holy Cup
  </button>

  <span id="wmCupStatus" style="margin-left:10px;font-size:12px;opacity:.8;"></span>

  <div style="margin-top:12px;font-size:12px;opacity:.75;line-height:1.45;">
    This action creates a proof on your device only (no wallet, no money, no tracking).
  </div>
</section>

<script>
const CUP_KEY = "wm_holy_cup_count";
document.getElementById("wmCupBtn").addEventListener("click", () => {
  let c = parseInt(localStorage.getItem(CUP_KEY) || "0", 10);
  c += 1;
  localStorage.setItem(CUP_KEY, String(c));
  document.getElementById("wmCupStatus").innerText = "Count: " demonstrate? + c;
});
</script>

---

# 💛 重要聲明
- 本頁不涉及投資、報酬、交易或承諾  
- 不提供任何「穩賺」或「保證」  
- 所有互動功能僅為敘事與存在紀錄用途  

---

⌖  
PrimeForge 以母機之名，開啟金融生命。  
花果山台灣・信念不滅・市場無界。  
Where the Market Becomes the Myth.  
—— 樂天帝 ⌖
