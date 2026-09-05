import { Contract, id } from "ethers";
import { artifact, deploy, setupChain } from "./helpers.mjs";

export const PHASE_ONE = 1n << 64n;
export const START_ROUND = PHASE_ONE + 10n;
export const DEFAULT_GAME_CONFIG = {
  betDuration: 100,
  resolveDelay: 50,
  payoutBps: 20_000,
  minBet: 1,
  maxBet: 1_000,
  roundRewardCap: 10_000,
  economicMode: 1,
};

export async function chainTimestamp(context) {
  const block = await context.eip1193.request({ method: "eth_getBlockByNumber", params: ["latest", false] });
  return Number.parseInt(block.timestamp, 16);
}

export async function setTimestamp(context, timestamp) {
  await context.eip1193.request({ method: "evm_setTime", params: [timestamp * 1_000] });
  await context.eip1193.request({ method: "evm_mine", params: [] });
}

export async function deployFortuneFixture({ gameConfig = DEFAULT_GAME_CONFIG } = {}) {
  const context = await setupChain({ totalAccounts: 12 });
  const [owner, operator, upgrader] = context.signers;
  Object.assign(context, { owner, operator, upgrader });
  const oracle = await deploy("MockAggregatorV3", owner, [8, "BTC / USD"]);
  const heart = await deploy("MockTempleHeartGame", owner);
  const now = await chainTimestamp(context);
  await (await oracle.setRound(START_ROUND, 50_000n * 10n ** 8n, now, START_ROUND)).wait();

  const implementation = await deploy("KGEN_FortuneGame_Upgradeable", owner);
  const compiled = artifact("KGEN_FortuneGame_Upgradeable");
  const oracleConfig = {
    oracle: await oracle.getAddress(),
    descriptionHash: id("BTC / USD"),
    decimals: 8,
    startMaxAge: 300,
    maxEndDelay: 120,
  };
  const initData = implementation.interface.encodeFunctionData("initialize", [
    await owner.getAddress(),
    await operator.getAddress(),
    await upgrader.getAddress(),
    await heart.getAddress(),
    oracleConfig,
    gameConfig,
  ]);
  const proxy = await deploy("TestERC1967Proxy", owner, [await implementation.getAddress(), initData]);
  const game = new Contract(await proxy.getAddress(), compiled.abi, owner);
  Object.assign(context, { oracle, heart, implementation, proxy, game, oracleConfig, gameConfig });
  return context;
}

export async function createRound(context) {
  await (await context.game.connect(context.operator).createRound()).wait();
  const roundId = await context.game.currentRoundId();
  const round = await context.game.roundInfo(roundId);
  return { roundId, round };
}

export async function closeAtBoundary(context, roundId) {
  const round = await context.game.roundInfo(roundId);
  await setTimestamp(context, Number(round.betCloseAt));
  await (await context.game.closeRound(roundId)).wait();
  return context.game.roundInfo(roundId);
}

export async function publishDeterministicEnd(context, round, answer, options = {}) {
  const predecessorId = options.predecessorId ?? START_ROUND + 1n;
  const candidateId = options.candidateId ?? START_ROUND + 2n;
  const predecessorAt = options.predecessorAt ?? Number(round.resolveAt) - 1;
  const candidateAt = options.candidateAt ?? Number(round.resolveAt);
  await (await context.oracle.setRound(predecessorId, 50_000n * 10n ** 8n, predecessorAt, predecessorId)).wait();
  await (await context.oracle.setRound(candidateId, answer, candidateAt, candidateId)).wait();
  return { predecessorId, candidateId, predecessorAt, candidateAt };
}

export async function resolveAtBoundary(context, roundId, answer) {
  const round = await context.game.roundInfo(roundId);
  await setTimestamp(context, Number(round.resolveAt));
  const proof = await publishDeterministicEnd(context, round, answer);
  await (await context.game.resolveRound(roundId, proof.candidateId)).wait();
  return context.game.roundInfo(roundId);
}
