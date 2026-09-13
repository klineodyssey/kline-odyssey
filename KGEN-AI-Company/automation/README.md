# Cursor dispatch automation

STATUS: `HOLD_EXPLICIT_HUMAN_AUTHORIZATION_REQUIRED`

The repository has no verified, user-authored, action-specific authorization to read `CURSOR_API_KEY`, call a paid Cursor endpoint, or launch an external worker. Suggested approval text written by an assistant is not authorization.

The executable workflow is intentionally fail-closed and records `External API called: NO`, `Agent launched: NO`, and `HOLD_EXPLICIT_HUMAN_DISPATCH_AUTHORITY_REQUIRED`.

PRs #334 and #336 incorrectly treated repository prose as renewed Human authority. Their provider preflights returned HTTP 403 and created no agent, branch, pull request, token-usage record, or verified charge. PR #335 restored the inert gate; this work order restores it again and corrects the operational state documents.

Cost, concurrency, retry, watchdog, idempotency and deny-list values remain proposals only. Future activation requires an exact user-authored authorization for the named paid side effect, a separate bounded non-`codex/*` successor at latest main, exact-head CI, and expected-head merge. Mainnet, funds, Treasury, payment, signer, LP, governance, KYC, secret export, Worker activation and Life activation remain denied.
