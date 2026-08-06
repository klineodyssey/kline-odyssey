# KAIOSV01 Burn-Proof Genesis Draft — Archive Record

**Status:** SUPERSEDED REVIEW DRAFT  
**Superseded by:** `../contracts/KAIOSV02_BurnProofGenesis.sol`  
**Original draft filename:** `KAIOSV01_BurnProofGenesis_DRAFT.sol`  
**Original location:** local review artifact; not previously deployed or committed as a canonical GitHub contract.

## V0.1 scope

- Genesis supply 0.
- Maximum supply 720,000,000,000 KAIOS.
- 1 burned KGEN = 10,000 KAIOS.
- One Burn Proof usable once.
- Zero native transfer, buy and sell tax.
- No public burn, blacklist, sell restriction, owner sweep or proxy upgrade.
- One generic `mintFromVerifiedKgenBurn` entry point.

## Reason for supersession

V0.2 adds explicit source classification for system AMM burns and voluntary player offerings, records burner, recipient Vault, civilization ID, purpose code and wish hash, and includes the immutable short Genesis Inscription.

V0.1 was never audited and is not authorized for testnet or mainnet deployment.
