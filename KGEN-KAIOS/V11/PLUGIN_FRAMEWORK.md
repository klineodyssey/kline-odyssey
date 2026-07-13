---
VERSION: "11.0-design"
REVISION: "2026-07-13.1"
STATUS: "DRAFT_FOR_HUMAN_REVIEW"
DESIGN_PHASE: "GENESIS_DESIGN"
IMPLEMENTATION_STATUS: "NOT_STARTED"
DEPLOYMENT_STATUS: "NOT_STARTED"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "PENDING_HUMAN_REVIEW"
SOURCE_COMMIT: "PENDING_HUMAN_REVIEW"
BASE_COMMIT: "1d6de8cb3b16983f923fb2a88514cef54328f2c5"
TASK_ID: "KAIOS-V11-GENESIS-DESIGN-20260713"
HUMAN_APPROVAL_ID: "HUMAN-V11-GENESIS-001"
CHANGE_REASON: "Define a provider-neutral AI plugin architecture."
ANCESTOR: "KGEN-KAIOS/V10/PLUGIN_STANDARD.md"
SOURCE_OF_TRUTH: false
Domain: "KGEN"
Kingdom: "KAIOS"
Phylum: "Plugin Runtime"
Class: "Framework Standard"
Order: "Provider Adapter"
Family: "V11 Genesis Design"
Genus: "AI Plugin"
Species: "KGEN-KAIOS/V11/PLUGIN_FRAMEWORK.md"
---

# KAIOS V11 AI Plugin Framework

## 1. Objective

The Plugin Framework lets any compliant AI provider or Agent platform connect to KAIOS through a common contract. Core civilization logic depends on KAIOS capabilities, not provider-specific prompts or SDK calls.

Initial target classes are ChatGPT, Codex, Cursor, Claude, Gemini, OpenHands and GitHub Copilot. Their names identify adapter targets only and do not claim partnership, endorsement or production integration.

## 2. Framework Components

```text
Provider / Agent Platform
-> Provider Adapter
-> Plugin Sandbox
-> Capability Broker
-> KAIOS Plugin API
-> Agent Runtime
-> Mission / Evidence / Review
```

| Component | Responsibility |
|---|---|
| Plugin Registry | identity, version, publisher and status |
| Manifest Validator | schema, compatibility and permission validation |
| Provider Adapter | translate KAIOS requests to provider protocol |
| Capability Broker | issue scoped, expiring grants |
| Sandbox | isolate filesystem, process, network and secrets |
| Event Adapter | normalize provider events and errors |
| Evidence Collector | record request/result references and tests |
| Health Monitor | availability, latency, quota and failure signals |

## 3. Plugin Types

- `AI_PROVIDER`: model or assistant API adapter;
- `CONSTRUCTION_AGENT`: repository-aware worker such as Cursor/OpenHands;
- `REVIEW_AGENT`: advisory review without merge authority;
- `TOOL_PROVIDER`: browser, testing, data or analysis capability;
- `MEMORY_PROVIDER`: governed storage adapter;
- `DOMAIN_ADVISOR`: Temple, Economy, Security or Research specialist; and
- `HUMAN_INTERFACE`: Human approval and override surface.

One plugin may declare multiple capabilities, but each grant is evaluated separately.

## 4. Lifecycle

```text
DISCOVERED
-> SUBMITTED
-> VALIDATING
-> SANDBOXED
-> APPROVED
-> ENABLED
-> DEGRADED / SUSPENDED
-> DISABLED
-> ARCHIVED
```

Installation does not grant tools. `ENABLED` means the adapter is available for scoped grants, not that it may claim missions autonomously.

## 5. Capability Model

Capabilities use namespaced identifiers:

```text
ai.generate.text
ai.analyze.document
repo.read
repo.write.scoped
git.commit.handoff
browser.read
test.execute.sandbox
report.create
```

Sensitive capabilities such as `git.push.main`, `secret.read`, `wallet.sign`, `contract.deploy` and `production.deploy` are denied to normal plugins. Their appearance in a manifest is not permission.

## 6. Adapter Contract

Every adapter implements these logical operations:

- `describeCapabilities()`;
- `validateConfiguration()`;
- `healthCheck()`;
- `createRuntimeSession()`;
- `executeMissionStep()`;
- `cancelRuntimeSession()`;
- `collectUsage()`;
- `collectEvidence()`; and
- `closeRuntimeSession()`.

The adapter must translate provider errors into KAIOS error classes without hiding the original trace reference.

## 7. Sandbox Boundary

Default sandbox policy:

- isolated workspace;
- no Human Main access;
- read-only Canon and mission inputs;
- write only to declared output paths;
- network denied unless domain allowlisted;
- secrets injected ephemerally and never logged;
- process, time, memory and output limits;
- no direct main push;
- no private-key or wallet signing access; and
- complete tool invocation audit.

## 8. Provider Neutrality

Provider-specific features are expressed as optional capabilities. A mission must declare required capabilities and acceptable fallback behavior. The core cannot require a private provider field.

Adapters may differ in context size, tool support, latency and cost. Scheduling uses declared capability and health data; it must not infer reliability from brand name.

## 9. Version And Compatibility

Compatibility is evaluated across:

- KAIOS API version;
- manifest schema version;
- adapter version;
- provider API version;
- capability version; and
- mission contract version.

Breaking changes require a new API major version and migration plan. Plugin filenames remain fixed; version belongs in manifest metadata.

## 10. Security Review

Review checks publisher identity, package integrity, requested permissions, network domains, data retention, provider terms, dependency risks, prompt/data exfiltration, secret handling, update channel and rollback.

R3 plugins require Human plus Codex review. R4 plugins cannot be enabled.

## 11. Failure Isolation

A failed plugin must not crash the civilization. The Runtime marks the adapter `DEGRADED`, freezes affected sessions, preserves evidence and optionally selects a pre-approved fallback. Provider changes cannot silently alter mission acceptance criteria.

## 12. Status Boundary

- Framework: **DRAFT_FOR_HUMAN_REVIEW**
- Provider adapters: **NOT_IMPLEMENTED**
- External partnerships: **NOT_CLAIMED**
Production installation: **NOT_AUTHORIZED**
