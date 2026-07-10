# Dispatch Risk Gate

**Document ID:** KAIOS-V9.3-DISPATCH-RISK-GATE  
**Version:** V9.3  
**Status:** Draft for Review

The Risk Gate maps AI risk level to release authority.

| Risk | Meaning | Release Rule |
|---|---|---|
| R0 | Informational | Codex may release. |
| R1 | Low | Codex may release. |
| R2 | Medium | Codex Review required before release. |
| R3 | High | Human + Codex Review required. |
| R4 | Critical | Release prohibited; BLOCKED or ARCHIVED only. |

`AI-ECONOMY-2026-0001` is treated as R2 because it discusses economy stabilization but forbids real financial action, token transfer, contract deployment, and governance execution. Codex Review is sufficient; Human Review is not required unless scope expands.

