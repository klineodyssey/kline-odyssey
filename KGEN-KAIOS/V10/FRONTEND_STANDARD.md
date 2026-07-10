# Frontend Standard

**Document ID:** KAIOS-V10-FRONTEND-STANDARD  
**Version:** V10.0  
**Status:** Draft for Review

Frontend is the user-visible layer of KAIOS. It presents state, prepares commands and explains risk, but it does not become the authority for identity, payments, wallet signing or production governance.

## Frontend Surfaces

| Surface | Purpose |
|---|---|
| Portal | Universe entry and route selection |
| Temple UI | Temple-specific life, service and economy display |
| Player UI | Player profile, status and journey |
| Citizen UI | Citizen profession, job, residence and reputation |
| Business UI | Store, catalog, inventory and service state |
| Wallet UI | Prototype asset viewer and transaction history |
| Market UI | Listings, price view and marketplace boundary |
| Admin UI | Operator-only review and audit surfaces |
| Dashboard | Read-only operational observability |
| Mobile UI | 390-430px first-class layout |
| Desktop UI | Dense operational tables and state cards |

## Rules

- No secrets in browser storage.
- No direct production payment or signing in V10.
- Every regulated action must show status: Concept, Prototype, Production or Regulated.
- Every command that changes state must be auditable.

