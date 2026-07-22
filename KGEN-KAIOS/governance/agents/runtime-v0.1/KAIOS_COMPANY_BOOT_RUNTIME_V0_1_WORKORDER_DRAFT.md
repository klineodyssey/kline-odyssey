# KAIOS Company Boot Runtime V0.1 WorkOrder Draft

Status: DRAFT_ONLY
Dispatch: NOT_DISPATCHED
Cursor Claim: NOT_CREATED
Implementation Approval: NOT_GRANTED

## WorkOrder

WorkOrder ID: `KAIOS-COMPANY-BOOT-RUNTIME-V0.1`

Title: Minimum Closed-Loop Company Boot Runtime

Current Main SHA: `68d17fde53f1ce0b4f610ce9e8095e5d93c8cf9a`

Required Recovery Point: `RECOVERY-20260721-KAIOS-AGENT-LIFE-ARCHITECTURE-V1`

## Allowed Scope For Future Implementation

Only after Human approval, implementation may create a minimum local proof for:

- session birth record creation
- identity attestation verification
- capability grant verification
- canonical current-state read
- main SHA verification
- parent handoff read
- current workorder read
- read-only boot audit
- handoff creation
- session archival

## Allowed Paths For Future Implementation

Implementation approval, if later granted, must use only these exact planned paths:

- `KGEN-KAIOS/governance/agents/runtime-v0.1/CURRENT_STATE.example.json`
- `KGEN-KAIOS/governance/agents/runtime-v0.1/AGENT_REGISTRY.example.json`
- `KGEN-KAIOS/governance/agents/runtime-v0.1/SESSION_REGISTRY.example.json`
- `KGEN-KAIOS/governance/agents/runtime-v0.1/lives/README.md`
- `KGEN-KAIOS/governance/agents/runtime-v0.1/sessions/README.md`
- `KGEN-KAIOS/governance/agents/runtime-v0.1/handoffs/README.md`
- `KGEN-KAIOS/governance/agents/runtime-v0.1/evidence/README.md`
- `KGEN-KAIOS/governance/agents/runtime-v0.1/archive/README.md`
- `KGEN-KAIOS/governance/agents/runtime-v0.1/fixtures/README.md`
- `KGEN-KAIOS/governance/agents/runtime-v0.1/fixtures/*.json`
- `KGEN-KAIOS/governance/agents/runtime-v0.1/reports/*.json`
- `KGEN-KAIOS/governance/agents/runtime-v0.1/reports/*.md`
- `KGEN-KAIOS/governance/agents/runtime-v0.1/tools/company_boot_v0_1_verify.py`
- `KGEN-KAIOS/governance/agents/runtime-v0.1/tools/company_boot_v0_1_verify.mjs`

The wildcard entries are limited to test fixtures and generated read-only evidence reports under the named folders. They do not authorize broad repository writes.

## Forbidden Paths

- Runtime CURRENT files
- Universe Map CURRENT files
- `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json`
- token contracts
- wallet files
- bridge files
- product UI files
- WorkQueue dispatch state
- Cursor dispatch state
- deployment configuration
- private or Heaven Secret files

## Deliverables For Future Implementation

- minimum boot runner or documented manual runtime proof
- sample valid boot input
- sample blocked boot inputs
- session birth record sample
- handoff record sample
- evidence record sample
- archived session sample
- validation report

## Acceptance Tests

- happy path boot passes and archives
- 12 failure tests block
- JSON validates
- no secrets in output
- protected paths unchanged
- no commits from runtime execution
- no pushes from runtime execution
- no Cursor dispatch
- no scheduler
- no product modifications
- no automatic PR
- no automatic merge
- no deployment

## PR / Handoff Requirements

Future implementation must use a dedicated implementation branch and draft PR. It must include evidence, blocked-case outputs, protected path verification, and a final handoff.

## Explicit Non-Authorization

This draft does not authorize:

- scheduler
- auto-dispatch
- Cursor dispatch
- product code changes
- token changes
- Real KGEN
- deployment
- merge automation

## Required Human Decision Before Dispatch

Human must explicitly approve implementation before any agent or Cursor receives this WorkOrder.
