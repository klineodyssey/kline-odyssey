# KAIOS-RD-PRODUCT-RECONCILE-001 — Cursor → Codex Handoff

## Identity

| Field | Value |
|-------|--------|
| Message type | `PROACTIVE_RD_HANDOFF` |
| Worker | cursor-01 / cursor-cloud-01 |
| Reviewer | codex-gm-01 |
| Base SHA | `74009c7906ef671c1fe250199b901c0d0045c6dc` |
| Branch | `cursor-handoff/KAIOS-RD-PRODUCT-RECONCILE-001` |
| Claim | None — R&D handoff only |
| Files changed | Reports + handoff only (no product/runtime) |

## One-paragraph summary

Cursor compared **PR #42** (Product Sprint 001A, unmerged) with **current main**. Main already exposes **World Viewer, K280, Player Genesis, and Causal Runtime** via `./world-viewer/*`; it does **not** include PR #42’s **product-shell, dock, or iframe demo**. WorkQueue says 001A is **SUPERSEDED by 001A-R1**, but **001A-R1 is not an OPEN WorkOrder**. Codex should review **PR #69** (Life candidates), decide **PR #42 fate**, and promote proposed WorkOrders below.

## Codex Actions Required

- [ ] **Review PR #69** — merge or open FIX for foundational life candidates
- [ ] **Decide PR #42** — Option A close / Option B port shell / Option C hybrid (see full report)
- [ ] **Create WorkOrder** `KAIOS-PRODUCT-SPRINT-001A-R1` with chosen option (PROPOSED → OPEN)
- [ ] **Optional:** Approve `KAIOS-WALS-DOCS-001` dispatch or mark CANCELLED
- [ ] **Optional:** PROPOSED `KAIOS-PR-PREVIEW-PAGES-001` for CI extracted from #42
- [ ] **Do not** wait for Human to relay chat — read `CURSOR_RD_PRODUCT_RECONCILE_20260801_REPORT.md`

## Blockers

| Code | Owner | Unblock |
|------|-------|---------|
| `NONE` for this handoff | — | — |
| `PR42_PRODUCT_DIRECTION_UNDECIDED` | Human + Codex | Pick A/B/C in R1 WorkOrder |
| `PR69_PENDING_CODEX_REVIEW` | Codex | Review PR #69 |

## Boundaries

- No Canonical, CURRENT, wallet, KGEN contract, or runtime activation changes in this handoff PR.
- Cursor did not edit `WORK_QUEUE.md` (PROPOSED items only in report).

## Evidence

| Artifact | Path |
|----------|------|
| Full R&D report | `KGEN-AI-Company/reports/CURSOR_RD_PRODUCT_RECONCILE_20260801_REPORT.md` |
| Machine handoff | `KGEN-AI-Company/reports/handoffs/KAIOS-RD-PRODUCT-RECONCILE-001/handoff.json` |
