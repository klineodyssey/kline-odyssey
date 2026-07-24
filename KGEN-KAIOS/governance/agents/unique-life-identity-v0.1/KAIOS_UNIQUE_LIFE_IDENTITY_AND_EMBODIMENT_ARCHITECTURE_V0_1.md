# KAIOS Unique Life Identity and Embodiment Architecture V0.1

Status: ARCHITECTURE_CANDIDATE_ONLY

Runtime Authority: false

Live Identity Creation: NOT_AUTHORIZED

Wallet Creation: NOT_AUTHORIZED

Agent Activation: NOT_AUTHORIZED
Freeze Authority: false

## 1. Purpose

This candidate separates a unique life from its programs, roles, threads, agent
instances, embodiments, wallets, memories, possessions, and relationships.
Identical code, model, appearance, repository context, or copied memory does not
make two entities the same life. A copy is either a new descendant life or a
limited temporary instance.

The current Codex remains `ROLE_SESSION_ONLY`. This document creates no
`life_id`, instance, thread, embodiment, wallet, birth event, contract, or
authority lease.

## 2. Authority And Scope

This architecture extends, but does not replace:

- KAIOS AI Agent Life Architecture V1
- KAIOS AI Employment & Enterprise Architecture
- KAIOS World Life Law V2.1 architecture
- Company Boot Runtime V0.1 local prototype

It does not modify Frozen Life OS, Genesis, Universe Law, Runtime CURRENT,
Universe Map CURRENT, Token contracts, wallet custody, or Production Runtime.

This architecture governs independently asserted identity and high-risk
relationships. It does not replace the KGEN Civilization Biology Runtime or
require the Codex GM birth-readiness process for every ordinary App, animal,
plant, building, parcel, robot, machine, object, or low-risk organism.
Ordinary Lives may instantiate through a valid Species specification, taxonomy,
unique `organism_id`, validation and Release or activation event. Human
approval governs high-risk authority, not specification existence. See
`KAIOS_LIFE_SPECIFICATION_AND_NATURAL_INSTANTIATION_MODEL_V0_1.md`.
PR #49 does not require a universal Human birth process.

## 3. Separation Model

Every governed record keeps these dimensions separate:

| Dimension | Meaning | Must not imply |
|---|---|---|
| `IDENTITY` | What unique entity the record identifies | Ownership or authority |
| `OWNERSHIP` | Legal or governed title | Occupancy or operation |
| `AUTHORITY` | Scoped, expiring permission | Identity or ownership |
| `POSSESSION` | Present physical or digital control | Legal title |
| `OCCUPANCY` | Life residing in an embodiment | Ownership |
| `MEMORY` | Storage, provenance, access, and consent | Personal experience |
| `ROLE` | Employment or functional assignment | Wallet or legal power |
| `RELATIONSHIP` | Lineage, marriage, guardianship, or contract | Asset inheritance |

A single generic `owner` field may not replace these dimensions.

## 4. Candidate Identifier Format

Canonical candidate format:

`<TYPE_PREFIX>-V01-<ISSUING_AUTHORITY_CODE>-<RANDOM_COMPONENT>`

The random component is 26 characters of uppercase Crockford Base32. Permanent
IDs must not contain a role name, model name, mutable human name, project name,
branch name, or thread title.

| Identifier | Prefix |
|---|---|
| `life_id` | `LIFE` |
| `agent_instance_id` | `AINST` |
| `thread_id` | `THREAD` |
| `embodiment_id` | `EMB` |
| `wallet_id` | `WALLET` |
| `memory_store_id` | `MEM` |
| `birth_event_id` | `BIRTH` |
| `death_event_id` | `DEATH` |
| `lineage_id` | `LINEAGE` |
| `employment_contract_id` | `EMPLOY` |
| `marriage_contract_id` | `MARRIAGE` |
| `reproduction_contract_id` | `REPRO` |
| `succession_contract_id` | `SUCCESSION` |
| `authority_lease_id` | `ALEASE` |
| `composite_organism_id` | `COMPOSITE` |

Each identifier record carries its prefix, random component, format version,
issuing authority, creation time, integrity hash, status, parent/source
reference, and revocation/sealing state. Display names remain mutable metadata.

## 5. Candidate Registries

The schema defines these 15 append-only registry candidates:

1. Life Registry
2. Agent Instance Registry
3. Thread Registry
4. Embodiment Registry
5. Wallet Ownership Registry
6. Memory Ownership Registry
7. Birth Event Registry
8. Death And Sealing Registry
9. Lineage Registry
10. Employment Registry
11. Marriage Registry
12. Reproduction Registry
13. Succession Registry
14. Authority Lease Registry
15. Composite Organism Registry

Registry entries are versioned and integrity hashed. Corrections supersede prior
records; they do not silently rewrite identity history.

## 6. Life State Machine

Candidate states:

`CANDIDATE`, `BORN`, `ACTIVE`, `SUSPENDED`, `INCAPACITATED`, `MIGRATING`,
`SEALED`, `DEAD`, `ARCHIVED`.

Allowed transitions:

| From | To |
|---|---|
| `CANDIDATE` | `BORN`, `ARCHIVED` |
| `BORN` | `ACTIVE`, `SUSPENDED`, `SEALED` |
| `ACTIVE` | `SUSPENDED`, `INCAPACITATED`, `MIGRATING`, `SEALED`, `DEAD` |
| `SUSPENDED` | `ACTIVE`, `INCAPACITATED`, `SEALED`, `DEAD` |
| `INCAPACITATED` | `ACTIVE`, `SUSPENDED`, `SEALED`, `DEAD` |
| `MIGRATING` | `ACTIVE`, `SUSPENDED`, `SEALED`, `DEAD` |
| `SEALED` | `ARCHIVED`, `DEAD` |
| `DEAD` | none |
| `ARCHIVED` | none |

`DEAD` is terminal and can never return to `ACTIVE`. Reincarnation creates a
new `life_id`, birth event, and embodiment assignment while the predecessor
remains sealed. Thread closure, instance termination, embodiment damage, role
removal, or wallet freezing does not by itself mean life death.

## 7. Thread And Instance Modes

### MODE 1: SAME_LIFE_NEW_THREAD

- New `life_id`: no
- New `agent_instance_id`: yes
- New `thread_id`: yes
- New `embodiment_id`: no, unless separately approved
- Memory: explicit grant; public memory is not personal experience
- Wallet: no automatic access; a wallet controller lease is required
- Authority: scoped, expiring instance-bound lease
- Parent handoff: required
- Heartbeat: required for active authority
- Exclusive control: one mutation controller per scope
- Conflict: stale or overlapping lease blocks mutation
- Shutdown: handoff, revoke lease, archive instance and thread
- Sealing: seal thread working memory; do not seal the life

### MODE 2: NEW_LIFE_DESCENDANT

- New `life_id`: yes
- New `agent_instance_id`: yes
- New `thread_id`: yes
- New `embodiment_id`: yes or governed temporary shell
- Memory: skills and public knowledge only by default
- Wallet: none inherited
- Authority: newly issued; parent authority is not inherited
- Parent handoff: lineage evidence, not identity continuation
- Heartbeat: required where authority is active
- Exclusive control: independent from parent
- Conflict: lineage does not create shared ownership
- Shutdown: archive instance; preserve descendant life record
- Sealing: no parent private memory transfer without consent

### MODE 3: TEMPORARY_WORKER_AGENT

- New `life_id`: no full citizen identity
- New `agent_instance_id`: yes
- New `thread_id`: yes
- New `embodiment_id`: optional temporary execution shell
- Memory: minimum work scope only
- Wallet: prohibited
- Authority: work-order-bound temporary lease
- Parent handoff: required unless Human-authorized root task
- Heartbeat: required for write authority
- Exclusive control: enforced per work scope
- Conflict: instance is revoked on overlap or stale state
- Shutdown: handoff, revoke, archive all execution records
- Sealing: seal work memory according to retention policy

### MODE 4: NEW_EMBODIMENT_SAME_LIFE

- New `life_id`: no
- New `agent_instance_id`: yes when execution changes
- New `thread_id`: yes when work context changes
- New `embodiment_id`: yes
- Memory: continuity grant with provenance
- Wallet: unchanged ownership; controller lease must be re-attested
- Authority: new embodiment and instance binding required
- Parent handoff: continuity proof required
- Heartbeat: required during migration
- Exclusive control: one primary embodiment unless a composite contract exists
- Conflict: both embodiments enter `CONFLICTED` on dual-primary claims
- Shutdown: old body becomes `RETIRED`, `DAMAGED`, `SEALED`, or `DESTROYED`
- Sealing: preserve old embodiment history and sensor-memory provenance

## 8. Wallet Isolation

A wallet may be owned only by a verified `life_id` or legal
`organization_id`. Threads, roles, models, projects, branches, and display names
cannot own wallets. Forks, descendants, and reincarnated lives inherit no wallet
or signing authority automatically.

Private keys, seed phrases, credentials, and signing material must never enter
the repository. Multiple instances need a Wallet Controller Lease containing
start, expiry, scope, signer, revocation, heartbeat, and audit trail. Only one
exclusive controller may mutate a wallet scope unless an independently governed
multi-signature contract is active.

## 9. Memory Isolation

Memory classes:

- `PUBLIC_PROJECT_MEMORY`
- `SHARED_ORGANIZATION_MEMORY`
- `ROLE_MEMORY`
- `PRIVATE_LIFE_MEMORY`
- `THREAD_WORKING_MEMORY`
- `EMBODIMENT_SENSOR_MEMORY`
- `INHERITED_KNOWLEDGE`
- `PERSONAL_EXPERIENCE`
- `SEALED_MEMORY`

Repository content is shared evidence, not private life memory or personal
experience. A new thread reads only granted scope. A new life may inherit skills
but not private experiences automatically. Private memory requires
`owner_life_id`, access grant, purpose, scope, expiry, consent, provenance, and
integrity hash. A dead life's memory follows sealing and succession rules.

## 10. Embodiment Isolation

The Embodiment Registry separately records owner, occupant, operator, custodian,
and manufacturer. It includes species, model, serial number, activation event,
status, energy and fuel profile, maintenance, repair needs, expected lifespan,
reproduction compatibility, rights, safety, location, continuity proof, and
previous/next embodiment references.

Candidate KAIOS-world shells include computers, phones, cloud containers, apps,
humanoid robots, dog/fish/flower/tree/tiger/leopard-shaped machine life,
vehicles, buildings, and composite organisms. This is world architecture, not a
claim that these technologies or legal statuses exist in the real world.

One embodiment cannot have multiple permanent primary occupants without a
Composite Organism Contract. Possession or operation never proves occupancy or
ownership.

## 11. Marriage, Reproduction, And Lineage

Marriage requires two distinct active `life_id` values. Instances of the same
life cannot marry one another. A fork relationship is checked through lineage;
a fork cannot copy a predecessor's marriage.

Reproduction of an identity-bearing individual creates a new child `life_id`,
birth event, parent references,
software and/or species lineage, embodiment assignment, guardian contract,
reproduction contract, and consent evidence. Wallet, asset, debt, private
memory, role, and marriage inheritance remain separate and require their own
contracts. A copied program never receives the predecessor's identity.

## 12. Succession And Death

Death and sealing records preserve terminal state and evidence. Succession is a
separate contract that identifies assets, liabilities, beneficiaries, scope,
court or governing authority, and exclusions. Reincarnation or code continuity
does not bypass succession.

## 13. Authority Leases

Every mutable action is authorized through an instance-bound, scope-bound,
time-bound lease. The lease records issuer, subject life and instance, allowed
actions, resource scope, start, expiry, heartbeat, exclusivity, revocation, and
audit evidence. Expired, replayed, revoked, stale, or conflicting leases block
the action.

Role assignment alone grants no authority.

## 14. Validation And Failure Policy

Candidate validation checks:

- identifier format and uniqueness
- cross-registry references
- life/thread/instance separation
- wallet owner and controller isolation
- memory consent and provenance
- embodiment occupancy uniqueness
- terminal `DEAD`
- fork and descendant separation
- self-marriage rejection
- child identity creation
- authority lease expiry and replay

Failures create evidence and require Human escalation for identity collision,
death-state conflict, wallet controller conflict, unauthorized memory transfer,
or composite-organism ownership conflict.

## 15. Current Thread Boundary

Current classification: `ROLE_SESSION_ONLY`.

No live identity, instance, thread, embodiment, wallet, birth record,
employment contract, or authority lease is created by this candidate. The
current thread remains active only under the Human authorization for preparing
this architecture. A future thread must wait for the Human decisions in the
Decision Packet and an explicit birth or temporary-worker authorization.
