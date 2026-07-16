---
TITLE: "KAIOS Species OS Architecture Standard"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_HUMAN_REVIEW"
ARCHITECTURE: "ONLY"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-KAIOS-BOOT-RUNTIME-001"
HUMAN_DECISION_ID: "HUMAN-KAIOS-BOOT-RUNTIME-001"
CHANGE_REASON: "Replace an undifferentiated common Life OS assumption with Species OS profiles and bound Individual Life OS instances."
ANCESTOR: "HUMAN-LIFE-OS-ARCHITECTURE-001 unapproved candidate"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationLifeform
PHYLUM: RuntimeArchitecture
CLASS: SpeciesOperatingProfile
ORDER: IndividualLifeBinding
FAMILY: KAIOS
GENUS: SpeciesOS
SPECIES: KAIOSSpeciesOSArchitectureStandard
CANONICAL_FILE: "KGEN-KAIOS/boot-runtime/SPECIES_OS_STANDARD.md"
---

# Species OS Standard

## 1. Architecture Decision

KAIOS does not run every life through one undifferentiated Life OS. It defines a common governed interface and distinct Species OS profiles:

```text
KAIOS
-> Species OS
-> Individual Life OS
```

Species OS defines what a Species may do and which rules govern it. Individual Life OS binds one unique life to one approved Species profile and stores only that individual's versioned life-maintenance state.

## 2. Separation

| Layer | Owns | Must not own |
|---|---|---|
| KAIOS governance | Interface, registry, review and compatibility rules | Individual life state |
| Species OS | Capability applicability, life rules, body/mind compatibility | Player ownership, private memory, salary or land |
| Individual Life OS | One life ID, current state, resources, health and profile binding | Species-wide rule mutation |
| Mind Runtime | Memory, learning, reasoning, emotion/profile behavior | Direct life-state mutation |
| Player/Citizen Runtime | Identity relations, permissions, property and civilization participation | Species physiology rules |

## 3. Species OS Manifest

```text
SpeciesOSManifest {
  species_os_id
  species_code
  species_name
  species_os_version
  schema_version
  body_profile_ref
  life_capabilities
  mind_capabilities
  growth_rules
  death_rules
  repair_rules
  reproduction_rules
  nutrition_rules
  environment_tolerance_rules
  resource_unit_profile
  required_organs_or_modules
  optional_organs_or_modules
  prohibited_modules
  compatible_mind_profiles
  compatible_citizen_profiles
  compatibility_range
  migration_policy
  integrity_policy
  content_hash
  status
  reviewed_by
  approval_ref
}
```

`status` values:

```text
DRAFT
SANDBOX
UNDER_REVIEW
APPROVED
DEPRECATED
SUSPENDED
ARCHIVED
```

Only `APPROVED` profiles may pass Boot for an active world character.

## 4. Individual Life OS Binding

```text
IndividualLifeOS {
  life_id
  individual_id
  species_os_id
  species_os_version
  body_id
  body_revision
  mind_runtime_ref
  memory_snapshot_ref
  current_life_state
  life_state_version
  resource_state_ref
  health_state_ref
  permission_profile_ref
  module_manifest_ref
  integrity_manifest_ref
  created_at
  last_checkpoint_at
  status
}
```

Changing the Species profile never mutates an Individual silently. It requires compatibility analysis, migration evidence, a new state revision and review.

## 5. Required Rule Groups

Every Species OS defines all seven groups. A capability may be `REQUIRED`, `OPTIONAL` or `NOT_APPLICABLE`, but may not be omitted.

### 5.1 Life Capabilities

Heartbeat/health signal, energy/resource consumption, maintenance, repair, sleep/wake, aging, death and lifecycle transition.

### 5.2 Mind Capabilities

Allowed Mind Runtime families, sensory channels, decision autonomy, emotion applicability, memory class and behavior limits. Species OS declares compatibility; it does not store private memories or thoughts.

### 5.3 Growth Rules

Stages, prerequisites, resource costs, structural limits, reversible/irreversible transitions and growth evidence.

### 5.4 Death Rules

Terminal conditions, deactivation, evidence sealing, archive behavior and any separately governed revival eligibility. Death never erases lineage or prior state.

### 5.5 Repair Rules

Repairable parts, required resources, safe bounds, maintenance authority, test evidence and conditions requiring replacement or Human review.

### 5.6 Reproduction Rules

Biological reproduction, digital capability recombination, manufacturing or `NOT_APPLICABLE`. Reproduction never copies secrets, private memories, ownership or permissions automatically.

### 5.7 Nutrition Rules

Accepted inputs, resource units, conversion, storage, waste, deficiency and toxicity/overload bounds. Financial balance and KGEN value are not nutrition units.

## 6. Initial Species Profiles

| Species OS | Body | Life model | Mind model | Reproduction model |
|---|---|---|---|---|
| `HUMAN_OS` | Human biological body | Biological maintenance | Human Mind profile | Biological, governed and privacy-sensitive |
| `PLANT_OS` | Plant structure | Water, light, nutrients, growth, dormancy | Plant behavior; Human Mind not assumed | Seed/propagation profile |
| `ANIMAL_OS` | Species animal body | Biological maintenance | Species behavior/Mind profile | Species biological profile |
| `ROBOT_OS` | Hardware body | Power, cooling, diagnostics, repair, wear | AI Mind optional | Manufacturing or reviewed module composition |
| `PLAYER_OWNED_AI_OS` | Digital or robotic body required | Compute/storage/energy viability | Provider-neutral AI Mind | Capability recombination or manufacturing |
| `NPC_OS` | Declared biological, digital or robotic body | Inherits a reviewed underlying Species profile | NPC behavior/Mind limits | Underlying profile or not applicable |

`NPC_OS` is a role overlay and may not erase the underlying Species identity. A Human NPC remains bound to a Human-compatible life profile; a Robot NPC remains bound to Robot OS.

## 7. Species-Specific Examples

### Human OS

- Nutrition uses biological food/water profiles.
- Repair includes healing within simulation boundaries.
- Mind capability allows Human Mind Runtime.
- Health, genome, pain and reproduction data default to restricted privacy.

### Plant OS

- Life capabilities include photosynthetic energy profile, water, nutrients, growth, repair and dormancy.
- Mind capabilities may be `PLANT_BEHAVIOR`; Human emotion is not implied.
- Movement, Citizen and employment capabilities are not inferred.

### Robot OS

- Heartbeat maps to watchdog viability.
- Circulation may map to power/coolant/data paths.
- Nutrition maps to approved energy and maintenance materials.
- Repair requires module compatibility and post-repair integrity verification.

### Player-Owned AI OS

- Provider calls are Mind implementation details, not Species identity.
- A bounded digital or robotic Body is required before activation as life.
- Tool access and player ownership remain permission relations outside life state.
- Model replacement requires compatibility and memory migration review.

## 8. Compatibility

Boot verifies:

1. Species profile is approved and not suspended.
2. Individual references the exact profile version or an approved compatible range.
3. Body profile and required organs/modules match.
4. Mind profile is permitted.
5. Individual capabilities do not exceed Species capabilities.
6. State schema and resource units are compatible.
7. Migration history is complete when versions differ.
8. Content hashes match the approved manifest.

Failure returns `SPECIES_OS_VERIFY_FAILED`; Boot does not downgrade or substitute a profile.

## 9. Evolution And Versioning

Species evolution flow:

```text
Proposal
-> Compatibility Review
-> Sandbox Species Revision
-> Integrity Tests
-> Independent Review
-> Human Approval
-> Species Registry Revision
-> Individual Migration Proposal
```

Existing Individuals retain their original profile until explicitly migrated. Historical profiles and evidence remain readable.

## 10. Security Boundary

Species OS manifests contain no secrets, private memories, private keys, raw KYC or player credentials. Capability declarations cannot grant Player, Land, Marketplace, wallet or governance rights.

## 11. Architecture Boundary

No Species registry, profile loader, migration executor, Body implementation, Mind Runtime or Individual Life OS is implemented by this standard.

