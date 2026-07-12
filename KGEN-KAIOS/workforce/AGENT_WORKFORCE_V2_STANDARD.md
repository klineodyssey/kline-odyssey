# KGEN Workforce V2 Agent Standard

**Status:** ACTIVE  
**Version:** 2.0  
**Last Updated:** 2026-07-13  
**Task ID:** KGEN-WORKFORCE-V2-2026-0001

## Purpose

Workforce V2 upgrades the company model from "one Cursor equals one employee" to "each Agent work unit equals one employee." This supports many Cursor, ChatGPT, Claude, Gemini, OpenHands, Copilot, research, security, frontend, data and Human Engineer workers without declaring unverified agents as currently online.

## Identity Rules

- Every employee has a permanent `employee_uuid`, for example `EMP-000001`.
- Every Cursor Agent has a unique `agent_id`, for example `cursor-agent-0001`.
- New Cursor Agents increment numerically through `cursor-agent-9999`.
- Existing V1 records are preserved. `cursor-01` remains as a legacy worker ID and is mapped to `cursor-agent-0001`.
- A registered candidate is not active until it has Boot evidence, workspace evidence, a task claim, a branch/report path and Codex review.

## Agent Status Values

Only these status values are valid in V2:

- `ACTIVE_ON_DUTY`
- `ACTIVE_IDLE`
- `WAITING`
- `OFFLINE`
- `SUSPENDED`
- `ARCHIVED`

## Departments

V2 departments are:

`Frontend`, `Backend`, `Runtime`, `GitHub`, `Documentation`, `Testing`, `Temple`, `KGEN`, `AI Research`, `Operations`.

## Concurrency

The registry is designed to support 10, 50, 100 and 500 agents concurrently. Scaling is handled by unique employee UUID, unique desk ID, unique branch namespace and claim lease checks. A task may still have only one Primary Owner.

## Auto-Recruitment Boundary

Future agents may propose new agents, for example `cursor-agent-0001` proposing `cursor-agent-0105`. The new record starts as `WAITING`; Codex must review it and Human may block it. No auto-recruited agent can work before sandbox trial approval.

## Machine-Readable Sources

- `agent_registry.json`
- `desk_registry.json`
- `department_registry.json`
- `agent_runtime_status.json`
- `agent_daily_report.json`
