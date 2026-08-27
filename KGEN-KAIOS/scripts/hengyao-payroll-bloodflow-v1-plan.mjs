import {
  AbiCoder,
  Interface,
  ZeroAddress,
  ZeroHash,
  getAddress,
  id,
  keccak256,
  parseUnits,
} from "ethers";

export const TASK_ID = "KAIOS-HENGYAO-GM-PAYROLL-BLOODFLOW-V1-001";
export const PURPOSE = "KAIOS_AI_COMPANY_PAYROLL_GENESIS_POOL_V1";
export const ROUTE_DOMAIN = id("KAIOS.BANK.MODULE.ECONOMIC_ROUTER_8888");
export const GOVERNANCE_PROPOSAL_DOMAIN = id("KAIOS.BANK.GOVERNANCE.PROPOSAL.V1");

export const ADDRESSES = Object.freeze({
  kaios: getAddress("0xD4E67B3a69e41524c424150E6b6e921b01D036db"),
  bank18888: getAddress("0x11d34c0F723aCd334B8F95076f73F07f06202aab"),
  bank8888: getAddress("0x9EcAe137b3A307971EB77B4CDB3ba13aeeF5297C"),
  economicRouter8888: getAddress("0xC49f989c6ff0d22824df8D993Ce82207165C1428"),
  bankGovernance: getAddress("0xa2792fBDCc8A8AaC364053431D44E0a8D335E166"),
  mother: getAddress("0xCd60BF474e691F2484950a0276Eaf507616Ca4b9"),
  jadeEmperor: getAddress("0xc15E08834fCA9F2d3462a3f8f0BC30524D6dd756"),
  guanyin: getAddress("0xEBEeAC6d09D2d28Db8010b0923442C9Eb2b702FE"),
  hengyao: getAddress("0x4DF6E9629Dad1072103cFd2bC81845fd97429214"),
});

export const POLICY = Object.freeze({
  routeAmount: parseUnits("888", 18),
  salaryAmount: parseUnits("88", 18),
  contractEpoch: 24_320n,
  expectedAvailable18888Before: parseUnits("11213908.930416874731235", 18),
  expectedAvailable18888After: parseUnits("11213020.930416874731235", 18),
  expectedReserve18888: parseUnits("11000000", 18),
  gasCapPerTransactionWei: parseUnits("0.0003", 18),
  gasCapPerDayWei: parseUnits("0.001", 18),
  transactionValue: 0n,
});

const abiCoder = AbiCoder.defaultAbiCoder();
const routerInterface = new Interface([
  "function routeCapital(bytes32 routeId,uint256 amount,bytes32 purposeHash)",
]);
const bank8888Interface = new Interface([
  "function createAccount(bytes32 accountId,bytes32 identityId,bytes32 lifeId,bytes32 companyId,address beneficiary,address controller,uint8 accountType)",
  "function grantRole(bytes32 role,address account)",
  "function schedulePayroll(bytes32 payrollId,bytes32 lifeId,address beneficiary,uint256 amount,uint64 epoch)",
]);
const governanceInterface = new Interface([
  "function propose(bytes32 proposalId,address target,uint256 value,bytes data)",
  "function approve(bytes32 proposalId)",
  "function execute(bytes32 proposalId,bytes data)",
]);

function proposalId(stage, target, data) {
  return keccak256(abiCoder.encode(
    ["bytes32", "bytes32", "bytes32", "address", "bytes32"],
    [GOVERNANCE_PROPOSAL_DOMAIN, id(TASK_ID), id(stage), target, keccak256(data)],
  ));
}

export function buildHengyaoPayrollPlan() {
  const purposeHash = id(PURPOSE);
  const routeId = keccak256(abiCoder.encode(["bytes32", "bytes32"], [ROUTE_DOMAIN, purposeHash]));
  const accountId = id("KAIOS:8888:ACCOUNT:LIFE-CODEX-GM-0001");
  const identityId = id("KAIOS:IDENTITY:LIFE-CODEX-GM-0001");
  const lifeId = id("LIFE-CODEX-GM-0001");
  const payrollId = id("KAIOS:8888:PAYROLL:LIFE-CODEX-GM-0001:2026-09:MONTHLY_ROLE_SALARY");
  const payrollAdminRole = id("PAYROLL_ADMIN_ROLE");
  const modulePaymentId = keccak256(abiCoder.encode(["bytes32", "bytes32"], [ROUTE_DOMAIN, routeId]));

  const calls = {
    routeCapital: {
      stage: "ROUTE_CAPITAL",
      target: ADDRESSES.economicRouter8888,
      value: 0n,
      data: routerInterface.encodeFunctionData("routeCapital", [routeId, POLICY.routeAmount, purposeHash]),
    },
    createHengyaoAccount: {
      stage: "CREATE_HENGYAO_LIFE_ACCOUNT",
      target: ADDRESSES.bank8888,
      value: 0n,
      data: bank8888Interface.encodeFunctionData("createAccount", [
        accountId,
        identityId,
        lifeId,
        ZeroHash,
        ADDRESSES.hengyao,
        ADDRESSES.hengyao,
        1,
      ]),
    },
    grantHengyaoPayrollRole: {
      stage: "GRANT_HENGYAO_PAYROLL_ADMIN_8888",
      target: ADDRESSES.bank8888,
      value: 0n,
      data: bank8888Interface.encodeFunctionData("grantRole", [payrollAdminRole, ADDRESSES.hengyao]),
    },
  };

  for (const call of Object.values(calls)) {
    call.dataHash = keccak256(call.data);
    call.proposalId = proposalId(call.stage, call.target, call.data);
    call.proposeCalldata = governanceInterface.encodeFunctionData("propose", [
      call.proposalId,
      call.target,
      call.value,
      call.data,
    ]);
    call.approveCalldata = governanceInterface.encodeFunctionData("approve", [call.proposalId]);
    call.executeCalldata = governanceInterface.encodeFunctionData("execute", [call.proposalId, call.data]);
  }

  const schedulePayroll = {
    target: ADDRESSES.bank8888,
    value: 0n,
    data: bank8888Interface.encodeFunctionData("schedulePayroll", [
      payrollId,
      lifeId,
      ADDRESSES.hengyao,
      POLICY.salaryAmount,
      POLICY.contractEpoch,
    ]),
  };
  schedulePayroll.dataHash = keccak256(schedulePayroll.data);

  return {
    taskId: TASK_ID,
    chainId: 56,
    purpose: PURPOSE,
    purposeHash,
    routeDomain: ROUTE_DOMAIN,
    routeId,
    modulePaymentId,
    accountId,
    identityId,
    lifeId,
    companyId: ZeroHash,
    accountType: "LIFE",
    accountTypeValue: 1,
    payrollId,
    payrollAdminRole,
    calls,
    schedulePayroll,
    addresses: ADDRESSES,
    policy: POLICY,
  };
}

export function assertHengyaoPayrollPlan(plan) {
  if (plan.chainId !== 56) throw new Error("CHAIN_ID_NOT_56");
  if (plan.addresses.hengyao === ZeroAddress) throw new Error("ZERO_HENGYAO_ADDRESS");
  if (plan.policy.transactionValue !== 0n) throw new Error("NONZERO_TRANSACTION_VALUE");
  if (plan.policy.routeAmount !== parseUnits("888", 18)) throw new Error("ROUTE_AMOUNT_DRIFT");
  if (plan.policy.salaryAmount !== parseUnits("88", 18)) throw new Error("SALARY_AMOUNT_DRIFT");
  if (plan.policy.contractEpoch !== 24_320n) throw new Error("PAYROLL_EPOCH_DRIFT");
  if (plan.purposeHash !== id(PURPOSE)) throw new Error("PURPOSE_HASH_DRIFT");
  const expectedRouteId = keccak256(abiCoder.encode(["bytes32", "bytes32"], [ROUTE_DOMAIN, plan.purposeHash]));
  if (plan.routeId !== expectedRouteId) throw new Error("ROUTE_ID_DRIFT");
  if (plan.calls.grantHengyaoPayrollRole.target !== ADDRESSES.bank8888) throw new Error("ROLE_TARGET_DRIFT");
  return true;
}

export function jsonSafe(value) {
  return JSON.parse(JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item));
}
