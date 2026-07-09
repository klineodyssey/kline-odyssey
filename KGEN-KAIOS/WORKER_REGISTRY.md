# Worker Registry

**Version:** V7.1 Minimal Worker Layer
**Status:** Active / Draft for Review
**Scope:** Multi-worker identity, permission, workspace, branch, and review routing model.

## Purpose

The Worker Registry lets KAIOS manage Cursor, Codex, Claude, Gemini, OpenHands, GitHub Copilot, ChatGPT, Deep Research, and Human Engineers under one operating model. A new worker should not require a new architecture. It should require a registry entry, a branch namespace, a permission tier, and a report/review path.

## Required Worker Fields

| Field | Required | Meaning |
|---|---|---|
| `worker_id` | Yes | Stable identifier such as `cursor-01` or `human-engineer-01` |
| `worker_type` | Yes | Cursor, Codex, Claude, Gemini, OpenHands, GitHub Copilot, ChatGPT, Deep Research, Human Engineer |
| `role` | Yes | CEO, PM, Reviewer, Worker, Guest, Human Engineer |
| `permission` | Yes | Permission tier and allowed action set |
| `workspace` | Yes | Expected workspace or checkout boundary |
| `current_task` | Yes | Active task ID or `null` |
| `current_branch` | Yes | Active handoff branch or `null` |
| `status` | Yes | IDLE, CLAIMED, IN_PROGRESS, REVIEW, BLOCKED, OFFLINE |
| `heartbeat` | Yes | Last activity marker or `null` |
| `last_report` | Yes | Last report path or `null` |
| `allowed_branch_pattern` | Yes | Branch namespace allowed for that worker |
| `can_push_main` | Yes | Boolean main push permission |
| `reviewer` | Yes | Reviewer identity, normally Codex |

## Supported Worker Types

| Worker Type | Default Role | Default Branch Pattern | Push Main |
|---|---|---|---|
| Codex | CEO / Reviewer | `codex-review/<Task-ID>` | Yes |
| Cursor | Worker | `cursor-handoff/<Task-ID>` | No |
| Claude | Worker | `claude-handoff/<Task-ID>` | No |
| Gemini | Worker | `gemini-handoff/<Task-ID>` | No |
| OpenHands | Worker | `openhands-handoff/<Task-ID>` | No |
| GitHub Copilot | Worker | `copilot-handoff/<Task-ID>` | No |
| ChatGPT | Worker | `chatgpt-handoff/<Task-ID>` | No |
| Deep Research | Research Worker | `deep-research-handoff/<Task-ID>` | No |
| Human Engineer | Human Worker | `human-handoff/<Task-ID>` | No by default |

## Permission Model

| Permission | Allowed Actions |
|---|---|
| `ceo_reviewer` | Dispatch, review, merge, push main, update review log |
| `reviewer` | Review and recommend decisions, no main push by default |
| `worker_docs` | Claim documentation tasks, create reports, push handoff branch |
| `worker_code_limited` | Claim scoped code tasks only with explicit WorkOrder permission |
| `research_readonly` | Read, analyze, report; no repo modifications by default |
| `guest_readonly` | Read-only access |

## Registry Source

The machine-readable registry lives at:

```text
KGEN-KAIOS/worker_registry.json
```

The JSON registry is the active machine-readable source. This Markdown file explains the registry policy.

## Join Rule

A worker can join KAIOS when all conditions are true:

1. Worker has a `worker_id` entry.
2. Worker has an allowed branch pattern.
3. Worker has a permission tier.
4. Worker has a reviewer.
5. Worker agrees to stop after one task and wait for review.
6. Worker does not push main unless `can_push_main` is true.

## Non-Goal

V7.1 does not create live worker accounts. It defines the minimal registry layer needed to add them safely.