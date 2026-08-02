# KAIOS Cursor Continuous Queue Report

Task ID: `KAIOS-AI-COMPANY-ORDER-PROJECT-RUNTIME-V1-001`

Queue authority: `CODEX_CONTROLLED_AFTER_FORMAL_RELEASE`

Worker: `cursor-01`

Concurrency: `ONE_TASK_AT_A_TIME`

## Completed During This Workline

- Vegetable candidates: Draft PR `#94`, independently reviewed at
  `P0=0 / P1=0 / P2=0`, merged as `CANDIDATE_ONLY` in
  `614b4e02edb8f705848ad7cb49132ae37e8f5b7e`.
- Governance handoff: PR `#95`, independently reviewed at
  `P0=0 / P1=0 / P2=0`, merged in
  `a38ad99338025c3ac0f4f8553ff6479340286ea0`.

The vegetable assignment was allowed to complete before its lease was released.

- Soil-type candidate data: PR `#96`, independently reviewed and merged as
  `CANDIDATE_ONLY` in
  `1650191f35567d43016473420cfd2cba22b00aea`.
- Soil release and fertilizer dispatch governance: PR `#98`, independently
  reviewed at `P0=0 / P1=0 / P2=0` and merged in
  `1e38b59a6fde788f4eee214b8ed503553d4a007b`.
- Fertilizer-model research candidates: PR `#99`, independently reviewed at
  `P0=0 / P1=0 / P2=0`, merged as `CANDIDATE_ONLY` in
  `976f91ac59ecf43a5e28b0afa5df0a9f948d9c76`.
- Fertilizer release and compost dispatch governance: PR `#100`, independently
  reviewed at `P0=0 / P1=0 / P2=0` and merged in
  `38901fddd3a513b5121b8828dce43898a7ed74b6`.
- Compost-model research candidates: PR `#101`, independently reviewed after
  bounded repairs and merged as `CURSOR_RESEARCH_CANDIDATE_ONLY` in
  `56d3b8f20a63c4a8a5d19251ed72f7f9fe4e78c9`.
- Compost release and insect dispatch governance: PR `#102`, independently
  reviewed at `P0=0 / P1=0 / P2=0` and merged in
  `88dce5e0532567a1f1113abf9bfee907efea65bc`.
- Insect candidate research: PR `#104`, independently reviewed at
  `P0=0 / P1=0 / P2=0` and merged as
  `CURSOR_RESEARCH_CANDIDATE_ONLY` in
  `c91d736c9812781d309bfda422b8ed42cd12eb49`.
- Pollinator research: PR `#106`, independently reviewed at
  `P0=0 / P1=0 / P2=0` and merged as
  `RESEARCH_PROPOSAL_ONLY` in
  `745952dc389d62cf85545a86b18e279d8eca9c73`.

## Current Assignment

- Task: `KAIOS-CURSOR-EARTHWORM-CANDIDATE-001`
- Branch: `cursor-handoff/KAIOS-CURSOR-EARTHWORM-CANDIDATE-001`
- Status: `ACTIVE / ONE_TASK_AT_A_TIME`
- Output authority: `CURSOR_RESEARCH_CANDIDATE_ONLY / PENDING_CODEX_REVIEW`

The next safe queue item is the fungi candidate package. It may be dispatched
only after Codex independently reviews and formally releases the earthworm
candidate claim.

## Boundaries

Cursor cannot modify Runtime authority, CURRENT, Canonical schemas, Universe
Law, Rights authority, Economy authority, Wallet, KGEN, deployment or merge
state. Cursor output never becomes Canonical without Codex review.

The read-only AI Company API and Viewer expose the queue without granting the
Runtime any dispatch, merge or deployment mutation endpoint.
