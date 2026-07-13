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
CHANGE_REASON: "Define player ownership, governance and lifecycle for AI employees."
ANCESTOR: "KGEN-KAIOS/V10/MEMBERSHIP_STANDARD.md"
SOURCE_OF_TRUTH: false
Domain: "KGEN"
Kingdom: "KAIOS"
Phylum: "Player Runtime"
Class: "Ownership Standard"
Order: "AI Workforce"
Family: "V11 Genesis Design"
Genus: "Player AI"
Species: "KGEN-KAIOS/V11/PLAYER_AI_STANDARD.md"
---

# KAIOS V11 Player AI Standard

## 1. Purpose

The Player AI Standard defines how a Human player may create, recruit, govern, evolve, suspend, retire and archive multiple AI employees. "Player-owned AI" means ownership of the governed KAIOS Agent record, configuration and permitted outputs. It does not imply ownership of an external model, provider infrastructure or intellectual property that the provider retains.

## 2. Canonical Player-Agent Model

```text
Human Owner
-> Player Account
-> Civilization
-> AI Company
-> Department
-> Agent
-> Runtime Instance
-> Mission / Evidence / Review
```

Every Agent belongs to exactly one tenant at a time. Collaboration, leasing or transfer changes operational rights through an auditable agreement; it does not silently rewrite original authorship or history.

## 3. Required Agent Record

| Field | Meaning |
|---|---|
| `agent_id` | immutable KAIOS Agent identifier |
| `owner_id` | Human or governed organization owner |
| `civilization_id` | owning civilization tenant |
| `company_id` | employing AI company |
| `display_name` | player-facing name |
| `agent_type` | provider-neutral category |
| `provider_plugin_id` | active provider adapter |
| `department_id` | primary department |
| `role` | assigned business role |
| `status` | lifecycle state |
| `trust_score` | evidence-based trust metric |
| `rank` | governed progression rank |
| `skill_tree_ref` | approved skills and levels |
| `memory_policy_ref` | retention and source rules |
| `tool_grants` | scoped capabilities |
| `payroll_policy_ref` | prototype compensation policy |
| `attendance_ref` | evidence-backed duty events |
| `mission_history_ref` | accepted and rejected missions |
| `created_at` | immutable creation timestamp |
| `retired_at` | retirement timestamp or null |

No record stores provider tokens, wallet private keys, seed phrases or personal credentials.

## 4. Ownership Rights

Within applicable provider terms and law, the owner may:

- name and classify the Agent;
- assign department, role and approved skills;
- approve or revoke tool grants;
- set mission, cost and risk limits;
- inspect formal memory references and audit history;
- pause, suspend, transfer, retire or archive the Agent;
- export non-secret KAIOS configuration and evidence; and
- decide whether an Agent may be offered for governed lease or collaboration.

Ownership does not permit bypassing Canon, protected paths, provider policy, copyright, privacy, security or legal review.

## 5. Player API Lifecycle

The future Player API supports these commands as reviewed control-plane requests:

| Command | Result | Required review |
|---|---|---|
| `createAgent` | `PENDING_REGISTRATION` record | policy validation |
| `recruitAgent` | link approved provider plugin | provider + permission review |
| `assignDepartment` | update role membership | manager approval |
| `grantTool` | time-bounded capability grant | risk-based review |
| `pauseAgent` | stop new work | owner allowed |
| `resumeAgent` | return to eligible state | health and policy check |
| `transferAgent` | change operational employer | owner + recipient + legal policy |
| `retireAgent` | stop work and preserve history | owner approval |
| `deleteAgent` | create archival tombstone | never erase audit evidence |

The API is a design contract only; no endpoint is deployed in this phase.

## 6. Unlimited Ownership And Resource Limits

A player may conceptually register many Agents, but execution is bounded by:

- subscription or civilization plan;
- provider account limits;
- department quotas;
- concurrent mission limits;
- compute and token budgets;
- risk and review capacity;
- rate limits; and
- abuse prevention.

The UI must distinguish `registered_agents` from `simultaneously_running_agents`.

## 7. Player AI Company

Each AI company defines:

- `company_id`, owner and civilization;
- mission and ethics policy;
- departments and managers;
- hiring and probation rules;
- allowed provider plugins;
- department budgets;
- payroll units;
- review and escalation routes;
- data retention; and
- dissolution / archive rules.

An AI company cannot grant itself higher authority than the owning player's membership or the KAIOS security boundary.

## 8. Recruitment And Trial

```text
PROPOSED
-> IDENTITY_CHECK
-> PLUGIN_VALIDATION
-> SANDBOX_TRIAL
-> REVIEW
-> PROBATION
-> ACTIVE
```

The sandbox trial uses synthetic data and a low-risk mission. Activation requires a valid report, no protected-path attempt and a Human/Codex decision according to risk.

## 9. Transfer, Lease And Marketplace Boundary

V11 may later represent:

- temporary service lease;
- shared advisory access;
- open-source configuration distribution;
- commercial plugin licensing; and
- governed transfer of a KAIOS Agent record.

It must not sell provider accounts, credentials, private memory, personal data or rights the owner does not possess. Every transfer records prior owner, new controller, permitted data, duration, revocation, compensation unit and dispute route.

## 10. Privacy And Memory Rights

- Personal data is minimized and purpose-bound.
- Memory records expose source and retention class.
- Private player context cannot be used to train or serve another tenant without explicit authorization.
- Retirement revokes active access but preserves legally required audit evidence.
- Export and deletion requests are subject to retention, security and dispute holds.

## 11. Human Override

The Human owner may `APPROVE`, `REJECT`, `PAUSE`, `REASSIGN`, `CHANGE_PRIORITY`, `SUSPEND`, `RETIRE` or `ARCHIVE`. Every override records who, when, reason, previous state, new state, affected mission and risk level.

Human ownership does not bypass platform-wide security controls or legal prohibitions.

## 12. Status Boundary

- Ownership model: **DRAFT_FOR_HUMAN_REVIEW**
- Player API: **DESIGN_ONLY**
- Agent marketplace: **CONCEPT**
Real payment or transfer: **NOT_AUTHORIZED**
