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

# Transport capability matrix

Evidence date: 2026-10-05. “Documented” means the platform supports a feature in its published contract; it does not establish that KAIOS has an installed, authorized or reachable endpoint. “Proposed” means future integration work. No channel has demonstrated the complete V2 identity/ACK/review chain.

| Transport | Addressability and authentication | Delivery/ACK semantics | Retry, limits and failure | Privacy and cost | KAIOS evidence/status |
|---|---|---|---|---|---|
| GitHub issue/PR comment | Repository, issue/PR and account IDs; API actor authenticated by GitHub; KAIOS binding separately required | Successful write proves stored comment; notification/read/worker acceptance not guaranteed; require separate authenticated application ACK | Record returned ID; reconcile uncertain write before retry; obey Retry-After/rate limits; edited/deleted comments need snapshot integrity | Repository visibility applies; no secrets/private personnel data; API/notification noise budget | Repository reads/writes are usable in this task; employee endpoint/wakeup/ACK unverified |
| GitHub committed artifact | Exact repository/path/commit SHA, Git object identity; signing provenance must be verified separately | Durable source/evidence publication after verified remote commit; no recipient ACK | Compare base/tree SHA; non-force updates; digest and retention checks | Public repository is public; avoid large or private payloads; repository growth | Suitable source/design canon; not a mutable operational queue |
| GitHub Actions artifact/event | Workflow/run/job/ref and artifact ID/digest; permissions/OIDC conditions matter | Workflow trigger or artifact existence proves neither employee acceptance nor authorized review | Event coverage, fork behavior, retention, job cancellation and missed deliveries require explicit testing | Runner minutes/storage; least privilege; untrusted PR must not access signing credentials | Potential adapter only; no enabled handoff workflow or approved worker binding proven |
| Codex task/child thread | Provider task ID, owner/account and selected executor; identity mapping is platform-specific | Task admission is not KAIOS Worker ACK or result. Completed provider task is execution evidence only until attributable result is validated | Resume/read/status/notification capabilities must be verified on the actual endpoint; no invented API guarantees | Task context can disclose repository/private content; compute/token budgets | Task tools exist in assistant environment; stable employee address, signed KAIOS ACK and distinct controller not verified |
| Email | Exact mailbox and service account; From/display name is insufficient; mail authentication is not KAIOS role binding | Submission/SMTP acceptance is not reading, acceptance or completion; signed structured response required | Bounce/deferral/duplicate/thread ambiguity; bounded resend with stable IDs | Forwarding/retention/recipient exposure; no secrets; mail/provider costs | Connected mailbox is not authorization to contact an external AI; not selected for demo |
| HTTPS webhook | Allowlisted endpoint, TLS, trusted signed request and bound audience | HTTP response may mean ingress only; asynchronous durable application ACK still required | Timeouts ambiguous; replay/deduplication; receiver outage; bounded backoff and DLQ | Minimal payload/ref only; authenticated retrieval for artifacts; ingress/egress costs | Proposed; no endpoint, key or grant configured |
| Durable queue | Queue/subscription and consumer principal; broker IAM plus independent Worker binding | Durable broker acceptance and consumer settlement distinct from work result and reviewer acceptance | At-least-once default assumption; visibility/lock expiry, poison messages, limits, retention and DLQ configured explicitly | Isolation by tenant/work role; encryption/access controls; per-operation/retention cost | Vendor features documented; no paid resource, binding or production deployment created |

Primary sources: [GitHub webhooks](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks), [GitHub API usage](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api), [Cloudflare delivery guarantees](https://developers.cloudflare.com/queues/reference/delivery-guarantees/), [Azure settlement](https://learn.microsoft.com/en-us/azure/service-bus-messaging/message-transfers-locks-settlement), [Google exactly-once boundaries](https://docs.cloud.google.com/pubsub/docs/exactly-once-delivery), all accessed 2026-10-05. Codex/email rows deliberately state verification gaps rather than undocumented promises.

## Recommended staged choice

**Stage 0, now:** one research branch and Draft PR, with committed documentation and a machine-readable status block in the PR body. No new issue is needed. Keep #177 historical. GitHub source truth and code review are already relevant to the requested deliverable.

**Stage 1, only after approval:** one explicit existing tracking issue or dedicated evidence directory can project sanitized handoff state. Do not create one issue per retry, heartbeat or message. The current research docs directory is not a live mailbox. Choose an actual preverified recipient adapter and prove its wakeup, durable ACK and failure behavior before selecting it. Missing API support yields `TRANSPORT_NOT_AVAILABLE`, not a fictional integration.

**Stage 2:** if a durable queue/service is justified, integrate one provider-neutral adapter behind the existing company owner. Validate identity, retention, dead letters, rate limits, privacy and recovery in a nonproduction environment. An approved provider account and configured bindings are prerequisites, not research assumptions.

## GitHub as canon, not the authority shortcut

GitHub owns code/specification history. Operational current state belongs to the separately approved durable authority; GitHub projections are explicitly labelled with source revision, verified head and generation time. A PR's mutable body is a useful status view, not an immutable ledger. Re-fetch critical events through authenticated APIs and retain permitted immutable evidence with provenance.

Repository access, a webhook HMAC, a green workflow, a `REVIEWED_BY` string and an Actions OIDC token do not independently prove an employee accepted a task or an independent reviewer approved its exact result. Fork-controlled workflows and comments are untrusted input. An adapter must not evaluate task text as shell, mutate permissions, follow arbitrary artifact URLs or issue credentials.

## Capability discovery contract

Before demo enrollment record: endpoint owner and proof, intended worker/controller binding, supported message versions, authentication/ACK mode, maximum payload, retention, rate/timeout limits, retry/dedupe behavior, result retrieval, cancellation and outage recovery. Test each claimed feature using the approved endpoint. Unsupported capabilities remain false/unknown; never infer them from a product's marketing or this design matrix.
