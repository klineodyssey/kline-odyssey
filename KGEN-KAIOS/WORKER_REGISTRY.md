# Worker Registry

**Version:** V7.0 Genesis
**Status:** Architecture First / Draft for Review

## Purpose

The Worker Registry lets KAIOS add Cursor, Claude, Gemini, OpenHands, GitHub Copilot, ChatGPT, Deep Research, and Human Engineers without redesigning the operating system.

## Required Worker Fields

| Field | Meaning |
|---|---|
| Worker ID | Stable identifier such as `cursor-01` or `human-engineer-01` |
| Worker Type | Cursor, Claude, Gemini, OpenHands, Copilot, ChatGPT, Deep Research, Human |
| Role | Worker, Reviewer, PM, Guest, Specialist |
| Permission | Allowed actions and protected path limits |
| Workspace | Expected local or remote work environment |
| Current Task | Task ID currently claimed |
| Current Branch | Active handoff branch |
| Current Status | IDLE, CLAIMED, IN_PROGRESS, REVIEW, BLOCKED, OFFLINE |
| Heartbeat | Last visible activity timestamp or report event |
| Last Report | Path to most recent report |

## Join Rule

A new AI does not need a new architecture. It needs a registry entry, worker prompt, branch namespace, report template, and permissions.

## Branch Namespace

Recommended future namespace:

```text
<worker>-handoff/<Task-ID>
```

Examples:

- `cursor-handoff/ORG-P2-003A`
- `claude-handoff/ORG-P2-010`
- `gemini-handoff/ORG-P2-015`
- `openhands-handoff/ORG-P2-018`
- `copilot-handoff/ORG-P2-020`
- `human-handoff/ORG-P2-022`
