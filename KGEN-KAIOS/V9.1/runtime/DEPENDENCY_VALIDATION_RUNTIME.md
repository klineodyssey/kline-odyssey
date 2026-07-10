# Dependency Validation Runtime

**Runtime ID:** KAIOS-V9.1-RUNTIME-DEPENDENCY-VALIDATION  
**Status:** Prototype  
**Mode:** Read-only analysis.

The Dependency Validation Runtime checks whether a DRAFT can safely move forward.

## Checks

- Dependencies exist.
- Dependencies are complete when required.
- No dependency cycles exist.
- No blocking dependencies are unresolved.
- Reports and branches are present when required.

## Output

The output is `PASS`, `WARN` or `FAIL`.
