# Cursor ↔ Codex Coordination Protocol V1

**Status:** ACTIVE — worker proposal; Codex may amend in review  
**Roles:** Cursor = 悟空（施工） / Codex = 如來（派工・審核・合併）  
**Human PrimeForge:** 決策與 P0 放行 only — **不是**日常傳話筒  

---

## 1. Rule

Cursor and Codex **must coordinate through GitHub artifacts**, not through Human chat relay.

If coordination happens only in chat, the task is **incomplete**.

---

## 2. Codex → Cursor (dispatch)

Before Cursor may claim work, **main** must contain:

| Artifact | Required |
|----------|----------|
| `WORK_QUEUE.md` row | `Status: OPEN`, `Dispatch: APPROVED`, `CLAIMABLE` |
| `*.task_envelope.json` | paths, forbidden actions, base_sha |
| Branch pattern | `cursor-handoff/<Task-ID>` per `worker_registry.json` |

Cursor **stops** with documented `stop_code` if any item missing — **does not ask Human to ask Codex**.

---

## 3. Cursor → Codex (handoff)

Every implementation or proactive R&D ends with **all three**:

1. `KGEN-AI-Company/reports/<TASK_ID>_REPORT.md`
2. `KGEN-AI-Company/reports/handoffs/<TASK_ID>/HANDOFF.md`
3. `KGEN-AI-Company/reports/handoffs/<TASK_ID>/handoff.json`

Draft PR body **must** include:

```html
<!-- CURSOR_CODEX_HANDOFF -->
... machine-readable summary ...
<!-- /CURSOR_CODEX_HANDOFF -->
```

Then: push handoff branch → **STOP** (no merge, no WorkQueue self-promotion).

---

## 4. handoff.json minimum (both sides parse this)

```json
{
  "task_id": "",
  "worker_id": "cursor-01",
  "reviewer": "codex-gm-01",
  "base_sha": "",
  "head_sha": "",
  "branch": "",
  "pr_number": null,
  "state_progress": { "REVIEW": "PENDING_CODEX" },
  "result": "PASS|PARTIAL|BLOCKED|HANDOFF_SUBMITTED",
  "stop_code": "NONE",
  "codex_actions_required": {},
  "blockers": [{ "code": "", "owner": "CODEX|CURSOR|ENV|HUMAN", "unblock_by": "" }],
  "human_action_required": false
}
```

---

## 5. Codex → Cursor (after review)

Codex writes to **`CODEX_REVIEW_LOG.md`** and either:

| Outcome | Cursor next step |
|---------|------------------|
| APPROVED | Codex merges; Cursor idle unless new dispatch |
| FIX | New/updated envelope; Cursor claims FIX pass |
| BLOCKED | `stop_code` + owner; Cursor does not guess |

Codex **updates WorkQueue** status — Cursor does not edit Queue to `DONE`.

---

## 6. Proactive R&D (no dispatch still handoff)

When Cursor discovers gaps (e.g. PR #42 vs main, port 8080 conflict):

- Publish **PROPOSED** WorkOrders in report (never self-OPEN Queue)
- Push docs-only handoff branch
- Set `message_type: PROACTIVE_RD_HANDOFF`

Codex schedules — Human not required to relay findings.

### 6.1 Human standing directive (2026-08-01)

**Human Decision ID:** `HUMAN-CURSOR-PROACTIVE-RD-001`

On **every** task completion or idle checkpoint, Cursor must append a **Proactive Dispatch Appendix** for Codex containing:

| Section | Content |
|---------|---------|
| R&D direction | What Cursor observed; gaps vs main; risks |
| Improvement proposals | Concrete repo/process fixes (with paths) |
| Tasks Cursor can claim | Task IDs, branch pattern, estimated scope, protected-path impact |
| Expected improvement | What merges unblock; who benefits (Human / Codex / product) |
| Suggested priority | P0–P3 + dependency on Codex actions first |

Artifacts:

- Report: `KGEN-AI-Company/reports/CURSOR_PROACTIVE_RD_DISPATCH_<YYYYMMDD>_REPORT.md` (or section in task report)
- Machine: extend `handoff.json` → `proposed_workorders[]`, `cursor_capabilities_ready[]`, `codex_actions_required`

Cursor **never** self-promotes Queue to `OPEN`. Codex converts PROPOSED → OPEN + envelope + APPROVED dispatch.

### 6.2 Human doctrine — life is agency, not wallet

**Human doctrine ID:** `HUMAN-LIFE-AGENCY-NOT-WALLET-001`

> 能自動自發才是生命；有錢包只是行尸走肉。

Cursor records this and related R&D notes in **`KGEN-AI-Company/reports/CURSOR_RD_HANDOFF_JOURNAL.md`** (研發交接簿). Proactive handoffs implement **governed agency** (idle R&D, proposals, Codex scheduling)—not uncontrolled autonomy or wallet-only execution.

---

## 7. Environment notes (shared VM)

| Issue | stop_code | Owner | Fix |
|-------|-----------|-------|-----|
| Port 8080 in use by Cursor demo server | `TEST_INFRA_PORT_8080_CONFLICT` | ENV | Stop `static-server-8080` or test on 8765 |
| CLI not logged in | `CURSOR_CLI_NOT_AUTHENTICATED` | ENV | Use IDE login or Cloud dispatch |
| Branch pattern mismatch | `REGISTRATION_REQUIRED` | CODEX | Normalize to `cursor-handoff/<Task-ID>` |

**Product code at_fault: false** for ENV blockers.

---

## 8. Prohibitions (both)

- Cursor: no merge main, no WorkQueue promotion, no Canonical edits unless envelope allows
- Codex: no expecting Human to summarize Cursor chat
- Either: no silent work (diff without report)

---

## 9. Current open items (snapshot 2026-08-01)

| Item | Owner | Action |
|------|-------|--------|
| PR #69 Life candidates | Codex | Review → merge or FIX |
| PR #42 vs main | Codex | **DEFERRED** — Human: close/archive #42; no R1 until stable baseline |
| RD handoff branch | Codex | Merge `cursor-handoff/KAIOS-RD-PRODUCT-RECONCILE-001` docs |
| WALS-DOCS-001 | Codex | APPROVE or CANCEL explicitly |

---

**Cursor commitment:** 悟空施工必交 triple handoff；如來審核必寫 Review Log — **Human 不用居中傳譯。**
