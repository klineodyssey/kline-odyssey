import process from "node:process";
import {
  Contract,
  JsonRpcProvider,
  Wallet,
  ZeroAddress,
  ZeroHash,
  formatEther,
  formatUnits,
} from "ethers";
import bank18888Abi from "../abi/LingxiaoCelestialBank18888_Upgradeable.json" with { type: "json" };
import bank8888Abi from "../abi/GaolaozhuangCommercialBank8888_Upgradeable.json" with { type: "json" };
import routerAbi from "../abi/EconomicRouter8888_Upgradeable.json" with { type: "json" };
import governanceAbi from "../abi/BankGovernance_Upgradeable.json" with { type: "json" };
import {
  ADDRESSES,
  POLICY,
  TASK_ID,
  assertHengyaoPayrollPlan,
  buildHengyaoPayrollPlan,
  jsonSafe,
} from "./hengyao-payroll-bloodflow-v1-plan.mjs";

const action = process.argv.find((item) => item.startsWith("--action="))?.split("=")[1] ?? "status";
const confirmation = process.argv.find((item) => item.startsWith("--confirm-mainnet="))?.slice("--confirm-mainnet=".length);
const allowedActions = new Set(["status", "propose", "approve", "execute", "schedule"]);
if (!allowedActions.has(action)) throw new Error(`UNSUPPORTED_ACTION:${action}`);

const signerForAction = {
  propose: { env: "MOTHER_PRIVATE_KEY", address: ADDRESSES.mother },
  approve: { env: "JADE_EMPEROR_PRIVATE_KEY", address: ADDRESSES.jadeEmperor },
  execute: { env: "MOTHER_PRIVATE_KEY", address: ADDRESSES.mother },
  schedule: { env: "CODEX_GM_0001_PRIVATE_KEY", address: ADDRESSES.hengyao },
};

const fail = (message) => { throw new Error(message); };
const expect = (condition, message) => { if (!condition) fail(message); };

async function selectRpc() {
  const candidates = [
    process.env.BSC_MAINNET_RPC_URL,
    "https://bsc-dataseed.binance.org/",
    "https://bsc-dataseed1.bnbchain.org/",
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
        signal: AbortSignal.timeout(8_000),
      });
      if ((await response.json()).result === "0x38") return candidate;
    } catch {
      // Do not reveal configured endpoints; continue to the next read/write-compatible RPC.
    }
  }
  fail("NO_CHAIN_56_RPC_AVAILABLE");
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

async function snapshot(provider, plan) {
  const bank18888 = new Contract(ADDRESSES.bank18888, bank18888Abi, provider);
  const bank8888 = new Contract(ADDRESSES.bank8888, bank8888Abi, provider);
  const router = new Contract(ADDRESSES.economicRouter8888, routerAbi, provider);
  const governance = new Contract(ADDRESSES.bankGovernance, governanceAbi, provider);
  const block = await provider.getBlock("latest");
  const health18888 = await bank18888.bankHealth();
  const account = await bank8888.account(plan.accountId);
  const payroll = await bank8888.payroll(plan.payrollId);
  const proposals = {};
  for (const call of Object.values(plan.calls)) {
    const item = await governance.proposal(call.proposalId);
    proposals[call.stage] = {
      proposalId: call.proposalId,
      target: item.target,
      dataHash: item.dataHash,
      executableAt: item.executableAt.toString(),
      proposer: item.proposer,
      approver: item.approver,
      executed: item.executed,
      cancelled: item.cancelled,
    };
  }
  return {
    block: { number: block.number, hash: block.hash, timestamp: block.timestamp, iso: new Date(block.timestamp * 1_000).toISOString() },
    bank18888: {
      available: formatUnits(health18888.available, 18),
      reserve: formatUnits(health18888.reserve, 18),
      paused: health18888.isPaused,
    },
    bank8888: {
      assets: formatUnits(await bank8888.assets(), 18),
      freeCapital: formatUnits(await bank8888.freeCapital(), 18),
      paused: await bank8888.paused(),
      accountCount: (await bank8888.accountCount()).toString(),
      payrollCount: (await bank8888.payrollCount()).toString(),
      currentCalendarEpoch: (await bank8888.currentCalendarEpoch()).toString(),
      hengyaoPayrollAdmin: await bank8888.hasRole(plan.payrollAdminRole, ADDRESSES.hengyao),
      hengyaoDefaultAdmin: await bank8888.hasRole(ZeroHash, ADDRESSES.hengyao),
      hengyaoAccountAdmin: await bank8888.hasRole(await bank8888.ACCOUNT_ADMIN_ROLE(), ADDRESSES.hengyao),
      account: {
        identityId: account.identityId,
        lifeId: account.lifeId,
        companyId: account.companyId,
        beneficiary: account.beneficiary,
        controller: account.controller,
        balance: formatUnits(account.balance, 18),
        accountType: account.accountType.toString(),
        status: account.status.toString(),
      },
      payroll: {
        lifeId: payroll.lifeId,
        beneficiary: payroll.beneficiary,
        amount: formatUnits(payroll.amount, 18),
        epoch: payroll.epoch.toString(),
        claimed: payroll.claimed,
      },
    },
    router: {
      routeExecuted: await router.routeExecuted(plan.routeId),
      totalRouted: formatUnits(await router.totalRouted(), 18),
    },
    proposals,
  };
}

async function validateSigner(provider) {
  if (action === "status") return null;
  const spec = signerForAction[action];
  const secret = process.env[spec.env];
  if (!secret) {
    process.stdout.write(`${JSON.stringify({ status: "HUMAN_SIGNING_REQUIRED", action, requiredSigner: spec.address, envName: spec.env, privateKeyExposed: false }, null, 2)}\n`);
    process.exit(2);
  }
  let signer;
  try {
    signer = new Wallet(secret, provider);
  } catch {
    fail(`INVALID_SIGNER_SECRET:${spec.env}`);
  }
  expect(signer.address === spec.address, `SIGNER_ADDRESS_MISMATCH:${action}:${signer.address}`);
  const latestNonce = await provider.getTransactionCount(signer.address, "latest");
  const pendingNonce = await provider.getTransactionCount(signer.address, "pending");
  expect(latestNonce === pendingNonce, `PENDING_NONCE_PRESENT:${signer.address}:${latestNonce}:${pendingNonce}`);
  return { signer, latestNonce, pendingNonce };
}

async function sendChecked(transactionPromise, gasPrice, cumulative) {
  const transaction = await transactionPromise;
  expect(transaction.value === 0n, "NONZERO_TRANSACTION_VALUE");
  const receipt = await transaction.wait();
  expect(receipt.status === 1, `TRANSACTION_REVERTED:${receipt.hash}`);
  const summary = receiptSummary(receipt);
  const cost = BigInt(summary.gasCostWei);
  expect(cost <= POLICY.gasCapPerTransactionWei, `GAS_CAP_PER_TRANSACTION_EXCEEDED:${receipt.hash}`);
  cumulative.value += cost;
  expect(cumulative.value <= POLICY.gasCapPerDayWei, "GAS_CAP_PER_DAY_EXCEEDED");
  return summary;
}

async function main() {
  const plan = buildHengyaoPayrollPlan();
  assertHengyaoPayrollPlan(plan);
  const rpc = await selectRpc();
  const provider = new JsonRpcProvider(rpc, 56, { staticNetwork: true });
  const network = await provider.getNetwork();
  expect(network.chainId === 56n, `CHAIN_ID_MISMATCH:${network.chainId}`);
  for (const address of Object.values({ bank18888: ADDRESSES.bank18888, bank8888: ADDRESSES.bank8888, router: ADDRESSES.economicRouter8888, governance: ADDRESSES.bankGovernance })) {
    expect(await provider.getCode(address) !== "0x", `NO_CODE:${address}`);
  }
  const before = await snapshot(provider, plan);
  if (action === "status") {
    process.stdout.write(`${JSON.stringify({ status: "READ_ONLY", action, mainnetTransactionSent: false, plan: jsonSafe(plan), state: before }, null, 2)}\n`);
    return;
  }

  expect(confirmation === `${TASK_ID}:${action.toUpperCase()}`, "EXPLICIT_ACTION_CONFIRMATION_REQUIRED");
  const signerState = await validateSigner(provider);
  const gasPrice = (await provider.getFeeData()).gasPrice ?? 50_000_000n;
  const balance = await provider.getBalance(signerState.signer.address);
  expect(balance >= POLICY.gasCapPerDayWei, `SIGNER_FUNDING_BELOW_DAILY_CAP:${signerState.signer.address}`);
  const governance = new Contract(ADDRESSES.bankGovernance, governanceAbi, signerState.signer);
  const bank8888 = new Contract(ADDRESSES.bank8888, bank8888Abi, signerState.signer);
  const receipts = [];
  const cumulative = { value: 0n };

  if (action === "propose") {
    expect(before.bank18888.available === "11213908.930416874731235", "STALE_AVAILABLE_18888");
    expect(before.bank18888.reserve === "11000000.0", "STALE_RESERVE_18888");
    expect(before.bank8888.assets === "0.0" && before.bank8888.accountCount === "0" && before.bank8888.payrollCount === "0", "STALE_8888_INITIAL_STATE");
    for (const call of Object.values(plan.calls)) {
      const current = before.proposals[call.stage];
      if (current.target !== ZeroAddress) {
        expect(current.target === call.target && current.dataHash === call.dataHash && current.proposer === ADDRESSES.mother && !current.cancelled, `PROPOSAL_STATE_MISMATCH:${call.stage}`);
        continue;
      }
      const estimate = await governance.propose.estimateGas(call.proposalId, call.target, 0n, call.data);
      expect(estimate * gasPrice <= POLICY.gasCapPerTransactionWei, `ESTIMATED_GAS_CAP_EXCEEDED:${call.stage}`);
      receipts.push({ stage: call.stage, ...(await sendChecked(governance.propose(call.proposalId, call.target, 0n, call.data, { gasPrice }), gasPrice, cumulative)) });
    }
  } else if (action === "approve") {
    for (const call of Object.values(plan.calls)) {
      const current = before.proposals[call.stage];
      expect(current.target === call.target && current.dataHash === call.dataHash && current.proposer === ADDRESSES.mother && !current.cancelled, `PROPOSAL_STATE_MISMATCH:${call.stage}`);
      if (current.approver !== ZeroAddress) {
        expect(current.approver === ADDRESSES.jadeEmperor, `APPROVER_MISMATCH:${call.stage}`);
        continue;
      }
      const estimate = await governance.approve.estimateGas(call.proposalId);
      expect(estimate * gasPrice <= POLICY.gasCapPerTransactionWei, `ESTIMATED_GAS_CAP_EXCEEDED:${call.stage}`);
      receipts.push({ stage: call.stage, ...(await sendChecked(governance.approve(call.proposalId, { gasPrice }), gasPrice, cumulative)) });
    }
  } else if (action === "execute") {
    const now = BigInt(before.block.timestamp);
    for (const call of Object.values(plan.calls)) {
      const current = before.proposals[call.stage];
      expect(current.target === call.target && current.dataHash === call.dataHash && current.proposer === ADDRESSES.mother && current.approver === ADDRESSES.jadeEmperor && !current.cancelled, `PROPOSAL_STATE_MISMATCH:${call.stage}`);
      if (current.executed) continue;
      expect(now >= BigInt(current.executableAt), `GOVERNANCE_DELAY_NOT_MET:${call.stage}:${current.executableAt}`);
      const estimate = await governance.execute.estimateGas(call.proposalId, call.data);
      expect(estimate * gasPrice <= POLICY.gasCapPerTransactionWei, `ESTIMATED_GAS_CAP_EXCEEDED:${call.stage}`);
      receipts.push({ stage: call.stage, ...(await sendChecked(governance.execute(call.proposalId, call.data, { gasPrice }), gasPrice, cumulative)) });
    }
  } else if (action === "schedule") {
    expect(before.bank8888.assets === "888.0" && before.bank8888.freeCapital === "888.0", "PAYROLL_POOL_NOT_EXACTLY_FUNDED");
    expect(before.bank8888.hengyaoPayrollAdmin && !before.bank8888.hengyaoDefaultAdmin && !before.bank8888.hengyaoAccountAdmin, "HENGYAO_ROLE_SCOPE_MISMATCH");
    expect(before.bank8888.account.beneficiary === ADDRESSES.hengyao && before.bank8888.account.controller === ADDRESSES.hengyao && before.bank8888.account.accountType === "1", "HENGYAO_ACCOUNT_MISMATCH");
    if (before.bank8888.payroll.beneficiary !== ZeroAddress) {
      expect(before.bank8888.payroll.lifeId === plan.lifeId && before.bank8888.payroll.beneficiary === ADDRESSES.hengyao && before.bank8888.payroll.amount === "88.0" && before.bank8888.payroll.epoch === "24320", "PAYROLL_STATE_MISMATCH");
    } else {
      const estimate = await bank8888.schedulePayroll.estimateGas(plan.payrollId, plan.lifeId, ADDRESSES.hengyao, POLICY.salaryAmount, POLICY.contractEpoch);
      expect(estimate * gasPrice <= POLICY.gasCapPerTransactionWei, "ESTIMATED_GAS_CAP_EXCEEDED:SCHEDULE");
      receipts.push({ stage: "SCHEDULE_HENGYAO_2026_09", ...(await sendChecked(bank8888.schedulePayroll(plan.payrollId, plan.lifeId, ADDRESSES.hengyao, POLICY.salaryAmount, POLICY.contractEpoch, { gasPrice }), gasPrice, cumulative)) });
    }
  }

  const after = await snapshot(provider, plan);
  process.stdout.write(`${JSON.stringify({
    status: "PASS",
    action,
    mainnetTransactionSent: receipts.length !== 0,
    signer: signerState.signer.address,
    signerNonceBefore: signerState.latestNonce,
    signerNonceAfter: await provider.getTransactionCount(signerState.signer.address, "latest"),
    gasPriceWei: gasPrice.toString(),
    gasCostWei: cumulative.value.toString(),
    gasCostBnb: formatEther(cumulative.value),
    receipts,
    state: after,
    privateKeyExposed: false,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
