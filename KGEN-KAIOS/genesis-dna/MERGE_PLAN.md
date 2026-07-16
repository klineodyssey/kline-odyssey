---
TITLE: "Genesis DNA Additive Merge Plan"
VERSION: "0.1.0"
STATUS: "PROPOSAL_ONLY"
TASK_ID: "HUMAN-GENESIS-DNA-EVOLUTION-001"
---

# Merge Plan

No semantic merge into CURRENT or a frozen baseline is authorized in this round. The proposal uses an additive adapter:

| Legacy term | Proposed normalized term | Migration behavior |
|---|---|---|
| `GA = Evolution Level` | `TrainingLevel` plus `EvolutionXP` | Preserve historical text; new APIs reject ambiguous `ga_level` without a version tag |
| `GA0..GA1000` | `LV1..LV1000` | Convert only through a future reviewed migration record |
| `GA100 -> GA300` | Training progress or generation event | Never interpret as 200 new atoms |
| GA fitness from PnL/Sharpe/MaxDD | Domain-specific performance evidence | Financial evidence applies only to a finance Capability Module |
| DNA as one strategy engine | DNABlueprint containing many modules/genes/expressions | Keep engine artifacts compartmentalized and optional |

## Future Governed Merge Sequence

```text
Independent Architecture Review
-> Resolution
-> ADR
-> Human Architecture Approval
-> Baseline Candidate
-> Runtime Amendment Proposal (only if required)
-> Human approval for protected change
-> Migration implementation plan
```

## Compatibility Adapter Draft

A future adapter should require `semantic_version` and one of:

- `LEGACY_GA_LEVEL_V3_7`
- `TRAINING_LEVEL_V1`
- `GENESIS_CAPABILITY_ATOM_V1`

Ambiguous unversioned numeric GA input must fail closed. Historical records remain immutable and receive an external interpretation record rather than an in-place rewrite.

## No-Crossover Rules

- Do not modify Physics CURRENT, Universe Map CURRENT, Boot, Constitution, V11 baseline, Life OS baseline or Civilization baseline.
- Do not migrate private formulas into public atom definitions.
- Do not create a WorkQueue or implementation task from this document.
- Do not publish unavailable ZIP hashes or claim the artifacts were inspected.
