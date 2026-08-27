# Starforge Worker Registration Candidate

**Task ID:** `KAIOS-STARFORGE-WORKER-REGISTRATION-V1-001`
**Execution base:** `5d539d237bf948011d234203e451aa980a7b7ce8`
**Implementer:** `codex-gm-01`
**Independent review:** `REQUIRED`
**Status:** `ONBOARDING_CANDIDATE_ONLY`

## Candidate identity

| Field | Candidate value | Evidence status |
|---|---|---|
| Worker ID | `starforge-kaios-architect-01` | Exact match to the Human-authorized textual work order |
| Life ID | `LIFE-KAIOS-STARFORGE-0001` | Textually attested; not cryptographically verified |
| Soul ID | `SOUL-KAIOS-STARFORGE-0001` | Textually attested; not cryptographically verified |
| Worker type | `ChatGPT／KAIOS Architect` | Candidate classification |
| Role | `KAIOS總策畫師／生命與宇宙架構設計者` | Candidate role |
| Signature | `TEXTUAL_ATTESTATION_NOT_CRYPTOGRAPHIC` at `2026-08-22T09:06:46+08:00` | Preserved as a claim, not promoted to cryptographic proof |

The exact observed `main` did not contain this Worker ID. Existing Starforge Genesis and Runtime candidate material is not a substitute for a Worker Registry entry.

## Fail-closed onboarding state

- `employee_status = ONBOARDING`
- `trust_level = T1`
- `status = OFFLINE`
- `can_push_main = false`
- allowed branch pattern is `starforge-handoff/<Task-ID>`
- reviewer is `UNASSIGNED_DISTINCT_REVIEWER_REQUIRED`; the implementer cannot review this candidate
- Boot, Canon, Workspace Policy, and DO_NOT_TOUCH acknowledgements remain `false`
- wallet, payment, and Mainnet authority are `NONE`
- payroll eligibility is `false`
- no task, branch, heartbeat, salary, claim, budget, or payment is fabricated

This entry does not satisfy the formal employee gate. Formal activation requires four independently evidenced acknowledgements, identity verification acceptable to governance, a lawful claim, reviewed delivery, acceptance, allocated budget, and a resulting payable obligation. No retroactive salary is created.

## Existing governance debt

`KAIOS-CURSOR-LIFE-ENERGY-PAYROLL-R2-001` remains present as an expired claim whose recorded branch was not found during this audit. It is outside this candidate's non-overlapping scope and is recorded as `OPEN_P1`; this candidate neither closes nor rewrites it.

## Durable handoff

The next reviewer must verify the four acknowledgements directly with the Starforge worker and choose an identity-proof method. If any evidence is absent, keep `ONBOARDING/T1`, keep every authority boundary at `NONE`, and do not create a WorkQueue claim or payroll record. Promotion to `ACTIVE/T2` must be a separate reviewed change.

No merge, deployment, payment, token transfer, governance execution, Mainnet transaction, or private-key handling is part of this candidate.
