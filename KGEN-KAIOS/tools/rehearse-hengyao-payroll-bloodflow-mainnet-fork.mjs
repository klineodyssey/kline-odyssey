import ganache from "ganache";
import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  ZeroHash,
  formatEther,
  formatUnits,
  parseEther,
} from "ethers";
import bank18888Abi from "../abi/LingxiaoCelestialBank18888_Upgradeable.json" with { type: "json" };
import bank8888Abi from "../abi/GaolaozhuangCommercialBank8888_Upgradeable.json" with { type: "json" };
import routerAbi from "../abi/EconomicRouter8888_Upgradeable.json" with { type: "json" };
import governanceAbi from "../abi/BankGovernance_Upgradeable.json" with { type: "json" };
import {
  ADDRESSES,
  POLICY,
  assertHengyaoPayrollPlan,
  buildHengyaoPayrollPlan,
  jsonSafe,
} from "../scripts/hengyao-payroll-bloodflow-v1-plan.mjs";

const publicRpcs = [
  process.env.BSC_MAINNET_RPC_URL,
  "https://bsc-dataseed.binance.org/",
  "https://bsc-dataseed1.bnbchain.org/",
].filter(Boolean);

const fail = (message) => { throw new Error(message); };
const expect = (condition, message) => { if (!condition) fail(message); };

async function selectRpc() {
  for (const candidate of publicRpcs) {
    try {
      const response = await fetch(candidate, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
        signal: AbortSignal.timeout(8_000),
      });
      const result = await response.json();
      if (result.result === "0x38") return candidate;
    } catch {
      // Continue without exposing a configured RPC URL or credential-bearing endpoint.
    }
  }
  fail("NO_CHAIN_56_RPC_AVAILABLE");
}

async function expectRevert(action, label) {
  try {
    await action();
    fail(`${label}:EXPECTED_REVERT`);
  } catch (error) {
    if (String(error.message).includes("EXPECTED_REVERT")) throw error;
    return "PASS";
  }
}

const receiptSummary = (receipt) => ({
  transactionHash: receipt.hash,
  blockNumber: receipt.blockNumber,
  status: receipt.status === 1 ? "PASS" : "FAIL",
  gasUsed: receipt.gasUsed.toString(),
  gasPriceWei: receipt.gasPrice.toString(),
  gasCostWei: (receipt.gasUsed * receipt.gasPrice).toString(),
  gasCostBnb: formatEther(receipt.gasUsed * receipt.gasPrice),
});

async function main() {
  const plan = buildHengyaoPayrollPlan();
  assertHengyaoPayrollPlan(plan);
  const rpc = await selectRpc();
  const live = new JsonRpcProvider(rpc, 56, { staticNetwork: true });
  const liveBlock = await live.getBlock("latest");
  const liveGasPrice = (await live.getFeeData()).gasPrice ?? 50_000_000n;
  const live18888 = new Contract(ADDRESSES.bank18888, bank18888Abi, live);
  const live8888 = new Contract(ADDRESSES.bank8888, bank8888Abi, live);
  const liveHealth = await live18888.bankHealth();
  expect(liveHealth.available === POLICY.expectedAvailable18888Before, "LIVE_AVAILABLE_18888_DRIFT");
  expect(liveHealth.reserve === POLICY.expectedReserve18888, "LIVE_RESERVE_18888_DRIFT");
  expect(await live8888.assets() === 0n, "LIVE_8888_ASSETS_NOT_ZERO");
  expect(await live8888.freeCapital() === 0n, "LIVE_8888_FREE_CAPITAL_NOT_ZERO");
  expect(await live8888.accountCount() === 0n, "LIVE_8888_ACCOUNT_COUNT_NOT_ZERO");
  expect(await live8888.payrollCount() === 0n, "LIVE_8888_PAYROLL_COUNT_NOT_ZERO");
  expect(await live8888.currentCalendarEpoch() === 24_319n, "LIVE_8888_EPOCH_DRIFT");

  const unlockedAccounts = [ADDRESSES.mother, ADDRESSES.jadeEmperor, ADDRESSES.hengyao];
  const eip1193 = ganache.provider({
    fork: { url: rpc, blockNumber: liveBlock.number },
    chain: { chainId: 56, networkId: 56, hardfork: "shanghai" },
    wallet: { deterministic: true, totalAccounts: 4, defaultBalance: 1_000, unlockedAccounts },
    logging: { quiet: true },
  });

  try {
    for (const address of unlockedAccounts) {
      await eip1193.request({ method: "evm_setAccountBalance", params: [address, `0x${parseEther("100").toString(16)}`] });
    }
    const provider = new BrowserProvider(eip1193);
    const mother = await provider.getSigner(ADDRESSES.mother);
    const jade = await provider.getSigner(ADDRESSES.jadeEmperor);
    const hengyao = await provider.getSigner(ADDRESSES.hengyao);
    const governance = new Contract(ADDRESSES.bankGovernance, governanceAbi, provider);
    const bank18888 = new Contract(ADDRESSES.bank18888, bank18888Abi, provider);
    const bank8888 = new Contract(ADDRESSES.bank8888, bank8888Abi, provider);
    const router = new Contract(ADDRESSES.economicRouter8888, routerAbi, provider);
    const receipts = { proposals: [], approvals: [], executions: [], schedule: null, claim: null };

    for (const call of Object.values(plan.calls)) {
      const receipt = await (await governance.connect(mother).propose(
        call.proposalId,
        call.target,
        0n,
        call.data,
        { gasPrice: liveGasPrice },
      )).wait();
      receipts.proposals.push({ stage: call.stage, ...receiptSummary(receipt) });
    }
    for (const call of Object.values(plan.calls)) {
      const receipt = await (await governance.connect(jade).approve(call.proposalId, { gasPrice: liveGasPrice })).wait();
      receipts.approvals.push({ stage: call.stage, ...receiptSummary(receipt) });
    }

    const proposals = await Promise.all(Object.values(plan.calls).map((call) => governance.proposal(call.proposalId)));
    const latestEta = proposals.reduce((maximum, item) => item.executableAt > maximum ? item.executableAt : maximum, 0n);
    const beforeDelay = await provider.getBlock("latest");
    await expectRevert(
      () => governance.connect(mother).execute.staticCall(plan.calls.routeCapital.proposalId, plan.calls.routeCapital.data),
      "EXECUTE_BEFORE_DELAY",
    );
    await eip1193.request({ method: "evm_increaseTime", params: [Number(latestEta - BigInt(beforeDelay.timestamp))] });
    await eip1193.request({ method: "evm_mine", params: [] });

    for (const call of Object.values(plan.calls)) {
      const receipt = await (await governance.connect(mother).execute(
        call.proposalId,
        call.data,
        { gasPrice: liveGasPrice },
      )).wait();
      receipts.executions.push({ stage: call.stage, ...receiptSummary(receipt) });
    }

    const availableAfter = await bank18888.availableKaios();
    const assetsAfter = await bank8888.assets();
    const freeAfter = await bank8888.freeCapital();
    const accountAfter = await bank8888.account(plan.accountId);
    expect(availableAfter === POLICY.expectedAvailable18888After, "FORK_18888_AVAILABLE_AFTER_MISMATCH");
    expect(assetsAfter === POLICY.routeAmount, "FORK_8888_ASSETS_AFTER_MISMATCH");
    expect(freeAfter === POLICY.routeAmount, "FORK_8888_FREE_AFTER_MISMATCH");
    expect(accountAfter.beneficiary === ADDRESSES.hengyao, "FORK_ACCOUNT_BENEFICIARY_MISMATCH");
    expect(accountAfter.controller === ADDRESSES.hengyao, "FORK_ACCOUNT_CONTROLLER_MISMATCH");
    expect(accountAfter.accountType === 1n, "FORK_ACCOUNT_TYPE_NOT_LIFE");
    expect(await bank8888.hasRole(plan.payrollAdminRole, ADDRESSES.hengyao), "FORK_HENGYAO_PAYROLL_ROLE_MISSING");
    expect(!await bank8888.hasRole(ZeroHash, ADDRESSES.hengyao), "FORK_HENGYAO_DEFAULT_ADMIN_PRESENT");
    expect(!await bank8888.hasRole(await bank8888.ACCOUNT_ADMIN_ROLE(), ADDRESSES.hengyao), "FORK_HENGYAO_ACCOUNT_ADMIN_PRESENT");

    const scheduleReceipt = await (await bank8888.connect(hengyao).schedulePayroll(
      plan.payrollId,
      plan.lifeId,
      ADDRESSES.hengyao,
      POLICY.salaryAmount,
      POLICY.contractEpoch,
      { gasPrice: liveGasPrice },
    )).wait();
    receipts.schedule = receiptSummary(scheduleReceipt);
    expect(await bank8888.payrollCount() === 1n, "FORK_PAYROLL_COUNT_NOT_ONE");
    expect(await bank8888.totalPayrollLiability() === POLICY.salaryAmount, "FORK_PAYROLL_LIABILITY_MISMATCH");
    expect(await bank8888.freeCapital() === POLICY.routeAmount - POLICY.salaryAmount, "FORK_FREE_CAPITAL_AFTER_SCHEDULE_MISMATCH");
    await expectRevert(
      () => bank8888.connect(hengyao).schedulePayroll.staticCall(plan.payrollId, plan.lifeId, ADDRESSES.hengyao, POLICY.salaryAmount, POLICY.contractEpoch),
      "DUPLICATE_PAYROLL",
    );
    await expectRevert(
      () => bank8888.connect(mother).schedulePayroll.staticCall(plan.payrollId, plan.lifeId, ADDRESSES.hengyao, POLICY.salaryAmount, POLICY.contractEpoch),
      "NON_ROLE_PAYROLL",
    );
    await expectRevert(
      () => bank8888.connect(mother).claimSalary.staticCall(plan.payrollId, 2, plan.accountId),
      "CLAIM_BEFORE_MATURITY",
    );

    const claimableAt = await bank8888.epochClaimableAt(POLICY.contractEpoch);
    const beforeClaim = await provider.getBlock("latest");
    await eip1193.request({ method: "evm_increaseTime", params: [Number(claimableAt - BigInt(beforeClaim.timestamp))] });
    await eip1193.request({ method: "evm_mine", params: [] });
    const claimReceipt = await (await bank8888.connect(mother).claimSalary(
      plan.payrollId,
      2,
      plan.accountId,
      { gasPrice: liveGasPrice },
    )).wait();
    receipts.claim = receiptSummary(claimReceipt);
    const creditedAccount = await bank8888.account(plan.accountId);
    expect(creditedAccount.balance === POLICY.salaryAmount, "FORK_ACCOUNT_SALARY_CREDIT_MISMATCH");
    expect(await bank8888.totalPayrollLiability() === 0n, "FORK_PAYROLL_LIABILITY_NOT_CLEARED");
    expect(await bank8888.totalAccountLiability() === POLICY.salaryAmount, "FORK_ACCOUNT_LIABILITY_MISMATCH");
    expect(await bank8888.assets() === POLICY.routeAmount, "FORK_ASSETS_CHANGED_BY_INTERNAL_CREDIT");
    await expectRevert(
      () => bank8888.connect(mother).claimSalary.staticCall(plan.payrollId, 2, plan.accountId),
      "DUPLICATE_CLAIM",
    );

    const allReceipts = [
      ...receipts.proposals,
      ...receipts.approvals,
      ...receipts.executions,
      receipts.schedule,
      receipts.claim,
    ];
    for (const receipt of allReceipts) {
      expect(BigInt(receipt.gasCostWei) <= POLICY.gasCapPerTransactionWei, `FORK_TX_GAS_CAP_EXCEEDED:${receipt.transactionHash}`);
    }
    const gasBySigner = {
      mother: [...receipts.proposals, ...receipts.executions, receipts.claim].reduce((sum, item) => sum + BigInt(item.gasCostWei), 0n),
      jade: receipts.approvals.reduce((sum, item) => sum + BigInt(item.gasCostWei), 0n),
      hengyao: BigInt(receipts.schedule.gasCostWei),
    };
    for (const [signer, cost] of Object.entries(gasBySigner)) {
      expect(cost <= POLICY.gasCapPerDayWei, `FORK_DAILY_GAS_CAP_EXCEEDED:${signer}`);
    }

    const forkBlock = await provider.getBlock("latest");
    const output = {
      status: "PASS",
      mainnetTransactionSent: false,
      chainId: 56,
      liveBlock: { number: liveBlock.number, hash: liveBlock.hash, timestamp: liveBlock.timestamp },
      forkFinalBlock: { number: forkBlock.number, hash: forkBlock.hash, timestamp: forkBlock.timestamp },
      liveGasPriceWei: liveGasPrice.toString(),
      plan: jsonSafe(plan),
      before: {
        available18888: formatUnits(liveHealth.available, 18),
        reserve18888: formatUnits(liveHealth.reserve, 18),
        assets8888: "0.0",
        freeCapital8888: "0.0",
        accountCount: "0",
        payrollCount: "0",
        calendarEpoch: "24319",
      },
      afterRouteAndSchedule: {
        available18888: formatUnits(availableAfter, 18),
        assets8888: formatUnits(assetsAfter, 18),
        freeCapital8888: formatUnits(POLICY.routeAmount - POLICY.salaryAmount, 18),
        payrollLiability8888: formatUnits(POLICY.salaryAmount, 18),
        accountCount: (await bank8888.accountCount()).toString(),
        payrollCount: (await bank8888.payrollCount()).toString(),
        hengyaoPayrollAdmin: true,
        hengyaoDefaultAdmin: false,
        hengyaoAccountAdmin: false,
      },
      afterMatureClaim: {
        assets8888: formatUnits(await bank8888.assets(), 18),
        accountBalance: formatUnits(creditedAccount.balance, 18),
        accountLiability: formatUnits(await bank8888.totalAccountLiability(), 18),
        payrollLiability: formatUnits(await bank8888.totalPayrollLiability(), 18),
        claimableAt: claimableAt.toString(),
        claimableAtIso: new Date(Number(claimableAt) * 1_000).toISOString(),
      },
      negativeTests: {
        executeBeforeDelay: "PASS",
        duplicatePayroll: "PASS",
        nonRolePayroll: "PASS",
        claimBeforeMaturity: "PASS",
        duplicateClaim: "PASS",
      },
      gasBySigner: Object.fromEntries(Object.entries(gasBySigner).map(([key, value]) => [key, { wei: value.toString(), bnb: formatEther(value) }])),
      receipts,
      gates: {
        livePrecheck: "PASS",
        exactRoute: "PASS",
        reservePreserved: "PASS",
        accountCreated: "PASS",
        exactRoleOnly: "PASS",
        payrollScheduledByHengyao: "PASS",
        salaryCreditedToLifeAccount: "PASS",
        perTransactionGasCap: "PASS",
        perDayGasCap: "PASS",
      },
    };
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  } finally {
    await eip1193.disconnect();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
