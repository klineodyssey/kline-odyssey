# KAIOS Software Life

Status: `SIMULATION_ONLY / CONTROLLED_MIGRATION`

This directory owns the reviewed compatibility layer that treats KAIOS
software as broad life while preserving the existing Canonical Life,
Organism Manifest, taxonomy, Physics, Rights and Genome authorities.

## Naming and Identity

- `KAIOS_SOFTWARE_LIFE_NAMING_AUDIT.json`: complete tracked-file and JSON
  identity audit at its recorded source commit.
- `KAIOS_SOFTWARE_LIFE_NAMING_AUDIT_REPORT.md`: human-readable audit result.
- `KAIOS_SOFTWARE_LIFE_RENAME_PLAN.json`: dependency-aware migration plan;
  every entry begins `PLANNED_NOT_EXECUTED`.
- `KAIOS_SOFTWARE_LIFE_IDENTITY_STANDARD.md`: stable identity and version
  placement rules.
- `KAIOS_SOFTWARE_LIFE_TAXONOMY_CROSSWALK.json`: exact reuse of the existing
  twelve-level and 19-layer taxonomy owners.
- `tools/audit-software-life-names.mjs`: version-free reproducible audit tool.

## Manifest and Registry

- `KAIOS_SOFTWARE_LIFE_MANIFEST_SCHEMA.json`: compatibility manifest that
  requires stable Life, Species and Genome IDs, taxonomy, organs, interfaces,
  rights, lifecycle, provenance, hashes and denied production authorities.
- `KAIOS_SOFTWARE_LIFE_REGISTRY.json`: generated registry of authoritative
  applications, Runtimes, viewers, schemas, workers and read-only APIs.
- `KAIOS_SOFTWARE_LIFE_REGISTRY_REPORT.md`: coverage, migration and authority
  review for the generated Registry.
- `tools/generate-software-life-registry.mjs`: deterministic Git-lineage and
  artifact-hash generator.
- `tests/software-life-registry.test.mjs`: identity, taxonomy, ownership,
  dependency, hash, replay and security validation.

## Organs, Interfaces And Transplantation

- `KAIOS_SOFTWARE_ORGAN_STANDARD.md`: complete organ identity, interface,
  resource, energy, lifecycle and compatibility contract.
- `KAIOS_SOFTWARE_ORGAN_TRANSPLANT_STANDARD.md`: fail-closed donor/host review,
  migration, rollback and event-history process.
- `KAIOS_SOFTWARE_ORGAN_COMPATIBILITY_SCHEMA.json`: machine-readable Organ
  Manifest, fourteen-gate compatibility review and transplant record.
- `evidence/SOFTWARE_ORGAN_GATE_EVIDENCE_FIXTURE.json`: fixture-only typed
  gate-attestation bundle for identity-bound negative and replay tests.
- `tools/validate-software-organ-transplant.mjs`: fail-closed cross-record
  identity, evidence, rights, transition, hash-chain and rollback validator.
- `tests/software-organ-standards.test.mjs`: structural and semantic valid and
  invalid fixtures, Registry policy and denied-authority validation.

## Operations

- `KAIOS_AI_WORKFORCE_24H_SCHEDULER.md`: bounded execution and stop policy.
- `KAIOS_AI_WORKFORCE_24H_QUEUE.json`: machine-readable rolling queue.
- `KAIOS_SOFTWARE_LIFE_24H_EXECUTION_LOG.md`: actual work and pause evidence.
- `tests/software-life-naming-audit.test.mjs`: audit, taxonomy and boundary
  validation.

The naming, Registry and organ-governance packages perform no rename, organ
transplant or public-route change. Runtime, CURRENT, Wallet, KGEN, contracts,
Constitution sources and Production authority are outside their write scope.
## Local Composition Research Handoff — 2026-10-06

Status: `STAGE_A_LOCAL_CANDIDATE / PENDING_PARENT_REVIEW`.
Author: `dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER /
HUMAN_AUTHORIZED_2026_10_05`. This is the Human-authorized external-contributor
exception, not a Worker/Employee registration or use of `codex-gm-01` identity.

### Boot, owner and source checks

The first repository read was preserved Boot V1.4, followed by Boot CURRENT,
root AGENTS, Company OS/workspace/worker policy, Canon and domain owners. Main
was reverified through `git ls-remote` at
`e26f3a76ef0be7f43058225f46def3fbe123371e`. The implementation is in an isolated
worktree on `dot/life-composition-candidate-20261006`; no other ongoing task's
files are changed. The separate test-only baseline correction is local commit
`1ab35b8453857890e62910a77dff6a564a3ecf38`. The candidate implementation is a
separate local changeset. No push, merge, CI dispatch or browser work is claimed.

The source audit checked the existing Software Life taxonomy/manifest/organ
validator, `core/apps`, Navigation, Audio, world-game, PlayerLife/backend recovery
and Market/Company owners. Current authority remains Boot CURRENT, Physics
CURRENT V3.8 and Life CURRENT. Stale neural references to Physics V1.6 / Boot
V1.2 remain historical; Whitepaper's actual tracked `docs/Whitepaper/` case was
preserved. Existing PR109/112/117 define the immutable Registry/transplant
lineage. Open draft PR159/181/182/190/212/472 and unmerged local Navigator or
CustomerProject work are excluded from this main-based candidate.

No new files were needed, so no new-file index or protected Boot update was
introduced. The same-function search found live composition in
`K線西遊記/temples/11520/runtime/game-5d-main.mjs`, but no pure candidate state,
source-bound contract or reconstruction interface in `core/apps/index.mjs`.
The existing owners were extended narrowly:

- `KAIOS/software-life/KAIOS_SOFTWARE_ORGAN_STANDARD.md` §12 documents this
  candidate contract and its explicit non-admission boundary.
- `KAIOS/software-life/tools/validate-software-organ-transplant.mjs` adds
  `validateSoftwareCompositionCandidate` and a candidate digest helper, reusing
  the existing schema subcontracts and Git/hash functions. Its formal validator,
  fourteen gates and epoch are unchanged.
- `core/apps/index.mjs` adds pure bounded candidate create/advance/export/
  reconstruct functions. There are no global listeners, timers, imports of the
  live game bootstrap, or page integration changes.
- `KAIOS/software-life/tests/software-organ-standards.test.mjs` adds candidate
  fixtures and tests; fixtures never become formal Registry records.

### Donor source bounds

All three primary donors and their local ESM dependency closure are bound to
`e26f3a76ef0be7f43058225f46def3fbe123371e`. Working bytes must match pinned Git
bytes. The 11-file closure is assembled from the source commit by the test fixture
and checked by the validator; no remote code or JSON-provided code is executed.

| Role / path | Git blob | Byte SHA-256 |
|---|---|---|
| Navigation: `K線西遊記/temples/11520/runtime/xyz-map-navigation-runtime.mjs` | `7833a4f19249c45dc9ad14a2e369d8223db8f840` | `e1365b101dc942e02975b4df17760caa632f4ebcf111191e7b64f9bb59741c5e` |
| Game: `K線西遊記/temples/11520/runtime/world-runtime.mjs` | `4fbd285c400044afeb82db95b6a17b9697ddf606` | `f46e11484688c1612da3770405be86a0effb74dcc21b0628edab01b6708fc2d5` |
| Audio: `assets/kaios-audio.mjs` | `711fee90637b2e7983dc430a6dbd79dadd2a418d` | `a285dada9cc571b62fc76d8cb93b76c35a7c496d70589acceafcdfa2cb3629e8` |

### Demonstrated scope and open work

The candidate composes the existing Navigation vector into world collision,
records a deterministic bounded game event, and exercises the existing Audio
owner through an injected silent test host. Audio remains silent before gesture
and while muted; no AudioContext is serialized. Source/taxonomy/DNA/RNA/version/
dependency/permission/hash negatives, replay denial, append-only exact-position
rollback and JSON reconstruction are included. The existing world serializer
and seeded loot are exercised without browser listeners or financial activity.

Formal admission remains negative for all three donors in the unchanged
33-Life epoch. This is not a completed organ transplant, certified App, listed
asset, birth, title, NFT, Market transaction or backend recovery receipt.

Still separate and unimplemented in this slice:

1. A reviewed epoch evolution/admission mechanism and source-backed full donor
   contracts with all fourteen formal gates, actual capacity/energy evidence,
   separated usage rights and the later Registry projection sequence.
2. A typed composite projection/migration in the existing backend and PlayerLife
   recovery owners after the active data-integrity work is stable. Backend schema2
   is not widened and no durable composite storage is claimed.
3. Existing Market/Asset/permissions and CustomerProject owner extensions for a
   software-license LOCAL_DRAFT candidate and bounded quote/buy/sell simulation.
   No second marketplace or ownership system is introduced.
4. Any live UI integration and same-candidate functional plus screenshot review.
   This local pure slice changes no live page; browser/visual QA was not run.

The broader M1 remains open. Stage A stops at parent review before publication.

### Local verification and pre-existing test drift

The pristine source epoch was tested in a separate detached baseline worktree:
87 tests, 85 passed, 2 failed. Both failures were stale Cursor expectations:

- `tests/software-life-naming-audit.test.mjs` expected `IDLE_NO_CURRENT_TASK`
  instead of the current `ON_DEMAND_EXTERNAL_CAPACITY_ONLY_SUSPENDED` queue.
- `tests/software-organ-standards.test.mjs` expected the actual suspended/offline
  Cursor to remain authorized under its historical maximum authority.

The separately reviewed test-only commit above corrects those expectations,
asserts the actual Human suspension is denied, and uses an explicitly synthetic
historical clone for the positive control and independent OFFLINE/BLOCKED/
suspension negatives. No Registry, queue, gate or authorization function changes.
The baseline failures remain recorded as baseline evidence, not silently relabeled.

Final local candidate checks (Node v24.19.0):

| Check | Result |
|---|---|
| Software Organ/Life/Registry + Audio + Navigation suites | 108/108 passed, including 21 candidate tests |
| `tests/universal-exchange.test.mjs` | 258/258 passed |
| `KGEN-KAIOS/world-viewer/tests/canonical_life_spec.test.mjs` | 16/16 passed |
| `KGEN-KAIOS/world-viewer/tests/organism_schema_v2_compatibility.mjs` | 33/33 passed |
| Syntax checks on changed executable/test files | Passed |
| `git diff --check` | Passed |
| Independent read-only adversarial review | Passed after fixes described below |

The independent review found delimiter-colliding object keys, string-field array
coercion and parsed JSON prototype keys. Candidate-only fixes now require exact
own keys and string identities, reject bounded-JSON/prototype/cycle violations,
and pin each donor interface's real port schema, exact ID and cardinality.
Negative regressions cover those cases. The inherited formal schema traversal
and transplant validator remain unchanged; no general formal-validator hardening
is claimed by this candidate work.

These are targeted local checks, not all-repository CI or production readiness.
The pure host-port trust boundary and the limits of content hashes are explicit:
hashes prove consistency with reviewed bytes, not authenticated snapshot approval.

Root review also reproduced a reached destination being labeled `MOVED` because
arrival was read before applying world collision. The correction now evaluates
the existing Navigation semantics at the accepted position in the same command.
Tests cover exact and within-existing-tolerance arrivals, partial/world-clamped/
blocked/detoured steps, reconstruction and rejection of the old RNA contract.
No new arrival threshold or live Navigation change was introduced.
