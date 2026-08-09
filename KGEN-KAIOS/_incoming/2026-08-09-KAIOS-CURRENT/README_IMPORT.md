# KAIOS Current Data Intake — 2026-08-09

Human instruction: this directory is a temporary intake area for Codex to reconcile into the canonical repository structure. Do not treat this path as the final home of the files.

## Final physics / identity canon

- 1 KGEN = 1 metric ton = 1,000 kg.
- 1 KAIOS = 1 kg.
- 1 permanently destroyed KGEN = 1,000 KAIOS.
- KGEN genesis supply = 72,000,000 KGEN.
- First-generation KAIOS theoretical ceiling = 72,000,000,000 KAIOS.
- 33333 = Gold & Silver Island / KAIOS token deployment point. It is not an EVM wallet, treasury, or recipient.
- 36000 = White Hole.
- 18888 = Lingxiao Celestial Bank / first-generation KAIOS settlement bank.
- KAIOS -> KUFO remains a separate conversion: 1 KAIOS burned -> expected 1,000 KUFO.

## Required Codex action

1. Decode the six `.b64.partXX` files in lexical order into `KAIOS_PROJECT_DATA_CURRENT_2026-08-09.zip`.
2. Verify SHA-256 of the decoded ZIP equals:
   `ac78ad055a9ec5c5776878e3584c14fd728d4fb9b7790022fb2b260cd25c21c8`
3. Inspect every file in the package and compare it with current repository files.
4. Put each corrected/current file in the appropriate canonical repository location; Codex decides placement based on existing repo architecture.
5. Delete active/current obsolete files that conflict with the final canon, especially active 1:10,000 KGEN->KAIOS rules, 720,000,000,000 KAIOS active ceilings, and the old TEN THOUSAND Genesis inscription.
6. Historical files may remain only when they are clearly marked SUPERSEDED/HISTORICAL and cannot be mistaken for CURRENT.
7. Do not bulk-replace the separate correct KAIOS->KUFO rule of 1:1,000.
8. Re-run compile/tests/lineage/integrity checks after reconciliation.
9. Update PR #135 only; do not open another PR and do not deploy Mainnet.
10. After integration, delete this temporary `_incoming/2026-08-09-KAIOS-CURRENT/` staging directory (including the base64 parts) so the repo retains only canonical files.

## Important banking canon

18888 is not a receive-only permanent vault. It is the evolving Lingxiao Celestial Bank. Legitimate money must be able to circulate under explicit bank rules; unrestricted arbitrary owner withdrawal is not the intended model.

500 Celestial Seats are salary/public-function seats, not passive dividend seats. 8888 remains the commercial/economic hub and must not be collapsed into 18888.

## Mainnet safety

`MAINNET_TRANSACTION = NOT_AUTHORIZED`

This intake authorizes repository reconciliation only, not deployment.
