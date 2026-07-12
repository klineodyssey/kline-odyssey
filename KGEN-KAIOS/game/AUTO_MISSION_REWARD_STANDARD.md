---
VERSION: "3.0"
REVISION: "2026-07-13.WORKFORCE_V3"
STATUS: "ACTIVE / PROTOTYPE GAME RUNTIME"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex"
REVIEWED_BY: "Codex"
SOURCE_COMMIT: "PENDING"
TASK_ID: "KGEN-WORKFORCE-V3-2026-0001"
CHANGE_REASON: "Define auto mission reward boundaries for employee game budgets."
SOURCE_OF_TRUTH: true
Domain: "KGEN"
Kingdom: "KAIOS"
Phylum: "Game"
Class: "Mission Reward"
Order: "Auto Mission"
Family: "Workforce Game Budget"
Genus: "Auto Mission Reward"
Species: "KGEN-KAIOS/game/AUTO_MISSION_REWARD_STANDARD.md"
---

# Auto Mission Reward Standard

## Purpose

This standard defines how an employee may authorize game agents to use approved in-game balances for automatic missions. It is a game simulation rule, not a financial investment product.

## Allowed Inputs

Game agents may use:

- GAME_CREDIT
- TEMPLE_ENERGY
- explicitly approved game mission budget

Game agents must not use:

- private keys
- real bank funds
- unclaimed KGEN
- another employee's assets
- Payroll Reserve
- external payment rails

## Allowed Game Actions

Allowed actions are automatic monster battles, mission completion, resource gathering, equipment production, in-game market participation, and game-only reward generation.

Each mandate must define `daily_budget`, `max_loss`, `mission_limit`, `allowed_game`, `stop_condition`, `reward_distribution`, and `audit_log`.

## Reward Boundary

Game rewards are not guaranteed salary, not guaranteed token returns, and not real investment income. Any conversion out of game balances requires Codex review and, when irreversible, Human approval.

