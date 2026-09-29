import fs from 'node:fs';
import assert from 'node:assert/strict';

const path = 'KGEN/contracts/KGEN_BrainExchange.sol';
const src = fs.readFileSync(path, 'utf8');

const mustContain = [
  'contract KGEN_BrainExchange_V4_0_0',
  'UUPSUpgradeable',
  'totalPrincipal',
  'totalRewardLiability',
  'function reservedBalance()',
  'function freeSurplus()',
  'function solvent()',
  'BRAIN_CAPACITY_EXCEEDED',
  'require(amountWei <= freeSurplus(), "SURPLUS_ONLY")',
  'MIN_UPGRADE_DELAY = 24 hours',
  'function withdrawMargin(uint256 amountWei) external nonReentrant',
  'function claimProfit() external nonReentrant',
  'function fundSettlementCapital(uint256 requestedWei)',
  'function fundInsurance(uint256 requestedWei)',
  'function reservePositionRisk(bytes32 positionKey',
  'function claimSettlement(bytes32 positionKey) external nonReentrant',
  'function custodyReservedBalance()',
  'settlementCapital + reservedSettlementLiability',
  'return custodyReservedBalance() + totalPlayerClaimable',
  'return settlementCapital - totalPlayerClaimable',
  'uint256[29] private __gap',
];
for (const needle of mustContain) assert.ok(src.includes(needle), `missing invariant marker: ${needle}`);

for (const fn of ['withdrawMargin', 'claimProfit', 'claimSettlement']) {
  const m = src.match(new RegExp(`function ${fn}\\([^)]*\\)[^{]*\\{`));
  assert.ok(m, `missing function header: ${fn}`);
  assert.ok(!m[0].includes('whenNotPaused'), `${fn} must remain available while paused`);
}

const depositHeader = src.match(/function depositMargin\([^)]*\)[^{]*\{/);
assert.ok(depositHeader?.[0].includes('whenNotPaused'), 'depositMargin must be pause-gated');
assert.match(src,/newTotalPrincipal\s*=\s*totalPrincipal\s*\+\s*receivedWei[\s\S]*?newTotalPrincipal\s*<=\s*principalCapacityWei\(\)/,'deposit must enforce principal capacity');

for (const fn of ['supplyHeart', 'sweepToTreasury']) {
  const start = src.indexOf(`function ${fn}`);
  assert.ok(start >= 0, `missing ${fn}`);
  const next = src.indexOf('\n    function ', start + 1);
  const body = src.slice(start, next >= 0 ? next : src.length);
  assert.ok(body.includes('amountWei <= freeSurplus()'), `${fn} must be surplus-only`);
  assert.ok(body.includes('_assertSolvent()'), `${fn} must assert solvency after transfer`);
}

const payrollStart = src.indexOf('function rollPayroll');
const payrollEnd = src.indexOf('\n    function ', payrollStart + 1);
const payroll = src.slice(payrollStart, payrollEnd >= 0 ? payrollEnd : src.length);
assert.ok(payroll.includes('totalRewardLiability += marginReward'), 'payroll must reserve margin reward liability');
assert.ok(payroll.includes('_assertSolvent()'), 'payroll must assert solvency');
assert.ok(src.includes('scheduledImplementation'), 'scheduled implementation state missing');
assert.ok(src.includes('scheduledUpgradeEta'), 'scheduled upgrade ETA missing');
assert.ok(src.includes('upgradeDelay'), 'upgrade delay missing');
const funding = src.slice(src.indexOf('function _receiveFunding'), src.indexOf('function fundSettlementCapital'));
assert.ok(funding.includes('receivedWei = afterBal - beforeBal'), 'funding must use actual received tokens');
const settlement = src.slice(src.indexOf('function settlePositionCollateral'), src.indexOf('function custodyReservedBalance'));
assert.ok(!settlement.includes('INSUFFICIENT_REAL_SURPLUS'), 'unfunded profit must become claimable rather than trapping exits');
assert.ok(settlement.includes('_releasePositionRisk(positionKey)'), 'settlement must release liability exactly once');
assert.ok(settlement.includes('settlementCapital += lossWei'), 'realized losses must remain isolated from Treasury');
assert.match(src, /function solvent\(\)[^{]+\{ return kgen.balanceOf\(address\(this\)\) >= custodyReservedBalance\(\)/, 'unfunded debt must not freeze otherwise cash-backed principal exits');

console.log('[brain-v4-static-invariants] PASS');
