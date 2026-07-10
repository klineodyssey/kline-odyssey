# KGEN Biological Versioning Audit

## Metadata

| Field | Value |
|---|---|
| VERSION | 1.0 |
| REVISION | 2026-07-11.1 |
| STATUS | BASELINE_AUDIT |
| LAST_UPDATED | 2026-07-11 |
| UPDATED_BY | Codex |
| REVIEWED_BY | Codex |
| SOURCE_COMMIT | e0acc39c6c1b5d5dead5b619ad48c85a85743262 |
| TASK_ID | KGEN-GOV-BIO-2026-0001 |
| CHANGE_REASON | Baseline audit for provenance, file versioning, biological taxonomy, and evolution lineage governance. |
| ANCESTOR | KGEN_MASTER_LIBRARY_INDEX.md |
| SOURCE_OF_TRUTH | TRUE |

## Scope

This audit scans formal and operating text files in P0/P1/P2 scope, with historical and archive files summarized as P3. It does not rewrite all files. First-stage implementation is limited to Boot CURRENT, Machine Canon, KAIOS core standards, WorkOrder/report/review flow, provenance registries, and three organism examples.

## Summary Counts

| Metric | Count | Notes |
|---|---:|---|
| Text files scanned | 1396 | Markdown, JSON, HTML, JS, CSS, YAML, TXT, SOL and formal root files |
| Files with complete taxonomy + canonical/runtime mapping | 8 | Includes new standards, schema, and organism examples |
| Files with partial DNA / organism / taxonomy language | 93 | Need future manifest normalization |
| Files with no detected classification in P0/P1/P2 scope | 648 | Not all require taxonomy; many are office templates or reports |
| Files missing formal metadata in P0/P1/P2 scope | 729 | Requires phased migration |
| Formal-scope files with version-like names | 326 | Many are historical whitepapers, prior runtime versions, reports, and legacy names |
| Taxonomy-like files without canonical/runtime mapping | 2 | Standards discuss taxonomy but are not organism manifests |
| Lineage records without ancestor marker | 0 | For scanned taxonomy-bearing records after baseline |

## 1. Files With Complete Domain / Kingdom / Phylum / Class / Order / Family / Genus / Species

Complete here means the file contains all eight taxonomy levels and also maps species to `canonical_file` and `runtime_entry` or defines that formal requirement.

| Tier | File | Status |
|---|---|---|
| P0 | `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` | Boot-indexed taxonomy rules |
| P0 | `KGEN-Canon/KGEN_CANON_MASTER.json` | Machine Canon points to taxonomy governance |
| P1 | `KGEN-KAIOS/BIOLOGICAL_TAXONOMY_STANDARD.md` | Standard |
| P1 | `KGEN-KAIOS/ORGANISM_MANIFEST_STANDARD.md` | Standard |
| P1 | `KGEN-KAIOS/provenance/ORGANISM_MANIFEST_SCHEMA.json` | Schema |
| P2 | `KGEN-KAIOS/examples/organisms/temple-12345.organism.json` | Temple organism example |
| P2 | `KGEN-KAIOS/examples/organisms/app-kaios-dashboard.organism.json` | App organism example |
| P2 | `KGEN-KAIOS/examples/organisms/land-wild-land.organism.json` | Land organism example |

## 2. Files With Partial DNA / Organism Language

93 files contain partial life, DNA, organism, taxonomy, or species language but do not yet meet full manifest requirements. Typical examples:

- `README.md`
- `KGEN_MASTER_LIBRARY_INDEX.md`
- `KGEN-Canon/KGEN_CANON_MASTER.json`
- `KGEN-KAIOS/EVOLUTION_LINEAGE_STANDARD.md`
- `KGEN-KAIOS/ORGANISM_MANIFEST_STANDARD.md`
- `KGEN-Organization/App/KGEN_APP_LIFE_STANDARD.md`
- `KGEN-Organization/Temple/KGEN_TEMPLE_STANDARD.md`
- `KGEN-Organization/Land/KGEN_LAND_STANDARD.md`
- `KGEN-KAIOS/V8/`
- `KGEN-KAIOS/V8.1/`
- `KGEN-KAIOS/V8.2/`
- `KGEN-KAIOS/V9.0/`

These should be upgraded through targeted WorkOrders, not bulk rewrites.

## 3. Files With No Classification

648 P0/P1/P2-scope text files have no detected taxonomy. This includes many valid non-organism files such as daily workflow docs, department templates, release reports, and route pages. These do not all need full biological manifests. Future work should classify only formal organs, runtime entries, dashboards, schemas, and canonical assets.

## 4. Formal Filenames Containing Version-Like Text

326 formal-scope files contain version-like words or numbers in filenames. Not all are violations: archives, historical whitepapers, release reports, and preserved ancestors may keep version names. Active formal organs should migrate to stable names when they are promoted to CURRENT.

Representative non-archive samples:

- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md` — preserved ancestor; not active CURRENT.
- `KAIOS_V7_ARCHITECTURE_REVIEW.md` — report; should be indexed as historical.
- `KGEN_AI_COMPANY_V6_READINESS_REPORT.md` — report; should be indexed as historical.
- `KGEN_QA_FINAL_REPORT.md` — report; should be indexed as historical.
- `README_V10_30_MASTER_STABLE.md` — historical README snapshot.
- `README_V10_31_MASTER_STABLE_LOCK.md` — historical README snapshot.
- `RELEASE_NOTES_V10_40_4.md` — release record.
- `docs/physics/KGEN_Universe_Physics_Runtime_V3_7.md` and prior versions — historical runtime references; CURRENT remains SSOT.
- `KGEN-KAIOS/V8/`, `V8.1/`, `V8.2/`, `V8.3/`, `V9.0/`, `V9.1/`, `V9.2/`, `V9.3/`, `V10/` — versioned library generation folders, not active organ filenames.

## 5. Content Changed But File Version Not Updated

Repository-wide certainty requires historical per-file provenance and cannot be proven from filename scan alone. This baseline flags a governance gap instead:

- Many operating documents have changed across KAIOS phases but lack `REVISION`, `SOURCE_COMMIT`, `TASK_ID`, and `CHANGE_REASON`.
- First-stage corrected Boot CURRENT and Machine Canon metadata.
- Future WorkOrders must update metadata only for touched formal organs, not all files at once.

## 6. Missing Author / Reviewer / Commit / Task ID

729 P0/P1/P2-scope files lack the full formal metadata set. Early examples include:

- `README.md`
- `KGEN_MASTER_LIBRARY_INDEX.md`
- `KGEN-AI-Company/AI_COMPANY_OPERATING_SYSTEM.md`
- `KGEN-AI-Company/CODEX_DISPATCHER_PROTOCOL.md`
- `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md`
- `KGEN-AI-Company/WORKSPACE_POLICY.md`
- `KGEN-Canon/KGEN_DOCUMENT_INDEX.json`
- `KGEN-Canon/KGEN_RUNTIME_INDEX.json`
- `KGEN-Canon/KGEN_SDK_INDEX.json`

These should be fixed by tier:

- P0 first: Boot, Canon, Runtime CURRENT index records.
- P1 second: KAIOS and AI Company operating documents.
- P2 third: Temple/App/Land/Economy manifests and active dashboards.
- P3 last: historical and archive references.

## 7. Species Without Canonical File

After this baseline, formal organism examples all include `canonical_file`. Two standards contain taxonomy terms without organism canonical fields because they are standards, not species manifests:

- `KGEN-KAIOS/BIOLOGICAL_TAXONOMY_STANDARD.md`
- `KGEN-KAIOS/ORGANISM_MANIFEST_STANDARD.md`

This is acceptable. Future machine validation should apply strict canonical-file checks only to organism manifest files.

## 8. Lineage Without Ancestor

No scanned taxonomy-bearing records lack an ancestor marker after this baseline. The standard requires either `ANCESTOR`, `ancestor_versions`, or lineage context.

## Tiered Remediation Plan

### P0 Core Boot / Canon / Runtime

| Item | Decision |
|---|---|
| `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md` | Metadata and governance index added |
| `KGEN-Canon/KGEN_CANON_MASTER.json` | Machine Canon governance links added |
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | Not modified; future Human-approved metadata WorkOrder required |
| `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md` | Preserved ancestor; no rewrite |

### P1 KAIOS / AI Company

| Item | Decision |
|---|---|
| `KGEN-KAIOS/` | Standards, schemas, registries and examples added |
| `KGEN-AI-Company/` | Reporting and review rules updated |
| `KGEN-Organization/WorkOrders/` | WorkOrder source tracking added |
| `KGEN-Agent-Office/` | Cursor report template updated |

### P2 Temple / App / Land / Economy

| Item | Decision |
|---|---|
| Temple 12345 | Example manifest only; protected path not modified |
| KAIOS Dashboard App | Example manifest added |
| Wild Land | Example manifest added |
| Economy / Exchange / Bank | Future organism manifests recommended |

### P3 Historical / Archive

Historical versioned filenames remain intact until a dedicated archive alias WorkOrder classifies them. Do not bulk rename archives.

## Proposed Next WorkOrders

All suggestions remain `PROPOSED` until Codex reviews and promotes them.

| Suggested ID | Source Type | Priority | Status | Purpose |
|---|---|---|---|---|
| KGEN-GOV-BIO-P0-0002 | QA_FINDING | P0 | PROPOSED | Add metadata to Runtime CURRENT through Human-approved doc-only WorkOrder |
| KGEN-GOV-BIO-P1-0003 | QA_FINDING | P1 | PROPOSED | Add metadata to KAIOS core files touched by future edits |
| KGEN-GOV-BIO-P1-0004 | QA_FINDING | P1 | PROPOSED | Add strict organism manifest validator for `KGEN-KAIOS/examples/organisms/` |
| KGEN-GOV-BIO-P2-0005 | CANON_GAP | P2 | PROPOSED | Create Economy, Exchange, Bank, Citizen organism examples |
| KGEN-GOV-BIO-P3-0006 | ROADMAP | P3 | PROPOSED | Classify versioned historical filenames as Archive / Legacy / Reference Alias |

## Protected Path Result

No protected path files were modified by this audit. Temple 12345 was referenced only through a read-only example manifest.
