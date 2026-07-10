# KAIOS V8.1 Universe Graph

## Graph Purpose

The Universe Graph is the relationship model that lets KGEN reason about all living civilization objects. It is a directed graph with a canonical backbone and optional cross-links. The backbone provides inheritance and lifecycle. Cross-links provide economy, AI, mission, market, and governance relationships.

## Canonical Backbone

```text
Universe
  -> Civilization
    -> World
      -> Temple
        -> Land
          -> Residence
            -> Citizen
              -> Profession
                -> Business
                  -> Economy
                    -> Exchange
                      -> Bank
                        -> Market
                          -> Listing
                            -> Transaction
                              -> Governance
```

This backbone is a default path, not a prison. An entity may also hold cross-links, such as a Player owning multiple Lands, an AI serving a Temple, or an App being rented by a Business. Cross-links must never erase the canonical parent-child chain.

## Entity Roles

| Entity | Role in Universe Graph |
|---|---|
| Universe | Root container and physical/civilization boundary. |
| Civilization | Large-scale social, economic, and governance organism. |
| World | Playable or simulated world inside a civilization. |
| Temple | Living temple organism with AI, DNA, Runtime, governance and economy. |
| Land | Spatial and economic territory that can be explored, built, rented, traded, conquered, or transferred. |
| Building | Built object on land, including residence, store, bank branch, exchange node, warehouse, factory, and service station. |
| Residence | Citizen anchor. One residence anchors at least one primary citizen slot. |
| Citizen | Civilization life, not the same as Player. |
| Profession | Work identity that produces economic output. |
| Business | Commerce organism operated by citizen, player, AI, or civilization. |
| Exchange | Trading venue, including Huaguo Mountain Exchange 11520. |
| Bank | Simulation or regulated banking boundary depending on implementation level. |
| Player | Human-facing account identity. |
| NPC | System or AI-controlled service life. |
| AI | Life organ or runtime intelligence. |
| App | Organism that can be created, merged, split, upgraded, rented, traded, archived, and recovered. |
| DNA | Evolution blueprint for citizen, AI, App, temple, or civilization. |
| Mission | Goal chain that can generate quests. |
| Item | Tradable or usable resource. |
| Quest | Player or citizen action package. |
| Market | Market context for listings and transactions. |
| Listing | Offer to sell, rent, auction, or reserve an asset. |
| Transaction | Settlement event or simulated trade record. |
| Governance | Rule, vote, policy, delegation, or dispute resolution record. |

## Relationship Types

| Relationship | Direction | Meaning |
|---|---|---|
| `contains` | parent -> child | Structural containment. |
| `owns` | owner -> entity | Ownership or control claim. |
| `resides_in` | citizen -> residence | Citizen home relationship. |
| `works_as` | citizen -> profession | Active profession relationship. |
| `employed_by` | citizen -> business | Work and income relationship. |
| `serves` | AI/NPC/App -> temple/business/player | Service relationship. |
| `listed_on` | asset -> market/exchange | Listing venue relationship. |
| `settles` | transaction -> listing | Settlement relationship. |
| `governs` | governance -> entity | Governance target relationship. |
| `depends_on` | entity -> entity/document/runtime | Runtime dependency relationship. |

## Graph Integrity Rules

1. One entity ID may appear once as a primary entity record.
2. Parent-child relationships must be acyclic.
3. Cross-links may form networks, but must name the relationship type.
4. A status change must update `update_time` and lifecycle state.
5. An ownership transfer must generate a Transaction or Governance record.
6. Regulated real-world links require compliance metadata before Production status.