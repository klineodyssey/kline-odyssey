# Recovery Point - 2026-07-18 Mainline Autopilot

**Recovery ID:** `RECOVERY-20260718-MAINLINE-AUTOPILOT-001`  
**Created By:** Codex / `codex-gm-01`  
**Reason:** Before recording KAIOS Company Autopilot V1.0 mainline controller authority and dispatch/report updates.  
**Workspace:** `C:\Desktop\kline-odyssey-phase2-reconciliation`  

## Main State

| Field | Value |
|---|---|
| Current Main SHA | `5baa6fc001e71be02e9542d9dbbb67819de243ca` |
| Current Tag | `engine-v1.0` |
| Branch Used | `codex/company-mainline-autopilot-v1` |

## Ledger Hashes

| Ledger | SHA-256 |
|---|---|
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | `A28E1F7049A542841DC85D1E5BC59CB3AEAEB8D0CA0926F4C1E3DAD3C1D122A1` |
| `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md` | `AE59377F881CAA7B24488138597C00B73C732C30D7DF1E3D7E0AF46536C7E955` |
| `KGEN-AI-Company/reports/ENGINEERING_HANDOVER_LOG.md` | `8B15E5C0AA71E81D2C7208D87B16D8E065489369855D8B64F6A70223C6BD4F39` |

## Protected Path Hash Manifest

| Path | SHA-256 |
|---|---|
| `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md` | `D7F00E281A6E5907C9C1B8431ADAB3E1F3986B5EB261515A311E51332D80F017` |
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | `65417EF01FCDCAC0888B4F2FE525C4690AF8E4B7D303912E3CD9DA3F3BF32FF9` |
| `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json` | `AD9895F4073A2064226189307F3F1F72D251C0CF7C2DCCD9B736471695AFDA1D` |
| `KGEN/contracts/KGEN_Token_V7_5_2.sol` | `062FA988FFAFEDCCE1FD5982E273E017E36BFA254DCAA036D82BE128A45B5444` |

## Recovery Rule

If merge, batch update, closeout, or dispatch fails, Codex must use this record to identify the pre-operation state, record the failure in Engineering Handover Log, and retry or roll forward with a reviewed fix. Destructive reset, force push, or Human Main overwrite remains forbidden.

