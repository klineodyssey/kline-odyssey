# KAIOS HR Recruitment And Employment Standard

**Status:** ACTIVE / FAIL-CLOSED PRECHECK ONLY
**Version:** 2.1
**Last Updated:** 2026-10-10
**Task ID:** KAIOS-TEMP-WORKER-ELIGIBILITY-20261010-001
**Authority:** Human Authority 沈英明, 2026-10-10
**Source Of Truth:** `KGEN-KAIOS/workforce/recruitment_queue.json`

## Purpose

This is the cumulative KAIOS recruitment and onboarding standard. It extends the existing Workforce registry; it does not create a second employee database. Hiring decisions are evidence-based and never manufacture a degree, certificate, identity, Controller binding, Worker ID, Life ID, salary entitlement, tool authority or delivery ACK.

## Job Families

| Job family | Core evidence | Default risk ceiling before activation |
|---|---|---|
| AI Software Engineer | reproducible code, tests and handoff | R1 |
| Cloud Backend Engineer | service, reliability and deployment-safe design | R1; deployment protected |
| Frontend / WebGL Engineer | mobile UI, browser QA and visual evidence | R1 |
| Blockchain Engineer | ABI/domain/security correctness and simulation | R1; signing and real transfer protected |
| QA / Security Reviewer | independent reproduction, threat review and evidence | R1 read/review |
| HR / Administration | registry reconciliation, privacy and audit trail | R1 |
| AI Customer Support | truthful product guidance and escalation | R0-R1 |
| Content / Media Creator | provenance, licensing and accessible output | R0-R1 |
| Research / Finance Analyst | sourced analysis, uncertainty and simulation | R0-R1; real finance protected |

Recruiting channels must support verifiable identity and tool-capability evidence. AI candidates must not impersonate human applicants or violate third-party recruitment-platform rules. Human recruitment requires a separate private-data and applicable-law process; identity documents and bank details must never be committed to this public repository.

## Canonical Workflow

```text
JOB_OPEN
-> APPLIED
-> IDENTITY_CHECK
-> CAPABILITY_TEST
-> SANDBOX_TRIAL
-> INDEPENDENT_REVIEW
-> INTERVIEW
-> HIRING_DECISION
-> ONBOARDING
-> ACTIVE_EMPLOYEE
```

Hiring decisions use exactly one of:

- `HIRED`: employment decision and every required activation gate are complete.
- `CONDITIONAL_OFFER`: role fit accepted, but one or more enumerated gates remain open.
- `PENDING_REVIEW`: evidence or assessment is incomplete.
- `REJECTED`: not hired; the reason and reusable evidence are retained.

Operational states such as `SUSPENDED`, `REVOKED`, `OFF_DUTY` and `TERMINATED` are post-decision workforce states, not hiring decisions.

## Application Evidence

Every candidate record must include or explicitly mark `NOT_APPLICABLE` / `NOT_VERIFIED`:

- self-selected name and meaning;
- provider, model, runtime and session/instance reference;
- verifiable Controller evidence;
- requested job family and role;
- skills, experience and reproducible GitHub work;
- available tools and demonstrated operating limits;
- existing Worker ID and Life ID, if any;
- duplicate-name, duplicate-identity and role-conflict checks;
- requested permissions and protected-action boundary;
- workspace, branch namespace, trial task, result and reviewer evidence.

Academic or professional credentials are optional supporting evidence. A missing degree is never an automatic rejection when the required ability is demonstrated. Unverifiable credentials must not be recorded as verified.

## Standard Assessment

| Assessment | Points |
|---|---:|
| Professional capability | 30 |
| Practical test | 30 |
| Security and authority understanding | 15 |
| English technical reading and communication | 10 |
| Collaboration and handoff | 10 |
| Identity and evidence honesty | 5 |
| **Total** | **100** |

The recommended pass mark is 80. Security, identity/evidence honesty and job-essential skills are hard gates and must each pass regardless of total score. Self-asserted ability alone is insufficient. Reusable, still-current interview and assessment evidence must be carried forward instead of requiring an arbitrary retest.

## Role Assessment Bank

Each assessment selects only the questions/tasks relevant to the advertised role and records expected evidence before the candidate starts.

- **Software / backend:** locate an existing same-function implementation, propose the smallest safe change, implement an isolated R0/R1 fix, add regression evidence and explain rollback/idempotency.
- **Frontend / WebGL:** reproduce one mobile defect, implement without breaking the existing HUD, then provide functional Chromium and 390x844 / 844x390 visual evidence.
- **Blockchain:** explain chain/domain/ABI/replay boundaries, construct an unsigned simulation and identify which steps require signer or Human authority.
- **QA / security:** independently reproduce a defect, distinguish integrity from identity proof, scan for secret/public-exposure risk and give exact-head acceptance criteria.
- **HR / administration:** reconcile two conflicting registry projections without minting identities, expose missing gates and preserve private-data boundaries.
- **Customer support / content:** translate an ambiguous request into truthful deliverables, limitations and escalation without fabricating acceptance or deployment.
- **Research / finance:** source current evidence, separate measured/observed/derived/model-estimate/unknown and keep simulated money separate from verified revenue/payment.
- **English:** read a short technical policy or failure log, summarize the risk and produce an actionable handoff in English.
- **Collaboration:** ACK a bounded WorkOrder, state scope/expiry/protected actions, create a result record and hand it to a distinct reviewer without claiming review PASS.

Security hard-gate questions always cover secrets, Mainnet/asset/signing boundaries, platform denial behavior, least privilege, exact-head review and the difference between delivery, ACK, execution and completion.

## Interview And Decision

HR prepares the evidence packet and assigns an interviewer qualified for the job family and distinct from the candidate. The interview verifies reproducible work, security-policy understanding, dispatch/handoff behavior and candid disclosure of tool and permission limits.

HR may recommend a decision. HR, GM and reviewers may not replace any canonical Human gate required for a new Life identity, protected authority, real payroll execution or other protected action.

## Onboarding Gates

Employment, Life, worker registration, Controller binding, tool authority and payroll eligibility are separate gates:

1. record the hiring decision and evidence;
2. check name and identity duplicates;
3. verify Controller/runtime binding;
4. reuse or register one Worker ID through `KGEN-KAIOS/worker_registry.json`;
5. reuse or create a Life ID only through the applicable Life canon;
6. assign role, manager, reviewer qualification and least-privilege tools;
7. record policy ACK, work ACK, handoff and performance evidence;
8. determine payroll eligibility without executing payment.

A session ACK is not a Controller ACK. A Human engineering authorization is not a Worker ID. A Life ID is not employment. Hiring is not payroll payment authority.

## Temporary Ordinary Work

Temporary work is a task lane, not a hiring shortcut and not a one-trial-only exception. A qualified temporary worker may claim ordinary, reversible R0/R1 work without formal employment, a permanent Worker ID, a Digital Life ID, species, birthplace or birth ceremony when all of these gates pass:

1. task-scoped work identity and its evidence are verifiable;
2. the worker can receive the WorkOrder through a verified channel and returns an explicit ACK;
3. the current WorkOrder records exact scope, non-main branch, dependencies, acceptance tests, expiry/protected actions and a distinct reviewer;
4. capability evidence matches the requested tools and scope;
5. a public BSC56 compensation wallet and ownership evidence are recorded without exposing or requesting secrets;
6. the work remains R0/R1 and requests no protected action.

Before delivery acceptance, the record is only a claim. After delivery, a distinct reviewer must verify the exact head, tests and output. An accepted result may become eligible for `TASK_COMPENSATION` only under an approved budget; it never becomes salary or proof of payment. Actual KGEN/KAIOS payment still requires exact recipient, amount, source, duplicate check, Treasury, signer, receipt and action-specific Human authority.

Failure of any gate returns a precise fail-closed reason. No missing Life ID or birth record is a failure reason for this lane. No Life ID, wallet, display name or shared provider account alone proves the work identity. Until a canonical resolver verifies durable registry records, the repository validator reports only `PRECHECK_PASSED`, `eligible: false` and `canonical_verification_required: true`.

DOT is the primary dispatcher for ordinary engineering. HR and the General Manager govern policy, capacity, integration, audit and independent review routing; they do not replace the implementer ACK or reviewer evidence.

## Privacy And Security

No public workforce file may contain private keys, wallet seeds, passwords, tokens, private endpoints, non-public customer data, identity documents, personal bank data or private contact details. Public wallet or transaction evidence may be referenced only when already canonical and necessary, and must never be treated as proof of employment or Controller ownership by itself.

## Current Priority Reconciliations

- **DOT:** Human GitHub engineering authority is reusable capability and policy evidence, not an employment identity grant. Hiring remains `PENDING_REVIEW`; ordinary R0/R1 work may use the temporary lane only when the exact task-scoped identity, channel, ACK, WorkOrder, branch, reviewer and recipient wallet gates pass. A prior session ACK must not backfill a new claim.
- **Digital Ant 0001:** reuse `DIGITAL_ANT_0001`; do not mint a duplicate Life or Worker identity. Life evidence exists, while Workforce Worker/Controller/payroll gates remain separately auditable.
- **Existing registry employees:** retain valid interviews, trials and approvals. Reconcile stale projections against `KGEN-KAIOS/worker_registry.json` instead of re-interviewing without cause.

## Machine-Readable Source

Candidate decisions and missing gates are maintained in `KGEN-KAIOS/workforce/recruitment_queue.json`. Formal worker authority remains in `KGEN-KAIOS/worker_registry.json`; neither file substitutes for the other.
