# Land Viewer Schema V2 Compatibility

Status: `CANDIDATE_ONLY`

Operation: `DRY_RUN`

Runtime: `NOT_ACTIVE`

## Company Boot

- Boot status: `BOOT_PARTIAL_SAFE_TO_CONTINUE`
- Repository: `klineodyssey/kline-odyssey`
- Workspace: `C:/Desktop/kline-odyssey-current`
- Base main: `19229217dcbf793173103924995a5d5fd384aefe`
- Branch: `codex/land-viewer-schema-v2-compatibility`
- Recovery point: `RECOVERY-PR50-KAIOS-CANONICAL-ORGANISM-V0-1`
- Human authority: `樂天帝`
- Cursor dispatch: `false`
- Runtime authority: `false`
- Scheduler: `false`
- Automatic Agent Creation: `false`

## Data Contract Inventory

| Viewer field | Schema V2 mapping | Classification |
|---|---|---|
| `id` | candidate `organism_id`; retained as source parcel identity | `ADAPTER_REQUIRED` |
| `global_uid` | asset identity reference | `ADAPTER_REQUIRED` |
| `object_type` | `organism_class=LAND_PARCEL` | `DIRECT_SCHEMA_V2_MATCH` |
| `view.bounds`, `scene_bounds` | renderer-only geometry | `VIEW_ONLY` |
| `coordinate`, `surface_k` | canonical parcel location | `DIRECT_SCHEMA_V2_MATCH` |
| `owner_id` | `OWNERSHIP` projection | `ADAPTER_REQUIRED` |
| `population`, `ai_worker_ids` | occupancy context; never ownership | `ADAPTER_REQUIRED` |
| `land_use` | `USAGE_RIGHT` projection | `ADAPTER_REQUIRED` |
| `governor_id` and authority IDs | `CONTROL_AUTHORITY` projection | `ADAPTER_REQUIRED` |
| `building_ids` | conditional `BUILDING_TITLE` reference | `ADAPTER_REQUIRED` |
| `status` | candidate lifecycle status | `ADAPTER_REQUIRED` |
| `revision_history` | read-only lifecycle evidence | `LEGACY_ONLY` |
| `ownership_timeline` | synthetic ownership evidence | `LEGACY_ONLY` |
| `proposal_history` | local proposal evidence | `LEGACY_ONLY` |
| `capabilities` | Viewer command boundary | `VIEW_ONLY` |
| `organism_schema_v2` | normalized Viewer projection | `MISSING` before this adapter |
| `integrity_hash` | canonical JSON SHA-256 | `MISSING` before dry-run migration |

The existing fixture stores twelve parcels. Selection is held by
`SelectionController`; parcel proposal and revision state are stored under the
Land Runtime localStorage namespace. Canvas rendering assumes four numeric
screen bounds. The explicitly `UNKNOWN` parcel may omit canonical coordinates.

## Mapping Boundary

All parcels bind to `KAIOS_LAND_PARCEL_V1`, the shared taxonomy registry,
Schema V2, the non-executable lifecycle handler, `ECOSYSTEM_FLOW`,
`LAND_PARCEL`, and `LAND_TITLE`. The adapter exposes all ten K11520 right
classes while keeping ownership, occupancy, usage, control authority, land
title, building title, organism identity, and Life identity separate.

Owning land never implies ownership of an occupying Life.

## Migration

Run:

```powershell
node tools/migrate-land-parcels-v2.mjs
```

The command reads `data/synthetic-world.json` without mutation and writes
`data/schema-v2-land-candidates.json`. Each output record includes source
parcel ID, candidate organism ID, mappings, defaults, missing values, rollback
instructions, and a canonical SHA-256 integrity hash.

Rollback is deletion of the generated candidate output and adapter references.
The original fixture is unchanged.

## Safety

- `SYNTHETIC`
- `READ_ONLY`
- `SANDBOX`
- `NOT_LEGAL_TITLE`
- `NO_REAL_SETTLEMENT`
- no wallet
- no live ownership
- no Production Runtime
- no Runtime CURRENT change
- no Universe Map CURRENT change
- no Cursor dispatch
