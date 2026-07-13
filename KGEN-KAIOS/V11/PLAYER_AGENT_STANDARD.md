# KAIOS V11 Player Agent Standard

**Document ID:** KAIOS-V11-PLAYER-AGENT-STANDARD
**Version:** V11 Design Proposal 1.0
**Status:** DESIGN PROPOSAL / HUMAN REVIEW REQUIRED
**Task ID:** KAIOS-V11-MULTI-AGENT-CIVILIZATION

## Definition

A Player Agent is an AI life record governed by a Human Player inside a KGEN civilization profile. It may perform game, research, media, customer-service, marketplace, analysis, or other approved missions. It is not automatically a legal employee, financial account holder, autonomous wallet signer, KAIOS repository Worker, or owner of Human rights.

## Canonical Identity

Each Agent requires a permanent `agent_id`. Display name, role, department, owner, skills, rank, and status may change, but the ID and lineage history remain stable.

Recommended future ID format:

```text
AGT-<CIVILIZATION-ID>-<SEQUENCE>
```

IDs must be allocated by an atomic registry process in implementation. Reusing retired IDs is forbidden.

## Required Profile Fields

| Field | Design meaning |
|---|---|
| Agent ID | Permanent unique identity |
| Owner ID | Current accountable Human or governed custody record |
| Name | User-facing display name, non-unique |
| Role | Current functional role |
| Department | One primary department |
| Skill Tree | Versioned capabilities and proficiency evidence |
| Memory Level | Maximum approved memory scope M0-M5 |
| Trust Score | Evidence-derived score; not self-declared |
| Rank | Employment/evolution rank governed by promotion rules |
| Salary | Reference to a prototype salary policy, not guaranteed payment |
| Wallet | Public wallet profile or internal ledger reference only |
| Attendance | Current evidence-based duty state |
| Mission History | Immutable references to completed, rejected, blocked, and failed missions |

Additional required controls are `permission_profile`, `risk_ceiling`, `reviewer_id`, `lifecycle_state`, `license_terms`, `privacy_class`, `provenance`, and timestamps.

## Ownership And Custody

Ownership means the right to configure and use an Agent within applicable license, platform, privacy, security, and legal boundaries. It does not necessarily mean ownership of underlying foundation-model weights, vendor services, third-party data, open-source copyrights, or a Human identity represented by the Agent.

Allowed custody models for design review:

- `SOLE_OWNER`
- `CIVILIZATION_CUSTODY`
- `SHARED_USE_WITH_PRIMARY_OWNER`
- `LEASED_USE`
- `OPEN_SOURCE_INSTANCE`
- `COMMERCIAL_LICENSE_INSTANCE`

Every non-sole model must identify the accountable owner, allowed uses, termination conditions, data retention, and dispute process.

## Trust Score

Trust is computed from evidence such as review pass rate, mission completion, policy compliance, rollback rate, protected-boundary violations, report quality, and stale-claim behavior. It cannot be purchased directly or increased solely by mission volume.

Suggested bands:

| Score | Band | Boundary |
|---:|---|---|
| 0-19 | Untrusted | No autonomous mission claim |
| 20-39 | Trial | Sandbox missions only |
| 40-69 | Active | Normal low/medium-risk missions with review |
| 70-89 | Trusted | Broader low-risk assignment and mentoring |
| 90-100 | Senior Trusted | Limited whitelist autonomy; no protected/high-risk bypass |

## Skill Tree

Skills require evidence references, version, source mission, review result, proficiency, decay policy, and last verification. A claimed skill that lacks evidence is `UNVERIFIED` and cannot satisfy a mission hard requirement.

## Wallet Boundary

The Agent wallet field may reference:

- an internal game ledger account;
- an 8888 prototype employee account;
- a public wallet profile approved by the owner;
- a future human-controlled signing arrangement.

It must never store private keys, seed phrases, passwords, signing tokens, or autonomous withdrawal authority. Any irreversible transfer requires the applicable Human approval and legal/security review.

## Privacy And Memory

- Agent records must minimize personal data.
- Memory provenance and consent are required.
- Marketplace listings cannot expose private mission logs or owner secrets.
- Shared and leased Agents require memory isolation between owners.
- Retirement must define retention and erasure eligibility.

## Player Controls

The Human Player may propose or exercise, subject to risk gates:

- create or recruit an Agent;
- rename and configure display profile;
- assign department and budget;
- pause, reassign, promote, demote, retire, or archive;
- approve marketplace license terms;
- approve high-risk missions and irreversible transfers;
- inspect attendance, mission, payroll, violation, and evolution history.

The Human Player cannot erase mandatory audit evidence, grant repository main access outside KAIOS workforce governance, or authorize conduct that violates Canon, law, security, or platform terms.

## Registration Decision

V11 design supports many Player Agents per owner. Actual unlimited registration is not approved until Phase 1 proves unique ID allocation, quota enforcement, privacy isolation, owner recovery, and deterministic audit history.
