# Audit Standard

**Document ID:** KAIOS-V10-AUDIT-STANDARD  
**Version:** V10.0  
**Status:** Draft for Review

Audit is the memory of KAIOS. Every meaningful identity, wallet, membership, AI, runtime, marketplace, deployment and review transition must be traceable.

## Audit Types

| Audit | Covers |
|---|---|
| System Audit | configuration and deployment |
| Wallet Audit | address profile and asset views |
| Membership Audit | roles, verification and reputation |
| AI Audit | decisions, WorkOrders, reviews |
| Runtime Audit | state transitions |
| Marketplace Audit | listing, dispute and delisting |

## Required Fields

audit_id, actor, action, previous_state, new_state, reason, timestamp, source, evidence_path, risk_level and reviewer are required.

