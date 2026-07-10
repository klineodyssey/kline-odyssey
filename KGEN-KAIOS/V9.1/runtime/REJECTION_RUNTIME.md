# Rejection Runtime

**Runtime ID:** KAIOS-V9.1-RUNTIME-REJECTION  
**Status:** Prototype  
**Mode:** Codex-gated.

The Rejection Runtime closes DRAFT WorkOrders that should not be promoted.

## Rejection Cases

- Canon conflict.
- R4 execution request.
- Duplicate active task.
- Unsafe protected path target.
- Missing source decision.
- Unverifiable expected output.

## Output

- Rejection decision.
- Archive reason.
- Optional replacement recommendation.
- Audit event.
