# Hengyao Payroll Bloodflow V1

**Task:** `KAIOS-HENGYAO-GM-PAYROLL-BLOODFLOW-V1-001`
**Execution base:** `672ab4884e8cf6f9d07c176a862fb858cafe8161`
**Status:** Mainnet governance executed after the full 3,600-second timelock; the Hengyao September 2026 payroll is scheduled and remains unclaimed until maturity.

## Exact rail

`18888 -> EconomicRouter8888 -> 8888 Payroll Pool -> Hengyao LIFE account`

- Purpose UTF-8: `KAIOS_AI_COMPANY_PAYROLL_GENESIS_POOL_V1`
- Purpose hash: `0x27ea560595229367d181c6af8c5d6a0d247dfcb34d469fbbe9d7c08c63e99d2e`
- Route domain: the deployed Router `MODULE_ID`, `0xb13d0845c93752f8c48622f9d8f06b2b5b503a2b264f614b59130b81156e5e54`
- Route ID: `keccak256(abi.encode(MODULE_ID, purposeHash))` = `0xae9577b23482c2bc76c7cee0798e0a69cd549305548cabde0b0781fe3d2f6cf6`
- Route amount: `888 KAIOS`
- 18888 available before/after: `11,213,908.930416874731235` / `11,213,020.930416874731235 KAIOS`
- 18888 reserve remains `11,000,000 KAIOS`.

The full machine-readable targets, values, payloads, hashes, proposal IDs, and fork results are in [HENGYAO_PAYROLL_BLOODFLOW_V1_UNSIGNED_PACKAGE.json](./HENGYAO_PAYROLL_BLOODFLOW_V1_UNSIGNED_PACKAGE.json). They are reproduced by `scripts/prepare-hengyao-payroll-bloodflow-v1.mjs`; no hand-entered hash is trusted.

## Governance sequence

Three independent proposals use Mother proposal, Jade Emperor approval, at least 3,600 seconds of delay, and permissionless execution:

1. Router `routeCapital` for exactly 888 KAIOS.
2. 8888 `createAccount` for `LIFE-CODEX-GM-0001`, with the same fixed beneficiary and controller.
3. 8888 `grantRole(PAYROLL_ADMIN_ROLE, Hengyao)` and no other role.

Only after all three executions and exact read-back may Hengyao directly schedule payroll ID `0x24305470fe1e35c8b06c111237606babb6de7c4e36c41b57980e2a1779e0ba54` for `88 KAIOS` in contract epoch `24320`. `202609` is not a valid substitute for the contract epoch.

Mainnet proposal, approval, execution, and schedule receipts are recorded in the machine-readable package. The latest proposal ETA was `2026-08-17T13:48:01Z`; the first execution was mined at `2026-08-17T13:50:14Z`, after the full delay.

Final read-back at block `116475334`:

- 18888 available: `11,213,020.930416874731235 KAIOS`; reserve unchanged at `11,000,000 KAIOS`.
- 8888 assets: `888 KAIOS`; free capital after scheduling: `800 KAIOS`.
- Hengyao LIFE account: active, fixed beneficiary/controller `0x4DF6E9629Dad1072103cFd2bC81845fd97429214`.
- Hengyao roles: `PAYROLL_ADMIN_ROLE=true`, `DEFAULT_ADMIN_ROLE=false`, `ACCOUNT_ADMIN_ROLE=false`.
- Payroll: `88 KAIOS`, epoch `24320`, `claimed=false`; first maturity is `2026-09-04T16:00:00Z` (`2026-09-05T00:00:00+08:00`).

## Latest read-only 18888 state

The current public source of truth is `latestReadOnlyObservation` in the machine-readable package. At BSC block `118356924` (`0xa7eb1cc739b3f48b6cb65b25e89ce9a991286f62e7f8fd64f4738802b5986897`, `2026-08-27T09:07:56Z`; `2026-08-27T17:07:56+08:00`), the 18888 proxy held a gross balance of `22,213,020.930416874731235 KAIOS`. Of that amount, `11,000,000 KAIOS` remained reserved and `11,213,020.930416874731235 KAIOS` was available. The contract reported cumulative accounted inflow of `22,213,908.930416874731235 KAIOS` and cumulative official outflow of `888 KAIOS`; its KGEN and native BNB balances were both zero. The proxy was healthy and unpaused, and direct KAIOS `balanceOf`, `kaiosBalance()`, `bankHealth()`, reserve, and available-balance cross-checks agreed exactly.

At the same block, 8888 held `888 KAIOS`: `88 KAIOS` was the exact unclaimed payroll liability and `800 KAIOS` was free capital. Account liability and business-payment liability were both zero. The one active Hengyao LIFE account still had balance `0 KAIOS`; payroll epoch `24320` remained unclaimed and becomes claimable only at `2026-09-04T16:00:00Z` (`2026-09-05T00:00:00+08:00`). `PAYROLL_ADMIN_ROLE=true`, while `DEFAULT_ADMIN_ROLE=false` and `ACCOUNT_ADMIN_ROLE=false`. Current calendar and banking epoch were both `24319`.

The gross KAIOS balance, reserve, available amount, and cumulative official outflow are unchanged from the post-execution closure state. The latest known authorized outflow remains the `888 KAIOS` payroll-pool route transaction `0x9059f3c6c2fdabf61a06c3b2eacbc985b9171d2731f74713000e8264fa37fccc`. This refresh was read-only and sent no transaction. A complete historical event scan is not claimed because the public RPC used for verification imposed a bounded `eth_getLogs` range; current contract accounting and token balances were read directly at the recorded block.

## Post-execution closure snapshot

`postExecutionSnapshot` is retained as historical closure evidence at block `116487188` (`0xbd08ee5d787f104123642bab33d75cb9651359e8b436aba4654a54c35c3b0e8a`). It records 18888 available `11,213,020.930416874731235 KAIOS`, reserve `11,000,000 KAIOS`, 8888 assets `888 KAIOS`, free capital `800 KAIOS`, payroll liability `88 KAIOS`, and Hengyao LIFE-account balance `0 KAIOS`. The payroll remained unclaimed at epoch `24320`; Hengyao had `PAYROLL_ADMIN_ROLE` but neither default-admin nor account-admin authority. Hengyao's personal BNB balance at that block was `0.00799020555 BNB`.

PR #153's decision snapshot is retained as historical `PRE_EXECUTION` evidence and points here through `superseded_by`. It is no longer the current live source of truth. Mainnet execution is historical and complete; this closeout sent no new transaction.

The A3 restrictions remain policy, not complete technical signer enforcement: `POLICY_SCOPE = DEFINED`, `SIGNER_ENFORCEMENT = PENDING`, `FURTHER_PAYROLL_SCHEDULE = FROZEN`, and `FURTHER_8888_TOPUP = FORBIDDEN_WITHOUT_NEW_AUTHORIZATION`. No salary claim is authorized before maturity, and maturity itself requires a new live-state and authorization review.

Execution transactions:

1. Route capital: `0x9059f3c6c2fdabf61a06c3b2eacbc985b9171d2731f74713000e8264fa37fccc`.
2. Create LIFE account: `0xd1d1f9d2520d41731b1da29120a35a2074920f0591b2a82cdd814dec986ca29d`.
3. Grant exact payroll role: `0xabd0f90b9a3b3a12d7cca7a6e9953bc6140995179c8076a70696cf9f186789f8`.
4. Hengyao schedule: `0xb12a7429dedce539223857f588793f4ea0a08246178cc33f4b472f1643723ded`.

Total gas for all proposal, approval, execution, and schedule transactions was `0.0000630842 BNB`; Hengyao's personal schedule used `0.00000979445 BNB`. No claim or business payment was sent.

## Fresh-fork result

Fork block `116466076` reproduced the current empty 8888 state. The three delayed proposals, approvals, and executions passed in strict route/account/role order. Hengyao then scheduled the exact payroll. Before maturity, claim reverted. At `2026-09-04T16:00:00Z`, permissionless claim credited the fixed 8888 LIFE account, shifting `88 KAIOS` from payroll liability to account liability without moving KAIOS out of 8888. Duplicate scheduling, duplicate claiming, early claiming, and non-role scheduling were blocked.

All simulated transactions were `value=0`. Maximum per-transaction and per-signer daily gas costs remained below `0.0003 BNB` and `0.001 BNB` respectively.

## Security boundary

The deployed `PAYROLL_ADMIN_ROLE` is a broad on-chain scheduling role; the contract itself does not encode the Human's 88 KAIOS employee cap, Task-ID evidence, ACCEPT review, canonical-wallet check, or self-bonus prohibition. V1 therefore limits exposure by the one-time 888 KAIOS pool, forbids further top-up without new Human authorization, and uses an exact-call operator that emits only the frozen Hengyao schedule. Any future employee payroll requires a separately reviewed exact payload.

Similarly, `createBusinessPayment(..., CLAIM_TO_WALLET, ...)` does not itself prove that a wallet is a registered merchant. No autonomous external spend is enabled by this package. The first spend additionally requires a verified encrypted offline backup A and a fail-closed merchant-registration read.

No Reward principal, KGEN reserve, 5M performance bond, Celestial Seat, Solidity, ABI, deployment address, or CURRENT Canon is modified.
