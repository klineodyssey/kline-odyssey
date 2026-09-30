import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import solc from 'solc';
import ganache from 'ganache';
import { BrowserProvider, Contract, ContractFactory, parseEther } from 'ethers';
import { C_DETENTS } from '../../../K線西遊記/temples/11520/controls/nonlinear-controls.mjs';

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

// Oracle freshness is chain-time policy, not host scheduling latency. Explicit
// evm_increaseTime below still drives stale/future/ordering cases deterministically.
const eip1193 = ganache.provider({ logging: { quiet: true }, wallet: { totalAccounts: 9 }, miner: { timestampIncrement: 1 } });
let estimateRpcRequests = 0;
// Ganache mines synchronously. Ethers' default 250ms cache also retains rejected
// estimateGas promises, so an unfunded rejection can incorrectly survive the
// immediately mined funding transaction on fast CI. Always read current local
// chain state; do not sleep, bypass gas estimation, or weaken capital admission.
const provider = new BrowserProvider({request: payload => {
  if (payload.method === 'eth_estimateGas') estimateRpcRequests++;
  return eip1193.request(payload);
}}, undefined, {cacheTimeout: -1});
provider.pollingInterval = 20;
const signers = await Promise.all(Array.from({ length: 9 }, (_, i) => provider.getSigner(i)));
const [admin, keeper, pauser, upgrader, treasury, executor, trader, stranger, playerC] = signers;
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
async function mockCapability(market=0) {
  // Synthetic local feeds only: never reuse this attestation in production.
  await (await engine.configureTradingCapability(market,[parseEther('100'),(await latestTimestamp())+31536000n,60,60,parseEther('1000000'),'0x'+'11'.repeat(32)])).wait();
}
await mockCapability();

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

// Principal is not exchange risk capital: admission fails before any state persists.
await expectRevert(engine.connect(executor).openPosition(await trader.getAddress(), 0, size1, parseEther('20')), 'principal cannot back settlement liability');
assert.equal(await engine.nextPositionId(), 1n);
assert.equal(await brain.lockedPrincipalOf(await trader.getAddress()), 0n);
await (await token.mint(await admin.getAddress(), parseEther('50'))).wait();
await (await token.approve(proxy.target, parseEther('50'))).wait();
await (await brain.fundSettlementCapital(parseEther('50'))).wait();
assert.equal(await brain.settlementCapital(), parseEther('50'));
assert.equal(await brain.principalOf(await admin.getAddress()), 0n, 'capital funding creates no player principal');

// Regression: the exact previously rejected transaction must now estimate
// successfully, and repeated estimates must reach the EVM instead of a cache.
const estimatesBeforeFundingCheck = estimateRpcRequests;
const fundedEstimate = await engine.connect(executor).openPosition.estimateGas(await trader.getAddress(), 0, size1, parseEther('20'));
const repeatedFundedEstimate = await engine.connect(executor).openPosition.estimateGas(await trader.getAddress(), 0, size1, parseEther('20'));
assert.ok(fundedEstimate > 0n && repeatedFundedEstimate > 0n);
assert.equal(estimateRpcRequests - estimatesBeforeFundingCheck, 2, 'each identical post-funding estimate must query current EVM state');
console.log('[brain-position-integration-evm] uncached unfunded -> funded admission estimates PASS');

// Real pair: open atomically creates collateral plus worst-outcome liability.
await (await engine.connect(executor).openPosition(await trader.getAddress(), 0, size1, parseEther('20'))).wait();
const longId = 1n;
const longKey = await engine.positionKey(longId);
let reservation = await brain.positionReservations(longKey);
assert.equal(reservation.user, await trader.getAddress());
assert.equal(reservation.amountWei, parseEther('20'));
assert.equal(reservation.status, 1n);
assert.equal(await brain.lockedPrincipalOf(await trader.getAddress()), parseEther('20'));
assert.equal(await brain.reservedSettlementLiability(), parseEther('50'));
await expectRevert(engine.connect(executor).openPosition(await trader.getAddress(), 0, -size1, parseEther('20')), 'opposing position cannot net existing liability');
assert.equal(await engine.nextPositionId(), 2n);
assert.equal(await brain.lockedPrincipalOf(await trader.getAddress()), parseEther('20'));
assert.equal(await brain.reservedSettlementLiability(), parseEther('50'));

async function setFeeds(value) {
  // Do not rely on wall-clock seconds elapsing on fast CI runners.
  await eip1193.request({ method: 'evm_increaseTime', params: [1] });
  await eip1193.request({ method: 'evm_mine', params: [] });
  const ts = await latestTimestamp();
  await (await feed0.set(value, ts)).wait();
  await (await feed1.set(value, ts)).wait();
  await (await feed2.set(value, ts)).wait();
}

// The reserved exchange capital pays profit; player principal is never its source.
await setFeeds(px120);
await (await engine.connect(executor).closePosition(longId, { gasLimit: 1_500_000 })).wait();
let p = await engine.positions(longId);
reservation = await brain.positionReservations(longKey);
assert.equal(p.status, 2n);
assert.equal(p.realizedPnlWad, parseEther('20'));
assert.equal(reservation.status, 3n);
assert.equal(reservation.realizedPnlWei, parseEther('20'));
assert.equal(await brain.principalOf(await trader.getAddress()), parseEther('120'));
assert.equal(await brain.lockedPrincipalOf(await trader.getAddress()), 0n);
assert.equal(await brain.solvent(), true);
assert.equal(await brain.settlementCapital(), parseEther('30'));
assert.equal(await brain.reservedSettlementLiability(), 0n);

// Gap loss uses real insurance reserved from real surplus; unrelated principal is never charged.
await (await token.mint(await admin.getAddress(), parseEther('50'))).wait();
await (await token.transfer(proxy.target, parseEther('30'))).wait();
await (await brain.allocateInsuranceReserve(parseEther('30'))).wait();
await (await token.approve(proxy.target, parseEther('20'))).wait();
await (await brain.fundSettlementCapital(parseEther('20'))).wait();
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

console.log('[brain-position-integration-evm] PASS: Engine-only role, principal/capital isolation, atomic admission, reserved-capital profit, insurance gap-loss accounting');

// The final execution path uses the SAME real Brain proxy and Position Engine.
// Only test token and price-feed inputs are mocked; custody/settlement are not.
const trigger = await deploy(triggerArtifact, admin, [engine.target, await keeper.getAddress()]);
await (await engine.setExecutor(trigger.target)).wait();
assert.equal(await brain.hasRole(settlementRole, trigger.target), false);
await expectRevert(engine.connect(executor).openPosition(await trader.getAddress(), 0, size1, parseEther('20')), 'former EOA executor revoked');
await (await engine.configureMarket(0, 100, 10, 60, px50, px150, true)).wait();
await mockCapability();
await expectRevert(engine.configureMarket(0, 99, 10, 60, px50, px150, true), '100x hard risk ceiling');
await (await token.mint(await trader.getAddress(), parseEther('10000'))).wait();
await (await token.connect(trader).approve(proxy.target, parseEther('10000'))).wait();
await (await brain.connect(trader).depositMargin(parseEther('10000'))).wait();
await tick(px100);
const undercapitalized = await create('100', 100);
const admissionNext = await engine.nextPositionId();
const admissionAvailable = await brain.availablePrincipal(await trader.getAddress());
await expectRevert(trigger.connect(keeper).observeOrder(undercapitalized, { gasLimit: 2_000_000 }), 'aggregate exchange capital admission gate');
assert.equal((await trigger.order(undercapitalized)).status, 1n);
assert.equal((await trigger.fillReceipt(undercapitalized)).orderId, 0n);
assert.equal(await engine.nextPositionId(), admissionNext);
assert.equal(await engine.usedOrderIds(undercapitalized), false);
assert.equal(await brain.availablePrincipal(await trader.getAddress()), admissionAvailable);
assert.equal(await brain.lockedPrincipalOf(await trader.getAddress()), 0n);
assert.equal(await brain.reservedSettlementLiability(), 0n);
await (await trigger.connect(trader).cancelOrder(undercapitalized)).wait();
// These are explicitly minted local TEST assets, actually transferred into Brain.
// Worst-price bounds at BTC-like 60000 and 100C x100 lots require up to 600M.
await (await token.mint(await admin.getAddress(), parseEther('1002000000'))).wait();
await (await token.approve(proxy.target, parseEther('1000000000'))).wait();
await (await brain.fundSettlementCapital(parseEther('1000000000'))).wait();
await (await token.transfer(proxy.target, parseEther('2000000'))).wait();
await (await brain.allocateInsuranceReserve(parseEther('2000000'))).wait();

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
  // Preserve decoded revert diagnostics before sending the local smoke tx.
  await trigger.connect(trader).closePosition.staticCall(positionId);
  await (await trigger.connect(trader).closePosition(positionId, { gasLimit: 2_000_000 })).wait();
  assert.equal((await engine.positions(positionId)).collateralWad, 0n);
}

// A/B/C submit independent orders concurrently; custody never nets traders.
const players = [trader, stranger, playerC];
for (const actor of players.slice(1)) {
  await (await token.mint(await actor.getAddress(), parseEther('1000'))).wait();
  await (await token.connect(actor).approve(proxy.target, parseEther('1000'))).wait();
  await (await brain.connect(actor).depositMargin(parseEther('1000'))).wait();
}
await tick(px100);
const playerBefore = await Promise.all(players.map(async actor => brain.principalOf(await actor.getAddress())));
const nextConcurrentOrder = await trigger.nextOrderId();
await Promise.all(players.map(async (actor, i) => (await trigger.connect(actor).createOrder(0, parseEther(i === 1 ? '-100' : i === 2 ? '1' : '100'), i === 2 ? 1 : 100, px100)).wait()));
const concurrentOrders = [nextConcurrentOrder, nextConcurrentOrder + 1n, nextConcurrentOrder + 2n];
for (const id of concurrentOrders) await observe(id);
assert.equal(await brain.reservedSettlementLiability(), parseEther('1000050'), 'long/short reserve is additive, never optimistically netted');
await expectRevert(engine.configureMarket(0, 100, 10, 60, px50, px150, true), 'risk bounds frozen while positions remain open');
await expectRevert(engine.configureOracle(0, [feed0.target, feed1.target, feed2.target], 2, 500), 'oracle configuration frozen while positions remain open');
for (let i = 0; i < players.length; i++) {
  const address = await players[i].getAddress();
  assert.equal(await brain.lockedPrincipalOf(address), parseEther(i === 2 ? '1' : '100'));
  await expectRevert(brain.connect(players[i]).withdrawMargin(playerBefore[i]), 'locked principal cannot be withdrawn');
}
await tick(parseEther('100.001'));
for (const id of concurrentOrders) {
  const order = await trigger.order(id);
  // Owner selection is address-based, not dependent on concurrent mining order.
  const traderAddresses = await Promise.all(players.map(player => player.getAddress()));
  const index = traderAddresses.findIndex(address => address.toLowerCase() === order.trader.toLowerCase());
  await (await trigger.connect(players[index]).closePosition(order.positionId, { gasLimit: 2_000_000 })).wait();
  const receipt = await engine.settlementReceipt(order.positionId);
  assert.equal(receipt.trader, traderAddresses[index]);
  assert.equal(receipt.rawPnl, parseEther(index === 1 ? '-10' : index === 2 ? '0.001' : '10'));
}
assert.equal(await brain.reservedSettlementLiability(), 0n);
for (let i = 0; i < players.length; i++) {
  const address = await players[i].getAddress();
  assert.equal(await brain.principalOf(address), playerBefore[i] + parseEther(i === 1 ? '-10' : i === 2 ? '0.001' : '10'));
  assert.equal(await brain.lockedPrincipalOf(address), 0n);
  assert.equal(await brain.playerClaimable(address), 0n);
  const beforeWithdraw = await token.balanceOf(address);
  await (await brain.connect(players[i]).withdrawMargin(parseEther('1'))).wait();
  assert.equal(await token.balanceOf(address), beforeWithdraw + parseEther('1'));
}
// Restore the intentionally empty account used by the collateral-rejection cases.
await (await brain.connect(stranger).withdrawMargin(await brain.availablePrincipal(await stranger.getAddress()))).wait();
console.log('[brain-position-trigger-integration-evm] A/B/C concurrent admission, additive reserves, independent PnL and withdrawals PASS');

await tick(px100);
for (const c of ['0', '0.0001', '-0.0001', '0.3', '-0.3', '3.742', '-3.742', '17.382', '-17.382', '99.6', '-99.6', '100.001', '-100.001', '100.000000000000000001', '-100.000000000000000001', '1000', '-1000']) {
  await expectRevert(trigger.connect(trader).createOrder(0, parseEther(c), 1, px100), `invalid C ${c}`);
}
// Exact parity with the shared frontend detent authority through the real
// Brain proxy / Trigger / Position / Risk path, including tiny C fill receipts.
for (const c of C_DETENTS.filter(c => c !== 0)) for (const lots of [1, 100]) {
  console.log(`[canonical-c-evm] checking ${c}C / ${lots} lots fill / close / receipts`);
  const { id, positionId } = await fill(String(c), lots);
  assert.equal((await engine.orderTerms(positionId)).cWad, parseEther(String(c)));
  await closeAtEntry(positionId);
  assert.equal((await trigger.fillReceipt(id)).c, parseEther(String(c)));
  assert.equal((await engine.settlementReceipt(positionId)).cWad, parseEther(String(c)));
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
  await mockCapability(market);
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
    const expectedRaw = (mark - px100) * BigInt(c) * BigInt(lots);
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
  await mockCapability();
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
await mockCapability();

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

// Human 2026-09-30: admission range is NOT an exit-price clamp.
const exitOnlyChecks=[];
const capabilityEvidence='0x'+'22'.repeat(32); // LOCAL MOCK evidence, not production certification.
async function capability(c='100',overrides={}) {
  const value={maxCWad:parseEther(c),validUntil:(await latestTimestamp())+3600n,maxAge:60,maxTimeSkew:60,maxSpreadWad:parseEther('1'),evidenceHash:capabilityEvidence,...overrides};
  await (await engine.configureTradingCapability(0,value)).wait();
}
async function rangePosition(c='1',lots=1) {
  await tick(px100); const orderId=await create(c,lots); await observe(orderId);
  return (await trigger.order(orderId)).positionId;
}
await (await engine.configureMarket(0,100,10,60,parseEther('90'),parseEther('110'),true)).wait();
await tick(px100);
await expectRevert(create('1'), 'unconfigured capability rejects new order');
await expectRevert(engine.connect(stranger).configureTradingCapability(0,[parseEther('1'),(await latestTimestamp())+1000n,60,60,1,capabilityEvidence]),'unauthorized capability');
await capability('1'); await expectRevert(create('100'),'100C exceeds attested 1C');
await capability(); await tick(px100); const reducedPending=await create('100');
await capability('1');
await expectRevert(trigger.connect(keeper).observeOrder(reducedPending),'pending fill revalidates reduced capability');
assert.equal((await trigger.order(reducedPending)).status,1n);
await (await trigger.connect(trader).cancelOrder(reducedPending)).wait();
const rangeLong=await rangePosition();
await capability('0'); await tick(parseEther('120'));
assert.equal(await engine.marketTradingState(0),2n);
await expectRevert(create('1',1,parseEther('120')),'range breach prevents new order');
smokeReceipts.push(receiptRecord('range100to120Close',await (await trigger.connect(trader).closePosition(rangeLong)).wait()));
const rangeClose=await engine.settlementReceipt(rangeLong);
assert.equal(rangeClose.observedPrice,parseEther('120')); assert.equal(rangeClose.settlementPrice,parseEther('120'));
assert.equal(rangeClose.rawPnl,parseEther('20')); assert.equal(rangeClose.status,2n);
exitOnlyChecks.push('100_TO_120_CLOSE_REAL_PRICE_WITH_CAPABILITY_DISABLED');
await capability(); const rangeShort=await rangePosition();
const untouchedAvailable=await brain.availablePrincipal(await trader.getAddress());
await tick(parseEther('80'));
smokeReceipts.push(receiptRecord('range100to80Liquidation',await (await trigger.connect(keeper).observePosition(rangeShort)).wait()));
const rangeLiquidation=await engine.settlementReceipt(rangeShort);
assert.equal(rangeLiquidation.settlementPrice,parseEther('80')); assert.equal(rangeLiquidation.rawPnl,-parseEther('20'));
assert.equal(rangeLiquidation.marginAfter,0n); assert.equal(rangeLiquidation.badDebt,parseEther('19'));
assert.equal(await brain.availablePrincipal(await trader.getAddress()),untouchedAvailable);
await expectRevert(trigger.connect(keeper).observePosition(rangeShort),'range liquidation one shot');
exitOnlyChecks.push('100_TO_80_LIQUIDATION_RECEIPT_ISOLATION');
await tick(px100); const pendingBreach=await create('1',1,parseEther('120'));
await tick(parseEther('120')); const nextBeforeBreach=await engine.nextPositionId();
await expectRevert(trigger.connect(keeper).observeOrder(pendingBreach),'pending cross cannot fill beyond admission range');
assert.equal(await engine.nextPositionId(),nextBeforeBreach); assert.equal((await trigger.order(pendingBreach)).status,1n);
await (await trigger.connect(trader).cancelOrder(pendingBreach)).wait();
exitOnlyChecks.push('RANGE_BREACH_BLOCKS_NEW_POSITION_ATOMICALLY');
const expiryPosition=await rangePosition();
await capability('1',{validUntil:(await latestTimestamp())+10n});
await eip1193.request({method:'evm_increaseTime',params:[11]}); await tick(px100);
await expectRevert(create('1'),'expired capability rejects new risk');
await (await trigger.connect(trader).closePosition(expiryPosition)).wait();
exitOnlyChecks.push('EXPIRED_CAPABILITY_DOES_NOT_BLOCK_EXIT');
await capability(); const spreadPosition=await rangePosition();
await capability('1',{maxSpreadWad:0n}); await tick(px100);
await (await feed2.set(parseEther('100.1'),(await latestTimestamp())+1n)).wait();
await expectRevert(create('1'),'absolute quality spread tighter than unchanged exit deviation');
await (await trigger.connect(trader).closePosition(spreadPosition)).wait();
exitOnlyChecks.push('QUALITY_SPREAD_GATE_PRESERVES_EXIT_QUORUM');
await capability(); const skewPosition=await rangePosition();
await capability('1',{maxTimeSkew:0}); await tick(px100);
await (await feed2.set(px100,(await latestTimestamp())+1n)).wait();
await expectRevert(create('1'),'source timestamp skew prevents admission');
await (await trigger.connect(trader).closePosition(skewPosition)).wait();
exitOnlyChecks.push('QUALITY_TIMESTAMP_SKEW_GATE_PRESERVES_EXIT');
await capability(); const agePosition=await rangePosition();
await capability('1',{maxAge:1}); await tick(px100);
await eip1193.request({method:'evm_increaseTime',params:[5]}); await eip1193.request({method:'evm_mine',params:[]});
await expectRevert(create('1'),'admission age stricter than unchanged exit age');
await (await trigger.connect(trader).closePosition(agePosition)).wait();
exitOnlyChecks.push('QUALITY_AGE_GATE_PRESERVES_EXIT');
await capability(); const stalePosition=await rangePosition();
const beforeStale=await brain.principalOf(await trader.getAddress());
await tick(px100,(await latestTimestamp())-120n);
await expectRevert(trigger.connect(trader).closePosition(stalePosition),'exit never bypasses stale oracle');
assert.equal((await engine.positionSnapshot(stalePosition)).status,1n);
assert.equal(await brain.principalOf(await trader.getAddress()),beforeStale);
await tick(px100); await (await trigger.connect(trader).closePosition(stalePosition)).wait();
exitOnlyChecks.push('ORACLE_FAILURE_PRESERVES_PRINCIPAL_AND_POSITION');
// Beyond the reserved admission envelope, actual profit is owed, not clamped.
await capability(); const claimPosition=await rangePosition('100',100);
await tick(parseEther('200000'));
await (await trigger.connect(trader).closePosition(claimPosition)).wait();
const claimReceipt=await engine.settlementReceipt(claimPosition);
assert.equal(claimReceipt.rawPnl,parseEther('1999000000')); assert.equal(claimReceipt.settlementPrice,parseEther('200000'));
assert.ok(await brain.playerClaimable(await trader.getAddress())>0n);
const claimKey=await engine.positionKey(claimPosition),owedBefore=await brain.playerClaimable(await trader.getAddress());
await (await token.mint(await admin.getAddress(),parseEther('100'))).wait();
await (await token.approve(brain.target,parseEther('100'))).wait();
await (await brain.fundSettlementCapital(parseEther('100'))).wait();
await (await brain.claimSettlement(claimKey)).wait();
assert.equal(await brain.playerClaimable(await trader.getAddress()),owedBefore-parseEther('100'));
exitOnlyChecks.push('UNFUNDED_RANGE_PROFIT_PERSISTS_AS_PLAYER_CLAIMABLE');
console.log('[exit-only-oracle-capability] PASS: '+exitOnlyChecks.join(', '));
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
  canonicalCDetents: C_DETENTS.filter(c => c !== 0), canonicalLots: [1, 100], stressCases, realisticBoundaryCases, exitOnlyChecks,
  capitalAccounting: { fundedTestTokensOnly: true, reservedSettlementLiability: (await brain.reservedSettlementLiability()).toString(), playerClaims: (await brain.totalPlayerClaimable()).toString(), noOptimisticNetting: true, concurrentPlayers: 3, withdrawalsVerified: true }, deploymentReceipts, smokeReceipts,
  testnetDeployment: 'NOT_EXECUTED', mainnetExecution: 'NOT_AUTHORIZED_OR_EXECUTED',
  limitations: ['Mock token and feeds are local only.', 'No production oracle provenance or live-network deployment is certified.', 'Gas is measured local EVM gas, not a production gas-price estimate.']
}, null, 2) + '\n');
await eip1193.disconnect();
