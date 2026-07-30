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

# KAIOS World Life Law V2.1 Life Activity Contract

## 1. Authority and Scope

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

## 2. Source Audit and Frozen Boundary

The frozen `LIFE-OS-V1.0` Architecture already defines an orthogonal physiological `activity_state` with `AWAKE`, `RESTING`, `SLEEP_REQUESTED`, `ASLEEP`, `WAKING`, `DORMANT`, and `NOT_APPLICABLE`. It also establishes:

- Activity State is meaningful only while the individual is `ALIVE` or recoverably `DYING`.
- `DEAD` is terminal for the same individual.
- Dream is optional Mind Runtime behavior during sleep, not a Life OS physiological state.
- Life OS cannot issue missions, rewards, payments, ownership changes, Company work, or Timeline travel.

This amendment does not replace those rules. It defines a cross-layer activity projection that composes authoritative states from Life OS, Mind, Citizen, Company, Civilization, Travel, and other approved domains.

## 3. Activity Layer Model

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

## 4. Life Activity Record

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

## 5. Canonical Activity Vocabulary

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

## 6. Activity Transition Contract

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

## 7. Activity Permission Contract

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

## 8. Activity Reward, Activity Cost, Activity Risk, and Time

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

## 9. Offline Activity Contract

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

## 10. Meditation and Cultivation Activity

### 10.1 Variants

`MEDITATING` supports approved variants including:

- `DEEP_MEDITATION`;
- `DEEP_MOUNTAIN_CULTIVATION`;
- `CLOSED_DOOR_CULTIVATION`.

### 10.2 Governed progress

Meditation may accumulate bounded, evidence-backed progress in:

`cultivation_progress`, `mind_stability`, `wisdom`, `insight`, and `spiritual_knowledge`.

It must not directly create Money, production output, materials, ownership, legal authority, or guaranteed rare items.

### 10.3 Cultivation Profile

Cultivation is not a single Experience number. A versioned profile may define:

`cultivation_level`, `realm`, `wisdom`, `insight`, `spiritual_energy`, `mind_stability`, `heart_nature`, `virtue`, `karma`, `civilization_contribution`, `knowledge`, `experience`, and `skill`.

Different civilizations may display different names while retaining stable semantic identifiers. These measures are independent; one value cannot silently stand in for all others. Progress requires compatibility, energy, time, evidence, review, and risk controls. Cultivation status grants no automatic rights, ownership, rank, Human authority, or exemption from Life integrity rules.

## 11. Study and Training Activities

`STUDYING` variants may include Reading, Research, Experiment, AI Learning, Martial Arts theory, Civilization Knowledge, and Technology study. Candidate progress includes Knowledge, Research, Skill, and Profession Experience.

`TRAINING` variants may include Martial Arts, Sword practice, mythic-interface Magic training, Body Training, Engineering Practice, Medical Practice, Flying, Driving, and Combat simulation. Candidate progress includes Skill Experience and Mastery.

Study or training that represents a licensed profession, safety-critical activity, medicine, vehicle operation, or combat requires the applicable permission and sandbox boundary. This Architecture does not provide real medical, weapon, vehicle, or hazardous operating instructions.

## 12. Travel and Exploration Activities

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

## 13. Sleep, Dream, and Soul Journey

### 13.1 Sleep

`SLEEPING` is the cross-layer projection of the frozen Life OS sleep sequence. A compatible Species profile may recover Energy, Health, and Mental Stability within resource and health limits.

### 13.2 Dream Event

Dream is represented as the optional `DREAMING` Mind Runtime sub-activity attached to `current_activity=SLEEPING`. It may open a governed event such as:

- Myth Event;
- Historical Memory;
- Soul Journey;
- Inner Trial.

A Dream Event cannot directly rewrite Reality, the frozen Life OS state machine, another player's state, Canon, ownership, or real-world records.

### 13.3 Journey of the Soul

`SOUL_JOURNEY` is `MYTHIC_INTERFACE` over a KAIOS Civilization event. Narrative examples such as a dream journey to the underworld or a Book of Life challenge are not real afterlife claims.

Any proposed effect on a Life Contract, lifespan, Soul record, or reincarnation record requires all applicable special capability, world-event authorization, mythic-civilization authority, Timeline condition, evidence, compatibility, review, immutable audit, and Human approval for high risk. The effect is a governed proposal or new version; it cannot change the real death rules for all players or revive the same terminally dead Life ID.

## 14. Longevity Profiles

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

## 15. AI and Non-Human Life Activities

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

## 16. Continuous World Principle

The KAIOS world operates continuously, twenty-four hours per world day, in ordered Universe time. Players are Life participants within that world, not the world's on/off switch. Life may work, rest, travel, cultivate, research, explore, and grow only through class-compatible, resource-bounded, permission-governed activities.

Continuous existence does not require continuous high compute. Simulation LOD, dormancy, aggregation, and checkpoints may reduce computation without deleting identity, skipping immutable events, or fabricating progress.

## 17. Review Gates

| Gate | Result | Basis |
|---|---|---|
| Activity Contract | `PASS` | Current Activity, transitions, permissions, reward, cost, risk, time, energy, and maintenance are defined. |
| Offline Contract | `PASS` | Life persists offline with selected or safe fallback activity, bounded progress, and no ordinary-absence direct death. |
| Cultivation Contract | `PASS` | Multi-dimensional cultivation profile, evidence, conservation, and no direct Money/material production are defined. |
| Travel Contract | `PASS` | Variants, candidate outcomes, permission gates, no guaranteed rarity, and no engine implementation are defined. |
| Dream Contract | `PASS` | Dream is a Mind sub-activity during sleep; mythic events cannot directly rewrite Reality or universal death rules. |

## 18. Boundary Attestation

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
