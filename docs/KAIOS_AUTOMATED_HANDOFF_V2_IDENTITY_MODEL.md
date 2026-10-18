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

# Identity, authorship and independent review

## Five different identifiers

| Identifier | Meaning | Does not prove |
|---|---|---|
| Life ID | Canonical organizational identity, if one has been legitimately enrolled | Current process, credential possession, employment permission or controller independence |
| Worker ID | Registered operational principal/role assignment linked by approved policy to a Life | That a textual sender field was authored by that worker |
| Instance ID | One concrete execution incarnation, newly bound at startup | A new independent person, worker or controller |
| Session ID | Bounded authenticated interaction with audience, scope and expiry | Permanent access or permission beyond its grant |
| Controller ID | Verified operator/security domain able to command the instance or use its credentials | Independence merely because its label differs |

Human, company/organization, credential issuer and transport account IDs are additional subjects, never aliases inferred from names. One Life may have multiple workers or instances; this is not independent review. Shared account, key, administrator, orchestration control or recovery authority can make apparently distinct workers one effective controller domain.

## Proposed WORKER_IDENTITY_AUTHORITY interface

This is a design boundary, not a service, live registry or credential issuer. An approved implementation would resolve a principal; verify an issuer-signed binding; evaluate current status, audience and permitted role; verify challenge possession; provide a revocation version; and evaluate independence against a policy version. Return a structured verified binding or a typed denial. Never accept a caller's `verified: true` field.

The trusted binding includes issuer, subject, Life/Worker/Instance/Session IDs, controller domain, credential key ID, allowed audiences, role, not-before/expiry, enrollment evidence reference, revocation epoch and policy version. A pinned trust root or approved issuer discovery must precede verification. Message-supplied public keys or a newly edited branch registry cannot enroll themselves. An authenticated GitHub account is only a transport principal until an approved record binds it to the exact KAIOS role and controller.

Enrollment, controller re-binding, credential creation, persistent grants and trust-root changes require separate explicit authorization and audited administration. This PR performs none of them. Existing missing fields remain unknown: the audit found current registry entries without complete Life/controller bindings. Do not fill those gaps with invented IDs or borrow `codex-gm-01` / `chatgpt-01`.

## Authorship and freshness verification

1. Parse a bounded strict envelope; reject ambiguous encoding, unsupported security fields, oversized payloads and unsafe references before tool use.
2. Resolve issuer/key through a trusted registry snapshot and verify revocation freshness. Pin policy and registry revision in the event. Fail closed when security state cannot be refreshed within its approved maximum age.
3. Verify possession using a one-use challenge bound to subject, instance, session, intended service, nonce and expiry. Protect the challenge redemption with an atomic uniqueness constraint.
4. Verify the signature over a deterministic envelope representation, payload digest, sender, exact recipient, Work ID, Message ID, base/result SHA, parent, timestamps and grant reference. HTTPS signatures must cover the relevant method/authority/target and content digest. Select an approved cryptographic suite during implementation; do not design custom crypto.
5. Check audience, authorized sender and recipient bindings, issue/expiry times, bounded clock skew, replay key and expected work revision. Use server commit time for ordering. Transport timestamps alone are insufficient.
6. Check the separate capability grant against each requested action. A valid signature proves attributable bytes, not permission to perform their requests.

These are KAIOS design requirements informed by [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html) and [NIST authenticator guidance](https://pages.nist.gov/800-63-4/sp800-63b.html), accessed 2026-10-05. No claim of NIST certification is made.

## Credential lifecycle

Prefer narrowly scoped, short-lived service credentials with nonexportable keys where the approved platform supports them. Public verification keys may be referenced; private keys/tokens never belong in task text, Git history, logs or evidence artifacts. Production provider setup is out of scope.

Rotation must publish an approved new binding, prove possession, define a bounded overlap and retire the old key. Revocation stops new claims, lease renewal, ACK/result/review acceptance and still-uncommitted actions. Preserve old public verification material with revocation-effective times for historical audit; never mistake historical signature validity for current permission. Emergency revocation invalidates active sessions and fences owned work before recovery. Already committed effects require reconciliation, not history deletion.

| Status | Admission and recovery |
|---|---|
| Active and fresh | Eligible only within exact grants |
| Stale or expired | Reject; renew through approved authority, never extend locally |
| Revoked or suspended | Quarantine and fence; no automatic retry as a different identity |
| Unknown/unregistered | Reject and report missing enrollment; no inference from display name |
| Duplicate instance binding | Stop both competing claims pending conflict resolution; preserve evidence |
| Temporary external maintainer | Only the explicit task-scoped Human exception; no Life, trust tier, payroll entitlement or persistent access created |

## Reviewer independence predicate

For a workflow that claims independent review, require verified and current bindings for builder and reviewer; distinct Life IDs, Worker IDs, controller security domains and credential principals; reviewer grant for this Work ID and exact result head; and no overlapping signing/delegation/recovery control that defeats separation. A different instance or session never suffices. Different providers do not automatically suffice either.

Record `INDEPENDENT_VERIFIED`, `SAME_CONTROLLER`, `SAME_PRINCIPAL`, `UNKNOWN_BINDING` or `POLICY_EXCEPTION_HUMAN_REVIEW` with evidence and policy revision. Unknown fails closed for an independence claim. A central controller that can command both parties cannot cryptographically prove their independence by issuing two keys. Platform attestations prove only their documented properties; residual controller trust must remain explicit.

Builder self-QA and same-controller technical review are useful evidence and must be labelled honestly. They cannot satisfy the zero-copy-paste demo's independent-review criterion. This does not add a second-reviewer gate to ordinary repository merges: `docs/KAIOS_HUMAN_OWNER_MERGE_POLICY.md` remains authoritative. Human approval can permit an ordinary merge but does not transform same-controller review into independent review.
