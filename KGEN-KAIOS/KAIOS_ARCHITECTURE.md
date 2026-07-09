# KAIOS Architecture

**Version:** V7.0 Genesis
**Status:** Architecture First / Draft for Review

## Mission

KAIOS turns KGEN AI Company into an operating system for work. The goal is to make every AI worker disposable, recoverable, auditable, and replaceable while preserving Canon, protected paths, and human authority.

## System Layers

| Layer | Responsibility |
|---|---|
| Human Control Layer | Defines goals, approves sensitive exceptions, receives Codex reports |
| Codex Management Layer | Dispatches, reviews, merges, pushes, updates state |
| Worker Execution Layer | Cursor, Claude, Gemini, OpenHands, Copilot, ChatGPT, Deep Research, Human Engineer |
| Runtime Bus Layer | Normalizes worker state, task claims, reports, reviews, and events |
| Message Bus Layer | Uses GitHub branches, WorkQueue, reports, review logs, and dashboard state |
| Security Layer | Defines permission tiers and protected path limits |
| Recovery Layer | Handles missing branches, stale branches, dead workers, conflicts, and incomplete reports |

## Core Operating Loop

```text
Human goal
-> Codex planning
-> Task Dispatcher
-> Worker Registry
-> Worker claim
-> Worker handoff branch
-> Report
-> Codex Review Pipeline
-> Merge / reject / fix
-> Dashboard update
```

## Worker Join Model

Any worker can join if it can:

1. Read the Worker Registry.
2. Claim a task through the Task Claim Protocol.
3. Work in an isolated workspace.
4. Push a handoff branch.
5. Produce a report.
6. Stop for review.
7. Obey protected path and Canon rules.

## Non-Goals

V7.0 does not implement automation code, worker bots, CI services, queues, databases, or real-time dashboards. It defines the architecture those can later implement.
