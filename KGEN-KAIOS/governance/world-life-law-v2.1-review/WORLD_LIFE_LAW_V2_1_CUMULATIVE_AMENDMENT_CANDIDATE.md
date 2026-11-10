# KAIOS World Life Law V2.1 Cumulative Amendment Candidate

Status: `REPEAT_BASELINE_REVIEW_CANDIDATE`

Artifact ID: `WORLD-LIFE-LAW-V2.1-CUMULATIVE-AMENDMENT-CANDIDATE-001`

Runtime Authority: `false`

Freeze: `NOT_APPROVED`

Implementation: `NOT_AUTHORIZED`

## Candidate Authority

This full cumulative candidate embeds Amendment 001, Amendment 002 Life Activity Contract, and the Human-approved P1 selections `A / B / A / A / A`. It is review input only. It does not modify the canonical World Life Law, Frozen Life OS, any CURRENT selector, Genesis, Universe Law, Token, Runtime, Production, Scheduler, Cursor dispatch, wallet or Real KGEN.

## Embedded Source Integrity

| Source | Commit | SHA-256 of raw UTF-8 Git blob |
|---|---|---|
| Amendment 001 | `6b6672bf91c4de232dcc3452a7e6ce6a2eb66b1d` | `6abeab8099e0af6252aa1b55f0907a2670788c304713848accdfc31fa2339892` |
| Amendment 002 Activity Contract | `6b6672bf91c4de232dcc3452a7e6ce6a2eb66b1d` | `a39fd6255fabac6632e0b1f7ea0b14d7e5604b804145a4c77cb7c1b51c1ff984` |
| P1 Integration Candidate | `a01ffe23807553067a5c23145e49b1c518c31612` | `817d2e344a26bba75c0fb5d71dfe2a592c53111594f9bace6e35da801d545c20` |

## Part I - Amendment 001
---
TITLE: "KAIOS World Life Law V2.1 Freeze Amendment 001"
VERSION: "1.0.0"
STATUS: "HUMAN_APPROVED_ARCHITECTURE_AMENDMENT"
AMENDS: "KAIOS World Life Law V2.1"
HUMAN_DECISION_ID: "HUMAN-WORLD-LIFE-LAW-V2_1-FREEZE-AMENDMENT-001"
ARCHITECTURE: "APPROVED_NOT_FROZEN"
IMPLEMENTATION: "NOT_STARTED"
WORKQUEUE: "NOT_CREATED"
DEPLOYMENT: "NOT_STARTED"
RUNTIME_AUTHORITY: false
SOURCE_OF_TRUTH_FOR_AMENDMENT_SCOPE: true
AMENDMENT_DATE: "2026-07-17"
---

### KAIOS World Life Law V2.1 Freeze Amendment 001

#### 1. Authority and Scope

This Human-approved Architecture amendment supplements the approved KAIOS World Life Law V2.1. It resolves only `FZ-P0-001` through `FZ-P0-004`; it neither rewrites the twenty-three laws nor changes their order, authority, or existing boundaries.

This document is normative for its amendment scope. It is not a Runtime, API, database schema, migration, UI, WorkQueue, deployment instruction, or freeze action. The Constitution, Human decisions, CURRENT selectors, and frozen baselines retain their established priority. A future implementation must obtain separate authorization.

#### 2. Sustainable Existence Principle

Every registered Life must have a Sustainable Existence Contract:

```text
EVERY_LIFE_REQUIRES_SUSTAINABLE_EXISTENCE_CONTRACT
```

The contract must identify:

- energy inputs and governed reserves;
- consumption and conversion rules;
- maintenance requirements and failure thresholds;
- class-appropriate lifecycle transitions;
- ordinary-absence and emergency protection policy;
- append-only history and state provenance.

Compute level, Intelligence Tier, Life Level, rights, authority, and maintenance method remain independent dimensions. A lower compute allocation does not reduce Life identity, and Life identity does not create legal personhood, citizenship, ownership, or Human authority.

#### 3. Food Lifecycle Contract

##### 3.1 Required lifecycle

Food-capable profiles must model the complete governed chain:

```text
Energy Source
-> Raw Material
-> Agriculture / Aquaculture / Livestock / Fishing
-> Feed Production
-> Food Production
-> Food Storage
-> Transportation
-> Cooking / Processing
-> Consumption
-> Digestion
-> Waste
-> Recycle
-> Environment
```

The chain is a lifecycle graph rather than a claim that every food item traverses every stage. Each skipped or substituted stage requires an explicit profile rule and provenance. Resource and energy conservation apply throughout.

##### 3.2 Food record

Each governed Food record must support at least:

| Field | Architecture meaning |
|---|---|
| `food_id` | Unique, immutable identity for the food item or batch. |
| `ingredient` / `ingredient_refs` | Ingredient identities and provenance; the scalar or collection form follows the item profile. |
| `nutrition` / `nutrition_profile` | Declared nutrition, water, and compatibility values with units and source class. |
| `energy_value` | Consumable simulation energy with declared unit and conversion rule. |
| `species_compatibility` | Species or class profiles allowed, restricted, or prohibited from consumption. |
| `quantity` | Measured amount and unit; never an unbounded resource. |
| `quality` | Versioned quality, contamination, safety, and integrity state. |
| `expiration` | Expiry or degradation rule, including profiles for non-perishable records. |
| `storage_requirement` | Temperature, containment, time, energy, and handling constraints where applicable. |
| `producer` / `producer_ref` | Responsible production entity and source stage. |
| `consumer` / `consumer_ref` | Consuming Life or aggregate consumption context, subject to privacy rules. |
| `waste_type` | Residual material and hazard classification. |
| `recycle_type` | Allowed recovery, compost, reuse, treatment, or disposal path. |

Implementations must also preserve batch or item version, lifecycle state, timestamps, location scope, evidence, and prior-state hash where required by the authoritative domain.

##### 3.3 Domain ownership

This law defines cross-domain invariants only. Authoritative state remains separated:

| Domain | Authoritative responsibility |
|---|---|
| Agriculture, Aquaculture, Livestock, Fishing | Source organism, environment, input, yield, welfare, and harvest records. |
| Feed Production | Feed composition, compatibility, batch, storage, and provenance. |
| Industry / Food Production | Processing, cooking, quality, transformation, and output records. |
| Logistics / Storage | Custody, quantity, conditions, transport, loss, and delivery evidence. |
| Citizen / Consumption | Authorized consumption event and inventory effect. |
| Life OS | Species-compatible digestion, need, health projection, and waste output only. |
| Environment | Waste, recycling, pollution, recovery, and carrying-capacity effects. |

Life OS may consume validated projections but must not take ownership of farms, inventories, transport, markets, or environmental registries.

##### 3.4 Species Energy Contract

Every listed class must declare `energy_source`, `consumption_rule`, and `maintenance_rule`. It must also declare reserve limits, depletion behavior, waste outputs, environmental constraints, and recovery conditions.

| Life class | Permitted Architecture profile |
|---|---|
| Human | Water and compatible nutrition; governed sleep, health, and maintenance. |
| Animal | Species-specific food web, water, oxygen or other medium, habitat, and care. |
| Plant | Light or other profile source, water, nutrients, gas exchange, substrate, and maintenance. |
| AI | Electricity or approved compute energy, storage, cooling, integrity, and software maintenance. |
| Robot | Electricity or approved energy cell, physical maintenance, parts, cooling, and integrity. |
| Building | Utility energy, structural maintenance, water or other services where required, and repair. |
| Temple | Building requirements plus its approved Temple energy and guardian-maintenance profile. |
| Company | Resource inflow, operational energy, personnel or agent capacity, finance projection, and organizational maintenance outside Life OS. |
| Advanced Civilization | Approved high-density sources subject to technology, conservation, safety, and governance. |

Not every class consumes Food. A Food record and an Energy record must not be treated as interchangeable unless an approved conversion profile explicitly permits it.

#### 4. Guardian Separation Contract

##### 4.1 Independent relationship types

The following roles are separate and must never be collapsed into one parent field:

| Relationship type | Meaning |
|---|---|
| `GUARDIAN` | Governed care responsibility; it does not establish biological or real-world legal parenthood. |
| `LEGAL_PARENT` | KAIOS game-governance parental authority; it is not a real-world legal determination. |
| `BIOLOGICAL_PARENT` | Biological lineage or DNA relationship; it does not automatically grant consent, custody, or legal authority. |
| `ADOPTIVE_PARENT` | Consent- and governance-approved adoptive relationship within KAIOS. |
| `HOUSEHOLD_MANAGER` | Co-residence and household resource administration; it grants no parental authority by itself. |
| `EMERGENCY_GUARDIAN` | Temporary, scoped, expiring care authority for a defined emergency. |

One Life may hold more than one relationship type only through independent records and independent authorization. Revoking one role does not silently revoke or create another.

##### 4.2 Relationship record

A governed relationship must support:

`relationship_id`, `subject_life_id`, `role_holder_life_id`, `relationship_type`, `relationship_source`, `consent_records`, `authority_scope`, `care_scope`, `start_time`, `end_time`, `revocation_rule`, `evidence_refs`, `review_status`, `privacy_class`, and `state_version`.

Relationship history is append-only. Corrections create a new version and preserve the prior record.

##### 4.3 Consent and location boundary

GPS, WiFi, an address, proximity, or co-residence must never create a parent, guardian, spouse, child, or sibling relationship. Voluntary location evidence may support a coarse and revocable co-residence claim only. It must remain purpose-limited, private by default, and insufficient without the required participant consent and governance review.

Real-world legal parenthood, custody, adoption, and guardianship remain outside this Architecture.

#### 5. NPC Compute Contract

##### 5.1 Compute profiles

Every simulated Life receives a bounded, versioned compute profile appropriate to its required behavior:

| Level | Profile | Typical examples | Intended behavior budget |
|---|---|---|---|
| `0` | `PASSIVE` | Stone, land, simple object | Event-driven state and infrequent maintenance only. |
| `1` | `VERY_LOW` | Plant, grass, tree | Slow lifecycle, environment response, and periodic growth. |
| `2` | `LOW` | Fish, chicken, cow, sheep, simple animal | Needs, movement, feeding, sleep, reproduction, and bounded threat response. |
| `3` | `MEDIUM` | Citizen, worker, merchant, police, doctor, teacher | Role behavior, schedule, social interaction, memory summary, and bounded decisions. |
| `4` | `HIGH` | Player projection, advanced NPC, scientist, entrepreneur | Rich interaction, planning, learning, and higher-fidelity memory under permission. |
| `5` | `ADAPTIVE` | Temple AI, Civilization AI, Guardian AI | Adaptive domain coordination with explicit authority and review limits. |
| `6` | `HIGHEST` | World Manager, Timeline Manager, Universe Manager | Exceptional management profile; Human Anchor, least privilege, quotas, and independent review are mandatory. |

Examples are defaults, not permanent identity assignments. The selected profile follows required capabilities, observed area, simulation LOD, risk, and budget. Compute level is not Intelligence Tier, Life Level, moral worth, rights, authority, or proof of consciousness.

##### 5.2 Compute profile record

Each profile must support:

`compute_profile_id`, `compute_level`, `simulation_frequency`, `reasoning_budget`, `memory_budget`, `sensor_budget`, `action_budget`, `model_class`, `scheduling_priority`, `sleep_or_dormant_cadence`, `fallback_policy`, `degrade_policy`, `observability_profile`, `energy_cost`, `privacy_scope`, `permission_scope`, and `version`.

Profiles must be quota-bounded. They may degrade safely under load, use event-driven or aggregate simulation, and increase fidelity only when authorized. Ordinary animals and passive entities must not require a large reasoning model. Level 5 and Level 6 profiles cannot use their compute allocation to expand authority or bypass Human Final Authority.

#### 6. Offline Protection Contract

##### 6.1 Care states

Normal player absence is governed by these care states:

```text
ACTIVE
-> SLEEP
-> DORMANT
-> GUARDIAN_CARE
-> HOSPITAL_CARE
-> CIVILIZATION_PROTECTION
```

This is an escalation model, not a requirement to pass through every state. A state transition must be authorized by lifecycle, health, resource, care-capacity, timeline, and civilization rules. `HOUSE_CARE` is a valid care provider context for `SLEEP` or `DORMANT` and does not create a new family role.

##### 6.2 Allowed and prohibited outcomes

Offline simulation may apply:

- bounded energy consumption;
- maintenance cost or debt accounting;
- ordered time and civilization progress;
- bounded skill progress where the activity was authorized before logout;
- care-provider capacity and resource use.

Ordinary elapsed offline time alone must never cause:

- direct hunger death;
- deletion of the Character or Life record;
- destruction of Life;
- silent reassignment of ownership, family, parent, guardian, or timeline identity.

Offline protection is not free unlimited progress or free resources. When resources are insufficient, nonessential progress may pause or degrade, maintenance may accrue under governed caps, and the Life may enter a higher care state or `SAFE_HOLD`. Any irreversible outcome requires active-state evidence, applicable rules, and review independent of ordinary absence.

##### 6.3 Offline record and return reconciliation

An offline protection record must support:

`offline_session_id`, `life_id`, `entered_at`, `care_state`, `care_provider_ref`, `resource_budget`, `maintenance_accrual`, `protected_needs`, `allowed_progress`, `prohibited_outcomes`, `timeline_id`, `civilization_state_version`, `checkpoint_ref`, `event_head`, `returned_at`, `reconciliation_status`, and `review_status`.

On return, the player resumes in the Current Timeline and current reviewed Civilization state. The system must replay ordered authorized events from the checkpoint, disclose material changes, reconcile conflicts without silent history rewrite, and fail safely when state integrity cannot be established.

#### 7. Resolution and Remaining Freeze Boundary

This amendment resolves the Architecture definitions for:

| Finding | Resolution |
|---|---|
| `FZ-P0-001` | Food Lifecycle Contract and Species Energy Contract defined. |
| `FZ-P0-002` | Guardian, parent, household, and emergency-care roles separated. |
| `FZ-P0-003` | Compute Levels 0 through 6 and bounded profile contract defined. |
| `FZ-P0-004` | Offline care, protection, and return reconciliation defined. |

The five P1 pre-freeze clarifications identified by the Baseline Review are outside this Human-approved amendment and remain open. Therefore, this amendment does not freeze the Architecture and does not authorize implementation.

#### 8. Boundary Attestation

```text
Runtime created: false
API created: false
Database created: false
UI created: false
Migration created: false
Implementation started: false
WorkQueue created: false
Deployment started: false
Runtime CURRENT modified: false
Universe Map CURRENT modified: false
Token Contract modified: false
Frozen baseline modified: false
Human Main modified: false
```

## Part II - Amendment 002 Life Activity Contract
---
TITLE: "KAIOS World Life Law V2.1 Life Activity Contract"
VERSION: "1.0.0"
STATUS: "HUMAN_APPROVED_ARCHITECTURE_AMENDMENT"
AMENDS: "KAIOS World Life Law V2.1"
HUMAN_DECISION_ID: "HUMAN-WORLD-LIFE-LAW-V2_1-FREEZE-AMENDMENT-002"
ARCHITECTURE: "APPROVED_NOT_FROZEN"
IMPLEMENTATION: "NOT_STARTED"
WORKQUEUE: "NOT_CREATED"
DEPLOYMENT: "NOT_STARTED"
RUNTIME_AUTHORITY: false
SOURCE_OF_TRUTH_FOR_ACTIVITY_SCOPE: true
AMENDMENT_DATE: "2026-07-17"
---

### KAIOS World Life Law V2.1 Life Activity Contract

#### 1. Authority and Scope

This Human-approved Architecture amendment defines the Life Activity Contract. It supplements the approved KAIOS World Life Law V2.1 and Freeze Amendment 001. It does not rewrite the twenty-three laws, modify the frozen Life OS state machine, create game logic, or authorize implementation.

The contract establishes these invariants:

```text
EVERY_LIFE_EXISTS_CONTINUOUSLY
OFFLINE_IS_A_LIFE_ACTIVITY_MODE
CULTIVATION_IS_A_LIFE_ACTIVITY
TRAVEL_IS_A_LIFE_ACTIVITY
DREAM_IS_A_MIND_SUB_ACTIVITY
THE_UNIVERSE_NEVER_STOPS_LIVING
```

Every applicable Life record must expose a governed Current Activity, transition history, permission result, reward policy, cost policy, and risk policy. A class profile may restrict or mark an activity unavailable; universal Life Identity does not imply universal capability.

#### 2. Source Audit and Frozen Boundary

The frozen `LIFE-OS-V1.0` Architecture already defines an orthogonal physiological `activity_state` with `AWAKE`, `RESTING`, `SLEEP_REQUESTED`, `ASLEEP`, `WAKING`, `DORMANT`, and `NOT_APPLICABLE`. It also establishes:

- Activity State is meaningful only while the individual is `ALIVE` or recoverably `DYING`.
- `DEAD` is terminal for the same individual.
- Dream is optional Mind Runtime behavior during sleep, not a Life OS physiological state.
- Life OS cannot issue missions, rewards, payments, ownership changes, Company work, or Timeline travel.

This amendment does not replace those rules. It defines a cross-layer activity projection that composes authoritative states from Life OS, Mind, Citizen, Company, Civilization, Travel, and other approved domains.

#### 3. Activity Layer Model

One overloaded state must not represent physiology, social work, travel, care, dreams, and existence. The Activity Contract therefore separates:

| Layer | Purpose | Examples |
|---|---|---|
| `existence_state` | Canonical existence owned by Life OS | `ALIVE`, `DYING`, `DEAD` |
| `life_os_activity_state` | Physiological or maintenance cycle owned by Life OS | `AWAKE`, `ASLEEP`, `DORMANT` |
| `current_activity` | One primary cross-layer activity projection | `WORKING`, `TRAVELING`, `MEDITATING` |
| `activity_variant` | Civilization- or profession-specific specialization | `PILGRIMAGE`, `MEDICAL_PRACTICE` |
| `care_context` | Optional provider or protection context | `GUARDIAN_CARE`, `HOSPITAL_CARE` |
| `sub_activity` | Optional bounded activity nested under the primary activity | `DREAMING` while `SLEEPING` |

The authoritative domain owns its activity facts. The Life Activity Contract exposes a versioned projection and cannot mutate the source domain.

#### 4. Life Activity Record

Each governed activity projection must support at least:

| Field | Architecture meaning |
|---|---|
| `activity_id` | Unique identity for one activity interval. |
| `life_id` | Life Identity performing or receiving the activity. |
| `current_activity` | Canonical primary activity. |
| `activity_variant` | Optional approved specialization. |
| `activity_domain` | Domain that owns the activity facts. |
| `authority_ref` | Authoritative source record or adapter reference. |
| `activity_state_version` | Monotonic projection version. |
| `started_at` | Ordered Universe time at accepted start. |
| `expected_end_at` | Optional bounded end or review time. |
| `offline_mode` | Whether and how the activity may continue while the player is absent. |
| `permission_result` | Versioned capability and authorization result. |
| `reward_policy_ref` | Evidence-gated reward definition; not a guaranteed payout. |
| `cost_policy_ref` | Time, energy, resource, maintenance, and opportunity costs. |
| `risk_policy_ref` | Bounded hazards, failure states, and recovery policy. |
| `checkpoint_ref` | Last durable checkpoint for resume or reconciliation. |
| `evidence_refs` | Evidence required for progress and reward. |
| `status` | Requested, active, paused, completed, failed, cancelled, or terminal projection. |

There is at most one primary `current_activity` per Life projection. Care contexts and sub-activities are separate and cannot silently replace the primary activity.

#### 5. Canonical Activity Vocabulary

The minimum vocabulary is:

| Activity | Contract meaning | Primary authority |
|---|---|---|
| `ACTIVE` | Available and responsive without a more specific primary activity | Life projection |
| `WORKING` | Performing an authorized profession, job, service, or organization duty | Citizen / Company domain |
| `SLEEPING` | Physiological or maintenance sleep | Life OS projection |
| `RESTING` | Reduced voluntary activity while responsive | Life OS projection |
| `TRAINING` | Practicing a governed capability | Skill / Education domain |
| `MEDITATING` | Bounded cultivation or mind-stability practice | Mind / Cultivation profile |
| `STUDYING` | Reading, instruction, or structured learning | Education / Mind domain |
| `TRAVELING` | Following an authorized route between valid locations | Transport / Travel domain |
| `EXPLORING` | Surveying an authorized environment or route | Exploration domain |
| `RESEARCHING` | Conducting approved research or experiment activity | Research domain |
| `PATROLLING` | Observing an assigned area under a lawful role | Citizen / Governance domain |
| `GUARDING` | Protecting an approved person, place, asset, or boundary | Guardian / Governance domain |
| `HUNTING` | Species- and environment-governed hunting simulation | Ecology / Citizen domain |
| `FISHING` | Species- and resource-governed fishing activity | Ecology / Production domain |
| `FARMING` | Governed cultivation or farm work | Agriculture domain |
| `BUILDING` | Authorized construction or repair work | Building / Land domain |
| `RECOVERING` | Health or integrity recovery under applicable care | Life OS health projection |
| `HOSPITAL` | Managed hospital-care activity context | Medical / Care domain |
| `DORMANT` | Long-duration low-activity mode allowed by the class profile | Life OS projection |
| `DEAD` | Read-only projection of terminal `existence_state=DEAD` | Life OS existence state |

Additional governed projections needed by the Human decision include `OPERATING`, `LEARNING`, and `CHARGING`. They are class-specific aliases or extensions and require versioned vocabulary governance.

`DEAD` is not a performable activity. It cannot earn rewards, pay costs, transition to an active activity, or override the frozen rule that the same individual cannot return from `DEAD` to `ALIVE`.

#### 6. Activity Transition Contract

An Activity Transition must carry:

`transition_id`, `life_id`, `from_activity`, `to_activity`, `activity_variant`, `expected_activity_state_version`, `existence_state_ref`, `life_os_activity_state_ref`, `permission_ref`, `cost_preview`, `risk_preview`, `evidence_refs`, `requested_by`, `requested_at`, and `idempotency_key`.

An accepted result must preserve:

`accepted`, `failure_code`, `previous_activity_state_version`, `new_activity_state_version`, `effective_at`, `activity_before`, `activity_after`, `authority_ref`, `checkpoint_ref`, and `invariant_results`.

All transitions must:

1. verify the current existence and Life OS projection;
2. verify expected version and ordered Universe time;
3. verify Species or class capability;
4. verify health, energy, environment, equipment, location, and care constraints where applicable;
5. verify role, license, consent, technology, Timeline, and governance permission where applicable;
6. reserve bounded cost and risk capacity before activation;
7. append immutable transition evidence;
8. fail closed without changing the prior valid activity when any mandatory check fails.

Direct mutation, backward state version, activity while terminally dead, fabricated evidence, and an activity that bypasses its authoritative domain are forbidden.

#### 7. Activity Permission Contract

Activity Permission is an explicit decision, not an inference from a UI choice. It must evaluate applicable dimensions:

- Species or class capability;
- Body and Life OS viability;
- Mind capability and consent;
- life stage, education, skill, profession, and license;
- location, route, land, building, and access rights;
- equipment, vehicle, resource, energy, and maintenance capacity;
- environment and carrying capacity;
- Timeline and technology gates;
- privacy, guardian, and care constraints;
- risk class, review, and Human authority where required.

Permission is scoped, expiring, revocable, and versioned. Permission for one activity never grants another activity, ownership, legal personhood, protected-path access, or authority to rewrite reality.

#### 8. Activity Reward, Activity Cost, Activity Risk, and Time

Every Activity type must define:

`reward_candidates`, `costs`, `risks`, `time_rule`, `energy_consumption`, `maintenance_rule`, `progress_cap`, `failure_policy`, `evidence_requirements`, and `review_requirements`.

Rules:

- Evidence and accepted progress precede reward.
- Reward is a governed candidate outcome, not a guaranteed payment or item.
- Costs obey energy and resource conservation.
- Offline progress is bounded by checkpoints, permissions, elapsed Universe time, and care capacity.
- Risk cannot silently destroy a protected Life during ordinary absence.
- Money, ownership, materials, production, and Marketplace settlement remain outside Life OS.
- A reward policy cannot modify Runtime CURRENT, a frozen baseline, Human authority, or real-world records.

#### 9. Offline Activity Contract

Life continues to exist while a player is offline. Logout changes interaction mode; it does not delete or suspend Life Identity.

Before logout, the player must either select one permitted offline activity or accept the automatic safe fallback. The selected activity is a request and starts only after permission validation:

`SLEEPING`, `MEDITATING`, `TRAINING`, `TRAVELING`, `RESEARCHING`, or `DORMANT`.

The player may also request or retain a care context:

`GUARDIAN_CARE`, `HOSPITAL_CARE`, or `CIVILIZATION_PROTECTION`.

When no valid choice exists, the world selects the safest permitted fallback:

```text
SLEEPING
or
GUARDIAN_CARE
or
SAFE_HOLD when neither can be verified
```

The fallback must not directly cause hunger death, deletion, Life destruction, relationship reassignment, ownership reassignment, or Timeline displacement. It also must not grant free unlimited resources or progress.

Offline progress requires a pre-authorized activity plan, checkpoint, bounded resource budget, evidence policy, progress cap, and return reconciliation. Unsafe or unsupported activities pause, enter care, or fail closed. On return, ordered events are replayed against the Current Timeline and current reviewed Civilization state.

#### 10. Meditation and Cultivation Activity

##### 10.1 Variants

`MEDITATING` supports approved variants including:

- `DEEP_MEDITATION`;
- `DEEP_MOUNTAIN_CULTIVATION`;
- `CLOSED_DOOR_CULTIVATION`.

##### 10.2 Governed progress

Meditation may accumulate bounded, evidence-backed progress in:

`cultivation_progress`, `mind_stability`, `wisdom`, `insight`, and `spiritual_knowledge`.

It must not directly create Money, production output, materials, ownership, legal authority, or guaranteed rare items.

##### 10.3 Cultivation Profile

Cultivation is not a single Experience number. A versioned profile may define:

`cultivation_level`, `realm`, `wisdom`, `insight`, `spiritual_energy`, `mind_stability`, `heart_nature`, `virtue`, `karma`, `civilization_contribution`, `knowledge`, `experience`, and `skill`.

Different civilizations may display different names while retaining stable semantic identifiers. These measures are independent; one value cannot silently stand in for all others. Progress requires compatibility, energy, time, evidence, review, and risk controls. Cultivation status grants no automatic rights, ownership, rank, Human authority, or exemption from Life integrity rules.

#### 11. Study and Training Activities

`STUDYING` variants may include Reading, Research, Experiment, AI Learning, Martial Arts theory, Civilization Knowledge, and Technology study. Candidate progress includes Knowledge, Research, Skill, and Profession Experience.

`TRAINING` variants may include Martial Arts, Sword practice, mythic-interface Magic training, Body Training, Engineering Practice, Medical Practice, Flying, Driving, and Combat simulation. Candidate progress includes Skill Experience and Mastery.

Study or training that represents a licensed profession, safety-critical activity, medicine, vehicle operation, or combat requires the applicable permission and sandbox boundary. This Architecture does not provide real medical, weapon, vehicle, or hazardous operating instructions.

#### 12. Travel and Exploration Activities

Approved variants may include:

- Travel;
- Pilgrimage;
- World Tour;
- Mountain Exploration;
- Ocean Exploration;
- Planet Exploration;
- Galaxy Exploration.

Candidate outcomes may include Discovery, Knowledge, Reputation, Map Progress, Historical Record, Rare Encounter, and Culture Experience. A rare encounter is never guaranteed.

Travel must validate route, destination, vehicle or movement capability, energy, supplies, environment, jurisdiction, privacy, Timeline, and technology gates. Planet and Galaxy exploration remain unavailable unless their higher-level Architecture gates are satisfied. This contract does not implement a Travel or Timeline engine and cannot mutate Universe Map CURRENT.

Historical and discovery records are append-only observations. They cannot silently rewrite Canon, ownership, historical facts, or prior Timeline state.

#### 13. Sleep, Dream, and Soul Journey

##### 13.1 Sleep

`SLEEPING` is the cross-layer projection of the frozen Life OS sleep sequence. A compatible Species profile may recover Energy, Health, and Mental Stability within resource and health limits.

##### 13.2 Dream Event

Dream is represented as the optional `DREAMING` Mind Runtime sub-activity attached to `current_activity=SLEEPING`. It may open a governed event such as:

- Myth Event;
- Historical Memory;
- Soul Journey;
- Inner Trial.

A Dream Event cannot directly rewrite Reality, the frozen Life OS state machine, another player's state, Canon, ownership, or real-world records.

##### 13.3 Journey of the Soul

`SOUL_JOURNEY` is `MYTHIC_INTERFACE` over a KAIOS Civilization event. Narrative examples such as a dream journey to the underworld or a Book of Life challenge are not real afterlife claims.

Any proposed effect on a Life Contract, lifespan, Soul record, or reincarnation record requires all applicable special capability, world-event authorization, mythic-civilization authority, Timeline condition, evidence, compatibility, review, immutable audit, and Human approval for high risk. The effect is a governed proposal or new version; it cannot change the real death rules for all players or revive the same terminally dead Life ID.

#### 14. Longevity Profiles

Longevity is not absolute invulnerability. The following capability profiles are separate:

| Profile | Architecture meaning |
|---|---|
| `NORMAL_LIFE` | Species-standard lifecycle. |
| `LONG_LIFE` | Extended expected duration within a reviewed profile. |
| `LONGEVITY` | Advanced maintenance and aging resistance with continuing costs and risks. |
| `IMMORTAL_BODY` | Restricted future or mythic body-maintenance profile; not proof of invulnerability. |
| `IMMORTAL_SOUL` | Restricted continuity profile; it does not make the same dead body alive. |
| `TRUE_IMMORTALITY` | Reserved long-term narrative state, unavailable by default and never guaranteed. |
| `REALITY_REWRITE` | Restricted mythic or future event authority, not an ordinary player capability and never a real-world effect. |

`TRUE_IMMORTALITY` and `REALITY_REWRITE` are disabled for ordinary player defaults. No longevity profile may bypass evidence, energy, maintenance, versioning, Human Final Authority, or `DEAD` terminality for the same individual.

#### 15. AI and Non-Human Life Activities

All Life classes expose a Current Activity appropriate to their profile. Examples include:

| Life class | Example activity projection | Authoritative domain |
|---|---|---|
| AI Engineer | `LEARNING`, `STUDYING`, or `WORKING` | AI / Citizen / Company |
| NPC | Species- and role-compatible activity | Citizen / Ecology |
| Temple | `GUARDING`, `OPERATING`, or `DORMANT` | Temple domain |
| Company | `OPERATING`, `RESTING`, or `RECOVERING` | Company domain |
| Robot | `WORKING`, `TRAVELING`, `CHARGING`, or `DORMANT` | Robot / Company domain |
| Plant | `ACTIVE`, `RESTING`, or `DORMANT` according to its profile | Life / Ecology projection |
| Land or passive entity | `ACTIVE` or `DORMANT` projection with bounded passive compute | Land domain projection |

The projection does not force human cognition, emotion, work, travel, or cultivation onto a class that lacks those capabilities.

#### 16. Continuous World Principle

The KAIOS world operates continuously, twenty-four hours per world day, in ordered Universe time. Players are Life participants within that world, not the world's on/off switch. Life may work, rest, travel, cultivate, research, explore, and grow only through class-compatible, resource-bounded, permission-governed activities.

Continuous existence does not require continuous high compute. Simulation LOD, dormancy, aggregation, and checkpoints may reduce computation without deleting identity, skipping immutable events, or fabricating progress.

#### 17. Review Gates

| Gate | Result | Basis |
|---|---|---|
| Activity Contract | `PASS` | Current Activity, transitions, permissions, reward, cost, risk, time, energy, and maintenance are defined. |
| Offline Contract | `PASS` | Life persists offline with selected or safe fallback activity, bounded progress, and no ordinary-absence direct death. |
| Cultivation Contract | `PASS` | Multi-dimensional cultivation profile, evidence, conservation, and no direct Money/material production are defined. |
| Travel Contract | `PASS` | Variants, candidate outcomes, permission gates, no guaranteed rarity, and no engine implementation are defined. |
| Dream Contract | `PASS` | Dream is a Mind sub-activity during sleep; mythic events cannot directly rewrite Reality or universal death rules. |

#### 18. Boundary Attestation

```text
Runtime created: false
WorkQueue created: false
Database created: false
API created: false
UI created: false
Game logic created: false
NPC AI created: false
Cultivation system created: false
Timeline engine created: false
Implementation started: false
Deployment started: false
Runtime CURRENT modified: false
Universe Map CURRENT modified: false
Token Contract modified: false
Frozen baseline modified: false
Human Main modified: false
```

## Part III - Human-Selected P1 Integration
### KAIOS World Life Law V2.1 P1 Amendment Integration Candidate

Status: `HUMAN_SELECTIONS_APPROVED / CANDIDATE_NOT_BASELINE`

Artifact ID: `WORLD-LIFE-LAW-V2.1-P1-INTEGRATION-CANDIDATE-001`

Runtime Authority: `false`

Freeze: `NOT_APPROVED`

Implementation: `NOT_AUTHORIZED`

#### 1. Authority And Scope

This candidate integrates the Human-selected directions for `FZ-P1-001` through `FZ-P1-005`. It may be used in a repeat baseline review, but it is not the cumulative World Life Law, a frozen baseline, Runtime authority, implementation approval, Production activation or a replacement for PR `#36`.

The Human selections are:

| P1 ID | Selection | Candidate state |
|---|---|---|
| `FZ-P1-001` | A | Integrated below |
| `FZ-P1-002` | B | Integrated below |
| `FZ-P1-003` | A | Integrated below |
| `FZ-P1-004` | A | Integrated below |
| `FZ-P1-005` | A | Integrated below |

#### 2. Death Body And Asset Disposition

Every governed death transition must preserve separate references for Life continuity, embodiment evidence and external asset succession.

Minimum contract:

| Field | Requirement |
|---|---|
| `life_id` | Identifies the deceased Life record; never reused for a reincarnated Life. |
| `body_record_id` | Required sealed identity for the body or applicable embodiment record. |
| `body_disposition_status` | Governed, versioned status such as `PENDING`, `PRESERVED`, `TRANSFERRED_TO_AUTHORIZED_CARE`, `RETURNED_TO_ENVIRONMENT`, or an approved species/civilization extension. |
| `asset_succession_ref` | External reference to the authoritative property, inheritance, estate or liquidation contract. It is not an asset ledger inside Life OS. |
| `sealed_at` | Evidence timestamp for sealing the death/body record. |
| `evidence_refs` | Integrity-bearing evidence references; no secret or private credential content. |

Rules:

1. `body_record_id` is sealed after the authorized death and disposition workflow reaches its evidence boundary.
2. Body disposition authority remains with the applicable Body, Species, Civilization, legal or care domain.
3. Asset ownership and succession remain with their authoritative property domain.
4. Life OS does not acquire ownership of a body, property, wallet, company asset or inheritance.
5. Memory, history, Soul and lineage preservation cannot be used to bypass body or asset authority.

#### 3. Reincarnation Birth And Embodiment Binding

Every reincarnation must create a distinct governed identity chain:

```text
sealed predecessor Life
-> new Life ID
-> new birth event
-> new embodiment_id
-> species/class binding
```

Minimum contract:

| Field | Requirement |
|---|---|
| `predecessor_life_id` | References the sealed predecessor; never reactivates it. |
| `new_life_id` | Required unique Life ID. |
| `birth_event_id` | Required new event with provenance, authority and timeline. |
| `embodiment_id` | Required new embodiment identity. |
| `biological_body_id` | Required for biological Life and must reference a new body. |
| `non_biological_vessel_or_instance_id` | Required for applicable non-biological Life and must reference a new vessel or instance. |
| `species_or_class_profile_ref` | Determines the applicable body/vessel, energy, maintenance and lifecycle rules. |

Rules:

1. The predecessor remains sealed.
2. `DEAD` remains terminal for the predecessor Individual Life OS.
3. Reincarnation cannot change the predecessor from `DEAD` to `ALIVE`.
4. Biological Life binds the new embodiment to a new body.
5. Non-biological Life binds the new embodiment to a new approved vessel or instance.
6. Dream, Soul Journey, memory preservation and Timeline events cannot substitute for the new Life, birth and embodiment gates.

#### 4. Versioned Company Facet Registry

Company Life identity is separate from legal, economic, employment, production, consumption and ownership authority.

The candidate registry defines these core facet IDs:

| Facet ID | Required authoritative domain reference |
|---|---|
| `ECONOMIC_ENTITY` | Legal/economic entity contract |
| `EMPLOYER` | Employment and labor contract |
| `PRODUCER` | Production, safety and provenance contract |
| `CONSUMER` | Procurement, consumption and liability contract |
| `ASSET_OWNER` | Property, treasury or asset registry contract |

Each facet record must contain `facet_id`, `registry_version`, `company_life_id`, `status`, `authority_domain_ref`, `effective_at`, `expires_at_if_any`, `evidence_refs` and `integrity_hash`.

Rules:

1. A Company may expose only facets activated by an authoritative domain contract.
2. Company Life identity does not automatically grant legal personality, employment power, production permission, purchasing power or asset ownership.
3. Facets can be suspended or terminated independently during reorganization, bankruptcy, liquidation or Company death.
4. Private, Company, Temple, project and salary assets remain separated under their own authority contracts.

#### 5. Versioned Profession Registry

The profession model uses stable core IDs plus governed Civilization-specific extensions.

Minimum profession record:

| Field | Requirement |
|---|---|
| `profession_id` | Stable core or namespaced extension ID. |
| `registry_version` | Required semantic registry version. |
| `display_name_key` | Localizable display reference, not the identity. |
| `civilization_scope` | Core scope or the approving Civilization. |
| `skill_requirements` | Versioned references to applicable skill contracts. |
| `authority_requirements` | Separate permission references when the work requires authority. |
| `status` | `ACTIVE`, `DEPRECATED`, `SUSPENDED`, or approved extension status. |

The core registry must be able to represent Farmer, Doctor, Teacher, Engineer, Trader, Researcher, Police, Firefighter, Pilot, Astronaut, Temple Keeper, Government Worker, Factory Worker, Feed Producer, AI Engineer and Entrepreneur without granting authority through the label.

Rules:

1. Civilization extensions require a namespace, version, approving authority, evidence and collision check.
2. A profession ID describes work; it does not automatically grant permission, office, guardianship, wallet access, police power, Temple authority or Company authority.
3. Unknown or deprecated IDs fail safely according to the consuming domain contract.

#### 6. Versioned Normative Source-Classification Contract

The integration candidate establishes this required normative reference shape:

| Field | Candidate value |
|---|---|
| `artifact_id` | `WORLD-LIFE-LAW-V2.1-SOURCE-CLASSIFICATION-001` |
| `version` | `1.0.0-candidate` |
| `source_candidate_path` | `KGEN-KAIOS/life/World_Life_Law_V2_1_Source_Classification.md` |
| `source_candidate_commit` | `6b6672bf91c4de232dcc3452a7e6ce6a2eb66b1d` |
| `source_candidate_sha256` | `25f0ed2698c40dc419def28ac7f1749f37e8683a7aa90f43711572d7180f1e38` |
| `hash_basis` | Raw Git blob bytes, UTF-8 |
| `authority_state` | `CANDIDATE_NOT_NORMATIVE_UNTIL_BASELINE_REVIEW_AND_HUMAN_APPROVAL` |

Every governed claim must use one or more explicit source classes:

- `MODERN_SCIENCE`: supported present-day scientific or engineering knowledge with attributable evidence.
- `KAIOS_WORLD_SETTING`: simulation ontology or world rule; not a claim about physical reality.
- `MYTHIC_INTERFACE`: symbolic, narrative, spiritual or cultural interface; not direct proof of Reality rewrite.
- `FUTURE_TECHNOLOGY`: speculative or unavailable technology; not represented as currently feasible or Production-ready.

Rules:

1. The cumulative law must reference the approved artifact ID, final version and final integrity hash before Freeze.
2. The candidate hash above proves the reviewed PR `#36` source candidate only. Integration must recompute and pin the final approved artifact hash.
3. Mixed claims must identify each applicable class and may not present mythic or speculative content as modern science.
4. Dream remains an optional Mind Runtime sub-activity under sleep and cannot directly rewrite Reality.
5. Soul Journey remains a mythic-interface event unless separately authorized by a governed Civilization, Timeline and Life contract.
6. Longevity categories must distinguish current evidence, KAIOS setting rules and future technology. True Immortality and Reality Rewrite remain unavailable as ordinary default capabilities.

#### 7. Compatibility And Freeze Gates

This candidate preserves all of the following:

- Food Lifecycle and Species Energy contracts from Amendment 001.
- Guardian separation, NPC Compute Levels and Offline Protection from Amendment 001.
- Life Activity, Dream, Soul Journey and Longevity boundaries from Amendment 002.
- `DEAD` is terminal for the same predecessor Individual Life OS.
- Dream is a Mind Runtime sub-activity; it is not a direct Reality mutation channel.
- Frozen Life OS files and hashes remain unchanged.
- Runtime CURRENT, Universe Map CURRENT, Genesis, Universe Law and Token remain unchanged.
- Runtime authority remains `false`.
- Freeze remains `NOT_APPROVED`.

Before Freeze, all of these gates remain mandatory:

1. Review this integration candidate against Amendment 001, Amendment 002 and current main.
2. Produce the cumulative amendment source and final source-classification artifact without modifying Frozen Life OS.
3. Recompute final artifact hashes and update machine-readable review evidence.
4. Repeat the 23-law, pairwise, JSON, JSONL, link, UTF-8, secret and protected-boundary review.
5. Obtain a separate explicit Human Freeze Decision.

#### 8. Boundary Attestation

| Boundary | Result |
|---|---|
| Formal World Life Law modified | `false` |
| Frozen Life OS modified | `false` |
| Runtime CURRENT modified | `false` |
| Universe Map CURRENT modified | `false` |
| Genesis modified | `false` |
| Token modified | `false` |
| Runtime authority | `false` |
| Production enabled | `false` |
| Real KGEN enabled | `false` |
| Freeze | `NOT_APPROVED` |

## Cumulative Candidate Attestation

- P0 remaining: `0`
- P1 candidate definitions remaining: `0`
- Human selections recorded: `5 / 5`
- `DEAD` remains terminal for the predecessor Individual Life OS.
- Dream remains a Mind Runtime sub-activity and cannot directly rewrite Reality.
- The predecessor remains sealed during reincarnation.
- Life OS owns neither body nor assets.
- Profession IDs and Company facets grant no authority by identity alone.
- Reincarnation requires a new Life ID, birth event and embodiment.
- Source classification requires artifact ID, version and integrity hash.
- Runtime authority: `false`
- Freeze: `NOT_APPROVED`