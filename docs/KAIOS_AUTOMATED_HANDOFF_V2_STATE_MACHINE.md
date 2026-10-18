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

# Envelope and state-machine specification

All fields and transitions below are proposed contracts. No operational queue or authority is implemented. Extend `company/COMPANY_MESSAGE_STANDARD.md` rather than establishing a competing command source.

## Immutable logical message versus mutable processing state

The logical message is immutable. Delivery attempts, verification observations and work progress live in separate append-only ledgers and transactional projections. They are never written back into the originator's signed envelope.

| Immutable logical-message group | Required values and validation |
|---|---|
| Protected identity/routing | schema/version/type, Message ID, Work ID, correlation ID, causation/parent Message ID and digest, sender and intended recipient principal/binding references, authorized audience, issuer/key ID |
| Idempotency | Stable logical key scoped to repository, work, action, intended recipient principal and work revision; no transport attempt ID |
| Repository/scope | Project ID, repository owner/name and stable repository ID when available, base HEAD, expected work revision, scope, branch/PR reference and permitted artifact references |
| Immutable payload | For TASK: objective and requested bounded work. For RESULT: completed/blocked work, tests/CI exact-head references, artifact digests, security findings, next action and Human flag. For REVIEW: exact target digest/head and disposition. Later facts require new messages |
| Origin timing | Created, not-before and expires; policy identifier for allowed skew. No recipient/server acceptance time |
| Protected proof parameters | Canonical encoding version, digest/signature algorithm identifiers, payload digest, signing key/issuer and separate grant reference/digest. A referenced binding is claimed by the sender until independently verified |

### Digest and signature scope

Proposed encoding is UTF-8 JSON canonicalized with [RFC 8785 JCS](https://www.rfc-editor.org/rfc/rfc8785.html), accessed 2026-10-05. Reject duplicate keys, unsupported fields, invalid Unicode and unsafe numeric values before canonicalization; use strings for identifiers and values beyond the schema's safe integer range. Preserve strings without silent Unicode normalization. A reviewed conforming library is required later; this is not custom cryptography.

`payload_digest` covers the canonical typed payload (or exact immutable external bytes with declared media type). `message_digest` covers canonical protected headers plus `payload_digest`; the headers contain every identity/routing/idempotency/repository/scope/timing/grant parameter above. The digest and detached signature fields themselves are excluded to avoid circularity. Sign the domain-separated versioned protected representation with an approved signature suite; algorithm/key identifiers are protected and checked against policy. Persist the exact immutable message/proof bytes. Retries reuse them byte-for-byte. HTTP transport signatures can be renewed per attempt but cannot alter the logical message or its original proof.

### Append-only delivery and processing ledger

Separate records contain Message ID + message digest, attempt/event ID, previous event digest, sequence, actor verification reference, policy/registry snapshot revision, transport/endpoint, provider receipt, failure/retry schedule, ACK deadline, server observation time and accepted-work revision. Derived attempt count/current status are transactional projections of those records, not signed-message fields.

Only an authenticated adapter may append its transport observation, the intended recipient may produce its ACK, and the authorized coordinator may apply a legal work transition. A ledger entry's actor, record digest/signature or trusted service attestation and atomic state revision are independently validated. A relay cannot rewrite sender bytes, assert recipient acceptance or edit prior events. Corrections append a new attributable event; they do not overwrite history.

ACK is a new immutable recipient-authored message. Its payload binds the original Message ID, original message digest, Work ID, original requested revision, accepted revision, intended recipient binding, inbox commit reference and recipient acceptance time. ACK authentication has its own message digest, proof and expiry. The ledger links the verified ACK digest to the original message. A stored provider receipt is never an ACK.

A grant lives in the approved authorization system and specifies issuer, subject, audience, allowed actions/resources, expiry, revocation version and task binding. Copying a grant-like object into a message is not authorization. Message reporting fields such as `completed`, `security_pass` and `human_flag=false` cannot bypass verification or policy.

Message ID identifies immutable logical bytes. Correlation groups the workflow; causation identifies the immediate prior message. Retries preserve Message ID, idempotency key and payload; mutations require a new message/version with explicit supersession. Work ID persists across authorized repair cycles. A repeated key with changed bytes fails closed. Dedupe retention must outlast maximum replay/backup horizons or retain tombstones; expiry alone cannot safely free an old ID for a different effect.

## Delivery state is not work state

| Delivery transition | Authorized actor | Evidence and atomic guard |
|---|---|---|
| None → CREATED | Verified originator/coordinator with task scope | Validate source decision; commit immutable message and creation event |
| CREATED → QUEUED | Same state transaction/outbox owner | Durable outbox committed with work revision, not an in-memory enqueue |
| QUEUED → TRANSPORT_ACCEPTED | Adapter | Verified provider acceptance receipt; records only transport fact |
| TRANSPORT_ACCEPTED → DELIVERED | Recipient endpoint ingress or platform evidence verifier | Evidence of arrival at the specifically bound endpoint; if platform lacks it, state remains ACCEPTED/UNKNOWN |
| DELIVERED → AUTHENTICATED_ACK | Verified intended recipient | Signature plus fresh binding, exact Message ID/digest/Work ID/revision and durable inbox disposition |
| QUEUED/TRANSPORT_ACCEPTED/DELIVERED → RETRY_WAIT | Relay | Send failure, ambiguous send outcome or expired ACK deadline; persist uncertainty, reconcile provider receipt when possible, then retry the identical logical message within budget |
| DEAD_LETTER/QUARANTINED/CANCELLED → late evidence only | Evidence verifier/coordinator | Append a late-ACK/reconciliation event after authentication and correlation; never automatically reopen or execute work |
| RETRY_WAIT → QUEUED | Relay | Same immutable message, new attempt ID, due time and no terminal state |
| Any nonterminal → QUARANTINED | Validator/security policy | Invalid actor, signature, recipient, payload, replay mutation or revoked authority |
| Retry exhausted → DEAD_LETTER | Relay | Durable terminal reason and Human escalation record |

A late ACK after DEAD_LETTER preserves evidence that acceptance happened even though the sender exhausted its budget. Verify the receipt's historical acceptance against trusted inbox evidence and current access policy; do not trust a backdated sender timestamp. Record `LATE_ACK_RECONCILIATION_REQUIRED`, reconcile any result/effect already produced, and require an authorized state decision to resume or close. After cancellation/revocation, a historical ACK cannot revive authority. Invalid late input stays quarantined without overwriting prior state.

An authenticated ACK may arrive before a separate transport-delivered receipt. One transaction may record DELIVERED and ACK from the same verified recipient evidence; do not discard the ACK merely because notifications arrived out of order. A provider HTTP success or GitHub comment ID never substitutes for recipient acceptance. Broker ACK, application receipt ACK and work-completion result are three different events.

## Work transitions

| Transition | Actor and conditions |
|---|---|
| CREATED → READY | Authorized coordinator; complete scope, grant, base SHA, recipient/reviewer policy and budget |
| READY → CLAIMED | Intended authenticated worker through canonical atomic claim; compare revision, take lease, increment fence |
| CLAIMED → IN_PROGRESS | Current owner; valid grant, lease, fence and base |
| IN_PROGRESS → RESULT_SUBMITTED | Current owner; exact result head/artifact evidence, tests/CI and final report committed |
| RESULT_SUBMITTED → REVIEW_QUEUED | Coordinator; evidence integrity accepted, independent reviewer selected under declared policy, review-message outbox committed |
| REVIEW_QUEUED → REVIEW_IN_PROGRESS | Intended reviewer; authenticated review ACK, current review lease and target digest |
| REVIEW_IN_PROGRESS → REVIEW_ACCEPTED | Verified reviewer; exact-head disposition and required independence evidence |
| REVIEW_IN_PROGRESS → REPAIR_REQUIRED | Verified reviewer; bounded defects, same Work ID, new repair revision/fence and authorized scope |
| REPAIR_REQUIRED → READY | Coordinator; repaired assignment authorized, prior review preserved, new result must be re-reviewed |
| REVIEW_ACCEPTED → CLOSED | Authorized closer; all current technical/approval gates satisfied, current result matches review, close event recorded |
| Any active → BLOCKED | Owner/coordinator; typed blocker and resume precondition persisted |
| BLOCKED → prior eligible stage | Authorized coordinator; blocker resolved with evidence, revalidate identity/grants/SHA/fence |
| Any nonterminal → CANCELLED | Authorized cancelling principal; revoke outstanding work and fence owners |

CLOSED does not imply merged, deployed, paid or financially settled. Those are different explicitly authorized processes. A historical Human approval may remain valid only within its original exact scope; this transport must not widen it.

## Atomic transition algorithm

First authenticate the current caller and verify its permission to submit or retrieve evidence for this scope. Begin a database transaction and resolve inbox uniqueness by recipient principal plus Message ID/idempotency scope. If an accepted identical message already exists, return its stored historical disposition/ACK under the caller's current read permission, even when work revision has since advanced. Do not rerun its effect, renew its grant or reinterpret it as a current execution request. Expired/revoked execution authority does not erase a historical receipt; access may still be denied to an unauthorized caller. Same ID/key with a different digest is a conflict.

For a genuinely new effect, lock or compare-and-swap the work row at `expected_revision`; verify current trusted actor/action scope and fresh revocation state; reject an illegal from/to pair; enforce server time, expiry, current recovery epoch/fence, base/result and reviewer policy; atomically insert inbox/effect uniqueness, update state with revision + 1, append event sequence + 1 and insert resulting outbox intent. Commit all or none. A concurrent uniqueness/revision conflict causes reread and duplicate/stale classification or a bounded whole-transaction retry. Never blindly replay external effects.

Event ordering is commit sequence, not worker clock. A claimed result must reference the latest allowed revision. On main movement, classify the diff: an explicitly verified unchanged task scope can be recorded as compatible under policy; relevant or unknown changes cause `STALE_BASE_BLOCKED`, fresh validation and a new authorized revision. Never rewrite an old base SHA in place to make stale work look current.

## ACK/NACK contract

An ACK states “this identified recipient durably accepted this message at this work revision,” not “the task succeeded.” It includes ACK ID, original Message ID/digest, Work ID, recipient binding, inbox commit reference, server acceptance time and authentication evidence. Duplicate identical ACKs are idempotent; conflicting ACKs quarantine. Unauthenticated ACK text cannot advance state.

A NACK has typed retryability and reason: `BUSY_RETRY_AFTER` may be retried within budget; `WRONG_RECIPIENT`, `UNAUTHORIZED`, `UNSUPPORTED_SCHEMA`, `STALE_BASE` and `REVOKED` require rejection or resolution. A result and review are new authenticated message types with their own IDs and dedupe rules.

## Required fault tests for any later prototype

Wrong recipient; unknown or duplicate instance; duplicate message; duplicate ACK; changed payload under the same key; forged sender/ACK/reviewer; expired/revoked credential; stale base or substituted result head; same builder/reviewer/controller; out-of-order ACK; nonmonotonic client time; crash before/after each transaction and external call; expired owner writing after work steal; lost ACK; retry-budget exhaustion/DLQ; backup restore replay and rolled-back fencing counters; late ACK after DLQ/cancellation; duplicate after work revision advances; malformed/prompt-injected input. Tests must assert no unauthorized effect and inspect durable rows/events after restart, not just return strings.
