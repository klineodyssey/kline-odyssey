import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { cleanupProviders } from "./helpers.mjs";
import {
  START_ROUND,
  closeAtBoundary,
  createRound,
  deployFortuneFixture,
  resolveAtBoundary,
} from "./fortune-game.helpers.mjs";

afterEach(cleanupProviders);

function nextSeed(seed) {
  return (seed * 1_664_525 + 1_013_904_223) >>> 0;
}

test("fuzz: successful credit amounts produce immutable one-position records", async () => {
  const context = await deployFortuneFixture();
  const { roundId } = await createRound(context);
  let seed = 0x1234_abcd;
  const snapshots = [];

  for (let index = 3; index < 11; index += 1) {
    seed = nextSeed(seed);
    const amount = BigInt((seed % 400) + 1);
    const direction = (seed & 1) === 0 ? 1 : 2;
    const player = context.signers[index];
    await (await context.game.connect(player).placeBet(roundId, direction, amount)).wait();
    const bet = await context.game.betInfo(roundId, await player.getAddress());
    snapshots.push({ player, bet });
    await assert.rejects(context.game.connect(player).placeBet(roundId, direction === 1 ? 2 : 1, amount + 1n));
  }

  await closeAtBoundary(context, roundId);
  await resolveAtBoundary(context, roundId, 51_000n * 10n ** 8n);
  for (const snapshot of snapshots) {
    const after = await context.game.betInfo(roundId, await snapshot.player.getAddress());
    assert.deepEqual(
      [after.exists, after.direction, after.amount, after.placedAt, after.placedBlock],
      [snapshot.bet.exists, snapshot.bet.direction, snapshot.bet.amount, snapshot.bet.placedAt, snapshot.bet.placedBlock],
    );
  }
});

test("invariant: total payable rewards never exceed the snapshotted winning-side cap", async () => {
  const context = await deployFortuneFixture({
    gameConfig: {
      betDuration: 100,
      resolveDelay: 50,
      payoutBps: 17_500,
      minBet: 1,
      maxBet: 500,
      roundRewardCap: 4_000,
      economicMode: 1,
    },
  });
  const { roundId } = await createRound(context);
  let seed = 0x0bad_c0de;
  const players = [];
  for (let index = 3; index < 11; index += 1) {
    seed = nextSeed(seed);
    const direction = (seed & 1) === 0 ? 1 : 2;
    const amount = BigInt((seed % 180) + 1);
    const player = context.signers[index];
    await (await context.game.connect(player).placeBet(roundId, direction, amount)).wait();
    players.push(player);
  }
  await closeAtBoundary(context, roundId);
  const round = await resolveAtBoundary(context, roundId, 49_000n * 10n ** 8n);
  let totalPreview = 0n;
  for (const player of players) {
    totalPreview += await context.game.previewPayout(roundId, await player.getAddress());
  }
  assert.equal(totalPreview, round.downRewardLiability);
  assert.ok(totalPreview <= round.roundRewardCap);
  assert.ok(round.upRewardLiability <= round.roundRewardCap);
  assert.ok(round.downRewardLiability <= round.roundRewardCap);
});

test("invariant: final result, past bet existence, and round configuration cannot change", async () => {
  const context = await deployFortuneFixture();
  const player = context.signers[3];
  const absentPlayer = context.signers[4];
  const { roundId } = await createRound(context);
  await (await context.game.connect(player).placeBet(roundId, 2, 333)).wait();
  const betBefore = await context.game.betInfo(roundId, await player.getAddress());
  await closeAtBoundary(context, roundId);
  const finalRound = await resolveAtBoundary(context, roundId, 49_000n * 10n ** 8n);

  await assert.rejects(context.game.resolveRound(roundId, START_ROUND + 2n));
  await assert.rejects(context.game.cancelRound(roundId, START_ROUND + 2n));
  await (await context.game.connect(context.operator).setGameConfig({
    betDuration: 999,
    resolveDelay: 999,
    payoutBps: 12_345,
    minBet: 9,
    maxBet: 999,
    roundRewardCap: 99_999,
    economicMode: 1,
  })).wait();

  const afterRound = await context.game.roundInfo(roundId);
  const betAfter = await context.game.betInfo(roundId, await player.getAddress());
  const absentAfter = await context.game.betInfo(roundId, await absentPlayer.getAddress());
  assert.deepEqual(
    [afterRound.status, afterRound.result, afterRound.endPrice, afterRound.endOracleRoundId, afterRound.resolvedAt],
    [finalRound.status, finalRound.result, finalRound.endPrice, finalRound.endOracleRoundId, finalRound.resolvedAt],
  );
  assert.deepEqual(
    [afterRound.payoutBps, afterRound.minBet, afterRound.maxBet, afterRound.roundRewardCap],
    [finalRound.payoutBps, finalRound.minBet, finalRound.maxBet, finalRound.roundRewardCap],
  );
  assert.deepEqual(
    [betAfter.exists, betAfter.direction, betAfter.amount, betAfter.placedAt, betAfter.placedBlock],
    [betBefore.exists, betBefore.direction, betBefore.amount, betBefore.placedAt, betBefore.placedBlock],
  );
  assert.equal(absentAfter.exists, false);
});
