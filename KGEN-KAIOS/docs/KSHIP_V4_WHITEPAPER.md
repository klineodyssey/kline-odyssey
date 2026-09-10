# KSHIP / K108000 / KGOD Cumulative Whitepaper

Status: DRAFT PRODUCT CANDIDATE
Version: KSHIP 5.0.0 / K108000 1.1.0 / KGOD 1.0.0
Solidity: 0.8.24
Upgradeable: NO
Mainnet status: NOT DEPLOYED / NOT LIVE
Primary lineage: K511111 KUFO -> K108000 點石成金 KSHIP -> K108000 equal-matter reaction -> K168888 筋斗雲 KGOD

## 1. Purpose

KSHIP is the stable carrier material produced from terminally decaying KUFO at K108000 點石成金. It is the antimatter input used by the K108000 propulsion / transformation reactor. KGOD is minted only from a verified K108000 reaction proof and is born at the K168888 筋斗雲 coordinate.

The canonical Solidity filenames and contract names are `KSHIP`, `K108000MassEnergyReactor`, and `KGOD`. Version identity is encoded inside each contract through `VERSION` and `VERSION_ID`, not in the formal program filename. None has a Mainnet address until an authorized deployment receipt exists.

KSHIP has NO HALF-LIFE in Product_05. Once valid KSHIP is minted from a verified KUFO carrier proof, this product does not automatically decay it.

## 2. Material relation

The exact conversion law is:

1 KUFO = 1000 KSHIP.

KSHIP does not create value independently. It can be minted only from an accepted KUFO carrier proof produced by the currently registered KSHIP converter.

## 3. Mint authorization

KSHIP has no owner mint and no arbitrary admin mint.

The mint path is:

1. Current KSHIPConverter calls KUFO burnForCarrier.
2. KUFO verifies the converter against KAIOS Organ Registry.
3. KUFO consumes only matured claimable KUFO under the Three-Autumn schedule.
4. KUFO records a carrier proof containing owner, beneficiary, converter, kufoBurned and expectedKship.
5. KSHIP reads that record.
6. KSHIP requires the caller to be the current registered KSHIP converter.
7. KSHIP verifies expectedKship == kufoBurned * 1000.
8. KSHIP marks the proof as used and mints to the recorded beneficiary.

## 4. Replay and beneficiary binding

Each carrier proof may be minted only once.

The proof includes the beneficiary through the KUFO carrier record. KSHIP does not accept an arbitrary caller-selected recipient after the fact. The KSHIPConverter also compares the KUFO expected amount and KSHIP returned amount before completing the conversion transaction.

## 5. Supply

MAX_SUPPLY = 72,000,000,000,000,000 KSHIP.

This ceiling corresponds to the current modeled KAIOS -> KUFO -> KSHIP civilization lineage and does not grant discretionary mint authority.

## 6. Conservation

KSHIP tracks totalMintedFromKufo and totalSupply.

KSHIP exposes the cumulative conservation condition:

totalSupply + totalConsumedForMassEnergy == totalMintedFromKufo

K108000 additionally requires equal positive-matter and KSHIP input and exact allocation across propulsion, recoverable energy, KGOD mass-equivalent, and radiation/heat.

## 7. Non-upgradeable core

KSHIP is intended as a non-upgradeable core material token.

It has no UUPS, Transparent Proxy, upgradeTo or upgradeToAndCall entry point. Future changes should be expressed as a separately deployed new version and explicit registry / product-line transition, not a silent replacement of already deployed KSHIP bytecode.

## 8. Administrative and risk surface

KSHIP has:

- no owner mint
- no admin mint
- no blacklist
- no seizure path
- no native transfer tax
- no half-life in Product_05
- no proxy upgrade path

The only privileged mint actor is the current KSHIPConverter resolved through the Organ Registry, and that actor still cannot mint without a valid KUFO burn record.

## 9. Downstream boundary

KSHIP is designated for later Product_06 use:

K511111 KUFO -> K108000 KSHIP -> K108000 reaction -> K168888 KGOD.

KGOD remains a deployment candidate until a separately authorized deployment binds it to the exact K108000 reactor. Marriage, KDNA and KRNA logic remain outside this lineage.

## 10. Verification requirements

Before deployment, GM review must verify:

- exact 1:1000 KUFO/KSHIP relation
- proof replay rejection
- converter authorization
- beneficiary binding
- KUFO maturity enforcement
- KUFO and KSHIP conservation invariants
- no unauthorized mint path
- no hidden upgrade path
- exact-head Solidity compile and EVM behavioral tests

## 11. Deployment-ready dependency order

The candidate constructor graph is machine-tested locally in this order. The live KAIOS token's immutable `ORGAN_REGISTRY()` is an external dependency and must be reused; deploying a second registry would create an unusable split lineage.

1. Read and verify `KAIOS.ORGAN_REGISTRY()` on the intended chain; verify registry bytecode, owner, pending owner, bootstrap state, minimum delay and existing bindings.
2. `KUFO(registry)`.
3. `KAIOSAlchemyFurnace(kaios, kgen, registry)` and `KUFOClaimWormhole(furnace, kufo)` for K18911 -> K511111.
4. `KSHIP(registry, kufo)` and `KSHIPConverter(kufo, kship)` at K108000.
5. `KAIOSShipIdentityRegistry(registrar)`.
6. `KGENWhiteHoleBurnReplayRegistry(registry)`.
7. `KGENWhiteHoleBurnVerifier(kgen, replayRegistry, attestorA, attestorB, scaleNumerator, scaleDenominator)`.
8. `KGENWhiteHoleMatterSource(verifier, shipRegistry)`.
9. `K108000MassEnergyReactor(kship, registry, shipRegistry)`.
10. `KGOD(reactor)` at K168888.
11. Propose the exact furnace, wormhole, converter, verifier, matter source, reactor and KGOD bindings in the reused registry. If bootstrap is closed, wait the on-chain minimum delay and execute each binding only under a separate exact authorization. Register the intended SHIP_ID/controller tuple only under its separately verified authority.

Every constructor rejects a zero dependency. Deployment is not complete until each receipt has status `1`, deployed bytecode is non-empty, constructor arguments are independently reproduced, the live KAIOS token points to the reused registry, organ keys resolve to the intended contracts, and the deployed version constants match this cumulative specification.

## 12. Deployment boundary

This whitepaper describes a repository candidate only. It does not assert Mainnet deployment, activation, registry mutation, signer use, token movement or governance approval.

No KSHIP, K108000 reactor or KGOD Mainnet contract address exists in this repository candidate yet. An address may be published only after the separately authorized deployment transaction is mined and verified.

Required flow:

玄曜 Product Engineering -> exact-head CI / EVM tests -> Codex/衡曜 GM independent review -> human-authorized deployment process.
