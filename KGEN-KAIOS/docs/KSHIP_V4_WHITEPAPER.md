# KSHIP V4 Whitepaper

Status: DRAFT PRODUCT CANDIDATE
Version: 4.0.0-compatible lineage
Solidity: 0.8.24
Upgradeable: NO
Mainnet status: NOT DEPLOYED / NOT LIVE
Primary lineage: KUFO -> KSHIP -> K108000 -> KGOD

## 1. Purpose

KSHIP is the stable carrier material produced from terminally decaying KUFO. It is the downstream material used by the K108000 propulsion / transformation lineage.

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

Because Product_05 defines no native KSHIP burn or decay, the token exposes the conservation condition:

totalSupply == totalMintedFromKufo

Downstream consumption through K108000 is outside Product_05 and must be introduced only in the later Product_06 lineage with its own explicit conservation accounting.

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

KSHIP -> K108000 -> KGOD.

Product_05 does not activate KGOD, marriage, KDNA or KRNA logic.

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

## 11. Deployment boundary

This whitepaper describes a repository candidate only. It does not assert Mainnet deployment, activation, registry mutation, signer use, token movement or governance approval.

Required flow:

玄曜 Product Engineering -> exact-head CI / EVM tests -> Codex/衡曜 GM independent review -> human-authorized deployment process.
