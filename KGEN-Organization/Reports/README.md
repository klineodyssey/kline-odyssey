# KGEN Organization Reports

> **ALIAS — Not the primary report intake (ORG-P2-003 D3)**
> **Primary reports:** [`KGEN-AI-Company/reports/`](../../KGEN-AI-Company/reports/README.md)
> This folder keeps department report templates, handoff notes, and Organization-local report scaffolding.

## Report Rule

Cursor writes Phase 2 / AI Company WorkOrder reports to `KGEN-AI-Company/reports/` using the output path listed in the live WorkQueue. This Organization Reports folder may hold department templates (`REPORT_TEMPLATE.md`) and local handoff notes. Codex reviews each primary report before merge or push.

## Naming

Use the WorkOrder ID as prefix, for example:

`ORG-P2-018_QA_VALIDATION.md`

Primary copies of Phase 2 reports live under `KGEN-AI-Company/reports/`.

## Protected Systems

Reports may mention protected paths, but they must not modify contracts, `K線西遊記/temples/12345`, wallet, bridge, Boot, Runtime CURRENT, or final-whitepaper.

## Organization Links

- [Organization Index](../README.md)
- [Second Stage WorkQueue](../WorkOrders/WORK_QUEUE.md)
- [WorkOrder Standard](../WorkOrders/KGEN_WORKORDER_STANDARD.md)
- [Primary AI Company Reports](../../KGEN-AI-Company/reports/README.md)
