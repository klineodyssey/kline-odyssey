# Authentication Standard

**Document ID:** KAIOS-V10-AUTHENTICATION-STANDARD  
**Version:** V10.0  
**Status:** Draft for Review

Authentication identifies a session. Authorization decides what the session may do. V10 defines both as architecture only.

## Identity Inputs

| Input | Status | Notes |
|---|---|---|
| Guest session | Prototype | Anonymous read-only exploration |
| Email / social login | Concept | Requires privacy policy |
| Wallet connect | Concept | No V10 signing implementation |
| Developer key | Concept | Must be scoped and revocable |
| Admin session | Concept | Requires MFA and audit |

## Session Rules

- Session ID must not be used as member ID.
- Authentication must emit audit events.
- Privilege escalation requires explicit role change.
- Secrets must never be committed.

