# Sprint 008 Cambrian Explosion Product Contract

## Decision

- Human Decision: `HUMAN-SPRINT-008-CAMBRIAN-EXPLOSION`
- Task: `KAIOS-WV-SPRINT-008`
- Scope: executable synthetic Alpha under the frozen World Viewer architecture
- Base: `345521e62f0cce49d64107e027386c6ec62e4679`

## Source Audit

Sprint 008 extends the existing World Viewer product. It does not replace the Biology architecture, Life OS, Species OS, Planet Runtime, Civilization Runtime, or the Sprint 005 ecosystem simulation.

| Source | Authority | Imported boundary |
|---|---|---|
| `docs/biology/KGEN_Civilization_Biology_Runtime_V1_0.md` | Current biology reference | Taxonomy and digital-life vocabulary |
| `KGEN-KAIOS/BIOLOGICAL_TAXONOMY_STANDARD.md` | Approved architecture reference | Biological and program-organism classification |
| `KGEN-KAIOS/genesis-dna/genesis_atom_catalog.json` | Public architecture catalog | GA identifiers, domains, names, and public capability semantics only |
| `KGEN-KAIOS/world-viewer/ecosystem/ecosystem-runtime.js` | Current product runtime | Population, food-chain energy, health, and extinction state |
| `KGEN-KAIOS/world-viewer/planet/planet-environment-runtime.js` | Current product runtime | Planet profiles and environment compatibility |
| `KGEN-KAIOS/life/LIFE_OS_ARCHITECTURE_BASELINE.md` | Frozen architecture | Life-maintenance boundary; unchanged |

The Genesis Atom catalog remains a public architecture reference, not a Runtime CURRENT or authoritative registry. Sprint 008 consumes its public catalog fields without importing private thresholds or Heaven Secret data.

## Runtime Ownership

- `biology/taxonomy-standard.js` owns the nine-rank product taxonomy contract and deterministic category mapping.
- `biology/genome-runtime.js` owns immutable synthetic Genome, DNA, Gene, Chromosome, Mutation, Inheritance, Trait, and Life Cycle projections.
- `biology/evolution-runtime.js` owns Evolution XP, Training Level, unlocked Genesis Capability Atoms, evidence-gated pathway progress, and the non-role-based civilization potential score.
- `biology/biology-runtime.js` owns the Species Registry, reproduction proposals, species history, fossils, evolution tree, Cambrian timeline, and planet ecology projections.
- The existing Ecosystem Runtime remains the population and Food Chain authority. Sprint 008 upgrades its trophic vocabulary to Food Chain V2 and synchronizes extinction observations into Biology history.

## Classification Contract

Every registered Species has exactly one non-empty value for:

```text
Domain -> Kingdom -> Phylum -> Class -> Order -> Family -> Genus -> Species -> Subspecies
```

The registry covers Animal, Plant, Fungus, Microorganism, Human, AI Organism, App Organism, Company Organism, Robot, and an explicitly unknown Future Species. Synthetic names are simulation identifiers and make no claim about real taxonomy or legal identity.

## DNA And Evolution

Every Species record references a synthetic Genome containing DNA, Genes, Chromosomes, Mutations, Inheritance, Traits, and Life Cycle. Runtime actions never perform real genetic engineering. Mutation, Selection, Adaptation, Learning, Civilization, Technology, and AI are bounded simulation pathways.

Genesis Capability Atoms have capacity `0..108`. Atom count is not power, morality, caste, identity, Evolution XP, or Training Level. Unlocking requires pathway progress, evidence, dependencies, tests, species compatibility, and available capacity. No role has a fixed atom count.

## Food Chain V2

The existing energy-flow simulation supports Producer, Herbivore, Carnivore, Omnivore, Predator, Scavenger, and Decomposer roles. Population balance remains constrained by food, water, oxygen, temperature, disease stress, carrying capacity, and decomposer recovery. Missing resources reduce health and can produce extinction; the Runtime cannot alter real populations.

## Reproduction And Extinction

Natural `MATE`, `EGG`, and `BIRTH` events create bounded synthetic lineage records only after compatibility, habitat, population, and evidence checks. `CLONE` and `ARTIFICIAL_BREEDING` remain proposal-only and non-executable. Extinction is imported from observed Ecosystem population state and produces append-only Species History and Fossil records; users cannot directly mark a Species extinct.

## Planet Ecology

Earth, Moon, Mars, Jupiter, and Future Planet profiles are evaluated against atmosphere, gravity, temperature, radiation, water, oxygen, and food. Results are `COMPATIBLE`, `BASE_REQUIRED`, `NOT_SURVIVABLE`, or `UNKNOWN_REVIEW_REQUIRED`. Planet profiles remain canonical in the existing Planet Runtime.

## Civilization Evolution

Any Species may accumulate compatible abilities through verified pathways. Civilization potential is a readiness projection based on learning, cooperation, technology, environment, and active capability atoms. It never assigns a permanent role, guarantees evolution, or bypasses Life OS, resource, review, or Human authority.

## Safety Invariants

1. All data and actions are local, public, synthetic, and non-authoritative.
2. Real genetic engineering, laboratory protocols, pathogens, biological weapons, medical claims, and real breeding instructions are forbidden.
3. Clone and artificial breeding remain `PROPOSAL_ONLY_REVIEW_REQUIRED`.
4. Registry identifiers are unique and old history is append-only and bounded.
5. Population and planet state are imported from their existing runtimes, not redefined.
6. GA capacity never exceeds 108 and atom unlocks never define identity or fixed character roles.
7. Runtime CURRENT, Universe Map CURRENT, Kernel CURRENT, Life OS CURRENT, Settlement CURRENT, Governance CURRENT, Token Contract, and all protected paths remain unchanged.

## UI Contract

The Civilization Inspector adds a `Biology` tab for registry coverage, taxonomy, Genome/DNA, capability evolution, reproduction boundaries, fossils, and planet ecology. The existing `Ecology` tab displays Food Chain V2 roles and population balance. Desktop, tablet, Android, and iPhone layouts retain current responsive behavior.

## Review Gates

- Strict JSON and JSONL validation.
- ES module syntax and import graph validation.
- Existing Runtime, Genesis, Production, Settlement, Governance, and Civilization integrity suites.
- New Biology, Genome, Evolution, Reproduction, Food Chain V2, Fossil, and Planet Ecology integrity tests.
- Browser Product QA on desktop, tablet, Android, and iPhone.
- Accessibility, responsive layout, safe-area, screenshot-diff, performance, broken-link, console, secret, and protected-path checks.
