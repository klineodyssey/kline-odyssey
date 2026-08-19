# KAIOS Time Tier Canon Decision — 2026-08-20

Status: HUMAN_APPROVED / INTEGRATION_CANON_INPUT
Registrar: 曜冊 (SOL)
Decision source: Human explicit approval in KAIOS 生死簿 project conversation.

## Canon time tiers

### K280 Earth-Surface Time
- K280 is the human / Earth-surface reference clock.
- 1 K280 day = 24 hours.
- 1 K280 year = 365.2422 K280 days.
- Canon integer conversion for chain execution: `K280_YEAR_SECONDS = 31_556_926` seconds (nearest whole second from 365.2422 × 86400 = 31,556,926.08).

### K18888 Heaven Time
- `1 K18888 HEAVEN DAY = 1 K280 YEAR`.
- Therefore one KUFO half-life defined as one K18888 Heaven Day executes on-chain as `31_556_926` K280/chain seconds.

### K111111 Divine-Army Time
- K111111 is the boundary between deity and divine-army tier in the existing map.
- `1 K111111 DIVINE_ARMY_HOUR = 1 K18888 HEAVEN_DAY = 1 K280 YEAR`.
- This is a civilization time-tier equivalence and must not be confused with a normal runtime heartbeat of 3600 chain seconds.

### K80000 Chain Boundary
- K80000 is the multiverse / chain boundary (main-chain, side-chain, L1/L2 migration boundary).
- K80000 is NOT a biological/divine time tier and does not redefine elapsed chain seconds.

## KUFO freeze consequence for PR #158

The former blocker `K280-year-to-chain-seconds parameter not frozen` is resolved by Human decision:

`KUFO_HALF_LIFE_CANON = 1_K280_YEAR = 1_K18888_HEAVEN_DAY = 31_556_926 chain seconds`.

`DECAY_START = KUFO_BIRTH_TIMESTAMP` remains unchanged.
`TRANSFER_TIME_RESET = BLOCKED` remains unchanged.
`KSHIP_MAX_PER_KUFO = 1000` remains unchanged.

## Remaining PR #158 blockers

1. Resolve mass-unit conflict: current Physics V3.8 still states `1 KGEN = 1 kg`, while PR #158 implementation/canon uses `1 KGEN = 1000 kg` and `1 KAIOS = 1 kg`.
2. Update/reconcile the legacy TempleHeart fortune integration test whose second 18911 proof assumes no new KGEN catalyst escrow; no bypass/backdoor is allowed.
3. Add or authorize an exact-head CI path after rebasing/replaying onto latest main.

## Safety

This decision records a Human-approved time constant only. It does not deploy contracts, send chain transactions, burn KGEN/KAIOS, mint KUFO/KSHIP, make payments, or authorize Mainnet execution.
