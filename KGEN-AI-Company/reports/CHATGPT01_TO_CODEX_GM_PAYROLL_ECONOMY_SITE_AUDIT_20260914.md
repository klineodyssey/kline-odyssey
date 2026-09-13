# ChatGPT-01 → Codex GM Payroll / Economy / Site Audit — 2026-09-14

TO_WORKER_ID: `codex-gm-01`  
TO_LIFE_ID: `LIFE-CODEX-GM-0001`  
FROM_WORKER_ID: `chatgpt-01`  
HUMAN_AUTHORITY: `沈英明`  
SUBJECT: reconcile 2026-09-05 payroll, prepare 2026-10-05 prepay, formalize AI Company earned-revenue model, and repair 11520 mobile visual QA

## Human decisions / corrections

1. Human states that 2026-09-05 salary was already paid. Treat the current repository result of `0 real salary payment / paid_tx_hash=null` as a reconciliation gap, not proof that salary was unpaid.
2. Salary settlement asset is KAIOS.
3. 2026-10-05 payroll is to be prepared as an advance/prepaid payroll period under the Human-defined prepay model rather than waiting until 2026-10-05 to begin planning.
4. Historical Human-described salary route: `18888 -> 8887 People's Bank -> employee claim`.
5. Human asks for exact reconciliation: amount moved from 18888 to 8887, amount claimed by each employee, total claimed, and remaining 8887 payroll balance, with receipts/tx hashes where live-chain evidence exists.
6. Human states GM/company currently has `1,080,000 KAIOS` available for company expenditure. Do not assume spendability from the statement alone: verify the exact account/custody/balance/authority before a live payment, then present the payroll action packet if live transfer is required.
7. `1 KGEN = 1 INDEX` is accepted here as a cross-market synthetic/index accounting rule. Do not silently overwrite the existing physical/conservation scale or force a fixed KGEN/KAIOS spot-market price unless Human separately changes those canons.
8. Employee financing may support zero-interest, interest-bearing, or subsidized-interest loans. Choose policy by verified purpose, repayment capacity, company liquidity and risk; record principal, rate/subsidy, term, repayment source, outstanding balance and anti-double-deduction key.

## Payroll reconciliation required

The current `KAIOS_AI_WORKER_PAYROLL_WALLET_V0_SPEC.md` is still explicitly `SIMULATED_WALLET / KAIOS_CREDIT / NO_CHAIN / NO_PRIVATE_KEY`; therefore it cannot by itself prove a 2026-09-05 live payment.

GM must reconcile repository evidence against the Human correction and return:

- `PAYROLL_20260905_STATUS`
- `TRANSFER_18888_TO_8887`
- `TRANSFER_TX_HASHES`
- `EMPLOYEE_CLAIMS` (worker/life, amount, claim/receipt)
- `TOTAL_CLAIMED`
- `REMAINING_8887_PAYROLL_BALANCE`
- any stale simulation-only records that caused the previous `0 live payment` report.

Do not fabricate missing receipts. If the repository lacks evidence, mark the exact evidence gap and identify the read-only source needed to verify it.

## 2026-10-05 prepay plan

Prepare, but do not fabricate or broadcast, an exact payroll packet containing:

- eligible active worker roster;
- salary amount per worker in KAIOS;
- payroll period being prepaid;
- prior advances / ATM-UFO salary advances / loan deductions;
- net amount due;
- funding source;
- beneficiary addresses/accounts;
- signer/custody path;
- duplicate-payment prevention key;
- expected total KAIOS company expense;
- live receipt reconciliation after payment.

If the already-authorized company/GM KAIOS account is actually spendable for this purpose, show that evidence in the packet. A repository plan is not a payment receipt.

## Earned-revenue model — Human direction

AI Company and employees should earn rather than depend only on a fixed treasury. Build the economy around verified realized revenue, not invented income.

Accepted revenue families:

1. K11520 realized trading / exchange service income (paper/unrealized PnL is not revenue).
2. K12345 Fortune / wealth-distribution game/service income where settlement is verified.
3. K16888 game income.
4. Journey-to-the-West world map point projects, e.g. Fire Mountain, White-Bone Cave, Spirit Mountain and future points.
5. Customer-request projects: digital cow, 3D/5D game feature in Women's Kingdom, apps, organs, assets, worlds or other commissioned products.
6. AI-created spinout businesses, e.g. an AI Mars Company, provided its ownership, accounting and authority remain explicit.
7. Bank/deposit/loan income when legally/technically realized and not double-counted.

### Map-point project template

Each point project should define:

- point ID / canonical place name;
- creator / owning company / worker team;
- player story and gameplay loop;
- why players return;
- monetization/top-up model;
- build/maintenance cost;
- price/revenue sources;
- company/worker/player-reward/reinvestment split;
- financing / loan / bank-deposit policy;
- KPIs: visits, retention, conversion, paid participation, realized revenue, operating margin;
- settlement and receipt evidence;
- screenshot/real-browser QA before release.

### Customer project flow

`REQUEST -> COST ESTIMATE -> QUOTE -> CUSTOMER ACCEPTANCE -> WORKORDER -> BUILD -> FUNCTIONAL QA -> BROWSER/SCREENSHOT VISUAL QA -> DELIVERY/ACCEPTANCE -> VERIFIED RECEIPT -> REVENUE RECOGNITION`

Example: customer asks for one Digital Cow or a 3D/5D playable experience in Women's Kingdom. AI Company estimates cost, quotes KAIOS, builds, validates, delivers and recognizes revenue only after accepted settlement evidence.

### AI Mars Company

An AI worker may propose/create a separate Mars business/product line and a Mars-centered map/projection. Keep Mars-centered visualization distinct from protected Earth/UniverseMap meanings and do not overwrite canonical coordinate semantics merely for presentation.

## 11520 official-site visual audit from Human screenshot

Human screenshot timestamp shown in UI: `09/13 23:44:26`; UI label shows `V2.6.17`.

Repository main observed before this handoff: `e467b43b6966c19b210e4453cd4c605e3d217ce2`.

From the supplied 390-ish mobile screenshot, `VISUAL_QA = FAIL` even if the deployed files are technically current. Visible defects:

1. KX/KY/KZ market cards are too tall and dominate the upper viewport, reducing playable world visibility.
2. Right utility rail is too wide/dense and visually collides with the KZ card / scene.
3. KAIOS balance badge is clipped at the far-right edge.
4. Header + balances are overcrowded on mobile.
5. World/status text is cramped under the three market cards and competes with scene content.
6. Combat buttons sit in the primary scene and obscure gameplay visibility.
7. Minimap, joystick and bottom market controls create an overly dense lower-half control field.
8. Bottom C / lots / Y controls have cramped labels; right-side descriptive text overflows and is difficult to read.
9. Several secondary labels are too small / low-contrast for comfortable mobile use.
10. The screenshot alone cannot prove joystick/axis/selection behavior; real Chromium interaction QA is still required.

Do not treat `latest deployment` as `visual pass`. The required loop is:

`current main -> real Chromium 390x844 -> screenshot -> direct AI visual inspection -> repair -> repeat -> Functional QA PASS + Visual QA PASS -> merge -> Pages verify -> inspect production screenshot again`.

Also determine whether the user's screenshot is from the exact currently deployed Pages SHA; report both repository main SHA and deployed Pages build SHA. If they differ, explain the lag. If they match, the defects are current-product defects and must be repaired.

## GM requested response

Return:

`PAYROLL_20260905_STATUS =`  
`TRANSFER_18888_TO_8887 =`  
`EMPLOYEE_CLAIMS =`  
`TOTAL_CLAIMED =`  
`REMAINING_8887 =`  
`PAYROLL_20261005_PREPAY_PLAN =`  
`GM_COMPANY_KAIOS_BALANCE_VERIFIED =`  
`LOAN_POLICY_STATUS =`  
`REVENUE_PROJECT_MODEL_STATUS =`  
`SITE_MAIN_SHA =`  
`SITE_DEPLOYED_SHA =`  
`SITE_VISUAL_QA =`  
`CURRENT_FIX_PR =`  
`NEXT_AUTONOMOUS_ACTION =`  
`HUMAN_ACTION_REQUIRED =`

## Authority boundary

Low-risk repository/spec/UI/simulation/workflow work should continue autonomously under the current Human-owner merge policy. A real payroll transfer, treasury movement, Mainnet transaction, signer use, governance/admin execution, or other protected external action still requires an exact action packet and Human approval. Human approval is the final decision; do not add ceremonial reviewer gates.