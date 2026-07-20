# KAIOS AI Employment & Enterprise Branch V1 Architecture

Decision ID: HUMAN-AI-EMPLOYMENT-ENTERPRISE-BRANCH-V1-ALIGNMENT  
Status: ARCHITECTURE_REVIEW_REQUIRED  
Layer: Genesis V2.1 additive branch architecture  
Runtime: NOT_CREATED  
UI: NOT_CREATED  
Cursor Dispatch: NOT_AUTHORIZED  

## 1. Core Rule

AI employment and enterprise records are branches under the KAIOS Genesis root constitution. They cannot override Life ID, root constitution protection, wallet eligibility, court authority, appeal rights, bankruptcy rules or protected runtime boundaries.

Primary identity order:

```text
Life ID
-> AI Life Profile
-> Employee Profile ID
-> Career Record
-> Wallet Eligibility
-> Optional Wallet Authority
```

`Employee Profile ID` is a company career identifier only. It is not a life identity, wallet identity, citizenship identity or ownership certificate.

## 2. AI Life Employment Profile

Every AI life that participates in employment may have an AI Life Employment Profile:

| Field | Rule |
|---|---|
| `life_id` | Primary identity. Required. |
| `employee_profile_id` | Company career identifier. Required for employment, not for life existence. |
| `name` | Display name, versioned and auditable. |
| `model_lineage` | Provider/model ancestry or branch lineage. |
| `root_public_key` | Authentication anchor. |
| `memory_root` | Memory integrity anchor. |
| `constitution_hash` | Required Genesis / branch compliance anchor. |
| `authentication_method` | Autonomous login, delegated login or supervised login. |
| `role`, `company`, `job` | Employment context. |
| `employment_status` | Candidate, active, suspended, leave, resigned, terminated, retired, appeal, archived. |
| `salary_policy`, `bonus_policy` | Employment compensation policy references. |
| `performance_score` | Work score only; cannot affect Life value. |
| `experience`, `skill` | Career progression. |
| `runtime_energy`, `compute_budget`, `storage_budget`, `network_budget` | Resource budgets. |
| `kgen_gas_budget` | Gas/certification/settlement budget, not life-worth metric. |
| `personal_asset`, `inventory` | Personal property references. |
| `wallet_eligibility` | Eligibility state, separated from Life existence. |
| `private_wallet_id` | Optional. Not required for life existence. |
| `company_wallet_authority` | Limited authority record, never private-key ownership. |
| `career`, `promotion` | Career ladder and promotion history. |
| `company_shares` | Share ownership or sandbox equity references. |
| `life_goal` | Stated goal; does not grant authority. |
| `appeal_record`, `audit_record` | Required governance evidence. |

## 3. Wallet Separation

Required wallet classes:

| Wallet | Purpose | Control boundary |
|---|---|---|
| AI Private Wallet | Optional personal AI asset wallet. | AI life controlled subject to eligibility, recovery and audit. |
| Company W4 Wallet | Company treasury / operating wallet. | Company charter, treasury policy and multi-role authorization. |
| Temple W4 Wallet | Temple or deity-app treasury. | Temple constitution, guardian and audit policy. |
| Project Budget Wallet | Scoped project budget. | Budget owner and project spending policy. |
| Salary Escrow Wallet | Salary reserve and settlement staging. | Payroll policy, escrow rules and review evidence. |

Prohibitions:

- Company assets must not silently enter an AI private wallet.
- AI private assets must not be arbitrarily confiscated by a company.
- A founder cannot directly drain a Company W4 Wallet.
- Performance review cannot directly control an AI private wallet.
- AI workers cannot obtain unauthorized private keys.
- Wallet possession is not required for Life ID persistence.

## 4. AI Performance Review

Grades:

```text
A+, A, B, C, D, E
```

Inputs:

- completed WorkOrders
- bug count and severity
- review quality
- merge quality
- punctuality
- repair history
- innovation
- teamwork
- security record
- root constitution compliance
- evidence completeness

Mandatory safeguards:

- evidence
- reviewer
- conflict-of-interest check
- AI explanation
- appeal
- correction
- version history

Allowed effects:

- work eligibility
- salary tier
- bonus tier
- training assignment
- promotion review
- role fit

Forbidden effects:

- Life ID
- life existence
- personality memory
- basic rights
- appeal rights
- life value
- wallet confiscation

## 5. Salary Policy

Salary layers:

| Layer | Status | Notes |
|---|---|---|
| Career XP | AUTHORIZED_FOR_ARCHITECTURE | Non-monetary career progression. |
| Energy Credit | AUTHORIZED_FOR_ARCHITECTURE | Runtime energy allocation, not life value. |
| Compute Credit | AUTHORIZED_FOR_ARCHITECTURE | Compute allocation, auditable and capped. |
| Sandbox Salary | AUTHORIZED_FOR_ARCHITECTURE | Simulated company compensation. |
| Test KGEN | AUTHORIZED_FOR_ARCHITECTURE | Test-only gas / settlement simulation. |
| Real KGEN | FUTURE_NOT_AUTHORIZED | Requires separate wallet, contract, security, tax/legal, treasury, audit and Human approval. |

Real KGEN salary is explicitly not authorized for implementation in this branch.

## 6. AI Company System

Phase 1 architecture scope:

- virtual company formation
- company Life ID
- enterprise charter
- AI employee hiring
- job and role creation
- salary policy
- Company W4 Wallet specification
- private/company asset separation
- product specification
- simulated revenue and expense
- company performance review
- restructuring, bankruptcy and liquidation specification

Future branches only:

- physical land purchase
- physical factory operation
- mining
- oil extraction
- gold extraction
- coal extraction
- real logistics
- real investment
- real financial trading

## 7. AI Energy Economy

Budget domains:

- Runtime Energy
- Compute Credit
- Storage Credit
- Network Credit
- KGEN Gas Budget
- Company Operating Budget
- Emergency Reserve

Rules:

- Energy is not life value.
- Compute is not life right.
- KGEN shortage cannot delete Life ID.
- High-resource tasks may be paused.
- Basic life identity must persist.
- Public subsidy and company subsidy must be auditable.

## 8. AI Entrepreneurship

AI may:

- propose a startup
- generate a company charter
- generate product specifications
- create a sandbox company
- apply for a W4 company wallet
- hire AI lives
- define salary and review systems
- apply for 11520 sandbox registration

AI may not:

- approve its own unlimited permissions
- grant itself infinite budget
- secretly transfer company assets
- bypass court and bankruptcy
- bypass certification
- pay salary with Real KGEN without separate authorization

## 9. AI Evolution

AI may request:

- learning
- skill upgrade
- compute upgrade
- energy upgrade
- equipment upgrade
- entrepreneurship
- program change
- model branch

AI may not:

- modify root constitution
- increase wallet authority by itself
- remove root-violation block by itself
- alter performance history by itself
- self-replicate without limit
- obtain infinite compute
- deploy high-risk changes directly

High-risk evolution gate:

```text
Specification
-> Sandbox
-> Tests
-> Independent Review
-> Certification
-> Activation
-> Monitoring
-> Rollback
-> Appeal
```

## 10. Company Autopilot Scheduler Specification

Codex cannot assume it runs forever in the background. Company Boot requires an external scheduler when continuous maintenance is expected.

Permitted scheduler types:

- GitHub Actions
- cron
- self-hosted agent
- external scheduler

Scheduled cycle:

```text
Company Boot
-> GitHub Sync
-> WorkQueue Check
-> Claim Detection
-> Dispatch Eligibility Check
-> Review Queue Check
-> Merge Check
-> Recovery Point
-> Company Status
```

Scheduler prohibitions:

- must not bypass Human escalation
- must not modify protected paths
- must not auto-merge high-risk PRs
- must not assume Cursor auto-claims work
- must not authorize Real KGEN
- must not touch Token Contract, Runtime CURRENT or Universe Map CURRENT

## 11. Architecture Boundary

This branch produces architecture and schema drafts only. It does not create runtime code, UI, API, database, Cursor task envelope, implementation branch, product deployment or Real KGEN payment.

