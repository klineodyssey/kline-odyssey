---
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human Architecture Review required"
SOURCE_COMMIT: "89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "HUMAN-CODEX-SWARM-001"
CHANGE_REASON: "Define unique identity, Claim, Session, worktree and write-set rules for internal Codex Clones."
ANCESTOR: "KGEN-KAIOS/governance/autopilot/worker-swarm/MASTER_REGISTRY_STANDARD.md; KGEN-KAIOS/governance/cursor/CURSOR_TASK_ENVELOPE_STANDARD.md"
SOURCE_OF_TRUTH: false
---

# Codex Clone Governance Standard

## 1. Required Identity

Every internal Clone record requires:

```text
codex_organization_id
parent_worker_id
internal_actor_id
internal_actor_attestation
clone_id
clone_role
session_id
claim_id
task_id
worktree_id
branch
base_sha
head_sha
review_owner_id
fencing_token
record_version
permission_snapshot
protected_path_snapshot
write_set
read_set
checkpoint_id
status
created_at
updated_at
expires_at
```

IDs are globally unique and never recycled. Display names are not authority.

## 2. Derived Actor Registration

An internal Clone cannot execute as the shared `codex-gm-01` principal. Before activation, each `internal_actor_id` must be registered as a derived runtime principal with:

- parent organization and Worker reference;
- immutable role class;
- least-privilege actions and paths;
- autonomy ceiling no higher than the parent grant;
- expiry and revocation;
- reviewer eligibility and conflict rules;
- branch namespace;
- worktree requirement;
- Human Anchor and Decision references.

Derived actors do not become new employees by registration. Employment, trust and promotion remain Workforce governance decisions.

## 3. Session And Claim

- One Clone has at most one unfenced active Session.
- One Session has at most one active Claim.
- One Task has at most one active primary Claim.
- Review custody retains the Claim after author execution stops.
- Repair remains in the same Claim lineage with a fresh fencing token.
- Recovery fences the old Session before a new Session can write.
- Branch-local files are evidence, not Claim authority.

Parallel execution is disabled until the canonical atomic Claim authority or an explicitly approved equivalent enforces these invariants.

## 4. Worktree And Branch

Each Claim binds one logical worktree and branch:

```text
worktree_id: CODEX-WT-<ROLE>-<TASK-ID>-<INSTANCE>
branch: codex/<role>/<task-id>-<instance>
```

Rules:

1. Human Main is always excluded.
2. Worktrees cannot be shared between Clones.
3. A worktree cannot switch to a second active Claim.
4. Base SHA is captured at Claim acquisition.
5. Repository health and origin freshness are rechecked before Review and Git integration.
6. No force push, destructive reset, hidden stash, or unreviewed merge.

## 5. Read And Write Sets

Task Envelope declares normalized `read_set`, `write_set`, `protected_set`, and generated-output set.

- Read/read overlap is allowed.
- Read/write overlap is allowed only when the reader uses a fixed source version.
- Write/write overlap is denied.
- Parent/child directory overlap is treated as overlap unless explicit file-level partitioning is proven.
- Shared indexes, decision logs and registry projections use serialized append/integration ownership.
- Protected paths always override a write allowlist.

A write-set change requires a superseding Task Envelope and conflict recheck. A Clone cannot expand scope itself.

## 6. Quotas

V1 global quota:

```text
max_active_codex_clones = 10
max_active_claims_per_clone = 1
max_active_sessions_per_clone = 1
max_active_git_integrations = 1
max_active_dispatch_mutations = 1
max_repair_cycles = policy_configured
max_recovery_rate = policy_configured
```

Role quotas are upper bounds; global, repository, risk, compute and Human authority limits may reduce them. Silence or idle capacity never authorizes a new Clone.

## 7. Checkpoint

Every long-running Clone records:

```text
checkpoint_id
session_id
claim_id
task_id
base_sha
current_head_sha
completed_steps
pending_steps
changed_files
test_state
evidence_refs
known_conflicts
next_safe_action
checkpoint_hash
created_at
```

Checkpoint does not prove completion or transfer authority.

## 8. Conflict And Stop Conditions

Stop on:

- duplicate internal actor, Clone, Session or Claim;
- missing Human/Decision authority;
- role/action mismatch;
- write-set overlap;
- stale fencing token;
- stale or conflicting base;
- protected-path requirement;
- self-review or author/integrator conflict;
- secret or private-data exposure;
- missing checkpoint/evidence;
- registry, Claim authority or Human Anchor unavailable;
- action above autonomy ceiling.

The output is `BLOCKED` with evidence and a recommended governing action. It is never a guessed permission.

## 9. Current Boundary

This standard defines no live registry, lock, worktree, branch, Claim, Clone or Session.
