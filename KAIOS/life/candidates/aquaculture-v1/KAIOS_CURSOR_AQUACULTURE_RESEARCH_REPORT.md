# KAIOS Cursor Aquaculture Research Report

Status: `CURSOR_RESEARCH_CANDIDATE_ONLY`

Mode: `SIMULATION_ONLY`

Food safety: `NO_REAL_FOOD_SAFETY_CERTIFICATION`

## Scope

This report proposes bounded inputs for a future Codex-owned fishpond simulation. It does not define the authoritative Runtime and makes no universal biological, veterinary, engineering, food-safety, legal, or commercial claim.

Canonical repository references are preserved:

- Fish: `SPECIES-KAIOS-FOUNDATIONAL-FISH`
- Shrimp: `SPECIES-KAIOS-FOUNDATIONAL-SHRIMP`
- Existing ecological habitat: `HABITAT-FISHPOND-V1`

## Findings

1. Stocking should be blocked until pond readiness, compatibility, water stability, transport, quarantine simulation, and carrying-capacity checks pass.
2. Water quality should be derived from recorded inflow, rainfall, evaporation, seepage, outflow, biomass, feed, waste, aeration, and treatment actions.
3. Feed and growth should use bounded proxies. Biomass cannot increase without feed or an approved natural resource, oxygen, compatible water, and elapsed simulation time.
4. Disease is a risk proxy only. It must not present diagnosis or treatment advice.
5. Harvest, cold storage, transport, market demand, inventory, and simulated accounting must remain distinct causal stages.

## Provenance Labels

`REPOSITORY_DERIVED` identifies repository IDs or rules. `MODEL_INFERENCE`, `RESEARCH_PROPOSAL`, `ASSUMPTION`, and `SOURCE_UNDERSPECIFIED` identify noncanonical proposals requiring Codex validation.

## Recommendation

Use these artifacts only as specification inputs. Codex should validate units, tune parameters through deterministic tests, and reject any value that conflicts with the Canonical Life, Ecology, Physics, Rights, Labor, Logistics, or Economy owners.
