# KGEN Cursor dispatch wake

This directory carries the repository-side prompt for the bounded Cursor Cloud worker path.

## Active pilot authorization

Human decision `APPROVED_WITH_BOUNDED_PILOT` authorizes one harmless repository-only pilot for `cursor-01`:

- daily policy cap: USD 1;
- monthly policy cap: USD 20;
- at most four Cloud Agent launches per UTC day;
- concurrency one and one formal task at a time;
- 5xx: at most three retries; 4xx: no retry;
- watchdog every five minutes and cancellation request at the sixty-minute ceiling;
- no Mainnet, funds, Treasury, payment, signer, LP, governance, KYC or secret export.

The initial task is `KAIOS-CURSOR-LIFE-ENERGY-PAYROLL-R2-001`, sourced from the canonical WorkQueue and its exact task envelope. It starts from the preserved R1 delivery head because the candidate payload is intentionally not on `main`.

## Event-driven path

Workflow: `.github/workflows/kgen-cursor-dispatch-wake.yml`

The workflow wakes on a matching WorkQueue/task-envelope/handoff merge to `main`, or by explicit manual dispatch. It fails closed unless all of the following are true:

- the formal task and envelope are `READY_FOR_ATOMIC_CLAIM`;
- repository active-claim projections are empty and `cursor-01` is idle;
- the exact starting ref/head match;
- no target branch or same-task open PR exists;
- Cursor reports no active agent;
- the daily launch count is below four;
- `CURSOR_API_KEY` exists as a GitHub Actions secret.

The request uses a deterministic client-supplied agent ID, so a repeated event receives a 409 conflict instead of starting a second agent. The workflow requests Composer 2 Fast, creates a PR, polls the run every five minutes, and records token usage. Cursor's API reports tokens but not USD cost, so the USD 1/day and USD 20/month ceilings must also remain configured as the provider billing/spend limit in the Cursor dashboard. See the official [Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints) and [Cloud Agents billing guidance](https://cursor.com/docs/cloud-agent#billing).

## Delivery and closeout

Cursor may change only files allowed by the task packet. It pushes one `cursor-handoff/<Task-ID>` branch and opens one draft PR; it cannot merge. The GM independently checks the exact head, file scope, tests, security boundaries and any UI visual evidence. A low-risk green result may then be merged under the standing Human authorization and Pages must be verified when the changed scope is published.

After closeout the company records payroll state (`prepaid`, `received`, salary advance and offset status) and selects the next safe formal task. Protected actions always remain Human-authority gated.
