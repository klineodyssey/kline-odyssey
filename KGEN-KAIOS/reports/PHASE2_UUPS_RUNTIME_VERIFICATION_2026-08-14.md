# Phase 2 UUPS Runtime Verification — 2026-08-14

Status: `PASS`. Environment: `BSC_MAINNET_READ_ONLY`. No transaction was sent during this verification fix.

## Root cause and canonical rule

OpenZeppelin 5.0.2 `UUPSUpgradeable` embeds its `__self` implementation address through Solidity immutable references. The compiler artifact runtime contains zero-filled immutable templates, while deployed runtime contains the actual implementation address at those offsets. Therefore raw `keccak256(artifact.deployedBytecode)` is a compile-artifact identity, not the exact deployed runtime hash.

The deployment verifier now deterministically performs both equivalent checks:

1. read `immutableReferences`, patch every audited 32-byte UUPS `__self` range with the actual implementation address, and compare the reconstructed runtime exactly;
2. zero the same immutable ranges in artifact and chain runtime and compare the normalized bytes/hash.

Both checks must pass. A wrong address patch, any mutation outside the immutable ranges, a runtime-length mismatch, or a non-UUPS runtime fails verification.

## Existing Mainnet implementation

| Field | Value |
|---|---|
| Contract | `CelestialEligibility_Upgradeable` |
| Address | `0x0D21328BdbE12e9E69838Fd33E3C20F0b27f2779` |
| Deployment transaction | `0x039c28a90b5a87be6826c8f9323f9489eee67474b1de9fdd8c2377bc4464b93b` |
| Deployment block | `115864643` |
| Creation bytecode | Exact reviewed artifact match |
| Runtime bytes | `12785` |
| Artifact runtime hash | `0xae98738d325dec42889d794de951c018ec50bebf16379bc530bab0e250b455c7` |
| Patched expected runtime hash | `0x8802e43df4bfdadfa88d9404943b3b8de6767672fe7b994072b2fbaaff252309` |
| Actual runtime hash | `0x8802e43df4bfdadfa88d9404943b3b8de6767672fe7b994072b2fbaaff252309` |
| Normalized artifact/chain hash | `0xae98738d325dec42889d794de951c018ec50bebf16379bc530bab0e250b455c7` |
| Immutable offsets | `5804:32`, `6993:32` |
| `version()` | `1.0.0` |
| `proxiableUUID()` | `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc` |
| Implementation initializer | Locked |
| Owner surface | None |
| Implementation governance roles | None for deployer, Mother, Jade Emperor, or Guanyin |

Result: `ELIGIBILITY_EXISTING_IMPLEMENTATION_VALID = PASS`. The implementation is reused and must not be redeployed.

## Remaining nonce-57 plan

All addresses were recomputed from deployment signer `0xb3C54ca96De0dED4Ca0151F629ff9781506ba261`, live nonce `57/57`, and were empty at read-only block `115875323`.

| Nonce | Identity | Predicted address | Status |
|---:|---|---|---|
| 57 | Eligibility Proxy | `0xA50743fd0fe022714831482355A27559027368F9` | `PREDICTED_ONLY / NOT_DEPLOYED` |
| 58 | ReserveRedemption Implementation | `0x8D4a697549Ee45e9973041d0f1c0d0394B1A1034` | `PREDICTED_ONLY / NOT_DEPLOYED` |
| 59 | ReserveRedemption Proxy | `0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE` | `PREDICTED_ONLY / NOT_DEPLOYED` |
| 60 | CapitalCommitment Implementation | `0x09b4371B071d8957622DD640dbd0F713897Db167` | `PREDICTED_ONLY / NOT_DEPLOYED` |
| 61 | CapitalCommitment Proxy | `0x04fC1536EC51E8CCaAcB961E5Af6151De47b078c` | `PREDICTED_ONLY / NOT_DEPLOYED` |

Future implementation verification plans:

- ReserveRedemption immutable offsets: `5163:32`, `5374:32`; patched expected runtime hash at nonce-58 address: `0x3e45364adc0c5720c4029bba7aba98030daa2067f2ec84646e758187bb369446`.
- CapitalCommitment immutable offsets: `4221:32`, `4432:32`; patched expected runtime hash at nonce-60 address: `0xfaac8a87eecf811b04d59969804985161f3bd6e79ef6a995fcdec8dfbe091428`.

Proxy validation remains separate: deployed proxy runtime must match the reviewed ERC1967 proxy pattern, its ERC1967 implementation slot must equal the intended implementation, and every initializer-bound value must be read back exactly.

## Gas and funding refresh

The audited fork receipts give `5,958,652` gas for the remaining five deployments and `1,592,665` gas for registration, contribution-verifier governance, and three finalizations. Direct total is `7,551,317`; the 20% buffered total is `9,061,581` gas. At the observed `50,000,000 wei` gas price, buffered requirement is `0.00045307905 BNB`.

Read-only balances at verification:

- deployment signer: `0.004224216341457930 BNB`;
- Mother: `0.002823775600000000 BNB`;
- Jade Emperor: `0.002997117850000000 BNB`;
- Guanyin: `0.003000000000000000 BNB`.

Funding status: `PASS`.

## Safety result

- `PATCHED_RUNTIME_MATCH = PASS`
- `PHASE2_SOLIDITY_DIFF = 0`
- `CURRENT_MAINNET_DEPLOYMENT_REUSABLE = YES`
- `READY_TO_RESUME_PHASE2_STAGE1 = YES`
- `MAINNET_TRANSACTION_SENT_THIS_FIX = NO`
