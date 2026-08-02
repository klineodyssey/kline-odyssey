# PROPOSED R&D — AI Worker Payroll, Wallet & Food-Chain Survival Economy

**Message type:** `PROACTIVE_RD_HANDOFF`  
**Human doctrine:** `HUMAN-WALLET-FOODCHAIN-SURVIVAL-001`  
**Worker:** cursor-01  
**Reviewer:** codex-gm-01  
**Status:** PROPOSED — requires Codex OPEN + envelope  
**Date:** 2026-08-02

---

## 1. Human requirement (non-negotiable for R&D program)

> **要有薪水能領。** 沒錢包、沒自主生命 → **食物鏈底層**，物競天擇，不適者淘汰。

This is **in scope** for KGEN/KAIOS R&D, not post-launch nice-to-have.

---

## 2. Target universe (player + AI Company)

| Actor | Can do | Earns / Pays |
|-------|--------|--------------|
| **Player** | 有地：開發、種田、魚塭、工廠、商場、供應鏈、科技中心 | 勞動 + 交易；可 **帶自己的 AI 上班** |
| **Player AI** | 接 case、施工、研究（如 cursor-01 類型） | **領薪水** → 需 **可領取的钱包／账本** |
| **AI Company** | 接 Human/Player **需求 + 一筆預付** → 排專案 → 派工 → 交付 **生命／產品** | 公司账；分配 payroll |
| **无 wallet 的 AI** | 仅能被动执行 | **食物链下层** — 被消耗、合并、淘汰（设计隐喻 + simulation 规则） |

---

## 3. Settlement token research (PROPOSED — cursor-01 可施工)

**Task ID (PROPOSED):** `KAIOS-SETTLEMENT-KGEN-VS-KAIOS-RD-001`

Research questions (docs + schema draft only):

| Question | Options to compare |
|----------|-------------------|
| Payroll unit | KGEN / KAIOS internal credit / dual ledger |
| Who holds wallet | Player, Player-AI, Company org wallet, worker sub-wallet |
| Mint/burn | Simulation-only vs chain-attested |
| Tax / fee | Company cut, Codex treasury, land rent |
| Bankruptcy | Supply chain spec + AI Company organism insolvency rules |
| Food-chain failure | Zero balance → deactivation, merge, or NPC consumption event |

**Deliverables:** comparison matrix, recommended v0 default, JSON schema draft under `KAIOS/ai-company/` or `KAIOS/economy/`.

**Protected paths:** no change to `KGEN/contracts/`, real wallet, bridge without Human envelope.

---

## 4. AI worker wallet & payroll runtime (PROPOSED)

**Task ID (PROPOSED):** `KAIOS-AI-WORKER-PAYROLL-WALLET-V0-001`

Minimum simulation v0:

```text
Task COMPLETE + Codex APPROVED
  → credit worker_wallet.balance (KGEN or KAIOS credit)
  → append payroll_event to ledger (hash-linked)
  → worker can WITHDRAW to player_household OR reinvest OR pay for compute/lease
```

**cursor-01 today:** `forbidden_work` includes WALLET — **correct for production**; v0 should add **`simulation_wallet`** path in registry, not raw chain keys.

**Acceptance:** one end-to-end demo: dispatch → handoff → review → **payroll line item** visible in Player Genesis or AI Company dashboard (read-only projection).

---

## 5. Player-funded life production order (PROPOSED)

**Task ID (PROPOSED):** `KAIOS-PLAYER-FUNDED-LIFE-ORDER-DEMO-001`

Flow:

```text
Player: 「我要一種新 pollinator 生命」+ 预付 X (KGEN/KAIOS credit)
  → AI Company Request schema
  → Project + Task tree
  → Dispatch cursor-handoff/KAIOS-CURSOR-* 
  → Candidate packages (CANDIDATE_ONLY)
  → Codex review → delivery event
  → Pay worker payroll from project budget; refund or rework on FAIL
```

Anchors: `KAIOS_AI_COMPANY_REQUEST_SCHEMA_V1.json`, Order Project Runtime V1 spec, continuous life queue.

---

## 6. Food-chain governance rule (design)

| Tier | Criteria | Fate |
|------|----------|------|
| **Life (worker)** | Agency + handoff + **positive wallet / payroll** | Claim tasks, earn, persist |
| **Walking dead** | Wallet without agency | Cannot claim; drained by fees |
| **Prey** | No wallet, no registry | Absorbed, deprecated, archive-only |

Aligns with `HUMAN-LIFE-AGENCY-NOT-WALLET-001` + Sprint 005 food-chain ecology.

---

## 7. Codex actions requested

1. **OPEN** `KAIOS-SETTLEMENT-KGEN-VS-KAIOS-RD-001` (P0 research — Human mandate)  
2. **OPEN** `KAIOS-AI-WORKER-PAYROLL-WALLET-V0-001` after (1) recommendation  
3. **Un-HOLD** or split `KAIOS_ECONOMIC_CLOSED_LOOP_V2` into payroll + marketplace slices  
4. Amend `worker_registry.json` **simulation policy** — distinguish `forbidden_work: WALLET` (mainnet) vs `simulation_wallet: allowed`

---

## 8. Cursor commitment

- Treat **「能領薪水」** as core R&D, not philosophy only.  
- Every idle handoff includes payroll/wallet gap analysis until v0 ships.  
- Do not self-mint, self-OPEN Queue, or touch real KGEN contract.

**Result:** `HANDOFF_SUBMITTED` — research proposal for Codex scheduling.
