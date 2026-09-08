import fs from 'node:fs';
import assert from 'node:assert/strict';

const path = 'KGEN/contracts/KGEN_BrainExchange_V4_0_0.sol';
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
  'MIN_UPGRADE_DELAY = 2 days',
  'function withdrawMargin(uint256 amountWei) external nonReentrant',
  'function claimProfit() external nonReentrant',
];
for (const needle of mustContain) {
  assert.ok(src.includes(needle), `missing invariant marker: ${needle}`);
}

// User exits must remain callable while paused: withdrawal/claim must not carry whenNotPaused.
for (const fn of ['withdrawMargin', 'claimProfit']) {
  const m = src.match(new RegExp(`function ${fn}\\([^)]*\\)[^{]*\\{`));
  assert.ok(m, `missing function header: ${fn}`);
  assert.ok(!m[0].includes('whenNotPaused'), `${fn} must remain available while paused`);
}

// New deposits are risk-increasing and must stop under pause.
const depositHeader = src.match(/function depositMargin\([^)]*\)[^{]*\{/);
assert.ok(depositHeader?.[0].includes('whenNotPaused'), 'depositMargin must be pause-gated');

// Principal capacity must be a hard deposit gate, not a UI-only warning.
assert.match(
  src,
  /newTotalPrincipal\s*=\s*totalPrincipal\s*\+\s*receivedWei[\s\S]*?newTotalPrincipal\s*<=\s*principalCapacityWei\(\)/,
  'deposit must enforce principal capacity',
);

// Administrative outward transfers must be surplus-only.
for (const fn of ['supplyHeart', 'sweepToTreasury']) {
  const start = src.indexOf(`function ${fn}`);
  assert.ok(start >= 0, `missing ${fn}`);
  const next = src.indexOf('\n    function ', start + 1);
  const body = src.slice(start, next >= 0 ? next : src.length);
  assert.ok(body.includes('amountWei <= freeSurplus()'), `${fn} must be surplus-only`);
  assert.ok(body.includes('_assertSolvent()'), `${fn} must assert solvency after transfer`);
}

// Payroll may create reward liabilities but must preserve solvency afterwards.
const payrollStart = src.indexOf('function rollPayroll');
const payrollEnd = src.indexOf('\n    function ', payrollStart + 1);
const payroll = src.slice(payrollStart, payrollEnd >= 0 ? payrollEnd : src.length);
assert.ok(payroll.includes('totalRewardLiability += marginReward'), 'payroll must reserve margin reward liability');
assert.ok(payroll.includes('_assertSolvent()'), 'payroll must assert solvency');

// Upgrade authorization must be delayed and scheduled.
assert.ok(src.includes('scheduledImplementation'), 'scheduled implementation state missing');
assert.ok(src.includes('scheduledUpgradeEta'), 'scheduled upgrade ETA missing');
assert.ok(src.includes('upgradeDelay'), 'upgrade delay missing');

console.log('[brain-v4-static-invariants] PASS');
