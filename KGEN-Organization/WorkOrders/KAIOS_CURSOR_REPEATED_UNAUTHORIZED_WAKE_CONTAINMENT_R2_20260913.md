# KAIOS-CURSOR-REPEATED-UNAUTHORIZED-WAKE-CONTAINMENT-R2-20260913

- Priority: P0
- Risk: R1
- Exact base: `c344d39bce7305b832be85f8bd13a3b375af9505`
- Trigger: PR #336 restored secret access and external Cursor API calls from prohibited `codex/*` lineage without verifiable user-authored action-specific authorization.
- Observed run: `34764602496` returned HTTP 403; `AGENT_LAUNCHED = NO`.

## Scope

Restore the inert fail-closed workflow, converge all live operational projections on HOLD/NOT_VERIFIED, append an authority correction, and prevent repository prose from self-authorizing a paid external launch.

## Acceptance

- Workflow has no secret reference, Cursor endpoint, network client or launch step.
- Envelope, canonical/public queues, workforce queue, registry, WorkQueue and decision snapshot converge on HOLD.
- Budget limits remain non-active proposals; active claims remain zero; cursor-01 remains IDLE.
- Exact-head tests pass.
- No UI/game change; browser/screenshot/Pages QA is not applicable.
- No Mainnet, payment, governance, private key, Worker activation or Life activation.
