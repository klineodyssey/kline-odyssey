import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { Interface, ZeroHash, id, parseUnits } from "ethers";
import {
  ADDRESSES,
  POLICY,
  PURPOSE,
  ROUTE_DOMAIN,
  assertHengyaoPayrollPlan,
  buildHengyaoPayrollPlan,
} from "../scripts/hengyao-payroll-bloodflow-v1-plan.mjs";

const plan = buildHengyaoPayrollPlan();

test("payroll bloodflow plan derives exact Human-frozen identifiers and amounts", () => {
  assert.equal(assertHengyaoPayrollPlan(plan), true);
  assert.equal(plan.purpose, PURPOSE);
  assert.equal(plan.purposeHash, id(PURPOSE));
  assert.equal(plan.routeDomain, ROUTE_DOMAIN);
  assert.equal(plan.accountId, id("KAIOS:8888:ACCOUNT:LIFE-CODEX-GM-0001"));
  assert.equal(plan.identityId, id("KAIOS:IDENTITY:LIFE-CODEX-GM-0001"));
  assert.equal(plan.lifeId, id("LIFE-CODEX-GM-0001"));
  assert.equal(plan.payrollId, id("KAIOS:8888:PAYROLL:LIFE-CODEX-GM-0001:2026-09:MONTHLY_ROLE_SALARY"));
  assert.equal(plan.companyId, ZeroHash);
  assert.equal(plan.payrollAdminRole, id("PAYROLL_ADMIN_ROLE"));
  assert.equal(POLICY.routeAmount, parseUnits("888", 18));
  assert.equal(POLICY.salaryAmount, parseUnits("88", 18));
  assert.equal(POLICY.contractEpoch, 24_320n);
});

test("governance package contains only Router route, LIFE account creation and exact payroll role grant", () => {
  assert.deepEqual(Object.keys(plan.calls), ["routeCapital", "createHengyaoAccount", "grantHengyaoPayrollRole"]);
  assert.equal(plan.calls.routeCapital.target, ADDRESSES.economicRouter8888);
  assert.equal(plan.calls.createHengyaoAccount.target, ADDRESSES.bank8888);
  assert.equal(plan.calls.grantHengyaoPayrollRole.target, ADDRESSES.bank8888);
  const bank = new Interface([
    "function createAccount(bytes32,bytes32,bytes32,bytes32,address,address,uint8)",
    "function grantRole(bytes32,address)",
  ]);
  const account = bank.decodeFunctionData("createAccount", plan.calls.createHengyaoAccount.data);
  assert.equal(account[3], ZeroHash);
  assert.equal(account[4], ADDRESSES.hengyao);
  assert.equal(account[5], ADDRESSES.hengyao);
  assert.equal(account[6], 1n);
  const role = bank.decodeFunctionData("grantRole", plan.calls.grantHengyaoPayrollRole.data);
  assert.equal(role[0], id("PAYROLL_ADMIN_ROLE"));
  assert.equal(role[1], ADDRESSES.hengyao);
  for (const item of Object.values(plan.calls)) assert.equal(item.value, 0n);
});

test("Hengyao schedule is direct, exact, value-zero and cannot substitute YYYYMM for epoch", () => {
  const bank = new Interface([
    "function schedulePayroll(bytes32,bytes32,address,uint256,uint64)",
  ]);
  const decoded = bank.decodeFunctionData("schedulePayroll", plan.schedulePayroll.data);
  assert.equal(plan.schedulePayroll.target, ADDRESSES.bank8888);
  assert.equal(plan.schedulePayroll.value, 0n);
  assert.equal(decoded[0], plan.payrollId);
  assert.equal(decoded[1], plan.lifeId);
  assert.equal(decoded[2], ADDRESSES.hengyao);
  assert.equal(decoded[3], parseUnits("88", 18));
  assert.equal(decoded[4], 24_320n);
  assert.notEqual(decoded[4], 202_609n);
});

test("frozen caps preserve 18888 reserve arithmetic and transaction value boundaries", () => {
  assert.equal(POLICY.expectedAvailable18888Before - POLICY.routeAmount, POLICY.expectedAvailable18888After);
  assert.equal(POLICY.expectedReserve18888, parseUnits("11000000", 18));
  assert.equal(POLICY.gasCapPerTransactionWei, parseUnits("0.0003", 18));
  assert.equal(POLICY.gasCapPerDayWei, parseUnits("0.001", 18));
  assert.equal(POLICY.transactionValue, 0n);
});

test("committed package matches the reproducible plan and records exact execution evidence", async () => {
  const report = JSON.parse(await fs.readFile(new URL("../reports/HENGYAO_PAYROLL_BLOODFLOW_V1_UNSIGNED_PACKAGE.json", import.meta.url), "utf8"));
  assert.equal(report.taskId, plan.taskId);
  assert.equal(report.executionBase, "672ab4884e8cf6f9d07c176a862fb858cafe8161");
  assert.equal(report.identifiers.purposeHash, plan.purposeHash);
  assert.equal(report.identifiers.routeId, plan.routeId);
  assert.equal(report.identifiers.accountId, plan.accountId);
  assert.equal(report.identifiers.payrollId, plan.payrollId);
  assert.deepEqual(report.operations.map((item) => item.proposalId), Object.values(plan.calls).map((item) => item.proposalId));
  assert.deepEqual(report.operations.map((item) => item.data), Object.values(plan.calls).map((item) => item.data));
  assert.equal(report.hengyaoSchedule.data, plan.schedulePayroll.data);
  assert.equal(report.forkRehearsal.status, "PASS");
  assert.equal(report.mainnetTransactionSent, true);
  assert.equal(report.mainnetGovernance.status, "EXECUTED_AND_HENGYAO_PAYROLL_SCHEDULED");
  assert.equal(report.mainnetGovernance.executionTransactions.length, 3);
  assert.equal(report.mainnetGovernance.hengyaoScheduleTransaction.transactionHash, "0xb12a7429dedce539223857f588793f4ea0a08246178cc33f4b472f1643723ded");
  assert.equal(report.postExecutionSnapshot.snapshotPhase, "POST_EXECUTION");
  assert.equal(report.postExecutionSnapshot.sourceOfTruth, false);
  assert.equal(report.postExecutionSnapshot.snapshotRole, "HISTORICAL_POST_EXECUTION_CLOSURE");
  assert.equal(report.postExecutionSnapshot.supersededBy, "latestReadOnlyObservation");
  assert.equal(report.postExecutionSnapshot.asOfBlock, 116487188);
  assert.equal(report.postExecutionSnapshot.bank18888.available, "11213020.930416874731235");
  assert.equal(report.postExecutionSnapshot.bank8888.assets, "888.0");
  assert.equal(report.postExecutionSnapshot.bank8888.freeCapital, "800.0");
  assert.equal(report.postExecutionSnapshot.bank8888.payrollLiability, "88.0");
  assert.equal(report.postExecutionSnapshot.hengyao.personalWalletBalanceBnb, "0.00799020555");
  assert.equal(report.postExecutionSnapshot.payroll.claimed, false);
  assert.equal(report.postExecutionSnapshot.policyEnforcement.signerEnforcement, "PENDING");
  assert.equal(report.postExecutionSnapshot.policyEnforcement.furtherPayrollSchedule, "FROZEN");
  assert.equal(report.postExecutionSnapshot.policyEnforcement.further8888Topup, "FORBIDDEN_WITHOUT_NEW_AUTHORIZATION");
  assert.equal(report.postExecutionSnapshot.newMainnetTransactionSentByCloseout, false);
  assert.equal(report.latestReadOnlyObservation.snapshotPhase, "LATEST_READ_ONLY_OBSERVATION");
  assert.equal(report.latestReadOnlyObservation.sourceOfTruth, true);
  assert.equal(report.latestReadOnlyObservation.chainId, 56);
  assert.equal(report.latestReadOnlyObservation.asOfBlock, 118329214);
  assert.equal(report.latestReadOnlyObservation.bank18888.kaiosBalance, "22213020.930416874731235");
  assert.equal(report.latestReadOnlyObservation.bank18888.reserve, "11000000.0");
  assert.equal(report.latestReadOnlyObservation.bank18888.available, "11213020.930416874731235");
  assert.equal(report.latestReadOnlyObservation.bank18888.officialOutflow, "888.0");
  assert.equal(report.latestReadOnlyObservation.bank18888.kgenBalance, "0.0");
  assert.equal(report.latestReadOnlyObservation.bank18888.bnbBalance, "0.0");
  assert.equal(report.latestReadOnlyObservation.bank18888.healthy, true);
  assert.equal(report.latestReadOnlyObservation.bank18888.paused, false);
  assert.equal(report.latestReadOnlyObservation.bank8888.assets, "888.0");
  assert.equal(report.latestReadOnlyObservation.bank8888.freeCapital, "800.0");
  assert.equal(report.latestReadOnlyObservation.bank8888.payrollLiability, "88.0");
  assert.equal(report.latestReadOnlyObservation.bank8888.accountLiability, "0.0");
  assert.equal(report.latestReadOnlyObservation.bank8888.paymentLiability, "0.0");
  assert.equal(report.latestReadOnlyObservation.bank8888.payrollClaimed, false);
  assert.equal(report.latestReadOnlyObservation.bank8888.currentBankingEpoch, "24319");
  assert.equal(report.latestReadOnlyObservation.verification.kaiosBalanceMatchesTokenBalanceOf, true);
  assert.equal(report.latestReadOnlyObservation.verification.bank8888AssetsMatchFreeCapitalPlusLiability, true);
  assert.equal(report.latestReadOnlyObservation.transactionState.newMainnetTransactionSentByRefresh, false);
  assert.equal(report.boundaries.privateKeySerialized, false);
});
