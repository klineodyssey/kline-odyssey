---
TITLE: "Auto Approval Gate Standard"
VERSION: "0.1.0"
STATUS: "ARCHITECTURE_PROPOSAL"
FAIL_MODE: "FAIL_CLOSED"
---

# Auto Approval Gate Standard

## Eligible Artifact Types

Only these artifact classes may enter the gate:

- `ARCHITECTURE`
- `REVIEW`
- `PROPOSAL`
- `README`
- `ADR`
- `DECISION_LOG`
- `SCHEMA`
- `DOCUMENTATION`
- `MACHINE_READABLE_JSON`

An eligible file type does not make its subject eligible. A README that changes
Token policy, for example, remains prohibited.

## Mandatory Gates

Every gate must pass against the exact candidate manifest:

| Gate | Required result |
|---|---|
| Protected paths | `0` changes |
| JSON validation | `PASS` |
| JSONL validation | `PASS` |
| Link validation | `PASS` |
| Runtime CURRENT | `UNCHANGED` |
| Universe Map CURRENT | `UNCHANGED` |
| Kernel CURRENT | `UNCHANGED` |
| Land CURRENT | `UNCHANGED` |
| Implementation | `false` |
| Deployment | `false` |
| WorkQueue | `UNCHANGED` |
| Review readiness | `>= 85` |
| P0 and P1 risks | `0 unresolved` |
| Rollback | `DEFINED_AND_TESTABLE` |
| Source audit | `PASS` |
| Artifact manifest | `SHA256_VERIFIED` |
| Author / reviewer separation | `PASS` |
| Standing Human delegation | `ACTIVE_AND_IN_SCOPE` |

The JSONL and link validators always return `PASS` or `FAIL`. A manifest with no
matching files may return `PASS` only when the report explicitly records a
checked count of zero and the declared scope. `NOT_RUN` never passes.

## Risk Eligibility

- `R0`: clerical, index, link, schema-format, or non-semantic documentation.
- `R1`: reversible Architecture with no authority, security-boundary, real-world,
  CURRENT, frozen-core, or implementation effect.
- `R2+`: Human review required.

External review is required whenever the established module policy requires it.
The runtime cannot waive that requirement by assigning a low score or label.

## Permanent Exclusions

Auto Approval is forbidden for:

- Token, contracts, tax, wallet, blockchain mainnet, real payment, or release.
- Deployment, Pages, production, or irreversible migration.
- Universe Physics CURRENT, Universe Map CURRENT, Kernel CURRENT, Life OS CURRENT,
  Land CURRENT, Civilization CURRENT, or any Runtime CURRENT.
- Constitution, Human Final Authority, AGB, Human Anchor, autonomy level,
  Decision Center authority, canonical claim authority, or this gate.
- Frozen baseline core invariants or silent historical rewrites.
- Real KYC, precise GPS, legal land, private credentials, Heaven Secret, or
  Divine Vault material.
- Security, tenant-isolation, or authority changes whose failure can cross a
  trust boundary.

## Evaluation Algorithm

1. Resolve authoritative sources using source priority.
2. Freeze candidate manifest and candidate base SHA.
3. Verify independent review and amendment closure.
4. Run all validation and protected-path gates.
5. Classify semantic risk from subject, not extension.
6. Verify Human delegation scope and Human Anchor.
7. Compare candidate manifest again to prevent time-of-check/time-of-use drift.
8. Emit exactly one of `AUTO_APPROVE`, `HUMAN_REVIEW_REQUIRED`, or `REJECT`.
9. Append the gate record before baseline publication.
10. Project the approved decision and emit an informational Dispatcher event.

## Approval Evidence

Each record includes:

```text
approval_id
proposal_id
decision_id
delegated_authority_id
artifact_manifest_hash
base_sha
review_ids
review_scores
risk_class
gate_results
rollback_plan
approver
human_override_available
approved_at
baseline_ref
decision_record_hash
```

The approver value is `CODEX_DELEGATED_GM`, never `HUMAN`, unless Human actually
signed the specific decision.
