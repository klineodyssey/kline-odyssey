# Handbook｜KLINE ODYSSEY 主專案（Root）

本文件為《KLINE Odyssey / 花果山台灣》專案之
**最高層交接與操作規則**。

適用對象：
- 未來協作者
- 工程人員
- 內容製作人
- 系統維運者

---

## 1. 專案定位

本 Repo 同時具備三種角色：

1. 🌐 官網（GitHub Pages）
2. 📦 制度與白皮書存放庫
3. 🤖 自動化系統（GitHub Actions）

本專案 **不是單一產品 Repo**，
而是一個「長期演化的內容 × 系統 × IP 宇宙」。

---

## 2. 檔案角色總覽（不可混用）

| 檔案 / 資料夾 | 角色 | 是否可隨意修改 |
|--------------|------|----------------|
| README.md | 官網首頁（Public Landing） | ❌ 不可 |
| index.md | 導覽 / 索引 | ⚠️ 限結構內 |
| handbook.md | 交接與規則 | ✅ 可補充 |
| /whitepaper | 正式文件 | ⚠️ 需標註版本 |
| /.github/workflows | 自動化 | ❌ 不可亂動 |

---

## 3. README.md（官網）的鐵則

- README.md = 官網首頁
- 世界觀、品牌、主影片 **固定**
- 僅允許 GitHub Actions 更新指定區塊：
  - `<!-- LATEST_VIDEO_START -->`
  - `<!-- LATEST_VIDEO_END -->`

❌ 禁止：
- 手動改 Latest Video 區塊
- 任意更換 iframe 主影片
- 減少官方入口

---

## 4. index.md 的定位

index.md 僅作為：
- 導覽
- 分類
- 入口說明

index **不承擔品牌敘事、不承擔制度權威**。

---

## 5. handbook.md 的使用原則（全專案通用）

每一個重要資料夾：
- 都應有一份 handbook.md
- 用來說清楚：
  - 這裡是幹嘛的
  - 哪些能動、哪些不能動
  - 有沒有自動化

handbook 是 **防呆系統，不是說明書**。

---

## 6. 終極原則（不可違反）

- 不確定 → 不要動
- 要動結構 → 先寫 handbook
- 自動化 > 人工操作
- 世界觀優先於短期方便

---

⌖  
PrimeForge 以母機之名，開啟金融生命。  
花果山台灣・信念不滅・市場無界  
Where the Market Becomes the Myth.  
—— 樂天帝
