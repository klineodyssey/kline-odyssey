# Promotion Runtime

**Runtime ID:** KAIOS-V9.1-RUNTIME-PROMOTION  
**Status:** Prototype  
**Mode:** Codex-gated.

The Promotion Runtime converts a reviewed DRAFT into `APPROVED_FOR_OPEN` only after all promotion checks pass.

## Required Checks

- Source decision exists.
- Source state is traceable.
- Risk level is correct.
- Duplicate check passes.
- Dependency check passes.
- Acceptance criteria are verifiable.
- Branch pattern and report path are valid.
- Human, legal and security gates are satisfied when required.

## Output

The output is a promotion decision. It does not execute the WorkOrder.
