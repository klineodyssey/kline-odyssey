# KAIOS Canonical Organism Source Inventory V0.1

Inventory date: `2026-07-25`

Inventory mode: `READ_ONLY_BEFORE_IMPLEMENTATION`

## Sources

| Area | Source | Classification | Finding |
|---|---|---|---|
| Program-life biology | `docs/biology/KGEN_Civilization_Biology_Runtime_V1_0.md` | CANONICAL | Defines Code, DNA, Cell, Organ, Runtime, lifecycle, death, seed launch, and evolution |
| Genesis biology | `docs/whitepaper/PRIMEFORGE_MULTIVERSE_WHITEPAPER_V2_0_GENESIS.md` | CANONICAL | Defines Code as Life, App as Organism, Species examples, package layout, App exchange, and digital reproduction |
| Eight-rank taxonomy | `KGEN-KAIOS/BIOLOGICAL_TAXONOMY_STANDARD.md` | CANONICAL | Source-of-truth rank and formal Species binding rules |
| Detailed taxonomy | `KGEN-KAIOS/civilization/BIOLOGY_TAXONOMY_STANDARD.md` | EXTENSION | Adds Individual through Expression for a 19-layer detailed view |
| Organism schema | `KGEN-KAIOS/provenance/ORGANISM_MANIFEST_SCHEMA.json` | CANONICAL | Only source-of-truth machine-readable organism schema |
| Organism standard | `KGEN-KAIOS/ORGANISM_MANIFEST_STANDARD.md` | CANONICAL | Human-readable contract for the canonical schema |
| Organism examples | `KGEN-KAIOS/examples/organisms/` | EXAMPLE | Three flat legacy manifests for App, Land, and Temple |
| Species program map | `KGEN-KAIOS/civilization/SPECIES_PROGRAM_MAPPING_STANDARD.md` | EXTENSION | Defines program, manifest, schema, Runtime adapter, capability, version, and lineage mapping |
| Species OS | `KGEN-KAIOS/boot-runtime/SPECIES_OS_STANDARD.md` | PROTOTYPE | Architecture proposal for species-scoped lifecycle and compatibility |
| Genome and mutation | `KGEN-KAIOS/genesis-dna/SPECIES_GENOME_STANDARD.md` | EXTENSION | Defines mutation envelopes, lineage, resource budgets, and ownership separation |
| Digital reproduction | `KGEN-KAIOS/civilization/DIGITAL_LIFE_REPRODUCTION_STANDARD.md` | EXTENSION | Defines compatibility-first digital reproduction and protected data boundaries |
| World lifecycle | `KGEN-KAIOS/life/World_Asset_Life_Specification_V1_0.md` | EXTENSION | Human-approved architecture for lifecycle, energy, maintenance, and asset classes; implementation forbidden |
| World Life Law | `KGEN-KAIOS/life/KAIOS_WORLD_LIFE_LAW.md` | CANONICAL | Governs cross-class Life meaning and rights boundaries |
| App Life | `KGEN-KAIOS/V8.1/APP_ORGANISM_STANDARD.md` | EXTENSION | Defines App identity, lifecycle, runtime, dependencies, and economy role |
| K11520 architecture | `KGEN-KAIOS/life/11520_Exchange_Contract.md` | CANONICAL | Human-approved review-only exchange contract; implementation forbidden |
| K11520 prototype | `KGEN-KAIOS/V8/runtime/HUAGUO_EXCHANGE_11520_RUNTIME.md` | PROTOTYPE | Conceptual exchange Runtime; not settlement authority |
| Viewer taxonomy | `KGEN-KAIOS/world-viewer/biology/taxonomy-standard.js` | PROTOTYPE | Synthetic nine-rank simulation registry and validation |
| Viewer species data | `KGEN-KAIOS/world-viewer/data/synthetic-world.json` | EXAMPLE | Synthetic animals, plants, Apps, companies, AI, and robots |
| Natural Life reconciliation | `KGEN-KAIOS/governance/agents/unique-life-identity-v0.1/KAIOS_LIFE_SPECIFICATION_AND_NATURAL_INSTANTIATION_MODEL_V0_1.md` | CANONICAL | Establishes Path A natural instantiation, Path B authority gating, and Path C formalization |

## Duplicated Definitions

- The eight biological ranks appear in the Biology Runtime, Genesis
  whitepaper, taxonomy standard, viewer code, and PR #49 reconciliation.
- App Life appears in the Genesis whitepaper, V8.1 standard, SDK material, and
  viewer prototype.
- Reproduction appears in the Biology Runtime, Genesis whitepaper, digital
  reproduction standard, Species OS proposal, and Genome standard.

The implementation references these sources. It does not create alternate
meanings for the duplicated terms.

## Conflicts And Reconciliation

1. The viewer uses nine ranks by adding `subspecies`; canonical KAIOS uses the
   eight conventional ranks plus Cell, Organ, Runtime, and Civilization. The
   viewer remains a compatible prototype consumer.
2. The 19-layer standard is more detailed than the twelve-level Life chain.
   It is an extension, not a replacement.
3. The Species Program Mapping standard says Human approval precedes
   activation. Under PR #49 this applies to active/high-risk authority, not to
   every ordinary specification or dry-run organism candidate.
4. Existing flat organism examples do not implement the Genesis package
   structure. They remain valid legacy examples.

## Missing Implementation

- no complete shared organism package
- no version 2.0 Species machine contract
- no Species-to-program existence validation
- no twelve-level machine-readable taxonomy registry
- no package cross-reference validator
- no natural-instantiation dry-run pipeline
- no category-aware reproduction and lifecycle enforcement
- no K11520 right-class compatibility record
