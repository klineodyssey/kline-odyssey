# HANDOFF_CURRENT

STATUS: INITIAL

本包為 AI 必讀開機與神經索引基礎包。

## Universal CI salary fixture engineering handoff

This bounded technical report grants no Life, Worker, employment, payroll, Treasury or chain authority. Current exact-head CI and PR linkage are maintained in the PR description.

```json
{
  "work_id": "DOT-UNIVERSAL-SALARY-DATE-20261005",
  "owner": "dot",
  "role": "TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER",
  "authorization": "HUMAN_AUTHORIZED_2026_10_05",
  "status": "DRAFT_CANDIDATE",
  "branch": "dot/universal-salary-date-fixture-20261005",
  "base_sha": "53692530f9e161a0d56592ba69a6a81ff74236c4",
  "head_sha": null,
  "head_binding": "Resolve branch/PR exact head; this artifact is included in that commit, not a self-hash",
  "pr": null,
  "scope": [
    "tests/universal-exchange.test.mjs",
    "handoff/HANDOFF_CURRENT.md"
  ],
  "root_cause": "Fixed 2026-10-05 due-date fixture expired against the host clock",
  "test_clock": "TestContext-restored Date.now mock at fixture epoch; strict due-date boundary assertions retained/expanded",
  "tests": {
    "baseline": "420/421 PASS; salary due-date failure",
    "fixed": "421/421 PASS, no skips (Node 24.19.0)",
    "future_host_clocks": "2040 and 2100 focused PASS",
    "syntax": "PASS"
  },
  "ci": "PENDING_EXACT_HEAD",
  "production_salary_validation": "UNCHANGED",
  "production_file_sha256": "f8edd773037d3a0fe847bc78b9378e5090720168fa5923a85fc2dd11ccb271d4",
  "security": {
    "secret_scan": "PASS",
    "runtime_changes": false,
    "identity_or_workforce_grants": false,
    "payments_or_chain_writes": false
  },
  "review": "Self-review only; not independent review",
  "next_action": "Push candidate, open Draft PR, verify exact-head Node20 CI; coordinate with parent before merge",
  "updated_at": "2026-10-05T03:10:55.875642+00:00"
}
```

## Player Courier clock-review recovery candidate

### BOOT / MUST READ
- Work ID: DOT-COURIER-CLOCK-RECOVERY-20261005; owner: dot.
- Role: TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER, HUMAN_AUTHORIZED_2026_10_05. No Worker, Life, Employee or payroll identity adopted or created.
- Read current Boot entry, Physics CURRENT, map reference, root/local AGENTS, registry/workspace/protected-path/claim guidance, current logistics owner and tests. Registry unchanged; existing temporary external-maintainer exception only.
- Existing runtime remains `K線西遊記/temples/11520/runtime/digital-ant-logistics-runtime.mjs`. No parallel runtime or new versioned organ.

### PROTECTED PATH CHECK / TASK PLAN
- Scope: local non-financial Player Courier timer recovery plus regression tests. Preserve mission/cargo ownership, durability, economics, insurance evidence and original settlement receipt identity.
- No contracts, wallet implementation, Boot/CURRENT, registry, signer, secrets, real tokens, company payroll, Treasury, KYC, permissions or live player storage changes.
- Separate branch `dot/courier-clock-recovery-20261005`; base `27a21b031afad333468d9d3847d1933bc053487e`, re-fetched 2026-10-05T08:47Z.
- Dependency: #498 owns the HUD. Its branch is unchanged. UI patch is staged against exact `77cc3adfbd2a3922a3de162debfc43269334a9f0` for later application after main integration; it is not part of this core-only checkpoint.

### EXECUTION / BOUNDED RECOVERY
- Baseline regression reproduced permanent CLOCK_REVIEW after deadline/reload and failed because no recovery API existed.
- Explicit player confirmation plus current preview revision is required. Eligible missions conservatively restart the complete original duration; old wall expiry never proves completion.
- Eligible legacy records must have strict original timeline, active courier-owned surviving cargo, local-game flags, and empty raid history. Prior-raid or ambiguous records stay paused with records retained; this is not universal recovery of all saves.
- Original raid-window timestamp remains unchanged. Recovered mission-local policy time equals original startedAt plus newly verified monotonic elapsed. Original window duration/cooldown and raid costs/limits remain unchanged; subsequent attempt records explicitly identify this clock domain. A further clock anomaly with raid history remains fail-closed.
- Cooperative Web Locks serialize recovery admission and hold a mission-scoped clock lease for its active lifetime. Reload/revision check occurs inside the lock. Followers cannot mutate/observe/settle the recovered active owner. Owner loss requires another explicit confirmation after review. Missing Web Locks fails closed.
- This does not make all localStorage operations globally atomic. Old/uncooperative cached clients do not honor the new lock; mixed-version clients remain a limitation. No trusted external clock is claimed. Current game tab/session must remain open; reload/closure/new anomaly pauses again. Normal in-game movement/combat remains available.
- Recovery never charges, pays, recreates cargo, cancels or refunds. Existing interrupted-insurance reconciliation may reuse already-paid evidence only; it must not charge again.

### FINAL REPORT / PERSISTED CHECKPOINT
- Head binding: resolve exact branch/PR head; this report is committed with it, not a self-hash.
- PR: pending creation; exact URL/head and CI maintained in PR body.
- Status: INCOMPLETE_DRAFT_CORE_CHECKPOINT; NOT_READY_TO_MERGE.
- Tests: 85/85 runtime tests PASS locally; syntax and diff-check PASS. Related aggregate174/174 PASS on this checkpoint.
- Tests cover confirmation, strict malformed records, original receipt/dedupe, full elapsed duration, terminal/ownership rejection, rollback/drift, policy window/cooldown, prior-raid fail-closed, sequential stale preview, synthetic cooperative concurrency, delayed acquisition/disposal and passive mutation rejection.
- Independent scoped core review reran the prior disposal/follower reproducers and85/85 tests; no remaining scoped core blocker found. This is not browser/visual approval.
- CI: NOT_RUN for this new head. FUNCTIONAL_QA: LOCAL_CORE_PASS_ONLY. VISUAL_QA: NOT_RUN. Actual simultaneous Chromium tabs and UI integration: NOT_RUN / PENDING.
- Remaining: refresh main after #498, apply/review staged UI patch, test real shared-context concurrent tabs and owner closure/reload, inspect mobile/landscape screenshots, run exact-head CI. Parent technical/risk review required; worker must not merge.
- User's actual stored mission is untouched; eligibility and recovery of that mission have not been established.
- Updated: 2026-10-05T08:48:00Z.
