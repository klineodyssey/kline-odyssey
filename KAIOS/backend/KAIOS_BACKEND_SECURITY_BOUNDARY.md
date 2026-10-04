# KAIOS Backend security boundary

## Account, Life and wallet separation (P1 remediation)

`src/identity.mjs` owns random Account IDs, private verified email lookup and
short-lived Account sessions. `account_lives` uniquely attaches one Life to its
Account. Signup never accepts a client-chosen Life ID; enrollment generates a fresh
Life through the existing canonical player factory. `LifeEnrollmentAuthority`
rejects legacy claims unless a trusted migration adapter independently verifies
prior ownership; email, a local save, public ID and a new wallet signature are not
that evidence. The old wallet-first sessions do not authenticate any API anymore.

Game-only email verification is explicitly not high-strength MFA or NIST AAL.
Email request uses keyed lookup and encrypted address/outbox, browser-bound 256-bit
hashed single-use tokens, 10-minute expiry, persistent per-address resend limits,
consistent response, and transactional consumption. Delivery is a separate private
outbox operation, not an account-existence-dependent synchronous response. Resends
invalidate prior purpose/address tokens. The local reference uses TestEmailProvider.
Production delivery and production enumeration/timing measurements are not configured.

Account sessions last 30 minutes, use random hashed tokens and HttpOnly Strict Secure
cookies; session revision is checked on every authentication. Recovery requires the
established mailbox plus a previously saved single-use recovery code. Email change
requires fresh existing session, a saved code and new-mailbox confirmation; old/new
addresses receive notifications. Both revoke prior sessions and rotate one consumed
code. No support-agent, wallet-only or public-ID recovery bypass exists. Losing all
established recovery evidence remains blocked. Save the eight initial recovery codes
privately; auth idempotency replay never returns secret material or a new cookie.

Wallet binding separately requires fresh Account login (5 minutes), a saved recovery
code, and ethers-verified EIP-191 challenge signature with domain/chain/player/nonce/
expiry. SQL guards prevent concurrent wallet ownership collision and consume the
code only on successful transaction. Binding cannot switch Accounts/Lives, replace a
primary wallet, authorize transfers or unlock assets. Legacy `sessions` rows remain
as wallet-proof compatibility records only and never authenticate game APIs.

Passkey/WebAuthn is preferred for future asset assurance but deliberately not adopted
as an implemented V1 authenticator. Unsupported credential/asset actions fail closed;
there is no fake WebAuthn verifier, TOTP/SMS fallback or KYC collection. KYC adapter
returns NOT_CONFIGURED. See KAIOS_IDENTITY_AUTH_RESEARCH.md for the method matrix,
future UV/RP/origin/credential lifecycle requirements and attack/residual-risk matrix.

The loopback test mailbox exists only with KAIOS_TEST_EMAIL=1. Test emails, codes and
signers are generated for local tests; no real mail is sent. Never expose the local
server or test mailbox publicly. Production requires secure identity-key binding,
approved mail/retention/abuse policy and independent review. No wallet private key
or seed is requested, read or logged.

## Abuse and privacy

Origin allowlist, mandatory session except health/account bootstrap, bounded streaming request
body (512 KB), field whitelists, canonical Player Life validation, revision guards,
idempotency content hashes and per-client rate limits protect the API. Local ingress
binds 127.0.0.1 only. Workers use the trusted CF connecting-IP header; the local
reference does not represent a production ingress. The bounded in-memory limiter is
an adapter policy, not a globally distributed quota. Configure provider-level limits
before production; restart/multiple isolates are not covered by the local limiter.

No real name, phone, street address, national ID, seed, wallet private key or full
signature is stored in game state or logs. Optional local profile fields are reset
before sync and again server-side. Any future physical delivery requires a separate
encrypted PII service, never public JSON/GitHub/blockchain. Free-form IDs are bounded
and must only represent game references; clients must not put PII in them.

Logs contain requestId, hashed player identifier, redacted route, duration and result;
never signatures, tokens, secrets or complete payloads. Object/DB backups are private
service bindings, not public asset paths. Browser HTML uses external scripts/styles,
CSP, no HTML injection of player payload, and no developer JSON console.

## Financial isolation

No KGEN/KAIOS balance, allowance, deposit, position, claimable, withdrawal or leverage
field exists in the synchronized schema. ChainReceiptProjection requires trusted
verifier authorization and chainId/contract/txHash/blockNumber/logIndex/verifiedAt.
The reference read endpoint is explicitly CHAIN_VERIFIER_NOT_CONFIGURED and returns
no asserted balances. A client-supplied hash/status is never accepted as chain truth.
There is no settlement, treasury, Mainnet role, contract or token change in this PR.

Logistics projections reuse runtime IDs/status/receipt references and completed
nonfinancial cargo metadata. They do not validate payments or instantiate another
logistics engine. XP/game receipts are not redeemable balances or economic proofs.
A wallet binding proves a wallet signature, not Life ownership, and does not make uploaded game progress
trustworthy for competitive/economic rewards. Anti-cheat and transaction verification
are separate future authorities.

## Administration and production gate

Only own-player recovery and diagnostic health are implemented. No superadmin cheat
panel or arbitrary admin XP writes. Future privileged mutations need explicit reason,
scoped permissions and audit records. SQL migrations, Workers configuration and bundled
assets are candidates only; provider authorization, resource identifiers, independent
security review, distributed quotas, operational retention, monitoring and Human
production authorization are required before deployment. No secret must be pasted
into chat; use the provider's secret/binding mechanism if a future task requires one.
