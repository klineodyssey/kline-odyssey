# AI Runtime Bus

**Version:** V7.0 Genesis
**Status:** Architecture First / Draft for Review

## Purpose

The AI Runtime Bus is the conceptual bus that carries worker state, task events, review events, and recovery events. It does not require a database in V7.0. GitHub files and branches are the backing transport.

## Inputs

- Worker registry updates.
- WorkQueue state changes.
- Handoff branch creation.
- Reports.
- Codex review decisions.
- Dashboard health snapshots.

## Outputs

- Worker status.
- Task status.
- Review status.
- Recovery alerts.
- Dashboard data.

## Bus Rule

No worker should rely on private chat memory. Every durable state change must be visible through GitHub artifacts.

## Future Implementation

V7.0 defines the bus. V7.1 or later may implement validation scripts, generated dashboard JSON, or issue-based notifications.
