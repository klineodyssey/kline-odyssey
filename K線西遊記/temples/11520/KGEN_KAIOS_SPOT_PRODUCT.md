# K11520 Universal Exchange — KGEN/KAIOS Spot Product

Status: DRAFT PRODUCT CANDIDATE

This product extends the existing PR #169 / PR #195 native-market lineage. It does not create a second exchange.

## First market

- Base: KGEN
- Quote: KAIOS
- Market: `11520_KGEN_KAIOS_SPOT`
- Pricing: price-time-priority order book
- Settlement: matched trades remain `MATCHED_UNSETTLED` until the existing receipt/ownership settlement lineage can verify them

The Physics scale `1 KGEN = 1000 KAIOS` is not treated as a fixed market price. Market price comes from executable bids and asks.

## Smooth quoting

The market exposes:

- best bid
- best ask
- midpoint
- spread
- spread bps
- two-sided quote health
- market-order preview across multiple book levels
- average executable price
- KAIOS quote amount
- preview slippage
- fillability

A preview never signs or broadcasts a transaction.

## Matching

Limit orders match at maker price under price-time priority. Same-Life and same-controller self-match fail closed. Replay nonces are consumed in the paper runtime.

## Product sequence

1. KGEN/KAIOS book and quote surface
2. bind production actor/controller evidence from the existing #169 lineage
3. bind #195 settlement-request packet to an exact KAIOS payment rail
4. verify token receipt + KGEN ownership transfer atomically
5. only verified settled trades may update CT/OHLC/verified volume
6. later add more assets without creating another exchange engine

## Safety

No private key, signer, token transfer, payment, pair creation, LP operation, deployment, Mainnet transaction or chain write is performed by this candidate.
