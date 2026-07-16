---
TITLE: "Queue Health and Automatic Proposal Standard"
VERSION: "0.1.0"
STATUS: "ARCHITECTURE_PROPOSAL"
---

# Queue Health and Automatic Proposal Standard

## Queue Health Is Not Queue Occupancy

A healthy company does not require fake work. Each queue has one state:

- `ACTIVE`: valid items are awaiting lawful processing.
- `EMPTY_HEALTHY`: no valid item exists and a fresh bounded scan receipt exists.
- `BLOCKED`: a named dependency or Human decision prevents progress.
- `STALE`: the queue or its scan evidence exceeded freshness policy.
- `ERROR`: integrity, schema, or authority validation failed.

Review and Repair queues should become empty after completion. Forcing them to
remain non-empty would manufacture defects and violate Evidence First.

## Priority Order

```text
URGENT_STOP
-> REVIEW
-> REPAIR
-> EXPIRED_OR_ORPHANED_CLAIM_RECOVERY
-> HUMAN_DECISION
-> APPROVED_IMPLEMENTATION
-> ARCHITECTURE
-> PROPOSAL_CANDIDATE
```

## Bounded Scout Domains

When actionable queues are `EMPTY_HEALTHY`, read-only scouts may inspect:

- UI
- Pages
- Performance
- Security
- Accessibility
- Documentation
- Architecture Drift
- Broken Links
- Legacy Rules

A scout creates only `OBSERVATION` or `PROPOSAL_CANDIDATE`. It cannot create an
Implementation WorkOrder, Claim, release, deployment, or CURRENT change.

## Proposal Admission

Every candidate requires:

```text
candidate_id
scanner_domain
fingerprint
observed_at
evidence
severity
affected_paths
duplicate_of
cooldown_until
suggested_owner_role
risk_class
human_decision_required
status
```

Candidates are deduplicated by stable fingerprint. Per-domain rate limits,
cooldowns, daily caps, maximum queue depth, and expiry prevent self-generated
backlog growth. A candidate with no reproducible evidence is rejected.

## Automatic Issue Boundary

An Architecture Proposal may be generated only after source audit and duplicate
checking. An implementation issue requires separate implementation authority.
The system may not keep Cursor workers busy with unauthorized inspections or
invented maintenance.

## Queue Health Report

The report distinguishes:

- count by queue and state
- oldest valid item age
- blocked reason and owner
- last scan time and receipt hash
- duplicate suppression count
- dispatchable implementation count
- review and repair debt
- integrity and freshness result

An empty queue with a valid scan receipt scores healthy. A full queue with stale,
duplicate, or unauthorized items scores unhealthy.

## Current Assessment

The formal Review, Handoff, and Pending Push queues were clear at proposal audit
time. No runtime telemetry exists for utilization or average idle time. This
package therefore records queue state as `OBSERVED_CLEAR` and operational metrics
as `NOT_MEASURED`, not as zero.
