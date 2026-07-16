---
TITLE: "Genesis Capability Atom Standard"
VERSION: "0.1.0"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
TASK_ID: "HUMAN-GENESIS-DNA-EVOLUTION-001"
CLASSIFICATION: "PUBLIC_ARCHITECTURE"
---

# Genesis Capability Atom Standard

## 1. Definition

`GA` means **Genesis Capability Atom**. An atom is one bounded, versioned and verifiable capability, metric, organ function, behavior or civilization ability. It is not a chemical atom, level number, moral score, social caste, title of ownership or guaranteed strength.

Each life may have `0..108` active atoms. A life with fewer atoms can outperform a larger profile in its specialized environment. Quality, compatibility, evidence freshness, energy budget and task fit matter independently.

## 2. Twelve Domains

| Domain | Range | Theme |
|---|---|---|
| A | GA001-GA009 | Life Support |
| B | GA010-GA018 | Perception and Action |
| C | GA019-GA027 | Learning and Memory |
| D | GA028-GA036 | Reasoning and Decision |
| E | GA037-GA045 | Production and Resources |
| F | GA046-GA054 | Social and Communication |
| G | GA055-GA063 | Family and Reproduction |
| H | GA064-GA072 | Engineering and Building |
| I | GA073-GA081 | Market and Finance |
| J | GA082-GA090 | Governance and Diplomacy |
| K | GA091-GA099 | Universe and Space |
| L | GA100-GA108 | Genesis Integration |

## 3. Required Atom Fields

Every catalog object contains: `ga_id`, `domain_id`, `name`, `purpose`, `capability_type`, `required_species`, `required_body`, `required_life_os`, `required_mind_runtime`, `dependencies`, `incompatible_atoms`, `unlock_conditions`, `training_requirements`, `evidence_requirements`, `test_requirements`, `risk_class`, `energy_cost`, `maintenance_cost`, `mutation_rules`, `inheritance_rules`, `license_class`, `visibility_class`, `version`, and `status`.

Detailed thresholds may remain INTERNAL. The public catalog exposes no proprietary formula, weight, private data or bypass condition.

## 4. States

```text
PROPOSED -> TRAINING -> EVIDENCE_PENDING -> SANDBOX_TEST
-> REVIEW -> ACTIVE
ACTIVE -> MAINTENANCE_DUE | SUSPENDED | RETIRED
REJECTED -> ARCHIVED
```

Atom Count includes only `ACTIVE` atoms. Suspended, expired, incompatible or unmaintained atoms remain in history but do not count.

## 5. Unlock Contract

```text
Training threshold
-> Evidence
-> Anti-cheat
-> Dependency closure
-> Species/body/Life OS/Mind compatibility
-> Sandbox test
-> Balance test
-> Quality review
-> Activation decision
```

Payment may purchase sandbox resources, compute, tests, review acceleration, facilities or storage. It cannot purchase evidence, a fake atom, a role state, a grade or a gate bypass.

## 6. Dependency and Incompatibility

Dependencies are explicit atom IDs or governed profile predicates. Incompatibility is contextual: two atoms are not globally declared incompatible unless there is evidence. Species profiles may add constraints through a versioned `CompatibilityReport` without editing the public atom definition.

## 7. Maintenance

Capabilities with safety, finance, governance, space or high resource impact require evidence freshness, periodic testing and risk review. A failed maintenance gate suspends capability use but does not delete history or identity.

## 8. Role-State Recognition

`GA36`, `GA72`, `GA107` and `GA108` in role narratives mean active atom counts under a named reference profile. They are not aliases for catalog item GA036, GA072, GA107 or GA108. Machine-readable records must use both `active_atom_count` and `profile_id` to avoid ambiguity.
