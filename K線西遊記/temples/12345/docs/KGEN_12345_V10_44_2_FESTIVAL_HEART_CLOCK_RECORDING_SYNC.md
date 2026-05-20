# KGEN 12345 V10.44.2｜Festival Heart Clock + Recording Sync

STATUS: ACTIVE
BASE_FROM: V10.44.1 Divine Regeneration Recording Cell

## 本版目的
修復 V10.44.1 的兩個實際器官病症：

1. 錄影器官顯示 REC 但秒數停在 0。
2. 跨年 / 520 / 1111 倒數由多個舊 Runtime 同時更新，造成畫面閃爍與心率不整。

## 修復內容

- 錄影器官新增 elapsed clock。
- 錄影 HUD、按鈕、export canvas 同步顯示 REC 時間。
- Festival Heart Clock 統一控制 520 / 1111 / 跨年顯示。
- 舊 countdown / ny-countdown / cd-1231 DOM 節點自動隔離。
- 節日細胞停靠右側，寬度固定 360px，收合後只保留標題。

## 不變更內容

- 不新增深層資料夾。
- 不更改正式資產名。
- 不替換 bull-front / bear-rear / heart / warp-core。
- 不搶 wallet / Heart 合約主神經。
