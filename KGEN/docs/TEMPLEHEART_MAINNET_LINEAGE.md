# TempleHeart Mainnet Lineage and V3.4 New-Proxy Deployment Plan

Status: `MAINNET_DEPLOYMENT_PREPARATION_STOPPED / KAIOS_CANON_RECONCILIATION`

> **DEPLOYMENT PACKAGE SUSPENDED:** Human Final Canon 2026-08-09 supersedes the
> receive-only 18888 runtime and every pre-reconciliation bytecode hash, gas
> estimate, calldata package, and deployment-ready conclusion in this document.
> Current monetary and point identity law is
> `KGEN-KAIOS/KAIOS_FrictionMirror_Multiverse_README.md`. No section below
> authorizes or prepares a Mainnet transaction until the reconciliation report,
> compile, tests, and a later Human approval reopen deployment work.

Source baseline: main merge commit `c7e8c533c5bbc598fac3192e0576bacb55fb6a31`.

This document authorizes planning and local simulation only. It does not authorize a BSC Mainnet transaction, a production frontend change, or KGEN funding.

## 1. Canonical lineage

### V3.2.6 Legacy Heart

| Field | Canonical value |
|---|---|
| Classification | `LEGACY_TEMPLEHEART_V3_2_6` |
| Address | `0xB016D4d8f1aED1339101b30722cad6dbA9B8C972` |
| Deployment type | Direct deployment; not ERC1967 and not UUPS |
| Runtime identity | Exact non-metadata bytecode match to `KGEN_TempleHeart_V3_2_6` compiled with Solidity 0.8.24, optimizer 200, Paris EVM |
| EIP-1967 implementation slot | Zero |
| Current KGEN balance at audit | 138 KGEN |
| Lifecycle | Immutable historical life; retain chain history and records |

The Legacy Heart must not be upgraded, delegatecall-migrated, storage-hacked, self-destructed, force-drained, or funded with new KGEN. Its 138 KGEN remains untouched unless a later Human decision explicitly changes that instruction.

### V3.4 Canonical Heart

V3.4 begins a separate life:

```text
NEW KGEN_TempleHeart_Upgradeable implementation
                    ↓
NEW ERC1967/UUPS proxy = canonical TempleHeart from V3.4 onward
```

The implementation and proxy addresses remain `TBD_NOT_DEPLOYED`. They must never be replaced in documentation with the Legacy Heart address. All future V3.4+ upgrades preserve the new proxy address.

## 2. Fixed Mainnet dependencies

| Dependency | Value | Pre-deploy requirement |
|---|---|---|
| Chain | BNB Smart Chain Mainnet, chainId 56 | RPC must return exactly 56 |
| KGEN | `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be` | Code exists; decimals must equal 18 |
| Formal 11520 Brain / Exchange Treasury | `0xd0605F4EF10e5C1438F11AF9edc36926769239d6` | Code exists |
| Organ ID | `0xb6239b4afc2d679ad5bde98a6ce58d89562381b4d0d2eb1d1fc7f89ebbe72c07` | `keccak256("KAIOS.ORGAN.EXCHANGE_TREASURY.11520")` |
| Formal KAIOS Alchemy Proof Source | `NOT_DEPLOYED` | The required ABI is implemented by the current `KAIOS.sol` token core, not by `KAIOSAlchemyFurnace.sol` |

No formal KAIOS Alchemy Proof Source address is present in the merged repository or the reviewed closed/merged PR history. PR #129 and its closeout evidence explicitly state that no Mainnet or testnet deployment was performed. BscScan verified-contract name/selector searches returned no candidate, and none of the live contracts created by the recovered project deployer contains selector `0x59c6d740` for `alchemyBurnRecord(bytes32)`.

The executable source-of-truth relationship is:

```text
KAIOS.sol
  -> stores immutable AlchemyBurnRecord entries
  -> exposes alchemyBurnRecord(bytes32)

KAIOSAlchemyFurnace.sol (18911)
  -> calls KAIOS.burnForAlchemy(...)
  -> is recorded as the furnace/origin in the KAIOS record
```

`KAIOSAlchemyFurnace.sol` itself exposes `proof(bytes32)`, not the ABI required by TempleHeart. The Heart must therefore receive the deployed Mainnet KAIOS token address as its proof-source initializer parameter. No such Mainnet KAIOS address is currently evidenced. Mainnet Heart deployment remains blocked.

## 2.1 Mainnet canon recovery evidence

Read-only BSC Mainnet checks used chainId 56. No transaction was signed or broadcast.

| Item | Recovered value | Status | Evidence |
|---|---|---|---|
| Formal KGEN | `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be` | `VERIFIED` | Code exists; BscScan exact-match verified `KGEN_Token_V7_5_2`; live owner and token wallet getters decoded |
| Formal 11520 Brain / Exchange Treasury | `0xd0605F4EF10e5C1438F11AF9edc36926769239d6` | `VERIFIED` | Code exists; live `kgen()` returns formal KGEN; live owner decoded; Legacy Heart `brainVault()` points here |
| Formal KAIOS Alchemy Proof Source | `NOT_DEPLOYED` | `NOT_DEPLOYED` | Current proof ABI belongs to `KAIOS.sol`; repo, PR #127-#129 history and deployment closeout contain no production address; known deployer bytecode census contains no selector |
| Formal KAIOSOrganRegistry | `NOT_DEPLOYED` | `NOT_DEPLOYED` | Repo explicitly contains no deployment script/Mainnet address; known deployer bytecode census contains no `organ(bytes32)` selector |
| Existing governance owner | `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9` | `VERIFIED` | Live owner of both Legacy Heart and formal 11520 Brain; EOA with no code |
| KGEN owner / recovered deployer | `0xb3C54ca96De0dED4Ca0151F629ff9781506ba261` | `VERIFIED` | Live KGEN owner; CREATE nonce 1 = KGEN, nonce 23 = 11520 Brain, nonce 25 = Legacy Heart; EOA with no code |
| Formal multisig/timelock | `NOT_FOUND` | `NOT_FOUND` | No address-bound Safe, multisig or timelock deployment evidence in repo/history; both recovered authority addresses are EOAs |
| Governance policy delay | `TECHNICAL_MINIMUM_DELAY = 3600` | `HUMAN_CANON` | Human selected the Registry contract's one-hour technical minimum for the first deployment; a longer future policy remains possible |

## 2.2 Human-approved initial governance canon

| Authority | Initial Mainnet address | Status |
|---|---|---|
| Registry owner | `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9` | `HUMAN_CANON` |
| TempleHeart `DEFAULT_ADMIN_ROLE` | `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9` | `HUMAN_CANON` |
| TempleHeart `UPGRADER_ROLE` | `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9` | `HUMAN_CANON` |
| TempleHeart `OPERATOR_ROLE` | `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9` | `HUMAN_CANON` |
| TempleHeart `HOLY_CUP_SIGNER_ROLE` | `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9` | `TEMPORARY_GOVERNANCE_HOLY_CUP_SIGNER` |
| Deployment signer candidate | `0xb3C54ca96De0dED4Ca0151F629ff9781506ba261` | `HUMAN_PRELIMINARY_APPROVAL_FOR_PACKAGE_ONLY` |
| Registry delay | `3600 seconds` | `TECHNICAL_MINIMUM_DELAY` |

The three initial Heart roles are deliberately concentrated for continuity with the live Legacy Heart and 11520 owner. They remain ordinary AccessControl roles: a later admin can `grantRole` and `revokeRole`; the addresses are not immutable.

The temporary Holy Cup assignment does not activate a production proof backend. The production frontend Holy Cup on-chain write path remains disabled and labelled backend-pending. After a dedicated production signer exists, governance must grant it `HOLY_CUP_SIGNER_ROLE`, verify successful and unauthorized proof paths, and only then revoke the temporary governance signer.

The deployment signer is approved only for nonce, address, gas and calldata simulation. Before any transaction, Human must reconfirm control and sufficient BNB. The BSC Testnet QA wallet is permanently excluded from Mainnet.

Read-only package snapshot at BSC Mainnet block `114926410`: the deployment-signer candidate is an EOA (`code.length == 0`) with nonce `34` and balance `0.00556736894145793 BNB`. This proves neither current Human control nor future funding sufficiency. Nonce, balance, gas price and all CREATE address predictions must be refreshed immediately before signing; no predicted address from this snapshot is canonical.

## 2.3 Formal 18888 Bank lineage and settlement architecture

### Repository and chain evidence

Human canon preserves three generations of banking life. The first two are historical lineage, not mistakes and not the current KAIOS settlement organ. The current evolution is implemented as one new version-free UUPS contract whose V2 runtime is deliberately minimal.

| Candidate | Evidence | Result |
|---|---|---|
| `KGEN_GalacticBank_V7_5_2.sol` | KGEN Universe BigBang/Genesis Galactic Bank, produced and deployed during the Genesis system | `GENESIS_GALACTIC_BANK / HISTORICAL_LEGACY_ORGAN`: preserve its formal Genesis life and chain history; it was not operated as the current 18888 organ, no current management path is assumed, and it must not be hard-wired into the KAIOS white-hole system |
| Mainnet `0xfc522243e988a837700CaD600D6f030f5932681F` | Historical deployed Galactic Bank evidence; chainId 56 code exists and `owner()` reports the historical governance address | `HISTORICAL_ONLY`: not deleted or denied, but insufficient Canon/control/interface evidence to designate it as current formal 18888 |
| `KGEN_LingxiaoDeityBank_V1_0_1.sol` | First-generation 18888 Lingxiao Bank design whose original economic organ purpose included receiving the KGEN Bank 0.10% flow | `LINGXIAO_BANK_GENERATION_1 / SUPERSEDED_IMPLEMENTATION`: preserve lineage and future-policy context; do not deploy its old bytecode because current Solidity 0.8.24 compilation fails and its runtime/architecture does not satisfy current requirements |
| `LingxiaoCelestialBank18888_Upgradeable.sol` | Current Bank evolution for KAIOS white-hole energy settlement, with one stable ERC1967/UUPS proxy lineage | `CURRENT_18888_BANK / V2_POLICY_GATED_RUNTIME`: lawful outflow requires distinct proposal/approval, technical delay and beneficiary claim; Mainnet not deployed |
| `KAIOSEventHorizonVaultV01.sol` | Review-only KAIOS sink with deliberately no withdrawal, release, rescue or upgrade path | `REJECTED`: irreversible event-horizon experiment, not a governed settlement reserve |
| `KGEN_8888_Treasury_V1_0_0.sol` | KGEN-only owner withdrawal vault for species 8888 | `REJECTED`: wrong species, token and purpose |
| `CelestialReserveBank18888` / `CelestialTaxVault18888` | Names occur only in constitutional/whitepaper future-package sections | `NOT_IMPLEMENTED` |

The lineage is therefore `Genesis Galactic Bank -> Lingxiao Bank Generation 1 -> current 18888 UUPS Bank`. The new implementation does not cancel the possible future return of the KGEN Bank 0.10% role; that remains `FUTURE_GOVERNANCE_EVOLUTION` and is not activated in V2.

### Exact requirement imposed by `KAIOS.sol`

`KAIOS` accepts `treasury18888` as a nonzero constructor address and stores it in immutable `LINGXIAO_TREASURY_18888`. The constructor does **not** require code at that address. `settleWhiteHoleMass()` uses the standard ERC20 `_mint` path directly to that immutable address.

Therefore KAIOS requires only a stable recipient address. It does not call a receiver callback, treasury accounting interface, approval hook, deposit function, bank API or withdrawal API. The Treasury needs no callback for settlement to succeed. This technical minimum must not be mistaken for permission to use an EOA.

### Implemented minimal V2 architecture

```text
LingxiaoCelestialBank18888_Upgradeable implementation
                  -> ERC1967/UUPS proxy = FORMAL_18888_LINGXIAO_BANK
                                               ^
                                               |
KAIOS.LINGXIAO_TREASURY_18888 -----------------+
```

The current Bank identity and its first UUPS runtime are intentionally distinct: identity is the evolving 18888 Lingxiao Celestial Bank; V2 receives settlement and supports only reviewed, delayed, beneficiary-claimed lawful payments.

- stable ERC1967/UUPS proxy address because KAIOS permanently stores the 18888 address;
- initializer with nonzero admin/upgrader and formal KGEN contract lineage;
- one-time post-KAIOS `bindKAIOS(address)` that requires contract code and verifies KAIOS `KGEN()` equals formal KGEN and `LINGXIAO_TREASURY_18888()` equals the proxy;
- read-only canonical token and balance getters plus explicit lineage events;
- UUPS authorization restricted to `UPGRADER_ROLE`;
- no user deposit function, no `transferFrom`, no allowance, no blacklist, no freeze, no clawback and no operation over player wallets;
- no owner withdrawal, sweep, rescue, bridge, lending, arbitrary dividend, credit or tax-routing function in V2;
- lawful salary/civilization outflow requires `PAYMENT_PROPOSER_ROLE`, a different `PAYMENT_APPROVER_ROLE`, a one-hour delay, fixed beneficiary/amount/purpose hash, and beneficiary claim;
- reject native BNB and omit arbitrary fallback execution;
- direct ERC20 transfers and KAIOS `_mint` still credit the proxy balance without a receiver callback.

This policy-gated boundary keeps payment calculation and 500-seat identity outside the Bank while preventing a direct Admin withdrawal path. A future cumulative, audited implementation may evolve through the stable proxy only after Human defines and approves further bank policy. UUPS means governance can technically authorize later behavior; the precise V2 guarantee is two-party authorization plus beneficiary claim, not permanent immobility.

Initial Bank authority is the approved governance address `0xCd60...a4b9` for both admin and upgrader, with no operator role because V2 has no operational transfer. The deployment signer `0xb3C54...a261` receives no Bank role merely by deploying it.

### Address and deployment dependencies

The address relationship can be fixed only after the new Treasury bytecode is implemented, reviewed, compiled and its proxy is deployed:

| Relationship | Required value |
|---|---|
| Bank formal KGEN lineage | `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be` |
| Bank admin/upgrader | `0xCd60...a4b9` |
| KAIOS `LINGXIAO_TREASURY_18888` | New 18888 Bank proxy |
| Bank canonical KAIOS | New formal KAIOS, bound once after KAIOS deployment |
| Heart proof source | New formal KAIOS, never the Treasury or 18911 Furnace |

`KAIOS.sol` rejects an `organRegistry` address without code. The Registry must therefore exist first and may remain bootstrap-open while the Bank, KAIOS and 18911 are deployed. The executable order is:

1. deploy `KAIOSOrganRegistry(owner = 0xCd60...a4b9, minimumDelay = 3600)` with bootstrap open;
2. deploy `LingxiaoCelestialBank18888_Upgradeable` implementation;
3. deploy its ERC1967 proxy with atomic `initialize(admin, upgrader, formalKgen)`;
4. deploy formal KAIOS with formal KGEN, the new 18888 Bank proxy and the Registry;
5. verify `alchemyBurnRecord(bytes32)`, KGEN, 18888 and Registry immutable bindings;
6. call Bank `bindKAIOS(formalKaios)` once from formal admin;
7. deploy formal 18911 Furnace;
8. bootstrap formal 11520, 18888 Bank, KAIOS and 18911; wire only other organs that have verified Mainnet deployments;
9. leave absent 511111, KSHIP Converter and Pair Registry organs unset, then seal Registry bootstrap;
10. only then continue to the new TempleHeart implementation and proxy package.

No address prediction is final until the implementation is deployed, proxy creation calldata is complete and the deployment signer's immediately-before-signing nonce is refreshed. No Mainnet transaction is authorized by this package.

### 18888 V2 compiler and deployment package

| Field | Locked package value |
|---|---|
| Source | `KGEN-KAIOS/contracts/LingxiaoCelestialBank18888_Upgradeable.sol` |
| Contract identity | `LingxiaoCelestialBank18888_Upgradeable` |
| Runtime version/mode | `2.0.0` / `POLICY_GATED_SETTLEMENT_BANK` |
| Compiler/dependencies | Solidity `0.8.24`; OpenZeppelin `5.0.2` |
| Settings | optimizer enabled, runs 1; viaIR; Paris EVM; metadata bytecode hash disabled |
| Creation bytecode | 6,999 bytes; `0x2ff206ffe9d9889fe44a37694152ec440c0d4683f3096e82a140c760620e6578` |
| Runtime bytecode | 6,789 bytes; `0x0ae549222566ce1948a680ddf896c147078a1b83ee6479040b3c72138f11e6a3` |
| EIP-170 | `6,789 / 24,576` bytes, PASS |
| Own storage | slot 0 `kgen`; slot 1 `kaios` + `kaiosBound`; slot 2 disbursed total; slot 3 payment ledger; slots 4-49 reserved by `uint256[46] __gap` |
| Initial admin/upgrader | `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9` / same |
| Formal KGEN | `0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be` |

Mainnet initializer calldata is fully determined by Human canon:

```text
0xc0c53b8b000000000000000000000000cd60bf474e691f2484950a0276eaf507616ca4b9000000000000000000000000cd60bf474e691f2484950a0276eaf507616ca4b9000000000000000000000000ba3d3810e58735cb6813bc1cdc5458c0d71432be
```

Initializer calldata hash: `0xfb9b33fb9a85428eb89019afcd710994f1e9ec901ef3a5a36ba99628fb2bcc5b`.

The proxy constructor calldata remains intentionally incomplete until the implementation address exists. `bindKAIOS` calldata remains incomplete until formal KAIOS is deployed. Neither simulation address may be copied into a Mainnet command.

Local chainId 56 simulation used exact compiled bytecode and produced:

| Operation | Simulated gas |
|---|---:|
| Deploy Registry | 653,603 |
| Deploy 18888 implementation | 995,731 |
| Deploy 18888 proxy + atomic initialize | 211,662 |
| Deploy KAIOS | 1,394,116 |
| Bind KAIOS once | 60,360 |
| Bootstrap 11520 | 55,195 |
| Bootstrap 18888 | 55,183 |
| Bootstrap KAIOS | 55,183 |
| Deploy 18911 Furnace | 506,642 |
| Bootstrap 18911 | 55,195 |
| Seal Registry bootstrap | 24,817 |
| Known sequence total | 4,067,687 |
| 25% buffer | 5,084,609 |

Registry organ IDs locked by current source are:

- `KAIOS.ORGAN.EXCHANGE_TREASURY.11520` -> `0xb6239b4afc2d679ad5bde98a6ce58d89562381b4d0d2eb1d1fc7f89ebbe72c07`;
- `KAIOS.ORGAN.LINGXIAO_BANK.18888` -> `0x4e55e89e8a8411020097db80f3cbc24f56323a098f681b9a5aa679c092218ea6`;
- `KAIOS.ORGAN.KAIOS` -> `0x8192dabb5532a53075d9609e0974c572bdd26e84e22c8b6c5ae34666d715fd00`;
- `KAIOS.ORGAN.FURNACE.18911` -> `0xc7dc58355a278d2d7c66791b96331912455bb79b53dbf7c740701ddbf33de567`.

`511111`, KSHIP Converter and Pair Registry remain unset when no verified Mainnet deployment exists. V2 has no payable `receive()`/fallback because neither is needed for ERC-20 settlement. Payment roles remain unset until formal, distinct governance operators are approved.

## 3. Fresh initializer audit

The executable fresh path is:

1. Deploy the locked V3.4 implementation. Its constructor calls `_disableInitializers()`.
2. Deploy `ERC1967Proxy(implementation, initializeCalldata)`. The proxy constructor delegatecalls `initialize()` atomically.
3. From the confirmed `DEFAULT_ADMIN_ROLE`, call `initializeV340(formalOrganRegistry)` once.

`initialize()` sets the four roles, KGEN, legacy 11520 slot, KAIOS proof source, EIP-712 V3.4 domain, caps, Fortune rules, Heartbeat/Ignite rewards, 1888 gate, and both 88 caps. `initializeV340()` binds the governed Organ Registry and writes the same V3.4 EIP-712 name/version and scalar gate values.

The repeated EIP-712 write is redundant but safe: local chainId 56 simulation proved the complete domain tuple was identical before and after `initializeV340()`. The second call is role-bound and cannot be front-run by an unprivileged account because `initialize()` grants `DEFAULT_ADMIN_ROLE` during proxy construction.

Deterministic simulation verified:

- `initialize()` replay rejects;
- `initializeV340()` replay rejects;
- the skipped V2 reinitializer cannot run after V3 initialization;
- direct implementation initialization rejects;
- unauthorized UUPS upgrade rejects;
- all four roles can be assigned independently and were exercised with distinct accounts in the fresh-initializer test; Mainnet canon may initially assign them to one governance address without making them immutable;
- `fortuneGame` remains zero;
- EIP-712 domain is `KGEN TempleHeart 12345`, version `3.4.0`, chainId 56, and the new proxy address.

Conclusion: `initialize()` followed by one admin-authorized `initializeV340()` is safe for a fresh V3.4 proxy. No Heart contract change is required.

## 4. Organ Registry deployment plan

No Mainnet Organ Registry address is assumed. Before deploying the Heart:

1. Confirm chainId 56 and that deployment signer candidate `0xb3C54...a261` remains Human-controlled and funded.
2. Deploy `KAIOSOrganRegistry(0xCd60...a4b9, 3600)`.
3. Require `minimumDelay() == 3600`. This is the Human-approved first-version `TECHNICAL_MINIMUM_DELAY`; no 48-hour or 72-hour policy is inferred.
4. Call `bootstrapOrgan(ORGAN_EXCHANGE_TREASURY_11520, 0xd060...39d6)`.
5. Read `organ(ORGAN_EXCHANGE_TREASURY_11520)` and require the exact formal 11520 address.
6. Before sealing, bootstrap every production organ that actually exists: formal 11520, the new 18888 Bank proxy, formal KAIOS and formal 18911. Current Registry source declares canonical `ORGAN_LINGXIAO_BANK_18888` and `ORGAN_KAIOS` IDs. Do not seal with an invented 511111, KSHIP Converter or Pair Registry address; absent organs remain unset.
7. Call `sealBootstrap()`; require `bootstrapOpen() == false`.
8. Because the constructor owner is the formal governance address, no deployer-to-governance ownership transfer is required.
9. Require `owner() == 0xCd60...a4b9` and `pendingOwner() == address(0)`.

Known calldata:

```text
bootstrap 11520:
0xb6c50ee0b6239b4afc2d679ad5bde98a6ce58d89562381b4d0d2eb1d1fc7f89ebbe72c07000000000000000000000000d0605f4ef10e5c1438f11af9edc36926769239d6

seal bootstrap:
0xec964baa
```

Compiler-locked Registry artifact:

| Field | Value |
|---|---|
| Solidity / OpenZeppelin | `0.8.24` / `5.0.2` |
| Creation bytecode bytes / hash before constructor arguments | `2,718` / `0x94d97b2745f30aa345f4a2deff4f01e48223d5cbb9b9b9b14ff1207c3ce1bd41` |
| Runtime bytes / hash | `2,404` / `0x68b9eb4d0f3ab5f57fb9f6930902cd262c97cd61cef7dd1d941cc38c530d9372` |
| Constructor | `KAIOSOrganRegistry(initialOwner, governanceDelay)`; no initializer |
| Ownership | OpenZeppelin `Ownable2Step`; constructor owner must be nonzero |
| Delay invariant | immutable `minimumDelay`; deployment reverts below 3,600 seconds |
| Rotation | owner proposes/cancels; anyone may execute after the delay; bootstrap cannot reopen after sealing |

The post-deployment manifest must record chainId, registry address, deployed bytecode hash, deployment transaction, bootstrap transaction, seal transaction, governance handoff transactions, owner, delay, organ ID, resolved 11520, blocks, gas, and explorer links. It must not be created with invented addresses or transaction hashes.

## 5. Role and governance plan

Human has approved the following initial assignments for TempleHeart and Registry:

| Authority | Candidate | Recovery status | Control boundary |
|---|---|---|---|
| Registry owner | `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9` | `HUMAN_CANON` | Current owner of Legacy Heart and 11520 Brain; no multisig/timelock evidence |
| `DEFAULT_ADMIN_ROLE` | `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9` | `HUMAN_CANON` | Can later grant/revoke roles |
| `UPGRADER_ROLE` | `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9` | `HUMAN_CANON` | Initial concentration is intentional, not immutable |
| `OPERATOR_ROLE` | `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9` | `HUMAN_CANON` | Initial concentration is intentional, not immutable |
| `HOLY_CUP_SIGNER_ROLE` | `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9` | `TEMPORARY_GOVERNANCE_HOLY_CUP_SIGNER` | Backend remains pending and production frontend write path remains disabled |
| Deployment signer | `0xb3C54ca96De0dED4Ca0151F629ff9781506ba261` | `HUMAN_PRELIMINARY_APPROVAL_FOR_PACKAGE_ONLY` | Recovered creator of KGEN, 11520 Brain and Legacy Heart; control/funding must be reconfirmed immediately before signing |

Both recovered addresses are EOAs, not verified Safe/multisig/timelock contracts. The Registry first version uses the Human-selected technical minimum of `3600` seconds. This is a technical deployment parameter, not a claim that a 48-hour or 72-hour governance policy exists.

`initialize()` requires every role parameter, including `holyCupSigner`, to be nonzero and the initializer cannot be replayed. Human selected the governance address as the temporary nonzero signer. The unfunded Heart must remain unbound from production Holy Cup writes; after a dedicated signer exists, grant it, verify it, and revoke the temporary signer before enabling the frontend path.

No testnet QA wallet or invented signer may fill this role. Every assignment must be verified with `hasRole()` after initialization, and an unrelated address must fail each protected action through `eth_call` before funding.

## 6. New V3.4 implementation and proxy plan

Compiler package:

- Solidity `0.8.24`
- OpenZeppelin contracts and upgradeable `5.0.2`
- optimizer enabled, runs 1, viaIR, Paris EVM
- implementation creation bytecode hash: `0x7f88247184c95831dcca55945d447f7c23bbcb3028fd4920f39f2e1b58fda354`
- compiler-normalized runtime bytecode hash: `0x75d59141359a17e59ce8316ac4ae729a1e57336bb0b0b7db2d2feb576dd9d3a7`
- deployed runtime size: 23,553 bytes
- KAIOS proof-source creation/runtime hashes: `0x514fe497b01aa3d927b183ca5919561d66f427b6c3023872befa38e2f761b187` / `0xe06622fadb7e6b0cf847601bd5bbf06acbda5e1223eb07134c72cc1c7cca26f9`
- KAIOS 18911 Furnace creation/runtime hashes: `0x95735d91e2fe86488f19239795b5c7ff26c9fe278357676549d68ee1ea55c541` / `0xb7641e12e9612e871fa99886f599c29e602ba1925c68fc67666c8991b60a4258`

Deployment order:

1. Deploy and verify `KAIOSOrganRegistry(0xCd60...a4b9, 3600)` with bootstrap open.
2. Deploy and verify `LingxiaoCelestialBank18888_Upgradeable` implementation.
3. Deploy its stable ERC1967/UUPS proxy with the locked initializer calldata above.
4. Deploy and verify `KAIOS.sol` against formal KGEN, the new 18888 Bank proxy and the Registry. This deployed KAIOS address becomes the formal Heart proof source.
5. Verify `alchemyBurnRecord(bytes32)` and all immutable lineage getters, then bind KAIOS once in the 18888 Bank proxy.
6. Deploy and verify `KAIOSAlchemyFurnace` (18911) against that KAIOS and Registry.
7. Bootstrap formal 11520, 18888, KAIOS and 18911; leave undeployed 511111/KSHIP Converter/Pair Registry organs unset; then seal bootstrap.
8. Rebuild Heart artifacts from merge commit `c7e8c533...` and reproduce the hashes above.
9. Deploy one new `KGEN_TempleHeart_Upgradeable` implementation.
10. Verify the implementation bytecode and confirm direct `initialize()` rejects.
11. Encode `initialize(0xCd60...a4b9, 0xCd60...a4b9, 0xCd60...a4b9, 0xCd60...a4b9, KGEN, formal11520, formalKaiosProofSource)` where `formalKaiosProofSource` is the deployed KAIOS token, not the Furnace.
12. Deploy one new `ERC1967Proxy(implementation, initializeCalldata)`.
13. Read the proxy EIP-1967 implementation slot and require the new implementation.
14. From `DEFAULT_ADMIN_ROLE`, call `initializeV340(formalOrganRegistry)` once. Selector: `0xbc918f71`.
15. Verify the complete state below before any frontend or funding action.

The four initial Heart roles are fixed by Human canon. Exact KAIOS, Registry, 18888, Heart implementation and proxy addresses/calldata remain unavailable until the preceding deployments exist. Simulation-only addresses must never enter a Mainnet command.

## 7. Required post-deployment checks

| Check | Expected value |
|---|---|
| `version()` | `3.4.0` |
| Proxy implementation slot | New V3.4 implementation |
| `kgen()` | `0xBA3d...32Be` |
| `brainVault()` legacy slot | `0xd060...39d6` |
| `organRegistry()` | Formal new Organ Registry |
| `current11520Treasury()` | `0xd060...39d6` |
| `baseCapWhole()` | 108000 |
| `baseFloorWhole()` | 20000 |
| `gameSurvivalGateWhole()` | 1888 |
| `HEARTBEAT_REWARD_WHOLE()` | 1 |
| `heartbeatMaxClaimsPerHour()` | 88 |
| `IGNITE_REWARD_WHOLE()` | 8 |
| `igniteMaxClaimsPerDay()` | 88 |
| Fortune minimum / maximum | 1 / 8 |
| Fortune cooldown / epoch | 2592000 / 2592000 seconds |
| Fortune epoch maximum | 500 |
| `fortuneGame()` | zero until separately approved Fortune Game deployment |
| Heart KGEN balance | zero before Human funding approval |

Also verify role holders, pause state, EIP-712 domain, initializer replay rejection, unauthorized upgrade rejection, unauthorized operator rejection, ABI hash, explorer source verification, and the absence of any interaction with Legacy Heart.

## 8. Gas estimate

Local chainId 56 simulation used the exact compiled bytecode and distinct simulated governance roles. Addresses were simulation-only.

| Operation | Simulated gas |
|---|---:|
| Deploy Organ Registry | 653,603 |
| Deploy 18888 implementation | 995,731 |
| Deploy 18888 proxy + atomic initialize | 211,662 |
| Deploy KAIOS proof-source token core | 1,394,116 |
| Bind KAIOS once | 60,360 |
| Bootstrap 11520 | 55,195 |
| Bootstrap 18888 | 55,183 |
| Bootstrap KAIOS | 55,183 |
| Deploy KAIOSAlchemyFurnace (18911) | 506,642 |
| Bootstrap 18911 | 55,195 |
| Seal bootstrap | 24,817 |
| Deploy V3.4 implementation | 5,167,455 |
| Deploy ERC1967 Proxy + atomic `initialize()` | 983,137 |
| `initializeV340()` | 80,064 |
| Known full sequence total | 10,298,343 |
| 25% operational buffer | 12,872,929 |

At 0.05 gwei, the buffered known sequence is approximately 0.0006436465 BNB. Gas price, deployment-signer balance, nonce and every estimate must be refreshed immediately before signing. Contract verification and any extra initial organs remain excluded.

## 9. Emergency and rollback plan

There is no V3.3.2 or Legacy rollback target for the new proxy.

- Before frontend binding and funding: if any check fails, abandon the unfunded new proxy, publish no canonical address, and leave Legacy Heart untouched.
- After canonical activation: `OPERATOR_ROLE` pauses affected operations; governance diagnoses without moving player assets.
- A future corrective implementation must preserve the 73-slot V3.4 layout and pass compile, storage, fuzz, invariant, fork simulation, and testnet rehearsal gates.
- After the first future upgrade, the initial V3.4 implementation address becomes the rollback target only when storage compatibility with the intervening version is independently proven.
- Never roll the new proxy back to V3.2.6 or V3.3.2 and never delegatecall into the Legacy Heart.
- Registry correction uses `proposeOrgan` and the configured delay, followed by permissionless `executeOrgan`; no bootstrap reopening exists.
- Do not fund the new Heart until Registry, roles, ABI, frontend handoff, 1888, 108000, Heartbeat, Ignite, and Fortune checks all pass and Human separately approves the initial KGEN amount.

## 10. Frontend handoff

Production frontend remains unchanged during this plan phase. After Mainnet deployment and verification, provide the new proxy address to the 12345 Frontend Codex with two distinct labels:

```text
Current Canon Heart = NEW V3.4 Proxy
Legacy Heart = 0xB016D4d8f1aED1339101b30722cad6dbA9B8C972
```

All new interactions use the V3.4 proxy. Legacy information is historical and read-only.

## 11. Remaining Human decisions before Mainnet signing

- Define and approve the formal payment proposer/approver addresses before any 18888 disbursement; the KGEN Bank 0.10% role remains future governance evolution and is not activated in V2.
- Before signing, reconfirm that deployment signer candidate `0xb3C54...a261` is still Human-controlled and adequately funded.
- Authorize the staged Mainnet deployment transactions only after final bytecode, nonce-derived addresses, calldata, gas and manifests are reviewed; the required approval phrase remains `MAINNET_DEPLOY_APPROVED`.
- Provide a dedicated Holy Cup backend signer later; until it is verified, keep the frontend on-chain write path disabled and retain the temporary governance signer label.

Until those confirmations and a separate Human approval exist:

```text
MAINNET_TRANSACTION = NOT_AUTHORIZED
LEGACY_HEART = DO_NOT_TOUCH
NEW_HEART_KGEN_FUNDING = BLOCKED
PRODUCTION_FRONTEND_CHANGE = BLOCKED
```
