# KAIOS V8.2 Listing Standard

## Definition

Listing is a simulated offer or discovery record for resources, items, Apps, services, land, temple services or future regulated assets.

## Listing Types

| Listing Type | Scope | Boundary |
|---|---|---|
| Resource Listing | Food, wood, stone, metal, energy, knowledge, data, compute | Prototype / Simulation. |
| Business Listing | Store service, room, route, storage, class, hospital service | Prototype / Simulation. |
| App Listing | App organism license, rental, upgrade service | Prototype / Simulation. |
| Land / Temple Listing | Land, residence, temple service node | Concept / Prototype. |
| NFT / Token Listing | Future asset layer | Concept only unless separately approved. |
| Regulated Rights Listing | Equity, securities, lending, insurance | Future Regulated Module only. |

## Required Listing Fields

- `listing_id`
- `market_id`
- `seller`
- `asset_type`
- `asset_id`
- `quantity`
- `pricing_model`
- `price_reference`
- `currency_reference`
- `disclosure`
- `risk`
- `status`

## Rules

1. Listing does not transfer ownership by itself.
2. Listing can generate transaction simulation events.
3. Regulated asset listings must remain Concept unless legal authorization exists.
4. V8.2 listings are not financial recommendations.