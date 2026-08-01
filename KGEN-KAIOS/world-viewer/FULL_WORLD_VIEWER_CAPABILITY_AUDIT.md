# Full World Viewer Capability Audit

Status: `CURRENT_IMPLEMENTATION_AUDIT`  
Task: `KAIOS-FULL-WORLD-VIEWER-OFFICIAL-WEBSITE-001`  
Mode: `STATIC_WEB_INTEGRATION / SIMULATION_ONLY`

## Classification Rule

This audit classifies repository evidence without promoting synthetic behavior
to Production authority. `Interactive` means a user can operate the current
browser simulation. `Persistent` means local browser storage only; it never
means an authoritative registry, legal title, wallet, or on-chain state.

| Capability | Chinese Name | Repository Path | UI Entry | Runtime Module | Data Source | Current Status | Interactive | Persistent | Synthetic Only | Production Authority | Known Limitation | Recommended Next Action |
|---|---|---|---|---|---|---|---:|---:|---:|---:|---|---|
| `LAND_PARCEL` | 土地 | `land/`, `renderer/`, `selection/` | Map / Land | `land-runtime.js` | `synthetic-world.json`, Schema V2 candidates | `IMPLEMENTED_INTERACTIVE` | Yes | Local drafts | Yes | No | No legal title or registry mutation | Preserve and add construction simulation separately |
| `FISHPOND` | 魚塭 | `aquaculture/`, `../../world-viewer/aquaculture-v1/` | Building Catalog / Fishpond Viewer | `aquaculture-runtime.js` | Deterministic scenario state and read-only public API projections | `IMPLEMENTED_INTERACTIVE` | Yes | Export/import | Yes | No | Bounded simulation; no real property, water right, food certification, wallet, KGEN, or production authority | Extend only through separately reviewed aquaculture worklines |
| `FARM` | 農場 | `agriculture/` | Civilization / Farm | `agriculture-runtime.js` | `agriculture_facilities` | `IMPLEMENTED_SYNTHETIC_DEMO` | Yes | Session | Yes | No | No authoritative farm asset or land title | Reuse in construction workline |
| `HOUSE` | 住宅 | `building/`, `room/` | Land hierarchy | `building-runtime.js`, `room-runtime.js` | `building-home-001` | `IMPLEMENTED_SYNTHETIC_DEMO` | Yes | Session | Yes | No | Existing house can be inspected; no placement workflow | Add bounded placement and maintenance simulation |
| `SHOPPING_MALL` | 商場 | None | Building Catalog | None | None | `MISSING` | No | No | N/A | No | `SHOP` / Market Hall is not a shopping mall implementation | Define mall template and room plan |
| `FACTORY` | 工廠 | `production/` | Civilization / Production | `production-runtime.js` | `factory-refrigerator-alpha-001` | `IMPLEMENTED_SYNTHETIC_DEMO` | Yes | Session | Yes | No | Production cycle exists without building placement | Bind factory organism to a construction package |
| `TECHNOLOGY_BUILDING` | 科技大樓 | None | Building Catalog | None | None | `MISSING` | No | No | N/A | No | Technology Tree is not a building | Define a separate building template |
| `CITY` | 城市 | `city/`, `lod/` | Map hierarchy | `city-runtime.js` | `cities` fixture | `IMPLEMENTED_INTERACTIVE` | Yes | Session | Yes | No | One synthetic city context | Preserve semantic navigation |
| `BUILDING` | 建築 | `building/` | Map hierarchy | `building-runtime.js` | `buildings`, `buildingTemplates` | `IMPLEMENTED_INTERACTIVE` | Yes | Session | Yes | No | Inspection only; no general placement command | Add construction proposal flow |
| `ROOM` | 房間 | `room/` | Map hierarchy | `room-runtime.js` | `rooms`, furniture, equipment | `IMPLEMENTED_INTERACTIVE` | Yes | Session | Yes | No | Fixed synthetic rooms | Add editable local room layouts later |
| `AGRICULTURE` | 農業 | `agriculture/` | Civilization / Farm | `agriculture-runtime.js` | plots and facilities | `IMPLEMENTED_INTERACTIVE` | Yes | Session | Yes | No | Bounded local simulation | Preserve boundaries |
| `PRODUCTION` | 生產 | `production/` | Civilization / Production | `production-runtime.js` | factory and supply nodes | `IMPLEMENTED_INTERACTIVE` | Yes | Session | Yes | No | Prototype credits and inventories only | Preserve boundaries |
| `AI_COMPANY` | AI 公司 | `enterprise/` | Civilization / Company | `ai-company-organism-runtime.js` | AI company fixture | `IMPLEMENTED_SYNTHETIC_DEMO` | Yes | Session | Yes | No | No external autonomous agent | Keep simulation-only |
| `K11520_EXCHANGE` | K11520 交易所 | `exchange/` | Civilization / Exchange | `life-exchange-runtime.js` | candidate listings | `IMPLEMENTED_SYNTHETIC_DEMO` | Yes | Local review state | Yes | No | No wallet or settlement | Keep architecture-only |
| `SETTLEMENT` | 聚落與結算 | `settlement/` | Civilization / Settlement | settlement, population, logistics runtimes | synthetic ledgers | `IMPLEMENTED_SYNTHETIC_DEMO` | Yes | Session | Yes | No | No real KGEN settlement | Keep local ledger |
| `GOVERNMENT` | 政府 | `governance/` | Civilization / Government | government and public-service runtimes | governance fixture | `IMPLEMENTED_SYNTHETIC_DEMO` | Yes | Session | Yes | No | No real-world authority | Keep simulation-only |
| `BIOLOGY` | 生物 | `biology/` | Civilization / Biology | genome, evolution, taxonomy runtimes | synthetic species data | `IMPLEMENTED_SYNTHETIC_DEMO` | Yes | Session | Yes | No | No real biological engineering | Preserve disclaimer |
| `NATION` | 國家 | `nation/` | Civilization / Nation | nation, diplomacy, finance runtimes | nation fixture | `IMPLEMENTED_SYNTHETIC_DEMO` | Yes | Session | Yes | No | No sovereignty or legal authority | Keep simulation-only |
| `TIMELINE` | 時間線 | `timeline/` | Civilization / Timeline | timeline and pocket-time runtimes | timeline fixture | `IMPLEMENTED_SYNTHETIC_DEMO` | Yes | Session | Yes | No | No external timeline authority | Keep bounded |
| `TECHNOLOGY_TREE` | 科技樹 | `technology/` | Civilization / Technology | technology-tree and research runtimes | technology fixture | `IMPLEMENTED_INTERACTIVE` | Yes | Session | Yes | No | Research simulation only | Do not conflate with a building |
| `SPACE_EXPLORATION` | 太空探索 | `technology/` | Civilization / Technology | `space-exploration-runtime.js` | coordinate and mission fixtures | `IMPLEMENTED_SYNTHETIC_DEMO` | Yes | Session | Yes | No | No physical mission or external control | Preserve simulation boundary |

## Building Catalog Verdict

No catalog item is advertised as generally buildable. Current evidence supports
inspection or synthetic operation for land, farm, house, and factory.
`SHOPPING_MALL` and `TECHNOLOGY_BUILDING` remain planned or
missing. The next construction workline must remain `HOLD_NOT_STARTED`.

## Authority Boundary

- Land proposals: `LOCAL_SIMULATION_ONLY`
- Registry persistence: `false`
- Legal title: `false`
- Wallet: `NONE`
- Real KGEN: `DISABLED`
- K11520 settlement: `INACTIVE`
- Production Runtime authority: `false`

