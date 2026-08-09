import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  Contract,
  ContractFactory,
  Interface,
  JsonRpcProvider,
  NonceManager,
  Wallet,
  ZeroHash,
  formatEther,
  formatUnits,
  getAddress,
  id,
  parseEther,
  parseUnits,
} from "ethers";

const root = path.resolve(import.meta.dirname, "..");
const reportsDir = path.join(root, "reports");
const jsonEvidencePath = path.join(reportsDir, "BSC_TESTNET_FORTUNE_GAME_V1_REHEARSAL.json");
const markdownEvidencePath = path.join(reportsDir, "BSC_TESTNET_FORTUNE_GAME_V1_REHEARSAL.md");
const handoffPath = path.resolve(root, "..", "KGEN", "docs", "KGEN_FORTUNE_GAME_FRONTEND_HANDOFF.md");

const TESTNET_CHAIN_ID = 97n;
const QA_WALLET = getAddress("0x3a909988E4d5c9C2326A7a0596714482AB25eE0A");
const REAL_TESTNET_HEART = getAddress("0xa74F84942ADe7F668009BC4cB9E73C05ed5A3296");
const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const DESCRIPTION_HASH = id("BTC / USD");
const PHASE_ONE = 1n << 64n;
const BET_AMOUNT = parseUnits("1", 18);
const SURVIVAL_GATE = parseUnits("1888", 18);
const GAME_CONFIG = {
  betDuration: 15,
  resolveDelay: 5,
  payoutBps: 10_000,
  minBet: BET_AMOUNT,
  maxBet: parseUnits("5", 18),
  roundRewardCap: parseUnits("10", 18),
  economicMode: 1,
};
const ORACLE_CONFIG = {
  descriptionHash: DESCRIPTION_HASH,
  decimals: 8,
  startMaxAge: 600,
  maxEndDelay: 15,
};

const resultNames = ["UNRESOLVED", "UP", "DOWN", "DRAW", "CANCELLED"];
const statusNames = ["NONE", "CREATED", "OPEN", "CLOSED", "RESOLVED", "CANCELLED"];
const directionNames = ["NONE", "UP", "DOWN"];

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function artifact(name) {
  const artifactPath = path.join(root, "artifacts", `${name}.json`);
  if (!fs.existsSync(artifactPath)) throw new Error(`Missing ${artifactPath}; run npm run compile first`);
  return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function asAddressFromSlot(value) {
  return getAddress(`0x${value.slice(-40)}`);
}

function serializeBet(bet) {
  return {
    direction: directionNames[Number(bet.direction)],
    amount: bet.amount.toString(),
    placedAt: Number(bet.placedAt),
    placedBlock: Number(bet.placedBlock),
    exists: bet.exists,
    claimed: bet.claimed,
  };
}

function sameImmutablePosition(left, right) {
  return left.direction === right.direction
    && left.amount === right.amount
    && left.placedAt === right.placedAt
    && left.placedBlock === right.placedBlock
    && left.exists === right.exists;
}

async function waitForTimestamp(provider, timestamp, label) {
  let lastNotice = 0;
  while (true) {
    const block = await provider.getBlock("latest");
    if (block.timestamp >= timestamp) return block;
    const now = Date.now();
    if (now - lastNotice > 10_000) {
      console.log(`${label}: waiting for testnet timestamp ${timestamp}; latest=${block.timestamp}`);
      lastNotice = now;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
}

async function main() {
  const provider = new JsonRpcProvider(requiredEnv("BSC_TESTNET_RPC_URL"));
  const wallet = new Wallet(requiredEnv("BSC_TESTNET_PRIVATE_KEY"), provider);
  const signer = new NonceManager(wallet);
  const signerAddress = getAddress(wallet.address);
  const network = await provider.getNetwork();
  assert(network.chainId === TESTNET_CHAIN_ID, `Refusing chainId ${network.chainId}; expected 97`);
  assert(signerAddress === QA_WALLET, `Unexpected public signer ${signerAddress}`);

  const transactions = [];
  const startingBalance = await provider.getBalance(signerAddress);
  const startingBlock = await provider.getBlockNumber();

  async function recordReceipt(label, receipt, expectedStatus, contractAddress = null) {
    const block = await provider.getBlock(receipt.blockNumber);
    transactions.push({
      label,
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: block.timestamp,
      gasUsed: receipt.gasUsed.toString(),
      gasPriceWei: receipt.gasPrice.toString(),
      status: expectedStatus,
      contractAddress,
    });
  }

  async function confirm(label, transactionPromise) {
    const transaction = await transactionPromise;
    console.log(`${label}: submitted ${transaction.hash}`);
    const receipt = await transaction.wait();
    assert(receipt.status === 1, `${label} reverted: ${transaction.hash}`);
    await recordReceipt(label, receipt, "PASS");
    return receipt;
  }

  async function confirmRevert(label, send) {
    const transaction = await send();
    console.log(`${label}: submitted expected-revert ${transaction.hash}`);
    let receipt;
    try {
      receipt = await transaction.wait();
    } catch (error) {
      receipt = error.receipt ?? await provider.getTransactionReceipt(transaction.hash);
    }
    assert(receipt && receipt.status === 0, `${label} did not produce an on-chain revert`);
    await recordReceipt(label, receipt, "EXPECTED_REVERT");
    return receipt;
  }

  async function deploy(name, deploySigner, args = []) {
    const compiled = artifact(name);
    const factory = new ContractFactory(compiled.abi, compiled.bytecode, deploySigner);
    const contract = await factory.deploy(...args);
    const receipt = await contract.deploymentTransaction().wait();
    assert(receipt.status === 1, `Deploy ${name} reverted`);
    const address = await contract.getAddress();
    await recordReceipt(`Deploy ${name}`, receipt, "PASS", address);
    console.log(`Deploy ${name}: ${address}`);
    return contract;
  }

  const heartArtifact = artifact("KGEN_TempleHeart_Upgradeable");
  const heart = new Contract(REAL_TESTNET_HEART, heartArtifact.abi, signer);
  const heartCode = await provider.getCode(REAL_TESTNET_HEART);
  assert(heartCode !== "0x", "Testnet TempleHeart has no code");
  assert(await heart.version() === "3.4.0", "Testnet TempleHeart version mismatch");
  assert(await heart.isHeartGameOperational(), "Testnet TempleHeart is not operational");
  assert(await heart.hasRole(ZeroHash, signerAddress), "QA signer lacks Heart DEFAULT_ADMIN_ROLE");
  const previousHeartGame = getAddress(await heart.fortuneGame());

  const adversaryWallet = Wallet.createRandom().connect(provider);
  const loserWallet = Wallet.createRandom().connect(provider);
  const adversary = new NonceManager(adversaryWallet);
  const loser = new NonceManager(loserWallet);
  await confirm("Fund unauthorized/late-bet test wallet", signer.sendTransaction({
    to: adversaryWallet.address,
    value: parseEther("0.001"),
  }));
  await confirm("Fund immutable-losing-position test wallet", signer.sendTransaction({
    to: loserWallet.address,
    value: parseEther("0.001"),
  }));

  const oracle = await deploy("MockAggregatorV3", signer, [8, "BTC / USD"]);
  let oracleAggregatorRound = 2n;
  let oracleRoundId = PHASE_ONE + oracleAggregatorRound;
  let currentPrice = 5_000_000_000_000n;
  const initialBlock = await provider.getBlock("latest");
  await confirm("TEST_ONLY_ORACLE set initial start snapshot", oracle.setRound(
    oracleRoundId,
    currentPrice,
    initialBlock.timestamp,
    oracleRoundId,
  ));

  const implementation = await deploy("KGEN_FortuneGame_Upgradeable", signer);
  const implementationAddress = getAddress(await implementation.getAddress());
  const oracleAddress = getAddress(await oracle.getAddress());
  const gameArtifact = artifact("KGEN_FortuneGame_Upgradeable");
  const gameInterface = new Interface(gameArtifact.abi);
  const initData = gameInterface.encodeFunctionData("initialize", [
    signerAddress,
    signerAddress,
    signerAddress,
    REAL_TESTNET_HEART,
    [
      oracleAddress,
      ORACLE_CONFIG.descriptionHash,
      ORACLE_CONFIG.decimals,
      ORACLE_CONFIG.startMaxAge,
      ORACLE_CONFIG.maxEndDelay,
    ],
    [
      GAME_CONFIG.betDuration,
      GAME_CONFIG.resolveDelay,
      GAME_CONFIG.payoutBps,
      GAME_CONFIG.minBet,
      GAME_CONFIG.maxBet,
      GAME_CONFIG.roundRewardCap,
      GAME_CONFIG.economicMode,
    ],
  ]);
  const proxy = await deploy("ERC1967Proxy", signer, [implementationAddress, initData]);
  const proxyAddress = getAddress(await proxy.getAddress());
  const game = new Contract(proxyAddress, gameArtifact.abi, signer);
  const gameAsAdversary = game.connect(adversary);
  const gameAsLoser = game.connect(loser);

  await confirmRevert("Implementation initializer locked", () => implementation.initialize(
    signerAddress,
    signerAddress,
    signerAddress,
    REAL_TESTNET_HEART,
    [oracleAddress, DESCRIPTION_HASH, 8, 600, 15],
    [15, 5, 10_000, BET_AMOUNT, parseUnits("5", 18), parseUnits("10", 18), 1],
    { gasLimit: 2_000_000 },
  ));

  assert(await game.version() === "1.0.0", "Proxy version mismatch");
  assert(getAddress(await game.templeHeart()) === REAL_TESTNET_HEART, "Proxy Heart mismatch");
  const liveOracleConfig = await game.oracleConfig();
  const liveGameConfig = await game.gameConfig();
  assert(getAddress(liveOracleConfig.oracle) === oracleAddress, "Proxy Oracle mismatch");
  assert(Number(liveGameConfig.economicMode) === 1, "EconomicMode is not CREDIT_ONLY");
  assert(await game.hasRole(ZeroHash, signerAddress), "Proxy admin role mismatch");
  assert(await game.hasRole(id("OPERATOR_ROLE"), signerAddress), "Proxy operator role mismatch");
  assert(await game.hasRole(id("UPGRADER_ROLE"), signerAddress), "Proxy upgrader role mismatch");
  assert(asAddressFromSlot(await provider.getStorage(proxyAddress, IMPLEMENTATION_SLOT)) === implementationAddress,
    "ERC1967 implementation slot mismatch");

  await confirmRevert("Unauthorized UUPS upgrade", () => gameAsAdversary.upgradeToAndCall(
    implementationAddress,
    "0x",
    { gasLimit: 500_000 },
  ));
  await confirm("Authorized UUPS authorization-path rehearsal", game.upgradeToAndCall(
    implementationAddress,
    "0x",
    { gasLimit: 500_000 },
  ));
  assert(asAddressFromSlot(await provider.getStorage(proxyAddress, IMPLEMENTATION_SLOT)) === implementationAddress,
    "Authorized UUPS rehearsal changed the expected implementation");

  const heartBindingReceipt = await confirm(
    "Bind REAL_TEMPLEHEART_TESTNET FortuneGame",
    heart.setFortuneGame(proxyAddress),
  );
  assert(getAddress(await heart.fortuneGame()) === proxyAddress, "Heart binding mismatch");

  const rounds = [];

  async function createRound(label, bets) {
    await confirm(`${label} create`, game.createRound());
    const roundId = await game.currentRoundId();
    const opened = await game.roundInfo(roundId);
    assert(statusNames[Number(opened.status)] === "OPEN", `${label} did not open`);
    for (const bet of bets) {
      await confirm(`${label} placeBet ${bet.name} ${directionNames[bet.direction]}`,
        bet.contract.placeBet(roundId, bet.direction, BET_AMOUNT));
    }
    const immutableBets = {};
    for (const bet of bets) {
      const position = serializeBet(await game.betInfo(roundId, bet.address));
      assert(position.exists, `${label} ${bet.name} position missing after receipt`);
      immutableBets[bet.name] = position;
    }
    await waitForTimestamp(provider, Number(opened.betCloseAt), `${label} close boundary`);
    await confirm(`${label} close`, game.closeRound(roundId));
    return { roundId, opened, bets, immutableBets };
  }

  async function publishEndSnapshot(label, expectedPrice, resolveAt) {
    await waitForTimestamp(provider, Number(resolveAt), `${label} resolve boundary`);
    oracleAggregatorRound += 1n;
    oracleRoundId = PHASE_ONE + oracleAggregatorRound;
    const block = await provider.getBlock("latest");
    await confirm(`${label} TEST_ONLY_ORACLE end snapshot`, oracle.setRound(
      oracleRoundId,
      expectedPrice,
      block.timestamp,
      oracleRoundId,
    ));
    currentPrice = expectedPrice;
    return { id: oracleRoundId, updatedAt: block.timestamp };
  }

  async function resolvedEvidence(context, expectedResult, endSnapshot) {
    const round = await game.roundInfo(context.roundId);
    assert(resultNames[Number(round.result)] === expectedResult, `Unexpected ${context.roundId} result`);
    assert(Number(round.endOracleUpdatedAt) > Number(round.betCloseAt), "End snapshot is not after bet close");
    assert(Number(round.endOracleUpdatedAt) >= Number(round.resolveAt), "End snapshot is before resolveAt");
    assert(round.endOracleRoundId === endSnapshot.id, "Deterministic end round mismatch");
    const immutableBetsAfter = {};
    for (const bet of context.bets) {
      const position = serializeBet(await game.betInfo(context.roundId, bet.address));
      assert(sameImmutablePosition(context.immutableBets[bet.name], position), `${bet.name} position mutated`);
      immutableBetsAfter[bet.name] = position;
    }
    const evidence = {
      roundId: context.roundId.toString(),
      status: statusNames[Number(round.status)],
      result: resultNames[Number(round.result)],
      betOpenAt: Number(round.betOpenAt),
      betCloseAt: Number(round.betCloseAt),
      resolveAt: Number(round.resolveAt),
      resolvedAt: Number(round.resolvedAt),
      startPrice: round.startPrice.toString(),
      endPrice: round.endPrice.toString(),
      startOracleRoundId: round.startOracleRoundId.toString(),
      endOracleRoundId: round.endOracleRoundId.toString(),
      startOracleUpdatedAt: Number(round.startOracleUpdatedAt),
      endOracleUpdatedAt: Number(round.endOracleUpdatedAt),
      betsBeforeResult: context.immutableBets,
      betsAfterResult: immutableBetsAfter,
    };
    rounds.push(evidence);
    return evidence;
  }

  const roundUp = await createRound("Round A UP WIN", [
    { name: "QA_WINNER", contract: game, address: signerAddress, direction: 1 },
    { name: "DOWN_LOSER", contract: gameAsLoser, address: loserWallet.address, direction: 2 },
  ]);
  await waitForTimestamp(provider, Number(roundUp.opened.resolveAt), "Round A invalid historical resolve boundary");
  await confirmRevert("Round A reject pre-result historical Oracle round", () => game.resolveRound(
    roundUp.roundId,
    roundUp.opened.startOracleRoundId,
    { gasLimit: 700_000 },
  ));
  const upEnd = await publishEndSnapshot("Round A", currentPrice + 100_000_000_000n, roundUp.opened.resolveAt);
  await confirmRevert("Known-result late bet after end snapshot", () => gameAsAdversary.placeBet(
    roundUp.roundId,
    1,
    BET_AMOUNT,
    { gasLimit: 300_000 },
  ));
  await confirm("Round A resolve deterministic UP", game.resolveRound(roundUp.roundId, upEnd.id));
  const downLoserBeforeCancel = serializeBet(await game.betInfo(roundUp.roundId, loserWallet.address));
  const cancelBetData = new Interface(["function cancelBet(uint256 roundId)"]).encodeFunctionData("cancelBet", [roundUp.roundId]);
  await confirmRevert("Round A losing DOWN player cannot cancel", () => loser.sendTransaction({
    to: proxyAddress,
    data: cancelBetData,
    gasLimit: 200_000,
  }));
  const downLoserAfterCancel = serializeBet(await game.betInfo(roundUp.roundId, loserWallet.address));
  assert(sameImmutablePosition(downLoserBeforeCancel, downLoserAfterCancel), "Losing DOWN bet changed after cancel attempt");
  await resolvedEvidence(roundUp, "UP", upEnd);
  await confirm("Round A REAL_TEMPLEHEART_TESTNET winner claim", game.claim(roundUp.roundId));
  await confirmRevert("Round A double claim", () => game.claim(roundUp.roundId, { gasLimit: 500_000 }));

  const roundDown = await createRound("Round B DOWN WIN", [
    { name: "QA_WINNER", contract: game, address: signerAddress, direction: 2 },
    { name: "UP_LOSER", contract: gameAsLoser, address: loserWallet.address, direction: 1 },
  ]);
  const downEnd = await publishEndSnapshot("Round B", currentPrice - 100_000_000_000n, roundDown.opened.resolveAt);
  await confirm("Round B resolve deterministic DOWN", game.resolveRound(roundDown.roundId, downEnd.id));
  const upLoserBeforeCancel = serializeBet(await game.betInfo(roundDown.roundId, loserWallet.address));
  const reverseCancelData = new Interface(["function cancelBet(uint256 roundId)"]).encodeFunctionData("cancelBet", [roundDown.roundId]);
  await confirmRevert("Round B losing UP player cannot cancel", () => loser.sendTransaction({
    to: proxyAddress,
    data: reverseCancelData,
    gasLimit: 200_000,
  }));
  const deleteBetData = new Interface(["function deleteBet(uint256 roundId,address player)"])
    .encodeFunctionData("deleteBet", [roundDown.roundId, loserWallet.address]);
  await confirmRevert("Round B operator cannot delete losing position", () => signer.sendTransaction({
    to: proxyAddress,
    data: deleteBetData,
    gasLimit: 200_000,
  }));
  const upLoserAfterCancel = serializeBet(await game.betInfo(roundDown.roundId, loserWallet.address));
  assert(sameImmutablePosition(upLoserBeforeCancel, upLoserAfterCancel), "Losing UP bet changed after cancel/delete attempts");
  await resolvedEvidence(roundDown, "DOWN", downEnd);
  await confirm("Round B REAL_TEMPLEHEART_TESTNET winner claim", game.claim(roundDown.roundId));
  await confirmRevert("Round B double claim", () => game.claim(roundDown.roundId, { gasLimit: 500_000 }));

  const roundDraw = await createRound("Round C DRAW", [
    { name: "QA_DRAW", contract: game, address: signerAddress, direction: 1 },
  ]);
  const drawEnd = await publishEndSnapshot("Round C", currentPrice, roundDraw.opened.resolveAt);
  await confirm("Round C resolve deterministic DRAW", game.resolveRound(roundDraw.roundId, drawEnd.id));
  await resolvedEvidence(roundDraw, "DRAW", drawEnd);
  assert(!(await game.canClaim(roundDraw.roundId, signerAddress)), "DRAW unexpectedly claimable");

  const roundCancelled = await createRound("Round D CANCELLED ORACLE FAILURE", [
    { name: "QA_CANCELLED", contract: game, address: signerAddress, direction: 1 },
    { name: "OTHER_CANCELLED", contract: gameAsLoser, address: loserWallet.address, direction: 2 },
  ]);
  const cancellationAt = Number(roundCancelled.opened.resolveAt) + ORACLE_CONFIG.maxEndDelay + 1;
  await waitForTimestamp(provider, cancellationAt, "Round D objective cancellation proof window");
  await confirm("Round D TEST_ONLY_ORACLE unavailable", oracle.setUnavailable(true));
  await confirm("Round D cancel entire round for unavailable Oracle", game.cancelRoundForUnavailableOracle(roundCancelled.roundId));
  await confirm("Round D TEST_ONLY_ORACLE restored", oracle.setUnavailable(false));
  const cancelledInfo = await game.roundInfo(roundCancelled.roundId);
  assert(statusNames[Number(cancelledInfo.status)] === "CANCELLED", "Round D status mismatch");
  assert(resultNames[Number(cancelledInfo.result)] === "CANCELLED", "Round D result mismatch");
  for (const bet of roundCancelled.bets) {
    const after = serializeBet(await game.betInfo(roundCancelled.roundId, bet.address));
    assert(sameImmutablePosition(roundCancelled.immutableBets[bet.name], after), "Cancelled-round bet was deleted");
  }
  rounds.push({
    roundId: roundCancelled.roundId.toString(),
    status: "CANCELLED",
    result: "CANCELLED",
    cancelReason: "ORACLE_UNAVAILABLE",
    betOpenAt: Number(cancelledInfo.betOpenAt),
    betCloseAt: Number(cancelledInfo.betCloseAt),
    resolveAt: Number(cancelledInfo.resolveAt),
    resolvedAt: Number(cancelledInfo.resolvedAt),
    startOracleRoundId: cancelledInfo.startOracleRoundId.toString(),
    betsBeforeCancellation: roundCancelled.immutableBets,
  });

  const mockHeart = await deploy("TestnetMockTempleHeart1888", signer, [signerAddress, SURVIVAL_GATE]);
  const mockHeartAddress = getAddress(await mockHeart.getAddress());
  await confirm("TEST_MOCK_HEART bind FortuneGame", mockHeart.setFortuneGame(proxyAddress));
  await confirm("Set future-round Heart to TEST_MOCK_HEART", game.setTempleHeart(mockHeartAddress));
  const retryRound = await createRound("Round E HEART 1888 RETRY", [
    { name: "QA_RETRY_WINNER", contract: game, address: signerAddress, direction: 1 },
  ]);
  await confirm("Restore future-round Heart to REAL_TEMPLEHEART_TESTNET", game.setTempleHeart(REAL_TESTNET_HEART));
  const retryEnd = await publishEndSnapshot("Round E", currentPrice + 100_000_000_000n, retryRound.opened.resolveAt);
  await confirm("Round E resolve deterministic UP", game.resolveRound(retryRound.roundId, retryEnd.id));
  await resolvedEvidence(retryRound, "UP", retryEnd);
  await confirmRevert("Round E TEST_MOCK_HEART 1888 gate claim rejection", () => game.claim(
    retryRound.roundId,
    { gasLimit: 500_000 },
  ));
  const entitlementAfterFailure = serializeBet(await game.betInfo(retryRound.roundId, signerAddress));
  assert(entitlementAfterFailure.exists && !entitlementAfterFailure.claimed, "Entitlement lost after Heart gate rejection");
  assert(await game.previewPayout(retryRound.roundId, signerAddress) === BET_AMOUNT, "Entitlement payout changed");
  await confirm("Refill TEST_MOCK_HEART above 1888 gate", mockHeart.refill(BET_AMOUNT));
  await confirm("Round E retry claim after TEST_MOCK_HEART refill", game.claim(retryRound.roundId));
  const entitlementAfterRetry = serializeBet(await game.betInfo(retryRound.roundId, signerAddress));
  assert(entitlementAfterRetry.claimed, "Retry claim did not mark entitlement claimed");
  await confirmRevert("Round E second claim after retry", () => game.claim(retryRound.roundId, { gasLimit: 500_000 }));

  assert(getAddress(await game.templeHeart()) === REAL_TESTNET_HEART, "Final future-round Heart was not restored");
  assert(getAddress(await heart.fortuneGame()) === proxyAddress, "Final real Heart binding mismatch");
  assert(await game.version() === "1.0.0", "Final FortuneGame version mismatch");
  assert(Number((await game.gameConfig()).economicMode) === 1, "Final economic mode mismatch");

  const finalBalance = await provider.getBalance(signerAddress);
  const endingBlock = await provider.getBlockNumber();
  const totalGasUsed = transactions.reduce((total, entry) => total + BigInt(entry.gasUsed), 0n);
  const evidence = {
    schemaVersion: "1.0.0",
    status: "FORTUNE_GAME_V1_TESTNET_REHEARSAL_PASS",
    executionClass: "REAL_BSC_TESTNET",
    network: {
      name: "BSC Testnet",
      chainId: "97",
      explorer: "https://testnet.bscscan.com",
      startingBlock,
      endingBlock,
    },
    signer: {
      role: "KGEN_BSC_TESTNET_QA_WALLET",
      publicAddress: signerAddress,
      startingBalanceTBNB: formatEther(startingBalance),
      finalBalanceTBNB: formatEther(finalBalance),
    },
    contracts: {
      mockOracle: oracleAddress,
      mockOracleClass: "TEST_ONLY_ORACLE",
      fortuneGameImplementation: implementationAddress,
      fortuneGameProxy: proxyAddress,
      templeHeartTestnet: REAL_TESTNET_HEART,
      templeHeartClass: "REAL_TEMPLEHEART_TESTNET / TESTNET_REHEARSAL_ONLY",
      testMockHeart1888: mockHeartAddress,
      testMockHeartClass: "TEST_MOCK_HEART",
    },
    initialization: {
      version: "1.0.0",
      implementationInitializerLocked: "PASS",
      proxyInitialized: "PASS",
      heartAddress: REAL_TESTNET_HEART,
      oracleAddress,
      roles: {
        DEFAULT_ADMIN_ROLE: signerAddress,
        OPERATOR_ROLE: signerAddress,
        UPGRADER_ROLE: signerAddress,
      },
      economicMode: "CREDIT_ONLY / TEST",
    },
    heartBinding: {
      status: "PASS",
      previousFortuneGame: previousHeartGame,
      boundFortuneGame: proxyAddress,
      transactionHash: heartBindingReceipt.hash,
    },
    rounds,
    transactions,
    realChainSecurity: {
      TIME_ARROW_IMMUTABILITY_REAL_CHAIN: "PASS",
      KNOWN_RESULT_LATE_BET_REAL_CHAIN: "PASS",
      LOSING_BET_REMAINS_ONCHAIN: "PASS",
      ORACLE_FUTURE_ORDER_REAL_CHAIN: "PASS",
      DOUBLE_CLAIM_REAL_CHAIN: "PASS",
      HEART_1888_RETRY_REAL_CHAIN: "PASS (TEST_MOCK_HEART; normal claims use REAL_TEMPLEHEART_TESTNET)",
      UUPS_UNAUTHORIZED_UPGRADE_REAL_CHAIN: "PASS",
      UUPS_AUTHORIZED_PATH_REAL_CHAIN: "PASS",
    },
    gas: {
      totalGasUsed: totalGasUsed.toString(),
      transactionCount: transactions.length,
    },
    mainnetDeploy: "BLOCKED",
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(jsonEvidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  fs.writeFileSync(markdownEvidencePath, renderMarkdown(evidence));
  fs.writeFileSync(handoffPath, renderFrontendHandoff(evidence));
  console.log(`Evidence written: ${jsonEvidencePath}`);
  console.log(`Frontend handoff written: ${handoffPath}`);
  console.log(JSON.stringify({
    status: evidence.status,
    publicSigner: signerAddress,
    balanceTBNB: evidence.signer.finalBalanceTBNB,
    mockOracle: oracleAddress,
    fortuneGameImplementation: implementationAddress,
    fortuneGameProxy: proxyAddress,
    templeHeart: REAL_TESTNET_HEART,
    heartBinding: "PASS",
    totalGasUsed: evidence.gas.totalGasUsed,
  }, null, 2));
  await provider.destroy();
}

function renderMarkdown(evidence) {
  const transactionRows = evidence.transactions.map((transaction) =>
    `| ${transaction.label} | \`${transaction.hash}\` | ${transaction.blockNumber} | ${transaction.timestamp} | ${transaction.gasUsed} | ${transaction.status} |`
  ).join("\n");
  const roundRows = evidence.rounds.map((round) =>
    `| ${round.roundId} | ${round.status} | ${round.result} | ${round.betCloseAt} | ${round.resolveAt} | ${round.endOracleUpdatedAt ?? "N/A"} |`
  ).join("\n");
  return `# BSC Testnet FortuneGame V1 Rehearsal

Status: **${evidence.status}**

Execution class: **REAL_BSC_TESTNET**

Chain ID: **97**

Public signer: \`${evidence.signer.publicAddress}\`

Final balance: **${evidence.signer.finalBalanceTBNB} tBNB**

No private key, mnemonic, or authenticated RPC URL is recorded in this evidence.

## Contracts

| Component | Address | Classification |
|---|---|---|
| Deterministic MockAggregatorV3 | \`${evidence.contracts.mockOracle}\` | TEST_ONLY_ORACLE |
| FortuneGame V1 implementation | \`${evidence.contracts.fortuneGameImplementation}\` | TESTNET_REHEARSAL_ONLY |
| FortuneGame V1 ERC1967/UUPS proxy | \`${evidence.contracts.fortuneGameProxy}\` | TESTNET_REHEARSAL_ONLY |
| TempleHeart V3.4 proxy | \`${evidence.contracts.templeHeartTestnet}\` | REAL_TEMPLEHEART_TESTNET |
| 1888 retry fixture | \`${evidence.contracts.testMockHeart1888}\` | TEST_MOCK_HEART |

Heart binding: **${evidence.heartBinding.status}**

Binding transaction: \`${evidence.heartBinding.transactionHash}\`

## Round results

| Round | Status | Result | betCloseAt | resolveAt | endOracleUpdatedAt |
|---:|---|---|---:|---:|---:|
${roundRows}

## Real-chain gates

- TIME_ARROW_IMMUTABILITY_REAL_CHAIN = ${evidence.realChainSecurity.TIME_ARROW_IMMUTABILITY_REAL_CHAIN}
- KNOWN_RESULT_LATE_BET_REAL_CHAIN = ${evidence.realChainSecurity.KNOWN_RESULT_LATE_BET_REAL_CHAIN}
- LOSING_BET_REMAINS_ONCHAIN = ${evidence.realChainSecurity.LOSING_BET_REMAINS_ONCHAIN}
- ORACLE_FUTURE_ORDER_REAL_CHAIN = ${evidence.realChainSecurity.ORACLE_FUTURE_ORDER_REAL_CHAIN}
- DOUBLE_CLAIM_REAL_CHAIN = ${evidence.realChainSecurity.DOUBLE_CLAIM_REAL_CHAIN}
- HEART_1888_RETRY_REAL_CHAIN = ${evidence.realChainSecurity.HEART_1888_RETRY_REAL_CHAIN}
- UUPS_UNAUTHORIZED_UPGRADE_REAL_CHAIN = ${evidence.realChainSecurity.UUPS_UNAUTHORIZED_UPGRADE_REAL_CHAIN}
- UUPS_AUTHORIZED_PATH_REAL_CHAIN = ${evidence.realChainSecurity.UUPS_AUTHORIZED_PATH_REAL_CHAIN}

## Transactions

| Operation | Transaction | Block | Timestamp | Gas | Status |
|---|---|---:|---:|---:|---|
${transactionRows}

Total gas used: **${evidence.gas.totalGasUsed}**

## Safety boundary

\`MAINNET_DEPLOY = BLOCKED\`
`;
}

function renderFrontendHandoff(evidence) {
  return `# FORTUNE_GAME_FRONTEND_HANDOFF

Status: **TESTNET READY — HUMAN REVIEW REQUIRED**

- TESTNET_FORTUNE_GAME_PROXY: \`${evidence.contracts.fortuneGameProxy}\`
- TESTNET_ORACLE: \`${evidence.contracts.mockOracle}\` (**TEST_ONLY_ORACLE**)
- ABI: \`KGEN/abi/KGEN_FortuneGame_Upgradeable.json\` (` + "`abi`" + ` field; compiler-generated)
- version: \`1.0.0\`
- network: BSC Testnet, chainId \`97\`
- economy: \`CREDIT_ONLY / TEST\`

## Required views

\`currentRoundId()\`, \`roundInfo(uint256)\`, \`betInfo(uint256,address)\`,
\`canBet(uint256,address)\`, \`canResolve(uint256)\`, \`canClaim(uint256,address)\`,
\`previewPayout(uint256,address)\`, \`secondsUntilClose(uint256)\`,
\`secondsUntilResolve(uint256)\`, \`version()\`.

## Enums

- \`Direction\`: \`NONE=0\`, \`UP=1\`, \`DOWN=2\`
- \`RoundStatus\`: \`NONE=0\`, \`CREATED=1\`, \`OPEN=2\`, \`CLOSED=3\`, \`RESOLVED=4\`, \`CANCELLED=5\`
- \`RoundResult\`: \`UNRESOLVED=0\`, \`UP=1\`, \`DOWN=2\`, \`DRAW=3\`, \`CANCELLED=4\`
- \`EconomicMode\`: \`UNSET=0\`, \`CREDIT_ONLY=1\`

## Transactions

- \`placeBet(uint256 roundId, Direction direction, uint128 amount)\`
- \`claim(uint256 roundId)\`

The UI must display **BET CONFIRMED** only after a successful transaction receipt.
This address and Oracle are **TESTNET_REHEARSAL_ONLY**. \`MAINNET_DEPLOY = BLOCKED\`.
`;
}

main().catch((error) => {
  console.error(`FORTUNE_GAME_V1_TESTNET_REHEARSAL_FAIL: ${error.message}`);
  process.exitCode = 1;
});
