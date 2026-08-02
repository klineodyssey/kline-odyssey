# KAIOS Digital Life Implementations

This directory contains bounded implementations that reuse the canonical
schemas and registries under `KGEN-KAIOS`.

## K280

`K280/` implements the simulation-only K280 digital-life MVP. Its first
organism is `KAIOS-RAPTOR-K280-001`.

Public interfaces:

- [KAIOS Full World Viewer](../world-viewer/)
- [K280 World Viewer](../world-viewer/k280/)
- [K280 public data](../api/kaios/k280/)
- [Life Runtime V1](../world-viewer/life-runtime/)
- [Life Runtime V1 public data](../api/kaios/life-runtime-v1/)
- [Forest and Agriculture Runtime V1 specification](life/forest-agriculture/KAIOS_FOREST_AGRICULTURE_RUNTIME_V1_SPEC.md)
- [Forest and Agriculture Cursor queue](life/forest-agriculture/KAIOS_CURSOR_CONTINUOUS_WORK_QUEUE.json)
- [Forest candidate Codex review closeout](life/forest-agriculture/KAIOS_CURSOR_FOREST_LIFE_PACKAGE_REVIEW_CLOSEOUT.md)
- [Crop candidate Cursor work order](life/candidates/forest-agriculture-v1/CURSOR_CROP_LIFE_PACKAGES_WORK_ORDER.md)
- [Forest release and crop dispatch Company Status](../KGEN-KAIOS/governance/autopilot/company_status/COMPANY_STATUS_2026-08-02_FOREST_CANDIDATE_RELEASED_CROP_DISPATCHED.md)
- [Crop candidate Codex review closeout](life/forest-agriculture/KAIOS_CURSOR_CROP_LIFE_PACKAGE_REVIEW_CLOSEOUT.md)
- [Fruit tree candidate Cursor work order](life/candidates/forest-agriculture-v1/CURSOR_FRUIT_TREE_PACKAGES_WORK_ORDER.md)
- [Crop release and fruit tree dispatch Company Status](../KGEN-KAIOS/governance/autopilot/company_status/COMPANY_STATUS_2026-08-02_CROP_CANDIDATE_RELEASED_FRUIT_TREE_DISPATCHED.md)
- [Fruit tree candidate Codex review closeout](life/forest-agriculture/KAIOS_CURSOR_FRUIT_TREE_PACKAGE_REVIEW_CLOSEOUT.md)
- [Vegetable candidate Cursor work order](life/candidates/forest-agriculture-v1/CURSOR_VEGETABLE_PACKAGES_WORK_ORDER.md)
- [Fruit tree release and vegetable dispatch Company Status](../KGEN-KAIOS/governance/autopilot/company_status/COMPANY_STATUS_2026-08-02_FRUIT_TREE_RELEASED_VEGETABLE_DISPATCHED.md)
- [Vegetable candidate Codex review closeout](life/forest-agriculture/KAIOS_CURSOR_VEGETABLE_PACKAGE_REVIEW_CLOSEOUT.md)
- [Soil type candidate Cursor work order](life/candidates/forest-agriculture-v1/CURSOR_SOIL_TYPES_WORK_ORDER.md)
- [Vegetable release and soil types dispatch Company Status](../KGEN-KAIOS/governance/autopilot/company_status/COMPANY_STATUS_2026-08-02_VEGETABLE_RELEASED_SOIL_TYPES_DISPATCHED.md)
- [Soil type candidate Codex review closeout](life/forest-agriculture/KAIOS_CURSOR_SOIL_TYPES_REVIEW_CLOSEOUT.md)
- [Fertilizer model Cursor work order](life/candidates/forest-agriculture-v1/CURSOR_FERTILIZER_MODELS_WORK_ORDER.md)
- [Soil release and fertilizer dispatch Company Status](../KGEN-KAIOS/governance/autopilot/company_status/COMPANY_STATUS_2026-08-02_SOIL_TYPES_RELEASED_FERTILIZER_MODELS_DISPATCHED.md)
- [Fertilizer model Codex review closeout](life/forest-agriculture/KAIOS_CURSOR_FERTILIZER_MODELS_REVIEW_CLOSEOUT.md)
- [Compost model Cursor work order](life/candidates/forest-agriculture-v1/CURSOR_COMPOST_MODELS_WORK_ORDER.md)
- [Fertilizer release and compost dispatch Company Status](../KGEN-KAIOS/governance/autopilot/company_status/COMPANY_STATUS_2026-08-02_FERTILIZER_RELEASED_COMPOST_MODELS_DISPATCHED.md)
- [Compost model Codex review closeout](life/forest-agriculture/KAIOS_CURSOR_COMPOST_MODELS_REVIEW_CLOSEOUT.md)
- [Insect candidate Cursor work order](life/candidates/forest-agriculture-v1/CURSOR_INSECT_CANDIDATES_WORK_ORDER.md)
- [Compost release and insect dispatch Company Status](../KGEN-KAIOS/governance/autopilot/company_status/COMPANY_STATUS_2026-08-02_COMPOST_RELEASED_INSECT_CANDIDATES_DISPATCHED.md)
- [Insect candidate Codex review closeout](life/forest-agriculture/KAIOS_CURSOR_INSECT_CANDIDATES_REVIEW_CLOSEOUT.md)
- [Pollinator research Cursor work order](life/candidates/forest-agriculture-v1/CURSOR_POLLINATOR_RESEARCH_WORK_ORDER.md)
- [Insect release and pollinator dispatch Company Status](../KGEN-KAIOS/governance/autopilot/company_status/COMPANY_STATUS_2026-08-02_INSECT_RELEASED_POLLINATOR_RESEARCH_DISPATCHED.md)
- [Pollinator research Codex review closeout](life/forest-agriculture/KAIOS_CURSOR_POLLINATOR_RESEARCH_REVIEW_CLOSEOUT.md)
- [Earthworm candidate Cursor work order](life/candidates/forest-agriculture-v1/CURSOR_EARTHWORM_CANDIDATE_WORK_ORDER.md)
- [Pollinator release and earthworm dispatch Company Status](../KGEN-KAIOS/governance/autopilot/company_status/COMPANY_STATUS_2026-08-02_POLLINATOR_RELEASED_EARTHWORM_DISPATCHED.md)
- [Earthworm candidate Codex review closeout](life/forest-agriculture/KAIOS_CURSOR_EARTHWORM_CANDIDATE_REVIEW_CLOSEOUT.md)
- [Fungi candidate Cursor work order](life/candidates/forest-agriculture-v1/CURSOR_FUNGI_CANDIDATE_WORK_ORDER.md)
- [Earthworm release and fungi dispatch Company Status](../KGEN-KAIOS/governance/autopilot/company_status/COMPANY_STATUS_2026-08-02_EARTHWORM_RELEASED_FUNGI_DISPATCHED.md)

## AI Company Order And Project Runtime V1

- [Source crosswalk](ai-company/KAIOS_AI_COMPANY_SOURCE_CROSSWALK.md)
- [Cumulative specification](ai-company/KAIOS_AI_COMPANY_ORDER_PROJECT_RUNTIME_V1_SPEC.md)
- [Aggregate schema](ai-company/KAIOS_AI_COMPANY_SCHEMA_V1.json)
- [Specification validator](ai-company/ai-company-spec-validator.mjs)
- [Test plan](ai-company/KAIOS_AI_COMPANY_RUNTIME_V1_TEST_PLAN.md)
- [Specification closeout](ai-company/KAIOS_AI_COMPANY_SPEC_V1_CLOSEOUT.md)
- [Recovery](../KGEN-KAIOS/governance/autopilot/recovery_points/RECOVERY-KAIOS-AI-COMPANY-SPEC-V1.md)
- [Company Status](../KGEN-KAIOS/governance/autopilot/company_status/COMPANY_STATUS_2026-08-02_AI_COMPANY_SPEC.md)
- [Canonical Runtime](../KGEN-KAIOS/world-viewer/ai-company/ai-company-project-runtime.js)
- [Runtime report](ai-company/KAIOS_AI_COMPANY_ORDER_PROJECT_RUNTIME_V1_REPORT.md)
- [World Viewer report](ai-company/KAIOS_AI_COMPANY_WORLD_VIEWER_REPORT.md)
- [Cursor continuous queue report](ai-company/KAIOS_CURSOR_CONTINUOUS_QUEUE_REPORT.md)
- [Public Viewer](../world-viewer/ai-company-v1/)
- [Read-only public APIs](../api/kaios/ai-company/v1/)
- [Runtime recovery](../RECOVERY-KAIOS-AI-COMPANY-RUNTIME-V1.md)
- [Runtime closeout](../KAIOS_AI_COMPANY_RUNTIME_V1_CLOSEOUT.md)

## Foundational Life Runtime V1

`life/runtime/` executes the eight PR #69 foundational candidates in a
bounded local deterministic simulation. The candidates remain candidate-only;
runtime execution does not promote them to Canonical status or grant
Production Runtime authority.

Review and operations records:

- [Life Runtime V1 specification](life/KAIOS_LIFE_RUNTIME_V1_SPEC.md)
- [Life Runtime V1 report](life/KAIOS_LIFE_RUNTIME_V1_REPORT.md)
- [PR #69 / PR #70 integration decision](life/KAIOS_PR69_PR70_INTEGRATION_DECISION.md)
- [Recovery point](../RECOVERY-KAIOS-LIFE-RUNTIME-V1.md)
- [Closeout](../KAIOS_LIFE_RUNTIME_V1_CLOSEOUT.md)

Canonical registry and policy sources remain under `KGEN-KAIOS`. Nothing in
this directory activates Production Runtime, a wallet, real KGEN settlement,
or real-world biological engineering.

## Software Life Canonicalization

`software-life/` contains the version-free software-life naming audit,
identity and taxonomy compatibility standards, deterministic Manifest and
Registry, organ and transplant governance, controlled rename plan and rolling
execution evidence. The current packages are non-executing governance: no
executable or public route is renamed and no transplant occurs until its
dedicated migration or integration batch passes review and compatibility tests.

- [Software Life center](software-life/README.md)
- [Naming audit report](software-life/KAIOS_SOFTWARE_LIFE_NAMING_AUDIT_REPORT.md)
- [Identity standard](software-life/KAIOS_SOFTWARE_LIFE_IDENTITY_STANDARD.md)
- [Manifest schema](software-life/KAIOS_SOFTWARE_LIFE_MANIFEST_SCHEMA.json)
- [Software Life Registry](software-life/KAIOS_SOFTWARE_LIFE_REGISTRY.json)
- [Registry report](software-life/KAIOS_SOFTWARE_LIFE_REGISTRY_REPORT.md)
- [Software Organ standard](software-life/KAIOS_SOFTWARE_ORGAN_STANDARD.md)
- [Organ transplant standard](software-life/KAIOS_SOFTWARE_ORGAN_TRANSPLANT_STANDARD.md)
- [Organ compatibility schema](software-life/KAIOS_SOFTWARE_ORGAN_COMPATIBILITY_SCHEMA.json)
- [Typed gate evidence fixture](software-life/evidence/SOFTWARE_ORGAN_GATE_EVIDENCE_FIXTURE.json)
- [Organ transplant semantic validator](software-life/tools/validate-software-organ-transplant.mjs)
- [Rename plan](software-life/KAIOS_SOFTWARE_LIFE_RENAME_PLAN.json)
