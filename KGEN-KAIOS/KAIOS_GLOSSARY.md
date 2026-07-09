# KAIOS Glossary

**Version:** V7.0 Genesis
**Status:** Architecture First / Draft for Review

| Term | Definition |
|---|---|
| KAIOS | KGEN AI Operating System |
| Worker | Any AI or human executor registered to perform WorkOrders |
| Worker Registry | Canonical list of workers and current state |
| Task Dispatcher | System that assigns task lifecycle and routing |
| Claim | Worker declaration that it is taking a task |
| Lease | Time-bounded claim that prevents duplicate work |
| Handoff Branch | Branch where a worker submits work for review |
| Report | Required evidence artifact for any task |
| Review Pipeline | Codex-controlled path from handoff to merge or reject |
| Message Bus | GitHub-based communication through branches, reports, logs, and queue state |
| Dashboard | Reconstructable view of company health |
| Recovery | Procedures for restoring safe state after failure |
| Protected Path | File or folder that workers cannot change without explicit authorization |
