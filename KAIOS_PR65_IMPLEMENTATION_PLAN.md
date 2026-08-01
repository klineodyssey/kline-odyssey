# KAIOS PR65 Future Implementation Plan

Status: `HOLD_NOT_STARTED`

PR #65 delivers specifications and tests only. A future authorized runtime
workline should extend existing World Viewer production and economy modules in
this order:

1. Add schema-backed product recipes and dependency evaluation adapters.
2. Add warehouse capacity, reservation, condition and stock-aging state.
3. Add demand, confirmed-order and bounded production-planning state.
4. Connect PR #63 transport and PR #64 workforce/time contracts.
5. Add double-entry company finance and working-capital gates.
6. Add sales acceptance, returns, repair and recycling flows.
7. Add deterministic distress, restructuring and simulated court state.
8. Add asset/claim inventories and conserved liquidation distribution.
9. Add replay, import/export, bounded history and responsive Viewer panels.
10. Re-run all authority, wallet, KGEN, legal-effect and Production gates.

Implementation must reuse `KGEN-KAIOS/world-viewer/production/`, `economy/`,
`settlement/` and `causal-runtime/`; it must not create a parallel Runtime
CURRENT or activate real industrial, financial or legal operations.
