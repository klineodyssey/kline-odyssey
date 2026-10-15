# KGEN / KAIOS Multiverse Scale & Planck Boundary Runtime — CURRENT

STATUS: REVIEW CANDIDATE FOR CURRENT MERGE  
DATE: 2026-08-09 (UTC+8)  
SCOPE: KGEN → KAIOS → KUFO → KSHIP lineage, Life composition naming, wave/photon axis, Planck boundary, conservation laws, market-pair separation

## Metadata

| Field | Value |
|---|---|
| VERSION | CURRENT |
| REVISION | 2026-10-16.KRNA_KMOLE_NG.1 |
| LAST_UPDATED | 2026-10-16 (Asia/Taipei) |
| UPDATED_BY | Codex — this Human-authorized documentation task; no company identity binding asserted |
| REVIEWED_BY | Codex technical QA and read-only peer review in this task (not a company identity/cryptographic attestation) |
| SOURCE_COMMIT | d0c0425c00dba63854cca34cbbfc642dc86923a8 (main base) |
| TASK_ID | ISSUE-599-KRNA-KMOLE-NG |
| CHANGE_REASON | Cumulatively preserve Human's KRNA/KMOLE ratio, aliases and NG dark-layer semantics in the existing scale entry. |
| ANCESTOR | This same file at 5c834a65; original 2026-08-09 body retained. |
| SOURCE_OF_TRUTH | This CURRENT scale-document entry; §7.2.1 records Human-defined civilization rules, not deployed conversion or experimentally validated physics. |
| TEXT_SIGNATURE | Codex｜#599 文件維護；cryptographic signature NOT_VERIFIED |

The inherited review-candidate status above is preserved for the original model. This revision records the explicitly directed definitions in §7.2.1 only; it does not promote other candidate laws or implementations.

## 0. Purpose

This document reconciles the KGEN/KAIOS discussions from 2026-08-06 through 2026-08-09 into one reviewable model. It separates **project canon** from **modern-physics reference facts** so fictional/runtime rules are never presented as experimentally established cosmology.

The cumulative 2026-10-16 revision also preserves Human's subsequent KRNA/KMOLE/KATOM civilization definitions and their unresolved boundaries, with sources and history below.

## 1. Canonical project laws

### 1.1 Conservation

The K universe runtime SHALL track at least mass/energy conservation accounting, linear momentum conservation where applicable, angular momentum conservation where applicable, information/provenance continuity for transformations, and non-replay of transformation proofs.

`E = mc^2` is used as the mass-energy accounting bridge. A token conversion changes accounting scale/name; it does not create physical mass from nothing.

### 1.2 Parent-universe and child-universe separation

KGEN is the parent/genesis mass asset. KAIOS is first-generation universe matter created only from objectively observable KGEN supply destruction under the Friction Mirror rule.

A child-universe transformation MUST be voluntary at the holder level. Normal transfer, buy, and sell operations MUST NOT trigger automatic child-universe burning.

### 1.3 Native tax

Candidate law for KAIOS, KUFO, and KSHIP: transfer tax = 0%, buy tax = 0%, sell tax = 0%, automatic burn tax = 0%. Application/service fees may exist outside the token core, but they are not native token taxes.

## 2. Mass-accounting lineage

| Asset | Accounting mass per token | Parent conversion |
|---|---:|---:|
| KGEN | 1 metric ton = 1,000 kg | genesis parent |
| KAIOS | 1 kg | 1 KGEN burned → 1,000 KAIOS |
| KUFO | 1 g | 1 KAIOS voluntarily burned → 1,000 KUFO |
| KSHIP | 1 mg | 1 KUFO voluntarily burned → 1,000 KSHIP |

Therefore:

`1 KGEN = 1,000 KAIOS = 1,000,000 KUFO = 1,000,000,000 KSHIP`

The number of units increases by 1,000 at each scale transition while modeled total mass remains unchanged.

## 3. KAIOS genesis and points

- Point 36000: first-generation KGEN → KAIOS white-hole transformation concept.
- Point 33333: KAIOS deployment point / 金銀島 identity.
- Point 18888: first-generation KAIOS receiving treasury / 靈霄寶殿.
- Point 18911: 太上老君鍊丹爐, holder-authorized KAIOS alchemy burn.
- Point 511111: 齊天大聖宮 / wormhole / matured KUFO claim.

KAIOS genesis supply starts at zero. KAIOS does not mint because an administrator says a burn happened. The preferred Friction Mirror model observes canonical KGEN `totalSupply()` reduction and settles only the previously-unsettled destruction delta.

## 4. 18911 → 511111 KUFO flow

`holder approves 18911`
→ `18911 invokes real KAIOS burn`
→ `beneficiary + LifeID + provenance are frozen into proof`
→ `49 Alchemy Epoch maturation`
→ `511111 validates matured, unclaimed proof`
→ `KUFO mints to the proof beneficiary`

Candidate runtime parameter: 1 Alchemy Epoch = 1 hour, therefore 49 epochs = 49 hours. The **49-epoch count belongs to the furnace/runtime**, not the KAIOS monetary core. The duration must remain explicitly configurable/reviewable unless later elevated to immutable canon.

No claimant may redirect a matured proof to another beneficiary.

## 5. KUFO → KSHIP flow

`KUFO holder approves official KSHIP converter`
→ `real KUFO burn`
→ `unique ShipGenesisProof`
→ `1 KUFO burned = 1,000 KSHIP minted`
→ `KSHIP goes to the beneficiary fixed at conversion time`

KSHIP is the milligram-scale carrier genesis accounting unit. The "neutrino-like interaction mode" is a future ship/physics runtime property, not an ERC-20 property.

## 6. Market pairs are external market infrastructure

Token existence is independent of DEX liquidity. Deployment of KAIOS/KUFO/KSHIP does NOT require a PancakeSwap pair and does NOT by itself create a pair. A token with no pair is simply not publicly AMM-tradable through that route; absence of a pair is not itself a honeypot.

Pairs may be created later, for example KAIOS/WBNB, KAIOS/stablecoin, KUFO/KAIOS, and KSHIP/KUFO.

Conversion law and market price are different concepts. `1 KAIOS burn → 1,000 KUFO` is not a promise that a DEX will always quote `1 KAIOS = 1,000 KUFO`.

Official market addresses should be registered outside the token core so token contracts do not need pair-detection logic.

## 7. Life taxonomy and composition MUST be separated

### 7.1 Taxonomy axis

`Domain → Kingdom → Phylum → Class → Order → Family → Genus → Species → LifeID`

Species answers "what kind of life is this?". LifeID identifies an individual instance.

### 7.2 Composition axis

For the K digital-life model, the project may define:

`KLIFE → KCELL → KORGAN → KMOLECULE → KATOM → KPARTICLE → KQUANTUM`

- KLIFE = complete individual digital/cosmic life.
- KCELL = autonomous cell-city/runtime container.
- KORGAN = smaller functional organ/module inside a KCELL.
- KMOLECULE = molecular/material information layer.
- KATOM = element/atom layer.
- KPARTICLE = particle layer.
- KQUANTUM = general quantum-state/information layer.

Project-specific KORGAN deliberately broadens ordinary biological terminology. In modern biology, mitochondria are organelles, not macroscopic organs. In K runtime language, a mitochondrion-like power module may be named `KORGAN-Power` / 發電廠器官 for modularity and transplantability.

### 7.2.1 KRNA → KMOLE and the NG dark layer (Human definition, 2026-10-16)

Sources: Human 笑齊天's definitions recorded by 觀衍｜Guanyan in [#599 V0.1](https://github.com/klineodyssey/kline-odyssey/issues/599#issuecomment-6200950668) and [#599 V0.2](https://github.com/klineodyssey/kline-odyssey/issues/599#issuecomment-6201182073); [main-document handoff in #584](https://github.com/klineodyssey/kline-odyssey/issues/584#issuecomment-6201332335). These are definition/provenance sources, not proof of implementation or recipient ACK.

Human's source text is preserved verbatim, including the undefined `$` symbol:

```text
1KRNA=1000KMOLE(KMOLECULE)(molecule)
1KRNA=1000KMOLE後面是科技黑暗文明，所以還沒定義，直接將他定義黑暗文明1KMOLE=NG(no go無法偵測)$1000KATOM
```

| Item | Current civilization definition | Boundary |
|---|---|---|
| KMOLE / KMOLECULE | Two names for the same custom unit; English sense: molecule; 中文：分子。 | No second unit, coin or asset is created. KMOLE is not SI mol or kmol. |
| Known custom ratio | `1 KRNA = 1000 KMOLE`; inverse `1 KMOLE = 0.001 KRNA`. | Exact custom-unit ratio only; neither an absolute kilogram baseline nor an executable asset conversion. |
| Conceptual ordering | `KRNA → KMOLE (KMOLECULE) → KATOM`. | Extends the named composition layers; does not impose a ratio between KORGAN, KDNA, KSHIP or any other unspecified layer and KRNA. |
| Dark layer | KMOLE below toward KATOM is named **科技黑暗文明**. | A KGEN civilization design name, not a claim of observed dark matter or a new physical particle. |
| NG | `no go／目前無法偵測`. | Not zero, death, absence of data or permission to delete records. |
| Nominal design relation | `1 KMOLE : 1000 KATOM`, retained with NG. | Reserved design association only; not a validated mass conversion or a usable continuation of the known-ratio ladder. |
| Raw symbol | `$` | Meaning `NOT_DEFINED`; do not interpret as dollars, price, multiplication or another executable operator. |
| Absolute mass | KRNA, KMOLE/KMOLECULE and KATOM kilograms are `UNKNOWN`. | Do not substitute 0 or the unapproved `KATOM = 1 u` candidate. |

If a later approved baseline defines `1 KRNA = M kg`, the known ratio would imply `1 KMOLE = M/1000 kg`. This conditional statement supplies no value for M. No kilogram value can be derived for KATOM from the nominal NG relation; in particular, a validated `1 KRNA = 1000000 KATOM` must not be inferred.

The following semantic record applies only to this new custom-scale/dark-layer addition. It is documentation, not a runtime configuration or an activation of the token paths in §§2–5:

```text
KNOWN_CUSTOM_RATIO = 1 KRNA : 1000 KMOLE
INVERSE_CUSTOM_RATIO = 1 KMOLE : 0.001 KRNA
UNIT_ALIAS = KMOLECULE -> KMOLE
DARK_LAYER = KMOLE -> KATOM
DARK_LAYER_NAME = 科技黑暗文明
NOMINAL_DESIGN_RELATION = 1 KMOLE : 1000 KATOM
DETECTION_STATUS = NG
RAW_SYMBOL = $
RAW_SYMBOL_OPERATOR_MEANING = NOT_DEFINED
KRNA_MASS_KG = UNKNOWN
KMOLE_MASS_KG = UNKNOWN
KATOM_MASS_KG = UNKNOWN
VALIDATED_MASS_KG = UNKNOWN
EXECUTABLE_CONVERSION = NOT_ENABLED
```

Implementations consuming this record must keep known ratios separate from nominal NG relations, preserve unknown values as unknown, and reject arithmetic or pricing that crosses the NG boundary. Alias normalization must not create duplicate balances. This revision defines no half-life, decay products, energy yield, genetic replication, detection method, time rate, trading price, mint/burn or asset movement. Any future resolution requires a new versioned definition and evidence while retaining the original source.

### 7.3 Software mirror

Recommended software mapping:

- LifeID = running life instance.
- KCELL Runtime = cell container.
- KORGAN = replaceable module/contract/file group.
- function = organ operation.
- parameters/components = protein-like controls.
- Core Spec = DNA-like canonical specification.
- Runtime Config = RNA-like operational instructions.
- GitHub = gene bank.
- commit = mutation record.
- branch = evolutionary branch.
- release = species/generation publication event.

This supersedes any simplistic ordering that treats `Function = Cell` as the only possible runtime mapping.

## 8. Distance scale must NOT be confused with mass scale

The SI mass lineage above is canonical accounting. It does not imply that each named life layer has a physical size exactly 1/1000 of the previous layer.

If the project separately uses `1 K index = 22.2 km` as a coordinate mapping, that is a **K-distance coordinate scale**, not the biological size of a KLIFE/KCELL/KORGAN object.

Mass scale, coordinate scale, taxonomy, and composition are separate axes and may be cross-referenced only through explicit conversion functions.

## 9. Wave / photon axis

KWAVE should be defined as a wave/field state axis, not "the smallest light object".

Recommended names:

- KWAVE = electromagnetic/wave state layer.
- KPHOTON = individual photon/quantum-of-light event layer.
- KQUANTUM = broader quantum state/information layer.

For light in vacuum: `c = f λ`. Photon energy: `E = h f = h c / λ`.

Photons have zero rest mass. Therefore KWAVE/KPHOTON must not be forced into the same `/1000 mass-token ladder` used by KGEN/KAIOS/KUFO/KSHIP.

## 10. KPLANCK boundary

KPLANCK is recommended as a **spacetime-resolution / quantum-gravity boundary concept**, not a smallest material particle.

Modern-physics reference values:

- Planck length ≈ `1.616255 × 10^-35 m`.
- Planck time ≈ `5.391247 × 10^-44 s`.
- Planck mass ≈ `2.176434 × 10^-8 kg` ≈ `21.76 μg`.
- Planck temperature ≈ `1.416784 × 10^32 K`.
- Planck density ≈ `5.155 × 10^96 kg/m^3`.
- Planck pressure scale ≈ `4.6 × 10^113 Pa`.

These are natural scales constructed from `c`, `G`, `ħ`, and `k_B`. Modern physics has NOT experimentally established that Planck length is literally a discrete pixel of space, or that a "KPLANCK particle" was the smallest matter unit at the Big Bang.

Safe project definition:

`KPLANCK = boundary where ordinary spacetime/particle descriptions are no longer assumed sufficient and quantum-gravity treatment is required.`

## 11. Multiverse constants

If a future K multiverse runtime permits each child universe to define its own constants, Planck scales follow from those constants. For example:

`l_P = sqrt(ħ G / c^3)`

`T_P = sqrt(ħ c^5 / (G k_B^2))`

Therefore, if `c`, `G`, or `ħ` differ between modeled universes, their Planck length/time/temperature will also differ. This is a project-model possibility, not a claim that real universes with different constants have been observed.

## 12. Conservation and provenance requirements for code

Every transformation path SHALL include: source asset and amount; real on-chain burn/destruction evidence; unique proof ID; beneficiary fixed before or at destruction; conversion ratio; source and destination scale units; block/time provenance; replay protection; conservation invariant; and no discretionary mint path.

For cross-layer transforms, if angular momentum or other physical state is part of the simulation, it must be carried in an explicit state/proof object rather than inferred from ERC-20 balances.

## 13. Implementation governance

Monetary law should be difficult to mutate; organ addresses should remain replaceable under controlled governance.

Preferred architecture:

`Token immutable laws → KAIOSOrganRegistry → current 18911 / 511111 / KSHIP converter organs`

This avoids permanently welding replaceable organs into token bytecode. CREATE2 may still be used for deterministic deployment addresses, but should not be the only upgrade strategy.

## 14. Current review blockers

Before mainnet deployment:

- reconcile current `KAIOS.sol` immutable 18911 wiring with Organ Registry architecture;
- compile all KAIOS/KUFO/KSHIP contracts against pinned OpenZeppelin versions;
- remove all obsolete `1 KGEN = 10,000 KAIOS` assumptions;
- remove legacy BurnProofGenesis interfaces that no longer match Friction Mirror KAIOS;
- test exact 1:1000 conversions at 18-decimal ERC-20 precision;
- fuzz replay protection and allowance-limited burns;
- test conservation invariants through multi-step burns;
- test beneficiary non-redirection;
- test Pair Registry as metadata only (no false claim that it can freeze a DEX);
- audit upgrade/registry governance and emergency procedures;
- independent security audit before mainnet.

## 15. Cumulative revision history

### 2026-10-16.KRNA_KMOLE_NG.1 — ISSUE-599-KRNA-KMOLE-NG

- Actor / text signature: Codex｜#599 文件維護 (this task); original Human definitions and recorder attribution are retained in §7.2.1. Cryptographic signature: NOT_VERIFIED.
- Date / time source: 2026-10-16T06:42:50+08:00 / 2026-10-15T22:42:50Z; execution-environment UTC clock, converted to Asia/Taipei. Git commit time records publication separately and is not recipient ACK.
- Review: Codex technical QA plus read-only peer review in this task passed; exact candidate-head CI is recorded in the associated PR.
- Local validation: 22/22 documentation checks passed, including six exact rational forward/inverse quantity vectors (0, 1, 0.001, 0.000000000000000001, 0.123456789123456789, 1000000000000000000.999999999999999999), alias/source/NG boundaries and additive compatibility. Existing CURRENT lineage verifier passed with its report unchanged; Physics CURRENT and V3.8 remained byte-identical. These checks validate the documented relation, not an implemented converter.
- File: `docs/physics/KGEN_KAIOS_SCALE_AND_PLANCK_RUNTIME_CURRENT.md`; cumulative edit of the existing CURRENT entry, no parallel scale system.
- Reason: bring the #599 ratio, aliases, raw source and NG semantics into the versioned main-document workflow rather than leaving them only in Issue comments.
- Compatibility: original body and §§2–5 mass/conversion definitions preserved; KGEN = 1000 kg, KAIOS = 1 kg, KUFO = 1 g and KSHIP = 1 mg are unchanged. Physics CURRENT §235 already delegates scale interpretation to this entry; Physics CURRENT and its V3.8 counterpart require no change. No runtime, contract, deployment, approval, asset operation or migration is introduced.
- Overlap: Draft #158 proposes alchemy/KUFO changes to §§1–5; this revision does not adopt, overwrite or merge that candidate. Its future integration must preserve this cumulative §7.2.1 addition.
- Rollback: revert only this documentation commit through the normal review workflow; preserve source and revision history.
