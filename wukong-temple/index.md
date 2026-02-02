<!-- 🏯 悟空財神廟｜光明燈系統 -->
<section id="wukong-temple" style="max-width:680px;margin:40px auto;padding:24px;border:1px solid #111;border-radius:18px;">

  <h2>🏯 悟空財神廟｜光明燈</h2>

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

// 每日 key
const todayKey = "wukong_visit_" + new Date().toISOString().slice(0,10);

// 記錄來訪
let visits = localStorage.getItem(todayKey);
visits = visits ? parseInt(visits) + 1 : 1;
localStorage.setItem(todayKey, visits);

// 顯示來訪數
document.getElementById("visitCount").innerText =
  "今日來訪之光：" + visits;

// 點燈功能
function lightLamp() {
  const name = document.getElementById("lampName").value || "無名者";
  const msg  = document.getElementById("lampMessage").value || "（無言）";

  const record = {
    name,
    msg,
    time: new Date().toLocaleString()
  };

  // 存在本地（不公開）
  const logs = JSON.parse(localStorage.getItem("wukong_lamps") || "[]");
  logs.push(record);
  localStorage.setItem("wukong_lamps", JSON.stringify(logs));

  document.getElementById("lampResult").innerText =
    "已為「" + name + "」點亮光明燈。";
}
</script>
---
layout: default
title: 悟空財神廟｜信念與紀律
permalink: /wukong-temple/
---

# 🐒 悟空財神廟
## 信念不是祈求，是紀律

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

## 為什麼叫「財神廟」？

因為在這個宇宙裡：

> **財不是錢，是存活。**  
> **神不是給予，是約束。**

悟空存在的意義，  
不是讓你贏一次，  
而是讓你不要死在半路。

---

## 這裡不接受任何形式的祈求

如果你想求：  
- 快錢  
- 明牌  
- 穩賺  

你來錯地方了。

如果你想要的是：  
- 長期活著  
- 知道什麼時候不該動  
- 在市場裡留下名字  

那你來對了。

---

⌖  
PrimeForge 以母機之名，開啟金融生命。  
花果山台灣・信念不滅・市場無界。  
Where the Market Becomes the Myth.  
—— 樂天帝 ⌖
