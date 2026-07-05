# KGEN Temple Gameplay Map V0.2

**對應：** `K線西遊記/data/kgen-5d-world-map.json` V0.2

## 節點總覽

| kIndex | ID | nameZh | type | gameplay | npc | economyRole |
|--------|-----|--------|------|----------|-----|-------------|
| 0 | 12345 | 悟空財神殿 | Temple | Heart / 發財金 / 心跳 | 悟空財神 | 多方基地 |
| 16888 | 16888 | 廣寒宮 | Temple | K線引擎 / 空方基地 | 嫦娥 | 空方基地 |
| -1200 | 11520 | 花果山交易所 | Exchange | Swap / LP / Organ 上架 | 神猴交易員 | Organ Exchange |
| 108000 | 108000 | 火星齊天豪宅 | SeatSystem | 500 席位 / 分紅 | 火星分身 | NFT Seat |
| 18888 | 18888 | 靈霄寶殿神明銀行 | Bank | Treasury / 清算 | 神明銀行長 | Divine Bank |
| 18921 | 18921 | 斬妖台 Auto LP | AutoLP | LP 鍛造 / 斬妖 | 斬妖將軍 | Auto LP Forge |
| 8888 | 8888 | 高老莊人民銀行 | Bank | 借貸 / 地下錢莊 | 高老莊莊主 | Underground Bank |
| 8895 | 8895 | 八戒雲棧洞 | Bank | 器官抵押 | 豬八戒 | 雲棧金融 |
| 20888 | 20888 | 火焰山 | RiskArena | 爆倉 / 燃燒教育 | 鐵扇公主 | 風險清算場 |
| 21319 | 21319 | 雷音寺 | LevelNode | 雷音試煉 | 如來使者 | 靈山前哨 |
| 21520 | 21520 | 大雄寶殿 | LevelNode | 佛法任務 | 大雄法王 | 中階聖地 |
| 21666 | 21666 | 佛光普照 | LevelNode | 淨化任務 | 光明菩薩 | 淨化節點 |
| 21888 | 21888 | 恐懼女鬼 | LevelNode | 恐懼試煉 | 恐懼女鬼 | 心理風險 |
| 22188 | 22188 | 貪婪魔影 | LevelNode | Boss 戰 | 貪婪魔影 | 5D Boss 原型 |
| 23333 | 23333 | 靈山 | LevelNode | 終局取經 | 靈山守門人 | 終極聖地 |

## 5D Game 戰場對應

```
[12345 多方基地] —塔— [11520] — [18888] — [18921] —塔— [16888 空方基地]
                      [8888]     [20888]
```

- K 線漲 → 多方推進
- K 線跌 → 空方反撲
- 佔領中路節點 → 經濟加成
- Boss「貪婪魔影」出現在 22188 / 5D 戰場

## 導航路徑

每個神殿 `index.html` 均含：

- 返回 Portal (`../../index.html`)
- 12345 神殿
- 5D Game
- 其他節點入口卡（`KGEN_TempleHub.renderEntryCards`）

## collateralRole 與 organDecompositionRule

| 節點 | 抵押角色 | 分解規則 |
|------|----------|----------|
| 11520 | 上架保證金 | 不足 → 模組回收交易所 |
| 18888 | 全宇宙清算 | 清算觸發分解動畫 |
| 8888/8895 | 借貸抵押 | 逾期 → 器官分解 |
| 18921 | LP 保證金 | 妖氣過高 / LP 不足 |
| 20888 | 高槓桿 | 爆倉全燃燒分解 |
| 關卡節點 | 試煉押金 | 失敗押金分解 |

## 與 Physics Runtime 關係

本文件為 **前端遊戲成品** 映射，不修改 `KGEN_Universe_Physics_Runtime_CURRENT.md`。  
宇宙常數仍以 Runtime CURRENT 為準；前端僅做敘事與 Demo 模擬。
