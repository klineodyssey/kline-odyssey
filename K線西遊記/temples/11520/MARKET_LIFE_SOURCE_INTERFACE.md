# 11520 Market Life Source Interface｜怪物來源接口

## Metadata
- VERSION: 1.0.0
- REVISION: 2026-09-04.1
- STATUS: ACTIVE / SOURCE CONTRACT
- PRODUCT: 花果山台灣交易所 11520
- CANON: `HUAGUOSHAN_TAIWAN_EXCHANGE_WHITEPAPER.md` / `MARKET_LIFE_AI_SPEC.md`

## 1. 核心原則
正式遊戲不再把「開機固定生成三隻怪物」當成怪物來源。

怪物／物流 Market Life 的正式因果：

`108 原子 + 一般 K 線/市場知識 -> Exchange Brain -> Logistics / Market Demand -> Digital Ant / other Life decision -> Market Life Source Event -> 11520 World -> 3D visible Life`

玩家不是來源端。玩家自行決定 KX/KY/KZ 多空；Exchange Brain / Digital Ant 不得代玩家下決定。

## 2. 接口事件
來源端只需發三種事件：
- `SPAWN`：生命/物流任務進入 11520 世界。
- `UPDATE`：位置、KX/KY/KZ、資本、生命、貨物、route、strategy 等更新。
- `DESPAWN`：完成任務、返回、撤退、死亡流程或來源端要求離場。

實作：`runtime/market-life-source-runtime.mjs`。

## 3. 最小 SPAWN payload
```js
{
  type: 'SPAWN',
  sourceId: 'DIGITAL-ANT-EXCHANGE-BRAIN',
  lifeId: 'LIFE-DIGITAL-ANT-001',
  name: 'Digital Ant 001',
  species: 'DIGITAL_ANT',
  intelligence: 3,
  markets: ['BTCUSDT'],
  capital: 20,
  vitality: 100,
  positions: {
    KY: { market: 'BTCUSDT', side: 1, lots: 2, c: 0.001 }
  },
  x: -18,
  y: 0,
  z: 6,
  strategy: 'DELIVERY',
  mission: { type: 'LOGISTICS', cargo: 'BTC', destination: 'ATM-11520-001' }
}
```

## 4. K-space
- `KX/KY/KZ side = +1`：該軸多向。
- `KX/KY/KZ side = -1`：該軸空向。
- 沒有該 axis position：該軸 0 / neutral。

來源端可以跨一個或多個軸；11520 只依事件顯示與判斷玩家/生命關係，不覆寫 Digital Ant 自己的 108 原子/物流決策。

## 5. Digital Ant adapter
Digital Ant 可直接使用：

`runtime/digital-ant-market-life-adapter.mjs`

提供：
- `publishDigitalAntSpawn(ant, options)`
- `publishDigitalAntUpdate(ant, options)`
- `publishDigitalAntDespawn(ant, options)`

Digital Ant 不需要修改 `game-5d.html`，也不需要知道 Three.js mesh 細節。

## 6. 遊戲端 slot model
11520 開機建立固定數量的隱藏 Market Life slots；沒有來源事件時保持 `DEAD/HIDDEN`，不構成正式怪物。

`SPAWN` 到達時分配一個 slot；`UPDATE` 更新同一 Life ID；`DESPAWN` 釋放 slot。這讓既有 3D renderer 不必因動態加入 mesh 而重寫主頁，也避免新功能刪掉既有器官。

## 7. Source-managed authority
`sourceManaged=true` 的 Market Life，其市場方向、物流位置與主要策略由來源生命/Exchange Brain 控制。

11520 World 可以：
- 顯示 3D；
- 做玩家/生命 KX/KY/KZ relation；
- 做 collision / UI / animation intent；
- 接正式 settlement 結果。

11520 World 不可以：
- 偷改 Digital Ant 的 108 原子決策；
- 固定把玩家做多變成怪物做空；
- 用普通 attack button 直接殺死來源生命；
- 假造 KGEN/KAIOS 真資產 settlement。

## 8. 傳輸方式
同頁/同 origin 可用 CustomEvent；同 origin 多頁可用 BroadcastChannel；來源事件亦可暫存 localStorage queue，讓 Digital Ant 頁先發布，11520 開啟後再接收。

後續若有正式 backend/WebSocket，只要把 server message 轉成同一 V1 payload 即可，不需重新改遊戲世界接口。

## 9. 108 原子正典
正式名稱維持 **108 原子多空運算引擎**。聊天中的 `107` 屬輸入錯字，不建立新版本、不進正典、不改 interface version。

108 原子的完整原子表、公式、權重、8 軌域聚合尚未由本接口文件重新定義；來源端可以接既有正典 108 engine，但 11520 不得自行杜撰缺失的原子公式。

## 10. Acceptance
接口完成至少需滿足：
1. 沒有來源事件時，正式怪物不由固定 spawn 假造；
2. Digital Ant 發 SPAWN 後，11520 有可見 Market Life；
3. UPDATE 能改位置與 K-space；
4. DESPAWN 能讓同一生命退出世界；
5. 玩家多空仍由玩家自己決定；
6. source-managed 生命不被 11520 內建 AI 覆寫；
7. 不以普通攻擊鍵冒充市場 settlement；
8. 來源 interface 有版本，可追 Git commit。
