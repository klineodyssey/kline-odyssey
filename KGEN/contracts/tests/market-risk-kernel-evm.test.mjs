import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import solc from 'solc';
import ganache from 'ganache';
import { BrowserProvider, ContractFactory, parseEther } from 'ethers';

const sourcePath = 'KGEN/contracts/KGEN_MarketRiskKernel_V1_0_0.sol';
const source = fs.readFileSync(sourcePath, 'utf8');

function findImports(importPath) {
  const candidates = [importPath, path.join('node_modules', importPath)];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return { contents: fs.readFileSync(candidate, 'utf8') };
  }
  return { error: `Import not found: ${importPath}` };
}

const input = {
  language: 'Solidity',
  sources: { [sourcePath]: { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] } },
  },
};
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = (output.errors || []).filter((e) => e.severity === 'error');
if (errors.length) throw new Error(errors.map((e) => e.formattedMessage).join('\n'));

const compiled = output.contracts[sourcePath].KGEN_MarketRiskKernelHarness_V1_0_0;
assert.ok(compiled?.evm?.bytecode?.object, 'missing kernel harness bytecode');
assert.ok(compiled.evm.deployedBytecode.object.length / 2 < 24_576, 'risk kernel exceeds EIP-170 runtime size');

const eip1193 = ganache.provider({ logging: { quiet: true }, wallet: { totalAccounts: 2 } });
const provider = new BrowserProvider(eip1193);
const signer = await provider.getSigner(0);
const factory = new ContractFactory(compiled.abi, `0x${compiled.evm.bytecode.object}`, signer);
const kernel = await factory.deploy();
await kernel.waitForDeployment();

async function expectRevert(promise, label) {
  let reverted = false;
  try { await promise; } catch { reverted = true; }
  assert.ok(reverted, `expected revert: ${label}`);
}

const WAD = parseEther('1');
const px100 = parseEther('100');
const px120 = parseEther('120');
const px80 = parseEther('80');
const size2 = parseEther('2');

// 2 contracts * 100 KGEN = 200 KGEN notional.
assert.equal(await kernel.notional(size2, px100), parseEther('200'));

// Long gains 40 KGEN when mark rises 100 -> 120; short loses 40 KGEN.
assert.equal(await kernel.pnl(size2, px100, px120), parseEther('40'));
assert.equal(await kernel.pnl(-size2, px100, px120), -parseEther('40'));
assert.equal(await kernel.pnl(size2, px100, px80), -parseEther('40'));

// 5% maintenance on 200 KGEN = 10 KGEN.
assert.equal(await kernel.maintenanceMargin(parseEther('200'), 500), parseEther('10'));

// Healthy: collateral 50, PnL -20, equity 30 > MM 10.
assert.equal(await kernel.liquidatable(parseEther('50'), -parseEther('20'), parseEther('200'), 500), false);
// Liquidatable: collateral 25, PnL -20, equity 5 <= MM 10.
assert.equal(await kernel.liquidatable(parseEther('25'), -parseEther('20'), parseEther('200'), 500), true);
// Boundary is fail-closed: equity exactly MM is liquidatable.
assert.equal(await kernel.liquidatable(parseEther('30'), -parseEther('20'), parseEther('200'), 500), true);

// Oracle guard accepts fresh bounded prices and rejects stale/future/out-of-range observations.
const nowTs = 2_000_000n;
assert.equal(await kernel.validateOraclePrice(px100, nowTs - 30n, nowTs, 60n, px80, px120), px100);
await expectRevert(kernel.validateOraclePrice(px100, nowTs - 61n, nowTs, 60n, px80, px120), 'stale oracle');
await expectRevert(kernel.validateOraclePrice(px100, nowTs + 1n, nowTs, 60n, px80, px120), 'future oracle timestamp');
await expectRevert(kernel.validateOraclePrice(parseEther('79'), nowTs, nowTs, 60n, px80, px120), 'oracle below bound');
await expectRevert(kernel.validateOraclePrice(parseEther('121'), nowTs, nowTs, 60n, px80, px120), 'oracle above bound');
await expectRevert(kernel.notional(0n, WAD), 'zero position size');
await expectRevert(kernel.maintenanceMargin(parseEther('1'), 0), 'zero maintenance bps');

console.log('[market-risk-kernel-evm] PASS: PnL, notional, MM, liquidation boundary, oracle freshness/bounds');
