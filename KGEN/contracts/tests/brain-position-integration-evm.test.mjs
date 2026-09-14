import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import solc from 'solc';
import ganache from 'ganache';
import { BrowserProvider, Contract, ContractFactory, parseEther } from 'ethers';

const brainPath = 'KGEN/contracts/KGEN_BrainExchange_V4_0_0.sol';
const enginePath = 'KGEN/contracts/KGEN_PositionEngine_V1_0_0.sol';
const kernelPath = 'KGEN/contracts/KGEN_MarketRiskKernel_V1_0_0.sol';
const harnessPath = 'KGEN/contracts/tests/BrainPositionIntegrationHarness.sol';

const harnessSource = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract MockKGENIntegration is ERC20 {
    constructor() ERC20("Mock KGEN", "KGEN") {}
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract BrainIntegrationProxy is ERC1967Proxy {
    constructor(address implementation, bytes memory data) ERC1967Proxy(implementation, data) {}
}

contract MockPriceFeedIntegration {
    uint8 public constant decimals = 18;
    int256 public answer;
    uint256 public updatedAt;
    uint80 public roundId = 1;
    uint80 public answeredInRound = 1;

    constructor(int256 initialAnswer, uint256 initialUpdatedAt) {
        answer = initialAnswer;
        updatedAt = initialUpdatedAt;
    }

    function set(int256 nextAnswer, uint256 nextUpdatedAt) external {
        answer = nextAnswer;
        updatedAt = nextUpdatedAt;
        roundId += 1;
        answeredInRound = roundId;
    }

    function latestRoundData()
        external
        view
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (roundId, answer, updatedAt, updatedAt, answeredInRound);
    }
}
`;

const sources = {
  [brainPath]: { content: fs.readFileSync(brainPath, 'utf8') },
  [enginePath]: { content: fs.readFileSync(enginePath, 'utf8') },
  [kernelPath]: { content: fs.readFileSync(kernelPath, 'utf8') },
  [harnessPath]: { content: harnessSource },
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

function artifact(source, name) {
  const c = output.contracts[source]?.[name];
  assert.ok(c?.evm?.bytecode?.object, `missing artifact ${source}:${name}`);
  return { abi: c.abi, bytecode: `0x${c.evm.bytecode.object}`, runtime: c.evm.deployedBytecode.object };
}

const brainArtifact = artifact(brainPath, 'KGEN_BrainExchange_V4_0_0');
const engineArtifact = artifact(enginePath, 'KGEN_PositionEngine_V1_0_0');
const tokenArtifact = artifact(harnessPath, 'MockKGENIntegration');
const proxyArtifact = artifact(harnessPath, 'BrainIntegrationProxy');
const feedArtifact = artifact(harnessPath, 'MockPriceFeedIntegration');
assert.ok(brainArtifact.runtime.length / 2 <= 24_576, 'Brain optimized runtime exceeds EIP-170');
assert.ok(engineArtifact.runtime.length / 2 <= 24_576, 'Position Engine optimized runtime exceeds EIP-170');

const eip1193 = ganache.provider({ logging: { quiet: true }, wallet: { totalAccounts: 9 } });
const provider = new BrowserProvider(eip1193);
const signers = await Promise.all(Array.from({ length: 8 }, (_, i) => provider.getSigner(i)));
const [admin, keeper, pauser, upgrader, treasury, executor, trader, stranger] = signers;

async function deploy(compiled, signer, args = []) {
  const factory = new ContractFactory(compiled.abi, compiled.bytecode, signer);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

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

const token = await deploy(tokenArtifact, admin);
const brainImplementation = await deploy(brainArtifact, admin);
const now = await latestTimestamp();
const brainInterface = new ContractFactory(brainArtifact.abi, brainArtifact.bytecode, admin).interface;
const initData = brainInterface.encodeFunctionData('initialize', [
  token.target,
  await admin.getAddress(),
  await keeper.getAddress(),
  await pauser.getAddress(),
  await upgrader.getAddress(),
  await treasury.getAddress(),
  now + 30n * 24n * 60n * 60n,
]);
const proxy = await deploy(proxyArtifact, admin, [brainImplementation.target, initData]);
const brain = new Contract(proxy.target, brainArtifact.abi, admin);

const px50 = parseEther('50');
const px100 = parseEther('100');
const px120 = parseEther('120');
const px150 = parseEther('150');
const size1 = parseEther('1');
const feed0 = await deploy(feedArtifact, admin, [px100, now]);
const feed1 = await deploy(feedArtifact, admin, [px100, now]);
const feed2 = await deploy(feedArtifact, admin, [px100, now]);
const engine = await deploy(engineArtifact, admin, [await admin.getAddress(), await executor.getAddress(), proxy.target]);

await (await engine.configureMarket(0, 2000, 500, 60, px50, px150, true)).wait();
await (await engine.configureOracle(0, [feed0.target, feed1.target, feed2.target], 2, 500)).wait();

// Production authority shape: the reviewed Engine contract is the sole settlement caller in this harness.
const settlementRole = await brain.SETTLEMENT_ROLE();
await (await brain.grantRole(settlementRole, engine.target)).wait();
assert.equal(await brain.hasRole(settlementRole, engine.target), true);
for (const signer of [admin, executor, trader, stranger]) {
  assert.equal(await brain.hasRole(settlementRole, await signer.getAddress()), false, 'EOA must not hold SETTLEMENT_ROLE');
}

await (await token.mint(await trader.getAddress(), parseEther('500'))).wait();
await (await token.connect(trader).approve(proxy.target, parseEther('500'))).wait();
await (await brain.connect(trader).depositMargin(parseEther('100'))).wait();
assert.equal(await brain.principalOf(await trader.getAddress()), parseEther('100'));
assert.equal(await brain.solvent(), true);

// No EOA can bypass the Position Engine and fabricate a reservation / PnL settlement.
const forgedKey = '0x' + '11'.repeat(32);
await expectRevert(
  brain.connect(executor).reservePositionCollateral(forgedKey, await trader.getAddress(), parseEther('20')),
  'executor cannot forge direct Brain reservation'
);
await expectRevert(
  brain.connect(executor).settlePositionCollateral(forgedKey, parseEther('999'), 0),
  'executor cannot forge direct Brain PnL'
);

// Real pair: open atomically creates the Brain reservation under an Engine-scoped key.
await (await engine.connect(executor).openPosition(await trader.getAddress(), 0, size1, parseEther('20'))).wait();
const longId = 1n;
const longKey = await engine.positionKey(longId);
let reservation = await brain.positionReservations(longKey);
assert.equal(reservation.user, await trader.getAddress());
assert.equal(reservation.amountWei, parseEther('20'));
assert.equal(reservation.status, 1n);
assert.equal(await brain.lockedPrincipalOf(await trader.getAddress()), parseEther('20'));

async function setFeeds(value) {
  const ts = await latestTimestamp();
  await (await feed0.set(value, ts)).wait();
  await (await feed1.set(value, ts)).wait();
  await (await feed2.set(value, ts)).wait();
}

// Profit settlement must fail closed without real surplus, and EVM atomicity must preserve OPEN + reservation.
await setFeeds(px120);
await expectRevert(engine.connect(executor).closePosition(longId), 'profit cannot be minted from nothing');
let p = await engine.positions(longId);
assert.equal(p.status, 1n, 'failed settlement must roll Position state back to OPEN');
reservation = await brain.positionReservations(longKey);
assert.equal(reservation.status, 1n, 'failed settlement must leave Brain reservation active');
assert.equal(await brain.lockedPrincipalOf(await trader.getAddress()), parseEther('20'));

// Add real KGEN surplus; exact same close can now settle atomically.
await (await token.mint(await admin.getAddress(), parseEther('50'))).wait();
await (await token.transfer(proxy.target, parseEther('20'))).wait();
assert.equal(await brain.freeSurplus(), parseEther('20'));
await (await engine.connect(executor).closePosition(longId, { gasLimit: 1_500_000 })).wait();
p = await engine.positions(longId);
reservation = await brain.positionReservations(longKey);
assert.equal(p.status, 2n);
assert.equal(p.realizedPnlWad, parseEther('20'));
assert.equal(reservation.status, 3n);
assert.equal(reservation.realizedPnlWei, parseEther('20'));
assert.equal(await brain.principalOf(await trader.getAddress()), parseEther('120'));
assert.equal(await brain.lockedPrincipalOf(await trader.getAddress()), 0n);
assert.equal(await brain.solvent(), true);

// Gap loss uses real insurance reserved from real surplus; unrelated principal is never charged.
await (await token.transfer(proxy.target, parseEther('30'))).wait();
await (await brain.allocateInsuranceReserve(parseEther('30'))).wait();
assert.equal(await brain.insuranceReserve(), parseEther('30'));
await setFeeds(px100);
await (await engine.connect(executor).openPosition(await trader.getAddress(), 0, -size1, parseEther('20'))).wait();
const gapId = 2n;
const gapKey = await engine.positionKey(gapId);
await setFeeds(px150);
await (await engine.connect(executor).liquidatePosition(gapId, { gasLimit: 1_500_000 })).wait();
p = await engine.positions(gapId);
reservation = await brain.positionReservations(gapKey);
assert.equal(p.status, 3n);
assert.equal(p.rawPnlWad, -parseEther('50'));
assert.equal(p.realizedPnlWad, -parseEther('20'));
assert.equal(p.badDebtWad, parseEther('30'));
assert.equal(reservation.status, 3n);
assert.equal(reservation.realizedPnlWei, -parseEther('20'));
assert.equal(await brain.insuranceReserve(), 0n);
assert.equal(await brain.uncoveredBadDebt(), 0n);
assert.equal(await brain.principalOf(await trader.getAddress()), parseEther('100'));
assert.equal(await brain.tradingHealthy(), true);
assert.equal(await brain.solvent(), true);

console.log('[brain-position-integration-evm] PASS: Engine-only settlement role, real Brain proxy reservation, profit rollback/surplus settlement, insurance gap-loss accounting');
