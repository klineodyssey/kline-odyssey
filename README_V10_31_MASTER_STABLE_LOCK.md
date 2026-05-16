# KGEN 12345 V10.31 MASTER STABLE LOCK

BASE_FROM: V10.30_MASTER_STABLE

修正重點：
- 三聖盃不再每 1.5 秒重繪輸入框，避免金額欄閃爍、跳開、不能輸入。
- 金額欄為操作者所有，系統不自動填 8、不自動改數字。
- 恢復並保護 heartbeatClaim / igniteAndClaim / fortuneClaim / vowTo / lightLamp / makeWish。
- 左下 XY MOVE 直接控制主圖 X/Y。
- MOVE Y 與 Universe Elevator 共用同一個 Y/elevator source。
- 宇宙電梯可控制主圖上下移動。
- 下單/鏈上按鈕觸發多空前後鏡：多方前鏡，空方後鏡。
- modules 根目錄維持標準檔名，版本寫在檔案內部。
