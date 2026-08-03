# KAIOS Life Energy, Economy and Payroll Source Audit

Task ID: `KAIOS-24H-LIFE-ENERGY-ECONOMY-PAYROLL-001`

Status: `REVIEWED_SOURCE_BASELINE`

Authority: `CODEX_CANONICAL_ARCHITECT / SIMULATION_ONLY`

## Findings

| Source | Status | Authority | Reused fields or behavior | Conflict or gap | Action |
|---|---|---|---|---|---|
| `KGEN-AI-Company/reports/CURSOR_PROPOSED_KAIOS_PAYROLL_WALLET_RD_20260802.md` | Research input | Cursor proposal only | project funding, escrow, review-gated payroll, simulated wallet, KGEN isolation | incorrectly makes wallet and payroll prerequisites for life and maps economic failure to prey status | retain useful controls; replace ontology with the three-axis model |
| `KAIOS_CANONICAL_LIFE_SPEC_V1.md` | Canonical specification | Canonical Life | life identity, formation, needs, health, history, economy binding | does not define payroll execution | life existence remains independent of account capability |
| `KAIOS_CANONICAL_LIFE_ECONOMY_BINDING_V1.md` | Canonical binding | Canonical Life | economic role, resource value, labor, maintenance, demand gate | no worker escrow state machine | reuse as the life/economy boundary |
| `KGEN-KAIOS/world-viewer/economy/economy-runtime.js` | Executable simulation | Economy Runtime | `KAIOS_CREDIT`, bounded transfers, resource catalog, synthetic ledger | no project payroll escrow or colony allocation contract | remain the currency owner; add a bounded payroll adapter, not another currency |
| `KGEN-KAIOS/world-viewer/player-genesis/player-genesis-runtime.js` | Executable simulation | Player Genesis | separate player, AI and household accounts; review-gated payroll; balanced transfer | wallet currency label predates the canonical `KAIOS_CREDIT` label | reuse separation and approval semantics without merging wallets |
| `KAIOS/ai-company/KAIOS_AI_COMPANY_ORDER_PROJECT_RUNTIME_V1_SPEC.md` | Approved specification | AI Company | request, task, funding, acceptance, capacity and closeout | no universal payroll event schema | bind project task and acceptance IDs to payroll |
| `KGEN-KAIOS/world-viewer/ai-company/ai-company-project-runtime.js` | Executable simulation | AI Company | deterministic tasks, budgets, events and project ledger | no worker-wallet release command | use as project authority; payroll cannot authorize its own task |
| `KGEN-KAIOS/civilization/PAYROLL_STANDARD.md` | Repository standard | Civilization | evidence, review, pricing and approval | lacks colony and three-axis life rules | preserve payroll evidence gates |
| `KGEN-KAIOS/civilization/BANK_LEDGER_STANDARD.md` | Repository standard | Civilization | balanced ledger and audit concepts | not a real banking authorization | reuse simulation accounting only |
| `KAIOS_PHYSICAL_LABOR_ACCOUNTING_SPEC.md` | Approved specification | Physical Labor | attendance, effective work, time and location conflicts | no digital-worker wallet release | use conflict results as payroll gates |
| `KAIOS_SUPPLY_CHAIN_SCHEMA.json` and finance specifications | Approved specification | Supply Chain Economy | budget source, payables, inventory and insolvency | not a worker payroll owner | use project budget and cost evidence |
| `KAIOS/software-life/KAIOS_AI_WORKFORCE_24H_QUEUE.json` | Governance record | Worker Registry queue | one task at a time, zero active claims | Human-provided Cursor response file is not present | prepare a bounded envelope; do not fabricate a dispatch or output |

## Source Integrity

- Company Boot passed at `57573a6b88021539be28a15ea5f57bdafc6fa46c` with a clean worktree.
- `docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json` did not parse as JSON during mandatory read. It is an existing read-only source defect and is not modified by this workline.
- No Constitution source, `CURRENT`, wallet contract, KGEN contract or production authority file is an implementation dependency.

## Canonical Decision

`LIFE_EXISTENCE`, `AGENCY_LEVEL` and `ECONOMIC_CAPABILITY` are independent.
`KAIOS_CREDIT` is the existing simulation accounting unit. Physical and
ecological resources remain finite causal inventories. Payroll is a transfer
from reserved project value to a distinct worker account after external task,
review and acceptance gates pass.
