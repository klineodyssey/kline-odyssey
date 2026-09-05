# Whole-Life Circulation And K12345 Heart Handoff

**Task:** `KAIOS-WHOLE-LIFE-CIRCULATION-12345-HEART-V1-001`
**Execution base refreshed:** `5d539d237bf948011d234203e451aa980a7b7ce8`
**Implementer:** `codex-gm-01`
**Independent review:** `REQUIRED`
**Candidate state:** `REVIEW_ONLY_CANDIDATE`

## Delivered scope

- exact pre-existing 1 KGEN Fortune pass in TempleHeart, checked before payout;
- unchanged 1 KGEN Heartbeat, 88/hour Heartbeat cap, 8 KGEN Ignite, 88/day Ignite cap, and 1–8 KGEN Fortune range;
- per-Life Organ, Blood Bank, Vessel, Pulse, asset-ledger, and medical-recovery schema with recursive object closure;
- deterministic priority and weighted-gap allocator with lexical smallest-unit residue;
- exact conservation validator and ledger-purpose boundary;
- persistent hash-chained replay journal with trusted-head rollback detection;
- health and medical recovery state machines;
- fractal Organ coordinate calculator;
- unresolved dependency pointer to Starforge PR #163; this PR neither carries nor substitutes for PR #163's distinct security review;
- exact B4 `label × 10^-8` distance adapter, receipt-gated Heart/meal/public-good
  state, bidirectional movement/fare evidence gates, PR #169 market boundary,
  food/waste conservation, strict schema, durable snapshot, tests, and static
  review surface. See `B4_MICRO_CIRCULATION_HANDOFF.md`.

## Evidence state

- Whole-Life/B4 runtime and TempleHeart source-boundary tests: `38/38 PASS`.
- Solidity/lineage/fuzz-invariant suite: `32/32 PASS`.
- Root repository regression tests: `245/245 PASS`.
- Solidity compilation: 27 contracts with solc 0.8.24; TempleHeart deployed bytecode is 23,769 bytes, below the EIP-170 limit of 24,576 bytes.
- ABI validation: 206 baseline entries to 208 candidate entries; the only allowlisted additions are `MIN_FORTUNE_KGEN_PASS_RAW()` and `FortuneKgenPassRequired(uint256,uint256)`.
- UUPS layout validation: all 58 baseline custom slots are preserved and the existing 15 candidate slots are append-only; the Fortune threshold is a constant and consumes no storage slot.
- TempleHeart lineage, integration-artifact scan, secret scan, JSON validation, and `git diff --check`: `PASS`; secret hits and broken links: `0`.
- The workflow checks out `${{ github.event.pull_request.head.sha || github.sha }}`, fails if checkout `HEAD` differs from `EXPECTED_HEAD`, and publishes `whole-life-circulation-exact-head-evidence-<EXPECTED_HEAD>` with base, tree, file hashes, and logs. The Draft PR body pins the authoritative run, artifact, and digest for the final source head.

No pass condition is filled from expectation. Publication remains review-only, and all exact-head evidence must be checked against the head shown by the Draft PR before approval.

## Independent-review gates

1. Confirm the only TempleHeart ABI additions are `MIN_FORTUNE_KGEN_PASS_RAW()` and `FortuneKgenPassRequired(uint256,uint256)`.
2. Confirm the UUPS layout remains 58 preserved custom slots plus the existing 15 append-only slots, with no new storage for the constant.
3. Confirm deployed bytecode remains within EIP-170.
4. Re-run exact 1 KGEN, one-wei-short, pre-transfer, no-burn/no-lock, Heartbeat-entry, range, cap, replay, conservation, fuzz, health, and custody tests.
5. Confirm the persistent journal's trusted checkpoint is externalized before any production runtime.
6. Keep deployment, keeper funding, signer custody, payment, governance execution, and Mainnet transactions blocked.
7. Confirm that the B4 distance is `0.187784225485552 m`, that `825` is never
   treated as physical K, and that all live mission outputs remain unexecuted
   while the snapshot blockers remain present.

## Next handoff action

Obtain an independent security review of the exact Draft PR head and either accept the two allowlisted ABI additions or return a concrete rework list. Do not merge or deploy from this handoff.
