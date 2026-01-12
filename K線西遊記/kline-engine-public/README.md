# kline-engine-public（方案2安全版｜Release Asset 版）

這個資料夾只放「公開入口」與輸出結果，不放核心引擎程式碼。

## 引擎放哪裡？
核心引擎以「Release Asset」方式提供：
- 在 GitHub Releases 建立/更新一個 Release（例如 tag: `engine-v1.0`）
- 上傳資產檔：`ENGINE_ZIP_B64.zip`
- workflow 會自動抓「Latest Release」的這個資產並解壓到 `engine_bin/` 執行

> ✅ public repo 只看得到 `run_public.py` 與 `output/`
> ✅ 核心引擎不進 repo，只在 Release 資產裡

## 你要準備什麼（一次性設定）
1. 建立一個 Release（tag 可叫 `engine-v1.0`, `engine-v1.1`…都行）
2. 上傳 asset：`ENGINE_ZIP_B64.zip`
3. repo 內必須存在：
   - `K線西遊記/kline-taifex/master/台指近全.xlsx`
   - `K線西遊記/kline-engine-public/run_public.py`
   - `K線西遊記/kline-engine-public/requirements.txt`

## 之後怎麼跑？
每次 `台指近全.xlsx` 更新（push），Actions 會自動：
1) 下載 latest release 的 `ENGINE_ZIP_B64.zip`
2) 解壓到 `engine_bin/`
3) 呼叫 `run_public.py` 自動找入口並執行
4) 把輸出寫回 `K線西遊記/kline-engine-public/output/`

## 安全性
- public repo：只公開入口與結果
- 核心引擎：只放 Release asset（不放原始碼到 repo）
