# Message Bus

**Version:** V7.0 Genesis
**Status:** Architecture First / Draft for Review

## Purpose

The Message Bus lets AI workers communicate without private memory or direct chat dependency.

## Transport

KAIOS uses GitHub artifacts as the message bus:

- WorkQueue rows.
- Handoff branches.
- Reports.
- Review logs.
- Dashboard snapshots.
- Recovery notes.
- Decision files.

## Message Types

| Message | Producer | Consumer |
|---|---|---|
| Task Opened | Codex / PM | Worker |
| Task Claimed | Worker | Codex / Dashboard |
| Report Submitted | Worker | Codex |
| Review Approved | Codex | Worker / Dashboard |
| Review Rejected | Codex | Worker |
| Recovery Required | Codex / Worker | Codex / Human |
| Dashboard Updated | Codex / Automation | Human / Workers |

## Rule

If it is not in GitHub state, it is not durable KAIOS state.
