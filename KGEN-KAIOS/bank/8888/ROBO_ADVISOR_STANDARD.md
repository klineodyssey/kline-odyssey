---
VERSION: "3.0"
REVISION: "2026-07-13.WORKFORCE_V3"
STATUS: "ACTIVE / PROTOTYPE ROBO GOVERNANCE"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex"
REVIEWED_BY: "Codex"
SOURCE_COMMIT: "PENDING"
TASK_ID: "KGEN-WORKFORCE-V3-2026-0001"
CHANGE_REASON: "Define 8888 Robo simulation, paper trading and advisory-only boundaries."
SOURCE_OF_TRUTH: true
Domain: "KGEN"
Kingdom: "KAIOS"
Phylum: "Bank"
Class: "Robo Advisor"
Order: "Risk Control"
Family: "Simulation Mandate"
Genus: "8888 Robo"
Species: "KGEN-KAIOS/bank/8888/ROBO_ADVISOR_STANDARD.md"
---

# 8888 Robo Advisor Standard

## Allowed Modes

First-stage Robo agents may only operate in:

- SIMULATION
- BACKTEST
- PAPER_TRADING
- GAME_MARKET
- ADVISORY_ONLY

## Forbidden Modes

Robo agents must not perform:

- REAL_MONEY_AUTONOMOUS_TRADING
- PRIVATE_KEY_ACCESS
- UNLIMITED_LOSS
- GUARANTEED_RETURN
- UNREVIEWED_EXTERNAL_TRANSFER
- LEVERAGE_WITHOUT_HUMAN_APPROVAL

## Required Mandate Fields

Each Robo record must include `robo_id`, owner, mandate, market scope, capital type, risk level, max position, max drawdown, daily loss limit, stop loss, allowed assets, prohibited assets, approval requirement, Human kill switch, performance benchmark and status.

## Legal Boundary

Robo output is not investment advice and does not guarantee return. Production use with real funds requires legal, security, treasury and compliance review plus Human approval.

