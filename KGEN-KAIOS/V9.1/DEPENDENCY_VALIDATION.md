# Dependency Validation

**Document ID:** KAIOS-V9.1-DEPENDENCY-VALIDATION  
**Version:** V9.1  
**Status:** Draft for Review  
**Scope:** Required dependency checks before DRAFT promotion.

## 1. Dependency Checks

Every DRAFT must validate:

- `dependencies_exist`
- `dependencies_done`
- `dependency_cycles`
- `blocked_dependencies`
- `stale_dependencies`
- `missing_reports`
- `missing_branches`

## 2. Dependency Categories

| Category | Example |
|---|---|
| File dependency | Schema, source example, runtime doc. |
| Report dependency | Prior QA report or review record. |
| Branch dependency | Handoff branch required for execution. |
| Task dependency | Prior WorkOrder must be DONE. |
| Human dependency | Human review must be present. |
| Legal / Security dependency | Legal or security review must be complete. |

## 3. Promotion Rule

If a dependency is missing and required for the task to be safely executed, Codex must choose `BLOCKED` or `NEEDS_REVISION`. Codex may promote only when missing dependencies are explicitly non-blocking and documented.

## 4. Cycle Rule

A DRAFT cannot depend on itself directly or indirectly. If a cycle exists, the task is blocked until the dependency graph is rewritten.

## 5. Stale Dependency Rule

If the dependency points to an old report or stale base commit, Codex must decide whether the source is still valid. If not, the task becomes `NEEDS_REVISION` or `BLOCKED`.
