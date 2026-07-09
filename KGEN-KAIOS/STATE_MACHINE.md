# State Machine

**Version:** V7.0 Genesis
**Status:** Architecture First / Draft for Review

## Task State Machine

```text
OPEN
-> CLAIMED
-> IN_PROGRESS
-> REVIEW
-> APPROVED
-> MERGED
-> DONE
```

Failure path:

```text
REVIEW
-> REJECTED
-> FIX
-> REVIEW
```

Blocked path:

```text
CLAIMED / IN_PROGRESS / REVIEW
-> BLOCKED
-> OPEN / FIX / DONE
```

## Worker State Machine

```text
IDLE
-> CLAIMED
-> WORKING
-> REPORTING
-> WAITING_REVIEW
-> IDLE
```

Failure path:

```text
WORKING
-> OFFLINE
-> RECOVERY
-> IDLE / BLOCKED
```

## Review State Machine

```text
PENDING
-> REVIEWING
-> APPROVED / REJECTED / BLOCKED
-> MERGED / FIX / RECOVERY
```
