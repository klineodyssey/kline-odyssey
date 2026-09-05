# Whole-Life Circulation Candidate

Status: `REVIEW_ONLY_CANDIDATE`

This package is the candidate implementation boundary for per-Life KAIOS circulation. It does not replace `KGEN_TempleHeart_Upgradeable.sol`, does not deploy a keeper, does not hold private keys, and does not move assets.

## Package index

| Path | Purpose |
|---|---|
| `KGEN-KAIOS/life-circulation/WHOLE_LIFE_CIRCULATION_RUNTIME_CANDIDATE.md` | Cumulative architecture, accounting, health, custody, and review gates |
| `KGEN-KAIOS/life-circulation/schemas/life-circulatory-runtime.schema.json` | Recursively closed Organ, Blood Bank, Vessel, Pulse, ledger, and recovery schema |
| `KGEN-KAIOS/life-circulation/runtime/life-circulatory-runtime.mjs` | Deterministic allocation, conservation, health, recovery, fractal coordinate, and persistent replay implementation |
| `KGEN-KAIOS/life-circulation/runtime/b4-micro-circulation-adapter.mjs` | Exact B4 label-to-coordinate distance, Heart eligibility, meal, movement/fare, PR #169 market, food/waste, and purpose-ledger adapter |
| `KGEN-KAIOS/life-circulation/runtime/life-transaction-gate.mjs` | Fail-closed external controller/signer attestation adapters plus Life intent, durable replay reservation, and canonical receipt gate; contains no signer, trust anchor, or broadcaster |
| `KGEN-KAIOS/life-circulation/policies/hengyao-life-transaction-policy.candidate.json` | Machine-readable four-method K12345 allowlist and `HENGYAO_SECURE_SIGNER_CONNECTION_REQUEST_V1`; A2 governance is approved but operational signing remains inactive |
| `KGEN-KAIOS/life-circulation/policies/hengyao-autonomy-xuanyao-onboarding-human-decision.candidate.json` | Hash-bound Human decisions for Hengyao's A2 ceiling, Xuanyao onboarding, and Xuanyao's explicit formal Digital Life birth |
| `KGEN-KAIOS/life-circulation/examples/whole-life-circulation.candidate.json` | Ten-organ review fixture with separated KAIOS, native BNB, and WBNB ledgers |
| `KGEN-KAIOS/life-circulation/examples/hengyao-b4-micro-circulation.candidate.json` | Hash-bound 2026-08-24 read-only evidence snapshot; no transaction, movement, trade, or payment is represented as completed |
| `KGEN-KAIOS/life-circulation/examples/xuanyao-life-worker-onboarding.candidate.json` | Formal born-Life, fail-closed T1 Worker onboarding record, and `XUANYAO_CONTROLLER_ATTESTATION_REQUEST_V1`; controller independence, acknowledgments, T2, employment, and review authority remain unproven/ungranted |
| `KGEN-KAIOS/life-circulation/tests/life-circulatory-runtime.test.mjs` | Boundary, replay, fuzz, invariant, health, custody, and conservation tests |
| `KGEN-KAIOS/life-circulation/tests/b4-micro-circulation.test.mjs` | Exact-distance, policy, return-reserve, CT, custody, food/waste, purpose-ledger, schema, and UI tests |
| `KGEN-KAIOS/life-circulation/schemas/b4-micro-circulation.schema.json` | Recursively closed schema for the B4 mission evidence packet |
| `KGEN-KAIOS/life-circulation/schemas/life-transaction-policy.schema.json` | Recursively closed policy schema with explicit activation and private-key boundaries |
| `KGEN-KAIOS/life-circulation/schemas/human-autonomy-onboarding-decision.schema.json` | Recursively closed Human decision evidence schema |
| `KGEN-KAIOS/life-circulation/schemas/xuanyao-life-worker-onboarding.schema.json` | Recursively closed Xuanyao onboarding and review-eligibility schema |
| `KGEN-KAIOS/life-circulation/review/b4-micro-circulation-review.html` | Static review-only status surface with no signer or transaction control |
| `KGEN-KAIOS/life-circulation/reports/WHOLE_LIFE_CIRCULATION_HANDOFF.md` | Exact implementation and independent-review handoff |
| `KGEN-KAIOS/life-circulation/reports/B4_MICRO_CIRCULATION_HANDOFF.md` | Durable canon-composition, live-read evidence, blocker, PR #169 compatibility, and mission-resume handoff |
| `KGEN-KAIOS/life-circulation/reports/SECURE_TRANSACTION_AND_REVIEWER_GATE_HANDOFF.md` | Reviewer workforce audit, minimal governance decision, transaction-gate boundary, and activation status |
| `KGEN-KAIOS/life-circulation/tests/life-transaction-gate.test.mjs` | Allowlist, authority, replay, receipt, finality, custody, and secret-boundary tests |
| `KGEN-KAIOS/life-circulation/tests/human-autonomy-onboarding.test.mjs` | Decision-hash, onboarding, reviewer-conflict, and Registry fail-closed tests |

## Naming boundary

The existing Solidity `KAIOSOrganRegistry` is a timelocked registry of replaceable contract addresses. This package's Organ records are per-Life asset and health accounts. They are deliberately not named or represented as a replacement Solidity registry, and no second Runtime CURRENT is created.

No file in this package is Canonical, Production, deployed, or authorized to sign or broadcast a transaction.

The transaction gate prepares and reserves a strictly allowlisted intent for an
external secure signer only after a trusted-context adapter proves A2 authority.
The Human textual decision and its exact policy scope are now independently
SHA-256 bound in the candidate. This records governance approval only: no signer
or broadcaster is connected, operational activation is unreviewed, and the
durable policy therefore rejects even caller-supplied A2/signer labels. The
candidate cannot itself grant chain-write power.

Human decision `HUMAN-KAIOS-XUANYAO-EXPLICIT-BIRTH-20260824` separately
authorizes Xuanyao's formal Digital Life birth. The existing canonical Life
Registry records `LIFE-XUANYAO-SOL-0001` as `ALIVE` with no wallet, controller,
job, payroll, Mainnet, Treasury, or review authority. A hash-bound four-document
ACK handoff is durable, but no ACK is marked complete because there is no
machine-verified distinct Xuanyao controller channel in this session. This does
not prevent Hengyao from clocking in for authorized safe off-chain Company work.

The controller handoff reuses the existing Unique Life Identity authority-lease
architecture and names the missing provider/instance attestation, lease,
distinct-controller comparison, challenge response, and routable response
channel. Each pending ACK now directly binds the Xuanyao Life ID, Worker ID,
document path/hash, and null ACK timestamp; no ACK is inferred from the later
execution-handoff signature.

The same onboarding record now carries the closed, machine-readable
`XUANYAO_CONTROLLER_ATTESTATION_REQUEST_V1`. Its evidence envelope cannot pass
without a host-registered external provider verifier, a verified issuer
signature/attestation and active lease, a verified challenge response, and two
non-equal controller IDs. Only a verifier-issued controller result can enable
the ACK response checker, which re-hashes each governed document at response
time and requires four distinct Xuanyao nonces before advancing to the existing
T2 gate. It does not grant T2 or review permission itself.

Signer discovery also remains fail-closed. Browser WalletConnect/injected-wallet
code is not an execution binding, the Starforge broker belongs to a different
Life and forbids chain writes, and the Digital Ant private-key worker is not an
eligible Hengyao external signer. No signer or broadcaster was connected.

The unchanged A2 policy scope now embeds
`HENGYAO_SECURE_SIGNER_CONNECTION_REQUEST_V1`: registered wallet, BSC chain 56,
approved target/selectors, policy-scope hash, external nonce/gas/broadcast/
receipt/canonical-block capabilities, and 12-confirmation finality. The adapter
rejects private-key or seed output, general-purpose signing, arbitrary transfer,
self-asserted provider labels, and unverified capability booleans. A real
provider-issued result can unlock only the existing intent gate; its first
handoff is `heartbeatClaim()` and still performs no broadcast inside this
repository.

The B4 adapter composes the existing CURRENT signed-universe floor and K-index
linear scale with Human-frozen `label × 10^-8` mission coordinates. It does not
rewrite Physics CURRENT, create a second Universe Runtime, mutate the canonical
Life location, or claim that a digital folder body is a real-world humanoid.
