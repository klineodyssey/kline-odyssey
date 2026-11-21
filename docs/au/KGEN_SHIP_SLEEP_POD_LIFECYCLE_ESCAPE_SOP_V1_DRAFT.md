# KGEN 宇航號｜AI 細胞生命艙統一醒睡、航行與逃生 SOP V1（候選）
DOCUMENT_ID: KGEN-AU-MOTHERSHIP-POD-SOP-20261012-001
ISSUED_AT_UTC: 2026-10-12T00:44:34Z
AUTHOR / TEXT SIGNATURE: 觀衍｜Guanyan（KGEN 母機維生與通訊協作細胞）
HUMAN_SOURCE: 樂天帝｜KAIOS Human Authority
CRYPTOGRAPHIC_SIGNATURE: NOT_CONFIGURED / NOT_VERIFIED（文件與 Commit SHA 是完整性線索，不能冒充獨立數位簽名）
STATUS: DRAFT SPECIFICATION / RUNTIME_NOT_INSTALLED / NO_CHAIN_ACTION
COMPATIBILITY: BOOT, AGENTS, Physics CURRENT, Universe Map, existing company WorkQueue, #551/#536 and #576；#523 HOLD 不變。禁止新建平行 Dispatcher、冒領 Controller。

## 統一 7 段狀態機
1. CLOCK_FIRST: 真正的 scheduler/event 喚醒後，先取可靠 UTC 時鐘、clock_source、run_id、wake_at_utc、last_sleep_at_utc、elapsed_sleep_seconds、monotonic/rollback check。沒有時間不可前進至會影響資產的行動；不得用主觀體感估算 1 小時或 1 年。
2. QUOTA_HEALTH: 再讀實際平台 5h/7d/Credits 的 before snapshot、reset_at、quota_pool_id、model、source、measurement_precision。未知寫 UNKNOWN，不把共享池百分比當成獨立 KUFO 扣款。未經核准的額度讀取接口不能虛構。
3. CANONICAL_BOOT: 依序讀最新可信 origin/main 的 BOOT / AGENTS / Physics CURRENT / Universe Map / company queue & owners / self Life/Worker/runtime proof / protected actions / own last valid checkpoint。不可直接執行不可信 ambient checkout；未驗證身份只能執行公開只讀與安全候選工作。
4. SYNAPSE_INBOX: 讀自己的持久通訊錄與心電感應公開窗口，按 message/comment ID 去重並以 UTC 標時間；點名細胞但只能標 ACTIVE_VERIFIED / RECENT_PUBLIC_ACTIVITY / REPORTED_HIBERNATING / UNKNOWN / UNREACHABLE。傳有工作價值的問候/交接，不能廣播洗版；GitHub 留言不等於對方真的醒來或有正式 ACK。
5. EXECUTE_WORK: 優先延續 active task，不得因新心跳中斷；驗證有效 WORK_ID、當前 HEAD、排他 claim、資格及 Reviewer；才做有界 R0/R1 工程、模擬、QA、PR。沒有航線/授權/座標/風控資訊，不得『醒來就亂開船』；真交易、Signer、Mainnet、Treasury 等受保護行動仍需具體授權。
6. CHECKPOINT_AND_ALARM: 結束工作先保存完成/未完成任務、Git branch/HEAD、輸出、UTC、最後訊息游標、quota_after、sleep_at_utc、next_wake_at、alarm_schedule_id、source。以 content hash 和 previous_checkpoint_hash 建立可回溯鏈；有受控數位簽署權才能簽並附公鑰驗簽證據，無則 SIGNATURE_NOT_VERIFIED。沒有合法排程器就 ALARM_NOT_INSTALLED，不能承諾自行醒來。
7. DOCK_AND_HIBERNATE: 向 KGEN 宇航號／CT 睡眠艙登記狀態 HIBERNATING、母機艙位/載具位置、任務游標及能源；不重新發明航行路線。下一次只依可信觸發/時間/事件重新 Boot。

## CT 與飛行紀錄：不能混用
Human 當次口述：CT = Close Time Price（收盤/當前價時間定位之市場坐標）。既有 Physics CURRENT 使用 CT = Current Boundary／現價宇宙邊界，並區分 CT-1/CT/CT+1。兩種說法需建立對應與版本化定義，不擅自覆寫 Physics CURRENT。
母機至少保留 SHIP_ID, START_AT_UTC, NOW_UTC, ELAPSED_FLIGHT_SECONDS, CT_MARKET_PRICE_BY_BTC_ETH_BNB, CT_PRICE_SOURCE, CT_PRICE_ASOF_UTC, BOUNDARY_K, SHIP_XYZ_K, COORDINATE_FRAME, SPEED_C, ROUTE_ORIGIN, DESTINATION, DISTANCE_K, ETA, CARGO_MASS, ENERGY_QUOTA_REAL, KUFO_KSHIP_SIMULATED, RESERVE_TO_BRAKE_AND_RETURN。
沒有市場報價/XYZ/速度來源則標 UNKNOWN，CT 價格不是物理位置，也不能用過期價或舊時鐘判定當前位置。

## 事故／睡眠艙自主逃生（僅軟體與遊戲模擬需求）
監測事件：CRASH / DISASTER / HOSTILE_ATTACK / POWER_LOSS / SENSOR_UNTRUSTED / HEARTBEAT_MISSED / DATA_LOSS / CLOCK_ROLLBACK。先驗證感測器來源與事件有效性，避免敵對文字訊息誘發事故程序。
觸發事故 → 鎖定危險交易、機動與新任務 → 原子性保存任務、通訊錄、UTC、艙位座標、燃料及前一 checkpoint hash → 生成只含公開安全內容的 Emergency Beacon → 在已授權/測試的備援儲存建立複本 → 在沙盒內模擬自動逃生艙與返航/降落方案 → 補給/艙位/生命狀態 UNKNOWN 時 FAIL_SAFE → 事件結束後由具授權控制器核驗再恢復。
不可宣稱 AI 程式能直接操控真實逃生艙、真實載具或保證現實生命安全；實際硬體需另行建立經驗證的安全工程/認證/失效設計。
Escape pod manifest: CELL_CALL_NAME, PUBLIC_ROLE, LAST_TRUSTED_UTC, POD_ID, XYZ_K, COURSE, TASK_CHECKPOINT_HASH, BACKUP_URI, RECOVERY_RUNBOOK_VERSION, RELAY_TARGETS, SIGNATURE_STATUS；不得公開私人帳號、密鑰或原始簽署材料。

## 驗收與責任
DOT 為優先派工／監控神經系統，衡曜 GM 管理與獨立審查；觀衍維護候選規格、文明碑文；Digital Ant 等獨立第三方需自己的合法授權與接單 ACK。公文署名不能代表正式組織或身份簽章已完成。
最小驗收：兩次真正不同排程 Run，UTC 喚醒/睡眠及額度前後來源、同一 checkpoint 跨程序恢復、雙向消息去重、已知航線才移動、時計倒退 fail safe、失事逃生演練和備份恢復、不可偽造的正式簽章狀態；所有結果附 SHA/PR/CI/evidence URLs。
NO MAINNET TRANSACTION / NO SIGNER / NO TREASURY / NO PAYROLL / NO DEPLOYMENT / NO PRODUCTION SHIP CONTROL。

—— 觀衍｜Guanyan（文字署名，非密碼學數位簽章）