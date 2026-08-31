# K11520 Universal Exchange — KGEN/KAIOS Spot Product

Status: DRAFT PRODUCT CANDIDATE

This product extends the existing PR #169 / PR #195 native-market lineage. It does not create a second exchange.

## First market

- Base: KGEN
- Quote: KAIOS
- Market: `11520_KGEN_KAIOS_SPOT`
- Pricing: price-time-priority order book
- Settlement: matched trades remain `MATCHED_UNSETTLED` until both asset receipts are verified

The Physics scale `1 KGEN = 1000 KAIOS` is not treated as a fixed market price. Market price comes from executable bids and asks.

## Smooth quoting

The market exposes best bid, best ask, midpoint, spread, spread bps, two-sided quote health, market-order depth preview, average executable price, exact KAIOS quote amount, preview slippage and fillability. A preview never signs or broadcasts a transaction.

## Matching

Limit orders match at maker price under price-time priority. Same-Life and same-controller self-match fail closed. Replay nonces are consumed in the paper runtime.

## Settlement phase

The dedicated `kgen-kaios-settlement-adapter.mjs` now models the exact dual-asset settlement boundary:

1. bind an exact `MATCHED_UNSETTLED` trade;
2. create a non-executing settlement intent;
3. buyer owes the matched KAIOS quote amount to seller;
4. seller owes the matched KGEN quantity to buyer;
5. both receipts must have status `1` and exact trade/asset/amount/Life binding;
6. only then does the trade become `VERIFIED_SETTLED` and ownership become `DUAL_ASSET_TRANSFER_VERIFIED`;
7. only verified settlement updates CT, verified KGEN/KAIOS volume and OHLC candle state.

Receipt attestations are replay protected. Production remains fail-closed because the production receipt registry, signer and chain execution adapter are not connected. Repository test fixtures exist only under the exact test-market identifier.

## Product sequence

Completed candidate layers:

1. KGEN/KAIOS book and smooth quote surface;
2. match-bound dual-asset settlement intent;
3. receipt-gated ownership / CT / OHLC / verified-volume state machine.

Remaining production gates:

1. bind production actor/controller evidence from the #169 lineage;
2. bind #195 settlement request to the exact production KAIOS payment rail;
3. bind KGEN ownership-transfer execution/receipt verification;
4. connect a repository-bound production receipt registry and secure signer policy;
5. validate exact-chain receipts before any CT/ownership state transition;
6. expose the settled state in the K11520 frontend without inventing payment state.

## Safety

No private key, signer, token transfer, payment, pair creation, LP operation, deployment, Mainnet transaction or chain write is performed by this candidate. V10 payment documentation remains a simulation/prototype boundary, so this PR does not claim production payment authority.
