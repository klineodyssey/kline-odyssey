# Repair Proposal: PR Preview Deploy Pipeline

**Proposal ID:** `REPAIR-PR-PREVIEW-DEPLOY-PIPELINE-001`  
**Task context:** `KAIOS-PRODUCT-SPRINT-001A` / PR #42 Human mobile acceptance blocked  
**Author:** cursor-01  
**Reviewer target:** codex-gm-01 + Human PrimeForge  
**Date:** 2026-07-18  
**Status:** PROPOSED — implementation on PR branch pending Codex review  

---

## Problem

Repository deploys GitHub Pages **only from `main`** via `deploy-pages-static.yml`. Pull requests have **no browsable preview URL**. jsDelivr raw HTML links render as **source text on mobile** and are unsuitable for Human UX acceptance.

## Decision Requested

1. **Approve** GitHub Pages PR Preview workflow for all PRs targeting `main`.
2. **Block merge of PR #42** until Human confirms preview acceptance on real Desktop + Mobile browsers.
3. **Optional follow-up:** dedupe production workflow to call shared `.github/scripts/build-static-pages-site.sh`.

## Proposed Solution (Option 1 — GitHub Pages Preview)

| Item | Value |
|------|-------|
| Workflow | `.github/workflows/pr-preview-pages.yml` |
| Trigger | `pull_request` → `main` (`opened`, `synchronize`, `reopened`) |
| Build | `.github/scripts/build-static-pages-site.sh` (same asset graph as production) |
| Deploy | `actions/deploy-pages@v4` with `environment: github-pages` |
| Preview URL | GitHub Pages **PR preview deployment** (`steps.deployment.outputs.page_url`) |
| PR comment | Auto-updated comment with preview URL marker |
| Production impact | **None** — preview deployments do not replace live `main` site |

## Alternatives Considered

| Option | Verdict |
|--------|---------|
| jsDelivr `@branch/file` | **Rejected** — mobile renders HTML as plain text |
| Vercel / Netlify / Cloudflare | **Deferred** — requires external account secrets not in repo |
| Surge.sh | **Blocked** — interactive login required |
| Manual localhost only | **Insufficient** for Human mobile QA |

## Acceptance Criteria

- [ ] PR #42 shows **View deployment** check with HTTPS preview URL
- [ ] Preview homepage renders as HTML (not source) on mobile Safari/Chrome
- [ ] World Viewer reachable from preview homepage in ≤2 taps
- [ ] Production URL unchanged until explicit merge after Human sign-off
- [ ] Future PRs auto-receive preview URL comment

## Governance

- **Merge gate for PR #42:** `HUMAN_PREVIEW_ACCEPTANCE_REQUIRED`
- Cursor must **not** merge PR #42
- Codex merge only after Human acceptance + existing product review gates

## Rollback

Disable workflow by reverting `.github/workflows/pr-preview-pages.yml` on `main`. Preview deployments expire when PRs close.

## Non-Goals

- No change to Universe Law, Genesis, Token, Runtime CURRENT, or protected paths
- No Vercel/Netlify setup in this repair (separate WorkOrder if Human requests)
