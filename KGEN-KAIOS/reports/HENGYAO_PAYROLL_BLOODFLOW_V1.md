# Hengyao Payroll Bloodflow V1

**Task:** `KAIOS-HENGYAO-GM-PAYROLL-BLOODFLOW-V1-001`  
**Execution base:** `672ab4884e8cf6f9d07c176a862fb858cafe8161`  
**Status:** fresh-fork PASS; three Mainnet proposals are approved and the full 3,600-second timelock is running. No execution occurred before the latest ETA.

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

Mainnet proposal/approval receipts are recorded in the machine-readable package. The latest proposal ETA is `2026-08-17T13:48:01Z`; the pre-execution state remains 18888 available `11,213,908.930416874731235 KAIOS`, 8888 assets `0`, account count `0`, payroll count `0`, and Hengyao Payroll role absent.

## Fresh-fork result

Fork block `116466076` reproduced the current empty 8888 state. The three delayed proposals, approvals, and executions passed in strict route/account/role order. Hengyao then scheduled the exact payroll. Before maturity, claim reverted. At `2026-09-04T16:00:00Z`, permissionless claim credited the fixed 8888 LIFE account, shifting `88 KAIOS` from payroll liability to account liability without moving KAIOS out of 8888. Duplicate scheduling, duplicate claiming, early claiming, and non-role scheduling were blocked.

All simulated transactions were `value=0`. Maximum per-transaction and per-signer daily gas costs remained below `0.0003 BNB` and `0.001 BNB` respectively.

## Security boundary

The deployed `PAYROLL_ADMIN_ROLE` is a broad on-chain scheduling role; the contract itself does not encode the Human's 88 KAIOS employee cap, Task-ID evidence, ACCEPT review, canonical-wallet check, or self-bonus prohibition. V1 therefore limits exposure by the one-time 888 KAIOS pool, forbids further top-up without new Human authorization, and uses an exact-call operator that emits only the frozen Hengyao schedule. Any future employee payroll requires a separately reviewed exact payload.

Similarly, `createBusinessPayment(..., CLAIM_TO_WALLET, ...)` does not itself prove that a wallet is a registered merchant. No autonomous external spend is enabled by this package. The first spend additionally requires a verified encrypted offline backup A and a fail-closed merchant-registration read.

No Reward principal, KGEN reserve, 5M performance bond, Celestial Seat, Solidity, ABI, deployment address, or CURRENT Canon is modified.
