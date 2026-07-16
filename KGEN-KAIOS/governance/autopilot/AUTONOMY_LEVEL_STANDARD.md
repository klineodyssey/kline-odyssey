---
TITLE: "Company Autonomy Level Standard"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_REVISION_P0"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / KAIOS Company General Manager"
REVIEWED_BY: "Independent review required"
RESOLUTION_ID: "AGB-COMPANY-AUTONOMOUS-RUNTIME-001"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
ANCESTOR: "DELEGATED_AUTONOMY_STANDARD.md"
SOURCE_OF_TRUTH: "FALSE_PENDING_INDEPENDENT_REVIEW"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/AUTONOMY_LEVEL_STANDARD.md"
---

# Autonomy Level Standard

## 1. Level Ladder

| Level | Authority | Typical actions |
|---:|---|---|
| 0 | Observe only | Read health and state |
| 1 | Review and report | Validate, classify, recommend and record |
| 2 | Dispatch approved tasks | Allocate already approved non-architecture tasks through canonical authority |
| 3 | Commit approved sandbox work | Commit reviewed sandbox output |
| 4 | Push reviewed non-protected changes | Push reviewed and rollbackable non-protected work |
| 5 | Production-sensitive actions | Mainnet, protected Runtime, funds, identity or irreversible production actions |

## 2. Current Limit

Company Autonomous Runtime V1 is capped at `LEVEL_2`. This is an architecture ceiling, not proof that Auto Dispatch is implemented. Canonical Claim Authority must exist before any Level 2 dispatch.

Level 3 and Level 4 require a new explicit Human approval after independent review. Level 5 is Human only.

## 3. Authority Grant

```text
autonomy_grant_id
human_authority_id
actor_id
level
decision_scope
allowed_actions
forbidden_actions
allowed_paths
expires_at
revocation_ref
human_anchor_ref
issued_at
```

Grants are scoped, expiring and revocable. The effective level is the lowest of actor, task, environment, data classification and current Human grant.

## 4. Non-escalation

Codex, Dispatcher, Cursor Master and Clones cannot increase their own level. A child never inherits a higher level than its parent envelope. Retry, recovery, urgency, successful tests or Human silence do not increase authority.

## 5. Action Gate

Before every autonomous action:

1. run `HUMAN_ANCHOR_CHECK`;
2. resolve current autonomy grant;
3. verify action, scope, path and expiry;
4. verify Claim and Session custody;
5. verify protected and privacy boundaries;
6. record evidence and rollback;
7. execute only if the required level is not above the effective level.

## 6. Downgrade and Emergency Stop

Human revocation, expired grant, identity mismatch, architecture drift, secret exposure, key compromise or unresolved P0 risk immediately reduces authority to Level 0 or `SAFE_HOLD`. Downgrade never waits for a Worker heartbeat.

## 7. Level 2 Dispatch Rules

Level 2 may dispatch only when:

- WorkQueue state is explicitly implementation-approved;
- Architecture-only is false;
- Canonical Claim Authority allocates atomically;
- Review, Repair, Recovery and pending Human Decision gates are clear or durably held;
- Clone identity, quota, workspace and security pass;
- rollback and review owner exist.

Current result: `AUTO_DISPATCH_DISABLED` because Canonical Claim Authority is not implemented.

## 8. Audit

Every grant, check, denial, downgrade, escalation request and revocation is append-only. Dashboard labels cannot change effective authority.

## 9. Architecture Boundary

```text
Maximum autonomous level: LEVEL_2
Level 2 runtime enabled: false
Level 3/4: NEW_HUMAN_APPROVAL_REQUIRED
Level 5: HUMAN_ONLY
Self elevation: FORBIDDEN
```
