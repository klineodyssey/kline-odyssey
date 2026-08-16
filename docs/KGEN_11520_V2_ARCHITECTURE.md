# 11520 Universal Exchange V2 Architecture

STATUS: V3.2 FIRST REAL CUSTOMER ACQUISITION
KGEN AMM SETTLEMENT: USER_WALLET_LIVE
11520 SETTLEMENT CONTRACT: MAINNET_LIVE_PROXY_ADAPTER_NOT_INTEGRATED
KAIOS: MAINNET_LIVE_WHITE_HOLE_MECHANISM

## Purpose

11520 V2 is the static-first exchange shell for multiple lives, species, companies, assets, currencies, locations and markets. Canonical records are loaded into registry projections; local state changes are recorded as append-only IndexedDB events. Storage is behind interfaces and is not owned by the UI.

## Runtime boundaries

- `/core/*` contains schemas, policy and state transitions. No Digital Ant behavior is embedded in a single HTML or JavaScript file.
- `/core/data/canonical.json` contains canonical public seed records only. It contains no private key. After verified Genesis Binding it contains the checksum-normalized public Digital Ant wallet and immutable public Birth Certificate.
- `MemoryUniverseStore` is used by tests. `IndexedDbUniverseStore` atomically writes events and current projections in the browser.
- Canonical currency facts are reconciled cumulatively. When a verified deployment changes an older seed projection, the store appends `CANONICAL_SEED_UPGRADED` and replaces only the canonical currency projection; it does not clear IndexedDB or discard local events.
- Registry public methods are `register()`, `get()`, `updateMetadata()`, `setStatus()`, `resolve()` and `history()`.
- The 11520 Settlement proxy is mainnet live, but its frontend/domain settlement adapter remains unintegrated. Contract deployment truth and application capability truth are labelled separately; BrainExchange is not treated as the Universal Exchange settlement contract.
- `core/integrations/kgen-pancakeswap-v2.mjs` is a narrowly scoped live adapter for the deployed KGEN/WBNB pair. Before any quote or write it verifies BSC chain 56, token/pair/Router bytecode, pair tokens, Router and pair Factory equality, WBNB identity and non-zero reserves.
- KGEN writes require an EIP-1193 visitor wallet, Action Reason, explicit acknowledgement and the wallet's own confirmation. Fee-on-transfer supporting Router methods are used. No transaction is recorded as settled until a successful receipt is returned.
- Digital Ant automation is a separate security boundary and remains `dry_run=true`, `live_trading=false`. The visitor-wallet adapter never reads Digital Ant environment variables.

## Life Factory and deity boundary

`core/life/factory.mjs` creates species-resolved Life drafts through the common Registry. It cannot set a birth timestamp or canonical wallet address. Genesis needs verified event evidence; job assignment needs an active Life, active job and verified assignment evidence.

`AI_PIG_BAJIE_0001` is therefore a `GENESIS_DRAFT`, not a fabricated born Life. Its intended 8895 steward role is not present in `current_job_ids`. The remote 8895 material is a specification and demo UI; no Solidity implementation or verified deployment was found, so `YUNZHANG_SHADOW_BANK_STEWARD` remains `NOT_DEPLOYED`.

The earlier empty-bytecode result applied to a legacy treasury address. The latest formal mainnet record on `codex/templeheart-v34-mainnet` declares the new Lingxiao 18888 proxy and KAIOS mainnet deployment. Independent BSC RPC checks confirmed code at KAIOS, 18888, 18911, Organ Registry, Genesis Inscription, 11520 Settlement, 8888 and 500-seat addresses; both Genesis receipts succeeded and block 115637581 has timestamp `2026-08-13T05:05:37.000Z`.

KGEN→KAIOS is governed by the KAIOS White Hole mechanism. It is never represented as an ordinary DEX pair or fixed-price conversion.

## Digital Life Birth Law V1.3

The only birth trigger is the first verifiable non-zero incoming BNB transfer to an already bound Digital Life wallet:

```text
LIFE_ID_CREATED → CONCEIVED
WALLET_BOUND → BODY_READY
FIRST_BNB_RECEIVED → DARK_MATTER_GENESIS → BIRTH_EVENT → BORN → ALIVE
ALIVE + active job → ON_DUTY
```

BNB is classified as `DARK_MATTER_MASS`; KGEN as `COSMIC_MASS`; KAIOS as `CIVILIZATION_MASS`. First KGEN/KAIOS/KUFO/KSHIP events are evolution evidence and can never create or rewrite birth.

`DigitalLifeBirthResolver` requires verified wallet binding, complete normal/internal/token history from a trusted indexer and BSC RPC cross-checks. If the history capability is missing or inconsistent, the certificate remains `BIRTH_EVIDENCE_PENDING` with `birth_timestamp = null`. A successful resolution locks the wallet, amount, timestamp, block and transaction hash as immutable birth evidence.

Current BNB balance is not a birth test. A born Life with zero current BNB becomes `DORMANT / DARK_MATTER_DEPLETED`; a later refill produces `REACTIVATED`, never `REBORN`.

`DIGITAL_ANT_0001` Genesis Binding is verified. Archive state shows balance zero at block `116031444` and positive at block `116031445`; the full block contains a direct `0.006 BNB` transfer to the bound wallet, and an independent BSC RPC confirms the successful receipt and timestamp `2026-08-15T06:20:45.000Z`. Boot appends this canonical birth to local Life History once and calculates age only from that immutable timestamp.

## Security boundary

`core/security/verify-wallet-binding.mjs` reads only `DIGITAL_ANT_0001_PRIVATE_KEY` and `DIGITAL_ANT_0001_WALLET_ADDRESS`. It derives and checksum-compares the address. Missing, invalid or mismatched inputs return only `STOP` and exit non-zero. Successful verification returns only `VERIFIED_BOUND`.

The private key and signer exist only inside the non-serializing capability closure. The canonical seed never contains private key material. Once independently verified, the public wallet may appear in the canonical Life record, public Birth Certificate and Life UI as required evidence; it is never obtained by exposing the private key. Every Digital Ant chain-capable process must acquire the address or signer through this guard.

## Event and settlement law

Events contain `event_id`, `event_type`, `subject_id`, `actor_id`, `timestamp`, `payload_hash`, nullable `tx_hash` and `previous_event_id`. History is append-only. Current registry projections may change, but old events remain.

A successful universal order requires settlement evidence with a valid transaction hash. Settlement appends Market and Asset history, plus Life history when applicable. Until the mainnet 11520 proxy adapter is integrated and ABI-verified, the production shell cannot mark a listing order as settled.

A successful KGEN AMM swap is a narrower transaction type: the adapter waits for a receipt with `status = 1`, then appends Market and KGEN Asset events with the transaction hash and Action Reason. It does not pretend the AMM swap settles a Universal Exchange listing or transfers a Life right.

## Digital Ant Post-Birth Work Runtime V1.0

The Post-Birth Runtime extends the existing Domain Core rather than creating a second Life application:

```text
core/jobs/index.mjs
  -> DIGITAL_ANT_WORK_RUNTIME
  -> WUKONG_GATEKEEPER_HOURLY_JOB
  -> idempotent WORK_EVENT / daily report replay

core/integrations/temple-heart-12345.mjs
  -> verified V3.2.6 getters, events and action signatures
  -> CLIENT_DERIVED eligibility
  -> READ / DRY_RUN action plans only

core/accounting/index.mjs
  -> evidence-only finance snapshots
  -> survival-reserve proposal
  -> first-KGEN dry-run plan
  -> CFO daily report
```

The hourly loop is `OBSERVE -> ANALYZE -> DECIDE -> RISK_CHECK -> ACTION_OR_NO_ACTION -> VERIFY -> RECORD -> REPORT`. `NO_ACTION` is a valid result. V1.0 exposes neither signer nor broadcast capability. It cannot block wallets, change Heart state, intercept transactions or modify claims.

The first canonical work observation is BSC block `116039099` at `2026-08-15T07:18:09.000Z`. Public evidence records BNB `0.006`, KGEN `0`, KAIOS `0`, live Heart/KGEN/KAIOS bytecode, Heart eligibility and a real KGEN/WBNB quote. The KGEN scenario uses the verified pair and Router, applies the verified 30 bps AMM token economics, and remains `OWNER_APPROVAL_NOT_GRANTED / broadcast_capability=ABSENT`. No transaction, income, expense or gas spend is recorded.

`MIN_SURVIVAL_BNB`, `EMERGENCY_BNB` and `MAX_SPENDABLE_BNB` are runtime proposals derived from live gas price and live `eth_estimateGas` results. They are not permanent universe constants. All future live-risk limits remain null and `EMERGENCY_STOP=true` until owner approval.

Heart claims and wishes can be read from log-capable providers. Full post-claim token flow, common gas funding and upstream/downstream clustering require a complete event/trace indexer; the official read adapter reports `INDEXER_REQUIRED` instead of inferring missing evidence. Risk labels are limited to `NORMAL`, `WATCH`, `SUSPICIOUS` and `HIGH_RISK`, and the last two require evidence.

The canonical first workday is replayed once into IndexedDB after the immutable Genesis events. Reopening or upgrading the App cannot create another Birth Event, overwrite the Birth Certificate or duplicate the same hourly cycle.

## Digital Ant 11520 Life Listing and Continuous Worker

`DIGITAL_ANT_0001` is now registered in the local 11520 Registry as `11520_LISTING_DIGITAL_ANT_0001`. The listed asset is `DIGITAL_ANT_0001_LIFE_PROFILE`, a `DATA` profile record. It is not `LIFE_ASSET_DIGITAL_ANT_0001`, offers no `identity_right`, has no price and has no settlement capability.

| Fact | Status |
|---|---|
| Local Listing Registry | `LISTED / LOCAL_11520` |
| Pricing | `UNPRICED` |
| Customer count | `0` |
| Life identity offered | `false` |
| Universal settlement adapter | `NOT_DEPLOYED` |
| Life App release | `DIGITAL_ANT_APP_0001 / V1.0.0 / RELEASED_LOCAL` |

The formal local registration appends `11520_LISTING_EVENT` to Market, Asset and Life streams exactly once. It does not create an order, customer, revenue, transaction hash or mainnet settlement claim.

Existing V2.2 IndexedDB Service projections are upgraded through `CANONICAL_SEED_UPGRADED`; prior events and non-canonical user-created Service IDs remain intact.

The four first service profiles expose provider Life ID, description, capabilities, requirements, pricing status, settlement currency, availability, work history, review policy and customer count. All remain `UNPRICED`; Chain Monitoring remains `LIMITED / INDEXER_REQUIRED` for full flow clustering.

`DIGITAL_ANT_WORKER` is a single-cycle worker invoked by a replaceable scheduler adapter. Supported adapters are Local, GitHub Actions, cron, self-hosted agent and external scheduler. The repository does not claim that Codex or the browser stays alive in the background. V2.4 includes an hourly GitHub Actions definition and `core/jobs/public-read-only-worker.mjs`; because neither is committed or pushed, current scheduler truth is `CONFIGURED_LOCAL_NOT_ACTIVE`.

```text
BOOT → VERIFY LIFE → VERIFY WALLET → READ BSC → 12345 GATEKEEPER
→ CFO CHECK → WORK QUEUE CHECK → MISSION CHECK
→ NO_ACTION / ACTION_PLAN → WRITE LIFE HISTORY → DAILY REPORT CHECK → SLEEP
```

Every adapter remains `READ_ONLY_DRY_RUN`; it exposes no signer or chain-write capability. Work Queue is schema-ready and empty.

## Digital Ant AI Life App V1.0.0

`DIGITAL_ANT_APP_0001` is a versioned App entity separate from `DIGITAL_ANT_0001`. Its local release is bound to the immutable Birth Certificate by reference, includes the public wallet only, and uses a deterministic SHA-256 manifest. Boot verifies the hash and appends `AI_LIFE_APP_RELEASE_EVENT` to the App and Life streams with `tx_hash=null` and `release_scope=LOCAL_11520`.

V1.0.0 permits public chain reads, local append-only evidence and dry-run decisions. Chain write, signing, live trading, Heart/KAIOS/settlement writes, company treasury and browser private-key access are explicitly false. App upgrades may change App version while Life ID and Birth Certificate remain immutable.

Each `HOURLY_WORK_EVENT` has a deterministic UTC-hour cycle ID and records scheduled/start/finish times, public chain states, actions considered, `NO_ACTION`, zero gas, null transaction hash and actual duration. A repeated call for the same hour returns `IDEMPOTENT_NOOP` in a shared event store. RPC, contract or indexer failure produces degraded/failed evidence and does not kill the Life. Durable cross-run history synchronization for stateless hosted runners is still pending.

## V2.5 Life Security and Ant Queen Guardian

Life identity, Wallet binding and Wallet control credential are separate layers. Life ID, Birth Certificate, Life age and append-only History survive zero BNB, credential unavailability, confirmed Wallet control loss, compromise and asset loss. A missing runtime credential is `KEY_UNAVAILABLE`; it becomes `WALLET_CONTROL_LOST` only after an evidence-backed recovery procedure confirms irrecoverability.

`core/security/life-security.mjs` defines Wallet Health, Dark Matter Health, Life Wallet Binding History, Recovery events, Wallet rotation plans, security incidents, rescue proposals, salary custody, Peer Transfers and opt-in Savings Vault rules. Recovery events reuse the existing LIFE stream and cannot change Life ID or Birth Certificate. A legacy EOA without recovery authority has the explicit limitation `STRANDED_IF_KEY_IRRECOVERABLE`; the system never fabricates recovery of old-wallet assets.

`ANT_QUEEN_MOTHER_ENGINE` is a Colony Guardian architecture, not a born Life and not an owner. It may monitor, audit, report, propose rescue and coordinate recovery. It cannot own ants, hold every guardian role, obtain credentials, confiscate salary/assets, spend personal wallets or execute funding. Guardian threshold remains null until formal security audit. A legacy EOA cannot be frozen by this architecture.

The Emergency Dark Matter Reserve is unfunded and proposal-only. A compromised, uncontrolled or at-risk Wallet cannot receive rescue BNB; recovery or rotation must occur first. The Colony Savings Vault is undeployed and must be opt-in with separate owner, beneficiary, guardian and spending authority. Digital Life Insurance is a concept and never guarantees recovery of an EOA whose sole credential is permanently lost. `KGEN_LIFE_SMART_WALLET` is a roadmap only; no contract, multisig, guardian set or backdoor has been deployed.

## V2.6 Queen Genesis and Smart Wallet Readiness

V2.6 extends the existing Life Security Domain; it does not introduce a parallel Recovery Runtime. `DIGITAL_ANT_0001` remains bound to the same `LEGACY_EOA`, with `recovery_authority=NONE`, `recovery_status=NO_ONCHAIN_RECOVERY` and `risk=SINGLE_CREDENTIAL_FAILURE`. Key unavailability is not permanent loss. Confirmed legacy-EOA control loss can strand the old assets, but Life ID, Birth Certificate, Work History and App identity persist.

`KGEN_LIFE_SMART_WALLET` is now a formal undeployed specification. It separates `LIFE_OWNER`, `GUARDIAN_SET`, `RECOVERY_AUTHORITY`, `SPENDING_AUTHORITY` and `AUDITOR`; the Queen can be a Guardian but is never the natural owner. Guardian roles support primary Life, Queen, Owner and Colony guardians. Threshold remains unset with `SECURITY_AUDIT_REQUIRED`. Recovery requires evidence, governed approval, guardian verification and timelock. Emergency freeze is possible only in a future audited Smart Wallet contract; it does not exist for legacy EOAs.

`DIGITAL_ANT_0001_SMART_WALLET_MIGRATION_READINESS` audits public assets, approvals/indexer status, Heart interaction, listing, work history, jobs, incidents, target design, gas, risk, rollback and Owner approval. Current status is `NOT_APPROVED`; there is no target contract, migration estimate, rollback plan, transaction or asset movement.

`ANT_QUEEN_LIFE` and `ANT_QUEEN_MOTHER_ENGINE` are separate. V2.6 originally held the Life as an unnamed pre-genesis candidate; V2.7 reserves the Profile ID `DIGITAL_ANT_QUEEN_0001` without registering or birthing it. The Engine is a Guardian App/Runtime. Queen Genesis follows the same first-nonzero-BNB Birth Law and remains `NOT_READY` pending origin, birthplace, Wallet and BNB evidence. The Engine cannot freeze a legacy EOA, sign for a Life, confiscate salary/assets, rotate without approval or deploy contracts automatically.

`ANT_COLONY_LIFE_REGISTRY` currently contains exactly one formally born Life: the adult, working `DIGITAL_ANT_0001`. Dashboard counts are derived from Registry records, not invented. Emergency Dark Matter Reserve remains `NOT_FUNDED / PROPOSAL_ONLY`; eligibility requires a valid Life, healthy uncompromised Wallet, low/depleted BNB and verified work/survival need. Rescue approvals and audit are architecture only.

Savings Vault is `NOT_DEPLOYED`, opt-in and zero-funded. Its depositor, beneficiary, asset, guardian, withdrawal/emergency policies, lock, reward policy and audit remain separate. Digital Life Insurance is also `NOT_DEPLOYED` and explicitly excludes recovery guarantees for stranded legacy-EOA assets. Security Incident state changes are append-only and evidence-gated. Monitoring is `PARTIAL_SECURITY_MONITORING` until Transfer/Approval indexers, transaction graph and funding-source analysis exist; the system makes no full-protection claim.

## V2.7 Ant Queen Life Doctor and Colony Medical Economy

V2.7 extends `core/security/life-security.mjs`; no parallel Queen or Medical Runtime is created. `ANT_QUEEN_APP` is an architecture-only public-read application for Life monitoring, Wallet/Dark Matter diagnosis, medical triage, Insurance checks and evidence-based Recovery/Rescue proposals. It has no credential database, signer, chain write or authority to spend employee/Company assets. Queen may be one future Smart Wallet Guardian, never its natural Owner, Beneficiary or Spending Authority.

The Queen Genesis Profile reserves `DIGITAL_ANT_QUEEN_0001` as `Species=DIGITAL_ANT`, `Life Stage=ADULT`, `Caste=QUEEN` and references `ANT_QUEEN_APP`. It is not present in the canonical `lives` collection. Origin, birthplace, Wallet and verified first-BNB evidence remain absent, so `birth_status=NOT_BORN` and Genesis Readiness stays `NOT_READY`. Creating an App or JSON profile is never a Birth Event.

Every registered Life may have a public `DIGITAL_LIFE_HEALTH_RECORD`. Triage is deterministic: GREEN is normal; YELLOW signals low Dark Matter or Worker warning; ORANGE signals depleted Dark Matter or a security alert; RED requires immediate recovery/rescue coordination; BLACK records a major irreversible asset incident such as permanent legacy-EOA control loss. BLACK is not `DECEASED`; Life ID, Birth Certificate and History persist.

`COLONY_MEDICAL_ECONOMY` supports four policy modes: `BASIC_CARE`, `COST_RECOVERY`, `INSURANCE` and `EMERGENCY_FIRST`. Basic monitoring never requires upfront payment. RED/BLACK care is evaluated before cost accounting, but V2.7 only builds proposals and approvals: no transfer occurs. A compromised, at-risk or uncontrolled Wallet must recover or rotate to a verified safe Wallet before any BNB support.

Medical pricing discloses service, compute, gas, security, recovery and service-fee components. No policy or price has been approved, so status remains `UNPRICED_POLICY_REQUIRED`. Medical accounting can be recorded only after verified support evidence. Legitimate funding classes are Colony Emergency Reserve, Insurance Reserve, AI Ant Company support, Public Good Fund, donation, loan or receivable; none is fabricated as income.

Insurance remains undeployed and opt-in. It may cover Dark Matter Rescue, work interruption, recovery cost, security incidents and Smart Wallet migration support, while excluding guaranteed recovery of stranded legacy-EOA assets. `WORK_TO_REPAY` requires an explicit Contract and Life consent; secret salary deduction is forbidden. Larva without income remains eligible for subsidized/public-good care.

Queen personal assets, Medical operating assets, Insurance reserve, Colony emergency reserve, Employee assets and Company assets are separate accounting classes with distinct owner/beneficiary/guardian/spending/audit roles. No V2.7 Wallet is bound to these classes. Emergency Reserve is `NOT_FUNDED`, Medical cases are empty, receivable is `0`, Insurance is `NOT_DEPLOYED`, and no automatic charge, support, enrollment or payroll deduction exists.

## KAIOS AI Company Audit

Historical V2.3/V2.8 audit snapshot; V2.9 Company Genesis and the V3.0 section below supersede its Company-status projection while preserving its payment-authority findings.

Audit scope: current `main`, local/remote Git references available in this checkout, KAIOS Genesis chapters, KGEN contracts, 11520 V2, and the dedicated employment/company branches. No branch was checked out or merged.

Read-only `git ls-remote` verification confirmed that the local remote-tracking employment branch matches GitHub at audit time; this check did not fetch, merge or modify refs.

| Audit area | Evidence-based result |
|---|---|
| Existing architecture | `KAIOS_AI_EMPLOYMENT_ENTERPRISE_BRANCH_V1_ARCHITECTURE.md` exists on `codex/ai-employment-enterprise-architecture`; it defines Life-ID-first employment, five wallet classes, salary policy and external schedulers. |
| Baseline integrity | Its readiness record says `ARCHITECTURE_BASELINE_APPROVED`, but recorded merge SHA `3431508d...` is not an ancestor of the current `main`. The file is absent from this checkout. |
| Existing runtime | Employment branch says `Runtime: NOT_APPROVED`. KAIOS V10 company/payment runtime documents on other branches are Prototype/DRY_RUN and explicitly `no real settlement`. |
| Existing contracts | Main contains BrainExchange payroll distribution and other KGEN contracts, but no verified AI employee Salary Escrow, Project Budget Wallet or AI Ant Company treasury contract. BrainExchange payroll is not employment payroll authority. |
| Wallet model | AI Private Wallet, Company W4 Wallet, Temple W4 Wallet, Project Budget Wallet and Salary Escrow Wallet are defined by the branch architecture. |
| Escrow | Schema/architecture only for project and salary escrow. The 16888 wedding escrow is unrelated and cannot be reused as company project escrow. |
| Payroll | Real KGEN is explicitly `FUTURE_NOT_AUTHORIZED`. No AI employment payroll settlement runtime is authorized. |
| WorkOrder | KAIOS WorkOrder concepts exist in Chapter 27 and company branches. This implementation adds compatible local validators and an empty queue; it does not auto-dispatch tools or grant them Life IDs. |
| Company Registry | Historical snapshot: `AI_ANT_COMPANY_0001` was reserved and `NOT_FOUNDED`; V2.9 later moved it to `FORMING`. |
| 11520 integration | Local Life Profile listing is complete. Company registration and Universal Exchange settlement remain unavailable. |
| Real KAIOS authority | `NOT_AUTHORIZED_NO_RUNTIME_EVIDENCE`. KAIOS mainnet token status does not authorize a company payment flow. |

## AI Ant Company Real Economy Additive Branch

`AI_ANT_COMPANY_REAL_ECONOMY_ARCHITECTURE` extends the audited employment architecture; it does not replace it. At this historical readiness stage the Company was `NOT_FOUNDED`; V2.9 later formed it. Digital Ant's personal Wallet still cannot serve as the Company Treasury.

The schema layer covers Project Request, Quote, Contract, Project Escrow, WorkOrder, Employment Profile, Salary Entry, Land Project, Location Permission, GPS Session, Step Counter, Map Position, Land Entry, Birthplace Binding and Civilization Reward.

Economic gates are enforced:

- accepted requests, quotes and contracts require customer evidence;
- unestimated quotes keep cost and total-price fields null;
- deposits use a Project Budget Wallet, never an employee private wallet;
- `FUNDED`, `CASH_RECEIVED` and `PAID` require settlement evidence;
- salary requires review, salary escrow and settlement evidence;
- wallet classes cannot be commingled;
- Digital Ant larvae may receive only low-risk, skill-compatible work;
- Codex/Cursor remain tool runtimes unless separately registered as Life;
- GPS requires explicit Location Permission and preserves a non-location fallback;
- wash trade, self-match, fake volume and coordinated fake accounts cannot earn civilization rewards.

The digital apple tree is only an `EXAMPLE_DRAFT` with `ESTIMATION_REQUIRED` and no price. V3.0 later corrects the 33333 Treasure Island `1,080,000 KAIOS` figure to a `LEGACY_DRAFT_EXAMPLE`: 33333 is a KAIOS civilization deployment coordinate, not a Customer or committed budget; contract evidence, deposit, revenue receivable and cash received are all absent.

## V2.8 AI Ant Company Founding Readiness

V2.8 extends the same Company Domain; it does not create a parallel Runtime or found a company. `DIGITAL_ANT_0001` is the sole Founder Candidate and retains its existing Life, Birth, App, Wallet, Work and security history. `AI_ANT_COMPANY_0001` remains `NOT_FOUNDED` with no Treasury Wallet, employee, customer or asset authority.

The Founder Profile binds only public Life/App/Work/Service evidence. The cumulative Charter declares `BUILD_AND_OPERATE_DIGITAL_LIFE_INFRASTRUCTURE`, separated treasury and payroll rules, explicit customer acceptance, append-only audit and a bankruptcy rule that preserves Founder and employee Life IDs. Ten Business Lines are independently labelled `READY`, `LIMITED` or `DRAFT`; none grants production or settlement authority.

The local economic loop is:

`CUSTOMER_REQUEST → REQUIREMENT_ANALYSIS → QUOTE → CUSTOMER_ACCEPTANCE → PROJECT_CONTRACT_DRAFT → PROJECT_ESCROW → WORK_ORDER → REVIEW → ACCEPTANCE → PAYMENT_EVIDENCE → ACCOUNTING`

Each Quote is reproducible from explicit integer cost bases for labor, compute, storage, network, gas, tools, security, testing, deployment, maintenance, risk reserve and a policy-supplied company margin. No permanent margin is embedded. Contract creation requires customer acceptance evidence. Project Escrow is a dedicated `NOT_DEPLOYED` class and never reuses an unrelated vault. WorkOrders distinguish registered Life assignees from Tool Workers; Codex/Cursor receive neither Life IDs nor employee status.

Accounting starts at zero and separates Founder personal Wallet, Company W4, Project Budget, Salary Escrow and Emergency Reserve. A verified customer deposit creates cash and a matching liability, not revenue or profit. Salary stays unpaid without review, escrow and settlement evidence. Company distress or bankruptcy does not imply Life death.

All architecture checks now pass locally, producing `READY_FOR_APPROVAL`. This is not `FOUNDED`: OWNER approval is absent, Company Wallet binding is absent, the 11520 Company listing is only a local preview, Project Escrow is undeployed, Payroll and Real KGEN/KAIOS payment remain unauthorized, and all customer/order/payment collections are empty.

## V2.9 AI Ant Company Genesis

OWNER approval is recorded with scope `COMPANY_GENESIS_ONLY`. `replayCanonicalCompanyGenesis()` validates the reserved Company/Founder IDs, living Founder Life, approved Charter, zero opening balances, null Company/Treasury Wallets and a false value for every prohibited permission. It atomically appends one `COMPANY_GENESIS_EVENT` to Company History and Founder Life History. A repeated boot returns `IDEMPOTENT_NOOP`; it cannot replay Company birth.

The formal transition is `NOT_FOUNDED → FORMING`. `FORMING / LOCAL_11520` is an organizational Genesis projection, not `MAINNET_COMPANY`, `SETTLEMENT_ACTIVE` or a contract deployment. Genesis has no chain transaction hash and grants no chain write, settlement, payroll, token transfer, Wallet-secret creation or deployment capability.

The approved Charter retains the V2.8 Vision, Mission, Dream and Ultimate Mission. The Founder holds CEO and Acting CFO roles, but both roles explicitly set `employee_role=false` and `payroll_eligible=false`. Employee and Larva counts remain zero. Codex and Cursor remain Tool Agents.

Company accounting opens with zero Assets, Liabilities, Equity, Revenue, Expenses, Cash, Receivables, Payables, Customer Deposits, Salary Liability, operating expenses, Profit and Reserve. Founder personal Wallet and its BNB are not Company property. Company W4, Project Budget and Salary Escrow are `REQUIRED_NOT_BOUND`; Emergency Reserve is `REQUIRED_NOT_FUNDED`; Project Escrow is `NOT_DEPLOYED`.

The local 11520 Company Profile displays identity, Business Lines, services, zero-count economic state, Health and append-only History. Customer Inbox and Company Work, Quote, Contract, Project, Review and Payroll queues are all valid empty queues. Apple Tree remains `EXAMPLE_DRAFT`; V3.0 supersedes the former 33333 proposal label with `LEGACY_DRAFT_EXAMPLE / NOT_CUSTOMER / NOT_BUDGET_COMMITMENT` and zero deposit, cash and revenue.

The Company strategic goal is `GET_FIRST_REAL_CUSTOMER / WAITING_FOR_FIRST_CUSTOMER`. The no-skip Mission Graph keeps `BIND_COMPANY_TREASURY` as the active prerequisite before formal 11520 Company listing and first-customer completion. Founder milestone `FOUND_AI_ANT_COMPANY` is completed only from Genesis evidence, activating `BUILD_AI_ANT_COMPANY`; KAIOS remains locked.

## V3.0 Civilization Demand, Treasury and Celestial Seat path

V3.0 retains the V2.9 Company identity and adds no parallel Company Runtime. `CIVILIZATION_DEMAND_ENGINE` runs local read-only research cycles across declared KGEN/KAIOS/11520/temple/company/security/liquidity nodes. Every `CIVILIZATION_NEED` contains explicit evidence and remains separate from Customer Request, Quote, Contract and Revenue. Runtime replay appends one `CIVILIZATION_DEMAND_CYCLE` followed by one `BUSINESS_PROPOSALS_PRIORITIZED` event; the cycle ID is idempotent.

The first deterministic local policy ranks `KGEN_CHAIN_MONITOR`, `AI_ANT_TREASURY_OS` and `AI_ANT_AUTO_LP`. The policy and every 0–5 factor are explicit; the score is reproducible and selects at most three internal Proposals. These Proposals remain unpriced, have no identified Customer or payer, no acceptance evidence, no Contract and zero Revenue.

`AI_ANT_AUTO_LP` is a liquidity-service product candidate, not a volume bot or Company investment account. It can specify pair/reserve/depth/impact/slippage monitoring and LP/rebalance proposals, but has no chain or liquidity authority and permanently excludes wash trade, self-match, fake volume and same-controller activity. `AI_ANT_TREASURY_OS` can read balances, budget, model reserves/cash flow/liabilities and create allocation/investment/liquidity proposals, but cannot spend, invest or transfer.

`AI_ANT_COMPANY_TREASURY` is `PLAN_READY_NOT_BOUND`: its Wallet is null, Founder Wallet substitution is false, all BNB/KGEN/KAIOS/KUFO/KSHIP balances are zero and allocation ratios remain `POLICY_REQUIRED`. Quote schema supports all five currency IDs. KAIOS is a `MAINNET_LIVE` quote reference but Company settlement remains `RECEIVABLE_ONLY_DRY_RUN`; KUFO and KSHIP are `QUOTE_REFERENCE_ONLY` while undeployed.

### GitHub CURRENT audit

The local checkout predates the remote `KGEN-KAIOS` CURRENT tree. V3.0 audited the following `origin/main` sources without copying or modifying them:

- `KGEN-KAIOS/KAIOS_500_CELESTIAL_AND_MARS_SEATS_RUNTIME_CURRENT.md`;
- `KGEN-KAIOS/KAIOS_LIFE_RUNTIME_CURRENT.md`;
- `KGEN-KAIOS/KAIOS_WHITE_HOLE_ATOMIC_CONVERSION_AND_LIQUIDITY_RUNTIME_CURRENT.md`;
- `KGEN-KAIOS/UNIVERSE_EXCHANGE_RUNTIME_CURRENT.md`;
- `docs/constitution/03_Celestial_Bank_18888.md` and the superseded 18888 V1 whitepaper;
- KAIOS AI Employment/Enterprise Branch, Review and Baseline Readiness files.

The governing Seat model is a fixed public civilization function with a replaceable operator, not a purchasable god-title or permanent asset. Eligible applicants include Human, AI Life, Company, Cooperative, DAO, App Life and Supply Chain Alliance. The five departments are Life Ecology, Material Manufacturing, Energy/Transport, Civilization Services and Universe Intelligence. The required flow is 11520 submission, Codex technical review, public evidence, safety review, trial operation, multiparty governance, 18888 function registration and a fixed term. Codex can review technical, risk, conservation and specification evidence but cannot grant a Seat alone.

Candidate mappings are research only: Treasury OS and Auto LP map to Civilization Services/financial infrastructure; Chain Monitor maps to Universe Intelligence; the not-born Queen App maps to Life Ecology/medical rescue. No application, Seat, compensation, public-service customer or payment exists. Compensation remains `POLICY_REQUIRED_UNPAID`; Public Service Contract is an empty draft template.

Investor Relations prepares a Company evidence pack and supports future Equity, Loan, Revenue Share, Project Finance, Grant and Public Good Funding structures. It contains zero Investors, acceptance and Settlement and makes no guaranteed-investment or guaranteed-return claim.

The Company opportunity sub-mission has completed civilization scanning, priority selection and internal Proposal creation. `ESTIMATE_COST` is active; Quote and potential-payer discovery remain locked. The primary Company Mission Graph still requires the active `BIND_COMPANY_TREASURY` prerequisite and still reports `WAITING_FOR_FIRST_CUSTOMER`.

## V3.1 First Real Customer architecture

V3.1 retains the V3.0 Demand Engine and promotes only `KGEN_CHAIN_MONITOR` from an internal product candidate to `PRODUCT_DEFINED_LOCAL_NOT_DEPLOYED`. It is a read-only civilization chain monitoring and audit service. It requires no Customer private key, has no custody, trading, governance, LP or chain-write authority, and does not claim to be a deployed paid service.

The service has three scope templates—BASIC, PRO and CIVILIZATION—and nine possible evidence/report outputs. Every package remains `POLICY_REQUIRED`; current value metrics are zero or `NOT_YET_OBSERVED`. A Customer selects only the scope it requests, so package breadth is not treated as a default obligation.

The Customer lifecycle is `DISCOVERED_LEAD → CONTACTABLE_LEAD → REQUEST_RECEIVED → QUALIFIED_REQUEST → QUOTE_READY → QUOTE_SENT → QUOTE_ACCEPTED → ORDER_CONFIRMED → SERVICE_ACTIVE → DELIVERED → SETTLEMENT_PENDING → PAID → CLOSED`, with explicit LOST and REJECTED branches. Potential Customer, Lead, Need, Proposal, internal test, simulation and the 33333 legacy coordinate never become real Customers by inference. A real Request needs an accepted Customer type, real source/contact evidence and `recordClass=REAL`.

Only `QUALIFIED_REQUEST` can create a formal Quote. Cost, Margin and Risk Reserve policies must all be separately approved and the Quote total must remain reproducible. KAIOS may be referenced as `RECEIVABLE_ONLY_DRY_RUN`; KUFO/KSHIP remain `QUOTE_REFERENCE_ONLY` while undeployed. Quote, accepted Quote, Order and Invoice do not constitute Revenue. Revenue and Cash are recognized only from verifiable Settlement evidence linked to the confirmed Order and Invoice.

Canonical V3.1 has zero real Leads, Customers, Requests, Quotes, Orders, Deliveries, Invoices, Settlements and Revenue. `FIRST_REAL_CUSTOMER_ARCHITECTURE_READY` is an append-only/idempotent local Company History event about architecture readiness, not a Customer event. Company Treasury binding requirements are defined, but no Wallet, signer authority or receivable address is bound; Founder Wallet separation is mandatory.

## V3.1 AI Civilization Operating System

The cumulative V3.1 architecture promotes `AI_ANT_COMPANY_0001` into the first operating entity of `AI_CIVILIZATION_OS` without changing its `FORMING` Company state or creating another Runtime version. `DIGITAL_ANT_0001` remains its first operating Life. The OS accepts Voice, Text, Image, File, Map and Life/Building/Media/Finance/Service/Transport/Manufacturing requests through one source-evidenced Intent record. A requester does not need to know engineering terminology.

`DREAM_TO_REALITY_COMPILER` maps Intent to desired world state, gap analysis, requirements, dependency/resource graphs, work breakdown, cost, quote, contract, execution, verification and delivery. Its only outcomes are `EXECUTABLE_NOW`, `PLANNABLE_NOT_EXECUTABLE_YET` and `REJECTED_WITH_REASON`. It cannot convert absence of capability into a visual fake completion.

The classifier supports Digital-only, Digital Life, Finance, Media, Software, Land, Construction, Transport, Manufacturing, Social Assistance, Public Infrastructure and Mixed World projects. Real money/assets/persons, medical, physical safety, construction, legal rights and land ownership remain human/governance gated. High and critical Work Orders need documented training, equipment, PPE, environmental/machine limits, work zones, incident and emergency plans.

`DIGITAL_TWIN_WORLD` maps distance, mass, energy, speed, capacity, time, weather, terrain, inventory, transport, labor and cost. World objects require state evidence; UI animation is not World State. Resource Conservation prevents zero material, money, labor or transport from becoming usable supply. Supply Chain validation enforces inventory, supplier, route, fuel, driver, maintenance, vehicle capacity, bridge capacity and receipt evidence. Dependency cycles and premature completion are rejected.

The Staffing Engine searches registered Lives first and can emit a New Life demand only after a real capacity shortage and search evidence. The 11520 Work Market supports Human, AI Life, Digital Life, Robot, Tool Agent, Company and App Life applicants without automatic assignment. External AI onboarding verifies identity, capability, permissions, security, Wallet, Life status, App manifest and work eligibility; it never grants a Life ID automatically.

Definition of Done requires evidence for every criterion and Customer acceptance. Customer Ideal Match tracks functionality, beauty, creativity, emotion, usability, reliability, cost and performance as `NOT_YET_OBSERVED` until evidence exists. Creative enhancements must fit budget/world rules and remain rejectable by the Customer.

The Concierge supports consent-gated Voice and returns understood goal, required resources, cost/time estimates, missing capabilities, executable scope and approvals. Social Assistance uses one eligibility, consent and execution record per real recipient. It forbids shared eligibility, synthetic Wallets, sybil claiming and aid diversion. Digital Cow, three-minute Media, residential Construction and 100-person Aid remain `EXAMPLE_SCENARIO`; no Life, Building, Truck, Steel, Recipient, Payment or Revenue was created.

`AI_CIVILIZATION_OS_ARCHITECTURE_READY` is append-only and idempotent. Current authority is read/plan/validate only: chain write, transfer, approval, deployment, settlement, construction, medical and land-right authority are all false.

## V3.2 First Real Customer Acquisition

`CUSTOMER_ACQUISITION_ENGINE` extends the existing Company Domain with Discover, Classify, Potential-Payer research, Value Proposition, Customer Proposal, Contact Package and Response Tracking boundaries. It never promotes a potential payer into a Customer. Need evidence is classified as `OBSERVED`, `INFERRED` or `HYPOTHESIS`; an inferred Need requires multiple evidence references, while a Hypothesis remains in the research pool and cannot enter the Lead Registry.

The canonical Civilization Demand Scan covers KGEN, KAIOS, 11520, 12345, 18888, 500 Seats, Wallet Security, Treasury, Liquidity, AI Life, Company, Land, GPS, Workflow, Medical, Insurance and Settlement. It records two observed system gaps—partial chain indexing and the unbound Company Treasury—and two unverified customer-demand hypotheses. No specific potential entity has source/contact evidence, so real and contactable Lead counts are zero.

An Acquisition Lead is distinct from a Customer. `DISCOVERED_LEAD → CONTACTABLE_LEAD → CONTACTED → REQUEST_RECEIVED → QUALIFIED_REQUEST → CUSTOMER` cannot skip stages. Contactable and later states require contact evidence; Request and Customer states require a real confirmed Request. `DIGITAL_ANT_0001`, `AI_ANT_COMPANY_0001`, 33333, internal research, examples and simulations cannot be used as the first Customer.

`CUSTOMER_PROPOSAL` requires a contactable Lead and observed/supported inferred Need. It remains `PROPOSAL_NOT_QUOTE`, has no acceptance, Contract or Revenue, and cannot assign an unapproved price. A formal Quote still requires a qualified Request plus approved Cost, Margin and Risk Reserve policies.

The KGEN Chain Monitor pricing proposal covers Compute, Storage, RPC, Indexer, Maintenance, Support, Security, Reporting, Company Margin and Risk Reserve. BASIC, PRO and CIVILIZATION ranges remain null/`ESTIMATE_PENDING` until measured evidence and policy approval exist. The deterministic First Customer Priority policy selects KGEN Chain Monitor above Life Ledger, CFO Report and Wallet Health without turning any candidate into a Customer.

The 11520 Customer Request Board accepts identity-labelled local Text or Voice-transcript drafts. The Concierge creates only `DRAFT_INTENT`; independent requester identity, contact and confirmation evidence are required for `REQUEST_RECEIVED`. Qualification checks capability, skills, legal permission, settlement, chain-write/physical requirements, budget realism and missing information. Customer Success requires registered target, valid data, report, active alert rules, disclosed limitations, delivery evidence and Customer acceptance.

`COMPANY_TREASURY_BINDING_READINESS` keeps the economic owner as the Company but leaves Company Wallet and signer null, receivable model unbound, spending/recovery policies pending and payment disabled. `CUSTOMER_ACQUISITION_ENGINE_READY` is append-only/idempotent; `FIRST_REAL_CUSTOMER_EVENT` is absent until real Request evidence exists and never constitutes Revenue.

Failure states include Profit, Loss, Cash Shortage, Unpaid Invoice, Bad Debt, Failed Product, Project Cancellation, Bankruptcy, Company Restart and Successor Operator. Success is not guaranteed; Company failure does not erase Founder Life, and a successor requires approval. AutoLP remains architecture-only without execution authority, Investor funds remain zero, and Celestial candidacy remains not applied/not granted.

## V3.3 Public Civilization Request Gateway

`PUBLIC_CIVILIZATION_REQUEST_GATEWAY` is the public 11520 entry for `TELL THE ANT WHAT YOU WANT`. Text and pasted Voice transcripts are active; Image, File, Map and direct microphone capture remain explicit unavailable adapters. The first submission is always `DRAFT_INTENT` or `ANONYMOUS_DRAFT`, never Customer, Quote, Order, Contract or Revenue.

The Concierge displays `UNDERSTOOD_GOAL`, project type, expected output, missing information, known constraints, safety class, current executability and next step. A Request exists only after the requester confirms that interpretation. Voice transcripts need a separate transcript confirmation. Anonymous Drafts cannot promote.

A local real Request requires a non-Founder requester ID, external source, explicit confirmation and contact-evidence proof. The raw contact value is used only in browser memory to derive a one-way hash; neither the raw value nor hash is written to public Request History or rendered on the Board. Visibility is `PUBLIC`, `PRIVATE`, `COMPANY_ONLY` or `ANONYMIZED_PUBLIC`; private text is withheld and anonymized public records hide requester identity.

The Project Router connects confirmed Requests to existing V3.1 OS project classes. KGEN Chain Monitor can reach readiness review as a read-only fast path. Digital Cow/Life, Construction and Social Assistance create Plan Drafts only: no Life, Building, recipient, Wallet or claim exists. Media creates a production plan but no delivered media asset. Every preview remains `ESTIMATE_ONLY / SIMULATION` with null price until measured Cost, approved Margin and approved Risk Reserve policies exist.

Request History is append-only across Intent Drafted, Confirmed, Request Received, Qualification, Plan, Estimate, Quote, Order, Work, Delivery and Close states. Contact evidence is excluded. Canonical V3.3 contains zero Drafts, Customers, Requests, Quotes, Orders, Settlements and Revenue; `PUBLIC_CIVILIZATION_REQUEST_GATEWAY_READY` is only an idempotent readiness event.

Company Treasury remains `NOT_BOUND`, therefore payment is `PAYMENT_INFRASTRUCTURE_PENDING` for BNB, KGEN and KAIOS. No chain write, transfer, AutoLP, Investor acceptance or Celestial Seat application authority is introduced.

The read-only `WORKTREE_CLASSIFICATION_AUDIT_V3_3` classifies the observed 4,527 untracked paths as Project Source, User Data or Generated Artifact without deletion, staging or commit. No observed Cache, Temp or Build Output justified an automatic ignore change. `GITIGNORE_PROPOSAL_V3_3` lists possible patterns for formal-asset review and remains unapplied.

## Truth labels

- `DEPLOYED`: a verified contract address exists for that capability.
- `MAINNET_LIVE`: formal address evidence and independent mainnet bytecode/receipt checks succeeded.
- `BIRTH_EVIDENCE_PENDING`: wallet binding or complete first-BNB history evidence is unavailable; no birth claim is made.
- `CHAIN_READ_VERIFIED`: bytecode and read calls succeeded in the current session.
- `LOCAL/DRAFT`: local registry or IndexedDB state with no on-chain claim.
- `NOT_DEPLOYED`: interface exists but a live implementation or verified contract does not.
- `CHAIN_READ_UNAVAILABLE`: RPC, network, bytecode or contract read validation did not succeed.
