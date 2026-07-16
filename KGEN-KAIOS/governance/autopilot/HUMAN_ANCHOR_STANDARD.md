---
TITLE: "Human Anchor Standard"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_REVISION_P0"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / KAIOS Company General Manager"
REVIEWED_BY: "Human PrimeForge and independent review required"
RESOLUTION_ID: "AGB-COMPANY-AUTONOMOUS-RUNTIME-001"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
SOURCE_OF_TRUTH: "FALSE_PENDING_INDEPENDENT_REVIEW"
CANONICAL_FILE: "KGEN-KAIOS/governance/autopilot/HUMAN_ANCHOR_STANDARD.md"
---

# Human Anchor Standard

## 1. Purpose

Human Final Authority must be machine-verifiable as an active decision boundary, not merely described in prose. Human Anchor proves authority and scope without requiring Human to operate Git or relay Worker messages.

## 2. Human Authority Record

```text
human_authority_id
authority_holder
decision_id
decision_signature
signature_method
verification_key_id
decision_scope
allowed_actions
forbidden_actions
issued_at
decision_expiry
revocation
emergency_stop
override
appeal
audit_ref
```

Secret signing material is never stored in the repository. Public verification metadata may be retained when approved.

## 3. Human Anchor Check

`HUMAN_ANCHOR_CHECK` runs:

- at every major Company Session start;
- before an autonomy-level change;
- before enabling Auto Dispatch;
- before baseline Freeze or production-sensitive planning;
- before protected, financial, identity or irreversible action;
- after key rotation, revocation or emergency stop.

## 4. Check Flow

```text
Resolve current Human authority
-> verify identity and signature metadata
-> verify decision scope and expiry
-> verify not revoked
-> verify emergency-stop state
-> compare requested action and autonomy level
-> record check evidence
-> ALLOW, DENY or SAFE_HOLD
```

Missing, ambiguous, expired or conflicting authority fails closed. Human silence is never approval.

## 5. Emergency Stop

Emergency stop is monotonic and high priority. It propagates to Company Controllers, Dispatcher, Claim Authority and sensitive adapters. It blocks new Claims and irreversible actions, fences affected Sessions and preserves evidence.

Resume requires a new Human decision. A Worker cannot clear emergency stop.

## 6. Override and Appeal

Human override can approve, reject, suspend, revoke or supersede within declared scope. The previous decision remains in history.

Workers and reviewers may file an appeal with evidence and risk; appeal does not suspend a safety hold or grant action authority.

## 7. Key Lifecycle

Verification keys have creation, activation, expiry, rotation, revocation and compromise states. Rotation preserves historical verification. Compromise freezes affected authority until a new Human decision re-establishes trust.

## 8. Audit

Every check records Session, action, requested level, authority decision, scope, result, reason, evidence hash and timestamp. Private credentials and signatures that reveal secrets are excluded from public logs.

## 9. Architecture Boundary

```text
Human Final Authority: ACTIVE
Human Anchor architecture: UNDER_INDEPENDENT_REVIEW
Signing service implemented: false
Human Git operation required: false
```
