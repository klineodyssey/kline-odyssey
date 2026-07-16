# ORG-P2-017 Backend Boundary Assumptions

## Report Metadata

| Field | Value |
|---|---|
| Task ID | ORG-P2-017 |
| Worker ID | cursor-01 |
| Worker Agent ID | cursor-agent-bc-f8d4e6 |
| Session ID | SESSION-20260716-10-EPHEMERAL |
| Claim ID | CLAIM-ORG-P2-017-20260716T064045-cursor-01 |
| Date | 2026-07-16 |
| Observed origin/main | `89f3c351c488a0705f514adba974dd6c3dd3cb3a` |
| Branch | `cursor-handoff/ORG-P2-017-20260716` |
| Reviewer | codex-gm-01 |
| Department | Backend (P2) |
| Prior archive tip | `1ca1d6f1` (REJECT_NO_CLAIM) |

## Summary

Defined **backend service boundary assumptions** for KGEN Organization V2.0 against the **actual repository topology** on main (`89f3c35`).

**Verdict: PASS** — boundaries stated without creating services. Current stack is **static GitHub Pages + client-side Web3 + Python batch pipelines**; no database, no Node API server, no Docker. Six boundary layers documented; five risks. Report-only.

---

## Session Context

```text
session_id: SESSION-20260716-10-EPHEMERAL
worker_id: cursor-01
claim_id: CLAIM-ORG-P2-017-20260716T064045-cursor-01
observed_origin_main: 89f3c351c488a0705f514adba974dd6c3dd3cb3a
atomic_claim_service: NOT_IMPLEMENTED
```

## Codex Coordination

| Item | Note |
|---|---|
| Codex closeout since 004 | **None** on 005–024 |
| ORG-P2-015 pivot | Sibling claimed `cursor-handoff/ORG-P2-015-20260716` @ `ab09eb5` — this session pivoted to **017** |
| WORK_QUEUE | Not modified (PF1) |

---

# Boundary Model (No Services Created)

## Layer 0 — What Exists Today (FACT)

| Component | Location / mechanism | Backend service? |
|---|---|---|
| Public UI | GitHub Pages static HTML/JS | No — static file host |
| Temple wallet | Client `ethers.js` + user MetaMask | No — browser → BSC RPC |
| Market klines | Browser → `api.binance.com` (CORS) | No — third-party direct; no proxy |
| K-line pipelines | `K線西遊記/tools/*.py`, GitHub Actions | No — batch/offline; writes xlsx |
| On-chain KGEN | `KGEN/contracts/` + BscScan | No in-repo server |
| Canon / Org docs | Markdown + JSON files | No |
| KGEN-SDK | Schema + API books (Draft) | No — documentation layer |
| KAIOS schemas | JSON proposals V8–V10 | No — not deployed |

**AGENTS.md fact:** *「no `package.json`, Docker, or database」* — confirmed.

## Layer 1 — Backend Office Charter (FUTURE, NOT IMPLEMENTED)

Per `Backend/README.md` and `ROLE.md`:

- **In scope (future):** API design, data-flow specs, on-chain **read** patterns, service boundary docs
- **Explicitly forbidden now:** assume database exists; assume Node service exists; add unapproved external dependencies

## Layer 2 — Service Boundary Assumptions

| Boundary ID | Assumption | Owner dept |
|---|---|---|
| B-01 | **No application server** in repo until Codex + Human authorize a scoped WorkOrder | Backend / DevOps |
| B-02 | **Chain writes** only via user wallet in browser; no server-side signing | Security / wallet |
| B-03 | **Chain reads** client-side RPC or future read-only indexer — not implemented | Backend (future) |
| B-04 | **Market data** external APIs called from browser or Python batch; no KGEN-owned API gateway | Economy / DevOps |
| B-05 | **Persistence** = Git + committed xlsx/csv/json; not SQL | Architecture |
| B-06 | **Auth/KYC** = not present; any future module is Level C Human gate | Security |
| B-07 | **SDK schemas** define contracts; implementation requires separate Runtime task | SDK / Backend |

## Layer 3 — Cross-Department Touchpoints

```text
Frontend (static) ──browser──► BSC RPC / Binance API
Python pipeline ──batch──► master/*.xlsx (committed artifacts)
Temple 12345 ──client──► ethers.js (protected; no backend change)
KGEN-SDK ──docs──► JSON Schema (no HTTP endpoint)
```

## Layer 4 — Protected Path Firewall

Backend work **must not** modify without explicit task: contracts, Temple 12345 Runtime, wallet, bridge, Boot CURRENT, Runtime CURRENT, whitepaper, KGEN Token contract.

## Layer 5 — Future Service Candidates (PROPOSAL ONLY)

| Candidate | Trigger | Prerequisite |
|---|---|---|
| Read-only chain indexer | Multi-temple aggregate stats | Security review + no server-side keys |
| Org API gateway | SDK-010 agent automation | Atomic claim registry + auth |
| Pipeline scheduler API | Autopilot beyond GitHub Actions | DevOps ORG-P2-020 alignment |

**None authorized by this report.**

---

## Files Read

WorkOrder inputs (10) + `AGENTS.md` + `KGEN-SDK/README.md` + `KGEN-Organization/DevOps/README.md` + `KGEN-Organization/Security/README.md`.

## Files Modified

None vs main. Report + handoff only.

## Checks Run

| Check | Result |
|---|---|
| PACKAGE_JSON_ABSENT | PASS — no root package.json |
| DOCKERFILE_ABSENT | PASS |
| BACKEND_NO_OVERREACH_RULE | PASS — report does not assume DB/Node |
| AGENTS_MD_ALIGNMENT | PASS |
| PROTECTED_PATH_DIFF | PASS |

## Risks

| ID | Risk |
|---|---|
| W1 | Org Backend README says「未來 API」— readers may assume service exists |
| W2 | Binance CORS failures look like backend outage but are browser-direct |
| W3 | Python pipeline side effects on master xlsx blur batch vs service |
| W4 | KAIOS V10 schemas include payment/wallet — documentation only but confusing |
| W5 | PF2 — sibling sessions may also target 017/021/025 |

## Recommendation

**APPROVE report-only.** Optional follow-up: add `Backend/BOUNDARY_ASSUMPTIONS.md` (additive Org doc) after Codex review — **not done in this task** (report-only scope).

## Review Status

`PENDING_CODEX_REVIEW`
