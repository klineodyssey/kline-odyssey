import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { id } from "ethers";
import { artifact, cleanupProviders, deploy, eventArgs } from "./helpers.mjs";
import {
  PHASE_ONE,
  START_ROUND,
  chainTimestamp,
  closeAtBoundary,
  createRound,
  deployFortuneFixture,
  publishDeterministicEnd,
  resolveAtBoundary,
  setTimestamp,
} from "./fortune-game.helpers.mjs";

afterEach(cleanupProviders);

test("TIME_ARROW_IMMUTABILITY: a successful one-wallet bet is atomic and never changes", async () => {
  const context = await deployFortuneFixture();
  const player = context.signers[3];
  const { roundId } = await createRound(context);
  const receipt = await (await context.game.connect(player).placeBet(roundId, 1, 100)).wait();
  const event = eventArgs(receipt, context.game, "BetPlaced");
  const original = await context.game.betInfo(roundId, await player.getAddress());

  assert.equal(event.roundId, roundId);
  assert.equal(event.player, await player.getAddress());
  assert.equal(original.exists, true);
  assert.equal(original.direction, 1n);
  assert.equal(original.amount, 100n);
  assert.ok(original.placedAt > 0n);
  assert.ok(original.placedBlock > 0n);
  await assert.rejects(context.game.connect(player).placeBet(roundId, 2, 200));

  await closeAtBoundary(context, roundId);
  await resolveAtBoundary(context, roundId, 50_100n * 10n ** 8n);
  const finalized = await context.game.betInfo(roundId, await player.getAddress());
  assert.deepEqual(
    [finalized.exists, finalized.direction, finalized.amount, finalized.placedAt, finalized.placedBlock],
    [original.exists, original.direction, original.amount, original.placedAt, original.placedBlock],
  );
  assert.equal((await context.game.roundInfo(roundId)).result, 1n);
  await assert.rejects(context.game.resolveRound(roundId, START_ROUND + 2n));
});

test("close and resolve boundaries reject late betting and a known result cannot create a late position", async () => {
  const context = await deployFortuneFixture();
  const player = context.signers[3];
  const latePlayer = context.signers[4];
  const { roundId, round } = await createRound(context);
  await (await context.game.connect(player).placeBet(roundId, 1, 25)).wait();

  await setTimestamp(context, Number(round.betCloseAt));
  await assert.rejects(context.game.connect(latePlayer).placeBet(roundId, 2, 25));
  assert.equal((await context.game.betInfo(roundId, await latePlayer.getAddress())).exists, false);
  await (await context.game.closeRound(roundId)).wait();
  await assert.rejects(context.game.resolveRound(roundId, START_ROUND + 2n));

  await setTimestamp(context, Number(round.resolveAt));
  const proof = await publishDeterministicEnd(context, round, 49_000n * 10n ** 8n);
  await assert.rejects(context.game.connect(latePlayer).placeBet(roundId, 2, 25));
  await (await context.game.resolveRound(roundId, proof.candidateId)).wait();
  await assert.rejects(context.game.connect(latePlayer).placeBet(roundId, 2, 25));
  assert.equal((await context.game.betInfo(roundId, await latePlayer.getAddress())).exists, false);
});

for (const scenario of [
  { name: "UP", answer: 50_001n * 10n ** 8n, result: 1n, winnerDirection: 1 },
  { name: "DOWN", answer: 49_999n * 10n ** 8n, result: 2n, winnerDirection: 2 },
  { name: "DRAW", answer: 50_000n * 10n ** 8n, result: 3n, winnerDirection: 0 },
]) {
  test(`${scenario.name} resolves only from the deterministic future oracle snapshot`, async () => {
    const context = await deployFortuneFixture();
    const up = context.signers[3];
    const down = context.signers[4];
    const { roundId } = await createRound(context);
    await (await context.game.connect(up).placeBet(roundId, 1, 100)).wait();
    await (await context.game.connect(down).placeBet(roundId, 2, 250)).wait();
    await closeAtBoundary(context, roundId);
    const resolved = await resolveAtBoundary(context, roundId, scenario.answer);

    assert.equal(resolved.result, scenario.result);
    assert.equal(resolved.totalUp, 100n);
    assert.equal(resolved.totalDown, 250n);
    assert.ok(resolved.endOracleUpdatedAt > resolved.betCloseAt);
    assert.ok(resolved.endOracleUpdatedAt >= resolved.resolveAt);
    if (scenario.winnerDirection === 0) {
      assert.equal(await context.game.previewPayout(roundId, await up.getAddress()), 0n);
      assert.equal(await context.game.previewPayout(roundId, await down.getAddress()), 0n);
      await assert.rejects(context.game.connect(up).claim(roundId));
    } else {
      const winner = scenario.winnerDirection === 1 ? up : down;
      const loser = scenario.winnerDirection === 1 ? down : up;
      assert.ok((await context.game.previewPayout(roundId, await winner.getAddress())) > 0n);
      assert.equal(await context.game.previewPayout(roundId, await loser.getAddress()), 0n);
    }
  });
}

test("oracle validation rejects invalid, favorable-history, future, and stale round proofs", async () => {
  const context = await deployFortuneFixture();
  const { roundId, round } = await createRound(context);
  await closeAtBoundary(context, roundId);
  await setTimestamp(context, Number(round.resolveAt));

  const invalidId = START_ROUND + 1n;
  await (await context.oracle.setRound(invalidId, 0, Number(round.resolveAt), invalidId)).wait();
  await assert.rejects(context.game.resolveRound(roundId, invalidId));

  const skippedPredecessor = START_ROUND + 3n;
  const favorable = START_ROUND + 4n;
  await (await context.oracle.setRound(skippedPredecessor, 51_000n * 10n ** 8n, Number(round.resolveAt) + 1, skippedPredecessor)).wait();
  await (await context.oracle.setRound(favorable, 52_000n * 10n ** 8n, Number(round.resolveAt) + 2, favorable)).wait();
  await setTimestamp(context, Number(round.resolveAt) + 2);
  await assert.rejects(context.game.resolveRound(roundId, favorable));

  const predecessor = START_ROUND + 5n;
  const futureCandidate = START_ROUND + 6n;
  await (await context.oracle.setRound(predecessor, 50_000n * 10n ** 8n, Number(round.resolveAt) - 1, predecessor)).wait();
  await (await context.oracle.setRound(futureCandidate, 52_000n * 10n ** 8n, Number(round.resolveAt) + 10, futureCandidate)).wait();
  await assert.rejects(context.game.resolveRound(roundId, futureCandidate));

  const stalePredecessor = START_ROUND + 7n;
  const staleCandidate = START_ROUND + 8n;
  await (await context.oracle.setRound(stalePredecessor, 50_000n * 10n ** 8n, Number(round.resolveAt) - 1, stalePredecessor)).wait();
  await (await context.oracle.setRound(staleCandidate, 52_000n * 10n ** 8n, Number(round.resolveAt) + 121, staleCandidate)).wait();
  await setTimestamp(context, Number(round.resolveAt) + 121);
  await assert.rejects(context.game.resolveRound(roundId, staleCandidate));
});

test("CANCELLED is whole-round, requires objective stale evidence, and preserves every position", async () => {
  const context = await deployFortuneFixture();
  const up = context.signers[3];
  const down = context.signers[4];
  const { roundId, round } = await createRound(context);
  await (await context.game.connect(up).placeBet(roundId, 1, 100)).wait();
  await (await context.game.connect(down).placeBet(roundId, 2, 200)).wait();
  const upBefore = await context.game.betInfo(roundId, await up.getAddress());
  const downBefore = await context.game.betInfo(roundId, await down.getAddress());
  await closeAtBoundary(context, roundId);

  const predecessor = START_ROUND + 1n;
  const staleCandidate = START_ROUND + 2n;
  await setTimestamp(context, Number(round.resolveAt) + 121);
  await (await context.oracle.setRound(predecessor, 50_000n * 10n ** 8n, Number(round.resolveAt) - 1, predecessor)).wait();
  await (await context.oracle.setRound(staleCandidate, 51_000n * 10n ** 8n, Number(round.resolveAt) + 121, staleCandidate)).wait();
  await assert.rejects(context.game.cancelRound(roundId, predecessor));
  await (await context.game.connect(context.signers[8]).cancelRound(roundId, staleCandidate)).wait();

  const cancelled = await context.game.roundInfo(roundId);
  assert.equal(cancelled.status, 5n);
  assert.equal(cancelled.result, 4n);
  assert.equal(cancelled.cancelReason, 2n);
  const upAfter = await context.game.betInfo(roundId, await up.getAddress());
  const downAfter = await context.game.betInfo(roundId, await down.getAddress());
  assert.deepEqual([upAfter.exists, upAfter.direction, upAfter.amount], [upBefore.exists, upBefore.direction, upBefore.amount]);
  assert.deepEqual([downAfter.exists, downAfter.direction, downAfter.amount], [downBefore.exists, downBefore.direction, downBefore.amount]);
  await assert.rejects(context.game.connect(up).claim(roundId));
  await assert.rejects(context.game.cancelRound(roundId, staleCandidate));

  const functionNames = artifact("KGEN_FortuneGame_Upgradeable").abi
    .filter((entry) => entry.type === "function")
    .map((entry) => entry.name.toLowerCase());
  for (const forbidden of ["cancelbet", "deletebet", "changebet", "increasebet", "decreasebet", "voidposition"]) {
    assert.equal(functionNames.includes(forbidden), false);
  }
});

test("unavailable oracle cancellation is permissionless but impossible while the feed responds", async () => {
  const context = await deployFortuneFixture();
  const { roundId, round } = await createRound(context);
  await closeAtBoundary(context, roundId);
  await setTimestamp(context, Number(round.resolveAt) + 121);
  await assert.rejects(context.game.cancelRoundForUnavailableOracle(roundId));
  await (await context.oracle.setUnavailable(true)).wait();
  await (await context.game.connect(context.signers[7]).cancelRoundForUnavailableOracle(roundId)).wait();
  assert.equal((await context.game.roundInfo(roundId)).cancelReason, 1n);
});

test("unauthorized configuration fails, pause blocks new bets, and future config cannot mutate a round snapshot", async () => {
  const context = await deployFortuneFixture();
  const attacker = context.signers[7];
  const { roundId, round } = await createRound(context);
  const nextConfig = {
    betDuration: 200,
    resolveDelay: 80,
    payoutBps: 15_000,
    minBet: 5,
    maxBet: 500,
    roundRewardCap: 20_000,
    economicMode: 1,
  };
  await assert.rejects(context.game.connect(attacker).setGameConfig(nextConfig));
  await assert.rejects(context.game.connect(attacker).pause());
  await (await context.game.connect(context.operator).setGameConfig(nextConfig)).wait();
  const replacementOracle = await deploy("MockAggregatorV3", context.owner, [8, "BTC / USD"]);
  const replacementStart = PHASE_ONE + 100n;
  const now = await chainTimestamp(context);
  await (await replacementOracle.setRound(replacementStart, 60_000n * 10n ** 8n, now, replacementStart)).wait();
  await (await context.game.connect(context.operator).setOracleConfig({
    ...context.oracleConfig,
    oracle: await replacementOracle.getAddress(),
  })).wait();
  const unchanged = await context.game.roundInfo(roundId);
  assert.equal(unchanged.payoutBps, round.payoutBps);
  assert.equal(unchanged.minBet, round.minBet);
  assert.equal(unchanged.maxBet, round.maxBet);
  assert.equal(unchanged.roundRewardCap, round.roundRewardCap);
  assert.equal(unchanged.betCloseAt, round.betCloseAt);
  assert.equal(unchanged.oracle, round.oracle);
  assert.equal(unchanged.startMaxAge, round.startMaxAge);
  assert.equal(unchanged.maxEndDelay, round.maxEndDelay);

  await (await context.game.connect(context.operator).pause()).wait();
  await assert.rejects(context.game.connect(context.signers[3]).placeBet(roundId, 1, 100));
  await (await context.game.connect(context.operator).unpause()).wait();
  await (await context.game.connect(context.signers[3]).placeBet(roundId, 1, 100)).wait();
});

test("oracle config validates description, decimals, code, latest answer, and freshness", async () => {
  const context = await deployFortuneFixture();
  const now = await chainTimestamp(context);
  await assert.rejects(context.game.connect(context.operator).setOracleConfig({
    oracle: await context.signers[11].getAddress(),
    descriptionHash: id("BTC / USD"),
    decimals: 8,
    startMaxAge: 300,
    maxEndDelay: 120,
  }));
  const wrongDescription = await deploy("MockAggregatorV3", context.owner, [8, "ETH / USD"]);
  await (await wrongDescription.setRound(START_ROUND, 3_000n * 10n ** 8n, now, START_ROUND)).wait();
  await assert.rejects(context.game.connect(context.operator).setOracleConfig({
    ...context.oracleConfig,
    oracle: await wrongDescription.getAddress(),
  }));
  const wrongDecimals = await deploy("MockAggregatorV3", context.owner, [18, "BTC / USD"]);
  await (await wrongDecimals.setRound(START_ROUND, 50_000n * 10n ** 18n, now, START_ROUND)).wait();
  await assert.rejects(context.game.connect(context.operator).setOracleConfig({
    ...context.oracleConfig,
    oracle: await wrongDecimals.getAddress(),
  }));
  await (await context.oracle.setRound(START_ROUND + 1n, 50_000n * 10n ** 8n, now - 301, START_ROUND + 1n)).wait();
  await assert.rejects(context.game.connect(context.operator).setOracleConfig(context.oracleConfig));
  await (await context.oracle.setRound(START_ROUND + 2n, -1, now, START_ROUND + 2n)).wait();
  await assert.rejects(context.game.connect(context.operator).setOracleConfig(context.oracleConfig));
  await (await context.oracle.setRound(START_ROUND + 3n, 50_000n * 10n ** 8n, now, START_ROUND + 2n)).wait();
  await assert.rejects(context.game.connect(context.operator).setOracleConfig(context.oracleConfig));
});

test("a finalized Oracle end round cannot be reused as a later Round result", async () => {
  const context = await deployFortuneFixture();
  const first = await createRound(context);
  await (await context.game.connect(context.signers[3]).placeBet(first.roundId, 1, 10)).wait();
  await closeAtBoundary(context, first.roundId);
  const firstFinal = await resolveAtBoundary(context, first.roundId, 51_000n * 10n ** 8n);

  const second = await createRound(context);
  assert.equal(second.round.startOracleRoundId, firstFinal.endOracleRoundId);
  await (await context.game.connect(context.signers[4]).placeBet(second.roundId, 2, 10)).wait();
  await closeAtBoundary(context, second.roundId);
  await setTimestamp(context, Number(second.round.resolveAt));
  await assert.rejects(context.game.resolveRound(second.roundId, firstFinal.endOracleRoundId));
  assert.equal((await context.game.betInfo(second.roundId, await context.signers[4].getAddress())).exists, true);
});

test("reward cap is enforced independently on each fixed-payout side", async () => {
  const context = await deployFortuneFixture({
    gameConfig: {
      betDuration: 100,
      resolveDelay: 50,
      payoutBps: 20_000,
      minBet: 1,
      maxBet: 500,
      roundRewardCap: 1_000,
      economicMode: 1,
    },
  });
  const { roundId } = await createRound(context);
  await (await context.game.connect(context.signers[3]).placeBet(roundId, 1, 300)).wait();
  await assert.rejects(context.game.connect(context.signers[4]).placeBet(roundId, 1, 300));
  await (await context.game.connect(context.signers[4]).placeBet(roundId, 2, 500)).wait();
  const round = await context.game.roundInfo(roundId);
  assert.equal(round.upRewardLiability, 600n);
  assert.equal(round.downRewardLiability, 1_000n);
});

test("phase transition cancellation proves the old phase ended before resolve and cannot hide an old-phase result", async () => {
  const context = await deployFortuneFixture();
  const { roundId, round } = await createRound(context);
  await (await context.game.connect(context.signers[3]).placeBet(roundId, 1, 10)).wait();
  await closeAtBoundary(context, roundId);
  const phaseTwoFirst = (2n << 64n) + 1n;
  await setTimestamp(context, Number(round.resolveAt));
  await (await context.oracle.setRound(phaseTwoFirst, 51_000n * 10n ** 8n, Number(round.resolveAt), phaseTwoFirst)).wait();
  await assert.rejects(context.game.resolveRound(roundId, phaseTwoFirst));
  await setTimestamp(context, Number(round.resolveAt) + 121);
  await assert.rejects(context.game.cancelRound(roundId, phaseTwoFirst));
  await (await context.game.cancelRoundForPhaseTransition(roundId, START_ROUND, phaseTwoFirst)).wait();
  assert.equal((await context.game.roundInfo(roundId)).cancelReason, 3n);
});

test("phase transition cannot cancel when an old-phase end result exists", async () => {
  const context = await deployFortuneFixture();
  const { roundId, round } = await createRound(context);
  await (await context.game.connect(context.signers[3]).placeBet(roundId, 1, 10)).wait();
  await closeAtBoundary(context, roundId);
  await setTimestamp(context, Number(round.resolveAt));
  const oldCandidate = START_ROUND + 1n;
  await (await context.oracle.setRound(oldCandidate, 49_000n * 10n ** 8n, Number(round.resolveAt), oldCandidate)).wait();
  const phaseTwoFirst = (2n << 64n) + 1n;
  await (await context.oracle.setRound(phaseTwoFirst, 51_000n * 10n ** 8n, Number(round.resolveAt) + 1, phaseTwoFirst)).wait();
  await setTimestamp(context, Number(round.resolveAt) + 121);
  await assert.rejects(context.game.cancelRoundForPhaseTransition(roundId, START_ROUND, phaseTwoFirst));
  assert.equal((await context.game.roundInfo(roundId)).status, 3n);
});
