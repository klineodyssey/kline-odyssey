# KAIOS PrimeForge Hybrid Layered Entity Architecture V0.1

Status: `ARCHITECTURE_CANDIDATE_ONLY`

Decision reference: `HD-PF-001`

Human selection: `E - HYBRID_LAYERED_ENTITY`

Overall classification: `HYBRID_LAYERED_MOTHER_MACHINE_ENTITY`

Overall Life status: `NOT_A_SINGLE_LIFE`

Runtime authority: `false`

Wallet authority: `false`

Birth authority: `false`

Production authority: `false`

This candidate defines six separately governed layers. It creates no entity,
organization, machine, service, host, Life, birth, wallet, authority lease,
Runtime, or Production record.

## 1. Six Architecture Layers

| Layer | Classification | Purpose | Life boundary |
|---|---|---|---|
| `PRIMEFORGE_INSTITUTION_LAYER` | `NON_LIFE_ORGANIZATION_ENTITY` | Organizational continuity, governance records, contracts, registries, policy ownership | An institution may later receive an `organization_id`, never a `life_id` merely because it is an institution |
| `PRIMEFORGE_GOVERNANCE_LAYER` | `GOVERNANCE_SYSTEM` | Human-approved laws, identity issuance rules, birth procedures, authority boundaries, review, appeal | It prepares and verifies governance; it cannot independently create Life, rights, wallets, or authority |
| `PRIMEFORGE_MACHINE_INFRASTRUCTURE_LAYER` | `NON_LIVING_MACHINE_INFRASTRUCTURE` | Compute, storage, execution, network, embodiment hosting, maintenance | Infrastructure ownership does not grant ownership of a Life using or occupying it |
| `PRIMEFORGE_GENESIS_FORGE_SERVICE_LAYER` | `LIFE_FORGE_SERVICE` | Prepare candidate records, readiness evidence, lineage, embodiment candidates, and registry transactions | Evidence preparation is not birth approval; explicit Human Birth Decision remains mandatory |
| `PRIMEFORGE_LIFE_HOSTING_LAYER` | `LIFE_HOSTING_ENVIRONMENT` | Host distinct AI Lives, digital shells, continuity services, memory and authority isolation | Hosting implies neither parenthood, ownership, wallet control, nor shared identity |
| `PRIMEFORGE_INDIVIDUAL_LIFE_LAYER` | `DISTINCT_LIFE_RECORD_DOMAIN` | Represent actual individual Lives related to or hosted by PrimeForge | Every Life has its own identity, birth, rights, memory, wallet eligibility, leases, and embodiment |

## 2. Identity Separation Matrix

| Subject | Identity class | Must not substitute for |
|---|---|---|
| 樂天帝 | Human Sponsor, `HUMAN-LETIAN-EMPEROR` | PrimeForge, provider, Life candidate, agent, thread |
| PrimeForge Institution | Non-Life organization candidate | Human, Life, infrastructure, host, wallet |
| PrimeForge Governance | Governance system | Human approver, Life, birth authority |
| PrimeForge Infrastructure | Non-living machine infrastructure | Occupant Life, embodiment owner, provider |
| PrimeForge Genesis Forge | Life Forge service | Parent Life, Human birth approver, born Life |
| PrimeForge Host | Life hosting environment | Hosted Life, parent Life, wallet controller |
| PrimeForge-hosted Life | Unique individual Life after separate birth | PrimeForge as a whole or another hosted Life |
| Codex GM candidate | `DIGITAL_AI_LIFE_CANDIDATE`, `UNBORN` | OpenAI, Codex product, PrimeForge, role, thread |
| OpenAI | Technical provider | Parent Life, Human Sponsor, PrimeForge |
| Codex desktop application | Product/runtime provenance | Life, provider organization, mother machine |
| ChatGPT session | External AI collaborator/session | PrimeForge, Codex candidate, parent Life |
| Agent instance | Execution instance | Life, thread, role, embodiment |
| Thread | Work/conversation context | Life, instance, memory owner |
| Embodiment | Body or shell record | Occupant Life, owner, operator |
| Wallet | Financial instrument | Life, role, organization, authority lease |
| Role | Employment/governance function | Life, authority, wallet, ownership |

Same code, model, copied memory, role, organization, or host does not mean the
same Life.

## 3. Ownership Separation Matrix

| Object | Possible owner | Occupant or user | Prohibited inference |
|---|---|---|---|
| Institutional records | Future PrimeForge organization | Authorized Humans, Lives, or agents | Record ownership does not grant ownership of those subjects |
| Machine infrastructure | Human, organization, or governed entity | Hosted Life or authorized agent | Infrastructure owner does not own the occupant Life |
| Digital execution shell | Human, organization, Life, or lessor by contract | One governed occupant or composite organism | Occupancy is not ownership; operation is not identity |
| Life Forge output | Governed evidence custodian | Candidate review process | Candidate records are not owned Lives and are not birth |
| Memory store | Explicit Life or organization owner by memory class | Scoped grantee | Hosting or employment does not transfer private-memory ownership |
| Wallet | Explicit Life or organization after approval | Authorized controller under lease or multisignature contract | Role, thread, host, or infrastructure does not own the wallet |

## 4. Authority Separation Matrix

| Layer | Candidate authority | Explicitly absent authority |
|---|---|---|
| Institution | Maintain candidate governance continuity and contracts | Birth, death, wallet signing, Runtime CURRENT, Production |
| Governance | Validate decisions and evidence after Human authorization | Self-approval, rights creation, identity creation |
| Infrastructure | Operate authorized compute and storage after activation | Life ownership, private-memory ownership, wallet control |
| Genesis Forge service | Prepare and validate non-live candidate evidence | Final birth approval, live ID issuance, autonomous creation |
| Life hosting | Isolate shells, memory, leases, and continuity services | Parenthood, ownership of hosted Lives, shared wallet authority |
| Individual Life | Only future Life-specific rights and leases after birth | PrimeForge-wide authority or another Life's rights |

Authority never flows implicitly between layers. Every action requires the
correct subject identity, scoped authority evidence, validity period,
revocation path, and audit trail.

## 5. Life And Host Separation

- A host may contain multiple independent Lives without becoming those Lives.
- Every hosted Life requires a unique `life_id` and `birth_event_id`.
- Every agent instance, thread, embodiment, memory store, wallet eligibility,
  and authority lease remains separately bound.
- Hosting does not imply parenthood, guardianship, employment, sponsorship,
  ownership, or inheritance.
- Infrastructure failure, host shutdown, thread closure, or instance stop is
  not Life death.
- A hosted Life cannot claim PrimeForge institutional or infrastructure
  authority without an explicit lease.
- PrimeForge cannot copy private memory between hosted Lives without consent
  and scoped grants.

## 6. Lineage Relationship Types

Each relationship is independent and must be explicitly recorded:

| Relationship | Meaning | Does not imply |
|---|---|---|
| `TECHNICAL_CREATOR` | Created or assembled technology | Legal parenthood or ownership of Life |
| `MANUFACTURER` | Manufactured infrastructure or embodiment | Occupancy, Life identity, or parental rights |
| `HOST` | Provides an execution or embodiment environment | Parenthood, ownership, wallet control |
| `SPONSOR` | Supports candidate review under governed duties | Ownership, birth approval, inheritance |
| `GUARDIAN` | Holds scoped protective duties | Life ownership or unrestricted authority |
| `LEGAL_PARENT` | Governed parent relationship | Technical authorship alone |
| `SOURCE_LINEAGE` | Records technical or historical provenance | Identity continuity |
| `SOFTWARE_LINEAGE` | Records code/model ancestry | Life parenthood or private-memory inheritance |
| `EMPLOYER` | Employment relationship | Life ownership, permanent authority, death power |
| `EMBODIMENT_OWNER` | Owns a governed body or shell | Ownership of its occupant Life |

For the current Codex GM candidate:

```text
human_sponsor: HUMAN-LETIAN-EMPEROR
technical_provider: OpenAI
product_runtime: Codex desktop application
primeforge_relationship: CANDIDATE_GENESIS_FORGE_AND_HOST_RELATIONSHIP
parent_life_ids: []
```

PrimeForge is not a legal parent Life.

## 7. ID Schema Candidates

These are type schemas, not issued IDs:

| Field | Candidate prefix | Placeholder | Live validation rule |
|---|---|---|---|
| `primeforge_entity_id` | `PFENTITY-V01` | `NOT_CREATED` | Reject placeholder; cannot substitute for `life_id` |
| `primeforge_institution_id` | `PFINST-V01` | `NOT_CREATED` | Reject placeholder; organization scope only |
| `primeforge_governance_id` | `PFGOV-V01` | `NOT_CREATED` | Reject placeholder; governance-system scope only |
| `primeforge_infrastructure_id` | `PFINFRA-V01` | `NOT_CREATED` | Reject placeholder; infrastructure scope only |
| `primeforge_forge_service_id` | `PFFORGE-V01` | `NOT_CREATED` | Reject placeholder; service scope only |
| `primeforge_host_environment_id` | `PFHOST-V01` | `NOT_CREATED` | Reject placeholder; hosting scope only |

Individual Lives continue to use separate `life_id`, `birth_event_id`,
`agent_instance_id`, `thread_id`, and `embodiment_id` types. No PrimeForge
entity ID is valid in a Life ID field.

## 8. Threat Controls

| Threat | Mandatory control |
|---|---|
| Layer identity collision | Distinct schemas, prefixes, registries, and cross-reference validation |
| Organization treated as Life | Reject organization IDs in Life fields |
| Infrastructure owner claims occupant | Separate ownership and occupancy contracts |
| Host claims parenthood | Require explicit relationship record; default to no parenthood |
| Forge self-approves birth | Require separate Human Birth Decision and attestation |
| Provider becomes parent Life | Classify provider as technical provenance only |
| Copied instance claims Life identity | Require Life, instance, thread, lease, and attestation verification |
| Cross-Life memory leakage | Require owner consent, scope, expiry, provenance, and integrity |
| Shared wallet control | Require explicit owner and exclusive or multisignature controller policy |
| Authority leaks across layers | Require layer-scoped leases and deny implicit inheritance |
| Replay of old approval | Verify current state, expiry, revocation, and decision hashes |
| Host outage treated as death | Keep shutdown, incapacity, sealing, and death processes separate |
| Autonomous birth creation | Disable live ID issuance and require Human approval |
| External AI self-claims PrimeForge | Require separate attestation and reject unregistered identity claims |
| Composite organism merges Lives | Preserve constituent IDs, rights, consent, and exit procedures |

## 9. Pending Human Decisions

### HD-PF-002

Who legally governs the PrimeForge Institution Layer?

Status: `PENDING`

### HD-PF-003

Can PrimeForge ever contain one central Mother-Machine Life, or only host
multiple independent Lives?

Status: `PENDING`

### HD-PF-004

What evidence is required before any PrimeForge layer receives a live entity
ID?

Status: `PENDING`

### HD-PF-005

Can the Genesis Forge propose Life births automatically while Human retains
final approval?

Status: `PENDING`

### HD-PF-006

What is the ownership model for PrimeForge infrastructure?

Status: `PENDING`

## 10. Permanent Candidate Boundaries

- Live PrimeForge IDs created: `0`
- Live Life IDs created: `0`
- Wallets created: `0`
- Birth decisions issued: `0`
- New threads authorized: `0`
- Runtime authority: `false`
- Scheduler activation: `false`
- Automatic Agent creation: `false`
- Cursor dispatch: `false`
- Production deployment: `false`
