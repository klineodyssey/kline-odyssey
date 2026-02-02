---
layout: default
title: 五指山・悟空財神廟｜信念與紀律
permalink: /wukong-temple/
---

# 🏯 五指山・悟空財神廟  
## Mount Five-Finger · Wukong Discipline Temple

信念不是祈求，  
**是紀律。**

這不是一座求財的廟。  
這是一個**提醒你不要亂來的地方**。

在《K線西遊記》的宇宙中——  
悟空從來不保證你賺錢，  
他只提醒你一件事：

> **市場只獎勵守紀律的人。**

---

## 悟空不給你什麼？

- 不給明牌  
- 不給保證  
- 不給暴富  
- 不替你承擔風險  

---

## 悟空提醒你什麼？

- 方向錯了要停  
- 情緒來了要退  
- 貪念出現要斷  
- 紀律破了會被市場處決  

---

## 為什麼在「五指山」？

因為在這個宇宙裡：

> **財不是錢，是存活。**  
> **神不是給予，是約束。**

五指山不是鎮壓，  
是**讓人學會不亂動的地方**。

悟空存在的意義，  
不是讓你贏一次，  
而是讓你不要死在半路。

---

## 🕯️ 光明燈（存在紀錄）

> 本頁不涉及投資、報酬、交易或承諾。  
> 僅為存在紀錄與敘事入口。

<!-- 🏯 悟空財神廟｜光明燈系統 -->
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

<script>
/* ====== 悟空財神廟核心邏輯 ====== */

// 台灣日期（避免 UTC 跨日）
function twDateKey() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const tw  = new Date(utc + 8 * 3600000);
  return tw.toISOString().slice(0,10);
}

const todayKey = "wukong_visit_" + twDateKey();

// 記錄來訪
let visits = localStorage.getItem(todayKey);
visits = visits ? parseInt(visits, 10) + 1 : 1;
localStorage.setItem(todayKey, visits);

// 顯示來訪數
document.getElementById("visitCount").innerText =
  "今日來訪之光：" + visits;

// 點燈
function lightLamp() {
  const name = document.getElementById("lampName").value || "無名者";
  const msg  = document.getElementById("lampMessage").value || "（無言）";

  const record = {
    name,
    msg,
    time: new Date().toLocaleString()
  };

  const logs = JSON.parse(localStorage.getItem("wukong_lamps") || "[]");
  logs.push(record);
  localStorage.setItem("wukong_lamps", JSON.stringify(logs));

  document.getElementById("lampResult").innerText =
    "已為「" + name + "」點亮光明燈。";

  renderMyLamps();
}
</script>

---

## 🔍 我點過的燈（只看自己的）

> 只顯示你這台裝置留下的紀錄，  
> 不上傳、不公開、不連結錢包。

<!-- 🔍 我點過的燈 -->
<section id="my-lamps" style="max-width:680px;margin:20px auto 40px auto;padding:24px;border:1px solid #111;border-radius:18px;">

  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
    <button onclick="renderMyLamps()"
      style="padding:8px 14px;border-radius:999px;border:1px solid #111;font-weight:700;">
      重新載入
    </button>

    <button onclick="exportMyLamps()"
      style="padding:8px 14px;border-radius:999px;border:1px solid #111;font-weight:700;">
      匯出 JSON
    </button>

    <button onclick="clearMyLamps()"
      style="padding:8px 14px;border-radius:999px;border:1px solid #111;font-weight:700;">
      清空我的紀錄
    </button>
  </div>

  <p id="myLampStats">載入中…</p>
  <div id="myLampList"></div>
  <p id="myLampEmpty" style="display:none;opacity:.7;">你尚未點過任何光明燈。</p>

</section>

<script>
function escapeHTML(str) {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

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
    `;
    list.appendChild(div);
  });
}

function exportMyLamps() {
  const data = localStorage.getItem("wukong_lamps") || "[]";
  navigator.clipboard.writeText(data);
  alert("已複製 JSON 到剪貼簿");
}

function clearMyLamps() {
  if (!confirm("確定清空本裝置的所有紀錄？")) return;
  localStorage.removeItem("wukong_lamps");
  renderMyLamps();
}

renderMyLamps();
</script>

---

⌖  
PrimeForge 以母機之名，開啟金融生命。  
花果山台灣・信念不滅・市場無界。  
Where the Market Becomes the Myth.  
—— 樂天帝 ⌖
