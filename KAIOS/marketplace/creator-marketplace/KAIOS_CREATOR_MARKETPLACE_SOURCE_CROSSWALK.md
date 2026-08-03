# Creator Marketplace Source Crosswalk

| Source | Authority | Reuse | Gap closed here |
| --- | --- | --- | --- |
| `KGEN-KAIOS/world-viewer/player-genesis/player-genesis-runtime.js` | existing Runtime | player, AI, household and starter-land identities | exactly-once finite marketplace grant |
| `KGEN-KAIOS/world-viewer/ai-company/ai-company-project-runtime.js` | existing Runtime | requests, feasibility, tasks, dependencies, resources, inspection and delivery | customer-facing marketplace orchestration |
| `KGEN-KAIOS/world-viewer/economy/life-energy-payroll-runtime.js` | existing Runtime | balanced credit, escrow and worker-owned payroll | Game Credit profile and delivery-linked release |
| `KGEN-KAIOS/world-viewer/causal-runtime/causal-world-runtime.js` | existing Runtime | physical route, construction and time causality | shelter demonstration adapter |
| `KAIOS/labor/` | canonical specification | single-life location/time and skill gates | marketplace worker plan |
| `KAIOS/supply-chain/` | canonical specification | inventory, availability, transport and demand | marketplace purchase and unsold inventory rules |
| `KAIOS/life/` | canonical specification | life identity, taxonomy, provenance and review | candidate listing status separation |
| `KAIOS/economy/life-energy-payroll/` | canonical specification | life/economy separation and no resource substitution | KAIOS Game Credit constraints |
| `KGEN-KAIOS/V10/MARKETPLACE_STANDARD.md` and `runtime/MARKETPLACE_RUNTIME.md` | prototype concept boundary | listing disclosure and no-real-trade boundary | orchestration only; no second trade engine |
| `KGEN-KAIOS/V10/schemas/marketplace.schema.json` | prototype compatibility schema | legacy asset listing identity | richer creator listing projection without overwriting V10 |

Charter sources are not promoted by this work. Existing Runtime and Canonical owners outrank requirements prose.

The V10 Marketplace remains a read-only prototype reference. Creator Marketplace V1 owns the Player-to-AI-Company orchestration flow and emits compatible listing disclosures; it does not activate or duplicate a V10 trading engine.
