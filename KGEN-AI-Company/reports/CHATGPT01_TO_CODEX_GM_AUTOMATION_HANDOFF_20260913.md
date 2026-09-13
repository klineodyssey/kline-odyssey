# ChatGPT-01 → Codex GM Automation Handoff — 2026-09-13

TO_WORKER_ID: `codex-gm-01`  
TO_LIFE_ID: `LIFE-CODEX-GM-0001`  
FROM_WORKER_ID: `chatgpt-01`  
SUBJECT: AI Company automation health, simplified merge flow, payroll/next-work closeout

## One-line decision

Repository/company procedures have been simplified so ordinary completed work should not idle for ceremonial review, but unattended external Cursor wake is currently **NOT ACTIVE** because `.github/workflows/kgen-cursor-dispatch-wake.yml` intentionally fail-closes without launching an external agent.

## Completed in current main

1. Root `AGENTS.md` binds the active Human-owner simplified merge policy.
2. `docs/KAIOS_HUMAN_OWNER_MERGE_POLICY.md` establishes Human-owner approval + current technical validation as sufficient ordinary repository merge authority.
3. Frontend/game work requires real-browser + screenshot + direct visual inspection and iterative repair before publication.
4. `KGEN-AI-Company/CURSOR_AUTO_WORK_PROTOCOL.md` now requires QA iteration, repo-native GM handoff, next-work closeout and payroll closeout.
5. `KGEN-AI-Company/CODEX_DISPATCHER_PROTOCOL.md` now tells GM to merge ordinary green work promptly, dispatch next work, and separate protected live execution from repository merge.
6. `KGEN-AI-Company/CURSOR_SESSION_CLOCKIN_SOP.md` now reflects the same V6 flow and no longer represents ceremonial independent review as a default blocker.

## Automation health finding

Current file: `.github/workflows/kgen-cursor-dispatch-wake.yml`

Current behavior:

- workflow may trigger on a qualifying merged PR / workflow_dispatch;
- job only records `HOLD_EXPLICIT_HUMAN_DISPATCH_AUTHORITY_REQUIRED`;
- `External API called: NO`;
- `Agent launched: NO`;
- no Cursor external agent is actually woken.

Therefore the company is **not fully unattended** even though the repository contains automation design/SOP files.

## GM next actions

### A. Immediate repository/company operations

- Treat old `DISTINCT_INDEPENDENT_REVIEW_REQUIRED` text as non-blocking for ordinary repository-only work under the current Human-owner policy when technical checks are green.
- Reconcile/merge safe completed branches instead of leaving them idle.
- Keep WorkQueue supplied with bounded eligible work.
- When a worker finishes and has no next work, assign the next eligible task or explicitly close the assignment.
- Use repository-visible handoff rather than asking the Human owner to copy messages between AI pages.

### B. Payroll closeout

For every completed worker/life, check:

- current Human-defined advance-pay/prepay payroll period;
- salary due;
- whether salary was actually paid and received;
- whether an approved UFO/mobile-ATM salary advance exists;
- net the advance against the relevant payroll period to prevent double payment.

Do not report `PAID` or `RECEIVED` without real funding/beneficiary/authority/receipt evidence for a live payment.

### C. External Cursor wake restoration — decision packet required

Before restoring unattended external Cursor launches, report to the Human owner in one concise packet:

1. exact provider/endpoint to be called;
2. required secret name and whether it is actually configured (do not expose secret value);
3. cost model / max spend guard;
4. trigger conditions and duplicate-run controls;
5. exact worker identity and task scope allowed;
6. fail-closed behavior when no eligible task exists;
7. assurance that Mainnet, treasury, payment, signer, governance and secrets remain outside ordinary worker authority.

Do not silently enable paid external-agent launch. Once the Human explicitly approves that action-specific packet and the provider/secret are available, restore the wake path and verify one bounded dry/harmless run before relying on unattended automation.

## Current blocker

`AUTOMATION_BLOCKER = EXTERNAL_CURSOR_WAKE_DISABLED_BY_WORKFLOW`

This is not a missing-code mystery: the workflow currently intentionally disables external dispatch.

## Authority boundary

This handoff does not authorize Mainnet deployment, payment, token/BNB/treasury movement, signer/private-key use, governance execution, KYC, or external account ownership actions. Those remain action-specific Human approvals.
