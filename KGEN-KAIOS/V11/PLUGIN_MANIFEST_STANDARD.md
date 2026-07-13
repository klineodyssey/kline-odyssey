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
CHANGE_REASON: "Define the reviewable manifest contract for AI provider plugins."
ANCESTOR: "KGEN-KAIOS/V10/PLUGIN_STANDARD.md"
SOURCE_OF_TRUTH: false
Domain: "KGEN"
Kingdom: "KAIOS"
Phylum: "Plugin Runtime"
Class: "Manifest Standard"
Order: "Provider Adapter"
Family: "V11 Genesis Design"
Genus: "AI Plugin"
Species: "KGEN-KAIOS/V11/PLUGIN_MANIFEST_STANDARD.md"
---

# KAIOS V11 Plugin Manifest Standard

## 1. Purpose

The manifest is a declarative request for plugin registration. It describes identity, compatibility, capabilities and risk. It is not an authority grant and must never contain a secret.

## 2. Required Fields

| Group | Fields |
|---|---|
| Identity | `manifest_version`, `plugin_id`, `name`, `plugin_type`, `publisher_id` |
| Version | `plugin_version`, `kaios_api_range`, `provider_api_version` |
| Runtime | `entrypoint_type`, `adapter_protocol`, `supported_modes` |
| Capability | `capabilities`, `requested_permissions`, `required_tools` |
| Data | `input_schemas`, `output_schemas`, `retention_policy`, `data_regions` |
| Network | `allowed_domains`, `webhook_origins` |
| Security | `sandbox_profile`, `secret_refs`, `risk_level`, `integrity` |
| Operations | `health_check`, `rate_limits`, `cost_model`, `support` |
| Governance | `owner`, `reviewer`, `source_commit`, `status`, `audit_events` |

`secret_refs` contains only names of external secret bindings, never values.

## 3. Draft Manifest Example

```json
{
  "manifest_version": "1.0-draft",
  "plugin_id": "PLUGIN-AI-PROVIDER-EXAMPLE",
  "name": "Provider-Neutral Example Adapter",
  "plugin_type": "AI_PROVIDER",
  "publisher_id": "PUBLISHER-SANDBOX",
  "plugin_version": "0.1.0-sandbox",
  "kaios_api_range": ">=11.0-design <12",
  "provider_api_version": "provider-defined",
  "entrypoint_type": "REMOTE_ADAPTER",
  "adapter_protocol": "KAIOS_PROVIDER_ADAPTER_DRAFT",
  "supported_modes": ["ANALYZE", "RECOMMEND", "DRAFT_OUTPUT"],
  "capabilities": ["ai.generate.text", "ai.analyze.document"],
  "requested_permissions": ["repo.read", "report.create"],
  "required_tools": [],
  "input_schemas": ["kaios://schemas/mission-step-request"],
  "output_schemas": ["kaios://schemas/mission-step-result"],
  "retention_policy": "NO_PROVIDER_RETENTION_REQUESTED",
  "data_regions": ["UNSPECIFIED_REQUIRES_REVIEW"],
  "allowed_domains": ["provider.example.invalid"],
  "webhook_origins": [],
  "sandbox_profile": "NETWORK_ALLOWLIST_READONLY",
  "secret_refs": ["ENV://PROVIDER_API_KEY"],
  "risk_level": "R2",
  "integrity": {
    "package_digest": "PENDING_SANDBOX_BUILD",
    "signature": "PENDING_PUBLISHER_VERIFICATION"
  },
  "health_check": {
    "method": "adapter.healthCheck",
    "timeout_ms": 5000
  },
  "rate_limits": {
    "requests_per_minute": 10,
    "max_concurrent_sessions": 2
  },
  "cost_model": "PROVIDER_ACCOUNT_BILLED",
  "support": "DESIGN_EXAMPLE_ONLY",
  "owner": "human-primeforge",
  "reviewer": "codex-gm-01",
  "source_commit": "PENDING_IMPLEMENTATION",
  "status": "DRAFT",
  "audit_events": true
}
```

The `.invalid` domain deliberately prevents this example from implying a live provider.

## 4. Permission Review

Requested permissions are evaluated independently:

- `repo.read`: scoped paths only;
- `repo.write.scoped`: requires explicit output paths;
- `git.commit.handoff`: one task branch only;
- `browser.read`: domain allowlist;
- `test.execute.sandbox`: resource limits;
- `network.egress`: explicit domains and methods; and
- `report.create`: declared report location.

The following are denied to ordinary plugins: main push, production deploy, secret export, wallet signing, contract deployment, protected-path write and Human account action.

## 5. Validation

Validation checks:

1. identifier uniqueness;
2. schema and semantic validity;
3. publisher evidence;
4. compatibility range;
5. requested permission necessity;
6. allowed domain ownership and TLS;
7. secret reference policy;
8. package digest and dependency provenance;
9. data retention and region declaration;
10. health and rollback behavior;
11. risk level; and
12. Human/Codex review requirements.

## 6. Versioning

The canonical manifest filename remains fixed. `plugin_version` changes inside the manifest. A breaking capability or API change increments the major version and supplies migration and rollback notes.

## 7. Status Boundary

- Manifest standard: **DRAFT_FOR_HUMAN_REVIEW**
- JSON Schema: **PLANNED_FOR_IMPLEMENTATION_PHASE_1**
- Example adapter: **NON_EXECUTABLE**
Implementation: **NOT_STARTED**
