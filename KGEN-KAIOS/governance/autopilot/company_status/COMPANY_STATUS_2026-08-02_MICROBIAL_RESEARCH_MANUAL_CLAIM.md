# Company Status: Microbial Research Manual Claim

Date: `2026-08-02`

Company Boot: `BOOT_PASS`

Queue mode: `ONE_TASK_AT_A_TIME / MANUAL_DISPATCH_NON_ATOMIC`

## Claim

- Claim ID: `CLAIM-KAIOS-CURSOR-MICROBIAL-RESEARCH-001-001`
- Task: `KAIOS-CURSOR-MICROBIAL-RESEARCH-001`
- Worker: `cursor-01`
- Branch: `cursor-handoff/KAIOS-CURSOR-MICROBIAL-RESEARCH-001`
- Source base: `7008e4f9449f6df050171cf47ec6ec56419925e9`
- Execution base rule: branch only from the merged claim-record commit, which
  must descend from the source base.
- Issued: `2026-08-02T13:53:00Z`
- Lease expiry: `2026-08-03T01:53:00Z`
- Fencing token: `1`
- Record version: `1`
- Output authority: `CURSOR_RESEARCH_PROPOSAL_ONLY`
- Reviewer: `codex-gm-01`

The claim was recorded only after the Fungi claim had been closed and
released. It is the sole active worker claim in the Worker Registry, canonical
forest/agriculture queue and Software Life 24-hour queue.

## Evidence

- Prior Worker Registry Git object:
  `93342ab913d0adab57c29a85017b9907b05b026e`
- Prior Worker Registry SHA-256:
  `af348f1ad3967ffc7aca13387a3d0a45827bc84fe2aa99804570435a67df34b2`
- Prior canonical queue Git object:
  `c0596410cc1b32190f4b8369c98b23b9539351b4`
- Prior canonical queue SHA-256:
  `b2e044cf29ef031f2f47a04442001f4a0376cb14819e9834ede3dd200d75544b`

The authorized scope remains exactly eight research files under
`KAIOS/life/candidates/forest-agriculture-v1/microbial-research/`. Cursor may
not modify Runtime, Canonical schemas, CURRENT, Wallet, KGEN, public APIs,
deployment or merge state.

## Authority Boundary

The selected dedicated transactional Atomic Claim Authority remains an
unimplemented proposal. This record therefore does not claim a distributed
atomic lock, automatic dispatch, Production authority or external autonomy.
It is an audited pre-cutover manual assignment and is labeled
`MANUAL_DISPATCH_NON_ATOMIC` everywhere it is projected.

Real wallet: `FALSE`

Real KGEN: `FALSE`

On-chain transfer: `FALSE`

Production authority: `FALSE`

External autonomy: `FALSE`
