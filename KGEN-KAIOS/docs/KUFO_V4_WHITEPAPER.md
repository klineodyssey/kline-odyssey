# KUFO V4 Whitepaper

Status: DRAFT PRODUCT CANDIDATE
Version: 4.0.0
Solidity: 0.8.24
Upgradeable: NO
Mainnet status: NOT DEPLOYED / NOT LIVE
Primary lineage: KAIOS -> K18911 -> K168888 -> K511111 KUFO -> KSHIP

## 1. Purpose

KUFO is the KAIOS civilization mass produced by the K18911 alchemy product and delivered through the K168888 output organ to the K511111 KUFO world coordinate. K511111 is a KAIOS world coordinate and must not be interpreted as a literal EVM address.

KUFO V4 is designed as a non-upgradeable ERC-20 capped material token whose physical law is fixed at deployment. Organ routing remains replaceable through the KAIOS Organ Registry, but the deployed KUFO token implementation itself has no proxy upgrade path.

## 2. Immediate alchemy rule

The current Product_05 rule is:

- INPUT = KAIOS
- KGEN role = current wallet BALANCE PROOF ONLY
- required KGEN balance = KAIOS input / 1000
- KGEN transfer = NO
- KGEN burn = NO
- KGEN lock = NO
- KGEN holding days = 0
- KUFO output = KAIOS input * 1000

Example:

0.001 KAIOS input + wallet balance >= 0.000001 KGEN -> immediate 1 KUFO.

Old tax-proof, 49-epoch wait and 130-day hold requirements are superseded in this Product_05 lineage.

## 3. Three-Autumn decay law

KUFO V4 does not use an infinite exponential half-life. Each lineage lot has a terminal three-autumn schedule.

K280_YEAR_SECONDS = 31,556,926.

For each original KUFO lot:

- Before Year 1: 0% converted.
- First Autumn: cumulative 50% of the original lot converts to KSHIP.
- Second Autumn: cumulative 75% of the original lot converts to KSHIP.
- Third Autumn: 100% cumulative conversion; every remaining smallest unit is terminally consumed.

Final material relation:

1 KUFO -> 1000 KSHIP total.

No nine-autumn KUFO dust is permitted.

## 4. Transfer and market behavior

KUFO is transferable. Transfer does not reset decay age.

Each mint creates a lineage lot recording:

- owner
- initialAmount
- convertedAmount
- firstAutumnTarget
- secondAutumnTarget
- bornAt
- sourceProof

When a holder transfers or sells only part of a lot, the contract partitions the lot. The child lot inherits the original bornAt timestamp. First- and second-autumn cumulative targets are partitioned from the already committed original targets instead of being recomputed from scratch.

This is required so repeated buying, selling, splitting, or wallet movement cannot make KUFO younger and cannot defer its required decay.

Core invariant:

TRANSFER MUST NOT RESET DECAY AGE.

## 5. KSHIP conversion lineage

Matured KUFO can be burned only through the current Organ Registry KSHIP converter.

The converter creates a unique carrier proof. KUFO records:

- owner
- beneficiary
- converter
- kufoBurned
- expectedKship

KSHIP then independently reads that KUFO carrier record and mints only when the proof lineage matches the current converter and the exact 1:1000 relation.

Proof reuse is rejected.

## 6. Conservation

KUFO V4 tracks:

- totalMintedFromAlchemy
- totalDecayedForKship
- current totalSupply

The token exposes the invariant:

totalSupply + totalDecayedForKship == totalMintedFromAlchemy

A normal holder cannot arbitrarily burn KUFO outside the controlled decay path.

## 7. Supply and administrative surface

MAX_SUPPLY = 72,000,000,000,000 KUFO.

KUFO V4 has no owner mint, no arbitrary admin mint, no native transfer tax, no blacklist, no seizure function and no upgradeTo/upgradeToAndCall proxy mechanism.

The Organ Registry can change which external organ is authorized as the current output or KSHIP converter. This changes routing authority; it does not replace the KUFO token bytecode.

## 8. Bounded lineage traversal

One transfer or decay operation traverses at most 64 lots.

MAX_LOTS_PER_OPERATION = 64.

If the required operation would exceed that traversal bound, the operation fails closed instead of silently omitting lineage or decay accounting. High-frequency market use may therefore require future organ-level batching or safe lot-consolidation design, but no consolidation mechanism may reset bornAt or alter already committed decay targets.

## 9. Security boundaries

The V4 candidate requires review for:

- immediate proof replay protection
- current-output authorization
- current-KSHIP-converter authorization
- beneficiary binding
- partial-lot conservation
- Year 1 / Year 2 rounding preservation
- Year 3 terminal dust removal
- 64-lot fail-closed behavior
- KUFO/KSHIP exact conservation
- transfer-age preservation

## 10. Deployment boundary

This whitepaper describes a repository candidate. It does not assert deployment, Mainnet activation, registry mutation, signer execution, token transfer, governance approval or chain write.

The required flow is:

玄曜 Product Engineering -> exact-head CI / EVM tests -> Codex/衡曜 GM independent review -> human-authorized deployment process.
