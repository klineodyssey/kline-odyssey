---
TITLE: "Monkey Swarm Security Standard"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_REVISION_P0"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / KAIOS Company General Manager"
REVIEWED_BY: "Independent security review required"
RESOLUTION_ID: "AGB-COMPANY-AUTONOMOUS-RUNTIME-001"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
SOURCE_OF_TRUTH: "FALSE_PENDING_INDEPENDENT_REVIEW"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/SWARM_SECURITY_STANDARD.md"
---

# Swarm Security Standard

## 1. Security Boundary

Every Monkey Clone is untrusted until identity, task, scope, workspace, resource and evidence gates pass. Being created by Cursor Master does not grant inherited authority.

## 2. Mandatory Clone Controls

Each Clone must be:

- sandboxed;
- least privilege;
- issued task-scoped credentials;
- limited to path-scoped write permission;
- constrained by compute, memory, event and retry quotas;
- constrained by network policy;
- time limited;
- isolated from secrets;
- fully audit logged.

No shared private credential is permitted between Clones.

## 3. Forbidden Access

A Clone cannot:

- read `DIVINE_VAULT`;
- read another player's KYC;
- read private exact GPS;
- modify Runtime CURRENT or Universe Map CURRENT;
- modify the Token Contract or protected paths;
- elevate its own permission;
- create an unauthorized Clone;
- review related work;
- access another Clone's workspace;
- bypass Company Dispatcher or Canonical Claim Authority.

## 4. Identity Attestation

The identity chain binds:

```text
provider_identity
worker_id
master_clone_id
clone_id
parent_clone
owner_id
session_id
workspace_id
claim_id
fencing_token
boot_version
attestation_time
attestation_method
```

An attestation is scoped and expiring. Restart or Recovery requires a new Session attestation without reusing the old fencing token.

## 5. Sybil Resistance

The Company records Owner and control relationships, applies per-Owner Spawn Budgets, contribution caps and queue fairness, and detects many identities sharing infrastructure or evidence patterns. More Clones do not create more review authority.

Sybil signals trigger reduced quota, additional independent review or `SAFE_HOLD`; they do not automatically declare guilt.

## 6. Collusion Controls

- same Owner Clones cannot review each other;
- parent and child Clones cannot form a complete review chain;
- reviewers rotate across independent control domains;
- conflict-of-interest is declared before review;
- contribution caps prevent queue capture;
- repeated evidence, timing, dependency and voting patterns produce anomaly signals;
- high-risk approval requires separation of execution, review and Human authority.

## 7. Evidence Integrity

Evidence is content-addressed and append-only. Artifact, commit and test hashes are bound to Claim, Worker, Session, causation and authorization. Review signatures cover the evidence root and decision.

Private evidence may be encrypted or held outside public Git. Public records store only approved metadata and hashes. A hash does not make private content public.

## 8. Credentials and Key Rotation

Credential records define owner, purpose, scope, issuer, key identifier, creation, activation, expiry, rotation, revocation and compromise state. Secret material never enters the repository.

Rotation must support overlap for verification, explicit deprecation and revocation. Compromise immediately fences affected Sessions, revokes credentials, freezes sensitive Claims and starts incident review. Historical signatures remain verifiable through non-secret key history.

## 9. Network Policy

Network access defaults to deny and is allowed per Task Envelope by domain, protocol and purpose. Production, payment, KYC, GPS, wallet and protected infrastructure endpoints require separate Human authority. Egress logs must redact secrets and private data.

## 10. Time and Resource Limits

Every Clone has execution deadline, idle timeout, event-rate limit, retry limit, recovery limit, compute budget and memory budget. Limit exhaustion stops work and checkpoints evidence; it never triggers automatic scope expansion.

## 11. Security Events

Security events include identity mismatch, stale token, forbidden path, secret detection, unexpected network target, evidence hash mismatch, quota abuse, collusion signal and privilege escalation attempt. High-risk events fence the Session and enter `SAFE_HOLD`.

## 12. Conformance Tests

Tests must cover sandbox escape denial, path traversal, cross-workspace access, secret redaction, KYC/GPS denial, protected-path denial, stale token, self-review, related-Clone review, unauthorized spawn, network policy, quota exhaustion, key rotation and compromised-key recovery.

## 13. Architecture Boundary

```text
Security architecture: UNDER_INDEPENDENT_REVIEW
Sandbox deployed: false
Credentials issued: false
Production access: false
```
