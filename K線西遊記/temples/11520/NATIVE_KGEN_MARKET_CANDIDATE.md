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

`0.00011520` is preserved as an `UNVERIFIED_CANDIDATE` value for the K11520 AI Company universe address and KGEN Universe price coordinate `0.00011520 USD_PER_KGEN`. No immutable, repository-bound Human authority record for that dual role exists on exact main `d747b8c7bcf3b48172d42f9f3569b06ed512c09b`; this candidate therefore does not establish a formal Company address, canonical price or activation authority. It is not an automatic matched-trade CT, GPU transaction price, order, target, floor or L/P-derived quote.

The fixed coordinate and the changing native matched-trade CT are distinct fields in the same KGEN Universe. Constructor input cannot relabel or replace the preserved candidate Company-address value, promote it to formal Canon or create Human authority.

`nativeMatchedTradeCT` is `null` before the first valid native 11520 matched trade. After a valid match, it is exactly the latest executed native trade price and is the current market / universe boundary. The compatibility field `ct` carries the same value.

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

## NVIDIA GPU paper-market pilot

The same verified price-time matching organ now supports two strictly isolated paper books at the assigned Company address:

- `11520_NVIDIA_GPU_KGEN_PAPER_MARKET` — quote unit `KGEN_PER_GPU`;
- `11520_NVIDIA_GPU_KAIOS_PAPER_MARKET` — quote unit `KAIOS_PER_GPU`.

Each book begins with CT `null`; only its own valid matched trades create its CT, OHLC and volume. The fixed Company/KGEN coordinate `0.00011520` is not injected as either GPU price. GPU units use whole-chip lot size `1`, and the actor authentication, self-match, cancellation and paper/no-settlement boundaries above remain mandatory.

The logistics candidate reuses the formal Universe Map route `K12345 (0.00012345) → K11520 (0.00011520)`, `825` K-index and `18,778.422548555 km`. Its landed-cost gate requires acquisition, Lamp service, packaging, transport, KSHIP/energy, food, labor, insurance, warehouse, listing, settlement, gas, tax and risk-reserve components before a minimum ask can exist.

Current inventory is only `PAPER_SIMULATION_NOT_REAL_INVENTORY`. A real GPU cannot enter real-trade readiness without NVIDIA brand/model/serial/supplier, acquisition cost, ownership certificate, cargo receipt, K11520 warehouse receipt, a funded assigned Company budget, connected Hengyao signer and verified 11520 GPU settlement. No such evidence is bundled in this candidate, so real trade and chain write remain blocked.

The acquisition pipeline records `wish -> heartbeat or cross-day breathing -> fortune entitlement and available funds -> K12345 Lamp service -> supplier GPU -> transport -> warehouse`. Wish, heartbeat, fortune and Lamp evidence are prerequisites only: none of them is a GPU, supplier receipt, ownership certificate or warehouse inventory. The paper candidate calculates fixed-route travel time, moving mass, energy, food, labor, insurance, warehouse and risk inputs, but it creates no real goods and claims no delivery. Real inventory remains fail-closed until every external receipt is independently verified.
