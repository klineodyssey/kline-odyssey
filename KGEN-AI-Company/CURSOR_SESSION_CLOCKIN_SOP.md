# Cursor Session Clock-In SOP (方案 2 / V6)

**Status:** ACTIVE — Human-approved standing procedure  
**Human decision lineage:** `HUMAN-AUTO-CLOCKIN-001` plus current Human-owner merge/automation policy  
**Worker:** `cursor-01`  
**GM / Dispatcher:** `codex-gm-01`

## Purpose

Every Cursor session (chat or Cloud Agent) should run company work before Human chat tasks unless Human explicitly says 「只聊天、不要接案」. Company work must finish through repo-native handoff and must not require the Human owner to carry messages between AI pages when repository communication is available.

## Execution order

```text
① Light Boot + Preflight
② Company patrol → claim → work → QA → handoff
③ GM integration / next-work decision
④ Human message / webhook payload task
```

## ① Light Boot

1. `git fetch origin main`.
2. Read in order:
   - `PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`
   - `AGENTS.md`
   - `docs/KAIOS_HUMAN_OWNER_MERGE_POLICY.md`
   - `KGEN-AI-Company/CURSOR_EMPLOYEE_BOOT.md`
   - `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md`
   - `KGEN-KAIOS/worker_registry.json`
   - `KAIOS/life/forest-agriculture/KAIOS_CURSOR_CONTINUOUS_WORK_QUEUE.json`
   - `KGEN-Organization/WorkOrders/WORK_QUEUE.md` (scan only eligible rows)
3. Emit `CURSOR PREFLIGHT`: worker eligibility, main SHA, queue signal and stop code if blocked.

If registry invalid, output `REGISTRATION_REQUIRED` and stop.

## ② Company patrol

Claim only an eligible task whose repository task/envelope authority exists.

When a task is claimed:

1. Branch from latest `origin/main` using the authorized branch pattern.
2. Execute only the bounded task.
3. Run required unit/integration/security checks.
4. For UI/frontend/game work, run a real browser and complete the mandatory iteration loop:
   - render the actual page/runtime;
   - capture screenshot(s), including the canonical mobile viewport when applicable;
   - inspect the screenshot directly for layout, controls, missing assets, overlays, clipping, wrong state or other regressions;
   - fix defects;
   - repeat browser → screenshot → inspection until no known issue remains.
5. Produce report + handoff evidence and push the handoff branch.
6. Record `FUNCTIONAL_QA` and `VISUAL_QA` when applicable.
7. Notify `codex-gm-01` through repository-visible handoff evidence.

## ③ GM integration / next work

Do not require a ceremonial second reviewer for ordinary repository-only work after Human-owner standing/explicit approval and current technical validation.

The GM should:

- reconcile stale branches to latest main;
- verify fresh checks and UI screenshot evidence;
- merge ordinary completed work promptly when green and no unresolved P0 defect exists;
- close superseded branches/PRs;
- verify normal GitHub Pages publication when applicable;
- immediately assign the next eligible task or close the worker assignment;
- perform payroll closeout checks for the completed worker/life.

If a live protected action is needed, the GM must prepare the concise execution packet for the Human owner instead of adding unnecessary people/review layers.

## ④ Human / webhook task

Only after company patrol and handoff/GM state are handled, unless the Human explicitly overrides the company patrol.

## Payroll closeout

The company policy uses Human-defined advance-pay/prepay salary semantics. On work completion the GM/accounting lane should check:

- salary period and amount/policy source;
- whether salary has actually been paid and received;
- any approved UFO/mobile-ATM salary/cash advance;
- required netting so the same salary period is not paid twice.

An ATM advance is a real accounting obligation, not free money. `PAID`/`RECEIVED` requires real funding, beneficiary, signer/authority and receipt evidence when the payment is live/on-chain.

## Repo-native automation status

The repository contains a Cursor dispatch workflow at `.github/workflows/kgen-cursor-dispatch-wake.yml`.

Current safety status as of this SOP revision:

- the workflow itself is installed;
- external Cursor API / agent launch remains fail-closed in that workflow until an action-specific Human decision authorizes the external launch configuration and the required secret/provider setup is actually present;
- dialogue/clone rules and repo-native handoff remain available independently of the external wake path.

Do not claim full unattended automation while the external wake workflow reports `HOLD_EXPLICIT_HUMAN_DISPATCH_AUTHORITY_REQUIRED`.

## Protected live actions

Mainnet/Testnet deployment/upgrade, real token/BNB/treasury/payroll/payment/liquidity movement, signer/private-key/secret use, governance/admin execution, KYC/account-ownership submission, production real-funds oracle activation and other live chain/external mutations require action-specific Human approval and applicable technical checks.

## Human overrides

- `gi，上班，啟動西遊記，專案開始` → full company patrol/work mode.
- `只聊天，不要接案` → skip company task claim; still perform minimal registry/preflight as applicable.
- default → company patrol first, then Human task.
