# WARP ELEVATOR STRUCTURE
VERSION: V10.39.1_TEMPLE_ARCHITECTURE_MASTER

C=0：warp-core.png 在底部  
C=150：warp-core.png 在中段  
C=300：warp-core.png 在頂部

公式：
top = (height - coreHeight) - (C / 300) * (height - coreHeight)


## V10.40.5_MIRROR_CENTER_BULLBEAR_RESTORE 補充

BUILD: 20260518-V10.40.5-MIRROR-CENTER-BULLBEAR-RESTORE

- 本版只做安全修復：正式資產回歸 `assets/heart.png`，不再要求 `wukong_heart_v10_4.png`。
- 左下 MOVE joystick 與 V9 recorder core 必須保留。
- 手機版只修排版與層級，不改合約地址、不改 wallet 流程。
- `12345.html` 與 `wallet-12345.html` 是根目錄橋接檔。
