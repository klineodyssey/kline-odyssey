---
title: KAIOS Software Organ Transplant Standard
life_id: LIFE-KAIOS-SOFTWARE-ORGAN-TRANSPLANT-STANDARD
species_id: SPECIES-KAIOS-SOFTWARE-STANDARD
genome_id: GENOME-KAIOS-SOFTWARE-ORGAN-TRANSPLANT-STANDARD
genome_version: 1.0.0
generation: 1
canonical_filename: KAIOS_SOFTWARE_ORGAN_TRANSPLANT_STANDARD.md
lifecycle_state: ACTIVE
standard_id: KAIOS-SOFTWARE-ORGAN-TRANSPLANT-STANDARD
standard_version: 1.0.0
runtime_revision: 2026.08.02
status: REVIEWED_STANDARD
authority: SIMULATION_ONLY
production_authorized: false
task_id: KAIOS-SOFTWARE-LIFE-CANONICALIZATION-24H-001
---

# KAIOS Software Organ Transplant Standard

## 1. Boundary

Software organ transplantation is a controlled simulation that integrates a
reviewed donor organ contract into a compatible host. It is not file copying,
real property transfer, automatic deployment or Production activation.

The organ identity, donor provenance and host event history remain distinct.
A transplant may create a host Genome revision, but it does not silently
change the donor Life ID, host Life ID or organ ownership.

## 2. Required Participants

Every proposal identifies:

- donor Life and Genome;
- donor Organ and current custodian;
- host Life and Genome;
- rights holder or simulated license authority;
- proposer;
- Codex reviewer;
- migration and rollback owners.

No participant role implies another. Host ownership does not grant donor
source, mutation, reproduction, transplant or resale rights.

## 3. Mandatory Gates

All gates fail closed and must record evidence:

```text
DONOR_IDENTITY_VALID
HOST_IDENTITY_VALID
ORGAN_TYPE_COMPATIBLE
GENOME_CONTRACT_COMPATIBLE
INTERFACE_COMPATIBLE
RIGHTS_APPROVED
SECURITY_APPROVED
RESOURCE_CAPACITY_AVAILABLE
ENERGY_CAPACITY_AVAILABLE
DEPENDENCIES_AVAILABLE
LICENSE_OR_USAGE_RIGHT_VALID_SIMULATION
MIGRATION_PLAN_READY
ROLLBACK_PLAN_READY
TESTS_PASS
```

`TESTS_PASS` is the final aggregate gate and cannot pass while any preceding
gate is `FAIL` or `NOT_EVALUATED`, even before approval is requested.
`APPROVED_SIMULATION` requires all fourteen gates to pass. Approval does not
grant Production authority.

Each gate has a same-named evidence record containing its result, evidence
references, an existing Git evidence commit, per-reference content hashes,
evidence hash, reviewer, reason and review time. The evidence result must equal
the gate result. Aggregate gate values are derived from these evidence results
by the semantic validator; they are not an independent source of approval. The
evidence hash is SHA-256 over the canonical key-sorted gate, result, references,
commit, content hashes, reviewer, reason and review time.

Every gate requires at least one repository artifact. A repository reference
must be a non-symbolic regular file in the current worktree and a Git regular
file (`100644` or `100755`) at the recorded
commit. Its content hash is computed from that immutable blob, not from a path
name or caller-provided metadata. Event references are supplementary and bind
the canonical event envelope hash. A directory, untracked path, missing commit,
bare boolean, unresolved reference, tampered content hash or unevidenced `PASS`
is invalid.

Every gate also requires exactly one typed semantic attestation. The
attestation binds its gate-specific evidence type and check to the review,
transplant, donor Life and Genome, host Life and Genome, organ, reviewer,
result and review time. An unrelated repository file cannot satisfy a gate
merely because its bytes and commit are valid. Reviewer and Life identity
authority is resolved from the immutable reviewed Registry epoch at commit
`cc80135f2c6e6a74aad11f34e793c65ac0ee1938`; branch-local authority drift is
rejected.

An approved state also requires `transplant_right` and
`license_or_usage_right` to equal `APPROVED_SIMULATION`. Schema conditionals
and the semantic validator both fail closed when evidence or simulated rights
are absent.

## 4. State Machine

Allowed states are:

```text
PROPOSED
DONOR_REVIEW
HOST_REVIEW
COMPATIBILITY_TEST
REJECTED
APPROVED_SIMULATION
TRANSPLANTING
INTEGRATION_TEST
ACCEPTED
REWORK_REQUIRED
ROLLED_BACK
COMPLETE
```

Normal forward path:

```text
PROPOSED
-> DONOR_REVIEW
-> HOST_REVIEW
-> COMPATIBILITY_TEST
-> APPROVED_SIMULATION
-> TRANSPLANTING
-> INTEGRATION_TEST
-> ACCEPTED
-> COMPLETE
```

Any review may enter `REJECTED`. Compatibility or integration failures may
enter `REWORK_REQUIRED`. A started transplant can enter `ROLLED_BACK` only by
executing the recorded rollback plan and verifying the restored state hash.
Later rework, rejection or rollback cannot erase the approval evidence that
authorized an earlier `APPROVED_SIMULATION`, `TRANSPLANTING`,
`INTEGRATION_TEST`, `ACCEPTED` or `COMPLETE` event.

## 5. Compatibility Review

Review compares:

- organ type and owner identity;
- donor and host compatibility epochs;
- input/output protocols and contract hashes;
- state and event schema hashes;
- required and forbidden host capabilities;
- dependencies, location and embodiment;
- compute, memory, storage, network and energy budgets;
- rights, simulated license and provenance;
- security boundary and authority level;
- deterministic replay and rollback behavior.

The review record includes the host Life type and an explicit host-capability
set. The host Life type must occur in the donor Genome contract and every
required host capability must be present. Donor ownership, donor Genome,
review, host and organ identities are resolved across the complete record by
`tools/validate-software-organ-transplant.mjs`.

The validator derives the repository root from its own canonical module path
and rejects a caller-selected Git repository. The canonical origin and reviewed
Software Life lineage anchor must resolve before it loads the authoritative
Software Life Registry, compatibility schema and Worker Registry from fixed
paths. Caller-provided roots, Registry or Schema objects are rejected. Each
governance file must match its committed `HEAD` blob. It verifies Registry source metadata and
policy, donor organ provenance against the Registry source commit, donor and
host Genome IDs, host Life type, donor organ
membership and type, artifact content hash, `transplantable: true` and all Life
or Organ dependencies. Reviewers, plan owners and approval actors resolve to
active Worker Registry identities. Rights principals resolve to donor and host
Registry records. An in-memory self-declaration is never sufficient evidence.

An adapter is itself an identified organ or implementation artifact. An
unrecorded adapter cannot be used to declare compatibility.

## 6. Migration Plan

The migration plan records:

1. exact donor artifact and content hash;
2. host baseline commit, canonical state reference and state hash;
3. canonical destination path with no version token;
4. imports, routes, schemas and data requiring change;
5. legacy aliases and compatibility period;
6. ordered integration steps;
7. expected resource, energy and downtime budget;
8. validation commands and acceptance criteria;
9. event and provenance updates.

Both migration and rollback plans bind the repository commit, registered host
canonical state reference, baseline state hash, artifact hash, affected paths,
bounded resource and energy budgets, maximum downtime, verification commands
and recovery record. The semantic validator recomputes each plan artifact
hash. The baseline commit must be a strict ancestor of canonical `HEAD`, not
`HEAD` itself; dangling local objects are not authority. The baseline Registry
must contain the host but must not yet contain the transplant identity, and
review evidence must be committed after that baseline. The canonical state
reference must resolve to a non-symbolic regular Git file at that commit, and
its computed SHA-256 must equal the recorded baseline hash.

Every event names the owning plan ID, plan-step index and action. Ordinary
execution maps one-to-one to ordered migration steps. A rollback event instead
binds the rollback plan, whose deterministic V1 action is exactly
`ROLLBACK-RESTORE`; a placeholder or unexecuted rollback step is invalid.

No authoritative source is overwritten without a recoverable history. A
versioned legacy path may survive only as a thin alias to the canonical organ.

## 7. Rollback Plan

Rollback must name the pre-transplant commit, host canonical state reference,
host state hash, files, data projection, verification commands and an
authorized owner. It must preserve donor and failed integration evidence.
Rollback never deletes immutable event history.

The rollback plan and migration plan must bind the same pre-transplant commit,
state reference and state hash. A rollback event records `restored_commit`,
`restored_state_ref` and `restored_state_hash`, each equal to that migration
baseline.

If rollback cannot restore the host deterministically, the proposal cannot
pass `ROLLBACK_PLAN_READY`.

## 8. Test Contract

Required tests cover:

- execution of the canonical Draft 2020-12 JSON Schema before semantic
  approval;
- rejection of caller-supplied Registry or Schema authority;
- identity and content-hash resolution;
- schema and interface compatibility;
- dependency availability and cycle classification;
- resource and energy capacity;
- permission and simulated-license boundaries;
- deterministic state migration and replay;
- integration behavior and host regressions;
- alias single-implementation proof;
- rollback restoration and event-chain integrity;
- existing Git commits, immutable evidence blobs and reproducible host
  baselines;
- absence of Wallet, real KGEN, on-chain, external autonomy and Production
  authority.

Tests must distinguish `PASS`, `FAIL` and `NOT_EVALUATED`. Missing evidence is
never a pass. Structural schema inspection alone is insufficient: concrete
valid and invalid records must also pass through the semantic validator.

## 9. Event Record

Every transition records:

```text
event_id
transplant_id
donor_life_id
host_life_id
organ_id
simulation_time
actor
action
inputs
outputs
resource_delta
energy_delta
rights_decision
status
reason
previous_transplant_state
next_transplant_state
previous_state_hash
next_state_hash
seed
```

Every event repeats the transplant, donor, host and organ identities. Event IDs
are unique, times are nondecreasing, state transitions follow the state
machine, and each `previous_state_hash` equals the preceding
`next_state_hash`. The next hash is SHA-256 over the canonical key-sorted event
envelope with `next_state_hash` omitted. Each event binds its zero-based plan
step index and canonical action. Its resource delta must equal the organ's
declared compute cost exactly, and its energy delta must equal the organ's
declared per-operation energy cost exactly; both costs must be positive for a
transplantable organ. The validator derives these totals independently,
enforces the migration budgets and recomputes each
`outputs.replay_state_hash`. Rehashing a fabricated envelope without the same
replayed state is rejected. A rollback event must record
`restored_commit` and `restored_state_hash` equal to the migration plan's
pre-transplant baseline. The event chain is deterministic, serializable,
replayable and auditable.

The Rights record's `decision_event_id` must resolve to the event that enters
`APPROVED_SIMULATION`, and that event's `rights_decision` must also be
`APPROVED_SIMULATION`.

## 10. Acceptance And Ownership

`ACCEPTED` means the host integration tests passed in simulation. `COMPLETE`
means metadata and transplant state both say `COMPLETE`, and evidence, Registry
projection, Genome revision, maintenance ownership and rollback retention are
recorded as reachable regular Git files with matching SHA-256 values. Genome
and integration evidence must be structured JSON attestations binding the
review, donor, host, both Genome IDs, organ and transplant. The host Registry
projection must contain a structured completed-transplant record with those
same identities and completion commit; a bare string, arbitrary blob, empty or
caller-asserted completion envelope fails closed. Canonical review,
rework, rejection, acceptance, rollback and completion events must be emitted
by the registered Codex reviewer. Neither state transfers real ownership.

Gate evidence commits must strictly precede the completion commit. Completion
references must remain non-symbolic regular files in the current worktree as
well as regular Git blobs at the completion commit. Genome completion evidence
also binds the compatibility review ID.

Donor authorship and provenance cannot be erased. A host may reference or
embed a licensed organ while the donor remains a separate historical source.

## 11. Prohibited Operations

The following are prohibited:

- copy-and-paste integration without identity and provenance;
- transplant into a forbidden host;
- bypass of Rights, security, resource or rollback gates;
- automatic Canonical promotion;
- unrestricted mutation or reproduction;
- self-modifying Production code;
- external autonomous deployment;
- real Wallet, KGEN, payment, ownership or on-chain transfer;
- modification of protected `CURRENT` authorities through a transplant.

## 12. Recovery

A failed proposal remains an auditable record. A failed integration enters
`REWORK_REQUIRED`, `ROLLED_BACK` or `REJECTED`; it never masquerades as
`COMPLETE`. Recovery restores the host while retaining all donor, decision,
test and failure evidence.
