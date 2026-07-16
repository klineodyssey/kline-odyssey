---
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human Architecture Review required"
SOURCE_COMMIT: "89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "HUMAN-CODEX-SWARM-001"
CHANGE_REASON: "Prevent self-review, self-dispatch and unreviewed Git integration inside Codex Swarm."
ANCESTOR: "KGEN-AI-Company/CODEX_REVIEW_AND_MERGE_RULES.md; KGEN-KAIOS/governance/autopilot/worker-swarm/COMPANY_DISPATCHER.md"
SOURCE_OF_TRUTH: false
---

# Codex Review, Dispatch And Git Separation

## 1. Separation Rule

For one artifact lineage, the following identities must differ:

```text
author_clone_id != reviewer_clone_id
reviewer_clone_id != git_clone_id
author_clone_id != git_clone_id
dispatcher_clone_id != cursor_worker_id
```

The parent Codex organization may coordinate the flow but cannot use that role to bypass identity separation.

## 2. Architecture Authoring

Architecture Clone or an authorized domain Clone may produce a Proposal. It must stop at evidence/handoff. It cannot label the Proposal approved, freeze a baseline, create implementation authority, review itself, or integrate its own branch.

## 3. Review Clone

Review Clone is review-only. It may:

- read fixed target refs and source baselines;
- run validation and non-mutating tests;
- inspect diff, links, schemas, secrets and protected paths;
- write review artifacts only to authorized review paths;
- return `APPROVE`, `APPROVE_WITH_AMENDMENTS`, `MAJOR_REVISION_REQUIRED`, `REJECT`, `BLOCKED`, or `HUMAN_REVIEW_REQUIRED` when the governing review contract permits.

It may not:

- edit the artifact under review;
- implement a fix;
- broaden scope;
- dispatch a Worker;
- merge or push the target;
- count internal review as external review.

## 4. Dispatcher Clone

Dispatcher Clone is the only Codex internal role that may operate Cursor dispatch. It consumes the existing Priority Scheduler and Company Dispatcher; it does not become a second dispatcher.

It may produce:

- eligibility decision;
- Task Envelope reference;
- atomic Claim request/result;
- Cursor routing message;
- Review/Repair custody routing;
- Close/Release request.

It cannot edit program, Architecture, Runtime, review findings, or Cursor output. Until canonical Claim authority exists, automatic dispatch remains disabled and any permitted pre-cutover assignment must be explicitly marked non-atomic.

## 5. Git Clone

Git Clone performs repository mechanics only after an accepted Review and authorized Release message:

```text
fetch
-> freshness and ancestry check
-> protected and secret check
-> integrate reviewed commit/tree
-> deterministic index or closeout update when authorized
-> test
-> commit/push permitted ref
-> release evidence
```

Git Clone cannot:

- change the reviewed behavior during conflict resolution;
- approve a diff;
- merge a branch whose exact reviewed tree changed;
- push protected or production-sensitive changes without exact Human authority;
- force push;
- use Human Main as integration workspace.

A semantic conflict returns to Repair and Review.

## 6. Testing Clone

Testing Clone may execute the required tests from a fixed target ref and produce content-addressed evidence. It cannot alter application source to make tests pass unless a separate implementation Claim explicitly allows test-source changes. It cannot approve the artifact.

## 7. Complete Flow

```text
Decision / current authority
-> Architecture or implementation Claim
-> Author Clone
-> Evidence
-> Review Clone
-> APPROVED or REPAIR
-> Testing evidence as required
-> Release authorization
-> Git Clone
-> integration evidence
-> Close / Release
```

Cursor work enters the same flow through Dispatcher Clone and Cursor Handoff. Cursor remains unable to review, merge, push main or release itself.

## 8. Conflict Of Interest

Review assignment is denied when:

- same Clone, Session or internal actor authored the target;
- reviewer wrote target files or directed hidden changes;
- reviewer shares the same active Claim;
- reviewer has an unresolved dependency on the outcome;
- required external independence cannot be met internally.

The result is reassignment or `HUMAN_REVIEW_REQUIRED`, never lowered review quality.

## 9. Current Boundary

No Review, dispatch, Claim, Git operation, merge, push, release or implementation is authorized by this document.
