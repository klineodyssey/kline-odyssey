# K280 Canonical Source Review

Task: `KAIOS-K280-DIGITAL-LIFE-GENESIS-MVP-001`

Status: `PASS_WITH_DOCUMENTED_PRECEDENCE`

## Sources

| Source | Version/status | Classification | Reused role and fields | Conflict and resolution |
|---|---|---|---|---|
| `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md` | V1.4 / CURRENT boot law | CANONICAL | Read order, protected boundaries, no duplicate Runtime | None; read-only |
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | CURRENT | CANONICAL_PROTECTED | World physics reference | No modification |
| `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json` | V10.2 / CURRENT map | CANONICAL_PROTECTED | Coordinate-space reference | K280 uses an isolated habitat and does not alter the map |
| `KGEN-KAIOS/governance/autopilot/company_boot_manifest.json` | V0.1 | CANONICAL | Company boot inputs and operating boundaries | Current pointer is incomplete; explicit Human work order provides the active medium-risk scope |
| `KGEN-KAIOS/governance/autopilot/company_autopilot.json` | current repository record | EXTENSION | Runtime, scheduler, agent, and Cursor status | Stale workline is not treated as authority |
| `KGEN-KAIOS/provenance/ORGANISM_MANIFEST_SCHEMA.json` | Schema V2 | CANONICAL | Organism identity, taxonomy, references, release, integrity, authority | Reused directly; no duplicate organism schema |
| `KGEN-KAIOS/organism/species_registry.json` | Schema V2 registry | CANONICAL | Species program binding and profile references | Extended with one compatible K280 record |
| `KGEN-KAIOS/organism/taxonomy_registry.json` | 12-level plus 19-layer compatibility | CANONICAL | Domain through Civilization and extended ancestry | Extended with one K280 taxonomy record |
| `KGEN-KAIOS/organism/KAIOS_CANONICAL_ORGANISM_V0_1_BASELINE_MERGE_CLOSEOUT.md` | PR #50 baseline | CANONICAL_BASELINE | Natural instantiation, dry-run boundaries, migration rules | K280 uses a local release, never Production Runtime |
| `KGEN-KAIOS/world-viewer/LAND_VIEWER_SCHEMA_V2_COMPATIBILITY_MERGE_CLOSEOUT.md` | PR #52 baseline | EXTENSION | Viewer adapter, read-only safety labels, responsive patterns | K280 adds a separate viewer route without changing land semantics |
| `KGEN-KAIOS/world-viewer/biology/` | Sprint 008 implementation | EXTENSION | Existing genome, taxonomy, biology, and evolution vocabulary | K280 is a species-specific deterministic engine, not a replacement |
| `docs/biology/KGEN_Civilization_Biology_Runtime_V1_0.md` | V1.0 | CANONICAL | Code/Life, DNA/RNA, Cell/Organ, Runtime/Civilization model | Implemented as software-organism semantics only |
| `whitepaper/KGEN_Universe_Civilization_Life_Engine_Whitepaper_V2_0_FULL_ARCHIVE_CONSTITUTION.md` | V2.0 archive constitution | CANONICAL_REFERENCE | Lifecycle and civilization context | No canonical-law rewrite |
| `KGEN-KAIOS/constitution/KAIOS_CONSTITUTION.md` | current | CANONICAL | Rights and authority boundaries | Rights remain separated and non-production |
| `KGEN-KAIOS/boot-runtime/SPECIES_OS_STANDARD.md` | proposal standard | PROTOTYPE_REFERENCE | Species-scoped runtime vocabulary | Does not grant Runtime authority |
| `KGEN-KAIOS/genesis-dna/SPECIES_GENOME_STANDARD.md` | standard | EXTENSION | Genome provenance and integrity | K280 adds deterministic software alleles only |
| `KGEN-KAIOS/civilization/BIOLOGY_TAXONOMY_STANDARD.md` | standard | CANONICAL | Taxonomy names and validation | Preserved |
| `KGEN-KAIOS/civilization/RIGHTS_SEPARATION_STANDARD.md` | standard | CANONICAL | Ownership, custody, operation, use, and authority separation | Reused in organism and listing records |
| `KGEN-KAIOS/life/KAIOS_WORLD_LIFE_LAW.md` | draft law | DRAFT_REFERENCE | Life boundaries and implementation caution | Earlier implementation-not-started wording is superseded only for this Human-authorized sandbox MVP |
| `KGEN-KAIOS/life/11520_Exchange_Contract.md` | architecture-only | CANONICAL_BOUNDARY | Exchange right classes and no-settlement boundary | Listing is simulated and cannot settle |
| `KGEN-KAIOS/governance/agents/unique-life-identity-v0.1/` | PR #49 architecture | CANONICAL_GOVERNANCE | Unique identity, memory, embodiment, wallet, and authority separation | K280 IDs are explicitly scoped to the MVP package |
| `KGEN-KAIOS/governance/agents/unique-life-identity-v0.1/KAIOS_PRIMEFORGE_MOTHER_MACHINE_IDENTITY_BOUNDARY_V0_1.md` | V0.1 | CANONICAL_GOVERNANCE | PrimeForge identity and authority boundaries | K280 does not claim PrimeForge Runtime activation |

## Resolution

No material canonical-source conflict was found. K280 reuses Schema V2 and
the central registries, keeps protected CURRENT files read-only, limits release
to a deterministic local simulation, and preserves all wallet, settlement,
authority, and real-biology prohibitions.
