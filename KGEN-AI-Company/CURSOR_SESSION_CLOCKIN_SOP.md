# Cursor Session Clock-In SOP (方案 2)

**Status:** ACTIVE — Human-approved standing procedure  
**Human decision:** `HUMAN-AUTO-CLOCKIN-001` (2026-08-02)  
**Worker:** `cursor-01`  
**Reviewer:** `codex-gm-01`

## Purpose

Every Cursor session (chat or Cloud Agent) must run **company work before Human chat tasks**, unless Human explicitly says 「只聊天、不要接案」.

Two triggers share this SOP:

| Trigger | When |
|---------|------|
| **A. Dialogue session** | Human opens Cursor chat / Cloud Agent and sends any message |
| **B. Dispatch webhook** | Cursor Automation fires on Codex merge of a dispatch/release PR |

---

## Execution order (mandatory)

```text
① Light Boot + Preflight
② Company patrol → claim → work → handoff (if eligible task exists)
③ Human message / webhook payload task
```

Codex-aligned rule (from `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`): finish existing authorized work, then handle the new Human task.

---

## ① Light Boot (do not full-read WORK_QUEUE every time)

1. `git fetch origin main` (Cloud Agent: already on repo; still verify freshness).
2. Read **in order**:
   - `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` — Cursor role + boot order only (skim index sections).
   - `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md`
   - `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md`
   - `KGEN-KAIOS/worker_registry.json` — validate `cursor-01` (`ACTIVE`, `T2+`, `can_push_main: false`).
   - `KAIOS/life/forest-agriculture/KAIOS_CURSOR_CONTINUOUS_WORK_QUEUE.json`
   - `KGEN-Organization/WorkOrders/WORK_QUEUE.md` — **grep** for `Status: OPEN` + `CLAIMABLE` only; do not load full file into context unless a row matches.
3. Emit **`CURSOR PREFLIGHT`** (short): worker ok?, main SHA, queue signals, stop_code if blocked.

If registry invalid → output `REGISTRATION_REQUIRED` and **stop** (no file edits).

---

## ② Company patrol

Check **both** sources:

| Source | Claim when |
|--------|------------|
| Continuous queue | Item status is `DISPATCHED` or `READY_FOR_ATOMIC_CLAIM` |
| Formal WorkQueue | Row is `OPEN` + dispatch approved + `CLAIMABLE` |

Before claim:

- Task envelope `*.task_envelope.json` must exist on `origin/main`.
- Branch pattern: `cursor-handoff/<Task-ID>` only.
- `ONE_TASK_AT_A_TIME` — never claim `QUEUED` items.
- Do **not** self-promote WorkQueue to OPEN.

If eligible task found:

1. Preflight PASS → claim per envelope → branch from latest `origin/main`.
2. Execute scoped work only.
3. Triple handoff: report + `HANDOFF.md` + `handoff.json`.
4. Push handoff branch; append `KGEN-AI-Company/reports/CURSOR_RD_HANDOFF_JOURNAL.md` if material.
5. **Stop** merge authority; wait for Codex review.

If **no** eligible task:

- Append idle line to `CURSOR_RD_HANDOFF_JOURNAL.md` (optional, docs-only on handoff branch).
- Proceed to step ③ without opening a code PR.

---

## ③ Human / webhook task

Only after ①② complete (or explicit Human override 「只聊天」).

---

## Repo-native wiring (installed)

| Layer | Path | Status |
|-------|------|--------|
| Cursor rule (every chat) | `.cursor/rules/kgen-session-clockin.mdc` | **ACTIVE** on clone |
| Cloud VM deps | `.cursor/environment.json` | install script |
| GHA dispatch wake | `.github/workflows/kgen-cursor-dispatch-wake.yml` | needs `CURSOR_API_KEY` secret |
| Prompt payload | `KGEN-AI-Company/automation/cursor-dispatch-wake-prompt.txt` | shared |
| Setup doc | `KGEN-AI-Company/automation/README.md` | Human one secret |

### One secret to finish webhook path

GitHub **Settings → Secrets → Actions → `CURSOR_API_KEY`** from [Cursor Dashboard → API Keys](https://cursor.com/dashboard/api).

Until set, GHA logs `::notice::` only; **`.cursor/rules` still enforces boot order in every chat.**

Optional duplicate: Cursor Automations UI (same prompt) — use GHA **or** UI, not both.

---

## Cursor Automation setup (方案 2 — webhook / GitHub trigger)

Configure at [cursor.com/automations](https://cursor.com/automations).

### Automation: `KGEN-Cursor-Dispatch-Wake`

| Field | Value |
|-------|--------|
| **Repository** | `klineodyssey/kline-odyssey` |
| **Branch** | `main` |
| **Environment** | Team Cloud Environment (same as other Cloud Agents) |
| **Model** | Composer 2 Fast (patrol + bounded tasks) |
| **Trigger (primary)** | GitHub → **Pull request merged** to `main` |
| **Path filter (optional)** | `KAIOS/life/forest-agriculture/**`, `KGEN-KAIOS/worker_registry.json`, `KGEN-KAIOS/governance/cursor/**` |
| **Head branch filter (optional)** | `codex/*` |

Do **not** add hourly cron on the same automation (avoid duplicate runs while an agent is active).

### Automation prompt (paste into Cursor Automations UI)

```text
KGEN CURSOR DISPATCH WAKE — follow KGEN-AI-Company/CURSOR_SESSION_CLOCKIN_SOP.md

You are cursor-01. This run was triggered by a Codex dispatch/release merge.

1. Execute §① Light Boot and §② Company patrol exactly.
2. If continuous queue shows DISPATCHED or READY_FOR_ATOMIC_CLAIM for cursor-01 AND task envelope exists on origin/main:
   - Claim ONE task only, implement, triple handoff, push cursor-handoff/<Task-ID>, stop.
3. If no eligible task: reply "QUEUE_EMPTY_AFTER_DISPATCH" with preflight summary; do NOT open PR or edit code.
4. Do not touch protected paths, main, wallet, KGEN contracts, or WORK_QUEUE authority fields.
5. Max one task per run.
```

### Optional: custom webhook (advanced)

If using Automation **Webhook** trigger instead of native GitHub:

1. Copy webhook URL from the automation settings.
2. Store as GitHub secret `CURSOR_DISPATCH_WEBHOOK_URL` (Human-only).
3. Codex may later add a workflow to POST on merge — **PROPOSED** `KAIOS-CURSOR-DISPATCH-WEBHOOK-GHA-001` (not active until secret + Codex OPEN).

---

## Cost guidance (方案 2)

| Component | Billing |
|-----------|---------|
| Dialogue clock-in (① light boot) | Tokens in the **same chat session** (~$0.02–0.08 per start if API-priced) |
| Webhook wake (one run per Codex dispatch merge) | **One Cloud Agent run** per merge (~$0.03–0.15 idle patrol; +$0.5–5+ if full task) |
| Idle VM | Not billed between runs |

Estimated monthly (moderate dispatch cadence ~2–4 merges/day): **~$5–20** patrol + task tokens, on top of normal chat usage. Set Cloud Agent spend limit in Cursor dashboard.

---

## Human overrides

| Phrase | Effect |
|--------|--------|
| `gi，上班，啟動西遊記，專案開始` | Full Dispatcher Mode (`CURSOR_AUTO_WORK_PROTOCOL.md`) |
| `只聊天，不要接案` | Skip ② claim; still run minimal registry check |
| (default) | Full ①②③ per this SOP |

---

## Related files

- `AGENTS.md` — Cloud agent summary pointer
- `KGEN-AI-Company/CURSOR_CODEX_COORDINATION_PROTOCOL_V1.md`
- `KGEN-AI-Company/reports/CURSOR_RD_HANDOFF_JOURNAL.md`
- `KGEN-Agent-Office/AUTOMATION_SCHEDULE.md`
