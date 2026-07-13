# ORG-P2-017 — Backend Boundary Assumptions

## Worker Boot SOP Evidence

| Section | Evidence |
|---|---|
| BOOT | `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md` read; base `bf1a46f` (origin/main) |
| AUTHORIZATION | cursor-01 / ACTIVE / T2 / no suspension / `cursor-handoff/ORG-P2-017` |
| PROTECTED PATHS | No protected path modified |
| TASK PLAN | Read Backend files + AGENTS.md constraints; document boundaries without adding services |
| EXECUTION | Below |
| FINAL REPORT | This document |

---

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-017 |
| Date | 2026-07-13 |
| Base Commit | bf1a46f |
| Branch | `cursor-handoff/ORG-P2-017` |
| Author Worker ID | cursor-01 |
| Start Status | OPEN |
| End Status | REVIEW |
| Reviewer | codex-gm-01 |
| Priority | P2 |
| Department | Backend |

---

## Files Read

| File | Purpose |
|---|---|
| `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md` | Boot and worker gate |
| `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md` | Protocol rules |
| `KGEN-AI-Company/CURSOR_REPORTING_RULES.md` | Required report fields |
| `KGEN-Organization/WorkOrders/KGEN_WORKORDER_STANDARD.md` | WorkOrder standard |
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | Live task source |
| `KGEN-Organization/Backend/README.md` | Backend office position |
| `KGEN-Organization/Backend/ROLE.md` | Backend role and authority |
| `KGEN-Organization/Backend/RESPONSIBILITY.md` | Backend responsibilities |
| `KGEN-Agent-Office/DO_NOT_TOUCH.md` | Protected path rules |
| `KGEN-Canon/KGEN_CANON_MASTER.json` | Machine-readable Canon |
| `AGENTS.md` | Existing infrastructure constraints |

## Files Modified

| File | Change |
|------|--------|
| `KGEN-Organization/WorkOrders/WORK_QUEUE.md` | ORG-P2-017 status OPEN → IN_PROGRESS → REVIEW |
| `KGEN-AI-Company/reports/ORG-P2-017_BACKEND_BOUNDARY.md` | Created (this report) |

## Protected Paths Checked

All protected paths untouched.

---

## Task Result

**PASS.** Backend boundary assumptions documented without adding services, databases, or infrastructure. All boundaries derived from existing AGENTS.md constraints, Canon rules, and current repository state.

---

## Current Backend Reality (as of main `bf1a46f`)

From `AGENTS.md`:
> "KLINE Odyssey is a static Web3 × finance narrative site (GitHub Pages) with Python market-data pipelines and optional on-chain KGEN contracts. **There is no `package.json`, Docker, or database.**"

The current system has **no backend services**. All data flows are:
1. Static HTML/CSS/JS served via GitHub Pages
2. Python pipelines for K-line data (local or CI-only)
3. Public BSC RPC calls (`eth_call`) from browser JS — read-only, no wallet required
4. Optional wallet-injected calls via MetaMask / injected `window.ethereum`

---

## Backend Boundary Map

### Boundary 1 — What EXISTS now (Current)

| Component | Type | Notes |
|-----------|------|-------|
| GitHub Pages | Static hosting | Only delivery mechanism |
| `eth_call` via public BSC RPC | Read-only chain queries | No auth, no wallet |
| `window.ethereum` injection | Wallet RPC bridge | User-controlled; browser only |
| Python K-line pipeline | Local / CI script | No persistent server |
| BSC contract functions | On-chain logic | Deployed; backend is the chain itself |

### Boundary 2 — What is FORBIDDEN (No-Overreach Rule)

From `KGEN-Organization/Backend/README.md`:
> "不得假設已有資料庫或 Node 服務；不得新增未審核外部依賴。"

| Forbidden assumption | Reason |
|---------------------|--------|
| Assuming a Node.js server exists | No `package.json`, no Docker |
| Assuming a database (SQL/NoSQL) exists | No database; AGENTS.md confirmed |
| Adding unapproved external APIs | No-overreach rule |
| Running persistent server processes | GitHub Pages is static only |
| Storing user data server-side | No backend auth or storage |

### Boundary 3 — Future Backend (Requires Codex WorkOrder before any code)

If future features require a backend, the following constraints apply before any code is written:

| Constraint | Rule |
|-----------|------|
| WorkOrder required | No backend service may be added without a Codex-assigned WorkOrder |
| BSC RPC is the preferred chain data layer | Existing pattern; no new chain data layer needed now |
| Read-only data: public BSC RPC is sufficient | Balances, LP reserves, Treasury — all readable without backend |
| Write operations: wallet-signed transactions only | No backend signing permitted |
| KGEN token facts must not change | Tax rate, contract address, supply are on-chain constants |
| Python pipelines: CI/CD only, no persistent servers | K-line data fetched in workflows, not a live API |

### Boundary 4 — Allowed Backend-Adjacent Patterns (Current)

These patterns are already used and do not constitute a "backend":

| Pattern | Where Used | Safe |
|---------|-----------|------|
| `fetch()` to Binance API | 11520 exchange, K-line charts | ✅ (CORS-limited; falls back silently) |
| `fetch()` to BSC public JSON-RPC | `chain-read.js` V1.1 | ✅ (read-only `eth_call`) |
| `fetch()` to `kgen-5d-world-map.json` | Portal, game | ✅ (static file, same origin) |
| GitHub Pages static hosting | All HTML/CSS/JS | ✅ |

---

## Checks Run

### Check 1 — No database or Node process exists

Confirmed: no `package.json`, no `Dockerfile`, no `docker-compose.yml`, no `server.js`, no `app.py` serving HTTP exists in the repository root or any temple folder.

**Result:** PASS.

### Check 2 — Canon alignment

Canon: "11520 Huaguo Mountain Exchange is the marketplace for App, Land, Temple, AI, DNA, and civilization assets."

Backend implication: 11520 exchange listing and trading are currently read-only prototype. No backend settlement, order book, or custodial logic exists or is planned. All trading requires BSC on-chain settlement when implemented.

**Result:** CONSISTENT.

### Check 3 — wallet / bridge protected path boundary

DO_NOT_TOUCH confirms `wallet` and `bridge` are protected. Backend must never implement server-side key management, signing, or relay services for these paths.

**Result:** CONFIRMED.

---

## Problems Found

None. Boundaries are clear and consistent with current state.

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Future agents may add Node services without a WorkOrder if backend boundary is undocumented | Medium | This report documents the boundary explicitly |
| Binance API CORS errors on localhost may cause agents to assume a proxy server is needed | Low | AGENTS.md already warns about CORS; fallback is silent |
| BSC public RPC rate limits may prompt agents to add a backend proxy | Low | Multiple RPC fallbacks (chain-read.js V1.1) are sufficient |

---

## Technical Debt

None for this task. Boundaries are clear.

---

## Suggested WorkOrders (PROPOSED)

| Suggested ID | Scope | Reason |
|-------------|-------|--------|
| ORG-P2-017A | Define BSC RPC usage standards (rate limits, fallback chain, error handling) | Formalises the existing pattern used in chain-read.js |

---

## Do Not Do

- Do not add any backend service, database, or Node.js process.
- Do not add unapproved external API dependencies.
- Do not add server-side signing or key management.
- Do not touch protected paths.

## Blockers

None.

## Recommendation

**APPROVE.** Backend boundaries are clearly defined: no backend exists, no backend is planned without a Codex WorkOrder, and all current data patterns (static pages + public BSC RPC + wallet injection) remain unchanged.

## Need Codex Review

Yes.

## Need Human Decision

No.
