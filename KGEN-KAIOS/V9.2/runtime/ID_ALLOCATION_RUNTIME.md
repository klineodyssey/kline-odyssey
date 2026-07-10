# ID Allocation Runtime

**Runtime ID:** KAIOS-V9.2-RUNTIME-ID-ALLOCATION  
**Status:** Prototype  
**Mode:** Codex-only.

The ID Allocation Runtime assigns formal AI WorkOrder IDs using:

```text
AI-<DOMAIN>-<YEAR>-<SEQUENCE>
```

It checks for collisions against existing WorkQueue IDs and legacy prefixes such as `ORG-P2-*`, `KAIOS-DRYRUN-*` and `V9-DRYRUN-*`.
