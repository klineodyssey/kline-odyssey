---
TITLE: "Species Genome Standard"
VERSION: "0.1.0"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
TASK_ID: "HUMAN-GENESIS-DNA-EVOLUTION-001"
---

# Species Genome Standard

## 1. Species Genome

A `SpeciesGenome` declares taxonomy, body class, Species OS compatibility, inherent life capabilities, permitted ranges, environmental envelope, resource budget, reproduction model, mutation boundaries, lineage and registration state.

Required draft fields:

```text
species_code, taxonomy, genome_id, genome_generation, genome_hash,
body_profile, species_os_profile, inherent_capabilities,
eligible_atom_domains, species_limits, environment_limits,
energy_budget, water_budget, nutrition_budget, land_capacity_cost,
reproduction_rules, mutation_envelope, prohibited_mutations,
parent_lineage, compatibility_version, owner, reviewer, status
```

## 2. Inherent Life Capabilities

Inherent capabilities are supplied by Species Genome and Life OS and do not automatically count as GA. Examples include respiration or equivalent energy exchange, metabolism, growth, repair, reproduction, feeding/uptake, orientation and danger avoidance.

A fish, pig, oyster, ant, plant or other viable life is therefore never an empty shell. It may have zero evolutionary GA while retaining all inherent capabilities required by its species.

## 3. Evolutionary GA

GA adds verified capabilities beyond or above the species baseline. An advanced disease-resistance GA, for example, is not the same thing as the baseline immune behavior needed to live. Activation must describe the incremental effect and its cost.

## 4. Species Limits

Each tunable trait has `minimum`, `baseline`, `reviewable_maximum`, units, environment assumptions, resource cost and failure behavior. Limits are not universal constants; they are versioned profile data. Raising a maximum creates a new genome revision and requires balance review.

## 5. Species Examples

| Species family | Inherent examples | Candidate evolutionary GA focus |
|---|---|---|
| Fish | respiration, swimming, feeding, growth, reproduction | feed efficiency, water adaptation, disease resistance, yield quality |
| Oyster | attachment, filtration, growth, reproduction | temperature tolerance, cycle stability, yield and quality |
| Pig | metabolism, movement, feeding, social response | health resilience, feed efficiency, welfare-compatible growth |
| Plant / fruit tree | water/nutrient uptake, photosynthesis, growth, reproduction | flowering, fruiting, sweetness, size, disease tolerance, longevity |
| Digital AI life | process integrity, state persistence, safe shutdown | memory, reasoning, mission, coordination and domain skills |
| Robot | power management, hardware health, actuator safety | perception, navigation, manipulation, engineering and cooperation |

All biological examples are `SIMULATION_ONLY`.

## 6. Ownership Boundary

Species owner, blueprint creator, individual owner, operator and license holder are separate roles. Owning an individual does not confer ownership of its species genome or another creator's confidential blueprint.
