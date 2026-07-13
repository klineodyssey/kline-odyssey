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
CHANGE_REASON: "Draft provider-neutral Plugin and Player Agent API contracts."
ANCESTOR: "KGEN-KAIOS/V10/API_GATEWAY_STANDARD.md"
SOURCE_OF_TRUTH: false
Domain: "KGEN"
Kingdom: "KAIOS"
Phylum: "Plugin Runtime"
Class: "API Draft"
Order: "Provider Adapter"
Family: "V11 Genesis Design"
Genus: "KAIOS API"
Species: "KGEN-KAIOS/V11/PLUGIN_API_DRAFT.md"
---

# KAIOS V11 Plugin API Draft

## 1. Boundary

This is a logical REST-style contract for design review. It is not an OpenAPI release and no server is deployed. Every write request requires authenticated tenant context, role checks, idempotency, schema validation and an audit event.

## 2. Common Envelope

```json
{
  "request_id": "REQ-...",
  "tenant_id": "CIV-...",
  "actor_id": "PLAYER-...",
  "idempotency_key": "opaque-unique-value",
  "requested_at": "RFC3339",
  "risk_level": "R1",
  "payload": {}
}
```

Responses include `request_id`, `result_id`, `state_version`, `status`, `audit_event_id`, warnings and errors.

## 3. Plugin Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v11/plugins` | list visible validated plugins |
| `POST` | `/v11/plugins/registrations` | submit manifest for validation |
| `GET` | `/v11/plugins/{plugin_id}` | inspect manifest and health |
| `POST` | `/v11/plugins/{plugin_id}/sandbox-trials` | request synthetic trial |
| `POST` | `/v11/plugins/{plugin_id}/grants` | propose scoped capability grant |
| `DELETE` | `/v11/plugins/{plugin_id}/grants/{grant_id}` | revoke grant |
| `POST` | `/v11/plugins/{plugin_id}/health-checks` | run bounded health check |
| `POST` | `/v11/plugins/{plugin_id}/suspensions` | suspend new sessions |

Registration and grant endpoints create reviewable states; they do not directly enable high-risk access.

## 4. Player Agent Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/v11/players/{player_id}/agents` | create pending Agent record |
| `GET` | `/v11/players/{player_id}/agents` | list owned Agents |
| `GET` | `/v11/agents/{agent_id}` | read permitted Agent state |
| `PATCH` | `/v11/agents/{agent_id}` | propose role/config change |
| `POST` | `/v11/agents/{agent_id}/activations` | request activation |
| `POST` | `/v11/agents/{agent_id}/pauses` | pause new work |
| `POST` | `/v11/agents/{agent_id}/transfers` | propose employer transfer |
| `POST` | `/v11/agents/{agent_id}/retirements` | retire and archive |
| `DELETE` | `/v11/agents/{agent_id}` | request tombstone, not audit erasure |

## 5. Mission Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/v11/missions` | create DRAFT mission |
| `POST` | `/v11/missions/{mission_id}/open` | request Codex-controlled promotion |
| `POST` | `/v11/missions/{mission_id}/claims` | request exclusive claim lease |
| `POST` | `/v11/claims/{claim_id}/heartbeats` | renew active lease |
| `POST` | `/v11/missions/{mission_id}/reports` | submit evidence bundle |
| `POST` | `/v11/missions/{mission_id}/reviews` | record review outcome |
| `POST` | `/v11/missions/{mission_id}/blocks` | stop further execution |

## 6. Runtime Adapter Interface

```typescript
interface KaiosProviderAdapter {
  describeCapabilities(): Promise<CapabilityDescriptor[]>;
  validateConfiguration(input: ConfigurationRef): Promise<ValidationResult>;
  healthCheck(input: HealthCheckRequest): Promise<HealthCheckResult>;
  createRuntimeSession(input: SessionCreateRequest): Promise<RuntimeSession>;
  executeMissionStep(input: MissionStepRequest): Promise<MissionStepResult>;
  cancelRuntimeSession(input: SessionCancelRequest): Promise<AuditReference>;
  collectUsage(input: UsageRequest): Promise<UsageRecord>;
  collectEvidence(input: EvidenceRequest): Promise<EvidenceBundle>;
  closeRuntimeSession(input: SessionCloseRequest): Promise<AuditReference>;
}
```

## 7. Core Types

```typescript
type RiskLevel = "R0" | "R1" | "R2" | "R3" | "R4";

interface MissionStepRequest {
  requestId: string;
  tenantId: string;
  missionId: string;
  claimId: string;
  agentId: string;
  runtimeInstanceId: string;
  contextRefs: SourceReference[];
  capabilityGrantIds: string[];
  expectedOutputSchema: string;
  idempotencyKey: string;
  deadline: string;
}

interface MissionStepResult {
  status: "COMPLETED" | "BLOCKED" | "FAILED" | "CANCELLED";
  outputRefs: SourceReference[];
  evidenceRefs: SourceReference[];
  assumptions: string[];
  risks: string[];
  usageRef?: string;
  auditEventId: string;
}
```

## 8. Error Model

| Code | Meaning |
|---|---|
| `AUTH_REQUIRED` | no valid actor context |
| `TENANT_SCOPE_DENIED` | cross-tenant request denied |
| `PLUGIN_NOT_APPROVED` | plugin is not enabled |
| `CAPABILITY_DENIED` | grant absent or expired |
| `CLAIM_CONFLICT` | another active claim exists |
| `STALE_STATE` | state version changed |
| `RISK_REVIEW_REQUIRED` | required review not complete |
| `HUMAN_PAUSED` | Human pause is active |
| `PROTECTED_ACTION_DENIED` | protected action cannot execute |
| `PROVIDER_UNAVAILABLE` | adapter health is degraded |
| `RATE_LIMITED` | quota exhausted |

Errors are stable KAIOS classes; provider-specific details are stored as restricted evidence references.

## 9. Events And Webhooks

Future webhook or event subscribers may receive normalized events, but subscriptions require tenant scope, signature verification, replay protection and delivery audit. WebSocket and webhook transport remain Concept status.

## 10. Pagination And Concurrency

- Collections use opaque cursors.
- Mutations require `If-Match` or an expected state version.
- Repeated idempotency keys return the original result.
- Claim creation is serialized per mission.
- Bulk operations return per-item decisions and may not bypass review.

## 11. Security

API responses never return provider secrets, private prompts, private keys, wallet seeds or unrestricted filesystem paths. Logs redact sensitive headers and payload fields. R3 needs Human plus Codex review; R4 returns `PROTECTED_ACTION_DENIED`.

## 12. Status Boundary

- API contract: **DRAFT_FOR_HUMAN_REVIEW**
- OpenAPI document: **NOT_CREATED**
- Server implementation: **NOT_STARTED**
External access: **DISABLED**
