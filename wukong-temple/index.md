---
layout: default
title: 五指山・悟空財神廟｜信念與紀律
permalink: /wukong-temple/
---

# 🏯 五指山・悟空財神廟  
## Mount Five-Finger · Wukong Discipline Temple

> **信念不是祈求，是紀律。**  
> 這不是一座求快錢的廟，  
> 而是一個提醒你「不要亂來」的地方。

在《K線西遊記》的宇宙中——  
悟空從來不保證你賺錢，  
他只提醒你一件事：

> **市場只獎勵守得住紀律的人。**

---

## 🐒 悟空不給你什麼？
- 不給明牌  
- 不給保證  
- 不給暴富  
- 不替你承擔風險  

---

## 🧠 悟空提醒你什麼？
- 方向錯了要停  
- 情緒來了要退  
- 貪念出現要斷  
- 紀律破了會被市場處決  

---

## 💠 為什麼叫「財神廟」？

因為在這個宇宙裡：

> **財不是錢，是存活。**  
> **神不是給予，是約束。**

悟空存在的意義，  
不是讓你贏一次，  
而是讓你不要死在半路。

---

## ⚠️ 重要分流說明（請務必看）

### 🔔 點燈／供奉（人類世界）
- 使用：**USDT（TRC20）**
- 僅作為創作與公益支持
- **不涉及投資、交易或任何承諾**

> ⚠️ 本頁捐款地址 **只接受 USDT（TRC20）**  
> ⚠️ **任何 KGEN 或其他資產轉入將永久遺失**

**官方捐款地址（USDT・TRC20）**  
`TTn9M7d4NS7csTHMieFz4B4RqrhenDa4tk`

---

### 🔥 燒香（敘事儀式）
- 僅為象徵行為
- 不上鏈、不扣幣
- 是「我來過」的紀錄

---

### 🧬 KGEN（宇宙質量）
- 用於：發財金借出、燒幣、演化
- **不會、也不能**轉入上述 USDT 捐款地址
- 所有 KGEN 行為皆在其專屬系統中完成

---

## 🏮 光明燈系統（存在紀錄）

> 本區不涉及投資、報酬、交易或承諾  
> 僅為存在紀錄與敘事入口

<section id="wukong-temple" style="max-width:720px;margin:40px auto;padding:24px;border:1px solid #111;border-radius:18px;">

  <h3>🕯️ 今日來訪之光</h3>
  <p id="visitToday">計算中…</p>
  <p id="visitTotal">累計存在：計算中…</p>

  <hr>

  <h3>🔔 點一盞光明燈（可選）</h3>

  <input id="lampName" placeholder="暱稱（可留空）"
    style="width:100%;padding:10px;margin-bottom:8px;">

  <textarea id="lampMessage" placeholder="一句話，或什麼都不留"
    style="width:100%;padding:10px;margin-bottom:8px;"></textarea>

  <button onclick="lightLamp()"
    style="padding:10px 18px;border-radius:999px;border:1px solid #111;font-weight:700;">
    點亮光明燈
  </button>

  <p id="lampResult" style="margin-top:12px;"></p>

  <hr>

  <h3>🔍 我點過的燈（只顯示自己）</h3>
  <ul id="myLamps" style="font-size:14px;"></ul>

  <hr>

  <p style="font-size:13px;opacity:.75;">
    本系統僅使用瀏覽器本地紀錄（localStorage），<br>
    不蒐集、不上傳、不公開任何個資。
  </p>

</section>

---

## 🧬 KGEN 發財金（系統說明）

> 發財金不是錢，是「質量的暫時借用」。

**基本原則（V1.0 設計）**
- 借出單位：KGEN  
- 借期：固定天數（由系統定義）  
- 歸還：KGEN 原額  
- 逾期：可能觸發燒幣或黑洞規則  

📌 本頁僅為說明入口  
📌 實際借出需透過 KGEN 專屬系統

---

## 🕳️ 黑洞與燃燒（概念）

- **燃燒（Burn）**：  
  KGEN → 位能 / 時間權限 / 穩定度

- **黑洞（Blackhole）**：  
  不可逆轉的質量封存

這些行為**不會**在本頁直接執行，  
僅於 KGEN 系統中完成。

---

## 📜 最後的話

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

<script>
/* ===== 五指山・悟空財神廟 本地存在系統 ===== */

// 台灣時區日期
function twDateKey() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const tw  = new Date(utc + 8 * 3600000);
  return tw.toISOString().slice(0,10);
}

// 參訪統計
const today = twDateKey();
const todayKey = "wukong_visit_" + today;
const totalKey = "wukong_visit_total";

let todayCount = parseInt(localStorage.getItem(todayKey) || "0", 10) + 1;
let totalCount = parseInt(localStorage.getItem(totalKey) || "0", 10) + 1;

localStorage.setItem(todayKey, todayCount);
localStorage.setItem(totalKey, totalCount);

document.getElementById("visitToday").innerText =
  "今日來訪之光：" + todayCount;

document.getElementById("visitTotal").innerText =
  "累計存在：" + totalCount;

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

// 顯示自己點過的燈
function renderMyLamps() {
  const list = document.getElementById("myLamps");
  const logs = JSON.parse(localStorage.getItem("wukong_lamps") || "[]");

  list.innerHTML = "";
  logs.forEach(l => {
    const li = document.createElement("li");
    li.textContent = l.time + "｜" + l.name + "：" + l.msg;
    list.appendChild(li);
  });
}

renderMyLamps();
</script>
