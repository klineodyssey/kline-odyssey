# K18911 KUFO annual-cohort integration review

## KUFO 本頁自主接續 checkpoint

### KUFO-CONTINUATION-20261108T092351Z — first autonomous work round

- Trigger: direct Human request in this conversation, not a scheduled invocation.
- Actual author: this page's Codex /root engineering session; formal employee/Writer identity NOT_VERIFIED. Private thread binding is retained in the original conversation, not published here.
- Started: 2026-11-08 09:23:51 UTC / 2026-11-08 17:23:51 Asia/Taipei.
- Previous handoff/source head: c4b50afd9f63a9e946f84fd27249920728b9cfd8; previous exact-head CI: [42463391611](https://github.com/klineodyssey/kline-odyssey/actions/runs/42463391611), 33 contracts / 128 tests.
- Main read back: c5cc66e5d2dc7e193bb21a57b9a4e5b7dc70fde3. Source #201 and #600 remain the original task/research; the [company index #573](https://github.com/klineodyssey/kline-odyssey/issues/573) is a read-only coordination index, not a new claim or authority.
- First-round action: extend the existing EVM acceptance file with actual reverted-transaction state snapshots. Eight rejection cases verify full relevant rollback, including allowance reduction, partial tranche mutation, converter sequence, real KAIOS burn/proof consumption and closed issuance calendar. Existing tests are retained; Solidity and dependency sources are unchanged.
- Local verification finished: 2026-11-08 09:38:50 UTC / 2026-11-08T17:38:50.000+08:00. PASS: complete EVM file 17/17, fail 0, skip 0, 484,276.0595 ms. New rollback case: 8 actual reverted local-EVM transactions, 44,019.4485 ms; receipt status zero, no persistent logs, relevant contract snapshots unchanged. ETH gas, nonce and block effects are intentionally excluded from token-state snapshots.
- Tested EVM source blob: 3a81351120863b64446ef7484f8a50708b557ac4 (+152 lines). Independent review found no blocking defect. Core and policy retain blobs f597188daeca6bd9e23f90a6190f0349e88408de and 875f8a5411eb3162779382baf58487479e486577. No contract, dependency, calendar or economic rule changes.
- Eight actual rejection cases: over-balance transfer; over-balance transferFrom with valid allowance; available mature amount plus one unit; unauthorized KUFO mint; unauthorized carrier burn; unauthorized KSHIP proof mint; current output replay of an already used mint proof; closed-calendar furnace with valid KAIOS allowance. All relevant supplies, balances, tranches, allowances, counters, consumed flags and burn/origin proof records are restored.
- Remaining verification at checkpoint save: exact new-head hosted CI and remote save readback. Their final receipt is retained in this same conversation and the commit-bound CI artifacts; the previous 128-test run is not used to assert the new head passed.
- Blockers: formal annual boundary/zodiac anchor/finite issuance horizon and CURRENT wording reconciliation remain unapproved; original #201 Writer/lease remains unverified. These block adoption/deployment, not independent authorized testing on this continuation branch.
- Save destination: this existing cumulative document and review/kufo-annual-cohort-core-20261106; no parallel handoff file, product, Runtime or PR.
- NEXT_ACTION: on the first real scheduled wake (or Human “有更新”), read this checkpoint and Prompt V1, record the actual trigger/thread/run evidence or UNKNOWN, then verify latest remote HEAD/CI and any new formal-calendar or original-Writer evidence. If no new eligible work or changed source exists, record STANDBY and the concrete recovery condition rather than rerun the same tests. Preserve a next action in the same document and this conversation.

### Schedule readback

- Name: KUFO 仙丹｜本頁工程接續.
- Duplicate check: ten local automation records and the available hosted automation inventory contained no same-purpose task bound to this page. Other pages' schedules were read only.
- Desktop scheduling interface: unsupported for this execution page (“Automations are only supported for local threads”); not retried or treated as a permission waiver.
- Supported hosted scheduling interface: creation succeeded and a separate readback confirmed is_enabled=true, self-owned task, inherited execution environment, Asia/Taipei, and exact current-page binding.
- Frequency: daily at 09:15 Asia/Taipei. Saved first scheduled slot: 2026-11-09 09:15 Asia/Taipei / 2026-11-09 01:15 UTC.
- Host-confirmed next_run_time: NOT_RETURNED (null). Last-run/result receipts: unavailable; delivery unknown. Configuration is verified; a real automated wake/completion is NOT_VERIFIED.
- Prompt version: KUFO 本頁自主接續 V1; SHA-256 (UTF-8, LF, no BOM or trailing newline): 918fe3ad810540565ed4ace030e6ddb97bc45d8fda2811e1b91b4c28539509df. The exact saved prompt follows. Schedule identifiers and private thread IDs remain in the original conversation.
- No runnable game/UI is introduced by this round; this is a source and local-EVM review candidate.

### Exact saved schedule Prompt

```text
【KUFO 本頁自主接續 V1】
你是本頁 KUFO 仙丹候選工程協作，不冒認衡曜、數位螞蟻或原 #201 Writer。原工單：https://github.com/klineodyssey/kline-odyssey/pull/201；保留研究：https://github.com/klineodyssey/kline-odyssey/pull/600。需核分工時唯讀查原公司索引 https://github.com/klineodyssey/kline-odyssey/issues/573，不自動留言或另建工單。

交接唯一位置：C:/Desktop/kline-odyssey/2026-11-06/task/kufo-candidate/KGEN-KAIOS/KAIOS_18911_KUFO_THREE_AUTUMNS_V4.md 的「KUFO 本頁自主接續 checkpoint」及本對話最新回報。遠端沿 review/kufo-annual-cohort-core-20261106 同一路徑讀回；本機不存在時先核對遠端來源，不假設暫存證據仍在。本頁接續分支不等於原 #201 已接管。c4b50afd 的128項CI是歷史證據，不能轉貼成新版本通過。

每次實際喚醒，或 Human 說「有更新」，先讀最新 Human 指示、這份 Prompt 和最後 checkpoint；按現行 AGENTS 核對 Boot V1.4／正式 Boot、Physics CURRENT、正式宇宙地圖、AGENTS、Worker Registry、原 claim／Writer／HOLD，再核最新 main、候選 HEAD、未提交修改及同檔碰撞。來源變動標 STALE；保留 Human 與其他作者修改，不自行取得員工或 lease 身分。

從原授權內選一件可驗收的小型源碼、測試、審查或證據保存工作，直接做並驗證。優先沿 checkpoint 的 NEXT_ACTION，使用既有 KUFO 合約、政策、測試與 CI；不另造 Runtime、ledger、bootstrap、任意版本或平行產品。相同來源已有可靠驗證時沿用，不重跑未變的大型測試；有變更才跑相關本機測試與精確 head CI，讀回結果及來源雜湊。普通修改、commit、push 僅限本頁接續分支和已授權範圍；新檔遵守既有索引規則，累積文件保留歷史。

保留年界50/75/100%、第三年全清零、轉帳保齡、不在一般交易結算、KGEN餘額證明及KSHIP守恆規則。正式年界／生肖錨點／有限發行期間未核定與CURRENT文字衝突不得靠測試樣本補成正典。原 #201 Writer／lease 未核實時不覆寫其分支、不強推。不得自動 merge、close PR、刪 branch、部署、送外部鏈交易、移動真資產、讀取或使用私鑰／seed／秘密、簽署、付款或治理；不改他頁排程、Registry 或 WorkQueue。不聯絡其他人。單一阻塞只停該依賴，先做其他合法部分；實際權限拒絕不換路徑繞過。沒有可推進項就記 STANDBY 與恢復條件，不製造需求或進度。

每輪在同一交接文件追加並讀回：RUN_ID、實際作者／thread、觸發來源（未知填UNKNOWN）、台灣與UTC起訖、main與HEAD、動作、修改檔、測試及證據、commit／遠端讀回、阻擋、需要Human決定的事項和一個具體 NEXT_ACTION。排程已設定、真正觸發、開始、完成、驗收、保存、合併與部署分開記錄；無法寫檔就在本頁留完整交接。使用並維護本頁同一排程，沒有新理由不改頻率、不新增重複排程。
```



## Review automation continuation — 2026-11-08

This stage continues the same Product 05 review branch after initial implementation
commit `3c92efd72a12404f95d95c573e428434d8c26e55`. Latest main and the original
#201/#600 heads were read back unchanged. The current branch is still a review
candidate; neither the formal calendar nor the finite issuance horizon is approved.
The Solidity core and pure policy source blobs are unchanged in this stage.

The original #201 workflow path `.github/workflows/kaios-kufo-v4-review.yml` is
restored and updated in place. It now tests this continuation branch as well as
the original branch and future main/PR changes. It checks out and asserts the
exact source head, retains the full history required by the frozen TempleHeart
baseline, installs the existing lock without lifecycle scripts, compiles the
complete contract set, and runs storage, lineage, all contract/security/policy
tests and the preserved #600 research tests. It has read-only contents permission,
does not retain checkout credentials, and contains no deployment or chain call.
The three v7 action SHAs were resolved against their official repositories.

Every run uploads JUnit XML, the actual test log and `evidence.json`, named for the
tested head. Evidence binds the head, comparison base, workflow blob, historical
baseline, source Git blobs/SHA-256 values, dependency versions and step outcomes.
Compiler/validator records are included only if that step succeeded in the same
run; checked-in historical PASS files cannot masquerade as fresh run evidence.
Hosted CI success must be read from that head's actual run, not inferred from
this workflow's existence or the initial local results below.

Two fixed-seed, 60-operation EVM sequences add independent conservation checks
across five holders and multiple shared years, including a skipped year. The
oracle uses observed balances/tranches and timestamp-derived eligibility; it does
not import the production split function or reproduce its allocation formula.
It verifies per-holder/year balances, global KUFO/KSHIP conservation, transfer
tranche preservation without settlement, immutable proof origins, allowance spend,
and a complete terminal drain. These supplement the existing explicit rounding,
replay, failure rollback, settled/unsettled merge, dust and maximum-history tests;
the seeded successful-operation sequences do not replace those specific checks.

| Current-stage local check | Result |
|---|---|
| Updated complete EVM file | PASS: 16/16, fail 0, skip 0; 344,220.6503 ms. |
| Seeds `0x5eed0280`, `0xc0ffee11` | PASS: 60 mixed operations each, plus five bootstrap mints and five terminal sweeps each; 164 local transactions total. |
| Final conservation | All holder KUFO balances zero; minted/burned 16,240 and 17,986 wei respectively; KSHIP exactly burn x1000. |
| Added-state-machine maximum operation gas | 321,427. Existing dust and 32-cohort gas checks also passed unchanged. |
| Policy, KSHIP interface and preserved research | PASS: 21/21; simultaneous spec/JUnit reporters also verified. |
| Existing security-surface suite including KUFOV4 | PASS: 65/65 including imported nested regressions. |
| Official actionlint 1.7.12 | PASS; downloaded release checksum verified. |

The updated EVM source blob is `67f6b572fc215de8be7a9026c96f1debd9f82275`.
No Solidity or dependency source changed, so the existing compiled artifacts retain
the initial verified core blob; hosted CI recompiles the complete source independently.

The existing token-surface security guard now includes `KUFOV4`, and the existing
KSHIP-interface test also rejects mutable calendar, registry, arbitrary burn or
proxy-upgrade entry points. No production Runtime, ledger, deploy script or
parallel product is added. This stage's local and hosted validation is separate
from the initial implementation evidence preserved below.

Original #201 writer/lease authority remains unestablished. An empty claim list
does not prove a lease expired or identify this session. The same read-back
evidence remains in [the original GM discussion](https://github.com/klineodyssey/kline-odyssey/issues/584#issuecomment-6154939875).
The authorized continuation branch can progress independently; adopting it into
#201 still requires a verified coordinated writer update. No parallel PR, merge,
PR close, branch deletion, deployment or asset operation is performed.

### Initial implementation record (preserved)

STATUS: REVIEW_CANDIDATE / NOT_DEPLOYED
SOURCE_MAIN: c5cc66e5d2dc7e193bb21a57b9a4e5b7dc70fde3
CORE_VERSION: 4.1.0-candidate
AUTHORITY: Direct Human task instruction for bounded source engineering and review-branch preservation only.

This is the continuation of Product 05 from PR #201 using the unique research of
PR #600. It is not another product, Runtime, ledger, deployment or task claim.
The historical PR #201 specification is preserved below as superseded source
history. The complete candidate specification is in the cumulative
`KGEN-KAIOS/docs/KUFO_V4_WHITEPAPER.md` and `KGEN-KAIOS/docs/KSHIP_V4_WHITEPAPER.md`.

## Source merge and preservation plan

| Source | Exact head | Disposition |
|---|---|---|
| main | `c5cc66e5d2dc7e193bb21a57b9a4e5b7dc70fde3` | Sole integration base. |
| #201 `gm/k18911-kufo-three-autumn-final-v4` | `8b4ccd8c008886f82853ba0f0c064b9217e73894` | Selectively reuse existing Product 05 paths; 620 commits behind main and 36 ahead. No whole-branch overlay. |
| #600 `review/kufo-zodiac-cohort-offchain-20261016` | `2062b7b94959cf5e0d4aaf408677505bb4bcb6e1` | Preserve all three research files byte-for-byte; policy reuses its calendar parser and zodiac ordering. |

Reused #201 source paths, with annual-cohort changes in place:

- `KGEN-KAIOS/contracts/KUFOV4.sol`: shared annual cohorts, immutable bounded calendar, remaining tranches, proof provenance and lifetime cap.
- `KGEN-KAIOS/contracts/KAIOSAlchemyFurnaceV4.sol`: existing immediate KAIOS burn and current KGEN balance proof.
- `KGEN-KAIOS/contracts/KUFOOutputJindouyun168888V4.sol`: existing fixed-beneficiary output.
- `KGEN-KAIOS/runtime/kufo-v4-policy.mjs`: pure versioned-calendar and tranche projections; no execution or second ledger.
- `KGEN-KAIOS/tests/contracts/KUFOV4EvmHarness.sol`: in-memory EVM-only adversarial test actors.
- `KGEN-KAIOS/tests/kufo-v4-evm.behavior.test.mjs`: annual, authorization, conservation, gas and dust regressions.
- `KGEN-KAIOS/tests/kufo-v4-kship-interface.unit.test.mjs`: unchanged main KSHIP proof ABI compatibility.
- `KGEN-KAIOS/tests/kufo-v4-three-autumns.unit.test.mjs`: annual policy and exhaustive integer split properties.
- `KGEN-KAIOS/docs/KUFO_V4_WHITEPAPER.md`, `KGEN-KAIOS/docs/KSHIP_V4_WHITEPAPER.md`, and this file: full cumulative editions, with predecessor text retained as historical material.

Main's `KGEN-KAIOS/contracts/KAIOS.sol`, `KUFO.sol`, `KSHIP.sol`,
`KSHIPConverter.sol`, deployed V1 archive and `tools/compile-contracts.mjs` stay
unchanged. The compiler still loads the git-bound TempleHeart V3.3.2 baseline
from `7344d231837d40b504622c8c8b4376ed25110e20`.
At the initial implementation stage the old workflow and all three 11520
HUD/browser paths were excluded. The continuation above restores only the same
review workflow path with current checks; all three HUD paths remain excluded.

## Preserved unique research and audit evidence

| Path | Original Git blob |
|---|---|
| `KGEN-KAIOS/research/kufo-zodiac-cohort-v0.mjs` | `c8fb59c2c1122140acd47f4e7b7aa4226afe4404` |
| `KGEN-KAIOS/research/kufo-zodiac-cohort-v0.test.mjs` | `b0c050ad099c7dc2d61e0d1240acd840eb52ed07` |
| `KGEN-KAIOS/research/README-kufo-zodiac-cohort-v0.md` | `f9a9f6df904963e3cda8fac8e786668c1fd0bb3e` |

All three research files, including `sameRuntimeLatency`, are retained unchanged.
The research file has nine tests; its old PR body reported eight. Its January 1
fixtures are explicitly noncanonical and its simulation-only restrictions remain
part of the preserved source, not deployment authority for this candidate.

The PR201 audit branch head `3a227d4b73ce792ee012e848daae16c1a0febe1f`
preserves `KGEN-Organization/WorkOrders/KAIOS_PR201_KUFO_KSHIP_LINEAGE_SECURITY_AUDIT_R0_20260920.json`
blob `a2201cebac164d994802408da01801af41d0dff1`, already identical to main.
The PR158 audit branch head `dac29f2a459cde9ec725355e9e9190423e4cc6fe`
preserves `KGEN-Organization/WorkOrders/KAIOS_PR158_ALCHEMY_KUFO_KSHIP_LINEAGE_AUDIT_R0_20260921.json`
blob `36f0addbe0bcc76eb8c9bac8109814385275b00a`, also already identical to main.
Those records are preserved as audit history and are not rewritten as current
execution permission.

## Implemented rules and gas bound

Same configured birth year means the same cohort. At the first shared boundary,
50% of original mint amount is eligible; at the second, 75% cumulatively; at the
third, all outstanding KUFO and integer residual are eligible. Eligibility is not
an automatic on-chain transaction: the holder calls the existing converter to
settle. No ordinary transfer or mint performs settlement. A year-end birth can
reach its first boundary seconds later. Transfers preserve the birth year and
all remaining tranche amounts, including already-matured unclaimed rights.

The calendar constructor takes a nonzero version hash, first year, zodiac anchor
and strictly increasing explicit timestamps. N issuance years require N+3
boundary timestamps, with 1<=N<=32. Minting ends at boundary[N]; the last cohort
reaches its third boundary at boundary[N+2]. Settlement remains available forever
after that timestamp. No cohort index is wrapped, reused or dynamically appended.
Thus all transfer/settlement loops visit at most 32 slots, even for dormant
accounts and arbitrarily many unsolicited receipts. This finite issuance horizon
is a candidate design choice requiring approval before production.

Remaining first/second/terminal tranches coalesce by addition. Partial transfer
partitions cumulative tranche targets by full-precision proportional floor, then
subtracts the child from the parent. Targets are never recomputed on receipt.
Mint rounding is per proof; actual furnace outputs are multiples of 1,000,000
KUFO wei and divide exactly by four. Artificial one-wei test mints demonstrate
terminal cleanup. Lifetime KUFO issuance is capped as well as circulating supply,
so prior conversion cannot create room for KSHIP entitlements above its cap.

Immutable origin records retain proof beneficiary, amount, timestamp, birth year
and zodiac. Constellation is explicitly `0 / UNCONFIGURED`; no astrological
boundaries are guessed. Shared balances are fungible within a birth year; origin
events and records do not claim a unique per-coin ancestry after merging.

Protocol minting remains 0.001 KAIOS plus current balance >=0.000001 KGEN for
1 KUFO. KGEN is observed only: no transfer, burn, lock or allowance. KAIOS holder
allowance is spent by the unchanged KAIOS core. Merchant quotes, inventory,
profit and subsidy are separate commercial accounting; a restaurant quote of
100/1000/2000 KUFO per KAIOS does not alter protocol minting.

## Validation evidence

Local validation used Node `v24.12.0`, npm `11.6.2`, Solidity
`0.8.24+commit.e11b9ed9.Emscripten.clang`, OpenZeppelin Contracts and
Contracts Upgradeable `5.0.2`, ethers `6.13.4`, and Ganache `7.9.2`.
The existing package and lock files are unchanged. Windows installation required
`npm ci --ignore-scripts --force --omit=optional --offline=false` because the
existing Ganache lock includes a Darwin-only fsevents entry. No lifecycle scripts
ran. Ganache used its JavaScript fallback because its optional native uWS binary
does not support this Node build.

| Check | Local result |
|---|---|
| `node tools/compile-contracts.mjs` | PASS: 33 contracts, zero warnings, no EIP-170 oversize; KUFO deployed bytecode 9,501 bytes; baseline retained. |
| `node --test --test-isolation=none --test-reporter=spec tests/kufo-v4-evm.behavior.test.mjs` | PASS: 14/14, fail 0, skip 0; 106,466.8125 ms. |
| policy + KSHIP interface + preserved #600 research tests | PASS: 20/20, fail 0, skip 0. |
| existing TempleHeart, token-lineage unit/fuzz/invariant and surface-security suites | PASS: 91/91 including nested imported security regressions; fail 0, skip 0; 305,734.7293 ms. |
| `node tools/validate-templeheart-storage.mjs` | PASS: 58 preserved, 15 appended. |
| `node tools/verify-current-lineage.mjs` | PASS. |
| `node tools/validate-integration-artifacts.mjs` | PASS: complete 18-file scope, UTF-8/JSON/links/secret-pattern checks clean. |
| independent integer tranche enumeration | PASS: 185,193 vectors over each tranche 0..18 and every valid transfer size. |
| `git diff --check` and exact #600/audit blob preservation | PASS. |

Commands run from `KGEN-KAIOS/`. Policy/interface/research command:

```text
node --test --test-isolation=none --test-reporter=spec tests/kufo-v4-kship-interface.unit.test.mjs tests/kufo-v4-three-autumns.unit.test.mjs research/kufo-zodiac-cohort-v0.test.mjs
```

Existing regression command (local in-memory providers/mocks only):

```text
node --test --test-concurrency=1 --test-reporter=spec tests/templeheart.integration.test.mjs tests/token-lineage.fuzz-invariant.test.mjs tests/token-lineage.unit.test.mjs tests/token-surface.security.test.mjs
```

The EVM fixture uses explicit artificial timestamps, chain ID 1337 and in-memory
Ganache. Boundary tests verify the mined block timestamp at each before/exact/after
point. No external RPC, real token, wallet credential or production signer is used.
The local compiler's JSON result is
`KGEN-KAIOS/reports/SOLIDITY_COMPILE_EVIDENCE.json`.

| Adversarial case | Measured gas | Asserted ceiling |
|---|---:|---:|
| Full transfer after 256 unsolicited one-wei receipts into a legitimate 1,003-wei holding | 118,590 | 300,000 |
| Terminal settlement of that complete 1,259-wei holding | 308,311 | 500,000 |
| Full transfer of all 32 dormant year-cohorts | 2,331,812 | 8,000,000 |
| Full terminal settlement of those 32 cohorts | 808,184 | 8,000,000 |

The dust test compares 128 against 256 receipts to prove transfer cost does not
grow with receipt count; both coalesce into one birth-year slot. The worst-history
case advances far beyond the final calendar boundary without prior settlement,
then transfers and converts every unit. This proves the bound also covers dormant
historical balances, rather than only the latest three calendar years.

The EVM test blob is `ea72c4eeba4c8783ee044f4e00b308e7efc588af` and its harness
blob is `f585cb3d5f384622e505d8efde9b6e5ee59bc0b1`. Historical CI for #201 is
source history only; it is not counted as this candidate's validation. No claim
of GitHub exact-head CI is made for this new source branch.
The tested core blob is `f597188daeca6bd9e23f90a6190f0349e88408de` and policy
blob is `875f8a5411eb3162779382baf58487479e486577`; those program/test sources
were not modified after the successful runs.

## Review continuation and unperformed actions

The original KUFO owner/lease and this session's registered worker identity are
not verified. `codex-gm-01` is an ACTIVE/T5 registry entry, but that fact does not
identify this session. No original claim, lease, Registry or WorkQueue entry is
modified and no employee identity is asserted. `.agents/skills` was absent in
both the isolated checkout and shared source workspace.

This session is a direct Human-authorized engineering candidate. Preserve it on
the isolated review branch; do not force-push #201. Safe continuation is for the
verified #201 owner to adopt this exact latest-main candidate by a coordinated
branch update after reviewing its diff. The sole blocker to updating #201 itself
is unverified original writer/lease authority. No parallel product PR is needed.

#600 may be marked superseded only after confirming its three exact blobs are
preserved in the accepted continuation; it stays open this round. #158's old
catalyst/continuous-decay behavior is historical, not a rule source. #211
(reactor/KGOD) and #212 (UFO App) are downstream products and remain open.
No PR close, branch delete, merge, deployment or live transaction is performed.
The original mobile-environment HOLD is neither bypassed nor treated as a ban
on these independent offline tests. No UI files change; browser QA is not
applicable to this source-only candidate.

## Deployment prerequisites

1. Approve the formal Gregorian/lunar/K280 boundary calendar, version hash,
   zodiac anchor and finite issuance horizon. Test clocks are not canon.
2. Reconcile Physics CURRENT V3.8's continuous-half-life wording with the latest
   Human-directed shared-boundary 50/75/100% terminal law. CURRENT is unchanged.
3. Bind reviewed KAIOS, KUFO, KSHIP, furnace, output, converter and delayed Organ
   Registry governance addresses to an explicit deployment-lineage manifest.
   Registry controllers remain trusted routing authorities.
4. Review the current-balance-only KGEN proof economics, including borrowed or
   same-transaction balances; no holding-history claim is made.
5. Complete required candidate CI/security review and obtain action-specific
   deployment/signing/asset authority. Source approval is not transaction authority.
6. Preserve immutable V1 history and choose an explicit new-deployment transition;
   this undeployed candidate cannot silently upgrade an existing token.

---

## Preserved PR #201 source specification (superseded anniversary/64-lot mechanics)

# K18911 → KUFO Three-Autumn V4 Candidate

Status: DRAFT SUCCESSOR CANDIDATE / NOT DEPLOYED

This is the current Product 5 review candidate. It preserves deployed history but supersedes earlier candidate mechanics that depended on KGEN tax accumulation, KGEN holding age, catalyst-bank transfer, 49-Epoch waiting, 130-day freshness, or continuous residual half-life dust.

## Point roles

- K18911 = 煉丹爐; KAIOS alchemy entry.
- K511111 = 齊天大聖宮 / KUFO 蟲洞與幣世界座標. `511111` is a civilization point, not an EVM hexadecimal address.
- K168888 = 筋斗雲; fixed-beneficiary KUFO output organ.
- K108000 = future KSHIP fuel-consumption → KGOD transformation point; outside this product.
- K16888 = future marriage / KGOD ring point; outside this product.

## Immediate alchemy

- `1 KGEN = 1,000 KAIOS`.
- required current KGEN wallet balance = `KAIOS input / 1,000`.
- KUFO output = `KAIOS input * 1,000`.
- KGEN is balance proof only: no transfer, burn, lock, escrow, allowance, holding-age or tax-history requirement.
- KAIOS alchemy burn record remains the upstream settlement evidence.
- after successful KAIOS burn proof, K18911 calls the registered K168888 output organ in the same transaction.
- K168888 cannot redirect beneficiary or amount.

Example: `0.001 KAIOS` + current wallet balance `>= 0.000001 KGEN` → immediate `1 KUFO`.

## KUFO Three-Autumn decay

`K280_YEAR_SECONDS = 31,556,926` and one K18888 Heaven day equals one K280 Earth year in this project time scale.

For each original KUFO lot:

- before Year 1: 0% converted.
- Year 1 / First Autumn: cumulative 50% KUFO converted to KSHIP.
- Year 2 / Second Autumn: cumulative 75% converted.
- Year 3 / Third Autumn: 100% converted; all remaining smallest-unit dust is terminally consumed.
- exact lineage: `1 KUFO` eventually produces `1,000 KSHIP`.
- KSHIP does not half-life in this product.

For an original `1 KUFO`: First Autumn produces 500 KSHIP, Second Autumn adds 250 KSHIP, Third Autumn adds the final 250 KSHIP, and KUFO remaining becomes exactly zero.

Transfers preserve lot age. Partial transfers split lineage lots without resetting the original birth timestamp. The implementation caps one transfer traversal at 64 lots to fail closed rather than permit unbounded gas growth.

## Downstream boundary

KSHIP is future UFO antimatter fuel. Its later fuel consumption at K108000 may produce KGOD. KGOD, K16888 marriage, KDNA and KRNA are intentionally not implemented by this Product 5 candidate.

## Safety

Repository candidate only. No deployment, Mainnet transaction, KGEN/KAIOS/KUFO/KSHIP transfer, burn, mint, signer use, Organ Registry update, governance action or chain write is performed by this PR.
