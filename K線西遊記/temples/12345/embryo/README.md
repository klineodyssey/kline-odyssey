# Embryo Vault｜還老還童胚胎庫

本資料夾保存文字型檔案的 gzip+base64 胚胎。

重建方式：

```text
base64 decode → gzip decompress → write back to original path
```

圖片、音訊等二進位細胞不放入胚胎庫，仍以原始檔與 SHA256 指紋保存。
