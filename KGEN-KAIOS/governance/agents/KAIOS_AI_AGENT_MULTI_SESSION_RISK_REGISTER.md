# KAIOS AI Agent Multi-Session Risk Register

Status: READY_FOR_HUMAN_ARCHITECTURE_REVIEW  
Runtime Implementation: NOT_STARTED  
Cursor Dispatch: NOT_DISPATCHED

| Risk ID | Severity | Risk | Mitigation |
|---|---:|---|---|
| MS-001 | P0 | Session assumes another Codex page shares full memory. | Require Agent Instance ID, boot read, repository handoff and message evidence. |
| MS-002 | P0 | Life ID is confused with Session ID. | Separate Life Registry from Session Registry. |
| MS-003 | P0 | Old main SHA is treated as current. | Boot must record current main SHA before action. |
| MS-004 | P0 | Old WorkOrder is treated as current. | Boot must read WorkQueue and latest handoff records. |
| MS-005 | P0 | Important state exists only in chat. | Handoff protocol requires repository evidence. |
| MS-006 | P0 | Agent silently stops after partial work. | Mandatory end-of-session handoff for material actions. |
| MS-007 | P0 | Agent approves review after failed boot. | Failed boot disables modify/dispatch/commit/push/review/merge. |
| MS-008 | P0 | Private cross-agent messages bypass audit. | Repository message protocol only. |
| MS-009 | P1 | Source files parse but are semantically corrupted. | Boot must record source integrity warnings; UTF-8/JSON parse is not enough. |
| MS-010 | P1 | Session registry grows without retention. | Define archive, pruning and retention classes before implementation. |
| MS-011 | P1 | Performance score becomes life value. | Performance policy forbids Life ID, rights or life-value impact. |
| MS-012 | P1 | Incident history is hidden to protect reputation. | Incident records are append-only and reviewable. |
| MS-013 | P1 | Successor session cannot reconstruct prior work. | Handoff requires files, actions, tests, blockers, risks and required next actions. |
| MS-014 | P2 | Too much context is loaded every time. | Use current context summaries plus latest three relevant handoffs. |
| MS-015 | P2 | Message queue becomes stale. | Messages require expiry, status and archive lifecycle. |
| MS-016 | P0 | Agent self-attests authority by filling JSON. | Require Agent Registry + Life Record + Attestation + Session Birth Record + Capability Grant + Current Main SHA comparison. |
| MS-017 | P0 | Concurrent write sessions modify the same WorkOrder. | Require Session Lock, heartbeat and stale lock expiry. |
| MS-018 | P0 | Duplicate message retry creates duplicate side effects. | Require idempotency key, body hash, sequence number and max retry. |
| MS-019 | P0 | Revoked or expired capability continues operating. | Capability Revocation immediately invalidates session authority. |
| MS-020 | P0 | Secrets leak through handoff, logs or PR body. | Secret boundary forbids raw secrets; only result-only evidence allowed. |

## Resolved Validation Record

`UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json` was validated after the transient failure:

- SHA-256: `ad9895f4073a2064226189307f3f1f72d251c0cf7c2dccd9b736471695afda1d`
- Python `json`: PASS
- Node.js `JSON.parse`: PASS
- PowerShell `ConvertFrom-Json`: PASS
- Classification: `VALID_JSON` / `SOURCE_INTEGRITY_VALIDATED`
- Prior failure classification: `TRANSIENT_TOOL_OR_INVOCATION_FAILURE`

This is no longer an open source-corruption risk.

## Result

READY_FOR_BASELINE_REVIEW
