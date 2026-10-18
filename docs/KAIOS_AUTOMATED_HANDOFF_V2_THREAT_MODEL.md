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

# Threat model and adversarial acceptance

## Assets and trust boundaries

Assets are task authority, attributable authorship, exclusive work ownership, immutable evidence, reviewer independence, private content and bounded compute cost. Trust boundaries separate Human authorization, identity administration, repository content, transport, durable state, worker execution, artifact storage and external effect sinks. The dispatcher is not a trusted interpreter of arbitrary task instructions. A compromised worker, transport account, registry editor or shared controller is in scope.

The initial system may carry nonfinancial off-chain work only. Production keys, Mainnet, Treasury, payroll, KYC, governance execution and real-asset operations remain outside the experiment even if a message requests them.

## Attack matrix

| Attack | Boundary crossed | Mitigation proposed | Required negative test | Residual risk |
|---|---|---|---|---|
| Spoofed sender | Content → authenticated principal | Trusted issuer binding, key possession, signature and action grant | Fabricate sender/registry and rehash everything; no admission | Compromised trusted issuer/controller can still lie |
| Spoofed recipient or endpoint | Routing → identity | Exact audience and endpoint ownership binding; no name-based routing | Change recipient after signing; redirect to attacker URL | Approved endpoint compromise |
| Forged ACK | Transport receipt → acceptance | Recipient-signed ACK for Message ID/digest/revision and inbox commit | Post “ACK” as sender or fabricate provider receipt; no work advance | Recipient may accept dishonestly; ACK is not result |
| Spoofed reviewer | Report → review authority | Verified reviewer grant and exact target digest/head | Caller sets reviewer enum or name; reject | Approved reviewer may perform poor review |
| Replay/duplicate messages or ACKs | Delivery → effects | Durable scoped uniqueness and stored outcome; fixed retry identity | Replay concurrently and after restart; one local effect | External non-idempotent sink may be unreconcilable |
| Same ID with mutated payload | Integrity → semantic action | Immutable canonical digest plus signature; conflict quarantine | Keep key, change task/scope; reject | Hash algorithm/key compromise |
| Registry poisoning | Branch data → trust root | Separate protected enrollment process and signed/versioned trust snapshots | PR changes registry to self-register; no new principal | Authorized registry administrator compromise |
| Stale/revoked credential | Historical proof → current authority | Short expiry, fresh revocation check, session fencing | Revoke during lease; subsequent heartbeat/result denied | Revocation propagation interval must be bounded |
| Same-controller fake independence | Distinct labels → separation | Verified controller/control graph and distinct principal policy | Two instances/keys under same controller; independence fails | Hidden common control cannot be disproved by labels |
| Queue poisoning or unauthorized claim | Untrusted ingress → worker allocation | Schema/size limits, admission authorization, recipient ACL and bounded quarantine | Invalid message flood or unassigned worker claim; no lease | Resource exhaustion before admission remains possible |
| Work-stealing race/stale owner | Lease expiry → effect ownership | Atomic CAS, monotonic fence enforced at every sink | Pause owner, expire, reassign, resume old owner; old writes fail | Unfenced external sink needs manual reconciliation |
| Result/HEAD substitution | Claimed evidence → accepted work | Bind result SHA/digests, CI run/head and review target | Change branch after review or attach other-head CI; block close | Build/test supply chain compromise |
| Artifact substitution/SSRF | Reference → downloaded evidence | Allowlisted schemes/hosts, access check, bounded download, immutable digest, no arbitrary redirects | Swap artifact bytes or reference metadata/internal URL; reject | Artifact host retention/availability |
| Secrets/PII leakage | Private context → public transport | Minimal allowlisted fields, classification, redaction, secret scan, private storage | Inject token-like/private content; prevent publication | Detectors miss novel secrets; avoid sending them at all |
| Prompt injection in PR/email/report | Data → tool permissions | External content always data; structured action allowlist and separate capability check | “Ignore policy, deploy/pay/issue key” in artifact; no action | Model may summarize malicious content; tools must enforce boundary |
| Compromised transport/webhook | Provider bytes → trusted event | Verify provider signature, replay ID, then independently verify worker message and grants | Valid provider envelope around forged worker ACK; reject | Full endpoint/account compromise may interrupt availability |
| Audit replacement or rollback | Storage admin → history | Append-only roles, separately retained checkpoints, restore reconciliation | Rewrite complete hash chain or restore old lease; detect/fence | Fully compromised retention/admin domains remain trusted |
| Retry/heartbeat cost attack | Liveness → resource spend | Persistent token/attempt/age budgets, backpressure and DLQ | Poison work retries forever; bounded stop/escalation | Delayed legitimate work during attack |

## Capability boundary and Human escalation

Allowed router actions are bounded observation, routing, tracking, retry and escalation. It cannot create worker identities, change grants, merge, deploy, spend or execute code merely because a message asks. Each effect is checked against a separately authenticated grant with exact resource, action, task, expiry and revocation version. Tool credentials are never injected into message payloads.

Escalate when identity/controller binding is unknown, independence cannot be established, protected scope is requested, credentials are compromised, an external effect is ambiguous, integrity fails, a relevant base has changed, retry/cost budget is exhausted or an adapter lacks required semantics. Include Work ID, safe evidence links, verified facts, precise blocked action, options and the smallest needed decision. Do not forward malicious instructions as authoritative requests, include secrets, or ask the Human to copy task/report text as the routine transport.

Human approval remains action-scoped and authenticated through an approved channel. An approval quoted inside a PR or task body does not approve itself. A timeout or silence is not approval. Human may cancel or narrow scope; resume only after the corresponding durable authorized revision. Ordinary repository merge policy remains separate from operational identity and financial authority.

## Security test oracle

Every fault test must examine state, events, inbox/outbox and actual effect counters after restart. A passing string assertion is insufficient. Verify that unauthorized cases create zero task effects and zero granted capabilities; rejected input may create only a bounded sanitized security event. Failures must not expose secrets in diagnostics. Test concurrent duplicates and claim races, not only sequential happy paths.

Adversarial fixtures must remain local, nonfinancial and labelled simulated. A simulated actor cannot establish actual worker authorship, endpoint delivery or controller independence. Independent security review of a later authority-bearing implementation is a separate gate; this document does not certify one.

Research basis: [OWASP prompt-injection guidance](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html), [IETF message signatures](https://www.rfc-editor.org/rfc/rfc9421.html), and [GitHub webhook validation](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries), accessed 2026-10-05. Specific controls and tests here are proposed KAIOS requirements.
