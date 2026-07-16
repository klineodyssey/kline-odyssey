---
TITLE: "KAIOS Life OS API Architecture Draft"
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
CHANGE_REASON: "Define a transport-neutral Life OS interface with strict domain and mutation boundaries."
ANCESTOR: "KGEN-KAIOS/life/LIFE_OPERATING_SYSTEM.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: RuntimeArchitecture
CLASS: LifeInterfaceContract
ORDER: TransportNeutralAPI
FAMILY: KAIOS
GENUS: LifeOS
SPECIES: LifeOSAPIArchitecture
CANONICAL_FILE: "KGEN-KAIOS/life/LIFE_API.md"
---

# Life OS API

## 1. API Status

This is a frozen architecture interface, not a REST deployment, SDK, server or executable Runtime. Operation names are transport-neutral and may later be mapped to local calls, events or approved network protocols. The interface is shared; Species OS policies and Individual Life OS implementations are not.

## 2. Design Principles

1. Life OS state is private by default.
2. Commands request transitions; callers do not set internal state.
3. Queries return least-privilege projections.
4. Every mutation uses optimistic state versioning and idempotency.
5. Universe time, Body profile and immutable Species OS identity/version are mandatory inputs.
6. API operations contain no market, company, mission, salary, land or review semantics.
7. Adapter identity and capability are verified before payload interpretation.
8. Errors fail closed and never partially mutate state.

## 3. Command Envelope

```json
{
  "api_version": "life-os-api-1.0",
  "command_id": "CMD-UNIQUE-ID",
  "operation": "REQUEST_SLEEP",
  "life_id": "LIFE-EXAMPLE-0001",
  "body_id": "BODY-EXAMPLE-0001",
  "species_os_id": "SPECIES-OS-ROBOT-WORKER",
  "species_os_version": "1.0.0",
  "expected_state_version": 42,
  "observed_universe_time": "UT-0000000042",
  "source_adapter": "MIND_ACTION_ADAPTER",
  "authorization_ref": "OPAQUE-AUTH-REF",
  "correlation_id": "CORR-UNIQUE-ID",
  "causation_id": "EVENT-OPTIONAL-PARENT",
  "idempotency_key": "IDEMPOTENCY-UNIQUE-ID",
  "privacy_class": "RESTRICTED_LIFE_DATA",
  "payload": {},
  "evidence_refs": []
}
```

`authorization_ref` is opaque. Life OS validates its capability and expiry through a host adapter but does not learn employer, spouse, owner, bank, mission or political context.

## 4. Command Operations

### 4.1 Initialization And Birth

| Operation | Purpose | Required Capability |
|---|---|---|
| `INITIALIZE_LIFE` | Validate Body and profile and enter Life initialization | `LIFE_INITIALIZE` |
| `START_GESTATION` | Begin a supported gestational process | `LIFE_REPRODUCTION_AUTHORIZE` |
| `ADVANCE_GESTATION` | Apply one ordered gestation step | `LIFE_MAINTENANCE_TICK` |
| `REQUEST_BIRTH_TRANSITION` | Validate a unique child identity and viable Body | `LIFE_BIRTH_AUTHORIZE` |
| `COMPLETE_BIRTH` | Atomically establish the born state and event | `LIFE_BIRTH_COMMIT` |

### 4.2 Maintenance

| Operation | Purpose | Required Capability |
|---|---|---|
| `APPLY_PHYSICS_TICK` | Apply ordered time and environment constraints | `PHYSICS_INPUT` |
| `REPORT_BODY_SIGNAL` | Submit sensor or integrity observations | `BODY_SIGNAL_WRITE` |
| `SUPPLY_ENERGY` | Offer profile-compatible energy | `RESOURCE_SUPPLY` |
| `SUPPLY_NUTRITION` | Offer nutrition or maintenance material | `RESOURCE_SUPPLY` |
| `SUPPLY_WATER` | Offer water or equivalent fluid | `RESOURCE_SUPPLY` |
| `REQUEST_REPAIR` | Ask Life OS to evaluate a repair action | `LIFE_REPAIR_REQUEST` |
| `REPORT_DISEASE_OR_FAULT_SIGNAL` | Report a profile-defined harmful process | `BODY_SIGNAL_WRITE` |
| `REQUEST_IMMUNE_RESPONSE` | Ask for a profile-defined containment response | `LIFE_REPAIR_REQUEST` |

Heartbeat, circulation, breathing, digestion, nutrition allocation, temperature control, water balance, waste and energy consumption are outputs of accepted maintenance transitions. External callers do not set their results directly.

### 4.3 Activity

| Operation | Purpose | Required Capability |
|---|---|---|
| `REQUEST_REST` | Enter reduced activity if guards pass | `LIFE_ACTIVITY_REQUEST` |
| `REQUEST_SLEEP` | Start physiological or maintenance sleep | `LIFE_ACTIVITY_REQUEST` |
| `REQUEST_WAKE` | Begin wake transition | `LIFE_ACTIVITY_REQUEST` |
| `REQUEST_DORMANCY` | Enter profile-defined dormancy | `LIFE_ACTIVITY_REQUEST` |
| `REQUEST_DORMANCY_END` | Resume from dormancy | `LIFE_ACTIVITY_REQUEST` |

### 4.4 Growth, Aging And End Of Life

| Operation | Purpose | Required Capability |
|---|---|---|
| `ADVANCE_GROWTH` | Apply profile-bounded structural development | `LIFE_MAINTENANCE_TICK` |
| `ADVANCE_AGE` | Apply ordered age progression | `LIFE_MAINTENANCE_TICK` |
| `REPORT_VIABILITY_LOSS` | Submit evidence of critical viability loss | `BODY_SIGNAL_WRITE` |
| `REQUEST_END_OF_LIFE_EVALUATION` | Evaluate dying-state entry without forcing it | `LIFE_END_OF_LIFE_REQUEST` |
| `CONFIRM_DEATH` | Finalize death only after profile evidence passes | `LIFE_DEATH_COMMIT` |

There is no `KILL`, `DELETE_LIFE`, `SET_HEALTHY`, `SET_AGE`, `SET_PREGNANT`, or `REVIVE` command.

## 5. Query Operations

| Operation | Projection |
|---|---|
| `GET_LIFE_STATE` | All five state regions, subject to capability |
| `GET_PUBLIC_LIFE_STATUS` | Minimal alive/dead and public profile state |
| `GET_BODY_STATUS` | Structural and organ-system projection |
| `GET_RESOURCE_BALANCE` | Energy, water, nutrition and waste balances |
| `GET_CAPABILITY_PROFILE` | Required, optional and not-applicable capabilities |
| `GET_EVENT_RANGE` | Authorized immutable event range |
| `GET_LIFE_SNAPSHOT` | Versioned checkpoint projection |
| `GET_HEALTH_PROJECTION` | Capability-scoped health summary |

Public projections must not expose pregnancy, disease, pain, genome, exact sensor values or private health history by default.

## 6. Response Envelope

```json
{
  "command_id": "CMD-UNIQUE-ID",
  "accepted": true,
  "result_code": "ACCEPTED",
  "previous_state_version": 42,
  "new_state_version": 43,
  "event_id": "LIFE-EVENT-UNIQUE-ID",
  "projection": {},
  "invariant_results": [],
  "warnings": []
}
```

Rejected requests return the prior state version and no Life event ID.

## 7. Error Contract

| Code | Meaning |
|---|---|
| `LIFE_NOT_FOUND` | No authorized life instance is visible |
| `BODY_NOT_FOUND` | Required Body is unavailable |
| `PROFILE_NOT_FOUND` | Species Life OS profile is unavailable |
| `PROFILE_REVIEW_REQUIRED` | Unknown or incompatible profile requires review |
| `LIFE_STATE_CONFLICT` | Expected version differs from current version |
| `TIME_ORDER_VIOLATION` | Universe time is missing or older than current state |
| `CAPABILITY_DENIED` | Caller lacks required capability |
| `LIFE_OS_DOMAIN_VIOLATION` | Payload contains an upper-layer business concept |
| `RESOURCE_INVARIANT_VIOLATION` | Conservation or minimum viability rule failed |
| `TRANSITION_FORBIDDEN` | State machine does not allow the requested transition |
| `SENSITIVE_DATA_DENIED` | Requested projection exceeds privacy capability |
| `IDEMPOTENCY_CONFLICT` | Key was reused with a different payload |
| `LIFE_TERMINAL` | Individual is dead and cannot accept mutation commands |

## 8. Adapter Contract

Adapters are host-owned and one-way bounded:

| Adapter | May Send | May Receive | Must Not Do |
|---|---|---|---|
| Physics | time, environment, conserved-resource constraints | consumption and viability events | access Mind or Citizen data |
| Body | sensor and integrity signals | effector requests | mutate Life state directly |
| Mind | voluntary activity requests | permitted sensory/pain/health signals | set health, energy, age or death |
| Citizen | opaque authorization refs | minimal life-status projection | send salary, market or property fields |
| Civilization Aggregate | no mutation commands | privacy-safe aggregates | identify private individuals without authority |
| Robot Host | hardware signals and resource supply | maintenance actions | inject model reasoning into Life OS |

Life OS has no Company OS adapter.

## 9. API Versioning

- `api_version` is mandatory.
- Additive fields must be optional until a reviewed compatibility level requires them.
- Breaking changes require a new major contract version, migration proposal and rollback path.
- State and events retain their original schema version.
- An adapter must negotiate compatibility before issuing a mutation command.

## 10. Audit And Privacy

API audit records include command identity, adapter, capability decision, hash, result code and state versions. Audit records exclude secret tokens, private prompts, exact private medical data and unnecessary payload copies.

## 11. Architecture Boundary

No endpoint, handler, SDK, authentication service, database or deployment is created by this proposal.
