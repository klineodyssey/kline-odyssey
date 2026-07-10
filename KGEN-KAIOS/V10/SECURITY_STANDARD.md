# Security Standard

**Document ID:** KAIOS-V10-SECURITY-STANDARD  
**Version:** V10.0  
**Status:** Draft for Review

Security protects identity, permissions, secrets, signing, rate limits, audit and risk classification.

## Security Domains

- Identity
- Permission
- Role
- Audit
- Signing
- Encryption
- Secrets
- Rate Limit
- Risk Level

## Secret Rules

Personal Access Tokens, private keys, seed phrases, wallet signatures, production credentials and regulated service keys must never be committed. Allowed locations are local secrets, GitHub Secrets or environment secrets, with least privilege and rotation.

## Risk Levels

R0 informational, R1 low, R2 medium, R3 high, R4 critical. R3 requires Human + Codex Review. R4 cannot execute.

