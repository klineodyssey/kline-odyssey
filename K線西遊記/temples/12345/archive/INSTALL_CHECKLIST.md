## V10.43 FINAL 安裝檢查

1. 上傳 changed-only 或完整包。
2. 若 GitHub 仍有 `modules/organs/` 或 patch/temp/hotfix 檔，依 DELETE_LIST.txt 刪除。
3. 開啟 index.html，確認右上角 SYSTEM PASS。
4. 本地執行 `node verify_manifest.js`，確認 ok=true。


# KGEN 12345 安裝健康檢查表

VERSION: 12345-TEMPLE-V10.42.10-HEALTH-REGISTRY-CHECK

## 上傳前

1. 解壓縮 changed-only 或 full package。
2. 確認檔案路徑保持 `K線西遊記/temples/12345/`。
3. 若上傳 changed-only，請依 `UPLOAD_LIST.txt` 覆蓋同路徑檔案。
4. 依 `DELETE_LIST.txt` 刪除死亡細胞。

## 上傳後

在本機或 GitHub Codespace 執行：

```bash
node K線西遊記/temples/12345/verify_manifest.js
```

## PASS 條件

- missing = 0
- brokenReferences = 0
- deleteListStillExists = 0

## orphan 說明

若 orphan 不是 0，要人工判斷：

- 舊 patch / hotfix / temp：刪除。
- 未登記正式資產：補入 MANIFEST 或移入 archive。
- 深層 modules/organs：刪除，避免神經錯接。
