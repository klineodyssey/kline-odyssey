# Recovery - KAIOS Charter Foundation Gap Closure V1

Base main: `38e765975573abcb9192c2e7168a9aa89585b75a`

Rollback by reverting the PR B merge commit. The adapter is non-owning and has no migration, persistence, wallet, KGEN, on-chain, legal or production side effect. Removing its module, test and read-only status projection leaves every existing runtime unchanged.
