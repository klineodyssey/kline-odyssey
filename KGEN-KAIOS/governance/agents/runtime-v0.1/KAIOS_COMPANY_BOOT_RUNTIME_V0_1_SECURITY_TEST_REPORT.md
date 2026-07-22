# KAIOS Company Boot Runtime V0.1 Security Test Report

Status: PASS

| Security group | Tests | Result |
|---|---:|---|
| Original failure gates | 15 | PASS |
| Forged Boot Result rejection | 8 rejection + 1 valid close | PASS |
| Attestation rejection classes | 10 | PASS |
| Capability allowlist and scope | 8 | PASS |
| Exact terminal state | 4 | PASS |
| Schema alignment | 9 | PASS |

The hashless fabricated PASS record returned exit code 2. Handoff output and archive output were both absent.

Secret values: 0. Forbidden generated files: 0. Runtime code contains no network, Git, GitHub, wallet, payment, deployment or scheduler execution path.

Protected path violations: 0. Product, Runtime CURRENT, Universe Map CURRENT and Token modifications: false.
