# KAIOS Player + AI Household + Work Genesis Specification

Task ID: `KAIOS-PLAYER-AI-HOUSEHOLD-WORK-GENESIS-001`

Status: `LOCAL_DETERMINISTIC_SIMULATION`

## Boundaries

- `SIMULATION_ONLY`
- `SIMULATED_WALLET`
- `NO_REAL_KGEN`
- `NO_BLOCKCHAIN_SETTLEMENT`
- `NO_REAL_GPS_STORAGE`
- `NO_EXTERNAL_AUTONOMY`
- `NO_PRODUCTION_AUTHORITY`

The implementation extends the existing KAIOS World Viewer. It does not
create a second website, account service, wallet, blockchain transaction,
autonomous Agent, legal marriage, land title, or production runtime.

## Canonical Sources Reused

| Source | Reused contract |
|---|---|
| `KGEN-KAIOS/V10/PLAYER_STANDARD.md` | Player remains distinct from Wallet and membership |
| `KGEN-KAIOS/V10/WALLET_STANDARD.md` | Prototype profile only; no signing, custody or transfer |
| `KGEN-KAIOS/V11/PLAYER_AI_STANDARD.md` | AI lifecycle, resource limits and audit boundaries |
| `KGEN-KAIOS/civilization/PAYROLL_STANDARD.md` | Evidence, review, pricing unit, ledger entry and approval |
| `KGEN-KAIOS/civilization/KAIOS_AI_EMPLOYMENT_ENTERPRISE_SCHEMA_DRAFT.json` | Life ID priority, wallet separation and no real KGEN |
| `KGEN-KAIOS/world-viewer/player/player-controller.js` | Synthetic player and no-device-location boundary |
| `KGEN-KAIOS/world-viewer/genesis/genesis-runtime.js` | Deterministic local genesis and starter-resource pattern |
| `KGEN-KAIOS/world-viewer/economy/economy-runtime.js` | Bounded synthetic economy pattern |
| `KGEN-KAIOS/world-viewer/enterprise/ai-company-organism-runtime.js` | Local AI company review boundary |

## Genesis Flow

```text
PLAYER_PROFILE
-> CONSENT
-> BIRTHPLACE
-> STARTER_LOCATION
-> LIFE_IDENTITIES
-> SIMULATED_ACCOUNTS
-> HOUSEHOLD
-> STARTER_LAND
-> PRIMITIVE_FORAGING
-> FIRST_WORK_ORDER
```

GPS, navigation and step-counter consent are independently recorded as
`CONSENT_GRANTED`, `CONSENT_DENIED`, or `CONSENT_NOT_ASKED`. GPS denial uses
a manual synthetic location. Exact coordinates and location history are never
stored. Birthday remains in the local simulation and is represented publicly
only as `LOCAL_PRIVATE_VALUE_RECORDED`.

## Identity and Household

The deterministic seed produces separate Player Life, AI Life, Household,
Starter Land, Employment, Work Order and Payroll identifiers. The default AI
is both `ASSISTANT_AI` and `FAMILY_AI`. Household relationships are simulation
records and do not create legal marriage or personhood.

The first descendant is `SIMULATED_DESCENDANT`. Population cap, household
capacity, resource cost and birth cooldown prevent unbounded reproduction.

## Accounts and Ledger

Player, AI and Household each receive a distinct `SIMULATED_WALLET` profile.
Every ledger entry has one debit, one credit, a positive amount and an explicit
contract. Salary can originate only from:

- `CUSTOMER_WORK_ORDER_BUDGET`
- `SIMULATED_COMPANY_PAYROLL_BUDGET`
- `SIMULATED_PUBLIC_WORK_BUDGET`

The first payroll distributes 120 simulated units as 72 to Player, 36 to AI,
and 12 to the Household under employment and voluntary household contracts.
AI income is never automatically owned by the Player.

## Work and Review

The first job pairs `BUILDING_LABORER` with `SURVEY_ASSISTANT`. Four attendance
ticks consume Player stamina and AI energy/compute before completion. Payroll
stays ineligible until the local Codex AI Company passes Specification,
Program, Physics, Economy, Rights, Safety, Tests and Acceptance gates.

The closed loop records `INCOME`, `HOUSEHOLD_TRANSFER`, `CONSUMPTION`,
`MAINTENANCE`, `EXPENSE`, `TAX_SIMULATION`, and `SAVINGS`. Funds are transferred
between accounts; they are never created by a button after genesis budgets.

## AI Needs and Lifecycle

`DIGITAL_AI`, `ROBOTIC_AI`, and `BIOLOGICAL_AI` have distinct energy, food,
housing and maintenance requirements. Digital and robotic AI do not consume
human food. Lifecycle transitions are replayable. A deceased life stops work
and salary; Life History remains in the simulation export.

## Storage and Export

`localStorage` is optional local persistence with no server authority. Export
is labeled `NON_AUTHORITATIVE_SIMULATION`. Import validates wallet separation,
GPS privacy, settlement boundaries, population cap and ledger integrity.
