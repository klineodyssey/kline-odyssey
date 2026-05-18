# 12345 五指山悟空財神殿｜TEMPLE ARCHITECTURE MASTER

VERSION: V10.39.1_TEMPLE_ARCHITECTURE_MASTER
BUILD: 20260517-V10.39.1-TEMPLE-ARCHITECTURE-MASTER
BASE_FROM: KGEN_12345_V10_39_0_RUNTIME_GOVERNANCE_FULL.zip

## 神殿定位
12345 是五指山悟空財神殿，主功能是發發財金、心跳、點火、許願、還願、三聖盃檢查、TempleHeart / Brain 對齊規則。
12345 不承擔 11520 花果山悟空交易所的跨市場交易功能。

## 固定路徑
- 主檔：`K線西遊記/temples/12345/index.html`
- 模組：`K線西遊記/temples/12345/modules/`
- Runtime：`K線西遊記/temples/12345/modules/runtime/`
- 資產：`K線西遊記/temples/12345/assets/`

## 資產綁定
- `bull-front.png`：中央圖多方模式，+Z 多方宇宙
- `bear-rear.png`：中央圖空方模式，-Z 空方宇宙
- `heart.png`：移動暫態圖，拖曳/移動時使用，停止後回多空圖
- `warp-core.png`：右下曲速電梯艙，跟隨 C=0~300 上下移動

## 空間定位
- 左上：悟空財神殿主控制台，下調避開安全區
- 中央：心臟 / 多空主圖 / CT 邊界
- 方向橫桿上方：三聖盃檢查系統，小寬度，不碰橫桿
- 右下：曲速電梯，warp-core.png 為電梯艙
- 右側神規：TempleHeart / Brain 對齊規則小面板，不是 Warp panel
- 左下悟空心臟：心臟引擎視窗，不是左上控制台

## 升版規則
正式檔名固定，版本只寫在 header / README / CHANGELOG / VERSION_GOVERNANCE。不得用改檔名當升版。


## V10.40.5_MIRROR_CENTER_BULLBEAR_RESTORE 補充

BUILD: 20260518-V10.40.5-MIRROR-CENTER-BULLBEAR-RESTORE

- 本版只做安全修復：正式資產回歸 `assets/heart.png`，不再要求 `wukong_heart_v10_4.png`。
- 左下 MOVE joystick 與 V9 recorder core 必須保留。
- 手機版只修排版與層級，不改合約地址、不改 wallet 流程。
- `12345.html` 與 `wallet-12345.html` 是根目錄橋接檔。
