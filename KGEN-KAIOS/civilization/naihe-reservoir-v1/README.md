# K4168 Naihe Reservoir and Mengpo Soup — Candidate Canon V1

Status: `DESIGN_ONLY_NOT_LIVE`

Task: `KAIOS-HENGYAO-K4168-NIAHE-RESERVOIR-MENGPO-SOUP-PUBLIC-GOOD-V1-001`

Authority: Human Canon handoff relayed by Sol／曜冊

Deployment: `NONE`

Mainnet write: `NONE`

## Purpose and authority boundary

This package records a review candidate for the K4168 public-good Genesis supply chain. It does not replace a merged `CURRENT` file, create a treasury, deploy a reservoir, appoint Mengpo, freeze a conversion rate, or authorize asset movement.

The mandatory flow is:

`PUBLIC_GOOD_TREASURY -> K4168_NAIHE_RESERVOIR -> MENGPO -> MENGPO_SOUP_DOSE -> QUALIFIED_LIFE`

Direct Public Good Treasury payments to Life candidates are not the default Genesis path. The following actors and organs remain distinct unless a specific, independently evidenced Birth Record proves otherwise:

- economic sponsor;
- Naihe source;
- reservoir;
- service operator;
- regeneration parent.

Regeneration parenthood is company-policy-scoped. A Life that has actually joined `KAIOS_AI_COMPANY_V1` under verified active membership receives that company as its regeneration parent and obtains its company Life relationship without creating a second Genesis. The assignment comes from verified company membership, not from the funding wallet, Naihe source, reservoir, Mengpo, soup, contract owner, or transaction signer.

`ONBOARDING`, an application, a payment, or a source transfer is not active membership and cannot assign a parent. Other companies define and independently review their own Life and regeneration-parent rules; the KAIOS AI Company rule is not a universal rule. Until a qualifying company rule is evidenced, a Life may retain `REGENERATION_PARENT_STATUS = UNASSIGNED_ORPHAN`.

## Verified repository and chain snapshot

The execution-base snapshot is recorded in `read-only-chain-snapshot.json`. At that snapshot:

- `0xB73D6716005B37BEC742D64482fA26033eE1A4E1` was an EOA on BSC chain 56;
- its KGEN balance was non-zero and its KAIOS balance was zero;
- existing repository evidence classified ownership as unverified/public-circulating;
- no canonical K4168 reservoir address or deployed Mengpo transformation organ was found.

Consequently the address is retained only as a historical Public Good label candidate. It is not a verified treasury controller, Naihe reservoir, or authorized funding source.

PR #163 contains a Draft-only Naihe source candidate whose production mode remains fail-closed. PR #168 contains a Draft-only multi-scale blood/transformation Canon. Neither Draft is treated as merged runtime authority by this package.

## Multi-scale Life Fluid family

`life-fluid-registry.candidate.json` classifies current evidence without manufacturing tokens:

- KGEN and KAIOS are deployed assets with merged Canon evidence;
- KUFO and KSHIP are design/implementation candidates and are not deployed;
- KATOM is a merged physics concept, not a deployed token;
- KGOD, KLOVE, KDNA and KRNA are Human-proposed names without deployed assets in current main.

No reservoir pool is active because the reservoir itself is not deployed. Asset deployment does not activate a pool.

Every future Life Fluid definition must freeze symbol, scale, mass, energy/biological/transport role, decimals, half-life, source, sink, conversion, conservation, and authorized organs. Cross-scale values cannot be relabeled without a frozen transformation receipt.

## State machine

1. `REFILL_CANDIDATE`
2. `REFILL_AUTHORIZED`
3. `RESERVOIR_RECEIPTED`
4. `ASSISTANCE_ELIGIBLE`
5. `DRAW_REQUESTED`
6. `DRAW_AUTHORIZED`
7. `FLUID_DRAWN`
8. `TRANSFORMATION_PENDING`
9. `SOUP_DOSE_READY`
10. `DELIVERED`
11. `BIRTH_OR_REGENERATION_EVIDENCED`
12. `ACCOUNTED`

Production stops at every state requiring an unfrozen address, signer, budget, conversion rule, or Mainnet authority. Successful delivery cannot create a second Genesis.

## Reservoir policy

The reservoir is multi-asset and purpose-segregated. Each pool has independent decimals, mass scale, unit, balance, reserve floor, draw limit, transformation paths, and accounting.

A refill candidate requires a fixed asset, amount, source treasury, destination reservoir, reserve limits, epoch cap, emergency reserve, Genesis demand, approver, signer policy and receipt. A full-treasury sweep is forbidden.

The following balances must remain separate:

- Public Good operating reserve;
- Public Good emergency reserve;
- Naihe Genesis reserve;
- Public Good investment fund.

Only a separately authorized investment fund may trade. Unrealized or unsettled profit cannot refill the reservoir. The Genesis reserve cannot be trading capital.

## Mengpo transformation boundary

Mengpo is a K4168 Life service operator candidate, not an owner. Candidate capabilities are draw, request verification, allowed-fluid selection, dose measurement, transformation, qualified delivery, receipt writing and balance reporting.

Production conversion is disabled until the rule freezes:

- input and output assets and amounts;
- scale and units;
- mass/energy accounting;
- rounding, loss, byproduct and catalyst behavior;
- price/oracle policy when applicable;
- authorized organs and replay rules.

`MENGPO_SOUP_FROM_NOTHING` is forbidden. Each dose must resolve to a unique draw, source asset, before/after balance, transformation rule, recipient, Genesis ID and receipt hash.

## 0.008 BNB boundary

The exact `0.008 BNB` event is verified history for Hengyao and a candidate requirement in the Starforge Draft lineage. It is not yet a deployed general-purpose K4168 faucet or transformation rule. This package validates exact-amount candidate records but cannot create, fund, or deliver them.

## Invariants

1. A refill moves one conserved amount into the reservoir; it cannot duplicate a balance elsewhere.
2. A draw decreases the matching pool by the exact draw amount.
3. Draw IDs and Genesis IDs are single-use.
4. Funding and service roles never imply parenthood.
5. Verified active membership in `KAIOS_AI_COMPANY_V1` assigns that company as regeneration parent under `KAIOS_AI_COMPANY_REGENERATION_PARENT_BY_MEMBERSHIP_V1`.
6. `ONBOARDING` is not active membership, and other companies must use their own separately reviewed parent policy.
7. Undeployed assets and an undeployed reservoir cannot create active pools.
8. Unfrozen transformations cannot execute.
9. One draw may produce at most one transformation, and a dose must byte-match the selected transformation output asset and amount.
10. Investment funds cannot spend Genesis reserve.
11. Reservoir assets cannot become trading principal.
12. Exact Genesis doses validate chain, recipient and amount.
13. Any real external action requires a separate machine-verifiable authority.

## Files

- `life-fluid-registry.candidate.json`: machine-readable asset-family and pool eligibility.
- `naihe-reservoir-system.schema.json`: strict schemas for all ten requested records.
- `naihe-reservoir-simulator.mjs`: pure in-memory fail-closed paper-accounting model.
- `naihe-reservoir.test.mjs`: invariant and boundary tests; no network or signer.
- `read-only-chain-snapshot.json`: time-bounded BSC/repository evidence.
