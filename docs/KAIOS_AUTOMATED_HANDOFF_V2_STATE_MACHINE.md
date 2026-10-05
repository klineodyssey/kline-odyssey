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

# Envelope and state-machine specification

All fields and transitions below are proposed contracts. No operational queue or authority is implemented. Extend `company/COMPANY_MESSAGE_STANDARD.md` rather than establishing a competing command source.

## Typed immutable envelope

| Group | Required values and validation |
|---|---|
| Identity | schema/version, Message ID, Work ID, correlation ID, causation/parent Message ID, sender and exact recipient Life/Worker/Instance/Session/controller binding references, issuer/key ID |
| Idempotency | Stable logical idempotency key scoped to repository, work, action, recipient principal and revision; separate attempt ID for each transport attempt |
| Repository | Project ID, repository owner/name plus stable repository ID when available, base HEAD, expected work revision, branch/PR reference, scope and permitted artifact references |
| Work report | Objective, completed work, blocked work, tests with command/result/head, CI run/job/head references, artifact IDs/digests, security findings, next action and Human-decision-needed flag |
| Timing | Created, not-before, expires, recipient-accepted and server-recorded times where applicable; time source and allowed skew policy |
| Authenticity | Payload digest, canonical encoding version, signature/attestation reference, verified principal snapshot and policy/registry revision |
| Delivery | Transport type, endpoint binding, provider receipt/delivery ID, attempt count, next attempt, last failure, ACK deadline and independent application ACK evidence |
| Result/review | Result head and immutable artifact digests, review target digest/head, reviewer binding/independence outcome and disposition |
| Authorization reference | Reference/digest to a separately verified grant or Human decision; no arbitrary task-text grant fields are executable |

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
| Accepted/delivered → RETRY_WAIT | Relay | Transient failure or expired ACK deadline; no valid ACK; persisted retry budget allows another attempt |
| RETRY_WAIT → QUEUED | Relay | Same immutable message, new attempt ID, due time and no terminal state |
| Any nonterminal → QUARANTINED | Validator/security policy | Invalid actor, signature, recipient, payload, replay mutation or revoked authority |
| Retry exhausted → DEAD_LETTER | Relay | Durable terminal reason and Human escalation record |

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

Begin a database transaction; lock or compare-and-swap the work row at `expected_revision`; verify the current trusted actor and action scope; reject an illegal from/to pair; enforce server time, expiry, fence, current base/result and reviewer policy; insert the inbox/effect uniqueness record; update state with revision + 1; append an event with sequence + 1; insert any resulting outbox intent; commit. On conflict, reread and decide whether this is a duplicate, stale request or bounded transaction retry. Do not blindly replay side effects.

Event ordering is commit sequence, not worker clock. A claimed result must reference the latest allowed revision. On main movement, classify the diff: an explicitly verified unchanged task scope can be recorded as compatible under policy; relevant or unknown changes cause `STALE_BASE_BLOCKED`, fresh validation and a new authorized revision. Never rewrite an old base SHA in place to make stale work look current.

## ACK/NACK contract

An ACK states “this identified recipient durably accepted this message at this work revision,” not “the task succeeded.” It includes ACK ID, original Message ID/digest, Work ID, recipient binding, inbox commit reference, server acceptance time and authentication evidence. Duplicate identical ACKs are idempotent; conflicting ACKs quarantine. Unauthenticated ACK text cannot advance state.

A NACK has typed retryability and reason: `BUSY_RETRY_AFTER` may be retried within budget; `WRONG_RECIPIENT`, `UNAUTHORIZED`, `UNSUPPORTED_SCHEMA`, `STALE_BASE` and `REVOKED` require rejection or resolution. A result and review are new authenticated message types with their own IDs and dedupe rules.

## Required fault tests for any later prototype

Wrong recipient; unknown or duplicate instance; duplicate message; duplicate ACK; changed payload under the same key; forged sender/ACK/reviewer; expired/revoked credential; stale base or substituted result head; same builder/reviewer/controller; out-of-order ACK; nonmonotonic client time; crash before/after each transaction and external call; expired owner writing after work steal; lost ACK; retry-budget exhaustion/DLQ; backup restore replay; malformed/prompt-injected input. Tests must assert no unauthorized effect and inspect durable rows/events after restart, not just return strings.
