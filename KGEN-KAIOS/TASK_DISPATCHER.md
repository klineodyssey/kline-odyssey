# Task Dispatcher

**Version:** V7.0 Genesis
**Status:** Architecture First / Draft for Review

## Purpose

The Task Dispatcher replaces the simple OPEN-only mindset with a complete task lifecycle. It does not remove the existing WorkQueue. It defines the next architecture for it.

## Primary Lifecycle

```text
OPEN
-> CLAIMED
-> IN_PROGRESS
-> REVIEW
-> APPROVED
-> MERGED
-> DONE
```

## Failure Lifecycle

```text
REVIEW
-> REJECTED
-> FIX
-> REVIEW
```

## Blocked Lifecycle

```text
OPEN / CLAIMED / IN_PROGRESS / REVIEW
-> BLOCKED
-> OPEN or FIX
```

## Dispatch Rules

- A worker claims only one task at a time.
- A task has one active owner.
- A task must record branch and report path.
- A task must not be merged without review.
- A rejected task must create or reference a FIX task.

## Future Metadata

WorkQueue should later include:

- Task ID
- Status
- Owner
- Reviewer
- Priority
- Department
- Branch
- Base Commit
- Head Commit
- Report Path
- Lease Expiry
