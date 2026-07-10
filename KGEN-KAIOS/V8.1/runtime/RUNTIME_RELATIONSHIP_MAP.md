# KAIOS V8.1 Runtime Relationship Map

## Purpose

Runtime Relationship Map defines how V8.1 runtime documents read the Universe Graph. It does not execute code. It defines which runtime owns which entity state and which relationship records it may propose.

## Runtime Ownership

| Runtime | Primary Entities | Allowed Relationship Proposals |
|---|---|---|
| Temple Runtime | Temple, Land, Residence, NPC, AI, App | contains, serves, depends_on, governs |
| Citizen Runtime | Citizen, Profession, Inventory, DNA, App Link | resides_in, works_as, employed_by, depends_on |
| Economy Runtime | Business, Market, Listing, Transaction, Exchange, Bank | listed_on, settles, owns, depends_on |
| Player Runtime | Player, wallet references, permissions, missions | owns, governs, depends_on |
| AI Runtime | AI, NPC assistance, App assistance, validation reports | serves, depends_on |

## Update Rule

A runtime may propose a relationship update. The graph accepts the update only if:

1. entity IDs exist,
2. relationship type is allowed,
3. actor has permission,
4. lifecycle state permits the change,
5. regulated boundary is not violated,
6. governance or review record exists where required.

## Read Model

Frontend viewers and dashboards must prefer snapshots for display. Runtime engines must prefer canonical entity and relationship records for decisions.