# KGEN AI Company V6 Readiness Report

**Status:** Readiness Review / Draft for Review
**Review Date:** 2026-07-10
**Reviewed Main SHA:** `54b5e3aa41f529bed0b872b90a6701e926f05ec1`
**Reviewer:** Codex / KGEN AI Company General Manager
**Scope:** Workspace Policy, Cursor Boot, WorkQueue, Review Workflow, Handoff Branch, Reports, Multi-AI onboarding, Human prompt dependency.

## Executive Decision

KGEN AI Company is ready for a controlled V6.0 pilot of the standard Human -> Codex -> Cursor workflow, but it is not yet ready for full multi-AI production.

**Readiness Score:** 74 / 100
**Current AI Company Level:** V6.0 Readiness Pilot
**Can enter Human -> Codex -> Cursor standardized flow:** YES, with Codex supervision
**Can add Claude / Gemini / OpenHands / Copilot only by creating workers, without additional policy work:** NO

The core operating loop now exists: Human Main is protected, Cursor submits `cursor-handoff/<Task-ID>`, and Codex reviews from a clean review workspace before merging to `origin/main`. The remaining gaps are not architectural rewrites; they are worker standardization, stale branch recovery, queue reconciliation, and prompt cleanup.

## A. Workspace Policy Readiness

**Score:** 86 / 100
**Verdict:** Sufficient for minimum governance.

The new workspace policy clearly separates:

- Human Main Workspace: `C:\Desktop\kline-odyssey`
- Cursor Worker Workspace: worker checkout/worktree
- Codex Review Workspace: `C:\Desktop\kline-odyssey-codex-review`

It also states that Human Main must not be modified, stashed, reset, pushed, or cleaned automatically by AI agents. This directly solves the Human dirty-tree problem.

**Remaining gaps:**

- The suggested Codex Review Workspace path is documented but not enforced by tooling.
- The current Codex review worktree can be clean while not using the exact suggested path.
- No pre-review script exists to assert clean tree, current main, handoff branch visibility, and protected path checks.

## B. Cursor Boot Readiness

**Score:** 68 / 100
**Verdict:** Usable but inconsistent.

Cursor can understand the main loop through `CURSOR_AUTO_WORK_PROTOCOL.md`, `CURSOR_HANDOFF_BRANCH_WORKFLOW.md`, and `WORKQUEUE_EXECUTION_RULES.md`.

**Strengths:**

- Cursor is told to read GitHub files, not chat memory.
- Cursor is told to execute the first OPEN WorkOrder only.
- Cursor is told to push `cursor-handoff/<Task-ID>` and not push `main`.

**Bottlenecks:**

- `CURSOR_EMPLOYEE_BOOT.md` still contains legacy V4 language and `$shortPhrase`.
- Some docs still describe older local commit behavior or older first-day startup language.
- Cursor Boot is Cursor-specific, not generic for other AI workers.

## C. WorkQueue Readiness

**Score:** 76 / 100
**Verdict:** Sufficient for Cursor pilot; not yet sufficient for multi-AI scheduling.

The WorkQueue has status rules, owner/reviewer fields, priorities, departments, protected paths, report paths, and acceptance criteria.

Current status snapshot from main:

| Status | Count |
|---|---:|
| REVIEW | 2 |
| DONE | 1 |
| OPEN | 28 |

Current next OPEN task:

```text
ORG-P2-003A
```

**Bottlenecks:**

- WorkQueue is still named and phrased as Cursor execution, not generic worker execution.
- No branch field is stored per task.
- No reported commit SHA field is stored per task.
- No lock/lease mechanism prevents multiple agents from picking the same OPEN task.
- ORG-P2-001 and ORG-P2-002 remain REVIEW and need separate Codex review.

## D. Review Workflow Readiness

**Score:** 80 / 100
**Verdict:** Strong enough for controlled use.

Codex review rules require diff checks, report checks, protected path checks, Canon alignment, and review log updates. Workspace recovery covers dirty trees, missing branches, invisible commits, conflicts, wrong pushes, incomplete handoffs, and missing reports.

**Bottlenecks:**

- Review protocol does not yet require a formal stale-branch check before merge.
- Review protocol does not yet require recording base commit and head commit in the WorkQueue itself.
- There is no automated pre-merge checklist artifact.

## E. Handoff Branch Readiness

**Score:** 72 / 100
**Verdict:** Correct model, but needs stale branch governance.

The handoff branch pattern solves the earlier problem where Cursor local commits were invisible to Codex:

```text
cursor-handoff/<Task-ID>
```

**Important current finding:** remote handoff branches `origin/cursor-handoff/ORG-P2-004` and `origin/cursor-handoff/ORG-P2-005` exist, but they are based on an older main before Workspace Policy was added. Their diffs currently show deletion of:

- `KGEN-AI-Company/WORKSPACE_POLICY.md`
- `KGEN-AI-Company/WORKTREE_SETUP.md`
- `KGEN-AI-Company/WORKTREE_RECOVERY.md`

This should not be merged as-is. Codex review would catch this through diff and protected/workspace policy checks, but V6.1 should explicitly define stale handoff branch recovery.

## F. Report Readiness

**Score:** 76 / 100
**Verdict:** Sufficient for review; needs stronger metadata.

Reports are centralized under:

```text
KGEN-AI-Company/reports/
```

Required fields include task ID, date, base commit, status, files read, files modified, checks, risks, blockers, recommendation, and human/Codex review needs.

**Bottlenecks:**

- Report rules do not require branch name as a field.
- Report rules do not require pushed commit SHA as a field.
- Report rules do not require base branch freshness result.
- There is no generic report template for non-Cursor workers.

## G. Multi-AI Readiness

**Score:** 45 / 100
**Verdict:** Not production-ready for multiple AI workers yet.

The core pattern can support more workers, but current files are Cursor-specific. Claude, Gemini, OpenHands, Copilot, and new Human engineers can join only after a generic worker layer is defined.

**Needed before multi-AI production:**

- Worker registry.
- Worker role files.
- Generic branch namespace such as `<worker>-handoff/<Task-ID>`.
- Per-worker protected path rules.
- Per-worker report template.
- Claim/lock rules for OPEN WorkOrders.
- Conflict policy when two workers touch the same task or file family.

## H. Human Prompt Dependency

**Score:** 60 / 100
**Verdict:** Reduced but not eliminated.

The human no longer needs to manage worktrees, branches, merges, or recovery. That is a major improvement.

However, the current loop still expects the human to:

1. Paste `gi，上班` in Cursor.
2. Paste Cursor output to Codex.
3. Paste Codex result back to Cursor when needed.

This is standardized, but not fully automatic. The system still depends on human copy/paste between tools.

## Current Bottlenecks

| Priority | Bottleneck | Impact |
|---|---|---|
| P0 | Stale handoff branches can be based on old main and appear to delete new policy files | Blocks safe merge until rebase/reissue rules are formalized |
| P0 | Cursor Boot has legacy V4 / `$shortPhrase` residue | Can confuse worker startup behavior |
| P0 | WorkQueue does not store branch / commit SHA / base commit per task | Codex must infer handoff metadata from chat and Git refs |
| P1 | Multi-AI worker model is not formalized | Claude, Gemini, OpenHands, Copilot cannot join without custom instructions |
| P1 | No WorkOrder lock/claim lease | Multiple agents could pick the same OPEN task |
| P1 | Report template lacks branch and commit SHA | Weakens audit trail |
| P2 | Codex Review Workspace path is policy-only, not enforced | Human must trust agent discipline |
| P2 | Manual copy/paste remains between Cursor and Codex | Standardized but not automated |

## V6.1 Improvement Plan

V6.1 should not redesign the company. It should harden the current model.

| Priority | Improvement | New / Updated Document | Expected Impact |
|---|---|---|---|
| P0 | Clean up Cursor Boot and remove old V4 / `$shortPhrase` language | Update `CURSOR_EMPLOYEE_BOOT.md`, `CURSOR_AUTO_WORK_PROTOCOL.md`, `CURSOR_ONE_COMMAND_START.md` | Prevents startup ambiguity |
| P0 | Add stale handoff branch policy | New `KGEN-AI-Company/HANDOFF_BRANCH_REBASE_POLICY.md` | Prevents merging old branches that delete newer policy files |
| P0 | Add branch / commit / base fields to WorkQueue | Update `KGEN-Organization/WorkOrders/WORK_QUEUE.md` format | Makes review auditable without chat memory |
| P1 | Add generic worker registry | New `KGEN-AI-Company/WORKER_REGISTRY.md` | Allows Claude, Gemini, OpenHands, Copilot, and Human engineers to join under one model |
| P1 | Add generic worker protocol | New `KGEN-AI-Company/GENERIC_WORKER_PROTOCOL.md` | Converts Cursor-only rules into reusable worker rules |
| P1 | Add WorkOrder claim/lease rule | New `KGEN-AI-Company/WORKORDER_CLAIM_POLICY.md` | Prevents multiple agents from taking the same OPEN task |
| P1 | Strengthen report template | Update `CURSOR_REPORTING_RULES.md` and add branch/commit/base/freshness fields | Improves review evidence |
| P2 | Add Codex pre-merge checklist | New `KGEN-AI-Company/CODEX_PRE_MERGE_CHECKLIST.md` | Makes review repeatable and less dependent on memory |
| P2 | Add optional automation bridge design | New `KGEN-AI-Company/AUTOMATION_BRIDGE_PLAN.md` | Reduces human copy/paste later |

## Can We Enter Human -> Codex -> Cursor Standardized Flow?

**YES, as a controlled V6.0 pilot.**

The required path is now clear:

```text
Human
-> Codex General Manager
-> WorkQueue
-> Cursor Worker
-> cursor-handoff/<Task-ID>
-> Codex Review Workspace
-> origin/main
```

This is safe enough for ORG-P2-003A and similar documentation/governance WorkOrders, provided Codex reviews every handoff branch and rejects stale branches that would remove newer policy files.

## Can New AI Workers Join Tomorrow Without Redesign?

**NO.**

They do not require a full redesign of the company, but they do require a V6.1 worker layer. Current rules are too Cursor-specific. To add Claude, Gemini, OpenHands, Copilot, and new Human engineers cleanly, KGEN needs worker registry, branch namespace, claim rules, and generic report requirements.

Recommended future branch namespace:

```text
<worker>-handoff/<Task-ID>
```

Examples:

```text
cursor-handoff/ORG-P2-003A
claude-handoff/ORG-P2-010
gemini-handoff/ORG-P2-015
openhands-handoff/ORG-P2-018
copilot-handoff/ORG-P2-020
human-handoff/ORG-P2-022
```

## Final Readiness Rating

| Area | Score |
|---|---:|
| Workspace Policy | 86 |
| Cursor Boot | 68 |
| WorkQueue | 76 |
| Review Workflow | 80 |
| Handoff Branch | 72 |
| Reports | 76 |
| Multi-AI | 45 |
| Human Prompt Reduction | 60 |

**Overall Readiness Score:** 74 / 100
**AI Company Level:** V6.0 Readiness Pilot
**Next recommended step:** complete V6.1 improvement plan before scaling to multiple AI workers. ORG-P2-003A can proceed under Codex supervision after stale handoff branch handling is respected.
