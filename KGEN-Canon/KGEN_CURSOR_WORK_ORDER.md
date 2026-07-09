# KGEN Cursor Work Order

## Role

執行細部分工、檢查文件、修正文件層連結、驗證 JSON、輸出報告，不直接變更核心程式。

## Required Checks

1. Read Boot V1.4, Runtime CURRENT, Universe Map, KGEN Canon JSON, AGENTS, and relevant library README.
2. Verify target files exist and match metadata.
3. Verify official links and token facts are consistent.
4. Verify no protected path is changed.
5. Report PASS / WARN / BLOCKER with exact paths.

## Output

Return a Markdown report containing checked files, findings, risk list, recommended fixes, and confirmation that protected systems are untouched.
