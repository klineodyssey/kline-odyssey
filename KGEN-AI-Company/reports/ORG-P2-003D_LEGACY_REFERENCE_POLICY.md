# ORG-P2-003D Legacy Reference Policy

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-003D |
| Worker ID | cursor-01 |
| Worker Type | Cursor |
| Date | 2026-07-10 |
| Base Commit | bd632db3f9c6337359a77fb7ac69da93b229d258 |
| Branch | `cursor-handoff/ORG-P2-003D` |
| Report Path | `KGEN-AI-Company/reports/ORG-P2-003D_LEGACY_REFERENCE_POLICY.md` |
| Start Status | OPEN |
| End Status | REVIEW |
| Reviewer | Codex |
| Architecture Decision | D5 ARCHIVE + D6 ALIAS — `ORG-P2-003_ARCHITECTURE_DECISION.md` |

## Summary

Drafted a **reference-only policy** for legacy temple shells and physics-runtime copies. Confirms **`K線西遊記/temples/12345/`** as **Current** (protected) and **`wukong-temple/`** as **Legacy** (read-only archive). Confirms **`docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`** as **Single Source of Truth** for physics runtime prose. Identified byte-identical duplicate clusters and proposed **where reference banners/notes should be added** in a future doc-only WorkOrder. **No temple code, no physics CURRENT file, and no protected paths were modified.**

## Policy Definitions

| Label | Meaning | Agent rule |
|---|---|---|
| **Current** | Live official implementation | May be modified only by explicit authorized WorkOrders; protected by `DO_NOT_TOUCH` |
| **Legacy** | Superseded but retained for history/compatibility | Read-only; must point users to Current; no feature work |
| **Archive** | Frozen historical snapshots inside Legacy trees | No edits except Codex-approved archive labels |
| **Single Source of Truth (SSOT)** | One authoritative document path per topic | All other copies are **Reference Alias** only |

## Temple Reference Policy (D5)

### Current — Official Temple

| Item | Value |
|---|---|
| Path | `K線西遊記/temples/12345/` |
| Entry | `index.html` |
| Runtime | `modules/runtime-main.js`, `modules/runtime-main.css` |
| Production URL | `https://klineodyssey.github.io/kline-odyssey/K線西遊記/temples/12345/index.html` |
| Bridge URL | `https://klineodyssey.github.io/kline-odyssey/12345.html` |
| Status | **Current / Protected** |
| Local dev | `AGENTS.md` → port 8080 temple 12345 |

### Legacy — Wukong Temple

| Item | Value |
|---|---|
| Path | `wukong-temple/` |
| Entry | `index.html` (~152 KB monolith, title V4.4.3 CHAIN) |
| Sub-entries | `bookstore/`, `mars-villa/`, `life-forge.html` |
| Archive subtree | `wukong-temple/archive/` (V0.5–V2.7 HTML snapshots) |
| Status | **Legacy / Read-only** |
| Local dev | `AGENTS.md` labels as "Wukong temple (legacy)" |

### Temple comparison (audit)

| Dimension | Current 12345 | Legacy wukong-temple |
|---|---|---|
| Architecture | Modular runtime (`runtime-main.js`) | Inline monolith HTML |
| Version line | V2.3.x runtime core | V4.4.3 CHAIN (historical naming) |
| Wallet bridge | `12345.html` ASCII bridge | Older embedded flows |
| Protected | Yes (`DO_NOT_TOUCH`) | No — but **no migration/deletion approved** |
| User-facing rule | Default for all new work | Historical reference only |

### Proposed reference notes (future doc-only WO — not applied in this task)

| Location | Proposed banner text |
|---|---|
| `wukong-temple/README_WUKONG_TEMPLE_AUTOPILOT_V1_6.md` top | `> **LEGACY** — Official temple is K線西遊記/temples/12345. This folder is archived reference.` |
| `wukong-temple/README_Wukong_Temple_Deploy_V2_3.md` top | Same LEGACY banner |
| `wukong-temple/index.html` (visible UI, if ever allowed) | Non-blocking strip: "Legacy 神殿 — 請使用 12345 悟空財神殿" linking to official URL |
| `wukong-temple/archive/README.md` | `> **ARCHIVE** — Frozen HTML snapshots; not Current.` |
| Root `README.md` | Already links 12345 as primary; optional footnote that `wukong-temple/` is Legacy |

## Physics Runtime Reference Policy (D6)

### SSOT

| Item | Value |
|---|---|
| Path | `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` |
| Size | 91,272 bytes |
| MD5 | `6090ed28b043dd0f97978dcfaa2d4731` |
| Status | **Protected SSOT** (`DO_NOT_TOUCH`) |
| Final PDF | `docs/physics/final-whitepaper/KGEN_Universe_Physics_Runtime_V4.0_OFFICIAL_WHITEPAPER_FINAL.pdf` (protected subtree) |

### Historical versions (docs/physics/)

| File | Size | Relation to SSOT |
|---|---|---|
| `KGEN_Universe_Physics_Runtime_V1_2.md` | 8,445 | Historical lineage |
| `KGEN_Universe_Physics_Runtime_V1_3.md` | 17,809 | Historical lineage |
| `KGEN_Universe_Physics_Runtime_V1_4.md` | 21,375 | Historical lineage |
| `KGEN_Universe_Physics_Runtime_V1_6.md` | 32,473 | Historical; see alias cluster below |
| `KGEN_Universe_Physics_Runtime_V1_7.md` | 39,160 | Historical lineage |
| `KGEN_Universe_Physics_Runtime_V3_1_Territory_Unified.md` | 40,546 | Historical lineage |
| `KGEN_Universe_Physics_Runtime_V3_3_EARTH_LIFE_CERTIFICATION.md` | 57,092 | Historical lineage |
| `KGEN_Universe_Physics_Runtime_V3_7.md` | 91,272 | **Byte-identical to CURRENT** (alias) |

### Byte-identical alias clusters (verified)

**Cluster A — V1.6 snapshot (MD5 `32c706d4c9b0cdfb0624dbd8e8510cb3`):**

| Path | Status |
|---|---|
| `docs/physics/KGEN_Universe_Physics_Runtime_V1_6.md` | Reference Alias |
| `whitepaper/KGEN_Universe_Physics_Runtime_V1_6.md` | Reference Alias |
| `K線西遊記/temples/12345/KGEN_Universe_Physics_Runtime_V1_6.md` | Reference Alias (**protected parent — note only via future WO**) |

**Cluster B — CURRENT ≡ V3_7 (MD5 `6090ed28b043dd0f97978dcfaa2d4731`):**

| Path | Status |
|---|---|
| `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md` | **SSOT** |
| `docs/physics/KGEN_Universe_Physics_Runtime_V3_7.md` | Reference Alias (rename candidate label: "CURRENT mirror") |

### Proposed reference notes (future doc-only WO — not applied in this task)

| Location | Proposed note |
|---|---|
| `docs/physics/KGEN_Universe_Physics_Runtime_V3_7.md` header | `> ALIAS: byte-identical to KGEN_Universe_Physics_Runtime_CURRENT.md. Do not edit; edit CURRENT only.` |
| `docs/physics/KGEN_Universe_Physics_Runtime_V1_6.md` header | `> ARCHIVE snapshot V1.6. SSOT is CURRENT.md.` |
| `whitepaper/KGEN_Universe_Physics_Runtime_V1_6.md` header | `> REFERENCE ALIAS of docs/physics V1_6. SSOT is CURRENT.md.` |
| `K線西遊記/temples/12345/KGEN_Universe_Physics_Runtime_V1_6.md` | `> LOCAL REFERENCE COPY — protected path; update only via authorized temple WO.` |
| `docs/physics/README.md` (if created) | Index table: CURRENT = SSOT, others = lineage/alias |

## Whitepaper Folder Policy

| Path | Role |
|---|---|
| `whitepaper/KGEN_Universe_Physics_Runtime_V1_6.md` | Legacy root copy; alias of V1_6 cluster |
| `docs/physics/final-whitepaper/` | Protected official PDF SSOT subtree |

Rule: root `whitepaper/` copies must not be edited for runtime changes; they receive reference banners only.

## Agent Operating Rules

1. **Never** treat `wukong-temple/` as Current for wallet, runtime, or deployment work.
2. **Never** edit `KGEN_Universe_Physics_Runtime_CURRENT.md` without explicit Codex + human authorization.
3. When citing physics rules in reports, link **CURRENT** only.
4. Byte-identical copies may remain in repo for archaeology; do not delete in this policy phase.
5. Redirects, code migration, and wallet URL changes require separate WorkOrders (not approved here).

## Acceptance Criteria

| Criterion | Result |
|---|---|
| Draft policy: Current, Legacy, Archive, SSOT | ✅ |
| Do not edit temple code or physics runtime files | ✅ |
| Identify where reference notes would be needed | ✅ |
| No protected path modifications | ✅ |

## Files Read

- `KGEN-AI-Company/reports/ORG-P2-003_ARCHITECTURE_DECISION.md`
- `KGEN-Agent-Office/DO_NOT_TOUCH.md`
- `wukong-temple/index.html` (header sample)
- `wukong-temple/README_WUKONG_TEMPLE_AUTOPILOT_V1_6.md`
- `wukong-temple/README_Wukong_Temple_Deploy_V2_3.md`
- `wukong-temple/archive/README.md`
- `docs/physics/` (file listing + hash compare)
- `whitepaper/KGEN_Universe_Physics_Runtime_V1_6.md` (hash)
- `K線西遊記/temples/12345/KGEN_Universe_Physics_Runtime_V1_6.md` (hash)
- `README.md`, `AGENTS.md`
- `KGEN-Organization/WorkOrders/WORK_QUEUE.md`

## Files Modified

- `KGEN-Organization/WorkOrders/WORK_QUEUE.md` — ORG-P2-003D OPEN → IN_PROGRESS → REVIEW
- `KGEN-AI-Company/reports/ORG-P2-003D_LEGACY_REFERENCE_POLICY.md` — this report

## Protected Paths Checked

No modifications under:

- `contracts`
- `K線西遊記/temples/12345`
- `wallet`
- `bridge`
- `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
- `docs/physics/final-whitepaper/`
- `KGEN/contracts/KGEN_Token_V7_5_2.sol`

## Checks Run

| Check | Command / action | Result |
|---|---|---|
| Pull main | `git pull origin main` | ✅ @ `bd632db` |
| First actionable OPEN | ORG-P2-003D (003C handoff exists on remote) | ✅ |
| Physics hash compare | `md5sum` on CURRENT, V3_7, V1_6 cluster | ✅ 2 alias clusters found |
| Temple path audit | file size + README cross-ref | ✅ |
| Protected diff | git diff scoped to report + queue | ✅ Clean |

## Risks

| ID | Risk | Severity |
|---|---|---|
| R1 | Users bookmark `wukong-temple/` GitHub Pages URL if still published | Medium |
| R2 | V3_7 byte-identical to CURRENT may confuse editors | Medium |
| R3 | V1_6 copy inside protected 12345 cannot get banner without authorized WO | Low |
| R4 | Legacy temple monolith may contain outdated contract addresses in docs | Medium — reference only |

## Blockers

None.

## Recommendation

1. **Codex approve** this policy as the reference standard for ORG-P2-003F and ORG-P2-014.
2. **Future doc-only WO:** apply proposed LEGACY/ALIAS banners (no code migration).
3. **Optional future WO:** verify whether `wukong-temple/` is still deployed on GitHub Pages and add portal redirect at HTML level (requires explicit authorization).

## Need Codex Review

Yes.

## Need Human Decision

Optional: whether to publish a visible LEGACY banner inside `wukong-temple/index.html` or keep README-only labeling.
