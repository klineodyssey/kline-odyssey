# KSHIP Whitepaper — cumulative KUFO annual conversion edition

## 2026-11-14 權威接續：持續煉丹的分段年界（LOCAL_CODE_AND_TESTS_VERIFIED_NOT_DEPLOYED）

依 Human 最新持續煉丹及萬年航程要求，沿原 #637 修正 KUFO 曆法維護方式，KSHIP 沿用原核心與既有 Converter。
**舊 32 年終身停鑄設計已被取代，2039 停鑄草案未採用。** 下方完整保留的固定發行期、前輪 35 項通過及另 185 項歷史結果均不能充當本次候選的驗收。
持續煉丹不取消原供應 cap，也不增加任意鑄幣、轉帳或自動簽署權限。

KUFO 本機候選採用只能在末端追加的分段 calendar：初始 constructor 最多 32 年／512 個出生窗口，治理 append 每次最多 32 年／256 個窗口（MAX_APPEND_BIRTH_WINDOWS），均不再是終身上限。分段跨度須同時符合窗口數限制；32年／256窗／287交集分組的append實測propose428,852、execute7,555,818 gas，低於8M，沒有套用30M部署預算。
現任 Organ Registry owner 提案精確 payload hash，沿 Registry 的 minimumDelay（至少一小時）等待；任何帳戶到期執行仍須核對同一 owner、parent hash 與 payload，現任 owner 可取消。
追加段須完全匹配既有末三個年界，不得變更舊出生 group、年界或已取得的成熟權利。可以補齊未覆蓋的過期空窗，但新 mint 不得追溯到過去；缺當下正式覆蓋時暫拒新 mint，合法追加後可恢復，不能承諾無人維護仍永久出料。

初始 calendarHash／version 保留，latestCalendarHash 鏈接追加段，groupCalendarHash 固定出生來源；origin、轉讓與年度補結均不改寫出生年、生肖、星座或來源 hash。
年／cohort／group 採 uint32 候選範圍，活躍持有人有序 bitmap 與年度 aggregate 供有界查找。一般轉讓／burn 超過單筆 32 個分組時整筆拒絕，改走 selected-group 分批；claimableTotal 超過單批範圍則用 heldGroups／claimableForGroups 分頁讀取。
既有 KUFO → KSHIP 1:1,000、年度累計 50%／75%／100%、永久補結與尾差、供應 cap、持有人 allowance、真 burn／proof、實際產出增量及原子回滾防線保持。

萬年是資料延長、數值與操作活性的設計，不是已批准萬年曆表。香港天文台公開年曆對照為 1901–2100，遠期日界計算可能有日期差異，不能自行外推精確生肖／星座窗口。Human 已選生肖年界沿用**地球農曆新年**，不得改用元旦或宣稱精準萬年預測；正式生效時間、時區、財務年界、星座窗口及各期具體表仍須依原定案程序核定。
本輪純 policy suite **20/20 PASS**，0 failed/skipped/cancelled，7471.6809ms；原 bounded-policy log 已讀回，包含萬年合成分段與 constructor／append 的257窗口差異案例，不代表鏈上 gas 或正式年曆已驗收。
最終固定程式／測試提交 `0bf33c4b1ed61da5ddd08c4f426e3e6a5408fd9b`：36合約編譯、0 warnings，248620.5081ms；最終31/31 EVM PASS，0 failed/skipped/cancelled，625773.2286ms。前述純policy20項未重跑；第一輪4 ABI＋10 main lineage通過，34份未變artifact的creation/runtime/ABI及KUFO ABI一致，未重跑這14項。合計65項組合矩陣，不是一次65項全跑。
第一輪45項曾44 PASS／1 FAIL（718824.4665ms），唯一dust transfer未達原300k；保留原log／archive後，用六處global-zero bitmap祖先guard修復，不改門檻。最終dust transfer264,105<300k、settle340,037<500k；dormant32一般transfer／settle4,820,020／1,400,028，selected32 transfer／convert2,783,334／1,014,984 gas，仍在8M內。最大constructor18,216,737<30M gas，initcode40,242<49,152 bytes；完整編譯輸入、log雜湊及gas表見同一KUFO白皮書本輪接續段。
四層bitmap actor只驗uint32索引，不代表建立65,536個真鏈上cohort；10,000年／120,000分組是純資料測試，不是天文預測。獨立NO_BLOCKER是工程原碼複核，不是外部安全審計。
本版origin groupId由uint16改uint32、issuanceCohorts由uint8改uint32，Furnace新增groupCalendarHash依賴。需配套五合約候選／新ABI／地址及綁定核驗，不能與舊Furnace任意混綁、原地升級或覆寫既有LIVE合約。
狀態為 **LOCAL_CODE_AND_TESTS_VERIFIED_NOT_DEPLOYED**；正式參數、地址、綁定、授權與成本仍待核定，UI／實體手機／真錢包為 **NOT_VERIFIED**，沒有主網生效、部署或簽署。本輪未新增支出，不承諾未來續曆與治理上鏈免費；實際gas與成本仍由合法持有人依原限制確認。

## 2026-11-13 KUFO #637 工程接續

正式代號沿用 KSHIP，KUFO 的正式名稱及入口不附版本。
本文件完整保留前版於下方；其中「Converter unchanged」、V4 來源名及舊測試／gas 是歷史證據。
現行關係為：真銷毀 1 KAIOS 同筆即時產出 1,000 KUFO，KGEN 只作當下餘額資格；
共同年界第一年累計 50%、第二年75%、第三年100%，終局清餘額尾差。
每 1 KUFO 最終對應 1,000 KSHIP，漏年永久可補結，轉讓不重設出生年或已耗用權利。
年界不自動扣幣；由持有人發起 Converter，KUFO 消耗其授權並記 carrier proof，KSHIP 核 immutable KUFO proof 後鑄造。

KUFO 的 financial year 與出生生肖／星座窗口分別明確配置；現存權利依不可變出生 group 搬移。
大量歷史分組可用既有 Converter 新增的 `convertGroups` 分批處理；每批至多32個唯一升序group，未選權利保持。
任何 proof、路由、授權或輸出失配須原子回滾，不能將路由回傳 tuple 當實際 KUFO/KSHIP 產出。
Registry 現任 Converter 是受信任 spender，並不因此獲得未授權持有人的餘額。

KUFO 的 `carrierBurnRecord` 供 KSHIP 讀取的 ABI 保留；KSHIP 及 Converter 的 immutable KUFO／KSHIP 地址不可被 ABI 相容性改接。
舊部署與舊49 Epoch proof 保留，沒有隱含遷移或重複領取。當前主網 manifest 將 KUFO／KSHIP列為 NOT_DEPLOYED/FUTURE，Furnace V1 的 LIVE 歷史不能代表本版部署。
正式曆法、時區、生效時間、年界、生肖／星座窗口與發行期限尚待 Human 核准；工程合成 fixture 不作正式參數。
餐廳庫存交付及活動力討論例子不改協議比例，也不是本版已部署功能。

最終來源、固定提交測試、compiler設定、bytecode及地址／角色／合法持有人部署檢核，沿既有
`KGEN-KAIOS/KAIOS_18911_KUFO_THREE_AUTUMNS_V4.md` 累積記錄。
AI 未部署、未代簽或送治理交易。正式參數及合法授權完成後，才由有權持有人確認。

### Converter 實際鑄造驗證補強（2026-11-13，固定來源 86ee4e8e）

既有 `KSHIPConverter.sol` 的兩個地址 constructor 及 `convert`／`convertGroups` 入口不變，原 proof 公式保留。
constructor 核對兩個 token 地址均有合約程式碼、`KSHIP.kufo()` 等於所綁 KUFO，並要求兩者 Organ Registry 一致且非零。
兩個入口共用同一快照與完成驗證：在燒 KUFO 前確認 KSHIP proof 未用，保存總供應量、`totalMintedFromKufo` 及受益人餘額；其後讀取真 KUFO carrier burn record，核對 owner、beneficiary、converter、kufoBurned 及 `expectedKship = kufoBurned × 1,000`。
呼叫 KSHIP 後，除了原回傳 tuple 核對，還要求 proof 已使用與上述三個量的精確增量。缺少鑄造、錯誤收款人、錯誤數量、累計量或 proof 均不能只靠回傳數字通過。
任一步不一致，整筆同步回滾 KUFO、授權額度、分組權利、proof 與 Converter counter；這不是新的經濟規則或第二套付款流程。

getter 與狀態回讀不能認證能偽造所有回傳值的任意程式碼；canonical runtime、地址、immutable 與治理綁定仍由合法持有人依原審核包確認。
先前 `6bedaec3` 的 218 項通過結果（198 非 EVM＋20 EVM）未覆蓋本次 no-mint 缺口，僅保留為歷史；本輪受影響35/35 PASS（22 EVM＋10 legacy lineage＋3 ABI），0 failed/skipped/cancelled，482912.2407ms；另185項同指紋歷史通過未重跑，非本次單次220項全過。
固定來源與結果沿原工程報告保存。正式曆法及部署參數仍未核定，維持 `NOT_DEPLOYED`，沒有主網鑄造、部署或簽署。

## 前版完整正文（SUPERSEDED historical evidence）

# KSHIP V4 Whitepaper — cumulative annual-cohort compatibility edition

Status: REVIEW CANDIDATE DOCUMENTATION / NO LIVE ACTIVATION
KUFO candidate version: `4.1.0-candidate`
Solidity: `0.8.24`; OpenZeppelin Contracts: `5.0.2`
KSHIP source: existing main `KGEN-KAIOS/contracts/KSHIP.sol`, unchanged
Converter source: existing main `KGEN-KAIOS/contracts/KSHIPConverter.sol`, unchanged

This complete edition describes how the existing KSHIP interfaces accept the
annual-cohort KUFO candidate. It retains the original PR #201 edition below as
historical source. It does not relabel existing KSHIP bytecode as a new V4
deployment, assert deployed addresses, or modify deployed V1 or immutable KAIOS.
The reused source heads are PR #201
`8b4ccd8c008886f82853ba0f0c064b9217e73894` and PR #600
`2062b7b94959cf5e0d4aaf408677505bb4bcb6e1`.

## 1. Purpose and exact material relation

KSHIP is the milligram-scale carrier accounting token generated by eligible KUFO
conversion. In this product it has no native half-life, transfer tax or arbitrary
holder burn. KSHIP is neither a spacecraft nor a chip; later propulsion,
industrial use and K108000/KGOD consumption are separate product work.

```text
1 KUFO consumed by an accepted carrier proof → 1000 KSHIP
MAX_SUPPLY = 72,000,000,000,000,000 KSHIP
```

No independent discretionary mint is added. Existing main KSHIP retains its
non-upgradeable ERC-20/cap implementation, current-converter authorization,
immutable KUFO source address, replay map and beneficiary-bound proof validation.
No source-level `VERSION` or additional invariant helper is invented in that
unchanged contract; conservation is checked from its actual stored totals.

## 2. Upstream issuance and shared annual maturity

The reused immediate furnace accepts the holder's approved KAIOS, burns it through
existing KAIOS's allowance-checked alchemy method and releases exactly 1,000 KUFO
per KAIOS to the proof's beneficiary. It observes current KGEN balance of at least
`KAIOS input / 1000`; KGEN is not transferred, burned, locked or allowance-spent.
`0.001 KAIOS` plus at least `0.000001 KGEN` therefore produces `1 KUFO` immediately.

KUFO born in one configured year shares common maturity boundaries: first year
boundary makes 50% of original issuance eligible, second reaches 75%, third
reaches 100% and consumes all remaining integer dust. A year-end receipt can
reach its first boundary seconds after issuance. There is no per-receipt birthday
timer and no endless residual half-life in this candidate.

Eligibility does not settle itself. Ordinary transfers and mints do not calculate
or execute decay settlement. The holder explicitly calls
`KSHIPConverter.convert(kufoAmount, beneficiary)` when desired. Skipped years catch
up according to the configured boundaries; a repeated call can consume only
remaining eligible tranches. After the third boundary, settling the complete
remaining balance leaves zero KUFO and the exact final 1:1,000 accounting relation.

## 3. Holder authorization, proof and fixed beneficiary

The existing converter sets `owner = msg.sender` and creates its carrier proof
from chain ID, converter address, conversion number, owner, beneficiary and amount.
The synchronous path is:

1. Converter calls KUFO `burnForCarrier(owner, beneficiary, amount, proofId)`.
2. KUFO checks the current registry converter, consumes only mature remaining
   tranches, rejects proof replay and burns exactly `amount` KUFO.
3. KUFO records the unchanged interface tuple: `owner`, `beneficiary`, `converter`,
   `kufoBurned`, `expectedKship`.
4. KSHIP reads that record and requires its caller to be the current registry
   converter, nonzero owner/beneficiary/amount, matching recorded converter, and
   `expectedKship == kufoBurned × 1000`.
5. KSHIP rejects a reused carrier proof and mints to its recorded beneficiary.
6. Converter verifies returned beneficiary and amount before completion.

The beneficiary may be selected by the authorized holder for a new conversion;
it cannot be changed after the proof is recorded. A failed mint or lineage check
reverts the entire transaction, including KUFO consumption and proof state. This
does not authorize arbitrary third parties to settle someone else's holdings.

The external Organ Registry remains a trust boundary. A malicious registered
converter could violate the holder-authorization assumption, and a malicious
output could issue unauthorized proofs. Production needs audited bindings,
governance and role controls even though the token bytecode is not upgradeable.

## 4. Transfer lineage and integer conservation

KUFO holder balances coalesce by birth year into remaining `first`, `second` and
`terminal` tranches. Mint-proof rounding fixes the 50% and 75% cumulative targets
once; early settlement consumes those tranches rather than rewriting an original
amount. The genuine furnace issues KUFO in multiples of 1,000,000 wei, so those
mint targets divide exactly by four. Artificial minimum-unit proofs may round
early targets down, with every residual unit consumed at Autumn three.

For a partial transfer, the recipient's cumulative first and first-plus-second
tranches are floored proportionally to its live amount, the second is derived by
subtraction, and the final tranche receives the residual. The sender subtracts
exactly the recipient's amounts. Every tranche is conserved, year/age is unchanged,
and transferred mature material is neither settled nor made younger.

Same-year balances are fungible. Immutable proof origins retain original amount,
beneficiary, timestamp, birth year and birth zodiac, while constellation `0` means
`UNCONFIGURED`. A current active zodiac is an offchain calendar/year projection;
it does not alter birth zodiac. Coalescing does not promise cryptographic tracing
of every individual transferred token back to one particular mint proof.

## 5. Calendar, gas bounds and lifetime cap

KUFO requires an explicit immutable calendar version, hash inputs, first year and
twelve-zodiac anchor. No Gregorian, lunar or K280 calendar is inferred. For `N`
issuance intervals, `1 ≤ N ≤ 32`, there are `N+3` strictly increasing nonzero
timestamps. Mints close at index `N`; the last birth cohort becomes terminal at
index `N+2`, and all terminal conversion remains available forever. No calendar
setter, wraparound, slot reuse or post-construction extension exists.

The calendar hash is
`keccak256(abi.encode(version, firstYear, firstZodiac, uint64[] yearStarts))`;
registry address is excluded. Before activation the contract reports first year
and Autumn zero while rejecting minting; pure policy helpers reject that time.
After the final timestamp, settlement-year projections clamp to the final year.

This finite issuance horizon is a candidate engineering tradeoff that needs
explicit production approval. It prevents both receipt dust and accumulated old
years from growing a holder's traversed lineage beyond the fixed 32-year ceiling.
Transfers and conversion do not traverse immutable proof history. The previous
65-receipt full-transfer failure must be replaced with tests proving hostile dust
remains fully transferable and convertible within measured bounded gas.

KUFO limits lifetime issuance, not just circulating supply, to
`72,000,000,000,000 KUFO`. Burning mature KUFO does not reopen mint capacity.
This reserves enough space under KSHIP's fixed cap for the complete modeled
lineage and avoids a future cap-induced conversion lock.

The accounting checks are:

```text
KUFO totalSupply + totalDecayedForKship == totalMintedFromAlchemy
Each accepted proof: expectedKship == kufoBurned × 1000
Completed converter path: KSHIP totalMintedFromKufo == KUFO totalDecayedForKship × 1000
Product_05 KSHIP totalSupply == totalMintedFromKufo
```

## 6. Merchant pricing and downstream boundaries

Merchant quotes, inventory, margin and subsidy are independent of the protocol's
1,000 KUFO/KAIOS mint ratio. A restaurant may sell 100, 1,000 or 2,000 KUFO for
one KAIOS from its own stock or subsidy without changing protocol minting or the
terminal KUFO/KSHIP ratio. This edition implements no merchant UI or accounting.

K108000/KGOD, marriage/rings, KDNA, KRNA, reactor operation and UFO applications
are downstream products. PRs #211 and #212 remain downstream cases; they are not
duplicate alchemy work and are not closed by this integration. PR #158's catalyst
and continuous-decay mechanics are not imported. PR #600's unique research source
is preserved before any later supersession decision.

## 7. Deployment prerequisites and validation status

This edition asserts no live deployment, mint, burn, token/BNB movement, signer
use, registry change, governance action or main merge. Exact candidate test and
compile results belong in the product implementation report; old PR CI does not
prove this new core passed.

Production activation requires approved calendar boundaries/version/hash/anchor
and finite horizon; reconciliation of Physics CURRENT V3.8's continuous
three-year 12.5% illustration with the user's latest annual 50/75/100% instruction;
exact-source compilation and local EVM security/boundary/dust/gas/cap/conservation
tests; verified existing KAIOS compatibility; complete reviewed deployment
bindings and preserved V1 address/bytecode lineage; and separate action-specific
human authorization for any deployment or live asset/governance operation.
Physics CURRENT is unchanged by this candidate.

## Preserved historical source edition — superseded candidate descriptions

The original PR #201 whitepaper follows verbatim. Its V4 source metadata,
invariant-helper claim, prospective source replacement and historical independent
review flow are archival statements. The current integration retains main KSHIP
and converter sources and adds no historical review gate beyond current policy.

---

# KSHIP V4 Whitepaper

Status: DRAFT PRODUCT CANDIDATE
Version: 4.0.0-compatible lineage
Solidity: 0.8.24
Upgradeable: NO
Mainnet status: NOT DEPLOYED / NOT LIVE
Primary lineage: KUFO -> KSHIP -> K108000 -> KGOD

## 1. Purpose

KSHIP is the stable carrier material produced from terminally decaying KUFO. It is the downstream material used by the K108000 propulsion / transformation lineage.

KSHIP has NO HALF-LIFE in Product_05. Once valid KSHIP is minted from a verified KUFO carrier proof, this product does not automatically decay it.

## 2. Material relation

The exact conversion law is:

1 KUFO = 1000 KSHIP.

KSHIP does not create value independently. It can be minted only from an accepted KUFO carrier proof produced by the currently registered KSHIP converter.

## 3. Mint authorization

KSHIP has no owner mint and no arbitrary admin mint.

The mint path is:

1. Current KSHIPConverter calls KUFO burnForCarrier.
2. KUFO verifies the converter against KAIOS Organ Registry.
3. KUFO consumes only matured claimable KUFO under the Three-Autumn schedule.
4. KUFO records a carrier proof containing owner, beneficiary, converter, kufoBurned and expectedKship.
5. KSHIP reads that record.
6. KSHIP requires the caller to be the current registered KSHIP converter.
7. KSHIP verifies expectedKship == kufoBurned * 1000.
8. KSHIP marks the proof as used and mints to the recorded beneficiary.

## 4. Replay and beneficiary binding

Each carrier proof may be minted only once.

The proof includes the beneficiary through the KUFO carrier record. KSHIP does not accept an arbitrary caller-selected recipient after the fact. The KSHIPConverter also compares the KUFO expected amount and KSHIP returned amount before completing the conversion transaction.

## 5. Supply

MAX_SUPPLY = 72,000,000,000,000,000 KSHIP.

This ceiling corresponds to the current modeled KAIOS -> KUFO -> KSHIP civilization lineage and does not grant discretionary mint authority.

## 6. Conservation

KSHIP tracks totalMintedFromKufo and totalSupply.

Because Product_05 defines no native KSHIP burn or decay, the token exposes the conservation condition:

totalSupply == totalMintedFromKufo

Downstream consumption through K108000 is outside Product_05 and must be introduced only in the later Product_06 lineage with its own explicit conservation accounting.

## 7. Non-upgradeable core

KSHIP is intended as a non-upgradeable core material token.

It has no UUPS, Transparent Proxy, upgradeTo or upgradeToAndCall entry point. Future changes should be expressed as a separately deployed new version and explicit registry / product-line transition, not a silent replacement of already deployed KSHIP bytecode.

## 8. Administrative and risk surface

KSHIP has:

- no owner mint
- no admin mint
- no blacklist
- no seizure path
- no native transfer tax
- no half-life in Product_05
- no proxy upgrade path

The only privileged mint actor is the current KSHIPConverter resolved through the Organ Registry, and that actor still cannot mint without a valid KUFO burn record.

## 9. Downstream boundary

KSHIP is designated for later Product_06 use:

KSHIP -> K108000 -> KGOD.

Product_05 does not activate KGOD, marriage, KDNA or KRNA logic.

## 10. Verification requirements

Before deployment, GM review must verify:

- exact 1:1000 KUFO/KSHIP relation
- proof replay rejection
- converter authorization
- beneficiary binding
- KUFO maturity enforcement
- KUFO and KSHIP conservation invariants
- no unauthorized mint path
- no hidden upgrade path
- exact-head Solidity compile and EVM behavioral tests

## 11. Deployment boundary

This whitepaper describes a repository candidate only. It does not assert Mainnet deployment, activation, registry mutation, signer use, token movement or governance approval.

Required flow:

玄曜 Product Engineering -> exact-head CI / EVM tests -> Codex/衡曜 GM independent review -> human-authorized deployment process.
