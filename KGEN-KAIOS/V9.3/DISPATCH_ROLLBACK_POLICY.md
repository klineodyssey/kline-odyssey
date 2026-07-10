# Dispatch Rollback Policy

**Document ID:** KAIOS-V9.3-DISPATCH-ROLLBACK  
**Version:** V9.3  
**Status:** Draft for Review

Rollback restores a released task to hold when the release is discovered to be unsafe.

## Rollback Triggers

- Wrong Worker.
- Dependency becomes invalid.
- Risk level increases.
- Protected Path conflict appears.
- Human Pause is received.
- Branch Pattern is wrong.
- Report Path is wrong.

## If Not Yet Claimed

Codex may apply:

```text
OPEN + RELEASED -> OPEN + HOLD
```

The release history is preserved. No audit row is deleted.

## If Already Claimed

Codex must:

1. Move task to `BLOCKED`.
2. Notify Worker to stop.
3. Preserve existing branch and report.
4. Do not delete historical evidence.
5. Create a follow-up review or fix task.

