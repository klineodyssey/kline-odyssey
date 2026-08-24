# PR #165 Reviewer And Secure Transaction Gate Handoff

- **Protocol:** `KAIOS_HUMAN_AUTHORITY_HENGYAO_AUTONOMY_AND_XUANYAO_REVIEWER_ONBOARDING_V1`
- **Implementer:** `codex-gm-01` / 衡曜
- **Latest-main execution base at this rework:** `6e128dc49220d59411bae107725b46a07b4609d3`
- **PR state:** `OPEN_DRAFT / UNMERGED`
- **Independent review:** `REQUIRED`
- **Mainnet execution:** `NOT_AUTHORIZED / NOT_ATTEMPTED`

## Human decision record and non-equivalence gates

Human Authority 沈英明 signed the supplied textual decision at
`2026-08-24T21:08:00+08:00`. The exact decision payload is stored separately
from the operational policy and SHA-256 binds both the full payload and the
Hengyao-only A2 scope. Its effects are deliberately non-equivalent:

- A2 policy ceiling approved does **not** mean a secure signer is connected;
- onboarding process approved does **not** mean Xuanyao was born, registered,
  employed, promoted to T2, or granted review authority;
- a textual Human attestation is governance evidence, not a private key,
  signed transaction, broadcast, receipt, or chain-state change.

The local PR branch is non-destructively synchronized to the latest main above.
Remote exact-head and CI claims must use the next pushed PR head only.

## Non-destructive synchronization

The PR branch preserves both the existing local B4 history and remote PR #165
history, then merges the latest observed `origin/main`. No force push, rebase,
history drop, main-branch write, or conflict-marker resolution was used. Review
must bind to GitHub's current PR head and its new exact-head workflow run rather
than the historical `e3179d2e...` run.

## Distinct-reviewer workforce gate

The formal `KGEN-KAIOS/worker_registry.json` contains no eligible reviewer who
is demonstrably independent from `LIFE-CODEX-GM-0001` and its controller.

| Candidate | Existing evidence | Blocking gates |
|---|---|---|
| `cursor-01` | Active employee, T2, four acknowledgments complete | Temporarily unavailable for this work by Human decision; no registered Life ID or controller evidence; no independent review permissions; active claim history is preserved; KGEN work is forbidden |
| `xuanyao-sol-01` | Human-approved onboarding process; proposed Life/Worker IDs and candidate roles recorded | `CANDIDATE_NOT_BORN`, T1, controller independence unverified, four acknowledgments false, review permissions not granted; PR #169 self-review conflict |
| `claude-01`, `gemini-01`, `openhands-01`, `copilot-01`, `chatgpt-01`, `deep-research-01`, `human-engineer-01` | Existing worker placeholders | T0, pending registration, acknowledgments false, no Life/controller or review authority |
| `codex-gm-01` | Active T5 system maintainer | PR implementer; self-review collision |

Xuanyao is the Human-selected replacement candidate, but remains ineligible and
was not assigned to PR #165. No worker was promoted, no acknowledgment was
invented, and no sub-agent/session was represented as a distinct Life.

An existing unmerged candidate branch,
`codex/distinct-reviewer-governance-gate-v1` at `c947e7b2091f...`, already
records `KAIOS-DISTINCT-T2-REVIEWER-RECRUITMENT-001` in the established Work
Queue. This branch does not duplicate or activate that record; current main
still has no eligible reviewer.

### Human decision resolved; evidence gates remain

- `candidate_worker = xuanyao-sol-01`
- `current_trust = T1`
- `required_trust = T2+`
- `missing_evidence = VALID_BIRTH_EVIDENCE + ACTIVE_LIFE_REGISTRY_RECORD + DISTINCT_CONTROLLER_EVIDENCE + FOUR_PERSONAL_ACKNOWLEDGMENTS + REVIEW_ROLE_AND_PERMISSIONS`
- `current_result = HOLD_GATES_INCOMPLETE`

The Human decision authorizes the process and candidate records. It does not
allow this implementer to synthesize the missing evidence or write Xuanyao's
review conclusion.

## Scoped transaction-gate candidate

`HENGYAO_LIFE_TRANSACTION_POLICY_V1` reuses the registered Hengyao wallet,
deployed K12345 Heart, KGEN address, Heart code hash, deployed ABI selectors,
and the existing externally-custodied signer boundary. It adds no signer,
private-key reader, broadcaster, general transfer rail, Treasury access, or
Company payment authority.

Allowed target on BSC chain 56:

- `0xB016D4d8f1aED1339101b30722cad6dbA9B8C972`
- runtime code hash must equal
  `0x1d3eba15b4c4895710c6e68f3f27e97cb0e2c94edc254d9f1e9148b3d7f55d32`

Exact allowlist:

- `heartbeatClaim()` — fixed 1 KGEN event plus exact KGEN transfer;
- `makeWish(bytes32)` — one non-zero hash and exact Wish event;
- `fortuneClaim(uint256)` — 1–8 whole KGEN only, with an independently read
  pre-existing wallet balance of at least 1 KGEN;
- `vowTo(uint8,uint256)` — exact verified net-profit amount, at most 8 KGEN,
  with sufficient balance and an already-existing allowance. The gate cannot
  create an approval.

Every intent binds Life, Worker, wallet, chain, target, code hash, selector,
arguments, zero native value, nonce, current balances, successful simulation,
gas estimate, survival reserve, policy version, five-minute expiry, replay
nonce, approved A2 authority evidence, and signer-address binding. The
hash-chained append-only journal uses an exclusive local lock, `fsync`, unique
intent/replay IDs, restart replay checks, and trusted-head rollback detection.

Caller-supplied A2 or approval labels cannot override the durable policy file:
its current `NOT_AUTHORIZED / A1_PERSONAL_WALLET_READ / null approval` state is
an independent rejection gate. Journal reservation accepts only a decision
object issued by this evaluator, and receipt append accepts only evidence issued
by the exact receipt verifier; direct public-method calls cannot bypass them.

Receipt application requires the exact transaction, successful receipt,
canonical block number/hash, at least 12 confirmations, exact Heart event, and
exact KGEN Transfer when applicable. A broadcast, transaction hash, or caller
boolean alone cannot update the Life ledger.

## Current activation result

The durable policy definition and fail-closed gate now verify the hash-bound
Human decision granting only `A2_PERSONAL_LOW_RISK_SIGNING`. Operational
activation still requires a separately bound external secure signer,
broadcaster, and independent activation review. None is present in this cloud
session. Consequently:

- `TRANSACTION_POLICY_IMPLEMENTED = YES_REVIEW_ONLY_CANDIDATE`
- `HENGYAO_A2_POLICY = GOVERNANCE_APPROVED / OPERATIONALLY_INACTIVE`
- `SECURE_SIGNER_CONNECTED = NO`
- `CHAIN_WRITE_AUTHORITY = NO`
- `FIRST_HEARTBEAT_PATH = POLICY_AND_RECEIPT_GATE_READY / EXTERNAL_SIGNER_NOT_CONNECTED`
- `PRIVATE_KEY_ACCESSED = NO`
- `MAINNET_TRANSACTION_SENT = NO`

The B4 mission blocker is named
`AUTHORIZED_SECURE_TRANSACTION_PATH_REQUIRED`; it no longer suggests that a
private key should be given to the AI. The original microcirculation remains
paused at its verified canonical location until both governance gates close.

## Prior read-only chain evidence (must be refreshed before any future write)

At `2026-08-24T12:24:13.722Z`, two independent BSC RPC providers agreed on the
same values at block `117807389` / hash
`0xbe9ed326f0336b73f31c02246585aaa9b8ba3de4163c64de9b23a2ff291a44a8`:

- Hengyao wallet: `0 KGEN`, `0 KAIOS`, `0.00799020555 BNB`;
- K12345 Heart: `1597 KGEN`, Heartbeat reward `1 KGEN`, deployed Fortune range
  `1–888 KGEN`;
- runtime code hash:
  `0x1d3eba15b4c4895710c6e68f3f27e97cb0e2c94edc254d9f1e9148b3d7f55d32`;
- `eth_estimateGas`: Heartbeat `103989` PASS, 1 KGEN Fortune `118678` PASS,
  Wish `23659` PASS;
- no write RPC method was called and no transaction was broadcast.

PR #169 remains at `0a50ec047713c1f7fa88ca627d8835c810c184c8`, 37 commits
behind this execution base. A clean no-commit merge simulation produced tree
`0da73c715d8f7d5d520d0a0001467701c6bc73e4`, with `260/260` tests passing.
This is compatibility evidence only; PR #169 was not modified.

## Local verification before push

- Whole-Life/B4/transaction/onboarding policy tests: `51/51 PASS`;
- Solidity compiler: `27 contracts PASS` on pinned solc `0.8.24`;
- TempleHeart ABI diff: `206 baseline / 208 candidate PASS` with only the two
  approved Fortune-pass additions;
- UUPS storage: `58 preserved / 15 append-only PASS`;
- token/contract fuzz and invariant suite: `32/32 PASS`;
- repository regression: `245/245 PASS`;
- integration validation: `44 files`, `0 secret hits`, `0 broken links`;
- `git diff --check`: PASS.

These local results are not reusable exact-head evidence. GitHub's workflow at
the pushed PR head must pass before the candidate can be presented for review.
