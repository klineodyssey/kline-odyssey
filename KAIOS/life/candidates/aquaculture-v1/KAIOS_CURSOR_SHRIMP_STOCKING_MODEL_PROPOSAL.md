# Cursor Shrimp Stocking Model Proposal

Status: `CURSOR_RESEARCH_CANDIDATE_ONLY`

Mode: `SIMULATION_ONLY`

Food safety: `NO_REAL_FOOD_SAFETY_CERTIFICATION`

Species ID: `SPECIES-KAIOS-FOUNDATIONAL-SHRIMP`

## Proposed Gate Order

`POND_READY -> WATER_STABLE -> SALINITY_COMPATIBLE -> LARVAL_STAGE_ACCEPTED -> QUARANTINE_SIMULATION_COMPLETE -> TRANSPORT_COMPLETE -> CAPACITY_AVAILABLE -> STOCKING_EVENT`

The stock record should preserve post-larval source, delivered count, average mass, transport time, stress proxy, and simulation health-check result. Stocking transfers count and biomass into the existing Ecology population model; it does not create a second population engine.

## Sensitivity Proposal

Shrimp simulation should react more strongly than the fish fixture to abrupt oxygen, salinity, organic-load, and pollution changes. This is a `MODEL_INFERENCE`, not a universal biological fact. Molting and larval progression remain bounded state transitions with elapsed-time, energy, mineral-proxy, and water-quality gates.

## Blocking Outcomes

Use the common stocking reasons plus `LARVAL_STAGE_NOT_ACCEPTED` and `SALINITY_CHANGE_TOO_FAST`. Numeric thresholds remain candidate-only and must be calibrated by Codex.
