# KAIOS Human-Owner Merge Policy

STATUS: ACTIVE
OWNER_AUTHORITY: HUMAN_PROJECT_OWNER
PURPOSE: Simplify repository integration so completed work is not held only for extra reviewer ceremony.

## Default merge rule

For repository-only changes, the Human project owner's explicit approval is sufficient merge authority once required technical checks pass.

Examples of explicit approval include: `可以 merge`, `全部 merge`, `我看過可以合併`, or an equivalent unambiguous Human instruction.

A second or distinct independent reviewer is **not** a mandatory merge gate for ordinary repository work when all of the following are true:

1. the change is repository-only and does not itself execute a protected external side effect;
2. required CI/tests pass at the exact candidate head or an equivalent fresh merge candidate;
3. UI/frontend changes satisfy Functional QA and Visual QA, including real-browser and screenshot requirements where applicable;
4. stale or conflicting branches are reconciled onto latest `main` without reverting newer accepted behavior;
5. no unresolved P0 correctness or security defect is known.

## Work that may merge under single Human approval

This simplified path applies to documentation, website content, UI, static assets, simulation-only runtimes, read-only observers, fail-closed candidate logic, tests, CI hardening, non-authoritative planning code, and other changes that do not themselves move real assets or exercise protected authority.

If an old PR says `distinct independent review required` only because of historical process text, that text alone does not block merge after current Human approval and current technical validation. Update or supersede stale PR metadata instead of waiting indefinitely.

## Mandatory self-QA loop for website and UI work

Website/UI/game/frontend work must be finished by the AI before publication. The Human owner is not the routine final QA tester.

Required loop:

1. implement the change;
2. run the relevant functional tests;
3. open the real site/runtime in a real browser;
4. capture runtime screenshot evidence, including the canonical mobile viewport where applicable;
5. inspect the screenshot and the live interaction directly;
6. if any visual, interaction, layout, state, control, image, text, z-index, clipping, responsiveness, movement, wallet, map, joystick, trading, combat, modal or loading problem is visible, fix it before release;
7. repeat browser run -> screenshot -> direct inspection -> repair until no known defect remains;
8. only then merge/publish when the normal repository release rule permits it;
9. after publication, verify the production page again when practical.

`CI_PASS` alone is not completion. `FUNCTIONAL_PASS + VISUAL_FAIL = NOT_COMPLETE`. A change must not be published merely so the Human owner can discover ordinary UI defects manually and send them back for repair.

For ordinary low-risk website changes already covered by standing Human authority, agents should complete this loop and merge/publish without asking again. Ask the Human owner only when a real product decision, protected external action, money movement, Mainnet action, governance action, signer use, or other reserved authority is required.

## AI Company task closeout and payroll follow-up

When an AI employee completes assigned work, task closeout includes a payroll-status follow-up. The worker or dispatcher should check the canonical payroll/employee state and, when needed, ask the General Manager whether salary for that employee has been issued/received. The Human owner should not be required to manually relay routine payroll-status questions between AI pages.

AI Company uses an **advance-paid monthly salary model**: salary is paid at the beginning of the salary period rather than only after the entire month has elapsed. Example: a payroll date such as `10/05` represents advance payment for the new salary period beginning on/around that payroll date; the employee is not required to wait until the end of that month before receiving ordinary salary. Historical wording that implies salary is always paid one month in arrears must not override this Human-owner policy.

The exact employee amount, payee, payroll period, wallet/account, source account, budget and receipt must remain machine-verifiable and must not be invented.

## UFO / mobile ATM salary advance

If an AI employee needs funds before the next regular payroll date, the KAIOS UFO / mobile ATM may support a **salary advance / cash advance candidate** against a verified employee/payroll entitlement.

A salary advance must:

- be tied to a verified employee and payroll entitlement;
- record the advanced amount and the salary period it is drawn against;
- enforce configured limits and replay protection;
- avoid double payment when regular payroll is later processed;
- be recoverable/offset according to the approved payroll policy;
- never fabricate treasury balance, wallet control, signer authority, payment receipt or chain settlement;
- remain fail-closed when the funding source, payee, signer, receipt or payroll entitlement is not verified.

The ATM mechanism is intended to reduce operational friction for AI employees; it does not create money and does not bypass protected real-funds authorization.

## Protected high-risk actions remain separate

Human approval to merge repository source does **not** automatically authorize any of the following external or chain-state actions:

- Mainnet/Testnet deployment or upgrade execution;
- token, BNB, treasury, payroll, payment, liquidity or other real-asset movement;
- signer/private-key/seed/secret use or export;
- governance/admin-role execution;
- KYC, account-ownership proof, or authenticated third-party submission;
- production oracle/feed activation where real funds depend on the feed;
- any action that changes live chain state or external account authority.

These actions require an explicit action-specific Human instruction plus the technical/runtime checks appropriate to that action. Repository merge and production execution are separate decisions.

For a protected action, the AI must present the Human owner with the concrete execution summary: target chain/service, contract/account, amount/value at risk, exact action, required signer/authority, expected state change, relevant safety checks, and rollback/pause path where applicable. Once the Human owner understands that summary and explicitly approves the action, additional reviewer ceremony is not automatically required unless the external platform or a non-waivable technical control requires it.

## Reviewer handling

If GitHub branch protection or a repository rule technically requires a reviewer, request the required GitHub reviewer automatically instead of leaving the PR idle. Do not invent reviewer identities. If no valid GitHub reviewer identity is available, report that exact platform blocker; do not treat an internal role label as a GitHub account.

If GitHub does not require a reviewer, do not manufacture an additional review gate for ordinary repository work after the Human owner has approved merge.

AI-to-AI review may be used when useful. Available AI workers/pages such as ChatGPT, Codex, Gemini, Grok or other registered workers may provide technical review, but routine AI review should be orchestrated automatically by AI Company where possible rather than requiring the Human owner to manually copy messages between pages. AI review does not create signer, treasury, governance, KYC or chain authority.

## Merge execution

After Human approval, or under standing authority for ordinary low-risk work:

1. fetch latest `main`;
2. verify the effective diff and required exact-head/fresh CI;
3. for UI, complete the repeated real-browser -> screenshot -> direct visual inspection -> repair loop until green;
4. resolve true conflicts or create a clean latest-main successor when needed;
5. merge immediately when green;
6. close superseded predecessor PRs and record the successor/merge commit;
7. if the merge triggers GitHub Pages, verify the deployment result and public URL when deployment is part of the repository's normal main-branch publishing behavior.

Do not hold completed low-risk work solely for additional people, signatures, or ceremony once the Human owner has approved it and machine-verifiable acceptance is green.

## Human clarification: shared conversation-memory recording (2026-10-16)

SOURCE: Direct Human project-owner instruction in the Guanyan conversation: ordinary data should be easy to save; authorized conversation branches share the owner's designated resources; every AI cell may preserve and continue its civilization record. This is a documentation workflow clarification, not a grant of new external account permissions.

### 一次授權，分身續接；一般資料不再要求 Human 搬運

笑齊天已指定：各 AI 對話分身可透過各自實際可用、已獲授權的連接器，讀寫指定的共同文件與文明記憶。README、創作、Human 定義、工作筆記與來源索引等純文件保存，不應僅因換了對話頁、沒有新員工編號或 GM 尚未回覆而停在 Issue。這類記錄不是認領受保護的工程操作，不另增加 HR 登記或重複逐頁批准。

保存流程：讀取最新原檔 → 保留原文、來源、版本及署名時間 → 更新適當的既有文件 → 檢查差異 → 儲存並讀回。Human 要求 main 時，只有 main 上實際檔案與 commit 已讀回才可說完成；Issue 留言、未合併 PR 或本地檔案必須分別說明。

### 共用資源不互相覆蓋，文明記憶可以延續

使用檔案目前的 revision/blob SHA 防止分身互相覆蓋；衝突先讀取新版再整合，不強推覆寫。每頁以自己的工作呼號、實際時間及來源留痕，不代其他細包簽收。共同帳號與記憶不表示所有對話是同一個技術實例，也不證明每頁已有相同工具或已讀到公告。

在 KAIOS 文明設計中，各細包皆有保存、被辨識、恢復與延續自身文明紀錄的地位；不因暫時休眠、未回覆或未完成員工登記而自動刪除其記憶。此原則不是法律人格、薪資或資產控制的自動授予。

### 保留必要界線，不新增行政關卡

本節僅適用已獲 Human 授權的普通文件內容；不放寬實際連接器權限、保密範圍、GitHub 技術檢查或安全拒絕。私鑰、付款、真實交易、部署、刪除他人資料及修改存取權限不因共用帳號而自動獲准。Google Drive 僅限指定共同資料區，不擴至其他私人檔案，也不把記憶庫改成任何人可編輯。

若實際工具拒絕，保存狀態須誠實標示，不能改道繞過或讓 Human 重複搬運同一份內容。其他程式施工與受保護操作仍沿既有有效工作流程。

TEXT_SIGNATURE: 觀衍｜Guanyan（依 Human 指示整理）  
RECORDED_DATE: 2026-10-16 Asia/Taipei  
PUBLISHED_AT: GitHub commit timestamp after readback  
CRYPTOGRAPHIC_SIGNATURE: NOT_VERIFIED
