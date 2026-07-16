---
TITLE: "KAIOS Life OS Event Contract Architecture"
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
CHANGE_REASON: "Define immutable, ordered and privacy-aware events for all Life OS capabilities."
ANCESTOR: "KGEN-KAIOS/life/LIFE_OPERATING_SYSTEM.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: RuntimeArchitecture
CLASS: LifeEventContract
ORDER: EventSourcedLife
FAMILY: KAIOS
GENUS: LifeOS
SPECIES: LifeOSEventArchitecture
CANONICAL_FILE: "KGEN-KAIOS/life/LIFE_EVENT_CONTRACT.md"
---

# Life OS Event Contract

## 1. Event Rule

Every accepted Individual Life OS mutation emits exactly one immutable event bound to the governing Species OS version. Events describe observed life-maintenance changes; they do not contain employment, market, mission, company or political decisions.

## 2. Canonical Event Envelope

```json
{
  "event_schema_version": "life-event-1.0",
  "event_id": "LIFE-EVENT-UNIQUE-ID",
  "event_type": "HEARTBEAT_RECORDED",
  "life_id": "LIFE-EXAMPLE-0001",
  "body_id": "BODY-EXAMPLE-0001",
  "species_code": "ROBOT_WORKER_V1",
  "species_os_id": "SPECIES-OS-ROBOT-WORKER",
  "species_os_version": "1.0.0",
  "profile_id": "ROBOT_LIFE_OS_V1",
  "sequence": 43,
  "previous_state_version": 42,
  "resulting_state_version": 43,
  "occurred_at_universe_time": "UT-0000000043",
  "recorded_at": "2026-07-15T18:00:00+08:00",
  "correlation_id": "CORR-UNIQUE-ID",
  "causation_id": "EVENT-OPTIONAL-PARENT",
  "source_adapter": "ROBOT_BODY_ADAPTER",
  "source_event_ref": "OPAQUE-SOURCE-REF",
  "idempotency_key": "IDEMPOTENCY-UNIQUE-ID",
  "privacy_class": "RESTRICTED_LIFE_DATA",
  "state_before": {},
  "state_after": {},
  "measurements": {},
  "resource_delta": {},
  "invariant_results": [],
  "evidence_refs": [],
  "payload_hash": "SHA256",
  "redaction_profile": "DEFAULT_PRIVATE"
}
```

## 3. Required Fields

- `event_schema_version`
- `event_id`
- `event_type`
- `life_id`
- `body_id`
- `species_code`
- `species_os_id`
- `species_os_version`
- `profile_id`
- `sequence`
- `previous_state_version`
- `resulting_state_version`
- `occurred_at_universe_time`
- `recorded_at`
- `correlation_id`
- `source_adapter`
- `idempotency_key`
- `privacy_class`
- `state_before`
- `state_after`
- `resource_delta`
- `invariant_results`
- `payload_hash`

## 4. Life Event Catalog

| Capability | Event Types |
|---|---|
| Heartbeat | `HEARTBEAT_RECORDED`, `HEARTBEAT_MISSED` |
| Blood Circulation | `CIRCULATION_CYCLE_RECORDED`, `CIRCULATION_DEGRADED` |
| Breathing | `BREATH_CYCLE_RECORDED`, `GAS_EXCHANGE_DEGRADED` |
| Digestion | `DIGESTION_STARTED`, `DIGESTION_COMPLETED`, `DIGESTION_FAILED` |
| Nutrition | `NUTRITION_ABSORBED`, `NUTRITION_DEFICIT_DETECTED` |
| Growth | `GROWTH_ADVANCED`, `GROWTH_BLOCKED` |
| Repair | `REPAIR_STARTED`, `REPAIR_PROGRESS_RECORDED`, `REPAIR_COMPLETED`, `REPAIR_FAILED` |
| Sleep | `SLEEP_REQUESTED`, `SLEEP_STARTED`, `SLEEP_MAINTENANCE_RECORDED` |
| Wake | `WAKE_REQUESTED`, `WAKE_STARTED`, `WAKE_COMPLETED`, `WAKE_FAILED` |
| Pain | `PAIN_SIGNAL_EMITTED`, `PAIN_SIGNAL_CLEARED` |
| Health | `HEALTH_STATE_CHANGED`, `HEALTH_THRESHOLD_CROSSED` |
| Disease | `DISEASE_OR_FAULT_DETECTED`, `DISEASE_OR_FAULT_PROGRESS_RECORDED`, `DISEASE_OR_FAULT_RESOLVED` |
| Immune System | `IMMUNE_RESPONSE_STARTED`, `IMMUNE_RESPONSE_UPDATED`, `IMMUNE_RESPONSE_ENDED` |
| Energy Consumption | `ENERGY_CONSUMED`, `ENERGY_SUPPLIED`, `ENERGY_DEFICIT_DETECTED` |
| Temperature Control | `TEMPERATURE_ADJUSTED`, `TEMPERATURE_LIMIT_CROSSED` |
| Water Balance | `WATER_ABSORBED`, `WATER_CONSUMED`, `WATER_IMBALANCE_DETECTED` |
| Waste | `WASTE_PRODUCED`, `WASTE_RELEASED`, `WASTE_ACCUMULATION_DETECTED` |
| Reproduction | `REPRODUCTION_ELIGIBILITY_CHANGED`, `REPRODUCTION_AUTHORIZED`, `REPRODUCTION_CANCELLED` |
| Pregnancy | `GESTATION_STARTED`, `GESTATION_PROGRESS_RECORDED`, `GESTATION_COMPLICATION_DETECTED`, `GESTATION_ENDED` |
| Birth | `BIRTH_READY`, `BIRTH_STARTED`, `BIRTH_COMPLETED`, `BIRTH_FAILED` |
| Aging | `AGE_ADVANCED`, `LIFE_STAGE_CHANGED` |
| Death | `DYING_STARTED`, `VIABILITY_RESTORED`, `DEATH_CONFIRMED` |
| Life Cycle | `LIFE_INITIALIZATION_REQUESTED`, `LIFE_INITIALIZED`, `LIFE_CYCLE_TRANSITIONED` |

Profile adapters may add namespaced measurements, but may not redefine these canonical meanings.

## 5. Event Ordering And Idempotency

1. `sequence` equals `resulting_state_version` for accepted mutation events.
2. `previous_state_version + 1 = resulting_state_version`.
3. Universe time is monotonic for one `life_id`.
4. `event_id` is globally unique.
5. An `idempotency_key` replay with the same payload returns the original event.
6. An `idempotency_key` replay with a different payload is rejected.
7. Cross-life causality uses `correlation_id` and `causation_id`; it never shares mutable state.

## 6. Resource Delta

Resource changes are explicit and profile-scoped:

```json
{
  "energy": { "input": 10, "consumed": 3, "stored": 7, "unit": "PROFILE_ENERGY_UNIT" },
  "water": { "input": 2, "consumed": 1, "stored": 1, "unit": "PROFILE_FLUID_UNIT" },
  "nutrition": { "input": 5, "absorbed": 4, "waste": 1, "unit": "PROFILE_NUTRITION_UNIT" }
}
```

Units from different profiles are not directly interchangeable. KGEN, salary, money and market value are forbidden resource units in Life OS.

## 7. Privacy Classes

| Class | Intended Visibility |
|---|---|
| `PUBLIC_LIFE_STATUS` | Explicitly public alive/dead and non-sensitive profile status |
| `OWNER_OR_GUARDIAN` | Authorized owner/guardian projection where applicable |
| `LIFE_OPERATOR` | Authorized maintenance operator |
| `RESTRICTED_LIFE_DATA` | Health, pain, disease, pregnancy, genome and detailed sensor data |
| `AGGREGATE_ONLY` | De-identified civilization-scale statistics |
| `LEGAL_HOLD` | Restricted evidence retained by separate governance authority |

Pregnancy, disease, pain, genome, exact sensor and death-cause details default to `RESTRICTED_LIFE_DATA`.

## 8. Consumer Projections

| Consumer | Permitted Default Projection |
|---|---|
| Life Body adapter | effector request and required maintenance result |
| Mind Runtime | permitted pain, sensory, sleep, energy and health signals |
| Citizen Runtime | minimum life eligibility and consented status summary |
| Civilization Runtime | privacy-safe aggregates only |
| Company OS | none |
| Marketplace, Bank, Temple | none directly; upper-layer governed adapters only |

No consumer receives raw event storage access merely because it exists above Life OS.

## 9. Birth And Lineage

`BIRTH_COMPLETED` must include references to:

- new unique `life_id`
- new `body_id`
- `species_code`
- parent or source lineage where applicable
- Body and Life OS profile revisions
- authorization reference
- initial state snapshot hash
- compatibility result

It must not include private parent memory, secrets, wallet data, mission history or ownership assumptions.

## 10. Death Finality

`DEATH_CONFIRMED` seals the current individual's final Life OS state. Later inheritance, archive, memorial, resurrection story or new-life creation events occur outside the Life OS stream or under a new `life_id` linked by governed lineage.

Events are never deleted to make a life appear alive again.

## 11. Snapshot And Replay

- Events are authoritative for accepted state mutation.
- Snapshots accelerate reads but are derived and replaceable.
- Snapshot metadata includes last event ID, state version, source hash and profile version.
- Replay must reproduce the same state for the same profile and event versions.
- LOD aggregation may compress routine measurements but cannot remove canonical birth, lifecycle, reproduction, critical-health or death events.

## 12. Forbidden Payload

Life events must not contain:

- mission, WorkOrder or review decisions
- salary, payroll, wallet, price or payment
- land, property, market or listing rights
- company, department or worker performance
- political, military or Temple authority
- private keys, secrets, passwords or provider prompts
- unnecessary exact KYC, GPS or legal identity data

## 13. Architecture Boundary

No event bus, topic, database, stream processor, schema registry or telemetry deployment is created by this proposal.
