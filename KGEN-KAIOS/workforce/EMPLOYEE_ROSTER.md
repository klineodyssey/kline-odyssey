# KGEN Employee Roster

**Status:** ACTIVE  
**Version:** 1.0  
**Last Updated:** 2026-07-12  
**Updated By:** codex-gm-01  
**Reviewed By:** codex-gm-01  
**Task ID:** KGEN-WORKFORCE-ROSTER-2026-0001  
**Base Commit:** 0f256afa969dbf834df1eb1a6036e639ab2b5cd3  
**Source Of Truth:** `KGEN-KAIOS/workforce/employee_roster.json`

## Purpose

This roster records who is a real KGEN worker, who is on duty, who is registered but not activated, and which logical workspace, branch namespace, tool profile, task and reviewer apply to each worker.

A registry name is not enough to mark a worker active. Active duty requires Boot evidence, a registered worker ID, a logical workspace, a task or claim, branch/report evidence, recent activity and verifiable Git records.

## Summary

| Metric | Count |
|---|---:|
| Roster records | 11 |
| Formal active employees | 2 |
| Today on duty | 1 |
| Working now | 1 |
| Waiting review | 0 |
| Blocked | 0 |
| Registered not activated | 8 |
| Suspended | 0 |
| Revoked | 0 |
| Human operators | 1 |

## Employee Records

| Worker ID | Name | Type | Department | Status | Trust | Desk | Current Task |
|---|---|---|---|---|---|---|---|
| `codex-gm-01` | Codex-General-Manager | Codex | CEO_Codex | ACTIVE_ON_DUTY | T5 | Codex Review Workspace | KGEN-WORKFORCE-ROSTER-2026-0001 |
| `cursor-01` | Cursor Primary Worker | Cursor | Construction / Documentation / QA | ACTIVE_IDLE | T2 | Cursor Worker Workspace | - |
| `cursor-generic-01` | Cursor Generic Candidate | Cursor | Worker Pool | REGISTERED_NOT_ACTIVATED | T0 | Not assigned | - |
| `claude-01` | Claude Candidate | Claude | Worker Pool | REGISTERED_NOT_ACTIVATED | T0 | Not assigned | - |
| `gemini-01` | Gemini Candidate | Gemini | Worker Pool | REGISTERED_NOT_ACTIVATED | T0 | Not assigned | - |
| `openhands-01` | OpenHands Candidate | OpenHands | Worker Pool | REGISTERED_NOT_ACTIVATED | T0 | Not assigned | - |
| `copilot-01` | GitHub Copilot Candidate | GitHub Copilot | Worker Pool | REGISTERED_NOT_ACTIVATED | T0 | Not assigned | - |
| `chatgpt-01` | ChatGPT Candidate | ChatGPT | Worker Pool | REGISTERED_NOT_ACTIVATED | T0 | Not assigned | - |
| `deep-research-01` | Deep Research Candidate | Deep Research | Research | REGISTERED_NOT_ACTIVATED | T0 | Not assigned | - |
| `human-engineer-01` | Human Engineer Candidate | Human Engineer | Engineering | REGISTERED_NOT_ACTIVATED | T0 | Not assigned | - |
| `human-primeforge` | Father / Human Operator | Human Operator | Founder / Human Decision Gate | HUMAN_OPERATOR | T5 | Human Main Workspace | - |

## Rules

- Codex is the only default merge and push-main authority.
- Cursor may push only `cursor-handoff/<Task-ID>` and may not push main.
- Unactivated AI workers are candidates, not active employees.
- Human Engineer and Human Operator are separate records.
- No token, private key, password, seed phrase, IP address, private email or real local path is stored in this roster.
