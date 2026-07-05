# KGEN Organ Economy Runtime V0.2

**模組：** `K線西遊記/modules/universe-runtime/organ-economy.js`  
**Build:** Production V0.2 · Frontend Demo Only

## 術語

| 術語 | 英文 | 說明 |
|------|------|------|
| App | Organism | 完整生命體應用（如 12345 Heart 生態） |
| Module | Organ | 可拆卸功能模組（心臟、大腦、錢包…） |
| 保證金 | Collateral | 上架 / 借貸 / LP 所需 KGEN 抵押 |
| Organ Decomposition | — | 保證金不足時器官分解回收 |

## 經濟樞紐

```
                    ┌─────────────┐
                    │  18888 銀行  │ ← 稅收 10% · 清算中心
                    └──────┬──────┘
                           │
    ┌──────────┐    ┌──────▼──────┐    ┌──────────┐
    │ 8888 地下 │◄──►│ 11520 交易所 │◄──►│ 8895 雲棧 │
    └──────────┘    └──────┬──────┘    └──────────┘
                           │
                    ┌──────▼──────┐
                    │ 18921 斬妖台 │ ← 稅收 5% Auto LP
                    └─────────────┘
                           │
                    ┌──────▼──────┐
                    │ 20888 火焰山 │ ← 爆倉清算
                    └─────────────┘
```

## 保證金比率

```javascript
marginRatio = collateral / debt
```

| 比率 | 風險等級 | UI 顏色 |
|------|----------|---------|
| ≥ 1.5 | 安全 | #7cffc5 |
| ≥ 1.2 | 觀察 | #ffd778 |
| ≥ 1.0 | 警戒 | #ff8d35 |
| < 1.0 | 清算 / 分解 | #ff4444 |

## Organ Decomposition 流程（遊戲化）

1. ⚠️ 保證金不足警告
2. 🔥 器官能量流失
3. 💀 Organ Decomposition
4. ♻️ 模組回收至 11520 交易所池

觸發方式：各神殿「模擬逾期 / 清算 / 保證金不足」按鈕  
動畫：`KGEN_TempleHub.showDecompositionOverlay()`

## 各神殿經濟玩法

### 11520 Organ Exchange

- 上架 App（Organism）或 Module（Organ）
- 需抵押 KGEN 保證金
- Order Book / Depth / LP 模擬
- 分解後模組重新 listing

### 18888 Divine Bank

- Treasury / Reward / Reserve 儀表
- 抵押 App / Organ / Module
- 風險分級 → 清算說明
- DappBay / CertiK / GoPlus 稅率說明區

### 8888 + 8895 地下金融

- 人民銀行存款 / 地下借貸
- 八戒 NPC 器官抵押
- 與 11520 交易所連動回流

### 18921 Auto LP Forge

- 模擬投入 KGEN + BNB
- 產生 LP 能量
- 妖氣過高 → 斬妖動畫
- APR / Reserve / Pair 儀表

### 20888 火焰山

- 槓桿模擬
- 爆倉 → 燃燒全器官分解
- KGEN 稅率 0.30% 不可改教育

## 遊戲中怎麼玩

1. Demo 錢包自動連線（`KGEN_Wallet.demoMode = true`）
2. 在各神殿操作借貸 / 上架 / LP 投入
3. 故意觸發「保證金不足」看分解動畫
4. 5D Game 中佔領經濟節點獲得加成敘事

## 未來怎麼接鏈上

| 層級 | 接鏈方案 |
|------|----------|
| 抵押登記 | Brain Exchange / 鏈上 mapping |
| 清算 | Lingxiao Bank 合約 event |
| Organ NFT | ERC-721 metadata + 11520 listing |
| LP | PancakeSwap pair reserves read |
| 分解 | 鏈上 burn + 事件驅動前端動畫 |

**重要：** KGEN 稅率 0.30% 已 bytecode 鎖死，不得為 UI 合規重新部署 token 或開 tax setter。

## API（前端）

```javascript
KGEN_OrganEconomy.marginRatio(collateral, debt)
KGEN_OrganEconomy.riskLevel(ratio)
KGEN_OrganEconomy.renderCollateralGauge(container, collateral, debt)
KGEN_OrganEconomy.renderOrganTable(container, organs, onDecompose)
KGEN_OrganEconomy.simulateDecomposition(organ, onTick, onComplete)
```
