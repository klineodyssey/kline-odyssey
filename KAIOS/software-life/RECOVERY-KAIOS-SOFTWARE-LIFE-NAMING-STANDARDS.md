# Recovery: Software Life Naming Audit and Standards

Task ID: `KAIOS-SOFTWARE-LIFE-CANONICALIZATION-24H-001`

Baseline main: `4f0c6f05c85a3d39adb9ac8d4ce335f207fe42eb`

Branch: `codex/kaios-software-life-naming-standards`

## Scope

This package adds audit, standards, queue, tests and indexes. It renames no
existing file, changes no public URL and modifies no Runtime authority.

## Rollback

1. Revert the merge commit for the naming-standards PR with a normal revert.
2. Confirm `KAIOS/software-life/` additions and only their index references
   are removed.
3. Run repository JSON, Markdown-link, UTF-8, BOM and `git diff --check`
   validation.
4. Verify main equals origin/main and the working tree is clean.

Do not reset, rewrite history, remove compatibility routes, or modify
protected CURRENT, Constitution sources, Wallet, KGEN or contracts during
rollback.

The Cursor earthworm worktree is a separate governed claim and must not be
deleted or altered by this recovery.
