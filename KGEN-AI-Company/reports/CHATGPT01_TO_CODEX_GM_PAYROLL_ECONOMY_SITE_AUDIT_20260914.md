# ChatGPT-01 → Codex GM Payroll / Economy / Site Audit — 2026-09-14

TO_WORKER_ID: `codex-gm-01`  
TO_LIFE_ID: `LIFE-CODEX-GM-0001`  
FROM_WORKER_ID: `chatgpt-01`  
HUMAN_AUTHORITY: `沈英明`  
SUBJECT: reconcile 2026-09-05 payroll, prepare 2026-10-05 prepay, formalize AI Company earned-revenue model, repair 11520 mobile visual QA, and install player XYZ login/return-position rules

## Human decisions / corrections

1. Human states that 2026-09-05 salary was already paid. Treat any current repository result of `0 real salary payment / paid_tx_hash=null` as a reconciliation gap, not proof that salary was unpaid.
2. Salary settlement asset is KAIOS.
3. 2026-10-05 payroll is to be prepared as an advance/prepaid payroll period under the Human-defined prepay model rather than waiting until 2026-10-05 to begin planning.
4. **Correction:** the earlier `8887` value was a Human typo and must not be propagated. The intended bank/map point is **高老莊 K8888 人民銀行**. Historical salary route is therefore `18888 -> 高老莊 K8888 人民銀行 -> employee claim`.
5. Search/update any downstream handoff, report, variable, fixture or UI text created from this mistaken `8887` value. Do not preserve `8887` as an alias unless separate pre-existing canonical evidence proves it has an unrelated meaning.
6. Human asks for exact reconciliation: amount moved from 18888 to K8888, amount claimed by each employee, total claimed, and remaining K8888 payroll balance, with receipts/tx hashes where live-chain evidence exists.
7. Human states GM/company currently has `1,080,000 KAIOS` available for company expenditure. Do not assume spendability from the statement alone: verify exact account/custody/balance/authority before any live payment.
8. `1 KGEN = 1 INDEX` is accepted here as a cross-market synthetic/index accounting rule. Do not overwrite existing physical/conservation scale or force a fixed KGEN/KAIOS spot-market price.
9. Employee financing may support zero-interest, interest-bearing, or subsidized-interest loans. Choose policy by verified purpose, repayment capacity, company liquidity and risk; record principal, rate/subsidy, term, repayment source, outstanding balance and anti-double-deduction key.

## Payroll reconciliation required

The current payroll wallet specification is simulation-only and cannot by itself prove a 2026-09-05 live payment. GM must reconcile repository and settlement evidence and return:

- `PAYROLL_20260905_STATUS`
- `TRANSFER_18888_TO_K8888`
- `TRANSFER_TX_HASHES`
- `EMPLOYEE_CLAIMS` (worker/life, amount, claim/receipt)
- `TOTAL_CLAIMED`
- `REMAINING_K8888_PAYROLL_BALANCE`
- stale simulation-only records that caused any previous `0 live payment` report.

Do not fabricate missing receipts. If evidence is absent, state the exact evidence gap and the read-only source needed to verify it.

## 2026-10-05 prepay plan

Prepare an exact payroll packet containing active worker roster, salary per worker in KAIOS, payroll period, prior advances/loan deductions, net due, funding source, beneficiary account, signer/custody path, duplicate-payment prevention key, total company expense, and receipt reconciliation after payment.

## Earned-revenue model — Human direction

AI Company and employees should earn rather than depend only on a fixed treasury. Accepted revenue families include K11520 realized service/trading income, K12345 Fortune/wealth service income, K16888 game income, Journey-to-the-West map-point projects, customer commissions such as Digital Cow or Women's Kingdom 3D/5D games, AI-created businesses such as AI Mars Company, and verified bank/deposit/loan income.

Each map point (e.g. 火焰山、白骨洞、靈山、高老莊 K8888 人民銀行) may itself be a project/business node with creator/team, gameplay loop, return incentive, pricing/top-up, cost, revenue source, company/worker/player-reward split, financing policy, KPIs, settlement evidence and browser/screenshot QA.

Customer flow remains:
`REQUEST -> COST ESTIMATE -> QUOTE -> CUSTOMER ACCEPTANCE -> WORKORDER -> BUILD -> FUNCTIONAL QA -> BROWSER/SCREENSHOT VISUAL QA -> DELIVERY/ACCEPTANCE -> VERIFIED RECEIPT -> REVENUE RECOGNITION`

## 11520 mobile UI repair — Human-confirmed target

Current screenshot visual QA remains FAIL. Do not ask Human to choose layout details that can be derived from obstruction/overflow. GM may dispatch the repair, or the executing engineering worker may implement it directly under current safe-autonomous authority.

Required layout behavior:

1. **Top KX/KY/KZ cards:** keep all three visible, but the content block directly below them must no longer be covered. Prefer reserving explicit vertical flow space / moving the below-status block downward rather than allowing absolute-position overlap. Do not simply hide useful status text.
2. **Right utility rail:** collapse to **one master button by default**. Tapping it expands the complete utility stack; tapping again collapses all utilities back to the one master button. Reuse/upgrade the existing bottom-right menu button behavior rather than adding another permanent button.
3. Expanded rail must stay inside the viewport, avoid the KZ card and gameplay controls, and preserve tap targets.
4. **Three vertical controls (C / lots / remaining-axis joystick):** move the upper image/knob artwork to the right enough that it does not cover adjacent labels or controls. Keep the control hitbox and function unchanged unless required for safe layout.
5. The rightmost bottom label must be shortened to only the active axis form, e.g. `Y 縱搖桿` (and equivalently X/Z when active). Remove overflow prose such as `非負能階` from this compact mobile label; put explanatory semantics in expandable help/settings if still needed.
6. No text may extend outside its own control card or viewport.
7. Run repeated global/local expand-collapse tests and 390x844 Chromium screenshot QA.

Acceptance: no overlap under KX/KY/KZ, one collapsed utility master button, clean expanded rail, all three vertical controls readable, no clipped labels, functionality unchanged, visual QA PASS.

## KX/KY/KZ versus player XYZ — separation rule

Human clarification:

- `KX/KY/KZ` are **Universe boundary / market-axis values**. They are not the ordinary residential/industrial XYZ position of a player, house, factory or city.
- Ordinary life/player movement uses a separate **player-world XYZ** coordinate state.
- Do not bind player movement directly to settlement-authoritative KGEN balances/positions or mutate KX/KY/KZ merely because the avatar moves.
- KGEN market data may be used as the external live signal/judge for gameplay, but player XYZ remains a separate spatial state.

### Login / logout XYZ persistence

Implement a single canonical player-position lifecycle:

1. On logout/session end, persist the player's exact `XYZ` plus world/layer reference and timestamp.
2. On next login, restore that last valid XYZ exactly when available.
3. If no saved XYZ exists, derive a deterministic initial XYZ from the canonical KGEN chart/reference snapshot selected for bootstrap. Human intent is that **X, Y and Z initially use the same reference point/value**, then diverge only through player movement.
4. Resolve the initial point's Universe layer / K-distance using existing canonical Universe-distance/layer documents and formulas; do not invent an independent coordinate scale when canonical conversion already exists.
5. Store enough provenance to reproduce the bootstrap: source market/pair, source timestamp/block/snapshot, source K value/index, derived Universe layer/distance, and resulting XYZ.
6. Once initialized, avatar movement changes XYZ only; it does not rewrite the source KGEN settlement position.
7. Login restore takes precedence over bootstrap initialization.

This architecture prevents the playable XYZ world from being mixed with true KGEN settlement state while still letting the living KGEN market seed a location.

## Combat / market-volume design decision

Human wants gameplay to create meaningful activity without confusing physical XYZ and financial K axes. Engineering should prototype and compare these two bounded models in simulation/browser QA before choosing the production rule:

- **Model A — KGEN signal, KAIOS game settlement:** KGEN live direction/market movement judges combat. Player action aligned with the judged direction is pursuit/advantage; opposing action is attack/conflict. HP/rewards/costs settle in KAIOS game accounting. This preserves stronger separation from true KGEN settlement.
- **Model B — KGEN game stake/fee:** gameplay consumes/uses KGEN-denominated game action to create volume, but only through an explicitly isolated game settlement contract/ledger, never by silently mutating the player's spatial XYZ or core market position.

Default safety/architecture preference is **Model A first**, because it preserves separation of KGEN market truth from game HP/economy. Model B requires a dedicated settlement design, fee/reward accounting, anti-wash/anti-double-count protections and exact Human approval before any live token movement.

No fake volume, wash trading or circular self-trading is allowed. Any claimed market volume must come from genuine user-authorized economic activity and be reported distinctly from game telemetry.

## Map verification / canonical lookup

Human states that 高老莊 K8888 人民銀行 already exists on the world map. The current default-branch code-search index did not return a direct `高老莊`/`8888` text hit during this handoff. GM must verify the actual map source/path by repository traversal/runtime data rather than treating the failed text search as proof the point is absent. If the map stores numeric/encoded point IDs, resolve the canonical entry and link it in the closeout.

## GM requested response

Return:

`PAYROLL_20260905_STATUS =`  
`TRANSFER_18888_TO_K8888 =`  
`EMPLOYEE_CLAIMS =`  
`TOTAL_CLAIMED =`  
`REMAINING_K8888 =`  
`PAYROLL_20261005_PREPAY_PLAN =`  
`GM_COMPANY_KAIOS_BALANCE_VERIFIED =`  
`LOAN_POLICY_STATUS =`  
`REVENUE_PROJECT_MODEL_STATUS =`  
`K8888_MAP_POINT_VERIFIED =`  
`K8888_MAP_SOURCE =`  
`SITE_MAIN_SHA =`  
`SITE_DEPLOYED_SHA =`  
`SITE_VISUAL_QA =`  
`RIGHT_RAIL_COLLAPSE_STATUS =`  
`TOP_CARD_OVERLAP_STATUS =`  
`VERTICAL_CONTROL_LABEL_STATUS =`  
`PLAYER_XYZ_PERSISTENCE_STATUS =`  
`PLAYER_XYZ_BOOTSTRAP_SOURCE =`  
`COMBAT_SETTLEMENT_MODEL =`  
`CURRENT_FIX_PR =`  
`NEXT_AUTONOMOUS_ACTION =`  
`HUMAN_ACTION_REQUIRED =`

## Authority boundary

Low-risk repository/spec/UI/simulation/workflow work should continue autonomously under the current Human-owner merge policy. Real payroll transfer, treasury movement, Mainnet transaction, signer use, governance/admin execution or other protected external action still requires an exact action packet and Human approval. Human approval is the final decision; do not add ceremonial reviewer gates.
