# K18911 → KUFO Three-Autumn V4 Candidate

Status: DRAFT SUCCESSOR CANDIDATE / NOT DEPLOYED

This is the current Product 5 review candidate. It preserves deployed history but supersedes earlier candidate mechanics that depended on KGEN tax accumulation, KGEN holding age, catalyst-bank transfer, 49-Epoch waiting, 130-day freshness, or continuous residual half-life dust.

## Point roles

- K18911 = 煉丹爐; KAIOS alchemy entry.
- K511111 = 齊天大聖宮 / KUFO 蟲洞與幣世界座標. `511111` is a civilization point, not an EVM hexadecimal address.
- K168888 = 筋斗雲; fixed-beneficiary KUFO output organ.
- K108000 = future KSHIP fuel-consumption → KGOD transformation point; outside this product.
- K16888 = future marriage / KGOD ring point; outside this product.

## Immediate alchemy

- `1 KGEN = 1,000 KAIOS`.
- required current KGEN wallet balance = `KAIOS input / 1,000`.
- KUFO output = `KAIOS input * 1,000`.
- KGEN is balance proof only: no transfer, burn, lock, escrow, allowance, holding-age or tax-history requirement.
- KAIOS alchemy burn record remains the upstream settlement evidence.
- after successful KAIOS burn proof, K18911 calls the registered K168888 output organ in the same transaction.
- K168888 cannot redirect beneficiary or amount.

Example: `0.001 KAIOS` + current wallet balance `>= 0.000001 KGEN` → immediate `1 KUFO`.

## KUFO Three-Autumn decay

`K280_YEAR_SECONDS = 31,556,926` and one K18888 Heaven day equals one K280 Earth year in this project time scale.

For each original KUFO lot:

- before Year 1: 0% converted.
- Year 1 / First Autumn: cumulative 50% KUFO converted to KSHIP.
- Year 2 / Second Autumn: cumulative 75% converted.
- Year 3 / Third Autumn: 100% converted; all remaining smallest-unit dust is terminally consumed.
- exact lineage: `1 KUFO` eventually produces `1,000 KSHIP`.
- KSHIP does not half-life in this product.

For an original `1 KUFO`: First Autumn produces 500 KSHIP, Second Autumn adds 250 KSHIP, Third Autumn adds the final 250 KSHIP, and KUFO remaining becomes exactly zero.

Transfers preserve lot age. Partial transfers split lineage lots without resetting the original birth timestamp. The implementation caps one transfer traversal at 64 lots to fail closed rather than permit unbounded gas growth.

## Downstream boundary

KSHIP is future UFO antimatter fuel. Its later fuel consumption at K108000 may produce KGOD. KGOD, K16888 marriage, KDNA and KRNA are intentionally not implemented by this Product 5 candidate.

## Safety

Repository candidate only. No deployment, Mainnet transaction, KGEN/KAIOS/KUFO/KSHIP transfer, burn, mint, signer use, Organ Registry update, governance action or chain write is performed by this PR.
