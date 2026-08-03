# KAIOS Life Existence, Agency and Economy Model V1

Status: `APPROVED_SPECIFICATION`

Authority: `CODEX_CANONICAL_ARCHITECT / SIMULATION_ONLY`

## Purpose

This model prevents economic participation from becoming a test for whether a
life exists. It composes with Canonical Life and does not redefine its schema.

## Axis A: Life Existence

A life record requires `life_id`, `life_type`, a birth or formation record,
location, timeline, resource or energy needs, health or integrity, change,
aging or wear, death/termination/collapse rules and event history.

Life existence does not require a wallet, wage, market value or agency.

## Axis B: Agency Level

Allowed values are:

- `NO_AGENCY`
- `REACTIVE`
- `TASK_BOUND`
- `SEMI_AUTONOMOUS`
- `AUTONOMOUS_GOVERNED`

Agency grants no economic balance, reproduction authority, external autonomy
or Canonical promotion. Physical AI bodies remain subject to one body, one
location and one primary physical job at a time.

## Axis C: Economic Capability

Allowed values are:

- `NO_ACCOUNT`
- `DEPENDENT_ACCOUNT`
- `CUSTODIAL_ACCOUNT`
- `COLONY_RESOURCE_LEDGER`
- `SIMULATED_WALLET`
- `INDEPENDENT_ECONOMIC_ENTITY`

`INDEPENDENT_ECONOMIC_ENTITY` remains simulation-only in this version. It does
not imply legal personhood, real banking or real ownership.

## Required Examples

| Life or group | Existence | Agency | Economic capability |
|---|---|---|---|
| Grass | valid life | `NO_AGENCY` | `NO_ACCOUNT` |
| Fish | valid life | `REACTIVE` | `NO_ACCOUNT` |
| Worker AI | valid digital life | `TASK_BOUND` or governed higher level | `SIMULATED_WALLET` when payroll-enabled |
| Ant colony | valid group binding | bounded collective behavior | `COLONY_RESOURCE_LEDGER` |
| Household | social group binding | governed participants | `COLONY_RESOURCE_LEDGER` or custodial accounts |

## Invariants

1. Missing economic capability never invalidates `LIFE_EXISTENCE`.
2. Missing wallet blocks wallet-dependent payment only.
3. Economic stress produces dependency, suspension, maintenance stress,
   unemployment, insolvency or archival review; it does not create predation.
4. Predation and food-chain events require compatible ecological roles,
   locations, resources and causal events.
5. Credits do not satisfy biological, physical or digital resource needs.
6. Every axis change is explicit, authorized and event-recorded.
