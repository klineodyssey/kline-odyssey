# KAIOS Public Experimental Lab and Circulation Dashboard

**Path:** `KGEN-KAIOS/dashboard/`
**URL:** https://klineodyssey.github.io/kline-odyssey/KGEN-KAIOS/dashboard/
**Mode:** Official public experimental UI; read-only financial truth
**Status:** Experimental release candidate; distinct review required before main merge

## Purpose

This dashboard is the public status surface for the latest safe KAIOS experimental build. It gives players and operators a read-only view of build identity, known broken features, KAIOS/KGEN circulation, governance gates, financial single points of failure, workers, WorkQueue, review pipeline, reports, and alerts. A broken UI may remain visible and labelled; unauthorized real-asset execution always fails closed.

It also exposes a repository Leader candidate and Queue drift surface. The Leader is a reviewable candidate selected by freshness, CURRENT-lineage compatibility, tests, secret/IP checks, and known review state; it is not an automatic merge authorization. Expired claims are detected from the existing Worker Registry and shown as `DRIFT_FOUND`, but the read-only dashboard never closes or rewrites a claim.

## Release channel

- A push to `main` still publishes automatically.
- A Human/authorized operator may dispatch `deploy-pages-static.yml` only with an exact tag or SHA already reachable from `origin/main`; an unmerged branch or commit is rejected even if the Pages environment policy later changes.
- The workflow checks the release diff for secret-bearing paths, credential-like additions, and proprietary trading/quant/signal path names before copying the static site.
- `build-info.json` binds the public page to the checked-out source commit, source tree, source ref, current `origin/main`, and ahead/behind counts.
- Rollback uses the same workflow with an earlier reviewed exact SHA; it does not rewrite Git history.
- A dirty Human `main` worktree is never cleaned, reset, stashed, or overwritten. GM engineering continues in an isolated worktree based on freshly fetched `origin/main`.

The first exact-ref deployment attempt, GitHub Actions run `33246089502`, was rejected before any job step because the `github-pages` environment currently permits only branch `main`. No environment permission was changed. Therefore the public site remains at `ac304fc585f5f86846d2c61b69ecad8f59bc0a66`; PR #192 remains the newer experimental candidate and website drift is explicitly open. Safe resolution is either distinct review followed by the protected main release path, or a separately authorized and reviewed environment branch-policy change.

## Public chain snapshot

The dashboard carries an **unattested read-only BNB Smart Chain snapshot candidate** claiming block `118743165`, block hash `0x307b4c200980a0bba413c458e5dc3d37b0a6a432b49a14e3ed1c575aaba01498`, observed `2026-08-29T09:25:28Z`. No repository-bound receipt, trusted connector attestation, or independently reproducible evidence is committed, so these values do not prove a deployment, live settlement availability, authority, or current balance.

| Item | Value |
|---|---:|
| KAIOS total supply | 22,213,908.930416874731235 |
| KAIOS in 18888 | 22,213,020.930416874731235 |
| KAIOS in 8888 | 888 |
| KGEN total supply | 71,976,169.974243092224959062 |
| Settled KGEN burn | 22,213.908930416874731235 |
| Actual KGEN burn | 23,830.025756907775040938 |
| Pending burn not yet mirrored | 1,616.116826490900309703 KGEN |
| Pending permissionless KAIOS entitlement | 1,616,116.826490900309703000 KAIOS |

No settlement, payment, trade, or chain write was executed to create this snapshot.

## White-hole truth

The canonical protocol model specifies KGEN AMM buy/sell tax at 0.30%: 0.10% true burn, 0.10% bank receiver, 0.05% reward, and 0.05% AutoLP. Wallet-to-wallet transfers are untaxed. Only the 0.10% true-burn supply loss enters the white-hole accounting basis. KAIOS settlement observes cumulative KGEN supply loss, subtracts already-settled burn, multiplies the newly settled amount by 1,000, and issues only to fixed treasury 18888. The settlement is monotonic, replay-safe, and permissionless; permissionless execution is not permission to redirect funds.

The unattested snapshot candidate reports KGEN `owner()` as BankGovernance `0xa2792fBDCc8A8AaC364053431D44E0a8D335E166` and `bankWallet()` as `0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE`. Until independently attested, these are candidate observations, not canonical deployment or authority proof; the latter is described as the KGEN bank-tax / reserve-redemption receiver, not the 18888 KAIOS bank.

## Governance and money-flow gates

- Mother `0xCd60BF474e691F2484950a0276Eaf507616Ca4b9` is the sole observed BankGovernance proposer.
- Yudi `0xc15E08834fCA9F2d3462a3f8f0BC30524D6dd756` is the sole observed BankGovernance approver.
- BankGovernance enforces a 3,600-second delay and executes exact approved calls.
- Guanyin `0xEBEeAC6d09D2d28Db8010b0923442C9Eb2b702FE` is the emergency pauser; this is not normal spending approval.
- General Manager business authority is off-chain preparation/policy scope unless a separate on-chain role or exact signer authorization is machine-verifiably bound.
- Human policy approval is not a cryptographic signature unless the Human also signs through the relevant bound wallet/controller.

Every real player reward, payroll, ATM replenishment, resource payment, 11520 settlement, or public-good payment still needs verified business evidence, a bound funded source, exact source/recipient/token/chain/amount/purpose/expiry authorization, a policy-bound signer, receipt verification, and accounting reconciliation. The current common live payment rail is incomplete.

## Single points of failure

Current P0 risks are the single Mother proposer, single Yudi approver, unbound company payroll source/signer, and insufficient distinct review capacity. Candidate recovery is reviewed N-of-M or time-bound secondary proposer/approver policies, a capped purpose-specific payroll source, failover signer, and qualified independent reviewers. These are proposals only; this change does not alter token governance.

Ten natural-resource packages (fish, earthworm, fungi, grass, mountain, river, shrimp, soil, tree, water) are candidate/simulation nodes. All ten currently have `wallet: NONE`; none is registered for real KAIOS/KGEN payment. Future design should prefer registered smart-contract or programmatic ledger subaccounts instead of one EOA/private key per object.

## Data Sources

| Source | Path |
|---|---|
| Worker Registry | `KGEN-KAIOS/worker_registry.json` |
| WorkQueue | `KGEN-Organization/WorkOrders/WORK_QUEUE.md` |
| Codex Review Log | `KGEN-AI-Company/reports/CODEX_REVIEW_LOG.md` |
| KAIOS Reports | `KGEN-KAIOS/reports/` |
| AI Company Reports | `KGEN-AI-Company/reports/` |
| Task Claim Schema | `KGEN-KAIOS/task_claim_schema.json` |
| Worker Status Schema | `KGEN-KAIOS/worker_status_schema.json` |
| Deploy Build Info | `KGEN-KAIOS/dashboard/build-info.json` generated by GitHub Pages workflow |

## Read-Only Rules

- No GitHub token is used.
- No API writes are performed.
- No WorkQueue state is changed.
- No task is claimed.
- No handoff branch is created.
- No merge or push is performed.
- Fetch failures are displayed as WARN alerts instead of crashing the page.
- A public UI failure never enables a payment, trade, treasury operation, or chain write.

## Files

| File | Purpose |
|---|---|
| `index.html` | Dashboard shell |
| `dashboard.css` | Responsive black-gold operations UI |
| `dashboard.js` | Static data loader, parser, renderer, and alert evaluator |
| `dashboard.config.json` | Sources, build truth, public chain snapshot, money flows, governance gates, single points of failure, natural-resource status, publication classification |
| `README.md` | Dashboard usage and governance notes |

## Protected Paths

The dashboard does not modify protected paths and has no write capability. Public release classification separates public OS/UI/docs/tests from internal operations, confidential payroll/KYC/location data, secrets, and proprietary long/short, trading, quant, alpha, signal, or private-dataset intellectual property. Secret and IP-protected content is not eligible for the public release channel.
