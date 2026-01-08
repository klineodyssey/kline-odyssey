# kline-engine-public（方案2安全版）

這個資料夾只放「公開入口」與輸出結果，不放核心引擎程式碼。

## 你要準備什麼（一次性設定）
1. GitHub Repo → Settings → Secrets and variables → Actions → New repository secret  
   建立：

- `ENGINE_ZIP_B64`：把你的「核心引擎 zip」做 base64 後貼進去  
  產生方式（電腦/Termux 都可）：
  - Linux / macOS / Termux：`base64 -w 0 engine.zip`
  - Windows PowerShell：`[Convert]::ToBase64String([IO.File]::ReadAllBytes("engine.zip"))`

（可選）
- `ENGINE_MODEL_B64`：如果你不想把模型 json 放 repo，也可以用同樣方式放這個 secret

2. 之後每次 `台指近全.xlsx` 更新，Actions 會自動跑並把輸出寫進 `output/`

## 安全性
- public repo 只看得到 run_public.py（入口）與 output（結果）
- 核心引擎 zip 在 GitHub Secrets，外人看不到
