---
VERSION: "0.2.0-design"
REVISION: "2026-10-05.1"
STATUS: "RESEARCH_DESIGN_DRAFT_NOT_OPERATIONAL"
LAST_UPDATED: "2026-10-05"
UPDATED_BY: "dot (temporary external maintainer)"
REVIEWED_BY: "NOT_YET_REVIEWED"
SOURCE_COMMIT: "27a21b031afad333468d9d3847d1933bc053487e"
TASK_ID: "KAIOS-AUTOMATED-HANDOFF-V2-RESEARCH-20261005"
CHANGE_REASON: "Human-requested research and design; no operational authority."
ANCESTOR: "company/COMPANY_MESSAGE_STANDARD.md; historical PR #177"
SOURCE_OF_TRUTH: false
---

# KAIOS Automated Handoff V2: research and design

## Decision summary

Recommend a provider-neutral, durable handoff protocol with authenticated identities, application-level acknowledgments, an atomic inbox/outbox, and explicit review policy. GitHub remains code/specification canon and a reviewable evidence projection. It is not, by itself, a worker identity authority, transactional work queue, or proof that a recipient has accepted work.

This package is a design proposal. No credential, worker enrollment, paid service, scheduler, live queue, external AI conversation, deployment, or company authority runtime is created. The initial future demonstration is nonfinancial and off-chain. Mainnet, Treasury, payroll, real assets, KYC, production keys and governance execution are excluded. K11520 product engineering retains priority.

## BOOT, MUST READ and protected-path check

Research baseline: main `27a21b031afad333468d9d3847d1933bc053487e`, fetched 2026-10-05. Read current Boot, AGENTS, current Physics and map, Canon/library navigation, workspace policy, generic worker and lease protocols, protected paths, company message/dispatcher proposals, current Boot CLI and backend boundaries. Work is under the Human's temporary dot external-maintainer exception, not a claim as a registered Life/Worker, Codex manager, Cursor employee or T5 identity. No registry is changed.

The six requested V2 filenames identify this research package, not new active Runtime versions. Existing ownership is preserved. Protected Boot, Runtime CURRENT, maps, contracts, registries and all program files remain unchanged.

## Repository evidence and PR #177 disposition

Historical input: [PR #177](https://github.com/klineodyssey/kline-odyssey/pull/177), head `ab6d5137801c8b83a7b6c1fa97e9ba3a6eb6c813`, one commit, seven changed paths, 1,014 commits behind the research baseline. Do not refresh, repair, merge or transplant it. Its 83 passing tests demonstrate local validator behavior, not authenticated production delivery.

Independent local audit reproduced these counterexamples against that head:

| Observation | Consequence for V2 |
|---|---|
| A fabricated registry and fabricated whole actor chain reach REVIEWED | Registry trust must originate outside the message; self-consistent fields are not identity proof |
| Repeated validation leaves replay maps unchanged | A durable transaction must own deduplication, not caller-supplied maps |
| Different instance of the same Life/Worker passes review | Independence must compare authenticated principals and controllers |
| Unrelated active instance advances DELIVERED | Each transition needs actor and recipient binding |
| A 2020 review after 2026 events is accepted | Trusted server sequence/time and bounded freshness must be enforced |
| Arbitrary existing parent key with a non-hash value passes | Parent and correlation references must resolve immutable content and scope |
| Rewriting and rehashing the whole history passes | Unkeyed hashes detect accidental mutation, not a malicious author replacing history |
| Self-grant-shaped payload passes structural validation | Payload is data; structural acceptance grants no actual capability |
| Audit invokes message validation without parent maps | Legitimate non-null REPLY_TO fails aggregate audit; reference resolution must be consistent |

Audit code locations: historical `validators.py` lines 141–176, 228–248 and 272–296 in the PR's `company_boot` implementation. The audit worker ran isolated reproductions without services or credentials. Reproduction evidence will be linked from the PR review record; these findings are not permission to activate a replacement.

Current main already contains the company model in `core/company/index.mjs`, including a distinct worker/Life/controller comparison. These remain caller-supplied planner facts, not authenticated principal bindings. `KGEN-KAIOS/governance/agents/runtime-v0.1/README.md` explicitly labels its current CLI a local prototype, with scheduler, automatic dispatch and Cursor dispatch not approved. `company/COMPANY_MESSAGE_STANDARD.md` already defines correlation, causation, idempotency, expiry and evidence; `company/COMPANY_DISPATCHER.md` reserves an atomic claim authority and disables automatic dispatch pending cutover. V2 refines these seams rather than creating a second dispatcher.

[PR #492](https://github.com/klineodyssey/kline-odyssey/pull/492), observed draft head `b601715c97320aa0a881da8fdc52888d9abb8934`, owns related handoff metadata in `core/company/index.mjs` and `tests/autonomous-company-engineering-cycle.test.mjs`. Its all-false authority flags are useful. A caller-provided reviewer source enum or matching CI-head field is structural evidence only. Reconcile its latest status before any implementation.

[PR #489](https://github.com/klineodyssey/kline-odyssey/pull/489) is merged and provides game-backend primitives: revision transactions, fixed-request idempotency, immutable objects, backup/recovery and diagnostic queue boundaries. Reuse contracts and failure lessons only after separate integration review. Player Account authentication is not Worker identity; game ownership, wallet signatures, realtime room presence and employee authority are distinct.

## Audit classification and reproducibility

- **WHAT_177_GOT_RIGHT:** existing Boot owner reuse, explicit no-transport/no-scheduler boundaries, exact envelope keys, immutable content hashes, typed states and negative tests. Hashes remain useful integrity evidence.
- **WHAT_177_GOT_WRONG:** unauthenticated actor/registry input, nonconsuming replay maps, weak parent references, missing chronology, fabricated delivery/review and whole-chain rewrite acceptance. These are blockers to trusted automation, not evidence the pure validator executed a protected action.
- **WHAT_TO_REUSE:** concepts and current-owner seams, not the historical implementation bytes. Reuse typed contracts, exact SHAs, deny-by-default effects and structural tests with stronger authenticating/durable boundaries.
- **WHAT_TO_REDESIGN:** external trust bootstrap, durable atomic dedupe/effect state, actor-bound transitions, fence enforcement, actual transport/ACK, exact-head review and independent controller verification.
- **WHAT_IS_OBSOLETE_OR_NOT_EXISTING:** none of #177's seven modified blobs entered main; all match their merge-base versions on the research baseline. Proposed instance/message/capability registries are DESIGNED_NOT_ENABLED, not live services. Open draft #191's related attestation design is not an operational dependency.

Pinned source evidence: [historical validator](https://github.com/klineodyssey/kline-odyssey/blob/ab6d5137801c8b83a7b6c1fa97e9ba3a6eb6c813/KGEN-KAIOS/governance/agents/runtime-v0.1/src/company_boot/validators.py#L141-L296), [historical no-transport boundary](https://github.com/klineodyssey/kline-odyssey/blob/ab6d5137801c8b83a7b6c1fa97e9ba3a6eb6c813/KGEN-KAIOS/governance/agents/KAIOS_AI_AGENT_HANDOFF_PROTOCOL_V1.md#L89-L143), [current distinctness check](https://github.com/klineodyssey/kline-odyssey/blob/27a21b031afad333468d9d3847d1933bc053487e/core/company/index.mjs#L2027-L2036), [current backend interfaces](https://github.com/klineodyssey/kline-odyssey/blob/27a21b031afad333468d9d3847d1933bc053487e/KAIOS/backend/src/primitives.mjs#L58-L85), [designed-not-enabled registries](https://github.com/klineodyssey/kline-odyssey/blob/27a21b031afad333468d9d3847d1933bc053487e/KGEN-KAIOS/governance/agents/KAIOS_AI_AGENT_LIFE_ARCHITECTURE_V1.md#L103-L120).

Reproduce the historical original suite in an isolated archive of that exact head: from `KGEN-KAIOS/governance/agents/runtime-v0.1`, run `PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=src python -m unittest discover -s tests -q`. Observed 83/83 pass. For the counterexamples, use its valid fixture; vary only the actor tuple/registry, replay maps, time, parent map or payload described above and recompute its public hashes. The separately executed audit retains the exact reproduction script/results; no runtime from it is added here. Fresh API review checks found no submitted review, review thread, commit status or returned PR-triggered workflow run for #177; this is not an exhaustive all-event check-suite inventory.

The backend architecture's old wallet-session API table conflicts with its current security boundary; Worker-auth conclusions rely on current implementation and security remediation, not that stale table.

## Current primary-source research

All links below were accessed on **2026-10-05**. Vendor features are documented capabilities, not proof that this repository has configured them. The proposed KAIOS choices in the companion documents are design judgments, not copied vendor architectures.

| Source | Finding and design consequence |
|---|---|
| [AWS transactional outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html) | Commit business state and outbound intent together; relays can duplicate, so consumers still need idempotency |
| [AWS retry/backoff](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/retry-backoff.html) | Retry transient failures with increasing delays; V2 additionally imposes a total age, attempt and cost budget |
| [AWS SQS visibility](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html) | Visibility is temporary exclusion, not proof an expired worker stopped; application fencing remains necessary |
| [Google Pub/Sub exactly-once](https://docs.cloud.google.com/pubsub/docs/exactly-once-delivery) | Its guarantee is scoped to pull subscriptions and a region; publisher duplicates remain possible. It does not make arbitrary external effects exactly-once |
| [Azure settlement and locks](https://learn.microsoft.com/en-us/azure/service-bus-messaging/message-transfers-locks-settlement) | Broker send acceptance, receiver completion and lock renewal are separate. Lost settlement can leave the sender uncertain |
| [Azure duplicate detection](https://learn.microsoft.com/en-us/azure/service-bus-messaging/duplicate-detection) | Broker deduplication uses message identity within a configured history window; it cannot replace a durable application effect ledger |
| [Cloudflare delivery](https://developers.cloudflare.com/queues/reference/delivery-guarantees/) and [DLQ](https://developers.cloudflare.com/queues/configuration/dead-letter-queues/) | At-least-once processing needs duplicate handling; configure dead-letter handling rather than assume exhausted messages remain recoverable |
| [PostgreSQL SELECT](https://www.postgresql.org/docs/current/sql-select.html) and [isolation](https://www.postgresql.org/docs/current/transaction-iso.html) | Row locks and SKIP LOCKED can support queue consumers; inconsistent skipped-row views are not general business truth. Serialization conflicts need whole-transaction retry |
| [IETF RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html) | Covered components, key resolution, created/expires and nonce checks matter. A valid signature only establishes control of a trusted key within its verified scope |
| [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html) | Authentication lifecycle, replay resistance and authenticator invalidation inform the design. This human-authentication guidance does not certify our proposed machine-worker authority |
| [OWASP prompt-injection prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) | Separate instructions from retrieved content, constrain tools and validate outputs. No prompt-only defense is treated as an authorization boundary |
| [GitHub webhook practice](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks) and [validation](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries) | Validate delivery authenticity, record delivery IDs and handle missed deliveries. A GitHub delivery signature authenticates GitHub's payload, not a KAIOS worker's acceptance |
| [GitHub REST practice](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api) | Prefer conditional requests and honor rate-limit responses. V2 uses incremental SHA checkpoints and bounded reconciliation |
| [GitHub Actions OIDC](https://docs.github.com/en/actions/concepts/security/openid-connect) | Job-bound short-lived tokens can reduce stored credentials, but trust conditions must bind the exact repository/workflow/context. Nothing is provisioned by this design |

## Package and decisions

- [Identity model](KAIOS_AUTOMATED_HANDOFF_V2_IDENTITY_MODEL.md): principal hierarchy, trust bootstrap, revocation and independence.
- [Architecture](KAIOS_AUTOMATED_HANDOFF_V2_ARCHITECTURE.md): owners, durable transactions, recovery and demo acceptance.
- [State machine](KAIOS_AUTOMATED_HANDOFF_V2_STATE_MACHINE.md): message/work states, actors and atomic guards.
- [Transport matrix](KAIOS_AUTOMATED_HANDOFF_V2_TRANSPORT_MATRIX.md): verified platform features versus unconfigured KAIOS adapters.
- [Threat model](KAIOS_AUTOMATED_HANDOFF_V2_THREAT_MODEL.md): attacks, tests and residual risk.
- ADRs 001–008 in this same docs directory record identity, transport, delivery, inbox/outbox, independent review, escalation, GitHub canon and cost choices. All are PROPOSED, not approved operational policy.

## Registration gap and minimum proposed Boot change

AGENTS, “Permanent KGEN work rules” item 6, requires every new file in Boot, KGEN index documents and README. Its later “Prohibited without explicit user approval” section and `KGEN-Agent-Office/DO_NOT_TOUCH.md` prohibit changing Boot without an explicit Boot request. Existing `docs/KGEN_MASTER_INDEX.md` backend/Portal sections demonstrate candidate indexing while Boot stays protected.

This package registers its full paths/purposes in the existing master index and README. The remaining Boot gap is deliberately disclosed. The smallest future authorized change is one cumulative section, “Automated Handoff V2 research inventory,” containing the same fourteen path/purpose rows and the sentence: “Research/design only; no identity issuance, worker registration, dispatch, Runtime activation, deployment or production authority.” Preserve all current Boot text and ancestors. No new bootstrap or authority metadata is needed.

## Execution and review readiness

This stage changes Markdown only. No prototype was implemented or run as V2. Documentation validation checks inventory, local links, required topics, unchanged protected paths and whitespace. Existing #177 tests are historical audit evidence only. Exact branch head and CI are recorded in the Draft PR, outside self-referential source metadata.

Research is complete enough for design review; integration and demonstration are blocked on approved identity bootstrap, real addressable recipient/reviewer endpoints, authenticated controller bindings and durable infrastructure selection. Do not report real delivery, recipient ACK, independent review, zero-copy-paste operation or production readiness until their evidence exists.
