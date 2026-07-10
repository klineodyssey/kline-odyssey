# Microservice Standard

**Document ID:** KAIOS-V10-MICROSERVICE-STANDARD  
**Version:** V10.0  
**Status:** Draft for Review

KGEN services are logical boundaries first. V10 does not require deploying real microservices; it defines how future services must be named, owned and audited.

## Required Service Fields

| Field | Meaning |
|---|---|
| `service_id` | Stable service identifier |
| `domain` | Universe, Temple, Wallet, Market, AI, etc. |
| `owner` | Responsible role or department |
| `status` | Concept, Prototype, Production, Regulated |
| `inputs` | Accepted data contracts |
| `outputs` | Produced data contracts |
| `permissions` | Required roles |
| `risk_level` | R0-R4 |
| `audit_events` | Required audit records |
| `dependencies` | Services or runtimes required |

## Core Services

Gateway, Identity, Membership, Player, Citizen, Temple, Business, Market, Exchange, Wallet, Bank, Notification, Analytics, Audit and AI Runtime are defined as first-class service domains.

## Rule

No service may bypass the API Gateway, permission model, audit model or protected-path policy.

