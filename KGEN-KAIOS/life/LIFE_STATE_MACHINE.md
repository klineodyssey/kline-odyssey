---
TITLE: "KAIOS Life OS State Machine Architecture"
VERSION: "1.0.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_BASELINE_FROZEN"
ARCHITECTURE: "ONLY"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-15"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Codex delegated GM internal independent review"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-LIFE-OS-ARCHITECTURE-001"
HUMAN_DECISION_ID: "HUMAN-LIFE-OS-ARCHITECTURE-001; HUMAN-KAIOS-BOOT-RUNTIME-001; HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Define life-maintenance states without importing Mind, Citizen, Civilization or Company states."
ANCESTOR: "KGEN-KAIOS/life/LIFE_OPERATING_SYSTEM.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: RuntimeArchitecture
CLASS: LifeStateContract
ORDER: OrthogonalStateMachine
FAMILY: KAIOS
GENUS: LifeOS
SPECIES: LifeOSStateMachineArchitecture
CANONICAL_FILE: "KGEN-KAIOS/life/LIFE_STATE_MACHINE.md"
---

# Life OS State Machine

## 1. Design Rule

One overloaded `status` cannot safely represent existence, sleep, health, age and reproduction. Each Individual Life OS therefore uses five orthogonal state regions governed by its immutable Species OS version:

1. `existence_state`
2. `activity_state`
3. `health_state`
4. `life_stage`
5. `reproduction_state`

Every accepted transition increments that Individual's `state_version` and emits one immutable Life Event. Species OS revisions have a separate version and can change only through an approved migration.

## 2. Existence State

| State | Meaning |
|---|---|
| `BODY_ONLY` | Structure exists; active life has not been initialized |
| `LIFE_INITIALIZING` | Body, profile, Physics time and initial resources are being validated |
| `GESTATING` | Pre-birth life is maintained by a supported gestation profile |
| `BIRTH_TRANSITION` | Unique identity and initial viable state are being atomically established |
| `ALIVE` | Life OS is actively maintaining viability |
| `DYING` | Viability is below recoverable profile limits and finalization is in progress |
| `DEAD` | Final terminal state of this individual |

### 2.1 Existence Transitions

| From | Event | Guard | To |
|---|---|---|---|
| `BODY_ONLY` | `LIFE_INITIALIZATION_REQUESTED` | Body and Species profile valid | `LIFE_INITIALIZING` |
| `LIFE_INITIALIZING` | `GESTATION_STARTED` | Profile supports gestation and authorization ref is valid | `GESTATING` |
| `LIFE_INITIALIZING` | `BIRTH_READY` | Non-gestational birth profile and minimum resources valid | `BIRTH_TRANSITION` |
| `LIFE_INITIALIZING` | `INITIALIZATION_FAILED` | Any mandatory invariant fails | `BODY_ONLY` |
| `GESTATING` | `BIRTH_READY` | Gestation completion and viability guards pass | `BIRTH_TRANSITION` |
| `BIRTH_TRANSITION` | `BIRTH_COMPLETED` | New identity unique; initial snapshot and event durable | `ALIVE` |
| `BIRTH_TRANSITION` | `BIRTH_FAILED` | Atomic birth cannot complete | prior valid state |
| `ALIVE` | `IRREVERSIBLE_VIABILITY_LOSS` | Profile-defined critical evidence validated | `DYING` |
| `DYING` | `VIABILITY_RESTORED` | Repair remains possible and invariants pass | `ALIVE` |
| `DYING` | `DEATH_CONFIRMED` | Final viability checks and evidence pass | `DEAD` |

`DEAD -> ALIVE` is forbidden. Revival, rebirth, restore or mythology mechanics must create a new governed individual or revision with lineage to the prior identity.

## 3. Activity State

Activity State is meaningful only while existence is `ALIVE` or recoverably `DYING`.

| State | Meaning |
|---|---|
| `AWAKE` | Normal active maintenance |
| `RESTING` | Reduced voluntary activity while still responsive |
| `SLEEP_REQUESTED` | Sleep guards are being checked |
| `ASLEEP` | Physiological or maintenance sleep |
| `WAKING` | Wake transition is in progress |
| `DORMANT` | Species-defined long-duration low-activity state |
| `NOT_APPLICABLE` | Profile has no activity cycle |

| From | Event | Guard | To |
|---|---|---|---|
| `AWAKE` | `REST_STARTED` | Profile permits rest | `RESTING` |
| `RESTING` | `ACTIVITY_RESUMED` | Energy and health guards pass | `AWAKE` |
| `AWAKE` or `RESTING` | `SLEEP_REQUESTED` | No critical incompatible process | `SLEEP_REQUESTED` |
| `SLEEP_REQUESTED` | `SLEEP_STARTED` | Checkpoint and safety guards pass | `ASLEEP` |
| `ASLEEP` | `WAKE_REQUESTED` | Wake trigger and minimum energy valid | `WAKING` |
| `WAKING` | `WAKE_COMPLETED` | Required systems restored | `AWAKE` |
| `AWAKE` or `ASLEEP` | `DORMANCY_STARTED` | Species profile permits dormancy | `DORMANT` |
| `DORMANT` | `DORMANCY_ENDED` | Environment and resources valid | `WAKING` |

Dream is not an Activity State. It is optional Mind Runtime behavior during Life OS sleep.

## 4. Health State

| State | Meaning |
|---|---|
| `HEALTHY` | Profile-relative viability is within normal range |
| `STRESSED` | One or more resources or environment values approach limits |
| `INJURED` | Body integrity is damaged |
| `DISEASED` | A harmful biological, integrity or fault process is active |
| `REPAIRING` | Repair or immune response is actively restoring integrity |
| `CRITICAL` | Immediate viability risk exists |
| `NOT_APPLICABLE` | Profile has no health dimension, permitted only for non-life candidates |

Health State is calculated from evidence and profile thresholds. External callers cannot directly set `HEALTHY` or clear `DISEASED`.

Allowed transitions are evidence-driven:

- `HEALTHY -> STRESSED | INJURED | DISEASED | CRITICAL`
- `STRESSED -> HEALTHY | REPAIRING | CRITICAL`
- `INJURED -> REPAIRING | CRITICAL`
- `DISEASED -> REPAIRING | CRITICAL`
- `REPAIRING -> HEALTHY | STRESSED | CRITICAL`
- `CRITICAL -> REPAIRING | DYING`

`DEAD` existence overrides all Health and Activity states.

## 5. Life Stage

| Stage | Biological Meaning | Robot/Digital Mapping |
|---|---|---|
| `PRE_BIRTH` | embryo, seed or pre-birth form | assembly or provisioning |
| `JUVENILE` | developing individual | commissioning and calibration |
| `MATURE` | normal adult capability | supported service period |
| `AGING` | irreversible age-related change | wear and degradation period |
| `END_OF_LIFE` | terminal life stage | decommissioning period |

Stage advancement requires ordered time and profile-specific evidence. It cannot be purchased, assigned by employment, or changed by Citizen rank.

## 6. Reproduction State

| State | Meaning |
|---|---|
| `NOT_APPLICABLE` | Species profile does not reproduce through this Life OS mode |
| `INACTIVE` | Reproduction not currently available |
| `ELIGIBLE` | Profile health, stage and compatibility conditions pass |
| `AUTHORIZED` | Opaque upper-layer authorization reference validated |
| `GESTATING` | Pregnancy, incubation, seed formation or synthetic build is active |
| `BIRTH_READY` | Child Body and identity prerequisites are ready |
| `POST_BIRTH_RECOVERY` | Parent or source organism is recovering after birth |

Marriage, ownership, custody, payment and inheritance are not reproduction states. Life OS validates only the opaque authorization, compatibility, resources and body process.

## 7. Composite State Example

```json
{
  "life_id": "LIFE-EXAMPLE-0001",
  "state_version": 42,
  "existence_state": "ALIVE",
  "activity_state": "ASLEEP",
  "health_state": "REPAIRING",
  "life_stage": "MATURE",
  "reproduction_state": "INACTIVE",
  "profile_id": "ROBOT_LIFE_OS_V1",
  "observed_universe_time": "UT-0000000042"
}
```

This means a mature Robot individual is alive, in maintenance sleep, and repairing. It says nothing about emotion, employment, mission, ownership or company status.

## 8. Transition Envelope

Every requested transition carries:

- `transition_id`
- `life_id`
- `body_id`
- `event_type`
- `expected_state_version`
- `observed_universe_time`
- `profile_id`
- `source_adapter`
- `authorization_ref` when required
- `idempotency_key`
- `evidence_refs`
- `requested_at`

The result carries:

- `accepted`
- `failure_code`
- `previous_state_version`
- `new_state_version`
- `event_id`
- `state_before`
- `state_after`
- `invariant_results`

## 9. Forbidden Transitions

- `BODY_ONLY -> ALIVE` without initialization and birth
- `DEAD -> ALIVE`
- any Activity transition while `DEAD`
- `NOT_APPLICABLE -> GESTATING` without a reviewed profile revision
- `JUVENILE -> END_OF_LIFE` without a validated critical cause
- `AGING -> JUVENILE` for the same individual
- direct upper-layer mutation of any state region
- state change without event, state version or ordered time
- birth that reuses an existing `life_id`
- death that deletes prior events or ownership records

## 10. Failure And Recovery

A partial transition never becomes visible. State and event append are atomic at the architecture contract level.

If a transition fails:

1. preserve the prior valid state;
2. emit a rejected-operation audit record outside the Life event stream;
3. do not increment `state_version`;
4. return a deterministic failure code;
5. require a new request after dependencies are revalidated.

Recovery restores only a valid checkpoint plus all subsequent accepted events. It does not invent missing heartbeat, birth, pregnancy, repair or death history.

## 11. Architecture Boundary

This state machine is a proposal. No state store, scheduler, process, API endpoint, simulator or migration is implemented.
