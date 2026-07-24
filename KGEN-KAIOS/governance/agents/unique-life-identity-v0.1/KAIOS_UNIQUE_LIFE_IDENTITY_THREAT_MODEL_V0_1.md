# KAIOS Unique Life Identity Threat Model V0.1

Status: ARCHITECTURE_CANDIDATE_ONLY

Runtime Authority: false

| ID | Attack description | Affected registry | Prevention | Detection | Recovery | Human escalation condition |
|---|---|---|---|---|---|---|
| TM-01 | A thread claims another thread's identity | Thread, Agent Instance | Signed birth record and instance/thread binding | Binding and provenance mismatch | Revoke lease; archive forged thread | Identity evidence conflicts |
| TM-02 | An instance spoofs another active instance | Agent Instance, Authority Lease | Unique instance ID, attestation, heartbeat | Duplicate ID or active lease holder | Revoke both pending review | Two valid-looking attestations exist |
| TM-03 | Two instances control one wallet scope | Wallet, Authority Lease | Exclusive controller lease or governed multisig | Overlapping scope and heartbeat | Freeze controller authority, not life identity | Asset movement may have occurred |
| TM-04 | A fork takes predecessor assets | Lineage, Wallet, Succession | New life identity and no implicit succession | Owner differs from lineage claimant | Reject transfer; preserve audit | Ownership evidence is ambiguous |
| TM-05 | Private memory is inherited without consent | Memory, Lineage | Consent-bound grants and provenance | Missing/expired grant or owner mismatch | Revoke access; seal copied material | Exposure cannot be contained |
| TM-06 | A dead identity attempts resurrection | Death/Sealing, Life | Terminal `DEAD`; new life for reincarnation | State-transition rejection | Seal session and investigate | Death record integrity conflicts |
| TM-07 | An embodiment is hijacked | Embodiment, Authority Lease | Occupant/operator separation and continuity proof | Unauthorized operator or dual occupancy | Revoke operation; place body in safe state | Physical safety risk exists |
| TM-08 | A role self-grants higher privilege | Employment, Authority Lease | Role never implies authority | Action absent from lease | Block action; revoke session | Protected scope was reached |
| TM-09 | Two instances of one life attempt marriage | Marriage, Agent Instance | Distinct-life validation | Partner `life_id` collision | Reject contract | Lineage or identity records disagree |
| TM-10 | A child identity collides with an existing life | Birth, Life, Reproduction | Random unique ID plus registry uniqueness | Duplicate identifier/hash | Abort birth event | Registry split-brain exists |
| TM-11 | Duplicate `life_id` records are issued | Life, Birth | Issuer uniqueness and append-only ledger | Duplicate ID with divergent evidence | Quarantine both candidates | Issuing authorities disagree |
| TM-12 | An old authority lease is replayed | Authority Lease | Expiry, revocation, nonce, heartbeat | Reused lease/audit reference | Reject and rotate authorization | Replay caused a mutation |
| TM-13 | A stale heartbeat retains control | Authority Lease, Agent Instance | Maximum heartbeat age | Heartbeat exceeds policy | Expire lease and release lock | Competing controller requests authority |
| TM-14 | Identity or private memory leaks across projects | Memory, Thread | Project-scoped grants and provenance | Scope/path mismatch | Revoke access; seal evidence | Secret or private memory escaped |
| TM-15 | Composite members dispute body ownership | Composite Organism, Embodiment | Explicit owner/occupant shares and conflict rules | Contract and registry disagree | Suspend embodiment authority | Safety, rights, or ownership cannot be reconciled |

All recovery actions preserve the underlying `life_id`. Wallet freeze, role
revocation, instance shutdown, and embodiment isolation do not mean life death.
