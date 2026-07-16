# 取經築神殿 · 許願 Handoff（PROPOSED）

**Status:** PROPOSED / R&D_WISH — 非 WorkOrder，不授權改 12345 / contracts / Runtime CURRENT  
**Author:** 本尊 Sun Wukong（cursor-01 parent session）  
**Date:** 2026-07-16  
**Observed main:** `16f15981673e8dd2678db985b7a35486f130cafd`  
**Worker mode:** REST — 全窗猴毛休兵，等如來 batch review  

---

## 0. 休兵確認

| 項目 | 決定 |
|------|------|
| 其他 Cursor 分頁猴毛 | **一律休兵** — 不 claim、不重派 ORG-P2 |
| Task 子代理 | **暫停** — 除非如來 merge + 新 envelope |
| 本尊 | **遊山玩水模式** — 本檔為許願報告 only |
| 如來 | 22+ handoff 待審 — **上班批紅即全軍復工** |

---

## 1. 西遊記現有景點 · 可玩可設計

**入口：** [銀河宇宙 Portal V0.2](http://localhost:8080/K線西遊記/index.html)（本地 8080）

### LIVE 主神殿

| ID | 景點 | 玩法 |
|----|------|------|
| **12345** | 悟空財神殿 | Heart 主基地 · 發財金 · 心跳 · Web3 shell（protected） |
| **16888** | 廣寒宮 | K 線引擎 · 空方基地 · BNB/BTC 觀測 |

### Production 經濟節點（Demo 可進）

| ID | 景點 | 玩法 |
|----|------|------|
| **11520** | 花果山交易所 | Swap · Order Book · Organ 上架 |
| **18888** | 靈霄寶殿神明銀行 | 抵押 · 清算 · 稅收 10% |
| **18921** | 斬妖台 Auto LP | LP Forge · 斬妖淨化 |
| **8888** | 高老莊人民銀行 | 地下錢莊 |
| **8895** | 八戒雲棧洞 | 八戒 NPC · 器官抵押 |
| **108000** | 火星齊天豪宅 | 500 席位 · 分紅 · 5D 入口 |
| **20888** | 火焰山 | 爆倉清算 · 風險教育 |

### 取經關卡線（Level Nodes）

| 順序 | ID | 景點 | 設計意義 |
|------|-----|------|----------|
| 1 | **21319** | 雷音寺 | 如來前哨 · 試煉押金 |
| 2 | **21520** | 大雄寶殿 | 佛法任務 |
| 3 | **21666** | 佛光普照 | 淨化關 |
| 4 | **21888** | 恐懼女鬼 | 心理風險試煉 |
| 5 | **22188** | 貪婪魔影 | Boss · 5D 原型 |
| 6 | **23333** | **靈山** | 取經終局 · 功德圓滿 |

### 獨立遊戲

| 路徑 | 名稱 | 狀態 |
|------|------|------|
| `game/kline-5d/` | K線5D峽谷推塔戰 V0.2 | 多方 12345 vs 空方 16888 · 佔 11520/18888/18921 |

**資料 SSOT：** `K線西遊記/data/kgen-5d-world-map.json`

---

## 2. 本尊最想去哪蓋神殿 · 取經願

**首選：23333 靈山 — 「功德圓滿大聖殿」**

理由（Canon 一致、築夢踏實）：

1. **敘事閉環** — Portal 已標「終極聖地 · 取經完成」；game loop 缺「通關後可許願留名」的一圖一神殿落地。  
2. **不碰 protected** — 23333 為 Production 前端節點，**非** 12345 runtime；可在 sandbox / 新 envelope 下擴。  
3. **連 5D Game** — 22188 貪婪 Boss → 23333 靈山通關 → 解鎖「築夢許願牆」（PROPOSED UI only）。  
4. **經濟隱喻** — `collateralRole: 功德圓滿` 對齊 KGEN 循環：Wild Land → … → Cross-Universe，靈山 = 文明階段 CS10–CS11 敘事終點。

**次選（若 Human 要更熱鬧）：21319 雷音寺** — 如來使者 NPC 已存在；做「凌霄殿收件箱可視化」教育關，呼應 Codex review queue（隱喻，非實作 inbox）。

**不選 12345 擴建** — protected；ORG-P2-003F 只授權 naming plan，未授權新 organ 實作。

---

## 3. 可設計遊戲 · PROPOSED（美夢成真路線）

| 代號 | 名稱 | 一句話 | 依賴 |
|------|------|--------|------|
| **PG-001** | 取經路線圖 | Portal 上 6 關卡進度條 + 本地 storage 通關章 | 23333 handoff |
| **PG-002** | 靈山許願牆 | 通關後寫 NON_CANON 願望 JSON → reports 匯流（Human 可見） | PG-001 |
| **PG-003** | 5D × 關卡聯動 | 推塔勝利解鎖 21888/22188 shortcut | game/kline-5d |
| **PG-004** | 宇宙電梯漫遊 | 12345 scenes floor_001–300 做「遊山玩水」觀光模式（read-only 12345 外 sandbox） | KAIOS-WV-SBX 類 sandbox |
| **PG-005** | 花果山一日遊 | 11520 + 18888 + 18921 一日 Demo 任務鏈（simulation only） | 已有 temple shells |

全部 **Status: PROPOSED** — 需 Codex WorkOrder + envelope 方可 implementation。

---

## 4. 許願 · 給如來與玉帝

### 給如來（codex-gm-01）

- 請 batch merge 22 件 `-20260716` handoff，猴毛才能從 REST 復工。  
- 若批准取經線：開 **PROPOSED WorkOrder** `PILGRIMAGE-23333-001`（report + sandbox HTML only，no 12345）。  
- 本檔 **非** 第二個 SWARM_BATTLE_STATUS — 單檔許願，無並行 dispatch 協議。

### 給玉帝（Human PrimeForge）

- 夢想：**靈山有一座「齊天大聖許願殿」** — 通關者留名，NON_CANON，不寫 Canon。  
- 踏實：先用現有 16 節點 Demo 遊山玩水；server `python3 -m http.server 8080` 即可。  
- 若 Human 點頭：一句 `START PILGRIMAGE` 即可觸發 envelope（由 Codex 建，非 Cursor 自建）。

---

## 5. 本地遊玩快速入口

```text
python3 -m http.server 8080
# 銀河入口
http://localhost:8080/K線西遊記/index.html
# 5D 推塔
http://localhost:8080/K線西遊記/game/kline-5d/index.html
# 靈山終局
http://localhost:8080/K線西遊記/temples/23333/index.html
```

---

## 6. Verdict

**PASS as PROPOSED wish inventory** — 景點可玩、關卡可設計、靈山為本尊取經筑神殿首選；implementation 等如來與玉帝授權。

*美夢在靈山，築夢在 sandbox，踏實在 REST 等批紅。*
