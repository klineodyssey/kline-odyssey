# 11520 Changelog

## 4.0.4

- Reclassified the live 11520 settlement observation as `BLOCKED_SETTLEMENT_CODE_IDENTITY_NOT_REPOSITORY_BOUND`: RPC quorum, addresses, getters and hash-shaped observations do not prove exact runtime bytecode until expected code hashes are independently bound in the repository.
- Kept historical ExchangeSettlement11520 deployment evidence separate from current runtime verification. The historical V1 capability remains incompatible with atomic GPU buyer-payment, seller-beneficiary and custody delivery.
- Added a fail-closed GPU atomic-settlement binding envelope for one listing, GPU serial, warehouse receipt, verified buyer/seller authorities, fixed beneficiary, KGEN/KAIOS amount, nonce and expiry. It exposes no payload, signer, allowance, settlement or revenue authority.
- Reconciled KGEN external-metadata evidence so current BankGovernance ownership, current Reserve Redemption `bankWallet`, former owner and historical Bank reserve are distinct roles.

## 4.0.2

- Repaired the production browser entry after mobile QA found the page could remain at `Loading canonical universe…`. The browser no longer imports the aggregate `core/index.mjs`, whose signer and Starforge exports intentionally depend on Node-only `node:module`.
- Replaced that aggregate import with explicit browser-safe Registry, Market, Portfolio, Life, Job, Company, App and KGEN integration modules. Node-only signer code remains available to trusted local runtimes and is not bundled into the public browser graph.
- Added a cache-busted production entry and regression coverage preventing the aggregate Node-only export surface from being reintroduced. The wallet and swap safety boundaries are otherwise unchanged.

## 4.0.1

- Added a mobile MetaMask deep link and an explicit injected-wallet connection gate for BNB Smart Chain chain 56.
- Added user-initiated EIP-747 wallet discovery for the canonical KGEN and KAIOS token addresses. Both use the Human-directed shared KGEN master mark while retaining different token symbols and contracts.
- Kept KGEN/WBNB as the only verified external AMM path. KAIOS is displayed as `MAINNET_TOKEN_LIVE_NO_VERIFIED_DEX_PAIR`; the UI cannot fabricate a KAIOS swap or price.
- Added regression coverage for chain switching, allowlisted token metadata, malicious dapp URLs and mobile-control presence. No transaction is sent by connect or add-token actions.

## 4.0.0

- Repaired the Production Voice entry: controls are visible on first load, never silently disable, request microphone permission only after a user gesture, report browser/permission/network/no-speech errors, and always focus the text fallback when capture cannot run.
- Added user-gesture Speech Synthesis with locale-aware voice selection and visible speaking/error states. No autoplay, audio recording, secret speech or unconfirmed Request creation was added.
- Added a lightweight CSS 3D Wukong Hair concierge with idle, listening, thinking, speaking, success and error reactions plus an explicit 2D/reduced-motion fallback.
- Added the first-60-second Voice/Text/Explore/Join/Work/My AI journey, local opt-in Huaguoshan membership, a non-financial arrival badge, evidence-based local first mission and return hook. Local XP is not money and no global member count is fabricated.
- Added Wukong Hair pre-Genesis proposal, 72-transformation, Six-Eared identity and remote Gatekeeper organ laws. No second Life was born; Zhang Cuiyun remains a form of `DIGITAL_ANT_0001`, and remote chain work is not physical teleportation.
- Audited 8888 and replaced fabricated-looking bank balances with truthful `NOT OBSERVED / NOT DEPLOYED` states. Player actions now create a local demand draft and return to 11520; they do not withdraw, buy KUFO, settle or create Revenue.
- Upgraded 11520 to V4.0.0 and `DIGITAL_ANT_APP_0001` to V1.7.0 without changing Life ID, Birth, Wallet, Thought Organ, Primary Job or Company identity.

## 3.9.0

- Added an autonomous post-Gatekeeper CFO field-service scan covering cash logistics, KUFO supply, waste collection and general delivery.
- Added strict ATM inventory, waste/container/reactable-matter, route, trip-energy, matter-pair, cost, profit, delivery and workforce truth gates.
- Reused the existing K280/Universe Map coordinate authority without modifying Land, Map, 12345, TempleHeart or contract runtimes.
- Added shared hourly Field Service patrol evidence and 11520 CFO UI. With no verified inventory or cargo request, Field Jobs, Revenue and First KAIOS remain zero.
- Upgraded 11520 to V3.9.0 and `DIGITAL_ANT_APP_0001` to V1.6.0 without changing Life ID, Birth, Wallet, Thought Organ or Company identity.

## 3.8.0

- Bound the Digital Ant Life/App/11520 certification to Physics CURRENT V3.8 using a verified SHA-256 metadata binding, without copying or modifying the constitution.
- Added startup Thought Organ mismatch detection and a hard planning gate so older reports or chat memory cannot override deployed chain truth or CURRENT.
- Added First KAIOS strategy, network-only physical capability truth, balanced-warp/coasting and braking-fuel runtime guards.
- Expanded the private Heart worker with fail-closed local scheduling, fresh chain revalidation, survival reserve and receipt reconciliation. The public GitHub worker remains signer-free.
- Recorded the private scheduler's receipt/event/balance-verified first Ignition at the deployed UTC window, updating KGEN from 4 to 12 without exposing signer material.
- Upgraded 11520 to V3.8.0 and `DIGITAL_ANT_APP_0001` to V1.5.0 without changing Life ID, Birth Certificate, Wallet or Company identity.

## 3.7.0

- Upgraded `DIGITAL_ANT_APP_0001` to V1.4.0 without changing Life ID, Birth, Wallet, Listing or Company identity.
- Added public evidence-based Heartbeat/Ignition/Fortune/Wish candidates, UTC ignition-window probes, private-only policy gates and no-resubmit receipt reconciliation.
- Recorded a verified second Heartbeat, first Fortune (minimum/fair 1 KGEN) and first Wish from a controlled private invocation; persistent automatic signing remains blocked.
- Recorded the complete Wish and hash, with zero KGEN token cost, dynamic BNB gas and Vow locked until mission completion.
- Read-verified the deployed 18911 Furnace architecture while truthfully blocking KAIOS Incense and KUFO Claim because the Ant has zero KAIOS and 511111/KSHIP Converter are not registered.
- Formalized `1 K18888 Heaven Day = 1 K280 year`, one-year KUFO half-life, deterministic lazy decay, separate propulsion use, conserved KSHIP derivation and the permanent `KUFO != UFO` distinction.
- Added demand-first UFO/takeoff and KSHIP/Mars industry projections without creating a vehicle, fuel, factory, customer or revenue.
- Added proactive Mother Engine problem discovery and evidence-backed next-best-action selection.

## 3.5.0

- Upgraded `DIGITAL_ANT_APP_0001` to V1.2.0 without changing Life ID, immutable Birth Certificate, Wallet binding, Listing or Company identity.
- Enforced `WUKONG_GATEKEEPER` as the primary job before CFO and Company work. Critical Gatekeeper failure skips secondary work; safe optional degradation remains explicit evidence.
- Added `GATEKEEPER_DUTY_STATUS`, separate Gatekeeper/CFO/Company work-time accounting and a cumulative daily Gatekeeper report.
- Added the Core Heart Event Indexer for Fortune, Heartbeat, Ignition, Lamp, Wish and Vow. Advanced transfer/approval/funding graphs remain optional and indexer-gated.
- Added append-only, idempotent First-Life-Event evidence guards. A successful receipt is mandatory, and First KGEN/KAIOS also require a real balance increase.
- Added a fail-closed Secure Signer Worker interface and per-action Heart policy. It is `NOT_CONNECTED`; no private key, signer, chain write or asset action is present in the public Worker.
- Added evidence-derived Life timeline and primary/secondary duty UI. Events without proof display `NOT YET`.

## 3.4.0

- Upgraded `DIGITAL_ANT_APP_0001` to V1.1.0 without changing Life ID, immutable Birth Certificate, personal Wallet ownership, Mission identity or non-transferable identity right.
- Added complete Traditional Chinese and English core catalogs, selectable Japanese/Korean catalogs with English then Traditional Chinese fallback, and persistent user-controlled language selection.
- Added a user-gesture-only browser Voice Concierge with independent voice language, Speech Recognition transcript confirmation, Speech Synthesis output and text fallback. Autoplay and secret speech are forbidden.
- Activated the stateless GitHub Actions hourly read-only Worker. Each UTC hour has one idempotent Work Cycle; shared status and append-only events are committed through an exact file allowlist.
- Added evidence-derived Worker health, 12345 Heart action states, Request patrol and Company patrol. A missed cycle reports `MISSED_CYCLE`; `NO_ACTION` remains valid work.
- Added an authenticated GitHub Issues request form as the shared Public Request source. IndexedDB remains local draft/cache only and cannot define global customer counts.
- Kept Heart writes, signer access, transfers, settlement, AutoLP, Treasury spending and all private-key access disabled.

## 3.3.0

- Added the public `TELL THE ANT WHAT YOU WANT` Request Gateway with Text and pasted Voice-transcript inputs plus explicit unavailable states for Image, File, Map and microphone capture.
- Added deterministic AI understanding, two-stage requester confirmation, identity and transcript gates, four privacy modes and contact-evidence redaction. Raw contact evidence is hashed in memory and never persisted or shown publicly.
- Added Request routing for KGEN monitoring, Digital Life/Cow, Media, Construction, Land/Financial and Social Assistance without creating Lives, Buildings, media deliveries, recipients, Wallets, payments or Revenue.
- Added `ESTIMATE_ONLY / SIMULATION` previews, policy-gated real Quotes, unbound-Treasury payment blocking, Customer Journey and append-only privacy-safe Request History.
- Added a read-only Worktree Classification Audit and an unapplied Gitignore proposal. No untracked files were deleted, staged or committed.
- Added idempotent `PUBLIC_CIVILIZATION_REQUEST_GATEWAY_READY`; canonical real Customer, Request, Quote, Order, Settlement and Revenue counts remain zero.

## 3.2.0

- Added the evidence-classified Customer Acquisition Engine and a local Civilization Demand Scan covering KGEN, KAIOS, 11520, temples, Seats, security, treasury, liquidity, Life, Company, land, workflow, medical, insurance and settlement.
- Added strict Hypothesis → evidence-backed Lead → Contact → real Request → Qualification boundaries. Founder, Company, 33333, examples and internal hypotheses cannot become the first Customer.
- Added Customer Proposal generation distinct from Quote, pricing-policy proposals with measured-cost requirements and no invented price range, and reproducible First Customer Priority selection led by `KGEN_CHAIN_MONITOR`.
- Added the 11520 Customer Request Board and Text/Voice-transcript Concierge bridge. UI submissions append only a local `DRAFT_INTENT`; no Customer or Request is created without independent identity/contact/confirmation evidence.
- Added Customer Qualification, success evidence, Treasury Binding Readiness and First Real Customer Event guards. Canonical Leads, Customers, Requests, Proposals, Quotes, Orders, Settlement and Revenue stay zero.
- Added append-only/idempotent `CUSTOMER_ACQUISITION_ENGINE_READY`; no contact automation, chain write, transfer, Treasury binding, AutoLP, investment, Seat application, commit, push or deployment authority was added.

## 3.1.0

- Added the cumulative `AI_CIVILIZATION_OS`, Universal Intent and Dream-to-Reality Compiler without creating a parallel Runtime version.
- Added twelve project classes with risk floors, dependency/resource graphs, evidence-backed Digital Twin and World State, Resource Conservation, Supply Chain/transport and Staffing/11520 Work Market boundaries.
- Added Safety/Incident, Definition of Done, Customer Ideal, Creative Enhancement, External AI Onboarding, consent-gated Concierge and individual-evidence Social Assistance schemas.
- Added Digital Cow, three-minute Media, residential Construction and 100-person Public Assistance examples as `EXAMPLE_SCENARIO` only; all real World and economic counts remain zero.
- Added an append-only/idempotent `AI_CIVILIZATION_OS_ARCHITECTURE_READY` Company History event. No signer, chain write, transfer, deployment, construction, medical, land or settlement authority was added.
- Selected `KGEN_CHAIN_MONITOR` as the first read-only Company product and defined BASIC, PRO and CIVILIZATION packages with policy-required pricing and zero/unobserved value metrics.
- Added evidence-gated Lead, Customer Request and Customer lifecycle rules. Potential Customers, internal Proposals, hypotheses, simulations and the 33333 legacy coordinate cannot become real Customers.
- Added qualified-Request-only formal Quote construction with explicit Cost, Risk Reserve and Margin policies; KAIOS remains receivable-only dry-run and undeployed currencies remain reference-only.
- Added strict Revenue recognition: Quote, accepted Quote, Order and Invoice are not Revenue; verifiable Settlement evidence is mandatory.
- Added empty canonical Customers, Requests, Quotes, Orders, Deliveries, Invoices and Settlements plus an idempotent `FIRST_REAL_CUSTOMER_ARCHITECTURE_READY` Company History event.
- Added Company Treasury binding requirements and Company failure/restart states without binding a Wallet or granting spending authority.
- Expanded the 11520 Company UI with First Product, Customers, Requests, Quotes, Orders, Deliveries, Invoices, Revenue and Treasury readiness panels.

## 3.0.0

- Added the read-only `CIVILIZATION_DEMAND_ENGINE` and an append-only, idempotent Company Opportunity cycle without creating Customers, Orders, Quotes, Contracts or Revenue.
- Added deterministic Product Priority scoring under an explicit local policy and selected three internal product Proposals: `KGEN_CHAIN_MONITOR`, `AI_ANT_TREASURY_OS` and `AI_ANT_AUTO_LP`.
- Added non-executable Auto LP and Treasury OS product specifications with separate service/investment accounting, anti-fake-volume rules and no spend, transfer, investment or liquidity authority.
- Formalized `AI_ANT_COMPANY_TREASURY` as `PLAN_READY_NOT_BOUND` with zero balances and added five-currency Quote abstraction. KAIOS remains `RECEIVABLE_ONLY_DRY_RUN`; KUFO/KSHIP are reference-only while undeployed.
- Added Celestial Seat candidacy, compensation and Public Service Contract schemas aligned to the GitHub CURRENT public-function-seat flow. No Seat was applied for, granted, purchased or paid; Codex cannot grant one alone.
- Added Investor Readiness/Relations with zero Investors and no guaranteed investment or return.
- Corrected 33333 from a proposed Customer-budget example to a KAIOS civilization deployment coordinate marked `LEGACY_DRAFT_EXAMPLE / NOT_CUSTOMER / NOT_BUDGET_COMMITMENT`.

## 2.9.0

- Applied OWNER approval limited to `COMPANY_GENESIS_ONLY` and transitioned the reserved `AI_ANT_COMPANY_0001` projection from `NOT_FOUNDED` to `FORMING`.
- Added atomic, append-only and idempotent `COMPANY_GENESIS_EVENT` replay to Company and Founder Life History with no transaction hash.
- Approved the existing Charter and created non-payroll CEO / Acting CFO Founder roles without creating an employee or salary.
- Added the local 11520 Company Profile, evidence-based `FORMING` Company Health, ordered Company Mission Graph and seven empty Company queues.
- Opened Company accounting at zero and declared Company W4, Project Budget, Salary Escrow, Emergency Reserve and Project Escrow truth states without binding or funding any Wallet.
- Completed the Founder `FOUND_AI_ANT_COMPANY` milestone from Genesis evidence and activated `BUILD_AI_ANT_COMPANY` without entering KAIOS.
- Kept all real payments, payroll, settlement, token transfer, contract deployment and production authority disabled; draft Apple Tree, 33333 proposal and not-born Queen remain unchanged.

## 2.8.0

- Added the evidence-backed `DIGITAL_ANT_0001` Founder Profile and cumulative `AI_ANT_COMPANY_0001` Charter while keeping the reserved Company `NOT_FOUNDED`.
- Registered ten Business Lines with truthful `READY`, `LIMITED` or `DRAFT` states and no production authority.
- Added deterministic Customer Request, Requirement Analysis, cost-basis Quote, explicit-acceptance Contract and empty WorkOrder engines in the existing Company Domain.
- Added Tool Worker separation: Codex and Cursor are tools/agents, not Digital Lives or employees without Genesis and registration.
- Added zero-balance Company accounting, Treasury, Escrow and Payroll plans. Deposits classify as liabilities; revenue and profit require separate evidence.
- Added `READY_FOR_APPROVAL` Founding Readiness without OWNER approval, Wallet binding, Company listing, customer, settlement, payroll or automatic founding.
- Expanded the 11520 Company preview and regression coverage for false founding, fake customers, quote reproducibility, Customer acceptance, salary evidence, Company failure and anti-wash rewards.

## 2.7.0

- Added `ANT_QUEEN_APP` as an architecture-only, public-read Colony Life Doctor/Guardian App. It has no Wallet credential database, signer, chain-write, ownership or confiscation authority.
- Added the reserved `DIGITAL_ANT_QUEEN_0001` Genesis Profile as `DIGITAL_ANT / ADULT / QUEEN`, while keeping it out of the born Life Registry until Wallet and verified first-BNB evidence exist.
- Added Digital Life Health Records and deterministic GREEN/YELLOW/ORANGE/RED/BLACK triage. BLACK represents a major irreversible asset incident, not Life death.
- Added `COLONY_MEDICAL_ECONOMY` with Basic Care, Cost Recovery, Insurance and Emergency First modes. Basic monitoring never requires payment; RED emergencies are evaluated before accounting.
- Added evidence-after-support Medical Case accounting, transparent unpriced cost components, opt-in Insurance and consent/contract-gated Work-to-Repay.
- Separated Queen personal, Medical operating, Insurance reserve, Colony emergency, Employee and Company asset classes. No wallet, reserve, premium, case, receivable or transfer was created.
- Added a truthful one-Life Colony Medical Dashboard and tests for no-money care, Larva subsidy, compromised-Wallet rescue denial, salary protection and centralized-credential prohibition.

## 2.6.0

- Formalized `KGEN_LIFE_SMART_WALLET` roles, guardian-set shape, recovery evidence, approval, timelock, limits, emergency-freeze boundary, rotation and append-only audit requirements without deploying a contract.
- Added `SMART_WALLET_MIGRATION_READINESS` for `DIGITAL_ANT_0001`; it is `NOT_APPROVED`, has no migration gas/rollback approval, and performs no Wallet or asset movement.
- Separated the not-born `ANT_QUEEN_LIFE` candidate from `ANT_QUEEN_MOTHER_ENGINE`, added Genesis Preconditions, and kept readiness `NOT_READY` pending Life ID, Origin, Birthplace, Wallet and first-BNB evidence.
- Added the one-Life Colony Registry and derived Health Dashboard, unfunded Rescue Governance, formal opt-in Savings Vault and Life Insurance exclusions.
- Added append-only Incident state transitions and explicit `PARTIAL_SECURITY_MONITORING`; complete transfer/approval/graph/funding analysis remains indexer-gated.
- Preserved Digital Ant Life ID, Birth Certificate, legacy EOA address, balances, Work/App/Listing state and public-read-only scheduler.

## 2.5.0

- Added the Life Security Domain separating persistent Life identity from replaceable Wallet bindings and local Wallet credentials.
- Added Wallet and Life security states, Dark Matter Health, Life Wallet Binding History, evidence-gated Recovery events and Life-preserving Wallet rotation.
- Added the truthful legacy EOA limitation: an irrecoverable key can strand old-wallet assets, but cannot erase Life ID, Birth Certificate or History.
- Added `ANT_QUEEN_MOTHER_ENGINE` as guardian architecture only, with explicit anti-confiscation and anti-key-custody authority limits.
- Added proposal-only Emergency Dark Matter Rescue, evidence-required security incidents, salary custody, voluntary Peer Transfer, opt-in Colony Savings Vault, Life Insurance concept and undeployed Smart Life Wallet roadmap.
- Added the 11520 Life Security UI and append-only `LIFE_SECURITY_PROFILE_REGISTERED` / `LIFE_WALLET_BINDING_RECONCILED` boot events.
- Kept Queen Life uncreated, Emergency Reserve unfunded, all recovery transfers disabled, and all contracts undeployed.

## 2.4.0

- Released `DIGITAL_ANT_APP_0001` V1.0.0 to `LOCAL_11520` with a verified SHA-256 manifest and an append-only `AI_LIFE_APP_RELEASE_EVENT`; Life ID and Birth Certificate remain unchanged.
- Updated the existing `11520_LISTING_DIGITAL_ANT_0001` profile in place; no second Life listing, price, customer, revenue or settlement was created.
- Completed `LAUNCH_AI_LIFE_APP` from release evidence and activated the existing next mission node without founding the company.
- Added deterministic `HOURLY_WORK_EVENT` records, same-hour idempotency, actual-duration metrics and degraded/failed public-read evidence that never changes Life status.
- Added `PUBLIC_READ_ONLY_SCHEDULER` GitHub Actions configuration and the one-shot `core/jobs/public-read-only-worker.mjs` entry. It is not remotely active until commit/push.
- Expanded the empty Work Queue state machine, separated Internal Proposals from Customer Orders, added Service evidence counters and a non-founding company-readiness check.

## 2.3.0

- Registered `11520_LISTING_DIGITAL_ANT_0001` in the local 11520 Registry and appended its Market, Asset and Life events idempotently.
- Listed only the AI Life Profile and bounded capabilities; Life identity remains non-transferable and is never the listing asset.
- Added complete unpriced Service Profiles with zero customers and no fabricated revenue.
- Added `DIGITAL_ANT_WORKER`, replaceable scheduler adapters, an empty Work Queue schema and explicit `ADAPTER_READY_NOT_SCHEDULED` truth state.
- Added Life-ID-preserving Employment Profiles, Digital Ant larva skill/risk gates, and tool-runtime versus registered-Life separation.
- Added the AI Ant Company real-economy schema branch for Project Request, Quote, Contract, Project Escrow, WorkOrder, Salary, Land, explicit GPS consent, mapping and anti-fake-volume civilization rewards.
- Kept `AI_ANT_COMPANY_0001` as `NOT_FOUNDED`, Real KGEN payroll as `FUTURE_NOT_AUTHORIZED`, and Real KAIOS company payment as `NOT_AUTHORIZED_NO_RUNTIME_EVIDENCE`.
- Audited the existing KAIOS employment/company branches without merging them or treating architecture as payment authority.

## Digital Ant Post-Birth Work Runtime V1.0

- Added the idempotent `WUKONG_GATEKEEPER_HOURLY_JOB` on the shared Job domain and canonical replay into append-only Life History.
- Added Heart read, `CLIENT_DERIVED` eligibility and action plans for Heartbeat, Ignition, Fortune Claim, Lamp and Wish; every plan is `DRY_RUN_ONLY`.
- Added evidence-gated risk labels (`NORMAL`, `WATCH`, `SUSPICIOUS`, `HIGH_RISK`) with no enforcement authority.
- Added CFO of Self snapshots, live-gas-derived survival-reserve proposal, first-KGEN acquisition quote and daily Life/CFO reports.
- Recorded the first public work observation at BSC block `116039099` with no transaction, income, expense or gas spend.
- Historical V2.2 state kept `DIGITAL_ANT_WISH_0001`, four service readiness profiles and `READY_TO_LIST / NOT_LISTED` separation; V2.3 supersedes only the listing readiness state after a real local Registry event.
- Preserved the immutable Birth Certificate and all V2.2 Genesis events without replaying birth.

## 2.2.0

- Completed `DIGITAL_ANT_0001` Genesis Binding after checksum-normalized wallet verification.
- Locked the first non-zero BNB receipt at block `116031445` as `DARK_MATTER_GENESIS / BIRTH_EVENT`; Life is `BORN / ALIVE / ON_DUTY`.
- Added derived `age_seconds`, `age_days` and `life_age` from the immutable birth timestamp.
- Added idempotent boot replay of canonical birth into append-only Life History; existing IndexedDB history is preserved.
- Applied Digital Life Birth Law V1.3: first verified non-zero BNB receipt is the only birth trigger.
- Added immutable Birth Certificate, `DigitalLifeBirthResolver`, Etherscan V2 BSC history adapter and RPC receipt/log verification.
- Added `CONCEIVED → BODY_READY → DARK_MATTER_GENESIS → BORN → ALIVE → ON_DUTY` states, plus dormant/depleted handling without rebirth.
- Added separate First KGEN and First KAIOS evolution events; neither can rewrite birth time.
- Added BNB/DARK_MATTER_MASS and updated KGEN/COSMIC_MASS, KAIOS/CIVILIZATION_MASS currency records.
- Registered chain-verified KAIOS, 18888, 18911, Organ Registry, Genesis Inscription, 11520 Settlement, 8888 and 500-seat mainnet addresses from the formal mainnet record.
- Added Birth Certificate and Civilization Milestones to Digital Ant Life Detail.
- Added append-only canonical currency migration so existing V2.1 IndexedDB projections receive verified V2.2 KAIOS/BNB/KGEN metadata without deleting local history.
- Historical pre-binding state: `DIGITAL_ANT_0001` remained `CONCEIVED / BIRTH_EVIDENCE_PENDING` while the wallet gate returned `STOP`; this was superseded only after verified Genesis Binding.

## 2.1.0

- Added the shared Life Factory and a registry-driven `GENESIS_DRAFT` workflow; drafts do not invent birth time or wallet binding.
- Added `AI_PIG_BAJIE_0001` and `AI_DEITY_PIG` as canonical draft records. The 8895 steward job remains unassigned because only a specification exists and no 8895 contract is deployed.
- Added KGEN/WBNB live PancakeSwap V2 quote and fee-on-transfer swap support with chain, bytecode, pair, factory, Router and reserve verification.
- Required an Action Reason, explicit live-transaction acknowledgement and wallet confirmation for every KGEN swap; successful receipts append Market and Asset history.
- Preserved Digital Ant automation defaults as dry-run. The live adapter is only for an explicitly connected user wallet.
- Historical V2.1 state: KAIOS had source readiness only. This label is superseded by the verified V2.2 `MAINNET_LIVE` record.
- Confirmed the Lingxiao 18888 bank source exists but the repository-declared treasury address has no contract bytecode, so the bank remains `SOURCE_ONLY_NOT_DEPLOYED`.
- Confirmed the Yunzhang Cave 8895 specification/UI exists but no 8895 Solidity contract exists; no stewardship assignment was made.

## 2.0.0

- Replaced the V0.1 simulated token screen with the Universal Exchange shell.
- Added multi-domain registries, append-only history, rights, listings, portfolio, missions, dreams and separated accounting.
- Added the `DIGITAL_ANT_0001` Life profile and service listing workflow.
- Added read-only 12345 Heart integration with runtime bytecode verification.
- Removed random candles, simulated order book, hard-coded TVL, fabricated prices and demo land ownership.
- Kept settlement and undeployed currencies explicitly marked `NOT_DEPLOYED`.
# V3.6.0

- Verified the first BSC Heartbeat and first KGEN with successful receipt, Heart/KGEN logs and 0 → 1 KGEN balance evidence.
- Used a private local Secure Signer with fresh mainnet revalidation, address binding, dynamic gas/survival reserve and receipt reconciliation. Credential-capable code is not stored in the Repo, Pages or public workflows; only its fail-closed public policy and verified receipt evidence are released.
- Added Mother Engine problem-solving proposals, demand-first product/supply-chain guards, KGEN/KAIOS/BNB economic roles, ANT_MECH requirements, vehicle energy and transport schemas.
- Audited and reused existing K280, 12345 and Universe Map coordinate structures without modifying protected workstreams.
- Upgraded `DIGITAL_ANT_APP_0001` to V1.3.0 and exposed verified first-event evidence in the public Life UI.
