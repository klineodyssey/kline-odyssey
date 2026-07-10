# Human Gate Runtime

**Runtime ID:** KAIOS-V9.1-RUNTIME-HUMAN-GATE  
**Status:** Prototype  
**Mode:** Human-gated.

The Human Gate Runtime enforces review requirements for R3 decisions and Human overrides.

## Inputs

- WorkOrder review packet.
- Risk level.
- Legal, security and real-world business flags.

## Output

- Human review record.
- Approved, rejected, paused, blocked, archived or priority-changed decision.

## Boundary

R4 cannot be promoted through the Human Gate. It remains blocked or archived.
