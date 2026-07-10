# Backend Standard

**Document ID:** KAIOS-V10-BACKEND-STANDARD  
**Version:** V10.0  
**Status:** Draft for Review

Backend is the future service layer behind KGEN. V10 defines service domains but does not deploy servers.

## Backend Domains

Gateway, Identity, Membership, Player, Citizen, Temple, Business, Market, Exchange, Wallet, Bank, Notification, Analytics, Audit and AI Runtime are the required service families.

## Service Contract

Each backend service must provide:

- stable service ID
- input schema
- output schema
- permission policy
- audit event list
- failure states
- rate limit class
- protected-path boundary
- risk level

## Boundary

The backend may prepare blockchain instructions, but it must not silently sign, transfer, deploy, or custody assets. Wallet signing and regulated finance require separate approval and legal review.

