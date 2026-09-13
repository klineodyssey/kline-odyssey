import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { Contract, id } from "ethers";
import { ETHER, artifact, cleanupProviders, deploy, setupLineage } from "./helpers.mjs";
import {
  START_ROUND,
  chainTimestamp,
  closeAtBoundary,
  createRound,
  deployFortuneFixture,
  resolveAtBoundary,
} from "./fortune-game.helpers.mjs";

afterEach(cleanupProviders);

async function deployRealHeart(context) {
  const implementation = await deploy("KGEN_TempleHeart_Upgradeable", context.owner);
  const compiled = artifact("KGEN_TempleHeart_Upgradeable");
  const initData = implementation.interface.encodeFunctionData("initialize", [
    await context.owner.getAddress(),
    await context.owner.getAddress(),
    await context.owner.getAddress(),
    await context.signers[4].getAddress(),
    await context.kgen.getAddress(),
    await context.owner.getAddress(),
    await context.kaios.getAddress(),
  ]);
  const proxy = await deploy("TestERC1967Proxy", context.owner, [await implementation.getAddress(), initData]);
  const heart = new Contract(await proxy.getAddress(), compiled.abi, context.owner);
  await (await heart.initializeV340(await context.registry.getAddress())).wait();
  return heart;
}

async function deployGameAgainstRealHeart() {
  const context = await setupLineage({ totalAccounts: 12 });
  const [owner, operator, upgrader] = context.signers;
  Object.assign(context, { owner, operator, upgrader });
  const heart = await deployRealHeart(context);
  const oracle = await deploy("MockAggregatorV3", owner, [8, "BTC / USD"]);
  const now = await chainTimestamp(context);
  await (await oracle.setRound(START_ROUND, 50_000n * 10n ** 8n, now, START_ROUND)).wait();
  const implementation = await deploy("KGEN_FortuneGame_Upgradeable", owner);
  const compiled = artifact("KGEN_FortuneGame_Upgradeable");
  const initData = implementation.interface.encodeFunctionData("initialize", [
    await owner.getAddress(),
    await operator.getAddress(),
    await upgrader.getAddress(),
    await heart.getAddress(),
    {
      oracle: await oracle.getAddress(),
      descriptionHash: id("BTC / USD"),
      decimals: 8,
      startMaxAge: 300,
      maxEndDelay: 120,
    },
    {
      betDuration: 100,
      resolveDelay: 50,
      payoutBps: 10_000,
      minBet: ETHER,
      maxBet: 10n * ETHER,
      roundRewardCap: 100n * ETHER,
      economicMode: 1,
    },
  ]);
  const proxy = await deploy("TestERC1967Proxy", owner, [await implementation.getAddress(), initData]);
  const game = new Contract(await proxy.getAddress(), compiled.abi, owner);
  await (await heart.setFortuneGame(await game.getAddress())).wait();
  Object.assign(context, { heart, oracle, implementation, proxy, game });
  return context;
}

test("HEART_1888_RETRY: rejected payout preserves entitlement, refill permits retry, then double claim fails", async () => {
  const context = await deployGameAgainstRealHeart();
  const player = context.signers[5];
  const { roundId } = await createRound(context);
  await (await context.game.connect(player).placeBet(roundId, 1, ETHER)).wait();
  await closeAtBoundary(context, roundId);
  await resolveAtBoundary(context, roundId, 51_000n * 10n ** 8n);
  assert.equal(await context.game.previewPayout(roundId, await player.getAddress()), ETHER);

  await (await context.kgen.transfer(await context.heart.getAddress(), 1_888n * ETHER)).wait();
  assert.equal(await context.heart.isHeartGameOperational(), true);
  await assert.rejects(context.game.connect(player).claim(roundId));
  assert.equal((await context.game.betInfo(roundId, await player.getAddress())).claimed, false);
  assert.equal(await context.kgen.balanceOf(await player.getAddress()), 0n);

  await (await context.kgen.transfer(await context.heart.getAddress(), ETHER)).wait();
  await (await context.game.connect(player).claim(roundId, { gasLimit: 700_000 })).wait();
  assert.equal((await context.game.betInfo(roundId, await player.getAddress())).claimed, true);
  assert.equal(await context.kgen.balanceOf(await player.getAddress()), ETHER);
  assert.equal(await context.kgen.balanceOf(await context.heart.getAddress()), 1_888n * ETHER);
  await assert.rejects(context.game.connect(player).claim(roundId));
});

test("Heart payout rejection and reentrancy both roll back claimed state", async () => {
  const context = await deployFortuneFixture();
  const player = context.signers[3];
  const { roundId } = await createRound(context);
  await (await context.game.connect(player).placeBet(roundId, 1, 100)).wait();
  await closeAtBoundary(context, roundId);
  await resolveAtBoundary(context, roundId, 51_000n * 10n ** 8n);

  await (await context.heart.setRejectPayout(true)).wait();
  await assert.rejects(context.game.connect(player).claim(roundId));
  assert.equal((await context.game.betInfo(roundId, await player.getAddress())).claimed, false);
  await (await context.heart.setRejectPayout(false)).wait();
  await (await context.heart.setReentry(true, roundId)).wait();
  await assert.rejects(context.game.connect(player).claim(roundId));
  assert.equal((await context.game.betInfo(roundId, await player.getAddress())).claimed, false);
  assert.equal(await context.heart.paid(await player.getAddress()), 0n);

  await (await context.heart.setReentry(false, roundId)).wait();
  // Bypass Ganache's stale estimate cache after the two intentional reverts;
  // the mined transaction still exercises the complete successful claim path.
  await (await context.game.connect(player).claim(roundId, { gasLimit: 700_000 })).wait();
  assert.equal((await context.game.betInfo(roundId, await player.getAddress())).claimed, true);
  assert.equal(await context.heart.paid(await player.getAddress()), 200n);
});

test("UUPS upgrade is upgrader-only and preserves active round and immutable bet storage", async () => {
  const context = await deployFortuneFixture();
  const player = context.signers[3];
  const attacker = context.signers[8];
  const { roundId, round } = await createRound(context);
  await (await context.game.connect(player).placeBet(roundId, 2, 321)).wait();
  const before = await context.game.betInfo(roundId, await player.getAddress());
  const replacement = await deploy("KGEN_FortuneGame_Upgradeable", context.owner);

  await assert.rejects(
    context.game.connect(attacker).upgradeToAndCall(await replacement.getAddress(), "0x"),
  );
  await (
    await context.game.connect(context.upgrader).upgradeToAndCall(await replacement.getAddress(), "0x")
  ).wait();
  const after = await context.game.betInfo(roundId, await player.getAddress());
  const roundAfter = await context.game.roundInfo(roundId);
  assert.equal(await context.game.version(), "1.0.0");
  assert.deepEqual(
    [after.exists, after.direction, after.amount, after.placedAt, after.placedBlock],
    [before.exists, before.direction, before.amount, before.placedAt, before.placedBlock],
  );
  assert.deepEqual(
    [roundAfter.status, roundAfter.startPrice, roundAfter.startOracleRoundId, roundAfter.payoutBps],
    [round.status, round.startPrice, round.startOracleRoundId, round.payoutBps],
  );
});
