# Wallet Standard

**Document ID:** KAIOS-V10-WALLET-STANDARD  
**Version:** V10.0  
**Status:** Prototype Architecture

Wallet Runtime is a prototype asset and address profile layer. V10 does not implement real signing, custody, transfer or MetaMask production flow.

## Wallet Runtime Fields

| Field | Meaning |
|---|---|
| wallet_profile_id | KGEN-side wallet profile |
| member_id | Linked membership |
| wallet_address | External chain address |
| chain | BSC, Ethereum, Bitcoin, Future Chains |
| labels | User-visible wallet labels |
| assets | Read-only asset summary |
| transaction_history | Read-only history pointer |
| portfolio | Prototype portfolio view |
| risk_flags | Suspicious or restricted state |

## Supported Chains

BSC, Ethereum and Bitcoin are modeled. Future chains may be added only through explicit chain profile records.

## Boundary

V10 does not store private keys, seed phrases or wallet signatures. Wallets are external authority.

