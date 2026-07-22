# KAIOS Company Boot Runtime V0.1 Risk Register

Status: READY_FOR_HUMAN_RUNTIME_REVIEW
Implementation: NOT_STARTED

| Risk ID | Risk | Severity | Control | Status |
|---|---|---:|---|---|
| `BOOT-V0.1-R001` | Agent self-declares identity | P0 | Require registry, attestation, birth record, grant and current SHA agreement | MITIGATED_BY_DESIGN |
| `BOOT-V0.1-R002` | Stale session uses old main SHA | P0 | Main SHA check and stale session blocking | MITIGATED_BY_DESIGN |
| `BOOT-V0.1-R003` | Capability grant is expired or revoked | P0 | Grant expiry and revocation gates before audit | MITIGATED_BY_DESIGN |
| `BOOT-V0.1-R004` | Missing parent handoff breaks continuity | P1 | Parent handoff required unless Human-authorized root session | MITIGATED_BY_DESIGN |
| `BOOT-V0.1-R005` | Duplicate Session ID causes identity collision | P0 | Unique Session Birth Record gate | MITIGATED_BY_DESIGN |
| `BOOT-V0.1-R006` | Current-state conflict creates split brain | P0 | Single canonical current-state pointer and conflict stop | MITIGATED_BY_DESIGN |
| `BOOT-V0.1-R007` | Secret appears in boot output or handoff | P0 | Secret scan and fail-closed output rejection | MITIGATED_BY_DESIGN |
| `BOOT-V0.1-R008` | Cache or chat memory treated as truth | P1 | Evidence provenance requirement | MITIGATED_BY_DESIGN |
| `BOOT-V0.1-R009` | Read-only runtime accidentally writes product file | P0 | Allowed path and product modification gate | MITIGATED_BY_DESIGN |
| `BOOT-V0.1-R010` | V0.1 quietly becomes scheduler | P0 | Scheduler explicitly forbidden | MITIGATED_BY_DESIGN |
| `BOOT-V0.1-R011` | V0.1 dispatches Cursor without approval | P0 | Cursor dispatch explicitly forbidden | MITIGATED_BY_DESIGN |
| `BOOT-V0.1-R012` | Handoff created but session not archived | P1 | State machine requires `ARCHIVED` terminal state | MITIGATED_BY_DESIGN |
| `BOOT-V0.1-R013` | Evidence lacks hashes or source paths | P1 | Evidence IDs and provenance required | MITIGATED_BY_DESIGN |
| `BOOT-V0.1-R014` | WorkOrder is unauthorized or stale | P0 | WorkOrder status verification before audit | MITIGATED_BY_DESIGN |
| `BOOT-V0.1-R015` | Runtime folder becomes secret storage | P0 | No secret folder and no plaintext secret storage | MITIGATED_BY_DESIGN |

## Open Risks

No open P0 risk remains for architecture review. Implementation remains not approved, so runtime execution risk is not yet active.

## Review Boundary

This risk register does not authorize implementation, scheduler, Cursor dispatch, WorkQueue dispatch, production deployment, token changes or Real KGEN.
