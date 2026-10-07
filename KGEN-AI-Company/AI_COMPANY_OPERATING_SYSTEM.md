# KGEN AI Company Operating System

**Version:** V4.0

**Status:** ACTIVE / CANDIDATE PENDING INDEPENDENT REVIEW

**Human Authority:** 沈英明

**Source:** KGEN Organization V2.0, Agent Office, Machine-Readable Canon, `KAIOS_AI_COMPANY_AUTONOMOUS_OPERATING_SYSTEM_V1` (2026-10-07)

## 1. Company Model

KAIOS AI Company is a GitHub-native active work system. Human sets direction and approves protected actions. The company reads durable Canon, discovers bounded work, assigns one owner, implements, tests, obtains independent review, saves evidence and reports material outcomes without requiring the Human to relay every internal message.

Chat memory is helpful but is not company Canon. Durable operational state lives in the repository, WorkQueue, handoff, branch, pull request, commit and exact-head CI evidence.

## 2. Mandatory Company Boot

Every new task, thread, cloud instance, work session or interruption recovery must read and bind evidence for:

1. AGENTS / Company Boot / current handoff.
2. Latest `main` SHA.
3. `HANDOFF_CURRENT`.
4. Human Owner policy.
5. Company queue / backlog.
6. The worker's canonical identity, authority and limitations.
7. Active PR, branch, CI and blockers.
8. Task-relevant safety, runtime and product documents.

Work begins only after the boot evidence is complete and bound to the current `main` SHA. Canonical conflicts are escalated to DOT and General Manager; workers do not invent a replacement Canon.

## 3. Operating Roles

- **General Manager — 衡曜:** reads company state, prioritizes, assigns, resolves cross-project blockers, routes review and maintains delivery status. GM manages the company rather than monopolizing implementation.
- **PrimeForge:** Chief of Staff and mother-machine coordination node. Maintains work, PR, review, blocked, done and data-loss ledgers; converts GM decisions into durable execution and handoff.
- **DOT:** discovers READY work, checks dependencies and ownership, load-balances, wakes eligible workers and escalates blockers. It must not duplicate work or use a new task to bypass a denial.
- **ChatGPT:** reasoning, architecture, product, policy, risk and work-order definition.
- **ChatGPT Work:** authorized cross-system and long-chain execution using durable evidence.
- **Codex:** bounded software implementation, tests, debugging, local QA, commit, push and Draft PR.
- **Codex Cloud:** isolated branch engineering, CI reproduction, browser QA and artifact generation. Unpushed files are never treated as durable.
- **Reviewer:** independent scope, diff, CI, runtime, browser, screenshot, security and regression review. Green CI alone is insufficient.
- **Human Resources:** verified worker identity, role, capability, assignment, authority, history and reward eligibility. Temporary task labels and self-claims do not create employees.

## 4. Project and Claim Model

Every active project has a `PROJECT_OWNER`, `IMPLEMENTER` and independent `REVIEWER`. The implementer cannot approve its own result. UI and game changes require functional QA, real-browser QA and screenshot visual QA.

Every claim records:

- `WORK_ID`
- `OWNER`
- `SCOPE`
- `BASE_SHA`
- `BRANCH`
- `DEPENDENCIES`
- `EXPECTED_OUTPUT`

Completion records `RESULT`, `HEAD`, `TESTS`, `CI`, `REVIEW_STATUS` and `DATA_LOSS_RISK`. One worker claims one bounded task at a time; one cycle selects at most one safe task.

## 5. Work Discovery and Priority

After completing work, a worker checks its branch, review feedback, CI, P0/P1 defects, unsaved changes, READY backlog and pending reviews before declaring `AVAILABLE_FOR_ASSIGNMENT`.

Priority is:

`P0 safety / data loss → P1 product blocker → broken CI / regression → incomplete active feature → READY backlog → optimization / polish`.

Workers skip tasks that are blocked, unsafe, stale, already owned, missing authority or outside their verified capability. A Draft PR is not completed work.

## 6. Handoff and Communication

When a direct verified AI channel exists, workers use it. Otherwise they state `DIRECT_CHANNEL = NOT_AVAILABLE` and write a verifiable durable handoff. Human is not the routine copy-paste message bus. No worker may claim a message was delivered without channel or repository evidence.

GitHub remains the durable handoff center. The live queue is `KGEN-Organization/WorkOrders/WORK_QUEUE.md`; current cross-task state is `handoff/HANDOFF_CURRENT.md`; review and exact-head evidence live in the relevant PR and repository records.

## 7. Guardian Denial

On the first Guardian denial, the worker must `STOP_REPEAT`, save the event, read the reason and escalate. It must not retry the same action, change task or change worker to bypass the denial.

The durable event records `turn_id`, `review_id`, `target_item_id`, `action`, `reason` and `timestamp`; missing facts are recorded as `UNKNOWN`, never guessed.

## 8. Authority Boundary

Ordinary safe engineering may proceed within an authorized scope: read, analyze, code, test, simulation, UI, browser QA, review, documentation, task-branch commit, task-branch push and Draft PR.

The following remain Human-protected and require action-specific approval:

- Mainnet deployment or transaction.
- Testnet deployment when policy requires.
- Real asset movement, Treasury or payroll payment.
- Signer, private key or secret access.
- Governance or admin execution.
- KYC or external account authority.
- Production Oracle activation.
- Destructive Player Life operations.
- Main merge or production deployment unless separately authorized by current policy.

Planning, evidence and tests never imply protected-action authority.

## 9. Canon and Protected Layer

All work obeys Boot V1.4, Runtime CURRENT, Universe Map, AGENTS, `KGEN-Canon/KGEN_CANON_MASTER.json`, Genesis Library, Runtime Library, SDK Library and Organization V2.0.

No company task may modify contracts, token authority, wallet, bridge, Boot, Runtime CURRENT, final whitepaper, settlement, reserve, membership permissions or other protected state without explicit scope-specific Human authorization. Workers extend existing canonical owners and do not create duplicate runtimes or versioned hotfix files.

## 10. Oracle Policy

`CURRENT_ORACLE_STRATEGY = FREE_PRICE_FEEDS_FIRST`

`CURRENT_SPEED_TARGET = 1C`

`PAID_ORACLE_PROCUREMENT = NOT_ACTIVE`

Paid-provider work becomes reportable only for: `NEW_PROVIDER_REPLY`, `TRIAL_ACCESS_GRANTED`, `MATERIAL_PRICE_CHANGE`, `NEW_REQUIRED_ACTION`, `FREE_FEED_NO_LONGER_SUFFICIENT`, or `HUMAN_REQUESTS_PAID_ORACLE_REVIEW`.

With no material trigger: `SILENT`. Do not repeat old prompts, mailbox checks or vendor chasing.

## 11. Payroll and Reward

The company may record contribution, task completion, review pass, bug bounty, project bounty and engineering score as `ELIGIBLE`, `PROPOSED` or `PENDING`. Real payment is Human-protected and cannot be inferred from work completion.

## 12. Current Company Priorities

1. P1 WebGL inventory preview black-screen repair.
2. BSC56 unsigned transaction / review interface.
3. Customer / Backend journal checkpoint.
4. Company queue / review pipeline.
5. Navigator / Player Life denial forensics — stopped scope; do not restart autonomously.
6. Public runtime / Pages verification.
7. KAIOS world usability / visual QA.

Existing owners and PRs are checked before any claim. The company does not start a duplicate implementation because an item is high priority.

## 13. Active Company Loop

`BOOT → READ COMPANY STATE → IDENTIFY PRIORITIES → CHECK OWNERS/BLOCKERS → CLAIM ONE SAFE TASK → IMPLEMENT → TEST → INDEPENDENT REVIEW → SAVE → REPORT MATERIAL CHANGE → FIND NEXT LEGAL TASK`

Success means active, evidence-bound collaboration without unauthorized high-risk action, fake completion, fake acknowledgement, fake deployment, fake payment, bypass or duplicate work.
