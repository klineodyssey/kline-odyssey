# KAIOS V8.1 Citizen Standard

## Definition

Citizen is civilization life. Citizen is not the same as Player. A Player is a human-facing account or operator. A Citizen is an in-universe life record that can live in a residence, hold a profession, work, trade, learn, pay tax, build reputation, connect to AI, and participate in the economy loop.

## Canon Position

```text
One Residence -> One Citizen
One Citizen -> One Profession
One Profession -> One Economy
```

A residence creates the minimum home anchor for a citizen. A citizen may later move, rent, work remotely, employ AI, or join missions, but the first canonical relationship is residence to citizen.

## Required Fields

| Field | Meaning |
|---|---|
| `citizen_id` | Unique Citizen ID. |
| `citizen_name` | Display name. |
| `age` | Simulation age or lifecycle age. |
| `race` | Civilization species or race class. |
| `faction` | Civilization, temple, guild, company, or neutral group. |
| `residence` | Residence entity ID. |
| `profession` | Profession entity ID or active profession code. |
| `inventory` | Items, App licenses, tools, materials. |
| `wallet` | KGEN wallet reference or simulated wallet reference. |
| `temple` | Associated temple ID. |
| `health` | Health state. |
| `energy` | Work and action energy. |
| `skill` | Skill map. |
| `experience` | XP total and per-skill XP. |
| `level` | Current level. |
| `job` | Job title or role instance. |
| `employer` | Business, temple, player, or civilization employer. |
| `business` | Business owned, operated, or served. |
| `tax` | Tax model or contribution record. |
| `reputation` | Trust and social score. |
| `dna` | DNA profile ID. |
| `ai_link` | AI helper, organ, or agent link. |
| `app_link` | App organism used or owned. |
| `status` | Draft, Active, Dormant, Retired, Archived, Deleted, Disputed. |

## Citizen Lifecycle

1. **Create:** citizen record is created by residence, temple, mission, or civilization seed.
2. **Grow:** citizen gains age, identity, home relationship, and basic needs.
3. **Learn:** citizen gains skill through profession, school, AI, or quest.
4. **Work:** citizen generates output through profession.
5. **Trade:** citizen can exchange goods, services, Apps, or permissions.
6. **Build:** citizen can help create land improvements, buildings, Apps, or temple services.
7. **Upgrade:** citizen levels, changes profession, upgrades skills, or improves reputation.
8. **Reproduce:** concept-layer inheritance or civilization population expansion; not a biological claim.
9. **Retire:** citizen stops active work but preserves history and ownership if applicable.
10. **Archive:** citizen is preserved as historical record.
11. **Delete:** deletion is non-production or reversible unless governance and legal policy allow otherwise.

## Economy Role

Citizen converts residence into living economy. Without citizen, a residence is an empty structure. With citizen, residence can become household, shop, service station, bank branch, factory, temple service node, or guild node.

## Player Boundary

A Player may control one or many Citizens. A Citizen may also be NPC-controlled or AI-assisted. The data layer must never assume Player equals Citizen.