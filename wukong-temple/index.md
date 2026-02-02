---
layout: default
title: 五指山・悟空財神廟｜信念與紀律
permalink: /wukong-temple/
---

# 🏯 五指山・悟空財神廟  
## Mount Five-Finger · Wukong Discipline Temple

---

## 🏯 光明燈（存在紀錄）

> 本頁不涉及投資、報酬、交易或承諾。  
> 僅為存在紀錄與敘事入口。

<section id="wukong-temple" style="max-width:680px;margin:40px auto;padding:24px;border:1px solid #111;border-radius:18px;">

  <h2>🏯 五指山・悟空財神廟｜光明燈</h2>

  <p>
    市場不是求快錢的地方，<br>
    是給守得住心的人通行的世界。
  </p>

  <hr>

  <h3>🕯️ 今日來訪之光</h3>
  <p id="visitCount">計算中…</p>

  <hr>

  <h3>🔔 點一盞光明燈（可選）</h3>

  <input id="lampName" placeholder="暱稱（可留空）"
    style="width:100%;padding:10px;margin-bottom:8px;">

  <textarea id="lampMessage" placeholder="一句話，或什麼都不留"
    style="width:100%;padding:10px;margin-bottom:8px;"></textarea>

  <button onclick="lightLamp()"
    style="padding:10px 16px;border-radius:999px;border:1px solid #111;font-weight:700;">
    點亮光明燈
  </button>

  <p id="lampResult" style="margin-top:12px;"></p>

  <hr>

  <p style="font-size:13px;opacity:.75;">
    本頁不涉及投資、報酬、交易或承諾。<br>
    僅為存在紀錄與敘事入口。
  </p>

</section>

---

## 🔍 光明燈查證（只查自己的）

> 你可以用 **Lamp ID** 來查證：  
> 「我有沒有點過」「是哪一筆」「什麼時間點的」。  
> *僅此裝置可查。*

<section style="max-width:680px;margin:20px auto 40px auto;padding:24px;border:1px solid #111;border-radius:18px;">

  <h3>✅ 查證區</h3>

  <div style="display:flex;gap:10px;flex-wrap:wrap;margin:12px 0;">
    <button onclick="renderMyLamps()"
      style="padding:8px 14px;border-radius:999px;border:1px solid #111;font-weight:700;">
      重新載入我的燈
    </button>

    <button onclick="exportMyLamps()"
      style="padding:8px 14px;border-radius:999px;border:1px solid #111;font-weight:700;">
      匯出 JSON（複製）
    </button>

    <button onclick="clearMyLamps()"
      style="padding:8px 14px;border-radius:999px;border:1px solid #111;font-weight:700;">
      清空我的紀錄
    </button>
  </div>

  <p id="myLampStats">載入中…</p>

  <hr>

  <h4>🔎 用 Lamp ID 查證</h4>
  <input id="verifyId" placeholder="貼上 Lamp ID（例如：WF-20260202-8F3A1C）"
    style="width:100%;padding:10px;margin:8px 0;">

  <button onclick="verifyLamp()"
    style="padding:8px 14px;border-radius:999px;border:1px solid #111;font-weight:700;">
    查證
  </button>

  <p id="verifyResult" style="margin-top:12px;"></p>

  <hr>

  <h4>🕯️ 我點過的燈（列表）</h4>
  <div id="myLampList"></div>
  <p id="myLampEmpty" style="display:none;opacity:.7;">你尚未點過任何光明燈。</p>

</section>

<script>
/* ====== 台灣日期（避免 UTC 跨日） ====== */
function twDateKey() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const tw  = new Date(utc + 8 * 3600000);
  return tw.toISOString().slice(0,10);
}

/* ====== 來訪計數（本地） ====== */
const todayKey = "wukong_visit_" + twDateKey();
let visits = localStorage.getItem(todayKey);
visits = visits ? parseInt(visits, 10) + 1 : 1;
localStorage.setItem(todayKey, visits);
document.getElementById("visitCount").innerText = "今日來訪之光：" + visits;

/* ====== 工具：安全顯示 ====== */
function escapeHTML(str) {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* ====== 產生 Lamp ID（短碼＋日期） ====== */
function genLampId() {
  // 例：WF-20260202-8F3A1C
  const d = twDateKey().replaceAll("-","");
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  return "WF-" + d + "-" + rand;
}

/* ====== 點燈 ====== */
function lightLamp() {
  const name = document.getElementById("lampName").value || "無名者";
  const msg  = document.getElementById("lampMessage").value || "（無言）";

  const record = {
    id: genLampId(),
    name,
    msg,
    time: new Date().toLocaleString()
  };

  const logs = JSON.parse(localStorage.getItem("wukong_lamps") || "[]");
  logs.push(record);
  localStorage.setItem("wukong_lamps", JSON.stringify(logs));

  document.getElementById("lampResult").innerHTML =
    "已為「" + escapeHTML(name) + "」點亮光明燈。<br>" +
    "Lamp ID：<code style='user-select:all;'>" + escapeHTML(record.id) + "</code> " +
    "<button onclick=\"copyText('" + record.id + "')\" style='margin-left:6px;padding:2px 10px;border-radius:999px;border:1px solid #111;font-weight:700;'>複製</button>";

  renderMyLamps();
}

/* ====== 複製 ====== */
function copyText(t) {
  navigator.clipboard.writeText(t);
  alert("已複製：" + t);
}

/* ====== 列表 ====== */
function renderMyLamps() {
  const list = document.getElementById("myLampList");
  const stats = document.getElementById("myLampStats");
  const empty = document.getElementById("myLampEmpty");

  const logs = JSON.parse(localStorage.getItem("wukong_lamps") || "[]");
  list.innerHTML = "";

  if (!logs.length) {
    stats.innerText = "共 0 盞光明燈（僅此裝置）";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";
  stats.innerText = "共 " + logs.length + " 盞光明燈（僅此裝置）";

  logs.slice().reverse().forEach(r => {
    const div = document.createElement("div");
    div.style.border = "1px solid #111";
    div.style.borderRadius = "14px";
    div.style.padding = "12px";
    div.style.marginBottom = "10px";

    div.innerHTML = `
      <strong>🕯️ ${escapeHTML(r.name || "無名者")}</strong><br>
      <div style="margin:6px 0;">${escapeHTML(r.msg || "（無言）")}</div>
      <div style="font-size:12px;opacity:.7;">${escapeHTML(r.time || "")}</div>
      <div style="margin-top:8px;font-size:12px;">
        Lamp ID：<code style="user-select:all;">${escapeHTML(r.id || "")}</code>
        <button onclick="copyText('${escapeHTML(r.id || "")}')"
          style="margin-left:6px;padding:2px 10px;border-radius:999px;border:1px solid #111;font-weight:700;">
          複製
        </button>
      </div>
    `;
    list.appendChild(div);
  });
}

/* ====== 用 Lamp ID 查證 ====== */
function verifyLamp() {
  const id = (document.getElementById("verifyId").value || "").trim();
  const out = document.getElementById("verifyResult");
  if (!id) {
    out.innerHTML = "請貼上 Lamp ID。";
    return;
  }

  const logs = JSON.parse(localStorage.getItem("wukong_lamps") || "[]");
  const hit = logs.find(r => r.id === id);

  if (!hit) {
    out.innerHTML = "❌ 查無此 Lamp ID（僅能查本裝置的紀錄）。";
    return;
  }

  out.innerHTML =
    "✅ 查證成功：<br>" +
    "暱稱：" + escapeHTML(hit.name || "無名者") + "<br>" +
    "留言：" + escapeHTML(hit.msg || "（無言）") + "<br>" +
    "時間：" + escapeHTML(hit.time || "");
}

/* ====== 匯出 / 清空 ====== */
function exportMyLamps() {
  const data = localStorage.getItem("wukong_lamps") || "[]";
  navigator.clipboard.writeText(data);
  alert("已複製 JSON 到剪貼簿");
}

function clearMyLamps() {
  if (!confirm("確定清空本裝置的所有紀錄？")) return;
  localStorage.removeItem("wukong_lamps");
  renderMyLamps();
  document.getElementById("verifyResult").innerHTML = "";
}

/* 初始載入 */
renderMyLamps();
</script>

---

⌖  
PrimeForge 以母機之名，開啟金融生命。  
花果山台灣・信念不滅・市場無界。  
Where the Market Becomes the Myth.  
—— 樂天帝 ⌖
