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
在這裡，發財金不是迷信。

- 1 公斤（Kg） = 1 KGEN = 1 新台幣（NTD）
- KGEN 代表「質量」，不是承諾
- 任何行為只做「紀錄」與「申請」，不做自動轉帳、不碰私鑰

---

## 你在這裡能做什麼
- 公開：點光明燈（全宇宙可見）
- 私密：放天燈（只有自己可見）
- 擲筊：聖盃（正正）才可申請發財金
- 申請：KGEN 發財金（只登記，等待審核與人工發放）
- 還願：歸還發財金（只登記，附 TxHash 方便查核）
- 查證：我點過的燈、我放過的天燈、我擲過的筊、我的申請狀態

---

<!-- 右上角浮動視窗：總訪客 / 今日訪客 -->
<div id="wt-float">
  <div class="wt-title">五指山・悟空財神廟</div>
  <div class="wt-row">今日：<span id="wt-today">-</span></div>
  <div class="wt-row">總計：<span id="wt-total">-</span></div>
</div>

<style>
#wt-float{
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 9999;
  background: rgba(255,255,255,0.92);
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.4;
  width: auto;
  min-width: 120px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

#wt-float .wt-title{
  font-weight: 600;
  font-size: 12px;
  margin-bottom: 4px;
}

#wt-float .wt-row{
  font-size: 11px;
  color: #333;
}
</style>

<hr>

## 光明燈（公開｜全宇宙可見）
> 本區不涉及投資、報酬、交易或承諾。僅為存在紀錄與敘事入口。

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

  <h3 style="margin:0 0 8px 0;">🔍 我放過的天燈（只看自己）</h3>
  <div id="lanternList" style="font-size:14px;line-height:1.5;opacity:.92;">載入中…</div>
</section>

---

## 擲筊（聖盃規則）
規則（定稿）：
- 正正＝聖杯（同意）
- 反反＝笑杯（不同意／不莊重）
- 正反＝陰杯（不確定／再問）

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

  <h3 style="margin:0 0 8px 0;">🔍 我擲過的筊（只看自己）</h3>
  <div id="grailList" style="font-size:14px;line-height:1.5;opacity:.92;">載入中…</div>
</section>

---

## KGEN 發財金（申請 / 還願）
定義（定稿）：
1) 申請發財金是「登記」，不是保證  
2) 聖杯才可送出申請（儀式門檻）  
3) 本頁不自動發幣、不存私鑰  
4) 實際發放：由你（管理端）用錢包或腳本人工轉帳  
5) 出金地址＝歸還地址（你申請時填的地址）

<section style="max-width:720px;margin:18px 0;padding:18px;border:1px solid #111;border-radius:18px;">
  <h3 style="margin-top:0;">申請發財金（需聖杯）</h3>

  <input id="fortuneEmail" placeholder="Email（可留空）"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:8px;">

  <input id="fortuneWallet" placeholder="0xb73d6716005b37bec742d64482fa26033ee1a4e1"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:8px;">

  <input id="fortuneAmount" placeholder="申請數量（KGEN）例：10"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:8px;">

  <textarea id="fortunePurpose" placeholder="用途（簡短即可）"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:10px;min-height:70px;"></textarea>

  <button id="btnFortuneApply"
    style="padding:10px 16px;border-radius:999px;border:1px solid #111;font-weight:900;background:#fff;">
    送出申請（需聖杯）
  </button>

  <span id="fortuneApplyResult" style="margin-left:10px;font-weight:900;"></span>

  <hr style="margin:16px 0;">

  <h3 style="margin:0 0 8px 0;">還願歸還（登記）</h3>

  <input id="returnWallet" placeholder="0xb73d6716005b37bec742d64482fa26033ee1a4e1"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:8px;">

  <input id="returnAmount" placeholder="歸還數量（KGEN）例：10"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:8px;">

  <input id="returnTx" placeholder="TxHash（可留空，但建議填）"
    style="width:100%;padding:10px;border:1px solid #111;border-radius:12px;margin-bottom:10px;">

  <button id="btnFortuneReturn"
    style="padding:10px 16px;border-radius:999px;border:1px solid #111;font-weight:900;background:#fff;">
    登記還願
  </button>

  <span id="fortuneReturnResult" style="margin-left:10px;font-weight:900;"></span>

  <hr style="margin:16px 0;">

  <h3 style="margin:0 0 8px 0;">🔍 我的申請狀態（只看自己）</h3>
  <div id="fortuneStatus" style="font-size:14px;line-height:1.5;opacity:.92;">載入中…</div>
</section>

---

## 重要提醒
- 本頁不構成投資建議，不提供收益承諾  
- 所有功能僅為敘事、紀錄、申請入口  
- 若你需要支持創作與公益，請走官網捐款頁（USDT-TRC20）

---

⌖  
PrimeForge 以母機之名，開啟金融生命。  
花果山台灣・信念不滅・市場無界。  
Where the Market Becomes the Myth.  
—— 樂天帝 ⌖

<script>
/* =============================
   五指山・悟空財神廟 前端母機
   - 使用 JSONP 呼叫 GAS（避免 CORS）
   - 你的 GAS URL（如部署變更就改這行）
============================= */
const GAS_URL = "https://script.google.com/macros/s/AKfycbwn_3DB91DK9VJV48EE-5--4zjrwd1qWjHQkgHptlJ4xdPIKufNhgsZOxgkyScHmumSxw/exec";

/* ---------- Device ID（固定一台裝置） ---------- */
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
document.getElementById("wt-device").innerText = DEVICE_ID;

/* ---------- JSONP Helper ---------- */
function jsonp(action, params, cb){
  const callbackName = "wt_cb_" + Math.random().toString(16).slice(2);
  window[callbackName] = function(data){
    try { cb && cb(data); } finally {
      delete window[callbackName];
      s.remove();
    }
  };
  const q = new URLSearchParams(Object.assign({}, params || {}, {
    action,
    device_id: DEVICE_ID,
    callback: callbackName
  }));
  const s = document.createElement("script");
  s.src = GAS_URL + "?" + q.toString();
  document.body.appendChild(s);
}

/* ---------- UI Render Helpers ---------- */
function esc(s){
  return String(s || "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}
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
        <div style="font-weight:900;">結果：${esc(it.result || "")}</div>
        <div style="opacity:.75;margin-top:4px;">${esc(it.note || "")}</div>
        <div style="opacity:.55;font-size:12px;margin-top:6px;">${esc(it.ts || "")}</div>
      </div>`;
    }
    if (type === "fortune"){
      return `<div style="padding:10px 0;border-bottom:1px dashed rgba(0,0,0,.2);">
        <div style="font-weight:900;">狀態：${esc(it.status || "")}</div>
        <div style="opacity:.9;margin-top:4px;">${esc(it.amount_kgen || "")} KGEN → ${esc(it.wallet || "")}</div>
        <div style="opacity:.75;margin-top:4px;">${esc(it.purpose || "")}</div>
        <div style="opacity:.65;font-size:12px;margin-top:6px;">${esc(it.ts || "")}</div>
        ${it.paid_tx ? `<div style="opacity:.75;font-size:12px;margin-top:6px;">Tx: ${esc(it.paid_tx)}</div>` : ""}
        ${it.admin_note ? `<div style="opacity:.75;font-size:12px;margin-top:6px;">Note: ${esc(it.admin_note)}</div>` : ""}
      </div>`;
    }
    return "";
  }).join("");
}

/* ---------- Boot ---------- */
let HAS_HOLY_GRAIL = false;

function refreshStats(){
  jsonp("stats", {}, (r) => {
    if (r && r.ok){
      document.getElementById("wt-today").innerText = r.today_visits;
      document.getElementById("wt-total").innerText = r.total_visits;
    }
  });
}

function recordVisit(){
  jsonp("visit", { ua_hint: navigator.userAgent.slice(0,120) }, (r) => {
    // visit 成功會回 total/today，順便刷新
    refreshStats();
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

function loadMyFortuneStatus(){
  jsonp("fortune_status", {}, (r) => {
    const el = document.getElementById("fortuneStatus");
    if (!r || !r.ok) { el.innerHTML = "<div style='opacity:.7;'>載入失敗</div>"; return; }
    renderList(el, r.items || [], "fortune");
  });
}

/* ---------- Actions ---------- */
document.getElementById("btnLamp").addEventListener("click", () => {
  const nickname = document.getElementById("lampNickname").value || "無名者";
  const message  = document.getElementById("lampMessage").value || "（無言）";
  jsonp("lamp_add", { nickname, message }, (r) => {
    const out = document.getElementById("lampResult");
    if (r && r.ok){
      out.innerText = "已點亮（公開）";
      document.getElementById("lampMessage").value = "";
      loadPublicLamps();
    } else out.innerText = "失敗";
  });
});

document.getElementById("btnLantern").addEventListener("click", () => {
  const title = document.getElementById("lanternTitle").value || "天燈";
  const wish  = document.getElementById("lanternWish").value || "（無言）";
  jsonp("lantern_add", { title, wish }, (r) => {
    const out = document.getElementById("lanternResult");
    if (r && r.ok){
      out.innerText = "已放天燈（私密）";
      document.getElementById("lanternWish").value = "";
      loadMyLanterns();
    } else out.innerText = (r && r.error) ? r.error : "失敗";
  });
});

document.getElementById("btnGrail").addEventListener("click", () => {
  const note = document.getElementById("grailNote").value || "";
  jsonp("grail_cast", { note }, (r) => {
    const out = document.getElementById("grailResult");
    if (r && r.ok){
      out.innerText = `擲出：${r.toss}｜${r.result}`;
      HAS_HOLY_GRAIL = (r.result === "聖杯");
      loadMyGrails();
    } else out.innerText = "失敗";
  });
});

document.getElementById("btnFortuneApply").addEventListener("click", () => {
  const out = document.getElementById("fortuneApplyResult");
  if (!HAS_HOLY_GRAIL){
    out.innerText = "需先擲到聖杯（正正）";
    return;
  }
  const email = document.getElementById("fortuneEmail").value || "";
  const wallet = document.getElementById("fortuneWallet").value || "";
  const amount_kgen = document.getElementById("fortuneAmount").value || "";
  const purpose = document.getElementById("fortunePurpose").value || "發財金申請";
  if (!wallet){
    out.innerText = "請填錢包地址";
    return;
  }
  jsonp("fortune_apply", { email, wallet, amount_kgen, purpose }, (r) => {
    if (r && r.ok){
      out.innerText = "已登記，等待審核";
      loadMyFortuneStatus();
    } else {
      out.innerText = (r && (r.message || r.error)) ? (r.message || r.error) : "失敗";
    }
  });
});

document.getElementById("btnFortuneReturn").addEventListener("click", () => {
  const out = document.getElementById("fortuneReturnResult");
  const wallet = document.getElementById("returnWallet").value || "";
  const amount_kgen = document.getElementById("returnAmount").value || "";
  const tx = document.getElementById("returnTx").value || "";
  if (!wallet){
    out.innerText = "請填地址";
    return;
  }
  jsonp("fortune_return", { wallet, amount_kgen, tx, note: "還願歸還" }, (r) => {
    if (r && r.ok){
      out.innerText = "已登記還願";
      loadMyFortuneStatus();
    } else out.innerText = (r && r.error) ? r.error : "失敗";
  });
});

/* ---------- Start ---------- */
refreshStats();
recordVisit();
loadPublicLamps();
loadMyLanterns();
loadMyGrails();
loadMyFortuneStatus();
</script>
