---
VERSION: "0.2.0-design"
REVISION: "2026-10-05.2"
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

# Durable handoff architecture

## Scope and component ownership

Research-only proposal; no daemon, endpoint, queue, identity service or runtime is added. Extend the existing company message, dispatcher, claim and evidence owners after approval. Reconcile #492 before implementation. The dispatcher may observe, validate routing metadata, route, track, retry within budget and escalate. Engineering, repository writes, merge or external actions require separately granted capability; task prose never supplies it.

The proposed flow is:

Authorized work record → transactional outbox → transport adapter → authenticated recipient inbox → claimed work/result → reviewer inbox and ACK → review disposition → authorized close.

A durable relational authority stores work revisions, inbox/outbox, leases, dedupe outcomes and append-only audit events. Immutable object storage holds larger permitted evidence. A queue is a wakeup/transport mechanism. GitHub stores source, specifications and sanitized projections. Realtime/presence and chat tabs are notifications, not durable truth. RAM-only demonstrations cannot establish crash safety.

## Records and atomic boundaries

- **Work:** Work ID, project/repository, source decision/grant reference, scope, expected base HEAD, revision, lifecycle, owner binding, lease/fence, reviewer policy, result references, budgets and expiry.
- **Message:** immutable signed logical envelope and payload digest with Message ID, correlation/causation IDs, idempotency key, claimed sender/recipient binding references and expiry. Attempt IDs, transport receipts, verification snapshots and acceptance times belong to separate append-only delivery/processing records. See the state-machine digest/ACK contract.
- **Outbox:** unique message intent, transaction/revision, next-attempt time, attempt count, transport receipt, ACK deadline and terminal reason. Do not delete accepted-but-unacknowledged records.
- **Inbox:** unique recipient-principal + Message ID, scoped idempotency key, payload digest, authenticated binding snapshot, disposition and stored ACK/result reference.
- **Event:** monotonically increasing per-work sequence, prior revision/event digest, actor verification reference, before/after state, server time and effect evidence. Append-only permissions plus independently retained checkpoints provide tamper evidence; a hash chain alone cannot stop an administrator replacing everything.

Transaction A authorizes a legal work transition, increments its revision, appends the audit event and inserts its outbound intent in the same database commit. If any step fails, nothing commits. A relay publishes committed intents only. A crash after publish but before receipt persistence causes an identical-message retry, never a new business request.

Transaction B verifies admission then atomically inserts inbox dedupe state and records the accepted local effect/claim plus its ACK outbox and event. Duplicate identical content returns the stored disposition. Same ID/key with different content is a security conflict. An inbox marker must not commit before its associated local effect, or a crash would lose work permanently.

An external effect cannot generally share this database transaction. Use a recipient-supported idempotency key and durable effect ledger; persist intent before the call, reconcile ambiguous outcomes by querying the external operation, then persist the result. If the endpoint cannot reconcile or deduplicate, stop at `EFFECT_OUTCOME_UNKNOWN` for Human resolution. Do not claim universal exactly-once effects.

## Leases, heartbeat and fencing

Claim acquisition is one compare-and-swap transaction against current work revision, eligible state, approved claimant binding and absence/expiry of the existing lease. Use a fence tuple `(recovery_epoch, lease_counter)` and increment the counter on every ownership change within the active epoch. Every sink requires the exact active epoch plus current counter. Heartbeats renew only a still-current, unexpired lease with the exact owner/fence; they provide liveness hints, never work-completion proof.

Every effect sink and result acceptance checks the current fence. A process paused beyond lease expiry cannot resume writes after another owner claims the work. Database row locks are short transaction tools, not long-lived network-work locks. Work stealing is an authorized reassignment after expiry/revocation, not a worker editing ownership fields. If any downstream effect cannot enforce fencing, do not enable concurrent takeover for that effect; quarantine/reconcile instead.

Proposed demo parameters: 120-second lease, 30-second heartbeat, server time, maximum 30-second authentication clock skew. These are tunable test assumptions, not measured production SLOs. Lease expiry and transport ACK timeout are separate. Recovery fences the old owner and preserves review custody; timeout never self-closes work.

## Retry, dead letters and recovery

Persist attempts before scheduling. For retryable transport failures use full jitter in `[0, min(300s, 2s × 2^attempt)]`; honor larger provider Retry-After values only within the total deadline. Proposed demo cap: eight attempts, 30-minute delivery age and one active dispatch per work. Schema/auth/revocation/wrong-recipient failures are terminal quarantine, not transient retries. Auth refresh follows its approved lifecycle, never credential creation by retry.

Exhausted work enters a durable DLQ with original IDs, sanitized reason, timestamps, last receipt and next responsible party. Human-authorized redrive uses the same immutable logical message and a new attempt ID after the cause is fixed; revoked/stale work requires a new authorized revision rather than replaying it. Never endlessly loop DLQ to source queue.

Backups must include work, outbox, inbox, effect ledger, leases, events and schema/policy checkpoints at a consistent revision. Object blobs are immutable and digest-addressed. Recovery revalidates current revocations/grants, changes the recovery epoch, fences all restored in-flight ownership and reconciles possibly delivered messages before replay. Do not restore stale credentials or resurrect expired grants. A restore drill must prove no accepted effect is duplicated or silently lost.

### Rollback-safe recovery epoch and missing-tail reconciliation

A restored database must not reissue an old fence counter. Allocate a new recovery epoch from an approved non-rollback authority/high-water checkpoint outside the restored snapshot's failure domain; bind it to the restore event and install it at every effect sink before admitting work. Each sink rejects all prior epochs regardless of their numeric lease counter. Do not merely increment a counter recovered from an old backup. No such authority is configured by this proposal.

Before resume, compare snapshot sequence/dedupe/effect watermarks with an independently retained current journal, recipient inbox receipts and external operation records. Reconstruct events and accepted effects newer than the snapshot, preserving original IDs and duplicate outcomes. Queue retention alone is not a complete effect journal. If the tail, current revocation state or non-rollback epoch cannot be established, remain `RECOVERY_UNCERTAIN_BLOCKED`; do not claim a zero-loss restore or retry ambiguous work. Never erase a newer accepted effect because it is absent from the backup. Recovery drills must include successful work after snapshot creation, then restoration of that older snapshot and attempted stale-owner writes.

## Safe #489 seams

`KAIOS/backend/src/primitives.mjs` defines database atomic statements, immutable object storage, realtime commands and queue send. `adapters/local.mjs` uses SQLite transactions; `adapters/cloudflare.mjs` uses D1 batches. A later implementation may reuse portable interfaces and transaction-test methods with separate worker-domain authorization, tables/namespaces and ownership review. A queue `send` result is not recipient ACK. Game `account_lives`, Player sessions and wallet proof are prohibited Worker-auth shortcuts. Realtime room presence is not authenticated company liveness. No parallel game or company runtime is proposed.

## First real demonstration and acceptance

The future demonstration uses a harmless repository-document review task with a fixed base SHA:

1. dot originates a bounded authorized Work ID and durable outbound message to one preverified real recipient endpoint.
2. The actual recipient validates and durably accepts it, then returns its own authenticated ACK bound to Message ID, digest, recipient identity, Work ID and revision.
3. The recipient returns a result tied to exact commit/artifact hashes and current fence; a test harness cannot impersonate it.
4. A preverified independent reviewer receives a review request, emits its own ACK, examines the exact result and returns an authenticated disposition.
5. The authorized coordinator closes the work with linked evidence, without either the Human or an operator copying task/report text between endpoints.

Measure copy/paste events as zero, distinct actual endpoint participation, verified identities/controllers, both ACKs, durable crash recovery, result integrity and review/close events. Merely posting a PR comment, calling an internal child, receiving a delivery receipt or running fake workers does not complete this demonstration.

Current status: `DEMO_NOT_RUN`; recipient endpoint capability, trust bootstrap and independent reviewer bindings are unverified. If those remain unavailable, report the exact blocked stage. A local simulated protocol test may be useful later but must remain `SIMULATION_ONLY`, never “real employee delivery.”

Before a later prototype, review this package, resolve ownership with #492, select one storage/adapter seam and obtain bounded implementation approval. Before operational use, additionally approve identity administration, endpoint grants, secure deployment, recovery drills, monitoring, cost limits and risk classification. Medium/high-risk company authority is never self-declared production.
