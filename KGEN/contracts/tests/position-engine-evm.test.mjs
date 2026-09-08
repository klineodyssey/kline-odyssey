import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import solc from 'solc';
import ganache from 'ganache';
import { BrowserProvider, ContractFactory, Contract, parseEther } from 'ethers';

const enginePath = 'KGEN/contracts/KGEN_PositionEngine_V1_0_0.sol';
const kernelPath = 'KGEN/contracts/KGEN_MarketRiskKernel_V1_0_0.sol';
const harnessPath = 'KGEN/contracts/tests/PositionSettlementHarness.sol';
const harnessSource = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract MockBrainSettlement {
    struct Reservation {
        address user;
        uint256 amountWei;
        int256 realizedPnlWei;
        uint256 badDebtWei;
        bool active;
    }

    mapping(bytes32 => Reservation) public reservations;
    bool public failReserve;
    bool public failSettle;

    function setFailReserve(bool value) external { failReserve = value; }
    function setFailSettle(bool value) external { failSettle = value; }

    function reservePositionCollateral(bytes32 key, address user, uint256 amountWei) external {
        require(!failReserve, "MOCK_RESERVE_FAIL");
        require(!reservations[key].active && reservations[key].user == address(0), "MOCK_KEY_USED");
        reservations[key] = Reservation(user, amountWei, 0, 0, true);
    }

    function releasePositionCollateral(bytes32 key) external {
        require(reservations[key].active, "MOCK_NOT_ACTIVE");
        reservations[key].active = false;
    }

    function settlePositionCollateral(bytes32 key, int256 realizedPnlWei, uint256 badDebtWei) external {
        require(!failSettle, "MOCK_SETTLE_FAIL");
        require(reservations[key].active, "MOCK_NOT_ACTIVE");
        reservations[key].realizedPnlWei = realizedPnlWei;
        reservations[key].badDebtWei = badDebtWei;
        reservations[key].active = false;
    }
}

contract MockPriceFeed {
    uint8 public constant decimals = 18;
    int256 public answer;
    uint256 public updatedAt;
    uint80 public roundId = 1;
    uint80 public answeredInRound = 1;
    bool public shouldRevert;

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

    function setIncomplete(bool value) external {
        answeredInRound = value ? roundId - 1 : roundId;
    }

    function setShouldRevert(bool value) external { shouldRevert = value; }

    function latestRoundData()
        external
        view
        returns (uint80, int256, uint256, uint256, uint80)
    {
        require(!shouldRevert, "FEED_FAIL");
        return (roundId, answer, updatedAt, updatedAt, answeredInRound);
    }
}
`;

const sources = {
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

const artifact = output.contracts[enginePath].KGEN_PositionEngine_V1_0_0;
const mockArtifact = output.contracts[harnessPath].MockBrainSettlement;
const feedArtifact = output.contracts[harnessPath].MockPriceFeed;
assert.ok(artifact?.evm?.bytecode?.object, 'missing position engine bytecode');
assert.ok(mockArtifact?.evm?.bytecode?.object, 'missing mock settlement bytecode');
assert.ok(feedArtifact?.evm?.bytecode?.object, 'missing mock feed bytecode');
assert.ok(artifact.evm.deployedBytecode.object.length / 2 < 24_576, 'position engine exceeds EIP-170 runtime size');

const eip1193 = ganache.provider({ logging: { quiet: true }, wallet: { totalAccounts: 5 } });
const provider = new BrowserProvider(eip1193);
const [admin, executor, trader, stranger] = await Promise.all([0,1,2,3].map((i) => provider.getSigner(i)));

async function deploy(compiled, signer, args = []) {
  const factory = new ContractFactory(compiled.abi, `0x${compiled.evm.bytecode.object}`, signer);
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

const mockBrain = await deploy(mockArtifact, admin);
const now = await latestTimestamp();
const feed0 = await deploy(feedArtifact, admin, [parseEther('100'), now]);
const feed1 = await deploy(feedArtifact, admin, [parseEther('100'), now]);
const feed2 = await deploy(feedArtifact, admin, [parseEther('101'), now]);
const deployed = await deploy(artifact, admin, [await admin.getAddress(), await executor.getAddress(), mockBrain.target]);
const engine = new Contract(deployed.target, artifact.abi, admin);

const feeds = [feed0.target, feed1.target, feed2.target];
const px50 = parseEther('50');
const px80 = parseEther('80');
const px100 = parseEther('100');
const px110 = parseEther('110');
const px120 = parseEther('120');
const px150 = parseEther('150');
const size1 = parseEther('1');

async function setFeeds(a, b, c, timestamp = null) {
  const ts = timestamp ?? await latestTimestamp();
  await (await feed0.set(a, ts)).wait();
  await (await feed1.set(b, ts)).wait();
  await (await feed2.set(c, ts)).wait();
}

for (const market of [0, 1, 2]) {
  await (await engine.configureMarket(market, 2000, 500, 60, px50, px150, true)).wait();
  await (await engine.configureOracle(market, feeds, 2, 500)).wait();
}

// The executor cannot manufacture price/timestamp calldata; quorum price is on-chain.
const read100 = await engine.readMarketPrice(0);
assert.equal(read100[0], px100);
assert.equal(read100[2], 3n);

await expectRevert(
  engine.connect(stranger).openPosition(await trader.getAddress(), 0, size1, parseEther('20')),
  'unauthorized open'
);
await expectRevert(
  engine.connect(executor).openPosition(await trader.getAddress(), 0, size1, parseEther('19')),
  'initial margin floor from quorum price'
);

// Brain reserve failure rolls back the entire open, including id allocation.
await (await mockBrain.setFailReserve(true)).wait();
await expectRevert(
  engine.connect(executor).openPosition(await trader.getAddress(), 0, size1, parseEther('20')),
  'Brain reserve failure is atomic'
);
assert.equal(await engine.nextPositionId(), 1n);
await (await mockBrain.setFailReserve(false)).wait();
await (await engine.connect(executor).openPosition(
  await trader.getAddress(), 0, size1, parseEther('20'), { gasLimit: 1_500_000 }
)).wait();
const longId = 1n;
const longKey = await engine.positionKey(longId);
let reservation = await mockBrain.reservations(longKey);
assert.equal(reservation.user, await trader.getAddress());
assert.equal(reservation.amountWei, parseEther('20'));
assert.equal(reservation.active, true);

let p = await engine.positions(longId);
assert.equal(p.entryPriceWad, px100);
assert.equal(p.status, 1n);

// Median quorum at 110: long +10, healthy.
await setFeeds(px110, px110, parseEther('111'));
let mark = await engine.markPosition(longId);
assert.equal(mark[0], parseEther('10'));
assert.equal(mark[1], parseEther('30'));
assert.equal(mark[2], parseEther('5.5'));
assert.equal(mark[3], false);

// Two stale/incomplete sources cannot satisfy the 2-source quorum.
const staleTs = (await latestTimestamp()) - 120n;
await setFeeds(px110, px110, px110, staleTs);
await expectRevert(engine.markPosition(longId), 'stale quorum fails closed');
await setFeeds(px110, px110, px110);
await (await feed0.setIncomplete(true)).wait();
await (await feed1.setIncomplete(true)).wait();
await expectRevert(engine.markPosition(longId), 'incomplete rounds fail quorum');
await (await feed0.setIncomplete(false)).wait();
await (await feed1.setIncomplete(false)).wait();

// Even with three individually-valid feeds, excessive disagreement fails closed.
await setFeeds(px100, px100, px150);
await expectRevert(engine.readMarketPrice(0), 'oracle disagreement exceeds configured deviation');

// One feed may fail while two authenticated feeds agree: 2-of-3 quorum survives.
await setFeeds(px120, px120, px120);
await (await feed2.setShouldRevert(true)).wait();
const read120 = await engine.readMarketPrice(0);
assert.equal(read120[0], px120);
assert.equal(read120[2], 2n);
await (await feed2.setShouldRevert(false)).wait();

// Profitable close and Brain accounting happen atomically at quorum price 120.
await (await engine.connect(executor).closePosition(longId)).wait();
p = await engine.positions(longId);
assert.equal(p.status, 2n);
assert.equal(p.rawPnlWad, parseEther('20'));
assert.equal(p.realizedPnlWad, parseEther('20'));
assert.equal(p.badDebtWad, 0n);
reservation = await mockBrain.reservations(longKey);
assert.equal(reservation.active, false);
assert.equal(reservation.realizedPnlWei, parseEther('20'));
assert.equal(reservation.badDebtWei, 0n);
await expectRevert(engine.connect(executor).closePosition(longId), 'double close');

// KY short opens at 100 and liquidates at 120, loss exactly equals collateral.
await setFeeds(px100, px100, px100);
await (await engine.connect(executor).openPosition(await trader.getAddress(), 1, -size1, parseEther('20'))).wait();
const shortId = 2n;
const shortKey = await engine.positionKey(shortId);
await setFeeds(px120, px120, px120);
mark = await engine.markPosition(shortId);
assert.equal(mark[0], -parseEther('20'));
assert.equal(mark[1], 0n);
assert.equal(mark[3], true);
await (await engine.connect(executor).liquidatePosition(shortId)).wait();
p = await engine.positions(shortId);
assert.equal(p.status, 3n);
assert.equal(p.rawPnlWad, -parseEther('20'));
assert.equal(p.realizedPnlWad, -parseEther('20'));
assert.equal(p.badDebtWad, 0n);
reservation = await mockBrain.reservations(shortKey);
assert.equal(reservation.realizedPnlWei, -parseEther('20'));
assert.equal(reservation.badDebtWei, 0n);

// KZ remains a real independent market enum/config, not another world/runtime.
await setFeeds(px80, px80, px80);
await (await engine.connect(executor).openPosition(await trader.getAddress(), 2, size1, parseEther('20'))).wait();
const kz = await engine.positions(3n);
assert.equal(kz.market, 2n);
assert.equal(kz.entryPriceWad, px80);

// Gap risk: short 100->150 has raw -50, isolated realized -20, explicit bad debt 30.
await setFeeds(px100, px100, px100);
await (await engine.connect(executor).openPosition(await trader.getAddress(), 0, -size1, parseEther('20'))).wait();
const gapId = 4n;
const gapKey = await engine.positionKey(gapId);
await setFeeds(px150, px150, px150);
mark = await engine.markPosition(gapId);
assert.equal(mark[3], true);
await (await engine.connect(executor).liquidatePosition(gapId)).wait();
p = await engine.positions(gapId);
assert.equal(p.rawPnlWad, -parseEther('50'));
assert.equal(p.realizedPnlWad, -parseEther('20'));
assert.equal(p.badDebtWad, parseEther('30'));
assert.equal(p.status, 3n);
reservation = await mockBrain.reservations(gapKey);
assert.equal(reservation.realizedPnlWei, -parseEther('20'));
assert.equal(reservation.badDebtWei, parseEther('30'));

// If Brain rejects settlement, position and reservation remain open atomically.
await setFeeds(px100, px100, px100);
await (await engine.connect(executor).openPosition(await trader.getAddress(), 2, size1, parseEther('20'))).wait();
const rollbackId = 5n;
const rollbackKey = await engine.positionKey(rollbackId);
await setFeeds(px110, px110, px110);
await (await mockBrain.setFailSettle(true)).wait();
await expectRevert(engine.connect(executor).closePosition(rollbackId), 'Brain settlement failure rolls back close');
p = await engine.positions(rollbackId);
assert.equal(p.status, 1n);
assert.equal(p.exitPriceWad, 0n);
assert.equal(p.realizedPnlWad, 0n);
reservation = await mockBrain.reservations(rollbackKey);
assert.equal(reservation.active, true);
assert.equal(reservation.realizedPnlWei, 0n);
await (await mockBrain.setFailSettle(false)).wait();
await (await engine.connect(executor).closePosition(rollbackId, { gasLimit: 1_500_000 })).wait();
p = await engine.positions(rollbackId);
assert.equal(p.status, 2n);
reservation = await mockBrain.reservations(rollbackKey);
assert.equal(reservation.active, false);
assert.equal(reservation.realizedPnlWei, parseEther('10'));

console.log('[position-engine-evm] PASS: authenticated 2-of-3 oracle quorum, freshness/round/deviation gates, KX/KY/KZ risk, atomic Brain settlement, bad debt');
