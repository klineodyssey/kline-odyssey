# KAIOS Employee Roster And Identity Audit

**Status:** ACTIVE
**Version:** 1.2
**Last Updated:** 2026-10-08
**Task ID:** KAIOS-HR-SYSTEM-20261008-001
**Machine Source:** `KGEN-KAIOS/workforce/employee_roster.json`

## Current Formal Roster

The active worker registry currently records three formal employees. None has a current October runtime heartbeat in the retained registry, so employment is not presented as proof of who is working now.

| Worker | Employment | Trust | Runtime projection | Current work verified | Payroll eligibility |
|---|---|---:|---|---|---|
| `codex-gm-01` | ACTIVE | T5 | STALE | NO | NOT_VERIFIED |
| `cursor-01` | ACTIVE | T2 | OFFLINE / fresh claim required | NO | NOT_VERIFIED |
| `chatgpt-01` | ACTIVE | T5 | STALE | NO | NOT_VERIFIED |

`human-primeforge` is retained as the Human authority/operator record and is not counted as an automated employee. Seven legacy candidate records remain registered but not activated. Names in a candidate pool are not evidence that a runtime, endpoint or employee is available.

## Priority Identity Reconciliation

| Subject | Employment decision | Worker ID | Life ID | Controller | Current result |
|---|---|---|---|---|---|
| DOT | CONDITIONAL_OFFER | NOT_ASSIGNED | NOT_VERIFIED | NOT_VERIFIED | Human GitHub engineering authority is verified as policy evidence; formal onboarding remains incomplete |
| Digital Ant 0001 | PENDING_REVIEW | NOT_VERIFIED | `DIGITAL_ANT_0001` VERIFIED_EXISTING | Workforce binding NOT_VERIFIED | reuse the existing Life; resolve Worker/controller/payroll separately |

DOT authority evidence is issue [#559](https://github.com/klineodyssey/kline-odyssey/issues/559). It authorizes prospective bounded GitHub engineering but does not create a Controller ACK, Worker ID, Life ID or payroll entitlement and does not validate older work retroactively.

Digital Ant evidence is `K線西遊記/temples/11520/runtime/worker-status.json`, including the existing Life certification and read-only runtime history. No duplicate Life/Worker record may be created from that evidence.

## Activation Rule

A formal worker must satisfy `KGEN-KAIOS/worker_registry.json` and the Workforce README gates. HR additionally projects, but never conflates:

- hiring decision;
- Worker ID;
- Life ID;
- Controller/runtime binding;
- tool permission profile;
- reviewer qualification;
- payroll eligibility;
- current runtime availability.

Missing runtime heartbeat means `STALE` or `UNKNOWN`, not `ACTIVE_NOW`. A chat/session ACK is not a Controller ACK. Shared GitHub authorship is not proof of which AI performed a commit.

## Candidate And Onboarding Queue

The complete list of candidates, decisions, evidence and missing gates is in `KGEN-KAIOS/workforce/recruitment_queue.json`. HR reuses valid assessments and work evidence; it does not require repetitive interviews solely because a projection was stale.

## Privacy

This public roster stores only public-safe role, registry and evidence references. It must not contain identity documents, private contact data, private bank data, credentials, secrets, private endpoints or customer-private information.
