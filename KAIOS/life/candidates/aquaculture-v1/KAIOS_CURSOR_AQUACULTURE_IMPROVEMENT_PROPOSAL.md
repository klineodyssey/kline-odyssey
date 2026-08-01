# Cursor Aquaculture Improvement Proposal

Status: `CURSOR_RESEARCH_CANDIDATE_ONLY`

Mode: `SIMULATION_ONLY`

Food safety: `NO_REAL_FOOD_SAFETY_CERTIFICATION`

## V1 Priorities

1. Reuse `HABITAT-FISHPOND-V1`, existing population and resource accounting, causal route evaluation, labor conflicts, construction gates, inventory, and balanced ledger concepts.
2. Centralize units and parameter validation before any simulation command.
3. Make construction, stocking, feeding, mortality, harvest, sale, and liquidation transactional so failed commands leave state unchanged.
4. Reconcile water, feed, biomass, dead biomass, inventory, energy, and cash after every event.
5. Keep public APIs static and read-only.

## Deferred Research

- Species-specific validated culture profiles.
- Living plankton and microbial life packages instead of abstract proxies.
- Detailed disease agents and veterinary workflows.
- Real food-safety, environmental-permit, water-right, and legal standards.
- Commercial optimization, real pricing, payments, insurance, and settlement.

## Review Gates

Codex should reject any proposal that duplicates Runtime ownership, exceeds species bounds, loses mass or ledger continuity, permits instant construction or delivery, creates diagnosis or certification claims, or activates wallet, KGEN, on-chain, legal, or Production authority.
