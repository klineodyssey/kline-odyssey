---
VERSION: "1.0"
REVISION: "2026-07-13.WORKFORCE_V3"
STATUS: "ACTIVE"
LAST_UPDATED: "2026-07-13"
UPDATED_BY: "Codex"
REVIEWED_BY: "Codex"
SOURCE_COMMIT: "PENDING"
TASK_ID: "KGEN-WORKFORCE-V3-2026-0001"
CHANGE_REASON: "Define safe GitHub connectivity diagnostics for push failures."
SOURCE_OF_TRUTH: true
Domain: "KGEN"
Kingdom: "KAIOS"
Phylum: "Operations"
Class: "GitHub Connectivity"
Order: "Runbook"
Family: "Safe Push"
Genus: "Connectivity Diagnostics"
Species: "KGEN-KAIOS/operations/GITHUB_CONNECTIVITY_RUNBOOK.md"
---

# GitHub Connectivity Runbook

## Purpose

This runbook defines safe diagnostics when `git fetch`, `git push`, GitHub Pages, or GitHub Actions cannot reach GitHub. It prevents destructive recovery behavior.

## Diagnostic Order

Run in this order:

```powershell
Test-NetConnection github.com -Port 443
nslookup github.com
curl.exe -I https://github.com
git ls-remote origin
```

## Classification

| Class | Meaning |
|---|---|
| DNS_FAILURE | `github.com` cannot resolve |
| TCP_443_BLOCKED | TCP port 443 cannot connect |
| TLS_FAILURE | HTTPS/TLS handshake fails |
| AUTH_FAILURE | Network works, authentication fails |
| REMOTE_AHEAD | Remote main advanced before push |
| GIT_CONFLICT | Local commits conflict with remote |
| PROXY_FAILURE | Proxy or VPN interferes |
| FIREWALL_FAILURE | Local or network firewall blocks GitHub |
| UNKNOWN | Evidence is incomplete |

## Safety Rules

- TCP 443 failure is a network problem until proven otherwise.
- Do not reinstall Git for TCP 443 failure.
- Do not clear credentials for TCP 443 failure.
- Do not reset the repository.
- Do not stash or overwrite Human Main workspace.
- Do not redo completed commits.
- Do not force push.
- Preserve pending commit SHAs and branch names.
- If mobile hotspot works, it may be used temporarily for safe fetch/push.
- After network recovery, fetch latest `origin/main`, then cherry-pick pending commits onto a clean integration branch if needed.
- Preserve README RSS auto-update content during conflict resolution.

## Required Report Fields

Every connectivity incident report must include:

- timestamp
- workspace
- branch
- local HEAD
- latest known origin/main
- diagnostic command result
- classification
- pending commits
- push status
- next safe action

