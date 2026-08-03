# Recovery: KAIOS Life Energy, Economy and Payroll V0

Task ID: `KAIOS-24H-LIFE-ENERGY-ECONOMY-PAYROLL-001`

## Boundaries

This workline adds specifications, schemas and later a bounded simulation. It
does not modify KGEN, real wallets, chain code, `CURRENT`, Constitution sources
or production authority.

## Recovery Points

- Pre-work main: `57573a6b88021539be28a15ea5f57bdafc6fa46c`.
- Specification branch: `codex/kaios-life-energy-economy-payroll-spec`.
- Runtime branch is not created until the specification is merged.
- Cursor envelope is preparation-only and creates no worker claim.

## Rollback

Revert the merge commit for the affected controlled PR. Do not reset the
repository, rewrite shared history or delete unrelated user changes. Static API
projections can be removed with the runtime merge revert; the existing Economy
Runtime and Player Genesis remain the fallback owners.

## Data

All runtime state is synthetic, serializable and locally resettable. There are
no migrations, private keys, wallet addresses, chain transactions or real
financial records.
