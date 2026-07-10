# API Gateway Standard

**Document ID:** KAIOS-V10-API-GATEWAY-STANDARD  
**Version:** V10.0  
**Status:** Draft for Review

The API Gateway is the future single ingress for KGEN services. V10 defines the standard but does not deploy a gateway.

## Supported API Styles

| Style | Status | Use |
|---|---|---|
| REST | Prototype Standard | Default request/response API |
| GraphQL | Concept | Aggregated read queries |
| WebSocket | Concept | Live market, game, notification stream |
| Webhook | Concept | External integration callbacks |
| JSON Schema | Draft Standard | Data validation |
| OpenAPI | Draft | Future API publication |

## Gateway Duties

- authenticate request context
- apply rate limits
- validate schema
- check roles and permissions
- route to domain service
- emit audit event
- reject protected or regulated actions without approval

## Secret Rule

The Gateway must never require a Personal Access Token in repository files. Secrets belong in local secrets, GitHub Secrets or environment secrets, never in committed source.

