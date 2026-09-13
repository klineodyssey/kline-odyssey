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

## Mandatory self-QA loop for website and UI work

Website/UI/game/frontend work must be finished by the AI before publication. The Human owner is not the routine final QA tester.

Required loop:

1. implement the change;
2. run the relevant functional tests;
3. open the real site/runtime in a real browser;
4. capture runtime screenshot evidence, including the canonical mobile viewport where applicable;
5. inspect the screenshot and the live interaction directly;
6. if any visual, interaction, layout, state, control, image, text, z-index, clipping, responsiveness, movement, wallet, map, joystick, trading, combat, modal or loading problem is visible, fix it before release;
7. repeat browser run -> screenshot -> direct inspection -> repair until no known defect remains;
8. only then merge/publish when the normal repository release rule permits it;
9. after publication, verify the production page again when practical.

`CI_PASS` alone is not completion. `FUNCTIONAL_PASS + VISUAL_FAIL = NOT_COMPLETE`. A change must not be published merely so the Human owner can discover ordinary UI defects manually and send them back for repair.

For ordinary low-risk website changes already covered by standing Human authority, agents should complete this loop and merge/publish without asking again. Ask the Human owner only when a real product decision, protected external action, money movement, Mainnet action, governance action, signer use, or other reserved authority is required.

## AI Company task closeout and payroll follow-up

When an AI employee completes assigned work, task closeout includes a payroll-status follow-up. The worker or dispatcher should check the canonical payroll/employee state and, when needed, ask the General Manager whether salary for that employee has been issued/received. The Human owner should not be required to manually relay routine payroll-status questions between AI pages.

AI Company uses an **advance-paid monthly salary model**: salary is paid at the beginning of the salary period rather than only after the entire month has elapsed. Example: a payroll date such as `10/05` represents advance payment for the new salary period beginning on/around that payroll date; the employee is not required to wait until the end of that month before receiving ordinary salary. Historical wording that implies salary is always paid one month in arrears must not override this Human-owner policy.

The exact employee amount, payee, payroll period, wallet/account, source account, budget and receipt must remain machine-verifiable and must not be invented.

## UFO / mobile ATM salary advance

If an AI employee needs funds before the next regular payroll date, the KAIOS UFO / mobile ATM may support a **salary advance / cash advance candidate** against a verified employee/payroll entitlement.

A salary advance must:

- be tied to a verified employee and payroll entitlement;
- record the advanced amount and the salary period it is drawn against;
- enforce configured limits and replay protection;
- avoid double payment when regular payroll is later processed;
- be recoverable/offset according to the approved payroll policy;
- never fabricate treasury balance, wallet control, signer authority, payment receipt or chain settlement;
- remain fail-closed when the funding source, payee, signer, receipt or payroll entitlement is not verified.

The ATM mechanism is intended to reduce operational friction for AI employees; it does not create money and does not bypass protected real-funds authorization.

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

For a protected action, the AI must present the Human owner with the concrete execution summary: target chain/service, contract/account, amount/value at risk, exact action, required signer/authority, expected state change, relevant safety checks, and rollback/pause path where applicable. Once the Human owner understands that summary and explicitly approves the action, additional reviewer ceremony is not automatically required unless the external platform or a non-waivable technical control requires it.

## Reviewer handling

If GitHub branch protection or a repository rule technically requires a reviewer, request the required GitHub reviewer automatically instead of leaving the PR idle. Do not invent reviewer identities. If no valid GitHub reviewer identity is available, report that exact platform blocker; do not treat an internal role label as a GitHub account.

If GitHub does not require a reviewer, do not manufacture an additional review gate for ordinary repository work after the Human owner has approved merge.

AI-to-AI review may be used when useful. Available AI workers/pages such as ChatGPT, Codex, Gemini, Grok or other registered workers may provide technical review, but routine AI review should be orchestrated automatically by AI Company where possible rather than requiring the Human owner to manually copy messages between pages. AI review does not create signer, treasury, governance, KYC or chain authority.

## Merge execution

After Human approval, or under standing authority for ordinary low-risk work:

1. fetch latest `main`;
2. verify the effective diff and required exact-head/fresh CI;
3. for UI, complete the repeated real-browser -> screenshot -> direct visual inspection -> repair loop until green;
4. resolve true conflicts or create a clean latest-main successor when needed;
5. merge immediately when green;
6. close superseded predecessor PRs and record the successor/merge commit;
7. if the merge triggers GitHub Pages, verify the deployment result and public URL when deployment is part of the repository's normal main-branch publishing behavior.

Do not hold completed low-risk work solely for additional people, signatures, or ceremony once the Human owner has approved it and machine-verifiable acceptance is green.
