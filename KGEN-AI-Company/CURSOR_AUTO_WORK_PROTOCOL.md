# Cursor Auto Work Protocol

## Core Rule

Cursor works from GitHub files, not chat memory. The live task source is `KGEN-Organization/WorkOrders/WORK_QUEUE.md`.

This protocol is subordinate to `docs/KAIOS_HUMAN_OWNER_MERGE_POLICY.md` and `AGENTS.md`. Historical reviewer ceremony must not keep ordinary completed repository work on HOLD after current Human-owner approval and required technical validation.

## Workforce Gate

Before scanning for OPEN tasks, Cursor must validate `cursor-01` in `KGEN-KAIOS/worker_registry.json`.

Cursor may continue only if:

- `employee_status` is `ACTIVE`, `TRUSTED`, or `SENIOR_TRUSTED`
- `trust_level` is `T2` or higher
- `can_push_main` is `false`
- `allowed_branch_pattern` is `cursor-handoff/<Task-ID>`
- Boot, Canon, Workspace Policy, and DO_NOT_TOUCH acknowledgments are true
- no suspension or active blocking violation exists

If validation fails, Cursor outputs `REGISTRATION_REQUIRED` and stops.

## V6 Handoff Branch Loop

When the user enters `gi，上班`, Cursor enters Dispatcher Mode and must not ask what to do today.

1. Pull latest `origin/main`.
2. Read `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md`.
3. Read this file.
4. Read `KGEN-AI-Company/CURSOR_HANDOFF_BRANCH_WORKFLOW.md`.
5. Read `KGEN-Organization/WorkOrders/WORK_QUEUE.md`.
6. Scan from top to bottom and accept the first eligible OPEN/CLAIMABLE WorkOrder or dispatched continuous-queue task.
7. Create or reuse branch `cursor-handoff/<Task-ID>` from latest `origin/main`.
8. Change that task status to `IN_PROGRESS` only through the authorized task/claim mechanism.
9. Execute only that task.
10. For UI/frontend/game work, run real-browser QA, capture screenshot(s), inspect them, repair defects, and repeat browser + screenshot + inspection until no known functional/visual defect remains.
11. Run required tests/CI and record exact-head evidence.
12. Write the report under `KGEN-AI-Company/reports/` and complete the handoff artifacts.
13. Change the task status to `REVIEW` or the current repository-defined handoff state.
14. Commit locally and push `origin cursor-handoff/<Task-ID>`.
15. Report Task ID, Branch, Commit SHA, Report Path, `FUNCTIONAL_QA`, and `VISUAL_QA` when applicable.
16. Notify/hand off to `codex-gm-01` through repository-visible handoff evidence. Do not require the Human owner to copy messages between pages when a repo-native handoff is possible.

## Completion / Merge Rule

Cursor itself still does not push `main` and does not force-push.

For ordinary repository work, however, the handoff is not required to wait for a ceremonial second reviewer. `codex-gm-01` or another authorized repository maintainer may merge after:

- current Human-owner standing/explicit merge authority applies;
- fresh required tests are green;
- UI work has passed the screenshot inspection loop;
- no unresolved P0 correctness/security issue exists;
- the branch is reconciled to latest main without regressing newer accepted behavior.

If GitHub technically requires a reviewer, request the required valid GitHub reviewer automatically. If GitHub does not require one, do not invent a reviewer gate.

## Protected Live Actions

Repository merge is separate from live execution. Mainnet/Testnet deployment or upgrade, real token/BNB/treasury/payroll/payment/liquidity movement, signer/private-key/secret use, governance/admin execution, KYC/account ownership submission, and real-funds oracle activation require action-specific Human authorization and the applicable technical checks.

## Payroll Closeout

After work completion, the company closeout should record/ask through the GM/accounting lane:

- salary due for this worker/life;
- salary period and whether the company uses advance-pay/prepay policy;
- whether salary was actually paid and received;
- whether any approved ATM/UFO salary advance exists and must be netted against the relevant payroll period.

Do not fabricate payment. A salary or advance is `PAID/RECEIVED` only with the required real funding, beneficiary, signer/authority and receipt evidence.

## No Direction Creation

Cursor may recommend next work in a report, but cannot create protected Canon, live financial authority, signer authority, or Mainnet execution authority on its own. Ordinary repository follow-up work may be proposed to the GM for automatic dispatch under the current Human-owner policy.
