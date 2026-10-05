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

## Contextual HUD candidate V2.9.5

- Work: Human 2026-10-05 12:43 UTC Settings / Market / Camera / Courier / Raid UI order.
- Owner: dot, TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER, HUMAN_AUTHORIZED_2026_10_05. The explicit temporary external-contributor exception applies; no Worker, Life, employee, payroll or treasury identity is claimed.
- Branch: dot/11520-contextual-hud-20261005; initial base b513d4e7ca87ebfb5adf5c03b8d2c26ff834b720. Exact head is the branch/PR commit containing this cumulative report, not a self-hash.
- Boot / must read: current root and 11520 AGENTS, PRIMEFORGE Boot, CURRENT Physics and Universe Map, Company OS Boot/manifest, Constitution, worker-registry gate with Human exception, Workspace Policy, DO_NOT_TOUCH and Human-owner merge policy. Open PRs and overlapping owners were checked before source edits.
- Existing ownership: Mobile UI Settings retains Market disclosure and its 15-second idle timer; Mobile Control Layout retains the three full-width market cards; Market/Wallet Layout retains utility visibility; the existing Camera owner and its handler retain all math and XYZ semantics; Logistics remains the only mission/raid owner.
- Exact left-circle source: game-5d-main.mjs creates #k11520CameraReset and assigns cameraReset.onclick. That existing handler resets zoom/pan/manual state and the existing recenter latch. The UI now shows it only while that owner marks the Camera manual, after its existing drag/pinch inputs. There is no desktop-wheel Camera handler to duplicate.
- Settings temporarily inerts known background controls and hides them through their existing owner. Closing or Escape preserves disclosure/preferences, returns focus and restores prior inert states. It does not snapshot and blindly replay visibility, so current mission eligibility remains authoritative.
- Market uses the existing 44px edge affordance, with no persistent BTC/ETH/BNB LIVE ticker. FULL also honors explicit collapse and the existing 15-second idle timer. Card geometry and symbol/price/k/alpha/theta remain intact.
- World action visibility is read-only metadata: active/review Courier or unclaimed approved insurance; range/window/cooldown-eligible existing Player Raid target or owned loot; Digital interception requires the existing read-only preview. Manual More access and all existing labels/handlers remain. No spending, raid resolution, timer recovery or settlement is invoked by rendering.
- Coordination: #505 owns paused Courier wording; #507 owns common test/CI stabilization; wallet M1 owns disjoint financial blocks in game-5d-main. V2.9.4 is reserved for M1; this HUD candidate uses V2.9.5, subject to current-main reconciliation before publication.
- Local checks so far: focused UI/portal 50/50 PASS, aggregate UI/runtime 181/181 PASS, syntax and diff checks PASS. New model tests exercise Settings state restoration, 15-second/held-pointer Market behavior, Camera context and adversarial mission eligibility.
- Browser evidence: PENDING resource-coordinated Chromium run. Existing responsive suite now has a focused six-size contextual mode, plus adjusted intentional UI assertions in normal coverage. Required sizes: 360x740, 390x844, 412x772, 432x856, 480x900, 844x390. Direct screenshots and exact-head review are required before PASS.
- FUNCTIONAL_QA: LOCAL_UNIT_PASS / BROWSER_PENDING. VISUAL_QA: PENDING. CI: NOT_RUN_FOR_THIS_HEAD. This is not ready for merge or publication yet.
- Safety: no contract, wallet settlement, Camera math, canonical XYZ, physics, protected Boot/CURRENT, registry, identity, secret, permission, mainnet, signed transaction or live-user save mutation. Parent owns merge and heavy-resource scheduling.

- Browser environment boundary: earlier local Chromium socket-policy and localhost denials remain respected; no local browser retry was attempted. Evidence uses the existing CI workflow.
- Added runner cost: one contextual-hud job, capped at 12 minutes per existing responsive batch, contents:read only and no persisted checkout credentials. Existing job budgets remain unchanged. Its gate requires exact-head report plus all six viewport screenshot sets; artifacts upload even on failure. Successful Pages deployment and explicit production QA use the same source-fingerprint-verified six-size path, not PR-only evidence.

- Ordinary browser-contract audit: smoke now requires Settings background hidden/inert and verifies restored controls, unchanged rail values and the original post-close actual movement checks. Living World distinguishes closed-window Raid from eligible World context, and reopens settled uninsured Courier history through More. Signed-C and existing FULL geometry observations disclose Market through its actual affordance if idle hiding already ran. Recenter tests now assert hidden initially, visible after native gestures with all five owned hit points, then hidden again on reset. No geometry/range/phase/economic assertion was weakened.
- Settings also temporarily suppresses canonical C/lots/Y rails through their existing layout owner (including the desktop slider wrapper), without changing dimensions, values or math. Source audit found no global movement/combat/Courier/Raid keyboard shortcuts; existing keyboard handlers are target-local except shared audio Escape. Settings owns Escape propagation and bounded Tab traversal. Browser tests exercise WASD/arrows while focused, preserve values/XYZ and verify restoration.

- Additional confirmed P1 input defects: active C/lots/Y captures survived visibility changes; landscape params-off lost its owning wrapper; chat-off lost to an older ID-specific display rule. Parent approved fixes in the existing signed-C, plane-joystick, vertical-input and layout owners. Settings-open cancels transient ownership and releases capture, not committed C/lots or XYZ; lost capture and old move/up cannot resume input. Ordinary blur-before-open remains unchanged, while Settings-active numeric commits cannot dispatch into hidden zero-height rails.
- New model coverage checks all three owners, competing contact, Settings cancellation, capture release, lost capture, stale move/up after close, fresh input and numeric commit ordering. Existing Chromium contextual mode now requires native three-contact interruption evidence at 390x844 and 844x390, plus per-viewport params/chat preference-retention screenshots.
- Read-only source review identified these issues before CI; fixes still require exact-head Chromium and direct screenshot inspection. Updated local checks: focused UI/portal 52/52 PASS; aggregate rerun recorded below. No visual/CI PASS is claimed.

- Post-fix aggregate UI/runtime: 183/183 PASS; syntax, workflow YAML, artifact-gate Python and diff checks PASS.

### Shared test dependency reconciliation (local, browser pending)

- SOURCE_PR: #507. Exact fetched remote head: e4b33676c251ba291a7faafce144ed762cc176a3. Base: b513d4e7ca87ebfb5adf5c03b8d2c26ff834b720. Imported only its existing Product desktop/mobile split and mandatory evidence, responsive geometry sampling, atomic KZ geometry and bounded public-diagnostic workflow fields.
- Additional parent-reviewed local control-through-strike patch source: dcf7b69f; patch SHA-256 0d3ea6f8198c9a91c3c5ea10375581cf4d6306c6381d5807ae4fcaf7831d4f76. This local F patch has NOT run browser QA. Its range, phase, body, timing, native-pointer and exactly-one-strike assertions remain unchanged.
- Shared reconciliation is isolated in a separate commit. The sole textual conflict was mobile KZ observation: retained #507 atomic geometry plus this UI candidate's explicit Market affordance reopening before that observation. Kept V2.9.5 and every intentional Settings/Market/Recenter expectation. No F branch was modified.
- Source checks: patch reverse-check, module syntax, workflow YAML and diff checks PASS. Combined exact-head full CI, native browser and visual evidence remain required; neither #507’s earlier run nor this source reconciliation validates the combined candidate.

### Shared Wallet foreground correction

- Source: M1/#509 owner's bounded local utility-only patch, SHA-256 0e1fce1301809d0c482f0bc5a8dd59ae10167c354bf5182839e660176079aa0c. Its screenshot finding was peer utilities covering Wallet help/actions. The supplied fix was local/unpublished and not browser-validated when integrated.
- Reconciled only syncUtilityMaster/layoutReport Wallet-open peer suppression, below Settings/current-preference precedence. Imported no M1 financial adapter, manifest, wallet balances, version stamp or transaction behavior. Closing Wallet restores the same tray state.
- The browser helper now tests a reachable sequence: Settings close, Wallet open with peer utilities hidden and actual control hit ownership, Wallet close restoring the tray. It does not force-click Settings while that launcher is deliberately hidden by Wallet ownership.
- Canonical-function model test verifies combined Wallet/Settings/preference precedence. Focused UI/portal 53/53 PASS; direct browser and visual evidence remain pending.

- Superseding shared Wallet-owner patch: SHA-256 7335a626bc4e2c425a9e1b573b39e7a03d42eab50109a00f6da20fdfa549443c. Adds HUD-collapsed exclusion so restore remains usable, hides active cargo/Courier peers while Wallet owns the view, and invokes the existing stack owner on close to recompute current eligibility. Settings and saved-preference precedence remain. The model test executes actual pin+sync twice across eligibility states; 53/53 focused PASS. Browser checks span normal owner ticks before testing no-occlusion and restoration.

### PR #510 first exact-head browser batch and bounded harness correction

- Draft PR: https://github.com/klineodyssey/kline-odyssey/pull/510. Published head: 6e2860ab75a8be98b826c9baa1ca06e8bbb0a7fe; tree eb433229a31a17751a00ec0b9d2ff961ad6ada63 exactly matches reviewed local 91daa4170b37780658ad4c6c6efb5ad0f373c92a. Base remained b513d4e7ca87ebfb5adf5c03b8d2c26ff834b720. Connector publication preserved the reviewed tree after native Git transport lacked credentials.
- At that exact head, Game Product push and PR, Universal Exchange push and PR, Portal, and world-first jobs passed. Responsive run https://github.com/klineodyssey/kline-odyssey/actions/runs/37334353264 reached the unchanged 12-minute limits in its contextual-hud and ordinary responsive jobs. Both always-upload steps succeeded; this is not an overall browser PASS.
- Contextual artifact 11356347783, SHA-256 c390dbce906341f23dbc128c599e93bda8d03e731e9444330448545ab57aa22b: 390/432/412/360 profiles completed with zero failures, including Settings restoration, preference retention, Wallet ownership, active Courier, manual Camera, and 15-second FULL Market hiding. The 390 native three-contact cancellation case passed. Landscape continued producing Settings, Wallet, camera, market, active-Courier and interruption screenshots until the deadline; its final assertions and the 480 profile are incomplete.
- World-first artifact 11355079704, SHA-256 df52c2ca8d16dc6c68e5039a3436f2a48ac4e1cc3e097689cd5141c5bb78d487: all six sizes passed runtime coverage. Direct review of 31 screenshots confirms readable three-card fields, true Market hiding and contextual Recenter. A transient Camera zoom-feedback chip partially overlaps the portrait XZ badge and, at 360px, one round action icon; do not claim the entire HUD is overlap-free.
- Contextual pixel review of 36 available screenshots confirms clear Settings close controls, hidden right utilities and unobstructed Wallet panels in the four completed portrait sizes and partial landscape captures. Portrait active Courier shows its compact truck/timer. Collapsed landscape uses the existing More gold-dot/accessible-title indication rather than a visible timer; the parent classified that as a disclosed P2 clarity item, queued separately. This correction stays test-only. The transient zoom-chip caveat remains disclosed; its actual hit-area impact must not be inferred solely from pixels.
- Ordinary responsive artifact 11355688408, SHA-256 f34e3040212e38de0b1e821df6f71cabda52bfdfeb203f82b17ae213e765ef28: screenshots also show continuing progress through landscape, not a frozen failing assertion. No report completion or full responsive PASS is claimed.
- Root cause of the budget regression: the new shared Settings inspection repeats 45 per-control scroll/actionability waits per invocation, plus Wallet inspection. Artifact timestamps show 76–98 seconds between the last pre-Settings and post-Settings ordinary screenshots. Contextual invokes that helper twice per viewport.
- Local test-only correction: settle dialog geometry once with a bounded frame wait, then native instant scrolling and immediate actual-center hit inspection for each control. Preserve all native clicks, all three Settings cycles, keyboard/focus checks, rail values, preferences, Wallet owner ticks, every viewport and all gameplay assertions. Remove only the first screenshot overwritten by the third-cycle capture at the same path. No runtime, runner-budget or financial changes. Added VM tests reject hidden Settings controls, blocked centers, unstable geometry and stalled frames. Aggregate 185/185 and UI/Portal 54/54 PASS; performance and exact-head browser validation of this correction remain pending.

```json
{
  "WORK_ID": "DOT-11520-CONTEXTUAL-HUD-20261005",
  "OWNER": "dot",
  "BASE": "b513d4e7ca87ebfb5adf5c03b8d2c26ff834b720",
  "BRANCH": "dot/11520-contextual-hud-20261005",
  "PR": 510,
  "TESTED_HEAD": "6e2860ab75a8be98b826c9baa1ca06e8bbb0a7fe",
  "HEAD_BINDING": "Current correction head is the PR commit containing this report; not a self-hash",
  "STATUS": "DRAFT_BROWSER_BUDGET_CORRECTION_PENDING",
  "COMPLETED": "Source fix, local tests, first exact-head browser batch, partial direct screenshot review",
  "BLOCKED": "Six-size contextual and ordinary responsive completion; next resource-coordinated batch",
  "TESTS": "185 aggregate / 54 UI-Portal PASS locally",
  "CI": "First head: six jobs PASS, two budget-cancelled; correction NOT_RUN",
  "SCREENSHOTS": "Six-size world-first reviewed; contextual four complete plus partial landscape, 480 pending",
  "SECURITY": "No financial execution, identity, permission, secret or live-user save changes",
  "NEXT_ACTION": "Source-review bounded test-cost correction, then parent-coordinated exact-head CI and screenshot review",
  "NEEDS_HUMAN_DECISION": false,
  "TIMESTAMP": "2026-10-05T15:58:00Z"
}
```
