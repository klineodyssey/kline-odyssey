# 悟空財神殿｜Wukong Fortune Temple
## Web Build V2.3（主體定稿：V2.0 長肉版）

> 目標：先讓「殿」不是空殼——按鈕都能按、有紀錄、有博杯、有還願、有語音客服、有生命鍛造入口。  
> 上鏈（Faucet 心臟 / 無人銀行）等合約完成後再接上「真正的自動出金」。

---

## 0. 這包檔案包含什麼

- `index.html`：悟空財神殿主入口（V2.3）
- `life-forge.html`：12生肖生命鍛造（產生可再現 DNA JSON）
- `bookstore.html`：悟空書城（目前是可擴充骨架）

---

## 1. 你要放到 GitHub Pages 的哪裡

建議放在你的 Pages 根目錄（例如 repo 的 `/docs` 或根目錄，依你 Pages 設定）。

最基本結構：

```
/index.html
/life-forge.html
/bookstore.html
```

---

## 2. 合約地址目前寫在哪裡

`index.html` 內建固定值：

- KGEN Token（已填）  
- 無人銀行 GalacticBank v7.5.2（已填）
- Faucet 心臟（**尚未填**，因為你說還沒部署）

### Faucet 地址怎麼填
你部署 Faucet 後，有兩種方式：

1) **改 index.html**  
把 `FAUCET_CONTRACT` 改成你的 Faucet 地址。

2) **不改檔，直接用 localStorage 覆蓋（推薦手機端快速測）**
在瀏覽器 console 或 DevTools 輸入：

```js
localStorage.setItem("WUKONG_FAUCET","0x你的Faucet地址");
location.reload();
```

之後 BscScan 連結會更新，且「領發財金」按鈕在 3 次聖筊後會解除鎖定。

---

## 3. 這一版能做的事情（可驗收）

- ✅ 來訪統計（CountAPI + fallback）
- ✅ 錢包連線（BSC 主網）+ 讀 KGEN 餘額
- ✅ 博杯：連續 3 次聖筊（門檻）
- ✅ 還願：用 KGEN 轉帳到 3 種地址（黑洞/銀行/Faucet）
- ✅ 語音客服（TTS）
- ✅ 一問一答（麥克風辨識→規則回覆→語音唸出）
- ✅ 本機紀錄匯出 JSON（參拜/博杯/還願/發財金）

---

## 4. 重要限制（你要知道的真相）

- 這是純前端頁面：  
  **它不能在你不按錢包確認的狀態下出金。**  
  任何真正的自動出金，必須寫在「合約」或「自動化 Keeper」上。

- 「宇宙銀行」如果是 `Ownable`：  
  代表它有 owner（有鑰匙）。  
  你要「無人/無鑰匙」必須在合約設計上鎖死權限（例如 renounce ownership 或改成不可提領架構）。

---

## 5. 版本管理建議（你說的 archive 作版本）

可以。  
你把舊版丟進 `archive/` 或 `versions/`，新的 `index.html` 覆蓋根目錄即可。

---

## 6. 下一步（上鏈前）

1) 確認 Faucet 心臟合約地址（部署後填入）
2) 在 BscScan 驗證合約
3) 再回來測：
   - 3 次聖筊 → 領發財金
   - 還願轉帳是否正常
   - 錢包餘額讀取是否正確

---

PrimeForge 以母機之名，開啟金融生命。  
花果山台灣・信念不滅・市場無界。  
Where the Market Becomes the Myth.  
—— 樂天帝 ⌖
