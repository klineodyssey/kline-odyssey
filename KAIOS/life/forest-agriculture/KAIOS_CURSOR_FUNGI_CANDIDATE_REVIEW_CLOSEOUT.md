# Cursor Fungi Candidate Review Closeout

Task ID: `KAIOS-CURSOR-FUNGI-CANDIDATE-001`

Worker: `cursor-01`

Candidate branch: `cursor-handoff/KAIOS-CURSOR-FUNGI-CANDIDATE-001`

Candidate commit: `a4fe488eecdf6652ea9fad257195f3ba8fe853aa`

Candidate PR: `#113`

Merge commit: `beb982fda885fa7acc4dc35407df611d1019a544`

Final classification: `CURSOR_RESEARCH_CANDIDATE_ONLY`

## Independent Review

- Final review: `P0=0 / P1=0 / P2=0 / APPROVED_CANDIDATE`.
- Required package files: `16/16 PASS`.
- Canonical shared-core fields: `47/47 PASS`.
- Field applicability: `44/44 PASS`.
- Microbial extension fields: `6/6 PASS`.
- Bounded parameter records: `31 PASS`.
- Deterministic replay actions: `8 PASS`.
- Blocked zero-delta fixtures: `25 PASS`.
- Conservation and custody ledgers: `13/13 PASS`.
- Immutable Git-object provenance records: `26/26 PASS`.
- Package SHA-256:
  `b58cd9bbd90e5498ec85e23c8fb63af5333b568fc06c2df9f8fef2eacc0b7095`.
- Final deterministic oracle SHA-256:
  `f869fb62c117c97aa7785cb41427f39617fc2a72f7805a426540a9427fa45278`.
- UTF-8, BOM, duplicate JSON keys, secrets, protected paths and
  `git diff --check`: `PASS`.

## Scope Decision

The merge preserves one bounded synthetic fungi-analog candidate for future
decomposition, soil-nutrient and forest research. It does not admit the
candidate into Ecology Runtime, promote a species or package to Canonical,
provide real biological, cultivation, food-safety, agricultural, medical or
environmental guidance, or authorize replication outside deterministic test
fixtures.

## Authority

No Runtime, Canonical Schema, Organism Schema, CURRENT, Universe Law, Rights
authority, Economy authority, Wallet, KGEN, Production authority, deployment
or external autonomy was changed. The Fungi claim is formally `CLOSED`, then
`RELEASED`. The ordered append-only events are `CLAIM_CLOSED` (sequence 1)
followed by `CLAIM_RELEASED` (sequence 2). There are zero active claims after
release. The Microbial task is only `READY_FOR_ATOMIC_CLAIM`; it is prepared
but not claimed, and `cursor-01` has no current task or branch.

The prepared Microbial envelope binds reviewer `codex-gm-01`, source base
`beb982fda885fa7acc4dc35407df611d1019a544`, and exactly the eight files under
`KAIOS/life/candidates/forest-agriculture-v1/microbial-research/` listed in its
work order. Its Registry, canonical queue and public projection all preserve
`CURSOR_RESEARCH_PROPOSAL_ONLY`. It does not authorize any path outside that
envelope.

Final independent review repaired one P1 scheduler ambiguity and one P2
projection omission. The scheduler now stops after preparation and requires a
separate reviewed claim transition before execution. Because the transactional
claim authority remains unimplemented, any later dispatch must be reported as
`MANUAL_DISPATCH_NON_ATOMIC`, never as an automatic atomic claim.
