# Sprint 010 Cosmic Technology Product Contract

## Decision

- Human Decision: `HUMAN-SPRINT-010-COSMIC-TECHNOLOGY`
- Task: `KAIOS-WV-SPRINT-010`
- Scope: executable synthetic Alpha under the frozen World Viewer architecture
- Base: `9a21ac6ee4cbaa52c69eaa66e7ac8e06ff9a670d`
- Architecture order: Architecture Contract, implementation, evidence, review, merge

## Source Audit

Sprint 010 extends the existing Civilization, Nation, Resource, Biology, and Timeline product runtimes. It does not replace Universe Physics, Universe Map, Kernel, Life OS, Settlement, Governance, Cambrian, Nation, or Timeline CURRENT sources.

| Source | Authority | Imported boundary |
|---|---|---|
| `KGEN-KAIOS/world-viewer/civilization/civilization-runtime.js` | Current product runtime | Product orchestration, bounded persistence, and synthetic Civilization state |
| `KGEN-KAIOS/world-viewer/nation/resource-economy-runtime.js` | Current product runtime | Finite synthetic Planet Resource reserves and conservation |
| `KGEN-KAIOS/world-viewer/timeline/timeline-runtime.js` | Current product runtime | Isolated era travel records and canonical-history protection |
| `KGEN-KAIOS/world-viewer/timeline/pocket-time-ufo-runtime.js` | Current product runtime | Existing sole Timeline transport and checksum gate |
| `KGEN-KAIOS/world-viewer/biology/evolution-runtime.js` | Current product runtime | Evidence-gated growth without fixed identity or direct Canon mutation |
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | Protected CURRENT | K-Sphere, coordinate, energy, vehicle, and Civilization context; read only |
| `docs/maps/README.md` | CURRENT selector | Selects the historical V10.2 shared map; read only |
| `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json` | Protected historical/current map | Coordinate evidence only; never parsed as mutable product state |
| `whitepaper/KGEN Cosmic Coordinate & Anti-Gravity Engine Whitepaper V1.2 Genesis Unified Edition.md` | Cumulative research source | Concept reference only; no whitepaper modification |
| `KGEN-KAIOS/world-viewer/WORLD_VIEWER_V1_ARCHITECTURE_BASELINE.md` | Frozen baseline | Untrusted client, synthetic data, proposal-only mutation, responsive UI |

No equivalent executable Technology Tree exists in the World Viewer. Sprint 010 therefore adds one subordinate `technology/` product package instead of creating a second Kernel, Canon, map, or governance source.

## Runtime Ownership

| Runtime | Owns | Must not own |
|---|---|---|
| Technology Tree | Fourteen-age DAG, node prerequisites, unlock state | Research facilities, material stock, energy stock, Canon coordinates |
| Research | Research Center, Laboratory, University, Scientist, Engineer, Knowledge Library, Technology Archive, Research Points, Civilization Experience | Automatic unlocks, salaries, real institutions |
| Cosmic Material | Twelve synthetic materials, Planet availability, reserve and stock accounting | CURRENT Physics interpretation, real mining, real nuclear material |
| Energy | Eight synthetic energy types, production, storage, consumption, capacity | Real power systems, real nuclear engineering, Token energy |
| Vehicle | Nine vehicle blueprints, construction gates, fleet state | Timeline authority, map mutation, real vehicles |
| Special Ability | Nine ability profiles, prerequisites, evidence, activation state | Initial player powers, real surveillance, unrestricted cloning |
| Cosmic Coordinate | Data-driven Planet, Civilization, Temple, Portal, Timeline Gate, Gravity Well, and Special Coordinate records | Universe Map CURRENT, physics law, ownership authority |
| Space Exploration | Discovery, route, survey, colony plan, and mission records | Real navigation, automatic territory ownership, production travel |
| Cosmic Technology | Cross-runtime orchestration and read model | Duplicate ledgers or bypasses around component gates |

## Technology Tree

The ordered Civilization ages are:

1. `STONE_AGE`
2. `BRONZE_AGE`
3. `IRON_AGE`
4. `INDUSTRIAL_AGE`
5. `ELECTRICAL_AGE`
6. `COMPUTER_AGE`
7. `AI_AGE`
8. `QUANTUM_AGE`
9. `ANTI_GRAVITY_AGE`
10. `WARP_AGE`
11. `TIMELINE_AGE`
12. `INTERSTELLAR_AGE`
13. `DIMENSIONAL_AGE`
14. `MULTIVERSE_AGE`

The tree is a versioned directed acyclic graph. Every node declares `technology_id`, `age_id`, `prerequisites`, `research_points_required`, `knowledge_required`, `civilization_level_required`, `material_requirements`, `energy_requirements`, `unlocks`, `risk_class`, and `status`. An age is a progression label, never a free capability bundle.

## Research and Unlock Contract

Research contribution requires a registered synthetic facility, eligible role, Knowledge Library, and positive bounded Research Points. Civilization Experience is observed by the unlock gate but cannot replace research evidence.

Every unlock evaluates all five mandatory dimensions:

1. Research Points and prerequisite technologies.
2. Knowledge level and archived evidence.
3. Civilization level or stage.
4. Required material stock.
5. Required energy reserve.

Missing data is `UNKNOWN` or `BLOCKED`; no high technology is granted by default. Unlock consumes the configured material and energy budget once, writes append-only audit evidence, and never mutates protected state.

## Cosmic Material and Energy

The material catalog is `IRON`, `COPPER`, `GOLD`, `DIAMOND`, `METEORITE`, `URANIUM`, `RARE_EARTH`, `DARK_MATTER`, `ANTI_MATTER`, `EXOTIC_MATTER`, `TIMELINE_CRYSTAL`, and `WARP_CRYSTAL`.

The energy catalog is `FIRE`, `ELECTRICITY`, `NUCLEAR`, `FUSION`, `ANTI_GRAVITY_ENERGY`, `DARK_ENERGY`, `ANTI_MATTER_ENERGY`, and `TIMELINE_ENERGY`.

Each record includes Planet availability, discovery state, stock, capacity, production or collection source, hazard class, simulation boundary, and audit history. `URANIUM`, `ANTI_MATTER`, and every advanced energy remain abstract game resources; the product contains no real extraction, enrichment, reaction, weapon, or laboratory instructions. Material and energy balances cannot become negative or exceed capacity.

## Vehicle Contract

The blueprint catalog is `HORSE`, `SHIP`, `AIRCRAFT`, `ROCKET`, `SPACECRAFT`, `GOLDEN_CLOUD`, `POCKET_TIME_CLOAKED_UFO`, `WARP_SHIP`, and `TIMELINE_VEHICLE`.

Construction requires its technology node, materials, energy, Civilization level, evidence, and review. `TIMELINE_VEHICLE` is a generic research archetype and has no Timeline travel authority. `POCKET_TIME_CLOAKED_UFO` remains the only executable Timeline transport. No vehicle is a real design or navigation system.

## Special Ability Contract

The catalog is `TRANSFORMATIONS_72`, `TRANSFORMATIONS_108`, `THIRD_EYE`, `CLONE`, `INVISIBILITY`, `AVATAR`, `MIND_COMMUNICATION`, `TIMELINE_NAVIGATION`, and `REALITY_MAPPING`.

Abilities are synthetic capability profiles unlocked by Technology, Research, Knowledge, Civilization, Material, Energy, Species compatibility, evidence, and review. They are not player defaults. `CLONE` creates only a reviewed sandbox proposal; `THIRD_EYE`, `MIND_COMMUNICATION`, `INVISIBILITY`, and `REALITY_MAPPING` do not access real cameras, minds, identities, private coordinates, or external systems.

## Pocket Time Cloaked UFO V2

V2 consumes shared Technology Runtime state instead of maintaining an independent technology truth. Construction fails closed unless all six gates pass:

1. `ANTI_GRAVITY_TECHNOLOGY`
2. `WARP_TECHNOLOGY`
3. `TIMELINE_TECHNOLOGY`
4. Special Material package
5. `AI_NAVIGATION`
6. `SHAPE_SHIFT_CAPABILITY`

The existing checksum, Nation, Civilization, energy, sole-transport, and canonical-history isolation invariants remain. V1 persistence is not overwritten; V2 uses a new schema and namespace.

## Cosmic Coordinate Contract

Coordinates are fixture data, never hardcoded action logic. Each record declares:

`coordinate_id`, `coordinate_type`, `planet_id`, `civilization_id`, `k_anchor`, `latitude_deg`, `longitude_deg`, `altitude_m`, `timeline_id`, `gravity_profile`, `travel_rules`, `source_class`, `canonical_reference`, `discovery_status`, `visibility`, `version`, and `status`.

Allowed coordinate types are `PLANET`, `CIVILIZATION`, `TEMPLE`, `PORTAL`, `TIMELINE_GATE`, `GRAVITY_WELL`, and `SPECIAL_COORDINATE`. Synthetic coordinates can reference K280, K411, K1852, K11520, K12345, and K16888, but they do not revise the protected map or establish ownership.

## Space Exploration Contract

The product supports `PLANET_DISCOVERY`, `SPACE_ROUTE`, `RESOURCE_SURVEY`, `COLONY_PLANNING`, and `DEEP_SPACE_MISSION`. The flow is:

`Research -> Coordinate Discovery -> Route Check -> Vehicle Check -> Energy Check -> Survey -> Evidence -> Review -> Mission Record`

Colony planning creates a non-authoritative proposal only. Discovery does not grant land, sovereignty, resources, or legal rights. Routes are synthetic and cannot guide real navigation.

## State, Failure, and Compatibility

- All state is bounded, versioned, local, synthetic, and recoverable.
- Every mutation records causation, evidence, review status, and revision.
- Component checks fail closed before cross-runtime mutation.
- Unlock, construction, activation, and travel are idempotent where appropriate.
- Existing Sprint 001-009 storage namespaces and behavior remain compatible.
- The UI uses progressive disclosure: Research, Tree, Resources, Fleet, Abilities, Coordinates, and Exploration tabs share one responsive Technology workspace.

## Review Gates

Sprint 010 cannot close until all gates pass:

1. Fourteen ordered ages and an acyclic prerequisite graph.
2. All research entities and evidence-gated Research Points.
3. Five-dimension unlock checks with no direct high-tech grant.
4. Twelve materials and eight energies with conservation.
5. Nine vehicle blueprints gated by technology and resources.
6. Nine special abilities absent from initial player state.
7. Pocket Time Cloaked UFO V2 six-gate construction and sole Timeline authority.
8. Seven data-driven coordinate types with no map mutation.
9. Five reviewed exploration activity types.
10. Existing eight integrity suites remain green.
11. Desktop, tablet, Android, iPhone, orientation, theme, accessibility, and performance gates pass.
12. Secret scan and Protected Path violations equal zero.

## Safety Boundary

This is a synthetic Civilization game runtime. It does not implement real nuclear or antimatter engineering, surveillance, cloning, weapons, space navigation, government authority, settlement, asset transfer, timeline travel, or Canon mutation. Runtime CURRENT, Universe Map CURRENT, Kernel CURRENT, Life OS CURRENT, Cambrian CURRENT, Nation CURRENT, Timeline CURRENT, Settlement CURRENT, Governance CURRENT, Token Contract, frozen baselines, private files, and Human Main remain unchanged.
