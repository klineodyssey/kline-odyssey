# WorkOrder ID Allocation Standard

**Document ID:** KAIOS-V9.2-ID-ALLOCATION  
**Version:** V9.2  
**Status:** Draft for Review  
**Owner:** Codex  
**Scope:** Official ID allocation for AI-derived WorkOrders.

## 1. Format

AI-derived WorkOrders use:

```text
AI-<DOMAIN>-<YEAR>-<SEQUENCE>
```

Examples:

- `AI-ECONOMY-2026-0001`
- `AI-TEMPLE-2026-0002`
- `AI-LAND-2026-0003`

## 2. Domain Rules

`DOMAIN` must describe the primary execution area:

- `ECONOMY`
- `TEMPLE`
- `LAND`
- `CITIZEN`
- `RESOURCE`
- `GOVERNANCE`
- `AI`
- `RUNTIME`
- `FRONTEND`
- `DOCS`

## 3. Collision Avoidance

AI-derived IDs must not collide with:

- `ORG-P2-*`
- `KAIOS-DRYRUN-*`
- `V9-DRYRUN-*`
- Existing `AI-*` IDs
- Any existing WorkQueue task ID

## 4. V9.2 Allocation

V9.2 allocates:

```text
AI-ECONOMY-2026-0001
```

Source:

```text
V9-DRYRUN-001A Resource Reserve Review
```

Reason:

The approved draft is about simulation-only resource reserve stabilization inside the economy domain.
