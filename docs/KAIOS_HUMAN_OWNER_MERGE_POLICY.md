# KAIOS Human-Owner Merge Policy

STATUS: ACTIVE
OWNER_AUTHORITY: HUMAN_PROJECT_OWNER
PURPOSE: Simplify repository integration so completed work is not held only for extra reviewer ceremony.

## Default merge rule

For repository-only changes, the Human project owner's explicit approval is sufficient merge authority once required technical checks pass.

Examples of explicit approval include: `可以 merge`, `全部 merge`, `我看過可以合併`, or an equivalent unambiguous Human instruction.

A second or distinct independent reviewer is **not** a mandatory merge gate for ordinary repository work when all of the following are true:

1. the change is repository-only and does not itself execute a protected external side effect;
2. required CI/tests pass at the exact candidate head or an equivalent fresh merge candidate;
3. UI/frontend changes satisfy Functional QA and Visual QA, including real-browser and screenshot requirements where applicable;
4. stale or conflicting branches are reconciled onto latest `main` without reverting newer accepted behavior;
5. no unresolved P0 correctness or security defect is known.

## Work that may merge under single Human approval

This simplified path applies to documentation, website content, UI, static assets, simulation-only runtimes, read-only observers, fail-closed candidate logic, tests, CI hardening, non-authoritative planning code, and other changes that do not themselves move real assets or exercise protected authority.

If an old PR says `distinct independent review required` only because of historical process text, that text alone does not block merge after current Human approval and current technical validation. Update or supersede stale PR metadata instead of waiting indefinitely.

## Protected high-risk actions remain separate

Human approval to merge repository source does **not** automatically authorize any of the following external or chain-state actions:

- Mainnet/Testnet deployment or upgrade execution;
- token, BNB, treasury, payroll, payment, liquidity or other real-asset movement;
- signer/private-key/seed/secret use or export;
- governance/admin-role execution;
- KYC, account-ownership proof, or authenticated third-party submission;
- production oracle/feed activation where real funds depend on the feed;
- any action that changes live chain state or external account authority.

These actions require an explicit action-specific Human instruction plus the technical/runtime checks appropriate to that action. Repository merge and production execution are separate decisions.

## Reviewer handling

If GitHub branch protection or a repository rule technically requires a reviewer, request the required GitHub reviewer automatically instead of leaving the PR idle. Do not invent reviewer identities. If no valid GitHub reviewer identity is available, report that exact platform blocker; do not treat an internal role label as a GitHub account.

If GitHub does not require a reviewer, do not manufacture an additional review gate for ordinary repository work after the Human owner has approved merge.

## Merge execution

After Human approval:

1. fetch latest `main`;
2. verify the effective diff and required exact-head/fresh CI;
3. for UI, verify real-browser Functional QA + Visual QA;
4. resolve true conflicts or create a clean latest-main successor when needed;
5. merge immediately when green;
6. close superseded predecessor PRs and record the successor/merge commit;
7. if the merge triggers GitHub Pages, verify the deployment result and public URL when deployment is part of the repository's normal main-branch publishing behavior.

Do not hold completed low-risk work solely for additional people, signatures, or ceremony once the Human owner has approved it and machine-verifiable acceptance is green.
