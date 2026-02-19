# 五指山・悟空財神殿 12345（Temple UI V2.0 STABLE）

本頁是《K線西遊記》GitHub Pages 的「五指山 12345」神殿入口。
定位：悟空財神殿（Heart 發財金 / 呼吸 / 心跳 / 還願）

## 版本規則（永久定案）
- 此資料夾為「活體主線」：`K線西遊記/temples/12345/`
- 舊版一律封存到 `wukong-temple/archive/` 或 `K線西遊記/archive/`
- 每次更新必須改版本號（V2.0.0 → V2.0.1…），不得覆寫不留版次

## V2 設計核心（避免地址爆炸）
- 神殿頁面不再寫死一堆地址
- 只固定一個 Address Registry（地址石碑）合約地址
- Heart / KUFO / Jade / AutoLP / Blackhole 等器官地址，全部由 Registry 讀取
- 未來新增牛魔王、白骨精等地址：只需在 Registry 設定 key，不必修改每個神殿 HTML

## 目前啟用功能（先穩再通電）
1) 連錢包、顯示鏈與錢包地址
2) 心跳：heartbeatClaim()（每小時一次）
3) 呼吸：igniteAndClaim()（UTC+8 00:00–00:10）
4) 發財金：fortuneClaim(amount)（1~888，月 500 名硬上限由 Heart 合約控）

## 還願（Vow）策略
- V2 預設只開「還願回血到 Heart」（option=0）
- 其他器官（KUFO/MARS、玉帝靈霄寶殿、AutoLP、黑洞）先顯示「待接通」
- 等合約部署完成再打開按鈕（避免 UI 誤導）

## 你要填的兩個東西（通電必填）
- ADDRESS_REGISTRY（地址石碑合約地址）
- HEART_CONTRACT（Heart 合約地址）
> 若你決定「全部只用 Heart 一個地址」，那 Registry 可暫時不填，但長期仍建議用 Registry 管全宇宙地址。

## 相依檔案
- `../../assets/ethers-5.7.2.umd.min.js`（建議放本地，不用 CDN）
- Heart ABI / Registry ABI 已內嵌在 index.html（最穩）
