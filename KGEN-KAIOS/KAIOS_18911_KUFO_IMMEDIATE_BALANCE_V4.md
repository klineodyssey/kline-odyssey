# K18911 → KUFO Immediate Balance-Proof V4 Candidate

Status: DRAFT SUCCESSOR CANDIDATE / NOT DEPLOYED

This candidate is stacked on PR #158 and deliberately supersedes its catalyst-transfer and continuous half-life mechanics. It does not rewrite deployed V1 history.

## Canon candidate

- K18911 = 煉丹爐.
- K511111 = KUFO wormhole / KUFO universe release organ identity. `511111` is a civilization point, not an EVM hexadecimal address.
- K168888 = 筋斗雲 KUFO output point. The proof is permanently tagged with `KAIOS.POINT.168888.KUFO.OUTLET`; the fixed burn-time beneficiary still receives the KUFO.
- KGEN role = live wallet-balance proof only.
- KGEN is NOT transferred, burned, locked, escrowed, age-checked or tax-receipt checked.
- No 0.1% bank-tax accumulation proof.
- No +/- day KGEN holding rule.
- No 49 Epoch KUFO delivery delay.
- No 130-day holding requirement.

## Atomic alchemy ratio

Current mass lineage is preserved:

- `1 KGEN = 1,000 KAIOS`
- required KGEN wallet balance = `KAIOS input / 1,000`
- KUFO output = `KAIOS input * 1,000`

Example:

- input: `0.001 KAIOS`
- required live KGEN balance: `0.000001 KGEN`
- immediate output: `1 KUFO`

The KAIOS token's existing alchemy burn record remains the upstream proof source. The V4 Furnace checks the holder's KGEN balance first, calls the KAIOS alchemy burn path, writes one exact proof, then invokes the currently registered K511111 wormhole in the same transaction. Any failure reverts the transaction.

## KUFO lifetime

KUFO uses a deterministic K280-year lifetime, not a continuously decreasing displayed balance.

- `K280_YEAR_SECONDS = 31,556,926`
- before expiry: KUFO lot remains KUFO
- at/after expiry: the whole selected lot becomes eligible for one-way conversion
- `1 KUFO = 1,000 KSHIP`
- KSHIP does not decay in this module

Transfers preserve the lot's original birth timestamp. Splitting a transferred lot creates a child lot with the same birth time, so transfer cannot reset KUFO age.

## Future downstream boundary

KSHIP propulsion and K108000 `KSHIP -> KGOD` are downstream products and are not activated by this V4 candidate. KGOD / marriage / KDNA / KRNA rules are intentionally outside this PR.

## Safety

No deployment, Mainnet transaction, token transfer, burn, mint, registry update, signer use or governance action is performed by this repository candidate.
