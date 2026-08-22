# 11520 Native KGEN Market Cell — Candidate Status

STATUS: `PAPER_IN_MEMORY_CANDIDATE_NOT_ACTIVE_RUNTIME`
PR: `#169`
MARKET: `11520_KGEN_NATIVE_MARKET`
LOCATION / CELL IDENTITY: `0.00011520`

## Authority boundary

`0.00011520` is a Huaguoshan Taiwan Exchange market-cell identity only. It is not CT, not a market price, not a price seed, not a target, not a floor and not an L/P-derived quote.

CT is `null` before the first valid native 11520 matched trade. After a valid match, CT is exactly the latest executed native trade price and is the current market / universe boundary.

External PancakeSwap, WBNB, USD, USDT or L/P-derived values have zero native CT authority.

## Market integrity

- BUY and SELL accept only an opaque `actorContext` that an independently wired verifier resolves to a normalized actor, controller, authentication method, evidence ID, issue time, optional expiry and optional session ID.
- caller-supplied owner/controller strings or `authenticated=true` flags have no authority.
- forged, unknown, future-issued and expired actor contexts fail closed before the order reaches either book.
- same-owner self-match: fail closed.
- same-controller self-match: fail closed.
- anonymous collision: forbidden.
- cancellation requires a fresh verified actor context whose normalized actor and controller both match the order authority; knowledge of the public strings is insufficient.
- price-time priority remains the matching rule for unrelated actors.
- OHLC and volume are derived only from executed native trades.

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

This module is not imported by the active 11520 app and does not change the current production runtime.

- signer: no
- private key: no
- custody: no
- token transfer: no
- approval: no
- settlement: no
- Mainnet transaction: no
- deployment: no
- governance execution: no

The existing PancakeSwap user-wallet adapter remains separate and unchanged.

## CI requirement

`.github/workflows/universal_exchange_v2.yml` must run both:

- `tests/universal-exchange.test.mjs`
- `tests/11520-kgen-native-market-cell.test.mjs`

The candidate is not review-complete merely because unrelated 11520 tests are green.
