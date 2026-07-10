# Dispatch Dependency Gate

**Document ID:** KAIOS-V9.3-DISPATCH-DEPENDENCY-GATE  
**Version:** V9.3  
**Status:** Draft for Review

The Dependency Gate prevents a Worker from claiming a task whose required evidence, branch, report, or upstream review is missing.

## Checks

| Check | Meaning |
|---|---|
| `dependencies_exist` | Every referenced input path exists or is explicitly external. |
| `dependencies_done` | Required reviews, sync results, and prior WorkOrders are complete. |
| `no_cycle` | Task does not depend on itself or a downstream task. |
| `no_blocked_dependency` | No required dependency is `BLOCKED`. |
| `no_stale_dependency` | Source evidence is still compatible with current main. |
| `required_reports_exist` | Review and audit reports exist. |
| `required_branches_exist` | Required handoff branch exists only when the task depends on one. |

If any item fails, Codex keeps `Dispatch Hold: true` and writes a dependency gate result.

