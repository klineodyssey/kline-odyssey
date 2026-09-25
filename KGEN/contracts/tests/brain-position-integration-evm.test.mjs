import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import solc from 'solc';
import ganache from 'ganache';
import { BrowserProvider, Contract, ContractFactory, parseEther } from 'ethers';

const brainPath = 'KGEN/contracts/KGEN_BrainExchange.sol';
const enginePath = 'KGEN/contracts/KGEN_PositionEngine.sol';
const kernelPath = 'KGEN/contracts/KGEN_MarketRiskKernel.sol';
const triggerPath = 'KGEN/contracts/KGEN_OrderTriggerEngine.sol';
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

    function setRound(int256 nextAnswer, uint256 nextUpdatedAt, uint80 nextRound) external {
        answer = nextAnswer; updatedAt = nextUpdatedAt;
        roundId = nextRound; answeredInRound = nextRound;
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
  [triggerPath]: { content: fs.readFileSync(triggerPath, 'utf8') },
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
  return { source, name, abi: c.abi, bytecode: `0x${c.evm.bytecode.object}`, runtime: c.evm.deployedBytecode.object };
}

const brainArtifact = artifact(brainPath, 'KGEN_BrainExchange_V4_0_0');
const engineArtifact = artifact(enginePath, 'KGEN_PositionEngine_V1_0_0');
const triggerArtifact = artifact(triggerPath, 'KGEN_OrderTriggerEngine');
const tokenArtifact = artifact(harnessPath, 'MockKGENIntegration');
const proxyArtifact = artifact(harnessPath, 'BrainIntegrationProxy');
const feedArtifact = artifact(harnessPath, 'MockPriceFeedIntegration');
assert.ok(brainArtifact.runtime.length / 2 <= 24_576, 'Brain optimized runtime exceeds EIP-170');
assert.ok(engineArtifact.runtime.length / 2 <= 24_576, 'Position Engine optimized runtime exceeds EIP-170');
assert.ok(triggerArtifact.runtime.length / 2 <= 24_576, 'Trigger optimized runtime exceeds EIP-170');

const eip1193 = ganache.provider({ logging: { quiet: true }, wallet: { totalAccounts: 9 } });
const provider = new BrowserProvider(eip1193);
provider.pollingInterval = 20;
const signers = await Promise.all(Array.from({ length: 8 }, (_, i) => provider.getSigner(i)));
const [admin, keeper, pauser, upgrader, treasury, executor, trader, stranger] = signers;
const deploymentReceipts = [];
const smokeReceipts = [];
function receiptRecord(label, receipt) {
  return { label, transactionHash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString(), status: receipt.status };
}

async function deploy(compiled, signer, args = []) {
  const factory = new ContractFactory(compiled.abi, compiled.bytecode, signer);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  const receipt = await contract.deploymentTransaction().wait();
  deploymentReceipts.push({ ...receiptRecord(compiled.name, receipt), source: compiled.source, address: contract.target });
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
smokeReceipts.push(receiptRecord('grantSettlementRoleOnlyPosition', await (await brain.grantRole(settlementRole, engine.target)).wait()));
assert.equal(await brain.hasRole(settlementRole, engine.target), true);
for (const signer of [admin, executor, trader, stranger]) {
  assert.equal(await brain.hasRole(settlementRole, await signer.getAddress()), false, 'EOA must not hold SETTLEMENT_ROLE');
}

await (await token.mint(await trader.getAddress(), parseEther('500'))).wait();
await (await token.connect(trader).approve(proxy.target, parseEther('500'))).wait();
smokeReceipts.push(receiptRecord('depositMargin100', await (await brain.connect(trader).depositMargin(parseEther('100'))).wait()));
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

// The final execution path uses the SAME real Brain proxy and Position Engine.
// Only test token and price-feed inputs are mocked; custody/settlement are not.
const trigger = await deploy(triggerArtifact, admin, [engine.target, await keeper.getAddress()]);
await (await engine.setExecutor(trigger.target)).wait();
assert.equal(await brain.hasRole(settlementRole, trigger.target), false);
await expectRevert(engine.connect(executor).openPosition(await trader.getAddress(), 0, size1, parseEther('20')), 'former EOA executor revoked');
await (await engine.configureMarket(0, 100, 10, 60, px50, px150, true)).wait();
await expectRevert(engine.configureMarket(0, 99, 10, 60, px50, px150, true), '100x hard risk ceiling');
await (await token.mint(await trader.getAddress(), parseEther('10000'))).wait();
await (await token.connect(trader).approve(proxy.target, parseEther('10000'))).wait();
await (await brain.connect(trader).depositMargin(parseEther('10000'))).wait();
await (await token.mint(await admin.getAddress(), parseEther('10000'))).wait();
await (await token.transfer(proxy.target, parseEther('10000'))).wait();
await (await brain.allocateInsuranceReserve(parseEther('5000'))).wait();

async function tick(price, timestamp) {
  await eip1193.request({ method: 'evm_increaseTime', params: [2] });
  await eip1193.request({ method: 'evm_mine', params: [] });
  const ts = timestamp ?? await latestTimestamp();
  for (const feed of [feed0, feed1, feed2]) await (await feed.set(price, ts)).wait();
  return ts;
}
async function create(c = '100', lots = 1, price = px100, actor = trader) {
  const id = await trigger.nextOrderId();
  await (await trigger.connect(actor).createOrder(0, parseEther(c), lots, price)).wait();
  assert.equal((await trigger.order(id)).status, 1n);
  return id;
}
async function observe(id) {
  const receipt = await (await trigger.connect(keeper).observeOrder(id, { gasLimit: 2_000_000 })).wait();
  smokeReceipts.push(receiptRecord(`observeOrder:${id}`, receipt));
  return receipt;
}
async function fill(c = '100', lots = 1) {
  await tick(px100);
  const id = await create(c, lots);
  const before = await brain.availablePrincipal(await trader.getAddress());
  const nextPosition = await engine.nextPositionId();
  await observe(id);
  const order = await trigger.order(id);
  const receipt = await trigger.fillReceipt(id);
  assert.equal(order.status, 2n); assert.equal(order.positionId, nextPosition);
  assert.equal(receipt.orderId, id); assert.equal(receipt.positionId, nextPosition);
  assert.equal(receipt.c, parseEther(c)); assert.equal(receipt.lots, BigInt(lots));
  assert.equal(receipt.side, Number(c) > 0 ? 1n : -1n);
  assert.equal(receipt.trader, await trader.getAddress());
  assert.equal(receipt.createdAt, order.createdAt); assert.equal(receipt.triggeredAt, order.triggeredAt);
  assert.equal(receipt.previousPrice, px100); assert.equal(receipt.triggerPrice, px100);
  assert.equal(receipt.observedPrice, px100); assert.equal(receipt.fillPrice, px100);
  assert.equal(receipt.walletBefore, before); assert.equal(receipt.marginLocked, parseEther(String(lots)));
  assert.equal(receipt.walletAfter, before - parseEther(String(lots)));
  assert.equal(await engine.usedOrderIds(id), true);
  await expectRevert(trigger.connect(keeper).observeOrder(id), 'one shot duplicate fill');
  assert.equal(await engine.nextPositionId(), nextPosition + 1n);
  assert.equal((await trigger.fillReceipt(id)).positionId, nextPosition);
  return { id, positionId: nextPosition };
}
async function closeAtEntry(positionId) {
  await tick(px100);
  await (await trigger.connect(trader).closePosition(positionId, { gasLimit: 2_000_000 })).wait();
  assert.equal((await engine.positions(positionId)).collateralWad, 0n);
}

await tick(px100);
for (const c of ['0', '100.000000000000000001', '-100.000000000000000001', '1000', '-1000']) {
  await expectRevert(trigger.connect(trader).createOrder(0, parseEther(c), 1, px100), `invalid C ${c}`);
}
for (const lots of [0, 101]) await expectRevert(trigger.connect(trader).createOrder(0, parseEther('1'), lots, px100), `invalid lots ${lots}`);
let oid = await create();
await expectRevert(trigger.connect(stranger).cancelOrder(oid), 'only trader cancels');
await (await trigger.connect(trader).cancelOrder(oid)).wait();
assert.equal((await trigger.order(oid)).status, 3n);
await expectRevert(trigger.connect(keeper).observeOrder(oid), 'cancelled cannot fill');
oid = await create('100', 1, px100, stranger);
const nextBeforeUnfunded = await engine.nextPositionId();
await expectRevert(trigger.connect(keeper).observeOrder(oid, { gasLimit: 2_000_000 }), 'insufficient collateral rolls back fill');
assert.equal((await trigger.order(oid)).status, 1n);
assert.equal((await trigger.fillReceipt(oid)).orderId, 0n);
assert.equal(await brain.lockedPrincipalOf(await stranger.getAddress()), 0n);
assert.equal(await engine.nextPositionId(), nextBeforeUnfunded);
assert.equal(await engine.usedOrderIds(oid), false);
await (await trigger.connect(keeper).rejectUnfundedOrder(oid)).wait();
assert.equal((await trigger.order(oid)).status, 4n);
await expectRevert(trigger.connect(keeper).observeOrder(oid), 'rejected cannot fill');

for (const [previous, current] of [['99.9', '100.05'], ['100.05', '99.9'], ['99.9', '100']]) {
  await tick(parseEther(previous)); oid = await create();
  await expectRevert(trigger.connect(stranger).observeOrder(oid), 'only keeper observes');
  await tick(parseEther(current)); await observe(oid);
  const o = await trigger.order(oid); const r = await trigger.fillReceipt(oid);
  assert.equal(o.status, 2n); assert.equal(r.previousPrice, parseEther(previous));
  assert.equal(r.observedPrice, parseEther(current)); assert.equal(r.fillPrice, parseEther(current));
  await tick(parseEther(current));
  await (await trigger.connect(trader).closePosition(o.positionId, { gasLimit: 2_000_000 })).wait();
}
await tick(parseEther('99')); oid = await create();
await tick(parseEther('99.5')); await observe(oid);
assert.equal((await trigger.order(oid)).status, 1n, 'no-touch stays pending');
const lastObserved = (await trigger.order(oid)).observedAt;
await tick(px100, lastObserved - 1n);
await expectRevert(trigger.connect(keeper).observeOrder(oid), 'out-of-order feed cannot fill');
await tick(px100, (await latestTimestamp()) - 120n);
await expectRevert(trigger.connect(keeper).observeOrder(oid), 'stale feed cannot fill');
assert.equal((await trigger.order(oid)).status, 1n);
await tick(px100); await observe(oid); await closeAtEntry((await trigger.order(oid)).positionId);

// All canonical markets traverse the same reviewed path; card/UI labels are not authority.
for (const market of [1, 2]) {
  await (await engine.configureMarket(market, 100, 10, 60, px50, px150, true)).wait();
  await (await engine.configureOracle(market, [feed0.target, feed1.target, feed2.target], 2, 500)).wait();
  await tick(px100); const id = await trigger.nextOrderId();
  await (await trigger.connect(trader).createOrder(market, parseEther('-100'), 1, px100)).wait();
  await observe(id); const receipt = await trigger.fillReceipt(id);
  assert.equal(receipt.market, BigInt(market));
  assert.equal((await engine.positions(receipt.positionId)).market, BigInt(market));
  await closeAtEntry(receipt.positionId);
}

const monotonic = await fill('100', 1);
const positionObservedAt = (await engine.orderTerms(monotonic.positionId)).observedAt;
await tick(parseEther('99'), positionObservedAt - 1n);
await expectRevert(trigger.connect(keeper).observePosition(monotonic.positionId), 'older crossing cannot settle position');
assert.equal((await engine.positions(monotonic.positionId)).status, 1n);
assert.equal((await engine.settlementReceipt(monotonic.positionId)).positionId, 0n);
await tick(parseEther('99'), (await latestTimestamp()) - 120n);
await expectRevert(trigger.connect(keeper).observePosition(monotonic.positionId), 'stale crossing cannot settle position');
await closeAtEntry(monotonic.positionId);

// Providers are asynchronous: min(updatedAt) is NOT the observation identity.
const asynchronous = await fill('100', 1);
await eip1193.request({ method: 'evm_increaseTime', params: [2] });
await eip1193.request({ method: 'evm_mine', params: [] });
const asynchronousTs = await latestTimestamp();
await (await feed0.set(parseEther('99'), asynchronousTs)).wait();
await (await feed1.set(parseEther('99'), asynchronousTs)).wait();
// feed2 still reports the entry round; the valid median crosses liquidation.
await (await trigger.connect(keeper).observePosition(asynchronous.positionId, { gasLimit: 2_000_000 })).wait();
assert.equal((await engine.positions(asynchronous.positionId)).status, 3n, 'oldest feed timestamp must not suppress a newer valid quorum');
const singleSourceAdvance = await fill('100', 1);
await eip1193.request({ method: 'evm_increaseTime', params: [2] });
await eip1193.request({ method: 'evm_mine', params: [] });
await (await feed0.set(parseEther('100.1'), await latestTimestamp())).wait();
await (await trigger.connect(keeper).observePosition(singleSourceAdvance.positionId, { gasLimit: 2_000_000 })).wait();
assert.equal((await engine.positions(singleSourceAdvance.positionId)).status, 1n);
await (await trigger.connect(trader).closePosition(singleSourceAdvance.positionId, { gasLimit: 2_000_000 })).wait();

const badRound = await fill('100', 1);
const retainedRound = await feed0.roundId(); const retainedTime = await feed0.updatedAt();
await (await feed0.setRound(px100, retainedTime, retainedRound - 1n)).wait();
await expectRevert(trigger.connect(keeper).observePosition(badRound.positionId), 'round rollback rejected');
await (await feed0.setRound(parseEther('99.9'), retainedTime, retainedRound)).wait();
await expectRevert(trigger.connect(keeper).observePosition(badRound.positionId), 'same-round value mutation rejected');
assert.equal((await engine.positions(badRound.positionId)).status, 1n);
await (await feed0.setRound(px100, retainedTime, retainedRound)).wait();
await closeAtEntry(badRound.positionId);

// Full 100C matrix: both sides, 1 / 100 positive lots, ±0.1 / 0.5 / 1 / 2% gap.
// Maintenance 10 bps is calculated against current notional, not hardcoded 1%.
let stressCases = 0;
for (const c of [100, -100]) for (const lots of [1, 100]) {
  for (const moveBps of [10, -10, 50, -50, 100, -100, 200, -200]) {
    const { positionId } = await fill(String(c), lots);
    const principalBefore = await brain.principalOf(await trader.getAddress());
    const insuranceBefore = await brain.insuranceReserve();
    const margin = parseEther(String(lots));
    const mark = px100 * BigInt(10000 + moveBps) / 10000n;
    await tick(mark);
    const expectedRaw = margin * BigInt(c) * BigInt(moveBps) / 10000n;
    const expectedNotional = margin * 100n * mark / px100;
    const expectedMm = expectedNotional * 10n / 10000n;
    const isLiquidation = margin + expectedRaw <= expectedMm;
    const metrics = await engine.markPosition(positionId);
    assert.equal(metrics.unrealizedPnlWad, expectedRaw);
    assert.equal(metrics.maintenanceMarginWad, expectedMm);
    assert.equal(metrics.liquidatable, isLiquidation);
    if (isLiquidation) {
      smokeReceipts.push(receiptRecord(`liquidate:${positionId}`, await (await trigger.connect(keeper).observePosition(positionId, { gasLimit: 2_000_000 })).wait()));
    } else {
      await (await trigger.connect(keeper).observePosition(positionId, { gasLimit: 2_000_000 })).wait();
      assert.equal((await engine.positions(positionId)).status, 1n);
      smokeReceipts.push(receiptRecord(`close:${positionId}`, await (await trigger.connect(trader).closePosition(positionId, { gasLimit: 2_000_000 })).wait()));
    }
    const expectedRealized = expectedRaw < -margin ? -margin : expectedRaw;
    const expectedDebt = expectedRaw < -margin ? -expectedRaw - margin : 0n;
    const p2 = await engine.positions(positionId); const r2 = await engine.settlementReceipt(positionId);
    assert.equal(p2.status, isLiquidation ? 3n : 2n); assert.equal(p2.collateralWad, 0n);
    assert.equal(r2.marginBefore, margin); assert.equal(r2.marginAfter, 0n);
    assert.equal(r2.rawPnl, expectedRaw); assert.equal(r2.realizedPnl, expectedRealized); assert.equal(r2.badDebt, expectedDebt);
    assert.equal(r2.entryPrice, px100); assert.equal(r2.observedPrice, mark);
    assert.equal(r2.settlementPrice, mark); assert.equal(r2.trader, await trader.getAddress());
    assert.equal(r2.side, c > 0 ? 1n : -1n); assert.ok(r2.triggeredAt > 0n);
    assert.equal(await brain.principalOf(await trader.getAddress()), principalBefore + expectedRealized);
    assert.equal(await brain.insuranceReserve(), insuranceBefore - expectedDebt);
    assert.equal(await brain.lockedPrincipalOf(await trader.getAddress()), 0n);
    assert.equal(await brain.solvent(), true); assert.equal(await brain.uncoveredBadDebt(), 0n);
    await tick(px100);
    await expectRevert(trigger.connect(keeper).observePosition(positionId), 'rebound cannot resurrect closed/liquidated position');
    await expectRevert(trigger.connect(trader).closePosition(positionId), 'no duplicate settlement');
    stressCases++;
  }
  console.log(`[brain-position-trigger-integration-evm] stress ${c}C / ${lots} lots PASS`);
}

// Exact integer liquidation-boundary touch, not just a deep gap.
for (const c of ['100', '-100']) {
  const { positionId } = await fill(c, 1);
  const boundary = await engine.liquidationBoundary(positionId);
  assert.ok(boundary > parseEther('99') && boundary < parseEther('101'));
  await tick(boundary);
  const metrics = await engine.markPosition(positionId);
  assert.equal(metrics.liquidatable, true, 'reported boundary must trigger at exact touch');
  await (await trigger.connect(keeper).observePosition(positionId, { gasLimit: 2_000_000 })).wait();
  assert.equal((await engine.positions(positionId)).status, 3n);
  const boundaryReceipt = await engine.settlementReceipt(positionId);
  assert.equal(boundaryReceipt.marginAfter, 0n);
  assert.equal(boundaryReceipt.liquidationTrigger, boundary);
  assert.equal(boundaryReceipt.previousPrice, px100);
  assert.equal(boundaryReceipt.observedPrice, boundary);
}

// Realistic market scales expose integer threshold rounding hidden by entry=100.
let realisticBoundaryCases = 0;
for (const entryText of ['60000', '4000', '600']) {
  const entry = parseEther(entryText);
  await (await engine.configureMarket(0, 100, 10, 60, entry / 2n, entry * 2n, true)).wait();
  for (const c of ['100', '-100']) for (const lots of [1, 100]) {
    await tick(entry); const id = await create(c, lots, entry); await observe(id);
    const positionId = (await trigger.order(id)).positionId;
    const boundary = await engine.liquidationBoundary(positionId);
    await tick(boundary);
    assert.equal((await engine.markPosition(positionId)).liquidatable, true, `exact reported boundary: ${entryText}/${c}C/${lots}lot`);
    await (await trigger.connect(keeper).observePosition(positionId, { gasLimit: 2_000_000 })).wait();
    const receipt = await engine.settlementReceipt(positionId);
    assert.equal(receipt.status, 3n); assert.equal(receipt.liquidationTrigger, boundary);
    assert.equal(receipt.observedPrice, boundary); assert.equal(receipt.marginAfter, 0n);
    realisticBoundaryCases++;
  }
}
await (await engine.configureMarket(0, 100, 10, 60, px50, px150, true)).wait();

// Brain pause forces reserve failure; Trigger / Position / receipt all revert.
await tick(px100); oid = await create();
const expectedNext = await engine.nextPositionId();
const availableBeforePause = await brain.availablePrincipal(await trader.getAddress());
await (await brain.connect(pauser).pause()).wait();
await expectRevert(trigger.connect(keeper).observeOrder(oid, { gasLimit: 2_000_000 }), 'reserve failure atomicity');
assert.equal((await trigger.order(oid)).status, 1n);
assert.equal((await trigger.fillReceipt(oid)).orderId, 0n);
assert.equal(await engine.nextPositionId(), expectedNext);
assert.equal(await engine.usedOrderIds(oid), false);
assert.equal(await brain.availablePrincipal(await trader.getAddress()), availableBeforePause);
await (await brain.connect(admin).unpause()).wait();
await observe(oid); await closeAtEntry((await trigger.order(oid)).positionId);
console.log(`[brain-position-trigger-integration-evm] PASS: real proxy pair + Trigger, touch/cross, one-shot, immutable receipts, isolation, ${stressCases} 100C stress cases, first observed boundary, rollback`);
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/settlement-local-evm.json', JSON.stringify({
  evidenceClass: 'LOCAL_GANACHE_TEST_ASSETS_NOT_TESTNET',
  status: 'PASS', timestamp: new Date().toISOString(), chainId: (await provider.getNetwork()).chainId.toString(),
  compiler: { version: solc.version(), optimizer: { enabled: true, runs: 200 }, viaIR: false },
  sourceSha256: Object.fromEntries(Object.entries(sources).map(([file, source]) => [file, createHash('sha256').update(source.content).digest('hex')])),
  contracts: { brainProxy: proxy.target, brainImplementation: brainImplementation.target, positionEngine: engine.target, orderTriggerEngine: trigger.target,
    riskKernel: { source: kernelPath, deployment: 'INTERNAL_LIBRARY_INLINED_IN_POSITION_AND_TRIGGER', standaloneAddress: null },
    mockToken: token.target, mockFeeds: [feed0.target, feed1.target, feed2.target] },
  authorities: { admin: await admin.getAddress(), upgradeAuthority: await upgrader.getAddress(), pauser: await pauser.getAddress(),
    keeper: await keeper.getAddress(), positionExecutor: trigger.target, brainSettlementRole: engine.target, trader: await trader.getAddress() },
  configuration: { cMax: 100, lotsMax: 100, initialMarginBps: 100, maintenanceMarginBps: 10, oracleMaxAge: 60, oracleMaxDeviationBps: 500, oracleSources: 3, oracleQuorum: 2 },
  stressCases, realisticBoundaryCases, deploymentReceipts, smokeReceipts,
  testnetDeployment: 'NOT_EXECUTED', mainnetExecution: 'NOT_AUTHORIZED_OR_EXECUTED',
  limitations: ['Mock token and feeds are local only.', 'No production oracle provenance or live-network deployment is certified.', 'Gas is measured local EVM gas, not a production gas-price estimate.']
}, null, 2) + '\n');
await eip1193.disconnect();
