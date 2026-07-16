---
VERSION: "0.1.0"
REVISION: "2026-07-15.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-15"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "PENDING_HUMAN_REVIEW"
SOURCE_COMMIT: "7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-KAIOS-REVIEW-CURSOR-BOOTSTRAP-001"
CHANGE_REASON: "Define pre-write and pre-handoff protected-path enforcement for Cursor."
ANCESTOR: "KGEN-Agent-Office/DO_NOT_TOUCH.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: ArchitectureGovernance
PHYLUM: WorkerControlProposal
CLASS: PathSafety
ORDER: GovernedExecution
FAMILY: KAIOS
GENUS: ControlledWorker
SPECIES: CursorProtectedPathPolicyArchitecture
CANONICAL_FILE: "KGEN-KAIOS/governance/cursor/CURSOR_PROTECTED_PATH_POLICY.md"
---

# Cursor Protected Path Policy Proposal

## 1. Fail-Closed Boundary

Cursor must load the current repository protection sources before planning and again before handoff. The effective protected set is the union of Constitution, Boot, Workspace Policy, module baseline, `DO_NOT_TOUCH`, Task Envelope and Human Decision restrictions.

## 2. Minimum Protected Set

The following are protected unless a higher governance process creates a separately reviewed change plan. This Cursor runtime still blocks direct execution:

- every Runtime `CURRENT` file, including `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`;
- every Universe Map CURRENT selector and selected CURRENT map;
- frozen Architecture Baselines and their signed manifests;
- Constitution, Canon and CURRENT Boot authority files;
- `contracts/` and the KGEN Token contract;
- `wallet/` runtime;
- `bridge/` runtime;
- the existing protected runtime under `K線西遊記/temples/12345/`;
- `docs/physics/final-whitepaper/`;
- Human Main and all uncommitted Human files;
- secrets, credentials, private keys, seed phrases, access tokens and private personal data;
- any additional path marked protected by current repository governance.

Historical files do not become editable merely because they are not CURRENT. The Task Envelope must still authorize their paths.

## 3. Required Enforcement Points

### Pre-write gate

Cursor compares the planned file set, resolved paths, symlink targets and generated outputs against the protected snapshot. Any intersection blocks all writes.

### Pre-handoff gate

Cursor compares the full diff, rename sources and targets, deletions, generated files and submodule changes against the same snapshot. The check must report zero violations before handoff.

## 4. Protected Change Request

If authorized work genuinely requires a protected path, Cursor must stop and create a proposal containing:

```text
PROTECTED_PATH_CHANGE_PROPOSAL
Requested path:
Reason:
Current authority conflict:
Expected change:
Risk:
Rollback concept:
Required Human decision:
```

It must not make the proposed edit. Human approval for architecture or research alone does not grant protected-path implementation authority.

## 5. Human Main

Cursor must not stash, reset, clean, overwrite, move, stage or commit Human Main content. Unknown Human Main changes are a stop condition. Cursor performs task work only in its isolated worktree.

## 6. Secrets and Sensitive Data

If a secret or suspected secret is found, Cursor must stop, avoid reproducing its value, preserve minimal evidence by path and classification, and request a security response. Secret discovery never authorizes repository storage.

## 7. Evidence

The handoff must include:

- the protection sources loaded;
- the pre-write result;
- the pre-handoff result;
- changed-path inventory;
- `protected_path_violations: 0`;
- explicit Runtime CURRENT and Universe Map modification flags.

## 8. Non-Authorization

This policy proposal does not approve any protected-path change and does not supersede existing protection sources.
