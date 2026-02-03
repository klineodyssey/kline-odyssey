---
layout: default
title: 五指山・悟空財神廟｜信念與紀律
permalink: /wukong-temple/
---

# 五指山・悟空財神廟
## Mount Five-Finger · Wukong Discipline Temple

這不是一座求快錢的廟。  
這是一個提醒你「不要亂來」的地方。

在《K線西遊記》的宇宙中——  
悟空從來不保證你賺錢，  
他只提醒你一件事：

> 市場只獎勵守紀律的人。

---

## 宇宙定義：發財金＝質量
- 1 公斤（Kg） = 1 KGEN = 1 新台幣（NTD）
- KGEN 代表「質量」，不是承諾
- 所有流程皆為「紀錄」與「儀式入口」

---

## 你在這裡能做什麼
- 公開：點光明燈（全宇宙可見）
- 私密：放天燈（只有自己可見）
- 擲筊：聖盃（擲到聖杯後，今日解鎖發財金申請）
- 申請：KGEN 發財金（系統自動記錄）
- 還願：歸還登記（神話故事線）

---

<!-- 右上角浮動視窗：總訪客 / 今日訪客（小徽章） -->
<div id="wt-float" class="wt-pill" aria-label="visitor-stats">
  <span class="wt-dot"></span>
  <span>今日 <b id="wt-today">…</b></span>
  <span class="wt-sep"></span>
  <span>總計 <b id="wt-total">…</b></span>
</div>

<style>
#wt-float.wt-pill{
  position: fixed;
  top: 64px;
  right: 10px;
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,.15);
  background: rgba(255,255,255,.88);
  backdrop-filter: blur(6px);
  font-size: 12px;
  line-height: 1;
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
  max-width: calc(100vw - 20px);
}
#wt-float .wt-dot{
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(0,0,0,.7);
  display: inline-block;
}
#wt-float .wt-sep{
  width: 1px;
  height: 14px;
  background: rgba(0,0,0,.15);
  display: inline-block;
}
</style>

<hr>

## 光明燈（公開｜全宇宙可見）
<section style="max-width:720px;margin:18px 0;padding:18px;border:1px solid #111;border-radius:18px;">
  <h3 style="margin-top:0;">點一盞光明燈</h3>

  <input id="lampNickname" placeholder="暱稱（可留空）"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:8px;">

  <textarea id="lampMessage" placeholder="一句話（建議 50 字內）"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:10px;min-height:90px;"></textarea>

  <button id="btnLamp"
    style="padding:10px 16px;border-radius:999px;border:1px solid #111;font-weight:900;background:#fff;">
    點亮光明燈（公開）
  </button>

  <span id="lampResult" style="margin-left:10px;font-weight:800;"></span>

  <hr style="margin:16px 0;">

  <h3 style="margin:0 0 8px 0;">最新光明燈（公開清單）</h3>
  <div id="lampList" style="font-size:14px;line-height:1.5;opacity:.92;">載入中…</div>
</section>

---

## 天燈（私密｜只有自己看得到）
<section style="max-width:720px;margin:18px 0;padding:18px;border:1px solid #111;border-radius:18px;">
  <h3 style="margin-top:0;">放一盞天燈（只存你的）</h3>

  <input id="lanternTitle" placeholder="天燈標題（可留空）"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:8px;">

  <textarea id="lanternWish" placeholder="願望（只你自己看得到）"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:10px;min-height:90px;"></textarea>

  <button id="btnLantern"
    style="padding:10px 16px;border-radius:999px;border:1px solid #111;font-weight:900;background:#fff;">
    放天燈（私密）
  </button>

  <span id="lanternResult" style="margin-left:10px;font-weight:800;"></span>

  <hr style="margin:16px 0;">

  <h3 style="margin:0 0 8px 0;">我放過的天燈（只看自己）</h3>
  <div id="lanternList" style="font-size:14px;line-height:1.5;opacity:.92;">載入中…</div>
</section>

---

## 擲筊（聖盃）
<section style="max-width:720px;margin:18px 0;padding:18px;border:1px solid #111;border-radius:18px;">
  <h3 style="margin-top:0;">擲筊</h3>

  <input id="grailNote" placeholder="你想問的事（可留空）"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:10px;">

  <button id="btnGrail"
    style="padding:10px 16px;border-radius:999px;border:1px solid #111;font-weight:900;background:#fff;">
    擲筊
  </button>

  <span id="grailResult" style="margin-left:10px;font-weight:900;"></span>

  <hr style="margin:16px 0;">
  <h3 style="margin:0 0 8px 0;">我擲過的筊（只看自己）</h3>
  <div id="grailList" style="font-size:14px;line-height:1.5;opacity:.92;">載入中…</div>
</section>

---

## KGEN 發財金（申請 / 還願）
<section style="max-width:720px;margin:18px 0;padding:18px;border:1px solid #111;border-radius:18px;">
  <h3 style="margin-top:0;">申請發財金（需當日聖杯）</h3>

  <input id="fortuneWallet" placeholder="收款地址（EVM）"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:8px;">

  <input id="fortuneAmount" placeholder="申請數量（例：10）"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:8px;">

  <textarea id="fortunePurpose" placeholder="用途（簡短即可）"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:10px;min-height:70px;"></textarea>

  <button id="btnFortuneApply"
    style="padding:10px 16px;border-radius:999px;border:1px solid #111;font-weight:900;background:#fff;">
    送出申請
  </button>

  <span id="fortuneApplyResult" style="margin-left:10px;font-weight:900;"></span>

  <hr style="margin:16px 0;">

  <h3 style="margin:0 0 8px 0;">還願登記</h3>

  <input id="returnWallet" placeholder="你的地址（EVM）"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:8px;">

  <input id="returnAmount" placeholder="還願數量（例：1）"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:8px;">

  <input id="returnTx" placeholder="TxHash（可留空）"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:10px;">

  <button id="btnVowReturn"
    style="padding:10px 16px;border-radius:999px;border:1px solid #111;font-weight:900;background:#fff;">
    登記還願
  </button>

  <span id="vowReturnResult" style="margin-left:10px;font-weight:900;"></span>

  <hr style="margin:16px 0;">

  <h3 style="margin:0 0 8px 0;">我的狀態（只看自己）</h3>
  <div id="fortuneStatus" style="font-size:14px;line-height:1.5;opacity:.92;">載入中…</div>
</section>

---

⌖  
PrimeForge 以母機之名，開啟金融生命。  
花果山台灣・信念不滅・市場無界。  
Where the Market Becomes the Myth.  
—— 樂天帝 ⌖

<script>
/* =============================
   Wukong Temple Frontend V2
   - JSONP 呼叫 GAS
   - 回傳 speak 直接語音播報
============================= */

/* 改成你最新 GAS 部署 URL */
const GAS_URL = "https://script.google.com/macros/s/AKfycbwn_3DB91DK9VJV48EE-5--4zjrwd1qWjHQkgHptlJ4xdPIKufNhgsZOxgkyScHmumSxw/exec";

/* 語音播報 */
function speak(text){
  try{
    if(!text) return;
    if(!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = "zh-TW";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }catch(e){}
}

/* Device ID（固定一台裝置） */
function getDeviceId(){
  const k = "wt_device_id";
  let v = localStorage.getItem(k);
  if (!v){
    v = "wt_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
    localStorage.setItem(k, v);
  }
  return v;
}
const DEVICE_ID = getDeviceId();

/* JSONP */
function jsonp(action, params, cb){
  const callbackName = "wt_cb_" + Math.random().toString(16).slice(2);
  const s = document.createElement("script");
  window[callbackName] = function(data){
    try{
      if(data && data.speak) speak(data.speak);
      cb && cb(data);
    } finally {
      try{ delete window[callbackName]; }catch(e){}
      s.remove();
    }
  };
  const q = new URLSearchParams(Object.assign({}, params || {}, {
    action,
    device_id: DEVICE_ID,
    ua_hint: navigator.userAgent.slice(0,140),
    callback: callbackName
  }));
  s.src = GAS_URL + "?" + q.toString();
  document.body.appendChild(s);
}

/* Escape */
function esc(s){
  return String(s || "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

/* Render lists */
function renderList(el, items, type){
  if (!items || !items.length){
    el.innerHTML = "<div style='opacity:.7;'>（目前沒有紀錄）</div>";
    return;
  }
  el.innerHTML = items.map(it => {
    if (type === "lamp"){
      return `<div style="padding:10px 0;border-bottom:1px dashed rgba(0,0,0,.2);">
        <div style="font-weight:900;">${esc(it.nickname || "無名者")}</div>
        <div style="opacity:.9;margin-top:4px;">${esc(it.message || "")}</div>
        <div style="opacity:.55;font-size:12px;margin-top:6px;">${esc(it.ts || "")}</div>
      </div>`;
    }
    if (type === "lantern"){
      return `<div style="padding:10px 0;border-bottom:1px dashed rgba(0,0,0,.2);">
        <div style="font-weight:900;">${esc(it.title || "天燈")}</div>
        <div style="opacity:.9;margin-top:4px;">${esc(it.wish || "")}</div>
        <div style="opacity:.55;font-size:12px;margin-top:6px;">${esc(it.ts || "")}</div>
      </div>`;
    }
    if (type === "grail"){
      return `<div style="padding:10px 0;border-bottom:1px dashed rgba(0,0,0,.2);">
        <div style="font-weight:900;">${esc(it.toss || "")}｜${esc(it.result || "")}</div>
        <div style="opacity:.75;margin-top:4px;">${esc(it.note || "")}</div>
        <div style="opacity:.55;font-size:12px;margin-top:6px;">${esc(it.ts || "")}</div>
      </div>`;
    }
    if (type === "fortune"){
      return `<div style="padding:10px 0;border-bottom:1px dashed rgba(0,0,0,.2);">
        <div style="font-weight:900;">${esc(it.status || "")}</div>
        <div style="opacity:.9;margin-top:4px;">${esc(it.amount_kgen || "")} KGEN → ${esc(it.wallet || "")}</div>
        <div style="opacity:.75;margin-top:4px;">${esc(it.purpose || "")}</div>
        <div style="opacity:.65;font-size:12px;margin-top:6px;">${esc(it.ts || "")}</div>
      </div>`;
    }
    if (type === "vow"){
      return `<div style="padding:10px 0;border-bottom:1px dashed rgba(0,0,0,.2);">
        <div style="font-weight:900;">還願：${esc(it.amount_kgen || "")} KGEN</div>
        <div style="opacity:.85;margin-top:4px;">${esc(it.note || "")}</div>
        <div style="opacity:.75;font-size:12px;margin-top:6px;">${esc(it.ts || "")}</div>
        ${it.tx ? `<div style="opacity:.7;font-size:12px;margin-top:6px;">Tx: ${esc(it.tx)}</div>` : ``}
      </div>`;
    }
    return "";
  }).join("");
}

/* Loaders */
function refreshStats(){
  jsonp("stats", {}, (r) => {
    if (r && r.ok){
      document.getElementById("wt-today").textContent = r.today_visits;
      document.getElementById("wt-total").textContent = r.total_visits;
    }
  });
}
function recordVisit(){
  jsonp("visit", { src:"wukong-temple", ref: location.href.slice(0,180) }, (r) => {
    if (r && r.ok){
      document.getElementById("wt-today").textContent = r.today_visits;
      document.getElementById("wt-total").textContent = r.total_visits;
    }
  });
}
function loadPublicLamps(){
  jsonp("lamp_list", { limit: 20 }, (r) => {
    const el = document.getElementById("lampList");
    if (!r || !r.ok) { el.innerHTML = "<div style='opacity:.7;'>載入失敗</div>"; return; }
    renderList(el, r.items || [], "lamp");
  });
}
function loadMyLanterns(){
  jsonp("lantern_list", { limit: 20 }, (r) => {
    const el = document.getElementById("lanternList");
    if (!r || !r.ok) { el.innerHTML = "<div style='opacity:.7;'>載入失敗</div>"; return; }
    renderList(el, r.items || [], "lantern");
  });
}
function loadMyGrails(){
  jsonp("grail_list", { limit: 20 }, (r) => {
    const el = document.getElementById("grailList");
    if (!r || !r.ok) { el.innerHTML = "<div style='opacity:.7;'>載入失敗</div>"; return; }
    renderList(el, r.items || [], "grail");
  });
}
function loadMyStatus(){
  jsonp("fortune_status", {}, (r) => {
    const el = document.getElementById("fortuneStatus");
    if (!r || !r.ok) { el.innerHTML = "<div style='opacity:.7;'>載入失敗</div>"; return; }

    const top = `
      <div style="padding:10px 0;border-bottom:1px dashed rgba(0,0,0,.2);">
        <div style="font-weight:900;">今日聖杯：${r.holy_today ? "已解鎖" : "未解鎖"}</div>
        <div style="opacity:.85;margin-top:6px;">已領：${r.borrowed_total}｜已還願：${r.returned_total}｜未還願：${r.outstanding}</div>
      </div>
    `;
    el.innerHTML = top;

    if (r.items && r.items.length){
      const box = document.createElement("div");
      el.appendChild(box);
      renderList(box, r.items, "fortune");
    } else {
      el.innerHTML += "<div style='opacity:.7;padding-top:10px;'>（目前沒有發財金紀錄）</div>";
    }

    // 另外拉還願清單
    jsonp("vow_list", { limit: 10 }, (rv) => {
      if(rv && rv.ok && rv.items){
        const h = document.createElement("div");
        h.style.marginTop = "14px";
        h.innerHTML = `<div style="font-weight:900;">還願紀錄</div>`;
        el.appendChild(h);

        const box2 = document.createElement("div");
        el.appendChild(box2);
        renderList(box2, rv.items, "vow");
      }
    });
  });
}

/* Buttons */
document.getElementById("btnLamp").addEventListener("click", () => {
  const nickname = document.getElementById("lampNickname").value || "無名者";
  const message  = document.getElementById("lampMessage").value || "（無言）";
  jsonp("lamp_add", { nickname, message }, (r) => {
    const out = document.getElementById("lampResult");
    out.textContent = (r && r.ok) ? "已點亮" : "失敗";
    if (r && r.ok){
      document.getElementById("lampMessage").value = "";
      loadPublicLamps();
    }
  });
});

document.getElementById("btnLantern").addEventListener("click", () => {
  const title = document.getElementById("lanternTitle").value || "天燈";
  const wish  = document.getElementById("lanternWish").value || "（無言）";
  jsonp("lantern_add", { title, wish }, (r) => {
    const out = document.getElementById("lanternResult");
    out.textContent = (r && r.ok) ? "已送出" : "失敗";
    if (r && r.ok){
      document.getElementById("lanternWish").value = "";
      loadMyLanterns();
    }
  });
});

document.getElementById("btnGrail").addEventListener("click", () => {
  const note = document.getElementById("grailNote").value || "";
  jsonp("grail_cast", { note }, (r) => {
    const out = document.getElementById("grailResult");
    if (r && r.ok){
      out.textContent = `${r.toss}｜${r.result}`;
      loadMyGrails();
      loadMyStatus();
    } else out.textContent = "失敗";
  });
});

document.getElementById("btnFortuneApply").addEventListener("click", () => {
  const out = document.getElementById("fortuneApplyResult");
  const wallet = document.getElementById("fortuneWallet").value || "";
  const amount_kgen = document.getElementById("fortuneAmount").value || "";
  const purpose = document.getElementById("fortunePurpose").value || "發財金";
  jsonp("fortune_apply", { wallet, amount_kgen, purpose }, (r) => {
    out.textContent = (r && r.ok) ? "已記錄" : "未通過";
    loadMyStatus();
  });
});

document.getElementById("btnVowReturn").addEventListener("click", () => {
  const out = document.getElementById("vowReturnResult");
  const wallet = document.getElementById("returnWallet").value || "";
  const amount_kgen = document.getElementById("returnAmount").value || "";
  const tx = document.getElementById("returnTx").value || "";
  jsonp("vow_return", { wallet, amount_kgen, tx, note:"還願" }, (r) => {
    out.textContent = (r && r.ok) ? "已記錄" : "未通過";
    loadMyStatus();
  });
});

/* Start */
refreshStats();
recordVisit();
loadPublicLamps();
loadMyLanterns();
loadMyGrails();
loadMyStatus();
</script>
