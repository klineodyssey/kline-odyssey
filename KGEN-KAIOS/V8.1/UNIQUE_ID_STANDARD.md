# KAIOS V8.1 Unique ID Standard

## Purpose

Every KGEN lifeform and economic object must be addressable. The Unique ID Standard prevents duplicate life records, duplicate land records, duplicate citizens, and ambiguous ownership.

## ID Format

```text
<KGEN prefix>-<entity type>-<scope>-<sequence or hash>
```

Recommended compact form:

```text
KGEN-<TYPE>-<YYYYMMDD>-<000001>
```

For hash-backed records:

```text
KGEN-<TYPE>-HASH-<sha256-prefix>
```

## Entity Type Prefixes

| Entity | Prefix |
|---|---|
| Universe | `UNI` |
| Civilization | `CIV` |
| World | `WRD` |
| Temple | `TEM` |
| Land | `LND` |
| Building | `BLD` |
| Residence | `RES` |
| Citizen | `CIT` |
| Profession | `PRO` |
| Business | `BUS` |
| Exchange | `EXC` |
| Bank | `BNK` |
| Player | `PLY` |
| NPC | `NPC` |
| AI | `AI` |
| App | `APP` |
| DNA | `DNA` |
| Mission | `MIS` |
| Item | `ITM` |
| Quest | `QST` |
| Market | `MKT` |
| Listing | `LST` |
| Transaction | `TXN` |
| Governance | `GOV` |

## Example IDs

| Entity | Example |
|---|---|
| Universe | `KGEN-UNI-20260710-000001` |
| Civilization | `KGEN-CIV-20260710-000001` |
| Temple 12345 | `KGEN-TEM-12345-000001` |
| Land | `KGEN-LND-K12345-000001` |
| Residence | `KGEN-RES-K12345-000001` |
| Citizen | `KGEN-CIT-K12345-000001` |
| Profession | `KGEN-PRO-MERCHANT-000001` |
| App | `KGEN-APP-HASH-4f8c2a91` |

## Rules

1. IDs are immutable after creation.
2. Renaming an entity does not change its ID.
3. Ownership transfer does not change its ID.
4. Merge creates a new ID and archives the source IDs as dependencies.
5. Split creates child IDs and preserves the parent ID as source.
6. Deleted or archived IDs must not be reused.
7. Production IDs must include a collision check and record signature.