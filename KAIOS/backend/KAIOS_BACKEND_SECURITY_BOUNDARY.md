# KAIOS Backend security boundary

## Wallet and sessions

GET challenge binds a cryptographically random nonce to the configured domain,
wallet, allowed chain (reference 97), canonical Player Life ID, issuedAt and expiresAt.
The message is UTF-8 hex encoded for human-controlled EIP-1193 `personal_sign`; ethers recovers
the signer on the server. Atomic challenge consumption and unique session challenge
prevent replay. Signature verification does not grant token allowance, send a
transaction, prove a balance, or change a local wallet proof to a server proof.

Sessions last 30 minutes, use random tokens stored only as hashes, and are delivered
in HttpOnly SameSite=Strict cookies (Secure in the Workers candidate). Server-side
idempotency responses contain no bearer token. The optional Authorization header
supports non-browser clients; the UI does not put session tokens in localStorage.
Existing bindings determine identity across devices; another wallet cannot seize an
existing Player ID. Unique wallet/chain binding plus SQL session-binding guard protects
concurrent first-login attempts. V1 has no unverified account recovery or admin binding
rewrite. Losing access to the bound wallet requires a later separately reviewed recovery
mechanism; a display name, fingerprint or localStorage ID alone is insufficient.

A fixed stub wallet/challenge signer is enabled only in the loopback local Node dev
server, visibly labelled 本機測試. It is absent from the Workers verifier. Test signers
are generated in memory; no existing secret/private key is read, exported or logged.
Never expose the local demo server to the internet or forward it as a production API.

## Abuse and privacy

Origin allowlist, mandatory session except health/auth, bounded streaming request
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
A signed wallet identifies the player but does not make uploaded game progress
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
