import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import solc from 'solc';
import ganache from 'ganache';
import { BrowserProvider, ContractFactory, Contract, parseEther } from 'ethers';

const enginePath = 'KGEN/contracts/KGEN_PositionEngine_V1_0_0.sol';
const kernelPath = 'KGEN/contracts/KGEN_MarketRiskKernel_V1_0_0.sol';
const sources = {
  [enginePath]: { content: fs.readFileSync(enginePath, 'utf8') },
  [kernelPath]: { content: fs.readFileSync(kernelPath, 'utf8') },
};

function findImports(importPath) {
  const candidates = [importPath, path.join('node_modules', importPath)];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return { contents: fs.readFileSync(candidate, 'utf8') };
  }
  return { error: `Import not found: ${importPath}` };
}

const input = {
  language: 'Solidity',
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] } },
  },
};
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = (output.errors || []).filter((e) => e.severity === 'error');
if (errors.length) throw new Error(errors.map((e) => e.formattedMessage).join('\n'));

const artifact = output.contracts[enginePath].KGEN_PositionEngine_V1_0_0;
assert.ok(artifact?.evm?.bytecode?.object, 'missing position engine bytecode');
assert.ok(artifact.evm.deployedBytecode.object.length / 2 < 24_576, 'position engine exceeds EIP-170 runtime size');

const eip1193 = ganache.provider({ logging: { quiet: true }, wallet: { totalAccounts: 5 } });
const provider = new BrowserProvider(eip1193);
const [admin, executor, trader, stranger] = await Promise.all([0,1,2,3].map((i) => provider.getSigner(i)));
const factory = new ContractFactory(artifact.abi, `0x${artifact.evm.bytecode.object}`, admin);
const deployed = await factory.deploy(await admin.getAddress(), await executor.getAddress());
await deployed.waitForDeployment();
const engine = new Contract(deployed.target, artifact.abi, admin);

async function expectRevert(promise, label) {
  let reverted = false;
  try {
    const result = await promise;
    if (result && typeof result.wait === 'function') await result.wait();
  } catch {
    reverted = true;
  }
  assert.ok(reverted, `expected revert: ${label}`);
}

async function latestTimestamp() {
  const block = await eip1193.request({ method: 'eth_getBlockByNumber', params: ['latest', false] });
  return BigInt(block.timestamp);
}

const px50 = parseEther('50');
const px80 = parseEther('80');
const px100 = parseEther('100');
const px110 = parseEther('110');
const px120 = parseEther('120');
const px150 = parseEther('150');
const size1 = parseEther('1');
const now = await latestTimestamp();

// Configure all three canonical markets: 20% initial margin, 5% maintenance, 60s oracle freshness.
for (const market of [0, 1, 2]) {
  await (await engine.configureMarket(market, 2000, 500, 60, px50, px150, true)).wait();
}

await expectRevert(
  engine.connect(stranger).openPosition(await trader.getAddress(), 0, size1, parseEther('20'), px100, now),
  'unauthorized open'
);
await expectRevert(
  engine.connect(executor).openPosition(await trader.getAddress(), 0, size1, parseEther('19'), px100, now),
  'initial margin floor'
);

await (await engine.connect(executor).openPosition(await trader.getAddress(), 0, size1, parseEther('20'), px100, now)).wait();
const longId = 1n;
let p = await engine.positions(longId);
assert.equal(p.trader, await trader.getAddress());
assert.equal(p.market, 0n);
assert.equal(p.status, 1n);

let mark = await engine.markPosition(longId, px110, now);
assert.equal(mark[0], parseEther('10'));
assert.equal(mark[1], parseEther('30'));
assert.equal(mark[2], parseEther('5.5'));
assert.equal(mark[3], false);

await eip1193.request({ method: 'evm_increaseTime', params: [120] });
await eip1193.request({ method: 'evm_mine', params: [] });
await expectRevert(engine.markPosition(longId, px110, now), 'stale mark');
const freshNow = await latestTimestamp();

// Profitable close preserves raw == realized and creates no bad debt.
await (await engine.connect(executor).closePosition(longId, px120, freshNow)).wait();
p = await engine.positions(longId);
assert.equal(p.status, 2n);
assert.equal(p.rawPnlWad, parseEther('20'));
assert.equal(p.realizedPnlWad, parseEther('20'));
assert.equal(p.badDebtWad, 0n);
await expectRevert(engine.connect(executor).closePosition(longId, px120, freshNow), 'double close');

// Short KY at 100, collateral 20. Mark 120 => loss exactly equals collateral.
await (await engine.connect(executor).openPosition(await trader.getAddress(), 1, -size1, parseEther('20'), px100, freshNow)).wait();
const shortId = 2n;
mark = await engine.markPosition(shortId, px120, freshNow);
assert.equal(mark[0], -parseEther('20'));
assert.equal(mark[1], 0n);
assert.equal(mark[3], true);
await (await engine.connect(executor).liquidatePosition(shortId, px120, freshNow)).wait();
p = await engine.positions(shortId);
assert.equal(p.status, 3n);
assert.equal(p.rawPnlWad, -parseEther('20'));
assert.equal(p.realizedPnlWad, -parseEther('20'));
assert.equal(p.badDebtWad, 0n);

// KZ is a real independent market enum/config, not a second world/runtime.
await (await engine.connect(executor).openPosition(await trader.getAddress(), 2, size1, parseEther('20'), px80, freshNow)).wait();
const kz = await engine.positions(3n);
assert.equal(kz.market, 2n);
assert.equal(kz.entryPriceWad, px80);

// Gap-risk invariant: a short from 100 to 150 loses 50 raw, but isolated
// user settlement is capped at the 20 collateral; the remaining 30 is explicit bad debt.
await (await engine.connect(executor).openPosition(await trader.getAddress(), 0, -size1, parseEther('20'), px100, freshNow)).wait();
const gapId = 4n;
mark = await engine.markPosition(gapId, px150, freshNow);
assert.equal(mark[3], true);
await (await engine.connect(executor).liquidatePosition(gapId, px150, freshNow)).wait();
p = await engine.positions(gapId);
assert.equal(p.rawPnlWad, -parseEther('50'));
assert.equal(p.realizedPnlWad, -parseEther('20'));
assert.equal(p.badDebtWad, parseEther('30'));
assert.equal(p.status, 3n);

console.log('[position-engine-evm] PASS: KX/KY/KZ, IM/MM, oracle freshness, close/liquidation, isolated-loss cap, explicit bad debt');
