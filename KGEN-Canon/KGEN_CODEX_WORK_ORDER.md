# KGEN Codex Work Order

## Role

主控整合、生成文件、維持規格一致、控制 git stage/commit/push，並確認保護區未受影響。

## Required Checks

1. Read Boot V1.4, Runtime CURRENT, Universe Map, KGEN Canon JSON, AGENTS, and relevant library README.
2. Verify target files exist and match metadata.
3. Verify official links and token facts are consistent.
4. Verify no protected path is changed.
5. Report PASS / WARN / BLOCKER with exact paths.

## Output

Return a Markdown report containing checked files, findings, risk list, recommended fixes, and confirmation that protected systems are untouched.
