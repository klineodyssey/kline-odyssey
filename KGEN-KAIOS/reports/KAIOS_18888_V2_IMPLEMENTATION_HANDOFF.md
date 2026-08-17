# KAIOS 18888 Divine Bank V2 Implementation Handoff

Status: DESIGN READY / IMPLEMENTATION NOT AUTHORIZED

Task: `KAIOS-18888-DIVINE-BANK-V2-CANON-CORRECTION-001`
Execution base: `00c79b380ce094c17d75697f360820c4d2035071`

## 1. Exact allowlist used by this design task

Only these eight new files are in scope:

1. `KGEN-KAIOS/KAIOS_18888_DIVINE_BANK_V2_CANON.md`
2. `KGEN-KAIOS/KAIOS_18911_MARS_KUFO_SEPARATION_CANON.md`
3. `KGEN-KAIOS/schemas/celestial-seat-v2.schema.json`
4. `KGEN-KAIOS/schemas/celestial-fund-flow-v2.schema.json`
5. `KGEN-KAIOS/schemas/natural-resource-reward-v1.schema.json`
6. `KGEN-KAIOS/reports/KAIOS_18888_V2_LIVE_CONFLICT_REVIEW.md`
7. `KGEN-KAIOS/reports/KAIOS_18888_V2_IMPLEMENTATION_HANDOFF.md`
8. `KGEN-KAIOS/tests/fixtures/celestial-bank-v2-invariants.json`

No existing Solidity, Runtime CURRENT, Boot, token, Genesis, frontend, indexer or company file is modified. The `schemas/` directory is new because the execution base has no cross-domain design-schema root; it prevents mixing proposed V2 records into deployed ABI/indexer schemas.

## 2. Proposed implementation components

### Eligibility V2

- Remove the formal 18911 furnace and `proofId` as celestial-service requirements.
- Preserve Life ID, canonical beneficiary, contribution and constitution evidence.
- Add supply-chain, safety and technical-review evidence roots.
- Make each transition explicit, replay-protected and governed.
- Never call Seat500 directly from evidence submission.

### Performance-bond lifecycle controller

- Link one active seat term to one outstanding qualifying commitment.
- Preserve independent commitment IDs and fixed beneficiary/releaseAt.
- Permit lawful release after maturity.
- On release request/execution, schedule seat retirement and salary stop for the next civilization Epoch.
- Preserve already matured salary liability without generating new liability after the stop checkpoint.

### Segregated treasury ledger

- Track performance bond, claimable salary, funded salary, claimable Reward, funded Reward and protected reserve as distinct liabilities/buckets.
- Validate exact balance deltas and revert atomically on mismatch.
- Prohibit arbitrary admin withdrawal and cross-rail spending.
- Expose read-only bucket balances and conservation diagnostics.

### 33333 Reward policy / 18888 settlement

- 33333 authorizes resource policy, evidence and reward amount within caps.
- Independent measurement, policy and settlement reviewers are required.
- 18888 pays only an approved, funded, non-replayed claim to its canonical beneficiary.
- Reversal/appeal updates evidence status; it cannot erase an already executed transfer without a separately lawful recovery process.

## 3. Storage plan

Do not append fields ad hoc to live contracts. Before implementation:

1. generate current proxy storage layouts from the exact PR #136 compiler inputs;
2. preserve every V1 slot and namespace;
3. allocate deterministic new namespaces for seat lifecycle, bond-seat links and liability buckets;
4. reserve documented gaps;
5. compare compiler storage layouts and raw fork slots before and after upgrade;
6. patch all UUPS immutable offsets in runtime verification;
7. reject implementation if a namespace, inherited OZ field or gap overlaps.

Suggested logical records:

```text
SeatApplicationV2
SeatTermCheckpoint
BondSeatLink
SalaryStopCheckpoint
LiabilityBucket
FundMovement
ResourceRewardClaim
EvidenceReview
```

## 4. Role matrix

| Capability | Applicant/Life | Technical reviewer | 33333 policy | Mother | Jade | Guanyin | Anyone |
|---|---:|---:|---:|---:|---:|---:|---:|
| Submit application/evidence | yes | no | no | no | no | no | no |
| Verify technical evidence | no | yes, scoped | no | no | no | no | no |
| Authorize resource policy | no | no | yes, capped | proposal only | approval only | no | execute after delay |
| Configure/retire seat | no | no | no | proposal only | approval only | pause only | execute after delay |
| Pause public writes | no | no | no | no | no | yes | no |
| Unpause/upgrade/change caps | no | no | no | proposal only | approval only | no | execute after delay |
| Trigger matured bond release | yes | no | no | no | no | no | yes |
| Trigger fixed-beneficiary claim | yes | no | no | no | no | no | yes |
| Redirect beneficiary or withdraw arbitrarily | no | no | no | no | no | no | no |

Reviewers gain no treasury custody. Mother and Jade remain distinct; the 3600-second delay cannot be bypassed. Guanyin pause cannot imply unpause or asset authority.

## 5. Threat model and required tests

| Threat | Required control/test |
|---|---|
| 18911 proof reused as celestial qualification | Schema null field plus contract-level rail/domain separator and replay rejection |
| Applicant pays 5M and receives automatic seat | No deposit-to-seat call; governance state transition required |
| Bond funds salaries or Reward | Bucket-level debit authorization; invariant and negative tests |
| Released bond continues salary | Next-Epoch stop checkpoint and boundary tests |
| Salary/reward claim replay | Domain-separated claim key and consumed mapping |
| Beneficiary redirect | Store canonical beneficiary; caller supplies no destination |
| Seat 501 | Hard cap test at 500/501 |
| Underfunded budget | Atomic revert; liability/claim checkpoint unchanged |
| Reviewer collusion | Reviewer separation plus delayed governance for policy/caps |
| Reentrancy / hostile token | checks-effects-interactions, nonReentrant, exact balance-delta tests |
| Upgrade/storage corruption | layout diff, raw-slot fork check, UUPS verifier regression |
| Admin sweep | no recovery/sweep surface for KAIOS principal; arbitrary withdrawal invariant |
| Misleading UI | fail closed on V1, display three rails and legal wording |

## 6. Required executable test plan

1. State machine valid and invalid transition matrix.
2. Every applicant type follows identical accounting.
3. 4,999,999.999... commitment rejected; 5,000,000 accepted without burn.
4. Evidence alone, bond alone and governance alone never assign a seat.
5. Seat count 500 accepted and 501 rejected.
6. Bond releaseAt-1 rejects; exact releaseAt succeeds only to stored beneficiary.
7. Release while paused follows the finalized property-rights Canon.
8. Principal release schedules retirement/salary stop for the next Epoch.
9. Salary 88 KAIOS baseline, 1x-5x checkpoints and day-5 UTC+8 boundaries.
10. Salary and Reward underfunding revert without consuming claims.
11. Duplicate salary and Reward claims reject.
12. Exact conservation and bucket separation under fuzz/invariant tests.
13. 18911 proof cannot enter any celestial V2 method or storage domain.
14. 18921 remains AutoLP in navigation and labels.
15. Fresh BSC fork from current state validates upgrade/storage/roles with no Mainnet write.

## 7. Frontend/indexer acceptance

Before launch, frontend must display the three colored paths, seat star map, exact lifecycle state, contribution evidence, refundable principal, Payroll Pool, Reward Pool, Reserve Floor and every fund source/destination. It must show all mandatory disclaimers and fail closed on unknown chain/address/version/pause/governance state.

Indexer/read model must independently track applications, evidence reviews, governance transitions, commitment links, principal release, salary-stop checkpoint, salary/reward budgets and claims. RPC cross-checks remain independent. A mismatch produces `ERROR_MISMATCH` and disables writes.

## 8. Rollout and recovery proposal

1. Keep public application UI disabled.
2. Human reviews and freezes this V2 Canon.
3. Implement on a new bounded branch from exact deployed lineage.
4. Run compile/unit/fuzz/invariant/storage/UUPS/fork/frontend/indexer suites.
5. Obtain independent security and legal reviews.
6. Prepare exact pause/upgrade/migration/activation governance packages.
7. Human separately authorizes Mainnet actions.
8. Verify live state and zero/migration counts before first transaction.

If an upgrade fails, stop. Do not invent an EOA bypass, replace the proxy, move assets, release claims, or alter a separate rail. Recovery uses the prior implementation and exact proxy/storage evidence under delayed governance.

## 9. Explicit non-authorizations

```text
SOLIDITY_IMPLEMENTATION = NOT_STARTED
MAINNET_PAUSE = NOT_AUTHORIZED
GOVERNANCE_PROPOSAL = NOT_AUTHORIZED
DEPLOY_OR_UPGRADE = NOT_AUTHORIZED
5M_BURN_OR_COMMITMENT = NOT_AUTHORIZED
SEAT_OR_SALARY_CLAIM = NOT_AUTHORIZED
PR142_MODIFICATION = NONE
```
