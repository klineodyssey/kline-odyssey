# KUFO Zodiac cohort and cross-office latency — OFFCHAIN R0

This is a bounded simulation / QA candidate associated with original alchemy Draft PR #201 (currently HOLD), K11520 #570, and KAIOS shared memory #599.

## Latest Human creative decision
- All KUFO born within one KGEN calendar-year cohort share an immutable birthZodiac.
- The active zodiac changes for all batches when the configured year rolls over; cumulative KUFO→KSHIP eligibility for that birth cohort becomes 50%, 75%, 100% on the first, second and third rollover, with exact zero remainder on the third.
- Uses the PR #201 KSHIP_PER_KUFO=1000 convention. Does not mint tokens or settle on chain.
- This is NOT the same as PR #201's existing per-lot bornAt anniversary: a lot created seconds before the end of the year would become eligible at the next rollover. Human/product/finance must expressly review this fairness consequence before adopting it in a live contract.
- The KGEN calendar is a REQUIRED versioned input. The unit tests use Jan 1 sample boundaries solely to demonstrate behavior: this is NOT claiming official Gregorian, Lunar New Year, or K280 epoch dates.

## Run tests
node --test KGEN-KAIOS/research/kufo-zodiac-cohort-v0.test.mjs

## Neural communication performance
The sameRuntimeLatency helper calculates only same-process monotonic-nanosecond durations. For true trade latency one would need source-bound timestamps and actual event receipts for: market price → agent decision → risk → wallet explicit order intent → blockchain broadcast → final fill. All real trading requires separate authorization and Chain56 safety gates; combat, walking, following and HUD clicks do NOT submit orders.

## Security and deployment
Pure functions only, no RPC, signer, mint, burn, balances, or blockchain calls. This branch is additive test research, not an alternative runtime or claim on PR #201 ownership. Do not merge, deploy or update Mainnet while PR #201 has unresolved scope and KUFO-lot fragmentation safety issues. Existing chain contracts may require migration and independent review. No claim of a live player wallet or verified inter-agent ACK.
