# Sprint 007 Civilization Governance Product Contract

## Decision

- Human Decision: `HUMAN-SPRINT-007-CIVILIZATION-GOVERNANCE`
- Task: `KAIOS-WV-SPRINT-007`
- Scope: executable synthetic Alpha under the frozen World Viewer architecture
- Base: `7542b1d9d48681e076358304c105d1546f943a6f`

## Source Audit

Sprint 007 extends the current World Viewer Civilization orchestrator. It does not create another Civilization, Settlement, Economy, Life OS or Environment source of truth.

| Source | Authority | Imported boundary |
|---|---|---|
| `KGEN-KAIOS/civilization/CIVILIZATION_ECONOMY_ARCHITECTURE_BASELINE.md` | Frozen Architecture | Rights separation, taxation, evidence, review and prototype-only constraints |
| `KGEN-KAIOS/civilization/RIGHTS_SEPARATION_STANDARD.md` | Frozen Architecture component | Ownership and governance rights remain distinct |
| `KGEN-KAIOS/civilization/TAXATION_STANDARD.md` | Frozen Architecture component | Tax cap, audit and resident protection |
| `KGEN-KAIOS/V8.2/BUSINESS_STANDARD.md` | Historical approved simulation | Hospital and School service concepts only |
| `KGEN-KAIOS/V8.3/DISASTER_STANDARD.md` | Historical approved simulation | Disaster and recovery vocabulary; no real emergency service |
| `KGEN-KAIOS/life/LIFE_OS_ARCHITECTURE_BASELINE.md` | Frozen Architecture | Life maintenance boundary; no governance authority |
| `KGEN-KAIOS/world-viewer/SPRINT_006_SETTLEMENT_ECONOMY_REPORT.md` | Current product baseline | Population, tax, logistics, pollution and KAIOS Credit ledger |

## Runtime Ownership

Three bounded modules fill the executable product gap:

- `governance/government-runtime.js` owns the Village-to-Planet government hierarchy, officials, civil service, Citizen Rights projections, eight-law catalog and Architecture-only Justice case proposals.
- `governance/public-services-runtime.js` owns ten service capacities, Education and Medical facilities, AI Government workers, public appropriations and reviewed public projects.
- `governance/resilience-runtime.js` owns environmental projections, the approved synthetic hazard types, drills, incident recovery and environment-recovery records. It imports Pollution and Ecology from the existing Logistics Runtime rather than redefining them.

## Government Model

```text
Village Council
-> Town Hall
-> City Government
-> Province
-> Nation
-> Planet Government
```

Governor, Mayor and Minister are role assignments, not Human Authority. Treasury and Civil Service operate only on public synthetic fixtures. No client action can create a real office, identity, tax obligation or legal authority.

## Public Services

The Alpha tracks Education, Medical, Justice, Police, Fire Department, Transportation, Public Utilities, Communication, Disaster Response and Social Welfare. Each service declares capacity, demand, staffing, budget, quality and status. Capacity shortages degrade the derived city service index; they never make real-world decisions.

## Citizen Rights

Each synthetic Citizen projection exposes Identity, Citizenship, Residence, Family, Education, Occupation, Health, Property, Tax Record, Reputation and Contribution. Identity remains a public synthetic alias. Health is a game-state projection, property is non-authoritative, and tax records reference the local KAIOS Credit ledger only.

## Law And Justice Boundary

The catalog includes Civil, Criminal, Property, Trade, Environment, Construction, AI and DNA Creation law. Court, Judge, Evidence, Appeal, Penalty, Prison and Rehabilitation are Architecture-only case fields. A case request remains `ARCHITECTURE_ONLY_REVIEW_REQUIRED`; the Alpha cannot convict, imprison, punish or alter Citizen state.

## Public Finance

```text
Settlement Tax
-> Government Treasury
-> Reviewed Appropriation
-> Public Service Account
-> Synthetic Public Project
```

Only KAIOS Credit can execute inside the local conserved ledger. KGEN and external settlement remain request-only. Emergency Fund is a bounded allocation, not real insurance or finance.

## Environment And Resilience

Environment tracks Air Quality, Water Quality, Forest, River, Ocean, Wildlife, Pollution, Carbon and Ecology Recovery. Resilience supports synthetic Earthquake, Flood, Typhoon, Volcano, Pandemic, War, Economic Crisis, Food Crisis and Power Failure incidents plus Recovery. All hazard scores are game abstractions and provide no real prediction, medical, police, military or emergency instruction.

## AI Government Boundary

Government, Medical, Education, Justice, Police, Traffic, Agriculture and Environmental AI workers each require Life OS, scoped permission, audit, evidence and review. They can recommend and simulate; they cannot issue real orders, legal judgments, diagnoses, policing actions or financial transfers.

## Integrity Invariants

1. Public spending preserves KAIOS Credit supply and cannot exceed Treasury balance.
2. Citizen rights are projections and never mutate canonical identity, land or Life OS.
3. Justice proposals cannot execute penalties, prison or Citizen-state mutation.
4. AI Government has least privilege, evidence and review on every recommendation.
5. Public service, environment and resilience histories remain bounded.
6. Environment values and service scores remain in `0..100`.
7. Existing Settlement, Population, Logistics, Economy and Life runtimes remain authoritative for their domains.
8. Runtime CURRENT, Universe Map CURRENT, Kernel CURRENT, Life OS baseline, Settlement product contract, Token Contract and protected paths remain unchanged.

## UI Contract

The Civilization Inspector adds `Government`, `Services` and `Resilience` tabs. Desktop retains the right Inspector. Mobile retains the full-screen bottom sheet and horizontally scrollable tabs. Every action labels its synthetic, proposal-only or drill-only status.

## Review Gates

- Static and strict JSON/JSONL validation.
- ES module syntax and imports.
- Existing Runtime, Genesis, Production, Civilization and Settlement integrity.
- New Governance, Public Services and Resilience integrity plus long-run bounds.
- Desktop, tablet, Android and iPhone browser Product QA.
- Accessibility, responsive layout, safe area, screenshot diff and performance.
- Secret and protected-path checks.
