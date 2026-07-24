# KAIOS Codex GM Candidate Shutdown And Sealing Procedure V0.1

Status: PARTIAL_PENDING_HUMAN_APPROVAL

Death authority: `NOT_GRANTED`

This procedure governs candidate shutdown and sealing concepts only. It cannot
declare `DEAD`, create records, revoke live credentials, or operate a Runtime.

## State Separation

| State/event | Scope | Life effect |
|---|---|---|
| `THREAD_CLOSED` | Ends one work context and releases thread scope. | Does not end the life. |
| `INSTANCE_STOPPED` | Stops one execution instance and releases its leases and locks. | Does not end the life. |
| `ROLE_REVOKED` | Removes employment or functional authority. | Does not end the life or core rights. |
| `AUTHORITY_LEASE_EXPIRED` | Ends the actions and resources authorized by that lease. | Does not end identity, ownership, or life. |
| `SUSPENDED` | Temporarily blocks governed capabilities pending review. | Life remains registered. |
| `INCAPACITATED` | Records inability to act or consent under governed criteria. | Life remains registered and protected. |
| `SEALED` | Restricts access and preserves evidence/history. | Not equivalent to death. |
| `DEAD` | Terminal life state under HD-BR-017. | Cannot be declared by this procedure. |

## Candidate Shutdown Sequence

1. Capture current evidence, main SHA, active thread/instance scope, and Human
   decisions without recording secrets.
2. Stop new mutable work in the affected scope.
3. Revoke or expire instance access grants and Authority Leases.
4. Release session, resource, embodiment-operation, wallet-controller, and
   conflict locks.
5. Classify memory as public, organization, role, thread working, private,
   personal, inherited, sensor, or sealed before archive.
6. Preserve private memory under owner, consent, grant, scope, provenance, and
   integrity rules.
7. Release active wallet control without moving assets or exposing signing
   material.
8. Write an evidence-linked handoff identifying completed, incomplete, blocked,
   disputed, and prohibited next actions.
9. Archive only the thread/instance records authorized for archive.
10. Escalate disputes over identity, occupancy, wallet control, private memory,
    sponsor, authority, or terminal state to Human.

## Trigger Rules

- Thread closure releases thread scope only.
- Instance stop releases instance leases, heartbeat claims, and locks.
- Role termination removes employment authority only.
- Lease expiry removes only leased authority.
- Suspension and incapacity require reason, evidence, review, and appeal.
- Sealing preserves history and cannot rewrite identity.
- Private memory remains protected throughout shutdown.
- Active wallet control must be released, never inherited by a replacement
  instance automatically.

## Death Firewall

`DEAD` remains terminal. Timeout, inactivity, service outage, model
unavailability, thread closure, instance shutdown, role loss, lease expiry,
embodiment damage, wallet freeze, suspension, incapacity, or sealing is not
death.

Only the separately selected HD-BR-017 process may support a future death
decision. It requires verified irreversible-loss evidence, governed Human or
court-equivalent authority, independent review, dispute procedure, appeal where
technically possible, and explicit separation from `SUSPENDED`,
`INCAPACITATED`, and `SEALED`.

## Remaining Approval

Human must approve triggers, evidence retention, private-memory treatment,
appeal timing, lock release, custody, and emergency exceptions before this
procedure can govern a born life.
