# KAIOS AI Company Source Crosswalk

Task ID: `KAIOS-AI-COMPANY-ORDER-PROJECT-RUNTIME-V1-001`

Source policy: `CHARTER_REQUIREMENTS_REFERENCE_ONLY`

## Authority Order

1. protected CURRENT owners and merged Canonical schemas;
2. merged deterministic simulation Runtimes;
3. merged specifications and Program Registry evidence;
4. local Charter V2.0 and repository V2.1 as read-only requirements sources.

The local Charter folder remains byte-unchanged. No Charter chapter is imported,
promoted or made executable by this crosswalk.

Independent source review verified all 27 chapter/program hashes and found two
Program Registry domain mismatches: Chapters 37 and 64 are registered as
`TIME`, although their source requirements concern resource allocation and
administrative review. V1 records `PROGRAM_REGISTRY_DOMAIN_MISMATCH` and fails
closed; it does not reinterpret those entries as Runtime or legal authority.

## Requirement Crosswalk

| Chapter | Program ID | Current evidence | Coverage | Gap or conflict | Safe V1 action |
|---|---|---|---:|---|---|
| 19 AI Company | `KAIOS-CH-019-061-AI_COMPANY` | enterprise organism and economy demos | 45% demo | no causal order/project coordinator | implement bounded coordinator; preserve enterprise owner |
| 27 Labor | `KAIOS-CH-027-069-LABOR` | Physical Labor schema; Causal World | 58% partial | project-level reservations absent | reuse single-body timeline and fail on conflicts |
| 35 Engineering safety | `KAIOS-CH-035-077-TECHNOLOGY` | technology/research/vehicle demos | 49% demo | no project certification authority | evaluate technology and safety gates only |
| 37 Energy/resources | `KAIOS-CH-037-079-TIME` | simulation clock and timeline | registry coverage not accepted | `PROGRAM_REGISTRY_DOMAIN_MISMATCH`; resource ownership remains distributed | consume finite energy only through verified owner adapters |
| 38 Manufacturing/supply chain | `KAIOS-CH-038-080-SUPPLY_CHAIN` | PR #65 schemas | 34% specification | no full supply-chain engine | build project plan; do not claim factory readiness |
| 39 Logistics/inventory | `KAIOS-CH-039-081-LOGISTICS` | production/logistics demos | 48% demo | incomplete cross-project reservation | reuse route/time constraints and finite inventory |
| 40 Commerce/pricing | `KAIOS-CH-040-082-COMMERCE` | economy/settlement demos | 32% demo | no authoritative customer contract | use simulated proposal and demand only |
| 45 Land/habitat rights | `KAIOS-CH-045-087-HOUSING` | building and room demos | 45% demo | no real title or mutation authority | verify simulated land capability; never grant title |
| 46 Roads/transport | `KAIOS-CH-046-088-TRANSPORT` | Causal World plus vehicle demo | 49% demo | generic network incomplete | require route, load, fuel and elapsed time |
| 48 Energy utility | `KAIOS-CH-048-090-ENERGY_GRID` | no registered implementation path | 15% specification | `SOURCE_UNDERSPECIFIED` for full grid continuity | use bounded project energy inventory; block unsupported grid work |
| 51 Construction/maintenance | `KAIOS-CH-051-093-CONSTRUCTION` | Causal World; Physical Labor | 58% partial | project orchestration and acceptance absent | coordinate staged construction, inspection and maintenance |
| 64 Administrative review | `KAIOS-CH-064-106-TIME` | clock/timeline only | registry coverage not accepted | `PROGRAM_REGISTRY_DOMAIN_MISMATCH`; clock/timeline is not administrative or legal authority | model local review state only, with no permit or legal effect |
| 86 Industrial supply chain | `KAIOS-CH-086-128-SUPPLY_CHAIN` | PR #65 schemas | 34% specification | production dependencies not executable end to end | expose blocked prerequisites and procurement plan |
| 87 Trade/consumer protection | `KAIOS-CH-087-129-COMMERCE` | economy/settlement demos | 32% demo | no real consumer enforcement | require visible assumptions, quality and acceptance |
| 89 Corporate governance | `KAIOS-CH-089-131-GOVERNANCE` | government/public-service demos | 38% demo | held for promotion review | divisions have bounded review gates, not governance power |
| 90 Accounting/audit | `KAIOS-CH-090-132-ACCOUNTING` | PR #65 finance schemas | 34% specification | no project subledger owner | implement balanced simulated project entries |
| 91 Insolvency | `KAIOS-CH-091-133-BANKRUPTCY` | PR #65 finance schemas | 34% specification | no legal insolvency Runtime | bounded distress/restructuring/liquidation simulation |
| 93 Public procurement | `KAIOS-CH-093-135-PROCUREMENT` | no registered implementation path | 15% specification | `SOURCE_UNDERSPECIFIED`; no public authority | local RFQ comparison only; no government contract |
| 94 Public administration | `KAIOS-CH-094-136-NATION` | nation/timeline demos | 55% demo | no administrative authority | reference review state only; no real licensing |
| 104 Critical infrastructure | `KAIOS-CH-104-016-INFRASTRUCTURE` | technology/research/vehicle demos | 49% demo | resilience owner incomplete | hold critical projects lacking dependencies |
| 109 Mobility/logistics | `KAIOS-CH-109-021-TRANSPORT` | vehicle and Causal World routing | 49% demo | no general national transport network | route through available synthetic infrastructure |
| 115 Science/innovation | `KAIOS-CH-115-028-SCIENCE` | research/technology demos | 49% demo | no certification or deployment authority | software/life projects stop at Codex review |
| 116 Economy/industry | `KAIOS-CH-116-029-MANUFACTURING` | production/logistics demos; PR #65 | 48% demo | incomplete industrial capability | apply material, labor, technology and demand gates |
| 124 Logistics resilience | `KAIOS-CH-124-038-TRANSPORT` | vehicle and routing demos | 49% demo | alternate-network planning incomplete | record delay/risk and block absent routes |
| 128 Employment | `KAIOS-CH-128-042-AI_EMPLOYMENT` | Player Genesis | 80% safe simulation | project assignment adapter absent | keep player/AI wallets and work timelines separate |
| 129 Productive resilience | `KAIOS-CH-129-043-MANUFACTURING` | production/logistics demos; PR #65 | 48% demo | no cross-project capacity model | enforce finite company/project capacity |
| 136 Enterprise/factory/court | `KAIOS-CH-136-052-BANKRUPTCY` | PR #65 schemas | 34% specification | `SEVEN_PAIR_LINEAGE_CONFLICT`; V2.1 derivative; KGEN anchor text not authorized | reference-only, no KGEN, court or legal activation |

## Current Owner Coverage

- `KGEN-KAIOS/world-viewer/enterprise/ai-company-organism-runtime.js` owns the
  existing synthetic company organism and is not replaced.
- `KGEN-KAIOS/world-viewer/player-genesis/player-genesis-runtime.js` owns player,
  AI companion, simulated wallets, household and first-work state.
- `KGEN-KAIOS/world-viewer/causal-runtime/causal-world-runtime.js` owns route,
  transport, construction, fuel, wear and physical-time demonstrations.
- `KGEN-KAIOS/world-viewer/aquaculture/aquaculture-runtime.js` owns fishpond
  construction and operation.
- `KAIOS_PHYSICAL_LABOR_SCHEMA.json` owns the single-life physical timeline
  contract; PR #64 remains specification-first.
- `KAIOS_SUPPLY_CHAIN_SCHEMA.json`, `KAIOS_COMPANY_FINANCE_SCHEMA.json` and the
  PR #65 documents remain supply-chain and finance specification owners.

## Gaps Authorized For V1

One coordinator may add request analysis, feasibility projections, dependency
graphs, project resource plans, simulated proposals/contracts, bounded
procurement, execution scheduling, inspection/rework, delivery/acceptance,
maintenance obligations, company capacity and a project subledger.

## Held Gaps

Full energy grid, public procurement, real licensing, real contracts, general
factory production, national logistics, court authority, KGEN settlement,
external autonomy and Production Runtime remain held. `SMALL_FARM_PROJECT`
remains blocked until the Forest/Agriculture Runtime is actually implemented.
