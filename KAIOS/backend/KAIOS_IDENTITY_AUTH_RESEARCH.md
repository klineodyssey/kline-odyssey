# KAIOS Identity/Auth research and remediation decision

Status: implementation candidate, not production identity or NIST certification.
Author: 澄序. Reviewer: 悟界. Human authority: 沈英明.
Scope: PR489 Identity/Auth P1 and coordinate semantics P1 only.

## Sources actually read

OWASP Authentication, Forgot Password and Multifactor Authentication Cheat Sheets:
https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html

The rendered OWASP host returned HTTP403; the official OWASP/CheatSheetSeries
GitHub `master/cheatsheets/` sources were successfully read instead. They require
uniform account-recovery responses, short-lived single-use secrets, throttling,
reauthentication for sensitive changes, independent established recovery evidence,
and server validation of WebAuthn user verification rather than mere presence.

NIST SP800-63B-4: https://doi.org/10.6028/NIST.SP.800-63b-4
NIST SP800-63A-4: https://doi.org/10.6028/NIST.SP.800-63a-4
NIST Pages returned HTTP403. Read the official usnistgov/800-63-4 HTML repository
at commit `4f2487bb81adecdc84ccaac6920bf0b500b379ae`, including authenticator
and recovery sections. Email SHALL NOT be an out-of-band authenticator in the
NIST assurance framework; email address confirmation/recovery codes are distinct.
AAL2 recovery needs independent established evidence, not simply a new email.
Saved recovery codes must be random, hashed and single-use; notify on recovery.
KAIOS's candidate levels below are product gates, not claims of NIST AAL compliance.

W3C WebAuthn Level3: https://www.w3.org/TR/webauthn-3/ was directly read.
RP must validate challenge, origin, RP ID, signature and UV, maintain credential
ownership and counters, and consider synced credential backup state. Prefer a
maintained verifier library to handwritten WebAuthn cryptography.

## Method comparison / decision matrix

| Method | Security / phishing | Cost, friction, mobile | Recovery / KAIOS decision |
|---|---|---|---|
| Verified email | proves mailbox access only | delivery dependency; familiar | notification/recovery address; never Life ID or MFA |
| Passwordless email link | bearer link, mailbox/phishing exposure | low UX friction; delivery/link scanner issues | game-only candidate, no financial assurance claim |
| Password | stuffing/reuse/phishing; requires hardened hash and blocklist | familiar but reset burden | not selected for V1 |
| TOTP | second factor but phishable; encrypted shared seed | cheap, moderate mobile friction | defer; not a substitute for phishing-resistant asset gate |
| Passkey/WebAuthn | RP-bound phishing resistance with UV | low recurring cost, good mobile; ecosystem recovery dependency | preferred future asset authenticator; not pretend deployed |
| SMS | SIM swap/PSTN risk, phishable | paid provider, coverage issues | not selected |
| Email OTP | mailbox control, not strong independent MFA | easy but delivery dependency | never label high-strength MFA |
| Wallet signature | possession of key; app signatures may be phished | wallet friction | binding proof only, not Account or Life ownership |
| Recovery codes | random bearer secrets, offline storage needed | low service cost | combine saved code with verified established email; single use |
| Trusted devices | stolen device/cookie risk | convenient | risk hint only, never bypass step-up |
| Step-up | limits stolen long-lived session reach | selective friction | fresh evidence bound to exact sensitive operation |
| Risk-based auth | signals are fallible | privacy/cost constraints | fail closed on unsupported high-risk actions; no fingerprint identity |
| KYC/proofing | binds real-world identity, not login | high friction and PII risk | disabled provider interface only; explicit Human policy required |

## Architecture decision

Account, Player Life, wallet bindings, authenticator credentials and identity
proofing records are distinct entities. Email is neither an Account ID nor Life ID.
Ordinary local guest gameplay stays available. Cloud Account creation requires
verification; a new cloud Life identifier must be server-assigned. A public
requested Player ID can never establish ownership. Legacy-Life enrollment must
use independently established, server-verifiable migration evidence; where the
old installation never had such evidence, preserve its local save and block the
claim pending a trusted migration process. Do not mint a fake proof retroactively.

V1 implementation decision: verified-email game-only access plus offline recovery
code and fresh verification for account lifecycle; phishing-resistant asset access
remains disabled until maintained WebAuthn implementation and independent review.
Email-only must never unlock wallet replacement, financial actions, or asset gates.
No silent account merge. Wallet lost/replaced does not replace a Life. Game backup
restore never restores auth sessions, recovery secrets or account ownership.

GAME_ACCESS: non-financial game sync. ACCOUNT_SENSITIVE: operation-bound fresh
verification plus saved recovery evidence. ASSET_ACCESS: BLOCKED pending UV passkey
and canonical asset authority. REGULATED_ACCESS: BLOCKED pending Human-approved
policy/provider. These are not NIST AAL names or certifications.

Fresh step-up is required for wallet add/change, credential add/removal, email
change and recovery. Withdrawals, major asset transfers, high-value land/market
and high-C trading stay unavailable regardless of ordinary session. Removing the
last strong authenticator cannot downgrade an enabled asset account to email-only.

## Email / recovery requirements

Normalization: explicit ASCII local-part policy, lowercase domain, no provider-
specific dot/plus stripping; exact local-part casing preserved. Use private keyed
lookup, not public email hashes. Never log addresses or bearer verification tokens.
Random 256-bit token, hash at rest, short expiry, one-time transaction consumption,
purpose/account/request-browser binding, resend cooldown and rolling account/IP
limits. Uniform responses to existing/nonexisting addresses. GET links must not
consume tokens; explicit same-origin POST confirmation. No URL query-token logs.

Email change requires existing evidence and confirmation of new mailbox; notify
old and new, revoke sessions, protect against concurrent unique-email collision.
Recovery requires previously established mailbox plus saved one-time code; revoke
old sessions, notify, rotate recovery material. No support-agent social override,
security questions or recently replaced address as sole recovery evidence. If both
factors are lost, fail closed; do not use public Life ID/wallet as recovery proof.

EmailProviderAdapter/TestEmailProvider only for this phase. Production provider
unconfigured, no production mail. Provider outbox, account audit and PII must stay
private; expiring tokens deleted after retention, removed email lookup erased after
required notifications; audit retains non-PII safe IDs. No PII in public artifacts.

WebAuthn future contract: registration/authentication challenge expires and binds
to Account/session/purpose, allowlisted origin/RP ID, UV required, globally unique
credential ID, multiple credentials, fresh existing authenticator for additions,
last-credential removal blocked; recover into restricted state, not automatic asset
access. No fake stub may be selected by production configuration.

## Attack matrix

| Attack | Boundary / mitigation | Adversarial test | Residual risk |
|---|---|---|---|
| Public Player ID preclaim | server ID / trusted migration proof | own wallet + victim ID rejected | legacy saves without proof need separate adjudication |
| Email enumeration | uniform request status/body, delivery off request path | existing/missing/resend responses | network timing requires deployment measurement |
| Magic-link replay / expiry / wrong email | purpose/browser/account binding, atomic consume, expiry | replay/race/wrong token rejected | mailbox compromise |
| Session theft / CSRF | HttpOnly SameSite Secure, origin, short expiry, sensitive step-up | foreign origin / expired / no step-up | same-origin XSS needs defense in depth |
| Credential stuffing | no password endpoint; throttled token attempts | brute invalid token / rate limit | distributed bots |
| Wallet takeover / replacement | Account ownership + fresh evidence + signature | attacker wallet never claims victim Life | phishing wallet signatures |
| Passkey replacement | future strong-auth gate; unavailable now | disabled asset/authenticator APIs reject | deferred capability |
| Recovery bypass / replay | established email + offline code, one-time atomic use | email alone / reused code rejected | simultaneous theft of both factors |
| Cross-device race | transaction guards / unique constraints / revisions | parallel consume/enrollment/change | live D1 parity must be verified |
| Account merge collision | no implicit merge | same email/Life competing account rejected | manual adjudication not implemented |
| Duplicate Player Life | unique ownership, no arbitrary preclaim | duplicate trusted enrollment rejected | local guest clones remain local |
| Bot mass signup | IP/address budgets, bounded pending data | throttling/resend tests | production abuse service not configured |

## XYZ remediation decision

Read Boot CURRENT, Physics CURRENT, UniverseMap V10.2 and 11520 spatial runtime.
Physics separates XYZ from KX/KY/KZ; spatial-coordinate-runtime explicitly treats
local game units as meters and requires an explicit physical origin for composition.
Human's address examples `11520→0.00011520`, `18888→0.00018888` are preserved as
decimal address anchors, not invented triples or automatic local-meter transforms.

Canonical universe position needs explicit frame, units, world/map provenance and
verified source; absent evidence => null/unresolved. Local render position keeps
scene/world identity and local units separately. Legacy lastXYZ/homePlot.xyz stay
losslessly represented as legacy local data. Migration produces a candidate, keeps
original hashed snapshot and pre-migration backup, validates then commits with new
revision; rollback/restore migrates a copy and cannot counterfeit universe truth.

## Evidence status

Research complete; this document records decisions/requirements, not implementation
PASS. Tests and final handoff must enumerate actual completed behavior and gaps.


## Candidate implementation evidence (subject to independent review)

`src/identity.mjs`, `deploy/0002_identity.sql`, `test/identity.test.mjs` implement
private Account/email/session/recovery, server-assigned Life and fail-closed legacy
migration adapter. Email delivery is an encrypted private SQL outbox, not a request-
dependent send. TestEmailProvider is local only. Lifecycle changes and wallet binds
record safe audit events and notification outbox entries. Expired auth data has a
private pruning method; no scheduler or production provider is deployed.

Backend tests: 30 total, including 10 new adversarial suites. Existing local Player
Life regression: 39 tests. Real Chromium four-viewport QA exercises normal email
request/verification controls, Account enrollment, backup/restore and separate
wallet binding without transaction RPC. Exact HEAD/CI evidence belongs in PR489's
new handoff, not in this source document's pre-commit test statement.

Limitations: GAME_ONLY email login is intentionally phishable and not NIST AAL.
Passkey, TOTP and SMS are not adopted as implemented V1 authenticators; protected
asset/regulated paths remain unavailable. Recovery uses verified established email
plus saved offline code, not email alone. Trusted migration issuer, live Cloudflare
parity, production timing/abuse testing and production mail remain NOT_CONFIGURED /
NOT_VERIFIED. None is silently represented as PASS. No real KYC evidence is collected.
