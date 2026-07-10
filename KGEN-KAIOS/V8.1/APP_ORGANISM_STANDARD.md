# KAIOS V8.1 App Organism Standard

## Definition

App is life. App is not merely a tool or UI. App has identity, DNA, lifecycle, owner, runtime, permissions, dependencies, and economic relation.

## App Lifecycle Actions

| Action | Meaning | Boundary |
|---|---|---|
| Create | Create an App organism record. | Requires owner, parent, runtime, and dependencies. |
| Merge | Combine two or more Apps into a new organism. | Source Apps become dependencies or archived lineage. |
| Split | Divide App into child modules or organisms. | Parent remains lineage source. |
| Upgrade | Improve version, capability, AI link, or economy function. | Requires changelog and compatibility check. |
| Clone | Concept-layer reproduction or template copy. | Must be marked Concept unless licensing permits production copy. |
| Rent | Temporary use rights. | Requires rental terms and expiration. |
| Trade | Ownership or license transfer. | Requires listing and transaction record. |
| Destroy | End active App operation. | Requires recovery or archive path. |
| Archive | Preserve App history. | Immutable historical state. |
| Recovery | Restore or repair App after failure. | Requires reason and state validation. |

## Required Fields

| Field | Meaning |
|---|---|
| `app_id` | Unique App ID. |
| `app_name` | Display name. |
| `owner` | Player, business, temple, AI, or civilization owner. |
| `parent` | Parent temple, business, citizen, or App. |
| `dna` | App DNA or module blueprint. |
| `runtime` | Runtime module. |
| `capabilities` | Actions and service functions. |
| `dependencies` | Schemas, modules, data sources, legal records. |
| `market_state` | Listed, rented, private, archived, or locked. |
| `status` | Draft, Prototype, Active, Dormant, Retired, Archived, Deleted, Disputed. |

## Economy Role

App can be sold, rented, upgraded, combined, used by a Citizen profession, connected to a Business, or listed on 11520. App-generated output must connect to a Business, Market, Temple, Citizen, or Civilization record.