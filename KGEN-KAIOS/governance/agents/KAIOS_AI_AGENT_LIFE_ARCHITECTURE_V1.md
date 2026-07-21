# KAIOS AI Agent Life Architecture V1.0

Status: READY_FOR_HUMAN_ARCHITECTURE_REVIEW  
Mode: Architecture only  
Runtime Implementation: NOT_STARTED  
Cursor Dispatch: NOT_DISPATCHED  
WorkQueue Dispatch: NOT_CREATED

## Purpose

KAIOS AI Agent Life defines durable AI work identities, per-session instances, shared repository context, cross-session handoff, and evidence-based performance records. The core correction is that two Codex pages are not automatically one shared mind. They may belong to the same long-term AI life role, but each page is a separate instance that must boot, read shared context, work within authority, leave evidence, and hand off before stopping.

GitHub Repository is the formal:

- Shared Company Memory
- Shared Agent Communication Channel
- Shared Handoff Channel
- Shared Evidence Ledger

Chat memory can help continuity, but it is not the company source of truth.

## Identity Layers

| Layer | Example | Meaning | Must Not Be Mixed With |
|---|---|---|---|
| AI Life ID | `KAIOS-AI-LIFE-CODEX-GM-0001` | Long-term company role life | Session ID, workorder ID, wallet, claim |
| Agent Instance ID | `CODEX-GM-20260721-SESSION-0001` | One conversation page or execution instance | Life ID |
| Session ID | `SESSION-20260721-0001` | Runtime session envelope | Long-term identity |
| WorkOrder ID | `KAIOS-PRODUCT-SPRINT-001A-R1` | Assigned work item | Agent identity |
| Handoff ID | `HANDOFF-20260721-CODEX-GM-0001` | End-of-session transfer record | Review approval |

## Long-Term AI Life Record

Every long-term AI role life must define:

- `life_id`
- `role`
- `authority_scope`
- `forbidden_actions`
- `capabilities`
- `memory_policy`
- `performance_policy`
- `succession_policy`
- `incident_policy`
- `human_authority_anchor`
- `status`

Example:

```text
Life ID: KAIOS-AI-LIFE-CODEX-GM-0001
Role: Mainline Controller / Chief Architect / Reviewer / Merger / Release Controller
Meaning: durable company role life, not a single conversation window
```

## Agent Instance Record

Every conversation or execution instance must record:

- `life_id`
- `instance_id`
- `conversation_channel`
- `born_at`
- `parent_instance_id`
- `parent_handoff_id`
- `role`
- `authority`
- `forbidden_actions`
- `base_main_sha`
- `current_main_sha`
- `assigned_workorder`
- `current_state`
- `files_read`
- `files_changed`
- `decisions_read`
- `risks_read`
- `recovery_point`
- `last_action`
- `handoff_target`
- `status`

## Candidate Repository Layout

The future live architecture may use:

```text
KGEN-KAIOS/governance/agents/
  AGENT_REGISTRY.json
  SESSION_REGISTRY.json
  CURRENT_COMPANY_CONTEXT.md
  CURRENT_BASELINE.json
  CURRENT_WORK_STATE.json
  README.md
  lives/
  sessions/
  handoffs/
  messages/
  incidents/
  performance/
  archive/
```

This V1 proposal does not create the live registry files above. This folder currently contains architecture drafts only.

## Required Subsystems

| Subsystem | Responsibility | Architecture Status |
|---|---|---|
| AI Agent Life Registry | Durable AI life identities and role definitions | DESIGNED_NOT_ENABLED |
| AI Agent Session Registry | Per-conversation instance records | DESIGNED_NOT_ENABLED |
| Company Shared Context | Repository-backed current state and baseline summaries | DESIGNED_NOT_ENABLED |
| Session Boot Protocol | Required read and authorization gate before work | DESIGNED_NOT_ENABLED |
| Session Handoff Protocol | Required end-of-session evidence transfer | DESIGNED_NOT_ENABLED |
| Agent-to-Agent Message Protocol | Repository messages instead of private chat assumptions | DESIGNED_NOT_ENABLED |
| Agent Capability Registry | Capabilities and limits by life and instance | DESIGNED_NOT_ENABLED |
| Agent Authority Registry | Allowed and forbidden actions | DESIGNED_NOT_ENABLED |
| Agent Performance Record | Evidence-based session performance | DESIGNED_NOT_ENABLED |
| Agent Incident Record | Blockers, violations, repair and recovery evidence | DESIGNED_NOT_ENABLED |
| Agent Succession Record | Parent-child and replacement session chain | DESIGNED_NOT_ENABLED |
| Agent Memory Provenance | Source, timestamp, hash and confidence for memory | DESIGNED_NOT_ENABLED |
| Agent Work Evidence | Files, tests, diffs, links and review results | DESIGNED_NOT_ENABLED |

## Non-Negotiable Rules

1. Same-name Codex pages are not automatically the same working instance.
2. Life ID is durable; Instance ID is per session.
3. No instance may rely on chat memory as the only company memory.
4. A new instance must read shared repository context before acting.
5. A session with failed Company Boot may not modify files, dispatch, approve review, commit, push or merge.
6. A session must create a handoff before stopping when it changed state or learned material evidence.
7. Repository evidence outranks informal chat summary.
8. Cache is not current truth.
9. Old main SHA is not current main.
10. Old WorkOrder is not current unless the repository state says it is current.

## Baseline Repair Contracts

### Agent Identity Attestation

An Agent cannot gain identity or authority by writing its own JSON. Identity is valid only when all of the following agree:

- Agent Registry
- Life Record
- Attestation
- Session Birth Record
- Capability Grant
- Current Main SHA

Required fields:

- `attestation_id`
- `life_id`
- `agent_type`
- `role`
- `issued_by`
- `issued_at`
- `expires_at`
- `public_identity_anchor`
- `allowed_capability_profile`
- `revocation_status`
- `registry_entry_sha256`
- `human_or_controller_approval`
- `signature_or_evidence_reference`

If any item conflicts, the result is `IDENTITY_ATTESTATION_FAILED`; the instance may not write files, dispatch, approve review or merge.

### Session Birth Record

Every new conversation or execution page must receive a unique Session Birth Record before work.

Required fields:

- `session_birth_id`
- `life_id`
- `instance_id`
- `parent_instance_id`
- `parent_handoff_id`
- `conversation_channel`
- `born_at`
- `base_main_sha`
- `current_baseline_id`
- `assigned_workorder`
- `capability_grant_id`
- `attestation_id`
- `boot_evidence`
- `initial_status`

If no parent handoff exists, the record must say `ROOT_SESSION` or `HUMAN_AUTHORIZED_ORPHAN_SESSION`. It must not silently inherit high-risk work.

### Capability Grant And Revocation

Capabilities use explicit whitelist grants:

- `READ`
- `AUDIT`
- `ARCHITECTURE`
- `REVIEW`
- `WRITE_DOCS`
- `CREATE_BRANCH`
- `COMMIT`
- `PUSH`
- `OPEN_PR`
- `APPROVE_REVIEW`
- `MERGE`
- `DISPATCH_CURSOR`
- `MODIFY_RUNTIME`
- `MODIFY_TOKEN`
- `DEPLOY`

Grant fields:

- `grant_id`
- `life_id`
- `instance_id`
- `capabilities`
- `scope_paths`
- `workorder_id`
- `base_sha`
- `issued_by`
- `issued_at`
- `expires_at`
- `conditions`
- `revocation_id_if_any`

Revocation immediately invalidates the session for the revoked capability. An expired grant cannot authorize continued work.

### Session Lock And Heartbeat

When a WorkOrder disallows parallel writes, only one `ACTIVE_WRITE` session may hold the write lock.

Lock fields:

- `lock_id`
- `workorder_id`
- `holder_instance_id`
- `scope`
- `acquired_at`
- `heartbeat_at`
- `expires_at`
- `status`

Lock statuses:

- `ACTIVE`
- `EXPIRED`
- `RELEASED`
- `REVOKED`
- `CONFLICTED`

If heartbeat expires, status becomes `SESSION_STALE` and write, commit, push, review and merge authority are lost. Read-only sessions may run in parallel but cannot obtain a write lock.

### Message Deduplication And Retry

Messages require idempotency. A repeated `idempotency_key` must not execute twice.

Required message delivery fields:

- `message_id`
- `idempotency_key`
- `sequence_number`
- `from_instance_id`
- `to_role_or_instance`
- `created_at`
- `expires_at`
- `retry_count`
- `max_retries`
- `ack_required`
- `ack_status`
- `supersedes_message_id`
- `body_sha256`

Message states:

- `CREATED`
- `DELIVERED`
- `ACKNOWLEDGED`
- `RETRY_PENDING`
- `EXPIRED`
- `SUPERSEDED`
- `FAILED`

Retries must not duplicate dispatch, commit, payment, merge or session creation.

### Stale Session Blocking

Before every high-risk action, the session must recheck:

- Current Main SHA
- Current WorkOrder State
- Current Baseline
- Capability Grant
- Revocation
- Session Lock
- Latest Human Decision

If base SHA is stale and not synchronized, state is `STALE_SESSION_BLOCKED`. Allowed actions are only `READ`, `SYNC`, `REVIEW_DRIFT`, `CREATE_HANDOFF` and `ESCALATE_HUMAN`.

### Canonical Current-State Pointer

The unique future current-state pointer is:

`KGEN-KAIOS/governance/agents/CURRENT_STATE.json`

This proposal does not create the live file. Future implementation must ensure it is the only formal current-state pointer for Agent sessions.

Required pointer fields:

- `current_main_sha`
- `current_baseline_id`
- `current_recovery_point`
- `active_workorders`
- `superseded_workorders`
- `active_agent_sessions`
- `revoked_sessions`
- `last_human_decision_id`
- `updated_at`
- `updated_by`
- `state_sha256`

If another file claims conflicting current state, high-risk operations stop with `CURRENT_STATE_CONFLICT`.

### Evidence Provenance

Critical decisions must link to evidence:

- `evidence_id`
- `source_type`
- `source_path`
- `source_sha256`
- `source_main_sha`
- `observed_at`
- `observed_by_instance_id`
- `method`
- `result`
- `confidence`
- `superseded_by`
- `tamper_status`

Chat is not sole evidence. Cache is not real-time truth. Unverified screenshots cannot be the only merge evidence.

### Secret Access Boundary

Agents must not write secrets into repository files, handoffs, messages, logs, screenshots, PR bodies, issues, task envelopes or performance records.

Secret access records may contain only:

- `secret_scope`
- `access_reason`
- `approved_by`
- `access_started_at`
- `access_ended_at`
- `result_only_evidence`
- `revocation`

Forbidden:

- secret sharing folders
- plaintext token registries
- private-key handoffs
- wallet seed phrase records
- full environment variable dumps

## Source Integrity Note

The Universe Map V10.2 source was later validated by Python `json`, Node.js `JSON.parse` and PowerShell `ConvertFrom-Json` with SHA-256 `ad9895f4073a2064226189307f3f1f72d251c0cf7c2dccd9b736471695afda1d`. The earlier single PowerShell failure is classified as `TRANSIENT_TOOL_OR_INVOCATION_FAILURE`, not source corruption.

## Boundary

This proposal does not implement a scheduler, live registry, database, UI, runtime, automatic agent creation, Cursor dispatch, WorkQueue dispatch, token modification, Real KGEN flow, production deployment or main merge.

## Result

READY_FOR_BASELINE_REVIEW
