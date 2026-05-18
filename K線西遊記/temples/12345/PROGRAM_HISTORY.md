# KGEN 12345 程式履歷

## KGEN-12345-V10.41.2_TEMPLE_FRONT_REPAIR_OPENING_READY

### 母版
- KGEN_12345_V10_40_5_MIRROR_CENTER_BULLBEAR_RESTORE_FULL.zip

### 本次判斷
12345 不需要先做完整戰鬥宇宙。先做神殿開張門面：連錢包、發財金、許願、還願、點燈、心跳、呼吸、節日。

### 本次實作
- `modules/kgen-12345-layout-engine.js`：門面位置、三聖盃位置、底部功能名、debug 清除。
- `modules/kgen-12345-ui-runtime.js`：中央圖 bull / bear / heart 正式綁定，Warp core 跟隨縱桿。
- `modules/kgen-12345-countdown-engine.js`：新穩定倒數條，舊倒數不再壓版。
- `modules/kgen-12345-core.css`：開張門面 CSS 治理。

### 不做
- 不新增遊戲戰鬥。
- 不展開 XY / Z / C / T / CT 大型變化。
- 不覆蓋 assets。
- 不新增帶版本號的 HTML 執行檔。
