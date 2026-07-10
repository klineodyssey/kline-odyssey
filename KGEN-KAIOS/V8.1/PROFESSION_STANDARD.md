# KAIOS V8.1 Profession Standard

## Definition

Profession is the economic role of a Citizen, NPC, AI-assisted life, or App organism. It determines income model, required building, skill path, upgrade path, AI capability, and economic output.

## Profession Library

| Profession | Income | Core Skill | Required Building | Upgrade Path | AI Capability | Economic Output |
|---|---|---|---|---|---|---|
| Farmer | Crop yield, resource sale | Cultivation | Farm, land plot, warehouse | Farmer -> Agronomist -> Food Guild Master | Yield planning, weather simulation | Food, materials, trade goods |
| Merchant | Margin, commission | Negotiation | Store, market stall, exchange node | Merchant -> Broker -> Trade House Master | Price comparison, listing optimizer | Goods flow, liquidity |
| Blacksmith | Crafting fee, item sale | Forging | Workshop, factory | Blacksmith -> Master Smith -> Artifact Engineer | Recipe planning, quality prediction | Equipment, tools, materials |
| Temple Keeper | Service donation, ritual fee | Temple service | Temple, service station | Keeper -> Ritual Master -> Temple Steward | Visitor guidance, service routing | Faith service, reputation, temple XP |
| Bank Manager | Simulation fee, treasury management | Risk control | Bank branch, treasury office | Manager -> Risk Officer -> Treasury Governor | Credit scoring, reserve monitoring | Credit, reserve, insurance simulation |
| Exchange Operator | Listing fee, settlement fee | Market operation | Exchange node | Operator -> Market Maker -> Exchange Governor | Matching, dispute flagging | Listings, auctions, rentals, settlement |
| Programmer | Contract, App sale, maintenance | Code | App lab, office | Programmer -> Runtime Engineer -> App Architect | Code review, schema generation | App organisms, modules, automation |
| Scientist | Grant, discovery reward | Research | Laboratory | Scientist -> Research Lead -> Civilization Scientist | Hypothesis generation, data analysis | Technology, patents, civilization upgrades |
| Engineer | Construction fee | Design, mechanics | Workshop, construction yard | Engineer -> Builder Chief -> Infrastructure Architect | Blueprint validation, cost simulation | Buildings, roads, factories, portals |
| Doctor | Service fee | Medicine | Clinic, temple infirmary | Doctor -> Healer -> Bio Runtime Master | Diagnosis assistance, health monitoring | Health recovery, insurance data |
| Teacher | Tuition, training reward | Teaching | School, guild hall | Teacher -> Mentor -> Academy Master | Curriculum generation, skill routing | Skill growth, citizen upgrade |
| Guard | Salary, bounty | Defense | Guard post, city wall | Guard -> Captain -> Security Commander | Threat detection, patrol planning | Security, dispute prevention |
| Explorer | Discovery bounty | Navigation | Outpost, portal station | Explorer -> Pathfinder -> Universe Scout | Route planning, anomaly detection | Land discovery, mission unlocks |
| Builder | Construction fee | Construction | Building site, factory | Builder -> Contractor -> City Builder | Material planning, progress tracking | Residences, shops, city nodes |
| Artist | Commission, artwork sale | Art | Studio, gallery, temple shop | Artist -> Master Artist -> Visual Canon Keeper | Style guidance, asset tagging | Pictures, temple art, culture |
| Designer | Commission, product sale | Design | Studio, App lab | Designer -> UX Architect -> Civilization Designer | Layout analysis, interaction review | UI, products, service flows |

## Required Profession Fields

| Field | Meaning |
|---|---|
| `profession_id` | Unique Profession ID. |
| `name` | Profession name. |
| `income_model` | Salary, fee, commission, reward, yield, rent, royalty, or mixed model. |
| `skills` | Required and growth skills. |
| `required_building` | Building or service node required for active operation. |
| `upgrade_path` | Ordered profession evolution. |
| `ai_capability` | AI assistance permitted for this profession. |
| `economic_output` | Goods, services, data, security, liquidity, research, or culture produced. |
| `status` | Draft, Active, Retired, Archived. |

## Rules

1. One Citizen may hold one primary profession and multiple secondary skills.
2. One Profession may serve many Citizens.
3. AI can assist a profession but must not erase the Citizen identity.
4. Economic output must connect to Business, Temple, Market, Bank, Exchange, or Civilization records.
5. Regulated professions such as financial advisor, medical provider, legal counsel, or securities operator require legal and compliance boundary metadata before Production.