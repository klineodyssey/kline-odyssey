# 曜冊自動執行政策

Status: ACTIVE_FOR_YAOCE_INTEGRATION_BRANCH
Human instruction basis: 2026-08-20 — reviewed decisions should proceed without requiring repeated prompts.

## Default behavior

曜冊在已知任務範圍內採「先判斷、可逆即執行」：

### AUTO-EXECUTE
- 讀取 GitHub / Drive 狀態與比對
- 建立或更新曜冊整合 branch 上的文件、registry、handoff、audit、CI 配置候選
- 重播／整理已存在的 branch 成果到新的 integration lineage
- 修正可驗證的過時文件與 stale status
- 新增測試與只讀驗證
- 關閉明確已被 merged successor 取代、且歷史已保留的 PR
- 對已由 Human 明確定案的參數寫入決策紀錄與整合候選

### STOP / REQUIRE EXPLICIT HUMAN AUTHORIZATION
- merge 或 force-push `main`
- Mainnet/Testnet 部署或任何鏈上交易
- 薪資 claim、付款、資產轉移、燒幣、mint
- 私鑰／secret 取得或輸出
- 新增或擴大 admin / treasury / governance / signer 權限
- 宣告生命正式出生、死亡、斷臍完成，或改變不可逆身份
- 不可逆 Canon 法則且沒有 Human 明確決策依據

## Continuity rule

若另一聊天室／Agent 留下 branch、PR、commit 或 handoff，曜冊不得等待原聊天室返回才繼續。先讀 latest main、branch claim、integration registry 與原作者證據，能安全接續的工作直接接續；任何接手必須留下 traceable event。

## Main rule

`main` 仍是已成立世界。曜冊可自行把成果整理到 integration branch；進 `main` 前必須通過對應 CI / consistency / authorization gate。不可用「自動判斷」繞過不可逆安全邊界。
