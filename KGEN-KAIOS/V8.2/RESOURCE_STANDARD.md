# KAIOS V8.2 Resource Standard

## Resource Classes

| Resource | Type | Economy Role | Produced By | Consumed By |
|---|---|---|---|---|
| Food | Physical simulation | Citizen energy and restaurant supply | Farm | Citizen, Restaurant, Hotel |
| Wood | Material | Construction, furniture, toolmaking | Forest, Farm, Logistics | Builder, Factory, Warehouse |
| Stone | Material | Building, temple, city infrastructure | Mine, Quarry | Builder, Temple, City Node |
| Metal | Material | Tools, weapons, machinery | Mine, Factory | Blacksmith, Factory, Weapon Shop |
| Energy | Utility | Production, AI compute, logistics | Energy Station | Factory, Data Center, AI Center |
| Knowledge | Civilization resource | Skill, research, education | School, Library, Scientist | Citizen, AI, App, Governance |
| Data | Digital resource | Market insight, AI training, governance | Data Center, Market, App | AI Center, Exchange, Governance |
| AI Compute | Digital utility | AI activity and App organism execution | AI Center, Data Center | AI, App, Marketplace |
| Gold | Store-of-value simulation | Premium goods and reserve model | Mine, Market | Bank, Treasury, Store |
| KGEN | Civilization mass | KGEN world unit and payment reference | Token contract / simulation record | Market, Treasury, Temple |
| Temple Point | Temple service score | Temple activity and service upgrade | Temple Service | Temple, Citizen, Governance |
| Civilization Point | Civilization growth score | Civilization upgrade and governance | Economy Engine | Civilization, Governance |

## Resource Record Fields

Every resource record includes `resource_id`, `resource_type`, `owner`, `source`, `quantity`, `unit`, `quality`, `location`, `status`, `valuation_model`, `created_at` and `updated_at`.

## Rules

1. Resource movement must create a supply-chain event.
2. Resource consumption must update inventory and output metrics.
3. Regulated or real-world resources require legal and audit metadata before Production.
4. KGEN references must respect the official token facts and must not imply price guarantees.