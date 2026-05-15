# 五指山・悟空財神殿 12345（Temple UI V10.17 STABLE）

本頁是《K線西遊記》GitHub Pages 的「五指山 12345」神殿入口。  
定位：悟空財神殿（Heart 發財金 / 呼吸 / 心跳 / 還願）

---

# 版本規則（永久定案）

- 此資料夾為「活體主線」：
  K線西遊記/temples/12345/

- 舊版一律封存到：
  wukong-temple/archive/
  或
  K線西遊記/archive/

- 每次更新必須改版本號
  （V10.17 → V10.18）

- 不得覆寫不留版次

---

# V10 設計核心（避免地址爆炸）

- 神殿頁面不再寫死大量地址
- 只固定一個 Address Registry（地址石碑）合約地址
- Heart / KUFO / Jade / AutoLP / Blackhole 等器官地址，全部由 Registry 讀取
- 未來新增牛魔王、白骨精等地址：
  只需在 Registry 設定 key
  不必修改每個神殿 HTML

---

# 已部署正式鏈上地址（BSC Mainnet）

## KGEN Token

0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be

---

## Galactic Bank

0xfc522243e988a837700CaD600D6f030f5932681F

---

## Genesis Inscription

0x15fb2A5463F7873EC328BF6f2E85A115adcC3457

---

## Brain（花果山台灣）

0xd0605F4EF10e5C1438F11AF9edc36926769239d6

---

## MarsSeats

0x3529dbFbaD465C2269F8096879A1c298d5257298

---

## Heart（12345 悟空財神殿）

0xB016D4d8f1aED1339101b30722cad6dbA9B8C972

---

## KUFO

0xef83804c264B47378FCf150086943B53fB90A90b

---

## LP Pair

0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2

---

## Public Good Treasury（花果山台灣）

0xB73D6716005B37BEC742D64482fA26033eE1A4E1

---

# 目前啟用功能（先穩再通電）

1) 連錢包、顯示鏈與錢包地址

2) 心跳：
heartbeatClaim()
（每小時一次）

3) 呼吸：
igniteAndClaim()
（UTC+8 00:00–00:10）

4) 發財金：
fortuneClaim(amount)
（1~888）

5) XYZ 宇宙方向盤系統

6) MOVE / DRIVE 宇宙座標控制

---

# 還願（Vow）策略

V10 預設只開：

「還願回血到 Heart」

option=0

其他器官：

- KUFO / MARS
- 玉帝靈霄寶殿
- AutoLP
- 黑洞

先顯示：

「待接通」

等合約部署完成再打開按鈕。

避免 UI 誤導。

---

# 相依檔案

../../assets/ethers-5.7.2.umd.min.js

建議本地化，不使用 CDN。

Heart ABI / Registry ABI
內嵌於 index.html。

---

# AI SOP（V10+）

本區塊為：

AI / Cursor / Copilot / Autopilot
接手規則。

禁止忽略。

---

# 專案結構

index.html
wallet-12345.html

/assets/
/modules/
/archive/
/SOP/
README.md

---

# 固定資產（禁止亂改名）

/assets/

bull-front.png
bear-rear.png
warp-core.png

---

# 固定 Modules（禁止版本檔名）

/modules/

kgen-12345-xyz-state-engine.js
kgen-12345-panel-router.js
kgen-12345-core.css
kgen-12345-version.js
kgen-12345-holy-cup.js
kgen-12345-stable-countdown.js

---

# XYZ 宇宙座標定義

X = 左右位移
Y = 上下位移 + 曲速同步
Z = 多空方向角

---

# MOVE / DRIVE 定義

## MOVE

左下方向盤：

MOVE = X/Y

---

## DRIVE

右下方向盤：

DRIVE = Z

---

# 母版核心規則（超重要）

12345 與 16888 母版：

方向盤角度 = 圖片角度

完全 1:1。

---

# 多空規則

0度 = 12點鐘方向

## 多方

-90° ～ +90°

## 空方

超過 ±90°

---

# 禁止舊錯誤

禁止：

rotate(zDeg * 2)

禁止：

normalize360()

禁止：

autoCenter()

禁止：

springReset()

---

# VERSION RULE

內容 > 檔名

不可：

舊內容改新版本號

不可：

過期品貼新標籤

---

# STATUS

目前主版本：

V10.17

母版：

12345 TRUE 1:1 MASTER
