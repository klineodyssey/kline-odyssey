# Draft Review Runtime

**Runtime ID:** KAIOS-V9.1-RUNTIME-DRAFT-REVIEW  
**Status:** Prototype  
**Mode:** Read-only review.

The Draft Review Runtime normalizes an AI-generated DRAFT WorkOrder into a Codex review packet.

## Inputs

- DRAFT WorkOrder.
- Source AI decision.
- Source state files.
- Risk model.
- Canon rules.

## Outputs

- Review report.
- Checklist result.
- Required follow-up checks.

## Rules

- DRAFT remains non-executable until Codex promotes it.
- Missing source state produces `NEEDS_REVISION` or `BLOCKED`.
- Protected path modification requests produce rejection or block.
