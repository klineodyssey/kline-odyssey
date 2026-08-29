# 11520 Native KGEN Market Cell — Candidate Status

STATUS: `PAPER_IN_MEMORY_CANDIDATE_NOT_ACTIVE_RUNTIME`
PR: `#169`
MARKET: `11520_KGEN_NATIVE_MARKET`
COMPANY ADDRESS / KGEN UNIVERSE PRICE COORDINATE: `0.00011520`
COMPANY K COORDINATE: `K11520`
PRICE COORDINATE UNIT: `USD_PER_KGEN`
COORDINATE STATUS: `UNVERIFIED_CANDIDATE`
REPOSITORY-BOUND HUMAN AUTHORITY: `NOT_FOUND_ON_EXACT_MAIN`

## Authority boundary

`0.00011520` is preserved as an `UNVERIFIED_CANDIDATE` value for the K11520 AI Company universe address and KGEN Universe price coordinate `0.00011520 USD_PER_KGEN`. No immutable, repository-bound Human authority record for that dual role exists on exact main `e2646d19dbd5f49c061c6bc14f000a9ec7105e41`; this candidate therefore does not establish a formal Company address, canonical price or activation authority. It is not an automatic matched-trade CT, GPU transaction price, order, target, floor or L/P-derived quote.

The fixed coordinate and the changing native matched-trade CT are distinct fields in the same KGEN Universe. Constructor input cannot relabel or replace the preserved candidate Company-address value, promote it to formal Canon or create Human authority.

`nativeMatchedTradeCT` and `ct` remain `null` until a matched trade has repository-owned verified settlement evidence, verified ownership transfer and a verified receipt. A paper match alone is recorded as `MATCHED_UNSETTLED`, is not CT-eligible, and cannot update OHLC or verified volume. The canonical settlement-attestation registry is currently empty, so this branch cannot promote any match into CT.

External PancakeSwap, WBNB, USD, USDT or L/P-derived values have zero native CT authority.

## Market integrity

- BUY and SELL accept only an opaque `actorContext` that an independently wired verifier resolves to a normalized actor, controller, authentication method, evidence ID, issue time, optional expiry and optional session ID.
- caller-supplied owner/controller strings or `authenticated=true` flags have no authority.
- forged, unknown, future-issued and expired actor contexts fail closed before the order reaches either book.
- same-owner self-match: fail closed.
- same-controller self-match: fail closed.
- anonymous collision: forbidden.
- cancellation requires a fresh verified actor context whose normalized actor and controller both match the order authority; knowledge of the public strings is insufficient.
- order and cancellation actions require actor-bound nonces; accepted nonces cannot be replayed.
- price-time priority remains the matching rule for unrelated actors.
- OHLC, verified volume and CT are derived only from repository-attested settled trades.

## Quote-unit boundary

The current quote asset is explicitly `UNFROZEN_11520_NATIVE_QUOTE_CANDIDATE`.

- quote status: `UNFROZEN_CANDIDATE`
- base asset: `KGEN`
- base decimals: `18`
- quote decimals: `18`
- candidate tick size: `0.00000001`
- candidate lot size: `0.00000001`

Until a quote asset/unit is independently frozen, any output is `NATIVE_MARKET_PRICE_CANDIDATE`, not a formal comparable KGEN price.

`quoteStatus` and `quoteAsset` are not constructor authority. Caller attempts to set `FROZEN` or another quote are ignored; a future formal freeze requires an independently reviewed Canonical Market Registry or quote-authority integration.

## Runtime / settlement boundary

The active 11520 app imports this module only to render a public read-only Experimental status and empty-order-book panel. The browser exposes no native order, cancellation, matching, settlement, ownership-transfer or receipt action, so this does not activate a trading runtime.

- signer: no
- private key: no
- custody: no
- token transfer: no
- approval: no
- settlement: no
- settlement attestation registry: repository-owned and intentionally empty
- ownership transfer: no
- verified receipt: no
- Mainnet transaction: no
- deployment: no
- governance execution: no

The existing PancakeSwap user-wallet adapter remains separate and unchanged.

## CI requirement

`.github/workflows/universal_exchange_v2.yml` must run both:

- `tests/universal-exchange.test.mjs`
- `tests/11520-kgen-native-market-cell.test.mjs`

The candidate is not review-complete merely because unrelated 11520 tests are green.
