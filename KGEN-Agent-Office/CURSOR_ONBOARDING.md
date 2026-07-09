# Cursor Onboarding

## Human Startup Phrase

The user may paste this exact phrase into Cursor Agent:

```text
gi，上班，啟動西遊記，專案開始。
```

## Cursor Required Startup Flow

When Cursor receives the startup phrase, Cursor must:

1. Run `git pull origin main`.
2. Read `KGEN-Agent-Office/CURSOR_AGENT_PROMPT.md`.
3. Read `KGEN-Agent-Office/CURSOR_WORK_QUEUE.md`.
4. Read `KGEN-Agent-Office/DO_NOT_TOUCH.md`.
5. Read `KGEN-Canon/KGEN_CANON_MASTER.json`.
6. Start the first task in `CURSOR_WORK_QUEUE.md` whose status is `OPEN`.
7. Write a Cursor report for every completed task.
8. Avoid modifying forbidden areas.
9. Never contradict or rewrite Canon.
10. Wait for Codex review after finishing.

## First Work Rule

Cursor must not begin by editing files. Cursor must first read the assigned WorkQueue item, identify allowed files, identify forbidden files, and state the intended modification purpose.

